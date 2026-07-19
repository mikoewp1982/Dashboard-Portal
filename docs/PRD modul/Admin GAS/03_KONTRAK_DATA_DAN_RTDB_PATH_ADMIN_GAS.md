# Kontrak Data dan Path Data Admin Sekolah: GAS

## 1. Tujuan Dokumen

Dokumen ini menjelaskan kontrak data utama dan path data untuk modul GAS pada Admin Sekolah.

Fungsinya:

1. menjaga agar struktur data operasional GAS tetap konsisten
2. membedakan data induk DATABASE dengan data operasional GAS
3. mengunci path tenant-scoped agar tidak tercampur lintas sekolah
4. menjadi acuan backend, frontend web admin, dan APK GAS

Dokumen ini harus dibaca bersama:

- `01_PRD_ADMIN_GAS_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md`
- `docs/Kitab Suci/02_ARSITEKTUR_LENGKAP_FIREBASE.md`
- `docs/Kitab Suci/06_KONTRAK_API_FUNCTIONS.md`

---

## 2. Prinsip Umum

Prinsip kontrak data modul GAS:

1. semua data operasional sekolah wajib tenant-scoped
2. identitas akun tetap bersumber dari DATABASE
3. data operasional jangka menengah dan panjang utamanya berada di Firestore
4. RTDB dipakai hanya untuk kebutuhan realtime ringan dan low-latency
5. semua write sensitif dilakukan melalui backend atau Cloud Function

---

## 3. Boundary Data GAS

### 3.1 Data referensi dari DATABASE

Referensi yang dipakai oleh GAS:

```text
gas/schools/{schoolId}/students
gas/schools/{schoolId}/teachers
gas/schools/{schoolId}/staff
gas/schools/{schoolId}/classes
```

Makna:

- path di atas adalah sumber identitas dan referensi
- modul GAS tidak boleh menjadikannya tempat penyimpanan transaksi operasional harian

### 3.2 Data operasional GAS

Path utama mengikuti arsitektur Firestore:

```text
schools/{schoolId}/students/{studentId}
schools/{schoolId}/teachers/{teacherId}
schools/{schoolId}/attendance/{yyyymm}/{studentId}
schools/{schoolId}/discipline/{recordId}
schools/{schoolId}/pets/{studentId}
schools/{schoolId}/library_tasks/{taskId}
schools/{schoolId}/halo_reports/{reportId}
schools/{schoolId}/seven_habits/{studentId}/{date}
audit_logs/{logId}
```

### 3.3 RTDB untuk realtime ringan

Path RTDB yang relevan untuk pola realtime umum:

```text
/presence/{schoolId}/{userId}
```

Catatan:

- modul GAS tidak boleh asal memindahkan semua transaksi ke RTDB
- RTDB dipakai hanya saat benar-benar perlu update instan

---

## 4. Kontrak Entitas Utama

## 4.1 Student Reference

### Path referensi

```text
gas/schools/{schoolId}/students/{studentId}
```

### Fungsi

Referensi identitas siswa yang dibentuk dari modul DATABASE.

### Contoh struktur minimum

```json
{
  "name": "Ahmad Rizki",
  "nisn": "1234567890",
  "class": "VII-A",
  "gender": "L",
  "religion": "ISLAM",
  "status": "Aktif"
}
```

### Aturan

- digunakan sebagai referensi identitas untuk attendance, discipline, pet, dan seven habits
- tidak dipakai sebagai tabel transaksi

---

## 4.2 Teacher Reference

### Path referensi

```text
gas/schools/{schoolId}/teachers/{teacherId}
```

### Fungsi

Referensi identitas guru untuk manual input, validasi, dan penilaian.

### Contoh struktur minimum

```json
{
  "name": "Siti Rahmawati",
  "nuptk": "9988776655",
  "class": "VII-A",
  "status": "Aktif"
}
```

---

## 4.3 Attendance

### Path

```text
schools/{schoolId}/attendance/{yyyymm}/{studentId}
```

### Fungsi

Menyimpan status presensi siswa per periode.

### Contoh struktur

