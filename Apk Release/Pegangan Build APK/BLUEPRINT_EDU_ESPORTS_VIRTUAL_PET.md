# Blueprint Pengembangan: Edu-Esports Virtual Pet
*(Dokumen Konsep Desain & Peta Jalan Gamifikasi)*

**Tanggal Dokumen:** 2026-08-11
**Visi Utama:** Mengubah rutinitas edukasi, kedisiplinan, dan ibadah menjadi pengalaman *gaming* ala *esports* (MOBA/Battle Royale) yang adiktif, kompetitif, dan kolaboratif bagi para siswa.

---

## 1. Pemilihan Faksi & Jalur Permainan (Personalisasi Gender & Minat)
Untuk mengakomodasi perbedaan minat antara siswa laki-laki (kompetitif) dan perempuan (estetik/sosial), di awal permainan siswa akan diminta untuk memilih "Jalur" (Path) atau "Faksi" yang akan menentukan gaya bermain mereka:

### A. Jalur Kesatria (Fokus *Battle & Rank*)
* **Cocok untuk:** Anak laki-laki atau siswa yang menyukai persaingan dan *esports*.
* **Mekanik:** Koin yang didapat digunakan untuk menempa pedang, membeli *armor*, dan fokus utamanya adalah memberikan *damage* terbesar saat melawan *Raid Boss* Kelas. 

### B. Jalur Perawat/Kreator (Fokus *Cozy & Aesthetic*)
* **Cocok untuk:** Anak perempuan atau siswa yang menyukai game santai (seperti *Animal Crossing* atau *Dress Up*).
* **Mekanik:** Koin digunakan untuk mendekorasi kamar *pet*, membeli pakaian/aksesoris lucu, dan menanam bunga di taman. Di saat Perang Kelas, tugas mereka bukan menyerang bos, melainkan menyembuhkan (*healing*) pet teman sekelas atau memberikan dukungan (*buff*).

Kedua jalur ini saling melengkapi dalam satu kelas. Kelas yang kuat membutuhkan Kesatria untuk menyerang, dan Perawat untuk bertahan.

---

## 2. Konsep Dua Dunia (Dual Mode)
Untuk menjaga keseimbangan antara tanggung jawab pribadi dan kerja sama tim, ekosistem Virtual Pet dibagi menjadi dua mode utama:

### A. Mode *Single-Player* (Perawatan & Evolusi Personal)
Mode ini fokus pada tanggung jawab harian siswa terhadap *pet* virtual mereka. Kegagalan di mode ini akan membuat *pet* kelaparan, sakit, atau mati.
* **Mekanik Utama:**
  * **E-Perpus (Membaca Buku):** Mengisi bar "Kenyang" (Hijau).
  * **7 KAIH (Kebiasaan Baik):** Mengisi bar "Energi" (Kuning).
  * **Absensi (Kehadiran & Disiplin):** Menjaga bar "Kesehatan" (Biru Muda).
  * **Presensi Sholat:** Mengisi bar "Kebahagiaan" (Merah Muda).
* **Sistem Evolusi Berbasis Peran (*Role*):**
  * Siswa yang rajin membaca mendapat tambahan poin "Kecerdasan" (Ungu). Jika >100, pet berevolusi menjadi **Mage/Ilmuwan** (spesialis serangan sihir/kerusakan besar).
  * Siswa yang rajin ibadah/7KAIH mendapat tambahan poin "Sosial" (Biru Langit). Jika >100, pet berevolusi menjadi **Tank/Kesatria/Support** (spesialis pertahanan & penyembuh).

### B. Mode *Multi-Player* (Perang Kelas / *Guild Raid*)
Mode ini menyatukan kekuatan seluruh *pet* di dalam satu kelas (misal Kelas VII-A) untuk bertarung bersama melawan musuh bersama (Raid Boss).
* **Mekanik "Raid Boss":**
  * Setiap Jumat, raksasa "Monster Kebodohan" atau "Lord Kemalasan" (HP: 10.000) akan muncul di dasbor kelas.
  * **Serangan Tim (*Teamfight*):**
    * *Basic Attack* (Serangan Rutin) disumbang dari kedisiplinan absensi harian kelas.
    * *Ultimate Skill* (Serangan Puncak) disumbang dari penyelesaian **Tugas Literasi Bulanan** (Memberikan *damage* yang sangat besar).
  * Jika siswa malas, pertahanan tim bocor. Jika rajin, monster cepat tumbang.

---

## 2. Sistem *Reward*, Prestise, dan Ekonomi

Untuk memastikan siswa terus bersemangat, aplikasi mengadaptasi sistem penghargaan ala *esports*:

### A. Papan Peringkat (*Tier Rank*)
* Tidak ada lagi sistem Peringkat Kelas konvensional. Siswa dan Kelas bersaing untuk menaikkan lambang *Tier*: **Bronze, Silver, Gold, Epic, Legend, Mythic**.
* Kelas yang berhasil membunuh bos tercepat akan naik *Tier*, memicu *Fear of Missing Out* (FOMO) positif antar-kelas.

