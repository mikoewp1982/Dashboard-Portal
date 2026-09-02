# Architecture EduLock Siswa

## Struktur Aktual

```text
native-mobile-edulock/
└── app/
    ├── src/
    │   ├── main/
    │   ├── androidTest/
    │   └── test/
    └── build.gradle.kts
```

## Fakta Penting
1. Saat ini hanya ada `src/main`; tidak ada `src/student` dan `src/admin` terpisah.
2. Untuk pegangan build ini, fokus dokumentasi adalah **alur native siswa**.
3. `admin` tidak dijadikan fokus karena secara operasional merupakan pembungkus web, bukan area coding native yang aktif kita rawat.
4. Output file APK sudah dinamai otomatis dengan pola:

```text
EduLock-<variant>.apk
```

## Flavor Native yang Dicatat
- `student`

## Aturan Penempatan Kode
1. Karena source set hanya `main`, setiap perubahan di area native siswa harus dianggap berisiko memengaruhi alur siswa secara luas.
2. Jangan replace total file besar seperti `MainActivity`, `MonitoringService`, atau `PermissionManager` hanya untuk menambah satu fitur.
3. Jika ada detail tentang admin wrapper, dokumentasikan di area web, bukan sebagai fokus utama pegangan APK siswa ini.

## File Berdampak Tinggi
Jika file berikut disentuh, uji regresi wajib ketat:

### Gate izin, keamanan, dan proteksi
- `app/src/main/java/com/sekolah/edulock/MainActivity.kt`
- `app/src/main/java/com/sekolah/edulock/MonitoringService.kt`
- `app/src/main/java/com/sekolah/edulock/GpsEnableOverlay.kt`
- `app/src/main/java/com/sekolah/edulock/LockEnforcer.kt`
- `app/src/main/java/com/sekolah/edulock/LockScreenActivity.kt`
- `app/src/main/java/com/sekolah/edulock/OverlayLockActivity.kt`
- `app/src/main/java/com/sekolah/edulock/LocationMonitor.kt`
- `app/src/main/java/com/sekolah/edulock/AntiUninstallService.kt`
- `app/src/main/java/com/sekolah/edulock/ScreenReceiver.kt`
- `app/src/main/java/com/sekolah/edulock/DeviceAdminReceiver.kt`
- `app/src/main/java/com/sekolah/edulock/SchoolServiceGuard.kt`
- `app/src/main/java/com/sekolah/edulock/PermissionManager.kt`
- `app/src/main/java/com/sekolah/edulock/PermissionCodeActivity.kt`
- `app/src/main/java/com/sekolah/edulock/BarcodeScannerActivity.kt`
- `app/src/main/java/com/sekolah/edulock/StudentRemoteConfigService.kt`
- `app/src/main/res/xml/accessibility_service_config.xml`

### Build / update policy
- `app/src/main/java/com/sekolah/edulock/ForceUpdateActivity.kt`
- `app/src/main/java/com/sekolah/edulock/VersionCheckService.kt`
- `app/build.gradle.kts`

## Kontrak Arsitektur
1. Kode barcode/manual permission dan mode kelas admin tidak boleh saling merusak.
2. Aturan waktu izin yang tampil di UI harus sinkron dengan logika validasi di APK.
3. Jika perubahan menyentuh `PermissionManager`, uji manual code, barcode, durasi, dan expiry wajib dicatat.
4. Jika perubahan menyentuh monitoring/service, status proteksi di lapangan wajib dianggap area risiko tinggi.
5. Anti-uninstall **tidak boleh** bergantung hanya pada event Accessibility. Setelah sleep lama, OS sering menandai service enabled tetapi event macet — watchdog + poke `SCREEN_ON`/`USER_PRESENT` wajib dipertahankan (v1.3.20+).
6. Tendangan Device Admin / uninstall EduLock berjalan 24/7, terpisah dari jam sekolah. Daftar aplikasi umum **tidak** ditendang (selektivitas v1.3.19).
7. Overlay “wajib nyalakan GPS” **terpisah** dari hard lock GPS-off di background. Selama GPS mati: **jangan kiosk/lock screen** (siswa harus bisa buka Pengaturan Lokasi). Masuk sekolah + GPS mati → overlay `GpsEnableOverlay`, baru lock normal setelah GPS nyala. Hard lock background tetap berbasis presence agar siswa sakit di rumah tidak terkunci seluruh HP.

## Output Build
| Variant | Folder output |
|---|---|
| `studentDebug` | `app/build/outputs/apk/student/debug/` |
| `studentRelease` | `app/build/outputs/apk/student/release/` |

## Catatan Release Aktual
- Distribusi terkini: **1.3.22 (`versionCode 48`)** di `Apk Release/Final` — rebuild **2026-08-20 09:52** (overlay GPS tanpa kiosk + deadlock sekolah; SHA `CD7379A3…`)
- `release` memakai `signingConfig` release dari `keystore.properties`
- `minify` dan `shrink resources` aktif
- perubahan build config wajib dicatat jujur karena berdampak ke distribusi APK siswa
- Tutorial live `/e` hanya berubah setelah sync `web/public/apk` + push `main`
