"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Clock, Calendar, AlertCircle, HeartHandshake, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenPrayerRecord,
  submitPrayerRecord,
  getTodayDateStr,
  type PrayerRecord,
} from "@/lib/siswa/studentDataService";

export default function SholatPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [todayRecord, setTodayRecord] = useState<PrayerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to realtime prayer record
  useEffect(() => {
    if (!user || !user.nisn) {
      setLoading(false);
      return;
    }
    const studentId = user.nisn;
    const schoolId = user.schoolId || "";

    const unsub = listenPrayerRecord(studentId, schoolId, todayStr, (record) => {
      setTodayRecord(record);
      setLoading(false);
    });

    return () => unsub();
  }, [user, todayStr]);

  const currentHour = currentTime.getHours();
  const isPast15 = currentHour >= 15;

  const handleAction = async (status: "PRAY" | "PERMIT" | "HALANGAN", note: string = "") => {
    if (!user || !user.nisn) return;
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      await submitPrayerRecord(
        user.nisn,
        user.name || "Siswa",
        user.schoolId || "",
        todayStr,
        status,
        note
      );

      let msg = "Alhamdulillah! Presensi Sholat Dzuhur berhasil dicatat.";
      if (status === "PERMIT") msg = "Izin presensi sholat telah disimpan.";
      if (status === "HALANGAN") msg = "Status halangan syar'i telah disimpan.";
      setFeedbackMsg(msg);
    } catch {
      setFeedbackMsg("Gagal menyimpan presensi sholat. Periksa koneksi internet.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (!todayRecord || !todayRecord.status) {
      if (isPast15) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <AlertCircle className="h-3.5 w-3.5" /> Lewat Waktu (15:00)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          <Clock className="h-3.5 w-3.5" /> Belum Presensi
        </span>
      );
    }

    if (todayRecord.status === "PRAY") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Sudah Sholat Dzuhur
        </span>
      );
    }

    if (todayRecord.status === "PERMIT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          <HeartHandshake className="h-3.5 w-3.5 text-blue-600" /> Izin Sholat
        </span>
      );
    }

    if (todayRecord.status === "HALANGAN") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
          <ShieldAlert className="h-3.5 w-3.5 text-purple-600" /> Berhalangan Syar'i
        </span>
      );
    }

    return null;
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-teal-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Presensi Sholat</h1>
            <p className="text-xs text-teal-200">Presensi Sholat Dzuhur Berjamaah di Sekolah</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Info Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                Hari Ini
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right font-mono text-lg font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl">
              {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500 font-medium">Status Ibadah:</span>
            {getStatusBadge()}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Action Panel */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Pencatatan Sholat Dzuhur</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Presensi Sholat Dzuhur berlaku pada jam istirahat sholat di sekolah hingga batas maksimal pukul <strong>15:00 WIB</strong>.
          </p>

          <div className="grid grid-cols-1 gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting || todayRecord?.status === "PRAY"}
              onClick={() => handleAction("PRAY")}
              className={`flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] ${
                todayRecord?.status === "PRAY"
                  ? "bg-emerald-600 opacity-90 cursor-default"
                  : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20"
              }`}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {todayRecord?.status === "PRAY" ? "Sudah Sholat (Tercatat)" : "Saya Sudah Sholat Dzuhur"}
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const note = prompt("Tuliskan alasan izin tidak sholat di sekolah (opsional):") || "";
                  handleAction("PERMIT", note);
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <HeartHandshake className="h-4 w-4 text-blue-600" /> Izin Sholat
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction("HALANGAN")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <ShieldAlert className="h-4 w-4 text-purple-600" /> Halangan Syar'i
              </button>
            </div>
          </div>
        </div>

        {/* Pet Health Note */}
        <div className="rounded-2xl bg-teal-50/80 p-4 border border-teal-100 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            🕌
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-900">Pengaruh ke Sahabat Belajar (Virtual Pet)</h4>
            <p className="text-[11px] text-teal-700 leading-relaxed mt-0.5">
              Presensi Sholat Dzuhur akan mengisi <strong>Bar Kesehatan (Health) Pet menjadi 100%</strong>. Pastikan tidak melebihi pukul 15:00 WIB agar pet tidak sakit!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
