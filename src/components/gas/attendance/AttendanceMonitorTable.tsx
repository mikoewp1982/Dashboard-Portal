/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { AttendanceRecord, AttendanceStatus } from "@/types/gas";
import { manualAttendanceInput } from "@/lib/gas/api/attendance";
import { Check, Clock, UserX, Info, AlertTriangle } from "lucide-react";

interface Props {
  schoolId: string;
  students: any[];
  attendances: Record<string, AttendanceRecord>;
  loading: boolean;
  selectedDate: string;
}

export function AttendanceMonitorTable({ schoolId, students, attendances, loading, selectedDate }: Props) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleManualInput = async (studentId: string, status: AttendanceStatus) => {
    setSubmitting(studentId);
    try {
      await manualAttendanceInput({
        schoolId,
        studentId,
        date: selectedDate,
        status,
        note: "Diubah manual oleh admin",
      });
    } catch (error) {
      console.error("Gagal mengupdate presensi:", error);
      alert("Gagal menyimpan presensi.");
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case "PRESENT": return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20"><Check className="h-3 w-3" /> Hadir</span>;
      case "LATE": return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20"><Clock className="h-3 w-3" /> Terlambat</span>;
      case "ALPHA": return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 ring-1 ring-red-500/20"><UserX className="h-3 w-3" /> Alpha</span>;
      case "IZIN": return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/20"><Info className="h-3 w-3" /> Izin</span>;
      case "SAKIT": return <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20"><AlertTriangle className="h-3 w-3" /> Sakit</span>;
      default: return <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/20">Belum Ada</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-400">Memuat data kehadiran...</div>;
  }

  if (students.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-400">Tidak ada siswa di kelas ini.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/50">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        <thead className="bg-white/5">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold tracking-widest text-slate-400">NAMA SISWA</th>
            <th className="px-5 py-3 text-left text-xs font-semibold tracking-widest text-slate-400">NISN</th>
            <th className="px-5 py-3 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS HARI INI</th>
            <th className="px-5 py-3 text-center text-xs font-semibold tracking-widest text-slate-400">AKSI MANUAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-slate-950/20">
          {students.map((student) => {
            const att = attendances[student.id];
            const isSubmitting = submitting === student.id;
            
            return (
              <tr key={student.id} className="hover:bg-white/5">
                <td className="px-5 py-3 font-semibold text-white">{student.name}</td>
                <td className="px-5 py-3 text-slate-400">{student.nisn}</td>
                <td className="px-5 py-3">{getStatusBadge(att?.status)}</td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 p-1">
                    <button
                      disabled={isSubmitting || att?.status === "PRESENT"}
                      onClick={() => handleManualInput(student.id, "PRESENT")}
                      className="rounded px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-30"
                    >
                      H
                    </button>
                    <button
                      disabled={isSubmitting || att?.status === "LATE"}
                      onClick={() => handleManualInput(student.id, "LATE")}
                      className="rounded px-2 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-30"
                    >
                      T
                    </button>
                    <button
                      disabled={isSubmitting || att?.status === "IZIN"}
                      onClick={() => handleManualInput(student.id, "IZIN")}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-30"
                    >
                      I
                    </button>
                    <button
                      disabled={isSubmitting || att?.status === "SAKIT"}
                      onClick={() => handleManualInput(student.id, "SAKIT")}
                      className="rounded px-2 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-30"
                    >
                      S
                    </button>
                    <button
                      disabled={isSubmitting || att?.status === "ALPHA"}
                      onClick={() => handleManualInput(student.id, "ALPHA")}
                      className="rounded px-2 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-30"
                    >
                      A
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

