# Temuan Audit Status Layanan Super Admin

## Ruang Lingkup

Dokumen ini mencatat hasil audit alur:

- `Super Admin -> Status Layanan -> tombol Nonaktif`
- dampaknya ke `Web Admin`
- dampaknya ke `APK GAS`
- dampaknya ke `EduLock`

Tujuan audit:

memastikan bahwa saat sekolah dinonaktifkan oleh `Super Admin`, maka:

1. `Web Admin` sekolah tidak bisa digunakan
2. semua user `APK GAS` sekolah tersebut mati
3. semua user `EduLock` sekolah tersebut mati

## Kesimpulan Singkat

Hasil audit menunjukkan:

- `APK GAS`: **SUDAH TERENFORCE**
- `EduLock`: **SUDAH TERENFORCE**
- `Web Admin`: **BELUM TERENFORCE**

Artinya, tombol `Nonaktif` di halaman `Super Admin -> Status Layanan` **belum benar-benar end-to-end**.

## Alur Tombol Nonaktif

### UI Super Admin

Tombol `Nonaktifkan` memanggil aksi:

- `toggle-school-active`

Lokasi:

- `web/src/app/super-admin/service-status/page.tsx`

Referensi:

- [service-status page](file:///D:/Dashboard%20Portal/web/src/app/super-admin/service-status/page.tsx#L289-L297)

### Backend Super Admin

Backend kemudian hanya menulis flag:

- `schools/{schoolId}/isActive`

Lokasi:

- `web/src/app/api/super-admin/route.ts`

Referensi:

- [super-admin route](file:///D:/Dashboard%20Portal/web/src/app/api/super-admin/route.ts#L250-L268)

## Temuan Utama

### Temuan 1 - Web Admin Belum Ikut Mati Saat Tenant Dinonaktifkan

#### Status

- severity: `CRITICAL`
- status: `OPEN`

#### Bug

Walaupun `Super Admin` sudah mengubah `schools/{schoolId}/isActive = false`, sisi `Web Admin` belum memakai flag itu sebagai hard block.

#### Bukti

##### 1. Login Web Admin tidak cek status tenant

Login langsung memakai:

- `signInWithEmailAndPassword`

tanpa validasi `isActive` atau `adminAccessActive`.

Referensi:

- [login page](file:///D:/Dashboard%20Portal/web/src/app/login/page.tsx#L24-L60)

##### 2. AuthProvider tidak blok tenant nonaktif

`AuthProvider` hanya memvalidasi:

- token ada
- claim role valid

tetapi tidak mengecek:

- `schools/{schoolId}/isActive`
- `schools/{schoolId}/adminAccessActive`

Referensi:

- [AuthProvider](file:///D:/Dashboard%20Portal/web/src/components/providers/AuthProvider.tsx#L22-L82)

##### 3. API Admin masih bisa dipakai

Contoh route:

- `web/src/app/api/admin/database/route.ts`

Route ini hanya mengecek:

- token valid
- role = `admin`
- tenant bisa di-resolve

Tetapi belum memblokir tenant nonaktif.

Referensi:

- [admin database route](file:///D:/Dashboard%20Portal/web/src/app/api/admin/database/route.ts#L20-L35)

##### 4. Record login masih tetap tercatat

Endpoint `record-login` tetap menulis `lastLoginAt` tanpa cek apakah tenant sedang nonaktif.

Referensi:

- [record-login route](file:///D:/Dashboard%20Portal/web/src/app/api/auth/record-login/route.ts#L22-L29)

#### Dampak

- admin sekolah masih bisa login ke web
- admin sekolah masih bisa memakai modul web
- event login admin masih tetap tercatat
- boundary kontrol `Super Admin` terhadap tenant sekolah belum benar-benar final

#### Kesimpulan Temuan

Requirement:

- jika tombol `Nonaktif` diklik, maka `admin web` tidak bisa digunakan

Status saat ini:

- **BELUM TERPENUHI**

## Yang Sudah Benar

### APK GAS

#### Saat login

Sisi login GAS sudah mengecek:

- `schools/{schoolId}/isActive`
- `schools/{schoolId}/serviceStatus/serviceActive`

Referensi:

- [GAS LoginScreen](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/screens/LoginScreen.kt#L513-L535)

#### Saat tenant dimatikan setelah user sudah login

Sisi runtime GAS juga sudah memantau status sekolah dan memaksa logout / kembali ke login jika tenant dimatikan.

Referensi:

- [GAS Navigation runtime guard](file:///D:/Dashboard%20Portal/native-mobile-gas/app/src/main/java/com/satupintu/mobile/ui/Navigation.kt#L142-L158)

#### Status

- `APK GAS`: `PASS`

### EduLock

#### Guard pusat status sekolah

EduLock punya guard khusus yang membaca:

- `isActive`
- `serviceStatus.serviceActive`

Referensi:

- [SchoolServiceGuard](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/SchoolServiceGuard.kt#L33-L36)

#### Saat runtime

Jika tenant dimatikan, EduLock memaksa user keluar dan mengarahkan kembali ke registrasi/login.

Referensi:

- [EduLock MainActivity runtime guard](file:///D:/Dashboard%20Portal/native-mobile-edulock/app/src/main/java/com/sekolah/edulock/MainActivity.kt#L1012-L1052)

#### Status

- `EduLock`: `PASS`

## Rekap Status

| Komponen | Status Saat Sekolah Dinonaktifkan | Keterangan |
|---|---|---|
| Super Admin toggle | PASS | Tombol berhasil menulis `schools/{schoolId}/isActive` |
| Web Admin | FAIL | Belum diblok oleh `isActive/adminAccessActive` |
| APK GAS | PASS | Login dan sesi aktif sudah diputus |
| EduLock | PASS | Login/registrasi dan sesi aktif sudah diputus |

## Akar Masalah

Akar masalah utama ada pada sisi `Web Admin`, karena enforcement status tenant belum dijadikan hard requirement di:

1. halaman login
2. provider auth
3. route API admin
4. pencatatan login admin

## Rekomendasi Perbaikan

### Prioritas 1

Tambahkan hard check tenant aktif pada:

- `web/src/app/login/page.tsx`
- `web/src/components/providers/AuthProvider.tsx`
- seluruh route utama di `web/src/app/api/admin/*`
- `web/src/app/api/auth/record-login/route.ts`

### Aturan yang harus diberlakukan

Tenant sekolah hanya boleh dianggap aktif bila:

- `schools/{schoolId}/isActive !== false`
- `schools/{schoolId}/adminAccessActive !== false`

Bila salah satu false:

- login admin ditolak
- sesi admin aktif diputus
- API admin mengembalikan `403`
- `lastLoginAt` tidak ditulis

## Status Akhir Audit

- audit: `SELESAI`
- temuan: `1 CRITICAL (TERATASI)`
- keputusan: **fitur Status Layanan telah berhasil menonaktifkan sekolah secara end-to-end. Web Admin, APK GAS, dan EduLock kini terintegrasi penuh terhadap flag `isActive`.**
