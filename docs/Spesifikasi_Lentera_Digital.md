# Spesifikasi Modul Lentera Digital

Dokumen ini menjelaskan alur, tata kelola, dan interaksi *cross-platform* (Web Admin & Capacitor Mobile) untuk modul Perpustakaan/Literasi Digital.

---

## 1. STRUKTUR APLIKASI LENTERA
Modul Lentera beroperasi di dua bagian:
*   **Web Portal Admin:** Halaman pengelola (*CMS*) yang diakses pustakawan/admin sekolah. Terhubung langsung dengan Firestore `books` (Katalog) dan RTDB Firebase GAS `literacy_tasks`.
*   **Aplikasi Mobile (Capacitor) Siswa:** Katalog buku konsumen. 

---

## 2. PENGALAMAN BACA (MOBILE NATIVE PDF)
Siswa membaca buku digital tidak menggunakan `WebView` yang dialihkan ke Google Drive Viewer, melainkan menggunakan eksekusi _native_:
1.  **Alur Katalog:** Siswa membuka daftar buku di aplikasi, lalu mengklik salah satu buku.
2.  **Download to Cache:** File PDF dari URL (`pdfUrl`) yang disimpan di Firestore akan diunduh terlebih dahulu ke dalam _cache_ direktori Capacitor.
3.  **PDF Rendering:** Menggunakan _Native Android Renderer_ (via plugin Capacitor) untuk membaca halaman PDF (swipe kiri/kanan).
4.  **Optimasi Memori:** Komponen PDF *Renderer* harus membersihkan instansinya dari memori setelah siswa menutup/keluar dari halaman (*cleanup session on destroy*) untuk mencegah *crash/memory leak*.

---

## 3. ATURAN BISNIS LENTERA (DEFAULT SETTING)
Saat konfigurasi *tenant* sekolah baru diinisialisasi, sistem harus menggunakan *default value* berikut yang tidak boleh dikosongkan:
*   **Tugas Literasi:** Durasi membaca _default_ adalah `45 menit` dan *reward* `30 poin`. Auto-publish tugas = `nonaktif`.
*   **Peminjaman Buku:** Durasi maksimal `7 hari`, batas maksimal buku yang dipinjam `2 buku` per siswa. 
*   **Denda:** Rp 1.000 / hari keterlambatan. Opsi pengecualian hari libur (*weekend due date*) = `nonaktif`.

---

## 4. INTEGRASI TUGAS LITERASI KE GAMIFIKASI
Tugas literasi berkaitan erat dengan **Bar "Kenyang"** pada Virtual Pet.
*   Admin memberikan tugas lewat portal *Lentera Web*.
*   Data tersimpan di simpul RTDB `literacy_tasks` dengan di-*scoped* berdasarkan `schoolId`.
*   Siswa merespons laporan membaca lewat APK Siswa (simpul RTDB `literacy_reports`).
*   Begitu Admin me-*review* dan *Approve* laporan tersebut, poin (default 30) ditambahkan, dan metrik durasi (`durationMinutes`) dikonversi untuk menaikkan persentase bar `Kenyang` di Virtual Pet secara otomatis melalui API Route.
