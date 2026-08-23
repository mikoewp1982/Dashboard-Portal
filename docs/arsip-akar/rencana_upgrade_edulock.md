# Dokumen Rencana Upgrade Arsitektur EduLock Siswa

Dokumen ini berisi usulan dan spesifikasi arsitektur tingkat lanjut untuk mengatasi celah keamanan (bypassing) pada aplikasi EduLock di HP pribadi siswa (BYOD). Karena pendekatan *Device Owner* (MDM) tidak memungkinkan untuk HP pribadi (mengharuskan *Factory Reset*), maka 2 (dua) ide di bawah ini adalah kombinasi kasta tertinggi yang bisa dicapai.

---

## IDE 1: Sistem Command + ACK & Deteksi Dini Pencopotan

### Konsep Dasar
Mengubah aplikasi dari sekadar *listener* pasif menjadi sistem komunikasi dua arah (Command & Acknowledgement). Sistem ini juga dilengkapi dengan mekanisme "Sinyal Bahaya" (Uninstall Detection) yang memantau percobaan pencabutan izin *Device Admin*.

### Spesifikasi Teknis
1. **Pemicu Bangun Cepat (FCM - Data Message):**
   * Backend Web Admin menggunakan Firebase Cloud Messaging (FCM) tipe **Data Message** (tanpa kolom notifikasi).
   * Berfungsi untuk menembus *Doze Mode* (Tidur Lelap) Android dan memaksa aplikasi EduLock bangun seketika di *background* untuk mengeksekusi kunci layar, tanpa perlu *polling* berkala yang boros data/baterai.
2. **Penyimpanan Status Final (RTDB):**
   * Realtime Database (RTDB) bertugas menyimpan perintah (misal: `status: LOCK`). Ini memastikan bahwa jika HP mati atau kehabisan kuota, perintah tidak akan hilang dan akan langsung tereksekusi saat internet kembali nyala.
3. **Laporan Balik (ACK):**
   * Setelah aplikasi berhasil mengunci layar, aplikasi **wajib** menulis status balik ke RTDB (misal: `{"status": "Terkunci", "timestamp": "07:00"}`).
   * Ini menjadi dasar bagi Web Admin untuk membuat **Dashboard Kepatuhan Real-time** (Daftar siswa yang sukses hijau, dan gagal merah).
4. **Deteksi Dini Pencabutan Akses (Sinyal Bahaya):**
   * Menyisipkan penulisan ke RTDB pada fungsi bawaan *Device Admin*:
     * `onDisableRequested`: Menembak status `WARNING_ATTEMPT` ke Firebase (Siswa sedang menekan tombol cabut akses di pengaturan).
     * `onDisabled`: Menembak status `CRITICAL_REVOKED` (Izin dicabut, aplikasi hampir pasti di-uninstall detik itu juga).

### Keuntungan
* **Visibilitas Penuh:** Guru memiliki bukti digital siapa saja yang sengaja mematikan paksa aplikasi saat jam pelajaran.
* **Sanksi Otomatis:** Sistem bisa diintegrasikan dengan modul *Disiplin (Halo Spentgapa)* atau status poin *Virtual Pet* yang akan otomatis turun jika siswa berstatus Offline/Gagal ACK.

---

## IDE 2: Pengemasan EduLock sebagai "Custom Launcher"

### Konsep Dasar
Mendaftarkan aplikasi EduLock agar dikenali oleh sistem operasi Android sebagai Aplikasi Layar Utama (Home Screen / Launcher). Ini adalah teknik yang digunakan oleh aplikasi *Parental Control* (seperti Google Family Link) atau Mode Kiosk.

### Spesifikasi Teknis
1. **Pembajakan Tombol Home:**
   * Aplikasi dikonfigurasi di `AndroidManifest.xml` dengan kategori `android.intent.category.HOME` dan `android.intent.category.DEFAULT`.
   * Akibatnya, saat siswa panik dan menekan tombol fisik/virtual **Home** untuk kabur dari layar kunci, sistem operasi justru akan me- *reload* (memuat ulang) layar kunci EduLock itu sendiri.
