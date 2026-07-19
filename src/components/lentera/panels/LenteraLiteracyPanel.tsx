"use client";

import { FileText, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

export function LenteraLiteracyPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { literacyLogs, loading } = useGasLibrary(schoolId, "");

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat laporan literasi...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl overflow-hidden backdrop-blur">
        <div className="px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <FileText className="w-6 h-6 text-cyan-400" />
             </div>
             <div>
                <h3 className="text-lg font-semibold text-white">Audit & Laporan Literasi</h3>
                <p className="text-sm text-slate-400">Daftar laporan bacaan dan ringkasan yang dikirimkan oleh siswa.</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Buku / Tugas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu Submit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Ringkasan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {literacyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-200">{log.studentName}</div>
                    <div className="text-xs text-slate-400">{log.studentClass} • {log.nisn || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-200 line-clamp-1">{log.bookTitle || "Tanpa Judul"}</div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {log.taskId ? (
                         <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold mr-1">Tugas Wajib</span>
                      ) : null}
                      {log.taskTitle || log.author || "Bacaan Bebas"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {new Date(log.timestamp || 0).toLocaleDateString('id-ID', {
                       day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-xs text-slate-300 line-clamp-2 max-w-xs leading-relaxed">
                        {log.summary || "-"}
                     </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.status === "APPROVED" ? (
                       <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
                          <CheckCircle className="w-3.5 h-3.5" /> Diterima
                       </div>
                    ) : log.status === "REJECTED" ? (
                       <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 w-fit">
                          <XCircle className="w-3.5 h-3.5" /> Ditolak
                       </div>
                    ) : (
                       <div className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 w-fit">
                          Menunggu Review
                       </div>
                    )}
                  </td>
                </tr>
              ))}
              {literacyLogs.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                     Belum ada laporan literasi yang dikirimkan.
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
