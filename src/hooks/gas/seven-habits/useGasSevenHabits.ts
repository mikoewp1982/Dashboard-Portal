import { useState, useEffect, useCallback } from "react";
import { callAdminApi } from "@/lib/callAdminApi";
import { isSessionInactiveError } from "@/lib/firebase/waitForClientUser";

export interface HabitLog {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  week: number;
  month: number;
  year: number;
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

export interface TeacherRubric {
  honesty: number;
  behavior: number;
  initiative: number;
  commitment: number;
  total: number;
}

export interface GradingData {
  studentId: string;
  dailyConsistency: number;
  weeklyProgress: number;
  monthlyAchievement: number;
  teacherRating: number;
  finalScore: number;
  predicate: string;
  category: string;
  description?: string;
  rubric: TeacherRubric | null;
}

export function useGasSevenHabits(
  schoolId: string | undefined,
  selectedMonth: number,
  selectedYear: number
) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [teacherRatings, setTeacherRatings] = useState<Record<string, TeacherRubric>>({});
  const [gradingData, setGradingData] = useState<GradingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingLoading, setGradingLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setLogs([]);
      setTeacherRatings({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await callAdminApi(
        `/api/admin/seven-habits?schoolId=${schoolId}&month=${selectedMonth}&year=${selectedYear}`,
        "GET"
      );

      const nextLogs = Array.isArray(result?.logs) ? result.logs as HabitLog[] : [];
      const nextRatingsRaw = (result?.teacherRatings || {}) as Record<string, Partial<TeacherRubric>>;
      const nextRatings: Record<string, TeacherRubric> = {};
      Object.entries(nextRatingsRaw).forEach(([key, rubric]) => {
        nextRatings[key] = {
          honesty: Number(rubric?.honesty || 0),
          behavior: Number(rubric?.behavior || 0),
          initiative: Number(rubric?.initiative || 0),
          commitment: Number(rubric?.commitment || 0),
          total: Number(rubric?.total || 0),
        };
      });

      setLogs(nextLogs);
      setTeacherRatings(nextRatings);
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error fetching seven habits snapshot:", error);
      }
      setLogs([]);
      setTeacherRatings({});
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedMonth, selectedYear]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setTeacherRating = async (studentId: string, month: number, year: number, rubric: TeacherRubric) => {
    try {
      await callAdminApi("/api/admin/seven-habits", "POST", {
        action: "set-teacher-rating",
        schoolId,
        studentId,
        month,
        year,
        rubric,
      });
      await refresh();
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error setting teacher rating:", error);
      }
      throw error;
    }
  };

  const fetchGradingData = useCallback(async (month: number, year: number) => {
    if (!schoolId) return;
    setGradingLoading(true);
    try {
      const res = await callAdminApi(`/api/admin/seven-habits/grading?schoolId=${schoolId}&month=${month}&year=${year}`, "GET");
      if (res && res.data) {
        setGradingData(res.data);
      }
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error fetching grading data:", error);
      }
    } finally {
      setGradingLoading(false);
    }
  }, [schoolId]);

  return {
    logs,
    teacherRatings,
    gradingData,
    loading,
    gradingLoading,
    setTeacherRating,
    fetchGradingData,
    refresh,
  };
}
