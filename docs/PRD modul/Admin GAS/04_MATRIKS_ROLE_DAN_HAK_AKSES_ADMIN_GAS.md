# Matriks Role dan Hak Akses Admin Sekolah: GAS

## 1. Tujuan Dokumen

Dokumen ini menjelaskan siapa yang boleh mengakses modul GAS Admin Sekolah dan hak akses apa yang berlaku pada tiap submenu.

Fungsinya:

1. menjaga agar role dan capability tidak bocor
2. memastikan batas Admin Sekolah, Guru, Siswa, dan Super Admin tetap jelas
3. menjadi acuan saat developer menambah aksi atau menu baru

Dokumen ini melengkapi:

- `01_PRD_ADMIN_GAS_DAN_SUBMENU.md`
- `02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md`

---

## 2. Prinsip Umum

Aturan dasar:

1. semua akses operasional sekolah wajib terikat `schoolId`
2. `admin` adalah operator utama halaman web Admin GAS
3. `teacher` dapat memiliki hak terbatas pada fungsi tertentu di alur bisnis GAS
4. `student` tidak boleh mengakses halaman web admin
5. `super_admin` bukan operator harian menu GAS tenant

---

## 3. Role Utama Yang Relevan

Role relevan:

1. `super_admin`
2. `admin`
3. `teacher`
4. `student`

Catatan:

- `Petugas OSIS` bukan role auth terpisah pada web admin
- OSIS adalah role tambahan dari akun siswa

---

## 4. Hak Akses Dasar Per Role

### 4.1 super_admin

Boleh:

- memantau status umum lintas tenant melalui jalur pusat
- menonaktifkan layanan tenant dari modul pusat

Tidak menjadi pengguna utama:

- halaman Admin GAS tenant

### 4.2 admin

Boleh:

- membuka seluruh halaman Admin GAS tenant miliknya
- melihat ringkasan dan daftar operasional
- menjalankan aksi administrasi sekolah yang diizinkan

Tidak boleh:

- mengakses tenant lain
- mengambil alih fungsi pusat Super Admin

### 4.3 teacher

Boleh secara bisnis pada domain tertentu:

- input presensi manual untuk kelas yang diampu
- input pelanggaran sesuai kewenangan
- input nilai karakter sesuai kelas yang diampu
- validasi aktivitas literasi jika nanti diaktifkan

Tidak boleh:

- membuka seluruh halaman Admin GAS sebagai admin sekolah
- mengakses data tenant di luar ruang tugasnya

### 4.4 student

Tidak boleh:

- membuka halaman web Admin GAS
- menjalankan mutasi operasional dari dashboard admin

Catatan:

- siswa hanya menjadi aktor pada APK atau jalur client yang memang disediakan, misalnya submit attendance mandiri

---

## 5. Matriks Hak Akses Ringkas

| Role | Students | Teachers | Attendance | Attendance Report | Discipline | Virtual Pet | Library | Halo Spentgapa | Seven Habits |
|---|---|---|---|---|---|---|---|---|---|
| `admin` | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| `super_admin` | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama | Tidak sebagai flow utama |
| `teacher` | Tidak sebagai admin | Tidak sebagai admin | Terbatas | Terbatas | Terbatas | Tidak sebagai admin | Terbatas | Tidak sebagai admin | Terbatas |
| `student` | Tidak | Tidak | Tidak via web admin | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak |

---

## 6. Hak Akses Per Submenu

## 6.1 Students

Boleh akses utama:

- `admin`

Hak:

- melihat siswa aktif
- memfilter siswa operasional
- memakai data siswa sebagai referensi modul lain

Tidak menjadi hak:

- membuat akun dasar baru dari modul GAS

---

## 6.2 Teachers

Boleh akses utama:

- `admin`

Hak:

- melihat guru aktif
- memetakan guru ke operasional kelas

Hak guru:

- tidak sebagai pengelola halaman admin

---

## 6.3 Attendance

Boleh akses:

- `admin`
- `teacher` terbatas pada kelas yang diampu
- `student` hanya melalui function submit mandiri di jalur client yang sah, bukan halaman admin

Hak `admin`:

- melihat monitor kehadiran
- input manual
- filter kelas dan tanggal

Hak `teacher`:

- input manual untuk kelas yang diampu
- melihat presensi kelas yang diampu

Larangan:

- teacher tidak boleh input manual untuk kelas lain

---

## 6.4 Attendance Report

Boleh akses:

