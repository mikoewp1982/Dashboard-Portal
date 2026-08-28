import { adminDb, adminMessaging } from "@/lib/firebase-admin";

export type FindDeviceCommandRecord = {
  commandId: string;
  commandType: "find_device_start" | "find_device_stop";
  targetDeviceId: string;
  targetStudentName: string;
  targetNisn: string;
  requestedAt: number;
  requestedByUid: string;
  requestedByEmail: string;
  durationMs: number;
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

export async function dispatchFindDeviceCommand(params: {
  schoolId: string;
  targetDeviceId: string;
  requestedByUid: string;
  requestedByEmail: string;
  durationMs?: number;
  commandType?: "find_device_start" | "find_device_stop";
}) {
  const { schoolId, targetDeviceId, requestedByUid, requestedByEmail } = params;
  const commandType = params.commandType ?? "find_device_start";
  const durationMs = Math.min(Math.max(params.durationMs ?? 45_000, 15_000), 120_000);
  const requestedAt = Date.now();
  const commandId = `${commandType}_${requestedAt}`;

  const deviceSnap = await adminDb.ref(`active_devices/${schoolId}/${targetDeviceId}`).get();
  const deviceValue =
    deviceSnap.exists() && typeof deviceSnap.val() === "object"
      ? (deviceSnap.val() as Record<string, unknown>)
      : null;

  const token = deviceValue ? readString(deviceValue, "fcmToken") : "";
  const targetStudentName = deviceValue ? readString(deviceValue, "name", "studentName") : "";
  const targetNisn = deviceValue ? readString(deviceValue, "nisn", "studentNisn") : "";

  const commandRecord: FindDeviceCommandRecord = {
    commandId,
    commandType,
    targetDeviceId,
    targetStudentName,
    targetNisn,
    requestedAt,
    requestedByUid,
    requestedByEmail,
    durationMs,
    delivery: {
      targetedDeviceCount: token ? 1 : 0,
      targetedTokenCount: token ? 1 : 0,
      fcmRequestedAt: null,
      fcmSuccessCount: 0,
      fcmFailureCount: 0,
    },
  };

  await adminDb.ref(`schools/${schoolId}/commands/find_device/latest`).set(commandRecord);

  if (!token) {
    return commandRecord;
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens: [token],
    data: {
      type: commandType === "find_device_stop" ? "edulock_stop_find_device" : "edulock_find_device",
      schoolId,
      commandId,
      targetDeviceId,
      durationMs: String(durationMs),
      requestedAt: String(requestedAt),
    },
    android: {
      priority: "high",
      ttl: 60 * 1000,
    },
  });

  const deliveredRecord: FindDeviceCommandRecord = {
    ...commandRecord,
    delivery: {
      ...commandRecord.delivery,
      fcmRequestedAt: Date.now(),
      fcmSuccessCount: response.successCount,
      fcmFailureCount: response.failureCount,
    },
  };

  await adminDb.ref(`schools/${schoolId}/commands/find_device/latest`).set(deliveredRecord);
  return deliveredRecord;
}
