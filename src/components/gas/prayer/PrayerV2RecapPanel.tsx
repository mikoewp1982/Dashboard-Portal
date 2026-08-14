import { useMemo, useState } from "react";
import { Download, Calendar, List, Printer, Search } from "lucide-react";
import { exportToExcel } from "@/utils/export";
import { createStudentDateKey, pickNewestLog, toDateKey } from "@/utils/presensiRules";
import { normalizeClassName as normalizeClassCompact } from "@/lib/guru/normalizeClass";
import { isMaleStudent, isNonMuslim } from "@/lib/guru/studentIdentity";
import {
  GasClassRef,
  GasStudentRef,
  PrayerLogV2,
  PrayerTypeV2,
} from "@/hooks/gas/attendance/useGasPrayerAttendanceV2";
import {
  PrayerClassSchedule,
  PrayerDateOverride,
  PrayerTypeConfig,
  PrayerTypeId,
} from "@/types/gasPrayerConfig";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const formatPrayerTime = (timestamp?: number | null) => {
  if (!timestamp) return "-";
  return new Date(timestamp)
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(".", ":");
};

const STATUS_LABELS: Record<string, string> = {
  PRAY: "Sudah Presensi",
  NOT_PRAY: "Tidak Sholat",
  PERMIT: "Izin",
  HALANGAN: "Halangan",
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

const readStudentClassName = (student: GasStudentRef) =>
  String(student.className || student.class || student.kelas || "").trim();

const readStudentReligion = (student: GasStudentRef) =>
  String(student.religion || student.agama || "").trim();

const readStudentGender = (student: GasStudentRef) =>
  String(student.gender || student.jenis_kelamin || "").trim();

const studentIdentityCandidates = (student: GasStudentRef) => {
  const candidates = [student.recordId, student.id, student.nisn, student.username]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return candidates.filter((v, i) => candidates.indexOf(v) === i);
};

const buildStudentIdentityMap = (students: GasStudentRef[]) => {
  const map = new Map<string, GasStudentRef>();
  students.forEach((student) => {
    studentIdentityCandidates(student).forEach((id) => {
      const key = id.toLowerCase();
      if (!map.has(key)) map.set(key, student);
    });
  });
  return map;
};

const matchStudentFromLog = (log: PrayerLogV2, map: Map<string, GasStudentRef>) => {
  const keys = [log.studentId, log.nisn, log.username].map((v) => String(v || "").trim().toLowerCase()).filter(Boolean);
  for (const key of keys) {
    const hit = map.get(key);
    if (hit) return hit;
  }
  return undefined;
};

const buildDatesInMonthUpToToday = (year: number, month: number) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  if (year > currentYear || (year === currentYear && month > currentMonth)) return [];

  const total = new Date(year, month, 0).getDate();
  const limitDay = year === currentYear && month === currentMonth ? today.getDate() : total;
  const result: Date[] = [];
  for (let day = 1; day <= limitDay; day += 1) {
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    result.push(date);
  }
  return result;
};

const toPrayerTypeV2 = (value: PrayerTypeId): PrayerTypeV2 => (value === "JUMAT" ? "JUMAT" : "DHUHA");

function isScheduledForClass(
  prayerType: PrayerTypeV2,
  dateKey: string,
  dayOfWeek: number,
  className: string,
  schedules: PrayerClassSchedule[],
  overrides: PrayerDateOverride[]
) {
  const normalizedClass = normalizeClassCompact(className);
  if (!normalizedClass) return false;

  const isClassMatch = (candidate: string) => normalizeClassCompact(candidate) === normalizedClass;

  const off = overrides.find(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "deactivate" &&
      item.classIds.some(isClassMatch)
  );
  if (off) return false;

  const on = overrides.find(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.date === dateKey &&
      item.action === "activate" &&
      item.classIds.some(isClassMatch)
  );
  if (on) return true;

  return schedules.some(
    (item) =>
      (item.prayerType === "DHUHA" || item.prayerType === "JUMAT") &&
      item.prayerType === prayerType &&
      item.active &&
      item.dayOfWeek === dayOfWeek &&
      item.classIds.some(isClassMatch)
  );
}

interface Props {
  classes: GasClassRef[];
  students: GasStudentRef[];
  logs: PrayerLogV2[];
  prayerTypes: PrayerTypeConfig[];
  schedules: PrayerClassSchedule[];
  overrides: PrayerDateOverride[];
  configLoading: boolean;
  selectedPrayerType: PrayerTypeId;
  setSelectedPrayerType: (v: PrayerTypeId) => void;
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  selectedClassName: string;
  setSelectedClassName: (v: string) => void;
}

