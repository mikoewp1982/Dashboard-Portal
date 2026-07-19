import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

type FirebaseCallableError = Error;

interface ChangePasswordData {
  newPassword: string;
}

export const changePassword = functions.https.onCall(
  async (data: ChangePasswordData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Request must be authenticated."
      );
    }

    const uid = context.auth.uid;
    const { newPassword } = data;

    if (!newPassword || newPassword.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters long."
      );
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
    } catch (error: unknown) {
      const typedError = error as FirebaseCallableError;
      throw new functions.https.HttpsError("internal", typedError.message || "Gagal mengubah password");
    }
  }
);
