# Rencana Lengkap Penguncian APK EduLock Siswa

## 1. Tujuan Dokumen
Dokumen ini menjadi pegangan teknis utama untuk mematangkan sistem penguncian pada APK EduLock Siswa agar:
- lebih responsif di lapangan,
- lebih stabil pada berbagai perangkat Android,
- tidak mudah lolos saat siswa keluar dari aplikasi yang diizinkan,
- tetap aman walau `startLockTask()` gagal,
- dan lebih mudah dirawat karena seluruh state penguncian terpusat.

Dokumen ini disusun berdasarkan:
- audit perilaku kode EduLock saat ini,
- temuan lapangan terkait delay dan lolosnya penguncian,
- backlog perbaikan EduLock yang sudah disepakati,
- dan prinsip bahwa masalah utama bukan kurang lapisan proteksi, tetapi koordinasi antar lapisan yang belum sinkron.

---

## 2. Ringkasan Masalah Saat Ini

### 2.1 Gejala di lapangan
Masalah utama yang terasa oleh pengguna dan tim:
- penguncian kadang terlambat,
- aplikasi kadang tidak langsung menarik siswa kembali ke EduLock,
- ada momen singkat HP terasa tidak terkunci,
- fallback antar mekanisme lock belum terasa solid,
- perilaku antar perangkat Android masih berbeda-beda.

### 2.2 Akar masalah utama
Berdasarkan audit, akar masalah terbesar adalah:
- state penguncian tersebar di banyak tempat,
- deteksi perpindahan aplikasi belum selalu instan,
- `startLockTask()` diperlakukan terlalu penting padahal di beberapa perangkat bisa gagal atau dibatasi OS,
- overlay belum diposisikan sebagai proteksi instan yang benar-benar independen,
- grace period dan cooldown masih terlalu longgar untuk kebutuhan lapangan,
- belum ada metrik kuantitatif yang menunjukkan titik delay sebenarnya.

### 2.3 Kesimpulan teknis
Masalah utama EduLock saat ini bukan:
- kurang fitur keamanan,
- kurang lapisan proteksi,
- atau kurang komponen sistem.

Masalah utamanya adalah:
- orkestrasi state,
- kecepatan reaksi,
- dan urutan enforcement.

Artinya, fokus refactor harus mengarah ke:
- sentralisasi keputusan lock,
- event-driven enforcement,
- fallback yang instan,
- dan metrik lapangan.

---

## 3. Tujuan Sistem Penguncian Baru

### 3.1 Responsivitas
- Perpindahan ke aplikasi yang tidak diizinkan harus terdeteksi secepat mungkin.
- Overlay harus bisa muncul tanpa menunggu `startLockTask()` sukses.
- Tidak boleh ada jeda panjang akibat cooldown bersama.

### 3.2 Ketahanan lapangan
- Tetap bekerja pada perangkat yang bukan Device Owner.
- Tetap aman walau `startLockTask()` gagal.
- Tetap punya fallback bila event accessibility terlambat atau service direstart sistem.

### 3.3 Kejelasan arsitektur
- Semua keputusan lock dan unlock harus bersumber dari satu state manager.
- Setiap komponen hanya menjalankan peran spesifik, bukan membuat keputusan sendiri-sendiri.
- Transisi state harus bisa ditelusuri lewat log.

### 3.4 Keamanan operasional
- Aplikasi tetap membedakan kondisi:
  - mode bebas,
  - proteksi aktif,
  - izin penggunaan HP aktif,
  - bypass uninstall,
  - pengaturan sistem sedang dibuka,
  - emergency unlock,
  - sekolah nonaktif.
- Sistem harus tetap memprioritaskan keselamatan operasional agar perangkat tidak terasa "terkunci total" saat ada bug.

---

## 4. Prinsip Arsitektur Baru

### 4.1 Single Source of Truth
Keputusan lock tidak boleh lagi tersebar di:
- `MainActivity`,
- `MonitoringService`,
- `LockScreenActivity`,
- `AntiUninstallService`,
- dan `PreferencesManager`
secara independen.

Semua keputusan akhir harus melalui:
- `LockStateManager`.

### 4.2 Event-first, Polling-second
Deteksi utama perpindahan aplikasi harus memakai:
- `AccessibilityService`,
- event `TYPE_WINDOW_STATE_CHANGED`.

