# Panduan Pemasangan Lapangan EduLock

## Tujuan
Dokumen ini dibuat untuk memandu tim atau operator saat memasang APK EduLock di perangkat siswa di lapangan.

Panduan ini memakai strategi dua versi:
- `V1 Manual` sebagai baseline awal
- `V2 Hybrid` sebagai versi upgrade jika `V1` masih terasa lambat atau kurang responsif

---

## Lokasi File APK

APK yang dipakai ada di folder:

`D:\Satu Pintu\Siap Pakai\APK EduLock`

File yang tersedia:
- `EduLock-v1.2.7-v1-manual-release-vc21.apk`
- `EduLock-v1.2.7-v2-hybrid-release-vc22.apk`

---

## Arti Masing-Masing Versi

### `V1 Manual`
- dipasang lebih dulu
- dipakai sebagai baseline uji lapangan
- memakai jalur polling/manual yang sudah distabilkan

### `V2 Hybrid`
- dipakai jika `V1` masih kurang joss
- dipasang dengan cara menimpa `V1` di perangkat yang sama
- memakai kombinasi geofence dan polling watchdog

---

## Aturan Utama Pemasangan

Operator wajib mengikuti urutan ini:

1. pasang `V1 Manual` terlebih dahulu
2. lakukan setup izin sampai lengkap
3. uji pemakaian nyata di lapangan
4. jika `V1` masih lambat atau sering lolos, timpa dengan `V2 Hybrid`
5. ulangi uji di perangkat yang sama

Tujuan urutan ini:
- agar pembanding adil
- agar tim tahu apakah `V2` benar-benar lebih baik dari `V1`
- agar rollout tidak langsung berisiko ke semua perangkat

---

## Langkah Pemasangan V1

### 1. Instal APK
Pasang:

`EduLock-v1.2.7-v1-manual-release-vc21.apk`

### 2. Selesaikan setup awal
Pastikan langkah-langkah berikut benar-benar selesai:
- registrasi perangkat
- login atau binding siswa bila diminta
- izin lokasi aktif
- izin lokasi background aktif
- izin tampil di atas aplikasi lain aktif
- izin accessibility aktif
- device admin aktif
- pengecualian baterai atau optimasi baterai dinonaktifkan bila diperlukan

### 3. Pastikan aplikasi benar-benar aktif
Sebelum pengujian, cek:
- identitas siswa tampil benar
- konfigurasi sekolah berhasil terbaca
- lokasi sekolah terbaca
- jam sekolah terbaca
- proteksi sekolah aktif

---

## Skenario Uji Wajib Setelah V1 Dipasang

Operator wajib mencoba hal-hal berikut:

### Uji navigasi dasar
- tekan `Home`
- buka `Recent Apps`
- buka aplikasi selain yang diizinkan
- pindah-pindah aplikasi dengan cepat

### Uji konteks sekolah
- uji saat jam sekolah
- uji saat berada di area sekolah
- uji saat siswa memang harus terkunci

### Uji izin penggunaan HP
- aktifkan izin penggunaan HP dari jalur resmi
- pastikan saat izin aktif perangkat tidak salah lock
- pastikan setelah izin berakhir proteksi aktif kembali

### Uji gangguan umum
- uji saat GPS lemah
- uji saat internet mati
- uji saat layar mati lalu hidup lagi
- uji saat aplikasi dibuka ulang

---

## Kapan Harus Menimpa Dengan V2

Timpa perangkat yang sama dengan `V2 Hybrid` jika ditemukan kondisi seperti:
- lock terasa lambat
- perangkat telat menarik kembali ke EduLock
- siswa sempat lolos ke aplikasi lain
- respons penguncian tidak konsisten
- hasil `V1` terasa kurang kuat di merek HP tertentu

Jika gejala tersebut muncul, instal:

`EduLock-v1.2.7-v2-hybrid-release-vc22.apk`

di perangkat yang sama sebagai pembaruan.

Catatan:
- tidak perlu uninstall aplikasi lama terlebih dahulu
- `V2` memang disiapkan untuk menimpa `V1`

---

## Langkah Pemasangan V2

### 1. Instal APK V2 di perangkat yang sama
Pasang:

`EduLock-v1.2.7-v2-hybrid-release-vc22.apk`

### 2. Pastikan aplikasi berhasil ter-update
Cek bahwa aplikasi tetap bisa dibuka normal dan data siswa tidak hilang.

### 3. Ulangi skenario uji yang sama
Ulangi pengujian yang sama seperti saat memakai `V1` agar pembandingnya valid.

---

## Yang Wajib Dicatat Operator

Setiap perangkat minimal harus dicatat:
- nama siswa atau kode perangkat
- merek dan tipe HP
- versi yang dipakai saat uji
- hasil uji `V1`
- apakah perlu pindah ke `V2`
- hasil uji `V2`

Hal penting yang dicatat:
- apakah lock cepat atau lambat
- apakah ada momen siswa lolos
- apakah ada false lock
- apakah aplikasi stabil setelah beberapa kali buka-tutup layar
- apakah perilaku berbeda antar merek HP

---

## Keputusan Hasil Uji

### Jika `V1` sudah bagus
- tetap pakai `V1`
- catat bahwa device aman dengan baseline manual

### Jika `V1` kurang bagus tetapi `V2` lebih baik
- lanjutkan pakai `V2` untuk device atau kelompok device sejenis

### Jika `V2` juga masih bermasalah
- catat detail masalahnya
- laporkan ke tim pengembang dengan informasi perangkat dan gejalanya

---

## Larangan Untuk Operator

Operator jangan:
- langsung memasang `V2` ke semua perangkat tanpa uji `V1`
- menghapus aplikasi lama sembarangan sebelum data dicek
- melewati proses aktivasi izin penting
- menyimpulkan hasil hanya dari 1 percobaan singkat

---

## Ringkasan Singkat Super Cepat

Urutan kerja operator:
- pasang `V1`
- setup izin sampai lengkap
- uji di lapangan
- kalau lambat atau lolos, timpa dengan `V2`
- uji ulang di perangkat yang sama
- catat hasil

Makna versi:
- `V1` = baseline aman
- `V2` = upgrade jika `V1` masih kurang responsif

---

## Catatan Penutup

Panduan ini dibuat agar pemasangan di lapangan lebih rapi, hasil uji lebih terukur, dan keputusan memakai `V1` atau `V2` tidak berdasarkan asumsi, tetapi berdasarkan hasil nyata di perangkat siswa.
