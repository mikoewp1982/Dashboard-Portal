# Developer Handoff - EduLock Web Admin
**Status Codebase:** UI Modular + Integrasi Hybrid (Live Read + Operasional Minimum)
**Tanggal:** 17 Juli 2026
**Framework:** Next.js (App Router) + Tailwind CSS v4

## 1. Arsitektur Halaman (Routing & Layout)
Tampilan Web Admin EduLock kini dibangun sedemikian rupa agar berdiri sendiri secara visual dari layout Dashboard Portal Satu Pintu, demi mempertahankan tema "Dark Glassmorphism" khas EduLock.

- **Path:** `src/app/dashboard/edulock/page.tsx`
- **Pendekatan Layout:**
  - Halaman ini **TIDAK** menggunakan `<Sidebar>` generik bawaan Portal. Halaman mem-bypass layout Portal dan melakukan render struktur `h-screen flex` secara independen.
  - Memiliki **Sidebar Kustom** (EduLock Sidebar) terintegrasi langsung di dalam `page.tsx` yang menangani deteksi URL parameter `?tab=...` untuk navigasi antar panel.
  - Sidebar kustom telah disempurnakan dengan dukungan CSS `cursor-pointer` di seluruh menu.

## 2. Struktur Komponen (Modularitas)
File raksasa referensi awal (`>2500 baris`) telah berhasil dipecah menjadi **8 komponen panel independen**.
Lokasi: `src/components/edulock/panels/`

1. `EduLockDashboardPanel.tsx`
2. `EduLockMonitoringPanel.tsx` (Terintegrasi GAS Kelas & Siswa)
3. `EduLockCodesPanel.tsx` (Stateful UI untuk OTP)
4. `EduLockClassesPanel.tsx` (Terintegrasi GAS Kelas)
5. `EduLockStudentsPanel.tsx` (Terintegrasi GAS Siswa + Reset Binding Live)
6. `EduLockGeofencingPanel.tsx` (Terintegrasi GAS Lokasi & Geofence)
7. `EduLockViolationsPanel.tsx` (Alert Runtime dari Telemetry Aktif)
8. `EduLockSettingsPanel.tsx` (Terintegrasi GAS Jadwal & Libur)

**EduLockWorkspace.tsx**:
Bertindak sebagai "Switch Controller" yang me-render salah satu komponen panel di atas berdasarkan nilai tab aktif.

## 3. Styling & Tailwind v4 (`globals.css`)
Karena proyek Portal Satu Pintu menggunakan Tailwind v4 (via Turbopack), pendekatan styling telah disesuaikan agar tidak menimbulkan *CssSyntaxError (unknown utility class)*.

**Daftar Kelas Spesifik EduLock (disuntikkan di `globals.css`):**
- **Surfaces:** `.glass-surface`, `.glass-surface-sm`, `.glass-header`.
- **Buttons:** `.btn-primary`, `.btn-danger`, `.btn-success`, `.btn-outline`.
- **Tables:** `.table-premium` untuk tabel data berkelas premium.
- **Global Invert:** Dukungan filter kalender / jam untuk dark mode pada input browser (*time*/*date*).

## 4. Current State (Integrasi Aktual)
Integrasi EduLock saat ini bersifat **hybrid**:

- **Live Read dari GAS** untuk:
  - kelas (`useClassesRealtime`)
  - direktori siswa (`useStudentsRealtime`)
  - lokasi, jadwal, dan hari libur (`useGasSettings`)
- **Live Read dari snapshot admin EduLock** untuk:
  - `tenant_registry/{schoolId}`
  - `active_devices/{schoolId}`
  - `daily_attendance_mirror/{schoolId}`
- **Operasional minimum yang sudah hidup** untuk:
  - reset binding device siswa
  - export data siswa
  - alert runtime EduLock berbasis telemetry aktif
- **Masih mock / belum final** untuk:
  - generate/hapus kode akses
  - aksi uninstall massal
  - toggle uninstall
  - master switch, mode acara, kebijakan GPS

Dengan kata lain, shell dan panel sudah siap, tetapi mutasi dan telemetry inti EduLock belum boleh dianggap final operasional.

**Catatan untuk Developer API Integrator Selanjutnya:**
- Endpoint `/api/admin/edulock` sekarang sudah ada untuk:
  - membaca snapshot runtime EduLock
  - reset binding device siswa
- Dashboard dan monitoring sudah membaca status perangkat asli jika node `active_devices` tersedia.
- Audit log pelanggaran persisten masih belum ada; panel baru menampilkan alert runtime aktif.
- Tugas lanjutan berikutnya adalah menyelesaikan mutasi yang belum ada dan kontrak log persisten.

## 5. Peringatan Sinkronisasi (Dependensi Modul Lain)
Perhatikan bahwa beberapa *value* di EduLock telah disinkronisasikan sebagai *Read-Only* dari **GAS Presensi**:
- Koordinat Lokasi & Radius Geofencing.
- Hari Libur, Jam Efektif, dan Jadwal Masuk/Pulang.
UI sengaja dibuat *disabled* agar sekolah hanya perlu mengatur jadwal dari 1 titik (GAS Presensi) tanpa ada resiko tumpang tindih dengan pengaturan EduLock.

## 6. Prioritas Lanjutan

Urutan kerja yang disarankan:

1. Tetapkan schema final `active_devices` agar semua field runtime konsisten lintas device.
2. Tambahkan mutasi yang belum ada pada `/api/admin/edulock`, terutama uninstall dan permission flow.
3. Hubungkan audit log ke backend persisten.
4. Setelah itu baru nyatakan panel EduLock sebagai live penuh.

---
**Siap untuk fase hardening telemetry, mutasi lanjutan, dan audit persisten EduLock.**
