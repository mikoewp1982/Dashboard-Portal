"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { rtdb } from "@/lib/firebase/client";
import { ref, get, set } from "firebase/database";
import {
  Smartphone,
  Lock,
  Rocket,
  Save,
  AlertTriangle,
  ShieldCheck,
  Users,
  GraduationCap,
  Building2,
} from "lucide-react";

export default function MobileAppsControlPage() {
  const { user } = useAuthStore();
  const [gasVersion, setGasVersion] = useState<number>(0);
  const [edulockVersion, setEdulockVersion] = useState<number>(0);
  const [ortuVersion, setOrtuVersion] = useState<number>(0);
  const [guruVersion, setGuruVersion] = useState<number>(0);
  const [kepalaVersion, setKepalaVersion] = useState<number>(0);
  const [updateMessage, setUpdateMessage] = useState<string>("");

  const [currentGasVersionCode, setCurrentGasVersionCode] = useState<number | null>(null);
  const [currentGasVersionName, setCurrentGasVersionName] = useState<string>("");
  const [currentEduLockVersionCode, setCurrentEduLockVersionCode] = useState<number | null>(null);
  const [currentEduLockVersionName, setCurrentEduLockVersionName] = useState<string>("");
  const [currentOrtuVersionCode, setCurrentOrtuVersionCode] = useState<number | null>(null);
  const [currentOrtuVersionName, setCurrentOrtuVersionName] = useState<string>("");
  const [currentGuruVersionCode, setCurrentGuruVersionCode] = useState<number | null>(null);
  const [currentGuruVersionName, setCurrentGuruVersionName] = useState<string>("");
  const [currentKepalaVersionCode, setCurrentKepalaVersionCode] = useState<number | null>(null);
  const [currentKepalaVersionName, setCurrentKepalaVersionName] = useState<string>("");

  const [apkManifestUpdatedAt, setApkManifestUpdatedAt] = useState<string>("");

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
          setOrtuVersion(data.min_version_code_ortu || 0);
          setGuruVersion(data.min_version_code_guru || 0);
          setKepalaVersion(data.min_version_code_kepala || 0);
          setUpdateMessage(data.update_message || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data versi aplikasi:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function loadApkManifest() {
      try {
        const response = await fetch(`/apk/apk-manifest.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as {
          updatedAt?: string;
          files?: Record<
            string,
            {
              packageName?: string;
              versionCode?: number;
              versionName?: string;
            }
          >;
        };

        setApkManifestUpdatedAt(data.updatedAt || "");

        for (const [filename, fileMeta] of Object.entries(data.files || {})) {
          const pkg = fileMeta.packageName || "";

          // GAS Siswa
          if (pkg === "com.satupintu.mobile.siswa" || filename.includes("Siswa")) {
            if (
              !currentGasVersionCode ||
              (fileMeta.versionCode && fileMeta.versionCode > currentGasVersionCode)
            ) {
              setCurrentGasVersionCode(fileMeta.versionCode || null);
              setCurrentGasVersionName(fileMeta.versionName || "");
            }
          }

          // EduLock
          if (pkg === "com.sekolah.edulock" || filename.includes("EduLock")) {
            if (
              !currentEduLockVersionCode ||
              (fileMeta.versionCode && fileMeta.versionCode > currentEduLockVersionCode)
            ) {
              setCurrentEduLockVersionCode(fileMeta.versionCode || null);
              setCurrentEduLockVersionName(fileMeta.versionName || "");
            }
          }

          // GAS Ortu
          if (
            pkg === "com.satupintu.mobile.ortu" ||
            filename.includes("OrangTua") ||
            filename.includes("ortu")
          ) {
            if (
              !currentOrtuVersionCode ||
              (fileMeta.versionCode && fileMeta.versionCode > currentOrtuVersionCode)
            ) {
              setCurrentOrtuVersionCode(fileMeta.versionCode || null);
              setCurrentOrtuVersionName(fileMeta.versionName || "");
            }
          }

          // GAS Guru
          if (
            pkg === "com.satupintu.mobile.guru" ||
            filename.includes("Guru") ||
            filename.includes("guru")
          ) {
            if (
              !currentGuruVersionCode ||
              (fileMeta.versionCode && fileMeta.versionCode > currentGuruVersionCode)
            ) {
              setCurrentGuruVersionCode(fileMeta.versionCode || null);
              setCurrentGuruVersionName(fileMeta.versionName || "");
            }
          }

          // GAS Kepala
          if (
            pkg === "com.satupintu.mobile.kepala" ||
            filename.includes("Kepala") ||
            filename.includes("kepala")
          ) {
            if (
              !currentKepalaVersionCode ||
              (fileMeta.versionCode && fileMeta.versionCode > currentKepalaVersionCode)
            ) {
              setCurrentKepalaVersionCode(fileMeta.versionCode || null);
              setCurrentKepalaVersionName(fileMeta.versionName || "");
            }
          }
        }
      } catch {
      }
    }

    loadSettings();
    loadApkManifest();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await set(ref(rtdb, "app_settings/android"), {
        min_version_code_gas: Number(gasVersion),
        min_version_code_edulock: Number(edulockVersion),
        min_version_code_ortu: Number(ortuVersion),
        min_version_code_guru: Number(guruVersion),
        min_version_code_kepala: Number(kepalaVersion),
        update_message: updateMessage,
      });

      // Mirror ke node individual untuk kompatibilitas service
      await set(ref(rtdb, "app_settings/min_version_code_gas"), Number(gasVersion));
      await set(ref(rtdb, "app_settings/min_version_code_ortu"), Number(ortuVersion));
      await set(ref(rtdb, "app_settings/min_version_code_guru"), Number(guruVersion));
      await set(ref(rtdb, "app_settings/min_version_code_kepala"), Number(kepalaVersion));

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
        style={{
          background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
        }}
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
      style={{
        background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
      }}
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
                    <div className="text-xs font-semibold tracking-[0.24em] text-purple-400">
                      MOBILE APPS
                    </div>
                    <h1 className="mt-1 text-2xl font-bold text-white">
                      Force Update Control (Seluruh Peran)
                    </h1>
                  </div>
                </div>
                <p className="mt-4 max-w-3xl text-sm text-slate-300">
                  Gunakan halaman ini untuk mengatur batas versi minimal (<code className="text-purple-300">VERSION_CODE</code>) bagi seluruh aplikasi mobile dalam ekosistem sekolah (Siswa, EduLock, Orang Tua, Guru, dan Kepala Sekolah). Aplikasi dengan versi lebih rendah dari angka batas akan otomatis terkunci dan mewajibkan update.
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
              {/* Kolom Kiri: Form Konfigurasi Versi Seluruh Peran */}
              <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    Batas Versi Minimal (Minimum Version Code)
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* 1. GAS Siswa */}
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                        <Rocket className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-blue-300">
                            GAS Siswa (Absensi &amp; Ibadah)
                          </label>
                          <span className="text-[11px] font-medium text-blue-200/70">
                            Saat ini: {currentGasVersionCode ? `${currentGasVersionName} (${currentGasVersionCode})` : "-"}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={gasVersion}
                          onChange={(e) => setGasVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-blue-500/30 bg-black/40 p-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. EduLock Siswa */}
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-purple-300">
                            EduLock Siswa (MDM Pengunci)
                          </label>
                          <span className="text-[11px] font-medium text-purple-200/70">
                            Saat ini: {currentEduLockVersionCode ? `${currentEduLockVersionName} (${currentEduLockVersionCode})` : "-"}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={edulockVersion}
                          onChange={(e) => setEdulockVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-purple-500/30 bg-black/40 p-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. GAS Orang Tua */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                            GAS Orang Tua (Wali Murid)
                          </label>
                          <span className="text-[11px] font-medium text-cyan-200/70">
                            Saat ini: {currentOrtuVersionCode ? `${currentOrtuVersionName} (${currentOrtuVersionCode})` : "-"}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={ortuVersion}
                          onChange={(e) => setOrtuVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-cyan-500/30 bg-black/40 p-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. GAS Guru */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            GAS Guru (Guru &amp; Staf)
                          </label>
                          <span className="text-[11px] font-medium text-emerald-200/70">
                            Saat ini: {currentGuruVersionCode ? `${currentGuruVersionName} (${currentGuruVersionCode})` : "-"}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={guruVersion}
                          onChange={(e) => setGuruVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-emerald-500/30 bg-black/40 p-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. GAS Kepala Sekolah */}
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                            GAS Kepala Sekolah (Eksekutif)
                          </label>
                          <span className="text-[11px] font-medium text-indigo-200/70">
                            Saat ini: {currentKepalaVersionCode ? `${currentKepalaVersionName} (${currentKepalaVersionCode})` : "-"}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={kepalaVersion}
                          onChange={(e) => setKepalaVersion(Number(e.target.value))}
                          className="mt-2 block w-full rounded-xl border border-indigo-500/30 bg-black/40 p-2.5 text-base font-bold text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Petunjuk Angka 0 = Bypass */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">Aturan Nilai Batas Versi:</strong>
                      <br />• Nilai <code className="text-emerald-300 font-bold">0</code> = <strong>Bypass / Tidak Terkunci</strong> (aplikasi versi berapa pun diizinkan berjalan).
                      <br />• Nilai <code className="text-amber-300 font-bold">&gt; 0</code> = Aplikasi dengan versi di bawah angka tersebut akan langsung terkunci mati dan meminta update ke link halaman resminya.
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Form Pesan & Eksekusi */}
              <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white">
                      Pesan Peringatan Layar Terkunci
                    </h2>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Teks Peringatan Kustom (Opsional)
                    </label>
                    <p className="mt-1 text-xs text-slate-400 mb-2">
                      Pesan ini akan tampil di layar overlay merah pada ponsel pengguna ketika aplikasi terkunci karena versi kadaluarsa.
                    </p>
                    <textarea
                      rows={5}
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      placeholder="Contoh: Aplikasi Anda sudah usang. Segera download dan pasang versi terbaru melalui link resmi sekolah untuk dapat melanjutkan."
                      className="block w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {apkManifestUpdatedAt && (
                    <div className="text-xs text-slate-400">
                      Manifest APK Server terakhir diperbarui:{" "}
                      <span className="font-semibold text-slate-300">
                        {apkManifestUpdatedAt}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isSaving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        SIMPAN &amp; TERAPKAN BATAS VERSI
                      </>
                    )}
                  </button>

                  {saveStatus === "success" && (
                    <div className="mt-3 text-center text-sm font-semibold text-emerald-400">
                      ✓ Batas versi berhasil disimpan ke database. Aplikasi yang di bawah batas akan otomatis terkunci.
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="mt-3 text-center text-sm font-semibold text-rose-400">
                      ✗ Gagal menyimpan batas versi. Silakan periksa koneksi atau coba lagi.
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
