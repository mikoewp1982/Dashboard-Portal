"use client";

import { useEffect, useMemo, useState } from "react";
import { get, onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import type { SupervisedStudent } from "@/hooks/guru/useSupervisedStudents";
import {
  buildRatingKey,
  calculateSevenHabitsGrades,
  EMPTY_RUBRIC,
  extractDayName,
  extractMonth,
  extractWeekOfMonth,
  extractYear,
  parseHabits,
  parseRubric,
  type KaihHabitLog,
  type SevenHabitsGradingResult,
  type TeacherHabitRubric,
} from "@/lib/guru/kaihGrading";

export type TeacherKaihMonitoringRow = {
  student: SupervisedStudent;
  dayLog: KaihHabitLog | null;
  weekLogs: KaihHabitLog[];
  monthLogs: KaihHabitLog[];
};

export type TeacherKaihGradeRow = {
  student: SupervisedStudent;
  rubric: TeacherHabitRubric;
  isTeacherRated: boolean;
  grading: SevenHabitsGradingResult;
};

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
}

function studentIdentitySet(student: SupervisedStudent): Set<string> {
  return new Set(
    [student.id, student.nisn, ...student.identities]
      .map(normalizeId)
      .filter(Boolean)
  );
}

function matchesStudent(logStudentId: string, student: SupervisedStudent): boolean {
  const key = normalizeId(logStudentId);
  if (!key) return false;
  return studentIdentitySet(student).has(key);
}

function parseLogTree(
  snapshotVal: unknown,
  schoolId: string
): KaihHabitLog[] {
  if (!snapshotVal || typeof snapshotVal !== "object") return [];
  const logs: KaihHabitLog[] = [];
  const school = normalizeSchoolId(schoolId);

  Object.entries(snapshotVal as Record<string, unknown>).forEach(
    ([studentKey, datesNode]) => {
      if (!datesNode || typeof datesNode !== "object") return;
      Object.entries(datesNode as Record<string, unknown>).forEach(
        ([dateKey, raw]) => {
          const row = (raw || {}) as Record<string, unknown>;
          const date = String(row.date || dateKey || "").trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
          const studentId = String(row.studentId || studentKey || "").trim();
          if (!studentId) return;
          const rowSchool = normalizeSchoolId(row.schoolId);
          if (school && rowSchool && rowSchool !== school) return;

          logs.push({
            id: String(row.id || `${studentId}_${date}`),
            studentId,
            schoolId: rowSchool || school,
            date,
            habits: parseHabits(row),
            timestamp: Number(row.timestamp || 0) || 0,
          });
        }
      );
    }
  );

  return logs;
}

async function loadLegacyLogsForStudents(
  schoolId: string,
  students: SupervisedStudent[]
): Promise<KaihHabitLog[]> {
  const keys = new Set<string>();
  students.forEach((s) => {
    [s.id, s.nisn, ...s.identities].forEach((id) => {
      const key = id.trim();
      if (key) keys.add(key);
    });
  });

  const results = await Promise.all(
    Array.from(keys).map(async (identityKey) => {
      try {
        const snap = await get(ref(rtdb, `seven_habits_logs/${identityKey}`));
        if (!snap.exists()) return [] as KaihHabitLog[];
        return parseLogTree({ [identityKey]: snap.val() }, schoolId);
      } catch {
        return [] as KaihHabitLog[];
      }
    })
  );

  const map = new Map<string, KaihHabitLog>();
  results.flat().forEach((log) => {
    const key = `${normalizeId(log.studentId)}:${log.date}`;
    const prev = map.get(key);
    if (!prev || log.timestamp >= prev.timestamp) map.set(key, log);
  });
  return Array.from(map.values());
}

export function useTeacherKaih(
  schoolId: string | undefined,
  students: SupervisedStudent[],
  filters: { year: number; month: number; week: number; dayName: string }
) {
  const [logs, setLogs] = useState<KaihHabitLog[]>([]);
  const [ratings, setRatings] = useState<Record<string, TeacherHabitRubric>>({});
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setLogs([]);
      setRatings({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    let scopedHasData = false;
    setLoading(true);

    const scopedRef = ref(
      rtdb,
      `seven_habits_logs_by_school/${canonicalSchoolId}`
    );
    const ratingsRef = ref(
      rtdb,
      `seven_habits_teacher_ratings/${canonicalSchoolId}`
    );

    const unsubLogs = onValue(
      scopedRef,
      async (snapshot) => {
        if (cancelled) return;
        const scopedLogs = parseLogTree(snapshot.val(), canonicalSchoolId);
        scopedHasData = scopedLogs.length > 0;
        if (scopedHasData) {
          setLogs(scopedLogs);
          setLoading(false);
          return;
        }
        // Fallback: legacy seven_habits_logs/{studentId}
        if (students.length === 0) {
          setLogs([]);
          setLoading(false);
          return;
        }
        const legacy = await loadLegacyLogsForStudents(
          canonicalSchoolId,
          students
        );
        if (!cancelled && !scopedHasData) {
          setLogs(legacy);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setLogs([]);
          setLoading(false);
        }
      }
    );

    const unsubRatings = onValue(
      ratingsRef,
      (snapshot) => {
        if (cancelled) return;
        const next: Record<string, TeacherHabitRubric> = {};
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const key = child.key || "";
            if (!key) return;
            next[key] = parseRubric(
              (child.val() || {}) as Record<string, unknown>
            );
          });
        }
        setRatings(next);
      },
      () => {
        if (!cancelled) setRatings({});
      }
    );

    return () => {
      cancelled = true;
      unsubLogs();
      unsubRatings();
    };
  }, [canonicalSchoolId, students]);

  const monitoringRows = useMemo<TeacherKaihMonitoringRow[]>(() => {
    const { year, month, week, dayName } = filters;
    return students.map((student) => {
      const monthLogs = logs.filter(
        (log) =>
          matchesStudent(log.studentId, student) &&
          extractYear(log.date) === year &&
          extractMonth(log.date) === month
      );
      const weekLogs = monthLogs.filter(
        (log) => extractWeekOfMonth(log.date) === week
      );
      const dayLog =
        weekLogs.find((log) => extractDayName(log.date) === dayName) || null;
      return { student, dayLog, weekLogs, monthLogs };
    });
  }, [students, logs, filters]);

  const gradingRows = useMemo<TeacherKaihGradeRow[]>(() => {
    const { year, month } = filters;
    return students.map((student) => {
      const studentLogs = logs.filter(
        (log) =>
          matchesStudent(log.studentId, student) &&
          extractYear(log.date) === year &&
          extractMonth(log.date) === month
      );
      const fromId = ratings[buildRatingKey(student.id, month, year)];
      const fromNisn = student.nisn
        ? ratings[buildRatingKey(student.nisn, month, year)]
        : undefined;
      const rubric = fromId || fromNisn || EMPTY_RUBRIC;
      const isTeacherRated =
        Boolean(fromId || fromNisn) && rubric.ratedAt > 0;

      return {
        student,
        rubric,
        isTeacherRated,
        grading: calculateSevenHabitsGrades(
          studentLogs,
          year,
          month,
          isTeacherRated,
          rubric.total
        ),
      };
    });
  }, [students, logs, ratings, filters]);

  return {
    logs,
    ratings,
    monitoringRows,
    gradingRows,
    loading,
  };
}
