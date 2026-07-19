"use client";

import { Lock, UserCog } from "lucide-react";
import { DatabaseTab } from "./databaseConfig";

type DatabaseBannerProps = {
  activeTab: DatabaseTab;
};

export function DatabaseBanner({ activeTab }: DatabaseBannerProps) {
  if (activeTab === "Siswa") {
    return (
      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-900/20 p-4">
        <p className="text-sm text-blue-200">
          Database {activeTab.toLowerCase()} ini adalah data induk akun {activeTab.toLowerCase()} milik sekolah.
          <br />
          <strong>Username: Nama (Sesuai Data) | Password Login: NISN/NIP</strong>
          <br />
          <span className="text-xs opacity-70">
            Data pada tab ini menjadi sumber akun induk untuk APK GAS dan APK EduLock. Perubahan data akan ikut
            terbaca realtime di dashboard admin sesuai modulnya.
          </span>
        </p>
      </div>
    );
  }

  if (activeTab === "Guru/Wali Kelas") {
    return (
      <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 text-blue-400">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-blue-100">Data Induk Login APK GAS Guru/Wali Kelas</div>
            <div className="mt-1 text-sm leading-relaxed text-blue-200/80">
              Menu DATABASE admin sekolah adalah induk akun guru/wali kelas untuk operasional sekolah. Data guru pada
              tab ini dipakai oleh <span className="font-semibold text-blue-100">APK GAS</span> dan tidak dipakai oleh
              APK EduLock. Username awal memakai <span className="font-semibold text-blue-100">Nama Guru/Wali Kelas</span>
              {" "}dan password login awal memakai <span className="font-semibold text-blue-100">NUPTK</span>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "Petugas OSIS") {
    return (
      <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-indigo-100">Data Induk Akses Petugas OSIS</div>
            <div className="mt-1 text-sm leading-relaxed text-indigo-200/80">
              Petugas OSIS tetap memakai akun induk siswa. Hak akses OSIS akan aktif jika NISN terdaftar sebagai
              {" "}<span className="font-semibold text-indigo-100">Petugas (OSIS)</span> saat modul APK terkait nanti
              dibangun.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
