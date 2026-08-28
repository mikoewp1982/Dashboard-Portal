"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useTeacherKaih } from "@/hooks/guru/useTeacherKaih";
import { teacherFetch } from "@/lib/guru/teacherFetch";
import {
  ApkGlassCard,
  ApkPageFrame,
  ApkTabs,
} from "./GuruApkTheme";
import {
  buildClassMonitoringSummary,
  buildStudentMonitoringMetrics,
  EMPTY_RUBRIC,
  extractWeekOfMonth,
  formatPercent,
  KAIH_DAYS,
  KAIH_HABIT_NAMES,
  KAIH_MONTHS,
  rubricTotal,
  scoreBarClass,
  scoreColorClass,
  todayDayName,
  type KaihHabits,
  type TeacherHabitRubric,
} from "@/lib/guru/kaihGrading";
import type { TeacherKaihGradeRow } from "@/hooks/guru/useTeacherKaih";

const YEARS = Array.from({ length: 2040 - 2024 + 1 }, (_, i) => 2024 + i);

const RUBRIC_FIELDS: Array<{
  key: keyof Pick<
    TeacherHabitRubric,
    "honesty" | "behavior" | "initiative" | "commitment"
  >;
  label: string;
}> = [
  { key: "honesty", label: "Kejujuran" },
  { key: "behavior", label: "Perilaku" },
  { key: "initiative", label: "Inisiatif" },
  { key: "commitment", label: "Komitmen" },
];

