# Contributing Guide GAS

Dokumen ini mengatur cara mencatat dan membangun APK `GAS` agar perubahan tidak hilang saat banyak orang menyentuh kode yang sama.

## 1. Sebelum Mulai Kerja
Wajib lakukan 4 hal berikut:

1. Baca [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Tambahkan entry awal di [BUILD_LOG.md](./BUILD_LOG.md) dengan status `Planned` atau `In Progress`
3. Identifikasi flavor terdampak
4. Tentukan fitur lama apa yang wajib dicek ulang lewat [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 2. Branch dan Alur Kerja
Kondisi repo saat dokumen ini ditulis sedang aktif di branch `main`. Karena itu:
- jika kerja solo/hotfix cepat: boleh kerja dari kondisi repo aktif, tetapi **wajib** catat di `BUILD_LOG.md`
- jika kerja tim/kolaboratif: lebih aman gunakan branch kerja sendiri lalu merge setelah review

Contoh nama branch jika dipakai:
- `fix/gas-siswa-edulock-gate`
- `feat/gas-guru-seven-habits`
- `docs/gas-build-handbook`

## 3. Format Commit
Gunakan format yang mudah dicari:

```text
feat(gas): ...
fix(gas): ...
docs(gas): ...
refactor(gas): ...
```

## 4. Aturan Keras Saat Mengubah Kode
- Jangan replace total file besar tanpa alasan sangat jelas
- Jangan menghapus perilaku lama hanya karena fokus sedang di fitur baru
- Jika edit file di `src/main`, anggap `siswa`, `guru`, dan `kepala` sama-sama berisiko terdampak
- Jika menyentuh file berdampak tinggi, smoke test wajib lebih luas

## 5. Catatan yang Wajib Diperbarui

### Selalu wajib
- [BUILD_LOG.md](./BUILD_LOG.md)

### Wajib jika perilaku/fitur berubah
- [CHANGELOG.md](./CHANGELOG.md)

### Wajib jika kontrak uji berubah atau ada area baru yang harus dicek
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

## 6. Build Minimum Sebelum Menyerahkan Hasil

### Jika hanya flavor siswa terdampak
```powershell
./gradlew :app:compileSiswaDebugKotlin
./gradlew :app:assembleSiswaRelease
```

### Jika hanya flavor guru terdampak
```powershell
./gradlew :app:compileGuruDebugKotlin
./gradlew :app:assembleGuruRelease
```

### Jika hanya flavor kepala terdampak
```powershell
./gradlew :app:compileKepalaDebugKotlin
./gradlew :app:assembleKepalaRelease
```

### Jika edit file `src/main`, `Navigation`, `Login`, repository, atau security
Build minimal ketiga flavor utama:

```powershell
./gradlew :app:compileSiswaDebugKotlin
./gradlew :app:compileGuruDebugKotlin
./gradlew :app:compileKepalaDebugKotlin
```

## 7. Setelah Build
1. Catat hasil build di `BUILD_LOG.md`
2. Catat output APK dan lokasi copy final
3. Tandai item regresi yang benar-benar diuji
4. Jika ada yang belum diuji, tulis jujur di log

## 8. Larangan
- ❌ Menutup pekerjaan tanpa update `BUILD_LOG.md`
- ❌ Menulis changelog palsu atau status build yang tidak benar
- ❌ Menganggap compile sukses berarti regresi aman
- ❌ Menghapus fitur lama tanpa menyebut dampaknya
- ❌ Menyembunyikan flavor terdampak yang sebenarnya ikut berubah

## 9. Jika Fitur Lama Hilang
Lakukan urutan ini:
1. Buka `BUILD_LOG.md` untuk lihat siapa terakhir mengubah area itu
2. Cek `git diff` dan `git log -- <file>`
3. Cocokkan dengan `REGRESSION_CHECKLIST.md`
4. Tulis temuan dan hotfix di `BUILD_LOG.md`, bukan hanya di chat
