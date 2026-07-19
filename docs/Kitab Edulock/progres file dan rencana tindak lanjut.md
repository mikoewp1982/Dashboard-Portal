# Progres File dan Rencana Tindak Lanjut EduLock

## Tujuan Dokumen
Dokumen ini menjadi pegangan operasional tim untuk:
- melihat status terakhir pekerjaan EduLock,
- memahami keputusan arsitektur yang sudah diambil,
- mengetahui file penting yang sudah berubah,
- dan melanjutkan pekerjaan kapan saja tanpa mengulang audit dari nol.

Dokumen ini wajib diperbarui setiap ada milestone implementasi, build, atau keputusan arsitektur baru.

---

## Status Umum Saat Ini

### Keputusan besar yang sudah final
Tim tidak membuat aplikasi baru total dari nol.

Yang dilakukan adalah:
- tetap memakai project `edulock-mobile`,
- membangun core penguncian baru di dalam project lama,
- merapikan file lama agar keputusan lock makin terpusat,
- dan menyiapkan 2 jalur uji lapangan:
  - `V1 Manual`
  - `V2 Hybrid`

### Alasan keputusan ini
- fondasi aplikasi lama masih layak dipakai,
- flow registrasi, device admin, izin, uninstall sah, dan integrasi backend sudah ada,
- masalah utama ada pada orkestrasi lock dan respons lapangan,
- strategi ini lebih cepat, lebih aman, dan lebih realistis untuk diteruskan tim.

---

## Ringkasan Arsitektur Yang Sudah Dibangun

### Core baru yang sudah ada
Komponen inti berikut sudah dibuat di project:
- `LockStateManager.kt`
- `LockEnforcer.kt`
- `AllowedPackagesProvider.kt`
- `LockMetricsLogger.kt`
- `LockPolicy.kt`

### Peran core baru
- `LockStateManager`
  - pusat keputusan lock/unlock
  - sumber state tunggal
  - penghasil `LockDecision`
- `LockEnforcer`
  - eksekutor overlay, relaunch, kiosk, dismiss
- `AllowedPackagesProvider`
  - whitelist package terpusat
- `LockMetricsLogger`
  - jejak event untuk audit delay
- `LockPolicy`
  - kebijakan cooldown, retry, dan mode proteksi

### File lama yang sudah direfaktor
- `AntiUninstallService.kt`
  - sudah mulai memakai core baru
- `MonitoringService.kt`
  - sudah bergeser menjadi watchdog/reconciler
- `MainActivity.kt`
  - keputusan lock mulai dibersihkan
- `LockScreenActivity.kt`
  - lebih fokus sebagai presenter lock
- `OverlayLockActivity.kt`
  - lebih fokus sebagai recovery/presenter overlay

---

## Strategi Baru V1 dan V2

### Konsep yang disepakati
EduLock sekarang dipersiapkan dalam 2 jalur build dari satu project yang sama:

#### `V1 Manual`
- basis utama: polling/manual location check
- tetap memakai core lock baru
- dipakai sebagai baseline lapangan yang stabil
- cocok untuk pengujian awal

#### `V2 Hybrid`
- basis utama: semua isi `V1`
- ditambah geofence resmi Google Play Services
- polling manual tetap dipertahankan sebagai watchdog
- dipakai untuk menimpa `V1` jika uji lapangan menunjukkan `V1` masih lambat

### Tujuan strategi 2 versi
- ada baseline aman terlebih dahulu,
- ada jalur upgrade cepat bila baseline kurang responsif,
- tim bisa membandingkan hasil nyata di perangkat yang sama,
- dan rollout bisa dilakukan bertahap tanpa membuat 2 project terpisah.

### Aturan overwrite yang disepakati
- package tetap sama: `com.sekolah.edulock`
- `V2` disiapkan sebagai versi upgrade dari `V1`
- versioning build dibedakan agar overwrite lebih aman

---

## Implementasi V1 dan V2 Yang Sudah Dikerjakan

### Build variants sudah dipisah
File:
- `D:\Satu Pintu\edulock-mobile\app\build.gradle.kts`

Implementasi:
- menambah flavor dimension `lockStack`
- menambah flavor:
  - `v1Manual`
  - `v2Hybrid`
