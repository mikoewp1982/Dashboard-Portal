# Checklist Perubahan APK Terkini

Dokumen ini dipakai sebagai pegangan uji perangkat tahap berikutnya.

Aturan baca:
- `[x]` = perubahan sudah diimplementasikan
- `[ ]` = belum diuji di perangkat / web live dan perlu dicek manual

Update terakhir: 2026-07-31 00:20

## 0. Web Admin / Dashboard

### Monitoring admin sekolah
- [x] Monitoring super admin sekarang menggabungkan data `schools` dan `admin_profiles` agar admin sekolah yang login via jalur runtime tetap terbaca
- [x] Pencatatan `lastLoginAt` admin sekarang di-await sebelum redirect agar request login tidak putus saat pindah halaman
- [x] Perbaikan monitoring admin sekolah sudah dideploy ke web live pada rollout malam `2026-07-30`
- [ ] Cek web live: login ulang admin sekolah lalu pastikan `Monitoring` menampilkan waktu login terbaru
- [ ] Cek web live: admin sekolah tanpa email login standar tidak lagi terbaca sebagai `Belum pernah login`

### GAS web admin
- [x] Infinite spinner di tab `7 KAIH` sudah ditutup dengan fallback aman saat `schoolId` kosong, path tidak valid, atau subscribe RTDB gagal
- [x] Tab `7 KAIH` sekarang menampilkan pesan panduan bila sesi admin belum membawa `schoolId`
- [x] Hook roster `useGasRecords` sekarang mengosongkan data dan mematikan loading saat refresh/subscription gagal
- [x] Sidebar dashboard sekarang hanya mengaktifkan prefetch link saat production untuk membantu mencegah `ChunkLoadError` di mode development
- [x] Tab `Peringkat` pada `Virtual Pet` dirapikan agar wrapper tabel tetap stabil saat data ditampilkan
- [ ] Cek lokal/live: buka menu `7 KAIH`, spinner tidak boleh berputar terus tanpa akhir
- [ ] Cek lokal/live: bila sesi admin belum siap, panel `7 KAIH` harus menampilkan pesan fallback yang jelas
- [ ] Cek lokal/live: tab `Virtual Pet -> Peringkat` tetap rapi saat data ranking banyak
- [ ] Deploy live: perbaikan spinner/tab GAS di atas masih perlu ikut didorong ke `main` bila memang mau dilivekan

## 1. EduLock Siswa

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_20-08-release.apk`

### Login dan registrasi
- [x] Urutan field login/registrasi diubah menjadi `NPSN -> NISN -> Nama Siswa`
- [x] Kolom `Nama Siswa` tidak lagi diisi manual
- [x] Nama siswa terisi otomatis dari database setelah `NPSN` dan `NISN` valid
- [x] Validasi registrasi tetap mengikat device ke akun siswa
- [ ] Cek di HP: `NPSN benar + NISN benar` harus memunculkan nama otomatis
- [ ] Cek di HP: `NPSN benar + NISN salah` tidak boleh memunculkan nama
- [ ] Cek di HP: proses daftar tetap berhasil sesudah nama terisi otomatis

### Jam sekolah dan dashboard utama
- [x] Card `Jam Sekolah` dirapikan
- [x] Posisi `Masuk` dan `Pulang` dipindah ke sisi kiri
- [x] `Waktu Saat Ini` dipindah ke sisi kanan
- [x] Garis pembatas card diposisikan di tengah
- [ ] Cek di HP: layout card benar-benar simetris dan tidak geser di device target

### Izin dan jam sesi
- [x] Validasi kode izin sudah mengikuti `Jam Mulai - Jam Akhir`
- [x] Kode izin ditolak bila dipakai di luar rentang waktu yang ditentukan
- [x] Durasi izin di APK dipotong otomatis bila melewati jam akhir sesi
- [x] Mode Kelas EduLock sudah didukung dan dibaca realtime oleh APK siswa
- [ ] Cek di HP: kode izin benar hanya aktif dalam rentang jam yang diberikan
- [ ] Cek di HP: aktivasi izin per kelas dari web langsung terbaca tanpa input siswa

### Proteksi aplikasi
- [x] Gate EduLock tetap aktif sejak aplikasi mulai
- [x] Pengingat `pet mati` disetel muncul ulang tiap 1 menit untuk uji coba
- [x] Pengingat `pet mati` tetap dipaksa muncul di luar jam sekolah
- [x] Build uji overlay `pet mati` dinaikkan ke versi `1.3.2 (versionCode 28)` agar bisa dipasang menimpa APK uji lama
- [x] Instrumentasi runtime debug `pet-overlay-missing` dipasang pada listener pet, cabang reminder, dan activity overlay
- [x] Root cause pre-fix sudah terbukti: EduLock sebelumnya memakai alias lokal `studentId` SQLite, bukan identitas backend siswa
- [x] Build post-fix overlay `pet mati` dinaikkan lagi ke versi `1.3.3 (versionCode 29)` agar bisa menimpa build `19-47`
- [x] EduLock sekarang menyimpan `studentKey` dan `username` backend untuk pencocokan pet
- [x] User sudah mengonfirmasi overlay `pet mati` muncul pada pengujian post-fix
- [x] Instrumentasi debug sementara sudah dicabut kembali dari APK final
- [x] Interval reminder `pet mati` sudah dikembalikan ke normal `10 menit`
- [x] Device Admin yang dimatikan akan langsung memicu siswa ditendang kembali ke EduLock
- [x] Upaya masuk ke menu `Aplikasi admin perangkat` sudah diblok dan diarahkan balik
- [x] Telemetry proteksi (`Accessibility`, `Device Admin`, compliance status) dikirim ke backend monitoring
- [ ] Cek di HP: APK build `20-08` berhasil terpasang sebagai update di atas build `20-02`
- [ ] Cek di HP: setelah menekan `Saya Mengerti` pada build final, overlay pet mati muncul lagi maksimal 10 menit kemudian
- [ ] Cek di HP: buka menu `Aplikasi admin perangkat`, siswa harus langsung keluar dari menu itu
- [ ] Cek di HP: proteksi tetap hidup konsisten saat app di-background lalu dibuka lagi

### Monitoring realtime ke web
- [x] Heartbeat perangkat dikirim lebih rapat ke `active_devices`
- [x] Status proteksi dan last seen ikut dikirim ke backend
- [x] Panel `Realtime Student Monitoring` di web disetel refresh otomatis tiap 5 detik
- [ ] Cek web live: HP siswa online harus berubah cepat tanpa refresh manual
- [ ] Cek web live: saat proteksi mati, status monitoring harus ikut berubah
- [ ] Cek web live: saat HP offline, last update dan status harus turun sesuai kondisi

## 2. GAS Siswa

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_19-13-release.apk`

