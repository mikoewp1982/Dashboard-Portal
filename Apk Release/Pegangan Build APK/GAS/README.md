# Pegangan Build APK GAS

Folder ini adalah pegangan operasional untuk semua perubahan APK `GAS` pada proyek `D:\Dashboard Portal`.

## Identitas Modul
- Source code: `D:\Dashboard Portal\native-mobile-gas`
- Gradle module: `:app`
- Root project name: `SatuPintuNativeMobile`
- Application ID dasar: `com.satupintu.mobile`
- Versi distribusi terkini (update 2026-08-30):
  - `flavor siswa` → `versionName 1.0.92-siswa` / `versionCode 23089` (Final lokal terbaru; rebuild patch lock harian 7KAIH setelah penyempurnaan Virtual Pet. APK publik web masih hash build 14:53, tetapi source `/gas/install` sudah dirapikan lagi via commit `aef94fb1` agar metadata/fallback tetap konsisten)
  - `flavor guru` → `versionName 1.0.72-guru` / `versionCode 1064` (Final terbaru yang sudah dicatat di folder Final)
  - `flavor legacySiswa versionCode = 23003` (kompatibilitas; jangan turun di bawah ini)
  - Pastikan `native-mobile-gas/app/build.gradle.kts` selaras sebelum assemble

## Flavor Aktual

### Flavor utama yang aktif dipakai
| Flavor | App Name | Application ID | Output release default |
|---|---|---|---|
| `siswa` | GAS Siswa | `com.satupintu.mobile.siswa` | `app-siswa-release.apk` |
| `guru` | GAS Guru | `com.satupintu.mobile.guru` | `app-guru-release.apk` |
| `kepala` | GAS Kepala Sekolah | `com.satupintu.mobile.kepala` | `app-kepala-release.apk` |

### Flavor khusus / kompatibilitas
| Flavor | Catatan |
|---|---|
| `legacySiswa` | Mode kompatibilitas lama. Jangan build kecuali ada kebutuhan khusus. |
| `legacyGuru` | Mode kompatibilitas lama. Jangan build kecuali ada kebutuhan khusus. |
| `legacyKepala` | Mode kompatibilitas lama. Jangan build kecuali ada kebutuhan khusus. |
| `universal` | Build serbaguna untuk kebutuhan tertentu. Jangan dijadikan default release harian. |

## Source Set Aktual
Saat ini source set yang benar-benar ada:

```text
app/src/main
app/src/kepala
app/src/androidTest
app/src/test
```

Tidak ada `src/guru` dan `src/siswa` terpisah saat ini. Mayoritas logika berada di `src/main`, lalu perilaku dibedakan lewat `BuildConfig.FLAVOR`, role, route, dan conditional UI.

Detail aturan penempatan kode ada di [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dokumen yang Wajib Dipakai
- [ARCHITECTURE.md](./ARCHITECTURE.md): struktur source dan file berdampak tinggi
- [CONTRIBUTING.md](./CONTRIBUTING.md): aturan kerja saat mengubah APK
- [CHANGELOG.md](./CHANGELOG.md): riwayat perubahan perilaku/fitur
- [BUILD_LOG.md](./BUILD_LOG.md): log operasional setiap build/perubahan
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md): daftar cek fitur lama agar tidak tertinggal
- [RELEASE.md](./RELEASE.md): alur build release yang dipakai sekarang
- [CATATAN_MASALAH_UPDATE_APK_MANUAL.md](./CATATAN_MASALAH_UPDATE_APK_MANUAL.md): ringkasan masalah update manual APK siswa untuk bahan diskusi internal
- [RINGKASAN_MASALAH_UPDATE_APK_MANUAL.md](./RINGKASAN_MASALAH_UPDATE_APK_MANUAL.md): versi singkat yang siap dibagikan ke tim

