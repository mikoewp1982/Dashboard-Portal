import { useCallback, useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase/client";
import { get, ref as rtdbRef } from "firebase/database";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";
import { pickNewestLog } from "@/utils/presensiRules";

export type PrayerTypeV2 = "DHUHA" | "JUMAT";

export type PrayerStatusV2 = "PRAY" | "NOT_PRAY" | "PERMIT" | "HALANGAN";

export type PrayerLogV2 = {
  id: string;
  schoolId?: string;
  studentId: string;
  nisn?: string;
  username?: string;
  studentName?: string;
  classNameSnapshot?: string;
  date: number;
  status: PrayerStatusV2;
  prayerType: PrayerTypeV2;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

export type GasStudentRef = {
  id: string;
  recordId?: string;
  username?: string;
  name?: string;
  nisn?: string;
  className?: string;
  class?: string;
  kelas?: string;
  religion?: string;
  agama?: string;
  gender?: string;
  jenis_kelamin?: string;
  status?: string;
};

export type GasClassRef = {
  id: string;
  className?: string;
  name?: string;
  status?: string;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const asString = (value: unknown): string => String(value ?? "").trim();

const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const asPrayerType = (value: unknown): PrayerTypeV2 | "" => {
  const raw = asString(value).toUpperCase();
  if (raw === "DHUHA" || raw === "JUMAT") return raw;
  return "";
};

const asPrayerStatus = (value: unknown): PrayerStatusV2 => {
  const raw = asString(value).toUpperCase();
  if (raw === "PRAY" || raw === "NOT_PRAY" || raw === "PERMIT" || raw === "HALANGAN") return raw;
  return "NOT_PRAY";
};

const normalizeStudents = (data: Record<string, unknown> | null): GasStudentRef[] => {
  if (!data) return [];
  return Object.entries(data)
    .map(([id, row]) => {
      const record = asRecord(row);
      return {
        id,
        recordId: asString(record.recordId),
        username: asString(record.username),
        name: asString(record.name || record.nama),
        nisn: asString(record.nisn),
        className: asString(record.className),
        class: asString(record.class),
        kelas: asString(record.kelas),
        religion: asString(record.religion),
        agama: asString(record.agama),
        gender: asString(record.gender),
        jenis_kelamin: asString(record.jenis_kelamin),
        status: asString(record.status),
      };
    })
    .filter((student) => student.status !== "Nonaktif");
};

const normalizeClasses = (data: Record<string, unknown> | null): GasClassRef[] => {
  if (!data) return [];
  return Object.entries(data)
    .map(([id, row]) => {
      const record = asRecord(row);
      return {
        id,
        className: asString(record.className),
        name: asString(record.name || record.kelas),
        status: asString(record.status),
      };
    })
    .filter((classItem) => classItem.status !== "Nonaktif");
};

const normalizeLogs = (data: Record<string, unknown>, selectedMonth: number, selectedYear: number, prayerType: PrayerTypeV2) => {
  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getTime();
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).getTime();
  const merged: Record<string, PrayerLogV2> = {};

  for (const [id, raw] of Object.entries(data)) {
    const row = asRecord(raw);
    const rowPrayerType = asPrayerType(row.prayerType);
    if (!rowPrayerType || rowPrayerType !== prayerType) continue;
    const date = asNumber(row.date) || asNumber(row.createdAt) || asNumber(row.updatedAt);
    if (!date || date < startOfMonth || date > endOfMonth) continue;

    const next: PrayerLogV2 = {
      id,
      schoolId: asString(row.schoolId),
      studentId: asString(row.studentId),
      nisn: asString(row.nisn),
      username: asString(row.username),
      studentName: asString(row.studentName),
      classNameSnapshot: asString(row.classNameSnapshot),
      prayerType: rowPrayerType,
      date,
      status: asPrayerStatus(row.status),
      notes: asString(row.notes) || null,
      recordedBy: asString(row.recordedBy) || null,
      createdAt: asNumber(row.createdAt) || undefined,
      updatedAt: asNumber(row.updatedAt) || undefined,
    };

    const current = merged[id];
    merged[id] = current ? pickNewestLog(current, next) : next;
  }

  return Object.values(merged).sort((a, b) => b.date - a.date);
};

const filterLogsBySchoolVariants = (
  data: Record<string, unknown>,
  variants: string[],
  canonicalSchoolId: string
) => {
  const allowed = new Set([canonicalSchoolId, ...variants].map((value) => asString(value).toLowerCase()).filter(Boolean));
  const filtered: Record<string, unknown> = {};

  for (const [id, raw] of Object.entries(data)) {
    const row = asRecord(raw);
    const rowSchoolId = asString(row.schoolId).toLowerCase();
    if (!rowSchoolId || !allowed.has(rowSchoolId)) continue;
    filtered[id] = raw;
  }

  return filtered;
};

export function useGasPrayerAttendanceV2(
  schoolId: string | undefined,
  selectedMonth: number,
  selectedYear: number,
  prayerType: PrayerTypeV2
) {
  const [students, setStudents] = useState<GasStudentRef[]>([]);
  const [classes, setClasses] = useState<GasClassRef[]>([]);
  const [logs, setLogs] = useState<PrayerLogV2[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferences = useCallback(async () => {
    if (!schoolId) {
      setClasses([]);
      setStudents([]);
      return;
    }

    try {
      const canonicalSchoolId = normalizeSchoolId(schoolId);
      const [classesSnap, studentsSnap] = await Promise.all([
        get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/classes`)),
        get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/students`)),
      ]);

      const nextClasses = normalizeClasses(classesSnap.val());
      const nextStudents = normalizeStudents(studentsSnap.val());

      if (nextClasses.length === 0 && nextStudents.length > 0) {
        const unique = Array.from(
          new Set(
            nextStudents
              .map((s) => s.className || s.class || s.kelas)
              .map((v) => asString(v))
              .filter(Boolean)
          )
        );
        setClasses(unique.map((name) => ({ id: name, className: name, name, status: "Aktif" })));
      } else {
        setClasses(
          nextClasses.sort((a, b) => (a.className || a.name || a.id).localeCompare(b.className || b.name || b.id, "id-ID"))
        );
      }

      setStudents(nextStudents);
    } catch {
      setClasses([]);
      setStudents([]);
    }
  }, [schoolId]);

  const fetchLogs = useCallback(async () => {
    if (!schoolId || !selectedMonth || !selectedYear) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const variants = getSchoolIdVariants(schoolId);
    const canonicalSchoolId = normalizeSchoolId(schoolId);
    setLoading(true);

    try {
      const merged: Record<string, unknown> = {};
      for (const variant of variants) {
        const bySchoolSnap = await get(rtdbRef(rtdb, `prayer_attendance_v2_by_school/${variant}`));
        if (!bySchoolSnap.exists()) continue;
        Object.assign(merged, asRecord(bySchoolSnap.val()));
      }

      if (Object.keys(merged).length > 0) {
        setLogs(normalizeLogs(merged, selectedMonth, selectedYear, prayerType));
        return;
      }

      // Fallback tanpa query indexed agar tetap aman saat rules RTDB belum memiliki .indexOn untuk schoolId.
      const globalSnapshot = await get(rtdbRef(rtdb, "prayer_attendance_v2"));
      const globalMerged = globalSnapshot.exists()
        ? filterLogsBySchoolVariants(asRecord(globalSnapshot.val()), variants, canonicalSchoolId)
        : {};

      setLogs(normalizeLogs(globalMerged, selectedMonth, selectedYear, prayerType));
    } finally {
      setLoading(false);
    }
  }, [prayerType, schoolId, selectedMonth, selectedYear]);

  useEffect(() => {
    void fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return {
    classes,
    students,
    logs,
    loading,
    refresh: fetchLogs,
  };
}
