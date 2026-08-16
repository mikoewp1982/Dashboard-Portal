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
- Backend App Hosting `gerbang-aplikasi-sekolah` memakai **`rootDirectory = web`**. Satu-satunya app Next.js yang di-build = folder `web/`.
- **Jangan** buat lagi `package.json` / `package-lock.json` / `.yarnrc` / `apphosting.yaml` / `public/apk/*.apk` di **root** repo. Itu merusak deteksi package manager / menggembungkan checkout.
- `web/public/apk` **hanya** menyimpan APK current yang dipakai tutorial (alias + 1 versi current per app). Arsip lama = `Apk Release/Final`, bukan App Hosting.
- Regenerasi `web/package-lock.json` **WAJIB** dengan **Node 20.x + npm 10.x** (sama seperti Cloud Build). Jangan commit lockfile dari Node 25 / npm 11 — `npm ci` di App Hosting akan gagal (EUSAGE / Usage / exit 51).

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

### Catatan Progres Terbaru E-Perpus (2026-08-08)

- Scope: halaman `/admin/literacy` pada project `apps/eperpus-sekolah`.
- Fokus perubahan:
  - Form/card `Buat Tugas Baru` ePerpus disinkronkan dengan pola UI web admin GAS `Monitoring E-Library -> Buat Tugas Baru`.
  - Struktur data tugas ePerpus disamakan ke kontrak GAS: `classList`, `className`, `points`, `durationMinutes`, `startAt`, `endAt`, `status`, `isActive`.
  - Field lama `deadline` dipertahankan hanya sebagai fallback baca data lama, bukan field utama untuk tulis data baru.
  - UI ePerpus dipoles agar konsisten pada card note default sekolah, card summary `Semua Kelas (Terpilih Semua)`, dropdown daftar kelas, label jadwal `Mulai / Selesai`, dan chip kecil `30 Poin / 45 Menit` pada card `Daftar Tugas Aktif`.
- File utama yang disentuh:
  - `D:\Dashboard Portal\apps\eperpus-sekolah\kelola_literasi.html`
  - `D:\Dashboard Portal\apps\eperpus-sekolah\api\literacy-admin.js`
- Jalur deploy yang dipakai:

  ```powershell
  cd "D:\Dashboard Portal\apps\eperpus-sekolah"
  .\deploy.bat
  ```

- Status terakhir: **SUDAH LIVE** di `https://eperpus-sekolah.web.app`

### Catatan Progres Lain Yang Masih Satu Rangkaian (2026-08-08)

- Selain ePerpus, pada hari yang sama juga ada progres **Web Admin GAS** dan **APK GAS Siswa** yang masih satu rangkaian dengan modul literasi.
- Ringkasan progres:
  - **Web Admin GAS**: form `Buat Tugas Literasi` di `Monitoring E-Library` ditambah jadwal `Mulai / Selesai`, validasi range waktu, dan tampilan kolom `Waktu` + badge status realtime di daftar tugas.
  - **APK GAS Siswa**: bump ke `v1.0.43-siswa (23040)` untuk enforce tugas literasi berdasarkan rentang waktu yang dikirim dari web admin, termasuk badge status dan guard submit di luar jadwal.
  - **URL unduhan siswa GAS dan EduLock**: halaman tutorial web siswa disinkronkan agar mengambil file APK final terbaru dari jalur publik yang memakai pola manifest/versioned file. GAS dan EduLock sekarang sama-sama diarahkan ke artefak rilis final yang transparan untuk audit, bukan mengandalkan alias lama sebagai sumber utama.
- Dokumen detail resmi tetap ada di:
  - `D:\Dashboard Portal\Apk Release\Pegangan Build APK\CHECKLIST_PERUBAHAN_APK_TERKINI.md`
  - `D:\Dashboard Portal\Apk Release\Pegangan Build APK\GAS\BUILD_LOG.md`
- Urutan konteks yang benar:
  1. Web Admin GAS dan APK GAS Siswa lebih dulu disinkronkan untuk fitur jadwal tugas literasi.
  2. URL tutorial siswa untuk GAS dan EduLock dibereskan agar mengambil APK final terbaru dengan pola yang konsisten.
  3. Setelah itu halaman ePerpus `/admin/literacy` disamakan tampilan dan kontrak datanya agar konsisten dengan GAS.

## Checklist Sebelum Bilang "Sudah Live"

- push ke `main` sudah berhasil
- rollout App Hosting statusnya sukses
- buka web live, lalu tekan `Ctrl + F5`
- cek halaman yang diubah langsung di domain live
- jika perubahan terkait login/monitoring, lakukan login ulang user yang relevan agar data runtime ikut tercatat

## Troubleshooting App Hosting (insiden 2026-08-16)

Gejala tipikal: kartu **Latest rollout** merah, Cloud Build step `build` gagal ~10–20 detik, log `npm error Usage: npm ci` lalu `exit status 51`.

| Urutan | Penyebab yang pernah terjadi | Perbaikan |
|---|---|---|
| 1 | `web/public/apk` menumpuk puluhan APK lama (~20 MB × banyak file) | Slim ke alias + current saja; arsip di `Apk Release/Final` |
| 2 | Ada `package.json` / `.yarnrc` / APK di **root** repo (ganda dengan `web/`) | Hapus artefak root itu; jangan commit ulang |
| 3 | `package-lock.json` dibuat npm 11 (Node 25), kurang `@emnapi/*` | Regenerasi lock di Node 20: `fnm use 20` → `cd web` → hapus lock → `npm install` → commit `web/package-lock.json` |
| 4 | Framework build gagal: `ERR_REQUIRE_ESM` (`jwks-rsa` require `jose@6`) | Di `web/package.json` set overrides `"jose": "5.10.0"` + `"jwks-rsa": "3.2.0"`, regenerasi lock Node 20; di `next.config.ts` set `serverExternalPackages: ["firebase-admin","jwks-rsa","jose"]` |

Rantai commit perbaikan yang berhasil (referensi):
1. `c1477ed0` — ship GAS Siswa 1.0.76 (rollout gagal)
2. `1b86d81d` — slim `web/public/apk`
3. `101c147e` — hapus Next.js ganda di root
4. `bf206c44` — lockfile Node 20 → **LIVE**

Sebelum push perubahan dependency web, verifikasi lokal:

```powershell
fnm use 20
cd "D:\Dashboard Portal\web"
npm ci --quiet --no-fund --no-audit
```

Harus exit `0`. Jika EUSAGE / Missing dari lock file → regenerasi lock dulu.

### Status progres 2026-08-16 (akhir hari)

- **GAS Siswa live unduhan:** `1.0.76-siswa` / `versionCode 23073` (SHA256 `76C8EFC4…`)
- **EduLock live unduhan:** `1.3.11` / `versionCode 37`
- **App Hosting:** sukses setelah `bf206c44`
- Detail operasional: `GAS/BUILD_LOG.md`, checklist: `CHECKLIST_PERUBAHAN_APK_TERKINI.md`

## Ringkasan Singkat

- **Dashboard Portal utama** -> `git add` file terkait -> `git commit` -> `git push origin main`
- **E-perpus statis** -> `cd apps\eperpus-sekolah` -> `.\deploy.bat`

Kalau ragu, anggap default-nya adalah **App Hosting Dashboard Portal utama**, bukan hosting statis.
