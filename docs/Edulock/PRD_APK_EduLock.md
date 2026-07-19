# PRD APK EduLock

## 1. Tujuan

Membangun APK EduLock untuk siswa sebagai aplikasi pengunci/perlindungan perangkat Android yang terintegrasi dengan ekosistem GAS, khususnya:

- memakai identitas siswa yang sama dengan APK GAS siswa
- memakai Firebase project kanonik yang sama: `dashboard-portal-179f7`
- membaca tenant sekolah yang sama dengan sistem web admin GAS/EduLock
- tetap kompatibel dengan batasan Spark Plan

## 2. Sumber Referensi

- Folder referensi visual dan arsitektur:
  - `D:\Satu Pintu\edulock-mobile`
- Status folder referensi:
  - **read-only**
  - tidak boleh diubah langsung
  - hanya dipakai sebagai dasar porting UI, flow, komponen, dan behavior

## 3. Prinsip Porting

1. UI/UX sedekat mungkin dengan referensi.
2. Struktur kode wajib dimodularisasi, tidak boleh menyalin file raksasa tanpa refactor.
3. Semua jalur data harus disesuaikan ke arsitektur proyek kita, bukan menyalin RTDB lama referensi mentah-mentah.
4. Login siswa wajib memakai identitas yang sama dengan APK GAS siswa.

## 4. Aktor

### A. Siswa

- login ke EduLock dengan akun siswa yang sama seperti APK GAS siswa
- menjalankan setup izin perangkat
- melihat status proteksi
- meminta izin penggunaan HP jika flow tersebut diaktifkan

### B. Admin Sekolah

- mengawasi runtime perangkat dari web EduLock admin
- mereset binding device
- nanti mengelola izin penggunaan HP, uninstall, dan kebijakan keamanan

## 5. Scope Versi Pertama

Scope fase build awal APK EduLock:

1. login siswa terintegrasi ke identitas GAS siswa
2. binding device ke node siswa tenant aktif
3. setup izin wajib:
   - lokasi
   - overlay
   - accessibility
   - device admin
   - battery optimization
4. monitoring service dasar
5. enforcement dasar sesuai mode/jadwal/zona sekolah
6. reporting runtime minimum ke backend EduLock

## 6. Login dan Identitas

Ini adalah aturan paling penting:

- **Akun login siswa APK EduLock harus sama dengan akun login siswa APK GAS siswa**
- Artinya EduLock **tidak boleh** membuat identitas paralel yang terpisah dari ekosistem GAS

### Konsekuensi implementasi

1. Jalur identitas harus mengikuti kontrak GAS siswa:
   - lookup tenant dari `npsn`
   - resolusi identitas siswa dengan prioritas `username` terlebih dahulu, lalu `nisn`
2. Binding device harus menulis ke jalur siswa tenant aktif yang sama seperti GAS siswa
3. Jika siswa sudah terikat di perangkat lain, EduLock harus menolak binding kedua

## 7. Konsep Arsitektur Target

APK EduLock target adalah hasil **porting terarah** dari referensi, bukan clone penuh. Area yang dipertahankan:

- Registration / onboarding
- Setup izin
- Monitoring foreground service
- Overlay/lock screen
- Accessibility protection
- Device admin hardening
- geofence + school schedule + holiday handling

Area yang wajib disesuaikan:

- Firebase project
- path RTDB
- auth siswa
- binding device
- telemetry/reporting
- query data tenant

## 8. Keputusan Arsitektur yang Sudah Dikunci

1. Firebase project:
   - `dashboard-portal-179f7`
2. login siswa:
   - satu identitas dengan GAS siswa
3. tenant resolution:
   - `npsn -> schoolId`
4. identitas siswa:
   - `username` lebih dulu, lalu `nisn`
5. product isolation:
   - nanti mengikuti strategi package/flavor terpisah, bukan satu APK campur semua role

## 9. Bukan Scope Saat Ini

Versi pertama dokumen ini belum memaksa:

- port penuh admin wrapper di APK EduLock
- seluruh fitur emergency/permission code sampai production-ready
- dukungan semua OEM hardening
- telemetry lengkap 100% final

Fokus utama dulu: **APK siswa EduLock yang benar, stabil, tenant-aware, dan sinkron dengan identitas GAS siswa**.
