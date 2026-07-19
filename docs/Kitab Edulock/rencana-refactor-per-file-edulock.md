# Rencana Refactor Per File EduLock

## Tujuan
Dokumen ini memecah rencana besar penguncian EduLock menjadi langkah yang lebih operasional per file, agar implementasi tidak liar, tidak saling tumpang tindih, dan mudah diawasi saat eksekusi.

Fokus dokumen ini:
- file mana yang diubah,
- peran baru tiap file,
- logika lama mana yang dipertahankan,
- logika mana yang dipindah,
- dan urutan refactor paling aman.

---

## Prinsip Refactor

### Prinsip 1
Jangan langsung mengganti semua jalur lock sekaligus.

### Prinsip 2
Bangun jalur baru terlebih dahulu, lalu pindahkan tanggung jawab dari jalur lama secara bertahap.

### Prinsip 3
`LockStateManager` harus menjadi pusat keputusan, tetapi enforcement tetap dibagi ke komponen yang memang bertugas menjalankan aksi.

### Prinsip 4
`MonitoringService` tetap dipertahankan sebagai watchdog dan reconciler, bukan dihapus.

### Prinsip 5
Overlay harus menjadi jalur proteksi tercepat dan tidak boleh tertahan cooldown kiosk.

---

## Daftar File Yang Direfactor

### File baru yang disarankan
- `LockStateManager.kt`
- `LockEnforcer.kt`
- `AllowedPackagesProvider.kt`
- `LockMetricsLogger.kt`
- `LockPolicy.kt`

### File lama yang perlu diubah
- `MainActivity.kt`
- `MonitoringService.kt`
- `AntiUninstallService.kt`
- `LockScreenActivity.kt`
- `PreferencesManager.kt`

### File yang mungkin ikut disentuh bila diperlukan
- `PermissionManager.kt`
- `SchoolScheduleManager.kt`
- `SchoolServiceGuard.kt`
- `OverlayLockActivity.kt`

---

## 1. `LockStateManager.kt`

### Status
File baru.

### Tujuan
Menjadi pusat keputusan lock dan unlock seluruh sistem.

### Isi yang harus ada
- enum `LockState`
- enum `LockReason`
- data class `LockDecision`
- data class `LockContextSnapshot`
- fungsi evaluasi state
- penyimpan state aktif
- observer state atau `StateFlow`
- logging transisi state

### Input utama
- status setup
- status proteksi
- status holiday
- status izin penggunaan HP
- status settings grace
- status emergency unlock
- status uninstall bypass
- status strict mode
- status school service
- status school time
- status inside school zone
- current foreground package
- mode proteksi soft atau hard

### Output utama
- state final
- alasan keputusan
- flag apakah overlay harus tampil
- flag apakah EduLock harus dibawa ke depan
- flag apakah kiosk harus dicoba

### Catatan refactor
- file ini tidak boleh berisi logika UI
- file ini tidak boleh memanggil activity langsung
- file ini hanya menghitung keputusan

---

## 2. `LockEnforcer.kt`

### Status
File baru.

### Tujuan
Menjalankan aksi nyata berdasarkan keputusan dari `LockStateManager`.

### Isi yang harus ada
- fungsi menampilkan overlay
- fungsi menyembunyikan overlay
- fungsi relaunch EduLock
- fungsi mencoba `startLockTask()`
- fungsi verifikasi hasil kiosk
- guard agar enforcement tidak bertumpuk

### Logika penting
- overlay tampil terlebih dahulu
- relaunch dilakukan sesudah overlay aktif
- kiosk dijalankan sebagai penguat tambahan
- kegagalan kiosk tidak membatalkan overlay

### Catatan refactor
- jangan menyimpan logika bisnis keputusan di sini
- jangan membaca whitelist secara manual dari banyak tempat

---

## 3. `AllowedPackagesProvider.kt`

### Status
File baru.

### Tujuan
Menjadi satu sumber daftar package yang diizinkan.

### Isi yang harus ada
- daftar package tetap
- daftar package kondisional
- helper `isAllowedPackage(...)`
- helper `isKeyboardPackage(...)`
- helper untuk mode uninstall bypass

### Daftar paket minimal
- package EduLock
- package GAS Siswa
- package permission controller
- package installer saat bypass uninstall aktif
- package keyboard umum
- package sistem minimum yang aman

