# Spesifikasi `LockStateManager` EduLock

## 1. Tujuan
Dokumen ini menjelaskan spesifikasi teknis untuk `LockStateManager`, yaitu komponen pusat yang akan menjadi `single source of truth` bagi seluruh keputusan penguncian EduLock Siswa.

Tujuannya:
- menyatukan logika lock dan unlock,
- mengurangi state yang tercecer di banyak file,
- membuat transisi state mudah dibaca dan di-debug,
- menjadi dasar agar enforcement bisa lebih cepat dan lebih konsisten.

---

## 2. Masalah Yang Ingin Diselesaikan

Saat ini keputusan penguncian masih tersebar di beberapa titik:
- `MainActivity`
- `MonitoringService`
- `LockScreenActivity`
- `AntiUninstallService`
- `PreferencesManager`

Akibatnya:
- satu kondisi bisa diputuskan berbeda oleh komponen yang berbeda,
- ada race condition,
- ada lock yang telat karena masing-masing komponen menunggu kondisi sendiri,
- dan sangat sulit melacak keputusan final sistem.

`LockStateManager` hadir untuk menghentikan pola ini.

---

## 3. Tanggung Jawab `LockStateManager`

`LockStateManager` bertanggung jawab untuk:
- menerima snapshot kondisi runtime,
- menerima event perubahan penting,
- menghitung state lock final,
- menyimpan state aktif saat ini,
- mencatat alasan transisi,
- menerbitkan state untuk dipakai `LockEnforcer`, `MainActivity`, `MonitoringService`, dan service accessibility.

`LockStateManager` tidak bertugas untuk:
- menampilkan UI langsung,
- membuka activity,
- menampilkan overlay,
- memanggil `startLockTask()` langsung,
- atau menyimpan data kompleks ke database.

Semua aksi nyata dilakukan komponen lain setelah membaca keputusan dari manager ini.

---

## 4. State Yang Harus Didukung

## 4.1 Enum state utama

```kotlin
enum class LockState {
    UNLOCKED,
    SOFT_LOCKED,
    HARD_LOCKED,
    TEMP_PERMISSION,
    SETTINGS_GRACE,
    UNINSTALL_BYPASS,
    EMERGENCY_UNLOCK,
    HOLIDAY_FREE,
    PROTECTION_OFF
}
```

## 4.2 Makna state
- `UNLOCKED`
  - tidak ada enforcement lock aktif.
- `SOFT_LOCKED`
  - overlay dan redirect aktif, kiosk tidak wajib.
- `HARD_LOCKED`
  - overlay aktif, relaunch aktif, kiosk dicoba, mode proteksi penuh.
- `TEMP_PERMISSION`
  - izin penggunaan HP sedang aktif.
- `SETTINGS_GRACE`
  - sistem sedang membuka layar pengaturan yang sah.
- `UNINSTALL_BYPASS`
  - uninstall atau bypass sah sedang aktif.
- `EMERGENCY_UNLOCK`
  - mode darurat aktif.
- `HOLIDAY_FREE`
  - mode bebas karena libur atau acara.
- `PROTECTION_OFF`
  - proteksi dimatikan admin.

---

## 5. Prioritas State

Jika beberapa kondisi aktif bersamaan, manager harus memilih state dengan prioritas yang jelas.

Urutan prioritas yang disarankan:
1. `UNINSTALL_BYPASS`
2. `EMERGENCY_UNLOCK`
3. `SETTINGS_GRACE`
4. `TEMP_PERMISSION`
5. `HOLIDAY_FREE`
6. `PROTECTION_OFF`
7. `HARD_LOCKED`
8. `SOFT_LOCKED`
9. `UNLOCKED`

Catatan:
- `UNINSTALL_BYPASS` harus mengalahkan lock normal.
- `EMERGENCY_UNLOCK` harus mengalahkan enforcement biasa.
- `SETTINGS_GRACE` harus mencegah false lock saat user diarahkan ke halaman sistem yang sah.
- `HARD_LOCKED` dan `SOFT_LOCKED` baru boleh muncul setelah seluruh kondisi bypass dipastikan tidak aktif.

