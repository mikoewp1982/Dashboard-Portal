# Release Process GAS

Dokumen ini adalah alur build release APK `GAS` yang sesuai kondisi proyek saat ini.

## 1. Tentukan Flavor yang Benar
Jangan build semua flavor kalau yang berubah hanya satu area kecil.

### Flavor utama harian
- `siswa`
- `guru`
- `kepala`

### Flavor khusus
- `legacySiswa`
- `legacyGuru`
- `legacyKepala`
- `universal`

Flavor khusus hanya dibuild jika ada permintaan eksplisit.

## 2. Sebelum Build Release
- [ ] Update atau buat entry di [BUILD_LOG.md](./BUILD_LOG.md)
- [ ] Pastikan file terdampak dan flavor terdampak sudah ditulis
- [ ] Update [CHANGELOG.md](./CHANGELOG.md) jika ada perubahan perilaku/fitur
- [ ] Tentukan item yang harus dicek dari [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)
- [ ] Untuk `GAS Siswa`, pastikan `versionCode` baru selalu lebih besar dari seluruh build distribusi sebelumnya untuk `com.satupintu.mobile.siswa` (termasuk jalur kompatibilitas `legacySiswa`)
- [ ] Untuk distribusi web, jalankan `npm run sync:apk:gas` dari folder `web`; skrip ini sekarang akan memblokir sinkronisasi jika `versionCode` GAS siswa turun, tetap sama tetapi isi APK berubah, atau signature berbeda dari file publik sebelumnya

## 3. Perintah Build Release

### GAS Siswa
```powershell
./gradlew :app:assembleSiswaRelease
```

### GAS Guru
```powershell
./gradlew :app:assembleGuruRelease
```

### GAS Kepala
```powershell
./gradlew :app:assembleKepalaRelease
```

## 4. Lokasi Output Default
- `app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- `app/build/outputs/apk/guru/release/app-guru-release.apk`
- `app/build/outputs/apk/kepala/release/app-kepala-release.apk`

## 5. Penamaan File Distribusi
Jika APK akan dibagikan ke user, salin ke folder distribusi dengan nama yang jelas, misalnya:

```text
GAS-Siswa-YYYY-MM-DD_HH-mm-release.apk
GAS-Guru-YYYY-MM-DD_HH-mm-release.apk
GAS-Kepala-YYYY-MM-DD_HH-mm-release.apk
```

Folder distribusi yang umum dipakai:

```text
D:\Dashboard Portal\Apk Release\Final
```

## 6. Sesudah Build
- [ ] Catat hasil sukses/gagal di `BUILD_LOG.md`
- [ ] Catat lokasi output asli
- [ ] Catat lokasi file hasil copy
- [ ] Catat flavor yang diuji
- [ ] Catat apa yang belum diuji, jika ada
- [ ] Jika APK akan dibagikan lewat portal/web, verifikasi bahwa `web/public/apk/GAS-Siswa-release.apk` dan file di `Apk Release/Final` punya hash yang sama sesudah sinkronisasi

## 7. Aturan Kejujuran Status
- Compile sukses ≠ fitur aman
- Build sukses ≠ regresi aman
- Jika hanya `siswa` yang dibuild, jangan tulis seolah `guru`/`kepala` ikut diverifikasi

## 8. Rekomendasi Praktis
Jika menyentuh area berikut, minimal compile 3 flavor utama:
- `Navigation.kt`
- `LoginScreen.kt`
- repository / viewmodel bersama
- screen di `src/main` yang dipakai lintas role

## 9. Catatan Versi
Versi dasar saat dokumen ini dirapikan:
- `defaultConfig versionCode = 1039`
- `defaultConfig versionName = 1.0.30`
- `flavor siswa versionCode = 23022` (working/distribusi Final; cek `build.gradle.kts` saat build siswa)
- `flavor legacySiswa versionCode = 23003`

## 10. Catatan Distribusi Aman GAS Siswa
- `GAS Siswa` memakai `applicationId` `com.satupintu.mobile.siswa`.
- Jalur `legacySiswa` pernah memakai `versionCode 23003` untuk package yang sama.
- Karena itu, semua release `siswa` berikutnya wajib menjaga `versionCode` tetap monoton naik di atas riwayat distribusi package yang sama.
- Build final siswa terbaru yang sudah dicatat saat ini adalah `1.0.80-siswa (23077)` di folder `D:\Dashboard Portal\Apk Release\Final` — URL unduhan web sudah `1.0.80-siswa` / `23077` (`/apk/GAS-Siswa-1.0.80-siswa-23077.apk`).

## 11. Catatan Distribusi GAS Guru
- Build acuan terbaru: `1.0.30-guru (versionCode 1039)` — rebuild sore 2026-08-03 (~14:30) menyertakan fix ikon `cb3bed4d` di atas fitur notifikasi `ebfeb7b8`.
- File Final tunggal: `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk` (hindari salinan bertanggal ganda di Final).
- Salinan kerja: `Apk Release/GAS/app-guru-release.apk`.
- Fitur notifikasi 2026-08-03: `LITERACY_INCOMPLETE` + `PET_DEAD` untuk siswa wali/diampu; aduan/literasi pending lama tetap ada; badge di menu Notifikasi; belum FCM (tray hanya saat app hidup).
- Portal PWA Guru live: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/guru` (9 menu APK-parity; Web Push VAPID masih terbuka).
- Guru **tidak** disinkronkan ke `web/public/apk` jalur tutorial siswa.

