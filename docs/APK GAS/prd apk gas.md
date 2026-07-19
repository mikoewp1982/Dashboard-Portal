# PRD APK GAS

Dokumen ini menjadi acuan produk, alur, dan prioritas implementasi untuk APK GAS yang dibangun dari basis project Android native dan diselaraskan dengan kontrak data GAS web yang sudah final.

## 1. Tujuan

Membangun APK GAS yang:

- mengikuti kontrak data aktif dari modul GAS web
- menjaga isolasi tenant sekolah
- hemat data dan tidak bergantung pada pola query boros
- mendukung peran siswa, guru, dan kepala sekolah sesuai boundary GAS
- aman dipakai berdampingan dengan aplikasi lama yang masih aktif

## 2. Keputusan Dasar

Keputusan yang dikunci:

1. APK GAS tidak dibangun dengan menyalin file ke project web.
2. Folder referensi hanya dibaca:
   - `D:\Satu Pintu\native-mobile`
3. Folder kerja resmi untuk pengembangan APK GAS:
   - `D:\Dashboard Portal\native-mobile-gas`
4. Pengembangan dimulai dari layer data, repository, auth/session, dan notifikasi sebelum perapihan UI.
5. Modul GAS web final menjadi sumber kebenaran kontrak data.

## 3. Scope APK GAS

Scope utama APK GAS:

- Login dan validasi boundary GAS
- Beranda per role
- Broadcast notifikasi untuk penerima akhir
- Halo Spentgapa / laporan masuk
- Kehadiran
- Sholat
- E-Library
- Kedisiplinan
- 7 KAIH
- Virtual Pet

## 4. Aktor

### Siswa

- login ke tenant sekolah
- menerima notifikasi
- melihat perkembangan pribadi
- mengakses modul belajar dan kebiasaan
- mengirim laporan Halo Spentgapa

### Guru

- login ke tenant sekolah
- menerima notifikasi
- memantau data siswa sesuai wewenang
- memberi penilaian guru pada 7 KAIH

### Kepala Sekolah

- login ke tenant sekolah
- melihat ringkasan monitoring
- menerima notifikasi strategis

## 5. Alur Produk Utama

### A. Alur login

1. Pengguna membuka APK GAS.
2. Sistem memverifikasi flavor/boundary GAS.
3. Pengguna login dengan akun yang sah.
4. Sistem memuat profil, role, dan `schoolId`.
5. Aplikasi hanya membuka menu yang sesuai role dan tenant.

### B. Alur notifikasi

1. Admin web GAS membuat broadcast.
2. Backend web menulis history admin dan inbox penerima.
3. APK GAS membaca inbox sesuai role dan user aktif.
4. Pengguna melihat daftar notifikasi masuk.
5. Status baca diperbarui pada inbox pengguna.

### C. Alur Halo Spentgapa

1. Siswa membuat laporan.
2. Laporan tersimpan di jalur final tenant-scoped.
3. Admin web memantau dan mengubah status laporan.
4. APK GAS membaca hasil akhir yang sudah aman.
5. Jika laporan anonim, identitas pelapor tidak boleh bocor ke UI yang tidak berhak.

### D. Alur 7 KAIH

1. Sistem membaca log kebiasaan siswa.
2. Guru memberi nilai rubric bulanan jika diperlukan.
3. APK menampilkan hasil berdasarkan formula final yang sama dengan web.
4. Data kelas harus mendukung fallback `kelas`, `class`, atau `className`.

### E. Alur Virtual Pet

1. APK membaca data sumber yang dibutuhkan.
2. Status pet dihitung sesuai rule aktif.
3. Hasil visual harus konsisten dengan aturan pusat agar tidak drift dari web admin.

## 6. Kontrak Data Wajib

### Notifikasi

- history admin:
  - `gas/schools/{schoolId}/notifications/{notificationId}`
- inbox siswa:
  - `gas/schools/{schoolId}/notification_inbox/student/{studentId}/{notificationId}`
- inbox guru:
  - `gas/schools/{schoolId}/notification_inbox/teacher/{teacherId}/{notificationId}`

### Halo Spentgapa

