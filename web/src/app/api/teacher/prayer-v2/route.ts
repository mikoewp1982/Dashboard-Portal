import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { normalizeClassName as normalizeClassCompact } from "@/lib/guru/normalizeClass";
import { loadHomeroomStudents, asLong } from "@/lib/guru/loadClassRoster";
import {
  createStoredTimestampForSelectedDate,
  parseDateParam,
  toDateKey,
} from "@/lib/guru/presensiRules";
import {
  isMaleStudent,
  isNonMuslim,
  normalizeIdentity,
  preferredStudentIdentity,
  sanitizeRecordId,
  studentIdentityCandidates,
  toPrayerLabel,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

type PrayerType = "DHUHA" | "JUMAT";

type PrayerTypeRule = {
  enabled: boolean;
  requireMuslim: boolean;
  eligibleGender: string;
};

type PrayerSchedule = {
  prayerType: PrayerType;
  classIds: string[];
  dayOfWeek: number;
  active: boolean;
};

type PrayerOverride = {
  date: string;
  prayerType: PrayerType;
  classIds: string[];
  action: "activate" | "deactivate";
};

type PrayerLogV2 = {
  id: string;
  studentId: string;
  nisn: string;
  username: string;
  date: number;
  status: string;
  schoolId: string;
  prayerType: PrayerType | "";
};

type HistoryRow = {
  studentId: string;
  identityKey: string;
  name: string;
  nisn: string;
  status: string;
  submittedAt: number;
};

function prayerIdentityKey(student: GuruStudent): string {
  return preferredStudentIdentity(student);
}

function mappedDayOfWeek(selectedDateMs: number): number {
  const day = new Date(selectedDateMs).getDay();
  switch (day) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    default:
      return 0;
  }
}

async function loadPrayerV2Config(schoolId: string): Promise<{
  types: Record<string, PrayerTypeRule>;
  schedules: PrayerSchedule[];
  overrides: PrayerOverride[];
  classLabelMap: Map<string, string>;
}> {
  const scope = normalizeSchoolId(schoolId);
  const baseRef = adminDb.ref(`school_settings/${scope}/prayer_v2`);
  const [typesSnap, schedulesSnap, overridesSnap, classesSnap] = await Promise.all([
    baseRef.child("types").once("value"),
    baseRef.child("schedules").once("value"),
    baseRef.child("overrides").once("value"),
    adminDb.ref(`gas/schools/${scope}/classes`).once("value"),
  ]);

  const classLabelMap = new Map<string, string>();
  if (classesSnap.exists()) {
    classesSnap.forEach((child) => {
      const key = String(child.key || "").trim();
      if (!key) return;
      const row = (child.val() || {}) as Record<string, unknown>;
      const label = String(row.className || row.name || row.kelas || key).trim() || key;
      classLabelMap.set(key, label);
    });
  }

  const types: Record<string, PrayerTypeRule> = {};
  if (typesSnap.exists()) {
    typesSnap.forEach((child) => {
      const row = (child.val() || {}) as Record<string, unknown>;
      const key = String(child.key || "").trim().toUpperCase();
      if (!key) return;
      types[key] = {
        enabled: row.enabled !== false,
        requireMuslim: row.requireMuslim !== false,
        eligibleGender: String(row.eligibleGender || "all").trim().toLowerCase(),
      };
    });
  }

  const schedules: PrayerSchedule[] = [];
  if (schedulesSnap.exists()) {
    schedulesSnap.forEach((child) => {
      const row = (child.val() || {}) as Record<string, unknown>;
      const prayerType = String(row.prayerType || "").trim().toUpperCase() as PrayerType;
      if (prayerType !== "DHUHA" && prayerType !== "JUMAT") return;
      const classIds = Array.isArray(row.classIds)
        ? row.classIds.map((value) => String(value || "").trim()).filter(Boolean)
        : Object.entries((row.classIds || {}) as Record<string, unknown>)
            .flatMap(([key, value]) => {
              if (value === true) return [String(key || "").trim()];
              return [String(value || "").trim()];
            })
            .filter(Boolean);
      schedules.push({
        prayerType,
        classIds,
        dayOfWeek: Number(row.dayOfWeek ?? 5),
        active: row.active !== false,
      });
    });
  }

  const overrides: PrayerOverride[] = [];
  if (overridesSnap.exists()) {
    overridesSnap.forEach((child) => {
      const row = (child.val() || {}) as Record<string, unknown>;
      const prayerType = String(row.prayerType || "").trim().toUpperCase() as PrayerType;
      if (prayerType !== "DHUHA" && prayerType !== "JUMAT") return;
      const classIds = Array.isArray(row.classIds)
        ? row.classIds.map((value) => String(value || "").trim()).filter(Boolean)
        : Object.entries((row.classIds || {}) as Record<string, unknown>)
            .flatMap(([key, value]) => {
              if (value === true) return [String(key || "").trim()];
              return [String(value || "").trim()];
            })
            .filter(Boolean);
      const action = String(row.action || "").trim().toLowerCase();
      if (action !== "activate" && action !== "deactivate") return;
      overrides.push({
        date: String(row.date || "").trim(),
        prayerType,
        classIds,
        action,
      });
    });
  }

  return { types, schedules, overrides, classLabelMap };
}

