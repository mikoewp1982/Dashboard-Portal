"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PrayerRecapPanel } from "./PrayerRecapPanel";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { useGasPrayerAttendance } from "@/hooks/gas/attendance/useGasPrayerAttendance";

interface GasPrayerReportPanelProps {
  schoolId: string;
}

export default function GasPrayerReportPanel({ schoolId }: GasPrayerReportPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  const { schedules, holidays } = useGasSettings(schoolId);
  const { classes, students, logs, loading, refresh } = useGasPrayerAttendance(schoolId, selectedMonth, selectedYear);
  const { RefreshCw, Loader2 } = require("lucide-react");

  return (
    <div className="space-y-6 flex-1 overflow-y-auto p-6">
      <div className="glass-effect-dark-card rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100">Rekap Presensi Sholat</h2>
          <p className="text-slate-400 mt-1">Laporan komprehensif kehadiran sholat wajib dan sunnah</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>

      <PrayerRecapPanel 
        classes={classes}
        students={students}
        logs={logs}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedClassName={selectedClassName}
        setSelectedClassName={setSelectedClassName}
        schedules={schedules} 
        holidays={holidays} 
      />
    </div>
  );
}
