import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { normalizeClassName } from "@/lib/guru/normalizeClass";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import {
  buildIdentityMap,
  matchStudentByRow,
  normalizeIdentity,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

function isReviewedStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "GRADED" || s === "REVIEWED" || s === "CORRECTED" || s === "REJECTED";
}

async function loadLog(
  schoolId: string,
  logId: string
): Promise<(Record<string, unknown> & { id: string }) | null> {
  const scope = normalizeSchoolId(schoolId);
  const scoped = await adminDb
    .ref(`literacy_logs_by_school/${scope}/${logId}`)
    .once("value");
  if (scoped.exists()) {
    return { id: logId, ...(scoped.val() as Record<string, unknown>) };
  }
  const root = await adminDb.ref(`literacy_logs/${logId}`).once("value");
  if (!root.exists()) return null;
  const row = root.val() as Record<string, unknown>;
  const rowSchool = normalizeSchoolId(row.schoolId);
  if (scope && rowSchool && rowSchool !== scope) return null;
  return { id: logId, ...row };
}

function logBelongsToClass(
  row: Record<string, unknown>,
  students: Awaited<ReturnType<typeof loadHomeroomStudents>>,
  className: string
): boolean {
  const identityMap = buildIdentityMap(students);
  if (matchStudentByRow(row, identityMap)) return true;

  const name = String(row.studentName || row.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (name && students.some((s) => s.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === name)) {
    return true;
  }

  const logClass = normalizeClassName(
    String(row.studentClass || row.class || row.kelas || "")
  );
  const target = normalizeClassName(className);
  return Boolean(target && logClass && logClass === target);
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    const body = await req.json();
    const action = String(body.action || "grade").trim().toLowerCase();
    const logId = normalizeIdentity(body.logId);

    if (!logId) {
      return NextResponse.json(
        { success: false, message: "logId wajib diisi." },
        { status: 400 }
      );
    }

    const students = await loadHomeroomStudents(teacher.schoolId, teacher.className);
    const existing = await loadLog(teacher.schoolId, logId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Laporan literasi tidak ditemukan." },
        { status: 404 }
      );
    }
    if (!logBelongsToClass(existing, students, teacher.className)) {
      return NextResponse.json(
        { success: false, message: "Laporan di luar kelas wali Anda." },
        { status: 403 }
      );
    }

    if (action === "delete") {
      const updates: Record<string, null> = {
        [`literacy_logs/${logId}`]: null,
        [`literacy_logs_by_school/${teacher.schoolId}/${logId}`]: null,
      };
      await adminDb.ref().update(updates);
      return NextResponse.json({
        success: true,
        message: "Laporan literasi dihapus.",
      });
    }

    const grade = String(body.grade || "").trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(grade)) {
      return NextResponse.json(
        { success: false, message: "Nilai harus A, B, C, atau D." },
        { status: 400 }
      );
    }
    const feedback = String(body.feedback || "").trim();
    const now = Date.now();
    const updates: Record<string, unknown> = {
      [`literacy_logs/${logId}/grade`]: grade,
      [`literacy_logs/${logId}/feedback`]: feedback,
      [`literacy_logs/${logId}/status`]: "GRADED",
      [`literacy_logs/${logId}/gradedAt`]: now,
      [`literacy_logs_by_school/${teacher.schoolId}/${logId}/grade`]: grade,
      [`literacy_logs_by_school/${teacher.schoolId}/${logId}/feedback`]: feedback,
      [`literacy_logs_by_school/${teacher.schoolId}/${logId}/status`]: "GRADED",
      [`literacy_logs_by_school/${teacher.schoolId}/${logId}/gradedAt`]: now,
    };

    await adminDb.ref().update(updates);

    return NextResponse.json({
      success: true,
      message: isReviewedStatus(String(existing.status || ""))
        ? "Nilai literasi diperbarui."
        : "Nilai literasi disimpan.",
      grade,
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("Teacher literacy POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menilai literasi.",
      },
      { status: 500 }
    );
  }
}
