"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

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
                <h1 className="mt-2 text-2xl font-bold text-white">Selamat Datang, {user.name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Ini adalah pusat kendali operasional sekolah Anda. Silakan gunakan menu di sidebar sebelah kiri untuk mengelola Database, GAS, EduLock, maupun Lentera Digital.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 uppercase">
                  {user.role.replace("_", " ")}
                </div>
                {user.npsn && (
                  <div className="text-xs font-medium text-slate-400">
                    NPSN: {user.npsn}
                  </div>
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">STATUS SISTEM</div>
               <div className="mt-2 text-2xl font-bold text-emerald-400">Online</div>
               <div className="mt-1 text-sm text-slate-300">Semua layanan berjalan normal</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</div>
               <div className="mt-2 text-xl font-bold text-white line-clamp-1">{user.schoolName || "-"}</div>
               <div className="mt-1 text-sm text-slate-300">Tenant aktif</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">AKSES</div>
               <div className="mt-2 text-xl font-bold text-blue-300">Otorisasi Penuh</div>
               <div className="mt-1 text-sm text-slate-300">Hak akses administrator</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
