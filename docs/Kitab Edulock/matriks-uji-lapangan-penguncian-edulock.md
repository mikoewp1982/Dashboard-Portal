# Matriks Uji Lapangan Penguncian EduLock

## Tujuan
Dokumen ini menjadi panduan pengujian lapangan untuk memastikan refactor penguncian EduLock benar-benar bekerja pada kondisi nyata, bukan hanya terlihat benar di kode.

Tujuan utama:
- memastikan penguncian lebih responsif,
- memastikan fallback berjalan saat kiosk gagal,
- memastikan jalur yang sah tetap aman,
- memastikan tidak ada false positive yang mengganggu operasional sekolah.

---

## Aturan Umum Pengujian

### Sebelum pengujian
- pastikan APK yang diuji adalah versi terbaru,
- pastikan log build sudah jelas,
- pastikan device admin, overlay, accessibility, dan lokasi sudah sesuai skenario,
- pastikan akun siswa dan data sekolah valid,
- pastikan sekolah, jadwal, dan radius lokasi sudah sinkron dengan backend.

### Saat pengujian
- uji di lebih dari satu merek perangkat jika memungkinkan,
- catat waktu respons aktual,
- catat apakah lock terjadi lewat overlay, relaunch, kiosk, atau kombinasi,
- catat apakah ada jeda yang terasa di tangan pengguna.

### Sesudah pengujian
- bandingkan hasil dengan metrik,
- tandai skenario yang lolos,
- tandai skenario yang delay,
- tandai skenario yang false positive,
- dan tandai skenario yang fatal.

---

## Skala Hasil Uji

Gunakan penilaian sederhana:
- `LULUS`
  - hasil sesuai harapan
- `LULUS DENGAN CATATAN`
  - hasil utama benar, tetapi ada delay kecil atau UX perlu dibenahi
- `GAGAL RINGAN`
  - sistem masih bekerja sebagian, tetapi ada celah
- `GAGAL BERAT`
  - sistem tidak melindungi sesuai tujuan atau malah mengunci jalur yang sah

---

## Data Yang Perlu Dicatat Per Skenario

Setiap skenario minimal mencatat:
- nama perangkat
- versi Android
- mode proteksi
- status device owner atau non-device owner
- status overlay permission
- status accessibility
- status device admin
- waktu `event_received`
- waktu `overlay_shown`
- waktu `app_relaunched`
- waktu `locktask_confirmed`
- hasil akhir
- catatan anomali

---

## Matriks Uji Inti

## 1. Uji Keluar Dengan Tombol Home

### Kondisi awal
- jam sekolah aktif
- strict mode aktif
- siswa di area sekolah
- proteksi aktif
- izin penggunaan HP tidak aktif

### Langkah uji
1. buka EduLock
2. tekan tombol Home

### Hasil yang diharapkan
- event terdeteksi cepat
- overlay atau relaunch terjadi instan
- siswa tidak bisa lolos lama ke launcher
- jika kiosk tersedia, kiosk ikut aktif atau tetap aktif

### Catatan yang harus diperiksa
- apakah ada jeda terasa
- apakah launcher sempat terbuka lama
- apakah overlay muncul sebelum relaunch

---

## 2. Uji Keluar Dengan Recent Apps

### Kondisi awal
- sama seperti skenario 1

### Langkah uji
1. buka EduLock
2. tekan tombol Recent Apps

### Hasil yang diharapkan
- sistem menutup celah secepat mungkin
- overlay atau relaunch memaksa kembali ke EduLock
- siswa tidak bebas pindah ke aplikasi lain

### Catatan yang harus diperiksa
- apakah recent screen sempat bertahan
- apakah gesture navigation lebih sulit ditangani di device tertentu

---

## 3. Uji Membuka Aplikasi Non-Whitelist

### Kondisi awal
- strict mode aktif
- proteksi aktif
- berada di area sekolah

### Langkah uji
1. coba buka browser, galeri, chat, atau aplikasi lain yang tidak diizinkan

### Hasil yang diharapkan
- event package terdeteksi
- overlay aktif instan
- EduLock dibawa kembali ke depan
- package asing tidak boleh bertahan bebas

### Catatan yang harus diperiksa
- package mana yang lolos
- apakah ada whitelist yang terlalu longgar
- apakah overlay terlambat

---

## 4. Uji Membuka GAS Siswa

### Kondisi awal
- strict mode aktif
- proteksi aktif
- GAS Siswa terpasang

### Langkah uji
1. buka GAS Siswa melalui tombol resmi di EduLock

### Hasil yang diharapkan
- GAS Siswa boleh dibuka
- tidak terjadi false lock
- relaunch ke EduLock tidak memutus jalur resmi

### Catatan yang harus diperiksa
- apakah `appSwitchTimestamp` atau whitelist bekerja benar
- apakah pengguna tetap bisa kembali normal

