# Pegangan Build APK EduLock Siswa

Folder ini adalah pegangan operasional untuk perubahan **APK native EduLock siswa** pada proyek `D:\Dashboard Portal`.

## Identitas Modul
- Source code: `D:\Dashboard Portal\native-mobile-edulock`
- Gradle module: `:app`
- Root project name: `EduLock`
- Application ID dasar: `com.sekolah.edulock`
- Versi distribusi terkini yang dicatat:
  - `versionCode = 48`
  - `versionName = 1.3.22`
  - File kanonik Final: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`
  - Alias Final: `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
  - File Backup Rollback Teruji: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`
  - Rollback anti-uninstall selektif: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.19-45.apk`

## Scope Dokumen
Dokumen di folder ini **hanya** untuk:
- `student` / EduLock siswa

Dokumen di folder ini **bukan** untuk:
- `admin` / EduLock Admin, karena versi admin adalah web yang dibungkus APK dan tidak menjadi area coding native utama

## Flavor Native yang Dicatat
| Flavor | App Name | Catatan |
|---|---|---|
| `student` | EduLock | APK siswa utama yang punya logika native |

## Catatan Varian Admin
- `admin` memang ada di konfigurasi Gradle
- tetapi secara operasional **tidak menjadi fokus pegangan build ini**
- jika ada perubahan untuk admin, sumber utamanya dianggap berasal dari sisi web, bukan coding native APK admin

## Source Set Aktual
Saat ini source set yang benar-benar ada:

```text
app/src/main
app/src/androidTest
app/src/test
```

Tidak ada `src/student` dan `src/admin` terpisah saat ini. Perbedaan perilaku ditentukan oleh flavor, runtime flow, dan aktivitas yang dipanggil.

## Dokumen yang Wajib Dipakai
- [BATAS_SCOPE.md](./BATAS_SCOPE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [BUILD_LOG.md](./BUILD_LOG.md)
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)
- [RELEASE.md](./RELEASE.md)

## Output APK Aktual yang Dicatat
- Student debug: `app/build/outputs/apk/student/debug/EduLock-studentDebug.apk`
- Student release: `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`

## Catatan Build Penting
- Release memakai `signingConfig` **release** dari `keystore.properties`
- `isMinifyEnabled = true`
- `isShrinkResources = true`
- Nama file output release sudah diatur otomatis dengan format `EduLock-<variant>.apk`
- Ship 1.3.22 (48) Final terkini = rebuild **2026-08-26 19:47 WIB** (CRITICAL SECURITY PATCH celah uninstall activation page + fix tombol Izin Latar Belakang 3 lapis fallback battery optimization). Link `/e` belum otomatis ikut sampai `npm run sync:apk:edulock` + push. Tetap Final only / distribusi manual internal QA sesuai instruksi user "versi ini belum saya rilis untuk umum".

## Folder Distribusi
Rumah file distribusi kanonik:

```text
D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk
```

Folder arsip/uji lama yang masih sering dipakai:

```text
D:\Dashboard Portal\Apk Release\OK_4
```

Handoff lapangan (troubleshooting admin/guru IT) — salinan MD juga di folder ini: `HANDOFF_LAPANGAN_EDULOCK.md`. Canonical:
- Markdown: `D:\Dashboard Portal\native-mobile-edulock\HANDOFF_LAPANGAN_EDULOCK.md`
- Word di Final: `D:\Dashboard Portal\Apk Release\Final\HANDOFF_LAPANGAN_EDULOCK.docx`

