# Handoff APK GAS

Dokumen ini menjadi pegangan kerja untuk integrasi dan pengembangan APK GAS berbasis project Android native.

## 1. Status Saat Ini

- Modul web GAS dianggap **final** sebagai acuan kontrak data aktif.
- Audit integrasi mobile awal sudah selesai.
- Folder referensi mobile **tidak boleh** dijadikan folder kerja langsung.
- Folder kerja baru untuk APK GAS sudah disiapkan di:
  - [D:\Dashboard Portal\native-mobile-gas](file:///D:/Dashboard%20Portal/native-mobile-gas)
- Firebase project yang dipakai web dan mobile sudah disatukan ke:
  - `dashboard-portal-179f7`
- **Pecah Flavor Selesai**: APK GAS berhasil dipecah menjadi 3 flavor dengan *package name* unik:
  - `siswa` -> `com.satupintu.mobile.siswa`
  - `guru` -> `com.satupintu.mobile.guru`
  - `kepala` -> `com.satupintu.mobile.kepala`
- **Bug Fix APK Guru**:
  - `resolveTeacher` sudah diperbaiki (cek `snapshot.exists()`) agar tidak mengembalikan *schoolId* kosong saat *lookup* key Firebase gagal.
  - Tabel *Data Siswa* sudah disesuaikan ukuran kolomnya sehingga teks tidak terpotong (elipsis `...`).
  - Siswa binaan (Homeroom) sudah berhasil muncul.
- APK build terbaru (*debug*) sudah ada di folder `D:\Dashboard Portal\docs\APK GAS\`:
  - `apk GAS guru.apk`
  - `apk GAS kepsek.apk`
  - `apk GAS siswa.apk`


## 2. Aturan Folder

### Folder referensi

- [D:\Satu Pintu\native-mobile](file:///D:/Satu%20Pintu/native-mobile)

Aturan:

- hanya untuk **dibaca dan dibandingkan**
- **jangan edit langsung**
- **jangan hapus file**
- jika butuh perubahan, salin dulu ke folder kerja

### Folder kerja resmi

- [D:\Dashboard Portal\native-mobile-gas](file:///D:/Dashboard%20Portal/native-mobile-gas)

Aturan:

- semua refactor dan eksperimen APK GAS dilakukan di sini
- build/debug APK dilakukan dari sini
- sinkronisasi dengan web GAS final dilakukan di sini

## 3. Referensi Dokumen Penting

- [PRD APK GAS](file:///d:/Dashboard%20Portal/docs/APK%20GAS/prd%20apk%20gas.md)
- [Integrasi APK GAS](file:///d:/Dashboard%20Portal/docs/Integrasi_APK_GAS_native-mobile_final.md)
- [PRD Monitoring & Laporan Final](file:///d:/Dashboard%20Portal/docs/prd%20modul_Monitoring%20&%20Laporan_final.md)
- [Kontrak Data Admin GAS](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md)
- [handoff.md](file:///d:/Dashboard%20Portal/handoff.md)

## 4. Keputusan Arsitektural

Keputusan yang sudah dikunci:

1. APK GAS memakai base dari project native Android, **bukan** copy-tempel ke project web.
2. Integrasi dimulai dari **repository, auth/session, notification delivery, dan kontrak data**.
3. Folder referensi diperlakukan sebagai **source of reference**, bukan source of modification.
4. Semua modul mobile harus mengikuti kontrak data GAS web final, terutama untuk:
   - notifikasi
   - laporan masuk / Halo Spentgapa
   - 7 KAIH
   - Virtual Pet

## 5. Temuan Gap Utama

### A. Notifikasi siswa/guru masih membaca jalur lama

Masalah:

- mobile lama masih mengandalkan jalur `system_announcements`
- web GAS final sudah memakai inbox penerima:
  - `gas/schools/{schoolId}/notification_inbox/student/{studentId}/{notificationId}`
  - `gas/schools/{schoolId}/notification_inbox/teacher/{teacherId}/{notificationId}`

Dampak:

- broadcast web admin tidak akan sinkron ke APK jika mobile tidak dipindah ke inbox baru

### B. Halo Spentgapa masih memakai jalur legacy

Masalah:

- mobile lama masih memakai:
  - `bullying_reports`
  - `bullying_reports_by_school`
  - `bullying_reports_by_student`
- web admin GAS final sudah mengelola laporan pada jalur final tenant-scoped

Dampak:

- histori aduan, status, dan masking anonim bisa pecah antara web dan APK

### C. Privasi anonim perlu dijaga di mobile

Masalah:

- bila mobile tetap membaca node mentah lama, identitas anonim bisa tetap terbaca

Dampak:

- bertentangan dengan hardening yang sudah diberlakukan di web admin

### D. 7 KAIH relatif paling dekat ke kontrak final

Catatan:

- modul ini bukan blocker utama
- tetapi masih perlu audit fallback legacy agar tidak drift

### E. Virtual Pet sudah usable end-to-end

Status final saat ini:

- halaman admin `Virtual Pet Monitor` sudah membaca siswa tenant dan pet aktif
- klasifikasi status `Mati / Sekarat / Sakit / Sehat` di web admin sudah diselaraskan dengan APK siswa
- bug infinite loading di APK siswa sudah selesai
- tombol `Hidupkan` pada web admin sudah terbukti memengaruhi pet di APK siswa
- revive tidak menghapus rule perilaku; pet bisa tetap turun ke `Sekarat` bila perilaku siswa masih buruk

Catatan teknis penting:

- state pet siswa memang dihitung dari kombinasi data perilaku harian
- kondisi `Mati` bukan bug jika absensi, sholat, kebiasaan, dan literasi memang buruk
- pernah ditemukan data pet ganda legacy untuk satu siswa; modul saat ini sudah usable, tetapi database tetap perlu dirapikan agar tidak membingungkan tim berikutnya

## 6. Kontrak Data yang Harus Diikuti

### Notifikasi

- history admin:
  - `gas/schools/{schoolId}/notifications/{notificationId}`
- inbox siswa:
  - `gas/schools/{schoolId}/notification_inbox/student/{studentId}/{notificationId}`
- inbox guru:
  - `gas/schools/{schoolId}/notification_inbox/teacher/{teacherId}/{notificationId}`

### Halo Spentgapa / Laporan Masuk

- jalur final admin:
  - `gas/schools/{schoolId}/halo_spentgapa_reports/{reportId}`

Catatan:

- laporan anonim tidak boleh membocorkan identitas ke layer UI yang tidak berhak

### 7 KAIH

- log:
  - `seven_habits_logs/{studentId}/{date}`
- teacher ratings:
  - `seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}`

## 7. Urutan Pengerjaan yang Disarankan

1. ~~Buat 3 flavor APK (Siswa, Guru, Kepala) dan konfigurasi *build.gradle*~~ (**SELESAI**)
2. ~~Fix *mismatch* `schoolId` dan perbaiki query `Data Siswa` di APK Guru~~ (**SELESAI**)
3. refactor repository notifikasi siswa/guru ke `notification_inbox`
4. refactor repository Halo Spentgapa agar tidak lagi bertumpu pada `bullying_reports`
5. audit masking anonim di seluruh flow student/guru/kepala
6. audit fallback legacy 7 KAIH
7. bersihkan data pet ganda legacy di `virtual_pets`
8. rapikan warning model `PetQuest.completed` vs `isCompleted`

## 8. Target Build Setelah Integrasi

Setelah layer data sudah selaras, target build (sudah berjalan dengan baik):

- `assembleSiswaDebug`
- `assembleGuruDebug`
- `assembleKepalaDebug`

## 9. Catatan Insiden Penting

Pernah terjadi kesalahan proses:

- folder referensi sempat tersentuh saat refactor awal
- kondisi itu sudah dibersihkan
- aturan kerja resmi sekarang adalah:

> **referensi dibaca, copy kerja yang diedit**

## 10. Catatan Operasional Virtual Pet

Pegangan untuk tim berikutnya:

1. Jika pet siswa terlihat `Mati`, cek dulu apakah itu sesuai data perilaku siswa. Jangan langsung anggap bug.
2. Jika admin menekan tombol `Hidupkan`, perubahan harus terlihat di node `virtual_pets/{petId}` pada Firebase project `dashboard-portal-179f7`.
3. Jika APK siswa tidak berubah setelah revive, cek:
   - apakah pet yang direvive adalah row pet yang dipakai APK
   - apakah ada data pet ganda untuk `studentId` yang sama
   - apakah ada `Permission denied` baru di logcat
4. Rules RTDB Virtual Pet saat ini sudah disesuaikan agar kompatibel dengan pola sesi anonim APK siswa dan alur revive admin.
5. Warning `ClassMapper: No setter/field for completed found on class PetQuest` belum memblokir fungsi utama, tetapi perlu dibereskan pada sesi berikutnya.

## 11. Next Task

Task berikut yang paling tepat:

> lanjutkan refactor `D:\Dashboard Portal\native-mobile-gas` untuk `notification_inbox` dan `Halo Spentgapa`, lalu rapikan data/kontrak legacy Virtual Pet yang masih tersisa
