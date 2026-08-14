"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PrayerTypeId } from "@/types/gasPrayerConfig";
import { useGasPrayerConfig } from "@/hooks/gas/attendance/useGasPrayerConfig";
import { PrayerTypeV2, useGasPrayerAttendanceV2 } from "@/hooks/gas/attendance/useGasPrayerAttendanceV2";
import { PrayerV2RecapPanel } from "./PrayerV2RecapPanel";

interface GasPrayerV2ReportPanelProps {
  schoolId: string;
  initialPrayerType?: PrayerTypeId;
}

const toPrayerTypeV2 = (value: PrayerTypeId): PrayerTypeV2 => (value === "JUMAT" ? "JUMAT" : "DHUHA");

export default function GasPrayerV2ReportPanel({ schoolId, initialPrayerType }: GasPrayerV2ReportPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedPrayerType, setSelectedPrayerType] = useState<PrayerTypeId>(initialPrayerType ?? "DHUHA");

  const { prayerTypes, schedules, overrides, loading: configLoading } = useGasPrayerConfig(schoolId);
  const effectivePrayerType = useMemo(() => toPrayerTypeV2(selectedPrayerType), [selectedPrayerType]);
  const { classes, students, logs, loading, refresh } = useGasPrayerAttendanceV2(
    schoolId,
    selectedMonth,
    selectedYear,
    effectivePrayerType
  );
  const { RefreshCw, Loader2 } = require("lucide-react");

  const titleLabel = selectedPrayerType === "JUMAT" ? "Jumat" : "Dhuha";
  const subtitle =
    selectedPrayerType === "JUMAT"
      ? "Monitoring presensi sholat Jumat (putra Muslim) berdasarkan jadwal per kelas + override tanggal"
      : "Monitoring presensi sholat Dhuha berdasarkan jadwal per kelas + override tanggal";

  return (
    <div className="space-y-6 flex-1 overflow-y-auto p-6">
      <div className="glass-effect-dark-card rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100">Rekap {titleLabel}</h2>
          <p className="text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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

      <PrayerV2RecapPanel
        classes={classes}
        students={students}
        logs={logs}
        prayerTypes={prayerTypes}
        schedules={schedules}
        overrides={overrides}
        configLoading={configLoading}
        selectedPrayerType={selectedPrayerType}
        setSelectedPrayerType={setSelectedPrayerType}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedClassName={selectedClassName}
        setSelectedClassName={setSelectedClassName}
      />
    </div>
  );
}
