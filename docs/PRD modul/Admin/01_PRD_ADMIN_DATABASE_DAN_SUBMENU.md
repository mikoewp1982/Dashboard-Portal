# PRD Modul Admin Sekolah: DATABASE dan Submenu

## 1. Ringkasan

Modul **Admin Sekolah** untuk halaman **DATABASE** adalah pusat data induk akun sekolah. Halaman ini menjadi rumah utama data user yang nantinya dipakai oleh aplikasi sekolah, khususnya **APK GAS** dan **APK EduLock**.

Dokumen ini dibuat dengan asumsi bahwa:

- halaman Admin
- menu DATABASE
- submenu DATABASE

sudah dianggap **final** untuk fase fondasi saat ini.

> [!NOTE]
> **Struktur Kodebase Terisolasi:**
> Modul Admin Sekolah secara fisik dipusatkan di dalam direktori `src/app/dashboard`. Ruang lingkup ini sepenuhnya terpisah dari direktori `src/app/super-admin`. Hal ini menjamin bahwa tidak ada layout, rute, atau konteks data tingkat pusat (Super Admin) yang bocor atau bercampur dengan operasional harian sekolah.

Menu DATABASE yang termasuk dalam ruang lingkup dokumen ini:

1. Dashboard Overview
2. Siswa
3. Guru / Wali Kelas
4. Petugas OSIS
5. Kelas Paralel

---

## 2. Tujuan Modul

Tujuan utama modul DATABASE:

1. menjadi **master data akun** tingkat sekolah
2. menjadi sumber data login untuk user sekolah
3. menjadi fondasi integrasi ke APK GAS dan EduLock di masa lanjut
4. menjaga data user sekolah tetap rapi, terisolasi, dan tidak tertukar lintas tenant

Modul ini **bukan** tempat fitur operasional pembelajaran atau konten sekolah. Fokusnya murni pada **data induk akun**.

---

## 3. Posisi Modul Dalam Ekosistem

Alur sistem yang dikunci:

1. **Super Admin** mendaftarkan tenant/sekolah dan mengelola akses tingkat pusat.
2. **Admin Sekolah** mengelola data induk akun sekolah melalui halaman DATABASE.
3. **User APK** login menggunakan data yang sudah dibentuk dari DATABASE sekolah atau dari Super Admin sesuai role.

Pembagian peran:

- **Super Admin**
  - tenant/sekolah
  - akun kepala sekolah
  - kontrol global
- **Admin Sekolah**
  - siswa
  - guru / wali kelas
  - petugas OSIS
  - kelas paralel

---

## 4. Ruang Lingkup Final

Yang termasuk final dalam dokumen ini:

### 4.1 Menu Utama

- halaman DATABASE berdiri sendiri
- sidebar menu khusus DATABASE
- perilaku modular per submenu

### 4.2 Submenu Final

- Dashboard Overview
- Siswa
- Guru / Wali Kelas
- Petugas OSIS
- Kelas Paralel

### 4.3 Finalisasi Fondasi

- struktur kode modular sudah dipasang
- `MasterDataWorkspace.tsx` sudah diturunkan menjadi shell
- listener realtime sudah dipisah per domain
- lint dan build proyek saat ini sudah berhasil

---

## 5. Prinsip Bisnis Yang Sudah Dikunci

### 5.1 DATABASE Adalah Rumah Data Akun

DATABASE adalah induk semua data akun sekolah yang akan dipakai oleh:

- siswa
- guru / wali kelas
- petugas OSIS

untuk login di aplikasi sekolah.

Pengecualian:

- akun **Kepala Sekolah** untuk APK GAS dibuat oleh **Super Admin**

### 5.2 Tenant Tetap Dijaga Oleh Pusat

Admin sekolah hanya mengelola data dalam tenant miliknya sendiri.

Pagar tenant:

- `schoolId`
- `NPSN`

### 5.3 Realtime Dipakai Secukupnya

Menu DATABASE harus terasa hidup, tetapi tetap ringan.

Prinsip:

- realtime hanya untuk kebutuhan penting
- listener tidak boleh boros
- tab yang tidak aktif tidak boleh ikut memelihara listener besar

### 5.4 Data Lulus Kelas 9

Keputusan yang sudah dikunci:

