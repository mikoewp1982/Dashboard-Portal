"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Loader2 } from "lucide-react";
import { useGasPrayerAttendance } from "@/hooks/gas/attendance/useGasPrayerAttendance";
import { PrayerRecapPanel } from "./PrayerRecapPanel";
import { PrayerStatisticsPanel } from "./PrayerStatisticsPanel";
import { AttendanceSettingsPanel } from "../attendance/AttendanceSettingsPanel";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";

interface Props {
  schoolId: string;
}

export function GasPrayerPanel({ schoolId }: Props) {
  const [activeTab, setActiveTab] = useState<"monitoring" | "statistics" | "settings">("monitoring");
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  const { classes, students, logs, loading, refresh } = useGasPrayerAttendance(schoolId, selectedMonth, selectedYear);
  const { schedules, holidays } = useGasSettings(schoolId);
  const { user } = useAuthStore();
  const canViewStatistics = user?.role === "admin" || user?.role === "super_admin";
  const canManageSettings = user?.role === "admin";

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-slate-200">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Presensi Sholat</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitoring kehadiran sholat harian dan rekapitulasi bulanan siswa.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
        
        <div className="mt-6 border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("monitoring")}
              className={`cursor-pointer ${
                activeTab === "monitoring"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Monitoring & Rekapitulasi
            </button>
            {canViewStatistics && (
              <button
                onClick={() => setActiveTab("statistics")}
                className={`cursor-pointer ${
                  activeTab === "statistics"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Statistik
              </button>
            )}
            {canManageSettings && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`cursor-pointer ${
                  activeTab === "settings"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Pengaturan Sistem
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-400">
            Memuat data presensi sholat bulanan...
          </div>
        ) : activeTab === "monitoring" ? (
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
        ) : activeTab === "statistics" ? (
          <PrayerStatisticsPanel
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
        ) : (
          <AttendanceSettingsPanel />
        )}
      </div>
    </div>
  );
}
