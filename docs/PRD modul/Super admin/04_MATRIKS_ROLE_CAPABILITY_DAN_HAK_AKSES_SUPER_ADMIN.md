# Matriks Role, Capability, dan Hak Akses Super Admin

## 1. Tujuan Dokumen

Dokumen ini mengunci aturan otorisasi modul **Super Admin** agar:

1. role dan capability tidak tumpang tindih
2. hak akses pusat tidak bocor ke role lebih rendah
3. developer punya acuan tegas saat menambah fitur baru

Dokumen ini melengkapi:

- `01_PRD_SUPER_ADMIN_PORTALKITA.md`
- `02_SPESIFIKASI_TEKNIS_MENU_SUPER_ADMIN.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_SUPER_ADMIN.md`

---

## 2. Prinsip Umum

Aturan dasar yang dikunci:

1. **role** menentukan wilayah besar akses user
2. **capability** menentukan izin aksi lebih spesifik
3. role tanpa capability yang sesuai tidak boleh menjalankan aksi strategis
4. validasi hak akses tidak boleh hanya dilakukan di frontend
5. semua aksi penting Super Admin wajib lolos validasi backend

Catatan jujur implementasi:

- validasi `role = super_admin` sudah menjadi pagar utama
- pemisahan capability backend saat ini masih target penguatan, belum seragam penuh di semua aksi

---

## 3. Daftar Role Utama Sistem

Role yang relevan untuk ekosistem saat ini:

1. `super_admin`
2. `admin`
3. `teacher`
4. `student`

Catatan:

- `principal` diperlakukan sebagai aktor bisnis khusus, tetapi bukan role pusat utama untuk wilayah Super Admin
- petugas OSIS bukan role auth pusat terpisah

---

## 4. Posisi Role Terhadap Modul Super Admin

### 4.1 super_admin

Boleh:

- masuk ke seluruh menu Super Admin
- memanggil fungsi backend pusat
- mengelola tenant
- mengelola login admin sekolah
- mengelola akun kepala sekolah
- reset password admin sekolah
- reset password kepala sekolah
- mengubah konfigurasi global
- mengelola sync jobs
- mengelola support tools
- melihat audit atau security log pusat
- melihat service status lintas tenant
- mengelola status pembayaran layanan sekolah
- mengelola EduLock uninstall access lintas tenant

Tidak boleh:

- melewati jalur backend tanpa validasi

### 4.2 admin

Boleh:

- masuk ke modul Web Admin Sekolah miliknya
- mengelola master data tenant miliknya

Tidak boleh:

- masuk ke halaman Super Admin
- mengelola tenant lain
- memanggil endpoint strategis pusat

### 4.3 teacher

Tidak boleh:

- mengakses halaman Super Admin
- mengakses halaman Web Admin Sekolah
- mengubah tenant, audit, support tools, atau global config

### 4.4 student

Tidak boleh:

- mengakses halaman Super Admin
- mengakses halaman Web Admin Sekolah
- mengakses fungsi backend pusat

---

## 5. Model Role dan Capability

Struktur otorisasi yang direkomendasikan:

```json
{
  "role": "super_admin",
  "schoolId": null,
  "npsn": null,
  "capabilities": [
    "SYSTEM_CONFIG_MANAGE",
    "SCHOOL_REGISTRY_MANAGE",
    "GLOBAL_BROADCAST_MANAGE"
  ]
}
```

Prinsip:

1. role = identitas tingkat akses
2. capabilities = daftar izin aksi
3. claims harus cukup untuk menentukan apakah user boleh menjalankan fungsi tertentu

---

## 6. Daftar Capability Inti Super Admin

Capability yang paling relevan:

1. `SYSTEM_CONFIG_MANAGE`
2. `SCHOOL_REGISTRY_MANAGE`
3. `GLOBAL_BROADCAST_MANAGE`
4. `AUDIT_LOG_READ`
5. `SUPPORT_REQUEST_MANAGE`
6. `SYNC_JOB_MANAGE`
7. `SERVICE_STATUS_READ`
8. `PRINCIPAL_ACCOUNT_MANAGE`
9. `ADMIN_SCHOOL_ACCOUNT_MANAGE`
10. `SERVICE_BILLING_MANAGE`
11. `EDULOCK_UNINSTALL_MANAGE`

