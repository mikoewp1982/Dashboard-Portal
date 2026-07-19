"use client";

import { GasRecord } from "../shared/gasConfig";

type GasStudentsTableProps = {
  rows: GasRecord[];
  loading: boolean;
};

export function GasStudentsTable({ rows, loading }: GasStudentsTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#081634]/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/5 bg-transparent text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">NISN</th>
              <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
              <th className="px-6 py-4 font-semibold">L/P</th>
              <th className="px-6 py-4 font-semibold">Kelas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  Memuat data siswa operasional GAS...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  Belum ada data siswa aktif yang terbaca dari DATABASE.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/5 text-slate-200">
                  <td className="px-6 py-5 font-semibold text-slate-300">{row.nisn || "-"}</td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-white">{row.name || "-"}</div>
                    <div className="text-xs text-slate-500">-</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-blue-600/30 px-2.5 py-1 text-xs font-bold text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.25)]">
                      {row.gender || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]">
                      {row.class || "-"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