Sementara:
- `MonitoringService` tetap dipertahankan,
tetapi fungsinya berubah menjadi:
- watchdog,
- reconciler,
- dan backup checker.

### 4.3 Overlay sebagai tameng utama
Overlay harus diposisikan sebagai:
- respon tercepat,
- fallback instan,
- proteksi yang tidak tergantung suksesnya kiosk pinning.

### 4.4 Kiosk sebagai penguat tambahan
`startLockTask()` tetap dipakai, tetapi:
- bukan satu-satunya pertahanan,
- bukan syarat agar overlay boleh aktif,
- dan tidak boleh menunda lock utama.

### 4.5 Device Admin sebagai anti-pembongkaran
Device Admin tetap dipertahankan untuk:
- anti-disable,
- anti-uninstall,
- dan hardening operasional.

### 4.6 Monitoring berbasis data
Setiap perbaikan harus bisa dibuktikan dengan:
- timestamp,
- log transisi,
- dan metrik durasi.

---

## 5. Arsitektur Target

### 5.1 Komponen inti
Arsitektur target terdiri dari komponen berikut:

#### A. `LockStateManager`
Peran:
- sumber state tunggal,
- evaluator kondisi lock,
- penghasil keputusan `LOCKED`, `UNLOCKED`, `SOFT_LOCK`, `HARD_LOCK`, `BYPASS`, dan sejenisnya,
- pengatur transisi state,
- pusat debounce dan cooldown policy yang baru.

#### B. `LockEnforcer`
Peran:
- menerima keputusan dari `LockStateManager`,
- menjalankan overlay,
- menjalankan relaunch EduLock,
- mencoba kiosk pinning,
- memastikan enforcement berjalan berurutan.

#### C. `LockAccessibilityService`
Peran:
- mendeteksi perubahan window dan package secara instan,
- mengirim event foreground package ke `LockStateManager`,
- tidak melakukan I/O berat,
- tidak mengambil keputusan bisnis yang tersebar.

#### D. `MonitoringService`
Peran baru:
- watchdog,
- reconciler,
- sinkronisasi kondisi berkala,
- pengawas jika accessibility mati, GPS bermasalah, internet bermasalah, atau state tidak sinkron.

#### E. `PreferencesManager`
Peran:
- penyimpanan persisten,
- cache state ringan,
- bukan tempat logika keputusan penguncian utama.

#### F. `LockMetricsLogger`
Peran:
- mencatat waktu transisi,
- membantu audit delay,
- mengirim data metrik ke backend atau log lokal bila dibutuhkan.

---

## 6. Desain State Penguncian

### 6.1 State utama yang disarankan
Gunakan state eksplisit seperti berikut:

```kotlin
enum class LockState {
    UNLOCKED,
    SOFT_LOCKED,
    HARD_LOCKED,
    TEMP_PERMISSION,
    SETTINGS_GRACE,
    UNINSTALL_BYPASS,
    EMERGENCY_UNLOCK,
    HOLIDAY_FREE,
    PROTECTION_OFF
}
```

### 6.2 Arti tiap state
- `UNLOCKED`
  - kondisi bebas normal, tidak ada lock aktif.
- `SOFT_LOCKED`
  - overlay dan redirect aktif, tetapi kiosk tidak wajib.
- `HARD_LOCKED`
  - overlay aktif, relaunch aktif, kiosk dicoba, proteksi penuh berjalan.
- `TEMP_PERMISSION`
  - siswa sedang mendapat izin penggunaan HP.
- `SETTINGS_GRACE`
  - sistem sedang membuka halaman pengaturan yang memang diizinkan.
- `UNINSTALL_BYPASS`
  - admin memberi izin uninstall atau bypass sementara.
- `EMERGENCY_UNLOCK`
  - mode darurat aktif.
- `HOLIDAY_FREE`
  - hari libur atau mode bebas aktif.
- `PROTECTION_OFF`
  - proteksi dimatikan admin.

### 6.3 Event pemicu evaluasi state
`LockStateManager` harus mengevaluasi ulang state ketika terjadi:
- app foreground berubah,
- GPS berubah,
- internet berubah,
- school time berubah,
- attendance harian berubah,
- permission usage aktif atau berakhir,
- holiday mode berubah,
- protection mode berubah,
- uninstall authorization berubah,
- accessibility status berubah,
- device admin request berubah,
- setup completed berubah.

