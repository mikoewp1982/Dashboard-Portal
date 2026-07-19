import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function sanitizeAnonymousReport(report: Record<string, unknown>) {
  if (!report.isAnonymous) {
    return report;
  }

  return {
    ...report,
    reporterId: "",
    reporterName: "",
  };
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

    if (decodedToken.role !== "super_admin" && decodedToken.schoolId !== schoolId) {
      return NextResponse.json({ success: false, message: "Forbidden: School mismatch" }, { status: 403 });
    }

    const reportsRef = adminDb.ref(`gas/schools/${schoolId}/halo_spentgapa_reports`);
    const snapshot = await reportsRef.get();
    
    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, data: {} });
    }

    const rawData = snapshot.val() as Record<string, Record<string, unknown>>;
    const sanitizedData = Object.fromEntries(
      Object.entries(rawData).map(([reportId, report]) => [reportId, sanitizeAnonymousReport(report)])
    );

    return NextResponse.json({ success: true, data: sanitizedData });
  } catch (error: any) {
    console.error("GET halo-spentgapa error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { schoolId, reportId, status, resolutionNotes } = body;

    if (!schoolId || !reportId || !status) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    if (decodedToken.role !== "super_admin" && decodedToken.schoolId !== schoolId) {
      return NextResponse.json({ success: false, message: "Forbidden: School mismatch" }, { status: 403 });
    }

    const reportRef = adminDb.ref(`gas/schools/${schoolId}/halo_spentgapa_reports/${reportId}`);
    const existingSnap = await reportRef.get();
    if (!existingSnap.exists()) {
      return NextResponse.json({ success: false, message: "Laporan tidak ditemukan." }, { status: 404 });
    }

    const existingData = existingSnap.val() as Record<string, unknown>;
    const updateData: any = {
      status,
      updatedAt: Date.now(),
    };

    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes;
    }

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = Date.now();
      updateData.assignedTo = decodedToken.uid; // Track who resolved it
    }

    await reportRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      data: {
        id: reportId,
        ...sanitizeAnonymousReport(existingData),
        ...updateData,
      },
    });
  } catch (error: any) {
    console.error("PUT halo-spentgapa error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
