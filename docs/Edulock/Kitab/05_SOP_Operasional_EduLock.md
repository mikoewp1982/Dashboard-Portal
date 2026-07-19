# SOP Operasional - EduLock Web Admin

Dokumen ini menjaga agar operator dan tim lanjutan tidak salah memperlakukan panel EduLock yang saat ini masih campuran antara live-read dan mock action.

## 1. SOP Penggunaan Harian

1. Login sebagai admin tenant sekolah yang benar.
2. Masuk ke `/dashboard/edulock`.
3. Gunakan panel berikut sebagai sumber baca yang relatif aman:
   - `Manajemen Kelas`
   - `Data Siswa` untuk direktori dasar, export, dan reset binding
   - `Pengaturan Zona`
   - bagian jadwal/hari libur/lokasi pada `Pengaturan Sistem & Keamanan`
   - `Dashboard EduLock` dan `Realtime Monitoring` untuk snapshot runtime yang memang tersedia

## 2. SOP Panel yang Belum Boleh Dianggap Produksi Final

Panel berikut **belum boleh dianggap mutasi produksi sungguhan**:

- Kelola Kode Akses
- izin uninstall dan toggle uninstall di Data Siswa
- master switch, mode acara, dan kebijakan GPS

## 3. Aturan Operasional

1. Jangan gunakan tombol mock sebagai dasar keputusan lapangan.
2. Dashboard dan monitoring boleh dipakai sebagai snapshot runtime, tetapi hanya akan penuh bila telemetry `active_devices` benar-benar hidup di tenant.
3. Jangan mengumumkan ke sekolah bahwa EduLock sudah live penuh sebelum telemetry dan backend mutasi selesai.
4. Jika perlu demo, jelaskan bahwa sebagian panel sudah operasional minimum, sedangkan sebagian mutasi masih menunggu backend final.

## 4. SOP Audit Jika Terjadi Kebingungan Data

1. Jika kelas/siswa tidak tampil, cek data tenant GAS lebih dulu.
2. Jika lokasi atau jadwal berbeda, cek sumber resmi GAS Presensi.
3. Jika monitoring kosong, cek apakah tenant sudah mengirim data ke `active_devices`.
4. Jika reset binding diperlukan, jalankan dari panel `Data Siswa`, lalu minta siswa login ulang di perangkat sah.

## 5. Next Action untuk Tim Teknis

1. Tetapkan schema final telemetry device path.
2. Lengkapi mutasi `/api/admin/edulock/...` untuk uninstall, permission, dan kebijakan keamanan.
3. Tambahkan audit log persisten tenant.
4. Setelah semua terhubung, revisi PRD, handoff, matriks role, dan SOP ini agar statusnya naik menjadi operasional penuh.
