"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, MapPin } from "lucide-react";

export function StudentBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on login page
  if (pathname === "/siswa/login") {
    return null;
  }

  const isHome = pathname === "/siswa";
  const isProfile = pathname === "/siswa/profil";
  const isAbsen = pathname === "/siswa/absen";

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the bottom nav */}
      <div className="h-20 w-full" />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-slate-100 px-6 pb-safe pt-2">
        <div className="mx-auto flex max-w-md items-center justify-between relative h-14">
          
          {/* Beranda Tab */}
          <Link
            href="/siswa"
            className={`flex flex-col items-center justify-center w-16 transition-colors ${
              isHome ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home className="h-6 w-6" strokeWidth={isHome ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Beranda</span>
          </Link>

          {/* Floating Absen Button (Center) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <Link
              href="/siswa/absen"
              className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                isAbsen
                  ? "bg-slate-800 text-white shadow-slate-900/30"
                  : "bg-slate-950 text-white shadow-slate-900/40"
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <MapPin className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-[9px] font-bold tracking-wider mt-0.5">ABSEN</span>
              </div>
            </Link>
          </div>

          {/* Profil Tab */}
          <Link
            href="/siswa/profil"
            className={`flex flex-col items-center justify-center w-16 transition-colors ${
              isProfile ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <User className="h-6 w-6" strokeWidth={isProfile ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Profil</span>
          </Link>
          
        </div>
      </div>
    </>
  );
}
