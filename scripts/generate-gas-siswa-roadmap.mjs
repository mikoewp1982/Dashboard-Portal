import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  NumberFormat,
} from "docx";
import * as fs from "node:fs";
import * as path from "node:path";

const outputDir = process.argv[2] || "D:\\2026-2027\\Launching GAS";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, "Roadmap_Pengembangan_GAS_Siswa_TA_2026-2027.docx");

function titlePage() {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 300 },
      children: [
        new TextRun({
          text: "ROADMAP PENGEMBANGAN",
          bold: true,
          size: 36,
          color: "1E3A8A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "APLIKASI GAS SISWA",
          bold: true,
          size: 44,
          color: "1E3A8A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Tahun Ajaran 2026/2027",
          bold: true,
          size: 26,
          color: "1F2937",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: "Referensi Pengembangan Fitur Berikutnya",
          italics: true,
          size: 22,
          color: "374151",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000 },
      children: [
        new TextRun({
          text: `Tanggal cetak: ${today}`,
          size: 20,
          color: "6B7280",
        }),
      ],
    }),
  ];
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 30, color: "1E3A8A" })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: "1F2937" })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "111827" })],
  });
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        bold: !!opts.bold,
        italics: !!opts.italics,
        size: 22,
        color: opts.color || "111827",
      }),
    ],
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: "111827" })],
  });
}

function numberedItem(text, level = 0) {
  return new Paragraph({
    numbering: { level, reference: "numbered-main" },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, color: "111827" })],
  });
}

function tableHeader(names) {
  return names.map((n) => ({ n, header: true }));
}

