# Matriks Role - Lentera Digital

Dokumen ini menjadi batas operasional role untuk modul web admin Lentera Digital.

## 1. Role Utama

### A. Admin Sekolah

- Boleh membuka seluruh panel Lentera yang sudah aktif.
- Boleh membuat, menerbitkan, menarik kembali, dan menghapus tugas literasi.
- Boleh memantau data anggota, peminjaman, dan statistik.
- Tidak boleh mempublikasikan panel baru sebelum renderer dan kontrak datanya benar-benar aktif.

### B. Guru / Pustakawan

- Boleh membaca data operasional yang memang diberikan oleh halaman/admin tenant.
- Boleh melakukan penilaian atau verifikasi jika jalur UI dan otorisasinya memang diaktifkan oleh implementasi final.
- Tidak boleh membuat kontrak data baru di luar jalur Lentera yang sudah disepakati.

### C. Kepala Sekolah

- Fokus pada pembacaan ringkasan, statistik, dan monitoring.
- Tidak dijadikan operator utama untuk mutasi harian tugas atau katalog.

## 2. Matriks Akses Ringkas

| Area | Admin Sekolah | Guru/Pustakawan | Kepala Sekolah |
|---|---|---|---|
| Dashboard | Ya | Ya | Ya |
| Peminjaman | Ya | Ya | Baca |
| Kelola Literasi | Ya | Ya (sesuai wewenang) | Baca |
| Data Anggota | Ya | Ya | Baca |
| Statistik | Ya | Ya | Ya |

## 3. Catatan Kendali

- Semua akses tetap tunduk pada tenant sekolah aktif.
- Jika implementasi role di aplikasi berbeda dari matriks ini, tim wajib memperbarui dokumen ini sebelum serah terima berikutnya.
