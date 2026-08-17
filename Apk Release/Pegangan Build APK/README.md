# Pegangan Build APK — Mulai di sini

**Baca file ini dulu.** Dokumen lain di folder ini = detail / arsip. Jangan skip gate di bawah sebelum `git push origin main`.

Live Dashboard = isi **`origin/main`** saja. Yang hanya jalan di laptop (belum commit/push) **tidak** muncul di App Hosting.

---

## Pilih jalur kerja

| Mau apa | Buka |
|---------|------|
| Deploy / ubah **web admin** | [PANDUAN_DEPLOY_WEB.md](./PANDUAN_DEPLOY_WEB.md) + **gate push** di bawah |
| Build / ship **GAS** | [GAS/README.md](./GAS/README.md) → [GAS/RELEASE.md](./GAS/RELEASE.md) |
| Build / ship **EduLock** | [Edulock/README.md](./Edulock/README.md) → [Edulock/RELEASE.md](./Edulock/RELEASE.md) |
| Aturan AI / script ship | [# Aturan wajib untuk AI assistant.txt](./%23%20Aturan%20wajib%20untuk%20AI%20assistant.txt) |

**Arsip (bukan bacaan harian):** `CHECKLIST_PERUBAHAN_APK_TERKINI.md`, `GAS/BUILD_LOG.md`, `GAS/CHANGELOG.md`, roadmap `.docx`.

---

## WAJIB sebelum `git push origin main`

Kerjakan berurutan. Jika salah satu gagal → **jangan push**.

1. **Kerjaan Anda sudah di-commit** — jangan biarkan fitur penting hanya di working tree.
2. `git status` bersih untuk file yang tidak relevan; **jangan** `git add web/` atau `git add .` buta.
   - Jangan push: `debug-*` API, script `check-*` / `delete_*` sekali pakai, `web/Apk Release/`, APK di dalam `web/docs/`.
3. `git pull origin main` (atau rebase) dulu supaya tidak menimpa commit orang lain / fitur lama.
4. **Jangan force-push** ke `main` / `master`.
5. Bandingkan **lokal vs live** untuk menu kritis di bawah (minimal smoke).
6. Setelah push: tunggu App Hosting **hijau**, lalu hard-refresh live.

Deploy web = push dari root repo `D:\Dashboard Portal` ke `origin/main`.  
Manual rollout di Firebase Console **tidak** mengambil perubahan yang belum ada di GitHub.

---

## Checklist regresi singkat (web admin)

Centang sebelum push jika Anda menyentuh `web/` atau area terkait:

- [ ] **Manajemen Siswa** — kolom DEVICE GAS & DEVICE EDULOCK + Reset GAS / Reset EduLock (bukan satu DEVICE HASH lama)
- [ ] **Presensi Sholat** — Jadwal Per Kelas (jam mulai/selesai) + Override Tanggal (rotasi Jumat = tanggal/kelas saja)
- [ ] **Rekap Dhuha & Jum'at** — menu sidebar Monitoring masih ada
- [ ] **Monitoring Virtual Pet** — Total Pets Aktif ≈ siswa yang punya pet terhubung (bukan hitung pet siluman/orphan)
- [ ] **Unduhan APK** — `/gas/install` (dan EduLock bila diubah) menunjuk versi Final yang disepakati

Untuk APK native, pakai juga [GAS/REGRESSION_CHECKLIST.md](./GAS/REGRESSION_CHECKLIST.md) / [Edulock/REGRESSION_CHECKLIST.md](./Edulock/REGRESSION_CHECKLIST.md) sesuai area yang diubah.

---

## Kenapa fitur lama bisa “hilang”

Bukan karena live “lupa sendiri”. Biasanya:

- Fitur hanya di lokal, **belum commit/push**
- Tim push dari salinan `main` yang belum berisi kerjaan Anda
- Merge/pull mengambil versi tim dan menimpa file Anda
- Force-push / rewrite history membuat commit lama jadi orphan

**Obat:** commit + push segera setelah fitur stabil; selalu pull dulu; patuhi gate di atas.

---

## Catatan cepat Dhuha / Jumat (sering salah paham)

| Tempat di admin | Fungsi |
|-----------------|--------|
| **Jadwal Sholat Per Kelas** | Jam mulai / selesai + kelas + hari |
| **Override Tanggal / Generator Rotasi** | Tanggal + kelas aktif saja (**tanpa** field jam) |

Tanpa jadwal berjam, APK siswa tidak punya jendela operasional meskipun override sudah ada.
