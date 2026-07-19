# Spesifikasi Virtual Pet dan 7 KAIH

Status: diperbarui agar menggambarkan keadaan aplikasi saat ini.

Dokumen ini dipakai sebagai catatan implementasi aktif modul `Virtual Pet` dan `7 KAIH` di web admin GAS.

Tujuan utamanya:
- mencegah developer mengikuti rumus atau alur lama yang sudah tidak dipakai
- membedakan dengan tegas antara kondisi aplikasi saat ini vs ide pengembangan lanjutan
- menjadi rujukan cepat sebelum tim menyentuh halaman `Virtual Pet` atau `7 KAIH`

Catatan penting:
- isi file ini harus mengikuti implementasi yang hidup di folder `web/`
- jika implementasi berubah, dokumen ini wajib ikut diperbarui
- dokumen ini tidak boleh lagi dipakai untuk mendorong tim kembali ke formula lama `7 KAIH` berbasis `Kehadiran/Sholat/Literasi`

---

## 1. Ringkasan Status Saat Ini

### 1.1 Virtual Pet

Secara umum, spesifikasi konsep `Virtual Pet` masih relevan terhadap menu aplikasi saat ini.

Yang sudah aktif di aplikasi:
- halaman admin untuk memonitor daftar pet per sekolah
- pembacaan data pet dari RTDB node `virtual_pets`
- riwayat revive dari RTDB node `platform_events`
- aksi admin:
  - `revive`
  - `reset-level`
  - `give-reward`

Yang perlu dipahami:
- `Virtual Pet` saat ini sudah punya alur admin yang nyata
- tetapi tidak semua relasi lintas modul harus dianggap sudah otomatis terhubung hanya karena pernah tertulis di dokumen lama
- jadi, developer tidak boleh membongkar halaman aktif hanya karena mengejar narasi konsep lama

### 1.2 7 KAIH

Bagian `7 KAIH` pada dokumen lama sudah tidak akurat dan sempat menyesatkan implementasi.

Keadaan menu `7 KAIH` yang aktif sekarang:
- halaman punya dua mode:
  - `Monitoring`
  - `Penilaian`
- basis datanya adalah log kebiasaan harian `7 KAIH`
- grading aktif dihitung dari util `web/src/utils/grading7Habits.ts`
- formula aktif saat ini **bukan** lagi campuran `Kehadiran/Sholat/Literasi`

Keputusan resmi:
- rumus lama `40% Kehadiran + 30% Sholat + 20% Literasi + 10% Guru` dinyatakan **usang** untuk UI `7 KAIH` aktif
- developer berikutnya tidak boleh memakai rumus lama itu sebagai acuan membangun ulang halaman

---

## 2. Virtual Pet: Kondisi Implementasi Aktif

## 2.1 Tujuan Menu

Menu `Virtual Pet` di web admin dipakai untuk:
- memonitor kondisi pet siswa pada tenant sekolah
- melakukan intervensi admin saat pet bermasalah
- menjalankan aksi operasional seperti revive, reset level, dan reward

Menu ini bukan sekadar halaman dekoratif.

## 2.2 Sumber Data Aktif

Sumber data yang dipakai implementasi aktif:
- RTDB `virtual_pets`
- RTDB `platform_events`

Di sisi web admin saat ini, data pet yang terbaca mencakup minimal:
- `id`
- `studentId`
- `schoolId`
- `studentName`
- `petName`
- `type`
- `status`
- `manualReviveUntil`
- `stats`
  - `level`
  - `exp`
  - `maxExp`
  - `health`
  - `energy`
  - `happiness`
  - `intelligence`
  - `social`
  - `coins`
  - `hunger`
- `lastSync`

## 2.3 Aksi Admin Yang Aktif

Route admin aktif: `web/src/app/api/admin/virtual-pet/route.ts`

Aksi yang sudah tersedia:

1. `revive`
- target: 1 pet
- efek:
  - `health = 50`
  - `happiness = 50`
  - `energy = 50`
  - `hunger = 50`
  - `status = "HAPPY"`
  - `manualReviveUntil = now + 12 jam`
- event dicatat ke `platform_events` dengan tipe `VIRTUAL_PET_REVIVE`

2. `reset-level`
- target: 1 pet
- efek:
  - `level = 1`
  - `experiencePoints = 0`

3. `give-reward`
- target: banyak pet
- tipe reward yang aktif saat ini:
  - `coins`
  - `exp`
  - `intelligence`
  - `social`

## 2.4 Catatan Arsitektur Penting

Empat bar inti pet masih boleh dipahami sebagai kerangka konsep:
- `hunger`
- `happiness`
- `energy`
- `health`

Tetapi untuk keadaan aplikasi saat ini:
- dokumen ini tidak memaksakan pemetaan otomatis dari semua modul lain ke pet bila integrasinya belum benar-benar ditegakkan di code path aktif
- jika tim ingin memperluas integrasi otomatis dari presensi, sholat, literasi, atau disiplin ke pet, itu harus diperlakukan sebagai pengembangan baru, bukan asumsi diam-diam

