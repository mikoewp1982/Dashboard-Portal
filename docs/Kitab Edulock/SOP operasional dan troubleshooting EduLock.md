# SOP Operasional dan Troubleshooting EduLock

## Tujuan
Dokumen ini menjadi pegangan operasional utama untuk tim EduLock saat:
- memasang aplikasi di lapangan,
- menguji sebelum rollout,
- menangani insiden saat HP siswa bermasalah,
- menenangkan admin sekolah agar tidak panik saat terjadi kasus massal.

Dokumen ini tidak menggantikan dokumen arsitektur dan matriks uji.
Dokumen ini fokus pada pertanyaan praktis:
- apa yang harus dicek lebih dulu,
- siapa yang melakukan apa,
- kapan perangkat dianggap aman,
- kapan rollout harus dihentikan,
- apa langkah recovery saat perangkat terkunci atau lock bocor.

Aturan penting:
- isi SOP ini harus mengikuti perilaku APK yang benar-benar terjadi,
- bukan hanya niat desain atau harapan arsitektur,
- dan setiap jalur recovery yang belum stabil tidak boleh ditulis seolah-olah sudah aman dipakai operator.

---

## Prinsip Operasional

### 1. EduLock adalah aplikasi risiko tinggi
Karena aplikasi ini mengunci perangkat siswa, setiap bug memiliki dampak operasional besar.

Akibatnya:
- jangan menganggap bug kecil sebagai hal sepele,
- jangan rollout massal sebelum jalur recovery benar-benar jelas,
- setiap perubahan enforcement harus diuji di perangkat nyata.

### 2. Admin sekolah harus punya jalur pemulihan yang pasti
Sistem lock yang kuat tanpa recovery yang jelas akan menimbulkan panik di lapangan.

Maka jalur berikut wajib ada dan dipahami operator:
- jalur buka darurat,
- jalur buka izin sah,
- jalur reset binding,
- jalur uninstall resmi,
- jalur eskalasi ke tim teknis.

### 3. Rollout harus bertahap
Jangan langsung sebar ke ratusan siswa.

Gunakan tahapan:
1. lab internal,
2. pilot kecil,
3. rollout bertahap per kelompok,
4. rollout massal setelah semua skenario P0 lolos.

### 4. Jika ragu, pilih keselamatan operasional
Jika ada bug yang membuat:
- HP siswa terkunci tanpa recovery jelas,
- lock gagal tapi seharusnya aktif,
- atau perilaku tidak konsisten antar perangkat,

maka rollout harus ditahan dulu.

---

## Status Real APK Saat Ini

Bagian ini menjadi pagar utama interpretasi SOP.
Jika perilaku lapangan berbeda dengan desain, maka yang dipakai adalah perilaku lapangan.

### Aturan yang sudah tertanam dan terverifikasi
- sinkron jam sekolah ke APK sudah bisa terbaca,
- sinkron koordinat sekolah ke APK sudah bisa terbaca,
- dashboard EduLock bisa menampilkan status lokasi yang sesuai,
- lock dimaksudkan aktif saat siswa keluar ke aplikasi lain dalam jam sekolah.

### Aturan yang tertanam di kode tetapi belum boleh dianggap reliabel operasional
- jalur emergency unlock berbasis pola `EduLock` + tanggal memang ada di kode,
- tetapi pada pengujian nyata jalur ini tidak berhasil membuka perangkat secara konsisten,
- maka jalur ini belum boleh dianggap recovery lapangan yang aman.

### Aturan yang saat ini justru terbukti bermasalah
- lock masih bisa bocor setelah layar mati atau standby,
- pesan `Proteksi Wajib Aktif` berpotensi membuat operator buntu jika accessibility mati,
- recovery saat perangkat benar-benar terkunci belum cukup deterministik untuk skala massal.

### Konsekuensi operasional
- SOP ini tidak boleh menjanjikan bahwa mode darurat pasti bekerja,
- SOP ini harus menandai jalur yang masih `belum reliabel`,
- rollout massal tidak boleh dilakukan sebelum jalur recovery kritis lolos uji nyata.

---

## Status Operasional Yang Harus Dipahami Tim

### Kondisi aman dipakai lapangan
Perangkat dianggap sehat jika:
- identitas siswa tampil benar,
- jam sekolah terbaca benar,
- koordinat sekolah terbaca benar,
- status lokasi sesuai kondisi nyata,
- proteksi aktif,
- accessibility aktif,
- device admin aktif,
- saat siswa keluar ke aplikasi lain dalam jam sekolah perangkat langsung direbut kembali oleh EduLock.

