/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useMemo } from "react";
import { exportToExcel } from "@/utils/export";
import { Search, Download, Printer, List, Calendar } from "lucide-react";
import { createStudentDateKey, getValidDatesInMonth, pickNewestLog, toDateKey } from "@/utils/presensiRules";
import { AttendanceRecord } from "@/types/gas";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatTime = (time: string | number | null) => {
  if (!time) return "-";
  const numTime = Number(time);
  if (!isNaN(numTime) && numTime > 1000000000000) {
    return new Date(numTime).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).replace(".", ":");
  }
  return String(time);
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPHA: "Tidak Hadir",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PRESENT: "bg-green-900/30 text-green-400 border border-green-700/30",
  LATE: "bg-yellow-900/30 text-yellow-400 border border-yellow-700/30",
  SAKIT: "bg-blue-900/30 text-blue-400 border border-blue-700/30",
  IZIN: "bg-purple-900/30 text-purple-400 border border-purple-700/30",
  ALPHA: "bg-red-900/30 text-red-400 border border-red-700/30",
};

const HIDE_TIME_STATUSES = new Set(["ALPHA", "SAKIT", "IZIN"]);

function getDisplayTime(status: string | undefined, time: string | number | null | undefined) {
  if (!status || HIDE_TIME_STATUSES.has(status)) return "-";
  return formatTime(time ?? null);
}

interface Props {
  classes: any[];
  students: any[];
  attendances: AttendanceRecord[];
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  schedules: any[];
  holidays: any[];
}

