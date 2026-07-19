"use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const LIBRARY_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const LITERACY_DISTRIBUTION_COLORS: Record<string, string> = {
  "Sangat Aktif": "#4ade80",
  "Aktif": "#22d3ee",
  "Cukup Aktif": "#facc15",
  "Perlu Dorongan": "#fb923c",
  "Belum Aktif": "#f87171",
};

export function LenteraDashboardPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { classes, literacyLogs, borrowRecords, loading } = useGasLibrary(schoolId, selectedClassId);
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);

  const [statsMonth, setStatsMonth] = useState<number>(new Date().getMonth() + 1);
  const [statsYear, setStatsYear] = useState<number>(new Date().getFullYear());

  const dropdownClassName =
    "px-3 py-2 rounded-xl border border-white/10 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-500/60";

  const classNameByStudentId = useMemo(() => {
    const result = new Map<string, string>();
    studentsData.forEach((student) => {
      const className = String(
        student.className || student.class || (student as any).kelas || ""
      ).trim();
      if (!className) return;

      const candidates = [
        student.id,
        student.studentId,
        student.nisn,
        student.username,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      candidates.forEach((key) => {
        result.set(key, className);
      });
    });
    return result;
  }, [studentsData]);

  const selectedPeriod = useMemo(() => {
    const start = new Date(statsYear, statsMonth - 1, 1).getTime();
    const end = new Date(statsYear, statsMonth, 1).getTime();
    return { start, end };
  }, [statsMonth, statsYear]);

  const matchesSelectedClass = (studentId: string, studentClass?: string) => {
    if (!selectedClassId) return true;
    const normalizedLogClass = String(studentClass || "").trim();
    if (normalizedLogClass && normalizedLogClass === selectedClassId) return true;
    return classNameByStudentId.get(String(studentId || "").trim()) === selectedClassId;
  };

  const filteredLiteracyLogs = useMemo(
    () =>
      literacyLogs.filter((log) => {
        const timestamp = Number(log.timestamp || 0);
        if (timestamp < selectedPeriod.start || timestamp >= selectedPeriod.end) return false;
        return matchesSelectedClass(log.studentId, log.studentClass);
      }),
    [literacyLogs, selectedPeriod, selectedClassId, classNameByStudentId]
  );

  const filteredBorrowRecords = useMemo(
    () =>
      borrowRecords.filter((record) => {
        const borrowDate = Number(record.borrowDate || 0);
        if (borrowDate < selectedPeriod.start || borrowDate >= selectedPeriod.end) return false;
        return matchesSelectedClass(record.studentId, classNameByStudentId.get(String(record.studentId || "").trim()));
      }),
    [borrowRecords, selectedPeriod, selectedClassId, classNameByStudentId]
  );

  const dashboardMetrics = useMemo(() => {
    const byStudent = new Map<
      string,
      {
        visitDays: Set<string>;
        borrowCount: number;
        reportCount: number;
        taskCount: number;
      }
    >();

    const ensureStudent = (studentId: string) => {
      const key = String(studentId || "").trim();
      if (!key) return null;
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          visitDays: new Set<string>(),
          borrowCount: 0,
          reportCount: 0,
          taskCount: 0,
        });
      }
      return byStudent.get(key) || null;
    };

    filteredLiteracyLogs.forEach((log) => {
      const bucket = ensureStudent(log.studentId);
      if (!bucket) return;
      bucket.visitDays.add(new Date(Number(log.timestamp || 0)).toDateString());
      if (String(log.summary || "").trim()) bucket.reportCount += 1;
      if (String(log.taskId || "").trim()) bucket.taskCount += 1;
    });

    filteredBorrowRecords.forEach((record) => {
      const bucket = ensureStudent(record.studentId);
      if (!bucket) return;
      bucket.borrowCount += 1;
    });

    const distributionCounts: Record<string, number> = {
      "Sangat Aktif": 0,
      Aktif: 0,
      "Cukup Aktif": 0,
      "Perlu Dorongan": 0,
      "Belum Aktif": 0,
    };

    let totalScore = 0;

    byStudent.forEach((entry) => {
      const visitScore = Math.min(entry.visitDays.size / 8, 1) * 30;
      const bookActivityScore =
        Math.min((entry.borrowCount + entry.reportCount) / 4, 1) * 35;
      const taskScore = Math.min(entry.taskCount / 2, 1) * 35;
      const score = visitScore + bookActivityScore + taskScore;
      totalScore += score;

      if (score >= 80) distributionCounts["Sangat Aktif"] += 1;
      else if (score >= 60) distributionCounts["Aktif"] += 1;
      else if (score >= 40) distributionCounts["Cukup Aktif"] += 1;
      else if (score > 0) distributionCounts["Perlu Dorongan"] += 1;
      else distributionCounts["Belum Aktif"] += 1;
    });

    const activeStudents = byStudent.size;
    const totalVisitDays = new Set(
      filteredLiteracyLogs.map((log) => new Date(Number(log.timestamp || 0)).toDateString())
    ).size;

    return {
      activeStudents,
      totalVisitDays,
      totalBorrows: filteredBorrowRecords.length,
      totalReports: filteredLiteracyLogs.filter((log) => String(log.summary || "").trim()).length,
      totalTasksDone: filteredLiteracyLogs.filter((log) => String(log.taskId || "").trim()).length,
      averageScore: activeStudents ? Number((totalScore / activeStudents).toFixed(1)) : 0,
      literacyDistributionData: Object.entries(distributionCounts).map(([name, value]) => ({
        name,
        value,
        color: LITERACY_DISTRIBUTION_COLORS[name],
      })),
    };
  }, [filteredBorrowRecords, filteredLiteracyLogs]);

  if (loading || studentsLoading) {
     return <div className="text-slate-400 p-6">Memuat statistik Lentera Digital...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Statistik Aktivitas Literasi</h3>
            <p className="mt-1 text-sm text-slate-300">
              Fokus pada keterlibatan literasi yang objektif: hari aktif di Lentera, peminjaman atau laporan bacaan, serta pengerjaan tugas literasi.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={dropdownClassName}
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={statsMonth}
              onChange={(e) => setStatsMonth(Number(e.target.value))}
              className={dropdownClassName}
            >
              {LIBRARY_MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={statsYear}
              onChange={(e) => setStatsYear(Number(e.target.value))}
              className={dropdownClassName}
            >
              {Array.from({ length: 5 }, (_, index) => 2024 + index).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Siswa Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{dashboardMetrics.activeStudents}</h3>
          <p className="mt-1 text-xs text-slate-400">Bulan ini</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Hari Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-amber-300">{dashboardMetrics.totalVisitDays}</h3>
          <p className="mt-1 text-xs text-slate-400">Akumulasi hari aktif</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Peminjaman Buku</p>
          <h3 className="mt-2 text-2xl font-bold text-emerald-300">{dashboardMetrics.totalBorrows}</h3>
          <p className="mt-1 text-xs text-slate-400">Transaksi pinjam total</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Laporan Bacaan</p>
          <h3 className="mt-2 text-2xl font-bold text-cyan-300">{dashboardMetrics.totalReports}</h3>
          <p className="mt-1 text-xs text-slate-400">Pengiriman ringkasan</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Tugas Dikerjakan</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{dashboardMetrics.totalTasksDone}</h3>
          <p className="mt-1 text-xs text-slate-400">Submit tugas khusus</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Skor Rata-rata</p>
          <h3 className="mt-2 text-2xl font-bold text-rose-300">{dashboardMetrics.averageScore}</h3>
          <p className="mt-1 text-xs text-slate-400">Indeks aktivitas literasi</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm">
          <div className="text-lg font-semibold text-white">Rule Final</div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Kunjungan Literasi dihitung dari hari unik yang memiliki aktivitas Lentera terekam.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Aktivitas Buku dihitung dari jumlah peminjaman buku ditambah laporan bacaan.
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
              <div className="font-semibold">Rumus Skor</div>
              <div className="mt-1 opacity-90">Skor = min(Hari/8,1)*30 + min(Aktivitas Buku/4,1)*35 + min(Tugas/2,1)*35</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-sm lg:col-span-2">
           <div className="text-lg font-semibold text-white">Distribusi Aktivitas</div>
           <p className="mt-1 text-sm text-slate-400">Distribusi ini dihitung dari data aktual pada periode yang dipilih.</p>
           <div className="mt-4 h-64 w-full">
              {dashboardMetrics.literacyDistributionData.some((entry) => entry.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardMetrics.literacyDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {dashboardMetrics.literacyDistributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "12px", color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-400">
                  Belum ada data aktivitas pada periode yang dipilih.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
