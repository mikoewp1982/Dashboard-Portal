import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

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
    const monthStr = url.searchParams.get("month");
    const yearStr = url.searchParams.get("year");

    const targetSchoolId = role === "super_admin" ? schoolId : userSchoolId;
    if (!targetSchoolId || !monthStr || !yearStr) {
      return NextResponse.json({ error: "Missing required query params" }, { status: 400 });
    }

    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!Number.isFinite(month) || !Number.isFinite(year)) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    const studentsSnap = await adminDb.ref(`gas/schools/${targetSchoolId}/students`).once("value");
    const students = studentsSnap.val() || {};

    const identityKeys = new Set<string>();
    Object.entries<any>(students).forEach(([studentId, rawStudent]) => {
      if (rawStudent?.status === "Nonaktif") return;
      const normalizedId = normalizeIdentity(studentId);
      const normalizedNisn = normalizeIdentity(rawStudent?.nisn);
      if (normalizedId) identityKeys.add(normalizedId);
      if (normalizedNisn) identityKeys.add(normalizedNisn);
    });

    const logSnapshots = await Promise.all(
      Array.from(identityKeys).map(async (identityKey) => ({
        identityKey,
        snapshot: await adminDb.ref(`seven_habits_logs/${identityKey}`).once("value"),
      }))
    );

    const logsMap = new Map<string, {
      id: string;
      studentId: string;
      studentName: string;
      className: string;
      date: string;
      week: number;
      month: number;
      year: number;
      habits: {
        habit1: boolean;
        habit2: boolean;
        habit3: boolean;
        habit4: boolean;
        habit5: boolean;
        habit6: boolean;
        habit7: boolean;
      };
    }>();

    logSnapshots.forEach(({ identityKey, snapshot }) => {
      const rawLogs = snapshot.val();
      if (!rawLogs || typeof rawLogs !== "object") return;

      Object.entries<any>(rawLogs).forEach(([dateStr, rawLog]) => {
        const [y, m, d] = String(dateStr).split("-").map(Number);
        if (m !== month || y !== year) return;

        const mapKey = `${identityKey}:${dateStr}`;
        logsMap.set(mapKey, {
          id: String(rawLog?.id || `sync_${identityKey}_${dateStr}`),
          studentId: identityKey,
          studentName: "",
          className: "",
          date: String(dateStr),
          week: Math.ceil(d / 7),
          month: m,
          year: y,
          habits: {
            habit1: Boolean(rawLog?.habits?.habit1 ?? rawLog?.habit1 ?? false),
            habit2: Boolean(rawLog?.habits?.habit2 ?? rawLog?.habit2 ?? false),
            habit3: Boolean(rawLog?.habits?.habit3 ?? rawLog?.habit3 ?? false),
            habit4: Boolean(rawLog?.habits?.habit4 ?? rawLog?.habit4 ?? false),
            habit5: Boolean(rawLog?.habits?.habit5 ?? rawLog?.habit5 ?? false),
            habit6: Boolean(rawLog?.habits?.habit6 ?? rawLog?.habit6 ?? false),
            habit7: Boolean(rawLog?.habits?.habit7 ?? rawLog?.habit7 ?? false),
          },
        });
      });
    });

    const ratingsSnap = await adminDb.ref(`seven_habits_teacher_ratings/${targetSchoolId}`).once("value");
    const rawRatings = ratingsSnap.val() || {};
    const teacherRatings = Object.fromEntries(
      Object.entries<any>(rawRatings).filter(([key]) => key.endsWith(`_${month}_${year}`))
    );

    return NextResponse.json({
      success: true,
      logs: Array.from(logsMap.values()),
      teacherRatings,
    });
  } catch (error: any) {
    console.error("7 Habits API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { action, schoolId, studentId, month, year, rubric } = body;

    const targetSchoolId = role === "super_admin" ? schoolId : userSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    if (action === "set-teacher-rating") {
      if (!studentId || !month || !year || !rubric) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const ratingKey = `${String(studentId).trim()}_${month}_${year}`;
      const ref = adminDb.ref(`seven_habits_teacher_ratings/${targetSchoolId}/${ratingKey}`);
      
      await ref.set({
        ...rubric,
        updatedAt: Date.now(),
        updatedBy: decodedToken.email || "admin",
      });

      return NextResponse.json({ success: true, message: "Teacher rating saved successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("7 Habits API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
