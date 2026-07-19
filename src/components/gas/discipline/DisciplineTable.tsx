import { DisciplineRecord } from "@/types/discipline";
import { Trash2 } from "lucide-react";

interface DisciplineTableProps {
  records: DisciplineRecord[];
  onDelete: (id: string) => void;
}

export function DisciplineTable({ records, onDelete }: DisciplineTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700/30">
          <thead className="bg-gradient-to-r from-slate-900/70 to-slate-900/50">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pelapor</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Aturan/Keterangan</th>
              <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Poin</th>
              <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900/30 divide-y divide-slate-700/30">
            <tr>
              <td colSpan={7} className="px-8 py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="text-slate-200 font-bold mb-1">Tidak ada riwayat pelanggaran</div>
                  <div className="text-slate-500 font-medium text-sm">Belum ada pelanggaran yang dicatat pada bulan ini.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-700/30">
        <thead className="bg-gradient-to-r from-slate-900/70 to-slate-900/50">
          <tr>
            <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
            <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
            <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pelapor</th>
            <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
            <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Aturan/Keterangan</th>
            <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Poin</th>
            <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status / Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-slate-900/30 divide-y divide-slate-700/30">
          {records.map(record => {
            const reporterLabel = record.recordedByName || record.recordedBy || "-";
            const sourceLabel = record.reportedByRole === "teacher"
              ? "Guru"
              : record.reportedByRole === "osis"
                ? "OSIS"
                : record.reportedByRole === "admin" ? "Admin" : "Petugas";

            return (
              <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-400">
                  {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(record.date))}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm font-semibold text-slate-100">
                  {record.studentNameSnapshot}
                  <div className="text-xs text-slate-500 font-normal mt-0.5">Kelas {record.classNameSnapshot}</div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-300">
                  <div className="font-semibold text-slate-100">{reporterLabel}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{sourceLabel}</div>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  <span className="text-sm font-bold text-red-400">Pelanggaran</span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-400">
                  <div className="font-semibold text-slate-200">{record.ruleNameSnapshot}</div>
                  {record.note && <div className="text-xs text-slate-500 mt-1">{record.note}</div>}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-center">
                  <span className="text-sm font-black text-red-400 text-lg">
                    {record.points}
                  </span>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-400 border border-red-700/30">
                      Terekam
                    </span>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="text-slate-500 hover:text-red-400 transition ml-2"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
