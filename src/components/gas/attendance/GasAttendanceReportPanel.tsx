"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { AttendanceRecapPanel } from "./AttendanceRecapPanel";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { useGasAttendance } from "@/hooks/gas/attendance/useGasAttendance";

interface GasAttendanceReportPanelProps {
  schoolId: string;
}

export default function GasAttendanceReportPanel({ schoolId }: GasAttendanceReportPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { schedules, holidays } = useGasSettings(schoolId);
  const { classes, students, attendances, loading, refresh } = useGasAttendance(schoolId, selectedMonth, selectedYear);

  return (
    <div className="space-y-6 flex-1 overflow-y-auto p-6">
      <div className="glass-effect-dark-card rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100">Rekap Kehadiran Siswa</h2>
          <p className="text-slate-400 mt-1">Laporan komprehensif presensi bulanan sekolah</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>

      <AttendanceRecapPanel 
        classes={classes}
        students={students}
        attendances={attendances}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        schedules={schedules} 
        holidays={holidays} 
      />
    </div>
  );
}
