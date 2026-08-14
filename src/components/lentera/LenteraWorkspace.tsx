"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LenteraDashboardPanel } from "./panels/LenteraDashboardPanel";
import { LenteraLoansPanel } from "./panels/LenteraLoansPanel";
import { LenteraTasksPanel } from "./panels/LenteraTasksPanel";
import { LenteraStatsPanel } from "./panels/LenteraStatsPanel";
import { LenteraMembersPanel } from "./panels/LenteraMembersPanel";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

export default function LenteraWorkspace() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const schoolId = user?.schoolId || "";
  const router = useRouter();
  
  const { tasks, literacyLogs } = useGasLibrary(schoolId, "");

  const publishedTasks = tasks.filter(t => t.status === "ACTIVE").length;
  const draftTasks = tasks.filter(t => t.status !== "ACTIVE").length;
  const pendingReports = literacyLogs.filter(l => l.status === "PENDING" || !l.status).length;

  const renderContent = () => {
    if (activeTab === "dashboard") {
      return <LenteraDashboardPanel />;
    }
    if (activeTab === "loans") {
      return <LenteraLoansPanel />;
    }
    if (activeTab === "tasks") {
      return <LenteraTasksPanel />;
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
      {/* Header Panel */}
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
            Kelola tugas, laporan literasi, dan aktivitas perpustakaan digital{user?.schoolName ? ` untuk ${user.schoolName}` : ''}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard Satu Pintu
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Tugas Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{publishedTasks}</h3>
          <p className="mt-1 text-xs text-slate-400">Tugas yang sudah diterbitkan ke siswa</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Laporan Menunggu</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{pendingReports}</h3>
          <p className="mt-1 text-xs text-slate-400">Ringkasan siswa yang masih perlu ditinjau</p>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-[#0f172a]/60 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Draft Tersimpan</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{draftTasks}</h3>
          <p className="mt-1 text-xs text-slate-400">Tugas yang belum diterbitkan ke sekolah Anda</p>
        </div>
      </div>

      {/* Dynamic Content Panel */}
      <div className="pt-2">
        {renderContent()}
      </div>
    </div>
  );
}
