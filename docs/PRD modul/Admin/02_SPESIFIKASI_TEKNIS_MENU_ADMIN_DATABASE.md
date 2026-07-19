# Spesifikasi Teknis Menu Admin Sekolah: DATABASE

## 1. Tujuan Dokumen

Dokumen ini adalah pendamping teknis dari PRD utama modul Admin Sekolah untuk halaman DATABASE.

Fungsi dokumen ini:

1. menjelaskan detail teknis per submenu
2. menjaga implementasi tetap konsisten dengan fondasi yang sudah final
3. menjadi rambu developer berikutnya saat modul Admin dilanjutkan

Dokumen utama yang harus dibaca bersama:

- `01_PRD_ADMIN_DATABASE_DAN_SUBMENU.md`

---

## 2. Prinsip Teknis Umum

Semua submenu DATABASE wajib mengikuti prinsip berikut:

1. hanya admin sekolah tenant terkait yang boleh mengakses
2. data selalu berada dalam pagar `schoolId`
3. realtime dipakai secukupnya
4. tab yang tidak aktif tidak boleh memelihara listener besar
5. setiap domain punya komponen, modal, dan hook yang jelas

---

## 3. Struktur Teknis Saat Ini

Struktur modular yang sudah aktif:

```text
src/components/database/
├── overview/
├── students/
├── teachers/
├── staff/
├── classes/
└── shared/

src/hooks/database/
├── useDatabaseOverviewRealtime.ts
├── useStudentsRealtime.ts
├── useTeachersRealtime.ts
├── useStaffRealtime.ts
└── useClassesRealtime.ts
```

Shell utama:

- `MasterDataWorkspace.tsx`

Karakter shell:

- hanya memilih panel aktif
- tidak lagi menjadi file raksasa

---

## 4. Submenu dan Detail Teknis

## 4.1 Dashboard Overview

### Rute

- halaman DATABASE admin sekolah
- tampil saat tab `Dashboard Overview` dipilih

### Tujuan

- menampilkan ringkasan jumlah akun aktif sekolah

### Sumber data

- `gas/schools/{schoolId}/students`
- `gas/schools/{schoolId}/teachers`
- `gas/schools/{schoolId}/staff`

### Logika aktif

```text
status !== "Nonaktif"
```

### Bentuk UI

- 3 kartu ringkasan
- tanpa tabel utama
- tanpa tombol massal

### Kebutuhan realtime

- ya
- ringan karena hanya menghitung jumlah

### Catatan teknis

- data diambil per domain melalui hook overview
- tidak perlu menarik seluruh struktur data besar ke shell umum

---

## 4.2 Siswa

### Tujuan

- mengelola data induk akun siswa

### Sumber data

- `gas/schools/{schoolId}/students`

### Struktur data minimum

- `name`
- `nisn`
- `class`
- `gender`
- `religion`
- `status`
- `device`

### Struktur tabel final

- NISN / Password Login
- Nama Siswa / Username Login
- L/P
- Agama
- Kelas
- Status
- Device

### Struktur form final

- NISN
- Gender
- Agama
- Nama Siswa
- Kelas

### Tombol header yang boleh tampil

- Muat Ulang Data
- Hapus Semua
- Import Excel
- Download Template
- Tambah Siswa

### Kebutuhan realtime

- tabel aktif saat tab siswa dibuka
- listener mati saat tab pindah

### Validasi

- NISN wajib
- nama wajib
- kelas harus mengacu ke Kelas Paralel

---

## 4.3 Guru / Wali Kelas

### Tujuan

- mengelola data induk akun guru sekolah

### Sumber data

- `gas/schools/{schoolId}/teachers`

### Struktur data minimum

- `name`
- `nuptk`
- `class`
- `status`

### Struktur tabel final

- Nama Lengkap
- NUPTK / Password Login
- Kelas
- Status

### Struktur form final

- NUPTK
- Kelas
- Nama Guru

### Aturan login

- username = nama guru
- password = NUPTK

### Kebutuhan realtime

- tabel aktif saat tab guru dibuka

### Validasi

- NUPTK wajib
- nama wajib
- kelas harus diambil dari Kelas Paralel

---

## 4.4 Petugas OSIS

### Tujuan

- menandai siswa yang memiliki role tambahan OSIS

### Sumber data utama

- `gas/schools/{schoolId}/staff`

### Sumber lookup

