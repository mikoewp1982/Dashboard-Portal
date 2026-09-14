export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { dispatchFindDeviceCommand } from "@/lib/admin/edulockFindDevice";

type ParentEdulockRequestBody = {
  action: "find-device" | "stop-find-device" | "get-status";
  schoolId: string;
  npsn?: string;
  nisn: string;
  studentId?: string;
  deviceId?: string;
  durationMs?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ParentEdulockRequestBody;
    const action = body.action;
    const rawSchoolId = String(body.schoolId || body.npsn || "").trim();
    const nisn = String(body.nisn || "").trim();
    const studentId = String(body.studentId || "").trim();
    let deviceId = String(body.deviceId || "").trim();
    const durationMs = Math.min(Math.max(Number(body.durationMs) || 45_000, 15_000), 120_000);

    if (!rawSchoolId || (!nisn && !studentId)) {
      return NextResponse.json(
        { success: false, message: "schoolId/npsn dan nisn/studentId wajib diisi." },
        { status: 400 }
      );
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: rawSchoolId,
      npsn: body.npsn || rawSchoolId,
    });

    const schoolId = schoolContext?.schoolId
      ? normalizeSchoolId(schoolContext.schoolId)
      : normalizeSchoolId(rawSchoolId);

    // 1. Verifikasi data siswa di database sekolah
    const studentsRef = adminDb.ref(`gas/schools/${schoolId}/students`);
    let studentSnap = await studentsRef.child(studentId || nisn).get();
    if (!studentSnap.exists()) {
      const querySnap = await studentsRef.orderByChild("nisn").equalTo(nisn).get();
      if (querySnap.exists()) {
        const firstChild = Object.values(querySnap.val() as Record<string, unknown>)[0];
        studentSnap = { exists: () => true, val: () => firstChild } as any;
      }
    }

    const studentData = studentSnap.exists() ? (studentSnap.val() as Record<string, unknown>) : null;
    const boundDeviceId = String(
      studentData?.deviceId || studentData?.device || studentData?.gasDeviceId || ""
    ).trim();

    if (!deviceId && boundDeviceId) {
      deviceId = boundDeviceId;
    }

    // 2. Jika deviceId masih belum ketemu, cari di active_devices
    if (!deviceId) {
      const activeDevicesSnap = await adminDb.ref(`active_devices/${schoolId}`).get();
      if (activeDevicesSnap.exists()) {
        const allDevices = activeDevicesSnap.val() as Record<string, Record<string, unknown>>;
        for (const [key, dev] of Object.entries(allDevices)) {
          const dNisn = String(dev.nisn || "").trim();
          const dStudentId = String(dev.studentId || "").trim();
          if ((nisn && dNisn === nisn) || (studentId && dStudentId === studentId)) {
            deviceId = key;
            break;
          }
        }
      }
    }

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Perangkat HP ananda belum terdaftar atau belum terhubung dengan EduLock.",
        },
        { status: 404 }
      );
    }

    if (action === "find-device" || action === "stop-find-device") {
      const commandType = action === "find-device" ? "find_device_start" : "find_device_stop";
      const latestCommand = await dispatchFindDeviceCommand({
        schoolId,
        targetDeviceId: deviceId,
        requestedByUid: `parent_${nisn}`,
        requestedByEmail: `ortu_${nisn}@gas.local`,
        durationMs,
        commandType,
      });

      // Update requested state langsung di active_devices agar dapat dibaca listener
      const activeDeviceRef = adminDb.ref(`active_devices/${schoolId}/${deviceId}`);
      await activeDeviceRef.update({
        lastFindDeviceRequestedBy: "parent",
        lastFindDeviceRequestedAt: Date.now(),
        lastFindDeviceCommandId: latestCommand.commandId,
      });

      return NextResponse.json({
        success: true,
        message:
          action === "find-device"
            ? "Perintah bunyikan HP berhasil dikirim ke perangkat ananda."
            : "Perintah matikan alarm berhasil dikirim ke perangkat ananda.",
        deviceId,
        command: latestCommand,
      });
    }

    // Default: get-status
    const deviceSnap = await adminDb.ref(`active_devices/${schoolId}/${deviceId}`).get();
    return NextResponse.json({
      success: true,
      deviceId,
      device: deviceSnap.val(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[POST /api/parent/edulock] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Terjadi kesalahan server internal." },
      { status: 500 }
    );
  }
}
