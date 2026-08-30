import { useMemo } from "react";
import { Activity, CalendarDays, Clock, ShieldAlert, UserCheck, UserMinus, UserRound, UserX } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compareClassNames, createStudentDateKey, getValidDatesInMonth, pickNewestLog, toDateKey } from "@/utils/presensiRules";
import { AttendanceRecord, AttendanceSource } from "@/types/gas";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const CHART_COLORS = {
  present: "#34d399",
  late: "#fbbf24",
  sick: "#60a5fa",
  permit: "#c084fc",
  absent: "#f87171",
};

const SOURCE_META: Record<AttendanceSource, { label: string; accent: string }> = {
  SELF: { label: "Siswa", accent: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  TEACHER_MANUAL: { label: "Wali Kelas", accent: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  CLASS_SECRETARY: { label: "Sekretaris Kelas", accent: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  ADMIN_MANUAL: { label: "Admin", accent: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20" },
  SYSTEM: { label: "Sistem", accent: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  MANUAL: { label: "Input Manual", accent: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
};

function isPendingTeacherVerification(log: Pick<AttendanceRecord, "verificationStatus"> | null | undefined) {
  return String(log?.verificationStatus || "").trim().toUpperCase() === "PENDING_TEACHER";
}

function hasSecretaryProposal(
  log:
    | Pick<AttendanceRecord, "proposedBy" | "proposedStatus" | "source" | "verificationStatus">
    | null
    | undefined
) {
  const proposedBy = String(log?.proposedBy || "").trim().toLowerCase();
  const proposedStatus = String(log?.proposedStatus || "").trim();
  const source = String(log?.source || "").trim().toUpperCase();

  return (
    proposedBy.includes("sekretaris kelas") ||
    proposedStatus.length > 0 ||
    (source === "CLASS_SECRETARY" && isPendingTeacherVerification(log))
  );
}

interface Props {
  classes: any[];
  students: any[];
  attendances: AttendanceRecord[];
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  selectedClassName: string;
  setSelectedClassName: (v: string) => void;
  schedules: any[];
  holidays: any[];
}

export function AttendanceStatisticsPanel({
  classes,
  students,
  attendances,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedClassName,
  setSelectedClassName,
  schedules,
  holidays
}: Props) {
  const dropdownClassName =
    "px-3 py-2 rounded-md border border-slate-500/70 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/60";
  
  const filteredStudents = useMemo(() => {
    if (!selectedClassName) return students || [];
    return (students || []).filter((s) => (s.class || s.className) === selectedClassName);
  }, [students, selectedClassName]);

  const validDates = useMemo(
    () => getValidDatesInMonth({ year: selectedYear, month: selectedMonth, schedules, holidays }),
    [selectedMonth, selectedYear, schedules, holidays]
  );

  const filteredLogs = useMemo(() => {
    const validDateSet = new Set(validDates.map((date) => toDateKey(date)));
    const grouped = new Map<string, any>();

    for (const log of attendances || []) {
      const canonicalId = log.studentId;
      if (!canonicalId) continue;

      const date = new Date(log.date);
      if (date.getMonth() + 1 !== selectedMonth || date.getFullYear() !== selectedYear) continue;

      const dateKey = toDateKey(date);
      if (!validDateSet.has(dateKey)) continue;

      const key = createStudentDateKey(canonicalId, dateKey);
      grouped.set(key, pickNewestLog(grouped.get(key), log));
    }
    return grouped;
  }, [attendances, selectedMonth, selectedYear, validDates]);

  const summary = useMemo(() => {
    const totals = {
      present: 0,
      late: 0,
      sick: 0,
      permit: 0,
      absent: 0,
      totalValidSlots: 0,
      effectiveObligation: 0,
      activeStudents: filteredStudents.length,
      validDays: validDates.length,
    };

    const classMap = new Map<string, any>();

    for (const student of filteredStudents) {
      const canonicalId = student.id;
      const className = student.class || student.className || "UNKNOWN";

      if (className && !classMap.has(className)) {
        classMap.set(className, { className, hadir: 0, terlambat: 0, alpha: 0 });
      }

      for (const date of validDates) {
        const dateKey = toDateKey(date);
        const log = filteredLogs.get(createStudentDateKey(canonicalId, dateKey));
        totals.totalValidSlots += 1;

        if (!log || log.status === "ALPHA" || isPendingTeacherVerification(log)) {
          totals.absent += 1;
          totals.effectiveObligation += 1;
          if (className) classMap.get(className).alpha += 1;
          continue;
        }

        if (log.status === "PRESENT") {
          totals.present += 1;
          totals.effectiveObligation += 1;
          if (className) classMap.get(className).hadir += 1;
          continue;
        }

        if (log.status === "LATE") {
          totals.late += 1;
          totals.effectiveObligation += 1;
          if (className) classMap.get(className).terlambat += 1;
          continue;
        }

        if (log.status === "SAKIT") { totals.sick += 1; continue; }
        if (log.status === "IZIN") { totals.permit += 1; continue; }

        totals.absent += 1;
        totals.effectiveObligation += 1;
        if (className) classMap.get(className).alpha += 1;
      }
    }

    const attendanceRate = totals.effectiveObligation > 0
      ? Math.round(((totals.present + totals.late) / totals.effectiveObligation) * 100)
      : 0;
    const pureAttendanceRate = totals.effectiveObligation > 0
      ? Math.round((totals.present / totals.effectiveObligation) * 100)
      : 0;
    const violationRate = totals.effectiveObligation > 0
      ? Math.round(((totals.late + totals.absent) / totals.effectiveObligation) * 100)
      : 0;

    return {
      totals: { ...totals, attendanceRate, pureAttendanceRate, violationRate },
      classChartData: Array.from(classMap.values()).sort((a, b) => compareClassNames(a.className, b.className)),
    };
  }, [filteredLogs, filteredStudents, validDates]);

  const topStudentsByStatus = useMemo(() => {
    type Tally = { id: string; name: string; className: string; absent: number; late: number; sick: number; permit: number };
    const byStudent = new Map<string, Tally>();

    for (const student of filteredStudents) {
      const id = String(student.id || "");
      if (!id) continue;
      byStudent.set(id, {
        id,
        name: String(student.name || "Tanpa nama"),
        className: String(student.class || student.className || "-"),
        absent: 0,
        late: 0,
        sick: 0,
        permit: 0,
      });
    }

    for (const student of filteredStudents) {
      const id = String(student.id || "");
      const tally = byStudent.get(id);
      if (!tally) continue;

      for (const date of validDates) {
        const dateKey = toDateKey(date);
        const log = filteredLogs.get(createStudentDateKey(id, dateKey));

        if (!log || log.status === "ALPHA" || isPendingTeacherVerification(log)) {
          tally.absent += 1;
          continue;
        }
        if (log.status === "LATE") {
          tally.late += 1;
          continue;
        }
        if (log.status === "SAKIT") {
          tally.sick += 1;
          continue;
        }
        if (log.status === "IZIN") {
          tally.permit += 1;
        }
      }
    }

    const list = Array.from(byStudent.values());
    const pickTop = (key: keyof Pick<Tally, "absent" | "late" | "sick" | "permit">) => {
      const sorted = [...list].sort((a, b) => {
        if (b[key] !== a[key]) return b[key] - a[key];
        return a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" });
      });
      const top = sorted[0];
      if (!top || top[key] <= 0) {
        return { name: "—", className: "", count: 0 };
      }
      return { name: top.name, className: top.className, count: top[key] };
    };

    return {
      absent: pickTop("absent"),
      late: pickTop("late"),
      sick: pickTop("sick"),
      permit: pickTop("permit"),
    };
  }, [filteredLogs, filteredStudents, validDates]);

  const pieData = useMemo(() => ([
    { name: "Hadir", value: summary.totals.present, color: CHART_COLORS.present },
    { name: "Terlambat", value: summary.totals.late, color: CHART_COLORS.late },
    { name: "Sakit", value: summary.totals.sick, color: CHART_COLORS.sick },
    { name: "Izin", value: summary.totals.permit, color: CHART_COLORS.permit },
    { name: "Tidak Hadir", value: summary.totals.absent, color: CHART_COLORS.absent },
  ]).filter((item) => item.value > 0), [summary.totals]);

  const sourceBreakdown = useMemo(() => {
    const totals: Record<AttendanceSource, number> = {
      SELF: 0,
      TEACHER_MANUAL: 0,
      CLASS_SECRETARY: 0,
      ADMIN_MANUAL: 0,
      SYSTEM: 0,
      MANUAL: 0,
    };

    for (const student of filteredStudents) {
      const id = String(student.id || "");
      if (!id) continue;

      for (const date of validDates) {
        const dateKey = toDateKey(date);
        const log = filteredLogs.get(createStudentDateKey(id, dateKey));
        const source = (log?.source as AttendanceSource | undefined) || "SYSTEM";
        if (totals[source] !== undefined) {
          totals[source] += 1;
          continue;
        }
        totals.MANUAL += 1;
      }
    }

    return totals;
  }, [filteredLogs, filteredStudents, validDates]);

  const secretaryVerificationStats = useMemo(() => {
    let pending = 0;
    let approved = 0;

    for (const student of filteredStudents) {
      const id = String(student.id || "");
      if (!id) continue;

      for (const date of validDates) {
        const dateKey = toDateKey(date);
        const log = filteredLogs.get(createStudentDateKey(id, dateKey));
        if (!hasSecretaryProposal(log)) continue;

        if (isPendingTeacherVerification(log)) {
          pending += 1;
        } else {
          approved += 1;
        }
      }
    }

    return { pending, approved };
  }, [filteredLogs, filteredStudents, validDates]);

  const insightItems = useMemo(() => {
    const topAbsentClass = [...summary.classChartData].sort((a, b) => b.alpha - a.alpha)[0];
    const topLateClass = [...summary.classChartData].sort((a, b) => b.terlambat - a.terlambat)[0];

    return [
      {
        label: "Hadir Tepat Waktu",
        value: `${summary.totals.pureAttendanceRate}%`,
        description: "Hanya menghitung hadir normal dari total wajib hadir.",
      },
      {
        label: "Total Wajib Hadir",
        value: `${summary.totals.effectiveObligation}`,
        description: "Total kewajiban presensi setelah sakit dan izin dikecualikan.",
      },
      {
        label: "Kelas Tidak Hadir Tertinggi",
        value: topAbsentClass ? `${topAbsentClass.className} (${topAbsentClass.alpha})` : "-",
        description: "Termasuk hari sekolah aktif tanpa log yang otomatis dianggap tidak hadir.",
      },
      {
        label: "Kelas Terlambat Tertinggi",
        value: topLateClass ? `${topLateClass.className} (${topLateClass.terlambat})` : "-",
        description: "Terlambat tetap dihitung hadir, tetapi tetap masuk pelanggaran disiplin.",
      },
    ];
  }, [summary.classChartData, summary.totals.effectiveObligation, summary.totals.pureAttendanceRate]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-900/50 p-4 shadow-sm border border-slate-700/60">
        <div className="flex flex-col gap-4 md:flex-row">
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
            onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value, 10))}
            className={dropdownClassName}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
            className={dropdownClassName}
          >
            {Array.from({ length: 2040 - 2024 + 1 }, (_, index) => 2024 + index).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsMiniCard title="Siswa Aktif" value={summary.totals.activeStudents} description="Siswa aktif dalam filter statistik" icon={UserCheck} accent="cyan" />
        <StatsMiniCard title="Hari Sekolah Aktif" value={summary.totals.validDays} description="Minggu, libur, dan hari nonaktif tidak dihitung" icon={CalendarDays} accent="blue" />
        <StatsMiniCard title="Persentase Hadir" value={`${summary.totals.attendanceRate}%`} description="Hadir + terlambat dibanding total wajib hadir" icon={Activity} accent="green" />
        <StatsMiniCard title="Tingkat Pelanggaran" value={`${summary.totals.violationRate}%`} description="Terlambat + tidak hadir dibanding total wajib hadir" icon={ShieldAlert} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopStudentCard
          title="Paling Sering Tidak Hadir (A)"
          student={topStudentsByStatus.absent}
          unitLabel="hari"
          icon={UserX}
          accent="red"
        />
        <TopStudentCard
          title="Paling Sering Izin (I)"
          student={topStudentsByStatus.permit}
          unitLabel="hari"
          icon={UserRound}
          accent="purple"
        />
        <TopStudentCard
          title="Paling Sering Sakit (S)"
          student={topStudentsByStatus.sick}
          unitLabel="hari"
          icon={UserMinus}
          accent="blue"
        />
        <TopStudentCard
          title="Paling Sering Terlambat"
          student={topStudentsByStatus.late}
          unitLabel="hari"
          icon={Clock}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatsMiniCard
          title="Usulan Sekretaris Pending"
          value={secretaryVerificationStats.pending}
          description="Belum sah sebagai rekap final sampai diverifikasi wali kelas atau admin sekolah."
          icon={ShieldAlert}
          accent="amber"
        />
        <StatsMiniCard
          title="Usulan Sekretaris Disetujui"
          value={secretaryVerificationStats.approved}
          description="Sudah final, namun jejak pengusul sekretaris tetap tersimpan."
          icon={UserCheck}
          accent="cyan"
        />
      </div>

      <div className="rounded-lg bg-slate-900/50 p-6 shadow-sm border border-slate-700/60">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Komposisi Sumber Input</h3>
          <p className="mt-1 text-sm text-slate-400">Menunjukkan asal presensi pada seluruh slot hari aktif di filter saat ini.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {(Object.keys(SOURCE_META) as AttendanceSource[]).map((sourceKey) => {
            const meta = SOURCE_META[sourceKey];
            return (
              <div key={sourceKey} className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-4 py-3">
                <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${meta.accent}`}>
                  {meta.label}
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-100">{sourceBreakdown[sourceKey]}</div>
                <p className="mt-1 text-xs text-slate-500">slot presensi</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg bg-slate-900/50 p-6 shadow-sm border border-slate-700/60">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Komposisi Status Presensi</h3>
            <p className="mt-1 text-sm text-slate-400">Status dihitung dari hari sekolah aktif, dengan hari tanpa log otomatis menjadi tidak hadir.</p>
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
            <LegendPill label="Hadir" value={summary.totals.present} color={CHART_COLORS.present} />
            <LegendPill label="Terlambat" value={summary.totals.late} color={CHART_COLORS.late} />
            <LegendPill label="Sakit" value={summary.totals.sick} color={CHART_COLORS.sick} />
            <LegendPill label="Izin" value={summary.totals.permit} color={CHART_COLORS.permit} />
            <LegendPill label="Tidak Hadir" value={summary.totals.absent} color={CHART_COLORS.absent} />
          </div>
        </div>

        <div className="rounded-lg bg-slate-900/50 p-6 shadow-sm border border-slate-700/60">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Perbandingan Antar Kelas</h3>
            <p className="mt-1 text-sm text-slate-400">Hadir normal dipisah dari terlambat agar disiplin tetap terbaca.</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.classChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="className" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip content={<StatisticsTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="hadir" name="Hadir" fill={CHART_COLORS.present} radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="terlambat" name="Terlambat" fill={CHART_COLORS.late} radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Bar dataKey="alpha" name="Tidak Hadir" fill={CHART_COLORS.absent} radius={[6, 6, 0, 0]} maxBarSize={42} />
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
}: {
  title: string;
  student: { name: string; className: string; count: number };
  unitLabel: string;
  icon: typeof UserCheck;
  accent: "red" | "purple" | "blue" | "amber";
}) {
  const accentMap = {
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  }[accent];

  return (
    <div className="rounded-lg bg-slate-900/50 p-5 shadow-sm border border-slate-700/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</div>
          <div className="mt-3 truncate text-lg font-bold text-slate-100" title={student.name}>
            {student.name}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {student.count > 0
              ? `${student.className} · ${student.count} ${unitLabel}`
              : "Belum ada data pada filter ini"}
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
  accent: "green" | "red" | "cyan" | "blue" | "amber";
}) {
  const accentMap = {
    green: "bg-green-500/10 text-green-300 border-green-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
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

function StatisticsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[140px] rounded-xl border border-slate-600/80 bg-slate-950/95 px-3 py-2.5 shadow-2xl shadow-slate-950/60">
      {label ? <div className="mb-2 text-sm font-semibold text-slate-100">{label}</div> : null}
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
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

