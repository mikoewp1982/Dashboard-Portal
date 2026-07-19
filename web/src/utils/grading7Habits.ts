export interface HabitLogForGrading {
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

export function calculateHabitGrades(
  logs: HabitLogForGrading[],
  teacherRating = 0
): GradingResult {
  if (logs.length === 0) {
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
  logs.forEach((log) => {
    const completedCount = Object.values(log.habits).filter(Boolean).length;
    totalDailyScore += (completedCount / 7) * 100;
  });
  const dailyConsistency = Math.min(100, totalDailyScore / logs.length);

  const weeklyTicks: Record<number, number> = {};
  logs.forEach((log) => {
    const completedCount = Object.values(log.habits).filter(Boolean).length;
    weeklyTicks[log.week] = (weeklyTicks[log.week] || 0) + completedCount;
  });

  let totalWeeklyScore = 0;
  const weeks = Object.keys(weeklyTicks).length;
  Object.values(weeklyTicks).forEach((ticks) => {
    totalWeeklyScore += (ticks / 49) * 100;
  });
  const weeklyProgress = weeks > 0 ? Math.min(100, totalWeeklyScore / weeks) : 0;

  let totalMonthlyTicks = 0;
  logs.forEach((log) => {
    totalMonthlyTicks += Object.values(log.habits).filter(Boolean).length;
  });
  const monthlyAchievement = Math.min(100, (totalMonthlyTicks / 196) * 100);

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
