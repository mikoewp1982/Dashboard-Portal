"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { StudentFeatureCard } from "@/components/siswa/StudentFeatureCard";
import {
  BookOpen,
  CalendarClock,
  Dog,
  Bell,
  Wallet,
  Settings,
  HelpCircle,
  Trophy
} from "lucide-react";
import Image from "next/image";

export default function SiswaHomePage() {
  const user = useAuthStore((state) => state.user);

  // Jika nama siswa punya beberapa kata, ambil nama panggilannya (kata pertama)
  const firstName = user?.name?.split(" ")[0] || "Siswa";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 to-indigo-800 pb-24 text-white">
      {/* Header Section */}
      <div className="relative px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-indigo-200">Halo, selamat datang!</h2>
            <h1 className="text-2xl font-bold mt-1 line-clamp-1">{firstName}</h1>
            <p className="text-xs text-indigo-300 mt-1">{user?.schoolName || "Sekolah"}</p>
          </div>
          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-indigo-400/30 bg-slate-800">
            <Image
              src="/tutorial/gas-siswa/logo-aplikasi.png"
              alt="Avatar"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 mt-4">
        <h3 className="mb-4 text-[11px] font-bold tracking-widest text-indigo-200/80 uppercase">
          MENU UTAMA
        </h3>

        {/* 4 Kolom Grid */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-5">
          <StudentFeatureCard
            title="Presensi Sholat"
            href="/siswa/sholat"
            icon={<CalendarClock className="h-9 w-9 text-emerald-400" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Lentera Digital"
            href="/siswa/lentera"
            icon={<BookOpen className="h-9 w-9 text-amber-400" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Virtual Pet"
            href="/siswa/pet"
            icon={<Dog className="h-9 w-9 text-orange-400" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Pengumuman"
            href="/siswa/pengumuman"
            icon={<Bell className="h-9 w-9 text-sky-400" strokeWidth={1.5} />}
            badgeCount={2}
          />
          <StudentFeatureCard
            title="Tabungan"
            href="/siswa/tabungan"
            disabled
            icon={<Wallet className="h-9 w-9 text-slate-300" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Prestasi"
            href="/siswa/prestasi"
            disabled
            icon={<Trophy className="h-9 w-9 text-slate-300" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Pengaturan"
            href="/siswa/profil"
            icon={<Settings className="h-9 w-9 text-slate-300" strokeWidth={1.5} />}
          />
          <StudentFeatureCard
            title="Bantuan"
            href="/siswa/bantuan"
            icon={<HelpCircle className="h-9 w-9 text-slate-300" strokeWidth={1.5} />}
          />
        </div>
      </div>
      
      {/* Info Card */}
      <div className="px-5 mt-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h4 className="text-sm font-semibold text-white">Versi Web (iOS)</h4>
          <p className="mt-1 text-xs leading-relaxed text-indigo-200">
            Anda menggunakan portal web khusus karena perangkat Anda belum mendukung aplikasi Android EduLock. Silakan gunakan tombol Absen di tengah bawah untuk kehadiran harian.
          </p>
        </div>
      </div>
    </div>
  );
}
