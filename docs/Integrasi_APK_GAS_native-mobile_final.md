# Integrasi APK GAS dari `native-mobile`

## 1. Keputusan Utama

APK GAS **tidak dibangun dengan menyalin isi folder** `D:\Satu Pintu\native-mobile` ke proyek web.

Keputusan yang dipakai:

1. `D:\Satu Pintu\native-mobile` dijadikan **fondasi resmi APK GAS**
2. integrasi dilakukan dengan **sinkronisasi kontrak data** terhadap modul GAS web yang sudah final
3. refactor dimulai dari **repository + session/auth + notification delivery**, baru ke screen/UI

Alasan:

- folder tersebut sudah merupakan project Android Kotlin native yang utuh
- sudah memiliki boundary `gas`
- sudah punya navigation, screen, repository, dan aturan role
- risiko terbesar saat ini bukan ketiadaan UI, tetapi **ketidaksinkronan kontrak data dengan implementasi web final**

Referensi dasar:

- [native-mobile/README.md](file:///D:/Satu%20Pintu/native-mobile/README.md)
- [PRD Monitoring & Laporan Final](file:///d:/Dashboard%20Portal/docs/prd%20modul_Monitoring%20&%20Laporan_final.md)
- [Kontrak Data Admin GAS](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md)

## 2. Kecocokan yang Sudah Baik

Hal yang sudah cukup siap dipakai sebagai basis:

- login multi-role dan tenant gate sudah ada di [LoginScreen.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt)
- boundary aplikasi GAS sudah dikunci lewat `satupintu.mobileBoundary=gas`
- route security per flavor sudah ada di [SecurityUtils.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/util/SecurityUtils.kt)
- modul utama GAS sudah tersedia:
  - attendance
  - prayer
  - discipline
  - library
  - virtual pet
  - 7 KAIH
  - halo spentgapa
  - notifications
- fallback `class / kelas / className` sudah mulai dipakai di beberapa area mobile

Kesimpulan:

> proyek native ini **layak dijadikan base APK GAS**, bukan dibangun ulang dari nol.

## 3. Gap Kritis yang Harus Dibereskan

### 3.1 Notifikasi siswa masih membaca jalur lama

File:

- [StudentNotificationViewModel.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentNotificationViewModel.kt#L124-L245)

Masalah:

- notifikasi siswa masih membaca:
  - `system_announcements/student`
  - `system_announcements_by_school/{schoolId}/student`
- padahal kontrak web final sekarang memakai inbox penerima:
  - `gas/schools/{schoolId}/notification_inbox/student/{studentId}/{notificationId}`

Dampak:

- broadcast dari admin web tidak akan muncul konsisten di APK siswa
- mobile dan web akan punya dua sumber kebenaran notifikasi

### 3.2 Notifikasi guru masih membaca jalur lama

File:

- [TeacherNotificationViewModel.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt#L177-L254)

Masalah:

- guru masih membaca `system_announcements`
- belum membaca inbox baru:
  - `gas/schools/{schoolId}/notification_inbox/teacher/{teacherId}/{notificationId}`

Dampak:

- broadcast guru dari admin GAS web berisiko tidak pernah sampai ke APK guru

### 3.3 Halo Spentgapa mobile masih menempel ke node lama `bullying_reports`

File:

- [HaloSpentgapaViewModel.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/ui/viewmodel/HaloSpentgapaViewModel.kt#L26-L56)
- [BullyingRepository.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/data/repository/BullyingRepository.kt#L27-L273)

Masalah:

- student dan teacher report flow masih berbasis:
  - `bullying_reports`
  - `bullying_reports_by_school`
  - `bullying_reports_by_student`
- sedangkan web admin GAS final sudah memakai jalur `halo_spentgapa` / laporan masuk yang telah di-hardening

Dampak:

- status laporan dan histori aduan bisa pecah antara web admin dan APK
- masking anonim yang sudah dibenerkan di web tidak otomatis ikut berlaku di mobile bila mobile baca node mentah

### 3.4 Risiko privasi anonim masih terbuka jika mobile baca node mentah

File terkait:

- [BullyingRepository.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/data/repository/BullyingRepository.kt#L18-L25)

Masalah:

- repository memetakan objek laporan mentah langsung dari RTDB
- bila data anonim masih mengandung `reporterId` / `reporterName`, mobile tetap bisa melihat identitas itu

Dampak:

- aturan privasi yang sudah ditegakkan di web admin belum otomatis aman di APK

### 3.5 7 KAIH teacher/principal masih memegang fallback kontrak lama

File:

- [TeacherSevenHabitsRepository.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/data/repository/TeacherSevenHabitsRepository.kt#L17-L83)
- [SevenHabitsRepository.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/data/repository/SevenHabitsRepository.kt#L21-L103)

Catatan:

- path utama `seven_habits_logs/{studentId}/{date}` dan `seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}` sudah selaras
- tetapi mobile masih membawa fallback `seven_habits_logs_by_school`

Status:

- **bukan blocker utama**
- tetapi perlu diputuskan apakah fallback legacy itu tetap dipelihara atau dibersihkan

### 3.6 Virtual Pet mobile masih memakai kalkulasi lokal yang sensitif terhadap drift

File:

- [VirtualPetViewModel.kt](file:///D:/Satu%20Pintu/native-mobile/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt#L217-L390)

Masalah:

- state pet dihitung langsung di client dari kombinasi:
  - attendance
  - habits
  - literacy
  - prayer
  - discipline
- ini bagus untuk interaktivitas, tapi berisiko drift jika aturan pusat berubah

Status:

- **masih layak dipakai untuk tahap awal**
- tetapi nanti idealnya ada kontrak rule yang lebih eksplisit agar web admin dan APK membaca bahasa status yang sama

## 4. Rekomendasi Implementasi

Urutan kerja terbaik:

1. **Sinkronkan notifikasi dulu**
   - siswa baca `notification_inbox/student`
   - guru baca `notification_inbox/teacher`
   - tambahkan flag `isRead`
   - siapkan ack baca bila diperlukan

2. **Pisahkan Halo Spentgapa dari repository `BullyingRepository`**
   - buat repository baru khusus `HaloSpentgapa`
   - jangan campur aduan aktif dengan kontrak legacy `bullying_reports`
   - masking anonim dilakukan sebelum data dipakai UI

3. **Audit ulang kontrak 7 KAIH mobile**
   - pertahankan path aktif final
   - tandai fallback legacy yang masih dibutuhkan vs yang bisa dihapus

4. **Kunci kontrak Virtual Pet**
   - tetap pakai base mobile saat ini
   - dokumentasikan rule yang dianggap sumber kebenaran

5. **Baru setelah itu build APK debug**
   - `assembleSiswaDebug`
   - `assembleGuruDebug`
   - `assembleKepalaDebug`

## 5. Tahap Eksekusi yang Saya Rekomendasikan

### Tahap 1

Hardening integration layer:

- notification inbox
- halo spentgapa repository baru
- auth/session smoke test per role

### Tahap 2

Validasi modul prioritas:

- siswa: notifikasi, halo spentgapa, 7 KAIH, virtual pet
- guru: notifikasi, seven habits, attendance, discipline
- kepala: dashboard ringkas

### Tahap 3

Build internal APK:

- debug APK per flavor
- uji login tenant nyata
- uji data tenant isolation

## 6. Keputusan Final Saat Ini

Keputusan kerja untuk tim:

- **jangan copy langsung isi folder**
- **pakai `D:\Satu Pintu\native-mobile` sebagai base**
- **mulai dari sinkronisasi repository dan kontrak data**
- **notifikasi inbox + halo spentgapa adalah prioritas pertama**

## 7. Next Task yang Paling Masuk Akal

Task berikutnya yang paling tepat:

> refactor `native-mobile` untuk integrasi `notification_inbox` dan `Halo Spentgapa` sesuai kontrak GAS final
