# Checklist Perubahan APK Terkini

Dokumen ini dipakai sebagai pegangan uji perangkat tahap berikutnya.

Aturan baca:
- `[x]` = perubahan sudah diimplementasikan
- `[ ]` = belum diuji di perangkat / web live dan perlu dicek manual

Update terakhir: 2026-08-03 10:14

## Temuan portal tutorial web

- [x] Penyebab gambar rusak di portal tutorial live mengarah ke aset `/tutorial/...` yang dibalas `404` oleh host
- [x] Halaman `web/src/app/gas/install/page.tsx` sekarang memakai static import untuk seluruh gambar tutorial GAS
- [x] Halaman `web/src/app/edulock/install/page.tsx` sekarang memakai static import untuk gambar tutorial EduLock
- [x] Uji lokal: build produksi `web` sukses sesudah static import image diterapkan
- [x] Uji lokal: buka `http://localhost:3000/gas/install` dan aset bundle GAS seperti `logo-aplikasi`, `halaman-login`, dan `izin-lokasi` merespons `200`
- [x] Uji lokal: buka `http://localhost:3000/edulock/install` dan aset bundle EduLock seperti `logo-aplikasi`, `halaman-login`, dan `setup-konfigurasi` merespons `200`
- [x] Overlay callout text box dihapus dari `/gas/install` dan `/edulock/install`; judul/body langkah di atas gambar tetap dipakai
- [x] Wording tutorial EduLock diselaraskan ke tombol `Daftar` (bukan `Masuk`) pada langkah registrasi
- [x] Deploy live tutorial sudah didorong ke `main` via commit `307751ae` untuk Firebase App Hosting `gerbang-aplikasi-sekolah--kompas-5f0b4`
- [x] Cek web live: `/gas/install` dan `/edulock/install` tidak lagi menampilkan kotak callout di atas screenshot (verifikasi `2026-08-02 ~13:41` / `06:41Z`, commit `307751ae`, backend reconciling false; string callout absen di kedua halaman)
- [x] Cek web live: teks langkah EduLock menyebut tombol `Daftar`, bukan `Masuk` (verifikasi `2026-08-02 ~13:41` / `06:41Z`, live memakai `Daftar`)
- [x] Tombol unduh APK di tutorial live sempat `404` karena App Hosting standalone tidak ikut mengemas file di `web/public/apk`
- [x] Perbaikan unduh APK: `ensure-standalone-public.mjs` + stop tracing `apk-manifest` dari `public` (commit `3c9b1413`)
- [x] Ship EduLock siswa + sync APK publik + update URL tutorial live (commit `24e3ffa6`)
- [x] Cek web live: unduh APK GAS dan EduLock dari halaman tutorial sudah merespons normal (bukan `404`)

## Temuan kritis terbaru

