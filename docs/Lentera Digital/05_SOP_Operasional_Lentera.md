# SOP Operasional - Lentera Digital

Dokumen ini ditujukan untuk operator dan tim lanjutan agar penggunaan modul Lentera tetap sesuai status implementasi aktual.

## 1. SOP Harian

1. Login sebagai admin tenant sekolah yang benar.
2. Masuk ke `/dashboard/lentera`.
3. Gunakan panel:
   - `Dashboard` untuk ringkasan umum
   - `Peminjaman` untuk melihat transaksi
   - `Kelola Literasi` untuk tugas dan penilaian
   - `Data Anggota` untuk memeriksa keanggotaan siswa
   - `Statistik` untuk rekap
4. Jika ada ketidaksesuaian data siswa, cek direktori siswa GAS terlebih dahulu.

## 2. SOP Kelola Tugas Literasi

1. Buat atau ubah tugas hanya dari panel `Kelola Literasi`.
2. Pastikan `schoolId` tenant sudah benar sebelum menerbitkan tugas.
3. Gunakan aksi tarik kembali atau hapus hanya untuk tugas yang memang salah terbit.

## 3. SOP Audit Data

1. Jika data pinjam atau buku tidak sesuai, cek node:
   - `gas/schools/{schoolId}/library/books`
   - `gas/schools/{schoolId}/library/borrowRecords`
2. Jika data laporan literasi tidak sesuai, cek endpoint admin `library-monitoring`.
3. Jika nama siswa tidak cocok, cek sinkronisasi direktori siswa tenant.

## 4. Larangan Operasional

- Jangan mengklaim semua panel Lentera realtime penuh.
- Jangan mempublikasikan panel yang belum benar-benar tersambung ke workspace dan kontrak data.
- Jangan menganggap semua data Lentera listener-based, karena arsitekturnya masih hybrid.

## 5. Next Action untuk Tim Teknis

1. Bersihkan komponen orphan agar dokumen dan kode tidak drift.
2. Jika menambah panel baru, siapkan kontrak data dan SOP-nya lebih dulu.
3. Bila ingin status modul naik ke live penuh, ubah jalur data hybrid menjadi listener atau refresh strategy yang konsisten dan terdokumentasi.
