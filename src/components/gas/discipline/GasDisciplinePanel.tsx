"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AlertCircle, Award, FileSpreadsheet, Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useGasDiscipline } from "@/hooks/gas/discipline/useGasDiscipline";
import { useGasDisciplineRules } from "@/hooks/gas/discipline/useGasDisciplineRules";
import { useAuthStore } from "@/store/useAuthStore";
import { DisciplineRule } from "@/types/discipline";
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
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { rules, loading: rulesLoading, saveRules } = useGasDisciplineRules(schoolId);
  const { records, students, classes, loading: recordsLoading, refresh, addRecord, deleteRecord } = useGasDiscipline(schoolId, selectedMonth, selectedYear);

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
    setRuleError("Reset default hanya bisa dilakukan via API Backend. Silakan edit atau hapus rule satu persatu.");
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
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
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
        dropdownOptionStyle={dropdownOptionStyle}
        recordsLoading={recordsLoading}
        rulesLoading={rulesLoading}
        filteredRecords={filteredRecords}
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
