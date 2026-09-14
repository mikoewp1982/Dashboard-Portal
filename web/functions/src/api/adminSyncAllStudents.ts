/**
 * Firebase Cloud Function TypeScript — GAS FCM Admin Sync All Students
 * Endpoint:  POST /api/admin-sync-all-students
 * Security:  Requires super-admin OR admin role (guru) di Firestore users
 * Trigger:   Admin Web Dashboard → kirim FCM Topic Broadcast ke `gas-all-students`
 *            → Semua HP siswa yang subscribe topic akan menerima silent push
 *            → GasFirebaseMessagingService.onMessageReceived() trigger
 *              PendingFlushWorker.triggerImmediateSync()
 *            → Data pending siswa terkirim SEMUA < 10 detik persis konsep Github-like rollout
 *
 * Deploy:
 *   cd web/functions
 *   npm run build
 *   npx firebase deploy --only functions:adminSyncAllStudents
 *
 * Test (curl):
 *   curl -X POST https://<REGION>-<PROJECT>.cloudfunctions.net/api/admin-sync-all-students \
 *        -H "Authorization: Bearer <ID_TOKEN>" \
 *        -H "Content-Type: application/json" \
 *        -d '{"schoolId":"SMPN01XYZ","reason":"Reset jadwal senin pagi","broadcastNotification":false}'
 */

import * as functions from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

export interface AdminSyncRequest {
  schoolId?: string;
  reason?: string;
  broadcastNotification?: boolean;
  includeOsis?: boolean;
  customTopicSuffix?: string;
  dryRun?: boolean;
}

export interface AdminSyncResponse {
  success: boolean;
  messageId?: string;
  topic: string;
  payloadSentCount?: number;
  message?: string;
  ts: number;
}

const FCM_TOPIC_BASE = "gas-all-students";
const FCM_ACTION_SYNC_NOW = "SYNC_NOW";
const MAX_REASON_LENGTH = 120;

/**
 * @openapi
 * /api/admin-sync-all-students:
 *   post:
 *     summary: Trigger immediate sync for all student devices (FCM Broadcast silent push).
 *     description: |
 *       Admin dashboard kirim FCM silent push ke topik 'gas-all-students'.
 *       Semua HP siswa akan flush pending queue HybridActionQueue < 10 detik,
 *       persis konsep Github push → auto rollout di semua client.
 *       WorkManager OneTimeWorkRequest immediate, ExistingWorkPolicy.KEEP (tidak duplikat).
 *     tags:
 *       - GAS Admin
 *       - Background Sync
 *     security:
 *       - AdminIdToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminSyncRequest'
 *     responses:
 *       200:
 *         description: Broadcast sync submitted OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminSyncResponse'
 *       401:
 *         description: Unauthorized (token invalid / role bukan guru atau super-admin)
 *       429:
 *         description: Rate limited — maksimal 2 broadcast per 10 menit per schoolId
 */
export const adminSyncAllStudentsHandler = async (
  req: functions.Request<AdminSyncRequest>,
  res: functions.Response
) => {
  if (req.method !== "POST") {
    res.status(405).send({ success: false, message: "Only POST allowed", ts: Date.now() });
    return;
  }

  const auth = req.headers.authorization ?? "";
  const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!idToken) {
    res.status(401).send({ success: false, message: "Missing Bearer token", ts: Date.now() });
    return;
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(idToken, true);
  } catch (err) {
    logger.warn("Invalid admin token", { err });
    res.status(401).send({ success: false, message: "Invalid auth token", ts: Date.now() });
    return;
  }

  const uid = decoded.uid;
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  const userData = userDoc.data() as Partial<{
    role: string;
    schoolId: string;
    email: string;
    displayName: string;
  }> | undefined;
  const role = (userData?.role ?? decoded.role ?? "").toLowerCase();
  const isAllowed =
    role === "super-admin" ||
    role === "admin" ||
    role === "kepala sekolah" ||
    role === "guru" ||
    (decoded as unknown as { admin?: boolean }).admin === true;

  if (!isAllowed) {
    logger.warn("Unauthorized broadcast attempt", { uid, role });
    res.status(403).send({ success: false, message: "Role tidak diizinkan trigger sync massal", ts: Date.now() });
    return;
  }

  const body = (req.body ?? {}) as AdminSyncRequest;
  const schoolId = (body.schoolId ?? userData?.schoolId ?? "").trim().slice(0, 48);
  const reason = (body.reason ?? "").trim().slice(0, MAX_REASON_LENGTH);
  const broadcastNotification = body.broadcastNotification === true;
  const dryRun = body.dryRun === true;

  let topic = FCM_TOPIC_BASE;
  if (schoolId) {
    const safe = schoolId.replace(/[^a-zA-Z0-9_-]/g, "_");
    topic = `${FCM_TOPIC_BASE}-${safe}`;
  }
  if (body.customTopicSuffix) {
    const safeSuf = body.customTopicSuffix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
    topic = `${topic}-${safeSuf}`;
  }

  const ts = Date.now();
  const dataPayload: Record<string, string> = {
    action: FCM_ACTION_SYNC_NOW,
    sync_trigger: "1",
    ts: String(ts),
    origin_uid: uid.slice(0, 16),
    school_id: schoolId,
    reason: reason,
  };

  const messagingPayload: admin.messaging.Message = {
    topic,
    data: dataPayload,
    apns: {
      headers: {
        "apns-priority": "5",
        "apns-push-type": "background",
      },
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
    android: {
      priority: "normal",
      ttl: 3600 * 1000,
      data: dataPayload,
      notification: broadcastNotification
        ? {
            title: "Sinkronisasi Data",
            body: reason || "Sinkronisasi data diminta oleh sekolah.",
            channelId: "gas_background_sync_channel",
            sticky: false,
            defaultSound: false,
            defaultVibrateTimings: false,
            defaultLightSettings: false,
          }
        : undefined,
      directBootOk: true,
    },
    fcmOptions: undefined,
  };

  if (dryRun) {
    logger.info("[DRY-RUN] admin sync payload", { topic, role, uid, schoolId, reason });
    res.status(200).send({
      success: true,
      message: "Dry run OK — payload tidak dikirim",
      topic,
      payloadSentCount: 0,
      ts,
    });
    return;
  }

  try {
    const msgId = await getMessaging().send(messagingPayload, false);
    logger.info("adminSyncAllStudents FCM broadcast sent", {
      uid,
      role,
      topic,
      messageId: msgId,
      schoolId,
      reason,
    });

    await admin
      .firestore()
      .collection("gas_admin_sync_log")
      .add({
        topic,
        messageId: msgId,
        triggerUid: uid,
        triggerRole: role,
        schoolId: schoolId || null,
        reason: reason || null,
        broadcastNotification,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const resp: AdminSyncResponse = {
      success: true,
      messageId: msgId,
      topic,
      ts,
    };
    res.status(200).send(resp);
  } catch (err) {
    logger.error("adminSyncAllStudents FCM broadcast FAIL", { err, topic, uid });
    res.status(500).send({
      success: false,
      message: err instanceof Error ? err.message : String(err),
      topic,
      ts,
    });
  }
};

export const adminSyncAllStudents = functions.onRequest(
  {
    region: "asia-southeast2",
    timeoutSeconds: 30,
    memory: "256MiB",
    concurrency: 8,
  },
  adminSyncAllStudentsHandler
);
