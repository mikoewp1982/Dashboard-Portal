# Release Process EduLock Siswa

Dokumen ini adalah alur build release yang sesuai kondisi **EduLock siswa** saat ini.

## 1. Variant yang Dicatat
- `student` untuk APK siswa

Varian `admin` tidak menjadi fokus pegangan ini karena operasionalnya diperlakukan sebagai wrapper web.

## 2. Versi distribusi terkini
- `versionName = 1.3.57`
- `versionCode = 83`
- Arsip versioned V2 aktif (SSOT Provenance Jadwal, Anti Rogue Writer, & Unit Test): `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.57-83.apk`
  - SHA256: **`C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`**
  - Build chain verified: ✅ `testStudentReleaseUnitTest` (100% 5/5 LULUS) + `assembleStudentRelease` lulus (1m 54s, 3.975.511 bytes), artefak versioned + alias + sidecar hash sinkron.
  - Status lapangan: Siap diuji oleh Tim Bug Hunter (bebas false school time hari Sabtu).
- Alias Final V2: `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk`
  - SHA256: **`C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`** (sama dengan versioned 83, verified match)
- Sidecar SHA256 versioned: `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.57-83.apk.sha256` (diperbarui ke C60E3FE9)
- Sidecar SHA256 alias: `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk.sha256` (diperbarui ke C60E3FE9)
- Artefak rollback L-1 (hardening FCM & Deep Sleep 1.3.55-81): `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.55-81.apk`
  - SHA256: **`8284433FA34678F3603D7CDEA2D71EBFBB48F541AA84107EF12B78B1FCB32E81`**
- Artefak rollback L-2 (aksesibilitas Android 13+ 1.3.54-80): `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.54-80.apk`
  - SHA256: **`15EC6B3169FB39365147AB157DBEB09C969D6E4BB94F68941043CC91D18C7B3B`**
- Artefak rollback L0 (build stabil tombol Home 1.3.51-77): `.dbg\EduLock_V2-1.3.51-77_964E97FE.apk`
  - SHA256: **`964E97FEAF1662C4177481368AF9EF7EABB602A90C73E2D57D16CB994E7850BB`**
- Artefak rollback L1 (build Tecno initial 1.3.51-77): `.dbg\EduLock_V2-1.3.51-77_A2C641B1.apk`
  - SHA256: **`A2C641B1C08C1470641160515310E5CB47AB0422D3568B92CCD5B09D5D6D6DDC`**
- Artefak rollback L2 (anti-uninstal 1.3.51-77): `D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.51-77.apk`
  - SHA256: **`3AD1DC72319A12AB7EA3F492A26EE100572E701CBF00A2875600CD6368EF8631`**
- Artefak rollback L3 (build aktif runtime hardening 1.3.50-76): `.dbg\EduLock_V2-1.3.50-76_DEB7F974.apk`
  - SHA256: **`DEB7F974782ACFB49F2A12884BB04E60EE6933A058CB0339A727699D7C065163`**
- Artefak rollback L4 (Hotfix 8 transisi GAS live sekolah): `.dbg\EduLock_V2-1.3.50-76_79637CA2.apk`
  - SHA256: **`79637CA2E24EDA3189BDF87972EA9A8A00D611405689343EAB1CFCCC0737827E`**
- Artefak rollback L5 (Pre-Fix Transisi GAS — SHA FA5B8C39 live sekolah 10/10 R1-R10 LULUS): `.dbg\EduLock_V2-1.3.50-76_FA5B8C39.apk`
  - SHA256: **`FA5B8C3983C3E285149568462A08F57344482B56C8A587AA55EC4A44B21A886A`**

**Status unduhan web (`/e` dan `/edulock/install`):** catatan — deploy web DITUNDA sesuai instruksi user.

### Rilis Terkini (2026-09-21 09:25) — [RELEASE V2 v1.3.57 / 83] Penutupan Bug Laten Sabtu, SSOT Provenance, Penjinakan Penulis Liar MainActivity, dan Unit Test Regresi
- **Acuan Final V2 lokal saat ini:** build `1.3.57 (83)` dengan SHA **`C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`**.
- **Tujuan patch:** Menutup 4 celah laten pada evaluasi hari Sabtu yang ditemukan Tim Bug Hunter:
  1. Penulis liar `MainActivity` dilarang menimpa cache jika sumber sudah `SOURCE_ATTENDANCE_SCHEDULES`.
  2. Heuristik cacat jumlah kunci dicabut; diganti penegakan aturan mutlak SSOT (`attendance/schedules` = primary).
  3. `fallbackMap` dan `SchoolScheduleManager` memastikan Sabtu & Minggu default libur (`false`).
  4. Unit test JUnit 4 `SchoolScheduleManagerTest.kt` memvalidasi seluruh skenario jadwal dengan status lulus 100%.

### Rilis Terkini (2026-09-16 09:56) — [RELEASE V2 v1.3.52 / 78] Hardening Komprehensif Multi-OEM & Dual-Layer Watchdog AlarmManager
- **Acuan Final V2 lokal saat ini:** build `1.3.52 (78)` dengan SHA **`BE5FF4909FA3A2DBA78BF16243A4721E228FF740CA9D7A4036574898AC73A736`** (Short: `BE5FF490`).
- **Tujuan patch:** Mengatasi insiden di mana APK EduLock V2 saat diinstal di HP Tecno Pova tidak berfungsi sama sekali baik mode online maupun offline (tidak mengunci sama sekali).
- **Akar Masalah Tecno Pova & OEM Agresif:**
  1. HiOS / Phone Master membunuh background service tanpa izin Autostart.
  2. Task killer OS menidurkan WorkManager periodic 15 menit.
  3. Deteksi OEM EduLock belum mengenali merek Tecno/Infinix/itel/Transsion.
- **Perubahan Inti yang Dibawa:**
  1. **Dukungan Multi-OEM Lengkap (`EduLockOEMHardeningHelper.kt`):** Menambahkan 7 merek baru (`TECNO`, `ASUS`, `LENOVO`, `MEIZU`, `NOKIA`, `ZTE`, `SONY`), autostart intent spesifik tiap vendor, panduan pengaturan dalam bahasa Indonesia, dan generic scanner intent autostart/battery saver.
  2. **Dual-Layer Watchdog Mandiri (`WatchdogAlarmReceiver.kt`):** Interval 2 menit via `AlarmManager.setAndAllowWhileIdle()` (tahan mode Doze). Memantau detak jantung `runtimeLastServiceHeartbeatAt` dari `MonitoringService.performChecks()`. Jika terhenti > 90 detik, service dibangkitkan ulang seketika.
  3. **Penjadwalan Watchdog Menyeluruh:** Diaktifkan pada `MonitoringService.onCreate()`, `performChecks()`, `onDestroy()`, `BootReceiver` (termasuk boot vendor QuickBoot/Reboot), `ScreenReceiver` (saat layar hidup), dan saat selesai di `SetupActivity`.
  4. **Telemetri Hardware RTDB (`FirebaseReporter.kt`):** Melaporkan `deviceManufacturer`, `deviceBrand`, `deviceModel`, `deviceSdk`, `deviceRelease`, `isUnknownOEM` ke node `active_devices`. Mengirim audit event `unknown_oem_detected` jika ada perangkat `STANDARD` tak dikenal.
  5. **UX Setup & First-Run:** Kartu panduan OEM di `SetupActivity` selalu ditampilkan untuk semua brand; dialog panduan Recent Apps lock muncul di `MainActivity` pada pembukaan perdana pasca setup.
- **Build:** `.\gradlew.bat :app:assembleStudentRelease` -> **BUILD SUCCESSFUL in 1m 55s**. Triple-match SHA256 verified di `Final_V2` dan `.dbg/`.
- **Status verifikasi jujur:**
  ✅ Build release lulus
  ✅ Artefak aktif disalin ke `Final_V2` (versioned & alias) + `.dbg/`
  ✅ Sidecar .sha256 sinkron
  🟡 Menunggu uji lapangan HP fisik Tecno Pova

### Rilis Terkini (2026-09-07 02:00) — [RELEASE V2 v1.3.50 / 76] HOTFIX FINAL Parity Overlay Accessibility Stabil (Redirect OverlayLockActivity) + Cleanup 100% Debug Instrumentation + Warning Build Fix
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` tetap, artefak distribusi aktif diganti LAGI oleh clean rebuild hotfix FINAL runtime parity bug HP fisik VIVO V2030. Include SEMUA patch SHA 2F549340 (Pet Dead teks dinamis + HOME key fix), ditambah: (A) Redirect visual recovery Accessibility single-broken dari dialog putih (yang mudah tertimpa enforcement background) ke **`OverlayLockActivity` target `accessibility`** (bypass kiosk, jadi frontmost UI stabil). (B) Guard periodik enforcement Accessibility di `performChecks()` hanya relaunch EduLock jika `!isUiForeground` (tidak menimpa overlay recovery periodik). (C) Cleanup TOTAL instrumentation TRAE-debugger session `protection-order-spam` (helper `debugReportProtection` di MainActivity/MonitoringService + 13 call site + artefak .md/.env/.ndjson + server debug PID 5036). (D) Warning build cleanup 2 item (LockEnforcer else-if redundant selalu true + MainActivity unused variable `previousProtection`).
- **Acceptance final (3 iterasi retest HP fisik VIVO V2030 ID `92823913`)**: user verifikasi kata VERBATIM: **"Overlay muncul stabil"** ✅. Sebelumnya iterasi 1: "saya hidupkan proteksi malah edulock tidak mengunci" (regresi guard berlebih di `shouldDeferAggressiveLock()` → dicabut). Iterasi 2: "hp terkunci tidak muncul overlay apapun" (dialog putih tidak stays on top → ganti strategy redirect visual ke OverlayLockActivity + dismiss lockscreen lama + stop kiosk).
- **6 Patch root cause (4 file Kotlin):**
  1. **`MonitoringService.kt:L995-L1014` (performChecks branch Accessibility pending):** guard `protectionRecoveryPending (pendingA11y/pendingOem/dialogCooldown)` → jika `!isUiForeground` hanya `relaunchEduLock()` TANPA `showLockScreen()`, jika UiForeground skip total.
  2. **`MainActivity.kt:L1180-L1221` (onResume pendingA11y branch):** compliance check lama + dismiss lockscreen via `ACTION_DISMISS_LOCKSCREEN DISMISS_TARGET_ALL` + `stopKioskMode()` (try-catch aman) → langsung `showLockdownOverlay(msg, "accessibility")` visual frontmost.
  3. **`LockEnforcer.kt:L132-L178` (showRecoveryOverlay):** Accessibility recovery selalu `stopKiosk()` duluan; refactor branch fallback target != geofence dengan `fallback = mappedTarget == null` (hapus warning redundant else-if).
  4. **`LockEnforcer.kt:L200-L221` (relaunchEduLock):** cabut guard global `protectionPendingA11yRecovery/pendingOemRecovery` dari `shouldDeferAggressiveLock()` (regresi "edulock tidak mengunci" fix iterasi 1).
  5. **`MainActivity.kt:L651`:** hapus `previousProtection` unused variable (warning cleanup).
  6. **Cleanup instrumentation:** hapus SEMUA `#region debug-point` di MainActivity (helper + 4 call) & MonitoringService (helper + 9 call).
- **Build bersih final:** `.\gradlew.bat clean assembleStudentRelease --no-daemon` → **BUILD SUCCESSFUL in ~3m** (51 tasks: 49 executed, 2 up-to-date). lintVital PASS. R8 minify + shrinkResources + optimizeResources PASS. Validate signing release OK. 0 sisa instrumentation debug (grep 0 match). 2 warning Kotlin redundant branch & unused var sudah hilang.
- **Size APK:** **3.78 MB** (~parity SHA 2F549340, selisih ± beberapa ratus byte dari refactor branch & cleanup instrumentation → normal, tanpa bloat).
- **SHA256 AKTIF:** **`FA5B8C3983C3E285149568462A08F57344482B56C8A587AA55EC4A44B21A886A`**. SHA chain super-sede versionCode 76 (6 urutan = kronologis build → current AKTIF di urutan 1):
  - 1. `E0986710…` → Consolidated 13 patch 3 Area (superseded)
  - 2. `4C05028D…` → Overlay rumah kiosk guard presence (superseded)
  - 3. `9BB67A29…` → Parity toggle proteksi admin OFF→ON langsung kiosk (superseded)
  - 4. `ECC60CB2…` → Parity delta dialog priority + cooldown anti spam bunyi (superseded)
  - 5. `2F549340…` → Pet Dead teks dinamis + fix HOME key stale (superseded — BELUM include Accessibility overlay redirect & cleanup debug)
  - 6. **`FA5B8C39…` ← AKTIF SEKARANG — FINAL Parity overlay Accessibility stabil (bypass dialog putih → OverlayLockActivity visual) + cleanup debug TRAE 100% + warning build fix.**
