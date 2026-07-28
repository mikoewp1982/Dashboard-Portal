import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

type NotificationTargetType = "ALL_CLASSES" | "CLASS" | "STUDENTS" | "SPECIFIC_STUDENT" | "TEACHERS";

type RecipientInfo = {
  id: string;
  type: "student" | "teacher";
  name: string;
  className?: string;
  /** Semua kunci identitas yang mungkin dipakai APK untuk membaca inbox. */
  aliases: string[];
};

function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getClassLabel(row: Record<string, unknown>) {
  return String(row.className || row.kelas || row.class || "").trim();
}

function uniqueAliases(...values: unknown[]) {
  return Array.from(
    new Set(values.map((value) => normalizeIdentity(value)).filter((value) => value.length > 0))
  );
}

async function resolveRecipients(
  schoolId: string,
  targetType: NotificationTargetType,
  targetValue?: string
) {
  const normalizedTarget = normalizeIdentity(targetValue);
  const normalizedSchoolId = normalizeSchoolId(schoolId);

  if (targetType === "TEACHERS") {
    const teachersSnap = await adminDb.ref(`gas/schools/${normalizedSchoolId}/teachers`).get();
    if (!teachersSnap.exists()) return [] as RecipientInfo[];

    return Object.entries(teachersSnap.val() as Record<string, Record<string, unknown>>).map(([id, row]) => ({
      id,
      type: "teacher" as const,
      name: String(row.name || "Guru"),
      className: getClassLabel(row),
      aliases: uniqueAliases(id, row.nuptk, row.credential, row.username, row.name),
    }));
  }

  const studentsSnap = await adminDb.ref(`gas/schools/${normalizedSchoolId}/students`).get();
  if (!studentsSnap.exists()) return [] as RecipientInfo[];

  const students = Object.entries(studentsSnap.val() as Record<string, Record<string, unknown>>).map(([id, row]) => ({
    id,
    type: "student" as const,
    name: String(row.name || "Siswa"),
    className: getClassLabel(row),
    nisn: normalizeIdentity(row.nisn),
    aliases: uniqueAliases(id, row.nisn, row.username, row.credential),
  }));

  if (targetType === "ALL_CLASSES" || targetType === "STUDENTS") {
    return students;
  }

  if (targetType === "CLASS") {
    return students.filter((student) => normalizeIdentity(student.className) === normalizedTarget);
  }

  if (targetType === "SPECIFIC_STUDENT") {
    return students.filter(
      (student) =>
        normalizeIdentity(student.id) === normalizedTarget ||
        student.nisn === normalizedTarget ||
        student.aliases.includes(normalizedTarget)
    );
  }

  return [];
}

async function authorizeSchoolAccess(decodedToken: { role?: string; schoolId?: string; email?: string }, schoolId: string) {
  const canonical = await resolveCanonicalSchoolContext({
    schoolId,
    email: decodedToken.email,
  });
  const canonicalSchoolId = canonical?.schoolId || normalizeSchoolId(schoolId);
  if (!canonicalSchoolId) {
    return { ok: false as const, status: 400, message: "School ID tidak valid", schoolId: "" };
  }

  if (decodedToken.role !== "super_admin") {
    const tokenSchoolId = normalizeSchoolId(decodedToken.schoolId);
    if (!tokenSchoolId || tokenSchoolId !== canonicalSchoolId) {
      return { ok: false as const, status: 403, message: "Forbidden: School mismatch", schoolId: "" };
    }
  }

  return { ok: true as const, schoolId: canonicalSchoolId };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const schoolId = req.nextUrl.searchParams.get("schoolId");
    if (!schoolId) {
      return NextResponse.json({ success: false, message: "Missing schoolId" }, { status: 400 });
    }

    const access = await authorizeSchoolAccess(decodedToken, schoolId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const notifRef = adminDb.ref(`gas/schools/${access.schoolId}/notifications`);
    const snapshot = await notifRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, data: {} });
    }

    return NextResponse.json({ success: true, data: snapshot.val() });
  } catch (error: any) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const {
      schoolId,
      title,
      message,
      targetType,
      targetValue,
      targetName,
      senderName,
    }: {
      schoolId?: string;
      title?: string;
      message?: string;
      targetType?: NotificationTargetType;
      targetValue?: string;
      targetName?: string;
      senderName?: string;
    } = body;

    if (!schoolId || !title || !message || !targetType) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const access = await authorizeSchoolAccess(decodedToken, schoolId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const recipients = await resolveRecipients(access.schoolId, targetType, targetValue);
    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada penerima yang cocok untuk target yang dipilih." },
        { status: 400 }
      );
    }

    const notifRef = adminDb.ref(`gas/schools/${access.schoolId}/notifications`).push();
    const notificationId = notifRef.key;
    if (!notificationId) {
      return NextResponse.json({ success: false, message: "Gagal membuat ID notifikasi." }, { status: 500 });
    }

    const recipientSummary = recipients.reduce<Record<string, number>>((acc, recipient) => {
      acc[recipient.type] = (acc[recipient.type] || 0) + 1;
      return acc;
    }, {});

    const notificationData = {
      title,
      message,
      targetType,
      targetValue: targetValue || "",
      targetName: targetName || "",
      senderId: decodedToken.uid,
      senderName: senderName || "Admin",
      schoolId: access.schoolId,
      recipientCount: recipients.length,
      recipientSummary,
      sentAt: Date.now(),
    };

    const fanoutUpdates: Record<string, unknown> = {
      [`gas/schools/${access.schoolId}/notifications/${notificationId}`]: notificationData,
    };

    for (const recipient of recipients) {
      const inboxPayload = {
        ...notificationData,
        notificationId,
        recipientId: recipient.id,
        recipientType: recipient.type,
        recipientName: recipient.name,
        recipientClassName: recipient.className || "",
        isRead: false,
        deliveredAt: notificationData.sentAt,
      };

      // Tulis ke semua alias identitas agar APK (push-key / nisn / nuptk) bisa membaca.
      for (const alias of recipient.aliases) {
        fanoutUpdates[
          `gas/schools/${access.schoolId}/notification_inbox/${recipient.type}/${alias}/${notificationId}`
        ] = inboxPayload;
      }
    }

    await adminDb.ref().update(fanoutUpdates);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      data: { id: notificationId, ...notificationData },
    });
  } catch (error: any) {
    console.error("POST notifications error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const id = req.nextUrl.searchParams.get("id");
    const clearAll = req.nextUrl.searchParams.get("clearAll") === "true";

    if (!schoolId) {
      return NextResponse.json({ success: false, message: "Missing schoolId" }, { status: 400 });
    }

    const access = await authorizeSchoolAccess(decodedToken, schoolId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    if (clearAll) {
      await adminDb.ref(`gas/schools/${access.schoolId}/notifications`).remove();
      return NextResponse.json({ success: true, message: "All notifications cleared" });
    } else if (id) {
      await adminDb.ref(`gas/schools/${access.schoolId}/notifications/${id}`).remove();
      return NextResponse.json({ success: true, message: "Notification deleted" });
    }

    return NextResponse.json({ success: false, message: "Missing id or clearAll parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE notifications error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