export function PrayerV2RecapPanel({
  classes,
  students,
  logs,
  prayerTypes,
  schedules,
  overrides,
  configLoading,
  selectedPrayerType,
  setSelectedPrayerType,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedClassName,
  setSelectedClassName,
}: Props) {
  const dropdownClassName =
    "px-3 py-2 rounded-md border border-slate-500/70 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/60";

  const [viewMode, setViewMode] = useState<"summary" | "daily">("summary");
  const [searchQuery, setSearchQuery] = useState("");

  const prayerConfig = useMemo(() => prayerTypes.find((item) => item.id === selectedPrayerType), [prayerTypes, selectedPrayerType]);
  const effectivePrayerType = useMemo(() => toPrayerTypeV2(selectedPrayerType), [selectedPrayerType]);

  const scopedStudents = useMemo(() => {
    const requireMuslim = prayerConfig?.requireMuslim !== false;
    const eligibleGender = prayerConfig?.eligibleGender || "all";

    return (students || []).filter((student) => {
      if (requireMuslim && isNonMuslim(readStudentReligion(student))) return false;
      if (eligibleGender === "male" && !isMaleStudent(readStudentGender(student))) return false;
      if (eligibleGender === "female" && isMaleStudent(readStudentGender(student))) return false;
      return true;
    });
  }, [prayerConfig?.eligibleGender, prayerConfig?.requireMuslim, students]);

  const filteredStudents = useMemo(() => {
    let result = scopedStudents;
    if (selectedClassName) {
      result = result.filter((s) => readStudentClassName(s) === selectedClassName);
    }
    if (searchQuery) {
      const queryText = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const name = String(s.name || "").toLowerCase();
        const nisn = String(s.nisn || "");
        return name.includes(queryText) || nisn.includes(queryText);
      });
    }
    return result;
  }, [scopedStudents, searchQuery, selectedClassName]);

  const studentIdentityMap = useMemo(() => buildStudentIdentityMap(students || []), [students]);

  const logMap = useMemo(() => {
    const grouped = new Map<string, PrayerLogV2>();
    for (const log of logs || []) {
      const student = matchStudentFromLog(log, studentIdentityMap);
      if (!student) continue;
      const dateKey = toDateKey(log.date);
      const rowKey = createStudentDateKey(student.id, dateKey);
      grouped.set(rowKey, pickNewestLog(grouped.get(rowKey), log));
    }
    return grouped;
  }, [logs, studentIdentityMap]);

  const monthDates = useMemo(() => buildDatesInMonthUpToToday(selectedYear, selectedMonth), [selectedMonth, selectedYear]);

  const monthlySummaryRows = useMemo(() => {
    const enabled = prayerConfig?.enabled !== false;
    const sortedStudents = [...filteredStudents].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "id-ID"));

    return sortedStudents.map((student) => {
      const className = readStudentClassName(student);
      let wajib = 0;
      let pray = 0;
      let notPray = 0;
      let permit = 0;
      let halangan = 0;

      if (enabled && className) {
        for (const date of monthDates) {
          const dateKey = toDateKey(date);
          const scheduled = isScheduledForClass(
            effectivePrayerType,
            dateKey,
            date.getDay(),
            className,
            schedules || [],
            overrides || []
          );
          if (!scheduled) continue;
          wajib += 1;

          const log = logMap.get(createStudentDateKey(student.id, dateKey));
          const status = log?.status || "NOT_PRAY";
          if (status === "PRAY") pray += 1;
          else if (status === "PERMIT") permit += 1;
          else if (status === "HALANGAN") halangan += 1;
          else notPray += 1;
        }
      }

      return {
        student,
        wajib,
        pray,
        permit,
        halangan,
        notPray,
        percentage: wajib > 0 ? String(Math.round((pray / wajib) * 100)) : "-",
      };
    });
  }, [effectivePrayerType, filteredStudents, logMap, monthDates, overrides, prayerConfig?.enabled, schedules]);

  const dailyRows = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    return (logs || [])
      .map((log) => {
        const student = matchStudentFromLog(log, studentIdentityMap);
        const name = student?.name || log.studentName || "Siswa";
        const nisn = student?.nisn || log.nisn || "-";
        const className = readStudentClassName(student || { id: "", className: log.classNameSnapshot || "" }) || log.classNameSnapshot || "-";
        return {
          id: log.id,
          date: log.date,
          status: log.status,
          recordedTime: Number(log.createdAt || log.updatedAt || log.date || 0) || null,
          studentName: name,
          studentNisn: nisn,
          studentClass: className,
          notes: log.notes || "",
        };
      })
      .filter((row) => {
        if (selectedClassName && row.studentClass !== selectedClassName) return false;
        if (!queryText) return true;
        if (row.studentName.toLowerCase().includes(queryText)) return true;
        if (String(row.studentNisn || "").includes(queryText)) return true;
        return false;
      })
      .sort((a, b) => b.date - a.date);
  }, [logs, searchQuery, selectedClassName, studentIdentityMap]);

  const prayerLabel = selectedPrayerType === "JUMAT" ? "Jumat" : "Dhuha";

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (viewMode === "summary") {
      const exportData = monthlySummaryRows.map((r) => ({
        NISN: r.student.nisn,
        "Nama Siswa": r.student.name,
        Kelas: readStudentClassName(r.student),
        Wajib: r.wajib,
        Sh: r.pray,
        TS: r.notPray,
        I: r.permit,
        Hal: r.halangan,
        Persentase: r.percentage === "-" ? "-" : `${r.percentage}%`,
      }));
      exportToExcel(exportData, `Rekap_${prayerLabel}_${MONTHS[selectedMonth - 1]}_${selectedYear}`);
    } else {
      const exportData = dailyRows.map((l) => ({
        Tanggal: new Date(l.date).toLocaleDateString("id-ID"),
        "Jam Presensi": getDisplayPrayerTime(l.status, l.recordedTime),
        NISN: l.studentNisn,
        "Nama Siswa": l.studentName,
        Kelas: l.studentClass,
        Status: STATUS_LABELS[l.status] || l.status,
        Keterangan: l.notes || "-",
      }));
      exportToExcel(exportData, `Riwayat_${prayerLabel}_${MONTHS[selectedMonth - 1]}_${selectedYear}`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area-v2, #print-area-v2 * { visibility: visible; }
          #print-area-v2 {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 20px; background: white; z-index: 9999;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 12px; }
          th, td { border: 1px solid black !important; padding: 4px 8px !important; color: black !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>

      <div className="rounded-lg bg-slate-900/50 p-4 shadow-sm border border-slate-700/60 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <select value={selectedPrayerType} onChange={(e) => setSelectedPrayerType(e.target.value as PrayerTypeId)} className={dropdownClassName}>
            <option value="DHUHA">Dhuha</option>
            <option value="JUMAT">Jum'at</option>
          </select>

          <select value={selectedClassName} onChange={(e) => setSelectedClassName(e.target.value)} className={dropdownClassName}>
            <option value="">Semua Kelas</option>
            {classes.map((c) => {
              const label = c.className || c.name || c.id;
              return (
                <option key={c.id} value={label}>
                  {label}
                </option>
              );
            })}
          </select>

          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className={dropdownClassName}>
            {MONTHS.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={dropdownClassName}>
            {Array.from({ length: 2040 - 2024 + 1 }, (_, i) => 2024 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
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
            viewMode === "summary" ? "bg-slate-800/80 text-blue-300 shadow" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <List className="h-4 w-4" />
          Rekap Bulanan
        </button>
        <button
          onClick={() => setViewMode("daily")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            viewMode === "daily" ? "bg-slate-800/80 text-blue-300 shadow" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Riwayat Harian
        </button>
      </div>

      <div id="print-area-v2">
        <div className="mb-6 hidden text-center print:block">
          <h2 className="text-xl font-semibold text-black">
            {viewMode === "summary" ? `Laporan Rekapitulasi ${prayerLabel}` : `Laporan Riwayat Presensi ${prayerLabel}`}
          </h2>
          <div className="mt-2 flex justify-center gap-8 font-medium text-black">
            <p>Kelas: {selectedClassName || "Semua Kelas"}</p>
            <p>
              Periode: {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
          <div className="mt-4 border-b-2 border-black"></div>
        </div>

        {configLoading ? (
          <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-6 py-10 text-center text-sm text-slate-400">
            Memuat konfigurasi sholat...
          </div>
        ) : viewMode === "summary" ? (
          <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-10">No</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">NISN</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Nama Siswa</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
                    <th className="bg-slate-950/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Wajib</th>
                    <th className="bg-green-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Sh</th>
                    <th className="bg-red-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">TS</th>
                    <th className="bg-blue-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">I</th>
                    <th className="bg-purple-900/20 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Hal</th>
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
                        <td className="px-6 py-4 text-center text-sm text-slate-400">{readStudentClassName(item.student) || "-"}</td>
                        <td className="bg-slate-950/10 px-6 py-4 text-center text-sm font-bold text-slate-200">{item.wajib}</td>
                        <td className="bg-green-900/10 px-6 py-4 text-center text-sm font-bold text-green-400">{item.pray}</td>
                        <td className="bg-red-900/10 px-6 py-4 text-center text-sm font-bold text-red-400">{item.notPray}</td>
                        <td className="bg-blue-900/10 px-6 py-4 text-center text-sm font-bold text-blue-400">{item.permit}</td>
                        <td className="bg-purple-900/10 px-6 py-4 text-center text-sm font-bold text-purple-400">{item.halangan}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-200">
                          {item.percentage === "-" ? "-" : `${item.percentage}%`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-10 text-center text-sm text-slate-500">
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
                  {dailyRows.length > 0 ? (
                    dailyRows.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(log.date).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-sm text-slate-100">
                          {getDisplayPrayerTime(log.status, log.recordedTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                          {log.studentName}
                          <div className="text-xs text-slate-400 font-normal">{log.studentNisn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">{log.studentClass}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 text-xs font-bold leading-5 ${STATUS_BADGE_CLASSES[log.status] || STATUS_BADGE_CLASSES.NOT_PRAY}`}>
                            {STATUS_LABELS[log.status] || log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{log.notes || "-"}</td>
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
