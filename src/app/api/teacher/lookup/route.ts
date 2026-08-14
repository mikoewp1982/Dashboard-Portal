import { NextResponse } from "next/server";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  findTeacher,
  isTeacherActive,
  readTeacherString,
} from "@/lib/guru/findTeacher";

export const dynamic = "force-dynamic";

/** Lightweight name lookup — mirrors APK auto-fill of Nama Guru from NPSN + NUPTK. */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      npsn?: string;
      nuptk?: string;
    };
    const npsn = String(body.npsn || "").trim();
    const nuptk = String(body.nuptk || "").trim();

    if (!npsn || !nuptk) {
      return NextResponse.json(
        { success: false, message: "NPSN dan NUPTK wajib diisi." },
        { status: 400 }
      );
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: npsn,
      npsn,
    });
    if (!schoolContext?.schoolId) {
      return NextResponse.json(
        { success: false, message: "Sekolah dengan NPSN tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const schoolId = normalizeSchoolId(schoolContext.schoolId);
    const teacher = await findTeacher(schoolId, nuptk);
    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: "Guru dengan NUPTK tersebut tidak terdaftar di database admin.",
        },
        { status: 404 }
      );
    }

    if (!isTeacherActive(teacher.row)) {
      return NextResponse.json(
        { success: false, message: "Akun guru berstatus Nonaktif." },
        { status: 403 }
      );
    }

    const name = readTeacherString(teacher.row, "name", "nama");
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Data nama guru tidak tersedia di database." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      name,
      nuptk: readTeacherString(teacher.row, "nuptk") || nuptk,
      schoolId,
      schoolName: schoolContext.name || "",
    });
  } catch (error: unknown) {
    console.error("Teacher lookup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memeriksa data guru.",
      },
      { status: 500 }
    );
  }
}
