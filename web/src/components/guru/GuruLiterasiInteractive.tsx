"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import {
  isLiteracyReviewed,
  useTeacherLiteracyLogs,
  type TeacherLiteracyLog,
} from "@/hooks/guru/useTeacherLiteracyLogs";
import { teacherFetch } from "@/lib/guru/teacherFetch";
import { ApkGlassCard, ApkPageFrame, ApkTabs } from "./GuruApkTheme";

const GRADES = ["A", "B", "C", "D"] as const;

function safeText(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  try {
    const s = JSON.stringify(value);
    return s && s !== "{}" ? s : fallback;
  } catch {
    return fallback;
  }
}

function formatLiteracyDate(ms: unknown) {
  const n = typeof ms === "number" && Number.isFinite(ms) ? ms : NaN;
  const t = Number.isFinite(n) && n > 1e9 ? n : Date.now();
  try {
    return new Date(t).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function lineClampFallback(text: unknown, maxLines = 2, maxChars = 160) {
  const s = safeText(text, "");
  if (!s) return s;
  if (s.length <= maxChars) return s;
  // Manual fallback if CSS line-clamp ever fails to be present (e.g. missing plugin).
  // We still keep CSS class on the element for proper behavior.
  return s.slice(0, maxChars) + "…";
}

export function GuruLiterasiInteractive() {
  const user = useAuthStore((s) => s.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(
    user?.schoolId,
    user?.class
  );
  const { logs, loading } = useTeacherLiteracyLogs(
    user?.schoolId,
    students,
    user?.class
  );
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<TeacherLiteracyLog | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [grade, setGrade] = useState("A");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        try {
          const status = safeText(log?.status, "PENDING");
          const reviewed = isLiteracyReviewed(status);
          return tab === 0 ? !reviewed : reviewed;
        } catch {
          return tab === 0;
        }
      }),
    [logs, tab]
  );

  function openGrade(log: TeacherLiteracyLog) {
    setSelected(log);
    setGrade(safeText(log.grade, "A") || "A");
    setFeedback(safeText(log.feedback, ""));
    setError("");
    setShowDelete(false);
  }

  async function submitGrade() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await teacherFetch("/api/teacher/literacy", {
        method: "POST",
        body: JSON.stringify({
          action: "grade",
          logId: selected.id,
          grade,
          feedback,
        }),
      });
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nilai");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await teacherFetch("/api/teacher/literacy", {
        method: "POST",
        body: JSON.stringify({ action: "delete", logId: selected.id }),
      });
      setSelected(null);
      setShowDelete(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ApkPageFrame
      title="Literasi Siswa"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
      backHref="/guru"
    >
      <ApkTabs
        tabs={["Perlu Dinilai", "Sudah Dinilai"]}
        active={tab}
        onChange={setTab}
      />

      {(loading || loadingStudents) && (
        <div className="rounded-2xl border border-white/20 bg-[#0B1F33]/30 p-6 text-center text-sm text-white/80">
          Memuat data literasi...
        </div>
      )}

      {!loading && !loadingStudents && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/20 bg-[#0B1F33]/30 p-8 text-center text-sm text-white">
          Tidak ada data literasi
        </div>
      )}

      {!loading && !loadingStudents && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((log, index) => {
            const reviewed = isLiteracyReviewed(safeText(log?.status, "PENDING"));
            const studentName = safeText(log?.studentName, "Siswa");
            const studentClass =
              safeText(log?.studentClass, "") || safeText(user?.class, "") || "-";
            const bookTitle = safeText(log?.bookTitle, "Jurnal literasi");
            const author = safeText(log?.author, "");
            const summaryRaw = safeText(log?.summary, "Tidak ada ringkasan.");
            const gradeShown = safeText(log?.grade, "-") || "-";
            return (
              <ApkGlassCard key={log.id || `lit-${index}`} className="overflow-hidden">
                <div
                  className={`h-1 w-full ${reviewed ? "bg-[#4CAF50]" : "bg-[#0F7BFF]"}`}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openGrade(log)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openGrade(log);
                    }
                  }}
                  className="cursor-pointer p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-white/15 px-2 py-1.5 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">
                        {studentName}
                      </div>
                      <div className="text-xs text-white/70">
                        {studentClass} | {formatLiteracyDate(log?.timestamp)}
                      </div>
                    </div>
                    {reviewed ? (
                      <div className="flex items-center gap-1">
                        <span className="rounded-full bg-[#4CAF50] px-2 py-1 text-[10px] font-semibold text-white">
                          Nilai: {gradeShown}
                        </span>
                        {tab === 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(log);
                              setShowDelete(true);
                              setError("");
                            }}
                            className="rounded-lg p-1 text-[#F44336] hover:bg-white/10"
                            aria-label="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="rounded-full bg-[#FF9800] px-2 py-1 text-[10px] font-semibold text-white">
                        Menunggu
                      </span>
                    )}
                  </div>
                  <div className="my-2 h-px bg-white/20" />
                  <div className="truncate text-sm font-semibold text-white">
                    {bookTitle}
                    {author ? ` (${author})` : ""}
                  </div>
                  <p
                    className="mt-1 line-clamp-2 text-xs text-white/70"
                    title={summaryRaw}
                  >
                    {lineClampFallback(summaryRaw, 2, 160)}
                  </p>
                </div>
              </ApkGlassCard>
            );
          })}
        </div>
      )}

      {selected && !showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-[#0F2A43] p-5 text-white shadow-xl">
            <h3 className="text-lg font-bold">Nilai Literasi</h3>
            <p className="mt-2 text-xs text-white/70">
              Nama: {safeText(selected?.studentName, "Siswa")}
            </p>
            <p className="text-xs text-white/70">
              Buku: {safeText(selected?.bookTitle, "") || "-"}
            </p>
            <div className="mt-3">
              <div className="text-xs text-white/70">Ringkasan:</div>
              <div className="mt-1 max-h-36 overflow-y-auto rounded-xl border border-white/15 bg-[#0B1F33]/40 p-3 text-xs leading-relaxed text-white whitespace-pre-wrap break-words">
                {safeText(selected?.summary, "Tidak ada ringkasan.")}
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 text-xs text-white/70">Pilih Nilai:</div>
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`rounded-xl border py-2 text-sm font-bold ${
                      grade === g
                        ? "border-white/40 bg-white/20 text-white"
                        : "border-white/15 bg-[#0B1F33]/40 text-white/80"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-4 block text-xs text-white/70">
              Umpan Balik (Opsional)
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-2xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              />
            </label>
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitGrade()}
                className="flex-1 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-[#0F2A43] p-5 text-white shadow-xl">
            <h3 className="text-lg font-bold">Hapus Laporan</h3>
            <p className="mt-2 text-sm text-white/75">
              Apakah Anda yakin ingin menghapus laporan literasi dari{" "}
              {safeText(selected?.studentName, "siswa")}?
            </p>
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowDelete(false);
                  setSelected(null);
                }}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="flex-1 rounded-xl bg-[#F44336]/25 px-3 py-2.5 text-sm font-bold text-[#F44336] disabled:opacity-50"
              >
                {busy ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ApkPageFrame>
  );
}
