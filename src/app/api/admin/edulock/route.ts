import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

type EduLockAction = "reset-student-device";

type EduLockRequestBody = {
  action?: EduLockAction;
  studentId?: string;
  schoolId?: string;
};

type ActiveDeviceSnapshot = {
  deviceId: string;
  studentId: string;
  nisn: string;
  username: string;
  name: string;
  lastSeenAt: number | null;
  battery: number | null;
  latitude: number | null;
  longitude: number | null;
  isOutOfZone: boolean;
  trustScore: number | null;
  rawStatus: string;
  isOnline: boolean;
  isEmergencyUnlock: boolean;
  isUninstallBypass: boolean;
  isPermissionActive: boolean;
};

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "ya", "aktif"].includes(normalized)) return true;
      if (["false", "0", "no", "tidak", "nonaktif"].includes(normalized)) return false;
    }
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return null;
}

function parseActiveDevices(rawValue: unknown) {
  if (!rawValue || typeof rawValue !== "object") return [] as ActiveDeviceSnapshot[];

  const now = Date.now();
  return Object.entries(rawValue as Record<string, unknown>).map(([deviceId, rawRecord]) => {
    const record =
      rawRecord && typeof rawRecord === "object"
        ? (rawRecord as Record<string, unknown>)
        : {};

    const lastSeenAt = readNumber(record, "lastSeenAt", "lastSeen", "updatedAt", "timestamp");
    const rawStatus = readString(record, "status", "state", "connectionStatus");
    const insideSchool = readBoolean(record, "insideSchool", "isInsideSchool");
    const isOutOfZoneExplicit = readBoolean(record, "isOutOfZone", "outOfZone");
    const isEmergencyUnlock = readBoolean(record, "isEmergencyUnlock", "emergencyUnlock", "emergencyUnlocked") === true;
    const isUninstallBypass = readBoolean(record, "isUninstallBypass", "uninstallBypass", "uninstallAuthorized") === true;
    const isPermissionActive = readBoolean(record, "isPermissionActive", "permissionActive", "tempPermissionActive") === true;
    const computedOnline =
      rawStatus.toUpperCase() === "ONLINE" ||
      lastSeenAt === null ||
      now - lastSeenAt <= ONLINE_WINDOW_MS;

    return {
      deviceId,
      studentId: readString(record, "studentId", "studentKey", "id"),
      nisn: readString(record, "nisn", "studentNisn"),
      username: readString(record, "username"),
      name: readString(record, "name", "studentName"),
      lastSeenAt,
      battery: readNumber(record, "battery", "batteryLevel"),
      latitude: readNumber(record, "latitude", "lat"),
      longitude: readNumber(record, "longitude", "lng", "lon"),
      isOutOfZone:
        isOutOfZoneExplicit === true ||
        (insideSchool === false),
      trustScore: readNumber(record, "trustScore", "complianceScore"),
      rawStatus,
      isOnline: computedOnline,
      isEmergencyUnlock,
      isUninstallBypass,
      isPermissionActive,
    };
  });
}

