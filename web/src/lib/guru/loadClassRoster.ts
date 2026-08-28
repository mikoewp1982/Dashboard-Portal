import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  filterHomeroomStudents,
  parseGuruStudent,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";
import {
  parseHolidaySnapshot,
  parseScheduleSnapshot,
  type DayScheduleRule,
  type HolidayRule,
} from "@/lib/guru/presensiRules";

export type PrayerTypeConfigLite = {
  id: string;
  activeDays: number[];
};

export type PrayerClassScheduleLite = {
  id: string;
  prayerType: string;
  classIds: string[];
  dayOfWeek: number;
  active: boolean;
};

export type PrayerDateOverrideLite = {
  id: string;
  date: string;
  prayerType: string;
  classIds: string[];
  action: "activate" | "deactivate";
};

export type PrayerRecapRules = {
  types: Record<string, PrayerTypeConfigLite>;
  schedules: PrayerClassScheduleLite[];
  overrides: PrayerDateOverrideLite[];
};

const PRAYER_DEFAULT_ACTIVE_DAYS: Record<string, number[]> = {
  DZUHUR: [1, 2, 3, 4, 5, 6],
  DHUHA: [1, 2, 3, 4, 5, 6],
  JUMAT: [5],
};

const parseClassIds = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v || "").trim()).filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .flatMap(([k, v]) => {
        if (v === true) return [String(k || "").trim()];
        return [String(v || "").trim()];
      })
      .filter(Boolean);
  }
  return [];
};

export function resolvePrayerActiveDaysForClass(
  prayerType: string,
  classNameOrId: string | undefined,
  types: Record<string, PrayerTypeConfigLite> | undefined,
  schedules: PrayerClassScheduleLite[] = []
): number[] {
  const fallback = PRAYER_DEFAULT_ACTIVE_DAYS[prayerType] ?? [1, 2, 3, 4, 5, 6];
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
  const type = types?.[prayerType];
  if (Array.isArray(type?.activeDays) && type.activeDays.length > 0) {
    return type.activeDays.slice();
  }
  return fallback;
}

export async function loadPrayerRules(schoolId: string): Promise<PrayerRecapRules> {
  const scope = normalizeSchoolId(schoolId);
  const empty: PrayerRecapRules = { types: {}, schedules: [], overrides: [] };
  if (!scope) return empty;

  const base = `school_settings/${scope}/prayer_v2`;
  const [typesSnap, schedulesSnap, overridesSnap] = await Promise.all([
    adminDb.ref(`${base}/types`).once("value"),
    adminDb.ref(`${base}/schedules`).once("value"),
    adminDb.ref(`${base}/overrides`).once("value"),
  ]);

  const types: Record<string, PrayerTypeConfigLite> = {};
  if (typesSnap.exists() && typesSnap.val() && typeof typesSnap.val() === "object") {
    for (const [id, val] of Object.entries(typesSnap.val() as Record<string, any>)) {
      const daysRaw = val?.activeDays;
      const activeDays: number[] = Array.isArray(daysRaw)
        ? daysRaw.map((d) => Number(d)).filter((d) => Number.isFinite(d) && d >= 0 && d <= 6)
        : PRAYER_DEFAULT_ACTIVE_DAYS[id] ?? [1, 2, 3, 4, 5, 6];
      types[id] = { id, activeDays };
    }
  }

  const schedules: PrayerClassScheduleLite[] = [];
  if (schedulesSnap.exists() && schedulesSnap.val() && typeof schedulesSnap.val() === "object") {
    for (const [id, val] of Object.entries(schedulesSnap.val() as Record<string, any>)) {
      schedules.push({
        id,
        prayerType: String(val?.prayerType || "DHUHA"),
        classIds: parseClassIds(val?.classIds),
        dayOfWeek: Number(val?.dayOfWeek ?? 1),
        active: val?.active !== false,
      });
    }
  }

  const overrides: PrayerDateOverrideLite[] = [];
  if (overridesSnap.exists() && overridesSnap.val() && typeof overridesSnap.val() === "object") {
    for (const [id, val] of Object.entries(overridesSnap.val() as Record<string, any>)) {
      overrides.push({
        id,
        date: String(val?.date || "").trim(),
        prayerType: String(val?.prayerType || "DHUHA"),
        classIds: parseClassIds(val?.classIds),
        action: val?.action === "activate" ? "activate" : "deactivate",
      });
    }
  }

  return { types, schedules, overrides };
}