- `admin`
- `teacher` terbatas

Hak `admin`:

- melihat rekap sekolah
- export rekap

Hak `teacher`:

- melihat rekap kelas yang diampu bila diaktifkan nanti

Larangan:

- student tidak boleh mengakses rekap admin

---

## 6.5 Discipline

Boleh akses:

- `admin`
- `teacher` terbatas sesuai kewenangan

Hak `admin`:

- melihat semua data disiplin tenant
- menjalankan koreksi operasional bila diperlukan

Hak `teacher`:

- input pelanggaran untuk siswa yang relevan dengan ruang tugasnya

Larangan:

- teacher tidak boleh melihat seluruh tenant tanpa pembatasan

---

## 6.6 Virtual Pet

Boleh akses utama:

- `admin`

Hak:

- monitoring kondisi pet
- menjalankan revive
- menjalankan reward/penalty massal sesuai aturan

Hak `teacher`:

- tidak menjadi operator utama admin untuk modul ini kecuali nanti ada keputusan capability baru

---

## 6.7 Library

Boleh akses:

- `admin`
- `teacher` terbatas bila diperlukan untuk validasi tugas

Hak `admin`:

- mengelola inventaris dan aktivitas literasi sekolah

Hak `teacher`:

- validasi atau monitoring tugas kelas yang diampu bila diaktifkan

---

## 6.8 Halo Spentgapa

Boleh akses:

- `admin`

Hak:

- melihat laporan sekolah
- memproses tindak lanjut
- memperbarui status penanganan

Batas penting:

- identitas pelapor dan detail sensitif tidak boleh dibuka ke semua role

Hak `teacher`:

- tidak otomatis memiliki akses penuh
- bila nanti diberi akses, harus sangat terbatas dan berbasis kasus

---

## 6.9 Seven Habits

Boleh akses:

- `admin`
- `teacher` terbatas

Hak `admin`:

- melihat dan memantau perkembangan karakter

Hak `teacher`:

- input nilai karakter untuk siswa atau kelas yang diampu

Larangan:

- teacher tidak boleh menilai kelas yang bukan tanggung jawabnya

---

## 7. Hak Akses Function dan Capability

Function acuan dan role minimal:

| Function | Capability | Role Utama |
|---|---|---|
| `submitAttendance` | `ATTENDANCE_SELF_SUBMIT` | `student` |
| `manualAttendanceInput` | `ATTENDANCE_INPUT_MANUAL` | `teacher`, `admin` |
| `recordViolation` | `DISCIPLINE_RECORD` | `teacher`, `admin` |
| `revivePet` | `PET_REVIVE` | `admin` |
| `rewardPenaltyBulk` | `PET_REWARD_PENALTY` | `admin` |

Catatan:

- `pruneOldAttendance` dan `calculatePetDecay` adalah scheduled function, bukan aksi manual user biasa

---

## 8. Batas Tenant dan Batas Kelas

Aturan mutlak:

1. admin sekolah A tidak boleh membaca atau menulis tenant sekolah B
2. guru hanya boleh menjalankan aksi pada kelas atau scope yang sah
3. `schoolId` wajib berasal dari auth context, bukan input bebas user
4. pembatasan per kelas harus divalidasi di server untuk action yang sensitif

---

## 9. Larangan Hak Akses

Dilarang:

1. membiarkan `student` membuka halaman Admin GAS
2. membiarkan `teacher` memanipulasi data di luar kelasnya
3. memberi akses Halo Spentgapa tanpa filter sensitif
4. mengandalkan frontend saja untuk pagar keamanan
5. membiarkan admin tenant melihat tenant lain

---

## 10. Rekomendasi Penguatan Berikutnya

Jika implementasi GAS mulai berjalan:

1. buat audit log untuk aksi sensitif
2. pisahkan capability per domain, jangan hanya mengandalkan role besar
3. definisikan rule detail teacher per kelas dan per aksi
4. buat masking atau pembatasan tambahan untuk data Halo

---

## 11. Kesimpulan

Dokumen ini mengunci bahwa:

1. `admin` adalah operator utama Admin GAS
2. `teacher` hanya mendapat hak terbatas sesuai domain dan kelas
3. `student` tidak masuk ke halaman admin
4. semua akses tetap berada dalam pagar `schoolId`
5. keamanan backend wajib menjadi pagar utama

Status dokumen:

- **Aktif**
- **Acuan role dan hak akses modul Admin GAS**