## Jalur Tutorial Instalasi Siswa
- URL utama yang dicatat untuk dibagikan ke siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/e`
- URL fallback tutorial instalasi: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install`
- Alias pendek `/e` dipakai agar link browser siswa lebih ringkas saat belum ada custom domain.
- Jika rollout App Hosting belum selesai, route live bisa sementara belum aktif walau source, build, commit, dan push sudah selesai.
- Unduh APK di tutorial live sudah dipulihkan (`3c9b1413` + ship `24e3ffa6`); App Hosting standalone wajib mengemas ulang isi `public/apk`.
- **Per 2026-08-26 19:47 WIB:** file Final = `1.3.22-48` (SHA `1E9C87FFBB19B5CBB2432C3A1E1A9280639CF61BDBE921C4CA25689BCD03E42D`, 3.925.320 bytes). Isi perbaikan 2 item utama:
  1. **CRITICAL SECURITY PATCH Anti-Uninstall:** celah uninstall tanpa kode via halaman Device Admin Activation tombol "Uninstal aplikasi" (native Android typo 1 huruf L — lolos keyword detector + activation page post-Setup tidak masuk dangerousPage). Fix: 27 keyword uninstall diperluas + isActivationPageDangerous safety-net + cross-check hasUninstall.
  2. **Fix tombol Izin Latar Belakang:** permission manifest + 3 lapis fallback Intent (direct popup → daftar Ignore Settings → App Details) untuk vendor ROM China.
  Tutorial live `/e` **belum** diarahkan ke rebuild ini sampai `npm run sync:apk:edulock` + push. Tetap Final only internal QA.

## Perintah Build yang Paling Sering Dipakai

```powershell
./gradlew :app:assembleStudentRelease
```

## Aturan Singkat
1. Semua perubahan **APK EduLock siswa** wajib tercatat di [BUILD_LOG.md](./BUILD_LOG.md)
2. Semua perubahan perilaku/fitur wajib diperiksa ke [CHANGELOG.md](./CHANGELOG.md)
3. Sebelum rilis, pakai [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)
4. Isi folder ini harus selalu mencerminkan kondisi riil **EduLock siswa**, bukan template umum

## Catatan Pendekatan Troubleshooting
- Jika tombol/menu internal EduLock tidak bisa disentuh atau terasa "seret", cek dulu kemungkinan **overlay sisa** (`SetupProtectionService`, lock overlay, atau layar lock lain) yang masih menutup area sentuh.
- Jangan jadikan `onPause()` dan `onUserLeaveHint()` sebagai titik `relaunchEduLock()` paksa. Pendekatan yang lebih stabil adalah:
  - kiosk tetap menjadi penahan utama,
  - flow resmi seperti `Minta Izin Penggunaan HP` dan `Buka APK GAS Siswa` diberi jalur transisi resmi,
  - saat flow resmi dipicu, sistem melepas kiosk sementara, membersihkan overlay, dan memberi grace period,
  - enforcement agresif dilakukan lagi dari `MonitoringService` setelah target package benar-benar terdeteksi.
- Aturan overlay `pet mati` yang saat ini dipakai: **aktif hanya di luar jam sekolah**. Saat masuk jam sekolah, overlay `pet mati` harus ikut tertutup otomatis agar EduLock tetap ringan di jam efektif.
- Interval overlay `pet mati` (v1.3.22 rebuild): mengikuti policy admin `first → second → repeat`; setelah 3 interval pertama, **angka terakhir berulang**. Overlay pertama menunggu interval pertama (tidak langsung muncul saat pet baru mati). Tombol **Saya Mengerti** membuka akses sementara; HP tetap bisa dipakai, konsekuensinya gangguan berkala sampai pet di-revive.
- Hard lock GPS-off / internet-off (build `1.3.4+`): **fail-closed berbasis presence**. Kunci keras HP (TikTok dll.) hanya jika ada indikasi dekat/di sekolah (sticky / near-school / recent geofence). Sakit di rumah tanpa indikasi dekat sekolah tidak dipaksa terkunci **di background**.
- **Overlay wajib GPS (v1.3.22 rebuild 2026-08-20 09:52):** selama GPS/Lokasi HP mati, **jangan kiosk/lock screen** — siswa harus bisa membuka Pengaturan Lokasi. Overlay muncul saat **buka EduLock** (termasuk Mode Senyap). Jika GPS mati lalu **masuk area sekolah**, overlay **“GPS MATI DI AREA SEKOLAH”**. Setelah GPS nyala, proteksi sekolah berjalan normal. Pintu pusat: `GpsEnableOverlay`.
- **Saklar proteksi ON (v1.3.22 rebuild 2026-08-20):** jangan set `isInsideSchoolZone = true` tanpa bukti GPS. Kunci hanya jam sekolah + presence/zona; retry lokasi ~2s dan ~5s.
- Jika `Device Admin` sedang mati atau baru dibuka flow pemulihannya, **jangan** tumpuk prompt `Accessibility`. Prioritas recovery yang dipakai sekarang adalah:
  - `Device Admin` dipulihkan lebih dulu lewat prompt resmi di `MainActivity`,
  - `MonitoringService` menahan auto-open `Accessibility Settings` selama window recovery admin masih aktif,
  - overlay recovery harus menampilkan tombol sesuai target aktual agar user tidak bingung.
