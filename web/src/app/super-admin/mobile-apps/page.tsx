"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { rtdb } from "@/lib/firebase/client";
import { ref, get, set } from "firebase/database";
import { Smartphone, Lock, Rocket, Save, AlertTriangle, ShieldCheck } from "lucide-react";

export default function MobileAppsControlPage() {
  const { user } = useAuthStore();
  const [gasVersion, setGasVersion] = useState<number>(0);
  const [edulockVersion, setEdulockVersion] = useState<number>(0);
  const [updateMessage, setUpdateMessage] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    async function loadSettings() {
      try {
        const snapshot = await get(ref(rtdb, "app_settings/android"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setGasVersion(data.min_version_code_gas || 0);
          setEdulockVersion(data.min_version_code_edulock || 0);
          setUpdateMessage(data.update_message || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data versi aplikasi:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await set(ref(rtdb, "app_settings/android"), {
        min_version_code_gas: Number(gasVersion),
        min_version_code_edulock: Number(edulockVersion),
        update_message: updateMessage,
      });
      await set(ref(rtdb, "app_settings/min_version_code_gas"), Number(gasVersion));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Gagal menyimpan pengaturan aplikasi:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== "super_admin") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-slate-400"
        style={{ background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)" }}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          Akses Ditolak. Anda bukan Super Admin.
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6 text-slate-100 sm:px-6"
      style={{ background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar className="lg:w-64" />

        <main className="min-w-0 flex-1 space-y-6">
          {/* Header */}
          <header className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 shadow-inner">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold tracking-[0.24em] text-purple-400">MOBILE APPS</div>
                    <h1 className="mt-1 text-2xl font-bold text-white">Force Update Control</h1>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm text-slate-300">
                  Gunakan halaman ini untuk memaksa siswa meng-update aplikasi mereka. Aplikasi yang memiliki <code className="text-blue-300">VERSION_CODE</code> lebih rendah dari angka di bawah ini akan terkunci mati dan meminta update.
                </p>
              </div>
            </div>
          </header>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-purple-500"></div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form Konfigurasi Versi */}
              <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Versi Minimal (Minimum Version Code)</h2>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                        <Rocket className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-widest text-blue-300">Aplikasi GAS (Absensi)</label>
                        <input
                          type="number"
                          value={gasVersion}
                          onChange={(e) => setGasVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-blue-500/30 bg-black/30 p-3 text-lg font-bold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-widest text-purple-300">Aplikasi EduLock (MDM)</label>
                        <input
                          type="number"
                          value={edulockVersion}
                          onChange={(e) => setEdulockVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-purple-500/30 bg-black/30 p-3 text-lg font-bold text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Pesan & Eksekusi */}
              <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Pesan Kustom Layar Terkunci</h2>
                </div>

                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Teks Peringatan (Opsional)</label>
                  <p className="mt-1 text-xs text-slate-500 mb-2">
                    Jika diisi, pesan ini akan menggantikan pesan *default* di layar merah aplikasi siswa.
                  </p>
                  <textarea
                    rows={5}
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Contoh: Aplikasi ini sudah kadaluarsa. Segera download versi terbaru dari grup WA sekolah, jika tidak absen Anda hangus hari ini."
                    className="block w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 font-bold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        SIMPAN & TERAPKAN SEKARANG
                      </>
                    )}
                  </button>

                  {saveStatus === "success" && (
                    <div className="mt-3 text-center text-sm font-semibold text-emerald-400">
                      ✓ Pengaturan berhasil disimpan. Aplikasi siswa kini terkunci.
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="mt-3 text-center text-sm font-semibold text-rose-400">
                      ✗ Gagal menyimpan pengaturan. Silakan coba lagi.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