- [x] Audit signer APK siswa menemukan dua jalur signer berbeda untuk package `com.satupintu.mobile.siswa`
- [x] `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` memakai signer release `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`
- [x] `D:\Dashboard Portal\docs\APK GAS\apk GAS siswa.apk` memakai signer debug `a2eb5bc009532e7075912b58c6825b9ea91862676a31507b227d90583d26b674`
- [x] Dokumen `D:\Dashboard Portal\docs\APK GAS\handoff_APK GAS.md` menyebut folder `docs\APK GAS\` memang berisi build terbaru `debug`
- [x] Konsekuensi teknis: device yang baseline instalasinya berasal dari signer debug tidak bisa ditimpa langsung oleh APK release saat ini
- [ ] Konfirmasi lapangan: tentukan apakah HP yang gagal install dulu memasang APK dari jalur `docs\APK GAS` / build debug
- [ ] Uji di HP pembanding yang baseline-nya sudah pasti APK release signer `6473...`
- [ ] Putuskan SOP migrasi satu kali untuk perangkat yang terlanjur memakai signer debug

## 0. Web Admin / Dashboard

### Distribusi APK via web
- [x] Alur resmi distribusi APK web sudah dicatat di `Pegangan Build APK/PANDUAN_DEPLOY_WEB.md`
- [x] Sumber distribusi internal tetap `D:\Dashboard Portal\Apk Release\Final`
- [x] Folder yang benar-benar dibaca web live adalah `D:\Dashboard Portal\web\public\apk`
- [x] Skrip sinkronisasi sudah disiapkan di `web/scripts/sync-public-apk.ps1`
- [x] Shortcut sinkronisasi sudah tersedia via `npm run sync:apk`, `npm run sync:apk:gas`, dan `npm run sync:apk:edulock`
- [x] Sinkronisasi dari `Final` ke `web/public/apk` sudah dijalankan lagi pada `2026-08-02 07:44` untuk GAS siswa
- [x] Sinkronisasi EduLock siswa dari `Final` ke `web/public/apk` sudah dijalankan pada ship `24e3ffa6` (`EduLock-studentRelease.apk` = `1.3.4` / `30`)
- [x] Skrip sinkronisasi GAS siswa sekarang juga memverifikasi `packageName`, `versionCode`, `versionName`, hash, dan signature agar file publik tidak lagi tertinggal atau menimpa build dengan versi yang salah
- [x] App Hosting standalone sekarang mengemas ulang isi `public` (termasuk APK) via `ensure-standalone-public.mjs` agar tombol unduh tutorial tidak `404`
- [ ] Jika nama file APK berubah, link tombol unduh di halaman web harus ikut diperbarui
- [ ] Ingat: siswa tidak otomatis mengunduh ulang APK hanya karena file server diganti; mereka tetap perlu menekan tombol unduh lagi atau dipaksa update dari sisi aplikasi

### Web e-perpus sekolah
- [x] Halaman katalog `Lentera Digital` di web e-perpus sudah dipisah dari halaman `Kelola Buku`
- [x] Filter kategori web e-perpus sudah diubah menjadi rak kategori
- [x] Logo sidebar dan favicon web e-perpus sudah memakai aset Lentera terbaru
- [x] Kategori utama web e-perpus sekarang sudah mencakup `ENSIKLOPEDIA`
- [x] Kategori utama web e-perpus sekarang sudah mencakup `SAINS & TEKNOLOGI`
- [ ] Cek web live: halaman `admin/books/lentera-catalog` menampilkan kategori utama terbaru dengan urutan yang benar
- [ ] Cek web live: pilih `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI` di katalog web harus memfilter data tanpa error

### Monitoring admin sekolah
- [x] Monitoring super admin sekarang menggabungkan data `schools` dan `admin_profiles` agar admin sekolah yang login via jalur runtime tetap terbaca
- [x] Pencatatan `lastLoginAt` admin sekarang di-await sebelum redirect agar request login tidak putus saat pindah halaman
- [x] Perbaikan monitoring admin sekolah sudah dideploy ke web live pada rollout malam `2026-07-30`
- [ ] Cek web live: login ulang admin sekolah lalu pastikan `Monitoring` menampilkan waktu login terbaru
- [ ] Cek web live: admin sekolah tanpa email login standar tidak lagi terbaca sebagai `Belum pernah login`

### GAS web admin
- [x] Infinite spinner di tab `7 KAIH` sudah ditutup dengan fallback aman saat `schoolId` kosong, path tidak valid, atau subscribe RTDB gagal
- [x] Tab `7 KAIH` sekarang menampilkan pesan panduan bila sesi admin belum membawa `schoolId`
- [x] Hook roster `useGasRecords` sekarang mengosongkan data dan mematikan loading saat refresh/subscription gagal
- [x] Sidebar dashboard sekarang hanya mengaktifkan prefetch link saat production untuk membantu mencegah `ChunkLoadError` di mode development
- [x] Tab `Peringkat` pada `Virtual Pet` dirapikan agar wrapper tabel tetap stabil saat data ditampilkan
- [ ] Cek lokal/live: buka menu `7 KAIH`, spinner tidak boleh berputar terus tanpa akhir
- [ ] Cek lokal/live: bila sesi admin belum siap, panel `7 KAIH` harus menampilkan pesan fallback yang jelas
- [ ] Cek lokal/live: tab `Virtual Pet -> Peringkat` tetap rapi saat data ranking banyak
- [ ] Deploy live: perbaikan spinner/tab GAS di atas masih perlu ikut didorong ke `main` bila memang mau dilivekan

## 1. EduLock Siswa

Build acuan:
- `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk` (`versionName 1.3.4` / `versionCode 30`, `3,787,940` bytes, commit ship `24e3ffa6`)
- `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk` (sudah disinkronkan dari Final pada ship `24e3ffa6`)
- Handoff lapangan: `native-mobile-edulock/HANDOFF_LAPANGAN_EDULOCK.md` + salinan Word `Apk Release/Final/HANDOFF_LAPANGAN_EDULOCK.docx`

### Login dan registrasi
- [x] Urutan field login/registrasi diubah menjadi `NPSN -> NISN -> Nama Siswa`
- [x] Kolom `Nama Siswa` tidak lagi diisi manual
- [x] Nama siswa terisi otomatis dari database setelah `NPSN` dan `NISN` valid
- [x] Validasi registrasi tetap mengikat device ke akun siswa
- [ ] Cek di HP: `NPSN benar + NISN benar` harus memunculkan nama otomatis
- [ ] Cek di HP: `NPSN benar + NISN salah` tidak boleh memunculkan nama
- [ ] Cek di HP: proses daftar tetap berhasil sesudah nama terisi otomatis

### Jam sekolah dan dashboard utama
- [x] Card `Jam Sekolah` dirapikan
- [x] Posisi `Masuk` dan `Pulang` dipindah ke sisi kiri
- [x] `Waktu Saat Ini` dipindah ke sisi kanan
- [x] Garis pembatas card diposisikan di tengah
- [ ] Cek di HP: layout card benar-benar simetris dan tidak geser di device target

### Izin dan jam sesi
- [x] Validasi kode izin sudah mengikuti `Jam Mulai - Jam Akhir`
- [x] Kode izin ditolak bila dipakai di luar rentang waktu yang ditentukan
- [x] Durasi izin di APK dipotong otomatis bila melewati jam akhir sesi
- [x] Mode Kelas EduLock sudah didukung dan dibaca realtime oleh APK siswa
- [ ] Cek di HP: kode izin benar hanya aktif dalam rentang jam yang diberikan
- [ ] Cek di HP: aktivasi izin per kelas dari web langsung terbaca tanpa input siswa

### Proteksi aplikasi
- [x] Gate EduLock tetap aktif sejak aplikasi mulai
- [x] Pengingat `pet mati` disetel muncul ulang tiap 1 menit untuk uji coba
- [x] Pengingat `pet mati` tetap dipaksa muncul di luar jam sekolah
- [x] Build uji overlay `pet mati` dinaikkan ke versi `1.3.2 (versionCode 28)` agar bisa dipasang menimpa APK uji lama
- [x] Instrumentasi runtime debug `pet-overlay-missing` dipasang pada listener pet, cabang reminder, dan activity overlay
- [x] Root cause pre-fix sudah terbukti: EduLock sebelumnya memakai alias lokal `studentId` SQLite, bukan identitas backend siswa
- [x] Build post-fix overlay `pet mati` dinaikkan lagi ke versi `1.3.3 (versionCode 29)` agar bisa menimpa build `19-47`
- [x] EduLock sekarang menyimpan `studentKey` dan `username` backend untuk pencocokan pet
- [x] User sudah mengonfirmasi overlay `pet mati` muncul pada pengujian post-fix
- [x] Instrumentasi debug sementara sudah dicabut kembali dari APK final
- [x] Interval reminder `pet mati` sudah dikembalikan ke normal `10 menit`
- [x] Tombol 5 (Tampil di Atas Aplikasi Lain) dan Tombol 6 (Izin Latar Belakang) pada Konfigurasi Awal EduLock siswa sekarang bisa diakses tanpa ditendang keluar, karena `AntiUninstallService` membebaskan akses Settings saat `isSetupCompleted` masih `false` atau `isSettingsGrace` aktif
- [x] Device Admin yang dimatikan akan langsung memicu siswa ditendang kembali ke EduLock
- [x] Upaya masuk ke menu `Aplikasi admin perangkat` sudah diblok dan diarahkan balik saat proteksi aktif sesudah setup selesai
- [x] Telemetry proteksi (`Accessibility`, `Device Admin`, compliance status) dikirim ke backend monitoring
- [ ] Cek di HP: APK build `20-08` berhasil terpasang sebagai update di atas build `20-02`
- [ ] Cek di HP: setelah menekan `Saya Mengerti` pada build final, overlay pet mati muncul lagi maksimal 10 menit kemudian
- [ ] Cek di HP: buka menu `Aplikasi admin perangkat`, siswa harus langsung keluar dari menu itu
- [ ] Cek di HP: proteksi tetap hidup konsisten saat app di-background lalu dibuka lagi
- [x] **Enforcement Instan saat Proteksi ON**: Saat admin menghidupkan `Status Proteksi Sekolah`, HP siswa langsung terkunci **tanpa menunggu siswa menutup aplikasi aktif** (TikTok, Instagram, dll). Perbaikan mencakup:
  - Overlay lock hitam langsung ditampilkan menutupi app aktif
  - Grace period `appSwitchTimestamp` di-reset ke `0L` agar `performChecks()` tidak skip
  - `relaunchEduLock()` + `requestKiosk()` dipanggil 3 kali berturut-turut (0ms, 500ms, 1500ms) untuk memastikan HP benar-benar terkunci
- [ ] Cek di HP: buka TikTok/Instagram → admin nyalakan proteksi → HP harus langsung terkunci tanpa siswa menutup TikTok
- [x] **Fail-closed berbasis indikasi kehadiran sekolah** (build `1.3.4` / `30`, ship `24e3ffa6`): hard lock GPS-off / internet-off hanya jika ada indikasi presence (sticky / near-school / recent geofence)
- [x] Siswa sakit di rumah (GPS/internet off, belum pernah dekat sekolah) tetap tidak dipaksa terkunci
- [x] Native terdampak: `MonitoringService`, `LocationMonitor`, `PreferencesManager`, `MainActivity`, `GeofenceBroadcastReceiver`
- [ ] Cek di HP: di sekolah + GPS off → harus masuk jalur peringatan/kunci sesuai policy
- [ ] Cek di HP: di rumah tanpa indikasi dekat sekolah + GPS off → HP tidak hard-lock

### Monitoring realtime ke web
- [x] Heartbeat perangkat dikirim lebih rapat ke `active_devices`
- [x] Status proteksi dan last seen ikut dikirim ke backend
- [x] Panel `Realtime Student Monitoring` di web disetel refresh otomatis tiap 5 detik
- [ ] Cek web live: HP siswa online harus berubah cepat tanpa refresh manual
- [ ] Cek web live: saat proteksi mati, status monitoring harus ikut berubah
- [ ] Cek web live: saat HP offline, last update dan status harus turun sesuai kondisi

## 2. GAS Siswa

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\GAS-Siswa-2026-07-30_19-13-release.apk`
- `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk` (ditimpa lagi pada `2026-08-02 13:12:56`, versi `1.0.30-siswa` / `versionCode 23022`, hash `1277A714DC557384BB5EAA6E5798EA6E54C3B77A61D1413CB7F5F2DFA6253F63`)
- `D:\Dashboard Portal\web\public\apk\GAS-Siswa-release.apk` (rilis publik web masih build `23005`; artefak web belum ikut disinkronkan ke build final `23022`)

