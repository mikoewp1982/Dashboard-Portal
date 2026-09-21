# ULTRON Bug Hunt — APK EduLock Siswa V2 (1.3.55 / 81)

Tanggal audit: 2026-09-21. Sifat: audit baca-kode saja, tanpa HP/perangkat, tanpa mengubah source.
Lingkup: flavor `student` (APK `EduLock_V2`), plus file bersama `src/main` bila terbukti memengaruhi alur siswa.
Dokumen dibaca dulu: `ARSITEKTUR_SISTEM_edulock_siswa.md`, `REGRESSION_CHECKLIST.md`, `FIX_SUMMARY_2026-07-23.md`, `HANDOFF_2026-07-23.md`.
Abaikan: `scripts/node_modules`, `.gradle`, `.idea`, keystore, biner APK.

## Ringkasan

- Ditemukan 10 temuan berbasis bukti kode (baris dirujuk ke revisi saat audit). 4 prioritas Tinggi, 5 Sedang, 1 Rendah.
- Tema berulang: (a) state `presence` 30 menit bocor ke rumah, (b) fallback jadwal Sabtu + zona waktu memicu false-positive jam sekolah saat offline, (c) sisa logika "offline > 2 menit = strict" yang menurut checklist sudah dihapus total masih hidup lewat `LockStateManager`, (d) dua jalur tulis binding perangkat tidak konsisten (`device_uuid` vs `deviceId`/`device`), (e) satu jalur registrasi ulang berpotensi crash karena content-view salah.
- Tidak ada perubahan kode dilakukan. Tidak ada PoC exploit/bypass ditulis.

## Temuan berprioritas

### T1 — Jalur registrasi ulang memakai content-view yang salah (potensi crash) — Tinggi
- Gejala: pengguna terdaftar yang datanya tidak lengkap (NISN/NPSN/nama/deviceId kosong) menatap layar loading lalu aplikasi tertutup/crash, tidak kembali ke formulir registrasi.
- File+baris: `app/src/main/java/com/sekolah/edulock/RegistrationActivity.kt:40-71` (`onCreate` cabang `isRegistered` pasang `loadingView`), `258-273` (`ensureStudentSignedIn` cabang data kosong memanggil `initViews()` + `setupListeners()` langsung).
- Bukti kode: cabang `isRegistered=true`memasang `FrameLayout` loading sebagai content view, bukan `activity_registration`. Cabang gagal di `ensureStudentSignedIn` tidak memanggil `showRegistrationForm()`/`setContentView(R.layout.activity_registration)`, langsung `initViews()` (`findViewById(R.id.etNPSN)` dkk) di atas loading view sehingga hasilnya null, lalu `setupListeners()` mendaftarkan watcher di referensi null.
- Akar masalah: alur pemulihan sesi lupa mengganti content view sebelum inisialisasi form.
- Dampak: siswa terdampak (stuck/crash saat buka aplikasi); admin melihat perangkat "hilang" karena tidak pernah registrasi ulang.
- Reproduksi dari source: set `is_registered=true` dengan `nisn`/`school_npsn`/`student_name`/`device_id` salah satu kosong di `EduLockPrefs`, jalankan `RegistrationActivity`, amati cabang `ensureStudentSignedIn`.

### T2 — Tulis binding perangkat tidak konsisten: `bindAndReturn` tidak menulis `device_uuid` — Tinggi
- Gejala: status binding di dashboard (yang membaca `device_uuid`) kedaluwarsa/tidak sinkron setelah login ulang; penolakan "sudah aktif di perangkat lain" bisa memakai nilai lama.
- File+baris: `StudentAuthService.kt:351-361` (baca `device_uuid`/`deviceId`/`device`, tulis hanya `deviceId`+`device`+`lastLoginEduLock`); bandingkan `RegistrationActivity.kt:416-427` (tulis `device_uuid`+`deviceId`+`device`).
- Bukti kode: cek perangkat kedua membaca tiga kunci (`registeredDeviceId` dari `device_uuid` dulu), tetapi jalur `requestToken`/`bindAndReturn` hanya menulis dua kunci non-`device_uuid`.
- Akar masalah: dua jalur tulis binding tidak disamakan.
- Dampak: siswa bisa ditolak salah atau justru lolos dengan binding lama; admin melihat data perangkat ganda/kedaluwarsa.
- Reproduksi dari source: bandingkan isi node `gas/schools/<id>/students/<key>` setelah registrasi baru vs setelah `requestToken` (login ulang): field `device_uuid` hanya berubah pada jalur pertama.

