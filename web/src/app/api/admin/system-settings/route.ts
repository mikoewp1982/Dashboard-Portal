/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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
    const { action, schoolId: requestedSchoolId, identity, academicYear, academicYearId } = body;

    const targetSchoolId = role === "super_admin" ? (requestedSchoolId || userSchoolId) : userSchoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School context missing" }, { status: 400 });
    }

    const dbRef = adminDb.ref(`school_settings/${targetSchoolId}/system`);

    if (action === "save-identity") {
      if (!identity) {
        return NextResponse.json({ error: "Identity data missing" }, { status: 400 });
      }
      await dbRef.child("identity").set(identity);
      return NextResponse.json({ success: true });
    }

    if (action === "add-academic-year") {
      if (!academicYear || !academicYear.id) {
        return NextResponse.json({ error: "Academic year data missing" }, { status: 400 });
      }
      await dbRef.child("academic_years").child(academicYear.id).set(academicYear);
      return NextResponse.json({ success: true, id: academicYear.id });
    }

    if (action === "remove-academic-year") {
      if (!academicYearId) {
         return NextResponse.json({ error: "Academic year ID missing" }, { status: 400 });
      }
      await dbRef.child("academic_years").child(academicYearId).remove();
      return NextResponse.json({ success: true });
    }

    if (action === "set-active-academic-year") {
      if (!academicYearId) {
         return NextResponse.json({ error: "Academic year ID missing" }, { status: 400 });
      }
      
      // Update all academic years to set isActive based on ID
      const yearsSnap = await dbRef.child("academic_years").once("value");
      const years = yearsSnap.val() || {};
      const updates: Record<string, any> = {};
      
      Object.keys(years).forEach(key => {
        updates[`${key}/isActive`] = key === academicYearId;
      });
      
      await dbRef.child("academic_years").update(updates);
      await dbRef.child("active_year_id").set(academicYearId);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("System settings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

