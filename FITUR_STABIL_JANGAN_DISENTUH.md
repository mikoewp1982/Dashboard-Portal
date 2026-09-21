# 🛡️ KATALOG FITUR STABIL & FILE SAKRAL (FROZEN CORE)
> **PANDUAN MUTLAK BAGI DEVELOPER & AI ASSISTANT**  
> Terakhir Diperbarui: 2026-09-18 | Status: **ENFORCED & AUTO-VERIFIED**

Dokumen ini adalah **kontrak mati** yang mengatur fitur-fitur yang sudah **100% SELESAI, AMAN, DAN TERUJI DI LAPANGAN**. 

Siapa pun yang mengerjakan task baru pada **Web Admin**, **APK GAS Siswa/Guru**, maupun **APK EduLock** **DILARANG KERAS** memodifikasi, me-refactor, atau mengubah logika pada file-file yang tercantum di bawah ini, kecuali ada **permintaan eksplisit dan tertulis** dari pengguna.

---

## 🚫 ATURAN UTAMA SEBELUM COMMIT & PUSH

1. **Strict Scope Isolation**: Kerjakan **HANYA** file yang berhubungan langsung dengan request user. Jangan pernah "merapikan", "menyederhanakan", atau "menyamakan" file lain di luar konteks.
2. **Cek Git Diff Sebelum Commit**: Selalu jalankan `git diff --stat` sebelum `git add`. Jika ada file dari *Daftar File Sakral* yang ikut terubah tanpa diminta, **SEGERA REVERT (`git checkout -- <file>`)**.
3. **Automated Verification Gate**: Script `web/scripts/verify-critical-rules.mjs` terpasang pada `npm run build`. Jika ada logika sakral yang dilanggar, build akan **OTOMATIS GAGAL (CRASH)** dan deploy terblokir.

---

## 📌 DAFTAR FITUR SAKRAL & LOGIKA TERLARANG DIUBAH

