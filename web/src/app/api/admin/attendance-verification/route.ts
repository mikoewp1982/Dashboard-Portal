import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

export const dynamic = "force-dynamic";

function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId, name } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      schoolId?: string;
      attendanceId?: string;
    };

    const targetSchoolId = normalizeSchoolId(
      role === "super_admin" ? body.schoolId || userSchoolId : userSchoolId
    );
    const attendanceId = normalizeIdentity(body.attendanceId);

    if (!targetSchoolId || !attendanceId) {
      return NextResponse.json(
        { success: false, message: "schoolId atau attendanceId belum lengkap." },
        { status: 400 }
      );
    }

    const scopedRef = adminDb.ref(`attendance_by_school/${targetSchoolId}/${attendanceId}`);
    const rootRef = adminDb.ref(`attendance/${attendanceId}`);

    const [scopedSnap, rootSnap] = await Promise.all([scopedRef.get(), rootRef.get()]);
    const sourceSnap = scopedSnap.exists() ? scopedSnap : rootSnap;

    if (!sourceSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Data usulan presensi tidak ditemukan." },
        { status: 404 }
      );
    }

    const record = (sourceSnap.val() || {}) as Record<string, unknown>;
    const verificationStatus = normalizeIdentity(record.verificationStatus).toUpperCase();
    const proposedBy = normalizeIdentity(record.proposedBy);
    const proposedStatus = normalizeIdentity(record.proposedStatus).toUpperCase();

    if (verificationStatus !== "PENDING_TEACHER") {
      return NextResponse.json(
        { success: false, message: "Data ini sudah final atau tidak sedang menunggu verifikasi." },
        { status: 400 }
      );
    }

    if (!proposedBy.toLowerCase().includes("sekretaris kelas")) {
      return NextResponse.json(
        { success: false, message: "Hanya usulan Sekretaris Kelas yang bisa diverifikasi dari panel ini." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const verifierName = normalizeIdentity(name) || "Admin Sekolah";
    const approvedStatus = proposedStatus || normalizeIdentity(record.status).toUpperCase() || "ABSENT";
    const updates = {
      status: approvedStatus,
      verificationStatus: "APPROVED",
      verifiedBy: `Admin Sekolah: ${verifierName}`,
      verifiedAt: now,
      updatedAt: now,
    };

    await Promise.all([
      scopedRef.update(updates),
      rootSnap.exists() ? rootRef.update(updates) : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Usulan presensi berhasil diverifikasi oleh admin sekolah.",
      data: {
        attendanceId,
        verificationStatus: "APPROVED",
        verifiedBy: `Admin Sekolah: ${verifierName}`,
        verifiedAt: now,
        status: approvedStatus,
      },
    });
  } catch (error: unknown) {
    console.error("Admin attendance verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memverifikasi usulan presensi.",
      },
      { status: 500 }
    );
  }
}
