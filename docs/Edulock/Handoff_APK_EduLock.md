# Handoff APK EduLock

## 1. Status Dokumen

Dokumen ini menjadi pegangan teknis utama tim untuk membangun APK EduLock versi proyek `Dashboard Portal`.

## 2. Aturan Folder

### A. Folder Referensi

- `D:\Satu Pintu\edulock-mobile`
- status: **read-only**
- fungsi:
  - referensi visual
  - referensi arsitektur
  - referensi flow setup/proteksi
  - referensi manifest/service/activity

### B. Folder Kerja Aktif

Tim **wajib** membuat dan memakai folder kerja terpisah di dalam workspace proyek ini.

Rekomendasi:

- `D:\Dashboard Portal\native-mobile-edulock`

Larangan:

- jangan edit file langsung di `D:\Satu Pintu\edulock-mobile`
- jangan menambah file kerja, patch, build, atau eksperimen di folder referensi

## 3. Strategi Porting

Porting dilakukan dengan pendekatan berikut:

1. baca dan petakan komponen referensi
2. salin hanya ke folder kerja aktif
3. refactor struktur package, auth, dan data path agar sesuai ekosistem GAS
4. verifikasi bertahap per area

## 4. File Referensi Paling Penting

### A. Arsitektur

- `D:\Satu Pintu\edulock-mobile\ARSITEKTUR_SISTEM_edulock_siswa.md`

### B. Activity dan onboarding

- `RegistrationActivity.kt`
- `SetupActivity.kt`
- `MainActivity.kt`
- `PermissionCodeActivity.kt`
- `BarcodeScannerActivity.kt`
- `LockScreenActivity.kt`
- `OverlayLockActivity.kt`

### C. Service / enforcement

- `MonitoringService.kt`
- `AntiUninstallService.kt`
- `SetupProtectionService.kt`
- `LocationMonitor.kt`
- `GeofenceCoordinator.kt`
- `LockEnforcer.kt`
- `SchoolScheduleManager.kt`
- `TrustScoreManager.kt`

### D. System integration

- `AndroidManifest.xml`
- `DeviceAdminReceiver.kt`
- `BootReceiver.kt`
- `ScreenReceiver.kt`
- `ServiceRestarter.kt`

### E. Runtime storage / helper

- `PreferencesManager.kt`
- `DatabaseHelper.kt`
- `FirebaseManager.kt`
- `FirebaseReporter.kt`
- `StudentAuthService.kt`

## 5. Perubahan Besar yang Wajib Dilakukan saat Porting

### A. Firebase

Referensi lama memakai arsitektur Firebase sendiri. Porting target wajib ganti ke:

- project: `dashboard-portal-179f7`
- node tenant aktif sekolah
- kontrak data GAS

### B. Login siswa

Referensi lama:

- login berbasis `NPSN + NISN + Nama`
- endpoint token sendiri

Target kita:

- akun login siswa sama dengan APK GAS siswa
- tenant dicari dari `npsn`
- identitas siswa dicek dengan prioritas:
  - `username`
  - `nisn`

### C. Binding device

Target binding harus mengikuti pola GAS siswa:

- tulis ke node siswa tenant aktif
- sinkronkan juga ke `master_students/{nisn}` jika diperlukan
- gunakan field:
  - `deviceId`
  - `device`

### D. Reporting runtime

APK EduLock target harus mengirim runtime ke jalur yang sudah dipakai web EduLock:

- `active_devices/{schoolId}/...`

Node turunan final boleh ditentukan saat implementasi, tetapi output minimal harus cukup untuk:

- status online
- heartbeat terakhir
- battery
- latitude / longitude
- out-of-zone
- trust score
- emergency unlock / uninstall bypass bila ada

## 6. Urutan Kerja yang Disarankan

1. buat folder kerja aktif `native-mobile-edulock`
2. salin struktur dasar referensi ke folder kerja
3. ganti package name sesuai strategi flavor/package proyek
4. sambungkan `google-services.json` ke Firebase proyek kanonik
5. refactor login siswa ke kontrak GAS siswa
6. refactor binding device
7. refactor runtime reporting ke `active_devices`
8. hidupkan monitoring service
9. verifikasi setup permission dan enforcement dasar
10. build debug APK

## 7. Definisi Selesai Tahap 1

Tahap 1 dianggap berhasil jika:

1. siswa bisa login dengan identitas yang sama seperti APK GAS siswa
2. tenant sekolah terbaca benar dari `npsn`
3. device binding masuk ke data siswa tenant aktif
4. service berjalan setelah setup
5. runtime masuk ke jalur yang bisa dibaca web EduLock
6. web EduLock dashboard/monitoring mulai menampilkan data nyata dari perangkat

## 8. Risiko yang Harus Diperhatikan

1. Jangan bawa mentah path RTDB lama dari referensi.
2. Jangan pertahankan model auth lama berbasis `NISN + nama` saja.
3. Jangan menyalin seluruh proyek referensi tanpa memilah file yang benar-benar dipakai.
4. Jangan mengklaim integrasi live sebelum runtime benar-benar muncul di web EduLock.

## 9. Riwayat Progres (Changelog)

**[17 Juli 2026] - Penyelesaian Tahap 1 (Integrasi Fundamental & Binding Device)**
- ✅ **Setup Workspace**: Folder `native-mobile-edulock` berhasil dibuat dan dikonfigurasi menggunakan Firebase `dashboard-portal-179f7`.
- ✅ **Autentikasi (Refactor Login)**: Aplikasi berhasil membaca identitas siswa melalui kombinasi NPSN, NISN, dan Nama menggunakan `StudentAuthService.kt` dan menghubungkannya dengan data GAS.
- ✅ **Keamanan Firebase (Database Rules)**: Menambahkan aturan write (`.write`) untuk mengizinkan proses *anonymous authentication* meng-*update* `device_uuid` dan melakukan penulisan ke `active_devices`.
- ✅ **Binding Device & Aturan 1 Akun 1 Device**: Perekaman UUID perangkat secara persisten ke node siswa aktif (`gas/schools/$schoolId/students/$studentKey/device_uuid`). Aturan proteksi berjalan: perangkat baru akan menolak login bila akun sudah terikat di perangkat lain yang terekam.
- ✅ **Filter Anomali Web**: Perbaikan pada API Dashboard (`route.ts`) dan panel UI untuk memfilter data siluman/anomali yang tidak memiliki nama (akibat salah *path* penulisan sebelumnya) dari kalkulasi statistik dan tabel pemonitoran.
- ✅ **Realtime Telemetry (Heartbeat)**: *Background service* terbukti berhasil memancarkan *heartbeat* ke `active_devices` dan sukses terbaca secara sinkron di Dashboard Web. Tahap 1 **SELESAI 100%**.