### B. MVP (*Most Valuable Player*)
* Di akhir pertarungan Bos, siswa dengan kontribusi literasi dan kedisiplinan tertinggi akan dipajang fotonya secara megah di layar dengan gelar **MVP**.

### C. *Loot Crate* & *Gacha Skin* (Kosmetik)
* **Kado *Victory*:** Mengalahkan Bos akan menjatuhkan *Loot Crate* (Peti Harta) untuk seluruh anggota kelas.
* **Gacha Animasi:** Saat membuka peti, layar akan menampilkan animasi mewah. Siswa bisa mendapatkan *Skin* langka (Aura Api, Sayap Malaikat, Pedang Kristal) untuk *pet* mereka.
* **Kosmetik sebagai Simbol Status:** *Skin* ini bisa dipakai oleh *pet* mereka dan akan terlihat oleh seluruh sekolah di layar lobi utama/dasbor, memberikan kebanggaan visual (*flexing* edukatif).

---

## 3. Desain Visual & Animasi (Bebas Kekerasan)
Untuk memastikan *game* tetap ramah anak sekolah (*Family Friendly*) tanpa kehilangan keseruan, seluruh adegan "pertarungan" tidak akan menampilkan kekerasan fisik. Sensasi epik dibangun melalui **5 Trik Sinematik**:
1. **Screen Shake (Layar Bergetar):** Layar HP bergetar keras saat serangan magis diluncurkan untuk memberikan sensasi benturan tanpa harus ada pukulan fisik.
2. **Particle Effects (Sihir & Cahaya):** Mengganti darah dengan ledakan cahaya sihir. *Healer* (Perawat) memunculkan kelopak bunga bercahaya, sedangkan Kesatria memunculkan laser energi dari buku bacaan mereka.
3. **Zoom-In Cinematic:** Saat *Ultimate Skill* (Tugas Literasi) digunakan, kamera akan *zoom in* ke mata *pet*, meredupkan layar, lalu menembakkan pilar cahaya besar (seperti jurus andalan anime).
4. **Combo Counter:** Menampilkan teks raksasa (Misal: "50x COMBO!") di layar saat seluruh kelas berhasil absen disiplin bersamaan, membangkitkan adrenalin kekompakan.
5. **Sound Design Menggelegar:** Musik orkestra epik, suara *bass* yang dalam saat menyerang, dan suara koin berhamburan saat menang untuk memicu dopamin siswa.

---

## 4. Arsitektur Aplikasi Terpisah (*Companion App*)
Untuk memastikan aplikasi produktivitas sekolah (GAS Siswa) tetap ringan, profesional, dan cepat, maka *game* Edu-Esports ini **TIDAK AKAN** disatukan ke dalam APK GAS Siswa. 

Sebagai solusinya, kita akan merilis **APK Terpisah (Game App Khusus)** dengan tata kelola sebagai berikut:
1. **Login Terintegrasi:** Siswa cukup masuk (*login*) ke dalam APK Game menggunakan `NPSN` dan `NISN` mereka. 
2. **Berbagi Database (Sinkronisasi *Real-time*):** *Game* ini akan membaca pangkalan data (Firebase) yang sama persis dengan APK GAS. Semua aktivitas membaca E-Perpus, Absensi, atau 7 KAIH yang dilakukan siswa di APK GAS akan langsung tersinkronisasi menjadi poin/energi di dalam APK Game.
3. **Pilihan Opsional (Ramah Penyimpanan):** Siswa dengan spesifikasi HP rendah (RAM/Memori kecil) tidak dipaksa untuk menginstal *game* ini. Aplikasi utama GAS Siswa akan tetap berjalan normal tanpa terbebani oleh file animasi 3D, Spine 2D, atau musik *game*.
4. **Fokus Kegunaan:** Aplikasi GAS fokus penuh pada rutinitas akademik, sementara Aplikasi Game menjadi wadah hiburan (pelepas stres) yang sepenuhnya digerakkan oleh rutinitas akademik tersebut.

---

## 5. Catatan Implementasi Teknis (Transisi)
1. **Pemisahan Tugas Literasi:** Mulai pembaruan mendatang, Tugas Literasi harus dilepas dari syarat "Kebutuhan Tidur Harian" pet, dan diubah menjadi Pemicu "Ultimate Skill / Super Bonus" untuk menjaga kesehatan ekosistem harian.
2. **Timer E-Perpus:** Memasang penghitung durasi membaca (*stopwatch* latar belakang) pada layar PDF secara lokal.
3. **Database Skema:** Menambahkan parameter `guildId` (ID Kelas) dan `role` (Mage/Tank/Support) di pangkalan data Firebase untuk memfasilitasi pertarungan kelas.

*Dokumen ini bersifat hidup (living document) dan akan diperbarui seiring dengan perkembangan teknis aplikasi.*