### T3 — Fallback jadwal menganggap Sabtu sekolah (false-positive offline) — Tinggi [TERSELESAIKAN DI v1.3.57-83]
- **Status Perbaikan:** ✅ **TERSELESAIKAN & DILENGKAPI UNIT TEST (Build 83 / v1.3.57)**
- **Solusi Arsitektur:**
  1. `fallbackMap` di `SchoolScheduleManager.kt` diubah: `"sat"` dan `"sun"` default `enabled = false` (libur untuk sekolah 5 hari kerja).
  2. Diterapkan **SSOT Provenance Tagging**: path modern `school_settings/.../attendance/schedules` mencap sumber data sebagai `SOURCE_ATTENDANCE_SCHEDULES`.
  3. Path cermin legacy `schools/.../schedule/weekdays` diharamkan menimpa cache jika berstatus `SOURCE_ATTENDANCE_SCHEDULES`. Heuristik cacat jumlah kunci dicabut.
  4. Penulis liar di `MainActivity.kt` dijinakkan: Activity dilarang menulis ke cache saat sumber sudah SSOT.
  5. Ditambahkan automated unit test `SchoolScheduleManagerTest.kt` (5/5 lulus 100%).
- Gejala Asal: install baru/clear-data yang offline total pada Sabtu pagi dianggap "jam sekolah", sehingga enforcement/GPS recovery berjalan padahal seharusnya tenang.
- File+baris: `SchoolScheduleManager.kt:97-108` (`fallbackMap` `"sat" to DaySchedule(true, ...)`); pemakaian `isSchoolTime():189-206`, `isEffectiveSchoolDayToday():183-187`.
- Bukti kode: saat `weekdayScheduleJson` blank (sync pertama gagal karena offline), `getScheduleMap()` mengembalikan fallback dengan Sabtu aktif. Checklist `REGRESSION_CHECKLIST.md` bagian J4 justru mensyaratkan Sabtu offline = `isSchoolTime=false`.
- Akar masalah: default fallback Sabtu tidak selaras dengan keputusan produk/checklist.
- Dampak: siswa di rumah Sabtu pagi menerima overlay/lock yang seharusnya tidak ada; laporan admin Sabtu tercemar.
- Reproduksi dari source: kosongkan `weekday_schedule_json`, set tanggal Sabtu 08.00, panggil `isSchoolTime()` → `true` (aktual) vs `false` (diharapkan checklist).

### T4 — `presence` 30 menit bocor ke rumah setelah sticky dibersihkan — Tinggi
- Gejala: dalam ±30 menit setelah pulang, HP di rumah dengan GPS mati masih memunculkan overlay GPS/pemulihan seolah masih di sekolah.
- File+baris: `LocationMonitor.kt:257-278` (`hasSchoolPresenceIndication`: sticky `isInsideSchoolZone` ATAU geofence ENTER/DWELL 30 mnt ATAU near-school presence ATAU last-known near-school); `GpsEnableOverlay.kt:13-28` (`isRequired` memakai `shouldEnforcePresenceProtection() || isInsideSchoolZone`); `MonitoringService.kt:934-940` (hanya me-reset `isInsideSchoolZone` + `clearNearSchoolPresence`, tidak menyentuh `lastGeofenceTransition`/recency lain).
- Bukti kode: pembersih "pulang >30 menit" hanya menargetkan flag sticky, sedangkan `isRequired`/`shouldEnforcePresenceProtection` tetap `true` via `isRecentGeofenceInside(30 mnt)`.
- Akar masalah: dua sumber presence (sticky vs recency 30 mnt) tidak dibersihkan bersamaan.
- Dampak: melanggar janji "hening total di rumah"; siswa terganggu, admin menerima event GPS yang menyesatkan.
- Reproduksi dari source: set `isInsideSchoolZone=true`, `lastInsideSchoolZoneAt=now-35 mnt`, geofence ENTER 25 mnt lalu, GPS OFF, jam efektif → `GpsEnableOverlay.isRequired()` tetap `true`.

