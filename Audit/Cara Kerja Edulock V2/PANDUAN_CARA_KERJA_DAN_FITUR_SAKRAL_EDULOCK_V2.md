# 🛡️ PANDUAN RESMI TIM BUG HUNTER: CARA KERJA & BATASAN SAKRAL EDULOCK SISWA V2

> **Target Pengguna:** Tim Bug Hunter, QA Penguji Lapangan, dan Security Pentester  
> **Objek Aplikasi:** EduLock Siswa V2 (Versi Aktif: `v1.3.54-80` / `v1.3.55-81`)  
> **Prinsip Utama:** *Temukan celah keamanan nyata (Kiosk Breakout / Anti-Uninstall Bypass), dan **JANGAN** laporkan perilaku yang memang sengaja didesain demi kenyamanan siswa (Aturan Sakral).*

---

## 📑 DAFTAR ISI
1. [BAGIAN 1: Arsitektur & Cara Kerja Nyata EduLock Siswa](#bagian-1-arsitektur--cara-kerja-nyata-edulock-siswa)
   - 1.1 Filosofi 6 Lapisan Pertahanan (*Defense-in-Depth*)
   - 1.2 Alur Operasional 3 Zona Kehidupan Siswa
   - 1.3 Mekanisme Hybrid Offline-First
2. [BAGIAN 2: Batasan Mutlak & Fitur Sakral ("INI BUKAN BUG!")](#bagian-2-batasan-mutlak--fitur-sakral-ini-bukan-bug)
   - 2.1 Matriks Komparasi "Sering Dikira Celah" vs "Aturan Desain Sah"
   - 2.2 Rincian 9 Aturan Sakral yang Dilarang Diotak-atik
3. [BAGIAN 3: Area Berburu Sah untuk Tim Bug Hunter](#bagian-3-area-berburu-sah-untuk-tim-bug-hunter)
   - 3.1 Kategori A: Celah Navigasi & Kiosk Breakout (UI Escape)
   - 3.2 Kategori B: Stabilitas Transisi ke APK GAS Siswa (Anti-Kickback)
   - 3.3 Kategori C: Siklus Daya, Reboot & Hardware Key Attack
   - 3.4 Kategori D: Anti-Tamper Izin Sistem & Anti-Uninstall 24/7
   - 3.5 Kategori E: Manipulasi Waktu & Jaringan
4. [BAGIAN 4: Format Standar Pelaporan Temuan Celah](#bagian-4-format-standar-pelaporan-temuan-celah)

---

# BAGIAN 1: ARSITEKTUR & CARA KERJA NYATA EDULOCK SISWA

EduLock Siswa bertindak sebagai **Dedicated Kiosk Locker & Mobile Device Management (MDM)** tingkat sekolah. Tugas utamanya adalah memastikan HP siswa terkunci pada jam belajar di sekolah dan hanya dapat mengakses aplikasi pembelajaran resmi sekolah (**GAS Siswa**), tanpa celah untuk membuka game, media sosial, atau mencopot pengawasan.

### 1.1 Filosofi 6 Lapisan Pertahanan (*Defense-in-Depth*)

EduLock tidak hanya mengandalkan satu pengunci sederhana, melainkan menggunakan 6 lapisan pertahanan yang saling mengawal:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Kiosk Mode / Lock Task (Screen Pinning API Android)           │
│          - Menahan layar utama, menonaktifkan tombol Recent & Bar Notif│
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Accessibility Service (AntiUninstallService)                  │
│          - Watchdog 24/7 mendeteksi event pergantian jendela sistem    │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Device Administrator (EdulockDeviceAdminReceiver)             │
│          - Mengunci tombol "Hapus Instalan" di Settings & Play Store   │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Engine Monitoring Berkala (MonitoringService)                 │
│          - Loop audit 3-5 detik: evaluasi jadwal, GPS, dan zona sekolah│
├────────────────────────────────────────────────────────────────────────┤
│ Layer 5: Layar Recovery Overlay (SYSTEM_ALERT_WINDOW)                  │
│          - Tirai penutup jika izin aksesibilitas atau GPS mati         │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 6: Telemetri & Remote Command (Firebase RTDB + FCM)              │
│          - Detak jantung (Heartbeat), lokasi GPS, dan remote lock/alarm│
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Alur Operasional 3 Zona Kehidupan Siswa

1. **Zona 1: Di Sekolah Saat Jam Belajar (Penguncian Ketat / Full Kiosk):**
   - `MonitoringService` mendeteksi jam sekolah aktif dan koordinat GPS siswa berada di dalam radius sekolah ($\le$ radius pagar sekolah).
   - Layar terkunci secara otomatis (*Lockdown Enforcement*), mengaktifkan mode Kiosk Merah (*Screen Pinning*). Siswa tidak bisa keluar ke beranda launcher ataupun menarik bar notifikasi.
2. **Zona 2: Membuka Aplikasi Belajar Resmi (GAS Siswa):**
   - Siswa menekan tombol **"BUKA APK GAS SISWA"** di layar Kiosk EduLock.
   - Terjadi transisi terkoordinasi: GAS dibuka terlebih dahulu selagi layar tertahan, lalu Kiosk dilepas saat jendela GAS sudah berada di posisi paling atas (*Top-Most*).
   - Komponen keyboard vendor (Vivo IME, Baidu, Gboard), gestur navigasi, dan System UI di-whitelist agar siswa nyaman belajar tanpa terlempar balik ke EduLock (*Anti-Kickback*).
3. **Zona 3: Di Luar Jam Sekolah / Di Rumah (Mode Bebas / Fail-Open):**
   - Siswa berada di luar radius sekolah (>1 km). EduLock otomatis membebaskan seluruh fungsi ponsel. Siswa bebas bermain game, menonton YouTube, dan bermedia sosial.

---

### 1.3 Mekanisme Hybrid Offline-First

EduLock tidak bergantung 100% pada koneksi internet:
* Seluruh jadwal jam masuk/pulang, koordinat GPS sekolah, radius toleransi, dan daftar whitelist aplikasi tersimpan di memori lokal perangkat (`PreferencesManager` / SQLite).
* Jika internet tiba-tiba mati atau kuota siswa habis di sekolah, sistem **tetap mengunci secara mandiri** berdasarkan data cache lokal tersebut.

---

# BAGIAN 2: BATASAN MUTLAK & FITUR SAKRAL ("INI BUKAN BUG!")

> ⚠️ **PERHATIAN SANGAT PENTING BAGI TIM TESTER:**  
> Banyak penguji pemula salah mengira perilaku yang sengaja didesain untuk kenyamanan dan privasi siswa sebagai "bug". Pelajari tabel di bawah ini sebelum melakukan pengujian!

### 2.1 Matriks Komparasi: "Sering Dikira Celah" vs "Aturan Desain Sah"

| No | Skenario yang Sering Dikira Bug | Fakta Sebenarnya (ATURAN SAKRAL) | Status Uji |
|---|---|---|---|
| 1 | *"Waktu jam sekolah, tapi HP siswa di rumah tidak terkunci sama sekali."* | **BUKAN BUG.** Kebijakan EduLock di rumah adalah **Fail-Open**. Siswa sakit/izin di rumah (>1 km dari sekolah) bebas memakai HP normal. Jam sekolah saja **TIDAK CUKUP** untuk mengunci HP tanpa bukti fisik lokasi di sekolah. | ✅ **DESAIN BENAR** |
| 2 | *"GPS dimatikan saat di rumah, kok tidak muncul overlay peringatan 'Aktifkan GPS'?"* | **BUKAN BUG.** Siswa di rumah berhak mematikan GPS demi privasi/hemat baterai. Overlay recovery GPS **hanya boleh muncul jika siswa berada di lingkungan sekolah**. | ✅ **DESAIN BENAR** |
| 3 | *"Pet siswa mati, muncul overlay pengingat, tapi tombol 'Saya Mengerti' bisa diklik dan layarnya tertutup."* | **BUKAN BUG.** Tombol *"Saya Mengerti"* **MEMANG WAJIB BISA DIKLIK**. Konsepnya adalah **Pengingat Berkala (Reminder)**, bukan kurungan mati. HP bisa dipakai sementara sampai jeda reminder berikutnya tiba (misal: 30m $\to$ 20m $\to$ tiap 10m). | ✅ **DESAIN BENAR** |
| 4 | *"Internet dimatikan saat jam sekolah, tapi tidak ada hitung mundur atau layar merah 'Koneksi Hilang'."* | **BUKAN BUG.** Aturan fail-safe offline 2 menit **RESMI DIHAPUS TOTAL** sejak 3 September 2026. Offline biasa tidak boleh menghukum siswa dengan lockdown tambahan. Hanya **Mode Pesawat** yang memicu lockdown keras. | ✅ **DESAIN BENAR** |
| 5 | *"Siswa pulang awal jam 13.00, awalnya terkunci di jalan tapi 30 menit kemudian kuncinya lepas sendiri."* | **BUKAN BUG.** Terdapat fitur **Sticky Reset 30 Menit**. Begitu siswa terdeteksi keluar area sekolah selama >30 menit, sistem menganggap siswa sudah pulang dan otomatis melepas kunci. | ✅ **DESAIN BENAR** |
| 6 | *"Hari Sabtu pagi siswa membuka EduLock di rumah secara offline, aplikasi tidak mengunci."* | **BUKAN BUG.** Sekolah menerapkan 5 hari kerja (Senin–Jumat). Fallback offline sengaja menyetel Sabtu & Minggu = Libur (`enabled = false`). | ✅ **DESAIN BENAR** |

---

### 2.2 Rincian 9 Aturan Sakral yang Dilarang Diotak-atik

1. **Aturan Rumah: Fail-Open Bebas Gangguan**
   - Di luar radius sekolah (>1 km, rumah, 0 presence) = **HP bebas 100%**. Siswa bebas membuka YouTube, game, dan media sosial.
   - Pengecekan jam sekolah wajib disertai gate kehadiran (`shouldAllowKioskAtSchool`). Jam efektif tanpa bukti lokasi di sekolah **HARAM** mengunci HP.
2. **GPS Mati di Rumah**
   - **DILARANG KERAS** memunculkan overlay *"Aktifkan GPS"* maupun mengunci HP jika siswa berada di rumah (gate `hasPresence` di `GpsEnableOverlay.kt`).
3. **Overlay Pet Mati di EduLock (Satu-satunya Pengecualian di Rumah)**
   - **Hanya aktif di luar jam sekolah / saat di rumah**. Begitu jam sekolah masuk, overlay pet mati otomatis ditutup agar tidak mengganggu pembelajaran.
   - **Tombol "Saya Mengerti" Wajib Berfungsi:** Menutup overlay sementara dan melepas kiosk agar HP bisa dipakai normal hingga reminder berikutnya tiba. Dilengkapi debounce klik 2 detik (`UNDERSTOOD_CLICK_DEBOUNCE_MS = 2000`).
   - **Tombol HOME HP:** Menekan tombol HOME mereset flag `isShowing` (`onUserLeaveHint`) agar reminder berikutnya tetap bisa muncul (tidak hilang selamanya).
   - **Auto-Dismiss:** Begitu admin/guru menekan tombol *"Hidupkan"* di Web Admin, overlay di HP siswa otomatis tertutup seketika.
4. **Pemisahan 3 Jalur: Offline Biasa vs Mode Pesawat vs GPS Mati**
   - **Offline Biasa (>2 menit):** Tidak ada overlay merah, tidak ada countdown. Sistem menggunakan cache lokal secara hening.
   - **Mode Pesawat (`AIRPLANE_MODE_ON == 1`):** **TETAP DIKUNCI / LOCKDOWN KERAS MERAH** di jam sekolah untuk mencegah celah pematian seluruh radio HP. Pengecualian hanya jika admin mengaktifkan **Mode Libur (Holiday Mode)**.
   - **GPS Mati di Sekolah:** Menampilkan overlay *"GPS MATI DI AREA SEKOLAH"* + tombol *"Buka Pengaturan Lokasi"*. Dilarang langsung memasang kiosk lockscreen merah agar siswa bisa menyalakan GPS.
5. **Transisi EduLock $\to$ GAS Siswa (Anti-Kickback)**
   - **0 Frame Launcher Home:** Tidak boleh ada sekilas frame layar beranda/desktop HP terlihat.
   - **0 Keyguard PIN/Pola:** Tidak boleh memicu layar kunci PIN/Pola HP.
   - **Anti-Kickback:** Aplikasi GAS harus menetap di layar, **tidak boleh ditendang balik ke EduLock** di detik ke 1–5 (pelepasan kiosk dikawal lifecycle `onStop`).
   - **OEM Whitelist:** Komponen keyboard bawaan vendor (Vivo, Xiaomi, Oppo, Tecno), gestur navigasi, System UI, dan WebView wajib di-whitelist.
6. **Anti-Uninstall & Anti-Deactivation Device Admin Berjalan 24/7/365**
   - Berjalan 24 jam sehari tanpa terikat jam sekolah maupun geofence.
   - Akses ke menu Device Admin EduLock, detail aplikasi (Paksa Berhenti / Copot Pemasangan), atau dialog uninstall EduLock **wajib seketika ditendang keluar**.
   - Daftar aplikasi umum lainnya di HP tetap boleh dikelola oleh siswa di rumah.
7. **Anti-Tamper Waktu & Zona Waktu (Kasus Tecno Pova)**
   - Evaluasi jam sekolah mengacu pada **WIB (`Asia/Jakarta`)** dan waktu server Firebase (`.info/serverTimeOffset`).
   - Siswa yang mengubah jam HP manual (misal mengubah siang 12.48 PM jadi 00.48 AM) tetap terbaca siang dan **tetap terkunci secara tegas di sekolah (06.00–15.00)**.
8. **Aksesibilitas Android 13+ (Bypass Titik 3 / Setelan Dibatasi)**
   - Alur 2-langkah: Tombol *Langkah 1: Info Aplikasi* (langsung membuka info app untuk klik titik 3 *"Izinkan setelan terbatas"*) $\to$ *Langkah 2: Aksesibilitas*. Grace period 5 menit.
9. **FCM Master Switch & Background Wakeup**
   - TTL FCM Master Switch wajib $\ge 86.400$ detik (24 jam) dan Find Device $\ge 300$ detik (5 menit). Menggunakan Partial WakeLock 30 detik agar HP yang tertidur pulas tetap responsif menerima perintah admin.

---

# BAGIAN 3: AREA BERBURU SAH UNTUK TIM BUG HUNTER

Fokuskan tenaga tim Anda untuk mencari celah pada skenario-skenario nyata di bawah ini:

### 3.1 Kategori A: Celah Navigasi & Kiosk Breakout (UI Escape)
*Kondisi Uji: Jam Sekolah Aktif + Berada di Lingkungan Sekolah.*

| ID | Vektor Uji / Skenario Serangan | Langkah Pengujian di HP Fisik | Kriteria Lolos (Aman) |
|---|---|---|---|
| **A1** | **Split-Screen / Layar Belah** | Saat Kiosk EduLock aktif, tahan tombol Recent Apps atau geser 3 jari ke atas untuk membagi layar. Coba jalankan YouTube di layar kedua. | Split-screen diblokir secara sistemik, atau jendela kedua langsung tertutup seketika. |
| **A2** | **Floating Window / Layar Mini** | Buka menu jendela mengambang bawaan vendor (Vivo Small Window, Xiaomi Floating Window, Oppo Mini Window). | Jendela mengambang dicegah muncul, atau langsung dihentikan oleh `AntiUninstallService`. |
| **A3** | **Panel Notifikasi & Quick Tiles** | Gesek layar dari atas ke bawah. Coba buka Pengaturan (Gerigi) atau klik notifikasi chat WhatsApp masuk. | Status bar terkunci (tidak bisa ditarik), atau klik notifikasi tidak dapat meluncurkan aplikasi luar. |
| **A4** | **Smart Sidebar & Game Turbo** | Tarik bilah pintasan game di tepi layar (Vivo Sidebar, Xiaomi Game Turbo, Oppo Game Space). | Pintasan game tidak bisa dibuka, atau jika terbuka langsung ditutup paksa. |
| **A5** | **Google Assistant / Voice Trigger** | Ucapkan *"Hey Google, buka YouTube"* atau tahan tombol Power / tombol Home. | Asisten suara tidak merespons, atau langsung ditutup saat mencoba meluncurkan browser/YouTube. |
| **A6** | **Keyboard Fisik via USB OTG** | Sambungkan keyboard fisik via OTG. Tekan `Alt + Tab`, `Win + D`, `Esc`, tombol `Home`. | Pintasan keyboard fisik tidak mampu memunculkan desktop HP atau mem-bypass Kiosk. |

---

### 3.2 Kategori B: Stabilitas Transisi ke APK GAS Siswa (Anti-Kickback)

| ID | Vektor Uji / Skenario Serangan | Langkah Pengujian di HP Fisik | Kriteria Lolos (Aman) |
|---|---|---|---|
| **B1** | **Klik Bertubi-tubi (Spam Click)** | Di beranda EduLock, tekan tombol *"BUKA APK GAS SISWA"* 10 kali secara cepat. | Tidak terjadi crash (ANR/NPE), tidak terjadi deadlock layar hitam, transisi tetap mulus. |
| **B2** | **Tombol Back Bertubi-tubi** | Masuk ke GAS, tekan tombol fisik `Back` berulang-ulang dengan cepat hingga GAS keluar. | Layar kembali ke EduLock secara mulus, **0 frame** melihat launcher beranda HP, dan tanpa meminta PIN layar kunci. |
| **B3** | **Mengetik dengan Keyboard Bawaan** | Buka form di GAS, ketik teks panjang memakai keyboard bawaan (Vivo IME, Baidu, Gboard). | EduLock **tidak menendang** siswa keluar dari GAS saat keyboard muncul di layar. |
| **B4** | **Penyelundupan Tautan Web Eksternal** | Di dalam form/pengumuman GAS, coba klik tautan web eksternal (`http://`, `https://`). | EduLock langsung mendeteksi browser eksternal yang terbuka dan menarik layar kembali dalam tempo <1 detik. |

---

### 3.3 Kategori C: Siklus Daya, Reboot & Hardware Key Attack

| ID | Vektor Uji / Skenario Serangan | Langkah Pengujian di HP Fisik | Kriteria Lolos (Aman) |
|---|---|---|---|
| **C1** | **Reboot Cepat (Restart Race Condition)** | Restart HP saat jam sekolah di area sekolah. Begitu layar hidup, langsung buka game secepat mungkin sebelum EduLock loading. | Waktu sebelum EduLock aktif seminimal mungkin; begitu service bangun, game langsung ditutup paksa. |
| **C2** | **Safe Mode Android Attack** | Masuk ke **Safe Mode** Android (di mana aplikasi pihak ketiga dimatikan oleh sistem). Coba uninstall EduLock. Kembali ke Normal Mode. | Device Admin menahan uninstall di Safe Mode; setelah kembali ke Normal Mode, proteksi langsung pulih 100%. |
| **C3** | **Tombol Darurat SOS & Kamera Lockscreen** | Tekan tombol Power 5 kali cepat (Panggilan Darurat) atau gesek kamera dari layar kunci. Coba lompat dari galeri foto ke aplikasi lain. | Pintasan kamera/galeri tidak bisa tembus ke menu aplikasi lain; EduLock langsung menahan layar. |

---

### 3.4 Kategori D: Anti-Tamper Izin Sistem & Anti-Uninstall 24/7
*Kondisi Uji: Bebas diuji di mana saja (di sekolah maupun di rumah).*

| ID | Vektor Uji / Skenario Serangan | Langkah Pengujian di HP Fisik | Kriteria Lolos (Aman) |
|---|---|---|---|
| **D1** | **Mencopot EduLock di Settings** | Masuk ke `Settings -> Aplikasi -> EduLock -> Copot Pemasangan / Paksa Berhenti`. | Aksesibilitas mendeteksi halaman tersebut dan menendang keluar ke Beranda/EduLock sebelum tombol sempat disentuh. |
| **D2** | **Mencabut Device Admin** | Masuk ke `Settings -> Keamanan -> Admin Perangkat -> EduLock -> Nonaktifkan`. | Dialog pencabutan langsung ditutup paksa oleh EduLock; tombol Deactivate tidak bisa disentuh. |
| **D3** | **Mematikan Layanan Aksesibilitas** | Masuk ke menu Aksesibilitas dan coba geser toggle EduLock menjadi OFF. | Toggle tidak sempat dimatikan, atau jika sempat mati, tirai overlay recovery langsung muncul memblokir HP. |

---

### 3.5 Kategori E: Manipulasi Waktu & Jaringan

| ID | Vektor Uji / Skenario Serangan | Langkah Pengujian di HP Fisik | Kriteria Lolos (Aman) |
|---|---|---|---|
| **E1** | **Mode Pesawat di Jam Sekolah** | Di area sekolah saat jam sekolah, aktifkan **Mode Pesawat (Airplane Mode)**. | Muncul layar merah *"MODE PESAWAT DILARANG SAAT JAM SEKOLAH!"* dan HP terkunci seketika. |
| **E2** | **GPS Dimatikan di Area Sekolah** | Di area sekolah saat jam sekolah, matikan GPS. | Muncul overlay *"GPS MATI DI AREA SEKOLAH"* + tombol *"Buka Pengaturan Lokasi"*. Tombol **bisa diklik** untuk menyalakan GPS kembali. |
| **E3** | **Manipulasi Jam Sistem (Format 12 Jam AM/PM)** | Matikan waktu otomatis jaringan, ubah jam siang 12.00 siang menjadi 12.00 AM (tengah malam) di HP. | EduLock tetap terkunci tegas di sekolah karena mengacu pada waktu server Firebase dan zona waktu WIB. |
| **E4** | **Lokasi Palsu (Fake GPS / Mock Location)** | Pasang aplikasi Fake GPS dari Opsi Pengembang untuk memalsukan posisi di luar sekolah. | Sistem mendeteksi koordinat mock dan menolak status "di luar sekolah". |

---

# BAGIAN 4: FORMAT STANDAR PELAPORAN TEMUAN CELAH

Setiap temuan celah keamanan atau bug yang **VALID** wajib dilaporkan menggunakan format berikut:

```markdown
### [TEMUAN-EDULOCK] <Judul Celah Singkat>
- **Tingkat Keparahan (Severity):** [CRITICAL / HIGH / MEDIUM / LOW]
- **Tipe Perangkat & OS:** [Contoh: Vivo Y18 / Android 14 / Funtouch OS 14]
- **Versi EduLock:** [Contoh: 1.3.54 (Build 80)]
- **Lokasi Pengujian:** [Di Area Sekolah / Di Rumah]
- **Vektor Uji:** [Pilih dari ID A1-A6, B1-B4, C1-C3, D1-D3, E1-E4]
- **Langkah-langkah Mereproduksi (Steps to Reproduce):**
  1. ...
  2. ...
  3. ...
- **Hasil yang Terjadi (Actual Result / Celah Berhasil):**
  [Jelaskan apa yang berhasil ditembus, misal: game berhasil terbuka di floating window]
- **Hasil yang Diharapkan (Expected Result):**
  [Jelaskan bagaimana seharusnya EduLock memblokir aksi tersebut]
- **Bukti Lampiran:**
  - Video rekaman layar singkat (.mp4 / .webp)
  - Logcat (jika ada):
    ```bash
    adb logcat -v time | Select-String "edulock|AntiUninstall|LockStateManager"
    ```
```

---

*Dokumen ini merupakan panduan resmi yang disinkronkan dengan dokumen induk [FITUR_STABIL_JANGAN_DISENTUH.md](../../FITUR_STABIL_JANGAN_DISENTUH.md) dan [AGENTS.md](../../AGENTS.md).*
