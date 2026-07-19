# PEDOMAN REALTIME DAN HEMAT DATA

Dokumen ini adalah rambu-rambu resmi pengembangan untuk memastikan aplikasi Web Admin, APK GAS, dan APK EduLock tetap:
- ringan
- hemat kuota
- tidak boros listener Firebase
- tidak membebani RTDB / Auth / perangkat user
- aman untuk skala besar lintas sekolah

Tanggal: 14 Juli 2026
Status: AKTIF
Wajib dibaca sebelum melanjutkan pengembangan modul Web Admin, GAS, dan EduLock.

---

## 1. Tujuan Utama

Fondasi sistem harus dibangun dengan prinsip:

1. Realtime hanya dipakai jika benar-benar perlu.
2. Data user tidak boleh diambil berlebihan.
3. Setiap layar hanya boleh memuat data yang dibutuhkan layar itu.
4. APK user harus hemat kuota dan hemat baterai.
5. Web Admin harus tetap responsif walau tenant bertambah.
6. DATABASE hanya berfungsi sebagai master data akun.
7. Semua data harus selalu berada dalam pagar tenant `NPSN / schoolId`.

---

## 2. Prinsip Wajib

### 2.1 Realtime Bukan Default

Jangan anggap semua data harus realtime.

Gunakan realtime hanya untuk:
- data kecil
- status yang memang perlu hidup
- angka ringkasan
- panel yang sedang aktif dibuka user

Jangan gunakan realtime untuk:
- data besar yang jarang berubah
- seluruh isi sekolah sekaligus
- data yang cukup diambil saat halaman dibuka
- data yang hanya dipakai satu kali

### 2.2 Listener Firebase Harus Hemat

Aturan wajib:
- Listener `onValue()` hanya boleh dipasang di custom hook.
- Listener tidak boleh ditaruh di komponen induk besar yang selalu mount.
- Listener hanya boleh hidup saat panel atau halaman itu benar-benar tampil.
- Wajib `unsubscribe()` di cleanup.
- Satu hook hanya untuk satu domain data.

Contoh domain:
- `students`
- `teachers`
- `staff`
- `classes`
- `overview`

### 2.3 APK Tidak Boleh Sinkronisasi Data Sekolah Penuh

APK user hanya boleh mengambil:
- data dirinya sendiri
- data sekolah minimum yang dibutuhkan
- role tambahan yang terkait dirinya sendiri

APK dilarang mengambil:
- seluruh daftar siswa
- seluruh daftar guru
- seluruh data staff
- seluruh data kelas jika tidak dibutuhkan

### 2.4 Cache Lokal Wajib Dipakai Secukupnya

Gunakan cache lokal untuk:
- session login
- profil user
- metadata sekolah
- role dasar user
- data layar yang sering dibuka ulang

Jangan cache:
- data sensitif berlebihan
- seluruh master data sekolah
- data besar yang tidak relevan dengan user aktif

---

## 3. Kontrak Login Yang Sudah Dikunci

### 3.1 Pagar Tenant

`NPSN` adalah pagar tenant dari Super Admin.

Aturan:
- jika sekolah tidak terdaftar di Super Admin, user sekolah itu tidak bisa login
- admin sekolah hanya mengelola data pada `schoolId / NPSN` miliknya
- semua query dan mutasi wajib dibatasi oleh tenant

### 3.2 Kredensial Login

#### Siswa
- Kode Sekolah / NPSN
- Username: Nama Siswa
- Password: NISN

#### Guru
- Kode Sekolah / NPSN
- Username: Nama Guru
- Password: NUPTK

#### Kepala Sekolah
- Kode Sekolah / NPSN
- Username: Nama Kepala Sekolah
- Password: NIP
- Sumber data: Super Admin

#### Petugas OSIS
- Tidak memiliki akun induk terpisah
- OSIS adalah role turunan dari akun siswa
- Sistem membaca `NISN` siswa lalu mengecek apakah siswa itu juga terdaftar sebagai petugas OSIS

---

## 4. Kebijakan Siklus Hidup Data

### 4.1 DATABASE Hanya Master Data Akun

Halaman DATABASE hanya berfungsi sebagai:
- rumah data induk akun siswa
- rumah data induk akun guru
- rumah data induk akun petugas OSIS
- rumah data induk akun kelas
- sumber akun login untuk APK GAS dan EduLock

DATABASE bukan pusat seluruh data aplikasi.

### 4.2 Kebijakan Siswa Lulus

