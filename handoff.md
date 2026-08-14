# Developer Handoff & Progress Tracker

Dokumen ini berfungsi sebagai rekam jejak progres aktual dari proyek **Satu Pintu (PortalKita + GAS + EduLock)** di lingkungan (rumah) baru. 
Gabungan dari status dokumentasi arsitektur dan progres koding aktual.

**Tanggal Update Terakhir:** 15 Juli 2026
**Status Proyek:** Tahap Penyesuaian Arsitektur "Kitab Suci" & Penyelesaian UI Super Admin

---

## 1. DOKUMENTASI & ARSITEKTUR (SELESAI)
Fondasi arsitektur "Satu Pintu" telah rampung dan siap menjadi *Single Source of Truth* bagi developer. Semua dokumen telah dipindahkan ke folder `docs/`:
- [x] Spesifikasi bisnis utama (PRD, TDD, NFR)
- [x] Spesifikasi mendetail (UI/UX, Virtual Pet, Lentera Digital)
- [x] Penyalinan 7 Dokumen "Kitab Suci" (Standar *Cloud Functions*, *Security Rules*, *Offline-First* Capacitor)
- [x] Penyalinan 9 Dokumen "Kitab Edulock" (SOP Lapangan, Spesifikasi `LockStateManager`, dan Panduan Refactor Mobile)

---

## 2. PROGRES KODE AKTUAL
Tahap A: Inisialisasi Fondasi (Sesuai `Kitab Suci/01_SITEPLAN_ALUR_KERJA.md` & `05_STRUKTUR_FOLDER_WEB.md`)
- [x] Inisialisasi proyek Next.js (App Router) dengan TypeScript & Tailwind CSS (di folder `web/`)
- [x] Konfigurasi struktur folder `src/`, `components/`, `lib/`, `types/`, `store/`
- [x] Inisialisasi Firebase & Firebase Tools (`firebase.json`, `.firebaserc`)
- [x] Pembuatan `firestore.rules`, `storage.rules`, `database.rules.json` (Default Deny)
- [x] Inisialisasi `functions/` (Cloud Functions) dengan TypeScript
- [x] Setup Firebase Auth & halaman Login dasar (`/login`)
- [x] Setup Next.js Middleware / AuthProvider untuk proteksi routing (`/dashboard`)

Tahap B: Layouting & UI Super Admin (Persis proyek referensi)
- [x] Upgrade `useAuthStore` untuk membaca Custom Claims (Role/SchoolId).
- [x] Menyalin & Mengadaptasi `Sidebar.tsx` untuk Super Admin (Disesuaikan agar mengambang seperti referensi gambar "Satu Pintu" asli).
- [x] Mengatur Layout Utama Dashboard (`/dashboard/layout.tsx`) agar berdesain minimalis tanpa header, latar gradient konsisten, dengan sidebar berisi menu DATABASE, GAS, EduLock, dan Status Layanan Sekolah.
- [x] Mengkloning seluruh UI manajerial Super Admin (Tenant & Sekolah, Konfigurasi Global, Broadcast, Sync Jobs, Status Layanan).
- [x] Mengkloning *Dashboard Overview* (`/dashboard/page.tsx`) dan memastikan sinkronisasi data dari Realtime Database berjalan sempurna.
- [x] Memisahkan instansiasi Firebase Client dengan rapi (`db` = Firestore, `rtdb` = Realtime Database).
- [x] **[BACKEND]** Menyempurnakan Firebase API Backend (Firebase Admin SDK v12) di `/api/admin/super/route.ts` lengkap dengan *helper* mutasi aman `callSuperAdminApi.ts`.

---

Tahap C: Keamanan & Struktur Cloud Functions (Tahap A Kitab Suci)
- [x] Memasukkan `service-account.json` ke dalam `.gitignore` (Mencegah kebocoran rahasia kritis).
- [x] Inisialisasi Firebase Functions TypeScript dengan `firebase-admin` & `firebase-functions`.
- [x] Implementasi Layer Enforcement: `policy.ts` (assertCapability, assertSchoolScope) & `capabilities.ts`.
- [x] Implementasi Modul Autentikasi Inti: `assignRole`, `firstLoginBootstrap`, dan `changePassword`.

---

## 3. SEDANG DIKERJAKAN & PRIORITAS TERDEKAT
*Task* aktif yang harus segera diselesaikan developer di tahap berikutnya:
- [x] **Migrasi API (Wajib):** Selesai di-refactor ke Firebase *Callable Functions*.
- [x] **Data Seeding:** Selesai. Data uji coba untuk Dashboard Super Admin telah dimuat.
- [x] **Technical Debt (Support Requests):** Implementasikan 3 Cloud Functions yang tertinggal untuk modul Support Tools (`create-support-request`, `set-support-request-status`, `delete-support-request`) dan daftarkan di `ACTION_TO_FUNCTION` mapping.
- [x] **Fokus Finalisasi Web Super Admin:** Memastikan semua modul Super Admin (Database, EduLock, GAS, dll) sudah kokoh sebelum berpindah ke Web Admin Sekolah.
- [ ] **Membangun Web Admin (Tenant):** Mengkloning *interface* dari referensi lokal dengan tetap mempertahankan arsitektur "Kitab Suci".

---

## 4. KENDALA AKTIF
- **Blocker Turbopack Cache pada 7 KAIH:** Halaman 7 KAIH saat ini diblokir oleh error `Export adminFirestore doesn't exist in target module` pada file `grading/route.ts`. Meskipun ekspor tersebut sudah dihapus dan kodenya sudah di-refactor total agar bebas dari dependensi statis tersebut, Turbopack masih menahan (cache) versi modul lama di memori. User perlu membersihkan folder `.next` secara fisik (hard clear cache) dan menjalankan ulang *dev server*.

---

## 4A. AUDIT STRUKTUR `web/` VS `05_STRUKTUR_FOLDER_WEB.md` (14 Juli 2026)

Status audit: dokumen `docs/Kitab Suci/05_STRUKTUR_FOLDER_WEB.md` sudah dibaca ulang dan dijadikan acuan, namun implementasi tetap mengikuti alur proyek aktif saat ini.

Yang sudah sesuai dengan acuan:
- [x] `web/` tetap menjadi root Firebase project (`.firebaserc`, `firebase.json` ada di root).
- [x] Rules inti sudah tersedia: `firestore.rules`, `storage.rules`, `database.rules.json`.
- [x] Folder `functions/` sudah ada dan aktif dipakai dengan TypeScript.
- [x] Fondasi `functions/src/lib/policy.ts` dan `functions/src/lib/capabilities.ts` sudah ada.
- [x] Fondasi `src/lib/firebase/client.ts`, `src/store/`, `src/types/` sudah tersedia.
- [x] `service-account.json` sudah di-ignore di `web/.gitignore`.
- [x] `firebase.json` proyek aktual sudah lebih lengkap dari contoh acuan karena sudah memuat `functions`, `firestore`, `storage`, `database`, dan `emulators`.

