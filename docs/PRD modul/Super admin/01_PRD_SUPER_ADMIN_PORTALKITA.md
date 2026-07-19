# PRD Modul Super Admin PortalKita

## 1. Ringkasan

Modul **Super Admin** adalah pusat kendali tertinggi untuk seluruh ekosistem PortalKita. Modul ini dipakai operator pusat untuk:

- mengelola sekolah dan tenant
- menjaga identitas tenant tetap konsisten
- memprovisi akses admin sekolah
- mengelola akun kepala sekolah
- memantau layanan lintas sekolah
- menjalankan kontrol global tanpa membuka Firebase Console untuk pekerjaan harian

Modul ini **bukan** tempat CRUD data siswa, guru, petugas OSIS, atau kelas sekolah. Semua data operasional harian level sekolah tetap menjadi wilayah **Web Admin Sekolah**.

Catatan arsitektur:

- pemisahan ranah Super Admin secara konsep berada di `src/app/super-admin`
- pada implementasi berjalan, masih ada sebagian route kompatibilitas lama di area `/dashboard/super*`
- dokumen ini menetapkan **arah kanonik** modul Super Admin berada di namespace `/super-admin/*`, sedangkan route lama hanya dianggap jembatan transisi dan bukan acuan desain baru

---

## 2. Tujuan Modul

Tujuan utama modul Super Admin:

1. menjadi pusat registrasi dan kontrol seluruh sekolah atau tenant
2. menjadi satu-satunya tempat pengelolaan akun strategis pusat
3. menyediakan panel pengawasan lintas sekolah untuk operasional, audit, dan monitoring layanan
4. menjadi fondasi arsitektur multi-tenant yang aman, terisolasi, dan hemat biaya

---

## 3. Pengguna Target

Pengguna modul ini hanya:

- `super_admin`

Tidak boleh bisa diakses oleh:

- admin sekolah
- guru
- siswa
- petugas OSIS
- kepala sekolah

Pagar akses wajib:

- Firebase Auth
- custom claims `role: "super_admin"`
- guard frontend
- validasi backend

Catatan jujur implementasi:

- validasi role pusat sudah aktif
- pemisahan capability yang lebih rinci masih menjadi target penguatan bertahap

---

## 4. Posisi Modul Dalam Ekosistem

Alur sistem yang dikunci:

1. **Super Admin** mengelola tenant dan akun strategis pusat
2. **Admin Sekolah** mengelola data induk akun sekolah dan operasional modul sekolah
3. **APK** login berdasarkan data yang sudah disiapkan oleh pusat dan admin sekolah sesuai peran masing-masing

Pembagian tanggung jawab:

- **Super Admin**
  - registrasi sekolah
  - aktivasi atau nonaktif tenant
  - pengaturan global
  - akun kepala sekolah
  - kontrol layanan lintas sekolah
  - monitoring pusat
- **Admin Sekolah**
  - DATABASE siswa
  - DATABASE guru atau wali kelas
  - DATABASE petugas OSIS
  - DATABASE kelas

---

## 5. Outcome Bisnis

Jika modul ini berjalan benar, maka:

1. setiap sekolah hanya aktif jika terdaftar resmi di pusat
2. `npsn` menjadi pagar tenant yang konsisten dari hulu ke hilir
3. onboarding sekolah baru lebih cepat dan aman
4. operasional lintas sekolah bisa dipantau dari satu tempat
5. ketergantungan pada Firebase Console untuk kerja harian bisa ditekan

---

## 6. Batasan Modul

Modul Super Admin **tidak** menangani:

- CRUD data siswa sekolah
- CRUD data guru sekolah
- CRUD data OSIS sekolah
- CRUD data kelas sekolah
- pengelolaan konten harian level sekolah

Semua hal di atas tetap ranah **Web Admin Sekolah**.

---

## 7. Struktur Fitur Inti

### 7.1 Struktur Menu Primer Web Yang Dikunci

Mulai kondisi web yang dikunci saat ini, sidebar primer Super Admin hanya berisi:

1. `Dashboard Utama`
2. `Database Induk`
3. `Monitoring`
4. `Status Layanan Sekolah`
5. `EduLock Uninstall Access`

Catatan penting:

- route utilitas lama seperti global config, sync jobs, support tools, broadcast, dan audit masih boleh tetap ada sebagai route atau alat pendukung
- namun route tersebut **bukan lagi menu primer sidebar**
- acuan UI utama Super Admin sekarang mengikuti lima menu di atas

### 7.2 Dashboard Utama

Fungsi:

- menampilkan ringkasan sistem lintas tenant
- menampilkan indikator tingkat atas tanpa menduplikasi menu navigasi
- menjadi overview cepat, bukan pusat aksi detail

Output minimal:

- total sekolah
- total tenant aktif
- total admin sekolah
- total akun kepala sekolah
- indikator operasional tingkat atas

Aturan:

- halaman dashboard harus tetap berupa ringkasan
- card menu domain lama tidak boleh kembali memenuhi dashboard utama

### 7.3 Database Induk

Fungsi:

