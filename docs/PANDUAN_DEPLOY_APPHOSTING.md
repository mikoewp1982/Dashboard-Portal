# 🚀 PANDUAN DEPLOY: DASHBOARD PORTAL (Firebase App Hosting)

Dokumen ini adalah panduan resmi cara melakukan *deploy* (menerbitkan) web Dashboard Portal ini ke server **Firebase App Hosting**. Panduan ini dibuat khusus agar anggota tim atau *developer* lain tidak tersesat.

---

## 1. Konsep Dasar (Wajib Dibaca)

Web ini menggunakan teknologi **Next.js** dan di-*hosting* menggunakan layanan terbaru dari Google yaitu **Firebase App Hosting** (ditandai dengan adanya file `apphosting.yaml` di folder `web`). 

Firebase App Hosting **bekerja secara otomatis** dengan mendengarkan (*listen*) repositori GitHub Anda. Oleh karena itu:
- ❌ **TIDAK PERLU** menjalankan `firebase deploy --only hosting` (Itu untuk Firebase klasik).
- ❌ **TIDAK PERLU** menjalankan `npx firebase deploy --only apphosting`.
- ✅ **CUKUP** lakukan `git push` ke GitHub cabang utama (`main`), dan Firebase akan otomatis merakit (*build*) dan meng-online-kannya!

---

## 2. Langkah-Langkah Deploy yang Benar

Pastikan Anda selalu membuka terminal pada **Folder Akar (Root Directory)** yaitu `Dashboard Portal`, BUKAN di dalam folder `web`.

Ketikkan 3 perintah sakti ini secara berurutan:

```bash
# 1. Tambahkan semua perubahan file
git add .

# 2. Beri catatan perubahan (ganti pesan di dalam tanda kutip sesuai kebutuhan)
git commit -m "feat: Menambahkan fitur baru"

# 3. Dorong ke GitHub
git push
```

Selesai! Anda hanya perlu membuka halaman [Firebase Console -> App Hosting](https://console.firebase.google.com/), lalu lihat bahwa status *rollout* Anda sedang berjalan. Dalam 1-3 menit, web akan *live*.

---

## 3. Trouble-shooting (Jika Deploy Gagal / Error)

Firebase App Hosting sangat ketat terhadap aturan penulisan kode Next.js (ESLint dan TypeScript). Jika *deploy* Anda gagal (seperti muncul tulisan peringatan merah *"Failed to run the framework build"* di Firebase Console), ini adalah penyebab dan solusinya:

### A. Ada Variabel atau Import yang Tidak Dipakai
Next.js akan membatalkan proses *build* jika Anda meng-import sesuatu tapi tidak pernah menggunakannya di dalam kode.
**Solusi:** Cari variabel abu-abu/redup di VSCode Anda (biasanya di file yang baru saja Anda edit), hapus *import* tersebut, lalu *commit* dan *push* ulang.

### B. Mendorong dari Folder yang Salah (Conflict)
Jangan pernah mengetik `git commit` saat Anda berada di dalam folder `D:\Dashboard Portal\web`. Ini akan mengacaukan struktur Git dan menyebabkan *conflict*.
**Solusi:**
Jika Anda terlanjur mendapat peringatan *Conflict* atau *Rejected* saat push:
1. Batalkan semua operasi yang tersangkut: `git rebase --abort` (atau `git merge --abort`)
2. Pindah ke folder utama: `cd "D:\Dashboard Portal"`
3. Lakukan sinkronisasi: `git pull --rebase`
4. Lakukan dorong ulang: `git push`

---

## Kesimpulan
Kunci dari *deploy* di proyek ini adalah: **Jaga kode tetap bersih dari *error/warning*, beradalah di folder utama, dan cukup lakukan `git push`.** Sisanya, biarkan robot Firebase yang bekerja. 🤖
