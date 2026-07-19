# STRUKTUR FOLDER DAN BATAS TANGGUNG JAWAB WEB ADMIN

Dokumen ini adalah rambu resmi untuk menjaga agar pengembangan Web Admin tetap modular, ringan, mudah dicari, dan tidak kembali jatuh ke pola file raksasa.

Tanggal: 14 Juli 2026
Status: AKTIF
Wajib dibaca sebelum menambah fitur baru pada Web Admin.

---

## 1. Tujuan Dokumen

Dokumen ini dibuat untuk mengunci 4 hal:

1. struktur folder Web Admin yang sehat
2. batas tanggung jawab setiap layer
3. aturan pemecahan file agar tidak menjadi 5000+ baris
4. pola kerja tim agar fitur baru tidak ditumpuk di satu file

---

## 2. Prinsip Utama

Prinsip yang wajib dipegang:

1. Satu file = satu tanggung jawab utama.
2. Satu folder = satu domain atau area bisnis yang jelas.
3. Realtime listener tidak boleh tersebar liar.
4. UI, state, data access, dan utilitas tidak boleh dicampur semua di satu tempat.
5. `MasterDataWorkspace.tsx` tidak boleh menjadi file pusat semua logic.

---

## 3. Aturan Ukuran File

Aturan tim:

- Ideal: `<= 200` baris
- Masih wajar: `200 - 300` baris
- Wajib dicurigai: `> 300` baris
- Wajib dipecah: jika file mulai memegang lebih dari satu domain atau lebih dari satu tanggung jawab besar

Catatan:
- Angka ini adalah alarm teknis, bukan angka suci.
- File tertentu boleh sedikit lebih panjang jika memang hanya bertindak sebagai konfigurasi, mapping, atau shell.
- Yang terpenting bukan sekadar jumlah baris, tetapi kejelasan tanggung jawab.

---

## 4. Masalah Yang Harus Dicegah

Pola yang dilarang terulang:

- semua tab DATABASE hidup di satu file
- tabel, modal, hook, submit handler, dan helper semua dicampur di komponen yang sama
- satu perubahan kecil memaksa developer mencari di ratusan baris campur aduk
- bug di modul `Siswa` ikut berisiko merusak `Guru`, `OSIS`, atau `Kelas`

Jika pola ini dibiarkan, modul GAS dan EduLock nanti akan ikut tumbuh dengan cara yang salah.

---

## 5. Arah Struktur Folder Resmi

Struktur Web Admin harus dipisah berdasarkan domain atau entitas, bukan sekadar berdasarkan halaman besar.

Contoh arah struktur yang direkomendasikan:

```text
src/
├── app/
│   └── dashboard/
│       ├── database/
│       │   └── page.tsx
│       ├── gas/
│       │   └── page.tsx
│       └── edulock/
│           └── page.tsx
│
├── components/
│   ├── database/
│   │   ├── shell/
│   │   │   └── MasterDataWorkspace.tsx
│   │   ├── overview/
│   │   │   ├── OverviewPanel.tsx
│   │   │   └── OverviewCards.tsx
│   │   ├── students/
│   │   │   ├── StudentsPanel.tsx
│   │   │   ├── StudentsTable.tsx
│   │   │   ├── StudentFormModal.tsx
│   │   │   └── StudentToolbar.tsx
│   │   ├── teachers/
│   │   │   ├── TeachersPanel.tsx
│   │   │   ├── TeachersTable.tsx
│   │   │   └── TeacherFormModal.tsx
│   │   ├── staff/
│   │   │   ├── StaffPanel.tsx
│   │   │   ├── StaffTable.tsx
│   │   │   ├── StaffFormModal.tsx
│   │   │   └── OsisLookupCard.tsx
│   │   ├── classes/
│   │   │   ├── ClassesPanel.tsx
│   │   │   ├── ClassesTable.tsx
│   │   │   ├── ClassFormModal.tsx
│   │   │   └── GradeFilter.tsx
│   │   └── shared/
│   │       ├── DatabaseHeader.tsx
│   │       ├── DatabaseSidebar.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingState.tsx
│   │
│   ├── gas/
│   └── edulock/
│
├── hooks/
│   ├── database/
│   │   ├── useDatabaseOverviewRealtime.ts
│   │   ├── useStudentsRealtime.ts
│   │   ├── useTeachersRealtime.ts
│   │   ├── useStaffRealtime.ts
│   │   └── useClassesRealtime.ts
│   ├── gas/
│   └── edulock/
│
├── lib/
│   ├── database/
│   │   ├── constants.ts
│   │   ├── paths.ts
│   │   ├── mappers.ts
│   │   ├── normalizers.ts
│   │   └── validators.ts
│   ├── gas/
│   └── edulock/
│
└── types/
    ├── database.ts
    ├── gas.ts
    └── edulock.ts
```

