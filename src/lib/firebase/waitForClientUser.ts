import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./client";

const SESSION_INACTIVE_MESSAGE = "Sesi tidak aktif. Silakan login ulang.";

export async function waitForClientUser(timeoutMs = 1500): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
}

export function createSessionInactiveError() {
  return new Error(SESSION_INACTIVE_MESSAGE);
}

export function isSessionInactiveError(error: unknown) {
  return error instanceof Error && error.message === SESSION_INACTIVE_MESSAGE;
}