### 1. Virtual Pet Death & Revive Logic (Web & APK)
- **File Sakral:**
  - `web/src/lib/guru/petStatus.ts`
  - `web/src/components/gas/virtual-pet/GasPetRiskTab.tsx`
  - `web/src/components/gas/virtual-pet/petUtils.ts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/VirtualPet.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- **Rumus Mutlak di Web:**
  ```typescript
  return isMarkedDead || health <= 0 || lowest <= 0;
  ```
- **Aturan Terlarang:**
  - ❌ **DILARANG MENGGANTI** rumus menjadi `isMarkedDead && (...)`!
  - ❌ **ALASAN HISTORIS (Insiden 2026-09-18):** Di database RTDB, pet yang kelaparan/tidak disentuh berstatus teks `"SICK"`. Jika disyaratkan `isMarkedDead && (...)`, pet vitals 0% (Kenyang 0%, Bahagia 0%, Energi 0%) akan dicap "Sekarat" dan tombol "Hidupkan" hilang dari Web Admin, padahal di HP siswa APK sudah mengunci layar meminta revive.
  - ✅ Tombol **`⚡ Hidupkan`** di `GasPetRiskTab.tsx` **WAJIB SELALU TERSEDIA** untuk pet berstatus **Mati** maupun **Sekarat**.

---

### 2. EduLock di Rumah: "Fail-Open (Hening Total Bebas Gangguan)"
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/GpsEnableOverlay.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SchoolScheduleManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
- **Rumus Mutlak:**
  - **Di Rumah / Luar Radius Sekolah = HP Bebas 100%:** Siswa di luar radius sekolah (>1km, rumah, 0 presence) **TIDAK BOLEH terkunci** oleh EduLock (bebas buka WhatsApp, TikTok, YouTube, Instagram, dll.).
  - **Jam Sekolah Saja Tidak Cukup:** `shouldAllowKioskAtSchool()` mewajibkan gate presence fisik di sekolah. Jam efektif tanpa bukti lokasi di sekolah **HARAM** mengunci HP.
  - **GPS Mati di Rumah:** **DILARANG KERAS** memunculkan overlay *"Aktifkan GPS"* maupun mengunci HP (gate `hasPresence` di `GpsEnableOverlay.kt`).
  - **Pulang Lebih Awal:** Sticky flag `isInsideSchoolZone` otomatis di-reset ke `false` setelah 30 menit berada di luar radius sekolah (`lastInsideSchoolZoneAt`).
  - **Akhir Pekan (Sabtu/Minggu Offline):** Fallback offline wajib `sat.enabled = false` dan `sun.enabled = false` agar saat offline di rumah tidak salah mengira hari aktif.

---

### 3. Overlay Virtual Pet Mati di EduLock (Satu-satunya Pengecualian di Rumah)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
  - `native-mobile-edulock/app/src/main/res/layout/activity_pet_dead_lock.xml`
- **Rumus Mutlak:**
  - **Waktu Muncul:** **HANYA aktif di luar jam sekolah / saat di rumah**. Begitu jam sekolah masuk, overlay pet mati otomatis ditutup agar tidak mengganggu belajar.
  - **Bukan Kunci Permanen (Pengingat Berkala):** Mengikuti interval admin `first → second → repeat` (misal 30m → 20m → tiap 10m). Saat pet baru mati, overlay menunggu interval pertama (tidak langsung muncul instan).
  - **Tombol "Saya Mengerti" WAJIB BISA DI-KLIK:**
    - Saat di-tap, overlay **wajib menutup sementara** dan kiosk dilepas agar HP bisa digunakan normal sampai reminder berikutnya tiba.
    - **Debounce 2 Detik:** Proteksi tap berulang (`UNDERSTOOD_CLICK_DEBOUNCE_MS = 2000`) agar tap cepat tidak melompati interval counter.
  - **Proteksi Tombol HOME HP:** Jika siswa menekan tombol HOME, flag `isShowing` otomatis di-reset (`onUserLeaveHint`) agar interval berikutnya tetap muncul (tidak hilang selamanya).
  - **Teks Verbatim:** Sapaan memuat nama siswa asli dan catatan merah:  
    `Catatan : \n jika tidak segera di hidupkan maka sistem akan mengingatkan sampai pet anda hidup kembali`
  - **Auto-Dismiss Saat Revive:** Jika admin menekan *"Hidupkan"* di Web Admin, overlay pet mati di HP siswa otomatis tertutup seketika (`finishPetDeadLock()`).

---

### 4. Pemisahan 3 Jalur: Internet Offline vs Mode Pesawat vs GPS Mati
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OfflineMonitor.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockScreenActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/GpsEnableOverlay.kt`
- **Rumus Mutlak:**
  - **Internet Offline Biasa (Bukan Mode Pesawat):**
    - **Fail-safe 2 menit DIHAPUS TOTAL** (Keputusan User 2026-09-03).
    - Tidak boleh ada overlay merah *"KONEKSI HILANG!"*, tidak ada toast countdown *"Internet mati. Lockdown dalam X detik"*. Offline tidak menambah enforcement baru.
  - **Mode Pesawat (`AIRPLANE_MODE_ON == 1`) Saat Jam Sekolah:**
    - **TETAP DIKUNCI / LOCKDOWN KERAS MERAH** untuk mencegah bypass mematikan seluruh radio.
    - Pengecualian: Hanya jika Web Admin mengaktifkan **Mode Libur (Holiday Mode)**.
  - **GPS Mati di Area Sekolah Saat Jam Sekolah:**
    - Wajib memunculkan **Overlay Recovery GPS** (*"GPS MATI DI AREA SEKOLAH"*) + tombol *"Buka Pengaturan Lokasi"*.
    - **DILARANG LANGSUNG MEMASANG KIOSK LOCKSCREEN MERAH**, agar siswa bisa membuka menu pengaturan HP untuk menyalakan GPS.

---

