"use client";

import { Users } from "lucide-react";
import { DatabaseRecord } from "@/components/database/shared/databaseConfig";

type ClassesTableProps = {
  rows: DatabaseRecord[];
  loading: boolean;
  onEdit: (row: DatabaseRecord) => void;
  onDelete: (id: string) => void;
};

export function ClassesTable({ rows, loading, onEdit, onDelete }: ClassesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold">NAMA KELAS</th>
              <th className="px-6 py-4 font-semibold">TINGKAT</th>
              <th className="px-6 py-4 font-semibold">STATUS</th>
              <th className="px-6 py-4 text-right font-semibold">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                  <p className="font-medium text-slate-400">Belum ada data Kelas Paralel</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{row.className || row.name || "-"}</td>
                  <td className="px-6 py-4 text-slate-300">{row.grade || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        row.status === "Nonaktif"
                          ? "bg-red-500/10 text-red-400 ring-red-500/20"
                          : "bg-green-500/10 text-green-400 ring-green-500/20"
                      }`}
                    >
                      {row.status || "Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(row)} className="text-slate-400 transition hover:text-blue-400">
                        Edit
                      </button>
                      <button onClick={() => onDelete(row.id)} className="text-slate-400 transition hover:text-red-400">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <div className="border-t border-white/10 bg-slate-900/20 px-6 py-4 text-xs text-slate-500">
          Menampilkan {rows.length} data kelas paralel
        </div>
      )}
    </div>
  );
}
