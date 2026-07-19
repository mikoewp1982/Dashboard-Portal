# Technical Handoff - Lentera Digital (Web Dashboard)

Dokumen ini menjelaskan struktur arsitektur dan perubahan kode (refactoring) yang telah dilakukan pada antarmuka admin Lentera Digital, sebagai panduan bagi para pengembang untuk pemeliharaan *(maintenance)* ke depannya.

## 1. Topologi Arsitektur (App Router)

Modul dipasang di rute independen di bawah payung *Dashboard*:
- **Rute:** `/dashboard/lentera`
- **Entry File:** `src/app/dashboard/lentera/page.tsx`
  - Menyediakan *layout container* (*flex row*) yang secara eksplisit me-render `LenteraSidebar` di sebelah kiri dan `LenteraWorkspace` di sebelah kanan.

## 2. Struktur Komponen (Modularisasi)

File kode referensi raksasa peninggalan *prototype* sebelumnya (hampir 3.000 baris) **telah usang dan ditinggalkan sepenuhnya**. Fungsi-fungsinya telah didistribusikan secara modular ke *path* `src/components/lentera/`:

### A. Komponen Cangkang (Shell/Layout)
- `LenteraSidebar.tsx`: Pengganti *sidebar* bawaan Dashboard. Digunakan khusus di rute Lentera. Menyediakan navigasi yang menggunakan parameter URL (`?tab=...`). Desain menggunakan kelas estetika asli (biru solid yang elegan).
- `LenteraWorkspace.tsx`: *Router switch* level komponen yang akan membaca parameter URL dan menentukan *panel* mana yang perlu di-render, serta menampung elemen Header atas (Tugas Aktif, Laporan Menunggu, Draft Tersimpan).

### B. Komponen Panel (Isi Konten)
Disimpan di subdirektori `panels/`:
1. `LenteraDashboardPanel.tsx`: UI matriks statistik.
2. `LenteraLoansPanel.tsx`: Daftar tabel peminjaman buku.
3. `LenteraTasksPanel.tsx`: Menu "Kelola Literasi" lengkap dengan sub-navigasi *pill* tiga arah (Daftar Tugas, Perlu Dinilai, Riwayat) dan fungsi tarik/terbitkan penugasan.
4. `LenteraMembersPanel.tsx`: Daftar keanggotaan terpusat (terhubung ke Data Siswa).
5. `LenteraStatsPanel.tsx`: Tabel/statistik rekap harian aktivitas siswa.

### C. Catatan Struktur Aktual
- Sidebar Lentera sekarang hanya menampilkan panel yang benar-benar dirender oleh workspace utama.
- Masih ada komponen tambahan seperti `LenteraCatalogPanel.tsx`, `LenteraLiteracyPanel.tsx`, dan `LenteraWorkspaceShell.tsx` di codebase yang belum menjadi jalur render utama.
- Komponen tambahan tersebut tidak boleh dianggap sebagai fitur aktif sampai benar-benar dihubungkan ke rute/workspace utama.

## 3. Infrastruktur Data (Aktual)

Prinsip kerja Lentera saat ini adalah **integrasi hybrid**. Tidak semua jalur data menggunakan listener realtime murni. Modul ini bertumpu pada satu hook utama dan direktori siswa:

1. **`useGasLibrary(schoolId)`** (terletak di `src/hooks/gas/library/useGasLibrary.ts`)
   - **Tujuan:** Menarik data operasional Lentera dari beberapa sumber.
   - **Implementasi aktual:**
     - `tasks` dibaca dari Firestore (`schools/{schoolId}/library_tasks`) via `getDocs`
     - `books` dan `borrowRecords` dibaca dari RTDB `gas/schools/{schoolId}/library/...` via `get`
     - `literacyLogs` dibaca lewat API admin `/api/admin/library-monitoring`
   - **Catatan:** ini berarti status data saat ini lebih tepat disebut sinkronisasi fetch berbasis permintaan, bukan realtime penuh berbasis listener di semua node.
   
2. **`useStudentsRealtime(schoolId)`** (terletak di `src/hooks/database/useStudentsRealtime.ts`)
   - **Tujuan:** Melakukan silang referensi (menyatukan ID Siswa dengan nama asli mereka dari direktori sentral sekolah).

## 4. Status Realistis Modul

- Struktur panel utama sudah usable.
- Ringkasan utama dashboard sekarang sudah dihitung dari data aktual periode terpilih.
- Klaim `realtime` juga perlu dibatasi, karena tidak semua data memakai listener aktif.
- Dokumen ini menjaga agar tim berikutnya tidak salah menyimpulkan modul sudah sepenuhnya live listener-based.

## 5. UI/UX Constraint
Antarmuka diproteksi agar *pixel-perfect* sama persis dengan referensi awal (sebelumnya sempat keliru dibuat *glassmorphism* seperti *EduLock*). Pastikan komponen-komponen baru di dalam Lentera Digital menggunakan warna dasar `bg-slate-900/30` pada *card* dan menghindari efek *border glow/glass*.