### Login siswa
- [x] Login siswa diubah menjadi urutan `NPSN -> NISN -> Nama Siswa`
- [x] Kolom `Nama Siswa` dibuat read-only
- [x] Nama siswa terisi otomatis dari database setelah `NPSN` dan `NISN` valid
- [x] Versi paket APK `GAS Siswa` dinaikkan lagi agar file terbaru bisa di-install sebagai update di atas build lama
- [x] Ditemukan petunjuk bahwa jalur `legacySiswa` memakai package yang sama tetapi `versionCode 23003`, sehingga build siswa biasa harus melampaui angka itu agar update tidak ditolak di sebagian HP
- [x] Ditemukan juga bahwa file `web/public/apk/GAS-Siswa-release.apk` sempat tertinggal di `versionCode 1028`; file itu sudah disinkronkan ulang dari `Final`
- [x] Pengaman proses rilis sekarang menolak sinkronisasi GAS siswa bila `versionCode` turun, tetap sama tetapi isi APK berubah, atau signature berbeda dari file publik sebelumnya
- [x] `versionCode` siswa sudah dinaikkan lagi ke `23005` agar perubahan layar force update tetap bisa di-install di atas build `23004`
- [x] Build fix `Presensi Sholat` sudah dibuat sebagai `1.0.14-siswa` / `versionCode 23006` agar bisa di-install di atas build `23005`
- [x] Build uji overwrite manual berikutnya sudah dibuat sebagai `1.0.15-siswa` / `versionCode 23007` agar tidak terhambat kasus versi sama saat pengujian timpa APK lama
- [x] Build `GAS Siswa` untuk menyamakan login ulang HP yang sama dengan EduLock sudah dibuat sebagai `1.0.26-siswa` / `versionCode 23018`
- [x] Build final gate EduLock ketat berbasis device yang sama + status monitoring/proteksi hijau sudah dibuat sebagai `1.0.27-siswa` / `versionCode 23019`
- [x] Binding perangkat GAS siswa dipisah ke field `gasDeviceId` agar binding EduLock (`device_uuid` / `deviceId` / `device`) tidak menimpa kunci 1 akun 1 device GAS
- [x] Backend `mobileAuth` dan jalur reset admin ikut membersihkan/menghormati `gasDeviceId`
- [x] Build final 1 akun 1 device + pemisahan `gasDeviceId` sudah dibuat sebagai `1.0.30-siswa` / `versionCode 23022`
- [ ] Cek di HP: `NPSN benar + NISN benar` harus memunculkan nama siswa otomatis
- [ ] Cek di HP: `NPSN benar + NISN salah` tidak boleh memunculkan nama siswa
- [ ] Cek di HP: login siswa tetap berhasil setelah nama siswa terisi otomatis
- [ ] Cek di HP: update APK langsung di atas build lama berhasil tanpa pesan `Aplikasi tidak terinstal`
- [ ] Cek di HP: update APK langsung di atas build `legacySiswa` juga berhasil tanpa uninstall
- [ ] Cek di HP: logout lalu login ulang di HP yang sama tetap berhasil sesudah update ke build `23022`
- [ ] Cek di HP: login akun yang sama dari HP lain tetap tertolak sesudah update ke build `23022`
- [ ] Cek di HP: login EduLock di HP yang sama tidak boleh menimpa / mengunci ulang binding `gasDeviceId` GAS
- [ ] Cek di HP: bila APK diunduh dari portal/web, file yang terpasang sekarang masih build `23005` sampai artefak publik `23022` disinkronkan

