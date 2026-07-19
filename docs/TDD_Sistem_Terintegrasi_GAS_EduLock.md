# TECHNICAL DESIGN DOCUMENT (TDD)
**Proyek:** Ekosistem GAS & EduLock Terintegrasi (PortalKita)
**Arsitektur:** Next.js 14, Firebase RTDB & Auth, Capacitor
**Tujuan:** Panduan Implementasi Teknis untuk Tim Developer

---

## 1. FIREBASE REALTIME DATABASE (NOSQL STRUCTURE)
Menggunakan strategi data NoSQL dengan memisahkan *node* berdasarkan `schoolId` (*tenant-scoped*) dan menggunakan arsitektur **Dua Boundary Console**.

### Boundary 1: GAS & PORTALKITA CONSOLE (Database Utama)
*   **`/schools/{schoolId}`**: Identitas dasar sekolah, status aktivasi (*kill-switch*).
*   **`/npsn_index/{npsn}`**: Indeks relasi dari NPSN (username admin web) menuju `schoolId`.
*   **`/master_students/{schoolId}/{studentKey}`**: Induk data siswa.
*   **`/master_teachers/{schoolId}/{teacherKey}`**: Induk data guru.
*   **`/master_classes/{schoolId}/{classKey}`**: Induk relasi kelas dan wali kelas.
*   **`/admin_profiles/{uid}`**: Profil Admin Sekolah berdasarkan *auth_uid* Firebase.
*   **`/principal_accounts/{uid}`**: Akses khusus Kepala Sekolah untuk Capacitor APK.
*   **`/attendance/{schoolId}/{date}/{studentKey}`**: Catatan kehadiran per tanggal.
*   **`/virtual_pets/{schoolId}/{studentKey}`**: Status indikator gamifikasi (sehat, sekarat, dll).
*   **`/lentera/{schoolId}/books`**: Katalog buku e-library.

### Boundary 2: EDULOCK CONSOLE (Database Keamanan)
*   **`/tenant_registry/{schoolId}`**: Daftar sekolah yang diizinkan menggunakan *strict mode*.
*   **`/active_devices/{schoolId}/{deviceUuid}`**: *Realtime presence* gawai.
*   **`/daily_attendance_mirror/{schoolId}/{date}/{studentKey}`**: Data hasil *mirroring* backend dari GAS Console untuk mengunci kondisi "Hadir" di EduLock APK.

---

## 2. API & SERVER-SIDE (NEXT.JS APP ROUTER)
Semua fungsi *business logic* sensitif dijalankan di Next.js Server Components dan API Routes.
**Framework:** Next.js 14 (`/app` router).
**Server Runtime:** Vercel / Node.js Server (dengan Firebase Admin SDK).

### Endpoint Penting (API Routes)
| Endpoint | Method | Keterangan & Aturan Enformasi |
| :--- | :--- | :--- |
| `/api/portal/session` | POST | Login berbasis JWT Cookie, verifikasi Firebase ID Token. |
| `/api/admin/students/sync` | POST | Mengirim pembaruan/import data Induk Siswa. |
| `/api/gas/attendance/manual`| POST | Input presensi oleh Admin/Guru. Memverifikasi session + `schoolId`. |
| `/api/edulock/mirror` | POST | Trigger backend untuk mem-copy status 'Hadir' dari GAS ke EduLock. |
| `/api/lentera/tasks/review` | POST | Admin menyetujui laporan tugas literasi siswa. |

---

## 3. INFRASTRUCTURE & BACKGROUND JOBS (CRON)
Pengganti Laravel Task Scheduling. Karena menggunakan ekosistem Firebase/Next.js:
1.  **Vercel Cron Jobs / Firebase Cloud Functions (Pub/Sub):**
    *   **`DailyAbsentCheck` (23:59 WIB):** Men-scan data `/master_students/{schoolId}` dan membandingkannya dengan `/attendance/{schoolId}/{date}`. Mengisi status "Alpha" bagi yang kosong (di GAS Console).
    *   **`PetDecayJob` (23:00 WIB):** Kalkulasi penurunan skor `health`/`energy` dari Virtual Pet berdasarkan riwayat pelanggaran hari itu.
2.  **EduLock Sync Worker (API Route Trigger):**
    *   API otomatis yang mentransmisikan rekap presensi harian dari GAS Console ke EduLock Console (`daily_attendance_mirror`) untuk memicu *Kiosk Mode* esok hari.

---

## 4. UI/UX & INTEGRASI CAPACITOR
### A. Web PortalKita (Next.js Admin)
*   Menggunakan *Server-Side Rendering (SSR)* untuk *dashboard* data induk guna melindungi query tanpa batasan filter dari eksekusi client.
*   *Client Components* (dengan Zustand/Context) digunakan untuk *view* data *real-time* seperti "Monitoring Peta Radar".

### B. APK Mobile (Capacitor)
*   **Siswa, Guru, Kepala Sekolah:** Menggunakan _webview_ Next.js/React yang dicompile menjadi APK menggunakan Capacitor.
*   **EduLock Strict Mode (Siswa):** 
    *   Pengecekan di layer Capacitor Plugin: `if (EduLockStatus == 'STRICT') => startLockTaskMode()`.
    *   Wajib meminta *Device Policy Administrator* saat instalasi.
*   **Persistence:** Capacitor *Preferences* / *Local Storage* menyimpan token dan cache data agar saat tidak ada sinyal internet, alur *routing* dalam aplikasi tidak putus ke layar *login*.

---
*Dokumen ini merupakan kerangka kerja final berorientasi NoSQL RTDB untuk Tim Developer.*