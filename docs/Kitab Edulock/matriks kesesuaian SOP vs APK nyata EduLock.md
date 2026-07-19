# Matriks Kesesuaian SOP vs APK Nyata EduLock

## Tujuan
Dokumen ini menjadi jembatan antara:
- aturan yang ingin ditulis di SOP,
- perilaku yang tertanam di kode,
- dan hasil uji nyata di perangkat.

Dokumen ini wajib dipakai sebelum:
- menyatakan sebuah fitur siap operasional,
- menulis instruksi tetap untuk admin sekolah,
- atau memutuskan rollout massal.

Aturan baca:
- `Status di Kode` menjawab apakah perilaku itu memang ditanam di aplikasi,
- `Status Uji Nyata` menjawab apakah perilaku itu benar-benar terjadi saat diuji,
- `Layak Operasional` hanya boleh `Ya` jika perilaku itu tidak sekadar ada di kode, tetapi juga lolos uji lapangan.

---

## Skala Penilaian

### Status di Kode
- `Ada`: perilaku atau jalur tersebut memang tertanam di source code
- `Sebagian`: ada, tetapi belum utuh atau masih bergantung kondisi lain
- `Tidak jelas`: belum bisa dinyatakan tegas dari bukti yang ada

### Status Uji Nyata
- `Lolos`: sudah berhasil pada pengujian nyata
- `Gagal`: sudah diuji dan terbukti tidak sesuai
- `Belum stabil`: pernah berhasil atau desainnya benar, tetapi perilakunya belum konsisten
- `Belum diuji`: belum ada bukti lapangan yang cukup

### Layak Operasional
- `Ya`: aman dijadikan pegangan admin lapangan
- `Tidak`: belum boleh dijadikan SOP tetap

---

## Matriks Utama

| No | Aturan SOP / Klaim Operasional | Status di Kode | Status Uji Nyata | Layak Operasional | Catatan |
| --- | --- | --- | --- | --- | --- |
| 1 | APK membaca jam masuk dan pulang sesuai admin | Ada | Lolos | Ya | Sudah terbukti dari uji perubahan jadwal per hari aktif |
| 2 | APK membaca koordinat sekolah terbaru dari admin | Ada | Lolos | Ya | Setelah patch sinkron koordinat, jarak sudah terbaca benar |
| 3 | Dashboard menampilkan status lokasi sesuai kondisi nyata | Ada | Lolos | Ya | Status `Di Area Sekolah` dan jarak dekat sudah terbukti tampil benar |
| 4 | Saat masih jam sekolah dan di area sekolah, siswa tidak boleh bebas membuka aplikasi lain | Ada | Gagal | Tidak | Dari uji nyata, siswa masih bisa bebas keluar ke aplikasi lain |
| 5 | Lock tetap bertahan setelah layar mati lalu hidup lagi | Sebagian | Gagal | Tidak | Terbukti bocor setelah standby; ini bug P0 |
| 6 | Jalur emergency unlock bisa dipakai operator saat perangkat terkunci | Ada | Gagal | Tidak | Formula ada di kode, tetapi pengujian nyata gagal dengan `password salah` |
| 7 | Pesan `Proteksi Wajib Aktif` masih menyisakan jalur recovery yang jelas untuk operator | Sebagian | Gagal | Tidak | Kondisi ini terbukti membuat operator buntu saat perangkat terkunci |
| 8 | Device binding mencegah akun dipakai di perangkat lain tanpa reset admin | Ada | Belum stabil | Tidak | Perlu dibedakan jelas antara HP sama dan HP berbeda; belum layak dijadikan klaim final |
| 9 | Sinkron konfigurasi EduLock berjalan realtime tanpa perlu reinstall APK | Ada | Belum stabil | Tidak | Jam dan koordinat sudah membaik, tetapi stabilitas umum masih perlu pembuktian lebih luas |
| 10 | Admin sekolah bisa mengandalkan SOP tanpa bantuan developer saat insiden kritis | Sebagian | Gagal | Tidak | Recovery kritis belum cukup deterministik |
| 11 | Sistem layak rollout massal ke ratusan siswa | Sebagian | Gagal | Tidak | Masih ada blocker P0 pada enforcement dan recovery |

