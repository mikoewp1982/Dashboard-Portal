# 🛡️ KATALOG FITUR STABIL & FILE SAKRAL (FROZEN CORE)
> **PANDUAN MUTLAK BAGI DEVELOPER & AI ASSISTANT**  
> Dibuat: 2026-09-18 | Status: **ENFORCED & AUTO-VERIFIED**

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

### 2. EduLock Master Switch & Background Wakeup FCM
- **File Sakral:**
  - `web/src/lib/admin/edulockMasterSwitch.ts`
  - `web/src/lib/admin/edulockFindDevice.ts`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/EduLockMessagingService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- **Rumus Mutlak:**
  - TTL FCM Master Switch: **minimal 86400 detik (24 jam)**.
  - TTL FCM Find Device: **minimal 300 detik (5 menit)**.
  - Android FCM Service: Menggunakan **Partial WakeLock 30 detik**, notifikasi instan prioritas tinggi (mencegah kuota FCM high-priority Android dipangkas OS), serta fallback alarm watchdog.
- **Aturan Terlarang:**
  - ❌ **DILARANG MENURUNKAN TTL** menjadi 60 detik (seperti build 77 lama yang menyebabkan HP tidur pulas 5 hari tidak bisa dibangunkan admin).

---

### 3. Aksesibilitas Android 13+ & Bypass Setelan Dibatasi (Titik 3)
- **File Sakral:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `web/src/app/edulock/install/page.tsx`
- **Rumus Mutlak:**
  - Alur 2-langkah: Tombol **Langkah 1: Info Aplikasi** (langsung membuka halaman detail aplikasi untuk klik titik 3 "Izinkan setelan terbatas") lalu **Langkah 2: Aksesibilitas**.
  - Grace period 5 menit (300.000 ms) saat membuka settings recovery agar siswa tidak terkunci di tengah proses izin.
- **Aturan Terlarang:**
  - ❌ Dilarang menghapus tombol *Info Aplikasi* atau memperpendek grace period.

---

### 4. Perbedaan UI GAS Guru vs GAS Siswa (HARAM DISAMAKAN)
- **File Sakral:**
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
- **Rumus Mutlak:**
  - **GAS SISWA:** 4 kolom kartu kecil + Bottom Navigation Bar 3 tab (Beranda / Absen hitam floating tengah / Profil).
  - **GAS GURU:** 2 kolom kartu BESAR glassmorphism 2 baris (label di dalam pill). **HARAM ADA BOTTOM NAVIGATION BAR 3 TAB**.
- **Aturan Terlarang:**
  - ❌ Dilarang mencontek style Siswa ke Guru atau sebaliknya (Insiden 2026-08-28 build 1048-1050).

---

### 5. Batas Waktu Sholat Dzuhur Pukul 15.00
- **File Sakral:**
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentPrayerScreen.kt`
- **Rumus Mutlak:**
  - Presensi sholat Dzuhur ditutup otomatis pukul 15.00 jika waktu tidak di-override oleh web admin. Lewat pukul 15.00, tombol presensi terkunci.

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
