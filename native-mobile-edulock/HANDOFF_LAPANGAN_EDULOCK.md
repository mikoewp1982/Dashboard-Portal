# Handoff Lapangan EduLock — Panduan Troubleshooting untuk Admin / Guru IT Sekolah

**Versi APK yang diasumsikan:** EduLock Siswa **1.3.22** (`versionCode` 48)  
**File Final:** `Apk Release/Final/EduLock-1.3.22-48.apk` + alias `EduLock-studentRelease.apk`  
**Sumber:** kode `native-mobile-edulock/` + dashboard web EduLock (bukan tebakan fitur)  
**Tanggal dokumen:** 2026-08-20 (Final rebuild 09:52, SHA `CD7379A3…`)  

> **Catatan build terkini (v1.3.22 / 48):**
> 1. **Anti-Uninstall selektif 24/7 (1.3.19–1.3.22):** Device Admin / detail EduLock / dialog uninstall EduLock → ditendang (`BACK` + `HOME` + relaunch). Daftar aplikasi lain tetap boleh dikelola. Kecuali izin Uninstall Bypass (“Buka Gembok”) dari dashboard.
> 2. **Setelah sleep lama (1.3.20+):** Accessibility kadang “ON tapi event mati”. Build ini punya watchdog + poke saat layar nyala. Jika Device Admin tidak ditendang setelah sleep panjang → pastikan Accessibility **EduLock Protection** masih ON (OEM sering mematikannya setelah update APK), lalu uji ulang.
> 3. **Setup awal (1.3.22):** halaman **Tampil di atas aplikasi lain** / Baterai / Accessibility **tidak** ditendang sebelum konfigurasi selesai. Setelah setup, Device Admin tetap ditendang.
> 4. **UI Status Monitoring (1.3.22):** bawah layar menampilkan `Versi 1.3.22 (48)`. Baris jarak: `Jarak: N meter (terpenuhi)` / `(tidak terpenuhi)` vs radius sekolah.
> 5. **Overlay pet mati (1.3.22):** hanya di luar jam sekolah. Interval mengikuti pengaturan admin `first → second → repeat` (contoh 30→20→10); setelah itu ulang **angka terakhir**. Overlay pertama **menunggu** interval pertama (tidak langsung). Tombol **Saya Mengerti** = HP bisa dipakai sementara; konsekuensi = gangguan berkala sampai pet di-revive.
> 6. **Izin “Tampil di atas aplikasi lain” dicabut OEM (1.3.22 rebuild):** sering terjadi setelah sleep + Mode Senyap. Saat proteksi ON lagi, EduLock harus **bangun sendiri** + tampilkan prompt aktifkan overlay (bukan menunggu buka app manual). Jika masih tidak muncul, nyalakan layar / ketuk notifikasi EduLock.
> 7. **FCM + keep-alive (1.3.22 rebuild):** token FCM disimpan ke monitoring. Setelah install **wajib buka EduLock sekali**. OFFLINE di dashboard = proses EduLock mati (bukan “HP tidak dipakai”). Proteksi ON saat siswa main TikTok harus bisa mengunci tanpa buka app manual (FCM wake + keep-alive).
> 8. **Jadwal jam sekolah:** ubah di **GAS Presensi** (bukan form EduLock yang read-only). Pastikan kartu Jam Sekolah di HP menampilkan jam baru.
> 9. **Izin per Kelas:** interval/jam mengikuti WIB; jika “Berakhir” di admin aneh (mis. 20.29 untuk sesi 13:29), itu gejala timezone lama — APK baru memakai jam sesi lokal.
> 10. **Overlay wajib GPS (rebuild 20 Agu 09:52):** buka EduLock + GPS mati → overlay **“GPS MATI! Nyalakan GPS…”** + tombol **Buka Pengaturan Lokasi**, **meski proteksi masih senyap**. **Jangan kiosk** selama GPS mati (tombol Settings harus bisa dipakai). Overlay tertutup sendiri setelah GPS nyala.
> 11. **Saklar proteksi ON:** tidak memaksa status “di sekolah”. Kunci HP hanya jika jam sekolah **dan** ada bukti lokasi/kehadiran. Anak di rumah dengan GPS nyala tidak boleh terkunci seolah di sekolah.
> 12. **GPS mati lalu masuk sekolah:** jangan lock screen/kiosk. Overlay **“GPS MATI DI AREA SEKOLAH”** → siswa nyalakan GPS → baru proteksi normal. (`GpsEnableOverlay`)
> 13. **Grace Period 10 Menit Mode Darurat** · **Mode Pesawat instan** di jam sekolah · **Offline fail-safe 2 menit** · **Mode Libur** untuk bebas seharian.
> 14. **Cadangan Rollback:** `Final\EduLock-1.3.12-38.apk` (umum) · `Final\EduLock-1.3.19-45.apk` (anti-uninstall selektif).
> 15. **Unduhan live `/e`:** belum otomatis sama dengan Final — ikuti file Final (SHA rebuild 20 Agu 09:52: `CD7379A3…`).

