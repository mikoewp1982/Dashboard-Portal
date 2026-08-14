import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
} from "docx";
import * as fs from "node:fs";
import * as path from "node:path";

const outputDir = process.argv[2] || "D:\\Dashboard Portal\\web\\output";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "Roadmap_GAS_Siswa_1.0.38_compliance_gate_lokal.docx");

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

const today = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const children = [];

children.push(
  ...[
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 260 },
      children: [new TextRun({ text: "ROADMAP RILIS", bold: true, size: 32, color: "1F2937" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [new TextRun({ text: "GAS SISWA 1.0.38", bold: true, size: 40, color: "7F1D1D" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Perubahan EduLock Compliance Gate (Lokal + Diagnosa UI)", bold: true, size: 26, color: "1E3A8A" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 80 },
      children: [new TextRun({ text: "Tanggal dokumen: " + today, size: 22, color: "374151" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SMPN 3 Pacet - TA 2026/2027", size: 22, color: "374151" })],
    }),
  ]
);

children.push(new Paragraph({ pageBreakBefore: true, children: [] }));

children.push(h1("1. Latar Belakang"));
children.push(
  p(
    "Selama deployment lapangan khususnya pada perangkat Xiaomi / Redmi (misal Redmi 15C HyperOS / MIUI), ditemukan banyak false-positive dimana siswa sudah mengaktifkan EduLock Protection Accessibility dan Device Admin, namun GAS tetap menampilkan layar merah AKSES GAS DITAHAN."
  )
);
children.push(
  p("Akar masalah: gate compliance GAS semula sangat bergantung pada telemetry sync RTDB path active_devices dan evaluasi field lastProtectionCheckAt (stale > 15 menit). Vendor Xiaomi/Oppo/Vivo agresif kill background service EduLock sehingga health check RTDB tertunda/stale padahal status lokal di HP sebenarnya SEHAT.")
);
children.push(
  p("Solusi rilis ini: geser gate compliance menjadi LOKAL (cek Accessibility + Device Admin + package installed di HP) sebagai primer, RTDB hanya sebagai sumber informasi tambahan (admin NON_COMPLIANT/pause).")
);

children.push(h1("2. Target Versi & Artefak Build"));
children.push(numbered("GAS Siswa versionCode siswa flavor: 23034 → 23035 (monotonic +1)"));
children.push(numbered("GAS Siswa versionCode defaultConfig: 1050 → 1051"));
children.push(numbered("GAS Siswa versionName: 1.0.37 → 1.0.38, suffix -siswa → 1.0.38-siswa"));
children.push(numbered("Nama artefak APK distribusi: GAS-Siswa-release.apk + copy bernama GAS-Siswa-1.0.38-siswa-23035.apk"));

children.push(h1("3. Daftar File Kode Yang Diubah"));
children.push(h3("3.1 EduLockComplianceGate.kt (UTAMA)"));
children.push(
  p("Lokasi: native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt")
);
children.push(bullet("Tambah konstanta class target EduLock: AntiUninstallService (Accessibility) & DeviceAdminReceiver (Device Admin)."));
children.push(bullet("Tambah data class LocalHealthState (installed, accessibilityOn, deviceAdminOn) + method isHealthy() dan firstFailedReason()."));
children.push(bullet("Tambah enum EduLockQuickAction dan helper openEduLockAccessibilitySettings / openDeviceAdminSettings (Intent ACTION_ACCESSIBILITY_SETTINGS dan ACTION_ADD_DEVICE_ADMIN dengan EXTRA_DEVICE_ADMIN menunjuk component EduLock)."));
children.push(bullet("Tambah helper cek lokal isEduLockAccessibilityEnabled (baca Settings.Secure ENABLED_ACCESSIBILITY_SERVICES, match flattenToString/flattenToShort AntiUninstallService)."));
children.push(bullet("Tambah helper cek lokal isEduLockDeviceAdminActive (DevicePolicyManager.isAdminActive untuk DeviceAdminReceiver EduLock)."));
children.push(bullet("Tambah buildComplianceState() sebagai evaluasi TUNGGAL: gate primer = lokal (installed + a11y + admin). Remote telemetry hanya di-evaluate jika lokal SEHAT dan snapshot RTDB ada (strict=false → fail-open, tidak blokir karena stale/network)."));
children.push(bullet("Rewrite checkEduLockComplianceOnce dan rememberEduLockComplianceState memakai buildComplianceState() lokal gate primer, subscribe RTDB hanya supplement."));
children.push(bullet("Remove false-blocked berbasis STALE (lastProtectionCheckAt) dari evaluasi akhir remote; hanya NON_COMPLIANT dan ADMIN_DISABLED yang remote bisa blokir (karena dari admin)."));
children.push(bullet("Upgrade EduLockComplianceState tambah field localHealth (status 3 cek lokal ✅/❌) dan quickAction (rekomendasi tombol shortcut sesuai reason)."));
children.push(bullet("Upgrade composable EduLockComplianceOverlay tambah 2 callback onQuickAccessibility / onQuickDeviceAdmin, dan menampilkan: (a) tombol warna biru BUKA AKSESIBILITAS / BUKA ADMIN PERANGKAT sesuai reason utama, (b) badge status lokal Install/A11y/Admin, (c) dua tombol outlined Pengaturan Aksesibilitas dan Pengaturan Admin Perangkat untuk shortcut manual kapanpun, (d) tombol BUKA EDULOCK dan Keluar tetap ada."));

children.push(h3("3.2 Navigation.kt (sesi post-login)"));
children.push(
  p("Lokasi: native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt area EduLockComplianceOverlay")
);
children.push(bullet("Supply callback onQuickAccessibility = { openEduLockAccessibilitySettings(context) } dan onQuickDeviceAdmin = { openDeviceAdminSettings(context) } ke overlay agar tombol shortcut berfungsi di sesi siswa."));

children.push(h3("3.3 LoginScreen.kt (gate login Masuk)"));
children.push(
  p("Lokasi: native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt")
);
children.push(bullet("Supply callback shortcut yang sama ke EduLockComplianceOverlay di halaman login agar user yang masih di gate login bisa langsung menuju setting Accessibility/Device Admin tanpa keluar aplikasi."));

children.push(h1("4. Perilaku Setelah Perubahan"));
children.push(h3("4.1 Kasus Sukses (Install + A11y + Admin Lokal SEHAT)"));
children.push(bullet("Lokal sehat → GAS mengizinkan masuk. Tidak peduli telemetry RTDB stale atau belum ada sync, TIDAK lagi false-blocked."));
children.push(bullet("Subsripsi RTDB tetap berjalan untuk keperluan monitoring admin (field compliance, health, telemetry), tapi KEPUTUSAN BLOKIR tidak lagi ditentukan oleh stale/network. Hanya jika remote menyatakan compliance = NON_COMPLIANT atau admin_disable atau protection_active=false → tetap blokir (karena dari aturan admin)."));

children.push(h3("4.2 Kasus Accessibility OFF / Device Admin OFF / Belum Install"));
children.push(bullet("Lokal gate memblokir, reason sangat jelas (contoh: 'Aksesibilitas EduLock belum aktif. Aktifkan EduLock Protection di Pengaturan > Aksesibilitas')."));
children.push(bullet("Tombol shortcut warna BIRU muncul di overlay sesuai alasan, ditambah dua tombol outlined alternatif untuk manual ke setting kedua izin."));
children.push(bullet("Siswa tidak lagi perlu cari manual di Settings; cukup tap tombol langsung di layar merah GAS."));

children.push(h3("4.3 Dampak Keamanan"));
children.push(bullet("Tidak menurunkan level proteksi: EduLock Accessibility + Device Admin tetap WAJIB (gate primer lokal). Yang dihilangkan hanya ketergantungan ke RTDB sync yang rawan false-positive vendor agresif."));
children.push(bullet("Admin tetap bisa remotely nonaktifkan proteksi lewat RTDB protectionActive=false / compliance=NON_COMPLIANT karena evaluasi remote jalur kedua tetap berlaku (bukan dihapus)."));

children.push(h1("5. Checklist Pengujian (QA)"));
children.push(numbered("SKENARIO A — Uninstall EduLock → Buka GAS → Muncul 'Aplikasi EduLock belum terinstall' + tombol shortcut tidak tampil."));
children.push(numbered("SKENARIO B — EduLock terpasang tapi Accessibility OFF → Buka GAS → Muncul reason Aksesibilitas, tombol BIRU BUKA AKSESIBILITAS tampil. Tap tombol → benar membuka Settings.ACTION_ACCESSIBILITY_SETTINGS."));
children.push(numbered("SKENARIO C — Accessibility ON tapi Device Admin OFF → Reason Administrator Perangkat, tombol BIRU BUKA ADMIN PERANGKAT tampil. Tap → membuka Add Device Admin dengan component EduLock."));
children.push(numbered("SKENARIO D — Lokal ketiganya SEHAT → GAS langsung lolos meskipun RTDB belum ada record (field telemetry kosong) → TIDAK muncul overlay merah."));
children.push(numbered("SKENARIO E — Lokal sehat, RTDB remote menyatakan NON_COMPLIANCE → overlay muncul, reason Proteksi EduLock belum sehat (NON_COMPLIANT)."));
children.push(numbered("SKENARIO F — Login page gate: tombol Masuk men-trigger compliance, jika A11y/Admin lokal gagal, overlay di LoginScreen shortcut berfungsi."));
children.push(numbered("SKENARIO G — Redmi 15C real case test. EduLock Accessibility ON + Device Admin ON + AutoStart/NoRestriction di-set. Restart HP. Langsung buka GAS → tanpa menunggu sync internet, GAS LOLOS (ini yang paling krusial)."));
children.push(numbered("SKENARIO H — Overlay selalu menampilkan badge status lokal Install/A11y/Admin dengan simbol ✅/❌ agar petugas mudah mendiagnosa."));

children.push(h1("6. Prosedur Deploy"));
children.push(numbered("Update build.gradle.kts native-mobile-gas: defaultConfig versionCode 1050→1051, versionName 1.0.37→1.0.38; flavor siswa versionCode 23034→23035."));
children.push(numbered("Assemble siswaRelease, verifikasi output apk dan signature SHA256 signer sesuai master (64738955…1eb31f63)."));
children.push(numbered("Rename copy artefak ke GAS-Siswa-1.0.38-siswa-23035.apk di folder Apk Release/Final/."));
children.push(numbered("Jalankan sync-public-apk.ps1 (web/scripts/sync-public-apk.ps1) untuk copy ke web/public/apk dan tulis apk-manifest.json (versionCode 23035, versionName 1.0.38-siswa)."));
children.push(numbered("Build web production, commit deploy App Hosting agar halaman /gas/install menyuguhkan nama file download GAS-Siswa-1.0.38-siswa-23035.apk."));
children.push(numbered("Update BUILD_LOG.md, CHANGELOG.md, CHECKLIST_PERUBAHAN_APK_TERKINI.md di D:\\Dashboard Portal\\Apk Release\\Pegangan Build APK\\GAS\\."));
children.push(numbered("Sosialisasi ke petugas lapangan: siswa cukup ON-kan 3 hal (Install + Accessibility + Device Admin) → GAS pasti lolos, tidak perlu menunggu lama di EduLock menunggu telemetry sync."));

children.push(h1("7. Risiko & Rollback"));
children.push(bullet("Risiko: EduLock terdata NON_COMPLIANT di remote tapi lokal sehat → harus tetap blokir. Solusi: evaluasi remote NON_COMPLIANT tetap aktif dalam evaluasi akhir."));
children.push(bullet("Risiko: class name Accessibility Service atau Device Admin EduLock berubah di rilis EduLock berikutnya. Solusi: konstanta EDULOCK_ACCESSIBILITY_SERVICE_CLASS dan EDULOCK_DEVICE_ADMIN_CLASS terpusat di EduLockComplianceGate.kt, cukup edit satu tempat."));
children.push(bullet("Rollback: jika ada regresi, revert commit EduLockComplianceGate dan Navigation+LoginScreen overlay; build ulang 1.0.37. Semua perubahan terisolasi di 3 file (EduLockComplianceGate, Navigation, LoginScreen), minim risiko regresi lintas module."));

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "numbered-main",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT },
        ],
      },
    ],
  },
  styles: { default: { document: { run: { font: "Calibri" } } } },
  sections: [{ children }],
});

void (async () => {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buf);
  console.log(`[OK] ${outputPath} (${(buf.length / 1024).toFixed(1)} KB)`);
})();