### Compliance dengan EduLock
- [x] Telemetry Realtime EduLock ke Web Admin diperbaiki: saat EduLock baru di-install / di-install ulang, telemetry status `ONLINE` langsung dikirim seketika saat registrasi selesai & selama halaman `SetupActivity` (onboarding izin HP) dibuka. Web Admin tidak lagi tertahan di status `TERIKAT / Offline` (misal *7283 min lalu*) saat siswa sedang melengkapi konfigurasi.
- [x] GAS siswa tidak boleh dipakai bila EduLock tidak terpasang
- [x] Gate dicek sejak aplikasi mulai, termasuk sebelum siswa lolos masuk ke area utama
- [x] Pengecekan instalasi EduLock dibuat sangat agresif: dipasang `LifecycleEventObserver` pada `ON_RESUME` sehingga saat EduLock di-uninstall lalu siswa membuka GAS dari Recent Apps / Switcher, overlay merah langsung muncul seketika tanpa perlu menghapus Recent Apps
- [x] Overlay compliance sudah dibuat benar-benar memblokir sentuhan ke UI di bawahnya
- [x] Gate GAS sekarang tidak lagi cukup membaca alias siswa saja; telemetry EduLock harus cocok dengan fingerprint device HP yang sedang dipakai
- [x] GAS sekarang hanya boleh terbuka jika status monitoring EduLock masih `ONLINE` dan proteksi berstatus `COMPLIANT`
- [x] Kondisi `PAUSED`, `NON_COMPLIANT`, telemetry kosong, record stale, atau record hijau lama dari HP lain tidak lagi boleh meloloskan akses
- [ ] Cek di HP: uninstall EduLock lalu buka GAS siswa, akses harus tertahan penuh
- [ ] Cek di HP: layar login GAS siswa juga harus ikut tertahan bila EduLock tidak aktif
- [ ] Cek di HP: overlay tidak boleh bisa ditembus sentuhan
- [ ] Cek di HP: install EduLock tanpa login/aktivasi tetap harus membuat GAS tertahan merah
- [ ] Cek di HP: setelah login EduLock di HP yang sama dan monitoring/proteksi hijau, GAS baru boleh terbuka

