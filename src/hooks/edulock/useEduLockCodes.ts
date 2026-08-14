import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";
import { callAdminApi } from "@/lib/callAdminApi";

export interface EduLockAccessCode {
  code: string;
  sessionStart: string;
  sessionEnd: string;
  duration: number;
  expiresAt: number;
}

export function useEduLockCodes(schoolId: string) {
  const [codes, setCodes] = useState<EduLockAccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const codesRef = ref(rtdb, `edulock_access_codes/${schoolId}`);

    const unsub = onValue(codesRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setCodes([]);
      } else {
        const parsed = Object.keys(data).map((key) => ({
          code: key,
          ...data[key],
        }));
        // Sort by expiration time descending
        parsed.sort((a, b) => b.expiresAt - a.expiresAt);
        setCodes(parsed as EduLockAccessCode[]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId]);

  const generateCode = async (sessionStart: string, sessionEnd: string, duration: number) => {
    setSaving(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "generate-access-code",
        schoolId,
        sessionStart,
        sessionEnd,
        duration,
      });
    } catch (error) {
      console.error("Gagal generate kode EduLock:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteCode = async (code: string) => {
    setSaving(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "delete-access-code",
        schoolId,
        code,
      });
    } catch (error) {
      console.error("Gagal menghapus kode EduLock:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteExpiredCodes = async () => {
    setSaving(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "delete-expired-codes",
        schoolId,
      });
    } catch (error) {
      console.error("Gagal menghapus kode expired EduLock:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    codes,
    loading,
    saving,
    generateCode,
    deleteCode,
    deleteExpiredCodes,
  };
}