2. **Lingkungan Terisolasi (Kiosk-like):**
   * Di luar jam sekolah: Launcher menampilkan daftar seluruh aplikasi siswa secara normal.
   * Di dalam jam sekolah: Launcher menyembunyikan semua ikon hiburan (Game, Sosmed). Hanya menampilkan aplikasi yang diizinkan sekolah (misal: Aplikasi GAS, Kalkulator, Browser Khusus).

### Celah yang Harus Diantisipasi (Tugas Lanjutan Tim)
* **Jalur Pengaturan (Settings):** Siswa bisa menarik layar dari atas (*Notification Bar*) untuk masuk ke menu Pengaturan dan mengganti Launcher kembali ke bawaan pabrik. EduLock tetap harus secara reaktif memblokir akses ke aplikasi *Settings* selama jam sekolah.
* **Jalur Recent Apps:** Siswa bisa menekan tombol riwayat aplikasi (garis tiga) untuk berpindah ke aplikasi yang sebelumnya terbuka. Tim Android harus menerapkan *Screen Pinning* (Pin Layar) atau menyapu bersih *Recent Apps* saat transisi jam sekolah dimulai.

---

## IDE 3: Integrasi Ketergantungan (App Interdependency) GAS & EduLock

### Konsep Dasar
Ini adalah strategi "Sandera Psikologis". Mengubah aturan main sehingga aplikasi utama siswa (GAS) **hanya bisa digunakan jika** aplikasi EduLock ter-install dan berstatus aktif. Ini akan menghilangkan niat siswa untuk menghapus EduLock, karena mereka membutuhkannya untuk menyelamatkan nilai dan kehadiran mereka.

### Spesifikasi Teknis (2 Pilihan Cara Eksekusi)
1. **Pengecekan Lokal (Local Check):**
   * Setiap kali siswa membuka menu absensi/presensi di aplikasi GAS, aplikasi GAS memanggil fungsi `PackageManager` Android.
   * Fungsi ini mengecek apakah aplikasi `com.sekolah.edulock` ada di HP tersebut dan memiliki izin *Device Admin* yang menyala.
   * Jika tidak ada, tombol absen terkunci dan menampilkan pesan error peringatan.
2. **Pengecekan Cloud (Integrasi dengan Sistem ACK):**
   * Aplikasi GAS membaca data status siswa di Realtime Database Firebase.
   * Jika di *dashboard* server siswa tersebut berstatus "Merah/Offline" (EduLock dimatikan), maka seluruh fitur penting di aplikasi GAS ikut dikunci dari sisi server.

### Keuntungan
* Membalikkan beban tanggung jawab dari admin ke siswa. Siswa yang akan secara sukarela menjaga agar aplikasi EduLock di HP-nya tidak terhapus / tidak *force close*, supaya mereka tetap bisa melakukan presensi harian di aplikasi GAS.

---

## IDE 4: Mode Pantauan Senyap (Honeypot)

### Konsep Dasar
Daripada selalu memaksa mengunci layar (yang memancing siswa untuk memberontak/meretas), sistem membiarkan layar terbuka tetapi secara senyap memantau aplikasi apa yang sedang dibuka oleh siswa. Jika aplikasi tersebut masuk kategori "Ilegal", sistem langsung melaporkan ke Web Admin secara real-time. Ini disebut metode "Panopticon" (merasa selalu diawasi).

### Spesifikasi Teknis
1. **Daftar Putih (Whitelist) di Web Admin:**
   * Web Admin EduLock perlu ditambahkan 1 kolom input baru di menu Pengaturan tempat Admin mendaftarkan aplikasi "Halal" (misal: `com.satupintu.mobile`).
