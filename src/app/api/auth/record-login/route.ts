import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();
    
    if (!email) {
      return NextResponse.json({ error: "Email not found in token" }, { status: 400 });
    }

    const isSystemEmail = email.endsWith("@edulock.local");
    const localIdentifier = isSystemEmail ? email.split("@")[0] : "";
    const schoolContext = await resolveCanonicalSchoolContext({
      email,
      npsn: localIdentifier || decodedToken.npsn,
      schoolId: decodedToken.schoolId,
    });
    const targetSchoolId = schoolContext?.schoolId || null;

    if (targetSchoolId) {
      await adminDb.ref(`schools/${targetSchoolId}/lastLoginAt`).set(Date.now());
      return NextResponse.json({ success: true, schoolId: targetSchoolId });
    } else {
      return NextResponse.json({ success: true, message: "User is not a school admin" });
    }
  } catch (error: unknown) {
    console.error("Error recording login:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