---

## Matriks Recovery Kritis

| Skenario | Status di Kode | Status Uji Nyata | Layak Operasional | Keputusan |
| --- | --- | --- | --- | --- |
| Siswa keluar ke app lain sebelum jam pulang | Ada | Gagal | Tidak | Harus dipatch sebelum pilot besar |
| HP masuk standby lalu dinyalakan lagi | Sebagian | Gagal | Tidak | Blocker P0 |
| Accessibility mati lalu muncul `Proteksi Wajib Aktif` | Ada | Gagal | Tidak | Butuh jalur recovery yang lebih tegas |
| Emergency unlock via `Mode Darurat` | Ada | Gagal | Tidak | Jangan ditulis sebagai jalur yang sudah aman |
| Admin butuh membuka perangkat saat insiden lapangan | Sebagian | Belum stabil | Tidak | Belum aman untuk skala massal |

---

## Aturan Penulisan SOP Berdasarkan Matriks Ini

### Boleh ditulis sebagai aturan tetap
- jam sekolah terbaca dari admin,
- koordinat sekolah bisa tersinkron ke APK,
- dashboard bisa menampilkan status lokasi sesuai kondisi nyata.

### Harus ditulis sebagai `belum reliabel`
- jalur emergency unlock,
- recovery saat `Proteksi Wajib Aktif`,
- binding perangkat sebagai klaim operasional final,
- sinkronisasi realtime sebagai klaim umum di semua kondisi perangkat.

### Harus ditulis sebagai `blocker rollout`
- siswa masih bisa bebas keluar ke aplikasi lain,
- lock bocor setelah standby,
- recovery kritis belum bisa dijalankan operator dengan pasti.

---

## Keputusan Operasional Saat Ini

Berdasarkan matriks ini, status EduLock saat ini adalah:
- `siap untuk hardening lanjutan`,
- `siap untuk uji terbatas yang sangat terkontrol`,
- `belum siap untuk rollout massal`.

Alasan utama:
- enforcement inti belum konsisten,
- recovery kritis belum deterministik,
- SOP belum bisa dijalankan penuh tanpa bantuan developer.

---

## Prioritas Perbaikan Berdasarkan Matriks

### P0
- pastikan siswa tidak bisa bebas keluar ke aplikasi lain saat masih jam sekolah,
- pastikan lock tidak bocor setelah standby,
- pastikan operator punya recovery yang pasti saat `Proteksi Wajib Aktif`,
- pastikan emergency unlock benar-benar lolos uji nyata.

### P1
- rapikan device binding sampai perilakunya tegas dan mudah dijelaskan,
- stabilkan sinkronisasi config agar tidak menimbulkan salah persepsi realtime,
- sederhanakan jalur recovery untuk admin sekolah.

### P2
- rapikan pesan status di UI,
- rapikan nama build APK agar tidak membingungkan operator,
- buat ringkasan SOP 1 halaman untuk admin lapangan.

---

## Cara Memperbarui Dokumen Ini

Setiap ada temuan baru, perbarui minimal kolom:
- `Status Uji Nyata`
- `Layak Operasional`
- `Catatan`

Jika sebuah aturan berubah dari `Gagal` menjadi `Lolos`, maka:
1. perbarui matriks ini,
2. revisi SOP terkait,
3. tandai versi APK yang sudah lolos,
4. baru pertimbangkan perluasan pilot atau rollout.

---

## Penutup

Dokumen ini sengaja dibuat jujur, bukan nyaman.
Tujuannya agar tim tidak terjebak mengira:
- fitur aman hanya karena ada di kode,
- recovery aman hanya karena pernah direncanakan,
- atau sistem siap massal hanya karena beberapa bagian dashboard sudah terlihat benar.

Untuk EduLock, yang boleh dipercaya adalah:
- perilaku yang tertanam di aplikasi,
- lalu lolos di perangkat nyata,
- lalu bisa dijalankan operator tanpa panik.
