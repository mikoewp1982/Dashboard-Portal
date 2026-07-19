"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { X } from "lucide-react";
import { DatabaseFormData, romanFromGrade } from "@/components/database/shared/databaseConfig";

type ClassFormModalProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  formData: DatabaseFormData;
  setFormData: Dispatch<SetStateAction<DatabaseFormData>>;
  isSubmitting: boolean;
  selectedGrade: number;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function ClassFormModal({
  isOpen,
  mode,
  formData,
  setFormData,
  isSubmitting,
  selectedGrade,
  onClose,
  onSubmit,
}: ClassFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{mode === "add" ? "Tambah Kelas" : "Edit Kelas"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="text-sm text-slate-300">Jenjang: {romanFromGrade(selectedGrade)}</div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">NAMA KELAS</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder={`${romanFromGrade(selectedGrade)}-A`}
            />
            <div className="mt-2 text-xs text-slate-400">
              Contoh: {romanFromGrade(selectedGrade)}-D atau cukup isi D (otomatis menjadi {romanFromGrade(selectedGrade)}-D)
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
