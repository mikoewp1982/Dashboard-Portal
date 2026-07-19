import { adminDb } from "@/lib/firebase-admin";

type SchoolRegistryRow = {
  schoolId?: string;
  npsn?: string;
  name?: string;
  authEmail?: string;
  adminEmail?: string;
};

export type CanonicalSchoolContext = {
  schoolId: string;
  npsn: string;
  name: string;
  authEmail: string;
  adminEmail: string;
};

function normalizeValue(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function toContext(key: string, row: SchoolRegistryRow | null | undefined): CanonicalSchoolContext | null {
  if (!row) return null;

  const schoolId = normalizeValue(row.schoolId || key);
  if (!schoolId) return null;

  return {
    schoolId,
    npsn: String(row.npsn || "").trim(),
    name: String(row.name || "").trim(),
    authEmail: String(row.authEmail || "").trim().toLowerCase(),
    adminEmail: String(row.adminEmail || "").trim().toLowerCase(),
  };
}

function matchesCandidate(key: string, row: SchoolRegistryRow, candidate: string) {
  if (!candidate) return false;

  const normalizedKey = normalizeValue(key);
  const normalizedSchoolId = normalizeValue(row.schoolId);
  const normalizedNpsn = normalizeValue(row.npsn);
  const normalizedAuthEmail = normalizeValue(row.authEmail);
  const normalizedAdminEmail = normalizeValue(row.adminEmail);

  return [
    normalizedKey,
    normalizedSchoolId,
    normalizedNpsn,
    normalizedAuthEmail,
    normalizedAdminEmail,
  ].includes(candidate);
}

async function getSchoolsSnapshot() {
  const snapshot = await adminDb.ref("schools").get();
  return snapshot.exists() ? (snapshot.val() as Record<string, SchoolRegistryRow>) : {};
}

export async function resolveCanonicalSchoolContext(input: {
  schoolId?: unknown;
  npsn?: unknown;
  email?: unknown;
}) {
  const normalizedSchoolId = normalizeValue(input.schoolId);
  const normalizedNpsn = normalizeValue(input.npsn);
  const normalizedEmail = normalizeValue(input.email);
  const candidateOrder = [normalizedSchoolId, normalizedNpsn, normalizedEmail].filter(Boolean);

  if (normalizedNpsn) {
    const byNpsn = await adminDb.ref("schools").orderByChild("npsn").equalTo(String(input.npsn || "").trim()).get();
    if (byNpsn.exists()) {
      const entries = Object.entries(byNpsn.val() as Record<string, SchoolRegistryRow>);
      const firstMatch = entries[0];
      if (firstMatch) {
        const context = toContext(firstMatch[0], firstMatch[1]);
        if (context) return context;
      }
    }
  }

  if (!candidateOrder.length) return null;

  const schools = await getSchoolsSnapshot();
  for (const candidate of candidateOrder) {
    for (const [key, row] of Object.entries(schools)) {
      if (matchesCandidate(key, row, candidate)) {
        const context = toContext(key, row);
        if (context) return context;
      }
    }
  }

  if (!normalizedSchoolId) return null;

  return {
    schoolId: normalizedSchoolId,
    npsn: String(input.npsn || "").trim(),
    name: "",
    authEmail: normalizedEmail,
    adminEmail: normalizedEmail,
  } satisfies CanonicalSchoolContext;
}