### Fitur siswa lain
- [x] `Absensi` siswa tidak lagi memaksa hari Minggu sebagai libur; jika admin mengaktifkan Minggu di pengaturan presensi sekolah, APK sekarang mengikuti rule RTDB
- [x] `Presensi Sholat` siswa juga tidak lagi memaksa hari Minggu sebagai libur bila sekolah sengaja mengaktifkannya
- [x] `Presensi Sholat` siswa sekarang diarahkan membaca `attendance/schedules` web admin karena dashboard tidak lagi menulis `prayer/schedules`
- [x] Layar `Force Update` GAS siswa sekarang memperjelas bahwa siswa harus download lalu install manual APK terbaru di HP, bukan menunggu update otomatis dari dalam aplikasi
- [x] Logika **Device Binding (1 Akun 1 Device)** pada APK GAS Siswa disamakan persis dengan EduLock: menggunakan pencocokan Fingerprint Hardware `ANDROID_ID` case-insensitive & varian SHA-256 sehingga siswa yang meng-install ulang GAS di HP miliknya sendiri tidak akan lagi terkunci/tertolak, namun jika dicoba di HP teman tetap 100% terblokir.
- [x] Laporan 7 KAIH terkunci setelah tombol kirim dipakai
- [x] Reader Lentera Digital sudah diperbaiki agar zoom/pan lebih nyaman
- [x] Card `Prestasi` di menu Kedisiplinan siswa dihapus
- [x] Gate `pet mati` siswa memblokir interaksi sehingga siswa tidak bisa memakai GAS sampai pet direvive
- [x] Urutan menu beranda GAS siswa diubah menjadi `Absensi -> Presensi Sholat -> Lentera Digital -> 7 KAIH -> Virtual Pet -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Tools`
- [x] Menu `Catat Pelanggaran` tetap khusus petugas OSIS dan diposisikan paling akhir sesudah `Tools`
- [x] Kartu `Literasi` pada `Virtual Pet` sekarang benar-benar membuka `Tugas Literasi` siswa, bukan halaman placeholder
- [x] `Virtual Pet` yang membuka `Tugas Literasi` sekarang langsung masuk ke tab tugas, bukan ke tab katalog
- [x] Status aktivitas `E-Perpus` di `Virtual Pet` sekarang memakai target `30 menit membaca hari ini`
- [x] Tab `Peringkat` di `Virtual Pet` diperkuat dengan alias siswa `recordId/id/nisn/username` agar ranking tetap tampil walau format ID pet lama berbeda
- [x] Card `Pencapaian -> Literasi Aktif` di `Virtual Pet` sekarang juga sudah memakai teks target `30 menit`, bukan lagi teks lama `60 menit`
- [x] `readingDuration` 30 menit sekarang menjadi satu-satunya rumus makan pet siswa; submit tugas literasi tidak lagi mempengaruhi lapar harian
- [x] Quest `Membaca Buku 30 Menit` sekarang menjadi misi harian pet dengan hadiah `+50 Koin` dan `+25 XP`
- [x] Quest `Bonus Literasi Bulanan` sekarang memberi `+200 Koin` dan `+100 XP` saat siswa mengirim tugas/laporan literasi bulanan sekolah
- [x] Quest bonus literasi sekarang memakai periode bulanan agar hadiah tidak terklaim ulang setiap hari
- [x] Reader PDF Lentera Digital sekarang menulis durasi baca nyata ke `student_activities/{studentId}/reading_log/{tanggal}` secara periodik dan saat layar ditutup
- [x] Kategori katalog `Lentera Digital` di APK siswa sudah pernah disamakan ke master kategori e-perpus versi awal, tidak lagi hanya mengikuti 3 kategori yang sedang terisi data
- [x] Filter kategori katalog `Lentera Digital` sekarang diubah dari chip horizontal menjadi dropdown full-width agar lebih rapi di mobile
- [x] Kontras teks dropdown kategori katalog `Lentera Digital` sudah diperkuat agar item menu tidak tenggelam di background gelap
- [x] Logo `Lentera Digital` pada halaman katalog sudah diganti ke aset `ic_menu_lentera_digital.png`
- [x] Tab `Profil` pada `Lentera Digital` sekarang membaca nama siswa aktif dan `NISN` yang benar, tidak lagi menampilkan push-key sebagai `NISN`
- [x] Menu `Catat Pelanggaran` di GAS siswa sekarang mengikuti status petugas OSIS secara realtime; jika siswa dihapus dari `Manajemen Petugas OSIS`, menu harus hilang otomatis
- [x] Master kategori katalog `Lentera Digital` di APK siswa sekarang mengikuti kategori utama web e-perpus terbaru
- [x] Kategori baru `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI` sudah disinkronkan ke filter katalog APK GAS siswa
- [ ] Cek di HP: laporan 7 KAIH minggu berjalan tidak bisa diedit ulang setelah dikirim
- [ ] Cek di HP: saat admin menyalakan Minggu sebagai hari efektif, menu `Absensi` siswa di hari Minggu tidak lagi menampilkan status `Libur`
- [ ] Cek di HP: saat admin menyalakan Minggu sebagai hari efektif, `Presensi Sholat` siswa di hari Minggu juga ikut aktif sesuai rule sekolah
- [ ] Cek di HP: setelah update ke build `23019`, kartu `Aturan Hari` pada `Presensi Sholat` harus menampilkan `Hari efektif: Ya` saat Minggu diaktifkan dari web admin
- [ ] Cek di HP: PDF Lentera tetap nyaman dibaca di beberapa ukuran file
- [ ] Cek di HP: menu Kedisiplinan tidak menampilkan card `Prestasi`
- [ ] Cek di HP: saat pet mati, siswa tidak bisa berinteraksi dengan UI GAS sama sekali
- [ ] Cek di HP: urutan menu beranda GAS siswa tampil sesuai susunan baru
- [ ] Cek di HP akun OSIS: menu `Catat Pelanggaran` muncul paling akhir sesudah `Tools`
- [ ] Cek di HP: dari `Virtual Pet -> Status Aktivitas Hari Ini -> Literasi`, siswa langsung masuk ke `Tugas Literasi`
- [ ] Cek di HP: dari `Virtual Pet -> E-Perpus`, status berubah penuh saat mencapai 30 menit membaca
- [ ] Cek di HP: dropdown kategori katalog menampilkan `Semua + 9 kategori utama web` secara konsisten
- [ ] Cek di HP: dropdown kategori bisa dibuka/tutup dengan stabil dan tetap nyaman disentuh
- [ ] Cek di HP: semua teks item dropdown kategori terbaca jelas saat menu terbuka
- [ ] Cek di HP: logo Lentera baru tampil normal di header katalog
- [ ] Cek di HP: tab `Profil` menampilkan nama siswa aktif yang sesuai akun login
- [ ] Cek di HP: `NISN` di tab `Profil` sesuai data siswa, bukan ID acak Firebase
- [ ] Cek di HP: kategori baru `ENSIKLOPEDIA` dan `SAINS & TEKNOLOGI` tampil dan memfilter buku dengan benar
- [ ] Cek di HP: kategori kosong seperti `BUKU PELAJARAN`, `MAJALAH`, atau kategori baru lain tetap aman dibuka
- [ ] Cek di HP: baca PDF 1-2 menit lalu keluar, data `reading_log` hari ini benar-benar bertambah di backend
- [ ] Cek di HP: tepat saat durasi baca mencapai 30 menit, `Hunger` pet harus turun ke `0` dan progress kenyang penuh
- [ ] Cek di HP: pause atau pindah app saat reader masih terbuka tidak boleh menambah durasi palsu
- [ ] Cek di HP: quest `Membaca Buku 30 Menit` memberi `+50 Koin` dan `+25 XP` sekali per hari
- [ ] Cek di HP: submit tugas literasi bulanan memberi `+200 Koin` dan `+100 XP` sekali pada bulan yang sama
- [ ] Cek di HP: setelah hadiah bonus bulanan diklaim, buka ulang `Virtual Pet` di hari lain dalam bulan yang sama tidak boleh memberi bonus kedua
- [ ] Cek di HP: tab `Pencapaian` dan `Peringkat` di `Virtual Pet` sama-sama bisa dibuka dan menampilkan data nyata
- [ ] Cek di HP: card `Pencapaian -> Literasi Aktif` menampilkan `30 menit` secara konsisten pada subtitle dan progress
- [ ] Cek di HP: saat siswa dihapus dari `Manajemen Petugas OSIS`, menu `Catat Pelanggaran` hilang otomatis tanpa perlu login ulang

