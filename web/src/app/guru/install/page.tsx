import type { Metadata } from "next";
import Image from "next/image";
import {
  getApkDownloadHref,
  getLatestApkMetaByPackageName,
} from "@/lib/getApkDownloadHref";

export const metadata: Metadata = {
  title: "Download APK GAS Guru - Portal Resmi Guru & Tenaga Kependidikan",
  description:
    "Halaman resmi unduhan APK GAS Guru. Presensi mandiri guru, rekap presensi kelas, pantau ibadah sholat, dan pembinaan karakter siswa.",
};

export default function GasTeacherInstallPage() {
  const guruMeta = getLatestApkMetaByPackageName("com.satupintu.mobile.guru", {
    fileName: "GAS-Guru-1.0.1-guru-1001.apk",
    versionName: "1.0.1-guru",
    versionCode: 1001,
  });

  const apkHref = getApkDownloadHref(guruMeta.fileName);
  const downloadFileName = guruMeta.fileName;

  const installSteps = [
    {
      number: "1",
      title: "Unduh APK GAS Guru",
      body: `Tekan tombol "Unduh APK GAS Guru" di atas. File yang terunduh bernama ${downloadFileName}.`,
    },
    {
      number: "2",
      title: "Izinkan Instalasi dari Browser",
      body: 'Jika muncul peringatan keamanan "File mungkin berbahaya", pilih "Tetap Download". Buka pengaturan browser untuk mengaktifkan izin instal aplikasi dari sumber ini.',
    },
    {
      number: "3",
      title: "Pasang Aplikasi Sampai Selesai",
      body: "Buka file APK yang telah diunduh melalui panel notifikasi atau File Manager, lalu klik 'Instal' hingga selesai.",
    },
    {
      number: "4",
      title: "Login dengan Akun Guru",
      body: "Buka aplikasi GAS Guru, masukkan nomor HP / akun guru yang telah didaftarkan oleh admin sekolah, lalu aktifkan izin lokasi saat diminta.",
    },
  ];

  const features = [
    {
      icon: "📋",
      title: "Presensi Mandiri Guru",
      desc: "Lakukan presensi kehadiran datang dan pulang secara mandiri berbasis titik koordinat GPS radius sekolah.",
    },
    {
      icon: "👥",
      title: "Rekap Kehadiran Siswa",
      desc: "Pantau rekap kehadiran siswa kelas binaan atau per mata pelajaran secara realtime tanpa perlu absensi manual kertas.",
    },
    {
      icon: "🕌",
      title: "Ibadah & Karakter 7 KAIH",
      desc: "Verifikasi dan monitor pelaksanaan sholat berjamaah serta jurnal 7 Kebiasaan Anak Indonesia Hebat siswa.",
    },
    {
      icon: "📑",
      title: "Catatan Pembinaan & Disiplin",
      desc: "Input pembinaan siswa, pantau catatan kedisiplinan, dan koordinasi dengan wali murid secara cepat.",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#064e3b_0%,_#0f172a_50%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <Image
                src="/Icon_GAS.png"
                alt="Logo GAS"
                width={36}
                height={36}
                className="h-8 w-8 rounded-xl object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                Gerbang Aplikasi Sekolah
              </div>
              <div className="text-lg font-extrabold text-white">
                Portal Khusus Guru &amp; Tenaga Kependidikan
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Khusus Dewan Guru &amp; Staf
          </div>
        </header>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-slate-950 p-6 sm:p-10 shadow-[0_20px_50px_rgba(16,185,129,0.15)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
                <span>👨‍🏫</span> Versi Resmi Guru (Android)
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Aplikasi Khusus <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Guru &amp; Pendidik</span>
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Presensi mandiri guru, kelola rekap kehadiran kelas, pantau pelaksanaan ibadah sholat berjamaah siswa, dan input catatan pembinaan secara langsung dari ponsel Anda.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-semibold text-emerald-100">Halaman Terproteksi untuk Pendidik</p>
                  <p className="mt-0.5 text-xs text-emerald-300/80">
                    Aplikasi ini hanya dapat diakses dengan akun guru yang telah terdaftar di dashboard admin sekolah.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={apkHref}
                  download={downloadFileName}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-300 hover:to-teal-300 hover:scale-[1.02] active:scale-[0.98]"
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
                  Unduh APK GAS Guru
                </a>
                <a
                  href="#panduan-instalasi"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Cara Pasang
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  File: <strong className="text-emerald-300">{downloadFileName}</strong>
                </span>
                {guruMeta.versionName && (
                  <span>
                    Versi: <strong className="text-slate-200">{guruMeta.versionName}</strong>
                  </span>
                )}
                {guruMeta.sizeMB && (
                  <span>
                    Ukuran: <strong className="text-slate-200">{guruMeta.sizeMB} MB</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-[32px] border border-emerald-400/20 bg-slate-950/70 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 font-bold">
                      Guru
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">GAS Guru</div>
                      <div className="text-xs text-emerald-400">Portal Pendidik</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    Aktif
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="text-xs text-slate-400">Presensi Guru Datang &amp; Pulang</div>
                    <div className="mt-1 text-sm font-bold text-emerald-400">
                      GPS Radius Sekolah Aktif
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="text-xs text-slate-400">Kelola Siswa &amp; Rekapitulasi</div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Wali Kelas &amp; Guru Mapel
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="text-xs text-slate-400">Monitoring Ibadah Sholat</div>
                    <div className="mt-1 text-sm font-bold text-teal-300">
                      Sinkronisasi Realtime RTDB
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <section>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Fasilitas Utama Aplikasi GAS Guru
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Mendukung efisiensi dan transparansi manajemen kelas dan kehadiran guru.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur transition hover:border-emerald-400/40 hover:bg-slate-900/50"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section id="panduan-instalasi" className="scroll-mt-10">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 sm:p-10 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              Panduan Instalasi
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Cara Memasang Aplikasi di HP Guru
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {installSteps.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-base font-black text-slate-950">
                      {step.number}
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gerbang Aplikasi Sekolah (GAS) • Portal Layanan Guru &amp; Tenaga Kependidikan.</p>
        </footer>
      </div>
    </main>
  );
}
