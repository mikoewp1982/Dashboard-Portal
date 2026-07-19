# Alur Operasional dan SOP Admin Sekolah: DATABASE

## 1. Tujuan Dokumen

Dokumen ini menjelaskan SOP operasional untuk penggunaan halaman DATABASE oleh Admin Sekolah.

Fungsi dokumen:

1. menjadi panduan operasional harian admin sekolah
2. menjadi rambu developer agar alur tidak melenceng dari praktik bisnis
3. menjaga konsistensi proses pengelolaan data akun sekolah

Dokumen ini melengkapi:

- `01_PRD_ADMIN_DATABASE_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_DATABASE.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_DATABASE.md`
- `04_MATRIKS_ROLE_DAN_HAK_AKSES_ADMIN_DATABASE.md`

---

## 2. Prinsip Operasional Umum

Prinsip kerja Admin Sekolah pada modul DATABASE:

1. DATABASE hanya untuk data induk akun
2. perubahan data harus dilakukan hati-hati karena akan berpengaruh ke login user
3. admin hanya mengelola tenant/sekolah miliknya sendiri
4. perubahan data siswa, guru, OSIS, dan kelas harus mengikuti struktur final yang sudah dikunci

---

## 3. Skenario Operasional Utama

Skenario inti:

1. melihat ringkasan overview
2. menambah siswa
3. mengubah siswa
4. menghapus siswa
5. membersihkan data lulusan kelas 9
6. menambah guru
7. menambah petugas OSIS
8. menambah kelas paralel
9. memperbarui data akun induk

---

## 4. SOP Membuka dan Memeriksa Dashboard Overview

### Tujuan

Melihat gambaran cepat jumlah akun aktif sekolah.

### Langkah

1. admin masuk ke halaman DATABASE
2. pilih `Dashboard Overview`
3. cek jumlah:
   - siswa aktif
   - guru aktif
   - petugas OSIS aktif
4. cek `Terakhir disinkronisasi`

### Tujuan operasional

- memastikan data induk sekolah terbaca normal
- memantau perubahan data utama

---

## 5. SOP Menambah Siswa

### Tujuan

Menambahkan data induk akun siswa baru.

### Langkah

1. buka tab `Siswa`
2. klik `Tambah Siswa`
3. isi:
   - NISN
   - L/P
   - Agama
   - Nama Siswa
   - Kelas
4. simpan
5. verifikasi siswa muncul di tabel

### Validasi operasional

- NISN benar
- nama benar
- kelas benar
- data bukan duplikasi yang tidak disengaja

### Dampak bisnis

Data ini akan menjadi dasar login siswa:

- username = nama siswa
- password = NISN

---

## 6. SOP Mengubah Data Siswa

### Tujuan

Memperbaiki data induk siswa jika terjadi kesalahan.

### Langkah

1. buka tab `Siswa`
2. cari siswa yang akan diperbarui
3. klik edit
4. perbarui field yang diperlukan
5. simpan
6. cek perubahan pada tabel

### Catatan penting

Karena nama dan NISN terhubung dengan login, perubahan data harus dilakukan hati-hati.

---

## 7. SOP Menghapus Siswa

### Tujuan

Menghapus data siswa yang memang tidak diperlukan lagi atau salah input.

### Kapan dilakukan

- data ganda
- salah input fatal
- siswa tidak semestinya tercatat

### Langkah

1. buka tab `Siswa`
2. pilih siswa yang akan dihapus
3. klik hapus
4. konfirmasi
5. verifikasi data hilang dari tabel

### Catatan

Penghapusan siswa dapat berdampak ke role OSIS jika siswa tersebut juga tercatat sebagai petugas OSIS.

---

## 8. SOP Membersihkan Data Lulusan Kelas 9

### Tujuan

Menghapus permanen data siswa kelas 9 yang sudah lulus, agar database tetap ringan.

### Keputusan bisnis yang sudah dikunci

- siswa kelas 9 lulus = hapus permanen

### Langkah operasional yang disarankan

1. buka tab `Siswa`
2. filter atau identifikasi siswa kelas 9
3. pastikan data yang dipilih benar-benar lulusan
4. lakukan penghapusan terkontrol
5. cek apakah data petugas OSIS terkait juga sudah tidak tertinggal

### Larangan

- jangan hapus tanpa verifikasi kelas
- jangan hapus data campuran yang masih aktif

### Tujuan akhir

- database tetap ringan
- tidak menumpuk data lama

---

## 9. SOP Menggunakan Tombol Header Siswa

### 9.1 Muat Ulang Data

Digunakan saat admin ingin memastikan tampilan memakai data terbaru.

### 9.2 Hapus Semua

Digunakan hanya dalam kasus sangat spesifik.

Larangan:

- jangan dipakai tanpa verifikasi
- jangan dipakai untuk tab selain siswa

