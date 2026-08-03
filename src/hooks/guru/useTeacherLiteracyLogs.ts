"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { normalizeClassName } from "@/lib/guru/normalizeClass";
import type { SupervisedStudent } from "@/hooks/guru/useSupervisedStudents";

export type TeacherLiteracyLog = {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  schoolId: string;
  bookTitle: string;
  author: string;
  summary: string;
  status: string;
  grade: string | null;
  feedback: string | null;
  timestamp: number;
};

/** Matches TeacherLiteracyScreen.isReviewedStatus */
export function isLiteracyReviewed(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "GRADED" || s === "REVIEWED" || s === "CORRECTED" || s === "REJECTED";
}

function parseTimestamp(row: Record<string, unknown>): number {
  const raw = row.timestamp ?? row.submittedAt ?? row.createdAt ?? row.gradedAt;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 1e11) return n;
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function buildIdentityMap(students: SupervisedStudent[]) {
  const byId = new Map<string, SupervisedStudent>();
  const byName = new Set<string>();
  students.forEach((student) => {
    student.identities.forEach((id) => {
      byId.set(id.toLowerCase(), student);
    });
    const name = student.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (name) byName.add(name);
  });
  return { byId, byName };
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function useTeacherLiteracyLogs(
  schoolId: string | undefined,
  students: SupervisedStudent[],
  homeroomClass?: string
) {
  const [logs, setLogs] = useState<TeacherLiteracyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);
  const classScope = useMemo(() => normalizeClassName(homeroomClass), [homeroomClass]);
  const identityMaps = useMemo(() => buildIdentityMap(students), [students]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const pathRef = ref(rtdb, `literacy_logs_by_school/${canonicalSchoolId}`);
    const unsub = onValue(
      pathRef,
      (snapshot) => {
        const next: TeacherLiteracyLog[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const studentId = String(
              row.studentId || row.nisn || row.studentNisn || ""
            ).trim();
            const studentName = String(row.studentName || row.name || "Unknown").trim();
            const studentClass = String(
              row.studentClass || row.class || row.kelas || ""
            ).trim();

            const matched =
              (studentId && identityMaps.byId.get(studentId.toLowerCase())) ||
              undefined;
            const nameKey = normalizeName(studentName);
            const matchesName = nameKey && identityMaps.byName.has(nameKey);
            const matchesClass =
              classScope &&
              normalizeClassName(studentClass) === classScope;

            // Same filter spirit as TeacherLiteracyViewModel: roster id/name or class
            const inRoster =
              !students.length ||
              Boolean(matched) ||
              Boolean(matchesName) ||
              Boolean(matchesClass);

            if (!inRoster) return;

            next.push({
              id: child.key || "",
              studentId: matched?.id || studentId,
              studentName: matched?.name || studentName,
              studentClass: matched?.className || studentClass,
              schoolId: normalizeSchoolId(row.schoolId) || canonicalSchoolId,
              bookTitle: String(row.bookTitle || row.title || "").trim(),
              author: String(row.author || "").trim(),
              summary: String(row.summary || "").trim(),
              status: String(row.status || "PENDING").trim() || "PENDING",
              grade: row.grade != null ? String(row.grade) : null,
              feedback: row.feedback != null ? String(row.feedback) : null,
              timestamp: parseTimestamp(row),
            });
          });
        }
        next.sort((a, b) => b.timestamp - a.timestamp);
        setLogs(next);
        setLoading(false);
      },
      () => {
        setLogs([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId, classScope, identityMaps, students.length]);

  return { logs, loading };
}
