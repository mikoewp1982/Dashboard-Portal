import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import {
  asLong,
  isEffectivePrayerDay,
  loadAttendanceRules,
  loadHomeroomStudents,
  loadPrayerRules,
} from "@/lib/guru/loadClassRoster";
import {
  createStoredTimestampForSelectedDate,
  endOfDay,
  isValidPrayerDay,
  jakartaCivilDateMs,
  lastCountableDay,
  parseDateParam,
  startOfDay,
  toDateKey,
} from "@/lib/guru/presensiRules";
import {
  isNonMuslim,
  normalizeIdentity,
  preferredStudentIdentity,
  sanitizeRecordId,
  studentIdentityCandidates,
  toPrayerLabel,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

type PrayerLog = {
  id: string;
  studentId: string;
  nisn: string;
  username: string;
  date: number;
  status: string;
  schoolId: string;
};

type MonthlyStats = {
  prayCount: number;
  notPrayCount: number;
  permitCount: number;
  halanganCount: number;
};

async function loadPrayerLogs(schoolId: string): Promise<PrayerLog[]> {
  const scope = normalizeSchoolId(schoolId);
  const logs: PrayerLog[] = [];

  const scoped = await adminDb
    .ref("prayer_attendance")
    .orderByChild("schoolId")
    .equalTo(scope)
    .once("value");

  const source = scoped.exists()
    ? scoped
    : await adminDb.ref(`prayer_attendance_by_school/${scope}`).once("value");

  if (!source.exists()) return logs;

  source.forEach((child) => {
    const row = (child.val() || {}) as Record<string, unknown>;
    const rowSchool = normalizeSchoolId(row.schoolId);
    if (scope && rowSchool && rowSchool !== scope) return;
    logs.push({
      id: child.key || "",
      studentId: normalizeIdentity(row.studentId),
      nisn: normalizeIdentity(row.nisn),
      username: normalizeIdentity(row.username),
      date: asLong(row.date) || asLong(row.createdAt),
      status: String(row.status || ""),
      schoolId: rowSchool || scope,
    });
  });

  return logs;
}

function matchesStudent(log: PrayerLog, student: GuruStudent): boolean {
  const logIds = new Set(
    [log.studentId, log.nisn, log.username].map(normalizeIdentity).filter(Boolean)
  );
  if (logIds.size === 0) return false;
  return studentIdentityCandidates(student).some((id) => logIds.has(id));
}

function prayerIdentityKey(student: GuruStudent): string {
  return preferredStudentIdentity(student);
}

function buildDailyItems(
  students: GuruStudent[],
  logs: PrayerLog[],
  selectedDateMs: number,
  schedules: Awaited<ReturnType<typeof loadAttendanceRules>>["schedules"],
  holidays: Awaited<ReturnType<typeof loadAttendanceRules>>["holidays"],
  prayerRules: Awaited<ReturnType<typeof loadPrayerRules>>
) {
  const dayStart = startOfDay(selectedDateMs);
  const dayEnd = endOfDay(selectedDateMs);
  const targetDay = new Date(selectedDateMs);

  return students.map((student) => {
    const nonMuslim = isNonMuslim(student.religion);
    const baseValid = isValidPrayerDay(targetDay, schedules, holidays);
    const validDay = isEffectivePrayerDay(
      {
        date: targetDay,
        className: student.classId || student.class || student.className,
        prayerType: "DZUHUR",
      },
      prayerRules,
      { schedules, holidays },
      () => baseValid,
      toDateKey
    );
    const todayLog = logs
      .filter((log) => matchesStudent(log, student) && log.date >= dayStart && log.date <= dayEnd)
      .sort((a, b) => b.date - a.date)[0];

    let status: string;
    let canSelect = false;
    if (!validDay) {
      status = "Hari Nonaktif";
      canSelect = true;
    } else if (nonMuslim) {
      status = "Non-Muslim";
      canSelect = false;
    } else {
      status = toPrayerLabel(todayLog?.status);
      canSelect = true;
    }

    return {
      studentId: student.id,
      identityKey: prayerIdentityKey(student),
      name: student.name,
      nisn: student.nisn,
      username: student.username,
      className: student.className,
      schoolId: student.schoolId,
      religion: student.religion,
      status,
      submittedAt: todayLog?.date || null,
      canSelect,
    };
  });
}

function buildMonthlyRecap(
  students: GuruStudent[],
  logs: PrayerLog[],
  month: number,
  year: number,
  schedules: Awaited<ReturnType<typeof loadAttendanceRules>>["schedules"],
  holidays: Awaited<ReturnType<typeof loadAttendanceRules>>["holidays"],
  prayerRules: Awaited<ReturnType<typeof loadPrayerRules>>
): Record<string, MonthlyStats> {
  const result: Record<string, MonthlyStats> = {};
  const lastDay = lastCountableDay(year, month);

  students.forEach((student) => {
    const key = prayerIdentityKey(student);
    if (isNonMuslim(student.religion)) {
      result[key] = { prayCount: 0, notPrayCount: 0, permitCount: 0, halanganCount: 0 };
      return;
    }

    let prayCount = 0;
    let notPrayCount = 0;
    let permitCount = 0;
    let halanganCount = 0;

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(jakartaCivilDateMs(year, month, day));
      const baseValid = isValidPrayerDay(date, schedules, holidays);
      const effective = isEffectivePrayerDay(
        {
          date,
          className: student.classId || student.class || student.className,
          prayerType: "DZUHUR",
        },
        prayerRules,
        { schedules, holidays },
        () => baseValid,
        toDateKey
      );
      if (!effective) continue;
      const dayStart = startOfDay(date.getTime());
      const dayEnd = endOfDay(date.getTime());
      const dayLog = logs
        .filter((log) => matchesStudent(log, student) && log.date >= dayStart && log.date <= dayEnd)
        .sort((a, b) => b.date - a.date)[0];

      switch (String(dayLog?.status || "").toUpperCase()) {
        case "PRAY":
          prayCount += 1;
          break;
        case "PERMIT":
          permitCount += 1;
          break;
        case "HALANGAN":
          halanganCount += 1;
          break;
        default:
          notPrayCount += 1;
      }
    }

    result[key] = { prayCount, notPrayCount, permitCount, halanganCount };
  });

  return result;
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

    const [logs, rules, prayerRules] = await Promise.all([
      loadPrayerLogs(teacher.schoolId),
      loadAttendanceRules(teacher.schoolId),
      loadPrayerRules(teacher.schoolId),
    ]);

    if (mode === "monthly") {
      const now = new Date();
      const month = Number(params.get("month") ?? now.getMonth());
      const year = Number(params.get("year") ?? now.getFullYear());
      const recap = buildMonthlyRecap(
        students,
        logs,
        month,
        year,
        rules.schedules,
        rules.holidays,
        prayerRules
      );

      return NextResponse.json({
        success: true,
        mode: "monthly",
        month,
        year,
        className: teacher.className,
        students: students.map((s) => ({
          studentId: s.id,
          identityKey: prayerIdentityKey(s),
          name: s.name,
          nisn: s.nisn,
          status: isNonMuslim(s.religion) ? "Non-Muslim" : "Belum Presensi",
        })),
        recap,
      });
    }

    const dateMs = parseDateParam(params.get("date"));
    const items = buildDailyItems(
      students,
      logs,
      dateMs,
      rules.schedules,
      rules.holidays,
      prayerRules
    );

    return NextResponse.json({
      success: true,
      mode: "daily",
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
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher prayer GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memuat presensi sholat.",
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
      selections?: Array<{ studentId: string; identityKey?: string; status: string }>;
    };

    const selections = body.selections || [];
    if (selections.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pilih siswa yang akan dicatat manual." },
        { status: 400 }
      );
    }

    const dateMs = parseDateParam(body.date != null ? String(body.date) : undefined);
    const students = await loadHomeroomStudents(teacher.schoolId, teacher.className);
    const byKey = new Map<string, GuruStudent>();
    students.forEach((s) => {
      byKey.set(prayerIdentityKey(s), s);
      byKey.set(s.id, s);
      studentIdentityCandidates(s).forEach((alias) => byKey.set(alias, s));
    });

    const now = Date.now();
    const storedDate = createStoredTimestampForSelectedDate(dateMs, now);
    const dayKey = toDateKey(new Date(dateMs));
    const updates: Record<string, unknown> = {};

    for (const selection of selections) {
      const student =
        byKey.get(selection.identityKey || "") || byKey.get(selection.studentId);
      if (!student) continue;
      if (isNonMuslim(student.religion)) continue;

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
      const recordId = sanitizeRecordId(
        `${teacher.schoolId}_${resolvedStudentId}_${dayKey}_PRAY`
      );
      const payload = {
        schoolId: teacher.schoolId,
        studentId: resolvedStudentId,
        nisn: student.nisn,
        username: student.username,
        studentName: student.name,
        date: storedDate,
        status,
        recordedBy: "TEACHER_MANUAL",
        createdAt: now,
        updatedAt: now,
      };

      for (const [field, value] of Object.entries(payload)) {
        updates[`prayer_attendance/${recordId}/${field}`] = value;
        updates[`prayer_attendance_by_school/${teacher.schoolId}/${recordId}/${field}`] = value;
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
      message: "Presensi sholat manual berhasil disimpan.",
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher prayer POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan presensi sholat.",
      },
      { status: 500 }
    );
  }
}
