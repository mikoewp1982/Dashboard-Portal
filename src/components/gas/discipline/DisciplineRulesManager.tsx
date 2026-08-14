"use client";

import { AlertCircle, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { DisciplineRule } from "@/types/discipline";

interface DisciplineRulesManagerProps {
  canManageRules: boolean;
  isSavingRule: boolean;
  ruleFeedback: string | null;
  ruleError: string | null;
  violationRules: DisciplineRule[];
  editingRuleId: number | null;
  ruleForm: {
    ruleName: string;
    points: string;
    severity: DisciplineRule["severity"];
    description: string;
    isActive: boolean;
  };
  ruleSeverityOptions: DisciplineRule["severity"][];
  dropdownClassName: string;
  dropdownStyle: React.CSSProperties;
  dropdownOptionStyle: React.CSSProperties;
  onResetSchoolRules: () => Promise<void> | void;
  onStartEditRule: (rule: DisciplineRule) => void;
  onToggleRuleActive: (rule: DisciplineRule) => Promise<void> | void;
  onDeleteRuleEntry: (ruleId: number) => Promise<void> | void;
  onResetRuleForm: () => void;
  onRuleFormChange: (nextForm: {
    ruleName: string;
    points: string;
    severity: DisciplineRule["severity"];
    description: string;
    isActive: boolean;
  }) => void;
  onSubmitRule: () => Promise<void> | void;
}

export function DisciplineRulesManager(props: DisciplineRulesManagerProps) {
  const {
    canManageRules,
    isSavingRule,
    ruleFeedback,
    ruleError,
    violationRules,
    editingRuleId,
    ruleForm,
    ruleSeverityOptions,
    dropdownClassName,
    dropdownStyle,
    dropdownOptionStyle,
    onResetSchoolRules,
    onStartEditRule,
    onToggleRuleActive,
    onDeleteRuleEntry,
    onResetRuleForm,
    onRuleFormChange,
    onSubmitRule,
  } = props;

  return (
    <div className="glass-effect-dark-card rounded-3xl p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-100">Kelola Daftar Pelanggaran</h2>
          <p className="text-sm text-slate-400">Admin sekolah bisa mengubah nama pelanggaran dan poin. APK siswa/guru akan mengikuti otomatis.</p>
        </div>
        <button
          onClick={() => void onResetSchoolRules()}
          disabled={!canManageRules || isSavingRule}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Kembalikan Default
        </button>
      </div>

      {!canManageRules && (
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Hanya Admin Sekolah yang dapat mengelola aturan kedisiplinan.
        </div>
      )}

      {(ruleFeedback || ruleError) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          ruleError ? "border-red-700/40 bg-red-950/30 text-red-200" : "border-emerald-700/40 bg-emerald-950/30 text-emerald-200"
        }`}>
          {ruleError || ruleFeedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]">
        <div className="rounded-3xl border border-slate-700/50 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/40 xl:min-w-[760px]">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="bg-slate-900/80">
              <tr>
                {["Pelanggaran", "Poin", "Level", "Status", "Aksi"].map((header, index) => (
                  <th key={header} className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${index === 4 ? "text-right" : index === 0 ? "text-left" : "text-center"}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {violationRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 align-top">
                    <div className="font-semibold text-slate-100">{rule.ruleName}</div>
                    <div className="mt-1 text-xs text-slate-500">{rule.description || "Tanpa deskripsi tambahan."}</div>
                  </td>
                  <td className="px-5 py-4 text-center font-black text-red-400">{rule.points}</td>
                  <td className="px-5 py-4 text-center text-xs font-semibold text-slate-300">{rule.severity}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                      rule.isActive ? "border-emerald-700/40 bg-emerald-900/30 text-emerald-300" : "border-slate-700/40 bg-slate-800/70 text-slate-400"
                    }`}>
                      {rule.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-2 min-w-[210px]">
                      <button
                        type="button"
                        onClick={() => onStartEditRule(rule)}
                        disabled={!canManageRules || isSavingRule}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-blue-500/50 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onToggleRuleActive(rule)}
                        disabled={!canManageRules || isSavingRule}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-amber-500/50 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {rule.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteRuleEntry(rule.id)}
                        disabled={!canManageRules || isSavingRule}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-red-500/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {violationRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">Belum ada aturan pelanggaran yang tersedia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-3xl border border-slate-700/50 bg-slate-950/40 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-100">{editingRuleId ? "Edit Aturan Pelanggaran" : "Tambah Aturan Pelanggaran"}</h3>
              <p className="text-sm text-slate-400">Perubahan akan disimpan khusus untuk sekolah ini.</p>
            </div>
            {editingRuleId ? (
              <button type="button" onClick={onResetRuleForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500">
                Batal Edit
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama Pelanggaran</label>
            <input
              type="text"
              value={ruleForm.ruleName}
              onChange={(e) => onRuleFormChange({ ...ruleForm, ruleName: e.target.value })}
              placeholder="Contoh: Pulang Awal"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Poin</label>
              <input
                type="number"
                min={0}
                value={ruleForm.points}
                onChange={(e) => onRuleFormChange({ ...ruleForm, points: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tingkat</label>
              <select
                value={ruleForm.severity}
                onChange={(e) => onRuleFormChange({ ...ruleForm, severity: e.target.value as DisciplineRule["severity"] })}
                className={dropdownClassName}
                style={dropdownStyle}
              >
                {ruleSeverityOptions.map((severity) => (
                  <option key={severity} value={severity} style={dropdownOptionStyle}>{severity}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Deskripsi</label>
            <textarea
              value={ruleForm.description}
              onChange={(e) => onRuleFormChange({ ...ruleForm, description: e.target.value })}
              rows={4}
              placeholder="Jelaskan kondisi pelanggaran ini..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ruleForm.isActive}
              onChange={(e) => onRuleFormChange({ ...ruleForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded bg-slate-900 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900"
            />
            Aturan ini aktif dan bisa digunakan
          </label>

          <button
            type="button"
            onClick={() => void onSubmitRule()}
            disabled={isSavingRule || !canManageRules}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 py-3 text-sm font-bold text-white shadow-xl shadow-red-500/20 hover:-translate-y-0.5 hover:shadow-red-500/40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingRule ? "Menyimpan..." : "Simpan Aturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
