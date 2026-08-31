import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getApkDownloadHref,
  getLatestApkMetaByPackageName,
} from "@/lib/getApkDownloadHref";
import gasAbsensiStep1Image from "../../../../public/tutorial/gas-siswa/absensi/1.jpeg";
import gasAbsensiStep2Image from "../../../../public/tutorial/gas-siswa/absensi/2.jpeg";
import gasAbsensiStep3Image from "../../../../public/tutorial/gas-siswa/absensi/3.jpeg";
import gas7KaihImage from "../../../../public/tutorial/gas-siswa/7-kaih/1.jpeg";
import gasLoginImage from "../../../../public/tutorial/gas-siswa/halaman-login.jpeg";
import gasLocationPermissionImage from "../../../../public/tutorial/gas-siswa/izin-lokasi.jpeg";
import gasAduanStep1Image from "../../../../public/tutorial/gas-siswa/layanan-aduan/1.jpeg";
import gasAduanStep2Image from "../../../../public/tutorial/gas-siswa/layanan-aduan/2.jpeg";
import gasLenteraStep1Image from "../../../../public/tutorial/gas-siswa/lentera-digital/1.jpeg";
import gasLenteraStep2Image from "../../../../public/tutorial/gas-siswa/lentera-digital/2.jpeg";
import gasLenteraStep3Image from "../../../../public/tutorial/gas-siswa/lentera-digital/3.jpeg";
import gasLenteraStep4Image from "../../../../public/tutorial/gas-siswa/lentera-digital/4.jpeg";
import gasLenteraStep5Image from "../../../../public/tutorial/gas-siswa/lentera-digital/5.jpeg";
import gasPresensiSholatStep1Image from "../../../../public/tutorial/gas-siswa/presensi-sholat/1.jpeg";
import gasPresensiDhuhaJumatImage from "../../../../public/tutorial/gas-siswa/presensi-dhuha-jumat/1.jpeg";
import gasLogoImage from "../../../../public/tutorial/gas-siswa/logo-aplikasi.png";
import gasMenuImage from "../../../../public/tutorial/gas-siswa/menu-gas.png";
import gasToolsImage from "../../../../public/tutorial/gas-siswa/tools/1.jpeg";
import gasVirtualPetImage from "../../../../public/tutorial/gas-siswa/virtual-pet/1.jpeg";

export const metadata: Metadata = {
  title: "Tutorial Instalasi GAS Siswa",
  description: "Panduan instalasi APK GAS Siswa melalui browser Android.",
};

function getInstallSteps(downloadFileName: string) {
  return [
    {
      title: "Unduh APK GAS Siswa",
      body: `Tekan tombol Unduh APK di bawah halaman ini. File yang terunduh bernama ${downloadFileName}.`,
    },
    {
      title: "Izinkan instalasi dari browser",
      body: 'Jika muncul peringatan keamanan, buka pengaturan yang ditawarkan lalu aktifkan izin instal aplikasi dari browser yang sedang dipakai.',
    },
    {
      title: "Instal aplikasi sampai selesai",
      body: "Setelah izin aktif, lanjutkan pemasangan APK sampai selesai tanpa menutup layar.",
    },
    {
      title: "Buka aplikasi GAS Siswa",
      body: "Setelah terpasang, buka aplikasi GAS Siswa dan login memakai akun yang diberikan sekolah.",
    },
    {
      title: "Izinkan akses lokasi saat diminta",
      body: 'Jika muncul permintaan izin lokasi, pilih "Saat aplikasi digunakan" agar fitur berjalan normal.',
    },
  ];
}

const notes = [
  "Gunakan HP Android. Instalasi APK tidak berlaku untuk iPhone.",
  "Pastikan ruang penyimpanan cukup sebelum mengunduh dan menginstal.",
  "Jika tombol Instal tidak muncul, cek lagi izin instal aplikasi dari browser/File Manager.",
  "Jika tidak bisa login, pastikan NPSN dan NISN benar, lalu hubungi admin sekolah.",
];

const visualSteps = [
  {
    title: "1. Buka logo aplikasi GAS",
    body: "Cari ikon GAS di layar HP siswa lalu tekan untuk membuka aplikasi.",
    imageSrc: gasLogoImage,
    imageAlt: "Logo aplikasi GAS",
  },
  {
    title: "2. Isi data login siswa",
    body: "Isi NPSN dan NISN. Nama siswa akan terisi otomatis jika data cocok.",
    imageSrc: gasLoginImage,
    imageAlt: "Halaman login GAS Siswa",
  },
  {
    title: "3. Izin lokasi (Saat aplikasi digunakan)",
    body: 'Saat muncul izin lokasi, pilih "Saat aplikasi digunakan".',
    imageSrc: gasLocationPermissionImage,
    imageAlt: "Izin lokasi GAS Siswa",
  },
];

