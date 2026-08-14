import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";
import { callAdminApi } from "@/lib/callAdminApi";

export interface EduLockGeofence {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface EduLockSettings {
  is_active_protection: boolean;
  is_holiday_mode: boolean;
  gpsWarnMinutes: number;
  gpsLockMinutes: number;
  petDeadReminderFirstMinutes: number;
  petDeadReminderSecondMinutes: number;
  petDeadReminderRepeatMinutes: number;
  geofence: EduLockGeofence | null;
}

function normalizeSchoolId(value: string) {
  return String(value || "").trim().toLowerCase().replace(/[\s\-]+/g, "_");
}

export function useEduLockSettings(schoolId: string) {
  const normalizedSchoolId = normalizeSchoolId(schoolId);
  const [settings, setSettings] = useState<EduLockSettings>({
    is_active_protection: false,
    is_holiday_mode: false,
    gpsWarnMinutes: 2,
    gpsLockMinutes: 5,
    petDeadReminderFirstMinutes: 30,
    petDeadReminderSecondMinutes: 20,
    petDeadReminderRepeatMinutes: 10,
    geofence: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!normalizedSchoolId) {
      setLoading(false);
      return;
    }
    const settingsRef = ref(rtdb, `edulock_settings/${normalizedSchoolId}`);

    const unsub = onValue(settingsRef, (snap) => {
      const data = snap.val();
      if (data) {
        setSettings({
          is_active_protection: data.is_active_protection ?? false,
          is_holiday_mode: data.is_holiday_mode ?? false,
          gpsWarnMinutes: data.gpsWarnMinutes ?? 2,
          gpsLockMinutes: data.gpsLockMinutes ?? 5,
          petDeadReminderFirstMinutes: data.petDeadReminderFirstMinutes ?? 30,
          petDeadReminderSecondMinutes: data.petDeadReminderSecondMinutes ?? 20,
          petDeadReminderRepeatMinutes: data.petDeadReminderRepeatMinutes ?? 10,
          geofence:
            data.geofence &&
            Number.isFinite(Number(data.geofence.latitude)) &&
            Number.isFinite(Number(data.geofence.longitude)) &&
            Number.isFinite(Number(data.geofence.radius))
              ? {
                  latitude: Number(data.geofence.latitude),
                  longitude: Number(data.geofence.longitude),
                  radius: Number(data.geofence.radius),
                }
              : null,
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [normalizedSchoolId]);

  const saveSettings = async (newSettings: Partial<EduLockSettings>) => {
    setSaving(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "save-settings",
        schoolId: normalizedSchoolId,
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
