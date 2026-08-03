"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useTeacherNotificationInbox } from "@/hooks/guru/useTeacherNotificationInbox";
import {
  useClassDayStatus,
  useDisciplineClassRecords,
  useLiteracyClassRecords,
} from "@/hooks/guru/useClassDayStatus";
import { GuruShell } from "./GuruShell";

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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
      {text}
    </div>
  );
}

function DayStatusList({
  loading,
  rows,
}: {
  loading: boolean;
  rows: { studentId: string; name: string; nisn: string; status: string }[];
}) {
  if (loading) return <EmptyState text="Memuat data hari ini..." />;
  if (rows.length === 0) return <EmptyState text="Belum ada siswa untuk kelas wali ini." />;

  return (
    <section className="space-y-2">
      {rows.map((row) => {
        const pending = /belum/i.test(row.status);
        return (
          <div
            key={row.studentId}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{row.name}</div>
              <div className="text-xs text-slate-400">NISN {row.nisn || "-"}</div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                pending
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-emerald-500/15 text-emerald-200"
              }`}
            >
              {row.status}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function RecordList({
  loading,
  rows,
  empty,
}: {
  loading: boolean;
  rows: { id: string; title: string; subtitle: string; status: string; createdAt: number }[];
  empty: string;
}) {
  if (loading) return <EmptyState text="Memuat data..." />;
  if (rows.length === 0) return <EmptyState text={empty} />;

  return (
    <section className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-300">
              {row.status}
            </span>
            <span className="text-[10px] text-slate-500">
              {new Date(row.createdAt).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{row.title}</div>
          <div className="mt-1 text-xs text-slate-400">{row.subtitle}</div>
        </div>
      ))}
    </section>
  );
}

export function GuruPresensiView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const { rows, loading } = useClassDayStatus(user?.schoolId, students, "attendance_by_school");

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="Presensi Siswa"
          subtitle={`Kehadiran hari ini · Kelas ${user?.class || "-"}`}
        />
        <DayStatusList loading={loading || loadingStudents} rows={rows} />
      </div>
    </FeatureShell>
  );
}

export function GuruSholatView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const { rows, loading } = useClassDayStatus(
    user?.schoolId,
    students,
    "prayer_attendance_by_school"
  );

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="Presensi Sholat"
          subtitle={`Presensi sholat hari ini · Kelas ${user?.class || "-"}`}
        />
        <DayStatusList loading={loading || loadingStudents} rows={rows} />
      </div>
    </FeatureShell>
  );
}

export function GuruLiterasiView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const { rows, loading } = useLiteracyClassRecords(user?.schoolId, students);

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="Literasi & Tugas"
          subtitle={`Jurnal & tugas literasi siswa kelas ${user?.class || "wali"}`}
        />
        <RecordList
          loading={loading || loadingStudents}
          rows={rows}
          empty="Belum ada jurnal literasi untuk kelas ini."
        />
      </div>
    </FeatureShell>
  );
}

export function GuruKaihView() {
  const user = useAuthStore((state) => state.user);

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="7 KAIH"
          subtitle={`Monitoring 7 kebiasaan anak Indonesia hebat · Kelas ${user?.class || "-"}`}
        />
        <section className="rounded-3xl border border-dashed border-teal-400/30 bg-teal-500/10 p-5">
          <div className="text-sm font-semibold text-teal-50">Segera hadir di PWA</div>
          <p className="mt-2 text-xs leading-relaxed text-teal-100/80">
            Penilaian dan monitoring 7 KAIH lengkap tersedia di APK GAS Guru. Versi web akan
            menyusul dengan alur yang sama.
          </p>
        </section>
      </div>
    </FeatureShell>
  );
}

export function GuruKedisiplinanView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const { rows, loading } = useDisciplineClassRecords(user?.schoolId, students);

  return (
    <FeatureShell>
      <div className="space-y-4">
        <PageHeader
          title="Kedisiplinan"
          subtitle={`Catatan pelanggaran siswa kelas ${user?.class || "wali"}`}
        />
        <RecordList
          loading={loading || loadingStudents}
          rows={rows}
          empty="Belum ada catatan kedisiplinan untuk kelas ini."
        />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Input pelanggaran baru tetap tersedia penuh di APK. Di PWA saat ini menampilkan riwayat
          kelas wali.
        </p>
      </div>
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
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);
      const params = new URLSearchParams({
        schoolId: user.schoolId,
        className: user.class || "",
        startDate,
        endDate,
        format: "excel",
      });
      const res = await fetch(`/api/teacher/recap?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengunduh rekapitulasi");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-kelas-${user.class || "wali"}-${MONTH_NAMES[month]}-${year}.xlsx`;
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
                {MONTH_NAMES[month]} {year}
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
