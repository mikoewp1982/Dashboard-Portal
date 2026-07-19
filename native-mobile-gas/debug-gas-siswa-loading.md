# Debug Session: GAS Siswa Loading [OPEN]

## Ringkasan
- Session ID: `gas-siswa-loading`
- Tanggal: 2026-07-09
- Fokus: investigasi runtime via USB debugging untuk menu GAS Siswa yang muter terus selain Lentera Digital dan Tools.
- Batasan: tidak mengubah logika bisnis selama fase investigasi awal.

## Gejala
- Pada APK GAS Siswa versi terbaru yang dipakai user, hampir semua menu selain Lentera Digital dan Tools tidak bisa dibuka normal dan hanya loading terus.

## Hipotesis Awal
1. Listener Firebase pada menu siswa tidak pernah mengirim emit pertama sehingga state `isLoading` tidak pernah berubah menjadi `false`.
2. `schoolId`, `studentId`, atau alias identitas siswa pada session tidak sinkron dengan data backend sehingga query scoped gagal mengembalikan data yang cocok.
3. Ada error runtime `FirebaseDatabase`, timeout jaringan, atau `permission denied` yang tidak dipantulkan ke UI dan berakhir sebagai spinner abadi.
4. Salah satu flow dalam kombinasi realtime (`combine` / multi-listener) macet sehingga screen menunggu selamanya.
5. APK yang terpasang di device berbeda dari source build `native-mobile` versi `vc1028`, sehingga perilaku runtime tidak sama dengan source yang sedang diaudit.

## Rencana Investigasi
1. Verifikasi koneksi `adb` dan device target.
2. Identifikasi package name aplikasi GAS Siswa yang terpasang.
3. Bersihkan logcat dan reproduksi satu menu bermasalah per sesi.
4. Kumpulkan bukti runtime dari `adb logcat`.
5. Simpulkan hipotesis yang terkonfirmasi atau gugur tanpa melakukan patch.

## Bukti Runtime
- Device terbaca normal via `adb devices`: `92823913`.
- Package terpasang terverifikasi: `com.satupintu.mobile`.
- Versi terpasang di device:
  - `versionCode=1028`
  - `versionName=1.0.11-siswa`
  - `lastUpdateTime=2026-07-09 01:04:28`
- Cold start aplikasi dari `adb shell am start -W -n com.satupintu.mobile/com.satupintu.mobile.MainActivity`:
  - `WaitTime: 143`
- Log cold start yang tertangkap:
  - Firebase init sukses.
  - Tidak ada `FATAL EXCEPTION`.
  - Tidak ada `ANR`.
  - Tidak ada `Permission denied` dari Firebase pada sesi ini.
  - Ada warning Realtime Database:
    - `Using an unspecified index ... add ".indexOn": "nisn" at students`

## Status Hipotesis
1. Listener Firebase tidak emit pertama -> **belum terbukti pada runtime saat ini**.
2. `schoolId` / identitas siswa mismatch -> **belum terbukti pada runtime saat ini**.
3. Error runtime Firebase / timeout / permission denied -> **tidak terbukti pada sesi ini**.
4. Salah satu flow kombinasi macet -> **tidak berhasil direproduksi pada sesi ini**.
5. APK berbeda dari source -> **gugur**, karena device memakai `com.satupintu.mobile` versi `1.0.11-siswa` `vc1028`.

## Kesimpulan Sementara
- Masalah “semua menu muter terus” tidak berhasil direproduksi ulang saat sesi USB debugging.
- Dari pengujian lapangan, menu yang sebelumnya dicurigai (`7 KAIH`) ternyata bisa terbuka, hanya buka pertama terasa lebih lama.
- Bukti runtime paling relevan saat ini mengarah ke bottleneck query Firebase Realtime Database pada node `students` tanpa index `nisn`, yang dapat menambah latensi cold start atau pembukaan awal fitur yang perlu resolusi identitas siswa.
