# Alur Operasional dan SOP Admin Sekolah: GAS

## 1. Tujuan Dokumen

Dokumen ini menjelaskan SOP operasional untuk penggunaan halaman GAS oleh Admin Sekolah.

Fungsi dokumen:

1. menjadi panduan operasional harian admin sekolah
2. menjadi rambu developer agar alur tidak melenceng dari proses bisnis
3. menjaga konsistensi penggunaan tiap submenu GAS

Dokumen ini melengkapi:

- `01_PRD_ADMIN_GAS_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md`
- `04_MATRIKS_ROLE_DAN_HAK_AKSES_ADMIN_GAS.md`

---

## 2. Prinsip Operasional Umum

Prinsip kerja Admin Sekolah pada modul GAS:

1. GAS adalah pusat operasional harian sekolah
2. identitas akun tetap berasal dari DATABASE
3. admin hanya mengelola tenant miliknya sendiri
4. aksi sensitif harus dipahami dampaknya sebelum dijalankan
5. halaman berat harus dipakai dengan filter agar sistem tetap ringan

---

## 3. Skenario Operasional Utama

Skenario inti:

1. memeriksa daftar siswa dan guru operasional
2. memonitor presensi harian
3. menginput presensi manual bila diperlukan
4. melihat rekap presensi
5. mencatat pelanggaran
6. memantau dan mengelola Virtual Pet
7. mengelola aktivitas literasi
8. menindaklanjuti laporan Halo Spentgapa
9. memonitor nilai karakter Seven Habits

---

## 4. SOP Membuka Modul GAS

### Tujuan

Memastikan admin berada di tenant dan menu yang benar sebelum menjalankan operasi.

### Langkah

1. admin login ke web admin sekolah
2. buka menu `GAS`
3. pastikan sesi tenant sesuai sekolah aktif
4. pilih submenu yang sesuai kebutuhan operasional

### Checklist awal

- tenant benar
- role benar
- kelas atau filter yang dipilih sesuai kebutuhan

---

## 5. SOP Memeriksa Students

### Tujuan

Memastikan siswa operasional yang dipakai oleh modul GAS sudah siap dan sesuai referensi DATABASE.

### Langkah

1. buka submenu `Students`
2. gunakan filter kelas bila perlu
3. cek siswa aktif
4. pastikan data yang muncul konsisten dengan data induk

### Catatan penting

- jika identitas siswa salah, perbaikannya tetap kembali ke modul DATABASE
- submenu ini bukan tempat membuat akun dasar baru

---

## 6. SOP Memeriksa Teachers

### Tujuan

Memastikan guru operasional siap dipakai untuk presensi, penilaian, dan proses lain di GAS.

### Langkah

1. buka submenu `Teachers`
2. filter kelas atau kelompok guru jika diperlukan
3. verifikasi data guru aktif
4. pastikan relasi kelas sesuai kebutuhan operasional

### Catatan

- jika identitas guru salah, perbaikannya dilakukan dari DATABASE

---

## 7. SOP Monitoring Attendance Harian

### Tujuan

Melihat kehadiran siswa per hari dan per kelas.

### Langkah

1. buka submenu `Attendance`
2. pilih tanggal aktif
3. pilih kelas
4. cek status hadir, terlambat, izin, sakit, atau alpha
5. pantau perubahan bila halaman memang menggunakan mode realtime terbatas

### Tujuan operasional

- memastikan kelas terpantau
- mendeteksi masalah kehadiran sejak awal

### Catatan penting

- hindari membuka data sekolah penuh tanpa filter pada jam sibuk

---

## 8. SOP Input Manual Attendance

### Tujuan

Mengoreksi atau menambahkan presensi ketika input mandiri tidak tercatat atau tidak memungkinkan.

### Langkah

1. buka submenu `Attendance`
2. pilih kelas dan tanggal
3. pilih siswa yang akan diperbarui
4. input status:
   - `PRESENT`
   - `LATE`
   - `ALPHA`
   - `IZIN`
   - `SAKIT`
5. tambahkan catatan bila perlu
6. simpan
7. verifikasi hasil pada daftar kehadiran

### Aturan

- input manual harus dilakukan hati-hati
- guru hanya boleh input manual untuk kelas yang diampu
- admin tetap harus menjaga school scope

---

## 9. SOP Memeriksa Attendance Report

### Tujuan

Melihat rekap presensi periodik untuk kebutuhan evaluasi dan administrasi.

### Langkah

1. buka submenu `Attendance Report`
2. pilih bulan atau periode
3. pilih filter kelas bila perlu
4. pilih siswa bila perlu
5. tampilkan rekap
6. lakukan export jika fitur sudah aktif

### Catatan

- halaman ini tidak perlu dipakai realtime penuh
- biasakan memakai filter sebelum menampilkan data

---

## 10. SOP Mencatat Discipline

### Tujuan

Mencatat pelanggaran siswa dengan benar dan terukur.

### Langkah

1. buka submenu `Discipline`
2. pilih siswa
3. pilih jenis pelanggaran
4. isi poin pelanggaran
5. isi catatan jika perlu
6. simpan
7. verifikasi riwayat pelanggaran masuk

### Dampak bisnis

- pencatatan disiplin dapat memengaruhi kondisi Virtual Pet

### Larangan

- jangan input poin tanpa dasar yang jelas
- jangan salah memilih siswa atau kelas

---

## 11. SOP Monitoring Virtual Pet

### Tujuan

Memantau kondisi pet siswa sebagai refleksi gamifikasi perilaku.

### Langkah

1. buka submenu `Virtual Pet`
2. filter kelas bila perlu
3. cek status pet tiap siswa
4. identifikasi siswa atau kelas yang memerlukan tindakan