export function isEffectivePrayerDay(
  input: { date: Date; className?: string; prayerType: string },
  rules: { types?: Record<string, PrayerTypeConfigLite>; schedules?: PrayerClassScheduleLite[]; overrides?: PrayerDateOverrideLite[] },
  _presensi: { schedules: Record<number, DayScheduleRule>; holidays: HolidayRule[] },
  baseIsValidPrayerDay: (d: Date) => boolean,
  toDateKeyFn: (d: Date | number) => string
): boolean {
  const { date, className, prayerType } = input;
  if (!baseIsValidPrayerDay(date)) return false;
  const { types = {}, schedules = [], overrides = [] } = rules;
  const effectiveActiveDays = new Set(
    resolvePrayerActiveDaysForClass(prayerType, className, types, schedules)
  );
  const canonicalClass = String(className || "").trim().toUpperCase();
  const dateKey = toDateKeyFn(date);
  for (const ov of overrides) {
    if (!ov || ov.prayerType !== prayerType) continue;
    if (canonicalClass && (ov.classIds || []).length > 0) {
      const matched = (ov.classIds || []).some(
        (c) => String(c || "").trim().toUpperCase() === canonicalClass
      );
      if (!matched) continue;
    }
    if (ov.date !== dateKey) continue;
    if (ov.action === "activate") return true;
    if (ov.action === "deactivate") return false;
  }
  const jsDay = (() => {
    const noon = Date.parse(`${toDateKeyFn(date)}T12:00:00+07:00`);
    return new Date(noon).getUTCDay();
  })();
  return effectiveActiveDays.has(jsDay);
}

export async function loadHomeroomStudents(
  schoolId: string,
  className: string
): Promise<GuruStudent[]> {
  const scope = normalizeSchoolId(schoolId);
  const students: GuruStudent[] = [];

  const scopedSnap = await adminDb.ref(`gas/schools/${scope}/students`).once("value");
  if (scopedSnap.exists()) {
    scopedSnap.forEach((child) => {
      const row = (child.val() || {}) as Record<string, unknown>;
      students.push(parseGuruStudent(child.key || "", row, scope));
    });
  } else {
    const fallback = await adminDb.ref("students").once("value");
    fallback.forEach((child) => {
      const row = (child.val() || {}) as Record<string, unknown>;
      const rowSchool = normalizeSchoolId(row.schoolId);
      if (scope && rowSchool && rowSchool !== scope) return;
      students.push(parseGuruStudent(child.key || "", row, scope));
    });
  }

  return filterHomeroomStudents(students, className, scope);
}

export async function loadAttendanceRules(schoolId: string): Promise<{
  schedules: Record<number, DayScheduleRule>;
  holidays: HolidayRule[];
}> {
  const scope = normalizeSchoolId(schoolId);

  let schedules: Record<number, DayScheduleRule> = {};
  let holidays: HolidayRule[] = [];

  const legacySchedules = await adminDb.ref("schedules").once("value");
  if (legacySchedules.exists()) {
    schedules = parseScheduleSnapshot(legacySchedules.val());
  }
  const legacyHolidays = await adminDb.ref("holidays").once("value");
  if (legacyHolidays.exists()) {
    holidays = parseHolidaySnapshot(legacyHolidays.val());
  }

  if (scope) {
    const scopedSchedules = await adminDb
      .ref(`school_settings/${scope}/attendance/schedules`)
      .once("value");
    if (scopedSchedules.exists()) {
      schedules = parseScheduleSnapshot(scopedSchedules.val());
    }
    const scopedHolidays = await adminDb
      .ref(`school_settings/${scope}/attendance/holidays`)
      .once("value");
    if (scopedHolidays.exists()) {
      holidays = parseHolidaySnapshot(scopedHolidays.val());
    }
  }

  return { schedules, holidays };
}

export function asLong(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}
