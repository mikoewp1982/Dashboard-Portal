"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  MapIcon,
  UserCog,
  Users,
  Settings,
  LogOut,
  X,
  Menu,
  ArrowLeft
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import EduLockWorkspace from "@/components/edulock/EduLockWorkspace";

export type EduLockTab = "dashboard" | "monitoring" | "codes" | "geofencing" | "students" | "classes" | "violations" | "settings";

export default function EduLockDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeTab = useMemo<EduLockTab>(() => {
    const candidate = searchParams.get("tab") as EduLockTab | null;
    if (
      ["dashboard", "monitoring", "codes", "geofencing", "students", "classes", "violations", "settings"].includes(candidate || "")
    ) {
      return candidate as EduLockTab;
    }
    return "dashboard";
  }, [searchParams]);

  const handleSelectTab = (nextTab: EduLockTab) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", nextTab);
    router.replace(`/dashboard/edulock?${params.toString()}`, { scroll: false });
    setIsMobileMenuOpen(false);
  };

  const adminDisplayName = user?.role === "super_admin" ? "Super Admin EduLock" : `Admin ${user?.schoolName || "Sekolah"}`;

  const todayLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  }, []);

  const headerTitle = useMemo(() => {
    if (activeTab === "dashboard") return "Dashboard Overview";
    if (activeTab === "monitoring") return "Realtime Student Monitoring";
    if (activeTab === "codes") return "Manajemen Kode Akses";
    if (activeTab === "classes") return "Manajemen Kelas";
    if (activeTab === "violations") return "Audit Log Pelanggaran";
    if (activeTab === "students") return "Manajemen Data Siswa";
    if (activeTab === "geofencing") return "Pengaturan Zona";
    if (activeTab === "settings") return "Pengaturan Sistem & Keamanan";
    return "EduLock";
  }, [activeTab]);

  const handleLogout = () => {
    // Implement logout or redirect
    window.location.href = "/dashboard";
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Memuat data...
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-950 text-white font-sans"
      style={{
        backgroundImage:
          "radial-gradient(900px 500px at 15% 10%, rgba(99, 102, 241, 0.18), transparent 60%), radial-gradient(800px 450px at 85% 20%, rgba(16, 185, 129, 0.14), transparent 55%), radial-gradient(900px 500px at 50% 90%, rgba(236, 72, 153, 0.10), transparent 60%)",
      }}
    >
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`bg-[#0f172a] text-white w-64 flex-shrink-0 flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]`}
      >
        <div className="flex min-h-[5rem] items-center justify-center border-b border-white/10 px-4 py-3 bg-white/5">
          <Image
            src="/Logo EduLock.png"
            alt="EduLock"
            width={220}
            height={98}
            className="h-auto w-full max-w-[200px] object-contain drop-shadow-md"
            priority
          />
          <button className="md:hidden ml-auto text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-4 text-center bg-white/5">
          <div className="text-sm font-bold text-slate-100">{adminDisplayName}</div>
          <div className="mt-1 text-xs text-slate-400">{todayLabel}</div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-3">
            <button
              onClick={() => handleSelectTab("dashboard")}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </button>

            <button
              onClick={() => handleSelectTab("monitoring")}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "monitoring" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Activity className="mr-3 h-5 w-5" />
              Realtime Monitoring
            </button>

            <button
              onClick={() => handleSelectTab("codes")}
              className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "codes" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ShieldAlert className="mr-3 h-5 w-5" />
              Kelola Kode Izin
            </button>

            <div className="pt-5 mt-5 border-t border-white/10">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Administrasi</p>

              <button
                onClick={() => handleSelectTab("geofencing")}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === "geofencing" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <MapIcon className="mr-3 h-5 w-5" />
                Pengaturan Zona
              </button>

              <button
                onClick={() => handleSelectTab("students")}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === "students" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCog className="mr-3 h-5 w-5" />
                Data Siswa
              </button>

              <button
                onClick={() => handleSelectTab("classes")}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === "classes" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Manajemen Kelas
              </button>

              <button
                onClick={() => handleSelectTab("violations")}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === "violations" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ShieldAlert className="mr-3 h-5 w-5" />
                Audit Log Pelanggaran
              </button>

              <button
                onClick={() => handleSelectTab("settings")}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === "settings" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Pengaturan Sistem
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        <header className="h-[5rem] flex items-center justify-between px-6 z-10 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">{headerTitle}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white border border-white/10 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Dashboard Satu Pintu</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <EduLockWorkspace />
          </div>
        </main>
      </div>
    </div>
  );
}
