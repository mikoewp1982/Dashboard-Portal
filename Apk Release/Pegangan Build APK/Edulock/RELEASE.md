# Release Process EduLock Siswa

Dokumen ini adalah alur build release yang sesuai kondisi **EduLock siswa** saat ini.

## 1. Variant yang Dicatat
- `student` untuk APK siswa

Varian `admin` tidak menjadi fokus pegangan ini karena operasionalnya diperlakukan sebagai wrapper web.

## 2. Versi distribusi terkini
- `versionName = 1.3.23`
- `versionCode = 49`
- Arsip versioned: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.23-49.apk`
- Alias Final: `D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk`
- Arsip sebelumnya: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.22-48.apk`
- Rollback teruji: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.12-38.apk`
- Rollback anti-uninstall selektif: `D:\Dashboard Portal\Apk Release\Final\EduLock-1.3.19-45.apk`

**Status unduhan web (`/e` dan `/edulock/install`):** file lokal `web/public/apk` **sudah di-sync & di-deploy live** ke versi `EduLock-1.3.23-49.apk` (commit `f9670945`).

### Rilis Terkini (2026-09-01) — [RELEASE v1.3.23 / 49]
- **Acuan Final/public live (2026-09-01):** build `1.3.23 (49)`
  - SHA256: `255ED1FA9261223D36A33F919540D005C8A65D8E52E2A4A29BEBF324D9C437DF`
  - Size: `3.932.567 bytes`
  - **Perbaikan Utama:**
    1. **Fix Infinite Loop Pet Dead Lock**: Menutup badai activity spawn dan menghapus dialog sistem Android *"Penyematan Layar"* (`startLockTask`).
    2. **Hapus Spam Notifikasi Aksesibilitas di Rumah**: Mencabut prompt notifikasi heads-up 30 detik di `MonitoringService.kt` saat di luar jam sekolah.
    3. **Relaksasi Dialog Aksesibilitas di `MainActivity`**: Dialog modal paksa *"Wajib Aktifkan Proteksi"* otomatis ditiadakan di rumah / mode libur.
    4. **Hardening Device Admin Policy**: Menghapus tag `<wipe-data />`, `<reset-password />`, dll dari `device_admin.xml`, hanya mempertahankan `<force-lock />`.
  - Deploy `/e` dan `/edulock/install` live = **SUDAH (Deployed to GitHub origin/main)**.

### Patch sebelumnya (2026-08-31) — [BUG FIX IFP SMART TV]
- **Acuan Final/public lokal (2026-08-31):** build `1.3.22 (48)` patch **Fix Kompatibilitas Smart TV/IFP tanpa GPS satellite hardware**
  - SHA256: `707E64BB56356E22BE124C3B865DA2860D7BC94D600A1CC6457C8BED1EDD...`
  - Versi tetap `1.3.22 / 48` (tidak bump, sesuai instruksi user pertahankan nomor versi untuk patch)
  - Root cause diatasi: `isGpsEnabled()` hanya menerima GPS_PROVIDER (satellite), padahal TV hanya punya NETWORK_PROVIDER
  - Perubahan 3 lapis: `LocationMonitor.isGpsEnabled()` pakai logika OR (GPS atau Network), fallback `MainActivity.isGPSEnabled()` diselaraskan, hardware GPS di AndroidManifest dijadikan `required="false"`
  - Side benefit: HP vendor China yang menonaktifkan GPS satellite hemat baterai juga tidak lagi dipusingkan overlay GPS

### Patch sebelumnya (superseded — 2026-08-28 18:51 WIB)
- Acuan Final rebuild 2026-08-28 18:51 = build `1.3.22 (48)` yang membawa patch keamanan `1.3.22` sebelumnya + fitur **Temukan Perangkat** (alarm keras + ACK status ke admin) + **patch fallback audio 2 lapis** (adjustStreamVolume `FLAG_SHOW_UI`, fallback `STREAM_MUSIC`, Vibrator fallback, status ACK detail `ALARM_STARTED_FALLBACK_MUSIC / ALARM_STARTED_VIBRATION_ONLY / FAILED_SILENT`) + **hardening enforcement** untuk bug lapangan internet mati total dan recovery Accessibility.
  - SHA256: `F6D6C3EEE4882266CB59BFFC60150BEB8A73B4F7D533BB972CA2D90D86ADEC34`
  - Size: `3.932.182 bytes`
  - Versi tetap `1.3.22 / 48` (tidak bump, sesuai instruksi user pertahankan versi sekarang)
  - QA HP fisik yang sudah lulus pada build ini: `internet mati total -> lewat masa tenggang 60 detik mengunci` dan `Accessibility OFF -> admin ON -> overlay diabaikan tetap memaksa stay di EduLock`
  - Deploy `/e` live = **BELUM**; alias publik lokal sudah ditimpa, tetapi commit/push sengaja ditahan.

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
- [ ] Jangan klaim live `/e` sudah versi baru sebelum sync + push App Hosting benar-benar selesai

## 10. Aturan Kejujuran Status
- Build sukses tidak otomatis berarti proteksi lapangan aman
- Jangan samarkan status uji (sleep lama, Device Admin, daftar aplikasi)