---

## 7. Aturan Keputusan Lock

### 7.1 Kondisi yang selalu membuka lock
Jika salah satu kondisi ini aktif, state tidak boleh masuk lock keras:
- `isHolidayMode == true`
- `isProtectionActive == false`
- `permissionManager.isPermissionActive() == true`
- `isUninstallBypassActive() == true`
- `isEmergencyUnlocked == true`
- sekolah nonaktif
- onboarding atau setup belum selesai

### 7.2 Kondisi dasar untuk lock aktif
Lock aktif hanya layak dijalankan jika:
- proteksi aktif,
- bukan libur,
- bukan bypass,
- bukan izin aktif,
- sedang jam sekolah,
- status presensi hari ini memenuhi syarat strict mode,
- siswa berada di area sekolah atau memenuhi aturan internal lock yang berlaku,
- app aktif saat ini bukan paket yang diizinkan.

### 7.3 Paket yang diizinkan
Whitelist harus dikelola jelas dan terpusat, mencakup:
- paket EduLock,
- paket GAS Siswa,
- permission controller sistem,
- package installer bila bypass uninstall aktif,
- keyboard atau input method yang sah,
- komponen sistem minimum yang tidak boleh diblok total.

Whitelist tidak boleh tersebar bebas di banyak file tanpa sumber yang konsisten.

---

## 8. Strategi Enforcement Baru

### 8.1 Urutan enforcement yang benar
Saat state memutuskan perangkat harus terkunci:
1. catat `event_received`,
2. tampilkan overlay secepat mungkin,
3. relaunch atau reorder EduLock ke depan,
4. coba `startLockTask()` bila mode mengizinkan,
5. catat hasil kiosk sukses atau gagal,
6. watchdog memverifikasi apakah device benar-benar sudah kembali aman.

### 8.2 Prinsip penting
- Overlay tidak boleh menunggu `startLockTask()`.
- Gagalnya kiosk tidak boleh membuat perangkat menjadi bebas.
- Jika kiosk gagal, overlay tetap harus menjaga jalur keluar.
- Jika accessibility service miss event, watchdog tetap menutup gap.

### 8.3 Cooldown policy baru
Cooldown harus dipisah menjadi dua:
- cooldown kiosk pinning,
- cooldown retry teknis tertentu.

Overlay:
- tidak ikut cooldown kiosk.

Artinya:
- meski `startLockTask()` baru saja gagal,
- jika siswa membuka app terlarang lagi,
- overlay tetap harus langsung muncul.

---

## 9. Mode Proteksi yang Disarankan

### 9.1 Soft Protection
Tujuan:
- mode transisi,
- lebih aman untuk rollout awal,
- meminimalkan risiko perangkat terasa terlalu terkunci jika ada bug.

Komponen aktif:
- accessibility detection,
- overlay instan,
- relaunch EduLock,
- monitoring watchdog.

Komponen non-prioritas:
- kiosk pinning boleh dinonaktifkan atau opsional.

Cocok untuk:
- sekolah baru,
- uji coba,
- tahap validasi lapangan,
- perangkat yang sering bermasalah dengan kiosk.

### 9.2 Hard Lock
Tujuan:
- proteksi maksimal setelah sistem stabil.

Komponen aktif:
- overlay instan,
- relaunch EduLock,
- accessibility detection,
- watchdog,
- kiosk pinning,
- anti-uninstall,
- device admin hardening.

Cocok untuk:
- sekolah yang sudah siap,
- perangkat yang lolos validasi stabilitas,
- kondisi operasional penuh.

---

## 10. File yang Terdampak

### 10.1 File yang perlu diubah atau refactor
Perkiraan file utama:

- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\MainActivity.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\MonitoringService.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\AntiUninstallService.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockScreenActivity.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\PreferencesManager.kt`

### 10.2 File baru yang disarankan
Untuk refactor rapi, disarankan tambah file baru:

- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockStateManager.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockEnforcer.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockMetricsLogger.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\LockPolicy.kt`
- `D:\Satu Pintu\edulock-mobile\app\src\main\java\com\sekolah\edulock\AllowedPackagesProvider.kt`

---

