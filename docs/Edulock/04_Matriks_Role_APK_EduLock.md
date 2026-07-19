# Matriks Role APK EduLock

## 1. Role Utama

### A. Siswa

- login ke APK EduLock memakai akun yang sama seperti APK GAS siswa
- menjalankan setup izin wajib
- menerima enforcement sesuai jadwal/zona/kebijakan sekolah
- tidak boleh punya jalur bypass tetap di UI normal

### B. Admin Sekolah

- tidak memakai APK siswa
- mengelola runtime dan kontrol dari web EduLock admin
- boleh reset binding device siswa dari web

### C. Tim Pengembang

- porting dari referensi ke workspace aktif
- menjaga folder referensi tetap read-only
- menyelaraskan auth, tenant, dan telemetry dengan sistem GAS

## 2. Akses dan Tanggung Jawab

| Area | Siswa | Admin Sekolah | Tim Pengembang |
|---|---|---|---|
| Login APK EduLock | Ya | Tidak | Implementasi |
| Setup Izin Android | Ya | Tidak | Implementasi |
| Binding Device | Terkena aturan | Reset via web | Implementasi |
| Monitoring Runtime | Terkirim otomatis | Lihat via web | Implementasi |
| Permission / Unlock | Sesuai flow bisnis | Kelola via web | Implementasi |
| Ubah Folder Referensi | Tidak | Tidak | Tidak |

## 3. Aturan Mutlak

1. Folder `D:\Satu Pintu\edulock-mobile` tidak boleh diubah.
2. APK EduLock siswa tidak boleh memakai identitas login yang berbeda dari APK GAS siswa.
3. Jalur admin tetap berada di web, bukan memindahkan kontrol kritikal ke APK siswa.
