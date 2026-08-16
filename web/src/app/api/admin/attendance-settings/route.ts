/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

export const dynamic = 'force-dynamic';

/** Normalize admin times (`06.35`, `6:35`, `06:35:00`) to canonical `HH:mm`. */
function normalizeTimeValue(raw: unknown, fallback = ""): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return fallback;
  const normalized = trimmed
    .replace(/[．.,，：]/g, ":")
    .replace(/\s+/g, "");
  const parts = normalized.split(":").filter(Boolean);
  const hour = Number(parts[0]);
  const minute = Number(parts[1] ?? "0");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
    const { action, schoolId: requestedSchoolId, schedules, holiday, location, prayerTypes, overrides } = body;

    const targetSchoolId = role === "super_admin" ? (requestedSchoolId || userSchoolId) : userSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School context missing" }, { status: 400 });
    }

    const canonicalSchoolId = normalizeSchoolId(targetSchoolId);
    const schoolIdVariants = getSchoolIdVariants(canonicalSchoolId);
    const dbRef = adminDb.ref(`school_settings/${canonicalSchoolId}/attendance`);
    const prayerV2Ref = adminDb.ref(`school_settings/${canonicalSchoolId}/prayer_v2`);

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
      await adminDb.ref(`schools/${canonicalSchoolId}/schedule/weekdays`).set(legacyFormatted);
      
      return NextResponse.json({ success: true });
    }

    if (action === "save-prayer-v2-types") {
      const formatted: Record<string, any> = {};
      (Array.isArray(prayerTypes) ? prayerTypes : []).forEach((item: any) => {
        const id = String(item?.id || "").trim().toUpperCase();
        if (!id) return;
        formatted[id] = {
          label: String(item?.label || id),
          description: String(item?.description || ""),
          enabled: item?.enabled !== false,
          scheduleMode: String(item?.scheduleMode || "global_daily"),
          requireMuslim: item?.requireMuslim !== false,
          eligibleGender: String(item?.eligibleGender || "all"),
          locationRequired: item?.locationRequired !== false,
          startTime: normalizeTimeValue(item?.startTime, ""),
          endTime: normalizeTimeValue(item?.endTime, ""),
          activeDays: Array.isArray(item?.activeDays)
            ? item.activeDays.map((d: any) => Number(d)).filter((d: number) => Number.isFinite(d))
            : [],
          updatedAt: Date.now(),
        };
      });

      await prayerV2Ref.child("types").set(formatted);
      return NextResponse.json({ success: true });
    }

    if (action === "save-prayer-v2-schedules") {
      const formatted: Record<string, any> = {};
      (Array.isArray(schedules) ? schedules : []).forEach((item: any) => {
        const id = String(item?.id || "").trim();
        if (!id) return;
        formatted[id] = {
          prayerType: String(item?.prayerType || "DHUHA").toUpperCase(),
          classIds: Array.isArray(item?.classIds) ? item.classIds.filter(Boolean) : [],
          dayOfWeek: Number(item?.dayOfWeek ?? 1),
          startTime: normalizeTimeValue(item?.startTime, "07:00"),
          endTime: normalizeTimeValue(item?.endTime, "07:30"),
          active: item?.active !== false,
          notes: String(item?.notes || ""),
          updatedAt: Date.now(),
        };
      });

      await prayerV2Ref.child("schedules").set(formatted);
      return NextResponse.json({ success: true });
    }

    if (action === "save-prayer-v2-overrides") {
      const formatted: Record<string, any> = {};
      (Array.isArray(overrides) ? overrides : []).forEach((item: any) => {
        const id = String(item?.id || "").trim();
        if (!id) return;
        formatted[id] = {
          date: String(item?.date || ""),
          prayerType: String(item?.prayerType || "DHUHA").toUpperCase(),
          classIds: Array.isArray(item?.classIds) ? item.classIds.filter(Boolean) : [],
          action: item?.action === "activate" ? "activate" : "deactivate",
          notes: String(item?.notes || ""),
          updatedAt: Date.now(),
        };
      });

      await prayerV2Ref.child("overrides").set(formatted);
      return NextResponse.json({ success: true });
    }

    if (action === "add-holiday") {
      const newRef = dbRef.child("holidays").push();
      await newRef.set(holiday);
      
      // Mirror to legacy path for EduLock APK
      if (holiday?.date) {
        await adminDb.ref(`schools/${canonicalSchoolId}/holidays/${holiday.date}`).set({
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
        await adminDb.ref(`schools/${canonicalSchoolId}/holidays/${holData.date}`).remove();
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === "save-school-location") {
      await dbRef.child("school_location").set(location);
      
      // Mirror to legacy path for EduLock APK backward compatibility
      await adminDb.ref(`gas/schools/${canonicalSchoolId}`).update({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius
      });
      
      return NextResponse.json({ success: true });
    }

      if (action === "save-musholla-location") {
      for (const variant of schoolIdVariants) {
        await adminDb.ref(`school_settings/${variant}/prayer/musholla_location`).set(location);
      }
      
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