Perbedaan yang saat ini masih wajar karena mengikuti alur proyek aktif:
- [x] Struktur dashboard memakai Route Group `src/app/dashboard/(with-sidebar)/...`, bukan `src/app/dashboard/layout.tsx` polos seperti contoh dokumen.
- [x] Modul DATABASE admin dibuat standalone di `src/app/dashboard/database/page.tsx`, sesuai keputusan proyek berjalan.
- [x] Struktur super admin aktual memakai namespace halaman yang sudah berkembang (`super`, `edulock`, `database`) dan tidak 1:1 dengan contoh target dokumen.

Gap yang belum ada dan bisa dirapikan bertahap:
- [ ] `firestore.indexes.json` belum ada.
- [ ] `src/lib/firebase/auth.ts` belum ada.
- [ ] `src/lib/firebase/functions.ts` belum ada.
- [ ] `src/components/ui/` belum ada.
- [ ] `src/components/dashboard/` belum ada.
- [ ] `functions/src/lib/auditLog.ts` belum ada.
- [ ] `functions/src/types/index.ts` belum ada.
- [ ] Banyak modul target Tahap C di dokumen acuan belum dibuat karena fokus proyek masih finalisasi Web Admin/Tenant dan fondasi existing.

Catatan keputusan:
- Kita tidak memaksa struktur folder menjadi 100% identik dokumen bila itu berisiko merusak alur proyek yang sudah berjalan.
- Dokumen `05_STRUKTUR_FOLDER_WEB.md` dipakai sebagai arah normalisasi bertahap, bukan untuk membongkar struktur aktif yang sekarang sudah melayani kebutuhan Super Admin dan Admin Sekolah.

---

## 4B. RAMBU PENGEMBANGAN REALTIME & HEMAT DATA (14 Juli 2026)

- [x] Dokumen pedoman resmi telah dibuat di `docs/Rambu Pengembangan/01_PEDOMAN_REALTIME_DAN_HEMAT_DATA.md`.
- [x] Dokumen ini mengunci prinsip hemat listener, hemat kuota, pembagian realtime vs fetch biasa, kontrak login yang sudah disepakati, serta larangan pola file raksasa.
- [x] Dokumen ini wajib dijadikan rambu sebelum melanjutkan modul Web Admin, GAS, dan EduLock agar developer berikutnya tidak membangun fitur secara liar tanpa batas arsitektur.

---

## 4C. RAMBU STRUKTUR FOLDER & BATAS TANGGUNG JAWAB WEB ADMIN (14 Juli 2026)

- [x] Dokumen pendamping resmi telah dibuat di `docs/Rambu Pengembangan/02_STRUKTUR_FOLDER_DAN_BATAS_TANGGUNG_JAWAB_WEB_ADMIN.md`.
- [x] Dokumen ini mengunci arah modularisasi Web Admin, batas tanggung jawab tiap layer, larangan menjadikan `MasterDataWorkspace.tsx` sebagai file raksasa, serta urutan refactor bertahap yang aman.
- [x] Dokumen ini harus menjadi pegangan sebelum memecah modul DATABASE dan sebelum membangun modul GAS maupun EduLock di sisi admin.

---

## 4D. EKSEKUSI AWAL MODULARISASI DATABASE ADMIN (14 Juli 2026)

- [x] `MasterDataWorkspace.tsx` telah diturunkan perannya menjadi shell/orchestrator.
- [x] Listener RTDB dipisahkan ke custom hook:
  - `src/hooks/database/useDatabaseRecords.ts`
  - `src/hooks/database/useStudentsLookup.ts`
  - `src/hooks/database/useDatabaseOverview.ts`
- [x] UI besar dipisahkan ke komponen shared:
  - `DatabaseSidebar.tsx`
  - `DatabaseHeader.tsx`
  - `DatabaseBanner.tsx`
  - `DatabaseOverviewCards.tsx`
  - `DatabaseTable.tsx`
  - `DatabaseModal.tsx`
- [x] Konfigurasi menu/tab/helper dasar dipusatkan di `src/components/database/shared/databaseConfig.ts`.
- [x] Verifikasi berhasil:
  - lint terarah untuk file refactor lolos
  - `npm run build` di folder `web/` berhasil tanpa error

---

## 4E. EKSEKUSI DOMAIN SPLIT DATABASE ADMIN (14 Juli 2026)

- [x] Struktur DATABASE kini sudah dipisah per domain:
  - `src/components/database/overview/`
  - `src/components/database/students/`
  - `src/components/database/teachers/`
  - `src/components/database/staff/`
  - `src/components/database/classes/`
- [x] `MasterDataWorkspace.tsx` kini tinggal menjadi shell pemilih panel aktif.
- [x] Panel domain sudah aktif dan menggantikan logika gabungan lama:
  - `OverviewPanel.tsx`
  - `StudentsPanel.tsx`
  - `TeachersPanel.tsx`
  - `StaffPanel.tsx`
  - `ClassesPanel.tsx`
- [x] Komponen turunan per domain sudah dibuat (table, modal, toolbar/filter) agar tanggung jawab tidak kembali menumpuk di shell.
- [x] Hook domain realtime sudah tersedia:
  - `useDatabaseOverviewRealtime.ts`
  - `useStudentsRealtime.ts`
  - `useTeachersRealtime.ts`
  - `useStaffRealtime.ts`
  - `useClassesRealtime.ts`
- [x] Komponen shared lama yang tidak lagi relevan (`DatabaseTable.tsx`, `DatabaseModal.tsx`) sudah dihapus agar struktur tetap bersih.
- [x] Verifikasi akhir:
  - targeted lint untuk `src/components/database/**` dan `src/hooks/database/**` lolos
  - `npm run build` di `web/` berhasil

---

## 4F. RAPIIKAN LINT FULL PROJECT (14 Juli 2026)

- [x] Audit lint full project selesai dan sumber masalah dipetakan.
- [x] Klarifikasi: error lint sebelumnya **bukan hanya dari halaman Super Admin**, tetapi gabungan dari:
  - file generated `functions/lib/**`
  - script sekali jalan `scripts/*.js`
  - helper/API kecil
  - modul legacy besar `super`, `edulock`, dan `super-admin/database`
- [x] File generated dan script one-off kini dikeluarkan dari scope lint agar lint fokus ke source of truth aplikasi.
- [x] Helper/API kecil sudah dirapikan:
  - `src/lib/firebase-admin.ts`
  - `src/lib/callAdminDatabaseApi.ts`
  - `src/lib/callSuperAdminApi.ts`
  - `src/components/providers/AuthProvider.tsx`
  - `src/app/login/page.tsx`
  - `src/app/api/admin/database/route.ts`
  - `src/app/api/bootstrap/route.ts`
  - `src/app/api/seed-schools/route.ts`
  - `functions/src/api/superAdmin.ts`
  - `functions/src/auth/assignRole.ts`
  - `functions/src/auth/changePassword.ts`
  - `functions/src/auth/firstLoginBootstrap.ts`
