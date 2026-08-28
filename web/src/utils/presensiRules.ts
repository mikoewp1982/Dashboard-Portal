export interface PresensiScheduleLike {
  dayId: number;
  isEnabled: boolean;
}

export interface PresensiHolidayLike {
  date: string;
}

export function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeClassName(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

export function compareClassNames(a: string, b: string) {
  const gradeFrom = (name: string) => {
    const raw = normalizeClassName(name);
    if (raw.startsWith("VIII")) return 8;
    if (raw.startsWith("VII")) return 7;
    if (raw.startsWith("IX")) return 9;
    const compact = raw.replace(/\s+/g, "").replace(/-/g, "");
    if (compact.startsWith("7")) return 7;
    if (compact.startsWith("8")) return 8;
    if (compact.startsWith("9")) return 9;
    return 999;
  };

  const suffixFrom = (name: string) => {
    const raw = normalizeClassName(name);
    const roman = raw.match(/^(VIII|VII|IX)\s*[- ]?\s*(.*)$/);
    if (roman) return String(roman[2] || "").trim();
    const compact = raw.replace(/\s+/g, "").replace(/-/g, "");
    const numeric = compact.match(/^(7|8|9)(.*)$/);
    if (numeric) return String(numeric[2] || "").trim();
    return raw;
  };

  const gradeA = gradeFrom(a);
  const gradeB = gradeFrom(b);
  if (gradeA !== gradeB) return gradeA - gradeB;
  return suffixFrom(a).localeCompare(suffixFrom(b), "id-ID", { numeric: true, sensitivity: "base" });
}

export function toDateKey(value: Date | number | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildHolidaySet(holidays: PresensiHolidayLike[]) {
  return new Set((holidays || []).map((holiday) => toDateKey(holiday.date)));
}

export function getValidDatesInMonth(options: {
  year: number;
  month: number;
  schedules: PresensiScheduleLike[];
  holidays: PresensiHolidayLike[];
  today?: Date;
}) {
  const { year, month, schedules, holidays, today = new Date() } = options;
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidaySet = buildHolidaySet(holidays || []);
  
  // Jika schedules kosong, kita asumsikan hari Senin (1) sampai Jumat (5) aktif (sebagai fallback default)
  const defaultSchedules = [1, 2, 3, 4, 5];
  const enabledDayIds = schedules && schedules.length > 0
    ? new Set(schedules.filter((s) => s.isEnabled).map((s) => s.dayId))
    : new Set(defaultSchedules);

  const result: Date[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    // Hanya hari yang sudah terlewati atau hari ini
    if (date.getTime() > new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) continue;
    // 0 adalah minggu (asumsi libur), namun jika ada schedule khusus tetap bisa diikuti
    if (date.getDay() === 0 && !enabledDayIds.has(0)) continue;
    // Jika tidak aktif hari itu
    if (!enabledDayIds.has(date.getDay())) continue;
    // Jika libur
    if (holidaySet.has(toDateKey(date))) continue;
    
    result.push(date);
  }

  return result;
}

export function createStudentDateKey(studentId: string, dateKey: string) {
  return `${String(studentId || "").trim()}__${dateKey}`;
}

export function pickNewestLog<T extends { updatedAt?: number; createdAt?: number; date?: number | string }>(current: T | undefined, next: T) {
  if (!current) return next;
  // Gunakan timestamp terbaru
  const currentScore = typeof current.date === 'string' ? new Date(current.date).getTime() : Number(current.updatedAt || current.createdAt || current.date || 0);
  const nextScore = typeof next.date === 'string' ? new Date(next.date).getTime() : Number(next.updatedAt || next.createdAt || next.date || 0);
  return nextScore >= currentScore ? next : current;
}

export interface PrayerClassScheduleLike {
  id: string;
  prayerType: "DZUHUR" | "DHUHA" | "JUMAT" | (string & {});
  classIds: string[];
  dayOfWeek: number;
  active: boolean;
}

export interface PrayerDateOverrideLike {
  id: string;
  date: string;
  prayerType: "DZUHUR" | "DHUHA" | "JUMAT" | (string & {});
  classIds: string[];
  action: "activate" | "deactivate";
}

const DEFAULT_PRAYER_ACTIVE_DAYS: Record<string, number[]> = {
  DZUHUR: [1, 2, 3, 4, 5, 6],
  DHUHA: [1, 2, 3, 4, 5, 6],
  JUMAT: [5],
};

export function resolvePrayerActiveDaysForClass(
  prayerType: "DZUHUR" | "DHUHA" | "JUMAT" | (string & {}),
  classNameOrId: string | undefined,
  globalActiveDays: number[] | undefined,
  schedules: PrayerClassScheduleLike[] = []
): number[] {
  const fallbackDays = DEFAULT_PRAYER_ACTIVE_DAYS[prayerType] ?? [1, 2, 3, 4, 5, 6];
  const canonicalClass = String(classNameOrId || "").trim().toUpperCase();
  const scoped = schedules.filter(
    (s) =>
      s &&
      s.prayerType === prayerType &&
      s.active !== false &&
      (s.classIds || []).some((c) => String(c || "").trim().toUpperCase() === canonicalClass)
  );
  if (scoped.length > 0) {
    return scoped.map((s) => Number(s.dayOfWeek)).filter((d) => Number.isFinite(d) && d >= 0 && d <= 6);
  }
  if (Array.isArray(globalActiveDays) && globalActiveDays.length > 0) {
    return globalActiveDays.slice();
  }
  return fallbackDays;
}

export interface PrayerValidDatesOptions {
  year: number;
  month: number;
  schedules: PresensiScheduleLike[];
  holidays: PresensiHolidayLike[];
  today?: Date;
  prayerType: "DZUHUR" | "DHUHA" | "JUMAT" | (string & {});
  className?: string;
  globalActiveDays?: number[];
  prayerSchedules?: PrayerClassScheduleLike[];
  prayerOverrides?: PrayerDateOverrideLike[];
}

export function getValidPrayerDatesInMonth(options: PrayerValidDatesOptions): Date[] {
  const {
    year,
    month,
    schedules,
    holidays,
    today = new Date(),
    prayerType,
    className,
    globalActiveDays,
    prayerSchedules = [],
    prayerOverrides = [],
  } = options;

  const baseDates = getValidDatesInMonth({ year, month, schedules, holidays, today });
  const effectiveActiveDays = new Set(
    resolvePrayerActiveDaysForClass(prayerType, className, globalActiveDays, prayerSchedules)
  );

  const canonicalClass = String(className || "").trim().toUpperCase();
  const overrideByDate = new Map<string, "activate" | "deactivate">();
  for (const ov of prayerOverrides || []) {
    if (!ov || ov.prayerType !== prayerType) continue;
    if (canonicalClass && (ov.classIds || []).length > 0) {
      const matched = (ov.classIds || []).some(
        (c) => String(c || "").trim().toUpperCase() === canonicalClass
      );
      if (!matched) continue;
    }
    const dk = String(ov.date || "").trim();
    if (!dk) continue;
    overrideByDate.set(dk, ov.action === "activate" ? "activate" : "deactivate");
  }

  const result: Date[] = [];
  for (const date of baseDates) {
    const jsDay = date.getDay();
    const dateKey = toDateKey(date);
    const override = overrideByDate.get(dateKey);
    const inActive = effectiveActiveDays.has(jsDay);
    if (override === "activate") {
      result.push(date);
      continue;
    }
    if (override === "deactivate") continue;
    if (!inActive) continue;
    result.push(date);
  }
  return result;
}
