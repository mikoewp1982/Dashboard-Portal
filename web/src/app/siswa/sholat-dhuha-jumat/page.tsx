"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Sun, Moon, Calendar, Clock, HeartHandshake, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenPrayerV2Record,
  submitPrayerV2Record,
  getTodayDateStr,
  type PrayerRecord,
} from "@/lib/siswa/studentDataService";

export default function SholatDhuhaJumatPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"dhuha" | "jumat">("dhuha");
  const [dhuhaRecord, setDhuhaRecord] = useState<PrayerRecord | null>(null);
  const [jumatRecord, setJumatRecord] = useState<PrayerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const todayStr = getTodayDateStr();
  const isFriday = new Date().getDay() === 5;

  // Auto-switch to Friday prayer tab on Fridays
  useEffect(() => {
    if (isFriday) {
      setActiveTab("jumat");
    }
  }, [isFriday]);

  // Listen to both Dhuha and Jum'at records
  useEffect(() => {
    if (!user || !user.nisn) return;
    const studentId = user.nisn;
    const schoolId = user.schoolId || "";

    const unsubDhuha = listenPrayerV2Record(studentId, schoolId, todayStr, "dhuha", (rec) => {
      setDhuhaRecord(rec);
    });

    const unsubJumat = listenPrayerV2Record(studentId, schoolId, todayStr, "jumat", (rec) => {
      setJumatRecord(rec);
    });

    return () => {
      unsubDhuha();
      unsubJumat();
    };
  }, [user, todayStr]);

  const currentRecord = activeTab === "dhuha" ? dhuhaRecord : jumatRecord;

  const handleAction = async (status: "PRAY" | "PERMIT" | "HALANGAN", note: string = "") => {
    if (!user || !user.nisn) return;
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      await submitPrayerV2Record(
        user.nisn,
        user.name || "Siswa",
        user.schoolId || "",
        todayStr,
        activeTab,
        status,
        note
      );

      const prayerName = activeTab === "dhuha" ? "Sholat Dhuha" : "Sholat Jum'at";
      setFeedbackMsg(`Alhamdulillah! Presensi ${prayerName} berhasil dicatat.`);
    } catch {
      setFeedbackMsg("Gagal menyimpan presensi. Periksa koneksi internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-teal-800 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Presensi Dhuha & Jum'at</h1>
            <p className="text-xs text-teal-200">Presensi Ibadah Sunnah & Jum'at</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("dhuha");
              setFeedbackMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === "dhuha"
                ? "bg-white text-teal-900 shadow-sm"
                : "bg-white/15 text-teal-100 hover:bg-white/25"
            }`}
          >
            <Sun className="h-4 w-4" /> Sholat Dhuha
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("jumat");
              setFeedbackMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === "jumat"
                ? "bg-white text-teal-900 shadow-sm"
                : "bg-white/15 text-teal-100 hover:bg-white/25"
            }`}
          >
            <Moon className="h-4 w-4" /> Sholat Jum'at {isFriday && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px]">Hari Ini</span>}
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                {activeTab === "dhuha" ? "Ibadah Dhuha" : "Ibadah Sholat Jum'at"}
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {activeTab === "dhuha" ? "Pukul 07.00 - 10.00 WIB" : "Pukul 11.30 - 13.00 WIB (Khusus Hari Jum'at)"}
              </p>
            </div>
            <div className="shrink-0">
              {currentRecord?.status === "PRAY" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Sudah Sholat
                </span>
              ) : currentRecord?.status === "PERMIT" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  Izin
                </span>
              ) : currentRecord?.status === "HALANGAN" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                  Halangan Syar'i
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Clock className="h-3.5 w-3.5" /> Belum Presensi
                </span>
              )}
            </div>
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
          <h2 className="text-sm font-bold text-slate-800">
            Catat Kehadiran {activeTab === "dhuha" ? "Sholat Dhuha" : "Sholat Jum'at"}
          </h2>

          <div className="grid grid-cols-1 gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting || currentRecord?.status === "PRAY"}
              onClick={() => handleAction("PRAY")}
              className={`flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] ${
                currentRecord?.status === "PRAY"
                  ? "bg-emerald-600 opacity-90 cursor-default"
                  : "bg-teal-700 hover:bg-teal-800 shadow-teal-700/20"
              }`}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {currentRecord?.status === "PRAY"
                    ? "Sudah Sholat (Tercatat)"
                    : `Saya Sudah ${activeTab === "dhuha" ? "Sholat Dhuha" : "Sholat Jum'at"}`}
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const note = prompt("Alasan izin (opsional):") || "";
                  handleAction("PERMIT", note);
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <HeartHandshake className="h-4 w-4 text-blue-600" /> Izin
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
      </div>
    </div>
  );
}
