"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Users,
  Menu,
  Building,
  Settings,
  TerminalSquare,
  Lock,
  Bell,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { hasOperationalRuntime, useEduLockSuperAdmin } from "@/hooks/super/useEduLockSuperAdmin";
import { useEduLockUninstallAccess } from "@/hooks/edulock/useEduLockUninstallAccess";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";

export type EduLockSuperTab = "dashboard" | "monitoring" | "tenants" | "admins" | "command-center" | "policy";

function formatDateTime(ts?: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasUninstallCode(access: { code: string; expiresAt: number | null } | null) {
  return Boolean(access?.code && access.expiresAt);
}

export default function SuperAdminEduLockPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("10");
  const [commandMessage, setCommandMessage] = useState("");
  const [commandSaving, setCommandSaving] = useState(false);

  const activeTab = useMemo<EduLockSuperTab>(() => {
    const candidate = searchParams.get("tab") as EduLockSuperTab | null;
    if (
      ["dashboard", "monitoring", "tenants", "admins", "command-center", "policy"].includes(candidate || "")
    ) {
      return candidate as EduLockSuperTab;
    }
    return "dashboard";
  }, [searchParams]);

  const { stats, schools, schoolAdminRows, logs, sessions } = useEduLockSuperAdmin(user?.role);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.schoolId === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  );

  const selectedSchoolAdmin = useMemo(
    () => schoolAdminRows.find((row) => row.schoolId === selectedSchoolId) || null,
    [schoolAdminRows, selectedSchoolId]
  );

  const sessionCount = sessions.length;
  const violationCount = logs.length;
  const { access: uninstallAccess, loading: uninstallLoading } = useEduLockUninstallAccess(selectedSchoolId);
  const hasActiveCode = hasUninstallCode(uninstallAccess);

  const overviewRows = useMemo(() => schoolAdminRows.slice(0, 12), [schoolAdminRows]);

  const handleSelectTab = (nextTab: EduLockSuperTab) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", nextTab);
    router.replace(`/super-admin/edulock?${params.toString()}`, { scroll: false });
    setIsMobileMenuOpen(false);
  };

  const handleCreateUninstallCode = async () => {
    if (!selectedSchoolId) {
      setCommandMessage("Pilih sekolah terlebih dahulu.");
      return;
    }

    setCommandSaving(true);
    setCommandMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "create-edulock-uninstall-code",
        schoolId: selectedSchoolId,
        durationMinutes: Number(durationMinutes || 10),
      });
      setCommandMessage("Kode uninstall EduLock berhasil dibuat dan langsung disinkronkan ke panel Admin Web.");
    } catch (error: unknown) {
      setCommandMessage(error instanceof Error ? error.message : "Gagal membuat kode uninstall EduLock.");
    } finally {
      setCommandSaving(false);
    }
  };

  const handleClearUninstallCode = async () => {
    if (!selectedSchoolId) {
      setCommandMessage("Pilih sekolah terlebih dahulu.");
      return;
    }

    setCommandSaving(true);
    setCommandMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "clear-edulock-uninstall-code",
        schoolId: selectedSchoolId,
      });
      setCommandMessage("Kode uninstall EduLock berhasil dihapus.");
    } catch (error: unknown) {
      setCommandMessage(error instanceof Error ? error.message : "Gagal menghapus kode uninstall EduLock.");
    } finally {
      setCommandSaving(false);
    }
  };

  if (!user || user.role !== "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f25] text-slate-400">
        Akses Ditolak. Anda bukan Super Admin.
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen overflow-hidden text-white font-sans relative"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* Background Gradients and Blueprint Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-10 blur-[100px]"></div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`bg-[#0f172a] border-r border-white/10 text-white w-72 flex-shrink-0 flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-50 shadow-xl`}
      >
        <div className="border-b border-white/10 px-5 pb-4 pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/Logo EduLock.png"
                alt="EduLock"
                width={220}
                height={98}
                className="h-auto w-full max-w-[200px] object-contain drop-shadow-md"
                priority
              />
              <div className="mt-3 text-base font-bold leading-tight text-white">EduLock</div>
              <div className="mt-1 text-xs text-slate-400">Super Admin</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">Control Panel</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Logged in as:</p>
          <p className="font-semibold truncate text-white">Super Admin</p>
          <p className="text-xs text-blue-400 uppercase font-semibold mt-1">super_admin</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            <div className="px-4 py-2 text-xs font-semibold tracking-widest text-slate-400">EDULOCK</div>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 mb-1 text-sm font-medium transition-all duration-200 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30`}
            >
              <Lock className="h-5 w-5" />
              <span>EduLock</span>
            </button>

            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Overview</div>
            <button
              onClick={() => handleSelectTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "dashboard" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
            <button
              onClick={() => handleSelectTab("monitoring")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "monitoring" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <Activity className="h-4 w-4" />
              <span>Realtime Monitoring</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>

            <div className="px-4 py-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Operasional</div>
            <button
              onClick={() => handleSelectTab("tenants")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "tenants" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <Building className="h-4 w-4" />
              <span>Tenant EduLock</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
            <button
              onClick={() => handleSelectTab("admins")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "admins" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <Users className="h-4 w-4" />
              <span>Admin Sekolah</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
            <button
              onClick={() => handleSelectTab("command-center")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "command-center" ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <TerminalSquare className="h-4 w-4" />
              <span>Command Center / Uninstall</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>

            <div className="px-4 py-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Keamanan</div>
            <button
              onClick={() => handleSelectTab("policy")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl ${
                activeTab === "policy" ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              } ml-4`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Policy Center</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="relative z-10 flex h-20 items-center justify-between border-b border-slate-700/50 bg-slate-900/60 px-6 shadow-sm backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-800 md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/super-admin/dashboard"
              className="hidden items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60 hover:text-white sm:inline-flex"
            >
              Kembali ke Dashboard Satu Pintu
            </Link>
            <button className="relative rounded-xl p-2.5 transition-colors hover:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-400" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-red-500"></span>
            </button>
            <button className="rounded-xl p-2.5 transition-colors hover:bg-slate-800">
              <Settings className="h-5 w-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-200">Super Admin</p>
                <p className="text-xs capitalize text-slate-500">Super Admin</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-lg shadow-blue-500/30">
                S
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            
            {/* Header Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-slate-400">PORTALKITA / EDULOCK</div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Super Admin EduLock</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-300">
                    Control plane lintas sekolah untuk tenant, policy keamanan, monitoring, kode uninstall, audit, dan support EduLock.
                  </p>
                  
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">SUB MENU</div>
                    <div className="mt-1 text-sm font-semibold text-white">EduLock Control Plane</div>
                    <p className="mt-1 text-xs text-slate-300">
                      Navigasi utama dipusatkan di sidebar kiri: overview, operasional, keamanan, lalu konfigurasi.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100">
                  MODE SUPER ADMIN
                </div>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "dashboard" || activeTab === "command-center" ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-widest text-slate-400">RUANG KERJA</div>
                      <div className="mt-2 text-lg font-bold text-white">
                        {activeTab === "dashboard" ? "Dashboard" : "Command Center / Uninstall"}
                      </div>
                      <div className="mt-1 text-sm text-slate-300">Login aktif: spentgapaofficial@gmail.com</div>
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100">
                      Semua tenant dan akses admin dikendalikan dari satu panel
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">TOTAL TENANT</div>
                    <div className="mt-1 text-2xl font-bold text-white">{stats.tenantsTotal}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">TENANT DIBUKA</div>
                    <div className="mt-1 text-2xl font-bold text-white">{stats.tenantsEnabled}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">TENANT LIVE</div>
                    <div className="mt-1 text-2xl font-bold text-white">{stats.tenantsLive}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">LOGIN DIBUKA</div>
                    <div className="mt-1 text-2xl font-bold text-white">{stats.adminOpen}</div>
                  </div>
                </div>

                {activeTab === "command-center" ? (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                      <div className="text-sm font-semibold text-slate-100">Kode Uninstall (Sekolah)</div>
                      <div className="mt-1 text-sm text-slate-300">
                        Pilih tenant dari registry pusat. Data sekolah diambil langsung dari node `schools`, jadi tidak lagi kosong jika registry sudah terisi.
                      </div>
                      
                      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1">
                          <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</label>
                          <select
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                          >
                            <option value="">Pilih sekolah</option>
                            {schools.map((school) => (
                              <option key={school.schoolId} value={school.schoolId}>
                                {school.name || school.schoolId}
                              </option>
                            ))}
                          </select>
                          {schools.length === 0 && (
                            <div className="mt-2 text-xs text-amber-300">
                              Registry `schools` masih kosong atau belum terbaca oleh sesi ini.
                            </div>
                          )}
                        </div>
                        <div className="sm:w-48">
                          <label className="mb-2 block text-xs font-semibold tracking-widest text-slate-400">DURASI (MENIT)</label>
                          <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex gap-3">
                        <button
                          type="button"
                          disabled={commandSaving || !selectedSchoolId}
                          onClick={handleCreateUninstallCode}
                          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {commandSaving ? "Memproses..." : "Buat Kode"}
                        </button>
                        <button
                          type="button"
                          disabled={commandSaving || !selectedSchoolId}
                          onClick={handleClearUninstallCode}
                          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Hapus Kode
                        </button>
                      </div>

                      {commandMessage && (
                        <div className={`mt-3 text-xs ${commandMessage.toLowerCase().includes("berhasil") ? "text-emerald-300" : "text-amber-300"}`}>
                          {commandMessage}
                        </div>
                      )}

                      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">KODE AKTIF</div>
                        <div className="mt-3 text-2xl font-extrabold tracking-widest text-cyan-300">
                          {uninstallLoading
                            ? "..."
                            : hasActiveCode
                              ? uninstallAccess?.code || "-"
                              : "-"}
                        </div>
                        <div className="mt-2 text-sm text-slate-400 italic">
                          {uninstallLoading
                            ? "Memuat kode uninstall..."
                            : hasActiveCode
                              ? `Berlaku sampai ${new Date(uninstallAccess?.expiresAt || 0).toLocaleString("id-ID")}`
                              : "Belum ada kode aktif atau sudah kedaluwarsa."}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                      <div className="text-sm font-semibold text-white">Detail Tenant Terpilih</div>
                      <div className="mt-1 text-sm text-slate-400">
                        Ringkasan ini membantu memastikan tenant yang Anda pilih memang sudah terdaftar.
                      </div>
                      {selectedSchool ? (
                        <div className="mt-5 space-y-3">
                          <div>
                            <div className="text-lg font-bold text-white">{selectedSchool.name || "-"}</div>
                            <div className="mt-1 text-xs tracking-widest text-slate-400">
                              {selectedSchool.schoolId} · {selectedSchool.npsn || "-"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-400">STATUS TENANT</div>
                            <div className="mt-2 text-sm text-slate-200">
                              {selectedSchool.isActive ? "Tenant dibuka" : "Tenant ditutup"}
                            </div>
                            <div className="mt-1 text-sm text-slate-200">
                              {selectedSchool.adminAccessActive ? "Login admin dibuka" : "Login admin ditutup"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</div>
                            <div className="mt-2 text-sm text-slate-200">
                              {selectedSchoolAdmin?.loginIdentifier || selectedSchool.authEmail || selectedSchool.adminEmail || "-"}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Live runtime: {selectedSchoolAdmin && hasOperationalRuntime(selectedSchoolAdmin) ? "ya" : "belum ada jejak login"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-400">UPDATE TERAKHIR</div>
                            <div className="mt-2 text-sm text-slate-200">{formatDateTime(selectedSchool.updatedAt)}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                          Pilih sekolah dulu untuk melihat detail tenant dan status login admin EduLock.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                      <div className="border-b border-white/10 px-5 py-4">
                        <div className="text-sm font-semibold text-white">Status Registrasi Tenant EduLock</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Ringkasan tenant, login admin, dan jejak runtime diambil dari registry pusat serta runtime EduLock.
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5 text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                              <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</th>
                              <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">RUNTIME</th>
                              <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 bg-slate-950/20">
                            {overviewRows.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                                  Belum ada tenant EduLock terdaftar.
                                </td>
                              </tr>
                            ) : (
                              overviewRows.map((row) => (
                                <tr key={row.schoolId} className="hover:bg-white/5">
                                  <td className="px-5 py-4">
                                    <div className="font-semibold text-white">{row.schoolName || "-"}</div>
                                    <div className="mt-1 text-xs text-slate-400">{row.schoolId}</div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="text-slate-200">{row.loginIdentifier || "-"}</div>
                                    <div className="mt-1 text-xs text-slate-400">{row.npsn || "-"}</div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="text-slate-200">
                                      {hasOperationalRuntime(row) ? "Tenant live" : "Belum ada jejak"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(row.runtimeLastLoginAt)}</div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      row.schoolActive && row.accessActive
                                        ? "bg-emerald-500/10 text-emerald-200"
                                        : "bg-rose-500/10 text-rose-200"
                                    }`}>
                                      {row.schoolActive && row.accessActive ? "Login Dibuka" : "Login Ditutup"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
                        <div className="text-xs font-semibold tracking-widest text-slate-400">SESSION AKTIF</div>
                        <div className="mt-2 text-3xl font-bold text-white">{sessionCount}</div>
                        <div className="mt-1 text-xs text-slate-400">Jejak runtime `active_sessions` yang terbaca</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
                        <div className="text-xs font-semibold tracking-widest text-slate-400">LOG VIOLATIONS</div>
                        <div className="mt-2 text-3xl font-bold text-white">{violationCount}</div>
                        <div className="mt-1 text-xs text-slate-400">Log terbaru dari node `violations`</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
                        <div className="text-sm font-semibold text-white">Catatan</div>
                        <div className="mt-2 text-sm text-slate-300">
                          Dashboard ini sekarang membaca data tenant riil. Jadi jika registry `schools` sudah berisi data, angka dan daftar tenant tidak akan nol lagi.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "tenants" ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-sm font-semibold text-white">Tenant EduLock</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Daftar tenant ini memakai registry pusat yang sama dengan Database Super Admin.
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/5 text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-950/20">
                      {schools.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-400">Belum ada data sekolah.</td>
                        </tr>
                      ) : (
                        schools.map((school) => (
                          <tr key={school.schoolId} className="hover:bg-white/5">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">{school.name || "-"}</div>
                              <div className="mt-1 text-xs text-slate-400">{school.schoolId}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-200">{school.npsn || "-"}</td>
                            <td className="px-5 py-4 text-slate-200">{school.authEmail || school.adminEmail || "-"}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                school.isActive ? "bg-cyan-500/10 text-cyan-200" : "bg-rose-500/10 text-rose-200"
                              }`}>
                                {school.isActive ? "Tenant Dibuka" : "Tenant Ditutup"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "admins" ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-sm font-semibold text-white">Admin Sekolah EduLock</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Status login admin dibaca dari registry tenant dan runtime EduLock.
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/5 text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">RUNTIME</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN TERAKHIR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-950/20">
                      {schoolAdminRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-400">Belum ada data admin sekolah.</td>
                        </tr>
                      ) : (
                        schoolAdminRows.map((row) => (
                          <tr key={row.schoolId} className="hover:bg-white/5">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">{row.schoolName || "-"}</div>
                              <div className="mt-1 text-xs text-slate-400">{row.schoolId}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-200">{row.loginIdentifier || "-"}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                hasOperationalRuntime(row) ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-700 text-slate-200"
                              }`}>
                                {hasOperationalRuntime(row) ? "Tenant Live" : "Belum Ada Jejak"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-300">{formatDateTime(row.runtimeLastLoginAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "monitoring" ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-sm font-semibold text-white">Active Sessions</div>
                    <div className="mt-1 text-xs text-slate-400">Snapshot runtime terbaru dari node `active_sessions`.</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {sessions.length === 0 ? (
                      <div className="px-5 py-8 text-center text-slate-400">Belum ada sesi aktif.</div>
                    ) : (
                      sessions.slice(0, 12).map((session) => (
                        <div key={session.nisn} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-white">{String(session.name || session.studentName || session.nisn || "-")}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                {String(session.schoolId || "-")} · {String(session.deviceId || session.device_uuid || "-")}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatDateTime(Number(session.updatedAt || session.lastUpdated || session.lastSeen || 0) || null)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-sm font-semibold text-white">Violation Logs</div>
                    <div className="mt-1 text-xs text-slate-400">Log keamanan terbaru dari node `violations`.</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {logs.length === 0 ? (
                      <div className="px-5 py-8 text-center text-slate-400">Belum ada log pelanggaran.</div>
                    ) : (
                      logs.slice(0, 12).map((log) => (
                        <div key={log.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-white">{log.type || "Violation"}</div>
                              <div className="mt-1 text-sm text-slate-300">{log.description || "-"}</div>
                              <div className="mt-1 text-xs text-slate-400">{log.nisn || "-"}</div>
                            </div>
                            <div className="text-xs text-slate-400">{formatDateTime(log.timestamp)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === "policy" ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                <div className="text-sm font-semibold text-white">Policy Center</div>
                <div className="mt-2 text-sm text-slate-300">
                  Policy Center masih dipertahankan jujur: tenant dan login admin sudah membaca data riil, tetapi mutasi kebijakan keamanan lintas tenant masih menunggu backend EduLock final.
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">TENANT LIVE</div>
                    <div className="mt-2 text-2xl font-bold text-white">{stats.tenantsLive}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">SESSION AKTIF</div>
                    <div className="mt-2 text-2xl font-bold text-white">{sessionCount}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-widest text-slate-400">LOG VIOLATIONS</div>
                    <div className="mt-2 text-2xl font-bold text-white">{violationCount}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#121b36]/80 p-12 border border-indigo-500/20 backdrop-blur-sm flex flex-col items-center justify-center text-center mt-6">
                <Activity className="h-12 w-12 text-indigo-400 mb-4 opacity-50" />
                <h2 className="text-lg font-bold text-slate-200">Area {activeTab} sedang dalam pengembangan</h2>
                <p className="text-sm text-slate-400 mt-2">Fitur ini akan segera diimplementasikan untuk Super Admin.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
