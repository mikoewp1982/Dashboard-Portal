"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, Battery, Wifi, WifiOff, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
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
  const [pendingFindDeviceId, setPendingFindDeviceId] = useState("");
  const { data: classesData, loading: classesLoading } = useClassesRealtime(schoolId);
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);
  const { overview, loading: overviewLoading, refresh, findDevice } = useEduLockOverview(schoolId);

  const loading = classesLoading || studentsLoading || overviewLoading;
  const latestMasterSwitchCommand = overview.latestMasterSwitchCommand;
  const latestFindDeviceCommand = overview.latestFindDeviceCommand;

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
            ? "OFFLINE"
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
          deviceId,
          status,
          battery: runtime?.battery ?? null,
          trustScore,
          lastUpdated: runtime?.lastSeenAt ?? null,
          isOutOfZone: runtime?.isOutOfZone ?? false,
          hasBinding: Boolean(deviceId),
          hasFcmToken: runtime?.hasFcmToken ?? false,
          masterSwitchAcked:
            Boolean(latestMasterSwitchCommand?.commandId) &&
            runtime?.lastMasterSwitchCommandId === latestMasterSwitchCommand?.commandId &&
            runtime?.lastMasterSwitchAppliedState === latestMasterSwitchCommand?.requestedState,
          masterSwitchAckAt: runtime?.lastMasterSwitchAppliedAt ?? null,
          masterSwitchAckSource: runtime?.lastMasterSwitchAckSource ?? "",
          findDeviceCommandId: runtime?.lastFindDeviceCommandId ?? "",
          findDeviceAckAt: runtime?.lastFindDeviceAckAt ?? null,
          findDeviceAckSource: runtime?.lastFindDeviceAckSource ?? "",
          findDeviceStatus: runtime?.lastFindDeviceStatus ?? "",
          findDeviceAlarmUntil: runtime?.lastFindDeviceAlarmUntil ?? null,
          complianceStatus: String(runtime?.complianceStatus || "").toUpperCase(),
          protectionHealth: String(runtime?.protectionHealth || "").toUpperCase(),
          isAccessibilityEnabled: runtime?.isAccessibilityEnabled ?? null,
          isDeviceAdminEnabled: runtime?.isDeviceAdminEnabled ?? null,
          lastProtectionCheckAt: runtime?.lastProtectionCheckAt ?? null,
        };
      }),
    [studentsData, runtimeByDeviceId, runtimeByIdentity, latestMasterSwitchCommand]
  );

  const duplicateBindingMap = useMemo(() => {
    const deviceToStudents = new Map<string, string[]>();

    monitoringStudents.forEach((student) => {
      const key = String(student.deviceId || "").trim();
      if (!key) return;
      const current = deviceToStudents.get(key) || [];
      current.push(student.name);
      deviceToStudents.set(key, current);
    });

    return new Map(
      Array.from(deviceToStudents.entries()).filter(([, studentNames]) => studentNames.length > 1)
    );
  }, [monitoringStudents]);

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
              Monitoring membaca binding siswa dari GAS dan heartbeat perangkat dari `active_devices`, lalu refresh otomatis tiap 5 detik agar status HP siswa lebih cepat terlihat.
            </div>
          </div>
          {latestMasterSwitchCommand && (
            <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
              <div className="font-semibold text-white">
                Command Master Switch Terakhir: {latestMasterSwitchCommand.requestedState ? "ON" : "OFF"}
              </div>
              <div className="mt-1 text-xs text-indigo-100/90">
                {latestMasterSwitchCommand.requestedAt
                  ? `Dikirim ${new Date(latestMasterSwitchCommand.requestedAt).toLocaleString("id-ID")}`
                  : "Waktu kirim tidak tersedia"}
                {" • "}ACK {latestMasterSwitchCommand.ackedDeviceCount}/{latestMasterSwitchCommand.targetedDeviceCount}
                {" • "}FCM sukses {latestMasterSwitchCommand.fcmSuccessCount}/{latestMasterSwitchCommand.targetedTokenCount}
                {latestMasterSwitchCommand.pendingDeviceCount > 0
                  ? ` • Pending ${latestMasterSwitchCommand.pendingDeviceCount}`
                  : " • Semua device tertarget sudah ACK"}
              </div>
              <div className="mt-2 text-[11px] text-indigo-100/70">
                Ringkasan ACK/Pending dihitung per-device yang menerima command, bukan per-jumlah baris siswa.
              </div>
            </div>
          )}
          {latestFindDeviceCommand && (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <div className="font-semibold text-white">
                Temukan Perangkat Terakhir: {latestFindDeviceCommand.targetStudentName || latestFindDeviceCommand.targetNisn || latestFindDeviceCommand.targetDeviceId}
              </div>
              <div className="mt-1 text-xs text-rose-100/90">
                {latestFindDeviceCommand.requestedAt
                  ? `Dikirim ${new Date(latestFindDeviceCommand.requestedAt).toLocaleString("id-ID")}`
                  : "Waktu kirim tidak tersedia"}
                {" • "}Durasi {Math.round(latestFindDeviceCommand.durationMs / 1000)} detik
                {" • "}ACK {latestFindDeviceCommand.ackedDeviceCount}/{latestFindDeviceCommand.targetedDeviceCount}
                {" • "}FCM sukses {latestFindDeviceCommand.fcmSuccessCount}/{latestFindDeviceCommand.targetedTokenCount}
                {latestFindDeviceCommand.pendingDeviceCount > 0 ? ` • Pending ${latestFindDeviceCommand.pendingDeviceCount}` : " • Device target sudah merespons"}
              </div>
            </div>
          )}
          {duplicateBindingMap.size > 0 && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <div className="font-semibold text-white">Peringatan Konflik Binding</div>
              <div className="mt-1 text-xs text-amber-100/90">
                Terdeteksi {duplicateBindingMap.size} device yang terhubung ke lebih dari satu baris siswa. Tabel siswa bisa tampak ganda, tetapi command ACK tetap dihitung per-device.
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Siswa</th>
                <th className="px-6 py-4 font-semibold">Status Monitoring</th>
                <th className="px-6 py-4 font-semibold">Proteksi EduLock</th>
                <th className="px-6 py-4 font-semibold">Lokasi</th>
                <th className="px-6 py-4 font-semibold">Trust Score</th>
                <th className="px-6 py-4 font-semibold">Last Update</th>
                <th className="px-6 py-4 font-semibold">Command ACK</th>
                <th className="px-6 py-4 font-semibold">Temukan HP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat snapshot runtime EduLock...
                  </td>
                </tr>
              ) : monitoringStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan
                  </td>
                </tr>
              ) : (
                monitoringStudents
                  .filter((s) => monitoringClassFilterKey === "all" || s.classKey === monitoringClassFilterKey)
                  .map((student) => {
                  const isOnline = student.status === "ONLINE";
                  const duplicateBindingStudents = duplicateBindingMap.get(String(student.deviceId || "").trim()) || [];
                  const hasBindingConflict = duplicateBindingStudents.length > 1;
                  const isFindDeviceTarget =
                    Boolean(latestFindDeviceCommand?.commandId) &&
                    latestFindDeviceCommand?.targetDeviceId === student.deviceId;
                  const findDeviceAcked =
                    isFindDeviceTarget &&
                    student.findDeviceCommandId === latestFindDeviceCommand?.commandId &&
                    student.findDeviceStatus.trim() !== "";
                  const canTriggerFindDevice =
                    Boolean(student.deviceId) &&
                    student.hasFcmToken &&
                    isOnline;
                  return (
                    <tr key={student.id || student.nisn} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {student.class} • <span className="font-mono">{student.nisn}</span>
                        </div>
                        {hasBindingConflict && (
                          <div className="mt-2 text-[11px] font-medium text-amber-300">
                            Konflik binding: device ini juga dipakai {duplicateBindingStudents.length - 1} siswa lain
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            student.status === "ONLINE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : student.status === "OFFLINE"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
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
                        {student.complianceStatus === "NON_COMPLIANT" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300">
                              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                              MERAH — PROTEKSI MATI
                            </span>
                            <div className="text-xs text-rose-300">
                              {student.protectionHealth === "ACCESSIBILITY_OFF"
                                ? "Accessibility OFF"
                                : student.protectionHealth === "DEVICE_ADMIN_OFF"
                                  ? "Device Admin OFF"
                                  : "Proteksi tidak sehat"}
                            </div>
                          </div>
                        ) : student.complianceStatus === "COMPLIANT" ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Proteksi Aktif
                          </span>
                        ) : student.complianceStatus === "PAUSED" ? (
                          <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                            <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                            Dijeda Admin
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Belum ada telemetry proteksi</span>
                        )}
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
                      <td className="px-6 py-4">
                        {!latestMasterSwitchCommand ? (
                          <span className="text-xs text-slate-500">Belum ada command</span>
                        ) : !student.hasFcmToken ? (
                          <span className="text-xs text-amber-300">Token FCM belum sinkron</span>
                        ) : hasBindingConflict && student.masterSwitchAcked ? (
                          <div className="text-xs text-amber-300 font-medium">
                            ACK device bersama
                            <div className="text-slate-400 font-normal">
                              Command dihitung 1 device untuk {duplicateBindingStudents.length} baris siswa
                            </div>
                          </div>
                        ) : hasBindingConflict ? (
                          <div className="text-xs text-amber-300 font-medium">
                            Pending pada device bersama
                            <div className="text-slate-400 font-normal">
                              Command dihitung 1 device untuk {duplicateBindingStudents.length} baris siswa
                            </div>
                          </div>
                        ) : student.masterSwitchAcked ? (
                          <div className="text-xs text-emerald-400 font-medium">
                            ACK via {student.masterSwitchAckSource || "runtime"}
                            <div className="text-slate-400 font-normal">
                              {student.masterSwitchAckAt
                                ? new Date(student.masterSwitchAckAt).toLocaleTimeString("id-ID")
                                : "Waktu ACK tidak tersedia"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-300">Pending ACK</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={!canTriggerFindDevice || pendingFindDeviceId === student.deviceId}
                            onClick={async () => {
                              if (!student.deviceId) return;
                              setPendingFindDeviceId(student.deviceId);
                              try {
                                await findDevice(student.deviceId);
                              } finally {
                                setPendingFindDeviceId("");
                              }
                            }}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                              canTriggerFindDevice && pendingFindDeviceId !== student.deviceId
                                ? "bg-rose-500/20 text-rose-200 border border-rose-400/30 hover:bg-rose-500/30"
                                : "bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed"
                            }`}
                          >
                            {pendingFindDeviceId === student.deviceId ? "Mengirim..." : "Bunyikan HP"}
                          </button>
                          {!student.hasBinding ? (
                            <span className="text-xs text-slate-500">Belum binding</span>
                          ) : !student.hasFcmToken ? (
                            <span className="text-xs text-amber-300">FCM belum sinkron</span>
                          ) : !isOnline ? (
                            <span className="text-xs text-slate-500">Device offline</span>
                          ) : findDeviceAcked ? (
                            <div className="text-xs text-rose-300">
                              {student.findDeviceStatus === "ALARM_STARTED"
                                ? "Alarm sedang dibunyikan"
                                : student.findDeviceStatus === "ALARM_FINISHED"
                                  ? "Alarm selesai diputar"
                                  : student.findDeviceStatus === "FAILED"
                                    ? "Device gagal memulai alarm"
                                    : `ACK ${student.findDeviceStatus || "diterima"}`}
                              <div className="text-slate-400">
                                {student.findDeviceAckAt
                                  ? new Date(student.findDeviceAckAt).toLocaleTimeString("id-ID")
                                  : "Waktu ACK tidak tersedia"}
                              </div>
                            </div>
                          ) : isFindDeviceTarget ? (
                            <span className="text-xs text-amber-300">Menunggu ACK alarm</span>
                          ) : (
                            <span className="text-xs text-slate-500">Siap dibunyikan</span>
                          )}
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
