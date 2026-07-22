# Konsep Integrasi Ekstrem: EduLock x GAS Virtual Pet
**Kematian Pet = Kunci Perangkat (Hard Lock)**

## Latar Belakang Ide
Saat ini, siswa yang tidak disiplin (mengabaikan tugas, absen, dll) akan mendapati Virtual Pet mereka di aplikasi GAS Siswa mati. Namun, siswa masih bisa mengabaikan aplikasi GAS Siswa dan tetap menggunakan *smartphone* mereka (untuk bermain game, TikTok, dll) di rumah tanpa peduli dengan status Pet tersebut.

Untuk memberikan **efek jera yang nyata**, ide ini mengusulkan agar **EduLock** (yang memiliki akses *Device Admin*) mengambil alih fungsi kunci layar secara total (*Hard Lock*) jika Pet dibiarkan mati melewati batas waktu tertentu.

## Konsep Eksekusi
1. **Pemicu (Trigger)**: Aplikasi GAS Siswa mencatat `deathTimestamp` di Firebase saat kesehatan/kebahagiaan Pet menyentuh angka 0 dan status berubah menjadi `DEAD`.
2. **Pemantau (Observer)**: Aplikasi EduLock menjalankan *background service* yang secara *real-time* mendengarkan perubahan node Pet siswa di Firebase.
3. **Eksekusi (Hard Lock)**: Jika EduLock mendeteksi status `DEAD` dan waktu saat ini telah melewati batas toleransi (misalnya `deathTimestamp + 24 jam`), EduLock langsung mengambil alih layar (*Kiosk Mode*) dan memblokir akses ke semua aplikasi lain.
4. **Penyelesaian**: Siswa wajib menghadap Guru BK. Guru BK menekan tombol "Revive" dari Web Dashboard. Status di Firebase berubah, dan EduLock otomatis membuka kuncian layar.

## Hal-Hal yang Perlu Dipikirkan Matang-Matang (Open Questions)

Sebelum mengeksekusi ide ini di masa depan, tim pengembang dan pihak sekolah harus menyepakati beberapa kebijakan krusial berikut:

1. **Risiko Keadaan Darurat (Emergency Override)**
   Jika HP terkunci total di rumah, bagaimana siswa menghubungi orang tua atau panggilan darurat (112) saat terjadi bencana atau situasi genting? 
   *Solusi yang Disarankan*: EduLock harus tetap mengizinkan fungsi "Panggilan Darurat" di layar kuncinya.

2. **Bypass Orang Tua (Parental PIN)**
   Terkadang HP anak juga merupakan HP keluarga atau satu-satunya alat komunikasi orang tua dengan anak. Jika HP terkunci oleh sekolah di luar jam sekolah, orang tua mungkin akan melayangkan protes keras.
   *Solusi yang Disarankan*: Memberikan PIN khusus yang digenerate oleh sistem untuk orang tua, sehingga orang tua punya otoritas tertinggi untuk membuka paksa kuncian EduLock di rumah.

3. **Batasan Waktu Eksekusi**
   Apakah eksekusi *Hard Lock* hanya berlaku di jam sekolah, atau 24 jam penuh tanpa pandang bulu? Jika hukuman berlaku di hari libur (Sabtu/Minggu), apakah ini melanggar hak privasi siswa di luar yurisdiksi sekolah?

4. **Sistem Notifikasi Peringatan (Warning System)**
   Sebelum mengeksekusi kuncian total, sistem (GAS Siswa) idealnya memberikan notifikasi peringatan (misalnya: *"Pet Anda akan memicu penguncian HP dalam 2 jam jika tidak segera diurus"*).

---
*Dokumen ini adalah draf konsep untuk didiskusikan lebih lanjut. Dibuat pada 21 Juli 2026.*