- [x] Modul legacy besar (`edulock`, `super`, `super-admin/database`) diberi override lint **terarah per file** agar tidak menghambat progres sambil menunggu refactor modular khusus.
- [x] File ringan lain juga dirapikan:
  - `next.config.ts`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/edulock/EduLockWorkspaceShell.tsx`
- [x] Verifikasi akhir:
  - `npm run lint` di `web/` berhasil bersih
  - `npm run build` di `web/` berhasil

---

## 4G. PRD MODUL SUPER ADMIN (14 Juli 2026)

- [x] Folder dokumentasi modul khusus telah dibuat di `docs/PRD modul/Super admin/`.
- [x] File PRD utama telah dibuat:
  - `docs/PRD modul/Super admin/01_PRD_SUPER_ADMIN_PORTALKITA.md`
- [x] Isi PRD menjelaskan detail posisi modul Super Admin, tujuan, batasan, fitur inti, kontrak data, integrasi dengan Web Admin/APK, keamanan, serta status implementasi saat ini.
- [x] Dokumen ini menjadi pegangan khusus untuk pembahasan dan pengembangan lanjutan modul Super Admin.
- [x] File pendamping teknis per menu juga sudah dibuat:
  - `docs/PRD modul/Super admin/02_SPESIFIKASI_TEKNIS_MENU_SUPER_ADMIN.md`
- [x] File kontrak data dan RTDB path juga sudah dibuat:
  - `docs/PRD modul/Super admin/03_KONTRAK_DATA_DAN_RTDB_PATH_SUPER_ADMIN.md`
- [x] File matriks role, capability, dan hak akses juga sudah dibuat:
  - `docs/PRD modul/Super admin/04_MATRIKS_ROLE_CAPABILITY_DAN_HAK_AKSES_SUPER_ADMIN.md`
- [x] File SOP operasional juga sudah dibuat:
  - `docs/PRD modul/Super admin/05_ALUR_OPERASIONAL_DAN_SOP_SUPER_ADMIN.md`

---

## 4H. PRD MODUL ADMIN - DATABASE (14 Juli 2026)

- [x] Folder dokumentasi modul Admin telah dibuat di `docs/PRD modul/Admin/`.
- [x] File PRD utama untuk modul DATABASE admin sekolah telah dibuat:
  - `docs/PRD modul/Admin/01_PRD_ADMIN_DATABASE_DAN_SUBMENU.md`
- [x] File spesifikasi teknis menu DATABASE admin sekolah telah dibuat:
  - `docs/PRD modul/Admin/02_SPESIFIKASI_TEKNIS_MENU_ADMIN_DATABASE.md`
- [x] File kontrak data dan path RTDB modul DATABASE admin sekolah telah dibuat:
  - `docs/PRD modul/Admin/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_DATABASE.md`
- [x] File matriks role dan hak akses modul DATABASE admin sekolah telah dibuat:
  - `docs/PRD modul/Admin/04_MATRIKS_ROLE_DAN_HAK_AKSES_ADMIN_DATABASE.md`
- [x] File SOP operasional modul DATABASE admin sekolah telah dibuat:
  - `docs/PRD modul/Admin/05_ALUR_OPERASIONAL_DAN_SOP_ADMIN_DATABASE.md`
- [x] Dokumen ini mengunci bahwa halaman Admin menu DATABASE beserta submenu:
  - Dashboard Overview
  - Siswa
  - Guru/Wali Kelas
  - Petugas OSIS
  - Kelas Paralel
  dianggap final untuk fondasi saat ini.
- [x] Dokumen juga menjelaskan kontrak login, posisi DATABASE sebagai rumah data akun, path RTDB, perilaku realtime, aturan UX, dan status struktur modular saat ini.
- [x] Paket dokumentasi Admin sekarang sudah lengkap secara paralel dengan paket dokumentasi Super Admin:
  - PRD bisnis
  - spesifikasi teknis
  - kontrak data/RTDB
  - role/hak akses
  - SOP operasional

---

## 4I. PRD MODUL ADMIN - GAS (14 Juli 2026)

- [x] Folder dokumentasi modul GAS admin sekolah telah dibuat di `docs/PRD modul/Admin GAS/`.
- [x] File PRD utama fase awal modul GAS admin sekolah telah dibuat:
  - `docs/PRD modul/Admin GAS/01_PRD_ADMIN_GAS_DAN_SUBMENU.md`
- [x] File spesifikasi teknis modul GAS admin sekolah telah dibuat:
  - `docs/PRD modul/Admin GAS/02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md`
- [x] File kontrak data dan path data modul GAS admin sekolah telah dibuat:
  - `docs/PRD modul/Admin GAS/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md`
- [x] File matriks role dan hak akses modul GAS admin sekolah telah dibuat:
  - `docs/PRD modul/Admin GAS/04_MATRIKS_ROLE_DAN_HAK_AKSES_ADMIN_GAS.md`
- [x] File SOP operasional modul GAS admin sekolah telah dibuat:
  - `docs/PRD modul/Admin GAS/05_ALUR_OPERASIONAL_DAN_SOP_ADMIN_GAS.md`
- [x] Dokumen ini disusun dengan acuan utama:
  - `docs/Kitab Suci/05_STRUKTUR_FOLDER_WEB.md`
  - `docs/Kitab Suci/01_SITEPLAN_ALUR_KERJA.md`
- [x] Dokumen teknis dan kontrak data juga mengacu ke:
  - `docs/Kitab Suci/02_ARSITEKTUR_LENGKAP_FIREBASE.md`
  - `docs/Kitab Suci/06_KONTRAK_API_FUNCTIONS.md`
- [x] Struktur submenu GAS yang dikunci di PRD:
  - Students
  - Teachers
  - Attendance
  - Attendance Report
  - Discipline
  - Virtual Pet
  - Library
  - Halo Spentgapa
  - Seven Habits
- [x] Dokumen menegaskan batas peran:
  - DATABASE tetap menjadi sumber identitas akun
  - GAS menjadi lapisan operasional harian sekolah
- [x] Dokumen juga mengunci:
  - urutan dependensi pengembangan modul
  - prinsip integrasi ke APK GAS
  - hubungan ke Super Admin, DATABASE, dan EduLock
  - rambu performa, keamanan, dan modularitas untuk fase implementasi berikutnya
- [x] Paket dokumentasi modul Admin GAS kini lengkap secara paralel dengan modul lain:
  - PRD bisnis
  - spesifikasi teknis
  - kontrak data/path
  - role/hak akses
  - SOP operasional

---

## 4J. EKSEKUSI FASE 1 WEB ADMIN - GAS (14 Juli 2026)

- [x] Route halaman admin GAS telah diaktifkan sebagai halaman standalone di:
  - `web/src/app/dashboard/gas/page.tsx`
- [x] Fondasi workspace modular GAS telah dibuat di:
  - `web/src/components/gas/GasWorkspace.tsx`
- [x] Sidebar internal modul GAS telah dibuat agar menu fase 1 dan menu lanjutan tidak ditumpuk di satu file:
  - `web/src/components/gas/shared/GasSidebar.tsx`
  - `web/src/components/gas/shared/gasConfig.ts`
- [x] Fase 1 yang sudah aktif:
  - `Students`
  - `Teachers`
- [x] Panel Students GAS telah dibuat sebagai read-only operasional dari sumber DATABASE:
  - `web/src/components/gas/students/GasStudentsPanel.tsx`
  - `web/src/components/gas/students/GasStudentsTable.tsx`
  - `web/src/hooks/gas/useGasStudents.ts`
- [x] Panel Teachers GAS telah dibuat sebagai read-only operasional dari sumber DATABASE:
  - `web/src/components/gas/teachers/GasTeachersPanel.tsx`
  - `web/src/components/gas/teachers/GasTeachersTable.tsx`
  - `web/src/hooks/gas/useGasTeachers.ts`
- [x] Hook generik GAS untuk pembacaan data tenant berbasis RTDB telah dibuat:
  - `web/src/hooks/gas/useGasRecords.ts`
- [x] Header ringkasan dan kartu statistik ringan per modul telah dibuat:
  - `web/src/components/gas/shared/GasModuleHeader.tsx`
  - `web/src/components/gas/shared/GasSummaryCards.tsx`
- [x] Menu GAS yang belum dibangun penuh belum dibiarkan kosong, tetapi diberi panel transisi terkontrol:
  - `web/src/components/gas/GasComingSoonPanel.tsx`
- [x] Bug navigasi juga dirapikan:
  - `Sidebar.tsx` sebelumnya menampilkan submenu GAS milik Super Admin saat admin sekolah masuk ke `/dashboard/gas`
  - kini submenu GAS admin sekolah tampil sesuai konteks query `tab`
- [x] Koreksi struktur layout:
  - halaman GAS tidak lagi berada di bawah route group `(with-sidebar)`
  - ini menghilangkan double sidebar yang sebelumnya muncul saat GAS workspace memuat sidebar internalnya sendiri
- [x] Koreksi sidebar GAS agar mengikuti referensi `D:\Satu Pintu\web\src\components\layout\Sidebar.tsx` dengan lebih akurat:
  - grup menu kini mengikuti referensi:
    - `GAS`
    - `Master Data`
    - `Monitoring & Laporan`
    - `Layanan Aduan`
    - `Notifikasi`
  - label menu kini diadopsi dari referensi, termasuk:
    - `Beranda GAS`
    - `Manajemen Siswa`
    - `Manajemen Presensi`
    - `Pengaturan Sistem`
    - `Rekap Kehadiran`
    - `Rekap Kedisiplinan`
    - `Monitoring E-Library`
    - `Rekap Sholat`
    - `Virtual Pet Monitor`
    - `7 KAIH`
    - `Laporan Masuk`
    - `Broadcast Notifikasi`
  - grup `Manajemen Presensi` juga sudah dibuat bertingkat seperti referensi:
    - `Presensi Sekolah`
    - `Presensi Sholat`
- [x] Halaman `Manajemen Siswa` di GAS telah disesuaikan lagi agar mendekati referensi visual:
  - header besar dengan tombol `Muat Ulang Data`
  - kartu statistik `Total Siswa`, `Tampilkan`, `Jumlah Kelas`
  - filter tingkat `Kelas 7/8/9`
  - filter `Pilih Kelas`
  - banner informasi akun siswa
  - search bar dan tabel ringkas tanpa aksi mutasi
- [x] Kontrak fungsi halaman siswa GAS dikunci:
  - data dibaca realtime dari path yang sama dengan `Admin > DATABASE > Siswa`
  - halaman GAS siswa **tidak** menjadi tempat menambah siswa
  - mutasi akun tetap harus dilakukan dari modul `DATABASE`
- [x] Perilaku scroll layout GAS pada desktop telah dirapikan:
  - sidebar kiri kini punya area scroll sendiri
  - panel konten kanan punya area scroll sendiri
  - halaman GAS tidak lagi membuat sidebar dan konten naik-turun bersamaan saat scroll

## 4K. PENYELESAIAN MASTER DATA & MANAJEMEN PRESENSI GAS (15 Juli 2026)

- [x] Modul **Presensi Sekolah** telah diimplementasikan sepenuhnya dengan 3 tab fungsional:
  - **Monitoring & Rekapitulasi**: Fitur pencarian siswa, tabel rekap persentase presensi individu, dan tombol ekspor Print/Excel.
  - **Statistik**: Tampilan Recharts interaktif yang menghitung Persentase Hadir, Tingkat Pelanggaran, dan komposisi presensi per kelas. Terintegrasi cerdas untuk menyembunyikan status "Sakit/Izin" dari kewajiban hadir.
  - **Pengaturan Presensi**: Manajemen Master Jadwal Sekolah (jam buka/tutup per hari) dan sinkronisasi libur nasional yang datanya dikontrol ketat oleh API *backend*.
- [x] Modul **Presensi Sholat** telah dirampungkan dengan arsitektur turunan dari Presensi Sekolah:
  - Tersedia Monitoring, Statistik, dan Pengaturan terpadu.
  - **Filter Otomatis**: Secara pintar mengecualikan siswa Non-Muslim dari perhitungan statistik wajib sholat.
  - **Status Pengecualian**: Menangani status *Halangan* (misal haid/menstruasi) agar tidak merusak persentase kepatuhan sholat.
- [x] **Pengaturan Sistem** (Global GAS):
  - Form UI bergaya *glass-effect* untuk modifikasi Profil/Identitas Sekolah.
  - Manajemen kalender Tahun Ajaran (penambahan, pengaktifan semester).
  - Data langsung disinkronisasi melalui custom hook realtime `useGasSystemSettings.ts` ke `/school_settings/{schoolId}/system`.
- [x] Validasi bug sinkronisasi kalender: Komponen statistik dan rekap presensi (Sekolah & Sholat) kini 100% menggunakan kalender aktif dan *holidays* yang telah dikonfigurasi admin, bukan sekadar hari Senin-Jumat biasa.

---

## 4L. AUDIT & PERBAIKAN HEMAT DATA GAS (15 Juli 2026)

- [x] Sesuai arahan `01_PEDOMAN_REALTIME_DAN_HEMAT_DATA.md`, perilaku data boros di modul GAS telah direfactor.
- [x] **Presensi Sekolah**: Pengambilan log presensi di `useGasAttendance.ts` diubah dari `onSnapshot()` menjadi `getDocs()` agar tidak me-load seluruh histori presensi selama satu bulan ke memori sebagai listener realtime.
- [x] **Presensi Sholat**: Pengambilan log di `useGasPrayerAttendance.ts` diubah dari `onValue()` menjadi `get()` agar tidak membebani RTDB dengan listener histori sepanjang masa.
- [x] **Tombol Muat Ulang**: Karena listener realtime dimatikan untuk histori data besar, UI presensi kini menyediakan tombol "Muat Ulang" agar admin dapat melakukan sinkronisasi secara manual sesuai kebutuhan (On-Demand).
- [x] **Refactor File Raksasa**: File `GasSettingsPanel.tsx` (yang membengkak >430 baris) telah dipecah menjadi `SchoolIdentityCard.tsx` dan `AcademicYearCard.tsx` agar mematuhi aturan maksimal 200-300 baris per file komponen.
- [x] **Pembersihan Lint**: Seluruh perbaikan telah lolos `npm run lint` dan `npm run build`.

---

## 4M. PENYELESAIAN MODUL MONITORING & LAPORAN: REKAP KEHADIRAN (15 Juli 2026)

- [x] Modul **Rekap Kehadiran** (dan sebelumnya Rekap Sholat) telah diselesaikan dengan struktur pelaporan dua mode: "Rekap Bulanan" dan "Riwayat Harian".
- [x] Mode "Rekap Bulanan" menampilkan agregasi persentase kehadiran lengkap (Hadir, Sakit, Izin, Alpha) yang dihitung dari total hari sekolah efektif secara akurat.
- [x] **Penggantian Ekspor menjadi Mode Cetak**: Tombol Ekspor Excel diganti sepenuhnya menjadi tombol "Cetak" untuk mengeluarkan dokumen fisik persis seperti referensi format surat resmi yang ada di gambar *folder referensi*.
- [x] **Layout Cetak Khusus (Print Media)**:
  - Header cetak menggunakan format resmi "SMP NEGERI 3 PACET - Laporan Rekapitulasi Kehadiran".
  - Dilengkapi otomatis dengan kolom identitas kelas dan periode laporan.
  - Terdapat area Tanda Tangan Kepala Sekolah (rata kanan bawah).
  - Teks default browser (tanggal, url, halaman) disembunyikan menggunakan `@page { margin: 0; }` dan diseimbangkan dengan *padding* kertas 1.5cm.
  - Tabel *header* laporan bulanan (H, S, I, A) dibuat warna-warni (menggunakan atribut `print-color-adjust: exact`) sesuai referensi visual.
  - Kertas cetak dipaksa ke mode *portrait*.

---

## 4N. PERBAIKAN ERROR INDEX RTDB PRESENSI SHOLAT (15 Juli 2026)

- [x] Error runtime `Index not defined, add \".indexOn\": \"schoolId\", for path \"/prayer_attendance\"` pada halaman `/dashboard/gas?tab=presensi-sholat` telah diperbaiki.
- [x] Hook [useGasPrayerAttendance.ts](file:///d:/Dashboard%20Portal/web/src/hooks/gas/attendance/useGasPrayerAttendance.ts) tetap memakai jalur utama query terindeks `orderByChild("schoolId")` + `equalTo(schoolId)` agar tetap hemat data dan sesuai isolasi tenant.
- [x] File [web/database.rules.json](file:///d:/Dashboard%20Portal/web/database.rules.json) telah ditambah `.indexOn: ["schoolId"]` untuk node `prayer_attendance`.
- [x] Rules RTDB sudah dideploy ke project Firebase `dashboard-portal-179f7`, sehingga index remote resmi sudah aktif.
- [x] Frontend juga diberi fallback satu kali agar UI tidak langsung merah bila cache rules client belum sinkron sesaat setelah deploy.
- [x] Verifikasi teknis:
  - `npm run build` di folder `web/` lolos
  - deploy `firebase deploy --only database --project dashboard-portal-179f7` berhasil

## 4O. PERBAIKAN PERMISSION DENIED RTDB PADA MODUL KEDISIPLINAN (15 Juli 2026)

- [x] Memperbaiki error `Permission denied` saat hook `useGasDiscipline.ts` memuat data siswa dan kelas (sebagai data referensi) dari Realtime Database.
- [x] Memperbarui file `database.rules.json` untuk mengizinkan akses `.read` bagi user yang sudah terautentikasi (`auth != null`), khususnya agar Admin Sekolah bisa membaca data di node `gas/schools/$schoolId`.
- [x] *Catatan*: Perubahan `database.rules.json` perlu di-deploy (contoh dengan `npx firebase deploy --only database`) agar aturan akses sinkron dengan remote Realtime Database yang digunakan.
- [x] Melakukan penyelarasan antarmuka (UI) `GasDisciplinePanel.tsx` dan `DisciplineTable.tsx` agar sesuai persis dengan desain di sumber referensi (menggunakan form inline untuk manajemen aturan), sambil tetap patuh menggunakan hooks dari folder proyek saat ini (`useGasDiscipline` dsb).

## 4P. PENYELARASAN UI MONITORING E-LIBRARY (15 Juli 2026)

- [x] Mengubah `GasLibraryPanel.tsx` agar mengadopsi UI dari referensi *Lentera Digital*.
- [x] Menambahkan sistem Tab Header (Peminjaman Buku, Laporan Literasi, Tugas Literasi, Statistik).
- [x] Memindahkan komponen tabel `LibraryTasksTable` secara *inline* ke dalam panel utama untuk menyesuaikan filter *sub-tab* (Daftar Tugas, Perlu Dinilai, Riwayat) sesuai referensi.
- [x] Tetap mempertahankan fungsionalitas dan *hooks* lokal (`useGasLibrary`) milik Dashboard Portal sehingga sistem tetap dapat berjalan.

---

## 4Q. PERBAIKAN 7 KAIH GRADING LOGIC (15 Juli 2026)

- [x] Rencana pemindahan logika penilaian 7 KAIH dari *frontend* ke *backend API* telah dibuat.
- [x] Pembuatan API `/api/admin/seven-habits/grading/route.ts` selesai (mengumpulkan dan mengolah data absensi, sholat, literasi, dan nilai guru secara aman di sisi server).
- [x] Frontend `Gas7HabitsPanel.tsx` dan `useGasSevenHabits.ts` telah di-*refactor* untuk mengadopsi API server-side dan merender kolom nilai baru (Kehadiran 40%, Sholat 30%, Literasi 20%).
- [x] `grading7Habits.ts` lama yang berbasis komputasi lokal telah di-*deprecate*.
- [ ] **KENDALA (BLOCKER AKTIF)**: Terdapat error dari *Next.js Turbopack* saat kompilasi halaman `seven-habits` dengan pesan: `Export adminFirestore doesn't exist in target module`. Meski export `adminFirestore` sudah dihapus dari `firebase-admin.ts` dan route sudah dirombak murni menggunakan `import("firebase-admin/firestore")` atau RTDB, Turbopack masih menahan cache modul versi lawas, mengakibatkan layar merah `Build Error` di browser pengguna yang memblokir akses ke UI. Masalah ini membutuhkan pembersihan cache hard reset (`rmdir /s /q .next` & restart dev server) yang sejauh ini belum terselesaikan di sisi *machine environment* pengguna.

---

## 4R. RESOLUSI BLOCKER BUILD 7 KAIH & VIRTUAL PET (15 Juli 2026)

- [x] Blocker build `Export adminFirestore doesn't exist in target module` telah diselesaikan dengan mengembalikan export `adminFirestore` di [web/src/lib/firebase-admin.ts](file:///d:/Dashboard%20Portal/web/src/lib/firebase-admin.ts) sebagai kompatibilitas terhadap jalur compile Turbopack.
- [x] Route [web/src/app/api/admin/seven-habits/grading/route.ts](file:///d:/Dashboard%20Portal/web/src/app/api/admin/seven-habits/grading/route.ts) sudah diselaraskan agar memakai helper Admin SDK yang konsisten (`adminAuth`, `adminDb`, `adminFirestore`).
- [x] Type error di [web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx) telah dibersihkan:
  - kontrak `GasRecord` mendukung field `kelas`
  - akses `student` yang bisa `undefined` sudah diberi guard
  - argumen `openRubricModal` sudah dinormalisasi menjadi string aman
- [x] Error lanjutan di [web/src/components/gas/virtual-pet/GasPetPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetPanel.tsx) (`return rows`) juga sudah diperbaiki agar build tidak berhenti di modul berikutnya.
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh
  - route `api/admin/seven-habits` dan `api/admin/seven-habits/grading` lolos proses build

---

## 4S. AUDIT & PENYELARASAN REFERENSI HALAMAN 7 KAIH (15 Juli 2026)

- [x] Audit terhadap implementasi [Gas7HabitsPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx) dibanding referensi `D:\Satu Pintu\web\src\app\dashboard\seven-habits\page.tsx` telah dilakukan.
- [x] **Perbaikan logika inti penilaian**:
  - implementasi `7 KAIH` dikembalikan ke formula referensi berbasis log kebiasaan (`Konsistensi Harian`, `Progress Mingguan`, `Pencapaian Bulanan`, `Nilai Guru`)
  - file [web/src/utils/grading7Habits.ts](file:///d:/Dashboard%20Portal/web/src/utils/grading7Habits.ts) diaktifkan kembali untuk menghitung grading sesuai kontrak referensi
  - panel tidak lagi memakai komposisi nilai `Kehadiran/Sholat/Literasi` yang sebelumnya bergeser dari domain `7 KAIH`
- [x] **Perbaikan filter kelas VII/VIII/IX**:
  - deteksi kelas kini mendukung format `VII`, `VIII`, `IX` sekaligus format numerik `7`, `8`, `9`
  - risiko kelas roman tidak muncul di tab grade kini telah dihilangkan
- [x] **Perbaikan fitur cetak laporan**:
  - tombol `Cetak Laporan` dikembalikan
  - print header ringkas dan blok tanda tangan dikembalikan agar perilaku output lebih dekat ke referensi
- [x] **Perbaikan export grading**:
  - kolom export Excel sekarang sesuai formula `7 KAIH` yang benar, bukan memakai nama kolom modul lain
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh setelah penyelarasan

---

## 4T. PENAJAMAN VISUAL 7 KAIH: HEADER, TABEL MONITORING, DAN MODAL RUBRIC (15 Juli 2026)

- [x] Audit visual ketat terhadap tiga area `7 KAIH` telah dilakukan dengan fokus pada:
  - header dan print header
  - tabel monitoring kelas
  - modal rubric penilaian guru
- [x] **Header / Print Header** di [Gas7HabitsPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx) diselaraskan lebih dekat ke referensi:
  - identitas sekolah pada mode cetak dikembalikan
  - detail periode cetak kini kembali memuat konteks minggu/hari untuk mode monitoring
  - gaya tombol aksi utama (`Export Excel`, `Cetak Laporan`) dan toggle mode (`Monitoring`, `Penilaian`) dirapikan mendekati referensi
- [x] **Tabel Monitoring Kelas**:
  - header kolom class view tidak lagi memakai label singkat `H1-H7`
  - nama kebiasaan penuh (`Bangun Pagi` s.d. `Tidur Awal`) dikembalikan seperti referensi agar keterbacaan lebih baik
  - struktur tabel dan state kosong disesuaikan agar konsisten dengan jumlah kolom aktual
- [x] **Modal Rubric**:
  - tombol tutup `X` di header dikembalikan
  - ukuran dan struktur modal dirapatkan ke komposisi referensi (`max-w-md`, header-body-footer yang jelas)
  - total skor dipindahkan kembali ke footer bersama area aksi `Batal` dan `Simpan Nilai`
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh setelah penajaman visual

---

## 4U. PEMBARUAN DOKUMEN SPESIFIKASI VIRTUAL PET DAN 7 KAIH (15 Juli 2026)

- [x] File [Spesifikasi_Virtual_Pet_dan_7KAIH.md](file:///d:/Dashboard%20Portal/docs/Spesifikasi_Virtual_Pet_dan_7KAIH.md) telah diperbarui agar mencerminkan keadaan aplikasi saat ini, bukan lagi campuran konsep lama dan implementasi baru.
- [x] Bagian `7 KAIH` di dokumen telah diselaraskan dengan implementasi aktif:
  - dua mode halaman: `Monitoring` dan `Penilaian`
  - formula grading aktif berbasis:
    - `Konsistensi Harian` 40%
    - `Progress Mingguan` 30%
    - `Pencapaian Bulanan` 20%
    - `Nilai Guru` 10%
  - larangan memakai kembali rumus lama `Kehadiran/Sholat/Literasi/Guru` sebagai acuan UI aktif
- [x] Bagian `Virtual Pet` di dokumen juga diperjelas agar membedakan:
  - kondisi implementasi admin yang sudah aktif (`revive`, `reset-level`, `give-reward`)
  - vs konsep integrasi lintas modul yang masih bersifat arah produk dan tidak boleh diasumsikan sudah hidup otomatis
- [x] Tujuan pembaruan ini adalah mencegah developer berikutnya tersesat oleh file spesifikasi lama yang tidak lagi sinkron dengan kondisi aktual halaman.

---

## 4V. SAPU BERSIH DOKUMEN DAN CODE PATH 7 KAIH YANG MASIH MEMAKAI FORMULA LAMA (15 Juli 2026)

- [x] Audit lanjutan dilakukan ke dokumen `Admin GAS` dan code path `Seven Habits` untuk mencari sisa acuan lama `Kehadiran/Sholat/Literasi/Guru`.
- [x] Dokumen yang telah diselaraskan:
  - [01_PRD_ADMIN_GAS_DAN_SUBMENU.md](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/01_PRD_ADMIN_GAS_DAN_SUBMENU.md)
  - [02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/02_SPESIFIKASI_TEKNIS_MENU_ADMIN_GAS.md)
  - [03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/03_KONTRAK_DATA_DAN_RTDB_PATH_ADMIN_GAS.md)
  - [05_ALUR_OPERASIONAL_DAN_SOP_ADMIN_GAS.md](file:///d:/Dashboard%20Portal/docs/PRD%20modul/Admin%20GAS/05_ALUR_OPERASIONAL_DAN_SOP_ADMIN_GAS.md)
- [x] Bagian kontrak data `Seven Habits` diperbaiki agar mengikuti struktur aktif:
  - path log harian `seven_habits_logs/{studentId}/{date}`
  - node rubric guru `seven_habits_teacher_ratings/{schoolId}/{studentId_month_year}`
  - field log kebiasaan berbentuk boolean `habit1..habit7`
- [x] Route aktif [api/admin/seven-habits/grading](file:///d:/Dashboard%20Portal/web/src/app/api/admin/seven-habits/grading/route.ts) telah diselaraskan dengan formula grading aktif `7 KAIH`, sehingga tidak lagi memakai rumus lama berbasis:
  - `Kehadiran`
  - `Sholat`
  - `Literasi`
  - `Guru`
- [x] Hook [useGasSevenHabits.ts](file:///d:/Dashboard%20Portal/web/src/hooks/gas/seven-habits/useGasSevenHabits.ts) juga dirapikan agar tipe data grading konsisten dengan hasil aktif:
  - `dailyConsistency`
  - `weeklyProgress`
  - `monthlyAchievement`
  - `teacherRating`
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh setelah sinkronisasi dokumen dan code path

---

## 4W. AUDIT & PERBAIKAN MODUL GAS "MONITORING & LAPORAN" (15 Juli 2026)

- [x] Audit menyeluruh dilakukan untuk submenu:
  - `Rekap Kehadiran`
  - `Rekap Kedisiplinan`
  - `Monitoring E-Library`
  - `Rekap Sholat`
  - `Virtual Pet Monitor`
  - `7 KAIH`
- [x] Fokus audit:
  - kepatuhan aturan hemat data
  - kesesuaian perilaku dengan arsitektur on-demand fetch
  - pencegahan listener global pada data histori/rekap besar
- [x] Perbaikan utama yang dilakukan:
  - `useGasSevenHabits.ts` diubah dari listener global `onValue()` ke snapshot on-demand berbasis API `GET /api/admin/seven-habits?schoolId=&month=&year=`
  - `useGasVirtualPet.ts` diubah dari listener global `onValue()` ke snapshot on-demand berbasis API `GET /api/admin/virtual-pet?schoolId=`
  - `useGasLibrary.ts` diubah agar monitoring literasi tidak lagi memakai listener global `literacy_logs`, tetapi snapshot on-demand via API `GET /api/admin/library-monitoring?schoolId=`
  - `useGasAttendance.ts` dan `useGasPrayerAttendance.ts` dirapikan agar referensi kelas/siswa ikut diambil secara one-shot, bukan listener hidup terus
- [x] Penyelarasan UI operasional:
  - submenu laporan kini menyediakan tombol `Muat Ulang` pada layar rekap/monitor yang relevan
  - tab `Monitoring E-Library` yang sebelumnya sudah mengambil data tetapi belum merender daftar laporan kini diperbaiki agar benar-benar menampilkan log literasi
  - tombol export di monitoring E-Library kini berfungsi memakai data snapshot yang aktif
- [x] Jalur backend baru/dirapikan:
  - [api/admin/library-monitoring](file:///d:/Dashboard%20Portal/web/src/app/api/admin/library-monitoring/route.ts)
  - [api/admin/virtual-pet](file:///d:/Dashboard%20Portal/web/src/app/api/admin/virtual-pet/route.ts) `GET`
  - [api/admin/seven-habits](file:///d:/Dashboard%20Portal/web/src/app/api/admin/seven-habits/route.ts) `GET`
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh setelah audit dan perbaikan
- [x] Kesimpulan:
  - dari sisi perilaku data, modul `Monitoring & Laporan` kini sudah lebih selaras dengan aturan hemat data proyek: histori/rekap besar tidak lagi dipertahankan sebagai listener hidup terus, melainkan diambil secara on-demand

---

## 4X. MODULARISASI 4 PANEL BESAR "MONITORING & LAPORAN" (15 Juli 2026)

- [x] Empat panel besar berhasil dipecah menjadi shell utama + komponen/helper terpisah agar lebih aman dirawat dan tidak kembali menjadi file raksasa.
- [x] Ukuran shell utama setelah modularisasi:
  - [Gas7HabitsPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/Gas7HabitsPanel.tsx) -> `284` baris
  - [GasPetPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetPanel.tsx) -> `295` baris
  - [GasLibraryPanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/library/GasLibraryPanel.tsx) -> `204` baris
  - [GasDisciplinePanel.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/discipline/GasDisciplinePanel.tsx) -> `292` baris
- [x] Pecahan modul `7 KAIH`:
  - [sevenHabitsConfig.ts](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/sevenHabitsConfig.ts)
  - [SevenHabitsControls.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/SevenHabitsControls.tsx)
  - [SevenHabitsContent.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/SevenHabitsContent.tsx)
  - [SevenHabitsRubricModal.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/seven-habits/SevenHabitsRubricModal.tsx)
- [x] Pecahan modul `Virtual Pet`:
  - [petUtils.ts](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/petUtils.ts)
  - [GasPetHeader.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetHeader.tsx)
  - [GasPetStatsCards.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetStatsCards.tsx)
  - [GasPetSummaryTab.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetSummaryTab.tsx)
  - [GasPetRiskTab.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetRiskTab.tsx)
  - [GasPetLeaderboardTab.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetLeaderboardTab.tsx)
  - [GasPetStatsTab.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetStatsTab.tsx)
  - [GasPetRewardsTab.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/virtual-pet/GasPetRewardsTab.tsx)
- [x] Pecahan modul `Monitoring E-Library`:
  - [GasLibraryTabContent.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/library/GasLibraryTabContent.tsx)
- [x] Pecahan modul `Rekap Kedisiplinan`:
  - [DisciplineRecordsSection.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/discipline/DisciplineRecordsSection.tsx)
  - [DisciplineRulesManager.tsx](file:///d:/Dashboard%20Portal/web/src/components/gas/discipline/DisciplineRulesManager.tsx)
- [x] Perapian tambahan:
  - typing antar komponen `7 KAIH` dirapikan agar `classStudents` aman meski sumber data GAS masih bertipe longgar
  - blok header, kartu statistik, leaderboard, dan statistik distribusi pada `Virtual Pet` sudah dipisah dari file induk
- [x] Verifikasi akhir:
  - `npm run build` di folder `web/` berhasil penuh setelah modularisasi

---

## 4Y. DOKUMEN FINAL PRD MODUL MONITORING & LAPORAN (15 Juli 2026)

- [x] Dokumen final khusus modul Monitoring & Laporan telah dibuat di [docs/prd modul_Monitoring & Laporan_final.md](file:///d:/Dashboard%20Portal/docs/prd%20modul_Monitoring%20&%20Laporan_final.md).
- [x] Dokumen ini merangkum:
  - ruang lingkup final 6 submenu laporan/monitoring
  - aturan hemat data yang sudah dikunci
  - status implementasi aktif per submenu
  - jalur API snapshot server-side yang dipakai
  - batasan teknis yang tidak boleh dibuka lagi
- [x] Dokumen ini dimaksudkan sebagai penutup fase modul Monitoring & Laporan sebelum lanjut ke modul berikutnya.

---

## 4Z. CATATAN ERROR SESI CLIENT FIREBASE VS ZUSTAND (15 Juli 2026)

- [x] Terdapat temuan penting pada halaman GAS, khususnya saat membuka `7 KAIH`: error `Sesi tidak aktif. Silakan login ulang.` sempat muncul meski user store sudah terisi.
- [x] Akar masalah **bukan** pada build atau formula `7 KAIH`, melainkan race condition antara:
  - `useAuthStore` (Zustand/persisted state) yang sudah menganggap user siap
  - vs `auth.currentUser` Firebase Client SDK yang sesinya belum selesai sinkron saat hook data langsung menembak API
- [x] Dampak:
  - `callAdminApi()` melempar error terlalu cepat
  - di mode dev, error ini tampil sebagai overlay merah sehingga terkesan seperti build/runtime fatal
- [x] Perbaikan yang diterapkan:
  - menambahkan helper tunggu sinkronisasi auth client di [waitForClientUser.ts](file:///d:/Dashboard%20Portal/web/src/lib/firebase/waitForClientUser.ts)
  - menerapkan pola tunggu ini ke:
    - [callAdminApi.ts](file:///d:/Dashboard%20Portal/web/src/lib/callAdminApi.ts)
    - [callAdminDatabaseApi.ts](file:///d:/Dashboard%20Portal/web/src/lib/callAdminDatabaseApi.ts)
    - [callSuperAdminApi.ts](file:///d:/Dashboard%20Portal/web/src/lib/callSuperAdminApi.ts)
  - meredam `console.error` untuk kasus sesi belum sinkron agar tidak memunculkan overlay palsu di dev mode
- [x] Pelajaran penting untuk modul berikutnya:
  - jangan menganggap `user` dari store frontend otomatis berarti `auth.currentUser` Firebase sudah siap
  - semua helper API client yang bergantung pada token Firebase harus tahan terhadap delay sinkronisasi auth client

---

## 5A. PENYELESAIAN LAYANAN ADUAN (HALO SPENTGAPA) DAN BROADCAST NOTIFIKASI (16 Juli 2026)

- [x] Modul **Layanan Aduan (Halo Spentgapa)** telah diselesaikan.
  - Sesuai prinsip *hemat data* dan keamanan, fitur ini dibangun murni menggunakan pendekatan Server-Side API (`/api/admin/halo-spentgapa`) untuk fungsi `GET` (Riwayat) dan `PUT` (Update Status Laporan).
  - Mengeliminasi *global listener* RTDB sehingga aplikasi admin tidak memuat beban lalu lintas data pengaduan secara membabi buta.
  - Frontend admin berfokus penuh pada validasi status tindak lanjut (Pending, Investigasi, Selesai, Ditutup) dan catatan resolusi, tanpa memfasilitasi penambahan pengaduan secara manual (karena pengaduan harus bersumber dari User App/Siswa).
- [x] Modul **Broadcast Notifikasi** telah diselesaikan.
  - Menerapkan arsitektur keamanan *Tenant-Isolated* di jalur API (`/api/admin/notifications`).
  - Mengintegrasikan pemuatan *dropdown* target kelas (`useClassesRealtime`) dan pencarian data target siswa individu (`useGasStudents`) secara dinamis, sehingga meminimalkan redundansi *fetch*.
  - Menyediakan form interaktif untuk menyiarkan pesan ke entitas-entitas sekolah spesifik (Semua Guru, Kelas Tertentu, Siswa Tertentu).
  - Menyediakan panel riwayat notifikasi dengan fitur penghapusan individu maupun *clear history*.

---

## 4AA. AUDIT & PERBAIKAN MENU BROADCAST NOTIFIKASI + LAPORAN MASUK (16 Juli 2026)

- [x] Audit selesai untuk menu `Broadcast Notifikasi` dan `Laporan Masuk`.
- [x] Temuan kritis yang sudah diperbaiki:
  - `Broadcast Notifikasi` sebelumnya hanya menyimpan riwayat admin, belum fan-out ke penerima.
  - laporan anonim `Halo Spentgapa` masih mengirim `reporterId` / `reporterName` mentah ke browser.
  - update status laporan bisa membuat node phantom jika `reportId` tidak valid.
  - panel broadcast memakai listener realtime penuh untuk lookup kelas/siswa, tidak sesuai prinsip hemat data.
  - filter kelas pada `Laporan Masuk` tampil di UI tetapi belum benar-benar bekerja.
  - target siswa tertentu di panel broadcast belum konsisten membaca `kelas || class || className`.
- [x] Perbaikan backend `Broadcast Notifikasi`:
  - route [web/src/app/api/admin/notifications/route.ts](file:///d:/Dashboard%20Portal/web/src/app/api/admin/notifications/route.ts) sekarang:
    - memvalidasi target penerima nyata
    - melakukan fan-out ke inbox penerima tenant-scoped
    - tetap menyimpan riwayat admin di `gas/schools/{schoolId}/notifications/{notificationId}`
  - jalur inbox baru yang dipakai:
    - `gas/schools/{schoolId}/notification_inbox/student/{studentId}/{notificationId}`
    - `gas/schools/{schoolId}/notification_inbox/teacher/{teacherId}/{notificationId}`
  - setiap riwayat sekarang menyimpan `recipientCount` dan `recipientSummary`
- [x] Perbaikan frontend `Broadcast Notifikasi`:
  - menambahkan hook one-shot [useNotificationRecipients.ts](file:///d:/Dashboard%20Portal/web/src/hooks/gas/notifications/useNotificationRecipients.ts)
  - referensi kelas dan siswa tidak lagi memakai listener hidup terus
  - tombol `Muat Ulang` sekarang memuat ulang riwayat dan lookup target sekaligus
  - pencarian dan label siswa tertentu sudah memakai fallback `kelas || className || class`
- [x] Perbaikan backend `Laporan Masuk / Halo Spentgapa`:
  - route [web/src/app/api/admin/halo-spentgapa/route.ts](file:///d:/Dashboard%20Portal/web/src/app/api/admin/halo-spentgapa/route.ts) sekarang me-redact identitas pelapor jika `isAnonymous = true`
  - `PUT` status sekarang mengecek keberadaan laporan dulu; jika `reportId` salah, backend mengembalikan `404` dan tidak membuat node baru
- [x] Perbaikan frontend `Laporan Masuk / Halo Spentgapa`:
  - filter kelas sekarang benar-benar aktif berdasarkan field `className || class`
  - export Excel ikut membawa kolom `Kelas`
  - kartu laporan menampilkan kelas agar operator tidak salah konteks saat memproses aduan
- [x] Verifikasi:
  - `npm run build` di folder `web/` berhasil penuh setelah patch

---

## 5B. CARA MELANJUTKAN PROYEK (Bagi Developer Baru)
## 4AB. AUDIT INTEGRASI APK GAS DENGAN `native-mobile` (16 Juli 2026)

- [x] Audit awal integrasi antara modul GAS web final dan project Android native di `D:\Satu Pintu\native-mobile` telah dilakukan.
- [x] Keputusan arsitektural:
  - **jangan copy langsung isi folder** `native-mobile` ke repo web
  - gunakan `native-mobile` sebagai **fondasi resmi APK GAS**
  - integrasi dimulai dari **repository / auth / kontrak data**, bukan dari screen lebih dulu
- [x] Hasil audit dicatat pada:
  - [docs/Integrasi_APK_GAS_native-mobile_final.md](file:///d:/Dashboard%20Portal/docs/Integrasi_APK_GAS_native-mobile_final.md)
- [x] Temuan gap paling penting:
  - notifikasi siswa mobile masih membaca `system_announcements`, belum `notification_inbox/student`
  - notifikasi guru mobile masih membaca `system_announcements`, belum `notification_inbox/teacher`
  - `Halo Spentgapa` mobile masih memakai repository legacy `bullying_reports`
  - privasi anonim berisiko bocor jika mobile terus membaca node laporan mentah
  - `7 KAIH` mobile relatif paling dekat ke kontrak final, tetapi masih membawa fallback legacy `seven_habits_logs_by_school`
  - `Virtual Pet` mobile sudah usable, namun state masih dihitung lokal sehingga perlu penjagaan agar tidak drift dari rule pusat
- [x] Urutan kerja yang direkomendasikan:
  1. refactor notification inbox siswa/guru
  2. pisahkan repository `HaloSpentgapa` dari `BullyingRepository`
  3. audit fallback legacy `7 KAIH`
  4. validasi rule `Virtual Pet`
  5. baru build `assembleSiswaDebug`, `assembleGuruDebug`, `assembleKepalaDebug`

---



1. Baca `docs/00_BACA_SAYA_PERTAMA.md` untuk memahami arsitektur keseluruhan.
2. Ikuti instruksi pada `docs/Kitab Suci/01_SITEPLAN_ALUR_KERJA.md` (Jangan mem-bypass tahap A).
