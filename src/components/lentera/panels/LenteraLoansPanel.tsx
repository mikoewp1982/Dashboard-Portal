"use client";

import { Book, BookOpen, Clock } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";

export function LenteraLoansPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  
  const { books, borrowRecords, loading: libLoading } = useGasLibrary(schoolId, "");
  const { data: students, loading: stdLoading } = useStudentsRealtime(schoolId);

  const loading = libLoading || stdLoading;

  const totalTitles = books.length;
  const activeLoans = borrowRecords.filter(r => r.status === 'BORROWED').length;
  const overdueLoans = borrowRecords.filter(r => r.status === 'OVERDUE').length;

  const enrichedRecords = borrowRecords.map(record => {
    const student = students.find(s => s.id === record.studentId);
    const book = books.find(b => b.id === record.bookId);
    return {
      ...record,
      studentName: student?.name || "Siswa Tidak Ditemukan",
      studentClass: student?.class || "-",
      bookTitle: book?.title || "Buku Tidak Ditemukan",
      bookAuthor: book?.author || "-",
    };
  }).sort((a, b) => b.borrowDate - a.borrowDate);

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat data peminjaman...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Koleksi Judul</p>
              <h3 className="text-2xl font-bold text-white">{totalTitles}</h3>
              <p className="text-xs text-slate-500 mt-1">Total judul buku terdaftar</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Book className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Sedang Dipinjam</p>
              <h3 className="text-2xl font-bold text-white">{activeLoans}</h3>
              <p className="text-xs text-slate-500 mt-1">Siswa sedang meminjam buku</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              <BookOpen className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Terlambat Pengembalian</p>
              <h3 className="text-2xl font-bold text-rose-500">{overdueLoans}</h3>
              <p className="text-xs text-slate-500 mt-1">Perlu tindak lanjut</p>
            </div>
            <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
              <Clock className="w-6 h-6 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">Aktivitas Peminjaman Terkini</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-[#0f172a]/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Buku</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tgl Pinjam</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-transparent">
                {enrichedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-200">{record.studentName}</div>
                      <div className="text-xs text-slate-400">{record.studentClass}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-200 line-clamp-1">{record.bookTitle}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{record.bookAuthor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(record.borrowDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                        record.status === 'OVERDUE' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                          : record.status === 'RETURNED'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {record.status === 'OVERDUE' ? 'Terlambat' : record.status === 'RETURNED' ? 'Kembali' : 'Dipinjam'}
                      </span>
                    </td>
                  </tr>
                ))}
                {enrichedRecords.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                       Belum ada aktivitas peminjaman.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info or Quick Actions */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 shadow-sm h-fit">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Informasi Sistem</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-1">Denda Keterlambatan</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fitur denda belum diaktifkan. Harap ingatkan siswa secara manual untuk pengembalian buku.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-emerald-400 mb-1">Sinkronisasi RTDB</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tabel peminjaman ini diperbarui secara real-time setiap kali ada siswa yang melakukan scan kode QR buku melalui aplikasi Android mereka.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
