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

### Siswa
- Changed: Build distribusi GAS Siswa `1.0.82-siswa (23079)` dibuild ulang lagi pada **2026-08-28 13:25**, hash Final/public alias menjadi `C09A10E08D23BFEE98F8DB4D2B60BE547F9FAA928459E0BB8F9695EA806B2C4C`, lalu **SUDAH disinkronkan** ke `web/public/apk` dan live unduhan Firebase/App Hosting.
- Fixed: **Siswa (Gate EduLock)** sekarang dibangun dengan konsep baru bahwa hard block kepatuhan EduLock hanya aktif saat **hari efektif + jam sekolah aktif**, dengan **grace period** saat proteksi drop sesaat di tengah sesi.

### Guru
- Changed: Build distribusi GAS Guru saat ini menjadi `1.0.61-guru (1053)` dengan file final aktif `GAS-Guru-release.apk`.
- Fixed: **Guru (Presensi Sholat)** hitungan `TS / Tidak Sholat` di APK guru sekarang mengikuti **hari efektif Dzuhur** yang sama dengan APK siswa dan web admin (`attendance/schedules` + `attendance/holidays` + `prayer_v2/types/DZUHUR/activeDays`), tidak lagi jatuh ke hitungan lama `24`.
- Fixed: **Guru (Rekapitulasi)** ekspor/rekap guru di APK sekarang memakai denominator hari efektif Dzuhur yang sama, sehingga kolom `TS` sinkron dengan web admin yang sudah diperbaiki.
- Changed: **Guru (Home)** kartu menu dipendekkan dan diringankan agar tidak terasa terlalu besar di layar, tetapi identitas UI guru tetap 2 kolom glassmorphism tanpa bottom nav.
- Fixed: **Guru (Home)** badge merah notifikasi di kartu menu digeser sedikit masuk agar tidak mepet ke sudut kanan atas dan lebih jelas terlihat.

### Web Admin / PWA
- Fixed: **Portal Guru `/guru/sholat`** yang live sekarang menghitung `TS / Tidak Sholat` dengan kontrak hari efektif Dzuhur yang sama seperti web admin dan APK siswa. Deploy live commit `9f42a276`.

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
