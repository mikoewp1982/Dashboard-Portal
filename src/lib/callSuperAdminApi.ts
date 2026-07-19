"use client";

import { auth, functions } from "@/lib/firebase/client";
import { createSessionInactiveError, waitForClientUser } from "@/lib/firebase/waitForClientUser";
import { httpsCallable } from "firebase/functions";

type SuperAdminApiResult = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export async function callSuperAdminApi(
  _method: "POST" | "PUT" | "DELETE",
  payload: Record<string, unknown>
) {
  const currentUser = auth.currentUser || await waitForClientUser();
  if (!currentUser) {
    throw createSessionInactiveError();
  }

  const action = typeof payload.action === "string" ? payload.action : "";

  try {
    const token = await currentUser.getIdToken();
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Permintaan super admin gagal diproses.");
    }
    
    if (data && data.success === false) {
      throw new Error(data.message || "Permintaan super admin gagal diproses.");
    }
    
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Permintaan super admin gagal diproses.");
  }
}
