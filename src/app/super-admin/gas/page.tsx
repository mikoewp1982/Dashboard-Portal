"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasSuperAdmin } from "@/hooks/super/useGasSuperAdmin";

const SUPER_ADMIN_ITEMS = [
  {
    href: "/super-admin/gas/tenants",
    title: "Sekolah & Tenant",
    desc: "Aktif/nonaktif tenant, status integrasi, metadata, kontrol global per sekolah.",
  },
  {
    href: "/super-admin/gas/global-config",
    title: "Konfigurasi Global",
    desc: "Kebijakan default GAS lintas tenant (siap untuk versioning/rollout).",
  },
  {
    href: "/super-admin/gas/sync-jobs",
    title: "Sync Jobs",
    desc: "Pantau dan jalankan job sinkronisasi (master data/attendance/users).",
  },
  {
    href: "/super-admin/gas/broadcast",
    title: "Broadcast Global",
    desc: "Kirim pengumuman lintas sekolah (segmentasi, metrik delivery).",
  },
  {
    href: "/super-admin/gas/support",
    title: "Support Tools",
    desc: "Operasional bantuan: reset akses, rerun sync, tools support (butuh audit).",
  },
  {
    href: "/super-admin/gas/audit",
    title: "Audit & Compliance",
    desc: "Jejak aksi penting untuk modul GAS (subset audit prefix gas.*).",
  },
];

export default function GaspaSuperAdminPage() {
  const { user } = useAuthStore();
  const { tenantsTotal, tenantsActive, supportOpen, jobsQueued } = useGasSuperAdmin(!user);

  if (!user || user.role !== "super_admin") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-slate-400"
        style={{
          background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
        }}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          Akses Ditolak. Anda bukan Super Admin.
        </div>
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
          <div className="rounded-3xl bg-slate-900/60 p-6 shadow-xl border border-slate-700/50 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Super Admin GAS</h1>
              <p className="mt-1 text-sm text-slate-300">
                Control plane lintas sekolah untuk modul GAS (tenant, konfigurasi global, monitoring, broadcast, audit).
              </p>
            </div>
            <Link 
              href="/super-admin/dashboard" 
              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white border border-white/10 hover:bg-white/10 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard Satu Pintu
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl bg-slate-900/60 p-5 shadow-xl border border-slate-700/50 backdrop-blur-2xl">
              <div className="text-xs font-semibold tracking-widest text-slate-400">TENANTS</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">{tenantsTotal}</div>
              <div className="mt-1 text-sm text-slate-300">Total sekolah</div>
            </div>
            <div className="rounded-3xl bg-slate-900/60 p-5 shadow-xl border border-slate-700/50 backdrop-blur-2xl">
              <div className="text-xs font-semibold tracking-widest text-slate-400">AKTIF</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">{tenantsActive}</div>
              <div className="mt-1 text-sm text-slate-300">Sekolah aktif</div>
            </div>
            <div className="rounded-3xl bg-slate-900/60 p-5 shadow-xl border border-slate-700/50 backdrop-blur-2xl">
              <div className="text-xs font-semibold tracking-widest text-slate-400">SYNC QUEUED</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">{jobsQueued}</div>
              <div className="mt-1 text-sm text-slate-300">Menunggu</div>
            </div>
            <div className="rounded-3xl bg-slate-900/60 p-5 shadow-xl border border-slate-700/50 backdrop-blur-2xl">
              <div className="text-xs font-semibold tracking-widest text-slate-400">SUPPORT OPEN</div>
              <div className="mt-1 text-2xl font-bold text-slate-100">{supportOpen}</div>
              <div className="mt-1 text-sm text-slate-300">Request terbuka</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPER_ADMIN_ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-3xl bg-slate-900/50 p-6 shadow-xl border border-slate-700/50 backdrop-blur-2xl hover:border-blue-500/40 transition-colors"
              >
                <div className="text-sm font-semibold text-slate-100">{it.title}</div>
                <div className="mt-1 text-sm text-slate-300">{it.desc}</div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
