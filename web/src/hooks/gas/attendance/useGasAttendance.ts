/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, get } from "firebase/database";
import { AttendanceRecord, AttendanceStatus } from "@/types/gas";

function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

function toAttendanceStatus(raw: unknown): AttendanceStatus {
  const status = String(raw || "").trim().toUpperCase();
  switch (status) {
    case "PRESENT":
    case "HADIR":
    case "H":
      return "PRESENT";
    case "LATE":
    case "TERLAMBAT":
    case "T":
      return "LATE";
    case "SAKIT":
    case "SICK":
    case "S":
      return "SAKIT";
    case "IZIN":
    case "PERMIT":
    case "I":
      return "IZIN";
    case "ABSENT":
    case "ALPHA":
    case "A":
    case "UNMARKED":
    default:
      return "ALPHA";
  }
}

function parseAttendanceDate(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber) && asNumber > 0) return new Date(asNumber);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function studentAliases(student: Record<string, unknown>) {
  return [
    normalizeIdentity(student.id),
    normalizeIdentity(student.nisn),
    normalizeIdentity(student.username),
    normalizeIdentity(student.credential),
  ].filter(Boolean);
}

function resolveCanonicalStudentId(
  record: Record<string, unknown>,
  students: Array<Record<string, unknown>>
) {
  const candidates = [
    normalizeIdentity(record.studentId),
    normalizeIdentity(record.nisn),
    normalizeIdentity(record.username),
  ].filter(Boolean);

  for (const student of students) {
    const aliases = studentAliases(student);
    if (candidates.some((candidate) => aliases.includes(candidate))) {
      return normalizeIdentity(student.id);
    }
  }

  return candidates[0] || "";
}

export function useGasAttendance(schoolId: string | undefined, selectedMonth: number, selectedYear: number) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferences = useCallback(async () => {
    if (!schoolId) {
      setClasses([]);
      setStudents([]);
      return;
    }

    const normalizedSchoolId = normalizeSchoolId(schoolId);

    try {
      const [classesSnap, studentsSnap] = await Promise.all([
        get(rtdbRef(rtdb, `gas/schools/${normalizedSchoolId}/classes`)),
        get(rtdbRef(rtdb, `gas/schools/${normalizedSchoolId}/students`)),
      ]);

      const classesData = classesSnap.val();
      const studentsData = studentsSnap.val();

      const nextClasses = classesData
        ? Object.entries(classesData).map(([id, val]: any) => ({ id, ...val })).filter((c: any) => c.status !== "Nonaktif")
        : [];
      const nextStudents = studentsData
        ? Object.entries(studentsData).map(([id, val]: any) => ({ id, ...val })).filter((s: any) => s.status !== "Nonaktif")
        : [];

      if (nextClasses.length === 0 && nextStudents.length > 0) {
        const uniqueClasses = Array.from(new Set(nextStudents.map((s: any) => s.class || s.className || s.kelas).filter(Boolean)));
        nextClasses.push(...uniqueClasses.map((cName) => ({ id: cName, className: cName, status: "Aktif" })));
      }

      setClasses(nextClasses.sort((a: any, b: any) => (a.className || "").localeCompare(b.className || "")));
      setStudents(nextStudents);
    } catch (error) {
      console.error("Error fetching attendance references:", error);
      setClasses([]);
      setStudents([]);
    }
  }, [schoolId]);

  const fetchAttendances = useCallback(async () => {
    if (!schoolId || !selectedMonth || !selectedYear) {
      setAttendances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const normalizedSchoolId = normalizeSchoolId(schoolId);
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getTime();
    const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).getTime();

    try {
      // Baca dari RTDB yang sama dengan APK GAS (bukan Firestore legacy).
      const [attendanceSnap, studentsSnap] = await Promise.all([
        get(rtdbRef(rtdb, `attendance_by_school/${normalizedSchoolId}`)),
        get(rtdbRef(rtdb, `gas/schools/${normalizedSchoolId}/students`)),
      ]);

      const studentsData = studentsSnap.val() || {};
      const roster = Object.entries(studentsData).map(([id, val]: any) => ({ id, ...val }));

      const raw = attendanceSnap.val() || {};
      const result: AttendanceRecord[] = [];

      for (const [id, value] of Object.entries(raw as Record<string, any>)) {
        const record = value || {};
        const parsedDate = parseAttendanceDate(record.date);
        if (!parsedDate) continue;
        const millis = parsedDate.getTime();
        if (millis < startOfMonth || millis > endOfMonth) continue;

        const canonicalStudentId = resolveCanonicalStudentId(record, roster);
        if (!canonicalStudentId) continue;

        const matchedStudent = roster.find((student) => normalizeIdentity(student.id) === canonicalStudentId);

        result.push({
          id,
          studentId: canonicalStudentId,
          studentName:
            normalizeIdentity(record.studentName) ||
            normalizeIdentity(matchedStudent?.name) ||
            "Siswa",
          className:
            normalizeIdentity(record.className) ||
            normalizeIdentity(record.class) ||
            normalizeIdentity(matchedStudent?.class) ||
            normalizeIdentity(matchedStudent?.className) ||
            normalizeIdentity(matchedStudent?.kelas) ||
            "",
          date: parsedDate.toISOString(),
          status: toAttendanceStatus(record.status),
          source: String(record.recordedBy || "").toLowerCase().includes("student") ? "SELF" : "MANUAL",
          note: normalizeIdentity(record.notes) || undefined,
          checkInTime: record.checkInTime ?? null,
          checkOutTime: record.checkOutTime ?? null,
          mockLocationFlag: Boolean(record.isMockLocation),
          createdAt: typeof record.date === "number" ? record.date : millis,
          updatedAt: typeof record.date === "number" ? record.date : millis,
        });
      }

      setAttendances(result);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedMonth, selectedYear]);

  useEffect(() => {
    void fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    void fetchAttendances();
  }, [fetchAttendances]);

  return {
    classes,
    students,
    attendances,
    loading,
    refresh: fetchAttendances,
  };
}
