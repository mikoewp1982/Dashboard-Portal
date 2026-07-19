# Debug Session: dashboard-404-route [OPEN]

## Gejala
- URL `http://localhost:3000/dashboard` menampilkan 404 setelah perubahan struktur route dashboard/GAS.

## Ekspektasi
- URL `/dashboard` tetap membuka halaman dashboard utama admin.

## Hipotesis
1. Route default `/dashboard` hilang karena `page.tsx` aktif ikut terhapus bersama folder route group lama.
2. Struktur App Router di bawah `src/app/dashboard` tidak lagi memiliki child route default yang valid.
3. Cache build lama masih menyimpan manifest route yang salah.
4. Navigasi dari halaman GAS masih menunjuk ke route yang sudah tidak tersedia.
5. Ada referensi layout/page lama yang membuat route tree tidak lengkap.

## Rencana Pengumpulan Bukti
- Audit struktur file route di `web/src/app/dashboard`.
- Jalankan build/dev untuk melihat error route aktual.
- Verifikasi apakah `/dashboard` memiliki `page.tsx` yang valid.

## Bukti Terkumpul
- Folder `web/src/app/dashboard` saat ini hanya memiliki `database/page.tsx` dan `gas/page.tsx`.
- Tidak ada `web/src/app/dashboard/page.tsx`, sehingga exact route `/dashboard` memang tidak punya owner file.
- [AuthProvider.tsx](file:///d:/Dashboard%20Portal/web/src/components/providers/AuthProvider.tsx#L46-L54) masih mengarahkan admin ke `/dashboard`.
- [Sidebar.tsx](file:///d:/Dashboard%20Portal/web/src/components/layout/Sidebar.tsx#L140-L148) masih menjadikan `/dashboard` sebagai tujuan "Dashboard Utama".

## Status
- OPEN