export function AttendanceRecapPanel({
  classes,
  students,
  attendances,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  schedules,
  holidays
}: Props) {
  const dropdownClassName =
    "px-3 py-2 rounded-md border border-slate-500/70 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/60";
  
  const [viewMode, setViewMode] = useState<"summary" | "daily">("summary");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    let result = students || [];
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
  }, [students, searchQuery, selectedClassName]);

  const validDates = useMemo(
    () => getValidDatesInMonth({ year: selectedYear, month: selectedMonth, schedules, holidays }),
    [selectedMonth, selectedYear, schedules, holidays]
  );

  const validDateSet = useMemo(() => {
    return new Set(validDates.map((date) => toDateKey(date)));
  }, [validDates]);

  const filteredLogMap = useMemo(() => {
    const grouped = new Map<string, any>();

    for (const log of attendances || []) {
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
  }, [attendances, selectedMonth, selectedYear, validDateSet]);

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
            date: new Date(existingLog.date).getTime(),
            dateKey,
            checkInTime: existingLog.checkInTime ?? null,
            checkOutTime: existingLog.checkOutTime ?? null,
            studentId: canonicalId,
            studentName: existingLog.studentName || student.name || "Tidak Dikenal",
            studentClass: existingLog.className || student.class || "-",
            studentNisn: student.nisn || "-",
            status: String(existingLog.status || "ALPHA"),
            notes: String(existingLog.note || ""),
            isSystemGenerated: false,
          });
          continue;
        }

        rows.push({
          id: `missing-${canonicalId}-${dateKey}`,
          rowKey: `${canonicalId}-${dateKey}`,
          date: date.getTime(),
          dateKey,
          checkInTime: null,
          checkOutTime: null,
          studentId: canonicalId,
          studentName: student.name || "Tidak Dikenal",
          studentClass: student.class || student.className || "-",
          studentNisn: student.nisn || "-",
          status: "ALPHA",
          notes: "Otomatis dari hari sekolah aktif tanpa log presensi.",
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
        let hadir = 0;
        let sakit = 0;
        let izin = 0;
        let alpha = 0;
        let effectiveDays = 0;

        if (!canonicalId) {
          return { student, hadir, sakit, izin, alpha, percentage: "0" };
        }

        for (const date of validDates) {
          const dateKey = toDateKey(date);
          const log = filteredLogMap.get(createStudentDateKey(canonicalId, dateKey));

          effectiveDays += 1;

          if (!log || log.status === "ALPHA") {
            alpha += 1;
            continue;
          }
          if (log.status === "PRESENT" || log.status === "LATE") {
            hadir += 1;
            continue;
          }
          if (log.status === "SAKIT") {
            sakit += 1;
            continue;
          }
          if (log.status === "IZIN") {
            izin += 1;
            continue;
          }
          
          alpha += 1;
        }

        return {
          student,
          hadir,
          sakit,
          izin,
          alpha,
          percentage: effectiveDays > 0 ? String(Math.round((hadir / effectiveDays) * 100)) : "0",
        };
      })
      .sort((a, b) => String(a.student.name || "").localeCompare(String(b.student.name || ""), "id-ID"));
  }, [filteredLogMap, filteredStudents, validDates]);

  const stats = useMemo(() => {
    const totals = {
      present: 0,
      late: 0,
      sick: 0,
      permit: 0,
      absent: 0,
      validDays: validDates.length,
    };

    for (const student of filteredStudents) {
      const canonicalId = student.id;
      if (!canonicalId) continue;

      for (const date of validDates) {
        const dateKey = toDateKey(date);
        const log = filteredLogMap.get(createStudentDateKey(canonicalId, dateKey));

        if (!log || log.status === "ALPHA") {
          totals.absent += 1;
          continue;
        }
        if (log.status === "PRESENT") { totals.present += 1; continue; }
        if (log.status === "LATE") { totals.late += 1; continue; }
        if (log.status === "SAKIT") { totals.sick += 1; continue; }
        if (log.status === "IZIN") { totals.permit += 1; continue; }
        
        totals.absent += 1;
      }
    }
    
    return totals;
  }, [filteredLogMap, filteredStudents, validDates]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: portrait; margin: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 1.5cm; background: white; z-index: 9999;
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 12px; }
          th, td { border: 1px solid black !important; padding: 4px 8px !important; color: black !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
        <StatItem label="Hadir" value={stats.present} color="bg-green-900/30 text-green-400 border border-green-700/30" />
        <StatItem label="Terlambat" value={stats.late} color="bg-yellow-900/30 text-yellow-400 border border-yellow-700/30" />
        <StatItem label="Sakit" value={stats.sick} color="bg-blue-900/30 text-blue-400 border border-blue-700/30" />
        <StatItem label="Izin" value={stats.permit} color="bg-purple-900/30 text-purple-400 border border-purple-700/30" />
        <StatItem label="Tidak Hadir" value={stats.absent} color="bg-red-900/30 text-red-400 border border-red-700/30" />
        <StatItem label="Hari Sekolah Aktif" value={stats.validDays} color="bg-slate-800/30 text-slate-200 border border-slate-700/30" />
      </div>

      {/* Filters & Export */}
      <div className="rounded-lg bg-slate-900/50 p-4 shadow-sm border border-slate-700/60 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
            <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className={dropdownClassName}
            >
              <option value="">Semua Kelas</option>
              {classes.map((c, index) => (
                <option key={`${c.id}-${index}`} value={c.className || c.id}>{c.className || c.id}</option>
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

        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="-ml-1 mr-2 h-5 w-5" />
          Cetak
        </button>
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

      <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 no-print">
        Rekap menampilkan seluruh siswa terfilter pada setiap hari sekolah aktif.
        {" "}Untuk filter saat ini: <span className="font-semibold text-slate-100">{filteredStudents.length} siswa</span>
        {" "}x <span className="font-semibold text-slate-100">{validDates.length} hari aktif</span>
      </div>

      {/* Table */}
      <div id="print-area">
        <div className="mb-6 hidden print:block text-black">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black uppercase">
              SMP NEGERI 3 PACET<br/>
              <span className="font-semibold text-lg capitalize">Laporan Rekapitulasi Kehadiran</span>
            </h2>
            <div className="mt-2 flex justify-center gap-8 font-medium text-black text-sm">
              <p>Kelas: {selectedClassName || "Semua Kelas"}</p>
              <p>Periode: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            </div>
          </div>
          <div className="mt-4 border-b-[3px] border-black"></div>
        </div>

        {viewMode === "summary" ? (
          <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50 print:border-none print:rounded-none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-10">No</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">NISN</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Nama Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">L/P</th>
                    <th className="bg-green-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-green-200 print:text-black">H</th>
                    <th className="bg-blue-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-blue-200 print:text-black">S</th>
                    <th className="bg-purple-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-purple-200 print:text-black">I</th>
                    <th className="bg-red-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-red-200 print:text-black">A</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-900/20">
                  {monthlySummaryRows.length > 0 ? (
                    monthlySummaryRows.map((item, index) => {
                      const genderStr = String(item.student.gender || item.student.jenisKelamin || "").toLowerCase();
                      const lp = genderStr.startsWith('p') ? 'P' : (genderStr.startsWith('l') ? 'L' : '-');
                      return (
                        <tr key={item.student.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-center text-sm text-slate-400 print:text-black">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-slate-400 print:text-black">{item.student.nisn || "-"}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-100 print:text-black">{item.student.name || "-"}</td>
                          <td className="px-6 py-4 text-center text-sm text-slate-400 print:text-black">{lp}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-300 print:text-black">{item.hadir}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-300 print:text-black">{item.sakit}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-300 print:text-black">{item.izin}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-300 print:text-black">{item.alpha}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-200 print:text-black">{item.percentage}%</td>
                        </tr>
                      );
                    })
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
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Jam Datang</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Jam Pulang</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/20 divide-y divide-slate-700">
              {recapRows.length > 0 ? (
                recapRows.map((log) => (
                  <tr key={log.rowKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(log.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-center font-mono">
                      {getDisplayTime(log.status, log.checkInTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-center font-mono">
                      {getDisplayTime(log.status, log.checkOutTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                      {log.studentName}
                      <div className="text-xs text-slate-400">{log.studentNisn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {log.studentClass}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${STATUS_BADGE_CLASSES[log.status] || STATUS_BADGE_CLASSES.ALPHA}`}>
                        {STATUS_LABELS[log.status] || log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {log.notes || (log.isSystemGenerated ? "Otomatis dari hari sekolah aktif tanpa log presensi." : '-')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">
                    Tidak ada data absensi yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            </div>
          </div>
        )}

        <div className="mt-8 hidden print:flex justify-end text-black text-sm">
          <div className="text-center w-64">
            <p>Pacet, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <br/><br/><br/><br/>
            <p className="font-bold underline">Kepala Sekolah</p>
            <p>NIP..................</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <dt className="text-sm font-semibold truncate opacity-80">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </div>
  );
}