- `gas/schools/{schoolId}/halo_spentgapa_reports/{reportId}`

### 7 KAIH

- `seven_habits_logs/{studentId}/{date}`
- `seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}`

## 7. Aturan Produk dan Teknis

Aturan yang wajib dipatuhi:

- jangan edit folder referensi langsung
- semua perubahan hanya di folder kerja
- hindari listener boros untuk histori besar jika one-shot fetch lebih tepat
- masking anonim harus dijaga sejak layer data, bukan hanya di UI
- jangan membuat sumber kebenaran baru yang bertentangan dengan web GAS final
- prioritaskan modularitas, hindari file raksasa

## 8. Status Implementasi Terkini

Status sampai update dokumentasi ini:

1. login siswa sudah tersambung ke Firebase project kanonik:
   - `dashboard-portal-179f7`
2. lookup identitas siswa di APK sudah memprioritaskan:
   - `username`
   - lalu `nisn`
3. fallback sesi lokal untuk siswa sudah aktif bila binding device ke RTDB tidak dapat dipakai penuh di Spark plan
4. Virtual Pet admin web dan APK siswa sudah sinkron untuk alur utama:
   - pet siswa tidak lagi infinite loading
   - klasifikasi `Sehat / Sakit / Sekarat / Mati` sudah selaras antara web dan APK
   - tombol `Hidupkan` di web admin sudah terbukti memengaruhi state pet di APK siswa
5. rules RTDB Virtual Pet sudah disesuaikan agar:
   - web admin tetap bisa melakukan revive
   - APK siswa tetap bisa membaca dan sinkron terhadap pet aktif

## 9. Gap Prioritas

Prioritas aktif setelah Virtual Pet stabil:

1. sinkronkan repository notifikasi ke `notification_inbox`
2. pisahkan Halo Spentgapa dari repository legacy `bullying_reports`
3. hardening privasi anonim
4. audit fallback legacy 7 KAIH
5. bersihkan data pet ganda legacy dan rapikan warning model quest

## 10. Tahapan Implementasi

### Tahap 1: Hardening data layer

- repository notifikasi siswa
- repository notifikasi guru
- repository Halo Spentgapa
- validasi auth/session per role

### Tahap 2: Validasi modul utama

- notifikasi
- Halo Spentgapa
- 7 KAIH
- Virtual Pet
- modul monitoring prioritas lain

### Tahap 3: Build internal

- `assembleSiswaDebug`
- `assembleGuruDebug`
- `assembleKepalaDebug`

## 11. Definition of Done

APK GAS dianggap siap tahap internal jika:

- semua flow login per role lolos
- notifikasi inbox terbaca dari jalur final
- Halo Spentgapa sudah tidak bertumpu pada node legacy
- data anonim aman
- 7 KAIH dan Virtual Pet tidak drift dari web final
- build debug per flavor berhasil
- flow revive Virtual Pet dari web admin ke APK siswa berjalan normal

## 12. Catatan Virtual Pet Final

Catatan final untuk modul Virtual Pet:

- State pet siswa ditentukan oleh perilaku siswa, bukan sekadar aksi manual UI.
- Rumus status yang dipakai tetap:
  - `Sehat`
  - `Sakit`
  - `Sekarat`
  - `Mati`
- Kondisi `Mati` pada APK siswa bukan bug jika memang nilai perilaku harian siswa buruk.
- Revive dari admin tidak menghapus logika perilaku; revive hanya memberi kesempatan pemulihan sementara.
- Setelah revive, pet dapat tampil `Sekarat` bila nilai harian siswa tetap rendah. Ini adalah perilaku yang diinginkan.

## 13. Dokumen Acuan

- [Integrasi APK GAS](file:///d:/Dashboard%20Portal/docs/Integrasi_APK_GAS_native-mobile_final.md)
- [PRD Monitoring & Laporan Final](file:///d:/Dashboard%20Portal/docs/prd%20modul_Monitoring%20&%20Laporan_final.md)
- [Kontrak Data Admin GAS](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md)
- [Folder kerja APK GAS](file:///D:/Dashboard%20Portal/native-mobile-gas)
