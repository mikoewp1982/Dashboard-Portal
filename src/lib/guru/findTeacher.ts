import { adminDb } from "@/lib/firebase-admin";

export type TeacherRow = Record<string, unknown>;

export function readTeacherString(source: TeacherRow | null | undefined, ...keys: string[]) {
  if (!source) return "";
  for (const key of keys) {
    const value = String(source[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function isTeacherActive(row: TeacherRow | null | undefined) {
  if (!row) return false;
  if (row.isActive === false) return false;
  const status = readTeacherString(row, "status").toLowerCase();
  if (!status) return true;
  return !["nonaktif", "inactive", "disabled", "non-aktif"].includes(status);
}

function normalizeCredential(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * Resolve teacher from the same master path as admin Database → Guru/Wali Kelas
 * and APK GAS Guru: `gas/schools/{schoolId}/teachers`.
 */
export async function findTeacher(
  schoolId: string,
  credential: string
): Promise<{ id: string; row: TeacherRow } | null> {
  const needle = String(credential || "").trim();
  if (!schoolId || !needle) return null;

  const teachersRef = adminDb.ref(`gas/schools/${schoolId}/teachers`);
  const normalizedNeedle = normalizeCredential(needle);

  const directSnap = await teachersRef.child(needle).get();
  if (directSnap.exists()) {
    return { id: directSnap.key || needle, row: (directSnap.val() || {}) as TeacherRow };
  }

  for (const child of ["nuptk", "username", "credential"] as const) {
    try {
      const querySnap = await teachersRef.orderByChild(child).equalTo(needle).limitToFirst(5).get();
      if (!querySnap.exists()) continue;
      const entry = Object.entries(querySnap.val() as Record<string, TeacherRow>)[0];
      if (entry) return { id: entry[0], row: entry[1] || {} };
    } catch {
      // Missing index / permission — fall through to full scan.
    }
  }

  const allSnap = await teachersRef.get();
  if (!allSnap.exists()) return null;

  for (const [id, raw] of Object.entries(allSnap.val() as Record<string, TeacherRow>)) {
    const row = raw || {};
    const candidates = [
      id,
      readTeacherString(row, "nuptk", "credential", "username", "nip"),
    ].map(normalizeCredential);
    if (candidates.includes(normalizedNeedle)) {
      return { id, row };
    }
  }

  return null;
}
