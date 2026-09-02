import type { Metadata } from "next";
import Image from "next/image";
import {
  getApkDownloadHref,
  getLatestApkMetaByPackageName,
} from "@/lib/getApkDownloadHref";
import edulockLoginImage from "../../../../public/tutorial/edulock/halaman-login.jpeg";
import edulockLogoImage from "../../../../public/tutorial/edulock/logo-aplikasi.png";
import edulockSetupImage from "../../../../public/tutorial/edulock/setup-konfigurasi.jpeg";

export const metadata: Metadata = {
  title: "Tutorial Instalasi EduLock Siswa",
  description: "Panduan instalasi APK EduLock untuk siswa melalui browser Android.",
};

function getInstallSteps(downloadFileName: string) {
  return [
    {
      title: "Unduh APK EduLock",
      body: `Tekan tombol Unduh APK di bawah halaman ini. File yang terunduh bernama ${downloadFileName}.`,
    },
    {
      title: "Izinkan instalasi dari browser",
      body: "Jika muncul peringatan keamanan, buka pengaturan yang ditawarkan lalu aktifkan izin instal aplikasi dari browser yang sedang dipakai.",
    },
    {
      title: "Instal aplikasi sampai selesai",
      body: "Setelah izin aktif, lanjutkan pemasangan APK sampai selesai tanpa menutup layar.",
    },
    {
      title: "Buka logo aplikasi EduLock",
      body: "Setelah instalasi selesai, cari logo aplikasi EduLock di HP siswa lalu tekan untuk membuka aplikasi.",
    },
    {
      title: "Masuk ke halaman login",
      body: "Saat aplikasi terbuka, siswa akan melihat halaman login EduLock dan siap memasukkan akun yang diberikan sekolah.",
    },
    {
      title: "Klik tombol Daftar",
      body: "Setelah akun diisi dengan benar, tekan tombol Daftar untuk melanjutkan proses aktivasi awal aplikasi.",
    },
    {
      title: "Setup konfigurasi lalu mulai aplikasi",
      body: "Ikuti setup konfigurasi yang muncul di layar sampai selesai, lalu lanjutkan ke tahap mulai aplikasi.",
    },
  ];
}

const notes = [
  "Gunakan HP Android. Instalasi APK tidak berlaku untuk iPhone.",
  "Pastikan ruang penyimpanan cukup sebelum mengunduh dan menginstal.",
  "Jangan menghapus aplikasi setelah berhasil login tanpa arahan dari sekolah.",
  "Jika tombol Instal tidak muncul, cek lagi izin instal aplikasi dari browser/File Manager.",
];

const visualSteps = [
  {
    title: "1. Buka logo aplikasi EduLock",
    body: "Setelah APK berhasil dipasang, cari ikon EduLock di layar HP siswa lalu tekan untuk membuka aplikasi.",
    imageSrc: edulockLogoImage,
    imageAlt: "Logo aplikasi EduLock",
  },
  {
    title: "2. Masuk ke halaman login lalu klik Daftar",
    body: "Saat halaman login muncul, isi akun siswa yang dibagikan sekolah, kemudian tekan tombol Daftar untuk lanjut.",
    imageSrc: edulockLoginImage,
    imageAlt: "Halaman login aplikasi EduLock",
  },
  {
    title: "3. Selesaikan setup konfigurasi lalu mulai aplikasi",
    body: "Ikuti petunjuk setup konfigurasi yang tampil di layar sampai selesai, kemudian lanjutkan ke tahap mulai aplikasi.",
    imageSrc: edulockSetupImage,
    imageAlt: "Halaman setup konfigurasi EduLock",
  },
];

