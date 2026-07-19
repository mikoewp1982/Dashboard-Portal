"use client";

import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { AcademicYear } from "@/hooks/gas/settings/useGasSystemSettings";

interface Props {
  academicYears: AcademicYear[];
  activeYearId: string | null;
  addAcademicYear: (year: Omit<AcademicYear, "id" | "isActive"> & { id: string }) => Promise<void>;
  removeAcademicYear: (id: string) => Promise<void>;
  setActiveYear: (id: string) => Promise<void>;
  canManage: boolean;
}

export function AcademicYearCard({
  academicYears,
  activeYearId,
  addAcademicYear,
  removeAcademicYear,
  setActiveYear,
  canManage
}: Props) {
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearForm, setNewYearForm] = useState<Partial<AcademicYear>>({
    name: "",
    semester: "Ganjil",
    startDate: "",
    endDate: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!newYearForm.name || !newYearForm.startDate || !newYearForm.endDate) return;

    try {
      setIsSaving(true);
      const id = Math.random().toString(36).substring(2, 9);
      await addAcademicYear({
        id,
        name: newYearForm.name!,
        semester: newYearForm.semester as "Ganjil" | "Genap",
        startDate: newYearForm.startDate!,
        endDate: newYearForm.endDate!
      });
      setNewYearForm({ name: "", semester: "Ganjil", startDate: "", endDate: "" });
      setIsAddingYear(false);
    } catch (err) {
      alert("Gagal menambahkan tahun ajaran: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveYear = async (id: string) => {
    if (!canManage) return;
    if (!confirm("Yakin ingin menghapus tahun ajaran ini?")) return;
    try {
      await removeAcademicYear(id);
    } catch (err) {
      alert("Gagal menghapus tahun ajaran: " + String(err));
    }
  };

  const handleSetActiveYear = async (id: string) => {
    if (!canManage) return;
    try {
      await setActiveYear(id);
    } catch (err) {
      alert("Gagal mengaktifkan tahun ajaran: " + String(err));
    }
  };

  return (
    <div className="glass-effect-dark-card rounded-xl shadow-sm">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-slate-100">Daftar Tahun Ajaran</h3>
            <p className="mt-1 text-sm text-slate-400">Tahun ajaran yang aktif akan digunakan sebagai referensi default di seluruh fitur operasional.</p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsAddingYear(!isAddingYear)}
              className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tahun
            </button>
          )}
        </div>

        {isAddingYear && (
          <div className="mb-6 bg-slate-900/50 p-5 rounded-lg border border-slate-700 shadow-inner">
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Formulir Tahun Ajaran Baru</h4>
            <form onSubmit={handleAddYear} className="grid grid-cols-1 gap-4 sm:grid-cols-5 items-end">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tahun (Misal: 2024/2025)</label>
                <input
                  type="text"
                  required
                  placeholder="2024/2025"
                  value={newYearForm.name}
                  onChange={(e) => setNewYearForm({...newYearForm, name: e.target.value})}
                  className="block w-full rounded-md border border-slate-600 bg-slate-800/80 px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Semester</label>
                <select
                  value={newYearForm.semester}
                  onChange={(e) => setNewYearForm({...newYearForm, semester: e.target.value as "Ganjil" | "Genap"})}
                  className="block w-full rounded-md border border-slate-600 bg-slate-800/80 px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Mulai Aktif</label>
                <input
                  type="date"
                  required
                  value={newYearForm.startDate}
                  onChange={(e) => setNewYearForm({...newYearForm, startDate: e.target.value})}
                  className="block w-full rounded-md border border-slate-600 bg-slate-800/80 px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Berakhir</label>
                <input
                  type="date"
                  required
                  value={newYearForm.endDate}
                  onChange={(e) => setNewYearForm({...newYearForm, endDate: e.target.value})}
                  className="block w-full rounded-md border border-slate-600 bg-slate-800/80 px-3 py-2 text-slate-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-1 flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingYear(false)}
                  className="w-full rounded-md bg-slate-800/50 border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden shadow-sm ring-1 ring-slate-700 rounded-lg">
          <table className="min-w-full divide-y divide-slate-700/80">
            <thead className="bg-slate-800/60">
              <tr>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tahun Ajaran</th>
                <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Semester</th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Periode</th>
                <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-slate-900/30">
              {academicYears.length > 0 ? academicYears.map((year) => (
                <tr key={year.id} className={`hover:bg-slate-800/40 transition-colors ${year.id === activeYearId ? 'bg-blue-900/10' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-100">{year.name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-slate-300">{year.semester}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400">
                    <span className="font-mono bg-slate-800/50 px-2 py-1 rounded text-xs">
                      {new Date(year.startDate).toLocaleDateString("id-ID")} - {new Date(year.endDate).toLocaleDateString("id-ID")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-center text-sm">
                    {year.id === activeYearId ? (
                      <span className="inline-flex items-center rounded-full bg-green-900/30 border border-green-500/30 px-3 py-1 text-xs font-bold text-green-400">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-800/50 border border-slate-600/50 px-3 py-1 text-xs font-medium text-slate-400">
                        Tidak Aktif
                      </span>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {canManage && (
                      <div className="flex justify-end gap-3">
                        {year.id !== activeYearId && (
                          <>
                            <button
                              onClick={() => handleSetActiveYear(year.id)}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                              title="Aktifkan Semester"
                            >
                              <Check className="h-4 w-4" />
                              <span className="hidden sm:inline">Set Aktif</span>
                            </button>
                            <button
                              onClick={() => handleRemoveYear(year.id)}
                              className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors ml-2"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    Belum ada data Tahun Ajaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}