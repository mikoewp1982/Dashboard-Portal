"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Database, Lock, Rocket, BookOpen } from "lucide-react";

const moduleCards = [
  {
    getHref: (role: string) => (role === "super_admin" ? "/super-admin/database" : "/dashboard/database"),
    title: "DATABASE",
    description: "Rumah data induk akun sekolah untuk siswa, guru, OSIS, dan kelas paralel.",
    icon: Database,
  },
  {
    getHref: () => "/dashboard/gas",
    title: "GAS",
    description: "Operasional harian aplikasi sekolah berbasis data induk yang sudah dikunci di DATABASE.",
    icon: Rocket,
  },
  {
    getHref: () => "/dashboard/edulock",
    title: "EduLock",
    description: "Monitoring dan kontrol area EduLock untuk tenant sekolah.",
    icon: Lock,
  },
  {
    getHref: () => "/dashboard/lentera",
    title: "Lentera Digital",
    description: "Ruang kerja literasi dan aktivitas konten sekolah.",
    icon: BookOpen,
  },
];

export default function DashboardHomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "super_admin") {
      router.replace("/super-admin/dashboard");
    }
  }, [user, router]);

  if (!user || user.role === "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6 text-slate-100 sm:px-6"
      style={{
        background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar className="lg:w-64" />

        <main className="min-w-0 flex-1 space-y-6">
          <header className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold tracking-[0.24em] text-slate-400">DASHBOARD UTAMA</div>
                <h1 className="mt-2 text-2xl font-bold text-white">Dashboard Satu Pintu</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Pusat masuk ke seluruh modul tenant sekolah. DATABASE tetap menjadi sumber identitas akun, lalu
                  modul lain membaca data sesuai kontrak sistem yang sudah kita kunci.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
                ADMIN SEKOLAH
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {moduleCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.getHref(user.role)}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <Icon className="h-6 w-6 text-blue-300" />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
