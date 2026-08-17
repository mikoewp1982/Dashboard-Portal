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
  submittedAt?: number | null;
};

type HistoryRow = {
  studentId: string;
  identityKey: string;
  name: string;
  nisn: string;
  status: string;
  submittedAt: number;
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

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuruSholatV2Interactive() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [prayerType, setPrayerType] = useState<"DHUHA" | "JUMAT">("DHUHA");
  const [items, setItems] = useState<PrayerItem[]>([]);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [jumatScheduled, setJumatScheduled] = useState(true);

  const prayerLabel = prayerType === "JUMAT" ? "Jum'at" : "Dhuha";

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        mode: "daily",
        date: toDateInputValue(selectedDate),
        prayerType,
      });
      if (search.trim()) params.set("q", search.trim());
      const data = await teacherFetch(`/api/teacher/prayer-v2?${params.toString()}`);
      setItems(data.items || []);
      setJumatScheduled(data.jumatScheduled ?? true);
      setManualSelections((prev) => {
        const valid = new Set(
          (data.items || []).map((item: PrayerItem) => item.identityKey)
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
      setJumatScheduled(true);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search, prayerType]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        mode: "history",
        prayerType,
      });
      if (search.trim()) params.set("q", search.trim());
      const data = await teacherFetch(`/api/teacher/prayer-v2?${params.toString()}`);
      setHistoryRows(data.rows || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
      setHistoryRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, prayerType]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (tab === 0) void loadDaily();
      else void loadHistory();
    }, search ? 250 : 0);
    return () => clearTimeout(handle);
  }, [tab, loadDaily, loadHistory, search]);

  const effectiveStats = useMemo(() => {
    const countFor = (status: string) =>
      items.filter((item) => {
        const effective = manualSelections[item.identityKey] || item.status;
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
      const data = await teacherFetch("/api/teacher/prayer-v2", {
        method: "POST",
        body: JSON.stringify({
          date: toDateInputValue(selectedDate),
          prayerType,
          selections,
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
      title="Presensi Dhuha & Jum'at"
      subtitle={`Wali Kelas ${user?.class || "..."} · sama seperti APK guru`}
      backHref="/guru"
    >
      <ApkTabs
        tabs={["Monitoring Harian", "Riwayat"]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-black/15 p-1">
        {(["DHUHA", "JUMAT"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPrayerType(type)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              prayerType === type ? "bg-white/20 text-white shadow" : "text-white/70 hover:text-white"
            }`}
          >
            {type === "JUMAT" ? "Jum'at" : "Dhuha"}
          </button>
        ))}
      </div>

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
                  <div className="text-[11px] text-white/75">Tanggal Presensi {prayerLabel}</div>
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

          {prayerType === "JUMAT" && !jumatScheduled && (
            <div className="rounded-xl border border-amber-300/40 bg-amber-500/20 px-3 py-2 text-xs text-amber-50">
              Kelas wali belum terjadwal untuk Sholat Jum'at pada tanggal ini.
            </div>
          )}

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
            {saving ? "Menyimpan..." : `Simpan Presensi ${prayerLabel} Manual`}
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
      ) : loading ? (
        <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
          Memuat riwayat...
        </div>
      ) : historyRows.length === 0 ? (
        <div className="rounded-2xl bg-black/20 px-4 py-8 text-center text-sm text-white/80">
          Belum ada riwayat {prayerLabel.toLowerCase()} untuk kelas ini
        </div>
      ) : (
        <div className="space-y-2">
          {historyRows.map((row) => (
            <ApkGlassCard key={`${row.identityKey}-${row.submittedAt}`} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{row.name}</div>
                  <div className="text-[11px] text-white/70">
                    {row.nisn || "-"} · {formatDateTime(row.submittedAt)}
                  </div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white">
                  {row.status}
                </div>
              </div>
            </ApkGlassCard>
          ))}
        </div>
      )}
    </ApkPageFrame>
  );
}
