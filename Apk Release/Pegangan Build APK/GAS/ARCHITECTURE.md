# Architecture GAS

## Struktur Aktual

```text
native-mobile-gas/
└── app/
    ├── src/
    │   ├── main/
    │   ├── kepala/
    │   ├── androidTest/
    │   └── test/
    └── build.gradle.kts
```

## Fakta Penting
1. Saat ini **tidak ada** `src/guru` dan `src/siswa` terpisah.
2. Mayoritas kode semua flavor berada di `src/main`.
3. Pembedaan perilaku dilakukan lewat:
   - `BuildConfig.FLAVOR`
   - role user (`student`, `teacher`, `staff`, `principal`)
   - `Navigation.kt`
   - guard/security dan route gating
4. `src/kepala` dipakai hanya untuk override atau aset/komponen yang memang khusus kepala sekolah.

## Flavor Aktif
- `siswa`
- `guru`
- `kepala`

## Flavor Khusus
- `legacySiswa`
- `legacyGuru`
- `legacyKepala`
- `universal`

Flavor khusus ini tidak boleh dianggap target release harian. Build hanya jika ada permintaan eksplisit.

## Aturan Penempatan Kode
1. Jika dipakai lintas role/flavor, taruh di `src/main`.
2. Jika benar-benar khusus kepala, baru pertimbangkan `src/kepala`.
3. Jangan membuat `src/guru` atau `src/siswa` baru tanpa alasan arsitektural yang jelas.
4. Jika fitur baru hanya berbeda sedikit antar role, utamakan reuse di `src/main` dengan guard yang rapi.
5. Dilarang mengganti total file besar hanya untuk menambahkan satu fitur baru. Tambahkan perubahan secara presisi.

## File Berdampak Tinggi
Jika file berikut disentuh, uji regresi wajib lebih ketat:

### Navigasi, keamanan, dan sesi
- `app/src/main/java/com/satupintu/mobile/ui/Navigation.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt`
- `app/src/main/java/com/satupintu/mobile/util/SecurityUtils.kt`
- `app/src/main/java/com/satupintu/mobile/ui/EduLockComplianceGate.kt`

### Layar siswa
- `app/src/main/java/com/satupintu/mobile/ui/screens/AttendanceScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/SevenHabitsScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/VirtualPetScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/NativePdfReaderScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerScreen.kt` (Dzuhur; kartu Aturan Hari = `attendance/schedules`)
- `app/src/main/java/com/satupintu/mobile/ui/screens/student/PrayerDhuhaJumatScreen.kt` (Dhuha/Jumat; `prayer_v2` saja)
- `app/src/main/java/com/satupintu/mobile/ui/screens/student/*`

### Layar guru
- `app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherStudentsScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherAttendanceScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherPrayerScreen.kt`
- `app/src/main/java/com/satupintu/mobile/ui/screens/teacher/TeacherSevenHabitsScreen.kt`

### Data dan view model
- `app/src/main/java/com/satupintu/mobile/data/repository/*`
- `app/src/main/java/com/satupintu/mobile/ui/viewmodel/*`

## Output Build
| Flavor | Debug | Release |
|---|---|---|
| `siswa` | `app/build/outputs/apk/siswa/debug/` | `app/build/outputs/apk/siswa/release/` |
| `guru` | `app/build/outputs/apk/guru/debug/` | `app/build/outputs/apk/guru/release/` |
| `kepala` | `app/build/outputs/apk/kepala/debug/` | `app/build/outputs/apk/kepala/release/` |

## Kontrak Arsitektur
1. Fitur lama tidak boleh dianggap aman hanya karena file berhasil compile.
2. Jika edit `src/main`, anggap minimal flavor `siswa`, `guru`, dan `kepala` ikut terdampak sampai terbukti sebaliknya.
3. Setiap penambahan fitur wajib menyebut:
   - file yang disentuh,
   - flavor yang terdampak,
   - fitur lama di sekitar area itu yang diuji ulang.
4. Catatan operasional build dan pengujian wajib masuk ke [BUILD_LOG.md](./BUILD_LOG.md).
5. Dzuhur vs Dhuha/Jumat **jangan satu sumber**. Dzuhur hari efektif = `attendance/schedules`. Dhuha/Jumat = `prayer_v2` schedules + overrides. Jangan baca `prayer/schedules` warisan untuk kartu Aturan Hari.
