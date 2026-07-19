import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, onValue, set } from "firebase/database";
import { DisciplineRule } from "@/types/discipline";

export function useGasDisciplineRules(schoolId: string | undefined) {
  const [rules, setRules] = useState<DisciplineRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    setLoading(true);
    const rulesRef = rtdbRef(rtdb, `gas/schools/${schoolId}/settings/disciplineRules`);
    const unsub = onValue(rulesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRules([]);
        setLoading(false);
        return;
      }

      const list = Object.entries(data).map(([id, val]: any) => ({
        id: Number(id),
        ...val,
      }));
      setRules(list.sort((a, b) => a.id - b.id));
      setLoading(false);
    }, (error) => {
      console.error("Error loading discipline rules:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId]);

  const saveRules = useCallback(async (newRules: DisciplineRule[]) => {
    if (!schoolId) return;
    const rulesRef = rtdbRef(rtdb, `gas/schools/${schoolId}/settings/disciplineRules`);
    const payload = newRules.reduce((acc, rule) => {
      acc[rule.id] = rule;
      return acc;
    }, {} as Record<number, DisciplineRule>);
    await set(rulesRef, payload);
  }, [schoolId]);

  return {
    rules,
    loading,
    saveRules
  };
}