- menambah `BuildConfig` flag:
  - `USE_MANUAL_LOCATION_POLLING`
  - `USE_GEOFENCING`
  - `LOCK_STACK_LABEL`

### Geofence V2 sudah mulai dipasang
File baru:
- `GeofenceCoordinator.kt`
- `GeofenceBroadcastReceiver.kt`

Peran:
- `GeofenceCoordinator`
  - memasang dan refresh geofence sekolah untuk `V2`
- `GeofenceBroadcastReceiver`
  - menerima event `ENTER`, `EXIT`, `DWELL`
  - memperbarui state zona di `PreferencesManager`
  - merekonsiliasi keputusan lock via `LockStateManager`

### Integrasi geofence hybrid yang sudah masuk
File yang diubah:
- `MainActivity.kt`
- `MonitoringService.kt`
- `AndroidManifest.xml`
- `PreferencesManager.kt`

Perubahan:
- `MainActivity` sekarang ikut sync geofence saat:
  - app start
  - izin lokasi diberikan
  - konfigurasi sekolah berubah
- `MonitoringService` sekarang:
  - ikut sync geofence saat service hidup
  - tetap mempertahankan polling manual sebagai watchdog
  - memakai interval awal berbeda untuk `V1` dan `V2`
- `PreferencesManager` sekarang menyimpan:
  - `lastGeofenceTransition`
  - `lastGeofenceTransitionAt`
- `AndroidManifest.xml` sekarang mendaftarkan:
  - `GeofenceBroadcastReceiver`

---

## Posisi Pekerjaan Saat Ini

### Yang sudah selesai
- audit arsitektur lock existing
- keputusan tidak membuat app baru total
- pembuatan dokumen teknis di `Kitab Edulock`
- pembuatan core lock baru
- refactor tahap awal activity dan service inti
- build debug tahap 2 sebelumnya untuk jalur existing
- pemisahan struktur build `V1 Manual` dan `V2 Hybrid`
- pemasangan fondasi geofence hybrid untuk `V2`
- pembaruan dokumen progres ini

### Yang sedang berjalan
- verifikasi compile/build untuk varian `V1` dan `V2`
- validasi integrasi geofence agar tidak merusak flow manual

### Yang belum final
- tuning akhir interval dan debounce berdasarkan hasil lapangan
- validasi geofence pada berbagai merek HP
- penyiapan APK uji lapangan `V1` dan `V2`
- build release final setelah hasil uji debug dinyatakan aman

---

## Build dan Uji Lapangan Yang Dituju

### Varian student yang harus dipakai tim
Target build debug:
- `assembleV1ManualStudentDebug`
- `assembleV2HybridStudentDebug`

Makna operasional:
- pasang `V1` dulu di lapangan
- jika masih lambat atau kurang responsif, timpa dengan `V2`
- bandingkan hasil di perangkat yang sama

### Prinsip evaluasi lapangan
Fokus pembanding:
- kecepatan lock
- jumlah kejadian lolos
- false positive
- stabilitas antar device
- perilaku saat izin HP aktif
- perilaku saat GPS/Internet bermasalah

---

## File Yang Paling Penting Saat Ini

### File core dan integrasi
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockStateManager.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockEnforcer.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockPolicy.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\AllowedPackagesProvider.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\GeofenceCoordinator.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\GeofenceBroadcastReceiver.kt`

### File existing yang sudah tersambung
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\MainActivity.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\MonitoringService.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\AntiUninstallService.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockScreenActivity.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\OverlayLockActivity.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\PreferencesManager.kt`
- `D:\Satu Pintu\edulock-mobile\app\build.gradle.kts`

---

## Dokumen Pegangan di `Kitab Edulock`

Dokumen yang sudah tersedia:
1. `rencana-penguncian-edulock-siswa.md`
2. `checklist-eksekusi-refactor-p0-edulock.md`
3. `spesifikasi-lockstatemanager-edulock.md`
4. `rencana-refactor-per-file-edulock.md`
5. `matriks-uji-lapangan-penguncian-edulock.md`
6. `progres file dan rencana tindak lanjut.md`
7. `SOP operasional dan troubleshooting EduLock.md`
8. `matriks kesesuaian SOP vs APK nyata EduLock.md`

