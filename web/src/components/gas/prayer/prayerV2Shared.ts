import { normalizeClassName as normalizeClassCompact } from "@/lib/guru/normalizeClass";
import {
  GasClassRef,
  GasStudentRef,
  PrayerLogV2,
  PrayerTypeV2,
} from "@/hooks/gas/attendance/useGasPrayerAttendanceV2";
import {
  PrayerClassSchedule,
  PrayerDateOverride,
  PrayerTypeId,
} from "@/types/gasPrayerConfig";

export const PRAYER_V2_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const readStudentClassName = (student: GasStudentRef) =>
  String(student.className || student.class || student.kelas || "").trim();

export const readStudentReligion = (student: GasStudentRef) =>
  String(student.religion || student.agama || "").trim();

export const readStudentGender = (student: GasStudentRef) =>
  String(student.gender || student.jenis_kelamin || "").trim();

export const studentIdentityCandidates = (student: GasStudentRef) => {
  const candidates = [student.recordId, student.id, student.nisn, student.username]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return candidates.filter((v, i) => candidates.indexOf(v) === i);
};

export const buildStudentIdentityMap = (students: GasStudentRef[]) => {
  const map = new Map<string, GasStudentRef>();
  students.forEach((student) => {
    studentIdentityCandidates(student).forEach((id) => {
      const key = id.toLowerCase();
      if (!map.has(key)) map.set(key, student);
    });
  });
  return map;
};

export const matchStudentFromLog = (log: PrayerLogV2, map: Map<string, GasStudentRef>) => {
  const keys = [log.studentId, log.nisn, log.username].map((v) => String(v || "").trim().toLowerCase()).filter(Boolean);
  for (const key of keys) {
    const hit = map.get(key);
    if (hit) return hit;
  }
  return undefined;
};

export const buildDatesInMonthUpToToday = (year: number, month: number) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  if (year > currentYear || (year === currentYear && month > currentMonth)) return [];

  const total = new Date(year, month, 0).getDate();
  const limitDay = year === currentYear && month === currentMonth ? today.getDate() : total;
  const result: Date[] = [];
  for (let day = 1; day <= limitDay; day += 1) {
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    result.push(date);
  }
  return result;
};

export const toPrayerTypeV2 = (value: PrayerTypeId): PrayerTypeV2 => (value === "JUMAT" ? "JUMAT" : "DHUHA");

export function buildClassLabelMap(classes: GasClassRef[]) {
  const map = new Map<string, string>();
  (classes || []).forEach((item) => {
    const id = String(item.id || "").trim();
    if (!id) return;
    map.set(id, String(item.className || item.name || id).trim() || id);
  });
  return map;
}

export function isScheduledForClass(
  prayerType: PrayerTypeV2,
  dateKey: string,
  dayOfWeek: number,
  className: string,
  schedules: PrayerClassSchedule[],
  overrides: PrayerDateOverride[],
  classLabelMap: Map<string, string>
) {
  const normalizedClass = normalizeClassCompact(className);
  if (!normalizedClass) return false;

  const isClassMatch = (candidate: string) => {
    const raw = String(candidate || "").trim();
    if (!raw) return false;
    const label = classLabelMap.get(raw) || raw;
    const candidates = [raw, label].map((value) => normalizeClassCompact(value)).filter(Boolean);
    return candidates.some((value) => value === normalizedClass);
  };

  const off = overrides.find(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "deactivate" &&
      item.classIds.some(isClassMatch)
  );
  if (off) return false;

  const on = overrides.find(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "activate" &&
      item.classIds.some(isClassMatch)
  );
  if (on) return true;

  return schedules.some(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.active &&
      item.dayOfWeek === dayOfWeek &&
      item.classIds.some(isClassMatch)
  );
}
