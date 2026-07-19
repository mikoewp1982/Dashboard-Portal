"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import { X } from "lucide-react";
import { DatabaseFormData } from "@/components/database/shared/databaseConfig";

type StaffFormModalProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  formData: DatabaseFormData;
  setFormData: Dispatch<SetStateAction<DatabaseFormData>>;
  isSubmitting: boolean;
  studentsByNisn: Record<string, { name: string; class: string }>;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function StaffFormModal({
  isOpen,
  mode,
  formData,
  setFormData,
  isSubmitting,
  studentsByNisn,
  onClose,
  onSubmit,
}: StaffFormModalProps) {
  if (!isOpen) return null;

  const student = studentsByNisn[String(formData.nisn || "").trim()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{mode === "add" ? "Tambah Petugas OSIS" : "Edit Petugas OSIS"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">NISN</label>
            <input
              type="text"
              required
              value={formData.nisn}
              onChange={(e) => setFormData((prev) => ({ ...prev, nisn: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div className="font-semibold text-white">Data Siswa</div>
            <div className="mt-2 space-y-1 text-sm text-slate-300">
              <div>Nama: {student?.name || "-"}</div>
              <div>Kelas: {student?.class || "-"}</div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              JABATAN (OPSIONAL)
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ketua OSIS / Sekretaris / Bendahara / dll"
            />
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
