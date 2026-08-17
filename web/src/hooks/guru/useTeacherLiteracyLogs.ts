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

function safeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      const s = JSON.stringify(value);
      if (s && s !== "{}") return s;
    } catch {
      /* ignore */
    }
  }
  return "";
}

function parseTimestamp(row: Record<string, unknown>): number {
  const candidates = [
    row.timestamp,
    row.submittedAt,
    row.createdAt,
    row.gradedAt,
    row.updatedAt,
    row.submitted_at,
    row.created_at,
  ];
  for (const raw of candidates) {
    if (raw == null) continue;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 1e9) return raw;
    if (typeof raw === "string" && raw.trim()) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 1e11) return n;
      const parsed = Date.parse(raw);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    if (typeof raw === "object") {
      // Sometimes Firebase RTDB returns ServerValue.TIMESTAMP placeholder; ignore.
      try {
        const asMs = (raw as { _seconds?: number; seconds?: number }) as Record<string, unknown>;
        if (typeof asMs._seconds === "number" && Number.isFinite(asMs._seconds) && asMs._seconds > 1e9) {
          return Math.round(asMs._seconds * 1000);
        }
        if (typeof asMs.seconds === "number" && Number.isFinite(asMs.seconds) && asMs.seconds > 1e9) {
          return Math.round(asMs.seconds * 1000);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return Date.now();
}

function buildIdentityMap(students: SupervisedStudent[]) {
  const byId = new Map<string, SupervisedStudent>();
  const byName = new Set<string>();
  if (!Array.isArray(students)) return { byId, byName };
  students.forEach((student) => {
    if (!student || typeof student !== "object") return;
    const idents = Array.isArray(student.identities) ? student.identities : [];
    idents.forEach((id) => {
      if (id == null) return;
      const key = safeString(id).trim().toLowerCase();
      if (key) byId.set(key, student);
    });
    const nameRaw = typeof student.name === "string" ? student.name : "";
    const name = nameRaw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (name) byName.add(name);
  });
  return { byId, byName };
}

function normalizeName(value: string): string {
  const v = safeString(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return v;
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
            try {
              const rawVal = child.val();
              const row: Record<string, unknown> =
                rawVal && typeof rawVal === "object"
                  ? (rawVal as Record<string, unknown>)
                  : {};

              const studentId = safeString(
                row.studentId ?? row.nisn ?? row.studentNisn ?? ""
              ).trim();
              const studentName =
                safeString(row.studentName ?? row.name ?? "").trim() || "Unknown";
              const studentClass = safeString(
                row.studentClass ?? row.class ?? row.kelas ?? ""
              ).trim();

              const matched =
                (studentId && identityMaps.byId.get(studentId.toLowerCase())) ||
                undefined;
              const nameKey = normalizeName(studentName);
              const matchesName = Boolean(nameKey && identityMaps.byName.has(nameKey));
              const matchesClass = Boolean(
                classScope &&
                  normalizeClassName(studentClass) === classScope
              );

              // Same filter spirit as TeacherLiteracyViewModel: roster id/name or class
              const inRoster =
                !students.length ||
                Boolean(matched) ||
                matchesName ||
                matchesClass;

              if (!inRoster) return;

              const idKey = safeString(child.key).trim();
              const bookTitle = safeString(row.bookTitle ?? row.title ?? "").trim();
              const author = safeString(row.author ?? "").trim();
              const summary = safeString(row.summary ?? "").trim();
              const statusRaw = safeString(row.status ?? "PENDING").trim() || "PENDING";
              const grade = row.grade != null ? safeString(row.grade).trim() : null;
              const feedback =
                row.feedback != null ? safeString(row.feedback).trim() : null;
              const schoolResolved =
                normalizeSchoolId(row.schoolId) || canonicalSchoolId;

              if (!idKey) return;

              next.push({
                id: idKey,
                studentId: matched?.id || studentId,
                studentName: matched?.name || studentName,
                studentClass: matched?.className || studentClass,
                schoolId: schoolResolved,
                bookTitle,
                author,
                summary,
                status: statusRaw,
                grade: grade || null,
                feedback: feedback || null,
                timestamp: parseTimestamp(row),
              });
            } catch (rowErr) {
              // eslint-disable-next-line no-console
              console.warn(
                "[useTeacherLiteracyLogs] skip invalid literacy row:",
                child.key,
                rowErr
              );
            }
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
