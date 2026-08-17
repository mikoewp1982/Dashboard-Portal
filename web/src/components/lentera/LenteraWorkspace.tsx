"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LenteraDashboardPanel } from "./panels/LenteraDashboardPanel";
import { LenteraCatalogPanel } from "./panels/LenteraCatalogPanel";
import { LenteraLoansPanel } from "./panels/LenteraLoansPanel";
import { LenteraStatsPanel } from "./panels/LenteraStatsPanel";
import { LenteraMembersPanel } from "./panels/LenteraMembersPanel";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

const GAS_LIBRARY_HREF = "/dashboard/gas?tab=library";

export default function LenteraWorkspace() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const schoolId = user?.schoolId || "";
  const router = useRouter();

  const { tasks, literacyLogs } = useGasLibrary(schoolId, "");

  const publishedTasks = tasks.filter((t) => t.status === "ACTIVE").length;
  const draftTasks = tasks.filter((t) => t.status !== "ACTIVE").length;
  const pendingReports = literacyLogs.filter((l) => l.status === "PENDING" || !l.status).length;

  // Legacy bookmark: Kelola Literasi moved to GAS Monitoring E-Library
  useEffect(() => {
    if (activeTab === "tasks") {
      router.replace(GAS_LIBRARY_HREF);
    }
  }, [activeTab, router]);

  const renderContent = () => {
    if (activeTab === "dashboard") {
      return <LenteraDashboardPanel />;
    }
    if (activeTab === "catalog") {
      return <LenteraCatalogPanel />;
    }
    if (activeTab === "loans") {
      return <LenteraLoansPanel />;
    }
    if (activeTab === "tasks") {
      return (
        <div className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-8 text-center text-slate-300">
          Mengalihkan ke Monitoring E-Library (GAS)…
        </div>
      );
    }
    if (activeTab === "stats") {
      return <LenteraStatsPanel />;
    }
    if (activeTab === "members") {
      return <LenteraMembersPanel />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Panel Lentera Digital
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 gap-1 border border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Terhubung: Lentera Digital
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola peminjaman, anggota, dan statistik perpustakaan digital
            {user?.schoolName ? ` untuk ${user.schoolName}` : ""}. Tugas literasi dikelola di{" "}
            <button
              type="button"
              onClick={() => router.push(GAS_LIBRARY_HREF)}
              className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
            >
              GAS → Monitoring E-Library
            </button>
            .
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push(GAS_LIBRARY_HREF)}
            className="inline-flex items-center gap-2 rounded-md border border-blue-500/40 bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-600/30 transition-colors shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Tugas Literasi (GAS)
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard Satu Pintu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => router.push(GAS_LIBRARY_HREF)}
          className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm text-left hover:border-blue-500/40 transition"
        >
          <p className="text-sm font-medium text-slate-400">Tugas Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{publishedTasks}</h3>
          <p className="mt-1 text-xs text-slate-400">Kelola di GAS → Monitoring E-Library</p>
        </button>
        <button
          type="button"
          onClick={() => router.push(GAS_LIBRARY_HREF)}
          className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm text-left hover:border-blue-500/40 transition"
        >
          <p className="text-sm font-medium text-slate-400">Laporan Menunggu</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{pendingReports}</h3>
          <p className="mt-1 text-xs text-slate-400">Ringkasan siswa yang masih perlu ditinjau</p>
        </button>
        <button
          type="button"
          onClick={() => router.push(GAS_LIBRARY_HREF)}
          className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm text-left hover:border-blue-500/40 transition"
        >
          <p className="text-sm font-medium text-slate-400">Draft Tersimpan</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{draftTasks}</h3>
          <p className="mt-1 text-xs text-slate-400">Tugas yang belum diterbitkan</p>
        </button>
      </div>

      <div className="pt-2">{renderContent()}</div>
    </div>
  );
}
