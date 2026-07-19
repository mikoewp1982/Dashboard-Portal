"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.changePassword = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Request must be authenticated.");
    }
    const uid = context.auth.uid;
    const { newPassword } = data;
    if (!newPassword || newPassword.length < 6) {
        throw new functions.https.HttpsError("invalid-argument", "Password must be at least 6 characters long.");
    }
    try {
        // 1. Update the password in Firebase Auth
        await admin.auth().updateUser(uid, {
            password: newPassword,
        });
        // 2. Clear the requiresPasswordChange flag in Firestore
        const db = admin.firestore();
        const userRef = db.collection("users").doc(uid);
        await userRef.set({
            requiresPasswordChange: false,
            passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { message: "Password updated successfully." };
    }
    catch (error) {
        const typedError = error;
        throw new functions.https.HttpsError("internal", typedError.message || "Gagal mengubah password");
    }
});
//# sourceMappingURL=changePassword.js.map