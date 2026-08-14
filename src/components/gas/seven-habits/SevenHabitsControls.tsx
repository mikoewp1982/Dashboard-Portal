"use client";

import Link from "next/link";
import { Calendar, Download, GraduationCap, Loader2, Printer, RefreshCw } from "lucide-react";
import { DAYS, MONTHS, WEEKS, YEARS } from "./sevenHabitsConfig";

interface SevenHabitsControlsProps {
  viewMode: "monitoring" | "grading";
  habitsLoading: boolean;
  selectedYear: number;
  selectedMonth: number;
  selectedWeek: number;
  selectedDayName: string;
  availableClasses: string[];
  selectedClassName: string;
  selectedStudentId: string;
  onViewModeChange: (value: "monitoring" | "grading") => void;
  onRefresh: () => void;
  onExport: () => void;
  onPrint: () => void;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onWeekChange: (value: number) => void;
  onDayChange: (value: string) => void;
  onClassChange: (value: string) => void;
}

export function SevenHabitsControls(props: SevenHabitsControlsProps) {
  const {
    viewMode,
    habitsLoading,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDayName,
    availableClasses,
    selectedClassName,
    selectedStudentId,
    onViewModeChange,
    onRefresh,
    onExport,
    onPrint,
    onYearChange,
    onMonthChange,
    onWeekChange,
    onDayChange,
    onClassChange,
  } = props;

  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Laporan 7 Kebiasaan (7 KAIH)</h1>
            <p className="mt-1 text-sm text-slate-400">Monitoring pelaksanaan 7 Kebiasaan Anak Indonesia Hebat</p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>

            {viewMode === "monitoring" && !selectedStudentId && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Minggu:</span>
                  <select
                    value={selectedWeek}
                    onChange={(e) => onWeekChange(Number(e.target.value))}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {WEEKS.map((week) => (
                      <option key={week.value} value={week.value}>{week.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Hari:</span>
                  <select
                    value={selectedDayName}
                    onChange={(e) => onDayChange(e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={habitsLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {habitsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Muat Ulang
            </button>

            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassName}
            onChange={(e) => onClassChange(e.target.value)}
            className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>

          <button
            onClick={() => onViewModeChange("monitoring")}
            className={`inline-flex min-w-[150px] items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              viewMode === "monitoring"
                ? "border-blue-500/50 bg-blue-600/20 text-slate-100 shadow-sm"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100"
            }`}
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            Monitoring
          </button>
          <button
            onClick={() => onViewModeChange("grading")}
            className={`inline-flex min-w-[150px] items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              viewMode === "grading"
                ? "border-blue-500/50 bg-blue-600/20 text-slate-100 shadow-sm"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-100"
            }`}
          >
            <GraduationCap className="mr-1.5 h-4 w-4" />
            Penilaian
          </button>
        </div>
      </div>

    </>
  );
}
