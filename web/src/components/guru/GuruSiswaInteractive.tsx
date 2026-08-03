"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useClassVirtualPets } from "@/hooks/guru/useClassVirtualPets";
import { resolvePetStatus } from "@/lib/guru/petStatus";
import { ApkGlassCard, ApkPageFrame } from "./GuruApkTheme";

export function GuruSiswaInteractive() {
  const user = useAuthStore((s) => s.user);
  const { students, loading } = useSupervisedStudents(user?.schoolId, user?.class);
  const { petForStudent, loading: loadingPets } = useClassVirtualPets(
    user?.schoolId,
    students
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        student.nisn.toLowerCase().includes(q) ||
        student.className.toLowerCase().includes(q)
    );
  }, [query, students]);

  const selected = filtered.find((s) => s.id === selectedId) || null;

  return (
    <ApkPageFrame
      title="Data Siswa"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, NISN, atau kelas..."
          className="w-full rounded-2xl border border-white/20 bg-[#0B1F33]/30 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/60 focus:border-white/40"
        />
      </div>

      {(loading || loadingPets) && (
        <div className="rounded-2xl border border-white/20 bg-[#0B1F33]/30 p-6 text-center text-sm text-white/80">
          Memuat data siswa...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/20 bg-[#0B1F33]/30 p-8 text-center text-sm text-white">
          Tidak ada data siswa
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ApkGlassCard className="overflow-hidden">
          <div className="flex h-12 items-center bg-white/10 text-[10px] font-bold uppercase tracking-wide text-white">
            <div className="flex h-full w-8 shrink-0 items-center justify-center border-r border-white/50">
              NO
            </div>
            <div className="flex h-full w-[68px] shrink-0 items-center justify-center border-r border-white/50">
              NISN
            </div>
            <div className="flex h-full min-w-0 flex-1 items-center justify-center border-r border-white/50 px-1">
              NAMA
            </div>
            <div className="flex h-full w-[52px] shrink-0 items-center justify-center border-r border-white/50">
              KELAS
            </div>
            <div className="flex h-full w-[58px] shrink-0 items-center justify-center">PET</div>
          </div>

          <div className="divide-y divide-white/50">
            {filtered.map((student, index) => {
              const pet = petForStudent(student);
              const status = resolvePetStatus(pet);
              const classLabel = student.className.replace(/Kelas\s*/i, "") || "-";

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  className="flex min-h-[64px] w-full items-stretch text-left"
                >
                  <div className="flex w-8 shrink-0 items-center justify-center border-r border-white/50 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex w-[68px] shrink-0 items-center justify-center border-r border-white/50 px-0.5 text-[10px] text-white/75">
                    <span className="truncate">{student.nisn || "-"}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center border-r border-white/50 px-1.5 py-2">
                    <span className="line-clamp-2 text-xs font-semibold leading-snug text-white">
                      {student.name}
                    </span>
                  </div>
                  <div className="flex w-[52px] shrink-0 items-center justify-center border-r border-white/50 px-0.5">
                    <span className="max-w-full truncate rounded-md bg-[#0F7BFF]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#93C5FD]">
                      {classLabel}
                    </span>
                  </div>
                  <div className="flex w-[58px] shrink-0 items-center justify-center px-0.5">
                    <span
                      className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold"
                      style={{ background: status.background, color: status.textColor }}
                    >
                      {status.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </ApkGlassCard>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-[#0F2A43] p-5 text-white shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold">Detail Siswa</h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-1 text-white/70 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-white/70">Nama</dt>
                <dd className="font-medium">{selected.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/70">NISN</dt>
                <dd className="font-medium">{selected.nisn || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/70">Kelas</dt>
                <dd className="font-medium">{selected.className || user?.class || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/70">Status Pet</dt>
                <dd className="font-medium">
                  {resolvePetStatus(petForStudent(selected)).label}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-5 w-full rounded-xl bg-white/15 py-2.5 text-sm font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </ApkPageFrame>
  );
}
