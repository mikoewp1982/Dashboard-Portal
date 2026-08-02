# Changelog EduLock Siswa

Dokumen ini mencatat perubahan perilaku atau fitur pada APK `EduLock`.

Catatan:
- Semua aktivitas build/perubahan harian wajib masuk [BUILD_LOG.md](./BUILD_LOG.md)
- Yang masuk changelog hanya perubahan yang relevan untuk riwayat produk atau kontrak perilaku

## [Unreleased]

### Umum

### Student
- Changed: Build distribusi EduLock siswa dinaikkan ke `1.3.4` (`versionCode 30`) dan di-ship sebagai `Apk Release/Final/EduLock-studentRelease.apk` (commit `24e3ffa6`).
- Fixed: Hard lock GPS-off / internet-off sekarang fail-closed berbasis indikasi kehadiran sekolah (sticky / near-school / recent geofence); siswa sakit di rumah tanpa indikasi dekat sekolah tidak dipaksa terkunci.
- Fixed: Tombol unduh APK di portal tutorial live sempat `404` pada App Hosting standalone; diperbaiki lewat `ensure-standalone-public.mjs` + stop tracing `apk-manifest` dari `public` (`3c9b1413`), lalu ship EduLock + sync publik (`24e3ffa6`).
- Added: Handoff lapangan EduLock (`native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md`) beserta salinan Word di `Apk Release/Final/HANDOFF_LAPANGAN_EDULOCK.docx`.
- Removed: Overlay callout text box pada portal tutorial `/edulock/install` dihapus; panduan visual sekarang mengandalkan judul/body langkah di atas gambar saja (deploy `307751ae`).
- Changed: Wording tutorial EduLock siswa diselaraskan ke tombol `Daftar` pada langkah registrasi, bukan `Masuk`.
- Changed: Halaman tutorial instalasi EduLock siswa di web sebelumnya dirapikan; panah anotasi di screenshot login dihapus dan teks panduan login dibenahi menjadi `Masukan NISN kalian`.
- Added: Halaman tutorial instalasi EduLock siswa sekarang memiliki alias URL pendek `/e` agar link yang dibagikan ke browser siswa lebih ringkas.
- Changed: Route `/edulock/install` tetap dipertahankan sebagai fallback, tetapi jalur distribusi utama yang dicatat untuk siswa kini adalah `/e`.
- Fixed: Telemetry Realtime EduLock ke Web Admin diperbaiki; saat EduLock baru di-install / di-install ulang, telemetry status `ONLINE` langsung dikirim seketika saat registrasi selesai (`RegistrationActivity`) & selama halaman `SetupActivity` (onboarding 6 izin HP) dibuka, sehingga status di Admin Web tidak lagi tertahan di status `TERIKAT / Offline` (*7283 min lalu*) saat siswa sedang melengkapi konfigurasi.
- Fixed: Tombol 5 (Tampil di Atas Aplikasi Lain / Overlay) dan Tombol 6 (Izin Latar Belakang / Battery Optimization) pada Konfigurasi Awal EduLock siswa tidak lagi ditendang keluar, karena `AntiUninstallService` membebaskan akses menu Settings saat `isSetupCompleted` masih `false` atau `isSettingsGrace` aktif.
- Fixed: `Force Update Control` dari Super Admin sekarang benar-benar aktif di APK EduLock; policy `min_version_code_edulock` dipantau live dari RTDB pada flow registrasi, setup, dan `MainActivity`, lalu mengarahkan user ke layar wajib update.
- Fixed: Saat `Device Admin` dimatikan, EduLock sekarang memprioritaskan satu prompt resmi di `MainActivity`; enforcement `Accessibility` dari `MonitoringService` menunggu sampai flow admin selesai sehingga prompt tidak lagi dobel.
- Fixed: Overlay recovery sekarang menyesuaikan label tombol dengan target aktual (`Lokasi`, `Aksesibilitas`, atau kembali ke `EduLock`) sehingga tidak lagi muncul instruksi proteksi dengan tombol GPS.
- Changed: Overlay peringatan `pet mati` sekarang hanya aktif di luar jam sekolah; saat masuk jam sekolah overlay akan ikut ditutup agar beban enforcement EduLock lebih ringan.
- Fixed: Flow `Minta Izin Penggunaan HP` dan `Buka APK GAS Siswa` sekarang memakai grace period transisi resmi, sehingga `MainActivity` tidak lagi menarik paksa EduLock dari `onPause`/`onUserLeaveHint` saat siswa masih berada di alur yang diizinkan.
- Fixed: `MainActivity` sekarang membersihkan sisa overlay setup/lock sementara saat kembali aktif, sehingga tombol `Minta Izin Penggunaan HP` dan `Buka APK GAS Siswa` tidak lagi tertutup area sentuh tak terlihat.
- Fixed: Sesi debug overlay `pet mati` sudah ditutup; instrumentasi runtime sementara dihapus dan reminder kembali ke interval normal 10 menit.
- Changed: Tool uji sementara `Paksa Mati` di panel web admin `Virtual Pet` sudah dicabut kembali setelah verifikasi sukses.
- Fixed: Overlay `pet mati` kini mencocokkan identitas pet memakai alias backend siswa yang benar (`studentKey`, `username`, `nisn`), bukan lagi `studentId` lokal dari database perangkat.
- Changed: Build post-fix overlay `pet mati` dinaikkan ke versi `1.3.3` untuk memastikan update APK debug bisa dipasang langsung di atas build uji sebelumnya.
- Changed: Build uji overlay `pet mati` terbaru sekarang memakai versi APK `1.3.2` agar bisa dipasang di atas build uji sebelumnya tanpa uninstall.
- Added: Instrumentasi runtime sementara pada `MonitoringService`, `LockEnforcer`, dan `PetDeadLockActivity` untuk mengirim bukti debug sesi `pet-overlay-missing`.
- Changed: Card `Jam Sekolah` di APK siswa diatur ulang sehingga `Masuk/Pulang` berada di kiri, `Waktu Saat Ini` di kanan, dan garis pembatas berada tepat di tengah.
- Changed: Monitoring runtime EduLock sekarang mengirim heartbeat lebih rapat beserta telemetry proteksi (`Accessibility`, `Device Admin`, compliance status) agar panel `Realtime Student Monitoring` di web lebih hidup.
- Fixed: Upaya membuka menu `Aplikasi admin perangkat` untuk mematikan Device Admin sekarang langsung ditendang kembali ke EduLock.
- Fixed: Pengingat `pet mati` tetap muncul ulang tiap 10 menit, termasuk saat di luar jam sekolah.
- Changed: Untuk uji coba overlay, pengingat `pet mati` sementara dipercepat menjadi tiap 1 menit dan web admin mendapat tombol `Paksa Mati` per siswa di panel `Virtual Pet`.
- Changed: Urutan login registrasi siswa diubah menjadi `NPSN -> NISN -> Nama Siswa`.
- Added: Kolom nama siswa sekarang terisi otomatis dari database setelah `NPSN` dan `NISN` valid.

---

## [Baseline Dokumen] - 2026-07-30

### Umum
- Changed: Dokumen pegangan build APK EduLock difokuskan ke APK siswa karena admin hanya pembungkus web.

## Catatan Struktur Aktual
- Flavor yang dicatat di dokumen ini: `student`
- Source set aktual: `src/main`
- Output release siswa: `EduLock-studentRelease.apk`
