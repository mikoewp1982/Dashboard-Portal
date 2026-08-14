import { useState, useCallback, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, get } from "firebase/database";
import { DisciplineRecord } from "@/types/discipline";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

const fetchWithTimeout = <T>(promise: Promise<T>, ms = 4000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("RTDB Timeout")), ms))
  ]);
};

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
    try {
      const variants = getSchoolIdVariants(schoolId);
      const merged: Record<string, any> = {};

      for (const variant of variants) {
        const snapshot = await fetchWithTimeout(get(rtdbRef(rtdb, `discipline_records_by_school/${variant}`)));
        const data = snapshot.val();
        if (data && typeof data === "object") {
          Object.assign(merged, data);
        }
      }

      const result: DisciplineRecord[] = [];
      Object.keys(merged).forEach((key) => {
        try {
          const val = merged[key];
          if (!val || typeof val !== "object") return;

          let timestamp = val.createdAt || val.date || Date.now();
          if (typeof timestamp === "object" && timestamp[".sv"]) {
            timestamp = Date.now();
          } else if (typeof timestamp === "string") {
            timestamp = parseInt(timestamp) || Date.now();
          }
          if (isNaN(timestamp)) timestamp = Date.now();

          const d = new Date(timestamp);
          if (isNaN(d.getTime())) return;

          if (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear) {
            result.push({
              id: key,
              studentId: String(val.studentId || ""),
              studentNameSnapshot: String(val.studentName || val.studentNameSnapshot || "Unknown"),
              classNameSnapshot: String(val.classNameSnapshot || ""),
              ruleId: Number(val.ruleId || 0),
              ruleNameSnapshot: String(val.ruleName || val.ruleNameSnapshot || ""),
              category: val.category === "ACHIEVEMENT" ? "ACHIEVEMENT" : "VIOLATION",
              points: Number(val.points || 0),
              date: timestamp,
              note: val.description || val.note || null,
              recordedBy: String(val.reporterId || val.recordedBy || ""),
              recordedByName: String(val.reporterName || val.recordedByName || ""),
              reportedByRole: val.reportedByRole || "teacher",
              createdAt: timestamp
            });
          }
        } catch (itemErr) {
          console.error("Error parsing record:", key, itemErr);
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
      const canonicalSchoolId = normalizeSchoolId(schoolId);
      const [studentsSnap, classesSnap] = await fetchWithTimeout(Promise.all([
        get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/students`)),
        get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/classes`))
      ]));
      
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
    
    const now = Date.now();
    const newRecordId = Date.now().toString(); // simple ID generation
    const canonicalSchoolId = normalizeSchoolId(schoolId);
    const variants = getSchoolIdVariants(schoolId);
    
    // Format to Android app's expected structure
    const androidRecord = {
      id: newRecordId,
      studentId: record.studentId,
      studentName: record.studentNameSnapshot || "",
      schoolId: canonicalSchoolId,
      ruleId: record.ruleId.toString(),
      ruleName: record.ruleNameSnapshot || "",
      points: record.points,
      severity: "LOW", // default
      category: record.category,
      reporterId: record.recordedBy,
      reporterName: record.recordedByName || "",
      description: record.note || "",
      status: "APPROVED",
      createdAt: record.date || now,
      updatedAt: now
    };

    const updates: Record<string, any> = {};
    updates[`discipline_records/${newRecordId}`] = androidRecord;
    for (const variant of variants) {
      updates[`discipline_records_by_school/${variant}/${newRecordId}`] = androidRecord;
    }

    const { update } = await import("firebase/database");
    await update(rtdbRef(rtdb), updates);

    setRecords(prev => [{...record, id: newRecordId} as DisciplineRecord, ...prev].sort((a, b) => b.date - a.date));
  };

  const deleteRecord = async (recordId: string) => {
    if (!schoolId) return;
    const variants = getSchoolIdVariants(schoolId);
    const updates: Record<string, any> = {};
    updates[`discipline_records/${recordId}`] = null;
    for (const variant of variants) {
      updates[`discipline_records_by_school/${variant}/${recordId}`] = null;
    }

    const { update } = await import("firebase/database");
    await update(rtdbRef(rtdb), updates);

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
