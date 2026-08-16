# Rekomendasi Pengembangan Rekap Dhuha & Jum'at (Web Admin GAS)

Dokumen ini adalah catatan desain untuk melengkapi fitur monitoring **Rekap Presensi Sholat** agar mendukung **Sholat Dhuha** dan **Sholat Jum'at** yang bersumber dari konfigurasi `prayer_v2` dan log `prayer_attendance_v2`.

Target pembaca: tim pengembang internal.

## Status (2026-08-16)
**DONE / shipped.** Menu **Rekap Dhuha & Jumat** + pengaturan `prayer_v2` sudah live; restore deploy `39f8bb48`, matching classIds `13c86d2f`, normalize jam `HH.mm`→`HH:mm` `b3f5ce4f`. Dokumen ini dipertahankan sebagai acuan desain (bukan backlog terbuka).

Catatan operasional terkait:
- Override / Generator Jumat = **tanggal + kelas** saja; **Jam** diatur di **Jadwal Sholat Per Kelas**.
- APK Siswa Final terkait: `1.0.78` (match + jam) → `1.0.79` (NavigationKt MultiDex) → `1.0.80` (Virtual Pet sync) — URL unduhan web belum di-update.

## Ringkasan
- Rekomendasi utama: buat **menu baru** untuk rekap `Dhuha & Jum'at` agar tidak merusak halaman rekap `Dzuhur` yang sudah berjalan.
- Logika rekap `Dhuha/Jum'at` tidak bisa meniru `Dzuhur` karena sifatnya **tidak wajib untuk semua siswa setiap hari** (berbasis `jadwal per kelas` + `override per tanggal`).
- Perhitungan rekap bulanan harus punya denominator **Wajib** (jumlah hari kesempatan yang memang dijadwalkan untuk siswa itu), bukan sekadar jumlah hari efektif sekolah.

## Kenapa Jangan Digabung dengan Rekap Dzuhur
- Dzuhur adalah aktivitas harian semua siswa (kecuali non-muslim / hari nonaktif).
- Dhuha dan Jum'at berbasis `schedule/override` per kelas, sehingga untuk siswa tertentu bisa **0 kewajiban** pada bulan tertentu.
- Jika digabung, persentase dan “Tidak Sholat” akan bias (siswa dihitung TS padahal memang tidak dijadwalkan).

## Usulan UI (Menu Baru)
Tambahkan menu baru di sidebar Admin GAS (Monitoring & Laporan):
- Label: `Rekap Dhuha & Jum'at`
- Route/tab baru (contoh): `prayer-monitoring-v2` atau `prayer-monitoring-sunnah`

Di dalam halaman:
- Selector jenis sholat: `Dhuha` | `Jum'at`
- Mode laporan:
  - `Rekap Bulanan`
  - `Riwayat Harian`
- Filter konsisten dengan rekap Dzuhur:
  - Kelas
  - Bulan + Tahun
  - Pencarian siswa
  - Tombol `Cetak` dan `Ekspor`