### 5. Transisi EduLock → GAS Siswa (Anti-Kickback & 0 Frame Home)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/AllowedPackagesProvider.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockPolicy.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/ScreenReceiver.kt`
- **Rumus Mutlak:**
  - **0 Frame Launcher Home:** Tidak boleh ada sekilas frame layar beranda/desktop HP terlihat di tengah transisi.
  - **0 Keyguard PIN/Pola:** Tidak boleh memicu layar kunci PIN/Pola HP.
  - **Anti-Kickback:** Aplikasi GAS harus menetap di layar, **tidak boleh ditendang balik ke EduLock** di detik ke 1–5 (pelepasan kiosk dikawal lifecycle `onStop`).
  - **OEM Whitelist:** Komponen pembantu vendor (Keyboard Vivo/Xiaomi, Navigasi Gestur, System UI, WebView) masuk ke `alwaysAllowedPrefixes` agar tidak dianggap aplikasi terlarang.

---

### 6. Anti-Uninstall & Anti-Deactivation Device Admin 24/7/365
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
  - `native-mobile-edulock/app/src/main/res/xml/device_admin.xml`
- **Rumus Mutlak:**
  - Logika anti-uninstall **berjalan 24 jam sehari, 7 hari seminggu, tidak terikat jam sekolah maupun geofence**.
  - Setiap upaya membuka Device Admin EduLock, detail aplikasi EduLock (Paksa Berhenti / Copot Pemasangan), atau dialog uninstall EduLock **wajib seketika ditendang keluar**.
  - Daftar aplikasi umum lainnya di HP tetap boleh dibuka dan dikelola oleh siswa di rumah.

---

### 7. EduLock Master Switch & Background Wakeup FCM
- **File Sakral:**
  - `web/src/lib/admin/edulockMasterSwitch.ts`
  - `web/src/lib/admin/edulockFindDevice.ts`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/EduLockMessagingService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- **Rumus Mutlak:**
  - TTL FCM Master Switch: **minimal 86400 detik (24 jam)**.
  - TTL FCM Find Device: **minimal 300 detik (5 menit)**.
  - Android FCM Service: Menggunakan **Partial WakeLock 30 detik**, notifikasi instan prioritas tinggi (mencegah kuota FCM high-priority Android dipangkas OS), serta fallback alarm watchdog.
  - ❌ **DILARANG MENURUNKAN TTL** menjadi 60 detik (seperti build 77 lama yang menyebabkan HP tidur pulas 5 hari tidak bisa dibangunkan admin).

---

### 8. Aksesibilitas Android 13+ & Bypass Setelan Dibatasi (Titik 3)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `web/src/app/edulock/install/page.tsx`
- **Rumus Mutlak:**
  - Alur 2-langkah: Tombol **Langkah 1: Info Aplikasi** (langsung membuka halaman detail aplikasi untuk klik titik 3 "Izinkan setelan terbatas") lalu **Langkah 2: Aksesibilitas**.
  - Grace period 5 menit (300.000 ms) saat membuka settings recovery agar siswa tidak terkunci di tengah proses izin.
  - ❌ Dilarang menghapus tombol *Info Aplikasi* atau memperpendek grace period.

---

### 9. Perbedaan UI GAS Guru vs GAS Siswa (HARAM DISAMAKAN)
- **File Sakral:**
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
- **Rumus Mutlak:**
  - **GAS SISWA:** 4 kolom kartu kecil + Bottom Navigation Bar 3 tab (Beranda / Absen hitam floating tengah / Profil). Background slate-indigo gelap.
  - **GAS GURU:** 2 kolom kartu BESAR glassmorphism 2 baris (label di dalam pill transluscent). **HARAM ADA BOTTOM NAVIGATION BAR 3 TAB**. Background gradien teal tua → navy.
  - ❌ Dilarang mencontek style Siswa ke Guru atau sebaliknya (Insiden 2026-08-28 build 1048-1050).

---

### 10. Anti-Tamper Waktu & Zona Waktu (Kasus Tecno Pova)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SchoolScheduleManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- **Rumus Mutlak:**
  - Evaluasi jadwal sekolah dan status jam mengacu pada **WIB (`Asia/Jakarta`)** dan stempel waktu server Firebase (`.info/serverTimeOffset`).
  - Manipulasi jam HP manual (misal ubah siang 12.48 PM jadi 00.48 AM) tetap terbaca siang dan **tetap terkunci secara tegas di sekolah (06.00–15.00)**.

