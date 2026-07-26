# Temuan Bug Super Admin - Admin Sekolah

## Ruang Lingkup

Dokumen ini hanya mencatat temuan bug pada hubungan `Web Super Admin` dan `Web Admin Sekolah`, khususnya pada:

- otorisasi role admin sekolah
- validasi tenant/sekolah yang dikendalikan oleh super admin
- keterikatan data admin sekolah terhadap registry sekolah induk

## Ringkasan

Hasil audit menunjukkan alur `Super Admin -> Admin Sekolah` sudah terhubung secara fungsional, tetapi belum sepenuhnya ketat sebagai boundary keamanan dan source of truth.

Ada 2 bug inti:

1. fallback role di client salah dan terlalu permisif
2. resolver tenant di backend masih menerima `schoolId` di luar registry super admin

## Temuan 1 - Fallback Role Client Terlalu Permisif

### Lokasi

- `web/src/components/providers/AuthProvider.tsx`

### Potongan Masalah

```ts
const claims = token?.claims || {};
const roleClaim = typeof claims.role === "string" ? claims.role : "admin";
const role: PortalUserRole =
  roleClaim === "super_admin" || roleClaim === "teacher" || roleClaim === "student" ? roleClaim : "admin";
```

### Bug

Saat custom claim `role` tidak ada, kosong, atau nilainya tidak dikenal, user tetap dipetakan menjadi `admin`.

### Dampak

- user Firebase yang tidak memiliki claim admin yang valid bisa dibaca sebagai `admin` di sisi client
- halaman admin sekolah dapat terbuka di UI karena guard client hanya melihat `user.role === "admin"`
- relasi kontrol antara `super admin` dan `admin sekolah` menjadi longgar di sisi frontend

### Efek Ke Modul

Guard UI admin yang terdampak antara lain:

- `web/src/app/dashboard/page.tsx`
- `web/src/app/dashboard/database/page.tsx`
- `web/src/app/dashboard/gas/page.tsx`
- `web/src/components/database/MasterDataWorkspace.tsx`
- `web/src/components/gas/GasWorkspace.tsx`

### Rekomendasi Perbaikan

- jangan gunakan fallback `admin` ketika claim `role` hilang
- role harus dianggap valid hanya jika eksplisit bernilai:
  - `super_admin`
  - `admin`
  - `teacher`
  - `student`
- bila claim tidak valid, user harus dianggap tidak punya akses dashboard admin

## Temuan 2 - Resolver Tenant Backend Terlalu Permisif

### Lokasi

- `web/src/lib/admin/resolveCanonicalSchoolContext.ts`

### Potongan Masalah

```ts
if (!normalizedSchoolId) return null;

return {
  schoolId: normalizedSchoolId,
  npsn: String(input.npsn || "").trim(),
  name: "",
  authEmail: normalizedEmail,
  adminEmail: normalizedEmail,
} satisfies CanonicalSchoolContext;
```

### Bug

Jika `schoolId` tidak ditemukan di registry `schools`, fungsi masih mengembalikan context tenant berdasarkan input mentah, seolah tenant itu valid.

### Dampak

- registry sekolah yang dikelola super admin belum menjadi source of truth wajib
- token admin dengan `schoolId` yang tidak terdaftar masih bisa lolos pada endpoint yang memakai resolver ini
- backend dapat menulis data ke tenant yang tidak resmi terdaftar di registry super admin

### Endpoint Yang Terdampak

#### 1. Admin Database API

- `web/src/app/api/admin/database/route.ts`

Pemakaian resolver:

```ts
const schoolContext = await resolveCanonicalSchoolContext({
  schoolId: decodedToken.schoolId,
  npsn: decodedToken.npsn,
  email: decodedToken.email,
});
const schoolId = schoolContext?.schoolId;
```

Dampak:

- data master sekolah dapat ditulis ke path tenant berbasis `schoolId` yang tidak terdaftar di registry

#### 2. Record Login API

- `web/src/app/api/auth/record-login/route.ts`

Pemakaian resolver:

```ts
const schoolContext = await resolveCanonicalSchoolContext({
  email,
  npsn: localIdentifier || decodedToken.npsn,
  schoolId: decodedToken.schoolId,
});
const targetSchoolId = schoolContext?.schoolId || null;
```

Dampak:

- `lastLoginAt` bisa tercatat ke node sekolah yang tidak resmi terdaftar
- monitoring super admin bisa menerima sinyal tenant yang tidak sinkron dengan registry induk

### Rekomendasi Perbaikan

- hapus fallback context mentah ketika tenant tidak ditemukan di registry
- jika sekolah tidak ditemukan, resolver harus mengembalikan `null`
- seluruh endpoint admin yang bergantung pada resolver wajib gagal bila tenant tidak valid

## Kesimpulan Audit

Secara fungsional, hubungan `Super Admin` dan `Admin Sekolah` sudah berjalan. Namun secara kontrol dan boundary data, masih ada 2 celah mayor:

1. validasi siapa yang benar-benar dianggap admin sekolah
2. validasi apakah tenant admin benar-benar terdaftar resmi di registry super admin

## Status

- status audit: `CLOSED`
- status perbaikan: `FIXED`
- rekomendasi: Kedua bug telah diperbaiki. Batasan (boundary) otorisasi client dan resolver tenant backend kini sepenuhnya ketat.
