"use client";

import { MapPin, ShieldAlert, Smartphone, UserCheck, Wifi } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEduLockOverview } from "@/hooks/edulock/useEduLockOverview";

export function EduLockDashboardPanel({ schoolId }: { schoolId: string }) {
  const { user } = useAuthStore();
  const { overview, loading, refresh } = useEduLockOverview(schoolId);
  const adminDisplayName =
    user?.role === "super_admin"
      ? "Super Admin EduLock"
      : `Admin ${user?.schoolName || "Sekolah"}`;

  const cards = [
    {
      label: "Perangkat Aktif",
      value: overview.activeDevicesCount,
      description: "Heartbeat runtime dari active_devices",
      icon: Wifi,
      accent: "text-indigo-200",
    },
    {
      label: "Di Luar Zona",
      value: overview.outsideZoneCount,
      description: "Dari telemetry lokasi yang tersedia",
      icon: MapPin,
      accent: "text-rose-200",
    },
    {
      label: "Siswa Terikat",
      value: overview.boundStudentsCount,
      description: "Binding device pada data siswa GAS",
      icon: Smartphone,
      accent: "text-emerald-200",
    },
    {
      label: "Mirror Presensi",
      value: overview.latestMirrorCount,
      description: overview.latestMirrorDate ? `Tanggal ${overview.latestMirrorDate}` : "Belum ada mirror harian",
      icon: UserCheck,
      accent: "text-cyan-200",
    },
  ];

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/70 via-fuchsia-600/40 to-emerald-500/30 p-6 text-white">
        <div className="relative z-10">
          <h2 className="mb-2 text-2xl font-bold">Selamat Datang, {adminDisplayName}</h2>
          <p className="text-white/75">
            Dashboard ini sekarang membaca snapshot runtime EduLock yang memang tersedia: binding siswa, tenant registry,
            mirror presensi, dan heartbeat perangkat bila node `active_devices` sudah hidup.
          </p>
        </div>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-10">
          <ShieldAlert className="h-48 w-48" />
        </div>
      </div>



      {overview.activeDevicesCount === 0 && !loading && (
        <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-100">
          Belum ada heartbeat perangkat pada `active_devices`. Dashboard tetap hidup dari data nyata yang tersedia, tetapi
          status online, baterai, dan lokasi baru akan terisi setelah APK EduLock mengirim telemetry.
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-transform duration-200 hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{card.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${card.accent}`}>{loading ? "..." : card.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.description}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <Icon className={`h-6 w-6 ${card.accent}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Status Integrasi EduLock</h3>
            <button
              onClick={() => void refresh()}
              className="text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200"
            >
              Refresh Snapshot
            </button>
          </div>
          <div className="space-y-4 p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span>Strict Mode Tenant</span>
              <span className={overview.strictModeEnabled ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
                {overview.strictModeEnabled ? "Siap" : "Belum Aktif"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span>Heartbeat Terakhir</span>
              <span className="font-semibold text-slate-100">
                {overview.latestHeartbeatAt
                  ? new Date(overview.latestHeartbeatAt).toLocaleString("id-ID")
                  : "Belum ada"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span>Total Data Siswa</span>
              <span className="font-semibold text-slate-100">{overview.totalStudentsCount}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4">
            <h3 className="font-semibold text-white">Kondisi Operasional Saat Ini</h3>
          </div>
          <div className="space-y-4 p-6 text-sm text-slate-200">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
              `Reset Binding Device` sudah bisa dijalankan dari panel siswa dan menulis langsung ke data tenant.
            </div>
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sky-100">
              Dashboard dan monitoring tidak lagi memakai angka mock; nilai yang tampil sekarang berasal dari node yang memang tersedia.
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-amber-100">
              Kode izin cepat, audit log pelanggaran persisten, dan mutasi uninstall masih menunggu backend EduLock final.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
