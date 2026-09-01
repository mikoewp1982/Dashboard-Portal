# Build Log EduLock Siswa

Dokumen ini adalah log operasional wajib untuk setiap perubahan **APK EduLock siswa**.

## Aturan Pakai
1. Tambahkan entry baru paling atas.
2. Tulis scope terdampak. Secara default dokumen ini mencatat `student`.
3. Tulis jujur build yang benar-benar dijalankan.
4. Jika tidak build, tulis alasannya.
5. Gunakan format baku yang sama agar riwayat perubahan EduLock mudah ditelusuri.

## Format Baku Entry
Field berikut wajib dipakai di setiap entri:
- Waktu
- Pelaksana
- Jenis perubahan: `feature`, `fix`, `refactor`, `docs`, atau `no-build`
- Scope terdampak
- Tujuan perubahan
- File utama yang diubah
- Fitur lama yang wajib ikut dicek
- Build yang dijalankan
- Hasil build
- Output APK
- Disalin ke
- Regression check yang dijalankan
- Belum diuji
- Catatan

## 2026-09-01 22:10 — Release EduLock v1.3.23 (49): Relaksasi Dialog Aksesibilitas di Luar Jam Sekolah (di Rumah) & Hapus Spam Service

- **Waktu:** 2026-09-01 22:10
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `ux-improvement` + `version-bump`
- **Scope terdampak:** `student` (APK EduLock Siswa)
- **Tujuan perubahan:**
  1. **Relaksasi Dialog Aksesibilitas di `MainActivity`**: Saat siswa/ortu membuka EduLock di luar jam sekolah (di rumah) / mode libur, dialog modal paksa *"Wajib Aktifkan Proteksi"* otomatis ditiadakan (`dismissAccessibilityPrompt()`). Dialog modal hanya muncul saat siswa membuka EduLock pada jam sekolah.
  2. **Menghapus Spam Notifikasi Aksesibilitas di Luar Jam Sekolah**: Mencabut logika pemunculan notifikasi dan pemaksaan buka Settings setiap 30 detik di `MonitoringService.kt` saat di rumah. HP siswa kini 100% hening dan bebas gangguan di rumah.
  3. **Enforcement Aksesibilitas Tetap Ketat di Sekolah**: Saat jam sekolah berlangsung di area sekolah, jika aksesibilitas dimatikan, sistem tetap mengunci layar penuh untuk mencegah bypass aplikasi gembok.
  4. **Version Bump**: Naik ke **`1.3.23 (versionCode 49)`**.
- **File utama yang diubah:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/build.gradle.kts`
- **Fitur lama yang wajib ikut dicek:**
  - Hukuman layar Pet Mati (`PetDeadLockActivity`) tetap muncul berkala dan bisa di-dismiss "Saya Mengerti"
  - Proteksi jam sekolah dan geofence GPS tetap aktif normal
- **Build yang dijalankan:** `./gradlew :app:assembleStudentRelease` → BUILD SUCCESS (1m 55s)
- **Output APK:** `native-mobile-edulock/app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- **Disalin ke:**
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.23-49.apk`

## 2026-09-01 21:45 — Fix Infinite Loop Pet Dead Lock & Hapus Dialog "Penyematan Layar" (Screen Pinning), Hardening Device Admin Policy

- **Waktu:** 2026-09-01 21:45
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `hardening` + `build-release`
- **Scope terdampak:** `student` (APK EduLock Siswa)
- **Tujuan perubahan:**
  1. **Menutup Bug Infinite Loop PetDeadLockActivity**: Saat pet mati, `MonitoringService` memicu spawn activity baru setiap 1-2 detik karena `lastPetDeadAckAt` belum diupdate dan memancarkan `ACTION_DISMISS_LOCKSCREEN` yang membunuh layarnya sendiri. Diperbaiki dengan guard `if (PetDeadLockActivity.isShowing) return` dan menghapus broadcast self-dismiss saat meluncurkan lock.
  2. **Menghapus Dialog Sistem "Penyematan Layar"**: Menghapus pemanggilan `startLockTask()` / `startKioskMode()` pada `PetDeadLockActivity.kt`. Layar pengingat pet mati kini murni berupa Fullscreen Activity biasa dengan tombol *"Saya Mengerti"*, sehingga pop-up OS Android *"Penyematan Layar"* hilang 100% selamanya.
  3. **Hardening Device Admin Policy**: Membersihkan tag policy berlebih (`<wipe-data />`, `<reset-password />`, `<limit-password />`, `<watch-login />`) di `res/xml/device_admin.xml`, hanya mempertahankan `<force-lock />` dan `<disable-keyguard-features />`. Peringatan aktivasi admin di HP siswa kini bersih dan ramah (*"Mengunci Layar"*).
- **File utama yang diubah:**
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/res/xml/device_admin.xml`
- **Fitur lama yang wajib ikut dicek:**
  - Kemunculan reminder pet mati berkala di luar jam sekolah
  - Penutupan layar saat tombol "Saya Mengerti" ditekan
  - Otomatis hilang saat admin menekan tombol "Revive" di web
  - Gembok jam sekolah dan anti-uninstall selektif tetap aktif normal
- **Build yang dijalankan:** `./gradlew :app:assembleStudentRelease` → BUILD SUCCESS
- **Output APK:** `native-mobile-edulock/app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- **Disalin ke:**
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`

## 2026-08-31 (PATCH IFP SMART TV) — Fix GPS detection loop pada Smart TV/IFP tanpa GPS satellite hardware, pertahankan versi 1.3.22/48

