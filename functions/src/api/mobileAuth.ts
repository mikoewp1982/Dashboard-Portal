import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createHash } from "crypto";

type SchoolRegistryRow = {
  schoolId?: string;
  npsn?: string;
  name?: string;
  authEmail?: string;
  adminEmail?: string;
  isActive?: boolean;
};

type StudentRow = Record<string, unknown>;

function normalizeValue(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLookupKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function readString(source: Record<string, unknown> | null | undefined, ...keys: string[]) {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function sha256Hex(input: string) {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

async function resolveCanonicalSchoolContext(input: { schoolId?: unknown; npsn?: unknown }) {
  const schoolsSnap = await admin.database().ref("schools").get();
  const schools = schoolsSnap.exists() ? (schoolsSnap.val() as Record<string, SchoolRegistryRow>) : {};

  const candidates = [
    normalizeValue(input.schoolId),
    normalizeValue(input.npsn),
  ].filter(Boolean);

  for (const candidate of candidates) {
    for (const [key, row] of Object.entries(schools)) {
      const pool = [
        normalizeValue(key),
        normalizeValue(row.schoolId),
        normalizeValue(row.npsn),
        normalizeValue(row.authEmail),
        normalizeValue(row.adminEmail),
      ];

      if (pool.includes(candidate)) {
        return {
          schoolId: normalizeValue(row.schoolId || key),
          npsn: String(row.npsn || "").trim(),
          name: String(row.name || "").trim(),
          isActive: row.isActive !== false,
        };
      }
    }
  }

  return null;
}

function verifyCredential(student: StudentRow, rawPassword: string) {
  const normalizedPassword = rawPassword.trim();
  const passwordHash = readString(student, "passwordHash", "credentialHash");
  if (passwordHash) {
    return passwordHash.toLowerCase() === sha256Hex(normalizedPassword);
  }

  const plainCandidates = new Set([
    readString(student, "password"),
    readString(student, "credential"),
    readString(student, "nisn"),
  ].filter(Boolean));

  if (!plainCandidates.size) return false;

  const normalizedScope = normalizeValue(normalizedPassword);
  return Array.from(plainCandidates).some((candidate) => normalizeValue(candidate) === normalizedScope);
}

function findStudentEntry(students: Record<string, StudentRow>, usernameInput: string, userPassword: string) {
  const usernameKey = normalizeLookupKey(usernameInput.split("@")[0] || usernameInput);
  const passwordKey = userPassword.trim();

  const directEntry = Object.entries(students).find(([key]) => String(key).trim() === passwordKey);
  if (directEntry) return directEntry;

  const byNisn = Object.entries(students).find(([, row]) => normalizeValue(row.nisn) === normalizeValue(passwordKey));
  if (byNisn) return byNisn;

  const byUsername = Object.entries(students).find(([, row]) => normalizeLookupKey(row.username) === usernameKey);
  if (byUsername) return byUsername;

  const byName = Object.entries(students).find(([, row]) => normalizeLookupKey(row.name) === usernameKey);
  if (byName) return byName;

  return null;
}

export const registerStudentDevice = functions.https.onRequest(async (req, res) => {
  res.set("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  try {
    const requestedSchoolId = String(req.body?.requestedSchoolId || "").trim();
    const usernameInput = String(req.body?.usernameInput || "").trim();
    const userPassword = String(req.body?.userPassword || "").trim();
    const deviceId = String(req.body?.deviceId || "").trim();

    if (!requestedSchoolId || !usernameInput || !userPassword || !deviceId) {
      res.status(400).json({ success: false, message: "requestedSchoolId, usernameInput, userPassword, dan deviceId wajib diisi." });
      return;
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: requestedSchoolId,
      npsn: requestedSchoolId,
    });

    if (!schoolContext?.schoolId) {
      res.status(404).json({ success: false, message: "Sekolah tidak ditemukan." });
      return;
    }

    if (!schoolContext.isActive) {
      res.status(403).json({ success: false, message: "Layanan sekolah tidak aktif. Hubungi admin sekolah." });
      return;
    }

    const studentsRef = admin.database().ref(`gas/schools/${schoolContext.schoolId}/students`);
    const studentsSnap = await studentsRef.get();
    const students = studentsSnap.exists() ? (studentsSnap.val() as Record<string, StudentRow>) : {};

    const studentEntry = findStudentEntry(students, usernameInput, userPassword);
    if (!studentEntry) {
      res.status(404).json({ success: false, message: "Data profil siswa tidak ditemukan di sekolah ini." });
      return;
    }

    const [studentKey, student] = studentEntry;
    if (!verifyCredential(student, userPassword)) {
      res.status(401).json({ success: false, message: "Password (NISN) siswa tidak valid." });
      return;
    }

    const registeredDeviceId = readString(student, "deviceId", "device");
    if (registeredDeviceId && registeredDeviceId !== deviceId) {
      res.status(409).json({ success: false, message: "Akun ini terkunci pada perangkat lain. Hubungi Admin/Wali Kelas untuk reset." });
      return;
    }

    const now = Date.now();
    const nisnValue = readString(student, "nisn") || studentKey;
    const studentPath = `gas/schools/${schoolContext.schoolId}/students/${studentKey}`;

    await admin.database().ref().update({
      [`${studentPath}/deviceId`]: deviceId,
      [`${studentPath}/device`]: deviceId,
      [`${studentPath}/lastLogin`]: now,
      [`${studentPath}/lastLoginAt`]: now,
      [`master_students/${nisnValue}/deviceId`]: deviceId,
      [`master_students/${nisnValue}/device`]: deviceId,
    });

    res.status(200).json({
      success: true,
      message: "Perangkat siswa berhasil didaftarkan.",
      data: {
        schoolId: schoolContext.schoolId,
        npsn: schoolContext.npsn,
        schoolName: schoolContext.name,
        studentId: nisnValue,
        className: readString(student, "className", "class", "kelas"),
        displayName: readString(student, "name", "nama"),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    console.error("registerStudentDevice error:", error);
    res.status(500).json({ success: false, message });
  }
});
