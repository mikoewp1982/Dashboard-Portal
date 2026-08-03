import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import {
  TeacherAuthError,
  verifyTeacherRequest,
} from "@/lib/guru/verifyTeacherRequest";
import { asLong, loadHomeroomStudents } from "@/lib/guru/loadClassRoster";
import {
  buildIdentityMap,
  matchStudentByRow,
  normalizeIdentity,
  preferredStudentIdentity,
  type GuruStudent,
} from "@/lib/guru/studentIdentity";
import { DEFAULT_DISCIPLINE_RULES, type DisciplineRule } from "@/types/discipline";

export const dynamic = "force-dynamic";

type RuleRow = {
  id: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  severity: string;
  description: string | null;
  isActive: boolean;
};

type HistoryItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  ruleId: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  description: string;
  date: number;
  status: string;
};

function parseRulesFromSnapshot(val: unknown): RuleRow[] {
  if (!val || typeof val !== "object") return [];
  const rows: RuleRow[] = [];
  Object.entries(val as Record<string, unknown>).forEach(([key, raw]) => {
    if (!raw || typeof raw !== "object") return;
    const row = raw as Record<string, unknown>;
    const id = Number(row.id ?? key);
    if (!Number.isFinite(id) || id <= 0) return;
    const category =
      String(row.category || "VIOLATION").trim().toUpperCase() === "ACHIEVEMENT"
        ? "ACHIEVEMENT"
        : "VIOLATION";
    const isActive = row.isActive === undefined ? true : Boolean(row.isActive);
    rows.push({
      id,
      ruleName: String(row.ruleName || row.name || `Aturan ${id}`).trim(),
      category,
      points: Number(row.points || 0) || 0,
      severity: String(row.severity || "LOW").trim().toUpperCase() || "LOW",
      description:
        row.description != null && String(row.description).trim()
          ? String(row.description).trim()
          : null,
      isActive,
    });
  });
  return rows.sort((a, b) => a.id - b.id);
}

async function loadDisciplineRules(schoolId: string): Promise<RuleRow[]> {
  const scope = normalizeSchoolId(schoolId);

  const tenantSnap = await adminDb
    .ref(`gas/schools/${scope}/settings/disciplineRules`)
    .once("value");
  const tenantRules = parseRulesFromSnapshot(tenantSnap.val()).filter((r) => r.isActive);
  if (tenantRules.length > 0) return tenantRules;

  const scopedSnap = await adminDb
    .ref(`discipline_rules_by_school/${scope}`)
    .once("value");
  const scopedRules = parseRulesFromSnapshot(scopedSnap.val()).filter((r) => r.isActive);
  if (scopedRules.length > 0) return scopedRules;

  const globalSnap = await adminDb.ref("discipline_rules").once("value");
  const globalRules = parseRulesFromSnapshot(globalSnap.val()).filter((r) => r.isActive);
  if (globalRules.length > 0) return globalRules;

  return DEFAULT_DISCIPLINE_RULES.filter((r) => r.isActive).map((r: DisciplineRule) => ({
    id: r.id,
    ruleName: r.ruleName,
    category: r.category,
    points: r.points,
    severity: r.severity,
    description: r.description,
    isActive: r.isActive,
  }));
}

async function loadDisciplineRecords(schoolId: string): Promise<
  Array<Record<string, unknown> & { id: string }>
> {
  const scope = normalizeSchoolId(schoolId);
  const records: Array<Record<string, unknown> & { id: string }> = [];

  const scoped = await adminDb.ref(`discipline_records_by_school/${scope}`).once("value");
  const source = scoped.exists()
    ? scoped
    : await adminDb
        .ref("discipline_records")
        .orderByChild("schoolId")
        .equalTo(scope)
        .once("value");

  if (!source.exists()) return records;

  source.forEach((child) => {
    const row = (child.val() || {}) as Record<string, unknown>;
    const rowSchool = normalizeSchoolId(row.schoolId);
    if (scope && rowSchool && rowSchool !== scope) return;
    records.push({ id: child.key || "", ...row });
  });

  return records;
}

function buildHistory(
  records: Array<Record<string, unknown> & { id: string }>,
  students: GuruStudent[],
  rules: RuleRow[]
): HistoryItem[] {
  const identityMap = buildIdentityMap(students);
  const ruleById = new Map(rules.map((r) => [r.id, r]));

  const items: HistoryItem[] = [];
  records.forEach((row) => {
    const student = matchStudentByRow(row, identityMap);
    if (!student) return;
    const ruleId = Number(row.ruleId || 0);
    const rule = ruleById.get(ruleId);
    const category =
      rule?.category ||
      (String(row.category || "").toUpperCase() === "ACHIEVEMENT"
        ? "ACHIEVEMENT"
        : "VIOLATION");
    const date = asLong(row.date) || asLong(row.createdAt) || 0;
    items.push({
      id: row.id,
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      ruleId,
      ruleName:
        rule?.ruleName ||
        String(row.ruleNameSnapshot || row.ruleName || "Aturan tidak ditemukan"),
      category,
      points: Number(row.points ?? rule?.points ?? 0) || 0,
      description: String(row.description || row.note || "").trim(),
      date,
      status: String(row.status || "APPROVED"),
    });
  });

  return items.sort((a, b) => b.date - a.date);
}

