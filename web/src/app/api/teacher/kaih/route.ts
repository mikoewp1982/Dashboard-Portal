import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import { normalizeIdentity } from "@/lib/guru/studentIdentity";
import {
  clampRubric,
  rubricTotal,
  type TeacherHabitRubric,
} from "@/lib/guru/kaihGrading";

export const dynamic = "force-dynamic";

function clampMonth(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return Math.round(n);
}

function clampYear(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 2020 || n > 2100) return null;
  return Math.round(n);
}

function parseRubricBody(raw: unknown): TeacherHabitRubric | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const honesty = clampRubric(Number(row.honesty ?? 0));
  const behavior = clampRubric(Number(row.behavior ?? 0));
  const initiative = clampRubric(Number(row.initiative ?? 0));
  const commitment = clampRubric(Number(row.commitment ?? 0));
  return {
    honesty,
    behavior,
    initiative,
    commitment,
    total: rubricTotal({ honesty, behavior, initiative, commitment }),
    ratedAt: Date.now(),
  };
}

function studentAllowed(
  studentId: string,
  students: Awaited<ReturnType<typeof loadHomeroomStudents>>
): boolean {
  const key = normalizeIdentity(studentId).toLowerCase();
  if (!key) return false;
  return students.some((s) =>
    s.identities.some((id) => id.toLowerCase() === key) ||
    s.id.toLowerCase() === key ||
    s.nisn.toLowerCase() === key
  );
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    const body = await req.json();
    const action = String(body.action || "rate").trim().toLowerCase();
    const month = clampMonth(body.month);
    const year = clampYear(body.year);
    const rubric = parseRubricBody(body.rubric);

    if (!month || !year || !rubric) {
      return NextResponse.json(
        { success: false, message: "Bulan, tahun, dan rubrik wajib diisi." },
        { status: 400 }
      );
    }

    const students = await loadHomeroomStudents(
      teacher.schoolId,
      teacher.className
    );
    if (students.length === 0) {
      return NextResponse.json(
        { success: false, message: "Belum ada siswa di kelas wali Anda." },
        { status: 400 }
      );
    }

    const schoolId = normalizeSchoolId(teacher.schoolId);
    const now = Date.now();
    const payload = {
      honesty: rubric.honesty,
      behavior: rubric.behavior,
      initiative: rubric.initiative,
      commitment: rubric.commitment,
      total: rubric.total,
      ratedAt: now,
      updatedAt: now,
      updatedBy: teacher.nuptk || teacher.uid,
    };

    if (action === "rate-all") {
      const requestedIds: string[] = Array.isArray(body.studentIds)
        ? body.studentIds
            .map((id: unknown) => normalizeIdentity(id))
            .filter((id: string): id is string => Boolean(id))
        : students.map((s) => s.id);

      const allowedIds = Array.from(
        new Set(requestedIds.filter((id) => studentAllowed(id, students)))
      );

      if (allowedIds.length === 0) {
        return NextResponse.json(
          { success: false, message: "Belum ada siswa untuk dinilai." },
          { status: 400 }
        );
      }

      const updates: Record<string, unknown> = {};
      allowedIds.forEach((studentId) => {
        const ratingKey = `${studentId}_${month}_${year}`;
        updates[`seven_habits_teacher_ratings/${schoolId}/${ratingKey}`] = payload;
      });

      await adminDb.ref().update(updates);
      return NextResponse.json({
        success: true,
        message: `Nilai kelas berhasil diterapkan ke ${allowedIds.length} siswa.`,
        count: allowedIds.length,
        rubric: payload,
      });
    }

    // Single student rating (default)
    const studentId = normalizeIdentity(body.studentId);
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId wajib diisi." },
        { status: 400 }
      );
    }
    if (!studentAllowed(studentId, students)) {
      return NextResponse.json(
        { success: false, message: "Siswa di luar kelas wali Anda." },
        { status: 403 }
      );
    }

    const ratingKey = `${studentId}_${month}_${year}`;
    await adminDb
      .ref(`seven_habits_teacher_ratings/${schoolId}/${ratingKey}`)
      .set(payload);

    return NextResponse.json({
      success: true,
      message: "Nilai guru berhasil disimpan.",
      rubric: payload,
    });
  } catch (error) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("Teacher KAIH API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan nilai.",
      },
      { status: 500 }
    );
  }
}