Keputusan yang sudah dikunci:
- siswa kelas 9 yang lulus = hapus permanen
- tidak perlu arsip penuh di RTDB jika memberatkan sistem
- role OSIS yang menempel ikut hilang
- akun login terkait ikut dihapus atau dinonaktifkan sesuai implementasi backend

### 4.3 Audit Minimal

Walau data dihapus permanen, sistem tetap disarankan menyimpan log minimal:
- `schoolId`
- `NPSN`
- `tahun ajaran`
- `jumlah data yang dihapus`
- `waktu eksekusi`
- `admin pelaksana`

Tujuan:
- tetap ada jejak operasional
- tidak menyimpan seluruh data lama
- tetap hemat storage

---

## 5. Daftar Fitur: Wajib Realtime vs Fetch Biasa

## 5A. Web Admin - DATABASE

### Wajib Realtime

1. Dashboard Overview
   - jumlah siswa aktif
   - jumlah guru aktif
   - jumlah petugas OSIS aktif
   - alasan: data kecil, penting untuk visibilitas langsung

2. Teks "Terakhir disinkronisasi"
   - hanya pada panel aktif
   - alasan: indikator sinkronisasi nyata, bukan pemanis

3. Lookup NISN ke data siswa saat input Petugas OSIS
   - saat admin mengetik NISN
   - alasan: validasi langsung agar data OSIS tidak salah

### Tidak Perlu Realtime Penuh

1. Tabel Siswa
   - cukup aktif saat tab Siswa dibuka
   - listener mati saat pindah tab

2. Tabel Guru
   - cukup aktif saat tab Guru dibuka
   - listener mati saat pindah tab

3. Tabel Petugas OSIS
   - cukup aktif saat tab OSIS dibuka
   - listener mati saat pindah tab

4. Tabel Kelas Paralel
   - cukup aktif saat tab Kelas dibuka
   - listener mati saat pindah tab

### Fetch Biasa / On-Demand

1. download template
2. import excel
3. hapus semua / bulk delete
4. create / update / delete data
5. validasi admin action
6. cleanup lulusan kelas 9

Alasan:
- ini adalah aksi administratif
- tidak perlu listener hidup terus

## 5B. Web Admin - Modul GAS

### Wajib Realtime

Gunakan realtime hanya untuk:
1. indikator layanan yang sedang aktif
2. status sinkronisasi jika memang perlu tampilan langsung
3. notifikasi operasional kecil yang benar-benar harus live

### Fetch Biasa

1. daftar konfigurasi modul
2. pengaturan sekolah
3. data konten
4. riwayat aktivitas
5. pengaturan fitur siswa/guru
6. pengaturan hak akses

Alasan:
- mayoritas data konfigurasi tidak perlu live terus
- lebih hemat kuota dan beban browser

## 5C. Web Admin - Modul EDULOCK

### Wajib Realtime

Gunakan realtime hanya untuk:
1. status lock/unlock yang benar-benar harus terlihat langsung
2. status perangkat / status akses bila dibutuhkan live oleh admin
3. indikator layanan penting tingkat sekolah

### Fetch Biasa

1. daftar konfigurasi aturan
2. histori aktivitas
3. pengaturan modul
4. mapping akses
5. data laporan

Alasan:
- histori dan konfigurasi tidak butuh listener permanen
- hanya state aktif yang layak realtime

## 5D. APK GAS - User

### Wajib Realtime

Pakai realtime hanya jika benar-benar dibutuhkan oleh fitur inti yang terlihat hidup.

Contoh kandidat realtime:
1. status akses yang berubah langsung
2. notifikasi penting yang harus muncul saat itu juga
3. indikator kedisiplinan atau status tertentu jika memang inti fitur menuntut live

### Fetch Biasa + Cache Lokal

1. profil user
2. data sekolah dasar
3. role user
4. status OSIS
5. daftar menu yang boleh diakses
6. data halaman yang tidak berubah terus
7. data histori pribadi

Aturan:
- ambil data saat login atau saat halaman dibuka
- simpan hasil minimum di cache lokal
- jangan refresh terus tanpa alasan

## 5E. APK EDULOCK - User

### Wajib Realtime

Gunakan hanya untuk:
1. perubahan status akses yang memang harus terasa langsung
2. status keamanan yang sedang aktif
3. instruksi kritis yang memang harus live

### Fetch Biasa + Cache Lokal

1. profil user
2. metadata sekolah
3. hak akses
4. riwayat pribadi
5. pengaturan tampilan
6. data pendukung lain

Aturan:
- jangan hidupkan listener global dari root app
- hidupkan realtime hanya di layar yang memang memerlukannya

---

## 6. Kebijakan Hemat Kuota Untuk APK

