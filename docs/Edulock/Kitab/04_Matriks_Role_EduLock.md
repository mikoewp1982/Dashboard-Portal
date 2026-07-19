# Matriks Role - EduLock Web Admin

Dokumen ini menjadi batas otoritas operasional modul EduLock web admin sesuai kondisi implementasi saat ini.

## 1. Role Utama

### A. Admin Sekolah

- Boleh membaca direktori siswa, kelas, lokasi, jadwal, dan hari libur tenant sendiri.
- Boleh memakai panel monitoring, codes, students, violations, dan settings untuk uji UI internal.
- Tidak boleh menganggap aksi mock sebagai perubahan produksi yang sungguhan.

### B. Super Admin

- Mewarisi seluruh hak Admin Sekolah.
- Menjadi pihak yang nantinya berhak mengelola fitur lintas sekolah atau kode uninstall tingkat tinggi.
- Sampai backend final dibuat, hak ini masih bersifat desain dan belum semua termanifestasi di panel.

## 2. Matriks Akses Ringkas

| Area | Admin Sekolah | Super Admin |
|---|---|---|
| Dashboard | Baca | Baca |
| Monitoring | Baca direktori, status perangkat belum final | Baca |
| Kode Akses | UI uji internal | UI uji internal |
| Geofencing | Baca | Baca |
| Data Siswa | Baca direktori, aksi masih mock | Baca |
| Kelas | Baca | Baca |
| Audit Log Pelanggaran | UI simulasi | UI simulasi |
| Settings | Baca GAS + UI mock | Baca GAS + UI mock |

## 3. Catatan Kendali

- Sampai kontrak backend final ditetapkan, panel EduLock harus dianggap *hybrid*, bukan live penuh.
- Jika tim sudah menghubungkan endpoint mutasi dan telemetry, matriks ini wajib diperbarui agar status operasional tidak menyesatkan operator sekolah.
