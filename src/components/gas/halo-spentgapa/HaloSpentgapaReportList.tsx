import React, { useState } from "react";
import { HaloSpentgapaReport, ReportStatus, IncidentCategory } from "@/hooks/gas/halo-spentgapa/useGasHaloSpentgapa";
import { Clock, ShieldAlert, Check, X } from "lucide-react";

interface HaloSpentgapaReportListProps {
  reports: HaloSpentgapaReport[];
  isLoading: boolean;
  onUpdateStatus: (reportId: string, status: ReportStatus, notes?: string) => Promise<boolean>;
  activeCategory?: IncidentCategory;
}

export const HaloSpentgapaReportList: React.FC<HaloSpentgapaReportListProps> = ({
  reports,
  isLoading,
  onUpdateStatus,
  activeCategory = "BULLYING"
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [noteReportId, setNoteReportId] = useState<string | null>(null);

  const handleUpdateStatus = async (reportId: string, status: ReportStatus, requiresNote: boolean = false) => {
    if (requiresNote && !resolutionNote.trim()) {
      alert("Catatan penanganan wajib diisi untuk menutup laporan.");
      return;
    }
    setUpdatingId(reportId);
    await onUpdateStatus(reportId, status, requiresNote ? resolutionNote : undefined);
    setUpdatingId(null);
    if (requiresNote) {
      setNoteReportId(null);
      setResolutionNote("");
    }
  };

  const getIncidentLabel = (type: string) => {
    const types: Record<string, string> = {
      'VERBAL': 'Verbal',
      'PHYSICAL': 'Fisik',
      'CYBER': 'Siber',
      'SOCIAL': 'Sosial',
      'SEXUAL': 'Seksual',
      'TAWURAN': 'Tawuran',
      'KECELAKAAN': 'Kecelakaan',
      'KEHILANGAN': 'Kehilangan',
      'KERUSAKAN_FASILITAS': 'Kerusakan Fasilitas',
      'OTHER': 'Lainnya',
      'LAINNYA': 'Lainnya'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        Memuat data laporan...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center mx-auto mb-3 text-slate-400">
           <ShieldAlert className="w-5 h-5" />
        </div>
        <h3 className="text-slate-100 font-medium text-sm">Belum ada laporan</h3>
        <p className="text-xs text-slate-400 mt-1">
          Belum ada laporan {activeCategory === "BULLYING" ? "bullying" : "peristiwa"} yang masuk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="border border-slate-700 rounded-lg p-4 hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                report.category === 'BULLYING'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-orange-50 text-orange-600 border border-orange-200'
              }`}>
                {report.category === 'BULLYING' ? 'Bullying' : 'Peristiwa'}
              </span>
              <span className="px-2 py-1 text-[10px] font-semibold rounded-full border border-slate-700 text-slate-400">
                {getIncidentLabel(report.incidentType) || 'Umum'}
              </span>
              {report.isAnonymous && (
                <span className="px-2 py-1 text-[10px] font-semibold rounded-full border border-slate-700 text-slate-400">
                  Anonim
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(report.incidentDate).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-sm text-slate-300 mb-3 line-clamp-2">
            {report.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
            <div>
              <span className="font-semibold text-slate-400">Pelapor</span>
              <p className="text-slate-300">{report.isAnonymous ? "Siswa (Anonim)" : report.reporterName || "-"}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-400">Kelas</span>
              <p className="text-slate-300">{report.className || report.class || "-"}</p>
            </div>
            {report.category === 'BULLYING' && (
              <>
                <div>
                  <span className="font-semibold text-slate-400">Korban</span>
                  <p className="text-slate-300">{report.victimName || "-"}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Pelaku</span>
                  <p className="text-slate-300">{report.perpetratorName || "-"}</p>
                </div>
              </>
            )}
            {report.category !== 'BULLYING' && (
              <div>
                <span className="font-semibold text-slate-400">Lokasi</span>
                <p className="text-slate-300">{report.incidentLocation || "-"}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${
                report.status === 'RESOLVED' ? 'bg-green-100 text-green-700 border-green-200' :
                report.status === 'CLOSED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                report.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-yellow-100 text-yellow-700 border-yellow-200'
              }`}>
                {report.status === 'RESOLVED' ? 'Selesai' :
                 report.status === 'CLOSED' ? 'Ditutup' :
                 report.status === 'INVESTIGATING' ? 'Proses Investigasi' : 'Belum Ditangani'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {report.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus(report.id, 'INVESTIGATING')}
                  disabled={updatingId === report.id}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updatingId === report.id ? 'Memproses...' : 'Tandai Proses'}
                </button>
              )}
              {report.status === 'INVESTIGATING' && noteReportId !== report.id && (
                <button
                  onClick={() => setNoteReportId(report.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Selesai
                </button>
              )}
            </div>
          </div>

          {noteReportId === report.id && (
            <div className="mt-3 p-3 bg-slate-800 rounded-md border border-slate-700 space-y-2 animate-in fade-in">
              <textarea 
                placeholder="Catatan hasil penanganan..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full h-16 p-2 bg-slate-900 border border-slate-600 rounded-md text-xs text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setNoteReportId(null);
                    setResolutionNote("");
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleUpdateStatus(report.id, 'RESOLVED', true)}
                  disabled={updatingId === report.id || !resolutionNote.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  Simpan Status Selesai
                </button>
              </div>
            </div>
          )}

          {report.resolutionNotes && (
            <div className="mt-3 bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 mb-1">Catatan Penanganan:</p>
              <p className="text-sm text-slate-300">{report.resolutionNotes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