async function loadPrayerLogsV2(schoolId: string): Promise<PrayerLogV2[]> {
  const scope = normalizeSchoolId(schoolId);
  const source = await adminDb.ref(`prayer_attendance_v2_by_school/${scope}`).once("value");
  if (!source.exists()) return [];

  const logs: PrayerLogV2[] = [];
  source.forEach((child) => {
    const row = (child.val() || {}) as Record<string, unknown>;
    logs.push({
      id: child.key || "",
      studentId: normalizeIdentity(row.studentId),
      nisn: normalizeIdentity(row.nisn),
      username: normalizeIdentity(row.username),
      date: asLong(row.date) || asLong(row.createdAt),
      status: String(row.status || ""),
      schoolId: normalizeSchoolId(row.schoolId) || scope,
      prayerType: String(row.prayerType || "").trim().toUpperCase() as PrayerType | "",
    });
  });
  return logs;
}

function matchesStudent(log: PrayerLogV2, student: GuruStudent): boolean {
  const logIds = new Set(
    [log.studentId, log.nisn, log.username].map(normalizeIdentity).filter(Boolean)
  );
  if (logIds.size === 0) return false;
  return studentIdentityCandidates(student).some((id) => logIds.has(id));
}

function isScheduledForClass(
  prayerType: PrayerType,
  dateKey: string,
  dayOfWeek: number,
  className: string,
  schedules: PrayerSchedule[],
  overrides: PrayerOverride[],
  classLabelMap: Map<string, string>
): boolean {
  const normalizedClass = normalizeClassCompact(className);
  if (!normalizedClass) return false;

  const isClassMatch = (candidate: string) => {
    const raw = String(candidate || "").trim();
    if (!raw) return false;
    const label = classLabelMap.get(raw) || raw;
    const candidates = [raw, label].map((value) => normalizeClassCompact(value)).filter(Boolean);
    return candidates.some((value) => value === normalizedClass);
  };

  const off = overrides.find(
    (item) =>
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "deactivate" &&
      item.classIds.some(isClassMatch)
  );
  if (off) return false;

  const on = overrides.find(
    (item) =>
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "activate" &&
      item.classIds.some(isClassMatch)
  );
  if (on) return true;

  return schedules.some(
    (item) =>
      item.prayerType === prayerType &&
      item.active &&
      item.dayOfWeek === dayOfWeek &&
      item.classIds.some(isClassMatch)
  );
}

