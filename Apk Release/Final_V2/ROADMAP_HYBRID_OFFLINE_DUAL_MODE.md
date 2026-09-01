# 🚀 Blueprint & Roadmap: Hybrid Dual-Mode Engine (Online & Offline-First)

**Target Aplikasi:** GAS Siswa & EduLock Siswa  
**Lokasi Berkas:** `D:\Dashboard Portal\Apk Release\Final_V2\ROADMAP_HYBRID_OFFLINE_DUAL_MODE.md`  
**Tanggal Rencana:** 2026-09-01  
**Status:** Architecture Blueprint Approved  

---

## 1. 🎯 Tujuan Utama & Nilai Tambah
1. **Bebas Kuota & Tahan Sinyal Lemah:** Aplikasi tetap bekerja 100% di ruang kelas atau sekolah yang minim sinyal internet.
2. **Kecepatan Tinggi (Zero Latency):** Presensi dan penguncian gembok diproses instan secara lokal di HP tanpa menunggu respons jaringan cloud.
3. **Transparansi Siswa & Sekolah:** Menampilkan status sinkronisasi yang jelas dengan tombol interaktif **"Download Data Sekolah"** dan **"Update Data Sekolah"**.

---

## 2. 📱 Antarmuka Pengguna (UI/UX Tombol Data Sekolah)

### A. Kondisi Baru Terpasang (Belum Ada Data Lokal)
```
┌────────────────────────────────────────────────────────┐
│ 🏫 ATURAN SEKOLAH LOKAL                                │
│ Status: ⚠️ Belum Terunduh (Perlu Inisialisasi)         │
│                                                        │
│ [ 📥 Download Data Sekolah ]                           │
└────────────────────────────────────────────────────────┘
```
*Ketika siswa menekan tombol ini saat terhubung internet, aplikasi mengunduh seluruh aturan sekolah ke database lokal HP.*

### B. Kondisi Data Sudah Tersimpan (Siap Digunakan Offline)
```
┌────────────────────────────────────────────────────────┐
│ 🏫 ATURAN SEKOLAH LOKAL                                │
│ Status: 🟢 Siap Digunakan Offline                      │
│ Terakhir Diperbarui: 1 Sept 2026, 07:15 WIB            │
│                                                        │
│ [ 🔄 Update Data Sekolah ]                             │
└────────────────────────────────────────────────────────┘
```
*Jika admin sekolah memperbarui jadwal atau radius di web portal, tombol dapat memunculkan badge notifikasi merah untuk mengupdate.*

---

## 3. 📦 Skema Paket Data Sekolah (School Payload JSON)

Data yang diunduh dan disimpan secara offline:

```json
{
  "schoolId": "SMAN1_PACET",
  "versionHash": "v20260901_071500",
  "updatedAt": 1788242100000,
  "geofence": {
    "latitude": -7.689123,
    "longitude": 112.541234,
    "radiusMeters": 50,
    "strictGpsOnly": true
  },
  "schedule": {
    "mon_thu": { "entry": "07:00", "lateLimit": "07:15", "exit": "15:00" },
    "friday": { "entry": "07:00", "lateLimit": "07:15", "exit": "11:30" }
  },
  "holidays": [
    "2026-08-17", "2026-12-25", "2027-01-01"
  ],
  "worshipRules": {
    "dzuhurDeadline": "15:00",
    "dhuhaAllowed": true,
    "jumatAllowed": true
  },
  "whitelistPackages": [
    "com.satupintu.mobile.siswa",
    "com.google.android.apps.classroom",
    "com.google.android.apps.docs"
  ]
}
```

---

## 4. ⚙️ Logika Eksekusi Dual-Mode

```
                               ┌────────────────────────────────────────┐
                               │         STATE LISTENER JARINGAN        │
                               └───────────────────┬────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   ▼                                                               ▼
           [KONDISI ONLINE]                                                [KONDISI OFFLINE]
     - Real-time RTDB WebSocket active                               - Fallback ke Local SQLite / Room
     - Flush antrean data offline ke server                          - Baca GPS Satelit (Hardware GNSS)
     - Deteksi apakah ada hash versi data baru                       - Enkripsi log presensi ke lokal queue
```

---

## 5. 🛡️ Keamanan Anti-Kecurangan Mode Offline (*Anti-Spoofing*)

1. **Anti-Time Tampering:**
   - Menyimpan `SystemClock.elapsedRealtime()` (waktu uptime hardware HP sejak nyala). Jika jam sistem dimajukan paksa oleh siswa, selisih waktu uptime akan mendeteksi anomali.
   - Mengunci menu Pengaturan Jam & Tanggal melalui `AntiUninstallService.kt`.
2. **Anti-Fake GPS:**
   - Memeriksa flag `location.isFromMockProvider()` dari Android Location Framework.
3. **Tanda Tangan Kriptografi Log Presensi:**
   - Log presensi offline di-hash menggunakan kunci privat lokal sehingga tidak bisa diedit secara manual di database SQLite.

---

## 6. 📅 Rencana Tahapan Implementasi

| Fase | Target Pekerjaan | Estimasi Komponen |
| :---: | :--- | :--- |
| **Fase 1** | Pembuatan Service Sinkronisasi Payload & Room Database di Android | `SchoolPayloadRepository.kt`, `SchoolDatabase.kt` |
| **Fase 2** | UI Tombol "Download / Update Data Sekolah" di GAS & EduLock Siswa | `HomeScreen.kt`, `SetupActivity.kt` |
| **Fase 3** | Implementasi Antrean Presensi Offline (*Store & Forward Queue*) | `OfflineAttendanceWorker.kt` |
| **Fase 4** | Uji Coba Lapangan Mode Pesawat (*Airplane Mode E2E Test*) | Uji device fisik di area sekolah demo |
