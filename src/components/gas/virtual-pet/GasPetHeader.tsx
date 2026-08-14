"use client";

import Link from "next/link";
import { Activity, Loader2, RotateCcw } from "lucide-react";

interface GasPetHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export function GasPetHeader({ loading, onRefresh }: GasPetHeaderProps) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100">
            <Activity className="h-6 w-6 text-blue-500" />
            Monitoring Virtual Pet
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pantau kesehatan mental siswa, statistik, dan manajemen reward.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 self-start"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>
    </div>
  );
}
