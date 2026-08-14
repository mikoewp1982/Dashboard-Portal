"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstLoginBootstrap = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.firstLoginBootstrap = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Request must be authenticated.");
    }
    const uid = context.auth.uid;
    try {
        // In a real scenario, this function would verify the initial credentials
        // and set the claims. But since assignRole handles claims, this function
        // might just be used to initialize the user's document in Firestore.
        const db = admin.firestore();
        const userRef = db.collection("users").doc(uid);
        await userRef.set({
            requiresPasswordChange: true,
            lastBootstrap: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { message: "Bootstrap successful, please change password." };
    }
    catch (error) {
        const typedError = error;
        throw new functions.https.HttpsError("internal", typedError.message || "Gagal melakukan bootstrap login pertama");
    }
});
//# sourceMappingURL=firstLoginBootstrap.js.map