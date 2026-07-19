# Product Requirements Document (PRD) - Lentera Digital (Web Dashboard)

## 1. Pendahuluan
Lentera Digital adalah modul perpustakaan elektronik dan pemantauan literasi sekolah. Modul ini memungkinkan administrator perpustakaan atau guru untuk mengelola katalog buku, memantau sirkulasi peminjaman, serta memverifikasi laporan membaca (tugas literasi) yang dikirimkan oleh siswa.

Dokumen ini mendefinisikan persyaratan teknis untuk perombakan dan modularisasi halaman *Lentera Digital Admin Panel* pada ekosistem *Dashboard Portal*.

## 2. Tujuan Pengembangan
1. **Pembersihan Data Operasional**: Mengurangi *mock data* dan status statis pada area operasional utama, lalu menggantinya dengan integrasi ke sumber data GAS yang relevan.
2. **Modularisasi Kode**: Memecah file referensi tunggal berukuran raksasa (>2800 baris kode) menjadi komponen-komponen panel terpisah (`panels/`) agar mudah dipelihara (Maintainable).
3. **Presisi UI (*Pixel-Perfect*)**: Mempertahankan tata letak, warna gelap yang elegan (*dark glass-effect*), tata letak *sidebar* khusus Lentera, dan komposisi menu agar 100% identik dengan sumber referensi asli.

## 3. Ruang Lingkup Fitur (Panel)

### 3.1 Dashboard Panel (`LenteraDashboardPanel.tsx`)
- Menampilkan ringkasan data agregat literasi dan perpustakaan.
- Metrik mencakup: Siswa Aktif, Hari Aktif Lentera, Total Peminjaman.

### 3.2 Peminjaman (`LenteraLoansPanel.tsx`)
- Menampilkan daftar transaksi peminjaman aktif maupun riwayat.
- Menampilkan 3 metrik utama: Koleksi Judul, Sedang Dipinjam, dan Terlambat Pengembalian.
- Tabel *real-time* yang langsung tersinkronisasi bila siswa memindai QR code dari aplikasi seluler mereka.

### 3.3 Kelola Literasi (`LenteraTasksPanel.tsx`)
- Fitur penugasan literasi untuk siswa.
- Tab navigasi khusus di dalam panel: **Daftar Tugas**, **Perlu Dinilai**, dan **Riwayat**.
- Daftar tabel tugas menampilkan Judul, Poin, Durasi, Status, Dibuat Pada, serta fungsi Aksi (Tarik Kembali/Terbitkan, Hapus).

### 3.4 Data Anggota (`LenteraMembersPanel.tsx`)
- Daftar anggota perpustakaan yang aktif, tersinkronisasi otomatis dari basis data utama siswa sekolah (`useStudentsRealtime`).

### 3.5 Statistik Siswa (`LenteraStatsPanel.tsx`)
- Analitik rekapan aktivitas literasi komprehensif bagi kepala sekolah atau pustakawan.

## 4. Prasyarat Sistem
- **Tumpukan Teknologi**: Next.js App Router, Tailwind CSS, Zustand, Firebase Realtime Database.
- **Arsitektur Data**: Menggunakan *custom hooks* (seperti `useGasLibrary.ts`) untuk membaca Firestore, RTDB, dan endpoint admin yang terkait dengan modul perpustakaan/literasi.

## 5. Status Implementasi Terkini

Status faktual saat ini:

1. Struktur modular Lentera sudah nyata di kode dan tidak lagi bergantung pada satu file raksasa.
2. Panel utama yang aktif di workspace saat ini:
   - `dashboard`
   - `loans`
   - `tasks`
   - `members`
   - `stats`
3. Navigasi aktif sekarang hanya menampilkan panel yang memang benar-benar dirender.
4. Integrasi data sudah berjalan di beberapa area, tetapi belum seluruhnya berbasis *realtime listener*.
5. Ringkasan utama dashboard sudah dihitung dari data aktual periode terpilih.
