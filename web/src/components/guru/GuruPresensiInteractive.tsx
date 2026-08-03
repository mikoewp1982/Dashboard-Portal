"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { teacherFetch } from "@/lib/guru/teacherFetch";
import {
  ApkActionButton,
  ApkGlassCard,
  ApkPageFrame,
  ApkStatCard,
  ApkTabs,
  CountCell,
  MONTH_NAMES,
  StatusCheckCell,
  TableRow,
  TableShell,
  formatIndonesianDate,
} from "./GuruApkTheme";

type DailyItem = {
  studentId: string;
  identityKey: string;
  monthlyKey: string;
  name: string;
  nisn: string;
  status: string;
  attendanceId: string | null;
};

type MonthlyStudent = {
  studentId: string;
  identityKey: string;
  monthlyKey: string;
  name: string;
  nisn: string;
};

type MonthlyStats = {
  presentCount: number;
  sickCount: number;
  permitCount: number;
  absentCount: number;
};

const STATUS_META = [
  { key: "PRESENT", label: "H", color: "#4CAF50" },
  { key: "SICK", label: "S", color: "#2196F3" },
  { key: "PERMIT", label: "I", color: "#FF9800" },
  { key: "ABSENT", label: "A", color: "#F44336" },
] as const;

function toDateInputValue(ms: number) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function GuruPresensiInteractive() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [items, setItems] = useState<DailyItem[]>([]);
  const [monthlyStudents, setMonthlyStudents] = useState<MonthlyStudent[]>([]);
  const [monthlyRecap, setMonthlyRecap] = useState<Record<string, MonthlyStats>>({});
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1, y + 2];
  }, []);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teacherFetch(
        `/api/teacher/attendance?mode=daily&date=${encodeURIComponent(toDateInputValue(selectedDate))}`
      );
      setItems(data.items || []);
      setManualSelections({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teacherFetch(
        `/api/teacher/attendance?mode=monthly&month=${month}&year=${year}`
      );
      setMonthlyStudents(data.students || []);
      setMonthlyRecap(data.recap || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap");
      setMonthlyStudents([]);
      setMonthlyRecap({});
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (tab === 0) void loadDaily();
    else void loadMonthly();
  }, [tab, loadDaily, loadMonthly]);

  const effectiveStats = useMemo(() => {
    const counts = { PRESENT: 0, SICK: 0, PERMIT: 0, ABSENT: 0 };
    items.forEach((item) => {
      const effective = manualSelections[item.identityKey] || item.status;
      if (effective === "PRESENT") counts.PRESENT += 1;
      else if (effective === "SICK") counts.SICK += 1;
      else if (effective === "PERMIT") counts.PERMIT += 1;
      else if (effective === "ABSENT") counts.ABSENT += 1;
      else counts.ABSENT += 1;
    });
    // APK: ABSENT card = total - present - sick - permit (includes unmarked as alpa in summary)
    const marked = counts.PRESENT + counts.SICK + counts.PERMIT;
    counts.ABSENT = Math.max(0, items.length - marked);
    return counts;
  }, [items, manualSelections]);

  function toggleStatus(item: DailyItem, status: string) {
    const key = item.identityKey;
    const base = item.status;
    const current = manualSelections[key] || item.status;
    setManualSelections((prev) => {
      const next = { ...prev };
      if (current === status && base === status) {
        next[key] = "UNMARKED";
      } else if (current === status) {
        delete next[key];
      } else {
        next[key] = status;
      }
      return next;
    });
  }

  function markAllPresent() {
    const next: Record<string, string> = {};
    items.forEach((item) => {
      next[item.identityKey] = "PRESENT";
    });
    setManualSelections(next);
  }

  async function saveManual() {
    if (Object.keys(manualSelections).length === 0) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const data = await teacherFetch("/api/teacher/attendance", {
        method: "POST",
        body: JSON.stringify({
          date: toDateInputValue(selectedDate),
          selections: manualSelections,
        }),
      });
      setMessage(data.message || "Presensi tersimpan.");
      setManualSelections({});
      await loadDaily();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ApkPageFrame
      title="Rekapitulasi Kehadiran"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
    >
      <ApkTabs
        tabs={["Monitoring Harian", "Rekap Bulanan"]}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <div className="mb-3 rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-xs text-rose-50">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-3 rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-50">
          {message}
        </div>
      )}

      {tab === 0 ? (
        <div className="space-y-3">
          <label className="block">
            <ApkGlassCard className="relative px-4 py-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-white" />
                <div>
                  <div className="text-[11px] text-white/75">Tanggal Absensi</div>
                  <div className="text-sm font-bold text-white">
                    {formatIndonesianDate(selectedDate)}
                  </div>
                </div>
              </div>
              <input
                type="date"
                value={toDateInputValue(selectedDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  const next = new Date(y, m - 1, d);
                  next.setHours(0, 0, 0, 0);
                  setSelectedDate(next.getTime());
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </ApkGlassCard>
          </label>

          <div className="flex gap-2">
            <ApkStatCard label="Hadir" count={effectiveStats.PRESENT} />
            <ApkStatCard label="Sakit" count={effectiveStats.SICK} />
            <ApkStatCard label="Izin" count={effectiveStats.PERMIT} />
            <ApkStatCard label="Alpa" count={effectiveStats.ABSENT} />
          </div>

          <ApkActionButton onClick={markAllPresent} disabled={loading || items.length === 0}>
            Tandai Semua Hadir
          </ApkActionButton>
          <ApkActionButton
            onClick={() => void saveManual()}
            disabled={saving || Object.keys(manualSelections).length === 0}
          >
            {saving ? "Menyimpan..." : "Simpan Presensi Manual"}
          </ApkActionButton>
          <p className="text-[11px] text-white/75">
            Centang ulang status yang sama untuk membatalkan pilihan manual.
          </p>

          {loading ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Memuat data siswa...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Tidak ada data siswa
            </div>
          ) : (
            <TableShell headers={["NO", "NAMA SISWA", "H", "S", "I", "A"]}>
              {items.map((item, index) => {
                const effective = manualSelections[item.identityKey] || item.status;
                return (
                  <TableRow key={item.identityKey || item.studentId} index={index + 1} name={item.name}>
                    {STATUS_META.map((meta) => (
                      <StatusCheckCell
                        key={meta.key}
                        selected={effective === meta.key}
                        color={meta.color}
                        onClick={() => toggleStatus(item, meta.key)}
                      />
                    ))}
                  </TableRow>
                );
              })}
            </TableShell>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <ApkGlassCard className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-[11px] text-white/75">
                Bulan
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-[#0B1F33]/50 px-3 py-2 text-sm text-white"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-[11px] text-white/75">
                Tahun
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/20 bg-[#0B1F33]/50 px-3 py-2 text-sm text-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </ApkGlassCard>

          {loading ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Memuat rekap bulanan...
            </div>
          ) : monthlyStudents.length === 0 ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Tidak ada data siswa
            </div>
          ) : (
            <TableShell headers={["NO", "NAMA SISWA", "H", "S", "I", "A"]}>
              {monthlyStudents.map((student, index) => {
                const stats = monthlyRecap[student.monthlyKey] || {
                  presentCount: 0,
                  sickCount: 0,
                  permitCount: 0,
                  absentCount: 0,
                };
                return (
                  <TableRow
                    key={student.monthlyKey || student.studentId}
                    index={index + 1}
                    name={student.name}
                  >
                    <CountCell value={stats.presentCount} />
                    <CountCell value={stats.sickCount} />
                    <CountCell value={stats.permitCount} />
                    <CountCell value={stats.absentCount} />
                  </TableRow>
                );
              })}
            </TableShell>
          )}
        </div>
      )}
    </ApkPageFrame>
  );
}
