import { normalizeClassName, readStudentClass } from "@/lib/guru/normalizeClass";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

export type GuruStudent = {
  id: string;
  recordId: string;
  name: string;
  nisn: string;
  username: string;
  className: string;
  schoolId: string;
  religion: string;
  gender: string;
  identities: string[];
};

export function normalizeIdentity(value: unknown): string {
  return String(value || "").trim();
}

export function studentIdentityCandidates(student: {
  recordId?: string;
  id?: string;
  nisn?: string;
  username?: string;
}): string[] {
  return [
    normalizeIdentity(student.recordId),
    normalizeIdentity(student.id),
    normalizeIdentity(student.nisn),
    normalizeIdentity(student.username),
  ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
}

export function preferredStudentIdentity(student: {
  recordId?: string;
  id?: string;
  nisn?: string;
  username?: string;
}): string {
  return studentIdentityCandidates(student)[0] || "";
}

export function monthlyCanonicalStudentId(student: {
  recordId?: string;
  id?: string;
  nisn?: string;
  username?: string;
}): string {
  return [
    normalizeIdentity(student.recordId),
    normalizeIdentity(student.id),
    normalizeIdentity(student.nisn),
    normalizeIdentity(student.username),
  ].find(Boolean) || "";
}

export function attendanceIdentityKey(studentId?: string, nisn?: string): string {
  return [normalizeIdentity(studentId), normalizeIdentity(nisn)].find(Boolean) || "";
}

export function parseGuruStudent(
  key: string,
  row: Record<string, unknown>,
  schoolId: string
): GuruStudent {
  const id = key || normalizeIdentity(row.id);
  const nisn = normalizeIdentity(row.nisn);
  const username = normalizeIdentity(row.username);
  const recordId = normalizeIdentity(row.recordId) || id;
  const identities = studentIdentityCandidates({ recordId, id, nisn, username });

  return {
    id,
    recordId,
    name: String(row.name || row.nama || "Siswa").trim(),
    nisn,
    username,
    className: readStudentClass(row),
    schoolId: normalizeSchoolId(row.schoolId) || schoolId,
    religion: String(row.religion || row.agama || "").trim(),
    gender: String(row.gender || row.jenis_kelamin || "").trim(),
    identities,
  };
}

export function filterHomeroomStudents(
  students: GuruStudent[],
  homeroomClass: string,
  schoolId: string
): GuruStudent[] {
  const target = normalizeClassName(homeroomClass);
  if (!target) return [];
  const scope = normalizeSchoolId(schoolId);

  return students
    .filter((s) => {
      if (normalizeClassName(s.className) !== target) return false;
      if (scope && s.schoolId && s.schoolId !== scope) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function buildIdentityMap(students: GuruStudent[]): Map<string, GuruStudent> {
  const map = new Map<string, GuruStudent>();
  students.forEach((student) => {
    student.identities.forEach((id) => {
      const key = id.toLowerCase();
      if (!map.has(key)) map.set(key, student);
    });
  });
  return map;
}

export function matchStudentByRow(
  row: Record<string, unknown>,
  identityMap: Map<string, GuruStudent>
): GuruStudent | undefined {
  const keys = [row.studentId, row.nisn, row.username]
    .map((v) => normalizeIdentity(v).toLowerCase())
    .filter(Boolean);
  for (const key of keys) {
    const hit = identityMap.get(key);
    if (hit) return hit;
  }
  return undefined;
}

export function isNonMuslim(religion: string): boolean {
  const normalized = religion.trim().toLowerCase();
  if (!normalized) return false;
  return normalized !== "islam" && normalized !== "muslim";
}

export function isMaleStudent(gender: string): boolean {
  const normalized = gender.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === "l" ||
    normalized === "lk" ||
    normalized === "male" ||
    normalized.includes("laki") ||
    normalized.includes("putra")
  );
}

export function sanitizeRecordId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_\-]/g, "_");
}

export function normalizeAttendanceStatus(value: unknown): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  switch (raw) {
    case "PRESENT":
    case "HADIR":
    case "TEPAT WAKTU":
    case "ON TIME":
    case "LATE":
    case "TERLAMBAT":
      return "PRESENT";
    case "SICK":
    case "SAKIT":
      return "SICK";
    case "PERMIT":
    case "IZIN":
    case "LEAVE":
      return "PERMIT";
    case "ABSENT":
    case "ALPA":
    case "ALPHA":
    case "UNMARKED":
      return "ABSENT";
    default:
      return raw || "UNMARKED";
  }
}

export function normalizeAttendanceMonthStatus(value: unknown): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  switch (raw) {
    case "PRESENT":
    case "HADIR":
    case "TEPAT WAKTU":
    case "ON TIME":
      return "PRESENT";
    case "LATE":
    case "TERLAMBAT":
      return "LATE";
    case "SICK":
    case "SAKIT":
      return "SICK";
    case "PERMIT":
    case "IZIN":
    case "LEAVE":
      return "PERMIT";
    case "ABSENT":
    case "ALPA":
    case "ALPHA":
    case "UNMARKED":
      return "ABSENT";
    default:
      return "ABSENT";
  }
}

export function toPrayerLabel(status: unknown): string {
  switch (String(status || "").trim().toUpperCase()) {
    case "PRAY":
      return "Sudah Presensi";
    case "PERMIT":
      return "Izin";
    case "HALANGAN":
      return "Halangan";
    case "NOT_PRAY":
      return "Tidak Sholat";
    default:
      return "Belum Presensi";
  }
}
