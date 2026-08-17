"use client";

import Link from "next/link";
import { AttendanceSettingsPanel } from "../attendance/AttendanceSettingsPanel";

interface Props {
  schoolId: string;
}

/** Presensi Sholat: fokus pengaturan sistem (rekap/statistik di menu Rekap Sholat). */
export function GasPrayerPanel({ schoolId }: Props) {
  void schoolId;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Presensi Sholat</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pengaturan jadwal sholat, libur, lokasi musholla, serta Dhuha &amp; Jumat. Rekap &amp; statistik ada di menu{" "}
            <Link
              href="/dashboard/gas?tab=prayer-monitoring"
              className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
            >
              Rekap Sholat
            </Link>
            .
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 whitespace-nowrap"
        >
          Kembali ke Dashboard Satu Pintu
        </Link>
      </div>

      <AttendanceSettingsPanel mode="prayer" />
    </div>
  );
}
