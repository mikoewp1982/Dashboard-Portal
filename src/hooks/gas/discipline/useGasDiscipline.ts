import { useState, useCallback, useEffect } from "react";
import { db, rtdb } from "@/lib/firebase/client";
import { collection, query, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref as rtdbRef, get } from "firebase/database";
import { DisciplineRecord } from "@/types/discipline";

export function useGasDiscipline(schoolId: string | undefined, selectedMonth: number, selectedYear: number) {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!schoolId || !selectedMonth || !selectedYear) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Kita simpan di firestore: schools/{schoolId}/discipline
    // Karena PRD minta di schools/{schoolId}/discipline/{recordId}
    const collRef = collection(db, `schools/${schoolId}/discipline`);
    const q = query(collRef);

    try {
      const snapshot = await getDocs(q);
      const result: DisciplineRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as DisciplineRecord;
        // Filter di sisi client untuk bulan & tahun
        const d = new Date(data.date);
        if (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear) {
          result.push({ ...data, id: doc.id });
        }
      });
      setRecords(result.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error("Error fetching discipline records:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedMonth, selectedYear]);

  // Ambil data referensi (siswa dan kelas) dari RTDB secara one-shot (hemat data)
  const fetchReferences = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [studentsSnap, classesSnap] = await Promise.all([
        get(rtdbRef(rtdb, `gas/schools/${schoolId}/students`)),
        get(rtdbRef(rtdb, `gas/schools/${schoolId}/classes`))
      ]);
      
      const sData = studentsSnap.val();
      const cData = classesSnap.val();

      let nextStudents: any[] = [];
      let nextClasses: any[] = [];

      if (sData) {
        nextStudents = Object.entries(sData).map(([id, val]: any) => ({ id, ...val })).filter((s: any) => s.status !== "Nonaktif");
        setStudents(nextStudents);
      }
      if (cData) {
        nextClasses = Object.entries(cData).map(([id, val]: any) => ({ id, ...val })).filter((c: any) => c.status !== "Nonaktif");
      }

      if (nextClasses.length === 0 && nextStudents.length > 0) {
        const uniqueClasses = Array.from(new Set(nextStudents.map((s: any) => s.class || s.className || s.kelas).filter(Boolean)));
        nextClasses = uniqueClasses.map(cName => ({ id: cName, name: cName, className: cName, status: "Aktif" }));
      }

      setClasses(nextClasses.sort((a: any, b: any) => (a.className || a.name || "").localeCompare(b.className || b.name || "")));
    } catch (error) {
      console.error("Error fetching discipline references:", error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: Omit<DisciplineRecord, "id">) => {
    if (!schoolId) return;
    const docRef = doc(collection(db, `schools/${schoolId}/discipline`));
    const newRecord = { ...record, id: docRef.id };
    await setDoc(docRef, newRecord);
    setRecords(prev => [newRecord as DisciplineRecord, ...prev].sort((a, b) => b.date - a.date));
  };

  const deleteRecord = async (recordId: string) => {
    if (!schoolId) return;
    const docRef = doc(db, `schools/${schoolId}/discipline/${recordId}`);
    await deleteDoc(docRef);
    setRecords(prev => prev.filter(r => r.id !== recordId));
  };

  return {
    records,
    students,
    classes,
    loading,
    refresh: fetchRecords,
    addRecord,
    deleteRecord
  };
}