---

## 0) Baca ini dulu (2 menit)

1. **EduLock mengunci HP hanya pada jam sekolah efektif** (jadwal sinkron dengan GAS Presensi) + proteksi sekolah ON + bukan Mode Libur + tidak ada izin HP aktif.
2. **Fail-Safe Offline di Jam Sekolah:** Siswa **DILARANG KERAS** menyalakan Mode Pesawat atau mematikan internet > 2 menit saat jam sekolah. Sistem akan tetap mengunci HP walaupun status proteksi sedang dimatikan admin (jam istirahat).
3. **Internet mati massal di sekolah?** Pakai **Mode Darurat** (ketuk 7× + password harian) dengan batas 10 menit, **atau** nyalakan **Mode Libur (Holiday Mode)** dari dashboard admin.
4. **Acara / outclass / instalasi massal?** Wajib gunakan dashboard: **Mode Acara/Libur Sekolah** agar siswa bebas tanpa terkunci fail-safe offline.
5. **Uninstall hanya boleh** setelah Admin memberi izin uninstall (atau kode uninstall sekolah dari Super Admin). Jangan bilang siswa “uninstall sendiri” tanpa izin.
6. **GAS vs EduLock:** login & binding perangkat memakai data siswa GAS (NPSN + NISN + Nama). Satu akun ≈ satu perangkat.
7. **Cek versi di HP:** buka EduLock → scroll ke bawah layar utama → teks `Versi x.y.z (N)`. Harus **1.3.22 (48)** untuk panduan ini.

---

## 1) KODE DARURAT (simpan & bagikan hanya ke guru IT / admin)

### Cara membuka Mode Darurat di HP yang terkunci

| Layar | Cara ketuk | Timeout antar ketuk |
|-------|------------|---------------------|
| Layar kunci merah (`LockScreen` — pesan seperti “MODE PESAWAT DILARANG”, “KONEKSI HILANG”, “GPS MATI”, “KELUAR AREA…”) | Ketuk **sembarang area layar** (bukan hanya tombol) **7 kali** | Reset jika jeda > **3 detik** |
| Overlay kunci gelap (`OverlayLock` — “PERANGKAT TERKUNCI!”, GPS/aksesibilitas) | Ketuk **sembarang area** **7 kali** | Reset jika jeda > **1,2 detik** |

Mulai ketuk ke-2/3, biasanya muncul toast: **“Ketuk X× lagi…”** / **“…untuk Mode Darurat…”**.

### Password harian

```
EduLock{tanggal_hari_ini}
```

- `{tanggal_hari_ini}` = tanggal kalender HP (1–31), **tanpa nol di depan**.
- Contoh: tanggal **2** → `EduLock2` · tanggal **15** → `EduLock15` · tanggal **31** → `EduLock31`.
- Dialog UI: judul **“Mode Darurat”**, hint **“Password Darurat”**, tombol **“Buka”**.
- Password salah → toast **“Password Salah!”**.

### Apa yang terjadi setelah password benar? (Grace Period 10 Menit)