- mengelola registry sekolah atau tenant
- memprovisi akses admin sekolah
- mengelola akun kepala sekolah
- menjadi pusat akun strategis lintas sekolah

Cakupan utama:

- `Sekolah & Tenant`
- `Admin Sekolah`
- `Akun Kepala Sekolah`

Field minimum tenant:

- `schoolId`
- `name`
- `district`
- `npsn`
- `authEmail`
- `adminEmail`
- `backupEmail`
- `isActive`
- `adminAccessActive`
- `createdAt`
- `updatedAt`

Aturan penting:

- `npsn` adalah identitas sekolah tingkat pusat
- `schoolId` adalah kunci tenant internal yang stabil
- akun admin sekolah tetap membaca source of truth dari `schools/{schoolId}`
- reset password admin sekolah tersedia dari pusat dengan default operasional `admin123`
- reset password kepala sekolah juga tersedia dari pusat dengan default operasional `admin123`
- untuk admin sekolah, setelah bootstrap atau reset password, web memaksa ganti password sebelum lanjut operasional

### 7.4 Monitoring

Fungsi:

- memantau akun strategis dan log keamanan pusat
- melihat anomali akun atau tenant lintas sekolah
- memisahkan monitoring pusat dari halaman data induk dan status layanan

Catatan implementasi:

- halaman ini diposisikan sebagai panel monitoring primer
- log investigatif detail penuh masih belum final; UI saat ini masih bertumpu pada log keamanan pusat yang lebih ringkas

### 7.5 Status Layanan Sekolah

Fungsi:

- memantau status pembayaran sekolah
- mengontrol aktif atau nonaktif layanan tenant
- menghubungkan status pembayaran dengan izin layanan admin sekolah
- memantau siswa unik yang menjadi dasar billing

Struktur halaman yang dikunci:

- tab `Status Layanan`
- tab `Monitoring Pengguna Aktif`

Makna tab:

- `Status Layanan` berfokus pada pembayaran sekolah, tenant aktif atau nonaktif, dan kontrol layanan operasional
- `Monitoring Pengguna Aktif` berfokus pada siswa unik per sekolah

Aturan billing yang dikunci:

- GAS dan EduLock memakai konsep **single akun siswa**
- satu siswa dihitung satu kali walau memakai lebih dari satu aplikasi
- dasar billing adalah `siswa teraktivasi / siswa ditagihkan`
- `aktif operasional` hanya untuk pantauan realtime, bukan dasar billing bulanan

Output minimal tab monitoring:

- total sekolah
- total siswa
- siswa ditagihkan
- belum aktivasi
- aktif operasional
- estimasi tagihan berdasarkan tarif per siswa pusat

### 7.6 EduLock Uninstall Access

Fungsi:

- mengelola kode uninstall EduLock lintas tenant
- memilih tenant target secara eksplisit
- membuat dan menghapus kode uninstall dari pusat
- menampilkan representasi barcode atau QR untuk kode uninstall yang aktif

Aturan:

- halaman ini berdiri sebagai menu primer karena bersifat kritikal dan operasional
- menu ini tidak lagi disembunyikan di bawah status layanan
- source of truth tetap berada di node tenant settings yang sama dengan panel admin sekolah

### 7.7 Fungsi Pendukung Yang Tetap Ada

Fungsi pusat berikut tetap sah secara sistem, tetapi tidak lagi menjadi menu primer sidebar:

- global configuration
- broadcast global
- sync jobs
- support tools
- audit atau compliance

Aturan:

- fitur ini diperlakukan sebagai utilitas pendukung
- dokumentasi dan route tetap boleh hidup
- namun jangan mengembalikan semuanya sebagai menu primer tanpa keputusan desain baru

---

## 8. Alur Penggunaan Utama

### 8.1 Onboarding Sekolah Baru

1. Super Admin menambahkan sekolah atau tenant baru
2. sistem menyimpan identitas tenant dan `npsn`
3. Super Admin memprovisi akses admin sekolah
4. bila dibutuhkan, Super Admin menyiapkan akun kepala sekolah
5. setelah itu admin sekolah dapat masuk dan mengelola DATABASE sekolahnya

### 8.2 Aktivasi atau Nonaktif Tenant

1. Super Admin membuka menu tenant
2. Super Admin mengubah status tenant
3. sistem menandai tenant aktif atau nonaktif
4. tenant nonaktif tidak boleh dipakai untuk operasional normal

### 8.3 Pengelolaan Kepala Sekolah

1. Super Admin membuka menu akun kepala sekolah
2. Super Admin mengisi data akun
3. sistem menyimpan akun dan relasi ke tenant
4. bila perangkat bermasalah, Super Admin dapat menjalankan reset device

### 8.4 Monitoring Billing Siswa

1. Super Admin membuka tab `Monitoring Pengguna Aktif` pada `Status Layanan Sekolah`
2. sistem membaca jumlah siswa dari `Database Siswa`
3. sistem menghitung siswa unik yang sudah aktivasi
4. sistem menurunkan estimasi billing dari `siswa ditagihkan x tarif per siswa`
5. data realtime operasional hanya dipakai untuk pantauan penggunaan, bukan dasar billing

