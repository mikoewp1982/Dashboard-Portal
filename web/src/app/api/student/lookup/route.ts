import { NextResponse } from "next/server";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      npsn?: string;
      nisn?: string;
    };

    const npsn = String(body.npsn || "").trim();
    const nisn = String(body.nisn || "").trim();

    if (!npsn || !nisn) {
      return NextResponse.json({ success: false, message: "NPSN dan NISN wajib diisi." }, { status: 400 });
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: npsn,
      npsn,
    });

    if (!schoolContext?.schoolId) {
      return NextResponse.json({ success: false, message: "Sekolah tidak ditemukan." }, { status: 404 });
    }

    const schoolId = normalizeSchoolId(schoolContext.schoolId);
    
    // Cari siswa di RTDB: gas/schools/{schoolId}/students/{nisn}
    const studentsRef = adminDb.ref(`gas/schools/${schoolId}/students`);
    let studentSnap = await studentsRef.child(nisn).once("value");
    
    if (!studentSnap.exists()) {
      // Coba lookup by numeric child 'nisn'
      const querySnap = await studentsRef.orderByChild("nisn").equalTo(Number(nisn)).once("value");
      if (querySnap.exists()) {
        const firstChild = Object.values(querySnap.val() || {})[0];
        studentSnap = { exists: () => true, val: () => firstChild } as any;
      }
    }

    if (!studentSnap || !studentSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "NISN tidak terdaftar di database sekolah ini." },
        { status: 404 }
      );
    }

    const studentData = studentSnap.val();
    const studentName = studentData.name || studentData.nama || "Siswa";

    return NextResponse.json({
      success: true,
      name: studentName,
    });
  } catch (error: unknown) {
    console.error("Student lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa data siswa." },
      { status: 500 }
    );
  }
}