1. Mode darurat aktif (`isEmergencyUnlocked`) dengan **batas waktu 10 Menit (Grace Period)**.
2. Layar kunci ditutup, kiosk dimatikan sementara.
3. Notifikasi sistem menampilkan: **“Mode Darurat — Sisa waktu: X menit”**.
4. **Setelah 10 Menit habis:** Jika internet masih mati atau mode pesawat masih ON, sistem akan **otomatis mengunci kembali** dengan pesan *"Waktu Darurat Habis"*.
5. **Begitu internet kembali:** mode darurat **otomatis off**, monitoring normal dilanjutkan (toast: **“Internet Kembali. Mode Darurat Dinonaktifkan.”**).
6. Kejadian dicatat lokal sebagai pelanggaran `EMERGENCY_UNLOCK` (audit).

### Tombol “Buka Kunci Admin” (kasus khusus)

- Tombol **“Buka Kunci Admin”** biasanya **tersembunyi**; muncul bila ada upaya mematikan Device Admin (`ADMIN_PROTECTION`).
- Password yang sama: `EduLock{tanggal}` → juga mengaktifkan Mode Darurat 10 menit.
- **Bukan** remote unlock dari dashboard.

> Password darurat **bukan untuk dibagikan ke siswa**. Hanya guru IT / admin lapangan.

---

## 2) Pohon keputusan cepat (gejala → langkah)

| Gejala | Langkah pertama | Jika belum selesai |
|--------|-----------------|-------------------|
| Internet sekolah mati, banyak HP terkunci | Mode Darurat (7× + `EduLock{tgl}`) **atau** dashboard: Mode Libur / Mode Senyap (butuh 1 perangkat admin online) | Kumpulkan bukti → eskalasi |
| GPS mati saat **buka EduLock** | Overlay “GPS MATI” + **Buka Pengaturan Lokasi** (juga saat Mode Senyap) | Nyalakan Lokasi; overlay hilang sendiri; **bukan** kiosk |
| GPS mati lalu **masuk area sekolah** | Overlay **“GPS MATI DI AREA SEKOLAH”** (bukan lock screen) | Nyalakan GPS dulu; setelah itu proteksi normal |
| GPS mati di sekolah (HP dipakai app lain) | Overlay GPS **tanpa kiosk** (tombol Pengaturan Lokasi harus bisa dipakai) | Nyalakan GPS dulu; jangan pakai lock screen penuh |
| Terkunci padahal di luar / sakit | Cek jam sekolah, Mode Libur, apakah GPS sempat “dekat sekolah” hari ini | Jangan paksa unlock massal tanpa kebijakan; rebuild 20 Agu **tidak** mengunci rumah hanya karena saklar proteksi ON |
| Overlay nempel / tidak bisa keluar | Cek Mode Senyap/Libur; izin HP; Accessibility ON | Mode Darurat jika offline |
| Tidak bisa uninstall | Harus ada izin uninstall dari Admin | Super Admin: kode uninstall sekolah |
| Login gagal / “sudah di perangkat lain” | Reset binding di data siswa (Admin pusat/GAS) | Lihat §8 |
| Layar “wajib update” | Install APK terbaru dari Admin Sekolah | Super Admin turunkan `min_version` jika salah |
| Pet mati (Virtual Pet) | Di **luar jam sekolah**: tunggu interval pertama admin → overlay → **“Saya Mengerti”** (HP bisa dipakai) → muncul lagi sesuai 30→20→10 (atau setting admin), lalu ulang angka terakhir | Tidak memblokir jam sekolah; revive pet via admin |
| Versi APK tidak jelas | Lihat teks `Versi …` di bawah layar utama EduLock | Bandingkan dengan Final `1.3.22-48` |
| Setup Overlay “ditendang” | Pastikan APK **≥ 1.3.22**; ulangi Konfigurasi Awal | Jika masih 1.3.21, update APK |
| Proteksi ON tapi HP tidak terkunci (setelah sleep) | Cek izin **Tampil di atas aplikasi lain**; biarkan EduLock/prompt muncul sendiri (build 1.3.22+) | Nyalakan layar / ketuk notifikasi EduLock; aktifkan overlay |
| Proteksi ON + jam sekolah tapi masih bisa TikTok / monitoring OFFLINE | Buka EduLock sekali (daftar FCM); pastikan baterai unrestricted + Accessibility ON; cek bukan “Token FCM belum sinkron” | Sleep/wake HP; toggle Master Switch lagi; eskalasi jika tetap OFFLINE |
| Device Admin tidak ditendang setelah sleep | Nyalakan ulang **EduLock Protection**; buka Device Admin lagi | Sleep lama → uji watchdog 1.3.20+ |
| App “tidak jalan” / mati sendiri | Setup 6 izin + battery unrestricted + Accessibility | Brand-specific (Vivo/Xiaomi/Oppo) |