function buildDailyItems(
  students: GuruStudent[],
  logs: PrayerLogV2[],
  selectedDateMs: number,
  prayerType: PrayerType,
  rule: PrayerTypeRule | undefined,
  schedules: PrayerSchedule[],
  overrides: PrayerOverride[],
  classLabelMap: Map<string, string>
) {
  const effectiveRule: PrayerTypeRule = rule ?? {
    enabled: true,
    requireMuslim: true,
    eligibleGender: "all",
  };
  const date = new Date(selectedDateMs);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 86_399_999;
  const dateKey = toDateKey(date);
  const dayOfWeek = mappedDayOfWeek(selectedDateMs);

  return students.map((student) => {
    const nonMuslim = isNonMuslim(student.religion);
    const maleRequired = effectiveRule.eligibleGender === "male";
    const femaleRequired = effectiveRule.eligibleGender === "female";
    const scheduled = isScheduledForClass(
      prayerType,
      dateKey,
      dayOfWeek,
      student.className,
      schedules,
      overrides,
      classLabelMap
    );
    const todayLog = logs
      .filter(
        (log) =>
          log.prayerType === prayerType &&
          matchesStudent(log, student) &&
          log.date >= dayStart &&
          log.date <= dayEnd
      )
      .sort((a, b) => b.date - a.date)[0];

    let status: string;
    let canSelect = false;
    if (!effectiveRule.enabled) {
      status = "Nonaktif";
    } else if (effectiveRule.requireMuslim && nonMuslim) {
      status = "Non-Muslim";
    } else if (maleRequired && !isMaleStudent(student.gender)) {
      status = "Tidak wajib";
    } else if (femaleRequired && isMaleStudent(student.gender)) {
      status = "Tidak wajib";
    } else if (!scheduled) {
      status = "Tidak dijadwalkan";
      canSelect = true;
    } else {
      status = toPrayerLabel(todayLog?.status);
      canSelect = true;
    }

    return {
      studentId: student.id,
      identityKey: prayerIdentityKey(student),
      name: student.name,
      nisn: student.nisn,
      status,
      canSelect,
      submittedAt: todayLog?.date || null,
    };
  });
}

