"use client";

import { useState } from "react";
import { UserCog, Download, RefreshCw, Loader2, Lock, Unlock } from "lucide-react";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useEduLockOverview } from "@/hooks/edulock/useEduLockOverview";

type EduLockStudentRecord = {
  id?: string;
  nisn?: string;
  name?: string;
  class?: string;
  className?: string;
  device?: string;
  deviceId?: string;
  uninstall_authorized?: boolean;
};

type EduLockClassRecord = {
  id?: string;
  name?: string;
  className?: string;
};

export function EduLockStudentsPanel({ schoolId }: { schoolId: string }) {
  const [studentClassFilterKey, setStudentClassFilterKey] = useState("all");
  const { data: classesData, loading: classesLoading } = useClassesRealtime(schoolId);
  const { data: studentsData, loading: studentsLoading } = useStudentsRealtime(schoolId);
  const { resetStudentDevice, toggleUninstall, toggleUninstallMass, loading: overviewLoading } = useEduLockOverview(schoolId);

  const loading = classesLoading || studentsLoading || overviewLoading;

  const classCatalogComputed = (classesData as EduLockClassRecord[]).map((c) => ({
    key: String(c.className || c.name || c.id || ""),
    name: String(c.className || c.name || c.id || ""),
  }));

  const filteredStudents = (studentsData as EduLockStudentRecord[])
    .filter((s) => s.name && s.name.trim() !== "")
    .map((s) => ({
      id: s.id || "",
      nisn: s.nisn || "-",
      name: s.name || "-",
      class: s.className || s.class || "-",
      classKey: String(s.className || s.class || ""),
      device_uuid: s.deviceId || s.device || "",
      uninstall_authorized: s.uninstall_authorized === true,
    }));

  const handleExportData = () => {
    const rows = filteredStudents
      .filter((student) => studentClassFilterKey === "all" || student.classKey === studentClassFilterKey)
      .map((student) => [
        student.nisn,
        student.name,
        student.class,
        student.device_uuid || "Belum Binding",
      ]);

    const csv = [
      ["NISN", "Nama Lengkap", "Kelas", "Device ID"],
      ...rows,
    ]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `edulock-siswa-${schoolId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetDevice = async (studentId: string, nisn: string, name: string) => {
    if (!studentId) return;
    if (!window.confirm(`Reset binding device untuk ${name} (${nisn})? Siswa harus login ulang di perangkat yang sah.`)) {
      return;
    }

    try {
      await resetStudentDevice(studentId);
      window.alert(`Binding device untuk ${name} berhasil direset.`);
    } catch (error) {
      console.error("Gagal reset binding device:", error);
      window.alert(error instanceof Error ? error.message : "Gagal reset binding device.");
    }
  };

  const handleToggleUninstall = async (studentId: string, nisn: string, name: string, currentState: boolean) => {
    const newState = !currentState;
    const actionName = newState ? "MEMBUKA GEMBOK (Memberi Izin Uninstall)" : "MENUTUP GEMBOK (Mencabut Izin Uninstall)";
    
    if (!window.confirm(`Apakah Anda yakin ingin ${actionName} untuk siswa ${name} (${nisn})?`)) {
      return;
    }

    try {
      await toggleUninstall(studentId, nisn, newState);
      window.alert(newState 
        ? `Izin uninstall untuk ${name} berhasil DIBERIKAN.` 
        : `Izin uninstall untuk ${name} berhasil DICABUT.`
      );
    } catch (error) {
      console.error("Gagal mengubah izin uninstall:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mengubah izin uninstall.");
    }
  };

  const handleToggleUninstallMass = async (action: "grant" | "revoke") => {
    const studentsToToggle = filteredStudents.filter(
      (student) => studentClassFilterKey === "all" || student.classKey === studentClassFilterKey
    );

    if (studentsToToggle.length === 0) {
      window.alert("Tidak ada siswa yang dipilih berdasarkan filter kelas saat ini.");
      return;
    }

    const isGranting = action === "grant";
    const actionName = isGranting ? "MEMBUKA GEMBOK (Memberi Izin)" : "MENUTUP GEMBOK (Mencabut Izin)";

    if (!window.confirm(`PERINGATAN: Anda akan ${actionName} UNINSTALL kepada ${studentsToToggle.length} siswa secara massal. Lanjutkan?`)) {
      return;
    }

    try {
      const payloads = studentsToToggle.map(s => ({ studentId: s.id, nisn: s.nisn })).filter(p => p.nisn);
      await toggleUninstallMass(payloads, isGranting);
      window.alert(`Izin uninstall massal untuk ${payloads.length} siswa berhasil ${isGranting ? 'diaktifkan' : 'dicabut'}.`);
    } catch (error) {
      console.error("Gagal mengubah izin uninstall massal:", error);
      window.alert(error instanceof Error ? error.message : "Gagal mengubah izin uninstall massal.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-100 shadow-inner">
        Seluruh data profil siswa dikelola secara terpusat melalui <strong>Database Satu Pintu (GAS)</strong>.
        Aksi <strong>Reset Device Binding</strong> dikelola secara 1 Pintu di menu <strong>Database Siswa</strong>. Di halaman EduLock ini, Anda dapat mengekspor data dan mengelola <strong>Izin Uninstall (Buka/Tutup Gembok)</strong>.
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row justify-between md:items-center bg-white/5 gap-4">
          <h3 className="font-semibold text-white flex items-center">
            <UserCog className="w-5 h-5 mr-2 text-indigo-400" />
            Manajemen Data Siswa
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-300 mr-2 hidden lg:inline-block bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              Total: {filteredStudents.length} Siswa
            </span>

            <button onClick={handleExportData} className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-white border border-white/10 hover:bg-white/10 transition" title="Export Data Siswa ke Excel">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="flex rounded-lg overflow-hidden border border-rose-500/30">
              <button onClick={() => void handleToggleUninstallMass("revoke")} className="flex items-center justify-center gap-2 bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition" title="Tutup Gembok Massal (Cabut Izin)">
                <Lock className="w-4 h-4" />
                <span className="hidden lg:inline">Tutup Gembok</span>
              </button>
              <button onClick={() => void handleToggleUninstallMass("grant")} className="flex items-center justify-center gap-2 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/30 transition border-l border-rose-500/30" title="Buka Gembok Massal (Beri Izin Uninstall)">
                <Unlock className="w-4 h-4" />
                <span className="hidden lg:inline">Buka Gembok</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Filter Kelas</label>
              <select 
                value={studentClassFilterKey} 
                onChange={(e) => setStudentClassFilterKey(e.target.value)} 
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Kelas</option>
                {classCatalogComputed.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 text-sm text-slate-400 bg-white/5 border border-white/10 p-3 rounded-xl">
              Daftar kelas mengikuti Database (GAS). Jika belum ada, filter hanya menampilkan Semua Kelas.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr>
                <th className="px-6 py-3">NISN</th>
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Status Binding</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Memuat data siswa dari GAS...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada data siswa yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredStudents
                  .filter((student) => {
                    if (studentClassFilterKey === "all") return true;
                    return student.classKey === studentClassFilterKey;
                  })
                  .map((student) => (
                  <tr key={student.nisn}>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{student.nisn}</td>
                    <td className="px-6 py-4 font-semibold text-white">{student.name}</td>
                    <td className="px-6 py-4 text-slate-200">
                      {student.class || "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[150px] truncate" title={String(student.device_uuid || "")}>
                      {student.device_uuid ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300">
                          Terikat
                        </span>
                      ) : (
                        <span className="text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md italic">Belum Binding</span>
                      )}
                      {student.device_uuid ? (
                        <div className="mt-1 truncate text-[10px] text-slate-500">{student.device_uuid}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => void handleToggleUninstall(student.id, student.nisn, student.name || student.nisn, student.uninstall_authorized)}
                          title={student.uninstall_authorized ? "Cabut Izin Uninstall (Kunci Kembali)" : "Beri Izin Uninstall (Buka Gembok)"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-colors ${
                            student.uninstall_authorized
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                              : "bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700"
                          }`}
                        >
                          {student.uninstall_authorized ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{student.uninstall_authorized ? "Terbuka (Izin Uninstall)" : "Terkunci"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
