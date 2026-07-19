/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, query, orderByChild, equalTo, get } from "firebase/database";

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
  schoolId: string,
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
      return log.schoolId === schoolId && log.date >= startOfMonth && log.date <= endOfMonth;
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
      const [classesSnap, studentsSnap] = await Promise.all([
        get(rtdbRef(rtdb, `gas/schools/${schoolId}/classes`)),
        get(rtdbRef(rtdb, `gas/schools/${schoolId}/students`)),
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

    setLoading(true);
    // Kita gunakan get() alih-alih onValue() agar tidak meload seluruh histori data sepanjang masa
    // dan menjaganya tetap di memori secara realtime, sesuai Pedoman Hemat Data.
    const prayerRef = query(rtdbRef(rtdb, "prayer_attendance"), orderByChild("schoolId"), equalTo(schoolId));

    try {
      const snapshot = await get(prayerRef);
      setLogs(normalizePrayerLogs(snapshot.val(), schoolId, selectedMonth, selectedYear));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Index not defined")) {
        // Fallback sementara agar UI tidak jebol saat rules/index remote belum ter-deploy.
        // Jalur utama tetap query terindeks berbasis schoolId agar hemat data.
        try {
          const fallbackSnapshot = await get(rtdbRef(rtdb, "prayer_attendance"));
          setLogs(normalizePrayerLogs(fallbackSnapshot.val(), schoolId, selectedMonth, selectedYear));
          console.warn("RTDB index schoolId untuk prayer_attendance belum aktif. Menggunakan fallback sementara.");
          return;
        } catch (fallbackError) {
          console.error("Fallback prayer attendance fetch failed:", fallbackError);
        }
      }

      console.error("Error fetching prayer attendance:", error);
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
