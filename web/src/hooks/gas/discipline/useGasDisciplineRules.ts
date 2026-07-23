import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, onValue, set } from "firebase/database";
import { DisciplineRule, DEFAULT_DISCIPLINE_RULES } from "@/types/discipline";

export function useGasDisciplineRules(schoolId: string | undefined) {
  const [rules, setRules] = useState<DisciplineRule[]>(DEFAULT_DISCIPLINE_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const rulesRef = rtdbRef(rtdb, `gas/schools/${schoolId}/settings/disciplineRules`);
    const unsub = onValue(rulesRef, (snapshot) => {
      clearTimeout(fallbackTimer);
      const data = snapshot.val();
      if (!data) {
        setRules(DEFAULT_DISCIPLINE_RULES);
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
      clearTimeout(fallbackTimer);
      console.error("Error loading discipline rules:", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsub();
    };
  }, [schoolId]);

  const saveRules = useCallback(async (newRules: DisciplineRule[]) => {
    if (!schoolId) return;
    const normalizedSchoolId = schoolId.trim().toLowerCase();
    const rulesRef1 = rtdbRef(rtdb, `gas/schools/${schoolId}/settings/disciplineRules`);
    const rulesRef2 = rtdbRef(rtdb, `discipline_rules_by_school/${normalizedSchoolId}`);
    
    const payload = newRules.reduce((acc, rule) => {
      acc[rule.id] = rule;
      return acc;
    }, {} as Record<number, DisciplineRule>);
    
    await Promise.all([
      set(rulesRef1, payload),
      set(rulesRef2, payload)
    ]);
  }, [schoolId]);

  return {
    rules,
    loading,
    saveRules
  };
}