### Kondisi belum aman
Perangkat dianggap belum aman jika salah satu ini terjadi:
- kode darurat tidak konsisten,
- lock bisa bocor setelah layar mati lalu hidup lagi,
- siswa bisa bebas keluar dari EduLock saat seharusnya terkunci,
- koordinat sekolah di admin tidak sinkron ke APK,
- binding perangkat tidak tegas,
- admin sekolah tidak paham langkah recovery.

Jika salah satu poin di atas muncul berulang, perangkat tidak layak dijadikan dasar rollout massal.

---

## Pembagian Peran

### Admin sekolah
Bertugas:
- mengubah jam sekolah dan koordinat,
- mengaktifkan atau mematikan proteksi sesuai kebijakan,
- memberi izin penggunaan HP jika memang sah,
- mereset binding siswa jika pindah perangkat,
- melaporkan insiden dengan data yang lengkap.

Admin sekolah tidak boleh:
- mencoba banyak tindakan acak saat panik,
- menyuruh siswa uninstall paksa tanpa jalur resmi,
- menyimpulkan bug dari satu percobaan yang tidak terdokumentasi.

### Operator lapangan
Bertugas:
- memasang APK,
- menyelesaikan setup izin,
- menjalankan checklist uji,
- mencatat hasil setiap perangkat,
- memisahkan kasus bug dari kasus salah setup.

### Tim teknis inti
Bertugas:
- menganalisis insiden,
- memutuskan apakah rollout lanjut atau ditahan,
- membuat build perbaikan,
- memperbarui dokumen pegangan,
- menjaga satu sumber kebenaran keputusan operasional.

---

## Aturan Sebelum Rollout Massal

Rollout massal hanya boleh dilakukan jika semua ini lolos:
- sinkron jadwal sekolah stabil,
- sinkron koordinat sekolah stabil,
- lock saat keluar aplikasi berjalan konsisten,
- jalur izin sah tidak memicu false lock,
- jalur emergency unlock dapat dipicu dengan pasti di perangkat nyata, bukan hanya tertulis di kode,
- jalur standby atau screen on tidak menyebabkan lock bocor,
- binding perangkat tegas,
- admin sekolah memahami SOP recovery.

Jika satu saja belum lolos, status sistem adalah:
- siap uji terbatas,
- belum siap rollout massal.

---

## SOP Pemasangan Perangkat Baru

### Langkah 1
Pasang APK dari folder:

`D:\Satu Pintu\Siap Pakai\APK EduLock`

### Langkah 2
Selesaikan setup dasar:
- registrasi siswa,
- izin lokasi,
- izin lokasi background,
- izin overlay,
- accessibility,
- device admin,
- pengecualian baterai bila perlu.

### Langkah 3
Cek dashboard EduLock:
- nama siswa benar,
- kelas benar,
- jam sekolah benar,
- status lokasi benar,
- jarak masuk akal,
- proteksi aktif.

### Langkah 4
Jalankan uji dasar:
- tekan Home,
- buka Recent Apps,
- buka aplikasi lain,
- matikan layar lalu hidupkan lagi,
- nyalakan dan matikan internet,
- uji saat masih jam sekolah.

### Langkah 5
Catat hasil perangkat.

Minimal catat:
- nama siswa,
- merek dan tipe HP,
- versi APK,
- hasil uji lock,
- hasil uji standby,
- hasil uji koordinat,
- hasil uji jalur darurat.

---

## SOP Saat HP Tidak Terkunci Padahal Harusnya Terkunci

### Gejala
Siswa masih bisa membuka aplikasi lain saat:
- masih jam sekolah,
- proteksi aktif,
- lokasi di area sekolah.

### Langkah cek cepat
1. cek apakah jam sekolah di APK benar,
2. cek apakah status lokasi benar-benar `Di Area Sekolah`,
3. cek apakah proteksi aktif,
4. cek apakah accessibility aktif,
5. cek apakah device admin aktif,
6. uji keluar ke aplikasi lain, bukan hanya melihat dashboard EduLock.

### Jika masih lolos
Catat:
- jam saat kejadian,
- aplikasi apa yang berhasil dibuka,
- apakah Home dan Recent Apps juga lolos,
- apakah setelah standby perangkat tetap lolos.

### Keputusan
- jika lolos sekali dan konsisten terulang: anggap bug P0,
- hentikan rollout di kelompok perangkat sejenis sampai ada build perbaikan.

---

## SOP Saat HP Terkunci Total dan Admin Panik

### Tujuan
Membuka perangkat dengan jalur sah tanpa tindakan acak.

### Langkah utama
1. identifikasi teks yang muncul di layar,
2. bedakan jenis kasus,
3. pilih recovery yang sesuai.

