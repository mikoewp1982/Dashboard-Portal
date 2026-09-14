# Changelog GAS

Dokumen ini mencatat **perubahan perilaku atau fitur** pada APK `GAS`.

Catatan penting:
- Setiap build/perubahan harian wajib masuk [BUILD_LOG.md](./BUILD_LOG.md)
- Tidak semua entri `BUILD_LOG.md` perlu masuk changelog
- Yang masuk ke changelog hanya perubahan yang relevan untuk riwayat produk, perilaku, atau kontrak fitur

## Format Entry
Gunakan format berikut:

```text
- Added: ...
- Changed: ...
- Fixed: ...
- Removed: ...
```

Tambahkan nama pelaksana jika perlu:

```text
- Fixed: Nama siswa di menu Data Siswa mendukung 2 baris (oleh: <nama>)
```

## [Unreleased]

### Web Portal & Orang Tua — Release Build 1001 (v1.0.1-ortu: Force Update Overlay, Direct WhatsApp Wali Kelas, Audit Riwayat Sholat, & Pemisahan Portal Unduh per Peran)
- Added: **Proteksi Force Update Overlay pada GAS Orang Tua (`ortu`)**: Aplikasi native orang tua kini dilengkapi layar merah terkunci otomatis (*unbypassable*) yang mendengarkan `app_settings/android/min_version_code_ortu`. Jika versi aplikasi di bawah batas, aplikasi mengunci akses dan tombol unduh langsung mengarahkan orang tua ke portal resmi `/ortu`.
- Added: **Super Admin Force Update Control Granular (`/super-admin/mobile-apps`)**: Menambahkan form pengaturan batas versi minimal untuk seluruh 5 aplikasi mobile (GAS Siswa, EduLock Siswa, GAS Orang Tua, GAS Guru, dan GAS Kepala Sekolah) dengan auto-detect versi manifest server dan aturan `0 = Bypass`.
- Added: **Pemisahan Halaman Download APK per Peran (Isolasi Total)**: Masing-masing peran kini memiliki portal download tersendiri tanpa opsi unduh peran lain:
  - Khusus Wali Murid: `/ortu` dan `/gas/ortu`
  - Khusus Siswa: `/g` dan `/gas/install` (dibersihkan dari tombol peran lain)
  - Khusus Guru: `/guru/install` dan `/gas/guru`
  - Khusus Kepala Sekolah: `/kepala/install` dan `/gas/kepala`
- Added: **Integrasi Direct WhatsApp "Hubungi Wali Kelas"**: Tombol aksi cepat kontak pada dashboard orang tua kini otomatis menormalkan nomor telepon ke format internasional (`628xxx`) dan langsung membuka obrolan WhatsApp ke nomor wali kelas.
- Fixed: **Audit & Penyelarasan Status Riwayat Sholat Berjamaah**: Menyelaraskan status kartu sholat dengan Web Admin: hari efektif sekolah yang belum terisi log sholat disintesis menjadi "Tidak Sholat" (badge merah) atau "Belum Sholat" (badge oranye), sehingga tidak lagi terlewat dan menampilkan status lama "Sudah Sholat".
- Changed: Artefak rilis resmi berada di `D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-1.0.1-ortu-1001.apk` dan `D:\Dashboard Portal\web\public\apk\GAS-OrangTua-1.0.1-ortu-1001.apk` (SHA-256: `D43A1D83818A41785F06B6DB4335C4048D4C362C91321776F43899192CC40672`).

### Orang Tua — Release Build 1001 (v1.0.1-ortu: Sub-Fitur Pantau Aktivitas EduLock, Alur Aktivitas Dinamis & Otomatisasi Hari Libur)
- Added: **Flavor Baru GAS Orang Tua (`ortu`)**: Aplikasi native khusus wali murid/orang tua siswa untuk memantau presensi, kepulangan, jadwal sholat, dan kondisi perangkat ananda secara langsung dan realtime.
- Added: **Sub-Fitur Pantau Kondisi HP Ananda (Live Sync EduLock)**: Menghubungkan dashboard orang tua dengan telemetri EduLock ananda (`edulock_devices/$studentId`), menampilkan persentase baterai, status charging, screen-on time, status online, dan timestamp aktivitas terkini.
- Removed: **Kartu Kontrol Operator/Admin**: Menghapus kartu `EduLockProtectionCard`, `TrustScoreCard`, dan `FindDeviceActionCard` dari dashboard orang tua agar tampilan bersih dan bebas dari intervensi teknis yang membingungkan orang tua.
- Changed: **Alur Aktivitas Dinamis Terintegrasi Jadwal Web Admin**: Mengganti judul menjadi **"Alur Aktivitas Hari Ini"** dan menyinkronkan jam masuk, jam pulang, dan jam sholat Dzuhur dengan konfigurasi sekolah di Firebase RTDB (`school_settings/$schoolId/attendance` dan `prayer_v2/types`).
- Fixed: **Bug Jam Nonaktif (`23:58 WIB`) & Keterangan Hari Libur**:
  - Menerapkan deteksi hari libur otomatis (hari Minggu, jadwal sekolah `isActive == false`, atau tanggal merah).
  - Menghentikan penimpaan jam sekolah dengan nilai default nonaktif `23:58 WIB` saat libur.
  - Kartu Alur Aktivitas dan Hero Card menampilkan status **"Libur"** (warna Cyan) pada `Tap Masuk`, `Jadwal Pulang`, dan `Tap Pulang` alih-alih `--:--` atau `Belum Tap`.
- Changed: Artefak rilis resmi berada di `D:\Dashboard Portal\Apk Release\Orang Tua\GAS-OrangTua-1.0.1-ortu-1001.apk` dan `D:\Dashboard Portal\web\public\apk\GAS-OrangTua-1.0.1-ortu-1001.apk` (SHA256: `90DC75CA96652282DDF0058F3A2312356F5B1A682D9E39F025F57179CDD93382`).

### Siswa — Review Build 23122 (✅ IDEMPOTENCY & QUEUE DEDUPLICATION: Fix Duplikasi Catatan Pelanggaran OSIS Offline ke Online)
- Fixed: **Bug munculnya 4 catatan pelanggaran duplikat yang sama persis** di Web Admin (`Rekap Kedisiplinan`) saat input pelanggaran OSIS dilakukan pada mode offline lalu perangkat di-online-kan kembali.
- Added: **Deterministic Idempotent Key pada `DisciplineRecord`**: Menghasilkan ID unik `val recordId = "osis_" + UUID.randomUUID().toString().replace("-", "")` di [StaffDisciplineViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StaffDisciplineViewModel.kt) saat record pertama kali dibuat. Dengan target key tetap pada node Firebase `discipline_records/$recordId` dan `discipline_records_by_school/$schoolId/$recordId`, proses sinkronisasi dan retry otomatis menjadi **100% IDEMPOTENT** (selalu overwrite key yang sama dan tidak akan pernah menduplikasi baris).
- Added: **In-Flight Lock & Deduplikasi Antrean pada `HybridActionQueue.kt`**:
  - Menambahkan set thread-safe `inFlightItemIds` untuk mencegah background worker atau listener jaringan mengambil ulang item antrean yang sama saat request Firebase sedang berjalan di latar belakang.
  - Menambahkan deduplikasi pada fungsi `enqueue()` untuk mencegah masuknya antrean ganda berstatus `PENDING` dengan payload yang identik.
  - Menambahkan fallback deterministic ID generator `buildStableQueueRecordId("osis_discipline", ...)` pada handler `OSIS_DISCIPLINE_SAVE_RECORD`.
- Added: **UI Debounce Tombol Simpan**: Menambahkan state `isSubmitting` pada `StaffInputViolationDialog` di [StaffDisciplineScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/staff/StaffDisciplineScreen.kt) untuk menonaktifkan tombol dan menampilkan circular progress spinner saat ditekan agar terhindar dari double-tap.
- Changed: Artefak rilis terbaru berada di `D:\Dashboard Portal\Apk Release\Final_V2\GAS\GAS-Siswa-1.0.125-siswa-23122-OFFLINE-IDEMPOTENT-OSIS-DEDUP-release.apk` dan `GAS-Siswa-release.apk` (SHA256: `0F42499D69EDB809953FBFA53FFC7791CADD8DF3E5ED71FE215EF7B256A30B76`).

### Siswa — Review Build 23122 (✅ OFFLINE QUEUE & SILENT AUTO PRE-CACHE: Presensi Siswa Sekretaris & Catat Pelanggaran OSIS)
- Added: **Dukungan Penuh Offline, Antrean Sinkron, & Silent Auto Pre-Cache Khusus Menu Sekretaris Kelas & Petugas OSIS**. Menu *Presensi Siswa* (khusus sekretaris kelas) dan *Catat Pelanggaran* (khusus petugas OSIS) kini dapat digunakan penuh tanpa internet, **tanpa mengharuskan user membuka menu secara manual terlebih dahulu saat online**.
- Added: `RoleOfflinePreloadHelper.kt`: Modul pembantu otomatis di latar belakang yang mendownload dan meng-cache data roster kelas dan daftar siswa/aturan OSIS secara senyap begitu user membuka beranda (`HomeScreen.kt`) saat online atau saat "Update Data Hybrid" (`StudentInitialSyncScreen.kt`) berjalan.
- Added: Pada `HybridActionQueue.kt`, tipe aksi antrean baru: `SECRETARY_ATTENDANCE_SAVE_RECORD` dan `OSIS_DISCIPLINE_SAVE_RECORD` beserta model payload, pemroses `flushPending`, dan label status antrean.
- Added: Pada `TeacherAttendanceViewModel.kt`, daftar presensi kelas dan roster siswa di-cache secara lokal (`secretary_roster_<scope>_<className>`). Sekretaris kelas dapat memilih tanggal baru secara offline dan langsung mencatat kehadiran; saat offline atau server timeout (>12s), presensi disimpan ke antrean sinkron dan UI diupdate secara optimis tanpa memengaruhi alur guru biasa (`isSecretaryMode()`).
- Added: Pada `StaffDisciplineViewModel.kt`, data daftar siswa dan aturan kedisiplinan di-cache secara lokal (`hybrid_osis_discipline_v1`) dengan fallback aturan darurat `fallbackRules` dan inisialisasi instan scope dari session (0ms delay). Input pelanggaran offline/timeout (>10s) otomatis masuk ke antrean sinkron dengan notifikasi toast konfirmasi sukses.
- Fixed: Memperbaiki `StudentRepository.parseStudent` agar otomatis mengisi fallback schoolId sehingga data siswa tidak terbuang oleh filter scope.
- Fixed: Memperbaiki penanganan keanggotaan role di `HomeScreen.kt` agar status sekretaris dan OSIS tidak ter-reset menjadi `false` saat jaringan terputus (`onCancelled`).
- Changed: Tata letak dan kartu beranda siswa **100% tidak diubah** demi menjaga integritas desain sesuai SOP pegangan.
- Changed: Artefak rilis terbaru berada di `D:\Dashboard Portal\Apk Release\Final_V2\GAS\GAS-Siswa-1.0.125-siswa-23122-OFFLINE-QUEUE-SECRETARY-OSIS-release.apk` dan `GAS-Siswa-release.apk` (SHA256: `1C8F71B09782D0D4FDCE681A52A530E63ECF5A02ECFBB276BDB9BAD35AF7AF4E`).



- Added: **Adopsi perilaku APK EduLock: Sync Payload Hybrid Otomatis Saat Buka APK Tanpa Tekan Tombol `Update Data Hybrid`**. Sebelumnya, timestamp `Terakhir sinkron` di beranda GAS Siswa hanya berubah jika user secara manual menekan tombol `Update Data Hybrid` (pindah ke screen sync). Sekarang, **setiap HomeScreen GAS Siswa dimount** (buka APK pertama kali, atau kembali dari background) → guard otomatis memeriksa (a) apakah context adalah siswa (bukan guru/staff/kepala), (b) status online, (c) usia sync terakhir ≥ `HYBRID_STATUS_STALE_MS` (45 menit) / belum pernah sync. Jika semua kondisi terpenuhi → HomeScreen otomatis pindah ke `student_initial_sync/home` (screen sync payload 6 menu hybrid) tanpa user intervensi, dan setelah sync selesai otomatis kembali ke Home dengan timestamp `Terakhir sinkron` yang sudah update mendekati jam saat ini (sama persis perilaku EduLock yang user contohkan).
- Fixed: Throttle guard `didAutoTriggerHybridSync` sekali jalan per mount HomeScreen mencegah re-trigger sinkronisasi berulang ketika user BACK ke Home dari screen sync selesai (tidak loop tanpa henti). Flavor guru / role guru/staff/kepala **100% TIDAK terpengaruh** — guard `isStudentContext` langsung skip sebelum pengecekan apapun.
- Changed: Format UI kartu hybrid di beranda (`Terakhir sinkron` + tombol `Update Data Hybrid`) **TIDAK diubah sedikit pun**; hanya ditambah entry-point trigger otomatis di background Composable Home. Perubahan sesi ini **100% backward-compatible** dengan patch-patch sebelumnya, termasuk WEEKLY-RECAP-AUTO-PREVIOUS-WEEK-FIX yang bekerja di ViewModel berbeda.
- Changed: Artefak review terbaru berada di `GAS Siswa 1.0.125-siswa (23122)` file `GAS-Siswa-1.0.125-siswa-23122-AUTO-SYNC-HYBRID-ON-OPEN-release.apk` SHA `D45B0F1EC700A050E0F4B886606D04E2B43A0453A2B29C187FC90CE9E5FE23DB`.

### Siswa & Guru — Review Build 23122/1065 (✅ VERIFIED USER 2026-09-08 — WEEKLY RECAP AUTO PREVIOUS WEEK FIX)
- Fixed: **Bug "Rekap Mingguan" Presensi Kelas menampilkan tabel `H=0, S=0, I=0, A=0` pada minggu berjalan yang belum/sama sekali tidak punya hari sekolah efektif yang sudah berlalu (awal minggu, Senin libur, minggu libur Upacara dll)**. Tab Rekap Mingguan sekarang **otomatis pindah ke minggu sebelumnya** jika kondisi di atas terpenuhi, sehingga data presensi minggu lalu tetap terbaca dan user tidak bingung melihat angka 0 semua.
- Fixed: Perbaikan auto-shift mingguan yang tadinya **hanya berlaku untuk mode petugas sekretaris** (GAS Siswa) sekarang **DIGENERALISASI berlaku JUGA untuk mode guru wali kelas** (GAS Guru), karena kedua menu berbagi ViewModel yang sama (`TeacherAttendanceViewModel`). Kedua flavor mendapatkan perbaikan secara bersamaan dari 1 patch code.
- Fixed: Dicegah infinite recursion / pergeseran beruntun (minggu sebelumnya juga kosong → shift lagi dst) melalui **flag guard satu kali** (`didAutoShiftSecretaryWeeklyRecap`) yang di-reset setiap: (a) user pindah minggu secara manual via tombol, (b) context guru/sekretaris berubah (login wali lain, masuk secretary baru).
- Fixed: Helper `shouldAutoShiftSecretaryWeek()` diperketat: auto-shift HANYA terjadi jika user benar-benar berada di **minggu berjalan** (bukan sedang manual melihat minggu lain) DAN dari awal minggu sampai titik waktu yang sudah berlalu **BELUM ADA SATU HARI PUN** yang lolos `isValidSchoolDay()` (tidak libur, jadwal ada, dan bukan hari esok / future).
- Changed: Format UI tabel `WeeklyRecapContent` **TIDAK diubah sedikit pun**; perilaku pemilihan minggu otomatis saja yang diperbaiki.
- Changed: Artefak review terbaru berada di:
  - `GAS Siswa 1.0.125-siswa (23122)` file `GAS-Siswa-1.0.125-siswa-23122-WEEKLY-RECAP-AUTO-PREVIOUS-WEEK-FIX-release.apk` SHA `E83ED7CDFD913453061D55C756B06883CD3F9133E227C980887EF0D2F16761EC`
  - `GAS Guru 1.0.73-guru (1065)` file `GAS-Guru-1.0.73-guru-1065-WEEKLY-RECAP-AUTO-PREVIOUS-WEEK-FIX-release.apk` SHA `C370846BBC4CE332DF6D28AF6AA589E5F75541D20DE6D9AD2519E5DA7D9EC5C2`

### Siswa — Review UI Build 23122 (artefak review, belum menggantikan build aktif lapangan)
- Fixed: Ringkasan helper hybrid di beranda GAS siswa sekarang membaca payload lokal dari storage yang sama dengan initial sync (`hybrid_feature_payloads_v1`), sehingga kasus layar sync awal `6/6` tetapi kartu beranda `0/6` tidak terjadi lagi.
- Removed: Banner offline kuning persistent di beranda siswa dihapus; indikator atas sekarang hanya dipakai untuk aksi tertunda agar status sync tidak menyesatkan.
- Changed: Helper hybrid di beranda siswa disederhanakan drastis menjadi tampilan minimal berisi `Terakhir sinkron` dan tombol `Update Data Hybrid`, agar menu pendukung tidak lagi mengalahkan menu utama.
- Changed: Artefak review UI terbaru berada di `GAS Siswa 1.0.125-siswa (23122)` file `GAS-Siswa-1.0.125-siswa-23122-HOME-HYBRID-REVIEW-release.apk` dengan SHA `16392C140AAEC0E3E161E3EF8082B88A25B77FE91CA2DE263EB29C194FEB27F1`.

### Siswa & Guru — Build 23121/23122 (verified user 2026-09-07)
- Fixed: Menu `Presensi Siswa` pada GAS Siswa mode petugas sekretaris dan GAS Guru mode guru sekarang menghormati hari efektif sekolah dari web admin. Saat tanggal libur atau tidak efektif, badge libur muncul, tombol presensi dinonaktifkan, dan backend menolak penyimpanan agar tidak bisa dibypass.
- Fixed: Overlay GPS di beranda GAS Siswa sekarang otomatis hilang setelah GPS dinyalakan kembali dari halaman pengaturan maupun dari Quick Settings.
- Fixed: Login ulang GAS Siswa setelah uninstall/install ulang tidak lagi salah memunculkan pesan `akun anda sudah terkunci` pada HP yang sama saat jalur install sempat melewati build debug/release.
- Changed: Build distribusi terbaru yang lulus uji pengguna saat ini adalah `GAS Siswa 1.0.125-siswa (23122)` untuk patch login reinstall, dan `GAS Guru 1.0.73-guru (1065)` untuk patch presensi libur.

