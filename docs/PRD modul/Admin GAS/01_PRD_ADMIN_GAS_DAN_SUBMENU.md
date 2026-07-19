# PRD Modul Admin Sekolah: GAS dan Submenu

## 1. Ringkasan

Modul **Admin Sekolah** untuk halaman **GAS** adalah pusat pengelolaan operasional harian sekolah yang terhubung ke ekosistem **APK GAS**.

Jika modul **DATABASE** berfungsi sebagai rumah data induk akun, maka modul **GAS** berfungsi sebagai lapisan operasional yang:

1. memakai data induk dari DATABASE
2. mengelola aktivitas harian sekolah
3. menjadi jembatan kontrol antara Web Admin dan APK GAS
4. menyiapkan integrasi ke modul lain seperti EduLock tanpa merusak fondasi akun

Dokumen ini disusun berdasarkan acuan utama:

- `docs/Kitab Suci/05_STRUKTUR_FOLDER_WEB.md`
- `docs/Kitab Suci/01_SITEPLAN_ALUR_KERJA.md`

Submenu GAS yang termasuk dalam ruang lingkup PRD ini:

1. Students
2. Teachers
3. Attendance
4. Attendance Report
5. Discipline
6. Virtual Pet
7. Library
8. Halo Spentgapa
9. Seven Habits

---

## 2. Tujuan Modul

Tujuan utama modul GAS:

1. mengubah data induk akun menjadi data operasional sekolah
2. memusatkan kontrol kegiatan harian sekolah dari web admin
3. menjadi backend operasional untuk fitur yang dikonsumsi oleh APK GAS
4. menjaga agar alur sekolah berjalan per tenant tanpa kebocoran data lintas sekolah
5. menyiapkan pondasi modul berantai seperti presensi, kedisiplinan, karakter, dan virtual pet

Modul ini bukan tempat membuat tenant, bukan tempat membuat akun kepala sekolah, dan bukan tempat mengganti fondasi identitas user. Semua itu tetap berada di modul lain yang sudah dikunci.

---

## 3. Posisi Modul Dalam Ekosistem

Alur sistem yang sudah dikunci:

1. **Super Admin** mendaftarkan sekolah dan akun pusat.
2. **Admin Sekolah - DATABASE** membentuk data induk akun siswa, guru, OSIS, dan kelas.
3. **Admin Sekolah - GAS** memakai data induk itu untuk operasional harian sekolah.
4. **APK GAS** membaca hasil operasional dan identitas yang sudah dibentuk dari lapisan web admin.

Hubungan antar modul:

- **Super Admin**
  - tenant
  - status layanan
  - akun kepala sekolah
- **Admin DATABASE**
  - sumber identitas akun
  - sumber kelas
  - sumber user sekolah
- **Admin GAS**
  - operasional presensi
  - operasional kedisiplinan
  - karakter
  - virtual pet
  - perpustakaan/literasi
  - aduan HALO

Kesimpulan posisi:

- DATABASE = **master data akun**
- GAS = **lapisan operasional harian**

---

## 4. Prinsip Bisnis Yang Dikunci

### 4.1 DATABASE Tetap Menjadi Sumber Identitas

Modul GAS tidak boleh menduplikasi logika akun dasar.

Data berikut harus tetap bersumber dari DATABASE:

- siswa
- guru / wali kelas
- petugas OSIS
- kelas paralel

### 4.2 Admin GAS Bekerja Dalam Tenant Sekolah Sendiri

Admin sekolah hanya boleh melihat dan mengelola data operasional milik sekolahnya sendiri.

Pagar tenant:

- `schoolId`
- `NPSN`

### 4.3 Realtime Dipakai Ketat dan Hemat

Tidak semua menu GAS harus realtime penuh.

Aturan besarnya:

1. realtime dipakai untuk monitoring aktif
2. fetch biasa dipakai untuk laporan, arsip, dan halaman berat
3. listener tidak boleh hidup global di shell besar
4. setiap domain harus punya kontrol subscribe dan cleanup sendiri

### 4.4 Operasional Tidak Boleh Merusak Data Induk

Perubahan operasional seperti presensi, poin disiplin, nilai karakter, atau status virtual pet tidak boleh mengubah identitas akun dasar secara liar.

### 4.5 Semua Alur Harus Siap Dipakai APK

Desain GAS harus plug-and-play untuk APK:

1. Web Admin mengelola
2. backend memvalidasi
3. APK cukup membaca hasil akhir sesuai role

---

## 5. Ruang Lingkup Menu GAS

Struktur submenu mengacu pada `05_STRUKTUR_FOLDER_WEB.md`.

### 5.1 Students

#### Tujuan

Menjadi workspace operasional siswa untuk kebutuhan GAS, bukan pengganti DATABASE Siswa.

#### Fungsi

