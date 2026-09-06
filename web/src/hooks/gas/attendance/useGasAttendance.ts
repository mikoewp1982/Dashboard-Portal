import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, get } from "firebase/database";
import { AttendanceRecord, AttendanceSource, AttendanceStatus } from "@/types/gas";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

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

function deriveAttendanceSource(record: Record<string, unknown>): AttendanceSource {
  const recordedBy = String(record.recordedBy || "").trim().toLowerCase();
  const checkInMethod = String(record.checkInMethod || "").trim().toUpperCase();
  const note = String(record.notes || record.note || "").trim().toLowerCase();

  if (
    checkInMethod === "MANUAL_CLASS_SECRETARY" ||
    recordedBy.includes("sekretaris kelas")
  ) {
    return "CLASS_SECRETARY";
  }

  if (
    checkInMethod === "MANUAL_TEACHER" ||
    recordedBy.includes("teacher_manual") ||
    recordedBy.includes("wali kelas") ||
    recordedBy.includes("guru")
  ) {
    return "TEACHER_MANUAL";
  }

  if (
    checkInMethod === "MANUAL_ADMIN" ||
    recordedBy.includes("admin") ||
    note.includes("diubah manual oleh admin") ||
    note.includes("admin_manual")
  ) {
    return "ADMIN_MANUAL";
  }

  if (
    recordedBy.includes("system") ||
    checkInMethod === "SYSTEM"
  ) {
    return "SYSTEM";
  }

  if (recordedBy.includes("student")) {
    return "SELF";
  }

  return "MANUAL";
}

function getAttendanceSourceLabel(source: AttendanceSource): string {
  switch (source) {
    case "SELF":
      return "Siswa";
    case "TEACHER_MANUAL":
      return "Wali Kelas";
    case "CLASS_SECRETARY":
      return "Sekretaris Kelas";
    case "ADMIN_MANUAL":
      return "Admin";
    case "SYSTEM":
      return "Sistem";
    case "MANUAL":
    default:
      return "Input Manual";
  }
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

export function useGasAttendance(
  schoolId: string | undefined,
  selectedMonth: number,
  selectedYear: number,
  rangeStart?: number,
  rangeEnd?: number
) {
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
    const effectiveRangeStart =
      typeof rangeStart === "number" && Number.isFinite(rangeStart)
        ? rangeStart
        : startOfMonth;
    const effectiveRangeEnd =
      typeof rangeEnd === "number" && Number.isFinite(rangeEnd)
        ? rangeEnd
        : endOfMonth;

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
        if (millis < effectiveRangeStart || millis > effectiveRangeEnd) continue;

        const canonicalStudentId = resolveCanonicalStudentId(record, roster);
        if (!canonicalStudentId) continue;

        const matchedStudent = roster.find((student) => normalizeIdentity(student.id) === canonicalStudentId);

        const source = deriveAttendanceSource(record);

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
          source,
          sourceLabel: getAttendanceSourceLabel(source),
          note: normalizeIdentity(record.notes) || normalizeIdentity(record.note) || undefined,
          checkInTime: record.checkInTime ?? null,
          checkOutTime: record.checkOutTime ?? null,
          checkInMethod: normalizeIdentity(record.checkInMethod) || null,
          recordedBy: normalizeIdentity(record.recordedBy) || null,
          verificationStatus: normalizeIdentity(record.verificationStatus) || "APPROVED",
          verifiedBy: normalizeIdentity(record.verifiedBy) || null,
          verifiedAt: typeof record.verifiedAt === "number" ? record.verifiedAt : Number(record.verifiedAt || 0) || null,
          proposedBy: normalizeIdentity(record.proposedBy) || null,
          proposedAt: typeof record.proposedAt === "number" ? record.proposedAt : Number(record.proposedAt || 0) || null,
          proposedStatus: normalizeIdentity(record.proposedStatus) || null,
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
  }, [schoolId, selectedMonth, selectedYear, rangeEnd, rangeStart]);

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