### S1 — Sisa aturan "offline > 2 menit = strict" bertentangan dengan keputusan hapus fail-safe — Sedang
- Gejala: meski proteksi admin OFF, perangkat offline > 2 menit saat jam sekolah kembali dianggap strict/kunci.
- File+baris: `LockStateManager.kt` fungsi `isStrictModeNow()` (cabang: bila `isSchoolTime()` dan `getOfflineDuration() > 2*60*1000` → `true`); `REGRESSION_CHECKLIST.md:10-14,97-108` (fail-safe offline > 2 mnt DIHAPUS TOTAL, hanya Mode Pesawat yang lockdown).
- Bukti kode: `MonitoringService.kt:3309-3327` versi service sudah dibersihkan ke "hanya airplane", tetapi `LockStateManager.isStrictModeNow()` masih memaksa strict saat offline lama.
- Akar masalah: penghapusan fail-safe tidak merata ke semua penegak keputusan.
- Dampak: siswa offline (kuota habis/WiFi putus) dikunci padahal kebijakan terbaru melarang; admin bingung karena dashboard menunjukkan proteksi OFF.
- Reproduksi dari source: proteksi OFF + `isSchoolTime=true` + `lastOnlineTimestamp=now-3 mnt` → `LockStateManager.reconcile()` menghasilkan state terkunci via `isStrictMode`.

### S2 — Whitelist aksesibilitas dinonaktifkan saat GPS mati — Sedang
- Gejala: saat GPS mati pada jam sekolah, penegakan whitelist aplikasi via aksesibilitas berhenti total (bukan diganti overlay GPS saja).
- File+baris: `AntiUninstallService.kt:106-115` (`shouldSkipWhitelist` memuat `|| gpsOff || ...` lalu `return`).
- Bukti kode: `gpsOff` dihitung dari `LocationMonitor.isGpsEnabled().not()` dan langsung menggugurkan seluruh blok whitelist di bawahnya.
- Akar masalah: kondisi darurat GPS dicampur sebagai alasan melewatkan whitelist.
- Dampak: jendela inkonsistensi penegakan; admin melihat liputan perlindungan bolong tepat saat GPS mati.
- Reproduksi dari source: GPS OFF + jam efektif + proteksi ON → event `TYPE_WINDOW_STATE_CHANGED` ke paket non-putih tidak ditegur.

### S3 — Zona waktu sekolah dari bujur + offset server rapuh saat offline — Sedang
- Gejala: jam mulai/selesai meleset 1-2 jam untuk sekolah WITA/WIT yang konfig belum tersinkron; jam perangkat yang diubah manual tetap dipakai saat offline.
- File+baris: `SchoolScheduleManager.kt:30-48` (`resolveSchoolTimeZone` dari `schoolLongitude`, default WIB bila 0; `getSchoolCalendar` = `System.currentTimeMillis()+serverTimeOffset`).
- Bukti kode: registrasi awal melaporkan lat/lon 0 (`RegistrationActivity.kt:431-438`) dan `resolveSchoolTimeZone` memetakan `lon=0` ke WIB; `serverTimeOffset` default 0 bila belum sync.
- Akar masalah: fondasi waktu bergantung pada data yang justru kosong saat paling dibutuhkan (offline/fresh-install).
- Dampak: kunci terlalu awal/terlambat; siswa/Wali protes; admin mengira jadwal salah.
- Reproduksi dari source: `schoolLongitude=0`, jadwal 07.00 WITA → `getSchoolCalendar()` memakai WIB sehingga `isSchoolTime()` salah ±1 jam.

### S4 — Sesi izin memakai jam perangkat + batas menit terpotong — Sedang
- Gejala: sesi izin bisa overrun hingga +59 detik; jendela `sessionStart`/`sessionEnd` ikut zona perangkat, bukan zona sekolah.
- File+baris: `PermissionManager.kt:90-93` (`Calendar.getInstance()` default), `440-458` (`elapsedMinutes=(now-start)/1000/60`, revoke hanya saat `isPermissionActive()` dipanggil), `463-476` (`getRemainingMinutes` pola sama).
- Bukti kode: tidak ada alarm terjadwal untuk expiry; revoke bersifat lazy. Pembulatan ke menit via pembagian integer.
- Akar masalah: expiry pasif + dua basis waktu (perangkat vs sekolah).
- Dampak: siswa mendapat <1 menit ekstra; guru melihat sesi "aktif" sedikit lebih lama; untuk lintas zona bisa beda jam.
- Reproduksi dari source: buat sesi 5 menit, panggil `isPermissionActive()` pada +5 mnt 30 dtk → masih `true`; ubah zona perangkat ±1 jam → validasi `sessionStart/End` bergeser.

