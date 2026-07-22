"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, BookOpen, FileText, LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type LenteraNavKey = "dashboard" | "loans" | "tasks" | "members" | "stats";

function getActiveKey(pathname: string | null, tab: string, view: string): LenteraNavKey {
  const safePathname = String(pathname || "");
  if (safePathname.startsWith("/dashboard/lentera/anggota")) return "members";
  if (tab === "tasks") return "tasks";
  if (tab === "literacy" && view === "progress") return "stats";
  if (tab === "literacy" && view === "list") return "stats";
  if (tab === "loans") return "loans";
  return "dashboard";
}

export function LenteraSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, _hasHydrated } = useAuthStore();

  const tab = String(searchParams.get("tab") || "").trim();
  const view = String(searchParams.get("view") || "").trim();
  const taskViewRaw = String(searchParams.get("taskView") || "").trim();
  const taskView = taskViewRaw === "needs-grading" || taskViewRaw === "history" ? taskViewRaw : "tasks";
  const activeKey = getActiveKey(pathname, tab, view);

  const linkClass = (key: LenteraNavKey) => {
    const base = "flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl";
    const active = key === activeKey;
    return `${base} ${
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;
  };

  const handleLogout = () => {
    window.location.href = "/dashboard";
  };

  if (!String(pathname || "").startsWith("/dashboard/lentera")) return null;

  return (
    <aside className="hidden w-72 shrink-0 lg:block border-r border-slate-800 bg-[#0f172a]">
      <div className="flex h-full w-72 flex-col text-white print:hidden">
        <div className="flex h-28 items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 ring-1 ring-blue-400/30">
              <BookOpen className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Lentera</div>
              <div className="text-xs text-slate-400">Admin Panel</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Logged in as:</p>
          <p className="font-semibold truncate text-white">{_hasHydrated ? (user?.schoolName || "Admin Sekolah") : ""}</p>
          <p className="text-xs text-blue-300 uppercase font-semibold mt-1">{_hasHydrated ? user?.role : ""}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Utama</div>

          <Link href="/dashboard/lentera?tab=dashboard" className={linkClass("dashboard")}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link href="/dashboard/lentera?tab=loans" className={linkClass("loans")}>
            <BookOpen className="w-4 h-4" />
            <span>Peminjaman</span>
          </Link>

          <Link href="/dashboard/lentera?tab=tasks" className={linkClass("tasks")}>
            <FileText className="w-4 h-4" />
            <span>Kelola Literasi</span>
          </Link>

          <Link href="/dashboard/lentera?tab=members" className={linkClass("members")}>
            <Users className="w-4 h-4" />
            <span>Data Anggota</span>
          </Link>

          <Link href="/dashboard/lentera?tab=stats" className={linkClass("stats")}>
            <BarChart3 className="w-4 h-4" />
            <span>Statistik Siswa</span>
          </Link>

          <div className="h-px bg-slate-800 my-4 mx-2"></div>
          <div className="mt-2">
            <button
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
            >
               <LogOut className="w-4 h-4" />
               <span>Keluar</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