---

## 3) Checklist izin wajib (Setup awal — label UI)

Di **Konfigurasi Awal**, siswa harus menyelesaikan 6 item:

1. **Izin Lokasi** — deteksi area sekolah  
2. **Izin Kamera** — scan QR kode izin  
3. **Admin Perangkat** (Device Admin)  
4. **Aksesibilitas** → cari **EduLock Protection** → **Aktifkan** (konfirmasi dialog vendor)  
5. **Tampil di Atas Aplikasi Lain** (overlay)  
6. **Izin Latar Belakang** — abaikan optimasi baterai  

Tanpa Accessibility + Device Admin saat proteksi ON + jam sekolah + di dalam zona → HP bisa dikunci dengan pesan:

> **“PROTEKSI WAJIB AKTIF! Buka Aksesibilitas > Layanan Terinstall > EduLock Protection -> AKTIFKAN.”**

**Catatan v1.3.22:** saat masih di Konfigurasi Awal, halaman Overlay / Baterai / Accessibility **boleh** dibuka tanpa ditendang. Setelah setup selesai, upaya masuk Device Admin untuk menonaktifkan EduLock akan ditendang.

Di layar utama setelah login: cek **Status Monitoring** (GPS, lokasi, internet, jarak terpenuhi/tidak) dan teks **Versi** di paling bawah.

---

## 4) Skenario lapangan (langkah bernomor)

### A. Internet tiba-tiba mati (satu kelas / satu gedung)

1. Pastikan ini gangguan jaringan, bukan HP siswa saja (cek Wi‑Fi/hotspot guru).
2. Di HP yang terkunci (layar merah/gelap):
   1. Ketuk layar **7×** cepat (lihat tabel §1).
   2. Masukkan `EduLock` + **tanggal hari ini**.
   3. Tekan **Buka**.
3. Beri tahu siswa: setelah internet hidup, kunci bisa kembali otomatis — itu normal.
4. Alternatif jika admin dashboard masih online dari HP/PC lain:
   - Nyalakan **Mode Acara / Libur Sekolah**, atau
   - Matikan **Status Proteksi Sekolah (Master Switch)** → Mode Senyap.
5. Setelah jaringan pulih: matikan Mode Libur / nyalakan lagi Proteksi.

### B. GPS / Lokasi dimatikan & Mode Pesawat

**Default di kode (v1.3.12+):**

| Pelanggaran / Tahap | Respon Sistem | Keterangan |
|---------------------|---------------|------------|
| **Mode Pesawat di Jam Sekolah** | **Instan (< 1 Detik) Langsung Lockdown** | Pesan: *"MODE PESAWAT DILARANG SAAT JAM SEKOLAH!"* |
| Peringatan internet mati biasa | **1 menit** | Notifikasi / warning countdown |
| Lockdown internet mati biasa | **2 menit** | Pesan: *"KONEKSI HILANG! Anda offline lebih dari 2 menit di jam sekolah."* |
| Peringatan GPS mati (background, ada presence) | ~**3 menit** | Notifikasi / warning lokasi |
| Lockdown GPS mati (background, ada presence) | ~**5 menit** | Pesan: *"GPS MATI DI SEKOLAH!"* |
| **Buka EduLock + GPS mati** | **Instan** | Overlay recovery — **tanpa kiosk**, termasuk Mode Senyap |
| **Masuk sekolah + GPS mati** | **Instan** | Overlay *"GPS MATI DI AREA SEKOLAH"* — nyalakan GPS dulu, baru lock normal |

> **PENTING (Fail-Safe Jam Sekolah):** Mode Pesawat & Offline > 2 menit **tetap mengunci HP** meskipun saklar proteksi sedang dimatikan admin (jam istirahat). Hanya **Mode Libur (Holiday Mode)** yang dapat membebaskan offline secara total.
>
> **PENTING (Overlay GPS vs kunci HP):** selama GPS mati, **jangan** kiosk/lock screen (siswa tidak bisa buka Pengaturan Lokasi). Siswa sakit di rumah **tidak** otomatis dikunci seluruh HP hanya karena GPS mati, kecuali ada bukti pernah dekat sekolah — dan itupun harus lewat overlay GPS dulu, bukan kiosk.

