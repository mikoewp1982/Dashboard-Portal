/** School-day / prayer-day rules — parity with APK `PresensiRuleUtils.kt`. */

export type DayScheduleRule = {
  dayId: number;
  startTime: string;
  endTime: string;
  isHoliday: boolean;
};

export type HolidayRule = {
  date: string;
  description: string;
};

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function parseScheduleSnapshot(raw: unknown): Record<number, DayScheduleRule> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<number, DayScheduleRule> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const dayId = Number(key);
    if (!Number.isFinite(dayId)) continue;
    const row = (value || {}) as Record<string, unknown>;
    result[dayId] = {
      dayId,
      startTime: String(row.startTime || "00:00"),
      endTime: String(row.endTime || "00:00"),
      isHoliday: Boolean(row.isHoliday),
    };
  }
  return result;
}

export function parseHolidaySnapshot(raw: unknown): HolidayRule[] {
  if (!raw || typeof raw !== "object") return [];
  const result: HolidayRule[] = [];
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const row = (value || {}) as Record<string, unknown>;
    const date = String(row.date || "").trim();
    if (!date) continue;
    result.push({
      date,
      description: String(row.description || "").trim(),
    });
  }
  return result;
}

function isFutureDay(calendar: Date, today = new Date()): boolean {
  return startOfDay(calendar.getTime()) > startOfDay(today.getTime());
}

function findHoliday(holidays: HolidayRule[], dateKey: string): HolidayRule | undefined {
  return holidays.find((h) => h.date === dateKey);
}

/** JS: getDay() Sunday=0 … Saturday=6. Android Calendar: Sunday=1 … Saturday=7. */
function toAndroidDayOfWeek(date: Date): number {
  return date.getDay() + 1;
}

function resolveScheduleRule(
  dayOfWeek: number,
  schedules: Record<number, DayScheduleRule>,
  defaultStartTime: string,
  defaultEndTime: string
): DayScheduleRule {
  const explicit = schedules[dayOfWeek];
  if (explicit) return explicit;

  const scheduleEmpty = Object.keys(schedules).length === 0;
  // Android Calendar.SUNDAY = 1
  const defaultHoliday = dayOfWeek === 1;
  return {
    dayId: dayOfWeek,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    isHoliday: scheduleEmpty ? defaultHoliday : true,
  };
}

export function isValidSchoolDay(
  date: Date,
  schedules: Record<number, DayScheduleRule>,
  holidays: HolidayRule[],
  defaultStartTime = "07:00",
  defaultEndTime = "13:30"
): boolean {
  if (isFutureDay(date)) return false;
  if (findHoliday(holidays, toDateKey(date))) return false;
  const rule = resolveScheduleRule(
    toAndroidDayOfWeek(date),
    schedules,
    defaultStartTime,
    defaultEndTime
  );
  return !rule.isHoliday;
}

export function isValidPrayerDay(
  date: Date,
  schedules: Record<number, DayScheduleRule>,
  holidays: HolidayRule[],
  defaultStartTime = "12:00",
  defaultEndTime = "12:30"
): boolean {
  if (isFutureDay(date)) return false;
  if (findHoliday(holidays, toDateKey(date))) return false;
  const rule = resolveScheduleRule(
    toAndroidDayOfWeek(date),
    schedules,
    defaultStartTime,
    defaultEndTime
  );
  return !rule.isHoliday;
}

export function createStoredTimestampForSelectedDate(selectedDateMs: number, nowMs = Date.now()): number {
  const selected = new Date(selectedDateMs);
  const now = new Date(nowMs);
  selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return selected.getTime();
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function lastCountableDay(year: number, monthIndex: number, today = new Date()): number {
  const isCurrent = today.getFullYear() === year && today.getMonth() === monthIndex;
  return isCurrent ? today.getDate() : daysInMonth(year, monthIndex);
}