Artinya:
- konsep lama masih berguna sebagai arah produk
- tetapi tidak boleh lagi dipakai untuk mengubah halaman aktif tanpa verifikasi implementasi nyata

---

## 3. 7 KAIH: Kondisi Implementasi Aktif

## 3.1 Tujuan Menu

Menu `7 KAIH` di web admin dipakai untuk:
- memonitor log harian 7 kebiasaan siswa
- melihat capaian per kelas atau per siswa
- menghitung penilaian karakter berbasis log kebiasaan
- menambahkan penilaian guru melalui rubric
- mengekspor dan mencetak laporan

## 3.2 Mode Halaman Yang Aktif

Halaman aktif memiliki dua mode utama:

1. `Monitoring`
- fokus pada log kebiasaan harian
- dapat dilihat per kelas atau per siswa
- mendukung filter:
  - tahun
  - bulan
  - minggu
  - hari
  - jenjang
  - kelas
  - siswa

2. `Penilaian`
- fokus pada rekap nilai karakter
- memakai data log `7 KAIH` dan rubric guru
- dapat dilihat per kelas atau per siswa
- mendukung export Excel dan cetak laporan

## 3.3 Sumber Data Yang Menjadi Acuan Saat Ini

Sumber kebenaran UI `7 KAIH` aktif:
- komponen: `web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx`
- hook data: `web/src/hooks/gas/seven-habits/useGasSevenHabits.ts`
- util grading: `web/src/utils/grading7Habits.ts`

Catatan penting:
- jika ada route API lama yang masih membawa formula lama, route itu **bukan** sumber kebenaran utama untuk tampilan `7 KAIH` aktif
- untuk kondisi aplikasi sekarang, rumus grading yang harus diikuti adalah yang hidup di `grading7Habits.ts`

## 3.4 Formula Grading Aktif

Formula aktif saat ini:

1. `Konsistensi Harian` = 40%
- dihitung dari rata-rata keterisian 7 kebiasaan per log harian
- setiap hari bernilai `jumlah kebiasaan tercapai / 7 * 100`

2. `Progress Mingguan` = 30%
- dihitung dari akumulasi tick kebiasaan per minggu
- setiap minggu dinormalisasi terhadap target penuh mingguan

3. `Pencapaian Bulanan` = 20%
- dihitung dari total tick kebiasaan pada bulan aktif
- dinormalisasi terhadap target penuh bulanan

4. `Nilai Guru` = 10%
- diambil dari rubric guru yang disimpan per siswa per bulan per tahun

Rumus akhir:

`finalScore = (dailyConsistency * 0.4) + (weeklyProgress * 0.3) + (monthlyAchievement * 0.2) + (teacherRating * 0.1)`

## 3.5 Rubric Guru Yang Aktif

Rubric guru aktif sekarang terdiri dari 4 komponen:
- `honesty`
- `behavior`
- `initiative`
- `commitment`

Masing-masing bernilai `0-25`.

Nilai total rubric:
- `total = honesty + behavior + initiative + commitment`

## 3.6 Predikat Yang Aktif

Predikat nilai akhir yang aktif:
- `>= 95` -> `A - Sangat Baik Sekali`
- `>= 85` -> `B - Sangat Baik`
- `>= 70` -> `C - Baik`
- `>= 50` -> `D - Cukup`
- `< 50` -> `E - Kurang`

## 3.7 Fitur UI Yang Sudah Aktif

Fitur yang sudah hidup pada halaman `7 KAIH` saat ini:
- toggle `Monitoring` dan `Penilaian`
- filter `VII`, `VIII`, `IX`
- filter kelas yang mendukung format roman maupun numerik
- tabel monitoring kelas
- detail monitoring siswa per tanggal
- modal rubric guru
- tombol `Export Excel`
- tombol `Cetak Laporan`
- print header laporan

---

## 4. Hal Yang Sudah Tidak Boleh Dipakai Lagi

Mulai sekarang, developer **dilarang** memakai bagian berikut dari versi lama dokumen ini sebagai acuan implementasi `7 KAIH`:

1. rumus:
- `Kehadiran 40%`
- `Sholat 30%`
- `Literasi 20%`
- `Guru 10%`

2. asumsi bahwa penilaian `7 KAIH` aktif adalah komposit lintas modul lain

3. asumsi bahwa backend route lama otomatis lebih benar daripada util grading yang dipakai UI aktif

Jika tim ingin kembali memakai model komposit lintas modul:
- itu harus diputuskan ulang sebagai perubahan produk
- tidak boleh dimasukkan diam-diam lewat dokumen referensi

---

## 5. Posisi Dokumen Ini Ke Depan

Dokumen ini sekarang berfungsi sebagai:
- catatan keadaan aktual modul `Virtual Pet`
- catatan keadaan aktual modul `7 KAIH`
- pagar agar developer baru tidak tersasar ke rumus yang sudah obsolete

Aturan pemeliharaan:
- setiap perubahan besar pada `Virtual Pet` atau `7 KAIH` wajib diikuti update dokumen ini
- jika implementasi dan dokumen bertentangan, developer harus menganggap dokumen ini perlu diperbarui, bukan memaksa aplikasi kembali ke deskripsi lama
