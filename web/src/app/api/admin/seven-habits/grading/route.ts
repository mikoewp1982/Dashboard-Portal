import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { calculateHabitGrades, type HabitLogForGrading } from "@/utils/grading7Habits";

function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");
    const monthStr = url.searchParams.get("month");
    const yearStr = url.searchParams.get("year");

    const targetSchoolId = role === "super_admin" ? schoolId : userSchoolId;
    if (!targetSchoolId || !monthStr || !yearStr) {
      return NextResponse.json({ error: "Missing required query params" }, { status: 400 });
    }

    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    // 1. Fetch Students dari RTDB
    const studentsSnap = await adminDb.ref(`gas/schools/${targetSchoolId}/students`).once("value");
    const students = studentsSnap.val() || {};
    const studentList = Object.entries(students)
      .map(([id, val]: any) => ({ id, ...val }))
      .filter((s: any) => s.status !== "Nonaktif");

    // 2. Fetch Seven Habits logs dari RTDB
    const habitsSnap = await adminDb.ref("seven_habits_logs").once("value");
    const allHabitLogs = habitsSnap.val() || {};

    // 3. Fetch Teacher Ratings
    const ratingsSnap = await adminDb.ref(`seven_habits_teacher_ratings/${targetSchoolId}`).once("value");
    const teacherRatings = ratingsSnap.val() || {};

    const gradingData = studentList.map((student: any) => {
      const sid = normalizeIdentity(student.id);
      const nisn = normalizeIdentity(student.nisn);
      const ratingKey1 = `${sid}_${month}_${year}`;
      const ratingKey2 = `${nisn}_${month}_${year}`;
      const rubricObj = teacherRatings[ratingKey1] || teacherRatings[ratingKey2] || null;
      const teacherRating = rubricObj ? Number(rubricObj.total || 0) : 0;

      const rawStudentLogs = allHabitLogs[sid] || allHabitLogs[nisn] || {};
      const studentLogs: HabitLogForGrading[] = Object.entries(rawStudentLogs)
        .map(([dateStr, rawLog]: [string, any]) => {
          const [y, m, d] = dateStr.split("-").map(Number);
          return {
            week: Math.ceil(d / 7),
            month: m,
            year: y,
            habits: {
              habit1: Boolean(rawLog?.habits?.habit1 ?? rawLog?.habit1 ?? false),
              habit2: Boolean(rawLog?.habits?.habit2 ?? rawLog?.habit2 ?? false),
              habit3: Boolean(rawLog?.habits?.habit3 ?? rawLog?.habit3 ?? false),
              habit4: Boolean(rawLog?.habits?.habit4 ?? rawLog?.habit4 ?? false),
              habit5: Boolean(rawLog?.habits?.habit5 ?? rawLog?.habit5 ?? false),
              habit6: Boolean(rawLog?.habits?.habit6 ?? rawLog?.habit6 ?? false),
              habit7: Boolean(rawLog?.habits?.habit7 ?? rawLog?.habit7 ?? false),
            },
          };
        })
        .filter((log) => log.month === month && log.year === year);

      const result = calculateHabitGrades(studentLogs, teacherRating);

      return {
        studentId: sid,
        dailyConsistency: result.dailyConsistency,
        weeklyProgress: result.weeklyProgress,
        monthlyAchievement: result.monthlyAchievement,
        teacherRating: result.teacherRating,
        finalScore: result.finalScore,
        predicate: result.predicate,
        category: result.category,
        description: result.description,
        rubric: rubricObj,
      };
    });

    return NextResponse.json({ success: true, data: gradingData });

  } catch (error: any) {
    console.error("7 Habits Grading API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
