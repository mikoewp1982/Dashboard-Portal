# Release Process EduLock Siswa

Dokumen ini adalah alur build release yang sesuai kondisi **EduLock siswa** saat ini.

## 1. Variant yang Dicatat
- `student` untuk APK siswa

Varian `admin` tidak menjadi fokus pegangan ini karena operasionalnya diperlakukan sebagai wrapper web.

## 2. Sebelum Build
- [ ] Update atau buat entry di [BUILD_LOG.md](./BUILD_LOG.md)
- [ ] Update [CHANGELOG.md](./CHANGELOG.md) jika ada perubahan perilaku/fitur
- [ ] Tentukan item uji dari [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 3. Perintah Build

### Release siswa
```powershell
./gradlew :app:assembleStudentRelease
```

## 4. Output Aktual
- `app/build/outputs/apk/student/release/EduLock-studentRelease.apk`

## 5. Catatan Penting
- Release saat ini masih memakai debug signing config
- Minify dan shrink resources aktif pada release
- Nama file output release sudah otomatis menjadi `EduLock-<variant>.apk`

## 6. Penamaan File Distribusi
Jika hasil akan diberikan ke user, salin dengan nama distribusi yang jelas, misalnya:

```text
EduLock-Siswa-YYYY-MM-DD_HH-mm-release.apk
```

## 7. Folder Distribusi Umum

Kanonik (rilis yang dibagikan / disinkronkan ke web):

```text
D:\Dashboard Portal\Apk Release\Final\EduLock-studentRelease.apk
```

Arsip/uji lama:

```text
D:\Dashboard Portal\Apk Release\OK_4
```

Versi distribusi terkini yang dicatat: `1.3.4` (`versionCode 30`), ship `24e3ffa6`.
Handoff lapangan Word: `D:\Dashboard Portal\Apk Release\Final\HANDOFF_LAPANGAN_EDULOCK.docx`

## 8. Sesudah Build
- [ ] Catat hasil build di `BUILD_LOG.md`
- [ ] Catat lokasi output asli
- [ ] Catat lokasi file hasil copy
- [ ] Tulis apa yang sudah dan belum diuji

## 9. Aturan Kejujuran Status
- Build sukses tidak otomatis berarti proteksi lapangan aman
- Jika release masih debug-signed, jangan disamarkan di dokumen atau handoff
