/** APK-aligned 7 KAIH scoring (TeacherSevenHabits / SevenHabitsGradingUtils). */

export const KAIH_HABIT_NAMES = [
  "Bangun Pagi",
  "Beribadah",
  "Berolahraga",
  "Makan Sehat",
  "Gemar Belajar",
  "Bermasyarakat",
  "Tidur Awal",
] as const;

export const KAIH_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export const KAIH_MONTHS = [
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
] as const;

export type KaihHabits = {
  habit1: boolean;
  habit2: boolean;
  habit3: boolean;
  habit4: boolean;
  habit5: boolean;
  habit6: boolean;
  habit7: boolean;
};

export type KaihHabitLog = {
  id: string;
  studentId: string;
  schoolId: string;
  date: string;
  habits: KaihHabits;
  timestamp: number;
};

export type TeacherHabitRubric = {
  honesty: number;
  behavior: number;
  initiative: number;
  commitment: number;
  total: number;
  ratedAt: number;
};

export type SevenHabitsGradingResult = {
  dailyConsistency: number;
  weeklyProgress: number;
  monthlyAchievement: number;
  teacherRating: number;
  finalScore: number;
  predicate: string;
  category: string;
  description: string;
};

export const EMPTY_RUBRIC: TeacherHabitRubric = {
  honesty: 0,
  behavior: 0,
  initiative: 0,
  commitment: 0,
  total: 0,
  ratedAt: 0,
};

export function emptyHabits(): KaihHabits {
  return {
    habit1: false,
    habit2: false,
    habit3: false,
    habit4: false,
    habit5: false,
    habit6: false,
    habit7: false,
  };
}

export function rubricTotal(r: Omit<TeacherHabitRubric, "total" | "ratedAt"> & Partial<Pick<TeacherHabitRubric, "ratedAt">>): number {
  return (
    clampRubric(r.honesty) +
    clampRubric(r.behavior) +
    clampRubric(r.initiative) +
    clampRubric(r.commitment)
  );
}

export function clampRubric(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(25, Math.round(value)));
}

export function extractWeekOfMonth(date: string): number {
  const day = Number(String(date).split("-")[2] || 0);
  if (!day) return 1;
  return Math.min(5, Math.max(1, Math.floor((day - 1) / 7) + 1));
}

export function extractYear(date: string): number {
  return Number(String(date).split("-")[0] || 0);
}

export function extractMonth(date: string): number {
  return Number(String(date).split("-")[1] || 0);
}

export function extractDayName(date: string): string {
  const parts = String(date).split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return "";
  const dt = new Date(year, month - 1, day);
  const jsDay = dt.getDay(); // 0=Sun
  const index = jsDay === 0 ? 6 : jsDay - 1;
  return KAIH_DAYS[index] || "";
}

export function countDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function countDaysInWeek(year: number, month: number, week: number): number {
  const maxDays = countDaysInMonth(year, month);
  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(startDay + 6, maxDays);
  return startDay > maxDays ? 0 : endDay - startDay + 1;
}

