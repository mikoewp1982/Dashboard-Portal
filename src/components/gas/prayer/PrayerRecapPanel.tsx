/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { exportToExcel } from "@/utils/export";
import { Search, Download, List, Calendar, Printer } from "lucide-react";
import { createStudentDateKey, getValidDatesInMonth, pickNewestLog, toDateKey } from "@/utils/presensiRules";
import { PrayerLog } from "@/hooks/gas/attendance/useGasPrayerAttendance";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function isNonMuslimStudent(student: any) {
  const religion = String(student?.religion || student?.agama || "").trim().toLowerCase();
  if (!religion) return false;
  if (religion === "non_islam" || religion === "non-islam" || religion === "non muslim" || religion === "nonmuslim") return true;
  if (religion.includes("non") && religion.includes("islam")) return true;
  if (religion.includes("kristen") || religion.includes("katolik") || religion.includes("hindu") || religion.includes("buddha") || religion.includes("konghucu")) return true;
  return false;
}

const formatPrayerTime = (timestamp?: number | null) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(".", ":");
};

const STATUS_LABELS: Record<string, string> = {
  PRAY: "Sholat",
  NOT_PRAY: "Tidak Sholat",
  PERMIT: "Izin",
  HALANGAN: "Pengecualian",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PRAY: "bg-green-900/30 text-green-400 border border-green-700/30",
  NOT_PRAY: "bg-red-900/30 text-red-400 border border-red-700/30",
  PERMIT: "bg-blue-900/30 text-blue-400 border border-blue-700/30",
  HALANGAN: "bg-purple-900/30 text-purple-400 border border-purple-700/30",
};

const HIDE_RECORDED_TIME_STATUSES = new Set(["NOT_PRAY", "PERMIT", "HALANGAN"]);

function getDisplayPrayerTime(status: string | undefined, timestamp?: number | null) {
  if (!status || HIDE_RECORDED_TIME_STATUSES.has(status)) return "-";
  return formatPrayerTime(timestamp ?? null);
}

interface Props {
  classes: any[];
  students: any[];
  logs: PrayerLog[];
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  selectedClassName: string;
  setSelectedClassName: (v: string) => void;
  schedules?: any[];
  holidays?: any[];
}

