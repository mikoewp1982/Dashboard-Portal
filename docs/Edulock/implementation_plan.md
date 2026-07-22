# Rancangan Teknis: Fitur "Nagging Alarm" (Alarm Gangguan)
**Solusi Elegan & Menyebalkan untuk Siswa yang Membiarkan Pet-nya Mati**

Berbeda dengan *Hard Lock*, fitur ini dirancang murni untuk **mengganggu kenyamanan mental** siswa saat mereka menggunakan HP (bermain game, media sosial, dll) tanpa memblokir fungsi esensial dari HP tersebut. Selama status Pet mereka "DEAD" (Mati), HP mereka tidak akan pernah tenang!

> [!TIP]
> ## User Review Required
> Strategi ini jauh lebih aman secara hukum karena kita tidak mengambil alih HP siswa secara paksa. Namun, pastikan interval waktu (misalnya setiap 15 menit) sudah dirasa pas, tidak terlalu cepat tapi cukup membuat jengkel.

## ❓ Open Questions (Pertanyaan Terbuka untuk Anda)
1. **Interval Waktu**: Apakah interval **15 menit** dirasa pas? (Jika terlalu cepat, misalnya 1 menit, HP bisa terkesan *hang/error*. 15 menit adalah standar yang menyebalkan jika mereka sedang *push rank* game online).
2. **Suara Alarm**: Apakah Anda setuju kita menggunakan *ringtone* alarm bawaan sistem HP dengan volume maksimal saat pop-up ini muncul?
3. **Jam Operasional Alarm**: Apakah alarm ini aktif **24 jam penuh** selama Pet mati, atau hanya aktif **di luar jam sekolah** (karena kalau di sekolah mereka sudah ditangani oleh EduLock)?

---

## 🛠️ Proposed Changes (Rancangan Teknis)

Kita akan memodifikasi aplikasi **GAS Siswa** (`native-mobile-gas`) untuk mengintegrasikan sistem alarm internal menggunakan *Android AlarmManager* dan *FullScreenIntent*.

### 1. File Manajer & Komponen Baru (Android Components)
Untuk merealisasikan interupsi layar penuh, kita butuh sebuah *Activity* khusus dan *Receiver*.
* **[NEW] `NaggingAlarmManager.kt`**:
  * Kelas *Helper* untuk menjadwalkan (`schedule`) atau membatalkan (`cancel`) alarm setiap 15 menit.
  * Menggunakan `AlarmManager.setExactAndAllowWhileIdle` agar alarm tetap berbunyi walaupun layar sedang mati.
* **[NEW] `NaggingAlarmReceiver.kt`**:
  * Kelas `BroadcastReceiver` yang bertugas menangkap sinyal waktu dari `AlarmManager` dan meluncurkan *Activity* peringatan layar penuh.
* **[NEW] `NaggingAlarmActivity.kt`**:
  * Sebuah tampilan UI layar penuh warna **MERAH TERANG** berlogo Pet Tengkorak (Mati).
  * Teks raksasa: **"PET ANDA MATI! KEDISIPLINAN ANDA BURUK! Segera temui Guru BK!"**
  * HP akan bergetar (*Vibrate*) dan membunyikan alarm keras.
  * *Tombol Back (Kembali) sengaja dinonaktifkan.* Siswa harus menekan tombol **"Tutup Sementara (15 Menit)"** yang muncul dengan *delay* (misal setelah 5 detik) agar mereka benar-benar membaca pesannya.

### 2. Modifikasi *Virtual Pet Logic*
Kita harus menyuntikkan pemicu alarm ini ke dalam otak *Virtual Pet*.
* **[MODIFY] `VirtualPetViewModel.kt`**:
  * Di dalam blok logika yang menentukan `newStatus`:
    * Jika `newStatus == "DEAD"`, panggil fungsi `NaggingAlarmManager.startAlarm()`.
    * Jika `newStatus == "HAPPY/SICK/SAD"` (berhasil di-revive), panggil fungsi `NaggingAlarmManager.cancelAlarm()` agar HP mereka kembali normal.

### 3. Modifikasi Manifest (Izin Akses Android)
Agar Android mengizinkan aplikasi kita menimpa layar aplikasi lain (seperti menimpa game yang sedang dimainkan), kita butuh izin khusus.
* **[MODIFY] `AndroidManifest.xml`**:
  * Menambahkan `<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />`
  * Menambahkan `<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />`
  * Menambahkan `<uses-permission android:name="android.permission.VIBRATE" />`

---

## 🧪 Verification Plan (Rencana Pengujian)
### Pengujian Manual (Simulasi Kematian Pet)
1. **Skenario Trigger**: Sengaja membiarkan `lowestVital` turun ke angka 0. Memastikan aplikasi langsung mendaftarkan alarm 15 menit ke depan.
2. **Skenario Interupsi (Background)**: Siswa menekan tombol *Home*, lalu membuka YouTube. Memastikan dalam 15 menit, layar YouTube langsung tertimpa oleh `NaggingAlarmActivity` berwarna merah dengan getaran.
3. **Skenario Penyembuhan (Cancel)**: Admin menekan "Revive" di Web. Memastikan status Pet kembali hidup dan semua jadwal alarm otomatis dibatalkan secara permanen oleh sistem.

---
**Bagaimana menurut Anda? Jika ini sudah sejalan dengan visi "hukuman mental" yang Anda inginkan, silakan jawab 3 pertanyaan di atas, dan kita bisa menjadikannya prioritas setelah rilis APK hari ini!**
