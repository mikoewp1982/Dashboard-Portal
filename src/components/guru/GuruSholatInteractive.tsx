"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
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

type PrayerItem = {
  studentId: string;
  identityKey: string;
  name: string;
  nisn: string;
  status: string;
  canSelect: boolean;
};

type MonthlyStudent = {
  studentId: string;
  identityKey: string;
  name: string;
  nisn: string;
  status: string;
};

type MonthlyStats = {
  prayCount: number;
  notPrayCount: number;
  permitCount: number;
  halanganCount: number;
};

const STATUS_PRAY = "Sudah Presensi";
const STATUS_NOT_PRAY = "Tidak Sholat";
const STATUS_PERMIT = "Izin";
const STATUS_HALANGAN = "Halangan";
const STATUS_NOT_YET = "Belum Presensi";

const PRAYER_META = [
  { key: STATUS_PRAY, api: "PRAY", label: "S", color: "#4CAF50" },
  { key: STATUS_NOT_PRAY, api: "NOT_PRAY", label: "TS", color: "#F44336" },
  { key: STATUS_PERMIT, api: "PERMIT", label: "I", color: "#FF9800" },
  { key: STATUS_HALANGAN, api: "HALANGAN", label: "H", color: "#8E24AA" },
] as const;

function toDateInputValue(ms: number) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function GuruSholatInteractive() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [items, setItems] = useState<PrayerItem[]>([]);
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
      const params = new URLSearchParams({
        mode: "daily",
        date: toDateInputValue(selectedDate),
      });
      if (search.trim()) params.set("q", search.trim());
      const data = await teacherFetch(`/api/teacher/prayer?${params.toString()}`);
      setItems(data.items || []);
      setManualSelections((prev) => {
        const valid = new Set(
          (data.items || [])
            .filter((item: PrayerItem) => item.status === STATUS_NOT_YET)
            .map((item: PrayerItem) => item.identityKey)
        );
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (valid.has(key)) next[key] = value;
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search]);

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        mode: "monthly",
        month: String(month),
        year: String(year),
      });
      if (search.trim()) params.set("q", search.trim());
      const data = await teacherFetch(`/api/teacher/prayer?${params.toString()}`);
      setMonthlyStudents(data.students || []);
      setMonthlyRecap(data.recap || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap");
      setMonthlyStudents([]);
      setMonthlyRecap({});
    } finally {
      setLoading(false);
    }
  }, [month, year, search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (tab === 0) void loadDaily();
      else void loadMonthly();
    }, search ? 250 : 0);
    return () => clearTimeout(handle);
  }, [tab, loadDaily, loadMonthly, search]);

  const effectiveStats = useMemo(() => {
    const countFor = (status: string) =>
      items.filter((item) => {
        const effective =
          manualSelections[item.identityKey] && item.status === STATUS_NOT_YET
            ? manualSelections[item.identityKey]
            : item.status;
        return effective === status;
      }).length;

    return {
      pray: countFor(STATUS_PRAY),
      notPray: countFor(STATUS_NOT_PRAY),
      permit: countFor(STATUS_PERMIT),
      halangan: countFor(STATUS_HALANGAN),
    };
  }, [items, manualSelections]);

  function toggleStatus(item: PrayerItem, status: string) {
    if (item.status !== STATUS_NOT_YET) return;
    const key = item.identityKey;
    setManualSelections((prev) => {
      const next = { ...prev };
      if (next[key] === status) delete next[key];
      else next[key] = status;
      return next;
    });
  }

  async function saveManual() {
    const selections = items
      .map((item) => {
        const status = manualSelections[item.identityKey];
        if (!status) return null;
        const meta = PRAYER_META.find((m) => m.key === status);
        if (!meta) return null;
        return {
          studentId: item.studentId,
          identityKey: item.identityKey,
          status: meta.api,
        };
      })
      .filter(Boolean);

    if (selections.length === 0) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const data = await teacherFetch("/api/teacher/prayer", {
        method: "POST",
        body: JSON.stringify({
          date: toDateInputValue(selectedDate),
          selections,
        }),
      });
      setMessage(data.message || "Presensi sholat tersimpan.");
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
      title="Presensi Sholat"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
      backHref="/guru"
    >
      <ApkTabs
        tabs={["Monitoring Harian", "Rekap Bulanan"]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0B1F33]/35 px-3 py-2">
        <Search className="h-4 w-4 text-white" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau NISN..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60"
        />
      </div>

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
                  <div className="text-[11px] text-white/75">Tanggal Presensi Sholat</div>
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
            <ApkStatCard label="Sholat" count={effectiveStats.pray} />
            <ApkStatCard label="Tidak" count={effectiveStats.notPray} />
            <ApkStatCard label="Izin" count={effectiveStats.permit} />
            <ApkStatCard label="Halangan" count={effectiveStats.halangan} />
          </div>

          <ApkActionButton
            onClick={() => void saveManual()}
            disabled={saving || Object.keys(manualSelections).length === 0}
          >
            {saving ? "Menyimpan..." : "Simpan Presensi Manual"}
          </ApkActionButton>
          <p className="text-[11px] text-white/75">
            Gunakan kolom S, TS, I, atau H untuk memilih status manual siswa.
          </p>

          {loading ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Memuat data siswa...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Belum ada data siswa di kelas ini
            </div>
          ) : (
            <TableShell headers={["NO", "NAMA SISWA", "S", "TS", "I", "H"]}>
              {items.map((item, index) => {
                const selected = manualSelections[item.identityKey];
                return (
                  <TableRow key={item.identityKey || item.studentId} index={index + 1} name={item.name}>
                    {PRAYER_META.map((meta) => (
                      <StatusCheckCell
                        key={meta.key}
                        selected={item.status === meta.key || selected === meta.key}
                        color={meta.color}
                        disabled={!item.canSelect}
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

          <p className="text-[11px] text-white/75">
            Keterangan: S = Sholat, TS = Tidak Sholat, I = Izin, H = Halangan
          </p>

          {loading ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Memuat rekap bulanan...
            </div>
          ) : monthlyStudents.length === 0 ? (
            <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
              Belum ada data siswa di kelas ini
            </div>
          ) : (
            <TableShell headers={["NO", "NAMA SISWA", "S", "TS", "I", "H"]}>
              {monthlyStudents.map((student, index) => {
                const stats = monthlyRecap[student.identityKey] || {
                  prayCount: 0,
                  notPrayCount: 0,
                  permitCount: 0,
                  halanganCount: 0,
                };
                return (
                  <TableRow
                    key={student.identityKey || student.studentId}
                    index={index + 1}
                    name={student.name}
                  >
                    <CountCell value={stats.prayCount} />
                    <CountCell value={stats.notPrayCount} />
                    <CountCell value={stats.permitCount} />
                    <CountCell value={stats.halanganCount} />
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
