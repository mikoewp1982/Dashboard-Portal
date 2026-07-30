/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, query, orderByChild, equalTo, get } from "firebase/database";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

export type PrayerStatus = "PRAY" | "NOT_PRAY" | "PERMIT" | "HALANGAN";

export interface PrayerLog {
  id: number | string;
  schoolId?: string;
  studentId: string;
  studentName?: string;
  date: number;
  status: PrayerStatus;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

function normalizePrayerLogs(
  data: Record<string, Omit<PrayerLog, "id">> | null,
  selectedMonth: number,
  selectedYear: number
) {
  if (!data) return [];

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getTime();
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).getTime();

  return Object.keys(data)
    .map((key) => ({
      id: key,
      ...data[key],
    }))
    .filter((log: PrayerLog) => {
      return log.date >= startOfMonth && log.date <= endOfMonth;
    });
}

export function useGasPrayerAttendance(schoolId: string | undefined, selectedMonth: number, selectedYear: number) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [logs, setLogs] = useState<PrayerLog[]>([]);
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
        nextClasses.push(...uniqueClasses.map(cName => ({ id: cName, className: cName, status: "Aktif" })));
      }

      setClasses(nextClasses.sort((a: any, b: any) => (a.className || "").localeCompare(b.className || "")));
      setStudents(nextStudents);
    } catch (error) {
      console.error("Error fetching prayer references:", error);
      setClasses([]);
      setStudents([]);
    }
  }, [schoolId]);

  const fetchPrayerLogs = useCallback(async () => {
    if (!schoolId || !selectedMonth || !selectedYear) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const variants = getSchoolIdVariants(schoolId);
    const canonicalSchoolId = normalizeSchoolId(schoolId);
    setLoading(true);
    const merged: Record<string, Omit<PrayerLog, "id">> = {};
    try {
      for (const variant of variants) {
        const bySchoolSnap = await get(rtdbRef(rtdb, `prayer_attendance_by_school/${variant}`));
        if (bySchoolSnap.exists()) {
          Object.assign(merged, bySchoolSnap.val() || {});
        }
      }

      if (Object.keys(merged).length > 0) {
        setLogs(normalizePrayerLogs(merged, selectedMonth, selectedYear));
        return;
      }

      const globalResults: Record<string, Omit<PrayerLog, "id">> = {};
      const primaryQuery = query(
        rtdbRef(rtdb, "prayer_attendance"),
        orderByChild("schoolId"),
        equalTo(canonicalSchoolId)
      );
      const snapshot = await get(primaryQuery);
      if (snapshot.exists()) {
        Object.assign(globalResults, snapshot.val() || {});
      }

      const legacyVariant = variants.find((v) => v !== canonicalSchoolId);
      if (legacyVariant) {
        const legacyQuery = query(
          rtdbRef(rtdb, "prayer_attendance"),
          orderByChild("schoolId"),
          equalTo(legacyVariant)
        );
        const legacySnap = await get(legacyQuery);
        if (legacySnap.exists()) {
          Object.assign(globalResults, legacySnap.val() || {});
        }
      }

      setLogs(normalizePrayerLogs(globalResults, selectedMonth, selectedYear));
    } catch (error) {
      console.error("Error fetching prayer attendance:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedMonth, selectedYear]);

  // Ambil data presensi sholat dari RTDB secara fetch biasa
  useEffect(() => {
    void fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPrayerLogs();
  }, [fetchPrayerLogs]);

  return {
    classes,
    students,
    logs,
    loading,
    refresh: fetchPrayerLogs
  };
}
