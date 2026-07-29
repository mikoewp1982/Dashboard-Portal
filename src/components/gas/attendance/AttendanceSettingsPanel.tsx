"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { EffectiveDaysCard } from "./settings/EffectiveDaysCard";
import { HolidaySettingsCard } from "./settings/HolidaySettingsCard";
import { LocationSettingsCard } from "./settings/LocationSettingsCard";
import { SystemUsageStartCard } from "./settings/SystemUsageStartCard";

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
    systemUsageStartDate,
    saveSchedules,
    addHoliday,
    removeHoliday,
    saveLocation,
    saveMushollaLocation,
    saveSystemUsageStartDate,
  } = useGasSettings(schoolId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <EffectiveDaysCard schedules={schedules} saveSchedules={saveSchedules} />
        </div>
        <div className="space-y-6">
          <SystemUsageStartCard startDate={systemUsageStartDate} saveStartDate={saveSystemUsageStartDate} />
          <HolidaySettingsCard holidays={holidays} addHoliday={addHoliday} removeHoliday={removeHoliday} />
          <LocationSettingsCard
            location={location}
            saveLocation={saveLocation}
            mushollaLocation={mushollaLocation}
            saveMushollaLocation={saveMushollaLocation}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}