### 9.3 Import Excel

Digunakan saat ada proses pemasukan data siswa massal.

### 9.4 Download Template

Digunakan agar format data impor tetap konsisten.

---

## 10. SOP Menambah Guru / Wali Kelas

### Tujuan

Menambahkan data induk akun guru baru.

### Langkah

1. buka tab `Guru / Wali Kelas`
2. klik tambah
3. isi:
   - NUPTK
   - Kelas
   - Nama Guru
4. simpan
5. verifikasi data masuk ke tabel

### Dampak bisnis

Data ini menjadi dasar login guru:

- username = nama guru
- password = NUPTK

---

## 11. SOP Mengubah atau Menghapus Guru

### Langkah edit

1. buka tab guru
2. pilih data
3. klik edit
4. simpan perubahan

### Langkah hapus

1. buka tab guru
2. pilih data
3. klik hapus
4. konfirmasi

### Catatan

Karena terkait login, nama, NUPTK, dan kelas harus benar.

---

## 12. SOP Menambah Petugas OSIS

### Tujuan

Menetapkan siswa yang memiliki hak tambahan sebagai petugas OSIS.

### Langkah

1. buka tab `Petugas OSIS`
2. klik tambah
3. isi NISN
4. pastikan sistem menampilkan data siswa yang cocok
5. isi jabatan jika perlu
6. simpan

### Validasi wajib

- NISN harus ditemukan di data siswa
- jika tidak ditemukan, data tidak boleh disimpan

### Catatan bisnis

OSIS bukan akun baru, tetapi role tambahan dari akun siswa.

---

## 13. SOP Mengubah atau Menghapus Petugas OSIS

### Edit

1. buka tab OSIS
2. pilih data
3. edit jabatan atau status yang diperlukan
4. simpan

### Hapus

1. buka tab OSIS
2. pilih data
3. hapus
4. konfirmasi

### Dampak bisnis

- siswa tetap ada
- hanya role tambahan OSIS yang dihilangkan

---

## 14. SOP Menambah Kelas Paralel

### Tujuan

Membentuk daftar kelas yang akan dipakai oleh siswa dan guru.

### Langkah

1. buka tab `Kelas Paralel`
2. pilih tingkat:
   - Kelas 7
   - Kelas 8
   - Kelas 9
3. klik tambah
4. isi nama kelas akhir, misalnya `D`
5. simpan
6. verifikasi hasil menjadi:
   - `VII-D`
   - `VIII-D`
   - `IX-D`

### Aturan

- hanya sampai kelas 9
- admin tidak perlu menulis nama kelas penuh bila pola auto-prefix aktif

---

## 15. SOP Mengubah atau Menghapus Kelas Paralel

### Edit

1. buka tab kelas
2. pilih kelas
3. klik edit
4. simpan

### Hapus

1. buka tab kelas
2. pilih kelas
3. klik hapus
4. konfirmasi

### Catatan

Perubahan kelas bisa berdampak ke siswa dan guru yang memakai referensi kelas itu.

---

## 16. SOP Verifikasi Setelah Perubahan Data

Setelah create, update, atau delete, admin disarankan:

1. cek tabel domain yang berubah
2. cek `Terakhir disinkronisasi`
3. cek apakah data yang tampil sesuai
4. bila perlu, gunakan `Muat Ulang Data`

---

## 17. SOP Penanganan Kesalahan Data

Jika admin menemukan data tidak sesuai:

1. cek apakah tab yang aktif benar
2. cek apakah tenant yang dipakai memang tenant sekolah itu
3. cek apakah data sumber siswa/guru/kelas benar
4. lakukan edit bila kesalahan kecil
5. lakukan hapus bila data memang salah/ganda

---

## 18. Larangan Operasional

Dilarang:

1. memakai DATABASE untuk data di luar akun induk
2. menambah OSIS tanpa basis siswa
3. membuat kelas di luar 7-9
4. memakai tombol massal di tab selain siswa
5. menghapus siswa tanpa memahami dampaknya ke login

---

## 19. Checklist Admin Sebelum Menyimpan Perubahan

Admin wajib memastikan:

1. data yang diisi benar
2. submenu yang dipakai sesuai domain
3. NISN/NUPTK benar
4. kelas benar
5. data tidak salah tenant
6. perubahan tidak mengganggu akun yang masih aktif

---

## 20. Kesimpulan

Modul DATABASE adalah titik paling penting untuk akun sekolah. Karena itu SOP penggunaannya harus disiplin agar:

1. data login tetap konsisten
2. integrasi ke APK tidak rusak
3. database tetap ringan
4. operasional sekolah tetap rapi

Status dokumen:

- **Aktif**
- **Acuan SOP operasional Admin Sekolah untuk modul DATABASE**