const troubleshootingMenus = [
  {
    vendor: "VIVO",
    subtitle: "OriginOS / FuntouchOS",
    icon: "🟦",
    symptoms: [
      'Overlay "Tampilkan di atas apl lain" → pesan "Fitur tidak tersedia"',
      "Toggle EduLock Protection ON → otomatis kembali OFF",
      "Badge Aksesibilitas GAS tetap merah padahal sudah izinkan",
      "Nama siswa tidak auto-isi saat registrasi (WiFi + AI Optimizer kill service)",
    ],
    quickFix: "3B: Baterai (Allow high power) → Background (Auto-start 4 switch) → Buka Accessibility ON. Kunci recent Apps kartu EduLock ↓ → 🔒. Jika masih gagal → ADB 6 perintah.",
  },
  {
    vendor: "Realme Narzo",
    subtitle: "Android 11 / ColorOS / Realme UI",
    icon: "🟧",
    symptoms: [
      "Install APK manual selalu gagal diblok Play Protect + Realme Security Scan",
      "EduLock Protection toggle ON → kembali OFF otomatis",
      "Device Admin & Overlay abu-abu tidak bisa di-tap",
    ],
    quickFix: "PILIH 1 (Fisik, SISWA): (1) Matikan Play Protect dulu: Play Store → Settings → Play Protect → Gear icon → OFF-kan 2 toggle 'Scan device for security threats' + 'Improve harmful app detection'. (2) Install ulang APK, tap tetap install jika muncul Security Warning.",
  },
  {
    vendor: "OPPO Reno",
    subtitle: "ColorOS 13+ / Android 13+",
    icon: "🟩",
    symptoms: [
      'Tap EduLock Protection di Accessibility → dialog putih "Setelan terbatas" tidak bisa ON',
      "Besok pagi 5 badge Gate MERAH SEMUA (toggle Aksesibilitas/Overlay dicabut otomatis)",
      'Saat install / izinkan setting sistem → muncul "Instalasi diblokir keamanan" dan tidak bisa lanjut',
    ],
    quickFix: "2L WAJIB FISIK di Info Aplikasi EduLock: (L1) Lanjutan → Izinkan akses setelan terbatas. (L2) Mati toggle Jeda aktivitas aplikasi jika tak dipakai. 3 toggle Dev Options ON sebelum setup: USB debugging (Security settings), Nonaktifkan validasi izin, Install via USB.",
  },
  {
    vendor: "GAS Compliance Gate",
    subtitle: "5 Badge Merah Semua HP",
    icon: "🛡️",
    symptoms: [
      'GAS menampilkan "Akses Ditahan" padahal Aksesibilitas + Device Admin lokal BENAR ON',
      'Badge "Setup ❌" padahal EduLock sudah di-setup 5/5 lengkap',
      "5 badge gate MERAH SEMUA walau install baru",
    ],
    quickFix: "Pastikan kedua APK (EduLock & GAS) signed SHA256 SAMA → lintas-app SharedPrefs createPackageContext bisa baca `setup_completed` + `is_protection_active`. Jika HP masih tertahan: restart EduLock, tap tombol MULAI, tunggu telemetry RTDB fresh < 120 detik.",
  },
];

const vivoStepsFisik = [
  { t: "Baterai → Allow high power EduLock + Never Optimize", d: "Pengaturan → Baterai → High power consumption apps → EduLock → Izinkan. Mode hemat daya & ultra hemat DAYA = OFF. Background optimization: EduLock + GAS = Daftar Tidak Pernah Dioptimalkan." },
  { t: "Auto-start 4 Switch (Izin Lainnya)", d: "Info App EduLock → Izin Lainnya → ON-kan SEMUA: (1) Jalankan di latar belakang, (2) Mulai otomatis, (3) Asosiasi mulai otomatis, (4) Latar belakang pop-up. Ulangi untuk APK GAS Siswa." },
  { t: "Kunci Recent Apps Kartu EduLock", d: "Recent Apps → kartu EduLock → SWIPE KE BAWAH (↓) 1x → ikon GEMBOK (🔒) muncul → TAP sampai terkunci. Ulangi GAS Siswa. Efek: Clear All tidak membunuh EduLock/GAS." },
  { t: "Privasi & 5 Special App Access", d: "Info App → Izin → Izinkan SEMUA. Special app access 5 item: (1) Tampil di atas apl lain = Allow, (2) Ubah pengaturan sistem = Allow, (3) Usage Access = ON, (4) Notification Access = ON, (5) Ignore Battery Optimizations = Izinkan. Ulangi GAS." },
  { t: "Accessibility → EduLock Protection = ON", d: "Pengaturan → Pintasan & Accessibility → Downloaded services → EduLock Protection → Toggle ON. Centang Saya setuju → OK. Pastikan toggle HIJAU TETAP." },
  { t: "Device Admin ON + Reboot", d: "Security → Device admin apps → EduLock Protection = Aktif. REBOOT HP WAJIB. Tunggu 60 detik → buka EduLock, tap tombol MULAI → 5 badge GAS = HIJAU SEMUA 🏆." },
];

