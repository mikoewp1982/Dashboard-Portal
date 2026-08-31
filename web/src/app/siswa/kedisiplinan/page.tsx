"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Award, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenDisciplineRecords,
  type DisciplineRecord,
} from "@/lib/siswa/studentDataService";

export default function KedisiplinanPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.nisn) {
      setLoading(false);
      return;
    }

    const unsub = listenDisciplineRecords(
      user.nisn,
      user.schoolId || "",
      (list, penalty) => {
        setRecords(list);
        setTotalPenalty(penalty);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const score = Math.max(0, 100 - totalPenalty);

  const getStatusInfo = (scoreValue: number) => {
    if (scoreValue >= 90) {
      return {
        label: "Sangat Baik",
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        border: "border-emerald-200",
        icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
        desc: "Pertahankan kedisiplinan dan budi pekerti luhur di sekolah!",
      };
    }
    if (scoreValue >= 75) {
      return {
        label: "Baik",
        color: "text-blue-700",
        bg: "bg-blue-100",
        border: "border-blue-200",
        icon: <CheckCircle2 className="h-6 w-6 text-blue-600" />,
        desc: "Tingkat kedisiplinan baik, tetap patuhi seluruh tata tertib sekolah.",
      };
    }
    if (scoreValue >= 60) {
      return {
        label: "Cukup",
        color: "text-amber-700",
        bg: "bg-amber-100",
        border: "border-amber-200",
        icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
        desc: "Perlu perhatian dan peningkatan kedisiplinan harian.",
      };
    }
    return {
      label: "Perlu Pembinaan",
      color: "text-red-700",
      bg: "bg-red-100",
      border: "border-red-200",
      icon: <ShieldAlert className="h-6 w-6 text-red-600" />,
      desc: "Segera konsultasikan dengan Guru BK atau Wali Kelas.",
    };
  };

  const status = getStatusInfo(score);

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-violet-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Kedisiplinan Siswa</h1>
            <p className="text-xs text-violet-200">Rekap Skor Perilaku & Catatan Tata Tertib</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Score Summary Card */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">
                Skor Kedisiplinan
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-black text-slate-900">{score}</span>
                <span className="text-sm font-semibold text-slate-400">/ 100 Poin</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${status.bg} ${status.border}`}>
                {status.icon}
                <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
              </div>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            {status.desc}
          </p>
        </div>

        {/* Violations List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Riwayat Catatan Pelanggaran ({records.length})
          </h2>

          {records.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                <Award className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Catatan Bersih!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Tidak ada catatan pelanggaran tata tertib. Pertahankan terus prestasi dan budi pekerti baik Anda!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">
                      {rec.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800">{rec.description}</h3>
                    <p className="text-[10px] text-slate-400">
                      Dicatat oleh: {rec.reportedBy} •{" "}
                      {new Date(rec.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-xl">
                    -{rec.points} Poin
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