Referensi UI existing yang bisa direuse:
- Panel rekap Dzuhur: [GasPrayerReportPanel.tsx](file:///D:/Dashboard%20Portal/web/src/components/gas/prayer/GasPrayerReportPanel.tsx)
- UI tabel + export: [PrayerRecapPanel.tsx](file:///D:/Dashboard%20Portal/web/src/components/gas/prayer/PrayerRecapPanel.tsx)

## Sumber Data
### 1) Konfigurasi `prayer_v2`
RTDB:
- `school_settings/{schoolId}/prayer_v2/types`
- `school_settings/{schoolId}/prayer_v2/schedules`
- `school_settings/{schoolId}/prayer_v2/overrides`

Hook existing:
- [useGasPrayerConfig.ts](file:///D:/Dashboard%20Portal/web/src/hooks/gas/attendance/useGasPrayerConfig.ts)

### 2) Log presensi v2 (Dhuha/Jum'at)
RTDB:
- `prayer_attendance_v2_by_school/{schoolId}`
  - setiap record wajib punya `prayerType: DHUHA|JUMAT`
  - `date` epoch millis
  - `status: PRAY|NOT_PRAY|PERMIT|HALANGAN`

Catatan:
- Rekap Dzuhur existing membaca `prayer_attendance_by_school/*` via [useGasPrayerAttendance.ts](file:///D:/Dashboard%20Portal/web/src/hooks/gas/attendance/useGasPrayerAttendance.ts).
- Untuk v2, buat hook baru khusus: `useGasPrayerAttendanceV2`.

### 3) Data siswa & kelas
RTDB:
- `gas/schools/{schoolId}/students`
- `gas/schools/{schoolId}/classes`

Polanya sudah dipakai di [useGasPrayerAttendance.ts](file:///D:/Dashboard%20Portal/web/src/hooks/gas/attendance/useGasPrayerAttendance.ts).

## Aturan Wajib (Eligibility + Schedule)
Status yang harus dibedakan jelas pada rekap:
- `Tidak dijadwalkan`: siswa tidak memiliki kewajiban pada tanggal tersebut (tidak masuk jadwal/override).
- `Non-Muslim`: jika `types.{prayerType}.requireMuslim = true` dan siswa non-muslim.
- `Tidak wajib`: khusus `Jum'at` jika `eligibleGender=male` dan siswa bukan putra (atau sebaliknya).

### Prioritas jadwal untuk menentukan kewajiban per tanggal
Untuk menentukan apakah siswa “wajib” pada `tanggal X`:
1. Override `deactivate` membatalkan jadwal.
2. Override `activate` mengaktifkan walaupun tidak ada schedule mingguan.
3. Jika tidak ada override, jatuh ke `schedules` mingguan.

Catatan implementasi:
- Normalisasi nama kelas harus sama dengan sistem yang dipakai saat menyimpan jadwal (`VII-A`, `7A`, `VII A`, dll). Gunakan normalizer tunggal yang dipakai di panel config atau definisikan util baru untuk parity.

## Rekap Bulanan yang Disarankan (Agar Tidak Bias)
Untuk setiap siswa:
- Hitung `wajibCount` = jumlah tanggal dalam bulan yang:
  - sholat type aktif (`types.enabled`)
  - memenuhi rule agama/gender
  - dan **terjadwal** untuk kelasnya (schedule/override)
- Hitung log harian:
  - `PRAY`, `NOT_PRAY`, `PERMIT`, `HALANGAN`
- Persentase:
  - `percent = PRAY / wajibCount` (jika wajibCount=0, tampilkan `-` atau `0%` dengan label “Tidak dijadwalkan bulan ini”)

Kolom tabel rekomendasi:
- `Wajib`
- `Sh` (Sudah)
- `TS` (Tidak Sholat)
- `I` (Izin)
- `Hal` (Halangan)
- `%`

## Riwayat Harian
Filter:
- tanggal (mengikuti bulan/tahun filter)
- jenis sholat
- kelas (optional)

Konten:
- Tanggal
- Jam presensi (dari `date`)
- NISN
- Nama
- Kelas
- Status (label mengikuti `PrayerRecapPanel.tsx`)
- Keterangan (notes bila ada)

## Struktur Implementasi yang Aman (Minimal Risiko)
1. Buat halaman/menu baru, jangan modifikasi `GasPrayerReportPanel.tsx` existing.
2. Buat hook baru `useGasPrayerAttendanceV2(schoolId, month, year, prayerType)`:
   - fetch `students/classes`
   - fetch `prayer_attendance_v2_by_school/{variant}` (perhatikan varian schoolId)
   - filter by month/year dan `prayerType`
3. Buat komponen panel baru `GasPrayerV2ReportPanel`:
   - re-use UI dari `PrayerRecapPanel.tsx` dengan penyesuaian kalkulasi `wajibCount`
4. Pastikan export:
   - nama file include `Dhuha` atau `Jumat`
   - kolom include `Wajib`

## Edge Case yang Wajib Ditangani
- `wajibCount = 0` untuk satu siswa (bulan itu tidak pernah dijadwalkan).
- `override` gabungan (mis. kelas 7A-7C) pada tanggal tertentu.
- Perbedaan penulisan kelas pada data siswa vs jadwal.
- Perubahan jadwal di tengah bulan: rekap harus mengikuti konfigurasi saat ini (konsekuensi desain) atau snapshot (lebih kompleks). Rekomendasi awal: mengikuti konfigurasi saat ini.

## Catatan Keamanan & Konsistensi
- Jangan menulis ke node Dzuhur (`prayer_attendance*`) dari halaman ini.
- Jangan membuat persentase berbasis “hari efektif sekolah” untuk Dhuha/Jum'at.
- Pastikan label status sama di seluruh platform:
  - `PRAY -> Sudah Presensi`
  - `NOT_PRAY -> Tidak Sholat`
  - `PERMIT -> Izin`
  - `HALANGAN -> Halangan`

