# Catatan Progres EduLock v1.3.57 (83) — Penerapan SSOT Provenance, Penjinakan Rogue Writer, dan Unit Test Regresi

**Tanggal:** 21 September 2026  
**Versi APK:** `v1.3.57 (83)`  
**SHA-256 APK:** `C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`  
**Lokasi Distribusi:** `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.57-83.apk`  
**Alias:** `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk`  

---

## 1. Latar Belakang Masalah (Evaluasi Tim Bug Hunter)
Tim Bug Hunter menemukan 4 celah fundamental pada penanganan jadwal di Build 82:
1. **MainActivity Masih Menjadi Penulis Liar (*Rogue Writer*):** Saat UI dibuka, listener path lama di Activity langsung mengeksekusi *write* ke cache PreferencesManager tanpa koordinasi dengan Service.
2. **Prioritas Heuristik Jumlah Kunci Cacat:** `root.length() >= existing.length()` membuat path lama 7 hari (Mon-Sun) tetap menimpa jadwal sah admin 5 hari (Mon-Fri) karena 7 >= 5 bernilai true.
3. **Ketiadaan Tanda Asal Data (*Provenance Tag*):** Cache jadwal hanya satu string JSON polos tanpa metadata siapa pemilik aslinya.
4. **Ketiadaan Unit Test Nyata:** `ExampleUnitTest` masih berupa template bawaan `2 + 2 = 4`.

---

## 2. Solusi Arsitektural yang Diterapkan di Build 83

### A. Provenance Tagging di `PreferencesManager.kt`
- Menambahkan key `KEY_WEEKDAY_SCHEDULE_SOURCE` dan properti `weekdayScheduleSource`.
- Dua konstanta status sumber:
  - `SOURCE_ATTENDANCE_SCHEDULES`: Data sah dari Web Admin / GAS modern.
  - `SOURCE_LEGACY_WEEKDAYS`: Data cermin kompatibilitas lama.

### B. Aturan Mutlak SSOT (Single Source of Truth) di `MonitoringService.kt`
- Path modern (`school_settings/{id}/attendance/schedules`) menyetel sumber sebagai `SOURCE_ATTENDANCE_SCHEDULES`.
- Path lama (`schools/{id}/schedule/weekdays`) **DIHARAMKAN MENIMPA** jika `prefsManager.weekdayScheduleSource == SOURCE_ATTENDANCE_SCHEDULES`.

### C. Penjinakan Penulis Liar di `MainActivity.kt`
- Menambahkan guard yang sama di `startWeekdayScheduleListener()`: Jika sumber data sudah `SOURCE_ATTENDANCE_SCHEDULES`, listener path lama di Activity dilarang menulis ke cache, hanya menyegarkan UI.

### D. Unit Test Nyata di `SchoolScheduleManagerTest.kt`
Menambahkan pengujian otomatis JUnit:
1. `test_SabtuLibur_PadaSekolah5Hari_SaatKeySatTidakAda`: Memastikan Sabtu WAJIB libur (`enabled = false`) pada sekolah 5 hari.
2. `test_SabtuAktif_PadaSekolah6Hari_SaatKeySatEnabledTrue`: Memastikan Sabtu aktif (`enabled = true`) jika admin menyetel aktif.
3. `test_SabtuLibur_SaatCacheKosongFallback`: Memastikan fallback lokal saat offline/fresh install Sabtu tetap libur.
4. `test_SabtuLibur_SaatJSONCorrupt`: Memastikan ketahanan terhadap data rusak.
5. `test_SSOT_PrioritasSumberJadwal`: Memvalidasi aturan penolakan penimpaan dari path legacy.

---

## 3. Hasil Build & Verifikasi
- **Unit Test Task:** `:app:testStudentReleaseUnitTest` -> **PASSED (100% LULUS)**
- **Release Build Task:** `:app:assembleStudentRelease` -> **BUILD SUCCESSFUL in 1m 54s**
- **LintVital / R8 / Shrink / Signature:** ALL PASS (lulus 100%)
- **Ukuran File APK:** 3.975.511 bytes (~3.79 MB)
- **SHA-256:** `C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`