### A. Jika layar menampilkan `Mode Darurat`
Jangan langsung berasumsi perangkat pasti bisa dibuka dengan jalur ini.

Catatan:
- pastikan operator tahu pola pemicu dialog darurat,
- pastikan password darurat diuji di perangkat nyata sebelum rollout lapangan,
- jika jalur ini gagal di satu perangkat, catat sebagai blocker operasional.

Status real saat ini:
- pola emergency unlock ada di kode,
- tetapi pada pengujian nyata belum berhasil secara konsisten,
- sehingga jalur ini belum boleh dijadikan satu-satunya pegangan recovery.

### B. Jika layar menampilkan `Proteksi Wajib Aktif`
Artinya masalah ada pada accessibility yang mati.

Langkah:
1. cek apakah ada jalur sah untuk membuka pengaturan aksesibilitas,
2. jika tidak ada jalur yang bisa ditempuh dari perangkat terkunci, anggap ini insiden P0,
3. jangan biarkan admin menebak-nebak tombol atau kombinasi acak.

Status real saat ini:
- kasus ini sudah terbukti berisiko membuat operator buntu,
- jadi teks `Proteksi Wajib Aktif` harus dianggap alarm operasional, bukan sekadar peringatan biasa.

### C. Jika layar menampilkan lock biasa tetapi setelah standby perangkat bebas
Artinya lock tidak persisten.

Langkah:
1. catat bahwa masalah terjadi setelah screen off atau standby,
2. perangkat jangan dijadikan contoh perangkat siap produksi,
3. laporkan sebagai bug enforcement tingkat kritis.

### Aturan penting
Jika recovery tidak jelas dalam 2 sampai 3 menit:
- jangan terus coba-coba,
- hentikan pengujian perangkat itu,
- eskalasi ke tim teknis inti.

---

## SOP Saat Koordinat Tidak Sinkron

### Gejala
Admin sudah mengubah koordinat sekolah, tetapi APK masih membaca jarak lama.

### Langkah cek
1. cek apakah jadwal sekolah di APK sudah ikut berubah atau belum,
2. cek apakah APK membaca koordinat baru setelah dibuka ulang,
3. cek apakah jarak bergerak mendekati kondisi nyata,
4. cek apakah sumber koordinat di admin dan APK benar-benar sama.

### Keputusan
- jika jam sinkron tetapi jarak tidak sinkron: fokus audit jalur geofence atau mirror koordinat,
- jika keduanya tidak sinkron: fokus audit boundary backend atau listener config.

### Risiko
Kasus ini berbahaya karena admin melihat dashboard benar, tetapi HP siswa tetap memakai data lama.

---

## SOP Saat Device Binding Bermasalah

### Gejala
Siswa masih bisa login walau seharusnya binding belum direset.

### Langkah cek
1. pastikan pengujian dilakukan di HP yang berbeda, bukan HP yang sama,
2. cek apakah binding tersimpan di server,
3. cek apakah admin benar-benar menekan reset binding,
4. cek apakah sesi lama masih aktif di perangkat asal.

### Aturan interpretasi
- jika HP yang dipakai masih sama, login ulang belum tentu bug,
- jika HP berbeda tetap bisa masuk tanpa reset, itu bug binding dan harus diprioritaskan.

---

## SOP Saat Accessibility Mati

### Gejala
Muncul pesan `Proteksi Wajib Aktif`.

### Langkah
1. anggap ini insiden proteksi kritis,
2. cek apakah operator bisa masuk ke menu aksesibilitas secara sah,
3. jika ya, aktifkan `EduLock Protection`,
4. setelah aktif, ulangi uji Home dan buka aplikasi lain,
5. jika tidak ada jalur masuk ke aksesibilitas dan HP terkunci penuh, catat sebagai blocker operasional.

### Keputusan
Jika kasus ini muncul di banyak HP, rollout harus ditahan.

---

## SOP Saat Standby Membocorkan Lock

### Gejala
Perangkat semula terkunci, lalu setelah layar mati atau standby perangkat bisa dipakai normal.

### Status
Ini harus dianggap bug P0.

### Alasan
Karena siswa cukup memanfaatkan kebiasaan normal:
- mematikan layar,
- menyalakan lagi,
- lalu lolos dari proteksi.

### Tindakan
1. hentikan rollout pada varian build tersebut,
2. tandai perangkat dan versi build,
3. kirim ke tim teknis untuk audit jalur:
   - screen on,
   - user present,
   - relock setelah wake,
   - persistensi overlay atau kiosk.

---

## SOP Saat Emergency Unlock Gagal