---

## 6. Batas Tanggung Jawab Tiap Layer

### 6.1 `app/`

Fungsi:
- entry point route
- penghubung ke shell atau workspace
- guard dasar halaman

Tidak boleh:
- menyimpan logic bisnis yang panjang
- menaruh listener RTDB panjang
- menaruh modal, tabel, dan helper campur aduk

### 6.2 `components/<domain>/shell`

Fungsi:
- layout utama area kerja
- navigasi tab/menu lokal
- wiring antar panel

Contoh:
- `MasterDataWorkspace.tsx`

Tidak boleh:
- menjadi tempat semua implementasi detail modul
- menyimpan seluruh form, tabel, dan submit logic semua domain

### 6.3 `components/<domain>/<entity>/`

Fungsi:
- UI spesifik untuk domain itu
- tabel, panel, modal, toolbar, section kecil

Contoh:
- `StudentsPanel.tsx`
- `StudentFormModal.tsx`
- `StudentsTable.tsx`

Tidak boleh:
- mengakses domain lain tanpa alasan kuat
- memuat logic besar dari modul lain

### 6.4 `hooks/`

Fungsi:
- tempat listener realtime
- tempat stateful data access
- tempat logic subscribe/unsubscribe

Wajib:
- satu hook untuk satu scope data
- cleanup listener wajib ada
- hanya dipanggil saat komponen aktif memang membutuhkan data itu

Tidak boleh:
- satu hook menangani semua tab sekaligus
- satu hook mengembalikan banyak domain yang tidak berhubungan

### 6.5 `lib/`

Fungsi:
- helper stateless
- path mapper RTDB
- normalizer string
- validator payload
- constant enum / label / config

Tidak boleh:
- menyimpan state React
- memakai hook React
- menangani rendering UI

### 6.6 `types/`

Fungsi:
- definisi tipe yang dipakai lintas modul
- kontrak data antarlayer

Tidak boleh:
- diisi helper UI
- dicampur dengan logic fetch atau listener

---

## 7. Batas Tanggung Jawab Per Domain DATABASE

### 7.1 Overview

Tanggung jawab:
- menampilkan ringkasan jumlah aktif
- menampilkan kartu statistik realtime

Tidak boleh:
- menangani submit form siswa/guru/osis/kelas
- menanggung data tabel besar

### 7.2 Students

Tanggung jawab:
- daftar siswa
- search siswa
- tambah/edit/hapus siswa
- import/export khusus siswa

Tidak boleh:
- menangani tabel guru
- menangani rule OSIS selain lookup yang memang terkait siswa

### 7.3 Teachers

Tanggung jawab:
- daftar guru
- tambah/edit/hapus guru
- form guru dan validasinya

Tidak boleh:
- menangani kelas paralel
- menangani data siswa

### 7.4 Staff / OSIS

Tanggung jawab:
- daftar petugas OSIS
- lookup siswa via NISN
- simpan role OSIS yang menempel pada siswa

Tidak boleh:
- menciptakan akun induk terpisah untuk OSIS
- mengelola seluruh data siswa sebagai domain utama

### 7.5 Classes

Tanggung jawab:
- daftar kelas
- filter grade
- tambah/edit/hapus kelas
- normalisasi nama kelas seperti `VII-D`

