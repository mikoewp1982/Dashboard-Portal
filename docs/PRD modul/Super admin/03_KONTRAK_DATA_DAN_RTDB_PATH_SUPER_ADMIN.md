# Kontrak Data dan RTDB Path Super Admin

## 1. Tujuan Dokumen

Dokumen ini menjelaskan kontrak data utama dan path RTDB yang dipakai oleh modul **Super Admin**.

Fungsi dokumen ini:

1. menjadi acuan struktur data pusat
2. mencegah kekacauan penamaan path lintas modul
3. menjaga batas antara **Super Admin** dan **Admin Sekolah**
4. memastikan tidak ada dua sumber kebenaran untuk entitas pusat

Dokumen ini harus dibaca bersama:

- `01_PRD_SUPER_ADMIN_PORTALKITA.md`
- `02_SPESIFIKASI_TEKNIS_MENU_SUPER_ADMIN.md`

---

## 2. Prinsip Umum

Prinsip kontrak data Super Admin:

1. path pusat hanya menyimpan data tingkat pusat
2. data tenant harus stabil, tidak ambigu, dan mudah divalidasi
3. `npsn` adalah identitas sekolah tingkat pusat
4. `schoolId` adalah kunci tenant internal yang dipakai sistem
5. Super Admin tidak boleh menjadi tempat master data siswa, guru, atau OSIS sekolah
6. setiap entitas pusat harus punya **satu sumber kebenaran**

---

## 3. Batas Wilayah Data

### 3.1 Wilayah Data Super Admin

Data yang boleh ada di wilayah pusat:

- registry sekolah atau tenant
- identitas login admin sekolah tingkat pusat
- akun kepala sekolah
- konfigurasi global
- broadcast global
- sync jobs
- support requests
- log keamanan atau audit pusat
- monitoring layanan pusat

### 3.2 Wilayah Data Admin Sekolah

Data yang **bukan** wilayah Super Admin:

- siswa
- guru atau wali kelas
- petugas OSIS
- kelas paralel

Path tenant tetap berada di wilayah sekolah:

- `gas/schools/{schoolId}/students`
- `gas/schools/{schoolId}/teachers`
- `gas/schools/{schoolId}/staff`
- `gas/schools/{schoolId}/classes`

---

## 4. Daftar Path RTDB Inti Super Admin

### 4.1 Registry Tenant

**Path**

```text
schools/{schoolId}
```

**Fungsi**

Menyimpan identitas pusat setiap sekolah atau tenant.

**Contoh struktur**