async function resolveAuthorizedSchoolId(request: Request, requestedSchoolId?: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  if (!["admin", "super_admin"].includes(String(decodedToken.role || ""))) {
    throw new Error("Akses ditolak");
  }

  const schoolContext = await resolveCanonicalSchoolContext({
    schoolId: requestedSchoolId || String(decodedToken.schoolId || ""),
    npsn: String(decodedToken.npsn || ""),
    email: decodedToken.email,
  });

  if (!schoolContext?.schoolId) {
    throw new Error("School ID tidak ditemukan");
  }

  return schoolContext;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const schoolIdParam = String(url.searchParams.get("schoolId") || "").trim();
    const schoolContext = await resolveAuthorizedSchoolId(request, schoolIdParam);
    const schoolId = schoolContext.schoolId;

    const [studentsSnap, tenantRegistrySnap, activeDevicesSnap, mirrorRootSnap] = await Promise.all([
      adminDb.ref(`gas/schools/${schoolId}/students`).get(),
      adminDb.ref(`tenant_registry/${schoolId}`).get(),
      adminDb.ref(`active_devices/${schoolId}`).get(),
      adminDb.ref(`daily_attendance_mirror/${schoolId}`).limitToLast(7).get(),
    ]);

    const studentsValue = studentsSnap.val() as Record<string, Record<string, unknown>> | null;
    const students = Object.entries(studentsValue || {})
      .map(([id, value]) => ({
        id,
        ...value,
      }))
      .filter((student) => {
        const name = readString(student as Record<string, unknown>, "name", "studentName");
        return name && name.trim() !== "";
      });
    const boundStudentsCount = students.filter((student) => {
      const record = student as Record<string, unknown>;
      return Boolean(readString(record, "deviceId", "device"));
    }).length;

    const activeDevices = parseActiveDevices(activeDevicesSnap.val())
      .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
    const onlineDevices = activeDevices.filter((device) => device.isOnline);
    const outsideZoneCount = onlineDevices.filter((device) => device.isOutOfZone).length;
    const latestHeartbeatAt = onlineDevices.reduce<number | null>((latest, device) => {
      if (!device.lastSeenAt) return latest;
      if (latest === null || device.lastSeenAt > latest) return device.lastSeenAt;
      return latest;
    }, null);

    const mirrorRoot = mirrorRootSnap.val() as Record<string, Record<string, unknown>> | null;
    const mirrorDates = Object.keys(mirrorRoot || {}).sort().reverse();
    const latestMirrorDate = mirrorDates[0] || null;
    const latestMirrorEntries = latestMirrorDate ? Object.keys(mirrorRoot?.[latestMirrorDate] || {}) : [];

    const tenantRegistryValue =
      tenantRegistrySnap.val() && typeof tenantRegistrySnap.val() === "object"
        ? (tenantRegistrySnap.val() as Record<string, unknown>)
        : null;
    const strictModeEnabled =
      tenantRegistryValue !== null &&
      (readBoolean(tenantRegistryValue, "isActive", "enabled", "strictMode", "strictModeEnabled") !== false);

    return NextResponse.json({
      success: true,
      overview: {
        schoolId,
        schoolName: schoolContext.name || "",
        strictModeEnabled,
        tenantRegistered: tenantRegistryValue !== null,
        boundStudentsCount,
        totalStudentsCount: students.length,
        activeDevicesCount: onlineDevices.length,
        outsideZoneCount,
        latestHeartbeatAt,
        latestMirrorDate,
        latestMirrorCount: latestMirrorEntries.length,
        activeDevices,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    const status =
      message === "Unauthorized" ? 401 :
      message === "Akses ditolak" ? 403 :
      message === "School ID tidak ditemukan" ? 400 :
      500;
    console.error("API EduLock GET Error:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EduLockRequestBody;
    const schoolContext = await resolveAuthorizedSchoolId(request, body.schoolId);
    const schoolId = schoolContext.schoolId;

    if (body.action === "save-settings") {
      const settings = (body as any).settings;
      if (!settings || typeof settings !== "object") {
        return NextResponse.json({ success: false, error: "Settings tidak valid" }, { status: 400 });
      }
      
      const settingsRef = adminDb.ref(`edulock_settings/${schoolId}`);
      await settingsRef.update(settings);
      
      return NextResponse.json({
        success: true,
        message: "Pengaturan EduLock berhasil disimpan.",
      });
    }

    if (body.action === "generate-access-code") {
      const { sessionStart, sessionEnd, duration } = body as any;
      const code = "EDULOCK-" + Math.floor(1000 + Math.random() * 9000);
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // tomorrow
      
      const newCode = {
        sessionStart: sessionStart || "07:00",
        sessionEnd: sessionEnd || "14:00",
        duration: duration || 0,
        expiresAt,
      };
      
      await adminDb.ref(`edulock_access_codes/${schoolId}/${code}`).set(newCode);
      
      return NextResponse.json({
        success: true,
        message: "Kode berhasil dibuat.",
        code,
      });
    }

    if (body.action === "delete-access-code") {
      const code = (body as any).code;
      if (code) {
        await adminDb.ref(`edulock_access_codes/${schoolId}/${code}`).remove();
      }
      return NextResponse.json({ success: true, message: "Kode berhasil dihapus." });
    }

    if (body.action === "delete-expired-codes") {
      const codesSnap = await adminDb.ref(`edulock_access_codes/${schoolId}`).get();
      if (codesSnap.exists()) {
        const now = Date.now();
        const updates: Record<string, null> = {};
        codesSnap.forEach((child) => {
          const val = child.val();
          if (val && val.expiresAt && val.expiresAt < now) {
            updates[child.key!] = null;
          }
        });
        if (Object.keys(updates).length > 0) {
          await adminDb.ref(`edulock_access_codes/${schoolId}`).update(updates);
        }
      }
      return NextResponse.json({ success: true, message: "Kode expired berhasil dibersihkan." });
    }

    if (body.action === "reset-student-device") {
      const studentId = String(body.studentId || "").trim();
      if (!studentId) {
        return NextResponse.json({ success: false, error: "studentId wajib diisi" }, { status: 400 });
      }

      const studentRef = adminDb.ref(`gas/schools/${schoolId}/students/${studentId}`);
      const studentSnap = await studentRef.get();
      if (!studentSnap.exists()) {
        return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
      }

      const studentValue =
        studentSnap.val() && typeof studentSnap.val() === "object"
          ? (studentSnap.val() as Record<string, unknown>)
          : {};
      const nisn = readString(studentValue, "nisn");

      const updates: Record<string, null> = {
        [`gas/schools/${schoolId}/students/${studentId}/deviceId`]: null,
        [`gas/schools/${schoolId}/students/${studentId}/device`]: null,
      };

      if (nisn) {
        updates[`master_students/${nisn}/deviceId`] = null;
        updates[`master_students/${nisn}/device`] = null;
      }

      await adminDb.ref().update(updates);

      return NextResponse.json({
        success: true,
        message: "Binding device siswa berhasil direset.",
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server";
    const status =
      message === "Unauthorized" ? 401 :
      message === "Akses ditolak" ? 403 :
      message === "School ID tidak ditemukan" ? 400 :
      500;
    console.error("API EduLock POST Error:", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
