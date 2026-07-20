"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, Smartphone, Users, ArrowLeft } from "lucide-react";
import { useGasStudents } from "@/hooks/gas/useGasStudents";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { GasStudentsTable } from "./GasStudentsTable";

type GasStudentsPanelProps = {
  schoolId?: string;
};

export function GasStudentsPanel({ schoolId }: GasStudentsPanelProps) {
  const { data, loading, lastSyncTime, refresh } = useGasStudents(schoolId);
  const { data: classes } = useClassesRealtime(schoolId);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<"VII" | "VIII" | "IX">("VII");
  const [selectedClassName, setSelectedClassName] = useState<string>("ALL");

  const gradeClassOptions = useMemo(() => {
    const normalizedClasses = classes
      .filter((row) => {
        const gradeValue = String(row.grade || "").trim();
        if (selectedGrade === "VII") return gradeValue === "Kelas 7";
        if (selectedGrade === "VIII") return gradeValue === "Kelas 8";
        return gradeValue === "Kelas 9";
      })
      .map((row) => String(row.className || row.class || "").trim().toUpperCase())
      .filter(Boolean);

    return Array.from(new Set(normalizedClasses));
  }, [classes, selectedGrade]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      const studentClass = String(row.class || "").trim().toUpperCase();
      const matchesGrade = studentClass.startsWith(selectedGrade);
      const matchesClass = selectedClassName === "ALL" || studentClass === selectedClassName;
      const matchesQuery =
        row.name?.toLowerCase().includes(query) ||
        row.nisn?.toLowerCase().includes(query) ||
        row.class?.toLowerCase().includes(query);

      return (
        matchesGrade &&
        matchesClass &&
        matchesQuery
      );
    });
  }, [data, searchQuery, selectedClassName, selectedGrade]);

  const totalStudentsInGrade = useMemo(
    () => data.filter((row) => String(row.class || "").trim().toUpperCase().startsWith(selectedGrade)).length,
    [data, selectedGrade]
  );

  const handleSync = async () => {
    try {
      await refresh();
      setSyncMessage("Data berhasil diperbarui dari Admin Database Siswa.");
    } catch (error: unknown) {
      setSyncMessage(error instanceof Error ? `Gagal memuat ulang: ${error.message}` : "Gagal memuat ulang data siswa.");
    } finally {
      window.setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="rounded-[28px] border border-white/10 bg-[#081634]/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 shadow-lg shadow-blue-500/30">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-100">Manajemen Siswa</h1>
                <p className="mt-1 text-sm text-slate-400">Kelola data siswa (Terhubung ke Database)</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-green-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                  Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                {loading ? "Memuat..." : "Muat Ulang Data"}
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white border border-white/10 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Kembali ke Dashboard Satu Pintu</span>
              </Link>
            </div>
          </div>
        </div>

        {syncMessage ? (
          <div
            className={`mt-6 rounded-2xl border p-4 shadow-lg ${
              syncMessage.includes("Gagal")
                ? "border-red-700/50 bg-red-900/30 text-red-300"
                : "border-green-700/50 bg-green-900/30 text-green-300"
            }`}
          >
            <p className="text-sm font-semibold">{syncMessage}</p>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#081634]/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Siswa (Kelas {selectedGrade === "VII" ? "7" : selectedGrade === "VIII" ? "8" : "9"})</p>
            <p className="mt-2 text-3xl font-black text-slate-100">{totalStudentsInGrade}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#081634]/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tampilkan</p>
            <p className="mt-2 text-3xl font-black text-blue-400">{filteredData.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#081634]/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jumlah Kelas</p>
            <p className="mt-2 text-3xl font-black text-purple-400">{gradeClassOptions.length}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[#081634]/90 p-6">
          <div className="flex flex-wrap gap-3">
            {(["VII", "VIII", "IX"] as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  setSelectedGrade(grade);
                  setSelectedClassName("ALL");
                }}
                className={`rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-200 ${
                  selectedGrade === grade
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                    : "border border-slate-700/50 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Kelas {grade === "VII" ? "7" : grade === "VIII" ? "8" : "9"}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-slate-400">Pilih Kelas:</span>
            <button
              type="button"
              onClick={() => setSelectedClassName("ALL")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                selectedClassName === "ALL"
                  ? "border-transparent bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/30"
                  : "border-slate-700/50 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Semua Kelas
            </button>
            {gradeClassOptions.length > 0 ? (
              gradeClassOptions.map((className) => (
                <button
                  key={className}
                  type="button"
                  onClick={() => setSelectedClassName(className)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    selectedClassName === className
                      ? "border-transparent bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                      : "border-slate-700/50 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {className}
                </button>
              ))
            ) : (
              <div className="py-2 text-sm italic text-slate-500">Belum ada kelas untuk tingkat ini.</div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-blue-500/20 bg-gradient-to-r from-indigo-900/60 to-blue-900/40 p-5 text-sm text-slate-200">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-600/20 p-3 text-blue-300">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-blue-100">Data siswa ini terhubung dengan Aplikasi Siswa.</div>
              <div className="mt-1 text-xs text-slate-300">Username: Nama Lengkap (Sesuai Data) | Password: NISN</div>
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, NISN, atau kelas..."
            className="w-full rounded-2xl border border-white/10 bg-[#081634]/90 py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6">
          <GasStudentsTable rows={filteredData} loading={loading} />
          <div className="mt-4 text-sm text-slate-400">Menampilkan {filteredData.length} dari {totalStudentsInGrade} siswa</div>
        </div>
      </div>
    </div>
  );
}
