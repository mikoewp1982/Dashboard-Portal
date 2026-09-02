# Batas Scope Pegangan EduLock

Dokumen ini menegaskan batas scope folder:

```text
D:\Dashboard Portal\Apk Release\Pegangan Build APK\Edulock
```

## Scope yang Masuk
Folder ini dipakai untuk mencatat dan mengatur perubahan pada:
- APK native `EduLock` versi siswa
- build APK siswa
- regression check APK siswa
- log perubahan native siswa

## Scope yang Tidak Masuk
Folder ini **bukan** dipakai untuk:
- `EduLock Admin` yang secara operasional hanya menjadi pembungkus web
- perubahan halaman web admin EduLock
- deploy web admin
- catatan build web

## Aturan Praktis
1. Jika perubahan ada di `native-mobile-edulock` dan berdampak ke siswa, catat di folder ini.
2. Jika perubahan ada di web admin EduLock, catat di dokumen web atau folder pegangan yang relevan di sisi web.
3. Jika sebuah perubahan menyentuh web admin tetapi tujuannya mengubah perilaku APK siswa, maka:
   - perubahan native siswa tetap dicatat di folder ini
   - perubahan web admin dicatat di area dokumentasi web

## Contoh Masuk Scope
- validasi kode izin di APK siswa
- barcode scanner siswa
- expiry dan duration izin siswa
- geofence dan remote config siswa
- proteksi/service/monitoring siswa

## Contoh Tidak Masuk Scope
- halaman admin generate kode di web
- halaman admin aktivasi izin kelas di web
- layout dashboard admin EduLock di browser
- wrapper APK admin yang hanya memuat web

## Prinsip Utama
Kalau tidak ada coding native yang benar-benar dirawat pada APK admin, maka jangan campurkan catatannya ke folder pegangan build native siswa.
