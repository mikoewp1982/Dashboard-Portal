/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

export const dynamic = "force-dynamic";

function resolveDateMillis(dateInput: unknown): number {
  if (typeof dateInput === "number" && Number.isFinite(dateInput) && dateInput > 0) {
    return dateInput;
  }
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num) && num > 0) return num;
    }
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = Number(match[1]);
      const m = Number(match[2]) - 1;
      const d = Number(match[3]);
      return new Date(y, m, d, 7, 0, 0, 0).getTime();
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return Date.now();
}

function toDateKey(dateMillis: number): string {
  const d = new Date(dateMillis);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId, email, name } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const body = await req.json();
    const {
      schoolId: requestedSchoolId,
      studentId,
      status,
      date,
      note,
      recordedBy,
      checkInMethod,
      recordId: requestedRecordId,
      studentName: providedStudentName,
      className: providedClassName,
      nisn: providedNisn,
    } = body;

    const targetSchoolId =
      role === "super_admin"
        ? (requestedSchoolId || userSchoolId)
        : (userSchoolId || requestedSchoolId);

    if (!targetSchoolId || !studentId || !status) {
      return NextResponse.json(
        { error: "Parameter wajib: schoolId, studentId, dan status." },
        { status: 400 }
      );
    }

    const canonicalSchoolId = normalizeSchoolId(targetSchoolId);
    const schoolVariants = getSchoolIdVariants(canonicalSchoolId);
    const dateMillis = resolveDateMillis(date);
    const targetDateKey = toDateKey(dateMillis);
    const cleanDateKey = targetDateKey.replace(/-/g, "");

    // Ambil metadata siswa jika belum disediakan
    let studentName = String(providedStudentName || "").trim();
    let className = String(providedClassName || "").trim();
    let nisn = String(providedNisn || "").trim();

    if (!studentName || !className || !nisn) {
      const studentSnap = await adminDb
        .ref(`gas/schools/${canonicalSchoolId}/students/${studentId}`)
        .once("value");
      const sData = studentSnap.val() || {};
      if (!studentName) {
        studentName = String(sData.name || sData.studentName || sData.nama || "").trim();
      }
      if (!className) {
        className = String(sData.className || sData.class || sData.kelas || "").trim();
      }
      if (!nisn) {
        nisn = String(sData.nisn || sData.nis || "").trim();
      }
    }

    // Resolusi record ID yang akan diupdate
    let recordId = "";
    let existingData: Record<string, any> | null = null;

    if (requestedRecordId && !String(requestedRecordId).startsWith("missing-")) {
      recordId = String(requestedRecordId).trim();
      const existingSnap = await adminDb.ref(`attendance/${recordId}`).once("value");
      existingData = existingSnap.val();
      // Cari apakah sudah ada record attendance untuk siswa dan tanggal yang sama
      const targetStudentId = String(studentId || "").trim();
      const targetNisn = String(providedNisn || "").trim();
      const schoolAttendanceSnap = await adminDb
        .ref(`attendance_by_school/${canonicalSchoolId}`)
        .once("value");
      const schoolAttendances = schoolAttendanceSnap.val() || {};

      for (const [id, val] of Object.entries(schoolAttendances as Record<string, any>)) {
        if (!val) continue;
        const valDate = resolveDateMillis(val.date);
        if (toDateKey(valDate) !== targetDateKey) continue;
        const valStudentId = String(val.studentId || "").trim();
        const valNisn = String(val.nisn || "").trim();
        const matchesStudent =
          (targetStudentId && (valStudentId === targetStudentId || (targetNisn && valStudentId === targetNisn))) ||
          (targetNisn && (valNisn === targetNisn || valNisn === targetStudentId));
        if (matchesStudent) {
          recordId = id;
          existingData = val;
          break;
        }
      }

      if (!recordId) {
        recordId = `manual_${canonicalSchoolId}_${studentId}_${cleanDateKey}`;
      }
    }

function toCanonicalDbStatus(raw: unknown): string {
  const upper = String(raw || "").trim().toUpperCase();
  switch (upper) {
    case "SAKIT":
    case "SICK":
    case "S":
      return "SICK";
    case "IZIN":
    case "PERMIT":
    case "I":
      return "PERMIT";
    case "ALPHA":
    case "ABSENT":
    case "A":
      return "ABSENT";
    case "LATE":
    case "TERLAMBAT":
    case "T":
      return "LATE";
    case "PRESENT":
    case "HADIR":
    case "H":
    default:
      return "PRESENT";
  }
}

    // Tentukan checkInTime default jika diperlukan
    const canonicalStatus = toCanonicalDbStatus(status);
    let checkInTimeVal = existingData?.checkInTime ?? null;
    if (canonicalStatus === "PRESENT" && !checkInTimeVal) {
      checkInTimeVal = "07:00";
    } else if (canonicalStatus === "LATE" && !checkInTimeVal) {
      checkInTimeVal = "07:35";
    } else if (["PERMIT", "SICK", "ABSENT"].includes(canonicalStatus)) {
      checkInTimeVal = null;
    }

    const adminIdentifier = email || name || "Admin";
    const noteText = note || "Diubah manual oleh admin";

    const recordToSave: Record<string, any> = {
      ...(existingData || {}),
      id: recordId,
      studentId: String(studentId).trim(),
      schoolId: canonicalSchoolId,
      date: dateMillis,
      status: canonicalStatus,
      checkInTime: checkInTimeVal,
      checkOutTime: existingData?.checkOutTime ?? null,
      checkInMethod: checkInMethod || "MANUAL_ADMIN",
      notes: noteText,
      note: noteText,
      recordedBy: recordedBy || "admin_manual",
      verificationStatus: "APPROVED",
      verifiedBy: adminIdentifier,
      verifiedAt: Date.now(),
      studentName: studentName || existingData?.studentName || "Siswa",
      className: className || existingData?.className || "",
      nisn: nisn || existingData?.nisn || "",
      updatedAt: Date.now(),
    };

    if (!recordToSave.createdAt) {
      recordToSave.createdAt = dateMillis;
    }

    const updates: Record<string, any> = {
      [`attendance/${recordId}`]: recordToSave,
    };
    for (const variant of schoolVariants) {
      updates[`attendance_by_school/${variant}/${recordId}`] = recordToSave;
    }

    await adminDb.ref().update(updates);

    return NextResponse.json({
      success: true,
      recordId,
      data: recordToSave,
    });
  } catch (error: any) {
    console.error("Attendance API route error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan presensi." },
      { status: 500 }
    );
  }
}
