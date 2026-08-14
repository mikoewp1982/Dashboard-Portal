"use client";

import { Users, RefreshCw } from "lucide-react";
import { DatabaseRecord } from "@/components/database/shared/databaseConfig";

type TeachersTableProps = {
  rows: DatabaseRecord[];
  loading: boolean;
  onEdit: (row: DatabaseRecord) => void;
  onDelete: (id: string) => void;
  onResetDevice: (row: DatabaseRecord) => void;
};

export function TeachersTable({ rows, loading, onEdit, onDelete, onResetDevice }: TeachersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold">NAMA LENGKAP</th>
              <th className="px-6 py-4 font-semibold">NUPTK / PASSWORD LOGIN</th>
              <th className="px-6 py-4 font-semibold">KELAS</th>
              <th className="px-6 py-4 font-semibold">DEVICE</th>
              <th className="px-6 py-4 font-semibold">STATUS</th>
              <th className="px-6 py-4 text-right font-semibold">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                  <p className="font-medium text-slate-400">Belum ada data Guru/Wali Kelas</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const deviceHash = String(row.deviceId || row.device_uuid || row.device || "").trim();
                const hasDevice = Boolean(deviceHash);

                return (
                  <tr key={row.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">{row.name || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-300">{row.nuptk || row.id}</td>
                    <td className="px-6 py-4 text-slate-300">{row.class || "-"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[160px] truncate" title={deviceHash || undefined}>
                      {hasDevice ? (
                        <div>
                          <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                            Terikat
                          </span>
                          <div className="mt-1 truncate text-[10px] font-mono text-slate-400">{deviceHash}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] italic text-amber-300">
                          Belum Binding
                        </span>
                      )}
                    </td>
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
                        <button
                          onClick={() => onResetDevice(row)}
                          disabled={!hasDevice}
                          title="Reset Device Binding agar guru bisa login di HP lain"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Reset Device</span>
                        </button>
                        <button
                          onClick={() => onEdit(row)}
                          className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row.id)}
                          className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-red-400"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && (
        <div className="border-t border-white/10 bg-slate-900/20 px-6 py-4 text-xs text-slate-500">
          Menampilkan {rows.length} data guru/wali kelas
        </div>
      )}
    </div>
  );
}
