import { useCallback, useEffect, useState } from "react";
import { auth, rtdb } from "@/lib/firebase/client";
import { get, onValue, ref } from "firebase/database";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  PrayerClassOption,
  PrayerClassSchedule,
  PrayerDateOverride,
  PrayerTypeConfig,
  PrayerTypeId,
} from "@/types/gasPrayerConfig";

const DEFAULT_PRAYER_TYPES: PrayerTypeConfig[] = [
  {
    id: "DZUHUR",
    label: "Sholat Dzuhur",
    description: "Sholat wajib harian utama untuk seluruh siswa yang memenuhi syarat umum.",
    enabled: true,
    scheduleMode: "global_daily",
    requireMuslim: true,
    eligibleGender: "all",
    locationRequired: true,
    startTime: "11:30",
    endTime: "13:30",
  },
  {
    id: "DHUHA",
    label: "Sholat Dhuha",
    description: "Sholat sunnah dengan jadwal mingguan per kelas dan bisa dioverride per tanggal.",
    enabled: false,
    scheduleMode: "class_schedule_hybrid",
    requireMuslim: true,
    eligibleGender: "all",
    locationRequired: true,
  },
  {
    id: "JUMAT",
    label: "Sholat Jumat",
    description: "Jadwal khusus per kelas untuk siswa putra Muslim yang memang dijadwalkan.",
    enabled: false,
    scheduleMode: "class_schedule_gender_gate",
    requireMuslim: true,
    eligibleGender: "male",
    locationRequired: true,
  },
];

const normalizePrayerType = (typeId: string, raw?: Partial<PrayerTypeConfig>): PrayerTypeConfig => {
  const defaults = DEFAULT_PRAYER_TYPES.find((item) => item.id === typeId) ?? DEFAULT_PRAYER_TYPES[0];
  return {
    ...defaults,
    ...(raw || {}),
    id: defaults.id,
    startTime: String(raw?.startTime || defaults.startTime || ""),
    endTime: String(raw?.endTime || defaults.endTime || ""),
  };
};

const normalizeSchedules = (data: Record<string, any> | null): PrayerClassSchedule[] => {
  if (!data) return [];
  return Object.entries(data)
    .map(([id, value]) => ({
      id,
      prayerType: value?.prayerType ?? "DHUHA",
      classIds: Array.isArray(value?.classIds) ? value.classIds.filter(Boolean) : [],
      dayOfWeek: Number(value?.dayOfWeek ?? 1),
      startTime: String(value?.startTime ?? "07:00"),
      endTime: String(value?.endTime ?? "07:30"),
      active: value?.active !== false,
      notes: String(value?.notes ?? ""),
    }))
    .sort((a, b) => a.prayerType.localeCompare(b.prayerType) || a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
};

const normalizeOverrides = (data: Record<string, any> | null): PrayerDateOverride[] => {
  if (!data) return [];
  return Object.entries(data)
    .map(([id, value]) => ({
      id,
      date: String(value?.date ?? ""),
      prayerType: value?.prayerType ?? "DHUHA",
      classIds: Array.isArray(value?.classIds) ? value.classIds.filter(Boolean) : [],
      action: value?.action === "activate" ? "activate" : "deactivate",
      notes: String(value?.notes ?? ""),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.prayerType.localeCompare(b.prayerType));
};

export function useGasPrayerConfig(schoolId: string) {
  const [prayerTypes, setPrayerTypes] = useState<PrayerTypeConfig[]>(DEFAULT_PRAYER_TYPES);
  const [schedules, setSchedules] = useState<PrayerClassSchedule[]>([]);
  const [overrides, setOverrides] = useState<PrayerDateOverride[]>([]);
  const [classes, setClasses] = useState<PrayerClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setPrayerTypes(DEFAULT_PRAYER_TYPES);
      setSchedules([]);
      setOverrides([]);
      setClasses([]);
      setLoading(false);
      return;
    }

    const canonicalSchoolId = normalizeSchoolId(schoolId);
    const baseRef = `school_settings/${canonicalSchoolId}/prayer_v2`;

    const prayerTypesUnsub = onValue(ref(rtdb, `${baseRef}/types`), (snap) => {
      const data = snap.val() as Record<PrayerTypeId, Partial<PrayerTypeConfig>> | null;
      const next = DEFAULT_PRAYER_TYPES.map((item) => normalizePrayerType(item.id, data?.[item.id]));
      setPrayerTypes(next);
      setLoading(false);
    });

    const schedulesUnsub = onValue(ref(rtdb, `${baseRef}/schedules`), (snap) => {
      setSchedules(normalizeSchedules(snap.val()));
    });

    const overridesUnsub = onValue(ref(rtdb, `${baseRef}/overrides`), (snap) => {
      setOverrides(normalizeOverrides(snap.val()));
    });

    void get(ref(rtdb, `gas/schools/${canonicalSchoolId}/classes`))
      .then((snap) => {
        const value = snap.val();
        if (!value) {
          setClasses([]);
          return;
        }
        const nextClasses = Object.entries(value)
          .map(([id, item]: any) => ({
            id: String(id),
            label: String(item?.className || item?.name || item?.kelas || id),
            status: item?.status,
          }))
          .filter((item) => item.status !== "Nonaktif")
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(({ id, label }) => ({ id, label }));
        setClasses(nextClasses);
      })
      .catch((error) => {
        console.error("Error fetching prayer config classes:", error);
        setClasses([]);
      });

    return () => {
      prayerTypesUnsub();
      schedulesUnsub();
      overridesUnsub();
    };
  }, [schoolId]);

  const callApi = useCallback(
    async (body: any) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/attendance-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Terjadi kesalahan server.");
      }

      return res.json();
    },
    []
  );

  const savePrayerTypes = useCallback(
    async (nextPrayerTypes: PrayerTypeConfig[]) => {
      await callApi({
        action: "save-prayer-v2-types",
        schoolId,
        prayerTypes: nextPrayerTypes,
      });
    },
    [callApi, schoolId]
  );

  const saveSchedules = useCallback(
    async (nextSchedules: PrayerClassSchedule[]) => {
      await callApi({
        action: "save-prayer-v2-schedules",
        schoolId,
        schedules: nextSchedules,
      });
    },
    [callApi, schoolId]
  );

  const saveOverrides = useCallback(
    async (nextOverrides: PrayerDateOverride[]) => {
      await callApi({
        action: "save-prayer-v2-overrides",
        schoolId,
        overrides: nextOverrides,
      });
    },
    [callApi, schoolId]
  );

  return {
    prayerTypes,
    schedules,
    overrides,
    classes,
    loading,
    savePrayerTypes,
    saveSchedules,
    saveOverrides,
  };
}
