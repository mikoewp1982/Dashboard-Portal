"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export type EduLockUninstallAccess = {
  code: string;
  expiresAt: number | null;
  updatedAt: number | null;
  createdByUid: string;
};

export function useEduLockUninstallAccess(schoolId: string | undefined) {
  const normalizedSchoolId = String(schoolId || "").trim().toLowerCase();
  const [state, setState] = useState<{
    schoolId: string;
    access: EduLockUninstallAccess | null;
  } | null>(null);

  useEffect(() => {
    if (!normalizedSchoolId) {
      return;
    }
    const uninstallRef = ref(rtdb, `edulock_access_codes/${normalizedSchoolId}`);

    const unsubscribe = onValue(uninstallRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setState({ schoolId: normalizedSchoolId, access: null });
        return;
      }

      // Find the first active code that hasn't expired
      const now = Date.now();
      let activeAccess: EduLockUninstallAccess | null = null;
      
      for (const [codeKey, codeData] of Object.entries(data)) {
        const record = codeData as any;
        const expiresAt = record.expiresAt || null;
        if (expiresAt && expiresAt > now) {
          activeAccess = {
            code: codeKey,
            expiresAt: expiresAt,
            updatedAt: null,
            createdByUid: "",
          };
          break; // just show the first active one
        }
      }

      setState({
        schoolId: normalizedSchoolId,
        access: activeAccess,
      });
    });

    return () => unsubscribe();
  }, [normalizedSchoolId]);

  const access = state?.schoolId === normalizedSchoolId ? state.access : null;
  const loading = Boolean(normalizedSchoolId) && state?.schoolId !== normalizedSchoolId;

  return {
    access: normalizedSchoolId ? access : null,
    loading,
  };
}