---

## 7. Definisi Capability

### 7.1 SYSTEM_CONFIG_MANAGE

Hak:

- ubah global config
- ubah kontrol sistem pusat
- mengelola aksi pusat yang memang masih berada di domain konfigurasi sistem

### 7.2 SCHOOL_REGISTRY_MANAGE

Hak:

- tambah tenant
- edit tenant
- aktif atau nonaktif tenant
- kelola identitas login admin sekolah yang tersimpan di registry tenant

### 7.3 GLOBAL_BROADCAST_MANAGE

Hak:

- buat broadcast global
- hapus broadcast global

### 7.4 AUDIT_LOG_READ

Hak:

- baca audit atau security log pusat

### 7.5 SUPPORT_REQUEST_MANAGE

Hak:

- buat support request
- ubah status support request
- hapus support request

### 7.6 SYNC_JOB_MANAGE

Hak:

- buat sync job
- ubah status sync job
- monitor job secara penuh

### 7.7 SERVICE_STATUS_READ

Hak:

- baca status layanan lintas tenant

### 7.8 PRINCIPAL_ACCOUNT_MANAGE

Hak:

- buat atau edit akun kepala sekolah
- reset device kepala sekolah
- reset password kepala sekolah

### 7.9 ADMIN_SCHOOL_ACCOUNT_MANAGE

Hak:

- buat atau edit akses login admin sekolah
- bootstrap akses admin sekolah
- reset password admin sekolah

### 7.10 SERVICE_BILLING_MANAGE

Hak:

- mengubah status pembayaran tenant
- melihat siswa ditagihkan dan estimasi billing
- menyimpan tarif per siswa global

### 7.11 EDULOCK_UNINSTALL_MANAGE

Hak:

- membuat kode uninstall EduLock
- menghapus kode uninstall EduLock
- melihat kode aktif dan barcode atau QR uninstall

---

## 8. Matriks Hak Akses Per Role

### 8.1 Matriks Ringkas

| Role | Dashboard Utama | Database Induk | Monitoring | Status Layanan | EduLock Uninstall | Global Config | Broadcast | Sync Jobs | Support | Audit |
|---|---|---|---|---|---|---|---|---|---|---|
| `super_admin` | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| `admin` | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| `teacher` | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| `student` | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |

### 8.2 Matriks Capability