```json
{
  "schoolId": "smpn_1_mojosari",
  "name": "SMPN 1 MOJOSARI",
  "district": "Mojosari",
  "npsn": "20502652",
  "authEmail": "20502652@edulock.local",
  "adminEmail": "admin@smpn1mojosari.sch.id",
  "backupEmail": "",
  "isActive": true,
  "adminAccessActive": true,
  "billing": {
    "paymentStatus": "PAID",
    "lastPaidAt": 1760000000000,
    "dueAt": 1762592000000,
    "updatedAt": 1760000000000
  },
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

**Field minimum**

- `schoolId: string`
- `name: string`
- `district: string`
- `npsn: string`
- `authEmail: string`
- `adminEmail: string`
- `backupEmail: string`
- `isActive: boolean`
- `adminAccessActive: boolean`
- `billing.paymentStatus: "PAID" | "UNPAID"`
- `billing.lastPaidAt?: number`
- `billing.dueAt?: number`
- `billing.updatedAt?: number`
- `createdAt: number`
- `updatedAt: number`

**Aturan**

1. `schoolId` harus stabil
2. `npsn` wajib unik secara logika bisnis
3. tenant nonaktif tetap boleh tersimpan, tetapi akses operasional dibatasi
4. status pembayaran tenant saat ini menjadi bagian dari registry `schools/{schoolId}.billing`

### 4.2 Admin Sekolah

**Sumber kebenaran saat ini**

Login admin sekolah **tidak** memakai node pusat terpisah. Source of truth saat ini tetap berada di field registry tenant:

```text
schools/{schoolId}.authEmail
schools/{schoolId}.adminEmail
schools/{schoolId}.backupEmail
schools/{schoolId}.adminAccessActive
```

**Alasan dikunci seperti ini**

- ini adalah bentuk yang dipakai web saat ini
- UI pusat membaca login admin sekolah dari node `schools`
- mutasi `save-school` saat ini juga memperbarui node `schools/{schoolId}`

**Aturan keras**

1. jangan membuat node `admins/*` baru tanpa migrasi resmi
2. jangan memiliki dua sumber kebenaran sekaligus untuk login admin sekolah
3. jika di masa depan diputuskan memakai entitas `admins/*`, dokumen ini harus diubah bersama migrasi data dan kode

### 4.3 Kepala Sekolah

**Path**

```text
principals/{username}
```

**Fungsi**

Menyimpan akun kepala sekolah yang dipersiapkan oleh Super Admin.

**Contoh struktur**

```json
{
  "username": "kepsek_smpn1mojosari",
  "name": "Budi Santoso",
  "schoolId": "smpn_1_mojosari",
  "schoolName": "SMPN 1 MOJOSARI",
  "npsn": "20502652",
  "isActive": true,
  "deviceId": null,
  "updatedAt": 1760000000000,
  "updatedByUid": "super_admin_uid"
}
```

**Field minimum**

- `username: string`
- `name: string`
- `schoolId: string`
- `schoolName: string`
- `npsn: string`
- `isActive: boolean`
- `deviceId: string | null`
- `updatedAt: number`
- `updatedByUid?: string`

**Aturan**

1. akun kepala sekolah dibuat dari pusat
2. `username` adalah identifier stabil, bukan display name
3. akun harus terkait ke tenant yang valid
4. reset device hanya boleh dilakukan oleh Super Admin

### 4.4 Broadcast Global

**Path**

```text
gas/broadcasts/{broadcastId}
```

**Fungsi**

Menyimpan pengumuman global lintas sekolah.

**Field minimum**

- `id: string`
- `title: string`
- `message: string`
- `target: string`
- `createdAt: number`
- `createdByUid: string`

### 4.5 Global Configuration

**Path**

```text
gas/global_config
```

**Fungsi**

Menyimpan konfigurasi pusat lintas tenant.

**Field yang saat ini relevan**

- `billing.perStudentTariff`
- flag global lain yang memang berlaku lintas tenant

**Aturan**

1. hanya config tingkat pusat yang boleh berada di sini
2. config per tenant tidak boleh bercampur dengan global config

### 4.6 Sync Jobs

**Path**

```text
gas/sync_jobs/{jobId}
```

**Fungsi**

Menyimpan antrean dan status job sinkronisasi pusat.

**Field minimum**

- `id: string`
- `schoolId: string`
- `jobType: string`
- `status: string`
- `createdAt: number`
- `createdByUid: string`
- `updatedAt?: number`
- `updatedByUid?: string`

### 4.7 Support Requests

**Path**

```text
gas/support_requests/{requestId}
```

**Fungsi**

Menyimpan tiket dukungan operasional pusat.

**Field minimum**

- `id: string`
- `schoolId: string`
- `requestType?: string`
- `title?: string`
- `status: string`
- `notes?: string`
- `createdAt?: number`
- `createdByUid?: string`
- `updatedAt?: number`
- `updatedByUid?: string`

Catatan:

- UI saat ini dapat menampilkan `title` atau `subject` sebagai fallback
- dokumen ini tetap menyarankan penyeragaman schema ke depan

### 4.8 Log Keamanan dan Audit Pusat

**Path implementasi saat ini**

```text
super/security_logs/{logId}
```

**Fungsi**

Menyimpan jejak aktivitas keamanan atau audit pusat yang saat ini dipakai UI.

**Schema minimum saat ini**

- `id: string`
- `timestamp: number`
- `username: string`
- `accountType: string`
- `activity: string`

**Field pengayaan yang direkomendasikan**

- `actorUid?: string`
- `actorRole?: string`
- `target?: string`
- `meta?: object`

**Aturan**

1. jangan mengubah path atau schema ini tanpa menyesuaikan UI audit
2. jika audit log investigatif penuh diperkenalkan, lakukan evolusi schema secara kompatibel
3. `meta` harus tetap ringkas

### 4.9 EduLock Uninstall Access

**Path**

```text
school_settings/{schoolId}/system/edulock/uninstall_access
```

**Fungsi**

Menyimpan kode uninstall EduLock aktif untuk tenant yang dipilih oleh Super Admin atau panel admin sekolah.

**Schema minimum saat ini**

- `code: string`
- `expiresAt: number`
- `updatedAt: number`
- `createdByUid?: string`
- `durationMinutes?: number`

**Aturan**

1. source of truth uninstall access harus tunggal di node ini
2. Super Admin dan Admin Sekolah wajib membaca node yang sama
3. penghapusan kode harus membersihkan node yang sama, bukan menulis path paralel

### 4.10 Monitoring Siswa Unik dan Aktivitas Realtime

**Path basis populasi siswa**

```text
gas/schools/{schoolId}/students
```

**Path aktivitas realtime**

```text
active_devices/{schoolId}
```

**Fungsi**

- `gas/schools/{schoolId}/students` menjadi sumber jumlah siswa per sekolah
- `active_devices/{schoolId}` menjadi sumber aktivitas realtime perangkat siswa

**Aturan billing yang dikunci**

1. billing memakai siswa unik yang sudah aktivasi
2. GAS dan EduLock tidak boleh dihitung ganda jika satu siswa memakai dua aplikasi
3. `aktif operasional` hanya indikator realtime, bukan dasar tagihan bulanan

---

## 5. Relasi Dengan Auth

### 5.1 Custom Claims

Claims minimum yang relevan:

```json
{
  "role": "super_admin",
  "schoolId": null,
  "npsn": null,
  "capabilities": []
}
```

Untuk admin sekolah:

```json
{
  "role": "admin",
  "schoolId": "smpn_1_mojosari",
  "npsn": "20502652",
  "mustChangePassword": true
}
```

**Aturan**

1. claims adalah sumber otorisasi utama
2. data RTDB tidak boleh dianggap cukup untuk otorisasi tanpa validasi auth
3. `mustChangePassword` dipakai pada alur bootstrap atau reset password admin sekolah agar web memaksa ganti password

---

## 6. Relasi Dengan Data Tenant Sekolah

Data tenant sekolah yang dikelola admin sekolah berada di:

```text
gas/schools/{schoolId}/students
gas/schools/{schoolId}/teachers
gas/schools/{schoolId}/staff
gas/schools/{schoolId}/classes
```

Super Admin hanya boleh:

- memantau
- mengaktifkan atau menonaktifkan tenant
- mengelola akun strategis pusat

Super Admin tidak boleh dijadikan sumber CRUD utama untuk data user sekolah.

---

## 7. Aturan Penamaan Data

Aturan penamaan yang disarankan:

1. gunakan `schoolId` sebagai kunci tenant internal
2. gunakan `npsn` sebagai identitas sekolah yang dibawa sampai ke login
3. gunakan nama path konsisten lower-case atau snake_case sesuai pola yang sudah berjalan
4. jangan membuat path baru yang maknanya tumpang tindih

Contoh yang harus dihindari:

- `school`
- `schools_data`
- `tenantSchools`
- `schoolRegistryData`

---

## 8. Validasi Minimal Per Entitas

### Tenant

- `schoolId` wajib
- `npsn` wajib
- `name` wajib

### Admin Sekolah

- harus punya `schoolId`
- harus punya identitas login pusat yang konsisten di registry sekolah

### Kepala Sekolah

- harus punya `schoolId`
- harus punya `npsn`
- harus punya `username` stabil

### Broadcast

- harus punya isi pesan
- harus punya target

### Sync Job

- harus punya jenis job
- harus punya status

### Support Request

- harus punya `schoolId`
- harus punya status

---

## 9. Larangan Desain Data

Dilarang:

1. menyimpan master data siswa, guru, atau OSIS di path pusat
2. mencampur config tenant dengan config global
3. membuat lebih dari satu sumber kebenaran untuk identitas tenant atau login admin sekolah
4. menyimpan field acak tanpa kontrak yang jelas
5. membuat path pusat yang menggandakan seluruh data tenant

---

## 10. Kesiapan Saat Ini

Status implementasi saat ini:

- proyek sudah punya struktur pusat untuk tenant dan fungsi Super Admin
- helper penting sudah dirapikan
- kontrak data utama sudah bisa dipetakan

Catatan jujur:

- schema audit masih lebih ringkas dari target ideal
- penyeragaman schema support request masih bisa diperhalus
- migrasi ke entitas yang lebih granular harus dilakukan hati-hati agar tidak menciptakan dua source of truth

---

## 11. Rekomendasi Lanjutan

Jika pengembangan Super Admin dilanjutkan:

1. buat type atau interface terpusat untuk tenant, principal, sync job, support request, dan security log
2. samakan kontrak antara frontend, API, dan backend
3. hindari penambahan field liar tanpa update dokumen ini
4. jika ingin memperkenalkan `admins/*` atau `audit_logs/*`, lakukan sebagai migrasi resmi, bukan tambahan paralel

---

## 12. Kesimpulan

Dokumen ini mengunci bahwa data Super Admin harus tetap:

- pusat
- ringkas
- strategis
- tidak mengambil alih wilayah data sekolah

Dengan kontrak ini, pengembangan berikutnya akan lebih aman karena:

- path RTDB lebih jelas
- tanggung jawab data lebih tegas
- risiko tumpang tindih antar modul lebih kecil

Status dokumen:

- **Aktif**
- **Acuan kontrak data dan path RTDB modul Super Admin**