export function datesForWeek(year: number, month: number, week: number): string[] {
  const maxDays = countDaysInMonth(year, month);
  const startDay = (week - 1) * 7 + 1;
  if (startDay > maxDays) return [];
  const endDay = Math.min(startDay + 6, maxDays);
  const out: string[] = [];
  for (let day = startDay; day <= endDay; day += 1) {
    out.push(
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  return out;
}

export function buildTodayDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function todayDayName(now = new Date()): string {
  return extractDayName(buildTodayDateKey(now));
}

function averageOrZero(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function habitCheckedCount(habits: KaihHabits): number {
  return Object.values(habits).filter(Boolean).length;
}

/** Matches native calculateSevenHabitsGrades */
export function calculateSevenHabitsGrades(
  logs: KaihHabitLog[],
  year: number,
  month: number,
  teacherRatingAvailable: boolean,
  teacherRating = 0
): SevenHabitsGradingResult {
  const byDate = new Map<string, KaihHabitLog>();
  logs.forEach((log) => {
    const prev = byDate.get(log.date);
    if (!prev || log.timestamp >= prev.timestamp) byDate.set(log.date, log);
  });
  const uniqueLogs = Array.from(byDate.values());

  if (uniqueLogs.length === 0) {
    return {
      dailyConsistency: 0,
      weeklyProgress: 0,
      monthlyAchievement: 0,
      teacherRating: teacherRatingAvailable ? teacherRating : 0,
      finalScore: teacherRatingAvailable ? teacherRating * 0.1 : 0,
      predicate: "E - Kurang",
      category: "Perlu Perbaikan",
      description: "Tidak konsisten, perlu intervensi",
    };
  }

  let totalDailyScore = 0;
  uniqueLogs.forEach((log) => {
    totalDailyScore += (habitCheckedCount(log.habits) / 7) * 100;
  });
  const dailyConsistency = Math.min(100, totalDailyScore / uniqueLogs.length);

  const weeklyTicks: Record<number, number> = {};
  uniqueLogs.forEach((log) => {
    const week = extractWeekOfMonth(log.date);
    weeklyTicks[week] = (weeklyTicks[week] || 0) + habitCheckedCount(log.habits);
  });

  const weeklyScores = [1, 2, 3, 4, 5]
    .map((week) => {
      const daysInWeek = countDaysInWeek(year, month, week);
      if (daysInWeek <= 0) return null;
      const ticks = weeklyTicks[week] || 0;
      const denom = Math.max(daysInWeek * 7, 1);
      return Math.min(100, Math.max(0, (ticks / denom) * 100));
    })
    .filter((v): v is number => v !== null);
  const weeklyProgress = averageOrZero(weeklyScores);

  const totalMonthlyTicks = uniqueLogs.reduce(
    (sum, log) => sum + habitCheckedCount(log.habits),
    0
  );
  const monthDays = Math.max(countDaysInMonth(year, month), 1);
  const monthlyAchievement = Math.min(
    100,
    Math.max(0, (totalMonthlyTicks / (monthDays * 7)) * 100)
  );

  const baseScore =
    dailyConsistency * 0.4 + weeklyProgress * 0.3 + monthlyAchievement * 0.2;
  const finalScore = teacherRatingAvailable
    ? Math.min(100, Math.max(0, baseScore + teacherRating * 0.1))
    : Math.min(100, Math.max(0, baseScore / 0.9));

  let predicate = "E - Kurang";
  let category = "Perlu Perbaikan";
  let description = "Tidak konsisten, perlu intervensi";
  if (finalScore >= 95) {
    predicate = "A - Sangat Baik Sekali";
    category = "Sangat Baik Sekali";
    description = "Konsisten sempurna";
  } else if (finalScore >= 85) {
    predicate = "B - Sangat Baik";
    category = "Sangat Baik";
    description = "Konsisten baik, sedikit terlewat";
  } else if (finalScore >= 70) {
    predicate = "C - Baik";
    category = "Baik";
    description = "Cukup konsisten, perlu peningkatan";
  } else if (finalScore >= 50) {
    predicate = "D - Cukup";
    category = "Cukup";
    description = "Kurang konsisten, perlu perhatian";
  }

  return {
    dailyConsistency,
    weeklyProgress,
    monthlyAchievement,
    teacherRating: teacherRatingAvailable ? teacherRating : 0,
    finalScore,
    predicate,
    category,
    description,
  };
}

export function predicateForMonitoringScore(score: number): string {
  if (score >= 90) return "Sangat Baik";
  if (score >= 80) return "Baik";
  if (score >= 70) return "Cukup";
  return "Perlu Binaan";
}

export function scoreColorClass(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-green-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

export function scoreBarClass(score: number): string {
  if (score >= 90) return "bg-emerald-400";
  if (score >= 80) return "bg-green-400";
  if (score >= 70) return "bg-amber-400";
  return "bg-red-400";
}

export function formatPercent(score: number): string {
  return `${score.toFixed(1)}%`;
}

export type HabitMonitoringScore = {
  label: string;
  checkedDays: number;
  score: number;
};

export type StudentMonitoringMetrics = {
  weeklyScore: number;
  monthlyScore: number;
  completionRate: number;
  loggedDays: number;
  validWeekDays: number;
  checkedHabits: number;
  totalHabitSlots: number;
  predicate: string;
  dayStatus: string;
  habitScores: HabitMonitoringScore[];
};

export type WeekRecapItem = { label: string; score: number };

export type ClassMonitoringSummary = {
  averageWeeklyScore: number;
  averageMonthlyScore: number;
  averageCompletionRate: number;
  activeStudents: number;
  totalStudents: number;
  predicate: string;
  selectedWeek: number;
  weekRecaps: WeekRecapItem[];
};

export function buildStudentMonitoringMetrics(
  weekLogs: KaihHabitLog[],
  monthLogs: KaihHabitLog[],
  dayLog: KaihHabitLog | null,
  selectedYear: number,
  selectedMonth: number,
  selectedWeek: number
): StudentMonitoringMetrics {
  const validWeekDays = countDaysInWeek(selectedYear, selectedMonth, selectedWeek);
  const totalHabitSlots = Math.max(validWeekDays * KAIH_HABIT_NAMES.length, 1);
  const weekLogsByDate = new Map(weekLogs.map((log) => [log.date, log]));
  const weekDates = datesForWeek(selectedYear, selectedMonth, selectedWeek);

  const checkedHabits = weekDates.reduce((sum, date) => {
    const log = weekLogsByDate.get(date);
    return sum + (log ? habitCheckedCount(log.habits) : 0);
  }, 0);
  const loggedDays = weekDates.filter((date) => weekLogsByDate.has(date)).length;
  const weeklyScore = Math.min(
    100,
    Math.max(0, (checkedHabits / totalHabitSlots) * 100)
  );

  const validMonthDays = Math.max(countDaysInMonth(selectedYear, selectedMonth), 1);
  const monthlyChecked = monthLogs.reduce(
    (sum, log) => sum + habitCheckedCount(log.habits),
    0
  );
  const monthlyScore = Math.min(
    100,
    Math.max(0, (monthlyChecked / (validMonthDays * KAIH_HABIT_NAMES.length)) * 100)
  );
  const completionRate = Math.min(
    100,
    Math.max(0, (loggedDays / Math.max(validWeekDays, 1)) * 100)
  );

  const habitScores = KAIH_HABIT_NAMES.map((label, index) => {
    const key = `habit${index + 1}` as keyof KaihHabits;
    const checkedDays = weekDates.filter(
      (date) => weekLogsByDate.get(date)?.habits[key] === true
    ).length;
    return {
      label,
      checkedDays,
      score: Math.min(
        100,
        Math.max(0, (checkedDays / Math.max(validWeekDays, 1)) * 100)
      ),
    };
  });

  return {
    weeklyScore,
    monthlyScore,
    completionRate,
    loggedDays,
    validWeekDays,
    checkedHabits,
    totalHabitSlots,
    predicate: predicateForMonitoringScore(weeklyScore),
    dayStatus: dayLog
      ? `${habitCheckedCount(dayLog.habits)}/7`
      : "Belum Isi",
    habitScores,
  };
}

export function buildClassMonitoringSummary(
  studentMetrics: StudentMonitoringMetrics[],
  weekRecapScores: number[],
  selectedWeek: number
): ClassMonitoringSummary {
  if (studentMetrics.length === 0) {
    return {
      averageWeeklyScore: 0,
      averageMonthlyScore: 0,
      averageCompletionRate: 0,
      activeStudents: 0,
      totalStudents: 0,
      predicate: "Belum Ada Data",
      selectedWeek,
      weekRecaps: [],
    };
  }

  const weeklyAverage = averageOrZero(studentMetrics.map((m) => m.weeklyScore));
  return {
    averageWeeklyScore: weeklyAverage,
    averageMonthlyScore: averageOrZero(studentMetrics.map((m) => m.monthlyScore)),
    averageCompletionRate: averageOrZero(
      studentMetrics.map((m) => m.completionRate)
    ),
    activeStudents: studentMetrics.filter((m) => m.loggedDays > 0).length,
    totalStudents: studentMetrics.length,
    predicate: predicateForMonitoringScore(weeklyAverage),
    selectedWeek,
    weekRecaps: [1, 2, 3, 4, 5].map((week, i) => ({
      label: `Minggu ${week}`,
      score: weekRecapScores[i] ?? 0,
    })),
  };
}

export function buildRatingKey(studentId: string, month: number, year: number): string {
  return `${String(studentId).trim()}_${month}_${year}`;
}

export function parseHabits(raw: Record<string, unknown> | null | undefined): KaihHabits {
  const habitsNode =
    raw?.habits && typeof raw.habits === "object"
      ? (raw.habits as Record<string, unknown>)
      : raw || {};
  const read = (key: string) =>
    Boolean(habitsNode[key] ?? (raw as Record<string, unknown> | undefined)?.[key] ?? false);
  return {
    habit1: read("habit1"),
    habit2: read("habit2"),
    habit3: read("habit3"),
    habit4: read("habit4"),
    habit5: read("habit5"),
    habit6: read("habit6"),
    habit7: read("habit7"),
  };
}

export function parseRubric(raw: Record<string, unknown> | null | undefined): TeacherHabitRubric {
  if (!raw || typeof raw !== "object") return { ...EMPTY_RUBRIC };
  const honesty = clampRubric(Number(raw.honesty || 0));
  const behavior = clampRubric(Number(raw.behavior || 0));
  const initiative = clampRubric(Number(raw.initiative || 0));
  const commitment = clampRubric(Number(raw.commitment || 0));
  const totalFromFields = honesty + behavior + initiative + commitment;
  const total = Number.isFinite(Number(raw.total))
    ? Math.max(0, Math.min(100, Math.round(Number(raw.total))))
    : totalFromFields;
  // APK defaults missing ratedAt to 1 so admin-saved rows still count as rated
  const ratedAtRaw = raw.ratedAt ?? raw.updatedAt;
  const ratedAt =
    typeof ratedAtRaw === "number" && Number.isFinite(ratedAtRaw)
      ? ratedAtRaw
      : ratedAtRaw
        ? Number(ratedAtRaw) || 1
        : 1;
  return { honesty, behavior, initiative, commitment, total, ratedAt };
}
