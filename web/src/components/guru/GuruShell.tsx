"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LogOut, Users, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

/** Primary shortcuts; full APK menu grid lives on Beranda. */
const navItems = [
  { href: "/guru", label: "Beranda", icon: Home, exact: true },
  { href: "/guru/siswa", label: "Siswa", icon: Users },
  { href: "/guru/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/guru/aduan", label: "Aduan", icon: AlertTriangle },
];

export function GuruShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#134e4a_0%,_#0b1220_45%,_#071018_100%)] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/85 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.22em] text-teal-300/90">GAS GURU</div>
            <div className="truncate text-sm font-semibold text-white">{user?.name || "Guru"}</div>
            <div className="truncate text-xs text-slate-400">
              {user?.class ? `Wali Kelas ${user.class}` : "Portal Guru"}
              {user?.schoolName ? ` · ${user.schoolName}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0b1220]/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${
                  active ? "bg-teal-500/20 text-teal-200" : "text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === "/guru/notifikasi" && unreadCount > 0 && (
                  <span className="absolute right-3 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
