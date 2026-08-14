"use client";

import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useAuthStore } from "@/store/useAuthStore";

export function LenteraMembersPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { data: students, loading } = useStudentsRealtime(schoolId);

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat data anggota...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Data Anggota Perpustakaan</h2>
        <p className="text-sm text-slate-400 mt-1">
          Daftar seluruh siswa yang terdaftar sebagai anggota Lentera Digital.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden shadow-sm mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-[#0f172a]/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">NISN</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-transparent">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-200">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {student.class}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {student.nisn || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                    Belum ada data anggota.
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
