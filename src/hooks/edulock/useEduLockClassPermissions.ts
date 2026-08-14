"use client";

import { useState } from "react";
import { callAdminApi } from "@/lib/callAdminApi";

export function useEduLockClassPermissions(schoolId: string) {
  const [saving, setSaving] = useState(false);

  const grantClassPermission = async (className: string, sessionStart: string, sessionEnd: string) => {
    setSaving(true);
    try {
      return await callAdminApi("/api/admin/edulock", "POST", {
        action: "grant-class-permission",
        schoolId,
        className,
        sessionStart,
        sessionEnd,
      });
    } finally {
      setSaving(false);
    }
  };

  const revokeClassPermission = async (className: string) => {
    setSaving(true);
    try {
      return await callAdminApi("/api/admin/edulock", "POST", {
        action: "revoke-class-permission",
        schoolId,
        className,
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    grantClassPermission,
    revokeClassPermission,
  };
}
