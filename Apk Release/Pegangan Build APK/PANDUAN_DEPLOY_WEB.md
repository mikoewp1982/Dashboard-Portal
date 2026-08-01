# Panduan Deploy Web

Dokumen ini adalah **pegangan resmi** agar deploy web tidak salah jalur.

## Target Yang Benar

### 1. Dashboard Portal utama
- Platform live: **Firebase App Hosting**
- Project: `kompas-5f0b4`
- Backend: `gerbang-aplikasi-sekolah`
- URL live: `https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app`
- Penanda di repo:
  - file `web/apphosting.yaml` ada
  - file `web/firebase.json` punya blok `apphosting`

### 2. Website statis e-perpus
- Platform live: **Firebase Hosting klasik**
- Project: `eperpus-sekolah`
- URL live: `https://eperpus-sekolah.web.app`
- Jalur ini **bukan** untuk Dashboard Portal utama.

## Aturan Emas

- Jika yang diubah adalah **Dashboard Portal / Super Admin / Admin / Login / API Next.js**, deploy lewat **App Hosting**.
- Jika yang diubah adalah **website statis e-perpus**, pakai jalur resmi `apps/eperpus-sekolah`.
- **Jangan** deploy e-perpus dari folder `web`.
- **Jangan** commit dari folder `D:\Dashboard Portal\web`. Selalu lakukan git dari root: `D:\Dashboard Portal`.
- **Jangan** pakai `git add web/` secara buta jika worktree sedang ramai. Stage file yang memang mau dideploy saja.
- **Manual rollout dari Firebase Console tidak mengambil perubahan lokal**. Console hanya bisa merollout commit/branch yang **sudah ada di GitHub**.

## Jalur Deploy Dashboard Portal Utama

Ini jalur yang benar untuk web admin yang sedang dipakai sekarang.

### Sinkronisasi APK publik sebelum deploy

Jika yang berubah adalah file APK yang diunduh siswa dari halaman web, jangan cukup ganti file di folder `Final`.

Yang dipakai browser siswa adalah:
- `D:\Dashboard Portal\web\public\apk\EduLock-studentRelease.apk`
- `D:\Dashboard Portal\web\public\apk\GAS-Siswa-release.apk`

Folder `D:\Dashboard Portal\Apk Release\Final` hanya sumber distribusi internal, bukan folder yang dibaca langsung oleh web live.

Gunakan alur ini:

1. Build/copy APK terbaru ke folder `Final` seperti biasa.
2. Sinkronkan ke folder web:

   ```powershell
   cd "D:\Dashboard Portal\web"
   npm run sync:apk
   ```

   Jika hanya satu APK yang berubah:

   ```powershell
   npm run sync:apk:gas
   npm run sync:apk:edulock
   ```

3. Setelah file di `web/public/apk` terbarui, lanjut ke proses `git add -> commit -> push` dari root repo.
4. Tunggu rollout App Hosting selesai.

Catatan penting:
- Script sync sekarang juga membuat file `web/public/apk/apk-manifest.json` berisi hash versi APK terbaru.
- Halaman instalasi `/g` dan `/e` otomatis menambahkan query `?v=<hash>` ke tombol unduh, jadi nama file APK boleh tetap sama tetapi browser siswa tetap diarahkan ke versi unduhan terbaru setelah deploy.
- Jika nama file APK tetap sama, tidak perlu ubah codingan web selama alur `sync:apk -> commit -> push` dijalankan.
- Jika nama file APK diubah, link di halaman web juga harus diubah agar mengarah ke nama file baru.
- Siswa tidak otomatis mengunduh ulang APK hanya karena file di server berubah; mereka tetap perlu menekan tombol unduh lagi atau dipaksa update dari sisi aplikasi.

1. Buka terminal di root repo:

   ```powershell
   cd "D:\Dashboard Portal"
   ```

2. Cek file yang berubah:

   ```powershell
   git status --short
   ```

3. Stage **hanya** file web yang memang mau diterbitkan:

   ```powershell
   git add -- "web/src/path/file-a.tsx" "web/src/path/file-b.ts" "web/src/app/api/path/route.ts"
   ```

4. Commit dengan pesan yang jelas:

   ```powershell
   git commit -m "fix(web): ringkas perubahan yang dideploy"
   ```

5. Push ke `main`:

   ```powershell
   git push origin main
   ```

6. Setelah push berhasil, Firebase App Hosting akan otomatis membuat rollout untuk backend:
   `gerbang-aplikasi-sekolah`

7. Pantau rollout di Firebase Console:
   [App Hosting - gerbang-aplikasi-sekolah](https://console.firebase.google.com/u/0/project/kompas-5f0b4/apphosting/backends/gerbang-aplikasi-sekolah/locations/asia-southeast1/overview)

## Kapan Pakai Manual Rollout Di Console

Pakai tombol **Create rollout** hanya untuk:
- merollout ulang commit yang **sudah ada di GitHub**
- memilih commit tertentu yang **sudah ter-push**

Jangan pakai jalur ini jika perubahan masih lokal, karena hasilnya tidak akan ikut naik.

## Jalur Deploy Website Statis E-Perpus

Pakai jalur ini **hanya** untuk project `eperpus-sekolah`.

1. Buka terminal:

   ```powershell
   cd "D:\Dashboard Portal\apps\eperpus-sekolah"
   ```

2. Jalankan:

   ```powershell
   .\deploy.bat
   ```

3. Alternatif setara:

   ```powershell
   npm run deploy
   ```

4. Ingat: ini targetnya `eperpus-sekolah.web.app`, bukan Dashboard Portal utama.
5. File lama `D:\Dashboard Portal\web\deploy.bat` sekarang hanya pengarah ke jalur baru agar tidak terjadi salah deploy.

## Checklist Sebelum Bilang "Sudah Live"

- push ke `main` sudah berhasil
- rollout App Hosting statusnya sukses
- buka web live, lalu tekan `Ctrl + F5`
- cek halaman yang diubah langsung di domain live
- jika perubahan terkait login/monitoring, lakukan login ulang user yang relevan agar data runtime ikut tercatat

## Ringkasan Singkat

- **Dashboard Portal utama** -> `git add` file terkait -> `git commit` -> `git push origin main`
- **E-perpus statis** -> `cd apps\eperpus-sekolah` -> `.\deploy.bat`

Kalau ragu, anggap default-nya adalah **App Hosting Dashboard Portal utama**, bukan hosting statis.
