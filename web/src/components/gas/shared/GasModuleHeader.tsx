"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type GasModuleHeaderProps = {
  title: string;
  description: string;
  lastSyncTime: Date;
};

export function GasModuleHeader({ title, description, lastSyncTime }: GasModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0b1228] px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
        </div>
      </div>

      <Link
        href="/dashboard"
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
      >
        Kembali ke Dashboard Satu Pintu
      </Link>
    </div>
  );
}
