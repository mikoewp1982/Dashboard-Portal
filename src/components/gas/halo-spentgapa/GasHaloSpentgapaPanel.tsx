import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useGasHaloSpentgapa, IncidentCategory, ReportStatus } from "@/hooks/gas/halo-spentgapa/useGasHaloSpentgapa";
import { HaloSpentgapaReportList } from "./HaloSpentgapaReportList";
import { exportToExcel } from "@/utils/export";

interface GasHaloSpentgapaPanelProps {
  schoolId: string;
}

export const GasHaloSpentgapaPanel: React.FC<GasHaloSpentgapaPanelProps> = ({ schoolId }) => {
  const { reports, isLoading, error, fetchReports, updateReportStatus } = useGasHaloSpentgapa(schoolId);
  const [activeCategory, setActiveCategory] = useState<IncidentCategory>("BULLYING");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");

  const getReportClassLabel = (report: { className?: string; class?: string }) =>
    String(report.className || report.class || "").trim();

  useEffect(() => {
    if (schoolId) {
      fetchReports();
    }
  }, [schoolId, fetchReports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchCategory = report.category === activeCategory || (!report.category && activeCategory === "BULLYING");
      const matchStatus = statusFilter === "ALL" || report.status === statusFilter;
      const matchClass = classFilter === "ALL" || getReportClassLabel(report) === classFilter;
      return matchCategory && matchStatus && matchClass;
    });
  }, [reports, activeCategory, classFilter, statusFilter]);

  const availableClasses = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => getReportClassLabel(report))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "id"));
  }, [reports]);

  const stats = useMemo(() => {
    const bullying = reports.filter(r => (r.category || 'BULLYING') === 'BULLYING').length;
    const incident = reports.filter(r => r.category === 'INCIDENT').length;
    const pending = reports.filter(r => r.status === 'PENDING' || r.status === 'INVESTIGATING').length;
    const resolved = reports.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
    
    return { bullying, incident, pending, resolved };
  }, [reports]);

  const handleExport = () => {
    const data = filteredReports.map(report => ({
      Tanggal: new Date(report.incidentDate).toLocaleString('id-ID'),
      Kategori: report.category === 'BULLYING' ? 'Bullying' : 'Peristiwa',
        Kelas: getReportClassLabel(report) || '-',
      Jenis: report.incidentType,
      Pelapor: report.isAnonymous ? "Anonim" : report.reporterName || "-",
      Korban: report.victimName || '-',
      Pelaku: report.perpetratorName || '-',
      Lokasi: report.incidentLocation || '-',
      Deskripsi: report.description || '',
      Status: report.status,
      CatatanPenanganan: report.resolutionNotes || ''
    }));

    const fileCategory = activeCategory === 'BULLYING' ? 'Bullying' : 'Peristiwa';
    exportToExcel(data, `Laporan_Aduan_${fileCategory}_${schoolId}`);
  };
  return (
    <div className="min-h-screen bg-slate-900/30 p-6 space-y-6 overflow-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            Layanan Aduan
            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </h1>
          <p className="text-sm text-slate-400">
            Laporan masuk dari siswa terkait bullying dan peristiwa lainnya.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 self-start sm:self-auto"
        >
          Kembali ke Dashboard Satu Pintu
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect-dark-card rounded-lg shadow-sm border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400">Total Bullying</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{stats.bullying}</p>
        </div>
        <div className="glass-effect-dark-card rounded-lg shadow-sm border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400">Total Peristiwa</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{stats.incident}</p>
        </div>
        <div className="glass-effect-dark-card rounded-lg shadow-sm border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400">Belum Ditangani</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.pending}</p>
        </div>
        <div className="glass-effect-dark-card rounded-lg shadow-sm border border-slate-700 p-4">
          <p className="text-xs font-medium text-slate-400">Sudah Selesai</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      <div className="glass-effect-dark-card rounded-lg shadow-sm border border-slate-700 flex flex-col">
        <div className="border-b border-slate-700 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="inline-flex rounded-full bg-blue-50 p-1 text-blue-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Daftar Laporan Masuk</p>
              <p className="text-xs text-slate-400">
                Klik tombol status untuk menandai laporan sudah ditangani.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <div className="inline-flex rounded-full bg-slate-800/50 p-1">
              <button
                onClick={() => setActiveCategory('BULLYING')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                  activeCategory === 'BULLYING'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lapor Bullying
              </button>
              <button
                onClick={() => setActiveCategory('INCIDENT')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                  activeCategory === 'INCIDENT'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lapor Peristiwa
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-slate-800/50 p-1">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    statusFilter === 'ALL'
                      ? 'bg-gray-900 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    statusFilter === 'PENDING'
                      ? 'bg-yellow-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Belum
                </button>
                <button
                  onClick={() => setStatusFilter('INVESTIGATING')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    statusFilter === 'INVESTIGATING'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Proses
                </button>
                <button
                  onClick={() => setStatusFilter('RESOLVED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    statusFilter === 'RESOLVED'
                      ? 'bg-green-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Selesai
                </button>
                <button
                  onClick={() => setStatusFilter('CLOSED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    statusFilter === 'CLOSED'
                      ? 'bg-slate-900/30 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ditutup
                </button>
              </div>

              <div className="relative">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-xs border border-slate-700 rounded-full bg-slate-900/30 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="ALL">Semua Kelas</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchReports} className="underline hover:text-red-300">Coba Lagi</button>
          </div>
        )}

        <div className="p-4 space-y-3 min-h-[40vh] max-h-[70vh] overflow-y-auto">
           <HaloSpentgapaReportList 
            reports={filteredReports} 
            isLoading={isLoading}
            onUpdateStatus={updateReportStatus}
            activeCategory={activeCategory}
          />
        </div>
      </div>
    </div>
  );
};
