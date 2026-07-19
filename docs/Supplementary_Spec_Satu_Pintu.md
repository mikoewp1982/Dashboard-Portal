# SUPPLEMENTARY SPECIFICATION: DASHBOARD SATU PINTU (PortalKita)
**Dokumen Pendukung:** Non-Functional Requirements, Integrasi Firebase & Keamanan Mobile

---

## 1. NON-FUNCTIONAL REQUIREMENTS (NFR)
### A. Performa & Firebase Optimization (Free Tier/Spark Plan)
Mengingat aplikasi dimulai dengan RTDB versi gratis:
* **Concurrent Connections:** Query RTDB harus dilakukan sesuai kebutuhan halaman aktif saja. *Unsubscribe listener* sangat krusial setiap kali pengguna berpindah halaman untuk menghemat batas 100 koneksi simultan.
* **Payload Size:** Pembacaan data (terutama untuk `Master Data` dan `Lentera Digital`) harus memanfaatkan *pagination* atau filter waktu untuk menghindari terlampauinya limit *download bandwidth*.
* **Caching:** Memanfaatkan *Data Caching* Next.js di sisi server dan lokal storage Capacitor di aplikasi mobile.

### B. Keamanan & Isolasi Tenant
* **Data Privacy & Tenancy:** `schoolId` adalah pengunci mutlak. Akses `Admin Sekolah` diverifikasi oleh *backend session* dan tidak boleh ada titik di mana API me-*return* data lintas *tenant*.
* **Two Boundaries Strategy:** Project *Firebase Console* untuk GAS/Web Admin (Induk) terpisah dari Project *Firebase Console* untuk EduLock demi memisahkan *traffic* dan isolasi beban operasional (*device polling* tidak membebani portal absen).
* **Audit Trail:** Penambahan, pembaruan, dan hapus data (seperti mutasi *Virtual Pet* atau *Bypass Lock*) dicatat dengan rincian *timestamp*, *userId*, dan *schoolId*.

---

## 2. SPESIFIKASI TEKNIS MOBILE (CAPACITOR)
Aplikasi mobile (Siswa, Guru, Kepala Sekolah) menggunakan Next.js/React yang di-_compile_ dengan Capacitor.
* **Platform Minimum:** Android 9+ (API Level 28).
* **Native Plugins (EduLock Strict Mode):** 
    * EduLock APK pada gawai Siswa membutuhkan *Device Administrator Privilege* agar dapat menjalankan fitur `LockTask` atau `Kiosk Mode` via native plugin kustom yang dipanggil melalui *bridge* Capacitor.
    * Geolocation Plugin berjalan di *background* untuk mendeteksi *geofencing* presensi.
* **Session Persistence:** Sesi *login* disimpan di *local storage* dan dievaluasi terus-menerus selama token Firebase *valid*.

---

## 3. INTEGRASI PIHAK KETIGA
* **Firebase Cloud Messaging (FCM):** Notifikasi ke Capacitor *client*.
* **Firebase Realtime Database (RTDB) & Auth:** Tulang punggung penyimpanan data dan sistem autentikasi.
* **Kamus Eksternal (API):** Untuk APK Siswa, integrasi dengan *dictionaryapi.dev* (Inggris) dan *MyMemory* (Jawa & Terjemahan).

---

## 4. PERMISSION MATRIX (HAK AKSES)

| Fitur / Modul | Super Admin | Admin Sekolah | Kepala Sekolah (APK) | Guru (APK) | Siswa (APK) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **DATABASE (Data Induk)** | Full (Lintas Tenant) | Full (Tenant Sendiri) | Read (Ringkasan) | Read (Kelas) | No |
| **Status Layanan (Kill Switch)**| Full | No | No | No | No |
| **GAS: Presensi & Laporan** | Read | Full | Read (Eksekutif) | Write (Harian) | Write (Sendiri) |
| **GAS: 7 KAIH & Virtual Pet** | Read | Full | Read (Agregat) | Write (Nilai 7 KAIH) | Read (Monitor) |
| **Lentera (Literasi)** | Read | Full | Read (Statistik) | No | Write (Tugas/Pinjam)|
| **EduLock: Unlock & Zona** | Full | Full | No | No | No |

---

## 5. USER STORIES & ACCEPTANCE CRITERIA

**Story 1: Isolasi Tenant Admin Sekolah**
Sebagai Admin Sekolah, saya hanya ingin melihat dan mengelola data guru, siswa, serta aktivitas dari sekolah saya sendiri.
* **AC 1:** Setelah login di Web Admin, sistem memuat *dashboard* berdasarkan sesi Firebase berisikan token `schoolId` milik admin tersebut.
* **AC 2:** Jika admin berusaha melakukan eksploitasi API dengan mengganti ID sekolah di *request*, *backend* Next.js menolak (HTTP 403) karena tidak cocok dengan *claim session*.

**Story 2: Kill Switch Super Admin**
Sebagai Super Admin, saya ingin menonaktifkan operasional sebuah sekolah yang layanannya ditangguhkan.
* **AC 1:** Super Admin menekan tombol nonaktif di tabel `Status Layanan Sekolah`.
* **AC 2:** Atribut `isActive` di RTDB untuk tenant tersebut berubah. Sesi *login* milik Admin Sekolah, Guru, Kepala Sekolah, dan Siswa terkait otomatis diputus (ter-*logout*) dan akses baru ditolak secara *real-time*.

**Story 3: EduLock Terintegrasi Presensi (Capacitor)**
Sebagai Siswa, gawai saya otomatis masuk ke mode strict saat jam efektif sekolah.
* **AC 1:** Backend Next.js melakukan *mirroring* data status presensi ("Hadir") dari GAS ke RTDB EduLock secara otomatis.
* **AC 2:** Aplikasi Capacitor Siswa mendeteksi status "Hadir" dan waktu operasional. *Native plugin* Kiosk Mode aktif tanpa memutus fungsi presensi atau aduan di dalam aplikasi.

---

## 6. ROADMAP & MILESTONES (Revisi)

* **Phase 1 (Foundation & Multi-Tenant):** Setup Next.js 14, integrasi Firebase Admin SDK, skema RTDB (dua boundary), Super Admin Dashboard & Master Data tenant.
* **Phase 2 (Portal Web Admin):** Pengembangan modul GAS (Rekapitulasi, 7 KAIH), EduLock Dashboard, dan Lentera Digital.
* **Phase 3 (Capacitor Mobile):** Pengembangan antarmuka mobile web, implementasi Capacitor *native plugins* untuk *Geofencing* & *App Locking*, kompilasi menjadi APK (Siswa, Guru, Kepala Sekolah).