2. **Pengecekan Senyap di HP Siswa (0 Byte Kuota):**
   * EduLock di HP siswa membaca `UsageStatsManager` setiap beberapa detik untuk mengintip nama aplikasi yang sedang aktif di layar.
   * Proses ini berjalan murni di dalam HP, tidak memakan kuota internet sama sekali.
3. **Pengiriman Laporan Otomatis:**
   * Jika aplikasi yang dibuka TIDAK ADA di Daftar Putih (misal siswa buka TikTok), barulah EduLock menyalakan internet sebentar untuk mengirim teks berukuran super kecil (< 1 KiloByte) ke Firebase: `{"status":"Melanggar", "app":"TikTok"}`.
4. **Radar Pelanggaran di Web Admin:**
   * Perlu ditambahkan 1 kolom baru di tabel daftar siswa pada halaman Monitoring Web Admin (misal bernama "Aktivitas Terlarang").
   * Layar laptop guru di depan kelas akan memunculkan peringatan merah berkedip saat pesan pelanggaran tersebut masuk.

### Keuntungan
* Menciptakan efek kejut dan rasa *Paranoia* pada siswa. Ketakutan ditegur langsung oleh guru di depan kelas (rasa malu) jauh lebih ampuh mendisiplinkan siswa daripada sekadar menembus layar kunci mesin.

---

## IDE 5: Fitur Gembok Personal (Targeted Lock / Pengecualian)

### Konsep Dasar
Ini adalah pondasi teknis untuk mendukung pendekatan pendisiplinan **"Trust but Verify" (Percaya, tapi tetap Diawasi)**. Sekolah tidak menyalakan tombol Proteksi (Layar Kunci) secara global untuk seluruh sekolah, melainkan memberikan kepercayaan pada siswa. Layar hanya akan dikunci secara individu (Sistem Hukuman Spesifik) JIKA siswa tersebut terbukti melanggar aturan (misal terdeteksi oleh *Pantauan Senyap*).

### Spesifikasi Teknis
1. **Perubahan Logika Firebase RTDB:**
   * Saat ini, sistem hanya membaca status global: `school_settings/{schoolId}/protectionActive = true/false`.
   * Sistem harus diperbarui dengan logika Pengecualian Personal (Override): 
     `school_settings/{schoolId}/students/{studentId}/protectionOverride = true/false`
2. **Logika di HP Siswa:**
   * Aplikasi Android pertama-tama mengecek status global. Jika mati (Aman), aplikasi kemudian mengecek status personalnya. Jika status personalnya `true` (dihukum), maka HP siswa tersebut akan langsung terkunci meskipun teman-teman sekelasnya tidak terkunci.
3. **Pembaruan Web Admin:**
   * Tabel Monitoring Siswa di Web Admin ditambahkan 1 sakelar (toggle/button) kecil khusus berupa "Gembok Merah" di sebelah nama masing-masing siswa.
   * Saat tombol ini ditekan oleh Guru, *node* Firebase `protectionOverride` khusus milik siswa tersebut akan menyala, dan HP siswa itu langsung terkunci secara *remote*.

### Keuntungan
* Sangat mendidik dan memanusiakan siswa. Sistem tidak langsung mengekang, sehingga mengurangi niat awal siswa untuk memberontak/menghapus aplikasi. Efek "dipermalukan secara spesifik" karena layar terkunci sendirian di dalam kelas akan memberikan terapi kejut (shock therapy) yang sangat efektif.

---

## IDE 6: Anti-Bypass Mode Pesawat & Kebijakan Fail-Safe Offline Instan

### Konsep Dasar
Mengatasi celah keamanan di lapangan di mana siswa mengaktifkan **Mode Pesawat (Airplane Mode)** atau mematikan Paket Data/WiFi agar aplikasi EduLock tidak dapat menerima perintah penguncian dari server atau memutus sinyal pemantauan GPS/Heartbeat.

