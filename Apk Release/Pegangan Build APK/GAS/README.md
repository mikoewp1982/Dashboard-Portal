# Pegangan Build APK GAS

Folder ini adalah pegangan operasional untuk semua perubahan APK `GAS` pada proyek `D:\Dashboard Portal`.

## Identitas Modul
- Source code: `D:\Dashboard Portal\native-mobile-gas`
- Gradle module: `:app`
- Root project name: `SatuPintuNativeMobile`
- Application ID dasar: `com.satupintu.mobile`
- Versi saat dokumen ini dirapikan:
  - `defaultConfig versionCode = 1039`
  - `defaultConfig versionName = 1.0.30`
  - `flavor siswa versionCode = 23022` (distribusi Final; pastikan `build.gradle.kts` selaras saat build siswa)
  - `flavor legacySiswa versionCode = 23003`

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
- Siswa: `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (`1.0.30-siswa` / `versionCode 23022`)
- Guru: `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk` (`1.0.30-guru` / `versionCode 1039`, rebuild 2026-08-03 ~14:30 + ikon `cb3bed4d`) — notifikasi literasi belum + pet mati (scope wali/diampu), badge Notifikasi, ikon Data Siswa/Rekapitulasi normal; tanpa FCM (tray saat app hidup). PWA Guru: `/guru` (9 menu parity; Web Push VAPID masih terbuka).

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
- Per 2026-08-02 sore, build final siswa terbaru di folder `Final` sudah `1.0.30-siswa (23022)`; jika file publik web belum ikut disinkronkan, anggap link unduh web masih tertinggal pada artefak lama.
- Skrip sinkronisasi web sekarang akan:
  - membaca metadata APK (`packageName`, `versionCode`, `versionName`)
  - menolak sinkronisasi jika `versionCode` GAS siswa turun
  - menolak sinkronisasi jika `versionCode` tetap sama tetapi isi APK berbeda
  - menolak sinkronisasi jika signature APK berbeda dari file publik sebelumnya
  - menulis metadata versi dan signer ke `web/public/apk/apk-manifest.json`

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
