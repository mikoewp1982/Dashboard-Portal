# PRD Modul Monitoring & Laporan Final

## 1. Ringkasan

Dokumen ini mengunci kondisi final modul **Monitoring & Laporan** pada menu **Admin GAS** per **15 Juli 2026**.

Ruang lingkup dokumen ini mencakup enam submenu:

1. Rekap Kehadiran
2. Rekap Kedisiplinan
3. Monitoring E-Library
4. Rekap Sholat
5. Virtual Pet Monitor
6. 7 KAIH

Dokumen ini dibuat setelah audit implementasi, penyesuaian referensi, hardening hemat data, dan modularisasi file besar selesai dilakukan.

---

## 2. Tujuan Modul

Tujuan modul Monitoring & Laporan:

1. memberi admin sekolah akses cepat ke histori, rekap, dan monitoring operasional harian
2. menyediakan tampilan yang cukup kaya untuk audit sekolah tanpa membebani RTDB secara liar
3. menjaga agar layar histori besar tidak memakai listener hidup terus
4. mempertahankan kontrol manual admin melalui tombol `Muat Ulang`, `Export`, dan `Cetak`
5. memastikan seluruh data tetap scoped ke tenant sekolah masing-masing

---

## 3. Prinsip Yang Sudah Dikunci

### 3.1 Tenant Wajib Ketat

Semua pembacaan dan mutasi wajib terikat ke `schoolId`. Admin sekolah tidak boleh melihat data tenant lain.

### 3.2 Hemat Data Wajib Jadi Default

Khusus layar histori, rekap, dan monitoring besar:

1. gunakan **one-shot fetch**
2. gunakan **API route server-side** untuk snapshot data besar
3. hindari `onValue()` atau `onSnapshot()` global yang hidup terus
4. sediakan tombol **Muat Ulang**

### 3.3 Data Induk Tetap Dari DATABASE

Data siswa, kelas, dan guru tetap mengacu pada modul DATABASE. Monitoring & Laporan tidak boleh membuat sumber identitas baru.

### 3.4 Mutasi Sensitif Lewat Backend

Aksi sensitif seperti:

- input nilai guru 7 KAIH
- revive Virtual Pet
- reset level pet
- reward Virtual Pet

wajib lewat backend terverifikasi, bukan write liar langsung dari browser.

### 3.5 Anti File Raksasa

Shell halaman utama wajib dijaga tetap modular. Komponen tabel, tab, modal, helper, dan config dipisah per domain.

---

## 4. Status Final Implementasi

### 4.1 Rekap Kehadiran

Fungsi final:

1. menampilkan histori presensi per kelas/siswa
2. mendukung refresh manual
3. memakai referensi kelas dan siswa secara one-shot fetch

Catatan final:

- tidak memakai listener histori besar hidup terus
- tetap mendukung kebutuhan rekap operasional admin

### 4.2 Rekap Kedisiplinan

Fungsi final:

1. menampilkan catatan pelanggaran
2. mengelola aturan kedisiplinan
3. memisahkan area record dan area rule manager secara modular

Catatan final:

- file utama sudah dipecah agar lebih aman dirawat
- cocok untuk lanjutan fitur tanpa menumpuk satu file besar

### 4.3 Monitoring E-Library

Fungsi final:

1. menampilkan log literasi
2. mendukung export
3. memakai snapshot API untuk monitoring log besar

Catatan final:

- log yang sebelumnya sudah diambil tetapi belum tampil kini sudah benar-benar dirender
- tombol export memakai data snapshot aktif

### 4.4 Rekap Sholat

Fungsi final:

1. menampilkan rekap presensi sholat
2. mengambil referensi kelas dan siswa secara one-shot
3. menjaga query RTDB tetap scoped dan efisien

Catatan final:

- path `prayer_attendance` sudah mengikuti kebutuhan index query `schoolId`
- perilaku data sudah lebih aman untuk beban jangka panjang

### 4.5 Virtual Pet Monitor

Fungsi final:

1. monitoring ringkasan pet aktif
2. leaderboard
3. students at risk
4. statistik distribusi
5. admin reward
6. riwayat revive

Catatan final:

- data besar tidak lagi dibaca lewat listener global browser
- snapshot diambil via `GET /api/admin/virtual-pet?schoolId=`
- aksi admin tetap melalui backend
- file utama sudah modular dan turun menjadi sekitar 295 baris

### 4.6 7 KAIH

Fungsi final:

1. mode `Monitoring`
2. mode `Penilaian`
3. grading berbasis log kebiasaan aktif
4. input rubric guru
5. export Excel
6. cetak laporan

Formula final yang dikunci:

- `Konsistensi Harian` 40%
- `Progress Mingguan` 30%
- `Pencapaian Bulanan` 20%
- `Nilai Guru` 10%

Catatan final:

- tidak boleh kembali memakai formula lama `Kehadiran/Sholat/Literasi/Guru`
- filter kelas mendukung format `VII/VIII/IX` dan `7/8/9`
- tabel monitoring memakai nama kebiasaan penuh, bukan `H1-H7`
- file utama sudah modular dan turun menjadi sekitar 284 baris

---

## 5. Arsitektur Data Final

### 5.1 Jalur Snapshot Server-Side

Jalur backend yang menjadi fondasi hemat data:

1. `/api/admin/seven-habits`
2. `/api/admin/seven-habits/grading`
3. `/api/admin/virtual-pet`
4. `/api/admin/library-monitoring`

### 5.2 RTDB Path Penting

Path aktif yang relevan:

- `seven_habits_logs/{studentId}/{date}`
- `seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}`
- `prayer_attendance`
- `literacy_logs`
- `virtual_pets`

Catatan:

- query besar wajib dipagari `schoolId`
- query yang butuh index wajib diberi `.indexOn` yang sesuai

---

## 6. Struktur Frontend Final

Domain utama berada di:

```text
web/src/components/gas/
├── attendance/
├── discipline/
├── library/
├── prayer/
├── seven-habits/
└── virtual-pet/
```

Status modularisasi final shell utama:

1. `Gas7HabitsPanel.tsx` -> 284 baris
2. `GasPetPanel.tsx` -> 295 baris
3. `GasLibraryPanel.tsx` -> 204 baris
4. `GasDisciplinePanel.tsx` -> 292 baris

Ini menegaskan bahwa halaman besar sudah dipecah ke helper, tab content, modal, config, dan section terpisah.

---

## 7. Ketentuan UX Operasional

Ketentuan yang sudah dianggap final:

1. admin memegang kontrol sinkronisasi melalui tombol `Muat Ulang`
2. halaman rekap besar tidak harus realtime penuh
3. fitur `Export Excel` dan `Cetak Laporan` dipertahankan pada domain yang membutuhkan
4. tampilan 7 KAIH harus mengikuti referensi aktif yang sudah diselaraskan
5. label monitoring harus jelas dan tidak memakai singkatan yang membingungkan

---

## 8. Yang Tidak Boleh Dilakukan Lagi

Larangan untuk developer berikutnya:

1. jangan menghidupkan lagi listener global untuk log besar hanya demi update instan
2. jangan memakai dokumen lama 7 KAIH yang masih berbasis `Kehadiran/Sholat/Literasi/Guru`
3. jangan menggabungkan kembali tab besar ke satu file raksasa
4. jangan menulis mutasi sensitif langsung dari client
5. jangan mengubah sumber identitas siswa/guru/kelas di dalam modul Monitoring & Laporan

---

## 9. Status Final

Status modul **Monitoring & Laporan** saat ini:

- implementasi aktif sudah sinkron dengan aturan hemat data proyek
- submenu utama yang diaudit sudah berjalan pada pola snapshot/on-demand
- modularisasi utama sudah selesai
- build produksi `web/` sudah lolos

Dokumen ini dapat dipakai sebagai acuan final untuk penutupan modul **Monitoring & Laporan** dan dasar melanjutkan modul berikutnya.
