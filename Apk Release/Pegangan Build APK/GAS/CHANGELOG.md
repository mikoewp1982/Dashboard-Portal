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
- Changed: Login APK GAS Siswa diubah menjadi pola `NPSN -> NISN -> Nama Siswa`, dan nama siswa terisi otomatis dari database.
- Changed: Urutan menu beranda GAS Siswa diubah menjadi `Absensi -> Presensi Sholat -> Lentera Digital -> 7 KAIH -> Virtual Pet -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Tools`, dan `Catat Pelanggaran` tetap khusus OSIS di posisi paling akhir.
- Changed: Status aktivitas `E-Perpus` pada `Virtual Pet` sekarang memakai target `30 menit membaca hari ini`, dan progress kenyang ikut penuh di 30 menit.
- Changed: Card `Pencapaian -> Literasi Aktif` pada `Virtual Pet` sekarang ikut memakai target `30 menit`, sehingga subtitle dan progress tidak lagi menampilkan teks lama `60 menit`.
- Fixed: Hak akses petugas OSIS pada GAS Siswa sekarang dipantau realtime dari node sekolah aktif, sehingga menu `Catat Pelanggaran` otomatis hilang ketika siswa dihapus dari `Manajemen Petugas OSIS`.
- Removed: Card `Prestasi` di menu Kedisiplinan siswa dihapus.
- Fixed: Overlay `pet mati` pada GAS Siswa sekarang benar-benar memblokir seluruh interaksi sehingga siswa tidak bisa memakai aplikasi sampai pet direvive.
- Fixed: Kartu `Literasi` pada `Virtual Pet` sekarang benar-benar membuka `Tugas Literasi` siswa dan langsung masuk ke tab tugas, bukan ke halaman placeholder.
- Fixed: Tab `Peringkat` pada `Virtual Pet` sekarang lebih tahan terhadap mismatch identitas siswa karena ranking membaca alias `recordId/id/nisn/username`.

### Guru
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

### Legacy / Universal

---

## [Baseline Dokumen] - 2026-07-30

### Umum
- Changed: Dokumen pegangan build APK GAS dirapikan agar sesuai flavor dan alur build aktual proyek.

## Catatan Struktur Aktual
- Flavor utama: `siswa`, `guru`, `kepala`
- Flavor khusus: `legacySiswa`, `legacyGuru`, `legacyKepala`, `universal`
- Source set aktual: `src/main`, `src/kepala`
