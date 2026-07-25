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
      const legacyFormatted: Record<string, any> = {};
      const dayMapping: Record<number, string> = {
        1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun"
      };

      schedules.forEach((s: any) => {
        formatted[String(s.dayId + 1)] = {
          startTime: s.entryTime,
          endTime: s.exitTime,
          isHoliday: !s.isEnabled
        };
        const legacyKey = dayMapping[s.dayId];
        if (legacyKey) {
          legacyFormatted[legacyKey] = {
            enabled: s.isEnabled,
            start: s.entryTime,
            end: s.exitTime
          };
        }
      });
      await dbRef.child("schedules").set(formatted);
      
      // Mirror to legacy path for EduLock APK backward compatibility
      await adminDb.ref(`schools/${targetSchoolId}/schedule/weekdays`).set(legacyFormatted);
      
      return NextResponse.json({ success: true });
    }

    if (action === "add-holiday") {
      const newRef = dbRef.child("holidays").push();
      await newRef.set(holiday);
      
      // Mirror to legacy path for EduLock APK
      if (holiday?.date) {
        await adminDb.ref(`schools/${targetSchoolId}/holidays/${holiday.date}`).set({
          note: holiday.description || ""
        });
      }
      
      return NextResponse.json({ success: true, id: newRef.key });
    }

    if (action === "remove-holiday") {
      if (!holiday?.id) throw new Error("Holiday ID missing");
      
      // Fetch the holiday first to get the date for legacy mirror deletion
      const snap = await dbRef.child("holidays").child(holiday.id).once("value");
      const holData = snap.val();
      
      await dbRef.child("holidays").child(holiday.id).remove();
      
      // Remove from legacy path for EduLock APK
      if (holData?.date) {
        await adminDb.ref(`schools/${targetSchoolId}/holidays/${holData.date}`).remove();
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === "save-school-location") {
      await dbRef.child("school_location").set(location);
      
      // Mirror to legacy path for EduLock APK backward compatibility
      await adminDb.ref(`gas/schools/${targetSchoolId}`).update({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius
      });
      
      return NextResponse.json({ success: true });
    }

      if (action === "save-musholla-location") {
        const normalizedTarget = targetSchoolId.trim().toLowerCase().replace(/[\s\-]+/g, "_");
        const prayerRef = adminDb.ref(`school_settings/${normalizedTarget}/prayer`);
      await prayerRef.child("musholla_location").set(location);
      
      // Mirror to legacy root path for older APK versions
      await adminDb.ref("musholla_location").set({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Attendance settings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

