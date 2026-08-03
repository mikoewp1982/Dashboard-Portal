"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  onValue,
  orderByChild,
  query,
  ref,
  equalTo,
  type Unsubscribe,
} from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import type { SupervisedStudent } from "./useSupervisedStudents";

export type TeacherInboxItem = {
  id: string;
  type: "literacy_incomplete" | "pet_dead" | "aduan_baru" | "literacy_pending";
  title: string;
  body: string;
  createdAt: number;
  studentName?: string;
  unread: boolean;
};

type Options = {
  schoolId?: string;
  students: SupervisedStudent[];
  rosterReady: boolean;
  enableBrowserNotify?: boolean;
};

const INCOMPLETE_COOLDOWN_MS = 15 * 60 * 1000;

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const registration = (window as Window & { __guruSwReg?: ServiceWorkerRegistration }).__guruSwReg;
    if (registration?.showNotification) {
      void registration.showNotification(title, {
        body,
        icon: "/tutorial/gas-siswa/logo-aplikasi.png",
        badge: "/tutorial/gas-siswa/logo-aplikasi.png",
        data: { url: "/guru/notifikasi" },
      });
      return;
    }
    new Notification(title, {
      body,
      icon: "/tutorial/gas-siswa/logo-aplikasi.png",
    });
  } catch {
    // ignore notification failures
  }
}

function isPetDead(row: Record<string, unknown>) {
  const status = String(row.status || "HAPPY");
  const health = Number(row.health ?? 100);
  const happiness = Number(row.happiness ?? 100);
  const energy = Number(row.energy ?? 100);
  const hunger = Number(row.hunger ?? 0);
  const manualReviveUntil = Number(row.manualReviveUntil ?? 0);
  const fullness = Math.max(0, Math.min(100, 100 - hunger));
  const lowestVital = Math.min(health, happiness, energy, fullness);
  const graceActive = manualReviveUntil > Date.now();
  return (
    !graceActive &&
    (status.toUpperCase() === "DEAD" || health <= 0 || lowestVital <= 0)
  );
}