1. melihat siswa aktif yang sudah siap dipakai di modul GAS
2. mengelompokkan siswa berdasarkan kelas
3. menyiapkan relasi siswa ke presensi, disiplin, virtual pet, literasi, dan karakter

#### Catatan penting

Submenu ini tidak boleh menjadi tempat membuat identitas akun siswa dari nol. Identitas dasar tetap berasal dari DATABASE.

---

### 5.2 Teachers

#### Tujuan

Menjadi workspace operasional guru untuk kebutuhan GAS, terutama guru pengampu, wali kelas, atau operator yang terlibat di presensi, disiplin, dan penilaian karakter.

#### Fungsi

1. melihat guru aktif yang dapat dipakai modul GAS
2. menyiapkan relasi guru ke kelas yang diampu
3. mendukung proses input manual atau validasi oleh guru

#### Catatan penting

Submenu ini tidak menggantikan DATABASE Guru. Ia hanya menjadi lapisan operasional.

---

### 5.3 Attendance

#### Tujuan

Menjadi pusat pemantauan dan pengelolaan presensi sekolah.

#### Fungsi

1. monitoring kehadiran harian
2. input manual presensi bila diperlukan
3. validasi kehadiran per kelas
4. menjadi sumber status yang dapat diintegrasikan ke EduLock

#### Prioritas teknis

Menu ini adalah modul dengan beban tertinggi dan wajib dirancang paling hati-hati.

#### Catatan bisnis

Presensi adalah jantung operasional GAS. Jika modul ini lemah, modul turunannya ikut rapuh.

---

### 5.4 Attendance Report

#### Tujuan

Menyediakan rekap presensi periodik untuk kebutuhan sekolah.

#### Fungsi

1. rekap bulanan
2. filter per kelas
3. filter per siswa
4. export laporan

#### Aturan performa

Menu ini cenderung memakai fetch terkontrol, pagination, dan filter server-side. Tidak perlu realtime penuh.

---

### 5.5 Discipline

#### Tujuan

Mencatat pelanggaran atau perilaku kedisiplinan siswa sebagai dasar evaluasi dan integrasi ke Virtual Pet.

#### Fungsi

1. input pelanggaran
2. pengelolaan poin
3. papan peringkat atau ringkasan disiplin
4. trigger dampak ke modul Virtual Pet

#### Catatan bisnis

Perubahan poin disiplin harus tercatat rapi karena memengaruhi motivasi siswa dan modul lanjutan.

---

### 5.6 Virtual Pet

#### Tujuan

Menjadi dashboard gamifikasi perilaku siswa berbasis data presensi dan kedisiplinan.

#### Fungsi

1. monitoring status pet per siswa atau per kelas
2. reward / penalty massal
3. revive pet
4. membaca penurunan atau peningkatan kondisi pet dari event operasional

#### Ketergantungan

Menu ini bergantung pada:

- Attendance
- Discipline

---

### 5.7 Library

#### Tujuan

Menjadi pusat pengelolaan literasi dan inventaris perpustakaan atau tugas baca yang terhubung dengan aktivitas sekolah.

#### Fungsi

1. manajemen inventaris
2. validasi aktivitas/tugas literasi
3. rekap pemanfaatan sumber belajar

#### Catatan posisi

Di dokumen tahap kerja, menu ini diposisikan sebagai jembatan kebutuhan literasi dan e-perpustakaan.

---

### 5.8 Halo Spentgapa

#### Tujuan

Menjadi kanal aduan atau laporan internal sekolah yang aman dan terisolasi.

#### Fungsi

1. menerima laporan
2. menampilkan daftar laporan sesuai hak akses
3. menjaga privasi pelapor
4. memberi jalur tindak lanjut oleh operator sekolah

#### Prinsip penting

Privasi pelapor adalah syarat utama. Modul ini tidak boleh dirancang sembarangan.

---

### 5.9 Seven Habits

#### Tujuan

Menjadi modul pembinaan karakter siswa melalui input dan monitoring nilai kebiasaan atau karakter.

#### Fungsi

1. input nilai karakter
2. monitoring perkembangan siswa
3. rekap per kelas
4. dukungan evaluasi guru

#### Catatan posisi

Pada dokumen tahap kerja, menu ini ditempatkan sebagai tahap karakter setelah fondasi presensi dan disiplin terbentuk.

#### Catatan implementasi aktif

- halaman aktif memakai dua mode:
  - `Monitoring`
  - `Penilaian`
- sumber utama nilai saat ini adalah log kebiasaan `7 KAIH`, bukan komposit lintas modul lain
- bobot grading aktif:
  - `Konsistensi Harian` 40%
  - `Progress Mingguan` 30%
  - `Pencapaian Bulanan` 20%
  - `Nilai Guru` 10%
- rumus lama `Kehadiran/Sholat/Literasi/Guru` tidak lagi menjadi referensi halaman aktif

