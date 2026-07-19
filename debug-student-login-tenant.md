# Debug Session: student-login-tenant
- **Status**: [OPEN]
- **Issue**: APK GAS Siswa masih gagal login dengan pesan "Data profil siswa tidak ditemukan di sekolah ini." meskipun data siswa `gue / 123456` sudah ada di tenant `gas/schools/smpn_3_pacet/students`.
- **Debug Server**: http://192.168.1.122:7777/event
- **Log File**: `.dbg/trae-debug-log-student-login-tenant.ndjson`

## Reproduction Steps
1. Install APK GAS Siswa yang sedang diuji di perangkat.
2. Isi `Kode Sekolah / NPSN` dengan `20555784`.
3. Isi `Username (Nama Siswa)` dengan `gue`.
4. Isi `Password (NISN)` dengan `123456`.
5. Tekan `Masuk`.
6. Amati toast/error yang muncul.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | APK yang terpasang masih build lama dan belum membawa patch lookup `username` siswa | High | Low | Pending |
| B | Record siswa ditemukan di query, tetapi gagal pada filter `matchesRequestedSchool(...)` karena field tenant runtime berbeda | High | Low | Pending |
| C | APK membaca node/path berbeda dari tenant yang sudah dipatch di RTDB live | Medium | Medium | Pending |
| D | Bind siswa gagal setelah record ditemukan, misalnya di device binding atau validasi credential | Medium | Low | Pending |
| E | Flavor/build `siswa` memakai source set/config berbeda dari file `LoginScreen.kt` yang diaudit | Medium | Medium | Pending |

## Log Evidence
- Screenshot terbaru menunjukkan error berubah menjadi `Login gagal Auth: This operation is restricted to administrators only.`
- Verifikasi REST ke Firebase Identity Toolkit dengan API key `dashboard-portal-179f7` awalnya gagal dengan `ADMIN_ONLY_OPERATION`.
- GET config admin project `dashboard-portal-179f7` menunjukkan blok `signIn.anonymous` belum aktif.
- Provider Anonymous kemudian diaktifkan pada config project `dashboard-portal-179f7`, dan verifikasi REST `accounts:signUp` sesudah patch berhasil membuat akun anonymous.
- `app/google-services.json` APK menunjuk ke:
  - `project_id = satu-pintu-gas-dev`
  - `firebase_url = https://satu-pintu-gas-dev-default-rtdb.asia-southeast1.firebasedatabase.app`
- Web/admin repo menunjuk ke:
  - `project_id = dashboard-portal-179f7`
  - `databaseURL = https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app`
- Query langsung ke RTDB milik APK pada path `gas/schools/smpn_3_pacet/students` mengembalikan `null`.
- `gradle.properties` mobile membatasi project yang diizinkan ke `satupintu.allowedFirebaseProjectIds=satu-pintu-gas-dev`.
- Setelah APK diarahkan ke `dashboard-portal-179f7`, query RTDB dengan token anonymous yang valid ke `gas/schools/smpn_3_pacet/students` berhasil mengembalikan record siswa `gue / 123456`.
- Registry sekolah aktif ada di `schools/smpn_3_pacet`, sementara `schools/20555784` memang `null`, sehingga flow login harus mengandalkan resolusi alias `npsn -> schoolId`.
- Write RTDB saat login siswa tetap ditolak karena rule aktif hanya mengizinkan write untuk `admin/super_admin`, sehingga update `deviceId` dari APK menghasilkan `Permission denied`.
- Sudah dibuat Cloud Function `registerStudentDevice` sebagai jalur aman untuk device binding server-side, tetapi deploy ditolak karena project `dashboard-portal-179f7` masih plan Spark dan Firebase meminta upgrade ke Blaze untuk mengaktifkan `artifactregistry/cloudfunctions`.
- APK debug dipatch dengan fallback lokal: bila write RTDB ditolak dan backend function belum tersedia, login siswa tetap dilanjutkan secara lokal untuk menghindari blokir login total.

## Verification Conclusion
- Root cause berlapis:
  1. APK dan web sempat mengarah ke Firebase project yang berbeda.
  2. Setelah APK diarahkan ke project web, Anonymous Auth di `dashboard-portal-179f7` ternyata masih nonaktif sehingga `signInAnonymously()` gagal dengan `ADMIN_ONLY_OPERATION`.
- Perbaikan yang sudah diterapkan:
  1. `google-services.json` dan allowlist Firebase APK diarahkan ke `dashboard-portal-179f7`.
  2. Provider Anonymous di project `dashboard-portal-179f7` diaktifkan.
- Status terkini:
  - blocker Auth sudah terbuka;
  - blocker write device binding di server belum bisa diselesaikan penuh tanpa upgrade Blaze/deploy function;
  - APK debug terbaru sudah membawa fallback lokal agar login siswa bisa lanjut meski server-side binding sementara belum aktif.

## Instrumentation Points
- `A`: masuk ke flow login siswa + identitas build/flavor
- `B`: hasil resolusi alias tenant dari input sekolah/NPSN
- `C`: hasil query `nisn` / `username` / `name` beserta path match
- `D`: jalur `bindStudent` (masuk, reject tenant, reject credential, reject device, success)
- `E`: semua kandidat lookup siswa habis tetapi tidak ada record yang lolos
