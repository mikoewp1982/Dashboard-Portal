import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

type VerifiedSuperAdminToken = Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
type SuperAdminRequestBody = Record<string, unknown>;
type MutableRecord = Record<string, unknown>;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal Server Error";
}

function readPositiveNumber(value: unknown, fallbackValue: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

function generateUninstallAccessCode() {
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EDULOCK-${token}`;
}

function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

async function getSchoolRegistryRecord(schoolId: string) {
  const normalizedSchoolId = normalizeSchoolId(schoolId);
  if (!normalizedSchoolId) {
    return null;
  }

  const snapshot = await adminDb.ref(`schools/${normalizedSchoolId}`).once("value");
  if (!snapshot.exists()) {
    return null;
  }

  return {
    schoolId: normalizedSchoolId,
    ...((snapshot.val() as Record<string, unknown>) || {}),
  };
}

async function assertRegisteredSchoolId(schoolId: unknown) {
  const normalizedSchoolId = normalizeSchoolId(schoolId);
  if (!normalizedSchoolId) {
    throw new Error("School ID diperlukan.");
  }

  const school = await getSchoolRegistryRecord(normalizedSchoolId);
  if (!school) {
    throw new Error(`School ID '${normalizedSchoolId}' tidak terdaftar di registry tenant.`);
  }

  return normalizedSchoolId;
}

async function normalizeBroadcastTarget(target: unknown) {
  const rawTarget = String(target || "").trim();
  if (!rawTarget || rawTarget.toUpperCase() === "ALL") {
    return "ALL";
  }

  return await assertRegisteredSchoolId(rawTarget);
}

export async function POST(req: Request) {
  try {
    // Verify super admin token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const body = (await req.json()) as SuperAdminRequestBody;
    const action = String(body.action || "");

    switch (action) {
      case "save-principal":
        return await handleSavePrincipal(body);
      case "reset-principal-device":
        return await handleResetPrincipalDevice(body);
      case "reset-principal-password":
        return await handleResetPrincipalPassword(body);
      case "toggle-school-active":
        return await handleToggleSchoolActive(body);
      case "set-school-payment-status":
        return await handleSetSchoolPaymentStatus(body);
      case "save-school":
        return await handleSaveSchool(body);
      case "save-global-config":
        return await handleSaveGlobalConfig(body);
      case "create-broadcast":
        return await handleCreateBroadcast(body, decodedToken);
      case "delete-broadcast":
        return await handleDeleteBroadcast(body);
      case "create-sync-job":
        return await handleCreateSyncJob(body, decodedToken);
      case "set-sync-job-status":
        return await handleSetSyncJobStatus(body);
      case "create-support-request":
        return await handleCreateSupportRequest(body, decodedToken);
      case "set-support-request-status":
        return await handleSetSupportRequestStatus(body);
      case "delete-support-request":
        return await handleDeleteSupportRequest(body);
      case "create-edulock-uninstall-code":
        return await handleCreateEduLockUninstallCode(body, decodedToken);
      case "clear-edulock-uninstall-code":
        return await handleClearEduLockUninstallCode(body);
      default:
        return NextResponse.json({ error: `Action '${action}' not supported` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Super admin API error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

async function handleSavePrincipal(body: SuperAdminRequestBody) {
  const principal = (body.principal as MutableRecord | undefined) || undefined;
  if (!principal?.username || !principal?.schoolId) {
    return NextResponse.json({ error: "Username dan School ID wajib diisi." }, { status: 400 });
  }

  const username = String(principal.username).trim().toLowerCase();
  const email = `${username}@kepsek.edulock.local`;
  const principalDisplayName = String(principal.name || username);

  // Check if this is an update or create
  const existingSnap = await adminDb.ref(`principals/${username}`).once("value");
  const isUpdate = existingSnap.exists();

  if (!isUpdate) {
    // Create new - password required
    if (!principal.password) {
      return NextResponse.json({ error: "Password wajib diisi untuk akun baru." }, { status: 400 });
    }

    // Create Firebase Auth account
    try {
      await adminAuth.createUser({
        email,
        password: String(principal.password),
        displayName: principalDisplayName,
      });
    } catch (authErr: unknown) {
      const authErrorCode =
        authErr && typeof authErr === "object" && "code" in authErr
          ? String((authErr as { code?: unknown }).code || "")
          : "";

      if (authErrorCode === "auth/email-already-exists") {
        // Update existing auth user instead
        const existing = await adminAuth.getUserByEmail(email);
        const updatePayload: { displayName: string; password?: string } = {
          displayName: principalDisplayName,
        };
        if (principal.password) updatePayload.password = String(principal.password);
        await adminAuth.updateUser(existing.uid, updatePayload);
      } else {
        throw authErr;
      }
    }
  } else if (principal.password) {
    // Update password if provided
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(userRecord.uid, {
        password: String(principal.password),
        displayName: principalDisplayName,
      });
    } catch (authErr: unknown) {
      console.error("Error updating auth user:", authErr);
    }
  }

  // Save to RTDB
  const principalData: MutableRecord = {
    username,
    name: principalDisplayName,
    schoolId: principal.schoolId,
    schoolName: String(principal.schoolName || ""),
    npsn: String(principal.npsn || ""),
    isActive: principal.isActive !== false,
    updatedAt: Date.now(),
  };

  if (!isUpdate) {
    principalData.createdAt = Date.now();
  }

  await adminDb.ref(`principals/${username}`).update(principalData);

  return NextResponse.json({ success: true, message: "Akun kepala sekolah berhasil disimpan." });
}

async function handleResetPrincipalDevice(body: SuperAdminRequestBody) {
  const { username } = body;
  if (!username) {
    return NextResponse.json({ error: "Username diperlukan." }, { status: 400 });
  }

  await adminDb.ref(`principals/${username}/device`).remove();
  await adminDb.ref(`principals/${username}/deviceId`).remove();

  return NextResponse.json({ success: true, message: `Device untuk ${username} berhasil di-reset.` });
}

async function handleResetPrincipalPassword(body: SuperAdminRequestBody) {
  const { username } = body;
  if (!username) {
    return NextResponse.json({ error: "Username diperlukan." }, { status: 400 });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const email = `${normalizedUsername}@kepsek.edulock.local`;

  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(userRecord.uid, {
      password: "admin123",
    });
  } catch (error: unknown) {
    console.error("Reset principal password error:", error);
    return NextResponse.json({ error: "Akun runtime kepala sekolah tidak ditemukan." }, { status: 404 });
  }

  await adminDb.ref(`principals/${normalizedUsername}/updatedAt`).set(Date.now());

  return NextResponse.json({
    success: true,
    message: `Password akun kepala sekolah ${normalizedUsername} berhasil direset ke admin123.`,
  });
}

async function handleToggleSchoolActive(body: SuperAdminRequestBody) {
  const { schoolId } = body;
  const isActive =
    typeof body.isActive === "boolean"
      ? body.isActive
      : typeof body.nextActive === "boolean"
        ? body.nextActive
        : undefined;
  if (!schoolId) {
    return NextResponse.json({ error: "School ID diperlukan." }, { status: 400 });
  }
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Status aktif diperlukan." }, { status: 400 });
  }

  const normalizedSchoolId = await assertRegisteredSchoolId(schoolId);
  await adminDb.ref(`schools/${normalizedSchoolId}/isActive`).set(isActive);
  await adminDb.ref(`schools/${normalizedSchoolId}/updatedAt`).set(Date.now());

  return NextResponse.json({ success: true });
}

async function handleSaveSchool(body: SuperAdminRequestBody) {
  const school = (body.school as MutableRecord | undefined) || undefined;
  if (!school?.schoolId) {
    return NextResponse.json({ error: "School ID diperlukan." }, { status: 400 });
  }

  const updates: MutableRecord = {
    name: school.name || "",
    district: school.district || "",
    npsn: school.npsn || "",
    authEmail: school.authEmail || "",
    adminEmail: school.adminEmail || "",
    backupEmail: school.backupEmail || "",
    isActive: school.isActive !== false,
    adminAccessActive: school.adminAccessActive !== false,
    updatedAt: Date.now(),
  };

  const normalizedSchoolId = normalizeSchoolId(school.schoolId);
  updates.schoolId = normalizedSchoolId;

  await adminDb.ref(`schools/${normalizedSchoolId}`).update(updates);

  return NextResponse.json({ success: true, message: "Data sekolah berhasil disimpan." });
}

async function handleSetSchoolPaymentStatus(body: SuperAdminRequestBody) {
  const { schoolId } = body;
  if (!schoolId) {
    return NextResponse.json({ error: "School ID diperlukan." }, { status: 400 });
  }

  const paymentStatus = String(body.paymentStatus || "").trim().toUpperCase();
  if (paymentStatus !== "PAID" && paymentStatus !== "UNPAID") {
    return NextResponse.json({ error: "Status pembayaran harus PAID atau UNPAID." }, { status: 400 });
  }

  const normalizedSchoolId = await assertRegisteredSchoolId(schoolId);
  const normalizedDueAt = typeof body.dueAt === "number" && Number.isFinite(body.dueAt) ? body.dueAt : null;
  const now = Date.now();

  const billingUpdates: MutableRecord = {
    paymentStatus,
    updatedAt: now,
  };

  if (paymentStatus === "PAID") {
    billingUpdates.lastPaidAt = now;
  }
  if (normalizedDueAt !== null) {
    billingUpdates.dueAt = normalizedDueAt;
  }

  await adminDb.ref(`schools/${normalizedSchoolId}/billing`).update(billingUpdates);
  await adminDb.ref(`schools/${normalizedSchoolId}/updatedAt`).set(now);

  return NextResponse.json({
    success: true,
    message: `Status pembayaran ${normalizedSchoolId} diubah menjadi ${paymentStatus}.`,
  });
}

async function handleSaveGlobalConfig(body: SuperAdminRequestBody) {
  const { config } = body;
  if (!config) {
    return NextResponse.json({ error: "Config diperlukan." }, { status: 400 });
  }
  
  await adminDb.ref('gas/global_config').set(config);
  return NextResponse.json({ success: true, message: "Konfigurasi global berhasil disimpan." });
}

async function handleCreateBroadcast(body: SuperAdminRequestBody, decodedToken: VerifiedSuperAdminToken) {
  const { title, message, target } = body;
  if (!title || !message) {
    return NextResponse.json({ error: "Title dan message diperlukan." }, { status: 400 });
  }

  const normalizedTarget = await normalizeBroadcastTarget(target);

  const newRef = adminDb.ref('gas/broadcasts').push();
  await newRef.set({
    id: newRef.key,
    title,
    message,
    target: normalizedTarget,
    createdAt: Date.now(),
    createdByUid: decodedToken.uid
  });

  return NextResponse.json({ success: true, message: "Broadcast berhasil dibuat." });
}

async function handleDeleteBroadcast(body: SuperAdminRequestBody) {
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Broadcast ID diperlukan." }, { status: 400 });
  }

  await adminDb.ref(`gas/broadcasts/${id}`).remove();
  return NextResponse.json({ success: true, message: "Broadcast berhasil dihapus." });
}

async function handleCreateSyncJob(body: SuperAdminRequestBody, decodedToken: VerifiedSuperAdminToken) {
  const { schoolId, jobType } = body;
  if (!schoolId || !jobType) {
    return NextResponse.json({ error: "School ID dan Job Type diperlukan." }, { status: 400 });
  }

  const normalizedSchoolId = await assertRegisteredSchoolId(schoolId);

  const newRef = adminDb.ref('gas/sync_jobs').push();
  await newRef.set({
    id: newRef.key,
    schoolId: normalizedSchoolId,
    jobType,
    status: "QUEUED",
    createdAt: Date.now(),
    createdByUid: decodedToken.uid
  });

  return NextResponse.json({ success: true, message: "Sync job berhasil dibuat." });
}

async function handleSetSyncJobStatus(body: SuperAdminRequestBody) {
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "Job ID dan status diperlukan." }, { status: 400 });
  }

  await adminDb.ref(`gas/sync_jobs/${id}`).update({
    status,
    updatedAt: Date.now()
  });

  return NextResponse.json({ success: true, message: "Status job berhasil diubah." });
}

async function handleCreateSupportRequest(body: SuperAdminRequestBody, decodedToken: VerifiedSuperAdminToken) {
  const { schoolId, title, notes } = body;
  if (!schoolId || !title) {
    return NextResponse.json({ error: "School ID dan title diperlukan." }, { status: 400 });
  }

  const normalizedSchoolId = await assertRegisteredSchoolId(schoolId);

  const newRef = adminDb.ref('gas/support_requests').push();
  await newRef.set({
    id: newRef.key,
    schoolId: normalizedSchoolId,
    title,
    status: "OPEN",
    notes: notes || "",
    createdAt: Date.now(),
    createdByUid: decodedToken.uid,
    updatedAt: Date.now()
  });

  return NextResponse.json({ success: true, message: "Support request berhasil dibuat." });
}

async function handleSetSupportRequestStatus(body: SuperAdminRequestBody) {
  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "Request ID dan status diperlukan." }, { status: 400 });
  }

  await adminDb.ref(`gas/support_requests/${id}`).update({
    status,
    updatedAt: Date.now()
  });

  return NextResponse.json({ success: true, message: "Status request berhasil diubah." });
}

async function handleDeleteSupportRequest(body: SuperAdminRequestBody) {
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Request ID diperlukan." }, { status: 400 });
  }

  await adminDb.ref(`gas/support_requests/${id}`).remove();
  return NextResponse.json({ success: true, message: "Support request berhasil dihapus." });
}

async function handleCreateEduLockUninstallCode(
  body: SuperAdminRequestBody,
  decodedToken: VerifiedSuperAdminToken
) {
  const normalizedSchoolId = await assertRegisteredSchoolId(body.schoolId);
  const durationMinutes = readPositiveNumber(body.durationMinutes, 10);
  const now = Date.now();
  const payload = {
    code: generateUninstallAccessCode(),
    expiresAt: now + durationMinutes * 60 * 1000,
    updatedAt: now,
    createdByUid: decodedToken.uid,
    durationMinutes,
  };

  await adminDb
    .ref(`school_settings/${normalizedSchoolId}/system/edulock/uninstall_access`)
    .set(payload);

  await adminDb
    .ref(`schools/${normalizedSchoolId}/uninstallAccess`)
    .set(payload);

  return NextResponse.json({
    success: true,
    message: "Kode uninstall EduLock berhasil dibuat.",
    data: payload,
  });
}

async function handleClearEduLockUninstallCode(body: SuperAdminRequestBody) {
  const normalizedSchoolId = await assertRegisteredSchoolId(body.schoolId);

  await adminDb
    .ref(`school_settings/${normalizedSchoolId}/system/edulock/uninstall_access`)
    .remove();

  await adminDb
    .ref(`schools/${normalizedSchoolId}/uninstallAccess`)
    .remove();

  return NextResponse.json({
    success: true,
    message: "Kode uninstall EduLock berhasil dihapus.",
  });
}
