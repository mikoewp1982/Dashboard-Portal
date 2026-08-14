import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    await adminAuth.setCustomUserClaims(decodedToken.uid, {
      ...(userRecord.customClaims || {}),
      mustChangePassword: false,
    });

    return NextResponse.json({
      success: true,
      message: "Flag wajib ganti password berhasil dibersihkan.",
    });
  } catch (error: unknown) {
    console.error("Complete password change error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan saat menyelesaikan perubahan password." },
      { status: 500 }
    );
  }
}