Tidak boleh:
- menangani tabel siswa penuh
- menangani toolbar massal guru/osis

---

## 8. Aturan `MasterDataWorkspace.tsx`

Status file ini saat ini masih dipakai, tetapi perannya harus diturunkan menjadi shell saja.

File ini boleh berisi:
- layout utama halaman DATABASE
- state tab aktif
- pemanggilan panel sesuai tab aktif
- shared header atau sidebar

File ini tidak boleh terus menampung:
- semua tabel
- semua form modal
- semua submit handler
- semua listener realtime
- semua transformasi payload

Target akhir:
- `MasterDataWorkspace.tsx` menjadi ramping, fokus, dan mudah dibaca
- logic detail dipindah ke folder domain masing-masing

---

## 9. Aturan Listener dan Data Flow

Semua listener realtime wajib:

1. ditaruh di custom hook
2. hanya aktif saat panel yang membutuhkan sedang tampil
3. punya cleanup `unsubscribe`
4. tidak hidup global dari root dashboard

Contoh alur yang benar:

1. `MasterDataWorkspace` memilih tab aktif
2. Tab `StudentsPanel` dirender
3. `StudentsPanel` memanggil `useStudentsRealtime`
4. Hook subscribe ke path siswa tenant aktif
5. Saat user pindah ke tab lain, panel unmount
6. Listener siswa mati otomatis

Ini wajib dijadikan pola resmi.

---

## 10. Aturan Penamaan File

Gunakan nama file yang jelas dan konsisten.

Contoh:
- `StudentsPanel.tsx`
- `StudentsTable.tsx`
- `StudentFormModal.tsx`
- `useStudentsRealtime.ts`
- `databasePaths.ts`
- `studentValidators.ts`

Hindari nama samar seperti:
- `utils.ts`
- `helper.ts`
- `temp.tsx`
- `newComponent.tsx`

Kalau helper memang spesifik siswa, beri nama spesifik siswa.

---

## 11. Aturan Saat Menambah Fitur Baru

Sebelum menambah fitur baru, developer wajib menjawab:

1. Fitur ini masuk domain apa?
2. File yang disentuh sekarang masih satu tanggung jawab atau sudah campur aduk?
3. Apakah logic ini lebih tepat di panel, modal, hook, lib, atau types?
4. Apakah fitur ini akan memperpanjang file lama secara tidak sehat?
5. Apakah domain lain akan terdampak jika saya menaruh kode di file ini?

Jika jawabannya mulai kabur, fitur wajib dipisah lebih dulu sebelum dilanjutkan.

---

## 12. Aturan Refactor Bertahap

Refactor tidak perlu membongkar semua sekaligus.

Urutan aman:

1. pecah berdasarkan panel/tab
2. pecah tabel dan modal per domain
3. pindahkan listener ke custom hook
4. pindahkan normalizer/validator ke `lib`
5. rapikan tipe ke `types`

Dengan pola ini, proyek tetap jalan sambil struktur dibenahi.

---

## 13. Larangan Resmi

Dilarang:
- menambah fitur besar langsung ke `MasterDataWorkspace.tsx`
- menyimpan semua domain di satu file
- menaruh listener realtime di page besar
- mencampur UI, hook, helper, dan submit logic dalam satu file
- membuat folder berdasarkan "halaman besar" tetapi isinya banyak domain campur aduk

---

## 14. Kesimpulan Resmi

Keputusan struktur yang dikunci:

- Web Admin wajib modular sejak sekarang
- struktur folder dipisah berdasarkan domain atau entitas
- `MasterDataWorkspace.tsx` hanya boleh menjadi shell
- listener realtime wajib pindah ke custom hook
- file yang mulai membesar wajib segera dipecah
- refactor dilakukan bertahap, tetapi tidak boleh ditunda terlalu lama

Dokumen ini menjadi rambu tetap agar pengembangan panjang Web Admin, GAS, dan EduLock tidak kembali jatuh ke pola file raksasa dan arsitektur campur aduk.
