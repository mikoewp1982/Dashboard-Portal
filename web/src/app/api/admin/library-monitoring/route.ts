import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");
    const targetSchoolId = role === "super_admin" ? schoolId : userSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const normalizedSchoolId = targetSchoolId.trim().toLowerCase().replace(/[\s\-]+/g, "_");
    
    let rawLogs: Record<string, any> = {};
    try {
      const bySchoolSnap = await adminDb.ref(`literacy_logs_by_school/${normalizedSchoolId}`).once("value");
      if (bySchoolSnap.exists()) {
        rawLogs = bySchoolSnap.val() || {};
      } else {
        const logsSnap = await adminDb.ref("literacy_logs").orderByChild("schoolId").equalTo(normalizedSchoolId).once("value");
        rawLogs = logsSnap.val() || {};
      }
    } catch (queryErr) {
      const logsSnap = await adminDb.ref("literacy_logs").once("value");
      rawLogs = logsSnap.val() || {};
    }

    const literacyLogs = Object.entries<any>(rawLogs)
      .map(([id, rawLog]) => ({
        id,
        ...rawLog,
      }))
      .filter((log) => {
        const scope = String(log.schoolId || "").trim().toLowerCase().replace(/[\s\-]+/g, "_");
        return scope === normalizedSchoolId || scope === targetSchoolId.trim().toLowerCase();
      })
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    return NextResponse.json({ success: true, literacyLogs });
  } catch (error: any) {
    console.error("Library Monitoring API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