## Output APK yang Dipakai Saat Ini
- Guru: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Siswa: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Kepala: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\kepala\release\app-kepala-release.apk`

## Folder Distribusi
Secara praktik saat ini, hasil final yang akan diuji user biasanya disalin ke:

```text
D:\Dashboard Portal\Apk Release\Final
```

Jika user meminta folder lain, catat di [BUILD_LOG.md](./BUILD_LOG.md).

Rilis final terbaru yang sudah dicatat saat ini:
- Siswa: `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` + `GAS-Siswa-1.0.92-siswa-23089.apk` (`1.0.92-siswa` / `versionCode 23089`, SHA256 `A936F12FACAE586CC2A13934BF066254262685FA10EA708819E81BF9F334A77A`) — rebuild final lokal terbaru 2026-08-30 16:03 untuk penyempurnaan lock harian `7KAIH`: minggu yang memuat hari ini tidak lagi terkunci penuh, sehingga siswa tetap bisa mengisi dan menyimpan laporan untuk hari berjalan sesuai konsep tugas harian. Catatan: APK publik web masih build `1.0.92-siswa (23089)` sesi 14:53, tetapi source `/gas/install` dan manifest sumber sudah dirapikan lagi lewat commit `aef94fb1` agar angka versi lama tidak tersisa.
- Guru: `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk` + `GAS-Guru-1.0.72-guru-1064.apk` (`1.0.72-guru` / `versionCode 1064`, SHA256 `06A775096952C592F6E00B43C420311165BE7189BABEF9609D2B5A4DD19A02E3`). Muatan final terkini: tab **Rekap Mingguan** tetap aktif, tetapi kontrak kolaborasi presensi kini berubah menjadi `final langsung` untuk wali kelas maupun sekretaris, dengan jalur finalisasi admin/guru hanya untuk data legacy yang masih pending. Lihat bagian **PERBEDAAN UI GAS SISWA vs GAS GURU** di bawah ini — WAJIB BACA sebelum ubah UI Home.

Status live web terbaru yang relevan dengan modul GAS:
- Web Admin `Rekap Kehadiran` live commit `089fe1da`: area admin GAS sekarang memiliki tab `Rekap Mingguan` dengan navigator minggu, dan sesi perubahan terbaru mengalihkan kontrak input `Sekretaris Kelas` menjadi final langsung sambil tetap menyisakan tombol finalisasi untuk data legacy `PENDING_TEACHER`.
- Web Admin `Rekap Kehadiran` live commit `c781bc8f`: admin sekolah sekarang bisa memverifikasi usulan presensi `Sekretaris Kelas` langsung dari dashboard saat wali kelas berhalangan.
- Portal Guru `/guru/presensi` live commit `089fe1da`: web guru tetap setara dengan APK GAS Guru terbaru untuk area presensi, termasuk tab **Rekap Mingguan**, badge audit sumber input, dan finalisasi legacy jika masih ada data lama yang `pending`.

---

# ⚠️⚠️⚠️ PERBEDAAN UI GAS SISWA vs GAS GURU (HARD CONSTRAINT — JANGAN SAMPAI KESALAHAN 4x TERULANG) ⚠️⚠️⚠️

> **Latar belakang kejadian 2026-08-28 build 1048→1049→1050**: Saya (Assistant) salah implementasi UI Home GAS GURU malah mencontek style 100% UI GAS SISWA (4 kolom kartu kecil + bottom nav 3 tab dengan tombol absen hitam floating). User komplain hebat karena UI asli guru sudah jelas beda dari screenshot HP lawas. **Mulai hari ini perbedaan di bawah ini WAJIB dijadikan acuan MUTLAK setiap kali akan mengubah file HomeScreen.kt atau komponen menu beranda.**

## TABEL PERBANDINGAN LENGKAP
| Area UI | GAS SISWA (flavor `siswa` + `kepala`) | GAS GURU (flavor `guru`) |
|---|---|---|
| **Implementasi di HomeScreen.kt** | `if (!isGuruFlavor)` → pakai `StudentFeatureCard` | `if (isGuruFlavor)` → pakai `GuruMenuCard` (composable TERSEPARATE) |
| **Background gradien** | Linear gradien horizontal gelap: `slate-900 (#0F172A) → indigo-800 (#1E3A8A)` | **Vertical gradien 5 stops MAKIN KE BAWAH MAKIN GELAP:** `teal-700 (#0E7490) → sky-600 (#0284C7) → blue-700 (#1D4ED8) → indigo-800 (#1E3A8A) → navy-blue-950 (#172554)` |
| **Judul section kartu menu** | **`MENU UTAMA`** (caps, kecil `labelLarge`) | **`Menu Guru`** (besar, `headlineSmall`, TIDAK caps) |
| **Grid kolom jumlah** | **4 kolom (GridCells.Fixed 4)** | **2 kolom (GridCells.Fixed 2) — KARTU LEBIH BESAR** |
| **Spacing kartu** | horizontal 12dp / vertikal 16dp | horizontal **14dp / vertikal 14dp** (lebih rapat agar layar terasa memuat lebih banyak kartu, tetap 2 kolom guru) |
| **Struktur tiap kartu menu** | **1 blok vertikal ringkas**: `kotak 64dp berisi icon 36dp + tulisan kecil label dibawah (polos, tanpa wadah pill shape)** | **2 BARIS JELAS, glassmorphism**: (1) ATAS: area icon persegi dalam rounded 20dp dalam outer rounded 26dp, tinggi kartu dipendekkan agar guru terasa melihat sekitar **3 baris** menu di layar, badge merah notifikasi digeser agak ke dalam. (2) BAWAH: **NAMA MENU didalam PILL SHAPE BIRU-MUDA TRANSLUSCENT (bukan text polos)**, text size lebih ringkas dari build 1050 agar kartu tidak tampak terlalu tinggi. |
| **Icon size** | `36.dp` di dalam box `64dp` | **68.dp** — tetap jelas lebih besar dari siswa, tetapi tidak sebesar build guru awal 1050 |
| **Outer rounded corner kartu** | tidak ada border luar / ringkas | **border tebal 1.2dp putih alpha 50%**, kartu terlihat jelas "muncul" 3D** |
| **Bottom Nav 3 tab (Beranda / Absen Float / Profil)** | ✅ **WAJIB ADA**. Termasuk **tombol hitam absen FLOAT TENGAH BESAR (offset -28dp). Ini ciri khas SISWA.** | ❌ **HARAM ADA — WAJIB NULL di `Scaffold.bottomBar = null`**. Guru **TIDAK PERLU shortcut absensi floating, karena guru tidak meng-absen diri lewat sini. |
| **Akses Profil & Logout** | Klik icon Profil di **Bottom Nav kanan** | HANYA lewat **ICON BUTTON KECIL 28.dp di POJOK KANAN ATAS HEADER**: `Icons.Default.ArrowForward` → `onLogout()`. (Tidak usah icon orang / Person duplikat, karena kiri sudah ada avatar.) |
| **Padding bawah dari Scaffold** | Bottom padding otomatis 56dp dari navbar | Tidak ada / 0. Kartu menu turun sampai area bawah dekat system navigation bar. |
| **Contoh versi acuan benar** | GAS Siswa `1.0.92-siswa (23089)` | GAS Guru **`1.0.72-guru (1064)`** build final 2026-08-30 |
| **Lokasi composable di HomeScreen.kt** | `StudentFeatureCard` (TIDAK DIUBAH tanpa persetujuan user!) | `GuruMenuCard` + `isGuruFlavor` branch di Scaffold, LazyVerticalGrid, dan screenBackground. |

## LANGKAH KONTROL SETIAP MAU UBAH UI HOME
1. Buka `HomeScreen.kt`.
2. **Cari 2 string `isGuruFlavor`**: Pastikan SEMUA percabangan UI (background, grid column count, nav bar, card composable call, top-right header buttons) **SUDAH di-wrap if/else dengan benar**.
3. **Commit kecil dulu sebelum build**: KALAU UBAH UI GURU → Cek JANGAN SAMPAI code path StudentFeatureCard / Bottom Nav 3 tab berubah.
4. **Build 2 flavor untuk cross-check sebelum ship** (wajib minimal `:app:assembleSiswaRelease` + `:app:assembleGuruRelease`) kalau perubahan ada di `src/main/java` bersama.
5. Setelah build sukses, **CEK DULU 3 hal sebelum copy ke Final**:
   - [ ] Apakah Bottom Nav 3 tab HILANG di flavor guru?
   - [ ] Apakah Background gradien flavor guru LEBIH TUA / navy?
   - [ ] Apakah Kartu Menu Guru 2 KOLOM & ada pill label transluscent?
6. **JALANKAN REGRESSION_CHECKLIST.md** bagian Home UI — GAS Guru dan GAS Siswa.

---

## Perintah Build yang Paling Sering Dipakai

```powershell
./gradlew :app:assembleSiswaRelease
./gradlew :app:assembleGuruRelease
./gradlew :app:assembleKepalaRelease
```

## Pengaman Distribusi GAS Siswa
- Untuk `GAS Siswa`, `versionCode` release harus selalu naik untuk package `com.satupintu.mobile.siswa`.
- Riwayat proyek ini sudah memakai jalur kompatibilitas `legacySiswa` dengan `versionCode 23003`, jadi release siswa reguler tidak boleh kembali ke angka di bawah itu.
- Sebelum APK dibagikan lewat portal/web, jalankan `npm run sync:apk:gas` dari folder `web`.
- Per 2026-08-30 14:53: **Public unduhan web lokal** = `1.0.92-siswa (23089)` hasil sinkron sesi cleanup rule `final langsung` sebelumnya. SHA public saat ini `D16CDD254843B121D850E3ED772A5A2E287A8DF7457321875B3DA515958A7F12`.
- Per 2026-08-30 16:03: **Final lokal terbaru** tetap `1.0.92-siswa (23089)`, tetapi hash final lokal kini berubah lagi menjadi `A936F12FACAE586CC2A13934BF066254262685FA10EA708819E81BF9F334A77A` karena membawa penyempurnaan lock harian `7KAIH`. Artinya, sebelum sinkronisasi web berikutnya, file `Final` dan `web/public/apk` **belum identik** walaupun nomor versi sama.
- Per 2026-08-30 malam: **source `/gas/install`** dan `src/data/apk-manifest.json` sudah dirapikan lagi via commit `aef94fb1` agar fallback/metadata tidak lagi menyimpan angka lama. User mengonfirmasi hasil unduh live GAS siswa sudah terbaca sebagai versi terbaru `1.0.92-siswa (23089)`.
- Skrip sinkronisasi web sekarang akan:
  - membaca metadata APK (`packageName`, `versionCode`, `versionName`)
  - menolak sinkronisasi jika `versionCode` GAS siswa turun
  - menolak sinkronisasi jika `versionCode` tetap sama tetapi isi APK berbeda
  - menolak sinkronisasi jika signature APK berbeda dari file publik sebelumnya
  - menulis metadata versi dan signer ke `web/public/apk/apk-manifest.json`

## Kontrak Presensi Sholat (APK vs web admin)

Jangan campur sumber. Audit 2026-08-27:

| Menu APK Siswa | Path yang benar | Status |
|----------------|-----------------|--------|
| Presensi Sholat (Dzuhur) — **Hari efektif** | `school_settings/{id}/attendance/schedules` (sama Presensi Sekolah). Libur = `isHoliday == true` saja; kunci hari yang tidak ada ≠ libur. | Diperbaiki di **1.0.82** (`PrayerScreen.kt`). Pet Dzuhur `isEffectiveDay` ikut path ini (`VirtualPetRepository`). |
| Presensi Sholat (Dzuhur) — **Tanggal merah** | `school_settings/{id}/attendance/holidays` | Sudah benar |
| Presensi Sholat (Dzuhur) — **Aturan sholat** | `school_settings/{id}/prayer_v2/types/DZUHUR` (`enabled` + `activeDays`) | Sudah benar |
| Presensi Dhuha & Jum'at — wajib hari ini | `prayer_v2/types` + `prayer_v2/schedules` (kelas + `dayOfWeek` JS 0–6 + jam) + `prayer_v2/overrides` (tanggal + kelas, tanpa jam) + `gas/schools/{id}/classes` | **Sudah selaras admin** (audit kode; tidak rebuild). Bukan dari Dzuhur / Presensi Sekolah. |
| Presensi Dhuha & Jum'at — baris **Jam** | Tampil **statis** dari jadwal kelas (sengaja, termasuk saat Tidak dijadwalkan). Tombol/status tetap mengikuti jadwal hari ini. | Dikonfirmasi user 2026-08-27 |

Lokasi musholla (radius) adalah gerbang terpisah: `school_settings/{id}/prayer/musholla_location`. Jarak siswa di luar radius memblokir submit meski hari efektif = Ya.

## Aturan Singkat
1. Setiap perubahan APK wajib tercatat di [BUILD_LOG.md](./BUILD_LOG.md).
2. Setiap perubahan perilaku/fitur wajib masuk [CHANGELOG.md](./CHANGELOG.md).
3. Sebelum build release, cek [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md).
4. Jangan pakai isi folder ini sebagai template umum lagi; isi file di sini harus selalu mencerminkan kondisi riil APK GAS.

## Catatan Aktif Lentera Digital
- Katalog `Lentera Digital` di APK GAS siswa harus selalu mengikuti kategori utama terbaru dari web e-perpus sekolah.
- Master kategori web terbaru per `2026-08-01` adalah:
  - `FIKSI & SASTRA`
  - `BUKU PELAJARAN`
  - `NON-FIKSI`
  - `ENSIKLOPEDIA`
  - `SAINS & TEKNOLOGI`
  - `PENGEMBANGAN DIRI`
  - `MINAT`
  - `MAJALAH`
  - `LAINNYA`
- Jika web menambah/mengubah kategori utama, dokumen di folder ini dan implementasi `GAS Siswa` harus ikut disinkronkan pada gelombang perubahan yang sama.
