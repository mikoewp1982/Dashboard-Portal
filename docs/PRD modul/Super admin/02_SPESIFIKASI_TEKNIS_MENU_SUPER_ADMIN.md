# Spesifikasi Teknis Menu Super Admin

## 1. Tujuan Dokumen

Dokumen ini adalah pendamping teknis dari PRD utama modul Super Admin.

Fungsinya:

1. menjelaskan detail teknis per menu
2. menjadi rambu implementasi developer berikutnya
3. menjaga agar tanggung jawab Super Admin tidak melebar ke ranah Web Admin Sekolah
4. mengunci route kanonik dan kontrak integrasi yang konsisten dengan sistem saat ini

Dokumen utama yang harus dibaca bersama:

- `01_PRD_SUPER_ADMIN_PORTALKITA.md`

---

## 2. Prinsip Teknis Umum

Semua menu Super Admin wajib mengikuti prinsip berikut:

1. akses hanya untuk `role = super_admin`
2. perubahan strategis tidak boleh hanya divalidasi di frontend
3. semua aksi penting harus aman saat tenant bertambah
4. pembacaan data lintas sekolah harus hemat dan terkontrol
5. jangan menaruh logika lintas domain di satu file raksasa
6. route kanonik baru harus mengikuti namespace `/super-admin/*`

Catatan implementasi:

- beberapa route kompatibilitas lama di `/dashboard/super*` masih bisa ditemukan
- route lama hanya dianggap jembatan transisi, bukan acuan untuk penambahan fitur baru

---

## 3. Struktur Menu Aktif

Menu Super Admin yang secara konsep aktif di proyek:

1. Dashboard Utama
2. Database Induk
3. Monitoring
4. Status Layanan Sekolah
5. EduLock Uninstall Access

Catatan:

- struktur ini adalah acuan web primer yang saat ini dikunci
- route utilitas lama boleh tetap ada, tetapi tidak lagi tampil sebagai menu primer sidebar
- refactor modular penuh tetap layak dilanjutkan, tetapi jangan mengubah hirarki primer tanpa keputusan desain baru

---

## 4. Detail Teknis Per Menu

### 4.1 Dashboard Utama

**Rute kanonik**

- `/super-admin/dashboard`

**Tujuan**

- memberi ringkasan lintas tenant secara cepat

**Data minimum**

- jumlah tenant
- jumlah tenant aktif
- jumlah admin sekolah
- jumlah akun kepala sekolah
- indikator anomali dasar

**Sumber data**

- agregasi RTDB pusat

**Aturan**

- tampilkan ringkasan, bukan dump data besar
- jangan memuat detail operasional tenant secara berlebihan
- realtime hanya dipakai untuk metrik kecil yang memang perlu hidup

### 4.2 Database Induk

**Rute kanonik**

- `/super-admin/database`

**Tujuan**

- pusat registry tenant dan akun strategis
- pusat pengelolaan admin sekolah
- pusat pengelolaan akun kepala sekolah

**Aksi**

1. tambah tenant
2. edit tenant
3. kelola identitas login admin sekolah
4. bootstrap admin sekolah
5. reset password admin sekolah ke `admin123`
6. buat atau edit akun kepala sekolah
7. reset device kepala sekolah
8. reset password kepala sekolah ke `admin123`
9. lihat kelengkapan data tenant dan akun strategis

**Field inti**

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

**Validasi**

- `npsn` tidak boleh ambigu
- `schoolId` harus stabil
- tenant nonaktif harus diperlakukan sebagai tenant tertutup

**Backend**

- perubahan strategis dilakukan lewat endpoint backend tervalidasi

**Catatan teknis penting**

- login admin sekolah saat ini tetap bertumpu pada field `schools/{schoolId}`
- reset password admin sekolah menyalakan mekanisme `mustChangePassword` agar admin wajib mengganti password setelah login

### 4.3 Monitoring

**Rute kanonik**

- `/super-admin/monitoring`

**Tujuan**

- memusatkan monitoring akun strategis, log keamanan, dan anomali lintas tenant

**Data minimum**

- log keamanan pusat
- anomali akun strategis
- ringkasan tenant bermasalah

**Aturan**

- menu ini adalah panel monitoring primer
- jangan campur dengan billing siswa atau kontrol uninstall EduLock

### 4.4 Status Layanan Sekolah

**Rute kanonik**

- `/super-admin/service-status`

**Tujuan**

- memonitor status pembayaran sekolah
- mengatur aktif atau nonaktif layanan tenant
- memonitor siswa unik yang menjadi dasar billing

**Struktur halaman**

- tab `Status Layanan`
- tab `Monitoring Pengguna Aktif`

**Tab Status Layanan**

Data minimum:

- `paymentStatus`
- `lastPaidAt`
- `dueAt`
- `isActive`
- `adminAccessActive`
- indikator sinkronisasi
- indikator support request terbuka

Aturan:

- halaman ini adalah kontrol bisnis layanan sekolah, bukan sekadar health check teknis
- kartu ringkasan harus memakai bahasa bisnis:
  - `TOTAL`
  - `SUDAH MEMBAYAR`
  - `BELUM MEMBAYAR`
  - `LAYANAN AKTIF`
  - `LAYANAN NONAKTIF`

**Tab Monitoring Pengguna Aktif**

