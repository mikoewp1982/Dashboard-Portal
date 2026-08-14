"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useTeacherNotificationInbox } from "@/hooks/guru/useTeacherNotificationInbox";
import { teacherFetchRaw } from "@/lib/guru/teacherFetch";
import { GuruShell } from "./GuruShell";
import { GuruPresensiInteractive } from "./GuruPresensiInteractive";
import { GuruSholatInteractive } from "./GuruSholatInteractive";
import { GuruSholatV2Interactive } from "./GuruSholatV2Interactive";
import { GuruLiterasiInteractive } from "./GuruLiterasiInteractive";
import { GuruKaihInteractive } from "./GuruKaihInteractive";
import { GuruKedisiplinanInteractive } from "./GuruKedisiplinanInteractive";

function localYmd(year: number, monthIndex: number, day: number) {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function FeatureShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const { students, loading } = useSupervisedStudents(user?.schoolId, user?.class);
  const { unreadCount } = useTeacherNotificationInbox({
    schoolId: user?.schoolId,
    students,
    rosterReady: !loading,
    enableBrowserNotify: true,
  });
  return <GuruShell unreadCount={unreadCount}>{children}</GuruShell>;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
    </section>
  );
}

export function GuruPresensiView() {
  return (
    <FeatureShell>
      <GuruPresensiInteractive />
    </FeatureShell>
  );
}

export function GuruSholatView() {
  return (
    <FeatureShell>
      <GuruSholatInteractive />
    </FeatureShell>
  );
}

export function GuruSholatV2View() {
  return (
    <FeatureShell>
      <GuruSholatV2Interactive />
    </FeatureShell>
  );
}

export function GuruLiterasiView() {
  return (
    <FeatureShell>
      <GuruLiterasiInteractive />
    </FeatureShell>
  );
}

export function GuruKaihView() {
  return (
    <FeatureShell>
      <GuruKaihInteractive />
    </FeatureShell>
  );
}

export function GuruKedisiplinanView() {
  return (
    <FeatureShell>
      <GuruKedisiplinanInteractive />
    </FeatureShell>
  );
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function GuruRekapView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const [mounted, setMounted] = useState(false);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
    setMounted(true);
  }, []);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  async function downloadExcel() {
    if (!user?.schoolId) {
      setError("Sekolah tidak terdeteksi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const startDate = localYmd(year, month, 1);
      const endDate = localYmd(year, month, lastDay);
      const params = new URLSearchParams({
        schoolId: user.schoolId,
        className: user.class || "",
        startDate,
        endDate,
        format: "excel",
      });
      const res = await teacherFetchRaw(`/api/teacher/recap?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { message?: string }));
        const detail =
          typeof data?.message === "string" && data.message
            ? data.message
            : `HTTP ${res.status}`;
        throw new Error(`Gagal mengunduh rekapitulasi: ${detail}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Filename parity with APK: Rekapitulasi_{Kelas}_{Bulan_Tahun}.xlsx
      const cd = res.headers.get("Content-Disposition") || "";
      const serverName = /filename="([^"]+)"/i.exec(cd)?.[1];
      const safeClass = (user.class || "wali").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safePeriod = `${MONTH_NAMES[month]}_${year}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      a.download =
        serverName || `Rekapitulasi_${safeClass}_${safePeriod}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="Rekapitulasi"
          subtitle={`Laporan kelas ${user?.class || "-"} · sama seperti APK`}
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="text-sm font-semibold text-white">Preview Ringkasan Kelas</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="text-[11px] text-slate-400">Total Siswa</div>
              <div className="mt-1 text-2xl font-bold text-white">
                {loadingStudents ? "…" : students.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="text-[11px] text-slate-400">Periode</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {mounted ? `${MONTH_NAMES[month]} ${year}` : "Memuat..."}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-slate-400">
              Bulan
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Tahun
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void downloadExcel()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {busy ? "Mengunduh..." : "Unduh Excel (.xlsx) 4-in-1"}
          </button>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <p className="text-[11px] leading-relaxed text-slate-500">
            Berisi rekap Kehadiran, Presensi Sholat, Tugas Literasi, dan Kedisiplinan siswa kelas
            Anda.
          </p>
        </section>
      </div>
    </FeatureShell>
  );
}
