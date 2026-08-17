"use client";

import { useMemo } from "react";
import { Activity, AlertCircle, CalendarDays, UserCheck, UserMinus, UserRound, UserX } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createStudentDateKey, pickNewestLog, toDateKey } from "@/utils/presensiRules";
import { isMaleStudent, isNonMuslim } from "@/lib/guru/studentIdentity";
import {
  GasClassRef,
  GasStudentRef,
  PrayerLogV2,
} from "@/hooks/gas/attendance/useGasPrayerAttendanceV2";
import {
  PrayerClassSchedule,
  PrayerDateOverride,
  PrayerTypeConfig,
  PrayerTypeId,
} from "@/types/gasPrayerConfig";
import {
  PRAYER_V2_MONTHS,
  buildClassLabelMap,
  buildDatesInMonthUpToToday,
  buildStudentIdentityMap,
  isScheduledForClass,
  matchStudentFromLog,
  readStudentClassName,
  readStudentGender,
  readStudentReligion,
  toPrayerTypeV2,
} from "./prayerV2Shared";

const CHART_COLORS = {
  pray: "#34d399",
  notPray: "#f87171",
  permit: "#60a5fa",
  exception: "#c084fc",
};

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

export function PrayerV2StatisticsPanel({
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

  const prayerConfig = useMemo(
    () => prayerTypes.find((item) => item.id === selectedPrayerType),
    [prayerTypes, selectedPrayerType]
  );
  const effectivePrayerType = useMemo(() => toPrayerTypeV2(selectedPrayerType), [selectedPrayerType]);
  const prayerLabel = selectedPrayerType === "JUMAT" ? "Jumat" : "Dhuha";

  const classLabelMap = useMemo(() => buildClassLabelMap(classes), [classes]);

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
    if (!selectedClassName) return scopedStudents;
    return scopedStudents.filter((s) => readStudentClassName(s) === selectedClassName);
  }, [scopedStudents, selectedClassName]);

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

  const monthDates = useMemo(
    () => buildDatesInMonthUpToToday(selectedYear, selectedMonth),
    [selectedMonth, selectedYear]
  );

  const summary = useMemo(() => {
    const enabled = prayerConfig?.enabled !== false;
    const totals = {
      pray: 0,
      notPray: 0,
      permit: 0,
      halangan: 0,
      wajib: 0,
      activeStudents: filteredStudents.length,
      scheduledDays: 0,
    };

    const scheduledDateSet = new Set<string>();
    const classMap = new Map<string, { className: string; sholat: number; tidakSholat: number; izin: number }>();

    if (enabled) {
      for (const student of filteredStudents) {
        const className = readStudentClassName(student) || "-";
        if (!classMap.has(className)) {
          classMap.set(className, { className, sholat: 0, tidakSholat: 0, izin: 0 });
        }

        for (const date of monthDates) {
          const dateKey = toDateKey(date);
          const scheduled = isScheduledForClass(
            effectivePrayerType,
            dateKey,
            date.getDay(),
            className,
            schedules || [],
            overrides || [],
            classLabelMap
          );
          if (!scheduled) continue;

          scheduledDateSet.add(dateKey);
          totals.wajib += 1;

          const log = logMap.get(createStudentDateKey(student.id, dateKey));
          const status = log?.status || "NOT_PRAY";

          if (status === "PRAY") {
            totals.pray += 1;
            classMap.get(className)!.sholat += 1;
            continue;
          }
          if (status === "PERMIT") {
            totals.permit += 1;
            classMap.get(className)!.izin += 1;
            continue;
          }
          if (status === "HALANGAN") {
            totals.halangan += 1;
            continue;
          }

          totals.notPray += 1;
          classMap.get(className)!.tidakSholat += 1;
        }
      }
    }

    totals.scheduledDays = scheduledDateSet.size;
    const prayRate = totals.wajib > 0 ? Math.round((totals.pray / totals.wajib) * 100) : 0;
    const notPrayRate = totals.wajib > 0 ? Math.round((totals.notPray / totals.wajib) * 100) : 0;

    return {
      totals: { ...totals, prayRate, notPrayRate },
      classChartData: Array.from(classMap.values()).sort((a, b) =>
        a.className.localeCompare(b.className, "id-ID")
      ),
    };
  }, [
    classLabelMap,
    effectivePrayerType,
    filteredStudents,
    logMap,
    monthDates,
    overrides,
    prayerConfig?.enabled,
    schedules,
  ]);

  const topStudentsByStatus = useMemo(() => {
    type Tally = {
      id: string;
      name: string;
      className: string;
      notPray: number;
      permit: number;
      halangan: number;
      pray: number;
      wajib: number;
    };

    const enabled = prayerConfig?.enabled !== false;
    const byStudent = new Map<string, Tally>();

    for (const student of filteredStudents) {
      const id = String(student.id || "");
      if (!id) continue;
      byStudent.set(id, {
        id,
        name: String(student.name || "Tanpa nama"),
        className: readStudentClassName(student) || "-",
        notPray: 0,
        permit: 0,
        halangan: 0,
        pray: 0,
        wajib: 0,
      });
    }

    if (enabled) {
      for (const student of filteredStudents) {
        const id = String(student.id || "");
        const tally = byStudent.get(id);
        if (!tally) continue;
        const className = tally.className;

        for (const date of monthDates) {
          const dateKey = toDateKey(date);
          const scheduled = isScheduledForClass(
            effectivePrayerType,
            dateKey,
            date.getDay(),
            className,
            schedules || [],
            overrides || [],
            classLabelMap
          );
          if (!scheduled) continue;

          tally.wajib += 1;
          const log = logMap.get(createStudentDateKey(id, dateKey));
          const status = log?.status || "NOT_PRAY";

          if (status === "HALANGAN") {
            tally.halangan += 1;
            continue;
          }
          if (status === "PERMIT") {
            tally.permit += 1;
            continue;
          }
          if (status === "PRAY") {
            tally.pray += 1;
            continue;
          }
          tally.notPray += 1;
        }
      }
    }

    const list = Array.from(byStudent.values());
    const pickTop = (key: keyof Pick<Tally, "notPray" | "permit" | "halangan">) => {
      const sorted = [...list].sort((a, b) => {
        if (b[key] !== a[key]) return b[key] - a[key];
        return a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" });
      });
      const top = sorted[0];
      if (!top || top[key] <= 0) return { name: "—", className: "", count: 0 };
      return { name: top.name, className: top.className, count: top[key] };
    };

    const pickFewestPray = () => {
      const eligible = list.filter((item) => item.wajib > 0);
      if (eligible.length === 0) return { name: "—", className: "", count: 0 };
      const sorted = [...eligible].sort((a, b) => {
        if (a.pray !== b.pray) return a.pray - b.pray;
        return a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" });
      });
      const top = sorted[0];
      return { name: top.name, className: top.className, count: top.pray };
    };

    return {
      notPray: pickTop("notPray"),
      permit: pickTop("permit"),
      halangan: pickTop("halangan"),
      fewestPray: pickFewestPray(),
    };
  }, [
    classLabelMap,
    effectivePrayerType,
    filteredStudents,
    logMap,
    monthDates,
    overrides,
    prayerConfig?.enabled,
    schedules,
  ]);

  const pieData = useMemo(
    () =>
      [
        { name: "Sudah Presensi", value: summary.totals.pray, color: CHART_COLORS.pray },
        { name: "Tidak Sholat", value: summary.totals.notPray, color: CHART_COLORS.notPray },
        { name: "Izin", value: summary.totals.permit, color: CHART_COLORS.permit },
        { name: "Halangan", value: summary.totals.halangan, color: CHART_COLORS.exception },
      ].filter((item) => item.value > 0),
    [summary.totals]
  );

  const insightItems = useMemo(() => {
    const topPrayClass = [...summary.classChartData].sort((a, b) => b.sholat - a.sholat)[0];
    const topNotPrayClass = [...summary.classChartData].sort((a, b) => b.tidakSholat - a.tidakSholat)[0];
    return [
      {
        label: `Persentase ${prayerLabel}`,
        value: `${summary.totals.prayRate}%`,
        description: `Sudah presensi dibanding total slot wajib ${prayerLabel.toLowerCase()}.`,
      },
      {
        label: "Total Slot Wajib",
        value: `${summary.totals.wajib}`,
        description: "Dihitung dari jadwal per kelas + override tanggal hingga hari ini.",
      },
      {
        label: `Kelas ${prayerLabel} Tertinggi`,
        value: topPrayClass ? `${topPrayClass.className} (${topPrayClass.sholat})` : "-",
        description: "Kelas dengan jumlah sudah presensi terbanyak pada filter aktif.",
      },
      {
        label: "Kelas TS Tertinggi",
        value: topNotPrayClass ? `${topNotPrayClass.className} (${topNotPrayClass.tidakSholat})` : "-",
        description: "Termasuk hari wajib tanpa log yang dihitung sebagai tidak sholat.",
      },
    ];
  }, [prayerLabel, summary.classChartData, summary.totals.prayRate, summary.totals.wajib]);

  if (configLoading) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-6 py-10 text-center text-sm text-slate-400">
        Memuat konfigurasi sholat...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-900/50 p-4 shadow-sm border border-slate-700/60">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
          <select
            value={selectedPrayerType}
            onChange={(e) => setSelectedPrayerType(e.target.value as PrayerTypeId)}
            className={dropdownClassName}
          >
            <option value="DHUHA">Dhuha</option>
            <option value="JUMAT">Jum'at</option>
          </select>

          <select
            value={selectedClassName}
            onChange={(e) => setSelectedClassName(e.target.value)}
            className={dropdownClassName}
          >
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

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value, 10))}
            className={dropdownClassName}
          >
            {PRAYER_V2_MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
            className={dropdownClassName}
          >
            {Array.from({ length: 2040 - 2024 + 1 }, (_, index) => 2024 + index).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsMiniCard
          title="Siswa Eligible"
          value={summary.totals.activeStudents}
          description={`Siswa yang memenuhi aturan ${prayerLabel.toLowerCase()} pada filter aktif`}
          icon={UserCheck}
          accent="cyan"
        />
        <StatsMiniCard
          title="Hari Jadwal Aktif"
          value={summary.totals.scheduledDays}
          description="Tanggal unik yang wajib menurut jadwal/override kelas"
          icon={CalendarDays}
          accent="blue"
        />
        <StatsMiniCard
          title={`Persentase ${prayerLabel}`}
          value={`${summary.totals.prayRate}%`}
          description="Sudah presensi dibanding total slot wajib"
          icon={Activity}
          accent="green"
        />
        <StatsMiniCard
          title="Tidak Sholat"
          value={`${summary.totals.notPrayRate}%`}
          description="TS dibanding total slot wajib"
          icon={AlertCircle}
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopStudentCard
          title="Paling Sering Tidak Sholat (TS)"
          student={topStudentsByStatus.notPray}
          unitLabel="hari"
          icon={UserX}
          accent="red"
        />
        <TopStudentCard
          title="Paling Sering Izin (I)"
          student={topStudentsByStatus.permit}
          unitLabel="hari"
          icon={UserRound}
          accent="blue"
        />
        <TopStudentCard
          title="Paling Sering Halangan (Hal)"
          student={topStudentsByStatus.halangan}
          unitLabel="hari"
          icon={UserMinus}
          accent="purple"
        />
        <TopStudentCard
          title={`Paling Sedikit ${prayerLabel}`}
          student={topStudentsByStatus.fewestPray}
          unitLabel="hari"
          icon={AlertCircle}
          accent="amber"
          emptyWhenZero={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-slate-900/50 p-6 shadow-sm border border-slate-700/60">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Komposisi Status {prayerLabel}</h3>
            <p className="mt-1 text-sm text-slate-400">
              Hanya hari wajib kelas (jadwal + override). Hari tanpa log dihitung sebagai tidak sholat.
            </p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={110} paddingAngle={4}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<StatisticsTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LegendPill label="Sudah Presensi" value={summary.totals.pray} color={CHART_COLORS.pray} />
            <LegendPill label="Tidak Sholat" value={summary.totals.notPray} color={CHART_COLORS.notPray} />
            <LegendPill label="Izin" value={summary.totals.permit} color={CHART_COLORS.permit} />
            <LegendPill label="Halangan" value={summary.totals.halangan} color={CHART_COLORS.exception} />
          </div>
        </div>

        <div className="rounded-lg bg-slate-900/50 p-6 shadow-sm border border-slate-700/60">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Perbandingan Antar Kelas</h3>
            <p className="mt-1 text-sm text-slate-400">
              Agregat sudah presensi, tidak sholat, dan izin per kelas pada periode terpilih.
            </p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.classChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="className" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip content={<StatisticsTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="sholat" name="Sudah Presensi" fill={CHART_COLORS.pray} radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="tidakSholat" name="Tidak Sholat" fill={CHART_COLORS.notPray} radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="izin" name="Izin" fill={CHART_COLORS.permit} radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {insightItems.map((item) => (
          <div key={item.label} className="rounded-lg bg-slate-900/50 p-5 shadow-sm border border-slate-700/60">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{item.label}</div>
            <div className="mt-3 text-2xl font-bold text-slate-100">{item.value}</div>
            <p className="mt-2 text-sm text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopStudentCard({
  title,
  student,
  unitLabel,
  icon: Icon,
  accent,
  emptyWhenZero = true,
}: {
  title: string;
  student: { name: string; className: string; count: number };
  unitLabel: string;
  icon: typeof UserCheck;
  accent: "red" | "purple" | "blue" | "amber";
  emptyWhenZero?: boolean;
}) {
  const accentMap = {
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  }[accent];

  const showEmpty = (emptyWhenZero && student.count <= 0) || student.name === "—";

  return (
    <div className="rounded-lg bg-slate-900/50 p-5 shadow-sm border border-slate-700/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</div>
          <div className="mt-3 truncate text-lg font-bold text-slate-100" title={student.name}>
            {showEmpty ? "—" : student.name}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {showEmpty ? "Belum ada data pada filter ini" : `${student.className} · ${student.count} ${unitLabel}`}
          </p>
        </div>
        <div className={`rounded-xl border p-3 shrink-0 ${accentMap}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatsMiniCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof UserCheck;
  accent: "green" | "red" | "purple" | "cyan" | "blue";
}) {
  const accentMap = {
    green: "bg-green-500/10 text-green-300 border-green-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  }[accent];

  return (
    <div className="rounded-lg bg-slate-900/50 p-5 shadow-sm border border-slate-700/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</div>
          <div className="mt-3 text-3xl font-bold text-slate-100">{value}</div>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
        <div className={`rounded-xl border p-3 ${accentMap}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatisticsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[140px] rounded-xl border border-slate-600/80 bg-slate-950/95 px-3 py-2.5 shadow-2xl shadow-slate-950/60">
      {label ? <div className="mb-2 text-sm font-semibold text-slate-100">{label}</div> : null}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium text-slate-200">{entry.name}</span>
            </div>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}
