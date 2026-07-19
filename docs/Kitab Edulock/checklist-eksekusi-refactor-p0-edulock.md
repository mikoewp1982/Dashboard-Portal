# Checklist Eksekusi Refactor P0 EduLock

## Tujuan
Dokumen ini adalah checklist kerja praktis untuk mengeksekusi fase `P0` pada refactor penguncian EduLock Siswa. Fokus P0 adalah membangun fondasi arsitektur baru tanpa langsung melebar ke fitur tambahan.

Target akhir P0:
- state penguncian sudah terpusat,
- event lock utama sudah instan,
- overlay tidak lagi tergantung cooldown kiosk,
- whitelist lebih rapi,
- dan sudah ada metrik dasar untuk mengukur delay nyata.

---

## Ruang Lingkup P0

Fase `P0` mencakup:
1. `LockStateManager`
2. trigger event-based via accessibility
3. pemisahan overlay dari cooldown `startLockTask()`
4. perapian whitelist package
5. pemasangan metrik dasar transisi

Fase `P0` belum fokus ke:
- final tuning debounce,
- mode `Soft` vs `Hard`,
- dashboard analitik penuh,
- optimasi OEM spesifik,
- dan polishing UI tambahan.

---

## Checklist P0.1 - Fondasi `LockStateManager`

### Desain awal
- [ ] Tentukan enum `LockState`
- [ ] Tentukan enum atau model `LockReason`
- [ ] Tentukan event input yang bisa mengubah state
- [ ] Tentukan prioritas state jika banyak kondisi aktif bersamaan
- [ ] Tentukan transisi state yang valid

### Implementasi file baru
- [ ] Buat file `LockStateManager.kt`
- [ ] Buat model snapshot kondisi runtime
- [ ] Buat fungsi `evaluateState(...)`
- [ ] Buat mekanisme publish state aktif
- [ ] Buat mekanisme log transisi state

### Integrasi awal
- [ ] Hubungkan `PreferencesManager` sebagai sumber data persisten
- [ ] Hubungkan status permission penggunaan HP
- [ ] Hubungkan status holiday mode
- [ ] Hubungkan status proteksi admin
- [ ] Hubungkan status uninstall bypass
- [ ] Hubungkan status emergency unlock
- [ ] Hubungkan status strict mode berbasis presensi

### Validasi
- [ ] Pastikan semua keputusan lock besar tidak lagi di-hardcode terpisah di banyak file
- [ ] Pastikan state bisa dipanggil dari activity, service, dan accessibility
- [ ] Pastikan state terbaru bisa dibaca tanpa race condition kasar

---

## Checklist P0.2 - Trigger Event-Based dari Accessibility

### Desain
- [ ] Tetapkan `TYPE_WINDOW_STATE_CHANGED` sebagai event utama
- [ ] Tentukan format payload event package aktif
- [ ] Tentukan package whitelist dari satu sumber terpusat
- [ ] Pastikan callback accessibility tidak berisi I/O berat

### Implementasi
- [ ] Refactor `AntiUninstallService.kt` atau buat service lock khusus
- [ ] Kirim package aktif ke `LockStateManager`
- [ ] Tambahkan guard untuk `settings grace`
- [ ] Tambahkan guard untuk `device admin request`
- [ ] Tambahkan guard untuk `permission active`
- [ ] Tambahkan guard untuk `holiday mode`
- [ ] Tambahkan guard untuk `uninstall bypass`

### Validasi
- [ ] Pastikan pergantian ke app tak diizinkan langsung memicu evaluasi state
- [ ] Pastikan membuka app sekolah yang sah tidak memicu false lock
- [ ] Pastikan keyboard dan package sistem minimum tidak ikut diblok

---

## Checklist P0.3 - Pisahkan Overlay dari Cooldown Kiosk

### Desain
- [ ] Tentukan bahwa overlay adalah respon pertama
- [ ] Tentukan bahwa kiosk adalah percobaan tambahan
- [ ] Tentukan cooldown khusus untuk `startLockTask()`
- [ ] Pastikan overlay tidak membaca cooldown kiosk

### Implementasi
- [ ] Buat `LockEnforcer.kt` atau helper enforcement baru
- [ ] Pindahkan logika `showOverlayImmediately()`
- [ ] Pindahkan logika relaunch EduLock
- [ ] Pindahkan logika percobaan `startLockTask()`
- [ ] Tambahkan verifikasi keberhasilan kiosk
- [ ] Tambahkan logging gagal kiosk

