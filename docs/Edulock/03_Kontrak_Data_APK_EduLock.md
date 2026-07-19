# Kontrak Data APK EduLock

## 1. Prinsip Umum

- APK EduLock target wajib memakai Firebase project `dashboard-portal-179f7`.
- Login siswa wajib memakai identitas yang sama dengan APK GAS siswa.
- Semua query harus tenant-aware dan hemat data.
- Hindari full scan RTDB.

## 2. Kontrak Identitas

### A. Input Login

Input minimal yang boleh dipakai:

- `npsn`
- kredensial siswa yang sama dengan APK GAS siswa

Catatan:

- jika UX akhirnya tetap memisahkan field `username` dan `nisn`, resolver tetap wajib memprioritaskan `username`
- jangan menganggap input numerik otomatis `nisn`

### B. Resolusi Tenant

- `npsn -> schoolId`

APK harus resolve tenant lebih dulu sebelum query siswa.

### C. Resolusi Siswa

Urutan wajib:

1. `username`
2. `nisn`

## 3. Node Data Siswa

Sumber utama:

- `gas/schools/{schoolId}/students/{studentId}`

Field minimal yang harus dibaca/ditulis:

- `username`
- `nisn`
- `name`
- `className`
- `schoolId`
- `npsn`
- `deviceId`
- `device`

Mirror tambahan bila dipakai:

- `master_students/{nisn}`

## 4. Kontrak Binding Device

Saat login/register sukses, APK EduLock harus:

1. memastikan akun tidak sedang terikat di device lain
2. menulis `deviceId` dan `device` ke siswa tenant aktif
3. bila arsitektur mengharuskan, sinkron juga ke `master_students/{nisn}`

Reset binding dilakukan dari web admin EduLock melalui endpoint:

- `/api/admin/edulock`
- action: `reset-student-device`

## 5. Kontrak Runtime EduLock

APK harus mengirim snapshot runtime ke:

- `active_devices/{schoolId}/{deviceId}`

Field minimum yang disarankan:

- `deviceId`
- `studentId`
- `nisn`
- `username`
- `name`
- `lastSeenAt`
- `battery`
- `latitude`
- `longitude`
- `isOutOfZone`
- `trustScore`
- `status`
- `isEmergencyUnlock`
- `isUninstallBypass`
- `isPermissionActive`

## 6. Kontrak School Config

APK boleh membaca konfigurasi sekolah yang relevan dari tenant aktif, misalnya:

- jadwal sekolah
- hari libur
- geofence
- policy GPS

Node finalnya harus mengikuti kontrak konfigurasi sekolah yang sudah dipakai ekosistem GAS dan web EduLock.

## 7. Kontrak yang Tidak Boleh Dipakai Mentah

Jangan angkut mentah dari referensi tanpa validasi:

- root `students/{nisn}` gaya lama
- `device_uuid`
- root `school_config` global tunggal
- endpoint auth lama EduLock berbasis NISN + nama

Semua itu harus dipetakan ulang ke arsitektur GAS proyek ini.
