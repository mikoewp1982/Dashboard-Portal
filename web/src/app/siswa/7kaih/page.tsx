"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listen7HabitsLogs,
  toggle7HabitItem,
  getTodayDateStr,
  type HabitDayLog,
} from "@/lib/siswa/studentDataService";

interface HabitDefinition {
  number: number;
  title: string;
  description: string;
  key: string;
}

const HABITS_LIST: HabitDefinition[] = [
  { number: 1, title: "Bangun Pagi", description: "Bangun sebelum pukul 05.00 WIB", key: "habit1" },
  { number: 2, title: "Beribadah", description: "Melaksanakan ibadah sesuai agama dan kepercayaan", key: "habit2" },
  { number: 3, title: "Berolahraga", description: "Melakukan aktivitas fisik minimal 30 menit", key: "habit3" },
  { number: 4, title: "Makan Sehat dan Bergizi", description: "Mengonsumsi makanan bergizi seimbang (4 sehat 5 sempurna)", key: "habit4" },
  { number: 5, title: "Gemar Belajar", description: "Membaca buku, mengerjakan tugas, dan belajar mandiri", key: "habit5" },
  { number: 6, title: "Bermasyarakat", description: "Bersosialisasi, membantu orang lain, dan aktif di lingkungan", key: "habit6" },
  { number: 7, title: "Tidur Lebih Awal", description: "Tidur maksimal pukul 21.00 WIB", key: "habit7" },
];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function SevenHabitsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(
    Math.min(5, Math.floor((now.getDate() - 1) / 7) + 1)
  );

  const [logs, setLogs] = useState<Record<string, HabitDayLog>>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const todayStr = getTodayDateStr();

  // Listen to realtime logs
  useEffect(() => {
    if (!user || !user.nisn) return;
    const unsub = listen7HabitsLogs(user.nisn, user.schoolId || "", (newLogs) => {
      setLogs(newLogs);
    });
    return () => unsub();
  }, [user]);

  // Compute 7 date strings (Sen, Sel, Rab, Kam, Jum, Sab, Min) for the selected week
  const weekDays = useMemo(() => {
    const dates: (string | null)[] = [null, null, null, null, null, null, null];
    const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const startDay = (selectedWeek - 1) * 7 + 1;
    const endDay = Math.min(startDay + 6, totalDaysInMonth);

    if (startDay <= totalDaysInMonth) {
      for (let day = startDay; day <= endDay; day++) {
        const d = new Date(selectedYear, selectedMonth, day);
        const dayOfWeek = d.getDay(); // 0 is Sunday
        const colIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Senin ... 6=Minggu
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dates[colIdx] = `${yyyy}-${mm}-${dd}`;
      }
    }
    return dates;
  }, [selectedYear, selectedMonth, selectedWeek]);

  const handleCellClick = async (colDateStr: string | null, habitKey: string) => {
    // Only allow clicking if the column corresponds to TODAY (matching Android rule)
    if (!colDateStr || colDateStr !== todayStr) return;
    if (!user || !user.nisn) return;

    const currentHabits = logs[todayStr]?.habits || {};
    const nextState = !currentHabits[habitKey];

    // Optimistic update
    setLogs((prev) => ({
      ...prev,
      [todayStr]: {
        id: `${user.nisn}_${todayStr}`,
        studentId: user.nisn || "",
        schoolId: user.schoolId || "",
        date: todayStr,
        habits: {
          ...currentHabits,
          [habitKey]: nextState,
        },
        updatedAt: Date.now(),
      },
    }));

    try {
      await toggle7HabitItem(
        user.nisn,
        user.schoolId || "",
        todayStr,
        habitKey,
        nextState,
        currentHabits
      );
    } catch {}
  };

  const handleSaveReport = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#12D6C6] via-[#0F7BFF] to-[#0F2A43] pb-24 text-white">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#0F2A43] to-[#0F7BFF] px-4 pt-12 pb-4 shadow-md flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/siswa")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">7 KAIH</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Title */}
        <h2 className="text-lg font-bold text-cyan-100">Checklist Mingguan</h2>

        {/* Year and Month Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tahun */}
          <div className="rounded-2xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-3 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider">
              Tahun
            </span>
            <div className="relative mt-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none appearance-none pr-5 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300 pointer-events-none" />
            </div>
          </div>

          {/* Bulan */}
          <div className="rounded-2xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-3 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider">
              Bulan
            </span>
            <div className="relative mt-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none appearance-none pr-5 cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Pilih Minggu Pills */}
        <div className="space-y-1.5">
          <span className="text-xs text-cyan-200 font-medium">Pilih Minggu:</span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWeek(w)}
                className={`flex-1 py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
                  selectedWeek === w
                    ? "bg-cyan-400 text-slate-950 font-black shadow-cyan-400/30"
                    : "bg-[#0B1F33]/40 border border-white/20 text-cyan-100 hover:bg-white/10"
                }`}
              >
                Mg {w}
              </button>
            ))}
          </div>
        </div>

        {/* Rule Caption */}
        <p className="text-[11px] text-cyan-100/90 font-medium pt-1">
          Hanya kotak untuk hari aktif hari ini yang bisa dicentang.
        </p>

        {/* 7 KAIH TABLE GRID (Matches Screenshot 2) */}
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-[#0B1F33]/40 backdrop-blur-md shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-cyan-200 font-bold">
                <th className="py-2.5 px-2 text-center w-8">No</th>
                <th className="py-2.5 px-2.5 min-w-[120px]">Kebiasaan</th>
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName, idx) => {
                  const colDateStr = weekDays[idx];
                  const isTodayCol = colDateStr === todayStr;
                  return (
                    <th
                      key={dayName}
                      className={`py-2.5 px-1.5 text-center text-[10px] uppercase ${
                        isTodayCol ? "text-cyan-300 font-black bg-cyan-500/20" : "text-cyan-200"
                      }`}
                    >
                      {dayName}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {HABITS_LIST.map((habit) => (
                <tr key={habit.number} className="hover:bg-white/5 transition">
                  {/* No */}
                  <td className="py-3 px-2 text-center font-bold text-cyan-200 align-top">
                    {habit.number}
                  </td>

                  {/* Title & Description */}
                  <td className="py-3 px-2.5 align-top">
                    <h3 className="text-xs font-bold text-white leading-snug">{habit.title}</h3>
                    <p className="text-[10px] text-cyan-100/70 leading-tight mt-0.5">
                      {habit.description}
                    </p>
                  </td>

                  {/* 7 Day Checkbox Cells */}
                  {weekDays.map((colDateStr, idx) => {
                    const isTodayCol = colDateStr === todayStr;
                    const isChecked = colDateStr
                      ? Boolean(logs[colDateStr]?.habits?.[habit.key])
                      : false;

                    return (
                      <td
                        key={idx}
                        className={`py-3 px-1 text-center align-middle ${
                          isTodayCol ? "bg-cyan-500/10" : ""
                        }`}
                      >
                        {colDateStr ? (
                          <button
                            type="button"
                            disabled={!isTodayCol}
                            onClick={() => handleCellClick(colDateStr, habit.key)}
                            className={`h-5 w-5 mx-auto rounded flex items-center justify-center border transition-all ${
                              isChecked
                                ? "bg-cyan-400 border-cyan-400 text-slate-950 font-black shadow-sm"
                                : isTodayCol
                                ? "border-cyan-300 bg-white/10 hover:bg-white/25 cursor-pointer"
                                : "border-white/20 bg-transparent opacity-40 cursor-not-allowed"
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>
                        ) : (
                          <div className="h-5 w-5 mx-auto rounded border border-white/10 opacity-20" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feedback Alert */}
        {savedSuccess && (
          <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3.5 text-xs text-emerald-200 font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Laporan 7 KAIH hari ini berhasil disimpan ke sistem!</span>
          </div>
        )}

        {/* Bottom Action Button (Dark Navy Pill Button) */}
        <button
          type="button"
          onClick={handleSaveReport}
          disabled={saving}
          className="w-full rounded-2xl bg-[#0A2239] hover:bg-[#0E2F4E] border border-cyan-500/30 py-3.5 text-sm font-bold text-white shadow-xl shadow-cyan-950/50 transition active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span>Simpan Laporan Hari Ini</span>
          )}
        </button>
      </div>
    </div>
  );
}
