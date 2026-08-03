"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import type { SupervisedStudent } from "@/hooks/guru/useSupervisedStudents";

function startOfDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function parseRecordDate(row: Record<string, unknown>): number {
  const raw = row.date ?? row.createdAt ?? row.timestamp ?? row.submittedAt ?? row.recordedAt;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 1e11) return n;
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function matchStudent(
  row: Record<string, unknown>,
  identitySet: Map<string, SupervisedStudent>
): SupervisedStudent | undefined {
  const keys = [row.studentId, row.nisn, row.studentNisn, row.username, row.reporterId]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  for (const key of keys) {
    const hit = identitySet.get(key);
    if (hit) return hit;
  }
  return undefined;
}

function buildIdentityMap(students: SupervisedStudent[]) {
  const map = new Map<string, SupervisedStudent>();
  students.forEach((student) => {
    student.identities.forEach((id) => map.set(id.toLowerCase(), student));
  });
  return map;
}

export type ClassDayRow = {
  studentId: string;
  name: string;
  nisn: string;
  status: string;
};

/** Today's status per supervised student for attendance / prayer paths. */
export function useClassDayStatus(
  schoolId: string | undefined,
  students: SupervisedStudent[],
  pathPrefix: "attendance_by_school" | "prayer_attendance_by_school"
) {
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);
  const identitySet = useMemo(() => buildIdentityMap(students), [students]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setStatusByStudent({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const dayStart = startOfDay();
    const dayEnd = endOfDay();
    const pathRef = ref(rtdb, `${pathPrefix}/${canonicalSchoolId}`);
    const unsub = onValue(
      pathRef,
      (snapshot) => {
        const next: Record<string, string> = {};
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const ms = parseRecordDate(row);
            if (ms < dayStart || ms > dayEnd) return;
            const student = matchStudent(row, identitySet);
            if (!student) return;
            const status = String(row.status || "Tercatat").trim() || "Tercatat";
            next[student.id] = status;
          });
        }
        setStatusByStudent(next);
        setLoading(false);
      },
      () => {
        setStatusByStudent({});
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId, identitySet, pathPrefix]);

  const rows: ClassDayRow[] = useMemo(
    () =>
      students.map((student) => ({
        studentId: student.id,
        name: student.name,
        nisn: student.nisn,
        status: statusByStudent[student.id] || "Belum Presensi",
      })),
    [students, statusByStudent]
  );

  return { rows, loading };
}

export type ClassRecordRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  createdAt: number;
};

export function useLiteracyClassRecords(
  schoolId: string | undefined,
  students: SupervisedStudent[]
) {
  const [rows, setRows] = useState<ClassRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);
  const identitySet = useMemo(() => buildIdentityMap(students), [students]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const pathRef = ref(rtdb, `literacy_logs_by_school/${canonicalSchoolId}`);
    const unsub = onValue(
      pathRef,
      (snapshot) => {
        const next: ClassRecordRow[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const student = matchStudent(row, identitySet);
            if (!student) return;
            next.push({
              id: child.key || "",
              title: String(row.bookTitle || row.title || "Jurnal literasi"),
              subtitle: student.name,
              status: String(row.status || "pending"),
              createdAt: parseRecordDate(row) || Date.now(),
            });
          });
        }
        next.sort((a, b) => b.createdAt - a.createdAt);
        setRows(next.slice(0, 80));
        setLoading(false);
      },
      () => {
        setRows([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId, identitySet]);

  return { rows, loading };
}

export function useDisciplineClassRecords(
  schoolId: string | undefined,
  students: SupervisedStudent[]
) {
  const [rows, setRows] = useState<ClassRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);
  const identitySet = useMemo(() => buildIdentityMap(students), [students]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const pathRef = ref(rtdb, `discipline_records_by_school/${canonicalSchoolId}`);
    const unsub = onValue(
      pathRef,
      (snapshot) => {
        const next: ClassRecordRow[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const student = matchStudent(row, identitySet);
            if (!student) return;
            const points = row.points != null ? ` · ${row.points} poin` : "";
            next.push({
              id: child.key || "",
              title: String(row.ruleName || row.violation || row.description || "Pelanggaran"),
              subtitle: `${student.name}${points}`,
              status: String(row.status || "Aktif"),
              createdAt: parseRecordDate(row) || Date.now(),
            });
          });
        }
        next.sort((a, b) => b.createdAt - a.createdAt);
        setRows(next.slice(0, 80));
        setLoading(false);
      },
      () => {
        setRows([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId, identitySet]);

  return { rows, loading };
}
