/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

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
    const { action, schoolId: requestedSchoolId, schedules, holiday, location } = body;

    const targetSchoolId = role === "super_admin" ? (requestedSchoolId || userSchoolId) : userSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School context missing" }, { status: 400 });
    }

    const dbRef = adminDb.ref(`school_settings/${targetSchoolId}/attendance`);

    if (action === "save-attendance-schedules") {
      const formatted: Record<string, any> = {};
      schedules.forEach((s: any) => {
        formatted[String(s.dayId + 1)] = {
          startTime: s.entryTime,
          endTime: s.exitTime,
          isHoliday: !s.isEnabled
        };
      });
      await dbRef.child("schedules").set(formatted);
      return NextResponse.json({ success: true });
    }

    if (action === "add-holiday") {
      const newRef = dbRef.child("holidays").push();
      await newRef.set(holiday);
      return NextResponse.json({ success: true, id: newRef.key });
    }

    if (action === "remove-holiday") {
      if (!holiday?.id) throw new Error("Holiday ID missing");
      await dbRef.child("holidays").child(holiday.id).remove();
      return NextResponse.json({ success: true });
    }

    if (action === "save-school-location") {
      await dbRef.child("school_location").set(location);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Attendance settings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

