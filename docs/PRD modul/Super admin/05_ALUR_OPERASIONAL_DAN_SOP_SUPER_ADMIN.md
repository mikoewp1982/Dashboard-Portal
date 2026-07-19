# Alur Operasional dan SOP Super Admin

## 1. Tujuan Dokumen

Dokumen ini menjelaskan alur operasional dan SOP modul **Super Admin** per skenario utama agar:

1. operator pusat punya panduan kerja yang konsisten
2. developer memahami alur bisnis nyata di balik setiap menu
3. keputusan operasional tidak berubah-ubah antar orang

Dokumen ini melengkapi:

- `01_PRD_SUPER_ADMIN_PORTALKITA.md`
- `02_SPESIFIKASI_TEKNIS_MENU_SUPER_ADMIN.md`
- `03_KONTRAK_DATA_DAN_RTDB_PATH_SUPER_ADMIN.md`
- `04_MATRIKS_ROLE_CAPABILITY_DAN_HAK_AKSES_SUPER_ADMIN.md`

---

## 2. Prinsip Operasional Umum

Prinsip kerja Super Admin:

1. bekerja di level pusat, bukan level operasional harian sekolah
2. setiap aksi pusat harus punya alasan yang jelas
3. perubahan tenant dan akun strategis harus dilakukan hati-hati
4. tindakan pusat harus meninggalkan jejak audit atau security log bila menyentuh area penting
5. jika masalah masih bisa diselesaikan admin sekolah, jangan diambil alih ke pusat tanpa alasan kuat

---

## 3. Skenario Operasional Utama

Skenario inti yang harus punya SOP:

1. onboarding tenant baru
2. aktivasi tenant
3. nonaktif tenant
4. provisioning login admin sekolah
5. reset password admin sekolah
6. pembuatan akun kepala sekolah
7. reset password kepala sekolah
8. reset device kepala sekolah
9. pengelolaan status pembayaran dan layanan sekolah
10. monitoring billing siswa unik
11. pengelolaan EduLock uninstall access
12. pengelolaan broadcast global
13. pengelolaan support request
14. pengelolaan sync jobs
15. pemantauan audit dan monitoring pusat

---

## 4. SOP Onboarding Tenant Baru

### Tujuan

Menambahkan sekolah baru ke ekosistem agar sekolah tersebut bisa dipersiapkan untuk operasional.

### Prasyarat

- sekolah valid dan sudah disetujui masuk sistem
- data identitas sekolah tersedia
- `npsn` valid

### Langkah Operasional

1. Super Admin membuka menu **Sekolah & Tenant**
2. Super Admin menambahkan data tenant baru
3. Isi field minimal:
   - `schoolId`
   - `name`
   - `district`
   - `npsn`
   - `authEmail`
   - `adminEmail` jika sudah ada
4. set `isActive` sesuai keputusan operasional
5. simpan tenant
6. verifikasi tenant muncul di daftar

### Validasi Wajib

- `npsn` tidak boleh salah
- `schoolId` tidak boleh bentrok
- tenant baru tidak boleh menggandakan tenant lama

---

## 5. SOP Aktivasi Tenant

### Tujuan

Mengaktifkan sekolah agar bisa dipakai operasional.

### Langkah Operasional

1. buka daftar tenant
2. cari tenant yang akan diaktifkan
3. pastikan data tenant benar
4. ubah `isActive = true`
5. simpan perubahan
6. verifikasi status tenant berubah

### Efek Bisnis

- tenant boleh digunakan untuk operasional normal
- alur login tenant menjadi sah

---

## 6. SOP Nonaktif Tenant

### Tujuan

Menutup akses operasional tenant tanpa menghapus identitas tenant dari pusat.

### Langkah Operasional

1. buka daftar tenant
2. cari tenant yang akan dinonaktifkan
3. pastikan tenant yang dipilih benar
4. ubah `isActive = false`
5. simpan perubahan
6. verifikasi status tenant berubah

### Larangan

- jangan menghapus tenant hanya karena ingin menghentikan operasional sementara

---

## 7. SOP Provisioning Login Admin Sekolah

### Tujuan

Menyiapkan akses admin sekolah ke Web Admin Sekolah.

### Prasyarat

- tenant sudah terdaftar
- tenant punya `schoolId` dan `npsn` yang valid

### Sumber Kebenaran

Pada sistem saat ini, identitas login admin sekolah melekat pada registry tenant di node `schools/{schoolId}`:

- `authEmail`
- `adminEmail`
- `backupEmail`
- `adminAccessActive`

### Langkah Operasional

1. buka area pengelolaan tenant atau admin sekolah pusat
2. pilih tenant yang sesuai
3. isi atau perbarui identitas login admin sekolah
4. bila tenant baru, jalankan bootstrap login admin sekolah
5. bila diperlukan, jalankan reset password admin sekolah ke default `admin123`
6. simpan perubahan
7. verifikasi login admin terkait ke tenant yang benar