```json
{
  "studentId": "student_001",
  "studentName": "Ahmad Rizki",
  "classId": "class_vii_a",
  "className": "VII-A",
  "date": "2026-07-14",
  "status": "PRESENT",
  "source": "SELF",
  "note": "",
  "distanceMeters": 17.5,
  "mockLocationFlag": false,
  "serverTimestamp": "2026-07-14T06:55:00.000Z",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `studentId: string`
- `studentName: string`
- `classId?: string`
- `className: string`
- `date: string`
- `status: "PRESENT" | "LATE" | "ALPHA" | "IZIN" | "SAKIT"`
- `source: "SELF" | "MANUAL"`
- `note?: string`
- `distanceMeters?: number`
- `mockLocationFlag?: boolean`
- `serverTimestamp?: string`
- `createdAt?: number`
- `updatedAt?: number`

### Aturan bisnis

- attendance self-submit tidak boleh mengandalkan waktu device
- semua keputusan valid diambil dari server

---

## 4.4 Discipline Record

### Path

```text
schools/{schoolId}/discipline/{recordId}
```

### Fungsi

Menyimpan catatan pelanggaran siswa.

### Contoh struktur

```json
{
  "studentId": "student_001",
  "studentName": "Ahmad Rizki",
  "className": "VIII-B",
  "violationType": "TERLAMBAT",
  "points": 5,
  "note": "Datang setelah jam masuk",
  "recordedBy": "teacher_001",
  "recordedByName": "Siti Rahmawati",
  "recordedAt": "2026-07-14T07:30:00.000Z",
  "createdAt": 1760000000000
}
```

### Field minimum

- `studentId: string`
- `studentName: string`
- `className: string`
- `violationType: string`
- `points: number`
- `note?: string`
- `recordedBy: string`
- `recordedByName?: string`
- `recordedAt: string`
- `createdAt?: number`

### Aturan bisnis

- mutasi ini dapat memicu pengurangan nilai pet

---

## 4.5 Pet State

### Path

```text
schools/{schoolId}/pets/{studentId}
```

### Fungsi

Menyimpan status virtual pet siswa.

### Contoh struktur

```json
{
  "studentId": "student_001",
  "studentName": "Ahmad Rizki",
  "className": "VIII-B",
  "status": "ALIVE",
  "level": 3,
  "xp": 120,
  "health": 85,
  "happiness": 70,
  "energy": 90,
  "hunger": 40,
  "lastDecayAt": "2026-07-14T00:00:00.000Z",
  "updatedAt": 1760000000000
}
```

### Field minimum

- `studentId: string`
- `studentName: string`
- `className: string`
- `status: "ALIVE" | "DOWN"`
- `level: number`
- `xp: number`
- `health: number`
- `happiness: number`
- `energy: number`
- `hunger: number`
- `lastDecayAt?: string`
- `updatedAt?: number`

### Aturan bisnis

- perubahan nilai pet skala besar dilakukan lewat function
- bulk update tidak boleh langsung ditulis liar dari client

---

## 4.6 Library Task

### Path

```text
schools/{schoolId}/library_tasks/{taskId}
```

### Fungsi

Menyimpan tugas atau aktivitas literasi.

### Contoh struktur

```json
{
  "title": "Membaca Cerita Rakyat",
  "description": "Siswa membaca dan membuat ringkasan",
  "className": "VII-A",
  "bookId": "book_001",
  "assignedBy": "teacher_001",
  "status": "ACTIVE",
  "dueDate": "2026-07-20",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `title: string`
- `description?: string`
- `className: string`
- `bookId?: string`
- `assignedBy: string`
- `status: "ACTIVE" | "CLOSED"`
- `dueDate?: string`
- `createdAt?: number`
- `updatedAt?: number`

---

## 4.7 Halo Report

### Path

```text
schools/{schoolId}/halo_reports/{reportId}
```

### Fungsi

Menyimpan laporan atau aduan internal sekolah.

### Contoh struktur

```json
{
  "reporterId": "student_001",
  "reporterRole": "student",
  "category": "PERUNDUNGAN",
  "title": "Laporan Perundungan",
  "description": "Terjadi di area kantin",
  "status": "OPEN",
  "priority": "HIGH",
  "assignedTo": "",
  "createdAt": "2026-07-14T08:00:00.000Z",
  "updatedAt": "2026-07-14T08:00:00.000Z"
}
```

### Field minimum

- `reporterId: string`
- `reporterRole: string`
- `category: string`
- `title: string`
- `description: string`
- `status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"`
- `priority?: "LOW" | "MEDIUM" | "HIGH"`
- `assignedTo?: string`
- `createdAt: string`
- `updatedAt?: string`

### Aturan keamanan

- identitas pelapor tidak boleh dibuka bebas di semua layar
- detail sensitif hanya boleh dibaca role berwenang

---

## 4.8 Seven Habits Record

### Path RTDB aktif

```text
seven_habits_logs/{studentId}/{date}
```

### Fungsi

Menyimpan log harian `7 KAIH` per siswa per tanggal.

### Contoh struktur

```json
{
  "habit1": true,
  "habit2": true,
  "habit3": false,
  "habit4": true,
  "habit5": true,
  "habit6": false,
  "habit7": true,
  "updatedAt": 1760000000000
}
```

### Field minimum

- `habit1: boolean`
- `habit2: boolean`
- `habit3: boolean`
- `habit4: boolean`
- `habit5: boolean`
- `habit6: boolean`
- `habit7: boolean`
- `updatedAt?: number`

### Catatan aktif

- key tanggal memakai format `YYYY-MM-DD`
- log ini menjadi basis tampilan mode `Monitoring`
- log ini juga menjadi bahan utama grading aktif `7 KAIH`

---

## 4.8A Seven Habits Teacher Ratings

### Path RTDB aktif

```text
seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}
```

### Fungsi

Menyimpan rubric penilaian guru per siswa per bulan dan tahun.

### Contoh struktur

```json
{
  "honesty": 22,
  "behavior": 21,
  "initiative": 20,
  "commitment": 23,
  "total": 86
}
```

### Field minimum

- `honesty: number`
- `behavior: number`
- `initiative: number`
- `commitment: number`
- `total: number`

### Catatan aktif

- key disusun dengan format `studentId_month_year`
- implementasi aktif juga membaca fallback `nisn_month_year` bila diperlukan
- node ini menjadi komponen `Nilai Guru (10%)` pada grading `7 KAIH`

---

## 4.9 Presence Realtime

### Path RTDB

```text
/presence/{schoolId}/{userId}
```

### Fungsi

Status online/offline ringan untuk kebutuhan realtime.

### Contoh struktur

```json
{
  "isOnline": true,
  "lastSeenAt": 1760000000000,
  "role": "student"
}
```

### Catatan

- ini bukan tabel utama presensi harian
- jangan tertukar dengan `attendance`

---

## 5. Relasi Antar Entitas

### 5.1 Student Reference -> Attendance

- attendance selalu merujuk ke siswa yang valid
- student yang dihapus dari DATABASE perlu ditangani dengan kebijakan retensi yang jelas bila data operasionalnya masih dibutuhkan

### 5.2 Student Reference -> Discipline

- pelanggaran wajib mengacu ke siswa valid

### 5.3 Student Reference -> Pet

- satu siswa punya satu state pet utama

### 5.4 Teacher Reference -> Manual Input / Seven Habits

- guru menjadi aktor input manual dan penilai

### 5.5 Discipline -> Pet

- pelanggaran dapat memengaruhi `happiness`

---

## 6. Kontrak Dengan Cloud Function

Function acuan:

- `submitAttendance`
- `manualAttendanceInput`
- `pruneOldAttendance`
- `recordViolation`
- `calculatePetDecay`
- `revivePet`
- `rewardPenaltyBulk`

Aturan:

1. client tidak boleh menulis keputusan sensitif langsung ke database
2. function menjadi pintu masuk validasi GPS, school scope, batch limit, dan audit
3. scheduled job dipakai untuk decay dan pruning

---

## 7. Aturan Nilai dan Enumerasi

### 7.1 Attendance Status

- `PRESENT`
- `LATE`
- `ALPHA`
- `IZIN`
- `SAKIT`

### 7.2 Attendance Source

- `SELF`
- `MANUAL`

### 7.3 Pet Status

- `ALIVE`
- `DOWN`

### 7.4 Halo Report Status

- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

### 7.5 Library Task Status

- `ACTIVE`
- `CLOSED`

---

## 8. Larangan Desain Data

Dilarang:

1. mencampur transaksi GAS ke path master data DATABASE
2. memakai RTDB untuk seluruh data historis operasional
3. menulis attendance valid langsung dari client tanpa function
4. membuka data Halo tanpa pembatasan per role
5. menambah field liar yang belum disepakati kontraknya

---

## 9. Status Saat Ini

Status saat dokumen ini dibuat:

- kontrak path masih menjadi acuan target implementasi
- modul Admin GAS belum dibangun penuh
- path yang ditulis di sini adalah pagar desain agar implementasi nanti tidak liar

---

## 10. Kesimpulan

Dokumen ini mengunci kontrak data modul GAS agar:

1. data operasional sekolah tetap rapi
2. pemisahan DATABASE vs GAS tetap jelas
3. Firestore dan RTDB dipakai sesuai fungsi masing-masing
4. web admin, backend, dan APK bisa bertemu pada kontrak yang sama

Status dokumen:

- **Aktif**
- **Acuan kontrak data dan path data modul Admin GAS**