---

## 6. Snapshot Input Yang Dibutuhkan

`LockStateManager` harus bekerja dari satu model snapshot, misalnya:

```kotlin
data class LockContextSnapshot(
    val isSetupCompleted: Boolean,
    val isProtectionActive: Boolean,
    val isHolidayMode: Boolean,
    val isEmergencyUnlocked: Boolean,
    val isUninstallBypassActive: Boolean,
    val isSettingsGraceActive: Boolean,
    val isPermissionActive: Boolean,
    val isSchoolTime: Boolean,
    val isStrictMode: Boolean,
    val isInsideSchoolZone: Boolean,
    val currentForegroundPackage: String?,
    val isAccessibilityEnabled: Boolean,
    val isOverlayPermissionGranted: Boolean,
    val isDeviceAdminActive: Boolean,
    val isSchoolServiceActive: Boolean,
    val protectionMode: ProtectionMode
)
```

Model ini bisa berkembang, tetapi inti utamanya harus tetap satu snapshot yang mudah diuji.

---

## 7. Event Yang Harus Didukung

Manager harus bisa menerima event seperti:
- `ForegroundPackageChanged`
- `PermissionStatusChanged`
- `HolidayModeChanged`
- `ProtectionStatusChanged`
- `AttendanceStatusChanged`
- `SchoolTimeChanged`
- `LocationZoneChanged`
- `AccessibilityStatusChanged`
- `OverlayPermissionChanged`
- `UninstallBypassChanged`
- `EmergencyUnlockChanged`
- `SchoolServiceStatusChanged`
- `ManualReconcileRequested`

Event ini tidak selalu harus jadi class terpisah, tetapi secara desain harus dianggap ada.

---

## 8. API Minimum Yang Disarankan

Contoh API minimal:

```kotlin
interface LockStateManager {
    fun updateSnapshot(snapshot: LockContextSnapshot)
    fun onForegroundPackageChanged(packageName: String?)
    fun onManualReconcile()
    fun getCurrentState(): LockState
    fun getCurrentDecision(): LockDecision
    fun observeState(): StateFlow<LockDecision>
}
```

Model keputusan:

```kotlin
data class LockDecision(
    val state: LockState,
    val reason: LockReason,
    val shouldShowOverlay: Boolean,
    val shouldRelaunchEduLock: Boolean,
    val shouldAttemptKiosk: Boolean,
    val blockedPackage: String? = null,
    val decidedAt: Long = System.currentTimeMillis()
)
```

---

## 9. `LockReason` Yang Disarankan

Gunakan alasan eksplisit agar logging mudah dibaca:

```kotlin
enum class LockReason {
    NONE,
    APP_NOT_ALLOWED,
    HOME_OR_RECENTS_ESCAPE,
    STRICT_MODE_ACTIVE,
    TEMP_PERMISSION_ACTIVE,
    SETTINGS_GRACE_ACTIVE,
    UNINSTALL_BYPASS_ACTIVE,
    HOLIDAY_MODE_ACTIVE,
    PROTECTION_DISABLED,
    EMERGENCY_UNLOCK_ACTIVE,
    SCHOOL_SERVICE_INACTIVE,
    OUTSIDE_SCHOOL_ZONE,
    OUTSIDE_SCHOOL_TIME
}
```

Alasan ini sangat penting untuk:
- debug lapangan,
- audit false positive,
- dan analisis perilaku sistem.

---

## 10. Aturan Evaluasi State

## 10.1 Aturan unlock prioritas tinggi
Jika salah satu kondisi ini aktif, manager harus mengembalikan state bypass atau unlock:
- setup belum selesai,
- bypass uninstall aktif,
- emergency unlock aktif,
- settings grace aktif,
- permission aktif,
- holiday mode aktif,
- proteksi dimatikan,
- sekolah nonaktif.

## 10.2 Aturan lock dasar
Manager baru boleh mengembalikan `SOFT_LOCKED` atau `HARD_LOCKED` bila:
- setup selesai,
- proteksi aktif,
- bukan bypass,
- bukan emergency,
- bukan settings grace,
- bukan permission aktif,
- bukan holiday mode,
- sekolah aktif,
- sedang jam sekolah,
- strict mode aktif,
- dan foreground package tidak termasuk whitelist.

