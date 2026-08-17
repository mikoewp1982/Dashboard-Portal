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

## Cegah fitur web admin “hilang” lagi

Ini penyebab paling sering, dan cara menghindarinya:

| Penyebab | Cara aman |
|----------|-----------|
| Fitur hanya di laptop, belum commit/push | Setelah fitur stabil: **commit segera**, lalu push saat siap deploy |
| Push dari salinan `main` yang ketinggalan | Selalu `git pull origin main` **sebelum** mulai edit & sebelum push |
| `git add web/` / `git add .` ikut menimpa file lain | Stage **path file spesifik** saja |
| AI/refactor menghapus menu tanpa sadar | Setelah ubah sidebar/workspace: cek daftar menu di checklist di bawah |
| Force-push / rewrite history | **Dilarang** ke `main` |
| Rollout Console tanpa commit di GitHub | Tidak akan membawa perubahan lokal |

**Aturan praktis:**

1. Satu fitur web = satu (atau beberapa) commit jelas di `main`, jangan menumpuk berhari-hari di working tree.
2. Sebelum push yang menyentuh `GasSidebar`, `GasWorkspace`, `gasConfig`, atau panel Presensi/Rekap: buka live **dan** lokal, pastikan menu kritis masih ada.
3. Jangan “membersihkan” folder dengan menghapus panel/menu yang tidak Anda kerjakan di sesi itu.
4. Jika `git pull` memunculkan konflik di file menu: **selesaikan konflik dulu**, jangan buang sisi yang berisi fitur lama.

---

## Peta menu Presensi (jangan disatukan lagi sembarangan)

| Menu admin | Isi yang benar |
|------------|----------------|
| **Presensi Sekolah** | Pengaturan sistem saja (jadwal/libur/lokasi). Rekap ada di **Rekap Kehadiran**. |
| **Rekap Kehadiran** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik** |
| **Presensi Sholat** | Pengaturan sistem saja (jadwal sekolah sholat, musholla, **Jadwal Sholat Per Kelas**, override). |
| **Rekap Sholat** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik** (Dzuhur / sholat harian sekolah). |
| **Rekap Dhuha & Jum'at** | Tab: Rekap Bulanan → Riwayat Harian → **Statistik**. Wajib dihitung dari **Jadwal Sholat Per Kelas** (+ override), **bukan** jadwal Dzuhur harian. |

CRUD literasi = di **GAS** (bukan Lentera “Kelola Literasi”). Lentera **Katalog Buku** = baca saja dari project e-perpus.

---

## Checklist regresi singkat (web admin)

Centang sebelum push jika Anda menyentuh `web/` atau area terkait:

- [ ] **Manajemen Siswa** — kolom DEVICE GAS & DEVICE EDULOCK + Reset GAS / Reset EduLock (bukan satu DEVICE HASH lama)
- [ ] **Presensi Sekolah** — settings-only + tautan ke Rekap Kehadiran
- [ ] **Rekap Kehadiran** — tiga tab (Bulanan / Harian / Statistik) masih ada
- [ ] **Presensi Sholat** — Jadwal Per Kelas (jam mulai/selesai) + Override Tanggal (rotasi Jumat = tanggal/kelas saja); settings-only
- [ ] **Rekap Sholat** — tiga tab termasuk Statistik
- [ ] **Rekap Dhuha & Jum'at** — menu Monitoring masih ada + tiga tab; % wajib mengikuti jadwal per kelas
- [ ] **Monitoring Virtual Pet** — Total Pets Aktif ≈ siswa yang punya pet terhubung (bukan hitung pet siluman/orphan)
- [ ] **Unduhan APK** — `/gas/install` (dan EduLock bila diubah) menunjuk versi Final yang disepakati
- [ ] Tidak ada API `web/src/app/api/debug-*` baru yang ikut ter-commit

Untuk APK native, pakai juga [GAS/REGRESSION_CHECKLIST.md](./GAS/REGRESSION_CHECKLIST.md) / [Edulock/REGRESSION_CHECKLIST.md](./Edulock/REGRESSION_CHECKLIST.md) sesuai area yang diubah.

**Catatan:** ubah UX rekap/statistik di web admin **tidak** otomatis butuh rebuild APK, kecuali kontrak data/API native ikut berubah.

---

## Kenapa fitur lama bisa “hilang”

Bukan karena live “lupa sendiri”. Biasanya:

- Fitur hanya di lokal, **belum commit/push**
- Tim push dari salinan `main` yang belum berisi kerjaan Anda
- Merge/pull mengambil versi tim dan menimpa file Anda
- Force-push / rewrite history membuat commit lama jadi orphan
- Refactor “merapikan” menghapus menu/panel yang tidak sedang dikerjakan

**Obat:** commit + push segera setelah fitur stabil; selalu pull dulu; patuhi gate + checklist di atas.

---

## Catatan cepat Dhuha / Jumat (sering salah paham)

| Tempat di admin | Fungsi |
|-----------------|--------|
| **Jadwal Sholat Per Kelas** | Jam mulai / selesai + kelas + hari (contoh: Dhuha 1×/minggu per jenjang) |
| **Override Tanggal / Generator Rotasi** | Tanggal + kelas aktif saja (**tanpa** field jam) |
| **Rekap Dhuha & Jum'at** | Hitung wajib dari jadwal/override di atas, bukan dari kalender Dzuhur |

Tanpa jadwal berjam, APK siswa tidak punya jendela operasional meskipun override sudah ada.
