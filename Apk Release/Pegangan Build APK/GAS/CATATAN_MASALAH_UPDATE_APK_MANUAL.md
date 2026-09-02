# Catatan Masalah Update APK Manual GAS Siswa

Dokumen ini dibuat untuk bahan konsultasi internal terkait kekhawatiran bahwa siswa bisa gagal menimpa APK lama saat melakukan update manual dari file APK terbaru.

## Ringkasan Masalah

Gejala yang dikhawatirkan:
- siswa mengunduh APK terbaru
- siswa mencoba install manual di HP
- Android menampilkan pesan `Aplikasi tidak terinstal`

Kekhawatiran utama:
- alur update manual antar versi tidak stabil
- siswa tidak mungkin dibantu satu per satu lewat `adb`
- force update di aplikasi menjadi kurang berguna bila file APK terbaru tetap gagal ditimpa secara manual

## Klarifikasi Operasional

URL instalasi siswa dipakai terutama saat **launching pertama / instalasi awal**.

Sesudah itu, alur nyata di lapangan adalah:
- siswa sudah memiliki aplikasi di HP
- ketika ada update, siswa cukup menimpa APK lama secara manual
- update rutin **tidak bergantung** pada URL instalasi awal sebagai kanal utama

Implikasinya:
- masalah utama yang perlu diselesaikan tim bukan sekadar "apakah link unduhan benar"
- masalah utamanya adalah **apakah APK baru selalu bisa menimpa APK lama secara manual di HP siswa**
- force update tetap berguna sebagai pemberitahuan versi minimum, tetapi bukan jawaban utama untuk alur update harian

## Fakta Teknis yang Sudah Ditemukan

### 1. Force update bukan solusi instalasi
Mekanisme force update di GAS hanya bekerja **setelah aplikasi sudah terpasang dan bisa dibuka**. Jadi force update:
- bisa memaksa siswa menuju layar update
- tidak bisa memperbaiki kegagalan instalasi APK di level Android

### 2. Jalur masalah update manual ada di distribusi APK
Supaya update manual berhasil, empat hal ini harus tetap benar:
1. `packageName` tetap sama
2. signature/keystore tetap sama
3. `versionCode` selalu naik
4. file unduhan publik benar-benar mengarah ke APK terbaru

Jika salah satu dari empat poin di atas meleset, siswa bisa melihat pesan `Aplikasi tidak terinstal`.

### 3. Riwayat proyek pernah punya sumber masalah nyata
Beberapa sumber masalah yang sudah pernah ditemukan di proyek ini:
- file publik `web/public/apk/GAS-Siswa-release.apk` pernah stale dan tertinggal di versi lama
- flavor `legacySiswa` pernah memakai package yang sama `com.satupintu.mobile.siswa`, tetapi `versionCode` lebih tinggi (`23003`)
- akibatnya, build siswa reguler dengan `versionCode` lebih rendah pernah berisiko dianggap downgrade

### 4. Status mitigasi saat dokumen ini dibuat
Mitigasi yang sudah dipasang:
- `versionCode` siswa sudah dinaikkan berurutan sampai build terbaru
- skrip sinkronisasi `web/public/apk` sekarang memverifikasi metadata APK
- sinkronisasi akan ditolak bila:
  - `versionCode` turun
  - `versionCode` sama tetapi isi APK berubah
  - signature berbeda dari file publik sebelumnya

### 5. Temuan audit terbaru: ada jejak distribusi build debug dengan signer berbeda
Audit artefak APK di workspace menunjukkan:
- `D:\Dashboard Portal\Apk Release\Final\GAS-Siswa-release.apk`
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `23007`
  - versionName: `1.0.15-siswa`
  - signer SHA-256: `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`
- `D:\Dashboard Portal\docs\APK GAS\apk GAS siswa.apk`
  - package: `com.satupintu.mobile.siswa`
  - versionCode: `1028`
  - versionName: `1.0.11-siswa`
  - signer SHA-256: `a2eb5bc009532e7075912b58c6825b9ea91862676a31507b227d90583d26b674`

