# Panduan Deploy Web

> **Sumber resmi:** `Apk Release/Pegangan Build APK/PANDUAN_DEPLOY_WEB.md`  
> Plus gate anti-fitur-hilang: `Apk Release/Pegangan Build APK/README.md`  
> File di root ini = salinan ringkas; jika beda isi, **ikutkan Pegangan**.

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
