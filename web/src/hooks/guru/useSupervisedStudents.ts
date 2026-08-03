"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { normalizeClassName, readStudentClass } from "@/lib/guru/normalizeClass";

export type SupervisedStudent = {
  id: string;
  name: string;
  nisn: string;
  className: string;
  identities: string[];
};

export function useSupervisedStudents(schoolId?: string, homeroomClass?: string) {
  const [students, setStudents] = useState<SupervisedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const targetClass = useMemo(() => normalizeClassName(homeroomClass), [homeroomClass]);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const studentsRef = ref(rtdb, `gas/schools/${canonicalSchoolId}/students`);
    const unsub = onValue(
      studentsRef,
      (snapshot) => {
        const next: SupervisedStudent[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const className = readStudentClass(row);
            if (targetClass && normalizeClassName(className) !== targetClass) {
              return;
            }

            const id = child.key || "";
            const name = String(row.name || row.nama || "Siswa").trim();
            const nisn = String(row.nisn || "").trim();
            const identities = [id, nisn, String(row.username || "").trim()]
              .map((value) => value.trim())
              .filter(Boolean);

            next.push({
              id,
              name,
              nisn,
              className,
              identities: Array.from(new Set(identities)),
            });
          });
        }

        next.sort((a, b) => a.name.localeCompare(b.name, "id"));
        setStudents(next);
        setLoading(false);
      },
      () => {
        setStudents([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId, targetClass]);

  return { students, loading, targetClass };
}
