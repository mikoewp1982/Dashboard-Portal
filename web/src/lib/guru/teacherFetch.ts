"use client";

import { auth } from "@/lib/firebase/client";

async function withTeacherAuth(input: string, init: RequestInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Sesi guru tidak aktif. Silakan login ulang.");
  }
  const idToken = await currentUser.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${idToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}

/** Authenticated fetch that returns parsed JSON (default for teacher APIs). */
export async function teacherFetch(input: string, init: RequestInit = {}) {
  const res = await withTeacherAuth(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : `Request gagal (${res.status})`
    );
  }
  return data;
}

/** Authenticated fetch that returns the raw Response (for Excel/blob downloads). */
export async function teacherFetchRaw(input: string, init: RequestInit = {}) {
  return withTeacherAuth(input, init);
}