function buildHistory(
  students: GuruStudent[],
  logs: PrayerLogV2[],
  prayerType: PrayerType
): HistoryRow[] {
  return logs
    .filter((log) => log.prayerType === prayerType)
    .map((log) => {
      const student = students.find((item) => matchesStudent(log, item));
      if (!student) return null;
      return {
        studentId: student.id,
        identityKey: prayerIdentityKey(student),
        name: student.name,
        nisn: student.nisn,
        status: toPrayerLabel(log.status),
        submittedAt: log.date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.submittedAt || 0) - (a?.submittedAt || 0))
    .slice(0, 80) as HistoryRow[];
}

export async function GET(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    if (!teacher.className) {
      return NextResponse.json(
        { success: false, message: "Akun guru belum memiliki kelas wali." },
        { status: 400 }
      );
    }

    const params = req.nextUrl.searchParams;
    const mode = (params.get("mode") || "daily").toLowerCase();
    const prayerType = String(params.get("prayerType") || "DHUHA").trim().toUpperCase() as PrayerType;
    if (prayerType !== "DHUHA" && prayerType !== "JUMAT") {
      return NextResponse.json({ success: false, message: "Jenis sholat tidak valid." }, { status: 400 });
    }

    const query = (params.get("q") || "").trim().toLowerCase();
    const studentsAll = await loadHomeroomStudents(teacher.schoolId, teacher.className);
    const students = query
      ? studentsAll.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.nisn.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query)
        )
      : studentsAll;

    const [logs, config] = await Promise.all([
      loadPrayerLogsV2(teacher.schoolId),
      loadPrayerV2Config(teacher.schoolId),
    ]);

    if (mode === "history") {
      return NextResponse.json({
        success: true,
        mode: "history",
        prayerType,
        className: teacher.className,
        rows: buildHistory(students, logs, prayerType),
      });
    }

    const dateMs = parseDateParam(params.get("date"));
    const items = buildDailyItems(
      students,
      logs,
      dateMs,
      prayerType,
      config.types[prayerType],
      config.schedules,
      config.overrides,
      config.classLabelMap
    );

    return NextResponse.json({
      success: true,
      mode: "daily",
      prayerType,
      date: dateMs,
      className: teacher.className,
      items,
      summary: {
        prayCount: items.filter((i) => i.status === "Sudah Presensi").length,
        notYetCount: items.filter((i) => i.status === "Belum Presensi").length,
        notPrayCount: items.filter((i) => i.status === "Tidak Sholat").length,
        permitCount: items.filter((i) => i.status === "Izin").length,
        halanganCount: items.filter((i) => i.status === "Halangan").length,
      },
      jumatScheduled: prayerType !== "JUMAT" ? true : items.some((item) => item.status !== "Tidak dijadwalkan"),
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher prayer-v2 GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memuat presensi Dhuha/Jum'at.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    if (!teacher.className) {
      return NextResponse.json(
        { success: false, message: "Akun guru belum memiliki kelas wali." },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      date?: string | number;
      prayerType?: string;
      selections?: Array<{ studentId: string; identityKey?: string; status: string }>;
    };

    const prayerType = String(body.prayerType || "DHUHA").trim().toUpperCase() as PrayerType;
    if (prayerType !== "DHUHA" && prayerType !== "JUMAT") {
      return NextResponse.json({ success: false, message: "Jenis sholat tidak valid." }, { status: 400 });
    }

    const selections = body.selections || [];
    if (selections.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pilih siswa yang akan dicatat manual." },
        { status: 400 }
      );
    }

    const dateMs = parseDateParam(body.date != null ? String(body.date) : undefined);
    const students = await loadHomeroomStudents(teacher.schoolId, teacher.className);
    const config = await loadPrayerV2Config(teacher.schoolId);
    const byKey = new Map<string, GuruStudent>();
    students.forEach((s) => {
      byKey.set(prayerIdentityKey(s), s);
      byKey.set(s.id, s);
      studentIdentityCandidates(s).forEach((alias) => byKey.set(alias, s));
    });

    const dayKey = toDateKey(new Date(dateMs));
    const dayOfWeek = mappedDayOfWeek(dateMs);
    const now = Date.now();
    const storedDate = createStoredTimestampForSelectedDate(dateMs, now);
    const updates: Record<string, unknown> = {};

    for (const selection of selections) {
      const student = byKey.get(selection.identityKey || "") || byKey.get(selection.studentId);
      if (!student) continue;
      if (config.types[prayerType]?.requireMuslim && isNonMuslim(student.religion)) continue;
      if (config.types[prayerType]?.eligibleGender === "male" && !isMaleStudent(student.gender)) continue;
      if (!isScheduledForClass(prayerType, dayKey, dayOfWeek, student.className, config.schedules, config.overrides, config.classLabelMap)) continue;

      const statusMap: Record<string, string> = {
        PRAY: "PRAY",
        "SUDAH PRESENSI": "PRAY",
        NOT_PRAY: "NOT_PRAY",
        "TIDAK SHOLAT": "NOT_PRAY",
        PERMIT: "PERMIT",
        IZIN: "PERMIT",
        HALANGAN: "HALANGAN",
      };
      const status = statusMap[String(selection.status || "").trim().toUpperCase()];
      if (!status) continue;

      const resolvedStudentId = preferredStudentIdentity(student);
      const recordId = sanitizeRecordId(`${teacher.schoolId}_${resolvedStudentId}_${dayKey}_${prayerType}`);
      const payload = {
        schoolId: teacher.schoolId,
        studentId: resolvedStudentId,
        nisn: student.nisn,
        username: student.username,
        studentName: student.name,
        classNameSnapshot: student.className,
        prayerType,
        dateKey: dayKey,
        date: storedDate,
        status,
        recordedBy: "TEACHER_MANUAL",
        createdAt: now,
        updatedAt: now,
      };

      for (const [field, value] of Object.entries(payload)) {
        updates[`prayer_attendance_v2/${recordId}/${field}`] = value;
        updates[`prayer_attendance_v2_by_school/${teacher.schoolId}/${recordId}/${field}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang bisa disimpan." },
        { status: 400 }
      );
    }

    await adminDb.ref().update(updates);

    return NextResponse.json({
      success: true,
      message: "Presensi Dhuha/Jum'at manual berhasil disimpan.",
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher prayer-v2 POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan presensi Dhuha/Jum'at.",
      },
      { status: 500 }
    );
  }
}
