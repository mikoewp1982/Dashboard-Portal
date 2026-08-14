import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  NumberFormat,
  PageBreak,
} from "docx";
import * as fs from "node:fs";
import * as path from "node:path";

const outputDir = process.argv[2] || "D:\\Dashboard Portal\\web\\output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, "Troubleshooting_Instalansi_EduLock_dan_GAS_Siswa_Per_Merk_HP.docx");

function titlePage() {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 260 },
      children: [new TextRun({ text: "TROUBLESHOOTING", bold: true, size: 34, color: "7F1D1D" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [new TextRun({ text: "INSTALANSI EDULOCK & GAS SISWA", bold: true, size: 38, color: "7F1D1D" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "BERDASARKAN MERK HP", bold: true, size: 30, color: "1F2937" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 80 },
      children: [new TextRun({ text: "Pegangan Petugas Lapangan / Wali Kelas / Guru BK", italics: true, size: 22, color: "374151" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SMPN 3 Pacet - Tahun Ajaran 2026/2027", size: 22, color: "374151" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400 },
      children: [new TextRun({ text: `Tanggal cetak: ${today}`, size: 20, color: "6B7280" })],
    }),
  ];
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 30, color: "7F1D1D" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: "1E3A8A" })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "111827" })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        bold: !!opts.bold,
        italics: !!opts.italics,
        underline: !!opts.underline ? {} : undefined,
        size: 22,
        color: opts.color || "111827",
      }),
    ],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: "111827" })],
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { level, reference: "numbered-main" },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: "111827" })],
  });
}

function brandSection({ brand, colors, subBrand, accessibilitySteps, deviceAdminSteps, extraSteps, redmiNotes }) {
  const steps = [
    h2(`${brand} (${subBrand || ""})`),
    h3("1. Aktifkan Accessibility EduLock"),
  ];
  accessibilitySteps.forEach((s) => steps.push(numbered(s)));
  steps.push(h3("2. Aktifkan Device Admin / Admin Perangkat"));
  deviceAdminSteps.forEach((s) => steps.push(numbered(s)));
  steps.push(h3("3. Autostart + Battery (WAJIB - Paling Sering Gagal)"));
  extraSteps.forEach((s) => steps.push(numbered(s)));
  if (redmiNotes && redmiNotes.length > 0) {
    steps.push(h3("4. Catatan Penting Khusus Merk Ini"));
    redmiNotes.forEach((s) => steps.push(bullet(s)));
  }
  return steps;
}

