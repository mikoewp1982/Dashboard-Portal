# Contributing Guide EduLock Siswa

Dokumen ini mengatur cara mencatat dan membangun **APK EduLock siswa** agar perubahan proteksi, izin, dan monitoring tidak saling merusak.

## 1. Sebelum Mulai Kerja
Wajib lakukan:
1. Baca [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Tambahkan entry awal di [BUILD_LOG.md](./BUILD_LOG.md)
3. Pastikan perubahan memang berada di area native siswa
4. Pilih item uji dari [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 2. Branch dan Alur Kerja
Repo saat ini aktif di branch `main`. Untuk kerja tim:
- boleh pakai branch kerja sendiri jika diperlukan
- tetapi apapun model kerjanya, `BUILD_LOG.md` tetap wajib diperbarui

Contoh nama branch:
- `fix/edulock-session-window`
- `feat/edulock-class-permission`
- `docs/edulock-build-handbook`

## 3. Format Commit
Gunakan format yang mudah ditelusuri:

```text
feat(edulock): ...
fix(edulock): ...
docs(edulock): ...
refactor(edulock): ...
```

## 4. Build Minimum Sebelum Menyerahkan Hasil

### Jika perubahan hanya untuk siswa
```powershell
./gradlew :app:assembleStudentRelease
```

### Jika perubahan menyentuh file bersama / service / permission manager
Minimal lakukan:

```powershell
./gradlew :app:assembleStudentRelease
```

## 5. Dokumen yang Wajib Diperbarui

### Selalu wajib
- [BUILD_LOG.md](./BUILD_LOG.md)

### Wajib jika perilaku/fitur berubah
- [CHANGELOG.md](./CHANGELOG.md)

### Wajib jika area uji berubah
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 6. Larangan
- ❌ Menutup perubahan tanpa catatan di `BUILD_LOG.md`
- ❌ Mengubah aturan izin/proteksi tanpa menyebut dampaknya
- ❌ Menyebut build aman padahal uji siswa belum dilakukan
- ❌ Menyembunyikan status signing atau mengklaim live `/e` sudah versi baru sebelum sync + push

## 7. Jika Ada Regresi
1. Cek `BUILD_LOG.md` untuk mengetahui perubahan terakhir
2. Cek `git log -- <file>`
3. Cocokkan dengan `REGRESSION_CHECKLIST.md`
4. Tulis hotfix dan status uji di `BUILD_LOG.md`