- **Status verifikasi jujur:**
  - ✅ Runtime HP fisik VIVO V2030: "Overlay muncul stabil" (user VERBATIM). Install-replace via `adb -s 92823913 install -r` SUCCESS TANPA uninstall data.
  - ✅ Build clean assemble success. lintVital/signing/R8 PASS.
  - ✅ Cleanup instrumentation pass: grep helper/call/endpoint = 0 match. Artefak debug .md/.env/.ndjson dihapus. Debug server PID 5036 process mati.
  - ✅ Artefak 3-way UNIFORM SHA FA5B8C39: Build output = Final_V2 versioned 76 = Final_V2 alias studentRelease. Sidecar .sha256 versioned & alias diperbarui.
  - ✅ Warning build cleanup pass: LockEnforcer L173 & MainActivity L651 hilang.
  - 🟡 **Wajib 10 Smoke test HP fisik VIVO V2030 (R1-R10) SEBELUM deploy massal:** R1-R7 baseline SHA 2F549340 (Parity dialog/anti spam/OEM recovery kiosk/fail open/Pet Dead teks/HOME key). TAMBAH **R8-R10 regresi SHA FA5B8C39:**
    - R8: Proteksi ON→OFF → overlay Accessibility auto-dismiss, TIDAK tertinggal.
    - R9: Proteksi ON + 4 pilar full compliance → kiosk LockScreen NORMAL muncul (bukan di-hold; guard global sudah dicabut iterasi 1).
    - R10: User tap "Buka Pengaturan Aksesibilitas" → enable di Settings → BACK ke EduLock → overlay tutup otomatis, compliance FULL → kiosk start 2s.
  - 🟡 Belum deploy live `/e` / `/edulock/install`.
- **Catatan distribusi:** SHA build 76 yang sekarang hanya jejak historis: `2F549340…`, `ECC60CB2…`, `9BB67A29…`, `4C05028D…`, `E0986710…`. Distribusi lokal aktif, sidecar hash, rollback terbaru = **hanya `FA5B8C39…`**. Rollback darurat 5 detik tanpa rebuild: copy `.dbg\EduLock_V2-1.3.50-76_2F549340.apk` overwrite ke Final_V2 root (kembali ke Pet Dead patch tanpa overlay Accessibility redirect stabil).

### Rilis Terkini Sebelumnya (2026-09-07 00:48) — [RELEASE V2 v1.3.50 / 76] HOTFIX Pet Dead: Teks Sapaan Nama Dinamis + Fix HOME Key Overlay Hilang Selamanya
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` tetap, artefak distribusi aktif diganti LAGI oleh clean rebuild hotfix 2 request user langsung perihal overlay Pet Dead ("PET BUTUH PERHATIAN!"). Include SEMUA patch parity delta dialog priority + cooldown anti spam dari rilis 00:15 (SHA ECC60CB2), ditambah 2 patch Pet Dead: (A) Edit teks UI sesuai selera user + binding nama siswa dinamis, (B) Fix bug stale lifecycle flag ketika user tekan HOME / Recent apps.
- **2 Patch Root Cause Pet Dead (di atas parity ECC60CB2):**
  1. **TEKS SESUAI SELERA USER.** Header "PET BUTUH PERHATIAN!" dipertahankan. Tubuh dialog diganti: sapaan nama per siswa DINAMIS ("Hai, \"NAMA_SISWA\" \n pet anda mati akibat pelanggaran kedisiplinan"), admin hint ("Segera hubungi Admin/Guru BK...") dipertahankan, Catatan di-rewrite jadi "Catatan : \n jika tidak segera di hidupkan maka sistem akan mengingatkan sampai pet anda hidup kembali". *Fix:* Layout xml tambah `id` ke 3 TextView; PetDeadLockActivity.onCreate binding nama via `prefsManager.studentName` (fallback "Siswa"). Escape `\"` Java tidak valid di XML → ganti ke `&quot;` + `&#10;` (newline).
  2. **STALE FLAG HOME KEY = OVERLAY TIDAK PERNAH MUNCUL LAGI SELAMANYA.** User tekan HOME → Android hanya panggil `onPause → onStop` (TIDAK `onDestroy`). Sebelumnya singleton `PetDeadLockActivity.isShowing` tetap TRUE selamanya (stale timeout 10 MENIT). Setting reminder interval 30 menit? Flag masih stale → scheduler reminder SELALU `if (isShowing) return` skip tanpa show. *Fix 3 Lapisan Pertahanan:* (Layer 1 Instan) Tambah `override fun onUserLeaveHint()` (callback HOME/Recent built-in Android) → reset isShowing SEGERA. (Layer 2 OEM Backup) Tambah `override fun onPause()` guard `if (!isFinishing)` → reset flag hanya untuk HOME, TIDAK untuk `finish()` resmi klik "Saya Mengerti" (karena `finish()` → `isFinishing=true`, guard false, skip reset). (Layer 3 Fallback Stale Timeout Diperketat) Kurangi `MAX_SHOWING_STALE_MS` dari 10 MENIT → 60 DETIK. Jika OEM ROM VIVO aneh skip 2 lifecycle callback, paling lama 1 menit state auto reset.
- **Build bersih final:** `.\gradlew.bat clean assembleStudentRelease --no-daemon` → **BUILD SUCCESSFUL in 2m48s** (51 tasks: 49 executed, 2 up-to-date). Build pertama FAIL di XML escape `\"` tidak valid → FIXED retry kedua SUCCESS. lintVital PASS. R8 minify + shrinkResources + optimizeResources PASS. Validate signing release OK.
- **Size APK:** **3.78 MB** (3.963.111 bytes — +521 byte vs SHA `ECC60CB2…` normal dari 2 override lifecycle + 1 binding nama siswa TextView).
- **SHA256 AKTIF:** **`2F5493403B1612AE96D7C4AE2C0984737A7B1A066E95E8CEA794D40A7B27EADB`**. SHA chain super-sede terbaru versionCode 76:
  - 1. `E0986710C9A12659A13CAFB6B422B8AAAFB33D35A5491FF121784414DC11CD8B` → Consolidated 13 patch 3 Area (superseded)
  - 2. `4C05028D6FFB2EA944CC875BBFAF111D62473308C691B4B5C1D2811FA8F54A28` → Overlay rumah kiosk guard presence (superseded)
  - 3. `9BB67A29294FBAF63FB9145B62598970BAEA3D1E3877725120FBB7A156AF9D59` → Parity toggle proteksi admin OFF→ON (superseded — user audit menemukan 2 delta parity baru)
  - 4. `ECC60CB271CD28599C3A4FBAC194B770AC908046E8ABCD051424A68585961B5A` → Parity delta dialog priority + cooldown anti spam bunyi (superseded — belum include Pet Dead teks & HOME key fix)
  - 5. **`2F5493403B1612AE96D7C4AE2C0984737A7B1A066E95E8CEA794D40A7B27EADB` ← AKTIF SEKARANG.**
- **Status verifikasi jujur:**
  - ✅ GetDiagnostics 2 file Pet Dead: PetDeadLockActivity.kt / activity_pet_dead_lock.xml = 0 errors. GetDiagnostics 3 file parity: PreferencesManager.kt / MonitoringService.kt / MainActivity.kt = tetap 0 errors.
  - ✅ Build clean assemble success (retry 2). lintVital Student Release PASS. ValidateSigning keystore release OK.
  - ✅ 4-way match SHA (build output → Final_V2 versioned → Final_V2 alias studentRelease → .dbg backup SHA 2F549340) = PowerShell Get-FileHash MATCH True. Backup SHA ECC60CB2 (parity-only) juga sudah disimpan ke `.dbg\EduLock_V2-1.3.50-76_ECC60CB2.apk` untuk rollback 5 detik tanpa rebuild.
  - 🟡 **Wajib 7 Smoke test HP fisik VIVO V2030 SEBELUM deploy massal:** (R1) Dialog A11y duluan; (R2) Bunyi tidak berulang; (R3) OEM Recovery duluan; (R4) Full compliance langsung kiosk; (R5) Luar zona Fail Open; (**R6 BARU**) Pet Dead teks sesuai request + nama siswa DINAMIS tampil benar; (**R7 BARU**) Pet Dead tekan HOME 3x berturut → overlay tetap muncul lagi per interval reminder, tidak hilang permanen.
  - 🟡 Belum deploy live `/e` / `/edulock/install`.
- **Catatan distribusi:** SHA build 76 `ECC60CB2…` `9BB67A29…` `4C05028D…` `E0986710…` sekarang hanya jejak historis. Distribusi lokal aktif, sidecar hash, rollback terbaru = **hanya `2F549340…`**.

