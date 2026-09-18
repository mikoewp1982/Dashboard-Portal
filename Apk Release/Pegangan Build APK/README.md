# Pegangan Build APK — Mulai di sini

**Baca file ini dulu.** Dokumen lain di folder ini = detail / arsip. Jangan skip gate di bawah sebelum `git push origin main`.

Live Dashboard = isi **`origin/main`** saja. Yang hanya jalan di laptop (belum commit/push) **tidak** muncul di App Hosting.

---

## Pilih jalur kerja

| Mau apa | Buka |
|---------|------|
| **Fitur Sakral & Anti-Regresi** | [FITUR_STABIL_JANGAN_DISENTUH.md](../../FITUR_STABIL_JANGAN_DISENTUH.md) + [AGENTS.md](../../AGENTS.md) |
| Deploy / ubah **web admin** | [PANDUAN_DEPLOY_WEB.md](./PANDUAN_DEPLOY_WEB.md) + **gate push** di bawah |
| Build / ship **GAS** | [GAS/README.md](./GAS/README.md) → [GAS/RELEASE.md](./GAS/RELEASE.md) |
| Build / ship **EduLock** | [Edulock/README.md](./Edulock/README.md) → [Edulock/RELEASE.md](./Edulock/RELEASE.md) |
| Aturan AI / script ship | [# Aturan wajib untuk AI assistant.txt](./%23%20Aturan%20wajib%20untuk%20AI%20assistant.txt) |

---

### ⚠️ CATATAN PENTING TERKAIT UI APK GAS (GARIS BAWAH — JANGAN SAMPAI SALAH LAGI)
> **Insiden 2026-08-28 build 1048→1049→1050**: UI Home **GAS GURU** salah implementasi malah mencontek 100% style **GAS SISWA** (4 kolom kartu kecil + bottom nav 3 tab tombol absen floating tengah). Padahal UI keduanya **SUDAH DITETAPKAN BERBEDA JELAS** oleh user (screenshot HP lawas sebagai bukti).

**Aturan lanjutan yang WAJIB diikuti:**
1. **SEBELUM UBAH UI Home / kartu menu GAS**: Baca section **`PERBEDAAN UI GAS SISWA vs GAS GURU`** di **[GAS/README.md L75-L109](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/README.md#L75-L109)**. Daftar perbedaan 13 area detail, TABEL perbandingan, + langkah kontrol sebelum ship. JANGAN pernah anggap UI siswa = UI guru.
2. **Lihat juga sub-aturan khusus UI GAS** di **[# Aturan wajib untuk AI assistant.txt L14-L43](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/%23%20Aturan%20wajib%20untuk%20AI%20assistant.txt#L14-L43)** — 6 butir mutlak termasuk list 7 titik WAJIB branch `isGuruFlavor`, wajib build 2 flavor sekaligus sebelum ship, dan 3 cek visual cepat sebelum Final copy.
3. **Ringkasan cepat (hapal / cek setiap kali):**
   - **GAS SISWA** = 4 kolom kartu kecil + Bottom Nav 3 tab (Beranda / Absen hitam floating / Profil) WAJIB ADA. Background = gelap.
   - **GAS GURU** = 2 kolom kartu BESAR glassmorphism 2 baris (label di dalam pill transluscent), Bottom Nav 3 tab **HARAM ADA**, Hanya icon Tutup panah kanan di header kanan atas. Background = teal tua → navy makin gelap ke bawah.

---

**Arsip (bukan bacaan harian):** `CHECKLIST_PERUBAHAN_APK_TERKINI.md`, `GAS/BUILD_LOG.md`, `GAS/CHANGELOG.md`, roadmap `.docx`.

---

## WAJIB sebelum `git push origin main`

Kerjakan berurutan. Jika salah satu gagal → **jangan push**.

1. **Jalankan Verifikasi Fitur Sakral (Pre-Build Gate)** — jika menyentuh `web/`:
   ```powershell
   cd "D:\Dashboard Portal\web"
   node ./scripts/verify-critical-rules.mjs
   ```
   *Skrip otomatis menggagalkan push jika ada rumus fitur stabil (Pet Revive, FCM TTL, dll.) yang terlanggar.*
2. **Audit Scope File (`git diff --stat`)**: Pastikan HANYA file terkait tugas yang disentuh. Revert file yang tidak diminta (`git checkout -- <file>`).
3. **Kerjaan Anda sudah di-commit** — jangan biarkan fitur penting hanya di working tree.
4. `git status` bersih untuk file yang tidak relevan; **jangan** `git add web/` atau `git add .` buta.
   - Jangan push: `debug-*` API, script `check-*` / `delete_*` sekali pakai, `web/Apk Release/`, APK di dalam `web/docs/`.
5. `git pull origin main` (atau rebase) dulu supaya tidak menimpa commit orang lain / fitur lama.
6. **Jangan force-push** ke `main` / `master`.
7. Bandingkan **lokal vs live** untuk menu kritis di bawah (minimal smoke).
8. Setelah push: tunggu App Hosting **hijau**, lalu hard-refresh live.

Deploy web = push dari root repo `D:\Dashboard Portal` ke `origin/main`.  
Manual rollout di Firebase Console **tidak** mengambil perubahan yang belum ada di GitHub.

---

## Cegah fitur web admin “hilang” lagi

Ini penyebab paling sering, dan cara menghindarinya:

| Penyebab | Cara aman |
|----------|-----------|
| Fitur hanya di laptop, belum commit/push | Setelah fitur stabil: **commit segera**, lalu push saat siap deploy |
| Push dari salinan `main` yang ketinggalan | Selalu `git pull origin main` **sebelum** mulai edit & sebelum push |
| `git add web/` / `git add .` ikut menimpa file lain | Stage **path file spesifik** saja |
| AI/refactor menghapus menu tanpa sadar | Setelah ubah sidebar/workspace: cek daftar menu di checklist di bawah |
| Mengotak-atik fitur stabil tanpa sadar (Regresi) | Wajib patuhi [FITUR_STABIL_JANGAN_DISENTUH.md](../../FITUR_STABIL_JANGAN_DISENTUH.md) & lolos uji `verify-critical-rules.mjs` |
| Force-push / rewrite history | **Dilarang** ke `main` |
| Rollout Console tanpa commit di GitHub | Tidak akan membawa perubahan lokal |

**Aturan praktis:**

1. Satu fitur web = satu (atau beberapa) commit jelas di `main`, jangan menumpuk berhari-hari di working tree.
2. Sebelum push yang menyentuh `GasSidebar`, `GasWorkspace`, `gasConfig`, atau panel Presensi/Rekap: buka live **dan** lokal, pastikan menu kritis masih ada.
3. Jangan “membersihkan” folder dengan menghapus panel/menu yang tidak Anda kerjakan di sesi itu.
4. Jika `git pull` memunculkan konflik di file menu: **selesaikan konflik dulu**, jangan buang sisi yang berisi fitur lama.
5. **HARAM MENGUBAH CORE SAKRAL**: Baca [FITUR_STABIL_JANGAN_DISENTUH.md](../../FITUR_STABIL_JANGAN_DISENTUH.md) sebelum coding. Logika Pet Revive, FCM TTL 24 jam, dan pemisahan UI Siswa/Guru sudah diproteksi pre-build gate.

---

## Peta menu Presensi (jangan disatukan lagi sembarangan)

| Menu admin | Isi yang benar |
|------------|----------------|
| **Presensi Sekolah** | Pengaturan sistem saja (jadwal/libur/lokasi). Rekap ada di **Rekap Kehadiran**. |
| **Rekap Kehadiran** | Tab: Rekap Bulanan → **Rekap Mingguan** → Riwayat Harian → **Statistik** |
| **Presensi Sholat** | Pengaturan sistem saja (jadwal sekolah sholat, musholla, **Jadwal Sholat Per Kelas**, override). |
| **Rekap Sholat** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik** (Dzuhur / sholat harian sekolah). |
| **Rekap Dhuha & Jum'at** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik**. Wajib dihitung dari **Jadwal Sholat Per Kelas** (+ override), **bukan** jadwal Dzuhur harian. |

**APK Siswa (kontrak baca, update 2026-08-27):**

| Menu HP | Sumber web admin | Bukan dari |
|---------|------------------|------------|
| **Presensi Sholat** (Dzuhur) kartu Aturan Hari | **Hari efektif** = Presensi Sekolah (`attendance/schedules`); **Tanggal merah** = libur tanggal; **Aturan sholat** = Dzuhur `prayer_v2` | `prayer/schedules` warisan |
| **Presensi Dhuha & Jum'at** | `prayer_v2` jenis + **Jadwal Sholat Per Kelas** + **Override Tanggal** | kalender Dzuhur / hari efektif Presensi Sekolah |

Baris **Jam** Dhuha/Jumat di APK **statis** (sengaja tampil dari jadwal kelas, termasuk saat status Tidak dijadwalkan). Status wajib vs tombol presensi yang mengikuti hari/kelas/override.

CRUD literasi = di **GAS** (bukan Lentera “Kelola Literasi”). Lentera **Katalog Buku** = baca saja dari project e-perpus.

---

## Checklist regresi singkat (web admin)

Centang sebelum push jika Anda menyentuh `web/` atau area terkait:

- [ ] **Manajemen Siswa** — kolom DEVICE GAS & DEVICE EDULOCK + Reset GAS / Reset EduLock (bukan satu DEVICE HASH lama)
- [ ] **Presensi Sekolah** — settings-only + tautan ke Rekap Kehadiran
- [ ] **Rekap Kehadiran** — empat tab (Bulanan / Mingguan / Harian / Statistik) masih ada
- [ ] **Presensi Sholat** — Jadwal Per Kelas (jam mulai/selesai) + Override Tanggal (rotasi Jumat = tanggal/kelas saja); settings-only
- [ ] **Rekap Sholat** — tiga tab termasuk Statistik
- [ ] **Rekap Dhuha & Jum'at** — menu Monitoring masih ada + tiga tab; % wajib mengikuti jadwal per kelas
- [ ] **Monitoring Virtual Pet** — Total Pets Aktif ≈ siswa yang punya pet terhubung (bukan hitung pet siluman/orphan)
- [ ] **Unduhan APK** — `/gas/install` (dan EduLock bila diubah) menunjuk versi Final yang disepakati.
  - **GAS Siswa build terbaru (🟡 MENUNGGU UJI USER — BELUM PROMOSI ALIAS)** = **1.0.128-siswa (23125) DZUHUR-TIMEWINDOW-FIX** rebuild **2026-09-15 23:18** (CUMULATIVE: termasuk PET-OFFLINE-FIX 22:46 + MUSHOLLA-REALTIME-FIX 22:04). Fokus: fix **Presensi Sholat Dzuhur masih bisa dilakukan setelah jam 15.00** (laporan user; harusnya ditutup + ada keterangan). Akar masalah: student app tidak punya aturan jam sama sekali — `startTime`/`endTime` web admin (`school_settings/{school}/prayer_v2/types/DZUHUR`) tidak pernah dibaca aplikasi. Fix: aplikasi membaca `startTime`/`endTime` RTDB; **`endTime` kosong → fallback tutup pukul 15.00**; lewat batas → tombol mati + kartu merah "Presensi Sholat Dzuhur sudah ditutup. Batas presensi pukul 15.00." + baris "Jam presensi" di kartu Aturan Hari; guard re-check saat submit (jalur offline ikut diblokir); ticker 30 dtk. **Catatan: bila web admin pernah simpan `endTime` Dzuhur ≠ 15:00 (default web 11:30–13:30), nilai itu yang dipakai — samakan di panel Pengaturan Prayer.** File versioned: `Apk Release/Final_V2/GAS/GAS-Siswa-1.0.128-siswa-23125-DZUHUR-TIMEWINDOW-FIX-release.apk` SHA `F1417825AFCAA52887F282FF5FAC278AC0AFDD52EAC3FE6B144F5A9F84EBB0F2` (22,362,255 bytes) + sidecar `.sha256`. **Install file INI untuk uji ketiga fix hari ini sekaligus. Alias `GAS-Siswa-release.apk` masih build base 23125 pre-fix (19:48, SHA `B4119C34…`).** Checklist uji: REGRESSION_CHECKLIST.md H.20 (TW-1 s/d TW-7).
  - **GAS Siswa build terbaru (🟡 MENUNGGU UJI USER — BELUM PROMOSI ALIAS)** = **1.0.128-siswa (23125) PET-OFFLINE-FIX** rebuild **2026-09-15 22:46** (CUMULATIVE: termasuk MUSHOLLA-REALTIME-FIX 22:04). Fokus: fix menu **Sahabat Belajar (Virtual Pet)** yang spinner abadi saat mode offline (laporan user, screenshot 22:25). Akar masalah: `resolveStudentIdentity` (listener single-value RTDB) + query pet tidak pernah callback offline tanpa cache (persistence RTDB tidak diaktifkan) → `isLoading` tidak pernah false. Fix: fast-path offline `emitPetFromOfflineCache()` baca cache lokal (`HybridSnapshotStore.readPet` prefs sesi/legacy + `VirtualPetOfflineMirror`) TANPA sentuh RTDB; timeout 12s resolve identitas (`withTimeoutOrNull`, timeout ≠ "tidak ditemukan"); mirror identitas baru `PetIdentityMirror` (key `hybrid_pet_identity_mirror_v1`, nama/agama tidak expired lintas hari); tanpa cache sama sekali → pesan error jelas, bukan spinner. File versioned: `Apk Release/Final_V2/GAS/GAS-Siswa-1.0.128-siswa-23125-PET-OFFLINE-FIX-release.apk` SHA `0C40A57899950D66E0E8E7C77EDCC5855B457B517829794A6FF90572A714C9EE` (22,362,241 bytes) + sidecar `.sha256`. **Install file INI untuk uji fix Sahabat Belajar + fix musholla sekaligus. Alias `GAS-Siswa-release.apk` masih build base 23125 pre-fix (19:48, SHA `B4119C34…`).** Checklist uji: REGRESSION_CHECKLIST.md H.19 (PF-1 s/d PF-7).
- **GAS Siswa build terbaru (🟡 MENUNGGU UJI USER — BELUM PROMOSI ALIAS)** = **1.0.128-siswa (23125) MUSHOLLA-REALTIME-FIX** rebuild **2026-09-15 22:04**. Fokus: fix menu **Presensi Sholat & Presensi Dhuha & Jumat** yang tidak membaca perubahan **Lokasi Musholla** web admin secara realtime. Akar masalah: early-return offline `isOnline()` di `PrayerDhuhaJumatScreen.kt` (semua listener RTDB tidak terpasang sepanjang sesi bila salah deteksi) + `onCancelled` diam + guard radius menolak 0. Fix: listener selalu terpasang (RTDB auto-resync saat online kembali), fallback root saat onCancelled, guard radius `< 0`, UI kartu lokasi `Target/Radius/Sekolah` + peringatan radius < 10 m. File versioned: `Apk Release/Final_V2/GAS/GAS-Siswa-1.0.128-siswa-23125-MUSHOLLA-REALTIME-FIX-release.apk` SHA `46CFDB3F00A3376DF7744194C8E1F03E782F22AC2B227288576FF070E2F999FA` (22,362,236 bytes) + sidecar `.sha256`. **Alias `GAS-Siswa-release.apk` saat ini masih build base 23125 pre-fix (19:48, SHA `B4119C34…`) — TIDAK mengandung fix; promosi alias menunggu verified user.** Checklist uji: REGRESSION_CHECKLIST.md H.18 (MR-1 s/d MR-7). Catatan data: radius musholla smpn3_pacet di RTDB = 3 m, disarankan 25-50 m.
  - **GAS Siswa Final lokal terbaru** = **1.0.114-siswa (23111)** rebuild FINAL-CLEAN **2026-09-07 10:16**. Fokus patch terbaru: **[SECURITY FIX KRITIS] Perbaikan celah security bypass Virtual Pet Lock mode OFFLINE** — bug pet siswa MATI tapi APK GAS siswa TIDAK ditahan overlay padahal Wi-Fi+Data dimatikan (pure offline + RTDB cache kosong → `isDead` default FALSE → security gate bocor). Fix parity EduLock gate pattern: dual-read snapshot lokal `HybridSnapshotStore.savePet()` (baca cache SharedPreferences DAHULU SEBELUM bind Firebase ValueEventListener) sehingga `isDeadByRule()` tetap terbaca walau offline. Cleanup instrumentation debug: Navigation.kt (-99 baris toast verbose + log), VirtualPetViewModel (-56 baris debug), AndroidManifest usesCleartextTraffic revert `true` → `false` (HTTPS-only secure), DELETE `network_security_config.xml` (debug HTTP localhost AVD 10.0.2.2). Build ini telah melalui **smoke test 6/6 LULUS user verified via HP fisik Vivo V2030 (2026-09-07)**: step kritis offline pet mati tetap ditahan = ✅; tidak ada regresi C1 WorkManager Periodic 15m, C2 OEM dialog hardening, C3 FCM SYNC_NOW silent push. File final aktif lokal (alias): `Apk Release/Final_V2/GAS/GAS-Siswa-release.apk` (overwrite dari SHA `79D29F67…` POST-C2-C3 23108) dan versioned permanen trace: `Apk Release/Final_V2/GAS/GAS-Siswa-1.0.114-siswa-23111-FINAL-CLEAN-OFFLINE-PET-LOCK.apk`. Sidecar SHA official ada di path yang sama dengan suffix `.sha256`. Backup rollback safety Level 1 tersimpan di `.dbg/` folder root repo. SHA256 alias final lokal + versioned + .dbg + build output asli **QUINTUPLE MATCH:** **`38F157D175A5229A39459A2BF2A67CDCD0CEB0B8B4DB01F6BC3ED933836CF3D9`**. Size: **21.14 MB (22,165,515 bytes)**. Rollback Cepat 1 detik bila 23111 bermasalah (meskipun verified): copy versioned `GAS-Siswa-1.0.111-siswa-23108-POST-C2-C3-OEM-FCM.apk` SHA `79D29F67804863E475FBFD65A706EE42102E6C1F1F1AD87D6697C6BF9C1D161E` overwrite alias release (NOTA: security hole offline pet lock KEMBALI AKTIF di 23108, rollback hanya untuk kasus darurat C1/C2/C3 FAIL di 23111).
  - **GAS Siswa unduhan web lokal (PENDING DEPLOY KARENA TUNDA USER — BELUM DISINKRONKAN HARI INI)** = Status terbaru SHA lokal `apk-manifest.json` di `web/public/apk` dan `web/src/data` saat ini MASIH MENUNJUK SHA `35039AA9…` versi 23093 untuk alias release (tanggal 31 Aug 2026 22:34). Deploy SHA 23111 FINAL-CLEAN ke publik TUNDA dulu sesuai instruksi user (tidak perlu rollout web sekarang; hanya file lokal `Final_V2/GAS` yang sudah update). Lokasi deploy target nanti bila user setuju: copy `Final_V2/GAS/GAS-Siswa-release.apk` SHA `38F157D1…` overwrite ke `web/public/apk/GAS-Siswa-release.apk` + copy versioned `GAS-Siswa-1.0.114-siswa-23111-FINAL-CLEAN-OFFLINE-PET-LOCK.apk` ke folder `web/public/apk` + update dua file `apk-manifest.json` + commit + push + tunggu App Hosting hijau.
  - **GAS Siswa Final lokal [ARSIP Lama Superseded — hole offline pet lock ADA di sini]** = **1.0.92-siswa (23089)** rebuild terbaru **2026-08-31 09:05**. Fokus patch terbaru: **Perbaikan false-block GPS di IFP Smart TV / Android TV**. Sebelumnya HomeScreen selalu memaksa cek `LocationManager.isLocationEnabled()` yang selalu false di perangkat TV (karena secara fisik tidak punya modul GPS), sehingga dialog GPS muncul terus dan aplikasi tidak bisa dibuka. Sekarang ditambahkan guard `isTvDevice()` + `hasLocationHardware()`; bila TV / tanpa modul lokasi, dialog GPS dan izin lokasi (ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION) di-skip total. Patch ini di-build dengan MEMPERTAHANKAN nomor versi 23089 (versi sama, hash berbeda). File final aktif lokal: `Apk Release/Final/GAS-Siswa-release.apk` dan `Apk Release/Final/GAS-Siswa-1.0.92-siswa-23089.apk`. SHA256 alias final lokal **patch TV**: `F0258FEEFB064AE203BDA6E11142480CA8086D18C6915623531E4DAA04BC8F16`. **File EduLock 1.3.22-48 di folder Final TIDAK diubah sama sekali.** ⚠️ **Peringatan:** Build 23089 (patch TV) dan build 23108 (POST-C2-C3 OEM+FCM) **KEDUANYA masih punya celah security bypass pet mati mode offline** — build 23108 SHA `79D29F67…` sekarang tersimpan sebagai arsip di Final_V2\GAS dan dipakai sebagai rollback darurat level1 1 detik JIKA 23111 ada masalah regresi selain pet lock.
  - **GAS Siswa unduhan web lokal** = **SUDAH DISINKRONKAN** pada **2026-08-31 09:12**. File di `web/public/apk/GAS-Siswa-release.apk` dan `web/public/apk/GAS-Siswa-1.0.92-siswa-23089.apk` sekarang identik hash dengan Final lokal (SHA `F0258FEEFB064AE203BDA6E11142480CA8086D18C6915623531E4DAA04BC8F16`). `apk-manifest.json` di kedua lokasi (`public/apk` dan `src/data`) juga di-update ke SHA terbaru, dengan `sizeBytes=21511024` dan `lastModified=2026-08-31T09:05:28`. Commit deploy sinkronisasi: **`7aa0ef79`** (App Hosting otomatis rollout dari push ini).
  - **GAS Guru Final saat ini** = **1.0.72-guru (1064)** rebuild terbaru **2026-08-30 14:53**. Menutup parity rule **final langsung** sekretaris di seluruh tampilan (hilangkan badge Pending legacy, tombol finalisasi usulan), serta menaikkan minor versi. File final aktif: `Apk Release/Final/GAS-Guru-release.apk` dan `Apk Release/Final/GAS-Guru-1.0.72-guru-1064.apk`. SHA256 alias final `06A775096952C592F6E00B43C420311165BE7189BABEF9609D2B5A4DD19A02E3`.
  - **EduLock Final saat ini** = **1.3.28 (54)** rebuild terbaru **2026-09-02 10:22**. Membawa patch perbaikan bypass internet (menutup celah koneksi tanpa internet/kuota medsos saja) dengan agregasi `NET_CAPABILITY_VALIDATED` dan `.info/connected`, dan perbaikan crash Android 14 saat force startup foreground service location sebelum diizinkan. File `Final` dan `web/public/apk` lokal **SUDAH di-push**. SHA Final/public lokal alias `846D54CE2F7ECF993B2F346EBBF04D463DC6F83B7032C8C1FDB02C63BBF86F3C`. Khusus source tutorial `/edulock/install`, sinkron tombol unduh ke file versioned `EduLock-1.3.28-54.apk` sudah didorong.
  - **EduLock Final_V2 lokal saat ini** = **1.3.54 (80)** rebuild **2026-09-18 10:00**. Fokus patch: **[KEMUDAHAN AKTIVASI AKSESIBILITAS ANDROID 13+ & BYPASS SETELAN DIBATASI XIAOMI/POCO/SAMSUNG/OPPO]** — Menambahkan alur 2-langkah interaktif di `SetupActivity` saat aktivasi Aksesibilitas di Android 13+ (tombol *Langkah 1: Info Aplikasi* untuk membuka kunci titik 3 *Izinkan setelan terbatas*, lalu *Langkah 2: Aksesibilitas*); deteksi brand otomatis (Xiaomi/POCO, Samsung, OPPO/Realme, TECNO); penambahan petunjuk Setelan Dibatasi dan tombol *Info Aplikasi* pada layar pengunci `OverlayLockActivity` dan dialog `MainActivity` dengan grace period 5 menit; serta penambahan kartu troubleshooting vendor di halaman web tutorial `/edulock/install`. File final aktif lokal: `Apk Release/Final_V2/EduLock_V2-1.3.54-80.apk` + alias `EduLock_V2-studentRelease.apk`. SHA256 **QUADRUPLE MATCH build output + versioned + alias + .dbg**: **`15EC6B3169FB39365147AB157DBEB09C969D6E4BB94F68941043CC91D18C7B3B`** (Short: `15EC6B31`). Size: **3.79 MB (3,974,590 bytes)**. Backup rollback cepat L0: `EduLock_V2-1.3.53-79.apk` (SHA `EBED1F4D…`) atau `EduLock_V2-1.3.52-78.apk` (SHA `BE5FF490…`).
  - **EduLock Final_V2 sebelumnya** = **1.3.53 (79)** rebuild **2026-09-16 12:20** (SHA `EBED1F4D…` Anti-tamper timezone/AM-PM Tecno Pova), **1.3.52 (78)** rebuild **2026-09-16 09:56** (SHA `BE5FF490…` Hardening Multi-OEM & Dual-Layer Watchdog), **1.3.51 (77)** rebuild **2026-09-15 09:58** (SHA `964E97FE…`), dan **1.3.50 (76)** rebuild **2026-09-08** (SHA `A7553332…`).
  - **Riwayat deploy web sesi terkini**:
    - commit `7aa0ef79` → **apk(gas-siswa@23089)**: patch false-block GPS untuk IFP Smart TV / Android TV di [HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt) + sinkron APK publik GAS Siswa 1.0.92 hash terbaru `F0258FEE…` + update apk-manifest di `public/apk` dan `src/data`.
    - commit `089fe1da` → rule inti `final langsung` untuk input Wali Kelas dan Sekretaris Kelas.
    - commit `81bdb467` → **cleanup** endpoint `/api/admin/attendance-verification` (hapus), bersihkan logika `PENDING_TEACHER` dan tombol `Finalkan Legacy` di **Rekap Kehadiran** (panel Admin & Statistik) + **Portal Guru** + **debug-point fetch cleanup** di AuthProvider & DatabasePage + **sinkron APK publik** GAS Siswa 1.0.92 dan EduLock 1.3.22.
    - commit `329ea6c6` → sinkron source tutorial `/edulock/install` ke file unduhan versioned `EduLock-1.3.22-48.apk`; push sukses, rollout live masih menunggu saat dicek.
    - commit `aef94fb1` → rapikan fallback dan metadata source `/gas/install` agar konsisten ke `GAS-Siswa-1.0.92-siswa-23089.apk`.
  - **Deploy live terbaru untuk portal guru**:
    - commit `9f42a276` — endpoint `/api/teacher/prayer` kini mengikuti kontrak hari efektif Dzuhur yang sama dengan web admin dan APK siswa, sehingga menu `/guru/sholat` tidak lagi menghitung `TS` dari semua hari sekolah lama.
    - commit `4822f24e` — halaman `/guru/kaih` kini menyamakan pola **Penilaian 7 KAIH** dengan APK GAS Guru: ada preset cepat `Nilai 25 / Nilai 20 / Reset` langsung di halaman, dan dialog edit per siswa memakai 4 field angka (`Kejujuran`, `Perilaku`, `Inisiatif`, `Komitmen`) plus preset cepat yang sama.
    - commit terbaru sesi 2026-08-29 — halaman `/guru/presensi` kini me-refresh `Rekap Bulanan` setelah guru menekan **Simpan Presensi Manual** (jika bulan/tahun yang sedang dibuka sama), dan halaman `/guru/sholat-dhuha-jumat` kini menampilkan **jejak status aktif** yang lebih tegas serta tidak lagi memunculkan dua status aktif sekaligus saat pilihan manual berbeda dari status tersimpan.
    - commit `089fe1da` → rule inti `final langsung`.
    - commit `81bdb467` → **cleanup** badge pending legacy, tombol finalisasi usulan, dan narasi verifikasi bertahap dari halaman `/guru/presensi` (rule baru: data baru selalu final langsung, hanya data legacy PENDING_TEACHER yang masih bisa dirubah lewat edit manual biasa).
- [ ] Tenant nonaktif Super Admin sekarang harus menendang di **SEMUA submenu dashboard admin** (Dashboard Utama, GAS, Database, EduLock, Lentera) — bukan cuma halaman `/dashboard`. Payload guard ada di [dashboard/layout.tsx](file:///D:/Dashboard%20Portal/web/src/app/dashboard/layout.tsx); commit live `0828e1b9` → `99e77850`.
- [ ] **DATABASE INDAK Super Admin (Sekolah & Tenant)** — UI wajib filter client-side 2 lapis hook [useSuperAdminDatabase.ts](file:///d:/Dashboard%20Portal/web/src/hooks/super/useSuperAdminDatabase.ts#L196-L209): hard-block schoolId `uninstallaccess` + reject row tanpa nama/NPSN/district/email kontak berarti (entry sisa seed sampah). Data RTDB fisik tetap ada, UI bersih. Commit push `2b96fafb..99e77850` → deploy Firebase sudah hijau live 2026-08-26 sore. Konfirmasi user refresh → row `- uninstallaccess` HILANG dari daftar ✅.
- [ ] Tidak ada API `web/src/app/api/debug-*` baru yang ikut ter-commit

Untuk APK native, pakai juga [GAS/REGRESSION_CHECKLIST.md](./GAS/REGRESSION_CHECKLIST.md) / [Edulock/REGRESSION_CHECKLIST.md](./Edulock/REGRESSION_CHECKLIST.md) sesuai area yang diubah.

**Catatan:** ubah UX rekap/statistik di web admin **tidak** otomatis butuh rebuild APK, kecuali kontrak data/API native ikut berubah.

## Status EduLock hari ini

- **Acuan Final/public lokal saat ini** EduLock **1.3.26 (52)** hash `846D54CE2F7ECF993B2F346EBBF04D463DC6F83B7032C8C1FDB02C63BBF86F3C`. Build ini sudah sinkron di folder `Final` dan `web/public/apk` lokal, dan **SUDAH di-push**. Perubahan utama build ini: **Penambalan celah bypass medsos-only & fix Force Close Android 14**.
- **USB E2E realtime 2026-08-27** di HP fisik menunjukkan enforcement inti **lulus**: device berada di area sekolah, jam sekolah aktif, proteksi aktif, dan percobaan buka app hiburan tetap tertahan di EduLock.
- **Flow resmi izin guru** juga **lulus** end-to-end.
- **Update malam 2026-08-27:** bug utama keluarga recovery Settings untuk jalur **`Accessibility OFF -> admin ON`** sudah **berhasil ditembus di HP fisik** pada build kerja terakhir. Gejala awalnya: overlay recovery sempat muncul lalu terlalu cepat hilang / user tidak sempat masuk ke Settings Accessibility.
- **Kasus yang wajib dianggap satu PR bug yang sama sampai terbukti terpisah:**
  1. `Accessibility OFF -> admin ON`
  2. `Overlay/Tampil di atas aplikasi lain OFF -> admin ON`
  3. `Izin Latar Belakang / Battery Optimization OFF -> admin ON`
  4. `Izin Lokasi aplikasi OFF -> admin ON`
- **Akar yang sudah teridentifikasi dari pembanding jalur GPS yang dulu sudah fix:**
  - [OverlayLockActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt) sempat `finish()` terlalu cepat pada `onResume()` untuk target recovery settings sebelum user sempat menekan tombol ke halaman Aksesibilitas.
  - [LockEnforcer.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt) perlu menahan spam relaunch overlay recovery dengan pola debounce ala recovery GPS, tetapi **tidak boleh** memblokir overlay hanya karena `lastForegroundPackage` terbaca `settings` secara stale.
- **Status retest terbaru:**
  - jalur **GPS mati -> buka Pengaturan Lokasi** = **normal / lulus**
  - jalur **internet mati total -> lewat masa tenggang 60 detik** = **lulus di HP fisik** (sudah benar-benar mengunci)
  - jalur **Accessibility OFF -> admin ON -> overlay diabaikan** = **lulus di HP fisik pada APK Final terbaru** (tidak lagi cuma popup berulang; sekarang tetap memaksa stay di jalur EduLock)
  - **catatan distribusi:** APK final bersih terbaru sudah dibuild ulang dan disalin ke folder `Apk Release/Final` serta `web/public/apk` lokal. **Push live APK** sudah dilakukan bersama commit `81bdb467`, dan **sinkron source tutorial install** sudah didorong lagi lewat commit `329ea6c6`; rollout Firebase App Hosting masih perlu ditunggu sampai route live ikut berubah.
- **Behavior Temukan Perangkat terbaru:**
  - User silent volume Alarm biasa → EduLock paksa max via `setStreamVolume` + `adjustStreamVolume` bertubi `FLAG_SHOW_UI` (user lihat slider OS naik otomatis).
  - Jika stream Alarm tetap 0 (DND atau OEM tolak) → **fallback ke STREAM_MUSIC** volume max + laporkan status `ALARM_STARTED_FALLBACK_MUSIC`.
  - Jika kedua stream tetap nol → fallback Vibrator pattern panjang + laporkan `ALARM_STARTED_VIBRATION_ONLY`.
  - Jika semuanya gagal → laporkan `FAILED_SILENT` ke admin.
  - Setelah selesai, volume Alarm dan Music dikembalikan ke level semula.
- Handoff detail untuk tim lanjutan ada di [Edulock/HANDOFF_LAPANGAN_EDULOCK.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/Edulock/HANDOFF_LAPANGAN_EDULOCK.md) dan log build hari ini ada di [Edulock/BUILD_LOG.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/Edulock/BUILD_LOG.md).

---

## Kenapa fitur lama bisa “hilang”

Bukan karena live “lupa sendiri”. Biasanya:

- Fitur hanya di lokal, **belum commit/push**
- Tim push dari salinan `main` yang belum berisi kerjaan Anda
- Merge/pull mengambil versi tim dan menimpa file Anda
- Force-push / rewrite history membuat commit lama jadi orphan
- Refactor “merapikan” menghapus menu/panel yang tidak sedang dikerjakan

**Obat:** commit + push segera setelah fitur stabil; selalu pull dulu; patuhi gate + checklist di atas.

---

## Catatan cepat Dhuha / Jumat (sering salah paham)

| Tempat di admin | Fungsi |
|-----------------|--------|
| **Jadwal Sholat Per Kelas** | Jam mulai / selesai + kelas + hari (contoh: Dhuha 1×/minggu per jenjang) |
| **Override Tanggal / Generator Rotasi** | Tanggal + kelas aktif saja (**tanpa** field jam) |
| **Rekap Dhuha & Jum'at** | Hitung wajib dari jadwal/override di atas, bukan dari kalender Dzuhur |

Tanpa jadwal berjam, APK siswa tidak punya jendela operasional meskipun override sudah ada.

Audit 2026-08-27: APK Siswa **Presensi Dhuha & Jum'at** sudah membaca `prayer_v2` (types + schedules + overrides + peta kelas) selaras admin. Tidak perlu rebuild khusus Dhuha/Jumat. Build **1.0.82** hanya untuk kartu **Aturan Hari** Dzuhur.