### Login siswa
- [x] Login siswa diubah menjadi urutan `NPSN -> NISN -> Nama Siswa`
- [x] Kolom `Nama Siswa` dibuat read-only
- [x] Nama siswa terisi otomatis dari database setelah `NPSN` dan `NISN` valid
- [ ] Cek di HP: `NPSN benar + NISN benar` harus memunculkan nama siswa otomatis
- [ ] Cek di HP: `NPSN benar + NISN salah` tidak boleh memunculkan nama siswa
- [ ] Cek di HP: login siswa tetap berhasil setelah nama siswa terisi otomatis

### Compliance dengan EduLock
- [x] GAS siswa tidak boleh dipakai bila EduLock tidak terpasang
- [x] Gate dicek sejak aplikasi mulai, termasuk sebelum siswa lolos masuk ke area utama
- [x] Overlay compliance sudah dibuat benar-benar memblokir sentuhan ke UI di bawahnya
- [ ] Cek di HP: uninstall EduLock lalu buka GAS siswa, akses harus tertahan penuh
- [ ] Cek di HP: layar login GAS siswa juga harus ikut tertahan bila EduLock tidak aktif
- [ ] Cek di HP: overlay tidak boleh bisa ditembus sentuhan

### Fitur siswa lain
- [x] Laporan 7 KAIH terkunci setelah tombol kirim dipakai
- [x] Reader Lentera Digital sudah diperbaiki agar zoom/pan lebih nyaman
- [x] Card `Prestasi` di menu Kedisiplinan siswa dihapus
- [x] Gate `pet mati` siswa memblokir interaksi sehingga siswa tidak bisa memakai GAS sampai pet direvive
- [x] Urutan menu beranda GAS siswa diubah menjadi `Absensi -> Presensi Sholat -> Lentera Digital -> 7 KAIH -> Virtual Pet -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Tools`
- [x] Menu `Catat Pelanggaran` tetap khusus petugas OSIS dan diposisikan paling akhir sesudah `Tools`
- [x] Kartu `Literasi` pada `Virtual Pet` sekarang benar-benar membuka `Tugas Literasi` siswa, bukan halaman placeholder
- [x] `Virtual Pet` yang membuka `Tugas Literasi` sekarang langsung masuk ke tab tugas, bukan ke tab katalog
- [x] Status aktivitas `E-Perpus` di `Virtual Pet` sekarang memakai target `30 menit membaca hari ini`
- [x] Tab `Peringkat` di `Virtual Pet` diperkuat dengan alias siswa `recordId/id/nisn/username` agar ranking tetap tampil walau format ID pet lama berbeda
- [x] Card `Pencapaian -> Literasi Aktif` di `Virtual Pet` sekarang juga sudah memakai teks target `30 menit`, bukan lagi teks lama `60 menit`
- [x] Menu `Catat Pelanggaran` di GAS siswa sekarang mengikuti status petugas OSIS secara realtime; jika siswa dihapus dari `Manajemen Petugas OSIS`, menu harus hilang otomatis
- [ ] Cek di HP: laporan 7 KAIH minggu berjalan tidak bisa diedit ulang setelah dikirim
- [ ] Cek di HP: PDF Lentera tetap nyaman dibaca di beberapa ukuran file
- [ ] Cek di HP: menu Kedisiplinan tidak menampilkan card `Prestasi`
- [ ] Cek di HP: saat pet mati, siswa tidak bisa berinteraksi dengan UI GAS sama sekali
- [ ] Cek di HP: urutan menu beranda GAS siswa tampil sesuai susunan baru
- [ ] Cek di HP akun OSIS: menu `Catat Pelanggaran` muncul paling akhir sesudah `Tools`
- [ ] Cek di HP: dari `Virtual Pet -> Status Aktivitas Hari Ini -> Literasi`, siswa langsung masuk ke `Tugas Literasi`
- [ ] Cek di HP: dari `Virtual Pet -> E-Perpus`, status berubah penuh saat mencapai 30 menit membaca
- [ ] Cek di HP: tab `Pencapaian` dan `Peringkat` di `Virtual Pet` sama-sama bisa dibuka dan menampilkan data nyata
- [ ] Cek di HP: card `Pencapaian -> Literasi Aktif` menampilkan `30 menit` secara konsisten pada subtitle dan progress
- [ ] Cek di HP: saat siswa dihapus dari `Manajemen Petugas OSIS`, menu `Catat Pelanggaran` hilang otomatis tanpa perlu login ulang