Data minimum:

- total sekolah
- total siswa
- siswa ditagihkan
- belum aktivasi
- aktif operasional
- estimasi tagihan

Aturan billing yang dikunci:

- hitung berdasarkan siswa unik
- GAS dan EduLock tidak boleh didobel
- dasar billing = siswa yang sudah aktivasi
- aktif operasional = data realtime, bukan dasar tagihan

### 4.5 EduLock Uninstall Access

**Rute kanonik**

- `/super-admin/uninstall-access`

**Tujuan**

- menyediakan kontrol kritikal untuk membuat dan menghapus kode uninstall EduLock
- memilih tenant target secara eksplisit
- menampilkan kode aktif beserta barcode atau QR untuk kebutuhan scan

**Data minimum**

- `schoolId`
- detail tenant
- kode uninstall aktif
- `expiresAt`
- `updatedAt`
- `createdByUid`

**Aturan**

- halaman ini berdiri sebagai menu primer
- gunakan node realtime yang sama dengan panel admin sekolah agar tidak ada dua sumber data

### 4.6 Global Config dan Utilitas Pendukung

**Rute utilitas yang masih relevan**

- `/super-admin/gas/global-config`
- `/super-admin/gas/sync-jobs`
- `/super-admin/gas/broadcast`
- `/super-admin/gas/audit`
- `/super-admin/gas/support`

**Tujuan**

- mempertahankan utilitas pusat yang masih relevan di implementasi
- tidak mengembalikan utilitas tersebut sebagai menu primer sidebar

**Catatan**

- `gas/global-config` saat ini juga menyimpan `billing.perStudentTariff`
- utilitas ini tetap harus dianggap sah secara teknis, walau tidak tampil di sidebar primer

---

## 5. Pola Backend Saat Ini

Pola mutasi pusat yang dipakai saat ini:

- frontend mengambil ID token Firebase user
- frontend memanggil endpoint terproteksi `/api/super-admin`
- backend memverifikasi token dan role

Catatan:

- dokumen ini tidak lagi meng-overclaim bahwa seluruh mutasi pusat sudah murni callable-only
- jika nanti dipindah ke Cloud Functions callable penuh, dokumen ini harus diperbarui lagi

---

## 6. Kontrak Integrasi

### 6.1 Dengan Web Admin Sekolah

Kontrak:

- Super Admin menyediakan tenant dan akses atas
- Web Admin Sekolah mengelola master data akun operasional sekolah

Implikasi:

- jika tenant belum valid di pusat, admin sekolah tidak boleh berjalan normal

### 6.2 Dengan APK GAS

Kontrak:

- akun kepala sekolah berasal dari Super Admin
- akun siswa dan guru berasal dari Web Admin Sekolah

### 6.3 Dengan APK EduLock

Kontrak:

- kontrol pusat lintas tenant bisa dipantau dari Super Admin
- uninstall access EduLock dikelola dari halaman primer tersendiri di Super Admin
- data user sekolah tetap tidak boleh dikelola di Super Admin

---

## 7. Kebutuhan Keamanan Teknis

Setiap menu wajib memastikan:

1. validasi role dilakukan di backend
2. tenant scope tidak bocor
3. aksi strategis tidak bisa dipanggil user biasa
4. tidak ada endpoint pusat yang membuka data tenant secara liar

Tambahan:

- helper API pusat harus memakai pola aman
- kredensial sensitif tidak boleh tersimpan di source yang ter-commit

---

## 8. Kebutuhan Performa

Aturan performa:

1. hindari listener besar lintas seluruh tenant jika tidak benar-benar perlu
2. gunakan realtime hanya pada data kecil yang memang penting
3. untuk daftar besar, utamakan pembacaan terarah
4. hindari file komponen yang terus membesar tanpa batas

---

## 9. Status Teknis Saat Ini

Status saat ini pada proyek:

- helper API dan hook penting sudah tersedia
- halaman utama Super Admin sudah bisa berjalan
- route kanonik baru sudah mulai terbentuk

Catatan jujur:

- route lama dan route baru masih hidup berdampingan
- sebagian utilitas lama masih hidup sebagai route pendukung
- struktur menu primer web sudah dikunci dan tidak lagi mengikuti pola sidebar lama yang terlalu ramai

---

## 10. Rekomendasi Refactor Berikutnya

Jika modul Super Admin kembali disentuh besar-besaran, urutan sehat:

1. seragamkan route ke `/super-admin/*`
2. pertahankan sidebar primer tetap ringkas
3. pecah utilitas pendukung tanpa mengembalikannya ke sidebar primer
4. pertahankan `service-status` sebagai domain billing dan kontrol layanan
5. pertahankan `uninstall-access` sebagai domain kritikal EduLock tersendiri

Masing-masing sebaiknya punya:

- panel sendiri
- hook data sendiri
- form atau modal sendiri
- util sendiri

---

## 11. Kesimpulan

Dokumen ini mengunci bahwa modul Super Admin adalah:

- pusat tenant
- pusat akses strategis
- pusat kontrol global
- pusat monitoring dan audit lintas sekolah

Dan **bukan**:

- tempat CRUD data siswa, guru, atau OSIS sekolah
- tempat logika operasional harian tenant

Status dokumen:

- **Aktif**
- **Pendamping teknis PRD Super Admin**
