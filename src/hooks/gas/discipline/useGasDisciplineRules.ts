import { useState, useEffect, useCallback } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, onValue, set, get } from "firebase/database";
import { DisciplineRule, DEFAULT_DISCIPLINE_RULES } from "@/types/discipline";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

function parseRules(data: Record<string, DisciplineRule> | null | undefined) {
  if (!data) return null;

  const list = Object.entries(data).map(([id, val]: any) => ({
    id: Number(id),
    ...val,
  }));

  return list.sort((a, b) => a.id - b.id);
}

export function useGasDisciplineRules(schoolId: string | undefined) {
  const [rules, setRules] = useState<DisciplineRule[]>(DEFAULT_DISCIPLINE_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const canonicalSchoolId = normalizeSchoolId(schoolId);
    const variants = getSchoolIdVariants(schoolId);
    const legacyVariants = variants.filter((variant) => variant !== canonicalSchoolId);
    setLoading(true);
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const tenantRulesRef = rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/settings/disciplineRules`);
    const mirrorRulesRef = rtdbRef(rtdb, `discipline_rules_by_school/${canonicalSchoolId}`);

    let tenantRulesData: Record<string, DisciplineRule> | null = null;
    let mirrorRulesData: Record<string, DisciplineRule> | null = null;

    const applyResolvedRules = async () => {
      clearTimeout(fallbackTimer);

      const tenantList = parseRules(tenantRulesData);
      if (tenantList) {
        setRules(tenantList);
        setLoading(false);
        return;
      }

      const mirrorList = parseRules(mirrorRulesData);
      if (mirrorList) {
        setRules(mirrorList);
        setLoading(false);
        return;
      }

      for (const variant of legacyVariants) {
        const [legacyTenantSnap, legacyMirrorSnap] = await Promise.all([
          get(rtdbRef(rtdb, `gas/schools/${variant}/settings/disciplineRules`)),
          get(rtdbRef(rtdb, `discipline_rules_by_school/${variant}`)),
        ]);

        const legacyTenantList = parseRules(legacyTenantSnap.val());
        if (legacyTenantList) {
          setRules(legacyTenantList);
          setLoading(false);
          return;
        }

        const legacyMirrorList = parseRules(legacyMirrorSnap.val());
        if (legacyMirrorList) {
          setRules(legacyMirrorList);
          setLoading(false);
          return;
        }
      }

      setRules(DEFAULT_DISCIPLINE_RULES);
      setLoading(false);
    };

    const handleError = (error: unknown) => {
      clearTimeout(fallbackTimer);
      console.error("Error loading discipline rules:", error);
      setLoading(false);
    };

    const unsubTenant = onValue(tenantRulesRef, (snapshot) => {
      tenantRulesData = snapshot.val();
      void applyResolvedRules();
    }, handleError);

    const unsubMirror = onValue(mirrorRulesRef, (snapshot) => {
      mirrorRulesData = snapshot.val();
      void applyResolvedRules();
    }, handleError);

    return () => {
      clearTimeout(fallbackTimer);
      unsubTenant();
      unsubMirror();
    };
  }, [schoolId]);

  const saveRules = useCallback(async (newRules: DisciplineRule[]) => {
    if (!schoolId) return;
    const canonicalSchoolId = normalizeSchoolId(schoolId);
    const variants = getSchoolIdVariants(schoolId);
    const legacyVariants = variants.filter((variant) => variant !== canonicalSchoolId);
    const tenantRefs = legacyVariants.map((variant) =>
      rtdbRef(rtdb, `gas/schools/${variant}/settings/disciplineRules`)
    );
    const mirrorRefs = variants.map((variant) =>
      rtdbRef(rtdb, `discipline_rules_by_school/${variant}`)
    );
    
    const payload = newRules.reduce((acc, rule) => {
      acc[rule.id] = rule;
      return acc;
    }, {} as Record<number, DisciplineRule>);
    
    await Promise.all([
      set(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/settings/disciplineRules`), payload),
      ...tenantRefs.map((ref) => set(ref, payload)),
      ...mirrorRefs.map((ref) => set(ref, payload)),
    ]);
  }, [schoolId]);

  return {
    rules,
    loading,
    saveRules
  };
}

