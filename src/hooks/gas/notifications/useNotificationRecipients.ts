"use client";

import { useCallback, useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import type { GasRecord } from "@/components/gas/shared/gasConfig";

export interface NotificationClassOption {
  id: string;
  name: string;
}

export interface NotificationStudentOption extends GasRecord {
  id: string;
}

function normalizeClassLabel(row: Record<string, unknown>) {
  return String(row.className || row.name || "").trim();
}

export function getStudentClassLabel(student: GasRecord) {
  return String(student.kelas || student.className || student.class || "").trim();
}

export function useNotificationRecipients(schoolId?: string) {
  const [classes, setClasses] = useState<NotificationClassOption[]>([]);
  const [students, setStudents] = useState<NotificationStudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setClasses([]);
      setStudents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [classesSnap, studentsSnap] = await Promise.all([
        get(ref(rtdb, `gas/schools/${schoolId}/classes`)),
        get(ref(rtdb, `gas/schools/${schoolId}/students`)),
      ]);

      const nextClasses = classesSnap.exists()
        ? Object.entries(classesSnap.val() as Record<string, Record<string, unknown>>)
            .map(([id, row]) => ({
              id,
              name: normalizeClassLabel(row),
            }))
            .filter((row) => row.name)
            .sort((a, b) => a.name.localeCompare(b.name, "id"))
        : [];

      const nextStudents = studentsSnap.exists()
        ? Object.entries(studentsSnap.val() as Record<string, GasRecord>)
            .map(([id, row]) => ({
              ...row,
              id,
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", "id"))
        : [];

      setClasses(nextClasses);
      setStudents(nextStudents);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat referensi kelas dan siswa.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    classes,
    students,
    isLoading,
    error,
    refresh,
  };
}
