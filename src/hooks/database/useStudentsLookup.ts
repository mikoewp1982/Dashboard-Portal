"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { DatabaseTab } from "@/components/database/shared/databaseConfig";

type StudentLookupMap = Record<string, { name: string; class: string }>;

export function useStudentsLookup(activeTab: DatabaseTab, schoolId?: string) {
  const [studentsByNisn, setStudentsByNisn] = useState<StudentLookupMap>({});

  useEffect(() => {
    if (!schoolId || activeTab !== "Petugas OSIS") return;

    const dataRef = ref(rtdb, `gas/schools/${schoolId}/students`);
    const unsub = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const next: StudentLookupMap = {};
        Object.keys(val).forEach((key) => {
          const row = val[key];
          const nisn = String(row?.nisn || "").trim();
          if (!nisn) return;
          next[nisn] = {
            name: row?.name || "",
            class: row?.class || "",
          };
        });
        setStudentsByNisn(next);
      } else {
        setStudentsByNisn({});
      }
    });

    return () => unsub();
  }, [activeTab, schoolId]);

  return activeTab === "Petugas OSIS" ? studentsByNisn : {};
}
