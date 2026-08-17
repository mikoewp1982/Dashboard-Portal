"use client";

import { Users, RefreshCw } from "lucide-react";
import { DatabaseRecord } from "@/components/database/shared/databaseConfig";

type StudentsTableProps = {
  rows: DatabaseRecord[];
  loading: boolean;
  onEdit: (row: DatabaseRecord) => void;
  onDelete: (id: string) => void;
  onResetGasDevice?: (row: DatabaseRecord) => void;
  onResetEduLockDevice?: (row: DatabaseRecord) => void;
};

export function StudentsTable({ rows, loading, onEdit, onDelete, onResetGasDevice, onResetEduLockDevice }: StudentsTableProps) {
  const formatTime = (ts?: number) => {
    if (!ts || ts <= 0) return null;
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityBadgeClass = (status?: DatabaseRecord["activityStatus"]) => {
    if (status === "ACTIVE_NOW") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    if (status === "ACTIVE_TODAY") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    if (status === "ACTIVE_7D") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    if (status === "INACTIVE") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    return "border-rose-500/30 bg-rose-500/10 text-rose-300";
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
              <th className="px-6 py-4 font-semibold">STATUS AKTIVITAS</th>
              <th className="px-6 py-4 font-semibold">KONEKSI APLIKASI</th>
              <th className="px-6 py-4 font-semibold">DEVICE GAS</th>
              <th className="px-6 py-4 font-semibold">DEVICE EDULOCK</th>
              <th className="px-6 py-4 text-right font-semibold">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                  <p className="font-medium text-slate-400">Belum ada data Siswa</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const gasDeviceHash = row.gasDeviceId || row.deviceId || row.device || "";
                const eduLockDeviceHash = row.edulockDeviceUuid || row.device_uuid || "";
                const gasTime = formatTime(row.lastLoginAt);
                const eduTime = formatTime(row.lastLoginEduLock);
                const hasGasDevice = Boolean(gasDeviceHash);
                const hasEduLockDevice = Boolean(eduLockDeviceHash);

                return (
                  <tr key={row.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-300">{row.nisn || row.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.name || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.gender || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.religion || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{row.class || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${getActivityBadgeClass(row.activityStatus)}`}>
                          {row.activityLabel || "Belum Ada Aktivitas"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {row.latestActivityAt ? `Terakhir aktif ${formatTime(row.latestActivityAt)}` : "Belum ada riwayat login"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sky-400">📱 GAS:</span>
                          {row.lastLoginAt ? (
                            <span className="inline-flex items-center rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-300 font-medium border border-sky-500/20">
                              Login terakhir {gasTime ? `(${gasTime})` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Belum pernah login GAS</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-400">🔒 EduLock:</span>
                          {row.hasActiveEduLockSession ? (
                            <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300 font-medium border border-emerald-500/20">
                              Sedang aktif realtime
                            </span>
                          ) : row.lastLoginEduLock ? (
                            <span className="inline-flex items-center rounded bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300 font-medium border border-indigo-500/20">
                              Terakhir aktif {eduTime ? `(${eduTime})` : ""}
                            </span>
                          ) : row.isRegistered ? (
                            <span className="inline-flex items-center rounded bg-indigo-500/10 px-1.5 py-0.5 text-indigo-200 font-medium border border-indigo-500/20">
                              Terhubung, belum ada aktivitas
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Belum terhubung EduLock</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[160px] truncate" title={gasDeviceHash}>
                      {hasGasDevice ? (
                        <div>
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-500/20 font-medium">
                            Terikat
                          </span>
                          <div className="mt-1 truncate text-[10px] text-slate-400 font-mono">{gasDeviceHash}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 border border-amber-500/20 italic">
                          Belum Binding
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[160px] truncate" title={eduLockDeviceHash}>
                      {hasEduLockDevice ? (
                        <div>
                          <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300 border border-indigo-500/20 font-medium">
                            Terikat
                          </span>
                          <div className="mt-1 truncate text-[10px] text-slate-400 font-mono">{eduLockDeviceHash}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 border border-amber-500/20 italic">
                          Belum Binding
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onResetGasDevice && (
                          <button
                            onClick={() => onResetGasDevice(row)}
                            disabled={!hasGasDevice}
                            title="Reset Device GAS"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset GAS</span>
                          </button>
                        )}
                        {onResetEduLockDevice && (
                          <button
                            onClick={() => onResetEduLockDevice(row)}
                            disabled={!hasEduLockDevice}
                            title="Reset Device EduLock"
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset EduLock</span>
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
