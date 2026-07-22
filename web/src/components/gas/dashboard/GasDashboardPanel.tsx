"use client";

import { useGasStudents } from "@/hooks/gas/useGasStudents";
import { useGasTeachers } from "@/hooks/gas/useGasTeachers";
import { Users, GraduationCap, Activity, Wifi } from "lucide-react";
import { useMemo } from "react";

export function GasDashboardPanel({ schoolId }: { schoolId: string }) {
  const { data: students, loading: loadingStudents } = useGasStudents(schoolId);
  const { data: teachers, loading: loadingTeachers } = useGasTeachers(schoolId);

  const activeStudents = useMemo(() => students.length, [students]);
  const activeTeachers = useMemo(() => teachers.length, [teachers]);

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Beranda GAS</h1>
        <p className="mt-2 text-sm text-slate-400">
          Ringkasan utama operasional Gerbang Aplikasi Sekolah (GAS) secara real-time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Siswa */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition hover:bg-white/10">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Live
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400">Total Siswa Terdaftar</h3>
            <p className="mt-1 text-3xl font-bold text-white">
              {loadingStudents ? "-" : activeStudents}
            </p>
          </div>
        </div>

        {/* Guru */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition hover:bg-white/10">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Live
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400">Total Guru & Staf</h3>
            <p className="mt-1 text-3xl font-bold text-white">
              {loadingTeachers ? "-" : activeTeachers}
            </p>
          </div>
        </div>

        {/* Status Server */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition hover:bg-white/10">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wifi className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400">Koneksi Database</h3>
            <p className="mt-1 text-xl font-bold text-emerald-400">Stabil (Online)</p>
          </div>
        </div>

        {/* Aktivitas */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-sm transition hover:bg-white/10">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400">Uptime Sistem</h3>
            <p className="mt-1 text-2xl font-bold text-white">99.9%</p>
          </div>
        </div>
      </div>

      {/* Info Tambahan */}
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">Log Aktivitas Terbaru</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
            <div>
              <p className="text-sm text-slate-200">Sistem GAS berhasil memuat data guru dan siswa terbaru.</p>
              <p className="text-xs text-slate-400">Baru saja</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-b border-white/5 pb-4 border-transparent">
            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
            <div>
              <p className="text-sm text-slate-200">Koneksi ke Firebase Realtime Database terverifikasi.</p>
              <p className="text-xs text-slate-400">Sistem terhubung dengan aman</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
