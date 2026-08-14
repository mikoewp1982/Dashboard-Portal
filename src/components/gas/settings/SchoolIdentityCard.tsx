"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { SchoolIdentity } from "@/hooks/gas/settings/useGasSystemSettings";

interface Props {
  identity: SchoolIdentity;
  saveIdentity: (identity: SchoolIdentity) => Promise<void>;
  canManage: boolean;
}

export function SchoolIdentityCard({ identity, saveIdentity, canManage }: Props) {
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [identityForm, setIdentityForm] = useState(identity);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditingIdentity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentityForm(identity);
    }
  }, [identity, isEditingIdentity]);

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      setIsSaving(true);
      await saveIdentity(identityForm);
      setIsEditingIdentity(false);
    } catch (err) {
      alert("Gagal menyimpan identitas: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-effect-dark-card rounded-xl shadow-sm">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium leading-6 text-slate-100">Profil Sekolah</h3>
          {canManage && (
            !isEditingIdentity ? (
              <button
                onClick={() => {
                  setIdentityForm(identity);
                  setIsEditingIdentity(true);
                }}
                className="inline-flex items-center rounded-md border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-700/50 focus:outline-none transition-colors"
              >
                Edit Data
              </button>
            ) : (
              <button
                onClick={() => setIsEditingIdentity(false)}
                className="text-sm font-medium text-slate-400 hover:text-slate-300"
              >
                Batal
              </button>
            )
          )}
        </div>

        {isEditingIdentity ? (
          <form onSubmit={handleIdentitySubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  value={identityForm.name}
                  onChange={(e) => setIdentityForm({...identityForm, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">No. Telepon</label>
                <input
                  type="text"
                  value={identityForm.phone}
                  onChange={(e) => setIdentityForm({...identityForm, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Alamat Lengkap</label>
                <textarea
                  value={identityForm.address}
                  onChange={(e) => setIdentityForm({...identityForm, address: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Email Resmi</label>
                <input
                  type="email"
                  value={identityForm.email}
                  onChange={(e) => setIdentityForm({...identityForm, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Website</label>
                <input
                  type="text"
                  value={identityForm.website}
                  onChange={(e) => setIdentityForm({...identityForm, website: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-900/50 px-3 py-2 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-700/50">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
              <dt className="text-sm font-medium text-slate-400">Nama Sekolah</dt>
              <dd className="mt-1 text-base font-semibold text-slate-100">{identity.name || "-"}</dd>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
              <dt className="text-sm font-medium text-slate-400">No. Telepon</dt>
              <dd className="mt-1 text-base font-semibold text-slate-100">{identity.phone || "-"}</dd>
            </div>
            <div className="sm:col-span-2 rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
              <dt className="text-sm font-medium text-slate-400">Alamat</dt>
              <dd className="mt-1 text-base font-semibold text-slate-100">{identity.address || "-"}</dd>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
              <dt className="text-sm font-medium text-slate-400">Email</dt>
              <dd className="mt-1 text-base font-semibold text-slate-100">{identity.email || "-"}</dd>
            </div>
            <div className="rounded-lg bg-slate-800/30 p-4 border border-slate-700/30">
              <dt className="text-sm font-medium text-slate-400">Website</dt>
              <dd className="mt-1 text-base font-semibold text-slate-100">{identity.website || "-"}</dd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