### Validasi Wajib

- tidak boleh salah `schoolId`
- tidak boleh menciptakan sumber data admin sekolah kedua di luar registry tenant
- tidak boleh bentrok dengan tenant lain

### Catatan Operasional Penting

- reset password admin sekolah saat ini akan memaksa admin mengganti password sebelum masuk operasional web admin
- password default pemulihan yang dipakai pusat saat ini adalah `admin123`

---

## 8. SOP Reset Password Admin Sekolah

### Tujuan

Memulihkan akses admin sekolah yang lupa password atau baru dibootstrap oleh pusat.

### Langkah Operasional

1. buka `Database Induk`
2. masuk ke area `Admin Sekolah`
3. pilih tenant yang benar
4. jalankan aksi **Reset Password**
5. konfirmasi bahwa password kembali ke default `admin123`
6. informasikan bahwa admin sekolah wajib mengganti password saat login berikutnya

### Larangan

- jangan reset password tanpa memastikan tenant benar
- jangan memberi password default ke tenant yang salah

---

## 9. SOP Pembuatan Akun Kepala Sekolah

### Tujuan

Menyiapkan akun kepala sekolah yang memang menjadi kewenangan pusat.

### Aturan yang Dikunci

Format login kepala sekolah:

- `Kode Sekolah / NPSN`
- `Username = identifier stabil yang ditetapkan pusat`
- `Password = NIP` atau kredensial sesuai kebijakan pusat

Catatan:

- `username` bukan display name
- nama kepala sekolah tetap dicatat terpisah sebagai field profil

### Langkah Operasional

1. buka menu akun kepala sekolah
2. pilih tenant atau sekolah yang benar
3. isi:
   - nama kepala sekolah
   - `username`
   - NIP atau password
   - `schoolId`
   - `npsn`
4. simpan akun
5. verifikasi akun terikat ke tenant yang sesuai

### Validasi Wajib

- `schoolId` harus benar
- `npsn` harus cocok dengan tenant
- `username` harus stabil dan tidak ambigu
- jangan sampai akun kepala sekolah sekolah A masuk ke tenant sekolah B

---

## 10. SOP Reset Password Kepala Sekolah

### Tujuan

Memulihkan akses kepala sekolah dari pusat tanpa harus membuat akun baru.

### Langkah Operasional

1. buka `Database Induk`
2. masuk ke area `Akun Kepala Sekolah`
3. cari akun kepala sekolah yang benar
4. verifikasi tenant dan username
5. jalankan aksi **Reset Password**
6. pastikan password kembali ke default `admin123`

### Larangan

- jangan reset password jika identitas tenant belum diverifikasi

---

## 11. SOP Reset Device Kepala Sekolah

### Tujuan

Mengatasi kondisi ketika kepala sekolah kehilangan perangkat atau harus berganti perangkat.

### Langkah Operasional

1. buka menu akun kepala sekolah
2. cari akun kepala sekolah yang benar
3. verifikasi identitas tenant dan kepala sekolah
4. jalankan aksi **Reset Device**
5. pastikan `deviceId` atau pengikat perangkat dibersihkan
6. catat bahwa reset sudah dilakukan

### Larangan

- jangan reset device tanpa verifikasi identitas user dan tenant

---

## 12. SOP Status Pembayaran dan Layanan Sekolah

### Tujuan

Mengelola apakah sekolah dianggap sudah membayar dan apakah layanan tenant boleh tetap aktif.

### Langkah Operasional

1. buka menu `Status Layanan Sekolah`
2. masuk ke tab `Status Layanan`
3. cari tenant yang benar
4. verifikasi status pembayaran tenant
5. gunakan aksi:
   - `Tandai Lunas`
   - `Tandai Belum Bayar`
   - `Aktifkan`
   - `Nonaktifkan`
6. verifikasi dampak status layanan pada tenant

### Aturan

- `status pembayaran` adalah status bisnis
- `status layanan` adalah status operasional tenant
- tenant yang ditutup harus dianggap tidak boleh dipakai operasional normal

---

## 13. SOP Monitoring Billing Siswa Unik

### Tujuan

Memantau dasar tagihan per sekolah berdasarkan siswa unik yang sudah aktivasi.

### Aturan yang Dikunci

- satu siswa dihitung satu kali walau memakai GAS dan EduLock
- `siswa ditagihkan` adalah dasar billing
- `aktif operasional` hanya untuk monitoring realtime

### Langkah Operasional

1. buka `Status Layanan Sekolah`
2. pindah ke tab `Monitoring Pengguna Aktif`
3. cek kartu:
   - `Total Siswa`
   - `Siswa Ditagihkan`
   - `Belum Aktivasi`
   - `Aktif Operasional`
4. isi atau verifikasi `Tarif Per Siswa`
5. baca estimasi tagihan per sekolah dari tabel atau panel detail

