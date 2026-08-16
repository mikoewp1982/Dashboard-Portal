"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { useGasPrayerConfig } from "@/hooks/gas/attendance/useGasPrayerConfig";
import { EffectiveDaysCard } from "./settings/EffectiveDaysCard";
import { HolidaySettingsCard } from "./settings/HolidaySettingsCard";
import { LocationSettingsCard } from "./settings/LocationSettingsCard";
import { PrayerSystemSettingsPanel } from "../prayer/PrayerSystemSettingsPanel";

interface Props {
  mode?: "school" | "prayer" | "all";
}

export function AttendanceSettingsPanel({ mode = "all" }: Props) {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";

  const {
    schedules,
    holidays,
    location,
    mushollaLocation,
    saveSchedules,
    addHoliday,
    removeHoliday,
    saveLocation,
    saveMushollaLocation,
  } = useGasSettings(schoolId);
  const {
    prayerTypes,
    schedules: prayerSchedules,
    overrides,
    classes,
    loading: prayerConfigLoading,
    savePrayerTypes,
    saveSchedules: savePrayerSchedules,
    saveOverrides,
  } = useGasPrayerConfig(schoolId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {mode === "prayer" ? (
          <>
            <div className="space-y-6 lg:col-span-2">
              <PrayerSystemSettingsPanel
                prayerTypes={prayerTypes}
                schedules={prayerSchedules}
                overrides={overrides}
                classes={classes}
                loading={prayerConfigLoading}
                savePrayerTypes={savePrayerTypes}
                saveSchedules={savePrayerSchedules}
                saveOverrides={saveOverrides}
              />
            </div>
            <div className="space-y-6">
              <HolidaySettingsCard holidays={holidays} addHoliday={addHoliday} removeHoliday={removeHoliday} />
            </div>
            <div className="space-y-6">
              <LocationSettingsCard
                location={location}
                saveLocation={saveLocation}
                mushollaLocation={mushollaLocation}
                saveMushollaLocation={saveMushollaLocation}
                mode={mode}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-6">
              <EffectiveDaysCard schedules={schedules} saveSchedules={saveSchedules} />
            </div>
            <div className="space-y-6">
              <HolidaySettingsCard holidays={holidays} addHoliday={addHoliday} removeHoliday={removeHoliday} />
              <LocationSettingsCard
                location={location}
                saveLocation={saveLocation}
                mushollaLocation={mushollaLocation}
                saveMushollaLocation={saveMushollaLocation}
                mode={mode}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
