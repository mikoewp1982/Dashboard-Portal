# BACA SAYA PERTAMA - Panduan Indeks Navigasi Developer

Selamat datang, Tim Developer!
Folder repositori ini berisi spesifikasi sistem tingkat *Enterprise* untuk membangun aplikasi **Satu Pintu (PortalKita + GAS + EduLock)** dengan *tech-stack*: **Next.js, Capacitor/React Native, dan Firebase (Firestore, RTDB, Cloud Functions)**.

Sistem dokumentasi di sini didesain dengan konsep **"Single Source of Truth"**. Artinya, tidak boleh ada asumsi liar dalam pengembangan; segala bentuk fitur, algoritma, batasan, keamanan, hingga penamaan *folder* harus mengacu pada dokumen-dokumen di bawah ini.

Sebagai pegangan utama, berikut adalah fungsi dari masing-masing file dan urutan membacanya:

---

## TAHAP 0: STATUS & PROGRES SAAT INI
**Wajib dibaca dan diupdate oleh:** Semua anggota tim sebelum mulai bekerja.

0. **`handoff.md`**
   Dokumen progres aktual (*tracker*). Berisi catatan apa saja yang sudah selesai, apakah ada hambatan (*blockers*), dan apa yang harus dikerjakan selanjutnya. Wajib di-*update* setiap kali ada pencapaian *milestone* atau perpindahan *shift* antar-developer.

---

## TAHAP 1: PEMAHAMAN PRODUK & BISNIS
**Wajib dibaca oleh:** Project Manager, UI/UX Designer, Frontend, Backend.
Tiga dokumen ini berada di *root folder* dan menjelaskan *APA* yang mau dibuat.

1. **`Master_PRD_Dashboard_Satu_Pintu_Final.md`**
   *Product Requirements Document*. Menjelaskan gambaran besar produk, aktor yang terlibat (Super Admin, Admin Sekolah, Siswa, Guru), serta *goal* dari sistem SaaS *Multi-Tenant* ini.
2. **`Supplementary_Spec_Satu_Pintu.md`**
   Dokumen Non-Functional Requirements (NFR). Menjabarkan limitasi *Free Tier* Firebase, strategi memori, dan kebutuhan performa aplikasi saat dioperasikan secara massal.
3. **`TDD_Sistem_Terintegrasi_GAS_EduLock.md`**
   *Technical Design Document*. Menguraikan desain database terintegrasi (NoSQL) untuk memisahkan *tenant* (`schoolId`), arsitektur dasar API *routes*, dan *background jobs*.

---

## TAHAP 2: ATURAN MUTLAK UI/UX & FITUR
**Wajib dibaca oleh:** Frontend Developer (Web & Mobile), UI/UX Designer.
Berisi penjabaran spesifik (aturan main yang tidak boleh dilanggar) dari modul-modul kunci.

4. **`UI_UX_dan_Kesepakatan_Alur.md`**
   Mengunci *flow login* (NPSN), hierarki navigasi, dan larangan intervensi *routing* di luar ekosistem SPA PortalKita.
5. **`Spesifikasi_Virtual_Pet_dan_7KAIH.md`**
   Berisi algoritma gamifikasi. Rumus penentuan kondisi pet (Kenyang, Bahagia, Energi, Kesehatan). **Sangat Kritis:** Mengatur bagaimana matinya pet akan me- *lock* seluruh APK Siswa dan memicu masa tenggang (*Grace Period*) 12 jam setelah di-*revive*.
6. **`Spesifikasi_Lentera_Digital.md`**
   Menjelaskan aturan E-Library, standarisasi poin/waktu tugas membaca, dan instruksi merender file PDF secara *Native* (bukan *WebView*) melalui Capacitor.

---

## TAHAP 3: "KITAB SUCI" ARSITEKTUR & BACKEND
**Wajib dibaca oleh:** Backend Developer, Lead Engineer, DevOps/Architect.
Dokumen ini berada di dalam *folder* **`/Kitab Suci/`**. Mengandung instruksi operasional untuk membuat infrastruktur tidak roboh menahan puluhan ribu siswa. **Ikuti secara berurutan:**

7. **`01_SITEPLAN_ALUR_KERJA.md`**
   Urutan membangun sistem. **Aturan #1:** Bangun Web Admin dan amankan Backend terlebih dahulu. Jangan pernah menyentuh kodingan APK Mobile jika fondasi Backend Web belum stabil!
8. **`02_ARSITEKTUR_LENGKAP_FIREBASE.md`**
   Peta infrastruktur (Auth dengan *Custom Claims*, Firestore Rules, Storage Rules, dll).
9. **`03_ARSITEKTUR_KOKOH_MASSAL.md`**
   Strategi teknis menahan *load* tinggi (Jam 07:00 pagi saat 50 sekolah absen serentak). Menjelaskan *idempotency keys* untuk mengatasi koneksi putus-nyambung.
10. **`04_CHECKLIST_IMPLEMENTASI_BACKEND.md`**
    Ceklis *step-by-step* untuk mendeploy fungsi *Cloud Functions* tanpa celah peretasan GPS atau bobolnya data antar-sekolah.
11. **`05_STRUKTUR_FOLDER_WEB.md`**
    Standarisasi susunan *folder* dalam proyek `Next.js` agar seragam.
12. **`06_KONTRAK_API_FUNCTIONS.md`**
    Spesifikasi API (*Request/Response payload*). Frontend tidak boleh memanggil Firebase langsung untuk penulisan data sensitif; semuanya wajib melalui spesifikasi API ini.
13. **`07_STRUKTUR_FOLDER_MOBILE.md`**
    Standarisasi struktur *folder* aplikasi APK/Mobile, khususnya letak integrasi SQLite lokal untuk fitur *Offline-Sync* absensi.

---

---

## TAHAP 4: "KITAB EDULOCK" NATIVE ANDROID
**Wajib dibaca oleh:** Mobile (Android) Developer.
Khusus untuk aplikasi pengunci layar HP siswa (EduLock), pengembangan **TIDAK BISA 100% menggunakan web/Capacitor**. Dibutuhkan kodingan Native Kotlin tingkat rendah untuk API OS (seperti `AccessibilityService`, `DeviceAdminReceiver`, `startLockTask`). 
Semua rahasia, SOP lapangan, dan pedoman arsitektur penguncian (anti-bocor) ada di dalam folder **`/Kitab Edulock/`**. 

Beberapa dokumen kuncinya:
14. **`SOP operasional dan troubleshooting EduLock.md`**: Wajib baca! Menjelaskan SOP penyelamatan lapangan jika HP siswa *error* dan terkunci total.
15. **`spesifikasi-lockstatemanager-edulock.md`**: Arsitektur `Single Source of Truth` kapan HP siswa harus dikunci atau dibuka secara instan.
*(Lihat isi folder tersebut untuk 7 dokumen teknis lainnya).*

---

### Pesan Kepada Developer:
Bacalah dokumen ini sebagai peta jalan Anda. Jika di lapangan terjadi kebingungan atau celah fungsi, selesaikan dengan kembali membaca dokumen yang relevan di atas. Selamat bekerja membangun ekosistem Satu Pintu!