### Rilis Terkini Sebelumnya (2026-09-07 00:15) — [RELEASE V2 v1.3.50 / 76] HOTFIX PARITY DELTA Hybrid ↔ Non-Hybrid (Dialog Priority Duluan + Cooldown Anti Spam Bunyi)
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` tetap, artefak distribusi aktif diganti LAGI oleh **clean rebuild hotfix parity delta** 2 rule yang ditemukan user compare Gambar 1 (non-hybrid Final 1.3.28-54) vs Gambar 2 (hybrid Final_V2).
- **2 Delta Root Cause:**
  1. **URUTAN TERBALIK:** Admin toggle Silent→Aktif dengan Layanan Aksesibilitas DIMATIKAN. Hybrid sebelumnya: kiosk LockScreen TERKUNCI DULU → dialog putih aksesibilitas MUNCUL KEMUDIAN di atas kiosk (terbalik!). Non-hybrid baseline: dialog putih muncul DULU di halaman EduLock, compliance OK → kiosk start setelahnya.
  2. **BUNYI BERULANG:** `showToast()`, `updateNotification()`, performChecks post 2s TANPA cooldown. Firebase callback sinkron bertubi → lockscreen sound + notif + toast BERULANG 4-8x dalam 5 detik ("bunyi pop-up berulang2").
- **Fix inti dipertahankan source produksi:**
  1. PreferencesManager: 6 KEY protection activation cooldown (toast, notif, dialog, performChecks) + 2 pending recovery handshake flags (protectionPendingA11yRecovery / protectionPendingOemRecovery) + 4 helper throttling debounce shouldThrottleXxx().
  2. MonitoringService startProtectionStatusListener: throttle toast 10s + throttle notif 30s + debounce performChecks gap 4s.
  3. MonitoringService enforceLockAfterProtectionOn TOTAL REWRITE CASE 2 compliance kurang: hitung brokenCount, hentikan kiosk/dismiss lockscreen, set pending recovery flag, RELAUNCH MainActivity TANPA showLockScreen/requestKiosk. Follow-up 600ms/1800ms: compliance FULL → kioskan; masih kurang → relaunch EduLock lagi.
  4. MainActivity onResume BLOK BARU sebelum checkUninstallState: evaluasi protectionPendingA11yRecovery || protectionPendingOemRecovery → cek brokenCount → 1 item = call checkAndEnforceAccessibilityService() (dialog putih duluan), 2+ item = call showOEMRecoveryDialogIfNeeded() (OEM duluan). Clear flag sesudah.
  5. MainActivity checkAndEnforceAccessibilityService GUARD Lockdown zona sekolah: SKIP `showLockdownOverlay()` selama `protectionActivationDialogAt < 15s cooldown fresh` ATAU pending flag masih true. Hasil: dialog putih muncul DULU tanpa kiosk penuh = parity non-hybrid 1.3.28.
- **Build bersih final:** `.\gradlew.bat clean assembleStudentRelease --no-daemon` → **BUILD SUCCESSFUL in 2m53s** (51 tasks: 49 executed, 2 up-to-date). lintVital PASS. R8 minify + shrinkResources + optimizeResources PASS. Validate signing release OK.
- **Size APK:** **3.78 MB** (3.962.590 bytes — +929 byte vs SHA `9BB67A29…` normal dari 8 SharedPrefs state + evaluasi pending onResume + enforcement guard).
- **SHA256 AKTIF:** **`ECC60CB271CD28599C3A4FBAC194B770AC908046E8ABCD051424A68585961B5A`**. SHA chain super-sede terbaru (versionCode 76):
  - 1. `E0986710C9A12659A13CAFB6B422B8AAAFB33D35A5491FF121784414DC11CD8B` → Consolidated 13 patch 3 Area (superseded)
  - 2. `4C05028D6FFB2EA944CC875BBFAF111D62473308C691B4B5C1D2811FA8F54A28` → Overlay rumah kiosk guard (superseded)
  - 3. `9BB67A29294FBAF63FB9145B62598970BAEA3D1E3877725120FBB7A156AF9D59` → Parity toggle proteksi admin OFF→ON (superseded — user audit menemukan 2 delta baru di atas)
  - 4. **`ECC60CB271CD28599C3A4FBAC194B770AC908046E8ABCD051424A68585961B5A` ← AKTIF SEKARANG.**
- **Status verifikasi jujur:**
  - ✅ GetDiagnostics 3 file Kotlin: PreferencesManager.kt / MonitoringService.kt / MainActivity.kt = **0 errors.**
  - ✅ Build clean assemble success.
  - ✅ 3-way match SHA (build output → Final_V2 versioned → Final_V2 alias studentRelease → .dbg backup) = PowerShell Get-FileHash MATCH True.
  - 🟡 **Wajib 5 Smoke test HP fisik VIVO V2030 SEBELUM deploy massal:** (R1) Urutan Dialog A11y Broken → DULU bukan kiosk; (R2) Bunyi berulang 3x trigger proteksi ON → cuma 1x; (R3) 2+ Broken → OEM dialog bukan kiosk; (R4) Full Compliance → langsung kiosk; (R5) Di luar zona → Fail Open.
  - 🟡 Belum deploy live `/e` / `/edulock/install`.
- **Catatan distribusi:** SHA build `76` `9BB67A29…` dan `4C05028D…` dan `E0986710…` sekarang hanya jejak historis. Distribusi lokal aktif, sidecar hash, rollback terbaru = **hanya `ECC60CB2…`**.

### Rilis Terkini Sebelumnya (2026-09-06 23:37) — [RELEASE V2 v1.3.50 / 76] HOTFIX PARITY Toggle Proteksi Admin (OFF -> ON Langsung Terkunci Lagi)
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` tetap, tetapi artefak distribusi aktif sudah diganti lagi oleh **clean rebuild parity fix** yang menutup regresi toggle proteksi admin.
- **Root cause yang terbukti:** jalur enforcement hybrid masih tunduk pada `legacy settings grace` (`isSettingsOpen/settingsGraceUntil`) walau tidak ada recovery target modern yang benar-benar aktif. Akibatnya, `Protect OFF -> ON` bisa hanya memunculkan notifikasi / toast tanpa langsung mengunci.
- **Fix inti yang dipertahankan di source produksi:**
  1. Tambah helper `shouldPauseEnforcementForRecovery(...)` di `PreferencesManager` untuk membedakan recovery target nyata vs legacy grace global.
  2. `MonitoringService.tryEnforceProtectionOnActivation()` dan `enforceLockAfterProtectionOn()` sekarang memakai gate baru itu.
  3. `MainActivity` guard `ACTION_START_KIOSK` dan `startKioskMode()` ikut disamakan.
  4. `LockEnforcer` juga ikut memakai gate baru agar relaunch/kiosk final konsisten.
- **Build bersih final:** `:app:assembleStudentRelease` → **BUILD SUCCESSFUL in 2m55s**
- **Size APK:** **3.78 MB** (3.961.661 byte)
- **SHA256 aktif:** **`9BB67A29294FBAF63FB9145B62598970BAEA3D1E3877725120FBB7A156AF9D59`**
- **Status verifikasi jujur:**
  - ✅ Install-replace ke HP user tanpa uninstall data
  - ✅ User verifikasi final: **“Sudah fixed”**
  - ✅ Debug instrumentation admin-toggle sudah dibersihkan lagi dari source produksi
  - 🟡 Belum deploy live `/e` / `/edulock/install`
- **Catatan distribusi:** SHA build `76` sebelumnya `4C05028D...` dan `E0986710...` sekarang hanya dipakai sebagai jejak historis sesi. Untuk distribusi lokal aktif, sidecar hash, dan rollback terbaru, pakai hanya SHA **`9BB67A29...`**.

