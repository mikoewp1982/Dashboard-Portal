# Matriks Role dan Hak Akses Admin Sekolah: DATABASE

## 1. Tujuan Dokumen

Dokumen ini menjelaskan siapa yang boleh mengakses modul DATABASE Admin Sekolah dan hak akses apa yang berlaku pada tiap submenu.

Fungsinya:

1. menjaga agar role tidak bocor
2. memastikan batas Admin Sekolah dan Super Admin tetap jelas
3. menjadi acuan saat developer menambah aksi baru

Dokumen ini melengkapi:

- `01_PRD_ADMIN_DATABASE_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_DATABASE.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_DATABASE.md`

---

## 2. Prinsip Umum

Aturan dasar:

1. modul DATABASE hanya untuk `admin`
2. admin hanya boleh mengelola tenant miliknya sendiri
3. `super_admin` tidak menjadikan halaman ini sebagai pusat kerja operasional sekolah
4. `teacher` dan `student` tidak boleh mengakses halaman ini

---

## 3. Role Utama yang Relevan

Role relevan:

1. `super_admin`
2. `admin`
3. `teacher`
4. `student`

Catatan:

- `Petugas OSIS` bukan role auth terpisah
- OSIS adalah role tambahan dari akun siswa

---

## 4. Hak Akses Dasar Per Role

### 4.1 super_admin

Boleh:

- memantau dari level pusat bila perlu

Tidak menjadi pengguna utama:

- halaman DATABASE Admin Sekolah bukan pusat kerja operasional Super Admin

### 4.2 admin

Boleh:

- masuk ke modul DATABASE tenant miliknya
- mengelola siswa
- mengelola guru
- mengelola petugas OSIS
- mengelola kelas paralel
- melihat Dashboard Overview tenant

Tidak boleh:

- mengelola tenant lain
- mengubah data pusat Super Admin

### 4.3 teacher

Tidak boleh:

- masuk ke halaman DATABASE admin
- menjalankan aksi CRUD data induk akun sekolah

### 4.4 student

Tidak boleh:

- masuk ke halaman DATABASE admin
- mengakses API admin database

---

## 5. Matriks Hak Akses Ringkas

| Role | Dashboard Overview | Siswa | Guru/Wali Kelas | Petugas OSIS | Kelas Paralel | API Admin Database |
|---|---|---|---|---|---|---|
| `admin` | Ya | Ya | Ya | Ya | Ya | Ya |
| `super_admin` | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak untuk operasional tenant |
| `teacher` | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |
| `student` | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |

---

## 6. Hak Akses Per Submenu

## 6.1 Dashboard Overview

Boleh akses:

- `admin`

Hak:

- melihat jumlah siswa aktif
- melihat jumlah guru aktif
- melihat jumlah petugas OSIS aktif

Tidak boleh:

- mengubah data langsung dari overview

---

## 6.2 Siswa

Boleh akses:

- `admin`

Hak:

- create
- update
- delete
- delete-all
- import
- download template
- refresh data

---

## 6.3 Guru / Wali Kelas

Boleh akses:

- `admin`

Hak:

- create
- update
- delete

Tidak boleh:

- memakai tombol massal siswa

---

## 6.4 Petugas OSIS

Boleh akses:

- `admin`

Hak:

- create
- update
- delete

Aturan:

- tetap tunduk pada validasi siswa berbasis `nisn`

---

## 6.5 Kelas Paralel

Boleh akses:

- `admin`

Hak:

- create
- update
- delete
- filter tingkat

Aturan:

- hanya kelas 7 sampai 9

---

## 7. Hak Akses API

Endpoint:

- `/api/admin/database`

Backend wajib:

1. cek token login
2. cek role = `admin`
3. cek `schoolId` ada
4. batasi mutasi hanya ke tenant milik user

Action yang diizinkan:

- `create`
- `update`
- `delete`
- `delete-all`

---

## 8. Batas Tenant

Aturan mutlak:

1. admin A tidak boleh membaca/menulis data admin B
2. semua path mutasi mengikuti `schoolId` dari token
3. frontend tidak boleh mengandalkan input `schoolId` manual user

Sumber kebenaran tenant:

- claims auth
- validasi backend

---

## 9. Larangan Hak Akses

Dilarang:

1. membiarkan `teacher` atau `student` membuka halaman ini
2. membiarkan admin mengakses tenant lain
3. mengandalkan frontend saja untuk keamanan
4. memberi tombol massal ke tab selain siswa
5. membuat akun OSIS terpisah tanpa keputusan arsitektur baru

---

## 10. Rekomendasi Penguatan Berikutnya

Jika modul Admin berkembang:

1. tambahkan audit ringan untuk aksi massal penting
2. tambahkan validasi backend lebih spesifik per entity
3. dokumentasikan kontrak role tenant lebih rinci jika ada role baru

---

## 11. Kesimpulan

Dokumen ini mengunci bahwa:

1. hanya `admin` tenant terkait yang menjadi pengguna utama DATABASE
2. semua akses harus tetap berada dalam pagar `schoolId`
3. submenu memiliki hak akses yang jelas
4. keamanan tidak boleh hanya bertumpu pada tampilan frontend

Status dokumen:

- **Aktif**
- **Acuan role dan hak akses modul Admin DATABASE**