Temuan kunci:
- `packageName` sama, tetapi signer berbeda
- dokumen `D:\Dashboard Portal\docs\APK GAS\handoff_APK GAS.md` juga menulis bahwa folder `docs\APK GAS\` berisi build terbaru `debug`
- signer file `docs\APK GAS\apk GAS siswa.apk` cocok dengan `app\build\outputs\apk\siswa\debug\app-siswa-debug.apk`

Implikasi langsung:
- jika ada HP siswa yang dahulu pertama kali memasang APK dari jalur `debug`, maka update ke build `release` saat ini **akan selalu ditolak Android**
- dalam skenario ini, menaikkan `versionCode` setinggi apa pun **tidak akan menyelesaikan** masalah
- Android hanya mengizinkan overwrite jika signer lama dan signer baru sama

## Kesimpulan Sementara

Masalah update manual **bukan** terletak pada konsep force update, melainkan pada **keandalan artefak distribusi dan kompatibilitas APK antar versi**.

Artinya, keberhasilan update manual siswa sangat bergantung pada disiplin rilis berikut:
- build yang dibagikan harus benar-benar versi terbaru
- file publik tidak boleh stale
- jalur package/signature tidak boleh berubah
- `versionCode` tidak boleh mundur atau lompat ke bawah riwayat kompatibilitas lama

Karena URL instalasi awal bukan kanal update harian, maka prioritas tim sebaiknya bergeser ke:
- kestabilan proses overwrite APK lama di HP
- konsistensi `packageName`, signature, dan `versionCode`
- kejelasan SOP distribusi file APK update setelah aplikasi sudah terpasang

## Risiko Operasional Bila Tidak Diperketat

Jika alur distribusi tidak dipaksa satu pintu, potensi masalah yang bisa berulang:
- siswa menginstall file APK lama yang masih tersimpan di folder download
- web/live masih melayani file APK lama walau folder `Final` lokal sudah benar
- file manager tertentu menampilkan gejala gagal instal yang membingungkan
- sekolah sulit membedakan masalah `versionCode`, stale file, atau signature mismatch
- sebagian HP siswa ternyata baseline-nya berasal dari APK `debug`, sehingga selamanya tidak kompatibel dengan rilis `release` sekarang tanpa tindakan migrasi

## Rekomendasi untuk Dibahas dengan Tim

### Opsi minimum yang realistis
- tetap pakai alur update manual
- tetapkan satu **artefak APK resmi** setiap rilis
- release checklist wajib memuat verifikasi:
  - `packageName`
  - signature
  - `versionCode`
  - file APK final yang benar-benar dibagikan ke siswa
- bila link web masih dipakai sebagai cadangan, link itu harus tetap menunjuk ke artefak yang sama

### Opsi yang lebih aman
- setiap rilis diberi identitas versi yang jelas di catatan internal dan file distribusi
- admin/operator sekolah hanya membagikan file dari satu sumber final yang sudah tervalidasi
- bila perlu, nama file distribusi bisa menyertakan tanggal/jam rilis untuk mengurangi risiko salah pilih file lama

### Opsi proses rilis yang perlu diputuskan
- apakah setiap rilis siswa wajib:
  1. build release
  2. overwrite `Apk Release\\Final`
  3. sinkronkan ke `web/public/apk`
  4. verifikasi manifest/hash publik
  5. baru setelah itu push/deploy live

### Opsi migrasi jika signer debug memang sudah tersebar
- **Opsi paling realistis**: siswa yang dulu memasang APK debug perlu uninstall sekali, lalu install ulang dari APK release resmi
- **Opsi yang tidak disarankan**: kembali membagikan build debug agar bisa menimpa versi debug lama, karena itu mempertahankan jalur distribusi yang tidak stabil dan membuat migrasi ke signer release makin sulit
- **Opsi yang perlu validasi lapangan**: petakan dulu perangkat mana saja yang baseline instalasinya berasal dari jalur debug, agar tidak semua siswa disamakan

## Pertanyaan untuk Tim

1. Kanal distribusi update rutin siswa sebenarnya apa yang paling sering dipakai setelah launching awal: file share operator, WA, drive, atau sumber lain?
2. Apakah tim ingin menetapkan satu SOP resmi bahwa setiap rilis siswa **wajib** menaikkan `versionCode`, walau perubahan terlihat kecil?
3. Apakah tim ingin memberi penamaan file distribusi yang lebih eksplisit per rilis agar operator tidak salah kirim file lama?
4. Apakah URL instalasi awal tetap perlu dipertahankan hanya sebagai kanal onboarding/cadangan, bukan kanal update utama?

## Posisi Saat Ini

Saat dokumen ini dibuat:
- build siswa terbaru sudah memakai package yang sama
- `versionCode` sudah dinaikkan lagi agar bisa menimpa build sebelumnya
- guard sinkronisasi file publik sudah dipasang
- sudah ditemukan bukti kuat adanya APK siswa lama dengan signer debug berbeda di jalur `docs\APK GAS\`

Namun demikian, update manual siswa tetap perlu dianggap sebagai area yang **harus dijaga proses rilisnya**, bukan sekadar masalah coding di aplikasi.