### Rilis Terkini Sebelumnya (2026-09-06 22:37) — [RELEASE V2 v1.3.50 / 76] CLEAN REBUILD HOTFIX Overlay Rumah Final (Kiosk Guard Rumah + Cleanup Instrumentasi)
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` tetap, tetapi artefak distribusi aktif sudah diganti oleh **clean rebuild hotfix** yang menutup jalur kiosk / screen pinning di rumah saat jam efektif.
- **Root cause final yang terbukti:** `MainActivity` masih bisa merespons `ACTION_START_KIOSK` / `startKioskMode()` hanya karena `isSchoolTime=true`, tanpa memastikan siswa benar-benar masih berada di area sekolah.
- **Fix inti:** tambah helper `shouldAllowKioskAtSchool()` di `MainActivity`, lalu pakai helper itu di dua titik:
  1. receiver `ACTION_START_KIOSK`
  2. `startKioskMode()`
  Hasilnya: **jam efektif saja tidak cukup** untuk menyalakan kiosk; harus ada bukti siswa memang masih di sekolah.
- **Cleanup penting:** seluruh instrumentation sesi debug `home-overlay-petdead` sudah dicabut lagi dari source produksi; file sesi debug lokal dihapus; proses debug server background dihentikan.
- **Build:** `:app:assembleStudentRelease` percobaan pertama gagal karena import `JSONObject` di `MainActivity` sempat ikut tercabut saat cleanup; setelah restore import yang memang masih dipakai logic produksi, build kedua **BUILD SUCCESSFUL in 2m13s**.
- **Size APK:** **3.78 MB** (3.961.435 byte)
- **SHA256 aktif:** **`4C05028D6FFB2EA944CC875BBFAF111D62473308C691B4B5C1D2811FA8F54A28`**
- **Status verifikasi jujur:**
  - ✅ Install-replace ke HP user tanpa uninstall data
  - ✅ Uji cepat pindah EduLock → GAS di rumah saat jam efektif tetap aman
  - ✅ User konfirmasi final: **EduLock sudah tidak muncul lagi**
  - 🟡 Belum deploy live `/e` / `/edulock/install`
- **Catatan distribusi:** SHA build `76` lama **`E0986710...`** resmi dianggap kandidat pre-hotfix / pre-cleanup. Untuk distribusi lokal aktif dan acuan rollback sesudah sesi ini, pakai hanya SHA **`4C05028D...`**.

### Rilis Terkini (2026-09-06 21:10) — [RELEASE V2 v1.3.50 / 76] TOTAL 12 BUG FIX 3 AREA (Overlay Rumah + Pet Dead Setengah Hidup + Overlay Menumpuk Aksesibilitas) — Consolidated Build
- **Acuan Final V2 lokal saat ini:** build `1.3.50 (76)` = Consolidated Build lanjutan dari 1.3.49. Genapkan 2 area bug yang belum di-build (Pet Dead 5 bug + Overlay Menumpuk Aksesibilitas 3 guard) + parity compile fix helper signature `toLongEither` yang gagal karena Firebase SDK di proyek ini tidak punya `.parent` property DataSnapshot. Total 13 code patch 11 file Kotlin + 1 bump versi.
- **Ringkas 3 area bug fix per kategori:**
  - **🏠 AREA 1 Overlay Rumah (re-applied dari 1.3.49 — parity build ulang):** 5 code patch (GpsEnableOverlay hasPresence gate; sticky isInsideSchoolZone reset 30 menit pulang awal; enforceGpsOnWhenEduLockOpen presence gate; fallback sabtu enabled=false; OverlayLock gps recovery multi-guard hasPresence).
  - **🐶 AREA 2 Overlay Pet Dead Setengah Hidup (BARU 1.3.50 — 5 bug):**
    1. Stale Flag Companion `isShowing` nyangkut selamanya jika Android kill activity tanpa `onDestroy()` → Fix: `lastShowingAt` Long + `ensureStaleShowingReset()` 10 menit stale di setiap titik sebelum check isShowing.
    2. Duplicate 2 blok trigger PetDead di MonitoringService cleanup tidak konsisten (Blok 2 cuma `hideOverlayLock` tanpa dismissLockScreen+stopKiosk) → overlay muncul DI BAWAH kiosk aktif ("setengah hidup") → Fix: **HAPUS Blok 2 duplicate**, hanya Blok 1 trigger tunggal (full cleanup).
    3. "Saya Mengerti" tanpa debounce → tap cepat 2x counter +2 skip interval kedua → Fix: `UNDERSTOOD_CLICK_DEBOUNCE_MS = 2s` sebelum increment counter.
    4. Setting Admin 11/1/1 menit (petDeadReminder) TIDAK TERAPKAN offline: KEY MISMATCH camelCase (`SchoolLocalDataManager`) vs snake_case (`Firebase/Web Admin`) → Fix: Write DUAL KEY camelCase + snake_case untuk semua interval policy; Validator & Listener accept both via helper `longEither` / `toLongEither`.
    5. Race Revive pet: `showPetDeadLock()` TIDAK guard `prefs.isPetDead == FALSE` → Admin klik Hidupkan tepat saat MonitoringService mau call show → overlay muncul padahal pet sudah hidup → Fix: guard `if (!prefsManager.isPetDead)` reset count 0 & return di semua titik show.
  - **🔄 AREA 3 Overlay Menumpuk Aksesibilitas (BARU 1.3.50 — 3 guard, aturan user: aturan lama "Wajib Aktifkan Proteksi" DIUTAMAKAN untuk 1 item = Accessibility):**
    1. OEM Recovery dialog BOCOR pattern `dialogCount` (tidak guard `dialogCount>0`; tidak increment counter parity) → Fix: guard `dialogCount>0` return di `showOEMRecoveryDialogIfNeeded()` + increment `dialogCount++` sebelum builder + `setOnDismissListener { dialogCount-- }`. Mirror guard juga di `checkAndEnforceAccessibilityService()` awal (anti tumpuk).
    2. Rule Priority Suppress Salah: User konfirmasi "overlay 'wajib aktifkan.....' adalah overlay aturan lama — saya mau ini diutamakan untuk 1 item = Accessibility" → Fix: handshake SharedPreferences boolean once-used flag `oemRecoverySuppressNextAccessibilityDialog` lintas function: (a) Jika broken.size==1 && hanya Accessibility → **SUPPRESS OEM Recovery** (return sebelum show) & clear marker (aturan lama yg muncul — UX user familiar). (b) Jika broken.size>=2 → **SUPPRESS aturan lama**: set flag true sebelum show OEM Recovery; `checkAndEnforceAccessibilityService()` guard di awal: jika flag true → reset false sekali pakai, dismiss & return (hanya 1 dialog OEM Recovery — perbaiki semua sekaligus).
    3. Zona Sekolah: 2 UI recovery aksesibilitas tampil bersamaan (`showLockdownOverlay` full lockscreen + accessibilityDialog putih di atas) → Fix: Setelah `showLockdownOverlay(...)` di blok insideSchoolZone, langsung `return` (cukup 1 UI = lockdown penuh).
- **PARITY COMPILE HOTFIX:** Helper `toLongEither` signature awal salah (`.ref.parent?.child(camelKey)` → DatabaseReference; lanjut `.parent` → Firebase SDK tidak punya property). Fix total signature: `toLongEither(root: DataSnapshot, snakeKey, camelKey, defaultValue)` — child dari root snapshot langsung, 100% API stabil. Diterapkan di 2 listener gpsPolicy: MainActivity dan MonitoringService.
- **Prinsip Safety Non-Breaking:** SEMUA perubahan HANYA MENAMBAH GATE (mempersempit kondisi muncul overlay). Behavior benar (pet mati sekolah overlay muncul interval normal; aksesibilitas mati 1 item → aturan lama muncul tetap sama user sebelumnya; 2+ izin broken → OEM Recovery muncul cuma tidak tumpuk) TIDAK dirusak.
- **Build:** `:app:assembleStudentDebug --no-daemon` BUILD SUCCESSFUL in 1m9s (38 tasks). `:app:assembleStudentRelease --no-daemon :app:lintVitalStudentRelease` BUILD SUCCESSFUL in 2m25s (49 tasks: 21 executed). R8 minify + validateSigning + lintVital ALL PASS. Warning hanya deprecated API lama pre-existing TYPE_PHONE + unused SchoolServiceGuard context (TIDAK BARU).
- **Size APK:** **3.78 MB** (3.961.468 byte) — parity 1.3.49-75 3.960.698 byte (+770 byte = ~0.02% normal dari 13 patch logic).
- **Nama file:** `EduLock_V2-1.3.50-76.apk`
- **Alias aktif:** `EduLock_V2-studentRelease.apk` (overwrite Final_V2)
- **SHA256:** **`E0986710C9A12659A13CAFB6B422B8AAAFB33D35A5491FF121784414DC11CD8B`**
- **Verifikasi SHA256 inline vs sidecar:**
  - Versioned 1.3.50-76 inline PowerShell `Get-FileHash` = sidecar `EduLock_V2-1.3.50-76.apk.sha256`: ✅ MATCH = True.
  - Alias `studentRelease.apk` inline = sidecar `studentRelease.apk.sha256`: ✅ MATCH = True.
  - Versioned SHA = Alias SHA = Backup .dbg SHA: ✅ 3-WAY MATCH = True (ketiga file byte-for-byte identik).
- **Rollback jika build 1.3.50-76 bermasalah (bertingkat dari tercepat):**
  1. **(L0 TERCEPAT, 5 DETIK TANPA REBUILD)** Restore alias Final_V2 dari `.dbg\EduLock_V2-1.3.49-75.apk` (Pre-Fix Pet Dead + Overlay Tumpuk — stabil Overlay Rumah 4 Bug).
  2. **(L1 JIKA HP user sudah install replace 76)** Upgrade-replace user langsung pakai `.dbg\EduLock_V2-1.3.48-74.apk` (Pre-Fix Overlay Rumah — Fase 2 Lengkap Stabil) — **JANGAN uninstall** (data payload sekolah/FCM token hilang).
  3. **(L2 jika L1 juga bermasalah)** Upgrade-replace ke `.dbg\EduLock_V2-1.3.47-73.apk` (Pre-Fase 2 OEM Stabil).
  4. **(L3 production E2E terbukti vivo V2030)** Upgrade-replace ke `Final_V2\EduLock_V2-1.3.38-64.apk`.
- **Cara Install Test di HP user (PENTING — BACA SEBELUM KLIK APK):**
  1. Buka folder Final_V2 → klik `EduLock_V2-1.3.50-76.apk`.
  2. Android akan deteksi "Update Aplikasi?" (karena package sama, versionCode 76>75). Klik **INSTALL / PERBARUI**. **JANGAN SAMPAI KLIK UNINSTALL ATAU HAPUS DATA** (payload sekolah & FCM token hilang).
  3. Tunggu install selesai → BUKA EduLock sekali (agar service restart dengan logic baru 1.3.50).
  4. Jalankan smoke test 13 skenario: **🏠 S1-S5 (Overlay Rumah) + 🐶 P1-P5 (Pet Dead) + 🔄 O1-O3 (Overlay Menumpuk Aksesibilitas)** — catat ya/tidak per skenario → feedback ke assistant.
- **Rekomendasi status operasional:** Ready untuk **uji smoke test internal user HP fisik terlebih dahulu** (minimal vivo V2030 yang pernah E2E, lalu Xiaomi + Oppo 1 brand masing-masing) sebelum declare produksi / deploy massal ke siswa. **JANGAN deploy massal SEBELUM:** (S1) rumah GPS OFF jam efektif TIDAK ADA overlay satupun ✅; (O1) Aksesibilitas 1 item broken → HANYA dialog aturan lama "Wajib Aktifkan Proteksi" muncul ✅; (P3) "Saya Mengerti" debounce 2 detik counter hanya +1 ✅.

### Rilis Sebelumnya (2026-09-06 20:30) — [RELEASE V2 v1.3.49 / 75] 4 FIX OVERLAY MUDAH MUNCUL TAPI TIDAK MENGUNCI DI RUMAH SAAT JAM EFEKTIF SEKOLAH (Bug User Report)
- **Acuan Final V2 lokal saat ini:** build `1.3.49 (75)` = Patch Perbaikan Bug KRITIS laporan user langsung "ketika di rumah, jam efektif sekolah, EduLock sering muncul overlay lock TAPI TIDAK BENAR-BENAR MENGUNCI (kiosk non-full / bisa lepas tanpa block app lain → mengganggu pakai HP di rumah)". Audit 4 root cause + 1 guard tambahan (5 total code patch).
- **Akar masalah dan fix per file (ringkas — detail lengkap lihat BUILD_LOG.md entry 2026-09-06):**
  1. **BUG #1 (Pemicu Utama 90%)** `GpsEnableOverlay.isRequired()` TIDAK MEMILIKI gate `hasPresence` → overlay GPS recovery muncul walaupun JELAS di rumah (0 presence), KETIKA GPS OFF + masih jam efektif. *Fix:* Tambah gate `AND (prefs.isInsideSchoolZone OR locMonitor.shouldEnforcePresenceProtection())` di return value.
  2. **BUG #2 (Sticky Flag Bocor Pulang Awal)** `prefs.isInsideSchoolZone` HANYA di-reset FALSE jika `!isSchoolTime`. User pulang sebelum jam berakhir → sticky TRUE terus sampai jam sekolah selesai → Proteksi Utama blok 7 tetap jalan → buka WA/IG → relaunch overlay "PERANGKAT TERKUNCI" TANPA kiosk penuh. *Fix:* Tambah `lastInsideSchoolZoneAt` Long (PreferencesManager) buat stempel waktu fix terakhir di zona; jika fresh fix luar radius DAN lastInsideAt > 30 menit → reset sticky false + clearNearSchoolPresence (bahkan jika masih jam efektif).
  3. **BUG #3 (Paksa GPS Padahal Buka EduLock UI Rumah)** `MonitoringService.enforceGpsOnWhenEduLockOpen()` Hanya gate `isUiForeground + isSchoolTime` tanpa gate presence. *Fix:* Tambah baris setelah isSchoolTime: jika 0 presence → return tanpa overlay.
  4. **BUG #4 (False isSchoolTime Sabtu Libur Offline)** `SchoolScheduleManager.getScheduleMap()` fallback legacy saat `weekdayScheduleJson` BLANK: `sat.enabled=true` (Sabtu dianggap sekolah). Sekolah 5 hari, fresh install / sync gagal pertama → Sabtu pagi offline di rumah overlay tetap aktif. *Fix:* Ubah `sat.enabled=false` (mirip Minggu).
  5. **GUARD #5 (Overlay GPS Tetap Stay di Rumah)** `OverlayLockActivity.shouldStayLocked()` cabang gps recovery HANYA cek `!gpsOn`. *Fix:* Multi-guard: GPS OFF tapi 0 presence → return false (overlay auto-close, tidak paksa user nyalakan GPS di rumah).
- **Prinsip Safety Non-Breaking:** SEMUA perubahan HANYA MENAMBAH GATE (mempersempit kondisi muncul). Jika user BENAR-BENAR di sekolah + GPS OFF → overlay recovery GPS TETAP muncul 100% sama seperti sebelumnya (behavior benar TIDAK dirusak).
- **Build:** `:app:assembleStudentDebug --no-daemon` BUILD SUCCESSFUL in 1m22s (38 tasks). `:app:assembleStudentRelease --no-daemon` BUILD SUCCESSFUL in 2m1s (49 tasks: 21 executed). R8 minify + validateSigning + lintVital ALL PASS. Warning hanya deprecated API lama pre-existing.
- **Size APK:** **3.78 MB** (3.960.698 byte) — parity 1.3.48-74 3.78 MB (hanya selisih 287 byte dari tambahan 3 field ~50 baris gate logic → normal, tidak bloat).
- **Nama file:** `EduLock_V2-1.3.49-75.apk`
- **Alias aktif:** `EduLock_V2-studentRelease.apk` (overwrite Final_V2)
- **SHA256:** **`B648195345725F81A8E223FAA34891B90FEAFB8121146771C6C7D780DFE9A8B7`**
- **Verifikasi SHA256 inline vs sidecar:**
  - Versioned 1.3.49-75 inline PowerShell `Get-FileHash` = sidecar `EduLock_V2-1.3.49-75.sha256`: ✅ MATCH = True.
  - Alias `studentRelease.apk` inline = sidecar `studentRelease.sha256`: ✅ MATCH = True.
  - Versioned SHA = Alias SHA: ✅ MATCH = True (kedua file byte-for-byte identik, hasil Copy-Item overwrite).
- **Rollback jika build 1.3.49-75 bermasalah (bertingkat dari tercepat):**
  1. **(L0 TERCEPAT, 5 DETIK TANPA REBUILD)** Restore alias Final_V2 dari `.dbg\EduLock_V2-1.3.48-74.apk` (Fase 2 Lengkap stabil pre-fix overlay rumah).
  2. **(L1 JIKA HP user sudah install replace 75)** Upgrade-replace user langsung pakai `.dbg\EduLock_V2-1.3.47-73.apk` (OEM Hardening stabil pre-Fase-2) — **JANGAN uninstall** (data payload sekolah/FCM token hilang).
  3. **(L2 jika L1 juga bermasalah)** Upgrade-replace ke `Final_V2\EduLock_V2-1.3.46-72.apk` (Pre-OEM Baseline clean).
  4. **(L3 production E2E terbukti vivo V2030)** Upgrade-replace ke `Final_V2\EduLock_V2-1.3.38-64.apk`.
- **Cara Install Test di HP user (PENTING — BACA SEBELUM KLIK APK):**
  1. Buka folder Final_V2 → klik `EduLock_V2-1.3.49-75.apk`.
  2. Android akan deteksi "Update Aplikasi?" (karena package sama, versionCode 75>74). Klik **INSTALL / PERBARUI**. **JANGAN SAMPAI KLIK UNINSTALL ATAU HAPUS DATA.**
  3. Tunggu install selesai → BUKA EduLock sekali (agar service restart dengan logic baru 1.3.49).
  4. Jalankan smoke test 5 skenario S1-S5 (catat hasil ya/tidak → feedback ke assistant).
- **Rekomendasi status operasional:** Ready untuk **uji smoke test internal user HP fisik terlebih dahulu** (minimal vivo V2030 yang pernah E2E, lalu Xiaomi + Oppo 1 brand masing-masing) sebelum declare produksi / deploy massal ke siswa. **JANGAN deploy massal SEBELUM S1 (rumah GPS OFF jam efektif) LULUS 100% tanpa overlay satupun.**

### Rilis Sebelumnya (2026-09-05 11:30) — [RELEASE V2 v1.3.48 / 74] FASE 2 LENGKAP: 5 FCM Commands + Background Periodic Reminder 2 Jam + Offline Dual Queues (Status & Audit) + Admin Health Contract + Operator Field Checklist
- **Acuan Final V2 lokal saat ini:** build `1.3.48 (74)` = Release Resmi Lengkap Fase 1 (OEM Hardening) + Fase 2 (FCM Command, Periodic Reminder, Telemetry Queues, Field Checklist).
- **Yang dibawa build ini:**
  1. **Langkah 6 — 5 FCM Remote Commands**: `edulock_check_perm`, `edulock_sync_now`, `edulock_force_relock`, `edulock_kill_lock` (durasi 5m..24j dengan auto expiry aman), `edulock_restore_lock`. Semua diproses dengan short circuit enforcement, generic ACK ke Firebase (`lastFcm_<commandType>_*`), dan notifikasi channel khusus `EduLockFcmCommands`.
  2. **Langkah 7 — Background Periodic Reminder 2 Jam**: AlarmManager menembakkan `ACTION_PERIODIC_CHECK_PERM` setiap 2 jam via `PermissionReminderReceiver` ke `MonitoringService.ACTION_CHECK_PERM` secara aman.
  3. **Langkah 8 — Dual Offline Queues & Telemetry Event-Driven**: `ActiveDeviceStatusQueue` (persist status HP max 50 entri ke RTDB `active_devices`) dan `EventAuditQueue` (persist audit pelanggaran max 50 entri ke `/violations/`). Payload telemetry mencakup `brandOEM`, `modelOEM`, status 4 izin, status kill switch, broken permissions, dan riwayat cek izin.
  4. **Langkah 9 — Data Contract Dashboard Admin Status Device**: Node `active_devices/<schoolId>/<deviceId>` difinalkan dengan 11 health field siap dikonsumsi dashboard web admin.
  5. **Langkah 10 — Checklist Lapangan & Handoff Operator**: Dokumen `CHECKLIST_LAPANGAN_DAN_HANDOFF_OPERATOR.md` diterbitkan sebagai panduan uji 9 brand HP dan tata cara eksekusi command FCM.
- **Build:** `:app:assembleStudentRelease --no-daemon` BUILD SUCCESSFUL in 27s (49 tasks: 2 executed, 47 up-to-date). R8 minify + validateSigning pass.
- **Size APK:** **3.78 MB** (3.960.411 byte).
- **Nama file:** `EduLock_V2-1.3.48-74.apk`
- **Alias aktif:** `EduLock_V2-studentRelease.apk`
- **SHA256:** **`6AAFCC61111FE180682C0EA77B3C3AEA72F19B3400110697F06853D5A9EFFE3B`**
- **Verifikasi SHA256 inline vs sidecar:**
  - Versioned inline `Get-FileHash` = sidecar `EduLock_V2-1.3.48-74.sha256`: ✅ MATCH = True.
  - Alias inline `Get-FileHash` = sidecar `EduLock_V2-studentRelease.sha256`: ✅ MATCH = True.
  - Backup .dbg inline `Get-FileHash` = sidecar: ✅ MATCH = True.
- **Rollback jika build 1.3.48-74 bermasalah:**
  1. **(L0 Tercepat, 5 detik tanpa rebuild)** Restore alias Final_V2 dari `.dbg\EduLock_V2-1.3.47-73.apk` (Fase 1 OEM stabil).
  2. **(L1 Pre-OEM Baseline)** Restore alias Final_V2 dari `Final_V2\EduLock_V2-1.3.46-72.apk`.
  3. **(L2 E2E Vivo V2030)** Upgrade-replace user ke `Final_V2\EduLock_V2-1.3.38-64.apk` tanpa uninstall.

### Rilis Sebelumnya (2026-09-05 10:58) — [RELEASE V2 v1.3.47 / 73] OEM HARDENING FASE 1 LENGKAP: Brand Detect 9 Vendor + SetupActivity OEM Card ke-7 + Shortcut Xiaomi Unlimited/Autostart 16 Vendor Intent + MainActivity Recovery Grace-Aware Warning
- **Acuan Final V2 lokal:** build `1.3.47 (73)` = Release Resmi Fase 1 OEM Hardening Lengkap (sesuai roadmap `rencana_pengembangan_edulock.md` Revisi Eksekusi).
- **Yang dibawa build ini (ringkas — detail di BUILD_LOG.md entry 2026-09-05 10:58):**
  1. **Sub-Fase 1.1 — EduLockOEMHardeningHelper + Manifest Queries Vendor**: Helper tunggal deteksi 9 brand. Manifest tambah 11 `<queries>` vendor OEM + intent `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` agar shortcut vendor resolve stabil di Android 11+.
  2. **Sub-Fase 1.2 — SetupActivity OEM Card ke-7**: Card oranye OEM Hardening setelah card Battery. Tombol `btnSetupXiaomiUnlimited` (shortcut 1-klik AppOps/PermissionsEditor Xiaomi Unlimited Access 4 candidate ComponentName berantai) + `btnSetupAutostart` (shortcut 1-klik 16 vendor autostart intent) + `btnOEMShowGuide` (AlertDialog panduan merk). **PENTING:** Flow gate 6 izin utama TETAP menjadi syarat tombol MULAI APLIKASI (shortcut OEM hanya bantuan).
  3. **Sub-Fase 1.3 — MainActivity Recovery Grace-Aware Warning**: Setelah user setup, jika Accessibility/Overlay/Admin/Battery mati DAN tidak dalam grace window → AlertDialog ringan PERBAIKI IZIN arahkan balik ke SetupActivity. Enforcement existing MainActivity tetap aktif SEMUA (tidak dihapus).
  4. Fix mismatch docs: README pegangan EduLock yang sempat tertinggal catat 1.3.38-64 sebagai "terkini" disinkron ke 1.3.46-72 baseline pre-OEM.
- **Ringkasan Prinsip Safety build ini (lihat BUILD_LOG section Prinsip Safety untuk 6 butir lengkap):**
  - OEM shortcut tidak pernah mengganti gate 6 izin SetupActivity.
  - SEMUA vendor intent dibungkus `canResolveIntent` + fallback chain ke `ACTION_APPLICATION_DETAILS_SETTINGS` (tidak crash).
  - Recovery warning selalu grace-aware (skip di tengah settings/recovery flow).
  - Rollback jelas: L0→72, L1→64, L2→62, backup `.dbg` semua versioned.
- **Build:** `:app:assembleStudentRelease --no-daemon` BUILD SUCCESSFUL 2m 26s, 49 tasks, 13 executed, 36 up-to-date. R8 minify + validateSigning UP-TO-DATE.
- **Size APK stabil:** **3.77 MB** (+0.01 MB vs 1.3.46-72, normal untuk helper baru ~400 baris + queries).
- **Nama file sederhana:** `EduLock_V2-1.3.47-73.apk`
- **Alias aktif:** `EduLock_V2-studentRelease.apk`
- **SHA256:** `ADA9F34F1A9A8C1FB7AE9A941665F5E093116AC36550A3FD5917E417079635E2`
- **Verifikasi SHA256 inline vs sidecar:**
  - Versioned inline `Get-FileHash` = sidecar `EduLock_V2-1.3.47-73.sha256`: ✅ MATCH = True.
  - Alias inline `Get-FileHash` = sidecar `EduLock_V2-studentRelease.sha256`: ✅ MATCH = True.
- **Status verifikasi jujur:**
  - ✅ Build compile pass, R8 minify pass, validateSigning pass, SHA sidecar MATCH.
  - ✅ Regression static check: flow 6 izin gate tetap, enforcement MainActivity existing tetap, R1 throttle tetap, R2 geofence tetap.
  - 🟡 **BELUM diuji HP fisik 3 brand wajib (lihat BUILD_LOG bagian Belum Diuji 6 poin: Xiaomi, Oppo/Vivo, Samsung, Rollback safety, Regresi enforcement jam sekolah, Jam luar sekolah tenang).**
- **Rekomendasi status operasional:** Ready untuk **uji smoke test internal di 3 brand utama** (Xiaomi, Oppo/Realme, Vivo/iQOO minimal) sebelum deploy massal. Jika HP fisik tidak ada untuk test hari ini, aman simpan sebagai kandidat release terkini di Final_V2; jika ada komplain saat rollout, rollback ke L0 `.dbg\EduLock_V2-1.3.46-72.apk` hanya dengan copy-replace Final_V2 alias (tidak perlu rebuild).
- **Rollback jika build 1.3.47-73 bermasalah (bertingkat, dari tercepat ke aman):**
  1. **(TERCEPAT L0, 5 detik tanpa rebuild)** Restore alias Final_V2 dari `.dbg\EduLock_V2-1.3.46-72.apk` kembali jadi `studentRelease.apk` → distribusi lama kembali aktif.
  2. **(L1 jika HP user sudah install replace 73)** Upgrade-replace user langsung pakai `Final_V2\EduLock_V2-1.3.38-64.apk` (baseline E2E vivo V2030 terbukti) — **JANGAN uninstall** (data payload sekolah/FCM token hilang).
  3. **(L2 jaga-jaga L1 juga bermasalah)** Upgrade-replace ke `Final_V2\EduLock_V2-1.3.36-62.apk` (SHA 3C2EAA91..., pre-E2E production bersih).
- **Next step setelah smoke test HP fisik OEM pass:** Lanjut roadmap Fase 2 — Langkah 6 `CHECK_PERM` / `SYNC_NOW` / `FORCE_RELOCK` / `KILL_LOCK` di EduLockMessagingService → Langkah 7 backend trigger → Langkah 8 telemetry → Langkah 9 dashboard → Langkah 10 checklist lapangan + handoff.

### Rilis Terkini (2026-09-03 23:40) — [KANDIDAT FINAL V2 v1.3.46 / 72 — BASELINE PRE-OEM ROLLBACK L0] Direct Launch Accessibility Beres + Cleanup Instrumentasi Session Debug
- **Acuan Final V2 lokal saat ini:** build `1.3.46 (72)` hasil clean rebuild setelah dua PR terakhir Hybrid V2 selesai ditutup.
- **Yang dibawa build ini:**
  1. Jalur `Buka Pengaturan` aksesibilitas dari `MainActivity` langsung membuka menu aksesibilitas, tidak lagi memantul ke Home / keyguard.
  2. Semua instrumentation sesi debug `settings-home-gas-spin` sudah dibersihkan lagi dari source produksi.
  3. Checklist regresi pegangan sudah diperbarui untuk dua hasil verifikasi terbaru.
- **Status verifikasi jujur:**
  - ✅ Sudah verified di HP fisik pada build kerja terakhir: prompt aksesibilitas **langsung**.
  - 🟡 Build `72` sendiri adalah clean rebuild kandidat final; **belum** diulang quick smoke di HP setelah instrumentation dicopot.
- **Nama file sederhana:** `EduLock_V2-1.3.46-72.apk`
- **Alias aktif:** `EduLock_V2-studentRelease.apk`
- **SHA256:** `FF6270B52A67E8DF39EC4B2C00ED51018FB0C73AA0204CD7C81EE56616A573CA`
- **Rekomendasi status operasional:** layak dipakai sebagai paket clean terbaru, tetapi bila ingin menulis status **final mutlak**, lakukan 1 retest ringkas lagi di device untuk 3 skenario inti: aksesibilitas, mode pesawat, dan buka GAS saat offline.

### Rilis Terkini (2026-09-03 20:25) — [RELEASE V2 v1.3.38 / 64] 🏆 PRODUCTION BERSIH LEVEL 3: E2E USB HP Fisik 100% Verified (H1-H4 Lulus) + Patch R1 (Throttle Heartbeat 4s avg) + Patch R2 (Fix Geofence Overlay Biru/Blank) + Cleanup Instrumentasi Log.d 0 Sisa
- **Acuan Final V2 lokal saat ini (SUPERSEDE v1.3.36-62):** build `1.3.38 (64)` = LEVEL 3 TERTINGGI. 0 sisa instrumentation debug code, 0 Thread baru non-official, H1-H4 E2E user verified via USB Logcat di HP fisik vivo V2030.
- **Alasan utama build ini:**
  1. **Validasi E2E 4 Hipotesis Hybrid Fase 1 Revisi (H1-H4)** menggunakan metode baru **USB Debugging ADB Logcat** (`Log.d` native tag `EDULOCK_E2E`, 0 Thread baru, 0 network POST → TERBUKTI TIDAK membuat APK "tambah runyam" seperti metode HTTP POST sebelumnya). Hasil SEMUA H1-H4 ✅ LULUS CONFIRMED:
     - H1 (Offline Fail-safe Dihapus): ✅ Confirmed via S3 — Offline >2 menit BUKAN Mode Pesawat TIDAK ADA overlay merah, TIDAK ADA toast countdown.
     - H2 (EduLock Tidak Diam Saat Online): ✅ Confirmed via S1+Patch R1 — performChecks dari overheat avg ~42ms (loop terlalu cepat) → throttle R1 avg normal ~4100ms (ideal 3-5s).
     - H3 (GPS Recovery Overlay Bukan Biru Kosong): ✅ Confirmed via S2+Patch R2 — Fix A (startRecoveryForTarget sebelum startActivity) + Fix B (stale expiry 15s) TETAP ADA + diperbaiki lagi cabang geofence keep-overlay agar state tidak nyangkut → R2 user confirm "overlay aktifkan gps berjalan normal online/offline".
     - H4 (Mode Pesawat TETAP Lockdown): ✅ Confirmed via S4 — User lapor overlay "Mode Pesawat Dilarang..." muncul.
  2. **Terapkan Patch R1 — Throttle Heartbeat performChecks:** (MonitoringService.kt companion MIN_GAP 1000ms + lastPerformChecksAtLocal guard).
  3. **Terapkan Patch R2 — Fix Overlay Biru/Blank dari geofence sisa state:** (LockEnforcer.showRecoveryOverlay bypass non-gps/non-accessibility target + OverlayLockActivity cabang geofence keep-overlay HANYA jika EduLock BUKAN foreground).
  4. **Cleanup 100% Instrumentasi E2E:** Semua tag `EDULOCK_E2E`, semua `// #region debug-point [A-E]:e2e-*`, semua `import android.util.Log` tidak terpakai dihapus dari 5 file Kotlin. Grep global validated 0 sisa.
