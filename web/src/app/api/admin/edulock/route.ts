export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { dispatchMasterSwitchCommand } from "@/lib/admin/edulockMasterSwitch";

type EduLockAction = "reset-student-device" | "save-settings" | "generate-access-code" | "delete-access-code" | "delete-expired-codes" | "grant-class-permission" | "revoke-class-permission" | "authorize-uninstall" | "authorize-uninstall-mass" | "toggle-uninstall" | "toggle-uninstall-mass" | "revoke-student-permission" | "revoke-all-permissions";

type EduLockRequestBody = {
  action?: EduLockAction;
  studentId?: string;
  schoolId?: string;
  nisn?: string;
  nisns?: string[];
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
  hasFcmToken: boolean;
  lastMasterSwitchCommandId: string;
  lastMasterSwitchAppliedAt: number | null;
  lastMasterSwitchAppliedState: boolean | null;
  lastMasterSwitchAckSource: string;
  isAccessibilityEnabled: boolean | null;
  isDeviceAdminEnabled: boolean | null;
  isProtectionActive: boolean | null;
  protectionHealth: string;
  complianceStatus: string;
  lastProtectionCheckAt: number | null;
  appVersionCode: number | null;
};

type LatestMasterSwitchCommandSnapshot = {
  commandId: string;
  requestedState: boolean;
  requestedAt: number | null;
  targetedDeviceCount: number;
  targetedTokenCount: number;
  fcmSuccessCount: number;
  fcmFailureCount: number;
  ackedDeviceCount: number;
  pendingDeviceCount: number;
};

const ONLINE_WINDOW_MS = 3 * 60 * 1000;

function parseClockTime(rawValue: string) {
  const value = String(rawValue || "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return {
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
    normalized: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function getDateWithMinutes(baseDate: Date, dayOffset: number, totalMinutes: number) {
  const result = new Date(baseDate);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + dayOffset);
  result.setMinutes(totalMinutes);
  return result;
}

function normalizeClassName(value: unknown) {
  return String(value || "").trim();
}

function resolveAccessCodeWindow(sessionStartRaw: string, sessionEndRaw: string, now = new Date()) {
  const sessionStart = parseClockTime(sessionStartRaw);
  const sessionEnd = parseClockTime(sessionEndRaw);
  if (!sessionStart || !sessionEnd) return null;

  if (sessionEnd.totalMinutes === sessionStart.totalMinutes) return null;

  const crossesMidnight = sessionEnd.totalMinutes < sessionStart.totalMinutes;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const totalDurationMinutes = crossesMidnight
    ? (24 * 60 - sessionStart.totalMinutes) + sessionEnd.totalMinutes
    : sessionEnd.totalMinutes - sessionStart.totalMinutes;

  if (totalDurationMinutes <= 0) return null;

  if (!crossesMidnight) {
    const useTomorrow = currentMinutes > sessionEnd.totalMinutes;
    const dayOffset = useTomorrow ? 1 : 0;
    return {
      sessionStart: sessionStart.normalized,
      sessionEnd: sessionEnd.normalized,
      duration: totalDurationMinutes,
      windowStartAt: getDateWithMinutes(now, dayOffset, sessionStart.totalMinutes).getTime(),
      windowEndAt: getDateWithMinutes(now, dayOffset, sessionEnd.totalMinutes).getTime(),
    };
  }

  if (currentMinutes < sessionEnd.totalMinutes) {
    return {
      sessionStart: sessionStart.normalized,
      sessionEnd: sessionEnd.normalized,
      duration: totalDurationMinutes,
      windowStartAt: getDateWithMinutes(now, -1, sessionStart.totalMinutes).getTime(),
      windowEndAt: getDateWithMinutes(now, 0, sessionEnd.totalMinutes).getTime(),
    };
  }

  return {
    sessionStart: sessionStart.normalized,
    sessionEnd: sessionEnd.normalized,
    duration: totalDurationMinutes,
    windowStartAt: getDateWithMinutes(now, 0, sessionStart.totalMinutes).getTime(),
    windowEndAt: getDateWithMinutes(now, 1, sessionEnd.totalMinutes).getTime(),
  };
}

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

    const lastSeenAt = readNumber(record, "lastSeenAt", "lastSeen", "lastUpdated", "updatedAt", "timestamp");
    const rawStatus = readString(record, "status", "state", "connectionStatus", "deviceStatus");
    const insideSchool = readBoolean(record, "insideSchool", "isInsideSchool", "isInsideZone");
    const isOutOfZoneExplicit = readBoolean(record, "isOutOfZone", "outOfZone");
    const isEmergencyUnlock = readBoolean(record, "isEmergencyUnlock", "emergencyUnlock", "emergencyUnlocked") === true;
    const isUninstallBypass = readBoolean(record, "isUninstallBypass", "uninstallBypass", "uninstallAuthorized") === true;
    const isPermissionActive = readBoolean(record, "isPermissionActive", "permissionActive", "tempPermissionActive") === true;
      const lastMasterSwitchAppliedState = readBoolean(record, "lastMasterSwitchAppliedState");
    const isAccessibilityEnabled = readBoolean(record, "isAccessibilityEnabled");
    const isDeviceAdminEnabled = readBoolean(record, "isDeviceAdminEnabled");
    const isProtectionActive = readBoolean(record, "isProtectionActive");
    const isExplicitlyOffline = rawStatus.toUpperCase().includes("OFFLINE");
    const computedOnline =
      !isExplicitlyOffline &&
      (rawStatus.toUpperCase() === "ONLINE" ||
        (lastSeenAt !== null && now - lastSeenAt <= ONLINE_WINDOW_MS));

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
        hasFcmToken: Boolean(readString(record, "fcmToken")),
        lastMasterSwitchCommandId: readString(record, "lastMasterSwitchCommandId"),
        lastMasterSwitchAppliedAt: readNumber(record, "lastMasterSwitchAppliedAt"),
        lastMasterSwitchAppliedState,
        lastMasterSwitchAckSource: readString(record, "lastMasterSwitchAckSource"),
      isAccessibilityEnabled,
      isDeviceAdminEnabled,
      isProtectionActive,
      protectionHealth: readString(record, "protectionHealth"),
      complianceStatus: readString(record, "complianceStatus"),
      lastProtectionCheckAt: readNumber(record, "lastProtectionCheckAt"),
      appVersionCode: readNumber(record, "appVersionCode"),
    };
  });
}

