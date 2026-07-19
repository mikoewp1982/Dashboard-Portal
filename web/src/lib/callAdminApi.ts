import { auth } from "./firebase/client";
import { createSessionInactiveError, waitForClientUser } from "./firebase/waitForClientUser";

export async function callAdminApi(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  payload?: Record<string, unknown>
) {
  const currentUser = auth.currentUser || await waitForClientUser();
  if (!currentUser) {
    throw createSessionInactiveError();
  }

  const idToken = await currentUser.getIdToken();
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  };

  if (payload && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(endpoint, options);
  const result = await response.json().catch(() => ({}));
  
  if (!response.ok || result?.success === false) {
    throw new Error(result?.error || result?.message || "Terjadi kesalahan pada server");
  }

  return result;
}
