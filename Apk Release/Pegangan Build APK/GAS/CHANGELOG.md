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

### Umum
- Fixed: Dashboard GAS web admin tidak lagi terjebak infinite spinner pada tab `7 KAIH` saat `schoolId` belum siap atau subscription RTDB gagal.
- Fixed: Panel `7 KAIH` web admin sekarang menampilkan pesan fallback yang jelas jika sesi admin belum membawa `schoolId`.
- Changed: Sidebar dashboard hanya mengaktifkan prefetch link saat production untuk membantu mencegah `ChunkLoadError` di mode development.
- Fixed: Tab `Peringkat` pada `Virtual Pet` web admin dirapikan agar wrapper tabel tetap stabil saat data ranking tampil.

### Siswa
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