function parseLatestMasterSwitchCommand(rawValue: unknown, activeDevices: ActiveDeviceSnapshot[]) {
  if (!rawValue || typeof rawValue !== "object") return null;

  const record = rawValue as Record<string, unknown>;
  const delivery =
    record.delivery && typeof record.delivery === "object"
      ? (record.delivery as Record<string, unknown>)
      : {};

  const commandId = readString(record, "commandId");
  if (!commandId) return null;

  const requestedState = readBoolean(record, "requestedState") === true;
  const targetedDeviceCount = readNumber(delivery, "targetedDeviceCount") ?? 0;
  const ackedDeviceCount = activeDevices.filter(
    (device) =>
      device.lastMasterSwitchCommandId === commandId &&
      device.lastMasterSwitchAppliedState === requestedState
  ).length;

  return {
    commandId,
    requestedState,
    requestedAt: readNumber(record, "requestedAt"),
    targetedDeviceCount,
    targetedTokenCount: readNumber(delivery, "targetedTokenCount") ?? 0,
    fcmSuccessCount: readNumber(delivery, "fcmSuccessCount") ?? 0,
    fcmFailureCount: readNumber(delivery, "fcmFailureCount") ?? 0,
    ackedDeviceCount,
    pendingDeviceCount: Math.max(targetedDeviceCount - ackedDeviceCount, 0),
  } satisfies LatestMasterSwitchCommandSnapshot;
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

      return {
        ...schoolContext,
        decodedToken,
      };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const schoolIdParam = String(url.searchParams.get("schoolId") || "").trim();
    const schoolContext = await resolveAuthorizedSchoolId(request, schoolIdParam);
    const schoolId = schoolContext.schoolId;

        const [studentsSnap, tenantRegistrySnap, activeDevicesSnap, mirrorRootSnap, latestMasterSwitchCommandSnap] = await Promise.all([
      adminDb.ref(`gas/schools/${schoolId}/students`).get(),
      adminDb.ref(`tenant_registry/${schoolId}`).get(),
      adminDb.ref(`active_devices/${schoolId}`).get(),
      adminDb.ref(`daily_attendance_mirror/${schoolId}`).limitToLast(7).get(),
          adminDb.ref(`schools/${schoolId}/commands/master_switch/latest`).get(),
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
        const latestMasterSwitchCommand = parseLatestMasterSwitchCommand(
          latestMasterSwitchCommandSnap.val(),
          activeDevices
        );
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
            latestMasterSwitchCommand,
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
        const decodedToken = schoolContext.decodedToken;

    if (body.action === "save-settings") {
      const settings = (body as any).settings;
      if (!settings || typeof settings !== "object") {
        return NextResponse.json({ success: false, error: "Settings tidak valid" }, { status: 400 });
      }

      if (settings.geofence !== undefined) {
        const geofence = settings.geofence;
        const latitude = Number(geofence?.latitude);
        const longitude = Number(geofence?.longitude);
        const radius = Number(geofence?.radius);
        if (
          !Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90 ||
          !Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180 ||
          !Number.isFinite(radius) ||
          radius < 50 ||
          radius > 5000
        ) {
          return NextResponse.json(
            { success: false, error: "Koordinat atau radius zona EduLock tidak valid" },
            { status: 400 }
          );
        }
        settings.geofence = { latitude, longitude, radius };
      }

      const petReminderFields = [
        "petDeadReminderFirstMinutes",
        "petDeadReminderSecondMinutes",
        "petDeadReminderRepeatMinutes",
      ] as const;
      for (const field of petReminderFields) {
        if (settings[field] === undefined) continue;
        const minutes = Number(settings[field]);
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
          return NextResponse.json(
            { success: false, error: `${field} harus berupa angka 1-1440 menit` },
            { status: 400 }
          );
        }
        settings[field] = Math.floor(minutes);
      }

      const settingsUpdates: Record<string, unknown> = { ...settings };
      const geofence = settings.geofence;
      if (geofence) {
        // Prefer multi-path writes so nested geofence never fails as a partial blob.
        delete settingsUpdates.geofence;
        settingsUpdates["geofence/latitude"] = geofence.latitude;
        settingsUpdates["geofence/longitude"] = geofence.longitude;
        settingsUpdates["geofence/radius"] = geofence.radius;
      }

      if (Object.keys(settingsUpdates).length > 0) {
        await adminDb.ref(`edulock_settings/${schoolId}`).update(settingsUpdates);
      }

      if (geofence) {
        const now = Date.now();
        await adminDb.ref().update({
          [`schools/${schoolId}/config/edulock_geofence`]: {
            ...geofence,
            updatedAt: now,
          },
          [`schools/${schoolId}/config/latitude`]: geofence.latitude,
          [`schools/${schoolId}/config/longitude`]: geofence.longitude,
          [`schools/${schoolId}/config/radius`]: geofence.radius,
          [`school_settings/${schoolId}/edulock/geofence`]: geofence,
        });
      }

      const apkConfigUpdates: Record<string, any> = {};
      if (settings.is_active_protection !== undefined) {
        apkConfigUpdates.is_active_protection = settings.is_active_protection;
      }
      if (settings.is_holiday_mode !== undefined) {
        apkConfigUpdates.is_holiday_mode = settings.is_holiday_mode;
      }

      if (Object.keys(apkConfigUpdates).length > 0) {
        await adminDb.ref(`schools/${schoolId}/config`).update(apkConfigUpdates);
      }

      const policyUpdates: Record<string, any> = {};
      if (typeof settings.gpsWarnMinutes === "number") {
        policyUpdates.gps_off_warn_ms = settings.gpsWarnMinutes * 60 * 1000;
      }
      if (typeof settings.gpsLockMinutes === "number") {
        policyUpdates.gps_off_lock_ms = settings.gpsLockMinutes * 60 * 1000;
      }
      if (typeof settings.petDeadReminderFirstMinutes === "number") {
        policyUpdates.pet_dead_reminder_first_ms = settings.petDeadReminderFirstMinutes * 60 * 1000;
      }
      if (typeof settings.petDeadReminderSecondMinutes === "number") {
        policyUpdates.pet_dead_reminder_second_ms = settings.petDeadReminderSecondMinutes * 60 * 1000;
      }
      if (typeof settings.petDeadReminderRepeatMinutes === "number") {
        policyUpdates.pet_dead_reminder_repeat_ms = settings.petDeadReminderRepeatMinutes * 60 * 1000;
      }
      if (Object.keys(policyUpdates).length > 0) {
        await adminDb.ref(`schools/${schoolId}/policy`).update(policyUpdates);
      }
      
          const latestMasterSwitchCommand =
            settings.is_active_protection !== undefined
              ? await dispatchMasterSwitchCommand({
                  schoolId,
                  requestedState: Boolean(settings.is_active_protection),
                  requestedByUid: String(decodedToken.uid || ""),
                  requestedByEmail: String(decodedToken.email || ""),
                })
              : null;

          return NextResponse.json({
        success: true,
        message: "Pengaturan EduLock berhasil disimpan.",
            latestMasterSwitchCommand,
      });
    }

    if (body.action === "generate-access-code") {
      const { sessionStart, sessionEnd, label } = body as any;
      const resolvedWindow = resolveAccessCodeWindow(String(sessionStart || "07:00"), String(sessionEnd || "14:00"));
      if (!resolvedWindow) {
        return NextResponse.json({ success: false, error: "Jam mulai atau jam akhir kode EduLock tidak valid" }, { status: 400 });
      }

      const code = "EDULOCK-" + Math.floor(1000 + Math.random() * 9000);
      
      const newCode = {
        sessionStart: resolvedWindow.sessionStart,
        sessionEnd: resolvedWindow.sessionEnd,
        duration: resolvedWindow.duration,
        expiresAt: resolvedWindow.windowEndAt,
        validFrom: resolvedWindow.windowStartAt,
        schoolId: schoolId,
        label: String(label || "").trim(),
      };
      
      await adminDb.ref(`edulock_access_codes/${schoolId}/${code}`).set(newCode);
      await adminDb.ref(`active_codes/${code}`).set(newCode);
      
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
        await adminDb.ref(`active_codes/${code}`).remove();
      }
      return NextResponse.json({ success: true, message: "Kode berhasil dihapus." });
    }

    if (body.action === "delete-expired-codes") {
      const codesSnap = await adminDb.ref(`edulock_access_codes/${schoolId}`).get();
      if (codesSnap.exists()) {
        const now = Date.now();
        const updates: Record<string, null> = {};
        const globalUpdates: Record<string, null> = {};
        codesSnap.forEach((child) => {
          const val = child.val();
          if (val && val.expiresAt && val.expiresAt < now) {
            updates[child.key!] = null;
            globalUpdates[`active_codes/${child.key!}`] = null;
          }
        });
        if (Object.keys(updates).length > 0) {
          await adminDb.ref(`edulock_access_codes/${schoolId}`).update(updates);
        }
        if (Object.keys(globalUpdates).length > 0) {
          await adminDb.ref().update(globalUpdates);
        }
      }
      return NextResponse.json({ success: true, message: "Kode expired berhasil dibersihkan." });
    }

    if (body.action === "grant-class-permission") {
      const selectedClassName = normalizeClassName((body as any).className);
      const sessionStart = String((body as any).sessionStart || "07:00");
      const sessionEnd = String((body as any).sessionEnd || "14:00");
      if (!selectedClassName) {
        return NextResponse.json({ success: false, error: "Kelas wajib dipilih" }, { status: 400 });
      }

      const resolvedWindow = resolveAccessCodeWindow(sessionStart, sessionEnd);
      if (!resolvedWindow) {
        return NextResponse.json({ success: false, error: "Jam mulai atau jam akhir izin kelas tidak valid" }, { status: 400 });
      }

      const studentsSnap = await adminDb.ref(`gas/schools/${schoolId}/students`).get();
      const studentsValue = studentsSnap.val() as Record<string, Record<string, unknown>> | null;
      const matchedStudents = Object.entries(studentsValue || {})
        .map(([id, value]) => ({ id, ...(value || {}) }))
        .filter((student) => normalizeClassName(readString(student as Record<string, unknown>, "kelas", "class", "className")) === selectedClassName)
        .map((student) => ({
          id: String(student.id || "").trim(),
          nisn: readString(student as Record<string, unknown>, "nisn"),
          name: readString(student as Record<string, unknown>, "name", "nama", "studentName"),
          className: normalizeClassName(readString(student as Record<string, unknown>, "kelas", "class", "className")),
          deviceId: readString(student as Record<string, unknown>, "deviceId", "device", "device_uuid"),
        }))
        .filter((student) => student.nisn);

      if (matchedStudents.length === 0) {
        return NextResponse.json({ success: false, error: `Tidak ada siswa ditemukan di kelas ${selectedClassName}` }, { status: 404 });
      }

      const updates: Record<string, unknown> = {};
      const requestedAt = Date.now();
      const requestedBy = String(decodedToken.email || decodedToken.uid || "").trim();

      matchedStudents.forEach((student) => {
        const sessionData = {
          nisn: student.nisn,
          name: student.name || student.nisn,
          class: student.className,
          schoolId,
          startTime: resolvedWindow.windowStartAt,
          endTime: resolvedWindow.windowEndAt,
          duration: resolvedWindow.duration,
          sessionStart: resolvedWindow.sessionStart,
          sessionEnd: resolvedWindow.sessionEnd,
          deviceId: student.deviceId || "",
          activationSource: "admin-class",
          activationLabel: selectedClassName,
          requestedAt,
          requestedBy,
        };

        updates[`active_sessions/${student.nisn}`] = sessionData;
        updates[`active_sessions_by_school/${schoolId}/${student.nisn}`] = sessionData;
      });

      await adminDb.ref().update(updates);

      return NextResponse.json({
        success: true,
        message: `Izin penggunaan HP untuk kelas ${selectedClassName} berhasil diaktifkan.`,
        affectedStudents: matchedStudents.length,
      });
    }

    if (body.action === "revoke-class-permission") {
      const selectedClassName = normalizeClassName((body as any).className);
      if (!selectedClassName) {
        return NextResponse.json({ success: false, error: "Kelas wajib dipilih" }, { status: 400 });
      }

      const sessionsSnap = await adminDb.ref(`active_sessions_by_school/${schoolId}`).get();
      const sessionsValue = sessionsSnap.val() as Record<string, Record<string, unknown>> | null;
      const matchedNisns = Object.entries(sessionsValue || {})
        .filter(([, value]) => normalizeClassName(readString(value || {}, "class", "className", "activationLabel")) === selectedClassName)
        .map(([nisn]) => nisn)
        .filter(Boolean);

      if (matchedNisns.length === 0) {
        return NextResponse.json({
          success: true,
          message: `Tidak ada izin aktif yang perlu dicabut untuk kelas ${selectedClassName}.`,
          affectedStudents: 0,
        });
      }

      const updates: Record<string, null> = {};
      matchedNisns.forEach((nisn) => {
        updates[`active_sessions/${nisn}`] = null;
        updates[`active_sessions_by_school/${schoolId}/${nisn}`] = null;
      });

      await adminDb.ref().update(updates);

      return NextResponse.json({
        success: true,
        message: `Izin penggunaan HP untuk kelas ${selectedClassName} berhasil dicabut.`,
        affectedStudents: matchedNisns.length,
      });
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
        [`gas/schools/${schoolId}/students/${studentId}/device_uuid`]: null,
      };

      if (nisn) {
        updates[`master_students/${nisn}/deviceId`] = null;
        updates[`master_students/${nisn}/device`] = null;
        updates[`students/${nisn}/device_uuid`] = null;
      }

      await adminDb.ref().update(updates);

      return NextResponse.json({
        success: true,
        message: "Binding device siswa berhasil direset.",
      });
    }

    if (body.action === "revoke-student-permission") {
      const rawNisn = String(body.nisn || "");
      const nisn = rawNisn.trim();
      if (!nisn) {
        return NextResponse.json({ success: false, error: "NISN wajib diisi" }, { status: 400 });
      }

      await adminDb.ref(`active_sessions/${rawNisn}`).remove();
      await adminDb.ref(`active_sessions_by_school/${schoolId}/${rawNisn}`).remove();

      return NextResponse.json({
        success: true,
        message: `Izin penggunaan HP untuk NISN ${nisn} berhasil dicabut.`,
      });
    }

    if (body.action === "revoke-all-permissions") {
      const schoolSnap = await adminDb.ref(`active_sessions_by_school/${schoolId}`).get();
      if (schoolSnap.exists() && schoolSnap.val()) {
        const data = schoolSnap.val() as Record<string, unknown>;
        const updates: Record<string, null> = {};
        Object.keys(data).forEach((nisnKey) => {
          updates[`active_sessions/${nisnKey}`] = null;
          updates[`active_sessions_by_school/${schoolId}/${nisnKey}`] = null;
        });
        await adminDb.ref().update(updates);
      } else {
        await adminDb.ref(`active_sessions_by_school/${schoolId}`).remove();
      }

      return NextResponse.json({
        success: true,
        message: "Seluruh izin aktif penggunaan HP berhasil dicabut.",
      });
    }

    if (body.action === "toggle-uninstall") {
      const rawNisn = String(body.nisn || "");
      const nisn = rawNisn.trim();
      const studentId = String((body as any).studentId || "").trim();
      const isAuthorized = (body as any).isAuthorized === true;

      if (!nisn) {
        return NextResponse.json({ success: false, error: "NISN wajib diisi" }, { status: 400 });
      }

      const updates: Record<string, any> = {};
      
      if (isAuthorized) {
        updates[`students/${nisn}/uninstall_authorized`] = true;
        updates[`students/${nisn}/uninstall_authorized_until`] = Date.now() + 24 * 60 * 60 * 1000;
        if (studentId) {
          updates[`gas/schools/${schoolId}/students/${studentId}/uninstall_authorized`] = true;
        }
      } else {
        updates[`students/${nisn}/uninstall_authorized`] = null;
        updates[`students/${nisn}/uninstall_authorized_until`] = null;
        if (studentId) {
          updates[`gas/schools/${schoolId}/students/${studentId}/uninstall_authorized`] = null;
        }
      }

      await adminDb.ref().update(updates);

      return NextResponse.json({
        success: true,
        message: isAuthorized 
          ? `Mode Uninstall di HP untuk NISN ${nisn} berhasil diaktifkan.`
          : `Mode Uninstall di HP untuk NISN ${nisn} berhasil dicabut.`,
      });
    }

    if (body.action === "toggle-uninstall-mass") {
      const studentsToToggle = (body as any).students || []; // Array of { nisn, studentId }
      const isAuthorized = (body as any).isAuthorized === true;

      if (!Array.isArray(studentsToToggle) || studentsToToggle.length === 0) {
        return NextResponse.json({ success: false, error: "Daftar siswa kosong" }, { status: 400 });
      }

      const updates: Record<string, any> = {};
      const expiry = Date.now() + 24 * 60 * 60 * 1000;

      for (const student of studentsToToggle) {
        const nisn = String(student.nisn || "").trim();
        const studentId = String(student.studentId || "").trim();
        
        if (nisn) {
          if (isAuthorized) {
            updates[`students/${nisn}/uninstall_authorized`] = true;
            updates[`students/${nisn}/uninstall_authorized_until`] = expiry;
            if (studentId) {
              updates[`gas/schools/${schoolId}/students/${studentId}/uninstall_authorized`] = true;
            }
          } else {
            updates[`students/${nisn}/uninstall_authorized`] = null;
            updates[`students/${nisn}/uninstall_authorized_until`] = null;
            if (studentId) {
              updates[`gas/schools/${schoolId}/students/${studentId}/uninstall_authorized`] = null;
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await adminDb.ref().update(updates);
      }

      return NextResponse.json({
        success: true,
        message: isAuthorized
          ? `Mode Uninstall massal untuk ${studentsToToggle.length} siswa berhasil diaktifkan.`
          : `Izin Uninstall massal untuk ${studentsToToggle.length} siswa berhasil dicabut.`,
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
