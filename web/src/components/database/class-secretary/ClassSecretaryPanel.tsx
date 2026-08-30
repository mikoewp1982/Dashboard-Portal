"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { DatabaseBanner } from "@/components/database/shared/DatabaseBanner";
import { DatabaseRecord } from "@/components/database/shared/databaseConfig";

type ClassSecretaryPanelProps = {
  schoolId?: string;
};

type StudentLookup = {
  id: string;
  name: string;
  className: string;
  username: string;
  status: string;
  gender: string;
  religion: string;
};

const SECRETARY_POSITION = "Sekretaris Kelas";

function normalizeSecretaryPosition(value?: string) {
  return String(value || "").trim().toLowerCase() === SECRETARY_POSITION.toLowerCase();
}

function buildStudentUpdatePayload(row: DatabaseRecord, position: string) {
  const className = (row.class || row.className || "").trim();
  return {
    name: row.name || "",
    username: row.username || row.name || "",
    nisn: row.nisn || "",
    class: className,
    className,
    position,
    status: row.status || "Aktif",
    gender: row.gender || "L",
    religion: row.religion || "ISLAM",
  };
}

export function ClassSecretaryPanel({ schoolId }: ClassSecretaryPanelProps) {
  const { data, loading, lastSyncTime } = useStudentsRealtime(schoolId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nisnInput, setNisnInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentsByNisn = useMemo<Record<string, StudentLookup>>(
    () =>
      Object.fromEntries(
        data
          .map((row) => {
            const nisn = String(row.nisn || "").trim();
            if (!nisn) return null;
            return [
              nisn,
              {
                id: row.id,
                name: row.name || "",
                className: row.class || row.className || "",
                username: row.username || row.name || "",
                status: row.status || "Aktif",
                gender: row.gender || "L",
                religion: row.religion || "ISLAM",
              },
            ] as const;
          })
          .filter((entry): entry is readonly [string, StudentLookup] => Boolean(entry))
      ),
    [data]
  );

  const secretaryRows = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return data
      .filter((row) => normalizeSecretaryPosition(row.position))
      .filter((row) => {
        if (!query) return true;
        const className = row.class || row.className || "";
        return (
          row.name?.toLowerCase().includes(query) ||
          row.nisn?.toLowerCase().includes(query) ||
          className.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.class || a.className || "").localeCompare(b.class || b.className || "", undefined, { numeric: true, sensitivity: "base" }));
  }, [data, searchQuery]);

  const selectedStudent = studentsByNisn[String(nisnInput || "").trim()];

  const openAddModal = () => {
    setNisnInput("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nisnKey = String(nisnInput || "").trim();
    const student = studentsByNisn[nisnKey];
    if (!student) {
      alert("NISN siswa tidak ditemukan di Database Siswa. Tambahkan siswa dulu atau pastikan NISN benar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await callAdminDatabaseApi({
        action: "update",
        tab: "Siswa",
        id: student.id,
        data: {
          name: student.name,
          username: student.username,
          nisn: nisnKey,
          class: student.className,
          className: student.className,
          position: SECRETARY_POSITION,
          status: student.status,
          gender: student.gender,
          religion: student.religion,
        },
      });
      setIsModalOpen(false);
      setNisnInput("");
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menetapkan sekretaris kelas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (row: DatabaseRecord) => {
    if (!confirm(`Cabut akses Sekretaris Kelas untuk ${row.name || row.nisn || "siswa ini"}?`)) return;

    try {
      await callAdminDatabaseApi({
        action: "update",
        tab: "Siswa",
        id: row.id,
        data: buildStudentUpdatePayload(row, ""),
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat mencabut akses sekretaris kelas.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Sekretaris Kelas</h1>
          <p className="mt-1 text-sm text-slate-400">Kelola akses sekretaris kelas dari data induk siswa</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Tambah Sekretaris Kelas
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Dashboard Satu Pintu</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <DatabaseBanner activeTab="Sekretaris Kelas" />

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, NISN, atau kelas sekretaris..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama</th>
                  <th className="px-6 py-4 font-semibold">NISN</th>
                  <th className="px-6 py-4 font-semibold">Kelas</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : secretaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                      <p className="font-medium text-slate-400">Belum ada data Sekretaris Kelas</p>
                    </td>
                  </tr>
                ) : (
                  secretaryRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{row.name || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-300">{row.nisn || "-"}</td>
                      <td className="px-6 py-4 text-slate-300">{row.class || row.className || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/20">
                          Akses aktif di APK GAS Siswa
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevoke(row)}
                          className="rounded bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-red-400"
                        >
                          Cabut Akses
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="border-t border-white/10 bg-slate-900/20 px-6 py-4 text-xs text-slate-500">
              Menampilkan {secretaryRows.length} data sekretaris kelas
            </div>
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Tambah Sekretaris Kelas</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">NISN Siswa</label>
                <input
                  type="text"
                  required
                  value={nisnInput}
                  onChange={(e) => setNisnInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Masukkan NISN siswa yang sudah terdaftar"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="font-semibold text-white">Data Siswa</div>
                <div className="mt-2 space-y-1 text-sm text-slate-300">
                  <div>Nama: {selectedStudent?.name || "-"}</div>
                  <div>Kelas: {selectedStudent?.className || "-"}</div>
                  <div>Username Login: {selectedStudent?.username || "-"}</div>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                Siswa yang dipilih akan otomatis diberi jabatan <span className="font-semibold">{SECRETARY_POSITION}</span>
                {" "}dan mendapat menu <span className="font-semibold">Presensi Siswa</span> di APK GAS Siswa.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudent}
                  className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Akses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
