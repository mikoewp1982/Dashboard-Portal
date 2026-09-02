# Regression Checklist GAS

Checklist ini dipakai untuk memastikan fitur lama tidak tertinggal saat ada perubahan baru.

## Aturan Pakai
- Tidak semua item harus diuji setiap saat.
- Pilih item sesuai flavor dan area yang benar-benar terdampak.
- Jika file di `src/main`, mulai dari asumsi bahwa `siswa`, `guru`, dan `kepala` ikut terdampak.
- Tulis hasil uji ringkas di [BUILD_LOG.md](./BUILD_LOG.md).

## A. Shared / High Impact
- [ ] Login masih bisa masuk sesuai role yang benar
- [ ] `Navigation.kt` tidak memutus route utama
- [ ] Session lama tidak rusak setelah update
- [ ] Force update / security gate tetap berfungsi
- [ ] Flavor yang tidak disentuh tidak ikut rusak karena perubahan di `src/main`

## B. GAS Siswa
- [ ] Home siswa terbuka normal
- [ ] Attendance / Presensi siswa berfungsi
- [ ] Prayer / Presensi Sholat siswa berfungsi
- [ ] Kartu **Aturan Hari** di Presensi Sholat: Hari efektif = Presensi Sekolah (`attendance/schedules`); Tanggal merah = daftar libur; Aturan sholat = Dzuhur `prayer_v2` (bukan mencampur ketiganya)
- [ ] Presensi Dhuha & Jum'at: wajib hari ini = Jadwal Per Kelas + Override (`prayer_v2`), bukan Dzuhur / Presensi Sekolah. Baris Jam boleh statis.
- [ ] Seven Habits / 7 KAIH berfungsi
- [ ] 7 KAIH: siswa hanya bisa mencentang kolom untuk hari ini; hari sebelumnya dan hari berikutnya tidak bisa diedit
- [ ] 7 KAIH: setelah siswa menyimpan laporan hari ini, entri hari ini menjadi final/terkunci dan tidak bisa diubah lagi
- [ ] 7 KAIH: minggu yang memuat hari ini tetap bisa dibuka tanpa ikut terkunci penuh oleh status submit minggu lama
- [ ] Virtual Pet tetap bisa dibuka
- [ ] Lentera / Library dan PDF reader masih bisa dibuka
- [ ] Lentera Digital: zoom, fullscreen, swipe saat 1x, dan panel bawah native `Sebelumnya/Berikutnya` berjalan sesuai kondisi zoom
- [ ] Kategori utama katalog `Lentera Digital` sama persis dengan master kategori web e-perpus terbaru
- [ ] Kategori `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI` tampil di filter katalog siswa
- [ ] Pilih kategori baru / kategori kosong di katalog siswa tetap stabil dan menampilkan hasil yang benar
- [ ] Notifikasi siswa tetap tampil
- [ ] Gate EduLock siswa bekerja sesuai aturan terbaru
- [ ] Gate EduLock: setelah aksesibilitas / admin perangkat di EduLock aktif, buka GAS dari EduLock tidak muter delay puluhan detik

## C. GAS Guru
- [ ] Home guru terbuka normal
- [ ] Data Siswa tampil normal
- [ ] Nama siswa panjang tetap terbaca
- [ ] Presensi Sholat guru tampil benar
- [ ] Rekapitulasi Kehadiran guru tampil benar
- [ ] Penilaian 7 KAIH guru tetap berfungsi
- [ ] Notifikasi guru tetap berfungsi

## D. GAS Kepala
- [ ] Dashboard kepala sekolah bisa dibuka
- [ ] Modul principal attendance berjalan
- [ ] Modul principal literacy berjalan
- [ ] Modul principal prayer berjalan
- [ ] Modul principal seven habits berjalan
- [ ] Modul principal discipline / bullying berjalan

## E. Output Build
- [ ] Flavor yang dimaksud berhasil compile
- [ ] Flavor yang dimaksud berhasil assemble release
- [ ] Nama file APK final jelas
- [ ] Lokasi copy final tercatat di `BUILD_LOG.md`

## F. Jika Perubahan Menyentuh File Berikut

### `Navigation.kt` / `LoginScreen.kt` / `SecurityUtils.kt`
- [ ] Cek login
- [ ] Cek route utama
- [ ] Cek gate/overlay keamanan
- [ ] Cek minimal 2 flavor lain

### Repository / ViewModel bersama
- [ ] Cek screen yang memakai repository tersebut
- [ ] Cek save/load data
- [ ] Cek satu fitur lama di sekitar area yang sama

### Layar tabel/list siswa
- [ ] Cek nama panjang
- [ ] Cek divider / alignment
- [ ] Cek scroll area
- [ ] Cek data sekunder seperti NISN bila sebelumnya diubah
