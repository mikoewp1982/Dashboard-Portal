"use client";

import { GasModuleHeader } from "./shared/GasModuleHeader";
import { getGasTabLabel, GasTab } from "./shared/gasConfig";

type GasComingSoonPanelProps = {
  activeTab: GasTab;
};

const descriptions: Record<GasTab, string> = {
  dashboard: "Ringkasan utama operasional GAS untuk admin sekolah.",
  students: "Daftar siswa operasional GAS.",
  teachers: "Daftar guru operasional GAS.",
  attendance: "Monitoring dan pengelolaan presensi harian sekolah.",
  "presensi-sholat": "Pengelolaan presensi sholat sekolah.",
  settings: "Pengaturan sistem untuk operasional GAS sekolah.",
  "attendance-report": "Rekap presensi bulanan, filter kelas, dan export.",
  discipline: "Pencatatan pelanggaran dan poin kedisiplinan siswa.",
  "prayer-monitoring": "Monitoring dan rekap sholat siswa.",
  "virtual-pet": "Gamifikasi perilaku siswa berbasis presensi dan disiplin.",
  library: "Inventaris dan aktivitas literasi sekolah.",
  "halo-spentgapa": "Kanal laporan internal sekolah dengan privasi ketat.",
  "seven-habits": "Input dan monitoring pembinaan karakter siswa.",
  notifications: "Broadcast notifikasi sekolah ke pengguna yang relevan.",
};

export function GasComingSoonPanel({ activeTab }: GasComingSoonPanelProps) {
  const title = getGasTabLabel(activeTab);

  return (
    <div className="flex flex-1 flex-col">
      <GasModuleHeader title={title} description={descriptions[activeTab]} lastSyncTime={new Date()} />

      <div className="flex-1 p-8">
        <div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-950/30 p-8">
          <div className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Fase Berikutnya
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">{title} sedang disiapkan secara modular</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Fondasi fase 1 sekarang difokuskan ke `Students` dan `Teachers` agar modul GAS tidak langsung tumbuh liar.
            Menu ini sudah dikunci di dokumen PRD dan akan dibangun bertahap sesuai dependensi yang kita sepakati.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-white">Prinsip 1</div>
              <div className="mt-2 text-sm text-slate-400">Tenant tetap terisolasi dengan `schoolId` sebagai pagar utama.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-white">Prinsip 2</div>
              <div className="mt-2 text-sm text-slate-400">Realtime hanya dipakai bila memang perlu live monitoring.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="text-sm font-semibold text-white">Prinsip 3</div>
              <div className="mt-2 text-sm text-slate-400">Aksi sensitif tetap harus melewati backend atau Cloud Function.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