const oppoStepsFisik = [
  { t: "(L2) MATIKAN Jeda aktivitas jika tak dipakai", d: "LongPress ikon EduLock → Info Aplikasi → gulir PALING BAWAH → toggle `Jeda aktivitas aplikasi jika tak dipakai` → MATIKAN (abu-abu OFF). Ini mencegah aplikasi dimatikan otomatis besok pagi setelah 24 jam." },
  { t: "(L1) IZINKAN akses Setelan terbatas", d: "Masih di Info Aplikasi EduLock → gulir ke Section LANJUTAN → baris `Izinkan akses setelan terbatas` → TAP → dialog bawah muncul → tombol IZINKAN. Ini wajib sentuh fisik, tidak bisa otomatis." },
  { t: "(M1/M2/M3) 3 Toggle di Opsi Pengembang = ON", d: "Pengaturan → Opsi Pengembang (jika belum ada: About Phone → tap Version 7x). ON-kan 3 ini: (M1) USB debugging (Pengaturan keamanan), (M2) Nonaktifkan validasi izin, (M3) Instalasi melalui USB." },
  { t: "Usage Access + Accessibility = ON", d: "Info Aplikasi EduLock → Usage Data Access = ON. Lalu ke Pengaturan → Accessibility → Downloaded apps → EduLock Protection → Toggle ON. Centang Saya setuju → OK. Toggle = HIJAU ✅." },
];

