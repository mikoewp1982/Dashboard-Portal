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
