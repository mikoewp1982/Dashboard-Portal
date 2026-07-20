import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";
import { callAdminApi } from "@/lib/callAdminApi";

export interface EduLockSettings {
  is_active_protection: boolean;
  is_holiday_mode: boolean;
  gpsWarnMinutes: number;
  gpsLockMinutes: number;
}

export function useEduLockSettings(schoolId: string) {
  const [settings, setSettings] = useState<EduLockSettings>({
    is_active_protection: false,
    is_holiday_mode: false,
    gpsWarnMinutes: 2,
    gpsLockMinutes: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const settingsRef = ref(rtdb, `edulock_settings/${schoolId}`);

    const unsub = onValue(settingsRef, (snap) => {
      const data = snap.val();
      if (data) {
        setSettings({
          is_active_protection: data.is_active_protection ?? false,
          is_holiday_mode: data.is_holiday_mode ?? false,
          gpsWarnMinutes: data.gpsWarnMinutes ?? 2,
          gpsLockMinutes: data.gpsLockMinutes ?? 5,
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId]);

  const saveSettings = async (newSettings: Partial<EduLockSettings>) => {
    setSaving(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "save-settings",
        schoolId,
        settings: newSettings,
      });
      // Optimistic update
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error("Gagal menyimpan pengaturan EduLock:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
  };
}