### S5 — `GpsEnableOverlay.isRequired()` mahal dan berisiko churn — Sedang
- Gejala: tiap `performChecks` (±3 dtk) + tiap `requestKiosk` membangun `PreferencesManager`/`PermissionManager`/`SchoolScheduleManager`/`LocationMonitor` baru; `PermissionManager` ikut membuat referensi database.
- File+baris: `GpsEnableOverlay.kt:13-28`; pemanggil `MonitoringService.kt:2768-2787`, `LockEnforcer.kt` (`requestKiosk` guard `GpsEnableOverlay.isRequired`).
- Bukti kode: konstruktor `PermissionManager` (`PermissionManager.kt:13-18`) menyentuh `SchoolServiceGuard.database()` setiap panggilan overlay-check.
- Akar masalah: cek panas (hot path) tidak memakai instance bersama/cache.
- Dampak: boros baterai/GC, risiko ANR pada HP kentang; pada skala armada memperparah beban klien.
- Reproduksi dari source: profil alokasi selama `performChecks` berjalan 1 menit; hitung instansiasi `PermissionManager`/`LocationMonitor`.

### R1 — Watchdog 2 mnt + WorkManager 15 mnt rapuh di OEM agresif/Doze — Rendah (risiko sisa)
- Gejala: setelah disapu dari recent-apps + layar mati lama di Xiaomi/Vivo/Oppo/Transsion, enforcement kembali terlambat.
- File+baris: `WatchdogAlarmReceiver.kt:31-79` (`setAndAllowWhileIdle` satu tembakan, dijadwal ulang di `onReceive`), `KeepAliveWorker.kt:57-82` (periodik 15 mnt, `KEEP`), `BootReceiver.kt:13-44` (`startForegroundService` dari boot).
- Bukti kode: tidak ada `SCHEDULE_EXACT_ALARM`/whitelist OEM yang dijamin; `startForegroundService` dari background pada Android 12+ berisiko `ForegroundServiceStartNotAllowedException` bila tanpa pengecualian.
- Akar masalah: keterbatasan platform + OEM killer, bukan logika bisnis.
- Dampak: jeda perlindungan; admin melihat heartbeat basi.
- Reproduksi dari source: perlu HP fisik (matikan layar 30 mnt, sapu recent-apps, amati `runtimeLastServiceHeartbeatAt`).

## Yang belum bisa diverifikasi tanpa HP/perangkat

1. Geofence nyata (ENTER/DWELL/EXIT) vs mock: `GeofenceCoordinator` + `GeofenceBroadcastReceiver` butuh lokasi & Play Services lapangan.
2. Perilaku Device Admin `lockNow()` pada `onDisableRequested` di tiap OEM dan Android 13+ restricted-settings 2 langkah.
3. Kiosk/`startLockTask` tanpa device-owner (prompt pinning, tombol Home/Recent) per merek.
4. FCM TTL/wake (Master Switch 24 jam, Find Device 5 mnt) dan Doze.
5. AntiUninstall crash-loop Vivo (riwayat `HANDOFF_2026-07-23.md`) — butuh logcat fisik.
6. Kamera/QR scanner dan perbedaan transport offline (kuota medsos vs validated internet).
7. Baterai/thermal: biaya `performChecks` 3 dtk + overlay-check di HP kentang.

## Risiko tersisa

- Ketidakseragaman keputusan offline/airplane/GPS antar penegak (`MonitoringService` vs `LockStateManager` vs `AntiUninstallService`) adalah sumber false-lock/false-open terbesar bila tidak disatukan.
- Dual-write binding (`device_uuid`) dan fallback Sabtu perlu diselaraskan dengan dashboard agar data admin dapat dipercaya.
- Fondasi waktu (zona bujur + offset server) perlu fallback eksplisit saat koordinat/offset belum sync, atau enforcement jam harus fail-safe (bukan fail-lock) saat fondasi kosong.
- Kebutuhan uji lapangan: rumah vs sekolah × {online, offline biasa, GPS mati, mode pesawat} × {jam efektif, luar jam, libur} × proteksi ON/OFF, dengan screenshot dan heartbeat.

*Catatan: audit ini tidak mengubah satu pun file source/gradle/resource/tes dan tidak menginisialisasi Git, sesuai penugasan.*