## 3. GAS Guru

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_17-47-release.apk`

### Tampilan data siswa dan presensi
- [x] Nama siswa pada layar guru diizinkan tampil sampai 2 baris
- [x] NISN di row yang mengganggu ruang nama sudah dihapus dari layar terkait
- [x] Tinggi row dibuat lebih adaptif untuk nama panjang
- [x] Garis pemisah antar kolom pada `Data Siswa` dibuat lebih tegas
- [x] Garis pemisah antar kolom pada `Presensi Siswa` dibuat lebih tegas
- [x] Garis pemisah antar kolom pada `Presensi Sholat` dibuat lebih tegas
- [x] Rekap bulanan `Rekapitulasi Kehadiran` guru sekarang mengikuti tabel siswa di Web Admin secara langsung dengan format `H/S/I/A`
- [x] Rekap bulanan `Rekapitulasi Kehadiran` guru sekarang memakai `student.id` kanonik seperti tabel siswa di Web Admin
- [x] Status `Terlambat/LATE` pada rekap bulanan guru sekarang dilebur ke `Hadir (H)` agar sama persis dengan tabel siswa di Web Admin
- [x] Rekap bulanan bulan berjalan tidak lagi menghitung hari masa depan sebagai `Alpa`
- [x] Rekap bulanan guru sekarang mencocokkan log absensi siswa memakai alias identitas `recordId -> id -> nisn -> username`, sehingga log yang tersimpan dengan ID berbeda tetap masuk ke siswa yang benar
- [x] Presensi Sholat guru sekarang mencocokkan siswa dengan alias identitas `recordId -> id -> nisn -> username`, sehingga log sholat lama/baru tidak hilang hanya karena beda format ID
- [x] Kolom `PET` pada `Data Siswa` guru sudah membaca `virtual_pets` realtime (bukan `-` terus) dengan pencocokan ID siswa yang benar
- [x] Label kolom `PET` guru sekarang sudah mengenali level `Sekarat` agar sinkron dengan APK siswa
- [x] Input cepat nilai kelas untuk 7 KAIH sudah tersedia
- [x] Menu `Rekapitulasi` (Rekapitulasi Kelas) sudah muncul di beranda guru dan bisa dibuka
- [x] Urutan menu beranda GAS guru diubah menjadi `Data Siswa -> Presensi Siswa -> Presensi Sholat -> Literasi & Tugas -> 7 KAIH -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Rekapitulasi`
- [ ] Cek di HP: nama panjang tidak lagi terpotong di `Data Siswa`
- [ ] Cek di HP: nama panjang tetap terbaca di `Presensi Sholat`
- [ ] Cek di HP: nama panjang tetap terbaca di `Rekapitulasi Kehadiran`
- [ ] Cek di HP: garis pemisah kolom terlihat jelas dan rapi di tiga menu guru
- [ ] Cek di HP: tab `Rekap Bulanan` sekarang menampilkan kolom `H/S/I/A` tanpa kolom `T`
- [ ] Cek di HP: angka rekap bulanan guru untuk `H/S/I/A` sama dengan tabel siswa di Web Admin pada kelas dan bulan yang sama
- [ ] Cek di HP: kasus siswa `ok` yang sebelumnya tampil `A:26` sekarang turun menjadi `A:25` dan sama dengan Web Admin + APK siswa
- [ ] Cek di HP: bulan berjalan tidak lagi menambah `Alpa` untuk tanggal yang belum terjadi
- [ ] Cek di HP: `Presensi Sholat` guru tetap membaca data siswa yang login/tersimpan dengan alias ID berbeda (`recordId/id/nisn/username`)
- [ ] Cek di HP: kolom `PET` berubah realtime mengikuti kondisi terakhir siswa (sehat/sakit/sekarat/mati) tanpa perlu relogin
- [ ] Cek di HP: input cepat nilai kelas berjalan benar lalu tetap bisa koreksi per siswa
- [ ] Cek di HP: menu `Rekapitulasi` muncul di beranda guru dan navigasi ke layar rekap berhasil
- [ ] Cek di HP: urutan menu beranda guru tampil sesuai susunan baru dengan `Rekapitulasi` di posisi paling akhir

### Login guru
- [x] Login guru diubah menjadi urutan `NPSN -> NUPTK -> Nama Guru`
- [x] Kolom `Nama Guru` dibuat read-only
- [x] Nama guru terisi otomatis dari database setelah `NPSN` dan `NUPTK` valid
- [ ] Cek di HP: `NPSN benar + NUPTK benar` harus memunculkan nama guru otomatis
- [ ] Cek di HP: `NPSN benar + NUPTK salah` tidak boleh memunculkan nama guru
- [ ] Cek di HP: login guru tetap berhasil setelah nama guru terisi otomatis

### Kedisiplinan guru
- [x] Card/menu `Pelanggaran` dan `Riwayat` tampil sejajar di bagian atas layar
- [x] Menu `Pelanggaran` sekarang berdiri sendiri dan hanya menampilkan daftar siswa
- [x] Menu `Riwayat` sekarang berdiri sendiri dan hanya menampilkan daftar riwayat terbaru
- [x] Filter dan riwayat `Kedisiplinan` guru sekarang ikut mengenali alias siswa `recordId/id/nisn/username`, sehingga record valid tidak hilang dari daftar
- [ ] Cek di HP: card `Pelanggaran` dan `Riwayat` tampil sejajar rapi
- [ ] Cek di HP: saat `Pelanggaran` aktif, list siswa tampil tanpa tercampur riwayat
- [ ] Cek di HP: saat `Riwayat` aktif, daftar riwayat tampil tanpa tercampur list siswa
- [ ] Cek di HP: record kedisiplinan otomatis/manual tetap muncul di guru walau `studentId` sumbernya bukan NISN

### Notifikasi guru
- [x] Notifikasi guru sekarang ikut mengenali alias siswa `recordId/id/nisn/username` untuk modul literasi dan bullying
- [ ] Cek di HP: notifikasi tugas literasi siswa tetap masuk ke guru walau `studentId` log tersimpan sebagai alias selain NISN
- [ ] Cek di HP: notifikasi laporan bullying siswa tetap masuk ke guru walau `reporterId/victimId/perpetratorId` tersimpan sebagai alias selain NISN

## 4. GAS Kepala

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\GAS-Kepala-2026-07-22_21-25-release.apk`

