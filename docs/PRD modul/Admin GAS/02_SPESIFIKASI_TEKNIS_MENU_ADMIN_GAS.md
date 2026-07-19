# Spesifikasi Teknis Menu Admin Sekolah: GAS

## 1. Tujuan Dokumen

Dokumen ini adalah pendamping teknis dari PRD utama modul Admin Sekolah untuk halaman GAS.

Fungsi dokumen ini:

1. menjelaskan detail teknis per submenu GAS
2. menjaga implementasi tetap sejalan dengan arsitektur proyek
3. menjadi rambu developer saat modul GAS mulai dibangun bertahap

Dokumen utama yang harus dibaca bersama:

- `01_PRD_ADMIN_GAS_DAN_SUBMENU.md`

Dokumen acuan arsitektur:

- `docs/Kitab Suci/05_STRUKTUR_FOLDER_WEB.md`
- `docs/Kitab Suci/01_SITEPLAN_ALUR_KERJA.md`
- `docs/Kitab Suci/06_KONTRAK_API_FUNCTIONS.md`
- `docs/Kitab Suci/02_ARSITEKTUR_LENGKAP_FIREBASE.md`

---

## 2. Prinsip Teknis Umum

Semua submenu GAS wajib mengikuti prinsip berikut:

1. semua akses tenant wajib memakai `schoolId`
2. data induk tetap bersumber dari modul DATABASE
3. aksi sensitif wajib lewat backend atau Cloud Function
4. realtime hanya dipakai pada area yang memang perlu live monitoring
5. halaman laporan berat tidak dipaksa realtime penuh
6. shell halaman tidak boleh menjadi file raksasa
7. setiap domain wajib punya komponen, hook, dan service sendiri

---

## 3. Struktur Teknis Yang Ditargetkan

Struktur target mengikuti domain, bukan ditumpuk di satu halaman besar:

```text
src/components/gas/
├── students/
├── teachers/
├── attendance/
├── attendance-report/
├── discipline/
├── virtual-pet/
├── library/
├── halo-spentgapa/
├── seven-habits/
└── shared/

src/hooks/gas/
├── students/
├── teachers/
├── attendance/
├── attendance-report/
├── discipline/
├── virtual-pet/
├── library/
├── halo-spentgapa/
└── seven-habits/

src/lib/gas/
├── api/
├── selectors/
└── mappers/
```

Rute target mengikuti dokumen struktur:

```text
src/app/dashboard/students/page.tsx
src/app/dashboard/teachers/page.tsx
src/app/dashboard/attendance/page.tsx
src/app/dashboard/attendance-report/page.tsx
src/app/dashboard/discipline/page.tsx
src/app/dashboard/virtual-pet/page.tsx
src/app/dashboard/library/page.tsx
src/app/dashboard/halo-spentgapa/page.tsx
src/app/dashboard/seven-habits/page.tsx
```

---

## 4. Detail Teknis Per Submenu

## 4.1 Students

### Tujuan teknis

- menampilkan siswa aktif yang siap dipakai modul GAS
- menjadi basis filter kelas dan relasi ke submenu lain

### Sumber data

- referensi identitas dari `DATABASE students`
- data operasional turunan bila diperlukan mengikuti kontrak domain GAS

### Bentuk UI

- daftar siswa aktif
- filter per kelas
- quick summary status operasional bila dibutuhkan

### Realtime

- tidak wajib realtime penuh
- cukup fetch terkontrol saat halaman dibuka atau filter berubah

### Larangan

- jangan menjadikan halaman ini tempat membuat akun siswa dari nol
- jangan menduplikasi struktur identitas yang sudah ada di DATABASE

---

## 4.2 Teachers

### Tujuan teknis

- menampilkan guru aktif untuk kebutuhan operasional GAS
- mendukung relasi guru ke kelas yang diampu

### Sumber data

- referensi identitas dari `DATABASE teachers`

### Bentuk UI

- daftar guru aktif
- filter kelas
- status peran operasional bila dibutuhkan

### Realtime

- tidak wajib realtime penuh
- fetch saat halaman dibuka atau saat filter kelas berubah

### Catatan penting

- jika nanti ada pengampu lebih dari satu kelas, relasi harus dibuat eksplisit
- jangan memakai asumsi bahwa semua guru hanya punya satu kelas

---

## 4.3 Attendance

