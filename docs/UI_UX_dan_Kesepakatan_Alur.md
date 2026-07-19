# Kesepakatan Alur dan UI/UX (PortalKita)

Dokumen ini merupakan penjabaran detail antarmuka dan alur *login* yang mengikat seluruh pengembangan aplikasi agar setara dengan versi aslinya. Segala bentuk pengembangan, penambahan fitur, atau modifikasi wajib merujuk pada prinsip-prinsip di bawah ini.

---

## 1. STRUKTUR MENU UTAMA
Aplikasi dibangun di atas *shell* utama yang disebut **PortalKita**. 

Saat *user* melakukan otentikasi, terdapat 3 menu inti yang selalu hadir (tulang punggung lintas *role*):
1. **DATABASE**
2. **GAS (Gerbang Aplikasi Sekolah)**
3. **EduLock**

Serta menu konteks keempat yang menyesuaikan *role*:
- **Status Layanan Sekolah** (Khusus Super Admin)
- **Lentera Digital** (Khusus Admin Sekolah)

### Aturan Navigasi:
*   Tidak boleh ada rute (URL) yang membawa pengguna keluar dari *shell* PortalKita. Navigasi antar modul (`/dashboard`, `/edulock`, `/admin/lentera`) harus terasa mulus (*Single Page Application* / SPA).
*   *Sidebar* sebelah kiri (Menu Konteks Lokal) akan berubah total bergantung pada Modul yang sedang dibuka (misal: jika sedang di GAS, maka *sidebar* berisi `Manajemen Siswa`, `Rekap Kehadiran`, dll, dan logo portal berubah menjadi `Gerbang Aplikasi Sekolah`).

---

## 2. ATURAN AUTENTIKASI DAN ROLE
*   **Web PortalKita HANYA untuk Super Admin dan Admin Sekolah**. Role lain (Siswa, Guru, Kepala Sekolah) wajib ditolak dari Web Admin dan diarahkan menggunakan *APK Mobile* (Capacitor).
*   **Login Admin Sekolah:** Wajib menggunakan atribut `NPSN` sebagai *username*. Password *default* pada *bootstrap* awal adalah `admin123` (Admin akan dipaksa mengganti password setelah *login* pertama).
*   **Tombol Reset:** Super Admin hanya memiliki satu cara untuk mereset akun Admin Sekolah, yaitu tombol `Reset Default` (mengembalikan sandi ke `admin123`). Tidak menggunakan verifikasi kode via email.

---

## 3. ALUR KERJA ABSOLUT SUPER ADMIN
Urutan kerja yang tidak boleh dibalik:
1.  **Daftarkan Tenant Sekolah** (Di menu *Sekolah & Tenant*).
2.  Sistem men- *generate* `schoolId`.
3.  **Buka Akses Admin Sekolah** (Hanya setelah `schoolId` eksis).
4.  **Buka Akses Kepala Sekolah** (Akun *executive* APK juga butuh `schoolId`).
5.  Jika Super Admin menekan *Kill-Switch* (`Nonaktifkan Layanan`), akses poin 3 dan 4 otomatis terputus (*session* di- *destroy*).

---

## 4. UI/UX GUIDELINES
*   Tabel `DATABASE Admin Sekolah` (seperti daftar siswa) **tidak boleh** menyediakan opsi *Import Template* / Excel di dalam modul *EduLock*. `DATABASE` utama adalah satu-satunya gerbang untuk fungsi *import*.
*   Di APK Siswa/Kepala Sekolah, dilarang menggunakan karakter *encoding* rumit (`â€¢`). Wajib menggunakan ASCII aman seperti ` | ` (pipa vertikal) atau list standar `-` untuk stabilitas rendering font perangkat lama.
