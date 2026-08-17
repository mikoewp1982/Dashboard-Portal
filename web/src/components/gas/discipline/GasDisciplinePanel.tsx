"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Award, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useGasDiscipline } from "@/hooks/gas/discipline/useGasDiscipline";
import { useGasDisciplineRules } from "@/hooks/gas/discipline/useGasDisciplineRules";
import { useAuthStore } from "@/store/useAuthStore";
import { DisciplineRule, DEFAULT_DISCIPLINE_RULES } from "@/types/discipline";
import { exportToExcel } from "@/utils/export";
import { DisciplineRecordsSection } from "./DisciplineRecordsSection";
import { DisciplineRulesManager } from "./DisciplineRulesManager";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const START_YEAR = 2020;
const END_YEAR = 2040;
const RULE_SEVERITY_OPTIONS: DisciplineRule["severity"][] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const createEmptyRuleForm = () => ({
  ruleName: "",
  points: "5",
  severity: "LOW" as DisciplineRule["severity"],
  description: "",
  isActive: true,
});

export function GasDisciplinePanel({ schoolId }: { schoolId: string }) {
  const { user } = useAuthStore();
  
  const [viewMode, setViewMode] = useState<"records" | "statistics">("records");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { rules, loading: rulesLoading, saveRules } = useGasDisciplineRules(schoolId);
  const { records, classes, loading: recordsLoading, refresh, deleteRecord } = useGasDiscipline(schoolId, selectedMonth, selectedYear);

  // Rule Form States
  const [ruleForm, setRuleForm] = useState(createEmptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [ruleFeedback, setRuleFeedback] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);

  const canManageRules = user?.role === "admin" || user?.role === "super_admin";

  const dropdownClassName =
    "w-full px-4 py-3 rounded-2xl border border-slate-500/70 bg-slate-950/90 text-sm font-medium text-slate-50 shadow-sm outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/60";
  const dropdownStyle = { backgroundColor: "#020617", color: "#f8fafc" };
  const dropdownOptionStyle = {};

  const classOptions = useMemo(() => classes.map(c => c.className || c.name || c.id).filter(Boolean), [classes]);

  const filteredRecords = useMemo(() => {
    let list = records;
    if (selectedClassFilter) {
      list = list.filter(r => (r.classNameSnapshot || "").toUpperCase() === selectedClassFilter.toUpperCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r => (r.studentNameSnapshot || "").toLowerCase().includes(q));
    }
    return list;
  }, [records, selectedClassFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalCases = filteredRecords.length;
    const totalPoints = filteredRecords.reduce((sum, r) => sum + r.points, 0);
    const uniqueStudents = new Set(filteredRecords.map(r => r.studentId)).size;
    return { totalCases, totalPoints, uniqueStudents };
  }, [filteredRecords]);

  const disciplineStatistics = useMemo(() => {
    const severityMap = new Map<number, DisciplineRule["severity"]>();
    rules.forEach((rule) => {
      severityMap.set(rule.id, rule.severity);
    });

    const severityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    } as Record<DisciplineRule["severity"], number>;

    const studentMap = new Map<string, {
      studentId: string;
      name: string;
      className: string;
      totalCases: number;
      totalPoints: number;
    }>();
    const ruleMap = new Map<string, { ruleName: string; totalCases: number; totalPoints: number }>();
    const reporterMap = new Map<string, { reporterName: string; role: string; totalCases: number }>();

    for (const record of filteredRecords) {
      const severity = severityMap.get(record.ruleId) || "LOW";
      severityCounts[severity] += 1;

      const studentKey = String(record.studentId || "");
      const existingStudent = studentMap.get(studentKey) || {
        studentId: studentKey,
        name: String(record.studentNameSnapshot || "Tidak Dikenal"),
        className: String(record.classNameSnapshot || "-"),
        totalCases: 0,
        totalPoints: 0,
      };
      existingStudent.totalCases += 1;
      existingStudent.totalPoints += Number(record.points || 0);
      studentMap.set(studentKey, existingStudent);

      const ruleKey = String(record.ruleNameSnapshot || "Aturan Tidak Diketahui");
      const existingRule = ruleMap.get(ruleKey) || {
        ruleName: ruleKey,
        totalCases: 0,
        totalPoints: 0,
      };
      existingRule.totalCases += 1;
      existingRule.totalPoints += Number(record.points || 0);
      ruleMap.set(ruleKey, existingRule);

      const reporterName = String(record.recordedByName || record.recordedBy || "Tidak diketahui");
      const reporterKey = `${reporterName}__${String(record.reportedByRole || "-")}`;
      const existingReporter = reporterMap.get(reporterKey) || {
        reporterName,
        role: String(record.reportedByRole || "-"),
        totalCases: 0,
      };
      existingReporter.totalCases += 1;
      reporterMap.set(reporterKey, existingReporter);
    }

    const sortByCases = <T extends { totalCases: number }>(items: T[]) =>
      items
        .sort((a, b) => b.totalCases - a.totalCases)
        .slice(0, 10);

    const sortStudentsByPoints = Array.from(studentMap.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.name.localeCompare(b.name, "id-ID", { sensitivity: "base" });
      })
      .slice(0, 10);

    return {
      severityCounts,
      topStudentsByCases: sortByCases(Array.from(studentMap.values())),
      topStudentsByPoints: sortStudentsByPoints,
      topRules: sortByCases(Array.from(ruleMap.values())),
      topReporters: sortByCases(Array.from(reporterMap.values())),
    };
  }, [filteredRecords, rules]);

  const violationRules = useMemo(() => {
    return rules
      .filter((rule) => rule.category === "VIOLATION")
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        if (a.points !== b.points) return a.points - b.points;
        return a.ruleName.localeCompare(b.ruleName);
      });
  }, [rules]);

  const monthLabel = MONTHS[selectedMonth - 1] || "";

  // Form Rule Actions
  const resetRuleForm = () => {
    setRuleForm(createEmptyRuleForm());
    setEditingRuleId(null);
  };

  const persistSchoolRules = async (nextRules: DisciplineRule[], successMessage: string) => {
    setIsSavingRule(true);
    setRuleError(null);
    setRuleFeedback(null);
    try {
      await saveRules(nextRules);
      setRuleFeedback(successMessage);
      resetRuleForm();
    } catch (error) {
      console.error("Failed to save rules", error);
      setRuleError("Gagal menyimpan aturan pelanggaran sekolah.");
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleRuleSubmit = async () => {
    const ruleName = ruleForm.ruleName.trim();
    const points = Number(ruleForm.points);
    if (!ruleName) {
      setRuleError("Nama pelanggaran wajib diisi.");
      return;
    }
    if (!Number.isFinite(points) || points < 0) {
      setRuleError("Poin pelanggaran harus berupa angka 0 atau lebih.");
      return;
    }

    const now = Date.now();
    const existingRule = editingRuleId ? rules.find((rule) => rule.id === editingRuleId) : undefined;
    const nextId = existingRule?.id ?? (rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1);
    
    const nextRule: DisciplineRule = {
      id: nextId,
      ruleName,
      category: "VIOLATION",
      points,
      severity: ruleForm.severity,
      description: ruleForm.description.trim() || null,
      isActive: ruleForm.isActive,
      createdAt: existingRule?.createdAt ?? now,
      updatedAt: now,
    };

    const nextRules = existingRule
      ? rules.map((rule) => (rule.id === nextRule.id ? nextRule : rule))
      : [...rules, nextRule];
      
    await persistSchoolRules(nextRules, existingRule ? "Aturan pelanggaran berhasil diperbarui." : "Aturan pelanggaran baru berhasil ditambahkan.");
  };

  const startEditRule = (rule: DisciplineRule) => {
    setEditingRuleId(rule.id);
    setRuleFeedback(null);
    setRuleError(null);
    setRuleForm({
      ruleName: rule.ruleName,
      points: String(rule.points),
      severity: rule.severity,
      description: rule.description || "",
      isActive: rule.isActive,
    });
  };

  const toggleRuleActive = async (rule: DisciplineRule) => {
    const nextRules = rules.map((item) =>
      item.id === rule.id
        ? {
            ...item,
            isActive: !item.isActive,
            updatedAt: Date.now(),
          }
        : item
    );
    await persistSchoolRules(
      nextRules,
      `${rule.ruleName} ${rule.isActive ? "dinonaktifkan" : "diaktifkan"} untuk sekolah ini.`
    );
  };

  const deleteRuleEntry = async (ruleId: number) => {
    const nextRules = rules.filter((rule) => rule.id !== ruleId);
    if (nextRules.length === 0) {
      setRuleError("Minimal harus ada satu aturan tersimpan.");
      return;
    }
    await persistSchoolRules(nextRules, "Aturan pelanggaran berhasil dihapus dari sekolah ini.");
  };

  const resetSchoolRules = async () => {
    await persistSchoolRules(DEFAULT_DISCIPLINE_RULES, "Aturan pelanggaran berhasil dikembalikan ke daftar default.");
  };

  return (
    <div className="flex h-full flex-col p-6 space-y-6 overflow-y-auto">
      <div className="glass-effect-dark-card rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-500/30">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-100">Rekap Kedisiplinan</h1>
            <p className="text-slate-400 mt-1">Monitoring poin pelanggaran dan prestasi siswa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refresh()}
            disabled={recordsLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${recordsLoading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <button
            onClick={() => {
              const data = filteredRecords.map((record) => ({
                Tanggal: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(record.date)),
                Siswa: record.studentNameSnapshot,
                Kelas: record.classNameSnapshot,
                Pelapor: record.recordedByName || record.recordedBy,
                Sumber: record.reportedByRole || "-",
                Kategori: "Pelanggaran",
                Aturan: record.ruleNameSnapshot,
                Poin: record.points,
              }));
              const fileName = `Rekap_Kedisiplinan_${monthLabel}_${selectedYear}`;
              exportToExcel(data, fileName);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-effect-dark-card rounded-2xl p-6 border border-red-700/30">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Total Pelanggaran ({monthLabel} {selectedYear})
          </p>
          <p className="mt-2 text-3xl font-black text-red-400">{stats.totalCases} Kasus</p>
        </div>
        <div className="glass-effect-dark-card rounded-2xl p-6 border border-red-700/30">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Total Poin</p>
          <p className="mt-2 text-3xl font-black text-red-400">{stats.totalPoints}</p>
        </div>
        <div className="glass-effect-dark-card rounded-2xl p-6 border border-red-700/30">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Siswa Terlibat</p>
          <p className="mt-2 text-3xl font-black text-red-400">{stats.uniqueStudents}</p>
        </div>
      </div>

      <DisciplineRecordsSection
        viewMode={viewMode}
        selectedClassFilter={selectedClassFilter}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        searchQuery={searchQuery}
        classOptions={classOptions}
        monthOptions={MONTHS}
        startYear={START_YEAR}
        endYear={END_YEAR}
        dropdownClassName={dropdownClassName}
        dropdownStyle={dropdownStyle}
        recordsLoading={recordsLoading}
        rulesLoading={rulesLoading}
        filteredRecords={filteredRecords}
        statisticsContent={
          <DisciplineStatisticsView
            monthLabel={monthLabel}
            selectedYear={selectedYear}
            totalRecords={filteredRecords.length}
            statistics={disciplineStatistics}
          />
        }
        onViewModeChange={setViewMode}
        onClassFilterChange={setSelectedClassFilter}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onSearchChange={setSearchQuery}
        onDeleteRecord={deleteRecord}
      />

      <DisciplineRulesManager
        canManageRules={canManageRules}
        isSavingRule={isSavingRule}
        ruleFeedback={ruleFeedback}
        ruleError={ruleError}
        violationRules={violationRules}
        editingRuleId={editingRuleId}
        ruleForm={ruleForm}
        ruleSeverityOptions={RULE_SEVERITY_OPTIONS}
        dropdownClassName={dropdownClassName}
        dropdownStyle={dropdownStyle}
        dropdownOptionStyle={dropdownOptionStyle}
        onResetSchoolRules={resetSchoolRules}
        onStartEditRule={startEditRule}
        onToggleRuleActive={toggleRuleActive}
        onDeleteRuleEntry={deleteRuleEntry}
        onResetRuleForm={resetRuleForm}
        onRuleFormChange={setRuleForm}
        onSubmitRule={handleRuleSubmit}
      />
    </div>
  );
}

function DisciplineStatisticsView({
  monthLabel,
  selectedYear,
  totalRecords,
  statistics,
}: {
  monthLabel: string;
  selectedYear: number;
  totalRecords: number;
  statistics: {
    severityCounts: Record<DisciplineRule["severity"], number>;
    topStudentsByCases: Array<{ studentId: string; name: string; className: string; totalCases: number; totalPoints: number }>;
    topStudentsByPoints: Array<{ studentId: string; name: string; className: string; totalCases: number; totalPoints: number }>;
    topRules: Array<{ ruleName: string; totalCases: number; totalPoints: number }>;
    topReporters: Array<{ reporterName: string; role: string; totalCases: number }>;
  };
}) {
  const severityCards: Array<{ key: DisciplineRule["severity"]; label: string; className: string }> = [
    { key: "LOW", label: "Ringan", className: "border-emerald-700/30 bg-emerald-900/20 text-emerald-300" },
    { key: "MEDIUM", label: "Sedang", className: "border-yellow-700/30 bg-yellow-900/20 text-yellow-300" },
    { key: "HIGH", label: "Berat", className: "border-orange-700/30 bg-orange-900/20 text-orange-300" },
    { key: "CRITICAL", label: "Kritis", className: "border-red-700/30 bg-red-900/20 text-red-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        Statistik dihitung realtime dari catatan kedisiplinan periode <span className="font-semibold text-slate-100">{monthLabel} {selectedYear}</span>.
        {" "}Total data terfilter saat ini: <span className="font-semibold text-slate-100">{totalRecords} catatan</span>.
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {severityCards.map((card) => (
          <div key={card.key} className={`rounded-2xl border p-5 ${card.className}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Kasus {card.label}</div>
            <div className="mt-2 text-3xl font-black">{statistics.severityCounts[card.key]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <DisciplineRankingCard
          title="Siswa Kasus Terbanyak"
          description="Ranking siswa berdasarkan jumlah catatan kedisiplinan."
          accentClass="text-red-300 border-red-500/20 bg-red-500/10"
          items={statistics.topStudentsByCases.map((item) => ({
            title: item.name,
            subtitle: `${item.className} • ${item.totalPoints} poin`,
            badge: `${item.totalCases} kasus`,
          }))}
        />
        <DisciplineRankingCard
          title="Siswa Poin Tertinggi"
          description="Siswa dengan akumulasi poin pelanggaran tertinggi."
          accentClass="text-orange-300 border-orange-500/20 bg-orange-500/10"
          items={statistics.topStudentsByPoints.map((item) => ({
            title: item.name,
            subtitle: `${item.className} • ${item.totalCases} kasus`,
            badge: `${item.totalPoints} poin`,
          }))}
        />
        <DisciplineRankingCard
          title="Aturan Paling Sering"
          description="Aturan/keterangan yang paling sering tercatat."
          accentClass="text-blue-300 border-blue-500/20 bg-blue-500/10"
          items={statistics.topRules.map((item) => ({
            title: item.ruleName,
            subtitle: `${item.totalPoints} total poin`,
            badge: `${item.totalCases} kasus`,
          }))}
        />
        <DisciplineRankingCard
          title="Pelapor Paling Aktif"
          description="Guru/admin/petugas yang paling sering mencatat pelanggaran."
          accentClass="text-purple-300 border-purple-500/20 bg-purple-500/10"
          items={statistics.topReporters.map((item) => ({
            title: item.reporterName,
            subtitle: `Peran: ${item.role}`,
            badge: `${item.totalCases} catatan`,
          }))}
        />
      </div>
    </div>
  );
}

function DisciplineRankingCard({
  title,
  description,
  accentClass,
  items,
}: {
  title: string;
  description: string;
  accentClass: string;
  items: Array<{ title: string; subtitle: string; badge: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 shadow-sm">
      <div className={`inline-flex rounded-lg border px-3 py-1 text-sm font-semibold ${accentClass}`}>
        {title}
      </div>
      <p className="mt-3 text-sm text-slate-400">{description}</p>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${title}-${index}-${item.title}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-950/40 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                  <div className="truncate text-sm font-semibold text-slate-100">{item.title}</div>
                </div>
                <div className="mt-1 text-xs text-slate-400">{item.subtitle}</div>
              </div>
              <div className="shrink-0 rounded-full border border-slate-700/50 bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-slate-100">
                {item.badge}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-500">
            Belum ada data pada filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
}
