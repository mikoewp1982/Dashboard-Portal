# Regression Checklist EduLock Siswa

Checklist ini dipakai agar perubahan baru di **EduLock siswa** tidak merusak fitur izin, proteksi, dan monitoring yang lama.

## Aturan Pakai
- Pilih item sesuai area yang benar-benar berubah.
- Jika edit file bersama di `src/main`, mulai dari asumsi bahwa alur siswa secara luas ikut berisiko terdampak.
- Hasil uji ringkas wajib ditulis di [BUILD_LOG.md](./BUILD_LOG.md).

## A. Shared / Core
- [ ] App masih bisa dibuka tanpa crash
- [ ] Login / session flow tetap berjalan
- [ ] Listener atau service utama tidak rusak
- [ ] Build varian terdampak sukses

## B. Student
- [ ] Permission code manual masih bisa dipakai bila memang masih aktif
- [ ] Scan barcode masih bisa dipakai
- [ ] Expired dan duration tetap sinkron dengan aturan
- [ ] Gate waktu sesi tetap benar
- [ ] Aktivasi izin per kelas tetap terbaca
- [ ] Monitoring / proteksi siswa tetap berjalan
- [ ] Geofence / remote config tidak ikut rusak bila area itu tidak disentuh

## C. Jika Mengubah `PermissionManager`
- [ ] Cek manual code
- [ ] Cek barcode
- [ ] Cek expiry
- [ ] Cek duration
- [ ] Cek session window
- [ ] Cek class permission

## D. Jika Mengubah Service / Monitoring
- [ ] Cek listener realtime
- [ ] Cek status proteksi
- [ ] Cek recovery setelah app dibuka ulang
- [ ] Cek recover setelah `SCREEN_ON` / unlock (HP bangun dari sleep)

## E. Anti-Uninstall / Device Admin (wajib jika `AntiUninstallService` berubah)

Versi acuan: **1.3.22 (48)**.

- [ ] **Segera setelah install/buka**: masuk halaman Device Admin EduLock → ditendang (Back+Home + kembali ke EduLock)
- [ ] **Setelah sleep lama (15–30+ menit)**: buka Device Admin EduLock lagi → **tetap ditendang**
- [ ] **Setup awal**: halaman Overlay / Baterai / Accessibility **tidak** ditendang sebelum setup selesai
- [ ] Daftar/Kelola aplikasi tetap boleh dibuka; uninstall aplikasi **selain** EduLock tidak ditendang
- [ ] Halaman detail EduLock (Paksa berhenti / Copot pemasangan) tetap ditendang
- [ ] Dialog uninstall EduLock tetap ditendang
- [ ] Anti-uninstall tetap jalan **di luar jam sekolah** / proteksi mati (24/7), kecuali gembok uninstall admin
- [ ] Flow aktivasi Device Admin resmi (saat admin belum aktif + request window) tidak ikut ditendang

## F. UI Status / Pet Mati / Overlay Recovery (rebuild 1.3.22)

- [ ] Bawah layar utama menampilkan `Versi 1.3.22 (48)` (atau versi build yang terpasang)
- [ ] Baris jarak: `Jarak: N meter (terpenuhi)` di dalam radius; `(tidak terpenuhi)` di luar radius
- [ ] Overlay pet mati hanya di luar jam sekolah; tutup otomatis saat jam sekolah / libur / proteksi OFF
- [ ] Setelah pet mati: overlay **tidak** langsung; tunggu interval pertama admin (contoh 30 menit)
- [ ] Setelah "Saya Mengerti": HP bisa dipakai; overlay muncul lagi sesuai interval berikutnya (contoh 20 lalu 10)
- [ ] Setelah 3 interval pertama: overlay berulang di angka terakhir (contoh tiap 10 menit)
- [ ] "Saya Mengerti" = akses sementara saja (gangguan berkala), bukan kunci permanen
- [ ] **Overlay OEM**: sleep + Mode Senyap → proteksi ON → EduLock/prompt "Tampil di atas aplikasi lain" muncul **tanpa** buka app manual

## G. GPS overlay + saklar proteksi (rebuild 2026-08-20 09:52)

- [ ] Buka EduLock + GPS mati (**proteksi senyap**) → overlay **GPS MATI** + tombol **Buka Pengaturan Lokasi** (bukan menunggu admin ON)
- [ ] Tombol Pengaturan Lokasi **bisa** dibuka (tidak terkunci kiosk)
- [ ] Nyalakan GPS dari overlay → overlay **tertutup sendiri**
- [ ] Admin ON proteksi saat GPS masih mati → **hanya** overlay GPS, bukan lock screen ramai
- [ ] GPS mati di rumah → masuk area sekolah → overlay **GPS MATI DI AREA SEKOLAH** → nyalakan GPS → baru lock normal
- [ ] Mode Libur / izin HP → overlay GPS tidak dipaksa
- [ ] Admin ON proteksi jam sekolah, siswa **di rumah** (GPS nyala, tidak ada bukti dekat sekolah) → **tidak** terkunci seolah di sekolah
- [ ] Mode senyap / libur / grace Settings → `lastForegroundPackage` tetap terisi

## H. FCM / Keep-alive / Responsif Proteksi (rebuild 1.3.22)

- [ ] Setelah install + buka EduLock sekali: monitoring **bukan** "Token FCM belum sinkron"
- [ ] Heartbeat: status monitoring cenderung **ONLINE** selama service hidup (bukan OFFLINE padahal siswa main TikTok lama)
- [ ] Admin ON Master Switch saat siswa di TikTok (jam sekolah + di sekolah) → HP **terkunci tanpa** buka EduLock manual
- [ ] Ubah jam pulang di **GAS Presensi** → kartu Jam Sekolah di HP ikut berubah (bisa setelah wake/service hidup; tidak hanya setelah buka UI)
- [ ] Izin per Kelas: aktifkan di admin → HP unlock sesuai jam sesi (timezone WIB)

## I. Output Build
- [ ] Variant yang dimaksud berhasil dibuild
- [ ] Output APK tercatat
- [ ] Lokasi copy Final tercatat (`EduLock-1.3.22-48.apk` + alias `EduLock-studentRelease.apk`)
- [ ] Hal yang belum diuji ditulis jujur
- [ ] Status unduhan live `/e` ditulis jujur (synced / belum)