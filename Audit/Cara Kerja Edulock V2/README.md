# 🛡️ PANDUAN AUDIT & CARA KERJA EDULOCK SISWA V2

Folder ini berisi dokumen panduan operasional dan arsitektur resmi EduLock V2 untuk **Tim Bug Hunter, QA Penguji Lapangan, dan Security Pentester**.

Dokumen lengkap dapat diakses pada tautan berikut:
👉 **[PANDUAN CARA KERJA DAN FITUR SAKRAL EDULOCK V2](./PANDUAN_CARA_KERJA_DAN_FITUR_SAKRAL_EDULOCK_V2.md)**

- **Versi Aktif Uji:** `v1.3.57` (Build `83`)
- **File APK:** `Apk Release/Final_V2/EduLock_V2-1.3.57-83.apk`
- **SHA-256:** `C60E3FE9F077A12A03F53F8D233974174CA56597189DC7F286DF4477AC494FCE`
- **Unit Test Coverage:** 5 Automated JUnit 4 Tests (100% Passed)

---

## 📌 Ringkasan Penting ("INI BUKAN BUG!")

Sebelum menguji, pastikan Anda memahami batasan dan aturan sakral berikut agar tidak terjadi laporan bug palsu (*false positive*):

1. **Aturan Rumah (Fail-Open):** Di luar radius sekolah (>1 km, di rumah), ponsel siswa **100% bebas** dan tidak terkunci saat jam sekolah. Jam sekolah saja tanpa bukti lokasi fisik di sekolah **TIDAK CUKUP** untuk mengunci HP.
2. **GPS Mati di Rumah:** Siswa di rumah berhak mematikan GPS. Dilarang memunculkan overlay peringatan GPS jika siswa di rumah.
3. **Overlay Pet Mati di Rumah:** Tombol **"Saya Mengerti"** **MEMANG WAJIB BISA DIKLIK** untuk menutup overlay pengingat. EduLock dilarang muncul terus-menerus (spamming). Saat tombol ditekan, overlay tertutup bersih **TANPA memunculkan UI EduLock di beranda siswa** (layar kembali ke desktop/aplikasi sebelumnya dengan nyaman hingga reminder berikutnya tiba).
4. **Offline Biasa vs Mode Pesawat:** Aturan offline 2 menit telah **DIHAPUS**. Offline biasa di jam sekolah tidak memicu lockdown merah. Hanya **Mode Pesawat (Airplane Mode)** yang memicu penguncian tegas seketika.
5. **Transisi ke APK GAS Siswa:** Wajib 0-frame launcher desktop, tanpa layar PIN, dan **Anti-Kickback** (tidak terlempar balik ke EduLock).
6. **Anti-Uninstall 24/7/365:** Berjalan mandiri tanpa terikat jam sekolah maupun geofence untuk mencegah pencopotan paksa EduLock.

Untuk matriks pengujian lengkap kategori A–F dan format pelaporan temuan, buka:  
📄 **[PANDUAN_CARA_KERJA_DAN_FITUR_SAKRAL_EDULOCK_V2.md](./PANDUAN_CARA_KERJA_DAN_FITUR_SAKRAL_EDULOCK_V2.md)**
