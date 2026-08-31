"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Send,
  Lock,
  MessageSquare,
  AlertTriangle,
  History,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenBullyingReports,
  submitBullyingReport,
  formatTimeAgo,
  type BullyingReport,
} from "@/lib/siswa/studentDataService";

export default function LayananAduanPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"buat" | "riwayat">("buat");
  const [reports, setReports] = useState<BullyingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState("Perundungan / Bullying");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.nisn) {
      setLoading(false);
      return;
    }

    const unsub = listenBullyingReports(user.nisn, (list) => {
      setReports(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.nisn || !description.trim()) return;

    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      await submitBullyingReport({
        studentId: user.nisn,
        studentName: isAnonymous ? "Siswa (Anonim)" : user.name || "Siswa",
        schoolId: user.schoolId || "",
        category,
        description: description.trim(),
        location: location.trim(),
        incidentDate: incidentDate || new Date().toISOString().split("T")[0],
        isAnonymous,
      });

      setDescription("");
      setLocation("");
      setIncidentDate("");
      setFeedbackMsg("Laporan aduan Anda berhasil terkirim secara aman ke Tim BK Sekolah.");
      setActiveTab("riwayat");
    } catch {
      setFeedbackMsg("Gagal mengirim laporan. Periksa koneksi internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-rose-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Layanan Aduan</h1>
            <p className="text-xs text-rose-200">Kanal Pengaduan Bullying & Curhat Aman BK</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("buat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === "buat"
                ? "bg-white text-rose-900 shadow-sm"
                : "bg-white/15 text-rose-100 hover:bg-white/25"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Buat Laporan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === "riwayat"
                ? "bg-white text-rose-900 shadow-sm"
                : "bg-white/15 text-rose-100 hover:bg-white/25"
            }`}
          >
            <History className="h-4 w-4" /> Riwayat ({reports.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* TAB 1: FORM BUAT LAPORAN */}
        {activeTab === "buat" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guarantee Privacy Banner */}
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 flex items-start gap-3 text-xs text-rose-900">
              <Lock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Kerahasiaan Terjamin</strong>
                <span>
                  Laporan Anda hanya dapat dilihat oleh Tim Guru Bimbingan Konseling (BK) sekolah untuk ditindaklanjuti secara bijaksana dan terlindungi.
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
              {/* Kategori */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Kategori Masalah
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-rose-500 focus:outline-none"
                >
                  <option>Perundungan / Bullying</option>
                  <option>Kekerasan Fisik / Verbal</option>
                  <option>Curhat / Konseling Pribadi</option>
                  <option>Kendala Belajar / Guru</option>
                  <option>Fasilitas / Lingkungan Sekolah</option>
                  <option>Lainnya</option>
                </select>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Deskripsi Kejadian / Cerita
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan permasalahan yang Anda alami atau ketahui secara jelas dan jujur..."
                  rows={4}
                  required
                  className="w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-rose-500 focus:outline-none resize-none"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Lokasi Kejadian (Opsional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Belakang kantin, kelas 7-A, lorong lantai 2"
                  className="w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Toggle Anonim */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800">Kirim Sebagai Anonim (Rahasia)</h4>
                  <p className="text-[11px] text-slate-500">Nama Anda tidak akan ditampilkan di laporan</p>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-5 w-5 rounded accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-rose-700 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-700/20 hover:bg-rose-800 transition active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Kirim Laporan Sekarang
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: RIWAYAT LAPORAN */}
        {activeTab === "riwayat" && (
          <div className="space-y-3">
            {feedbackMsg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {reports.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 border border-slate-200 text-center space-y-3 shadow-sm">
                <ShieldCheck className="h-12 w-12 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Laporan</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Laporan aduan yang Anda kirimkan akan muncul di sini beserta status tanggapan dari tim BK sekolah.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                        {rep.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          rep.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : rep.status === "INVESTIGATING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {rep.status === "RESOLVED"
                          ? "Selesai Ditindaklanjuti"
                          : rep.status === "INVESTIGATING"
                          ? "Sedang Diproses"
                          : "Menunggu Tindak Lanjut"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed">{rep.description}</p>

                    {rep.location && (
                      <p className="text-[11px] text-slate-400">
                        📍 Lokasi: <span className="text-slate-600 font-medium">{rep.location}</span>
                      </p>
                    )}

                    {rep.response && (
                      <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                        <strong className="block text-[10px] font-bold uppercase text-emerald-700">
                          Tanggapan Guru BK:
                        </strong>
                        <p className="leading-relaxed">{rep.response}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                      <span>{rep.isAnonymous ? "🔒 Anonim" : "👤 Pengadu"}</span>
                      <span>{formatTimeAgo(rep.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