### Spesifikasi Teknis
1. **Pendeteksi Instan Mode Pesawat (`ACTION_AIRPLANE_MODE_CHANGED`):**
   * Mendaftarkan `BroadcastReceiver` dinamis dan statis untuk memantau perubahan status `Settings.Global.AIRPLANE_MODE_ON`.
   * Jika Mode Pesawat diaktifkan saat jam sekolah dan proteksi aktif, aplikasi **langsung mengunci layar dalam < 1 detik** (Instant Lockdown) tanpa menunggu timer offline.
   * Pesan Layar Kunci:
     > *"MODE PESAWAT DILARANG SAAT JAM SEKOLAH!*  
     > *Mematikan koneksi dianggap sebagai tindakan bypassing. Matikan Mode Pesawat untuk membuka kembali akses HP."*
2. **Pengetatan Batas Waktu Toleransi Offline (`OfflineMonitor.kt`):**
   * Mengubah `OFFLINE_THRESHOLD_MS` dari 20 menit menjadi **2 menit** saat jam sekolah aktif.
   * Mengubah `WARNING_THRESHOLD_MS` menjadi **1 menit** (menampilkan toast countdown peringatan).
   * Mencegah siswa bermain game offline / menonton video tanpa internet selama jam pelajaran.
3. **Penyekatan Akses Status Bar / Quick Settings (via Accessibility Service):**
   * Memantau event `TYPE_WINDOW_STATE_CHANGED` saat panel notifikasi / quick settings ditarik ke bawah saat layar dalam masa proteksi, dan secara otomatis menutupnya kembali (`performGlobalAction(GLOBAL_ACTION_BACK)` / `collapsePanels`).

### Keuntungan
* Menutup 100% celah bypassing berbasis radio/sinyal mati. Siswa tidak lagi bisa "bersembunyi" di balik Mode Pesawat untuk menghindari pengawasan sekolah.

---

## BACKLOG SESI 2026-07-28 & 2026-08-18 (Prioritas Berikutnya)

Catatan lapangan: saat HP sleep beberapa menit, OEM sering mematikan Accessibility. Selain itu siswa bisa menyalakan Mode Pesawat.

### P0 — Anti-Bypass & Fail-Safe Offline (Siap Diterapkan)
1. **Instant Airplane Mode Lockdown:** Pasang `ACTION_AIRPLANE_MODE_CHANGED` listener di `MonitoringService.kt`.
2. **Perketat Offline Threshold:** Ubah toleransi offline dari 20 menit ke 2 menit di `OfflineMonitor.kt`.
3. **Sandera GAS:** Absensi / fitur penting GAS terkunci jika EduLock Accessibility OFF / Device Admin OFF / status proteksi merah.
4. **Blokir tombol Buka GAS di EduLock** sampai Accessibility ON (saat proteksi admin ON).
5. **Dashboard merah:** Tampilkan status “Accessibility OFF / Mode Pesawat / Offline” di monitoring admin.

### P1 — Deteksi Bangun dari Sleep
6. Saat `SCREEN_ON` / `USER_PRESENT`: cek Accessibility; jika OFF + proteksi ON → dialog wajib aktifkan (alur Settings yang sudah diperbaiki, tanpa tendang balik).

### P2 — Force Update Super Admin (UI Web)
7. Halaman Super Admin untuk set `min_version_code_edulock` + `update_message` (client EduLock sudah ditanam 2026-07-28).

---
**Kesimpulan Eksekusi:**
Jika Ide 1 (Sistem ACK), Ide 2 (Launcher), Ide 3 (Ketergantungan Aplikasi), Ide 4 (Pantauan Senyap), Ide 5 (Gembok Personal), dan Ide 6 (Anti-Bypass Mode Pesawat & Fail-Safe Offline) ini digabungkan, maka sekolah memiliki **Sistem Pertahanan Berlapis (Defense-in-Depth)** yang kokoh secara teknis dan psikologis di lapangan.

