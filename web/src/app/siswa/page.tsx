"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { StudentFeatureCard } from "@/components/siswa/StudentFeatureCard";
import {
  CheckCircle2,
  BookOpen,
  Dog,
  Bell,
  Shield,
  Phone,
  Wrench,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";

// Custom SVG icon components to match APK's mosque icons
function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3c-1.5 2-3 3.5-3 5.5a3 3 0 0 0 6 0C15 6.5 13.5 5 12 3Z" />
      <path d="M4 21V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" />
      <path d="M3 21h18" />
      <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      <path d="M4 12l1-3h14l1 3" />
    </svg>
  );
}

function DhuhaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3c-1.5 2-3 3.5-3 5.5a3 3 0 0 0 6 0C15 6.5 13.5 5 12 3Z" />
      <path d="M4 21V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" />
      <path d="M3 21h18" />
      <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      <circle cx="19" cy="5" r="2" />
      <path d="M19 2v1M19 8v-1M22 5h-1M17 5h-1M21.1 3l-.7.7M17.6 6.4l-.7.7M21.1 7l-.7-.7M17.6 3.6l-.7-.7" />
    </svg>
  );
}

export default function SiswaHomePage() {
  const user = useAuthStore((state) => state.user);

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
              priority
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 mt-4">
        <h3 className="mb-4 text-[11px] font-bold tracking-widest text-indigo-200/80 uppercase">
          MENU UTAMA
        </h3>

        {/* 4 Kolom Grid — persis seperti APK GAS Siswa */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-5">
          {/* 1. Absensi */}
          <StudentFeatureCard
            title="Absensi"
            href="/siswa/absen"
            icon={<CheckCircle2 className="h-9 w-9 text-sky-400" strokeWidth={1.5} />}
          />
          {/* 2. Presensi Sholat */}
          <StudentFeatureCard
            title="Presensi Sholat"
            href="/siswa/sholat"
            icon={<MosqueIcon className="h-9 w-9 text-teal-400" />}
          />
          {/* 3. Presensi Dhuha & Jum'at */}
          <StudentFeatureCard
            title="Presensi Dhuha & Jum'at"
            href="/siswa/sholat-dhuha-jumat"
            icon={<DhuhaIcon className="h-9 w-9 text-teal-400" />}
          />
          {/* 4. Lentera Digital */}
          <StudentFeatureCard
            title="Lentera Digital"
            href="/siswa/lentera"
            icon={<BookOpen className="h-9 w-9 text-teal-400" strokeWidth={1.5} />}
          />
          {/* 5. 7 KAIH */}
          <StudentFeatureCard
            title="7 KAIH"
            href="/siswa/7kaih"
            icon={<ThumbsUp className="h-9 w-9 text-indigo-400" strokeWidth={1.5} />}
          />
          {/* 6. Virtual Pet */}
          <StudentFeatureCard
            title="Virtual Pet"
            href="/siswa/pet"
            icon={<Dog className="h-9 w-9 text-amber-400" strokeWidth={1.5} />}
          />
          {/* 7. Kedisiplinan */}
          <StudentFeatureCard
            title="Kedisiplinan"
            href="/siswa/kedisiplinan"
            icon={<Shield className="h-9 w-9 text-violet-400" strokeWidth={1.5} />}
          />
          {/* 8. Layanan Aduan */}
          <StudentFeatureCard
            title="Layanan Aduan"
            href="/siswa/aduan"
            icon={<Phone className="h-9 w-9 text-rose-400" strokeWidth={1.5} />}
          />
          {/* 9. Notifikasi */}
          <StudentFeatureCard
            title="Notifikasi"
            href="/siswa/notifikasi"
            icon={<Bell className="h-9 w-9 text-orange-400" strokeWidth={1.5} />}
          />
          {/* 10. Tools */}
          <StudentFeatureCard
            title="Tools"
            href="/siswa/tools"
            icon={<Wrench className="h-9 w-9 text-amber-400" strokeWidth={1.5} />}
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