- siswa kelas 9 yang lulus = **hapus permanen**

Alasan:

- menjaga database tetap ringan
- menghindari penumpukan data besar lintas sekolah

---

## 6. Kontrak Login Yang Sudah Dikunci

### 6.1 Siswa

Format login:

- Kode Sekolah / NPSN
- Username = Nama Siswa
- Password = NISN

### 6.2 Guru / Wali Kelas

Format login:

- Kode Sekolah / NPSN
- Username = Nama Guru
- Password = NUPTK

### 6.3 Kepala Sekolah

Format login:

- Kode Sekolah / NPSN
- Username = Nama Kepala Sekolah
- Password = NIP

Sumber data:

- dari Super Admin

### 6.4 Petugas OSIS

Petugas OSIS:

- tidak memiliki akun induk terpisah
- tetap memakai akun siswa
- sistem membaca apakah `NISN` siswa itu juga terdaftar sebagai petugas OSIS

---

## 7. Struktur Menu DATABASE

## 7.1 Dashboard Overview

### Tujuan

Menampilkan ringkasan jumlah pengguna aktif secara realtime.

### Data yang ditampilkan

- jumlah siswa aktif
- jumlah guru aktif
- jumlah petugas OSIS aktif

### Aturan aktif

User dianggap aktif jika:

```text
status !== "Nonaktif"
```

termasuk bila field status kosong.

### Sumber data

- `gas/schools/{schoolId}/students`
- `gas/schools/{schoolId}/teachers`
- `gas/schools/{schoolId}/staff`

### Bentuk UI final

- berupa kartu ringkasan
- bukan tabel data
- tidak ada search bar utama

---

## 7.2 Siswa

### Tujuan

Mengelola data induk akun siswa.

### Fungsi utama

1. tambah siswa
2. edit siswa
3. hapus siswa
4. hapus semua siswa
5. import excel
6. download template
7. lihat data realtime

### Tombol header final

Tombol massal hanya muncul di submenu **Siswa**:

- Muat Ulang Data
- Hapus Semua
- Import Excel
- Download Template

### Struktur data minimum

- `name`
- `nisn`
- `class`
- `gender`
- `religion`
- `status`
- `device`

### Format tabel final

Kolom utama:

- NISN / Password Login
- Nama Siswa / Username Login
- L/P
- Agama
- Kelas
- Status
- Device

### Aturan form final

Field penting:

- NISN
- L/P
- Agama
- Nama Siswa
- Kelas

Aturan tambahan:

- agama mendukung `ISLAM` dan `NON_ISLAM`
- kelas diambil dari data Kelas Paralel

---

## 7.3 Guru / Wali Kelas

### Tujuan

Mengelola data induk akun guru yang dipakai untuk akses sekolah.

### Fungsi utama

1. tambah guru
2. edit guru
3. hapus guru
4. lihat data realtime

### Struktur data minimum

- `name`
- `nuptk`
- `class`
- `status`

### Format tabel final

Kolom utama:

- Nama Lengkap
- NUPTK / Password Login
- Kelas
- Status

### Aturan form final

Field utama:

- NUPTK
- Kelas
- Nama Guru

Aturan:

- username login = nama guru
- password login = NUPTK
- pilihan kelas berasal dari Kelas Paralel

### Catatan bisnis

Data guru/wali kelas dipakai untuk operasional akun guru sekolah.

---

## 7.4 Petugas OSIS

### Tujuan

Menandai siswa yang mendapat hak tambahan sebagai petugas OSIS.

### Fungsi utama

1. tambah petugas OSIS
2. edit petugas OSIS
3. hapus petugas OSIS
4. lookup data siswa berbasis NISN

### Struktur data minimum

- `nisn`
- `name`
- `class`
- `position`
- `status`

### Aturan final

1. data OSIS tidak diinput manual penuh
2. admin mengetik NISN
3. sistem membaca data siswa dari DATABASE Siswa
4. jika NISN tidak ditemukan, data tidak boleh disimpan

### Format tabel final

Kolom utama:

- Nama
- NISN
- Status

### Kontrak bisnis

Petugas OSIS tetap menumpang akun siswa, bukan akun terpisah.

---

## 7.5 Kelas Paralel

### Tujuan

