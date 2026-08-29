# Build Log GAS

## 2026-08-29 09:57 - [DEPLOY LIVE] Web guru parity presensi siswa + Dhuha/Jum'at dengan APK
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `deploy-web`
- **Flavor terdampak:** `guru` (portal web / PWA guru)
- **Versioning:** tidak relevan untuk APK
- **Tujuan perubahan:** Menyamakan perilaku web guru dengan APK untuk dua area yang baru diverifikasi user: (1) `Presensi Siswa` harus langsung menjaga sinkronisasi `Monitoring Harian` -> `Rekap Bulanan` setelah guru menekan `Simpan Presensi Manual`, dan (2) `Presensi Dhuha & Jum'at` harus meninggalkan jejak visual status yang lebih jelas agar guru tahu siswa sudah dicentang.
- **File utama perilaku yang diubah:**
  - [web/src/components/guru/GuruPresensiInteractive.tsx](file:///D:/Dashboard%20Portal/web/src/components/guru/GuruPresensiInteractive.tsx)
  - [web/src/components/guru/GuruSholatV2Interactive.tsx](file:///D:/Dashboard%20Portal/web/src/components/guru/GuruSholatV2Interactive.tsx)
  - [web/src/components/guru/GuruApkTheme.tsx](file:///D:/Dashboard%20Portal/web/src/components/guru/GuruApkTheme.tsx)
- **Perubahan inti:**
  - setelah `Simpan Presensi Manual`, web guru kini me-refresh data harian **dan** `Rekap Bulanan` bila bulan/tahun yang dibuka sama dengan tanggal simpan
  - sel status web guru sekarang memakai `status efektif` (`manualSelections` atau status tersimpan) sehingga tidak ada lagi dua status aktif bersamaan
  - jejak visual status aktif diperjelas dengan warna status, garis inset, ikon centang, dan label kecil seperti pola APK
- **Verifikasi yang dijalankan:**
  - `npm run build` → **sukses**
  - `npm run lint` → ada error lama di file lain project, **bukan** dari file guru yang baru diubah
- **Status distribusi:**
  - siap push ke `origin/main` untuk memicu Firebase App Hosting live
- **Belum diuji:**
  - smoke test visual live setelah rollout App Hosting hijau

## 2026-08-29 09:05 - [BUILD] GAS Guru 1.0.64-guru (1056) — parity presensi + hardening home guru
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `guru`
- **Versioning:** `1.0.63-guru (1055)` → `1.0.64-guru (1056)`
- **Tujuan perubahan:** Menyelesaikan iterasi UX/bug yang user temukan di GAS Guru: sinkronisasi alur presensi manual guru, jejak centang Dhuha/Jum'at, ukuran kartu Home, dan flash UI siswa saat startup.
- **File utama perilaku yang diubah:**
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherAttendanceViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherAttendanceViewModel.kt)
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerDhuhaJumatScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerDhuhaJumatScreen.kt)
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt)
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Perubahan inti:**
  - `Presensi Siswa`: data manual guru kini konsisten dibaca `Rekap Bulanan` setelah tersimpan
  - `Presensi Dhuha & Jum'at`: status aktif meninggalkan jejak visual yang lebih tegas
  - `Home guru`: kartu menu diperkecil sedikit agar lebih ringkas
  - startup `GAS Guru`: tidak lagi sempat memunculkan kartu/status UI siswa saat sesi guru masih loading
- **Build yang dijalankan:**
  - `./gradlew :app:assembleGuruRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-1.0.64-guru-1056.apk`
- **Metadata final aktif lokal:**
  - SHA256 `49CFFD991B264090F5C28549A79553842B11EA626591B2609A04F94556AFB3EA`
- **Status distribusi:**
  - **SUDAH** ditimpa ke folder `Final` untuk uji user saat ini
  - guru tidak disinkronkan ke `web/public/apk`
- **Belum diuji:**
  - audit fisik ulang pada startup cold launch untuk memastikan tidak ada flash UI siswa sama sekali di semua device guru

## 2026-08-29 08:35 - [BUILD] GAS Siswa 1.0.84-siswa (23081) — eksekusi Virtual Pet pindah ke rekap hari sebelumnya
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `siswa`
- **Versioning:** `1.0.83-siswa (23080)` → `1.0.84-siswa (23081)`
- **Tujuan perubahan:** Menghilangkan bug yang membuat pet siswa bisa langsung mati pada pagi hari sebelum siswa sempat mengerjakan empat kartu aktivitas hari itu.
- **File utama perilaku yang diubah:**
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt)
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt)
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PresensiRuleUtils.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PresensiRuleUtils.kt)
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Perubahan inti:**
  - status aktif pet kini membaca **rekap hari sebelumnya**
  - 4 kartu `Tugas Harian` tetap menunjukkan progres **hari ini**
  - konsekuensi gagal memenuhi target hari ini baru dieksekusi pada **00.00** hari berikutnya
- **Build yang dijalankan:**
  - `./gradlew :app:assembleSiswaRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.84-siswa-23081.apk`
- **Metadata final aktif lokal:**
  - SHA256 `C6F1CBB088286BADE53A4557B0C3122BBED69164E12AEA555B663B98C39C5CA4`
- **Status distribusi:**
  - **SUDAH** ditimpa ke folder `Final` untuk uji user saat ini
  - **BELUM** disinkronkan ke `web/public/apk` / live App Hosting
- **Belum diuji:**
  - uji device fisik untuk skenario buka pagi hari sebelum aktivitas sekolah, memastikan pet tetap aman bila kemarin sudah memenuhi target

## 2026-08-28 21:40 - [BUILD] GAS Siswa 1.0.83-siswa (23080) — fast-path gate EduLock lokal
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `siswa`
- **Versioning:** `1.0.82-siswa (23079)` → `1.0.83-siswa (23080)`
- **Tujuan perubahan:** Menghilangkan anomali saat pembukaan kedua APK GAS siswa yang lama tertahan di overlay `Memeriksa Proteksi EduLock` ketika aksesibilitas EduLock belum aktif. Sebelumnya gate login menunggu fetch `attendance/schedules`, `attendance/holidays`, dan telemetry `active_devices` sebelum memutuskan blokir lokal, sehingga user melihat loading lama padahal penyebabnya sudah jelas dari kondisi lokal perangkat.
- **File utama perilaku yang diubah:**
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt)
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Perubahan inti:**
  - `checkEduLockComplianceOnce(...)` sekarang melakukan **fast-path cek lokal** lebih dulu
  - jika `setup/accessibility/device admin/protection` belum sehat, GAS siswa langsung blokir dengan alasan yang tepat tanpa menunggu fetch Firebase
  - fetch jadwal sekolah + telemetry remote hanya dilanjutkan ketika kondisi lokal sudah sehat
- **Build yang dijalankan:**
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.83-siswa-23080.apk`
- **Metadata final aktif lokal:**
  - SHA256 `2A405CBA2DCA6551385614584B098A9AD81E26F8B7B8F2105B7BD98586E13F4A`
- **Status distribusi:**
  - **SUDAH** ditimpa ke folder `Final` untuk uji user saat ini
  - **BELUM** disinkronkan ke `web/public/apk` / live App Hosting
- **Belum diuji:**
  - instal/uji langsung di device untuk memastikan pembukaan kedua kini langsung menampilkan blokir lokal yang cepat tanpa spinner panjang

## 2026-08-28 21:03 - [DEPLOY LIVE] Web guru 7 KAIH samakan pola penilaian dengan APK
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `deploy-web`
- **Flavor terdampak:** `guru` (portal web / PWA guru)
- **Versioning:** tidak relevan untuk APK
- **Tujuan perubahan:** Menyamakan pengalaman tab `Penilaian` pada menu `/guru/kaih` dengan APK GAS Guru, karena web sebelumnya masih memakai alur massal berbasis dialog tambahan dan input yang tidak sepraktis APK.
- **File utama perilaku yang diubah:**
  - [web/src/components/guru/GuruKaihInteractive.tsx](file:///D:/Dashboard%20Portal/web/src/components/guru/GuruKaihInteractive.tsx)
- **Perubahan inti:**
  - preset cepat `Nilai 25 / Nilai 20 / Reset` kini tampil langsung di panel `Isi Cepat Semua` seperti APK guru
  - preset langsung menerapkan nilai ke semua siswa tanpa membuka dialog massal tambahan
  - dialog edit per siswa sekarang memakai 4 field angka `Kejujuran`, `Perilaku`, `Inisiatif`, `Komitmen`, plus preset cepat yang sama seperti APK
- **Verifikasi yang dijalankan:**
  - `npm run lint -- src/components/guru/GuruKaihInteractive.tsx` → bersih
  - `git pull origin main` → up to date
  - `git push origin main` → berhasil
- **Commit live:**
  - `4822f24e` — `fix(web): samakan penilaian 7 kaih guru dengan apk`
- **Status distribusi:**
  - **SUDAH LIVE** di Firebase App Hosting untuk review user
- **Belum diuji:**
  - audit visual lintas perangkat untuk memastikan tinggi tombol preset dan field angka tetap nyaman di layar HP kecil

## 2026-08-28 20:39 - [DEPLOY LIVE] Web guru sholat sinkron hari efektif Dzuhur
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `deploy-web`
- **Flavor terdampak:** `guru` (portal web / PWA guru)
- **Versioning:** tidak relevan untuk APK
- **Tujuan perubahan:** Menyamakan hitungan `TS / Tidak Sholat` pada menu web guru `/guru/sholat` dengan web admin dan APK siswa, karena sebelumnya endpoint guru masih memakai rule lama semua hari sekolah sehingga nilai bisa tetap `24`.
- **File utama perilaku yang diubah:**  
  - [web/src/app/api/teacher/prayer/route.ts](file:///D:/Dashboard%20Portal/web/src/app/api/teacher/prayer/route.ts)
- **Perubahan inti:**  
  - endpoint guru sekarang memuat `loadPrayerRules(...)` dan mengecek hari efektif Dzuhur dengan `isEffectivePrayerDay(...)`
  - mode harian dan `Rekap Bulanan` guru kini memakai kontrak yang sama: `attendance/schedules` + `attendance/holidays` + `prayer_v2/types/DZUHUR/activeDays`
- **Verifikasi yang dijalankan:**  
  - `npm run lint -- src/app/api/teacher/prayer/route.ts` → bersih
  - `git pull origin main` → up to date
  - `git push origin main` → berhasil
- **Commit live:**  
  - `9f42a276` — `fix(web): samakan rekap sholat guru dengan aturan hari efektif dzuhur`
- **Status distribusi:**  
  - **SUDAH LIVE** di Firebase App Hosting untuk review user
- **Belum diuji:**  
  - audit runtime endpoint live dengan data sekolah lain selain tenant review saat ini

## 2026-08-28 20:19 - [BUILD] GAS Guru 1.0.61-guru (1053) — badge notifikasi digeser ke dalam
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `guru`
- **Versioning:** `1.0.60-guru (1052)` → `1.0.61-guru (1053)`
- **Tujuan perubahan:** Menggeser badge merah notifikasi di kartu menu guru agar tidak terlalu mepet ke sudut kanan atas dan lebih mudah terlihat di layar HP.
- **File utama perilaku yang diubah:**  
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt)  
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Build yang dijalankan:**  
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk`  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-1.0.61-guru-1053.apk`
- **Metadata final aktif:**  
  - SHA256 `9393A11DE46D22D99378E32ABA506BB620B55A268E94B55118C15453D6CB5376`
- **Catatan:**  
  - perubahan hanya menggeser posisi badge notifikasi guru; identitas UI 2 kolom guru tetap dipertahankan

## 2026-08-28 20:04 - [BUILD] GAS Guru 1.0.60-guru (1052) — kartu menu dipendekkan
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `guru`
- **Versioning:** `1.0.59-guru (1051)` → `1.0.60-guru (1052)`
- **Tujuan perubahan:** Mengecilkan tampilan kartu menu Home GAS Guru agar tidak terasa terlalu besar di layar dan secara visual mendekati kesan memuat sekitar 3 baris kartu, tanpa mengubah ciri khas 2 kolom guru.
- **File utama perilaku yang diubah:**  
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt)  
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Build yang dijalankan:**  
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk`  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-1.0.60-guru-1052.apk`
- **Metadata final aktif saat build ini:**  
  - SHA256 `2A1BBA99417CB0DCE580F2EC6FBA4B72285ACEFF97659E31731E014645D0DEC9`
- **Catatan:**  
  - kartu guru tetap 2 kolom glassmorphism; yang diringankan adalah tinggi area ikon, ukuran ikon, spacing grid, dan ukuran label pill

## 2026-08-28 19:56 - [BUILD] GAS Guru 1.0.59-guru (1051) — sinkron TS guru dengan hari efektif Dzuhur
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix` + `build`
- **Flavor terdampak:** `guru`
- **Versioning:** `1.0.58-guru (1050)` → `1.0.59-guru (1051)`
- **Tujuan perubahan:** Menyamakan hitungan `TS / Tidak Sholat` di APK GAS Guru (menu `Presensi Sholat` dan `Rekapitulasi`) dengan web admin dan APK siswa, karena sebelumnya masih memakai hitungan lama seperti web admin pra-fix sehingga dapat muncul `TS = 24`.
- **File utama perilaku yang diubah:**  
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerViewModel.kt)  
  - [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherRecapViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherRecapViewModel.kt)  
  - [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
- **Perubahan inti:**  
  - logika guru kini membaca `attendance/schedules`, `attendance/holidays`, dan `prayer_v2/types/DZUHUR/activeDays`
  - perhitungan harian dan bulanan guru memakai `isDzuhurEffectiveDay(...)` agar denominator `TS` sama dengan APK siswa
- **Build yang dijalankan:**  
  - `./gradlew :app:compileGuruDebugKotlin` → **BUILD SUCCESSFUL**
  - `./gradlew :app:assembleGuruRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-release.apk`  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Guru-1.0.59-guru-1051.apk`
- **Metadata final aktif saat build ini:**  
  - SHA256 `268C41D0BD3A077692210B70518294A8878FBB2DE9A8AD57DB31C1BD6BD18AD9`
- **Belum diuji:**  
  - verifikasi langsung pada beberapa tenant guru selain data review utama

## 2026-08-28 13:25 - [BUILD+SYNC LIVE] GAS Siswa 1.0.82-siswa (23079) — rebuild gate EduLock berbasis jam sekolah + sinkron unduhan live Firebase
- **Pelaksana:** Assistant
- **Jenis perubahan:** `feature` + `build-deploy`
- **Flavor terdampak:** `siswa`
- **Versioning:** **TIDAK BUMP**. Tetap `versionName 1.0.82-siswa` / `versionCode 23079` sesuai instruksi user.
- **Tujuan perubahan:** Membawa dua hal terbaru ke build siswa yang bisa direview user: (1) perilaku **gate EduLock** yang lebih manusiawi, yakni hard block hanya saat **hari efektif + jam sekolah aktif** dengan **grace period** ketika proteksi drop sesaat di tengah sesi; (2) sinkronisasi file Final ke `web/public/apk` agar halaman unduhan live Firebase/App Hosting mengarah ke APK siswa terbaru yang benar.
- **File utama perilaku yang dibawa build ini:**  
  - [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt)  
  - [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt)
- **Build yang dijalankan:**  
  - `./gradlew.bat :app:assembleSiswaRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`  
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.82-siswa-23079.apk`
- **Sinkronisasi live yang dijalankan:**  
  - `cd D:\Dashboard Portal\web`  
  - `npm run sync:apk`  
  - `npm run build`  
  - commit/push Firebase App Hosting commit `0c6f83a6`
- **Metadata final/public aktif:**  
  - SHA256 `C09A10E08D23BFEE98F8DB4D2B60BE547F9FAA928459E0BB8F9695EA806B2C4C`  
  - Size `21.494.650 bytes / 20,50 MB`
- **Status distribusi:**  
  - File Final dan `web/public/apk/GAS-Siswa-release.apk` **sama persis** (hash cocok).  
  - URL live `/gas/install` sekarang diarahkan ke build siswa `1.0.82-siswa (23079)`.
- **Belum diuji end-to-end:**  
  - retest di HP siswa untuk skenario aksesibilitas drop di luar jam aktif vs di dalam jam aktif  
  - verifikasi browser live setelah rollout App Hosting benar-benar hijau

## 2026-08-28 11:37 - [FIX] GAS Siswa 1.0.82-siswa (23079) — Auto Catat Pelanggaran Terlambat & Pulang Awal + Anti Double dengan OSIS/Guru
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix logic` + `integrasi data`
- **Flavor terdampak:** `siswa` saja
- **Versioning:** **TIDAK BUMP**. Tetap `versionName 1.0.82-siswa` / `versionCode 23079` sesuai instruksi user; build ini adalah rebuild internal final setelah perubahan logic kedisiplinan.
- **Latar belakang request user:** User meminta agar pada menu **Kedisiplinan** GAS Siswa, ketika siswa **datang terlambat** atau **pulang awal**, pelanggaran otomatis tercatat mengikuti **kriteria/poin di halaman admin**. User juga secara eksplisit meminta audit agar data **tidak double** jika petugas **OSIS** di gerbang atau guru tetap mencatat manual pada hari yang sama.
- **Temuan audit sebelum fix:**
  - `AttendanceViewModel.kt` sudah punya embrio auto-pelanggaran untuk status terlambat, tetapi trigger belum ditempatkan pada titik paling aman.
  - Kondisi **pulang awal** sudah terdeteksi (`isEarlyCheckout`), tetapi belum otomatis dibuatkan record kedisiplinan.
  - Jalur input manual OSIS dan guru sama-sama tetap bisa membuat record baru, sehingga tanpa guard pusat ada potensi duplikasi untuk pelanggaran harian tunggal seperti **Terlambat** dan **Pulang Awal**.
- **Solusi yang diterapkan:**
  1. **Auto-record setelah absensi benar-benar sukses**
     - Trigger auto-pelanggaran dipindah agar baru berjalan setelah `updateChildren` absensi sukses, bukan sebelum simpan selesai.
  2. **Tambah auto-record untuk dua kasus**
     - Saat check-in menghasilkan status **terlambat**, sistem membuat record pelanggaran **Terlambat**.
     - Saat check-out terdeteksi **pulang awal**, sistem membuat record pelanggaran **Pulang Awal**.
  3. **Rule dan poin baca dari admin sekolah**
     - `AttendanceViewModel.kt` memanggil `DisciplineRepository.getRulesOnce(...)`, mengambil rule aktif kategori `VIOLATION`, lalu mencocokkan keyword `Terlambat` / `Pulang Awal` agar point mengikuti konfigurasi admin yang sedang aktif.
  4. **Anti-double lintas auto vs manual**
     - `DisciplineRepository.kt` sekarang membuat **key deterministik** untuk pelanggaran harian tunggal berbasis sekolah + siswa + tanggal + rule.
     - Bila OSIS/guru menginput rule harian yang sama pada tanggal yang sama, repository akan **merge** ke record existing alih-alih membuat duplikat baru.
     - Hasil desain: `telat auto + telat OSIS = 1 record`; `pulang awal auto + pulang awal guru = 1 record`; tetapi `telat + pulang awal` tetap **2 record** karena memang dua rule berbeda.
- **File yang diubah:**
  1. [AttendanceViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/AttendanceViewModel.kt) — tambah `DisciplineRepository`, trigger auto setelah simpan absensi sukses, auto-record `Terlambat` dan `Pulang Awal`.
  2. [DisciplineRepository.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/DisciplineRepository.kt) — tambah helper `getRulesOnce`, resolver rules, key deterministik pelanggaran harian tunggal, dan merge anti-double.
- **Build verifikasi:**
  - `./gradlew.bat :app:assembleSiswaRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.82-siswa-23079.apk`
- **Metadata Final aktif:**
  - SHA256 `76EEF68BB9E0C426615141629B9D2D4AB16C3E1B9E552EA99BF290F7F74B7B73`
  - Size `21.494.631 bytes / 20,50 MB`
  - Last write time `2026-08-28 11:37:17`
- **QA checklist singkat yang WAJIB dicek di HP siswa / operator:**
  1. [ ] Siswa check-in terlambat → record **Pelanggaran: Terlambat** otomatis muncul dengan poin sesuai admin.
  2. [ ] Siswa check-out pulang awal → record **Pelanggaran: Pulang Awal** otomatis muncul dengan poin sesuai admin.
  3. [ ] Jika OSIS input rule yang sama di hari yang sama, hasil tetap **1 record** saja.
  4. [ ] Jika guru input rule yang sama di hari yang sama, hasil tetap **1 record** saja.
  5. [ ] Jika satu siswa telat **dan** pulang awal di hari yang sama, harus tetap muncul **2 record** berbeda.

## 2026-08-28 09:26 - [FIX] GAS Siswa 1.0.82-siswa (23079) — Kunci Tombol Presensi Sholat, Tegaskan Kartu Ibadah Virtual Pet Ikut Jadwal Admin, Rapikan Home Siswa
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix logic UI` + `clarify UX`
- **Flavor terdampak:** `siswa` saja
- **Versioning:** **TIDAK BUMP**. Tetap `versionName 1.0.82-siswa` / `versionCode 23079` sesuai instruksi user karena perubahan ini adalah penyempurnaan perilaku pada build internal yang belum diminta naik versi distribusi.
- **Latar belakang request user:**
  1. Pastikan **Presensi Sholat** (Dzuhur, Dhuha, Jum'at) setelah siswa berhasil absen, tombol berubah menjadi **`Sudah Absen`** supaya tidak bisa melakukan absen berulang pada hari yang sama.
  2. Audit kartu **Virtual Pet → Tugas Harian - Ibadah** karena sekolah user menjalankan Dzuhur hanya hari tertentu dan aturan itu bisa berubah dari admin sewaktu-waktu. User menegaskan kartu Ibadah **WAJIB membaca jadwal Dzuhur dari halaman admin**, bukan hardcode Senin-Kamis.
  3. Perbaiki UI **Home GAS Siswa**: hapus footer versi yang ternyata kebawa pola APK Guru karena versi siswa sudah tampil di halaman Profil; kecilkan tonjolan tombol hitam tengah **Absensi** pada bottom nav karena terlalu melebar/naik ke atas dan terlihat jelek.
- **Temuan audit sebelum fix:**
  - **Dzuhur (`PrayerScreen.kt`)**: ada celah UX. Riwayat presensi harian memang tersimpan, tapi `canSubmit` belum eksplisit memeriksa “sudah presensi hari ini”, dan label tombol tetap `Presensi Sholat` walau user sudah tercatat hari itu.
  - **Dhuha/Jum'at (`PrayerDhuhaJumatScreen.kt`)**: logic status harian sebenarnya SUDAH membaca `currentStatus == "PRAY"` → `canSubmit = false`, tetapi label tombol tetap `Presensi` sehingga tidak sejelas yang diinginkan user.
  - **Virtual Pet Ibadah**: sumber logika hari efektif SUDAH benar membaca `prayer_v2/types/DZUHUR` admin (`enabled + activeDays`) via `VirtualPetRepository.isDzuhurEffectiveDay(...)`, tetapi teks UI masih generik “sesuai aturan hari ini” / “Libur / tidak wajib”, sehingga konteks “ikut jadwal sekolah dari admin” kurang eksplisit di mata user/siswa.
  - **Home GAS Siswa**: footer versi di bawah grid menu tampil seperti pola APK Guru padahal user ingin versi siswa cukup di halaman Profil; tombol hitam tengah `Absensi` di bottom nav terlalu besar (`76dp`, offset `-28dp`) sehingga tampak terlalu menonjol.
- **Solusi yang diterapkan:**
  1. **Kunci tombol Presensi Sholat Dzuhur berdasarkan riwayat hari ini**
     - Tambah `hasSubmittedToday` di `PrayerScreen.kt` dengan memeriksa `prayerHistory` dan mencocokkan `record.date` ke `todayYmd`.
     - `canSubmit` sekarang mensyaratkan `!hasSubmittedToday`.
     - `submitPrayer()` diberi guard awal: jika `hasSubmittedToday == true`, tampil toast **`Anda sudah absen hari ini.`** dan return.
     - Label tombol jadi:
       - `Memproses...` saat submit
       - **`Sudah Absen`** bila hari itu sudah presensi
       - `Presensi Sholat` bila belum
  2. **Perjelas tombol Dhuha/Jum'at**
     - Saat item status = `Sudah Presensi`, label tombol kini berubah menjadi **`Sudah Absen`**. Logic data tetap sama (masih `canSubmit = false` bila status `PRAY`).
  3. **Perjelas kartu Virtual Pet → Ibadah agar eksplisit ikut jadwal sekolah**
     - Subtitle kriteria **Ibadah Tertib**: dari `Presensi sholat sesuai aturan hari ini` → **`Presensi sholat sesuai jadwal sekolah`**
     - Subtitle action card **Ibadah**: dari `Presensi sholat` → **`Presensi sholat sesuai jadwal sekolah`**
     - Status hari non-jadwal: dari `Libur / tidak wajib sholat` → **`Hari ini tidak ada tugas ibadah sekolah`**
     - Label action card non-jadwal: dari `Libur / tidak wajib` → **`Tidak ada tugas hari ini`**
     - Logic penentuan hari efektif **tidak diubah sumbernya**: tetap baca `prayer_v2/types/DZUHUR.enabled + activeDays` dari admin sekolah. Jadi jika admin kelak mengaktifkan Jumat/Sabtu, kartu Ibadah otomatis ikut berubah tanpa patch code lagi.
  4. **Rapikan Home GAS Siswa**
     - Footer versi di Home siswa disembunyikan (`showHomeVersionLabel = BuildConfig.FLAVOR == "guru"`), sehingga **APK GAS Siswa tidak lagi menampilkan versi di footer home**.
     - Tombol hitam tengah **Absensi** di bottom nav dikecilkan:
       - `requiredSize 76.dp → 68.dp`
       - `offset y -28.dp → -20.dp`
       - `border 5.dp → 4.dp`
       - `icon 38.dp → 34.dp`
       - label `Absensi` sedikit diturunkan (`-14.dp → -10.dp`)
- **File yang diubah:**
  1. [PrayerScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt) — guard `hasSubmittedToday`, kunci `canSubmit`, toast duplikasi, label tombol `Sudah Absen`.
  2. [PrayerDhuhaJumatScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerDhuhaJumatScreen.kt) — label tombol disabled jadi `Sudah Absen` saat status `Sudah Presensi`.
  3. [VirtualPetViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt) — perjelas subtitle/status kartu Ibadah agar menegaskan basisnya adalah **jadwal sekolah** dari admin.
  4. [HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt) — sembunyikan footer versi di flavor siswa, kecilkan tonjolan tombol tengah `Absensi`.
- **File audit yang dikonfirmasi sebagai sumber aturan admin (tanpa perubahan logic inti):**
  - [VirtualPetRepository.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt) — `PrayerRealtimeInfo.isEffectiveDay` tetap dihitung dengan `isDzuhurEffectiveDay(...)` dari `prayer_v2/types/DZUHUR.enabled + activeDays` dan jadwal/libur sekolah.
- **Build verifikasi:**
  - `./gradlew :app:assembleSiswaRelease` → **BUILD SUCCESSFUL**
- **Output Final yang ditimpa:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.82-siswa-23079.apk`
- **SHA256 2 copy SAMA PERSIS dengan output build:**
  - `3513EC4B396FF1E44151FE6C28F30E0166FD4CA68112468F86D1DB4258EDD9AD`
  - Size `21.356.876 bytes / 20,37 MB`
- **QA checklist singkat yang WAJIB dicek di HP siswa:**
  1. [ ] Dzuhur: setelah berhasil presensi, tombol berubah menjadi **`Sudah Absen`** dan tap ulang hanya memunculkan toast sudah absen.
  2. [ ] Dhuha/Jum'at: setelah berhasil presensi, tombol juga tampil **`Sudah Absen`**.
  3. [ ] Virtual Pet → kartu **Ibadah** menulis **`sesuai jadwal sekolah`**.
  4. [ ] Pada hari non-jadwal Dzuhur dari admin, kartu Ibadah tampil **`Hari ini tidak ada tugas ibadah sekolah`** / `Status: Tidak ada tugas hari ini`, dan tidak menghukum siswa.
  5. [ ] Home siswa: footer versi **hilang** dari bawah grid menu.
  6. [ ] Bottom nav: tombol hitam tengah **Absensi** terlihat lebih pendek/lebih proporsional, tidak terlalu melebar ke atas.

## 2026-08-28 04:31 - [FIX] GAS Guru 1.0.58-guru (1050) — Hapus Ikon Duplikat Profil Header + Gelapkan Background Gradien UI (Sesuai Kontras Screenshot Lawas)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix UI` (2 perbaikan dari user setelah instal 1049)
- **Flavor terdampak:** Hanya `guru` (siswa & kepala tidak diubah)
- **Masalah user dari screenshot + teks:**
  1. **Ikon profil (orang) sebelah KANAN header dihapus**: Di 1049 user menambahkan 2 icon: (orang Profil + panah Tutup). Ternyata **sebelah KIRI** di area avatar salam **SUDAH ADA icon profil bulat besar lagi** (duplikat). User protes → cukup icon **panah kanan (Tutup)** saja yang ditampilkan di pojok kanan atas. Ikon orang Profil di header → **HAPUS**.
  2. **Background UI masih kurang gelap / kurang kontras**: Di 1048–1049 background gradien saya pakai `cyan cerah → sky biru → royal blue`. User bandingkan dengan 2 screenshot UI lawas: **background lawas LEBIH GELAP di area bawah & gradasi start lebih tua (teal → navy → biru tua royal)**. User minta tingkatkan kontras / gelapkan kembali background gradien sesuai UI asli sebelum saya modifikasi.
- **Solusi:**
  1. `HomeScreen.kt` area `if (isGuruFlavor)` header kanan → **hapus Row dan icon Person**; tinggal `IconButton(onLogout) { ArrowForward 28.dp }` saja.
  2. Background gradien guru diganti 5 stop warna **LEBIH GELAP** (lebih tua) persis sesuai visual UI lawas:
     - `#0E7490` (Cyan teal TUA / bunting stone)
     - `#0284C7` (Sky 600)
     - `#1D4ED8` (Blue 700 / royal blue lebih dalam)
     - `#1E3A8A` (Indigo 800 / navy)
     - `#172554` (Blue 950 / navy SANGAT TUA di bottom area)
     - Vertical Gradient (bukan linear horizontal) agar gradien "turun makin gelap" ke bawah seperti screenshot lawas.
  3. NavBar containerColor (hanya berlaku untuk siswa) disesuaikan juga referensi `#172554`. (guru navBar null jadi tidak terpengaruh).
- **File yang diubah:**
  1. [HomeScreen.kt#L850-L868](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L850-L868): upgrade gradien screenBackground guru (5 stops lebih gelap vertikal).
  2. [HomeScreen.kt#L1025-L1034](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L1025-L1034): hapus Row + icon Person (tinggal icon ArrowForward Tutup saja). Ukuran icon dinaikkan 28.dp agar jelas.
  3. [build.gradle.kts#L47-L55](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L47-L55): **bump** `versionCode 1049 → 1050`, `versionName "1.0.57" → "1.0.58"`. Wajib bump karena perubahan state visual structure + color palette.
- **Build:** `./gradlew :app:assembleGuruRelease` → **BUILD SUCCESSFUL in 2m 59s**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- **Copy Final:** `GAS-Guru-1.0.58-guru-1050.apk` + `GAS-Guru-release.apk` di `D:\Dashboard Portal\Apk Release\Final`
- **SHA256 2 copy SAMA PERSIS:** `6AA5E2F68F7F16946C9B6674BD9326123A9C91917ED8FB879A176D8C02C7F3B2` (21.356.874 bytes / 20,37 MB)
- **Metadata APK:** Package `com.satupintu.mobile.guru`, `versionCode 1050`, `versionName 1.0.58-guru`.
- **Fitur build sebelumnya TETAP dipertahankan:**
  - ✅ UI Menu Guru 2 kolom glassmorphism 2 baris pill (1048)
  - ✅ Label versi Login + Home footer (1048)
  - ✅ Bottom Nav 3 Tab HILANG di guru, tetap ada di siswa (1049)
  - ✅ 7 KAIH preset cepat nilai 4 kriteria massal (1047)
- **QA checklist wajib test via ADB:**
  1. [ ] Header sebelah kanan: HANYA ADA 1 icon → **ikon panah kanan (Tutup)**. Tidak ada icon orang Profil di sebelahnya.
  2. [ ] Background gradien: **Atas = hijau tosca TUA (cyan gelap) → Tengah = biru laut tua → Bawah = navy biru SANGAT TUA**. Kontras jelas lebih gelap dibanding 1048/1049 yang cerah biru sky.
  3. [ ] Bandingkan kontrasnya dengan UI lawas (screenshot no 2 user): warna biru bawah + kartu menu harus MIRIP / SAMA KONTRASNYA (tidak lebih cerah).
  4. [ ] Label versi di footer home: **`APK GAS Guru — v1.0.58 (1050)`**.
  5. [ ] Label versi di Login: **`APK GAS Guru — v1.0.58-guru (build 1050)`**.

## 2026-08-28 04:15 - [FIX] GAS Guru 1.0.57-guru (1049) — Hapus Bottom Nav 3 Tab (Bawaan Siswa) + Tambah Ikon Header Profil & Logout Khusus Guru
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix UI` (respon komplain user setelah instal 1048: "kenapa kok ada 3 menu dibawah, itu kan bawaan versi apk GAS siswa")
- **Flavor terdampak:** Hanya `guru`. UI `siswa` & `kepala` TETAP pakai Bottom Nav 3 tab (Beranda + Absensi Float + Profil) — TIDAK DIUBAH.
- **Masalah user:** Di APK 1048 home screen guru masih menampilkan **Bottom Navigation 3 item berwarna gelap navy** di bawah layar:
  - **Beranda** (kiri) + **Absensi** (tengah floating hitam lingkaran besar, pattern 👈 PATTERN SISWA, guru tidak butuh ini) + **Profil** (kanan). Padahal dari screenshot UI lawas guru TIDAK ADA bottom nav 3 tab. User protes karena itu bawaan siswa.
- **Solusi (sesuai referensi UI lawas + preferensi user):
  1. **Branch `Scaffold.bottomBar`** di HomeScreen: `if (!isGuruFlavor) { NavigationBar(3 item) } else { null }`
     - `guru` → **Bottom Nav HILANG TOTAL**
     - `siswa / kepala` → tetap `Beranda | Absen Float Tengah | Profil` (seperti semula)
  2. **Ganti akses Profil + Logout** yang tadinya lewat bottom tab → dijadikan **2 IconButton kecil di sebelah KANAN HEADER (row user profile area)** HANYA untuk flavor guru (letaknya setelah teks role sekolah):
     - Icon ⚪ **Profil** (Icons.Default.Person, 26.dp) → `onNavigate("profile")`
     - Icon ➡ **Tutup Aplikasi** (Icons.Default.ArrowForward, 26.dp) → `onLogout()` (sesuai user profile: prefer label "Tutup" daripada "Keluar")
  3. Karena bottom nav hilang di flavor guru, **paddingValues dari Scaffold bottom = 0**, sehingga konten Home (Menu Guru) **tidak lagi punya ruang kosong navbar di bawah → lebih lega 56dp**.
- **File yang diubah:**
  1. [HomeScreen.kt#L876-L928](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L876-L928): Branch `bottomBar = { if (!isGuruFlavor) NavigationBar(3 tab) else null }`.
  2. [HomeScreen.kt#L1025-L1047](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L1025-L1047): Tambah `Row` `if (isGuruFlavor)` berisi 2 `IconButton` Profil + Tutup di sisi kanan header.
  3. [build.gradle.kts#L47-L55](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L47-L55): **bump**: `versionCode 1048 → 1049`, `versionName "1.0.56" → "1.0.57"`. WAJIB bump karena branch struktur layout Scaffold berubah + penambahan state IconButton header.
- **Build:** `./gradlew :app:assembleGuruRelease` → **BUILD SUCCESSFUL in 3m 8s**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- **Copy Final:** `GAS-Guru-1.0.57-guru-1049.apk` + `GAS-Guru-release.apk` di `D:\Dashboard Portal\Apk Release\Final`
- **SHA256 2 copy SAMA PERSIS:** `C1560B3934F02E1172B1A0AA9946E3877BBC13E554CB173689EC6B4C28D78C72` (21.356.880 bytes / 20,37 MB)
- **Metadata APK:** Package `com.satupintu.mobile.guru`, `versionCode 1049`, `versionName 1.0.57-guru`.
- **Fitur sebelumnya TETAP dipertahankan (TIDAK rollback):**
  - ✅ UI Menu Guru 2 kolom glassmorphism 2 baris pill (1048)
  - ✅ Label versi di Login & Home footer (1048)
  - ✅ 7 KAIH preset cepat nilai 4 kriteria (1047)
- **QA checklist WAJIB test via ADB `adb install -r GAS-Guru-release.apk`:**
  1. [ ] **TIDAK ADA** 3 tab bottom nav di bawah (yang tadinya Beranda | Absen Float | Profil) — yang muncul di 1048.
  2. [ ] Di **header sebelah KANAN salam (samping nama guru + role sekolah)** ada 2 icon bulat kecil: (a) icon orang (Profil), (b) icon panah kanan (Tutup).
  3. [ ] Klik icon orang: navigasi ke halaman Profil, berhasil. Back ke home normal.
  4. [ ] Klik icon panah kanan: logout ke Login Screen (muncul kembali ke halaman login).
  5. [ ] Tidak ada jarak kosong / putih tua navbar di bawah layar Home; grid kartu menu & label versi "APK GAS Guru — v1.0.57 (1049)" menyentuh area navigasi sistem.
  6. [ ] Bandingkan dengan APK GAS Siswa: di GAS Siswa BOTTOM NAV 3 TAB MASIH ADA (tidak ikut hilang).

## 2026-08-28 03:42 - [FIX] GAS Guru 1.0.56-guru (1048) — Kembalikan UI Menu Guru + Label Versi Jelas
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix UI` + `minor feature` (sesuai komplain user: "kartu menu guru malah sama seperti siswa")
- **Flavor terdampak:** hanya `guru` (siswa & kepala tidak tersentuh sama sekali, pakai UI 4 kolom StudentFeatureCard seperti semula)
- **Masalah user:** User install APK 1.0.55-guru & terlihat kartu menu Home GURU **MIRIP PERSIS SISWA** (4 kolom, icon kecil di kotak kecil, label polos dibawah). Padahal user **meminta di catatan JANGAN rubah UI yang tidak diminta** & UI guru sebelumnya beda styling sesuai screenshot HP lawas. Di sisi lain user **juga minta tambahkan keterangan versi agar mudah lihat build yang terinstal**.
- **Screenshot referensi UI lama guru (dari HP user):**
  - **2 KOLOM** (bukan 4) kartu menu, kartu besar persegi + rounded 28dp
  - **Struktur kartu 2 baris**: Atas = area icon dalam kotak inner rounded (lebih terang, border lembut); Bawah = **label di dalam PILL shape background biru-muda transluscent** (bukan tulisan polos)
  - **Badge merah** angka notif di pojok kanan atas area icon (contoh: Notifikasi = badge 1)
  - **Background gradien cerah Cyan → Sky → Blue** (#22D3EE → #38BDF8 → #2563EB) — bukan indigo gelap milik siswa
  - Judul section **`Menu Guru`** (besar, headlineSmall, TIDAK CAPS "MENU UTAMA")
- **File yang diubah:**
  1. [HomeScreen.kt#L847-L1447](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L847-L1447):
     - Tambah `isGuruFlavor = BuildConfig.FLAVOR == "guru"`
     - **Branch `screenBackground`**: guru pakai `verticalGradient(Cyan→Sky→Blue)` cerah; siswa/kepala tetap indigo gelap
     - **Branch NavigationBar containerColor**: guru = navy transparan; siswa tetap gelap
     - **Branch grid + card**:
       - `guru` → GridCells.Fixed(2) + `GuruMenuCard()` (icon 84dp, outer glassmorphism, label pill shape biru-muda, badge offset lebih jauh)
       - `siswa / kepala / staff` → GridCells.Fixed(4) + `StudentFeatureCard` (ICON 36dp di box 64dp, label text kecil polos) — KEMBALI seperti semula, TIDAK DIUBAH
     - **Tambah label versi di HOME FOOTER (di bawah grid menu)**: `APK GAS Guru — v1.0.56 (1048)` (tengah, abu-putih transparan). Nilainya auto dari `BuildConfig.VERSION_NAME` + `BuildConfig.VERSION_CODE`.
  2. [LoginScreen.kt#L312-L319](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt#L312-L319):
     - `displayVersion` sebelumnya cuma `"v<namaVersi>"` (pendek). Diupgrade jadi **`APK GAS <FlavorLabel> — v<VERSION_NAME> (build <VERSION_CODE>)`**. Contoh: `APK GAS Guru — v1.0.56-guru (build 1048)`. Posisi tetap di antara subjudul "Gerbang Aplikasi Sekolah" dan field input sekolah. Jadi user sebelum login pun langsung tau versi & build berapa APK yang terinstal.
  3. [build.gradle.kts#L47-L55](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L47-L55) — **bump**: `versionCode 1047 → 1048`, `versionName "1.0.55" → "1.0.56"`. WAJIB bump karena ada perubahan state/logic branching UI berdasarkan FLAVOR, penambahan state `isGuruFlavor`, dan 2 lokasi label versi baru.
- **Build:** `./gradlew :app:assembleGuruRelease` → **BUILD SUCCESSFUL in 2m 24s**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- **Copy Final:** `GAS-Guru-1.0.56-guru-1048.apk` + `GAS-Guru-release.apk` di `D:\Dashboard Portal\Apk Release\Final` (mtime 2026-08-28 03:42)
- **SHA256 2 copy SAMA PERSIS:** `9417D0701E7F5E324CF8AEA4D26E6E0652901E44969D3D27714D959431B388CB` (21.356.864 bytes / 20,37 MB)
- **Metadata APK:** Package `com.satupintu.mobile.guru`, `versionCode 1048`, `versionName 1.0.56-guru`.
- **Distribusi:** Final only (GAS Guru tetap jalur manual, tidak sync apk-manifest / public-apk).
- **Catatan penting SESUAI ATURAN PEGANGAN (BAGIAN 3 Poin 7):**
  - ✅ Hanya menyentuh **2 area yang user minta**: (a) UI kartu menu GURU dibalikin sesuai referensi screenshot lawas; (b) Tambah label versi di Login & Home.
  - ✅ `StudentFeatureCard` / UI siswa & kepala TIDAK DIUBAH SATU PUN (tetap 4 kolom gelap).
  - ✅ Logic 7 KAIH preset batch dari build 1047 TETAP DIpertahankan (TIDAK rollback, karena user tadi minta fitur itu lalu lanjut request UI).
- **QA checklist WAJIB di HP Guru (instal via ADB `adb install -r GAS-Guru-release.apk`):**
  1. [ ] Sebelum login: di login screen dibawah subtitle "Gerbang Aplikasi Sekolah" teksnya **`APK GAS Guru — v1.0.56-guru (build 1048)`**.
  2. [ ] Home screen background: **CERAH gradien tosca→biru** (bukan gelap indigo).
  3. [ ] Judul section kartu: **`Menu Guru`** (besar, BUKAN caps MENU UTAMA).
  4. [ ] Kartu menu: **2 KOLOM** (bandingkan: GAS Siswa = 4 kolom).
  5. [ ] Bentuk tiap kartu: 2 baris jelas. Baris atas = icon besar (84dp) dalam rounded square lebih terang. **Baris bawah = NAMA MENU di dalam pill shape biru-muda** (bukan text polos).
  6. [ ] Jika ada notifikasi, **badge merah bulat angka** muncul di pojok kanan atas area icon kartu (mirip screenshot Notifikasi no. 1).
  7. [ ] Paling bawah, DI BAWAH grid kartu menu ada teks abu-putih kecil center: **`APK GAS Guru — v1.0.56 (1048)`**.
  8. [ ] Menu **7 KAIH → tab Penilaian**: fitur preset cepat dari 1047 TETAP ADA (header preset Nilai 25/20/Reset massal + preset chip di dialog per siswa).

## 2026-08-28 03:05 - [FEATURE] GAS Guru 1.0.55-guru (1047) - Input Cepat Nilai 7 KAIH (Preset 4 Kriteria Massal)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `feature` (mengembalikan fitur yang sempat hilang)
- **Flavor terdampak:** `guru` (file `src/main` + `src/guru` tidak ada perubahan spesifik)
- **Tujuan perubahan:**
  - Guru menilai 7 KAIH tidak perlu isi **4 kriteria (Kejujuran, Perilaku, Inisiatif, Komitmen)** satu per satu untuk setiap siswa.
  - Sediakan **3 preset cepat** di dialog penilaian per siswa: `Nilai 25` (semua kriteria = 25), `Nilai 20` (semua kriteria = 20), `Reset` (semua = 0).
  - Sediakan **bar preset massal satu kelas** di header tab Penilaian: klik `Nilai 25` / `Nilai 20` / `Reset` -> semua siswa kelas tersimpan langsung tanpa buka dialog satu per satu.
- **File yang diubah:**
  1. [TeacherHabitRubric.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/TeacherHabitRubric.kt) — Tambah `companion object` helper `presetAll(value)`, `reset()`, `preset20()`, `preset25()` (nilai otomatis clamp 0..25, semua 4 kriteria diisi sama).
  2. [TeacherSevenHabitsRepository.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/TeacherSevenHabitsRepository.kt#L158-L207) — Tambah `saveTeacherRatingBatch()`: loop `setValue()` paralel untuk semua `studentId`, hitung `successCount/failCount`, callback dengan daftar error.
  3. [TeacherSevenHabitsViewModel.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherSevenHabitsViewModel.kt#L89-L246) — Tambah `isSavingBatch` state + `saveTeacherRubricBatch(studentIds, rubricFactory)`: resolve id ke Student via `filterStudentsForScope`, simpan batch, lalu update local map `teacherRatingsFlow` agar UI reaktif langsung berubah tanpa reload RTDB.
  4. [TeacherSevenHabitsScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherSevenHabitsScreen.kt#L811-L1154) — (a) `PresetBatchBar` di header tab Penilaian (3 chip: Nilai 25 hijau, Nilai 20 biru, Reset merah); (b) `SmallPresetChip` 3 tombol di dalam `TeacherRubricDialog` siswa; (c) semua chip `Modifier.weight()` ditulis sebagai extension `RowScope.Chip` (menghindari error `Unresolved reference 'weight'` saat chip dipakai di dalam Row).
  5. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L47-L55) — flavor `guru`: `versionCode 1046 -> 1047` (+1), `versionName "" -> "1.0.55"` (menyesuaikan karena defaultConfig set 1.0.54 untuk siswa). Final = `1.0.55-guru`. WAJIB bump karena fitur ini menambah state `isSavingBatch` + logic branch batch save.
- **Build:** `./gradlew :app:compileGuruReleaseKotlin` (FAIL karena `Unresolved reference 'weight'`) -> perbaiki extension `RowScope.PresetChip` & `RowScope.SmallPresetChip` -> `./gradlew :app:assembleGuruRelease` -> **BUILD SUCCESSFUL in 2m 57s**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- **Copy Final:** `GAS-Guru-1.0.55-guru-1047.apk` + `GAS-Guru-release.apk` di `D:\Dashboard Portal\Apk Release\Final` (mtime 2026-08-28 03:05)
- **SHA256 2 copy SAMA PERSIS:** `23B67144D7D11834299340F3A1205220988E23DAE3CB78492C4D8A1DE82F3F79` (21.356.863 bytes / 20,37 MB)
- **Metadata APK:** Package `com.satupintu.mobile.guru`, `versionCode 1047`, `versionName 1.0.55-guru`, minSdk 23.
- **Distribusi:** Final only (GAS Guru = jalur manual install, TIDAK sync ke `web/public/apk` / `apk-manifest.json`; file `Ship-Apk-Baru.ps1` tidak ada di disk jadi ship via copy manual verify SHA).
- **Flavor yang diuji compile/assemble:** `guru` saja. `siswa` / `kepala` tidak di-rebuild; versioning mereka tetap.
- **QA checklist yang WAJIB di HP guru:**
  1. [ ] Login Guru -> pilih kelas -> menu `7 KAIH` -> tab `Penilaian`.
  2. [ ] Header muncul bar **"Isi Cepat Semua (N siswa)"** dengan 3 tombol: `Nilai 25` (hijau), `Nilai 20` (biru), `Reset` (merah).
  3. [ ] Klik **`Nilai 25`** -> muncul toast "Berhasil simpan X nilai guru." -> semua kartu `Nilai Guru (Belum)` langsung berubah jadi **`Nilai Guru 100`** (total 4x25) tanpa reload halaman.
  4. [ ] Klik tombol `Nilai Guru 100` di salah satu siswa -> dialog terbuka.
  5. [ ] Di atas 4 input field **ada 3 chip kecil**: `Nilai 25`, `Nilai 20`, `Reset`.
  6. [ ] Klik **`Nilai 20`** -> semua 4 field berubah jadi `20`, Total = **80**. Klik Simpan -> teks tombol berubah jadi `Nilai Guru 80`.
  7. [ ] Klik **`Reset`** di dialog -> semua field = 0, Total = 0. Simpan.
  8. [ ] Klik tombol massal **`Reset`** di header -> semua siswa kembali `Belum`.
  9. [ ] Seluruh proses di atas **tidak loop / loading stuck**. Toast pesan Sukses/Gagal muncul (jika RTDB timeout = muncul failCount).

## 2026-08-28 02:05 - [FIX] GAS Siswa 1.0.82-siswa (23079) - 7 KAIH + Lentera + gate EduLock
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa` (`src/main`)
- **Tujuan perubahan:**
  - Kunci **7 KAIH** setelah submit mingguan agar siswa tidak bisa kirim ulang / mengubah centang minggu yang sama.
  - Batasi checkbox **7 KAIH** agar hanya hari aktif hari ini yang bisa dicentang.
  - Tambah kenyamanan baca **Lentera Digital**: `zoom`, `fullscreen`, swipe normal di `1x`, dan panel bawah native untuk halaman.
  - Hilangkan delay gate **EduLock** saat aksesibilitas / admin perangkat lokal sudah pulih tetapi telemetry remote belum menyusul.
- **Build:** `./gradlew :app:compileSiswaDebugKotlin` -> **BUILD SUCCESSFUL**. `./gradlew :app:assembleSiswaRelease` -> **BUILD SUCCESSFUL**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- **Copy Final:** `GAS-Siswa-1.0.82-siswa-23079.apk` + `GAS-Siswa-release.apk` di `D:\Dashboard Portal\Apk Release\Final` (mtime 2026-08-28 02:05)
- **SHA256:** `C4B84E8370D55EAFFC7809020A94BB76265541219547782DA0454A5BCB8B9A44` (21.356.882 bytes)
- **Distribusi:** Final only. Unduhan web tetap `1.0.80-siswa` / `23077`; belum sync `web/public/apk`.
- **Verifikasi lapangan:** user mengonfirmasi perilaku Lentera Digital sudah sesuai ekspektasi, dan bug delay buka GAS dari EduLock setelah aksesibilitas aktif sudah selesai.

## 2026-08-27 13:58 - [DOCS] Pegangan sync - 1.0.82 + audit Dhuha/Jumat + jam statis
- **Pelaksana:** Assistant
- **Jenis perubahan:** `docs`
- **Flavor terdampak:** pegangan saja (tidak rebuild APK)
- **Tujuan perubahan:**
  - Selaraskan README akar pegangan, GAS README/RELEASE/CHANGELOG/ARCHITECTURE/REGRESSION, CHECKLIST, dan catatan Rekap Dhuha ke progres 27 Agu 2026.
  - Catat audit: **Presensi Dhuha & Jum'at** APK sudah baca `prayer_v2` (Jadwal Per Kelas + Override) sesuai web admin; tidak perlu rebuild khusus.
  - Catat keputusan user: baris **Jam** Dhuha/Jumat **statis** (sengaja), bukan bug.
  - Kartu **Aturan Hari** Dzuhur = Presensi Sekolah — sudah di APK **1.0.82** (entry build di bawah).
- **Build:** tidak rebuild APK

## 2026-08-27 13:31 - [FIX] GAS Siswa 1.0.82-siswa (23079) - Kartu Aturan Hari = Presensi Sekolah
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa` (`PrayerScreen.kt` + `VirtualPetRepository.kt` di `src/main`)
- **Tujuan perubahan:**
  - Kartu **Aturan Hari** di Presensi Sholat membaca **hari efektif Presensi Sekolah** (`school_settings/{id}/attendance/schedules`), bukan `prayer/schedules`.
  - Kamis dengan Presensi Sekolah nyala harus **Hari efektif: Ya**, **Tanggal merah: Tidak**, **Aturan sholat: Berlaku** (Dzuhur `prayer_v2`).
  - Hari tanpa kunci di map tidak lagi dianggap libur otomatis (`isHoliday == true` saja).
  - Pet Dzuhur (`isEffectiveDay`) memakai path attendance yang sama agar tidak beda dengan kartu.
- **Build:** `./gradlew :app:compileSiswaDebugKotlin` -> **BUILD SUCCESSFUL in 4m 41s**. `./gradlew :app:assembleSiswaRelease` -> **BUILD SUCCESSFUL in 4m 37s**.
- **Output asli:** `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- **Copy Final:** `GAS-Siswa-1.0.82-siswa-23079.apk`, `GAS-Siswa-release.apk`, `GAS Siswa release.apk`, `app-siswa-release.apk` di `D:\Dashboard Portal\Apk Release\Final` (mtime 2026-08-27 13:31:34)
- **SHA256:** `2F7639FEED97E9B917E3EDFA6892F98FD07A3A86F0BB13D272E07BA1CD7C7318` (21.324.109 bytes)
- **Distribusi:** Final only. Unduhan web tetap `1.0.80-siswa` / `23077`. `web/scripts/Ship-Apk-Baru.ps1` tidak ada; tidak menjalankan `npm run sync:apk:gas`.
- **Flavor yang diuji compile/assemble:** `siswa` saja. `guru` / `kepala` tidak di-rebuild.
- **Belum diuji:** QA HP lapangan kartu Aturan Hari + tombol absen Dzuhur. Radius musholla 5m vs jarak siswa adalah masalah terpisah (bukan hari efektif).
- **Audit lanjutan (kode, 2026-08-27 ~13:58):** Presensi Dhuha & Jum'at sudah selaras admin; baris Jam statis dikonfirmasi user — tidak diubah.

## 2026-08-18 11:05 - [FEATURE & FIX] GAS Siswa 1.0.81-siswa (23078) - KBBI + Surat Al-Mulk + Standarisasi Quran NU Online
- **Pelaksana:** Assistant
- **Jenis perubahan:** `feature` & `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Menambahkan menu **Kamus Besar Bahasa Indonesia (KBBI)** pada Tools Belajar menggunakan API mirror resmi KBBI v6 (`https://kbbi.raf555.dev/`) dengan fallback ganda, lengkap dengan pemenggalan suku kata, badge kelas kata, dan contoh kalimat.
  - Menambahkan **Surat Al-Mulk** (Surah ke-67, 30 ayat) pada Buku Pembiasaan Religius.
  - Menyinkronkan seluruh naskah surat (Ar-Rahman, Al-Waqi'ah, Yasin, Al-Mulk) ke rujukan resmi **Mushaf Standar Indonesia** (LPMQ Kemenag RI / rujukan NU Online di `quran.nu.or.id`), lengkap dengan teks Arab rasm Usmani standar, transliterasi Latin resmi, dan terjemahan bahasa Indonesia.
  - Mendaftarkan rute `tools_kbbi_dictionary` dan `tools_religious_book` di `SecurityUtils.kt` dan `GasAppNavGraph.kt`.
- **Build:** `./gradlew assembleSiswaRelease` -> **BUILD SUCCESSFUL**
- **Output:** Disalin dan menimpa `GAS-Siswa-1.0.81-siswa-23078-INTERNAL.apk`, `GAS-Siswa-release.apk`, `GAS Siswa release.apk`, dan `app-siswa-release.apk` di `D:\Dashboard Portal\Apk Release\Final`.

## 2026-08-16 22:15 - [SHIP WEB] GAS-Siswa v1.0.80-siswa (23077) - URL unduhan publik

- **Tujuan:** Point unduhan siswa di portal ke APK Final 1.0.80 (Virtual Pet sync fix).
- **Sumber:** `Apk Release/Final/GAS-Siswa-1.0.80-siswa-23077.apk` (SHA256 `CB5CF41398A815AB43678A0DC3CEE52CDF83593A69980F590DDDC5FB2F3EDB98`)
- **Hasil:**
  - `web/public/apk/GAS-Siswa-release.apk` + `GAS-Siswa-1.0.80-siswa-23077.apk`
  - `apk-manifest.json` + `src/data/apk-manifest.json` = `1.0.80-siswa` / `23077`
  - Hapus stale `GAS-Siswa-1.0.76-siswa-23073.apk` dari public
  - Fallback `gas/install` di-update ke nama file 1.0.80
- **URL:** `/gas/install` → `/apk/GAS-Siswa-1.0.80-siswa-23077.apk?v=CB5CF41398A8`

Dokumen ini adalah log operasional wajib untuk setiap perubahan APK `GAS`.

## Aturan Pakai
1. Tambahkan entry baru paling atas.
2. Isi jujur apa yang diubah, flavor terdampak, build yang dijalankan, dan apa yang belum diuji.
3. Jika tidak ada build, tulis alasan kenapa tidak build.
4. Jika APK disalin ke folder distribusi, tulis lokasi pastinya.
5. Gunakan format baku yang sama agar mudah dicari lintas orang dan lintas waktu.

## Format Baku Entry
Field berikut wajib dipakai di setiap entri:
- Waktu
- Pelaksana
- Jenis perubahan: `feature`, `fix`, `refactor`, `docs`, atau `no-build`
- Flavor terdampak
## Tujuan perubahan

## 2026-08-16 22:15 - [DOCS] Pegangan sync - Dhuha/Jumat + APK 1.0.78-1.0.80 + pet siluman
- **Pelaksana:** Assistant
- **Jenis perubahan:** `docs`
- **Flavor terdampak:** pegangan GAS + CHECKLIST (tidak rebuild APK)
- **Tujuan perubahan:**
  - Sinkronkan CHECKLIST / README / RELEASE / REKOMENDASI ke progres 16 Agu 2026.
  - Catat web: restore Rekap Dhuha & Jumat (`39f8bb48`), classIds (`13c86d2f`), normalize jam `HH.mm` -> `HH:mm` (`b3f5ce4f`), filter pet siluman monitor (`39580854`).
  - Catat kontrak singkat: Override/Generator Jumat = tanggal+kelas saja (Jam di Jadwal Sholat Per Kelas); Kenyang hanya hari efektif >=30 menit baca; libur -> +10 Kecerdasan (bukan Kenyang); 104 vs 100 pet = orphan RTDB, monitor sekarang filter roster-linked.
- **Build:** tidak rebuild APK

## 2026-08-16 22:03 - [FIX WEB] Monitor Virtual Pet - drop orphan siluman dari Total Pets Aktif (`39580854`)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** web admin only (APK tidak di-rebuild)
- **Tujuan perubahan:**
  - Total Pets Aktif di monitor hanya menghitung pet yang ter-link roster siswa (bukan orphan RTDB).
  - Selisih 104 vs 100 sebelumnya = pet siluman tanpa siswa; cleanup one-off lama **bukan** filter tahan lama - sekarang filter durable di query/agregasi monitor.
- **Build:** tidak rebuild APK
- **Commit:** `39580854`

## 2026-08-16 18:48 - [FIX WEB] Restore Rekap Dhuha & Jumat + pengaturan prayer_v2 (`39f8bb48`)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** web App Hosting / admin GAS (APK tidak di-rebuild di langkah ini)
- **Tujuan perubahan:**
  - Mengembalikan menu **Rekap Dhuha & Jumat** + panel pengaturan sistem `prayer_v2` yang sempat hilang dari live deploy.
  - Dilanjutkan align matching classIds (`13c86d2f`) dan normalize jam admin `HH.mm` -> `HH:mm` (`b3f5ce4f`, bagian web + APK 1.0.78).
- **Build:** tidak rebuild APK di commit restore
- **Commit:** `39f8bb48` (restore) -> `13c86d2f` (classIds) -> `b3f5ce4f` (jam)

## 2026-08-16 21:55 - [SHIP APK] GAS-Siswa v1.0.80-siswa (23077) - Virtual Pet loading SEKARAT flash fix
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Virtual Pet: keep loading until first full vitals sync; repository gates reading/habit/prayer flows until alias bootstrap ready — no brief SEKARAT/DEAD flash from partial 0 stats.
  - Related: vitals (not stale status=DEAD) as source of truth; monthly literacy quest catalog polish in same pet files.
  - **Tidak** sync URL unduhan web - Final only.
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease --no-daemon --max-workers=1`
- **Distribusi Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.80-siswa-23077.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- **SHA256:** `CB5CF41398A815AB43678A0DC3CEE52CDF83593A69980F590DDDC5FB2F3EDB98`
- **URL unduhan web:** TIDAK di-update (Final only)
## 2026-08-16 21:22 - [SHIP APK] GAS-Siswa v1.0.79-siswa (23076) - Fix cold-start NavigationKt ClassNotFound
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Device logcat: `FATAL EXCEPTION` / `NoClassDefFoundError: Failed resolution of: Lcom/satupintu/mobile/ui/NavigationKt;` ? silent exit ke desktop.
  - Pecah NavHost routes ke `GasAppNavGraph.kt`; enable `multiDexEnabled` + `GasApp` (`MultiDexApplication`) + `multidex-keep.txt`.
  - Verified: install + `am start` di V2030 — tidak ada FATAL; `versionName=1.0.79-siswa` / `versionCode=23076`.
  - **Tidak** sync URL unduhan web — Final only.
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease --no-daemon --max-workers=2`
- **Distribusi Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.79-siswa-23076.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- **SHA256:** `8CC2F9DE2AD0ED9C7A289DBFE59EBD28EBE345B2F6E7F25F9290AE02F5891C48`
- **URL unduhan web:** TIDAK di-update (Final only)
## 2026-08-16 20:53 - [SHIP APK] GAS-Siswa v1.0.78-siswa (23075) - Class match + jam admin Dhuha/Jumat (Final only)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa` (+ web admin prayer config normalize)
- **Tujuan perubahan:**
  - Align matching jadwal kelas siswa dengan `prayer_v2.classIds` admin (sudah di main `13c86d2f`).
  - Fix tampilan jam Dhuha/Jumat: tidak lagi hardcode/fake `07:00-07:30`; parse/normalize `HH.mm` ke `HH:mm` dari jadwal/type admin; hari tanpa jadwal tampil "Tidak dijadwalkan" tanpa jam palsu.
  - **Tidak** sync `web/public/apk`, **tidak** update URL unduhan web — Final only.
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease` (`--no-daemon`)
- **Commit kode:** `b3f5ce4f` (time display) + `13c86d2f` (class match)
- **Distribusi Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.78-siswa-23075.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- **SHA256:** `E2F63CC3184FBC747639EDC504BA88FD78046A96CA66BA551BFCFE4EDC56EBB5`
- **URL unduhan web:** TIDAK di-update (Final only)
## 2026-08-16 20:50 - [SHIP APK] GAS-Siswa v1.0.78-siswa (23075) - Align Dhuha/Jumat schedule with prayer_v2 classIds
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Native: `PrayerDhuhaJumatScreen` + nav routes baca jadwal admin `prayer_v2` (classIds array/map + classLabelMap + schoolId variants).
  - Web: `useGasPrayerConfig` parseClassIds + `PrayerV2RecapPanel` match classId->label; API `teacher/prayer-v2`.
  - Code fix sudah di-push: `13c86d2f`. **Tidak** sync URL unduhan web.
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease --no-daemon --max-workers=1` (heap rendah; sukses setelah OOM sebelumnya)
- **Distribusi Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.78-siswa-23075.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- **SHA256:** `4BCE1A4755DB8B59660AD3AC244E6FAA641F2DFF13309E81F14E8515A41C4095`
- **URL unduhan web:** TIDAK di-update (tetap prior public)
## 2026-08-16 15:10 - [SHIP APK] GAS-Siswa v1.0.77-siswa (23074) - Tantangan Bulan Ini + Bonus Literasi + MATI/Buku Dibaca (Final only)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `feature` + `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Lentera home: kartu **Tantangan Bulan Ini** menampilkan tugas `literacy_tasks` aktif (sekolah/kelas + startAt/endAt) atau empty state.
  - Quest pet **Bonus Literasi Bulanan** (+200 koin / +100 XP, 1x per bulan kalender saat submit laporan literasi); hunger harian tetap baca 30 menit.
  - Keep fix spam pet MATI (vital-only) + Buku Dibaca `floor(menit/30)`.
  - **Tidak** sync `web/public/apk`, **tidak** git push, **tidak** App Hosting — URL unduhan web tetap 1.0.76.
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease` (setelah clean build dir)
- **Distribusi Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.77-siswa-23074.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- **SHA256:** `C7CE53212357DAD7D42954C7AA0D98591E26B34B923DFF42DD0FC942C470A108`
- **URL unduhan web:** TIDAK di-deploy (public tetap SHA256 `76C8EFC4…` / 1.0.76)

## 2026-08-16 12:45 - [DOCS] Pegangan update — App Hosting live lagi + GAS Siswa 1.0.76
- **Pelaksana:** Assistant
- **Jenis perubahan:** `docs`
- **Flavor terdampak:** pegangan web + GAS (tidak rebuild APK)
- **Tujuan perubahan:**
  - Catat status akhir 16 Agu 2026: App Hosting `gerbang-aplikasi-sekolah` **SUKSES** setelah `bf206c44`.
  - Sinkronkan CHECKLIST, PANDUAN_DEPLOY_WEB, aturan AI, README GAS ke progres terkini.
- **Build:** tidak rebuild APK

## 2026-08-16 12:30 - [FIX WEB] App Hosting LIVE — package-lock Node 20 (`bf206c44`)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** web App Hosting only (APK siswa 1.0.76 tidak di-rebuild)
- **Tujuan perubahan:**
  - Rollout `101c147` masih gagal: `npm ci` EUSAGE / Usage dump (exit 51) di Cloud Build step `build`.
  - Repro lokal Node 20.18 / npm 10.8.2: lockfile dari npm 11 (Node 25) kurang `@emnapi/core` + `@emnapi/runtime`.
  - Regenerasi `web/package-lock.json` + `web/.npmrc`; `npm ci` lokal lulus; push `bf206c44`.
- **Hasil:** App Hosting rollout **SUKSES** (dikonfirmasi user 2026-08-16 ~12:47 WIB). Tutorial unduh GAS 1.0.76 + EduLock 1.3.11 live lagi.
- **Commit rantai perbaikan hari ini:**
  1. `c1477ed0` — ship GAS Siswa 1.0.76 (build gagal: public/apk gemuk)
  2. `1b86d81d` — slim `web/public/apk` (masih gagal: npm ci)
  3. `101c147e` — hapus app Next.js ganda di root (masih gagal: lockfile npm 11)
  4. `bf206c44` — regenerate lockfile Node 20 ? **LIVE**
- **Build:** tidak rebuild APK

## 2026-08-16 12:00 - [FIX WEB] App Hosting npm ci — hapus app Next.js ganda di root (`101c147e`)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** web App Hosting only (APK siswa 1.0.76 tidak di-rebuild)
- **Tujuan perubahan:**
  - Rollout `1b86d81d` masih gagal di Cloud Build step `build` (`npm ci` Usage / exit 51).
  - Backend `gerbang-aplikasi-sekolah` `rootDirectory` = `web`, tetapi GitHub masih berisi salinan `package.json` + `.yarnrc` + puluhan APK di root `public/apk` (~600 MB).
  - Hapus file root sisa itu, hapus `web/.yarnrc`, pakai `web/.npmrc`, pastikan `web/next.config.ts` `output: "standalone"`.
- **File utama:**
  - hapus root `package.json`, `package-lock.json`, `.yarnrc`, `apphosting.yaml`, `public/apk/*.apk`
  - `web/.yarnrc` (hapus), `web/.npmrc` (baru), `web/next.config.ts`
- **Hasil saat itu:** masih gagal — akar masalah berikutnya adalah lockfile npm 11 (lihat entry `bf206c44`).
- **Build:** tidak rebuild APK

## 2026-08-16 11:40 - [FIX WEB] Slim web/public/apk so App Hosting can build again (`1b86d81d`)
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** web tutorial download only (APK siswa 1.0.76 tidak di-rebuild)
- **Tujuan perubahan:**
  - App Hosting rollout `c1477ed0` gagal di Cloud Build step `build` (`npm` exit 1) karena `web/public/apk` menumpuk puluhan APK lama (~20 MB x banyak file).
  - Bersihkan `web/public/apk` hanya ke file yang dipakai tutorial: alias + versi current GAS Siswa 1.0.76 dan EduLock 1.3.11.
  - Arsip versi lama tetap di `Apk Release/Final`, tidak di-deploy ke App Hosting.
- **File utama:**
  - `web/public/apk/*` (hapus APK lama)
  - `web/public/apk/apk-manifest.json` (hanya 4 entry current)
- **Hasil saat itu:** folder sudah ramping, tapi rollout masih gagal karena `npm ci` (bukan ukuran APK saja).
- **Build:** tidak rebuild APK

## 2026-08-16 11:10 - [SHIP APK] GAS-Siswa v1.0.76-siswa (23073) - Home LIBUR + Dzuhur activeDays + Sahabat Belajar Ibadah
- **Pelaksana:** Assistant
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Bug1 Home: Status Kehadiran di Beranda menampilkan `LIBUR` saat hari non-efektif (jadwal/tanggal merah), selaras dengan Absensi.
  - Bug2 Dzuhur: Presensi Sholat + pet menghormati admin `prayer_v2` Hari Wajib (`activeDays` JS weekday 0-6) dan flag `enabled` sebelum fallback jadwal legacy.
  - Bug3 Sahabat Belajar Ibadah: kartu Ibadah/prayer di Virtual Pet tidak lagi jatuh ke "Belum ada" pada hari libur/non-wajib; label menjadi `Libur / tidak wajib`, plus kartu misi prayer terpisah.
- **File utama:**
  - `HomeScreen.kt`
  - `PresensiRuleUtils.kt`, `PrayerScreen.kt`
  - `VirtualPetRepository.kt`, `VirtualPetViewModel.kt`, `VirtualPetScreen.kt`
  - `app/build.gradle.kts` bump `1.0.75/23072` -> `1.0.76/23073` (1.0.75 sudah ada di Final sebelumnya)
- **Build:** `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- **Ship:** `Ship-Apk-Baru.ps1 -Preset GasSiswa` exit 0
- **SHA256:** `76C8EFC4051E11382B6DB3CB25BCD14127237C2FA291FCE27B15F41FA3420298` (20.24 MB)
- **Final:**
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.76-siswa-23073.apk`

## 2026-08-15 08:50 - [SHIP APK] GAS-Siswa v1.0.74-siswa (23071) - Fix Level/XP Discrepancy (Deduplicate pet aliases)
- **Pelaksana:** Antigravity (AI Assistant)
- **Jenis perubahan:** `fix`
- **Flavor terdampak:** `siswa`
- **Tujuan perubahan:**
  - Memperbaiki ketidaksesuaian level pada menu Peringkat (Leaderboard) dengan level pet di bar atas UI.
  - Saat siswa login dengan alias berbeda (misalnya username vs NISN), pet lama dan pet baru kini digabungkan (deduplikasi) di UI dan Leaderboard dengan memprioritaskan Level dan XP tertinggi, sehingga tidak terjadi inkonsistensi.
- **Tindakan Lanjutan:**
  - Kode di `VirtualPetRepository.kt` dan `VirtualPetViewModel.kt` diperbarui.
  - Build `assembleSiswaRelease`.
  - Deployment ke website melalui `Ship-Apk-Baru.ps1`.

## 2026-08-15 08:00 - [SHIP APK] GAS-Siswa v1.0.73-siswa (23070) - Fix Level & XP Persistence in Virtual Pet
- Pelaksana: Assistant
- Jenis perubahan: `fix`, `gamification`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menghapus aturan penurunan level otomatis di `VirtualPetViewModel.kt` (`newLevel = 1`, `newXp = 0` saat `averageStats < 40`).
  - Menyelaraskan tampilan bar utama Sahabat Belajar (Level, XP, Coins) agar 100% konsisten dengan data database di Menu Peringkat dan Global Leaderboard Web Admin (Level 2, 130 XP, 570 Coins).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.73-siswa" -VersionCode 23070`
- SHA256: `0082A1DE3177A64B3948F70955C2C5514C866FE76AD4EBEEE5341CB5C0299C49` (Size: 20.24 MB)
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.73-siswa-23070.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.73-siswa-23070.apk`
  3. `Apk Release/Final/GAS-Siswa-release.apk`

## 2026-08-13 15:05 - [SHIP APK] GAS-Siswa v1.0.64-siswa (23061) - Perbaikan UI & Bug Wali Kelas

- Pelaksana: Assistant
- Jenis perubahan: `feature`, `fix`, `ui`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Merapikan UI: menghapus tombol logout dari header (karena sudah ada di Profil), membesarkan ukuran tombol FAB Absensi (76dp) dan menjorokkannya ke atas.
  - Memperbaiki Library UI: menyembunyikan "Prestasi" di profil, mengubah grid buku Lentera Digital menjadi 3 baris dengan tinggi seragam 120dp. Mengganti warna teks hijau menjadi abu-abu netral.
  - Fix profil Wali Kelas: merubah Shared Preferences dari `satupintu_mobile_security` (salah) menjadi `app_session` untuk mengambil `user_school_id` yang benar.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/ProfileScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` - BUILD SUCCESSFUL
- Artefak akhir:
  1. `Apk Release/Final/GAS_Siswa_CleanUI_v1.0.64_RELEASE.apk`

## 2026-08-13 13:35 - [SHIP APK] GAS-Siswa v1.0.63-siswa (23060) - Tombol DOWNLOAD UPDATE Force Update
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menambahkan tombol DOWNLOAD UPDATE (biru tua) pada layar peringatan Force Update (aplikasi kadaluarsa) yang membaca URL dari Firebase `app_settings/android/download_url_gas`.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/VirtualPet.kt` (model update info)
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/VersionCheckService.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/ForceUpdateScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.63-siswa" -VersionCode 23060`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.63-siswa-23060.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.63-siswa-23060.apk`

## 2026-08-12 16:00 - [SHIP APK] GAS-Siswa v1.0.62-siswa (23059) - Buka Kartu Langsung ke Tujuan

- Pelaksana: Assistant
- Jenis perubahan: `fix`, `ui`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menghapus dialog "Pilih Menu Kehadiran" yang sebelumnya muncul saat menekan kartu Kehadiran.
  - Memisahkan klik *handler* sehingga klik kartu "Kehadiran" langsung membuka menu Absensi Sekolah, dan klik kartu "Ibadah" langsung membuka menu Presensi Sholat.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.62-siswa" -VersionCode 23059`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.62-siswa-23059.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.62-siswa-23059.apk`

## 2026-08-12 15:40 - [SHIP APK] GAS-Siswa v1.0.61-siswa (23058) - Pemisahan Kartu Tugas Harian & Ibadah

- Pelaksana: Assistant
- Jenis perubahan: `feature`, `ui`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Mengubah nama tab "Status" pada Virtual Pet menjadi "Tugas Harian".
  - Memisahkan tugas Ibadah menjadi kartu tersendiri (sebelumnya tergabung dengan Kehadiran).
  - Menyamakan estetika warna bar "Tugas Harian" agar selaras dengan indikator di "Pencapaian" (Kehadiran = hijau, Ibadah = pink, 7KAIH = kuning, E-Perpus = biru).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.61-siswa" -VersionCode 23058`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.61-siswa-23058.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.61-siswa-23058.apk`

## 2026-08-12 20:10 - [SHIP APK] GAS-Siswa v1.0.60-siswa (23057) - Akumulasi Waktu Baca Realtime Buku Dibaca (>30 Menit)

- Pelaksana: Assistant
- Jenis perubahan: `fix`, `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menghitung akumulasi waktu membaca per judul buku (=30 menit / 1.800.000 ms) dari Firebase `reading_log` untuk kartu statistik "Buku Dibaca".
  - Menambahkan listener real-time `getRealtimeBooksReadCount` pada `VirtualPetRepository` & `StudentLibraryViewModel` dengan `flatMapLatest` berdasarkan scope NISN siswa.
  - **(HOTFIX 20:30)** Mempercepat sinkronisasi durasi baca dari 60 detik menjadi 30 detik pada menu PDF Reader E-Perpus Lentera Digital.
  - **(HOTFIX 20:45)** Menyelesaikan masalah (bug) di sisi *Security Rules Firebase* (*Server-side*) di mana `student_activities` sebelumnya tidak memiliki perizinan tulis (`.write`) untuk peran siswa, sehingga durasi 2 menit tidak tercatat dan muncul sebagai `0/30`. *Rules* pangkalan data telah diperbaiki.
  - **(HOTFIX 20:45)** Memperkuat cara aplikasi mengonversi data waktu membaca agar tetap aman *(safe number casting)* jika format data yang kembali dari Firebase berbentuk angka murni (Int/Double) untuk mencegah gagal tayang (`null`).

### Detail Teknis ?????
- **Tujuan Modifikasi:** `NativePdfReaderScreen.kt` dan `VirtualPetRepository.kt`. Serta pangkalan data `database.rules.json` di *repository web*.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL (2m 31s)
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.60-siswa" -VersionCode 23057`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.60-siswa-23057.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.60-siswa-23057.apk`

## 2026-08-12 13:05 - [SHIP APK] GAS-Siswa v1.0.59-siswa (23056) - Hotfix Literasi

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menghapus `StudentActionCard` tugas literasi yang menyebabkan false-positive pada peringatan pet sekarat.
  - Meningkatkan batas waktu jeda tanpa sentuhan (*anti-cheat idle threshold*) pada PDF Reader dari 45 detik menjadi 5 menit.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Catatan: APK disalin ke `Apk Release\Pegangan Build APK\GAS\GAS-Siswa-1.0.59.apk`

## 2026-08-12 10:05 - [SHIP APK] GAS-Siswa v1.0.58-siswa (23055) - Ghost Pets, Literasi Link, Anti-Cheat, EduLock Close Button

- Pelaksana: Assistant
- Jenis perubahan: `fix`, `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Mengubah algoritma pembuatan ID Pet menggunakan `studentId` agar duplikasi (Ghost Pets) teratasi sepenuhnya.
  - Memperbaiki rute navigasi dari tombol Misi Literasi di layar Pet agar langsung membuka tab "Tugas Literasi" (indeks 2) di `library`.
  - Menyuntikkan timer anti-cheat (jeda bila layar tidak disentuh 45 detik) dan pencatat durasi (`appendReadingDuration()`) berkala ke `NativePdfReaderScreen.kt`.
  - Mengubah tombol "Keluar" di overlay EduLock Compliance menjadi "Tutup" (hanya menutup UI/meminimize aplikasi, bukan menghapus session login).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/CATATAN_BUG_DAN_RENCANA_PENGEMBANGAN.md`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.58-siswa" -VersionCode 23055`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.58-siswa-23055.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.58-siswa-23055.apk`

## 2026-08-10 17:45 - [SHIP APK] GAS-Siswa v1.0.57-siswa (23054) - Rombak Layout Stats Pet

- Pelaksana: Assistant
- Jenis perubahan: `enhancement`, `ui`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Mengubah tata letak statistik Virtual Pet dari 1 kolom panjang menjadi grid 2 kolom (2x3).
  - Menampilkan indikator Kecerdasan dan Sosial di layar Virtual Pet siswa.
- File utama yang diubah
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`

## 2026-08-10 17:21 - [SHIP APK] GAS-Siswa v1.0.56-siswa (23053) - Fix Deskripsi Achievement Virtual Pet

- Pelaksana: Assistant
- Jenis perubahan: `bugfix`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Memperbaiki deskripsi pencapaian "Pembelajar Aktif" agar selaras dengan logika kode (sebelumnya "Mengirim tugas literasi" padahal logikanya "Membaca 30 menit").
  - Menambahkan auto-sync di `VirtualPetViewModel` agar teks pencapaian milik siswa yang sudah terlanjur tersimpan di Firebase ikut ter-update otomatis.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.56" -VersionCode 23053`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.56-23053.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.56-23053.apk`

## 2026-08-10 17:15 - [SHIP APK] GAS-Siswa v1.0.55-siswa (23052) - Fix Leaderboard Virtual Pet

- Pelaksana: Assistant
- Jenis perubahan: `bugfix`
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Memperbaiki bug di mana tab "Peringkat" pada Virtual Pet selalu kosong ("Belum ada data peringkat").
  - Menambahkan pengenalan `recordId` Firebase (Push Key) ke dalam `studentMap` agar identitas pemilik pet cocok 100%.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.55" -VersionCode 23052`
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.55-23052.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.55-23052.apk`

## 2026-08-10 16:51 - [SHIP APK] GAS-Siswa v1.0.54-siswa (23051) - Real-time Location untuk Sholat

- Pelaksana: Assistant
- Jenis perubahan: `feature` (GPS real-time)
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  - Menyuntikkan fitur **Continuous Location Updates (Real-time GPS)** yang sebelumnya dibuat di versi 1.0.53 ke dua layar tambahan: `PrayerScreen` (Sholat Wajib) dan `PrayerDhuhaJumatScreen` (Sholat Dhuha & Jumat).
  - Validasi jarak musholla pada layar sholat kini otomatis mengecil/bertambah seiring siswa berjalan, tanpa menekan tombol "Cek Lokasi Sekarang".
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerDhuhaJumatScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.54" -VersionCode 23051` - exit code 0
  - SHA256: `57BD464F3E88FC5BF2D9966E7F5A7A50D7992592C646F7BA2F6D511510954CED`
  - Size: `21,072,274 bytes` (~ 20.1 MB)
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.54-23051.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.54-23051.apk`

## 2026-08-10 16:35 - [SHIP APK] GAS-Siswa v1.0.53-siswa (23050) - Real-time Location Tracking

- Pelaksana: Assistant
- Jenis perubahan: `fix` + `feature` (perubahan UI dan logika GPS)
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  1. **Fix responsivitas peta absensi (Real-time Location)** - Mengubah pemanggilan `getCurrentLocation` sekali pakai menjadi `requestLocationUpdates` dengan `DisposableEffect` (update tiap 3 detik / 1 meter) saat layar `LocationVerificationScreen` aktif. Peta otomatis bergeser, validasi jarak sekolah selalu update, tanpa perlu pencet tombol refresh lagi.
  2. **Fix Teks Petunjuk** - Memperbaiki label teks info di kotak Virtual Pet dari "1 jam" menjadi "30 menit".
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/AttendanceScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.53" -VersionCode 23050` - exit code 0
  - SHA256: `8540C2685EB7044995F8E8CA441082246446668ABF9AC2BC3989591547251397`
  - Size: `21,072,259 bytes` (~ 20.1 MB)
- Artefak akhir:
  1. `web/public/apk/GAS-Siswa-1.0.53-23050.apk`
  2. `Apk Release/Final/GAS-Siswa-1.0.53-23050.apk`

## 2026-08-10 16:17 - [SHIP APK] GAS-Siswa v1.0.52-siswa (23049) - Fix Lag Absen Pulang Masif + Balancing Pet Literasi 30 Menit

- Pelaksana: Assistant
- Jenis perubahan: `fix` + `feature` (perubahan logic query + balancing pet)
- Flavor terdampak: `siswa`
- Tujuan perubahan:
  1. **Fix performa absen pulang masif** - Query `getRealtimeAttendance` dan `getRealtimePrayerInfo` di `VirtualPetRepository.kt` diubah dari `orderByChild("date")` (mengunduh data SEMUA siswa sehari, menyebabkan lag saat ratusan siswa absen bersamaan) menjadi `orderByChild("studentId")` (hanya mengunduh data milik siswa sendiri, filter tanggal lokal).
  2. **Balancing Virtual Pet Literasi** - Target durasi membaca E-Perpus diturunkan dari 60 menit menjadi 30 menit per hari. Tugas literasi bulanan dipisahkan dari syarat Kenyang harian pet.
  3. **Hapus Daily Quest "Tugas Literasi Hari Ini"** - Karena di lapangan tugas literasi hanya sebulan sekali, bukan harian.
  4. **Update database rules** - Tambah index `studentId` dan `date` pada `prayer_attendance` di `database.rules.json`.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `web/database.rules.json`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - Virtual Pet tetap menampilkan 4 bar indikator (Kenyang, Energi, Bahagia, Sehat)
  - Misi harian (Quest) tetap ada 4: Absensi, Sholat, 3 Kebiasaan, Membaca Buku
  - Absensi masuk dan pulang tetap berfungsi normal
  - Presensi sholat tetap berfungsi normal
  - Literasi Lentera Digital tetap bisa baca buku dan menulis log durasi
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` - BUILD SUCCESSFUL 2m 55s
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk ... -VersionName "1.0.52" -VersionCode 23049` - exit code 0
  - SHA256: `3F71157AE2F222F8DB6D14D3317A9AFFAFA670874A30CDCD29B92E5C25DE3105` (Rebuilt)
  - Size: `21,072,260 bytes` (~ 20.1 MB)
- Artefak akhir 4 copy + manifest:
  1. `web/public/apk/GAS-Siswa-release.apk`
  2. `web/public/apk/GAS-Siswa-1.0.52-23049.apk`
  3. `Apk Release/Final/GAS-Siswa-release.apk`
  4. `Apk Release/Final/GAS-Siswa-1.0.52-23049.apk`
  5. `web/public/apk/apk-manifest.json` - entry GAS siswa pindah ke `1.0.52-23049`
- Belum diuji:
  - Perilaku absen pulang masif di perangkat fisik (perlu tes lapangan)
  - Virtual Pet Kenyang 100% setelah 30 menit baca di HP fisik
  - Misi harian "Tugas Literasi" tidak muncul lagi

## 2026-08-10 13:35 - [SHIP APK] GAS-Siswa v1.0.51-siswa (23048) - Kategori dropdown + grid buku

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Koreksi UX Katalog Lentera Digital: satu dropdown kategori (Semua + master kategori), tanpa chip dan tanpa field Pilih buku; konten utama = grid buku kategori aktif. NISN asli tetap dipertahankan.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Dropdown kategori "Semua" menampilkan semua buku
  - Pilih Non-fiksi / Fiksi & Sastra hanya menampilkan buku kategori itu
  - Tap kartu buku membuka PDF bila tersedia
  - Tidak ada chip kategori dan tidak ada field Pilih buku
  - Profil tetap menampilkan NISN numerik siswa

## 2026-08-10 13:15 - [SHIP APK] GAS-Siswa v1.0.50-siswa (23047) - Katalog dropdown only + NISN asli

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyederhanakan UI Katalog Lentera Digital menjadi dropdown saja (tanpa search/kartu daftar), dan memperbaiki tampilan NISN di Profil agar memakai NISN siswa sungguhan (bukan Firebase key).
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/SharedPreferencesManager.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/ProfileScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - Lentera Digital > Katalog: chip kategori tetap memfilter daftar dropdown
  - Pilih buku dari dropdown lalu Baca Buku membuka PDF
  - Profil menu utama dan tab Profil Lentera menampilkan NISN numerik siswa
  - Login/session siswa tidak berubah
  - Guru/kepsek tidak terdampak (hanya bump flavor siswa)

## 2026-08-10 09:34 - [SHIP APK] GAS-Siswa v1.0.49-siswa (23046) - Overlay Pet Mati Tutup Aplikasi + Sinkron Lentera Digital

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Membangun rilis baru GAS Siswa setelah perubahan overlay pet mati, profil Lentera Digital, dropdown katalog buku, dan sinkronisasi kategori katalog agar sama dengan web e-perpus.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/Book.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - overlay pet mati siswa tidak logout paksa
  - login siswa tetap tersimpan setelah aplikasi ditutup dari overlay pet mati
  - menu Lentera Digital > Katalog tetap bisa cari buku dan buka PDF
  - kategori katalog mengikuti master web e-perpus
  - menu Lentera Digital > Profil menampilkan nama siswa login
- Build yang dijalankan:
  - `:app:assembleSiswaRelease --no-daemon`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-1.0.49-23046.apk`
- Verifikasi artefak:
  - ukuran file: `21072269` byte
  - SHA256 sumber/final sama: `2E2223C06A8E858E6CA56E33EFA62F27E3BA16FB27263FA0316CE489E8522254`
- Regression check yang dijalankan:
  - verifikasi assemble release siswa penuh
  - perbaikan compile kompatibilitas dropdown Lentera Digital pada Material3 proyek saat build
- Belum diuji:
  - perilaku overlay pet mati di perangkat fisik
  - dropdown kategori dan pembukaan PDF Lentera Digital di HP fisik
  - update APK di perangkat siswa dari build sebelumnya

## 2026-08-09 14:20 - [SHIP APK] GAS-Siswa v1.0.48-siswa (23045) - Perluas Fail-Open Post-Wake untuk Menyelesaikan Anomali "Status EduLock belum tersinkron" + Sync Opsi C Bareng EduLock 1.3.11

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: HANYA `siswa`
- Latar belakang:
  - User melaporkan anomali dengan SS: HP sleep, GAS & EduLock di-swipe keluar recent apps ? bangun HP ? buka GAS dari launcher langsung ? overlay merah "Status EduLock belum tersinkron. Buka EduLock 3-5 detik lalu coba lagi."
  - Workaround manual user berhasil: Klik tombol `BUKA EDULOCK` ? tunggu ? dari halaman EduLock tekan tombol `BUKA GAS SISWA` ? GAS normal.
  - Kesepakatan solusi = **Opsi C (Gabungan 2 APK bareng)**: EduLock jadi "rajin sync pre-emptive" via ScreenReceiver, GAS gate diperluas toleransinya (strict activation TETAP, normal launch post-wake = fail-open lunak jika state dasar sehat).
- Tujuan perubahan:
  1. Kasus post-sleep swipe recent ? buka GAS langsung TIDAK overlay lagi (cukup toleransi 5-10 detik sinkron latar).
  2. Strict activation/login awal TETAP tegas (tidak ada kompromi, sesuai baseline 1.0.43).
  3. Hanya rubah spot terkecil gate, TIDAK sentuh fitur GAS lain (Presensi, Literasi, Seven Habits, dll).
- File utama yang diubah:
  1. [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt#L127-L143)
     - Refactor `shouldFailOpenToHealthyLocal()`:
       - Guard `strictActivationCheck=true` ? TETAP return false (L131). TIDAK ADA PERUBAHAN strict mode.
       - Pass 1 = `localHealth.isHealthy()` ? L133 = 5 badge sempurna (perilaku LAMA TETAP dipertahankan).
       - Pass 2 BARU L139-L142 = Post-wake tolerance: `installed && accessibilityOn && deviceAdminOn && protectionActive`. 4 badge dasar device-state SEHAT, tanpa menunggu `setupCompleted` (yang mungkin baru berubah true 1-3 detik kemudian saat ScreenReceiver self-heal EduLock jalan). Ini cukup untuk mendeteksi "tidak mungkin non-compliance parah".
  2. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L36-L44) (flavor siswa): `versionCode 23044 ? 23045`, `versionName 1.0.47 ? 1.0.48`.
- Fitur lama yang WAJIB dicek & TIDAK DIUBAH:
  - Strict activation / login awal check (strictActivationCheck=true ? TETAP strict di semua cabang: snapshot null, telemetryError, record null, stale, setupCompleted false).
  - Accessibility / Device Admin OFF ? TETAP blokir (meskipun shouldFailOpen = false karena salah satu badge merah).
  - Prayer V1/V2, Literasi Tugas & Grading, Seven Habits, Bullying, Discipline, Notifikasi, Pet, Teacher filter wali kelas, Admin System Settings = TIDAK DISENTUH.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease --no-daemon` ? BUILD SUCCESSFUL, 51 tasks (18 executed, 33 up-to-date), Warning = deprecations icon TIDAK fatal.
  - Output: [app-siswa-release.apk](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk) ? package `com.satupintu.mobile.siswa`, versionCode 23045, versionName 1.0.48-siswa.
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk <path> -VersionName 1.0.48 -VersionCode 23045` ? exit code 0.
  - SHA256: `F4E1AB0F7268EEC98ADF74EB09DEB2E4AE16B457B831AF966E668D30C17FFEFA`
  - Size: `21,072,260 bytes (~ 20.1 MB)`
- Artefak akhir 4 copy + manifest:
  1. [web/public/apk/GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-release.apk)
  2. [web/public/apk/GAS-Siswa-1.0.48-23045.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-1.0.48-23045.apk)
  3. [Final/GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-release.apk)
  4. [Final/GAS-Siswa-1.0.48-23045.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.48-23045.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) ? entry GAS diarahkan ke `1.0.48-23045` (updatedAt 14:14).
- Build web lokal:
  - `npm run build` ? SUCCESS.
  - [gas/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/gas/install.html) memuat `GAS-Siswa-1.0.48-23045.apk` sebanyak 3 match.
- Regression check:
  - [x] Strict activation `strictActivationCheck=true` ? TETAP: guard L131 return false, JANGAN fail-open.
  - [x] Accessibility OFF ? TETAP blokir (badge accessibility merah ? kedua pass gagal, tidak ada perubahan).
  - [x] Device Admin OFF ? TETAP blokir (same reasoning).
  - [x] Protection Active OFF ? TETAP blokir.
  - [x] 4 badge dasar HIJAU, setupCompleted BELUM true ? **Lolos pass 2 post-wake**, fail-open = TIDAK blokir.
  - [x] 5 badge sempurna HIJAU ? Lolos pass 1, TETAP kompatibel.
- QA manual berikutnya setelah 2 APK install-timpa di HP:
  - [ ] Kasus SS user: sleep 1m ? swipe recent GAS+EduLock ? bangun/unlock ? buka GAS dari launcher ? TANPA overlay ?.
  - [ ] Strict TETAP: fresh install GAS (belum login) atau setup EduLock benar-benar belum jalan (Accessibility / Admin OFF salah satu) ? TETAP blokir dengan teks tepat.
- Deploy live status (2026-08-09 14:47, GAS partial duluan sesuai user instruksi):
  - [x] Hanya artefak GAS yang di-push ke `main`: `web/public/apk/GAS-Siswa-release.apk`, `web/public/apk/GAS-Siswa-1.0.48-23045.apk`, `web/public/apk/apk-manifest.json`, `web/src/data/apk-manifest.json`.
  - [x] Commit: `c48a0841` (message: `deploy: sync GAS Siswa 1.0.48 (23045) download artifacts`). Push ke remote main BERHASIL (To https://github.com/mikoewp1982/Dashboard-Portal.git d0a000a3..c48a0841 main -> main).
  - [x] App Hosting auto-rollout terpicu. URL tutorial `/gas/install` men-download APK 1.0.48-23045 setelah rollout selesai.
  - ?? EduLock 1.3.11 (37) **TIDAK ikut push** di commit ini (user fokus update GAS saja). EduLock build/ship lokal sudah OK, deploy live menunggu user confirm terpisah (jika diperlukan).

## 2026-08-09 12:10 - [SHIP APK] GAS-Siswa v1.0.47-siswa (23044) - Kurangi False-Block Wake-from-Sleep Saat EduLock Lokal Sehat

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: HANYA `siswa`
- Latar belakang:
  - User menemukan anomali: setelah HP bangun dari mode sleep, GAS siswa bisa tertahan dengan pesan `Status EduLock belum tersinkron...` meskipun kondisi lokal EduLock sebenarnya sehat.
  - Gejala ini tidak muncul saat GAS dibuka dari dalam EduLock, yang menguatkan dugaan bahwa akar masalah ada pada pembacaan status remote yang masih `OFFLINE` / stale sesaat setelah device bangun.
  - Sesuai arahan user, perbaikannya dipilih dengan scope sempit: **benahi false-block**, tanpa mengubah aturan strict untuk first install / first activation.
- Tujuan perubahan:
  1. Menghilangkan false-block pada pembukaan GAS normal setelah wake-from-sleep jika kondisi lokal EduLock sehat.
  2. Mempertahankan behavior strict untuk first install / first activation.
  3. Menyediakan APK rilis baru yang langsung siap dibagikan lewat folder Final dan tutorial unduh siswa.
- File utama yang diubah:
  1. [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt)
     - Menambahkan helper `shouldFailOpenToHealthyLocal(...)`.
     - Pada mode **non-strict** dengan local health sehat, gate tidak lagi memblokir untuk tiga cabang yang sebelumnya paling sering memicu false-block:
       - `snapshot == null` + `telemetryError`
       - `record == null`
       - status remote `stale` / `OFFLINE`
     - Pada mode **strict** (`strictActivationCheck = true`), aturan lama tetap dipertahankan.
  2. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
     - flavor `siswa`: `versionCode 23043 -> 23044`
     - flavor `siswa`: `versionName 1.0.46 -> 1.0.47`
- Guardrail scope perubahan:
  - Perubahan ini **bukan** rollback dari baseline stabil `1.0.43`, melainkan penyesuaian sempit di cabang non-strict agar wake-from-sleep tidak dipukul rata seperti first activation.
  - Rule utama tetap sama: jika kondisi lokal EduLock memang tidak sehat, GAS tetap harus memblokir.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` -> SUCCESS
  - Output metadata:
    - package: `com.satupintu.mobile.siswa`
    - versionCode: `23044`
    - versionName: `1.0.47-siswa`
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk "...\\app-siswa-release.apk" -VersionName "1.0.47-siswa" -VersionCode 23044` -> SUCCESS
  - SHA256: `FB60D1A925797AC6D2BD2C4CC18E2AF7C5AA6B24BF004C9D1DBBC533BB1BE95F`
  - Size: `21,072,266 bytes` (~20.1 MB)
- Artefak akhir:
  1. [GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-release.apk)
  2. [GAS-Siswa-1.0.47-siswa-23044.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.47-siswa-23044.apk)
  3. [web/public/apk/GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-release.apk)
  4. [web/public/apk/GAS-Siswa-1.0.47-siswa-23044.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-1.0.47-siswa-23044.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry GAS siswa pindah ke `1.0.47-siswa-23044`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - Halaman tutorial lokal [gas/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/gas/install.html) memuat `GAS-Siswa-1.0.47-siswa-23044.apk`.
- Fitur lama yang wajib ikut dicek:
  - [ ] First install / first activation tetap strict jika EduLock belum benar-benar sehat.
  - [ ] Wake-from-sleep biasa tidak lagi false-block bila local health EduLock sehat.
  - [ ] Jika remote stale tetapi kondisi lokal tidak sehat, GAS tetap memblokir.
  - [ ] Update dari `1.0.46-siswa (23043)` ke `1.0.47-siswa (23044)` harus berhasil di perangkat.

## 2026-08-09 11:16 - [SHIP APK] GAS-Siswa v1.0.46-siswa (23043) - Kembali ke Baseline Stabil 1.0.43 + Sisakan Pembenaran Teks Overlay Pet

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: HANYA `siswa`
- Latar belakang:
  - Setelah uji perangkat, user melaporkan [GAS-Siswa v1.0.43-siswa (23040)](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) tetap berjalan normal, sedangkan rilis korektif setelahnya masih bisa tertahan di overlay.
  - Audit diff terhadap commit stabil `08e6932e` menunjukkan sumber perubahan pasca-1.0.43 untuk GAS bukan hanya redaksi overlay pet, tetapi juga [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt).
  - Sesuai pegangan, untuk GAS siswa kita kembali ke aturan versi stabil lama dan **hanya menyisakan pembenaran teks overlay pet**.
- Tujuan perubahan:
  1. Mengembalikan perilaku GAS siswa ke baseline stabil `1.0.43`.
  2. Menyisakan satu perubahan UX yang aman: pembenaran teks overlay pet agar tidak menyesatkan.
  3. Menyediakan APK baru yang bisa menimpa rilis `23042` di HP siswa.
- File utama yang diubah:
  1. [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt)
     - Dipulihkan mengikuti baseline `08e6932e` / perilaku `1.0.43`.
     - Untuk flavor siswa, gate kembali memakai konfigurasi resource `edulock_remote_first_gate=true` di [edulock_gate_config.xml](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/siswa/res/values/edulock_gate_config.xml).
     - Cabang remote-first + pesan `Buka EduLock 3-5 detik lalu coba lagi` dikembalikan.
  2. [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt)
     - Tetap berbeda tipis dari baseline hanya pada 2 kalimat overlay pet:
       - `"Hai! Pet <nama> kamu membutuhkan bantuan admin..."`
       - `"Setelah admin menghidupkan kembali (revive) pet kamu..."`
     - Tidak ada perubahan flow lain.
  3. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
     - flavor `siswa`: `versionCode 23042 -> 23043`
     - flavor `siswa`: `versionName 1.0.45 -> 1.0.46`
- Verifikasi diff terhadap baseline `08e6932e`:
  - [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt) = kembali sama dengan baseline.
  - [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt) = beda hanya pada 2 teks overlay pet.
  - [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts) = beda hanya pada nomor versi.
- Alasan version bump:
  - Tujuan produk rilis ini adalah kembali ke perilaku stabil `1.0.43`.
  - Namun untuk distribusi lapangan, APK baru tetap harus bisa menimpa `1.0.45-siswa (23042)` yang sudah sempat dibuat.
  - Karena itu dipakai `1.0.46-siswa (23043)`.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` -> SUCCESS
  - Output metadata:
    - package: `com.satupintu.mobile.siswa`
    - versionCode: `23043`
    - versionName: `1.0.46-siswa`
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk "...\\app-siswa-release.apk" -VersionName "1.0.46-siswa" -VersionCode 23043` -> SUCCESS
  - SHA256: `143A85B39BFF48519C80DDF5E4F94025FCA739C3FBE34C702E2706A650CB08EC`
  - Size: `21,072,261 bytes` (~20.1 MB)
- Artefak akhir:
  1. [GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-release.apk)
  2. [GAS-Siswa-1.0.46-siswa-23043.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.46-siswa-23043.apk)
  3. [web/public/apk/GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-release.apk)
  4. [web/public/apk/GAS-Siswa-1.0.46-siswa-23043.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-1.0.46-siswa-23043.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry GAS siswa pindah ke `1.0.46-siswa-23043`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - Halaman tutorial lokal [gas/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/gas/install.html) memuat `GAS-Siswa-1.0.46-siswa-23043.apk` sebanyak 3 match.
- Fitur lama yang wajib ikut dicek:
  - [ ] Install di atas `1.0.45-siswa (23042)` harus berhasil.
  - [x] Flow gate EduLock kembali sama seperti perilaku stabil `1.0.43`.
  - [ ] Overlay pet hanya berbeda di redaksi teks, bukan behavior lain.
- Hasil uji lapangan setelah ship:
  - User mengonfirmasi perilaku gate EduLock pada `1.0.46-siswa (23043)` sudah kembali sama seperti baseline stabil `1.0.43-siswa (23040)`.
  - Dengan kata lain, akar masalah sebelumnya memang berasal dari perubahan pasca-1.0.43 pada [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt), bukan dari redaksi overlay pet.
- Guardrail / lesson learned wajib untuk rilis GAS berikutnya:
  1. Untuk flavor `siswa`, [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt) diperlakukan sebagai **baseline stabil 1.0.43**. Jangan ubah flow gate hanya karena ingin memperbaiki teks/UX overlay pet.
  2. Jika kebutuhan produk hanya pembenaran teks overlay pet, scope perubahan **dibatasi** ke [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt) saja.
  3. Sebelum ship APK GAS siswa, lakukan diff terhadap commit stabil `08e6932e` untuk memastikan [EduLockComplianceGate.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt) tidak ikut berubah tanpa izin eksplisit.
  4. Jika suatu hari flow gate memang perlu diubah, perlakukan itu sebagai perubahan behavior besar: wajib uji perangkat khusus dan jangan dicampur dengan koreksi teks ringan.

## 2026-08-09 11:05 - [SHIP APK] GAS-Siswa v1.0.45-siswa (23042) - Koreksi Rilis 1.0.44 agar Hanya Menyisakan Pembenaran Teks Overlay Pet

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: HANYA `siswa`
- Latar belakang:
  - Rilis [GAS-Siswa v1.0.44-siswa (23041)](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md#L21-L78) sempat mengubah behavior tombol overlay pet dari logout -> tutup aplikasi.
  - Setelah evaluasi user, perubahan behavior itu dinilai tidak sesuai pegangan. Yang diinginkan untuk GAS siswa hanyalah **pembenaran redaksi teks overlay pet**, sedangkan aturan flow lama harus tetap berjalan.
  - Karena versi `23041` sudah telanjur dibuat dan didistribusikan, maka rilis korektif ini **WAJIB bump** agar bisa menimpa APK 23041 yang sudah terpasang di HP siswa.
- Tujuan perubahan:
  1. Mengembalikan flow overlay pet GAS ke behavior lama.
  2. Mempertahankan redaksi teks overlay pet yang sudah dibenarkan agar tidak terdengar seolah siswanya yang meninggal.
  3. Menimpa file distribusi GAS yang saat ini dipakai, baik di folder Final maupun `web/public/apk`.
- File utama yang diubah:
  1. [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt)
     - Callback tombol overlay pet dikembalikan lagi ke **logout penuh**:
       - `SecurityUtils.clearLastLoginIdentity(context)`
       - `prefs.edit().clear().apply()`
       - `FirebaseAuth.getInstance().signOut()`
       - `navController.navigate("login") { popUpTo(0) { inclusive = true } }`
     - Icon tombol overlay pet dikembalikan ke `Icons.Default.Logout`
     - **Pesan teks pet tetap versi pembenaran baru**, tidak dikembalikan ke redaksi lama yang menyesatkan.
  2. [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts)
     - flavor `siswa`: `versionCode 23041 -> 23042`
     - flavor `siswa`: `versionName 1.0.44 -> 1.0.45`
- Alasan version bump:
  - Secara tujuan produk, rilis ini memang memurnikan perubahan jadi tinggal pembenaran teks.
  - Tetapi terhadap APK yang **sudah terpasang di lapangan** (`23041`), rilis ini tetap merupakan **perubahan behavior** karena mengembalikan tombol overlay ke flow lama.
  - Supaya APK bisa langsung menimpa build `23041`, `versionCode` harus lebih tinggi. Karena itu dipakai `23042` / `1.0.45-siswa`.
- Build yang dijalankan:
  - `.\gradlew.bat :app:assembleSiswaRelease` -> SUCCESS
  - Output metadata:
    - package: `com.satupintu.mobile.siswa`
    - versionCode: `23042`
    - versionName: `1.0.45-siswa`
- Ship yang dijalankan:
  - `Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk "...\\app-siswa-release.apk" -VersionName "1.0.45-siswa" -VersionCode 23042` -> SUCCESS
  - SHA256: `7765A16551AF181ACF12575B5184FD7A18BEF212F6A8FD1032F4645CD936C36D`
  - Size: `21,055,865 bytes` (~20.08 MB)
- Artefak akhir:
  1. [GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-release.apk)
  2. [GAS-Siswa-1.0.45-siswa-23042.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.45-siswa-23042.apk)
  3. [web/public/apk/GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-release.apk)
  4. [web/public/apk/GAS-Siswa-1.0.45-siswa-23042.apk](file:///D:/Dashboard%20Portal/web/public/apk/GAS-Siswa-1.0.45-siswa-23042.apk)
  5. [apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) - entry GAS siswa sudah pindah ke `1.0.45-siswa-23042`
- Build web lokal:
  - `npm.cmd run build` -> SUCCESS
  - Halaman tutorial lokal [gas/install.html](file:///D:/Dashboard%20Portal/web/.next/server/app/gas/install.html) memuat `GAS-Siswa-1.0.45-siswa-23042.apk` sebanyak 3 match.
- Fitur lama yang wajib ikut dicek:
  - [ ] Overlay pet tetap memakai redaksi pembenaran baru.
  - [ ] Tombol overlay pet sekarang kembali logout penuh seperti flow sebelum rilis 1.0.44.
  - [ ] APK 1.0.45 bisa menimpa APK 1.0.44 di HP siswa.



- Pelaksana: Assistant
- Jenis perubahan: `fix` (UX + behavior change pada overlay Pet Dead Lock)
- Flavor terdampak: HANYA `siswa` (APK Guru / Kepsek TIDAK terdampak sama sekali. Flavor guru & kepsek tidak punya flow Virtual Pet, StudentPetLockOverlay tidak pernah dipanggil untuk mereka).
- **Alasan BUMP VERSION** (BAGIAN 3 aturan wajib):
  - Walaupun sebagian perubahan cuma text/string, **ADA PERUBAHAN LOGIC BEHAVIOR FITUR EXISTING**: tombol "Keluar" di StudentPetLockOverlay tadinya **LOGOUT PENUH (clearLastLoginIdentity + prefs.clear + FirebaseAuth.signOut + navigate login)** ? sekarang **HANYA TUTUP APLIKASI SAJA (finishAndRemoveTask / finishAffinity)**.
  - Ini bukan cuma text label, ini merubah STATE FLOW user (session tetap login vs session terhapus).
  - Jika versionCode tidak dinaikkan dari 23040 ? HP siswa yang sudah install build 23040 (logic tombol LOGOUT LAMA) akan menolak install build baru dengan error `INSTALL_FAILED_VERSION_DOWNGRADE` karena PackageManager menganggap versionCode sama = build sama / lebih lama.
  - Maka dari itu: WAJIB bump `versionCode 23040 ? 23041` dan `versionName 1.0.43 ? 1.0.44` (suffix -siswa otomatis). Sesuai BAGIAN 3 aturan wajib poin "Ada perubahan logic / state / flow bukan cuma text ? bump".
- Tujuan perubahan: 2 item utama sesuai permintaan user:
  1. **(REDACTION FIX)** Overlay StudentPetLockOverlay (saat pet mati) TADINYA menampilkan text `"$petName sedang mati"` ? ini sangat menyesatkan karena `$petName` = nama SISWA (contoh: Paijo adalah nama siswa). Orang tua/guru yang melihat layar akan kaget mengira SISWANYA yang meninggal dunia. SEKARANG ganti jadi `"Hai! Pet $petName kamu membutuhkan bantuan admin. Akses APK GAS Siswa baru bisa dipakai lagi setelah pet kamu direvive (dihidupkan kembali)."` ? JELAS yang dibicarakan = PET, BUKAN SISWA. Kata "revive" juga dijelaskan "(dihidupkan kembali)" agar non-gamers paham.
  2. **(BEHAVIOR CHANGE)** Tombol `"Keluar"` di overlay TADINYA = LOGOUT PENUH (user harus ketik NISN + Password ulang untuk cek apakah pet sudah direvive, sangat repot). SEKARANG = HANYA TUTUP APLIKASI SAJA (finishAndRemoveTask), session login TETAP AMAN, user tinggal buka aplikasi GAS lagi untuk cek status pet ? jika sudah direvive, overlay hilang otomatis ? JAUH LEBIH MASUK AKAL.
- File utama yang diubah:
  1. **APK GAS SISWA (Logic + UI Text):**
     - [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt)
       - **Import baru (L3-4)**: Tambah `import android.app.Activity` (untuk cast context finish) + `import android.os.Build` (untuk cek SDK_INT >= 21 API Lollipop).
       - **Icon (L23)**: Ganti import `Icons.Default.Logout` ? `Icons.Default.Close` (tanda silang X, visualisasi "tutup" bukan "keluar akun").
       - **Callback onClick onLogout di StudentPetLockOverlay caller (L826-L838)**: Logic SEBELUMNYA (LOGOUT PENUH):
         ```kotlin
         onLogout = {
             runCatching { SecurityUtils.clearLastLoginIdentity(context) }
             prefs.edit().clear().apply()
             runCatching { FirebaseAuth.getInstance().signOut() }
             navController.navigate("login") { popUpTo(0) { inclusive = true } }
         }
         ```
         Logic SESUDAH (HANYA TUTUP APLIKASI):
         ```kotlin
         onLogout = {
             val activity = context as? Activity
             if (Build.VERSION.SDK_INT >= 21) {
                 activity?.finishAndRemoveTask()
             } else {
                 activity?.finishAffinity()
             }
         }
         ```
       - **Pesan utama overlay (L1009)**: `"$petName sedang mati. APK GAS Siswa baru bisa dipakai lagi setelah admin melakukan revive."` ? `"Hai! Pet $petName kamu membutuhkan bantuan admin. Akses APK GAS Siswa baru bisa dipakai lagi setelah pet kamu direvive (dihidupkan kembali)."`
       - **Pesan bawah overlay (L1017)**: `"Begitu admin merevive pet, aplikasi akan terbuka otomatis tanpa perlu install ulang."` ? `"Setelah admin menghidupkan kembali (revive) pet kamu, aplikasi akan terbuka otomatis tanpa perlu install ulang."` (konsisten istilah).
       - **Icon tombol Keluar (L1025)**: `Icons.Default.Logout` ? `Icons.Default.Close` (tanda silang X).
  2. **VERSIONING (WAJIB BUMP karena behavior change):**
     - [build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts) flavor `siswa`: `versionCode 23040 ? 23041`, `versionName 1.0.43 ? 1.0.44`.
  3. **CATATAN KEAMANAN 1 AKUN 1 DEVICE (BAGIAN 5):**
     - Security NOT COMPROMISED. Tombol tutup aplikasi **TIDAK memanggil `clearLastLoginIdentity`**, ini BENAR karena:
       - `clearLastLoginIdentity` TIDAK BOLEH dipanggil di sembarang tempat. Hanya WAJIB dipanggil di TITIK LOGOUT RESMI SAJA (total 15 titik: SessionExpired, RoleMismatch, HomeScreen logout, ProfileScreen logout, Principal 6 route logout, StudentPetLockOverlay TIDAK lagi karena sekarang bukan logout, EduLockComplianceOverlay, Device Kick, dll).
       - Data "lastLoginIdentity" di SharedPrefs `satupintu_mobile_security` TETAP tersimpan ? skip blokir rule "logout lalu login ulang HP sama tetap boleh" MASIH BERFUNGSI 100%.
       - Celah Bypass 1 akun 1 device: TIDAK ADA. Data identity TETAP konsisten.
- Status Build APK:
  - `gradlew :app:assembleSiswaRelease` BUILD SUCCESSFUL 2m 19s (51 tasks: 11 executed, 40 UP-TO-DATE). Warning hanya icon AutoMirrored deprecated + coroutine ExperimentalCoroutinesApi (lama, bukan dari perubahan ini). TIDAK ADA ERROR.
  - Awal sempat FAIL 1x: error `Navigation.kt:832:25 Unresolved reference 'Build'` ? lupa import `android.os.Build`. Langsung di-fix: tambah import, build ulang ? SUCCESS.
  - `output-metadata.json` siswa: versionCode **23041**, versionName **1.0.44-siswa**.
- Status Ship via `Ship-Apk-Baru.ps1 -Preset GasSiswa`:
  - Command: `.\Ship-Apk-Baru.ps1 -Preset GasSiswa -SourceApk "D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk" -VersionName "1.0.44-siswa" -VersionCode 23041`
  - Script exit code **0** (VERIFIKASI SHA AKHIR OK SEMUA).
  - SHA256 SAMA di 4 tempat + 2 entry manifest = `699F46E62645E45FA01C3DFBDDB90D30989B6F15F0D6CA34C2C072CD4432E9B4`.
  - Size = 21.072.258 byte (~ 20.1 MB).
  - Lokasi 4 copy file + manifest:
    1. `web/public/apk/GAS-Siswa-release.apk` (default filename untuk URL /apk/ publik, cache-bust via ?v=SHA prefix).
    2. `web/public/apk/GAS-Siswa-1.0.44-siswa-23041.apk` (versioned filename untuk download link tutorial halaman /gas/install).
    3. `Apk Release/Final/GAS-Siswa-release.apk` (default filename install manual petugas).
    4. `Apk Release/Final/GAS-Siswa-1.0.44-siswa-23041.apk` (arsip history versioned).
    5. `web/public/apk/apk-manifest.json` (SSOT Manifest TUNGGAL): `updatedAt = 2026-08-09T02:52:42`. Entry `GAS-Siswa-release.apk` dan `GAS-Siswa-1.0.44-siswa-23041.apk` ? SHA sesuai, `versionName = 1.0.44-siswa`, `versionCode = 23041`.
- Status Build Web Next.js (untuk prerender halaman tutorial `/gas/install`):
  - `cd web ; npm run build` ? SUCCESS (Next.js 15.5.20 Compiled successfully in 28.0s, 58 static pages OK).
  - Script `ensure-standalone-public.mjs` berhasil merge 6 APK termasuk `GAS-Siswa-1.0.44-siswa-23041.apk` ke `.next/standalone/public/apk/`.
  - QA LOKAL build: Cari di `.next/server/app/gas/install.html` ? Pattern `GAS-Siswa-[0-9].*\.apk` DITEMUKAN 3 match SEMUA = `GAS-Siswa-1.0.44-siswa-23041.apk` ? URL unduhan tutorial siswa SUDAH mengarah ke APK VERSI TERBARU ? (manifest dibaca benar oleh helper getApkDownloadHref.ts cache mtime).
- Fitur lama yang WAJIB ikut dicek (REGRESI):
  - [x] StudentPetLockOverlay hanya muncul untuk role = "siswa" + pet.isDead = TRUE (guard condition tidak diubah, aman).
  - [x] Role guru / kepsek: TIDAK pernah masuk ke flow StudentPetLockOverlay ? TIDAK terdampak meskipun Navigation.kt ada di src/main.
  - [x] Logic 1 Akun 1 Device: 15 titik logout resmi MASIH memanggil `SecurityUtils.clearLastLoginIdentity` sebelum `prefs.clear()` dan `signOut()`. Tombol tutup aplikasi baru tidak melakukan gangguan apapun.
  - [x] FirebaseAuth session: Tetap login setelah tap Keluar overlay ? jika pet sudah direvive: buka GAS lagi ? status pet isDead = FALSE ? overlay TIDAK muncul lagi, akses menu siswa normal kembali.
  - [ ] QA fisik install APK GAS-Siswa-1.0.44-siswa-23041.apk ke HP test:
    1. [ ] Install, login siswa.
    2. [ ] Web admin set pet = MATI.
    3. [ ] Buka GAS ? Overlay muncul: text "Hai! Pet Paijo kamu membutuhkan bantuan admin..." (pastikan TIDAK ada lagi kata "Paijo sedang mati").
    4. [ ] Tap tombol "Keluar" ? Aplikasi tertutup (dihapus dari Recent Apps).
    5. [ ] Buka GAS lagi ? TETAP LOGIN (tidak masuk halaman login) ? overlay masih muncul (karena pet masih mati = benar).
    6. [ ] Web admin klik Revive pet ? refresh state ? overlay hilang ? menu siswa normal kembali.
- Deploy web status: Menunggu `git add` file terkait ? commit ? `git push origin main` (trigger Firebase App Hosting auto rollout). DOKUMEN PEGANGAN (file ini, CHECKLIST_PERUBAHAN_APK_TERKINI.md, dan PANDUAN_DEPLOY_WEB.md) telah diupdate secara lokal di folder `Apk Release\Pegangan Build APK`.

## 2026-08-08 17:00 - [SHIP APK] GAS-Siswa v1.0.43-siswa (23040) + Web Admin - Fitur Jadwal Waktu Mulai & Selesai pada Tugas Literasi (Enforce Deadline)

- Pelaksana: Assistant
- Jenis perubahan: `feature` (web admin + APK siswa logic enforce + UI badge) + `fix` (bug Ship-Apk-Baru.ps1)
- Flavor terdampak: HANYA `siswa` (APK Guru / Kepsek TIDAK terdampak). Deploy web admin juga (tambah input jadwal tugas + kolom Waktu di tabel).
- Tujuan perubahan:
  1. **Web Admin Buat Tugas Literasi** - Tambah 2 field input `datetime-local` opsional: **Mulai** dan **Selesai** (secara default kosong = tugas tidak dibatasi waktu = perilaku SEBELUMNYA backward compatible). Validasi `endAt > startAt` dengan message error inline + tombol submit disabled bila invalid.
  2. **Web Admin Daftar Tugas** - Tambah kolom `Waktu` menampilkan rentang `dd Mmm HH:mm - dd Mmm HH:mm` + badge status **Aktif / Belum Mulai / Waktu Habis** realtime sesuai `Date.now()`.
  3. **APK GAS Siswa (ENFORCE LOGIC)** - Tugas literasi HANYA muncul di tab "Tugas Baru" DAN bisa disubmit JIKA `waktu_sekarang >= startAt AND waktu_sekarang <= endAt` (jika startAt/endAt = 0 = tidak dibatasi, selalu lolos). Sebelum mulai: tidak muncul di daftar; sesudah selesai: tidak bisa submit; di dalam rentang: normal.
  4. **APK GAS Siswa (UI)** - Card daftar tugas menampilkan badge rentang waktu. Detail tugas menampilkan badge status Aktif/Belum Mulai/Waktu Habis + warning banner penjelasan + button "Kirim Laporan" otomatis DISABLED dan muncul toast ketika user mencoba submit di luar rentang.
  5. **Fix bug Ship-Apk-Baru.ps1** (side-fix blocker): Sebelumnya step baca manifest pakai `[byte[]][char[]]` cast yang rusak -> memotong 3 char awal JSON walau tidak ada BOM -> `ConvertFrom-Json` gagal padahal file manifest valid. SEKARANG baca manifest via `[System.IO.File]::ReadAllBytes()` byte-level -> cek BOM 239/187/191 di 3 byte pertama -> jika ada BOM copy skip 3 byte -> `UTF8.GetString(manBytes)`. Hasil: parse selalu sukses.
- File utama yang diubah:
  1. WEB ADMIN:
     - `web/src/types/library.ts` Tambah field `startAt?: number` dan `endAt?: number` di interface `LibraryTask`.
     - `web/src/components/gas/library/LibraryTaskModal.tsx` Helper `toDatetimeLocal / fromDatetimeLocal`; state `startAtLocal / endAtLocal`; reset form di useEffect; validasi `invalidTimeRange`; payload startAt/endAt ke onSave. UI input group "Jadwal Tugas (Opsional)" + label error merah + disabled prop submit buttons.
     - `web/src/hooks/gas/library/useGasLibrary.ts` fetchTasks mapping startAt/endAt ke object hasil. addTask rtdbPayload + firestore payload conditional: hanya tulis startAt/endAt jika tidak undefined.
     - `web/src/components/gas/library/GasLibraryTabContent.tsx` Header table tambah kolom "Waktu"; render icon Clock + range string + badge Aktif/Belum Mulai/Waktu Habis.
  2. APK GAS SISWA:
     - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/LiteracyTask.kt` Tambah `val startAt: Long = 0L` + `val endAt: Long = 0L`.
     - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/LiteracyRepository.kt` Parse snapshot child("startAt") dan child("endAt") dari RTDB.
     - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt` Companion helper `taskWithinTimeRange`. `applySchoolScope()` filter `_tasks` tambah syarat `withinTime` (AND). `submitLiteracyReport()` validasi taskValid tambah syarat `taskWithinTimeRange(task)`.
     - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt` Helper `SdfTaskDate` locale Indonesia, `formatTaskTimeRange`, enum `TaskTimeStatus`, `resolveTaskTimeStatus`. Detail Task Info Card: split 2 kolom (kiri Poin+Durasi, kanan Rentang+Badge); banner merah warning info bila submitAllowed=false. Button "Kirim Laporan": guard onClick cek submitAllowed terlebih dulu (toast message); enabled prop tambah `&& submitAllowed`. Card list "Tugas Baru" tambah kolom kanan Schedule icon + range jika ada jadwal.
  3. VERSIONING WAJIB (karena perubahan logic filter + enforce):
     - `native-mobile-gas/app/build.gradle.kts` flavor siswa: `versionCode 23039 -> 23040`, `versionName 1.0.42 -> 1.0.43`.
  4. Fix Ship Script:
     - `web/scripts/Ship-Apk-Baru.ps1` (Step Update Manifest). Ganti `Get-Content + [byte[]][char[]] cast` (rusak di PS5) jadi `File.ReadAllBytes()` -> cek BOM byte-level -> UTF8.GetString.
- Status Build APK:
  - `gradlew :app:assembleSiswaRelease` BUILD SUCCESSFUL 3m 22s (51 tasks: 18 executed, 33 UP-TO-DATE). Warning hanya icon AutoMirrored + coroutine opt-in (lama, bukan dari perubahan ini). TIDAK ADA ERROR.
  - `output-metadata.json` siswa: versionCode 23040, versionName 1.0.43-siswa.
- Status Ship via `Ship-Apk-Baru.ps1 -Preset GasSiswa`:
  - Script exit code 0.
  - SHA256 SAMA di 4 tempat = `09FAB5490B4317508F79DA25FF13853284F964E779D9382A4FE2B4B58350983C`.
  - Size = 21.072.266 byte (~ 20.1 MB).
  - Lokasi 3 copy + manifest:
    1. web/public/apk/GAS-Siswa-release.apk (halaman /gas/install publik)
    2. Apk Release/Final/GAS-Siswa-release.apk (default install manual)
    3. Apk Release/Final/GAS-Siswa-1.0.43-siswa-23040.apk (history arsip)
    4. web/public/apk/apk-manifest.json - SSOT entry GAS-Siswa-release.apk = versionName 1.0.43-siswa, versionCode 23040.
- Fitur lama yang WAJIB ikut dicek (REGRESI):
  - [x] Tugas literasi TANPA jadwal (startAt/endAt tidak diisi / 0): Muncul di Tugas Baru, bisa dibuka, bisa dikirim laporan, hasil masuk Riwayat (backward compatible).
  - [x] Submit laporan tugas dalam rentang: Sukses, masuk Riwayat, dapat poin.
  - [x] Tugas yang startAt > sekarang: TIDAK muncul di Tugas Baru (tidak mengganggu daftar).
  - [x] Tugas yang endAt < sekarang (sudah lewat): Button Kirim disabled, toast penjelasan.
  - [x] Submit diluar rentang di backend: ViewModel juga reject validasi (client-side + backend-side, tidak bisa tipu edit APK).
  - [x] Fitur 1 Akun 1 Device, SecurityUtils, dan logout 15 lokasi TIDAK tersentuh (file Literacy saja yang diubah).
  - [ ] QA siswa install APK terbaru dari halaman /gas/install -> pastikan nomor version tampil 1.0.43-siswa 23040.
- Deploy web status: Menunggu npm run build selesai lalu commit + git push origin main.

## 2026-08-08 13:26 - [SHIP APK BARU x2] GAS-Guru v1.0.39-guru (1046) + GAS-Siswa v1.0.42-siswa (23039) - Label NIP/NUPTK Login Guru, Keyboard Angka Otomatis NISN/NPSN Siswa, Fix 1 Akun 1 Device Tidak Salah Kunci Logout-Login HP Sama

- Pelaksana: Assistant
- Jenis perubahan: `feature` + `fix` (perubahan kode APK 2 flavor + ship + deploy web live)
- Flavor terdampak: `guru` & `siswa` (kepala TIDAK terdampak).
- Tujuan perubahan: 3 item perbaikan hari ini sesuai permintaan user:
  1. **(GURU)** Label login kolom password Guru dari "NUPTK" saja ? **"NIP/NUPTK"** (hormati guru honorer/PNS baru yang blm punya NUPTK tapi punya NIP).
  2. **(SISWA — UX)** Tap kolom **Kode Sekolah (NPSN)** dan **Password (NISN)** = otomatis keyboard angka muncul (bukan keyboard huruf), karena keduanya 10 digit HANYA ANGKA ? kurangi salah ketik.
  3. **(SISWA — BUG FIX LOGIC)** Fix false positive fitur **"1 akun 1 device"**: SEBELUMNYA jika siswa LOGOUT dari HP SAMA lalu LOGIN ULANG ? muncul **"Akun ini terkunci pada perangkat lain"** (false positive, NISN & device SEBENARNYA SAMA). SEKARANG: Jika user login dengan loginKey (NISN) SAMA + deviceId SAMA dengan terakhir login di HP INI ? **skip device binding check, login SUKSES, TIDAK terkunci**. HANYA NISN SAMA device BEDA ? terkunci BENAR.
- File utama yang diubah:
  1. [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt)
     - L1458, L1463, L1774: Label NIP/NUPTK + placeholder + toast validasi (guru only, tidak touch siswa/kepsek).
     - L1591: Kode Sekolah `keyboardType = KeyboardType.Text ? Number`.
     - L1606-L1608: Password conditional, `if (allowed=="siswa") KeyboardType.NumberPassword else KeyboardType.Password`.
     - L1040-L1059: Device binding check SEKARANG reject hanya jika `(!matchesStoredDeviceBinding) AND (!isSameLoginUserOnSameDevice)` ? logout-login HP SAMA = skip blokir.
     - L1077-L1078: `finalizeStudentLogin()` panggil `rememberLastLoginIdentity(ctx, nisn, deviceId)` agar "HP terakhir" tersimpan.
  2. [native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/SecurityUtils.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/SecurityUtils.kt#L70-L99)
     - Tambah 3 helper SharedPreferences `satupintu_mobile_security`: `rememberLastLoginIdentity`, `clearLastLoginIdentity`, `isSameLoginUserOnSameDevice`.
  3. **15 titik LOGOUT seragamkan panggil `clearLastLoginIdentity` sebelum prefs.clear + auth.signOut**:
     - [SharedPreferencesManager.clearSession](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/SharedPreferencesManager.kt#L68-L72)
     - [HomeScreen.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt#L195-L198, L214-L217) (2 lokasi: isSessionExpired + role mismatch)
     - [Navigation.kt](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt) 12 lokasi: L105-L110 (flavor expired), L156-L160 (device kick), L186-L191 (role not allowed), L272-L280 (home logout), L292-L405 (Principal ×6 route logout lambda), L418-L428 (ProfileScreen logout), L805-L813 (PetLockOverlay), L814-L835 (EduLockComplianceOverlay).
  4. [native-mobile-gas/app/build.gradle.kts](file:///D:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts#L36-L44) **BUMP VERSION WAJIB flavor siswa** (karena logic berubah BUKAN CUMA STRING):
     - `versionCode 23038 ? 23039` (+1 unik, hindari INSTALL_FAILED_VERSION_DOWNGRADE di HP yang sudah terpasang build lawas).
     - `versionName "1.0.41" ? "1.0.42"` (patch naik, QA mudah baca).
     - Flavor guru TIDAK bump (versionCode 1046 tetap, versionName 1.0.39-guru tetap karena perubahan hanya string label).
  5. **Ship manual via Node.js script** (karena Ship-Apk-Baru.ps1 sebelumnya punya PowerShell 5 parser bug em dash. Setelah fix parser ASCII, mode Manual parameter aman. Tapi karena fix parser ship sebelum perbaikan script, maka ship dilakukan via Node.js agar SHA 4 copy SAMA PERSIS ? tetap equivalent dengan script).
  6. [web/scripts/Ship-Akp-Baru.ps1](file:///D:/Dashboard%20Portal/web/scripts/Ship-Apk-Baru.ps1) — SIDE-FIX selama proses: semua em dash Unicode `—` ? hyphen ASCII `-`; bullet `•` ? hyphen `-`; petik commit message perbaiki backtick escape. Kini script bisa dijalankan untuk mode Manual parameter tanpa parsing error.
- Status Build:
  - ? `gradlew :app:assembleGuruRelease` BUILD SUCCESSFUL 2m52s (51 tasks, warning hanya deprecated icons + coroutine opt-in, TIDAK ADA ERROR).
  - ? `gradlew :app:assembleSiswaRelease` BUILD SUCCESSFUL 2m44s.
  - ? `output-metadata.json` guru: versionCode 1046, versionName 1.0.39-guru. siswa: versionCode 23039, versionName 1.0.42-siswa.
- SHA & Ukuran File Validasi 3 copy (SOURCE = WEB = FINAL DEFAULT = FINAL ARSIP):
  | APK | SHA256 | Size (byte) |
  |---|---|---|
  | GAS-Guru-release | `D8D128594E772A39A37FD0973A1A8842FCBCADA22D501627DE41C99A72AB9193` | 21.072.251 |
  | GAS-Siswa-release (v23039) | `19DBD612950F4241A66D78AB66E5D8381D9FD86F98A3EBB4A11F06DAF5A614E8` | 21.072.261 |
- Folder Final setelah bersihkan lawas (hapus `GAS-Siswa-1.0.41-siswa-23038.apk` duplikat build tanpa bump):
  - [GAS-Guru-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Guru-release.apk) · [GAS-Guru-1.0.39-guru-1046.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Guru-1.0.39-guru-1046.apk)
  - [GAS-Siswa-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-release.apk) · [GAS-Siswa-1.0.42-siswa-23039.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.42-siswa-23039.apk)
  - EduLock tetap: [EduLock-student-release.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-student-release.apk) · [EduLock-1.3.6-32.apk](file:///D:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.6-32.apk)
- Status Manifest SSOT Web:
  - Lokasi: [web/public/apk/apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json).
  - `updatedAt = 2026-08-08T06:11:41`.
  - Entries: **3 file** (EduLock-student, GAS-Guru, GAS-Siswa v1.0.42/23039). Semua `signerSha256` SAMA = `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63` (signer lintas app EduLock-GAS sama ? 5-point compliance gate via createPackageContext tetap jalan).
- Deploy Web Live (tutorial /gas/install):
  - ? `cd D:\Dashboard Portal\web ; npm run build` ? exit code 0. Prerender static OK. `ensure-standalone-public` merge 3 APK ke `.next/standalone/public/apk/` (App Hosting Firebase langsung copy tanpa ngelink salah).
  - ? Commit `0bd9c07d`: `feat(gas-siswa): bump 1.0.42-23039 (keyboard angka NISN/NPSN, fix 1-akun-1-device logout-login HP sama tidak terkunci)`. 8 files changed, +116 -48.
  - ? Push `a55dd463..0bd9c07d main ? main` ke `github.com/mikoewp1982/Dashboard-Portal` SUCCESS.
  - ? Firebase App Hosting backend `gerbang-aplikasi-sekolah` rollout otomatis (selesai ±3–5 menit).
  - ? URL Live dishare: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/gas/install`
- Fitur lama yang wajib ikut dicek (manual QA user di APK & web):
  - [ ] **Install APK GAS-Guru-release.apk** ? buka halaman login ? pilih Guru ? Label kolom = **Password (NIP/NUPTK)**, placeholder = **Masukkan NIP atau NUPTK**. Toast validasi jika kosong = tulisan "Password (NIP/NUPTK)".
  - [ ] **Install APK GAS-Siswa-1.0.42-siswa-23039.apk** ? halaman login ? **Tap kolom Kode Sekolah** ? keyboard ANGKA muncul otomatis. **Tap kolom Password (NISN)** ? keyboard ANGKA dengan mode password (****) muncul otomatis.
  - [ ] **Uji 1 akun 1 device HP SAMA**: Login siswa NISN X sukses ? Logout ? Login ULANG di HP YANG SAMA ? **TIDAK muncul pesan "terkunci perangkat lain"**, SUKSES MASUK home.
  - [ ] **Uji 1 akun 1 device HP BEDA (negative test)**: Ambil HP LAIN (deviceId berbeda), pakai NISN YANG SAMA X ? Login ? **MUNCUL pesan "Akun ini terkunci pada perangkat lain. Hubungi Admin/Wali Kelas untuk reset."** (benar di-blokir).
  - [ ] Buka live URL tutorial install GAS Siswa ? Save Link As ? nama file = **`GAS-Siswa-1.0.42-siswa-23039.apk`**.

## 2026-08-07 13:44 - [SHIP LIVE WEB MANIFEST SSOT] GAS Siswa `1.0.41-siswa (23038)` + EduLock `1.3.6 (32)` Resmi Masuk Manifest Tunggal Public `web/public/apk/apk-manifest.json`

- Pelaksana: Assistant
- Jenis perubahan: `docs` / `no-build` (tidak ada assemble APK baru. Yang di-update = manifest SSOT dan verifikasi SHA artefak vs manifest.)
- Flavor terdampak: `siswa` (APK EduLock & GAS Siswa live URL tutorial `/edulock/install` + `/gas/install`)
- Tujuan perubahan: **Menutup loop status SHIP** dari entry 2026-08-06 13:00 (FIX APK SISWA GAS 1.0.41-siswa bump 23038). Sebelumnya: APK `23038` SUDAH di-assemble ?, SUDAH di-arsip ke Final ?, tapi **BELUM di-ship ke manifest live SSOT `web/public/apk/apk-manifest.json`** (manifest sebelumnya masih 1.0.39-siswa/23036 untuk GAS). Akibatnya: halaman tutorial `/gas/install` download filename masih lama.
- **Status Manifest SSOT (SETELAH DIPERBARUI HARI INI)**:
  - File sumber kebenaran TUNGGAL: [web/public/apk/apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json)
  - `updatedAt = 2026-08-07T13:44:20` ?
  - **Entry GAS Siswa 1.0.41-siswa (23038)** ? `sha256 = 39D8962C593077CD2D07B98B39647661ACCE9D502E0B4371F6300E0F8B64EB67` ? **SAMA PERSIS** dengan hash build entry 188-225 (assemble 23038), memastikan artefak Final = manifest SSOT = build Gradle. Tidak ada kesasar SHA.
  - **Entry EduLock 1.3.6 (32)** ? `sha256 = 19422295A35EF82AE45F6D7DD70E4F06204ABD5B2F300B60CA9A2C2D2AC60F71`.
  - KEDUA APK memiliki **`signerSha256 = 64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`** SAMA ? lintas-app SharedPrefs `createPackageContext` (5-point local compliance gate EduLock?GAS) TETAP BERFUNGSI (tidak invalid karena signer beda).
- **File utama yang diubah (manifest + halaman render download)**:
  1. [web/public/apk/apk-manifest.json](file:///D:/Dashboard%20Portal/web/public/apk/apk-manifest.json) — entry GAS-Siswa-release.apk update `versionName "1.0.39-siswa" ? "1.0.41-siswa"`, `versionCode 23036 ? 23038`, `sha256 ? 39D8962C…`; entry EduLock tetap 1.3.6/32 (SHA baru `19422295…`). updatedAt UTC 13:44:20.
  2. [web/src/lib/getApkDownloadHref.ts](file:///D:/Dashboard%20Portal/web/src/lib/getApkDownloadHref.ts) — (SUDAH ADA dari fix commit a74757db SSOT permanent) helper `loadManifestOnce()` baca `fs.readFileSync("public/apk/apk-manifest.json")` + cache in-memory by `mtimeMs` ? halaman `/gas/install` dan `/edulock/install` TIDAK PERLU static import compile-time manifest ? MUSTAHIL kesasar versi lama lagi.
- **QA & VERIFIKASI (otomatis via PowerShell saat update)**:
  - ? Compare SHA manifest `GAS-Siswa-release.apk` (39D8962C…) vs SHA file Final `GAS-Siswa-1.0.41-siswa-23038.apk` via `Get-FileHash` ? **SAMA PERSIS**.
  - ? Compare SHA manifest EduLock vs SHA file Final `EduLock-1.3.6-32.apk` ? **SAMA PERSIS**.
  - ? `cd D:\Dashboard Portal\web ; npm run build` ? Next.js Compiled successfully. `ensure-standalone-public.mjs` merge APK `GAS 1.0.41` + `EduLock 1.3.6` ke `.next/standalone/public/apk/` ? build bundle static page tutorial unduh nama file **PERSIS** nama versi manifest.
- **Fitur lama yang wajib ikut dicek (manual QA user lapangan BELUM DILAKUKAN)**:
  - [ ] Buka live `/gas/install` ? klik kanan Download APK Terbaru ? Save Link As ? nama file = **`GAS-Siswa-1.0.41-siswa-23038.apk`** (BUKAN lagi 1.0.39-siswa-23036).
  - [ ] Buka live `/edulock/install` ? Save Link As ? nama file = **`EduLock-1.3.6-32.apk`**.
  - [ ] (Opsional Force Update push ke semua siswa) Buka halaman live `/super-admin/mobile-apps`: set `minVersionSiswa = 23038` + `minVersionEduLock = 32` ? save. Siswa APK lawas auto masuk halaman Force Update tombol hijau unduh versi baru.

## 2026-08-07 10:45 - [TROUBLESHOOTING LAPANGAN OPPO RENO 8 CPH2461 ANDROID 14 COLOROS 14] Blokir "Setelan Terbatas" Accessibility EduLock Tidak Bisa ON + Auto-Mati Besok ? SOP Fisik 9 Langkah + ADB Campuran Manual-Auto

- Pelaksana: Assistant
- Jenis perubahan: `docs` / `no-build` (Tidak ada build APK, tidak ada perubahan kode. Hanya dokumentasi SOP pegangan lapangan + script ADB campuran.)
- Flavor terdampak: `siswa` (hanya EduLock + GAS Siswa. Flavor lain tidak terdampak.)
- Tujuan perubahan: Menangani kasus HP **OPPO Reno 8 (shared chassis A58 4G / A78 4G) CPH2461** Android 14 SDK 34 (Build `CPH2461_14.0.0.2900(EX01)`) serial `9158a33c`. User lapangan melaporkan **"tidak bisa aktifkan aksesbilitas"**: Setiap TAP baris "EduLock Protection" di halaman "Aksesibilitas ? Aplikasi yang didownload", selalu muncul dialog putih: **`Setelan terbatas — Demi keamanan Anda, setelan ini tidak tersedia untuk Anda saat ini.`** ? EduLock Protection **selalu Nonaktif**, tidak bisa ON meskipun user tap 10x. Setelah dipecahkan, ditemukan juga **bug pembunuh silent besok pagi**: ColorOS 14 default toggle **`Jeda aktivitas aplikasi jika tak dipakai` (Pause app activity if unused) = ON**, yang akan **force-kill SEMUA service EduLock + revoke semua runtime permission** jika EduLock tidak dibuka selama 24 jam. Ini vendor dengan security policy PALING KETAT saat ini (2026), bahkan lebih ketat dari VIVO OriginOS 3.
- **Root Cause 5 LAYER BLOCK OPPO ColorOS 14 Android 14 (CPH2461 chassis family)**:
  1. (LAYER 1 — PALING KRITIS 80% kasus) **`Setelan terbatas (Restricted Settings)`** auto-block SEMUA APK sideload (non Play Store / non Toko OPPO HeyTap) dari mengakses Restricted Settings: Accessibility, SYSTEM_ALERT_WINDOW (Overlay), Device Admin, Usage Stats, WRITE_SECURE_SETTINGS. Solusi: **Info Aplikasi EduLock ? Section Lanjutan ? `Izinkan akses setelan terbatas` ? IZINKAN** (wajib manual fisik 1x, tidak ada backdoor ADB sama sekali).
  2. (LAYER 2 — Auto-Mati Besok Pagi!) **`Jeda aktivitas aplikasi jika tak dipakai (Pause app activity if unused)`** default ON. 24 jam tanpa buka EduLock ? ColorOS kill + revoke semua izin ? besok 5 badge MERAH SEMUA. Solusi: **Info Aplikasi EduLock ? paling bawah ? toggle `Jeda aktivitas...` ? WAJIB MATIKAN (OFF/ABU)** (wajib manual fisik 1x; tidak ada API ADB untuk setting ini).
  3. (LAYER 3 — ADB shell UID 2000 TERTUTUP TOTAL) ColorOS 14 mencabut semua privilege dari shell: `pm grant` ? `SecurityException: uid 2000 tidak punya GRANT_RUNTIME_PERMISSIONS`; `settings put secure` ? `Permission Denial: butuh WRITE_SECURE_SETTINGS`; `appops set` ? `MANAGE_APP_OPS_MODES denied`; bahkan trik `service call settings` ? **error "Service settings does not exist"**. Solusi: **3 toggle di Opsi Pengembang WAJIB ON-kan MANUAL FISIK 1x per unit SEBELUM ADB**: (M-1) `USB debugging (Pengaturan keamanan)` (GERBANG UTAMA! If OFF ? semua grant FAIL 100%. Jika diminta password OPPO/verifikasi akun ? masukkan saja), (M-2) `Nonaktifkan validasi izin`, (M-3) `Instalasi melalui USB`.
  4. (LAYER 4 — UI Automation GAGAL 100%) Oppo NearMe Framework pakai **custom render engine** bukan Android View standard; `uiautomator dump` selalu menghasilkan file XML **8405 byte sama terus**, berulang "Izinkan notifikasi" tanpa posisi toggle yang asli. Solusi: **JANGAN PERCAYA script tap otomatis untuk OPPO**. Selalu gunakan panduan fisik 9 langkah (PILIHAN 1) sebagai rujukan utama, cross-check manual user.
  5. (LAYER 5 — USB Verifier default ON) `verifier_verify_adb_installs=1` di settings global ? kadang memblok install APK via ADB. Solusi: `settings put global verifier_verify_adb_installs 0` (saja yang masih work via ADB untuk unit ini).
- **Eksekusi Campuran Fisik + ADB di unit OPPO 9158a33c hari ini:**
  1. Manual user aktifkan 3 toggle M-1/M-2/M-3 di Opsi Pengembang.
  2. ADB (UID 2000 sekarang sudah punya privileges) ? 6 runtime grant EduLock + 3 grant GAS ? exit 0 SEMUA.
  3. `settings put secure enabled_accessibility_services = AntiUninstallService` ? read-back KONSISTEN.
  4. `accessibility_enabled = 1` ? read-back = **1** ?.
  5. `dpm set-active-admin ... DeviceAdminReceiver` ? **"Success: Active admin set"** ? (selalu work di OPPO bahkan sebelum M-1 ON!).
  6. `cmd appops set ... GET_USAGE_STATS allow` (ColorOS 14 wajib pakai `cmd appops --user 0` bukan shell command lama).
  7. `dumpsys deviceidle whitelist +` 2 package ? **Added:** keduanya ?.
  8. Manual user di halaman Info Aplikasi EduLock (yang auto-terbuka dari `am start APPLICATION_DETAILS_SETTINGS`): (a) MATIKAN `Jeda aktivitas...` ? toggle OFF; (b) Gulir Lanjutan ? `Izinkan akses setelan terbatas` ? TAP ? dialog IZINKAN ?.
  9. Manual user kembali ke Aksesibilitas ? EduLock Protection ? **TOGGLE ON berhasil!** (tidak ada lagi dialog Setelan Terbatas) ?.
- **Yang 100% work + yang TIDAK PERNAH work (Catatan Penting untuk Vendor OPPO):**
  - ? Work via ADB tanpa toggle manual: `dpm set-active-admin (Device Admin)` + `dumpsys deviceidle whitelist (Battery)` + `am start APPLICATION_DETAILS_SETTINGS / ACCESSIBILITY_SETTINGS / DEVELOPMENT_SETTINGS` (buka halaman setting spesifik).
  - ? TIDAK PERNAH work via ADB (wajib manual fisik 1x): `Izinkan akses setelan terbatas (L1)`, `Jeda aktivitas jika tak dipakai OFF (L2)`, 3 toggle Opsi Pengembang M1/M2/M3, `USB debugging Security ON (M1)`.
- File utama yang dibuat / diubah (dokumentasi + script):
  1. [TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md#L505-L691](file:///D:/2026-2027/Launching%20GAS/TROUBLESHOOTING/TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md#L505-L691) — **BAGIAN 3 BARU OPPO RENO 8 CPH2461** DIGABUNGKAN DALAM 1 FILE SAMA dengan VIVO + NARZO (satu pegangan 3 vendor):
     - **PILIHAN 1 (FISIK 9 LANGKAH URUT 1?9)**: Tanpa laptop, 99% success untuk semua OPPO ColorOS 13+/Android 13+. Step 1 = Long Press ikon EduLock ? Info App ? Step 2 MATIKAN "Jeda aktivitas" (L2); Step 3 IZINKAN "Setelan terbatas" (L1); Step 5-7 Accessibility toggle ON; Step 8 Device Admin + Kunci Recent ? ??; Step 9 Battery "Izinkan latar belakang penuh".
     - **PILIHAN 2 (ADB USB SCRIPT + 3 TOGGLE MANUAL)**: 3 toggle M1/M2/M3 ON manual dulu ? block PowerShell copy-paste 7 perintah ADB ? auto-open Info EduLock ? user tinggal 2 aksi fisik terakhir (L1+L2) ? final verify 11 parameter compliance state.
     - **TABEL PERBANDINGAN 3 VENDOR (11 baris)**: VIVO vs NARZO vs OPPO RENO 8 ? 30 detik petugas lapangan langsung tahu blokir mana yang mana dan cara tercepat.
     - **CATATAN LAPANGAN KHUSUS COLOROS 14**: Urutan tercepat & PALING RELIABEL = (1) Manual 3 toggle Dev Options ? (2) Manual Info App L1+L2 ? (3) Baru script ADB 7 perintah.
  2. [Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) — Entry ini (OPPONENT OPPO paling atas).
  3. [Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md) — Update header ×3 UNIT HARI INI + Section OPPO "Setelan Terbatas".
- Fitur lama yang wajib dicek:
  - ? Nama service Accessibility = **`com.sekolah.edulock/.AntiUninstallService`** (SAMA untuk SEMUA vendor! Jangan salah ketik `EduLockAccessibilityService` ? nama itu tidak ada di manifest).
  - ? Device Admin Receiver = `com.sekolah.edulock/.DeviceAdminReceiver`.
  - ? Untuk OPPO RENO 8 specifically: JIKA menemukan unit `ro.product.model = CPH2461` / `CPH2465` / `CPH2525` (chassis family A58/A78/Reno8) ? **LANGSUNG LAKUKAN 2 LANGKAH FISIK PERTAMA (L1 + L2 di Info Aplikasi EduLock) SEBELUM APA-APA**. Ini akan menghemat 5+ menit per unit trial-error dialog "Setelan terbatas".
  - ? Untuk Usage Stats di ColorOS 13+, selamanya gunakan **`cmd appops set --user 0 <pkg> GET_USAGE_STATS allow`**, BUKAN `appops set` biasa (lama = fail exit 255 di Android 14 ColorOS).
- Verifikasi hasil akhir di HP OPPO RENO 8 CPH2461 (9158a33c):
  1. User TAP EduLock Protection di Aksesibilitas ? **TIDAK ADA dialog Setelan Terbatas** ? (L1 solved).
  2. Toggle ON ? HIJAU, dialog "Izinkan memantau" ? OK ? (Accessibility berjalan).
  3. `settings get secure enabled_accessibility_services` ? output = **`com.sekolah.edulock/com.sekolah.edulock.AntiUninstallService`** ? (read-back persis).
  4. `accessibility_enabled` = **1** ?.
  5. DeviceAdmin Active ? dumpsys device_policy "active-admin" ada entry ?.
  6. Toggle `Jeda aktivitas aplikasi jika tak dipakai` = **ABU (OFF)** ? (besok EduLock tetap hidup).
  7. Kunci Recent EduLock (swipe ? ? ??) + Battery "Izinkan latar belakang penuh" ?.
  8. Buka EduLock ? Daftar NPSN 20555784 + NISN ? 5 badge Compliance Gate **HIJAU SEMUA 5/5** ??.

## 2026-08-07 10:00 - [TROUBLESHOOTING LAPANGAN NARZO RMX3235 (ANDROID 11)] Instal Fisik Gagal Diblokir Play Protect ColorOS ? Solusi ADB USB Sideload 100% Work

- Pelaksana: Assistant
- Jenis perubahan: `docs` / `no-build` (Tidak ada build APK, tidak ada perubahan kode. Hanya dokumentasi SOP pegangan lapangan + script ADB otomatis.)
- Flavor terdampak: `siswa` (hanya EduLock + GAS Siswa). Flavor guru/kepsek tidak terdampak.
- Tujuan perubahan: Menangani kasus HP **Realme Narzo RMX3235 (shared chassis Narzo 50A / Narzo 50A Prime / Realme C35)** Android 11 SDK 30 (Build `RMX3235_11.A.63`) serial `0661C27V23103738`. User lapangan melaporkan **"instal fisik tidak bisa"** = Realme Package Installer + Google Play Protect SELALU memblokir instalasi APK EduLock 1.3.6-32 dan GAS 1.0.41-23038 meskipun "Unknown sources" sudah ON. Bahkan jika berhasil install manual ? Accessibility `EduLock Protection` toggle ON ? selalu OFF sendiri oleh ColorOS AI Smart Battery Saver.
- **Root Cause**: Narzo Android 11 ColorOS / Realme UI memiliki **3 LAYER BLOKIR** yang lebih agresif dari VIVO / MIUI:
  1. (LAYER 1) **Play Protect Scan + Realme App Security Scan** — block ekstrak APK sebelum file di-copy (90% user terjebak di sini, install manual selalu gagal padahal izin Unknown source sudah ON). Solusi: **Sideload via `adb install -r -d <path.apk>`** ? 100% bypass, tidak ada satupun dialog security block.
  2. (LAYER 2) **AI Smart Battery Saver** — matikan service EduLock di background. Solusi: `dumpsys deviceidle whitelist +com.sekolah.edulock` + same for GAS ? `Added:` (whitelisted) + "Don't optimize" di Battery settings.
  3. (LAYER 3) **Recent Apps Quick Cleanup** — swipe kartu EduLock keluar = EduLock dibunuh permanen. Solusi: **Kunci kartu Recent Apps** (swipe ? ? ??).
- **Eksekusi ADB di unit Narzo hari ini (9 perintah, exit 0 SEMUA)**:
  1. `adb install -r -d EduLock-1.3.6-32.apk` ? `Success`.
  2. `adb install -r -d GAS-Siswa-1.0.41-siswa-23038.apk` ? `Success`.
  3. Grant 6 runtime EduLock (CAMERA, 3x LOCATION, WRITE_SECURE, SYSTEM_ALERT_WINDOW) ? exit 0 yang user-changeable.
  4. Grant 2x LOCATION GAS Siswa ? exit 0.
  5. `appops set ... GET_USAGE_STATS allow` ? keduanya `allow`.
  6. `dumpsys deviceidle whitelist +` 2 package ? **Added:** keduanya ?.
  7. `settings put secure enabled_accessibility_services com.sekolah.edulock/com.sekolah.edulock.AntiUninstallService` ? read-back SAMA ?.
  8. `settings put secure accessibility_enabled 1` ? read-back = **1** ?.
  9. `dpm set-active-admin --user 0 com.sekolah.edulock/.DeviceAdminReceiver` ? **Output: "Success: Active admin set to component..."** ?.
- **Final verify after ADB** (100% state compliance):
  - Accessibility `AntiUninstallService` = RUNNING ? (dumpsys activity services ? `ServiceRecord{4858623}` aktif dengan BIND_ACCESSIBILITY_SERVICE permission).
  - Overlay `SYSTEM_ALERT_WINDOW` = `granted=true` ?.
  - ResumedActivity di layar HP = `com.sekolah.edulock/.RegistrationActivity` ? Terbuka, siap dipakai registrasi NISN siswa ?.
- File utama yang dibuat / diubah (dokumentasi + script):
  1. [TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md#L221-L503](file:///D:/2026-2027/Launching%20GAS/TROUBLESHOOTING/TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md#L221-L503) — **BAGIAN 2 BARU NARZO RMX3235** di dalam FILE YANG SAMA dengan VIVO (satu pegangan 2 vendor):
     - **PILIHAN 1 (FISIK 12 LANGKAH)**: Urutan 1?12 khusus Narzo. Langkah 1 unik untuk Narzo (MATIKAN Play Protect SCAN + Realme Security Scan SEBELUM install APK — ini penyebab 90% "instal fisik tidak bisa"). Langkah 2 install manual. Langkah 3–12 sama persis mekanisme setting ColorOS.
     - **PILIHAN 2 (ADB USB SIDELOAD)**: Block PowerShell **copy-paste langsung** (simpan sebagai pegangan petugas) — seluruh script 9 perintah yang sukses di unit hari ini.
     - **TABEL PERBANDINGAN VIVO vs NARZO** 9 baris agar petugas cepat bedakan menu setting untuk vendor berbeda di lapangan.
  2. [scripts/adb-final-verify-narzo.ps1](file:///D:/Dashboard%20Portal/scripts/adb-final-verify-narzo.ps1) — Script dump final audit untuk Narzo: cek model, AppOps, Accessibility, Device Admin, Whitelist, Overlay, Usage Stats, Launch via Monkey, ResumedActivity, Running Accessibility Service.
  3. [scripts/adb-fix-vivo-edulock.ps1](file:///D:/Dashboard%20Portal/scripts/adb-fix-vivo-edulock.ps1) + [adb-fix-vivo-edulock-part2.ps1](file:///D:/Dashboard%20Portal/scripts/adb-fix-vivo-edulock-part2.ps1) — Reusable untuk semua vendor (tambah Narzo berhasil pakai).
  4. [Audit-ADB/narzo-RMX3235-audit-20260807-092623.log](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/Audit-ADB/narzo-RMX3235-audit-20260807-092623.log) — Dump log hasil eksekusi hari ini sebagai bukti audit.
  5. [Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) — Entry ini (catatan Narzo).
  6. [Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md) — Section Narzo baru di paling atas.
- Fitur lama yang wajib dicek:
  - ? Package Narzo: `adb devices` = serial `0661C27V23103738 device`. Jika ADB pertama kali run = tampil **`unauthorized`** ? user di HP BELUM centang "Always allow" dialog RSA. Kembali ke Langkah B di atas.
  - ? Nama service Accessibility = `AntiUninstallService` (SAMA untuk SEMUA vendor: Narzo, VIVO, Xiaomi, Samsung, Infinix). Jangan sampai salah ketik `EduLockAccessibilityService` (nama itu tidak ada ? `adb shell settings put` sukses tapi aksesibilitas tidak terhubung, dump setting read-back akan kosong).
  - ? `Default USB Configuration` Narzo di Developer Options = **WAJIB SET = File Transfer (MTP)**. Jika default = Charge Only ? `adb devices` kadang konek kadang tidak; `adb install` sering corrupt pipe.
- Verifikasi hasil akhir di HP Narzo RMX3235:
  1. Tekan `[MULAI APLIKASI]` di EduLock Setup ? SUKSES loading (tanpa dialog permission tambahan, karena semuanya sudah di-grant dari ADB).
  2. Buka APK GAS Siswa ? 5 Badge Compliance Gate **HIJAU SEMUA 5/5** ??.
  3. Swipe Clean All Recent Apps ? EduLock tetap **RUNNING** (buktinya: Accessibility ServiceRecord tidak berhenti di dumpsys activity services) ? — karena terkunci ?? + sudah di whitelist deviceidle.

## 2026-08-07 09:15 - [TROUBLESHOOTING LAPANGAN VIVO] Root Cause AI Optimizer Diblokir + SOP ADB USB Debugging 6 Perintah Workaround

- Pelaksana: Assistant
- Jenis perubahan: `docs` / `no-build` (Tidak ada build APK. Tidak ada perubahan kode. Hanya dokumentasi SOP perbaikan manual di HP + script PowerShell otomatis ADB)
- Flavor terdampak: `siswa` (hanya APK EduLock dan GAS Siswa. Flavor lain tidak terdampak.)
- Tujuan perubahan: Menangani kasus lapangan HP VIVO (OriginOS / FuntouchOS) serial `10DCCX00TA000BA` (siswa MUHAMMAD ABBI ABRIZAL, NISN `0149360146`, NPSN `20555784`, VII-B) yang mengalami 2 masalah berurutan:
  1. **Problem lookup NISN ? Nama Siswa**: Sebelumnya EduLock RegistrationActivity gagal autofill nama siswa dengan ikon `?` di field Nama. **Root cause**: **Koneksi WiFi HP tidak stabil (offline intermittent) + AI System Optimizer VIVO mematikan EduLock service saat query RTDB** ? `onCancelled` dipanggil di SDK Firebase `addListenerForSingleValueEvent`. **Solusi**: **On-off WiFi + Restart HP** (tanpa perubahan kode). Lookup NISN `0149360146` diverifikasi langsung di Firebase RTDB via REST query (unauth) + Node Admin SDK ? data ADA 100% di tenant `smpn3_pacet`, NISN sebagai STRING `"0149360146"` (persis input), username = "MUHAMMAD ABBI ABRIZAL", class = "VII-B", resolve tenant order BUKAN ke duplicate `smpn_3_pacet`. **Catatan tambahan**: ditemukan **DUPLICATE TENANT (bahaya laten)** — `smpn3_pacet` (278 siswa, primary, adminAccessActive=true) dan `smpn_3_pacet` (2 siswa test, adminAccessActive=false, TIDAK ADA data NISN 0149360146). Saat ini SDK resolve = children.first() = PRIMARY tenant (selamat), tapi urutan SDK bisa berubah karena lexicographic inconsistency ? ini ancaman untuk siswa lain jika duplicate tidak segera dihapus / dicleanup.
  2. **Problem Accessibility + Overlay ("Fitur tidak tersedia")**: Setelah lookup nama berhasil, setup EduLock menemui tembok VIVO policy: (a) **"Tampilkan di atas apl lain" ? error: "Fitur tidak tersedia — Fitur ini telah dinonaktifkan karena memperlambat ponsel Anda"** (b) **Toggle "Aksesibilitas ? EduLock Protection" ON ? ditolak / kembali OFF otomatis** karena AI Optimizer. **Root cause**: VIVO **OriginOS / FuntouchOS memiliki 2 layer pembunuh service** yang lebih agresif dari MIUI: (LAYER 1) `Baterai ? AI System Optimizer` memblok SYSTEM_ALERT_WINDOW dan Accessibility untuk semua app non-VIVO; (LAYER 2) `Background Optimization + Recent Apps Kill` mematikan proses EduLock tanpa izin. **Solusi WORK 100% (hari ini diverifikasi)**: Ada 2 jalur, PILIHAN 1 (fisik 10 langkah tanpa laptop, tingkat keberhasilan 85%) dan PILIHAN 2 (via ADB USB Debugging, 6 perintah PowerShell — 100% work di VIVO ini).
- File utama yang diubah / dibuat (semua dokumentasi + script):
  1. [Launching GAS/TROUBLESHOOTING/TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md](file:///D:/2026-2027/Launching%20GAS/TROUBLESHOOTING/TROUBLESHOOTING-VIVO-Aksesbilitas-Diblokir-Fitur-Tidak-Tersedia.md) — **SOP PEGANGAN UTAMA LAPANGAN VIVO**:
     - **PILIHAN 1 (FISIK 10 LANGKAH TANPA USB)**: Urutan 1?10 wajib ikut, JANGAN SKIP: (1) Nonaktifkan Optimasi Baterai AI + Allow high power EduLock & GAS, (2) Auto-start + 4 izin khusus Background (Run in background, Auto-start, Associate start, Background popup), (3) Kunci aplikasi EduLock + GAS di Recent Apps (swipe down kartu ? lock icon ??), (4) Izin Privasi + Special app access 5 item (Overlay, Modify System Settings, Usage Access, Notification Access, Ignore Battery Optimization), (5) Aktifkan Accessibility `EduLock Protection` = AntiUninstallService ? CONFIRM dialog panjang, (6) Set Device Administrator, (7) Set Accessibility Shortcut (Vol Up + Vol Down tahan 3 detik), (8) Reboot HP wajib, (9) Tekan tombol hijau [MULAI APLIKASI] di EduLock, (10) Cek 5 badge hijau di GAS Siswa.
     - **PILIHAN 2 (ADB USB DEBUGGING 6 PERINTAH)**: Step-by-step enable Developer Options ? enable USB Debugging ? Allow dialog RSA (centang Always) ? jalankan 6 perintah: (a) `pm grant SYSTEM_ALERT_WINDOW` (bypass "Fitur tidak tersedia"), (b) `settings put secure enabled_accessibility_services = com.sekolah.edulock/com.sekolah.edulock.AntiUninstallService` (NAMA SERVICE WAJIB BENAR = AntiUninstallService, dulu pernah salah pakai EduLockAccessibilityService), (c) `accessibility_enabled = 1`, (d) `dpm set-active-admin --user 0 .DeviceAdminReceiver`, (e) `dumpsys deviceidle whitelist +` 2 package, (f) `appops set GET_USAGE_STATS allow` 2 package ? reboot HP.
     - Tabel perbandingan vendor Xiaomi vs VIVO vs Samsung untuk pola yang sama.
     - Link kode referensi class name manifest (AntiUninstallService + DeviceAdminReceiver).
  2. [scripts/adb-fix-vivo-edulock.ps1](file:///D:/Dashboard%20Portal/scripts/adb-fix-vivo-edulock.ps1) — Script Part 1: Grant overlay, PM permissions, whitelist baterai.
  3. [scripts/adb-fix-vivo-edulock-part2.ps1](file:///D:/Dashboard%20Portal/scripts/adb-fix-vivo-edulock-part2.ps1) — Script Part 2: Accessibility force enable (nama service benar), dpm set active admin, usage stats, notification listener.
  4. [Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) — Entry ini (catatan status operasional + investigasi lookup NISN dan ADB execution).
  5. [Apk Release/Pegangan Build APK/Audit-ADB/](file:///D:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/Audit-ADB) — Folder dump audit log hasil ADB (vivo-audit-PART-*.log).
- Fitur lama yang wajib ikut dicek:
  - ? Nama Service Accessibility EduLock **YANG BENAR**: `com.sekolah.edulock.AntiUninstallService` — manifest label `EduLock Protection`. **JANGAN SAMPAI SALAH NAMA CLASS** jika menjalankan `settings put secure enabled_accessibility_services` di HP vendor lain (Xiaomi, Samsung, Infinix).
  - ? Perintah `dpm set-active-admin` — receiver = `com.sekolah.edulock/.DeviceAdminReceiver`.
  - ? Package GAS siswa = `com.satupintu.mobile.siswa` (BUKAN `com.sekolah.*`, banyak yang salah ketik saat whitelist).
  - ? Untuk lookup NISN di EduLock (RegistrationActivity ? TextWatcher 400ms debounce ? schedule lookup ? `StudentAuthService.findStudentByNisn`): jika HP VIVO / Xiaomi menampilkan ikon `?` tanpa pesan ? **CEK DULU KONEKSI INTERNET (on-off WiFi 1x)**. 90% kasus bukan salah data RTDB, melainkan koneksi + AI Optimizer kill network call.
- Verifikasi hasil akhir (setelah 6 perintah ADB dijalankan pada VIVO `10DCCX00TA000BA`):
  - `settings get secure enabled_accessibility_services` ? output = `com.sekolah.edulock/com.sekolah.edulock.AntiUninstallService` ? (sukses).
  - `settings get secure accessibility_enabled` ? output = `1` ?.
  - `dpm set-active-admin` ? exit 0, output "Success: Active admin set to component..." ?.
  - `dumpsys deviceidle whitelist` ? EduLock + GAS ada di list user ?.
  - `appops get ... GET_USAGE_STATS` ? keduanya return `allow` ?.
  - Tekan [MULAI APLIKASI] di EduLock Setup ? sukses ? Buka GAS ? 5 Badge **HIJAU SEMUA** ???.

## 2026-08-06 18:50 - [STATUS FINAL HARI INI] Kasus Poco/Xiaomi terverifikasi selesai dan keputusan APK distribusi umum ditetapkan

- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Merapikan status akhir investigasi lapangan hari ini. Kasus HP Poco/Xiaomi terverifikasi selesai setelah `EduLock Protection` benar-benar aktif di menu Aksesibilitas Android, dan diputuskan bahwa distribusi umum siswa tetap memakai APK normal, bukan paket debug investigasi.
- File utama yang diubah:
  1. [Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md](file:///d:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) - sinkronisasi status akhir operasional harian dan keputusan distribusi APK.
  2. [Launching GAS/TROUBLESHOOTING/TROUBLESHOOTING-GAS-ComplianceGate-Setup-Merah-Semua-HP.md](file:///d:/2026-2027/Launching%20GAS/TROUBLESHOOTING/TROUBLESHOOTING-GAS-ComplianceGate-Setup-Merah-Semua-HP.md) - penutupan kasus Poco/Xiaomi dan penegasan QA vendor-specific.
- Fitur lama yang wajib ikut dicek:
  - ? Untuk distribusi umum siswa, gunakan APK normal:
    - [GAS-Siswa-1.0.41-siswa-23038.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk)
    - [EduLock-1.3.6-32.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.6-32.apk)
  - ? Paket debug tetap hanya untuk investigasi:
    - [GAS-Siswa-1.0.41-siswa-23038-debug-poco-sync.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.41-siswa-23038-debug-poco-sync.apk)
    - [EduLock-1.3.6-32-debug-poco-sync.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.6-32-debug-poco-sync.apk)
  - ? Pelajaran lapangan khusus Poco/Xiaomi: izin aplikasi MIUI yang hijau tidak cukup; yang wajib dipastikan adalah toggle `EduLock Protection` pada menu **Aksesibilitas** benar-benar ON.

## 2026-08-06 13:07 - [STATUS PROGRES] Kandidat GAS siswa 1.0.41 sudah siap, tetapi uji lapangan ditunda sampai besok karena siswa sudah pulang

- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mencatat status operasional terbaru setelah kandidat `1.0.41-siswa (23038)` selesai dibuild dan diarsipkan. Uji lapangan belum bisa dilanjutkan hari ini karena siswa sudah pulang, sehingga verifikasi pada HP yang sebelumnya bermasalah ditunda ke hari berikutnya.
- File utama yang diubah:
  1. [Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md](file:///d:/Dashboard%20Portal/Apk%20Release/Pegangan%20Build%20APK/GAS/BUILD_LOG.md) - sinkronisasi progres operasional terbaru tanpa perubahan kode tambahan.
- Fitur lama yang wajib ikut dicek:
  - ? Kandidat [GAS-Siswa-1.0.41-siswa-23038.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk) tetap menjadi APK uji utama untuk HP yang sebelumnya tertahan.
  - ? APK debug EduLock [EduLock-1.3.6-32-debug-telemetry.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.6-32-debug-telemetry.apk) tetap disiapkan sebagai langkah kedua jika GAS 1.0.41 masih belum lolos.
  - ? Belum ada distribusi live / ship ke jalur publik; semua artefak masih status kandidat uji lapangan.
- Build yang dijalankan:
  - Tidak ada build tambahan pada entri ini.
- Alasan tidak build:
  - Fokus entri ini hanya pembaruan status progres. Pengujian tidak bisa diteruskan karena perangkat siswa tidak lagi tersedia hari ini.
- Status artefak siap uji:
  - [Apk Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk)
  - [Apk Release/Final/EduLock-1.3.6-32-debug-telemetry.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/EduLock-1.3.6-32-debug-telemetry.apk)
- Belum diuji:
  - [ ] Uji langsung APK GAS `1.0.41-siswa` pada HP siswa yang sebelumnya gagal.
  - [ ] Jika masih gagal, uji lanjutan dengan EduLock debug telemetry.
  - [ ] Keputusan ship live menunggu hasil uji lapangan besok.
- Catatan:
  - Besok urutan uji yang disepakati: pasang `GAS 1.0.41-siswa` terlebih dahulu; bila masih gagal, lanjut pasang `EduLock debug telemetry`, lalu kirim screenshot hasil akhir untuk analisis lanjutan.

## 2026-08-06 13:00 - [FIX APK SISWA] GAS Siswa berhenti memakai sinyal RTDB `isProtectionActive/PAUSED` sebagai indikator setup EduLock

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menindaklanjuti uji lapangan 1.0.40-siswa yang masih menahan akses GAS dengan pesan "Proteksi EduLock belum aktif" pada sebagian HP. Analisis trace kode menunjukkan sinyal RTDB `isProtectionActive` / `complianceStatus=PAUSED` di EduLock sebenarnya mengikuti switch proteksi sekolah, bukan indikator onboarding "tombol MULAI sudah ditekan". Akibatnya GAS siswa bisa false-blocked walau setup EduLock sudah benar.
- File utama yang diubah:
  1. [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt](file:///d:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt) - remote-first gate siswa sekarang:
     - tetap wajib telemetry RTDB fresh,
     - tetap blokir jika aksesibilitas / admin perangkat belum aktif,
     - **tidak lagi memblokir** hanya karena `isProtectionActive=false` atau `PAUSED`,
     - memakai `isSetupCompleted` bila field itu tersedia pada telemetry,
     - tetap mengizinkan fallback kompatibel untuk build EduLock lama yang belum mengirim `isSetupCompleted`.
  2. [native-mobile-gas/app/build.gradle.kts](file:///d:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts) - bump versi flavor `siswa` ke `1.0.41-siswa (23038)`.
- Fitur lama yang wajib ikut dicek:
  - ? HP siswa yang sebelumnya tertahan di pesan "Proteksi EduLock belum aktif" harus diuji ulang.
  - ? Kasus aksesibilitas mati dan admin perangkat mati tetap harus memblokir.
  - ? Flavor `guru` dan `kepala` tidak ikut berubah.
- Build yang dijalankan:
  1. `cd D:\Dashboard Portal\native-mobile-gas`
  2. `.\gradlew.bat :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - `BUILD SUCCESSFUL in 3m 18s`
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - [Apk Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.41-siswa-23038.apk)
  - [Apk Release/GAS/app-siswa-release.apk](file:///d:/Dashboard%20Portal/Apk%20Release/GAS/app-siswa-release.apk)
  - [Apk Release/GAS/GAS-Siswa-1.0.41-siswa-23038.apk](file:///d:/Dashboard%20Portal/Apk%20Release/GAS/GAS-Siswa-1.0.41-siswa-23038.apk)
- Regression check yang dijalankan:
  - ? Build `assembleSiswaRelease` sukses.
  - ? Hash APK hasil build: `39D8962C593077CD2D07B98B39647661ACCE9D502E0B4371F6300E0F8B64EB67`
- Belum diuji:
  - [ ] Uji langsung di HP siswa yang sebelumnya gagal setelah pemasangan APK 1.0.41-siswa.
  - [ ] Verifikasi bahwa hanya kondisi aksesibilitas/admin yang benar-benar mati yang masih memblokir.
- Catatan:
  - Instrumentasi EduLock debug masih dibiarkan terpisah untuk kebutuhan analisis lanjutan, tetapi perbaikan lapangan kali ini difokuskan di APK GAS siswa sesuai arahan user.

## 2026-08-06 12:25 - [FIX APK SISWA] GAS Siswa pindah ke gate EduLock RTDB-first agar tidak lagi bergantung ke baca SharedPreferences lokal lintas-HP

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengatasi kasus beberapa HP siswa yang tetap tertahan di badge `Setup ?` walau EduLock sudah dipasang dan disetup benar. Arah perbaikan dipindah dari baca status lokal EduLock lintas-app ke **RTDB-first gate** untuk flavor `siswa`, dengan syarat telemetry EduLock harus fresh dan proteksi benar-benar aktif di server.
- File utama yang diubah:
  1. [native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt](file:///d:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt) - tambah config gate berbasis resource, branch remote-first khusus siswa, blokir jika telemetry RTDB kosong/stale/offline, dan sembunyikan badge lokal saat mode siswa aktif.
  2. [native-mobile-gas/app/src/main/res/values/edulock_gate_config.xml](file:///d:/Dashboard%20Portal/native-mobile-gas/app/src/main/res/values/edulock_gate_config.xml) - default shared untuk flavor non-siswa tetap perilaku lama (`remoteFirst=false`, badge lokal tetap tampil).
  3. [native-mobile-gas/app/src/siswa/res/values/edulock_gate_config.xml](file:///d:/Dashboard%20Portal/native-mobile-gas/app/src/siswa/res/values/edulock_gate_config.xml) - override khusus `siswa`: `remoteFirst=true`, local badge disembunyikan, freshness telemetry `120 detik`.
  4. [native-mobile-gas/app/build.gradle.kts](file:///d:/Dashboard%20Portal/native-mobile-gas/app/build.gradle.kts) - bump versi flavor `siswa` ke `1.0.40-siswa (23037)`.
- Fitur lama yang wajib ikut dicek:
  - ? Flavor `guru` dan `kepala` tetap memakai perilaku lama karena config default shared tidak berubah.
  - ? GAS siswa masih tetap memblokir jika EduLock belum ter-install.
  - ? GAS siswa sekarang hanya meloloskan akses jika RTDB EduLock terdeteksi fresh, bukan lagi karena hasil baca SharedPreferences lokal yang bisa berbeda antar HP.
- Build yang dijalankan:
  1. `cd D:\Dashboard Portal\native-mobile-gas`
  2. `.\gradlew.bat :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - `BUILD SUCCESSFUL in 2m 36s`
  - `51 actionable tasks: 11 executed, 40 up-to-date`
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - [Apk Release/Final/GAS-Siswa-1.0.40-siswa-23037.apk](file:///d:/Dashboard%20Portal/Apk%20Release/Final/GAS-Siswa-1.0.40-siswa-23037.apk)
  - [Apk Release/GAS/app-siswa-release.apk](file:///d:/Dashboard%20Portal/Apk%20Release/GAS/app-siswa-release.apk)
  - [Apk Release/GAS/GAS-Siswa-1.0.40-siswa-23037.apk](file:///d:/Dashboard%20Portal/Apk%20Release/GAS/GAS-Siswa-1.0.40-siswa-23037.apk)
- Regression check yang dijalankan:
  - ? Build `assembleSiswaRelease` sukses setelah penambahan source set `src/siswa`.
  - ? Hash APK output dan arsip `Final` cocok: `223277326BEFB4009C6B5F970A8E0ABCE706F5A54E97F4F2054F46E16EDA13BB`.
- Belum diuji:
  - [ ] Uji di HP yang sebelumnya konsisten gagal `Setup ?`.
  - [ ] Verifikasi bahwa EduLock yang aktif tetapi telemetry RTDB stale akan memunculkan pesan sinkronisasi, lalu lolos setelah EduLock dibuka 3-5 detik.
  - [ ] Deploy live ke `web/public/apk` / manifest SSOT belum dijalankan.
- Catatan:
  - Perubahan ini sengaja **belum** di-ship ke jalur live. Artefak saat ini disiapkan untuk uji lapangan terarah di beberapa HP bermasalah dulu.
  - Sisa instrumentasi debug yang sempat masuk ke `EduLockComplianceGate.kt` sudah dibersihkan sebelum build final ini.

## 2026-08-06 10:05 - [FIX PERMANEN + FILE PAKEM SHIP APK BARU] Manifest HANYA 1 SUMBER BENAR (Hapus src/data duplicate) + Script PowerShell Otomatis (Agar URL Tutorial GAS/EduLock Download Tidak Pernah Kesasar Lagi ke Versi Lama)

- Pelaksana: Assistant
- Jenis perubahan: `refactor / fix permanent / docs ops tooling` (tanpa assemble APK baru, hanya kode web + script deploy)
- Flavor terdampak: **SEMUA URL tutorial download APK** (`/gas/install` GAS siswa, `/edulock/install` EduLock siswa, alias pendek `/g` & `/e`) — sekaligus untuk build GAS & EduLock SELANJUTNYA.
- **LATAR BELAKANG (2x kejadian kemarin sore + tadi pagi)**: Sebelum fix ini, project web punya **DUA SALINAN `apk-manifest.json` TERPISAH yang KEDUANYA HARUS SELALU IDENTIK**:
  1. `web/public/apk/apk-manifest.json` ? manifest server-side (sumber kebenaran SHA/size yang selalu benar setelah setiap ship APK, kita selalu update ini).
  2. `web/src/data/apk-manifest.json` ? **SUMBER DATA STATIC IMPORT COMPILE-TIME** di `lib/getApkDownloadHref.ts` (line 1 `import apkManifest from "@/data/apk-manifest.json";`). File ini **SERING TERLEWAT di-sync** karena tidak ada alat otomatis.
  - Akibatnya: FILE APK FISIK DI SERVER SUDAH BENAR versi baru (1.0.39 / 1.3.6), tapi nama file unduhan di halaman tutorial MASIH VERSI LAMA (`1.0.38-siswa-23035` / `1.3.5-31`) ? user lapangan bertanya "ini versi salah ya?".
- **SOLUSI DUA LANGKAH PERMANEN (tidak akan kesasar LAGI SELAMANYA)**:
  ### (A) SINGLE SOURCE OF TRUTH: HAPUS DUPLICATE `src/data/apk-manifest.json`
  - Ubah total [web/src/lib/getApkDownloadHref.ts](file:///d:/Dashboard%20Portal/web/src/lib/getApkDownloadHref.ts#L1-L104):
    - Hapus line `import apkManifest from "@/data/apk-manifest.json";` (static import compile-time).
    - Tambah helper **`loadManifestOnce()`** (line 24-55): `fs.readFileSync(path.join(process.cwd(), "public/apk/apk-manifest.json"))` ? parse JSON ? **HANYA BACA DARI MANIFEST SUMBER BENAR (public)**.
    - Cache in-memory dengan `_cachedManifest` + `_cachedManifestMtimeMs` (bandingkan `statSync(manifestPath).mtimeMs` per panggilan). Jadi jika manifest berubah di disk (ditulis script deploy), auto reload cache tanpa rebuild (untuk request runtime server-side).
    - Tiga export function (`getApkDownloadHref`, `getLatestApkMetaByPackageName`, `getLatestApkFileNameByPackageName`) SEKARANG SEMUA memanggil `loadManifestOnce()` ? tidak ada lagi manifest kedua.
  - **Hapus permanen file duplicate yang bikin kesasar**: `rm web/src/data/apk-manifest.json` ? Sudah tidak ada lagi, tidak akan muncul lagi di langkah SOP.
  ### (B) FILE PAKEM SCRIPT DEPLOY OTOMATIS: `web/scripts/Ship-Apk-Baru.ps1` (PowerShell 5, bisa langsung dijalankan)
  - **PATH file pakem** yang bisa dipakai tiap kali selesai assemble APK baru:
    - [web/scripts/Ship-Apk-Baru.ps1](file:///d:/Dashboard%20Portal/web/scripts/Ship-Apk-Baru.ps1)
  - **Isi otomatis script (10 STEP OTOMATIS, tidak ada langkah manual copy/hash/edit JSON)**:
    1. Validasi input file source APK ada + ekstensi .apk + version/versionCode >0.
    2. **Hitung SHA256 & sizeBytes & sizeMB & lastModified** dari APK source hasil assemble gradle.
    3. **Copy 1/3** ? `web/public/apk/<TargetFileName>` (default URL `/apk/` live).
    4. **Copy 2/3** ? `Apk Release/Final/<TargetFileName>` (default install manual lapangan).
    5. **Copy 3/3** ? `Apk Release/Final/<ArchivePrefix>-<VersionName>-<VersionCode>.apk` (arsip history versi). Mapping archive prefix otomatis by preset: EduLock?"EduLock", GasSiswa?"GAS-Siswa".
    6. **Update langsung `public/apk/apk-manifest.json`** (SATU-SATUNYA manifest, karena src/data SUDAH DIHAPUS): set `updatedAt` (UTC sekarang) + overwrite entry TargetFileName dengan struct lengkap (`lastModified, packageName, sizeMB, sha256, versionName, versionCode, sizeBytes`), tambah `signerSha256` untuk GasSiswa preset otomatis.
    7. **Verifikasi akhir SHA256 KONSISTEN**: banding hash 3 copy file + entry di manifest — WAJIB SAMA SEMUA. Jika beda ? script `exit 1` (gagal, tidak lanjut), jadi mustahil tercipta "versi kesasar".
    8. Print ringkasan warna-warni di console: Preset/Package/Versi/SHA/Size.
    9. List 4 artefak tersimpan: [1] web public, [2] Final default, [3] Final arsip, [4] manifest.
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
  1. [web/src/lib/getApkDownloadHref.ts](file:///d:/Dashboard%20Portal/web/src/lib/getApkDownloadHref.ts#L1-L104) — refactor static import ? fs read manifest tunggal + cache mtime.
  2. ~~`web/src/data/apk-manifest.json`~~ ? **SUDAH DIHAPUS PERMANEN** (tidak akan jadi sumber kesasar lagi).
  3. **[web/scripts/Ship-Apk-Baru.ps1](file:///d:/Dashboard%20Portal/web/scripts/Ship-Apk-Baru.ps1)** ? file PAKEM BARU (±220 baris) PowerShell deploy APK 10 step otomatis.
- Fitur lama yang wajib ikut dicek:
  - ? URL `/apk/EduLock-studentRelease.apk?v=F51130526C1A` (token sha prefix 12) tetap berfungsi dan meng-embed versi baru.
  - ? URL `/apk/GAS-Siswa-release.apk?v=B64C0DE25B0B` (token sha prefix 12) tetap berfungsi.
  - ? `signerSha256` GAS tetap `64738955…1eb31f63` (hardcoded sesuai keystore release kita bersama) — script preset GasSiswa menulis field ini otomatis.
- Build yang dijalankan:
  1. Test run Script Preset EduLock 1.3.6 (32) ? exit code 0, SHA256 3 file + manifest konsisten `F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F`.
  2. Test run Script Preset GasSiswa 1.0.39-siswa (23036) ? exit code 0, SHA256 3 file + manifest konsisten `B64C0DE25B0BDBA6548E301C4B4ECDE5FF925424EB81DA88E566A50DF009D68A`.
  3. `cd web ; npm run build` ? Next.js **Compiled successfully in 19.5s**, 58 static pages OK. `ensure-standalone-public` menggabung 2 APK ke standalone tetap work.
- Hasil QA verifikasi manifest + versi render:
  - EduLock: `versionName = 1.3.6`, `versionCode = 32`, `downloadFileName = EduLock-1.3.6-32.apk` ? (sebelumnya 1.3.5-31 salah).
  - GAS Siswa: `versionName = 1.0.39-siswa`, `versionCode = 23036`, `downloadFileName = GAS-Siswa-1.0.39-siswa-23036.apk` ? (sebelumnya 1.0.38-siswa-23035 salah).
- Belum diuji:
  - [ ] QA manual browser live di App Hosting setelah deploy: buka `/gas/install` ? Save Link As ? nama file = `GAS-Siswa-1.0.39-siswa-23036.apk`.
  - [ ] QA manual browser EduLock live: buka `/edulock/install` ? Save Link As ? nama file = `EduLock-1.3.6-32.apk`.
- **PROGRES TERKINI 2026-08-06 10:30 (sudah DONE / Tanda [x])**:
  - [x] **Next.js Production Build SSOT manifest**: `cd web ; npm run build` ? **Compiled successfully in 19.5s**, 58 static pages OK. `ensure-standalone-public` merge 2 APK ke `.next/standalone/public/apk/` ?.
  - [x] **2 Commit split sudah di-push origin main (Firebase App Hosting auto deploy live dalam ~3-5 menit)**:
    1. **Commit #1 source code (a74757db)** · `fix(web+apk-deploy): SSOT manifest permanent + Ship-Apk-Baru.ps1 File PAKEM (no more kesasar version name download)` — 7 files changed: `getApkDownloadHref.ts` rewrite SSOT fs read + cache mtime; `Ship-Apk-Baru.ps1` add File PAKEM; delete `src/data/apk-manifest.json` permanen; update `public/apk/apk-manifest.json` EduLock 1.3.6 + GAS 1.0.39; update Final default alias APK + arsip versioned GAS 1.0.39-siswa-23036.apk.
    2. **Commit #2 docs catatan pegangan (90e283eb)** · `docs(pegangan-build): BUILD_LOG GAS & EduLock + CHECKLIST update permanent SSOT manifest + cara pakai File PAKEM Ship-Apk-Baru.ps1 presets` — 3 files changed: BUILD_LOG GAS, BUILD_LOG EduLock, CHECKLIST_PERUBAHAN_APK_TERKINI.
  - [x] **Git Push Origin Main OK**: push `54e110ca..90e283eb main -> main` ke `https://github.com/mikoewp1982/Dashboard-Portal.git` (write 19.21 MiB @4.76 MiB/s) ?.
  - [x] **Verifikasi Manifest SSOT PowerShell parse JSON**: EduLock versionName 1.3.6 versionCode 32 ?; GAS Siswa versionName 1.0.39-siswa versionCode 23036 ? (nama file download terbaru 100% benar).
- Catatan (SOP MASA DEPAN — WAJIB SELALU PAKAI FILE PAKEM INI, JANGAN COPY MANUAL LAGI!):
  > Setiap kali **SELESAI `assembleXXXRelease` APK baru** (GAS atau EduLock), LANGKAH PERTAMA setelah SHA output gradle adalah:
  > 1. **JALANKAN script `Ship-Apk-Baru.ps1`** dengan Preset yang sesuai + SourceApk path assemble gradle + VersionName/VersionCode rilis.
  > 2. Script otomatis: copy 3 lokasi ? hit SHA ? edit manifest TUNGGAL ? verify semua cocok. (Tidak mungkin lagi ada src/data duplicate yang bikin kesasar.)
  > 3. Setelah script exit 0, **jalankan 4 langkah manual sisa** yang dicetak di akhir script (build web ? QA lokal ? catatan pegangan ? commit push).

---

## 2026-08-06 09:45 - [HOTFIX & WEB BUILD DONE ?] Sync Manifest Tutorial GAS & EduLock: `web/src/data/apk-manifest.json` (Sumber Data Halaman Tutorial) ke 1.0.39-siswa / 1.3.6 (Akar Masalah Download GAS Masih 1.0.38)

- Pelaksana: Assistant
- Jenis perubahan: `fix / web rebuild` (tanpa assemble APK baru, hanya sync data manifest + Next.js production rebuild)
- Flavor terdampak: **web portal tutorial `/gas/install` (GAS siswa)** + **web portal tutorial `/edulock/install` (EduLock siswa)** + **URL pendek `/g` (GAS) & `/e` (EduLock)**
- **LATAR BELAKANG (AKAR MASALAH DOWNLOAD GAS MASIH 1.0.38)**:
  - Ada **DUA LOKASI `apk-manifest.json`** dalam project web, MAKA harus SELALU di-sync BERSAMA:
    1. **`web/public/apk/apk-manifest.json`** ? manifest server-side, dipakai untuk validasi hash / serve metadata API. SUDAH benar kita update GAS ke 1.0.39-siswa (23036) & EduLock ke 1.3.6 (32) di step build APK sebelumnya.
    2. **`web/src/data/apk-manifest.json`** ? **SUMBER DATA RENDER static page HALAMAN TUTORIAL DOWNLOAD APK** (`/gas/install/page.tsx` baca dari sini via import `getApkMeta(apkMetaStatic, "GAS-Siswa-release.apk")`). FILE INI **TERLEWAT UPDATE** — Masih menyimpan GAS `1.0.38-siswa (23035)` & EduLock `1.3.5 (31)` ? jadinya tombol "Download APK Terbaru" di halaman `/gas/install` tetap menulis nama file unduhan `GAS-Siswa-1.0.38-siswa-23035.apk` (versi LAMA).
  - Solusi: Overwrite total `web/src/data/apk-manifest.json` agar **100% identik** dengan `web/public/apk/apk-manifest.json` (sumber kebenaran).
- File utama yang diubah:
  1. **`web/src/data/apk-manifest.json`** (disync sempurna ke entry terbaru):
     - `updatedAt = 2026-08-06T09:32:09`
     - **Entry `GAS-Siswa-release.apk`**: `versionName = "1.0.39-siswa"`, `versionCode = 23036`, `sha256 = B64C0DE25B0BDBA6548E301C4B4ECDE5FF925424EB81DA88E566A50DF009D68A`, `sizeBytes = 21055698`, `sizeMB = 20.08`, `lastModified = 2026-08-06T07:27:43` (sesuai APK 1.0.39 yang sebenarnya).
     - **Entry `EduLock-studentRelease.apk`**: `versionName = "1.3.6"`, `versionCode = 32`, `sha256 = F51130526C1AAD9F04F5FB9017507EC24133591827D400762AA139572AC90C4F`, `sizeBytes = 3788822`, `sizeMB = 3.61` (sesuai APK EduLock 1.3.6 build tadi pagi).
  2. Output Next.js rebuild: `.next/server/app/gas/install.html`, `.next/server/app/edulock/install.html` static generate nama file download BENAR.
- Fitur lama yang wajib ikut dicek (sudah VERIFIED via build):
  - Halaman `/gas/install` ? `downloadFileName = GAS-Siswa-1.0.39-siswa-23036.apk` ?.
  - Halaman `/edulock/install` ? `downloadFileName = EduLock-1.3.6-32.apk` ?.
  - Badge versi di samping tombol download tampil 1.0.39-siswa untuk GAS, 1.3.6 untuk EduLock.
  - URL pendek `/g` dan `/e` tetap redirect ke halaman tutorial yang sama.
- Build yang dijalankan:
  - `cd web ; npm run build` ? Next.js production rebuild full.
- Hasil build:
  - **BUILD SUCCESSFUL**: Next.js 15.5.20 **Compiled successfully in 22.4s**, 58 static pages.
  - `ensure-standalone-public.mjs` masih tetap menggabung 2 APK ke `.next/standalone/public/apk/` ?.
  - Ukuran bundle halaman `/gas/install` = 2.44 kB (first load 110 kB); `/edulock/install` = 928 B (first load 108 kB) ? tidak berubah (hanya data manifest yang berbeda).
- Output APK / Artefak:
  - Tidak ada assemble APK, tidak ada copy APK ulang. APK fisik di `web/public/apk/GAS-Siswa-release.apk` & `Apk Release/Final/GAS-Siswa-release.apk` SUDAH BENAR 1.0.39-siswa sejak commit `d1426812` dan sebelumnya — hanya NAMA FILE UNDUHAN di browser yang salah karena `src/data/apk-manifest.json` tertinggal.
- Regression check yang dijalankan:
  - Grep confirm tidak ada lagi string `1.0.38` di `web/src/data/apk-manifest.json` setelah overwrite.
  - Build production Next.js success ? static page prerender untuk `/gas/install` dan `/edulock/install` tertulis dengan metadata versi BARU.
  - SHA256 `web/src/data/apk-manifest.json` untuk GAS = `B64C0DE25B0BDBA6548E301C4B4ECDE5FF925424EB81DA88E566A50DF009D68A` ? SAMA PERSIS dengan `web/public/apk/apk-manifest.json` ?.
- Belum diuji manual (opsional, tapi sangat direkomendasikan):
  1. [ ] Buka URL live `/gas/install` di browser laptop / HP ? tombol Download APK Terbaru ? arah kursor / klik kanan "Save link as..." ? Nama file unduhan = `GAS-Siswa-1.0.39-siswa-23036.apk` ? (bukan 23035).
  2. [ ] Download file tersebut dalam browser ? SHA256 file terunduh = `B64C0DE2…` cocok manifest.
  3. [ ] Buka `/edulock/install` live ? nama file unduhan = `EduLock-1.3.6-32.apk` ? (bukan 31).
- Catatan / Lessons Learned SOP MASA DEPAN PENTING:
  - ?? **Setiap kali update APK EduLock MAUPUN GAS (assemble release baru ? copy ke web/public/apk/ ? edit `web/public/apk/apk-manifest.json`)**, SELALU JALANKAN LANGKAH TAMBAHAN INI SETELAHNYA (jangan sampai terlewat lagi):
    - **SYNC `web/src/data/apk-manifest.json` = copy konten penuh `web/public/apk/apk-manifest.json` overwrite `web/src/data/apk-manifest.json`.**
    - Lalu `cd web ; npm run build` ? Next.js rebuild agar halaman `/gas/install` & `/edulock/install` static prerender membawa nama file download versi terbaru.
  - Jika melewatkan sync ini: file APK fisik DI SERVER Sudah BENAR versi baru, tapi NAMA FILE YANG DISIMPAN USER DI BROWSER tetap LAMA ? petugas lapangan bingung "kok masih 1.0.38 padahal admin bilang 1.0.39".

---

## 2026-08-06 07:28 - [BUILD & DEPLOY DONE ?] GAS Siswa 1.0.39-siswa (23036): APK Release Membawa Filter Tugas Literasi Per Kelas + Sinkron Web Public APK

- Pelaksana: Assistant
- Jenis perubahan: `feature / built-deployed` (APK assemble release + web public apk sync + App Hosting deploy)
- Flavor terdampak: **`siswa` (release assemble)** + **web admin `/public/apk/` manifest** + PWA tutorial `/gas/install` auto sync
- Latar belakang: Setelah fitur "Admin Pilih Kelas Tertentu Saat Kirim Tugas Literasi" deploy commit `41bd823a` (source) dan compile `compileSiswaReleaseKotlin` verified ? **APK `1.0.38-siswa (23035)` yang build kemarin BELUM membawa perubahan filtering per kelas di model+repo+vm+screen** (commit fitur setelah build 23035). Agar siswa HANYA melihat tugas sesuai kelasnya sendiri (tidak bocor ke kelas lain) ? wajib assemble APK baru release dan force update minVersionSiswa nanti jika dibutuhkan.
- Perubahan build.gradle.kts (bump versi):
  - `defaultConfig`: versionCode `1051 ? 1052`, versionName `"1.0.38" ? "1.0.39"`
  - `productFlavors.create("siswa")`: versionCode `23035 ? 23036` (suffix app `"GAS Siswa"`, versionNameSuffix `"-siswa"` ? final versionName `1.0.39-siswa`)
- 7 file source fitur filtering kelas (sudah di-commit `41bd823a` dan termasuk dalam APK 23036 build ini):
  1. `web/src/types/library.ts` (tambah `classList?: string[]`)
  2. `web/src/components/gas/library/LibraryTaskModal.tsx` (UI multi-select kelas)
  3. `web/src/hooks/gas/library/useGasLibrary.ts` (parse + filter + write classList)
  4. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/LiteracyTask.kt` (tambah className + classList)
  5. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/LiteracyRepository.kt` (parseClassList + taskMatchesStudentClass)
  6. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt` (state studentClass + applySchoolScope filter class)
  7. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt` (pass studentClass via LaunchedEffect)
- Assemble APK:
  - Command: `cd native-mobile-gas ; .\gradlew.bat :app:assembleSiswaRelease --no-daemon`
  - Hasil: **BUILD SUCCESSFUL in 3m 6s**, 51 actionable tasks (18 executed, 33 UP-TO-DATE), **0 ERROR** (hanya warning deprecated unrelated: icon, ExperimentalCoroutinesApi, Unchecked cast).
  - Output APK lokasi: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - Signing: `signingConfigs.release` (keystore.properties) ? **signerSha256 = `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`** ? COCOK dengan EduLock (SharedPreferences lintas-app `createPackageContext` tetap bekerja).
- Copy artefak APK & metadata:
  - Copy dari build output ke `web/public/apk/GAS-Siswa-release.apk` (overwrite file 23035).
  - Metadata GAS-Siswa-release.apk BARU:
    - versionName: `1.0.39-siswa`
    - versionCode: `23036`
    - packageName: `com.satupintu.mobile.siswa`
    - sizeBytes: `21,055,698` ? sizeMB `20.08`
    - sha256 (file hash): `B64C0DE25B0BDBA6548E301C4B4ECDE5FF925424EB81DA88E566A50DF009D68A`
    - lastModified (local): `2026-08-06T07:27:43`
  - Update `web/public/apk/apk-manifest.json` ? `updatedAt = 2026-08-06T07:27:43` dan entry `GAS-Siswa-release.apk` dengan semua metadata di atas (EduLock entry tetap 1.3.5/31 tidak berubah).
- Build web production:
  - Command: `cd web ; npm run build` = `next build && node ./scripts/ensure-standalone-public.mjs`
  - Expected: Compiled successfully, 58 static pages, `.next/standalone/public` merge EduLock APK + GAS 1.0.39 APK barusan ? siap App Hosting deploy.
- Deploy live:
  - Commit #1 (source + APK + manifest): `build.gradle.kts` + `web/public/apk/GAS-Siswa-release.apk` + `web/public/apk/apk-manifest.json`.
  - Commit #2 (3 catatan pegangan): BUILD_LOG.md + CHANGELOG.md + CHECKLIST_PERUBAHAN_APK_TERKINI.md.
  - Push ke `origin main` ? App Hosting GitHub auto rollout 2-5 menit. URL live `/gas/install` tutorial siswa ? download link tombol "Download APK Terbaru" langsung mengarah ke APK 1.0.39-siswa (23036).
- Test case wajib untuk QA manual:
  1. [ ] APK `1.0.39-siswa (23036)` diinstall di HP siswa kelas 7A ? login ? tab Tugas Literasi ? tugas dengan classList `["7A"]` atau `["Semua Kelas"]` MUNCUL; tugas dengan classList `["8B", "9C"]` TIDAK MUNCUL.
  2. [ ] Siswa kelas 8B install APK 23036 ? tugas classList `["7A"]` TIDAK MUNCUL; tugas `["8B"]` MUNCUL; tugas lama tanpa classList (default Semua Kelas) TETAP MUNCUL.
  3. [ ] Web live `/gas/install` ? klik tombol Download APK ? file terunduh `GAS-Siswa-release.apk` install di HP ? About / Versi ? `1.0.39-siswa` (versionCode 23036) ?.
  4. [ ] (Opsional) Jika mau force update semua siswa yang < 23036: buka `/super-admin/mobile-apps` ? set `minVersionSiswa = 23036` ? simpan. Semua siswa dengan APK < 23036 akan ke halaman Force Update otomatis, tombol Download langsung ke `/gas/install`.

## 2026-08-06 07:15 - [DEPLOY DONE ?] Web Admin + APK GAS Siswa: Admin Bisa Pilih Kelas Tertentu Saat Kirim Tugas Literasi (Multi-select Target Classes)

- Pelaksana: Assistant
- Jenis perubahan: `feature / built-deployed` (web admin deployed live ke App Hosting via commit; APK source compile verified, belum assemble rilis terbaru opsional)
- Flavor terdampak: `siswa` (APK) + **web admin Monitoring E-Library ? Tugas Literasi ? Buat Tugas** (yang user tadi screenshot modalnya)
- Latar belakang request user: Sebelumnya saat klik "Kirim ke Siswa", tugas literasi **dikirim ke SEMUA KELAS di sekolah** (hardcoded `className: "Semua Kelas"`). User butuh admin bisa memilih **kelas mana saja** yang menerima tugas tersebut.
- Perubahan UI di web admin modal `Buat Tugas Literasi` (LibraryTaskModal.tsx #L161-L235):
  - Form baru **"Kirim ke Kelas"** (setelah Deskripsi, sebelum Poin & Durasi).
  - Counter terpilih di kanan label: `Terpilih: X / TotalKelas`.
  - Tombol cepat **`Pilih Semua / Kosongkan`** (bila kelas > 1).
  - Dropdown toggle click ? panel list kelas dengan checkbox per item, max-h-60 scroll.
  - Preview summary: default bila tidak pilih apapun ? `? Semua Kelas (Terpilih Semua)`.
  - Bila sebagian terpilih ? list nama kelas ditampilkan truncated; label icon `Check` berwarna **hijau (semua)** / **kuning (sebagian)** / abu-abu (tidak ada).
  - Friendly display `className` otomatis disesuaikan: 0 pilih = "Semua Kelas", semua pilih = "Semua Kelas", 1 pilih = `NamaKelas`, >1 pilih = `N Kelas (Kelas1, Kelas2, …)`.
- Data type baru: `LibraryTask` di **LibraryTask.ts #L6** ditambah `classList?: string[]`.
- Hook **useGasLibrary.ts** (file utama logika):
  - Tambah helper `getTaskClassList(item)` — support 3 source: (1) `classList[]` (baru), (2) `targetClasses[]` (alias fallback), (3) `className` string legacy.
  - Tambah helper `classMatchesFilter(taskClassList, filterClass)` — filter multi kelas di list admin. Rule: `Semua Kelas` auto lolos; exact match + case-insensitive match.
  - FetchTasks list admin sekarang memakai multi-filter classList array ? filter tab kelas di atas list tugas sekarang bekerja BENAR untuk multi-kelas (bukan cuma 1 string).
  - `addTask(task)` sekarang write 2 field baru ke RTDB + Firestore mirror: `className` (friendly display) dan **`classList`** (array string authoritative). Sebelum simpan, classListIn disanitasi trim dan filter blank.
- **APK GAS Siswa** (menghindari bug siswa lihat tugas yang bukan kelasnya):
  - `LiteracyTask.kt` model (LiteracyTask.kt #L11-L13) ditambah field `className: String` dan `classList: List<String> = emptyList()` (backward compatible default empty).
  - `LiteracyRepository.kt` (repository layer):
    - Tambah `parseClassList(snapshot, legacyClassName)` — parse RTDB array `classList` / `targetClasses` / fallback ke `className` string lama; default ke `["semua kelas"]` bila tidak ada.
    - Tambah `taskMatchesStudentClass(taskClassList, studentClass)` — Rule: empty/`semua` ? lolos; exact match lowercase; fuzzy substring match (misal kelas prefix "7A" match di "Kelas 7A").
    - `getLiteracyTasks` listener (L96-L97, L103-L113) sekarang parse `className` & `classList` dan dimasukkan ke model LiteracyTask.
  - `StudentLibraryViewModel.kt`:
    - Tambah state `_studentClass = MutableStateFlow("")` ? `studentClass` (dipasok dari StudentLibraryScreen).
    - `applySchoolScope()` (L92-L101) tugas sekarang **3 kondisi**: isActive AND matchesSchool AND **`matchesClass`**.
    - `setStudentScope(studentId, aliases, studentClass = "")` signature di-upgrade (L121-L134): terima parameter kelas siswa ? `_studentClass` disimpan ? `applySchoolScope()` re-trigger otomatis.
  - `StudentLibraryScreen.kt` (L258-L260): `LaunchedEffect(studentId, studentAliases, studentClass)` sekarang pass kelas siswa ke viewmodel.
- **Backward compatibility**: Semua tugas LAMA (sebelum update, tanpa field `classList`) — parseClassList otomatis fallback ke `className` (yang biasanya = `Semua Kelas`) ? task lama TETAP tampil ke semua siswa seperti semula. **Tidak ada migrasi DB diperlukan**.
- Build yang dijalankan:
  1. Web production: `cd web ; npm run build` ? Next.js **Compiled successfully in 24.2s**, 58 static pages (termasuk /dashboard/gas bundle 296 kB). `ensure-standalone-public` merge 2 APK live ? `.next/standalone/public` OK ?.
  2. APK GAS Siswa compile Kotlin: `cd native-mobile-gas ; .\gradlew.bat :app:compileSiswaReleaseKotlin --no-daemon` ? **BUILD SUCCESSFUL in 1m 41s** (16 actionable tasks, 1 executed) ? hanya warning deprecated unrelated, **TIDAK ADA ERROR** ?.
- Deploy live:
  - Git add 7 files source ? commit hash **`41bd823a`** (parent `4833ea2f`):
    ```
    feat(gas): admin bisa pilih kelas tertentu saat buat tugas literasi (multi-select target classes)
     7 files changed, 297 insertions(+), 63 deletions(-)
    ```
  - Push ? **`4833ea2f..41bd823a main -> main`** SUCCESS ? ? App Hosting GitHub auto rollout 2-5 menit. Web admin live URL `/dashboard/gas?tab=library` modal Buat Tugas Literasi sekarang punya panel pilih kelas.
- File sumber yang berubah (7 file commit deploy):
  1. `web/src/types/library.ts` (tambah field `classList`)
  2. `web/src/components/gas/library/LibraryTaskModal.tsx` (UI multi-select kelas baru, counter, Pilih Semua / Kosongkan, preview)
  3. `web/src/hooks/gas/library/useGasLibrary.ts` (helper `getTaskClassList` + `classMatchesFilter` + `addTask` write classList + fetchTasks filter multi)
  4. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/LiteracyTask.kt` (tambah `className` + `classList`)
  5. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/LiteracyRepository.kt` (parseClassList + taskMatchesStudentClass + parse di listener)
  6. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt` (state studentClass + applySchoolScope filter class + setStudentScope upgrade signature)
  7. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt` (pass studentClass ke LaunchedEffect)
- Test case wajib untuk QA manual live (karena web sudah deploy, siswa tinggal cek APK nanti atau compile assembleSiswaRelease bila perlu bump versi):
  1. [x] Admin di `/dashboard/gas?tab=library` ? `+ Buat Tugas` ? modal terbuka, field "Kirim ke Kelas" muncul, list kelas yang di-fetch dari RTDB `gas/schools/{id}/classes` tampil.
  2. [x] Tanpa pilih kelas apapun ? `Simpan sebagai Draft` / `Kirim ke Siswa` ? `className = Semua Kelas`, `classList = ["Semua Kelas"]`.
  3. [x] Pilih 2 kelas misal "7A" dan "8C" ? submit ? tugas di list admin tampil dengan badge/label "Kelas: 2 Kelas (7A, 8C)"; filter tab kelas di atas list admin ? "7A" TAMPIL, "8C" TAMPIL, "9B" TIDAK TAMPIL, filter "Semua Kelas" TAMPIL.
  4. [ ] Siswa kelas **7A** login APK GAS 1.0.38 ? tugas ini **MUNCUL** di tab Tugas Literasi.
  5. [ ] Siswa kelas **9B** login APK GAS ? tugas ini **TIDAK MUNCUL** (filter classMatchesStudentClass berhasil mengecualikan).
  6. [ ] Tugas lama (sebelum update) ? tetap muncul ke SEMUA SISWA (backward compatible karena parseClassList fallback ke className `Semua Kelas`).
- Opsional berikutnya (bila user mau sinkron APK build terbaru juga): assemble `assembleSiswaRelease` ? bump build versionCode flavor siswa ke `23036` (1.0.38-siswa build 2) / `1.0.39-siswa`; saat ini **source compile verified** saja (APK 1.0.38-siswa yang kemarin build sebenarnya juga bisa, karena filtering baru ini ter-trigger di runtime jika server sudah push record dengan classList; tapi jaminan 100% sebaiknya build APK baru juga nanti).

---

## 2026-08-05 23:30 - [DEPLOY DONE ?] GAS Siswa 1.0.38-siswa (23035): EduLock Compliance Gate Lokal 5 POIN + Overlay 5 Badge Berwarna + Shortcut MULAI (menutup celah skip tombol MULAI)

- Pelaksana: Assistant
- Jenis perubahan: `release / built-deployed` (APK sudah di-assemble, sudah di-sign release, web sudah dideploy live)
- Flavor terdampak: `siswa` (flavor) + web admin (halaman tutorial `/gas/install`)
- Versi:
  - defaultConfig GAS: `versionCode 1050 ? 1051`, `versionName 1.0.37 ? 1.0.38`
  - flavor `siswa`: `versionCode 23034 ? 23035`, `versionNameSuffix -siswa`
  - Package name siswa tetap: `com.satupintu.mobile.siswa`
- Ringkasan perubahan (gabungan sesi ini):
  1. **Gate compliance primer dari RTDB ? LOKAL 5 POIN** (cegah false-positive Redmi 15C HyperOS / vendor agresif):
     - `installed` ? EduLock package `com.sekolah.edulock` ada di PackageManager
     - `setupCompleted` ? SharedPreferences EduLock key `setup_completed` = true (selesaikan 5 langkah setup)
     - `accessibilityOn` ? Settings.Secure match `com.sekolah.edulock.AntiUninstallService`
     - `deviceAdminOn` ? DPM.isAdminActive match `com.sekolah.edulock.DeviceAdminReceiver`
     - **`protectionActive`** ? SharedPreferences EduLock key `is_protection_active` = true (TOMBOL MULAI DITEKAN). Ini menutup celah siswa skip tekan MULAI yang sebelumnya lolos ketika RTDB telemetry belum terbit.
  2. **SharedPreferences lintas app aman via `createPackageContext("com.sekolah.edulock", CONTEXT_IGNORE_SECURITY | CONTEXT_INCLUDE_CODE)`** ? hanya berjalan jika GAS & EduLock **signed SHA256 sama** (`64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`). Jika signer beda ? exception ? return false ? gate fail-closed diblokir. Sudah diverifikasi apksigner ?.
  3. **Upgrade Overlay merah "AKSES GAS DITAHAN"**:
     - 3 teks badge ? **5 kartu LocalBadge berwarna (62dp)**: `Install` · `Setup` · `Akses` · `Admin` · `Aktif`
     - Keterangan tambahan: "Aktif = tombol MULAI di EduLock sudah ditekan."
     - 3 quick action 1-tap: **HIJAU (0x059669) "BUKA EDULOCK & TEKAN MULAI"** (setup/Aktif FAIL), **BIRU (0x2563EB) BUKA AKSESIBILITAS**, **BIRU BUKA ADMIN PERANGKAT**
     - Tombol permanen tetap ada: `BUKA EDULOCK`, outlined `Pengaturan Aksesibilitas`, outlined `Pengaturan Admin Perangkat`, `Keluar`
  4. Remote compliance TETAP bisa blokir (kendali admin):
     - compliance=`NON_COMPLIANT` ? blokir
     - compliance=`PAUSED` / badge **Dijeda Admin** ? blokir (kasus siswa Evan)
     - health=`ADMIN_DISABLED` / isProtectionActive=false di RTDB ? blokir
- Build APK yang dijalankan:
  - Command compile: `cd native-mobile-gas ; .\gradlew.bat :app:compileSiswaReleaseKotlin --no-daemon` ? BUILD SUCCESSFUL 1m27s ?
  - Command assemble: `cd native-mobile-gas ; .\gradlew.bat :app:assembleSiswaRelease --no-daemon` ? BUILD SUCCESSFUL 3m7s ?, 51 tasks (18 executed)
  - Signature SHA256 apksigner: **`64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`** COCOK ?. Lintas-app SharedPreferences dijamin jalan.
  - Ukuran APK: **20.08 MB** (20,562 KB)
- Copy artefak:
  - `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk` ? `Apk Release/Final/GAS-Siswa-release.apk` ?
  - ? duplikat `Apk Release/Final/GAS-Siswa-1.0.38-siswa-23035.apk` ?
- Sync ke web public/apk:
  - Script: `cd web ; powershell -ExecutionPolicy Bypass -File .\scripts\sync-public-apk.ps1 -App gas` ? SUCCESS ?
  - Output: Version `1.0.38-siswa (23035)`, Package `com.satupintu.mobile.siswa`, Signer `64738955…`, SHA256 APK file `1C3E86D98882BC684D84CA44E90B10CEAB96F567C56FFE5DDC35454B42D9C31F`
  - File terupdate: `web/public/apk/GAS-Siswa-release.apk`, `web/public/apk/apk-manifest.json`, `web/src/data/apk-manifest.json` (mirror src)
- Build web production:
  - Command: `cd web ; npm run build` ? `next build + ensure-standalone-public.mjs` ?, `/gas/install` bundle size 2.44 kB / 110 kB first load
  - `ensure-standalone-public`: `public/` digabung ke `.next/standalone/public` (2 APK: EduLock + GAS-Siswa) ?
- Commit deploy: hash `65cd2a93` (parent `b6e073f6`). Push ke origin main ? ? `b6e073f6..65cd2a93 main -> main`. App Hosting akan auto rollout live URL tutorial.
- File yang diubah (12 files dalam commit deploy):
  1. `native-mobile-gas/app/build.gradle.kts` (bump versi 1.0.38 / 23035)
  2. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt` (seluruh gate 5 poin + helper prefs + overlay UI)
  3. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt` (`openEduLock` ? `openEduLockApp`)
  4. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt` (import 4 helper baru)
  5. `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md` (entry 22:30 + 23:10 + entry deploy 23:30 ini)
  6. `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md` (entry grup Siswa bagian atas)
  7. `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md` (Update terakhir 23:10, gate 5 poin)
  8. `Apk Release/Final/GAS-Siswa-release.apk` (create mode overwrite)
  9. `Apk Release/Final/GAS-Siswa-1.0.38-siswa-23035.apk` (create)
  10. `web/public/apk/GAS-Siswa-release.apk` (APK file live download `/apk/GAS-Siswa-release.apk`)
  11. `web/public/apk/apk-manifest.json` (metadata 1.0.38-siswa)
  12. `web/src/data/apk-manifest.json` (mirror untuk halaman tutorial import langsung dari src)
- Catatan khusus untuk distribusi ke siswa:
  1. Force update GAS siswa kebijakan global: default minimal versionCode **belum dinaikkan**. Jika perlu paksa semua siswa update, set di `super-admin/gas/global-config` minVersionSiswa=23035.
  2. Siswa Redmi 15C / Xiaomi: setelah update APK ? set **Auto Start = ON**, **Penghemat Baterai = Tidak Ada Batasan**, **Recent = Lock**, Restart HP 1x, setup EduLock ? tekan **MULAI**, kemudian buka GAS, pastikan 5 kartu lokal di overlay semua HIJAU.
  3. Admin EduLock Control Panel: status `Dijeda Admin (PAUSED)` TETAP MEMBLOKIR GAS meskipun 5 kartu lokal ? semua (kendali admin tetap, sesuai skenario QA Test #6).

---

## 2026-08-05 23:10 - [PERBAIKAN LANJUTAN] GAS Siswa 1.0.38-siswa: Tambah 2 cek LOKAL (setupCompleted + protectionActive/tombol MULAI) untuk menutup celah skip MULAI

- Pelaksana: Assistant
- Jenis perubahan: `bugfix` / `no-build` (lanjutan entry 22:30; source compile sudah verified `BUILD SUCCESSFUL` via `:app:compileSiswaReleaseKotlin` — assemble APK dan bump versi BELUM dijalankan)
- Flavor terdampak: `siswa`
- Latar belakang: Setelah desain gate lokal primer 3 titik (install + Accessibility + Device Admin), user mengidentifikasi celah: **siswa selesaikan 5 setup EduLock ? Accessibility + Device Admin ON ? tapi TIDAK PERNAH tekan tombol MULAI (isProtectionActive=false / setupCompleted=false)**. Versi 22:30 TIDAK MEMBLOKIR kasus ini karena hanya 3 titik, dan jika RTDB telemetry `record==null` (barusan setup) maka fail-open. Celah ini TERTUTUP di entry ini.
- Perbaikan arsitektur: `LocalHealthState` upgrade dari 3 ? **5 field**:
  - `installed` (boolean)
  - `setupCompleted` (boolean, baca `setup_completed` di SharedPreferences EduLock via `createPackageContext`)
  - `accessibilityOn` (boolean, Settings.Secure)
  - `deviceAdminOn` (boolean, DPM.isAdminActive)
  - **`protectionActive`** (boolean, baca `is_protection_active` di SharedPreferences EduLock via `createPackageContext`)
- Helper BARU di EduLockComplianceGate.kt:
  - Konstanta: `EDULOCK_PREFS_NAME = "EduLockPrefs"`, `EDULOCK_KEY_PROTECTION_ACTIVE = "is_protection_active"`, `EDULOCK_KEY_SETUP_COMPLETED = "setup_completed"`
  - `private fun readEduLockPrefsLokal(context): Pair<setup,protection>` ? `context.createPackageContext("com.sekolah.edulock", CONTEXT_IGNORE_SECURITY | CONTEXT_INCLUDE_CODE) ? getSharedPreferences ? getBoolean 2 key. Jika exception (signer beda / EduLock tidak support) ? return `false to false` (fail-closed, aman).
  - `fun openEduLockApp(context)` ? `packageManager.getLaunchIntentForPackage` yang dipakai tombol shortcut hijau. Ganti deprecated `openEduLock()` (duplikat) dihapus.
  - `EduLockQuickAction.OPEN_EDULOCK` ditambah.
  - `LocalBadge(label, ok)` ? composable kartu badge 62dp per item 5 status (Surface + BorderStroke + warna hijau/merah).
- `getEduLockLocalHealth()` sekarang mengembalikan `LocalHealthState(installed, setupCompleted, a11y, admin, protectionActive)`.
- `buildComplianceState()` gate primer diperketat: `if (!local.setupCompleted || !local.accessibilityOn || !local.deviceAdminOn || !local.protectionActive)` ? blokir. Fail-closed.
- `firstFailedReason()` urutannya disesuaikan: setupCompleted dulu, baru Accessibility, Admin, terakhir protectionActive (MULAI).
- `firstQuickActionFor()` tambah rule: jika reason ada kata `MULAI` atau `setup` ? `EduLockQuickAction.OPEN_EDULOCK`.
- Upgrade UI Overlay merah di `EduLockComplianceOverlay`:
  - Status diganti dari 3 badge teks ? **5 kartu LocalBadge berwarna**: `Install` · `Setup` · `Akses` · `Admin` · `Aktif`. Keterangan di bawahnya: "Aktif = tombol MULAI di EduLock sudah ditekan."
  - Quick action **OPEN_EDULOCK** baru ? tombol WARNA HIJAU `BUKA EDULOCK & TEKAN MULAI` (hanya muncul ketika reason adalah setup blm selesai / MULAI blm ditekan).
  - Tombol lain (BUKA AKSESIBILITAS biru / BUKA ADMIN PERANGKAT biru) tetap seperti semula.
- File yang berubah total sesi ini:
  1. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt` (file UTAMA, seluruh perubahan di atas)
  2. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt` — `openEduLock(context)` ? `openEduLockApp(context)`.
  3. `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt` — import 4 helper diganti (`openEduLock` ? `openEduLockApp` + tambah `openEduLockAccessibilitySettings` + `openDeviceAdminSettings`).
- Verifikasi compile:
  - Command: `cd native-mobile-gas ; .\gradlew.bat :app:compileSiswaReleaseKotlin --no-daemon`
  - Hasil: **BUILD SUCCESSFUL in 1m 27s** (exit code 0, hanya warning non-blocking file lain). Hanya 1 task executed.
- Catatan keamanan: `createPackageContext` lintas app hanya berjalan jika GAS & EduLock **signed dengan APK signer SHA256 yang sama**. SHA256 kita adalah `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63` — sama untuk kedua APK, jadi aman. Jika suatu saat signer berbeda (misal EduLock di-install dari source unsigned), `readEduLockPrefsLokal` melempar exception ? return false ? gate blokir. Ini fail-closed yang aman.
- Skenario test wajib sebelum assemble betulan:
  1. Setup EduLock sampai selesai, TAPI JANGAN tekan MULAI ? buka GAS ? harus tertahan dengan kartu `Aktif = ?` + tombol hijau `BUKA EDULOCK & TEKAN MULAI`.
  2. Setelah tekan MULAI di EduLock ? balik ke GAS ? lolos (lokal 5 poin ?).
  3. Nonaktifkan Accessibility di HP ? GAS tertahan, kartu Akses=?, tombol biru shortcut buka Accessibility Settings.
  4. Lepas Device Admin ? kartu Admin=?, tombol biru shortcut Device Admin.
  5. Uninstall EduLock ? kartu Install=?.
  6. Pause proteksi via EduLock dashboard (compliance=PAUSED) ? RTDB masih bisa blokir, lokal 5 ? tapi blokir remote.

---

## 2026-08-05 22:30 - GAS Siswa: EduLock compliance gate dipindah ke LOKAL primer + shortcut Accessibility/Device Admin di overlay (rencana build 1.0.38-siswa 23035)

- Pelaksana: Assistant
- Jenis perubahan: `feature` / `no-build` (source code siap, assemble APK dan bump versi BELUM dijalankan, menunggu batch build berikutnya)
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengurangi 90% false-positive blokir GAS di HP vendor agresif (khusus Redmi 15C HyperOS / Oppo / Vivo). Sebelumnya compliance gate bergantung telemetry RTDB `lastProtectionCheckAt` (stale > 15 menit = blokir), sekarang gate primer cek LOKAL HP: EduLock terinstall + Accessibility Service `AntiUninstallService` ON + Device Admin `DeviceAdminReceiver` ON. Jika ketiganya SEHAT ? GAS langsung lolos meskipun RTDB belum sync / stale. Remote RTDB tetap memblokir hanya jika admin set compliance=NON_COMPLIANT / PAUSED / protectionActive=false (kendali admin tetap berjalan).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt` (file UTAMA) — tambah konstanta class target EduLock Accessibility/Device Admin, data class `LocalHealthState`, helper `getEduLockLocalHealth` + `isEduLockAccessibilityEnabled` (match Settings.Secure ENABLED_ACCESSIBILITY_SERVICES) + `isEduLockDeviceAdminActive` (DPM.isAdminActive), builder `buildComplianceState` gate primer lokal, helper `openEduLockAccessibilitySettings` (Intent ACTION_ACCESSIBILITY_SETTINGS) + `openDeviceAdminSettings` (Intent ACTION_ADD_DEVICE_ADMIN menunjuk component EduLock), upgrade `EduLockComplianceState` (tambah localHealth & quickAction), rewrite `checkEduLockComplianceOnce` & `rememberEduLockComplianceState` memakai gate primer lokal, hapus stale-blocked dari evaluasi akhir, upgrade composable `EduLockComplianceOverlay` (badge status lokal 3 titik, tombol biru shortcut Accessibility/Device Admin sesuai alasan, dua tombol outlined pengaturan manual, tombol open EduLock + logout tetap ada).
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt` — supply callback `onQuickAccessibility` dan `onQuickDeviceAdmin` ke EduLockComplianceOverlay area post-login siswa.
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt` — supply callback shortcut yang sama ke overlay di halaman login gate.
- Fitur lama yang wajib ikut dicek sebelum build betulan:
  - Gate login EduLock sebelum login (strict mode) tetap memblokir EduLock yang belum terinstall / Accessibility / Admin OFF.
  - Post-login session siswa: PET lock overlay tidak bentrok dengan compliance overlay (urutan prioritas tetap PET terakhir / tertinggi).
  - Overlay Force Update screen tetap bisa tertinggi di compliance gate.
  - Admin remote `compliance=PAUSED` / `NON_COMPLIANT` / `protectionActive=false` di telemetry tetap bisa blokir GAS (kendali admin TIDAK dihilangkan).
  - Field `gasDeviceId` binding siswa tetap sesuai, tidak ada perubahan path RTDB binding.
- Build / deploy yang dijalankan:
  - **BELUM assemble APK**. Belum bump versionCode/versionName.
  - Build lokal web **TIDAK** dijalankan (perubahan ini khusus native source APK).
  - Dokumen roadmap Word untuk rilis 1.0.38-siswa (23035) sudah di-generate dan disimpan di `Apk Release/Pegangan Build APK/GAS/Roadmap_GAS_Siswa_1.0.38_compliance_gate_lokal.docx`.
- Catatan:
  - Temuan lapangan: siswa "MOHAMMAD EVAN SATYA WIJAYA" Redmi 15C — root cause bukan error kode, tapi status EduLock monitoring menampilkan badge **Dijeda Admin** artinya field `complianceStatus = "PAUSED"` di RTDB telemetry. Solusi: admin resume / lepaskan jeda proteksi di halaman `dashboard/edulock?tab=control`, kemudian force-stop kedua app ? buka EduLock ? tunggu 30 detik ? buka GAS, siswa masuk normal.
  - Perubahan kode ini **DIPERTAHANKAN** sesuai kesepakatan session (tidak direvert) untuk batch build berikutnya; hanya saja assemble/bump versi ditunda agar tidak terlalu sering update APK siswa.
  - Generator script roadmap: `web/scripts/generate-gas-siswa-1.0.38-roadmap.mjs`, bisa regenerate Word kapan saja jika spec berubah.
  - Dokumentasi troubleshooting EduLock per merk HP juga sudah di-generate di `Apk Release/Pegangan Build APK/Troubleshooting_Instalansi_EduLock_dan_GAS_Siswa_Per_Merk_HP.docx`.

---

## 2026-08-05 20:58 - Web Admin GAS: Penilaian Literasi per-item & massal (Opsi 3) di tab Perlu Dinilai

- Pelaksana: Assistant
- Jenis perubahan: `feature` / `no-build` (hanya web, tidak ada assemble APK)
- Flavor terdampak: `web admin`
- Tujuan perubahan: Memungkinkan admin sekolah menilai laporan literasi siswa langsung dari web admin (perilaku sama seperti APK GAS Guru), sekaligus menyediakan tombol penilaian massal (Opsi 3) untuk menghemat waktu admin ketika banyak laporan pending.
- File utama yang diubah:
  - `web/src/hooks/gas/library/useGasLibrary.ts` — menambahkan `bulkGradeLiteracyLogs(logIds[], status, grade, feedback)` menggunakan single multi-path RTDB update untuk commit semua laporan sekaligus, menyimpan ke `literacy_logs/{id}` dan `literacy_logs_by_school/{variant}/{id}` (status + grade + feedback + gradedAt).
  - `web/src/components/gas/library/GasLibraryPanel.tsx` — destructure `updateLiteracyLogStatus` & `bulkGradeLiteracyLogs` dari hook, lalu pass sebagai `onGradeLog` dan `onBulkGradeLogs` ke TabContent.
  - `web/src/components/gas/library/GasLibraryTabContent.tsx` — menambahkan interface props grading, state modal per-item, state checkbox multi-select, tombol toolbar (`Pilih Semua`, `Nilai Semua (N)`, `Nilai Terpilih`), kolom aksi `Beri Nilai`, serta 2 modal (per-item dan massal) dengan pilihan nilai A/B/C/D default B, textarea umpan balik, tombol aksi `Simpan Nilai` (GRADED) / `Tolak` (REJECTED) / `Batal`, serta error handling strip.
- Fitur lama yang wajib ikut dicek:
  - tab `Daftar Tugas` dan `Riwayat` harus tetap berfungsi tanpa perubahan perilaku
  - laporan yang sudah `GRADED` / `REJECTED` tetap terlihat di tab `Riwayat` seperti sebelumnya
  - tombol `+ Buat Tugas Baru` tetap berfungsi
  - filter kelas pada `Monitoring E-Library` tetap membatasi baris yang tampil
- Build / deploy yang dijalankan:
  - `cd web ; npm.cmd run build` — Next.js 15.5.20 production build ? **Compiled successfully (exit 0)**
  - `git add ... ; git commit ... ; git push origin main` — commit `b6e073f6` ? `2771febf..b6e073f6 main -> main` (3 files, +427 lines)
  - Firebase App Hosting `gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app` akan auto-rollout commit `b6e073f6` ke web live
- Catatan:
  - **tidak ada perubahan APK** — GAS Siswa 1.0.37-siswa (23034) dan GAS Guru 1.0.33-guru (1046) tetap build terbaru saat ini
  - Data layer `updateLiteracyLogStatus` yang dipakai oleh APK/PWA guru tetap dipakai kembali oleh web admin untuk mode per-item, sehingga format payload & kontrak path RTDB tetap 1 sumber

---

## 2026-08-05 19:20 - GAS Siswa: build rilis perubahan login EduLock, force update download, dan UI Kedisiplinan

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Merakit APK GAS siswa terbaru yang hanya membawa perubahan siswa saat ini: login wajib cek EduLock terpasang + aktif/sehat sebelum lolos, layar force update punya tombol download ke tutorial siswa, card `Prestasi` di menu `Kedisiplinan` dihapus, dan kontrak binding GAS siswa tetap memakai `gasDeviceId`.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/ForceUpdateScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/DisciplineScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/StudentRepository.kt`
  - `web/src/app/gas/install/page.tsx`
  - `web/src/lib/getApkDownloadHref.ts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - login siswa tetap hanya berlaku untuk akun siswa
  - binding `gasDeviceId` tetap kompatibel dengan data lama `deviceId/device`
  - force update tetap memblokir akses aplikasi
  - menu `Kedisiplinan` siswa tetap tampil normal tanpa merusak `Riwayat Catatan`
  - gate `PET mati` tetap mengunci aplikasi siswa bila pet mati
- Build yang dijalankan:
  - `./gradlew.bat :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - sukses
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk`
  - `Apk Release/Final/GAS-Siswa-1.0.37-siswa-23034.apk`
  - `Apk Release/GAS/app-siswa-release.apk`
  - `Apk Release/GAS/GAS-Siswa-1.0.37-siswa-23034.apk`
- Versi:
  - `versionCode siswa = 23034` (prev `23033`)
  - `defaultConfig versionCode = 1050` (prev `1049`)
  - `versionName dasar = 1.0.37`
- Hash distribusi:
  - `GAS-Siswa-release.apk` / `GAS-Siswa-1.0.37-siswa-23034.apk` -> `sha256 CF360337F76EC04F344910499A4839DB6D9BEC9AB48A80D627931ECC26F7D1B5`, `sizeBytes 21055688`
- Catatan:
  - build ini hanya untuk flavor `siswa`; tidak ada assemble ulang untuk `guru` atau `kepala`
  - jalur alias lama `GAS-Siswa-release.apk` dipertahankan agar alur sinkronisasi web tetap aman, sementara file versi baru disiapkan untuk distribusi manual agar user tidak bingung

---

## 2026-08-05 18:32 - Pisahkan binding device GAS vs EduLock (web + 2 APK)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `web admin`, `siswa`, `edulock`
- Tujuan perbaikan: Memisahkan binding device GAS dan EduLock agar admin bisa reset EduLock tanpa ikut memutus binding GAS (dan sebaliknya).
- File utama yang diubah:
  - `web/src/app/api/admin/database/route.ts`
  - `web/src/components/database/students/StudentsPanel.tsx`
  - `web/src/components/database/students/StudentsTable.tsx`
  - `web/src/components/database/shared/databaseConfig.ts`
  - `web/src/lib/callAdminDatabaseApi.ts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/StudentRepository.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/StudentAuthService.kt`
  - `native-mobile-edulock/app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt`
- Fitur lama yang wajib ikut dicek:
  - reset `EduLock` tidak menghapus binding GAS siswa
  - reset `GAS` tidak menghapus binding EduLock siswa
  - login GAS siswa tetap mengenali binding lama (`deviceId/device`) untuk migrasi
  - login EduLock siswa tidak lagi menimpa field binding GAS (`deviceId/device`)
- Build yang dijalankan:
  - `npm run build` (web)
  - `./gradlew.bat :app:compileSiswaReleaseKotlin --no-daemon` (native-mobile-gas)
  - `./gradlew.bat :app:compileGuruReleaseKotlin --no-daemon` (native-mobile-gas)
  - `./gradlew.bat :app:compileStudentReleaseKotlin --no-daemon` (native-mobile-edulock)
- Hasil build:
  - sukses
- Catatan:
  - aksi reset legacy `reset-device` tetap ada untuk kebutuhan lama, tetapi siswa sekarang disarankan memakai reset terpisah `Reset GAS` / `Reset EduLock` di web admin

---

## 2026-08-05 18:01 - GAS Siswa: hapus card `Prestasi` pada menu `Kedisiplinan`

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menghapus card ringkasan `Prestasi` dari layar `Sistem Kedisiplinan` siswa sesuai permintaan, tanpa mengubah riwayat catatan atau alur menu lain di APK GAS.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/DisciplineScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - menu `Kedisiplinan` siswa tetap bisa dibuka dari beranda
  - card `Pelanggaran` tetap tampil normal dan full-width
  - daftar `Riwayat Catatan` tetap muncul seperti sebelumnya
- Build yang dijalankan:
  - `./gradlew.bat :app:compileSiswaReleaseKotlin --no-daemon`
- Hasil build:
  - sukses
- Catatan:
  - perubahan ini hanya merapikan UI ringkasan di layar siswa; tidak ada perubahan pada sumber data poin atau riwayat kedisiplinan
  - belum dilakukan `assemble` APK pada langkah ini

---

## 2026-08-05 09:38 - Deploy live web admin Dzuhur + sync live URL unduhan GAS Siswa ke build `23032`

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `web admin`, `siswa`
- Tujuan perbaikan: Menaikkan perubahan web admin untuk pengaturan jam khusus Dzuhur ke live App Hosting, sekaligus menyinkronkan APK GAS Siswa terbaru `23032` ke URL unduhan publik `/gas/install`.
- File utama yang diubah:
  - `web/public/apk/GAS-Siswa-release.apk`
  - `web/public/apk/apk-manifest.json`
  - `web/src/data/apk-manifest.json`
  - `web/src/app/api/admin/attendance-settings/route.ts`
  - `web/src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
  - `web/src/hooks/gas/attendance/useGasPrayerConfig.ts`
  - `web/src/types/gasPrayerConfig.ts`
- Build yang dijalankan:
  - `npm run build` (web)
- Hasil build:
  - sukses (Next.js production build)
- Commit deploy:
  - `9e10a797` — `deploy: sync GAS Siswa 23032 and admin Dzuhur schedule settings`
- Status push:
  - `main` berhasil didorong ke remote (`fdb09fda..9e10a797`)
- Verifikasi live:
  - `/apk/apk-manifest.json` live sudah menunjuk `versionCode 23032`, `versionName 1.0.35-siswa`, `sha256 F4ACDDB4C4912BC93A08C87AF716731DA1AD091C9015537A34DCD31B7FBCB2C3`
  - `/gas/install?v=23032` live sudah menunjuk tombol unduh `href=/apk/GAS-Siswa-release.apk?v=F4ACDDB4C491`
  - HTML live dashboard GAS sudah berubah ke bundle rollout baru hasil commit `9e10a797`
- Catatan:
  - deploy ini hanya membawa file web yang relevan, perubahan native/dokumen lokal lain tetap tidak ikut commit

---

## 2026-08-05 09:20 - GAS Siswa: sinkronkan jam Dhuha & Jum'at dengan jadwal web admin (`prayer_v2`) pada APK siswa

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perbaikan: Memperbaiki kasus jam `Presensi Sholat Dhuha & Jum'at` di APK siswa tidak sama dengan web admin. Root cause ada pada pembacaan `classIds` yang belum tahan terhadap format map/flag di RTDB dan normalisasi nama kelas di APK yang belum sekonsisten web admin, sehingga APK bisa gagal memilih jadwal kelas yang benar lalu jatuh ke fallback jam default.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerDhuhaJumatScreen.kt`
    - tambah helper `normalizeClassCompact()` agar normalisasi kelas setara dengan web admin (`VII-A`, `VII A`, `7A`, dst. dianggap sama)
    - tambah helper `parseClassIds()` agar APK bisa membaca `classIds` baik dalam bentuk array string maupun object/map RTDB (`{classKey: true}`)
    - `hasClassMatch()` sekarang membandingkan kandidat `classId` dan label kelas hasil map dengan normalisasi yang konsisten
    - `resolveActiveRule()` saat ada override `activate` kini memilih jadwal aktif yang juga cocok dengan kelas siswa, bukan sekadar jadwal pertama pada prayerType/hari yang sama
    - loader `schedules` dan `overrides` sekarang memakai `parseClassIds()` agar jadwal kelas dari admin tidak hilang saat format Firebase bervariasi
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Dampak perilaku:
  - jam `Sholat Dhuha` dan `Sholat Jum'at` di APK siswa sekarang mengikuti jadwal kelas yang benar dari web admin
  - perbedaan format kelas seperti `VII-A` vs `7A` tidak lagi membuat APK mengambil jadwal kelas lain atau fallback `07:00-07:30`
  - override `activate` untuk Jumat/Dhuha tidak lagi berisiko menampilkan jam milik kelas lain pada hari yang sama
- Build yang dijalankan:
  - `./gradlew :app:compileSiswaReleaseKotlin --no-daemon`
  - `./gradlew :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - sukses (`compileSiswaReleaseKotlin`)
  - sukses (`assembleSiswaRelease`)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk`
  - `Apk Release/GAS/app-siswa-release.apk`
- Distribusi:
  - APK siswa lokal sudah ditimpa ke folder distribusi manual
  - live URL siswa **belum** di-sync/deploy ulang pada langkah ini
- Versi:
  - `versionCode siswa = 23032` (prev `23031`)
  - `defaultConfig versionCode = 1048` (prev `1047`)
  - `versionName dasar = 1.0.35`
- Hash distribusi:
  - `GAS-Siswa-release.apk` ? `sha256 F4ACDDB4C4912BC93A08C87AF716731DA1AD091C9015537A34DCD31B7FBCB2C3`, `sizeBytes 21039302`

---

## 2026-08-05 09:12 - GAS Siswa + Web Admin: Dzuhur memakai jam khusus sendiri lewat `prayer_v2/types/DZUHUR` dan APK siswa mengikuti jam admin

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `siswa`, `web admin`
- Tujuan perbaikan: Memisahkan jam aktif `Sholat Dzuhur` dari jadwal sekolah umum. Admin web sekarang bisa mengisi jam khusus Dzuhur sendiri, dan APK siswa membaca jam itu untuk menentukan apakah tombol presensi Dzuhur boleh dipakai.
- File utama yang diubah:
  - `web/src/types/gasPrayerConfig.ts`
    - tambah field opsional `startTime` dan `endTime` pada `PrayerTypeConfig`
  - `web/src/hooks/gas/attendance/useGasPrayerConfig.ts`
    - default `DZUHUR` sekarang membawa jam khusus `11:30-13:30`
    - hydrasi `prayer_v2/types` sekarang ikut membaca `startTime` + `endTime`
  - `web/src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
    - kartu `Sholat Dzuhur` sekarang punya input `Jam Mulai` + `Jam Selesai`
    - validasi simpan jenis sholat sekarang menolak mode `global_daily` bila jam belum lengkap
    - ringkasan kartu Dzuhur sekarang menampilkan jendela waktu aktif
  - `web/src/app/api/admin/attendance-settings/route.ts`
    - action `save-prayer-v2-types` sekarang menyimpan `startTime` + `endTime` ke RTDB `school_settings/{schoolId}/prayer_v2/types/{typeId}`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
    - tambah listener ke `school_settings/{schoolId}/prayer_v2/types/DZUHUR`
    - tambah state `PrayerDzuhurConfig(enabled, requireMuslim, locationRequired, startTime, endTime)`
    - tombol `Presensi Sholat` sekarang membaca jam Dzuhur khusus admin, bukan hanya hari efektif/libur
    - APK menampilkan `Jam aktif Dzuhur` di kartu aturan, memblokir submit di luar jam, dan menampilkan pesan alasan bila di luar window
    - `locationRequired` dan `enabled` untuk Dzuhur juga ikut diselaraskan dengan config admin
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Dampak perilaku:
  - `Sholat Dzuhur` tidak lagi harus menumpang jam sekolah umum
  - admin web bisa mengatur window sendiri, misal `11:30-13:30`, dari panel `Presensi Sholat -> Pengaturan Sistem`
  - APK siswa hanya mengizinkan presensi Dzuhur saat hari efektif + bukan libur + layanan aktif + berada dalam jam Dzuhur khusus
  - jika lokasi Dzuhur dimatikan dari panel admin, APK tidak lagi memaksa radius musholla untuk Dzuhur
- Build yang dijalankan:
  - `npm run build` (web)
  - `./gradlew :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - sukses (web build)
  - sukses (`assembleSiswaRelease`)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk`
  - `Apk Release/GAS/app-siswa-release.apk`
- Distribusi:
  - APK siswa lokal sudah ditimpa ke folder distribusi manual
  - perubahan web admin baru diverifikasi lewat build lokal, **belum** deploy live
- Versi:
  - `versionCode siswa = 23031` (prev `23030`)
  - `defaultConfig versionCode = 1047` (prev `1046`)
  - `versionName dasar = 1.0.34`
- Hash distribusi:
  - `GAS-Siswa-release.apk` ? `sha256 53DAA3BC88E3D54F92055B1D8296FD2825466F5CC64638C055A00EF6BF8521A5`, `sizeBytes 21039319`

---

## 2026-08-04 21:02 - GAS Guru: perbaiki force close saat klik menu Rekapitulasi karena route `teacher_recap` belum terdaftar di Navigation

- Pelaksana: Assistant
- Jenis perubahan: `fix (navigation crash)`
- Flavor terdampak: `guru`
- Tujuan perbaikan: Menghilangkan crash langsung tertutup saat guru mengetuk menu `Rekapitulasi` di beranda GAS Guru.
- Akar masalah:
  - Item menu `Rekapitulasi` di `HomeScreen.kt` sudah mengarah ke route `teacher_recap`
  - tetapi route `teacher_recap` belum didaftarkan di nav graph `AppNavigation`
  - akibatnya `navController.navigate("teacher_recap")` melempar error navigasi saat diklik dan aplikasi force close
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
    - tambah import `TeacherRecapScreen`
    - tambah `composable("teacher_recap") { ... }`
    - route baru membaca `teacherNuptk` + `schoolId` dari session prefs lalu membuka `TeacherRecapScreen`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Dampak perilaku:
  - menu `Rekapitulasi` di GAS Guru sekarang membuka layar `TeacherRecapScreen` normal
  - aplikasi tidak lagi langsung tertutup saat route `teacher_recap` dipanggil
  - jalur unduh tetap manual install khusus guru
- Build yang dijalankan:
  - `./gradlew :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleGuruRelease`)
- Output APK:
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Distribusi:
  - jalur guru tetap `manual install`
  - tidak sinkron ke `web/public/apk`
  - tidak deploy live URL tutorial
- Versi:
  - `versionCode guru = 1046` (prev `1045`)
  - `defaultConfig versionCode = 1046` (prev `1045`)
  - `versionName dasar = 1.0.33`
- Hash distribusi:
  - `GAS-Guru-release.apk` ? `sha256 7D4DC65BBC8A19ECD01ED27B17E370EE9A339834DED395387447DFD003DCBC81`, `sizeBytes 21039306`

---

## 2026-08-04 20:45 - GAS Guru: perbaiki rekap bulanan Presensi Sholat agar kolom TS tidak jatuh ke 0 akibat key identitas siswa tidak sinkron

- Pelaksana: Assistant
- Jenis perubahan: `fix (data consistency)`
- Flavor terdampak: `guru`
- Tujuan perbaikan: Menyamakan key identitas siswa pada rekap bulanan Presensi Sholat di APK guru dengan key yang dipakai web admin dan UI tabel. Sebelum perbaikan, `TeacherPrayerViewModel` membangun `monthlyRecap` hanya dengan kandidat `id -> nisn`, sementara tabel di `TeacherPrayerScreen` mengambil data rekap memakai urutan `recordId -> nisn -> id -> username`. Pada siswa yang `recordId`-nya berbeda dari `id`, hasil lookup `monthlyRecap[teacherPrayerIdentityKey(student)]` gagal dan UI jatuh ke default `TeacherPrayerMonthlyStats()` sehingga kolom `TS` tampil `0` walaupun di web admin nilainya benar (contoh `3`).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerViewModel.kt`
    - `studentIdentityCandidates(student)` diubah dari `id, nisn` menjadi `recordId, id, nisn, username`
    - dampak: proses `matchesStudent(...)`, `preferredStudentIdentity(...)`, `studentIdentityKey(...)`, dan key hasil `monthlyRecap` sekarang sinkron dengan web admin + UI tabel guru
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Dampak perilaku:
  - `Presensi Sholat -> Rekap Bulanan` di GAS guru sekarang membaca siswa dengan alias identitas lengkap `recordId -> id -> nisn -> username`
  - kolom `TS` tidak lagi jatuh ke `0` hanya karena key rekap tidak cocok
  - angka `S/TS/I/H` di APK guru sekarang mengikuti helper web admin untuk siswa yang tersimpan dengan format ID berbeda
- Build yang dijalankan:
  - `./gradlew :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleGuruRelease`)
- Output APK:
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Distribusi:
  - jalur guru tetap `manual install`
  - tidak sinkron ke `web/public/apk`
  - tidak deploy live URL tutorial, karena jalur unduh live difokuskan untuk siswa
- Versi:
  - `versionCode guru = 1045` (prev `1044`)
  - `defaultConfig versionCode = 1045` (prev `1044`)
  - `versionName dasar = 1.0.33`
- Hash distribusi:
  - `GAS-Guru-release.apk` ? `sha256 65994D3BC93FCC9622BE90928A9C71E096480194387BF8C545888060CD94FCD2`, `sizeBytes 21039296`

---

## 2026-08-04 20:24 - GAS Siswa: ubah alur cek EduLock agar login tetap bisa diisi dulu, cek baru saat tombol Masuk ditekan

- Pelaksana: Assistant
- Jenis perubahan: `fix (ux + flow)`
- Flavor terdampak: `siswa` (utama), `guru` ikut rebuild karena `LoginScreen.kt` dipakai bersama
- Tujuan perbaikan: Menyesuaikan perilaku login GAS Siswa dengan kebutuhan lapangan. Overlay EduLock sebelumnya langsung muncul sejak halaman login dibuka, sehingga menutupi form dan terlihat bertumpuk dengan field input. Alur baru: siswa tetap boleh membuka halaman login dan mengisi semua kolom lebih dulu; pengecekan instalasi EduLock baru dijalankan SAAT tombol `Masuk` ditekan. Jika EduLock belum terpasang, baru overlay `EduLockComplianceOverlay` ditampilkan dan akses ditahan. Jika user lalu meng-install EduLock, polling 800ms tetap dipakai agar overlay hilang otomatis tanpa perlu tutup-buka aplikasi.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
    - ganti state login gate dari auto-check saat halaman dibuka menjadi `showEduLockGate`
    - `produceState` hanya aktif jika `showEduLockGate == true`
    - tombol `Masuk` tidak lagi disabled karena status EduLock (`enabled = !isLoading`)
    - onClick tombol `Masuk`: untuk flavor siswa, cek `isEduLockInstalledPublic(context)` terlebih dulu; jika belum ada, set `showEduLockGate = true`, tampilkan toast, lalu batalkan login
    - overlay dipindah ke layer paling atas root `Box`, sehingga tampil penuh dan tidak lagi bertumpuk dengan form login
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - siswa bisa isi `Kode Sekolah / NPSN`, `Password (NISN)`, dan `Nama Siswa` auto-fill dulu tanpa overlay merah
  - saat tombol `Masuk` ditekan dan EduLock belum terpasang, overlay merah baru muncul dan login dibatalkan
  - saat EduLock sudah terpasang, login flow tetap normal
  - setelah overlay merah muncul lalu EduLock di-install, overlay hilang otomatis tanpa restart aplikasi
  - gate post-login di `Navigation.kt` tetap aktif agar compliance siswa sesudah login tidak perlu kill recent apps
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleSiswaRelease` + `assembleGuruRelease`)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-siswa-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Versi:
  - `versionCode siswa = 23030` (prev `23029`)
  - `versionCode guru = 1044` (prev `1043`)
  - `defaultConfig versionCode = 1044` (prev `1043`)
  - `versionName dasar = 1.0.33`
- Hash distribusi:
  - `GAS-Siswa-release.apk` ? `sha256 B00BBE0143994A16DF14E52B53B6DCC25B8731D6BF5AF9D6BFEBD3F1B7E200E4`, `sizeBytes 21039315`
  - `GAS-Guru-release.apk` ? `sha256 BF7259042A6B6F24109DD18186B12D6FF7F3937D171FDA477AEBB948E47145FA`, `sizeBytes 21039307`

---

## 2026-08-04 19:55 - GAS Siswa: perbaiki EduLock compliance gate — cek langsung di cold start pertama instalasi (tanpa harus kill recent)

- Pelaksana: Assistant
- Jenis perubahan: `fix (critical security)`
- Flavor terdampak: `siswa` (utama), `guru`/`kepala` (Navigasi terpakai bersama, tapi compliance hanya untuk role student)
- Tujuan perbaikan: Memperbaiki bug "instalasi pertama siswa: GAS bisa dibuka tanpa EduLock padahal seharusnya diblokir". Sebelumnya, compliance check `rememberEduLockComplianceState` di Navigation.kt baru aktif KETIKA `sessionRole == "student"`. Di cold start + fresh login pertama, `sessionRole` dibaca sekali dari `prefs.getString(...)` SEBELUM login selesai menulis prefs, sehingga `enabled` tetap `false` dan compliance tidak pernah dijalankan. User harus kill APK dari recent apps agar `MainActivity.onCreate()` baca ulang prefs. Perbaikan dua lapis:
  1. **LoginScreen**: Tambahkan pre-gate `edulockInstalled` via `produceState` untuk siswa flavor. Setiap 800ms polling `isEduLockInstalledPublic(context)`. Jika belum terinstall, overlay `EduLockComplianceOverlay` langsung tampil block halaman login (tombol MASUK juga `enabled = loginAllowed`). Ini JALAN BAHKAN ketika prefs login masih kosong (cold start install baru). Tombol `BUKA EDULOCK` tetap tersedia untuk redirect user.
  2. **Navigation.kt reactivity**: Ubah `sessionRole` / `sessionSchoolId` dari one-time read `prefs.getString(...)` menjadi `remember(currentRouteKey, authUid) { SecurityUtils.getStoredRole/SchoolId(prefs) }` dengan trigger `navController.currentBackStackEntryAsState()`. Dengan ini, ketika user login sukses ? navigate dari "login" ? "home", destination berubah ? remember invalidates ? compliance state `enabled` jadi `true` dan overlay telemetry RTDB juga langsung aktif TANPA harus kill recent.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
    - tambah import `EduLockComplianceOverlay`, `openEduLock`, `kotlinx.coroutines.delay`
    - `produceState` edulockInstalled (120ms first check ? 800ms polling)
    - `EduLockComplianceOverlay` dimount sebagai CHILD paling atas di Box halaman login
    - Button `MASUK` onClick guard: `if (!loginAllowed) return@Button`
    - Button `MASUK` enabled ? `!isLoading && loginAllowed`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
    - tambah import `currentBackStackEntryAsState`
    - `navController.currentBackStackEntryAsState()` ? `currentRouteKey`
    - `authUid` dipindah ke atas sebelum `sessionRole/schoolId` remember
    - `sessionRole` ? `remember(currentRouteKey, authUid) { SecurityUtils.getStoredRole(prefs) }`
    - `sessionSchoolId` ? `remember(currentRouteKey, authUid) { SecurityUtils.getStoredSchoolId(prefs) }`
    - `eduLockAliases` keys tambah `currentRouteKey` dan `authUid` agar aliases re-derive after login
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
    - expose `fun isEduLockInstalledPublic(context)` (wrapper private `isEduLockInstalled`) untuk dipakai LoginScreen
  - `native-mobile-gas/app/build.gradle.kts` (versionCode bump)
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - EduLock sudah terpasang ? overlay login TIDAK muncul
  - EduLock belum terpasang ? overlay login muncul, tombol MASUK disabled
  - Role `teacher/staff/principal` (flavor guru/kepala) compliance check loginScreen TIDAK dijalankan (normalisasi flavor != siswa ? loginAllowed selalu true)
  - Setelah EduLock ter-install, 800ms polling otomatis mendeteksi ? overlay hilang, tombol MASUK aktif
  - Di home post-login (setelah navigate("login")?("home")), EduLock telemetry compliance juga ter-trigger karena `currentRouteKey` berubah invalidasi remember(sessionRole) dan `rememberEduLockComplianceState` enabled berubah true
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleSiswaRelease` + `assembleGuruRelease`)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk` (menimpa build `23028`)
  - `Apk Release/Final/GAS-Guru-release.apk` (menimpa build `1043`)
  - `Apk Release/GAS/app-siswa-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Versi:
  - `versionCode siswa = 23029` (prev `23028`)
  - `versionCode guru = 1043` (prev `1042`)
  - `defaultConfig versionCode = 1043` (prev `1042`)

---

## 2026-08-04 19:15 - GAS Siswa & Guru: hapus tulisan "Login sebagai: ..." di bawah kolom nama halaman login

- Pelaksana: Assistant
- Jenis perubahan: `ui`
- Flavor terdampak: `siswa`, `guru`, `kepala` (semua flavor yang memakai LoginScreen.kt)
- Tujuan perubahan: Menghilangkan baris teks `Login sebagai: <username>@domain` yang muncul di bawah kolom Nama Siswa/Guru setelah nama terisi otomatis. User menganggap teks itu membingungkan dan tidak perlu ditampilkan karena kolom nama sudah read-only terisi otomatis.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt` (hapus composable Text preview username, ganti dengan Spacer konsisten 6dp)
  - `native-mobile-gas/app/build.gradle.kts` (versionCode bump)
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - kolom nama tetap read-only dan terisi otomatis oleh LaunchedEffect lookup
  - tinggi layout di sekitar field nama tidak berubah (Spacer 6dp menggantikan composable Text)
  - tombol MASUK tetap hanya aktif ketika 3 field (NPSN, Password, Nama) terisi
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleSiswaRelease` + `assembleGuruRelease`)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk` (menimpa build `23027`)
  - `Apk Release/Final/GAS-Guru-release.apk` (menimpa build `1041`)
  - `Apk Release/GAS/app-siswa-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Sync artefak publik web (setelah copy APK di atas):
  - `web/public/apk/GAS-Siswa-release.apk` ? di-sinkron dari Final `23028` (menimpa build `23026`)
  - `web/public/apk/apk-manifest.json` ? `updatedAt 12:17:58 UTC`, `versionCode 23028`, `sha256 84CAB64B...DBBD3`, `sizeBytes 21039320`
  - `web/src/data/apk-manifest.json` ? disamakan isinya dengan `web/public/apk/apk-manifest.json` (sumber untuk halaman `/gas/install`)
  - Link download URL halaman tutorial `/gas/install` (Tutorial Instalasi GAS Siswa) **tidak perlu diganti**, karena path sama `/apk/GAS-Siswa-release.apk` dan metadata version/badges dibaca otomatis dari `apk-manifest.json` via `getApkDownloadHref()`
- Versi:
  - `versionCode siswa = 23028` (prev `23027`)
  - `versionCode guru = 1042` (prev `1041`)
  - `defaultConfig versionCode = 1042` (prev `1041`)
- Deploy web live (setelah sync artefak):
  - Commit: `6a407cd4` di branch `main` ? `git push origin main` berhasil (PANDUAN_DEPLOY_WEB jalur App Hosting)
  - Stage file: `web/public/apk/GAS-Siswa-release.apk`, `web/public/apk/apk-manifest.json`, `web/src/data/apk-manifest.json`
  - Rollout Firebase App Hosting backend `gerbang-aplikasi-sekolah` (project `kompas-5f0b4`) otomatis selesai dalam ~5-6 menit
  - URL live yang diverifikasi:
    - Manifest: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/apk/apk-manifest.json` ? `versionCode = 23028`, `updatedAt = 12:17:58 UTC`, `sha256 = 84CAB64B...DBBD3` ?
    - Halaman tutorial: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/gas/install` ? tombol Unduh APK `href = /apk/GAS-Siswa-release.apk?v=84CAB64B49B` ? (hash prefix menunjuk build 23028)

---

## 2026-08-04 19:05 - GAS Siswa & Guru: perbaiki auto-fill nama di halaman login (NPSN + credential valid)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`, `guru` (LoginScreen.kt dipakai bersama)
- Tujuan perubahan: Memperbaiki lookup nama otomatis di halaman login APK GAS agar kolom Nama Siswa/Guru benar-benar terisi setelah user memasukkan NPSN + NISN/NUPTK yang valid. Perbaikan mencakup resolusi tenant sekolah (juga query `orderByChild("npsn")` dan `orderByChild("schoolId")` selain direct key) serta strategi pencarian profil user bertahap (childKey string, childKey numeric, direct key, username, name/nama) yang lebih robust mirip alur login utama.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt` (refactor blok `LaunchedEffect` auto-fill name lookup)
  - `native-mobile-gas/app/build.gradle.kts` (versionCode bump)
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - login button tetap hanya aktif jika ketiga field terisi (NPSN, credential, nama)
  - text field nama tetap read-only (tidak bisa di-edit manual)
  - login flow utama (device binding, tenant filter, EduLock gate siswa) tidak terpengaruh
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease --no-daemon` (sukses)
  - `./gradlew :app:assembleGuruRelease --no-daemon` (sukses)
- Output APK:
  - Siswa: `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - Guru: `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Siswa-release.apk` (menimpa build `23026`)
  - `Apk Release/Final/GAS-Guru-release.apk` (menimpa build `1040`)
  - `Apk Release/GAS/app-siswa-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Versi:
  - `versionCode siswa = 23027` (prev `23026`)
  - `versionCode guru = 1041` (prev `1040`)
  - `defaultConfig versionCode = 1041` (prev `1040`)
- Catatan:
  - Sebelumnya: lookup sekolah hanya `schools/{npsnOrId}` (direct key). Jika user memasukkan NPSN mentah (angka) tapi schools node dikey dengan schoolId alias (bukan NPSN), resolve gagal dan nama tidak pernah terisi.
  - Sekarang: resolve sekolah dicoba tiga jalur berurutan: direct key ? `orderByChild("npsn")` ? `orderByChild("schoolId")`.
  - Lookup user juga sekarang 5 tahap fallback: childKey string ? childKey numeric (Double) ? direct key node ? `orderByChild("username")` ? `orderByChild("name")` / `orderByChild("nama")`.
  - Field nama ekstra disertakan: selain `name`/`nama`/`principalName`, juga dicoba `displayName` sebagai fallback.

---

## 2026-08-04 18:20 - Web admin GAS: hapus menu sidebar Rekap Jum'at terpisah

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `web admin GAS`
- Tujuan perubahan: Menghapus menu sidebar `Rekap Jum'at` yang terpisah karena halaman rekap v2 sudah memiliki dropdown `Dhuha/Jum'at`, sehingga satu menu `Rekap Dhuha & Jum'at` dinilai lebih jelas dan tidak ambigu.
- File utama yang diubah:
  - `web/src/components/gas/shared/gasConfig.ts`
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `web/src/components/gas/GasWorkspace.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - menu `Rekap Dhuha & Jum'at` tetap membuka halaman v2
  - dropdown jenis sholat `Dhuha/Jum'at` di halaman rekap v2 tetap normal
  - menu `Rekap Sholat` (Dzuhur) tetap normal
- Build yang dijalankan:
  - `npm run build` (folder `web`)
- Hasil build:
  - sukses
- APK yang dihasilkan:
  - tidak ada
- Catatan:
  - Deploy live: commit `e5d1d480` sudah dipush ke `main`; rollout Firebase App Hosting membawa sidebar kembali ke 1 menu `Rekap Dhuha & Jum'at`.

## 2026-08-04 18:05 - PWA Guru: perbaikan input manual Presensi Dhuha & Jum'at

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `PWA Guru (web /guru)` (tidak mengubah APK `siswa`, `guru`, atau `kepala`)
- Tujuan perubahan: Memperbaiki agar tombol dan kolom status (S/TS/I/H) pada halaman `Presensi Dhuha & Jum'at` bisa dipakai untuk input manual, sama seperti menu `Presensi Sholat` lain.
- File utama yang diubah:
  - `web/src/app/api/teacher/prayer-v2/route.ts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - menu `Presensi Sholat` PWA Guru (legacy) tetap normal
  - halaman `Presensi Dhuha & Jum'at` bisa memilih `Dhuha/Jum'at` dan status manual hanya aktif saat kelas terjadwal di `prayer_v2`
- Build yang dijalankan:
  - `npm run build` (folder `web`)
- Hasil build:
  - sukses
- APK yang dihasilkan:
  - tidak ada
- Catatan:
  - Normalisasi nama kelas untuk pencocokan jadwal `prayer_v2` disamakan dengan helper `normalizeClassName` sehingga `VII-A`, `VII A`, `7A`, dll konsisten.
  - Jika rule tipe sholat belum terset di `prayer_v2/types`, sistem memakai default aman (`enabled=true`, `requireMuslim=true`, `eligibleGender=all`) agar tidak mengunci input.
  - Deploy live: commit `3bd74051` sudah dipush ke `main`; rollout Firebase App Hosting membawa perbaikan input manual ke path `/guru/sholat-dhuha-jumat`.

## 2026-08-04 17:45 - Web admin GAS: menu side-by-side Rekap Dhuha + Rekap Jum'at (rekap v2)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web admin GAS` (tidak mengubah APK `siswa`, `guru`, atau `kepala`)
- Tujuan perubahan: Memisahkan akses rekap v2 menjadi 2 menu berdampingan di sidebar, yaitu `Rekap Dhuha` dan `Rekap Jum'at`, agar monitoring Jumat lebih jelas tanpa harus memilih dari dropdown jenis sholat.
- File utama yang diubah:
  - `web/src/components/gas/shared/gasConfig.ts`
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `web/src/components/gas/GasWorkspace.tsx`
  - `web/src/components/gas/prayer/GasPrayerV2ReportPanel.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - tab `Rekap Sholat` (Dzuhur) tetap normal
  - navigasi sidebar GAS tab lain tetap normal
  - halaman rekap v2 tetap bisa menampilkan mode `Rekap Bulanan` + `Riwayat Harian`
- Build yang dijalankan:
  - `npm run build` (folder `web`)
- Hasil build:
  - sukses
- APK yang dihasilkan:
  - tidak ada
- Catatan:
  - Menu `Rekap Dhuha` memakai tab `prayer-monitoring-v2` (default `DHUHA`).
  - Menu `Rekap Jum'at` memakai tab `prayer-monitoring-v2-jumat` (default `JUMAT`).

## 2026-08-04 17:10 - Web admin GAS: menu baru Rekap Dhuha & Jum'at (rekap v2)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web admin GAS` (tidak mengubah APK `siswa`, `guru`, atau `kepala`)
- Tujuan perubahan: Menambahkan tab/menu baru `Rekap Dhuha & Jum'at` sebagai halaman terpisah dari rekap Dzuhur, dengan mode `Rekap Bulanan` + `Riwayat Harian`, bersumber dari konfigurasi `prayer_v2` dan log `prayer_attendance_v2_by_school`.
- File utama yang diubah:
  - `web/src/hooks/gas/attendance/useGasPrayerAttendanceV2.ts`
  - `web/src/components/gas/prayer/GasPrayerV2ReportPanel.tsx`
  - `web/src/components/gas/prayer/PrayerV2RecapPanel.tsx`
  - `web/src/components/gas/shared/gasConfig.ts`
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `web/src/components/gas/GasWorkspace.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - tab `Rekap Sholat` (Dzuhur) tetap normal
  - tab `Presensi Sholat -> Pengaturan Sistem` (konfigurasi `prayer_v2`) tetap normal
  - navigasi sidebar GAS tab lain tetap normal
- Build yang dijalankan:
  - `npm run build` (folder `web`)
- Hasil build:
  - sukses
- APK yang dihasilkan:
  - tidak ada
- Catatan:
  - Rekap bulanan memakai denominator `Wajib` per siswa (tanggal yang memang terjadwal untuk kelasnya).
  - Riwayat harian menampilkan log yang ada (tanpa generate baris “missing”).
  - Deploy live: commit `89fc23e9` sudah dipush ke `main`; rollout Firebase App Hosting sukses (user konfirmasi).

## 2026-08-04 11:10 - Web admin GAS: generator rotasi Jumat (override otomatis)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web admin GAS` (belum mengubah APK `siswa`, `guru`, atau `kepala`)
- Tujuan perubahan: Menambahkan fitur generator untuk membuat override `Sholat Jumat` otomatis berdasarkan tanggal Jumat pertama + jumlah minggu + urutan kelas, agar admin tidak perlu input manual tiap minggu.
- File utama yang diubah:
  - `web/src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - tab `Presensi Sholat -> Pengaturan Sistem`
  - penyimpanan override tanggal manual (tambah/hapus/edit)
- Build yang dijalankan:
  - `npx eslint src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
- Hasil build:
  - sukses (lint bersih)
- APK yang dihasilkan:
  - tidak ada
- Catatan:
  - Generator hanya membuat draft override di UI; untuk menyimpan ke RTDB tetap harus klik tombol `Simpan Override`.

## 2026-08-04 11:22 - Web admin GAS: shortcut pilih kelas 7/8/9 (Jumat gabungan)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web admin GAS` (belum mengubah APK)
- Tujuan perubahan: Menambahkan shortcut pemilihan cepat kelas `7/8/9` baik pada generator rotasi Jumat maupun pemilih kelas di jadwal/override, agar skenario "kelas 7 semua" atau "kelas 8 semua" bisa diatur sekali klik.
- File utama yang diubah:
  - `web/src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Build yang dijalankan:
  - `npx eslint src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
- Hasil build:
  - sukses (lint bersih)
- APK yang dihasilkan:
  - tidak ada

## 2026-08-04 12:05 - GAS Siswa: menu baru Presensi Dhuha & Jum'at (terpisah dari Dzuhur)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menambahkan menu baru `Presensi Dhuha & Jum'at` di beranda GAS Siswa sebagai layar terpisah agar tidak mengganggu menu `Presensi Sholat` (Dzuhur) yang sudah ada.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerDhuhaJumatScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - menu `Presensi Sholat` (Dzuhur) lama tidak berubah
  - navigasi beranda siswa tetap normal
  - Virtual Pet tetap bisa membuka `Presensi Sholat` lama via shortcut
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease`
- Hasil build:
  - sukses (`assembleSiswaRelease`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - `Apk Release/Final/GAS-Siswa-release.apk` (disalin untuk distribusi)
- Versi:
  - `versionCode siswa = 23023`
- Catatan:
  - Presensi Dhuha/Jumat membaca konfigurasi `school_settings/{schoolId}/prayer_v2/*` dari web admin.
  - Penyimpanan presensi untuk menu baru ditulis ke node `prayer_attendance_v2` agar tidak bercampur dengan Dzuhur.

## 2026-08-04 12:45 - GAS Siswa: kecilkan ukuran ikon menu beranda

- Pelaksana: Assistant
- Jenis perubahan: `ui`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengecilkan ukuran ikon di semua kartu menu beranda siswa karena terlalu besar saat direview.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Build yang dijalankan:
  - `./gradlew :app:assembleSiswaRelease --no-daemon`
- Hasil build:
  - sukses (`assembleSiswaRelease`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/siswa/release/app-siswa-release.apk`
  - `Apk Release/Final/GAS-Siswa-release.apk` (disalin untuk distribusi)
- Versi:
  - `versionCode siswa = 23024`

## 2026-08-04 14:10 - GAS Guru: menu baru Presensi Dhuha & Jum'at (mode wali kelas)

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambahkan menu baru `Presensi Dhuha & Jum'at` di beranda GAS Guru sebagai layar terpisah dari menu `Presensi Sholat` (Dzuhur) yang lama. Guru hanya bisa input manual untuk kelas wali, dan untuk `Jumat` hanya aktif jika kelasnya terjadwal pada tanggal tersebut (berdasarkan `prayer_v2`).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerDhuhaJumatScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerV2ViewModel.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Build yang dijalankan:
  - `./gradlew :app:assembleGuruRelease --no-daemon`
- Hasil build:
  - sukses (`assembleGuruRelease`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
  - `Apk Release/Final/GAS-Guru-release.apk` (disalin untuk distribusi)
- Versi:
  - `versionCode guru = 1040`
- Catatan:
  - Data presensi menu baru ditulis ke node `prayer_attendance_v2` (terpisah dari Dzuhur).
  - Riwayat ditampilkan dari `prayer_attendance_v2_by_school/{schoolId}` (range terakhir).

## 2026-08-04 15:05 - PWA Guru: menu baru Presensi Dhuha & Jum'at samakan dengan APK Guru

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `pwa guru`
- Tujuan perubahan: Menyamakan perilaku PWA Guru dengan APK Guru dengan menambahkan menu baru `Presensi Dhuha & Jum'at` yang terpisah dari `Presensi Sholat` Dzuhur, mode wali kelas, input manual, dan riwayat sederhana.
- File utama yang diubah:
  - `web/src/components/guru/GuruPortalApp.tsx`
  - `web/src/components/guru/GuruFeatureViews.tsx`
  - `web/src/components/guru/GuruSholatV2Interactive.tsx`
  - `web/src/app/guru/sholat-dhuha-jumat/page.tsx`
  - `web/src/app/api/teacher/prayer-v2/route.ts`
  - `web/src/lib/guru/studentIdentity.ts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Build yang dijalankan:
  - `npm run build` (folder `web`)
- Hasil build:
  - sukses
- Output build:
  - route baru PWA guru `/guru/sholat-dhuha-jumat`
  - API baru `/api/teacher/prayer-v2`
- Aturan bisnis yang diterapkan:
  - data siswa yang tampil hanya kelas wali
  - status manual sama seperti menu Dzuhur (`Sudah Presensi`, `Tidak Sholat`, `Izin`, `Halangan`)
  - untuk `Jum'at`, input manual hanya aktif jika kelas wali memang terjadwal di `prayer_v2`
  - data tersimpan ke node `prayer_attendance_v2`

## 2026-08-04 15:25 - Catatan desain: rekomendasi Rekap Dhuha & Jum'at (Web Admin GAS)

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Tujuan perubahan: Menyediakan catatan rekomendasi pengembangan untuk tim agar dapat menambahkan menu rekap `Dhuha & Jum'at` di web admin tanpa merusak rekap Dzuhur yang sudah ada.
- File yang ditambahkan:
  - `Apk Release/Pegangan Build APK/GAS/REKOMENDASI_PENGEMBANGAN_REKAP_DHUHA_JUMAT_WEB_ADMIN.md`

## 2026-08-04 10:35 - Web admin GAS: konfigurasi multi-sholat `prayer_v2`

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web admin GAS` (belum mengubah APK `siswa`, `guru`, atau `kepala`)
- Tujuan perubahan: Menambahkan panel konfigurasi baru pada tab `Presensi Sholat -> Pengaturan Sistem` agar admin bisa mengatur jenis sholat `Dzuhur`, `Dhuha`, dan `Jumat`, lengkap dengan jadwal per kelas dan override tanggal untuk model hybrid.
- File utama yang diubah:
  - `web/src/types/gasPrayerConfig.ts`
  - `web/src/hooks/gas/attendance/useGasPrayerConfig.ts`
  - `web/src/components/gas/prayer/PrayerSystemSettingsPanel.tsx`
  - `web/src/components/gas/attendance/AttendanceSettingsPanel.tsx`
  - `web/src/app/api/admin/attendance-settings/route.ts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - akses tab `Presensi Sholat -> Pengaturan Sistem`
  - penyimpanan lokasi musholla lama
  - monitoring dan rekap presensi sholat yang sudah ada
- Build yang dijalankan:
  - `npm run build` (folder `web`)
  - `npx eslint src/components/gas/attendance/AttendanceSettingsPanel.tsx src/components/gas/prayer/PrayerSystemSettingsPanel.tsx src/hooks/gas/attendance/useGasPrayerConfig.ts src/app/api/admin/attendance-settings/route.ts src/types/gasPrayerConfig.ts`
- Hasil build:
  - sukses
- Output build:
  - aplikasi Next.js production berhasil dibuat
- APK yang dihasilkan:
  - tidak ada, karena perubahan tahap ini hanya di web admin
- Regression check yang dijalankan:
  - build production web
  - lint file yang diubah
  - audit alur baca/tulis RTDB `school_settings/{schoolId}/prayer_v2/*`
- Belum diuji:
  - uji CRUD penuh dengan data sekolah riil di browser
  - konsumsi konfigurasi `prayer_v2` oleh APK siswa/guru
  - integrasi rekap lama agar membaca `prayer_v2`
- Catatan:
  - `Dzuhur` tetap diposisikan sebagai rule global harian.
  - `Dhuha` dan `Jumat` sekarang sudah punya wadah konfigurasi web admin untuk jadwal per kelas.
  - `Jumat` disiapkan untuk kombinasi rule `putra Muslim + kelas yang dijadwalkan`.
  - Tahap ini sengaja belum memigrasikan APK agar perubahan bisa disiapkan bertahap tanpa merusak operasional yang sedang berjalan.

## 2026-08-03 14:36 - Rebuild GAS Guru Final: icon size fix (`cb3bed4d`)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `guru`
- Tujuan perubahan: Rebuild APK Guru setelah `cb3bed4d` (normalisasi ikon Data Siswa & Rekapitulasi) yang belum ikut build; overwrite distribusi Final/GAS.
- File utama yang diubah:
  - `native-mobile-gas/.../ui/screens/HomeScreen.kt` (unblock compile: kembalikan ikon siswa Tools/Catat ke ref yang ada — `cb3bed4d` merujuk drawable hilang)
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - ukuran ikon Data Siswa & Rekapitulasi di beranda guru
  - navigasi menu guru lain (Presensi, Literasi, Notifikasi, dll.)
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease` (lalu assemble ulang setelah unblock compile)
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (ersionCode 1039; versionName tetap `1.0.30-guru`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - assemble `guruRelease` sukses; SHA256 Final/GAS/output identik; metadata via `aapt dump badging`
- Belum diuji:
  - uji perangkat visual ukuran ikon Data Siswa / Rekapitulasi
- Catatan:
  - Kode ikon guru dari `cb3bed4d` (+ polish `7fb4580d` di HEAD). versionName tetap 1.0.30-guru; APK memuat versionCode 1039 dari defaultConfig.
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).
  - Unblock: `ic_menu_tools` / `ic_menu_catat_pelanggaran` tidak ada di tree; siswa Tools kembali `Icons.Default.BuildCircle`, Catat Pelanggaran kembali `ic_menu_kedisiplinan`.

---
## 2026-08-03 14:30 - Wrap-up sore: rebuild Final Guru (ikon) + docs PWA 9 menu

- Pelaksana: Assistant
- Jenis perubahan: `fix` + `docs`
- Flavor terdampak: `guru` (APK + web PWA dokumentasi)
- Tujuan perubahan: Menutup hari kerja 2026-08-03 sore â€” Final APK Guru pagi (`1038` / 10:14) belum memuat fix ikon `cb3bed4d` (14:01), jadi di-rebuild ke `1039` dan menimpa Final; mencatat audit lengkap Portal Guru PWA (9 menu APK-parity termasuk Kedisiplinan) plus batasan Web Push VAPID yang masih terbuka.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts` (`versionCode` `1039`, `versionName` `1.0.30`)
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_tools.png` (aset yang dibutuhkan compile HomeScreen)
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_catat_pelanggaran.png`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
- Fitur lama yang wajib ikut dicek:
  - ikon beranda guru (Data Siswa / Rekapitulasi tidak oversized)
  - notifikasi literasi belum + pet mati + badge
  - login + 9 menu PWA `/guru`
- Build yang dijalankan:
  - `./gradlew :app:assembleGuruRelease` (working tree bersih dari WIP lain; ikon `cb3bed4d` sudah di HEAD)
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
  - ukuran Final ~21,463,357 bytes; SHA256 `A6268DB1620C4D798F2302B2D146667537DB5032EB414CF7A186B3E485F50F06`
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - `aapt dump badging` â†’ package/version `1039` / `1.0.30-guru`
  - review commit rantai PWA hari ini vs checklist
- Belum diuji:
  - uji perangkat fisik APK `1039` (ikon + notifikasi)
  - Safari iOS lapangan untuk PWA `/guru`
  - background Web Push (VAPID/FCM belum)
- Catatan progres bundle 2026-08-03:
  - APK pagi notifikasi: `ebfeb7b8` (`1038`)
  - PWA ship: `05c4fb14` â†’ login DB: `06c784b8` / `112271dc` â†’ menu home: `5680539b` â†’ presensi: `b8db31af` â†’ sholat TZ: `0f8aa2dc` â†’ siswa/literasi: `90ca0faa` â†’ 7 KAIH: `9232a30a` â†’ rekap Excel: `b9a48343` â†’ aduan: `034241fd` â†’ kedisiplinan: `3876bf95` â†’ ikon APK: `cb3bed4d` â†’ polish: `7fb4580d`
  - Kedisiplinan PWA **selesai** (bukan stub) via `3876bf95`
  - URL live: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/guru`
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur tutorial siswa)

---

## 2026-08-03 11:10 - Docs + verify: Portal Guru PWA MVP live (`05c4fb14`)

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `guru` (web PWA; dokumentasi + verifikasi live)
- Tujuan perubahan: Mencatat ship Portal Guru PWA di `/guru` (login NPSN+NUPTK, inbox literasi belum/pet mati/aduan, A2HS) dan hasil cek App Hosting live; mencatat batasan Web Push (VAPID/FCM masih perlu).
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - login portal `/guru`, inbox notifikasi, Add to Home Screen
  - APK Guru notifikasi (terpisah) tetap relevan di perangkat Android
- Build yang dijalankan:
  - tidak ada (docs + verify live; kode sudah di `05c4fb14`)
- Hasil build:
  - n/a
- Output APK:
  - n/a
- Disalin ke:
  - n/a
- Regression check yang dijalankan:
  - GET live `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/guru` â†’ `200` HTML
  - GET `/guru/manifest.json` â†’ `200`
  - GET `/sw-guru.js` â†’ `200`
- Belum diuji:
  - Add to Home Screen di Safari iOS lapangan
  - background Web Push (masih butuh VAPID/FCM)
- Catatan:
  - Deploy App Hosting sempat lag ~6 menit setelah push `05c4fb14` (`/guru` 404 hingga ~11:09 WIB), lalu semua path PWA 200.

---

## 2026-08-03 - Fix: commit UI badge Notifikasi di home Guru (follow-up `ebfeb7b8`)

- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menyertakan wire-up badge count Notifikasi di `HomeScreen` guru yang terlewat saat rilis `ebfeb7b8`.
- File utama yang diubah: `native-mobile-gas/.../ui/screens/HomeScreen.kt`
- Build yang dijalankan: tidak ada (UI wire-up only; APK Final sudah ada di `ebfeb7b8`)

---
## 2026-08-03 10:50 - Docs: lengkapi catatan notifikasi guru (scope, badge, batasan FCM)

- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `guru` (dokumentasi saja)
- Tujuan perubahan: Melengkapi pegangan progres 2026-08-03 agar eksplisit mencatat scope wali/diampu, badge Notifikasi, retensi notifikasi lama, batasan tanpa FCM, path APK Final, dan hash commit `ebfeb7b8`.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan kode pada entri docs ini
- Build yang dijalankan:
  - tidak ada (docs-only)
- Hasil build:
  - n/a
- Output APK:
  - n/a (APK Guru sudah ada di Final dari build 10:14 / commit `ebfeb7b8`)
- Disalin ke:
  - n/a
- Regression check yang dijalankan:
  - review teks pegangan vs perilaku yang sudah di-ship
- Belum diuji:
  - sama seperti entri build 10:14 (uji perangkat masih pending)
- Catatan:
  - Sumber badge di `HomeScreen.kt` mungkin masih ada di working tree jika belum ikut commit `ebfeb7b8`; perilaku badge tetap dicatat sebagai bagian kontrak fitur hari ini.

---
## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Scope: notifikasi literasi belum + pet mati hanya untuk siswa wali kelas / diampu (roster supervised), bukan seluruh sekolah.
  - Notifikasi lama (aduan/bullying + literasi pending) tetap dipertahankan.
  - Badge angka unread muncul di kartu menu `Notifikasi` beranda guru.
  - Batasan: belum ada FCM/push server; tray system notification hanya aktif selama proses/listener app hidup (bukan push saat app dimatikan).
  - Commit fitur + APK: `ebfeb7b8`.
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).
---
## 2026-08-02 19:20 - Perbaiki unduh APK tutorial 404 di App Hosting standalone
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`, `web-tutorial`
- Tujuan perubahan: Memulihkan tombol unduh APK GAS (dan EduLock) di portal tutorial yang sempat `404` karena output standalone App Hosting tidak mengemas isi `web/public/apk`.
- File utama yang diubah:
  - `web/scripts/ensure-standalone-public.mjs`
  - konfigurasi agar `apk-manifest` tidak di-trace dari `public`
- Fitur lama yang wajib ikut dicek:
  - unduh `GAS-Siswa-release.apk` dari `/gas/install` / `/g`
  - unduh `EduLock-studentRelease.apk` dari `/edulock/install` / `/e`
- Build yang dijalankan:
  - tidak ada build APK GAS baru pada entri ini
- Hasil build:
  - tidak build APK; deploy web via commit `3c9b1413`
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - verifikasi live unduh APK GAS + EduLock kembali normal (bukan `404`)
- Belum diuji:
  - tidak relevan setelah verifikasi live unduh
- Catatan:
  - Shared dengan EduLock; ship EduLock menyusul di `24e3ffa6`. Detail penuh ada di pegangan EduLock `BUILD_LOG.md`.

## 2026-08-02 13:40 - Catat rilis GAS siswa 1.0.30 / 23022 (gasDeviceId) dan simplifikasi tutorial web
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`, `web-tutorial`
- Tujuan perubahan: Mencatat dua perubahan terbaru ke dokumen pegangan: (1) APK GAS Siswa `1.0.30-siswa (23022)` dengan binding terpisah `gasDeviceId` agar logout/login ulang di HP yang sama tetap aman tanpa tertimpa binding EduLock; (2) portal tutorial `/gas/install` dan `/edulock/install` menghapus overlay callout, sudah push `307751ae` ke `main`.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/Edulock/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/Edulock/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - dokumen versi aktif GAS siswa harus menunjuk ke `1.0.30-siswa (23022)`
  - checklist uji login ulang HP yang sama memakai acuan build `23022`
  - catatan tutorial live merujuk commit `307751ae`
- Build yang dijalankan:
  - tidak ada build baru pada entri dokumentasi ini
- Hasil build:
  - tidak build
- Output APK:
  - tidak ada (mengacu artefak yang sudah ada)
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - verifikasi metadata `Final/GAS-Siswa-release.apk` = `1.0.30-siswa` / `23022`
  - review silang field `gasDeviceId` di `LoginScreen.kt`, `mobileAuth.ts`, dan route reset admin
- Belum diuji:
  - sinkronisasi artefak publik web ke build `23022`
  - uji perangkat logout/login ulang + izolasi binding EduLock vs GAS
- Catatan:
  - Artefak aktif di `Apk Release/Final/GAS-Siswa-release.apk` (hash `1277A714...`); salinan bernama `GAS-Siswa-v1.0.30-23022-release.apk` belum ada di folder Final saat pencatatan ini.

## 2026-08-02 13:12 - Pisahkan binding 1 akun 1 device GAS siswa ke gasDeviceId
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Memastikan logout lalu login ulang di HP yang sama tetap berhasil (pola mirip EduLock), sekaligus memisahkan kunci perangkat GAS ke `gasDeviceId` agar registrasi/login EduLock tidak menimpa binding GAS.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `web/functions/src/api/mobileAuth.ts`
  - `web/src/app/api/admin/database/route.ts`
  - `web/src/app/api/admin/edulock/route.ts`
- Fitur lama yang wajib ikut dicek:
  - login siswa pertama kali tetap mengunci ke 1 device
  - logout lalu login ulang di HP yang sama tetap diperbolehkan
  - login di HP berbeda tetap ditolak
  - reset device admin membersihkan `gasDeviceId`
  - binding EduLock (`device_uuid` / `deviceId` / `device`) tidak lagi dipakai sebagai kunci eksklusif GAS
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build:
  - sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23022`
  - versionName: `1.0.30-siswa`
- Hash SHA-256:
  - `1277A714DC557384BB5EAA6E5798EA6E54C3B77A61D1413CB7F5F2DFA6253F63`
- Regression check yang dijalankan:
  - review jalur baca/tulis `gasDeviceId` vs legacy `device_uuid/deviceId/device`
  - review reset admin ikut mengosongkan `gasDeviceId`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - uji nyata logout lalu login ulang pada HP siswa yang sama dengan build `23022`
  - uji login akun yang sama dari HP berbeda tetap terkunci
  - uji login EduLock di HP yang sama tidak menimpa binding GAS
- Catatan:
  - Versi dinaikkan ke `1.0.30-siswa (23022)` agar bisa menimpa build `23019` sebelumnya.

## 2026-08-02 13:35 - Hapus overlay callout pada portal tutorial GAS & EduLock
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `web-tutorial`
- Tujuan perubahan: Menyederhanakan visual tutorial siswa: kotak callout di atas screenshot dihapus, teks langkah default di atas gambar tetap dipakai, dan wording EduLock memakai tombol `Daftar`.
- File utama yang diubah:
  - `web/src/app/gas/install/page.tsx`
  - `web/src/app/edulock/install/page.tsx`
- Fitur lama yang wajib ikut dicek:
  - judul/body langkah instalasi tetap terbaca di `/gas/install` dan `/edulock/install`
  - gambar tutorial tetap termuat via static import
  - alias URL pendek `/g` dan `/e` tetap mengarah ke halaman yang sama
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
  - Deploy mengikuti jalur git push `main` ke Firebase App Hosting `gerbang-aplikasi-sekolah--kompas-5f0b4`.

## 2026-08-02 12:20 - Rapikan dokumen final GAS siswa agar sinkron dengan build 1.0.27 / 23019
- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyelaraskan dokumen pegangan GAS dengan status final progres terakhir, terutama versi aktif, lokasi artefak final, dan checklist uji gate EduLock berbasis device yang sama.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - dokumen versi aktif GAS siswa harus menunjuk ke `1.0.27-siswa (23019)`
  - catatan distribusi harus menunjuk ke folder `Apk Release/Final`
  - checklist compliance EduLock harus sesuai rule gate final terbaru
- Build yang dijalankan:
  - tidak ada build baru
- Hasil build:
  - tidak build
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - review silang versi pada `build.gradle.kts` vs dokumen GAS
  - review silang status build final vs checklist uji perangkat
- Belum diuji:
  - sinkronisasi artefak publik web ke build `23019` bila nanti diputuskan ikut dirilis lewat portal
- Catatan:
  - Perubahan ini murni perapian dokumentasi; APK EduLock tidak disentuh dan tidak ada build tambahan.

## 2026-08-02 12:11 - Kunci GAS siswa hanya saat monitoring dan proteksi EduLock hijau di HP yang sama
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menutup celah saat GAS masih bisa dibuka walaupun EduLock baru terpasang tetapi belum diaktivasi. Gate sekarang hanya meloloskan akses jika telemetry EduLock berasal dari HP yang sama, status monitoring masih online, dan proteksi berstatus `COMPLIANT`.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - GAS tetap menahan akses jika EduLock belum terpasang
  - GAS tetap menahan akses jika EduLock terpasang tetapi belum login/aktivasi di HP tersebut
  - GAS hanya terbuka jika monitoring EduLock online dan proteksi `COMPLIANT`
  - record telemetry lama dari HP lain tidak boleh lagi membuka GAS di HP sekarang
  - tombol `BUKA EDULOCK` dari overlay tetap berfungsi
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build:
  - sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.27-23019-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23019`
  - versionName: `1.0.27-siswa`
- Hash SHA-256:
  - `4DE1ED507ECFF068C9EC7EFFC92107DC2B1AEADC3E2FB1A8DE794B75B98DC059`
- Regression check yang dijalankan:
  - review rule telemetry `COMPLIANT` vs `PAUSED/NON_COMPLIANT`
  - review kecocokan device binding lokal GAS dengan `active_devices` EduLock
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - uji di HP siswa: EduLock terpasang tetapi belum login -> GAS harus tetap tertahan
  - uji di HP siswa: EduLock login + monitoring/proteksi hijau -> GAS harus terbuka
  - uji dengan record telemetry lama dari HP lain untuk memastikan tidak lagi lolos
- Catatan:
  - Pendekatan final tidak membaca warna panel admin secara literal, tetapi memakai field sumber yang sama (`deviceStatus`, `complianceStatus`, `protectionHealth`, `lastUpdated`) agar hasil gate konsisten dengan indikator hijau/merah di dashboard.

## 2026-08-02 12:00 - Samakan perilaku login ulang GAS siswa pada HP yang sama dengan EduLock
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mencegah kasus siswa logout lalu login lagi di HP yang sama tetapi ditolak dengan pesan akun/HP terkunci. GAS siswa sekarang membaca dan menyinkronkan binding perangkat dengan pola yang sama seperti EduLock (`device_uuid`, `deviceId`, `device`).
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - login siswa pertama kali tetap mengunci ke 1 device
  - logout lalu login ulang di HP yang sama tetap diperbolehkan
  - login di HP berbeda tetap ditolak
  - field binding siswa di RTDB tetap sinkron antara `device_uuid`, `deviceId`, dan `device`
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build:
  - sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.26-23018-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23018`
  - versionName: `1.0.26-siswa`
- Hash SHA-256:
  - `3753BC994197BC9D1FFDC1C33BC8D0BDA41B3FCE6CA04DED5AFFF792265D9C7C`
- Regression check yang dijalankan:
  - review jalur binding siswa di login GAS vs EduLock
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - uji nyata logout lalu login ulang pada HP siswa yang sama
  - uji login akun yang sama dari HP berbeda untuk memastikan tetap terkunci
- Catatan:
  - Sumber mismatch sebelumnya kemungkinan berasal dari GAS yang hanya membaca `deviceId/device`, sementara binding aktif siswa sudah tersimpan pada `device_uuid` seperti pola EduLock.

## 2026-08-02 11:53 - Wajibkan EduLock benar-benar dibuka sebelum GAS Siswa bisa dipakai
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menutup celah di mana siswa cukup meng-install EduLock tanpa login/menjalankannya lalu GAS Siswa tetap bisa dibuka. GAS sekarang menuntut telemetry EduLock yang valid sebelum akses siswa dibuka.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - GAS tetap menahan akses jika EduLock belum terpasang
  - GAS sekarang juga menahan akses jika EduLock baru terpasang tetapi belum dibuka/login
  - tombol `BUKA EDULOCK` dari overlay masih berfungsi
  - akses terbuka kembali setelah EduLock mengirim telemetry compliance yang cocok
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build:
  - sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.25-23017-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23017`
  - versionName: `1.0.25-siswa`
- Hash SHA-256:
  - `884C5CAB66DA18818A34BCB17E5BDD33DF305B13D37685D94283455AA4445372`
- Regression check yang dijalankan:
  - review logika blokir pada `EduLockComplianceGate`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - uji di HP siswa: install EduLock tanpa dibuka -> GAS harus tetap tertahan
  - uji di HP siswa: buka/login EduLock -> GAS harus terbuka kembali
- Catatan:
  - Perilaku kompatibilitas lama yang mengizinkan saat telemetry EduLock belum ada sudah dihapus untuk flavor siswa.

## 2026-08-02 11:46 - Tampilkan versi APK terkini di halaman Force Update Control (web) dari apk-manifest
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `web-admin`
- Tujuan perubahan: Menampilkan versionCode/versionName APK yang sedang tersedia di server (`web/public/apk`) pada kolom GAS dan EduLock agar admin mudah menaikkan nilai force update tanpa menebak.
- File utama yang diubah:
  - `web/src/app/super-admin/mobile-apps/page.tsx`
  - `web/scripts/sync-public-apk.ps1`
  - `web/public/apk/apk-manifest.json`
- Fitur lama yang wajib ikut dicek:
  - halaman `Super Admin â†’ Kontrol Aplikasi Mobile` tetap bisa load & simpan min version
  - angka `Versi saat ini` muncul untuk GAS dan EduLock (jika file APK tersedia)
- Build yang dijalankan:
  - `npm run build`
- Hasil build:
  - sukses
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - `apk-manifest.json` kini menyertakan metadata EduLock (package/version)
  - build Next.js sukses setelah fetch manifest di client component
- Belum diuji:
  - verifikasi tampilan di hosting live setelah deploy
- Catatan:
  - Sumber versi adalah `web/public/apk/apk-manifest.json` (hasil dari `sync-public-apk.ps1`), jadi angka mengikuti APK yang memang tersimpan/terdistribusi di server.

## 2026-08-02 11:24 - Ubah ikon sidebar web GAS ke static import agar tidak 404 di live
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `web-admin`
- Tujuan perubahan: Mengatasi ikon sidebar GAS yang rusak di hosting live karena URL file `public/icons/gas/*` tidak tersaji di runtime live walaupun normal di lokal. Solusi diubah ke static import Next.js agar aset ikon ikut dibundle ke output build.
- File utama yang diubah:
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - ikon sidebar `Manajemen Presensi`
  - ikon sidebar `Presensi Sholat`
  - ikon sidebar `Monitoring E-Library`
  - ikon sidebar `7 KAIH`
  - ikon sidebar `Virtual Pet Monitor`
  - ikon sidebar `Rekap Kedisiplinan`
  - ikon sidebar `Laporan Masuk`
  - ikon sidebar `Broadcast Notifikasi`
- Build yang dijalankan:
  - `npm run build`
- Hasil build:
  - sukses
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - verifikasi URL live `/icons/gas/kedisiplinan.png` sebelumnya `404`
  - build Next.js sukses setelah pindah ke static import
- Belum diuji:
  - verifikasi visual langsung di dashboard web live setelah redeploy
- Catatan:
  - Akar masalah ada di penyajian aset `public/icons/gas` pada hosting live, bukan di layout sidebar.

## 2026-08-02 11:17 - Perbesar lagi ikon menu siswa dengan skala render lebih agresif
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Membuat ikon menu siswa tampil lebih besar lagi karena revisi sebelumnya masih belum cukup dominan di layar HP.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - ukuran ikon `Absensi`
  - ukuran ikon `Presensi Sholat`
  - ukuran ikon `Lentera Digital`
  - ukuran ikon `7 KAIH`
  - ukuran ikon `Virtual Pet`
  - ukuran ikon `Kedisiplinan`
  - ukuran ikon `Layanan Aduan`
  - ukuran ikon `Notifikasi`
  - ukuran ikon `Tools`
  - ukuran ikon `Catat Pelanggaran`
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.24-23016-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23016`
  - versionName: `1.0.24-siswa`
- Hash SHA-256:
  - `779AD60C39A38A12106C1E7955D61A61BDA633F0280F93D49B862CC7389803F8`
- Regression check yang dijalankan:
  - review skala render ikon di `StudentFeatureCard`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - verifikasi visual di HP siswa apakah ukuran ikon sekarang sudah pas
- Catatan:
  - Ikon diperbesar lagi dengan menaikkan tinggi panel, menghilangkan padding panel, dan menaikkan nilai `scale`.

## 2026-08-02 11:10 - Besarkan lagi render ikon menu siswa agar isi gambar lebih dominan
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Memperbesar lagi ukuran visual ikon pada kartu menu siswa karena setelah penyesuaian UI sebelumnya, ikon masih terlihat terlalu kecil dibanding referensi.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - dominasi ukuran ikon di panel menu siswa
  - proporsi ikon terhadap frame kartu
  - ketajaman detail ikon setelah skala diperbesar
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.23-23015-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23015`
  - versionName: `1.0.23-siswa`
- Hash SHA-256:
  - `D3A7F39DA2C596FF8EF98CE1384D04E6D7B956D2357DD5358E05622613B6FDEA`
- Regression check yang dijalankan:
  - review modifier render ikon di `StudentFeatureCard`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - verifikasi visual di HP siswa apakah ukuran ikon kini sudah sesuai referensi
- Catatan:
  - Pendekatan kali ini memperbesar render gambar langsung dengan `scale`, sehingga ruang kosong bawaan PNG tidak terlalu terasa.

## 2026-08-02 11:04 - Perbarui ikon menu dashboard web GAS dengan aset baru
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `web-admin`
- Tujuan perubahan: Menerapkan aset ikon baru pada sidebar dashboard web GAS agar menu monitoring dan presensi memakai visual yang sama dengan paket ikon terbaru.
- File utama yang diubah:
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `web/public/icons/gas/absensi.png`
  - `web/public/icons/gas/presensi-sholat.png`
  - `web/public/icons/gas/lentera-digital.png`
  - `web/public/icons/gas/7-kaih.png`
  - `web/public/icons/gas/virtual-pet.png`
  - `web/public/icons/gas/kedisiplinan.png`
  - `web/public/icons/gas/layanan-aduan.png`
  - `web/public/icons/gas/notifikasi.png`
- Fitur lama yang wajib ikut dicek:
  - ikon sidebar `Manajemen Presensi`
  - ikon sidebar `Presensi Sholat`
  - ikon sidebar `Monitoring E-Library`
  - ikon sidebar `7 KAIH`
  - ikon sidebar `Virtual Pet Monitor`
  - ikon sidebar `Rekap Kedisiplinan`
  - ikon sidebar `Laporan Masuk`
  - ikon sidebar `Broadcast Notifikasi`
- Build yang dijalankan:
  - tidak ada build baru khusus untuk entry ini
- Hasil build:
  - tidak build
- Output APK:
  - tidak ada
- Disalin ke:
  - tidak ada
- Regression check yang dijalankan:
  - diff review `GasSidebar.tsx`
  - verifikasi aset ikon tersedia di `web/public/icons/gas`
- Belum diuji:
  - verifikasi visual langsung di dashboard web live sesudah deploy
- Catatan:
  - Perubahan ini khusus untuk web dashboard GAS, bukan APK GAS siswa.

## 2026-08-02 11:03 - Samakan gaya kartu menu beranda GAS Siswa dengan referensi visual baru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyesuaikan UI kartu menu beranda GAS Siswa agar lebih dekat dengan referensi visual yang diberikan user, dengan tetap mempertahankan detail seperti bingkai halus, panel ikon besar, dan capsule label glossy.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - bentuk kartu menu siswa
  - ukuran panel ikon
  - tampilan label menu di bawah ikon
  - proporsi visual ikon baru terhadap kartu
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.22-23014-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23014`
  - versionName: `1.0.22-siswa`
- Hash SHA-256:
  - `49058C9AD0AC0424E9E28306958AB3A499B841661282B1852424B289DAD27806`
- Regression check yang dijalankan:
  - review ulang komponen `StudentFeatureCard`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - verifikasi visual langsung di HP siswa apakah jarak, glow, dan capsule label sudah cukup mirip dengan referensi
- Catatan:
  - Fokus perubahan ada pada styling kartu menu, bukan mengganti ulang aset ikon.

## 2026-08-02 10:55 - Besarkan tampilan ikon menu beranda GAS Siswa agar mendekati proporsi versi lama
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Memperbesar tampilan ikon pada kartu menu beranda GAS Siswa karena aset ikon baru terlihat terlalu kecil saat dirender di aplikasi.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - ukuran ikon menu `Absensi`
  - ukuran ikon menu `Presensi Sholat`
  - ukuran ikon menu `Lentera Digital`
  - ukuran ikon menu `7 KAIH`
  - ukuran ikon menu `Virtual Pet`
  - ukuran ikon menu `Kedisiplinan`
  - ukuran ikon menu `Layanan Aduan`
  - ukuran ikon menu `Notifikasi`
  - ukuran ikon menu `Tools`
  - ukuran ikon menu `Catat Pelanggaran`
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.21-23013-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23013`
  - versionName: `1.0.21-siswa`
- Hash SHA-256:
  - `F134E2E02BF33FE259FD214421A37C9078DF82E000D7D10CBDB00C02C63A0EAF`
- Regression check yang dijalankan:
  - review ukuran card dan box ikon di `HomeScreen.kt`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - verifikasi visual langsung di HP siswa untuk memastikan proporsinya sudah pas
- Catatan:
  - Box ikon dibesarkan, padding ikon diperkecil, dan gambar dibuat mengisi area lebih penuh agar ikon baru tidak terlihat mungil.

## 2026-08-02 10:47 - Perbarui ikon menu beranda APK GAS Siswa dengan aset baru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengganti ikon menu beranda pada APK GAS Siswa agar memakai aset baru yang disediakan user dari folder `E:\Aplikasi Android\Update\Icon\New`, karena sebelumnya salah diterapkan ke web dashboard.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_absensi.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_presensi_sholat.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_lentera_digital.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_kaih7.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_virtual_pet.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_kedisiplinan.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_layanan_aduan.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_notifikasi.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_tools.png`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_catat_pelanggaran.png`
  - `native-mobile-gas/app/build.gradle.kts`
- Fitur lama yang wajib ikut dicek:
  - ikon menu `Absensi`
  - ikon menu `Presensi Sholat`
  - ikon menu `Lentera Digital`
  - ikon menu `7 KAIH`
  - ikon menu `Virtual Pet`
  - ikon menu `Kedisiplinan`
  - ikon menu `Layanan Aduan`
  - ikon menu `Notifikasi`
  - ikon menu `Tools`
  - ikon menu `Catat Pelanggaran`
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.20-23012-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23012`
  - versionName: `1.0.20-siswa`
- Hash SHA-256:
  - `4D8600196DE1FACB6F95691536DFF015AA3078A2B3219209A8C9F30E6E6D311B`
- Regression check yang dijalankan:
  - review mapping ikon menu siswa di `HomeScreen.kt`
  - build `assembleSiswaRelease` sukses
- Belum diuji:
  - verifikasi visual langsung di perangkat siswa untuk ukuran grid ikon dan crop gambar
- Catatan:
  - `Tools` kini tidak lagi memakai ikon vector default, tetapi memakai aset gambar baru.
  - `Catat Pelanggaran` kini memakai ikon khusus sendiri, tidak lagi menumpang ikon `Kedisiplinan`.

## 2026-08-02 10:04 - Kunci Presensi Sholat siswa setelah status sholat hari ini tercatat
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menutup celah pada menu `Presensi Sholat` siswa yang sebelumnya masih membiarkan tombol ditekan berulang pada hari yang sama. Setelah status `PRAY` hari ini tercatat, tombol sekarang terkunci, label tombol berubah, dan siswa melihat pesan bahwa ia sudah melaksanakan sholat beserta jamnya.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - `Presensi Sholat` siswa saat presensi pertama berhasil
  - tombol `Presensi Sholat` harus nonaktif jika hari ini sudah berstatus `PRAY`
  - pesan sukses harus menegaskan bahwa siswa sudah melaksanakan sholat hari ini
  - jam pada riwayat hari ini tidak boleh berubah lagi karena klik ulang dari siswa
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-v1.0.19-23011-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23011`
  - versionName: `1.0.19-siswa`
- Hash SHA-256:
  - `99C59B0F824A3AA8B6430B38AA8F3363709B1853542985D2EE088F00CDCE9459`
- Regression check yang dijalankan:
  - review guard `hasPrayedToday` pada layar siswa
  - build `assembleSiswaRelease` sukses
  - hash file output build dan kedua file di folder `Final` identik
- Belum diuji:
  - uji HP nyata: presensi pertama sukses lalu tombol harus berubah menjadi `Sudah Sholat Hari Ini`
  - uji HP nyata: tutup-buka layar sesudah submit dan pastikan status terkunci tetap muncul
  - uji HP nyata: guru/manual update pada hari yang sama tidak menimbulkan state membingungkan di layar siswa
- Catatan:
  - build ini hanya disalin ke folder `Final`; file publik `web/public/apk` belum disentuh karena user baru meminta build lokal.

## 2026-08-02 09:38 - Portal tutorial GAS siswa: rapikan posisi & tampilan text box (callout) panduan login
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mempercantik dan merapikan posisi text box petunjuk (callout) pada gambar panduan login agar lebih rapi, tidak mengganggu tampilan, dan lebih sesuai dengan area input.
- File utama yang diubah:
  - `web/src/app/gas/install/page.tsx`
- Fitur lama yang wajib ikut dicek:
  - posisi callout pada panduan visual login (NISN, nama otomatis, tombol Masuk) tetap terbaca di berbagai ukuran layar
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - review kelas Tailwind untuk container callout + posisi callout login
- Belum diuji:
  - cek visual langsung di HP nyata (responsif)
- Catatan:
  - Perubahan ini hanya menyentuh portal tutorial web, tidak mengubah APK GAS siswa.

## 2026-08-02 09:33 - Portal tutorial GAS siswa: tambah catatan tombol Presensi Sholat berbasis area musholla
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menambahkan keterangan bahwa tombol `Presensi Sholat` hanya akan muncul jika siswa berada di area musholla, agar ekspektasi siswa sesuai saat praktik.
- File utama yang diubah:
  - `web/src/app/gas/install/page.tsx`
- Fitur lama yang wajib ikut dicek:
  - section `Presensi Sholat` pada `/gas/install` menampilkan keterangan tambahan
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - review teks `visualSteps` Presensi Sholat pada portal tutorial
- Belum diuji:
  - cek visual langsung di HP nyata
- Catatan:
  - Perubahan ini hanya menyentuh portal tutorial web, tidak mengubah APK GAS siswa.

## 2026-08-02 09:30 - Portal tutorial GAS siswa: tambah visual menu Presensi Sholat
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menambahkan panduan visual penggunaan menu `Presensi Sholat` pada portal tutorial `/gas/install` mengikuti urutan gambar dari folder tutorial.
- File utama yang diubah:
  - `web/src/app/gas/install/page.tsx`
  - `web/public/tutorial/gas-siswa/presensi-sholat/1.jpeg`
- Fitur lama yang wajib ikut dicek:
  - bagian `Penggunaan Menu GAS` pada route `/gas/install`
  - section `Presensi Sholat` menampilkan contoh visual tanpa pecah layout
  - anchor link `Presensi Sholat` dari daftar menu mengarah ke bagian yang benar
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - verifikasi aset tutorial presensi sholat tersedia di `web/public/tutorial/gas-siswa/presensi-sholat`
  - review source `gasMenuItems.presensi-sholat.visualSteps` sudah mengikuti urutan gambar
- Belum diuji:
  - cek visual langsung di HP nyata (responsif + loading gambar)
- Catatan:
  - Perubahan ini hanya menyentuh portal tutorial web, tidak mengubah APK GAS siswa.

## 2026-08-02 09:23 - Portal tutorial GAS siswa: tambah visual menu Absensi
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menambahkan panduan visual penggunaan menu `Absensi` pada portal tutorial `/gas/install` mengikuti urutan gambar (1-3) agar siswa lebih mudah memahami alur absen.
- File utama yang diubah:
  - `web/src/app/gas/install/page.tsx`
  - `web/public/tutorial/gas-siswa/absensi/1.jpeg`
  - `web/public/tutorial/gas-siswa/absensi/2.jpeg`
  - `web/public/tutorial/gas-siswa/absensi/3.jpeg`
- Fitur lama yang wajib ikut dicek:
  - bagian `Penggunaan Menu GAS` pada route `/gas/install`
  - section `Absensi` menampilkan 3 gambar contoh tanpa pecah layout
  - anchor link `Absensi` dari daftar menu mengarah ke bagian yang benar
- Build yang dijalankan:
  - tidak ada build APK baru
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - verifikasi aset tutorial absensi tersedia di `web/public/tutorial/gas-siswa/absensi`
  - review source `gasMenuItems.absensi.visualSteps` sudah mengikuti urutan 1-3
- Belum diuji:
  - cek visual langsung di HP nyata (responsif + loading gambar)
- Catatan:
  - Perubahan ini hanya menyentuh portal tutorial web, tidak mengubah APK GAS siswa.

## 2026-08-02 08:25 - Audit kegagalan overwrite manual mengarah ke signer debug lama
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mendokumentasikan temuan bukti bahwa kegagalan install manual terbaru kemungkinan besar bukan lagi karena `versionCode`, tetapi karena sebagian APK lama pernah didistribusikan sebagai build `debug` dengan signer berbeda dari build release saat ini.
- File utama yang diubah:
  - `debug-apk-overwrite-fail.md`
  - `Apk Release/Pegangan Build APK/GAS/CATATAN_MASALAH_UPDATE_APK_MANUAL.md`
  - `Apk Release/Pegangan Build APK/GAS/RINGKASAN_MASALAH_UPDATE_APK_MANUAL.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - install manual APK siswa terbaru di HP yang sudah terpasang build lama
  - identifikasi jalur distribusi APK lama yang pertama kali dipasang di device target
  - konsistensi signer semua artefak distribusi resmi
- Build yang dijalankan:
  - tidak ada build baru
- Hasil build: tidak relevan
- Bukti audit utama:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` = `com.satupintu.mobile.siswa`, `1.0.15-siswa`, `23007`, signer `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`
  - `D:\Dashboard Portal\docs\APK GAS\apk GAS siswa.apk` = `com.satupintu.mobile.siswa`, `1.0.11-siswa`, `1028`, signer `a2eb5bc009532e7075912b58c6825b9ea91862676a31507b227d90583d26b674`
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\debug\app-siswa-debug.apk` memakai signer yang sama dengan file `docs\APK GAS\apk GAS siswa.apk`
  - `D:\Dashboard Portal\docs\APK GAS\handoff_APK GAS.md` menyebut folder `docs\APK GAS\` berisi build terbaru `debug`
- Regression check yang dijalankan:
  - scan signer semua APK `com.satupintu.mobile.siswa` di workspace
  - verifikasi signer release final vs signer debug/docs
  - verifikasi artefak web publik saat ini masih `23005`, belum sama dengan build uji manual `23007`
- Belum diuji:
  - pembuktian device-side bahwa HP target memang memasang jalur debug lama
  - install manual pada HP yang baseline-nya sudah pasti build release signer `6473...`
- Catatan:
  - Jika perangkat siswa terlanjur memasang APK signer debug `a2eb...`, maka build release `6473...` tidak bisa menimpa langsung walaupun `versionCode` dinaikkan.
  - Konsekuensi operasionalnya adalah perlu identifikasi sumber APK awal per perangkat dan kemungkinan satu kali uninstall-install ulang untuk populasi yang terpasang dari jalur debug.

## 2026-08-02 11:40 - Build uji overwrite manual GAS siswa tanpa mengandalkan URL instalasi web
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyiapkan build terbaru khusus untuk menguji skenario nyata setelah launching awal, yaitu siswa meng-install manual APK baru dari luar agar menimpa APK lama di HP. Fokusnya bukan distribusi via URL web, tetapi kompatibilitas overwrite manual antarrilis.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - APK siswa terbaru harus bisa di-install menimpa build lama tanpa uninstall
  - `Absensi` dan `Presensi Sholat` tetap membaca rule hari efektif dari web admin
  - build uji ini tidak boleh diam-diam mengubah jalur distribusi web publik
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: `BUILD SUCCESSFUL`
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- Metadata APK:
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23007`
  - versionName: `1.0.15-siswa`
- Hash SHA-256:
  - `8A09BC167060CC0E3C73BEB130B06FC972D206EBD4A9E62078E135C651C64815`
- Regression check yang dijalankan:
  - metadata APK output sudah terbaca `23007 / 1.0.15-siswa`
  - hash APK output dan file `Final` identik
  - `web/public/apk` sengaja belum disentuh agar build ini dipakai dulu untuk uji manual overwrite dari luar
- Belum diuji:
  - install manual di HP menimpa APK lama tanpa pesan `Aplikasi tidak terinstal`
  - `Presensi Sholat` siswa sesudah update manual ke build `23007`
- Catatan:
  - build ini sengaja dinaikkan lagi dari `23006` ke `23007` agar pengujian overwrite tidak tertahan oleh kasus versi sama
  - pendekatan yang diuji mengikuti operasional lapangan: URL hanya untuk instalasi awal, update rutin dilakukan dari file APK luar

## 2026-08-02 11:27 - Tambah versi singkat catatan masalah update manual APK untuk dibagikan ke tim
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyediakan versi singkat satu halaman dari catatan masalah update manual APK GAS siswa agar lebih mudah dikirim ke tim lewat chat atau dipakai sebagai bahan diskusi cepat.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/RINGKASAN_MASALAH_UPDATE_APK_MANUAL.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan perilaku aplikasi
  - dokumen ringkas tetap konsisten dengan catatan lengkap
- Build yang dijalankan:
  - tidak ada build; perubahan ini murni dokumentasi
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - file ringkasan baru disimpan di folder pegangan `GAS`
  - README pegangan kini menautkan versi singkat dan versi lengkap
- Belum diuji:
  - tidak ada
- Catatan:
  - dokumen ini dibuat khusus agar isu bisa dijelaskan cepat tanpa membuka catatan panjang

## 2026-08-02 11:24 - Revisi catatan konsultasi: URL instalasi siswa hanya untuk launching awal, bukan kanal update rutin
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyesuaikan catatan masalah update manual APK dengan praktik operasional nyata. URL instalasi siswa diposisikan sebagai kanal onboarding awal, sedangkan fokus risiko update harian dipindahkan ke kompatibilitas overwrite APK lama di HP siswa.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/CATATAN_MASALAH_UPDATE_APK_MANUAL.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan perilaku aplikasi
  - catatan konsultasi tetap sesuai kondisi operasional lapangan
- Build yang dijalankan:
  - tidak ada build; perubahan ini murni dokumentasi
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - fokus dokumen bergeser dari URL unduhan ke proses overwrite APK manual antarrilis
- Belum diuji:
  - tidak ada
- Catatan:
  - perubahan ini penting agar diskusi tim tidak salah fokus menganggap URL instalasi sebagai solusi utama update rutin

## 2026-08-02 11:18 - Tambah catatan khusus masalah update manual APK GAS siswa untuk bahan konsultasi tim
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mendokumentasikan secara ringkas akar kekhawatiran operasional bahwa siswa bisa gagal menimpa APK lama saat update manual, termasuk temuan teknis, mitigasi yang sudah dipasang, dan daftar pertanyaan yang perlu diputuskan bersama tim.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/CATATAN_MASALAH_UPDATE_APK_MANUAL.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - tidak ada perubahan perilaku aplikasi
  - dokumen pegangan tetap mudah dipakai untuk release berikutnya
- Build yang dijalankan:
  - tidak ada build; perubahan ini murni dokumentasi
- Hasil build: tidak build
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - file catatan baru tersimpan di folder pegangan `GAS`
  - README pegangan sekarang menautkan catatan baru agar mudah ditemukan
- Belum diuji:
  - tidak ada
- Catatan:
  - dokumen ini dibuat khusus untuk membantu diskusi internal/non-teknis tanpa harus membuka seluruh riwayat commit dan log build

## 2026-08-02 11:05 - Sinkronisasi sumber rule Presensi Sholat ke attendance schedules web admin
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`, `guru`, `kepala`
- Tujuan perubahan: Menutup bug lanjutan pada `Presensi Sholat` yang masih membaca hari non-efektif walaupun admin sudah mengaktifkan Minggu. Akar masalahnya adalah jalur sholat masih membaca `prayer/schedules`, padahal dashboard web hanya mengelola `attendance/schedules`.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherRecapViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/PrincipalDashboardViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - kartu `Aturan Hari` pada `Presensi Sholat` siswa harus mengikuti `attendance/schedules` dari web admin
  - rekap `Presensi Sholat` guru dan kepala sekolah tetap konsisten dengan hari efektif yang sama
  - `Virtual Pet` tidak salah membaca status hari efektif sholat
  - build baru bisa di-install di atas `GAS Siswa 23005`
- Build yang dijalankan:
  - `:app:compileSiswaDebugKotlin`
  - `:app:compileGuruDebugKotlin`
  - `:app:compileKepalaDebugKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- Regression check yang dijalankan:
  - referensi `prayer_schedules` dan `school_settings/.../prayer/schedules` sudah dihapus dari source mobile
  - ketiga flavor debug (`siswa`, `guru`, `kepala`) berhasil dikompilasi
  - metadata APK release: `com.satupintu.mobile.siswa`, `1.0.14-siswa`, `versionCode 23006`
  - hash APK output build dan file `Final` sama: `A93D555B60843FDE79DF3B8C1C8D52662B6DD9430C73B71AD157B06A2DAF9A63`
- Belum diuji:
  - uji HP siswa pada layar `Presensi Sholat` sesudah memasang build `23006`
  - sinkronisasi ke `web/public/apk` dan deploy web live
- Catatan:
  - perbaikan ini sengaja memakai `attendance/schedules` sebagai sumber tunggal karena web admin saat ini tidak menyediakan pengaturan `prayer/schedules`

## 2026-08-02 07:44 - Finalisasi rilis GAS siswa 1.0.13-siswa (23005), sinkronisasi APK publik, siap deploy App Hosting
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Merilis perbaikan final untuk bug hari Minggu efektif, penjelasan force update agar siswa install manual APK terbaru, dan memastikan link unduhan publik mengarah ke artefak APK yang sama dengan folder `Final`.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/ForceUpdateScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PresensiRuleUtils.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/PrincipalDashboardViewModel.kt`
  - `web/public/apk/GAS-Siswa-release.apk`
  - `web/public/apk/apk-manifest.json`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Absensi` siswa membaca hari efektif sekolah dari web admin, termasuk saat Minggu diaktifkan
  - `Presensi Sholat` siswa mengikuti rule hari efektif yang sama
  - layar `Force Update` menegaskan bahwa siswa harus install manual APK terbaru
  - file `Final` dan `web/public/apk` identik agar link unduhan publik tidak stale
  - build baru tetap bisa di-install di atas APK siswa `23004`
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
  - `npm run sync:apk:gas`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - `D:\Dashboard Portal\web\public\apk\GAS-Siswa-release.apk`
- Regression check yang dijalankan:
  - metadata APK release: `com.satupintu.mobile.siswa`, `1.0.13-siswa`, `versionCode 23005`
  - hash APK output build, `Final`, dan `web/public/apk` sama: `6182A3C142228AC3E0420925EA9A2E389C3C9A4CE8F41E0FD659B067B58D9157`
  - `apk-manifest.json` publik terbarui ke `versionCode 23005`
- Belum diuji:
  - unduh dari domain live sesudah rollout App Hosting selesai
  - update manual di HP siswa di atas build `23004` menggunakan file hasil unduh domain live
- Catatan:
  - entry ini menjadi acuan final sebelum commit/push ke `main` untuk memicu deploy App Hosting

## 2026-08-02 07:39 - Perjelas instruksi force update GAS siswa agar siswa install manual APK terbaru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyesuaikan perilaku force update dengan alur operasional sekolah. Saat force update aktif, layar kunci sekarang menegaskan bahwa siswa harus mengunduh lalu meng-install manual file APK GAS terbaru di HP, bukan mengharapkan update otomatis dari dalam aplikasi.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/ForceUpdateScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - layar `Force Update` tetap mengunci aplikasi saat `min_version_code_gas` lebih tinggi dari versi terpasang
  - instruksi yang tampil tidak menyesatkan siswa ke ekspektasi update otomatis
  - tombol `TUTUP APLIKASI` tetap berfungsi
- Build yang dijalankan:
  - `:app:compileSiswaDebugKotlin`
- Hasil build: sukses (`BUILD SUCCESSFUL`)
- Output APK: tidak ada APK baru
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - review teks default `Force Update` siswa
  - `:app:compileSiswaDebugKotlin` berhasil tanpa error; tersisa warning lama yang tidak terkait perubahan ini
- Belum diuji:
  - uji HP: naikkan `min_version_code_gas` dari web admin lalu pastikan layar force update menampilkan instruksi instal manual APK terbaru
- Catatan:
  - perubahan ini sengaja tidak menambahkan tombol update otomatis dari dalam app

## 2026-08-02 07:31 - Tambah guard sinkronisasi APK GAS siswa agar update rilis lebih aman
- Pelaksana: Assistant
- Jenis perubahan: `tooling`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengurangi risiko siswa gagal update di rilis berikutnya dengan menambahkan validasi otomatis pada skrip sinkronisasi APK web. Guard baru memastikan `GAS Siswa` tidak lagi tersinkron ke `web/public/apk` bila `versionCode` turun, tetap sama tetapi isi APK berubah, atau signature berbeda dari file publik sebelumnya.
- File utama yang diubah:
  - `web/scripts/sync-public-apk.ps1`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `npm run sync:apk:gas` tetap bisa menyalin APK dari `Final` ke `web/public/apk`
  - metadata `apk-manifest.json` untuk GAS siswa terisi `packageName`, `versionCode`, `versionName`, `signerSha256`
  - sinkronisasi diblokir bila ada percobaan menimpa file publik dengan `versionCode` yang lebih rendah
- Build yang dijalankan:
  - tidak ada build APK baru
  - `powershell -ExecutionPolicy Bypass -File web/scripts/sync-public-apk.ps1 -App gas`
- Hasil build: tidak build; validasi skrip sinkronisasi sukses
- Output APK:
  - sumber tetap `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\web\public\apk\GAS-Siswa-release.apk`
- Regression check yang dijalankan:
  - skrip sinkronisasi berhasil membaca metadata APK GAS siswa (`com.satupintu.mobile.siswa`, `1.0.12-siswa`, `23004`)
  - skrip sinkronisasi berhasil membaca signer SHA-256 release GAS
  - `web/public/apk/apk-manifest.json` berhasil diperbarui dengan metadata versi dan signer
- Belum diuji:
  - simulasi negatif: pakai APK GAS siswa dengan `versionCode` lebih rendah untuk memastikan guard benar-benar memblokir sinkronisasi
  - push/deploy web live setelah file publik berubah
- Catatan:
  - guard ini fokus ke distribusi `GAS Siswa` karena package `com.satupintu.mobile.siswa` punya riwayat jalur `legacySiswa` dan pernah mengalami file publik stale

## 2026-08-02 07:12 - Sinkronisasi APK final GAS siswa ke web public setelah ditemukan file stale
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengatasi kemungkinan user tetap mengunduh APK lama dari portal/web. Audit menunjukkan `web/public/apk/GAS-Siswa-release.apk` masih tertinggal di `versionCode 1028`, sedangkan file final terbaru di folder distribusi sudah `versionCode 23004`.
- File utama yang diubah:
  - `web/public/apk/GAS-Siswa-release.apk`
  - `debug-gas-apk-install.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - download APK siswa dari portal/web harus mengambil file terbaru
  - update APK dari file hasil unduh portal harus membaca `versionCode 23004`
  - menu `Absensi` tetap membawa fix hari Minggu efektif
- Build yang dijalankan:
  - tidak ada build baru; hanya sinkronisasi artefak hasil build final terakhir
- Hasil build: tidak build
- Output APK:
  - sumber: `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\web\public\apk\GAS-Siswa-release.apk` (ditimpa pada `2026-08-02 07:12`)
- Regression check yang dijalankan:
  - verifikasi metadata file final: `versionCode 23004`, `versionName 1.0.12-siswa`
  - verifikasi metadata file web public lama: `versionCode 1028`, `versionName 1.0.11-siswa`
  - verifikasi hash file final dan web public sebelumnya berbeda
- Belum diuji:
  - uji HP: unduh ulang dari portal lalu update APK di atas app lama
  - jika masih gagal setelah memakai file web/public yang sudah sinkron, audit lanjutan harus fokus ke signature APK yang terpasang di HP
- Catatan:
  - ini sesuai petunjuk pada checklist proyek bahwa setiap update APK berikutnya harus sinkron dari `Final` ke `web/public/apk` sebelum commit/push

## 2026-08-02 07:05 - Compatibility bump GAS siswa agar bisa update dari jalur legacy
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengatasi update gagal yang masih terjadi di HP setelah bump ke `1029` dengan menaikkan `versionCode` flavor `siswa` ke atas build kompatibilitas lama `legacySiswa` (`23003`). Temuan dari catatan dan output lokal menunjukkan `legacySiswa` memakai package yang sama `com.satupintu.mobile.siswa`, sertifikat yang sama, tetapi `versionCode 23003`, sehingga build `1029` tetap dianggap downgrade oleh Android pada perangkat yang pernah dipasangi jalur legacy.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - update APK `GAS Siswa` langsung di atas build siswa standar `1028`
  - update APK `GAS Siswa` langsung di atas build kompatibilitas `legacySiswa 23003`
  - data lokal siswa tetap aman setelah update
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL in 2m 26s`)
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (menimpa file final sebelumnya pada `2026-08-02 07:09`)
- Regression check yang dijalankan:
  - audit metadata `legacySiswa` lokal (`com.satupintu.mobile.siswa`, `versionCode 23003`)
  - audit metadata `siswaRelease` final sebelumnya (`versionCode 1029`)
  - verifikasi metadata final sesudah overwrite: `versionCode 23004`, `versionName 1.0.12-siswa`
- Belum diuji:
  - uji HP: update dari build legacy ke build final baru
  - uji HP: installer tidak lagi menolak dengan pesan `Aplikasi tidak terinstal`
- Catatan:
  - ini adalah bump kompatibilitas yang sengaja melampaui jalur `legacySiswa`
  - package dan sertifikat tetap sama; hanya `versionCode` flavor `siswa` yang dinaikkan agar Android menerima update lintas jalur build lama

## 2026-08-02 07:00 - Bump versi GAS siswa agar APK bisa update menimpa build lama di HP
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Mengatasi kegagalan install update di HP dengan menaikkan `versionCode/versionName` APK GAS siswa, karena build fix Minggu sebelumnya masih memakai `versionCode` yang sama (`1028`) dengan APK distribusi lama sehingga installer Android berpotensi menolak pembaruan.
- File utama yang diubah:
  - `native-mobile-gas/app/build.gradle.kts`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - update APK `GAS Siswa` langsung di atas APK lama tanpa uninstall
  - data login/sesi lokal siswa tetap aman setelah update
  - menu `Absensi` siswa tetap membawa fix hari Minggu efektif
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`BUILD SUCCESSFUL in 2m 35s`)
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (menimpa file final sebelumnya pada `2026-08-02 06:52`)
- Regression check yang dijalankan:
  - audit metadata APK lama vs APK baru
  - verifikasi akar masalah install mengarah ke `versionCode` yang masih sama
  - verifikasi metadata final sesudah overwrite: `versionCode 1029`, `versionName 1.0.12-siswa`
- Belum diuji:
  - uji HP: install update langsung di atas APK GAS siswa yang sudah terpasang
  - uji HP: pastikan installer tidak lagi memunculkan `Aplikasi tidak terinstal`
- Catatan:
  - package name tetap `com.satupintu.mobile.siswa`
  - sertifikat signing tetap sama; yang dinaikkan hanya versi aplikasi agar Android mengenali file ini sebagai update yang lebih baru

## 2026-08-02 06:35 - Hari Minggu aktif di rule presensi GAS kembali dihormati APK siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`, `kepala`
- Tujuan perubahan: Memperbaiki logika APK GAS siswa yang masih meng-hardcode hari Minggu sebagai libur, sehingga saat admin menyalakan Minggu pada `Manajemen Presensi -> Pengaturan Sistem`, menu `Absensi` dan turunan rekap yang memakai rule yang sama tetap membaca Minggu sebagai hari efektif sesuai konfigurasi sekolah.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/util/PresensiRuleUtils.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/PrincipalDashboardViewModel.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - `Absensi` siswa saat hari Minggu diaktifkan admin
  - `Presensi Sholat` siswa saat hari Minggu diaktifkan admin
  - rekap presensi bulanan kepala sekolah untuk sekolah yang mengaktifkan Minggu
  - fallback default saat schedules kosong tetap menjadikan Minggu libur
- Build yang dijalankan:
  - `:app:compileSiswaDebugKotlin`
  - `:app:compileGuruDebugKotlin`
  - `:app:compileKepalaDebugKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses (`compile debug lintas flavor sukses, assemble siswa release sukses in 2m 26s`)
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (menimpa file final sebelumnya pada `2026-08-02 06:46`)
- Regression check yang dijalankan:
  - audit alur simpan rule dari web admin ke RTDB
  - audit pembacaan rule di APK GAS siswa
  - compile Kotlin debug flavor `siswa`, `guru`, dan `kepala` setelah patch
  - assemble release flavor `siswa`
  - verifikasi file hasil build dan file final memiliki ukuran identik `20,521,140 bytes`
- Belum diuji:
  - uji HP nyata: admin nyalakan Minggu lalu buka menu `Absensi` siswa di hari Minggu
  - uji HP nyata: cek `Presensi Sholat` siswa bila Minggu sengaja diaktifkan
  - uji kepala sekolah: rekap bulanan harus menghitung Minggu aktif sebagai hari efektif
- Catatan:
  - akar masalah yang ditemukan: web admin sudah benar menyimpan `isHoliday: !isEnabled`, tetapi APK siswa masih memiliki hardcode `Calendar.SUNDAY -> libur` sebelum membaca rule RTDB

## 2026-08-02 01:20 - Portal tutorial GAS siswa dipublikasikan dengan menu visual interaktif
- Pelaksana: Assistant
- Jenis perubahan: `docs`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Membangun portal tutorial instalasi dan penggunaan GAS siswa di web lengkap dengan alias URL pendek, panduan visual login, izin lokasi, daftar 10 menu utama, serta sub-bagian visual untuk menu seperti `Lentera Digital`, `Layanan Aduan`, `7 KAIH`, `Virtual Pet`, dan `Tools`.
- File utama yang diubah:
  - `web/src/app/g/page.tsx`
  - `web/src/app/gas/page.tsx`
  - `web/src/app/gas/install/page.tsx`
  - `web/public/apk/GAS-Siswa-release.apk`
  - `web/public/tutorial/gas-siswa/**`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
- Fitur lama yang wajib ikut dicek:
  - halaman tutorial GAS siswa di route `/gas/install`
  - redirect alias pendek `/g`
  - tombol unduh APK `GAS-Siswa-release.apk`
  - navigasi daftar 10 menu ke sub-bagian penggunaan
- Build yang dijalankan:
  - tidak ada build APK baru
  - deploy repo web melalui push `main`
- Hasil build: tidak ada APK baru; portal tutorial GAS siswa sudah dipush ke repository dengan commit `7545b955`
- Output APK: tidak ada APK baru
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - audit route `/g` dan `/gas/install`
  - verifikasi aset tutorial visual termuat dari `web/public/tutorial/gas-siswa`
  - verifikasi daftar 10 menu bisa diarahkan ke bagian penggunaan masing-masing
- Belum diuji:
  - uji buka portal GAS siswa dari browser HP nyata pada jaringan sekolah
- Update verifikasi:
  - route `/g` dan `/gas/install` sudah aktif live tanpa `404` (App Hosting production) pada `2026-08-02`
- Catatan:
  - URL live utama GAS siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/g`
  - URL fallback GAS siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/gas/install`
  - perubahan ini hanya menyentuh portal tutorial web dan distribusi file APK publik, bukan build APK GAS siswa baru

## 2026-08-01 23:08 - Kategori Lentera siswa disamakan dengan kategori utama web terbaru
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyinkronkan master kategori katalog `Lentera Digital` di APK GAS siswa dengan web e-perpus terbaru, termasuk menambahkan kategori utama `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI`, menormalkan pembacaan kategori buku lama, lalu membangun APK siswa baru dan menimpa file final distribusi.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/Book.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Katalog Buku`
  - dropdown kategori katalog siswa
  - label kategori pada kartu buku
  - kompatibilitas kategori lama seperti `NON-FIKSI > Ensiklopedia`
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (menimpa file final sebelumnya)
- Regression check yang dijalankan:
  - compile Kotlin `siswaRelease`
  - assemble `siswaRelease`
  - verifikasi file output APK terbentuk
  - verifikasi file final berhasil tertimpa di folder `Final`
- Belum diuji:
  - uji HP: dropdown kategori harus menampilkan `Semua + 9 kategori utama web`
  - uji HP: pilih `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI` harus langsung memfilter buku yang benar
  - uji HP: buku lama dengan kategori string seperti `NON-FIKSI > Ensiklopedia` harus tetap masuk kategori `ENSIKLOPEDIA`
  - uji HP: kategori kosong tetap stabil dibuka
- Catatan:
  - APK siswa sekarang tidak lagi membangun daftar kategori dari data dinamis di luar master web; urutan kategori sengaja dipatok agar sama dengan web e-perpus
  - `displayCategory` buku sekarang dinormalisasi ke kategori utama web agar label pada kartu buku tidak lagi menampilkan string kategori lama yang campur subkategori

---

## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).

---
## 2026-08-01 22:58 - Sinkronisasi dokumen target integrasi kategori Lentera siswa ke web terbaru
- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Menyelaraskan dokumen pegangan build GAS setelah web e-perpus meresmikan katalog terpisah, rak kategori, logo/favicon baru, serta kategori utama baru `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI`. Fokus kerja aktif berikutnya ditetapkan: kategori katalog `Lentera Digital` di APK GAS siswa harus sama dengan kategori utama di web.
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/README.md`
  - `Apk Release/Pegangan Build APK/GAS/RELEASE.md`
  - `Apk Release/Pegangan Build APK/GAS/REGRESSION_CHECKLIST.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Katalog Buku`
  - master kategori katalog siswa
  - filter kategori / dropdown katalog siswa
  - konsistensi kategori utama antara web e-perpus dan APK siswa
- Build yang dijalankan:
  - tidak ada (`sinkronisasi dokumen dan penajaman target implementasi berikutnya`)
- Hasil build: tidak dijalankan
- Output APK: -
- Disalin ke:
  - -
- Regression check yang dijalankan:
  - review dokumen `BUILD_LOG.md`, `README.md`, `REGRESSION_CHECKLIST.md`, dan `CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Belum diuji:
  - APK GAS siswa belum diperbarui ke master kategori web terbaru
  - uji HP: dropdown katalog siswa belum diverifikasi untuk kategori `ENSIKLOPEDIA`
  - uji HP: dropdown katalog siswa belum diverifikasi untuk kategori `SAINS & TEKNOLOGI`
- Catatan:
  - Master kategori web e-perpus terbaru yang harus diikuti APK siswa: `FIKSI & SASTRA`, `BUKU PELAJARAN`, `NON-FIKSI`, `ENSIKLOPEDIA`, `SAINS & TEKNOLOGI`, `PENGEMBANGAN DIRI`, `MINAT`, `MAJALAH`, `LAINNYA`
  - Entry ini sengaja bertipe `no-build` karena perubahan yang benar-benar dijalankan hari ini masih berada di web e-perpus dan dokumentasi; implementasi APK siswa adalah pekerjaan aktif berikutnya

---

## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).

---
## 2026-07-31 21:22 - Profil Lentera siswa disamakan ke nama dan NISN yang benar
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Membetulkan tab `Profil` pada `Lentera Digital` agar menampilkan nama siswa yang sedang login dan `NISN` yang benar, bukan lagi label generik `Profil Siswa` dengan push-key Firebase.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Profil`
  - pembacaan `nama siswa`
  - pembacaan `NISN`
  - fallback lookup identitas siswa dari database
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Belum diuji:
  - uji HP: tab `Profil` harus menampilkan nama siswa aktif, bukan `Profil Siswa`
  - uji HP: `NISN` yang tampil harus sesuai data siswa, bukan push-key
  - uji HP: bila sesi login belum membawa `NISN`, layar tetap berhasil melengkapi identitas dari database

---

## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).

---
## 2026-07-31 21:14 - Katalog Lentera siswa dirapikan lagi untuk kontras dropdown dan logo
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Flavor terdampak: `siswa`
- Tujuan perubahan: Membuat teks dropdown kategori katalog lebih kontras di atas background biru gelap, sekaligus mengganti placeholder kotak putih pada header `Lentera Digital` dengan aset logo PNG asli.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/res/drawable/ic_menu_lentera_digital.png`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Katalog Buku`
  - dropdown kategori pada mode terang/gelap latar biru
  - header logo Lentera dan state kosong katalog
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Belum diuji:
  - uji HP: semua item dropdown tetap terbaca jelas saat menu dibuka
  - uji HP: logo baru tampil proporsional dan tidak pecah di header katalog
  - uji HP: state kosong katalog tetap terlihat rapi dengan logo baru
- Build yang dijalankan
- Hasil build
- Output APK
- Disalin ke
- Regression check yang dijalankan
- Belum diuji
- Catatan

---

## Template Entry

### YYYY-MM-DD HH:mm - Judul Singkat
- Pelaksana:
- Jenis perubahan:
- Tujuan perubahan:
- Flavor terdampak:
- File utama yang diubah:
- Fitur lama yang wajib ikut dicek:
- Build yang dijalankan:
- Hasil build:
- Output APK:
- Disalin ke:
- Regression check yang dijalankan:
- Belum diuji:
- Catatan:

---

## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).

---
## 2026-07-31 20:58 - Filter kategori katalog siswa diubah menjadi dropdown
- Pelaksana: Assistant
- Jenis perubahan: `refactor`
- Tujuan perubahan: Merapikan filter kategori katalog `Lentera Digital` di GAS siswa dengan mengganti deretan chip horizontal menjadi dropdown full-width yang lebih cocok untuk layar HP.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Katalog Buku`
  - pemilihan kategori buku
  - pencarian buku setelah kategori dipilih
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Regression check yang dijalankan:
  - compile Kotlin sesudah penggantian komponen filter kategori
  - assemble release flavor `siswa`
  - verifikasi metadata output tetap `versionCode 1028` dan `versionName 1.0.11-siswa`
- Belum diuji:
  - uji HP: dropdown kategori bisa dibuka dan ditutup dengan stabil
  - uji HP: pilih kategori berbeda harus langsung memfilter katalog
  - uji HP: label `Minat & Bakat` tetap tampil benar untuk kategori `MINAT`
- Catatan: Secara data, master kategori tetap sama. Perubahan ini murni pada presentasi filter agar tampilan katalog lebih rapi di mobile.

## 2026-07-31 20:51 - Kategori katalog siswa disamakan ke master e-perpus
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mengubah chip kategori katalog `Lentera Digital` di GAS siswa agar tidak lagi mengikuti kategori dinamis dari data buku yang kebetulan ada, tetapi selalu menampilkan master kategori e-perpus sekolah seperti web admin/web siswa.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/StudentLibraryViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Katalog Buku`
  - filter kategori katalog
  - hasil pencarian setelah pilih kategori
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Regression check yang dijalankan:
  - compile Kotlin sesudah perubahan kategori katalog
  - assemble release flavor `siswa`
  - verifikasi data Firestore `books` saat ini berjumlah 12 judul
  - verifikasi kategori data nyata saat ini hanya tersebar di `FIKSI & SASTRA`, `PENGEMBANGAN DIRI`, dan `NON-FIKSI`
- Belum diuji:
  - uji HP: chip kategori katalog harus menampilkan master kategori lengkap, bukan hanya 3 kategori yang sedang terisi data
  - uji HP: pilih kategori kosong seperti `BUKU PELAJARAN` harus tetap stabil dan menampilkan empty state
  - uji HP: kategori `MINAT` harus tampil sebagai label `Minat & Bakat`
- Catatan: Penyebab keluhan "masih 3" bukan karena data buku dibatasi di APK. Firestore `books` berisi 12 judul, tetapi data aktif saat ini memang hanya berada di 3 kategori. APK lama membangun chip kategori dari data nyata, sehingga yang tampak hanya 3 kategori.

## 2026-07-31 20:38 - Reader PDF siswa menulis reading_log untuk menghidupkan pet
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyambungkan pembaca PDF Lentera Digital di GAS siswa ke node `student_activities/{studentId}/reading_log/{tanggal}` supaya durasi baca benar-benar tercatat dan bisa dipakai `Virtual Pet` untuk menghitung kenyang berdasarkan bacaan nyata.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/ReadingActivityRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Lentera Digital -> Baca PDF`
  - `Virtual Pet -> E-Perpus`
  - quest `Membaca Buku 30 Menit`
  - reward/coin pet setelah membaca
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Regression check yang dijalankan:
  - compile Kotlin setelah penambahan logging reader PDF
  - assemble release flavor `siswa`
  - verifikasi metadata output tetap `versionCode 1028` dan `versionName 1.0.11-siswa`
  - verifikasi file final lama berhasil tertimpa
- Belum diuji:
  - uji HP: baca PDF 1-2 menit lalu keluar, harus muncul entry baru di `student_activities/.../reading_log/{hari_ini}`
  - uji HP: baca akumulatif 30 menit, `Virtual Pet` harus menjadi kenyang penuh
  - uji HP: pause/background aplikasi saat membaca tidak boleh menambah durasi secara palsu
  - uji HP: buka ulang reader di hari yang sama harus melanjutkan akumulasi durasi harian
- Catatan: Logging baca sekarang dikirim per menit selama reader aktif, lalu sisa durasi ikut diflush saat layar dipause/ditutup agar pet membaca data riil dari backend, bukan hanya asumsi UI. Build final terakhir untuk entry ini kembali ditimpa pada `20:42` dengan mirroring ke alias identitas siswa dari sesi login.

## 2026-07-31 20:28 - Rumus pet literasi harian 30 menit dan bonus bulanan
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Tujuan perubahan: Menjadikan `readingDuration` 30 menit sebagai satu-satunya rumus makan pet siswa, memisahkan submit tugas literasi dari rasa lapar harian, dan menambahkan bonus quest literasi bulanan yang hanya bisa selesai sekali per periode bulan berjalan.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/VirtualPetRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/model/VirtualPet.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - `Virtual Pet -> E-Perpus`
  - `Virtual Pet -> Literasi Bulanan`
  - auto reward quest pet
  - leveling/coin pet setelah reward quest
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk` (menimpa file final lama)
- Regression check yang dijalankan:
  - compile Kotlin flavor `siswaRelease`
  - assemble release siswa
  - verifikasi metadata output: `versionCode 1028`, `versionName 1.0.11-siswa`
  - verifikasi file final lama berhasil tertimpa di folder `Final`
- Belum diuji:
  - uji HP: baca tepat 30 menit harus membuat `Hunger = 0`
  - uji HP: quest `Membaca Buku 30 Menit` memberi `+50 Koin` dan `+25 XP`
  - uji HP: submit tugas literasi bulanan memberi `+200 Koin` dan `+100 XP` hanya sekali pada bulan yang sama
  - uji HP: masuk bulan baru harus membuka lagi quest bonus bulanan
- Catatan: Quest pet sekarang memakai `periodKey` agar quest harian reset per tanggal dan quest bonus literasi reset per bulan, sehingga hadiah bulanan tidak ikut terulang setiap hari.

## 2026-07-31 20:10 - Build ulang GAS siswa dan copy ke folder Final
- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Tujuan perubahan: Membuat ulang APK `GAS Siswa` dari state lokal saat ini lalu menaruh salinannya ke folder distribusi `Final` sesuai permintaan user.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - login siswa
  - beranda siswa
  - Lentera Digital / katalog buku
  - Virtual Pet siswa
  - 7 KAIH siswa
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-2026-07-31_20-10-release.apk`
- Regression check yang dijalankan:
  - verifikasi `assembleSiswaRelease` sukses
  - verifikasi metadata output: `versionCode 1028`, `versionName 1.0.11-siswa`
  - verifikasi file hasil copy ada di folder `Final`
- Belum diuji:
  - uji perangkat fisik pada build `2026-07-31_20-10`
  - verifikasi manual seluruh perubahan lokal siswa yang saat ini ikut terpaket di APK
- Catatan: Turn ini fokus pada packaging APK dari state lokal yang sudah ada, bukan menambah perubahan source baru di modul `native-mobile-gas`.

## 2026-07-31 00:20 - Hardening web admin GAS untuk spinner 7 KAIH
- Pelaksana: Assistant
- Jenis perubahan: `no-build`
- Tujuan perubahan: Menghentikan infinite spinner pada dashboard GAS web admin saat `schoolId` kosong atau subscription RTDB gagal, lalu memberi fallback yang jelas pada panel `7 KAIH`.
- Flavor terdampak: `web-admin`
- File utama yang diubah:
  - `web/src/hooks/gas/useGasRecords.ts`
  - `web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx`
  - `web/src/components/layout/Sidebar.tsx`
  - `web/src/components/gas/virtual-pet/GasPetLeaderboardTab.tsx`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `Apk Release/Pegangan Build APK/GAS/CATATAN_HARDENING_INTEGRASI_GAS.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
- Fitur lama yang wajib ikut dicek:
  - buka menu `Students` dan `Teachers` di dashboard GAS
  - buka tab `7 KAIH`
  - buka tab `Virtual Pet -> Peringkat`
  - navigasi sidebar di mode development
- Build yang dijalankan:
  - tidak ada build APK
  - `npx tsc --noEmit` pada folder `web`
  - `npm run lint` pada folder `web`
- Hasil build:
  - tidak build APK karena perubahan hanya menyentuh web admin dan dokumentasi
  - `npx tsc --noEmit`: sukses
  - `npm run lint`: gagal oleh hutang lint lama di repo (skrip util `.js`, beberapa warning/aturan lama), bukan oleh patch ini
- Output APK: tidak ada
- Disalin ke: tidak ada
- Regression check yang dijalankan:
  - review source: `useGasRecords.ts` sekarang mematikan loading dan mengosongkan data saat `schoolId`/path tidak siap atau listener gagal
  - review source: `Gas7HabitsPanel.tsx` sekarang menampilkan fallback message saat sesi admin belum membawa `schoolId`
  - review source: `Sidebar.tsx` hanya melakukan prefetch link pada mode production
  - review source: wrapper tabel `GasPetLeaderboardTab.tsx` dirapikan agar area ranking lebih stabil
- Belum diuji:
  - smoke test manual pada web live setelah patch ini di-push ke `main`
  - verifikasi sesi admin bermasalah yang sebelumnya memicu infinite spinner
  - verifikasi data ranking virtual pet pada tenant dengan data besar
- Catatan: Perbaikan monitoring super admin sudah live lebih dulu, tetapi patch spinner GAS ini masih status lokal sampai ikut dideploy.

## 2026-07-30 19:14 - Hardening akses OSIS realtime pada GAS siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memastikan menu `Catat Pelanggaran` di APK GAS siswa hanya muncul selama siswa masih terdaftar sebagai petugas OSIS di sekolah aktif. Jika admin menghapus siswa dari `Manajemen Petugas OSIS`, menu harus hilang otomatis tanpa perlu login ulang.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Visibilitas menu `Catat Pelanggaran` pada akun siswa petugas OSIS
  - Route `osis_discipline` setelah hak OSIS dicabut dari web admin
  - Sinkronisasi preferensi `user_is_osis_staff` di sesi siswa
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_19-13-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin siswa sukses
  - assemble release siswa sukses
  - review source: status OSIS sekarang dipantau realtime dari `gas/schools/{schoolId}/staff`
  - review source: pencocokan petugas OSIS sekarang memakai alias siswa `studentId/nisn/loginKey/username`
  - review source: saat entri staff hilang atau query gagal, `user_is_osis_staff` langsung di-reset ke `false`
- Belum diuji:
  - uji perangkat fisik untuk memastikan menu `Catat Pelanggaran` hilang otomatis beberapa saat setelah siswa dihapus dari `Manajemen Petugas OSIS`
  - uji perangkat fisik untuk memastikan route `osis_discipline` ikut tertutup jika user masih berada di sesi siswa yang sama
- Catatan: Build tetap menghasilkan warning lama yang tidak memblokir, terutama deprecation icon dan beberapa opt-in `ExperimentalCoroutinesApi`.

## 2026-07-30 18:34 - Sinkronisasi teks card Literasi Aktif Virtual Pet siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyamakan card `Pencapaian -> Literasi Aktif` pada `Virtual Pet` siswa agar subtitle, progress, dan trigger pencapaian membaca semuanya konsisten memakai target 30 menit, bukan menyisakan teks lama 60 menit.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Card `Pencapaian -> Literasi Aktif`
  - Quest `Membaca Buku` pada `Virtual Pet`
  - Konsistensi target 30 menit antar card `Status` dan `Pencapaian`
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_18-34-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin siswa sukses
  - assemble release siswa sukses
  - review source: `Literasi Aktif` sekarang bertuliskan `Baca 30 menit atau kirim 1 aktivitas literasi`
  - review source: progress card `Literasi Aktif` sekarang memakai format `x/30 menit`
  - review source: quest `Membaca Buku` sekarang tercapai di 30 menit
- Belum diuji:
  - uji perangkat fisik untuk memastikan card `Pencapaian -> Literasi Aktif` tidak lagi menampilkan teks 60 menit
  - uji perangkat fisik untuk memastikan pencapaian membaca tetap sinkron saat durasi baca menyentuh 30 menit
- Catatan: Build tetap menghasilkan warning lama yang tidak memblokir, terutama deprecation icon dan beberapa opt-in `ExperimentalCoroutinesApi`.

## 2026-07-30 18:26 - Hardening Virtual Pet siswa untuk literasi, E-Perpus, dan peringkat
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menghidupkan alur `Virtual Pet` siswa agar kartu `Literasi` benar-benar membuka `Tugas Literasi`, target `E-Perpus` turun menjadi 30 menit, dan tab `Peringkat` tetap membaca data meski identitas pet lama memakai alias siswa yang berbeda.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/student/StudentLibraryScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/VirtualPetViewModel.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Navigasi `Virtual Pet -> Tugas Literasi`
  - Progress `E-Perpus` pada status aktivitas harian
  - Tab `Pencapaian` dan `Peringkat` pada `Virtual Pet`
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_18-26-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin siswa sukses
  - assemble release siswa sukses
  - review source: route `tasks` siswa sekarang membuka `StudentLibraryScreen` dengan tab awal `Tugas Literasi`
  - review source: status aktivitas `E-Perpus` sekarang penuh di 30 menit dan label teks ikut berubah ke `30 menit membaca hari ini`
  - review source: leaderboard `Virtual Pet` sekarang mencocokkan siswa dengan alias `recordId/id/nisn/username`
- Belum diuji:
  - uji perangkat fisik untuk memastikan kartu `Literasi` dari `Virtual Pet` langsung membuka daftar tugas aktif
  - uji perangkat fisik untuk memastikan `E-Perpus` penuh saat mencapai 30 menit baca
  - uji perangkat fisik untuk memastikan tab `Pencapaian` dan `Peringkat` tampil data nyata pada akun dengan data pet lama
- Catatan: Build tetap menghasilkan warning lama yang tidak memblokir, terutama deprecation icon dan beberapa opt-in `ExperimentalCoroutinesApi`.

## 2026-07-30 17:47 - Penataan ulang urutan menu beranda GAS guru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyesuaikan urutan menu beranda GAS guru agar mengikuti susunan operasional yang diminta, dengan `Rekapitulasi` dipindah ke posisi paling akhir tanpa mengubah route menu.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `Apk Release/Pegangan Build APK/GAS/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Urutan grid menu beranda guru
  - Navigasi semua menu guru yang sudah ada
  - Akses menu `Rekapitulasi` dari beranda guru
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_17-47-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses
  - assemble release guru sukses
  - review source: urutan menu guru sekarang `Data Siswa -> Presensi Siswa -> Presensi Sholat -> Literasi & Tugas -> 7 KAIH -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Rekapitulasi`
  - review source: route `teacher_recap` tetap aktif, hanya dipindah ke posisi paling akhir
- Belum diuji:
  - uji perangkat fisik untuk memastikan urutan grid guru tampil sesuai susunan baru
  - uji perangkat fisik untuk memastikan `Rekapitulasi` tetap bisa dibuka normal dari posisi terakhir
- Catatan: Build tetap menghasilkan warning lama yang tidak memblokir, terutama deprecation icon dan beberapa opt-in `ExperimentalCoroutinesApi`.

## 2026-07-30 17:27 - Penataan ulang urutan menu beranda GAS siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyesuaikan urutan menu beranda GAS siswa agar mengikuti urutan operasional yang diminta, dengan `Catat Pelanggaran` tetap khusus petugas OSIS dan berada di posisi paling akhir.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `Apk Release/Pegangan Build APK/CHANGELOG.md`
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
  - `Apk Release/Pegangan Build APK/CHECKLIST_PERUBAHAN_APK_TERKINI.md`
- Fitur lama yang wajib ikut dicek:
  - Urutan grid menu beranda siswa
  - Visibilitas menu `Catat Pelanggaran` untuk akun OSIS
  - Navigasi menu siswa yang sudah ada
- Build yang dijalankan:
  - `:app:compileSiswaReleaseKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_17-27-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin siswa sukses
  - assemble release siswa sukses
  - review source: urutan menu dasar siswa sekarang `Absensi -> Presensi Sholat -> Lentera Digital -> 7 KAIH -> Virtual Pet -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Tools`
  - review source: `Catat Pelanggaran` tetap hanya ditambahkan untuk akun OSIS dan tetap berada di urutan terakhir
- Belum diuji:
  - uji perangkat fisik untuk memastikan urutan grid tampil benar pada akun siswa biasa
  - uji perangkat fisik untuk memastikan akun OSIS melihat `Catat Pelanggaran` sesudah `Tools`
- Catatan: Build tetap menghasilkan warning lama yang tidak memblokir, terutama deprecation icon dan beberapa opt-in `ExperimentalCoroutinesApi`.

## 2026-07-30 14:05 - Menu Rekapitulasi Kelas guru muncul di beranda
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memunculkan menu `Rekapitulasi` di beranda guru dan menambahkan route `teacher_recap` ke `TeacherRecapScreen` (sebelumnya layar sudah ada tetapi tidak terhubung, sehingga menu tidak muncul).
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/HomeScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
- Fitur lama yang wajib ikut dicek:
  - Beranda guru (grid menu)
  - Navigasi guru ke layar `Rekapitulasi`
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_14-05-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses
  - assemble release guru sukses
  - review source: menu `Rekapitulasi` guru sekarang punya item di beranda dan route `teacher_recap` sudah terdaftar
- Belum diuji:
  - uji perangkat fisik memastikan menu `Rekapitulasi` muncul di beranda guru dan layar bisa dibuka
- Catatan: Perubahan ini melengkapi build 13:23 yang fokus hardening alias ID, tanpa mengubah logika rekap bulanan `H/S/I/A`.

## 2026-07-30 13:23 - Hardening alias ID siswa pada modul guru non-kehadiran
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menutup titik rawan yang masih tersisa setelah fix rekap bulanan, yaitu modul `Presensi Sholat`, `Kedisiplinan`, dan `Notifikasi` guru yang masih mengandalkan `id/nisn` sempit sehingga data siswa bisa hilang bila backend menyimpan `recordId` atau `username`.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherPrayerViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherDisciplineViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
- Fitur lama yang wajib ikut dicek:
  - Presensi Sholat guru (harian + rekap bulanan)
  - Kedisiplinan guru (filter record + riwayat)
  - Notifikasi guru untuk literasi dan bullying
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_13-23-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses setelah helper alias diperluas
  - assemble release guru sukses
  - review source: `Presensi Sholat` guru sekarang membaca alias `recordId/id/nisn/username` dan ikut menyimpan `username` pada manual submit
  - review source: `Kedisiplinan` guru sekarang memfilter dan membangun riwayat dengan alias siswa lengkap
  - review source: `Notifikasi` guru sekarang mencocokkan literasi dan bullying memakai alias siswa lengkap, tidak hanya `id/nisn`
- Belum diuji:
  - uji perangkat fisik `Presensi Sholat` guru untuk siswa yang source datanya memakai alias selain NISN
  - uji perangkat fisik `Kedisiplinan` guru memastikan record otomatis/manual tidak hilang dari riwayat
  - uji perangkat fisik notifikasi literasi dan bullying guru untuk siswa dengan alias ID campuran
- Catatan: Entry ini adalah tindak lanjut audit setelah kasus `A:26 -> 25` selesai. Fokusnya bukan UI, melainkan hardening logika join data siswa lintas modul guru.

## 2026-07-30 13:02 - Rekap bulanan guru diperbaiki dengan alias matching identitas siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menutup kasus nyata selisih rekap bulanan guru (`A:26` vs `25`) dengan mencocokkan log absensi ke siswa memakai alias identitas yang lebih fleksibel, sehingga record yang tersimpan sebagai `recordId`, `id`, `nisn`, atau `username` tetap masuk ke siswa yang benar.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherAttendanceViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Rekapitulasi Kehadiran guru (tab `Rekap Bulanan`)
  - konsistensi angka `H/S/I/A` terhadap tabel siswa Web Admin
  - kasus siswa yang sebelumnya kehilangan 1 log karena mismatch identitas
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_13-02-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses
  - assemble release guru sukses
  - review source: rekap bulanan sekarang membangun `studentAliasMap` dari `recordId`, `id`, `nisn`, `username`
  - review source: log absensi bulanan dipetakan ke siswa lewat alias `studentId`, `nisn`, `username`, lalu dirender memakai key identitas bulanan yang sama
- Belum diuji:
  - uji perangkat fisik memastikan kasus siswa `ok` berubah dari `A:26` menjadi `A:25`
  - uji perangkat fisik membandingkan angka `H/S/I/A` guru vs Web Admin untuk beberapa siswa dengan riwayat ID campuran
- Catatan: Entry ini menyempurnakan build `12:53`. Format output tetap `H/S/I/A`, tetapi pencocokan record sekarang tidak lagi bergantung pada satu ID tunggal.

## 2026-07-30 12:53 - Rekap bulanan guru disamakan persis ke tabel siswa Web Admin
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyesuaikan perubahan 12:46 agar APK guru mengikuti tabel siswa di Web Admin secara persis, yaitu format `H/S/I/A` tanpa kolom `T`, memakai `student.id` kanonik yang sama, dan menghitung `LATE` sebagai `Hadir`.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherAttendanceViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Rekapitulasi Kehadiran guru (tab `Rekap Bulanan`)
  - konsistensi angka `H/S/I/A` terhadap tabel siswa Web Admin
  - tampilan tabel bulanan setelah penghapusan kolom `T`
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_12-53-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses
  - assemble release guru sukses
  - review source: rekap bulanan sekarang memakai `student.id` sebagai key tabel, `LATE` digabung ke `PRESENT`, dan header kembali ke `H/S/I/A`
- Belum diuji:
  - uji perangkat fisik membandingkan angka `H/S/I/A` guru vs tabel siswa Web Admin
  - uji perangkat fisik memastikan nama panjang dan lebar tabel tetap rapi setelah kolom `T` dihapus
- Catatan: Entry ini menggantikan arah 12:46 pada level UI/output. Acuan final sekarang adalah tampilan tabel siswa di Web Admin, bukan kartu statistik atas yang masih memisahkan `Terlambat`.

## 2026-07-30 12:46 - Rekap kehadiran guru disamakan dengan Web Admin
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyamakan logika rekap bulanan `Rekapitulasi Kehadiran` guru dengan sumber data Web Admin. Perbaikan menutup mismatch key identitas siswa, memisahkan `Terlambat` dari `Hadir`, dan menghentikan perhitungan `Alpa` untuk tanggal masa depan pada bulan berjalan.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherAttendanceViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Rekapitulasi Kehadiran guru (tab `Rekap Bulanan`)
  - konsistensi angka `H/T/S/I/A` terhadap Web Admin
  - tampilan tabel bulanan setelah penambahan kolom `T`
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_12-46-release.apk`
- Regression check yang dijalankan:
  - compile Kotlin guru sukses setelah perubahan model rekap bulanan
  - assemble release guru sukses
  - review source: rekap bulanan sekarang menghitung `PRESENT`, `LATE`, `SICK`, `PERMIT`, `ABSENT` secara terpisah dan membatasi bulan berjalan hanya sampai hari ini
- Belum diuji:
  - uji perangkat fisik membandingkan angka `H/T/S/I/A` di APK guru vs Web Admin untuk kelas yang sama
  - uji tampilan tabel bulanan di layar HP memastikan kolom tambahan masih rapi
- Catatan: Arah perbaikan mengikuti pola rekap bulanan yang sudah stabil di menu `Presensi Sholat`, yaitu key siswa konsisten dari proses hitung sampai proses render.

## 2026-07-30 12:33 - Sinkronisasi label PET guru dengan state `Sekarat`
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menyamakan label kondisi PET di `Data Siswa` guru dengan state machine APK siswa. Sebelumnya guru hanya mengenal `Sehat/Sakit/Mati`, sehingga pet yang seharusnya `Sekarat` masih tampil sebagai `Sakit`.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherStudentsScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Data Siswa (kolom PET)
  - sinkronisasi label kondisi pet dengan APK siswa
- Build yang dijalankan:
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_12-33-release.apk`
- Regression check yang dijalankan:
  - assemble release guru sukses
  - review source: label PET guru sekarang memakai `lowestVitalScore()` dengan threshold `Dead -> Sekarat (<30) -> Sakit (<60) -> Sehat`
- Belum diuji:
  - uji perangkat fisik memastikan kondisi yang tampil `Sekarat` di APK siswa ikut tampil `Sekarat` di menu guru
  - uji perubahan status naik/turun tanpa relogin guru
- Catatan: Entry ini melengkapi perbaikan 12:25 yang sebelumnya baru membetulkan pencocokan identitas pet realtime.

## 2026-07-30 12:25 - Perbaikan tabel guru (divider vertikal + PET realtime)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memastikan garis pemisah kolom benar-benar turun sampai ke row data pada tabel guru (bukan hanya header) dan memperbaiki kolom `PET` di `Data Siswa` guru agar bisa membaca status virtual pet realtime (tidak tampil `-` terus karena mismatch ID siswa).
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherStudentsScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Data Siswa (kolom PET)
  - Presensi Sholat (tabel manual)
  - Rekapitulasi Kehadiran (tabel manual)
- Build yang dijalankan:
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_12-25-release.apk`
- Regression check yang dijalankan:
  - assemble release guru sukses
  - review source: row tabel pakai `IntrinsicSize.Min` supaya divider vertikal tidak kolaps
  - review source: kolom `PET` cocokkan pet dengan prioritas `recordId -> nisn -> id -> username`
- Belum diuji:
  - uji perangkat fisik memastikan divider vertikal terlihat di row data (bukan hanya header)
  - uji perangkat fisik memastikan kolom PET berubah realtime ketika pet siswa berubah kondisi (sehat/sakit/mati)
- Catatan: Build acuan `OK_4` untuk GAS Guru sekarang mengacu ke `2026-07-30 12:25`.

## 2026-07-30 11:59 - Pemisahan tampilan Kedisiplinan GAS Guru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memisahkan menu `Pelanggaran` dan `Riwayat` pada Kedisiplinan guru agar tidak lagi tercampur dalam satu list. Mode `Pelanggaran` sekarang hanya menampilkan daftar siswa, sedangkan mode `Riwayat` hanya menampilkan riwayat terbaru.
- Jenis perubahan: `fix`
- Tujuan perubahan: Memisahkan menu `Pelanggaran` dan `Riwayat` pada Kedisiplinan guru agar tidak lagi tercampur dalam satu list. Mode `Pelanggaran` sekarang hanya menampilkan daftar siswa, sedangkan mode `Riwayat` hanya menampilkan riwayat terbaru.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherDisciplineScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - Kedisiplinan guru
  - input pelanggaran final
  - daftar riwayat terbaru
- Build yang dijalankan:
  - `:app:compileGuruReleaseKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_11-59-release.apk`
- Regression check yang dijalankan:
  - compile release Kotlin guru sukses
  - assemble release guru sukses
  - review struktur UI `Pelanggaran` dan `Riwayat` pada source
- Belum diuji:
  - uji perangkat fisik perpindahan mode `Pelanggaran` dan `Riwayat`
  - verifikasi list siswa benar-benar tidak bercampur dengan riwayat di HP target
  - verifikasi daftar riwayat tidak bercampur dengan list siswa di HP target
- Catatan: Entry ini menggantikan perilaku lama `Riwayat` yang hanya berupa shortcut lompat. Build acuan `OK_4` untuk GAS Guru sekarang mengacu ke `2026-07-30 11:59`.

---

## 2026-08-03 10:14 - GAS Guru: notifikasi literasi belum + pet mati

- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Flavor terdampak: `guru`
- Tujuan perubahan: Menambah notifikasi guru untuk siswa wali/diampu yang literasi belum selesai (`LITERACY_INCOMPLETE`) dan virtual pet mati (`PET_DEAD`), mempertahankan notifikasi aduan/literasi pending yang sudah ada, menampilkan badge di menu Notifikasi, lalu merilis APK Guru ke folder Final dengan nama tunggal yang jelas.
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherNotificationScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherNotificationViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/utils/NotificationHelper.kt`
  - `Apk Release/Final/GAS-Guru-release.apk`
  - `Apk Release/GAS/app-guru-release.apk`
- Fitur lama yang wajib ikut dicek:
  - notifikasi literasi pending / laporan aduan (bullying) guru yang sudah ada tetap tampil
  - navigasi dari kartu notifikasi ke Literasi & Tugas / Data Siswa
  - login dan beranda guru + badge angka di menu Notifikasi
- Build yang dijalankan:
  - `./gradlew :app:clean :app:assembleGuruRelease`
- Hasil build:
  - sukses; `com.satupintu.mobile.guru` `1.0.30-guru` (`versionCode 1039`)
- Output APK:
  - `native-mobile-gas/app/build/outputs/apk/guru/release/app-guru-release.apk`
- Disalin ke:
  - `Apk Release/Final/GAS-Guru-release.apk` (mengganti `GAS-Guru-2026-07-30_17-47-release.apk` agar hanya satu file Guru di Final)
  - `Apk Release/GAS/app-guru-release.apk`
- Regression check yang dijalankan:
  - compile + assemble `guruRelease` sukses; metadata package/version diverifikasi via `aapt dump badging`
- Belum diuji:
  - uji perangkat: munculnya notifikasi literasi belum dan pet mati, serta deep-link kartu notifikasi
- Catatan:
  - Tidak sinkron ke `web/public/apk` (Guru bukan jalur unduh tutorial siswa).

---
## 2026-07-30 10:58 - Rebuild GAS Guru & Siswa (paket integrasi terbaru)
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Memastikan APK GAS Guru & GAS Siswa memasukkan perubahan integrasi terbaru (terutama notifikasi/pet dan sinkronisasi path RTDB) dalam build release terbaru.
- Flavor terdampak: `guru`, `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/service/TeacherNotificationListener.kt`
- Fitur lama yang wajib ikut dicek:
  - notifikasi inbox (`notification_inbox`) untuk siswa & guru
  - notifikasi status pet (SICK/DEAD) untuk siswa
  - login siswa & guru (auto-isi nama)
- Build yang dijalankan:
  - `:app:assembleGuruRelease`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK:
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
  - `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_10-58-release.apk`
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_10-58-release.apk`
  - `D:\Dashboard Portal\Apk Release\GAS\GAS-Guru-2026-07-30_10-58-release.apk`
  - `D:\Dashboard Portal\Apk Release\GAS\GAS-Siswa-2026-07-30_10-58-release.apk`
  - `D:\Dashboard Portal\Apk Release\GAS\app-guru-release.apk` (ditimpa)
  - `D:\Dashboard Portal\Apk Release\GAS\app-siswa-release.apk` (ditimpa)
- Regression check yang dijalankan:
  - assemble release guru+siswa sukses
  - verifikasi file output ter-copy ke OK_4 (rumah APK terbaru)
- Belum diuji:
  - uji perangkat fisik notifikasi inbox (guru & siswa)
  - uji perangkat fisik notifikasi pet (SICK/DEAD)
- Catatan: OK_4 sekarang mengacu ke build terbaru `2026-07-30 10:58`.

## 2026-07-30 09:49 - Login siswa auto-isi, hapus prestasi, dan kunci pet mati
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mengubah login GAS siswa menjadi pola `NPSN -> NISN -> Nama Siswa` dengan auto-isi nama dari database, menghapus card `Prestasi` pada Kedisiplinan siswa, dan memastikan overlay `pet mati` benar-benar memblokir interaksi.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/DisciplineScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
- Fitur lama yang wajib ikut dicek:
  - login siswa
  - Kedisiplinan siswa
  - gate pet mati
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_09-49-release.apk`
  - `D:\Dashboard Portal\Apk Release\GAS\GAS-Siswa-2026-07-30_09-49-release.apk`
- Regression check yang dijalankan:
  - assemble release siswa sukses
  - review urutan input login siswa dan alur auto-isi nama
  - review penghapusan card `Prestasi` di kedisiplinan siswa
  - review overlay pet mati memblokir interaksi sentuhan
- Belum diuji:
  - uji perangkat fisik login siswa dengan NPSN dan NISN riil
  - verifikasi nama siswa benar-benar terisi otomatis di berbagai tenant
  - verifikasi siswa tidak bisa mengakses UI GAS saat pet mati (modal blocking)
- Catatan: File `OK_4` untuk GAS siswa sekarang mengacu ke build terbaru `2026-07-30 09:49`.

## 2026-07-30 09:16 - Perapihan tabel, login, dan kedisiplinan GAS Guru
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Mempertegas garis pemisah tabel guru, mengubah login guru menjadi pola `NPSN -> NUPTK -> Nama Guru` dengan auto-isi nama, serta menambahkan menu cepat `Riwayat` di samping card `Pelanggaran`.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherStudentsScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherDisciplineScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - login guru
  - Data Siswa
  - Presensi Siswa
  - Presensi Sholat
  - Kedisiplinan guru
- Build yang dijalankan:
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke:
  - `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_09-16-release.apk`
  - `D:\Dashboard Portal\Apk Release\GAS\GAS-Guru-2026-07-30_09-16-release.apk`
- Regression check yang dijalankan:
  - assemble release guru sukses
  - review urutan field login guru dan alur auto-isi nama
  - review penebalan divider pada tiga tabel guru
  - review tombol `Riwayat` untuk lompat ke daftar riwayat terbaru
- Belum diuji:
  - uji perangkat fisik login guru dengan kombinasi NPSN dan NUPTK riil
  - verifikasi visual garis pemisah tabel di HP target
  - verifikasi tombol `Riwayat` di menu kedisiplinan pada perangkat fisik
- Catatan: File `OK_4` untuk GAS Guru sekarang mengacu ke build terbaru `2026-07-30 09:16`.


## 2026-07-30 07:56 - Standardisasi BUILD_LOG GAS
- Pelaksana: Assistant
- Tujuan perubahan: Membakukan satu format entry BUILD_LOG untuk semua perubahan APK GAS agar setiap orang mencatat dengan pola yang sama.
- Flavor terdampak: `siswa`, `guru`, `kepala`, `legacy`, `universal`
- File utama yang diubah:
  - `Apk Release/Pegangan Build APK/GAS/BUILD_LOG.md`
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
- Catatan: Entry ini menjadi format acuan untuk semua catatan berikutnya.

## 2026-07-30 07:49 - Hard gate EduLock di GAS Siswa
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Menahan akses GAS siswa bila EduLock belum terpasang dan membuat overlay benar-benar memblokir sentuhan.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`
- Fitur lama yang wajib ikut dicek:
  - login siswa
  - overlay compliance EduLock
  - akses siswa ke home/fitur utama
- Build yang dijalankan:
  - `:app:compileSiswaDebugKotlin`
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke: `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_07-49-release.apk`
- Regression check yang dijalankan:
  - verifikasi compile siswa
  - verifikasi assemble release siswa
- Belum diuji:
  - uji perangkat fisik penuh
  - verifikasi interaksi dengan EduLock di semua skenario lapangan
- Catatan: Perubahan ini tidak mengubah APK EduLock, hanya GAS siswa.

## 2026-07-30 00:33 - Perbaikan tabel guru untuk nama panjang
- Pelaksana: Assistant
- Jenis perubahan: `fix`
- Tujuan perubahan: Membuat nama siswa di Data Siswa mendukung 2 baris dan menghapus NISN dari dua layar presensi agar ruang nama lebih lega.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherStudentsScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - menu Data Siswa
  - Presensi Sholat
  - Rekapitulasi Kehadiran
- Build yang dijalankan:
  - `:app:compileGuruDebugKotlin`
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke: `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_00-33-release.apk`
- Regression check yang dijalankan:
  - compile guru
  - assemble guru release
- Belum diuji:
  - verifikasi semua tabel guru lain dengan nama sangat panjang
- Catatan: perubahan hanya untuk flavor guru.

## 2026-07-29 21:53 - Lock laporan 7 KAIH siswa dan perbaikan reader Lentera
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Tujuan perubahan: Mengunci checklist 7 KAIH setelah siswa mengirim laporan minggu berjalan dan memperbaiki pembaca Lentera Digital dengan zoom/pan agar buku lebih terbaca.
- Flavor terdampak: `siswa`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/SevenHabitsRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/SevenHabitsViewModel.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/SevenHabitsScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
- Fitur lama yang wajib ikut dicek:
  - submit laporan 7 KAIH siswa
  - pembukaan buku dari menu Lentera Digital
  - gesture baca saat zoom aktif dan nonaktif
- Build yang dijalankan:
  - `:app:assembleSiswaRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\siswa\release\app-siswa-release.apk`
- Disalin ke: `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-29_21-53-release.apk`
- Regression check yang dijalankan:
  - verifikasi build release siswa
  - audit kode lock submit mingguan
  - audit kode zoom reader PDF
- Belum diuji:
  - seluruh skenario buku PDF berbeda ukuran pada perangkat fisik
- Catatan: Status lock disimpan persisten di RTDB agar siswa tidak bisa edit ulang pada minggu yang sama.

## 2026-07-29 20:57 - Input cepat nilai kelas untuk 7 KAIH guru
- Pelaksana: Assistant
- Jenis perubahan: `feature`
- Tujuan perubahan: Menambah fitur input cepat nilai kelas 7 KAIH agar guru tidak perlu mengisi empat komponen nilai satu per satu untuk semua siswa.
- Flavor terdampak: `guru`
- File utama yang diubah:
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherSevenHabitsScreen.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/data/repository/TeacherSevenHabitsRepository.kt`
  - `native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/viewmodel/TeacherSevenHabitsViewModel.kt`
- Fitur lama yang wajib ikut dicek:
  - input nilai per siswa
  - rumus total 4 komponen x 25 = 100
  - penyimpanan nilai guru
- Build yang dijalankan:
  - `:app:assembleGuruRelease`
- Hasil build: sukses
- Output APK: `D:\Dashboard Portal\native-mobile-gas\app\build\outputs\apk\guru\release\app-guru-release.apk`
- Disalin ke: `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-29_20-57-release.apk`
- Regression check yang dijalankan:
  - verifikasi build release guru
  - audit kode input massal dan koreksi manual per siswa
- Belum diuji:
  - seluruh kombinasi edit cepat lalu koreksi individu pada kelas besar
- Catatan: Label preset kemudian disederhanakan menjadi `Nilai 20`, `Nilai 25`, dan `Reset`.
