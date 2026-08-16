export type PrayerTypeId = "DZUHUR" | "DHUHA" | "JUMAT";

export type PrayerScheduleMode =
  | "global_daily"
  | "class_schedule_hybrid"
  | "class_schedule_gender_gate";

export type PrayerEligibleGender = "all" | "male" | "female";

export type PrayerOverrideAction = "activate" | "deactivate";

export interface PrayerTypeConfig {
  id: PrayerTypeId;
  label: string;
  description: string;
  enabled: boolean;
  scheduleMode: PrayerScheduleMode;
  requireMuslim: boolean;
  eligibleGender: PrayerEligibleGender;
  locationRequired: boolean;
  startTime?: string;
  endTime?: string;
  activeDays?: number[];
}

export interface PrayerClassSchedule {
  id: string;
  prayerType: PrayerTypeId;
  classIds: string[];
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
  notes: string;
}

export interface PrayerDateOverride {
  id: string;
  date: string;
  prayerType: PrayerTypeId;
  classIds: string[];
  action: PrayerOverrideAction;
  notes: string;
}

export interface PrayerClassOption {
  id: string;
  label: string;
}
