# Rencana Pengembangan Fitur: Bar "Sosial" Virtual Pet

Dokumen ini berisi rancangan dan ide-ide untuk diimplementasikan di masa mendatang guna mengisi dan mengaktifkan bar **Sosial** pada Virtual Pet siswa di aplikasi Sahabat Belajar. 

Tujuan utama dari fitur Sosial adalah untuk menumbuhkan rasa empati, kerja sama, dan interaksi positif antar siswa melalui pendekatan gamifikasi.

---

## 1. Integrasi Misi "Bakti & Peduli" dari 7 KAIH
**Konsep:** Mengaitkan poin Sosial dengan rutinitas 7 KAIH (Kebiasaan Anak Indonesia Hebat).
*   **Mekanisme:** Jika di dalam parameter 7 KAIH terdapat aktivitas yang bersifat sosial (misalnya: *Membantu Orang Tua*, *Berbagi / Sedekah*, atau *Menolong Teman*), maka sistem akan mendeteksi aktivitas tersebut.
*   **Efek Gamifikasi:** Setiap kali tugas tersebut dikerjakan dan di-klaim, bar Sosial Pet akan bertambah secara otomatis (misalnya +5 atau +10 poin).

## 2. Fitur "Kunjungan & Kirim Hadiah" (Interaksi Peer-to-Peer)
**Konsep:** Memungkinkan siswa berinteraksi dengan Virtual Pet milik teman sekelasnya.
*   **Mekanisme:** 
    * Siswa dapat melihat daftar Pet teman-temannya melalui menu *Leaderboard* atau tab khusus *Teman*.
    * Siswa dapat menggunakan **Koin (Coins)** yang mereka kumpulkan untuk membeli barang (misal: Mainan, Snack, Susu) di *Shop*.
    * Barang tersebut tidak dipakai sendiri, melainkan dikirim sebagai **Hadiah** ke Pet teman.
*   **Efek Gamifikasi:**
    * **Pengirim:** Mendapatkan peningkatan besar pada bar **Sosial** (contoh: +20 Sosial).
    * **Penerima:** Pet milik penerima akan mendapatkan peningkatan bar **Kebahagiaan (Happiness)**.

> [!TIP]
> Fitur ini sangat efektif untuk membangun ekosistem aplikasi yang *addictive* namun tetap mendidik, karena memotivasi siswa mencari koin (dengan berbuat baik) untuk bisa saling berbagi.

## 3. Sistem "Piket & Gotong Royong" Kelas
**Konsep:** Tugas harian yang menyesuaikan dengan jadwal dunia nyata di sekolah.
*   **Mekanisme:** Menambahkan *Quest* khusus yang hanya muncul pada hari di mana siswa tersebut mendapat giliran Piket Kelas. Verifikasi bisa dilakukan dengan *scan* QR Code di kelas atau persetujuan satu ketukan dari Wali Kelas.
*   **Efek Gamifikasi:** Peningkatan stat Sosial secara drastis saat tugas piket diselesaikan.

## 4. Misi Komunitas Kelas (Co-Op Quests)
**Konsep:** Membangun kerja sama tim satu kelas (1 rombel).
*   **Mekanisme:** Wali Kelas atau Sistem dapat memberikan "Target Bersama". Contoh: *"Kumpulkan 1.000 menit durasi Membaca E-Perpus dalam 1 Minggu untuk seluruh kelas"*.
*   **Efek Gamifikasi:** 
    * Setiap menit yang disumbangkan oleh siswa akan menambah stat **Sosial** individu mereka.
    * Jika target kelas tercapai, seluruh kelas mendapatkan hadiah kolektif (misal: *Background* kelas khusus untuk Pet, atau bonus *Multiplier XP* selama 3 hari).

---

## Langkah Persiapan (Jika Akan Diimplementasikan Nanti)

1. **Database:** Menambahkan skema tabel untuk fitur pertemanan atau riwayat pengiriman hadiah (`pet_gifts`) di Firebase.
2. **UI/UX:** Membuat tab atau modal dialog untuk daftar teman sekelas dan animasi saling berkirim hadiah.
3. **Repository:** Memisahkan logika poin Sosial pada `VirtualPetRepository.kt` ketika mendeteksi klaim tugas 7 KAIH tertentu.