### Gejala
Jalur emergency unlock tidak bisa dipakai saat HP sudah benar-benar terkunci.

### Status
Ini juga P0.

### Tindakan
1. jangan menyalahkan operator lebih dulu,
2. cek apakah jalur yang dipakai memang jalur darurat yang benar,
3. cek apakah pola password atau trigger emergency memang konsisten,
4. jika tidak konsisten, catat sebagai blocker untuk rollout.

Status real saat ini:
- trigger dan pola darurat belum boleh dianggap recovery final,
- sehingga semua panduan internal harus menyebut ini sebagai `jalur yang ada di kode tetapi belum lolos verifikasi lapangan`.

### Aturan keras
Sistem lock tanpa jalur darurat yang pasti tidak boleh dirilis massal.

---

## Klasifikasi Prioritas Insiden

### P0
Bug yang bisa menyebabkan kepanikan massal atau perangkat tidak bisa dipulihkan dengan jelas.

Contoh:
- HP terkunci total tanpa recovery pasti,
- lock bocor setelah standby,
- siswa bebas keluar saat seharusnya terkunci,
- emergency unlock tidak konsisten,
- accessibility mati menyebabkan deadlock.

### P1
Bug berat tetapi masih ada workaround.

Contoh:
- koordinat sinkron lambat,
- jadwal baru terbaca setelah buka ulang,
- binding terasa tidak tegas pada skenario tertentu.

### P2
Bug yang mengganggu kenyamanan tetapi belum menggagalkan operasional inti.

Contoh:
- tampilan status tidak update cepat,
- informasi di dashboard kurang jelas,
- nama APK membingungkan operator.

---

## Protokol Eskalasi

### Jika insiden terjadi di 1 perangkat
- tahan pada perangkat itu,
- dokumentasikan,
- jangan langsung generalisasi ke semua perangkat.

### Jika insiden terjadi di 2 sampai 5 perangkat sejenis
- hentikan rollout ke brand atau tipe itu,
- lakukan audit teknis terarah.

### Jika insiden terjadi lintas banyak perangkat
- hentikan rollout,
- keluarkan status internal: belum aman produksi,
- fokus hanya pada penutupan bug P0.

---

## Format Laporan Insiden Lapangan

Setiap laporan wajib memuat:
- tanggal dan jam kejadian,
- nama siswa atau kode perangkat,
- merek dan tipe HP,
- versi Android,
- nama APK EduLock yang dipakai,
- kondisi jam sekolah,
- kondisi lokasi,
- langkah yang dilakukan sebelum insiden,
- apa yang tampil di layar,
- apakah HP bisa pulih sendiri,
- apakah jalur darurat berhasil atau gagal.

Tambahan yang sangat membantu:
- screenshot,
- video singkat,
- urutan ketukan atau tindakan terakhir,
- apakah kejadian berulang setelah restart atau standby.

---

## Checklist Keputusan Rollout

Sebelum menyatakan siap massal, tim wajib menjawab:
- apakah lock saat keluar aplikasi sudah konsisten,
- apakah standby tidak membocorkan lock,
- apakah recovery saat accessibility mati jelas,
- apakah emergency unlock pasti berhasil di perangkat nyata,
- apakah sinkron jam dan koordinat stabil,
- apakah admin sekolah bisa menjalankan SOP tanpa bantuan developer setiap saat.

Jika satu jawaban masih `belum`, maka status sistem tetap:
- belum siap rollout massal.

---

## Rekomendasi Operasional Saat Ini

Berdasarkan temuan lapangan yang sudah muncul:
- jangan rollout ke ratusan siswa dulu,
- anggap sistem masih pada fase hardening,
- gunakan pilot kecil,
- tutup bug P0 satu per satu,
- pastikan SOP ini dipahami operator sebelum APK dipasang lagi,
- dan jangan menulis jalur recovery sebagai `aman` sebelum benar-benar lolos uji perangkat nyata.

---

## Dokumen Pendamping Yang Harus Dibaca Bersama

Untuk melengkapi SOP ini, baca juga:
- `panduan pemasangan lapangan edulock.md`
- `matriks-uji-lapangan-penguncian-edulock.md`
- `spesifikasi-lockstatemanager-edulock.md`
- `progres file dan rencana tindak lanjut.md`

---

## Penutup

Target dokumen ini bukan membuat EduLock terlihat sempurna.
Targetnya adalah:
- membuat tim tidak panik,
- membuat admin tahu langkah yang benar,
- membuat bug cepat dikenali,
- dan memastikan aplikasi lock seperti EduLock tidak dijalankan secara sembrono di lapangan.
