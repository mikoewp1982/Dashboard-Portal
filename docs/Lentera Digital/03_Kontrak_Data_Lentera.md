# Kontrak Data - Lentera Digital

Dokumen ini merangkum sumber data aktual yang dipakai modul web admin Lentera Digital saat ini.

## 1. Prinsip Umum

- Tenant harus selalu mengikuti `schoolId` aktif admin.
- Jangan membuat sumber kebenaran baru di luar jalur yang sudah dipakai hook dan API saat ini.
- Status modul saat ini masih hybrid: ada yang langsung baca database, ada yang lewat API admin.

## 2. Sumber Data Aktif

### A. Tugas Literasi

- Sumber: Firestore
- Koleksi:
  - `schools/{schoolId}/library_tasks`
- Dipakai oleh:
  - `useGasLibrary(schoolId)`
- Operasi aktif:
  - baca daftar tugas
  - tambah tugas
  - ubah status tugas
  - hapus tugas

### B. Buku Perpustakaan

- Sumber: Realtime Database
- Path:
  - `gas/schools/{schoolId}/library/books`
- Dipakai oleh:
  - `useGasLibrary(schoolId)`
- Operasi aktif:
  - baca daftar buku

### C. Riwayat Peminjaman

- Sumber: Realtime Database
- Path:
  - `gas/schools/{schoolId}/library/borrowRecords`
- Dipakai oleh:
  - `useGasLibrary(schoolId)`
- Operasi aktif:
  - baca riwayat pinjam/kembali

### D. Laporan Literasi

- Sumber: API admin
- Endpoint:
  - `/api/admin/library-monitoring?schoolId={schoolId}`
- Dipakai oleh:
  - `useGasLibrary(schoolId)`
- Operasi aktif:
  - baca daftar laporan literasi

### E. Direktori Siswa

- Sumber: Realtime Database via hook umum
- Jalur logis:
  - `gas/schools/{schoolId}/students/...`
- Dipakai oleh:
  - `useStudentsRealtime(schoolId)`
- Operasi aktif:
  - sinkron nama siswa
  - sinkron kelas siswa

## 3. Catatan Penting

- Lentera saat ini belum boleh diklaim realtime penuh di semua panel.
- Ringkasan utama dashboard sudah memakai perhitungan data aktual, tetapi arsitektur pengambilan datanya masih hybrid dan belum seluruhnya listener-based.
- Jika tim menambah panel baru di navigasi Lentera, kontrak datanya wajib ditulis lebih dulu sebelum dipublikasikan sebagai fitur operasional.
