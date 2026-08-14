import { adminDb, adminMessaging } from "@/lib/firebase-admin";

export type MasterSwitchCommandRecord = {
  commandId: string;
  commandType: "protection_state";
  requestedState: boolean;
  requestedAt: number;
  requestedByUid: string;
  requestedByEmail: string;
  delivery: {
    targetedDeviceCount: number;
    targetedTokenCount: number;
    fcmRequestedAt: number | null;
    fcmSuccessCount: number;
    fcmFailureCount: number;
  };
};

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function uniqueTokens(rawDevices: unknown) {
  if (!rawDevices || typeof rawDevices !== "object") return [] as string[];

  const tokens = new Set<string>();
  Object.values(rawDevices as Record<string, unknown>).forEach((rawRecord) => {
    if (!rawRecord || typeof rawRecord !== "object") return;
    const record = rawRecord as Record<string, unknown>;
    const token = readString(record, "fcmToken");
    if (token) {
      tokens.add(token);
    }
  });
  return Array.from(tokens);
}

function countTargetDevices(rawDevices: unknown) {
  if (!rawDevices || typeof rawDevices !== "object") return 0;
  let count = 0;
  Object.values(rawDevices as Record<string, unknown>).forEach((rawRecord) => {
    if (!rawRecord || typeof rawRecord !== "object") return;
    const record = rawRecord as Record<string, unknown>;
    const token = readString(record, "fcmToken");
    if (token) count += 1;
  });
  return count;
}

export async function dispatchMasterSwitchCommand(params: {
  schoolId: string;
  requestedState: boolean;
  requestedByUid: string;
  requestedByEmail: string;
}) {
  const { schoolId, requestedState, requestedByUid, requestedByEmail } = params;
  const requestedAt = Date.now();
  const commandId = `master_switch_${requestedAt}`;

  const activeDevicesSnap = await adminDb.ref(`active_devices/${schoolId}`).get();
  const activeDevices = activeDevicesSnap.val();
  const tokens = uniqueTokens(activeDevices);

  const commandRecord: MasterSwitchCommandRecord = {
    commandId,
    commandType: "protection_state",
    requestedState,
    requestedAt,
    requestedByUid,
    requestedByEmail,
    delivery: {
      targetedDeviceCount: countTargetDevices(activeDevices),
      targetedTokenCount: tokens.length,
      fcmRequestedAt: null,
      fcmSuccessCount: 0,
      fcmFailureCount: 0,
    },
  };

  await adminDb.ref(`schools/${schoolId}/commands/master_switch/latest`).set(commandRecord);

  if (tokens.length === 0) {
    return commandRecord;
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens,
    data: {
      type: "edulock_master_switch",
      schoolId,
      commandId,
      requestedState: requestedState ? "true" : "false",
      requestedAt: String(requestedAt),
    },
    android: {
      priority: "high",
      ttl: 60 * 1000,
    },
  });

  const deliveredRecord: MasterSwitchCommandRecord = {
    ...commandRecord,
    delivery: {
      ...commandRecord.delivery,
      fcmRequestedAt: Date.now(),
      fcmSuccessCount: response.successCount,
      fcmFailureCount: response.failureCount,
    },
  };

  await adminDb.ref(`schools/${schoolId}/commands/master_switch/latest`).set(deliveredRecord);
  return deliveredRecord;
}