## 10.3 Penentuan soft atau hard
- jika mode proteksi `SOFT`, hasilnya `SOFT_LOCKED`
- jika mode proteksi `HARD`, hasilnya `HARD_LOCKED`

Jika belum ada mode proteksi eksplisit, sementara bisa default ke `HARD_LOCKED` saat seluruh syarat terpenuhi.

---

## 11. Interaksi Dengan Komponen Lain

## 11.1 `AntiUninstallService`
Peran:
- mengirim package aktif ke manager,
- bukan membuat keputusan lock akhir sendiri.

## 11.2 `MonitoringService`
Peran:
- memperbarui snapshot periodik,
- meminta reconcile,
- memverifikasi apakah state aktual perangkat sesuai dengan keputusan manager.

## 11.3 `MainActivity`
Peran:
- mengirim event lifecycle,
- mengirim status UI foreground,
- membaca keputusan manager untuk jalur yang masih relevan.

## 11.4 `LockEnforcer`
Peran:
- menjalankan aksi berdasarkan `LockDecision`,
- bukan menghitung keputusan.

---

## 12. Logging dan Traceability

Setiap transisi state harus mencatat minimal:
- `previousState`
- `newState`
- `reason`
- `foregroundPackage`
- `decidedAt`
- `snapshot summary`

Contoh log:

```text
LockState transition:
UNLOCKED -> HARD_LOCKED
reason=APP_NOT_ALLOWED
package=com.android.chrome
strictMode=true
insideSchool=true
schoolTime=true
```

Tujuannya:
- memudahkan audit,
- memudahkan identifikasi false positive,
- memudahkan memahami kenapa device dikunci atau dibuka.

---

## 13. Integrasi Dengan Metrik

`LockStateManager` harus menjadi titik awal metrik:
- saat event masuk, manager mencatat `event_received`
- saat decision dikirim ke enforcer, manager mencatat `decision_emitted`

Lalu `LockEnforcer` mencatat:
- `overlay_shown`
- `app_relaunched`
- `locktask_confirmed`

Dengan pola ini, kita bisa tahu:
- apakah delay terjadi saat evaluasi state,
- atau saat enforcement.

---

## 14. Risiko Implementasi

### Risiko 1
Manager terlalu gemuk dan menjadi class serba tahu.

Mitigasi:
- pisahkan policy helper,
- pisahkan provider whitelist,
- pisahkan enforcer dari evaluator.

### Risiko 2
Snapshot tidak sinkron dengan kondisi runtime sesungguhnya.

Mitigasi:
- gunakan `MonitoringService` sebagai reconciler,
- pastikan event penting langsung memperbarui snapshot.

### Risiko 3
Masih ada logika lock lama yang tersisa di file lain.

Mitigasi:
- audit semua jalur lock lama,
- tandai mana yang dipindah ke manager,
- hapus logika lama bertahap setelah jalur baru stabil.

---

## 15. Kriteria Selesai

`LockStateManager` dianggap matang jika:
- seluruh keputusan lock final berasal dari manager,
- `MainActivity`, `MonitoringService`, dan accessibility service tidak lagi membuat keputusan lock besar secara liar,
- state dan reason bisa dibaca dari satu jalur observasi,
- false positive bisa dilacak,
- dan integrasi dengan `LockEnforcer` sudah stabil.

---

## 16. Rekomendasi Implementasi Bertahap

Tahap paling aman:
1. buat model `LockState`, `LockReason`, `LockDecision`, dan `LockContextSnapshot`
2. buat `LockStateManager` dengan evaluasi murni dulu
3. sambungkan accessibility event ke manager
4. sambungkan `MonitoringService` sebagai reconciler
5. sambungkan `LockEnforcer`
6. baru bersihkan logika lock lama yang tumpang tindih

Pendekatan ini lebih aman daripada langsung mengganti semua logika sekaligus.
