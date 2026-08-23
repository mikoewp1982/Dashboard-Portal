# Dashboard Portal

Peta folder **saat ini** (`D:\Dashboard Portal`). Baca ini dulu sebelum mengedit.

Sistem sekolah terintegrasi: **dashboard web + APK GAS + APK EduLock**, data di **Firebase**.

| Bagian | Stack |
|--------|--------|
| Dashboard admin | Next.js 15 + React + TypeScript |
| GAS / EduLock | Native Android (Kotlin), bukan Flutter / hybrid |
| Backend | Firebase (Auth, RTDB, Functions, App Hosting) |

---

## Mau ubah apa?

| Tujuan | Buka folder ini |
|--------|-----------------|
| Dashboard admin (menu, API, deploy web) | `web\` |
| Kunci HP siswa (EduLock) | `native-mobile-edulock\` |
| Absensi, pet, literasi, GAS Siswa/Guru/Kepala | `native-mobile-gas\` |
| e-Perpustakaan (produk terpisah) | `apps\eperpus-sekolah\` |
| Spesifikasi / PRD | `docs\` — mulai dari [`docs/00_BACA_SAYA_PERTAMA.md`](docs/00_BACA_SAYA_PERTAMA.md) |
| Ambil APK untuk lapangan | `Apk Release\Final\` |
| Cara build / ship APK + gate `git push` | [`Apk Release/Pegangan Build APK/README.md`](Apk%20Release/Pegangan%20Build%20APK/README.md) |
| Skrip ADB lapangan | `scripts\field-adb\` |

Jangan mengedit salinan di `Apk Release\Archived\` atau `docs\arsip-akar\` — itu arsip, bukan source aktif.

---

## Isi akar (yang sengaja ada)

```text
Dashboard Portal\
├── web\                      dashboard admin + firebase.json + functions
├── native-mobile-edulock\    source APK EduLock
├── native-mobile-gas\        source APK GAS
├── apps\eperpus-sekolah\     ePerpus (Vite + Firebase Hosting)
├── docs\                     dokumen resmi
├── scripts\field-adb\        ADB lapangan
├── Apk Release\
│   ├── Final\                APK yang boleh dibagikan / diinstal
│   ├── Pegangan Build APK\   SOP build & deploy
│   ├── Tutorial\             gambar panduan instal
│   └── Archived\             versi lama (disimpan, bukan dipakai harian)
└── .gitignore
```

`.gradle-home\` dan `.vscode\` boleh ada di akar: cache Gradle / setting editor, **bukan** source aplikasi.

---

## APK resmi (pintu Final)

Cek versi terkini di pegangan masing-masing app, bukan mengira dari nama file lama di `Final` (folder itu masih berisi banyak riwayat).

- EduLock: [`Pegangan Build APK/Edulock/README.md`](Apk%20Release/Pegangan%20Build%20APK/Edulock/README.md)  
  File kanonik yang dicatat: `Apk Release\Final\EduLock-1.3.22-48.apk` dan alias `EduLock-studentRelease.apk`
- GAS: [`Pegangan Build APK/GAS/README.md`](Apk%20Release/Pegangan%20Build%20APK/GAS/README.md)

---

## Yang tidak ada di akar (sengaja)

Source web **hanya** di `web\src`.  
Dokumen **hanya** di `docs\` (plus arsip di `docs\arsip-akar`).  
Jangan mencari project Android di dalam `web\`.

---

## Jaga file ini tetap benar

File ini **tidak otomatis berubah**. Setiap kali folder level atas dipindah/diubah namanya, **update README ini di commit yang sama**.

Yang wajib diselaraskan: tabel “Mau ubah apa?”, pohon folder akar, dan tautan pegangan. Jangan biarkan peta ini ketinggalan dari isi Explorer.
