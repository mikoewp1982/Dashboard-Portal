import { auth } from "./firebase/client";
import { createSessionInactiveError, waitForClientUser } from "./firebase/waitForClientUser";

type DatabaseAction = "create" | "update" | "delete" | "delete-all" | "import-excel" | "reset-device";

interface DatabasePayload {
  action: DatabaseAction;
  tab: string;
  data?: Record<string, unknown>;
  bulkData?: Record<string, unknown>[];
  id?: string;
}

export async function callAdminDatabaseApi(payload: DatabasePayload) {
  const currentUser = auth.currentUser || await waitForClientUser();
  if (!currentUser) {
    throw createSessionInactiveError();
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin/database", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || "Terjadi kesalahan pada server");
  }

  return result;
}