export default function EduLockInstallPage() {
  const apkMeta = getLatestApkMetaByPackageName("com.sekolah.edulock", {
    fileName: "EduLock-1.3.27-53.apk",
    versionName: "1.3.27",
    versionCode: 53,
  });
  // URL must be the versioned file so mobile Save-As keeps the version in the name.
  const apkHref = getApkDownloadHref(apkMeta.fileName);
  const downloadFileName = apkMeta.fileName;
  const installSteps = getInstallSteps(downloadFileName);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_#0f172a_46%,_#020617_100%)] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/45 shadow-2xl backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                Tutorial Instalasi APK EduLock Siswa
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pasang EduLock di HP siswa lewat satu URL yang mudah dibuka.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Halaman ini dibuat agar siswa cukup membuka browser, membaca langkah instalasi,
                lalu mengunduh APK EduLock dari tempat yang sama.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={apkHref}
                  download={downloadFileName}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Unduh APK EduLock
                </a>
                <a
                  href="#langkah-instalasi"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Langkah Instalasi
                </a>
                <a
                  href="#troubleshooting"
                  className="inline-flex items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 px-6 py-4 text-base font-semibold text-amber-100 transition hover:bg-amber-300/15"
                >
                  Troubleshooting Vendor HP
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                File unduhan:{" "}
                <span className="font-semibold text-cyan-200">{downloadFileName}</span>
                {apkMeta.versionName ? (
                  <>
                    {" "}
                    (versi {apkMeta.versionName}
                    {typeof apkMeta.versionCode === "number"
                      ? ` / ${apkMeta.versionCode}`
                      : ""}
                    )
                  </>
                ) : null}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Platform</div>
                  <div className="mt-2 text-lg font-bold text-white">Android</div>
                  <div className="mt-1 text-sm text-slate-300">Instalasi melalui file APK</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Sumber File</div>
                  <div className="mt-2 text-lg font-bold text-white">Portal Sekolah</div>
                  <div className="mt-1 text-sm text-slate-300">Unduh langsung dari halaman resmi</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Tujuan</div>
                  <div className="mt-2 text-lg font-bold text-white">Proteksi EduLock</div>
                  <div className="mt-1 text-sm text-slate-300">Dipakai siswa sesuai arahan sekolah</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 lg:p-10">
              <div className="w-full max-w-md rounded-[28px] border border-cyan-300/20 bg-slate-950/50 p-6 shadow-[0_24px_60px_rgba(8,47,73,0.45)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400/15 ring-1 ring-cyan-300/20">
                  <Image
                    src={edulockLogoImage}
                    alt="Logo EduLock"
                    width={72}
                    height={72}
                    className="h-16 w-16 object-contain"
                    priority
                  />
                </div>
                <div className="mt-5 text-center">
                  <h2 className="text-2xl font-black text-white">EduLock Siswa</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Unduh aplikasi resmi, ikuti panduan instalasi, lalu login menggunakan akun
                    siswa yang diberikan sekolah.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
                  <div className="font-bold text-amber-200">Catatan penting</div>
                  <p className="mt-1">
                    Jika browser memblokir instalasi, aktifkan izin "Instal aplikasi tidak dikenal"
                    hanya untuk browser yang sedang dipakai, lalu lanjutkan pemasangan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          id="langkah-instalasi"
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">
              Langkah Instalasi
            </div>
            <div className="mt-6 space-y-4">
              {installSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-8">
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">
                Panduan Visual
              </div>
              <div className="mt-5 grid gap-4">
                {visualSteps.map((step) => (
                  <div
                    key={step.title}
                    className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5"
                  >
                    <div className="border-b border-white/10 bg-slate-950/30 p-4 sm:p-5">
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{step.body}</p>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/50">
                        <div className="relative">
                          <Image
                            src={step.imageSrc}
                            alt={step.imageAlt}
                            width={1200}
                            height={900}
                            className="h-auto w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">
                Yang Perlu Diperhatikan
              </div>
              <ul className="mt-5 space-y-3">
                {notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">
                Bantuan Cepat
              </div>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <div>
                  <div className="font-bold text-white">APK tidak bisa diinstal?</div>
                  <p className="mt-1">
                    Cek izin instalasi dari browser atau file manager, lalu buka ulang file APK.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white">Aplikasi berhasil terpasang tapi tidak bisa masuk?</div>
                  <p className="mt-1">
                    Pastikan akun siswa yang dipakai benar. Jika masih gagal, hubungi admin sekolah.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="troubleshooting"
          className="rounded-[32px] border border-amber-400/15 bg-gradient-to-br from-amber-400/5 via-slate-950/40 to-rose-500/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10"
        >
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Menu Troubleshooting Vendor HP
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                EduLock gagal setup atau Aksesibilitas mati sendiri?
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Setiap brand Android memiliki security policy berbeda. Pilih menu sesuai merk HP siswa, lalu ikuti
                langkah yang telah teruji langsung di lapangan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {troubleshootingMenus.map((m) => (
              <details
                key={m.vendor}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/45 transition hover:border-amber-300/30"
              >
                <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl ring-1 ring-white/10">
                    {m.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">{m.vendor}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                          {m.subtitle}
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-400 transition group-open:rotate-180">
                        ▾
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {m.symptoms.map((s) => (
                        <li
                          key={s}
                          className="flex gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2 text-[13px] leading-5 text-rose-100"
                        >
                          <span className="shrink-0 font-bold text-rose-300">!</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </summary>
                <div className="border-t border-white/10 bg-white/[0.02] p-5 sm:p-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-100">
                    ✅ Solusi Singkat
                  </div>
                  <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-50">
                    {m.quickFix}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-sky-300/30 bg-sky-300/10 px-5 py-2.5">
              <span className="text-xl">🎒</span>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-100">
                  Panduan Perbaikan Mandiri
                </div>
                <div className="text-sm font-semibold text-sky-200">
                  TANPA LAPTOP — hanya sentuh layar HP. Pilih sesuai merk HP siswa.
                </div>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <details className="group rounded-[24px] border border-cyan-400/20 bg-slate-950/50 shadow-xl overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl font-black text-cyan-300 ring-1 ring-cyan-300/20">
                    1
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                      VIVO · OriginOS / FuntouchOS
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      6 Langkah (Tanpa Laptop)
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      AI System Optimizer VIVO memblok Overlay &amp; Accessibility. Kita buka kunci 3 layer dulu.
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</div>
                </summary>
                <div className="border-t border-white/10 p-5 sm:p-6 space-y-3">
                  {vivoStepsFisik.map((s, i) => (
                    <div
                      key={s.t}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{s.t}</div>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details className="group rounded-[24px] border border-rose-400/20 bg-slate-950/50 shadow-xl overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-400/15 text-2xl font-black text-rose-300 ring-1 ring-rose-300/20">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-rose-200">
                      OPPO Reno · ColorOS 13/14
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      4 Langkah Fisik WAJIB
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      Paling ketat. 2 langkah pertama WAJIB sentuh fisik — tidak ada cara otomatis.
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</div>
                </summary>
                <div className="border-t border-white/10 p-5 sm:p-6 space-y-3">
                  <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-[13px] leading-5 text-rose-50">
                    🔴 POLICY OPPO: Semua APK luar Play Store OTOMATIS diblok dari setelan terbatas.
                    Solusi = L1 (izin setelan terbatas) + L2 (matikan pembunuh besok pagi).
                  </div>
                  {oppoStepsFisik.map((s, i) => (
                    <div
                      key={s.t}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400 font-black text-slate-950">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{s.t}</div>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{s.d}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-[12px] leading-5 text-slate-300">
                    <div className="text-amber-300 font-bold">💡 Formula OPPO untuk petugas lapangan:</div>
                    2L + 3M = L1 (Izinkan set terbatas) · L2 (Matikan jeda aktivitas) · M1 (USB debugging
                    Security) · M2 (Nonaktifkan validasi izin) · M3 (Install via USB).
                  </div>
                </div>
              </details>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
