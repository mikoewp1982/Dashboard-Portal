import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") || "";

  try {
    const results: Record<string, any> = {};

    if (schoolId) {
      // Check specific school
      const teachersSnap = await adminDb.ref(`gas/schools/${schoolId}/teachers`).once("value");
      const studentsSnap = await adminDb.ref(`gas/schools/${schoolId}/students`).once("value");

      const teachers = teachersSnap.val() || {};
      const students = studentsSnap.val() || {};

      results.schoolId = schoolId;
      results.teacherCount = Object.keys(teachers).length;
      results.studentCount = Object.keys(students).length;
      results.teachers = Object.entries(teachers).map(([key, t]: [string, any]) => ({
        key,
        name: t.name || t.nama,
        nuptk: t.nuptk,
        homeroomClass: t.homeroomClass || t.class || t.kelas,
        schoolId: t.schoolId,
        role: t.role,
      }));
      results.students = Object.entries(students).map(([key, s]: [string, any]) => ({
        key,
        name: s.name || s.nama,
        nisn: s.nisn,
        class: s.class,
        className: s.className,
        kelas: s.kelas,
        schoolId: s.schoolId,
      }));
    } else {
      // List all schools that have teachers or students
      const allSchoolsSnap = await adminDb.ref("gas/schools").once("value");
      const allSchools = allSchoolsSnap.val() || {};

      results.schools = Object.entries(allSchools)
        .filter(([_, data]: [string, any]) => {
          return (data.teachers && Object.keys(data.teachers).length > 0) ||
                 (data.students && Object.keys(data.students).length > 0);
        })
        .map(([id, data]: [string, any]) => ({
          schoolId: id,
          teacherCount: data.teachers ? Object.keys(data.teachers).length : 0,
          studentCount: data.students ? Object.keys(data.students).length : 0,
        }));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