export function useTeacherNotificationInbox({
  schoolId,
  students,
  rosterReady,
  enableBrowserNotify = true,
}: Options) {
  const [items, setItems] = useState<TeacherInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const knownAduan = useRef(new Set<string>());
  const knownDead = useRef(new Set<string>());
  const knownPending = useRef(new Set<string>());
  const firstAduan = useRef(true);
  const firstDead = useRef(true);
  const firstPending = useRef(true);
  const firstIncomplete = useRef(true);
  const lastIncompleteSignature = useRef<string | null>(null);
  const lastIncompleteNotifyAt = useRef(0);
  const activeTasksRef = useRef<Array<{ id: string; title: string }>>([]);
  const logsByStudentRef = useRef<Map<string, Set<string>>>(new Map());

  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);
  const identitySet = useMemo(() => {
    const set = new Set<string>();
    students.forEach((student) => {
      student.identities.forEach((id) => {
        set.add(id);
        set.add(id.toLowerCase());
      });
      set.add(student.name.trim().toLowerCase());
    });
    return set;
  }, [students]);

  const studentLabel = useCallback(
    (identity?: string) => {
      if (!identity) return "Siswa";
      const found = students.find((student) =>
        student.identities.some((id) => id.toLowerCase() === identity.toLowerCase())
      );
      return found?.name || identity;
    },
    [students]
  );

  const isSupervised = useCallback(
    (studentId?: string, studentName?: string) => {
      if (!rosterReady) return true;
      if (!students.length) return true;
      const id = String(studentId || "").trim();
      if (id && (identitySet.has(id) || identitySet.has(id.toLowerCase()))) return true;
      const name = String(studentName || "").trim().toLowerCase();
      return Boolean(name && identitySet.has(name));
    },
    [identitySet, rosterReady, students.length]
  );

  const pushItem = useCallback(
    (item: Omit<TeacherInboxItem, "unread">, notify: boolean) => {
      setItems((prev) => {
        if (prev.some((row) => row.id === item.id)) return prev;
        return [{ ...item, unread: true }, ...prev].slice(0, 100);
      });
      if (notify && enableBrowserNotify) {
        showBrowserNotification(item.title, item.body);
      }
    },
    [enableBrowserNotify]
  );

  const evaluateIncomplete = useCallback(() => {
    if (!rosterReady || !students.length) return;
    const tasks = activeTasksRef.current;
    if (!tasks.length) {
      firstIncomplete.current = false;
      lastIncompleteSignature.current = "";
      return;
    }

    const incompleteNames: string[] = [];
    const incompleteKeys = new Set<string>();

    students.forEach((student) => {
      const submitted = new Set<string>();
      student.identities.forEach((alias) => {
        logsByStudentRef.current.get(alias)?.forEach((taskId) => submitted.add(taskId));
        logsByStudentRef.current.get(alias.toLowerCase())?.forEach((taskId) => submitted.add(taskId));
      });
      const missing = tasks.some((task) => !submitted.has(task.id));
      if (missing) {
        incompleteKeys.add(student.id.toLowerCase() || student.name.toLowerCase());
        incompleteNames.push(student.name);
      }
    });

    const signature = `${tasks.map((task) => task.id).sort().join(",")}|${Array.from(incompleteKeys).sort().join(",")}`;
    if (firstIncomplete.current) {
      firstIncomplete.current = false;
      lastIncompleteSignature.current = signature;
      if (incompleteKeys.size > 0) {
        const preview = incompleteNames.slice(0, 3).join(", ");
        const more = incompleteNames.length - 3;
        pushItem(
          {
            id: `incomplete-digest-${signature}`,
            type: "literacy_incomplete",
            title: "Literasi Belum Dikerjakan",
            body: `${incompleteKeys.size} siswa belum mengerjakan literasi aktif (${more > 0 ? `${preview}, +${more} lainnya` : preview}).`,
            createdAt: Date.now(),
          },
          false
        );
      }
      return;
    }

    if (!incompleteKeys.size) {
      lastIncompleteSignature.current = signature;
      return;
    }

    const previousKeys = new Set(
      (lastIncompleteSignature.current?.split("|")[1] || "")
        .split(",")
        .filter(Boolean)
    );
    const newlyIncomplete = Array.from(incompleteKeys).filter((key) => !previousKeys.has(key));
    const tasksChanged =
      lastIncompleteSignature.current?.split("|")[0] !==
      tasks.map((task) => task.id).sort().join(",");
    const now = Date.now();
    const cooldownElapsed = now - lastIncompleteNotifyAt.current >= INCOMPLETE_COOLDOWN_MS;
    const shouldNotify =
      (newlyIncomplete.length > 0 || (tasksChanged && incompleteKeys.size > 0)) &&
      cooldownElapsed &&
      signature !== lastIncompleteSignature.current;

    if (shouldNotify) {
      const preview = incompleteNames.slice(0, 3).join(", ");
      const more = incompleteNames.length - 3;
      pushItem(
        {
          id: `incomplete-${now}`,
          type: "literacy_incomplete",
          title: "Literasi Belum Dikerjakan",
          body: `${incompleteKeys.size} siswa belum mengerjakan literasi aktif (${more > 0 ? `${preview}, +${more} lainnya` : preview}).`,
          createdAt: now,
        },
        true
      );
      lastIncompleteNotifyAt.current = now;
    }
    lastIncompleteSignature.current = signature;
  }, [pushItem, rosterReady, students]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubs: Unsubscribe[] = [];

    // Aduan (halo_spentgapa)
    const aduanRef = ref(rtdb, `gas/schools/${canonicalSchoolId}/halo_spentgapa_reports`);
    unsubs.push(
      onValue(aduanRef, (snapshot) => {
        if (!snapshot.exists()) {
          firstAduan.current = false;
          return;
        }
        let newCount = 0;
        snapshot.forEach((child) => {
          const id = child.key || "";
          const row = (child.val() || {}) as Record<string, unknown>;
          const status = String(row.status || "");
          const relevant =
            isSupervised(String(row.reporterId || "")) ||
            isSupervised(String(row.victimId || "")) ||
            isSupervised(String(row.perpetratorId || ""));
          const pending =
            /unhandled|belum ditangani|pending/i.test(status) || status === "";
          if (!relevant || !pending) return;
          if (!knownAduan.current.has(id)) {
            knownAduan.current.add(id);
            if (!firstAduan.current) {
              newCount += 1;
              pushItem(
                {
                  id: `aduan-${id}`,
                  type: "aduan_baru",
                  title: "Laporan Aduan Baru",
                  body: String(row.description || row.deskripsi || "Ada laporan aduan baru dari kelas Anda."),
                  createdAt: Number(row.createdAt || row.timestamp || Date.now()),
                },
                true
              );
            }
          }
        });
        if (firstAduan.current) {
          firstAduan.current = false;
          if (knownAduan.current.size > 0) {
            pushItem(
              {
                id: `aduan-digest-${Date.now()}`,
                type: "aduan_baru",
                title: "Laporan Aduan",
                body: `${knownAduan.current.size} laporan aduan menunggu penanganan di kelas Anda.`,
                createdAt: Date.now(),
              },
              false
            );
          }
        }
        void newCount;
        setLoading(false);
      })
    );

    // Pet mati
    const petsQuery = query(
      ref(rtdb, "virtual_pets"),
      orderByChild("schoolId"),
      equalTo(canonicalSchoolId)
    );
    unsubs.push(
      onValue(petsQuery, (snapshot) => {
        if (!rosterReady) return;
        const bestByStudent = new Map<string, Record<string, unknown>>();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const studentId = String(row.studentId || "").trim();
            if (!studentId || !isSupervised(studentId)) return;
            const existing = bestByStudent.get(studentId);
            const rank = Math.max(
              Number(row.updatedAt || 0),
              Number(row.lastQuestReset || 0),
              Number(row.lastPlayed || 0),
              Number(row.lastFed || 0)
            );
            const existingRank = existing
              ? Math.max(
                  Number(existing.updatedAt || 0),
                  Number(existing.lastQuestReset || 0),
                  Number(existing.lastPlayed || 0),
                  Number(existing.lastFed || 0)
                )
              : -1;
            if (!existing || rank >= existingRank) {
              bestByStudent.set(studentId, row);
            }
          });
        }

        const newlyDead: string[] = [];
        bestByStudent.forEach((row, studentId) => {
          const dead = isPetDead(row);
          const key = studentId.toLowerCase();
          if (firstDead.current) {
            if (dead) knownDead.current.add(key);
            return;
          }
          const wasDead = knownDead.current.has(key);
          if (dead && !wasDead) {
            knownDead.current.add(key);
            newlyDead.push(studentLabel(studentId));
          } else if (!dead) {
            knownDead.current.delete(key);
          }
        });

        if (firstDead.current) {
          firstDead.current = false;
          if (knownDead.current.size > 0) {
            pushItem(
              {
                id: `pet-digest-${Date.now()}`,
                type: "pet_dead",
                title: "Pet Siswa Mati",
                body: `${knownDead.current.size} pet siswa di kelas Anda berstatus mati.`,
                createdAt: Date.now(),
              },
              false
            );
          }
          return;
        }

        if (newlyDead.length > 0) {
          const preview = newlyDead.slice(0, 3).join(", ");
          const more = newlyDead.length - 3;
          pushItem(
            {
              id: `pet-${Date.now()}`,
              type: "pet_dead",
              title: newlyDead.length === 1 ? "Pet Siswa Mati" : "Pet Siswa Mati",
              body:
                newlyDead.length === 1
                  ? `Pet ${preview} telah mati.`
                  : `${newlyDead.length} pet siswa mati (${more > 0 ? `${preview}, +${more} lainnya` : preview}).`,
              createdAt: Date.now(),
              studentName: newlyDead[0],
            },
            true
          );
        }
      })
    );

    // Literasi pending penilaian
    unsubs.push(
      onValue(ref(rtdb, "literacy_logs"), (snapshot) => {
        if (!snapshot.exists()) {
          firstPending.current = false;
          return;
        }
        let newCount = 0;
        snapshot.forEach((child) => {
          const id = child.key || "";
          const row = (child.val() || {}) as Record<string, unknown>;
          const logSchool = normalizeSchoolId(row.schoolId);
          if (logSchool && logSchool !== canonicalSchoolId) return;
          const status = String(row.status || "");
          const studentId = String(row.studentId || row.nisn || "");
          const studentName = String(row.studentName || row.name || "");
          if (!status.toLowerCase().includes("pending")) return;
          if (!isSupervised(studentId, studentName)) return;
          if (!knownPending.current.has(id)) {
            knownPending.current.add(id);
            if (!firstPending.current) {
              newCount += 1;
              pushItem(
                {
                  id: `pending-${id}`,
                  type: "literacy_pending",
                  title: "Tugas Literasi Baru",
                  body: `${studentLabel(studentId) || studentName || "Siswa"} mengirim tugas literasi untuk dinilai.`,
                  createdAt: Number(row.timestamp || row.createdAt || Date.now()),
                  studentName: studentLabel(studentId) || studentName,
                },
                true
              );
            }
          }
        });
        if (firstPending.current) {
          firstPending.current = false;
          if (knownPending.current.size > 0) {
            pushItem(
              {
                id: `pending-digest-${Date.now()}`,
                type: "literacy_pending",
                title: "Tugas Literasi",
                body: `${knownPending.current.size} tugas literasi menunggu penilaian.`,
                createdAt: Date.now(),
              },
              false
            );
          }
        }
        void newCount;
      })
    );

    // Active tasks + logs for incomplete digest
    const tasksQuery = query(
      ref(rtdb, "literacy_tasks"),
      orderByChild("schoolId"),
      equalTo(canonicalSchoolId)
    );
    unsubs.push(
      onValue(tasksQuery, (snapshot) => {
        const tasks: Array<{ id: string; title: string }> = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            if (row.isActive === false) return;
            tasks.push({
              id: child.key || "",
              title: String(row.title || "Tugas Literasi"),
            });
          });
        }
        activeTasksRef.current = tasks.filter((task) => task.id);
        evaluateIncomplete();
      })
    );

    unsubs.push(
      onValue(ref(rtdb, `literacy_logs_by_school/${canonicalSchoolId}`), (snapshot) => {
        const map = new Map<string, Set<string>>();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const studentId = String(row.studentId || row.nisn || row.studentNisn || "").trim();
            const taskId = String(row.taskId || "").trim();
            if (!studentId || !taskId) return;
            if (!map.has(studentId)) map.set(studentId, new Set());
            map.get(studentId)!.add(taskId);
            const lower = studentId.toLowerCase();
            if (!map.has(lower)) map.set(lower, new Set());
            map.get(lower)!.add(taskId);
          });
        }
        logsByStudentRef.current = map;
        evaluateIncomplete();
      })
    );

    setLoading(false);
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [
    canonicalSchoolId,
    evaluateIncomplete,
    isSupervised,
    pushItem,
    rosterReady,
    studentLabel,
  ]);

  useEffect(() => {
    evaluateIncomplete();
  }, [evaluateIncomplete, students]);

  const unreadCount = items.filter((item) => item.unread).length;
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  }, []);
  const markRead = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  }, []);

  return { items, loading, unreadCount, markAllRead, markRead };
}
