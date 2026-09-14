import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getApkDownloadHref,
  getLatestApkMetaByPackageName,
} from "@/lib/getApkDownloadHref";

export const metadata: Metadata = {
  title: "Download APK GAS Orang Tua - Portal Resmi Wali Murid",
  description:
    "Halaman resmi unduhan APK GAS Orang Tua (Wali Murid). Pantau presensi, ibadah sholat, lokasi GPS, dan hubungi wali kelas langsung dari HP Anda.",
};

export default function GasParentInstallPage() {
  const ortuMeta = getLatestApkMetaByPackageName("com.satupintu.mobile.ortu", {
    fileName: "GAS-OrangTua-1.0.1-ortu-1001.apk",
    versionName: "1.0.1-ortu",
    versionCode: 1001,
  });

  const apkHref = getApkDownloadHref(ortuMeta.fileName);
  const downloadFileName = ortuMeta.fileName;

  const installSteps = [
    {
      number: "1",
      title: "Unduh File APK GAS Orang Tua",
      body: `Tekan tombol "Unduh APK GAS Orang Tua" di atas. File akan otomatis terunduh dengan nama ${downloadFileName}.`,
    },
    {
      number: "2",
      title: "Izinkan Instalasi dari Browser",
      body: 'Jika muncul peringatan keamanan "File mungkin berbahaya", pilih "Tetap Download / Download Anyway". Buka Pengaturan di notifikasi untuk mengizinkan instalasi dari browser ini.',
    },
    {
      number: "3",
      title: "Instal Aplikasi Sampai Selesai",
      body: "Buka file yang baru saja diunduh melalui notifikasi atau folder Download HP Anda, lalu tekan tombol 'Instal' sampai proses pemasangan selesai.",
    },
    {
      number: "4",
      title: "Buka Aplikasi & Pantau Ananda",
      body: "Buka aplikasi GAS Orang Tua di menu HP Anda, pilih ananda tercinta, dan nikmati kemudahan memantau kehadiran, sholat, serta lokasi ananda setiap hari.",
    },
  ];

  const features = [
    {
      icon: "📍",
      title: "Presensi & Lokasi GPS Live",
      desc: "Ketahui secara pasti jam masuk dan jam kepulangan ananda di sekolah lengkap dengan koordinat posisi GPS dan indikator zona sekolah.",
    },
    {
      icon: "🕌",
      title: "Sholat & Karakter 7 KAIH",
      desc: "Pantau catatan sholat Dzuhur berjamaah dan jurnal 7 Kebiasaan Anak Indonesia Hebat (KAIH) ananda secara transparan dan realtime.",
    },
    {
      icon: "💬",
      title: "Hubungi Langsung Wali Kelas",
      desc: "Tombol komunikasi terpadu yang langsung menghubungkan orang tua ke nomor WhatsApp wali kelas ananda tanpa perlu mencari kontak manual.",
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Dukungan Multi-Anak",
      desc: "Cukup gunakan satu aplikasi untuk memantau lebih dari satu putra-putri yang bersekolah di sekolah yang sama dengan beralih profil secara instan.",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#083344_0%,_#0f172a_50%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Top Branding Banner */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 ring-1 ring-cyan-400/40">
              <Image
                src="/Icon_GAS.png"
                alt="Logo GAS"
                width={36}
                height={36}
                className="h-8 w-8 rounded-xl object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                Gerbang Aplikasi Sekolah
              </div>
              <div className="text-lg font-extrabold text-white">
                Portal Resmi Orang Tua / Wali Murid
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Khusus Wali Murid
          </div>
        </header>

        {/* Hero Card - Exclusive for Parents */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-slate-950 p-6 sm:p-10 shadow-[0_20px_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200">
                <span>📱</span> Versi Resmi HP Android
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Aplikasi Pendamping Khusus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-200">Orang Tua & Wali</span>
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Pantau kehadiran putra-putri Anda di sekolah, pelaksanaan ibadah sholat, koordinat peta posisi live, hingga kontak langsung WhatsApp ke wali kelas dari satu genggaman.
              </p>

              {/* Warning/Assurance Box */}
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-500/30 bg-teal-950/40 p-4 text-sm text-teal-200">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-semibold text-teal-100">Halaman Khusus Orang Tua / Wali Murid</p>
                  <p className="mt-0.5 text-xs text-teal-300/80">
                    Aplikasi ini dirancang khusus untuk wali murid. Anda tidak akan keliru mengunduh aplikasi siswa atau guru di halaman ini.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <a
                  href={apkHref}
                  download={downloadFileName}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-300 hover:to-teal-300 hover:scale-[1.02] active:scale-[0.98]"
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
                  Unduh APK GAS Orang Tua
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
                  Nama file: <strong className="text-cyan-300">{downloadFileName}</strong>
                </span>
                {ortuMeta.versionName && (
                  <span>
                    Versi: <strong className="text-slate-200">{ortuMeta.versionName}</strong>
                  </span>
                )}
                {ortuMeta.sizeMB && (
                  <span>
                    Ukuran: <strong className="text-slate-200">{ortuMeta.sizeMB} MB</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Phone Card Preview */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-[32px] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300 font-bold">
                      Ortu
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">GAS Orang Tua</div>
                      <div className="text-xs text-cyan-400">Sekolah Demo &amp; Mitra</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    Online
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Status Kehadiran Hari Ini</span>
                      <span className="font-bold text-emerald-400">Hadir (07:01 WIB)</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Ananda Tercatat di Sekolah
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Ibadah Sholat Dzuhur</span>
                      <span className="font-bold text-cyan-400">Tercatat Realtime</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Sholat Berjamaah di Sekolah
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5">
                    <div className="flex items-center justify-between text-xs text-emerald-300">
                      <span>Aksi Cepat &amp; Kontak</span>
                      <span>WhatsApp Ready</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-400">
                      <span>💬</span> Hubungi Wali Kelas Langsung
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center text-xs text-slate-400">
                  Kompatibel dengan semua HP Android (Android 8 s/d Android 15)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <section>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Fitur Lengkap untuk Ketenangan Hati Orang Tua
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Semua informasi aktivitas ananda di sekolah tersaji transparan, akurat, dan dapat dipantau dari mana saja.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur transition hover:border-cyan-400/40 hover:bg-slate-900/50"
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

        {/* Installation Steps */}
        <section id="panduan-instalasi" className="scroll-mt-10">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 sm:p-10 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
              Panduan Langkah Demi Langkah
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Cara Memasang Aplikasi di HP Android Anda
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Pemasangan melalui file APK sangat mudah dan hanya memerlukan waktu 1-2 menit.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {installSteps.map((step) => (
                <div
                  key={step.number}
                  className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-base font-black text-slate-950">
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

            {/* Download Reminder CTA */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-950/40 p-5 sm:flex-row sm:p-6">
              <div>
                <div className="text-base font-bold text-white">
                  Siap Memasang Aplikasi?
                </div>
                <div className="text-xs text-slate-300">
                  Unduh versi resmi terkini langsung dari server sekolah.
                </div>
              </div>
              <a
                href={apkHref}
                download={downloadFileName}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                <span>⬇️</span> Unduh Sekarang ({downloadFileName})
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-bold text-cyan-300">
                Apakah aplikasi ini bisa di iPhone (iOS)?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Saat ini aplikasi GAS Orang Tua dikhususkan untuk perangkat ponsel pintar berbasis Android.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-bold text-cyan-300">
                Muncul tulisan &quot;File mungkin berbahaya&quot;, apakah aman?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Sangat aman. Peringatan tersebut adalah pemberitahuan standar dari Google Android ketika mengunduh aplikasi di luar Play Store. File APK ini dibuat dan diverifikasi langsung oleh pihak sekolah.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-bold text-cyan-300">
                Bagaimana cara saya login ke dalam aplikasi?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Gunakan nomor HP atau data NISN ananda yang sudah didaftarkan pada pihak sekolah untuk menghubungkan akun orang tua.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-bold text-cyan-300">
                Bagaimana jika memiliki 2 anak di sekolah?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Aplikasi mendukung fitur multi-anak. Anda dapat mengganti profil pemantauan anak kapan saja melalui menu di pojok kanan atas aplikasi.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gerbang Aplikasi Sekolah (GAS) • Portal Layanan Orang Tua Siswa.</p>
          <p className="mt-1 text-slate-500">
            Butuh bantuan teknis? Hubungi pihak sekolah atau operator GAS sekolah Anda.
          </p>
        </footer>
      </div>
    </main>
  );
}
