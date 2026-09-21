# Catatan Progres EduLock v1.3.56 (82) — Penutupan Bug Laten Sabtu & Split-Brain Listener

**Tanggal:** 21 September 2026  
**Versi APK:** `v1.3.56 (82)`  
**SHA-256 APK:** `94CD8684D3817B477E6C9931E1165D3F56417FA3CCD37501CD5E287B4D9A4F72`  
**Lokasi Distribusi:** `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.56-82.apk`  
**Alias:** `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk`  

---

## 1. Latar Belakang Masalah
Tim Bug Hunter menemukan potensi celah laten (*latent bug*) pada evaluasi jam sekolah hari Sabtu:
1. **Fallback Sabtu Sekolah:** `SchoolScheduleManager` meng-hardcode `"sat" to DaySchedule(true, ...)` di fallback bawaan. Pada sekolah 5 hari kerja (Senin–Jumat), key `sat` yang absen di Firebase RTDB secara sepihak dilengkapi oleh kode APK menjadi hari sekolah aktif.
2. **Penghapusan Cache di Layar Utama:** `MainActivity.kt` mendengarkan path lama `schools/{id}/schedule/weekdays`. Jika parse error atau data kosong, cache di-wipe (`prefsManager.weekdayScheduleJson = ""`), memaksa sistem jatuh ke fallback lokal Sabtu aktif.
3. **Split-Brain Dua Listener di Background Service:** `MonitoringService.kt` mendengarkan path lama (`schedule/weekdays`) dan path baru (`school_settings/.../attendance/schedules`). Keduanya menulis ke `weekdayScheduleJson` tanpa sinkronisasi/prioritas. Jika path lama tertinggal/kosong, ia menimpa jadwal valid dari path baru.

---

## 2. Perubahan Kode Sumber yang Diterapkan

### A. `SchoolScheduleManager.kt`
- Mengubah `fallbackMap` untuk `"sat"` menjadi `DaySchedule(false, "00:00", "14:00")` (default libur, sama seperti Minggu).
- Memastikan `optBoolean("enabled", k != "sun" && k != "sat")` default false untuk Sabtu jika atribut tidak ada.
- Memperbaiki fallback `isEffectiveSchoolDayToday()` agar Sabtu dan Minggu default false jika jadwal tidak ditemukan.

### B. `MainActivity.kt`
- Menghapus baris penghapusan cache `prefsManager.weekdayScheduleJson = ""` pada blok catch `weekdayScheduleListener`.
- Menambahkan penjagaan `if (root.length() > 0)` sebelum menulis ke PreferencesManager.
- Mengubah default boolean enabled Sabtu menjadi false jika node atribut tidak lengkap.

### C. `MonitoringService.kt`
- Menambahkan pengecekan prioritas pada `startWeekdayScheduleListener`: jika cache lokal sudah berisi jadwal lengkap ($\ge$ jumlah hari yang diterima), snapshot path lama yang kosong atau tidak lengkap **dilarang menimpa cache**.
- Menyelaraskan `isHoliday` pada `startSchoolSettingsScheduleListener` agar memeriksa `dayKey == "sun" || dayKey == "sat"`.

---

## 3. Hasil Build & Verifikasi
- **Gradle Task:** `:app:assembleStudentRelease`
- **Status Build:** `BUILD SUCCESSFUL in 2m 58s` (49 actionable tasks: 25 executed, 24 up-to-date)
- **R8 / Minify / Shrink Resources / Validate Signing:** ALL PASS (lulus 100%)
- **Ukuran File APK:** 3.975.209 bytes (~3.79 MB)
- **SHA-256:** `94CD8684D3817B477E6C9931E1165D3F56417FA3CCD37501CD5E287B4D9A4F72`