## 3. GAS Guru

Build acuan:
- `D:\Dashboard Portal\Apk Release\OK_4\GAS-Guru-2026-07-30_17-47-release.apk`

### Tampilan data siswa dan presensi
- [x] Nama siswa pada layar guru diizinkan tampil sampai 2 baris
- [x] NISN di row yang mengganggu ruang nama sudah dihapus dari layar terkait
- [x] Tinggi row dibuat lebih adaptif untuk nama panjang
- [x] Garis pemisah antar kolom pada `Data Siswa` dibuat lebih tegas
- [x] Garis pemisah antar kolom pada `Presensi Siswa` dibuat lebih tegas
- [x] Garis pemisah antar kolom pada `Presensi Sholat` dibuat lebih tegas
- [x] Rekap bulanan `Rekapitulasi Kehadiran` guru sekarang mengikuti tabel siswa di Web Admin secara langsung dengan format `H/S/I/A`
- [x] Rekap bulanan `Rekapitulasi Kehadiran` guru sekarang memakai `student.id` kanonik seperti tabel siswa di Web Admin
- [x] Status `Terlambat/LATE` pada rekap bulanan guru sekarang dilebur ke `Hadir (H)` agar sama persis dengan tabel siswa di Web Admin
- [x] Rekap bulanan bulan berjalan tidak lagi menghitung hari masa depan sebagai `Alpa`
- [x] Rekap bulanan guru sekarang mencocokkan log absensi siswa memakai alias identitas `recordId -> id -> nisn -> username`, sehingga log yang tersimpan dengan ID berbeda tetap masuk ke siswa yang benar
- [x] Presensi Sholat guru sekarang mencocokkan siswa dengan alias identitas `recordId -> id -> nisn -> username`, sehingga log sholat lama/baru tidak hilang hanya karena beda format ID
- [x] Kolom `PET` pada `Data Siswa` guru sudah membaca `virtual_pets` realtime (bukan `-` terus) dengan pencocokan ID siswa yang benar
- [x] Label kolom `PET` guru sekarang sudah mengenali level `Sekarat` agar sinkron dengan APK siswa
- [x] Input cepat nilai kelas untuk 7 KAIH sudah tersedia
- [x] Menu `Rekapitulasi` (Rekapitulasi Kelas) sudah muncul di beranda guru dan bisa dibuka
- [x] Urutan menu beranda GAS guru diubah menjadi `Data Siswa -> Presensi Siswa -> Presensi Sholat -> Literasi & Tugas -> 7 KAIH -> Kedisiplinan -> Layanan Aduan -> Notifikasi -> Rekapitulasi`
- [ ] Cek di HP: nama panjang tidak lagi terpotong di `Data Siswa`
- [ ] Cek di HP: nama panjang tetap terbaca di `Presensi Sholat`
- [ ] Cek di HP: nama panjang tetap terbaca di `Rekapitulasi Kehadiran`
- [ ] Cek di HP: garis pemisah kolom terlihat jelas dan rapi di tiga menu guru
- [ ] Cek di HP: tab `Rekap Bulanan` sekarang menampilkan kolom `H/S/I/A` tanpa kolom `T`
- [ ] Cek di HP: angka rekap bulanan guru untuk `H/S/I/A` sama dengan tabel siswa di Web Admin pada kelas dan bulan yang sama
- [ ] Cek di HP: kasus siswa `ok` yang sebelumnya tampil `A:26` sekarang turun menjadi `A:25` dan sama dengan Web Admin + APK siswa
- [ ] Cek di HP: bulan berjalan tidak lagi menambah `Alpa` untuk tanggal yang belum terjadi
- [ ] Cek di HP: `Presensi Sholat` guru tetap membaca data siswa yang login/tersimpan dengan alias ID berbeda (`recordId/id/nisn/username`)
- [ ] Cek di HP: kolom `PET` berubah realtime mengikuti kondisi terakhir siswa (sehat/sakit/sekarat/mati) tanpa perlu relogin
- [ ] Cek di HP: input cepat nilai kelas berjalan benar lalu tetap bisa koreksi per siswa
- [ ] Cek di HP: menu `Rekapitulasi` muncul di beranda guru dan navigasi ke layar rekap berhasil
- [ ] Cek di HP: urutan menu beranda guru tampil sesuai susunan baru dengan `Rekapitulasi` di posisi paling akhir

