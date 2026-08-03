"use client";

import { auth } from "@/lib/firebase/client";

export async function teacherFetch(input: string, init: RequestInit = {}) {
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
  const res = await fetch(input, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : `Request gagal (${res.status})`
    );
  }
  return data;
}