### Status saat ini
- [x] APK terbaru yang tersedia untuk `kepala` saat ini masih build `2026-07-22`
- [ ] Tentukan apakah APK `kepala` perlu ikut diaudit/perbaikan pada gelombang berikutnya

## 5. Rumah APK Final

- [x] Folder `D:\Dashboard Portal\Apk Release\OK_4` sudah dijadikan rumah file APK terbaru
- [x] File EduLock siswa terbaru di `OK_4` sudah diperbarui ke build `2026-07-30_20-08`
- [x] File GAS siswa terbaru di `OK_4` mengacu ke build `2026-07-30_17-27`
- [x] File GAS guru terbaru di `OK_4` mengacu ke build `2026-07-30_17-47`
- [x] File GAS kepala terbaru di `OK_4` masih mengacu ke build terbaru yang tersedia

## 6. Prioritas Uji Perangkat Nanti

Urutan yang disarankan saat mulai uji:
- [ ] EduLock siswa: login otomatis `NPSN + NISN -> Nama`
- [x] EduLock siswa: overlay `pet mati` berhasil diverifikasi saat proteksi sekolah aktif
- [ ] EduLock siswa: blok menu `Aplikasi admin perangkat`
- [ ] Web monitoring EduLock: status HP live
- [ ] GAS siswa: hard gate saat EduLock tidak ada / tidak aktif
- [ ] GAS guru: login otomatis guru, garis pemisah tabel, dan pemisahan menu `Pelanggaran` / `Riwayat`