const gasMenuItems = [
  {
    id: "absensi",
    title: "Absensi",
    body: "Isi dan pantau presensi sesuai arahan sekolah.",
    steps: [
      "Buka menu Absensi.",
      "Pilih tombol/aksi yang diminta guru (misal: Absen Masuk/Pulang).",
      "Pastikan data terkirim, lalu kembali ke beranda.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman Absensi",
        body: 'Tekan tombol "ABSEN DATANG" atau "ABSEN PULANG" sesuai jadwal.',
        imageSrc: gasAbsensiStep1Image,
        imageAlt: "Absensi - Halaman utama",
      },
      {
        title: "2. Verifikasi lokasi sekolah",
        body: 'Jika muncul peta, pastikan jarak tertulis "TERPENUHI" lalu tekan tombol Absen.',
        imageSrc: gasAbsensiStep2Image,
        imageAlt: "Absensi - Verifikasi lokasi",
      },
      {
        title: "3. Pastikan status sudah tercatat",
        body: 'Jika sudah berhasil, akan muncul status seperti "Sudah Absen Masuk" atau "Sudah Absen Pulang".',
        imageSrc: gasAbsensiStep3Image,
        imageAlt: "Absensi - Status tercatat",
      },
    ],
  },
  {
    id: "presensi-sholat",
    title: "Presensi Sholat",
    body: "Catat presensi sholat harian bila fitur aktif.",
    steps: [
      "Buka menu Presensi Sholat.",
      "Pilih jadwal/waktu sholat yang tersedia.",
      "Ikuti instruksi di layar sampai status tercatat.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman Presensi Sholat",
        body: 'Cek aturan hari dan lokasi musholla, lalu tekan "Presensi Sholat" saat waktunya. Tombol Presensi Sholat akan muncul jika di area Mushollah.',
        imageSrc: gasPresensiSholatStep1Image,
        imageAlt: "Presensi Sholat - Halaman utama",
      },
    ],
  },
  {
    id: "presensi-dhuha-jumat",
    title: "Presensi Dhuha & Jum'at",
    body: "Catat presensi khusus sholat Dhuha dan Jum'at.",
    steps: [
      "Buka menu Presensi Dhuha & Jum'at.",
      "Pilih tombol presensi (Dhuha atau Jum'at) yang sedang aktif.",
      "Pastikan Anda berada di lokasi masjid/musholla sekolah.",
      "Tunggu hingga status presensi berhasil tercatat."
    ],
    visualSteps: [
      {
        title: "1. Buka Halaman Presensi",
        imageSrc: gasPresensiDhuhaJumatImage,
        imageAlt: "Presensi Dhuha & Jum'at - Halaman utama",
      },
    ],
  },
  {
    id: "lentera-digital",
    title: "Lentera Digital",
    body: "Akses fitur literasi/perpustakaan digital sekolah.",
    steps: [
      "Buka menu Lentera Digital.",
      "Pilih buku/tugas bacaan dari guru.",
      "Ikuti instruksi membaca dan kirim laporan bila diminta.",
    ],
    visualSteps: [
      {
        title: "1. Buka Lentera Digital",
        imageSrc: gasLenteraStep1Image,
        imageAlt: "Lentera Digital - Katalog buku",
      },
      {
        title: "2. Pilih kategori buku",
        imageSrc: gasLenteraStep2Image,
        imageAlt: "Lentera Digital - Pilih kategori",
      },
      {
        title: "3. Buka Tugas Literasi",
        imageSrc: gasLenteraStep3Image,
        imageAlt: "Lentera Digital - Tugas literasi",
      },
      {
        title: "4. Isi laporan tugas",
        imageSrc: gasLenteraStep4Image,
        imageAlt: "Lentera Digital - Form laporan",
      },
      {
        title: "5. Cek riwayat laporan",
        imageSrc: gasLenteraStep5Image,
        imageAlt: "Lentera Digital - Riwayat laporan",
      },
    ],
  },
  {
    id: "7-kaih",
    title: "7 KAIH",
    body: "Isi dan pantau kegiatan 7 Kebiasaan Anak Indonesia Hebat.",
    steps: [
      "Buka menu 7 KAIH.",
      "Pilih kebiasaan/hari yang sedang berjalan.",
      "Isi checklist/jawaban, lalu simpan.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman 7 KAIH",
        body: "Silahkan check list 7 KAIH sesuai yang kalian kerjakan, pastikan memilih dengan jujur. Jika sudah lanjutkan klik tombol kirim laporan.",
        imageSrc: gas7KaihImage,
        imageAlt: "7 KAIH - Halaman utama",
      },
    ],
  },
  {
    id: "virtual-pet",
    title: "Virtual Pet",
    body: "Lakukan aktivitas virtual pet sesuai aturan sekolah.",
    steps: [
      "Buka menu Virtual Pet.",
      "Lihat status pet dan instruksi harian.",
      "Selesaikan aktivitas yang diminta lalu simpan.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman Virtual Pet",
        body: "Pastikan 4 kartu kebiasaan itu kalian laksanakan, agar Pet kalian tetap sehat.",
        imageSrc: gasVirtualPetImage,
        imageAlt: "Virtual Pet - Halaman utama",
      },
    ],
  },
  {
    id: "kedisiplinan",
    title: "Kedisiplinan",
    body: "Lihat ringkasan poin dan status kedisiplinan.",
    steps: [
      "Buka menu Kedisiplinan.",
      "Lihat ringkasan poin, catatan, dan riwayat.",
      "Jika ada ketidaksesuaian, hubungi wali kelas/admin.",
    ],
  },
  {
    id: "layanan-aduan",
    title: "Layanan Aduan",
    body: "Kirim laporan/aduan sesuai kanal yang disediakan sekolah.",
    steps: [
      "Buka menu Layanan Aduan.",
      "Isi judul dan detail laporan dengan jelas.",
      "Kirim laporan dan tunggu tindak lanjut sekolah.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman Layanan Aduan",
        imageSrc: gasAduanStep1Image,
        imageAlt: "Layanan Aduan - Halaman utama",
      },
      {
        title: "2. Isi dan kirim laporan aduan",
        imageSrc: gasAduanStep2Image,
        imageAlt: "Layanan Aduan - Form laporan",
      },
    ],
  },
  {
    id: "notifikasi",
    title: "Notifikasi",
    body: "Baca pengumuman dan notifikasi terbaru.",
    steps: [
      "Buka menu Notifikasi.",
      "Baca pesan yang masuk dari sekolah/guru.",
      "Tandai selesai bila tersedia.",
    ],
  },
  {
    id: "tools",
    title: "Tools",
    body: "Akses alat bantu sesuai kebutuhan sekolah.",
    steps: [
      "Buka menu Tools.",
      "Pilih alat bantu yang diminta sekolah.",
      "Ikuti instruksi di layar sesuai kebutuhan.",
    ],
    visualSteps: [
      {
        title: "1. Buka halaman Tools",
        body: "Gunakan Kamus Bahasa Inggris - Indonesia dan juga Kamus Bahasa Jawa - Indonesia, untuk menunjang kegiatan belajar kalian.",
        imageSrc: gasToolsImage,
        imageAlt: "Tools - Halaman utama",
      },
    ],
  },
];