Mengelola daftar kelas sekolah yang akan dipakai oleh siswa dan guru.

### Fungsi utama

1. tambah kelas
2. edit kelas
3. hapus kelas
4. filter per tingkat

### Aturan final

- jenjang hanya sampai kelas 9
- filter tingkat:
  - Kelas 7
  - Kelas 8
  - Kelas 9

### Struktur data minimum

- `className`
- `grade`
- `status`

### Aturan form final

Input cukup nama kelas akhir, misalnya:

- `D`

lalu sistem membentuk:

- `VII-D`
- `VIII-D`
- `IX-D`

sesuai tingkat yang sedang aktif.

### Tujuan bisnis

Kelas Paralel menjadi referensi pilihan kelas untuk siswa dan guru.

---

## 8. Path Data RTDB

Path final untuk modul DATABASE admin sekolah:

```text
gas/schools/{schoolId}/students
gas/schools/{schoolId}/teachers
gas/schools/{schoolId}/staff
gas/schools/{schoolId}/classes
```

Mapping submenu:

- Siswa -> `students`
- Guru / Wali Kelas -> `teachers`
- Petugas OSIS -> `staff`
- Kelas Paralel -> `classes`

---

## 9. Perilaku Realtime Final

### Wajib realtime

1. Dashboard Overview
2. teks "Terakhir disinkronisasi"
3. lookup NISN untuk Petugas OSIS

### Realtime terbatas per tab

1. tabel Siswa aktif saat tab Siswa dibuka
2. tabel Guru aktif saat tab Guru dibuka
3. tabel OSIS aktif saat tab OSIS dibuka
4. tabel Kelas aktif saat tab Kelas dibuka

### Larangan

- jangan hidupkan semua listener sekaligus di shell besar
- jangan mount semua tab aktif bersamaan

---

## 10. Aturan UX Final

Aturan UI/UX yang sudah dikunci:

1. menu interaktif memakai `cursor-pointer`
2. menu DATABASE tampil standalone
3. tombol massal hanya muncul di tab Siswa
4. Dashboard Overview tidak memakai tabel utama
5. detail UI tiap submenu boleh berbeda sesuai kebutuhan domain

### Prinsip penting

Form tiap submenu **tidak boleh dipaksa seragam** bila kebutuhan bisnisnya berbeda.

---

## 11. Struktur Kode Final Saat Ini

Status arsitektur saat ini:

- struktur modular per domain sudah dipasang

Domain aktif:

- `overview`
- `students`
- `teachers`
- `staff`
- `classes`

Shell utama:

- `MasterDataWorkspace.tsx`

Karakter final:

- shell tipis
- panel per domain
- hook realtime per domain
- modal/table terpisah

---

## 12. Non-Functional Requirements

### 12.1 Keamanan

- admin sekolah hanya boleh mengakses tenant miliknya
- tidak boleh ada kebocoran lintas sekolah

### 12.2 Performa

- harus ringan
- tidak boros listener
- siap tumbuh tanpa file raksasa

### 12.3 Maintainability

- modul harus tetap modular
- satu file tidak boleh kembali tumbuh tak terkendali

### 12.4 Kesiapan Integrasi

- struktur data harus siap dipakai oleh APK nanti
- integrasi harus plug-and-play tanpa bongkar ulang arsitektur akun

---

## 13. Status Finalisasi Saat Ini

Status saat ini:

- halaman DATABASE admin sekolah dianggap **final** untuk fondasi
- submenu final sudah terbentuk
- struktur modular sudah terpasang
- lint dan build saat ini berhasil

Catatan:

- final di sini berarti final sebagai fondasi modul DATABASE
- modul lain seperti GAS admin dan EduLock admin masih bisa berkembang di tahap berikutnya

---

## 14. Kesimpulan

Modul DATABASE pada Web Admin Sekolah adalah fondasi akun operasional sekolah. Semua keputusan UI, data, realtime, dan struktur kode di dalam dokumen ini diarahkan agar:

1. data akun sekolah tetap rapi
2. integrasi APK nanti tidak ribet
3. performa tetap ringan
4. arsitektur tetap aman saat tenant bertambah

Status dokumen:

- **Aktif**
- **Berlaku sebagai PRD final fondasi modul DATABASE Admin Sekolah**
