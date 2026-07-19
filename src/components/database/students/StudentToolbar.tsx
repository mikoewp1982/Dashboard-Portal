"use client";

import { Download, FileSpreadsheet, Plus, RefreshCw, Trash2 } from "lucide-react";

type StudentToolbarProps = {
  loading: boolean;
  canDeleteAll: boolean;
  isDeletingAll: boolean;
  onRefresh: () => void;
  onDeleteAll: () => void;
  onOpenAdd: () => void;
};

export function StudentToolbar({
  loading,
  canDeleteAll,
  isDeletingAll,
  onRefresh,
  onDeleteAll,
  onOpenAdd,
}: StudentToolbarProps) {
  return (
    <div className="flex items-center gap-3">
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
      <button
        onClick={onOpenAdd}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </button>
    </div>
  );
}
