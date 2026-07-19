"use client";

import Link from "next/link";
import { Users, Loader2 } from "lucide-react";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";

export function EduLockClassesPanel({ schoolId }: { schoolId: string }) {
  const { data: classesData, loading } = useClassesRealtime(schoolId);

  // Map real data to class catalog format
  const classCatalogComputed = classesData.map((c: any) => ({
    key: String(c.className || c.name || c.id || ""),
    name: String(c.className || c.name || c.id || ""),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-400" />
            Manajemen Kelas
          </h3>
        </div>
        <div className="p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            Data kelas mengikuti Database Satu Pintu (GAS).
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th className="px-6 py-3">Kelas</th>
                  <th className="px-6 py-3">Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      Memuat data kelas dari GAS...
                    </td>
                  </tr>
                ) : classCatalogComputed.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                      Belum ada kelas. Tambahkan kelas agar input siswa dan filter lebih rapi.
                    </td>
                  </tr>
                ) : (
                  classCatalogComputed.map((c) => (
                    <tr key={c.key}>
                      <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{c.key}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