### Catatan refactor
- semua whitelist di `MainActivity`, `MonitoringService`, dan `AntiUninstallService` harus dipusatkan ke sini

---

## 4. `LockMetricsLogger.kt`

### Status
File baru.

### Tujuan
Mencatat waktu transisi lock agar delay bisa dibuktikan.

### Titik metrik minimum
- `event_received`
- `decision_emitted`
- `overlay_shown`
- `app_relaunched`
- `locktask_confirmed`

### Isi yang harus ada
- helper pencatat timestamp
- helper membuat trace per kejadian
- helper logging success atau failure
- helper serialisasi data untuk log lokal atau backend

### Catatan refactor
- log harus cukup ringkas
- log harus tetap bisa dibaca manusia saat audit manual

---

## 5. `LockPolicy.kt`

### Status
File baru.

### Tujuan
Menampung aturan kebijakan yang terpisah dari implementasi teknis.

### Isi yang harus ada
- nilai default debounce
- nilai retry kiosk
- mode proteksi `SOFT` dan `HARD`
- aturan kapan lock diizinkan
- aturan kapan bypass harus menang

### Catatan refactor
- memisahkan policy dari implementasi membuat tuning lebih aman

---

## 6. `MainActivity.kt`

### Status
File lama, direduksi perannya.

### Peran baru
- UI utama
- lifecycle foreground
- request permission
- onboarding dan settings flow
- pengirim event lifecycle ke `LockStateManager`

### Logika yang tetap boleh ada
- tampilan status ke user
- pembukaan screen pengaturan
- request device admin
- request overlay permission
- request accessibility flow
- pembukaan GAS Siswa dari tombol resmi

### Logika yang harus dipindah atau diringankan
- keputusan lock utama
- evaluasi langsung terhadap package liar
- logika cooldown lock yang tersebar
- keputusan akhir kapan overlay harus aktif

### Titik integrasi baru
- kirim event `ui foreground`
- kirim perubahan `settings grace`
- kirim status izin penggunaan HP
- kirim perubahan package yang dibuka secara sah
- baca state akhir dari `LockStateManager`

### Target hasil
- `MainActivity` lebih fokus ke antarmuka dan izin
- keputusan lock tidak lagi menjadi beban utama file ini

---

## 7. `MonitoringService.kt`

### Status
File lama, tetap dipertahankan.

### Peran baru
- watchdog
- reconciler
- validator state berkala
- pengawas GPS, internet, dan kondisi sekolah

### Logika yang tetap dipertahankan
- monitoring periodik
- listener perubahan status dari backend
- sinkronisasi state runtime
- status reporting ke backend bila masih relevan

### Logika yang harus diubah
- jangan lagi menjadi jalur utama deteksi app foreground
- jangan lagi memutuskan sendiri semua kondisi lock akhir
- jangan lagi menjadi sumber tunggal package policing

### Titik integrasi baru
- kirim snapshot periodik ke `LockStateManager`
- panggil `reconcile()` saat ada mismatch
- jalankan `LockEnforcer` hanya berdasarkan keputusan manager

### Catatan penting
- service ini tetap penting sebagai jaring pengaman bila accessibility event telat atau service sistem bermasalah

---

## 8. `AntiUninstallService.kt`

### Status
File lama, diubah perannya menjadi jalur event tercepat.

### Peran baru
- menangkap `TYPE_WINDOW_STATE_CHANGED`
- membaca package aktif
- mengirim event package aktif ke `LockStateManager`
- tetap menjaga fungsi anti-uninstall dan anti-disable yang relevan

### Logika yang tetap dipertahankan
- pendeteksian halaman settings atau uninstall yang sensitif
- blokir saat user mencoba bongkar aplikasi tanpa izin

### Logika yang harus dirapikan
- whitelist manual di dalam file
- keputusan lock besar yang tumpang tindih dengan komponen lain
- ketergantungan pada banyak kondisi lokal yang tidak sinkron

### Target hasil
- file ini menjadi trigger instan
- file ini tidak lagi menjadi pusat keputusan lock penuh

---

## 9. `LockScreenActivity.kt`

### Status
File lama, tetap dipakai sebagai layar lock penuh.