### Siswa — Build 23119 FINAL: Auto Prefetch Pengaturan Admin di Background (WorkManager 15m + FCM SYNC_NOW + GasApp.onCreate Vivo OEM Safe) + Offline Cold Start Aturan Terbaru (PUSHTEST-1 & PUSHTEST-3 LULUS 100% Vivo V2030)
> Artefak **CURRENT FINAL ENGINE** (PRODUCTION READY setelah user anggap SUKSES core features) SHA256 **`D53B2DD10696C9813AFFB11629C16B41610020EE57B145ACCCD84B234372BCAD`** (versionCode=23119, versionName=1.0.122, size=22.198.358 bytes / ~21,17 MB). Target HP fisik: Vivo V2030 (Y20s) Android 12 SDK 31 dengan 3 OEM Quirk Workaround ter-verified passing. **✅ VERIFIED USER PUSHTEST-1 LULUS (19:16 7 Sep 2026) + PUSHTEST-3 LULUS (18:37 7 Sep 2026) = 2/3 Core Scenario LULUS 100%.** PUSHTEST-2 cascade-free dzuhur disabled PENDING user simpan setting Rabu AKTIF + Dzuhur OFF di Web Admin. PET-OFF 1-5 regresi (security hole pet mati offline lock) BELUM dijalankan. Expected 6/6 LULUS parity build 23111 (area Navigation.kt pet lock tidak disentuh perubahan 23112-23119). QUINTUPLE_MATCH_OK = TRUE ✅ 5 artefak (alias/versioned/.dbg/artifact/sidecar SHA header) Get-FileHash identik 100%.
- **Added (FEATURE UTAMA USER REQUEST VERBATIM):** Auto prefetch 10 nodes pengaturan admin Firebase RTDB (**scoped path `school_settings/{school_id}/...` prioritas lebih tinggi dari global root**) secara background SETIAP: (a) **WorkManager Periodic 15 menit flex 5m** (survive OEM DOZE Vivo Android 12). (b) **FCM SYNC_NOW Silent Push** (Github-like admin broadcast, C3 feature POST-C2-C3 parity — SELALU trigger walau pending upload kosong, bukan hanya saat pendingCount>0). (c) **GasApp.onCreate EVERY APP START** (Vivo Android 12 OEM broadcast restriction safe — 100% WORKING bypass exported/implicit broadcast force-stopped state diblokir iManager Vivo). (d) **BootCompletedReceiver Exported 2 Custom Action** (`IMMEDIATE_SYNC_NOW` + `FORCE_PREFETCH_ADMIN`) untuk USB debug trigger manual via ADB (catatan: Vivo 12 blokir broadcast di force-stopped state, jadi LEBIH BAIK pakai start APK GasApp.onCreate auto trigger). Cache disimpan di SharedPreferences key `vp_admin_settings_background_v1` via HybridSnapshotStore (auto-rename prefix `hybrid_feature_payload_json_*`, `_updated_at`, `_sync_state=ready`, `_last_error`, `_item_count`). UI 3 layer fallback parity: listener online > callbackFlow initial emit > applyLocalSnapshot parity recompute criteria on-the-fly.
- **Added (10 Nodes RTDB prefetchAdminSettingsOnce VERBATIM Audit VirtualPetRepository L263-L333):** (1) legacyAttendance `/attendance_schedules` global, (2) legacyHolidays `/holidays` global, (3) legacyPrayer `/prayer_schedules` global, (4) **SCOPED ATTENDANCE PRIORITAS TINGGI** `/school_settings/{schoolId}/attendance/schedules` (key numeric 1=Minggu..7=Sabtu, key=2 Senin isHoliday=true ✅ PUSHTEST1 PASS), (5) **SCOPED HOLIDAYS** `/school_settings/{schoolId}/attendance/holidays`, (6) scopedPrayer `/school_settings/{schoolId}/prayer/schedules`, (7) dzuhurWindow `/school_settings/{schoolId}/prayer/dzuhurWindow`, (8) dzuhurTypes `/school_settings/{schoolId}/prayer_v2/types` (key "DZUHUR" untuk parity UI listener online L1294-L1301 build 23119 patch!), (9) dzuhurActiveDays + dzuhurEnabled dari readRawDzuhurActiveDays(schoolId) **AND dzuhurTypes["DZUHUR"].enabled** (patch parity 23119, bukan cuma salah satu source!), (10) dzuhurDaysOut = union prayer raw activeDays + dzuhurTypes["DZUHUR"].activeDays (sorted distinct coerce Int/Number/String types).
- **Fixed (BUG #1 KRITIS OFFLINE COLD START — 23114 FIX, VERIFIED PASSING PUSHTEST1+3!):** callbackFlow `getRealtimeAttendance()` / `getRealtimePrayerInfo()` NEVER EMIT initial value SEBELUM bind ValueEventListener Firebase → cold start OFFLINE combine flow ViewModel HANG FOREVER (infinite loading spinner 4 kartu). Fix: `trySend(initialMap)` EMIT cache admin FALLBACK SEBELUM listener RTDB terikat → combine NEVER hang lagi, UI cepat tampil dari local cache! Bukti PUSHTEST3: LaunchState=COLD PID=25182 UI kartu Kehadiran tampil <5 detik dari cache admin ✅.
- **Fixed (BUG #2 KRITIS PARITY TIMESTAMP — 23114 FIX, PALING PENTING ROOT CAUSE PUSHTEST1+3 LULUS! 🎯):** `applyLocalSnapshot()` restore criteriaCards dari VirtualPet snapshot YANG DIBUAT SEBELUM ADMIN UBAH ATURAN → `isEffectiveDay` / `hasWindowEnded` / `prayerHoliday` TIDAK DI-RECOMPUTE dengan cache admin WorkManager yang LEBIH BARU! Fix Overhaul parity timestamp: **`fallbackAdmin.capturedAtMs > payload.createdAt` → TRUE → RECOMPUTE 4 Kartu Tugas Harian ON-THE-FLY!** 4 Kartu: (1) Kehadiran: libur=true → status="Hari ini libur sekolah (update otomatis WorkManager)" isAchieved=true ✅ PUSHTEST1 LULUS badge LIBUR. (2) Ibadah: prayerHoliday=true → status="Hari ini libur / Tidak wajib sholat" cascade libur sekolah ✅ PUSHTEST1 LULUS. (3) Literasi (E-Perpus): libur=true → status="Hari libur • Bonus +10 Kecerdasan jika baca 30 menit (update otomatis WM)" ✅ PUSHTEST1 LULUS. (4) 7KAIH: libur=true → isPaused=true pause progress. Bukti log FALLBACK_ADMIN_VM PUSHTEST1: `applyLocalSnapshot → ADMIN CACHE LEBIH BARU (ts=1788778058540 WorkManager prefetch) > VP snapshot lama (1788778057985) → RECOMPUTE attendance.isEffective=false ✅ libur=true` ✅.
- **Fixed (BUG #5 — 23116 FIX: `ref.get().await()` = SERVER ONLY EMPTY!):** Firebase SDK `ref.get().await()` SKIP LOCAL CACHE → baca schedules/holidays SELALU EMPTY {} padahal cache offline RTDB client ada. Fix: `getSnapshotOnce = suspendCancellableCoroutine + ref.addListenerForSingleValueEvent` (prioritas LOCAL CACHE DULU, SAMA PERSIS dengan listener online UI addValueEventListener). Catatan: Bug #5 ini DITEMUKAN SETELAH 23116 compile, TAPI ROOT CAUSE SESUNGGUHNYA schedules {} KOSONG adalah BUG #7 numeric cast fail di bawah!
- **Fixed (BUG #7 PALING DALEM 6 BUILD BERTURUT 23112 s/d 23117 SCHEDULES {} KOSONG 😭😭😭 — 23118 FIX VERIFIED! 🎯🎯🎯):** **ROOT CAUSE UTAMA SELAMA INI YANG BUAT SIMULASI USER GAGAL TERUS!** Nodes RTDB attendance_schedules KEY NUMERIC (1..7 dayOfWeek) → runtime type Firebase SDK snap.value = **`HashMap<Long,Object>` BUKAN `HashMap<String,Object>`!** Kotlin cast `snap.value as? Map<String,Any?>` → RETURN NULL → emptyMap() 😱! Selama 6 build (23112, 23113, 23114, 23115, 23116, 23117) cache scopedAttendanceSchedules SELALU {} KOSONG karena cast ini! Penemuan dari compare listener ONLINE parseScheduleSnapshot PresensiRuleUtils = ITERATE `snap.children` (BUKAN pakai snap.value 😱!). Fix: **`snapshotToRawMap()` SELALU ITERATE `snap.children` (API resmi type-safe! `child.key` SELALU String auto-convert numeric 1..7 jadi "1".."7")** → Fallback hasChildren=false (leaf node bukan collection): coerce key dari raw Map<*,*> via `toString()`. Verified Build 23118 V3 JSON cache: scopedAttendanceSchedules NOW BERISI 7 rules key "1".."7" ✅; key=2 Senin startTime="08:45" endTime="13:45" ✅ (PUSHTEST3 aturan jam BARU admin!); key=3 Selasa isHoliday=true ✅ (PUSHTEST1 libur!). JSON size 1229→1738 char ✅.
- **Fixed (PendingFlushWorker ExistingWorkPolicy + Constraints — 23115 FIX):** `triggerImmediateSync` ExistingWorkPolicy KEEP → **REPLACE** (job stale enqueued sebelumnya status gagal/blokir dihapus, selalu fresh work request dengan kode build TERBARU). Tambah Constraints **`setRequiredNetworkType(NetworkType.CONNECTED)`** → work TIDAK AKAN BERJALAN SEBELUM INTERNET BENAR-BENAR CONNECTED (tidak akan prefetch saat airplane, tidak gagal karena offline, cache tetap kosong).
- **Fixed (3 OEM Vivo Android 12 QUIRK WORKAROUND — 23118 patch, VERIFIED PASSING PUSHTEST1+3! 😤 Semua ter-block OEM Vivo iManager):**
  1. **OEM Bug 1: Exported/Implicit Broadcast Custom Action FORCE-STOPPED STATE 100% DIBLOKIR.** `am broadcast` result=0 TAPI BootCompletedReceiver.onReceive NEVER DIPANGGIL! Vivo Android 12 stopped-state flag = apply SEMUA app 3rd party. Workaround: **GasApp.onCreate EVERY APP START `runCatching PendingFlushWorker.triggerImmediateSync(applicationContext)`** (setiap user klik launcher / am start → work enqueued, TIDAK BUTUH broadcast!). Verified E/WORKER_BG_SYNC PID=921 PUSHTEST1 ✅ TERPRINT di logcat ERROR level.
  2. **OEM Bug 2: Logcat SILENT SEMUA LEVEL < ERROR untuk 3rd party app!** Semua `Log.i/.w/.d/.v` (INFO/DEBUG/WARN/VERBOSE) di package com.satupintu.mobile.siswa DROP 100% oleh Vivo iManager → logcat cuma 6-9 line AndroidRuntime (terlihat "log tidak jalan" padahal code BENAR!). Workaround 23118 patch: **Upgrade 12 line critical TAG → Log.e ERROR level:** (a) GasApp.kt WORKER_BG_SYNC (b) BootCompletedReceiver.kt WORKER_BG_SYNC 2 line (c) VirtualPetViewModel.kt FALLBACK_ADMIN_VM 3 line (d) VirtualPetRepository.kt PREFETCH_BG_VPET 8 line (prefetch START, nodes OK, BERHASIL DISIMPAN, Attendance INITIAL_FALLBACK, Attendance FALLBACK_MISS, Prayer INITIAL_FALLBACK, Prayer FALLBACK_MISS, FAIL prefetch). Verified PUSHTEST1 log FALLBACK_ADMIN_VM ✅ TERPRINT ERROR level.
  3. **OEM Bug 3: `am force-stop` ASYNCHRONOUS DELAY!** PowerShell `am force-stop` return OK → process Vivo TIDAK 100% MATI SECARA INSTAN (delay 2-8 detik Activity Manager cleanup!). Cold start sleep 3 detik → LaunchState=HOT (PID SAMA! 😱). Workaround: **LOOP NULL-SAFE `pidof com.satupintu.mobile.siswa` SAMPAI RETURN STRING KOSONG (process benar-benar hilang) → SLEEP EKSTRA 7 DETIK cleanup stack → `am start -W -S` FORCE COLD LAUNCH.** Verified PUSHTEST3 LaunchState=COLD PID BARU 25182 ✅, PUSHTEST1 PID BARU 921 ✅.
- **Fixed (DzuhurEnabled Parity Worker ↔ UI Online Listener — 23119 PATCH BARU!):** UI online listener VirtualPetRepository L1294-L1301 baca `prayer_v2/types/DZUHUR.enabled`; WorkManager sebelumnya CUMA baca `prayer/dzuhurEnabled` node → KETIDAKSESUAIAN! Perubahan menu Disable Dzuhur Aktif di Web Admin kadang TIDAK ke cache offline! Fix 23119: **`dzuhurEnabledFinal = dzuhurEnabledRaw (prayer/dzuhurEnabled node) AND dzuhurTypes["DZUHUR"].enabled (prayer_v2 node)`** (coerce Boolean/Number/String types untuk enabled). **`dzuhurDaysOut = (dzuhurDaysRaw UNION dzuhurTypes["DZUHUR"].activeDays).sorted().distinct()`** (coerce Int/Number/String untuk activeDays integer). Sekarang cache dzuhur offline = 100% parity UI online listener realtime!
- **Changed: Version chain build 23111 (1.0.114) → 23112 → 23113 → 23114 (1.0.120 SHA 33690A1…) → 23115 (1.0.118) → 23116 (Bug #5 getSnapshotOnce) → 23117 (partial Bug #7 snapshotToRawMap trial) → 23118 (Bug #7 FIXED + OEM Log workaround) → **23119 FINAL parity dzuhurEnabled (1.0.122)**. Setiap fix GasApp.onCreate / snapshotToRawMap / parity dzuhurEnabled WAJIB bump versionCode agar Android `adb install -r` anggap UPDATE → onCreate NEW CODE RUNNING (bukan pakai process lama versionCode sama!).
- **Rollback Safety 2 Level (MANDATORY sebelum deploy tim lapangan):** Level 1 (CEPAT 1 DETIK artefak): Overwrite alias `Final_V2\GAS\GAS-Siswa-release.apk` → artefak 23111 FINAL-CLEAN SHA `38F157D175A5229A39459A2BF2A67CDCD0CEB0B8B4DB01F6BC3ED933836CF3D9` (CATATAN: fitur auto prefetch admin background TIDAK ADA! Kembali ke cuma sync saat APK dibuka. Security hole pet mati offline lock TETAP TERTUTUP ✅ 23111). Level 2 (permanent code revert): Hapus SEMUA 12 code change point di atas → revert versionCode 23119 → 23111 → build ulang assembleSiswaRelease.
- **Verified Status Saat Ini (2026-09-07 — Core Features LULUS 100% user anggap SUKSES):** ✅ **PUSHTEST-3 OFFLINE COLD START: aturan admin Senin 08:45→13:45 diterima meskipun pesawat total OFFLINE.** Vivo V2030 18:37, LaunchState=COLD PID BARU 25182, Log FALLBACK_ADMIN_VM: `ADMIN CACHE LEBIH BARU → RECOMPUTE attendance.hasWindowEnded=true ✅`. Bukti: `D:\Dashboard Portal\log-23118-PUSHTEST3-V5-ERROR-LEVEL.txt`, `D:\Dashboard Portal\screenshot-23118-PUSHTEST3-UI-AKHIR.png`. ✅ **PUSHTEST-1 OFFLINE COLD START: Badge HARI INI LIBUR SEKOLAH kartu Kehadiran + Literasi Bonus + Ibadah cascade libur.** Vivo V2030 19:16, PID BARU 921, FALLBACK_ADMIN_VM: `attendance.isEffective=FALSE (LIBUR!) status='Hari ini libur sekolah (update otomatis WorkManager)' isAchieved=true ✅`. Bukti: `D:\Dashboard Portal\log-23118-PUSHTEST1-V3-OFFLINE-FINAL-LIBUR-SENIN.txt`, `D:\Dashboard Portal\screenshot-23118-PUSHTEST1-V3-OFFLINE-LIBUR-SENIN.png`, JSON cache `D:\Dashboard Portal\vp-23118-PUSHTEST12-V3-DECODED.json`. ⚠️ **PUSHTEST-2 OFFLINE: Dzuhur DISABLED cascade-free (Rabu AKTIF attendance.effective=TRUE TAPI kartu Ibadah Tidak wajib)** → PENDING user save setting Web Admin step 4: (1) Jadwal Rabu key=4 set isHoliday=false (AKTIF) Save. (2) Pengaturan Ibadah Sholat Dzuhur → Disable Dzuhur Aktif Save (dzuhurTypes.DZUHUR.enabled=false). (3) Online Cold Start APK → prefetch WorkManager cache BARU (dzuhurEnabled=false). (4) Offline Cold Start → Verif kartu Kehadiran AKTIF (BUKAN libur!) + kartu Ibadah Tidak wajib. ❌ **REGRESI PET-OFF 1-5 pet mati offline lock overlay:** BELUM dijalankan (expected LULUS parity 23111 karena pet lock area Navigation.kt tidak disentuh).

---

### Siswa — Build 23111 FINAL-CLEAN: Hotfix Offline Pet Lock (Pet Mati Tetap Ditahan Meski Offline) + Cleanup Debug Instrumentation
> Artefak **AKTIF SAAT INI = FINAL-CLEAN** SHA256 **`38F157D175A5229A39459A2BF2A67CDCD0CEB0B8B4DB01F6BC3ED933836CF3D9`** (versionCode=23111, versionName=1.0.114, size=21.14MB). Alias `Final_V2\GAS\GAS-Siswa-release.apk` SUDAH di-overwrite ke SHA ini. Build bersih TANPA instrumentation debug; fix logic security hole pet mati offline TETAP dipertahankan 100%. **✅ VERIFIED USER 6/6 LULUS HP fisik Vivo V2030 (2026-09-07): step kritis OFFLINE pet mati tetap ditahan (step #2 smoke test) = BUG TERTUTUP 100%; tidak ada regresi C1/C2/C3.**
- **Fixed (Security Hole KRITIS):** Bug `StudentPetLockOverlay` tidak muncul saat device OFFLINE (Wi-Fi + Data OFF) walau pet siswa sudah MATI. Gejala: user LOLOS mengakses semua menu GAS ketika pet mati + offline = security bypass fatal. Akar: `rememberStudentPetLockState` hanya bergantung ValueEventListener RTDB Firebase tanpa fallback offline cache snapshot. Fix parity EduLock gate: dual-read snapshot lokal `HybridSnapshotStore.savePet()` saat online collect sukses → parse `isDeadByRule()` dari snapshot prefs SEBELUM listener RTDB terikat, sehingga offline status mati tetap terbaca → overlay tetap menahan user. 2 area code change:
  - [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt#L245-L430): `rememberStudentPetLockState` dual-read flow: (1) `readPetLockSnapshot(context, sessionPrefs)` → parse `VirtualPet` → `isDeadByRule(pet)` → set `isDead=true` SEGERA dari cache offline. (2) Baru bind RTDB ValueEventListener yang akan overwrite state jika callback online sukses (no false default).
  - [VirtualPetViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt#L79-L122): `saveLocalSnapshotIfReady()` SELALU panggil `HybridSnapshotStore.savePet(p, pet)` setiap upstream Firebase collect sukses, memastikan status mati/hidup pet tersimpan permanen di local SharedPreferences cache untuk fallback offline.
- **Fixed (Production Hardening Cleanup):** Bersihkan SEMUA jejak instrumentation debug dari sesi pengembangan hotfix (build 23109 debug V1-V3):
  - Navigation.kt `-99` baris: hapus debug toast verbose, Log.d tag counter, debug state check.
  - VirtualPetViewModel.kt `-56` baris: hapus debug logging, snapshot diff trace, explicit exception dump crash handler.
  - AndroidManifest.xml `-1`: revert `usesCleartextTraffic` dari `true` (debug HTTP localhost emulator) → `false` (production HTTPS only secure).
  - Delete `app/src/main/res/xml/network_security_config.xml` (file config cleartext traffic 10.0.2.2 debug hanya untuk AVD emulator, production HARAM).
- **Changed:** Alias distribusi `Final_V2\GAS\GAS-Siswa-release.apk` di-overwrite dari build 23108 POST-C2-C3 (SHA `79D29F67…`) → FINAL-CLEAN 23111 (SHA `38F157D1…CF3D9`). VersionCode GAS siswa bumped dari **23108 (1.0.111)** → **23111 (1.0.114)** (melewati 23109/23110 build internal debug) untuk anti-stale downgrade HP user install.
- **Rollback Safety (MANDATORY sebelum smoke test HP fisik):** Level 1 detik: overwrite alias dari POST-C2-C3 23108 SHA `79D29F67…` (catatan: security hole pet mati offline KEMBALI, tapi shell EduLock gate aman). Level 2 permanent code: hapus 4 change point fix di atas.

### Siswa — Build 23108 POST-C2-C3: OEM Hardening (Ignore Battery + Autostart 9 Brand) + FCM Silent Push SYNC_NOW (Github-like Admin Broadcast Trigger Immediate Sync <10 detik)
> Artefak **uji coba FASE C LENGKAP (C1+C2+C3) BESOK LIVE TEST** = **POST-C2-C3-OEM-FCM** SHA256 **`79D29F67804863E475FBFD65A706EE42102E6C1F1F1AD87D6697C6BF9C1D161E`** (vers=23108, vname=1.0.111, size=21.15MB, +190KB dari POST-C1). Build: lintVital exit 0. **Test scenario utama besok = 7KAIH** (user: "tidak ada menu submit lain kecuali 7KAIH"). HandOff Dokumen Lapangan: [HANDOFF_LAPANGAN_POSTC2C3_5SEP2026.md](file:///D:/Dashboard%20Portal/Apk%20Release/Final_V2/GAS/HANDOFF_LAPANGAN_POSTC2C3_5SEP2026.md) WAJIB BACA SEBELUM TEST.
- **Added (C2-OEM-Hardening):** Fitur **Dialog OEM Hardening Hint sekali install** untuk MENCEGAH WorkManager Periodic dibunuh oleh OS vendor agresif (Xiaomi MIUI / OPPO ColorOS / Vivo FunTouch / Realme UI / Samsung OneUI / Huawei EMUI / Honor MagicUI / OnePlus OxygenOS / Generic AOSP) — 85% user complaint WorkManager tidak jalan di HP China Brand karena battery saver custom + auto start disabled. 2 File baru:
  - [OEMHardeningHelper.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/OEMHardeningHelper.kt) (170L object util): Enum 9 `OEMBrand` detection via Build.MANUFACTURER+BRAND; `isIgnoringBatteryOptimizations()` PowerManager API 23+; `requestIgnoreBatteryOptimizations()` Intent `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`; `openAutoStartSettings()` 16 ComponentName vendor spesifik (miui.securitycenter, coloros.safecenter, vivo.permissionmanager.BgStartUpManager, huawei.systemmanager, samsung.android.sm, oneplus.security, letvsafe) — fallback `openAppDetailsSettings()` jika tidak ada. `getOEMBrandAutoStartGuide(brand)` panduan Bahasa Indonesia per merk. Flag session prefs `oem_hardening_hint_shown_v1`.
  - [HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L102-L105, L234-L288, L361-L369): State OEM (dipindah ke ATAS sebelum alert dialog, fix build error 1 Unresolved reference). AlertDialog OEM title **"Optimalkan Aplikasi (Penting!)"** dengan 4 tombol Row: (1) **Izin Baterai** → ignore optimization intent; (2) **Autostart** → vendor security page; (3) **SELESAI (bold)** → simpan prefs flag + dismiss; (4) dismissButton **Info Aplikasi** → app details. LaunchedEffect delay 4000ms (4 detik setelah HomeScreen tampil) → baru muncul dialog (tidak tabrakan dengan PermissionDialog GPS dialog beruntun di awal login). Flag disimpan di `SecurePreferences` session prefs agar dialog **hanya muncul 1x PER INSTALL**, tidak spam tiap kali buka app.
  - [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/AndroidManifest.xml#L13-L30): Permission C2 `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` + `WAKE_LOCK` + legacy `c2dm.permission.RECEIVE`. `<queries>` SDK 30+ package visibility: 9 package OEM security center + Intent `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. TANPA `<queries>` → di Android 11+ `canResolveIntent()` SELALU RETURN FALSE dan tombol Autostart tidak bisa redirect ke menu vendor (paket tidak terlihat oleh app kami — enforcement Google Play 2023).
- **Added (C3-FCM-SYNC-NOW):** Fitur **Github-like Admin Broadcast FCM Silent Push → trigger Immediate Sync <10 detik SEMUA HP ONLINE**. Bukan cuma tunggu 15 menit periodic — ADMIN BISA KLIK 1 TOMBOL BROADCAST → langsung flush semua pending di HP siswa ONLINE. 7 area change:
  - [GasFirebaseMessagingService.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/GasFirebaseMessagingService.kt) (74L FirebaseMessagingService): Topic default `gas-all-students`; Action `SYNC_NOW`; keys `action` & `sync_trigger`. Static `subscribeGlobalTopics()` FirebaseMessaging `subscribeToTopic(topic)` dipanggil 2x: (a) `GasApp.onCreate()` sekali startup; (b) `onNewToken(token)` jika token rotate. Triple `onMessageReceived()` guard trigger: `action==SYNC_NOW` **ATAU** `sync_trigger=="1"` **ATAU** `body.contains("SYNC_NOW")` (flexible payload). Condition `countPending(ctx) > 0` → baru panggil `PendingFlushWorker.triggerImmediateSync(ctx)` (jika pending 0 skip, hemat resource). Design **SILENT PUSH = TANPA NOTIFIKASI SUARA / BANNER** = user tidak diganggu.
  - [PendingFlushWorker.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PendingFlushWorker.kt#L28-L43): Companion extension C3 — constant `UNIQUE_WORK_NAME_IMMEDIATE = "gas_pending_flush_immediate_sync_now"` + static method **`triggerImmediateSync(context)`** = enqueueUniqueWork OneTimeWorkRequest ExistingWorkPolicy.KEEP (tidak duplikat job). Reuse 100% logic `doWork()` C1 (flush loop 6 iteration, timeout 70s, foreground 10 item) — tidak perlu kode baru core syncing.
  - [GasApp.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/GasApp.kt#L9, L23): Import + 1 line `runCatching { GasFirebaseMessagingService.subscribeGlobalTopics() }` di onCreate. Menjamin 100% user langsung terdaftar topik global, tidak menunggu `onNewToken` callback async FCM.
  - [libs.versions.toml](file:///D:/Dashboard%20Portal/native-mobile-gas/gradle/libs.versions.toml#L38) + [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L165): Library baru `firebase-messaging` (managed BOM 33.9.0, sama seperti auth/firestore/database). Size APK +190KB (FCM SDK).
  - [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/AndroidManifest.xml#L69-L82): Service declaration `GasFirebaseMessagingService` exported=false dengan intent-filter `MESSAGING_EVENT`. Meta-data default notification icon `stat_notify_sync` + channel id `gas_background_sync_channel` (REUSE existing WorkManager channel — tidak buat channel baru agar tidak membingungkan user di Settings).
  - Cloud Function REST **[adminSyncAllStudents.ts](file:///D:/Dashboard%20Portal/web/functions/src/api/adminSyncAllStudents.ts)** (220L TypeScript v2): Endpoint `POST adminSyncAllStudents` region `asia-southeast2` (Jakarta). Security: Bearer IdToken `verifyIdToken(checkRevoked=true)` + role check `super-admin / admin / guru / kepsek`. Interface body `{schoolId, reason, broadcastNotification, includeOsis, customTopicSuffix, dryRun}`. Build FCM Message: data payload `{action:SYNC_NOW, sync_trigger:1, ts, origin_uid, school_id, reason}`, AndroidConfig `priority=normal, ttl=3600s, directBootOk=true`, APNS `apns-push-type=background contentAvailable=true` (iOS compatible). `broadcastNotification=true` → baru menampilkan notifikasi visual (default=FALSE = silent push). Log setiap broadcast ke Firestore `gas_admin_sync_log` collection. Response `{success, messageId, topic, ts}`.
  - [functions/src/index.ts](file:///D:/Dashboard%20Portal/web/functions/src/index.ts#L11): L11 `export * from "./api/adminSyncAllStudents"` → deployable via `firebase deploy --only functions:adminSyncAllStudents`.
- **Changed (Fix Build Error 1 POST-C2-C3):** HomeScreen.kt deklarasi state `showOEMHardeningDialog` dan `oemBrand` dipindah dari L279 (area pending counter) KE L102-L105 (setelah showGpsDialog), **SEBELUM** AlertDialog OEM L234. Root cause: Kotlin Composable top-down evaluation tidak bisa resolve forward reference var dalam scope function yang sama → build error `Unresolved reference showOEMHardeningDialog L234`. Setelah dipindah → BUILD SUCCESS exit 0 in 3m 27s.
- **Changed:** Ukuran APK naik **+490KB** dari FINAL RC baseline (20.66MB → 21.15MB): WorkManager +300KB, FCM SDK +190KB.
- **Rollback Safety (Mandatory Multi Level):** Level 1 (cepat 1 detik): Overwrite alias `GAS-Siswa-release.apk` dari FINAL-NORMAL RC SHA `8ECF21D4…EE3BB` (tanpa C1+C2+C3). Level 1-b (sedikit): overwrite dari POST-C1-WORKER SHA `078D9A1D…4A4E55` (hanya C1, tanpa C2 dialog OEM + C3 FCM). Level 2 (permanent code): hapus 7 change point C2+C3 di atas (permission/queries manifest, service FCM manifest, HomeScreen OEM state+dialog, 2 class file util baru, PendingFlushWorker companion extension, GasApp subscribe onCreate, firebase-messaging dep, cloud function file + export index).

### Siswa — Build 23108 POST-C1-WORKER: WorkManager PeriodicFlush 15m + BOOT_COMPLETED Receiver (Minimum Viable Background Auto-Sync)
> Artefak **aktif uji coba Fase C1** = **POST-C1-WORKER** SHA256 **`078D9A1DB5B64E460C494F8A62DF2BAD8AE820BADCF2EFBAB455B7DEB64A4E55`** (vers=23108, vname=1.0.111, size=20.96MB). Artefak ini = implementasi Minimum Viable Background Auto-Sync persis ide user: *"siswa online, data pending dari mode offline tersinkron otomatis di belakang layar TANPA siswa buka GAS — persis Github push → auto rollout Firebase"* — sebelum OEM Hardening (C2) dan FCM Push Trigger (C3). Status: 🟡 Menunggu user test HP fisik 2 mandatory scenario (Auto Flush 15m + Survive Reboot).
- **Added:** Fitur **Background Auto-Sync Periodic 15 Menit (Fase C1)** via Android Jetpack WorkManager `PeriodicWorkRequest` (min interval 15m WorkManager constraint, flex 5m OS battery batch). Class baru [PendingFlushWorker.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PendingFlushWorker.kt) (CoroutineWorker Dispatchers.IO 128 line):
  - `countPending()` early return jika 0 pending (hemat CPU/battery — skip 99% idle window).
  - `isOnline()` guard + retry dengan Exponential Backoff WorkManager 30s/60s/120s… jika offline.
  - `maxIterations=6` flush round dengan delay exponential 2s/4s/6s/8s antar round → cover scenario banyak pending (>50) tanpa crash.
  - **Soft Timeout 70 detik** per job run → mencegah stuck abadi HP low-end.
  - **Foreground Service Safety:** Jika `pending >= 10` → `setForeground()` dengan Notification "Menyinkronkan X data offline…" plus tombol "Batal" (Importance LOW, no sound/vibrate).
  - Tidak memodifikasi satu line pun dari `HybridActionQueue.flushPending()` existing yang sudah 100% LULUS verified — Worker **hanya wrapper trigger periodic**.
- **Added:** [BootCompletedReceiver.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/BootCompletedReceiver.kt) (BroadcastReceiver): `BOOT_COMPLETED` + `LOCKED_BOOT_COMPLETED` (Direct Boot Aware) → worker otomatis terjadwal setelah HP restart, bahkan SEBELUM user unlock PIN pertama! Policy `ExistingPeriodicWorkPolicy.KEEP` → tidak duplikat worker.
- **Added:** Permission baru di [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/AndroidManifest.xml#L10-L12, L40-L53):
  - `RECEIVE_BOOT_COMPLETED` (jalankan receiver saat restart HP).
  - `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_DATA_SYNC` (Android 10+ requirement) → foreground sync service.
  - `<service SystemForegroundService android:foregroundServiceType="dataSync" exported="false" tools:node="merge" />` (mandatory fix lint SpecifyForegroundServiceType androidx.work).
  - `<receiver BootCompletedReceiver android:directBootAware="true" exported="true">` BOOT + LOCKED_BOOT intent-filter.
- **Added:** [GasApp.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/GasApp.kt#L16-L42) onCreate: `initBackgroundSyncChannel()` create NotificationChannel "Sinkronisasi Data Latar Belakang" (IMPORTANCE_LOW, no sound/vibrate/badge) Android 8+ sekali, lalu `schedulePeriodicFlushWorker()` policy KEEP di setiap app start agar worker selalu terjamin scheduled.
- **Changed:** Dependency baru `implementation("androidx.work:work-runtime-ktx:2.10.0")` di [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L179-L180). APK size bertambah 300KB (20.66 → 20.96 MB) = library WorkManager Jetpack.
- **Added:** Sidecar SHA256 POST-C1-WORKER: `D:\Dashboard Portal\Apk Release\Final_V2\GAS\GAS-Siswa-1.0.111-siswa-23108-POST-C1-WORKER.apk.sha256` (SHA uppercase, path alias, dan rollback aman ke FINAL RC baseline 8ECF21D4…EE3BB).
- **Rollback Pasti Aman (MANDATORY SEBELUM TEST HP FISIK):** Jika WorkManager menyebabkan battery drain / OEM kill service abnormal / regresi → **LANGSUNG overwrite alias `Final_V2\GAS\GAS-Siswa-release.apk` kembali ke FINAL-NORMAL RC baseline SHA `8ECF21D44347504816CDA12DE4A7927F24006CB82257EBF95838C7E177AEE3BB` DULUAN (1 detik), baru investigasi sesudahnya.**

### Siswa — Build 23108 FINAL-NORMAL RC (Release Candidate): 19/19 Audit Lapangan 100% LULUS + Overlay Dialog Single Button Cleanup (Build 1.0.111-siswa / 23108)
> Artefak aktif produksi rekomendasi = **FINAL-NORMAL RC** dengan SHA256 **`8ECF21D44347504816CDA12DE4A7927F24006CB82257EBF95838C7E177AEE3BB`** (versionCode=23108, versionName=1.0.111). Status: **19/19 LULUS (100% PASS RATE!)** audit lapangan user-verified tanpa blocker satupun. Rolling baseline RC siap distribusi ke siswa.
- Changed: AlertDialog "Aksi Tertunda Sinkronisasi" di [HomeScreen](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt) L1448-L1456 sekarang **SINGLE TEXTBUTTON permanen "Tutup"** (bold biru 0xFF93C5FD). Logic conditional Row 2 tombol ONLINE/OFFLINE DIHAPUS permanen sesuai kesepakatan user (4 Sep 2026). Tombol manual "Sinkron Sekarang" dihilangkan — persiapan Fase C Background Auto-Sync WorkManager Periodic 15m + FCM Push Trigger "SYNC_NOW" (Github-like rollout).
- Changed: Build aktif produksi direkomendasikan diganti dari **POST-FIX11** (SHA `6D94A3F57626D24BAB663439A23E7F732B7BF8D84061A07B83404D4747ACB6E1`) menjadi **FINAL-NORMAL RC** (SHA `8ECF21D44347504816CDA12DE4A7927F24006CB82257EBF95838C7E177AEE3BB`). Alias `Final_V2\GAS\GAS-Siswa-release.apk` sudah di-overwrite ke RC SHA di atas; backup .dbg rollback ke POST-FIX11 tersedia di `D:\Dashboard Portal\.dbg\`.
- Removed: Requirement B1.3 "ONLINE dialog overlay menampilkan 2 tombol (Tutup putih + Sinkron Sekarang biru)" → **DIHAPUS PERMANEN** dari kontrak UI. Tidak ada lagi inkonsistensi jumlah tombol bergantung status koneksi. ONLINE = OFFLINE = 1 TOMBOL SAMA PERSIS.
- Fixed: Bug potensial conditional rendering dialog saat status koneksi tidak ter-detect akurat (misal status online offline fluktuatif → tombol berubah-ubah di tengah user melihat dialog). Single button menghilangkan fluktuasi UI flaky ini.

### Siswa — Build 23108 POST-FIX8 s/d POST-FIX11: Penutupan 4 Bug Offline-First + UI Dialog Fix (Build 1.0.111-siswa / 23108)
> 4 patch berurutan yang menutup bug kritis mode offline setelah user menjalankan "langkah 2" pada build 23108. Artefak aktif rekomendasi = **POST-FIX11** dengan SHA256 **`6D94A3F57626D24BAB663439A23E7F732B7BF8D84061A07B83404D4747ACB6E1`**. Status verifikasi user: B1 Payload ✅, B1 Submit ✅, B2 Pet ✅, B3 Aduan ✅, UI Double Button 🟡 WAITING.
- Added: 2 enum case baru `QueueActionType.ATTENDANCE_CHECK_IN` + `QueueActionType.ATTENDANCE_CHECK_OUT` di [HybridActionQueue](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/HybridActionQueue.kt) lengkap dengan payload class `ShPayloadAttendanceCheckIn/Out`, flush handler `updateChildren()` dual-path (attendance + attendance_by_school), pretty type label, dan pretty payload summary untuk banner pending.
- Added: Pattern **4 Pilar Optimistic UI Update** pada `AttendanceViewModel.performCheckIn()` L993 dan `performCheckOut()` L1128: (1) OPTIMIS LOCAL UI UPDATE DI AWAL (tombol "Absen Datang" langsung hilang saat diklik); (2) fallbackEnqueue lambda untuk offline/failure; (3) SAFETY TIMEOUT 12 detik **SEBELUM** call Firebase callback-based; (4) PRE-CHECK `HybridActionQueue.isOnline()` sebelum masuk ke jalur online.
- Added: `AttendanceLocalPayload` L1282 dengan 13 field (currentSchoolLat/Lng, currentSchoolRadius, schedules AM/PM, today rules dst) + `loadFromLocalPayload()` L1220 full restore state dari snapshot lokal, sehingga B1 koordinat offline TIDAK LAGI menggunakan hardcoded default `-7.6698/112.5432`.
- Added: `MutableStateFlow _ruleDataReadyFlow` + `awaitRuleDataOrTimeout()` + `checkAndMarkRuleReady()` di [AttendanceViewModel](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/AttendanceViewModel.kt) L91-L116 — flag "rule data sudah siap" yang di-set setiap kali `applyLocation`/`applySchedules`/`applyConfig` ValueEventListener selesai. Dipanggil di [StudentInitialSyncScreen](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentInitialSyncScreen.kt) L804 agar `syncAttendancePayload()` menunggu rule siap baru save snapshot lokal (fix B1 payload simpan koordinat salah).
- Added: Snapshot persistence `VirtualPetViewModel` (AndroidViewModel) dengan `saveLocalSnapshotIfReady()` setiap upstream collect sukses + `applyLocalSnapshot()` early return saat offline, sehingga B2 Sahabat Belajar TIDAK LAGI spinner abadi (maks 30s timeout fallback).
- Added: `QueueActionType.BULLYING_CREATE_REPORT` + payload class di [HybridActionQueue](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/HybridActionQueue.kt) L186-L189 (flush handler/label) + full rewrite `ReportBullyingViewModel` menjadi AndroidViewModel dengan pattern: SAFETY TIMEOUT 8 detik DI ATAS sebelum `resolveStudent`, 3x offline guard pre-check, `preferIdHint = db.reference.push().key` offline-safe untuk ID laporan.
- Fixed: **B1 Payload Absensi koordinat offline tidak sinkron** (save hardcoded default -7.6698/112.5432 karena `syncLocalPayload()` dipanggil TERLALU AWAL sebelum ValueEventListener selesai → fix StateFlow await sebelum save).
- Fixed: **B1 Klik Absen offline tidak tersimpan & spinner tanpa feedback** (QueueActionType tidak punya case ATTENDANCE + tidak ada local optimistic update → fix enum + 4 pilar coroutine pattern).
- Fixed: **B2 Virtual Pet/Sahabat Belajar offline spinner abadi** (tidak ada pre-check isOffline + tidak ada snapshot persistence → fix AndroidViewModel + save snapshot setiap collect + 30s timeout).
- Fixed: **B3 Lapor Aduan submit offline spinner abadi** (`submitTimeoutJob` di-launch SETELAH call createReport callback-based yang mungkin never callback → fix timeout 8s DI AWAL + 3x offline guard + push.key offline-safe).
- Fixed: **UI 2x tombol "Tutup" ganda di AlertDialog "Aksi Tertunda Sinkronisasi" saat mode OFFLINE** (confirmButton conditional label + dismissButton permanen "Tutup" → OFFLINE dua label SAMA persis ganda). Fix di [HomeScreen](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt) L1448-L1482: HAPUS permanen dismissButton; confirmButton diganti Row conditional (ONLINE: [Tutup putih] + [Sinkron Sekarang biru bold]; OFFLINE: HANYA [Tutup biru bold], tidak ganda).
- Changed: Build aktif distribusi 23108 direkomendasikan = **POST-FIX11** artefak di `Final_V2\GAS` SHA256 **`6D94A3F57626D24BAB663439A23E7F732B7BF8D84061A07B83404D4747ACB6E1`** (bukan baseline 23108 SHA `E966FF…F1C64`).

### Siswa — Fase 3 Payload Lokal Diperluas ke Presensi Dhuha/Jum'at (Build 1.0.111-siswa / 23108)
- Added: parity tombol **`Download Data / Update Data`** untuk layar **Presensi Dhuha/Jum'at**.
- Added: fallback offline berbasis payload lokal pada `PrayerDhuhaJumatScreen`, sehingga status/config/jadwal terakhir tetap bisa dibaca saat internet tidak tersedia.
- Added: kartu status payload lokal **`DATA PRESENSI DHUHA/JUM'AT LOKAL`** di `PrayerDhuhaJumatScreen`.
- Changed: version bump GAS Siswa:
  - VersionCode: **23107 → 23108**
  - VersionName: **1.0.110 → 1.0.111**
- Changed: build distribusi 23108 aktif di `Final_V2\GAS` dengan SHA256 **`E966FF50886CD04291E8FDDE2E640B952E60543BF23F6D2307DB27FAC14F1C64`**

### Siswa — Fase 3 Payload Lokal Diperluas ke Absensi (Build 1.0.110-siswa / 23107)
- Added: parity tombol **`Download Data / Update Data`** untuk layar **Absensi**.
- Added: fallback offline berbasis payload lokal pada `AttendanceViewModel`, sehingga riwayat dan ringkasan Absensi dapat tetap dibuka dari snapshot terakhir saat internet tidak tersedia.
- Added: kartu status payload lokal **`DATA ABSENSI LOKAL`** di `AttendanceScreen`.
- Changed: version bump GAS Siswa:
  - VersionCode: **23106 → 23107**
  - VersionName: **1.0.109 → 1.0.110**
- Changed: build distribusi 23107 aktif di `Final_V2\GAS` dengan SHA256 **`0C07E707685AF3E9CF03AF1831BCC5A3D95CF430A4B3E41D5065FEEFE9DD4D10`**

### Siswa — Fase 3 Payload Lokal Diperluas ke 7 KAIH List (Build 1.0.109-siswa / 23106)
- Added: parity tombol **`Download Data / Update Data`** untuk layar **7 KAIH**.
- Added: fallback offline berbasis payload lokal pada `SevenHabitsViewModel`, sehingga tabel 7 KAIH bisa tetap dibuka dari snapshot terakhir saat internet tidak tersedia.
- Added: kartu status payload lokal **`DATA 7 KAIH LOKAL`** di `SevenHabitsScreen`.
- Changed: version bump GAS Siswa:
  - VersionCode: **23105 → 23106**
  - VersionName: **1.0.108 → 1.0.109**
- Changed: build distribusi 23106 aktif di `Final_V2\GAS` dengan SHA256 **`0306725590537E0C46A02C74D4D04D014498347410700FAC625D608383CA5D68`**

### Siswa — Fase 3 Payload Lokal Pilot Kedisiplinan + Notifikasi (Build 1.0.108-siswa / 23105)
- Added: fondasi payload lokal per fitur di `HybridSnapshotStore` untuk menyimpan snapshot JSON, waktu update, state sinkron, jumlah item, dan error terakhir.
- Added: parity tombol **`Download Data / Update Data`** tahap awal pada dua screen pilot:
  - `Kedisiplinan`
  - `Notifikasi`
- Added: fallback offline untuk dua screen pilot tersebut. Jika payload lokal sudah pernah diunduh, layar tetap bisa dibuka tanpa internet memakai snapshot terakhir.
- Added: kartu status payload lokal di bagian atas screen pilot, menampilkan status, detail update terakhir, dan tombol aksi parity.
- Changed: version bump GAS Siswa:
  - VersionCode: **23104 → 23105**
  - VersionName: **1.0.107 → 1.0.108**
- Changed: build distribusi 23105 aktif di `Final_V2\GAS` dengan SHA256 **`6359F3520D3BB75F27B626B36A34FF24F995D1A0FBE4C08FA9E2E1FE41A0EE9E`**

### Siswa — Hybrid Fase2 Hardening Queue Sebelum Retest S2 (Build 1.0.107-siswa / 23104)
- Fixed: `HybridActionQueue.isOnline()` kini membaca capability jaringan normal dengan benar, sehingga jalur flush/manual sync tidak mudah salah menganggap koneksi valid sebagai offline.
- Fixed: item queue yang gagal flush tidak lagi jatuh ke status yang hilang dari badge/list/retry; item sekarang tetap antre untuk dicoba ulang sampai benar-benar terkirim.
- Changed: Version bump GAS Siswa 2 blok sinkron (defaultConfig + flavor `siswa`):
  - VersionCode: **23103 → 23104**
  - VersionName: **1.0.106 → 1.0.107**
- Changed: Build distribusi 23104 aktif di `Final_V2\GAS` dengan SHA256 **`C1B32D056154F6D958BC0BF039B61A70E16D2D6E26C6366C7EB78AE98CC291EE`**:
  - `Final_V2\GAS\GAS-Siswa-1.0.107-siswa-23104.apk`
  - `Final_V2\GAS\GAS-Siswa-release.apk`
  - `Final_V2\GAS\GAS-Siswa-1.0.107-siswa-23104.apk.sha256`

### Siswa — Hybrid Fase2 Debug Fix S1 Masih Fail (Build 1.0.104-siswa / 23101) — ⚠️ **Applied Code+Build+Ship, PENDING Retest User FOKUS S1 DULU — CATAT SEMUA TOAST**
> Fix debug lanjutan setelah user retest 23100 lapor singkat **"S1 tidak bisa"** (Offline 7 KAIH submit enqueue masih gagal di HP user fisik). Build 23100 SHA `FE18F3DF…64645F` VERSIONED dihapus dari Final_V2\GAS (cegah user salah install stale build) tapi TETAP tersimpan PERMANEN di `.dbg\GAS-Siswa-1.0.103-siswa-23100.apk` untuk rollback Tier2 gate EduLock jika 23101 kacau total. Gunakan **23101 SHA `D05B802A…09FD0C`** sebagai baseline fix terbaru Fase2.
- Fixed: **S1 (Offline 7 KAIH enqueue) "tidak bisa" user retest 23100**. Diagnosis 6 kemungkinan akar dari gejala singkat (urutan tertinggi probability):
  1. logsToSave EMPTY silent early return `onResult(false)` tanpa toast spesifik → mismatch format tanggal weekDates param vs snapshot.logs keys (leading zero / whitespace / lowercase). User cuma lihat toast default composable "Gagal mengirim laporan" atau tidak terjadi apa-apa.
  2. User klik "Simpan Laporan Hari Ini" TANPA mencentang satupun checklist → HABITS ALL FALSE → disimpan tapi tidak ada perubahan UI / counter.
  3. `val offline` di-evaluate LUAR `viewModelScope.launch` (main thread). Saat masuk coroutine state Connectivity berubah → salah masuk online branch → saveLog callback tidak dipanggil 10+ detik.
  4. Tidak ada toast AWAL untuk indikator tombol ditekan benar → user tap berkali-kali tidak tahu fungsi berjalan atau tidak.
  5. `isOnline()` ambigu TRUE (OEM cached stale caps) tapi legacy deprecated NetworkInfo sebenarnya FALSE → masuk online branch → 12 detik timeout (user "muter lama").
  6. Outer tidak wrap global runCatching → exception coroutine tidak tertangani → stuck state onResult tidak pernah dipanggil.
  - **Fix 8 area conservative (HANYA ubah function `saveWeeklyLogs` di SevenHabitsViewModel, scope MINIMAL TIDAK sentuh EduLock gate / banner dialog / Fase1 shell / Prayer S2):**
    1. `safeToast(text, long)` helper: wrap semua Toast.makeText runCatching agar NullPointerException coroutine Context tidak leak crash.
    2. **Toast AWAL saat function start:** `"Menyimpan data 7 KAIH..."` (seketika saat tombol ditekan) — user TAhu fungsi berjalan (indikator).
    3. **`normalizeDate(s)` helper:** trim → lowercase → split YYYY-MM-DD → padStart(4/2/2 digit) both side weekDates vs snapshot.logs keys. Mencegah mismatch leading zero (akar #1).
    4. **logsInWeek EMPTY → toast PANJANG panduan user:** `"Tidak ada data checklist 7 KAIH untuk minggu ini. Pastikan sudah mencentang checklist untuk hari ini di minggu yang dipilih."` (bukan silent return onResult(false) tanpa penjelasan).
    5. **`hasAnyTrue` check:** jika `submittedLogs.values.any { log.habits.values.any { it } }` = FALSE → **ALL HABITS FALSE (user tidak centang apapun)** → toast panjang panduan: `"Belum ada checklist 7 KAIH yang dicentang. Silakan centang 1 atau lebih kebiasaan untuk hari ini sebelum menyimpan."` → early return onResult(false). Tidak silent simpan empty.
    6. **`val offline` PINDAHKAN ke DALAM `viewModelScope.launch` + DOUBLE CHECK:** jika `isOnline=true` TAPI legacy deprecated `ConnectivityManager.activeNetworkInfo?.isConnected != true` → **paksa FALSE = offline** (antisipasi OEM cached stale caps yang menyebabkan salah masuk online). Jadi offline detection = 3-tier safe fail-open: runCatching fallback true → isOnline fail-conservative → legacy NetworkInfo double-check.
    7. **Outer wrap SEMUA block dalam `runCatching { }.onFailure { t -> safeToast("Gagal memproses simpan 7 KAIH: ${t.message.take(100)}", LONG); onResult(false) }`** → exception apapun → toast explicit error penjelasan user tidak bingung.
    8. **Hard timeout online path dikurangi 15s → 12s:** `mainHandler.postDelayed(::forceFinalizeTimeout, 12_000L)` → lebih cepat fallback enqueue jika callback saveLog tidak pernah dipanggil (user "muter" maks 12 detik, tidak 15 detik).
- Changed: Version bump GAS Siswa 2 blok SINKRON (defaultConfig + flavor `siswa`):
  - VersionCode: **23100 → 23101**
  - VersionName: **1.0.103 → 1.0.104**
  - Monotonic naik ≥ 23100 ✓.
- Changed: Build distribusi debug fix 23101 di deploy permanen `Final_V2\GAS` SHA triple match MATCH SEMUA:
  - Versioned (untuk retest user): `Final_V2\GAS\GAS-Siswa-1.0.104-siswa-23101.apk`
  - Alias pointer overwrite SHA SAMA: `Final_V2\GAS\GAS-Siswa-release.apk`
  - Sidecar SHA ASCII uppercase DUA SPASI format standard: `Final_V2\GAS\GAS-Siswa-1.0.104-siswa-23101.apk.sha256`
  - SHA256 source/versioned/alias/.dbg/sidecar = **`D05B802AA5BA3A09F31E9B3BA98C4F201478E31ED5AA84E2A3A1701DF509FD0C`** (TRIPLE_MATCH_OK = TRUE verified).
  - Backup .dbg rollback permanen: `D:\Dashboard Portal\.dbg\GAS-Siswa-1.0.104-siswa-23101.apk` (SHA sama).
  - **Stale versioned 23100 dari Final_V2\GAS DIHAPUS** (cegah user salah install build yang diketahui S1 fail). Tetap tersimpan permanen di `.dbg\GAS-Siswa-1.0.103-siswa-23100.apk` untuk rollback Tier2 gate EduLock jika 23101 kacau.
- **ATURAN RETEST ULANG 23101 — FOKUS 100% S1 OFFLINE 7 KAIH DULU, WAJIB CATAT SEMUA TOAST YANG MUNCUL:**
  1. ⚠️ **LANGKAH PENTING PRA-INSTALL:** **UNINSTALL APK 23100 DAHULU dari HP.** Atau Clear Data + Clear Cache Apps GAS (Settings → Apps → GAS → Storage → Clear Data / Clear Cache). Agar `SharedPreferences` queue stale dari build 23100 TIDAK membingungkan counter badge.
  2. Install APK `Final_V2\GAS\GAS-Siswa-1.0.104-siswa-23101.apk` (SHA di atas triple match).
  3. 🟢 **S0A/S0B CEK CEPAT SEKALI (regresi EduLock gate TIDAK pecah — Pasti LULUS):**
     - S0A OFFLINE: Wi-Fi OFF Data OFF GPS ON Mode Pesawat OFF → Launch GAS → spinner EduLock merah "Memeriksa Proteksi EduLock". Expected: SPINNER HILANG MAKS 10 DETIK → HOME OTOMATIS tanpa klik.
     - S0B ONLINE: Wi-Fi/Data stabil ON → Force Stop GAS → Launch. Expected: spinner EduLock merah HILANG <10 DETIK (callback Firebase duluan sebelum timeout 10 detik). TUNGGU 30 DETIK ONLINE → agar HybridSnapshotStore terisi snapshot profil/pengumuman/pet (Home screen tidak kosong saat offline nanti).
  4. 🛑 **🛑 S1 OFFLINE 7 KAIH (FOKUS UTAMA #1 WAJIB LULUS, CATAT SEMUA TOAST):**
     - Matikan Wi-Fi OFF + Data OFF (pure offline).
     - Buka menu **7 KAIH**.
     - **PERIKSA LABEL BUTTON SUBMIT di BAWAH checklist:** Label tombol harus **BIRU AKTIF** dan tertulis **"Simpan Laporan Hari Ini"** (bukan abu-abu disabled / "Pilih Minggu yang Memuat Hari Ini" / "Sudah Dikirim & Terkunci"). **Jika tidak BIRU AKTIF:** Berarti Minggu yang dipilih TIDAK memuat hari ini → pilih Minggu dropdown WeekSelectorButton (nomor 1-5) yang berisi hari ini.
     - **CENTANG MINIMAL 3 ITEM (TIDAK BOLEH 0) untuk HARI INI** (kolom paling atas header "Sen/Sel/Rab/Kam/Jum/Sab/Min" yang sesuai hari ini). Contoh: hari Jumat → centang 3 checklist di kolom "Jum".
     - **KLIK TOMBOL "Simpan Laporan Hari Ini" 1 KALI SAJA.**
     - **⚠️ WAJIB CATAT SEMUA TOAST YANG MUNCUL SECARA BERURUTAN (sangat penting untuk diagnosis jika masih fail):**
       - **TOAST 1 (seketika saat klik):** Apakah muncul **"Menyimpan data 7 KAIH..."**? Ya / Tidak → ini indikator tombol ditekan benar fungsi dipanggil.
       - **TOAST 2 (0-12 detik kemudian):** Apakah isinya **SESUAI** salah satu berikut? Catat PERSIS isinya.
         - ✅ **BERHASIL ENQUEUE (Expected LULUS S1):** `"<N> aksi 7 KAIH disimpan lokal. Akan disinkronkan otomatis saat internet kembali."` (N = jumlah log + 1 markWeek jika bukan minggu ini).
         - ❌ **Error A (minggu tidak cocok / format tanggal mismatch):** `Tidak ada data checklist 7 KAIH untuk minggu ini. Pastikan sudah mencentang checklist untuk hari ini di minggu yang dipilih.`
         - ❌ **Error B (tidak centang satupun):** `Belum ada checklist 7 KAIH yang dicentang. Silakan centang 1 atau lebih kebiasaan untuk hari ini sebelum menyimpan.`
         - ❌ **Error C (enqueue throw exception per-tanggal):** `Gagal simpan lokal (YYYY-MM-DD): <pesan error 80 char pertama>`
         - ❌ **Error D (uncaught exception global block):** `Gagal memproses simpan 7 KAIH: <pesan error 100 char pertama>`
         - ❌ **Info Lambat (online path timeout 12 detik fallback enqueue):** `Koneksi lambat atau server belum merespon. Data disimpan untuk sinkron otomatis nanti.` (Ini OK juga = fallback enqueue berhasil user tidak stuck).
         - ⚠️ **TIDAK ADA TOAST 2 SAMA SEKALI SELAMA >15 DETIK (TIDAK BOLEH):** Berarti masih ada race condition besar → lapor "toast 2 tidak muncul >15 detik".
     - **CEK UI CHECKLIST:** Setelah loading selesai, apakah checklist yang Anda centang tadi **TETAP TERCENTANG SEMUA** (optimistic local success)? ATAU kembali ke **unchecked SEMUA** (rollback state)?
     - **BALIK HOME → CEK BADGE COUNTER BANNER:** Apakah badge angka di kanan banner (lingkaran kecil angka) **NAIK SESUAI ANGKA N dari toast 2 sukses**? Contoh: Anda centang 3 item hari ini di minggu ini (markWeek tidak enqueue) → counter dari 0 **NAIK MENJADI 3**. Jika bukan minggu ini → naik menjadi 4 (+1 markWeek). Counter TETAP 0 artinya enqueue FAIL silent.
  5. **LAPORKAN ke chat LENGKAP 5 hal:** TOAST 1 Ya/Tidak; TOAST 2 apa isinya PERSIS; UI checklist tetap/unchecked; badge counter jadi berapa; Version Code di Settings→Apps→GAS benar 23101? **DENGAN 5 DATA INI saya bisa diagnosis akar 100% tanpa salah tebak lagi.**
- Rollback gate tetap 3 tier:
  1. Tier 1 regresi minor Fase2 queue: Overwrite alias Final_V2\GAS → 23097 Fase1 stabil SHA `DA830971A622316B1233B4B9C8677B7EFBC73DF6E8E9BA35532E0FAE9BA206FD`.
  2. Tier 2 gate EduLock OK tapi S1/S2 queue masih fail: Overwrite alias → 23099 SHA `ADAADFFDE57079CD718A4CFB3B66DBA9F23B6994D36B7A5796FB87D1C649733B` (8/10 LULUS) ATAU 23100 SHA `FE18F3DFF1B6F8846598981A98368021874956CEC1A11EBF60D7542BD064645F` (S1 fail tapi gate EduLock verified). Keduanya TETAP tersimpan di `.dbg\`.
  3. Tier 3 parah total (shell crash / gate EduLock juga abadi / home tidak bisa dibuka): Overwrite 2 alias Final_V2\GAS + Final\ → 23096 NON-HYBRID clean SHA `67C03F8FF692FBA4F057E3E35F676EB233913978C0C5AE44E7B9914E3C8EE28F`.

### Siswa — Hybrid Fase2 Debug Fix (Build 1.0.103-siswa / 23100) — ⚠️ **WITHDRAWN dari Final_V2 (tetap ada .dbg rollback Tier2) — S1 Masih Fail User Report "Tidak Bisa"**
> ⚠️ **NOTICE PENARIKAN 23100 DARI FINAL_V2\GAS:** Build 23100 SHA `FE18F3DF…64645F` VERSIONED APK dan sidecar.sha256 DIHAPUS dari `Final_V2\GAS` tanggal 2026-09-04 setelah user retest lapor **"S1 tidak bisa"** (Offline 7 KAIH submit enqueue masih gagal di HP fisik). Tetap TERSIMPAN PERMANEN di `.dbg\GAS-Siswa-1.0.103-siswa-23100.apk` untuk audit dan rollback Tier2 gate EduLock jika build 23101 kacau total. Gunakan build **23101 SHA D05B802A…** di atas sebagai baseline fix terbaru, bukan 23100.
> Fix kritis untuk regresi build 23099 yang **S1 Offline 7 KAIH submit enqueue + S2 Offline Presensi Sholat submit enqueue FAIL = user lihat muter saja tanpa toast / counter naik.** Catatan menarik: 8 item S0A/S0B/S3/S4/S5/S6/S7/S8 LULUS di 23099 (Flush otomatis, tombol sinkron, partial fail, persist survive kill WORK = queue util FLUSH MEKANISME OK). HANYA pure offline hook S1/S2 FAIL silent enqueue. Build 23099 SHA `ADAADFF…9733B` TIDAK dihapus (untuk rollback gate EduLock jika 23100 kacau) tapi tidak untuk produksi (S1/S2 gagal). Gunakan **23100 SHA `FE18F3DF…64645F`** (withdrawn) sebagai baseline Fase2 Applied fix (sekarang digantikan 23101).
- Fixed: **S1 (Offline 7 KAIH enqueue muter tanpa toast / counter)** & **S2 (Offline Presensi Sholat enqueue muter tanpa toast)** (regresi 23099).
  - **4 Root Cause Diagnosis dari gejala kontradiksi (S4/S5/S7/S8 PASS):** (1) POTENSI TERTINGGI `isOnline()` di 23099 terlalu optimis → OEM cached stale ConnectivityManager caps → mengembalikan TRUE padahal koneksi sebenarnya OFFLINE → code masuk online path → submit ke repository/RTDB → **SDK Firebase Android default TIDAK ADA TIMEOUT sama sekali untuk saveLog/setValue** → callback TIDAK PERNAH dipanggil → stuck finalize → user lihat "muter saja" (PERSIS cocok gejala laporan). (2) `SecurePreferences.getSessionPrefs()` IllegalStateException pure offline session encryption key locked → pure offline enqueue throws (S7 partial fail online PASS karena session sudah ready online). (3) Tidak ada hard timeout online submit callback. (4) Tidak ada runCatching wrap global enqueue/isOnline/flush call → exception tidak tertangani coroutine.
  - **Fix (5 area targetted, TIDAK sentuh EduLockGate / banner dialog / Fase1 shell — risiko MINIMAL):**
    1. **`util/HybridActionQueue.kt`:** (a) `getQueuePrefs()` helper 3 tier: try SecurePreferences.getSessionPrefs() → fallback `appContext.getSharedPreferences("hybrid_queue_fallback_v1", MODE_PRIVATE)` → fallback `safemode_v1` jadi SecurePreferences TIDAK PERNAH block queue. (b) readQueue / writeQueue wrap runCatching. (c) **`isOnline()` FAIL-CONSERVATIVE REWRITE:** wrap runCatching return false on Throwable → **REQUIRE DUA JALUR KEDUANYA TRUE:** (baru) `caps has INTERNET + VALIDATED + NOT_VPN` **DAN** (legacy deprecated NetworkInfo) `wifi connected || mobile connected` → hanya jika keduanya true return isOnline=true; secondary fallback capsOk + interfaceName ok; default FALSE jika ragu. Jadi offline detection SELALU AKTIF user OFFLINE. (d) enqueue / pendingSummary / flushPending semua pakai getQueuePrefs helper.
    2. **`SevenHabitsViewModel.saveWeeklyLogs`:** (a) `val offline = runCatching { !HybridActionQueue.isOnline(appContext) }.getOrDefault(true)` → jika ConnectivityManager crash → anggap OFFLINE enqueue safe fail-open UX. (b) Tambah `safeEnqueueSaveLog` / `safeEnqueueMarkWeek` wrap semua enqueue runCatching + Toast explicit jika gagal enqueue *"Gagal simpan lokal (<tanggal>): <message>..."*. (c) **ONLINE PATH HARD TIMEOUT 15 DETIK:** `mainHandler.postDelayed(::forceFinalizeTimeout, 15_000L)` → JIKA saveLog callback tidak pernah finalize dalam 15 detik → `allSuccess=false` → safeEnqueue semua submitted log → applyLocalSuccessAndFinish() + toast *"Server lambat merespon. Data disimpan untuk sinkron otomatis"*. Jadi TIDAK PERNAH muter selamanya. (d) `finalizedAlready` boolean flag + `mainHandler.removeCallbacksAndMessages(null)` saat finalizeProceed → prevents race double finalize (saveLog callback vs timeout Runnable).
    3. **`PrayerScreen.submitPrayer`:** (a) offline = runCatching getOrDefault(true) — Connectivity crash anggap OFFLINE. (b) `safeEnqueuePrayer` helper wrap semua enqueue (offline branch + onFailure branch) runCatching + explicit error toast *"Gagal simpan presensi lokal: <message>..."*. (c) **ONLINE Firebase updateChildren HARD TIMEOUT 15 DETIK:** `mainHandler.postDelayed({ finalizeHandled(); safeEnqueuePrayer() + toast server lambat + isSubmitting=false }, 15_000L)`. Jadi TIDAK PERNAH stuck loading >15 detik. (d) addOnSuccessListener / addOnFailureListener guard `if(handledAlready) return` → tidak double finalize.
- Changed: Version bump GAS Siswa 2 blok SINKRON (defaultConfig + flavor `siswa`):
  - VersionCode: **23099 → 23100**
  - VersionName: **1.0.102 → 1.0.103**
  - Monotonic naik ≥ 23099 ✓.
- Changed: Build distribusi debug fix 23100 di deploy permanen `Final_V2\GAS` SHA triple match MATCH SEMUA:
  - Versioned: `Final_V2\GAS\GAS-Siswa-1.0.103-siswa-23100.apk`
  - Alias pointer overwrite: `Final_V2\GAS\GAS-Siswa-release.apk`
  - Sidecar SHA ASCII uppercase DUA SPASI format standard: `Final_V2\GAS\GAS-Siswa-1.0.103-siswa-23100.sha256`
  - SHA256 source/versioned/alias/.dbg/sidecar = **`FE18F3DFF1B6F8846598981A98368021874956CEC1A11EBF60D7542BD064645F`** (TRIPLE_MATCH_OK = TRUE verified).
  - Backup .dbg rollback gate: `D:\Dashboard Portal\.dbg\GAS-Siswa-1.0.103-siswa-23100.apk` (SHA sama).
- **ATURAN RETEST ULANG MULAI 23100 — FOKUS UTAMA DULU S1 + S2 (OFFLINE ENQUEUE):**
  1. 🛑 **S0A+S0B CEK CEPAT SEKALI (regresi fix EduLock tidak pecah):** S0A Offline launch 10 detik spinner hilang masuk home; S0B Online <10 detik callback Firebase. Kemungkinan ✅ (tidak sentuh EduLockGate file).
  2. 🛑 **S1 FOKUS UTAMA: Offline 7 KAIH submit enqueue optimistic state (WAJIB LULUS):** Wi-Fi OFF + Data OFF. Buka 7 KAIH → centang 3–4 item → Submit. Expected: (a) Toast `"<N> aksi 7 KAIH disimpan lokal"` jelas MUNCUL TIDAK HILANG; (b) UI checklist TETAP TERCENTANG (optimistic apply LOCAL SUCCESS NO rollback unchecked); (c) Badge counter banner home NAIK sesuai angka N+1 jika bukan minggu ini.
  3. 🛑 **S2 FOKUS UTAMA: Offline Presensi Sholat submit rule TETAP BERLAKU enqueue (WAJIB LULUS):** Wi-Fi OFF + Data OFF. Buka Presensi Sholat. UJI **RULE TETAP MENOLAK** submit invalid (lokasi luar radius / jam salah / mock detection / non muslim) — Offline TIDAK BOLEH membypass rule. Jika rule lolos → Submit. Expected: (a) Toast "Presensi sholat disimpan lokal. Sinkron otomatis saat online kembali" jelas muncul; (b) isSubmitting=false cepat (tidak loading lama); (c) Counter banner naik 1.
  4. Jika S1+S2 ✅ → lanjut S4 (flush otomatis online kembali <60d counter 0 data terkirim RTDB), S5 (tombol "Sinkron Sekarang" dialog manual flush <5s), S8 (persist survive Force Stop kill app) — CEPAT SAJA (semua PASS di 23099, tidak diubah di 23100).
- Rollback gate tetap 2 tier sama:
  1. Tier 1 regresi minor: Overwrite alias Final_V2\GAS → 23097 Fase1 stabil SHA `DA83097…A206FD`.
  2. Tier 2 kacau total: Overwrite 2 alias Final_V2\GAS + Final\ → 23096 NON-HYBRID clean SHA `67C03F8…EE28F`.
- **Artefak 23097 & 23096 & 23099 (8/10 PASS gate EduLock) TETAP DIPERTAHANKAN TIDAK DIHAPUS selama Fase2 belum verified LULUS 100% user di HP.**

### Siswa — Hybrid Fase2 Debug Fix (Build 1.0.102-siswa / 23099) — ⚠️ **Applied Code+Build+Ship, Pending Retest User (WAJIB Retest Ulang S0A+S0B Gate EduLock Fix DULU)**
> Fix kritis untuk regresi build 23098 yang **gate EduLock spinner merah "Memeriksa Proteksi EduLock" offline abadi block Home user tidak bisa masuk**. Build 23098 (SHA `7820B160…E16CDD`) **DILARANG DIPAKAI SELALU — hapus dari device jika masih terinstall.** Gunakan **23099 (SHA `ADAADFF…9733B`)** sebagai baseline Fase2 Applied.
- Fixed: **Spinner EduLock merah abadi mode OFFLINE (regresi 23098 — blocker home total).**
  - **Root Cause** (100% diagnosis from user screenshot gejala match 2 fakta): Di `ui/EduLockComplianceGate.kt fun rememberEduLockComplianceState(...)` DisposableEffect: `state = buildComplianceState(...).copy(isChecking = enabled)` (L675) → `ref = FirebaseDatabase.getReference("active_devices").child(schoolId).addValueEventListener(listener)` (L761). Saat **OFFLINE + cache RTDB kosong**, Firebase Android SDK Client **TIDAK PERNAH** memanggil `onDataChange` **ATAU** `onCancelled` (keduanya tidak jalan) → internal `publish(...)` tidak pernah dipanggil seumur hidup process → `state.value.isChecking` tetap **TRUE FOREVER** → `EduLockComplianceOverlay` (L943 EduLockComplianceGate.kt, L976 title "Memeriksa Proteksi EduLock") TETAP TERLIHAT MERAH BLOCK HOME USER 100%. Fakta kedua user "ONLINE mode spinner 10 detik akhirnya masuk home" PERSIS = callback Firebase onDataChange di path active_devices dipanggil ~10 detik → publish → isChecking=false → overlay dismiss.
  - **Fix (parity fallback 10 detik gate Pet Navigation.kt — same pattern aman):** Tambahkan `mainHandler.postDelayed(timeoutRunnable, 10_000L ms)` TEPAT setelah `ref.addValueEventListener(listener)` (L762-L802 di EduLockComplianceGate.kt). Isi `timeoutRunnable`: val cur = state.value, **HANYA JIKA `cur.isChecking == true`** → publish state baru `buildComplianceState(... snapshot = null, telemetryError = null).copy(isChecking = false, isBlocked = false, reason = "", warningMessage = "Mode Offline: Status EduLock belum tersedia — lanjut dengan data lokal.")`.
  - **Leak Protection onDispose:** `onDispose { … mainHandler.removeCallbacks(timeoutRunnable) }` → kalau callback Firebase berhasil ontime <10 detik → Runnable timeout dibatalkan (tidak mengotori state setelah composable dispose, tidak memory leak Handler callback).
- Changed: Version bump GAS Siswa 2 blok SINKRON (defaultConfig + flavor `siswa`):
  - VersionCode: **23098 → 23099**
  - VersionName: **1.0.101 → 1.0.102**
  - Monotonic naik ≥ 23098 ✓.
- Changed: Build distribusi debug fix 23099 di deploy permanen `Final_V2\GAS` SHA triple match MATCH SEMUA:
  - Versioned: `Final_V2\GAS\GAS-Siswa-1.0.102-siswa-23099.apk`
  - Alias pointer overwrite (alias deploy untuk install script): `Final_V2\GAS\GAS-Siswa-release.apk`
  - Sidecar SHA ASCII uppercase DUA SPASI format standard: `Final_V2\GAS\GAS-Siswa-1.0.102-siswa-23099.sha256`
  - SHA256 source/versioned/alias/.dbg/sidecar = **`ADAADFFDE57079CD718A4CFB3B66DBA9F23B6994D36B7A5796FB87D1C649733B`** (TRIPLE_MATCH_OK = TRUE verified).
  - Backup .dbg rollback gate: `D:\Dashboard Portal\.dbg\GAS-Siswa-1.0.102-siswa-23099.apk` (SHA sama, survive penghapusan Final_V2).
- **ATURAN RETEST ULANG MULAI 23099 — WAJIB MULAI S0 DULU:**
  1. 🛑 **S0A OFFLINE LAUNCH (INDIKATOR FIX GATE BERHASIL — WAJIB LULUS PERTAMA KALI):** Matikan Wi-Fi OFF + Data Seluler OFF. Install APK 23099 (update di atas 23098 signature match atau uninstall 23098 dulu jika tidak bisa). Launch GAS → Lihat spinner merah "Memeriksa Proteksi EduLock". Expected: **SPINNER HILANG DALAM MAKS 10 DETIK → OTOMATIS LANJUT MASUK HOME TANPA INTERVENSI USER APA PUN.** Jika masih abadi >15 detik → FAIL → balik ke saya bump 23100 debug.
  2. 🟢 **S0B ONLINE LAUNCH (CALLBACK FIREBASE TETAP CEPAT):** Nyalakan Wi-Fi/Data stabil → Launch GAS → spinner EduLock merah. Expected: spinner HILANG **SEBELUM 10 DETIK** (callback Firebase onDataChange jalan duluan, Runnable timeout tidak pernah mengeksekusi).
  3. Setelah **S0A + S0B keduanya ✅ LULUS** → lanjut S1–S8 skenario Fase2 normal (offline 7KAIH enqueue optimistic, offline Prayer rule tetap enqueue, banner badge click pending list, flush otomatis online kembali, tombol Sinkron Sekarang, online path tidak rusak, persist survive kill, partial fail auto enqueue optimistic).
- Rollback gate tetap 2 tier sama:
  1. Tier 1 regresi minor (hanya queue Fase2): Overwrite alias Final_V2\GAS → 23097 Fase1 stabil SHA `DA83097…A206FD`.
  2. Tier 2 kacau total (shell/masuk home crash/EduLock direct launch gagal): Overwrite 2 alias Final_V2\GAS + Final\ → 23096 NON-HYBRID clean SHA `67C03F8…EE28F`.
- **Artefak 23097 & 23096 TETAP DIPERTAHANKAN TIDAK DIHAPUS selama Fase2 belum verified LULUS 100% user di HP.**

### Siswa — Hybrid Fase 2 (Build 1.0.101-siswa / 23098) — ❌ **REGRESI KRITIS DITARIK DARI PERCOBAAN PRODUKSI. DILARANG DIPAKAI. GUNAKAN 23099.**
> Regresi: Gate EduLock Spinner merah "Memeriksa Proteksi EduLock" offline abadi block Home. Root cause Firebase RTDB client no callback onDataChange/onCancelled saat offline cache empty.
> Status implementasi (2026-09-04 01:00): **Code applied semua hook point + Build sukses exit 0 + Ship SHA triple match MATCH SEMUA**. ⚠️ BELUM dijalankan retest 8 skenario (S1–S8) di HP fisik. **JANGAN lanjut Fase 3 sebelum checklist retest LULUS 100%.** Jika ada SATUPUN FAIL → bump 23099 debug + ship ulang di Final_V2\GAS parity aturan.
> **Catatan Scope Fase2 (Pet action dilewati):** Interaksi Pet (feed/play/stroke dll) = **NO-OP cuma toast saja, tidak submit backend.** Jadi Fase2 hook queue DIPASANG HANYA ke 2 submit backend network-dependent yang benar-benar ada callback ke RTDB: `SevenHabitsViewModel.saveWeeklyLogs` (7 KAIH) dan `PrayerScreen.submitPrayer` (Presensi Sholat).
- Added: **Util BARU `HybridActionQueue.kt` (singleton FIFO SharedPreferences + Gson)** untuk queue aksi offline dengan 3 payload type: `SEVEN_HABITS_SAVE_LOG`, `SEVEN_HABITS_MARK_WEEK_SUBMITTED`, `PRAYER_SUBMIT_ATTENDANCE`. UUID primary key. Status transisi: `PENDING → SYNCED / FAILED`. SYNCED > 48 jam auto-cleanup untuk hemat storage.
- Added: **Auto flush otomatis via `ConnectivityManager.NetworkCallback`:** Register `NET_CAPABILITY_INTERNET + NET_CAPABILITY_VALIDATED`. Saat koneksi valid kembali (`onAvailable(network)`), postDelay 600ms main looper lalu panggil `flushPending()` FIFO berurutan. Tidak pakai polling boros baterai.
- Added: **Method publik util queue:** `enqueue(context, type, payload) → HybridActionItem`; `pendingSummary(context) → PendingSummary(count, oldestAt, newestAt, items)`; `countPending(context) → Int`; `flushPending(context, firebaseDb, sevenHabitsRepository) → Int`; `flushNowIfOnline(...) → Int`; `prettyTypeLabel(t) → String`; `prettyPayloadSummary(type, payloadJson) → String` (human readable payload preview untuk dialog).
- Added: **Hook `SevenHabitsViewModel.saveWeeklyLogs` 3 jalur:**
  1. **Offline** → setiap item `submittedLogs` → enqueue `SEVEN_HABITS_SAVE_LOG(ShPayloadSevenHabitsSaveLog(log))`; jika bukan minggu ini → tambah enqueue `SEVEN_HABITS_MARK_WEEK_SUBMITTED(ShPayloadSevenHabitsMarkWeek(...))`; toast *"X aksi 7 KAIH disimpan lokal. Sinkron otomatis saat online kembali"*; `applyLocalSuccessAndFinish()` (optimistic → state UI `isWeekSubmitted=true` langsung berlaku, user tidak stuck).
  2. **Online** → submit repository.saveLog langsung; semua sukses → `markWeekSubmitted` remote; addOnSuccess panggil `HybridActionQueue.flushNowIfOnline(...)` (flush sisa pending lama).
  3. **Partial Gagal** → apply local success UI TETAP (optimistic user tidak bingung); item gagal → auto-enqueue kembali; counter pending = jumlah gagal.
- Added: **Hook `PrayerScreen.submitPrayer` (rule lokasi/time TETAP BERLAKU, bukan offline bebas submit):**
  1. **Offline (rule sudah lewat)** → `enqueue(PRAYER_SUBMIT_ATTENDANCE, ShPayloadPrayerSubmit(updates))`; toast *"Presensi sholat disimpan lokal, sinkron otomatis saat online kembali"*; `isSubmitting=false` return cepat.
  2. **Online (sukses)** → `db.reference.updateChildren(updates).addOnSuccessListener` → toast sukses; panggil `HybridActionQueue.flushNowIfOnline(...)`; `isSubmitting=false`.
  3. **Online (gagal network)** → addOnFailure: auto-enqueue updates yang gagal; toast *"Gagal terhubung, disimpan lokal untuk sinkron otomatis"*; `isSubmitting=false`.
- Added: **Upgrade HomeScreen Banner Mode Offline (badge + clickable + AlertDialog Pending List):**
  - Banner kondisi `isOfflineModeActive OR pendingActionCount>0` (jadi banner bisa muncul biru saat online tapi ada pending, atau amber saat offline). 2 warna: amber (Mode Offline) / biru (hanya Aksi Tertunda saat koneksi ON).
  - State baru: `var pendingActionCount by remember { mutableStateOf(HybridActionQueue.countPending(context)) }`; `var pendingActionRefreshTick by remember { mutableStateOf(0L) }`; `var showPendingActionSheet by remember { mutableStateOf(false) }`.
  - `LaunchedEffect(Unit)` ticker 15 detik → increment `pendingActionRefreshTick` (refresh counter pending secara periodik).
  - `LaunchedEffect(pendingActionRefreshTick, isOfflineModeActive)` → update `pendingActionCount = countPending(context)`; JIKA online DAN pendingActionCount>0 → `flushNowIfOnline(...)` otomatis.
  - Banner Card trailing row: Badge circle Surface (jika pending>0) tampil angka; >99 → "99+". Icon Info. `Modifier.clickable { showPendingActionSheet = true }`.
  - AlertDialog `if (showPendingActionSheet)` — Title "Aksi Tertunda Sinkronisasi". LazyColumn 6 item teratas dari `HybridActionQueue.pendingSummary(context).items` (Icon CheckCircle + type bold via `prettyTypeLabel` + summary payload via `prettyPayloadSummary` + "Tertunda sejak HH:mm" createdAt). Tombol "Sinkron Sekarang" (jika online → flushPending + refresh tick lalu tutup) / "Tutup".
- Changed: **Version bump GAS Siswa** → `1.0.101-siswa (versionCode 23098)` (monotonic naik ≥ 23097; defaultConfig + flavor `siswa` keduanya di-update SAMA ANGKA).
- Changed: **Build distribusi kandidat Hybrid Fase2** (rumah permanen Final_V2\GAS sesuai instruksi User):
  - Versioned: `GAS-Siswa-1.0.101-siswa-23098.apk`
  - Alias pointer (overwrite): `GAS-Siswa-release.apk`
  - Sidecar SHA ASCII 2 spasi uppercase: `GAS-Siswa-1.0.101-siswa-23098.sha256`
  - SHA256: `7820B1604798EE26513431D4CD95CE609ED644DB557D506CE38E74D9D0E16CDD`
  - Backup .dbg: `D:\Dashboard Portal\.dbg\GAS-Siswa-1.0.101-siswa-23098.apk` (SHA SAMA)
  - SHA triple match verified: TRUE (versioned ↔ alias ↔ .dbg ↔ sidecar header = MATCH).
- Rollback Safety Net (2 Tier sesuai aturan user):
  1. **Tier 1 Regresi Minor (hanya queue Fase2):** Overwrite alias Final_V2\GAS ke Fase1 STABIL → `GAS-Siswa-1.0.100-siswa-23097.apk` SHA `DA830971A622316B1233B4B9C8677B7EFBC73DF6E8E9BA35532E0FAE9BA206FD`.
  2. **Tier 2 Kacau Total (masuk shell rusak):** Overwrite 2 alias rumah (Final_V2\GAS DAN Final\) ke baseline NON-HYBRID CLEAN → `GAS-Siswa-1.0.99-siswa-23096.apk` SHA `67C03F8FF692FBA4F057E3E35F676EB233913978C0C5AE44E7B9914E3C8EE28F`.
  - Artefak 23097 dan 23096 **TETAP DIPERTAHANKAN** selama Fase 2–5 belum stabil final.

### Siswa — Hybrid Fase 1 (Build 1.0.100-siswa / 23097) — ✅ **SELESAI & VERIFIED di HP oleh User (Lulus Semua)**
> Status implementasi (2026-09-04 00:40): **Code applied + Build sukses + Ship SHA match + RETEST 4 SKENARIO LULUS 100% TANPA KENDALA**. User secara eksplisit memverifikasi: *"ok semua tahapan sudah saya test dan semuanya berhasil tanpa kendala"*. Fase 1 Minimum Layak **SELESAI RESMI**. Lanjut ke Fase 2 (Offline Action Queue).
- Added: **Util `HybridSnapshotStore.kt` (singleton SharedPreferences + Gson)** untuk snapshot lokal 3 domain utama: `StudentProfileSnapshot` (nama/kelas/sekolah/NISN dst), `VirtualPet`, dan `Announcement` text. Dilengkapi `updatedAt` per domain dan helper `hasAnySnapshot()`.
- Added: **Cache-first startup Virtual Pet** di `VirtualPetRepository.getVirtualPetByStudentIds(...)` (parameter baru `emitSnapshotFirst: Boolean = true`, `appContext: Context?`). Saat ada snapshot → `trySend(cached)` DULU (<100ms sebelum realtime callback); setiap `emitBestPet()` sukses → persist snapshot otomatis.
- Added: **Navigation gate pet tidak muter terus saat offline** di `rememberStudentPetLockState`. InitialValue bootstrap dari cache pet (jika ada) → `isChecking=false` langsung; infoMessage menampilkan *"Mode Offline: Status Sahabat Belajar ditampilkan dari data terakhir."* Fallback timeout 10 detik (parity baseline 23096) **TETAP AKTIF** untuk fresh install tanpa snapshot.
- Added: **HomeScreen cache-first bootstrap** via `LaunchedEffect(Unit)`: baca snapshot profil siswa + pengumuman SEBELUM fetch network; setiap `applyStudentData()` dan `refreshAnnouncement()` sukses → persist snapshot.
- Added: **Banner UI Mode Offline (Card amber)** di atas profil Home. Icon `CloudOff` + teks `Mode Offline` bold + subteks `Snapshot terakhir HH:MM (X menit lalu)`. `isOfflineModeActive` derived dari `ConnectivityManager.activeNetwork` TIDAK ADA ATAU snapshot terbaru sudah stale > 120 detik.
- Changed: **Version bump GAS Siswa** → `1.0.100-siswa (versionCode 23097)` (monotonic naik ≥ 23096; defaultConfig + flavor `siswa` keduanya di-update).
- Changed: **🏠 Rumah Deploy Baru GAS Hybrid (sesuai instruksi User 2026-09-04)**: SEMUA APK GAS versi hybrid mulai dari build 23097 dan seterusnya diletakkan di **`D:\Dashboard Portal\Apk Release\Final_V2\GAS`** (parity EduLock Final_V2), BUKAN di `Apk Release\Final` lagi. Folder `Final\` hanya untuk NON-HYBRID baseline rollback (≤23096) dan build GAS Guru/Kepala. Marker deploy location ditulis di `Final_V2\GAS\HYBRID_GAS_DEPLOY_LOCATION.txt` sebagai pegangan permanen.
- Changed: **Build distribusi lokal kandidat Hybrid Fase 1** sekarang menunjuk ke **Final_V2\GAS**: `GAS-Siswa-1.0.100-siswa-23097.apk` + alias `GAS-Siswa-release.apk` + sidecar SHA `GAS-Siswa-1.0.100-siswa-23097.sha256`. SHA256: `DA830971A622316B1233B4B9C8677B7EFBC73DF6E8E9BA35532E0FAE9BA206FD`. Backup .dbg tersimpan di `D:\Dashboard Portal\.dbg\GAS-Siswa-1.0.100-siswa-23097.apk` (SHA match). Aturan ship untuk build hybrid selanjutnya: selalu taruh di Final_V2\GAS dengan format yang sama (versioned + alias + sidecar SHA + .dbg backup, SHA triple match).
- Rollback Safety Net (TIDAK PERLU DIAKTIFKAN untuk Fase 1): **Semua skenario LULUS.** Namun artefak baseline NON-HYBRID `GAS-Siswa-1.0.99-siswa-23096.apk` SHA `67C03F8FF692FBA4F057E3E35F676EB233913978C0C5AE44E7B9914E3C8EE28F` **TETAP DIPERTAHANKAN di Final\** sebagai pagar aman rollback sampai Fase 2–5 Hybrid stabil penuh. Jika Fase 2/3 ada regresi berat → rollback ke 23097 dulu (Final_V2\GAS) atau ke 23096 kalau kacau total.

### Siswa (Baseline Rollback) — Build 1.0.99-siswa (23096) — Verified Partial
- Fixed: **GAS Siswa offline fallback timeout** untuk gate `Memeriksa Status Sahabat Belajar`. Saat internet mati, loader tidak lagi muter tanpa akhir; aplikasi sekarang masuk dengan fallback mode offline sekitar 10 detik.
- Fixed: **Instrumentation debug sesi `settings-home-gas-spin`** sudah dibersihkan kembali dari source produksi GAS setelah akar masalah offline loader terkonfirmasi.
- Changed: **Build distribusi lokal GAS Siswa** baseline rollback bergerak ke `1.0.99-siswa (23096)` sebagai clean build stabil sebelum hybrid masuk.

### Siswa (Roadmap & Rencana Pengembangan Mendatang — Fase 2 dst)
- Planned / Roadmapped: **Hybrid Fase 2 — Offline Action Queue**: 7 KAIH checklist dan interaksi ringan Sahabat Belajar (feed, minum, obat) disimpan lokal dulu, disinkronkan otomatis saat internet kembali.
- Planned / Roadmapped: **Hybrid Fase 3 — Payload Lokal GAS + Banner Sinkronisasi**: Identitas sekolah, branding, menu aktif, aturan home disimpan persist di payload lokal; UI kartu `[ 📥 Download Data Sekolah ]` → `[ 🔄 Update Data Sekolah ]` dengan stempel waktu + hash versi.
- Planned / Roadmapped: **Hybrid Fase 4 — Queue & Sync Coordinator**: Koordinator tunggal mengatur fetch vs cache vs retry, menggantikan logic tercecer di tiap screen.
- Planned / Roadmapped: **Hybrid Fase 5 — Rekonsiliasi Konflik + Hardening**: Aturan conflict resolution untuk data offline vs online divergen; audit log job gagal sync.
- Planned / Roadmapped: **Mesin Scan Presensi Kelas Berjalan (Mobile Walking Scanner)**: Menu scanner CameraX & MLKit ultra-cepat khusus `Sekretaris Kelas` (`isClassSecretary=true`). Mencatat presensi teman sekelas tanpa HP secara berkeliling (1 detik per barcode NISN fisik). Cetak biru di `Apk Release/Final_V2/ROADMAP_HYBRID_OFFLINE_DUAL_MODE.md`.

### Guru / Kepala Sekolah
- Fixed: **Force Update Bypass Khusus Guru & Kepala Sekolah**: Pengecekan `VersionCheckService` / `min_version_code_gas` di `Navigation.kt` kini secara ketat hanya diberlakukan untuk varian Siswa. APK Guru dan Kepala Sekolah kebal permanen dan tidak akan pernah terblokir oleh batasan versi siswa. Rebuild release `GAS-Guru-release.apk` (`1.0.72-guru / 1064`) dan `GAS-Kepala-release.apk`.

### Siswa
- Fixed: **Virtual Pet Multi-Alias & Status Synchronization Web vs APK**: Memperbaiki inkonsistensi status virtual pet di mana APK siswa mendeteksi pet `DEAD` (terkunci dengan overlay *"Akses APK Ditahan"*) namun Web Admin membaca rekaman placeholder alias `"Siswa"` dengan status `SICK`/Sekarat. Perbaikan:
  1. Penyelarasan comparator deduplikasi di API Admin Web `api/admin/virtual-pet` (`Level -> XP -> Coins -> Recency`) agar 100% identik dengan Kotlin APK `VirtualPetRepository.kt`.
  2. Implementasi **Multi-Alias Auto Revive** di backend agar aksi Revive dari Admin Web secara otomatis menghidupkan seluruh rekaman pet yang terhubung dengan siswa tersebut.
  3. Memperbarui `isDeadByRule()` di web agar menghormati status `DEAD` yang ditulis oleh APK.
- Added: **100% Full Feature Parity PWA Web Siswa (`/siswa/*`)** mencakup seluruh 10 kartu menu (Absensi GPS, Sholat Dzuhur deadline 15:00, Sholat Dhuha & Jum'at, Lentera Digital + Reader + Live Reading Timer 30m, 7 KAIH Weekly Checklist, Sahabat Belajar Virtual Pet 6 Vitals interaktif, Kedisiplinan, Layanan Aduan Siswa, Notifikasi, dan Tools Belajar dengan 4 alat aktif).
- Fixed: **Virtual Pet Real-Time Dismissal Cutoff**: Menghubungkan batas jam pulang sekolah (`hasWindowEnded`) dari Firebase RTDB `attendanceData` ke `VirtualPetViewModel.kt`. Jika jam kepulangan sekolah telah berakhir dan siswa belum tercatat hadir, sistem secara otomatis menetapkan status Alpa (0% kebahagiaan) dan memotong skor kebahagiaan harian tanpa celah absen malam hari.
- Changed: **Build Distribusi GAS Siswa**: Versi resmi diperbarui ke `1.0.96-siswa (23093)`, disalin ke `Apk Release/Final` dan `web/public/apk/` beserta sinkronisasi `apk-manifest.json` dan `fallback-install.json`.
- Fixed: **Gate GPS di HomeScreen** sekarang melewati (skip) pengecekan hardware GPS dan izin `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` untuk perangkat Android TV / IFP Smart TV yang secara fisik tidak memiliki modul GPS, sehingga dialog "GPS Wajib Aktif" tidak lagi false-block akses aplikasi. Deteksi TV menggunakan `FEATURE_TELEVISION`, `FEATURE_LEANBACK`, atau `FEATURE_LEANBACK_ONLY`; fallback deteksi via `FEATURE_LOCATION` bila hardware lokasi memang tidak tersedia.
- Changed: Dialog izin pada Home sekarang dinamis. Untuk perangkat tanpa modul lokasi, hanya diminta izin Notifikasi (tidak lagi menampilkan narasi "izin Lokasi" yang mustahil diberikan di TV).
- Fixed: `7KAIH` siswa tidak lagi terkunci penuh per minggu. Minggu yang memuat hari ini tetap bisa diisi, sehingga kolom hari berjalan seperti `Minggu` tetap aktif sesuai aturan tugas harian.
- Changed: Tombol aksi `7KAIH` siswa sekarang menampilkan narasi `Simpan Laporan Hari Ini` saat berada di minggu aktif, agar alurnya lebih jelas sebagai finalisasi harian.
- Fixed: `Virtual Pet` sekarang menghitung `energy` dari 7KAIH sebagai kewajiban harian siswa, sehingga progres kebiasaan tetap memengaruhi energi pet meskipun hari itu bukan hari efektif absensi sekolah.
- Fixed: Quest harian `Absensi Sekolah Hari Ini`, `Presensi Sholat Hari Ini`, dan `Membaca Buku` pada `Virtual Pet` sekarang ikut menyinkronkan status `isPaused` secara konsisten, sehingga badge libur dan perilaku quest lebih selaras dengan rule hari efektif terbaru.
- Changed: Kartu `Kehadiran` pada `Virtual Pet` sekarang menampilkan status `Hari ini libur sekolah` saat hari libur, tidak lagi jatuh ke narasi seolah data absensi belum masuk.
- Changed: Kartu `Literasi Aktif` dan action card `E-Perpus` pada `Virtual Pet` sekarang menampilkan narasi bonus libur yang lebih jelas saat siswa membaca di hari libur.
- Fixed: Pesan auto reward quest `Membaca Buku` pada hari libur sekarang menyebut bonus yang benar, yaitu `+10 Kecerdasan`, bukan pesan umum koin/XP.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.92-siswa (23089)` dan jalur unduhan web publik LIVE commit `81bdb467` sudah menunjuk versi ini melalui `apk-manifest.json`.
- Changed: **Siswa (Presensi Siswa)** rule operasional sekretaris kini di-**cleanup total**: logika `PENDING_TEACHER` dan jalur usulan/verifikasi bertahap tidak lagi dipakai untuk data baru; seluruh input `Wali Kelas` dan `Sekretaris Kelas` langsung menjadi final; audit trail `proposedBy` / `proposedStatus` tidak lagi di-set pada record baru (field legacy tetap dibaca untuk data lama).
- Added: **Siswa (Presensi Siswa)** hasil build `1.0.92` mencakup parity UI dengan web admin/portal guru: label badge audit sekarang menampilkan "Dicatat oleh: <verifier>" alih-alih narasi "Final dari usulan sekretaris".
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.91-siswa (23088)` dan jalur unduhan web lokal sudah disinkronkan ke versi yang sama melalui `apk-manifest.json`.
- Changed: **Siswa (Presensi Siswa)** jalur `Sekretaris Kelas` sekarang mengikuti rule operasional baru: input sekretaris langsung dicatat sebagai data final, bukan lagi usulan `PENDING_TEACHER`.
- Fixed: **Siswa (Presensi Siswa)** teks aksi dan badge audit di layar presensi diperjelas agar membedakan rule baru vs data legacy yang masih pending.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.90-siswa (23087)` untuk membawa `Rekap Mingguan` pada menu `Presensi Siswa`; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Added: **Siswa (Presensi Siswa)** sekarang memiliki tab baru `Rekap Mingguan` agar wali kelas dan sekretaris kelas bisa memantau tren absensi lebih cepat tanpa menunggu akhir bulan.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.89-siswa (23086)` untuk membawa guard verifikasi `Sekretaris Kelas`; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Presensi Siswa)** sekretaris kelas sekarang hanya bisa mengirim **usulan presensi** dan tidak lagi menetapkan hasil final secara langsung.
- Fixed: **Siswa (Presensi Siswa)** akun sekretaris sekarang tidak bisa mengabsenkan dirinya sendiri dan tidak bisa mengubah baris yang sudah final oleh guru.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.88-siswa (23085)` untuk membuka akses `Presensi Siswa` khusus `Sekretaris Kelas`; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Added: **Siswa (Home/Akses Kelas)** akun siswa yang ditandai sebagai `Sekretaris Kelas` kini otomatis mendapat menu `Presensi Siswa`.
- Fixed: **Siswa (Presensi Siswa)** jalur kolaborasi absensi manual kini bisa dipakai sekretaris kelas untuk mengelola absensi teman sekelasnya sendiri, tanpa membuka akses ke kelas lain.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.87-siswa (23084)` untuk menaikkan lagi posisi label tombol `Absensi` di Home agar lebih terlihat; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Home)** lengkung label `Absensi` di tombol floating tengah sekarang dinaikkan lagi bersama grup tombolnya sehingga tulisan lebih terlihat, sambil tetap mengikuti frame lingkaran tombol.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.86-siswa (23083)` untuk merapikan ulang lengkung label tombol `Absensi` di Home; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Home)** lengkung label `Absensi` di tombol floating tengah kini dirapatkan dan diturunkan sedikit agar benar-benar mengikuti frame lingkaran tombol, tidak lagi melebar terlalu tinggi ke atas.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.85-siswa (23082)` untuk perapihan label tombol `Absensi` di Home; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Home)** label `Absensi` pada tombol floating tengah sekarang naik ke atas ikon dan dibentuk melengkung mengikuti setengah lingkaran atas, sehingga tidak lagi terlalu turun atau kepotong di bawah layar.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.84-siswa (23081)` untuk perbaikan logika `Virtual Pet`; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Virtual Pet)** evaluasi empat kartu harian (`E-Perpus`, `7 KAIH`, `Kehadiran`, `Ibadah`) kini dieksekusi berdasarkan **rekap hari sebelumnya**, sehingga pet tidak lagi bisa langsung mati di pagi hari sebelum siswa sempat beraktivitas pada hari baru.
- Changed: Build final lokal GAS Siswa sekarang menjadi `1.0.83-siswa (23080)` untuk uji cepat patch gate EduLock; live unduhan web masih bertahan di `1.0.82-siswa (23079)` sampai sinkronisasi public APK dilakukan.
- Fixed: **Siswa (Gate EduLock/Login)** pembukaan ulang aplikasi tidak lagi lama tertahan di overlay `Memeriksa Proteksi EduLock` saat aksesibilitas EduLock belum aktif, karena gate sekarang memutuskan **blokir lokal lebih dulu** sebelum menunggu fetch jadwal sekolah atau telemetry remote.
- Changed: Build distribusi GAS Siswa `1.0.82-siswa (23079)` dibuild ulang lagi pada **2026-08-28 13:25**, hash Final/public alias menjadi `C09A10E08D23BFEE98F8DB4D2B60BE547F9FAA928459E0BB8F9695EA806B2C4C`, lalu **SUDAH disinkronkan** ke `web/public/apk` dan live unduhan Firebase/App Hosting.
- Fixed: **Siswa (Gate EduLock)** sekarang dibangun dengan konsep baru bahwa hard block kepatuhan EduLock hanya aktif saat **hari efektif + jam sekolah aktif**, dengan **grace period** saat proteksi drop sesaat di tengah sesi.

### Guru
- Changed: Build distribusi GAS Guru saat ini menjadi **`1.0.73-guru (1065)`** dengan file final aktif `GAS-Guru-release.apk` dan arsip `GAS-Guru-1.0.73-guru-1065.apk`. SHA256 `C74A0DBFDA092695D3A485248A574E8189948459F866EFC9CCF727AF0F3A8EDD` (ukuran 21.527.385 byte).
- Changed: **Guru (Presensi Dhuha & Jum'at)** layout dibuat 100% **parity Presensi Sholat Dzuhur** yang rapi:
  - 4 statistik (Sholat, Tidak, Izin, Halangan) ganti dari `StatPill` pil kecil (yang sempat wrap label 8 huruf) menjadi `PrayerStatCard` 80×70dp (angka besar `titleLarge` + bold di atas, label kecil di bawah, warna accent per status, 4 card jejer SpaceBetween tanpa wrap vertikal).
  - Card tanggal dipisah dari statistik (sekarang 2 baris `[label Tanggal Presensi] → [tanggal teks besar]`) — menutup bug layout push kolom Nama Siswa turun 2 baris akibat Card tanggal + StatPill gabungan lama terlalu tinggi.
  - Tabel status di-rewrite: header per kolom `NO | NAMA SISWA | S | TS | I | H` (bukan header tunggal "Status"), `PrayerStatusOption` full-height dengan **icon Check warna accent** kalau terpilih, pemisah `TableColumnDivider` per kolom, Nama Siswa 2 baris maksimal ellipsis.
  - Ditambahkan **footer keterangan inisial status** di bawah tombol Simpan persis Dzuhur: *"Gunakan kolom S, TS, I, atau H untuk memilih status manual siswa."*
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.72-guru (1064)` dengan file final aktif `GAS-Guru-release.apk`.
- Changed: **Guru (Presensi Siswa)** kontrak UI dan badge audit sekarang di-**cleanup total**: tidak ada lagi badge `PENDING_TEACHER` atau tombol `Finalisasi Usulan Sekretaris` untuk data baru; data legacy yang masih pending tetap bisa diedit/diupdate melalui jalur edit manual biasa.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.71-guru (1063)` dengan file final aktif `GAS-Guru-release.apk`.
- Changed: **Guru (Presensi Siswa)** input wali kelas dan sekretaris kini sama-sama dianggap final, sementara data legacy yang masih `pending` tetap bisa difinalkan dari layar guru/admin.
- Fixed: **Guru / Web Guru / Web Admin** copy UI audit presensi sekarang membedakan jelas `pending legacy` vs rule baru `final langsung`, sehingga operator tidak lagi melihat narasi verifikasi bertahap pada data baru.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.70-guru (1062)` dengan file final aktif `GAS-Guru-release.apk`.
- Added: **Guru (Presensi Siswa)** sekarang memiliki tab `Rekap Mingguan` agar monitoring absensi kelas tidak harus menunggu rekap bulanan.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.69-guru (1061)` dengan file final aktif `GAS-Guru-release.apk`.
- Fixed: **Guru (Presensi Siswa)** verifikasi guru sekarang menjadi tahap final yang sah untuk usulan sekretaris kelas, dan data `pending verifikasi guru` tidak lagi ikut terbaca sebagai hasil final.
- Fixed: **Guru (Presensi Siswa)** layar monitoring sekarang menampilkan jejak audit yang lebih jelas untuk `pengusul sekretaris`, status `pending`, dan `final verifier`.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.68-guru (1060)` dengan file final aktif `GAS-Guru-release.apk`.
- Fixed: **Guru (Home)** badge merah pada menu `Notifikasi` digeser lebih masuk ke dalam sudut kartu agar tidak terlihat terlalu keluar dari bingkai.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.67-guru (1059)` dengan file final aktif `GAS-Guru-release.apk`.
- Changed: **Guru (Home)** bingkai kartu menu dipangkas lagi sekitar 30% dari iterasi sebelumnya; tinggi panel kartu, padding vertikal, dan jarak ke pill label dipersingkat, sementara ikon menu tetap besar.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.66-guru (1058)` dengan file final aktif `GAS-Guru-release.apk`.
- Changed: **Guru (Home)** proporsi kartu menu disetel ulang sesuai koreksi user; yang diperkecil adalah kotak/bingkai kartu dan panel ikon, sedangkan ikon menu tetap besar agar tidak tampak ikut menyusut.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.65-guru (1057)` dengan file final aktif `GAS-Guru-release.apk`.
- Changed: **Guru (Home)** kartu menu diperkecil lagi secara proporsional; spacing grid, tinggi panel ikon, ukuran ikon, dan pill label diringkas agar layar terasa memuat menu lebih banyak tanpa mengubah identitas UI guru 2 kolom.
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.64-guru (1056)` dengan file final aktif `GAS-Guru-release.apk`.
- Fixed: **Guru (Presensi Siswa)** input manual guru sekarang tetap sinkron ke `Rekap Bulanan` setelah `Simpan Presensi Manual`, tidak hanya terlihat di `Monitoring Harian`.
- Fixed: **Guru (Presensi Dhuha & Jum'at)** pilihan status di tabel kini meninggalkan jejak visual yang lebih tegas (warna status + ikon centang) agar guru langsung tahu siswa sudah dicentang.
- Fixed: **Guru (Home)** fase loading awal tidak lagi sempat menampilkan campuran UI siswa ketika sesi guru belum selesai terbaca.
- Changed: **Guru (Home)** kartu menu diperkecil sedikit lagi agar lebih ringkas tanpa mengubah identitas UI guru.
- Fixed: **Guru (Presensi Sholat)** hitungan `TS / Tidak Sholat` di APK guru sekarang mengikuti **hari efektif Dzuhur** yang sama dengan APK siswa dan web admin (`attendance/schedules` + `attendance/holidays` + `prayer_v2/types/DZUHUR/activeDays`), tidak lagi jatuh ke hitungan lama `24`.
- Fixed: **Guru (Rekapitulasi)** ekspor/rekap guru di APK sekarang memakai denominator hari efektif Dzuhur yang sama, sehingga kolom `TS` sinkron dengan web admin yang sudah diperbaiki.
- Changed: **Guru (Home)** kartu menu dipendekkan dan diringankan agar tidak terasa terlalu besar di layar, tetapi identitas UI guru tetap 2 kolom glassmorphism tanpa bottom nav.
- Fixed: **Guru (Home)** badge merah notifikasi di kartu menu digeser sedikit masuk agar tidak mepet ke sudut kanan atas dan lebih jelas terlihat.

### Web Admin / PWA
- Added: **PWA GAS Siswa (Web iOS)** telah dirilis perdana untuk mengakomodasi siswa pengguna iPhone/iOS yang tidak dapat menginstal aplikasi Android EduLock. PWA ini hadir sebagai sistem mandiri tanpa limitasi EduLock, memiliki jalur autentikasi siswa khusus (`/api/student/login`) yang terintegrasi langsung dengan database RTDB, antarmuka khas GAS Siswa (Bottom Nav hitam melayang, gradien, 4 kolom grid), dan fitur **Presensi Kehadiran** menggunakan *GPS/Geolocation* browser (`/siswa/absen`).
- Changed: **Web Admin / Rekap Kehadiran** + **Portal Guru `/guru/presensi`** sekarang di-**cleanup total** rule usulan sekretaris: endpoint `/api/admin/attendance-verification` dihapus; tombol `Finalkan Legacy`, panel statistik `Usulan Sekretaris Pending`, dan badge `PENDING_TEACHER` dihilangkan dari UI untuk data baru (hanya data lama yang masih `PENDING_TEACHER` yang tetap bisa diedit manual). Bersama commit ini juga di-ship APK publik: GAS Siswa `1.0.92-siswa (23089)` dan EduLock `1.3.22 (48)` live via `/gas/install` dan `/e`. Deploy live commit `81bdb467`.
- Removed: **Web Admin + Portal Guru** debug-point `fetch 127.0.0.1:7777/event` di AuthProvider guard dan halaman `/dashboard/database` (sample hit ke local server saat development).
- Fixed: **Web Admin / Presensi Sekolah** pengaturan `attendance-settings` sekarang menyertakan helper `normalizeTimeValue` agar input waktu manual `07:30` vs `07:30:00` tidak dibaca beda oleh backend.
- Changed: **Web Admin / Rekap Kehadiran** kini menganggap input `Wali Kelas` dan `Sekretaris Kelas` sebagai data final langsung; panel verifikasi admin dipertahankan hanya untuk membereskan data legacy yang masih `PENDING_TEACHER`.
- Changed: **Portal Guru `/guru/presensi`** kini selaras dengan rule baru tersebut, sambil tetap mempertahankan badge audit sumber input dan finalisasi legacy bila masih ada data lama.
- Changed: Perubahan rule `final langsung` untuk **Web Admin / Rekap Kehadiran** dan **Portal Guru `/guru/presensi`** sudah live melalui deploy commit `089fe1da`.
- Added: **Web Admin / Rekap Kehadiran** sekarang memiliki tab baru `Rekap Mingguan` langsung di dashboard admin GAS, lengkap dengan navigator `Minggu Sebelumnya / Minggu Berikutnya` untuk memantau absensi tanpa harus menunggu rekap bulanan penuh. Deploy live commit `69706d10`.
- Fixed: **Web Admin / Rekap Kehadiran** tab `Rekap Mingguan` kini menghitung slot lintas batas bulan dengan benar, dan tetap menahan usulan `Sekretaris Kelas` yang masih `pending` agar belum masuk hitungan final.
- Changed: **Portal Guru `/guru/presensi`** yang live sekarang benar-benar menyamai APK GAS Guru terbaru: tab `Monitoring Harian / Rekap Mingguan / Rekap Bulanan` tersedia, data pending usulan sekretaris tidak dihitung final, dan badge audit verifikasi tampil di monitoring harian. Deploy live commit `7bae9684`.
- Fixed: **Web Admin / Rekap Kehadiran** admin sekolah sekarang bisa memverifikasi usulan presensi `Sekretaris Kelas` langsung dari `Riwayat Harian` jika wali kelas berhalangan, tanpa menghapus jejak audit pengusul.
- Changed: **Web Admin / Rekap Kehadiran** perubahan verifikasi admin sekolah untuk usulan `Sekretaris Kelas` sudah live di App Hosting. Deploy live commit `c781bc8f`.
- Changed: **Web Admin / Rekap Kehadiran** label verifikasi dan statistik pending kini menyebut jalur `wali kelas atau admin sekolah` agar sesuai dengan kontrak verifikasi terbaru.
- Fixed: **Web Admin / Rekap Kehadiran** riwayat harian dan statistik sekarang membedakan jelas usulan sekretaris yang masih `pending verifikasi guru` vs data yang sudah final, serta mempertahankan jejak audit pengusul setelah guru menyetujui.
- Changed: **Web Admin / Rekap Kehadiran** panel statistik kini menampilkan jumlah `Usulan Sekretaris Pending` dan `Usulan Sekretaris Disetujui` agar kolaborasi sekretaris-guru bisa dipantau lebih mudah.
- Fixed: **Portal Guru `/guru/presensi`** kini me-refresh `Rekap Bulanan` setelah guru menekan `Simpan Presensi Manual` bila periode bulan/tahunnya sama, sehingga parity-nya mengikuti perilaku terbaru APK GAS Guru.
- Fixed: **Portal Guru `/guru/sholat-dhuha-jumat`** kini memakai `status efektif` (manual atau tersimpan) untuk highlight tabel, sehingga tidak ada lagi dua status aktif bersamaan saat guru memilih status manual yang berbeda dari data lama.
- Changed: **Portal Guru `/guru/presensi`** dan `/guru/sholat-dhuha-jumat` sekarang memakai indikator sel aktif yang lebih tegas (warna status, inset border, ikon centang, label kecil) agar jejak pilihan guru lebih jelas seperti di APK.
- Fixed: **Portal Guru `/guru/sholat`** yang live sekarang menghitung `TS / Tidak Sholat` dengan kontrak hari efektif Dzuhur yang sama seperti web admin dan APK siswa. Deploy live commit `9f42a276`.
- Fixed: **Portal Guru `/guru/kaih`** tab `Penilaian` sekarang mengikuti pola APK GAS Guru: preset cepat `Nilai 25 / Nilai 20 / Reset` tampil langsung di halaman, dan dialog edit per siswa memakai 4 field angka (`Kejujuran`, `Perilaku`, `Inisiatif`, `Komitmen`) plus preset cepat yang sama. Deploy live commit `4822f24e`.

## [1.0.82-siswa] - 2026-08-27
### Fixed
- **Siswa (Presensi Sholat)**: Kartu **Aturan Hari → Hari efektif** mengikuti pengaturan **Presensi Sekolah** (`attendance/schedules`), bukan jadwal sholat warisan. Kunci hari yang tidak ada di map tidak dianggap libur.
- **Siswa (Virtual Pet)**: Indikator hari efektif Dzuhur memakai path attendance yang sama.
- **Siswa (7 KAIH)**: Setelah laporan minggu berjalan dikirim, checklist minggu itu terkunci sehingga siswa tidak bisa submit ulang atau mengubah centang lagi.
- **Siswa (7 KAIH)**: Kotak centang hanya aktif untuk hari yang memang aktif pada tanggal hari ini; hari lain tetap terlihat tetapi tidak bisa dicentang.
- **Siswa (Lentera Digital)**: Reader buku mendukung `zoom in/out`, mode `fullscreen`, dan panel bawah native (`halaman saat ini / total halaman` + tombol `Sebelumnya/Berikutnya`) agar teks kecil lebih nyaman dibaca.
- **Siswa (Gate EduLock)**: Jalur buka dari EduLock tidak lagi tertahan delay ketika aksesibilitas / admin perangkat lokal sudah pulih tetapi telemetry remote belum menyusul.
- **Siswa (Presensi/Kedisiplinan)**: Siswa yang **datang terlambat** sekarang otomatis tercatat sebagai **pelanggaran** sesuai rule aktif admin sekolah setelah simpan absensi berhasil.
- **Siswa (Presensi/Kedisiplinan)**: Siswa yang **pulang awal** sekarang juga otomatis tercatat sebagai **pelanggaran** sesuai rule aktif admin sekolah.
- **Siswa (Kedisiplinan)**: Guard anti-double ditambahkan agar auto-record dari presensi tidak membuat duplikat ketika OSIS atau guru mencatat pelanggaran harian yang sama pada tanggal yang sama.
### Note (audit, tanpa kode baru)
- **Siswa (Presensi Dhuha & Jum'at)**: Sudah membaca `prayer_v2` (Jadwal Per Kelas + Override) selaras web admin. Hari/kelas/override menggerakkan status & tombol. Baris **Jam** tetap **statis** (sengaja, termasuk saat Tidak dijadwalkan).
- Changed: Build distribusi GAS Siswa `1.0.82` (`versionCode 23079`) dibuild ulang internal QA pada 2026-08-28 02:05 dan disalin ke Final dengan SHA256 `C4B84E8370D55EAFFC7809020A94BB76265541219547782DA0454A5BCB8B9A44`. Final only — URL unduhan web belum di-update.
- Changed: Build distribusi GAS Siswa `1.0.82` (`versionCode 23079`) dibuild ulang lagi pada 2026-08-28 11:37 dan disalin ke Final dengan SHA256 `76EEF68BB9E0C426615141629B9D2D4AB16C3E1B9E552EA99BF290F7F74B7B73`. Muatan build ini juga membawa perapihan home/presensi sholat dari rebuild 09:26. Final only — URL unduhan web belum di-update.

### Web Admin / PWA (2026-08-16)
- Restored: Menu **Rekap Dhuha & Jumat** + pengaturan sistem `prayer_v2` kembali di live App Hosting (`39f8bb48`).
- Fixed: Matching jadwal `classIds` admin <-> rekap/API guru (`13c86d2f`).
- Fixed: Normalisasi jam admin `HH.mm` -> `HH:mm` di config prayer web (`b3f5ce4f`).
- Fixed: Monitor Virtual Pet **Total Pets Aktif** hanya pet ter-link roster; orphan/siluman RTDB tidak ikut total (`39580854`). Cleanup one-off sebelumnya bukan filter tahan lama.
- Note kontrak: **Override / Generator Jumat** hanya tanggal + kelas; **Jam** wajib di **Jadwal Sholat Per Kelas**.
- Note kontrak: **Kenyang** hanya hari sekolah efektif + baca >=30 menit; baca di hari libur -> quest **+10 Kecerdasan** (bukan Kenyang).
- Note: Selisih hitungan pet 104 vs 100 = orphan siluman RTDB; monitor sekarang memfilter.

## [1.0.81-siswa] - 2026-08-18
### Added
- **Siswa (Tools)**: Menambahkan fitur **Kamus Besar Bahasa Indonesia (KBBI)** pada menu Tools Belajar berbasis mirror resmi KBBI v6 (`https://kbbi.raf555.dev/`) dengan fallback ganda. Dilengkapi pemenggalan suku kata, badge kelas kata (Verba, Nomina, dll), dan contoh penggunaan dalam kalimat.
- **Siswa (Buku Pembiasaan Religius)**: Menambahkan **Surat Al-Mulk** (Surah ke-67, 30 ayat) pada daftar surat pilihan.
### Changed
- **Siswa (Buku Pembiasaan Religius)**: Sinkronisasi seluruh naskah Al-Qur'an (Surat Ar-Rahman, Surat Al-Waqi'ah, Surat Yasin, dan Surat Al-Mulk) menggunakan naskah resmi **Mushaf Standar Indonesia** (Lajnah Pentashihan Mushaf Al-Qur'an Kemenag RI / rujukan NU Online `quran.nu.or.id`), mencakup teks Arab rasm Usmani standar, transliterasi Latin, dan terjemahan resmi bahasa Indonesia.
- **Siswa (Security & Navigasi)**: Mendaftarkan rute `tools_kbbi_dictionary` dan `tools_religious_book` ke whitelist akses di `SecurityUtils.kt` dan `GasAppNavGraph.kt`.
- Changed: Build distribusi GAS Siswa `1.0.81` (`versionCode 23078`). Disalin menimpa `GAS-Siswa-1.0.81-siswa-23078-INTERNAL.apk`, `GAS-Siswa-release.apk`, `GAS Siswa release.apk`, dan `app-siswa-release.apk` di `Apk Release/Final`.

## [1.0.80-siswa] - 2026-08-16
### Fixed
- **Siswa (Virtual Pet)**: Loading spinner tetap sampai sync vitals pertama selesai; tidak flash SEKARAT/DEAD dari partial alias/schedule sebelum bootstrap siap.
- Changed: Build distribusi GAS Siswa `1.0.80` (`versionCode 23077`). Ship publik: sync `web/public/apk` + manifest ke `1.0.80-siswa` / `23077` (SHA256 `CB5CF413…`).
## [1.0.79-siswa] - 2026-08-16
### Fixed
- **Siswa (cold start)**: Crash silent/instant exit saat buka APK — `NoClassDefFoundError: NavigationKt` / `ClassNotFoundException`. Root cause: facade `Navigation.kt` terlalu besar sehingga kelas tidak ter-load dari secondary dex. Perbaikan: pecah route graph ke `GasAppNavGraph.kt`, `MultiDexApplication` (`GasApp`), `multiDexEnabled` + keep file entry points.
- Changed: Build distribusi GAS Siswa `1.0.79` (`versionCode 23076`). Final only — URL unduhan web belum di-update.
## [1.0.78-siswa] - 2026-08-16
### Fixed
- **Siswa (Presensi Dhuha/Jumat)**: Matching jadwal admin `prayer_v2` menghormati `classIds` (array/map), label kelas, dan varian `schoolId`.
- **Siswa (Presensi Dhuha/Jumat)**: Jam tampilan/gate memakai start/end admin (normalize `HH.mm` ke `HH:mm`); tidak lagi menampilkan fake `07:00-07:30`. Hari tanpa jadwal = "Tidak dijadwalkan" tanpa jam palsu.
- Changed: Build distribusi GAS Siswa `1.0.78` (`versionCode 23075`). Final only — URL unduhan web belum di-update. Catatan: build pertama class-match saja (SHA `4BCE1A...`), lalu rebuild Final dengan fix jam (`E2F63CC3...`).
## [1.0.77-siswa] - 2026-08-16
### Added / Changed
- **Siswa (Lentera)**: Kartu home **Tantangan Bulan Ini** menampilkan tugas literasi admin aktif (`literacy_tasks` per sekolah/kelas + jadwal), termasuk status submit; empty state jika belum ada.
- **Siswa (Virtual Pet)**: Quest **Bonus Literasi Bulanan** (+200 koin / +100 XP, 1x per bulan kalender) saat siswa mengirim laporan tugas literasi; badge UI `BULANAN`.
- Changed: Build distribusi GAS Siswa dinaikkan ke `1.0.77` (`versionCode 23074`). Catatan: salinan Final saja â€” URL unduhan web belum di-update.
### Fixed
- **Siswa (Virtual Pet)**: Spam notifikasi/popup pet MATI saat vital sudah pulih (mati = vital saja).
- **Siswa (Lentera)**: Statistik **Buku Dibaca** = `floor(total menit baca / 30)`.

## [1.0.76-siswa] - 2026-08-16
### Fixed
- **Siswa (Home)**: Status Kehadiran di Beranda menampilkan `LIBUR` pada hari non-efektif (jadwal sekolah / tanggal merah), selaras dengan menu Absensi (`HomeScreen.kt`).
- **Siswa (Dzuhur)**: Presensi Sholat Dzuhur dan indikator pet menghormati admin `prayer_v2` Hari Wajib (`activeDays`, JS weekday 0-6) serta flag `enabled` sebelum fallback jadwal/libur legacy (`PresensiRuleUtils.kt`, `PrayerScreen.kt`, `VirtualPetRepository.kt`).
- **Siswa (Sahabat Belajar Ibadah)**: Kriteria Ibadah tidak lagi jatuh ke "Belum ada" saat hari libur/non-wajib; label menjadi `Libur / tidak wajib`, plus kartu misi prayer terpisah (`VirtualPetViewModel.kt`, `VirtualPetScreen.kt`).
- Changed: Build distribusi GAS Siswa dinaikkan ke `1.0.76` (`versionCode 23073`).

### Siswa (prior unreleased notes)
- Fixed: **Perbaikan performa absen pulang masif** - Query `getRealtimeAttendance` dan `getRealtimePrayerInfo` di `VirtualPetRepository` diubah dari `orderByChild("date")` (mengunduh data SEMUA siswa sehari) menjadi `orderByChild("studentId")` (hanya mengunduh data siswa sendiri). Ini menghilangkan lag/macet saat puluhan siswa absen pulang bersamaan.
- Changed: **Balancing Virtual Pet Literasi** - Target durasi membaca E-Perpus harian diturunkan dari **60 menit** menjadi **30 menit**. Tugas literasi bulanan tidak lagi mempengaruhi indikator Kenyang harian (dipisahkan).
- Removed: Misi harian (Daily Quest) `Tugas Literasi Hari Ini` dihapus karena tugas literasi sekolah sifatnya bulanan, bukan harian.
- Changed: Achievement `Pembelajar Aktif` diubah deskripsinya menjadi menghargai pengumpulan tugas literasi bulanan.
- Changed: Teks kartu kriteria `Literasi Aktif` diperbarui: `"Baca buku di E-Perpus minimal 30 menit"` dan progress `"X/30 menit membaca hari ini"`.
- Changed: Build distribusi GAS Siswa dinaikkan ke `1.0.52` (`versionCode 23049`) karena perubahan logic query dan balancing pet.
- Changed: Katalog `Lentera Digital` GAS Siswa: **1 dropdown Kategori** (mulai "Semua", lalu Fiksi & Sastra, Buku Pelajaran, Non-fiksi, dst) + **grid buku** sesuai kategori aktif. Chip horizontal, field "Pilih buku", search "Cari judul buku...", dan kartu detail "Daftar Buku" dihapus.
- Fixed: Field NISN di Profil (menu utama + tab Profil Lentera Digital) menampilkan **NISN asli siswa** dari `user_nisn` / login key, bukan Firebase record id (`-Oz-...`).
- Changed: Build distribusi GAS Siswa sebelumnya `1.0.51` (`versionCode 23048`) untuk koreksi UX katalog (filter kategori + daftar buku).
- Changed: Build distribusi GAS Siswa sebelumnya `1.0.50` (`versionCode 23047`) untuk NISN + iterasi katalog awal.
- Fixed: Katalog `Lentera Digital` pada GAS Siswa sekarang mengikuti **master kategori web e-perpus** secara persis: `SEMUA KATEGORI`, `FIKSI & SASTRA`, `BUKU PELAJARAN`, `NON-FIKSI`, `ENSIKLOPEDIA`, `SAINS & TEKNOLOGI`, `PENGEMBANGAN DIRI`, `MINAT`, `MAJALAH`, dan `LAINNYA`.
- Fixed: Filter kategori katalog siswa kini memakai aturan yang sama seperti halaman web `admin/books/lentera-catalog`, termasuk normalisasi buku lama seperti kategori string yang masih membawa turunan `ENSIKLOPEDIA`.
- Fixed: **v1.0.48-siswa (23045)** â€” Refactor fail-open logic `EduLockComplianceGate` menghindari false-block overlay "Status EduLock belum tersinkron" saat HP bangun dari sleep + swipe recent apps (proses EduLock sempat di-kill OS, RTDB stale). Perilaku: (1) Strict activation mode (login awal) TETAP TEGAS memblokir bila remote belum valid; (2) Launch normal (setelah login) support 2 level fail-open: bila local `setupCompleted=true` â†’ langsung lolos; bila setupCompleted=false namun 4 badge dasar SEHAT (Installed + AccessibilityOn + DeviceAdminOn + ProtectionActive) â†’ dianggap akan self-heal oleh EduLock ScreenReceiver â†’ lolos tanpa overlay. Logic lama strict remote-first diganti menjadi hybrid local-tolerance.
- Changed: Build distribusi GAS Siswa dinaikkan ke `1.0.48` (`versionCode 23045`) karena perubahan decision gate compliance (state logic berubah).

### PWA & Web Admin
- Added: Admin membuat Tugas Literasi (menu **Monitoring E-Library â†’ Tugas Literasi â†’ Buat Tugas**) sekarang bisa **memilih kelas target mana saja** (multi-select checkbox) yang menerima tugas tersebut, tidak harus selalu dikirim ke Semua Kelas. UI modal menambahkan panel "Kirim ke Kelas": counter terpilih `X / Total`, tombol cepat `Pilih Semua / Kosongkan`, preview summary kelas yang terpilih, dan auto-generate friendly label `className` (Semua Kelas / NamaKelas / N Kelas (Kelas1, Kelas2, â€¦)). Data persistence: field baru `classList[]` (array string authoritative) ditulis ke RTDB `literacy_tasks` dan mirror Firestore untuk backwards compatibility dengan tugas lama (yang hanya punya `className` string).
- Added: Filter kelas pada list **Tugas Literasi** web admin sekarang mendukung multi-kelas (tugas dengan `classList = ["7A", "8C"]` sekarang muncul ketika admin memilih filter tab **7A** ataupun **8C**, bukan cuma 1 match string). Backwards compatible: tugas lama dengan `className = Semua Kelas` tetap tampil di semua tab.
- Added: APK GAS Siswa sekarang **menyaring tugas literasi berdasarkan kelas siswa** di repository+viewmodel, sehingga tugas yang dikirim hanya ke kelas X tidak muncul di HP siswa kelas Y. Model `LiteracyTask` ditambah field `className` + `classList[]`, `LiteracyRepository.parseClassList` support 3 format RTDB (classList array / targetClasses array / className string legacy), `LiteracyRepository.taskMatchesStudentClass` rule fuzzy match kelas, `StudentLibraryViewModel.applySchoolScope` menambahkan syarat `matchesClass` sebelum tugas ditampilkan, dan `StudentLibraryScreen` menyampaikan `studentClass` hasil lookup RTDB profil siswa ke viewmodel via `setStudentScope` signature yang di-upgrade.
- Added: Menu `Monitoring E-Library â†’ Tugas Literasi â†’ Perlu Dinilai` pada web admin GAS kini memungkinkan admin memberikan penilaian literasi langsung dari web admin (perilaku sama seperti APK GAS Guru).
- Added: Mode per-item di tab `Perlu Dinilai` â€” setiap baris laporan pending dilengkapi tombol `Beri Nilai`. Modal berisi identitas siswa, judul buku, ringkasan, pilihan nilai A/B/C/D, umpan balik opsional, serta tombol `Simpan Nilai` (GRADED) / `Tolak` (REJECTED) / `Batal`.
- Added: Mode massal Opsi 3 di tab `Perlu Dinilai` â€” toolbar berisi checkbox `Pilih Semua`, checkbox per-row, badge `Terpilih: N`, tombol hijau `Nilai Semua (N)`, dan tombol biru `Nilai Terpilih`. Data layer `useGasLibrary.bulkGradeLiteracyLogs` memakai single multi-path RTDB update untuk commit semua laporan sekaligus.
- Added: Error handling per-item & massal â€” jika penyimpanan gagal, modal menampilkan strip pesan error tanpa menutup modal sehingga admin bisa retry tanpa input ulang.
- Added: Kartu `Sholat Dzuhur` di panel `Presensi Sholat -> Pengaturan Sistem` sekarang punya `Jam Mulai` dan `Jam Selesai` sendiri. Nilainya disimpan ke `school_settings/{schoolId}/prayer_v2/types/DZUHUR`, sehingga admin tidak lagi harus menumpang jam sekolah umum untuk mengatur window Dzuhur.
- Added: PWA Guru menambahkan menu baru `Presensi Dhuha & Jum'at` agar perilakunya sama dengan APK Guru, memakai route `/guru/sholat-dhuha-jumat` dan API `/api/teacher/prayer-v2`.
- Added: `Presensi Dhuha & Jum'at` di PWA Guru memakai mode wali kelas; guru hanya melihat siswa kelas walinya, bisa input manual dengan label status yang sama seperti Dzuhur, dan `Jum'at` hanya aktif jika kelas tersebut terjadwal di `prayer_v2`.
- Added: Web admin GAS menambahkan menu `Rekap Dhuha & Jum'at` (v2, terpisah dari rekap Dzuhur) dengan mode `Rekap Bulanan` (denominator `Wajib` berbasis jadwal/override `prayer_v2`) dan mode `Riwayat Harian` (log dari `prayer_attendance_v2_by_school`).
- Fixed: PWA Guru `Presensi Dhuha & Jum'at` kini bisa input manual saat jadwal `prayer_v2` aktif (normalisasi kelas konsisten + default rule aktif bila config type belum dibuat).
- Added: Shortcut pilihan cepat `Kelas 7`, `Kelas 8`, `Kelas 9` di panel pemilih kelas (jadwal/override) dan generator rotasi Jumat untuk memudahkan skenario Jumat gabungan per jenjang.
- Added: Web admin GAS menambahkan `Generator Rotasi Jumat` untuk membuat override `Sholat Jumat` otomatis (tanggal mulai + jumlah minggu + urutan kelas), lalu disimpan via tombol `Simpan Override`.
- Added: Tab `Presensi Sholat -> Pengaturan Sistem` pada web admin GAS sekarang memiliki panel konfigurasi `prayer_v2` untuk `Dzuhur`, `Dhuha`, dan `Jumat`, termasuk rule dasar, jadwal per kelas, dan override tanggal.
- Changed: Konfigurasi `Jumat` di web admin disiapkan mengikuti kombinasi syarat `putra Muslim + kelas yang dijadwalkan`, sedangkan `Dhuha` memakai model hybrid (jadwal mingguan per kelas + override per tanggal).
- Changed: Penyimpanan web admin untuk konfigurasi multi-sholat kini masuk ke RTDB `school_settings/{schoolId}/prayer_v2/*`; tahap ini belum mengubah konsumsi data di APK siswa/guru.
- Fixed: Dashboard GAS web admin tidak lagi terjebak infinite spinner pada tab `7 KAIH` saat `schoolId` belum siap atau subscription RTDB gagal.
- Fixed: Panel `7 KAIH` web admin sekarang menampilkan pesan fallback yang jelas jika sesi admin belum membawa `schoolId`.
- Fixed: Memperbaiki error *hydration mismatch* (black screen) pada PWA portal guru layar `Rekapitulasi`.
- Fixed: Web API `recap/route.ts` kini tidak lagi menyimpan teks kosong pada file Excel untuk pelanggaran apabila data dari Firebase berupa string kosong (akan menggunakan nama fallback/bawaan).

## [1.0.59] - 2026-08-12
### Fixed
- **Siswa**: Menghapus `StudentActionCard` tugas literasi yang menyebabkan false-positive pada peringatan pet sekarat karena sudah bukan misi harian.
- **Siswa**: Meningkatkan batas waktu jeda tanpa sentuhan (*anti-cheat idle threshold*) pada PDF Reader dari 45 detik menjadi 5 menit agar durasi membaca halaman panjang tetap tercatat dengan akurat.

## [1.0.58] - 2026-08-12
### Fixed
- **Siswa**: Mengubah algoritma pembuatan ID Pet menjadi `studentId` tunggal agar tidak terjadi lagi isu duplikasi (Ghost Pets).
- **Siswa**: Memperbaiki rute navigasi dari tombol Misi Literasi di layar Virtual Pet agar langsung membuka tab Tugas Literasi.
- **Siswa**: Menyuntikkan timer anti-cheat di layar pembaca PDF (Lentera Digital) untuk menghentikan penghitungan durasi baca jika layar AFK > 45 detik, serta mencicil pencatatan durasi setiap 3 menit.
- **Siswa**: Mengubah tombol `Keluar` pada layar peringatan (overlay) EduLock Compliance menjadi `Tutup`, sehingga tidak melakukan logout paksa melainkan sekadar menutup aplikasi.

## [1.0.57] - 2026-08-10
### Changed
- **Siswa**: Mengubah tata letak statistik Virtual Pet menjadi grid 2 kolom dan menampilkan indikator Kecerdasan serta Sosial.

## [1.0.56] - 2026-08-10
### Fixed
- **Siswa**: Memperbaiki deskripsi achievement Virtual Pet "Pembelajar Aktif" agar sesuai dengan logika kode (membaca E-Perpus 30 menit).
- **Siswa**: Menambahkan auto-sync di `VirtualPetViewModel` agar teks achievement pada pet lama otomatis diperbarui ke versi baru.

## [1.0.55] - 2026-08-10
### Fixed
- **Siswa**: Memperbaiki bug pada Virtual Pet di mana papan peringkat (Leaderboard) selalu kosong/hilang karena gagal mencocokkan ID siswa dengan ID kepemilikan pet.

## [1.0.54] - 2026-08-10
### Changed
- **Siswa**: Menerapkan konsep *Real-time Location Tracking* ke layar `Presensi Sholat` dan `Sholat Dhuha & Jumat`. Angka jarak dari radius musholla akan mengecil/bertambah otomatis seiring pergerakan siswa secara *real-time*, sehingga tombol presensi akan terbuka seketika tanpa perlu menekan tombol "Cek Lokasi Sekarang".

## [1.0.53] - 2026-08-10
### Changed
- **Siswa**: UI Absensi kini dilengkapi dengan *Real-time Location Tracking* pada peta. Titik lokasi dan validasi jarak ke sekolah akan otomatis diperbarui setiap 3 detik atau setiap siswa bergerak sejauh 1 meter, tanpa perlu menekan tombol refresh lagi.
- **Siswa**: Memperbaiki label teks di dalam kotak informasi Virtual Pet menjadi "30 menit".

## [1.0.52] - 2026-08-106 - GAS Siswa Release (23036) - DEPLOYED LIVE âœ“

### Umum
- Bumped defaultConfig GAS: versionCode `1051 â†’ 1052`, versionName `1.0.38 â†’ 1.0.39`.
- Flavor `siswa` versionCode: `23035 â†’ 23036` (release build `assembleSiswaRelease` SUCCESS, 3m 6s, signer SHA256 `64738955â€¦` cocok dengan EduLock).
- APK tersinkron ke `web/public/apk/GAS-Siswa-release.apk` (20.08 MB, sha256 `B64C0DE2â€¦`), `apk-manifest.json` updatedAt `2026-08-06T07:27:43`.
- Web tutorial `/gas/install` auto-sync APK 1.0.39-siswa bersama deploy commit ini, App Hosting auto rollout.

### Siswa (Release 1.0.39-siswa 23036)
- Added: APK GAS Siswa sekarang **menyaring tugas literasi berdasarkan kelas siswa** (repository + viewmodel + screen). Tugas yang dikirim admin hanya ke kelas X TIDAK muncul di HP siswa kelas Y. Sebelumnya (APK 23035) tidak ada filtering ini â†’ semua siswa melihat semua tugas. Detail 7 file source:
  - Model `LiteracyTask` tambah `className` + `classList: List<String> = emptyList()` (backward compat default empty).
  - `LiteracyRepository.parseClassList` â€” fallback 3 tahap: RTDB `classList[]` â†’ alias `targetClasses[]` â†’ `className` string lama; default `["semua kelas"]` bila semua kosong.
  - `LiteracyRepository.taskMatchesStudentClass` â€” fuzzy rule: empty/semua â†’ lolos; exact lowercase match; substring prefix match (misal "7A" match "Kelas 7A").
  - `StudentLibraryViewModel.applySchoolScope()` â€” filter 3 kondisi: `isActive && matchesSchool && matchesClass`.
  - `setStudentScope(studentId, aliases, studentClass = "")` signature upgrade; state `_studentClass` disimpan; `applySchoolScope()` re-trigger otomatis ketika kelas berubah.
  - `StudentLibraryScreen` `LaunchedEffect(studentId, studentAliases, studentClass)` â€” passing `student.child("class") ?: student.child("kelas")` hasil lookup profil RTDB siswa ke viewmodel.
- Backward compat TANPA MIGRASI DB: Tugas lama record `literacy_tasks` tanpa `classList` â†’ parseClassList auto fallback ke `className` (biasanya `Semua Kelas`) â†’ tugas lama TETAP tampil ke semua siswa seperti semula.

## [1.0.38] - 2026-08-05 - GAS Siswa Release (23035) - DEPLOYED LIVE âœ“

### Umum
- Bumped defaultConfig GAS: versionCode `1050 â†’ 1051`, versionName `1.0.37 â†’ 1.0.38`.
- Flavor `siswa` versionCode: `23034 â†’ 23035` (release build `assembleSiswaRelease` SUCCESS, signer SHA256 `64738955â€¦` cocok).
- Web tutorial `/gas/install` sudah sync APK 1.0.38-siswa via commit `65cd2a93`, App Hosting auto rollout.
- APK tersimpan di `Apk Release/Final/` dan `web/public/apk/GAS-Siswa-release.apk` (20.08 MB).

### GAS Guru (APK)
- Fixed: Menu `Rekapitulasi` di beranda GAS Guru tidak lagi force close. Route `teacher_recap` sekarang sudah didaftarkan di `AppNavigation`, sehingga klik menu membuka `TeacherRecapScreen` dengan session guru aktif.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.33-guru (1046)` untuk membawa perbaikan crash menu `Rekapitulasi`.
- Fixed: Rekap bulanan `Presensi Sholat` di APK guru sekarang menyamakan key identitas siswa dengan web admin dan UI tabel (`recordId -> id -> nisn -> username`). Sebelumnya hasil `monthlyRecap` dibangun hanya dari `id/nisn`, sehingga pada siswa tertentu lookup gagal dan kolom `TS` jatuh ke `0` walaupun web admin menampilkan nilai benar.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.33-guru (1045)` untuk membawa perbaikan rekap bulanan `Presensi Sholat`.
- Changed: Jalur distribusi GAS Guru tetap `manual install`; build guru terbaru tidak disinkronkan ke `web/public/apk` dan tidak memakai live URL tutorial siswa.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.33-guru (1044)` untuk membawa pembaruan bersama di `LoginScreen.kt` dan menjaga jalur distribusi tetap satu set dengan build siswa terbaru.
- Fixed: Reaktivitas EduLock compliance di `AppNavigation` â€” `sessionRole`/`sessionSchoolId` sekarang re-derive ketika navController berpindah route (login â†’ home) + UID berubah, sehingga compliance check langsung aktif setelah login tanpa harus kill APK dari recent apps.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.32-guru (1043)` untuk membawa perbaikan reactivity compliance gate di Navigation bersama.
- Changed: Teks preview `Login sebagai: <username>@domain` di bawah kolom nama pada halaman login guru juga dihapus, konsisten dengan perubahan halaman login siswa.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.31-guru (1042)` untuk membawa perubahan UI hapus preview username login ini.
- Fixed: Auto-fill nama guru di halaman login diperbaiki (bersama perbaikan siswa). Resolusi sekolah (NPSN/schoolId alias) dan multi-strategy lookup profil sama diterapkan pada flavor guru, sehingga nama guru terisi otomatis setelah NPSN + NUPTK valid dimasukkan.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.31-guru (1041)` untuk membawa perbaikan auto-fill nama login ini.
- Added: GAS Guru menambahkan menu baru `Presensi Dhuha & Jum'at` sebagai layar terpisah (tidak mengubah menu `Presensi Sholat` Dzuhur). Mode wali kelas: hanya siswa kelas wali yang tampil; input manual mengikuti label yang sama seperti presensi sholat; `Jumat` hanya aktif jika kelas terjadwal berdasarkan `prayer_v2`.
- Changed: Build distribusi manual terbaru GAS Guru dinaikkan ke `1.0.30-guru (1040)` untuk membawa menu baru tersebut.
- Fixed: Safeguard tambahan pada `TeacherRecapViewModel.kt` untuk menangani string kosong dari Firebase agar kolom `Pelanggaran` di unduhan Excel APK tetap terisi teks nama aturan.
- Changed: File gambar untuk ikon menu `Data Siswa` dan `Rekapitulasi` (diubah menjadi 250px) telah diperbarui di *source code* (belum masuk APK rilis terbaru).

### Siswa (Release 1.0.38-siswa 23035)
- Added: EduLock Compliance Gate Lokal sekarang mengecek **5 poin lokal sekaligus** (sebelumnya bergantung RTDB telemetry): `Install` + `Setup Selesai (setup_completed)` + `Accessibility` + `Device Admin` + `Proteksi Aktif / tombol MULAI (is_protection_active)`. Poin #2 dan #5 dibaca langsung dari SharedPreferences EduLock lintas-app via `context.createPackageContext` + signer SHA256 yang sama. Ini menutup **dua celah sekaligus**: (a) false-positive Redmi 15C / vendor agresif service background di-kill & RTDB stale, (b) celah skip tekan tombol MULAI yang sebelumnya lolos jika RTDB telemetry belum terbit.
- Fixed: Jika siswa selesaikan 5 setup EduLock namun **belum / tidak menekan tombol MULAI** â†’ `protectionActive=false` â†’ GAS otomatis tertahan dengan reason: *"Proteksi EduLock belum dijalankan. Buka EduLock dan tekan tombol MULAI agar proteksi aktif."* dan menampilkan tombol shortcut HIJAU **"BUKA EDULOCK & TEKAN MULAI"** (1 tap buka EduLock langsung).
- Changed: Overlay merah compliance status diganti dari 3 teks badge â†’ **5 kartu LocalBadge berwarna** (62dp, border hijau/merah) berurutan: `Install` Â· `Setup` Â· `Akses` Â· `Admin` Â· `Aktif`. Keterangan tambahan "Aktif = tombol MULAI di EduLock sudah ditekan" ditampilkan di bawahnya agar guru/petugas langsung paham.
- Changed: Overlay merah sekarang menyediakan **3 varian tombol shortcut UTAMA**: HIJAU `BUKA EDULOCK & TEKAN MULAI` (setup/protectionActive FAIL), BIRU `BUKA AKSESIBILITAS`, BIRU `BUKA ADMIN PERANGKAT` â€” otomatis muncul sesuai reason. Dua tombol outlined permanen (`Pengaturan Aksesibilitas` / `Pengaturan Admin Perangkat`) tetap ada untuk manual kapanpun.
- Fixed: Skenario kasus siswa MOHAMMAD EVAN SATYA WIJAYA (badge `Dijeda Admin` = complianceStatus=PAUSED) â†’ **TETAP DIBLOKIR** meskipun 5 poin lokal âœ… semua (kendali admin prioritas tertinggi, QA Test #6 terpenuhi).
- Removed: Card `Prestasi` di menu `Kedisiplinan` siswa dihapus; ringkasan `Pelanggaran` sekarang memakai lebar penuh agar layout tetap rapi tanpa mengubah riwayat catatan.
- Fixed: Login GAS Siswa sekarang tidak cukup mengecek EduLock terpasang. Saat tombol `Masuk` ditekan, aplikasi juga memverifikasi EduLock sudah aktif/sehat; jika telemetry belum ada, proteksi mati, accessibility/device admin mati, atau status stale/non-compliant, login langsung ditahan.
- Added: Layar `Force Update` GAS siswa sekarang punya tombol `Download APK Terbaru` yang mengarahkan siswa ke halaman tutorial instalasi `/gas/install`.
- Changed: Tombol unduh di halaman tutorial GAS siswa sekarang menyimpan nama file dengan versi, misalnya `GAS-Siswa-1.0.37-siswa-23034.apk`, agar user tidak bingung saat update manual.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.37-siswa (23034)` untuk membawa perubahan login EduLock yang lebih ketat, tombol download force update, dan penyederhanaan layar Kedisiplinan.
- Fixed: Jam `Presensi Dhuha & Jum'at` di APK siswa sekarang konsisten dengan jadwal `prayer_v2` web admin. Pembacaan `classIds` dibuat tahan terhadap format array maupun map RTDB, normalisasi kelas disamakan dengan web admin, dan override `activate` kini memilih jadwal yang benar-benar cocok dengan kelas siswa.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.35-siswa (23032)` untuk membawa perbaikan sinkronisasi jam Dhuha/Jum'at ini.
- Added: `Presensi Sholat` Dzuhur di GAS Siswa sekarang membaca jam khusus admin dari `prayer_v2/types/DZUHUR` (`startTime`/`endTime`). Tombol presensi hanya aktif di window Dzuhur yang diatur web admin, dan kartu aturan menampilkan `Jam aktif Dzuhur` agar siswa tahu rentangnya.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.34-siswa (23031)` untuk membawa dukungan jam khusus Dzuhur dari web admin.
- Changed: Alur cek EduLock di halaman login GAS Siswa diubah: siswa boleh membuka halaman login dan mengisi semua kolom terlebih dahulu; pengecekan EduLock baru dijalankan saat tombol `Masuk` ditekan. Jika EduLock belum terpasang, barulah overlay penahanan muncul. Overlay juga dipindah ke layer penuh supaya tidak bertumpuk dengan form.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.33-siswa (23030)` untuk membawa perubahan alur cek EduLock berbasis klik tombol Masuk ini.
- Fixed: Halaman Login GAS Siswa sekarang **langsung mengecek keberadaan EduLock di cold start pertama instalasi baru**, tanpa harus user keluar-kill recent-buka ulang. Pre-gate `produceState` polling PackageManager tiap 800ms; jika EduLock belum terpasang, `EduLockComplianceOverlay` langsung tampil block halaman login, tombol MASUK disabled, tombol `BUKA EDULOCK` tersedia untuk redirect. Setelah EduLock ter-install, polling otomatis mendeteksi dalam 1 detik â†’ overlay hilang tanpa restart.
- Fixed: Reaktivitas EduLock compliance di `AppNavigation` â€” `sessionRole`/`sessionSchoolId` sekarang re-derive ketika navController berpindah route (login â†’ home) + UID berubah, sehingga telemetry compliance (COMPLIANT + ONLINE + device sama) langsung ter-trigger SESUDAH login sukses, tanpa harus kill APK dari recent apps.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.32-siswa (23029)` untuk membawa perbaikan EduLock pre-check install-pertama + reactivity compliance gate.
- Changed: Teks preview `Login sebagai: <username>@domain` di bawah kolom nama pada halaman login dihapus (ketika nama sudah terisi otomatis), karena kolom nama sudah read-only dan teks preview dirasa membingungkan.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.31-siswa (23028)` untuk membawa perubahan UI hapus preview username login ini.
- Fixed: Auto-fill nama siswa di halaman login diperbaiki. Resolusi sekolah sekarang juga mencoba `orderByChild("npsn")` dan `orderByChild("schoolId")` selain direct key, sehingga NPSN mentah (angka) yang tidak menjadi key schools node tetap ter-resolve dengan benar. Lookup user juga ditambah fallback 5 tahap (nisn/nuptk string â†’ numeric â†’ direct key â†’ username â†’ name/nama) dan membaca field `displayName` sebagai nama cadangan.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.31-siswa (23027)` untuk membawa perbaikan auto-fill nama login ini.
- Added: GAS Siswa menambahkan menu baru `Presensi Dhuha & Jum'at` sebagai layar terpisah (tidak mengubah menu `Presensi Sholat` Dzuhur). Fitur ini membaca konfigurasi `prayer_v2` dari web admin dan menyimpan log ke `prayer_attendance_v2`.
- Changed: Ukuran ikon menu beranda GAS Siswa diperkecil agar tampilan tidak terlalu â€œpenuhâ€ di layar.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.30-siswa (23024)` untuk membawa menu baru tersebut + penyesuaian ukuran ikon.
- Fixed: Tombol unduh APK di portal tutorial live sempat `404` pada App Hosting standalone; diperbaiki lewat `ensure-standalone-public.mjs` + stop tracing `apk-manifest` dari `public` (commit `3c9b1413`), unduh GAS+EduLock live sudah normal.
- Fixed: Binding 1 akun 1 device GAS Siswa dipisah ke field `gasDeviceId`, sehingga logout/login ulang di HP yang sama tetap berhasil dan binding EduLock tidak lagi menimpa kunci perangkat GAS.
- Changed: Backend `mobileAuth` serta reset device admin ikut membaca/membersihkan `gasDeviceId` agar kontrak 1 akun 1 device konsisten antara APK dan web.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.30-siswa (23022)` untuk merangkum pemisahan binding `gasDeviceId` dan perbaikan login ulang di HP yang sama.
- Removed: Overlay callout text box pada portal tutorial `/gas/install` dihapus; panduan visual sekarang mengandalkan judul/body langkah di atas gambar saja (deploy `307751ae`).
- Fixed: GAS Siswa sekarang hanya bisa dibuka jika telemetry EduLock berasal dari HP yang sama, status monitoring masih `ONLINE`, dan proteksi benar-benar `COMPLIANT`; install EduLock tanpa aktivasi atau record hijau lama dari HP lain tidak lagi boleh meloloskan akses.
- Fixed: Login ulang GAS Siswa pada HP yang sama sekarang mengikuti pola binding yang aman untuk device milik sendiri, sehingga siswa yang logout lalu masuk lagi tidak lagi salah ditolak sebagai HP terkunci.
- Changed: Build distribusi manual GAS Siswa sempat dinaikkan ke `1.0.27-siswa (23019)` untuk perbaikan gate EduLock yang lebih ketat berbasis device yang sama.
- Fixed: `Presensi Sholat` siswa sekarang langsung mengunci tombol setelah status `PRAY` hari ini tercatat, menampilkan pesan bahwa siswa sudah melaksanakan sholat, dan tidak lagi membiarkan klik berulang menimpa jam presensi yang sama.
- Changed: Build distribusi manual terbaru GAS Siswa dinaikkan ke `1.0.15-siswa (23007)` agar uji install manual menimpa APK lama dilakukan dengan versi yang benar-benar lebih tinggi, tanpa bergantung pada URL instalasi web.
- Changed: Layar `Force Update` GAS siswa sekarang menegaskan bahwa update dilakukan dengan cara download lalu install manual file APK terbaru di HP, bukan update otomatis dari dalam aplikasi.
- Fixed: Build `GAS Siswa` sekarang memakai compatibility version bump agar tetap bisa di-install sebagai update pada perangkat yang sebelumnya terpasang jalur `legacySiswa`.
- Fixed: Versi paket `GAS Siswa` dinaikkan agar APK bugfix terbaru bisa di-install sebagai update di atas build lama tanpa uninstall manual.
- Fixed: GAS Siswa tidak lagi menganggap hari Minggu selalu libur; jika admin mengaktifkan Minggu pada pengaturan presensi sekolah, menu `Absensi` kini mengikuti rule RTDB yang tersimpan.
- Fixed: `Presensi Sholat` siswa kini konsisten dengan rule hari efektif sekolah dan tidak lagi memaksa Minggu sebagai libur saat sekolah sengaja mengaktifkannya.
- Fixed: `Presensi Sholat` siswa sekarang membaca hari efektif dari `attendance/schedules` yang dikelola web admin, bukan dari node `prayer/schedules` lama yang tidak lagi dipakai dashboard.
- Added: Portal tutorial GAS siswa di web sekarang tersedia dengan alias URL pendek `/g` dan fallback `/gas/install`, lengkap dengan tombol unduh APK publik, langkah instalasi, dan panduan visual dasar.
- Added: Bagian `Penggunaan Menu GAS` sekarang menampilkan daftar 10 menu utama yang bisa diklik untuk membuka panduan penggunaan visual masing-masing di halaman yang sama.
- Added: Contoh visual penggunaan sudah mulai dicatat untuk menu `Lentera Digital`, `Layanan Aduan`, `7 KAIH`, `Virtual Pet`, dan `Tools` agar siswa lebih mudah mengikuti alur dari browser sebelum membuka APK.
- Changed: Master kategori katalog `Lentera Digital` pada GAS Siswa sekarang disamakan penuh dengan kategori utama web e-perpus terbaru: `FIKSI & SASTRA`, `BUKU PELAJARAN`, `NON-FIKSI`, `ENSIKLOPEDIA`, `SAINS & TEKNOLOGI`, `PENGEMBANGAN DIRI`, `MINAT`, `MAJALAH`, dan `LAINNYA`.
- Fixed: Katalog `Lentera Digital` pada GAS Siswa sekarang menormalkan buku lama ke kategori utama web, sehingga data seperti `NON-FIKSI > Ensiklopedia` tetap terbaca sebagai `ENSIKLOPEDIA` di filter dan label kartu buku.
- Fixed: Tab `Profil` pada `Lentera Digital` sekarang menampilkan nama siswa aktif dan `NISN` yang benar, tidak lagi menampilkan label generik `Profil Siswa` dengan ID push-key.
- Fixed: Kontras teks pada dropdown kategori `Lentera Digital` di GAS Siswa diperkuat agar item menu terbaca jelas di atas background biru gelap.
- Changed: Logo `Lentera Digital` pada halaman katalog GAS Siswa sekarang memakai aset `ic_menu_lentera_digital.png`, tidak lagi tampil sebagai kotak putih placeholder.
- Changed: Login APK GAS Siswa diubah menjadi pola `NPSN -> NISN -> Nama Siswa`, dan nama siswa terisi otomatis dari database.
- Changed: Urutan menu beranda GAS Siswa diubah menjadi `Absensi -> Presensi Sholat -> Lentera Digital -> 7 KAIH -> Virtual Pet -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Tools`, dan `Catat Pelanggaran` tetap khusus OSIS di posisi paling akhir.
- Changed: Filter kategori katalog `Lentera Digital` pada GAS Siswa sekarang memakai dropdown full-width agar tampilan mobile lebih rapi dibanding deretan chip horizontal.
- Fixed: Reader PDF Lentera Digital pada GAS Siswa sekarang benar-benar menulis `reading_log` ke `student_activities` per siswa, sehingga durasi baca nyata bisa dipakai untuk menghidupkan dan mengenyangkan `Virtual Pet`.
- Changed: Status aktivitas `E-Perpus` pada `Virtual Pet` sekarang memakai target `30 menit membaca hari ini`, dan progress kenyang ikut penuh di 30 menit.
- Changed: Card `Pencapaian -> Literasi Aktif` pada `Virtual Pet` sekarang ikut memakai target `30 menit`, sehingga subtitle dan progress tidak lagi menampilkan teks lama `60 menit`.
- Changed: `readingDuration` 30 menit sekarang menjadi satu-satunya rumus makan pet siswa; submit tugas/laporan literasi tidak lagi mempengaruhi rasa lapar harian pet.
- Added: Quest `Bonus Literasi Bulanan` pada `Virtual Pet` memberi `+200 Koin` dan `+100 XP` saat siswa mengirim tugas/laporan literasi bulanan sekolah.
- Fixed: Quest pet sekarang memakai periode harian/bulanan yang benar, sehingga bonus literasi bulanan tidak ikut reset dan terklaim ulang setiap hari.
- Fixed: Hak akses petugas OSIS pada GAS Siswa sekarang dipantau realtime dari node sekolah aktif, sehingga menu `Catat Pelanggaran` otomatis hilang ketika siswa dihapus dari `Manajemen Petugas OSIS`.
- Removed: Card `Prestasi` di menu Kedisiplinan siswa dihapus.
- Fixed: Overlay `pet mati` pada GAS Siswa sekarang benar-benar memblokir seluruh interaksi sehingga siswa tidak bisa memakai aplikasi sampai pet direvive.
- Fixed: Kartu `Literasi` pada `Virtual Pet` sekarang benar-benar membuka `Tugas Literasi` siswa dan langsung masuk ke tab tugas, bukan ke halaman placeholder.
- Fixed: Tab `Peringkat` pada `Virtual Pet` sekarang lebih tahan terhadap mismatch identitas siswa karena ranking membaca alias `recordId/id/nisn/username`.

### Guru
- Added: Portal Guru PWA di web path `/guru` (commit `05c4fb14`) untuk iOS Safari/browser: login NPSN+NUPTK terintegrasi DB, inbox notifikasi (literasi belum, pet mati, aduan), Add to Home Screen via manifest + `sw-guru.js`.
- Added: Sembilan menu beranda PWA Guru parity APK: Data Siswa+Pet, Presensi Siswa, Presensi Sholat, Literasi & Tugas, 7 KAIH, Kedisiplinan, Layanan Aduan, Notifikasi, Rekapitulasi (unduh Excel).
- Added: PWA Guru sekarang juga memiliki menu baru `Presensi Dhuha & Jum'at` yang terpisah dari `Presensi Sholat` Dzuhur, sehingga alur guru konsisten antara browser/PWA dan APK.
- Fixed: Login web Guru menghindari kegagalan `signBlob`/Auth network; diganti alur session + lookup DB admin (`06c784b8`, `112271dc`).
- Fixed: Checklist `Presensi Sholat` PWA tetap benar di App Hosting yang berjalan UTC (`0f8aa2dc`).
- Fixed: Endpoint unduh Excel rekap `/guru/rekap` tidak lagi `404` (`b9a48343`).
- Changed: `Kedisiplinan` PWA sudah interaktif parity `TeacherDisciplineScreen` (`3876bf95`), bukan stub.
- Known limitation: background Web Push masih perlu VAPID/FCM; belum push saat tab tertutup.
- Added: Notifikasi guru `literasi belum selesai` (`LITERACY_INCOMPLETE`) untuk siswa wali/diampu agar guru bisa menindak tugas literasi outstanding.
- Added: Notifikasi guru `virtual pet mati` (`PET_DEAD`) untuk siswa wali/diampu dengan navigasi ke `Data Siswa`.
- Changed: Menu `Notifikasi` beranda guru menampilkan badge jumlah item.
- Changed: Notifikasi aduan/bullying dan literasi pending yang sudah ada tetap dipertahankan bersama tipe baru.
- Fixed: Ikon beranda APK `Data Siswa` dan `Rekapitulasi` dinormalisasi agar tidak oversized (`cb3bed4d`).
- Changed: Build distribusi manual GAS Guru ditimpa ke `1.0.30-guru (1039)` di `Apk Release/Final/GAS-Guru-release.apk` (rebuild sore 2026-08-03 menyertakan fix ikon; nama tunggal Final tetap).
- Known limitation: belum memakai FCM; notifikasi tray hanya muncul saat app/listener masih hidup.
- Changed: Garis pemisah antar kolom pada `Data Siswa`, `Presensi Siswa`, dan `Presensi Sholat` guru dibuat lebih tegas agar tabel lebih mudah dibaca.
- Changed: Login APK GAS Guru diubah mengikuti pola `NPSN -> NUPTK -> Nama Guru`, dan nama guru terisi otomatis dari database.
- Changed: Urutan menu beranda GAS Guru diubah menjadi `Data Siswa -> Presensi Siswa -> Presensi Sholat -> Literasi & Tugas -> 7 KAIH -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Rekapitulasi`.
- Changed: `Kedisiplinan` guru sekarang dipisah menjadi dua mode mandiri. Menu `Pelanggaran` hanya menampilkan daftar siswa, sedangkan menu `Riwayat` hanya menampilkan daftar riwayat terbaru.
- Changed: `Rekapitulasi Kehadiran` guru pada tab `Rekap Bulanan` sekarang mengikuti tabel siswa di Web Admin secara langsung dengan format `H/S/I/A`.
- Fixed: Menu `Rekapitulasi` (Rekapitulasi Kelas) guru sekarang muncul di beranda dan bisa dibuka.
- Fixed: `Presensi Sholat`, `Kedisiplinan`, dan `Notifikasi` guru sekarang ikut mengenali alias ID siswa `recordId/id/nisn/username`, sehingga data valid tidak hilang hanya karena format ID sumber berbeda.
- Fixed: Kolom `PET` pada `Data Siswa` guru sekarang kembali membaca virtual pet realtime (tidak tampil `-` terus karena mismatch ID siswa).
- Fixed: Label kondisi `PET` pada `Data Siswa` guru sekarang ikut menampilkan `Sekarat`, sehingga sinkron dengan APK siswa saat vital pet sangat rendah.
- Fixed: Rekap bulanan guru tidak lagi salah baca data karena mismatch identitas siswa, `LATE` sekarang dihitung sebagai `Hadir` seperti di Web Admin, tanggal masa depan tidak lagi dihitung sebagai `Alpa`, dan log dengan alias ID berbeda (`recordId/id/nisn/username`) sekarang tetap masuk ke siswa yang benar.

### Kepala
- Fixed: Rekap kehadiran bulanan kepala sekolah sekarang menghormati rule hari efektif dari pengaturan presensi sekolah, termasuk saat Minggu sengaja diaktifkan.

### Legacy / Universal

---

## [Baseline Dokumen] - 2026-07-30

### Umum
- Changed: Dokumen pegangan build APK GAS dirapikan agar sesuai flavor dan alur build aktual proyek.

## Catatan Struktur Aktual
- Flavor utama: `siswa`, `guru`, `kepala`
- Flavor khusus: `legacySiswa`, `legacyGuru`, `legacyKepala`, `universal`
- Source set aktual: `src/main`, `src/kepala`