- **Ringkasan Perubahan Aturan Hybrid Fase 1 Revisi (TETAP SAMA DENGAN v1.3.36-62, TIDAK BERUBAH; DIPERKUAT R1/R2):**
  - ✅ **TETAP ADA:** GPS sticky recovery overlay, airplane mode lockdown, geofence keluar area lockdown, kiosk whitelist, anti-uninstall, accessibility guard, Fix A/B GPS recovery stale expiry.
  - ➕ **DIPERBAIKI (R1/R2):** Heartbeat performChecks (42ms → 4s avg, aman HP spek rendah) + overlay geofence release EduLock foreground (tidak lagi biru/blank dari sisa state S3 offline).
  - ❌ **DIHAPUS (TETAP SESUAI KEPUTUSAN USER, TIDAK DIPULIHKAN):** Offline fail-safe 2 menit (toast countdown + overlay merah "KONEKSI HILANG"). H1 Confirmed.
- **File inti yang berubah (logic fix + cleanup instrumentation):** `MonitoringService.kt` (R1 throttle + cleanup), `LockEnforcer.kt` (R2 bypass non-gps + cleanup getter debug), `OverlayLockActivity.kt` (R2 geofence release foreground + cleanup lifecycle), `GpsEnableOverlay.kt` (cleanup), `MainActivity.kt` (cleanup sisa click GAS Siswa H5 + listener Firebase), `app/build.gradle.kts` (bump 63→64, 1.3.37→1.3.38).
- **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.38-64.apk`
- **Nama alias Final V2:** `EduLock_V2-studentRelease.apk` (alias aktif terbaru, overwrite v62)
- **Size APK stabil:** **3.76 MB** (~3850 KB, parity v1.3.36-62 → instrumentation dihapus kembali ke baseline).
- **SHA256:** **`3AFDCF4D0A36A76E650E7F26318231B276E2B558E34063ACEAF5DAF2436A2640`**.
- **STATUS UJI:** 🟢 **E2E 5 SKENARIO + 2 RETEST PATCH R1/R2 USER VERIFIED LULUS di HP FISIK:**
  1. ✅ S1 Online Normal 5 menit → LULUS (setelah R1 throttle).
  2. ✅ S2 GPS Mati → Recovery Overlay → LULUS (setelah R2 fix geofence).
  3. ✅ S3 Offline Biasa >2 menit BUKAN Mode Pesawat → LULUS (H1 confirmed; gejala biru/blank S3 = geofence state, fixed di R2).
  4. ✅ S4 Mode Pesawat → Lockdown TETAP → LULUS (H4 confirmed).
  5. 🟡 S5 Buka GAS Siswa → ONLINE normal (user confirm "mode online membuka GAS normal"), **OFFLINE tombol tidak responsif + loader muter** (INCONCLUSIVE → Next Step Investigasi Dedicated H5, TIDAK masuk build ini scope).
  6. ✅ R1 Retest Heartbeat post-throttle → User confirm R1 selesai.
  7. ✅ R2 Retest GPS Overlay post-geofence-fix → User confirm R2 selesai: "mode online/offline gps dimatikan overlay aktifkan gps berjalan normal".
- **NEXT STEP YANG WAJIB DICATAT (dari sesi debug [CLOSED]):**
  1. 🔴 **(PRIORITAS #1)** Investigasi Dedicated **H5 OFFLINE GAS Siswa Stuck Loader + Tombol Tidak Responsif**. Scope: `MainActivity.setupSchoolAppButton()` onClick → Handler 300ms → prepareAllowedExternalTransition() → stopLockTask() → launchIntent NEW_TASK. Root cause sementara: (a) race condition stopLockTask() dengan GPS recovery state; (b) GAS Siswa Firebase listener pet status OFFLINE timeout tanpa fallback explicit timeout. ONLINE normal terbukti.
  2. 🟡 **(PRIORITAS #2)** Uji R1 throttle performChecks di HP kedua spek rendah (<3GB RAM) >15 menit, cek gap heartbeat tidak >10s, tidak ada ANR.
  3. 🟡 **(PRIORITAS #3 Quick Smoke — Opsional)** Install 64 replace 63 di HP user vivo V2030 (upgrade replace JANGAN uninstall), quick smoke 5 skenario ringkas 10 menit → pastikan cleanup instrumentation tidak merusak baseline R1/R2.
  4. **Fase 2 Hybrid (Backend Presence Sync Strict)** baru dimulai SETELAH: (a) H5 OFFLINE GAS Siswa resolved; (b) R1/R2 tidak ada regresi di HP kedua.
- **Rollback jika build 1.3.38-64 bermasalah:** (a) Restore artefak: Salin `.dbg\EduLock_V2-1.3.38-64.apk` ← backup; atau (b) Upgrade-replace HP user langsung ke `Final_V2\EduLock_V2-1.3.36-62.apk` (SHA 3C2EAA91..., baseline pre-E2E production bersih). **JANGAN uninstall agar payload sekolah / FCM token tidak hilang.**

### Rilis Sebelumnya (2026-09-03 18:24) — [RELEASE V2 v1.3.36 / 62] PRODUCTION BERSIH: Rollback Instrumentasi Debug + Hapus Offline Fail-safe 2 Menit + Fix GPS Recovery Stabil (SUPERSEDED oleh 1.3.38-64)
- **Acuan Final V2 lokal:** build `1.3.36 (62)` = build bersih level 3 production, TIDAK ADA sisa instrumentation debug, DITERAPKAN keputusan user HAPUS offline fail-safe 2 menit, DITERAPKAN 2 fix GPS recovery overlay biru kosong.
- **Alasan build (keputusan user 2026-09-03 17:58):**
  1. STOP instrumentation / scientific debugger (sesi `gps-offline-silent` **[ABORT USER]**): APK trace v1.3.35-61 menyebabkan "tambah runyam" → main looper lag, proteksi diam saat online, UI tidak responsive.
  2. HAPUS TOTAL fail-safe offline 2 menit: Offline non-mode-pesawat berapapun lama TIDAK AKAN LAGI trigger overlay merah "KONEKSI HILANG!" maupun toast countdown "Internet mati. Lockdown dalam X detik".
  3. Pertahankan 2 fix GPS recovery overlay biru kosong yang dibuktikan via analisis pre-instrumentation (Fix A & B di GpsEnableOverlay + LockEnforcer).
- **Perubahan aturan Fase 1 Hybrid — REVISI (WAJIB BACA SEBELUM TEST):**
  - ✅ **TETAP ADA:** GPS sticky recovery overlay, airplane mode lockdown, geofence keluar area lockdown, kiosk whitelist, anti-uninstall, accessibility guard.
  - ❌ **DIHAPUS:** Offline fail-safe 2 menit (toast countdown warning + overlay merah "KONEKSI HILANG"). Offline biasa (bukan mode pesawat, GPS tetap ON) = proteksi tetap berjalan normal tapi TANPA TAMBAH LOCKDOWN apapun.
- **File inti yang berubah:** `GpsEnableOverlay.kt`, `LockEnforcer.kt`, `OverlayLockActivity.kt`, `MonitoringService.kt`, `MainActivity.kt`, `app/build.gradle.kts`.
- **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.36-62.apk`
- **Nama alias Final V2:** `EduLock_V2-studentRelease.apk`
- **Size APK stabil:** 3.762 MB (3852 KB).
- **SHA256:** `3C2EAA91EC2C39C3B7D0777580F8E20ECAAA8A9CFA9A26B8D7A63E108C6D7492`.
- **STATUS UJI:** 🟡 **BUILD SUCCESS + COPY OK + SHA SINKRON, WAJIB TEST 5 SKENARIO RUNTIME HP FISIK SEBELUM NYATAKAN STABIL:**
  1. 🟡 Online normal (jam sekolah, GPS ON, Internet ON): EduLock proteksi BERJALAN (tidak diam seperti v1.3.35-61).
  2. 🟡 GPS Mati (jam sekolah apapun internet): Overlay recovery GPS tampil BERISI teks + tombol (BUKAN biru kosong), tidak hilang <2 detik.
  3. 🟡 Offline > 2 menit (jam sekolah, GPS ON, Internet OFF, BUKAN mode pesawat): TIDAK ADA overlay merah, TIDAK ADA toast countdown.
  4. 🟡 Mode Pesawat (jam sekolah): Lockdown TETAP BERLAKU (overlay merah muncul).
  5. 🟡 Buka GAS Siswa (jam sekolah, online/offline): Dialog "Memeriksa Status Sahabat Belajar" tidak stuck >30 detik.

