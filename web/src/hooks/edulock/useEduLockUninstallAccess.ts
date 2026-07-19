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
    const uninstallRef = ref(
      rtdb,
      `school_settings/${normalizedSchoolId}/system/edulock/uninstall_access`
    );

    const unsubscribe = onValue(uninstallRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setState({ schoolId: normalizedSchoolId, access: null });
        return;
      }

      setState({
        schoolId: normalizedSchoolId,
        access: {
          code: String(data.code || "").trim(),
          expiresAt: typeof data.expiresAt === "number" ? data.expiresAt : null,
          updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : null,
          createdByUid: String(data.createdByUid || "").trim(),
        },
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
