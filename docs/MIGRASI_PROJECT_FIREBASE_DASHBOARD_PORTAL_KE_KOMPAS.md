# Panduan Migrasi: Project Firebase "Dashboard Portal" → "KOMPAS"

Dokumen ini menjelaskan langkah-langkah beralih seluruh aplikasi dari project Firebase **dashboard-portal-179f7** ke project Firebase **KOMPAS**.

---

## **Peringatan Penting: Coba Opsi Termudah Dulu!**
Jika memungkinkan, **upgrade project "Dashboard Portal" ke Blaze Plan** — ini menghindari kebutuhan untuk merubah kode apapun dan lebih cepat!

---

## **Jika Tetap Ingin Beralih ke Project "KOMPAS"**

### **Langkah 1: Dapatkan Konfigurasi Baru dari Project "KOMPAS"**
1.  Buka [Firebase Console](https://console.firebase.google.com/)
2.  Pilih project **KOMPAS**
3.  **Untuk Web Dashboard**:
    - Menu `Settings` → `General` → `Your apps` → `Add app` → Pilih `Web`
    - Isi nama app → Register app
    - Salin `firebaseConfig` (objek konfigurasi)
4.  **Untuk Android (EduLock & GAS)**:
    - Menu `Settings` → `General` → `Your apps` → `Add app` → Pilih `Android`
    - Isi package name (lihat `AndroidManifest.xml` di masing-masing folder native) → Register app
    - Download file `google-services.json`
5.  **Untuk Admin SDK (Server-side)**:
    - Menu `Settings` → `Service accounts` → `Generate new private key` → Download file JSON (simpan aman!)

---

### **Langkah 2: Update File Konfigurasi di Kodebase**

#### **2.1 Web Dashboard**
1.  **[`web/src/lib/firebase/client.ts`](file:///d:/Dashboard%20Portal/web/src/lib/firebase/client.ts)**: Ganti `firebaseConfig` dengan yang dari project KOMPAS
2.  **[`web/.firebaserc`](file:///d:/Dashboard%20Portal/web/.firebaserc)**: Ganti `default` project ID menjadi project ID KOMPAS
3.  **Salin Security Rules**:
    - Buka project "Dashboard Portal" di Firebase Console
    - Salin `Firestore Rules`, `Realtime Database Rules`, dan `Storage Rules`
    - Tempel ke project "KOMPAS" di menu masing-masing

#### **2.2 Native Android EduLock**
1.  Ganti file [`native-mobile-edulock/app/google-services.json`](file:///d:/Dashboard%20Portal/native-mobile-edulock/app/google-services.json) dengan yang baru dari project KOMPAS

#### **2.3 Native Android GAS**
1.  Ganti file [`native-mobile-gas/app/google-services.json`](file:///d:/Dashboard%20Portal/native-mobile-gas/app/google-services.json) dengan yang baru dari project KOMPAS

---

### **Langkah 3: Migrasi Data (Opsional)**
Jika kamu ingin memindahkan data dari "Dashboard Portal" ke "KOMPAS":
1.  **Export data dari "Dashboard Portal"**:
    - Firestore: Firebase Console → Firestore → Export/Import → Export
    - RTDB: Firebase Console → Realtime Database → Export data
    - Storage: Download file secara manual atau dengan gsutil
2.  **Import ke "KOMPAS"**:
    - Firestore: Firebase Console → Firestore → Export/Import → Import
    - RTDB: Firebase Console → Realtime Database → Import data
    - Storage: Upload file secara manual atau dengan gsutil

---

### **Langkah 4: Update Environment Variables (Untuk Admin SDK)**
Jika kamu menggunakan Firebase Admin di Vercel atau lokal:
1.  Hapus environment variables lama terkait "Dashboard Portal"
2.  Tambahkan environment variables baru dengan service account dari project KOMPAS (file JSON yang didownload di Langkah 1)

---

### **Langkah 5: Test Semua Aplikasi**
1.  Jalankan web dashboard lokal → test login dan fitur
2.  Build APK EduLock & GAS → test di perangkat
3.  Pastikan semua fitur berjalan normal

---

### **Langkah 6: Deploy (Opsional)**
Jika kamu ingin deploy web ke Firebase Hosting (bukan Vercel):
```bash
cd web
firebase login
firebase deploy
```

---

## **Daftar File yang Berubah**
| File | Keterangan |
|------|------------|
| `web/src/lib/firebase/client.ts` | Konfigurasi Firebase client web |
| `web/.firebaserc` | Project ID untuk Firebase CLI |
| `native-mobile-edulock/app/google-services.json` | Konfigurasi Android EduLock |
| `native-mobile-gas/app/google-services.json` | Konfigurasi Android GAS |
| (Opsional) Environment Variables | Firebase Admin service account |
| (Opsional) Security Rules di Firebase Console | Firestore/RTDB/Storage Rules |

---

## **Rollback Plan**
Jika terjadi masalah:
1.  Kembalikan semua file konfigurasi ke versi asli (project "Dashboard Portal")
2.  Test kembali
3.  Jika butuh, upgrade project "Dashboard Portal" ke Blaze Plan
