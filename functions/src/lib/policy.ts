import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";

export type UserRole = "super_admin" | "admin" | "guru" | "siswa";

export interface CustomClaims {
  role?: UserRole;
  schoolId?: string | null;
  classId?: string;
  capabilities?: string[];
}

export function assertAuthenticated(context: CallableContext): CustomClaims {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Request must be authenticated."
    );
  }
  return context.auth.token as unknown as CustomClaims;
}

export function assertCapability(context: CallableContext, capability: string) {
  const claims = assertAuthenticated(context);
  
  if (claims.role === "super_admin") {
    return claims; // Super admin has all capabilities implicitly
  }

  const userCapabilities = claims.capabilities || [];
  if (!userCapabilities.includes(capability)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      `Missing required capability: ${capability}`
    );
  }
  
  return claims;
}

export function assertSchoolScope(context: CallableContext, targetSchoolId: string) {
  const claims = assertAuthenticated(context);
  
  if (claims.role === "super_admin") {
    return claims; // Super admin can access any school
  }

  if (claims.schoolId !== targetSchoolId) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to access data for this school."
    );
  }
  
  return claims;
}
