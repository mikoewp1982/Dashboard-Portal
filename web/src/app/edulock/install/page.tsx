import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";
import edulockLoginImage from "../../../../public/tutorial/edulock/halaman-login.jpeg";
import edulockLogoImage from "../../../../public/tutorial/edulock/logo-aplikasi.png";
import edulockSetupImage from "../../../../public/tutorial/edulock/setup-konfigurasi.jpeg";

export const metadata: Metadata = {
  title: "Tutorial Instalasi EduLock Siswa",
  description: "Panduan instalasi APK EduLock untuk siswa melalui browser Android.",
};

function getApkDownloadHref(fileName: string) {
  const baseHref = `/apk/${fileName}`;

  try {
    const manifestPath = path.join(process.cwd(), "public", "apk", "apk-manifest.json");
    const manifestRaw = readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "");
    const manifest = JSON.parse(manifestRaw) as {
      files?: Record<string, { sha256?: string; lastModified?: string }>;
    };

    const fileMeta = manifest.files?.[fileName];
    const versionToken = fileMeta?.sha256?.slice(0, 12) || fileMeta?.lastModified;
    if (!versionToken) return baseHref;

    return `${baseHref}?v=${encodeURIComponent(versionToken)}`;
  } catch {
    return baseHref;
  }
}

const installSteps = [
  {
    title: "Unduh APK EduLock",
    body: "Tekan tombol Unduh APK di bawah halaman ini. File yang terunduh bernama EduLock-studentRelease.apk.",
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
    title: "Klik tombol Masuk",
    body: "Setelah akun diisi dengan benar, tekan tombol Masuk untuk melanjutkan proses aktivasi awal aplikasi.",
  },
  {
    title: "Setup konfigurasi lalu mulai aplikasi",
    body: "Ikuti setup konfigurasi yang muncul di layar sampai selesai, lalu lanjutkan ke tahap mulai aplikasi.",
  },
];

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
    title: "2. Masuk ke halaman login lalu klik Masuk",
    body: "Saat halaman login muncul, isi akun siswa yang dibagikan sekolah, kemudian tekan tombol Masuk untuk lanjut.",
    imageSrc: edulockLoginImage,
    imageAlt: "Halaman login aplikasi EduLock",
    callouts: [
      {
        title: "Masukan NISN kalian",
        body: "Isi kolom NISN dengan NISN kalian.",
        positionClassName: "right-[4%] top-[40%] max-w-[42%]",
        arrowClassName: "left-[36%] top-[41%] h-12 w-12 border-r-4 border-t-4",
        arrowRotationClassName: "rotate-45",
      },
      {
        title: "Nama siswa terisi otomatis",
        body: "Pastikan nama Anda sesuai. Jika tidak sesuai, hubungi Admin.",
        positionClassName: "right-[4%] top-[50%] max-w-[42%]",
        arrowClassName: "right-[34%] top-[61%] h-12 w-12 border-l-4 border-t-4",
        arrowRotationClassName: "-rotate-45",
      },
      {
        title: "Jika sesuai, tekan tombol Masuk",
        body: "Lanjutkan setelah data siswa benar.",
        positionClassName: "right-[4%] bottom-[6%] max-w-[42%]",
        arrowClassName: "left-[38%] bottom-[20%] h-12 w-12 border-r-4 border-b-4",
        arrowRotationClassName: "-rotate-45",
      },
    ],
  },
  {
    title: "3. Selesaikan setup konfigurasi lalu mulai aplikasi",
    body: "Ikuti petunjuk setup konfigurasi yang tampil di layar sampai selesai, kemudian lanjutkan ke tahap mulai aplikasi.",
    imageSrc: edulockSetupImage,
    imageAlt: "Halaman setup konfigurasi EduLock",
  },
];

export default function EduLockInstallPage() {
  const apkHref = getApkDownloadHref("EduLock-studentRelease.apk");

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
                <Link
                  href={apkHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Unduh APK EduLock
                </Link>
                <a
                  href="#langkah-instalasi"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Langkah Instalasi
                </a>
              </div>

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
                          {"callouts" in step && step.callouts ? (
                            <div className="pointer-events-none absolute inset-0">
                              {step.callouts.map((callout) => (
                                <div key={callout.title}>
                                  <div
                                    className={`absolute rounded-2xl border-2 border-red-400 bg-white/95 px-3 py-2 shadow-lg ${callout.positionClassName}`}
                                  >
                                    <div className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
                                      {callout.title}
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-800">
                                      {callout.body}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
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
      </section>
    </main>
  );
}