### Login guru
- [x] Login guru diubah menjadi urutan `NPSN -> NUPTK -> Nama Guru`
- [x] Kolom `Nama Guru` dibuat read-only
- [x] Nama guru terisi otomatis dari database setelah `NPSN` dan `NUPTK` valid
- [ ] Cek di HP: `NPSN benar + NUPTK benar` harus memunculkan nama guru otomatis
- [ ] Cek di HP: `NPSN benar + NUPTK salah` tidak boleh memunculkan nama guru
- [ ] Cek di HP: login guru tetap berhasil setelah nama guru terisi otomatis

### Kedisiplinan guru
- [x] Card/menu `Pelanggaran` dan `Riwayat` tampil sejajar di bagian atas layar
- [x] Menu `Pelanggaran` sekarang berdiri sendiri dan hanya menampilkan daftar siswa
- [x] Menu `Riwayat` sekarang berdiri sendiri dan hanya menampilkan daftar riwayat terbaru
- [x] Filter dan riwayat `Kedisiplinan` guru sekarang ikut mengenali alias siswa `recordId/id/nisn/username`, sehingga record valid tidak hilang dari daftar
- [ ] Cek di HP: card `Pelanggaran` dan `Riwayat` tampil sejajar rapi
- [ ] Cek di HP: saat `Pelanggaran` aktif, list siswa tampil tanpa tercampur riwayat
- [ ] Cek di HP: saat `Riwayat` aktif, daftar riwayat tampil tanpa tercampur list siswa
- [ ] Cek di HP: record kedisiplinan otomatis/manual tetap muncul di guru walau `studentId` sumbernya bukan NISN

