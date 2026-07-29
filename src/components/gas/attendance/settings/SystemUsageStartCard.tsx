"use client";

import { CalendarRange, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface Props {
  startDate: string;
  saveStartDate: (startDate: string) => Promise<void>;
}

function parseStartDate(value: string) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

export function SystemUsageStartCard({ startDate, saveStartDate }: Props) {
  const parsed = useMemo(() => parseStartDate(startDate), [startDate]);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedMonth(parsed.month);
    setSelectedYear(parsed.year);
  }, [parsed.month, parsed.year]);

  const formattedStartDate = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  }, [selectedMonth, selectedYear]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveStartDate(formattedStartDate);
      alert("Tanggal mulai penggunaan sistem berhasil disimpan.");
    } catch (error) {
      console.error("Failed to save system usage start date", error);
      alert("Gagal menyimpan tanggal mulai penggunaan sistem.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-900/50 p-6 shadow border border-slate-700/60 text-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-100">Mulai Penggunaan Sistem</h3>
          <p className="mt-1 text-sm text-slate-400">
            Rekap kehadiran dan sholat hanya akan dihitung mulai bulan dan tahun yang dipilih.
          </p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
          <CalendarRange className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300">Bulan Mulai</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 p-2 text-sm text-slate-100 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Tahun Mulai</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 p-2 text-sm text-slate-100 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 2040 - 2024 + 1 }, (_, index) => 2024 + index).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        Tanggal efektif yang disimpan: <span className="font-semibold text-slate-100">{formattedStartDate}</span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Menyimpan..." : "Simpan Tanggal Mulai"}
        </button>
      </div>
    </div>
  );
}
