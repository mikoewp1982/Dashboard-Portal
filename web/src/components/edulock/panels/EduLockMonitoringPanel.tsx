"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, Battery, Wifi, WifiOff, ShieldAlert, Trash2, Smartphone } from "lucide-react";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useEduLockOverview, type EduLockActiveDevice } from "@/hooks/edulock/useEduLockOverview";
import { useEduLockActiveSessions } from "@/hooks/edulock/useEduLockActiveSessions";

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

type EduLockClassRecord = {
  id?: string;
  name?: string;
  className?: string;
};

export function EduLockMonitoringPanel({ schoolId }: { schoolId: string }) {
  const [monitoringClassFilterKey, setMonitoringClassFilterKey] = useState("all");
  const [nowTs, setNowTs] = useState(() => Date.now());
  const { data: classesData, loading: classesLoading } = useClassesRealtime(schoolId);
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);
  const { overview, loading: overviewLoading, refresh } = useEduLockOverview(schoolId);
  const { sessions: activeSessions, loading: sessionsLoading, revoking, revokeSession, revokeAllSessions } = useEduLockActiveSessions(schoolId);

  const loading = classesLoading || studentsLoading || overviewLoading;

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const classCatalogComputed = (classesData as EduLockClassRecord[]).map((c) => ({
    key: String(c.className || c.name || c.id || ""),
    name: String(c.className || c.name || c.id || ""),
  }));

  const runtimeByDeviceId = useMemo(() => {
    const map = new Map<string, EduLockActiveDevice>();
    overview.activeDevices.forEach((device) => {
      if (device.deviceId) {
        map.set(device.deviceId, device);
      }
    });
    return map;
  }, [overview.activeDevices]);

  const runtimeByIdentity = useMemo(() => {
    const map = new Map<string, EduLockActiveDevice>();
    overview.activeDevices.forEach((device) => {
      [device.studentId, device.nisn, device.username]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .forEach((key) => map.set(key, device));
    });
    return map;
  }, [overview.activeDevices]);

  const monitoringStudents = useMemo(
    () =>
      (studentsData as EduLockStudentRecord[])
        .filter((student) => student.name && student.name.trim() !== "")
        .map((student) => {
        const studentKey = String(student.id || "").trim();
        const nisn = String(student.nisn || "").trim();
        const username = String(student.username || "").trim();
        const deviceId = String(student.deviceId || student.device || "").trim();
        const runtime =
          (deviceId ? runtimeByDeviceId.get(deviceId) : undefined) ||
          runtimeByIdentity.get(studentKey) ||
          runtimeByIdentity.get(nisn) ||
          runtimeByIdentity.get(username);

        const status = runtime?.isOnline
          ? "ONLINE"
          : deviceId
            ? "TERIKAT"
            : "BELUM BINDING";
        const trustScore =
          runtime?.trustScore ??
          (runtime?.isOutOfZone ? 35 : runtime ? 90 : deviceId ? 45 : 0);

        return {
          id: studentKey || nisn || username,
          nisn: nisn || "-",
          name: String(student.name || "-"),
          class: String(student.className || student.class || "-"),
          classKey: String(student.className || student.class || ""),
          status,
          battery: runtime?.battery ?? null,
          trustScore,
          lastUpdated: runtime?.lastSeenAt ?? null,
          isOutOfZone: runtime?.isOutOfZone ?? false,
          hasBinding: Boolean(deviceId),
        };
      }),
    [studentsData, runtimeByDeviceId, runtimeByIdentity]
  );

  return (
    <>
      {/* SISI SAMA SISWA AKTIF MENGGUNAKAN HP (IZIN GURU) */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 overflow-hidden backdrop-blur-xl shadow-xl mb-6">
        <div className="px-6 py-4 border-b border-emerald-500/20 flex flex-wrap justify-between items-center bg-emerald-500/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Siswa Ber-Izin Aktif Menggunakan HP
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  {activeSessions.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Daftar siswa yang saat ini sedang diberi izin memakai HP (bebas terkunci). Anda dapat mencabut izin kapan saja.
              </p>
            </div>
          </div>

          {activeSessions.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin mencabut seluruh izin penggunaan HP untuk SEMUA SISWA saat ini?")) {
                  void revokeAllSessions();
                }
              }}
              disabled={revoking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-rose-900/30"
            >
              <Trash2 className="w-4 h-4" />
              Cabut Semua Izin ({activeSessions.length})
            </button>
          )}
        </div>

        <div className="p-6">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-emerald-400" />
              Memuat data izin aktif...
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 bg-white/5 rounded-xl border border-white/5">
              🟢 Tidak ada siswa yang sedang mengaktifkan izin HP saat ini. Semua HP siswa terkunci rapi.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <div key={session.nisn} className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-emerald-500/50 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-base">{session.name || "Siswa"}</h4>
                        <div className="text-xs text-emerald-400 font-medium">
                          {session.class || "Kelas -"} • <span className="font-mono text-slate-300">{session.nisn}</span>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 border border-emerald-500/30">
                        IZIN AKTIF
                      </span>
                    </div>

                    {session.deviceModel && (
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-500" />
                        Device: <span className="text-slate-300">{session.deviceModel}</span>
                      </div>
                    )}

                    {session.endTime && (
                      <div className="text-xs text-slate-300 mt-2 bg-slate-800/80 rounded-lg p-2 border border-white/5">
                        Selesai: <span className="font-bold text-amber-300">{new Date(session.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Cabut izin penggunaan HP untuk ${session.name || session.nisn}? HP siswa akan LANGSUNG TERKUNCI kembali.`)) {
                        void revokeSession(session.nisn);
                      }
                    }}
                    disabled={revoking}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white py-2 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    🔴 Cabut Izin HP Siswa Ini
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl mb-6">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="font-semibold text-white">Data Realtime Siswa</h3>
            <div className="text-xs text-slate-400 mt-1">
              Menampilkan: {monitoringClassFilterKey === "all" ? "Semua Kelas" : monitoringClassFilterKey} • Total: {monitoringStudents.length} siswa
            </div>
          </div>
          <button onClick={() => void refresh()} className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors">
            Refresh Snapshot
          </button>
        </div>
        
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-300 mb-1">Filter Kelas</label>
              <select
                value={monitoringClassFilterKey}
                onChange={(e) => setMonitoringClassFilterKey(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Kelas</option>
                {classCatalogComputed.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">Kelas mengikuti Database (GAS).</div>
            </div>
            
            <div className="w-full lg:col-span-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              Monitoring sekarang membaca binding siswa dari GAS dan heartbeat perangkat dari `active_devices` bila tersedia.
              Aksi cabut izin massal belum ditampilkan di sini karena backend mutasinya belum final.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Siswa</th>
                <th className="px-6 py-4 font-semibold">Status Monitoring</th>
                <th className="px-6 py-4 font-semibold">Lokasi</th>
                <th className="px-6 py-4 font-semibold">Trust Score</th>
                <th className="px-6 py-4 font-semibold">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat snapshot runtime EduLock...
                  </td>
                </tr>
              ) : monitoringStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan
                  </td>
                </tr>
              ) : (
                monitoringStudents
                  .filter((s) => monitoringClassFilterKey === "all" || s.classKey === monitoringClassFilterKey)
                  .map((student) => {
                  const isOnline = student.status === "ONLINE";
                  return (
                    <tr key={student.id || student.nisn} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {student.class} • <span className="font-mono">{student.nisn}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            student.status === "ONLINE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : student.status === "TERIKAT"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}>
                            {student.status}
                          </span>
                          {student.battery !== null && (
                            <span className="flex items-center text-xs text-slate-300 ml-2" title="Baterai">
                              <Battery className="w-3 h-3 mr-1 text-emerald-400" /> {student.battery}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.lastUpdated ? (
                          student.isOutOfZone ? (
                            <span className="inline-flex items-center text-xs font-semibold text-rose-400">
                              <MapPin className="w-3 h-3 mr-1" /> Luar Zona
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-400">
                              <MapPin className="w-3 h-3 mr-1" /> Zona Aman
                            </span>
                          )
                        ) : student.hasBinding ? (
                          <span className="text-xs text-amber-300">Menunggu Telemetry</span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[80px]">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${student.trustScore || 0}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-slate-300">{student.trustScore || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center text-xs text-slate-400">
                            {isOnline ? <Wifi className="w-3 h-3 mr-1 text-emerald-400" /> : <WifiOff className="w-3 h-3 mr-1" />}
                            <span>
                              {student.lastUpdated
                                ? `${Math.max(0, Math.round((nowTs - Number(student.lastUpdated)) / 1000 / 60))} min lalu`
                                : student.hasBinding
                                  ? "Belum ada heartbeat"
                                  : "Belum binding"}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