## 11. Pembagian Tanggung Jawab Per File

### 11.1 `LockStateManager.kt`
Tanggung jawab:
- membaca sumber kondisi dari prefs, service, dan event,
- menentukan state final,
- menyimpan transisi state saat ini,
- menyediakan API evaluasi yang konsisten,
- mencegah keputusan lock ganda dari banyak tempat.

### 11.2 `LockEnforcer.kt`
Tanggung jawab:
- tampilkan atau hilangkan overlay,
- relaunch EduLock,
- coba kiosk,
- catat hasil enforcement,
- cegah enforcement dobel yang saling tabrakan.

### 11.3 `AntiUninstallService.kt`
Tanggung jawab baru:
- deteksi event package atau window secara instan,
- kirim info package aktif ke state manager,
- jalur event cepat,
- bukan tempat menyimpan keputusan besar yang tersebar.

### 11.4 `MonitoringService.kt`
Tanggung jawab baru:
- watchdog periodik,
- sinkronisasi kondisi GPS, internet, dan jadwal,
- recovery jika event miss,
- verifikasi hasil enforcement.

### 11.5 `MainActivity.kt`
Tanggung jawab baru:
- UI,
- lifecycle foreground,
- request permission dan pengaturan,
- panggil state manager atau enforcer,
- jangan lagi menyimpan logika lock besar yang terpisah dari pusat.

### 11.6 `LockScreenActivity.kt`
Tanggung jawab baru:
- tampilan lock penuh,
- jalur admin dan emergency yang sah,
- tidak membuat keputusan bisnis lock sendiri di luar state manager.

---

## 12. Tahapan Implementasi

### 12.1 Tahap P0 - Fondasi utama
Tahap ini wajib selesai dulu.

#### Item P0.1
Buat `LockStateManager`:
- definisi state,
- definisi event,
- fungsi evaluasi state,
- transisi state tunggal.

#### Item P0.2
Pindahkan deteksi foreground utama ke accessibility event:
- gunakan `TYPE_WINDOW_STATE_CHANGED`,
- kirim event cepat ke state manager,
- hindari proses berat di callback event.

#### Item P0.3
Pisahkan overlay dari cooldown kiosk:
- overlay selalu instan,
- kiosk dicoba di jalur terpisah,
- kegagalan kiosk tidak memblok enforcement utama.

#### Item P0.4
Rapikan whitelist package:
- satu sumber data,
- mudah dipelihara,
- mudah menambah kondisi bypass.

### 12.2 Tahap P1 - Penyempurnaan lapangan
Setelah P0 stabil.

#### Item P1.1
Tuning grace period:
- mulai dari angka kecil,
- ukur hasil lapangan,
- naikkan hanya bila benar-benar perlu.

#### Item P1.2
Tambahkan `Soft` vs `Hard` protection:
- mode rollout,
- mode aman,
- mode proteksi penuh.

#### Item P1.3
Tambahkan recovery logic:
- jika accessibility mati,
- jika overlay gagal tampil,
- jika kiosk gagal terus-menerus,
- jika service di-kill OS.

### 12.3 Tahap P2 - Hardening dan bukti kuantitatif
#### Item P2.1
Pasang metrik transisi.

#### Item P2.2
Buat log analitik ringkas.

#### Item P2.3
Buat dashboard evaluasi delay.

#### Item P2.4
Audit perangkat OEM bermasalah.

---

## 13. Metrik yang Wajib Dicatat

### 13.1 Rantai metrik utama
Gunakan titik berikut:

```text
event_received -> overlay_shown -> app_relaunched -> locktask_confirmed
```

### 13.2 Arti tiap metrik
- `event_received`
  - kapan event pertama diterima.
- `overlay_shown`
  - kapan overlay benar-benar tampil.
- `app_relaunched`
  - kapan EduLock berhasil dibawa kembali ke depan.
- `locktask_confirmed`
  - kapan kiosk benar-benar terkonfirmasi aktif.

### 13.3 Tujuan pengukuran
Dari sini tim bisa tahu:
- apakah delay terjadi di deteksi,
- apakah delay terjadi di render overlay,
- apakah relaunch gagal,
- apakah `startLockTask()` sering gagal,
- apakah fallback overlay sudah cukup menutup celah.

---

## 14. Risiko dan Mitigasi

