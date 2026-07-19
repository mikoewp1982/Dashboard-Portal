import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { assertCapability, UserRole } from "../lib/policy";
import { CAPABILITIES } from "../lib/capabilities";

type FirebaseCallableError = Error;

interface AssignRoleData {
  uid: string;
  role: UserRole;
  schoolId?: string | null;
  capabilities?: string[];
}

export const assignRole = functions.https.onCall(
  async (data: AssignRoleData, context: functions.https.CallableContext) => {
    // 1. Otorisasi: Hanya super_admin yang boleh memanggil ini.
    // Kita cek apakah pemanggil punya role super_admin (di handle oleh assertCapability jika kita lempar SYSTEM_CONFIG_MANAGE)
    // Atau karena assignRole sangat krusial, kita bisa cek langsung claims.role
    const claims = assertCapability(context, CAPABILITIES.SYSTEM_CONFIG_MANAGE);
    
    if (claims.role !== "super_admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only super_admin can assign roles."
      );
    }

    const { uid, role, schoolId, capabilities } = data;

    if (!uid || !role) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid uid and role."
      );
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
    } catch (error: unknown) {
      const typedError = error as FirebaseCallableError;
      throw new functions.https.HttpsError("internal", typedError.message || "Gagal menetapkan role");
    }
  }
);
