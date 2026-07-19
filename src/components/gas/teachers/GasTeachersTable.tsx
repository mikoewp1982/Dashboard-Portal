"use client";

import { Pencil, Trash2 } from "lucide-react";
import { GasRecord } from "../shared/gasConfig";

type GasTeachersTableProps = {
  rows: GasRecord[];
  loading: boolean;
};

export function GasTeachersTable({ rows, loading }: GasTeachersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Guru</th>
              <th className="px-4 py-3 font-semibold">NUPTK</th>
              <th className="px-4 py-3 font-semibold">Kelas</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Memuat data guru operasional GAS...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Belum ada data guru aktif yang terbaca dari DATABASE.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10 text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{row.name || "-"}</td>
                  <td className="px-4 py-3">{row.nuptk || "-"}</td>
                  <td className="px-4 py-3">{row.class || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {row.status || "Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-500"
                        title="Fase 1 hanya baca"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-500"
                        title="Fase 1 hanya baca"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