**Langkah perbaikan:**
1. Matikan Mode Pesawat & nyalakan koneksi internet. Begitu sinyal kembali, kunci langsung terbuka otomatis.
2. Jika GPS mati: Buka **Pengaturan Lokasi** (tombol overlay: **“Buka Pengaturan Lokasi”**) → nyalakan Lokasi akurat → pastikan izin **“Izinkan sepanjang waktu”**.

### C. HP terkunci padahal siswa di luar sekolah / pulang

1. Cek jam: apakah masih **jam sekolah efektif** di pengaturan GAS/EduLock?
2. Cek dashboard: **Mode Libur** OFF? **Proteksi** ON?
3. Sticky zone: jika pagi sudah “di dalam”, status zona bisa menempel sampai di luar jam — perilaku dirancang untuk deteksi “kabur”.
4. Solusi operasional:
   - **Izin HP** sementara (kode/QR), atau
   - **Mode Libur** (acara), atau
   - Tunggu **di luar jam sekolah** (kunci jam sekolah seharusnya lepas).
5. Mode Darurat hanya jika benar-benar darurat / offline.

### D. Siswa sakit / absen — ekspektasi kunci

| Situasi | Ekspektasi yang benar |
|---------|------------------------|
| Sakit di rumah, GPS sempat di luar sekolah | Build baru: **jangan paksa terkunci** hanya karena GPS/net off |
| Sempat datang ke sekolah lalu pulang sakit di jam sekolah | Bisa masih terdeteksi “pernah dekat sekolah” → GPS off lewat **overlay GPS**, bukan kiosk penuh |
| Absensi GAS | Tidak otomatis mematikan EduLock — koordinasikan Mode Libur / izin / jangan paksa compliance |

### E. Overlay nempel / “tidak bisa ke Home”

1. Cek notifikasi: **“EduLock Aktif”** vs **“Mode Senyap”** vs **“Mode Bebas Aktif”** vs **“Izin Aktif”**.
2. Dari dashboard (butuh internet di perangkat siswa agar perintah masuk):
   - Matikan proteksi (**Mode Senyap**), atau nyalakan **Mode Acara/Libur**.
3. Di HP: berikan **kode izin** / minta siswa scan QR.
4. Pastikan Accessibility **EduLock Protection** ON (jika diminta).
5. Offline + macet total → Mode Darurat (§1).

### F. Tidak bisa uninstall EduLock

Ini **disengaja**.

1. Admin Sekolah: izinkan uninstall per siswa (`uninstall_authorized`) — HP online agar perintah masuk.
2. Di HP muncul dialog **“MODE UNINSTALL AKTIF”** → tombol **“UNINSTALL SEKARANG”** (bypass ~10 menit).
3. Kelulusan Kelas 9: **Uninstall Kls 9** di dashboard → setelah selesai **Cabut Kls 9**.
4. Darurat akses admin Device Admin: password/kode dari `uninstallAccess` sekolah (Super Admin generate) — **perlu konfirmasi admin pusat** untuk prosedur lengkap sekolah Anda.
5. Tanpa izin → Device Admin + Accessibility menahan uninstall.

### G. Force update (layar wajib update)

- Super Admin set `app_settings/android/min_version_code_edulock` > versi HP.
- Layar: Tampil sebagai **Overlay Sistem (`SYSTEM_ALERT_WINDOW`)** di `MonitoringService.kt` yang menutup layar dan tidak bisa di-bypass tombol Home.
- Terdapat tombol resmi **“DOWNLOAD UPDATE”** yang otomatis mengarahkan ke tutorial unduhan live (`/edulock/install` atau `/e`).
- Perbaikan: Unduh dan pasang APK versi terbaru, atau minta Super Admin sesuaikan `min_version` di database.

### H. Login / registrasi gagal

Urutan form: **NPSN → NISN → Nama** (nama sering terisi otomatis jika NPSN+NISN valid).

