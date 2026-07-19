# Product Requirements Document (PRD): Web Super Admin (PortalKita)

## 1. Pendahuluan
Modul **Super Admin** adalah pusat komando tertinggi untuk seluruh sistem PortalKita. Halaman ini dirancang eksklusif untuk staf pengelola (operator pusat) yang memegang kewenangan absolut lintas sekolah (lintas-*tenant*).

### 1.1 Tujuan
- Menyediakan *interface* terpadu untuk melakukan manajemen *multi-tenant* tanpa harus membuka Firebase Console secara langsung.
- Memungkinkan pemantauan performa layanan, manajemen akses administrator sekolah, dan penyelesaian isu (*support request*) secara *real-time*.

### 1.2 Target Pengguna
Pengguna yang memiliki *Custom Claims* Firebase Auth dengan nilai `role: "super_admin"`. Pengguna biasa, guru, atau admin sekolah tidak akan bisa mengakses URL atau memanggil fungsi-fungsi *backend* dari modul ini.

---

## 2. Arsitektur & Keamanan Inti

- **Keamanan Frontend:** Menggunakan *middleware* dan `useAuthStore` untuk memblokir akses (`redirect` ke `/login`) jika `role` bukan `super_admin`.
- **Keamanan Database (RTDB):** Diatur oleh `database.rules.json`. Akses baca lintas-sekolah di blokir sepenuhnya kecuali pemanggil membuktikan dirinya adalah `super_admin`.
- **Komunikasi Backend:** Tidak menggunakan REST API (Next.js `/api/*`), melainkan secara murni dan eksklusif memanggil **Firebase Cloud Functions (Callable)** via `httpsCallable`. Hal ini memastikan skalabilitas dan isolasi keamanan (RBAC) ditegakkan di level server.
- **State Management:** *State* internal komponen dikelola menggunakan standar React Hooks, disuplai data realtime (RTDB `onValue`) untuk halaman monitoring.

---

## 3. Struktur Halaman & Fitur Utama

Halaman utama terletak pada rute `/dashboard/super`. Modul ini dibagi menjadi beberapa sub-menu / navigasi utama:

### 3.1 Dashboard Monitoring Utama (`/dashboard/super` & `super-admin/database`)
Menampilkan ringkasan metrik eksekutif dan pemantauan kualitas data secara garis besar.
- **Statistik Eksekutif:** Menampilkan jumlah total Tenant (Sekolah), Tenant yang *Live*, Admin Terprovisi, dan Akun Kepala Sekolah yang aktif.
- **Monitoring Anomali:** Mendeteksi "*Gap Data*" seperti sekolah yang belum punya identitas login admin, atau sekolah yang belum memiliki Kepala Sekolah.
- **Log Keamanan (Audit Logs):** *Feed* *real-time* yang menampilkan rekaman log siapa yang login, melakukan akses, atau berbuat pelanggaran (maks. 200 data terakhir).

### 3.2 Tenant / School Management (`/dashboard/super/tenants` atau *tab* Schools)
Pusat kontrol pendaftaran dan pembukaan/penutupan akses *tenant*.
- **CRUD Registry Sekolah:** Menambah, mengubah (NPSN, Nama, Region), dan mengatur bendera operasional (*isActive*) untuk sebuah sekolah.
- **Tabel Daftar Sekolah:** Menampilkan profil kelengkapan identitas masing-masing sekolah.

### 3.3 Relasi Akses: Admin Sekolah & Kepala Sekolah
Fasilitas *provisioning* akses level manajerial institusi.
- **Akun Admin Sekolah (`admins`):** *Super Admin* mendaftarkan *username/email* dan *password* awal yang akan dipakai *Admin Sekolah* untuk masuk ke Portal. Juga memiliki tombol **Bootstrap Login Default** untuk injeksi konfigurasi instan dengan standar *password* bawaan.
- **Akun Kepala Sekolah (`principals`):** Mendaftarkan *username* khusus bagi Kepala Sekolah untuk mengakses APK Android/iOS mereka. Dilengkapi fitur eksklusif **Reset Device** jika Kepala Sekolah kehilangan ponsel (sehingga kunci *Device ID* dapat direset).

### 3.4 Broadcast Lintas Sekolah (`/dashboard/super/broadcast`)
Alat komunikasi satu arah (pengumuman massal).
- Memungkinkan pembuatan pesan darurat atau pengumuman *maintenance*.
- Otomatis tayang di *Dashboard* masing-masing level admin sekolah dan/atau guru.

### 3.5 Global Configuration (`/dashboard/super/global-config`)
Mengubah parameter sistem portal secara universal.
- Misalnya batas *Rate Limiting*, aturan sinkronisasi, versi minimum aplikasi yang didukung (Force Update Config), dll.

### 3.6 Support Tools (`/dashboard/super/support`)
*Helpdesk* antrian tiket untuk aksi teknis yang tidak bisa diselesaikan oleh level sekolah.
- Jenis Request: `clear_cache`, `rerun_sync`, `reset_access`.
- Menyediakan *queue list* berstatus `OPEN`, `DONE`, `CANCELLED`.
- *(Catatan: eksekusi mekanik fungsinya di backend membutuhkan implementasi Cloud Function yang terpisah).*

### 3.7 Manajemen Sync Jobs (`/dashboard/super/sync-jobs`)
Memonitor status proses *background* atau antrian pekerjaan berat dari berbagai sekolah.
- Menampilkan ID pekerjaan, asal sekolah, jenis sinkronisasi, dan status (*QUEUED*, *COMPLETED*, *FAILED*).

### 3.8 Service Status (`/dashboard/super/service-status`)
Pemantauan *uptime* dan pengecekan kesehatan server.

### 3.9 Audit Logs (`/dashboard/super/audit`)
Halaman arsip untuk pelacakan dan mitigasi ancaman keamanan secara historikal, merekam tindakan *Super Admin* dan *Admin Sekolah*.

---

## 4. Status Penyelesaian & Finalisasi
Secara keseluruhan, arsitektur dan implementasi halaman Web Super Admin sudah **100% Final**. 
- Tidak ada *error* TypeScript.
- Telah terhubung penuh ke *Firebase Cloud Functions* (Callable).
- Akses baca telah diamankan menggunakan kebijakan *Custom Claims* dan Firebase Security Rules.
- Modul *Support Tools* telah aktif sepenuhnya (Cloud Functions `create-support-request`, `set-support-request-status`, dan `delete-support-request` telah diimplementasikan dan diregistrasi).

Halaman ini siap beroperasi secara *production-ready* untuk mengendalikan *tenant* sekolah.

---

*Status PRD: FINALIZED & IMPLEMENTED (Tahap Super Admin Selesai)*