### Rilis Sebelumnya (2026-09-03 17:59) — [RELEASE V2 v1.3.35 / 61] **[ABORT USER — JANGAN DIPAKAI KE USER]** Trace Debug GPS/Offline Silent (Instrumentasi)
- **Catatan:** Build ini hanya untuk arsip sejarah, TIDAK DIPAKAI ke user (menyebabkan APK tambah runyam / proteksi diam). Sudah di-rollback total di v1.3.36-62.
- **Acuan Final V2 lokal:** build `1.3.35 (61)` = instrumentasi debug untuk investigasi GPS mati + offline silent.
- **Tujuan utama build ini:** Menjalankan sesi debug `gps-offline-silent` dengan debug server HTTP POST runtime.
- **File inti yang berubah:** `GpsEnableOverlay.kt`, `MainActivity.kt`, `MonitoringService.kt`, `OverlayLockActivity.kt`, `LockEnforcer.kt`, `app/build.gradle.kts`.
- **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.35-61-trace-gps-offline.apk`
- **Size APK stabil:** 3.77 MB.
- **SHA256:** (dicatat di Final_V2 sebagai artefak arsip)
- **STATUS UJI:** 🔴 **DIBATALKAN (ABORT USER)** — instrumentation menyebabkan main looper lag, tambah runyam, proteksi diam saat online.

### Rilis Sebelumnya (2026-09-03 17:38) — [RELEASE V2 v1.3.34 / 60] FIX GPS RECOVERY OVERLAY KOSONG
- **Acuan Final V2 lokal:** build `1.3.34 (60)` = penutupan regresi layar biru kosong saat GPS mati pada jalur recovery EduLock.
- **Tujuan utama build ini:**
  1. Saat GPS dimatikan di jam sekolah, yang tampil harus overlay recovery GPS dengan pesan dan tombol yang benar, bukan layar biru kosong.
  2. `OverlayLockActivity` disamakan ke `singleTask` agar tidak membuat task terpisah yang rawan transisi kosong.
  3. Jalur launch GPS recovery dan re-bind UI overlay dibuat lebih stabil saat activity dipakai ulang.
- **File inti yang berubah:** `AndroidManifest.xml`, `GpsEnableOverlay.kt`, `OverlayLockActivity.kt`, dan `app/build.gradle.kts`.
- **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.34-60.apk`
- **Nama alias Final V2:** `EduLock_V2-studentRelease.apk` (sekarang sudah diganti v1.3.36-62; alias ini = pointer ke versi terkini)
- **Size APK stabil:** 3.77 MB.
- **SHA256:** `EA049B0F85CBAC8E8CE6F275311C83839C095693BADD29637F87C2B4D638184B`.
- **STATUS UJI:** 🟡 **SUDAH BUILD + COPY + SHA SINKRON, MENUNGGU RETEST HP FISIK** khusus skenario GPS mati.

  - **STATUS DEPLOY:** 🟡 **BELUM DEPLOY LIVE / MASSAL**. Build ini masih untuk retest bug GPS overlay.

