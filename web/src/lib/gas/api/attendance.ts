/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth, rtdb } from "@/lib/firebase/client";
import { ref as rtdbRef, get, update } from "firebase/database";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";
import { callAdminApi } from "@/lib/callAdminApi";

export interface ManualAttendancePayload {
  schoolId: string;
  studentId: string;
  status: string;
  date: string | number;
  note?: string;
  recordedBy?: string;
  checkInMethod?: string;
  recordId?: string;
  studentName?: string;
  className?: string;
  nisn?: string;
}

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

export const manualAttendanceInput = async (payload: ManualAttendancePayload) => {
  try {
    const canonicalSchoolId = normalizeSchoolId(payload.schoolId);
    if (!canonicalSchoolId || !payload.studentId || !payload.status) {
      throw new Error("Parameter wajib: schoolId, studentId, dan status.");
    }

    const schoolVariants = getSchoolIdVariants(canonicalSchoolId);
    const dateMillis = resolveDateMillis(payload.date);
    const targetDateKey = toDateKey(dateMillis);
    const cleanDateKey = targetDateKey.replace(/-/g, "");

    // 1. Dapatkan metadata siswa
    let studentName = String(payload.studentName || "").trim();
    let className = String(payload.className || "").trim();
    let nisn = String(payload.nisn || "").trim();

    if (!studentName || !className || !nisn) {
      try {
        const studentSnap = await get(
          rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/students/${payload.studentId}`)
        );
        const sData = studentSnap.val() || {};
        if (!studentName) studentName = String(sData.name || sData.studentName || sData.nama || "").trim();
        if (!className) className = String(sData.className || sData.class || sData.kelas || "").trim();
        if (!nisn) nisn = String(sData.nisn || sData.nis || "").trim();
      } catch (err) {
        console.warn("Gagal membaca metadata siswa:", err);
      }
    }

    // 2. Resolusi ID record
    let recordId = "";
    let existingData: Record<string, any> | null = null;

    if (payload.recordId && !String(payload.recordId).startsWith("missing-")) {
      recordId = String(payload.recordId).trim();
      try {
        const existingSnap = await get(rtdbRef(rtdb, `attendance/${recordId}`));
        existingData = existingSnap.val();
      } catch {
        // Abaikan jika belum ada
      }
    } else {
      try {
        const schoolSnap = await get(rtdbRef(rtdb, `attendance_by_school/${canonicalSchoolId}`));
        const records = schoolSnap.val() || {};
        for (const [id, val] of Object.entries(records as Record<string, any>)) {
          if (!val) continue;
          const valMillis = resolveDateMillis(val.date);
          if (
            String(val.studentId || "").trim() === String(payload.studentId).trim() &&
            toDateKey(valMillis) === targetDateKey
          ) {
            recordId = id;
            existingData = val;
            break;
          }
        }
      } catch (err) {
        console.warn("Gagal mencari record absensi eksis:", err);
      }

      if (!recordId) {
        recordId = `manual_${canonicalSchoolId}_${payload.studentId}_${cleanDateKey}`;
      }
    }

    // 3. Tentukan checkInTime
    let checkInTimeVal = existingData?.checkInTime ?? null;
    const upperStatus = String(payload.status).trim().toUpperCase();
    if (upperStatus === "PRESENT" && !checkInTimeVal) {
      checkInTimeVal = "07:00";
    } else if (upperStatus === "LATE" && !checkInTimeVal) {
      checkInTimeVal = "07:35";
    } else if (["IZIN", "SAKIT", "ALPHA", "ABSENT"].includes(upperStatus)) {
      checkInTimeVal = null;
    }

    const adminIdentifier =
      auth.currentUser?.email || auth.currentUser?.displayName || "Admin";
    const noteText = payload.note || "Diubah manual oleh admin";

    const recordToSave: Record<string, any> = {
      ...(existingData || {}),
      id: recordId,
      studentId: String(payload.studentId).trim(),
      schoolId: canonicalSchoolId,
      date: dateMillis,
      status: upperStatus,
      checkInTime: checkInTimeVal,
      checkOutTime: existingData?.checkOutTime ?? null,
      checkInMethod: payload.checkInMethod || "MANUAL_ADMIN",
      notes: noteText,
      note: noteText,
      recordedBy: payload.recordedBy || "admin_manual",
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

    await update(rtdbRef(rtdb), updates);

    return { success: true, recordId, data: recordToSave };
  } catch (clientError) {
    console.warn("Client-side RTDB update gagal, mencoba fallback via API route:", clientError);
    // Fallback ke server route menggunakan Firebase Admin SDK
    return await callAdminApi("/api/admin/attendance", "POST", payload as any);
  }
};