### Peran baru
- menampilkan lock screen penuh
- menerima alasan lock dari keputusan manager
- menyediakan jalur admin sah
- menyediakan jalur emergency sah

### Logika yang tetap boleh ada
- tampilan pesan lock
- admin unlock flow
- emergency unlock flow yang sah

### Logika yang harus dikurangi
- keputusan bisnis lock mandiri
- evaluasi state penguncian penuh secara terpisah
- pengulangan logika cooldown kiosk yang sama dengan file lain

### Target hasil
- `LockScreenActivity` fokus menjadi presentasi layar lock, bukan otak pengambilan keputusan

---

## 10. `PreferencesManager.kt`

### Status
File lama, tetap dipakai.

### Peran baru
- penyimpanan state persisten
- cache ringan
- sumber snapshot awal

### Data yang tetap relevan
- holiday mode
- protection active
- emergency unlock
- uninstall bypass
- settings grace
- foreground hints
- school zone
- attendance status
- school schedule cache

### Data yang perlu ditinjau
- cooldown kiosk
- timestamp perpindahan app
- flag yang selama ini membuat keputusan lock tersebar

### Target hasil
- file ini tidak lagi memegang terlalu banyak logika keputusan
- file ini hanya menyimpan data yang akan dibaca `LockStateManager`

---

## 11. `PermissionManager.kt`

### Status
Mungkin perlu sentuhan ringan.

### Tujuan
Memastikan state izin penggunaan HP mudah dibaca dari `LockStateManager`.

### Yang perlu dipastikan
- ada helper status izin aktif
- ada helper sisa waktu izin
- ada event atau callback saat izin aktif atau berakhir
- tidak ada keputusan lock utama di dalam manager izin ini

---

## 12. `OverlayLockActivity.kt`

### Status
Kemungkinan tetap dipakai.

### Tujuan
Menjadi salah satu jalur presentasi overlay jika memang pola sekarang masih cocok.

### Yang perlu dipastikan
- tampil cepat
- tidak tergantung logika lock terpisah
- hanya menerima instruksi tampil atau sembunyi

---

## 13. Urutan Refactor Paling Aman

### Langkah 1
Buat file baru:
- `LockStateManager.kt`
- `LockEnforcer.kt`
- `AllowedPackagesProvider.kt`
- `LockMetricsLogger.kt`
- `LockPolicy.kt`

### Langkah 2
Pindahkan whitelist ke `AllowedPackagesProvider`.

### Langkah 3
Buat evaluasi state murni di `LockStateManager`.

### Langkah 4
Sambungkan `AntiUninstallService` ke manager sebagai event trigger tercepat.

### Langkah 5
Sambungkan `MonitoringService` sebagai reconciler.

### Langkah 6
Sambungkan `MainActivity` ke manager untuk jalur lifecycle dan flow yang sah.

### Langkah 7
Pisahkan overlay dari cooldown kiosk lewat `LockEnforcer`.

### Langkah 8
Tambahkan metrik.

### Langkah 9
Bersihkan logika lama yang sudah tergantikan.

---

## 14. Risiko Per File

### `MainActivity.kt`
Risiko:
- terlalu banyak sisa logika lama

Mitigasi:
- pindahkan keputusan besar secara bertahap

### `MonitoringService.kt`
Risiko:
- tetap menjadi pusat lock diam-diam

Mitigasi:
- jadikan service ini hanya reconciler dan watchdog

### `AntiUninstallService.kt`
Risiko:
- false positive bila whitelist belum rapi

Mitigasi:
- pusatkan whitelist terlebih dahulu

### `LockScreenActivity.kt`
Risiko:
- lock screen masih membuat keputusan sendiri

Mitigasi:
- batasi hanya sebagai presenter dan jalur admin darurat

### `PreferencesManager.kt`
Risiko:
- state lama tetap saling bertabrakan

Mitigasi:
- audit key mana yang tetap dipakai dan mana yang perlu dipensiunkan

---

## 15. Kriteria Selesai
Refactor per file dianggap sukses jika:
- tanggung jawab tiap file menjadi jelas,
- keputusan lock final hanya keluar dari `LockStateManager`,
- overlay selalu bisa aktif tanpa menunggu kiosk,
- `MonitoringService` tetap hidup sebagai watchdog,
- dan seluruh jalur lock lebih mudah dipahami saat dibaca developer lain.
