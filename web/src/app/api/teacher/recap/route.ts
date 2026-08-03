import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import {
  asLong,
  loadAttendanceRules,
  loadHomeroomStudents,
} from "@/lib/guru/loadClassRoster";
import { normalizeClassName } from "@/lib/guru/normalizeClass";
import {
  endOfDay,
  isValidPrayerDay,
  isValidSchoolDay,
  startOfDay,
  toDateKey,
} from "@/lib/guru/presensiRules";
import {
  isNonMuslim,
  normalizeIdentity,
  preferredStudentIdentity,
  studentIdentityCandidates,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Column headers ÔÇö parity with APK `TeacherRecapViewModel.buildSpreadsheetXml`. */
const RECAP_HEADERS = [
  "No",
  "NISN",
  "Nama Siswa",
  "Kelas",
  "Hadir (H)",
  "Izin (I)",
  "Sakit (S)",
  "Alpa (A)",
  "Sholat (S)",
  "Tidak Sholat (TS)",
  "Izin Sholat (I)",
  "Halangan (H)",
  "Literasi (Total Buku)",
  "Literasi (Total Menit)",
  "Poin Pelanggaran",
] as const;

type StudentRecapRow = {
  index: number;
  nisn: string;
  name: string;
  className: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  sholatSudah: number;
  sholatTidak: number;
  sholatIzin: number;
  sholatHalangan: number;
  totalBuku: number;
  totalMenitBaca: number;
  poinPelanggaran: number;
};

type DayStatus = { status: string; dateMs: number };

function parseDateBound(value: string, endOfDayFlag: boolean): number {
  const trimmed = (value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return endOfDayFlag ? endOfDay(Date.now()) : startOfDay(Date.now());
  }
  const ms = Date.parse(
    `${trimmed}${endOfDayFlag ? "T23:59:59.999+07:00" : "T00:00:00.000+07:00"}`
  );
  return Number.isFinite(ms)
    ? ms
    : endOfDayFlag
      ? endOfDay(Date.now())
      : startOfDay(Date.now());
}

function periodLabelFromDates(startDate: string, endDate: string): string {
  const start = (startDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const [y, m] = start.split("-").map(Number);
    const monthName = MONTH_NAMES[(m || 1) - 1] || "Bulan";
    return `${monthName} ${y}`;
  }
  if (start && endDate) return `${start} s.d. ${endDate}`;
  return "Periode";
}

function normalizePrayerStatus(raw: unknown): string {
  const status = String(raw || "")
    .trim()
    .toUpperCase();
  if (["PRAY", "SHOLAT", "SUDAH", "HADIR", "PRESENT", "PRAYED"].includes(status)) {
    return "PRAY";
  }
  if (["PERMIT", "IZIN"].includes(status)) return "PERMIT";
  if (["HALANGAN", "HAID", "MENS", "MSTR"].includes(status)) return "HALANGAN";
  if (
    ["NOT_PRAY", "TIDAK", "TIDAK_SHOLAT", "TIDAK SHOLAT", "BELUM", ""].includes(status)
  ) {
    return "NOT_PRAY";
  }
  return "NOT_PRAY";
}

function extractRecordDateMs(row: Record<string, unknown>, key?: string | null): number {
  const candidates = [
    row.date,
    row.createdAt,
    row.timestamp,
    row.submittedAt,
    row.recordedAt,
  ];
  for (const c of candidates) {
    const ms = asLong(c);
    if (ms > 0) return ms;
  }
  const match = String(key || "").match(/20\d{2}-\d{2}-\d{2}/);
  if (match) {
    const ms = asLong(match[0]);
    if (ms > 0) return ms;
  }
  return 0;
}

async function loadScopedChildren(
  primaryPath: string,
  fallbackPath: string
): Promise<Array<{ key: string; row: Record<string, unknown> }>> {
  // APK merges both trees and dedupes by record key.
  const [primary, fallback] = await Promise.all([
    adminDb.ref(primaryPath).once("value"),
    adminDb.ref(fallbackPath).once("value"),
  ]);
  const out: Array<{ key: string; row: Record<string, unknown> }> = [];
  const seen = new Set<string>();
  for (const source of [primary, fallback]) {
    if (!source.exists()) continue;
    source.forEach((child) => {
      const key = child.key || "";
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({ key, row: (child.val() || {}) as Record<string, unknown> });
    });
  }
  return out;
}

function eachDayMs(startMs: number, endMs: number): number[] {
  const days: number[] = [];
  let cursor = startOfDay(startMs);
  const end = endOfDay(endMs);
  while (cursor <= end) {
    days.push(cursor);
    cursor += 24 * 60 * 60 * 1000;
  }
  return days;
}

/** Real OOXML (.xlsx) ÔÇö APK parity sheet/columns/styling via ExcelJS. */
async function buildRecapXlsxBuffer(
  className: string,
  periodText: string,
  rows: StudentRecapRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rangkuman Kelas");

  sheet.columns = [
    { width: 5 },
    { width: 14 },
    { width: 28 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
  ];

  const titleRow = sheet.getRow(1);
  titleRow.height = 24;
  sheet.mergeCells(1, 1, 1, RECAP_HEADERS.length);
  const titleCell = titleRow.getCell(1);
  titleCell.value = `REKAPITULASI KELAS ${className.toUpperCase()}`;
  titleCell.font = {
    name: "Arial",
    size: 14,
    bold: true,
    color: { argb: "FF0F2A43" },
  };
  titleCell.alignment = { vertical: "middle" };

  const subRow = sheet.getRow(2);
  subRow.height = 20;
  sheet.mergeCells(2, 1, 2, RECAP_HEADERS.length);
  const subCell = subRow.getCell(1);
  subCell.value = `Periode ${periodText}`;
  subCell.font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: "FF0F7BFF" },
  };
  subCell.alignment = { vertical: "middle" };

  const headerRow = sheet.getRow(4);
  headerRow.height = 28;
  RECAP_HEADERS.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F7BFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });

  rows.forEach((r, rowIdx) => {
    const dataRow = sheet.getRow(5 + rowIdx);
    dataRow.height = 20;
    const values: Array<string | number> = [
      r.index,
      r.nisn || "-",
      r.name || "-",
      r.className || "-",
      r.hadir,
      r.izin,
      r.sakit,
      r.alpa,
      r.sholatSudah,
      r.sholatTidak,
      r.sholatIzin,
      r.sholatHalangan,
      r.totalBuku,
      r.totalMenitBaca,
      r.poinPelanggaran,
    ];
    values.forEach((value, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = value;
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = { vertical: "middle" };
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function rowsToJsonSummary(rows: StudentRecapRow[]) {
  return rows.map((r) => ({
    No: r.index,
    NISN: r.nisn || "-",
    "Nama Siswa": r.name || "-",
    Kelas: r.className || "-",
    "Hadir (H)": r.hadir,
    "Izin (I)": r.izin,
    "Sakit (S)": r.sakit,
    "Alpa (A)": r.alpa,
    "Sholat (S)": r.sholatSudah,
    "Tidak Sholat (TS)": r.sholatTidak,
    "Izin Sholat (I)": r.sholatIzin,
    "Halangan (H)": r.sholatHalangan,
    "Literasi (Total Buku)": r.totalBuku,
    "Literasi (Total Menit)": r.totalMenitBaca,
    "Poin Pelanggaran": r.poinPelanggaran,
  }));
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

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const format = (searchParams.get("format") || "excel").toLowerCase();

    const querySchoolId = normalizeSchoolId(searchParams.get("schoolId") || "");
    const schoolId = teacher.schoolId;
    if (querySchoolId && querySchoolId !== schoolId) {
      return NextResponse.json(
        { success: false, message: "schoolId tidak sesuai sesi guru." },
        { status: 403 }
      );
    }

    const queryClass = String(searchParams.get("className") || "").trim();
    if (
      queryClass &&
      normalizeClassName(queryClass) !== normalizeClassName(teacher.className)
    ) {
      return NextResponse.json(
        { success: false, message: "className tidak sesuai kelas wali guru." },
        { status: 403 }
      );
    }

    const className = teacher.className;
    const students = await loadHomeroomStudents(schoolId, className);
    students.sort((a, b) => (a.name || "").localeCompare(b.name || "", "id"));

    const startMs = parseDateBound(startDate, false);
    const endMs = parseDateBound(endDate, true);
    const periodText = periodLabelFromDates(startDate, endDate);
    const scope = normalizeSchoolId(schoolId);

    const aliasToStudent = new Map<string, GuruStudent>();
    students.forEach((student) => {
      studentIdentityCandidates(student).forEach((alias) => {
        const key = alias.toLowerCase();
        if (key && !aliasToStudent.has(key)) aliasToStudent.set(key, student);
      });
    });

    function resolveStudent(row: Record<string, unknown>): GuruStudent | undefined {
      const candidates = [
        row.studentId,
        row.nisn,
        row.studentNisn,
        row.username,
      ]
        .map((v) => normalizeIdentity(v).toLowerCase())
        .filter(Boolean);
      for (const c of candidates) {
        const hit = aliasToStudent.get(c);
        if (hit) return hit;
      }
      return undefined;
    }

    const studentRows = new Map<string, StudentRecapRow>();
    const studentsByKey = new Map<string, GuruStudent>();
    students.forEach((student, idx) => {
      const rowKey = preferredStudentIdentity(student) || `row_${idx}`;
      studentRows.set(rowKey, {
        index: idx + 1,
        nisn: student.nisn || student.id || "-",
        name: student.name || "-",
        className: student.className || className || "-",
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
        sholatSudah: 0,
        sholatTidak: 0,
        sholatIzin: 0,
        sholatHalangan: 0,
        totalBuku: 0,
        totalMenitBaca: 0,
        poinPelanggaran: 0,
      });
      studentsByKey.set(rowKey, student);
    });

    function rowKeyFor(student: GuruStudent): string {
      return preferredStudentIdentity(student);
    }

    const rules = await loadAttendanceRules(schoolId);
    const days = eachDayMs(startMs, endMs);

    // Attendance: latest status per student per day; missing effective day = Alpa
    const attendanceByStudentDay = new Map<string, Map<string, DayStatus>>();
    const attRecords = await loadScopedChildren(
      `attendance_by_school/${scope}`,
      "attendance"
    );
    const attSeen = new Set<string>();
    for (const { key, row } of attRecords) {
      if (!key || attSeen.has(key)) continue;
      attSeen.add(key);
      const recSchool = normalizeSchoolId(row.schoolId);
      if (scope && recSchool && recSchool !== scope) continue;
      const dateMs = extractRecordDateMs(row, key);
      if (dateMs <= 0 || dateMs < startMs || dateMs > endMs) continue;
      const student = resolveStudent(row);
      if (!student) continue;
      const status = String(row.status || "")
        .trim()
        .toUpperCase();
      if (!status) continue;
      const rk = rowKeyFor(student);
      const dayKey = toDateKey(dateMs);
      const byDay = attendanceByStudentDay.get(rk) || new Map<string, DayStatus>();
      const current = byDay.get(dayKey);
      if (!current || dateMs >= current.dateMs) {
        byDay.set(dayKey, { status, dateMs });
      }
      attendanceByStudentDay.set(rk, byDay);
    }

    for (const [rk] of studentsByKey) {
      const row = studentRows.get(rk);
      if (!row) continue;
      const byDay = attendanceByStudentDay.get(rk) || new Map();
      for (const dayMs of days) {
        const date = new Date(dayMs);
        if (!isValidSchoolDay(date, rules.schedules, rules.holidays)) continue;
        const dayKey = toDateKey(dayMs);
        const raw = byDay.get(dayKey)?.status;
        if (!raw) {
          row.alpa += 1;
          continue;
        }
        // Match APK TeacherRecapViewModel: LATE/TERLAMBAT count as Hadir; unknown ignored.
        const upper = raw.trim().toUpperCase();
        if (
          ["PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME", "LATE", "TERLAMBAT"].includes(
            upper
          )
        ) {
          row.hadir += 1;
        } else if (["SICK", "SAKIT"].includes(upper)) {
          row.sakit += 1;
        } else if (["PERMIT", "IZIN", "LEAVE"].includes(upper)) {
          row.izin += 1;
        } else if (["ABSENT", "ALPA", "ALPHA"].includes(upper)) {
          row.alpa += 1;
        }
      }
    }

    // Prayer: latest status per student per prayer day; missing = Tidak Sholat
    const prayerByStudentDay = new Map<string, Map<string, DayStatus>>();
    const prayerRecords = await loadScopedChildren(
      `prayer_attendance_by_school/${scope}`,
      "prayer_attendance"
    );
    const prayerSeen = new Set<string>();
    for (const { key, row } of prayerRecords) {
      if (!key || prayerSeen.has(key)) continue;
      prayerSeen.add(key);
      const recSchool = normalizeSchoolId(row.schoolId);
      if (scope && recSchool && recSchool !== scope) continue;
      const dateMs = extractRecordDateMs(row, key);
      if (dateMs <= 0 || dateMs < startMs || dateMs > endMs) continue;
      const student = resolveStudent(row);
      if (!student) continue;
      const status = String(row.status || "")
        .trim()
        .toUpperCase();
      if (!status) continue;
      const rk = rowKeyFor(student);
      const dayKey = toDateKey(dateMs);
      const byDay = prayerByStudentDay.get(rk) || new Map<string, DayStatus>();
      const current = byDay.get(dayKey);
      if (!current || dateMs >= current.dateMs) {
        byDay.set(dayKey, { status, dateMs });
      }
      prayerByStudentDay.set(rk, byDay);
    }

    for (const [rk, student] of studentsByKey) {
      const row = studentRows.get(rk);
      if (!row) continue;
      if (isNonMuslim(student.religion)) continue;
      const byDay = prayerByStudentDay.get(rk) || new Map();
      for (const dayMs of days) {
        const date = new Date(dayMs);
        if (!isValidPrayerDay(date, rules.schedules, rules.holidays)) continue;
        const dayKey = toDateKey(dayMs);
        const bucket = normalizePrayerStatus(byDay.get(dayKey)?.status);
        if (bucket === "PRAY") row.sholatSudah += 1;
        else if (bucket === "PERMIT") row.sholatIzin += 1;
        else if (bucket === "HALANGAN") row.sholatHalangan += 1;
        else row.sholatTidak += 1;
      }
    }

    // Literacy
    const litRecords = await loadScopedChildren(
      `literacy_logs_by_school/${scope}`,
      "literacy_logs"
    );
    const litSeen = new Set<string>();
    for (const { key, row } of litRecords) {
      if (!key || litSeen.has(key)) continue;
      litSeen.add(key);
      const recSchool = normalizeSchoolId(row.schoolId);
      if (scope && recSchool && recSchool !== scope) continue;
      const dateMs = extractRecordDateMs(row, key);
      if (dateMs > 0 && (dateMs < startMs || dateMs > endMs)) continue;
      const student = resolveStudent(row);
      if (!student) continue;
      const recap = studentRows.get(rowKeyFor(student));
      if (!recap) continue;
      recap.totalBuku += 1;
      const dur = asLong(row.durationMinutes ?? row.duration);
      recap.totalMenitBaca += dur > 0 ? dur : 15;
    }

    // Discipline ÔÇö Poin Pelanggaran only (APK parity)
    const rulesSnap = await adminDb
      .ref(`discipline_rules_by_school/${scope}`)
      .once("value");
    const rulesSource = rulesSnap.exists()
      ? rulesSnap
      : await adminDb.ref("discipline_rules").once("value");
    const ruleCategories = new Map<number, string>();
    if (rulesSource.exists()) {
      rulesSource.forEach((child) => {
        const r = (child.val() || {}) as Record<string, unknown>;
        const id = Number(r.id || child.key || 0);
        if (id) ruleCategories.set(id, String(r.category || "").toUpperCase());
      });
    }

    const discRecords = await loadScopedChildren(
      `discipline_records_by_school/${scope}`,
      "discipline_records"
    );
    const discSeen = new Set<string>();
    for (const { key, row } of discRecords) {
      if (!key || discSeen.has(key)) continue;
      discSeen.add(key);
      const recSchool = normalizeSchoolId(row.schoolId);
      if (scope && recSchool && recSchool !== scope) continue;
      const status = String(row.status || "")
        .trim()
        .toUpperCase();
      if (status && status !== "APPROVED") continue;
      const dateMs = extractRecordDateMs(row, key);
      if (dateMs > 0 && (dateMs < startMs || dateMs > endMs)) continue;
      const student = resolveStudent(row);
      if (!student) continue;
      const recap = studentRows.get(rowKeyFor(student));
      if (!recap) continue;
      const ruleId = Number(row.ruleId || 0);
      const points = Number(row.points || 0);
      const category =
        ruleCategories.get(ruleId) || (points > 0 ? "VIOLATION" : "");
      if (category === "VIOLATION") recap.poinPelanggaran += points;
    }

    const rows = Array.from(studentRows.values());

    if (format === "json") {
      return NextResponse.json({
        success: true,
        totalStudents: students.length,
        className,
        schoolId,
        period: { startDate, endDate, label: periodText },
        headers: [...RECAP_HEADERS],
        sheetName: "Rangkuman Kelas",
        summary: rowsToJsonSummary(rows),
      });
    }

    const buffer = await buildRecapXlsxBuffer(className, periodText, rows);
    const safeClassName = (className || "WaliKelas").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePeriod = periodText.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Rekapitulasi_${safeClassName}_${safePeriod}.xlsx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("Error generating recap export:", error);
    const message =
      error instanceof Error ? error.message : "Gagal mengunduh rekapitulasi.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