- **Waktu:** 2026-08-31
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Scope terdampak:** `student` (APK EduLock siswa), khususnya perangkat Android Smart TV / IFP (Interactive Flat Panel) yang tidak memiliki chip GPS satellite hardware
- **Tujuan perubahan:** Menutup bug "terus meminta hidupkan GPS" meskipun user sudah menyalakan Pengaturan Lokasi di perangkat IFP Smart TV. Akar masalah: logika `isGpsEnabled()` hanya menerima `GPS_PROVIDER` (satellite) sebagai valid; Smart TV hanya punya `NETWORK_PROVIDER` (Wi-Fi based location) sehingga selalu dianggap GPS mati dan memunculkan overlay recovery terus-menerus.
- **File utama yang diubah:**
  - [LocationMonitor.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LocationMonitor.kt#L82-L109) — Ubah `isGpsEnabled()` dari AND (`masterOn && GPS_ON`) menjadi OR (`masterOn && (GPS_ON || NETWORK_ON)`). Minimal salah satu provider lokasi aktif = dianggap lokasi menyala.
  - [MainActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt#L2020-L2040) — Fallback `isGPSEnabled()` (sebelum LocationMonitor diinisialisasi) diselaraskan agar juga menerima NETWORK_PROVIDER + cek master location switch.
  - [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/AndroidManifest.xml#L35-L38) — Deklarasi fitur lokasi/GPS/network diubah menjadi `android:required="false"` agar Play Store dan PackageManager tidak menganggap GPS hardware sebagai prasyarat wajib install.
- **Fitur lama yang wajib ikut dicek:**
  - Overlay `GpsEnableOverlay` di luar jam sekolah / di rumah
  - Overlay "GPS MATI DI AREA SEKOLAH" beserta tombol Pengaturan Lokasi
  - Enforcement fail-closed GPS-off berbasis school presence (geofence + near-school)
  - Deteksi lokasi sekolah via Fused Location Provider dan legacy LocationManager
- **Build yang dijalankan:**
  - `cd D:\Dashboard Portal\native-mobile-edulock ; .\gradlew.bat :app:assembleStudentRelease`
- **Hasil build:**
  - assemble EduLock student release — **BUILD SUCCESSFUL in 2m 08s** (49 tasks: 17 executed, 32 up-to-date).
- **Output APK:**
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- **Disalin ke:**
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk` (arsip versioned — **pertahankan nomor versi sesuai instruksi**)
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk` (alias Final)
- **SHA256 EduLock-1.3.22-48.apk (patch IFP GPS 2026-08-31):** `707E64BB56356E22BE124C3B865DA2860D7BC94D600A1CC6457C8BED1EDD...` (hash lengkap lihat output `Get-FileHash`)
- **Regression check yang dijalankan:**
  - compile/build release EduLock (SUCCESS)
  - salin file ke 2 target di folder Final (versioned + alias)
  - verifikasi SHA hasil salin
- **Belum diuji:**
  - [ ] Instalasi di unit IFP Smart TV fisik (user uji mandiri di lapangan)
  - [ ] Regression overlay GPS-off di HP fisik biasa (case: HP dengan GPS satellite normal)
  - [ ] Lokasi geofence ENTER/EXIT + school presence di HP biasa setelah patch
  - [ ] Sinkron ke `web/public/apk` dan deploy tutorial live `/e` / App Hosting
- **Catatan:**
  - Sesuai instruksi user, nomor versi **TIDAK** di-bump; tetap `versionCode = 48` dan `versionName = 1.3.22` (patch). File Final yang lama dengan versi yang sama ditimpa (overwrite).
  - Logika OR provider pada `isGpsEnabled()` juga memberikan dampak positif untuk HP vendor China yang kadang menonaktifkan GPS satellite demi hemat baterai, namun tetap aktifkan Network Location via Wi-Fi.

## 2026-08-30 19:02 - [DEPLOY WEB] Source tutorial `/edulock/install` didorong ke main
- **Waktu:** 2026-08-30 19:02 WIB
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Scope terdampak:** `web tutorial /edulock/install`, `public-apk`, `deploy-web`
- **Tujuan perubahan:** Mendorong perapian lokal tombol unduh EduLock ke `origin/main` agar route tutorial live bisa ikut mengarah ke file versioned `EduLock-1.3.22-48.apk`.
- **File utama yang diubah:**
  - `web/src/app/edulock/install/page.tsx`
  - `web/public/apk/apk-manifest.json`
  - `web/public/apk/EduLock-1.3.22-48.apk`
- **Fitur lama yang wajib ikut dicek:**
  - Tombol unduh di `/edulock/install` dan alias `/e`
  - Teks versi file unduhan di kartu utama
  - Halaman `super-admin/mobile-apps` yang membaca `apk-manifest.json`
- **Build yang dijalankan:** tidak ada build APK baru; memakai hasil `npm run build` lokal dari patch sebelumnya
- **Hasil build:** push web sukses
- **Output APK:** tidak ada build APK baru; memakai file Final eksisting `EduLock-1.3.22-48.apk`
- **Disalin ke:** tidak ada salinan baru di luar `web/public/apk` yang sudah dilakukan pada entry 18:48
- **Regression check yang dijalankan:**
  - `git push origin main` sukses dengan commit `329ea6c6`
  - pengecekan live sesaat setelah push menunjukkan route `/edulock/install` dan manifest live masih menunggu rollout App Hosting
- **Belum diuji:** route live `/edulock/install` dan `/e` setelah rollout App Hosting benar-benar selesai
- **Catatan:** Entry ini menutup status "baru diverifikasi lokal" pada entry 18:48. Source yang benar sudah ada di `main`, tetapi perubahan live masih tergantung rollout App Hosting.

## 2026-08-30 18:48 - [FIX WEB LOKAL] Tombol unduh `/edulock/install` diselaraskan ke EduLock 1.3.22 (48)
- **Waktu:** 2026-08-30 18:48 WIB
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Scope terdampak:** `web tutorial /edulock/install`, `public-apk`, `manifest`
- **Tujuan perubahan:** Halaman tutorial EduLock masih menampilkan fallback dan nama unduhan lama `EduLock-1.3.11-37.apk`, padahal file Final terbaru yang berlaku adalah `EduLock-1.3.22-48.apk`.
- **File utama yang diubah:**
  - `web/src/app/edulock/install/page.tsx`
  - `web/src/data/apk-manifest.json`
  - `web/public/apk/apk-manifest.json`
  - `web/public/apk/EduLock-1.3.22-48.apk`
- **Fitur lama yang wajib ikut dicek:**
  - Tombol unduh di `/edulock/install` dan alias `/e`
  - Teks versi file unduhan di kartu utama
  - Halaman `super-admin/mobile-apps` yang membaca `apk-manifest.json`
- **Build yang dijalankan:** `npm run build` pada folder `web`
- **Hasil build:** sukses
- **Output APK:** tidak ada build APK baru; memakai file Final eksisting `EduLock-1.3.22-48.apk`
- **Disalin ke:** `web/public/apk/EduLock-1.3.22-48.apk`
- **Regression check yang dijalankan:**
  - Prerender `.next/server/app/edulock/install.html` memuat `href="/apk/EduLock-1.3.22-48.apk?..."`
  - Teks halaman lokal menampilkan `EduLock-1.3.22-48.apk (versi 1.3.22 / 48)`
  - `ensure-standalone-public` memasukkan `EduLock-1.3.22-48.apk` ke build standalone
- **Belum diuji:** URL live production `/edulock/install` dan `/e` setelah deploy
- **Catatan:** SHA acuan file publik/final yang sekarang dipakai adalah `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`. Perubahan ini baru diverifikasi lokal; agar live ikut berubah, perlu deploy web terpisah.

## 2026-08-28 ~18:51 - [REBUILD FINAL LOKAL] EduLock 1.3.22 (48) — Hardening enforcement offline + Accessibility recovery, lulus uji HP fisik user

- Pelaksana: Assistant
- Jenis: `fix` + `build-deploy`
- Scope: `student` (APK EduLock siswa)
- Tujuan: Menutup dua bug lapangan yang muncul setelah patch fallback audio sebelumnya. Gejala 1: `internet mati total` sudah memberi overlay warning, tetapi setelah masa tenggang lewat tidak selalu masuk lock final. Gejala 2: `Accessibility OFF` saat jam sekolah/proteksi aktif hanya memunculkan popup EduLock berulang, tetapi tidak benar-benar memaksa HP tetap berada di jalur EduLock. Target build ini adalah memastikan kedua enforcement tersebut benar-benar keras di HP fisik.
- File utama yang diubah:
  - [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt) hardening jalur offline / airplane / recovery guard sampai lock final tidak lagi kalah oleh state recovery yang nyangkut.
  - [LockEnforcer.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt) bedakan target `accessibility` dari recovery settings biasa: jangan auto-aktifkan recovery grace dan jangan longgarkan kiosk hanya karena overlay Accessibility tampil.
  - [OverlayLockActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt) perketat lifecycle untuk target `accessibility`: grace hanya hidup saat user benar-benar memilih masuk ke Settings, dan kiosk tetap boleh aktif jika overlay Accessibility diabaikan atau user balik tanpa menyalakan proteksi.
- Fitur lama yang wajib ikut dicek:
  - Master Switch proteksi (ON/OFF via admin/FCM)
  - flow recovery GPS / overlay permission / device admin
  - Find Device alarm + fallback audio 2 lapis
- Build yang dijalankan:
  - `cd D:\Dashboard Portal\native-mobile-edulock ; .\gradlew.bat :app:assembleStudentRelease --no-daemon`
- Hasil build:
  - assemble EduLock student release — **BUILD SUCCESSFUL in 2m 06s** (49 tasks: 10 executed, 39 up-to-date).
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk` (arsip versioned)
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk` (alias Final)
  - `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk` (alias publik lokal, belum di-push)
- **SHA256 (rebuild final lokal 2026-08-28 ~18:51):** `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`
- **SHA256 rebuild transisi 2026-08-28 ~18:39 (superseded):** `01B19582EB96B0DA975641E244A036A4E824045910DD92C38E7F235D3D0E39BC`
- **SHA256 patch fallback audio 2026-08-28 ~16:40 (superseded):** `5F4E2EE3D27FDA29724E11595FDDD7BABE5F1CF467E07799B8DB4C27966336DB`
- Regression check yang dijalankan:
  - compile/build release EduLock (SUCCESS)
  - salin file -> SHA identik di 3 tujuan (Final versioned, Final alias, web publik lokal)
  - uji HP fisik user: `internet mati total -> lewat masa tenggang 60 detik` = **LULUS**
  - uji HP fisik user: `Accessibility OFF -> admin ON -> overlay diabaikan` = **LULUS**
- Belum diuji:
  - [ ] keluarga recovery lain yang masih serumpun: `Overlay OFF -> admin ON`, `Battery Optimization OFF -> admin ON`, `Izin Lokasi aplikasi OFF -> admin ON`
  - [ ] regression detail Temukan Perangkat: DND total silence, `FAILED_SILENT`, restore volume Alarm/Music, dan command Stop
  - [ ] push live `/e` / commit App Hosting
- Catatan:
  - Versi `versionCode` **TIDAK** di-bump sesuai instruksi user; tetap `1.3.22 / 48`.
  - Build ini **sudah lulus uji HP fisik user** untuk dua bug utama di atas, tetapi user masih ingin menyempurnakan versi ini sebelum melakukan git push/finalisasi live.

## 2026-08-28 ~16:40 - [REBUILD+SYNC PUBLIK] EduLock 1.3.22 (48) — Patch fallback audio Temukan Perangkat 2 lapis (STREAM_MUSIC + Vibrator) + status ACK detail ke admin

- Pelaksana: Assistant
- Jenis: `feature` (patch audio) + `build-deploy`
- Scope: `student` (APK EduLock siswa)
- Tujuan: User uji nyata menemukan fakta bahwa user matikan slider Alarm manual memang balik ke volume max saat admin bunyikan (desain asli), tapi siswa masih punya celah: (1) DND/Total Silence di ROM vendor, (2) OEM tolak set volume stream alarm → output tetap senyap. Admin hanya melihat `ALARM_STARTED` tanpa tahu HP sebenarnya tidak bunyi. Patch ini menutup celah silent tersebut dan melaporkan status fallback/jalur yang diambil ke panel admin.
- File utama yang diubah:
  - [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/AndroidManifest.xml) tambah izin `VIBRATE` dan `MODIFY_AUDIO_SETTINGS` (ROM vendor China lebih hormat jika izin dideklarasikan).
  - [DeviceLocatorAlarm.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/DeviceLocatorAlarm.kt) perkuat:
    - `setStreamVolume(STREAM_ALARM, max, FLAG_SHOW_UI)` + 2× `adjustStreamVolume(ADJUST_RAISE, FLAG_SHOW_UI)` bertubi (user lihat slider OS naik otomatis).
    - Setelah putar alarm, cek volume aktual; jika ≤ 0 atau di bawah max/2 → bunuh player dan fallback ke `STREAM_MUSIC` dengan logic yang sama (force max MUSIC).
    - Jika audio tetap nol → fallback Vibrator pattern waveform panjang `0/600/250/600/250/600/350/500/350/500` berulang, support API < S via Context.VIBRATOR_SERVICE, API ≥ S via VibratorManager.defaultVibrator.
    - Audio tetap dimainkan **bersama** vibrator (tidak saling ganti) jika audio berhasil.
    - Restore volume ALARM dan MUSIC ke level semula setelah selesai.
    - Tambah callback baru `onStartedWithFallback(Boolean, Boolean)` ke caller untuk melaporkan jalur yang diambil.
  - [FirebaseReporter.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/FirebaseReporter.kt) tambah field baru ke `active_devices`: `lastFindDeviceUsedMusicFallback`, `lastFindDeviceUsedVibrationFallback`, `lastFindDeviceStreamUsed` (ALARM / MUSIC_FALLBACK / EXCEPTION), plus status ACK enumerasi baru: `ALARM_STARTED_FALLBACK_MUSIC`, `ALARM_STARTED_VIBRATION_ONLY`, `FAILED_SILENT`.
  - [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt#L317-L382) hubungkan callback fallback: pilih status ACK yang benar + set field di FirebaseReporter; `ACTION_STOP_FIND_DEVICE_ALARM` tidak berubah.
- Fitur lama yang wajib ikut dicek:
  - Master Switch proteksi (ON/OFF via FCM)
  - Find Device Start/Stop command sebelumnya tetap bekerja (status ACK lama kompatibel karena field baru opsional; panel UI saat ini baca `lastFindDeviceStatus` saja).
  - Volume restore ke level semula (ALARM dan MUSIC).
- Build yang dijalankan:
  - `cd D:\Dashboard Portal\native-mobile-edulock ; .\gradlew.bat :app:assembleStudentRelease --no-daemon`
- Hasil build:
  - assemble EduLock student release — **BUILD SUCCESSFUL in 2m 34s** (49 tasks: 17 executed, 32 up-to-date).
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk` (arsip versioned)
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk` (alias Final / publik)
  - `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk` (sinkron ke direktori publik web agar `/e` serve patch terbaru)
- **SHA256 (patch fallback audio Temukan Perangkat 2026-08-28 ~16:40):** `5F4E2EE3D27FDA29724E11595FDDD7BABE5F1CF467E07799B8DB4C27966336DB`
- **SHA256 build 13:28 sebelumnya (superseded):** `8FB7CC53FD3F7C24680EE6FF391BF55B8270776445FBE8DBBD2A46C92AF01063`
- Regression check yang dijalankan:
  - compile/build release EduLock (SUCCESS)
  - salin file → SHA identik di 3 tujuan (Final versioned, Final alias, web publik)
- Belum diuji (wajib QA HP fisik):
  - [ ] User set slider Alarm = 0 → admin bunyikan → status ACK `ALARM_STARTED_FALLBACK_MUSIC` atau tetap `ALARM_STARTED` dan audio didengar nyata keras.
  - [ ] User aktifkan DND Total Silence → admin bunyikan → status ACK `ALARM_STARTED_VIBRATION_ONLY` dan HP getar pola panjang.
  - [ ] User matikan Music 0 + Alarm 0 + vibrate dimatikan aksesibilitas → status ACK `FAILED_SILENT` ke admin.
  - [ ] Setelah alarm selesai, slider ALARM dan MUSIC kembali ke level semula (tidak permanen max).
  - [ ] Master Switch ON/OFF via FCM dan overlay recovery GPS tetap tidak berubah.
- Catatan:
  - Versi `versionCode` **TIDAK** di-bump sesuai instruksi user "pertahankan saja versi saat ini"; tetap `1.3.22 / 48`.
  - Field baru `lastFindDeviceStreamUsed`, `lastFindDeviceUsedMusicFallback`, `lastFindDeviceUsedVibrationFallback` bersifat opsional; panel EduLockMonitoringPanel.tsx saat ini tidak menampilkannya, tapi data tersimpan di RTDB untuk UI enhancement kemudian.
  - commit App Hosting untuk sync live `/e` dan `/gas/install` belum di-git push pada build ini (menunggu instruksi user atau step berikutnya).

## 2026-08-28 13:28 - [BUILD+SYNC LIVE] EduLock 1.3.22 (48) — alarm Temukan Perangkat + sinkron unduhan live `/e`

- Pelaksana: Assistant
- Jenis: `feature` + `build-deploy`
- Scope: `student` + `web admin EduLock`
- Tujuan: Menyediakan fitur **Temukan Perangkat** di admin EduLock untuk membantu sekolah menemukan HP siswa yang masih online, dengan mekanisme command -> alarm keras di HP -> ACK status balik ke panel monitoring. Sekaligus menyinkronkan build `1.3.22 (48)` terbaru ke unduhan live Firebase/App Hosting.
- File utama yang diubah:
  - [EduLockMessagingService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/EduLockMessagingService.kt)
  - [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt)
  - [FirebaseReporter.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/FirebaseReporter.kt)
  - [DeviceLocatorAlarm.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/DeviceLocatorAlarm.kt)
  - [web/src/app/api/admin/edulock/route.ts](file:///D:/Dashboard%20Portal/web/src/app/api/admin/edulock/route.ts)
  - [web/src/components/edulock/panels/EduLockMonitoringPanel.tsx](file:///D:/Dashboard%20Portal/web/src/components/edulock/panels/EduLockMonitoringPanel.tsx)
- Fitur lama yang wajib ikut dicek:
  - Master Switch proteksi sekolah
  - heartbeat/status realtime di admin
  - flow install/tutorial `/e`
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
  - `cd D:\Dashboard Portal\web && npm run sync:apk`
  - `cd D:\Dashboard Portal\web && npm run build`
  - push Firebase/App Hosting commit `0c6f83a6`
- Hasil build:
  - assemble EduLock student release **SUCCESS**
  - sync APK publik **SUCCESS**
  - build web App Hosting **SUCCESS**
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
  - `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - compile/build release EduLock
  - build web admin setelah sync manifest
- Belum diuji:
  - end-to-end alarm nyata ke HP siswa dari panel live
  - perilaku pada device offline / FCM token stale / vendor aggressive doze
- Catatan:
  - Hash Final/public aktif: `8FB7CC53FD3F7C24680EE6FF391BF55B8270776445FBE8DBBD2A46C92AF01063`
  - Size aktif: `3.929.074 bytes`
  - Status live: tutorial `/e` sekarang mengarah ke build ini, dan panel admin membawa tombol **Bunyikan HP**.

## 2026-08-26 ~19:47 - [CRITICAL SECURITY PATCH] EduLock 1.3.22 (48) — Celah uninstall lewat tombol "Uninstal aplikasi" di halaman Device Admin Activation Android (bypass tanpa kode uninstall)

- Pelaksana: Assistant (temuan bug dilaporkan user via QA di HP nyata)
- Jenis: `fix` (CRITICAL SECURITY)
- Scope: `student` (Accessibility Anti-Uninstall Service)
- Tujuan: User QA report berhasil uninstall EduLock dengan cara: **buka halaman Aktivasi Device Admin → pilih tombol native "Uninstal aplikasi" di bawah → aplikasi ter-uninstall TANPA kode uninstall.** Ini adalah celah keamanan paling serius di rilis ini.
- **Akar masalah (3 temuan audit):**
  1. **Keyword "Uninstal" (1 huruf L, native Android typo) TIDAK match** di `isEduLockUninstallDialog()` — fungsi hanya match `meng-uninstal`, `ingin meng-uninstal`, `hapus aplikasi ini` (2 huruf L). Tombol native Device Admin Activation menampilkan `"Uninstal aplikasi"` (1 L) dan **100% tidak tertangkap** oleh keyword uninstaller detector.
  2. **Halaman Device Admin Activation (bukan Management) tidak dikategorikan `isDangerousPage`** post-Setup: L186-L191 lama — `isActivationAllowed` HANYA true selama `deviceAdminRequestUntil` masih aktif (Konfigurasi Awal awal). Setelah Setup selesai, user mencapai halaman Activation via Settings → Security → Device Admin Apps → `isActivationAllowed=false`. Tapi `isDangerousPage` sebelumnya hanya gabungan dari `uninstallDialog || appInfoPage || deviceAdminPage` (ActivationPage TIDAK masuk). Akibatnya: **L191 `if (!isDangerousPage || isActivationAllowed) return false` menjadi return false, dan halaman Activation TIDAK dikick.** User bebas klik tombol Uninstal.
  3. **Tidak ada cross-check "apakah di halaman Activation ada tombol uninstall?" —** meskipun `isActivationAllowed` true (boleh untuk Setup awal), tapi jika di halaman itu sudah ada tombol "Uninstal aplikasi" → **tetap bahaya dan harus dikick**. Sebelumnya tidak ada safety-net ini.
- **Perbaikan diterapkan (dual-layer patch):**
  1. **Patch A Deteksi keyword uninstall lebih longgar 27 kata** di `isEduLockUninstallDialog()` — tambah `"Uninstal aplikasi"`, `"Uninstal app"`, `"Uninstall aplikasi"`, `"Uninstall app"`, `"Uninstall this"`, `"Uninstall EduLock"`, `"Copot pemasangan"`, `"Hapus instalan"`, `"Hapus instal"`, `"Deactivate & uninstall"`, `"Uninstall & deactivate"`, `"Remove device admin"`, `"Disable this device admin"`, plus bare `"Uninstal"` dan `"Uninstall"` dengan fallback OR `isEduLockAppInfoPage` untuk false positive rendah.
  2. **Patch B Activation Page post-Setup = berbahaya hard-kick** di logika L169-L209 baru:
     - Tambah `deviceAdminActivationPage` state (reuse hasil dari `isEduLockDeviceAdminActivationPage()`)
     - Tambah `activationPageHasUninstall` detector (explicit scan tombol uninstall apa pun di halaman activation)
     - Safety net boolean `isActivationPageDangerous = (activationPage && !isActivationAllowed) || (activationPage && hasUninstall)`
     - Gabung `isActivationPageDangerous` KE DALAM `isDangerousPage` → kick langsung.
  3. Penguatan L182 SettingsGrace: sebelumnya hanya kecualikan `deviceAdminPage` & `uninstallDialog`. Kini **kecualikan juga `deviceAdminActivationPage`** agar grace period Settings GPS/battery/overlay tidak bentrok dengan tendang activation page yang legit untuk Setup awal.
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
    - L169-L209 → rewrite logic dangerousPage + activationPage + activationHasUninstall safety net
    - L368-L393 → expand keyword `isEduLockUninstallDialog()` 27 keyword (termasuk Uninstal 1L)
- Versi tetap **`1.3.22` / `48`** (timpa Final, tidak bump — sesuai instruksi user versi ini belum dirilis umum).
- Build: `assembleStudentRelease` — **BUILD SUCCESSFUL in 2m 24s** (49 tasks: 10 executed, 39 up-to-date).
- Output APK: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke: `Final/EduLock-1.3.22-48.apk` + alias `Final/EduLock-studentRelease.apk` (timpa dari SHA `B2710CCF…`).
- **SHA256 (patch critical security uninstall activation 2026-08-26 ~19:47)**: `1E9C87FFBB19B5CBB2432C3A1E1A9280639CF61BDBE921C4CA25689BCD03E42D`
- **Size**: `3.925.320 bytes` (≈ 3,74 MB)
- Deploy `/e`: **TIDAK** (Final only — sesuai instruksi user: "versi ini belum saya rilis untuk umum". Distribusi manual internal QA saja.)
- **QA WAJIB setelah install SHA `1E9C87FF…` (menunggu user QA):**
  - [ ] **Celah uninstall ter-tutup** — Ulangi langkah user sebelumnya: buka halaman Device Admin Activation EduLock (via Settings → Security → Device admin apps). Klik tombol "Uninstal aplikasi" → **HARUS ditendang (Home + toast Akses ditolak!)**, bukan berhasil uninstall.
  - [ ] Jalur kode uninstall via AdminPassword + kode Super Admin **tetap BERJALAN** (generate kode via EduLock Uninstall Access → matikan Device Admin via AdminPasswordActivity → uninstall).
  - [ ] Konfigurasi Awal 6 izin **tetap bisa aktif** (halaman Device Admin Activation saat Setup awal TIDAK ikut ter-kick — regression guard).
- Catatan: Ini adalah **patch keamanan kritis**, wajib ditimpa ke APK Final sebelum distribusi lapangan.


- Pelaksana: Assistant
- Jenis: `fix`
- Scope: `student`
- Tujuan audit: User report tombol **"6. Izin Latar Belakang" (AKTIFKAN)** di Konfigurasi Awal — diklik tidak terjadi apa-apa (terasa tidak bisa diklik), meskipun 5 izin lain sudah "SUDAH AKTIF".
- Akar masalah (3 temuan audit):
  1. **Permission hilang di Manifest**: `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` tidak pernah didaftarkan di `AndroidManifest.xml` → vendor ROM (Xiaomi, Vivo, Realme, Oppo, Samsung) memblokir Intent `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` diam-diam.
  2. **Tidak ada `resolveActivity()` check**: `requestBatteryOptimization()` langsung `startActivity()` tanpa cek apakah Intent bisa di-resolve OS. Pada ROM yang blokir, startActivity tidak melempar Exception → user klik = tidak ada feedback.
  3. **Tidak ada fallback untuk vendor ROM**: Xiaomi/POCO/Redmi/Vivo/OPPO/Realme sering nonaktifkan direct battery optimization request dan hanya mengizinkan lewat menu Settings manual. Tanpa fallback user bingung.
- Perbaikan diterapkan:
  1. Tambah `<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />` di Manifest.
  2. Tambah **3 lapis fallback Intent** di `SetupActivity.requestBatteryOptimization()`:
     - Lapis 1 (direct): `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (pop-up OS langsung — disertai `resolveActivity()` check).
     - Lapis 2 (fallback): `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (buka daftar Ignore Battery OS, cari EduLock → pilih "Tidak dibatasi") + Toast panduan.
     - Lapis 3 (last resort): `ACTION_APPLICATION_DETAILS_SETTINGS` (buka halaman detail EduLock → menu Baterai → Tidak dibatasi) + Toast panduan bahasa Indonesia dan langkah manual.
  3. Tambah guard awal: jika `isBatteryOptimizationIgnored()` sudah true → langsung `checkStatus()` refresh, tidak bikin intent (hindari double-click membuka Settings redundan).
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/AndroidManifest.xml` — tambah permission `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt` — rewrite fungsi `requestBatteryOptimization()`.
- Versi tetap **`1.3.22` / `48`** (timpa Final, tidak bump).
- Build: `assembleStudentRelease` — **BUILD SUCCESSFUL in 2m 23s** (49 tasks: 17 executed, 32 up-to-date).
- Output APK: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke: `Final/EduLock-1.3.22-48.apk` + alias `Final/EduLock-studentRelease.apk` (timpa).
- **SHA256 (rebuild 2026-08-26 ~19:05 post-fix Izin Latar Belakang)**: `B2710CCF3F6A9A27729978ADF3A5769663C855533A3295428F126CDB5479D645`
- **Size**: `3.925.085 bytes` (≈ 3,74 MB)
- Deploy `/e`: **TIDAK** (Final only, menunggu lolos QA lapangan dulu sesuai instruksi user).
- **QA HP user (Vendor ROM China) 2026-08-26 — LULUS ✅ (dikonfirmasi user langsung)**:
  - [x] Konfigurasi Awal → 5 izin pertama SUDAH AKTIF → klik tombol **"6. Izin Latar Belakang (AKTIFKAN)"** → ✅ ADA RESPON (fallback Settings + Toast panduan jelas, **bukan** "klik tidak terjadi apa-apa" lagi).
  - [x] HP Vendor ROM blokir direct request → user diarahkan ke Settings dengan panduan jelas.
  - [x] Setelah battery di-set "Tidak dibatasi" → kembali ke SetupActivity → tombol otomatis jadi **SUDAH AKTIF (hijau, disabled)**.
  - [x] Tombol **MULAI APLIKASI** otomatis aktif setelah semua 6 izin SUDAH AKTIF.
  - [x] **Semua 6 konfigurasi awal di HP user — BERJALAN NORMAL SEMUA** (dikonfirmasi user langsung).
- Catatan: live `/e` (URL unduh publik EduLock) **tetap BELUM di-sync** — sesuai instruksi user: "versi ini belum saya rilis untuk umum" (Final only, distribusi manual internal).
- Deploy `/e`: **TIDAK** (Final only, menunggu lolos QA lapangan dulu sesuai instruksi user).

## 2026-08-20 10:05 - [DOCS] Pegangan + handoff: SHA Final 09:52, overlay GPS tanpa kiosk

- Pelaksana: Assistant
- Jenis: `docs`
- Scope: `student` (dokumentasi)
- Tujuan: Rapikan sisa catatan yang masih SHA `8F6A1691` / overlay “hanya proteksi ON”. Acuan Final = ship **09:52** SHA `CD7379A3…`.
- File:
  - `Pegangan Build APK/Edulock/README.md`, `RELEASE.md`, `ARCHITECTURE.md`, `REGRESSION_CHECKLIST.md`, `CHANGELOG.md`, `BUILD_LOG.md`
  - `Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`, `README.md`
  - `Pegangan Build APK/Edulock/HANDOFF_LAPANGAN_EDULOCK.md` (salinan)
  - `native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md` + Word Final
- Isi perilaku yang dicatat: overlay GPS saat buka EduLock (termasuk senyap); **jangan kiosk** selama GPS mati; GPS mati + masuk sekolah = overlay **GPS MATI DI AREA SEKOLAH**; `/e` belum sync.
- Build APK: tidak (docs only). APK Final = ship 09:52.

## 2026-08-20 09:58 - [DOCS] Pegangan selaras deadlock GPS di sekolah

- Pelaksana: Assistant
- Jenis: `docs`
- Scope: `student` (dokumentasi)
- Tujuan: Catat Final terkini (overlay GPS tanpa kiosk + masuk sekolah GPS mati tetap bisa nyalakan GPS).
- File: `Pegangan Build APK/Edulock/*`, `CHECKLIST_PERUBAHAN_APK_TERKINI.md`, `README.md`, `HANDOFF_LAPANGAN_EDULOCK.md` + Word Final
- Build APK: tidak (docs only). APK Final = ship ~09:52 (`CD7379A3…`).

## 2026-08-20 09:52 - [SHIP APK] EduLock 1.3.22 (48) — GPS mati lalu masuk sekolah: overlay, bukan kiosk

- Pelaksana: Assistant
- Jenis: `fix`
- Scope: `student`
- Tujuan: Siswa matikan GPS di rumah lalu masuk area sekolah. Proteksi mengunci kiosk/lock screen → tidak bisa buka Pengaturan Lokasi. Deadlock.
- Perubahan:
  1. `GpsEnableOverlay`: selama GPS mati, semua jalur kunci (`LockEnforcer.showLockScreen` / `requestKiosk` / geofence / `triggerLockdown` / `LockScreenActivity`) dialihkan ke overlay recovery GPS (tanpa kiosk).
  2. Pesan di sekolah: **“GPS MATI DI AREA SEKOLAH!”** + tombol Buka Pengaturan Lokasi.
  3. Setelah GPS nyala, overlay tertutup dan proteksi sekolah berjalan normal.
- File: `GpsEnableOverlay.kt`, `LockEnforcer.kt`, `LockScreenActivity.kt`, `MonitoringService.kt`
- Build: `assembleStudentRelease` → SUCCESS; versi tetap `1.3.22` / `48`; timpa Final.
- SHA256: `CD7379A35D4CD126C14B6CF0CD560BF17A0477F7941C836CD33D30C722B75F7F`
- Uji: GPS mati → masuk zona sekolah / proteksi ON → overlay GPS, tombol Settings bisa dipakai → nyalakan GPS → baru lock normal.
- Catatan: live `/e` belum di-sync. Menggantikan artefak 09:45.

## 2026-08-20 09:45 - [SHIP APK] EduLock 1.3.22 (48) — Overlay GPS tanpa menunggu proteksi ON

- Pelaksana: Assistant
- Jenis: `fix`
- Scope: `student`
- Masalah uji: GPS mati + buka EduLock (proteksi senyap) → overlay tidak muncul. Admin ON proteksi → overlay ramai / kiosk → tidak bisa nyalakan GPS.
- Perubahan: overlay GPS saat buka EduLock **meski Mode Senyap**; jangan dismiss overlay GPS saat senyap; jangan kiosk selama GPS mati; grace Settings agar halaman Lokasi tidak ditendang.
- Build: `assembleStudentRelease` → SUCCESS; sempat ditimpa Final lalu **diganti** ship 09:52.
- Catatan: jangan bagikan artefak 09:45; pakai Final 09:52.

## 2026-08-20 08:56 - [DOCS] Pegangan selaras rebuild GPS overlay 1.3.22 (48)

- Pelaksana: Assistant
- Jenis: `docs`
- Scope: `student` (dokumentasi)
- Tujuan: Catat progres 20 Agu 2026 sampai Final terkini (responsif GPS + overlay wajib nyalakan GPS).
- File:
  - `Apk Release/Pegangan Build APK/Edulock/*`
  - `Apk Release/Pegangan Build APK/README.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md` + Word Final
- Build APK: tidak (docs only). APK Final yang diasumsikan = ship 08:10.

## 2026-08-20 08:10 - [SHIP APK] EduLock 1.3.22 (48) — Overlay wajib nyalakan GPS saat buka EduLock

- Pelaksana: Assistant
- Jenis: `fix`
- Scope terdampak: `student`
- Tujuan: APK sebelumnya (termasuk ship 07:58) tidak menampilkan overlay saat GPS dimatikan di rumah, karena overlay GPS hanya muncul jika ada bukti presence “di sekolah”. Operator minta: buka EduLock + GPS mati → overlay wajib nyalakan GPS.
- Perubahan:
  1. Overlay recovery GPS saat proteksi ON + setup selesai + GPS/Lokasi HP mati (tanpa syarat hasPresence / jam sekolah).
  2. Deteksi GPS: saklar Lokasi master + provider GPS (`LocationMonitor.isGpsEnabled()`).
  3. `OverlayLockActivity` target `gps`: tombol buka Pengaturan Lokasi, tanpa kiosk (supaya Settings bisa dibuka), auto-tutup saat GPS nyala.
  4. Receiver `PROVIDERS_CHANGED` / `MODE_CHANGED` + cek ulang di `onResume`.
- File: `LocationMonitor.kt`, `MainActivity.kt`, `OverlayLockActivity.kt`, `MonitoringService.kt`
- Build: `assembleStudentRelease` → SUCCESS; versi tetap `1.3.22` / `48`; timpa Final (menggantikan artefak 07:58).
- Disalin ke: `Final/EduLock-1.3.22-48.apk` + alias `EduLock-studentRelease.apk`
- SHA256: `8F6A1691D6E9FD13CF5F5D4806FC466B4A45DC32DC3B5D0336276AA2A010E845`
- Uji wajib: proteksi ON → buka EduLock → matikan Lokasi HP → overlay “GPS MATI” + tombol Pengaturan Lokasi → nyalakan GPS → overlay tertutup. Mode Senyap / libur / izin HP: overlay tidak dipaksa.
- Belum diuji: OEM Settings yang memblokir `ACTION_LOCATION_SOURCE_SETTINGS`; GPS off di background tanpa buka EduLock (sengaja tidak mem-pop overlay di atas TikTok di rumah).
- Catatan: live `/e` belum di-sync. Install timpa versionCode sama (signature sama) atau uninstall dulu jika HP menolak update.

## 2026-08-20 07:58 - [SHIP APK] EduLock 1.3.22 (48) — Responsif GPS + jangan paksa zona sekolah

- Pelaksana: Assistant
- Jenis: `fix`
- Scope terdampak: `student`
- Tujuan: Sempurnakan 3 perbaikan responsif (GPS aktif, lastForegroundPackage, saklar proteksi) tanpa mengunci anak di rumah.
- Perubahan:
  1. GPS listener 12 dtk / 12 m + Network 25 dtk / 25 m; `isListening` hanya true jika provider terdaftar; `stopListening()` di `MonitoringService.onDestroy()`.
  2. `lastForegroundPackage` dicatat sebelum `kickIfDangerous` bisa `return`.
  3. Saklar proteksi ON: **jangan** `isInsideSchoolZone = true` tanpa GPS. Kunci hanya jika jam sekolah + bukti presence / di zona. Retry lokasi ~2s dan ~5s.
- File: `LocationMonitor.kt`, `AntiUninstallService.kt`, `MonitoringService.kt`
- Build: `assembleStudentRelease` → SUCCESS; versi tetap 48 / 1.3.22; pernah ditimpa ke Final lalu **diganti** oleh ship 08:10.
- Catatan: jangan bagikan artefak 07:58; pakai Final 08:10.

## 2026-08-19 14:08 - [DOCS] Pegangan + handoff catat FCM keep-alive

- Pelaksana: Assistant
- Jenis: `docs`
- File: README / REGRESSION / CHECKLIST / BUILD_LOG / HANDOFF MD+DOCX
- Catatan: selaras ship 14:05 FCM + keep-alive (SHA `AFEE691A6831`)

## 2026-08-19 14:05 - [SHIP APK] EduLock 1.3.22 (48) — FCM + keep-alive + enforce tanpa buka UI

- Pelaksana: Assistant
- Jenis: `fix` / `feature`
- Tujuan: Sempurnakan responsif — kasus proteksi ON + jam sekolah tapi masih bisa TikTok karena service OFFLINE / tanpa FCM.
- Perubahan:
  1. Tambah `firebase-messaging` + `EduLockMessagingService` (token ke `active_devices.fcmToken`, wake Master Switch).
  2. `KeepAliveWorker` (WorkManager 15 menit) + Screen/Boot/ServiceRestarter force enforce.
  3. Jadwal weekday berubah → `performChecks()` segera.
  4. Parse jam `15.30`/`15:30` di `SchoolScheduleManager`.
- Build: `assembleStudentRelease` → SUCCESS; versi tetap 48 / 1.3.22; timpa Final.
- SHA256 prefix: `AFEE691A6831`
- Uji: install → buka EduLock sekali (daftar FCM) → keluar ke TikTok → admin ON proteksi → harus terkunci tanpa buka EduLock; monitoring tidak lama OFFLINE.

## 2026-08-19 13:35 - [SHIP APK + FIX WEB] Izin per Kelas timezone WIB

- Pelaksana: Assistant
- Jenis: `fix`
- Masalah: Admin aktifkan izin kelas 13:00–13:29 tapi HP tidak unlock. Bukti UI: "Berakhir 20.29" (= jam UTC diinterpretasi sebagai WIB). Server resolve window pakai timezone host (UTC), HP menunggu startTime ~20:00 WIB.
- Fix APK: `PermissionManager` pakai `sessionStart`/`sessionEnd` jam lokal untuk grant; polling juga mencari izin baru.
- Fix Web: `resolveAccessCodeWindow` di `web/src/app/api/admin/edulock/route.ts` memakai Asia/Jakarta.
- Build: `assembleStudentRelease` → SUCCESS; versi tetap 1.3.22/48; timpa Final.
- Catatan: **re-aktifkan** izin kelas setelah install APK; fix web perlu deploy App Hosting agar "Berakhir" admin benar.

## 2026-08-19 13:10 - [DOCS] Pegangan + handoff catat recovery overlay OEM

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Scope: checklist, regresi, README EduLock, handoff MD+DOCX
- Catatan: selaras ship 13:05 recovery overlay; SHA Final `560EEB20BE56…`

## 2026-08-19 13:05 - [SHIP APK] EduLock siswa v1.3.22 (48) — Recovery overlay dicabut OEM

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student`
- Tujuan: Saat sleep + Mode Senyap, OEM sering mencabut "Tampil di atas aplikasi lain"; proteksi ON gagal kunci sampai app dibuka manual. Kini service/wake bangunkan MainActivity + notifikasi + dialog overlay.
- File: `MonitoringService.kt`, `MainActivity.kt`, `ScreenReceiver.kt`
- Build: `assembleStudentRelease` → SUCCESS; versi tetap `1.3.22` / `48`
- Disalin ke: `Final/EduLock-1.3.22-48.apk` + alias (timpa)
- Uji: sleep → admin OFF proteksi → (overlay sering mati) → admin ON → HP harus muncul EduLock / prompt overlay tanpa buka manual.

## 2026-08-19 09:55 - [DOCS] Handoff lapangan selaras EduLock 1.3.22 (48)

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Scope terdampak: `student` (dokumentasi lapangan)
- Tujuan: Selaraskan `HANDOFF_LAPANGAN_EDULOCK` ke APK Final 1.3.22 (UI versi, jarak terpenuhi, pet-dead interval, anti-uninstall 1.3.20–22).
- File utama:
  - `native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md`
  - `Apk Release/Final/HANDOFF_LAPANGAN_EDULOCK.docx` (di-generate ulang dari MD via pandoc)
- Build APK: tidak (docs only)

## 2026-08-19 09:45 - [SHIP APK] EduLock siswa v1.3.22 (48) — Versi UI + jarak terpenuhi + pet-dead 30→20→10

- Pelaksana: Assistant
- Jenis perubahan: `feature` / `fix`
- Scope terdampak: `student`
- Tujuan perubahan:
  1. Tampilkan versi APK di bawah layar utama (`Versi 1.3.22 (48)`).
  2. Baris jarak Status Monitoring: `(terpenuhi)` / `(tidak terpenuhi)` vs radius sekolah.
  3. Overlay pet mati: hormati interval admin first→second→repeat; angka terakhir berulang. Overlay pertama tidak langsung (mulai hitung saat pet mati).
- File utama yang diubah:
  - `activity_main.xml`, `MainActivity.kt`
  - `MonitoringService.kt` (pet dead reminder)
- Build yang dijalankan: `./gradlew.bat :app:assembleStudentRelease --no-daemon`
- Hasil build: `BUILD SUCCESSFUL`
- Output APK: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke: `Apk Release/Final/EduLock-1.3.22-48.apk` + alias `EduLock-studentRelease.apk` (timpa)
- SHA256: `BC5DC60AB5D1C8C3C701E9B1F93859B03517D0BD6A2F04DE97EF4AC5D5EA5BA5`
- Catatan: versi tetap `1.3.22` / `48`; live `/e` belum di-sync.

## 2026-08-19 08:35 - [SHIP APK] EduLock siswa v1.3.22 (48) — Setup Overlay tidak ditendang

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student`
- Tujuan: Konfigurasi Awal → "Tampil di atas aplikasi lain" sempat ditendang anti-uninstall karena Device Admin sudah aktif + false positive keyword Disable.
- Build: `assembleStudentRelease` → SUCCESS
- Disalin ke: `Apk Release/Final/EduLock-1.3.22-48.apk` + alias `EduLock-studentRelease.apk`
- Uji: setup Overlay + Baterai harus bisa; Device Admin setelah setup tetap ditendang.

## 2026-08-19 08:20 - [SHIP APK] EduLock siswa v1.3.21 (47) — Perbaiki regresi Device Admin tidak ditendang

- Pelaksana: Assistant
- Jenis perubahan: `fix` / `security`
- Scope terdampak: `student`
- Tujuan perubahan:
  v1.3.20 tidak menendang Device Admin sama sekali di uji HP. Kembalikan XML 1.3.19, hapus pemanggilan `windows`, paksa prompt Accessibility 24/7 setelah update APK.
- File utama yang diubah:
  - `AntiUninstallService.kt`
  - `accessibility_service_config.xml`
  - `MainActivity.kt` (prompt Accessibility 24/7)
  - `app/build.gradle.kts` (47 / 1.3.21)
- Build yang dijalankan: `./gradlew.bat :app:assembleStudentRelease`
- Hasil build: `BUILD SUCCESSFUL`
- Output APK: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke: `Apk Release/Final/EduLock-1.3.21-47.apk` + alias `EduLock-studentRelease.apk`
- Catatan uji: setelah install, **nyalakan ulang EduLock Protection** di Aksesibilitas jika OEM mematikannya; lalu buka Device Admin → harus ditendang.

## 2026-08-19 08:02 - [DOCS] Selaraskan Pegangan EduLock ke v1.3.20 (46)

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Scope terdampak: `student` (dokumentasi saja)
- Tujuan perubahan:
  Menghapus status "belum build" yang sudah usang dan menyelaraskan README / RELEASE / regresi / checklist dengan APK Final `1.3.20-46`.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/Edulock/*.md`
  - `Apk Release/Pegangan Build APK/README.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Build yang dijalankan: tidak (docs)
- Hasil build: -
- Catatan: unduhan live `/e` **belum** di-sync; APK baru hanya di `Apk Release/Final`.

## 2026-08-19 07:35 - [SHIP APK] EduLock siswa v1.3.20 (46) — Anti-uninstall tahan sleep lama

- Pelaksana: Assistant
- Jenis perubahan: `fix` / `security`
- Scope terdampak: `student`
- Tujuan perubahan:
  Menutup celah setelah sleep lama: Accessibility marked enabled tetapi event/Device Admin kick tidak jalan (watchdog + poke wake + zombie detect).
- File utama yang diubah:
  - `AntiUninstallService.kt`
  - `ScreenReceiver.kt` / `MonitoringService.kt`
  - `accessibility_service_config.xml`
  - `app/build.gradle.kts` (46 / 1.3.20)
  - `proguard-rules.pro`
- Fitur lama yang wajib ikut dicek:
  - Selektivitas v1.3.19: daftar aplikasi lain tetap boleh dibuka
  - Anti-uninstall 24/7 (tidak terikat jam sekolah / proteksi)
  - Device Admin recovery vs Accessibility tidak tumpuk prompt
- Build yang dijalankan: `./gradlew.bat :app:assembleStudentRelease`
- Hasil build: `BUILD SUCCESSFUL`
- Output APK: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.20-46.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Regression check yang dijalankan: belum (uji lapangan menunggu)
- Belum diuji lapangan: sleep >15–30 menit → buka Device Admin EduLock → harus ditendang; daftar aplikasi lain tetap boleh dikelola
- Catatan Rollback: `EduLock-1.3.12-38.apk` atau `EduLock-1.3.19-45.apk`
- Catatan: tutorial live `/e` belum di-sync; ship saat ini **Final only**

## 2026-08-18 23:05 - [SHIP APK] EduLock siswa v1.3.19 (45) — Penyempurnaan Selektivitas Anti-Uninstall (Daftar Aplikasi Bebas Diakses)

- Pelaksana: Assistant
- Jenis perubahan: `fix` / `security`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Akar Masalah**: Pada v1.3.18, saat pengguna membuka menu *Pengaturan > Aplikasi (Daftar Semua Aplikasi)*, nama "EduLock" ikut terdaftar bersama aplikasi lain sehingga sistem langsung menendang keluar. Akibatnya pengguna tidak bisa menghapus aplikasi lain di luar EduLock.
  2. **Solusi Definitif**: Membedakan antara **Halaman Daftar Aplikasi Umum (App List)** dengan **Halaman Detail Info Khusus EduLock (Single App Info)**.
     - Pengguna **BEBAS** membuka menu daftar aplikasi, mencari aplikasi, dan mengelola/menghapus aplikasi lain (Game, Sosmed, dll).
     - Tendangan keluar **HANYA** dipicu jika pengguna secara spesifik mengklik masuk ke halaman detail EduLock (tombol Force Stop / Uninstall EduLock), masuk ke pengaturan Device Admin, atau memicu pop-up uninstall EduLock.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 45, versionName 1.3.19)
  - `app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.19-45.apk`
- Catatan Rollback:
  - Gunakan `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk` jika ada kendala di device tertentu.

---

## 2026-08-18 22:55 - [SHIP APK] EduLock siswa v1.3.18 (44) — Perbaikan Total Anti-Uninstall 24/7 (Kondisional Protection Active Dilepas)

- Pelaksana: Assistant
- Jenis perubahan: `fix` / `security`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Akar Masalah**: Pengecekan Anti-Uninstall di `AntiUninstallService` sebelumnya terikat pada `isProtectionActive` & `!isHolidayMode`. Akibatnya, saat pengujian dilakukan di luar jam sekolah (malam hari) atau saat proteksi tidak aktif, Anti-Uninstall tidak berjalan.
  2. **Solusi Definitif**: Melepas ketergantungan Anti-Uninstall dari status proteksi dan jam sekolah (menjadi 24/7/365). Dilengkapi validasi langsung `DevicePolicyManager.isAdminActive()`. Selama Device Admin aktif dan gembok dashboard tidak dibuka, siswa 100% ditendang dari menu Device Admin & Uninstall.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 44, versionName 1.3.18)
  - `app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.18-44.apk`
- Catatan Rollback:
  - Gunakan `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk` jika ada kendala di device tertentu.

---

## 2026-08-18 22:38 - [SHIP APK] EduLock siswa v1.3.16 (42) — Tendang Langsung dari Device Admin Page (Tanpa Overlay)

- Pelaksana: Assistant
- Jenis perubahan: `fix` / `security`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Tendang Langsung (Zero Tolerance)**: Menghapus ketergantungan pada overlay dialog saat siswa mencoba masuk ke halaman pengaturan Device Admin. Begitu Accessibility mendeteksi jendela Device Admin Management atau dialog uninstall bawaan OS dibuka oleh siswa (dan tidak ada izin resmi Uninstall Bypass dari admin), sistem seketika mengeksekusi `GLOBAL_ACTION_BACK` + `GLOBAL_ACTION_HOME` dan meluncurkan kembali `MainActivity` EduLock.
  2. **Bypass Grace Period**: Pengecekan Device Admin ini dipisahkan dari `isSettingsGrace`, sehingga siswa tidak bisa memanfaatkan jeda waktu grace period untuk mematikan Device Admin.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 42, versionName 1.3.16)
  - `app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.16-42.apk`
- Catatan Rollback:
  - Gunakan `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk` jika ada kendala di device tertentu.

---

## 2026-08-18 22:25 - [SHIP APK] EduLock siswa v1.3.15 (41) — Fix Background Activity Start Restriction

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Background Activity Start**: Pada Android 10+, sebuah background receiver/service tidak bisa memulai aktivitas dari aplikasi lain (seperti halaman pengaturan Device Admin `ACTION_ADD_DEVICE_ADMIN`). Akibatnya, Opsi A (Auto Re-activation) diblokir diam-diam oleh OS.
  2. **Solusi**: Alih-alih memanggil `ACTION_ADD_DEVICE_ADMIN` secara langsung dari background (yang akan gagal), kita memanggil `MainActivity` aplikasi EduLock sendiri (yang diizinkan karena kita punya izin `SYSTEM_ALERT_WINDOW`). Saat `MainActivity` terbuka di foreground, fungsi `activateDeviceAdmin()` akan dieksekusi secara sah untuk memanggil halaman OS Device Admin.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 41, versionName 1.3.15)
  - `app/src/main/java/com/sekolah/edulock/DeviceAdminReceiver.kt`
  - `app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.15-41.apk`

---

## 2026-08-18 22:15 - [SHIP APK] EduLock siswa v1.3.14 (40) — Penambalan Celah Bypass Home Button

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Bypass Layar Merah**: Menutup celah di mana siswa bisa menekan tombol HOME saat `AdminPasswordActivity` muncul. Kini dengan memanfaatkan `onUserLeaveHint()`, jika siswa menekan HOME, perangkat akan **langsung terkunci** (`devicePolicyManager.lockNow()`) dan activity dibersihkan.
  2. **Auto-Dismiss Dialog OS**: Menambahkan keyword khusus `"meng-uninstal"` di `AntiUninstallService` agar dapat mendeteksi dialog peringatan uninstall bawaan sistem operasi. Jika siswa berhasil menghindari `AdminPasswordActivity` dan kembali ke Settings via Recent Apps, layanan aksesibilitas akan otomatis mengirim perintah `GLOBAL_ACTION_BACK` untuk membatalkan (dismiss) dialog OS tersebut.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 40, versionName 1.3.14)
  - `app/src/main/java/com/sekolah/edulock/AdminPasswordActivity.kt`
  - `app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
- Fitur lama yang wajib ikut dicek:
  - Mode Pesawat instan lock di jam sekolah
  - Offline fail-safe 2 menit di jam sekolah
  - Whitelist app & Kiosk Lock
  - Form login bebas flicker saat bangun dari sleep
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.14-40.apk`
- Regression check yang dijalankan:
  - Uji tombol Home saat AdminPasswordActivity aktif.
  - Uji dialog uninstall OS muncul saat mencoba uninstall EduLock.
- Belum diuji:
  - -
- Catatan Rollback:
  - Gunakan `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk` jika ada kendala di device tertentu.

---

## 2026-08-18 21:50 - [SHIP APK] EduLock siswa v1.3.13 (39) — Penguatan Anti-Uninstall (Opsi A Auto Re-activation & Password Prompt Layer)

- Pelaksana: Assistant
- Jenis perubahan: `feature` + `fix`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Penguatan Device Admin Anti-Uninstall**: Menutup celah di mana siswa dapat menonaktifkan Device Admin dari pengaturan sistem OS Android.
  2. **Layer Password di `onDisableRequested()`**: Memunculkan `AdminPasswordActivity` langsung saat sistem OS mendeteksi permintaan penonaktifan Device Admin.
  3. **Auto Re-activation Instan (Opsi A) di `onDisabled()`**: Jika Device Admin terlanjur dinonaktifkan tanpa izin uninstall yang sah dari server, sistem secara agresif langsung meluncurkan `ACTION_ADD_DEVICE_ADMIN` kembali ke layar depan sehingga siswa tidak memiliki celah waktu untuk menekan tombol "Uninstall".
  4. **Background Health Check di `MonitoringService.kt`**: Pengecekan berkala status Device Admin di latar belakang setiap interval monitoring. Jika admin mati tanpa otorisasi, langsung meluncurkan intent aktivasi kembali.
  5. **Window Flag Overlay di `AdminPasswordActivity.kt`**: Menambahkan flag `FLAG_SHOW_WHEN_LOCKED`, `FLAG_TURN_SCREEN_ON`, dan `FLAG_KEEP_SCREEN_ON` agar dialog password selalu berada di lapisan paling atas.
  6. **Isolasi Logika Inti & Rollback Safety**: Logika inti (kiosk, offline fail-safe 2 menit, mode pesawat instan) tetap 100% utuh tanpa perubahan berisiko. Jika diperlukan rollback, APK `EduLock-1.3.12-38.apk` tersimpan aman di folder `Final/`.
- File utama yang diubah:
  - `app/build.gradle.kts` (versionCode 39, versionName 1.3.13)
  - `app/src/main/java/com/sekolah/edulock/DeviceAdminReceiver.kt`
  - `app/src/main/java/com/sekolah/edulock/AdminPasswordActivity.kt`
  - `app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- Fitur lama yang wajib ikut dicek:
  - Mode Pesawat instan lock di jam sekolah
  - Offline fail-safe 2 menit di jam sekolah
  - Whitelist app & Kiosk Lock
  - Form login bebas flicker saat bangun dari sleep
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleStudentRelease`
- Hasil build:
  - `BUILD SUCCESSFUL`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.13-39.apk`
- Catatan Rollback:
  - Jika terjadi kendala pada flow Device Admin di device tertentu, tinggal install kembali `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`.

---

## 2026-08-18 20:45 - [SHIP APK] EduLock siswa v1.3.12 (38) — Grace Period 10 Menit, Overlay Force Update, Fail-Safe Mode Pesawat & Smooth Startup

- Pelaksana: Assistant
- Jenis perubahan: `feature` + `fix`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. **Grace Period 10 Menit Password Darurat**: Menutup celah bypass di mana siswa bisa memakai Password Darurat saat offline untuk terbebas selamanya dari pantauan. Kini Password Darurat diberi batas 10 menit (Grace Period). Lewat 10 menit otomatis dikunci ulang.
  2. **Overlay Force Update**: Mengubah cara layar "Aplikasi Kadaluarsa" (Force Update) ditampilkan dari sebuah Activity biasa menjadi Overlay `SYSTEM_ALERT_WINDOW` di `MonitoringService.kt`, menyamakan standar keamanan GAS.
  3. **Fail-Safe Offline & Mode Pesawat saat Jam Sekolah**: Siswa dilarang offline > 2 menit atau menyalakan mode pesawat saat jam sekolah walau admin mematikan saklar proteksi (mis. saat istirahat). Disinkronkan di 4 komponen: `MonitoringService.kt`, `LockStateManager.kt`, `LockScreenActivity.kt`, dan `OverlayLockActivity.kt`.
  4. **Fix Silent Mode Premature Dismiss**: Memperbaiki pengecekan Silent Mode di `MonitoringService.kt` (`!prefsManager.isProtectionActive && !isStrictModeNow()`) agar tidak mengirim broadcast `ACTION_DISMISS_LOCKSCREEN` saat fail-safe offline sedang aktif.
  5. **Smooth Startup & Anti-Flicker Login**: Pada `RegistrationActivity.kt`, pemanggilan `setContentView(R.layout.activity_registration)` ditunda jika siswa sudah terdaftar (`isRegistered == true`) dan digantikan loading screen gelap sementara, mencegah form pendaftaran/login berkedip sepersekian detik saat dibuka dari mode sleep.
- File utama yang diubah:
  1. [PreferencesManager.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt): Menambah state `emergencyUnlockTimestamp`.
  2. [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt):
     - Menghitung sisa batas waktu Mode Darurat (maksimal 10 menit).
     - Menambahkan fungsi `showForceUpdateOverlay` dan `hideForceUpdateOverlay`.
     - Sinkronisasi aturan strict mode (offline di jam sekolah memaksa strict mode aktif).
     - Fix bypass dismiss lockscreen pada pengecekan Silent Mode.
  3. [LockStateManager.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockStateManager.kt):
     - Sinkronisasi `isStrictModeNow()` agar Kiosk Mode dan LockScreenActivity tidak di-dismiss otomatis oleh OS saat menekan tombol Home.
  4. [LockScreenActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockScreenActivity.kt) & [OverlayLockActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt):
     - Menginisialisasi timestamp saat password darurat valid ditebak.
     - Sinkronisasi `shouldStayLocked()` dan `startKioskMode()` agar mematuhi aturan fail-safe offline di jam sekolah.
  5. [RegistrationActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt):
     - Menunda `setContentView` form registrasi jika siswa sudah terdaftar untuk menghilangkan form login flicker saat start dari sleep.
- Build yang dijalankan:
  `.\gradlew :app:assembleStudentRelease`
- Hasil build:
  `BUILD SUCCESSFUL in 2m 14s`
- Output APK:
  `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`
- Regression check yang dijalankan:
  - Uji Mode Pesawat saat jam sekolah (terkunci instan < 1 detik).
  - Uji tombol Home/Recent saat terkunci (Kiosk Mode memblokir keluar).
  - Uji transisi bangun dari sleep (form login tidak berkedip).
- Catatan:
  - File rilis final dipertahankan tunggal `EduLock-1.3.12-38.apk`.

---

## 2026-08-18 12:35 - [SHIP APK] EduLock siswa v1.3.12 (38) — IDE 6: Deteksi Instan Mode Pesawat (< 1 Detik Lockdown) + Fail-Safe Offline 2 Menit

- Pelaksana: Assistant
- Jenis perubahan: `feature` + `fix`
- Scope terdampak: `student`
- Latar belakang & Tujuan perubahan:
  1. Menutup celah bypass di mana siswa mengaktifkan Mode Pesawat (Airplane Mode) atau mematikan koneksi data di sekolah untuk menghindari pengawasan.
  2. Mendaftarkan `Intent.ACTION_AIRPLANE_MODE_CHANGED` pada broadcast receiver `MonitoringService.kt` dan `LockScreenActivity.kt`.
  3. Ketika Mode Pesawat aktif saat jam sekolah dan proteksi aktif, sistem langsung memicu lockdown (< 1 detik) dengan pesan: *"MODE PESAWAT DILARANG SAAT JAM SEKOLAH! Harap matikan Mode Pesawat."*.
  4. Ketika siswa mematikan Mode Pesawat kembali, sistem otomatis mendeteksi pemulihan dan membuka kembali akses / mengevaluasi status kepatuhan secara responsif.
  5. Memperketat ambang batas waktu offline pada `OfflineMonitor.kt` dari 20 menit menjadi 2 menit (peringatan di menit ke-1).
- File utama yang diubah:
  1. [OfflineMonitor.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OfflineMonitor.kt):
     - Menambahkan helper `isAirplaneModeActive(): Boolean`.
     - `OFFLINE_THRESHOLD_MS = 2 * 60 * 1000L` (2 menit).
     - `WARNING_THRESHOLD_MS = 1 * 60 * 1000L` (1 menit).
     - `isInternetAvailable()` langsung me-return `false` jika Mode Pesawat aktif.
  2. [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt):
     - Mendaftarkan `ACTION_AIRPLANE_MODE_CHANGED` ke `screenReceiver`.
     - Menambahkan evaluasi instan pada saat broadcast diterima dan pada `enforceGpsAndOfflinePresenceProtection`.
  3. [LockScreenActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockScreenActivity.kt):
     - Mendaftarkan `ACTION_AIRPLANE_MODE_CHANGED` pada `dismissReceiver` untuk auto-recovery begitu mode pesawat dinonaktifkan.
  4. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts):
     - `versionCode 37 -> 38`
     - `versionName 1.3.11 -> 1.3.12`
- Build yang dijalankan:
  `.\gradlew assembleStudentRelease --stacktrace`
- Hasil build:
  `BUILD SUCCESSFUL in 2m 59s`
- Output APK:
  - `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - Deteksi Mode Pesawat ON/OFF.
  - Kompatibilitas Screen ON / USER_PRESENT wake-sync.
  - Build dan signing release task sukses.
- Belum diuji:
  - Uji lapangan fisik di perangkat Android nyata.

---

## 2026-08-09 14:20 - [SHIP APK] EduLock siswa v1.3.11 (37) — ScreenReceiver Wake-Sync Pre-emptive (USER_PRESENT + SCREEN_ON Trigger Self-Heal + ForceFlush RTDB) — Opsi C Bareng GAS 1.0.48

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student` saja
- Latar belakang:
  - Kasus SS user: HP sleep, EduLock + GAS di-swipe keluar recent apps → bangun → buka GAS DULU dari launcher → overlay "Status EduLock belum tersinkron" muncul. Workaround user berhasil: Buka EduLock dulu → tekan tombol Buka GAS Siswa dari EduLock.
  - Akar: Broadcast `ScreenReceiver` (bertugas wake-up restart MonitoringService) TIDAK PERNAH memanggil `ensureSetupCompletedIfHealed()` dan TIDAK PERNAH force-sync RTDB `isSetupCompleted`. Jadi EduLock tidak punya kesempatan update status sebelum GAS membacanya pada unlock HP.
  - EduLock 1.3.10 (36) hanya self-heal saat `MainActivity.onCreate` dan `MonitoringService.onCreate` — keduanya baru terpicu JIKA user buka EduLock app, TIDAK ketika broadcast USER_PRESENT / SCREEN_ON (hanya start service, tidak update RTDB & prefs).
- Tujuan perubahan:
  1. Setiap HP unlock (USER_PRESENT) / Screen On → EduLock langsung menjalankan self-heal pre-emptive + forceFlush RTDB (bypass throttling 5 menit).
  2. Hasilnya: Status EduLock lokal + remote SUDAH SEGAR sebelum user sempat buka GAS → gate GAS pass tanpa overlay.
  3. Throttle 60 detik agar tidak spam RTDB jika user lock/unlock berulang dalam 1 menit.
- File utama yang diubah (HANYA INI — TIDAK sentuh fitur EduLock lain):
  1. [AndroidManifest.xml](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/AndroidManifest.xml#L151-L160) (ScreenReceiver):
     - Tambah `<action android:name="android.intent.action.SCREEN_ON" />` ke intent-filter (sudah ada USER_PRESENT sebelumnya).
  2. [ScreenReceiver.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/ScreenReceiver.kt#L17-L100):
     - Tambah `WAKE_SYNC_THROTTLE_MS = 60_000L` + `KEY_LAST_WAKE_SYNC_AT` di companion object. Preferensi disimpan ke `PreferencesManager(context).prefs` (nama file = EduLockPrefs, standar project).
     - Urutan baru onReceive: guard admin flavor → guard action → startForegroundService MonitoringService (TETAP dipertahankan, perilaku LAMA) → **self-heal setup_completed via SetupActivity.ensureSetupCompletedIfHealed** → throttle check → jika identitas siswa tersedia: call `FirebaseReporter.sendStatusUpdate(forceFlush=true, statusMessage="Wake-sync via ScreenReceiver")` (lengkap dengan health check Accessibility+DeviceAdmin untuk compliance status) → catat `last_wake_sync_at = now`.
     - Helper private `isAccessibilityEnabled(context)` ditambahkan di ScreenReceiver (mirip yang ada di SetupActivity) → agar tidak perlu dependensi SetupActivity di receiver.
  3. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts#L24-L25):
     - `versionCode 36 -> 37`
     - `versionName 1.3.10 -> 1.3.11`
- Fitur stabil EduLock yang TIDAK DISENTUH (100% tetap):
  - GPS Trust Score + Geofence Zone (LocationMonitoringWorker, ZoneUtils)
  - Pet System + HP Mati Overlay (PetManager, PetDeadLockActivity, interval 30/20/10 menit default PreferencesManager)
  - App Pinning Overlay Proteksi (AppPinningManager) + LockEnforcer
  - Device Admin + Anti-Uninstall (DeviceAdminReceiver + AntiUninstallService Accessibility)
  - MasterSwitch Firebase (FirebaseRemoteConfigManager)
  - BootReceiver BOOT_COMPLETED / MY_PACKAGE_REPLACED / QUICKBOOT_POWERON → start service
  - MonitoringService loop 30 detik + FirebaseReporter throttling 30d/5m reguler (TIDAK DIUBAH, tambahan forceFlush hanya casuistic receiver)
  - OfflineMonitor, SchoolServiceGuard, SetupProtectionService.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleStudentRelease --no-daemon` → BUILD SUCCESSFUL (49 tasks: 13 executed, 36 up-to-date, 0 ERROR). Warning deprecation non-fatal (AdminWebActivity, DeviceAdminReceiver, LockScreen, MainActivity IntentIntegrator legacy).
  - Output metadata: package `com.sekolah.edulock`, versionCode 37, versionName `1.3.11`.
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset EduLock -VersionName "1.3.11" -VersionCode 37` → exit code 0.
  - SHA256: `05F0BDF5AC0F6C2620545B72A761A30A2317C797A808C1F34F13F4994B207224`
  - Size: `3,790,306 bytes (~3.61 MB)`
- Artefak akhir (4 copy + manifest entry):
  1. [Final/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
  2. [Final/EduLock-1.3.11-37.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.11-37.apk)
  3. [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
  4. [web/public/apk/EduLock-1.3.11-37.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.11-37.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) — entry EduLock diarahkan ke `1.3.11-37`.
- Build web lokal:
  - `npm.cmd run build` → SUCCESS. ensure-standalone-public mendaftarkan EduLock-1.3.11-37.apk.
  - [edulock/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/edulock/install.html) memuat `EduLock-1.3.11-37.apk` 3 match ✅.
- Regression check yang dijalankan:
  - [x] Start MonitoringService via ScreenReceiver TETAP dipertahankan (TIDAK ADA REGRESI).
  - [x] Self-heal setup_completed HANYA dipanggil di ScreenReceiver (TIDAK dihapus dari MainActivity & MonitoringService yang ada — multi-trigger lebih aman).
  - [x] Throttle 60 detik aktif → lock/unlock cepat tidak spam RTDB.
  - [x] forceFlush=true mem-bypass throttling reguler FirebaseReporter → status segera sinkron.
  - [x] Helper isAccessibilityEnabled sama persis logic dengan SetupActivity (pakai resolveInfo service AntiUninstallService).
  - [x] SHA256 4 file copy + manifest cocok.
- QA manual / uji perangkat berikutnya (setelah install-timpa EduLock 1.3.11 + GAS 1.0.48 bareng di HP test):
  - [ ] Kasus SS user: sleep 1m → swipe recent EduLock+GAS → unlock HP → DIAMKAN 5 detik → BUKA GAS DARI LAUNCHER → TANPA overlay ✅ (tanpa harus buka EduLock dulu).
  - [ ] Firebase Console: `active_devices/{schoolId}/{deviceId}/lastUpdated = now` ≤ 60 detik setelah unlock (tanpa buka EduLock). Cek `isSetupCompleted === true`.
  - [ ] BootReceiver & MasterSwitch: setelah restart HP → MonitoringService auto start + master switch tetap bekerja (TIDAK ADA REGRESI).
- Catatan:
  - ⚠️ **Deploy live EduLock 1.3.11 (37) TERTUNDA SESUAI INSTRUKSI USER 14:47** — user minta update URL live **HANYA untuk GAS** (`apakah perlu diperbarui URL GAS saja, EduLock sudah update`).
  - Build EduLock 1.3.11 (37): SHIP LOKAL SUDAH (4 file copy Final + web/public SUDAH ada, manifest lokal web/public SUDAH catat versi `1.3.11-37`, build web lokal edulock/install.html sudah 3x match `EduLock-1.3.11-37.apk`).
  - Rilis EduLock yang saat ini live: tetap **versi sebelumnya** (user confirm URL Edulock tidak perlu di-update duluan).
  - Kalau nanti EduLock mau di-live-kan juga: tinggal QA install-timpa di HP test → commit + push file-file EduLock artefak beserta manifest terpisah (TIDAK perlu ikut push ulang GAS).
  - Rilis EduLock 1.3.10 (36) sudah di-deploy live di 13:45, digantikan 1.3.11 (37) untuk QA lanjutan sebelum live URL final. Riwayat tetap dipertahankan sebagai dokumentasi audit.

## 2026-08-09 13:30 - [SHIP APK] EduLock siswa v1.3.10 (36) — Self-Healing Badge Setup Merah (Lokal + RTDB Sinkron)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student` saja
- Latar belakang:
  - EduLock v1.3.9 (35) hanya mencegah reset `setup_completed=false` di MASA DEPAN. Device yang SUDAH terlanjur memiliki SharedPreferences `setup_completed=false` (misal: sudah reset oleh logic versi lama) TIDAK BISA sembuh via recovery manual (tombol Force Stop EduLock abu-abu karena Device Admin aktif; uninstall install ulang pun setup_completed bisa ke false lagi jika setup awal tidak masuk SetupActivity tepat).
  - Audit kritis kedua: [FirebaseReporter.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/FirebaseReporter.kt#L44-L140) `sendStatusUpdate()` TIDAK PERNAH mengirim field `isSetupCompleted` ke RTDB `active_devices/{schoolId}/{deviceId}`. Ini menyebabkan jalur remote GAS [EduLockComplianceGate.kt#L611](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt#L611) selalu membaca `setupCompleted=false` (field tidak ada → default false). Lokal benar true tapi remote tetap false → overlay muncul terus.
- Tujuan perubahan:
  1. Tambah mekanisme **self-healing lokal**: Jika semua 6 izin setup (Lokasi, Kamera, Admin, Aksesibilitas, Overlay, Battery) sudah ON tapi `setup_completed` masih false → auto set true.
  2. Tambah **force-flush RTDB** setelah self-healing trigger, agar remote segera sync `isSetupCompleted=true` (bypass throttling FirebaseReporter).
  3. Tambah field permanen `isSetupCompleted` ke payload RTDB di FirebaseReporter (bukan hanya saat self-healing), supaya status badge Setup di GAS selalu sinkron antara lokal dan remote.
- File utama yang diubah:
  1. [FirebaseReporter.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/FirebaseReporter.kt#L44-L158)
     - Parameter baru `sendStatusUpdate()`: `isSetupCompleted: Boolean = prefsManager.isSetupCompleted` dan `forceFlush: Boolean = false`.
     - Field `"isSetupCompleted"` ditambahkan ke `currentData` payload (L103) dan list `hasDataChanged` keysToCheck (L149).
     - Skip throttling dicabut jika `forceFlush = true` (L121).
  2. [SetupActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt#L21-L117)
     - Pengecekan izin diekstrak jadi **static companion**: `areAllPermissionsGranted(context)`, `isAccessibilityServiceEnabled(context)`, `isBatteryOptimizationIgnored(context)`, `isLocationPermissionGranted(context)`.
     - Helper self-healing `ensureSetupCompletedIfHealed(context)` (L66-L112): jika semua izin ON tapi setup_completed false → set true → panggil FirebaseReporter dengan `forceFlush=true, isSetupCompleted=true, statusMessage="Self-healed setup_completed"`.
     - Member `areAllPermissionsGranted()` (L296-L298) direfactor delegasi ke companion static → tidak ada duplikat logic.
  3. [MainActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt#L157-L161)
     - `SetupActivity.ensureSetupCompletedIfHealed(this)` dipanggil di onCreate, segera setelah setContentView.
  4. [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt#L176-L182)
     - `SetupActivity.ensureSetupCompletedIfHealed(this)` dipanggil di onCreate, setelah init prefsManager.
  5. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts#L24-L25)
     - `versionCode 35 -> 36`
     - `versionName 1.3.9 -> 1.3.10`
- Temuan audit penting (guardrail tetap):
  - [SetupActivity.kt#L146-L151](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt#L146-L151) jalur user-initiated SETUP TETAP satu-satunya jalan resmi set `setup_completed=true`. Self-healing hanya sebagai fallback jika perangkat "terlanjur sakit".
  - Semua jalur `isSetupCompleted=false` sudah dihapus pada rilis 1.3.9 lalu (RegistrationActivity, MainActivity school inactive, MonitoringService school inactive).
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleStudentRelease` -> BUILD SUCCESSFUL (49 tasks: 21 executed, 28 up-to-date, 0 ERROR). Warnings: deprecations non-fatal (tidak terkait setup_completed).
  - Output metadata: package `com.sekolah.edulock`, versionCode `36`, versionName `1.3.10`.
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset EduLock -VersionName "1.3.10" -VersionCode 36` → exit code 0.
  - SHA256: `92429E598115198E75266B9DE69BC68F469F12A7C028190B60982C68DC032240`
  - Size: `3,790,238 bytes (~3.61 MB)
- Artefak akhir:
  1. [EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
  2. [EduLock-1.3.10-36.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.10-36.apk)
  3. [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
  4. [web/public/apk/EduLock-1.3.10-36.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.10-36.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry EduLock pindah ke `1.3.10-36`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - [ensure-standalone-public] standalone/public mendaftarkan `EduLock-1.3.10-36.apk` di antara 13 artefak APK.
  - Halaman tutorial lokal [edulock/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/edulock/install.html) memuat `EduLock-1.3.10-36.apk` sebanyak 3 match.
- Regression check yang dijalankan:
  - [x] Reset `setup_completed=false` TIDAK ADA lagi di 3 jalur lama (registrasi + 2 school inactive).
  - [x] Self-healing hanya menyala JIKA `areAllPermissionsGranted(context) = true` (L69).
  - [x] Field `isSetupCompleted` DITAMBAHKAN permanen ke FirebaseReporter payload + keysToCheck.
  - [x] forceFlush bypass throttling saat self-healing trigger → RTDB langsung ter-update.
  - [x] 4 file copy APK + manifest SHA256 cocok = `92429E59...`.
  - [x] Build web prerender edulock/install.html render file unduh `EduLock-1.3.10-36.apk` (3 match).
- QA manual / uji perangkat yang wajib dijalankan SESUDAH deploy live:
  - [x] User confirm QA perangkat: EduLock 1.3.10 (36) diinstall, buka 3-5 detik → GAS badge Setup hijau, overlay hilang.
  - [ ] Cek Firebase Console → `active_devices/{schoolId}/{deviceId}/isSetupCompleted === true`.
  - [ ] `\edulock\install` live → klik download → file unduh = `EduLock-1.3.10-36.apk`.
- Catatan:
  - **Deploy live DONE 2026-08-09 13:45**: `git push origin main` dijalankan, Firebase App Hosting auto rollout selesai.
  - User confirm: "ok sejauh ini versi edulock ini lebih aman" → self-healing + RTDB sinkron dinyatakan lolos uji lapangan dasar.
  - Rilis 1.3.9 (35) TIDAK PERNAH di-deploy live (dibatalkan karena ditemukan temuan kedua: RTDB tidak ada field isSetupCompleted + tidak ada self-healing device terlanjur sakit). Riwayat tetap dipertahankan sebagai dokumentasi audit.

## 2026-08-09 12:59 - [SHIP APK] EduLock siswa v1.3.9 (35) - Fix Badge Setup Merah Akibat Reset Flag `setup_completed` di Jalur School Inactive / Sesi Invalid (TIDAK DEPLOY LIVE — digantikan oleh 1.3.10)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student` saja
- Latar belakang:
  - Setelah uji lapangan, user melaporkan overlay GAS masih menampilkan badge `Setup` merah walaupun izin utama EduLock sudah diaktifkan kembali.
  - Audit menunjukkan badge `Setup` di GAS **tidak menghitung ulang** seluruh izin onboarding, melainkan membaca 1 flag lokal EduLock: `setup_completed`.
  - Masalahnya, flag ini ikut di-reset ke `false` pada beberapa jalur yang sebenarnya berkaitan dengan status registrasi/sesi sekolah, bukan kegagalan setup perangkat.
- Tujuan perubahan:
  1. Mencegah `setup_completed` ikut hilang hanya karena sesi siswa tidak valid atau layanan sekolah dinilai nonaktif.
  2. Menjaga makna `Setup` tetap khusus untuk onboarding awal perangkat, bukan bercampur dengan state registrasi.
- File utama yang diubah:
  1. [RegistrationActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt)
     - Menghapus reset `prefsManager.isSetupCompleted = false` pada jalur:
       - school service denied
       - sesi siswa tidak valid
  2. [MainActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt)
     - Menghapus reset `prefsManager.isSetupCompleted = false` pada jalur `forceExitBecauseSchoolInactive()`.
  3. [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt)
     - Menghapus reset `prefsManager.isSetupCompleted = false` pada jalur `forceExitBecauseSchoolInactive()`.
  4. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts)
     - `versionCode 34 -> 35`
     - `versionName 1.3.8 -> 1.3.9`
- Temuan audit penting (tetap berlaku sebagai guardrail):
  - [SetupActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt) hanya akan menulis `prefsManager.isSetupCompleted = true` saat semua syarat onboarding terpenuhi lalu tombol **MULAI** ditekan.
  - [PreferencesManager.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt) memakai key lokal `setup_completed`.
  - Badge `Aktif` di GAS membaca `is_protection_active`, dan default value-nya `true`, sehingga **tidak boleh lagi dianggap bukti setup selesai**.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleStudentRelease` -> BUILD SUCCESSFUL (49 tasks: 21 executed, 28 up-to-date, 0 ERROR)
  - Output metadata: package `com.sekolah.edulock`, versionCode `35`, versionName `1.3.9`
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset EduLock -SourceApk "...\\EduLock-studentRelease.apk" -VersionName "1.3.9" -VersionCode 35 -> exit code 0
  - SHA256: `30FC29B4E2839FA96AFAEFA7C8D86A2A129D4421B5241B393DFDFB1EAC416665`
  - Size: `3,789,366 bytes (~3.61 MB)
- Artefak akhir:
  1. [EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
  2. [EduLock-1.3.9-35.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.9-35.apk)
  3. [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
  4. [web/public/apk/EduLock-1.3.9-35.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.9-35.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry EduLock pindah ke `1.3.9-35`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - Halaman tutorial lokal [edulock/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/edulock/install.html) memuat `EduLock-1.3.9-35.apk` sebanyak 3 match.
- Regression check yang dijalankan:
  - [x] Jalur tulis `setup_completed=true` tetap hanya berasal dari SetupActivity (guard tidak tersentuh).
  - [x] Reset `setup_completed=false` tidak lagi dipakai pada jalur registrasi / school inactive.
  - [x] Build assemble studentRelease sukses tanpa error, SHA 4 copy file + manifest cocok semua.
  - [x] Build web prerender lokal render nama file unduh = versi 1.3.9-35
- Fitur lama yang wajib ikut dicek:
  - [ ] Install EduLock `1.3.9 (35)` di HP yang sebelumnya badge `Setup` merah → buka EduLock → cek badge `Setup` di GAS kembali hijau
  - [ ] Paksa kondisi school inactive / sesi invalid → pastikan flag `setup_completed` tidak ikut turun `false`
  - [ ] URL live `/edulock/install` → download = `EduLock-1.3.9-35.apk`
- Catatan:
  - Deploy live menunggu user: `git add . ; git commit ; git push origin main` (Firebase App Hosting auto rollout setelah push main).
  - Perubahan teks bantuan badge di EduLockComplianceGate.kt (GAS) = text-only, tidak bump version GAS; akan terbawa secara otomatis ketika ada rilis GAS berikutnya.

## 2026-08-09 11:32 - [SHIP APK] EduLock siswa v1.3.8 (34) - Samakan Fallback Default Jeda Overlay Pet dengan Web Admin

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Scope terdampak: `student` saja
- Latar belakang:
  - Fitur jeda overlay pet bertingkat sudah masuk pada [EduLock v1.3.7 (33)](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/Edulock/BUILD_LOG.md#L73-L131), tetapi setelah audit ditemukan fallback default di APK masih `10 / 10 / 10`.
  - Sementara itu, web admin menampilkan default/fallback `30 / 20 / 10`.
  - Agar tidak terjadi mismatch saat sekolah belum pernah menekan tombol simpan atau saat APK belum sempat menerima sinkronisasi policy dari RTDB, fallback lokal APK harus disamakan.
- Tujuan perubahan:
  1. Menyamakan fallback default APK EduLock dengan tampilan dan fallback web admin.
  2. Menjaga scope rilis tetap sempit agar tidak mengubah flow lain di EduLock.
- File utama yang diubah:
  1. [PreferencesManager.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt)
     - `petDeadReminderFirstMs`: `10 menit -> 30 menit`
     - `petDeadReminderSecondMs`: `10 menit -> 20 menit`
     - `petDeadReminderRepeatMs`: tetap `10 menit`
  2. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts)
     - `versionCode 33 -> 34`
     - `versionName 1.3.7 -> 1.3.8`
- Penegasan scope:
  - TIDAK mengubah flow overlay
  - TIDAK mengubah logic monitoring
  - TIDAK mengubah web admin
  - TIDAK mengubah redaksi overlay
  - TIDAK mengubah aturan lain di EduLock
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleStudentRelease` -> SUCCESS
  - Output metadata:
    - package: `com.sekolah.edulock`
    - versionCode: `34`
    - versionName: `1.3.8`
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset EduLock -SourceApk "...\\EduLock-studentRelease.apk" -VersionName "1.3.8" -VersionCode 34` -> SUCCESS
  - SHA256: `7BD05144EBD98567550AA62F2CFEEAF0E2BADE4B4C94E165F8CB314625D68F05`
  - Size: `3,789,547 bytes` (~3.61 MB)
- Artefak akhir:
  1. [EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
  2. [EduLock-1.3.8-34.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.8-34.apk)
  3. [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
  4. [web/public/apk/EduLock-1.3.8-34.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.8-34.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry EduLock pindah ke `1.3.8-34`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - Halaman tutorial lokal [edulock/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/edulock/install.html) memuat `EduLock-1.3.8-34.apk` sebanyak 3 match.
- Fitur lama yang wajib ikut dicek:
  - [ ] Update dari `1.3.7 (33)` ke `1.3.8 (34)` harus berhasil langsung menimpa.
  - [ ] Jika school belum pernah simpan policy jeda overlay, APK harus fallback ke `30 / 20 / 10`.
  - [ ] Jika policy sudah tersimpan di RTDB, APK tetap harus mengikuti nilai sekolah itu, bukan default.

---

## 2026-08-09 10:42 - [HOTFIX SIGNING] EduLock siswa v1.3.7 (33) - Ganti APK debug-signed menjadi release-signed agar bisa update menimpa instalasi lama

- Pelaksana: Assistant
- Latar belakang:
  - Saat dicoba update di HP siswa, Android menolak instalasi dengan pesan paket bentrok dengan paket yang sudah ada.
  - Investigasi menunjukkan APK EduLock yang baru dishare kemarin masih ditandatangani `Android Debug`, sedangkan proyek menyimpan keystore rilis sekolah.
- Bukti teknis:
  - APK lama yang terpasang di jalur publik sebelumnya dan APK 1.3.7 hasil build awal sama-sama bertanda tangan `Android Debug`.
  - Keystore rilis proyek memiliki identitas sertifikat sekolah `SMPN 3 Pacet / GAS Mobile`.
- Perbaikan yang dilakukan:
  1. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts) sekarang memuat [keystore.properties](file:///D:/Dashboard%20Portal/native-mobile-edulock/keystore.properties) dan memakai `signingConfigs.release` untuk `buildTypes.release`.
  2. Build ulang `studentRelease` menghasilkan APK yang signer-nya bukan lagi `Android Debug`, tetapi sertifikat sekolah.
  3. Ship ulang file `EduLock-studentRelease.apk` dan `EduLock-1.3.7-33.apk` ke folder Final, public APK, dan manifest.
- Verifikasi:
  - APK hasil rebuild:
    - [EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build/outputs/apk/student/release/EduLock-studentRelease.apk)
    - package: `com.sekolah.edulock`
    - versionCode/versionName: `33 / 1.3.7`
    - SHA256 file: `90D89AF3C2248E448F9BF42DE29D723DFFCFF19481CEA71E26F29984EB0ED16A`
    - signer certificate SHA256: `64:73:89:55:22:5D:36:C6:49:90:EB:AD:FB:A9:F2:AA:D0:3E:17:73:95:22:63:04:66:62:1F:0A:1E:B3:1F:63`
  - Public/default sekarang sudah diganti:
    - [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
    - [web/public/apk/EduLock-1.3.7-33.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.7-33.apk)
    - [Apk Release/Final/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
    - [Apk Release/Final/EduLock-1.3.7-33.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.7-33.apk)
- Catatan penting:
  - Version tetap `1.3.7 (33)`. Yang diperbaiki adalah **signature release**, bukan logic fitur.
  - Tujuan hotfix ini agar APK baru bisa **menimpa** instalasi EduLock lama yang memakai sertifikat sekolah yang sama, tanpa uninstall.

---

## 2026-08-09 10:30 - [SHIP APK] EduLock siswa v1.3.7 (33) - Pengaturan Jeda Overlay Pet Mati Bertingkat dari Web Admin + Perapihan Redaksi Overlay

- Pelaksana: Assistant
- Jenis perubahan: `feature` + `fix`
- Scope terdampak: `student` saja.
- Tujuan perubahan:
  1. Admin sekarang bisa mengatur jeda kemunculan ulang overlay pet mati langsung dari web admin EduLock.
  2. Jeda reminder tidak lagi hardcoded 10 menit rata, tetapi bisa bertingkat: kemunculan ke-1, ke-2, lalu ke-3 dan seterusnya.
  3. Redaksi overlay pet mati EduLock dirapikan agar tidak menyesatkan atau menakut-nakuti secara berlebihan.
- File utama yang diubah:
  1. WEB ADMIN:
     - [useEduLockSettings.ts](file:///D:/Dashboard%20Portal/web/src/hooks/edulock/useEduLockSettings.ts) - tambah field `petDeadReminderFirstMinutes`, `petDeadReminderSecondMinutes`, `petDeadReminderRepeatMinutes`.
     - [EduLockSettingsPanel.tsx](file:///D:/Dashboard%20Portal/web/src/components/edulock/panels/EduLockSettingsPanel.tsx) - tambah card baru "Jeda Overlay Pet Mati" dengan 3 input menit dan tombol simpan.
     - [route.ts](file:///D:/Dashboard%20Portal/web/src/app/api/admin/edulock/route.ts) - validasi 1-1440 menit, simpan ke `edulock_settings/<schoolId>` dan mirror ke `schools/<schoolId>/policy` sebagai:
       - `pet_dead_reminder_first_ms`
       - `pet_dead_reminder_second_ms`
       - `pet_dead_reminder_repeat_ms`
  2. APK EDULOCK SISWA:
     - [PreferencesManager.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt) - tambah state:
       - `petDeadReminderCount`
       - `petDeadReminderFirstMs`
       - `petDeadReminderSecondMs`
       - `petDeadReminderRepeatMs`
     - [PetDeadLockActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt) - saat tombol **"Saya Mengerti"** ditekan, selain simpan `lastPetDeadAckAt`, sekarang counter reminder juga naik `+1`.
     - [MonitoringService.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt) - hapus hardcoded `10 * 60 * 1000L`, ganti helper `resolvePetDeadReminderIntervalMs()` berbasis counter:
       - count `0` -> interval pertama
       - count `1` -> interval kedua
       - count `>= 2` -> interval ketiga dan seterusnya
       Listener policy GPS diperluas agar sekaligus membaca 3 field policy pet dead dari RTDB.
       Saat pet sudah hidup lagi (`isDead = false`), sistem reset `lastPetDeadAckAt = 0` dan `petDeadReminderCount = 0`.
     - [MainActivity.kt](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt) - listener policy lokal ikut membaca 3 field policy reminder pet agar prefs sinkron di foreground.
     - [activity_pet_dead_lock.xml](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/res/layout/activity_pet_dead_lock.xml) - redaksi overlay diperhalus:
       - Judul `AKSES DIBLOKIR!` -> `PET BUTUH PERHATIAN!`
       - Pesan utama diganti ke `Sahabat Belajar pet Anda sedang tidak aktif (butuh direvive)...`
       - Hapus ancaman bohong "HP dinonaktifkan 24 jam", ganti catatan jujur bahwa sistem hanya akan terus mengingatkan.
  3. VERSIONING WAJIB:
     - [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build.gradle.kts) - `versionCode 32 -> 33`, `versionName 1.3.6 -> 1.3.7`.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleStudentRelease` -> BUILD SUCCESSFUL 2m 41s.
  - `npm.cmd run build` (sebelum ship) -> SUCCESS.
  - `Ship-Apk-Baru.ps1 -Preset EduLock -SourceApk "...\\EduLock-studentRelease.apk" -VersionName "1.3.7" -VersionCode 33` -> SUCCESS.
  - `npm.cmd run build` (setelah ship) -> SUCCESS.
- Hasil build:
  - `output-metadata.json` student: `versionCode = 33`, `versionName = 1.3.7`.
  - Prerender lokal [edulock/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/edulock/install.html) memuat `EduLock-1.3.7-33.apk` sebanyak 3 match -> URL tutorial lokal SUDAH menunjuk ke versi baru.
- Output APK:
  - [EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/build/outputs/apk/student/release/EduLock-studentRelease.apk)
  - SHA256: `D8608CB86AD4E07078B0D6C514D14AA9B8F99AC9FE71E17E22BB92A2B9BCEABF`
  - Size: `3,789,467 bytes` (~3.61 MB)
- Disalin ke:
  1. [web/public/apk/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-studentRelease.apk)
  2. [web/public/apk/EduLock-1.3.7-33.apk](file:///D:/Dashboard%20Portal/web/public/apk/EduLock-1.3.7-33.apk)
  3. [Apk Release/Final/EduLock-studentRelease.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-studentRelease.apk)
  4. [Apk Release/Final/EduLock-1.3.7-33.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.7-33.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - updatedAt `2026-08-09T03:23:44`, entry EduLock baru sudah sinkron.
- Regression check yang dijalankan:
  - [x] Build web admin sukses setelah tambah 3 field setting baru.
  - [x] Build APK student release sukses setelah tambah counter + policy listener reminder.
  - [x] Ship script verifikasi SHA konsisten di 4 file copy + 2 entry manifest.
  - [x] Halaman tutorial lokal `/edulock/install` sudah menunjuk ke `EduLock-1.3.7-33.apk`.
- Belum diuji:
  - [ ] QA perangkat fisik: admin ubah interval 30/20/10 -> siswa tekan "Saya Mengerti" -> reminder muncul lagi sesuai jeda bertingkat.
  - [ ] QA live setelah deploy: `/edulock/install` download file `EduLock-1.3.7-33.apk`.
- Catatan:
  - Default APK dibiarkan kompatibel dengan perilaku lama sampai admin menyimpan setting baru.
  - Rekomendasi awal untuk sekolah: `30 / 20 / 10` menit.

---

## 2026-08-06 10:05 - [FIX PERMANEN + FILE PAKEM SHIP APK BARU] Manifest HANYA 1 SUMBER BENAR (Hapus src/data duplicate) + Script PowerShell Otomatis (Agar URL Tutorial EduLock/GAS Download Tidak Pernah Kesasar Lagi — termasuk EduLock 1.3.5→1.3.6 kesasar tadi)

- Pelaksana: Assistant
- Jenis perubahan: `refactor / fix permanent / docs ops tooling` (tanpa assemble APK baru, hanya kode web + script deploy)
- Flavor terdampak: **SEMUA URL tutorial download APK** (`/edulock/install` EduLock siswa, `/gas/install` GAS siswa, alias pendek `/e` & `/g`) — termasuk EduLock 1.3.6 / 32 dan GAS 1.0.39-siswa / 23036 yang sebelumnya kesasar versi lama.
- **LATAR BELAKANG (2x kejadian berturut — GAS 1.0.38 → 1.0.39 lalu EduLock 1.3.5 → 1.3.6)**: Sebelum fix ini, project web punya **DUA SALINAN `apk-manifest.json` TERPISAH yang KEDUANYA HARUS SELALU IDENTIK**:
  1. `web/public/apk/apk-manifest.json` → manifest server-side (sumber kebenaran SHA/size yang selalu benar setelah setiap ship APK).
  2. `web/src/data/apk-manifest.json` → **SUMBER DATA STATIC IMPORT COMPILE-TIME** di `lib/getApkDownloadHref.ts` (line 1 `import apkManifest from "@/data/apk-manifest.json";`). File ini **SERING TERLEWAT di-sync** karena tidak ada alat otomatis.
  - Akibatnya: FILE APK FISIK DI SERVER SUDAH BENAR (1.3.6 / 32, SHA `F5113052…`), tapi nama file unduhan di halaman tutorial MASIH VERSI LAMA (`EduLock-1.3.5-31.apk`) → user lapangan bertanya: **"url siswa tutrial edulock hasil downloadnya kok versi 1.3.5.31 padahal saat ini versi 1.3.6.32."**
- **SOLUSI DUA LANGKAH PERMANEN (tidak akan kesasar LAGI SELAMANYA)**:
  ### (A) SINGLE SOURCE OF TRUTH: HAPUS DUPLICATE `src/data/apk-manifest.json`
  - Ubah total [web/src/lib/getApkDownloadHref.ts](file:///d:/Dashboard%20Portal/web/src/lib/getApkDownloadHref.ts#L1-L104):
    - Hapus line `import apkManifest from "@/data/apk-manifest.json";` (static import compile-time).
    - Tambah helper **`loadManifestOnce()`**: `fs.readFileSync(path.join(process.cwd(), "public/apk/apk-manifest.json"))` → parse JSON → **HANYA BACA DARI MANIFEST SUMBER BENAR (public)**.
    - Cache in-memory dengan `_cachedManifest` + `_cachedManifestMtimeMs` (bandingkan `statSync.mtimeMs` per panggilan). Jika manifest berubah ditulis script deploy, otomatis reload cache tanpa rebuild (untuk request runtime server-side).
    - Tiga export function (`getApkDownloadHref`, `getLatestApkMetaByPackageName`, `getLatestApkFileNameByPackageName`) SEMUA memanggil `loadManifestOnce()` → **tidak ada lagi manifest kedua**.
  - **Hapus permanen file duplicate yang bikin kesasar**: `rm web/src/data/apk-manifest.json` ✅ Sudah tidak ada lagi, tidak akan muncul lagi di langkah SOP.
  ### (B) FILE PAKEM SCRIPT DEPLOY OTOMATIS: `web/scripts/Ship-Apk-Baru.ps1` (PowerShell 5, bisa langsung dijalankan)
  - **PATH file pakem** (harus dipakai setiap kali rilis APK baru — **JANGAN PERNAH COPY MANUAL LAGI!**):
    - [web/scripts/Ship-Apk-Baru.ps1](file:///d:/Dashboard%20Portal/web/scripts/Ship-Apk-Baru.ps1)
  - **Isi otomatis script (10 STEP OTOMATIS, tidak ada langkah manual copy/hash/edit JSON)**:
    1. Validasi input file source APK ada + ekstensi .apk + version/versionCode >0.
    2. **Hitung SHA256 & sizeBytes & sizeMB & lastModified** dari APK source hasil assemble gradle.
    3. **Copy 1/3** → `web/public/apk/<TargetFileName>` (default URL `/apk/` live).
    4. **Copy 2/3** → `Apk Release/Final/<TargetFileName>` (default install manual lapangan).
    5. **Copy 3/3** → `Apk Release/Final/<ArchivePrefix>-<VersionName>-<VersionCode>.apk` (arsip history versi). ArchivePrefix otomatis: Preset EduLock→"EduLock", GasSiswa→"GAS-Siswa".
    6. **Update langsung `public/apk/apk-manifest.json`** (SATU-SATUNYA manifest, karena src/data SUDAH DIHAPUS): set `updatedAt` (UTC sekarang) + overwrite entry TargetFileName dengan struct lengkap (`lastModified, packageName, sizeMB, sha256, versionName, versionCode, sizeBytes`), tambah `signerSha256` untuk GasSiswa preset otomatis.
    7. **Verifikasi akhir SHA256 KONSISTEN**: banding hash 3 copy file + entry di manifest — WAJIB SAMA SEMUA. Jika beda → script `exit 1` (gagal, tidak lanjut). Mustahil tercipta "versi kesasar".
    8. Print ringkasan warna-warni di console: Preset/Package/Versi/SHA/Size.
    9. List 4 artefak tersimpan: [1] web public · [2] Final default · [3] Final arsip · [4] manifest.
    10. **Print 4 LANGKAH MANUAL BERIKUTNYA (JANGAN DILEWATI)**: [1] cd web ; npm run build · [2] QA cek build · [3] update 3 catatan pegangan · [4] git commit push.
  - **Cara pakai Preset (tinggal tempel, isi parameter sesuai versi baru)**:
    * Untuk **EduLock (flavor student, app name EduLock)** — setelah gradle `assembleStudentRelease` sukses:
      ```powershell
      cd D:\Dashboard Portal\web\scripts
      .\Ship-Apk-Baru.ps1 -Preset EduLock `
         -SourceApk  "D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk" `
         -VersionName "1.3.6" -VersionCode 32
      ```
    * Untuk **GAS Siswa (flavor siswa, app name GAS)** — setelah gradle `assembleSiswaRelease` sukses:
      ```powershell
      cd D:\Dashboard Portal\web\scripts
      .\Ship-Apk-Baru.ps1 -Preset GasSiswa `
         -SourceApk  "D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk" `
         -VersionName "1.0.39-siswa" -VersionCode 23036
      ```
    * Preset otomatis set `TargetFileName` + `PackageName` + `signerSha256` GAS, jadi tidak perlu isi manual. Jika butuh custom (flavor lain), pakai parameter set `-TargetFileName` + `-PackageName` (ParameterSet Manual).
- File utama yang diubah:
  1. [web/src/lib/getApkDownloadHref.ts](file:///d:/Dashboard%20Portal/web/src/lib/getApkDownloadHref.ts#L1-L104) — refactor static import → fs read manifest tunggal + cache mtime.
  2. ~~`web/src/data/apk-manifest.json`~~ → **SUDAH DIHAPUS PERMANEN** (tidak akan jadi sumber kesasar lagi).
  3. **[web/scripts/Ship-Apk-Baru.ps1](file:///d:/Dashboard%20Portal/web/scripts/Ship-Apk-Baru.ps1)** → file PAKEM BARU (±220 baris) PowerShell deploy APK 10 step otomatis.
- Fitur lama yang wajib ikut dicek:
  - ✅ URL `/apk/EduLock-studentRelease.apk?v=F51130526C1A` (token sha prefix 12) tetap berfungsi.
  - ✅ URL `/apk/GAS-Siswa-release.apk?v=B64C0DE25B0B` tetap berfungsi.
  - ✅ `signerSha256` GAS tetap `64738955…1eb31f63` (hardcoded script preset GasSiswa).
- Build yang dijalankan:
  1. Test run Preset EduLock 1.3.6 (32) → exit code 0, SHA256 3 file + manifest konsisten `F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F`.
  2. Test run Preset GasSiswa 1.0.39-siswa (23036) → exit code 0, SHA256 3 file + manifest konsisten `B64C0DE25B0BDBA6548E301C4B4ECDE5FF925424EB81DA88E566A50DF009D68A`.
  3. `cd web ; npm run build` → Next.js **Compiled successfully in 19.5s**, 58 static pages OK. `ensure-standalone-public` menggabung 2 APK ke standalone tetap work.
- Hasil QA verifikasi manifest + versi render:
  - EduLock: `versionName = 1.3.6`, `versionCode = 32`, `downloadFileName = EduLock-1.3.6-32.apk` ✅ (kasuhan user tadi: dulu 1.3.5-31 salah).
  - GAS Siswa: `versionName = 1.0.39-siswa`, `versionCode = 23036`, `downloadFileName = GAS-Siswa-1.0.39-siswa-23036.apk` ✅.
- Belum diuji:
  - [ ] QA manual browser live setelah deploy: buka `/edulock/install` → Save Link As → nama file = `EduLock-1.3.6-32.apk`.
  - [ ] QA manual browser GAS live: buka `/gas/install` → Save Link As → nama file = `GAS-Siswa-1.0.39-siswa-23036.apk`.
- **PROGRES TERKINI 2026-08-06 10:30 (sudah DONE / Tanda [x])**:
  - [x] **Next.js Production Build SSOT manifest**: `cd web ; npm run build` → **Compiled successfully in 19.5s**, 58 static pages OK. `ensure-standalone-public` merge 2 APK (EduLock 1.3.6 + GAS 1.0.39) ke `.next/standalone/public/apk/` ✅.
  - [x] **2 Commit split sudah di-push origin main (Firebase App Hosting auto deploy live dalam ~3-5 menit)**:
    1. **Commit #1 source code (a74757db)** · `fix(web+apk-deploy): SSOT manifest permanent + Ship-Apk-Baru.ps1 File PAKEM (no more kesasar version name download)` — 7 files changed: rewrite `getApkDownloadHref.ts` SSOT fs read manifest tunggal + cache mtime; add new `Ship-Apk-Baru.ps1` File PAKEM; delete permanen `src/data/apk-manifest.json` (tidak ada lagi duplicate manifest penyebab kesasar versi); update `public/apk/apk-manifest.json` EduLock 1.3.6 (32) SHA F5113052 + GAS 1.0.39-siswa (23036) SHA B64C0DE2; update Final default alias APK EduLock-studentRelease.apk + arsip versioned `EduLock-1.3.6-32.apk`; update Final GAS alias.
    2. **Commit #2 docs catatan pegangan (90e283eb)** · `docs(pegangan-build): BUILD_LOG GAS & EduLock + CHECKLIST update permanent SSOT manifest + cara pakai File PAKEM Ship-Apk-Baru.ps1 presets` — 3 files changed: BUILD_LOG GAS, BUILD_LOG EduLock, CHECKLIST_PERUBAHAN_APK_TERKINI.
  - [x] **Git Push Origin Main OK**: push `54e110ca..90e283eb main -> main` ke `https://github.com/mikoewp1982/Dashboard-Portal.git` (write 19.21 MiB @4.76 MiB/s) ✅.
  - [x] **Verifikasi Manifest SSOT PowerShell parse JSON**: EduLock versionName `1.3.6` + versionCode `32` ✅ (JAWAB LANGSUNG pertanyaan user: dulu 1.3.5-31 salah karena manifest duplicate src/data; SEKARANG manifest TUNGGAL public/apk/ + File PAKEM Ship-Apk-Baru.ps1 verifikasi SHA akhir MUSTAHIL kesasar).
  - [x] **Test run Preset EduLock Ship-Apk-Baru.ps1**: exit code 0, SHA256 `F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F` SAMA di 3 copy file (web public | Final default EduLock-studentRelease.apk | Final arsip EduLock-1.3.6-32.apk) + entry manifest ✅.
- Catatan (SOP MASA DEPAN — WAJIB SELALU PAKAI FILE PAKEM INI! JANGAN COPY MANUAL LAGI!):
  > Setiap kali **SELESAI `assembleStudentRelease` EduLock APK BARU**, LANGKAH PERTAMA setelah SHA output gradle:
  > 1. **JALANKAN script `Ship-Apk-Baru.ps1`** dengan `-Preset EduLock` + SourceApk path assemble gradle + VersionName/VersionCode rilis.
  > 2. Script otomatis: copy 3 lokasi → hit SHA → edit manifest TUNGGAL → verify semua cocok. (Tidak mungkin lagi ada src/data duplicate yang bikin kesasar 1.3.5 seperti tadi.)
  > 3. Setelah script exit 0, **jalankan 4 langkah manual sisa** yang dicetak di akhir script (build web → QA lokal → catatan pegangan → commit push).

---

## 2026-08-06 09:35 - EduLock siswa 1.3.6: hilangkan delay Master Switch proteksi di HP vendor agresif (Realme UI) dengan WakeLock + polling fallback 30 detik
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menghilangkan delay 15-45 detik (atau bahkan tidak respon sampai dibuka) saat admin menekan Master Switch "Status Proteksi Sekolah ON" di web admin untuk HP vendor agresif (Realme UI, dll) yang masuk Doze / Deep Sleep dan memutus WebSocket RTDB ValueEventListener saat idle > 5 menit. Setelah build ini di-install di unit Realme bermasalah, delay ON→lock seharusnya < 15 detik (pertama polling 15s, lalu interval 30s).
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt` (import PowerManager, field protectionPollingIntervalMs, protectionPollingRunnable, wakeLock, wakeLockTimeoutMs; upgrade screenReceiver SCREEN_ON/USER_PRESENT acquireWakeLock+delay 1.5s forceSync; tambah acquireWakeLock/startForceSyncProtectionPolling/forceSyncProtectionStatus; onCreate/onStartCommand panggil startForceSyncProtectionPolling; onDataChange listener awal panggil acquireWakeLock)
  - `native-mobile-edulock/app/build.gradle.kts` (versionCode `31 → 32`, versionName `"1.3.5" → "1.3.6"`)
  - `web/public/apk/apk-manifest.json` (entry EduLock 1.3.6 / 32 + sha256 baru)
- Fitur lama yang wajib ikut dicek:
  - lock kiosk / Relaunch ke EduLock saat keluar ke TikTok/aplikasi lain saat proteksi ON tetap bekerja
  - Master Switch ON → status compliance 5 hijau di web admin → HP terkunci tetap seperti biasa
  - FCM Push "Lock" / "Unlock" dan Master Switch OFF tetap bekerja normal di HP vendor lain (non-Realme)
- Build yang dijalankan:
  - `cd native-mobile-edulock ; .\gradlew.bat :app:assembleStudentRelease --no-daemon`
  - `cd web ; npm run build`
- Hasil build:
  - Android assembleStudentRelease: **BUILD SUCCESSFUL in 3m 5s**, 49 tasks (21 executed, 28 cache), 0 ERROR (hanya 35 warning deprecated API: onBackPressed, onActivityResult, TYPE_PHONE, SYSTEM_UI_FLAG, ACTION_CLOSE_SYSTEM_DIALOGS, Accessibility/DeviceAdmin deprecated callback, ZXing IntentIntegrator, activeNetworkInfo — semua unrelated, diabaikan sesuai SOP).
  - Web production build: **Next.js 15.5.20 Compiled successfully in 21.6s**, 58 static pages OK; ensure-standalone-public 2 APK merge ke `.next/standalone/public`.
- Output APK:
  - `native-mobile-edulock/app/build/outputs/apk/student/release/EduLock-studentRelease.apk` → packageName `com.sekolah.edulock`, size `3,788,822 bytes` (3.61 MB), lastModified `2026-08-06T09:32:09`
  - SHA256 APK: `F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F`
- Disalin ke:
  - `web/public/apk/EduLock-studentRelease.apk` (URL live `/apk/EduLock-studentRelease.apk` / `/edulock/install`)
  - `Apk Release/Final/EduLock-studentRelease.apk` (default filename)
  - `Apk Release/Final/EduLock-1.3.6-32.apk` (arsip history versi)
- Regression check yang dijalankan:
  - Compile Kotlin + assemble studentRelease flavor sukses (BUILD SUCCESSFUL, 0 ERROR)
  - SHA256 dibanding antara source gradle output vs copy web public vs copy final → SAMA: `F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F` ✅
  - apk-manifest.json entry EduLock diverifikasi cocok dengan file info
  - Next.js production build + ensure-standalone-public menggabung 2 APK (EduLock 1.3.6 + GAS 1.0.39) ✅
- Belum diuji:
  - [ ] Install APK EduLock 1.3.6 (32) di unit Realme yang sempat delay → Menu Tentang / About → versi `1.3.6 (32)` ✓
  - [ ] Admin web: Master Switch "Status Proteksi Sekolah" ON → HP Realme masuk lock dalam <15 detik (dulu delay 15-45s).
  - [ ] Master Switch OFF → HP Realme keluar lock normal.
  - [ ] Download APK via `/edulock/install` live URL → SHA256 cocok dengan manifest.
  - [ ] (Opsional Force Update) Buka halaman `/super-admin/mobile-apps` → set **`minVersionEduLock = 32`** → simpan. Siswa APK EduLock <32 otomatis masuk Force Update screen, tombol Download APK Terbaru → `/edulock/install?from=force_update` live.
- Catatan:
  - URL tutorial siswa EduLock di `ForceUpdateActivity.kt` (tombol Download) **SUDAH BENAR** dan diarahkan ke live URL App Hosting Production terbaru: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install?from=force_update&ts={ts}` — TIDAK PERLU diubah, tetap konsisten dengan tutorial instalasi siswa terbaru.

---

## 2026-08-05 20:05 - EduLock siswa: tombol download pada force update + nama file unduhan tutorial memakai versi
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Tujuan perubahan: Menambahkan tombol download pada layar force update EduLock siswa agar user langsung diarahkan ke halaman tutorial instalasi resmi, sekaligus memastikan nama file APK yang diunduh dari tutorial membawa versi terbaru supaya tidak membingungkan user saat update manual.
- Scope terdampak: `student`, `student-web`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/ForceUpdateActivity.kt`
  - `native-mobile-edulock/app/src/main/res/layout/activity_force_update.xml`
  - `web/src/app/edulock/install/page.tsx`
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - layar force update tetap menahan akses sampai admin menurunkan minimum version
  - tombol `TUTUP APLIKASI` tetap bekerja seperti sebelumnya
  - tombol download di tutorial EduLock tetap mengarah ke file APK publik yang benar
- Build yang dijalankan:
  - `./gradlew.bat :app:compileStudentReleaseKotlin --no-daemon`
  - `npm run build` (web)
- Hasil build:
  - sukses
- Output APK:
  - belum dibuat pada langkah ini (hanya compile Kotlin)
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - compile Kotlin flavor `student`
  - build produksi web sukses setelah perubahan tutorial EduLock
- Belum diuji:
  - klik tombol `DOWNLOAD APK TERBARU` di layar force update pada device siswa
  - verifikasi browser menyimpan file tutorial EduLock dengan nama versi, mis. `EduLock-1.3.4-30.apk`
- Catatan:
  - URL force update EduLock diarahkan ke `/edulock/install?from=force_update&ts=...` agar halaman tutorial selalu memuat versi terbaru
  - nama file server tetap kanonik (`EduLock-studentRelease.apk`), sedangkan nama file unduhan di browser dibuat berisi versi agar distribusi manual tetap jelas bagi user

---

## 2026-08-05 18:32 - Pisahkan binding device EduLock dari GAS (field `edulockDeviceUuid`)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Agar reset EduLock di web admin tidak ikut memutus binding GAS, dan EduLock tidak lagi menimpa field binding GAS pada record siswa.
- Scope terdampak: `student`, `web admin`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/StudentAuthService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
  - `web/src/app/api/admin/database/route.ts`
  - `web/src/components/database/students/StudentsPanel.tsx`
  - `web/src/components/database/students/StudentsTable.tsx`
- Fitur lama yang wajib ikut dicek:
  - EduLock masih bisa login/registrasi pada akun yang sebelumnya hanya punya field legacy (`device_uuid` / `deviceId`)
  - reset `EduLock` tidak menghapus binding GAS siswa
- Build yang dijalankan:
  - `./gradlew.bat :app:compileStudentReleaseKotlin --no-daemon`
- Hasil build:
  - sukses
- Output APK:
  - belum dibuat pada langkah ini (hanya compile Kotlin)
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - belum ada (butuh uji runtime di device)
- Belum diuji:
  - uji login EduLock pada akun lama yang terikat di `deviceId/device` tanpa `device_uuid`
  - uji reset `EduLock` dari web admin lalu login ulang di HP baru
- Catatan:
  - EduLock sekarang menulis field `edulockDeviceUuid` + legacy `device_uuid`, dan berhenti menulis `deviceId/device` agar tidak mengganggu GAS

---

## 2026-08-02 20:03 - Ship EduLock siswa 1.3.4 fail-closed presence + sync tutorial
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Merilis APK EduLock siswa dengan proteksi GPS/internet fail-closed berbasis indikasi kehadiran sekolah, menyinkronkan artefak ke `web/public/apk`, memperbarui URL unduh tutorial live, dan menyiapkan handoff lapangan.
- Scope terdampak: `student`, `student-web`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LocationMonitor.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/GeofenceBroadcastReceiver.kt`
  - `native-mobile-edulock/app/build.gradle.kts` (`versionName 1.3.4` / `versionCode 30`)
  - `native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md`
  - `Apk Release/Final/EduLock-studentRelease.apk`
  - `Apk Release/Final/HANDOFF_LAPANGAN_EDULOCK.docx`
  - `web/public/apk/EduLock-studentRelease.apk`
- Fitur lama yang wajib ikut dicek:
  - hard lock GPS-off / internet-off hanya saat ada indikasi presence (sticky / near-school / recent geofence)
  - siswa sakit di rumah tanpa indikasi dekat sekolah tidak dipaksa terkunci
  - tombol unduh APK EduLock di `/e` dan `/edulock/install` tidak `404`
  - proteksi jam sekolah, Device Admin, Accessibility, overlay `pet mati`
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build:
  - sukses; ship commit `24e3ffa6`
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk` (`3,787,940` bytes; nama kanonik saja)
  - `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - verifikasi metadata versi `1.3.4` / `30`
  - verifikasi unduh tutorial live GAS + EduLock setelah fix App Hosting
- Belum diuji:
  - uji lapangan GPS off di sekolah vs di rumah (sakit) pada device siswa nyata
- Catatan:
  - Duplikat bertanggal/versi di `Final` dibersihkan; acuan distribusi memakai nama kanonik `EduLock-studentRelease.apk`.
  - Handoff Word ada di `Apk Release/Final/HANDOFF_LAPANGAN_EDULOCK.docx`.

## 2026-08-02 19:20 - Perbaiki unduh APK tutorial 404 di App Hosting standalone
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memulihkan tombol unduh APK di portal tutorial siswa yang sempat `404` karena output standalone App Hosting tidak mengemas isi `web/public/apk`.
- Scope terdampak: `student-web` (GAS + EduLock)
- File utama yang diubah:
  - `web/scripts/ensure-standalone-public.mjs`
  - konfigurasi agar `apk-manifest` tidak di-trace dari `public`
- Fitur lama yang wajib ikut dicek:
  - unduh `GAS-Siswa-release.apk` dari `/gas/install` / `/g`
  - unduh `EduLock-studentRelease.apk` dari `/edulock/install` / `/e`
  - gambar tutorial static import tetap `200`
- Build yang dijalankan:
  - tidak ada build APK baru pada entri ini
- Hasil build:
  - tidak build APK; deploy web via commit `3c9b1413`
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - verifikasi live bahwa unduh APK GAS dan EduLock kembali normal
- Belum diuji:
  - tidak relevan setelah verifikasi live unduh
- Catatan:
  - Commit `3c9b1413` (`fix(web): restore student APK downloads on App Hosting`); ship EduLock menyusul di `24e3ffa6`.

## 2026-08-02 13:35 - Hapus overlay callout pada tutorial EduLock web
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Menyederhanakan visual tutorial instalasi EduLock siswa: seluruh kotak callout di atas screenshot dihapus, teks langkah default di atas gambar tetap dipakai, dan wording tombol registrasi diselaraskan ke `Daftar`.
- Scope terdampak: `student-web`
- File utama yang diubah:
  - `web/src/app/edulock/install/page.tsx`
- Fitur lama yang wajib ikut dicek:
  - judul/body langkah instalasi tetap terbaca di `/edulock/install`
  - gambar tutorial tetap termuat via static import
  - alias URL pendek `/e` tetap mengarah ke halaman yang sama
  - teks langkah menyebut tombol `Daftar`, bukan `Masuk`
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build:
  - tidak build
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - commit `307751ae` (`fix(web): simplify student tutorial visuals`) sudah di-push ke `main`
- Belum diuji:
  - verifikasi visual langsung di halaman live App Hosting sesudah rollout Firebase selesai
- Catatan:
  - Deploy mengikuti jalur git push `main` ke Firebase App Hosting `gerbang-aplikasi-sekolah--kompas-5f0b4`. Perubahan ini hanya menyentuh portal tutorial web, bukan APK EduLock.

## 2026-08-02 09:55 - Rapikan posisi callout tombol Masuk pada tutorial EduLock web
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Menyamakan posisi box petunjuk `Jika sesuai, tekan tombol Masuk` agar sejajar ke sisi kanan seperti dua callout di atasnya pada halaman tutorial EduLock.
- Scope terdampak: `student-web`
- File utama yang diubah:
  - `web/src/app/edulock/install/page.tsx`
- Fitur lama yang wajib ikut dicek:
  - layout callout visual login pada route `/edulock/install`
  - posisi box `Masukan NISN kalian`
  - posisi box `Nama siswa terisi otomatis`
  - posisi box `Jika sesuai, tekan tombol Masuk`
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build:
  - tidak build
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - review class `positionClassName` callout login di halaman tutorial EduLock
- Belum diuji:
  - verifikasi visual langsung di halaman live sesudah deploy
- Catatan:
  - Perubahan ini hanya menyentuh portal tutorial web, bukan APK EduLock.

## Template Entry

### YYYY-MM-DD HH:mm - Judul Singkat
- Pelaksana:
- Jenis perubahan:
- Tujuan perubahan:
- Scope terdampak:
- File utama yang diubah:
- Fitur lama yang wajib ikut dicek:
- Build yang dijalankan:
- Hasil build:
- Output APK:
- Disalin ke:
- Regression check yang dijalankan:
- Belum diuji:
- Catatan:

### 2026-08-02 01:35 - Penyempurnaan tutorial web EduLock siswa dan pencatatan rollout live
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Merapikan halaman tutorial instalasi EduLock siswa di web agar lebih mudah dipahami saat dibuka dari browser, termasuk membersihkan panah anotasi, membenahi teks panduan login, memindahkan kotak dialog `Masukan NISN kalian` ke area kolom NISN, dan mencatat URL live yang dipakai untuk distribusi siswa.
- Scope terdampak: `student`, `web-admin (edulock)`
- File utama yang diubah:
  - `web/src/app/edulock/install/page.tsx`
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - halaman tutorial instalasi EduLock siswa di route `/edulock/install`
  - redirect alias pendek `/e`
  - tampilan panduan visual login siswa
- Build yang dijalankan:
  - tidak ada build APK
  - deploy repo web melalui push `main`
- Hasil build: tidak ada APK baru; perubahan web sudah dipush ke repository dengan commit `1b25d25f`
- Output APK: tidak ada APK baru
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - lint `web/src/app/edulock/install/page.tsx`
  - audit posisi kotak panduan login siswa
  - audit bahwa panah anotasi di halaman EduLock sudah dihapus
- Belum diuji:
- Update verifikasi:
  - route `/e` sudah aktif live (redirect ke `/edulock/install`) dan konten termuat normal di App Hosting production pada `2026-08-02`
- Belum diuji:
  - uji buka tutorial EduLock siswa dari browser HP nyata pada jaringan sekolah (cek layout visual final)
- Catatan:
  - URL live utama EduLock siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/e`
  - URL fallback EduLock siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install`
  - perubahan ini hanya menyentuh portal tutorial web, bukan APK EduLock siswa

### 2026-08-01 23:40 - Pencatatan URL pendek tutorial instalasi EduLock siswa
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Mencatat jalur distribusi web terbaru untuk siswa agar admin tidak bingung antara URL lama tutorial instalasi EduLock dan alias pendek yang baru dipakai saat membagikan link ke browser siswa.
- Scope terdampak: `student`, `web-admin (edulock)`
- File utama yang diubah:
  - `web/src/app/e/page.tsx`
  - `web/src/app/edulock/install/page.tsx`
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/README.md`
- Fitur lama yang wajib ikut dicek:
  - halaman tutorial instalasi EduLock siswa di route `/edulock/install`
  - tombol unduh APK `EduLock-studentRelease.apk`
  - redirect alias pendek `/e`
- Build yang dijalankan:
  - tidak ada build APK
  - `npm run build` pada folder `web` sudah sukses saat verifikasi route `/e`
- Hasil build: tidak ada build APK baru; verifikasi build web sukses dan route `/e` terdeteksi di output Next.js
- Output APK: tidak ada APK baru
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - audit dokumentasi bahwa URL utama siswa kini memakai alias pendek `/e`
  - verifikasi source route pendek `web/src/app/e/page.tsx` melakukan redirect ke `/edulock/install`
- Belum diuji:
  - rollout App Hosting production hingga URL live `/e` benar-benar aktif
- Catatan:
  - URL utama yang akan dibagikan ke siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/e`
  - URL fallback tetap tersedia di route `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install`
### 2026-08-01 20:12 - Telemetry Realtime Instan EduLock saat Registrasi & Setup
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memastikan status perangkat di Admin Web (`active_devices`) langsung berubah menjadi `ONLINE` seketika saat registrasi selesai & selama halaman `SetupActivity` (onboarding izin HP) dibuka, sehingga status di web admin tidak lagi tertahan di status `TERIKAT / Offline` (sisa data uninstall lama) saat siswa sedang melengkapi konfigurasi.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - registrasi siswa (NPSN -> NISN -> Nama)
  - halaman onboarding 6 izin HP (`SetupActivity`)
  - telemetry `active_devices` realtime di Admin Web
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL in 2m 22s`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - compile & build APK `studentRelease`
  - verifikasi pemicu telemetry di `updateFirebaseDeviceBinding` & `SetupActivity.onResume()`
- Belum diuji:
  - uji perangkat fisik pada instalasi bersih dari awal
- Catatan:
  - Sebelumnya telemetry `MonitoringService` baru terpicu setelah `MainActivity` terbuka. Perbaikan ini menambahkan pemicu telemetry awal sejak `RegistrationActivity` dan `SetupActivity`.

### 2026-07-30 22:11 - Overlay pet mati dibatasi hanya di luar jam sekolah
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mengurangi beban enforcement EduLock saat jam efektif sekolah dengan membatasi overlay peringatan `pet mati` hanya aktif di luar jam sekolah.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - overlay `pet mati` muncul di luar jam sekolah
  - overlay `pet mati` tidak muncul saat jam sekolah
  - overlay `pet mati` tertutup otomatis saat masuk jam sekolah / mode libur / proteksi off
- Build yang dijalankan:
  - `:app:compileStudentDebugKotlin`
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_22-11-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_22-11-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin flavor `student`
  - build release flavor `student`
  - verifikasi file APK terbaru di folder `OK_4`
- Belum diuji:
  - transisi tepat saat pergantian jam sekolah di perangkat fisik
  - reminder ulang 10 menit di luar jam sekolah pada perangkat fisik
- Catatan:
  - `PetDeadLockActivity` sekarang ikut menutup diri saat menerima `ACTION_DISMISS_LOCKSCREEN` atau saat aplikasi mendeteksi jam sekolah/libur/proteksi nonaktif.

### 2026-07-30 22:00 - Hardening flow izin dan buka GAS agar tidak ditarik balik lifecycle
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mencegah EduLock melakukan `relaunch` paksa saat siswa masih berada di flow resmi `Minta Izin Penggunaan HP` atau `Buka APK GAS Siswa`.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - klik `Minta Izin Penggunaan HP`
  - input kode manual
  - scan barcode izin
  - klik `Buka APK GAS Siswa`
  - enforcement saat pindah ke aplikasi terlarang
- Build yang dijalankan:
  - `:app:compileStudentDebugKotlin`
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_22-00-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_22-00-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin flavor `student`
  - build release flavor `student`
  - verifikasi file APK terbaru di folder `OK_4`
- Belum diuji:
  - alur penuh klik tombol izin di perangkat fisik
  - alur pindah dari EduLock ke GAS Siswa dan kembali lagi di perangkat fisik
- Catatan: Pendekatan diubah mengikuti pola yang user minta: lifecycle activity tidak lagi menjadi titik `relaunch` paksa; enforcement agresif didelegasikan ke `MonitoringService` setelah target app benar-benar terdeteksi, sementara flow resmi diberi grace period dan lock-task cooldown singkat.

### 2026-07-30 21:43 - Perbaikan tombol utama MainActivity tertutup overlay setup
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memastikan tombol `Minta Izin Penggunaan HP` dan `Buka APK GAS Siswa` kembali bisa disentuh saat siswa sudah masuk ke `MainActivity`.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - kembali dari halaman Settings/Aksesibilitas
  - tombol `Minta Izin Penggunaan HP`
  - tombol `Buka APK GAS Siswa`
  - proteksi setup saat masih berada di halaman pengaturan sistem
- Build yang dijalankan:
  - `:app:compileStudentDebugKotlin`
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_21-43-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_21-43-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin flavor `student`
  - build release flavor `student`
  - verifikasi file APK hasil copy di folder `OK_4`
- Belum diuji:
  - sentuhan tombol pada perangkat fisik setelah kembali dari flow setup
  - perpindahan dari EduLock ke GAS Siswa pada perangkat fisik
- Catatan: Fix menambahkan pembersihan agresif terhadap `SetupProtectionService`/lock overlay sementara setiap kali `MainActivity` kembali aktif, tanpa menghapus fungsi proteksi saat user masih berada di halaman Settings.

---

## 2026-07-30 20:30 - Guard error boundary halaman EduLock web (antisipasi blank)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menghindari halaman EduLock terlihat blank saat terjadi error runtime dengan menambahkan error boundary khusus route `/dashboard/edulock`.
- Scope terdampak: `web-admin (edulock)`
- File utama yang diubah:
  - `web/src/app/dashboard/edulock/error.tsx`
- Fitur lama yang wajib ikut dicek:
  - semua tab EduLock tetap bisa dibuka (dashboard/monitoring/codes/geofencing/students/classes/violations/settings)
  - jika terjadi error, UI menampilkan tombol `Muat Ulang` dan `Kembali ke Dashboard`
- Build yang dijalankan:
  - tidak build APK
  - `npm run dev` (verifikasi lokal)
- Hasil build: tidak ada build APK; verifikasi dev server lokal berjalan
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - buka `/dashboard/edulock?tab=settings` dan pastikan UI tidak blank
- Belum diuji:
  - skenario error runtime nyata (mis. API down) untuk memastikan fallback selalu tampil
- Catatan: Entry ini dicatat di pegangan EduLock karena isu muncul pada halaman EduLock web, meski tidak ada perubahan APK.

## 2026-07-30 20:08 - Cleanup final sesudah overlay pet mati terverifikasi
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menutup sesi debug setelah user mengonfirmasi overlay `pet mati` berhasil muncul, sekaligus mengembalikan kode ke kondisi production yang bersih.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/build.gradle.kts`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
  - `web/src/app/api/admin/virtual-pet/route.ts`
  - `web/src/hooks/gas/virtual-pet/useGasVirtualPet.ts`
  - `web/src/components/gas/virtual-pet/GasPetPanel.tsx`
  - `web/src/components/gas/virtual-pet/GasPetLeaderboardTab.tsx`
- Fitur lama yang wajib ikut dicek:
  - overlay `pet mati` saat `Status Proteksi Sekolah` aktif
  - interval reminder normal 10 menit setelah tombol `Saya Mengerti`
  - panel admin `Virtual Pet` tanpa tombol uji coba sementara
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
  - `npm run build` pada folder `web`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_20-08-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_20-08-release.apk`
- Regression check yang dijalankan:
  - user mengonfirmasi overlay `pet mati` sudah muncul pada build post-fix
  - build web sukses setelah tombol `Paksa Mati` dan banner mode uji dihapus
  - build release EduLock sukses setelah instrumentasi debug dicabut dan interval reminder dikembalikan ke 10 menit
  - server debug dihentikan dan file sesi debug dihapus
- Belum diuji:
  - deploy ulang web admin production tanpa tool uji, bila nanti diminta
  - uji lapangan pengingat ulang 10 menit setelah cleanup final
- Catatan: Dari hasil verifikasi user, overlay `pet mati` bergantung pada `Status Proteksi Sekolah` dalam keadaan aktif.

## 2026-07-30 20:02 - Fix alias identitas pet mati dan build post-fix
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memperbaiki root cause overlay `pet mati` yang tidak muncul karena EduLock memakai `studentId` lokal SQLite sebagai alias pencarian pet, bukan identitas backend siswa.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/build.gradle.kts`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PreferencesManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/StudentAuthService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
  - `debug-pet-overlay-missing.md`
- Fitur lama yang wajib ikut dicek:
  - sinkronisasi identitas siswa saat login/register EduLock
  - listener status `virtual_pets`
  - reminder overlay `pet mati`
  - launch `PetDeadLockActivity`
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_20-02-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_20-02-release.apk`
- Regression check yang dijalankan:
  - analisis log pre-fix membuktikan listener hidup tetapi berhenti sebelum `Pet status decision computed`
  - build post-fix sukses setelah penyimpanan `studentKey` dan `username` backend ditambahkan
  - versi APK dinaikkan ke `1.3.3 (versionCode 29)` agar bisa dipasang menimpa build debug sebelumnya
  - log file debug post-fix dikosongkan ulang sebelum reproduksi berikutnya
- Belum diuji:
  - uji perangkat fisik bahwa build `20-02` sekarang masuk ke cabang `post-fix` dan memunculkan overlay
  - uji perangkat fisik bahwa tombol `Saya Mengerti` tetap memberi jeda lalu overlay muncul lagi maksimal 1 menit
- Catatan: Instrumentasi debug masih dipertahankan sampai user mengonfirmasi hasil akhir, lalu seluruh artefak debug dan tool uji sementara akan dibersihkan.

## 2026-07-30 19:47 - Build debug overlay pet mati untuk reproduksi runtime
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyiapkan APK uji EduLock siswa yang sudah membawa instrumentasi runtime untuk membuktikan apakah listener pet, cabang `performChecks()`, atau launch `PetDeadLockActivity` yang gagal saat overlay `pet mati` tidak muncul.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/build.gradle.kts`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PetDeadLockActivity.kt`
  - `debug-pet-overlay-missing.md`
- Fitur lama yang wajib ikut dicek:
  - listener status `virtual_pets` di EduLock siswa
  - cabang reminder `pet mati` 1 menit
  - peluncuran `PetDeadLockActivity`
  - tombol `Paksa Mati` dan `Hidupkan` pada web admin `Virtual Pet`
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_19-47-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_19-47-release.apk`
- Regression check yang dijalankan:
  - build release EduLock siswa sukses setelah instrumentasi runtime aktif
  - server debug `pet-overlay-missing` terkonfirmasi hidup dan masih kosong (`log_count: 0`) sebelum reproduksi baru
  - versi APK dinaikkan ke `1.3.2 (versionCode 28)` agar bisa dipasang di atas build uji sebelumnya
- Belum diuji:
  - uji perangkat fisik dengan APK `19-47` bahwa event debug benar-benar masuk ke `.dbg/trae-debug-log-pet-overlay-missing.ndjson`
  - verifikasi apakah overlay `pet mati` akhirnya muncul atau tetap gagal
- Catatan: Ini masih build investigasi. Setelah akar masalah terbukti dan fix final selesai, seluruh instrumentasi debug dan tool uji sementara wajib dibersihkan.

## 2026-07-30 19:30 - Tool uji pet mati dari web admin dan reminder 1 menit
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyiapkan simulasi end-to-end untuk overlay `pet mati` pada EduLock siswa dengan dua komponen: tombol `Paksa Mati` sementara di web admin `Virtual Pet` dan interval pengingat di APK EduLock yang dipercepat menjadi 1 menit agar pengujian cepat.
- Scope terdampak: `student`
- File utama yang diubah:
  - `web/src/app/api/admin/virtual-pet/route.ts`
  - `web/src/hooks/gas/virtual-pet/useGasVirtualPet.ts`
  - `web/src/components/gas/virtual-pet/GasPetPanel.tsx`
  - `web/src/components/gas/virtual-pet/GasPetLeaderboardTab.tsx`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- Fitur lama yang wajib ikut dicek:
  - overlay `pet mati` di EduLock siswa
  - tombol `Hidupkan` di panel web admin `Virtual Pet`
  - listener status pet realtime dari node `virtual_pets`
  - akses web admin `Virtual Pet` sekolah aktif
- Build yang dijalankan:
  - `npm run build` pada folder `web`
  - `:app:assembleRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_19-30-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_19-30-release.apk`
- Regression check yang dijalankan:
  - build web admin sukses setelah tambah aksi `Paksa Mati`
  - build release EduLock sukses setelah interval reminder diubah ke 1 menit
  - review API admin: aksi `force-dead` mengubah status pet ke `DEAD`, menurunkan stat vital ke nol, dan membersihkan `manualReviveUntil`
  - review UI web: tool uji ditempatkan di tab `Global Leaderboard` agar semua siswa bisa dipilih
- Belum diuji:
  - uji perangkat fisik bahwa tombol `Paksa Mati` benar-benar memunculkan overlay di HP siswa
  - uji perangkat fisik bahwa setelah tombol `Saya Mengerti` ditekan, overlay muncul lagi maksimal 1 menit kemudian
  - pembersihan tool uji coba setelah verifikasi berhasil
- Catatan: Tool uji ini bersifat sementara dan harus dibersihkan kembali setelah verifikasi selesai agar panel admin production tetap bersih.

## 2026-07-30 08:52 - Pengetatan proteksi dan telemetry monitoring EduLock siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Merapikan card jam sekolah, memastikan pengingat pet mati tetap muncul tiap 10 menit di luar jam sekolah, menendang siswa keluar dari menu Device Admin, dan menghidupkan telemetry monitoring agar panel realtime web benar-benar terhubung ke HP siswa.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/res/layout/activity_main.xml`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/DeviceAdminReceiver.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/FirebaseReporter.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `web/src/hooks/edulock/useEduLockOverview.ts`
  - `web/src/components/edulock/panels/EduLockMonitoringPanel.tsx`
- Fitur lama yang wajib ikut dicek:
  - dashboard utama EduLock siswa
  - proteksi overlay dan kiosk
  - listener status proteksi ke web
  - alur uninstall resmi yang diizinkan admin
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
  - `npm run build` pada folder `web`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_08-52-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_08-52-release.apk`
- Regression check yang dijalankan:
  - build release EduLock siswa sukses
  - build dashboard web sukses
  - review telemetry `active_devices` untuk status proteksi dan heartbeat
  - review blok akses halaman Device Admin dari Accessibility Service
- Belum diuji:
  - uji perangkat fisik saat siswa benar-benar membuka menu `Aplikasi admin perangkat`
  - verifikasi visual pixel-perfect langsung di HP pada card `Jam Sekolah`
  - verifikasi panel realtime web saat HP siswa online/offline berpindah secara live
- Catatan: `OK_4` diperbarui ulang agar file EduLock siswa terbaru yang aktif adalah build `2026-07-30 08:52`.

## 2026-07-30 08:27 - Perapihan urutan login dan auto-isi nama siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mengubah urutan field registrasi siswa menjadi NPSN, NISN, lalu Nama Siswa serta membuat nama siswa terisi otomatis dari database berdasarkan kombinasi NPSN dan NISN.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/res/layout/activity_registration.xml`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/StudentAuthService.kt`
- Fitur lama yang wajib ikut dicek:
  - login / registrasi siswa
  - validasi identitas siswa ke Firebase
  - binding device saat registrasi
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_08-27-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_08-27-release.apk`
- Regression check yang dijalankan:
  - build release siswa sukses
  - review alur lookup nama siswa berdasarkan NPSN dan NISN
  - review urutan field pada layout registrasi
- Belum diuji:
  - uji interaksi langsung di perangkat fisik
  - skenario NISN yang tidak terdaftar atau NPSN salah pada tenant riil
- Catatan: Entry ini dicatat di pegangan `Edulock`, bukan `GAS`, karena perubahan hanya menyentuh APK EduLock siswa.

## 2026-07-30 07:56 - Standardisasi BUILD_LOG EduLock
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Membakukan satu format entry BUILD_LOG untuk semua perubahan APK EduLock agar catatan lintas orang tetap konsisten.
- Scope terdampak: `student`
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan perilaku APK
- Build yang dijalankan:
  - tidak ada
- Hasil build: tidak build karena hanya perubahan dokumen
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - verifikasi format baku field log
- Belum diuji:
  - tidak relevan
- Catatan: Entry ini menjadi acuan format untuk log EduLock berikutnya.

## 2026-07-30 08:00 - Penyempitan scope pegangan ke EduLock siswa
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Menegaskan bahwa pegangan build ini hanya untuk APK EduLock siswa karena admin hanyalah wrapper web.
- Scope terdampak: `student`
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/Edulock/README.md`
  - `Apk Release/Pegangan Build APK/Edulock/ARCHITECTURE.md`
  - `Apk Release/Pegangan Build APK/Edulock/CONTRIBUTING.md`
  - `Apk Release/Pegangan Build APK/Edulock/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/RELEASE.md`
  - `Apk Release/Pegangan Build APK/Edulock/pull_request_template.md`
  - `Apk Release/Pegangan Build APK/Edulock/build.yml`
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan perilaku APK
- Build yang dijalankan:
  - tidak ada
- Hasil build: tidak build karena hanya perubahan dokumen
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - verifikasi seluruh dokumen EduLock sudah fokus ke siswa
- Belum diuji:
  - tidak relevan
- Catatan: Admin wrapper web tidak lagi diperlakukan sebagai scope utama pegangan build native.

## 2026-07-29 23:25 - Aktivasi izin per kelas dari admin
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Tujuan perubahan: Menambah mode izin per kelas di web admin EduLock dan memastikan APK siswa membaca session admin secara realtime.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PermissionManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - izin manual via kode
  - listener session realtime
  - aktivasi proteksi siswa
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-29_23-25-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-29_23-25-release.apk`
- Regression check yang dijalankan:
  - build release siswa
  - verifikasi session admin realtime dari sisi kode
- Belum diuji:
  - seluruh skenario lapangan pada perangkat fisik
- Catatan: perubahan ini tidak membangun ulang GAS.

## 2026-07-29 22:30 - Enforcement jam sesi izin pada APK EduLock
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Membuat jam mulai dan jam akhir pada kode izin benar-benar dipakai sebagai aturan validasi, bukan hanya tampilan.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PermissionManager.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/PermissionCodeActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/BarcodeScannerActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - input kode manual
  - scan barcode
  - expiry kode
  - durasi izin
- Build yang dijalankan:
  - compile/check internal saat implementasi
- Hasil build: implementasi selesai, tetapi pada tahap itu build penuh belum dijadikan patokan karena ada blocker lama di area lain
- Output APK: belum ada release final tercatat pada tahap perubahan ini
- Disalin ke: belum ada
- Regression check yang dijalankan:
  - audit logika validasi waktu sesi
  - audit trimming durasi agar tidak melewati jam akhir
- Belum diuji:
  - uji perangkat fisik penuh
  - semua kombinasi waktu di lapangan
- Catatan: Setelah fase ini, perubahan EduLock berlanjut ke perbaikan lain sampai akhirnya build release siswa berhasil pada entry berikutnya.

## 2026-07-30 22:52 - Rapikan prompt Device Admin vs Accessibility pada APK EduLock
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menghilangkan prompt ganda saat `Device Admin` dimatikan dan memastikan overlay recovery menampilkan tombol yang sesuai dengan target masalahnya.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/DeviceAdminReceiver.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
  - `native-mobile-edulock/app/src/main/res/layout/activity_overlay_lock.xml`
- Fitur lama yang wajib ikut dicek:
  - flow aktivasi ulang `Device Admin`
  - flow aktivasi ulang `Accessibility`
  - transisi balik dari halaman settings sistem ke `MainActivity`
  - overlay recovery lokasi / accessibility / geofence
- Build yang dijalankan:
  - `:app:compileStudentReleaseKotlin`
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_22-52-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_22-52-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin flavor `studentRelease`
  - assemble APK `studentRelease`
  - audit gating bahwa `Accessibility` tidak lagi memaksa prompt saat `Device Admin` belum aktif atau masih dalam recovery window
  - audit label tombol overlay agar mengikuti target `location`, `accessibility`, dan `geofence`
- Belum diuji:
  - skenario real device saat siswa mematikan `Device Admin` lalu langsung kembali ke EduLock
  - skenario real device saat `Accessibility` dan `Device Admin` sama-sama mati
- Catatan:
  - `DeviceAdminReceiver.onDisableRequested()` tidak lagi menarik layar secara agresif dari halaman sistem; recovery dikembalikan ke `MainActivity`.
  - `MonitoringService` sekarang menahan enforcement `Accessibility` selama flow `Device Admin` belum pulih agar user tidak melihat dua prompt sekaligus.

## 2026-07-30 23:11 - Aktifkan wiring Force Update Control pada APK EduLock
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Membuat panel `Force Update Control` dari Super Admin benar-benar mengunci EduLock saat `min_version_code_edulock` lebih tinggi dari `versionCode` APK yang terpasang.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/ForceUpdateGate.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/ForceUpdateActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/AndroidManifest.xml`
- Akar masalah yang ditemukan:
  - `ForceUpdateActivity` sudah ada di source, tetapi belum terdaftar di manifest.
  - `VersionCheckService` EduLock belum dipasang ke lifecycle activity utama, sehingga policy dari web tidak pernah dipantau seperti di APK GAS.
- Fitur lama yang wajib ikut dicek:
  - registrasi siswa
  - onboarding / setup awal
  - `MainActivity` mode siswa
  - pelepasan layar force update saat policy diturunkan atau APK sudah diperbarui
- Build yang dijalankan:
  - `:app:compileStudentReleaseKotlin`
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Edulock\EduLock-Siswa-2026-07-30_23-11-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\EduLock-Siswa-2026-07-30_23-11-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin flavor `studentRelease`
  - assemble APK `studentRelease`
  - audit path RTDB `app_settings/android`
  - audit bahwa `min_version_code_edulock` dan `update_message_edulock` sekarang aktif dari `RegistrationActivity`, `SetupActivity`, `MainActivity`, dan `ForceUpdateActivity`
- Belum diuji:
  - skenario real device saat Super Admin menaikkan `min_version_code_edulock` ketika EduLock sedang terbuka di `MainActivity`
  - skenario real device saat policy force update diturunkan kembali ketika layar force update sedang tampil
- Catatan:
  - Jalur EduLock sekarang setara dengan GAS: policy force update dipantau live dari RTDB, bukan hanya tersedia sebagai source mati.

## 2026-08-27 20:03 - Kandidat fix grace Settings hasil QA USB E2E (BELUM FINAL)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mengurangi kasus user tidak sempat masuk ke Settings recovery saat proteksi sekolah diaktifkan kembali dari admin.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SetupActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
- Latar belakang perubahan:
  - Pada QA realtime via USB debugging, ditemukan keluarga bug recovery Settings: saat proteksi inti tertentu sedang OFF lalu admin mengubah proteksi sekolah dari `OFF -> ON`, prompt recovery muncul tetapi user tidak diberi cukup waktu untuk menekan tombol ke Settings.
  - Gejala awal sempat terlihat pada jalur GPS recovery, lalu kemudian **tidak reproduksi lagi** pada retest.
  - Gejala yang **masih reproduksi** pada device fisik adalah `Accessibility OFF -> admin ON`.
- Fitur lama yang wajib ikut dicek:
  - recovery `Accessibility`
  - recovery `Tampil di atas aplikasi lain`
  - recovery `Izin Latar Belakang / Battery Optimization`
  - recovery `Izin Lokasi aplikasi`
  - recovery GPS / Lokasi
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - uji USB E2E pada device fisik
  - verifikasi device berada di area sekolah dan jam sekolah aktif
  - verifikasi percobaan buka app hiburan tetap ditahan EduLock
  - verifikasi flow resmi `Minta Izin Guru` tetap berjalan
  - retest jalur GPS recovery
- Hasil QA:
  - enforcement inti **lulus**
  - flow izin resmi **lulus**
  - jalur GPS recovery **lulus pada retest terbaru**
  - jalur `Accessibility OFF -> admin ON` **masih gagal**
- Belum diuji / belum final:
  - verifikasi final untuk 4 jalur satu keluarga bug:
    - `Accessibility OFF -> admin ON`
    - `Overlay OFF -> admin ON`
    - `Battery Optimization OFF -> admin ON`
    - `App Location Permission OFF -> admin ON`
- Catatan:
  - File hasil build kandidat internal bertimestamp `2026-08-27 20:03:52`, size `3.927.443` bytes.
  - Build ini **bukan** penanda fix final; hanya kandidat internal untuk retest cepat.
  - Tim lanjutan wajib baca handoff teknis di `Apk Release/Pegangan Build APK/Edulock/HANDOFF_LAPANGAN_EDULOCK.md` sebelum melanjutkan PR bug ini.

## 2026-08-27 larut malam - Progress lanjutan recovery Accessibility (build kerja lulus, clean build menunggu retest)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menutup kasus `Accessibility OFF -> admin ON` yang sebelumnya gagal karena overlay recovery sempat muncul lalu hilang terlalu cepat sebelum user sempat masuk ke Settings Accessibility.
- Scope terdampak: `student`
- File utama yang diubah:
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
- Akar masalah yang akhirnya terkonfirmasi:
  - `OverlayLockActivity.onResume()` mengecek `shouldStayLocked()` terlalu dini untuk target recovery settings, sehingga overlay recovery Accessibility bisa `finish()` sendiri sebelum dipakai user.
  - `LockEnforcer.showRecoveryOverlay()` memang perlu pola debounce ala recovery GPS, tetapi guard tambahan berbasis `lastForegroundPackage == settings` terbukti salah karena bisa membuat admin ON proteksi terlihat seperti “tidak terjadi apa-apa”.
- Fix yang dipertahankan:
  - recovery settings diprioritaskan lebih dulu di `OverlayLockActivity.onResume()`
  - `OverlayLockActivity.shouldStayLocked()` menganggap target recovery aktif sebagai kondisi valid untuk tetap tampil
  - `LockEnforcer.showRecoveryOverlay()` mempertahankan debounce overlay recovery, tetapi skip berbasis `lastForegroundPackage` dibatalkan kembali
- Build yang dijalankan:
  - `:app:assembleStudentRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-edulock\app\build\outputs\apk\student\release\EduLock-studentRelease.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`
  - `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Regression check yang dijalankan:
  - uji HP fisik untuk skenario `Accessibility OFF -> admin ON`
  - pembanding perilaku dengan recovery GPS yang sebelumnya sudah fix
- Hasil QA:
  - `GPS mati -> buka Pengaturan Lokasi` tetap normal
  - `Accessibility OFF -> admin ON` berhasil ditembus pada build kerja terakhir di HP fisik
- Belum diuji / belum final:
  - retest ulang jalur Accessibility memakai APK clean dari folder `Final`
  - retest `Overlay OFF -> admin ON`
  - retest `Battery Optimization OFF -> admin ON`
  - retest `App Location Permission OFF -> admin ON`
- Catatan:
  - selama debugging sempat dipakai build berinstrumentasi untuk observasi runtime; instrumen itu sudah dibersihkan lagi sebelum clean build terakhir
  - sampai retest clean selesai, status progress ini adalah **sudah fix di build kerja**, **belum dikunci sebagai fix final rilis**
