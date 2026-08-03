"use client";

import {
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  type Auth,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const FIREBASE_API_KEY = "AIzaSyDu0-azn8PV7dNEnXC2HHsf2_gxSd7dzcs";

type ServerSession = {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
};

/**
 * Persist a server-minted Auth session into Firebase JS SDK storage, then
 * reload so onIdTokenChanged picks it up. Avoids browser → Identity Toolkit
 * calls that fail with auth/network-request-failed on App Hosting / Safari
 * (*.hosted.app has no /__/auth handler).
 */
async function persistServerSession(session: ServerSession) {
  const expirationTime = Date.now() + Number(session.expiresIn || "3600") * 1000;
  const stored = {
    uid: session.localId,
    email: session.email,
    emailVerified: true,
    displayName: session.displayName || "",
    isAnonymous: false,
    providerData: [
      {
        providerId: "password",
        uid: session.email,
        displayName: session.displayName || "",
        email: session.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: session.refreshToken,
      accessToken: session.idToken,
      expirationTime,
    },
    createdAt: String(Date.now()),
    lastLoginAt: String(Date.now()),
    apiKey: FIREBASE_API_KEY,
    appName: "[DEFAULT]",
  };

  const key = `firebase:authUser:${FIREBASE_API_KEY}:[DEFAULT]`;
  try {
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {
    // ignore quota / private mode
  }

  await new Promise<void>((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    const request = indexedDB.open("firebaseLocalStorageDb", 1);
    request.onerror = () => resolve();
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
        db.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
      }
    };
    request.onsuccess = () => {
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
          resolve();
          return;
        }
        const tx = db.transaction(["firebaseLocalStorage"], "readwrite");
        const store = tx.objectStore("firebaseLocalStorage");
        store.put({ fbase_key: key, value: stored });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        resolve();
      }
    };
  });
}

function mapAuthError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code || "")
      : "";
  const message = error instanceof Error ? error.message : "Gagal masuk.";

  if (code === "auth/network-request-failed" || /network-request-failed/i.test(message)) {
    return "Koneksi autentikasi browser gagal. Muat ulang halaman lalu coba lagi.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "NUPTK salah atau tidak cocok dengan data guru.";
  }
  if (code === "auth/user-disabled") {
    return "Akun guru dinonaktifkan. Hubungi admin sekolah.";
  }
  if (code === "auth/too-many-requests") {
    return "Terlalu banyak percobaan login. Coba lagi beberapa menit.";
  }
  if (/Firebase:\s*Error\s*\((auth\/[^)]+)\)/i.test(message)) {
    return "Gagal autentikasi. Periksa NPSN/NUPTK atau coba lagi.";
  }
  return message;
}

export async function applyTeacherAuthSession(options: {
  email?: string;
  password?: string;
  customToken?: string;
  session?: ServerSession;
  authInstance?: Auth;
}) {
  const authRef = options.authInstance || auth || getAuth();

  // Prefer custom token when the server could mint one (still needs Identity Toolkit).
  if (options.customToken) {
    try {
      await signInWithCustomToken(authRef, options.customToken);
      await authRef.currentUser?.getIdToken(true);
      return;
    } catch {
      // Fall through — App Hosting / Safari often fail client Auth XHR.
    }
  }

  // Most reliable on production App Hosting: apply server-verified tokens locally.
  if (options.session?.idToken && options.session.refreshToken) {
    await persistServerSession(options.session);
    window.location.assign("/guru");
    // Keep the promise pending until navigation unloads the page.
    await new Promise(() => undefined);
    return;
  }

  if (options.email && options.password) {
    try {
      await signInWithEmailAndPassword(authRef, options.email, options.password);
      await authRef.currentUser?.getIdToken(true);
      return;
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  }

  throw new Error("Sesi login guru tidak tersedia. Coba lagi.");
}