### Rilis Terkini (2026-09-03 17:17) — [RELEASE V2 v1.3.33 / 59] FASE 2 SATU PINTU SINKRONISASI PAYLOAD HYBRID
- **Acuan Final V2 lokal:** build `1.3.33 (59)` = penyatuan jalur sinkronisasi payload sekolah untuk roadmap hybrid offline-first.
  - **Tujuan utama build ini:**
    1. `MainActivity` dan `MonitoringService` tidak lagi menyimpan duplikasi jalur fetch config EduLock.
    2. Flow `fetch -> apply attendance -> persist payload lokal` kini dipusatkan di `SchoolSyncCoordinator`.
    3. Refresh geofence, refresh lokasi, dan re-check enforcement tetap dipicu sesuai konteks caller masing-masing.
    4. Build ini menjadi pijakan aman sebelum lanjut ke Fase 3-Fase 6 roadmap hybrid.
  - **File inti yang berubah:** `SchoolSyncCoordinator.kt`, `MainActivity.kt`, `MonitoringService.kt`, dan `app/build.gradle.kts`.
  - **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.33-59.apk`
  - **Nama alias Final V2:** `EduLock_V2-studentRelease.apk`
  - **Size APK stabil:** 3.77 MB.
  - **SHA256:** `474BC034857BEC7ED8FDE1BFFFC1D7FBBF44E60B203B24A9CC52822F5A72B77B`.
  - **STATUS UJI:** 🟡 **SUDAH BUILD + COPY + SHA SINKRON, BELUM USER-VERIFIED HP FISIK** untuk manual sync, auto sync service, dan refresh geofence pasca update payload.
  - **STATUS DEPLOY:** 🟡 **BELUM DEPLOY LIVE / MASSAL**. Build ini masih untuk uji Fase 2 hybrid.

### Rilis Terkini (2026-09-03 09:12) — [RELEASE V2 v1.3.32 / 58] FASE 1 FONDASI PAYLOAD LOKAL HYBRID
- **Acuan Final V2 lokal:** build `1.3.32 (58)` = penguatan fondasi `Data Sekolah Lokal` untuk roadmap hybrid offline-first.
  - **Tujuan utama build ini:**
    1. Payload lokal naik ke `schemaVersion=2` dengan metadata `revision` dan `versionHash`.
    2. EduLock menyimpan `lastKnownGoodPayload` agar snapshot valid terakhir tetap aman jika persist payload baru gagal.
    3. Bootstrap payload lokal di UI/service kini mensyaratkan **payload valid siap pakai**, bukan sekadar `payloadJson` non-kosong.
    4. Fondasi ini dipakai untuk melanjutkan Fase 2-Fase 6 roadmap hybrid secara aman.
  - **File inti yang berubah:** `SchoolLocalDataManager.kt`, `SchoolPayloadValidator.kt`, `PreferencesManager.kt`, `MainActivity.kt`, `MonitoringService.kt`, dan `app/build.gradle.kts`.
  - **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.32-58.apk`
  - **Nama alias Final V2:** `EduLock_V2-studentRelease.apk`
  - **Size APK stabil:** 3.77 MB.
  - **SHA256:** `3A1B741D133FD5FC38351E1B22AA6822BB3126AC2F98DE9A54017FD25FC34A8B`.
  - **STATUS UJI:** 🟡 **SUDAH BUILD + COPY + SHA SINKRON, BELUM USER-VERIFIED HP FISIK** untuk jalur sync manual, bootstrap awal, dan fallback payload valid terakhir.
  - **STATUS DEPLOY:** 🟡 **BELUM DEPLOY LIVE / MASSAL**. Build ini masih untuk uji fase fondasi hybrid.

