export interface HabitLogForGrading {
  date?: string;
  month?: number;
  year?: number;
  week: number;
  habits: {
    habit1: boolean;
    habit2: boolean;
    habit3: boolean;
    habit4: boolean;
    habit5: boolean;
    habit6: boolean;
    habit7: boolean;
  };
}

export interface GradingResult {
  dailyConsistency: number;
  weeklyProgress: number;
  monthlyAchievement: number;
  teacherRating: number;
  finalScore: number;
  predicate: string;
  category: string;
  description: string;
}

interface GradingPeriod {
  month?: number;
  year?: number;
}

export function calculateHabitGrades(
  logs: HabitLogForGrading[],
  teacherRating = 0,
  period: GradingPeriod = {}
): GradingResult {
  const uniqueLogs = dedupeLogsByDate(logs);

  if (uniqueLogs.length === 0) {
    return {
      dailyConsistency: 0,
      weeklyProgress: 0,
      monthlyAchievement: 0,
      teacherRating,
      finalScore: teacherRating * 0.1,
      predicate: "E - Kurang",
      category: "Perlu Perbaikan",
      description: "Tidak konsisten, perlu intervensi",
    };
  }

  let totalDailyScore = 0;
  uniqueLogs.forEach((log) => {
    const completedCount = Object.values(log.habits).filter(Boolean).length;
    totalDailyScore += (completedCount / 7) * 100;
  });
  const dailyConsistency = Math.min(100, totalDailyScore / uniqueLogs.length);

  const weeklyTicks: Record<number, number> = {};
  uniqueLogs.forEach((log) => {
    const completedCount = Object.values(log.habits).filter(Boolean).length;
    weeklyTicks[log.week] = (weeklyTicks[log.week] || 0) + completedCount;
  });

  const resolvedYear = period.year ?? uniqueLogs[0]?.year;
  const resolvedMonth = period.month ?? uniqueLogs[0]?.month;
  const weeklyScores = Array.from({ length: 5 }, (_, index) => index + 1)
    .map((week) => {
      const daysInWeek = countDaysInWeek(resolvedYear, resolvedMonth, week);
      if (daysInWeek <= 0) return null;
      const ticks = weeklyTicks[week] || 0;
      const denom = Math.max(daysInWeek * 7, 1);
      return Math.min(100, (ticks / denom) * 100);
    })
    .filter((value): value is number => value !== null);
  const weeklyProgress = weeklyScores.length > 0
    ? weeklyScores.reduce((sum, value) => sum + value, 0) / weeklyScores.length
    : 0;

  let totalMonthlyTicks = 0;
  uniqueLogs.forEach((log) => {
    totalMonthlyTicks += Object.values(log.habits).filter(Boolean).length;
  });
  const monthDays = Math.max(countDaysInMonth(resolvedYear, resolvedMonth), 1);
  const monthlyAchievement = Math.min(100, (totalMonthlyTicks / (monthDays * 7)) * 100);

  const finalScore = (
    (dailyConsistency * 0.4) +
    (weeklyProgress * 0.3) +
    (monthlyAchievement * 0.2) +
    (teacherRating * 0.1)
  );

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
    teacherRating,
    finalScore,
    predicate,
    category,
    description,
  };
}

function dedupeLogsByDate(logs: HabitLogForGrading[]) {
  const map = new Map<string, HabitLogForGrading>();
  logs.forEach((log, index) => {
    const key = log.date || `${log.year || 0}-${log.month || 0}-${log.week}-${index}`;
    map.set(key, log);
  });
  return Array.from(map.values());
}

function countDaysInWeek(year?: number, month?: number, week?: number) {
  if (!year || !month || !week) return 0;
  const maxDays = new Date(year, month, 0).getDate();
  const startDay = ((week - 1) * 7) + 1;
  const endDay = Math.min(startDay + 6, maxDays);
  return startDay > maxDays ? 0 : (endDay - startDay + 1);
}

function countDaysInMonth(year?: number, month?: number) {
  if (!year || !month) return 28;
  return new Date(year, month, 0).getDate();
}
