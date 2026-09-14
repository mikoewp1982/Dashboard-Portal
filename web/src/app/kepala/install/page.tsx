import type { Metadata } from "next";
import Image from "next/image";
import {
  getApkDownloadHref,
  getLatestApkMetaByPackageName,
} from "@/lib/getApkDownloadHref";

export const metadata: Metadata = {
  title: "Download APK GAS Kepala Sekolah - Portal Eksekutif",
  description:
    "Halaman resmi unduhan APK GAS Kepala Sekolah. Executive dashboard kehadiran guru dan siswa se-sekolah secara realtime.",
};

export default function GasPrincipalInstallPage() {
  const kepalaMeta = getLatestApkMetaByPackageName("com.satupintu.mobile.kepala", {
    fileName: "GAS-Kepala-1.0.1-kepala-1001.apk",
    versionName: "1.0.1-kepala",
    versionCode: 1001,
  });

  const apkHref = getApkDownloadHref(kepalaMeta.fileName);
  const downloadFileName = kepalaMeta.fileName;

  const installSteps = [
    {
      number: "1",
      title: "Unduh APK GAS Kepala Sekolah",
      body: `Tekan tombol unduh di atas. File yang terunduh bernama ${downloadFileName}.`,
    },
    {
      number: "2",
      title: "Izinkan Instalasi dari Browser",
      body: 'Jika muncul notifikasi keamanan standar Android, pilih "Tetap Download" lalu aktifkan izin instalasi dari sumber ini.',
    },
    {
      number: "3",
      title: "Pasang Aplikasi",
      body: "Buka file unduhan dan tekan 'Instal' hingga proses pemasangan selesai.",
    },
    {
      number: "4",
      title: "Login Akun Kepala Sekolah",
      body: "Buka aplikasi GAS Kepala Sekolah dan login menggunakan kredensial pimpinan yang telah dikonfigurasi.",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#3b0764_0%,_#0f172a_50%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/20 ring-1 ring-purple-400/40">
              <Image
                src="/Icon_GAS.png"
                alt="Logo GAS"
                width={36}
                height={36}
                className="h-8 w-8 rounded-xl object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-purple-400 uppercase">
                Gerbang Aplikasi Sekolah
              </div>
              <div className="text-lg font-extrabold text-white">
                Portal Eksekutif Kepala Sekolah
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            Khusus Kepala Sekolah
          </div>
        </header>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/60 via-slate-900/80 to-slate-950 p-6 sm:p-10 shadow-[0_20px_50px_rgba(168,85,247,0.15)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-200">
                <span>🏛️</span> Executive App (Android)
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Executive Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">Kepala Sekolah</span>
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Pantau statistik kehadiran dewan guru, staf kependidikan, dan seluruh siswa di sekolah secara real-time langsung dari layar ponsel Anda.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={apkHref}
                  download={downloadFileName}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:from-purple-300 hover:to-indigo-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Unduh APK GAS Kepala Sekolah
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  File: <strong className="text-purple-300">{downloadFileName}</strong>
                </span>
                {kepalaMeta.versionName && (
                  <span>
                    Versi: <strong className="text-slate-200">{kepalaMeta.versionName}</strong>
                  </span>
                )}
                {kepalaMeta.sizeMB && (
                  <span>
                    Ukuran: <strong className="text-slate-200">{kepalaMeta.sizeMB} MB</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-[32px] border border-purple-400/20 bg-slate-950/70 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/20 text-purple-300 font-bold">
                      KS
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">GAS Kepala Sekolah</div>
                      <div className="text-xs text-purple-400">Executive Portal</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                    Leader
                  </span>
                </div>
                <div className="mt-5 space-y-3 text-xs text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    📊 Rekapitulasi Kehadiran Harian Guru &amp; Siswa
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    📈 Grafik Tren &amp; Persentase Kehadiran
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <section id="panduan-instalasi" className="scroll-mt-10">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 sm:p-10 backdrop-blur">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Cara Memasang Aplikasi
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {installSteps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400 text-base font-black text-slate-950">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gerbang Aplikasi Sekolah (GAS) • Portal Eksekutif Kepala Sekolah.</p>
        </footer>
      </div>
    </main>
  );
}
