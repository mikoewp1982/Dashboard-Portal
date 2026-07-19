"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRole = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const policy_1 = require("../lib/policy");
const capabilities_1 = require("../lib/capabilities");
exports.assignRole = functions.https.onCall(async (data, context) => {
    // 1. Otorisasi: Hanya super_admin yang boleh memanggil ini.
    // Kita cek apakah pemanggil punya role super_admin (di handle oleh assertCapability jika kita lempar SYSTEM_CONFIG_MANAGE)
    // Atau karena assignRole sangat krusial, kita bisa cek langsung claims.role
    const claims = (0, policy_1.assertCapability)(context, capabilities_1.CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    if (claims.role !== "super_admin") {
        throw new functions.https.HttpsError("permission-denied", "Only super_admin can assign roles.");
    }
    const { uid, role, schoolId, capabilities } = data;
    if (!uid || !role) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid uid and role.");
    }
    try {
        // 2. Terapkan Custom Claims
        const newClaims = {
            role,
            schoolId: schoolId || null,
            capabilities: capabilities || [],
        };
        await admin.auth().setCustomUserClaims(uid, newClaims);
        // 3. (Opsional) Tulis ke Audit Logs
        // TODO: Panggil helper writeAuditLog setelah diimplementasikan
        return {
            message: `Success setting role ${role} for user ${uid}`,
        };
    }
    catch (error) {
        const typedError = error;
        throw new functions.https.HttpsError("internal", typedError.message || "Gagal menetapkan role");
    }
});
//# sourceMappingURL=assignRole.js.map