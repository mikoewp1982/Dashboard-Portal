"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Database, Rocket, Lock, Activity, ArrowRight, LayoutDashboard, Settings, Bell, Clock, School, FileText, Monitor, Users, Map, Key, ShieldAlert, BookOpen
} from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const Sidebar = ({ className = "", onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    logout();
    router.replace("/login");
  };

  if (!user) return null;

  const isSuperAdmin = user.role === "super_admin";

  const sideMenuItems = [
    { href: "/super-admin/database", label: "Database Induk", icon: Database },
    { href: "/super-admin/monitoring", label: "Monitoring", icon: Monitor },
    { href: "/super-admin/service-status", label: "Status Layanan Sekolah", icon: Activity },
    { href: "/super-admin/uninstall-access", label: "EduLock Uninstall Access", icon: Key },
  ];

  const adminMenuItems = [
    { href: "/dashboard/database", label: "DATABASE", icon: Database },
    { href: "/dashboard/gas", label: "GAS", icon: Rocket },
    { href: "/dashboard/edulock", label: "EduLock", icon: Lock },
    { href: "/dashboard/lentera", label: "Lentera Digital", icon: BookOpen },
  ];

  const adminGasSubItems = [
    { href: "/dashboard/gas?tab=students", label: "Students", tab: "students", icon: Users },
    { href: "/dashboard/gas?tab=teachers", label: "Teachers", tab: "teachers", icon: School },
    { href: "/dashboard/gas?tab=attendance", label: "Attendance", tab: "attendance", icon: Clock },
    { href: "/dashboard/gas?tab=attendance-report", label: "Attendance Report", tab: "attendance-report", icon: FileText },
    { href: "/dashboard/gas?tab=discipline", label: "Discipline", tab: "discipline", icon: ShieldAlert },
    { href: "/dashboard/gas?tab=virtual-pet", label: "Virtual Pet", tab: "virtual-pet", icon: Activity },
    { href: "/dashboard/gas?tab=library", label: "Library", tab: "library", icon: BookOpen },
    { href: "/dashboard/gas?tab=halo-spentgapa", label: "Halo Spentgapa", tab: "halo-spentgapa", icon: Bell },
    { href: "/dashboard/gas?tab=seven-habits", label: "Seven Habits", tab: "seven-habits", icon: LayoutDashboard },
  ] as const;

  const edulockSubItems = [
    { href: "/dashboard/edulock?tab=dashboard", label: "Dashboard EduLock", icon: LayoutDashboard },
    { href: "/dashboard/edulock?tab=monitoring", label: "Monitoring Live", icon: Monitor },
    { href: "/dashboard/edulock?tab=classes", label: "Kelas & Rombel", icon: School },
    { href: "/dashboard/edulock?tab=students", label: "Siswa & Perangkat", icon: Users },
    { href: "/dashboard/edulock?tab=codes", label: "Kode Akses", icon: Key },
    { href: "/dashboard/edulock?tab=geofencing", label: "Geofencing", icon: Map },
    { href: "/dashboard/edulock?tab=violations", label: "Pelanggaran", icon: ShieldAlert },
    { href: "/dashboard/edulock?tab=settings", label: "Pengaturan", icon: Settings },
  ];

  const isGasActiveContext = pathname?.startsWith("/super-admin/gas") || pathname?.startsWith("/dashboard/gas");
  const isEduLockActiveContext = pathname?.startsWith("/super-admin/edulock") || pathname?.startsWith("/dashboard/edulock");
  const activeGasAdminTab = searchParams.get("tab") ?? "students";

  return (
    <aside className={`w-full lg:sticky lg:top-6 lg:w-64 lg:flex-none ${className}`}>
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-2xl backdrop-blur">
        
        {/* Header Logo */}
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 shadow-inner">
          {isGasActiveContext ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center">
                <Image src="/Icon_GAS.png" alt="GAS" width={72} height={72} className="object-contain drop-shadow-md" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  Gerbang Aplikasi<br />Sekolah
                </div>
                <div className="mt-1 text-xs text-slate-400">{isSuperAdmin ? "Super Admin" : "Admin Sekolah"}</div>
              </div>
            </div>
          ) : isEduLockActiveContext ? (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 shadow-lg shadow-purple-500/15">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">EduLock System</div>
                <div className="mt-1 text-xs text-slate-400">{isSuperAdmin ? "Super Admin" : "Admin Sekolah"}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center">
                <Image src="/PortalKita.png" alt="Dashboard PortalKita" width={48} height={48} className="object-contain drop-shadow-md" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">Dashboard Portal Kita</div>
                <div className="mt-1 text-xs text-slate-400">{isSuperAdmin ? "Super Admin" : "Admin Sekolah"}</div>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Logged In As:</div>
          <div className="text-sm font-semibold uppercase text-blue-300">
            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN SEKOLAH"}
          </div>
          {user?.schoolName ? <div className="mt-1 text-sm font-semibold text-white">{user.schoolName}</div> : null}
        </div>

        {/* Dashboard Overview Main Link */}
        <div className="mt-4 space-y-2">
          <Link
            href={isSuperAdmin ? "/super-admin/dashboard" : "/dashboard"}
            onClick={handleLinkClick}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 cursor-pointer"
            style={{ cursor: "pointer" }}
          >
            <span className="flex items-center gap-3">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Utama
            </span>
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="mt-4">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {isGasActiveContext ? "SUPER ADMIN" : isEduLockActiveContext ? "MODUL EDULOCK" : "MENU"}
          </div>
          <div className="mt-2 space-y-2">
            {!isSuperAdmin && isGasActiveContext ? (
              adminGasSubItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === "/dashboard/gas" && activeGasAdminTab === item.tab;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition cursor-pointer ${
                      isActive
                        ? "border-cyan-500/30 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10"
                        : "border-white/10 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-cyan-300" : ""}`} />
                      {item.label}
                    </span>
                    <ArrowRight className={`h-4 w-4 ${isActive ? "opacity-100 text-cyan-300" : "opacity-60"}`} />
                  </Link>
                );
              })
            ) : !isSuperAdmin && isEduLockActiveContext ? (
              // STANDALONE EDULOCK MENU
              edulockSubItems.map((item) => {
                const Icon = item.icon;
                // Parse search params manually for visual active state since we use query params
                const isActive = typeof window !== 'undefined' 
                  ? window.location.search === item.href.split("?")[1] || (item.label === "Dashboard EduLock" && !window.location.search)
                  : false;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition cursor-pointer ${
                      isActive
                        ? "border-purple-500/30 bg-purple-500/10 text-white shadow-lg shadow-purple-500/10"
                        : "border-white/10 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-purple-400" : ""}`} />
                      {item.label}
                    </span>
                    <ArrowRight className={`h-4 w-4 ${isActive ? "opacity-100 text-purple-400" : "opacity-60"}`} />
                  </Link>
                );
              })
            ) : (
              // NORMAL PORTAL MENU
              (isSuperAdmin ? sideMenuItems : adminMenuItems).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isStatusMenu = item.label === "Status Layanan Sekolah";
                
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition cursor-pointer ${
                      isActive 
                        ? "border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10" 
                        : "border-white/10 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="flex items-center gap-3">
                      {isStatusMenu ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-cyan-400/20 bg-cyan-500/10 shadow-sm shadow-cyan-500/10">
                          <Activity className="h-4 w-4" />
                        </span>
                      ) : (
                        <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : ""}`} />
                      )}
                      {item.label}
                    </span>
                    <ArrowRight className={`h-4 w-4 ${isActive ? "opacity-100 text-blue-400" : "opacity-60"}`} />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="cursor-pointer mt-6 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
