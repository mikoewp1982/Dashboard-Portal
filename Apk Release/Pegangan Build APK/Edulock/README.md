# Pegangan Build APK EduLock Siswa

Folder ini adalah pegangan operasional untuk perubahan **APK native EduLock siswa** pada proyek `D:\Dashboard Portal`.

## Identitas Modul
- Source code: `D:\Dashboard Portal\native-mobile-edulock`
- Gradle module: `:app`
- Root project name: `EduLock`
- Application ID dasar: `com.sekolah.edulock`
- Versi distribusi terkini yang dicatat:
  - `versionCode = 30`
  - `versionName = 1.3.4`
  - File kanonik Final: `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`

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
- Release saat ini memakai `signingConfig = debug`
- `isMinifyEnabled = true`
- `isShrinkResources = true`
- Nama file output release sudah diatur otomatis dengan format `EduLock-<variant>.apk`

## Folder Distribusi
Rumah file distribusi kanonik:

```text
D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk
```

Folder arsip/uji lama yang masih sering dipakai:

```text
D:\Dashboard Portal\Apk Release\OK_4
```

Handoff lapangan (troubleshooting admin/guru IT):
- Markdown: `D:\Dashboard Portal\native-mobile-edulock\HANDOFF_LAPANGAN_EDULOCK.md`
- Word di Final: `D:\Dashboard Portal\Apk Release\Final\HANDOFF_LAPANGAN_EDULOCK.docx`

## Jalur Tutorial Instalasi Siswa
- URL utama yang dicatat untuk dibagikan ke siswa: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/e`
- URL fallback tutorial instalasi: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install`
- Alias pendek `/e` dipakai agar link browser siswa lebih ringkas saat belum ada custom domain.
- Jika rollout App Hosting belum selesai, route live bisa sementara belum aktif walau source, build, commit, dan push sudah selesai.
- Unduh APK di tutorial live sudah dipulihkan (`3c9b1413` + ship `24e3ffa6`); App Hosting standalone wajib mengemas ulang isi `public/apk`.

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
- Hard lock GPS-off / internet-off (build `1.3.4+`): **fail-closed berbasis presence**. Kunci keras hanya jika ada indikasi dekat/di sekolah (sticky / near-school / recent geofence). Sakit di rumah tanpa indikasi dekat sekolah tidak dipaksa terkunci.
- Jika `Device Admin` sedang mati atau baru dibuka flow pemulihannya, **jangan** tumpuk prompt `Accessibility`. Prioritas recovery yang dipakai sekarang adalah:
  - `Device Admin` dipulihkan lebih dulu lewat prompt resmi di `MainActivity`,
  - `MonitoringService` menahan auto-open `Accessibility Settings` selama window recovery admin masih aktif,
  - overlay recovery harus menampilkan tombol sesuai target aktual agar user tidak bingung.