const RUBRIC_PRESETS: Array<{
  label: string;
  className: string;
  value: Pick<
    TeacherHabitRubric,
    "honesty" | "behavior" | "initiative" | "commitment"
  >;
}> = [
  {
    label: "Nilai 25",
    className:
      "border-emerald-400/55 bg-emerald-500/20 text-white hover:bg-emerald-500/25",
    value: {
      honesty: 25,
      behavior: 25,
      initiative: 25,
      commitment: 25,
    },
  },
  {
    label: "Nilai 20",
    className:
      "border-sky-400/55 bg-sky-500/20 text-white hover:bg-sky-500/25",
    value: {
      honesty: 20,
      behavior: 20,
      initiative: 20,
      commitment: 20,
    },
  },
  {
    label: "Reset",
    className:
      "border-rose-400/55 bg-rose-500/20 text-white hover:bg-rose-500/25",
    value: {
      honesty: 0,
      behavior: 0,
      initiative: 0,
      commitment: 0,
    },
  },
];

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[64px] flex-1 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-2 py-2 text-center">
      <div className="text-[10px] text-white/70">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-white sm:text-sm">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/65">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/20 bg-[#0B1F33]/55 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0F2A43] text-white">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgressBar({ score }: { score: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
      <div
        className={`h-full rounded-full transition-all ${scoreBarClass(score)}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

function PresetActionButton({
  label,
  className,
  busy,
  onClick,
}: {
  label: string;
  className: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}

function RubricNumberField({
  label,
  value,
  busy,
  onChange,
}: {
  label: string;
  value: number;
  busy: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/80">{label}</span>
      <input
        type="number"
        min={0}
        max={25}
        step={1}
        inputMode="numeric"
        value={value}
        disabled={busy}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (!Number.isFinite(parsed)) {
            onChange(0);
            return;
          }
          onChange(Math.max(0, Math.min(25, parsed)));
        }}
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-sky-300"
      />
    </label>
  );
}

function RubricDialog({
  title,
  subtitle,
  rubric,
  busy,
  onChange,
  onClose,
  onSave,
  saveLabel,
}: {
  title: string;
  subtitle: string;
  rubric: TeacherHabitRubric;
  busy: boolean;
  onChange: (next: TeacherHabitRubric) => void;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  function setField(
    key: keyof Pick<
      TeacherHabitRubric,
      "honesty" | "behavior" | "initiative" | "commitment"
    >,
    value: number
  ) {
    const next = { ...rubric, [key]: value };
    onChange({
      ...next,
      total: rubricTotal(next),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-[#0F2A43] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex gap-2">
            {RUBRIC_PRESETS.map((item) => (
              <PresetActionButton
                key={item.label}
                label={item.label}
                className={item.className}
                busy={busy}
                onClick={() =>
                  onChange({
                    ...item.value,
                    total: rubricTotal(item.value),
                    ratedAt: rubric.ratedAt,
                  })
                }
              />
            ))}
          </div>

          {RUBRIC_FIELDS.map((field) => (
            <RubricNumberField
              key={field.key}
              label={field.label}
              value={rubric[field.key]}
              busy={busy}
              onChange={(value) => setField(field.key, value)}
            />
          ))}

          <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white">
            Total Nilai Guru: {rubric.total}
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-semibold text-white/85"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSave}
            className="flex-1 rounded-xl bg-[#0F7BFF] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Menyimpan..." : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuruKaihInteractive() {
  const user = useAuthStore((s) => s.user);
  const now = useMemo(() => new Date(), []);
  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [week, setWeek] = useState(() =>
    extractWeekOfMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    )
  );
  const [dayName, setDayName] = useState(() => todayDayName(now));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editRow, setEditRow] = useState<TeacherKaihGradeRow | null>(null);
  const [rubricDraft, setRubricDraft] = useState<TeacherHabitRubric>({
    ...EMPTY_RUBRIC,
  });

  const { students, loading: loadingStudents } = useSupervisedStudents(
    user?.schoolId,
    user?.class
  );
  const filters = useMemo(
    () => ({ year, month, week, dayName }),
    [year, month, week, dayName]
  );
  const { monitoringRows, gradingRows, loading } = useTeacherKaih(
    user?.schoolId,
    students,
    filters
  );

  const classSummary = useMemo(() => {
    const metrics = monitoringRows.map((row) =>
      buildStudentMonitoringMetrics(
        row.weekLogs,
        row.monthLogs,
        row.dayLog,
        year,
        month,
        week
      )
    );
    const weekRecapScores = [1, 2, 3, 4, 5].map((w) => {
      const scores = monitoringRows.map((row) => {
        const weekLogs = row.monthLogs.filter(
          (log) => extractWeekOfMonth(log.date) === w
        );
        return buildStudentMonitoringMetrics(
          weekLogs,
          row.monthLogs,
          null,
          year,
          month,
          w
        ).weeklyScore;
      });
      return scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    });
    return buildClassMonitoringSummary(metrics, weekRecapScores, week);
  }, [monitoringRows, year, month, week]);

  const ratedCount = gradingRows.filter((r) => r.isTeacherRated).length;
  const unratedCount = gradingRows.length - ratedCount;

  async function saveSingle() {
    if (!editRow) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await teacherFetch("/api/teacher/kaih", {
        method: "POST",
        body: JSON.stringify({
          action: "rate",
          studentId: editRow.student.id,
          month,
          year,
          rubric: rubricDraft,
        }),
      });
      setMessage(res?.message || "Nilai guru berhasil disimpan.");
      setEditRow(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai.");
    } finally {
      setBusy(false);
    }
  }

  async function applyPresetToAll(
    preset: Pick<
      TeacherHabitRubric,
      "honesty" | "behavior" | "initiative" | "commitment"
    >
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const rubric = {
        ...preset,
        total: rubricTotal(preset),
      };
      const res = await teacherFetch("/api/teacher/kaih", {
        method: "POST",
        body: JSON.stringify({
          action: "rate-all",
          studentIds: gradingRows.map((r) => r.student.id),
          month,
          year,
          rubric,
        }),
      });
      setMessage(res?.message || "Nilai kelas berhasil diterapkan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menerapkan nilai.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ApkPageFrame
      title="7 KAIH"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
      backHref="/guru"
    >
      <ApkTabs
        tabs={["Monitoring", "Penilaian"]}
        active={tab}
        onChange={setTab}
      />

      <ApkGlassCard className="mb-3 p-4">
        <div className="mb-3 text-sm font-bold text-white">Filter Periode</div>
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect
            label="Tahun"
            value={String(year)}
            options={YEARS.map(String)}
            onChange={(v) => setYear(Number(v))}
          />
          <FilterSelect
            label="Bulan"
            value={KAIH_MONTHS[month - 1]}
            options={[...KAIH_MONTHS]}
            onChange={(v) => setMonth(KAIH_MONTHS.indexOf(v as (typeof KAIH_MONTHS)[number]) + 1)}
          />
          {tab === 0 && (
            <>
              <FilterSelect
                label="Minggu"
                value={`Minggu ke-${week}`}
                options={[1, 2, 3, 4, 5].map((w) => `Minggu ke-${w}`)}
                onChange={(v) => setWeek(Number(v.replace("Minggu ke-", "")))}
              />
              <FilterSelect
                label="Hari"
                value={dayName}
                options={[...KAIH_DAYS]}
                onChange={setDayName}
              />
            </>
          )}
        </div>
      </ApkGlassCard>

      {(message || error) && (
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
            error
              ? "border-red-400/40 bg-red-500/15 text-red-100"
              : "border-emerald-400/40 bg-emerald-500/15 text-emerald-50"
          }`}
        >
          {error || message}
        </div>
      )}

      {(loading || loadingStudents) && (
        <ApkGlassCard className="p-6 text-center text-sm text-white/80">
          {tab === 0 ? "Memuat data monitoring..." : "Memuat data penilaian..."}
        </ApkGlassCard>
      )}

      {!loading && !loadingStudents && tab === 0 && (
        <ApkGlassCard className="space-y-3 p-4">
          <div>
            <div className="text-sm font-bold text-white">Monitoring 7 KAIH</div>
            <p className="mt-1 text-xs text-white/70">
              Ringkasan kebiasaan harian siswa untuk {user?.class || "kelas wali"}
            </p>
          </div>

          {monitoringRows.length === 0 ? (
            <p className="text-sm text-white">
              Belum ada siswa atau log 7 KAIH untuk periode ini.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5">
                <div className="mb-3 text-sm font-bold text-white">
                  Ringkasan Kelas
                </div>
                <div className="mb-2 flex gap-2">
                  <MetricChip
                    label="Rata Mingguan"
                    value={formatPercent(classSummary.averageWeeklyScore)}
                  />
                  <MetricChip
                    label="Rata Bulanan"
                    value={formatPercent(classSummary.averageMonthlyScore)}
                  />
                  <MetricChip
                    label="Siswa Aktif"
                    value={`${classSummary.activeStudents}/${classSummary.totalStudents}`}
                  />
                </div>
                <div className="flex gap-2">
                  <MetricChip
                    label="Kelengkapan Log"
                    value={formatPercent(classSummary.averageCompletionRate)}
                  />
                  <MetricChip label="Predikat" value={classSummary.predicate} />
                  <MetricChip
                    label="Minggu Terpilih"
                    value={`Mg ${classSummary.selectedWeek}`}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5">
                <div className="text-sm font-bold text-white">Rekap Bulanan</div>
                <p className="mt-1 text-xs text-white/70">
                  Rata-rata capaian kelas per minggu pada bulan terpilih.
                </p>
                <div className="mt-3 space-y-3">
                  {classSummary.weekRecaps.map((recap) => (
                    <div key={recap.label}>
                      <div className="mb-1 flex justify-between text-xs text-white">
                        <span>{recap.label}</span>
                        <span className="font-bold">
                          {formatPercent(recap.score)}
                        </span>
                      </div>
                      <ProgressBar score={recap.score} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {monitoringRows.map((row, index) => {
                  const metrics = buildStudentMonitoringMetrics(
                    row.weekLogs,
                    row.monthLogs,
                    row.dayLog,
                    year,
                    month,
                    week
                  );
                  return (
                    <div
                      key={row.student.id}
                      className="rounded-2xl border border-white/15 bg-white/10 p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="rounded-xl bg-sky-400/20 px-2.5 py-1.5 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white">
                            {row.student.name}
                          </div>
                          <div className="text-[11px] text-white/65">
                            {row.student.className} | {row.student.nisn || "-"}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold ${scoreColorClass(metrics.weeklyScore)}`}
                        >
                          {metrics.predicate}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <MetricChip
                          label="Mingguan"
                          value={formatPercent(metrics.weeklyScore)}
                        />
                        <MetricChip
                          label="Bulanan"
                          value={formatPercent(metrics.monthlyScore)}
                        />
                        <MetricChip
                          label="Log Masuk"
                          value={`${metrics.loggedDays}/${metrics.validWeekDays} hari`}
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <MetricChip
                          label="Tercapai"
                          value={`${metrics.checkedHabits}/${metrics.totalHabitSlots}`}
                        />
                        <MetricChip
                          label="Kelengkapan"
                          value={formatPercent(metrics.completionRate)}
                        />
                        <MetricChip
                          label="Hari Dipilih"
                          value={metrics.dayStatus}
                        />
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold text-white">
                          Skor Per Habit
                        </div>
                        {metrics.habitScores.map((habit) => (
                          <div key={habit.label}>
                            <div className="mb-1 flex justify-between gap-2 text-[11px]">
                              <span className="text-white">{habit.label}</span>
                              <span className="text-white/65">
                                {habit.checkedDays}/{metrics.validWeekDays} hari |{" "}
                                {formatPercent(habit.score)}
                              </span>
                            </div>
                            <ProgressBar score={habit.score} />
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="mb-2 text-xs font-semibold text-white">
                          Snapshot {dayName}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {KAIH_HABIT_NAMES.map((label, habitIndex) => {
                            const key = `habit${habitIndex + 1}` as keyof KaihHabits;
                            const checked = row.dayLog?.habits?.[key] === true;
                            return (
                              <div
                                key={label}
                                className={`rounded-xl border px-1 py-2 text-center ${
                                  checked
                                    ? "border-emerald-400/55 bg-emerald-500/20"
                                    : "border-white/15 bg-white/10"
                                }`}
                              >
                                <div className="flex h-5 items-center justify-center text-white">
                                  {checked ? (
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                  ) : (
                                    <span className="text-xs text-white/55">-</span>
                                  )}
                                </div>
                                <div className="mt-1 line-clamp-2 text-[9px] leading-tight text-white">
                                  {label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!row.dayLog && (
                          <p className="mt-2 text-[11px] text-white/65">
                            Belum ada log untuk hari {dayName} pada minggu ini.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ApkGlassCard>
      )}

      {!loading && !loadingStudents && tab === 1 && (
        <ApkGlassCard className="space-y-3 p-4">
          <div>
            <div className="text-sm font-bold text-white">Penilaian 7 KAIH</div>
            <p className="mt-1 text-xs text-white/70">
              Nilai bulanan 7 KAIH dengan kontribusi penilaian guru.
            </p>
          </div>

          {gradingRows.length === 0 ? (
            <p className="text-sm text-white">
              Belum ada data siswa untuk dinilai pada periode ini.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5">
                <div className="text-sm font-bold text-white">
                  Isi Cepat Semua ({gradingRows.length} siswa)
                </div>
                <p className="mt-1 text-xs text-white/70">
                  Setiap kriteria (Kejujuran, Perilaku, Inisiatif, Komitmen)
                  otomatis diisi sama untuk semua siswa di kelas ini.
                </p>
                <div className="mt-3 flex gap-2">
                  {RUBRIC_PRESETS.map((preset) => (
                    <PresetActionButton
                      key={preset.label}
                      label={preset.label}
                      className={preset.className}
                      busy={busy}
                      onClick={() => applyPresetToAll(preset.value)}
                    />
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <MetricChip label="Sudah Dinilai" value={String(ratedCount)} />
                  <MetricChip label="Belum Dinilai" value={String(unratedCount)} />
                  <MetricChip
                    label="Jumlah Siswa"
                    value={String(gradingRows.length)}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {gradingRows.map((row, index) => (
                  <div
                    key={row.student.id}
                    className="rounded-2xl border border-white/15 bg-white/10 p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-sky-400/20 px-2.5 py-1.5 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white">
                          {row.student.name}
                        </div>
                        <div className="text-[11px] text-white/65">
                          {row.student.className} | {row.student.nisn || "-"}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditRow(row);
                          setRubricDraft({ ...row.rubric });
                          setError("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {row.isTeacherRated
                          ? `Nilai Guru ${row.rubric.total}`
                          : "Nilai Guru (Belum)"}
                      </button>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <MetricChip
                        label="Harian"
                        value={row.grading.dailyConsistency.toFixed(1)}
                      />
                      <MetricChip
                        label="Mingguan"
                        value={row.grading.weeklyProgress.toFixed(1)}
                      />
                      <MetricChip
                        label="Bulanan"
                        value={row.grading.monthlyAchievement.toFixed(1)}
                      />
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                      <div>
                        <div className="text-[11px] text-white/65">Nilai Akhir</div>
                        <div className="text-2xl font-bold text-white">
                          {row.grading.finalScore.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {row.grading.predicate}
                        </div>
                        <div className="text-[11px] text-white/65">
                          {row.grading.category}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ApkGlassCard>
      )}

      {editRow && (
        <RubricDialog
          title="Penilaian Guru"
          subtitle={editRow.student.name}
          rubric={rubricDraft}
          busy={busy}
          onChange={setRubricDraft}
          onClose={() => setEditRow(null)}
          onSave={saveSingle}
          saveLabel="Simpan"
        />
      )}
    </ApkPageFrame>
  );
}
