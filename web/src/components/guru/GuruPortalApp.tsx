"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Moon,
  ShieldAlert,
  Smartphone,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useTeacherNotificationInbox } from "@/hooks/guru/useTeacherNotificationInbox";
import { useGuruPwa } from "@/hooks/guru/useGuruPwa";
import { GuruShell } from "./GuruShell";
import { GuruLoginForm } from "./GuruLoginForm";

function PwaHintCard() {
  const pwa = useGuruPwa();

  useEffect(() => {
    // ensure SW register on mount via hook
  }, []);

  return (
    <section className="rounded-3xl border border-teal-400/20 bg-teal-500/10 p-4">
      <div className="flex items-start gap-3">
        <Smartphone className="mt-0.5 h-5 w-5 text-teal-300" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-sm font-semibold text-teal-50">Pasang sebagai aplikasi</div>
          {pwa.isIos ? (
            <p className="text-xs leading-relaxed text-teal-100/80">
              Safari → tombol Bagikan → <span className="font-semibold text-white">Add to Home Screen</span>.
              Setelah terpasang, aktifkan notifikasi di bawah.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-teal-100/80">
              Pasang PWA agar notifikasi lebih stabil. Inbox in-app tetap aktif tanpa instal.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {pwa.canInstall && (
              <button
                type="button"
                onClick={() => void pwa.promptInstall()}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950"
              >
                <Download className="h-3.5 w-3.5" />
                Instal aplikasi
              </button>
            )}
            <button
              type="button"
              onClick={() => void pwa.requestNotifyPermission()}
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
            >
              <Bell className="h-3.5 w-3.5" />
              {pwa.permission === "granted" ? "Notifikasi aktif" : "Aktifkan notifikasi"}
            </button>
          </div>
          {pwa.pushNote && <p className="text-[11px] text-teal-100/70">{pwa.pushNote}</p>}
          {pwa.installed && (
            <p className="text-[11px] text-emerald-300">Mode Home Screen aktif.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Menu Guru — urutan & label selaras APK `HomeScreen.kt` teacherFeatures */
const TEACHER_MENUS = [
  {
    href: "/guru/siswa",
    title: "Data Siswa",
    desc: "Daftar siswa kelas wali",
    icon: Users,
    tone: "bg-sky-500/15 text-sky-200",
  },
  {
    href: "/guru/presensi",
    title: "Presensi Siswa",
    desc: "Monitoring & rekap kehadiran",
    icon: CalendarCheck,
    tone: "bg-teal-500/15 text-teal-200",
  },
  {
    href: "/guru/sholat",
    title: "Presensi Sholat",
    desc: "Monitoring & rekap sholat",
    icon: Moon,
    tone: "bg-indigo-500/15 text-indigo-200",
  },
  {
    href: "/guru/literasi",
    title: "Literasi & Tugas",
    desc: "Jurnal & tugas literasi",
    icon: BookOpen,
    tone: "bg-violet-500/15 text-violet-200",
  },
  {
    href: "/guru/kaih",
    title: "7 KAIH",
    desc: "Monitoring 7 kebiasaan",
    icon: ClipboardList,
    tone: "bg-indigo-500/15 text-indigo-200",
  },
  {
    href: "/guru/kedisiplinan",
    title: "Kedisiplinan",
    desc: "Catatan pelanggaran",
    icon: ShieldAlert,
    tone: "bg-rose-500/15 text-rose-200",
  },
  {
    href: "/guru/aduan",
    title: "Layanan Aduan",
    desc: "Laporan kelas Anda",
    icon: AlertTriangle,
    tone: "bg-amber-500/15 text-amber-200",
  },
  {
    href: "/guru/notifikasi",
    title: "Notifikasi",
    desc: "Inbox kelas wali",
    icon: Bell,
    tone: "bg-orange-500/15 text-orange-200",
    badge: true,
  },
  {
    href: "/guru/rekap",
    title: "Rekapitulasi",
    desc: "Unduh laporan Excel",
    icon: FileSpreadsheet,
    tone: "bg-sky-500/15 text-sky-200",
  },
] as const;

export function GuruHomeView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading } = useSupervisedStudents(user?.schoolId, user?.class);
  const { unreadCount } = useTeacherNotificationInbox({
    schoolId: user?.schoolId,
    students,
    rosterReady: !loading,
  });

  return (
    <GuruShell unreadCount={unreadCount}>
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/30 via-sky-600/25 to-slate-950/40 p-5">
          <div className="text-xs font-semibold tracking-[0.2em] text-teal-100/80">DASHBOARD</div>
          <h2 className="mt-2 text-xl font-bold text-white">
            Hai, {user?.name || "Guru"}
            {user?.class ? ` · Wali Kelas ${user.class}` : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-100/90">Monitoring aktivitas siswa</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="text-[11px] text-slate-300">Siswa diawasi</div>
              <div className="mt-1 text-2xl font-bold text-white">{loading ? "…" : students.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="text-[11px] text-slate-300">Notifikasi</div>
              <div className="mt-1 text-2xl font-bold text-white">{unreadCount}</div>
            </div>
          </div>
        </section>

        <PwaHintCard />

        <div>
          <h3 className="mb-3 text-base font-semibold text-white">Menu Guru</h3>
          <section className="grid grid-cols-2 gap-3">
            {TEACHER_MENUS.map((menu) => {
              const Icon = menu.icon;
              const showBadge = "badge" in menu && menu.badge && unreadCount > 0;
              return (
                <Link
                  key={menu.title}
                  href={menu.href}
                  className="relative rounded-3xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-slate-900/70"
                >
                  <div className={`inline-flex rounded-2xl p-2 ${menu.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {showBadge && (
                    <span className="absolute right-3 top-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <div className="mt-3 text-sm font-semibold text-white">{menu.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {menu.title === "Data Siswa"
                      ? `${students.length} siswa kelas wali`
                      : menu.title === "Notifikasi" && unreadCount > 0
                        ? `${unreadCount} belum dibaca`
                        : menu.desc}
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </GuruShell>
  );
}

export function GuruPortalGate({ children }: { children: React.ReactNode }) {
  const { user, loading, _hasHydrated, logout } = useAuthStore();

  if (loading || !_hasHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b1220] text-slate-400">
        Memuat portal guru...
      </div>
    );
  }

  if (user && user.role !== "teacher") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b1220] px-4 text-slate-200">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-center">
          <h2 className="text-lg font-bold text-white">Portal GAS Guru</h2>
          <p className="mt-2 text-sm text-slate-300">
            Anda masuk sebagai <span className="font-semibold">{user.role}</span>. Keluar dulu, lalu login dengan NPSN + NUPTK guru (sama seperti APK).
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Keluar & login sebagai guru
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <GuruLoginForm />;
  }

  return <>{children}</>;
}
