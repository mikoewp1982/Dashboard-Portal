"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupportRequest = exports.setSupportRequestStatus = exports.createSupportRequest = exports.setSyncJobStatus = exports.createSyncJob = exports.deleteBroadcast = exports.createBroadcast = exports.saveGlobalConfig = exports.resetPrincipalDevice = exports.savePrincipal = exports.saveSchool = exports.toggleSchoolActive = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const policy_1 = require("../lib/policy");
const capabilities_1 = require("../lib/capabilities");
// 1. toggleSchoolActive
exports.toggleSchoolActive = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { schoolId, nextActive } = data;
    if (!schoolId) {
        throw new functions.https.HttpsError("invalid-argument", "schoolId is required");
    }
    await admin.database().ref(`schools/${schoolId}`).update({
        isActive: nextActive,
        updatedAt: Date.now(),
        updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
    });
    return { success: true, message: `Sekolah ${schoolId} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}` };
});
// 2. saveSchool
exports.saveSchool = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
    const { school } = data;
    if (!school || !school.schoolId) {
        throw new functions.https.HttpsError("invalid-argument", "schoolId is required");
    }
    const schoolId = school.schoolId;
    await admin.database().ref(`schools/${schoolId}`).update(Object.assign(Object.assign({}, school), { updatedAt: Date.now(), updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid }));
    return { success: true, message: `Data sekolah ${schoolId} disimpan` };
});
// 3. savePrincipal
exports.savePrincipal = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
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
    }
    catch (error) {
        const authError = error;
        if (authError.code === "auth/user-not-found") {
            if (!principal.password) {
                throw new functions.https.HttpsError("invalid-argument", "Password wajib diisi untuk akun baru");
            }
            userRecord = await admin.auth().createUser({
                email: systemEmail,
                password: principal.password,
                emailVerified: true
            });
        }
        else {
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
        updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
    };
    await admin.database().ref(`principals/${principal.username.toLowerCase()}`).update(payload);
    return { success: true, message: `Akun kepala sekolah ${principal.username} disimpan` };
});
// 4. resetPrincipalDevice
exports.resetPrincipalDevice = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SCHOOL_REGISTRY_MANAGE);
    const { username } = data;
    if (!username) {
        throw new functions.https.HttpsError("invalid-argument", "username is required");
    }
    await admin.database().ref(`principals/${username.toLowerCase()}`).update({
        deviceId: null,
        updatedAt: Date.now(),
        updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
    });
    return { success: true, message: `Device untuk akun ${username} berhasil di-reset` };
});
// 5. saveGlobalConfig
exports.saveGlobalConfig = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { config } = data;
    await admin.database().ref(`gas/global_config`).set(Object.assign(Object.assign({}, config), { _updatedAt: Date.now(), _updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid }));
    return { success: true, message: "Konfigurasi global disimpan" };
});
// 6. createBroadcast
exports.createBroadcast = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.GLOBAL_BROADCAST_MANAGE);
    const { broadcast } = data;
    const ref = admin.database().ref(`gas/broadcasts`).push();
    await ref.set(Object.assign(Object.assign({ id: ref.key }, broadcast), { createdAt: Date.now(), createdByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid }));
    return { success: true, message: "Broadcast dibuat" };
});
// 7. deleteBroadcast
exports.deleteBroadcast = functions.https.onCall(async (data, context) => {
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.GLOBAL_BROADCAST_MANAGE);
    const { targetId } = data;
    await admin.database().ref(`gas/broadcasts/${targetId}`).remove();
    return { success: true, message: "Broadcast dihapus" };
});
// 8. createSyncJob
exports.createSyncJob = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { syncJob } = data;
    const ref = admin.database().ref(`gas/sync_jobs`).push();
    await ref.set(Object.assign(Object.assign({ id: ref.key }, syncJob), { status: "QUEUED", createdAt: Date.now(), createdByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid }));
    return { success: true, message: "Sync Job dibuat" };
});
// 9. setSyncJobStatus
exports.setSyncJobStatus = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId, syncJob } = data;
    await admin.database().ref(`gas/sync_jobs/${targetId}`).update({
        status: syncJob.status,
        updatedAt: Date.now(),
        updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
    });
    return { success: true, message: "Status Sync Job diupdate" };
});
// 10. createSupportRequest
exports.createSupportRequest = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { supportRequest } = data;
    const ref = admin.database().ref(`gas/support_requests`).push();
    await ref.set(Object.assign(Object.assign({ id: ref.key }, supportRequest), { status: "OPEN", createdAt: Date.now(), createdByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid }));
    return { success: true, message: "Support Request berhasil dibuat" };
});
// 11. setSupportRequestStatus
exports.setSupportRequestStatus = functions.https.onCall(async (data, context) => {
    var _a;
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId, supportRequest } = data;
    await admin.database().ref(`gas/support_requests/${targetId}`).update({
        status: supportRequest.status,
        updatedAt: Date.now(),
        updatedByUid: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
    });
    return { success: true, message: "Status Support Request diupdate" };
});
// 12. deleteSupportRequest
exports.deleteSupportRequest = functions.https.onCall(async (data, context) => {
    (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    const { targetId } = data;
    await admin.database().ref(`gas/support_requests/${targetId}`).remove();
    return { success: true, message: "Support Request dihapus" };
});
//# sourceMappingURL=superAdmin.js.map