# SOP Porting APK EduLock

## 1. Tujuan SOP

Menjadi langkah baku tim untuk membangun APK EduLock dari referensi lama ke arsitektur proyek `Dashboard Portal`.

## 2. SOP Persiapan

1. Jangan sentuh folder referensi:
   - `D:\Satu Pintu\edulock-mobile`
2. Buat folder kerja aktif:
   - rekomendasi `D:\Dashboard Portal\native-mobile-edulock`
3. Salin hanya file yang diperlukan ke folder kerja aktif.
4. Catat file referensi yang dipakai sebagai dasar porting.

## 3. SOP Refactor Awal

1. Ganti konfigurasi Firebase ke project `dashboard-portal-179f7`.
2. Ganti package name dan struktur sesuai keputusan proyek.
3. Pisahkan area siswa dari role lain jika dibutuhkan oleh flavor/package.
4. Pastikan manifest, services, dan permission tetap terbawa dengan benar.

## 4. SOP Implementasi Login

1. Jangan pakai kontrak auth lama referensi secara mentah.
2. Implementasikan login sesuai aturan GAS siswa:
   - resolve `npsn -> schoolId`
   - cari siswa dengan prioritas `username`, lalu `nisn`
3. Setelah identitas valid:
   - cek binding device
   - bind ke tenant aktif
   - simpan sesi lokal yang aman

## 5. SOP Implementasi Runtime

1. Porting service dan helper monitoring dari referensi.
2. Pastikan runtime ditulis ke `active_devices/{schoolId}/{deviceId}`.
3. Pastikan format field sesuai kontrak data APK EduLock.
4. Verifikasi bahwa web EduLock dashboard dan monitoring bisa membaca runtime tersebut.

## 6. SOP Verifikasi Minimum

Checklist wajib:

1. login sukses dengan akun siswa yang sama seperti GAS siswa
2. tenant sekolah benar
3. binding device masuk
4. setup permission selesai
5. service hidup setelah app ditutup/dibuka ulang
6. runtime terbaca di web EduLock

## 7. SOP Larangan

- jangan edit folder referensi langsung
- jangan copy seluruh proyek referensi tanpa seleksi
- jangan mempertahankan path RTDB lama tanpa pemetaan
- jangan merilis APK sebelum runtime terbaca di web EduLock

## 8. Artefak yang Harus Diserahkan Tim

Setelah fase awal selesai, tim harus menyerahkan:

1. APK debug
2. handoff teknis terbaru
3. daftar file referensi yang diport
4. daftar path RTDB final yang dipakai
5. daftar gap yang belum selesai
