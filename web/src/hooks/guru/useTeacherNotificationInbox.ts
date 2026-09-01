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
import { isDeadByRule } from "@/lib/guru/petStatus";
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
const ANY_LITERACY_LOG_SENTINEL = "__any__";

function safeStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  try {
    const s = JSON.stringify(value);
    return s && s !== "{}" ? s : "";
  } catch {
    return "";
  }
}

function isReviewedLiteracyStatus(status: unknown): boolean {
  const s = safeStr(status).trim().toUpperCase();
  return s === "GRADED" || s === "REVIEWED" || s === "CORRECTED" || s === "REJECTED" || s === "DONE";
}

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
  return isDeadByRule({
    status: String(row.status || ""),
    health: Number(row.health ?? 100),
    happiness: Number(row.happiness ?? 100),
    energy: Number(row.energy ?? 100),
    hunger: Number(row.hunger ?? 0),
    manualReviveUntil: Number(row.manualReviveUntil ?? 0),
  });
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
        logsByStudentRef.current
          .get(alias.toLowerCase())
          ?.forEach((taskId) => submitted.add(taskId));
      });
      // Short-circuit: if the student has any log marked with the ANY-sentinel
      // (either a task-less legacy jurnal, or ANY log that was explicitly GRADED
      // by the teacher), treat them as having covered every active task.
      // This fixes the reported false-positive: "sudah dinilai semua tapi 32
      // siswa masih muncul 'Belum Dikerjakan'".
      const hasAnyReviewed = submitted.has(ANY_LITERACY_LOG_SENTINEL);
      if (hasAnyReviewed) return;
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
          try {
            const id = safeStr(child.key);
            if (!id) return;
            const row = (child.val() || {}) as Record<string, unknown>;
            const logSchool = normalizeSchoolId(row.schoolId);
            if (logSchool && logSchool !== canonicalSchoolId) return;
            const status = safeStr(row.status || "");
            const studentId = safeStr(row.studentId || row.nisn || "");
            const studentName = safeStr(row.studentName || row.name || "");
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
                    createdAt: Number(row.timestamp || row.createdAt || Date.now()) || Date.now(),
                    studentName: studentLabel(studentId) || studentName,
                  },
                  true
                );
              }
            }
          } catch (pendingErr) {
            // eslint-disable-next-line no-console
            console.warn(
              "[useTeacherNotificationInbox] skip invalid pending literacy_log:",
              child.key,
              pendingErr
            );
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
            try {
              const row = (child.val() || {}) as Record<string, unknown>;
              // STRICTER: only consider task truly active if `isActive === true`.
              // Records without isActive (undefined) or isActive = false are skipped.
              // This prevents leftover/legacy rows (created before isActive field existed)
              // from being incorrectly treated as active tasks.
              if (row.isActive !== true) return;
              const idKey = safeStr(child.key).trim();
              if (!idKey) return;
              tasks.push({
                id: idKey,
                title: safeStr(row.title) || "Tugas Literasi",
              });
            } catch (taskErr) {
              // eslint-disable-next-line no-console
              console.warn("[useTeacherNotificationInbox] skip invalid task:", child.key, taskErr);
            }
          });
        }
        activeTasksRef.current = tasks;
        evaluateIncomplete();
      })
    );

    unsubs.push(
      onValue(ref(rtdb, `literacy_logs_by_school/${canonicalSchoolId}`), (snapshot) => {
        const map = new Map<string, Set<string>>();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            try {
              const row = (child.val() || {}) as Record<string, unknown>;
              const studentId = safeStr(
                row.studentId ?? row.nisn ?? row.studentNisn ?? ""
              ).trim();
              if (!studentId) return;
              const taskId = safeStr(row.taskId).trim();
              const reviewed = isReviewedLiteracyStatus(row.status);

              const addStudentLog = (alias: string, submittedTaskId: string) => {
                if (!alias) return;
                if (!map.has(alias)) map.set(alias, new Set());
                map.get(alias)!.add(submittedTaskId);
              };

              if (taskId) {
                addStudentLog(studentId, taskId);
                addStudentLog(studentId.toLowerCase(), taskId);
              }

              // KEY FIXES for false-positive "Literasi Belum Dikerjakan" notifications:
              //
              // 1) If the log has NO taskId (legacy jurnal literasi / non-task-bound
              //    submission from APK), mark it with the ANY_LITERACY_LOG_SENTINEL
              //    sentinel. evaluateIncomplete() will treat the student as having
              //    covered all active tasks if any reviewed log with empty taskId exists.
              // 2) If the log has been GRADED/REVIEWED, we also award the ANY-sentinel
              //    regardless of its taskId. This way, once a teacher has explicitly
              //    graded ANY of a student's literacy submissions, the student no
              //    longer shows up as "belum mengerjakan" for every dangling task.
              //
              // Both combined solve the reported case: "sudah dinilai SEMUA tapi
              // masih muncul notifikasi 32 siswa belum mengerjakan".
              if (!taskId || reviewed) {
                addStudentLog(studentId, ANY_LITERACY_LOG_SENTINEL);
                addStudentLog(studentId.toLowerCase(), ANY_LITERACY_LOG_SENTINEL);
              }
            } catch (logErr) {
              // eslint-disable-next-line no-console
              console.warn(
                "[useTeacherNotificationInbox] skip invalid literacy_log row:",
                child.key,
                logErr
              );
            }
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