export default function GasStudentInstallPage() {
  const apkMeta = getLatestApkMetaByPackageName("com.satupintu.mobile.siswa", {
    fileName: "GAS-Siswa-1.0.96-siswa-23093.apk",
    versionName: "1.0.95-siswa",
    versionCode: 23093,
  });
  // URL must be the versioned file so mobile Save-As keeps the version in the name.
  const apkHref = getApkDownloadHref(apkMeta.fileName);
  const downloadFileName = apkMeta.fileName;
  const installSteps = getInstallSteps(downloadFileName);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0ea5e9_0%,_#0f172a_46%,_#020617_100%)] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/45 shadow-2xl backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-100">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                Tutorial Instalasi APK GAS Siswa
              </div>

              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pasang GAS Siswa di HP lewat satu URL yang mudah dibuka.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Halaman ini dibuat agar siswa cukup membuka browser, membaca langkah instalasi,
                lalu mengunduh APK GAS Siswa dari tempat yang sama.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={apkHref}
                  download={downloadFileName}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-sky-300"
                >
                  Unduh APK GAS Siswa
                </a>
                <a
                  href="#langkah-instalasi"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Lihat Langkah Instalasi
                </a>
                <a
                  href="#penggunaan-menu-gas"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Penggunaan Menu GAS
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                File unduhan:{" "}
                <span className="font-semibold text-sky-200">{downloadFileName}</span>
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
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">Platform</div>
                  <div className="mt-2 text-lg font-bold text-white">Android</div>
                  <div className="mt-1 text-sm text-slate-300">Instalasi melalui file APK</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">Aplikasi</div>
                  <div className="mt-2 text-lg font-bold text-white">GAS Siswa</div>
                  <div className="mt-1 text-sm text-slate-300">Gerbang Aplikasi Sekolah</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">Catatan</div>
                  <div className="mt-2 text-lg font-bold text-white">NPSN & NISN</div>
                  <div className="mt-1 text-sm text-slate-300">Pastikan data sesuai</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 lg:p-10">
              <div className="w-full max-w-md rounded-[28px] border border-sky-300/20 bg-slate-950/50 p-6 shadow-[0_24px_60px_rgba(7,89,133,0.45)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-400/15 ring-1 ring-sky-300/20">
                  <Image
                    src={gasLogoImage}
                    alt="Logo GAS"
                    width={72}
                    height={72}
                    className="h-16 w-16 rounded-2xl object-contain"
                    priority
                  />
                </div>
                <div className="mt-5 text-center">
                  <h2 className="text-2xl font-black text-white">GAS Siswa</h2>
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

        <section id="langkah-instalasi" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
              Langkah Instalasi
            </div>
            <div className="mt-6 space-y-4">
              {installSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400 font-black text-slate-950">
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
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
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
                      <div className="overflow-hidden rounded-2xl border border-sky-300/20 bg-slate-950/50">
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
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
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
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
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
                  <div className="font-bold text-white">Aplikasi terpasang tapi tidak bisa masuk?</div>
                  <p className="mt-1">
                    Pastikan NPSN dan NISN benar. Jika nama siswa tidak terisi otomatis, hubungi admin sekolah.
                  </p>
                </div>
                <div>
                  <div className="font-bold text-white">Izin lokasi muncul terus?</div>
                  <p className="mt-1">
                    Pilih "Saat aplikasi digunakan". Jika masih gagal, coba restart aplikasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="penggunaan-menu-gas"
          className="rounded-[32px] border border-white/10 bg-slate-950/40 p-6 shadow-xl backdrop-blur sm:p-8"
        >
          <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
            Penggunaan Menu GAS
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Panduan singkat memakai menu utama di GAS Siswa
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Setelah berhasil login, GAS Siswa menampilkan beberapa menu utama. Pilih menu sesuai kebutuhan sekolah dan ikuti arahan guru/admin.
          </p>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-sky-300/20 bg-slate-950/50 shadow-[0_24px_60px_rgba(7,89,133,0.35)]">
            <div className="border-b border-white/10 bg-slate-950/30 p-4 sm:p-5">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">
                Tampilan Menu GAS
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                Contoh menu utama yang akan muncul setelah login.
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="mx-auto max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:max-w-[460px]">
                <Image
                  src={gasMenuImage}
                  alt="Menu utama GAS Siswa"
                  width={1200}
                  height={1200}
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
              Daftar Menu
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {gasMenuItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <a href={`#menu-${item.id}`} className="text-sm font-black text-white underline decoration-white/20 underline-offset-4 hover:decoration-white/60">
                    {item.title}
                  </a>
                  <div className="mt-1 text-sm leading-6 text-slate-300">{item.body}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
              Cara Penggunaan Tiap Menu
            </div>
            <div className="mt-5 grid gap-4">
              {gasMenuItems.map((item) => (
                <section
                  key={item.id}
                  id={`menu-${item.id}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.body}</p>
                    </div>
                    <a
                      href="#penggunaan-menu-gas"
                      className="mt-1 inline-flex w-fit items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-100 transition hover:bg-white/10"
                    >
                      Kembali ke daftar
                    </a>
                  </div>
                  <ol className="mt-4 space-y-2">
                    {item.steps.map((step) => (
                      <li
                        key={step}
                        className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-6 text-slate-200"
                      >
                        {step}
                      </li>
                    ))}
                  </ol>

                  {"visualSteps" in item && item.visualSteps ? (
                    <div className="mt-6 border-t border-white/10 pt-6">
                      <div className="text-sm font-bold uppercase tracking-[0.24em] text-sky-200">
                        Contoh Visual
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {item.visualSteps.map((step) => (
                          <div
                            key={step.title}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                          >
                            <div className="border-b border-white/10 bg-slate-950/30 px-4 py-3">
                              <div className="text-sm font-black text-white">{step.title}</div>
                              {"body" in step && step.body ? (
                                <div className="mt-1 text-sm leading-6 text-slate-300">{step.body}</div>
                              ) : null}
                            </div>
                            <div className="p-4">
                              <div className="mx-auto max-w-[320px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 sm:max-w-[360px]">
                                <Image
                                  src={step.imageSrc}
                                  alt={step.imageAlt}
                                  width={900}
                                  height={1600}
                                  className="h-auto w-full object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
