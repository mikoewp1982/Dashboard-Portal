"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { X } from "lucide-react";
import { DatabaseFormData, DatabaseRecord } from "@/components/database/shared/databaseConfig";

type StudentFormModalProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  formData: DatabaseFormData;
  setFormData: Dispatch<SetStateAction<DatabaseFormData>>;
  classes: DatabaseRecord[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function StudentFormModal({
  isOpen,
  mode,
  formData,
  setFormData,
  classes,
  isSubmitting,
  onClose,
  onSubmit,
}: StudentFormModalProps) {
  if (!isOpen) return null;

  const classOptions = Array.from(new Set(classes.map((row) => row.className || row.class || row.grade))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{mode === "add" ? "Tambah Siswa" : "Edit Siswa"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                NISN (PASSWORD LOGIN)
              </label>
              <input
                type="text"
                required
                value={formData.nisn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nisn: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Isi NISN siswa sebagai password"
              />
              <div className="mt-2 text-xs text-slate-400">NISN dipakai sebagai password login awal siswa.</div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">L/P</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="L">L</option>
                <option value="P">P</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">AGAMA</label>
            <select
              value={formData.religion}
              onChange={(e) => setFormData((prev) => ({ ...prev, religion: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ISLAM">Islam</option>
              <option value="NON_ISLAM">Non Muslim</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              NAMA SISWA (USERNAME LOGIN)
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Isi nama siswa sesuai username login"
            />
            <div className="mt-2 text-xs text-slate-400">Nama siswa dipakai sebagai username login.</div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">KELAS</label>
            <select
              value={formData.class}
              onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Pilih kelas...</option>
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-400">Kelas hanya bisa dipilih dari daftar Kelas Paralel.</div>
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
