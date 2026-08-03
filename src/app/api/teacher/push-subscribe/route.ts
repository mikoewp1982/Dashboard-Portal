import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

export const dynamic = "force-dynamic";

/**
 * Menyimpan token Web Push / FCM untuk portal guru.
 * Pengiriman push server-side (Cloud Function) masih perlu VAPID + deploy terpisah.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.role !== "teacher") {
      return NextResponse.json({ success: false, message: "Hanya untuk akun guru." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      fcmToken?: string;
      endpoint?: string;
      userAgent?: string;
      platform?: string;
    };

    const schoolId = normalizeSchoolId(decoded.schoolId);
    const nuptk = String(decoded.nuptk || "").trim();
    if (!schoolId || !nuptk) {
      return NextResponse.json(
        { success: false, message: "Claims guru tidak lengkap (schoolId/nuptk)." },
        { status: 400 }
      );
    }

    const fcmToken = String(body.fcmToken || "").trim();
    const endpoint = String(body.endpoint || "").trim();
    if (!fcmToken && !endpoint) {
      return NextResponse.json(
        { success: false, message: "fcmToken atau endpoint wajib diisi." },
        { status: 400 }
      );
    }

    const key = Buffer.from(fcmToken || endpoint)
      .toString("base64url")
      .slice(0, 48);

    await adminDb.ref(`gas/schools/${schoolId}/teacher_web_push/${nuptk}/${key}`).set({
      fcmToken: fcmToken || null,
      endpoint: endpoint || null,
      userAgent: String(body.userAgent || "").slice(0, 300),
      platform: String(body.platform || "").slice(0, 80),
      updatedAt: Date.now(),
      uid: decoded.uid,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription tersimpan. Push background menunggu VAPID/FCM function.",
      vapidConfigured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()),
    });
  } catch (error: unknown) {
    console.error("Teacher push subscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan subscription.",
      },
      { status: 500 }
    );
  }
}