---

### 11. Batas Waktu Sholat Dzuhur Pukul 15.00
- **File Sakral:**
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentPrayerScreen.kt`
- **Rumus Mutlak:**
  - Presensi sholat Dzuhur ditutup otomatis pukul 15.00 jika waktu tidak di-override oleh web admin. Lewat pukul 15.00, tombol presensi terkunci merah dengan keterangan jelas.

---

### 12. Aturan Hari Libur Virtual Pet (GAS Siswa)
- **File Sakral:**
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PresensiRuleUtils.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
- **Rumus Mutlak:**
  - Pada hari libur / Minggu: 4 Vitals Pet (Kenyang, Energi, Kesehatan, Kebahagiaan) **TIDAK DIKURANGI / BEBAS PENALTI**.
  - Fitur **Holiday Bonus E-Perpus**: Membaca buku $\ge 30$ menit di hari libur tetap bisa diklaim untuk bonus **+10 Kecerdasan (Intelligence)**.

---

### 13. Hak Tertinggi Super Admin & Presensi Final Langsung
- **File Sakral:**
  - `web/src/app/api/admin/override/route.ts`
  - `web/src/app/api/attendance/route.ts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- **Rumus Mutlak:**
  - **Admin Override:** Tombol *Force Lock* dan *Force Unlock* per siswa di Web Admin memiliki hak tertinggi yang mengalahkan status geofence dan jam di HP.
  - **Presensi Final Langsung:** Input presensi oleh Wali Kelas dan Sekretaris Kelas berstatus **Final Langsung** (tidak memerlukan tombol verifikasi/approval bertahap).

---

### 14. Integritas Sinkronisasi Jadwal SSOT & Sabtu Libur (Build 83+)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SchoolScheduleManager.kt`
  - `native-mobile-edulock/app/src/test/java/com/sekolah/edulock/SchoolScheduleManagerTest.kt`
- **Rumus Mutlak:**
  - **SSOT Provenance Tagging:** Path modern `school_settings/{schoolId}/attendance/schedules` adalah Single Source of Truth (SSOT) mutlak bertanda `SOURCE_ATTENDANCE_SCHEDULES`.
  - **Dilarang Overwrite:** Path lama `schools/{schoolId}/schedule/weekdays` **DIHARAMKAN MENIMPA** jika cache sudah berstatus `SOURCE_ATTENDANCE_SCHEDULES`. Heuristik cacat perbandingan jumlah kunci (`root.length() >= existing.length()`) DILARANG dihidupkan kembali karena merusak sekolah 5 hari kerja.
  - **Penjinakan Penulis Liar MainActivity:** `MainActivity.startWeekdayScheduleListener` dilarang menulis ke cache jika status sudah `SOURCE_ATTENDANCE_SCHEDULES`.
  - **Sabtu & Minggu Default Libur:** Nilai fallback internal `"sat"` dan `"sun"` wajib default `enabled = false`. Hari yang tidak diisi admin di web dilarang disulap menjadi hari sekolah aktif.
  - **Unit Test Otomatis Wajib Lulus:** Seluruh unit test di `SchoolScheduleManagerTest.kt` wajib 100% lulus sebelum build APK.

---

## 📝 PROSEDUR WAJIB BAGI DEVELOPER / AI SAAT ADA TASK BARU

1. **Sebelum mengetik kode:**
   - Baca dokumen ini untuk memastikan file yang akan disentuh bukan bagian dari *Frozen Core*.
2. **Saat mengedit kode:**
   - Hanya edit fungsi/komponen yang diminta.
3. **Sebelum melakukan build/commit:**
   - Jalankan pemeriksaan:
     ```powershell
     cd "d:\Dashboard Portal\web"
     node ./scripts/verify-critical-rules.mjs
     ```
   - Jalankan `git diff --stat` untuk audit file yang berubah.
4. **Setelah push:**
   - Pastikan Firebase App Hosting hijau dan verifikasi live.
