import * as admin from "firebase-admin";

admin.initializeApp();

// Export functions di sini
export * from "./auth/assignRole";
export * from "./auth/firstLoginBootstrap";
export * from "./auth/changePassword";
export * from "./api/superAdmin";
export * from "./api/mobileAuth";
