"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Plus, RefreshCw, Trash2 } from "lucide-react";
import { DatabaseTab } from "./databaseConfig";

type DatabaseHeaderProps = {
  activeTab: DatabaseTab;
  loading: boolean;
  lastSyncTime: Date;
  canDeleteAll: boolean;
  isDeletingAll: boolean;
  onRefresh: () => void;
  onDeleteAll: () => void;
  onOpenAdd: () => void;
};

export function DatabaseHeader({
  activeTab,
  loading,
  lastSyncTime,
  canDeleteAll,
  isDeletingAll,
  onRefresh,
  onDeleteAll,
  onOpenAdd,
}: DatabaseHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen {activeTab}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {activeTab === "Dashboard Overview"
            ? "Ringkasan pengguna aktif (Realtime)"
            : `Kelola data ${activeTab.toLowerCase()} (Terhubung ke Database)`}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeTab === "Siswa" && (
          <>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-600/30"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Muat Ulang Data
            </button>
            <button
              onClick={onDeleteAll}
              disabled={isDeletingAll || !canDeleteAll}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingAll ? "Menghapus..." : "Hapus Semua"}
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30">
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </>
        )}
        {activeTab !== "Dashboard Overview" && (
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tambah {activeTab}
          </button>
        )}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>
    </div>
  );
}