### Tujuan operasional

- melihat dampak presensi dan disiplin secara ringkas
- membantu admin menjaga engagement dan pembinaan

---

## 12. SOP Reward / Penalty Massal Virtual Pet

### Tujuan

Menjalankan penyesuaian massal pada pet secara terkontrol.

### Langkah

1. buka submenu `Virtual Pet`
2. pilih siswa yang akan diproses
3. pilih jenis aksi:
   - `REWARD`
   - `PENALTY`
4. pilih field yang akan diubah
5. isi nilai perubahan
6. isi alasan
7. simpan
8. verifikasi jumlah siswa yang berhasil diproses

### Aturan

- maksimal 500 siswa per panggilan function
- alasan wajib diisi agar jejak perubahan jelas

---

## 13. SOP Revive Virtual Pet

### Tujuan

Menghidupkan kembali pet siswa berdasarkan keputusan operasional yang sah.

### Langkah

1. buka submenu `Virtual Pet`
2. pilih siswa yang pet-nya perlu di-revive
3. isi alasan revive
4. jalankan aksi
5. verifikasi status menjadi `ALIVE`

### Catatan

- aksi ini sensitif dan sebaiknya tercatat pada audit log

---

## 14. SOP Mengelola Library

### Tujuan

Mengatur aktivitas literasi dan inventaris yang terkait dengan pembelajaran.

### Langkah umum

1. buka submenu `Library`
2. tambah atau pilih item inventaris/tugas
3. isi detail yang diperlukan
4. simpan
5. verifikasi data tampil sesuai filter kelas atau status

### Operasional yang umum

- membuat tugas literasi
- memantau status tugas
- memeriksa inventaris buku

---

## 15. SOP Menangani Halo Spentgapa

### Tujuan

Menerima dan memproses laporan internal sekolah dengan menjaga privasi pelapor.

### Langkah

1. buka submenu `Halo Spentgapa`
2. lihat daftar laporan berdasarkan status
3. buka detail laporan yang perlu ditangani
4. cek prioritas dan kategori
5. tetapkan tindak lanjut
6. ubah status proses bila diperlukan
7. simpan perubahan

### Aturan penting

- jangan membuka detail sensitif tanpa kebutuhan operasional
- jangan menyebarkan identitas pelapor sembarangan
- semua penanganan harus tetap dalam tenant sekolah itu sendiri

---

## 16. SOP Mengelola Seven Habits

### Tujuan

Mencatat dan memantau perkembangan karakter siswa.

### Langkah

1. buka submenu `Seven Habits`
2. pilih mode `Monitoring` atau `Penilaian`
3. pilih jenjang, kelas, siswa, bulan, minggu, atau hari sesuai kebutuhan
4. pada mode `Monitoring`, cek log kebiasaan harian siswa
5. pada mode `Penilaian`, buka rubric guru untuk siswa yang dinilai
6. isi nilai:
   - `honesty`
   - `behavior`
   - `initiative`
   - `commitment`
7. simpan
8. verifikasi hasil penilaian tampil sesuai periode
9. bila diperlukan, gunakan `Export Excel` atau `Cetak Laporan`

### Catatan

- guru hanya boleh menilai kelas yang menjadi tanggung jawabnya
- admin dapat memantau hasil secara lebih luas di tenant sekolahnya
- formula aktif yang harus dipahami operator:
  - `Konsistensi Harian` 40%
  - `Progress Mingguan` 30%
  - `Pencapaian Bulanan` 20%
  - `Nilai Guru` 10%
- operator tidak boleh lagi memakai acuan grading lama berbasis `Kehadiran/Sholat/Literasi`

---

## 17. SOP Verifikasi Setelah Mutasi

Setelah menjalankan aksi penting, admin disarankan:

1. cek daftar domain yang berubah
2. cek filter yang aktif
3. cek status hasil mutasi
4. pastikan tidak ada perubahan di tenant yang salah
5. bila perlu, lakukan refresh tampilan

---

## 18. SOP Penanganan Data Tidak Sesuai

Jika admin menemukan data tidak sesuai:

1. cek apakah filter kelas atau periode sudah benar
2. cek apakah tenant yang aktif memang tenant sekolah itu
3. cek apakah sumber datanya berasal dari DATABASE atau transaksi GAS
4. jika masalah identitas, perbaiki dari DATABASE
5. jika masalah operasional, koreksi dari submenu GAS terkait

---

## 19. Larangan Operasional

Dilarang:

1. memakai GAS untuk membuat identitas akun dasar baru
2. membuka laporan besar tanpa filter saat tidak perlu
3. melakukan aksi massal tanpa konfirmasi
4. memproses Halo Spentgapa tanpa menjaga privasi
5. menginput data operasional di tenant yang salah

---

## 20. Checklist Admin Sebelum Menyimpan Perubahan

Admin wajib memastikan:

1. submenu yang dipakai sudah benar
2. siswa, guru, kelas, atau periode yang dipilih sudah benar
3. perubahan memang perlu dilakukan
4. alasan perubahan jelas untuk aksi sensitif
5. perubahan tidak melanggar school scope

---

## 21. Kesimpulan

Modul GAS adalah pusat operasional harian sekolah. Karena itu SOP penggunaannya harus disiplin agar:

1. operasional sekolah tetap tertata
2. data transaksi tidak merusak data induk
3. performa sistem tetap ringan
4. integrasi ke APK GAS berjalan mulus
5. tenant tetap aman dan terisolasi

Status dokumen:

- **Aktif**
- **Acuan SOP operasional Admin Sekolah untuk modul GAS**