Aturan wajib untuk APK:
1. Setelah login, ambil hanya data identitas user aktif.
2. Jangan pernah sinkron seluruh data tenant ke perangkat user.
3. Gunakan cache lokal untuk data yang sama-sama sering dibuka.
4. Refresh hanya ketika:
   - user login
   - user membuka halaman terkait
   - user melakukan aksi yang memang perlu sinkron ulang
5. Hindari polling berkala jika tidak wajib.
6. Payload response harus minimum.
7. Field yang diambil harus spesifik, jangan membawa data yang tidak dipakai UI.

---

## 7. Kebijakan Hemat Untuk Web Admin

Aturan wajib untuk Web Admin:
1. Satu tab aktif = hanya listener tab itu yang hidup.
2. Saat tab pindah, listener lama wajib mati.
3. Jangan mount semua panel sekaligus.
4. Jangan mount semua modal sekaligus bila tidak perlu.
5. Search dan filter dilakukan pada scope data panel aktif.
6. Jangan ada listener global di root dashboard.
7. Panel overview boleh realtime karena ringan.
8. Tabel besar tidak boleh aktif bersamaan dalam satu layar.

---

## 8. Kebijakan State Management

### 8.1 Arah Resmi Proyek

Untuk proyek ini, arah yang dipilih adalah:
- realtime utama: custom hook + `onValue()` terbatas
- bukan listener manual tersebar di komponen besar
- belum wajib React Query / SWR penuh di semua tempat

### 8.2 Alasan

Karena target utama proyek adalah:
- ringan
- mudah dikontrol
- hemat listener
- hemat kuota
- jelas scope datanya

### 8.3 Aturan Wajib

Listener RTDB:
- harus dibungkus custom hook
- hanya untuk domain yang jelas
- hanya hidup saat diperlukan
- selalu unsubscribe

Contoh penamaan hook:
- `useStudentsRealtime`
- `useTeachersRealtime`
- `useStaffRealtime`
- `useClassesRealtime`
- `useDatabaseOverviewRealtime`

---

## 9. Kebijakan Struktur Kode

Masalah lama yang harus dicegah:
- satu file menjadi 5000+ baris
- satu komponen memegang terlalu banyak domain
- pencarian bug jadi sulit
- perubahan kecil merusak banyak fitur

### Aturan Tim

1. Satu file idealnya maksimal sekitar `200-300` baris.
2. Jika sudah membesar, pecah berdasarkan tanggung jawab.
3. Struktur wajib berdasarkan domain atau entitas, bukan sekadar halaman.
4. `MasterDataWorkspace.tsx` tidak boleh terus tumbuh menjadi file raksasa.
5. File itu harus menjadi shell atau orchestrator, bukan gudang semua fitur.

### Pembagian Minimal Yang Disarankan

- panel per tab
- modal per entitas
- table per entitas
- hook realtime per entitas
- util dan normalizer terpisah

---

## 10. Daftar Yang Dilarang

Dilarang:
- menaruh semua listener di file induk besar
- membiarkan satu file memegang banyak domain bisnis
- mengambil seluruh data tenant untuk kebutuhan satu user
- membuat realtime untuk semua layar
- menyimpan data lama tanpa lifecycle yang jelas
- menganggap APK boleh terus sinkron di background tanpa alasan
- menambah fitur baru ke file besar lama tanpa refactor

---

## 11. Daftar Yang Wajib Diikuti Developer Berikutnya

Sebelum membuat fitur baru, developer wajib menjawab:
1. Data ini benar-benar perlu realtime atau tidak?
2. Listener ini hidup hanya saat layar aktif atau tidak?
3. Data yang diambil ini minimum atau berlebihan?
4. Apakah user ini hanya mengambil data miliknya sendiri?
5. Apakah file yang disentuh masih punya satu tanggung jawab utama?
6. Apakah perubahan ini aman untuk skala multi-tenant 42 sekolah?
7. Apakah perubahan ini hemat kuota untuk APK user?

Jika ada satu saja jawaban yang masih kabur, fitur belum boleh langsung dikembangkan.

---

## 12. Kesimpulan Resmi

Keputusan arsitektur yang dikunci:
- realtime bukan default
- `NPSN` adalah pagar tenant utama
- DATABASE hanya master data akun
- OSIS adalah role turunan dari siswa
- siswa kelas 9 lulus = hapus permanen
- Web Admin harus modular
- listener RTDB harus terbatas, scoped, dan hemat
- APK user harus mengambil data minimum saja
- semua pengembangan berikutnya wajib tunduk pada prinsip ringan, hemat, dan terkontrol
