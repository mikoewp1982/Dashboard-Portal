# Panduan Redeploy Web Admin EduLock / GAS

Dokumen ini berisi panduan singkat untuk melakukan pembaruan (redeploy) pada sisi Web Admin (berbasis Next.js dan Firebase) setiap kali ada perubahan kodingan yang dilakukan oleh tim pengembang.

---

## CARA 1: Menggunakan Script Otomatis (Sangat Disarankan)

Tim pengembang sebelumnya telah menyiapkan sebuah script praktis bernama `deploy.bat` di dalam folder `web`. Cara ini adalah yang paling cepat dan aman:

1. Buka aplikasi **Terminal** (bisa melalui VS Code atau Command Prompt / PowerShell biasa).
2. Pastikan posisi *directory* berada di dalam folder `web`.
   > Jika belum, ketik perintah ini:
   > ```bash
   > cd "D:\Dashboard Portal\web"
   > ```
3. Jalankan script *deploy* dengan mengetikkan:
   > ```bash
   > .\deploy.bat
   > ```
4. Tunggu beberapa menit. Script ini akan otomatis menjalankan dua proses penting:
   * **Build Next.js:** Memproses kodingan mentah menjadi file siap pakai (optimasi produksi).
   * **Firebase Deploy:** Mengunggah file yang sudah di-*build* tersebut langsung ke server Firebase Hosting.
5. Selesai! Jika di akhir terminal muncul tulisan `=== Deploy Complete ===`, berarti versi web terbaru sudah berhasil mengudara secara *live*.

---

## CARA 2: Cara Manual Langkah-demi-Langkah

Jika suatu saat script `deploy.bat` rusak atau tidak bisa digunakan, Bapak atau tim bisa melakukannya secara manual dengan urutan berikut:

1. Buka Terminal dan arahkan ke folder `web`:
   ```bash
   cd "D:\Dashboard Portal\web"
   ```
2. Jalankan proses *Build* untuk memastikan tidak ada *error* pada kodingan:
   ```bash
   npm run build
   ```
   *(Catatan: Langkah ini wajib. Jika ada tulisan "Error" atau tulisan merah saat build, kodingannya harus diperbaiki dulu sebelum lanjut ke langkah 3).*

3. Setelah proses *build* selesai dengan mulus, unggah ke server Firebase:
   ```bash
   npx firebase deploy --only hosting
   ```
   *(Sistem akan mulai mengunggah file. Jika ada permintaan konfirmasi Yes/No, ketik `Y` lalu Enter).*

---

### Kapan Saya Harus Melakukan Redeploy?
Bapak **TIDAK PERLU** melakukan redeploy jika:
* Bapak hanya mengubah aturan di Firebase Realtime Database (`database.rules.json`). Aturan database otomatis aktif saat dikirim ke Firebase.
* Bapak hanya meng-update/mengkompilasi ulang kodingan Android (APK Siswa / APK Guru).

Bapak **WAJIB** melakukan redeploy jika:
* Tim developer mengubah tampilan antarmuka (UI) Web Admin.
* Tim developer menambahkan fitur/kolom baru di dalam Web Admin.
* Ada perbaikan *bug* (error logic) di dalam *file* TypeScript/Next.js (misal di folder `src/components` atau `src/app`).
