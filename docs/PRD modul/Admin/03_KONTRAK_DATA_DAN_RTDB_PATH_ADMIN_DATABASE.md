# Kontrak Data dan RTDB Path Admin Sekolah: DATABASE

## 1. Tujuan Dokumen

Dokumen ini menjelaskan kontrak data utama dan path RTDB untuk modul DATABASE pada Admin Sekolah.

Fungsinya:

1. menjaga struktur data akun sekolah tetap konsisten
2. mencegah tumpang tindih antar submenu
3. memastikan integrasi APK nanti bisa langsung memakai fondasi yang sama

Dokumen ini harus dibaca bersama:

- `01_PRD_ADMIN_DATABASE_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_DATABASE.md`

---

## 2. Prinsip Umum

Prinsip kontrak data modul DATABASE:

1. semua data berada dalam tenant:
   - `gas/schools/{schoolId}/...`
2. `schoolId` menjadi pagar data utama
3. `NPSN` dipakai sebagai identitas sekolah dalam alur login
4. data akun sekolah tidak boleh bercampur dengan data pusat Super Admin

---

## 3. Path RTDB Final

Path final untuk modul DATABASE:

```text
gas/schools/{schoolId}/students
gas/schools/{schoolId}/teachers
gas/schools/{schoolId}/staff
gas/schools/{schoolId}/classes
```

Mapping final:

- `Siswa` -> `students`
- `Guru/Wali Kelas` -> `teachers`
- `Petugas OSIS` -> `staff`
- `Kelas Paralel` -> `classes`

Dashboard Overview mengambil data dari:

- `students`
- `teachers`
- `staff`

---

## 4. Kontrak Entitas

## 4.1 Student

### Path

```text
gas/schools/{schoolId}/students/{studentId}
```

### Fungsi

Master data akun siswa.

### Contoh struktur