### Tujuan teknis

- monitoring kehadiran harian
- input manual presensi
- menjadi sumber operasional paling aktif di GAS

### Jalur backend utama

- Cloud Function `submitAttendance`
- Cloud Function `manualAttendanceInput`

### Aturan function penting

#### `submitAttendance`

- tipe: `onCall`
- sifat: `idempotent`
- input:
  - `idempotencyKey`
  - `lat`
  - `lng`
  - `mockLocationFlag`

#### `manualAttendanceInput`

- tipe: `onCall`
- input:
  - `studentId`
  - `status`
  - `date`
  - `note`

### Bentuk UI

- monitor kehadiran per kelas
- status harian
- input manual guru/admin
- filter tanggal dan kelas

### Realtime

- ya, tetapi terbatas
- cocok untuk papan monitor harian
- listener harus dibatasi ke kelas/tanggal aktif

### Catatan performa

- ini modul paling berat
- semua query harus dibatasi kelas dan tanggal
- tidak boleh menarik satu sekolah penuh tanpa filter pada jam sibuk

---

## 4.4 Attendance Report

### Tujuan teknis

- menyediakan rekap presensi bulanan dan historis

### Bentuk UI

- filter bulan
- filter kelas
- filter siswa
- export

### Realtime

- tidak wajib
- cukup fetch berdasarkan parameter filter

### Aturan teknis

- gunakan query tersegmentasi
- bila dataset besar, gunakan agregasi atau pagination
- jangan pakai listener live untuk seluruh riwayat

### Integrasi

- sumber data berasal dari domain attendance
- hasil bisa dipakai admin, guru, dan evaluasi sekolah

---

## 4.5 Discipline

### Tujuan teknis

- mencatat pelanggaran dan poin disiplin siswa

### Jalur backend utama

- Cloud Function `recordViolation`

### Input function

- `studentId`
- `violationType`
- `points`
- `note`

### Bentuk UI

- input pelanggaran
- daftar riwayat pelanggaran
- ringkasan poin
- filter per kelas/siswa

### Realtime

- tidak perlu realtime penuh
- fetch list dan refresh setelah mutasi
- summary kecil boleh realtime bila memang dibutuhkan

### Efek samping wajib

- mutasi disiplin harus bisa memicu dampak ke Virtual Pet

---

## 4.6 Virtual Pet

### Tujuan teknis

- memonitor kondisi pet siswa
- memberi reward atau penalty massal
- revive pet jika diperlukan

### Jalur backend utama

- Cloud Function `calculatePetDecay`
- Cloud Function `revivePet`
- Cloud Function `rewardPenaltyBulk`

### Aturan function penting

#### `calculatePetDecay`

- scheduled
- fan-out per `schoolId`

#### `revivePet`

- input:
  - `studentId`
  - `reason`

#### `rewardPenaltyBulk`

- input:
  - `studentIds[]`
  - `type`
  - `field`
  - `amount`
  - `reason`

### Bentuk UI

- dashboard kondisi pet
- filter per kelas
- aksi massal
- status pet per siswa

### Realtime

- summary kelas boleh realtime terbatas
- daftar lengkap tidak wajib realtime terus-menerus

### Batas penting

- bulk action maksimal 500 siswa per panggilan function

---

## 4.7 Library

### Tujuan teknis

- mengelola inventaris dan aktivitas literasi

### Bentuk UI

- daftar buku
- inventaris
- validasi tugas literasi
- rekap aktivitas

### Realtime

- tidak wajib penuh
- fetch per filter atau per halaman

### Integrasi data

- dapat menggunakan storage untuk cover
- tugas literasi mengikuti path data tenant

---

## 4.8 Halo Spentgapa

### Tujuan teknis

- menampilkan laporan/aduan sekolah dengan privasi ketat

### Bentuk UI

- daftar laporan
- detail laporan
- status tindak lanjut
- filter status

### Realtime

- boleh realtime terbatas untuk daftar laporan aktif
- detail sensitif sebaiknya diambil saat dibuka

### Aturan keamanan

1. akses wajib role-based
2. data pelapor tidak boleh dibuka sembarang role
3. list harus dibatasi school scope
4. audit akses sensitif sangat dianjurkan

---

## 4.9 Seven Habits

### Tujuan teknis