### Validasi
- [ ] Saat kiosk gagal, overlay tetap muncul
- [ ] Saat kiosk cooldown aktif, overlay tetap muncul
- [ ] Saat siswa coba lolos lagi, overlay kembali aktif tanpa menunggu 60 detik

---

## Checklist P0.4 - Rapikan Whitelist Package

### Desain
- [ ] Buat satu sumber whitelist package
- [ ] Bedakan whitelist tetap dan whitelist kondisional
- [ ] Definisikan paket yang hanya boleh lolos saat bypass uninstall aktif
- [ ] Definisikan paket keyboard yang sah

### Implementasi
- [ ] Buat `AllowedPackagesProvider.kt`
- [ ] Pindahkan daftar package dari `MainActivity`
- [ ] Pindahkan daftar package dari `MonitoringService`
- [ ] Pindahkan daftar package dari `AntiUninstallService`
- [ ] Tambahkan helper `isAllowedPackage(...)`

### Validasi
- [ ] Tidak ada duplikasi daftar whitelist yang rawan beda perilaku
- [ ] Semua jalur lock memakai sumber whitelist yang sama

---

## Checklist P0.5 - Metrik Dasar

### Titik metrik minimum
- [ ] `event_received`
- [ ] `overlay_shown`
- [ ] `app_relaunched`
- [ ] `locktask_confirmed`

### Implementasi
- [ ] Buat `LockMetricsLogger.kt`
- [ ] Catat timestamp event accessibility
- [ ] Catat timestamp overlay benar-benar tampil
- [ ] Catat timestamp relaunch EduLock
- [ ] Catat timestamp kiosk sukses bila ada
- [ ] Catat error bila salah satu langkah gagal

### Validasi
- [ ] Metrik tercatat pada jalur sukses
- [ ] Metrik tetap tercatat pada jalur kiosk gagal
- [ ] Data cukup untuk tahu titik delay terbesar

---

## File yang Perlu Disentuh Saat P0

### File baru
- [ ] `LockStateManager.kt`
- [ ] `LockEnforcer.kt`
- [ ] `LockMetricsLogger.kt`
- [ ] `AllowedPackagesProvider.kt`

### File lama
- [ ] `MainActivity.kt`
- [ ] `MonitoringService.kt`
- [ ] `AntiUninstallService.kt`
- [ ] `LockScreenActivity.kt`
- [ ] `PreferencesManager.kt`

---

## Urutan Eksekusi Yang Disarankan

1. Buat `LockStateManager`
2. Buat `AllowedPackagesProvider`
3. Buat `LockEnforcer`
4. Sambungkan accessibility event ke state manager
5. Sambungkan activity dan service ke state manager
6. Pisahkan overlay dari cooldown kiosk
7. Tambahkan metrik dasar
8. Bersihkan logika lama yang tumpang tindih
9. Uji skenario inti

---

## Checklist Uji Minimum Setelah P0

### Jalur lock
- [ ] Tekan Home saat strict mode aktif
- [ ] Buka Recent Apps saat strict mode aktif
- [ ] Buka app non-whitelist saat strict mode aktif

### Jalur aman
- [ ] Buka GAS Siswa dari EduLock
- [ ] Aktifkan izin penggunaan HP
- [ ] Buka Settings saat `settings grace` aktif
- [ ] Jalankan uninstall flow saat bypass uninstall aktif

### Jalur kegagalan
- [ ] Simulasikan `startLockTask()` gagal
- [ ] Pastikan overlay tetap jadi tameng utama
- [ ] Pastikan relaunch tetap berjalan

---

## Kriteria P0 Dianggap Selesai
- [ ] `LockStateManager` sudah menjadi pusat keputusan lock
- [ ] event accessibility sudah menjadi jalur trigger tercepat
- [ ] overlay tidak lagi tertahan cooldown kiosk
- [ ] whitelist sudah satu sumber
- [ ] metrik dasar sudah tercatat
- [ ] uji inti lolos tanpa regresi fatal

---

## Catatan Eksekusi
- Jangan langsung menghapus seluruh logika lama sebelum jalur baru stabil.
- Pertahankan `MonitoringService` sebagai watchdog dan reconciler.
- Hindari refactor terlalu besar dalam satu langkah tanpa checkpoint uji.
- Utamakan perubahan yang membuat sistem lebih responsif tanpa mengorbankan keselamatan operasional.
