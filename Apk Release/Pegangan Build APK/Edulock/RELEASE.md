# Release Process EduLock Siswa

Dokumen ini adalah alur build release yang sesuai kondisi **EduLock siswa** saat ini.

## 1. Variant yang Dicatat
- `student` untuk APK siswa

Varian `admin` tidak menjadi fokus pegangan ini karena operasionalnya diperlakukan sebagai wrapper web.

## 2. Versi distribusi terkini
- `versionName = 1.3.22`
- `versionCode = 48`
- Arsip versioned: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`
- Alias Final: `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Rollback teruji: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`
- Rollback anti-uninstall selektif: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.19-45.apk`

**Status unduhan web (`/e`):** BELUM di-sync ke rebuild 2026-08-26 19:47. File di `web/public/apk` baru berubah setelah `npm run sync:apk:edulock` + commit/push `main`. Final kanonik = `EduLock-1.3.22-48.apk`.
- Acuan Final terkini (2026-08-26 ~19:47 WIB) = **CRITICAL SECURITY PATCH celah uninstall activation page** + fix tombol Izin Latar Belakang 3 lapis fallback.
  - SHA256: `1E9C87FFBB19B5CBB2432C3A1E1A9280639CF61BDBE921C4CA25689BCD03E42D`
  - Size: `3.925.320 bytes` (≈ 3,74 MB)
  - Versi tetap `1.3.22 / 48` (tidak bump, user instruksikan "belum saya rilis untuk umum").
  - Deploy `/e` live = **TIDAK** (Final only / distribusi manual internal QA).

## 3. Sebelum Build
- [ ] Update atau buat entry di [BUILD_LOG.md](./BUILD_LOG.md)
- [ ] Update [CHANGELOG.md](./CHANGELOG.md) jika ada perubahan perilaku/fitur
- [ ] Tentukan item uji dari [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 4. Perintah Build

### Release siswa
```powershell
cd "D:\Dashboard Portal\native-mobile-edulock"
./gradlew :app:assembleStudentRelease
```

## 5. Output Aktual
- `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`

Salin ke Final dengan dua nama (arsip versioned + alias):

```powershell
Copy-Item "...\EduLock-studentRelease.apk" "D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk"
Copy-Item "...\EduLock-studentRelease.apk" "D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk"
```

## 6. Catatan Penting
- `release` memakai `signingConfig` **release** dari `keystore.properties` (bukan debug)
- `isMinifyEnabled = true`
- `isShrinkResources = true`
- Nama file output Gradle sudah otomatis `EduLock-<variant>.apk`

## 7. Penamaan File Distribusi
Untuk arsip Final, pakai pola versioned:

```text
EduLock-<versionName>-<versionCode>.apk
```

Contoh terkini: `EduLock-1.3.22-48.apk`. Alias `EduLock-studentRelease.apk` wajib ikut di-overwrite agar sinkron.

## 8. Folder Distribusi Umum

Kanonik (rilis yang dibagikan / disinkronkan ke web):

```text
D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk
```

Arsip/uji lama:

```text
D:\Dashboard Portal\Apk Release\OK_4
```

Handoff lapangan:
- Markdown (sumber): `D:\Dashboard Portal\native-mobile-edulock\HANDOFF_LAPANGAN_EDULOCK.md`
- Salinan pegangan: `Pegangan Build APK/Edulock/HANDOFF_LAPANGAN_EDULOCK.md`
- Word Final: `D:\Dashboard Portal\Apk Release\Final\HANDOFF_LAPANGAN_EDULOCK.docx`

## 9. Sesudah Build
- [ ] Catat hasil build di `BUILD_LOG.md`
- [ ] Catat lokasi output asli
- [ ] Catat lokasi file hasil copy
- [ ] Tulis apa yang sudah dan belum diuji
- [ ] Jangan klaim live `/e` sudah versi baru sebelum sync + push App Hosting

## 10. Aturan Kejujuran Status
- Build sukses tidak otomatis berarti proteksi lapangan aman
- Jangan samarkan status uji (sleep lama, Device Admin, daftar aplikasi)
