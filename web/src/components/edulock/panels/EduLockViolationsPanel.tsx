"use client";

import { useMemo } from "react";
import { ShieldAlert, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useEduLockOverview } from "@/hooks/edulock/useEduLockOverview";

type EduLockStudentRecord = {
  id?: string;
  nisn?: string;
  name?: string;
  class?: string;
  className?: string;
  username?: string;
  device?: string;
  deviceId?: string;
};

export function EduLockViolationsPanel({ schoolId }: { schoolId: string }) {
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);
  const { overview, loading: overviewLoading, refresh } = useEduLockOverview(schoolId);

  const loading = studentsLoading || overviewLoading;

  const alerts = useMemo(
    () =>
      overview.activeDevices.flatMap((device) => {
        const student = (studentsData as EduLockStudentRecord[]).find((item) => {
          return (
            String(item.deviceId || item.device || "").trim() === device.deviceId ||
            String(item.id || "").trim() === device.studentId ||
            String(item.nisn || "").trim() === device.nisn ||
            String(item.username || "").trim() === device.username
          );
        });

        const baseAlert = {
          id: `${device.deviceId}-${device.rawStatus || "runtime"}`,
          timestamp: device.lastSeenAt,
          nisn: device.nisn || String(student?.nisn || ""),
          studentName: device.name || String(student?.name || "-"),
          studentClass: String(student?.className || student?.class || "-"),
          latitude: device.latitude,
          longitude: device.longitude,
        };

        const items = [];
        if (device.isOutOfZone) {
          items.push({
            ...baseAlert,
            id: `${baseAlert.id}-out-of-zone`,
            type: "OUT_OF_ZONE",
            description: "Perangkat aktif terdeteksi di luar zona aman sekolah.",
          });
        }
        if (device.isEmergencyUnlock) {
          items.push({
            ...baseAlert,
            id: `${baseAlert.id}-emergency`,
            type: "EMERGENCY_UNLOCK",
            description: "Emergency unlock aktif pada perangkat siswa.",
          });
        }
        if (device.isUninstallBypass) {
          items.push({
            ...baseAlert,
            id: `${baseAlert.id}-uninstall`,
            type: "UNINSTALL_BYPASS",
            description: "Bypass uninstall sedang aktif pada perangkat siswa.",
          });
        }
        return items;
      }),
    [overview.activeDevices, studentsData]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100 shadow-inner">
        Panel ini sekarang membaca <strong>alert runtime</strong> dari telemetry EduLock yang benar-benar aktif. Riwayat audit
        persisten jangka panjang belum tersedia karena backend log pelanggaran tenant belum dibuat.
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-semibold text-white flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-indigo-400" />
            Alert Runtime EduLock
          </h3>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th className="px-6 py-3">Waktu</th>
                <th className="px-6 py-3">Siswa</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat alert runtime EduLock...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada alert runtime aktif. Jika telemetry perangkat belum hidup, tabel ini memang masih kosong.
                  </td>
                </tr>
              ) : (
                alerts.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID", {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
                        }) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{log.studentName}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {log.studentClass} <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px] ml-1">{log.nisn || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                          log.type === "EMERGENCY_UNLOCK" 
                            ? "border-rose-500/30 bg-rose-500/15 text-rose-300" 
                            : log.type === "UNINSTALL_BYPASS" 
                              ? "border-amber-500/30 bg-amber-500/15 text-amber-300" 
                              : "border-orange-500/30 bg-orange-500/15 text-orange-300"
                        }`}>
                          {String(log.type || "-")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{String(log.description || "-")}</td>
                      <td className="px-6 py-4">
                        {log.latitude && log.longitude ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Peta
                          </a>
                        ) : (
                          <span className="text-slate-500 text-sm italic bg-white/5 px-2 py-1 rounded">Tidak ada GPS</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
