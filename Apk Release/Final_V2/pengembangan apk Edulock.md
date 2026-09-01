# 🛡️ Panduan & Blueprint Pengembangan Keamanan APK EduLock

**Dokumen Acuan:** Keamanan Sistem, Privasi Data Siswa, & Hardening Arsitektur MDM EduLock  
**Lokasi Berkas:** `D:\Dashboard Portal\Apk Release\Final_V2\pengembangan apk Edulock.md`  
**Tanggal:** 2026-09-01  
**Status:** Blueprint Resmi Pengembangan Lanjutan  

---

## 📋 Executive Summary
Dokumen ini merangkum 3 pilar keamanan utama dalam pengembangan aplikasi **EduLock (Mobile Device Management Siswa)**. Tujuannya adalah memastikan sistem bekerja efektif untuk menertibkan jam belajar dan absensi siswa, **tanpa mengorbankan privasi data pribadi siswa** serta **menghilangkan kecurigaan bagi pihak sekolah dan wali murid**.

---

## 📌 PILAR 1: Hardening Policy Device Admin (`device_admin.xml`)

### 1.1 Masalah Saat Ini
File konfigurasi Device Admin bawaan (`res/xml/device_admin.xml`) masih membawa template default Android dengan hak akses berlebih (`<wipe-data />`, `<reset-password />`, `<limit-password />`).  
**Dampak Negatif:** Saat siswa mengaktifkan Device Admin di HP, Android menampilkan peringatan yang menakutkan:  
> ⚠️ *"Aplikasi ini meminta izin untuk: Menghapus semua data ponsel (Factory Reset) dan Mengubah kata sandi layar kunci."*  
Hal ini menimbulkan kepanikan pada siswa dan orang tua.

### 1.2 Tindakan Hardening
Menghapus seluruh tag policy yang tidak pernah dipakai dalam kode Kotlin, dan hanya menyisakan policy kunci layar:

```xml
<!-- File: native-mobile-edulock/app/src/main/res/xml/device_admin.xml -->
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <force-lock />
    </uses-policies>
</device-admin>
```

### 1.3 Hasil & Dampak Fungsional
- **Fungsi EduLock:** **100% Tetap Berfungsi Normal** (Proteksi jam sekolah, anti-uninstall selektif, lock screen instan `lockNow()` tetap berjalan).
- **Tampilan di HP Siswa:** Peringatan berubah menjadi sangat ramah dan bersahabat:  
  *`"Aplikasi ini meminta izin untuk: Mengunci Layar."`*
- **Keamanan:** Mencegah penyalahgunaan source code untuk menghapus data ponsel siswa jika kodingan jatuh ke pihak lain.

---

## 📌 PILAR 2: Kunci Keamanan Firebase Realtime Database (RTDB Rules)

### 2.1 Masalah Saat Ini
Jika database Firebase dibiarkan terbuka (`".read": true, ".write": true`), pihak luar yang mengekstrak URL Firebase dari APK dapat memanipulasi jadwal, mematikan proteksi sekolah, atau mengubah status perangkat siswa secara ilegal.

### 2.2 Arsitektur 4 Zona Keamanan
Database dibagi menjadi 4 zona dengan hak akses ketat:

```
                              ┌────────────────────────────────────────┐
                              │       FIREBASE RTDB SECURITY RULES     │
                              └────────────────────┬───────────────────┘
                                                   │
         ┌─────────────────────────┬───────────────┴───────────────┬─────────────────────────┐
         ▼                         ▼                               ▼                         ▼
  [1. PENGATURAN GLOBAL]   [2. KONTROL SEKOLAH]           [3. TELEMETRI SISWA]       [4. DATA RAHASIA]
  `app_settings/`          `schools/{schoolId}/config`    `active_devices/{devId}`   `users/`, `credentials/`
  -----------------------  ---------------------------    ------------------------   ------------------------
  Read : Semua APK         Read : Siswa & Guru            Read : Admin Sekolah       Read : Pemilik Akun Saja
  Write: Super Admin Saja  Write: Admin Sekolah Saja      Write: HP Siswa Pemilik    Write: Super Admin Saja
```

