# Prosedur 1 Menit — Instal APK GAS & EduLock di HP INFINIX (XOS V13.0+)

Dokumen ini mengatasi error **"Diblokir oleh admin IT Anda"** yang muncul di File Manager Infinix (XOS V13) SAAT KLIK file APK (sebelum tombol Install muncul).

**Akar masalah**: Ini BUKAN dari Admin IT sekolah. Ini adalah **XOS App Scan + Google Play Protect** (fitur bawaan Infinix XOS V13) yang otomatis memindai semua APK sideload (bukan dari Play Store) dan memblokir SEBELUM dialog Install ditampilkan.

---

## 🟢 OPSI TERCEPAT — TANPA UBAH SETTINGAN (10 detik)
Gunakan **Share APK → Install via Package Installer** untuk melewati scanner File Manager X-Hot / Files by Google:

1. Buka folder Download / tempat APK `GAS-Siswa-release.apk` dan `EduLock-1.3.5-31.apk` tersimpan (pakai File Manager biasa).
2. **JANGAN KLIK APK** (karena akan muncul "Diblokir admin IT").
3. **Tahan lama tap APK** → muncul menu → pilih **`Bagikan / Share`** → pilih **`Package installer`** atau **`Instal paket aplikasi`** (bukan Files / X-Hot).
4. Muncul dialog Install normal → tap **`Install`** → tunggu selesai → **`Done`** / **`Buka`**.
5. Ulangi untuk APK kedua.

✅ **Selesai.** Tidak perlu setting apapun.

---

## 🟡 OPSI 2 — Matikan Scanner XOS App Scan Sementara (jika share/install via Package Installer tidak ada)

**Durasi: ±60 detik. Setelah install selesai, setting bisa dinyalakan kembali.**

| Langkah | Lokasi Menu | Action |
|---------|-------------|--------|
| 1 | **Setting** → **Password & Security** (Kunci & Keamanan) | Buka |
| 2 | Tap **`Security Scan`** / **`Pemindaian Keamanan`** / **`App Guard`** | Buka |
| 3 | Tombol toggle **`Scan apps for security threats`** / **`Pindai ancaman aplikasi`** | Geser → **MATIKAN (OFF)** |
| 4 | Muncul konfirmasi "Peringatan Keamanan" → tap **`Matikan`** / **`Tetap matikan`** | OK |
| 5 | (Opsional tapi disarankan) Ke **Google Play Store** → Foto Profil (kanan atas) → **`Play Protect`** → Gear ⚙️ → toggle **`Scan apps with Play Protect`** | Geser → MATIKAN (OFF) sementara |
| 6 | Kembali ke File Manager → KLIK file APK `EduLock-1.3.5-31.apk` → **Install** → selesai | ✅ |
| 7 | Klik file APK `GAS-Siswa-release.apk` → **Install** → selesai | ✅ |
| 8 | **PENTING:** Setelah keduanya terinstall → KEMBALI LANGKAH 3 & 5 → **NYALAKAN KEMBALI** (ON) Scanner XOS & Play Protect. | Agar HP tetap terlindungi. |

---

## 🔴 OPSI 3 — Jika MASIH Diblokir Juga (Infinix dengan XOS sangat ketat / Smart 5/6/7/8 seri entry-level)

**Gunakan ADB (Android Debug Bridge) via laptop — 100% bypass semua scanner** (tidak ada blokir apapun).

### Persiapan di HP Infinix 1x saja:
1. **Setting → About Phone → Build Number** → tap **7 KALI** berturut-turut → "Sekarang Anda Developer!"
2. Kembali ke Setting utama → masuk **`Opsi Pengembang / Developer Options`** →
   - toggle **`Debugging USB / USB Debugging`** → ON ✅
   - (opsional) **`Nonaktifkan verifikasi ADB over USB`** → ON (agar lebih mudah)
3. Colok HP ke laptop pakai kabel USB data → di HP muncul popup **"Izinkan debugging USB?"** → centang **"Selalu izinkan dari komputer ini"** → tap **Izinkan / OK**.

### Jalankan di laptop (PowerShell):
```powershell
cd "D:\Dashboard Portal\Apk Release\Final"
adb devices                           # pastikan tampil serial number HP
adb install -r "EduLock-1.3.5-31.apk"   # install EduLock (bypass 100%)
adb install -r "GAS-Siswa-release.apk"  # install GAS (bypass 100%)
```
Selesai! Kedua APK langsung masuk tanpa pesan blokir apapun. Cabut kabel USB.

---

## ✅ Setelah Berhasil Install — Setup 5-Poin EduLock (SAMA DENGAN MERK HP LAIN)
Karena Infinix XOS V13 agresif kill background service, **wajib tambahkan 2 setting ini** (setelah tombol MULAI ditekan):
1. **Setting → Password & Security → Privacy Protection → App Permissions Manager → Auto Start** → cari **EduLock** → toggle **IZINKAN (ALLOW)** ✅
2. **Setting → Battery → App Launch / Pengelola Aplikasi Latar Belakang** → cari **EduLock** → pilih **`Jangan dibatasi / No Restrictions`** (bukan "Otomatis")
3. Buka EduLock → tekan tombol **MULAI** → Accessibility & Device Admin ON jika diminta → lalu coba buka GAS → 5 badge lokal harus hijau SEMUA → GAS terbuka.

---

## 📝 Catatan Troubleshoot Khusus Infinix:
- Jika Accessibility EduLock ke-MATI sendiri setelah HP restart / 1 hari → ulangi langkah Auto Start + No Restrictions di atas.
- Jika Device Admin EduLock **tidak bisa diaktifkan** (error "Diblokir kebijakan keamanan") → pastikan di Setting → Password & Security → Device Administrators → tidak ada app lain yang mengunci; coba uninstall antivirus / app cleaner bawaan Infinix jika ada.
- Untuk pengiriman massal ke siswa: disarankan upload APK ke link Google Drive, WA grup, atau gunakan opsi **"Share via Package Installer"** (Opsi 1) karena itu yang paling cepat tanpa setting.
