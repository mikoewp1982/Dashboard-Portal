"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { teacherFetch } from "@/lib/guru/teacherFetch";
import { ApkGlassCard, ApkPageFrame } from "./GuruApkTheme";

type DisciplineStudent = {
  id: string;
  recordId: string;
  name: string;
  nisn: string;
  username: string;
  className: string;
  preferredId: string;
};

type DisciplineRule = {
  id: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  severity: string;
  description: string | null;
  isActive: boolean;
};

type HistoryItem = {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  ruleId: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  description: string;
  date: number;
  status: string;
};

type DisciplineStats = {
  violationCount: number;
  violationPoints: number;
  achievementCount: number;
  achievementPoints: number;
};

type ViewMode = "violations" | "history";

function formatHistoryDate(ms: number) {
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuruKedisiplinanInteractive() {
  const user = useAuthStore((s) => s.user);
  const [viewMode, setViewMode] = useState<ViewMode>("violations");
  const [students, setStudents] = useState<DisciplineStudent[]>([]);
  const [rules, setRules] = useState<DisciplineRule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<DisciplineStats>({
    violationCount: 0,
    violationPoints: 0,
    achievementCount: 0,
    achievementPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<DisciplineStudent | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const violationRules = useMemo(
    () => rules.filter((r) => r.category === "VIOLATION" && r.isActive),
    [rules]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teacherFetch("/api/teacher/discipline");
      setStudents(data.students || []);
      setRules(data.rules || []);
      setHistory(data.history || []);
      setStats(
        data.stats || {
          violationCount: 0,
          violationPoints: 0,
          achievementCount: 0,
          achievementPoints: 0,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data kedisiplinan");
      setStudents([]);
      setRules([]);
      setHistory([]);
      setStats({
        violationCount: 0,
        violationPoints: 0,
        achievementCount: 0,
        achievementPoints: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openInput(student: DisciplineStudent) {
    setSelectedStudent(student);
    setSelectedRuleId(null);
    setDescription("");
    setMessage("");
    setError("");
  }

  function closeInput() {
    setSelectedStudent(null);
    setSelectedRuleId(null);
    setDescription("");
  }

  async function saveRecord() {
    if (!selectedStudent || selectedRuleId == null) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await teacherFetch("/api/teacher/discipline", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent.preferredId || selectedStudent.id,
          ruleId: selectedRuleId,
          description,
        }),
      });
      setMessage(data.message || "Pelanggaran final berhasil dicatat");
      closeInput();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ApkPageFrame
      title="Monitoring Kedisiplinan"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
      backHref="/guru"
    >
      {error && !selectedStudent && (
        <div className="mb-3 rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-50">
          {error}
          <button
            type="button"
            onClick={() => void loadData()}
            className="ml-2 underline"
          >
            Coba Lagi
          </button>
        </div>
      )}
      {message && (
        <div className="mb-3 rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-50">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-white/80">Memuat data...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              primaryValue={`${stats.violationCount} Kasus`}
              secondaryValue={`${stats.violationPoints} Poin`}
              label="Pelanggaran"
              accent="#F44336"
              active={viewMode === "violations"}
              onClick={() => setViewMode("violations")}
            />
            <ModeCard
              primaryValue={`${history.length} Data`}
              secondaryValue={
                history.length === 0 ? "Belum ada catatan" : "Riwayat terbaru kelas"
              }
              label="Riwayat"
              accent="#12D6C6"
              active={viewMode === "history"}
              onClick={() => setViewMode("history")}
            />
          </div>

          {viewMode === "violations" ? (
            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">Input Pelanggaran Final</h3>
              {students.length === 0 ? (
                <div className="rounded-2xl border border-white/15 bg-[#0B1F33]/35 px-4 py-6 text-center text-sm text-white/70">
                  Belum ada siswa di kelas wali.
                </div>
              ) : (
                students.map((student) => (
                  <ApkGlassCard
                    key={student.id}
                    onClick={() => openInput(student)}
                    className="px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold uppercase tracking-wide text-white">
                          {student.name}
                        </div>
                        <div className="truncate text-xs text-white/70">
                          {student.nisn || "—"}
                        </div>
                      </div>
                      <Plus className="h-5 w-5 shrink-0 text-white" aria-label="Input" />
                    </div>
                  </ApkGlassCard>
                ))
              )}
            </section>
          ) : (
            <section className="space-y-3">
              <h3 className="text-base font-bold text-white">Riwayat Terbaru</h3>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-white/15 bg-[#0B1F33]/35 px-4 py-8 text-center text-sm text-white/70">
                  Belum ada data kedisiplinan
                </div>
              ) : (
                history.map((item, index) => {
                  const isViolation = item.category === "VIOLATION";
                  const accent = isViolation ? "#F44336" : "#4CAF50";
                  return (
                    <ApkGlassCard key={item.id} className="overflow-hidden">
                      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                      <div className="flex items-start gap-3 px-3.5 py-3.5">
                        <div className="rounded-lg bg-white/15 px-2 py-1.5 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div
                          className="mt-2 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white">
                            {item.studentName}
                          </div>
                          <div className="text-sm text-white/75">{item.ruleName}</div>
                          {item.description ? (
                            <div className="mt-1 text-xs text-white/65">
                              {item.description}
                            </div>
                          ) : null}
                          <div className="mt-1 text-[11px] text-white/60">
                            {formatHistoryDate(item.date)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div
                            className="text-sm font-bold"
                            style={{ color: accent }}
                          >
                            {item.points} Poin
                          </div>
                          <div className="text-[11px]" style={{ color: accent }}>
                            {isViolation ? "Pelanggaran" : "Prestasi"}
                          </div>
                        </div>
                      </div>
                    </ApkGlassCard>
                  );
                })
              )}
            </section>
          )}
        </div>
      )}

      {selectedStudent ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-[#0F2A43] p-4 shadow-xl">
            <h4 className="text-base font-bold text-white">
              Input Poin: {selectedStudent.name}
            </h4>
            <p className="mt-1 text-xs text-white/70">Pilih Jenis:</p>

            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/20 bg-[#0B1F33]/40">
              {violationRules.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-white/60">
                  Belum ada aturan pelanggaran aktif.
                </div>
              ) : (
                violationRules.map((rule) => {
                  const active = selectedRuleId === rule.id;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm ${
                        active ? "bg-white/15" : "hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0 flex-1 text-white">{rule.ruleName}</span>
                      <span className="shrink-0 text-xs font-bold text-white">
                        {rule.points} Poin
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <label className="mt-3 block text-xs text-white/70">
              Keterangan Tambahan
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-white/20 bg-[#0B1F33]/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                placeholder="Opsional"
              />
            </label>

            {error && selectedStudent ? (
              <p className="mt-2 text-xs text-rose-300">{error}</p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeInput}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={selectedRuleId == null || saving}
                onClick={() => void saveRecord()}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ApkPageFrame>
  );
}

function ModeCard({
  primaryValue,
  secondaryValue,
  label,
  accent,
  active,
  onClick,
}: {
  primaryValue: string;
  secondaryValue: string;
  label: string;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[90px] flex-col justify-center rounded-2xl border px-3.5 py-3 text-left transition ${
        active
          ? "bg-white/12"
          : "bg-[#0B1F33]/35"
      }`}
      style={{
        borderColor: active ? accent : "rgba(255,255,255,0.18)",
        borderWidth: active ? 1.4 : 1,
      }}
    >
      <div className="text-sm font-bold" style={{ color: accent }}>
        {primaryValue}
      </div>
      <div className="text-xs text-white/75">{secondaryValue}</div>
      <div className="text-[11px] text-white/65">{label}</div>
    </button>
  );
}
