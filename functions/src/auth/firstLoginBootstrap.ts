import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const firstLoginBootstrap = functions.https.onCall(
  async (_data: Record<string, never>, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Request must be authenticated."
      );
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
    } catch (error: unknown) {
      const typedError = error as Error;
      throw new functions.https.HttpsError("internal", typedError.message || "Gagal melakukan bootstrap login pertama");
    }
  }
);
