import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { assertCapability } from "../lib/policy";
import { CAPABILITIES } from "../lib/capabilities";

type FirebaseAuthLikeError = Error & { code?: string };

function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

async function assertRegisteredSchoolId(schoolId: unknown) {
  const normalizedSchoolId = normalizeSchoolId(schoolId);
  if (!normalizedSchoolId) {
    throw new functions.https.HttpsError("invalid-argument", "schoolId is required");
  }

  const snapshot = await admin.database().ref(`schools/${normalizedSchoolId}`).once("value");
  if (!snapshot.exists()) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `schoolId '${normalizedSchoolId}' tidak terdaftar di registry tenant`
    );
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

// 1. toggleSchoolActive
export const toggleSchoolActive = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { schoolId, nextActive } = data;
    if (!schoolId) {
      throw new functions.https.HttpsError("invalid-argument", "schoolId is required");
    }
    
    await admin.database().ref(`schools/${schoolId}`).update({
      isActive: nextActive,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    });
    
    return { success: true, message: `Sekolah ${schoolId} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}` };
  }
);

// 2. saveSchool
export const saveSchool = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
    const { school } = data;
    if (!school || !school.schoolId) {
      throw new functions.https.HttpsError("invalid-argument", "schoolId is required");
    }
    
    const schoolId = school.schoolId;
    await admin.database().ref(`schools/${schoolId}`).update({
      ...school,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    });
    
    return { success: true, message: `Data sekolah ${schoolId} disimpan` };
  }
);

// 3. savePrincipal
export const savePrincipal = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
    const { principal } = data;
    if (!principal || !principal.username || !principal.schoolId) {
      throw new functions.https.HttpsError("invalid-argument", "Data username dan schoolId wajib diisi");
    }
    
    const systemEmail = `${principal.username.toLowerCase()}@kepsek.edulock.local`;
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(systemEmail);
      if (principal.password) {
        await admin.auth().updateUser(userRecord.uid, { password: principal.password });
      }
    } catch (error: unknown) {
      const authError = error as FirebaseAuthLikeError;
      if (authError.code === "auth/user-not-found") {
        if (!principal.password) {
          throw new functions.https.HttpsError("invalid-argument", "Password wajib diisi untuk akun baru");
        }
        userRecord = await admin.auth().createUser({
          email: systemEmail,
          password: principal.password,
          emailVerified: true
        });
      } else {
        throw new functions.https.HttpsError("internal", authError.message || "Gagal menyimpan akun kepala sekolah");
      }
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "admin", // mapped principal to admin conceptually, or "principal" if it exists
      schoolId: principal.schoolId,
      npsn: principal.npsn || ""
    });

    const payload = {
      username: principal.username.toLowerCase(),
      name: principal.name,
      schoolId: principal.schoolId,
      schoolName: principal.schoolName,
      npsn: principal.npsn || "",
      isActive: principal.isActive,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    };

    await admin.database().ref(`principals/${principal.username.toLowerCase()}`).update(payload);

    return { success: true, message: `Akun kepala sekolah ${principal.username} disimpan` };
  }
);

// 4. resetPrincipalDevice
export const resetPrincipalDevice = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
    const { username } = data;
    if (!username) {
      throw new functions.https.HttpsError("invalid-argument", "username is required");
    }
    
    await admin.database().ref(`principals/${username.toLowerCase()}`).update({
      deviceId: null,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    });

    return { success: true, message: `Device untuk akun ${username} berhasil di-reset` };
  }
);

// 5. saveGlobalConfig
export const saveGlobalConfig = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { config } = data;
    
    await admin.database().ref(`gas/global_config`).set({
      ...config,
      _updatedAt: Date.now(),
      _updatedByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Konfigurasi global disimpan" };
  }
);

// 6. createBroadcast
export const createBroadcast = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.GLOBAL_BROADCAST_MANAGE);
    const { broadcast } = data;
    if (!broadcast?.title || !broadcast?.message) {
      throw new functions.https.HttpsError("invalid-argument", "title dan message wajib diisi");
    }

    const normalizedTarget = await normalizeBroadcastTarget(broadcast.target);
    
    const ref = admin.database().ref(`gas/broadcasts`).push();
    await ref.set({
      id: ref.key,
      ...broadcast,
      target: normalizedTarget,
      createdAt: Date.now(),
      createdByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Broadcast dibuat" };
  }
);

// 7. deleteBroadcast
export const deleteBroadcast = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.GLOBAL_BROADCAST_MANAGE);
    const { targetId } = data;
    
    await admin.database().ref(`gas/broadcasts/${targetId}`).remove();
    return { success: true, message: "Broadcast dihapus" };
  }
);

// 8. createSyncJob
export const createSyncJob = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { syncJob } = data;
    if (!syncJob?.schoolId || !syncJob?.jobType) {
      throw new functions.https.HttpsError("invalid-argument", "schoolId dan jobType wajib diisi");
    }

    const normalizedSchoolId = await assertRegisteredSchoolId(syncJob.schoolId);
    
    const ref = admin.database().ref(`gas/sync_jobs`).push();
    await ref.set({
      id: ref.key,
      ...syncJob,
      schoolId: normalizedSchoolId,
      status: "QUEUED",
      createdAt: Date.now(),
      createdByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Sync Job dibuat" };
  }
);

// 9. setSyncJobStatus
export const setSyncJobStatus = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId, syncJob } = data;
    
    await admin.database().ref(`gas/sync_jobs/${targetId}`).update({
      status: syncJob.status,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Status Sync Job diupdate" };
  }
);

// 10. createSupportRequest
export const createSupportRequest = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { supportRequest } = data;
    if (!supportRequest?.schoolId || !(supportRequest.title || supportRequest.requestType)) {
      throw new functions.https.HttpsError("invalid-argument", "schoolId dan title/requestType wajib diisi");
    }

    const normalizedSchoolId = await assertRegisteredSchoolId(supportRequest.schoolId);
    
    const ref = admin.database().ref(`gas/support_requests`).push();
    await ref.set({
      id: ref.key,
      ...supportRequest,
      schoolId: normalizedSchoolId,
      status: "OPEN",
      createdAt: Date.now(),
      createdByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Support Request berhasil dibuat" };
  }
);

// 11. setSupportRequestStatus
export const setSupportRequestStatus = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId, supportRequest } = data;
    
    await admin.database().ref(`gas/support_requests/${targetId}`).update({
      status: supportRequest.status,
      updatedAt: Date.now(),
      updatedByUid: context.auth?.uid,
    });
    
    return { success: true, message: "Status Support Request diupdate" };
  }
);

// 12. deleteSupportRequest
export const deleteSupportRequest = functions.https.onCall(
  async (data, context) => {
    assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId } = data;
    
    await admin.database().ref(`gas/support_requests/${targetId}`).remove();
    return { success: true, message: "Support Request dihapus" };
  }
);
