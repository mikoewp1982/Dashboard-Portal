# Ringkasan Masalah Update APK Manual GAS Siswa

## Inti Masalah

- URL instalasi siswa dipakai terutama saat **launching awal**
- setelah itu, update rutin dilakukan dengan **menimpa APK lama secara manual di HP siswa**
- jadi masalah utamanya **bukan link instalasi**, tetapi:
  - apakah APK baru bisa menimpa APK lama dengan normal
  - apakah proses rilis selalu menjaga kompatibilitas update

## Risiko yang Dikhawatirkan

- siswa update APK terbaru
- saat install manual muncul pesan: `Aplikasi tidak terinstal`
- akibatnya update massal ke siswa bisa macet

## Syarat Agar Update Manual Berhasil

APK baru harus tetap menjaga 4 hal ini:
1. `packageName` tetap sama
2. signature/keystore tetap sama
3. `versionCode` selalu naik
4. file APK yang dibagikan benar-benar file final terbaru

## Temuan Teknis Penting

- proyek ini pernah punya riwayat `legacySiswa` dengan package yang sama, tetapi `versionCode` lebih tinggi
- file publik APK juga pernah tertinggal di versi lama
- audit terbaru menemukan artefak lama `docs\APK GAS\apk GAS siswa.apk` dengan package sama tetapi signer berbeda dari build release sekarang
- dokumen handoff lama menyebut folder `docs\APK GAS\` memang berisi build `debug`
- artinya kegagalan update manual bisa terjadi walau aplikasi sudah punya force update

## Temuan Baru Paling Kuat

- APK final sekarang:
  - signer `64738955225d36c64990ebadfba9f2aad03e17739522630466621f0a1eb31f63`
  - `versionCode 23007`
- APK lama di `docs\APK GAS\apk GAS siswa.apk`:
  - signer `a2eb5bc009532e7075912b58c6825b9ea91862676a31507b227d90583d26b674`
  - `versionCode 1028`
- karena signer berbeda, Android **tidak akan mengizinkan overwrite langsung**
- jadi bila HP siswa dulu terpasang dari APK debug lama, bump `versionCode` saja tidak cukup

## Kesimpulan

- `force update` **bukan solusi utama** untuk masalah ini
- force update hanya memberi tahu siswa bahwa versi lama tidak boleh dipakai
- force update **tidak bisa memperbaiki** kegagalan install APK di level Android

## Fokus yang Perlu Diputuskan Tim

1. SOP distribusi update rutin siswa sebenarnya lewat jalur apa?
2. Apakah setiap rilis siswa wajib selalu menaikkan `versionCode`, walau perubahan kecil?
3. Apakah file distribusi perlu penamaan versi/tanggal yang lebih jelas agar operator tidak salah kirim file lama?
4. Apakah perlu satu artefak final resmi yang menjadi satu-satunya sumber distribusi update?

## Rekomendasi Singkat

- pertahankan satu jalur build resmi
- setiap rilis siswa wajib cek:
  - `packageName`
  - signature
  - `versionCode`
  - file APK final yang benar-benar dibagikan
- identifikasi apakah HP yang gagal dulu memasang APK dari jalur `debug/docs`
- jika ya, siapkan migrasi satu kali: uninstall versi lama lalu install ulang APK release resmi
- jangan anggap URL instalasi awal sebagai solusi update rutin
- fokus utama harus pada **kompatibilitas overwrite APK lama**