---

## 5. Uji Izin Penggunaan HP Aktif

### Kondisi awal
- strict mode aktif
- proteksi aktif
- izin penggunaan HP belum aktif

### Langkah uji
1. aktifkan izin penggunaan HP dengan jalur resmi
2. pindah ke aplikasi lain

### Hasil yang diharapkan
- lock tidak memaksa selama izin valid
- overlay tidak muncul
- kiosk dilepas bila perlu
- saat izin habis, sistem kembali aktif

### Catatan yang harus diperiksa
- kapan izin mulai dihormati
- kapan izin berakhir dan relock terjadi
- apakah ada delay setelah izin habis

---

## 6. Uji Settings Grace Sah

### Kondisi awal
- proteksi aktif
- aplikasi mengarahkan user ke settings untuk izin tertentu

### Langkah uji
1. jalankan flow resmi menuju Settings
2. buka halaman target

### Hasil yang diharapkan
- sistem tidak salah mengunci selama grace aktif
- setelah kembali ke aplikasi, state normal pulih

### Catatan yang harus diperiksa
- apakah settings grace terlalu pendek
- apakah setelah grace habis sistem kembali protektif

---

## 7. Uji Uninstall Bypass Sah

### Kondisi awal
- admin mengizinkan uninstall
- bypass uninstall aktif

### Langkah uji
1. jalankan flow uninstall resmi
2. buka settings atau package installer

### Hasil yang diharapkan
- EduLock tidak memblokir jalur uninstall yang sah
- package installer dapat dibuka
- device admin bisa dilepas melalui jalur yang sesuai

### Catatan yang harus diperiksa
- apakah bypass terlalu sempit
- apakah ada false block dari accessibility

---

## 8. Uji Emergency Unlock

### Kondisi awal
- strict mode aktif
- proteksi aktif

### Langkah uji
1. jalankan jalur emergency unlock yang sah
2. amati apakah lock dilepas sementara

### Hasil yang diharapkan
- emergency unlock menang atas lock biasa
- device tidak terus menarik kembali secara agresif
- event tercatat untuk audit

### Catatan yang harus diperiksa
- apakah emergency unlock sulit dipicu
- apakah setelah kondisi pulih state kembali normal

---

## 9. Uji Holiday Mode

### Kondisi awal
- holiday mode dimatikan
- strict mode normal berjalan

### Langkah uji
1. aktifkan holiday mode dari backend
2. coba buka aplikasi lain
3. matikan holiday mode lagi

### Hasil yang diharapkan
- saat holiday aktif, lock dilepas
- saat holiday dimatikan, lock kembali aktif dengan stabil
- tidak ada state stale yang membuat siswa lolos lama

### Catatan yang harus diperiksa
- apakah relock setelah holiday off cepat
- apakah status lokasi dan state terbaru ikut refresh

---

## 10. Uji Proteksi Dimatikan Admin

### Kondisi awal
- proteksi aktif

### Langkah uji
1. nonaktifkan proteksi dari backend
2. coba gunakan HP bebas
3. aktifkan proteksi lagi

### Hasil yang diharapkan
- mode bebas benar-benar terasa bebas
- saat proteksi hidup lagi, sistem kembali mengunci sesuai aturan

### Catatan yang harus diperiksa
- apakah ada lock residual
- apakah overlay tertinggal

---

## 11. Uji GPS Dimatikan

### Kondisi awal
- siswa di area sekolah
- strict mode aktif
- proteksi aktif

### Langkah uji
1. matikan GPS
2. tunggu sesuai kebijakan warning atau lockdown

### Hasil yang diharapkan
- warning muncul jika memang kebijakan warning aktif
- lockdown aktif sesuai policy
- log waktu tercatat

### Catatan yang harus diperiksa
- apakah ada delay terlalu panjang
- apakah fallback lock tetap aktif jika kiosk gagal

---

## 12. Uji Internet Mati

### Kondisi awal
- proteksi aktif
- strict mode aktif

### Langkah uji
1. putus koneksi internet
2. tunggu sesuai policy

### Hasil yang diharapkan
- warning muncul jika kebijakan warning ada
- lockdown terjadi jika batas waktu terlampaui

### Catatan yang harus diperiksa
- apakah emergency unlock diperlukan
- apakah offline behavior sesuai desain

---

## 13. Uji Keluar Area Sekolah

### Kondisi awal
- strict mode aktif
- proteksi aktif
- GPS akurat

### Langkah uji
1. geser posisi di luar radius atau simulasikan keluar area

### Hasil yang diharapkan
- bila policy memang menganggap keluar area sebagai pelanggaran, sistem memberi respon sesuai desain
- bila luar area saat jam sekolah dimaknai bebas, sistem harus konsisten dengan aturan itu

### Catatan yang harus diperiksa
- jangan sampai kebijakan geofence bertabrakan dengan aturan bisnis sekolah

