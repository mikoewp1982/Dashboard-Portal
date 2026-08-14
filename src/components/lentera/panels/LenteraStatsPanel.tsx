"use client";

import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";
import { useAuthStore } from "@/store/useAuthStore";

export function LenteraStatsPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { borrowRecords, literacyLogs, loading } = useGasLibrary(schoolId, "");

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat statistik...</div>;
  }

  const totalLoans = borrowRecords.length;
  const totalReports = literacyLogs.length;
  const activeLoans = borrowRecords.filter(r => r.status === 'BORROWED').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Statistik Siswa</h2>
        <p className="text-sm text-slate-400 mt-1">
          Ringkasan aktivitas literasi dan peminjaman buku oleh siswa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 shadow-sm">
           <h4 className="text-slate-400 text-sm font-medium">Total Peminjaman Buku</h4>
           <p className="text-3xl font-bold text-slate-100 mt-2">{totalLoans}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 shadow-sm">
           <h4 className="text-slate-400 text-sm font-medium">Total Laporan Literasi</h4>
           <p className="text-3xl font-bold text-slate-100 mt-2">{totalReports}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 shadow-sm">
           <h4 className="text-slate-400 text-sm font-medium">Sedang Dipinjam</h4>
           <p className="text-3xl font-bold text-blue-400 mt-2">{activeLoans}</p>
        </div>
      </div>
    </div>
  );
}
