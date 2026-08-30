# Pegangan Build APK — Mulai di sini

**Baca file ini dulu.** Dokumen lain di folder ini = detail / arsip. Jangan skip gate di bawah sebelum `git push origin main`.

Live Dashboard = isi **`origin/main`** saja. Yang hanya jalan di laptop (belum commit/push) **tidak** muncul di App Hosting.

---

## Pilih jalur kerja

| Mau apa | Buka |
|---------|------|
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

1. **Kerjaan Anda sudah di-commit** — jangan biarkan fitur penting hanya di working tree.
2. `git status` bersih untuk file yang tidak relevan; **jangan** `git add web/` atau `git add .` buta.
   - Jangan push: `debug-*` API, script `check-*` / `delete_*` sekali pakai, `web/Apk Release/`, APK di dalam `web/docs/`.
3. `git pull origin main` (atau rebase) dulu supaya tidak menimpa commit orang lain / fitur lama.
4. **Jangan force-push** ke `main` / `master`.
5. Bandingkan **lokal vs live** untuk menu kritis di bawah (minimal smoke).
6. Setelah push: tunggu App Hosting **hijau**, lalu hard-refresh live.

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
| Force-push / rewrite history | **Dilarang** ke `main` |
| Rollout Console tanpa commit di GitHub | Tidak akan membawa perubahan lokal |

**Aturan praktis:**

1. Satu fitur web = satu (atau beberapa) commit jelas di `main`, jangan menumpuk berhari-hari di working tree.
2. Sebelum push yang menyentuh `GasSidebar`, `GasWorkspace`, `gasConfig`, atau panel Presensi/Rekap: buka live **dan** lokal, pastikan menu kritis masih ada.
3. Jangan “membersihkan” folder dengan menghapus panel/menu yang tidak Anda kerjakan di sesi itu.
4. Jika `git pull` memunculkan konflik di file menu: **selesaikan konflik dulu**, jangan buang sisi yang berisi fitur lama.

---

## Peta menu Presensi (jangan disatukan lagi sembarangan)

| Menu admin | Isi yang benar |
|------------|----------------|
| **Presensi Sekolah** | Pengaturan sistem saja (jadwal/libur/lokasi). Rekap ada di **Rekap Kehadiran**. |
| **Rekap Kehadiran** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik** |
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
- [ ] **Rekap Kehadiran** — tiga tab (Bulanan / Harian / Statistik) masih ada
- [ ] **Presensi Sholat** — Jadwal Per Kelas (jam mulai/selesai) + Override Tanggal (rotasi Jumat = tanggal/kelas saja); settings-only
- [ ] **Rekap Sholat** — tiga tab termasuk Statistik
- [ ] **Rekap Dhuha & Jum'at** — menu Monitoring masih ada + tiga tab; % wajib mengikuti jadwal per kelas
- [ ] **Monitoring Virtual Pet** — Total Pets Aktif ≈ siswa yang punya pet terhubung (bukan hitung pet siluman/orphan)
- [ ] **Unduhan APK** — `/gas/install` (dan EduLock bila diubah) menunjuk versi Final yang disepakati.
  - **GAS Siswa Final lokal terbaru** = **1.0.90-siswa (23087)** rebuild terbaru **2026-08-30 12:26**. Fokus patch: menu **Presensi Siswa** sekarang punya **Rekap Mingguan** agar monitoring tidak perlu menunggu bulanan, sementara kontrak guard `Sekretaris Kelas` tetap dipertahankan. File final aktif lokal: `Apk Release/Final/GAS-Siswa-release.apk` dan `Apk Release/Final/GAS-Siswa-1.0.90-siswa-23087.apk`. SHA256 alias final lokal `77AD148F7557F609226FB1CBD7C65440DEB3BC56D8CDD11DB7C09E89729DF8E5`.
  - **GAS Siswa live unduhan web saat ini** masih **1.0.82-siswa (23079)** hasil sinkron terakhir **2026-08-28 13:25**. Muatan live ini mencakup fix build 11:37 (**auto pelanggaran Kedisiplinan** untuk **Terlambat** dan **Pulang Awal**, baca **rule/poin admin**, guard **anti-double** dengan input manual OSIS/guru). SHA Final/public live `C09A10E08D23BFEE98F8DB4D2B60BE547F9FAA928459E0BB8F9695EA806B2C4C`. File kanonik live terakhir: `Apk Release/Final/GAS-Siswa-1.0.82-siswa-23079.apk`.
  - **GAS Guru Final saat ini** = **1.0.70-guru (1062)** rebuild terbaru **2026-08-30 12:26**. Mencakup tab **Rekap Mingguan** di menu presensi agar wali kelas bisa memantau kelas lebih cepat, sambil tetap mempertahankan hardening verifikasi akhir untuk usulan `Sekretaris Kelas`. File final aktif: `Apk Release/Final/GAS-Guru-release.apk` dan `Apk Release/Final/GAS-Guru-1.0.70-guru-1062.apk`. SHA256 alias final `5C98AA6DDA272EEF4D9427CF06DD9615BC9C14D514608533827D6D30B904291E`.
  - **EduLock Final saat ini** = **1.3.22 (48)** rebuild terbaru **2026-08-28 18:51**. Membawa patch keamanan `1.3.22` sebelumnya plus build kerja terbaru fitur **Temukan Perangkat** (alarm keras + ACK status ke admin), **patch fallback audio 2 lapis** (alarm + fallback `STREAM_MUSIC` + Vibrator), dan **hardening enforcement** untuk 2 bug lapangan yang baru lulus uji HP fisik: (1) internet mati total > 60 detik benar-benar mengunci, (2) `Accessibility OFF` yang diabaikan tidak lagi cuma popup berulang, tetapi tetap memaksa stay di jalur EduLock. File `Final` dan `web/public/apk` lokal sudah sinkron. **Git push / live App Hosting BELUM dilakukan** karena user masih menyempurnakan versi ini sebelum final. SHA Final/public lokal alias `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`.
  - **Deploy web admin live terbaru** = commit `0c6f83a6` — panel EduLock sekarang punya fitur **Temukan Perangkat** untuk mengirim alarm keras ke HP siswa yang masih online/FCM-ready dan menampilkan ACK `ALARM_STARTED / ALARM_FINISHED / FAILED`. Detail fallback alarm (STREAM_MUSIC / Vibrator) ditulis di `active_devices` via field baru `lastFindDeviceStreamUsed`, `lastFindDeviceUsedMusicFallback`, `lastFindDeviceUsedVibrationFallback` (panel UI bisa ditampilkan kemudian).
  - **Deploy live terbaru untuk portal guru**:
    - commit `9f42a276` — endpoint `/api/teacher/prayer` kini mengikuti kontrak hari efektif Dzuhur yang sama dengan web admin dan APK siswa, sehingga menu `/guru/sholat` tidak lagi menghitung `TS` dari semua hari sekolah lama.
    - commit `4822f24e` — halaman `/guru/kaih` kini menyamakan pola **Penilaian 7 KAIH** dengan APK GAS Guru: ada preset cepat `Nilai 25 / Nilai 20 / Reset` langsung di halaman, dan dialog edit per siswa memakai 4 field angka (`Kejujuran`, `Perilaku`, `Inisiatif`, `Komitmen`) plus preset cepat yang sama.
    - commit terbaru sesi 2026-08-29 — halaman `/guru/presensi` kini me-refresh `Rekap Bulanan` setelah guru menekan **Simpan Presensi Manual** (jika bulan/tahun yang sedang dibuka sama), dan halaman `/guru/sholat-dhuha-jumat` kini menampilkan **jejak status aktif** yang lebih tegas serta tidak lagi memunculkan dua status aktif sekaligus saat pilihan manual berbeda dari status tersimpan.