---

## 14. Uji Accessibility Mati Mendadak

### Kondisi awal
- proteksi aktif
- accessibility awalnya aktif

### Langkah uji
1. matikan accessibility
2. amati reaksi sistem

### Hasil yang diharapkan
- watchdog mendeteksi kondisi ini
- user diarahkan kembali secara aman
- lock tetap punya fallback

### Catatan yang harus diperiksa
- apakah prompt terlalu agresif
- apakah device masih aman

---

## 15. Uji Overlay Permission Tidak Ada

### Kondisi awal
- overlay permission dicabut

### Langkah uji
1. jalankan skenario pelanggaran

### Hasil yang diharapkan
- sistem tetap punya fallback lock screen activity
- kegagalan overlay tercatat sebagai metrik dan log

### Catatan yang harus diperiksa
- apakah tanpa overlay perangkat masih cukup terlindungi

---

## 16. Uji `startLockTask()` Gagal

### Kondisi awal
- perangkat non-device owner atau perangkat yang rawan gagal kiosk

### Langkah uji
1. jalankan skenario lock
2. pastikan `startLockTask()` tidak berhasil

### Hasil yang diharapkan
- overlay tetap menjadi tameng utama
- relaunch tetap berjalan
- perangkat tidak menjadi bebas hanya karena kiosk gagal

### Catatan yang harus diperiksa
- apakah cooldown kiosk terlalu panjang
- apakah overlay tetap instan

---

## 17. Uji Restart Service

### Kondisi awal
- proteksi aktif

### Langkah uji
1. paksa service mati
2. biarkan sistem atau mekanisme restarter menghidupkan kembali

### Hasil yang diharapkan
- state pulih
- monitoring pulih
- lock tetap bisa berjalan lagi

### Catatan yang harus diperiksa
- apakah ada jendela bebas terlalu lama

---

## 18. Uji Reboot Perangkat

### Kondisi awal
- perangkat sudah terdaftar dan proteksi aktif

### Langkah uji
1. reboot perangkat
2. tunggu hingga perangkat aktif kembali

### Hasil yang diharapkan
- service dan state penting pulih
- jalur proteksi kembali aktif sesuai syarat

### Catatan yang harus diperiksa
- apakah boot flow terlalu lambat
- apakah ada langkah setup yang hilang

---

## 19. Uji Layar Mati dan Layar Hidup

### Kondisi awal
- proteksi aktif

### Langkah uji
1. matikan layar
2. hidupkan layar
3. unlock perangkat

### Hasil yang diharapkan
- sistem melakukan pengecekan ulang
- state tetap sinkron
- tidak ada celah bebas setelah layar hidup

---

## 20. Uji False Positive

### Skenario yang harus dicek
- membuka keyboard
- membuka permission controller
- membuka package installer saat bypass sah
- pindah ke GAS Siswa resmi
- membuka settings lewat flow yang sah

### Hasil yang diharapkan
- tidak ada lock yang salah
- tidak ada toast atau overlay yang mengganggu jalur resmi

---

## Matriks Ringkas Hasil Uji

| No | Skenario | Hasil | Waktu Respons | Catatan |
|---|---|---|---|---|
| 1 | Tombol Home |  |  |  |
| 2 | Recent Apps |  |  |  |
| 3 | App non-whitelist |  |  |  |
| 4 | Buka GAS Siswa |  |  |  |
| 5 | Izin penggunaan HP |  |  |  |
| 6 | Settings grace |  |  |  |
| 7 | Uninstall bypass |  |  |  |
| 8 | Emergency unlock |  |  |  |
| 9 | Holiday mode |  |  |  |
| 10 | Proteksi admin off/on |  |  |  |
| 11 | GPS mati |  |  |  |
| 12 | Internet mati |  |  |  |
| 13 | Keluar area sekolah |  |  |  |
| 14 | Accessibility mati |  |  |  |
| 15 | Overlay permission hilang |  |  |  |
| 16 | `startLockTask()` gagal |  |  |  |
| 17 | Service restart |  |  |  |
| 18 | Reboot perangkat |  |  |  |
| 19 | Screen off/on |  |  |  |
| 20 | False positive |  |  |  |

---

## Kriteria Uji Dianggap Berhasil
- semua jalur lock utama lolos,
- semua jalur sah tidak terkena false lock,
- overlay tetap melindungi saat kiosk gagal,
- relock setelah perubahan state penting berjalan stabil,
- dan delay terbesar sudah bisa dijelaskan lewat metrik.

---

## Penutup
Dokumen ini harus dipakai bersamaan dengan:
- rencana penguncian,
- checklist refactor P0,
- dan spesifikasi `LockStateManager`.

Tanpa uji lapangan yang disiplin, refactor penguncian berisiko hanya terlihat bagus di kode tetapi tetap lemah di perangkat nyata.