| Capability | super_admin | admin | teacher | student |
|---|---|---|---|---|
| `SYSTEM_CONFIG_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `SCHOOL_REGISTRY_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `GLOBAL_BROADCAST_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `AUDIT_LOG_READ` | Ya | Tidak | Tidak | Tidak |
| `SUPPORT_REQUEST_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `SYNC_JOB_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `SERVICE_STATUS_READ` | Ya | Tidak | Tidak | Tidak |
| `PRINCIPAL_ACCOUNT_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `ADMIN_SCHOOL_ACCOUNT_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `SERVICE_BILLING_MANAGE` | Ya | Tidak | Tidak | Tidak |
| `EDULOCK_UNINSTALL_MANAGE` | Ya | Tidak | Tidak | Tidak |

---

## 9. Hak Akses Per Menu

### 9.1 Dashboard Utama

Boleh akses:

- `super_admin`

Capability minimum yang disarankan:

- `SERVICE_STATUS_READ`

### 9.2 Sekolah & Tenant

Boleh akses:

- `super_admin`

Capability minimum:

- `SCHOOL_REGISTRY_MANAGE`

### 9.3 Admin Sekolah

Boleh akses:

- `super_admin`

Capability minimum:

- `ADMIN_SCHOOL_ACCOUNT_MANAGE`

### 9.4 Kepala Sekolah

Boleh akses:

- `super_admin`

Capability minimum:

- `PRINCIPAL_ACCOUNT_MANAGE`

### 9.5 Global Config

Boleh akses:

- `super_admin`

Capability minimum:

- `SYSTEM_CONFIG_MANAGE`

### 9.6 Broadcast Global

Boleh akses:

- `super_admin`

Capability minimum:

- `GLOBAL_BROADCAST_MANAGE`

### 9.7 Sync Jobs

Boleh akses:

- `super_admin`

Capability minimum:

- `SYNC_JOB_MANAGE`

### 9.8 Support Tools

Boleh akses:

- `super_admin`

Capability minimum:

- `SUPPORT_REQUEST_MANAGE`

### 9.9 Audit & Compliance

Boleh akses:

- `super_admin`

Capability minimum:

- `AUDIT_LOG_READ`

### 9.10 Service Status

Boleh akses:

- `super_admin`

Capability minimum:

- `SERVICE_STATUS_READ`
- `SERVICE_BILLING_MANAGE`

### 9.11 Monitoring

Boleh akses:

- `super_admin`

Capability minimum:

- `AUDIT_LOG_READ`
- `SERVICE_STATUS_READ`

### 9.12 EduLock Uninstall Access

Boleh akses:

- `super_admin`

Capability minimum:

- `EDULOCK_UNINSTALL_MANAGE`

---

## 10. Kondisi Backend Saat Ini

Kondisi implementasi saat ini:

- backend pusat sudah memverifikasi autentikasi dan `role = super_admin`
- pemisahan capability backend per aksi belum seragam penuh
- capability pada dokumen ini harus dianggap sebagai **target kontrak yang harus dikejar**, bukan alasan untuk overclaim bahwa semua endpoint sudah memeriksanya secara rinci

Implikasi:

- developer tidak boleh menurunkan standar dokumen ini
- tetapi status implementasi riil harus tetap ditulis jujur

---

## 11. Aturan Validasi Frontend dan Backend

### 11.1 Frontend

Frontend hanya boleh:

- menyembunyikan menu
- memblokir navigasi visual
- mengarahkan user ke login bila role tidak sesuai

Frontend **tidak boleh** dianggap cukup untuk keamanan.

### 11.2 Backend

Backend wajib:

- cek autentikasi
- cek role
- cek capability bila endpoint sudah memerlukannya
- cek parameter penting
- batasi mutasi hanya untuk aksi yang diizinkan

---

## 12. Larangan Otorisasi

Dilarang:

1. memberi akses Super Admin hanya berdasarkan tampilan menu
2. membolehkan `admin` memanggil fungsi pusat tanpa validasi backend
3. menambahkan fungsi baru tanpa memetakan capability-nya
4. memakai satu capability super luas terus-menerus tanpa arah pemisahan
5. membiarkan role dan capability tidak terdokumentasi

---

## 13. Rekomendasi Penguatan Berikutnya

Langkah penguatan otorisasi berikutnya:

1. pecah capability generik menjadi capability yang lebih spesifik
2. buat katalog capability terpusat yang final
3. samakan capability frontend, backend, dan dokumen ini
4. tambahkan audit log untuk semua aksi strategis pusat

---

## 14. Status Saat Ini

Status proyek saat ini:

- hak akses pusat sudah punya fondasi role yang jelas
- kontrak capability sudah tersedia sebagai target desain
- modul Super Admin aman untuk dilanjutkan

Catatan jujur:

- pemisahan capability backend masih perlu diperdalam
- dokumen ini adalah pagar desain yang harus dikejar implementasi

---

## 15. Kesimpulan

Dokumen ini mengunci bahwa:

1. hanya `super_admin` yang boleh masuk ke wilayah Super Admin
2. capability harus menjadi lapisan validasi kedua setelah role
3. fungsi backend pusat harus dipetakan ke capability yang jelas
4. pengembangan fitur baru tidak boleh menambah akses tanpa kontrak terdokumentasi

Status dokumen:

- **Aktif**
- **Acuan role, capability, dan hak akses modul Super Admin**