- memonitor log harian 7 kebiasaan siswa
- menghitung nilai karakter berbasis log kebiasaan
- menampung rubric penilaian guru per periode

### Bentuk UI

- mode `Monitoring`
- mode `Penilaian`
- filter jenjang, kelas, siswa, bulan, minggu, hari
- tabel monitoring kelas
- detail monitoring siswa
- modal rubric guru
- export Excel
- cetak laporan

### Realtime

- tidak wajib penuh
- fetch berdasarkan kelas/periode

### Aturan teknis

- sumber utama grading aktif adalah log `seven_habits_logs`
- formula aktif yang wajib diikuti:
  - `Konsistensi Harian` 40%
  - `Progress Mingguan` 30%
  - `Pencapaian Bulanan` 20%
  - `Nilai Guru` 10%
- rubric guru terdiri dari:
  - `honesty`
  - `behavior`
  - `initiative`
  - `commitment`
- perubahan nilai rubric harus terikat ke guru atau operator yang berwenang
- histori penilaian harus tetap dapat ditelusuri
- rumus lama berbasis `Kehadiran/Sholat/Literasi/Guru` tidak lagi menjadi acuan UI aktif

---

## 5. Strategi Realtime vs Fetch

### 5.1 Wajib realtime terbatas

- attendance monitor harian
- status atau ringkasan kecil yang benar-benar perlu live
- notifikasi atau daftar aktif pada Halo Spentgapa bila nanti dibutuhkan

### 5.2 Cukup fetch terkontrol

- students
- teachers
- attendance report
- discipline list historis
- library
- seven habits

### 5.3 Realtime jangan dipakai untuk

- seluruh riwayat presensi satu sekolah
- seluruh laporan bulanan tanpa filter
- seluruh data pet satu sekolah tanpa segmentasi

---

## 6. Kontrak Backend dan Function

Function yang sudah menjadi acuan arsitektur:

- `submitAttendance`
- `manualAttendanceInput`
- `pruneOldAttendance`
- `recordViolation`
- `calculatePetDecay`
- `revivePet`
- `rewardPenaltyBulk`

Aturan umum:

1. function adalah sumber keputusan bisnis
2. client tidak boleh menghitung validasi sensitif sendiri
3. action berat wajib dicatat ke audit log bila berdampak besar

---

## 7. Aturan Keamanan Teknis

Aturan final:

1. semua query tenant wajib dibatasi `schoolId`
2. semua write sensitif diarahkan ke Cloud Function
3. frontend tidak boleh dipercaya sebagai pagar utama
4. halaman admin sekolah tidak boleh membaca tenant lain walau param URL dimanipulasi
5. modul Halo Spentgapa wajib diberi perlindungan lebih ketat

---

## 8. Aturan UX Teknis

Aturan umum:

1. setiap submenu berdiri sebagai domain sendiri
2. daftar besar wajib punya filter sebelum data ditarik penuh
3. halaman berat wajib punya empty/loading/error state yang jelas
4. aksi massal harus punya konfirmasi
5. status live hanya ditampilkan jika memang benar live

---

## 9. Status Implementasi Saat Ini

Status teknis saat dokumen ini dibuat:

- PRD utama modul GAS sudah disusun
- struktur menu target sudah dikunci
- kontrak function acuan sudah tersedia di dokumen arsitektur
- implementasi UI Admin GAS belum dimulai penuh

Artinya:

- dokumen ini adalah pagar teknis sebelum eksekusi
- isi file ini harus menjadi acuan saat halaman mulai dibangun

---

## 10. Rekomendasi Eksekusi Bertahap

Urutan teknis yang disarankan:

1. bangun `students`
2. bangun `teachers`
3. bangun `attendance`
4. bangun `attendance-report`
5. bangun `discipline`
6. bangun `virtual-pet`
7. bangun `library`
8. bangun `halo-spentgapa`
9. bangun `seven-habits`

Urutan ini mengikuti dependensi data dan risiko sistem.

---

## 11. Kesimpulan

Dokumen ini mengunci implementasi teknis awal modul GAS agar:

1. tetap modular
2. tetap hemat listener
3. aman secara tenant
4. siap terhubung ke Cloud Function yang sudah dirancang
5. tidak mengulang masalah file raksasa di masa lalu

Status dokumen:

- **Aktif**
- **Pendamping teknis PRD modul Admin GAS**
