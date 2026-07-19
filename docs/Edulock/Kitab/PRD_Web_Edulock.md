# Product Requirements Document (PRD) - EduLock Web Admin
**Versi:** 1.3 (Audit Status Implementasi + Operasional Minimum)
**Tanggal:** 17 Juli 2026

## 1. Pendahuluan
EduLock Web Admin adalah modul antarmuka (dashboard) khusus bagi Admin Sekolah untuk memantau, mengelola, dan mengonfigurasi keamanan perangkat (*device security*) siswa melalui sistem EduLock. Modul ini terintegrasi ke dalam ekosistem "Dashboard Portal Satu Pintu", namun memiliki pengalaman visual dan fungsional yang terisolasi dan spesifik.

## 2. Tujuan & Lingkup
- Memberikan visibilitas *real-time* kepada admin sekolah terkait status aplikasi EduLock di HP siswa (Online, Offline, Out of Zone).
- Memberikan kontrol penuh atas kebijakan keamanan (penguncian, peringatan, jam efektif).
- Memfasilitasi manajemen darurat (Kode Bypass, Uninstall Authorization).
- **Status Saat Ini:** UI telah selesai dibangun dengan gaya arsitektur modular (*Next.js Components*), tetapi integrasi data **belum seragam di semua panel**. Sebagian panel sudah membaca data live dari GAS, sementara sebagian panel lain masih berupa *stateful UI*, simulasi, atau placeholder untuk mutasi backend EduLock yang belum dibuat.

## 3. Desain & Tema Visual
- **Tema:** Dark Theme (Mode Gelap).
- **Gaya:** Glassmorphism (efek kaca tembus pandang dengan batas *border* putih tipis, `.glass-surface`).
- **Aksen Warna:** Indigo, Fuchsia, dan Emerald melalui *radial gradients*.
- **Navigasi:** Sidebar independen khusus EduLock (bukan sidebar generik Portal), memberikan kesan eksklusif dan terfokus. Menu dilengkapi interaksi kursor tangan saat disorot.

## 4. Fitur & Panel Modul

### 4.1 Dashboard Overview
- Menampilkan metrik utama (*high-level stats*): jumlah siswa online, siswa di luar zona, dan total sesi aktif.
- **Status implementasi saat ini:** dashboard sudah membaca snapshot nyata dari:
  - `tenant_registry/{schoolId}`
  - `active_devices/{schoolId}`
  - `daily_attendance_mirror/{schoolId}`
  - direktori siswa GAS untuk menghitung binding perangkat
- Jika telemetry `active_devices` belum hidup, angka online dan lokasi tetap akan nol secara jujur, bukan mock.

### 4.2 Realtime Monitoring
- Menampilkan tabel status siswa berdasarkan rombel dengan basis direktori kelas dan siswa dari GAS.
- **Status implementasi saat ini:** daftar siswa dan filter kelas live dari GAS. Status monitoring sekarang bersifat hybrid:
  - `ONLINE` bila ada heartbeat perangkat di `active_devices`
  - `TERIKAT` bila siswa sudah punya binding device tetapi telemetry belum masuk
  - `BELUM BINDING` bila belum ada ikatan perangkat
- Baterai, GPS, trust score, dan lokasi dibaca jika field-nya memang tersedia pada telemetry runtime.

### 4.3 Kelola Kode Izin (Kode Akses)
- Menampilkan UI pembuatan kode OTP / bypass sementara dan daftar kode aktif beserta *QR Code*.
- **Status implementasi saat ini:** masih *stateful UI* lokal, belum menjadi *source of truth* backend sekolah.

### 4.4 Pengaturan Zona (Geofencing)
- Halaman *Read-Only* yang menampilkan Latitude, Longitude, dan Radius sekolah.
- **Terintegrasi Penuh:** Membaca *source of truth* secara *live* dari pengaturan lokasi di modul **GAS Presensi** (melalui `useGasSettings`), sehingga dijamin tidak terjadi *mismatch*.

### 4.5 Data Siswa
- Manajemen data siswa spesifik untuk EduLock.
- Sinkronisasi data nama, kelas, dan NISN secara *realtime* dari tabel siswa GAS.
- **Status implementasi saat ini:** data direktori siswa sudah live.
- Aksi yang sudah operasional:
  - `Export` data siswa
  - `Reset Binding Device` dengan membersihkan `device` dan `deviceId`
- Aksi yang masih menunggu backend final:
  - izin uninstall
  - toggle uninstall

### 4.6 Manajemen Kelas
- Menampilkan daftar rombel yang aktif.
- Menarik *dropdown* kelas langsung dari data Portal GAS. Tombol kelola eksternal telah dihapuskan demi fokus antarmuka yang bersih.

### 4.7 Audit Log Pelanggaran
- Tabel riwayat insiden pelanggaran keamanan.
- **Status implementasi saat ini:** panel tidak lagi memakai simulasi UI.
- Panel menampilkan alert runtime yang benar-benar aktif dari telemetry EduLock, misalnya:
  - `OUT_OF_ZONE`
  - `EMERGENCY_UNLOCK`
  - `UNINSTALL_BYPASS`
- Riwayat audit persisten jangka panjang masih menunggu backend log tenant.

### 4.8 Pengaturan Sistem & Keamanan
- Jadwal operasional harian, hari libur sekolah, dan koordinat mengikuti sinkronisasi *live* dari GAS Presensi.
- Panel *Read-Only* untuk jadwal dan hari libur.
- Pengaturan kebijakan GPS dan Master Switch tersedia.
- **Status implementasi saat ini:** bagian pembacaan jadwal/hari libur/koordinat sudah live, sedangkan kebijakan GPS, master switch, mode acara, dan mutasi spesifik EduLock masih belum terhubung ke backend mutasi final.

## 5. Rencana Fase Selanjutnya (Next Steps)
- Implementasi API backend spesifik EduLock untuk mutasi yang belum selesai, misalnya: cabut izin HP, toggle uninstall, master switch, dan kebijakan GPS.
- Menstabilkan jalur telemetry perangkat EduLock agar semua sekolah benar-benar mengirim `active_devices`.
- Menghubungkan audit log pelanggaran ke sumber data backend yang persisten, bukan sekadar alert runtime aktif.
