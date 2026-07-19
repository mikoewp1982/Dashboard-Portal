"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAuthenticated = assertAuthenticated;
exports.assertCapability = assertCapability;
exports.assertSchoolScope = assertSchoolScope;
const functions = require("firebase-functions");
function assertAuthenticated(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Request must be authenticated.");
    }
    return context.auth.token;
}
function assertCapability(context, capability) {
    const claims = assertAuthenticated(context);
    if (claims.role === "super_admin") {
        return claims; // Super admin has all capabilities implicitly
    }
    const userCapabilities = claims.capabilities || [];
    if (!userCapabilities.includes(capability)) {
        throw new functions.https.HttpsError("permission-denied", `Missing required capability: ${capability}`);
    }
    return claims;
}
function assertSchoolScope(context, targetSchoolId) {
    const claims = assertAuthenticated(context);
    if (claims.role === "super_admin") {
        return claims; // Super admin can access any school
    }
    if (claims.schoolId !== targetSchoolId) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to access data for this school.");
    }
    return claims;
}
//# sourceMappingURL=policy.js.map