| Pesan / gejala | Arti | Tindakan |
|----------------|------|----------|
| Sekolah NPSN tidak ditemukan | NPSN salah / sekolah belum di sistem | Cek NPSN di dashboard |
| Data siswa tidak cocok | NISN/nama tidak match database GAS | Perbaiki data siswa di GAS |
| **“Akun ini sudah aktif di perangkat lain…”** | Binding `device_uuid` / `deviceId` sudah terisi HP lain | Minta **reset binding** ke admin pusat / wali kelas (hapus/reset device di data siswa) |
| Butuh internet | Auth & binding butuh jaringan | Pastikan online saat daftar |

### I. Siswa “bypass lokasi” / tipuan GPS

1. Di Monitoring Live: cek **Luar Zona**, trust score, battery, last seen.
2. Fake GPS / mock location: sebagian kasus diperlakukan khusus; **jangan andalkan 100% di lapangan** — eskalasi ke admin pusat jika pola curang berulang.
3. GPS dimatikan di sekolah: overlay wajib nyalakan GPS (**bukan** kiosk). Setelah GPS nyala, proteksi normal.
4. Jangan bagikan password darurat ke siswa.

### J. Virtual Pet mati (Pet Dead Lock) — v1.3.22

- Muncul **di luar jam sekolah** jika pet dianggap mati (`status=DEAD` / vital habis), proteksi ON, bukan Mode Libur.
- **Bukan kunci permanen.** Setelah **Saya Mengerti**, HP **bisa dipakai lagi**; konsekuensinya siswa diganggu berkala sampai pet di-revive admin/guru.
- Interval (dari dashboard kebijakan sekolah, contoh default):
  1. Setelah pet mati → tunggu **interval pertama** (mis. 30 menit) → overlay #1  
  2. Setelah Mengerti → tunggu **interval kedua** (mis. 20 menit) → overlay #2  
  3. Setelah Mengerti → tunggu **interval ketiga / terakhir** (mis. 10 menit) → overlay #3  
  4. Seterusnya → **ulang angka terakhir** (mis. tiap 10 menit)
- Saat **jam sekolah** / Mode Libur / Mode Senyap → overlay pet ditutup otomatis.

### K. App tidak jalan / sering mati di background

1. Ulangi Setup item 5–6 (overlay + battery).
2. Vendor (Vivo/Xiaomi/Oppo/Samsung):
   - Autostart ON untuk EduLock  
   - Battery = **Tidak dibatasi** / Unrestricted  
   - Lock aplikasi di Recent Apps  
3. Accessibility harus tetap ON (beberapa HP mematikannya setelah update OS).
4. Pastikan notifikasi **EduLock Aktif** / **Mode Senyap** masih ada (service hidup).

---

## 5) Aksi Admin di Dashboard (yang relevan lapangan)

Menu tipikal: **Dashboard EduLock → Pengaturan / Realtime Monitoring**  
(URL admin sering lewat portal Gerbang/Dashboard; pastikan login Admin Sekolah.)

| Kontrol UI | Efek di HP siswa |
|------------|------------------|
| **Status Proteksi Sekolah (Master Switch)** = OFF | **Mode Senyap** — tidak mengunci; notifikasi “Mode Senyap / Monitoring Dinonaktifkan oleh Admin” |
| Master Switch = ON | Proteksi hidup; bisa langsung mengunci lagi di jam sekolah |
| **Mode Acara / Libur Sekolah** = ON | **Mode Bebas** — toast “MODE BEBAS AKTIF!”; kunci dilepas |
| Mode Libur = OFF | Monitoring kembali; bisa re-lock agresif jika masih jam sekolah |
| Generate **kode izin** / QR | Siswa input/scan → izin HP selama durasi (menit) |
| **Cabut Izin** | Sesi izin dihentikan |
| Izin **uninstall** / Uninstall Kls 9 | Mode uninstall di HP |
| Remote unlock individual seperti “buka HP siswa X dari web” | **Tidak ada sebagai fitur terpisah** di kode APK — pakai Mode Libur / Senyap / kode izin / Mode Darurat lokal |

Perangkat siswa **perlu online** agar perubahan RTDB/FCM masuk. Jika HP offline, perintah dashboard belum tentu langsung terasa.

---

## 6) Izin penggunaan HP (kode / barcode)

**Di HP siswa (Main atau Lock Screen):**