### Catatan

- jumlah siswa diambil dari `Database Siswa`
- dasar billing diambil dari siswa unik yang sudah aktivasi

---

## 14. SOP EduLock Uninstall Access

### Tujuan

Menjalankan kontrol kritikal pembuatan dan penghapusan kode uninstall EduLock dari pusat.

### Langkah Operasional

1. buka menu `EduLock Uninstall Access`
2. pilih tenant yang benar
3. verifikasi identitas tenant
4. atur durasi kode bila perlu
5. jalankan aksi:
   - `Buat Kode`
   - `Hapus Kode`
6. jika diperlukan, gunakan barcode atau QR yang tampil untuk kebutuhan scan

### Aturan

- pastikan tenant yang dipilih benar
- gunakan hanya untuk kebutuhan operasional sah
- jangan membuat kode uninstall untuk tenant yang salah

---

## 15. SOP Broadcast Global

### Tujuan

Mengirim pengumuman dari pusat ke tenant secara seragam.

### Langkah Operasional

1. buka menu **Broadcast Global**
2. tulis judul dan isi pesan
3. tentukan target jika ada
4. simpan broadcast
5. verifikasi broadcast muncul di daftar

### Aturan

- gunakan untuk komunikasi resmi
- jangan gunakan untuk pesan non-operasional
- jangan masukkan data sensitif sekolah tertentu ke broadcast global

---

## 16. SOP Support Request

### Tujuan

Mengelola antrian permintaan bantuan operasional pusat.

### Status minimum

- `OPEN`
- `DONE`
- `CANCELLED`

### Langkah Operasional

1. buka menu **Support Tools**
2. isi tenant yang terkait
3. pilih jenis request atau judul request
4. tambahkan catatan bila perlu
5. simpan request
6. ubah status sesuai progres bila diperlukan

### Aturan

- request harus jelas tenantnya
- jangan ubah status tanpa alasan operasional yang jelas

---

## 17. SOP Sync Jobs

### Tujuan

Memantau dan mengontrol job sinkronisasi pusat.

### Langkah Operasional

1. buka menu **Sync Jobs**
2. tinjau daftar job
3. verifikasi `schoolId`, jenis job, dan status
4. bila diperlukan, buat job baru
5. bila diperlukan, ubah status job

### Aturan

- status job harus menggambarkan kondisi nyata
- jangan menandai job selesai jika proses sebenarnya belum selesai

---

## 18. SOP Audit dan Compliance

### Tujuan

Memeriksa jejak aksi penting jika terjadi masalah.

### Catatan Implementasi Saat Ini

UI audit saat ini masih bertumpu pada log keamanan pusat yang lebih ringkas. Karena itu operator harus memahami bahwa data yang terlihat mungkin belum sekaya audit investigatif ideal.

### Langkah Operasional

1. buka menu **Audit**
2. cari aksi berdasarkan waktu, username, atau aktivitas
3. cocokkan dengan kejadian operasional
4. gunakan hasil audit untuk verifikasi awal
5. bila butuh investigasi lebih dalam, lanjutkan ke backend log atau bukti operasional lain

### Aturan

- audit dipakai untuk pelacakan, bukan dump data besar

---

## 19. SOP Penanganan Kesalahan Operasional

Jika terjadi kesalahan di level Super Admin:

1. verifikasi tenant atau target yang dipilih
2. cek audit atau security log
3. cek apakah masalah berasal dari data pusat atau tenant
4. jangan langsung mengubah banyak data sekaligus tanpa verifikasi
5. jika aksi menyentuh tenant aktif, lakukan dengan hati-hati

---

## 20. Daftar Larangan Operasional

Dilarang:

1. membuat tenant tanpa `npsn` yang valid
2. memberi akses tenant ke sekolah yang salah
3. membuat akun kepala sekolah di tenant yang tidak cocok
4. memakai Super Admin untuk mengelola data siswa, guru, atau OSIS sekolah
5. melakukan reset device tanpa verifikasi
6. membuat sumber data login admin sekolah kedua tanpa migrasi resmi
7. menghapus data pusat strategis tanpa alasan yang jelas
8. menghitung siswa GAS dan EduLock sebagai dua tagihan jika identitas siswanya sama
9. memakai `aktif operasional` sebagai dasar tagihan bulanan

---

## 21. Checklist Singkat Operator Super Admin

Sebelum menyimpan aksi penting, operator wajib memastikan:

1. tenant yang dipilih benar
2. `schoolId` benar
3. `npsn` benar
4. target akun benar
5. aksi ini memang wilayah Super Admin
6. dampak ke tenant sudah dipahami

---

## 22. Status Dokumen

Status:

- **Aktif**
- **Acuan operasional Super Admin**

Fungsi:

- menjadi SOP kerja
- menjadi rambu developer
- menjaga konsistensi proses pusat
