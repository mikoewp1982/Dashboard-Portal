import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

type BootstrapRequestBody = {
  npsn?: string;
  mode?: "bootstrap" | "reset-password";
};

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!idToken) {
      return NextResponse.json({ error: "Sesi tidak aktif." }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.role !== "super_admin") {
      return NextResponse.json({ error: "Akses ditolak. Hanya super admin yang diizinkan." }, { status: 403 });
    }

    const { npsn, mode = "bootstrap" } = (await req.json()) as BootstrapRequestBody;
    if (!npsn) return NextResponse.json({ error: "NPSN required" }, { status: 400 });

    const schoolContext = await resolveCanonicalSchoolContext({ npsn });
    if (!schoolContext?.schoolId) {
      return NextResponse.json({ error: "NPSN tidak terdaftar di database." }, { status: 404 });
    }
    const schoolId = schoolContext.schoolId;
    const normalizedNpsn = schoolContext.npsn || String(npsn).trim();
    const systemEmail = schoolContext.authEmail || `${normalizedNpsn}@edulock.local`;

    let userRecord;
    let createdNewUser = false;
    try {
      userRecord = await adminAuth.getUserByEmail(systemEmail);
    } catch (error: unknown) {
      const authErrorCode =
        error instanceof Error && "code" in error ? String((error as { code?: string }).code || "") : "";
      if (authErrorCode === "auth/user-not-found") {
        userRecord = await adminAuth.createUser({
          email: systemEmail,
          password: "admin123",
          emailVerified: true,
        });
        createdNewUser = true;
      } else {
        throw error;
      }
    }

    if (mode === "reset-password") {
      userRecord = await adminAuth.updateUser(userRecord.uid, {
        password: "admin123",
      });
    }

    const shouldForcePasswordChange =
      mode === "reset-password" || createdNewUser || userRecord.customClaims?.mustChangePassword === true;

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      ...(userRecord.customClaims || {}),
      role: "admin",
      schoolId,
      npsn: normalizedNpsn,
      schoolName: schoolContext.name,
      mustChangePassword: shouldForcePasswordChange,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      schoolId,
      npsn: normalizedNpsn,
      mode,
      message:
        mode === "reset-password"
          ? "Password admin sekolah berhasil direset ke admin123."
          : createdNewUser
            ? "Login default admin sekolah berhasil disiapkan. Admin wajib mengganti password saat login pertama."
            : "Akun admin sekolah sudah ada. Klaim akses berhasil diselaraskan.",
    });
  } catch (error: unknown) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan bootstrap" },
      { status: 500 }
    );
  }
}
