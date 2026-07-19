/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { rtdb, db } from "@/lib/firebase/client";
import { ref as rtdbRef, get } from "firebase/database";
import { collection, query, getDocs } from "firebase/firestore";
import { AttendanceRecord } from "@/types/gas";

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
    const yyyymm = `${selectedYear}${String(selectedMonth).padStart(2, "0")}`;
    const collRef = collection(db, `schools/${schoolId}/attendance/${yyyymm}/records`);
    
    // Kita ambil log dalam satu bulan secara fetch biasa (tidak realtime) sesuai pedoman hemat data.
    const q = query(collRef);

    try {
      const snapshot = await getDocs(q);
      const result: AttendanceRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as AttendanceRecord;
        result.push({ ...data, id: doc.id });
      });
      setAttendances(result);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedMonth, selectedYear]);

  // Ambil data presensi dari Firestore per bulan
  useEffect(() => {
    void fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAttendances();
  }, [fetchAttendances]);

  return {
    classes,
    students,
    attendances,
    loading,
    refresh: fetchAttendances
  };
}