```json
{
  "name": "Ahmad Rizki",
  "nisn": "1234567890",
  "class": "VII-A",
  "gender": "L",
  "religion": "ISLAM",
  "status": "Aktif",
  "device": "",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `name: string`
- `nisn: string`
- `class: string`
- `gender: "L" | "P"`
- `religion: "ISLAM" | "NON_ISLAM"`
- `status: string`
- `device?: string`
- `createdAt?: number`
- `updatedAt?: number`

### Aturan bisnis

- username login = nama siswa
- password login = NISN

---

## 4.2 Teacher

### Path

```text
gas/schools/{schoolId}/teachers/{teacherId}
```

### Fungsi

Master data akun guru / wali kelas.

### Contoh struktur

```json
{
  "name": "Siti Rahmawati",
  "nuptk": "9988776655",
  "class": "VII-A",
  "status": "Aktif",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `name: string`
- `nuptk: string`
- `class: string`
- `status: string`
- `createdAt?: number`
- `updatedAt?: number`

### Aturan bisnis

- username login = nama guru
- password login = NUPTK

---

## 4.3 Staff / Petugas OSIS

### Path

```text
gas/schools/{schoolId}/staff/{staffId}
```

### Fungsi

Data penanda role tambahan OSIS berbasis siswa.

### Contoh struktur

```json
{
  "nisn": "1234567890",
  "name": "Ahmad Rizki",
  "class": "VIII-B",
  "position": "Ketua OSIS",
  "status": "Aktif",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `nisn: string`
- `name: string`
- `class: string`
- `position?: string`
- `status: string`
- `createdAt?: number`
- `updatedAt?: number`

### Aturan bisnis

1. NISN wajib berasal dari data siswa
2. nama dan kelas mengikuti data siswa
3. OSIS bukan akun induk terpisah

---

## 4.4 Class

### Path

```text
gas/schools/{schoolId}/classes/{classId}
```

### Fungsi

Katalog kelas paralel sekolah.

### Contoh struktur

```json
{
  "className": "VII-D",
  "grade": "Kelas 7",
  "status": "Aktif",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `className: string`
- `grade: "Kelas 7" | "Kelas 8" | "Kelas 9"`
- `status: string`
- `createdAt?: number`
- `updatedAt?: number`

### Aturan bisnis

- kelas dibatasi hanya sampai kelas 9
- className dibentuk sesuai tingkat aktif

---

## 5. Kontrak Dashboard Overview

Dashboard Overview tidak punya path sendiri.

Ia merupakan hasil pembacaan gabungan dari:

- `students`
- `teachers`
- `staff`

Logika hitung:

```text
status !== "Nonaktif"
```

Output:

- `studentsActive`
- `teachersActive`
- `staffActive`

---

## 6. Relasi Antar Entitas

### 6.1 Student -> Staff / OSIS

Relasi:

- satu siswa bisa menjadi petugas OSIS
- OSIS membaca siswa berdasarkan `nisn`

Aturan:

- jika `nisn` tidak ada di `students`, data OSIS tidak boleh disimpan

### 6.2 Class -> Student

Relasi:

- siswa memilih kelas dari katalog kelas

### 6.3 Class -> Teacher

Relasi:

- guru / wali kelas terkait ke kelas yang tersedia

---

## 7. Aturan Penamaan dan Nilai

### 7.1 Gender

Nilai final:

- `L`
- `P`

### 7.2 Religion

Nilai final:

- `ISLAM`
- `NON_ISLAM`

### 7.3 Status

Nilai yang dipakai operasional:

- `Aktif`
- `Nonaktif`

Catatan:

- field kosong tetap dianggap aktif dalam konteks Dashboard Overview

### 7.4 Grade

Nilai final:

- `Kelas 7`
- `Kelas 8`
- `Kelas 9`

---

## 8. Relasi Dengan Login

### 8.1 Siswa

Sumber login:

- `students`

Format:

- `NPSN + Nama + NISN`

### 8.2 Guru

Sumber login:

- `teachers`

Format:

- `NPSN + Nama + NUPTK`

### 8.3 OSIS

Sumber login:

- tetap dari `students`

Role tambahan:

- dibaca dari `staff`

### 8.4 Kepala Sekolah

Tidak berasal dari modul DATABASE Admin Sekolah.

Sumber:

- Super Admin

---

## 9. Aturan Siklus Hidup Data

### 9.1 Siswa Kelas 9 Lulus

Keputusan final:

- hapus permanen

Konsekuensi:

- data siswa hilang dari `students`
- jika terkait OSIS, relasi role OSIS juga harus ikut hilang

### 9.2 Data Salah / Ganda

Boleh:

- dihapus permanen

### 9.3 Tenant Nonaktif

Data tenant tidak dihapus dari modul sekolah hanya karena tenant ditutup pusat, tetapi akses operasional tenant harus tertahan oleh aturan pusat.

---

## 10. Validasi Minimal Per Entitas

### Student

- `nisn` wajib
- `name` wajib
- `class` wajib

### Teacher

- `nuptk` wajib
- `name` wajib
- `class` wajib

### Staff / OSIS

- `nisn` wajib
- NISN harus ditemukan di siswa

### Class

- `className` wajib
- `grade` wajib

---

## 11. Larangan Desain Data

Dilarang:

1. mencampur data sekolah dengan data pusat
2. membuat path siswa/guru/osis di luar tenant
3. membuat akun OSIS terpisah dari siswa tanpa keputusan arsitektur baru
4. membuat kelas di luar format tingkat 7-9
5. menambah field liar tanpa kontrak yang jelas

---

## 12. Status Saat Ini

Status saat ini:

- path RTDB utama sudah terkunci
- mapping API sudah sesuai
- struktur domain per submenu sudah aktif
- fondasi data siap dipakai untuk pengembangan integrasi berikutnya

---

## 13. Kesimpulan

Dokumen ini mengunci kontrak data modul DATABASE Admin Sekolah agar:

1. struktur akun sekolah tetap stabil
2. integrasi login ke APK nanti tidak kacau
3. relasi antar submenu tetap jelas
4. pengembangan lanjutan tidak mengubah fondasi tanpa kontrol

Status dokumen:

- **Aktif**
- **Acuan kontrak data dan RTDB path modul Admin DATABASE**