async function main() {
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
    styles: {
      default: {
        document: {
          run: { font: "Calibri" },
        },
      },
    },
    sections: [
      {
        children: [
          ...titlePage(),
          new Paragraph({ pageBreakBefore: true, children: [] }),

          heading1("1. Latar Belakang"),
          paragraph(
            "Aplikasi GAS (Gerbang Aplikasi Sekolah) untuk siswa saat ini sudah memiliki fitur inti: login berbasis EduLock, presensi sholat, rekap kedisiplinan, menu literasi (perpustakaan digital), Virtual Pet (PET), serta integrasi binding device dan force update. Berdasarkan catatan operasional lapangan dan diskusi pengembangan, perlu disusun roadmap fitur berikutnya agar GAS Siswa lebih membantu kepatuhan siswa, lebih mudah dipahami, dan minim kendala khususnya di perangkat merk HP beragam."
          ),
          paragraph(
            "Dokumen ini berisi usulan fitur berikutnya, dikelompokkan berdasarkan skala prioritas (tinggi, menengah, rendah), plus ringkasan batch rilis dan checklist keamanan/regresi agar perubahan tidak merusak fitur lama."
          ),

          heading1("2. Versi dan Build Saat Ini (Baseline)"),
          bulletItem("GAS Siswa: versi 1.0.37-siswa (versionCode 23034)"),
          bulletItem("EduLock Siswa: versi 1.3.5 (versionCode 31)"),
          bulletItem("Web Admin GAS: commit b6e073f6 (Monitoring E-Library sudah mendukung penilaian per-item dan massal)"),
          bulletItem("Build acuan APK ada di folder: D:\\Dashboard Portal\\Apk Release\\Final"),
          bulletItem("Panduan teknis utama ada di: D:\\Dashboard Portal\\Apk Release\\Pegangan Build APK"),

          heading1("3. Prinsip Pengembangan"),
          numberedItem("Minim perubahan luas — fitur baru dipisahkan dari kode lama yang stabil, agar tidak menimbulkan regresi."),
          numberedItem("Flavor-specific tetap dipisah — logic khusus siswa berada di src/siswa, tidak campur dengan guru/kepsek."),
          numberedItem("Tidak mengubah kontrak field database RTDB yang sudah dipakai; penambahan field baru harus memiliki fallback untuk data lama."),
          numberedItem("UX responsif dan mobile-first — hindari elemen bertumpuk, status sistem harus selalu terlihat jelas."),
          numberedItem("Setiap perubahan fitur wajib disertai checklist pengujian agar batch build berikutnya mudah diverifikasi."),

          heading1("4. Fitur Usulan — Prioritas Tinggi"),
          paragraph(
            "Kategori ini sebaiknya dikerjakan dalam 1-2 batch rilis terdekat karena langsung membantu operasional sekolah dan mengurangi kendala lapangan.",
            { italics: true, color: "374151" }
          ),

          heading2("4.1 Halaman Diagnosa Perangkat (Device Health)"),
          bulletItem("Halaman khusus yang menampilkan status sistem secara ringkas untuk siswa dan petugas bantuan teknis:"),
          bulletItem("Status EduLock (terinstall / tidak, telemetry COMPLIANT / NON_COMPLIANT)", 1),
          bulletItem("Status Accessibility (aktif / tidak)", 1),
          bulletItem("Status Device Admin (aktif / tidak)", 1),
          bulletItem("Status Battery Optimization / Auto Start / Latar belakang (per vendor HP)", 1),
          bulletItem("Status binding device (gasDeviceId + edulockDeviceUuid + informasi fallback)", 1),
          bulletItem("Sertakan tombol 'Buka Pengaturan' per kategori untuk langsung mengarahkan siswa ke setting yang relevan."),
          bulletItem("Sertakan panduan khusus per merk HP umum: Xiaomi, Oppo/Realme, Vivo, Samsung, Infinix/Tecno."),
          bulletItem("Manfaat: petugas dan siswa tahu persis bagian mana yang bermasalah, tidak lagi menebak 'gagal terpasang / tidak bisa dipakai'."),

          heading2("4.2 Pusat Tugas Siswa (Student Task Hub)"),
          bulletItem("Satu halaman yang mengumpulkan semua tugas sekolah saat ini:"),
          bulletItem("Tugas literasi (E-Library) yang belum dikerjakan", 1),
          bulletItem("Jadwal Sholat + status presensi hari ini", 1),
          bulletItem("Catatan kedisiplinan yang perlu perhatian/tindak lanjut", 1),
          bulletItem("Izin sekolah (keluar, sakit, dll) yang masih aktif / pending", 1),
          bulletItem("Tugas atau pengumuman dari web admin bila nanti ditambahkan (placeholder)", 1),
          bulletItem("Filter berdasarkan hari ini / minggu ini / semua. Sertakan badge counter seperti '3 Tugas', '1 Belum Selesai'."),
          bulletItem("Manfaat: siswa tidak perlu berpindah-pindah menu untuk melihat semua kewajibannya hari ini."),

          heading2("4.3 Status Harian Sekolah (Daily Dashboard)"),
          bulletItem("Dashboard mini ringkasan saat app dibuka (bisa berada di HomeScreen sebagai panel atas):"),
          bulletItem("Presensi sholat hari ini (wajib / absen / terlambat)", 1),
          bulletItem("Target literasi / progress baca buku mingguan", 1),
          bulletItem("Status pelanggaran dan pembinaan hari ini (bila ada)", 1),
          bulletItem("Status Virtual Pet (sehat / butuh perhatian / mati)", 1),
          bulletItem("Status EduLock protection dan Accessibility (lampu indikator sehat / tidak)", 1),
          bulletItem("Manfaat: siswa langsung tahu yang paling penting tanpa harus masuk submenu."),

          heading1("5. Fitur Usulan — Kategori EduLock & Keamanan"),

          heading2("5.1 Notifikasi yang Lebih Pintar"),
          bulletItem("Tambahkan channel notifikasi terpisah agar siswa tidak melewatkan informasi penting:"),
          bulletItem("Tugas literasi baru dari admin", 1),
          bulletItem("Peringatan: force update tersedia + tombol download ke tutorial", 1),
          bulletItem("Izin sekolah hampir habis", 1),
          bulletItem("Virtual Pet hampir mati / butuh perhatian", 1),
          bulletItem("EduLock terdeteksi tidak sehat (Accessibility off, device admin off, stale > 15 menit)", 1),
          bulletItem("Manfaat: siswa jarang cek menu satu per satu, notifikasi push membantu mengingatkan."),

          heading2("5.2 Panduan Per-Merk HP di dalam APK"),
          bulletItem("Menyusun panduan dalam APK (bukan hanya web) untuk merk-merk HP yang sering bermasalah:"),
          bulletItem("Oppo / Realme: izin install sumber tidak dikenal, Aktifkan Accessibility, Auto Start, Matikan Hemat Baterai", 1),
          bulletItem("Vivo: menu iManager, Latar belakang putih, Auto Start", 1),
          bulletItem("Xiaomi: Security / Permission, Auto Start, Battery Saver", 1),
          bulletItem("Samsung: Device Care, Battery and Device Care, Optimize Apps", 1),
          bulletItem("Infinix / Tecno: XOS / HiOS protection, Auto Run, Background Popup", 1),
          bulletItem("Setiap langkah diberi tombol 'Buka Pengaturan' langsung bila Intent tersedia."),

          heading2("5.3 Peringatan Sebelum Terkunci"),
          bulletItem("Sebelum aplikasi mengunci akses (misal PET mati, EduLock tidak sehat, force update wajib), tampilkan dialog peringatan terlebih dahulu:"),
          bulletItem("Alasan jelas mengapa aplikasi akan dikunci", 1),
          bulletItem("Tindakan yang bisa dilakukan siswa", 1),
          bulletItem("Tombol aksi langsung ke halaman perbaikan (Diagnosa Perangkat / Tutorial Update)", 1),
          bulletItem("Hitung mundur singkat sebelum kunci benar-benar aktif (misal 10 detik) untuk memberi kesempatan terakhir.", 1),

          heading1("6. Fitur Usulan — Akademik dan Kedisiplinan"),

          heading2("6.1 Target Mingguan (Weekly Goals)"),
          bulletItem("Target yang bisa di-set admin sekolah atau wali kelas, siswa melihat progressnya di APK:"),
          bulletItem("Target jumlah halaman buku yang dibaca / jumlah laporan literasi", 1),
          bulletItem("Target presensi sholat wajib (100% dalam seminggu)", 1),
          bulletItem("Target tanpa pelanggaran disiplin", 1),
          bulletItem("Tampilkan progress bar, reward mini berupa pujian atau stiker Virtual Pet bila target tercapai.", 1),

          heading2("6.2 Progress / Capaian Siswa"),
          bulletItem("Tampilan visual capaian siswa secara sederhana, tidak rumit:"),
          bulletItem("Ringkasan mingguan: sholat, literasi, kedisiplinan", 1),
          bulletItem("Ringkasan bulanan: bar chart mini atau angka persentase", 1),
          bulletItem("Pencapaian terbaik: misal 'Minggu ini presensi Sholat 100%'", 1),
          bulletItem("Integrasi sederhana dengan Virtual Pet sebagai reward (bukan kompleks).", 1),

          heading2("6.3 Detail Pelanggaran dan Pembinaan"),
          bulletItem("Perbaikan menu Kedisiplinan — selain jumlah pelanggaran, siswa dapat melihat:"),
          bulletItem("Nama aturan yang dilanggar dan waktu kejadian", 1),
          bulletItem("Poin pembinaan yang harus diikuti (misal: konseling, tugas tambahan)", 1),
          bulletItem("Status tindak lanjut (belum / sedang / selesai)", 1),
          bulletItem("Catatan dari wali kelas atau guru BK (bila diizinkan ditampilkan)", 1),

          heading1("7. Fitur Usulan — UX dan Dukungan Perangkat"),

          heading2("7.1 Mode Ringan untuk HP Lemah"),
          bulletItem("Mode opsional yang bisa diaktifkan admin / otomatis jika RAM rendah:"),
          bulletItem("Kurangi animasi dan efek transisi", 1),
          bulletItem("Gambar di dashboard / menu dimuat lebih hemat memory", 1),
          bulletItem("Lazy load aktif untuk daftar riwayat", 1),
          bulletItem("Cache offline sederhana: data terakhir tetap tampil walau internet buruk", 1),

          heading2("7.2 Dashboard Lebih Personal"),
          bulletItem("Siswa langsung lihat halaman yang dia butuhkan saat app dibuka:"),
          bulletItem("Panel atas: Status EduLock + PET + Presensi Hari Ini", 1),
          bulletItem("Panel tengah: Tugas yang belum selesai + pengingat", 1),
          bulletItem("Panel bawah: Menu cepat ke fitur utama (Presensi, Literasi, Disiplin, Diagnosa)", 1),
          bulletItem("Urutan menu bisa diatur berdasarkan role atau preferensi admin sekolah (placeholder).", 1),

          heading2("7.3 Offline Cache Terbatas"),
          bulletItem("Cache read-only data yang paling sering dibaca:"),
          bulletItem("Jadwal sholat hari ini dan config prayer_v2", 1),
          bulletItem("Tugas literasi aktif dan target mingguan", 1),
          bulletItem("Identitas siswa, kelas, binding status", 1),
          bulletItem("Data hanya sync ulang jika koneksi internet pulih; user diberi indikator 'Offline' / 'Online'.", 1),

          heading1("8. Rekomendasi 3 Fitur Prioritas Batch Berikutnya"),
          paragraph(
            "Untuk batch rilis GAS Siswa berikutnya, disarankan memilih 3 paket yang paling besar dampaknya dan paling minim risiko:",
            { italics: true, color: "374151" }
          ),
          numberedItem("Halaman Diagnosa Perangkat — paling langsung mengurangi kendala install / onboarding EduLock di berbagai merk HP."),
          numberedItem("Pusat Tugas Siswa — menyederhanakan alur siswa melihat semua kewajibannya dalam 1 halaman."),
          numberedItem("Status Harian Sekolah (Daily Dashboard) — membuat informasi penting terlihat di awal tanpa masuk submenu."),

          heading1("9. Usulan Pembagian Batch Rilis"),

          heading2("Batch 1 (Rekomendasi: 1.0.38-siswa)"),
          bulletItem("Halaman Diagnosa Perangkat"),
          bulletItem("Panduan per-merk HP di dalam APK"),
          bulletItem("Peringatan Sebelum Terkunci (PET mati / EduLock tidak sehat / force update)"),
          bulletItem("Target batch: mengurangi kendala teknis install dan blokir perangkat."),

          heading2("Batch 2 (Rekomendasi: 1.0.39-siswa)"),
          bulletItem("Pusat Tugas Siswa (Student Task Hub)"),
          bulletItem("Detail Pelanggaran dan Pembinaan (enhancement menu Kedisiplinan)"),
          bulletItem("Notifikasi yang lebih pintar (tugas baru, PET, EduLock tidak sehat, force update)"),
          bulletItem("Target batch: memudahkan siswa memantau semua tugas dan tindak lanjutnya."),

          heading2("Batch 3 (Rekomendasi: 1.0.40-siswa)"),
          bulletItem("Status Harian Sekolah (Daily Dashboard mini)"),
          bulletItem("Target Mingguan + Progress / Capaian Siswa"),
          bulletItem("Mode Ringan dan Offline cache terbatas"),
          bulletItem("Dashboard lebih personal + urutan menu cepat"),
          bulletItem("Target batch: UX lebih nyaman dan support HP lama lebih baik."),

          heading1("10. Checklist Pengujian Sebelum Setiap Build Rilis"),

          heading2("10.1 Regresi Fitur Inti"),
          bulletItem("[ ] Login siswa + binding device tetap berhasil (EduLock sehat -> lolos, EduLock tidak terpasang -> ditahan)."),
          bulletItem("[ ] Force Update tetap memblokir akses aplikasi dan tombol download ke tutorial GAS /gas/install berfungsi."),
          bulletItem("[ ] PET lock tetap aktif: jika isDeadByRule() true, overlay kunci muncul dan menutup akses."),
          bulletItem("[ ] Presensi Sholat Dzuhur, Dhuha, Jum'at tetap aktif di window yang ditentukan web admin."),
          bulletItem("[ ] Menu Literasi: laporan pending tetap bisa dikirim, tab Perlu Dinilai tetap tampil dari web admin (jika diakses guru/admin), atau tampilan tugas di APK siswa tetap sinkron."),
          bulletItem("[ ] Menu Kedisiplinan: card Pelanggaran full-width, Prestasi tetap dihapus sesuai keputusan sebelumnya."),

          heading2("10.2 Pengujian Baru per Fitur (Contoh untuk Batch 1)"),
          bulletItem("[ ] Diagnosa Perangkat terbuka dari Home menu, status Accessibility / Device Admin / EduLock terlihat benar."),
          bulletItem("[ ] Panduan per merk HP tersedia untuk Oppo, Vivo, Xiaomi, Samsung, Infinix."),
          bulletItem("[ ] Tombol Buka Pengaturan di Diagnosa Perangkat benar-benar mengarah ke sistem yang relevan."),
          bulletItem("[ ] Peringatan sebelum terkunci muncul lebih dulu 10 detik sebelum PET / force update benar-benar mengunci."),

          heading2("10.3 Checklist Keamanan dan Database"),
          bulletItem("[ ] Semua field database baru diberi fallback untuk data historis (tidak menyebabkan crash di build lama)."),
          bulletItem("[ ] Write RTDB hanya menulis field yang memang relevan untuk role siswa; tidak menimpa field guru/kepsek."),
          bulletItem("[ ] Binding GAS tetap menulis ke gasDeviceId; EduLock tetap menulis ke edulockDeviceUuid (tidak saling timpa)."),
          bulletItem("[ ] Logs error di build tidak bertambah dibanding baseline; hanya warning deprecasi lama yang masih dibiarkan."),

          heading1("11. Lampiran: Lokasi File Referensi"),
          bulletItem("Source code GAS Siswa: D:\\Dashboard Portal\\native-mobile-gas"),
          bulletItem("Source code EduLock Siswa: D:\\Dashboard Portal\\native-mobile-edulock"),
          bulletItem("Source code Web Admin: D:\\Dashboard Portal\\web"),
          bulletItem("Artefak APK Rilis Final: D:\\Dashboard Portal\\Apk Release\\Final"),
          bulletItem("Pegangan Build APK + Aturan Wajib AI: D:\\Dashboard Portal\\Apk Release\\Pegangan Build APK"),
          bulletItem("Panduan Tutorial GAS Siswa (live URL): /gas/install"),
          bulletItem("Panduan Tutorial EduLock Siswa (live URL): /edulock/install"),

          heading1("12. Catatan Akhir"),
          paragraph(
            "Roadmap ini adalah dokumen hidup (living document). Jika ditemukan kendala lapangan baru atau kebutuhan admin berubah, urutan batch dan detail fitur bisa disesuaikan tanpa mengubah prinsip pengembangan (minim perubahan luas, pemisahan flavor, dan backward compatibility field database). Seluruh usulan batch di atas sebaiknya selalu dicatat kembali di BUILD_LOG.md + CHANGELOG.md + CHECKLIST_PERUBAHAN_APK_TERKINI.md di folder pegangan sebelum build APK dijalankan."
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  // eslint-disable-next-line no-console
  console.log(`[OK] Dokumen Word tersimpan di: ${outputPath}`);
  // eslint-disable-next-line no-console
  console.log(`[OK] Ukuran file: ${(buffer.length / 1024).toFixed(1)} KB`);
}

void main();
