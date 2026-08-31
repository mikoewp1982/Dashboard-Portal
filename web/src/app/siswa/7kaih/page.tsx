"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sun,
  HeartHandshake,
  Activity,
  Utensils,
  BookOpen,
  Users,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listen7HabitsLogs,
  toggle7HabitItem,
  getTodayDateStr,
  HABIT_DEFINITIONS,
  type HabitDayLog,
} from "@/lib/siswa/studentDataService";

const HABIT_ICONS: Record<string, any> = {
  Sun,
  HeartHandshake,
  Activity,
  Utensils,
  BookOpen,
  Users,
  Moon,
};

export default function SevenHabitsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [logs, setLogs] = useState<Record<string, HabitDayLog>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  // Realtime listener
  useEffect(() => {
    if (!user || !user.nisn) {
      setLoading(false);
      return;
    }

    const unsub = listen7HabitsLogs(user.nisn, user.schoolId || "", (newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const currentDayLog = logs[selectedDate] || {
    id: `${user?.nisn}_${selectedDate}`,
    studentId: user?.nisn || "",
    schoolId: user?.schoolId || "",
    date: selectedDate,
    habits: {},
    updatedAt: Date.now(),
  };

  const currentHabits = currentDayLog.habits || {};
  const completedTodayCount = Object.values(currentHabits).filter(Boolean).length;
  const energyPercent = Math.round((completedTodayCount / 7) * 100);

  // Generate current week dates
  const getWeekDates = (baseDateStr: string) => {
    const d = new Date(baseDateStr);
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - distanceToMonday);

    const week: { dateStr: string; dayName: string; dateNum: number }[] = [];
    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const curStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      week.push({
        dateStr: curStr,
        dayName: dayNames[i],
        dateNum: cur.getDate(),
      });
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Calculate week total completion
  const weekTotalCompleted = weekDates.reduce((acc, item) => {
    const dayHabits = logs[item.dateStr]?.habits || {};
    return acc + Object.values(dayHabits).filter(Boolean).length;
  }, 0);

  const handleToggle = async (habitKey: string) => {
    if (!user || !user.nisn) return;
    const nextState = !currentHabits[habitKey];
    setSavingKey(habitKey);

    // Optimistic local update
    setLogs((prev) => ({
      ...prev,
      [selectedDate]: {
        ...currentDayLog,
        habits: {
          ...currentHabits,
          [habitKey]: nextState,
        },
      },
    }));

    try {
      await toggle7HabitItem(
        user.nisn,
        user.schoolId || "",
        selectedDate,
        habitKey,
        nextState,
        currentHabits
      );
    } catch {
      // Revert on error
      setLogs((prev) => ({
        ...prev,
        [selectedDate]: currentDayLog,
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const changeDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSelectedDate(newStr);
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-indigo-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">7 KAIH</h1>
            <p className="text-xs text-indigo-200">7 Kebiasaan Anak Indonesia Hebat</p>
          </div>
        </div>

        {/* Week Calendar Strip */}
        <div className="mt-4 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => changeDay(-7)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-1 items-center justify-between gap-1">
            {weekDates.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;
              const dayHabits = logs[item.dateStr]?.habits || {};
              const count = Object.values(dayHabits).filter(Boolean).length;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex flex-1 flex-col items-center py-2 px-1 rounded-2xl transition ${
                    isSelected
                      ? "bg-white text-indigo-900 shadow-md font-bold"
                      : "bg-white/10 text-indigo-100 hover:bg-white/20 font-medium"
                  }`}
                >
                  <span className="text-[10px] uppercase opacity-80">{item.dayName}</span>
                  <span className="text-sm font-black my-0.5">{item.dateNum}</span>
                  <div className="flex items-center gap-0.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        count === 7
                          ? "bg-emerald-400"
                          : count > 0
                          ? "bg-amber-400"
                          : isSelected
                          ? "bg-indigo-200"
                          : "bg-white/30"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => changeDay(7)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Progress Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                {selectedDate === todayStr ? "Progress Hari Ini" : `Tanggal ${selectedDate}`}
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {completedTodayCount} dari 7 Kebiasaan
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-indigo-700">{energyPercent}%</span>
              <span className="text-[10px] text-slate-400 font-semibold">Energi Pet</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${energyPercent}%` }}
            />
          </div>

          {/* Week Summary Badge */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Total Mingguan:</span>
            <span className="font-bold text-slate-800">{weekTotalCompleted} / 49 Selesai</span>
          </div>
        </div>

        {/* Habits Checklist */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Checklist 7 Kebiasaan
          </h2>

          {HABIT_DEFINITIONS.map((habit) => {
            const isChecked = Boolean(currentHabits[habit.key]);
            const IconComp = HABIT_ICONS[habit.icon] || Sun;

            return (
              <div
                key={habit.key}
                onClick={() => handleToggle(habit.key)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                  isChecked
                    ? "bg-indigo-50/70 border-indigo-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition"
                    style={{
                      backgroundColor: isChecked ? `${habit.color}25` : "#F1F5F9",
                      color: isChecked ? habit.color : "#64748B",
                    }}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-bold transition ${
                        isChecked ? "text-indigo-950" : "text-slate-800"
                      }`}
                    >
                      {habit.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {habit.subtitle}
                    </p>
                  </div>
                </div>

                {/* Checkbox Icon */}
                <div className="shrink-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                      isChecked
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pet Energy Info Note */}
        <div className="rounded-2xl bg-indigo-50/80 p-4 border border-indigo-100 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-900">Koneksi ke Sahabat Belajar (Virtual Pet)</h4>
            <p className="text-[11px] text-indigo-700 leading-relaxed mt-0.5">
              Setiap 1 kebiasaan yang dicentang akan menambah <strong>~14.3% Energi Pet</strong>. Mengisi lengkap ke-7 kebiasaan membuat energi pet menjadi <strong>100%</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