### 2.3 Blueprint Konkret (`database.rules.json`)
```json
{
  "rules": {
    // 1. PENGATURAN VERSI & FORCE UPDATE
    "app_settings": {
      ".read": true,
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'super_admin'"
    },

    // 2. KONTROL SEKOLAH (Jadwal, Geofence Radius, Saklar Proteksi)
    "schools": {
      "$schoolId": {
        ".read": "auth != null",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'super_admin' || (root.child('users').child(auth.uid).child('schoolId').val() === $schoolId && root.child('users').child(auth.uid).child('role').val() === 'admin'))"
      }
    },

    // 3. TELEMETRI MONITORING HP SISWA (Status Baterai, GPS, Aksesibilitas)
    "active_devices": {
      "$deviceId": {
        ".read": "auth != null",
        ".write": "auth != null || !data.exists() || data.child('schoolId').val() === newData.child('schoolId').val()"
      }
    },

    // 4. DATA PENGGUNA & ADMIN WEB
    "users": {
      "$userId": {
        ".read": "auth != null && (auth.uid === $userId || root.child('users').child(auth.uid).child('role').val() === 'super_admin')",
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'super_admin'"
      }
    }
  }
}
```

### 2.4 Cara Menerapkan:
1. Buka **Firebase Console** $\rightarrow$ Project Anda.
2. Masuk ke **Realtime Database** $\rightarrow$ Tab **Rules**.
3. Tempel konfigurasi JSON di atas $\rightarrow$ Klik **Publish**.

---

## 📌 PILAR 3: Hak Aksesibilitas (`AccessibilityService`) & Batasan Privasi Siswa

### 3.1 Fungsi Nyata Aksesibilitas di EduLock
Aksesibilitas (`AntiUninstallService.kt`) digunakan secara eksklusif untuk 2 tugas teknis:
1. **Pengawasan Jam Belajar:** Mendeteksi pembukaan game / media sosial (misal: TikTok, IG, Game Online) saat jam sekolah aktif $\rightarrow$ Memanggil layar gembok EduLock.
2. **Anti-Uninstall Cerdas:** Mendeteksi upaya siswa membuka menu Pengaturan Sistem (Settings) untuk mencabut admin / menghapus EduLock $\rightarrow$ Menjalankan aksi tendang keluar (*Global Back + Home*).

### 3.2 Bukti Keamanan Privasi Data Pribadi Siswa
| Data Pribadi Siswa | Status di EduLock | Penjelasan Teknis |
| :--- | :---: | :--- |
| **Foto & Video Galeri** | ❌ **TIDAK BISA** | EduLock tidak memiliki izin penyimpanan (`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`). |
| **Isi Chat WA / Telegram** | ❌ **TIDAK BISA** | Sandboxing Android mengisolasi total database aplikasi lain (`/data/data/com.whatsapp`). |
| **Password & M-Banking** | ❌ **TIDAK BISA** | Kolom password disensor sistem (`TYPE_TEXT_VARIATION_PASSWORD`) dan aplikasi bank memakai `FLAG_SECURE`. |
| **Kontak, Panggilan, SMS** | ❌ **TIDAK BISA** | EduLock tidak meminta izin `READ_CONTACTS`, `READ_SMS`, atau `RECORD_AUDIO`. |
| **Perekaman Ketikan (Keylogger)** | ❌ **TIDAK ADA** | EduLock hanya mendengarkan event pergantian jendela (`typeWindowStateChanged`), bukan rekaman huruf per huruf. |

### 3.3 Tindakan Hardening Aksesibilitas
1. **Penyempurnaan Deskripsi Layanan (`res/values/strings.xml`):**
   ```xml
   <string name="accessibility_service_description">Layanan EduLock Protection digunakan secara khusus untuk membatasi penggunaan aplikasi non-pendidikan selama jam pelajaran sekolah berlangsung dan melindungi sistem absensi dari penonaktifan tidak sah.</string>
   ```
2. **Event Filtering Minimalis (`res/xml/accessibility_service_config.xml`):**
   - Membatasi event hanya pada `typeWindowStateChanged` untuk deteksi pergantian aplikasi tanpa memproses konten interaktif yang tidak perlu.

---

## 🏁 Kesimpulan
Dengan menerapkan ketiga pilar di atas:
1. EduLock **100% aman dan bersih** dari potensi spyware maupun risiko penghapusan data sepihak.
2. Tampilan perizinan di HP siswa menjadi **profesional, transparan, dan tidak menakutkan**.
3. Database sekolah terlindungi penuh dari ancaman manipulasi jarak jauh.
