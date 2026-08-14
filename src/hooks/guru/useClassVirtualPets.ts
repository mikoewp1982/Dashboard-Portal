"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, query, ref, orderByChild, equalTo } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import type { PetVitalInput } from "@/lib/guru/petStatus";
import type { SupervisedStudent } from "@/hooks/guru/useSupervisedStudents";

export type ClassPetRow = PetVitalInput & {
  id: string;
  studentId: string;
  schoolId: string;
};

function parsePet(key: string, row: Record<string, unknown>): ClassPetRow {
  return {
    id: key,
    studentId: String(row.studentId || "").trim(),
    schoolId: normalizeSchoolId(row.schoolId),
    status: String(row.status || "HAPPY"),
    health: Number(row.health ?? 100),
    happiness: Number(row.happiness ?? 100),
    energy: Number(row.energy ?? 100),
    hunger: Number(row.hunger ?? 0),
    manualReviveUntil: Number(row.manualReviveUntil ?? 0),
  };
}

/** Map studentId (and aliases) -> pet, same lookup style as TeacherStudentsScreen. */
export function useClassVirtualPets(
  schoolId: string | undefined,
  students: SupervisedStudent[]
) {
  const [petsByStudentId, setPetsByStudentId] = useState<Record<string, ClassPetRow>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const canonicalSchoolId = useMemo(() => normalizeSchoolId(schoolId), [schoolId]);

  useEffect(() => {
    if (!canonicalSchoolId) {
      setPetsByStudentId({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const petsQuery = query(
      ref(rtdb, "virtual_pets"),
      orderByChild("schoolId"),
      equalTo(canonicalSchoolId)
    );

    const unsub = onValue(
      petsQuery,
      (snapshot) => {
        const next: Record<string, ClassPetRow> = {};
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const pet = parsePet(child.key || "", (child.val() || {}) as Record<string, unknown>);
            const key = pet.studentId.trim();
            if (!key || next[key]) return;
            next[key] = pet;
          });
        }
        setPetsByStudentId(next);
        setLoading(false);
      },
      () => {
        setPetsByStudentId({});
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalSchoolId]);

  const petForStudent = useMemo(() => {
    return (student: SupervisedStudent): ClassPetRow | null => {
      for (const candidate of student.identities) {
        const key = candidate.trim();
        if (!key) continue;
        const hit = petsByStudentId[key] || petsByStudentId[key.toLowerCase()];
        if (hit) return hit;
      }
      // Case-insensitive scan when RTDB keys differ only by case
      const aliases = new Set(student.identities.map((id) => id.trim().toLowerCase()).filter(Boolean));
      for (const [key, pet] of Object.entries(petsByStudentId)) {
        if (aliases.has(key.toLowerCase())) return pet;
      }
      return null;
    };
  }, [petsByStudentId]);

  return { petsByStudentId, petForStudent, loading };
}
