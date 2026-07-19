# Kontrak Data - EduLock Web Admin

Dokumen ini merangkum sumber data aktual yang dipakai modul EduLock web admin saat ini.

## 1. Prinsip Umum

- Tenant selalu mengikuti `schoolId` aktif admin.
- EduLock saat ini belum punya kontrak telemetry final.
- Bedakan dengan tegas antara:
  - data live-read dari GAS
  - state lokal/mock/simulasi UI

## 2. Sumber Data Live yang Sudah Dipakai

### A. Direktori Kelas

- Sumber: hook `useClassesRealtime(schoolId)`
- Jalur logis:
  - `gas/schools/{schoolId}/classes/...`
- Dipakai oleh:
  - panel monitoring
  - panel data siswa
  - panel kelas

### B. Direktori Siswa

- Sumber: hook `useStudentsRealtime(schoolId)`
- Jalur logis:
  - `gas/schools/{schoolId}/students/...`
- Dipakai oleh:
  - panel monitoring
  - panel data siswa
  - panel audit log pelanggaran untuk resolusi nama siswa

### C. Lokasi, Jadwal, dan Hari Libur

- Sumber: hook `useGasSettings(schoolId)`
- Jalur logis:
  - pengaturan presensi sekolah di tenant aktif
- Dipakai oleh:
  - panel geofencing
  - panel settings

### D. Snapshot Runtime EduLock

- Sumber: endpoint admin `GET /api/admin/edulock`
- Node yang dibaca server:
  - `tenant_registry/{schoolId}`
  - `active_devices/{schoolId}`
  - `daily_attendance_mirror/{schoolId}`
  - `gas/schools/{schoolId}/students`
- Dipakai oleh:
  - dashboard overview
  - monitoring perangkat
  - alert runtime EduLock

## 3. Area yang Masih Mock / Belum Final

### A. Dashboard EduLock

- Sudah membaca snapshot runtime nyata bila node tersedia.
- Nilai online/out-of-zone akan tetap nol bila tenant belum mengirim telemetry.

### B. Monitoring Perangkat

- Data siswa live dan status perangkat dibangun dari kombinasi binding siswa + `active_devices`.
- Jika telemetry belum ada, panel tetap jujur menampilkan `TERIKAT` atau `BELUM BINDING`.

### C. Kelola Kode Akses

- Generate/hapus kode masih `useState` lokal.
- Belum ada backend persisten sekolah.

### D. Data Siswa - Aksi

- Izin uninstall massal
- Toggle izin uninstall

Action yang sudah hidup:

- Export data siswa
- Reset binding device

Action yang masih mock:

- izin uninstall massal
- toggle uninstall

### E. Audit Log Pelanggaran

- Panel menampilkan alert runtime aktif dari telemetry.
- Riwayat audit persisten tenant masih belum ada.

### F. Settings - Mutasi EduLock

- Master switch
- mode acara
- kebijakan GPS

Masih belum terhubung ke endpoint mutasi final.

## 4. Kontrak yang Wajib Ditetapkan pada Fase Berikutnya

1. Path/node telemetry perangkat siswa.
2. Path/node audit log pelanggaran.
3. Endpoint mutasi Next.js `/api/admin/edulock/...`.
4. Aturan otorisasi untuk Admin Sekolah vs Super Admin.
