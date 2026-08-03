/** School-day / prayer-day rules — parity with APK `PresensiRuleUtils.kt`. */
/** All calendar math uses Asia/Jakarta so App Hosting (UTC) matches teacher devices (WIB). */

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

const JAKARTA_TZ = "Asia/Jakarta";
const JAKARTA_OFFSET = "+07:00";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD in Asia/Jakarta for an instant. */
export function toDateKey(input: Date | number): string {
  const ms = typeof input === "number" ? input : input.getTime();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function calendarDateToMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00${JAKARTA_OFFSET}`);
}

export function startOfDay(ms: number): number {
  return calendarDateToMs(toDateKey(ms));
}

export function endOfDay(ms: number): number {
  return Date.parse(`${toDateKey(ms)}T23:59:59.999${JAKARTA_OFFSET}`);
}

/**
 * Accepts epoch ms or YYYY-MM-DD. Always resolves to Asia/Jakarta midnight
 * for that calendar day (avoids UTC host shifting WIB midnight to previous day).
 */
export function parseDateParam(value: string | number | null | undefined): number {
  if (value == null || value === "") return startOfDay(Date.now());
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return calendarDateToMs(raw);
  }
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? startOfDay(n) : startOfDay(Date.now());
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? startOfDay(Date.now()) : startOfDay(parsed);
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

function isFutureDay(calendarMs: number, todayMs = Date.now()): boolean {
  return startOfDay(calendarMs) > startOfDay(todayMs);
}

function findHoliday(holidays: HolidayRule[], dateKey: string): HolidayRule | undefined {
  return holidays.find((h) => h.date === dateKey);
}

/** Android Calendar: Sunday=1 … Saturday=7, evaluated in Asia/Jakarta. */
function toAndroidDayOfWeek(ms: number): number {
  const noon = Date.parse(`${toDateKey(ms)}T12:00:00${JAKARTA_OFFSET}`);
  return new Date(noon).getUTCDay() + 1;
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
  const ms = date.getTime();
  if (isFutureDay(ms)) return false;
  if (findHoliday(holidays, toDateKey(ms))) return false;
  const rule = resolveScheduleRule(
    toAndroidDayOfWeek(ms),
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
  const ms = date.getTime();
  if (isFutureDay(ms)) return false;
  if (findHoliday(holidays, toDateKey(ms))) return false;
  const rule = resolveScheduleRule(
    toAndroidDayOfWeek(ms),
    schedules,
    defaultStartTime,
    defaultEndTime
  );
  return !rule.isHoliday;
}

export function createStoredTimestampForSelectedDate(selectedDateMs: number, nowMs = Date.now()): number {
  const dateKey = toDateKey(selectedDateMs);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(nowMs));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "00";
  let hour = pick("hour");
  // en-GB can emit "24" for midnight in some engines
  if (hour === "24") hour = "00";
  return Date.parse(
    `${dateKey}T${hour}:${pick("minute")}:${pick("second")}${JAKARTA_OFFSET}`
  );
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function lastCountableDay(year: number, monthIndex: number, today = new Date()): number {
  const [ty, tm, td] = toDateKey(today).split("-").map(Number);
  const isCurrent = ty === year && tm === monthIndex + 1;
  return isCurrent ? td : daysInMonth(year, monthIndex);
}

/** Noon Asia/Jakarta for a Y/M/D (monthIndex 0-based). Safe for day-of-week checks. */
export function jakartaCivilDateMs(year: number, monthIndex: number, day: number): number {
  return Date.parse(
    `${year}-${pad2(monthIndex + 1)}-${pad2(day)}T12:00:00${JAKARTA_OFFSET}`
  );
}
