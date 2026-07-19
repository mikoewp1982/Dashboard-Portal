"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, Battery, Wifi, WifiOff } from "lucide-react";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useEduLockOverview, type EduLockActiveDevice } from "@/hooks/edulock/useEduLockOverview";

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