function calculateStats(history: HistoryItem[]) {
  let violationCount = 0;
  let violationPoints = 0;
  let achievementCount = 0;
  let achievementPoints = 0;

  history.forEach((item) => {
    if (item.category === "VIOLATION") {
      violationCount += 1;
      violationPoints += item.points;
    } else {
      achievementCount += 1;
      achievementPoints += item.points;
    }
  });

  return {
    violationCount,
    violationPoints,
    achievementCount,
    achievementPoints,
  };
}

export async function GET(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    const schoolId = normalizeSchoolId(teacher.schoolId);
    if (!teacher.className) {
      return NextResponse.json(
        { success: false, message: "Kelas wali tidak terdeteksi pada akun guru." },
        { status: 400 }
      );
    }

    const [students, rules, records] = await Promise.all([
      loadHomeroomStudents(schoolId, teacher.className),
      loadDisciplineRules(schoolId),
      loadDisciplineRecords(schoolId),
    ]);

    const history = buildHistory(records, students, rules);
    const stats = calculateStats(history);

    return NextResponse.json({
      success: true,
      className: teacher.className,
      students: students.map((s) => ({
        id: s.id,
        recordId: s.recordId,
        name: s.name,
        nisn: s.nisn,
        username: s.username,
        className: s.className,
        preferredId: preferredStudentIdentity(s),
      })),
      rules: rules.filter((r) => r.category === "VIOLATION" || r.category === "ACHIEVEMENT"),
      history,
      stats,
    });
  } catch (error) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("GET teacher/discipline error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memuat data kedisiplinan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacher = await verifyTeacherRequest(req);
    const schoolId = normalizeSchoolId(teacher.schoolId);
    const body = await req.json();

    const studentId = normalizeIdentity(body.studentId);
    const ruleId = Number(body.ruleId);
    const description = String(body.description || "").trim();

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId wajib diisi." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(ruleId) || ruleId <= 0) {
      return NextResponse.json(
        { success: false, message: "ruleId tidak valid." },
        { status: 400 }
      );
    }
    if (!teacher.className) {
      return NextResponse.json(
        { success: false, message: "Kelas wali tidak terdeteksi pada akun guru." },
        { status: 400 }
      );
    }

    const [students, rules] = await Promise.all([
      loadHomeroomStudents(schoolId, teacher.className),
      loadDisciplineRules(schoolId),
    ]);

    const identityMap = buildIdentityMap(students);
    const student =
      identityMap.get(studentId.toLowerCase()) ||
      students.find((s) => preferredStudentIdentity(s) === studentId);

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa di luar kelas wali Anda." },
        { status: 403 }
      );
    }

    const rule = rules.find((r) => r.id === ruleId && r.isActive);
    if (!rule) {
      return NextResponse.json(
        { success: false, message: "Aturan kedisiplinan tidak ditemukan." },
        { status: 404 }
      );
    }

    // APK AddDisciplineDialog only exposes VIOLATION rules for final input.
    if (rule.category !== "VIOLATION") {
      return NextResponse.json(
        { success: false, message: "Hanya pelanggaran (VIOLATION) yang dapat diinput." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const recordRef = adminDb.ref("discipline_records").push();
    const recordKey = recordRef.key;
    if (!recordKey) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat ID catatan." },
        { status: 500 }
      );
    }

    const reporterName = teacher.name || "Guru";
    const studentIdentifier = preferredStudentIdentity(student);

    // Match APK DisciplineRepository.saveRecord payload + paths.
    const record = {
      id: recordKey,
      schoolId,
      studentId: studentIdentifier,
      studentNameSnapshot: student.name,
      classNameSnapshot: student.className,
      ruleId: rule.id,
      ruleNameSnapshot: rule.ruleName,
      date: now,
      points: rule.points,
      description: description || null,
      recordedBy: reporterName,
      reportedByUserId: teacher.nuptk || teacher.teacherId || teacher.uid,
      reportedByName: reporterName,
      reportedByRole: "teacher",
      sourceApp: "gas_teacher_pwa",
      followUpStatus: "OPEN",
      followUpNote: null,
      status: "APPROVED",
      createdAt: now,
      updatedAt: now,
    };

    const updates: Record<string, unknown> = {
      [`discipline_records/${recordKey}`]: record,
      [`discipline_records_by_school/${schoolId}/${recordKey}`]: record,
    };

    await adminDb.ref().update(updates);

    return NextResponse.json({
      success: true,
      message: "Pelanggaran final berhasil dicatat",
      data: record,
    });
  } catch (error) {
    if (error instanceof TeacherAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error("POST teacher/discipline error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menyimpan catatan kedisiplinan.",
      },
      { status: 500 }
    );
  }
}