export function PrayerRecapPanel({
  classes,
  students,
  logs,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedClassName,
  setSelectedClassName,
  schedules = [],
  holidays = []
}: Props) {
  const dropdownClassName =
    "px-3 py-2 rounded-md border border-slate-500/70 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/60";
  
  const [viewMode, setViewMode] = useState<"summary" | "daily">("summary");
  const [searchQuery, setSearchQuery] = useState("");

  const scopedStudents = useMemo(() => {
    return (students || []).filter((student) => !isNonMuslimStudent(student));
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = scopedStudents;
    if (selectedClassName) {
      result = result.filter((s) => (s.class || s.className) === selectedClassName);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.name || "").toLowerCase().includes(query) || 
        (s.nisn || "").includes(query)
      );
    }
    return result;
  }, [scopedStudents, searchQuery, selectedClassName]);

  const validDates = useMemo(() => {
    return getValidDatesInMonth({
      year: selectedYear,
      month: selectedMonth,
      schedules,
      holidays,
    });
  }, [selectedMonth, selectedYear, schedules, holidays]);

  const validDateSet = useMemo(() => {
    return new Set(validDates.map((date) => toDateKey(date)));
  }, [validDates]);

  const filteredLogMap = useMemo(() => {
    const grouped = new Map<string, any>();

    for (const log of logs || []) {
      const canonicalId = log.studentId;
      if (!canonicalId) continue;

      const logDate = new Date(log.date);
      if (logDate.getMonth() + 1 !== selectedMonth || logDate.getFullYear() !== selectedYear) continue;

      const dateKey = toDateKey(logDate);
      if (!validDateSet.has(dateKey)) continue;

      grouped.set(
        createStudentDateKey(canonicalId, dateKey),
        pickNewestLog(grouped.get(createStudentDateKey(canonicalId, dateKey)), log)
      );
    }

    return grouped;
  }, [logs, selectedMonth, selectedYear, validDateSet]);

  const recapRows = useMemo(() => {
    const rows: any[] = [];
    const sortedStudents = [...filteredStudents].sort((a, b) => {
      return String(a.name || "").localeCompare(String(b.name || ""), "id-ID");
    });
    const sortedDates = [...validDates].sort((a, b) => b.getTime() - a.getTime());

    for (const date of sortedDates) {
      const dateKey = toDateKey(date);

      for (const student of sortedStudents) {
        const canonicalId = student.id;
        if (!canonicalId) continue;

        const existingLog = filteredLogMap.get(createStudentDateKey(canonicalId, dateKey));

        if (existingLog) {
          rows.push({
            id: String(existingLog.id || `${canonicalId}-${dateKey}`),
            rowKey: `${canonicalId}-${dateKey}`,
            date: Number(existingLog.date || date.getTime()),
            dateKey,
            recordedTime: Number(existingLog.createdAt || existingLog.updatedAt || existingLog.date || 0) || null,
            recordedBy: String(existingLog.recordedBy || ""),
            studentId: canonicalId,
            studentName: existingLog.studentName || student.name || "Tidak Dikenal",
            studentClass: student.class || student.className || "-",
            studentNisn: student.nisn || "-",
            status: String(existingLog.status || "NOT_PRAY"),
            notes: String(existingLog.notes || ""),
            isSystemGenerated: false,
          });
          continue;
        }

        rows.push({
          id: `missing-${canonicalId}-${dateKey}`,
          rowKey: `${canonicalId}-${dateKey}`,
          date: date.getTime(),
          dateKey,
          recordedTime: null,
          recordedBy: "",
          studentId: canonicalId,
          studentName: student.name || "Tidak Dikenal",
          studentClass: student.class || student.className || "-",
          studentNisn: student.nisn || "-",
          status: "NOT_PRAY",
          notes: "Otomatis dari hari sholat aktif tanpa log presensi.",
          isSystemGenerated: true,
        });
      }
    }

    return rows;
  }, [filteredLogMap, filteredStudents, validDates]);

  const monthlySummaryRows = useMemo(() => {
    return filteredStudents
      .map((student) => {
        const canonicalId = student.id;
        let pray = 0;
        let permit = 0;
        let halangan = 0;
        let notPray = 0;
        let effectiveDays = 0;

        if (!canonicalId) {
          return { student, pray, permit, halangan, notPray, percentage: "0" };
        }

        for (const date of validDates) {
          const dateKey = toDateKey(date);
          const log = filteredLogMap.get(createStudentDateKey(canonicalId, dateKey));

          if (log?.status === "HALANGAN") {
            halangan += 1;
            continue;
          }

          effectiveDays += 1;

          if (!log || log.status === "NOT_PRAY") {
            notPray += 1;
            continue;
          }
          if (log.status === "PRAY") {
            pray += 1;
            continue;
          }
          if (log.status === "PERMIT") {
            permit += 1;
            continue;
          }
          notPray += 1;
        }

        return {
          student,
          pray,
          permit,
          halangan,
          notPray,
          percentage: effectiveDays > 0 ? String(Math.round((pray / effectiveDays) * 100)) : "0",
        };
      })
      .sort((a, b) => String(a.student.name || "").localeCompare(String(b.student.name || ""), "id-ID"));
  }, [filteredLogMap, filteredStudents, validDates]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (viewMode === "summary") {
      const exportData = monthlySummaryRows.map((r) => ({
        'NISN': r.student.nisn,
        'Nama Siswa': r.student.name,
        'Kelas': r.student.class || r.student.className,
        'Sholat': r.pray,
        'Izin': r.permit,
        'Pengecualian': r.halangan,
        'Tidak Sholat': r.notPray,
        'Persentase': `${r.percentage}%`
      }));
      exportToExcel(exportData, `Rekap_Bulanan_Sholat_${MONTHS[selectedMonth-1]}_${selectedYear}`);
    } else {
      const exportData = recapRows.map((l) => ({
        'Tanggal': new Date(l.date).toLocaleDateString('id-ID'),
        'Jam Presensi': getDisplayPrayerTime(l.status, l.recordedTime),
        'NISN': l.studentNisn,
        'Nama Siswa': l.studentName,
        'Kelas': l.studentClass,
        'Status': STATUS_LABELS[l.status] || l.status,
        'Keterangan': l.notes || '-'
      }));
      exportToExcel(exportData, `Riwayat_Harian_Sholat_${MONTHS[selectedMonth-1]}_${selectedYear}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 20px; background: white; z-index: 9999;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 12px; }
          th, td { border: 1px solid black !important; padding: 4px 8px !important; color: black !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Filters & Export */}
      <div className="rounded-lg bg-slate-900/50 p-4 shadow-sm border border-slate-700/60 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
            <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className={dropdownClassName}
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.className || c.id}>{c.className || c.id}</option>
              ))}
            </select>

            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={dropdownClassName}
            >
              {MONTHS.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
            
             <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={dropdownClassName}
            >
              {Array.from({ length: 2040 - 2024 + 1 }, (_, i) => 2024 + i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-600 rounded-md text-sm text-slate-100 focus:ring-blue-500 bg-slate-900/50"
                />
            </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="-ml-1 mr-2 h-5 w-5" />
            Cetak
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          >
            <Download className="-ml-1 mr-2 h-5 w-5" />
            Ekspor
          </button>
        </div>
      </div>

      <div className="flex w-fit space-x-1 rounded-lg bg-slate-800/30 p-1 no-print border border-slate-700/60">
        <button
          onClick={() => setViewMode("summary")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            viewMode === "summary"
              ? "bg-slate-800/80 text-blue-300 shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <List className="h-4 w-4" />
          Rekap Bulanan
        </button>
        <button
          onClick={() => setViewMode("daily")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            viewMode === "daily"
              ? "bg-slate-800/80 text-blue-300 shadow"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Riwayat Harian
        </button>
      </div>

      <div id="print-area">
        <div className="mb-6 hidden text-center print:block">
          <h2 className="text-xl font-semibold text-black">
            {viewMode === "summary" ? "Laporan Rekapitulasi Sholat" : "Laporan Riwayat Presensi Sholat"}
          </h2>
          <div className="mt-2 flex justify-center gap-8 font-medium text-black">
            <p>Kelas: {selectedClassName || "Semua Kelas"}</p>
            <p>Periode: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
          </div>
          <div className="mt-4 border-b-2 border-black"></div>
        </div>

        {viewMode === "summary" ? (
          <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-10">No</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">NISN</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Nama Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
                    <th className="bg-green-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Sh</th>
                    <th className="bg-blue-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">I</th>
                    <th className="bg-purple-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Hal</th>
                    <th className="bg-red-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">TS</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-900/20">
                  {monthlySummaryRows.length > 0 ? (
                    monthlySummaryRows.map((item, index) => (
                      <tr key={item.student.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-center text-sm text-slate-400">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{item.student.nisn || "-"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-100">{item.student.name || "-"}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-400">{item.student.class || item.student.className || "-"}</td>
                        <td className="bg-green-900/10 px-6 py-4 text-center text-sm font-bold text-green-400">{item.pray}</td>
                        <td className="bg-blue-900/10 px-6 py-4 text-center text-sm font-bold text-blue-400">{item.permit}</td>
                        <td className="bg-purple-900/10 px-6 py-4 text-center text-sm font-bold text-purple-400">{item.halangan}</td>
                        <td className="bg-red-900/10 px-6 py-4 text-center text-sm font-bold text-red-400">{item.notPray}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-200">{item.percentage}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Jam Presensi</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-900/20">
                  {recapRows.length > 0 ? (
                    recapRows.map((log) => (
                      <tr key={log.rowKey} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(log.date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-sm text-slate-100">
                          {getDisplayPrayerTime(log.status, log.recordedTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                          {log.studentName}
                          <div className="text-xs text-slate-400 font-normal">{log.studentNisn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">
                          {log.studentClass}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 text-xs font-bold leading-5 ${STATUS_BADGE_CLASSES[log.status] || STATUS_BADGE_CLASSES.NOT_PRAY}`}>
                            {STATUS_LABELS[log.status] || log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {log.notes || (log.isSystemGenerated ? "Otomatis dari hari sholat aktif tanpa log presensi." : "-")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                        Tidak ada riwayat presensi harian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