1. Tekan **“Minta Izin Penggunaan HP”** atau **“MINTA IZIN GURU MENGGUNAKAN HP”**.
2. Pilih:
   - **Input Kode dari Guru**, atau  
   - **Scan Barcode/QR Code**.
3. Layar input: judul **“Masukkan Kode Izin”** → **“Verifikasi Kode”**.
4. Scan: **“Scan QR Code dari Guru”**.
5. Sukses → toast durasi izin; monitoring **dijeda** sementara (notifikasi **“Izin Aktif”**).

**Di Admin:** buat kode (masa berlaku kode + durasi pemakaian) → tampilkan QR ke proyektor jika perlu → cabut bila selesai.

Butuh **internet** di HP siswa untuk validasi kode.

---

## 7) Monitoring Live — apa yang dicek

Panel: **Realtime Student Monitoring** / **Data Realtime Siswa** (refresh ~5 detik).

| Kolom / status | Arti praktis |
|----------------|--------------|
| **ONLINE** | Heartbeat perangkat terdeteksi |
| **OFFLINE** | Ada binding device, tapi tidak ada heartbeat segar |
| **BELUM BINDING** | Belum terikat perangkat (`deviceId` kosong) |
| **Zona Aman** | Runtime tidak menandai out-of-zone |
| **Luar Zona** | `isOutOfZone` — siswa terdeteksi di luar zona (perlu investigasi jika jam sekolah) |
| **Proteksi Aktif** (`COMPLIANT`) | Accessibility + Device Admin OK |
| **MERAH — PROTEKSI MATI** (`NON_COMPLIANT`) | Accessibility OFF dan/atau Device Admin OFF |
| **Dijeda Admin** (`PAUSED`) | Mode Senyap / Mode Libur |
| **Menunggu Telemetry** | Binding ada, belum ada data runtime |
| **Konflik binding** | Satu `deviceId` dipakai >1 siswa — **reset segera** |
| Baterai / Trust score / last seen | Kesehatan perangkat & kepatuhan kasar |

Sumber data: binding siswa **GAS** + heartbeat **`active_devices`**.

---

## 8) GAS ↔ EduLock (ringkas untuk lapangan)

- Login EduLock memakai identitas yang sama dengan ekosistem GAS (NPSN sekolah + data siswa).
- Binding: `device_uuid` / `deviceId` / `device` di data siswa — **1 akun 1 HP**.
- Tombol di EduLock: **“BUKA APK GAS SISWA”** (di dashboard EduLock & lock screen). Jika belum terpasang: **“APK GAS SISWA BELUM TERDETEKSI”**.
- Jadwal jam sekolah EduLock mengikuti **Pengaturan Sistem GAS Presensi**.
- Absensi/sakit di GAS **tidak** otomatis mematikan kunci EduLock — koordinasikan operasional (izin / Mode Libur / ekspektasi yang benar).

---

## 9) Perbaikan permission umum (salinan untuk tempel di grup guru IT)

### Device Admin
- Setup → **3. Admin Perangkat** → Aktifkan.  
- Jangan biarkan siswa mematikan “Aplikasi admin perangkat”; upaya mematikan akan ditahan / diminta password admin.

### Accessibility
- **Pengaturan → Aksesibilitas → Layanan terpasang → EduLock Protection → ON**.  
- Di Vivo/Xiaomi: aktifkan **secara manual** di HP (bukan hanya lewat ADB), konfirmasi dialog vendor.

### Overlay
- Setup → **5. Tampil di Atas Aplikasi Lain** → Izinkan.

### Baterai
- Setup → **6. Izin Latar Belakang** → Tidak dioptimasi / Unrestricted.  
- Tambahan vendor: Autostart, “lock” di recent apps.

### Lokasi
- Selalu izinkan + GPS akurat + (jika ada) “Lokasi akurat” / Google Location ON.

---

## 10) Eskalasi ke support pusat — kumpulkan dulu

Sebelum telepon/WA pusat, siapkan:

1. **Nama sekolah + NPSN / schoolId**  
2. **Nama siswa + NISN + kelas**  
3. **Versi APK** EduLock di HP — lihat teks bawah layar utama **atau** About app; target dokumen ini: **1.3.22 (48)**  
4. **Waktu kejadian** (tanggal jam)  
5. **Screenshot** layar kunci / Monitoring Live (status ONLINE/OFFLINE, Luar Zona, compliance)  
6. **Merek & tipe HP** + Android version  
7. Status izin: Location / Accessibility / Device Admin / Overlay / Battery (ON/OFF)  
8. Apakah Mode Senyap / Mode Libur sedang ON di dashboard  
9. Apakah sudah coba Mode Darurat / kode izin  
10. Pesan error persis (login, force update, binding)

Kirim ke admin pusat; tandai jika perlu **reset device binding**.

---

## 11) Yang TIDAK boleh dilakukan di lapangan

- Membagikan `EduLock{tanggal}` ke siswa “supaya enak”.  
- Mematikan Accessibility/Device Admin tanpa alasan administrasi.  
- Memaksa siswa sakit di rumah “harus hijau di monitoring”.  
- Uninstall dengan cara tidak resmi (bisa merusak Device Admin state).  
- Mengira Mode Darurat = izin permanen (hilang saat internet kembali).

---

## 12) Referensi internal (untuk admin teknis)

| Topik | Lokasi kode / dokumen |
|-------|------------------------|
| Mode Darurat 7× + password | `LockScreenActivity.kt`, `OverlayLockActivity.kt` |
| Skip monitoring saat darurat offline | `MonitoringService.kt` (§ emergency) |
| GPS/offline + presence | `LocationMonitor.kt`, `MonitoringService.enforceGpsAndOfflinePresenceProtection` |
| Overlay wajib GPS / deadlock sekolah | `GpsEnableOverlay.kt`, `LockEnforcer.kt`, `OverlayLockActivity` target `gps` |
| Offline 2 menit & Mode Pesawat instan | `OfflineMonitor.kt`, `MonitoringService.kt` |
| Mode Senyap / Libur | RTDB `schools/{id}/config/is_active_protection`, `is_holiday_mode` |
| Force update | `ForceUpdateGate.kt`, `VersionCheckService.kt` → `app_settings/android` |
| Izin HP | `PermissionCodeActivity.kt`, `BarcodeScannerActivity.kt`, `PermissionManager.kt` |
| Pet mati + interval reminder | `PetDeadLockActivity.kt`, `MonitoringService.kt` (step 5.5), policy `pet_dead_reminder_*_ms` |
| Label versi UI + jarak terpenuhi | `MainActivity.kt`, `activity_main.xml` |
| Binding GAS | `StudentAuthService.kt` |
| Checklist regresi build | `Apk Release/Pegangan Build APK/Edulock/REGRESSION_CHECKLIST.md` |

---

## 13) Kartu saku (cetak 1 halaman)

```
DARURAT OFFLINE EDULOCK
1) Ketuk layar kunci 7× (cepat)
2) Password: EduLock + tanggal hari ini (contoh tgl 18 → EduLock18)
3) Mode Darurat aktif maksimal 10 MENIT (Grace Period)
4) Setelah 10 menit atau saat internet kembali → kunci aktif lagi

OPERASIONAL ADMIN (butuh internet di HP siswa)
• Matikan proteksi (Istirahat) → Master Switch OFF (Mode Senyap)
• Acara seharian / Bebas offline → Mode Acara/Libur (Holiday Mode) ON
• Pinjam HP sebentar          → Kode/QR Izin
• Uninstall resmi             → Izin uninstall dari dashboard

Mode Pesawat dilarang keras di jam sekolah (kunci instan < 1 detik).
Buka EduLock + GPS mati → overlay wajib nyalakan GPS (tanpa kiosk), termasuk Mode Senyap.
GPS mati lalu masuk sekolah → overlay “GPS MATI DI AREA SEKOLAH”, nyalakan GPS, baru lock normal.
Cek versi di bawah layar EduLock: harus 1.3.22 (48) rebuild 20 Agu 09:52 (SHA CD7379A3…).
Versi acuan: EduLock Siswa 1.3.22 (48)
```

---

*Dokumen ini untuk staf lapangan non-developer. Jika perilaku di HP berbeda dari panduan, bandingkan versi APK dulu; bila versi sama tapi beda perilaku → catat sebagai bug dan eskalasi dengan data §10.*