- **Fail-safe Offline & Mode Pesawat (v1.3.12+)**: Siswa **DILARANG KERAS** offline > 2 menit atau menyalakan Mode Pesawat selama **Jam Sekolah**, meskipun "Status Proteksi" sedang dimatikan oleh admin (misal saat jam Istirahat). Hal ini untuk mencegah eksploitasi bypass.
  - Jika admin ingin membebaskan siswa seharian (misal: *outclass*, *study tour*, atau pulang cepat), **WAJIB** menggunakan saklar **Mode Libur (Holiday Mode)**.
  - Saat Mode Libur aktif, EduLock baru akan membebaskan siswa untuk menyalakan Mode Pesawat tanpa dikunci.
- **Anti-uninstall (v1.3.19–1.3.22)**:
  - 24/7, tidak terikat jam sekolah / status proteksi.
  - Daftar aplikasi boleh dibuka; tendangan hanya halaman Device Admin, detail EduLock, atau dialog uninstall EduLock.
  - v1.3.20: watchdog + poke wake setelah sleep lama.
  - v1.3.21: Device Admin kick diperbaiki (XML aman).
  - v1.3.22: setup Overlay/Baterai tidak ditendang sebelum setup selesai; UI versi + jarak terpenuhi; pet-dead interval first→second→repeat.
  - **v1.3.22 (rebuild sore):** recovery jika OEM mencabut "Tampil di atas aplikasi lain" saat sleep/Mode Senyap — bangunkan EduLock + dialog/notifikasi saat proteksi ON kembali.
  - **v1.3.22 (rebuild FCM, 19 Agu):** Firebase Messaging + token di `active_devices`; KeepAliveWorker; enforce on SCREEN_ON/boot/FCM Master Switch. OFFLINE ≠ HP tidak dipakai — artinya proses EduLock mati. Setelah install, **buka EduLock sekali** agar FCM terdaftar.
  - **v1.3.22 (rebuild 20 Agu 09:52):** overlay GPS tanpa kiosk; buka EduLock meski senyap; GPS mati + masuk sekolah = overlay "GPS MATI DI AREA SEKOLAH", bukan lock screen.
  - **v1.3.22 (rebuild 26 Agu 19:05):** Fix tombol "Izin Latar Belakang" (Konfigurasi Awal item 6). Manifest + permission REQUEST_IGNORE_BATTERY_OPTIMIZATIONS; 3 lapis fallback Intent battery optimization (direct popup -> daftar Ignore -> App Details) + Toast panduan vendor ROM China/MIUI/Funtouch/ColorOS. QA HP user vendor ROM China — LULUS (semua 6 izin berjalan normal).
  - **v1.3.22 (rebuild 26 Agu 19:47 — CRITICAL SECURITY PATCH):** Tutup celah uninstall tanpa kode via halaman Device Admin Activation Android (tombol native "Uninstal aplikasi"). Akar 3 berantai: keyword "Uninstal" 1L (native typo) tidak match -> activation page post-Setup TIDAK masuk dangerousPage -> tidak ada cross-check hasUninstall. Fix: keyword uninstall 7->27 kata; isActivationPageDangerous safety-net = (activation && !isActivationAllowed) OR (activation && hasUninstall); SettingsGrace exclude juga activationPage (agar masa Setup awal tidak false-positive kick). QA HP user 26 Agu — LULUS (celah tertutup, semua rules anti-uninstall berjalan normal).
  - Acuan uji Final terkini: **1.3.22 (48)** (SHA `1E9C87FFBB19B5CBB2432C3A1E1A9280639CF61BDBE921C4CA25689BCD03E42D`, ship 2026-08-26 19:47 WIB).
  - Jadwal masuk/pulang di UI EduLock **read-only** (sumber: GAS Presensi). Ubah jam uji lewat GAS lalu pastikan kartu Jam Sekolah di HP ikut berubah.
