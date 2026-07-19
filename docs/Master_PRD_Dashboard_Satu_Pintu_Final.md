# MASTER PRD: DASHBOARD SATU PINTU (FINAL VERSION 2.0)
**Proyek:** Sistem Monitoring Sekolah Terintegrasi "PortalKita" (Multi-Tenant SaaS)
**Arsitektur:** Next.js 14, Firebase RTDB & Auth, Capacitor (Mobile)
**Status:** Siap Serah Terima ke Tim Pengembangan

---

## 1. KONSEP & ARSITEKTUR "SATU PINTU" (PortalKita)
Aplikasi ini menggunakan filosofi **Single Source of Truth** dengan arsitektur **Multi-Tenant**.
* **Dashboard PortalKita:** Pintu masuk utama (Web) bagi admin. Berisi modul `DATABASE`, `GAS`, `EduLock`, dan `Lentera Digital`.
* **Database Induk (DATABASE):** Modul ini adalah satu-satunya sumber data (Siswa, Guru, Staf, Kelas). Modul GAS, EduLock, dan Lentera tidak memiliki sumber identitas tersendiri, melainkan mengacu ke sini.
* **Isolasi Tenant (SaaS):** Setiap data dienkapsulasi menggunakan `schoolId`. Admin Sekolah hanya beroperasi dalam lingkup datanya sendiri.
* **Arsitektur Dua Boundary:** Menggunakan dua project Firebase terpisah (GAS/Portal dan EduLock) untuk memisahkan operasional harian dan kontrol keamanan perangkat.
* **Ekosistem Mobile (Capacitor):** Aplikasi mobile untuk Siswa, Guru, dan Kepala Sekolah dibangun menggunakan teknologi web yang di-*wrap* menggunakan Capacitor untuk menjadi file `.apk`.

---

## 2. MODUL SUPER ADMIN (PUSAT KONTROL)
Berperan sebagai pengelola tenant lintas sekolah.
* **Manajemen Tenant:** Provisi sekolah baru (`schoolId`), pembuatan akun `Admin Sekolah` dan `Kepala Sekolah`.
* **Status Layanan Sekolah:** *Kill Switch* tenant (jika layanan dinonaktifkan, seluruh akses Web, GAS, EduLock, dan Lentera milik sekolah tersebut akan ditangguhkan).
* **Monitoring:** Memantau pengguna aktif, status aktivasi device, dan kesehatan sistem.

---

## 3. MODUL ADMIN SEKOLAH (TENANT)
Beroperasi eksklusif dalam ruang lingkup data sekolahnya sendiri (`schoolId`).

### A. Modul DATABASE (Induk Data)
* **Manajemen User:** Mengelola Siswa, Guru/Wali Kelas, Petugas OSIS/Staf, dan struktur Kelas.
* Menjadi sumber data untuk pembuatan akun *login* Siswa dan Guru di aplikasi mobile.

### B. Modul GAS (Gerbang Aplikasi Sekolah)
* **Presensi:** Presensi Sekolah & Sholat dengan *geofencing*.
* **Monitoring & Laporan:** Rekap Kehadiran, Rekap Kedisiplinan, Monitoring E-Library, Rekap Sholat, Virtual Pet Monitor, dan 7 KAIH.
* **Gamifikasi (7 KAIH & Virtual Pet):** Penilaian karakter 7 KAIH saat ini dihitung dari log kebiasaan harian + rubric guru. Integrasi lintas-modul ke Virtual Pet tidak boleh diasumsikan otomatis tanpa jalur backend yang memang sudah ditegakkan.
* **Laporan Aduan & Broadcast:** Layanan anti-bullying dan notifikasi sekolah via FCM.

### C. Modul EduLock (Keamanan & Produktivitas)
* **Realtime Monitoring & Zone:** Pemantauan status perangkat siswa secara *realtime* (terkunci/tidak) berdasarkan zona.
* **Kontrol Perangkat:** Sinkronisasi kebijakan akses (pin buka kunci, reset device). Status *lock* dipicu otomatis berdasarkan kehadiran di modul GAS.

### D. Modul Lentera Digital (Literasi)
* **E-Library & Peminjaman:** Sistem perpustakaan digital sekolah, manajemen koleksi buku, dan denda.
* **Tugas Literasi:** Penugasan membaca untuk siswa dengan target waktu dan pengumpulan tugas. Terintegrasi dengan statistik profil siswa.

---

## 4. SPESIFIKASI APLIKASI MOBILE (CAPACITOR)
Aplikasi dibangun menggunakan web view + Capacitor plugins.

### A. Aplikasi Siswa
* **Fungsi:** Absensi, Presensi Sholat, Literasi (Lentera), Lapor Aduan, Profil 7 KAIH, Status Virtual Pet.
* **Keamanan EduLock:** Terintegrasi di *background* untuk mengunci perangkat jika berada di zona sekolah pada jam operasional. Terikat langsung dengan modul kehadiran GAS.

### B. Aplikasi Guru (Wali Kelas) & Staf
* **Fungsi:** Memantau presensi dan kedisiplinan kelas yang diampu, memberi nilai 7 KAIH, serta memvalidasi laporan aduan khusus kelasnya.

### C. Aplikasi Kepala Sekolah
* **Fungsi:** *Executive summary* operasional sekolah. Menampilkan statistik presensi seluruh sekolah, ringkasan Lentera, dan grafik 7 KAIH.
* Menggunakan antarmuka khusus (berbasis *grid*) untuk monitoring cepat.

---

## 5. INSTRUKSI TEKNIS UNTUK TIM DEVELOPER
1. **Firebase Free Tier (Spark Plan) Optimization:** 
   * Semua *query* RTDB wajib dibatasi cakupannya (`scoped by schoolId`).
   * Hindari menggunakan *listener* global tanpa filter untuk menghemat *concurrent connections* dan *bandwidth*.
   * Khusus layar `Monitoring & Laporan` yang bersifat histori/rekap besar, gunakan **one-shot fetch / on-demand refresh**. Jangan memakai `onValue()` / `onSnapshot()` hidup terus untuk log besar seperti rekap presensi, rekap sholat, monitoring literasi, Virtual Pet monitor, dan 7 KAIH.
   * Sediakan tombol **Muat Ulang** pada layar rekap/historis agar admin tetap memegang kontrol sinkronisasi data.
2. **Backend Enforcement:** Semua mutasi data yang sensitif (presensi manual, penambahan nilai 7 KAIH, perubahan virtual pet, sinkronisasi EduLock) WAJIB menggunakan API Route Next.js yang memverifikasi *token session* dan kewenangan *role*. Tidak boleh di-*write* langsung dari sisi *client* browser/Capacitor.
3. **No Legacy Fallback:** Sistem otorisasi admin murni bergantung pada validasi *backend*. Pembatasan melalui antarmuka UI saja (*Client Guard*) dianggap tidak aman.
4. **Mirroring Data Lintas Boundary:** Apabila data kehadiran GAS diperlukan oleh EduLock, proses salin (mirror) data harus dilakukan di sisi *server-side* API Route, bukan oleh APK Siswa.