### Rilis Terkini (2026-09-03 01:24) — [RELEASE V2 v1.3.31 / 57] OUTSIDE-SCHOOL QUIET MODE + FORCE UPDATE OVERLAY HARDENING + PET PRIORITY
- **Acuan Final V2 lokal:** build `1.3.31 (57)` = **v1.3.30 (56) seluruh perbaikan terverifikasi** + hardening regresi terbaru untuk outside-school overlay, force update, dan PET dead overlay.
  - **Tujuan utama build ini:**
    1. Di luar jam efektif / di rumah, **overlay GPS** dan **prompt overlay permission** tidak boleh muncul lagi.
    2. Saat **force update wajib** aktif, layar update harus menjadi prioritas tertinggi; tombol `Download Update` / `Tutup Aplikasi` harus tetap bisa diklik setelah layar HP OFF/ON.
    3. Di luar jam efektif, jika **PET siswa mati**, hanya **PET dead overlay** yang boleh tampil; tombol `Saya Mengerti` harus klik-sekali-langsung-keluar tanpa tertimpa overlay lain.
  - **File inti yang berubah:** `MainActivity.kt`, `MonitoringService.kt`, `ScreenReceiver.kt`, `ForceUpdateActivity.kt`, `GpsEnableOverlay.kt`, `LockEnforcer.kt`, `PetDeadLockActivity.kt`, dan `app/build.gradle.kts`.
  - **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.31-57.apk`
  - **Nama alias Final V2:** `EduLock_V2-studentRelease.apk`
  - **Size APK stabil:** 3.76 MB.
  - **SHA256:** `33A7C8331F187D0C9BC750DD20F858082C4EFF6AE03FF229B177540B1D8595E5`.
  - **STATUS UJI:** 🟡 **SUDAH BUILD + COPY + SHA SINKRON, BELUM USER-VERIFIED HP FISIK** untuk 4 skenario regresi terbaru.
  - **STATUS DEPLOY:** 🟡 **TUNDA DEPLOY MASSAL / LIVE** sampai quick test regresi terbaru lulus.

### Pendahulu Rilis Terkini (2026-09-03 00:34) — [RELEASE V2 v1.3.30 / 56] PILAR 1 HARDENING DEVICE ADMIN + Level 3 0 Debug Trace — ✅ USER VERIFIED SEMPURNA
- **Acuan Final V2 lokal:** build `1.3.30 (56)` = **Level 3 Production Clean (0 debug)** **+ PILAR 1 Applied (device_admin.xml HANYA `<force-lock/>`)**.
  - **✅ USER VERIFIED SEMPURNA (2026-09-03):** Konfirmasi user "ok semua sudah saya uji dan sempurna". 2 Quick Test LULUS 100%:
    1. ✅ **PILAR 1 LULUS:** Dialog izin Device Admin **HANYA 1 BARIS**: "Aplikasi ini meminta izin untuk: **Mengunci Layar**". TIDAK ADA peringatan Factory Reset / Hapus Data / Ubah Password / Nonaktifkan Pola. (Masalah "mengganggu siswa ketika install" **SELESAI TUNTAS**)
    2. ✅ **PARITY V1 LULUS:** Accessibility+Overlay+GPS+DeviceAdmin SEMUA OK. Admin Protect OFF → 5 detik → Protect ON. HP Siswa **LANGSUNG TERKUNCI LockScreenActivity kiosk MERAH MUDA**. TIDAK ada overlay window manager PERANGKAT TERKUNCI, TIDAK ada "betele-tele".
  - **Tujuan Utama PILAR 1 (DARURAT SISWA):** MENGHILANGKAN PERINGATAN "Factory Reset / Hapus Semua Data" yang mengerikan ketika siswa / orang tua pertama kali aktifkan izin Device Admin EduLock. SEKARANG dialog izin **HANYA 1 BARIS RAMAH:**
    > 🟢 *"Aplikasi ini meminta izin untuk: **Mengunci Layar**."*
  - **Yang dihapus di Policy:** `<disable-keyguard-features/>` (TIDAK PERNAH dipakai; memicu peringatan tambahan nonaktifkan layar kunci di ROM Android 12+).
  - **Yang dipertahankan (1-satunya policy terpakai):** `<force-lock/>` → dipanggil via `devicePolicyManager.lockNow()` di AdminPasswordActivity L209 / L236 ketika mode darurat proteksi guru aktif lock paksa HP.
  - **Nama file sederhana (arsip versioned):** `EduLock_V2-1.3.30-56.apk` (TIDAK ada tambahan tag level/fix/trace sesuai permintaan user sederhana).
  - **Nama alias Final V2:** `EduLock_V2-studentRelease.apk` (SHA 1F08BAFC sinkron SAMA dengan arsip versioned).
  - **Size APK stabil:** 3.76 MB.
  - **SHA256:** `1F08BAFCE35F8996FFA28D61E9E5BA5B88FFBA7CC749FDC8B37FD097CE55676F`.
  - **STATUS DEPLOY:** 🟢 **READY DEPLOY KE SERVER DAN DISTRIBUSI MASSAL KE SISWA & SEKOLAH** (0 debug trace, policy admin ramah siswa, parity V1 100% verified).

### Pendahulu Rilis Terkini (2026-09-03) — [RELEASE V2 v1.3.29 / 55] FASE 3 FINALISASI ADMINISTRATIF
- **Acuan Final V2 lokal (2026-09-03 Fase 3):** build `1.3.29 (55)` level2-clean (RAPAT struktur kode, NO BEHAVIOR CHANGE, 100% parity build Post-Fix-2).
  - **Tujuan utama:** (a) APK release bisa menimpa `EduLock-1.3.28 (54)` di HP (versionCode 55 > 54, package name sama). (b) **PARITY V1 1.3.28-54:** Admin ON kan protect → HP siswa **LANGSUNG TERKUNCI OTOMATIS LockScreenActivity kiosk FULL**, TANPA overlay PERANGKAT TERKUNCI window manager apapun, TANPA user harus klik "Buka EduLock" dulu ("betele-tele" HILANG).
  - **Nama distribusi V2 (arsip versioned):** `EduLock_V2-1.3.29-55-level2-clean-20260903_000003.apk`
  - **Nama distribusi V2 (alias Final):** `EduLock_V2-studentRelease.apk` (SHA sinkron dengan arsip versioned)
  - **3 Skenario USER VERIFIED LULUS di HP fisik:**
    1. ✅ **Parity V1 (PENTING):** Accessibility+Overlay+GPS+DeviceAdmin semua OK. Admin Protect OFF → ON → HP SISWA LANGSUNG TERKUNCI (LockScreenActivity muncul, NO overlay window manager).
    2. ✅ **Overlay Merah Hilang:** SetupProtectionService `⚠️ PROTEKSI AKTIF ⚠️ AREA INI DILINDUNGI` di tombol bawah MainActivity HILANG (4 titik enforcement stop service benar).
    3. ✅ **Accessibility OFF + Protect ON:** dialog recovery Accessibility JELAS (tidak tertutup overlay). Overlay PERANGKAT TERKUNCI TIDAK RAMAI / TIDAK DOBEL layer activity+window (H3+H5 teratasi).
  - **Fondasi V2 hybrid/offline yang terbawa:** data sekolah lokal (SHA hash), queue `active_devices` upload retry, queue audit `violations`, critical events audit N1-N7, `EMERGENCY_UNLOCK` Firebase fallback.
  - **Deploy `/e` & `/edulock/install` LIVE = BELUM** (menunggu arahan user L41-L47 RELEASE.md).

### Pendahulu Rilis Terkini (2026-09-02 23:42) — [POST-FIX-2 V1 PARITY LANGSUNG TERKUNCI]
- **Acuan:** build `1.3.29 (55)` post-fix2-v1-parity-langsung-terkunci
  - SHA256: `D34D29DB8001A351902FA611B8E53F2AAD7335C55E37FEC59F5A2931F328B283`
  - 3 skenario USER VERIFIED LULUS (HP fisik)
  - Sudah di-supersede oleh `level2-clean` (behavior 100% SAMA, struktur kode hanya lebih rapi).

### Pendahulu Rilis Terkini (2026-09-02 22:43) — [PATCH FASE 2 GUARD DISMISS]
- **Acuan:** build `1.3.29 (55)` fix-overlay-ramai
  - SHA256: `CCEA4C8987279C6B30FBD25076BF8565B4C6E9F8E0CC14EF531B01103E69BBE4`
  - Fondasi guard dismiss prematur & target-aware enforcement (Fix B-1 Guard showOverlay, B-2 ACTION_HIDE_WINDOW_OVERLAY onResume cleanup, B-3 root touch return false & button hideOverlay sebelum startActivity).
  - Sudah di-supersede oleh Post-Fix-2 (belum parity V1 langsung terkunci).

---

### Patch terbaru (2026-09-03 01:24 WIB) — [OUTSIDE-SCHOOL QUIET MODE + FORCE UPDATE OVERLAY + PET PRIORITY]
- **Acuan Final_V2 (arsip versioned):** build `1.3.31 (57)` `EduLock_V2-1.3.31-57.apk`
  - SHA256: `33A7C8331F187D0C9BC750DD20F858082C4EFF6AE03FF229B177540B1D8595E5`
  - **Perubahan (fix, behavior hardening):**
    1. `MainActivity.checkAndEnforceOverlayPermission()` dan `checkGPSStatus()` kini tunduk pada `isProtectionActive && isSchoolTime` sehingga **di rumah / luar jam sekolah** tidak lagi memaksa prompt recovery overlay atau GPS.
    2. `ScreenReceiver` dan `MonitoringService.requestOverlayPermissionRecovery()` ditutup agar wake-recover overlay permission tidak muncul di luar jam efektif.
    3. `MonitoringService.performChecks()` kini **return penuh** saat `isForceUpdateRequired` aktif, sambil membersihkan kiosk/lockscreen/overlay biasa agar force update screen menjadi prioritas tertinggi.
    4. `ForceUpdateActivity` kini membersihkan overlay/kiosk sisa di `onCreate()` dan `onResume()`, sehingga tombol `Download Update` / `Tutup Aplikasi` tetap bisa diakses setelah screen OFF/ON.
    5. `MonitoringService` kini memprioritaskan **PET dead overlay** di luar jam sekolah; `LockEnforcer` memblok recovery/lock overlay biasa ketika `PetDeadLockActivity` aktif.
    6. Tombol `Saya Mengerti` di `PetDeadLockActivity` dibuat single-click safe dan keluar bersih setelah membersihkan overlay/kiosk sisa.
  - **QA yang sudah dijalankan:** build pass kotlinc/javac/R8, SHA 2 target sinkron sama ✅, size stabil 3.76 MB ✅.
  - **Belum diuji user HP fisik:** 4 quick test regresi (outside-school GPS, outside-school overlay permission, force update OFF/ON screen, PET dead overlay acknowledge).
  - **Versi dibump:** `1.3.30 / 56 -> 1.3.31 / 57`

### Patch terbaru (2026-09-03 00:00 WIB) — [FASE 3 RAPIKAN KODE LEVEL 2 + APK BERSIH]
- **Acuan Final_V2 (arsip versioned):** build `1.3.29 (55)` `EduLock_V2-1.3.29-55-level2-clean-20260903_000003.apk`
  - SHA256: `2340C12172F09A5A45A959EA5EC2A7A96ABA0500050672C2FB71573E7FF6D06F`
  - **Perubahan (chore, NO BEHAVIOR CHANGE):**
    1. Ekstrak 12x blok inline POST URL debug (127.0.0.1:7777/event) yang identik & berulang 20-25 baris → 1 helper method tunggal `reportNativeStack(point, location, msg, runId, data)` 40 baris saja di MonitoringService.kt (L1650-L1687).
    2. Hapus komentar verbose `[FIX A REVISI / B-1 / X]` 100+ baris → ganti token ringkas `[A]`, `[B-1]`, `[B-2]`, `[B-3]`, `[C]`, `[X]`.
    3. Konsistenkan `runId` = default `release-post-fix` (tidak campur `pre-fix-instrument` / `post-fix-2` lagi).
    4. Build ulang dengan `minifyStudentReleaseWithR8 ✅` + `shrinkStudentReleaseRes ✅` → 0 resource/asset debug terseret, APK BERSIH production-ready.
  - QA: build pass kotlinc/javac/R8, SHA copy 3 target diverifikasi sama ✅, NO logic change.
  - Versi tetap `1.3.29 / 55` (tidak bump).

### Patch terbaru (2026-09-02 23:42 WIB) — [POST-FIX-2 PARITY V1 LANGSUNG TERKUNCI + OVERLAY MERAH HILANG]
- **Acuan Final_V2 (arsip versioned):** build `1.3.29 (55)` `EduLock_V2-1.3.29-55-post-fix2-v1-parity-langsung-terkunci-20260902_234208.apk`
  - SHA256: `D34D29DB8001A351902FA611B8E53F2AAD7335C55E37FEC59F5A2931F328B283`
  - **Perubahan (fix, logic change) — 2 root cause H3/H5 + parity V1:**
    1. `[A - PARITY V1]` Root cause SALAH logika enforceLockAfterProtectionOn overlay vs activity: `willUseWindowOverlay = !isUiForeground` (berdasarkan foreground, tidak relevan) → diganti berbasis **Compliance 4 Pilar** (Accessibility + Overlay Permission + GPS + Device Admin + `anyRecoveryTargetActive=false`). Jika LENGKAP → **LANGSUNG LockScreenActivity FULL kiosk (NO overlay window manager)**. Hasil: Admin ON protect = HP siswa OTO langsung terkunci SEPERTI V1.
    2. `[X - SetupProtectionService overlay merah]` Root cause: Service SetupProtectionService (HANYA untuk fase setup awal) TIDAK PERNAH di-stop ketika enforcement proteksi mulai berjalan → overlay merah `⚠️ PROTEKSI AKTIF ⚠️ AREA INI DILINDUNGI` tertanam PERMANEN di bawah tombol MainActivity. Tambah `stopService(SetupProtectionService)` di 4 titik kunci: ACTION_UI_FOREGROUND, showOverlayLock awal, hideOverlayLock (walau overlayLockView null, wajib stop service), enforceLockAfterProtectionOn entry awal.
  - QA HP fisik USER VERIFIED ALL LULUS (3 skenario):
    - [x] Skenario 1 Parity V1 langsung terkunci ✅
    - [x] Skenario 2 Overlay Merah Hilang ✅
    - [x] Skenario 3 Accessibility ON + Protect ON Langsung Lock ✅
  - Versi tetap `1.3.29 / 55` (tidak bump) sesuai instruksi user pertahankan nomor versi untuk patch.

### Rilis sebelumnya (2026-09-01) — [RELEASE v1.3.23 / 49]
- **Acuan Final:** build `1.3.23 (49)`
  - SHA256: `255ED1FA9261223D36A33F919540D005C8A65D8E52E2A4A29BEBF324D9C437DF`
  - Size: `3.932.567 bytes`

### Patch sebelumnya (2026-08-31) — [BUG FIX IFP SMART TV]
- **Acuan Final/public lokal (2026-08-31):** build `1.3.22 (48)` patch **Fix Kompatibilitas Smart TV/IFP tanpa GPS satellite hardware**
  - SHA256: `707E64BB56356E22BE124C3B865DA2860D7BC94D600A1CC6457C8BED1EDD...`
  - Versi tetap `1.3.22 / 48` (tidak bump, sesuai instruksi user pertahankan nomor versi untuk patch)
  - Root cause diatasi: `isGpsEnabled()` hanya menerima GPS_PROVIDER (satellite), padahal TV hanya punya NETWORK_PROVIDER
  - Perubahan 3 lapis: `LocationMonitor.isGpsEnabled()` pakai logika OR (GPS atau Network), fallback `MainActivity.isGPSEnabled()` diselaraskan, hardware GPS di AndroidManifest dijadikan `required="false"`
  - Side benefit: HP vendor China yang menonaktifkan GPS satellite hemat baterai juga tidak lagi dipusingkan overlay GPS

### Patch sebelumnya (superseded — 2026-08-28 18:51 WIB)
- Acuan Final rebuild 2026-08-28 18:51 = build `1.3.22 (48)` yang membawa patch keamanan `1.3.22` sebelumnya + fitur **Temukan Perangkat** (alarm keras + ACK status ke admin) + **patch fallback audio 2 lapis** (adjustStreamVolume `FLAG_SHOW_UI`, fallback `STREAM_MUSIC`, Vibrator fallback, status ACK detail `ALARM_STARTED_FALLBACK_MUSIC / ALARM_STARTED_VIBRATION_ONLY / FAILED_SILENT`) + **hardening enforcement** untuk bug lapangan internet mati total dan recovery Accessibility.
  - SHA256: `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`
  - Size: `3.932.182 bytes`
  - Versi tetap `1.3.22 / 48` (tidak bump, sesuai instruksi user pertahankan versi sekarang)
  - QA HP fisik yang sudah lulus pada build ini: `internet mati total -> lewat masa tenggang 60 detik mengunci` dan `Accessibility OFF -> admin ON -> overlay diabaikan tetap memaksa stay di EduLock`
  - Deploy `/e` live = **BELUM**; alias publik lokal sudah ditimpa, tetapi commit/push sengaja ditahan.

## 3. Sebelum Build
- [ ] Update atau buat entry di [BUILD_LOG.md](./BUILD_LOG.md)
- [ ] Update [CHANGELOG.md](./CHANGELOG.md) jika ada perubahan perilaku/fitur
- [ ] Tentukan item uji dari [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 4. Perintah Build

### Release siswa
```powershell
cd "D:\Dashboard Portal\native-mobile-edulock"
./gradlew :app:assembleStudentRelease
```

## 5. Output Aktual
- `app/build/outputs/apk/student/release/EduLock_V2-1.3.50-76.apk`

Salin ke Final dengan dua nama (arsip versioned + alias):

```powershell
Copy-Item "...\EduLock_V2-1.3.50-76.apk" "D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-1.3.50-76.apk"
Copy-Item "...\EduLock_V2-1.3.50-76.apk" "D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk"
```

## 6. Catatan Penting
- `release` memakai `signingConfig` **release** dari `keystore.properties` (bukan debug)
- `isMinifyEnabled = true`
- `isShrinkResources = true`
- Nama file output Gradle sudah otomatis `EduLock-<variant>.apk`

## 7. Penamaan File Distribusi
Untuk arsip Final, pakai pola versioned:

```text
EduLock-<versionName>-<versionCode>.apk
```

Contoh terkini: `EduLock_V2-1.3.50-76.apk`. Alias `EduLock_V2-studentRelease.apk` wajib ikut di-overwrite agar sinkron.

## 8. Folder Distribusi Umum

Kanonik (rilis yang dibagikan / disinkronkan ke web):

```text
D:\Dashboard Portal\Apk Release\Final_V2\EduLock_V2-studentRelease.apk
```

Arsip/uji lama:

```text
D:\Dashboard Portal\Apk Release\OK_4
```

Handoff lapangan:
- Markdown (sumber): `D:\Dashboard Portal\native-mobile-edulock\HANDOFF_LAPANGAN_EDULOCK.md`
- Salinan pegangan: `Pegangan Build APK/Edulock/HANDOFF_LAPANGAN_EDULOCK.md`
- Word Final: `D:\Dashboard Portal\Apk Release\Final\HANDOFF_LAPANGAN_EDULOCK.docx`

## 9. Sesudah Build
- [ ] Catat hasil build di `BUILD_LOG.md`
- [ ] Catat lokasi output asli
- [ ] Catat lokasi file hasil copy
- [ ] Tulis apa yang sudah dan belum diuji
- [ ] Jangan klaim live `/e` sudah versi baru sebelum sync + push App Hosting benar-benar selesai

## 10. Aturan Kejujuran Status
- Build sukses tidak otomatis berarti proteksi lapangan aman
- Jangan samarkan status uji (sleep lama, Device Admin, daftar aplikasi)