---

## 6. Urutan Ketergantungan Pengembangan

Berdasarkan `01_SITEPLAN_ALUR_KERJA.md`, urutan aman pengembangan modul GAS adalah:

### C.1 Master Data Operasional

1. Students
2. Teachers

### C.2 Presensi

3. Attendance
4. Attendance Report

### C.3 Kedisiplinan

5. Discipline

### C.4 Gamifikasi

6. Virtual Pet

### C.5 Literasi

7. Library

### C.6 Aduan

8. Halo Spentgapa

### C.7 Karakter

9. Seven Habits

Makna urutan ini:

- kita tidak membangun semua menu sekaligus
- kita mengikuti dependensi data
- modul berat seperti presensi harus matang sebelum modul turunan dilanjutkan

---

## 7. Kontrak Integrasi Dengan Modul Lain

### 7.1 Dengan DATABASE

Admin GAS wajib memakai data berikut sebagai referensi dasar:

- siswa aktif
- guru aktif
- kelas paralel
- role OSIS bila diperlukan untuk operasional

Admin GAS tidak boleh membangun akun liar di luar sumber data tersebut.

### 7.2 Dengan Super Admin

Admin GAS tetap tunduk pada:

- status tenant aktif/nonaktif
- identitas sekolah
- batasan school scope

Jika sekolah dinonaktifkan oleh pusat, operasional GAS ikut berhenti.

### 7.3 Dengan APK GAS

APK GAS akan mengonsumsi:

- identitas user yang sudah disiapkan dari DATABASE
- status operasional yang dibentuk di GAS
- hasil proses seperti presensi, poin, karakter, dan notifikasi yang relevan

### 7.4 Dengan EduLock

Presensi dari GAS dapat menjadi sumber pemicu status tertentu di EduLock sesuai arsitektur besar proyek.

---

## 8. Batas Data dan Batas Tanggung Jawab

### 8.1 Yang Menjadi Tanggung Jawab Modul GAS

- aktivitas harian
- monitoring operasional
- input transaksional
- laporan operasional
- evaluasi perilaku
- gamifikasi
- aduan

### 8.2 Yang Bukan Tanggung Jawab Modul GAS

- pendaftaran tenant
- pembuatan akun kepala sekolah
- fondasi login tenant
- master data identitas inti yang sudah menjadi wilayah DATABASE

### 8.3 Aturan File dan Arsitektur

Modul GAS wajib mengikuti rambu proyek:

1. tidak boleh kembali melahirkan file raksasa
2. struktur folder harus berbasis domain
3. realtime harus dibatasi per panel
4. komponen shell hanya menjadi orchestrator

---

## 9. Kebutuhan Non-Fungsional

### 9.1 Keamanan

1. semua akses wajib terikat `schoolId`
2. tidak ada kebocoran data lintas sekolah
3. aksi sensitif harus tervalidasi di backend
4. privasi laporan pada Halo Spentgapa wajib dijaga

### 9.2 Performa

1. aplikasi web admin harus ringan
2. tidak boros listener
3. laporan besar tidak boleh dipaksa realtime
4. modul presensi harus siap menghadapi jam sibuk

### 9.3 Maintainability

1. pemisahan domain wajib dijaga
2. file maksimal harus tetap waras dan mudah dirawat
3. setiap menu besar sebaiknya punya dokumen teknis dan kontrak data sendiri

### 9.4 Kesiapan Skala

1. struktur harus siap untuk banyak sekolah
2. data operasional tidak boleh membuat sistem berat tanpa kontrol retensi
3. modul berat harus punya strategi pruning, export, atau agregasi

---

## 10. Status Dokumen dan Arah Lanjutan

Status dokumen ini:

- **Aktif**
- **Berlaku sebagai PRD utama fase awal modul Admin GAS**

Dokumen ini menjadi pengunci arah bisnis dan ruang lingkup sebelum dilanjutkan ke dokumen pendamping:

1. spesifikasi teknis per menu GAS
2. kontrak data dan path RTDB/Firestore
3. matriks role dan hak akses
4. SOP operasional admin sekolah

---

## 11. Kesimpulan

Modul **Admin GAS** adalah lapisan operasional sekolah yang berdiri di atas fondasi akun dari **DATABASE**. Semua menu di dalamnya harus dibangun dengan prinsip:

1. tenant tetap terisolasi
2. data induk tidak diacak ulang
3. realtime dipakai secukupnya
4. modul disusun bertahap sesuai ketergantungan data
5. hasil akhirnya siap langsung dikoneksikan ke APK GAS dan integrasi sistem lain

Dokumen ini menegaskan bahwa pembangunan Admin GAS bukan sekadar membuat halaman baru, tetapi membentuk pusat operasional sekolah yang stabil, hemat, aman, dan siap tumbuh panjang.