Catatan penting:
- SOP operasional harus dibaca sebagai cerminan perilaku APK yang nyata di lapangan,
- bukan sebagai asumsi bahwa semua jalur yang tertulis di kode sudah pasti reliabel.

Urutan baca yang disarankan untuk tim:
1. `progres file dan rencana tindak lanjut.md`
2. `SOP operasional dan troubleshooting EduLock.md`
3. `matriks kesesuaian SOP vs APK nyata EduLock.md`
4. `panduan pemasangan lapangan edulock.md`
5. `rencana-penguncian-edulock-siswa.md`
6. `spesifikasi-lockstatemanager-edulock.md`
7. `rencana-refactor-per-file-edulock.md`
8. `checklist-eksekusi-refactor-p0-edulock.md`
9. `matriks-uji-lapangan-penguncian-edulock.md`

---

## Rencana Tindak Lanjut Tim

### Prioritas 1
Build dan verifikasi kedua varian:
- `V1 Manual`
- `V2 Hybrid`

### Prioritas 2
Uji lapangan `V1` sebagai baseline awal.

### Prioritas 3
Jika `V1` lambat, timpa perangkat uji yang sama dengan `V2`.

### Prioritas 4
Catat perbandingan:
- lock delay
- lolos aplikasi
- false positive
- baterai
- kestabilan event geofence

### Prioritas 5
Setelah hasil uji cukup, tentukan:
- apakah `V2` naik menjadi jalur utama,
- atau `V1` tetap dipertahankan untuk device tertentu.

---

## Risiko Yang Harus Diwaspadai

### Risiko 1
Geofence tidak konsisten di semua brand.

Mitigasi:
- polling manual tetap dipertahankan sebagai watchdog

### Risiko 2
Logika manual dan hybrid bentrok.

Mitigasi:
- keputusan akhir tetap satu pintu lewat `LockStateManager`

### Risiko 3
Build flavor membingungkan tim lapangan.

Mitigasi:
- gunakan nama APK yang jelas
- dokumentasikan tugas build yang dipakai

### Risiko 4
Tim terlalu cepat menganggap `V2` pasti lebih baik.

Mitigasi:
- putuskan berdasarkan hasil uji, bukan asumsi

---

## Status Singkat Saat Ini

**EduLock sudah masuk fase implementasi aktif. Core lock baru sudah terpasang, refactor activity/service inti sudah berjalan, dan strategi dua jalur `V1 Manual` serta `V2 Hybrid` sudah mulai diimplementasikan agar uji lapangan bisa dilakukan bertahap dengan opsi overwrite dari `V1` ke `V2`.**

---

## Update 2026-07-07 Release V1 dan V2

- build `:app:assembleV1ManualStudentRelease` berhasil
- build `:app:assembleV2HybridStudentRelease` berhasil
- APK release disalin ke folder `D:\Satu Pintu\Siap Pakai\APK EduLock`
- file distribusi final:
  - `EduLock-v1.2.7-v1-manual-release-vc21.apk`
  - `EduLock-v1.2.7-v2-hybrid-release-vc22.apk`
- keputusan operasional:
  - uji lapangan dimulai dari `V1 Manual`
  - jika hasil masih lambat atau kurang responsif, perangkat yang sama ditimpa memakai `V2 Hybrid`
- catatan build:
  - kedua release build sukses
  - warning yang tersisa adalah warning deprecation lama dan bukan blocker

---

## Format Update Berikutnya

Gunakan format ini untuk update lanjutan:

### Update [tanggal-jam]
- pekerjaan yang selesai
- file yang dibuat atau diubah
- build yang berhasil
- kendala yang ditemukan
- keputusan yang diambil
- langkah berikutnya

Contoh:

### Update 2026-07-07 23:40
- build `assembleV1ManualStudentDebug` berhasil
- build `assembleV2HybridStudentDebug` berhasil
- APK disalin ke folder uji lapangan
- kendala: event geofence belum stabil di device tertentu
- keputusan: polling manual tetap dipakai sebagai watchdog
- langkah berikutnya: uji lapangan perangkat Samsung dan Xiaomi