- `gas/schools/{schoolId}/students`

### Struktur data minimum

- `nisn`
- `name`
- `class`
- `position`
- `status`

### Struktur tabel final

- Nama
- NISN
- Status

### Struktur form final

- NISN
- preview data siswa
- jabatan opsional

### Aturan utama

1. admin mengisi NISN
2. sistem membaca siswa dari DATABASE Siswa
3. nama dan kelas tidak diinput manual
4. jika NISN tidak ditemukan, simpan ditolak

### Kebutuhan realtime

- lookup siswa aktif saat tab OSIS dibuka
- tabel OSIS aktif saat tab OSIS dibuka

---

## 4.5 Kelas Paralel

### Tujuan

- mengelola katalog kelas untuk siswa dan guru

### Sumber data

- `gas/schools/{schoolId}/classes`

### Struktur data minimum

- `className`
- `grade`
- `status`

### Struktur tabel final

- Nama Kelas
- Tingkat
- Status

### Struktur form final

- input nama kelas
- tingkat aktif

### Aturan utama

- jenjang hanya 7, 8, 9
- user boleh isi `D`
- sistem membentuk:
  - `VII-D`
  - `VIII-D`
  - `IX-D`

### Kebutuhan realtime

- tabel aktif saat tab kelas dibuka
- filter per tingkat berjalan di data tab aktif

---

## 5. Aturan Header dan Search

### 5.1 Header Massal

Hanya tab **Siswa** yang boleh menampilkan tombol massal.

Tab lain:

- tidak boleh menampilkan import
- tidak boleh menampilkan hapus semua
- tidak boleh menampilkan download template

### 5.2 Search

Search hanya bekerja pada domain tab aktif.

Aturan:

- jangan cari lintas semua domain sekaligus
- jangan menarik data tab lain hanya demi search

---

## 6. Aturan Realtime dan Listener

### 6.1 Realtime Wajib

- Dashboard Overview
- Last sync time
- lookup siswa untuk OSIS

### 6.2 Realtime Terbatas

- students realtime saat tab siswa aktif
- teachers realtime saat tab guru aktif
- staff realtime saat tab OSIS aktif
- classes realtime saat tab kelas aktif

### 6.3 Larangan

Dilarang:

1. memasang semua listener di shell besar
2. memelihara listener tab yang tidak aktif
3. menggunakan satu hook untuk banyak domain sekaligus

---

## 7. Kontrak API Admin DATABASE

Endpoint aktif:

- `/api/admin/database`

Action yang dipakai:

- `create`
- `update`
- `delete`
- `delete-all`

Mapping tab:

- `Siswa` -> `students`
- `Guru/Wali Kelas` -> `teachers`
- `Petugas OSIS` -> `staff`
- `Kelas Paralel` -> `classes`

Aturan:

- backend wajib cek token
- backend wajib cek role admin
- backend wajib cek `schoolId`

---

## 8. Aturan UX Teknis

Aturan final:

1. sidebar DATABASE memakai `cursor-pointer`
2. submenu aktif harus jelas secara visual
3. teks last sync harus nyata, bukan placeholder
4. Overview tidak boleh berubah jadi tabel
5. tombol dan banner tiap domain boleh berbeda sesuai kebutuhan domain

---

## 9. Status Implementasi Saat Ini

Status teknis saat ini:

- struktur modular domain sudah aktif
- `lint` berhasil
- `build` berhasil
- halaman DATABASE sudah stabil untuk dijadikan fondasi Admin Sekolah

Catatan:

- ini final untuk fondasi menu DATABASE
- modul Admin lain seperti GAS atau EduLock belum termasuk finalisasi dalam dokumen ini

---

## 10. Rekomendasi Lanjutan

Jika modul Admin terus dilanjutkan:

1. pertahankan pola domain split
2. jangan kembalikan logika ke file shell besar
3. bila nanti ada import/export nyata, letakkan di domain siswa
4. bila ada penguatan validasi, lakukan di API dan bukan frontend saja

---

## 11. Kesimpulan

Dokumen ini mengunci implementasi teknis final dari modul DATABASE Admin Sekolah agar:

1. data akun sekolah tetap konsisten
2. listener tetap hemat
3. struktur kode tetap modular
4. integrasi APK di masa depan tidak menuntut bongkar fondasi ulang

Status dokumen:

- **Aktif**
- **Pendamping teknis PRD modul Admin DATABASE**
