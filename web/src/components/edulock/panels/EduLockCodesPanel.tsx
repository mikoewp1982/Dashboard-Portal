"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import QRCode from "react-qr-code";
import { useEduLockCodes } from "@/hooks/edulock/useEduLockCodes";
import { useEduLockActiveSessions } from "@/hooks/edulock/useEduLockActiveSessions";
import { useEduLockClassPermissions } from "@/hooks/edulock/useEduLockClassPermissions";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";

type ClassRecord = {
  id?: string;
  name?: string;
  className?: string;
};

type StudentRecord = {
  id?: string;
  name?: string;
  class?: string;
  className?: string;
  kelas?: string;
};

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  const t1 = h1 * 60 + m1;
  const t2 = h2 * 60 + m2;
  return t2 >= t1 ? t2 - t1 : (24 * 60 - t1) + t2;
};

const normalizeClassName = (value: unknown) => String(value || "").trim();

export function EduLockCodesPanel({ schoolId }: { schoolId: string }) {
  const [startTimeInput, setStartTimeInput] = useState("07:00");
  const [endTimeInput, setEndTimeInput] = useState("14:00");
  const [selectedClassName, setSelectedClassName] = useState("");

  const { codes, loading, saving, generateCode, deleteCode, deleteExpiredCodes } = useEduLockCodes(schoolId);
  const { sessions, loading: sessionsLoading, revoking, revokeAllSessions } = useEduLockActiveSessions(schoolId);
  const { saving: classSaving, grantClassPermission, revokeClassPermission } = useEduLockClassPermissions(schoolId);
  const { data: classesData, loading: classesLoading } = useClassesRealtime(schoolId);
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);

  const classCatalog = useMemo(() => {
    const sourceNames = new Set<string>();

    (classesData as ClassRecord[]).forEach((item) => {
      const className = normalizeClassName(item.className || item.name || item.id);
      if (className) sourceNames.add(className);
    });

    (studentsData as StudentRecord[]).forEach((item) => {
      const className = normalizeClassName(item.kelas || item.className || item.class);
      if (className) sourceNames.add(className);
    });

    return Array.from(sourceNames).sort((a, b) => a.localeCompare(b));
  }, [classesData, studentsData]);

  const studentCountByClass = useMemo(() => {
    const counts = new Map<string, number>();
    (studentsData as StudentRecord[]).forEach((item) => {
      const className = normalizeClassName(item.kelas || item.className || item.class);
      if (!className) return;
      counts.set(className, (counts.get(className) || 0) + 1);
    });
    return counts;
  }, [studentsData]);

  const activeClassPermissions = useMemo(() => {
    const now = Date.now();
    const grouped = new Map<
      string,
      {
        className: string;
        sessionStart?: string;
        sessionEnd?: string;
        endTime?: number;
        affectedStudents: number;
      }
    >();

    sessions
      .filter(
        (session) =>
          session.activationSource === "admin-class" &&
          normalizeClassName(session.class) &&
          Number(session.endTime || 0) > now
      )
      .forEach((session) => {
        const className = normalizeClassName(session.class);
        const existing = grouped.get(className);
        grouped.set(className, {
          className,
          sessionStart: session.sessionStart || existing?.sessionStart || (
            typeof session.startTime === "number"
              ? new Date(session.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              : "-"
          ),
          sessionEnd: session.sessionEnd || existing?.sessionEnd || (
            typeof session.endTime === "number"
              ? new Date(session.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              : "-"
          ),
          endTime: Math.max(existing?.endTime || 0, Number(session.endTime || 0)),
          affectedStudents: (existing?.affectedStudents || 0) + 1,
        });
      });

    return Array.from(grouped.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [sessions]);

  const handleCreateCode = () => {
    void generateCode(startTimeInput, endTimeInput, calculateDuration(startTimeInput, endTimeInput));
  };

  const handleActivateClass = async () => {
    if (!selectedClassName) {
      window.alert("Pilih kelas terlebih dahulu.");
      return;
    }

    try {
      const result = await grantClassPermission(selectedClassName, startTimeInput, endTimeInput);
      window.alert(result?.message || `Izin kelas ${selectedClassName} berhasil diaktifkan.`);
    } catch (error) {
      console.error("Gagal mengaktifkan izin kelas:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mengaktifkan izin kelas.");
    }
  };

  const handleRevokeClass = async (className: string) => {
    if (!window.confirm(`Cabut izin penggunaan HP untuk kelas ${className}?`)) {
      return;
    }

    try {
      const result = await revokeClassPermission(className);
      window.alert(result?.message || `Izin kelas ${className} berhasil dicabut.`);
    } catch (error) {
      console.error("Gagal mencabut izin kelas:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mencabut izin kelas.");
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mencabut SEMUA izin aktif untuk seluruh siswa?")) {
      return;
    }

    try {
      await revokeAllSessions();
      window.alert("Seluruh izin aktif berhasil dicabut.");
    } catch (error) {
      console.error("Gagal mencabut semua izin:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mencabut semua izin.");
    }
  };

  const handleDeleteExpiredCodes = () => {
    void deleteExpiredCodes();
  };

  const handleDeleteCode = (codeToRemove: string) => {
    void deleteCode(codeToRemove);
  };

  const isExpired = (expiresAt: number) => Date.now() > expiresAt;

  const rosterCount = studentCountByClass.get(selectedClassName) || 0;
  const busy = saving || classSaving || revoking;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-100 shadow-inner">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-200" />
          <div>
            <div className="font-semibold">Admin sekarang bisa memberi izin langsung per kelas.</div>
            <div className="mt-1 text-sky-50/90">
              Mode barcode tetap dipertahankan sebagai jalur manual. Aktivasi kelas cocok untuk kasus banyak siswa sekaligus,
              sedangkan barcode tetap dipakai untuk izin manual per siswa.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white">Aktifkan Izin per Kelas</h3>
        <p className="mt-1 text-sm text-slate-400">
          Pilih kelas, atur jam sesi, lalu admin aktifkan dari web. Siswa di kelas itu tidak perlu lagi input barcode.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Kelas</label>
            <select
              value={selectedClassName}
              onChange={(e) => setSelectedClassName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            >
              <option value="">Pilih kelas...</option>
              {classCatalog.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Jam Mulai</label>
            <input
              type="time"
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Jam Akhir</label>
            <input
              type="time"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <div className="font-semibold text-white">Ringkasan</div>
            <div className="mt-1">{calculateDuration(startTimeInput, endTimeInput)} menit</div>
            <div className="mt-1 flex items-center gap-1.5 text-slate-400">
              <Users className="h-4 w-4" />
              {selectedClassName ? `${rosterCount} siswa di ${selectedClassName}` : "Pilih kelas terlebih dahulu"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleActivateClass()}
            disabled={busy || !selectedClassName}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {classSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Aktifkan untuk Kelas Ini
          </button>

          <button
            type="button"
            onClick={() => void handleRevokeAll()}
            disabled={busy || sessions.length === 0}
            className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cabut Semua Izin Aktif
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <div>
            <h3 className="font-semibold text-white">Izin Aktif per Kelas</h3>
            <p className="mt-1 text-xs text-slate-400">Daftar kelas yang sedang diberi izin penggunaan HP dari sisi admin.</p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            {activeClassPermissions.length}
          </span>
        </div>

        <div className="divide-y divide-white/10">
          {classesLoading || studentsLoading || sessionsLoading ? (
            <div className="p-6 text-center text-slate-400">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-400" />
              Memuat izin kelas aktif...
            </div>
          ) : activeClassPermissions.length === 0 ? (
            <div className="p-6 text-center text-slate-400">Belum ada izin aktif berbasis kelas.</div>
          ) : (
            activeClassPermissions.map((item) => (
              <div key={item.className} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-bold text-white">{item.className}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {item.sessionStart || "-"} - {item.sessionEnd || "-"} • {item.affectedStudents} siswa aktif
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Berakhir: {item.endTime ? new Date(item.endTime).toLocaleString("id-ID") : "-"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRevokeClass(item.className)}
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600/20 px-4 py-2 font-semibold text-rose-300 transition hover:bg-rose-600/40 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cabut Izin Kelas
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 p-6 shadow-xl backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white">Generate Kode Baru</h3>
        <p className="mt-1 text-sm text-slate-400">
          Mode fallback untuk izin manual. Kode ini tetap bisa dipakai jika admin ingin memberi izin di luar skema kelas.
        </p>

        <div className="mt-4 grid items-end gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Jam Mulai</label>
            <input
              type="time"
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Jam Akhir</label>
            <input
              type="time"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateCode}
              disabled={saving || classSaving}
              className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Memproses..." : (
                <>
                  <Plus className="mr-2 h-5 w-5" /> Generate
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteExpiredCodes}
              disabled={saving || classSaving}
              className="flex flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              title="Hapus semua kode expired"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-white">Daftar Kode Aktif</h3>
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
            {codes.length}
          </span>
        </div>
        <div className="divide-y divide-white/10">
          {loading ? (
            <div className="p-6 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
              Memuat data kode akses...
            </div>
          ) : codes.length === 0 ? (
            <div className="p-6 text-center text-slate-400">Tidak ada kode aktif saat ini.</div>
          ) : (
            codes.map((item: any) => (
              <div key={item.code} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCode value={String(item.code)} size={88} />
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-widest text-white">{item.code}</div>
                    <div className="text-sm text-slate-300 mt-1">
                      {item.sessionStart || "-"} - {item.sessionEnd || "-"} • {item.duration ? `${item.duration} menit` : "-"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Expired: {item.expiresAt ? new Date(item.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </div>
                    {isExpired(item.expiresAt) && <div className="text-xs text-rose-300 font-semibold mt-1">Expired</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteCode(String(item.code))}
                    className="flex items-center justify-center rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 px-4 py-2 font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
