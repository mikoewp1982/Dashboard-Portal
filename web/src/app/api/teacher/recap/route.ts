import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import { normalizeClassName } from "@/lib/guru/normalizeClass";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function normalizeIdentity(value: string | null | undefined): string {
  return (value || "").trim();
}

function parseDateBound(value: string, endOfDay: boolean): number {
  const trimmed = (value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return endOfDay ? Date.now() : 0;
  const suffix = endOfDay ? "T23:59:59.999+07:00" : "T00:00:00.000+07:00";
  const ms = Date.parse(`${trimmed}${suffix}`);
  return Number.isFinite(ms) ? ms : endOfDay ? Date.now() : 0;
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

    // Prefer authenticated teacher scope; allow query override only when it matches.
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

    const studentByIdentity = new Map<string, (typeof students)[number]>();
    students.forEach((student) => {
      const aliases = [
        normalizeIdentity(student.id),
        normalizeIdentity(student.nisn),
        normalizeIdentity(student.username),
      ].filter((a) => a.length > 0);

      aliases.forEach((alias) => {
        if (!studentByIdentity.has(alias)) {
          studentByIdentity.set(alias, student);
        }
      });
    });

    const startMs = parseDateBound(startDate, false);
    const endMs = parseDateBound(endDate, true);
    const normalizedSchoolId = schoolId;

    // Attendance
    const attendanceMap = new Map<
      string,
      { hadir: number; izin: number; sakit: number; alpa: number }
    >();
    students.forEach((s) =>
      attendanceMap.set(s.id, { hadir: 0, izin: 0, sakit: 0, alpa: 0 })
    );

    const attSnap = await adminDb.ref("attendance").once("value");
    if (attSnap.exists()) {
      attSnap.forEach((child) => {
        const rec = child.val() || {};
        const date = Number(rec.date || rec.createdAt || 0);
        if (startMs && date < startMs) return;
        if (endMs && date > endMs) return;

        const recSchool = normalizeSchoolId(rec.schoolId);
        if (normalizedSchoolId && recSchool && recSchool !== normalizedSchoolId) return;

        const matchedStudent =
          studentByIdentity.get(normalizeIdentity(rec.studentId)) ||
          studentByIdentity.get(normalizeIdentity(rec.nisn));

        if (matchedStudent) {
          const stats = attendanceMap.get(matchedStudent.id) || {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0,
          };
          const status = String(rec.status || "").toUpperCase();
          if (status === "HADIR" || status === "PRESENT") stats.hadir++;
          else if (status === "IZIN" || status === "PERMIT") stats.izin++;
          else if (status === "SAKIT" || status === "SICK") stats.sakit++;
          else if (status === "ALPA" || status === "ABSENT") stats.alpa++;
          attendanceMap.set(matchedStudent.id, stats);
        }
      });
    }

    // Prayer
    const prayerMap = new Map<string, { totalHadir: number }>();
    students.forEach((s) => prayerMap.set(s.id, { totalHadir: 0 }));

    const prayerSnap = await adminDb.ref("prayer_attendance").once("value");
    if (prayerSnap.exists()) {
      prayerSnap.forEach((child) => {
        const rec = child.val() || {};
        const date = Number(rec.date || rec.createdAt || 0);
        if (startMs && date < startMs) return;
        if (endMs && date > endMs) return;

        const recSchool = normalizeSchoolId(rec.schoolId);
        if (normalizedSchoolId && recSchool && recSchool !== normalizedSchoolId) return;

        const matchedStudent =
          studentByIdentity.get(normalizeIdentity(rec.studentId)) ||
          studentByIdentity.get(normalizeIdentity(rec.nisn));

        if (matchedStudent) {
          const stats = prayerMap.get(matchedStudent.id) || { totalHadir: 0 };
          const status = String(rec.status || "").toUpperCase();
          if (status === "HADIR" || status === "PRESENT" || status === "PRAYED") {
            stats.totalHadir++;
          }
          prayerMap.set(matchedStudent.id, stats);
        }
      });
    }

    // Literacy
    const literacyMap = new Map<string, { totalBooks: number; totalMinutes: number }>();
    students.forEach((s) => literacyMap.set(s.id, { totalBooks: 0, totalMinutes: 0 }));

    const litSnap = await adminDb
      .ref(`literacy_logs_by_school/${normalizedSchoolId}`)
      .once("value");
    const litSourceSnap = litSnap.exists()
      ? litSnap
      : await adminDb.ref("literacy_logs").once("value");

    if (litSourceSnap.exists()) {
      litSourceSnap.forEach((child) => {
        const rec = child.val() || {};
        const date = Number(rec.createdAt || rec.date || 0);
        if (startMs && date < startMs) return;
        if (endMs && date > endMs) return;

        const recSchool = normalizeSchoolId(rec.schoolId);
        if (normalizedSchoolId && recSchool && recSchool !== normalizedSchoolId) return;

        const matchedStudent =
          studentByIdentity.get(normalizeIdentity(rec.studentId)) ||
          studentByIdentity.get(normalizeIdentity(rec.nisn));

        if (matchedStudent) {
          const stats = literacyMap.get(matchedStudent.id) || {
            totalBooks: 0,
            totalMinutes: 0,
          };
          stats.totalBooks += 1;
          stats.totalMinutes += Number(rec.durationMinutes || rec.duration || 15);
          literacyMap.set(matchedStudent.id, stats);
        }
      });
    }

    // Discipline
    const disciplineMap = new Map<
      string,
      { violationPoints: number; achievementPoints: number; violations: string[] }
    >();
    students.forEach((s) =>
      disciplineMap.set(s.id, { violationPoints: 0, achievementPoints: 0, violations: [] })
    );

    const rulesSnap = await adminDb
      .ref(`discipline_rules_by_school/${normalizedSchoolId}`)
      .once("value");
    const rulesSourceSnap = rulesSnap.exists()
      ? rulesSnap
      : await adminDb.ref("discipline_rules").once("value");
    const rulesCategories = new Map<number, string>();
    const rulesNames = new Map<number, string>();
    if (rulesSourceSnap.exists()) {
      rulesSourceSnap.forEach((child) => {
        const r = child.val() || {};
        const id = Number(r.id || child.key || 0);
        if (id) {
          rulesCategories.set(id, String(r.category || "").toUpperCase());
          rulesNames.set(id, String(r.ruleName || ""));
        }
      });
    }

    const discSnap = await adminDb.ref("discipline_records").once("value");
    if (discSnap.exists()) {
      discSnap.forEach((child) => {
        const rec = child.val() || {};
        const status = String(rec.status || "").toUpperCase();
        if (status && status !== "APPROVED") return;

        const date = Number(rec.date || rec.createdAt || 0);
        if (startMs && date < startMs) return;
        if (endMs && date > endMs) return;

        const recSchool = normalizeSchoolId(rec.schoolId);
        if (normalizedSchoolId && recSchool && recSchool !== normalizedSchoolId) return;

        const matchedStudent =
          studentByIdentity.get(normalizeIdentity(rec.studentId)) ||
          studentByIdentity.get(normalizeIdentity(rec.nisn));

        if (matchedStudent) {
          const stats = disciplineMap.get(matchedStudent.id) || {
            violationPoints: 0,
            achievementPoints: 0,
            violations: []
          };
          const category =
            rulesCategories.get(Number(rec.ruleId || 0)) ||
            (Number(rec.points || 0) > 0 ? "VIOLATION" : "");
          const points = Number(rec.points || 0);
          if (category === "VIOLATION") {
            stats.violationPoints += points;
            const ruleName = rec.ruleNameSnapshot || rulesNames.get(Number(rec.ruleId || 0)) || "Pelanggaran";
            stats.violations.push(ruleName);
          }
          else if (category === "ACHIEVEMENT") stats.achievementPoints += points;
          disciplineMap.set(matchedStudent.id, stats);
        }
      });
    }

    const summaryRows = students.map((s, index) => {
      const att = attendanceMap.get(s.id) || {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };
      const pr = prayerMap.get(s.id) || { totalHadir: 0 };
      const lit = literacyMap.get(s.id) || { totalBooks: 0, totalMinutes: 0 };
      const disc = disciplineMap.get(s.id) || {
        violationPoints: 0,
        achievementPoints: 0,
        violations: []
      };

      return {
        No: index + 1,
        NISN: s.nisn || "-",
        "Nama Siswa": s.name || "-",
        Kelas: s.className || className || "-",
        "Hadir (Hari)": att.hadir,
        "Izin (Hari)": att.izin,
        "Sakit (Hari)": att.sakit,
        "Alpa (Hari)": att.alpa,
        "Presensi Sholat (Total)": pr.totalHadir,
        "Literasi (Total Buku)": lit.totalBooks,
        "Literasi (Total Menit)": lit.totalMinutes,
        "Pelanggaran": disc.violations.join(", ") || "-",
        "Poin Pelanggaran": disc.violationPoints,
        "Poin Prestasi": disc.achievementPoints,
      };
    });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        totalStudents: students.length,
        className,
        schoolId,
        period: { startDate, endDate },
        summary: summaryRows,
      });
    }

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(
      summaryRows.length > 0
        ? summaryRows
        : [
            {
              No: "-",
              NISN: "-",
              "Nama Siswa": "Tidak ada siswa untuk kelas ini",
              Kelas: className,
              "Hadir (Hari)": 0,
              "Izin (Hari)": 0,
              "Sakit (Hari)": 0,
              "Alpa (Hari)": 0,
              "Presensi Sholat (Total)": 0,
              "Literasi (Total Buku)": 0,
              "Literasi (Total Menit)": 0,
              "Pelanggaran": "-",
              "Poin Pelanggaran": 0,
              "Poin Prestasi": 0,
            },
          ]
    );
    XLSX.utils.book_append_sheet(wb, wsSummary, "Rangkuman Kelas");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const safeClassName = (className || "WaliKelas").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Rekapitulasi_${safeClassName}_${startDate || "Awal"}_sd_${endDate || "Akhir"}.xlsx`;

    return new Response(buffer, {
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
