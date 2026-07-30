import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

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

    const variants = getSchoolIdVariants(targetSchoolId);
    const canonicalSchoolId = normalizeSchoolId(targetSchoolId);
    
    let rawLogs: Record<string, any> = {};
    try {
      for (const variant of variants) {
        const bySchoolSnap = await adminDb.ref(`literacy_logs_by_school/${variant}`).once("value");
        if (bySchoolSnap.exists()) {
          rawLogs = { ...(rawLogs || {}), ...(bySchoolSnap.val() || {}) };
        }
      }

      if (!Object.keys(rawLogs).length) {
        const logsSnap = await adminDb.ref("literacy_logs").orderByChild("schoolId").equalTo(canonicalSchoolId).once("value");
        rawLogs = logsSnap.val() || {};

        const legacyVariant = variants.find((v) => v !== canonicalSchoolId);
        if (legacyVariant) {
          const legacySnap = await adminDb.ref("literacy_logs").orderByChild("schoolId").equalTo(legacyVariant).once("value");
          rawLogs = { ...(rawLogs || {}), ...(legacySnap.val() || {}) };
        }
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
        const scope = normalizeSchoolId(log.schoolId);
        return scope === canonicalSchoolId || variants.includes(scope);
      })
      .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

    return NextResponse.json({ success: true, literacyLogs });
  } catch (error: any) {
    console.error("Library Monitoring API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