- [ ] Tenant nonaktif Super Admin sekarang harus menendang di **SEMUA submenu dashboard admin** (Dashboard Utama, GAS, Database, EduLock, Lentera) — bukan cuma halaman `/dashboard`. Payload guard ada di [dashboard/layout.tsx](file:///D:/Dashboard%20Portal/web/src/app/dashboard/layout.tsx); commit live `0828e1b9` → `99e77850`.
- [ ] **DATABASE INDAK Super Admin (Sekolah & Tenant)** — UI wajib filter client-side 2 lapis hook [useSuperAdminDatabase.ts](file:///d:/Dashboard%20Portal/web/src/hooks/super/useSuperAdminDatabase.ts#L196-L209): hard-block schoolId `uninstallaccess` + reject row tanpa nama/NPSN/district/email kontak berarti (entry sisa seed sampah). Data RTDB fisik tetap ada, UI bersih. Commit push `2b96fafb..99e77850` → deploy Firebase sudah hijau live 2026-08-26 sore. Konfirmasi user refresh → row `- uninstallaccess` HILANG dari daftar ✅.
- [ ] Tidak ada API `web/src/app/api/debug-*` baru yang ikut ter-commit

Untuk APK native, pakai juga [GAS/REGRESSION_CHECKLIST.md](./GAS/REGRESSION_CHECKLIST.md) / [Edulock/REGRESSION_CHECKLIST.md](./Edulock/REGRESSION_CHECKLIST.md) sesuai area yang diubah.

**Catatan:** ubah UX rekap/statistik di web admin **tidak** otomatis butuh rebuild APK, kecuali kontrak data/API native ikut berubah.

## Status EduLock hari ini

- **Acuan Final/public lokal saat ini** EduLock **1.3.22 (48)** hash `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`. Build ini sudah sinkron di folder `Final` dan `web/public/apk` lokal, tetapi **BELUM di-push** sehingga live tutorial `/e` belum perlu dianggap final. Perubahan utama build ini (dibanding build 16:40 hash `5F4E2EE3...`): **hardening enforcement offline + Accessibility recovery** sampai lolos uji HP fisik.
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
  - **catatan distribusi:** APK final bersih terbaru sudah dibuild ulang dan disalin ke folder `Apk Release/Final` serta `web/public/apk` lokal. **Push live masih ditahan** sampai user menyatakan versi ini benar-benar final.
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
