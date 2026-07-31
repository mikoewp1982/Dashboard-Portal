# Catatan Hardening Integrasi GAS

Dokumen ini menjadi pegangan tim untuk merapikan titik integrasi Web GAS <-> APK GAS Siswa/Guru yang saat ini sudah berjalan, tetapi masih memiliki beberapa area rawan mismatch pada `schoolId`.

Update terakhir: 2026-07-31 00:20

## Ringkasan Status

- Jalur utama integrasi sudah nyambung:
  - roster siswa/guru
  - presensi sekolah
  - presensi sholat
  - kedisiplinan
  - notifikasi inbox
  - virtual pet
- Risiko utama yang masih tersisa:
  - beberapa hook/modul web masih memakai `schoolId` mentah langsung ke path RTDB
  - sebagian modul sudah memakai `normalizeSchoolId()` dan `getSchoolIdVariants()`, tetapi belum seragam di semua fitur
  - kondisi ini aman bila `schoolId` dari claim admin selalu kanonik, tetapi rawan untuk tenant lama / key legacy

## Standar Yang Wajib Dipakai

- Normalisasi utama:
  - `trim().toLowerCase()`
- Util standar yang wajib dijadikan acuan:
  - `web/src/lib/gas/schoolId.ts`
- Aturan tim:
  - jangan bentuk path RTDB GAS langsung dari `schoolId` mentah
  - gunakan `normalizeSchoolId()` untuk path kanonik
  - gunakan `getSchoolIdVariants()` bila modul masih perlu kompatibilitas legacy key

## Titik Rawan Yang Perlu Dihardening

### 1. Discipline records by school masih memakai `schoolId` mentah

- File:
  - `web/src/hooks/gas/discipline/useGasDiscipline.ts`
- Titik rawan:
  - baca `discipline_records_by_school/${schoolId}`
  - tulis fanout `discipline_records_by_school/${schoolId}/${recordId}`
- Risiko:
  - data kedisiplinan bisa terpecah jika ada tenant yang memakai key legacy / non-kanonik
  - web membaca node berbeda dari yang dibaca APK
- Tindakan:
  - ubah seluruh akses `discipline_records_by_school/*` agar memakai `normalizeSchoolId()`
  - bila masih perlu kompatibilitas lama, baca/tulis melalui `getSchoolIdVariants()`

### 2. Discipline rules tenant belum seragam

- File:
  - `web/src/hooks/gas/discipline/useGasDisciplineRules.ts`
- Titik rawan:
  - path tenant settings masih memakai `gas/schools/${schoolId}/settings/disciplineRules`
  - mirror `discipline_rules_by_school/${normalizedSchoolId}` sudah dinormalisasi
- Risiko:
  - rules yang disimpan ke tenant settings bisa beda scope dengan mirror by-school
  - APK dan web berpotensi membaca sumber yang berbeda pada tenant tertentu
- Tindakan:
  - samakan semua path tenant menjadi schoolId kanonik
  - review prioritas sumber data antara:
    - `gas/schools/{schoolId}/settings/disciplineRules`
    - `discipline_rules_by_school/{schoolId}`

### 3. Hook roster GAS masih memakai `schoolId` mentah

- File:
  - `web/src/hooks/gas/useGasRecords.ts`
  - `web/src/components/gas/shared/gasConfig.ts`
- Titik rawan:
  - path `gas/schools/${schoolId}/students`
  - path `gas/schools/${schoolId}/teachers`
- Risiko:
  - halaman Data Siswa / Data Guru bisa membaca path berbeda jika ada schoolId lama yang tidak kanonik
- Tindakan:
  - normalisasi `schoolId` sebelum membentuk path
  - pastikan seluruh panel GAS memakai sumber schoolId yang sama
- Status 2026-07-31:
  - fallback loading/error pada `useGasRecords.ts` sudah dipasang agar panel tidak lagi terjebak spinner saat `schoolId` kosong atau subscribe RTDB gagal
  - panel `web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx` sudah menampilkan pesan fallback bila sesi admin belum membawa `schoolId`
  - normalisasi `schoolId` kanonik pada path roster masih belum selesai, jadi butir hardening ini baru tertangani sebagian

### 4. Notification recipients hook masih memakai `schoolId` mentah

- File:
  - `web/src/hooks/gas/notifications/useNotificationRecipients.ts`
- Titik rawan:
  - baca `gas/schools/${schoolId}/classes`
  - baca `gas/schools/${schoolId}/students`
- Risiko:
  - daftar target broadcast di web bisa tidak cocok dengan inbox target yang dipakai API
- Tindakan:
  - samakan hook recipients dengan normalisasi yang dipakai API notifications
  - hindari kondisi UI membaca tenant A tetapi API menulis ke tenant B

### 5. Prayer references masih campuran antara kanonik dan mentah

- File:
  - `web/src/hooks/gas/attendance/useGasPrayerAttendance.ts`
- Titik rawan:
  - data presensi sholat sudah memakai canonical + variants
  - tetapi referensi roster/classes masih ada bagian yang memakai `schoolId` mentah
- Risiko:
  - data absensi sholat tampil, tetapi daftar kelas/siswa referensi bisa meleset pada tenant tertentu
- Tindakan:
  - samakan semua referensi roster/classes ke schoolId kanonik
  - cek ulang seluruh `gas/schools/*` di hook ini

## Prioritas Pengerjaan Tim

1. `useGasDiscipline.ts`
2. `useGasDisciplineRules.ts`
3. `useGasRecords.ts` + `gasConfig.ts`
4. `useNotificationRecipients.ts`
5. `useGasPrayerAttendance.ts`

## Checklist Teknis Untuk Tim

- [ ] Semua akses path `gas/schools/*` di web sudah memakai schoolId kanonik
- [ ] Semua akses path `*_by_school/*` di web sudah memakai schoolId kanonik
- [ ] Modul yang masih perlu backward compatibility sudah memakai `getSchoolIdVariants()`
- [ ] Tidak ada lagi helper normalisasi lokal yang duplikat bila util standar sudah tersedia
- [x] Hook roster `useGasRecords.ts` tidak lagi membiarkan loading menggantung saat `schoolId` kosong atau subscription RTDB gagal
- [x] Panel `7 KAIH` sudah punya fallback message saat sesi admin belum membawa `schoolId`
- [ ] Audit ulang fanout write agar path write web sama dengan path read APK
- [ ] Build web sukses sesudah hardening
- [ ] Smoke test halaman GAS utama sesudah hardening:
  - Data Siswa
  - Data Guru
  - Kedisiplinan
  - Presensi Sholat
  - Broadcast Notifikasi

## Catatan Implementasi

- Saat ini sistem belum rusak; integrasi utama sudah berjalan.
- Catatan ini dibuat untuk mencegah mismatch diam-diam di tenant lama, data legacy, atau saat tim menambah fitur baru.
- Setelah hardening selesai, tim disarankan membuat satu aturan tetap:
  - semua modul GAS Web wajib impor util dari `web/src/lib/gas/schoolId.ts`
  - dilarang membuat normalisasi `schoolId` versi lokal kecuali ada alasan khusus yang terdokumentasi