---

## 9. Kontrak Data Penting

### 9.1 Tenant

Tenant adalah sekolah yang sudah diregistrasi oleh pusat.

Kontrak tenant minimal:

- punya `schoolId`
- punya `npsn`
- punya status aktif atau nonaktif
- punya identitas login admin sekolah yang konsisten di registry pusat

### 9.2 Kepala Sekolah

Kontrak akun kepala sekolah:

- terkait ke satu sekolah
- terkait ke `npsn`
- login memakai `npsn + username stabil + password`

### 9.3 Admin Sekolah

Kontrak akun admin sekolah:

- terkait ke satu tenant
- tidak boleh mengakses tenant lain
- sumber kebenaran login admin sekolah harus tunggal, tidak boleh ganda

---

## 10. Keamanan dan Isolasi

Prinsip keamanan yang wajib:

1. semua data tenant harus berada dalam pagar `schoolId` dan `npsn`
2. hanya `super_admin` yang boleh mengakses kontrol lintas sekolah
3. admin sekolah tidak boleh mengakses data tenant lain
4. proses perubahan strategis harus divalidasi server-side

Implementasi inti:

- Firebase Auth custom claims
- guard halaman frontend
- validasi API backend
- isolasi path RTDB per tenant

---

## 11. Integrasi Dengan Modul Lain

### 11.1 Integrasi Dengan Web Admin Sekolah

Hubungan:

- Super Admin menyiapkan tenant dan akses tingkat atas
- Admin Sekolah mengelola data induk akun sekolah

Konsekuensi:

- tanpa tenant valid dari pusat, admin sekolah tidak boleh berjalan normal

### 11.2 Integrasi Dengan APK GAS

Hubungan:

- akun kepala sekolah bersumber dari Super Admin
- akun guru dan siswa bersumber dari Web Admin Sekolah

### 11.3 Integrasi Dengan APK EduLock

Hubungan:

- Super Admin mengelola kontrol lintas tenant dan layanan pusat
- data operasional user sekolah tetap berasal dari admin sekolah

---

## 12. Non-Functional Requirements

### 12.1 Keamanan

- akses berbasis role harus ketat
- tidak boleh ada bypass lintas tenant
- kredensial sensitif tidak boleh bocor

### 12.2 Skalabilitas

- siap menangani banyak sekolah
- panel pusat tidak boleh bergantung pada query liar yang berat

### 12.3 Keringanan Sistem

- realtime dipakai seperlunya
- data monitoring besar tidak boleh boros listener
- halaman pusat harus tetap responsif

### 12.4 Maintainability

- modul tidak boleh bertumpu pada file raksasa
- harus bisa dipecah per domain secara bertahap

---

## 13. Status Implementasi Saat Ini

Status saat ini:

- halaman Web Super Admin sudah tersedia dan bisa berjalan
- lint dan build proyek saat ini bisa lolos
- helper dan API pendukung utama sudah dirapikan
- pemisahan modul Super Admin secara konsep sudah jelas
- struktur menu primer web saat ini sudah dikunci ke lima menu utama
- status layanan sekolah sudah membaca status pembayaran tenant
- monitoring pengguna aktif sudah digeser ke model siswa unik dan estimasi billing
- halaman EduLock uninstall access sudah berdiri sebagai menu primer tersendiri

Catatan jujur:

- struktur route masih berada pada fase transisi antara namespace baru dan route kompatibilitas lama
- sebagian route utilitas lama masih hidup tetapi tidak lagi menjadi menu primer
- validasi capability backend belum sepenuhnya serinci target desain
- schema audit log pusat yang tampil di UI masih lebih ringkas dibanding target ideal audit investigatif

Kesimpulan status:

- modul ini **layak dilanjutkan**
- tetapi **belum boleh di-overclaim sebagai final 100 persen secara arsitektur**

---

## 14. Rekomendasi Pengembangan Lanjutan

Urutan sehat setelah PRD ini:

1. pertahankan Super Admin sebagai kontrol tenant dan akses pusat
2. jangan pindahkan tanggung jawab DATABASE sekolah ke Super Admin
3. seragamkan route kanonik ke namespace `/super-admin/*`
4. rapikan validasi capability backend secara bertahap
5. lakukan refactor modular bertahap untuk halaman legacy atau hybrid bila modul mulai dikembangkan intensif

---

## 15. Kesimpulan

Modul Super Admin adalah **pusat registry, kontrol, dan pengawasan lintas sekolah** dalam ekosistem PortalKita. Modul ini tidak mengelola operasional harian data user sekolah, tetapi menjadi fondasi yang menentukan apakah tenant boleh hidup, siapa yang boleh mengelola tenant, dan akun strategis apa yang harus tersedia di tingkat pusat.

Dengan posisi itu, modul Super Admin harus dijaga sebagai:

- pusat kontrol tenant
- pusat akses manajerial tingkat atas
- pusat konfigurasi global
- pusat monitoring dan audit lintas sekolah

Status dokumen:

- **Aktif**
- **Berlaku sebagai PRD modul Super Admin**