### 14.1 Risiko: Accessibility event tidak stabil di semua device
Mitigasi:
- pertahankan `MonitoringService` sebagai watchdog,
- lakukan reconciler berkala,
- log status accessibility.

### 14.2 Risiko: Overlay tidak tampil karena izin tidak ada
Mitigasi:
- pastikan onboarding memverifikasi overlay permission,
- siapkan fallback lock screen activity,
- jangan menganggap overlay selalu tersedia.

### 14.3 Risiko: `startLockTask()` gagal diam-diam
Mitigasi:
- selalu verifikasi hasil,
- jangan bergantung penuh pada kiosk,
- tetap aktifkan overlay lebih dulu.

### 14.4 Risiko: False positive terlalu agresif
Mitigasi:
- whitelist terpusat,
- debounce kecil tapi terukur,
- pengujian intensif pada jalur internal yang sah.

### 14.5 Risiko: Perangkat terasa terlalu terkunci saat bug
Mitigasi:
- gunakan rollout bertahap,
- aktifkan mode `Soft` terlebih dahulu,
- pertahankan jalur darurat atau admin yang aman.

---

## 15. Checklist Pengujian Lapangan

### 15.1 Pengujian inti
- buka aplikasi selain whitelist saat jam sekolah,
- buka Recent Apps,
- tekan Home,
- buka app sekolah yang diizinkan,
- aktifkan izin penggunaan HP,
- keluar dari aplikasi saat izin aktif,
- matikan internet,
- matikan GPS,
- keluar dari area sekolah,
- aktifkan mode libur,
- matikan proteksi dari admin,
- lakukan bypass uninstall sah,
- uji device admin disable attempt,
- uji setelah service direstart sistem,
- uji setelah layar mati lalu hidup,
- uji setelah aplikasi dibuka ulang,
- uji setelah reboot perangkat.

### 15.2 Pengujian performa
- ukur waktu event ke overlay,
- ukur waktu event ke relaunch,
- ukur tingkat keberhasilan kiosk,
- catat perangkat yang sering gagal.

### 15.3 Pengujian keselamatan operasional
- pastikan admin tetap bisa membuka jalur yang sah,
- pastikan siswa tidak bisa lolos ke app terlarang,
- pastikan bypass uninstall tetap praktis saat diizinkan,
- pastikan bug tidak membuat perangkat tidak bisa dipulihkan.

---

## 16. Strategi Rollout

### 16.1 Tahap rollout yang disarankan
- Tahap 1: implementasi `LockStateManager` + overlay instan + metrics
- Tahap 2: accessibility event dijadikan trigger utama
- Tahap 3: watchdog reconciliation distabilkan
- Tahap 4: tuning debounce berdasarkan data
- Tahap 5: aktifkan `Soft Protection`
- Tahap 6: naik ke `Hard Lock` untuk perangkat atau sekolah yang sudah lolos uji

### 16.2 Prinsip rollout
- jangan langsung full hard lock ke semua device,
- kumpulkan bukti delay dari metrik,
- perbaiki berdasarkan data nyata, bukan asumsi.

---

## 17. Keputusan Final yang Disepakati
Sistem penguncian EduLock Siswa ke depan harus mengikuti keputusan berikut:
- gunakan `LockStateManager` sebagai pusat state,
- gunakan accessibility event sebagai trigger tercepat,
- pertahankan `MonitoringService` sebagai watchdog atau reconciler,
- jadikan overlay sebagai fallback utama yang instan,
- jadikan kiosk sebagai penguat tambahan, bukan satu-satunya tameng,
- pertahankan device admin untuk hardening anti-disable dan anti-uninstall,
- ukur semua transisi penting dengan metrik,
- rollout bertahap mulai dari mode yang paling aman.

---

## 18. Penutup
Jika rencana ini dijalankan dengan disiplin, hasil yang diharapkan adalah:
- EduLock terasa jauh lebih responsif,
- celah "kadang tidak mengunci" berkurang drastis,
- perilaku sistem lebih konsisten antar perangkat,
- debugging lebih mudah karena state dan transisi jelas,
- dan tim memiliki bukti kuantitatif untuk setiap peningkatan berikutnya.

Dokumen ini menjadi acuan utama sebelum implementasi refactor penguncian EduLock Siswa dimulai.
