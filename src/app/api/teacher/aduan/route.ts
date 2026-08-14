import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import {
  buildIdentityMap,
  normalizeIdentity,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["PENDING", "RESOLVED"]);

function reportTouchesClass(
  report: Record<string, unknown>,
  identityMap: Map<string, unknown>
): boolean {
  const candidates = [
    normalizeIdentity(report.reporterId),
    normalizeIdentity(report.victimId),
    normalizeIdentity(report.perpetratorId),
  ]
    .map((id) => id.toLowerCase())
    .filter(Boolean);

  return candidates.some((id) => identityMap.has(id));
}

export async function PUT(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    const body = await req.json();
    const reportId = normalizeIdentity(body.reportId);
    const status = String(body.status || "")
      .trim()
      .toUpperCase();

    if (!reportId) {
      return NextResponse.json(
        { success: false, message: "reportId wajib diisi." },
        { status: 400 }
      );
    }
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { success: false, message: "Status tidak valid. Gunakan PENDING atau RESOLVED." },
        { status: 400 }
      );
    }

    const schoolId = normalizeSchoolId(teacher.schoolId);
    const reportRef = adminDb.ref(
      `gas/schools/${schoolId}/halo_spentgapa_reports/${reportId}`
    );
    const snap = await reportRef.once("value");
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, message: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    const report = (snap.val() || {}) as Record<string, unknown>;
    const students = await loadHomeroomStudents(schoolId, teacher.className);
    const identityMap = buildIdentityMap(students);
    if (!reportTouchesClass(report, identityMap)) {
      return NextResponse.json(
        { success: false, message: "Laporan di luar kelas wali Anda." },
        { status: 403 }
      );
    }

    const now = Date.now();
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };
    if (status === "RESOLVED") {
      updateData.resolvedAt = now;
      updateData.assignedTo = teacher.uid;
    }

    await reportRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Status laporan diperbarui.",
      data: { id: reportId, ...report, ...updateData },
    });
  } catch (error) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("PUT teacher/aduan error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui status aduan.",
      },
      { status: 500 }
    );
  }
}
