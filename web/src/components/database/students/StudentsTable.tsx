"use client";

import { Users, RefreshCw } from "lucide-react";
import { DatabaseRecord } from "@/components/database/shared/databaseConfig";

type StudentsTableProps = {
  rows: DatabaseRecord[];
  loading: boolean;
  onEdit: (row: DatabaseRecord) => void;
  onDelete: (id: string) => void;
  onResetDevice?: (row: DatabaseRecord) => void;
};

export function StudentsTable({ rows, loading, onEdit, onDelete, onResetDevice }: StudentsTableProps) {
  const formatTime = (ts?: number) => {
    if (!ts || ts <= 0) return null;
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold">NISN / PASSWORD LOGIN</th>
              <th className="px-6 py-4 font-semibold">NAMA SISWA / USERNAME LOGIN</th>
              <th className="px-6 py-4 font-semibold">L/P</th>
              <th className="px-6 py-4 font-semibold">AGAMA</th>
              <th className="px-6 py-4 font-semibold">KELAS</th>
              <th className="px-6 py-4 font-semibold">KONEKSI APLIKASI</th>
              <th className="px-6 py-4 font-semibold">DEVICE HASH</th>
              <th className="px-6 py-4 text-right font-semibold">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                  <p className="font-medium text-slate-400">Belum ada data Siswa</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const deviceHash = row.deviceId || row.device_uuid || row.device || "";
                const gasTime = formatTime(row.lastLoginAt);
                const eduTime = formatTime(row.lastLoginEduLock);
                const hasDevice = Boolean(deviceHash);

                return (
                  <tr key={row.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-300">{row.nisn || row.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.name || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.gender || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.religion || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.class || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sky-400">📱 GAS:</span>
                          {row.lastLoginAt ? (
                            <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 font-medium border border-emerald-500/20">
                              🟢 Aktif {gasTime ? `(${gasTime})` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">⚪ Belum Login</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-400">🔒 EduLock:</span>
                          {row.lastLoginEduLock || row.isRegistered ? (
                            <span className="inline-flex items-center rounded bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300 font-medium border border-indigo-500/20">
                              🟢 Terhubung {eduTime ? `(${eduTime})` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">⚪ Belum Terhubung</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[160px] truncate" title={deviceHash}>
                      {hasDevice ? (
                        <div>
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-500/20 font-medium">
                            Terikat
                          </span>
                          <div className="mt-1 truncate text-[10px] text-slate-400 font-mono">{deviceHash}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 border border-amber-500/20 italic">
                          Belum Binding
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onResetDevice && (
                          <button
                            onClick={() => onResetDevice(row)}
                            disabled={!hasDevice}
                            title="Reset Device Binding (Satu Pintu untuk GAS & EduLock)"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset Device</span>
                          </button>
                        )}
                        <button onClick={() => onEdit(row)} className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-blue-400">
                          Edit
                        </button>
                        <button onClick={() => onDelete(row.id)} className="rounded bg-white/5 px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-red-400">
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
          Menampilkan {rows.length} data siswa
        </div>
      )}
    </div>
  );
}