async function main() {
  const children = [];

  // Halaman judul
  children.push(...titlePage());
  children.push(new Paragraph({ pageBreakBefore: true, children: [] }));

  // Bagian 1 - Umum
  children.push(h1("Daftar Isi Singkat"));
  numbered("Alur diagnosis umum 5 menit (semua merk)").forEach;
  children.push(numbered("Alur Diagnosis Umum 5 Menit (Semua Merk)"));
  children.push(numbered("Xiaomi / Redmi / POCO (MIUI / HyperOS) - Contoh kasus: Redmi 15C"));
  children.push(numbered("Oppo / Realme (ColorOS)"));
  children.push(numbered("Vivo / iQOO (FunTouch / Origin OS)"));
  children.push(numbered("Samsung (One UI)"));
  children.push(numbered("Infinix / Tecno / Itel (XOS / HiOS / UOS)"));
  children.push(numbered("Checklist Akhir: Pastikan GAS Bisa Dibuka"));
  children.push(numbered("Lampiran: Lokasi APK Final dan URL Tutorial"));

  children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  children.push(h1("1. Alur Diagnosis Umum 5 Menit (Semua Merk)"));
  children.push(p("Jika siswa sudah menekan tombol BUKA APK GAS SISWA dari EduLock tapi GAS menampilkan AKSES GAS DITAHAN (Proteksi EduLock belum aktif), jalankan langkah ini dulu sebelum masuk setting per merk:"));
  children.push(numbered("Pastikan kedua app (EduLock + GAS) sudah di-FORCE STOP: Setelan → Aplikasi → EduLock → Paksa berhenti → OK. Ulangi untuk GAS."));
  children.push(numbered("Bersihkan cache kedua app. Cache yang lama bikin status proteksi tidak sinkron."));
  children.push(numbered("HIDUPKAN ULANG HP (restart). Langkah ini wajib untuk Xiaomi/Oppo/Vivo karena vendor suka kill service di background."));
  children.push(numbered("Setelah HP nyala kembali: JANGAN buka app lain. Langsung buka EduLock, login siswa, tunggu 15-30 detik sampai status Monitoring semua hijau."));
  children.push(numbered("Baru tekan tombol BUKA APK GAS SISWA dari dalam EduLock. Jangan buka GAS dari launcher terlebih dahulu."));
  children.push(numbered("Jika masih ditahan: lihat indikator di EduLock MainScreen → pastikan Accessibility dan Device Admin tidak muncul pesan warning merah. Bila masih merah, lanjut ke langkah setting per merk di bawah."));

  children.push(h1("2. Xiaomi / Redmi / POCO (MIUI / HyperOS)"));
  children.push(p("Contoh kasus: Redmi 15C. Xiaomi termasuk yang paling ketat membunuh background service EduLock. WAJIB setting 3 izin (Accessibility + Device Admin + Autostart/No Battery Restriction).", { italics: true, color: "374151" }));
  children.push(...brandSection({
    brand: "Xiaomi / Redmi / POCO",
    subBrand: "MIUI / HyperOS",
    accessibilitySteps: [
      "Buka aplikasi SECURITY (ikon perisai hijau bawaan Xiaomi), JANGAN lewat Intent dari EduLock langsung (Xiaomi sering menolak silent).",
      "Gulir ke bawah → pilih menu Aksesibilitas (Accessibility).",
      "Pilih Layanan terinstal / Installed services.",
      "Cari dan pilih EduLock Protection → aktifkan toggle HIJAU / ON.",
      "MIUI akan menampilkan peringatan risiko → centang 'Saya menyadari risiko ini' lalu tap IZINKAN / Allow.",
      "PENTING: keluar sejenak lalu masuk kembali ke halaman Accessibility → pastikan toggle EduLock benar-benar tetap ON (tidak mati sendiri).",
    ],
    deviceAdminSteps: [
      "Buka Setelan → Privasi & Keamanan → Keamanan.",
      "Pilih Aplikasi admin perangkat / Device admin apps.",
      "Pilih EduLock Protection → tap AKTIFKAN / Activate this device admin app.",
      "Konfirmasi Aktifkan administrator perangkat di popup konfirmasi.",
    ],
    extraSteps: [
      "Setelan → Aplikasi → Kelola aplikasi → cari EduLock.",
      "AUTO START → aktifkan toggle ON (wajib, tanpa ini Xiaomi kill service setelah layar mati).",
      "Penghemat baterai / Battery saver → pilih TIDAK ADA BATASAN / No restrictions. JANGAN pilih Batasi atau Hemat baterai.",
      "Izin lain / Other permissions → IZINKAN semua: Tampil jendela mengambang, Jalankan di latar belakang, Mulai otomatis, Modifikasi setelan sistem (jika diminta).",
      "Ulangi 3 setting (Autostart, No restrictions battery, Other permissions) JUGA untuk APK GAS Siswa.",
      "Recent Apps → tahan icon EduLock → tap ikon Gembok (Lock). Lock juga untuk APK GAS Siswa. Ini mencegah Xiaomi bersih-bersih background.",
    ],
    redmiNotes: [
      "Redmi 15C: kadang Accessibility toggle yang ON dari app EduLock tidak benar-benar aktif. Selalu verifikasi ulang lewat Security app bawaan.",
      "Jika HP baru pertama kali setting, kadang Xiaomi menunda 1-2 menit sebelum benar-benar mengizinkan service accessibility berjalan. Tunggu minimal 30 detik setelah toggle ON.",
      "HyperOS: kadang ada menu Power Genie / Pengelola Daya → pastikan EduLock dan GAS masuk daftar pengecualian / Tidak dibatasi.",
    ],
  }));

  children.push(h1("3. Oppo / Realme (ColorOS)"));
  children.push(p("ColorOS sangat agresif memblokir install APK dari luar Play Store, dan sering mematikan accessibility otomatis.", { italics: true, color: "374151" }));
  children.push(...brandSection({
    brand: "Oppo / Realme",
    subBrand: "ColorOS",
    accessibilitySteps: [
      "Buka Setelan → Sandi & Keamanan.",
      "Pilih Aksesibilitas → Installed Services / Layanan terinstal.",
      "Pilih EduLock Protection → aktifkan toggle ON.",
      "Oppo sering muncul peringatan keamanan → pilih Tetap izinkan / Allow anyway (pilih 'Jangan tanyakan lagi' bila ada).",
    ],
    deviceAdminSteps: [
      "Setelan → Sandi & Keamanan → Privasi & Keamanan lainnya.",
      "Pilih Aplikasi admin perangkat → EduLock Protection → Aktifkan.",
    ],
    extraSteps: [
      "Setelan → Manajemen Aplikasi / App management → Daftar aplikasi → EduLock.",
      "Penggunaan Baterai / Battery usage → matikan Optimalkan penggunaan baterai untuk EduLock → pilih Izinkan berjalan di latar belakang (Allow background activity).",
      "Auto Start / Mulai otomatis → aktifkan ON untuk EduLock dan GAS Siswa.",
      "Luncurkan Otomatis / Auto-launch → ON untuk kedua app.",
      "Tampil pop-up latar belakang → IZINKAN (ini penyebab umum service mati diam-diam di ColorOS).",
    ],
    redmiNotes: [
      "Bila install APK langsung gagal (Apl tidak terpasang), pastikan Install Unknown Apps aktif: Setelan → Sandi & Keamanan → Install apps from unknown sources → File Manager / Chrome → ON.",
      "Jangan pernah install APK dari tombol share WhatsApp langsung; pindahkan dulu ke folder Download / Internal storage, lalu install dari File Manager.",
    ],
  }));

  children.push(h1("4. Vivo / iQOO (FunTouch / Origin OS)"));
  children.push(...brandSection({
    brand: "Vivo / iQOO",
    subBrand: "FunTouch / Origin OS",
    accessibilitySteps: [
      "Setelan → Pintasan & Aksesibilitas → Aksesibilitas.",
      "Installed Services / Layanan terinstal → EduLock Protection → ON toggle.",
      "Konfirmasi peringatan risiko → IZINKAN.",
    ],
    deviceAdminSteps: [
      "Setelan → Keamanan & Privasi → Keamanan.",
      "Opsi keamanan lainnya / More security settings → Aplikasi admin perangkat → EduLock Protection → Aktifkan.",
    ],
    extraSteps: [
      "Setelan → Aplikasi & izin → Daftar aplikasi → EduLock.",
      "Izin → Pastikan semua izin dasar (Storage, Lokasi, Notifikasi) diizinkan.",
      "Pengelola Daya / Power management → Matikan Optimalkan baterai untuk EduLock → pilih Tidak ada batasan.",
      "Autostart / Mulai otomatis → EduLock + GAS diaktifkan ON.",
      "Latar belakang pop-up / Background popup → IZINKAN kedua app.",
    ],
    redmiNotes: [
      "Vivo kadang me-reset accessibility setelah reboot pertama. Setelah restart HP, verifikasi ulang toggle Accessibility tetap ON.",
      "Jika Vivo menampilkan dialog 'Izin aplikasi berbahaya' → selalu pilih Tetap izinkan dan beri tanda jangan tanyakan lagi.",
    ],
  }));

  children.push(h1("5. Samsung (One UI)"));
  children.push(...brandSection({
    brand: "Samsung",
    subBrand: "One UI",
    accessibilitySteps: [
      "Setelan → Aksesibilitas.",
      "Aplikasi dan layanan terinstal / Installed apps and services → EduLock Protection.",
      "Aktifkan Hidupkan / Turn On toggle → konfirmasi Izinkan / Allow.",
    ],
    deviceAdminSteps: [
      "Setelan → Keamanan dan Privasi → Keamanan lainnya / Other security settings.",
      "Aplikasi admin perangkat / Device admin apps → EduLock Protection → Aktifkan.",
    ],
    extraSteps: [
      "Setelan → Aplikasi → Pilih EduLock → Baterai → Batas latar belakang → pilih Tidak dibatasi / Unrestricted.",
      "Aplikasi yang tidak pernah di-sleep → Pastikan EduLock dan GAS masuk ke daftar ini.",
      "Device Care → Battery and device care → Battery → Background usage limits → Never sleeping apps → tambahkan EduLock dan GAS.",
    ],
    redmiNotes: [
      "Samsung biasanya relatif lebih stabil, namun knox / Play Protect kadang memberi peringatan install dari sumber tidak dikenal → tap Install anyway / Tetap install.",
    ],
  }));

  children.push(h1("6. Infinix / Tecno / Itel (XOS / HiOS / UOS)"));
  children.push(...brandSection({
    brand: "Infinix / Tecno / Itel",
    subBrand: "XOS / HiOS / UOS",
    accessibilitySteps: [
      "Setelan (Settings) → Sistem → Aksesibilitas.",
      "Installed Services / Layanan terinstal → EduLock Protection → ON.",
      "Konfirmasi peringatan risiko → IZINKAN / Allow.",
    ],
    deviceAdminSteps: [
      "Setelan → Keamanan / Security → Opsi keamanan lainnya.",
      "Aplikasi admin perangkat → EduLock Protection → Aktifkan.",
    ],
    extraSteps: [
      "Setelan → Aplikasi & Notifikasi → Lihat semua aplikasi → EduLock.",
      "Baterai → Matikan pengoptimalan baterai untuk EduLock → Izinkan aktivitas latar belakang.",
      "Auto Start / PowerGenie / Smart power saver → tambahkan EduLock dan GAS ke daftar pengecualian.",
      "Izin Lainnya: Popup, Background run, Auto-launch → SEMUA diizinkan untuk EduLock dan GAS.",
    ],
    redmiNotes: [
      "XOS/HiOS biasanya punya menu Booster / Smart Clean → pastikan EduLock/GAS DILINDUNGI (protected) agar tidak di-bersihkan saat boost.",
    ],
  }));

  children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
  children.push(h1("7. Checklist Akhir: Pastikan GAS Bisa Dibuka"));
  children.push(numbered("Accessibility EduLock = ON (toggle tetap biru/hijau, tidak kembali mati)."));
  children.push(numbered("Device Admin EduLock = Aktif."));
  children.push(numbered("Auto Start = ON untuk EduLock & GAS."));
  children.push(numbered("Baterai / Battery saver = TIDAK ADA BATASAN untuk EduLock & GAS."));
  children.push(numbered("Background popup / Background activity = DIIZINKAN."));
  children.push(numbered("Restart HP 1x."));
  children.push(numbered("Buka EduLock terlebih dahulu, login, tunggu 15-30 detik sampai Monitoring hijau semua."));
  children.push(numbered("Tekan tombol BUKA APK GAS SISWA dari dalam EduLock (bukan dari launcher)."));
  children.push(numbered("Jika masih merah, bersihkan data EduLock & GAS → ulangi dari langkah 1 merk masing-masing."));

  children.push(h1("8. Lampiran"));
  children.push(h3("8.1 Lokasi File APK Final Master"));
  children.push(bullet("GAS Siswa: D:\\Dashboard Portal\\Apk Release\\Final\\GAS-Siswa-release.apk (atau file bernomor versi GAS-Siswa-1.0.37-siswa-23034.apk)."));
  children.push(bullet("EduLock Siswa: D:\\Dashboard Portal\\Apk Release\\Final\\EduLock-studentRelease.apk (atau bernomor versi EduLock-1.3.5-31.apk)."));
  children.push(h3("8.2 URL Tutorial Live (Install dari Browser)"));
  children.push(bullet("Tutorial GAS Siswa: https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/gas/install"));
  children.push(bullet("Tutorial EduLock Siswa: https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install"));
  children.push(h3("8.3 Catatan untuk Admin Sekolah"));
  children.push(bullet("Jika siswa sudah lolos checklist 7 langkah di atas tapi GAS masih menahan → kemungkinan telemetry `lastProtectionCheckAt` stale (> 15 menit). Buka EduLock, tunggu 2-3 menit dengan koneksi internet aktif, ulangi tombol buka GAS."));
  children.push(bullet("Jika masih gagal → catat merk HP, tipe, Android version, screenshot EduLock Home dan screenshot GAS Merah → hubungi tim teknis untuk audit binding device (gasDeviceId vs edulockDeviceUuid) di Web Admin."));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "numbered-main",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT },
            { level: 1, format: NumberFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT },
          ],
        },
      ],
    },
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  // eslint-disable-next-line no-console
  console.log(`[OK] Word troubleshooting tersimpan di: ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(`[OK] Ukuran file: ${(buffer.length / 1024).toFixed(1)} KB`);
}
void main();
