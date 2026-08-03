import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { asLong, loadAttendanceRules, loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import {
  createStoredTimestampForSelectedDate,
  daysInMonth,
  endOfDay,
  isValidSchoolDay,
  jakartaCivilDateMs,
  lastCountableDay,
  parseDateParam,
  startOfDay,
  toDateKey,
} from "@/lib/guru/presensiRules";
import {
  attendanceIdentityKey,
  buildIdentityMap,
  matchStudentByRow,
  monthlyCanonicalStudentId,
  normalizeAttendanceMonthStatus,
  normalizeAttendanceStatus,
  normalizeIdentity,
  preferredStudentIdentity,
  studentIdentityCandidates,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

type AttendanceRecord = {
  id: string;
  studentId: string;
  schoolId: string;
  date: number;
  status: string;
  notes?: string;
  nisn?: string;
  username?: string;
  studentName?: string;
  className?: string;
};

type MonthlyStats = {
  presentCount: number;
  sickCount: number;
  permitCount: number;
  absentCount: number;
};

async function loadAttendanceRange(
  schoolId: string,
  startMs: number,
  endMs: number
): Promise<AttendanceRecord[]> {
  const scope = normalizeSchoolId(schoolId);
  const records: AttendanceRecord[] = [];

  const scoped = await adminDb
    .ref(`attendance_by_school/${scope}`)
    .orderByChild("date")
    .startAt(startMs)
    .endAt(endMs)
    .once("value");

  const source = scoped.exists()
    ? scoped
    : await adminDb
        .ref("attendance")
        .orderByChild("date")
        .startAt(startMs)
        .endAt(endMs)
        .once("value");

  if (!source.exists()) return records;

  source.forEach((child) => {
    const row = (child.val() || {}) as Record<string, unknown>;
    const rowSchool = normalizeSchoolId(row.schoolId);
    if (scope && rowSchool && rowSchool !== scope) return;
    records.push({
      id: child.key || "",
      studentId: normalizeIdentity(row.studentId),
      schoolId: rowSchool || scope,
      date: asLong(row.date),
      status: String(row.status || "ABSENT"),
      notes: row.notes != null ? String(row.notes) : undefined,
      nisn: normalizeIdentity(row.nisn),
      username: normalizeIdentity(row.username),
      studentName: String(row.studentName || ""),
      className: String(row.className || ""),
    });
  });

  return records;
}

function buildDailyItems(students: GuruStudent[], records: AttendanceRecord[]) {
  const byIdentity = new Map<string, AttendanceRecord>();
  records.forEach((rec) => {
    const aliases = [rec.studentId, rec.nisn, rec.username]
      .map((v) => normalizeIdentity(v))
      .filter(Boolean);
    aliases.forEach((alias) => {
      const current = byIdentity.get(alias);
      if (!current || rec.date > current.date) {
        byIdentity.set(alias, rec);
      }
    });
  });

  return students.map((student) => {
    const record = studentIdentityCandidates(student)
      .map((id) => byIdentity.get(id))
      .filter((r): r is AttendanceRecord => Boolean(r))
      .sort((a, b) => b.date - a.date)[0];

    let resolvedStatus = "UNMARKED";
    if (record) {
      const upper = String(record.status || "").trim().toUpperCase();
      if (["PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME", "LATE", "TERLAMBAT"].includes(upper)) {
        resolvedStatus = "PRESENT";
      } else if (["SICK", "SAKIT"].includes(upper)) {
        resolvedStatus = "SICK";
      } else if (["PERMIT", "IZIN", "LEAVE"].includes(upper)) {
        resolvedStatus = "PERMIT";
      } else if (["ABSENT", "ALPA", "ALPHA"].includes(upper)) {
        resolvedStatus = "ABSENT";
      }
    }

    return {
      studentId: student.id,
      identityKey: attendanceIdentityKey(student.id, student.nisn),
      preferredId: preferredStudentIdentity(student),
      monthlyKey: monthlyCanonicalStudentId(student),
      name: student.name,
      nisn: student.nisn,
      username: student.username,
      className: student.className,
      schoolId: student.schoolId,
      status: resolvedStatus,
      notes: record?.notes || "",
      attendanceId: record?.id || null,
    };
  });
}

function buildMonthlyRecap(
  students: GuruStudent[],
  records: AttendanceRecord[],
  month: number,
  year: number,
  schedules: Awaited<ReturnType<typeof loadAttendanceRules>>["schedules"],
  holidays: Awaited<ReturnType<typeof loadAttendanceRules>>["holidays"]
): Record<string, MonthlyStats> {
  const result: Record<string, MonthlyStats> = {};
  const aliasMap = new Map<string, string>();
  const byStudentDay = new Map<string, Map<number, AttendanceRecord>>();
  const lastDay = lastCountableDay(year, month);

  students.forEach((student) => {
    const canonical = monthlyCanonicalStudentId(student);
    if (!canonical) return;
    studentIdentityCandidates(student).forEach((alias) => {
      if (alias && !aliasMap.has(alias)) aliasMap.set(alias, canonical);
    });
  });

  records.forEach((rec) => {
    const aliases = [rec.studentId, rec.nisn, rec.username]
      .map((v) => normalizeIdentity(v))
      .filter(Boolean);
    const canonical = aliases.map((a) => aliasMap.get(a)).find(Boolean);
    if (!canonical) return;
    const day = Number(toDateKey(rec.date).slice(-2));
    const dayMap = byStudentDay.get(canonical) || new Map<number, AttendanceRecord>();
    const current = dayMap.get(day);
    if (!current || rec.date > current.date) {
      dayMap.set(day, rec);
    }
    byStudentDay.set(canonical, dayMap);
  });

  students.forEach((student) => {
    const canonical = monthlyCanonicalStudentId(student);
    if (!canonical) return;
    let presentCount = 0;
    let sickCount = 0;
    let permitCount = 0;
    let absentCount = 0;
    const dayMap = byStudentDay.get(canonical) || new Map();

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(jakartaCivilDateMs(year, month, day));
      if (!isValidSchoolDay(date, schedules, holidays)) continue;
      const dayLog = dayMap.get(day);
      const status = normalizeAttendanceMonthStatus(dayLog?.status);
      if (status === "PRESENT" || status === "LATE") presentCount += 1;
      else if (status === "SICK") sickCount += 1;
      else if (status === "PERMIT") permitCount += 1;
      else absentCount += 1;
    }

    result[canonical] = { presentCount, sickCount, permitCount, absentCount };
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
    const students = await loadHomeroomStudents(teacher.schoolId, teacher.className);

    if (mode === "monthly") {
      const now = new Date();
      const month = Number(params.get("month") ?? now.getMonth());
      const year = Number(params.get("year") ?? now.getFullYear());
      const start = startOfDay(jakartaCivilDateMs(year, month, 1));
      const end = endOfDay(jakartaCivilDateMs(year, month, daysInMonth(year, month)));
      const [records, rules] = await Promise.all([
        loadAttendanceRange(teacher.schoolId, start, end),
        loadAttendanceRules(teacher.schoolId),
      ]);
      const recap = buildMonthlyRecap(
        students,
        records,
        month,
        year,
        rules.schedules,
        rules.holidays
      );

      return NextResponse.json({
        success: true,
        mode: "monthly",
        month,
        year,
        className: teacher.className,
        students: students.map((s) => ({
          studentId: s.id,
          identityKey: attendanceIdentityKey(s.id, s.nisn),
          monthlyKey: monthlyCanonicalStudentId(s),
          name: s.name,
          nisn: s.nisn,
        })),
        recap,
      });
    }

    const dateMs = parseDateParam(params.get("date"));
    const records = await loadAttendanceRange(
      teacher.schoolId,
      startOfDay(dateMs),
      endOfDay(dateMs)
    );
    const items = buildDailyItems(students, records);
    const summary = {
      PRESENT: items.filter((i) => i.status === "PRESENT").length,
      SICK: items.filter((i) => i.status === "SICK").length,
      PERMIT: items.filter((i) => i.status === "PERMIT").length,
      ABSENT: items.filter((i) => i.status === "ABSENT").length,
      TOTAL: items.length,
    };

    return NextResponse.json({
      success: true,
      mode: "daily",
      date: dateMs,
      className: teacher.className,
      items,
      summary,
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher attendance GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memuat presensi.",
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
      selections?: Record<string, string>;
    };

    const dateMs = parseDateParam(
      body.date != null ? String(body.date) : null
    );
    const selections = body.selections || {};
    const entries = Object.entries(selections);
    if (entries.length === 0) {
      return NextResponse.json({ success: true, message: "Tidak ada perubahan." });
    }

    const students = await loadHomeroomStudents(teacher.schoolId, teacher.className);
    const byKey = new Map<string, GuruStudent>();
    students.forEach((s) => {
      byKey.set(attendanceIdentityKey(s.id, s.nisn), s);
      byKey.set(s.id, s);
      studentIdentityCandidates(s).forEach((alias) => byKey.set(alias, s));
    });

    const existing = await loadAttendanceRange(
      teacher.schoolId,
      startOfDay(dateMs),
      endOfDay(dateMs)
    );
    const identityMap = buildIdentityMap(students);
    const existingByStudent = new Map<string, AttendanceRecord>();
    existing.forEach((rec) => {
      const student = matchStudentByRow(
        {
          studentId: rec.studentId,
          nisn: rec.nisn,
          username: rec.username,
        },
        identityMap
      );
      if (!student) return;
      const key = preferredStudentIdentity(student);
      const current = existingByStudent.get(key);
      if (!current || rec.date > current.date) {
        existingByStudent.set(key, rec);
      }
    });

    const now = Date.now();
    const storedDate = createStoredTimestampForSelectedDate(dateMs, now);
    const updates: Record<string, unknown> = {};
    let saved = 0;
    let deleted = 0;

    for (const [rawKey, rawStatus] of entries) {
      const student = byKey.get(rawKey);
      if (!student) continue;
      const preferredId = preferredStudentIdentity(student);
      const existingRec = existingByStudent.get(preferredId);
      const statusUpper = String(rawStatus || "").trim().toUpperCase();

      if (statusUpper === "UNMARKED") {
        if (existingRec?.id) {
          updates[`attendance/${existingRec.id}`] = null;
          updates[`attendance_by_school/${teacher.schoolId}/${existingRec.id}`] = null;
          deleted += 1;
        }
        continue;
      }

      const status = normalizeAttendanceStatus(statusUpper);
      if (!["PRESENT", "SICK", "PERMIT", "ABSENT"].includes(status)) continue;

      const attendanceId = existingRec?.id || adminDb.ref("attendance").push().key;
      if (!attendanceId) continue;

      const payload = {
        id: attendanceId,
        studentId: preferredId,
        schoolId: teacher.schoolId,
        date: storedDate,
        status,
        checkInTime: String(now),
        checkInMethod: "MANUAL",
        notes: existingRec?.notes || "",
        recordedBy: "TEACHER_MANUAL",
        nisn: student.nisn,
        username: student.username,
        studentName: student.name,
        className: student.className,
      };

      updates[`attendance/${attendanceId}`] = payload;
      updates[`attendance_by_school/${teacher.schoolId}/${attendanceId}`] = payload;
      saved += 1;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        message: "Tidak ada data valid untuk disimpan.",
      }, { status: 400 });
    }

    await adminDb.ref().update(updates);

    return NextResponse.json({
      success: true,
      message: "Presensi manual berhasil disimpan.",
      saved,
      deleted,
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Teacher attendance POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan presensi.",
      },
      { status: 500 }
    );
  }
}