### Notifikasi guru
- [x] Notifikasi guru sekarang ikut mengenali alias siswa `recordId/id/nisn/username` untuk modul literasi dan bullying
- [x] Listener notifikasi guru menambahkan tipe `LITERACY_INCOMPLETE` (literasi belum selesai) dan `PET_DEAD` (virtual pet mati)
- [x] Layar notifikasi guru menampilkan ikon/warna khusus untuk literasi belum dan pet mati, plus navigasi ke Literasi / Data Siswa
- [x] APK Guru Final diganti ke nama tunggal `GAS-Guru-release.apk` (`1.0.30-guru` / `1038`); file bertanggal `2026-07-30_17-47` di Final dihapus agar tidak membingungkan
- [ ] Cek di HP: notifikasi tugas literasi siswa tetap masuk ke guru walau `studentId` log tersimpan sebagai alias selain NISN
- [ ] Cek di HP: notifikasi laporan bullying siswa tetap masuk ke guru walau `reporterId/victimId/perpetratorId` tersimpan sebagai alias selain NISN
- [ ] Cek di HP: siswa dengan literasi outstanding memunculkan notifikasi `literasi belum` di guru
- [ ] Cek di HP: siswa dengan virtual pet mati memunculkan notifikasi `pet mati` dan tap membuka Data Siswa
