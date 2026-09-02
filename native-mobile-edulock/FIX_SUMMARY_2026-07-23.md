# Rangkuman Perbaikan EduLock - 23 Juli 2026

## Masalah yang Diperbaiki

### 1. Auto-Lock Tidak Konsisten di Background (KRITIS)
**Gejala:** Saat admin mengaktifkan proteksi (ON) dari Dashboard, layar HP siswa tidak otomatis terkunci jika APK berada di background.

**Akar Masalah yang Ditemukan:**
- **Bug #1: Stale Cache** di `SchoolScheduleManager` - Cache jadwal tidak di-invalidate dengan benar
- **Bug #2: Race Condition** antara listener lama (`schools/{schoolId}/schedule/weekdays`) dan listener baru (`school_settings/{schoolId}/attendance/schedules`)
- **Bug #3: Protection Listener Terlalu Lemah** - Hanya 2x `performChecks()` (immediate + 1s) tidak cukup untuk background

## Perbaikan yang Diterapkan

### File 1: `SchoolScheduleManager.kt`

**Perubahan:**
1. Menambahkan `lastScheduleUpdateTimestamp` dengan setter yang otomatis meng-invalidate cache
2. Menambahkan fungsi `invalidateScheduleCache()` untuk membersihkan cache secara manual

```kotlin
// Timestamp untuk melacak kapan jadwal terakhir di-update dari Firebase.
var lastScheduleUpdateTimestamp: Long = 0L
    set(value) {
        field = value
        // Invalidate cache saat timestamp berubah agar data baru langsung dipakai
        lastScheduleJson = null
        scheduleCache = emptyMap()
    }

fun invalidateScheduleCache() {
    lastScheduleJson = null
    scheduleCache = emptyMap()
}
```

### File 2: `MonitoringService.kt`

**Perubahan 1: Fix Race Condition di Listener Lama**
```kotlin
// FIX RACE CONDITION: Jangan timpa data dari listener baru (school_settings)
// jika listener baru baru saja menulis dalam 30 detik terakhir.
val now = System.currentTimeMillis()
if (now - lastNewScheduleWriteAt < NEW_SCHEDULE_PRIORITY_WINDOW_MS) {
    android.util.Log.d("MonitoringService", "WeekdaySchedule: Skipped (new path has priority)")
    return
}

prefsManager.weekdayScheduleJson = root.toString()
scheduleManager.invalidateScheduleCache() // Invalidate cache
```

**Perubahan 2: Timestamp Tracking di Listener Baru**
```kotlin
if (root.length() > 0) {
    prefsManager.weekdayScheduleJson = root.toString()
    // Catat timestamp write dari jalur baru agar listener lama tidak menimpa
    lastNewScheduleWriteAt = System.currentTimeMillis()
    // Invalidate cache agar data baru langsung dipakai
    scheduleManager.invalidateScheduleCache()
}
```

**Perubahan 3: Aggressive Staged Re-Lock di Protection Listener**
```kotlin
// Invalidate schedule cache untuk memastikan data terbaru
scheduleManager.invalidateScheduleCache()

// 1. Force-refresh isInsideSchoolZone dari lokasi cache terakhir
val cachedLocation = locationMonitor.getCurrentLocation()
if (cachedLocation != null) {
    val isInside = locationMonitor.isInsideSchoolArea()
    prefsManager.isInsideSchoolZone = isInside
} else {
    prefsManager.isInsideSchoolZone = true
}

// 2. Tampilkan lock screen & kiosk
showLockScreen("Proteksi diaktifkan kembali. EduLock mengunci perangkat.")
lockEnforcer.relaunchEduLock()
lockEnforcer.requestKiosk()

// 3. Langsung buka paksa aplikasi ke foreground
val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
startActivity(launchIntent)

// 4. Staged re-lock: 4x percobaan di 1s, 3s, 7s, 15s
val stagingDelays = listOf(1000L, 3000L, 7000L, 15000L)
for (delay in stagingDelays) {
    handler.postDelayed({
        if (prefsManager.isProtectionActive && !prefsManager.isHolidayMode) {
            scheduleManager.invalidateScheduleCache()
            performChecks()
            // Relaunch lagi jika masih dalam jam sekolah
        }
    }, delay)
}
```

## Variabel Baru di MonitoringService

```kotlin
// Timestamp untuk melacak update jadwal dari listener baru (school_settings)
// Mencegah listener lama (schools/schedule/weekdays) menimpa data yang lebih baru.
private var lastNewScheduleWriteAt: Long = 0L
private val NEW_SCHEDULE_PRIORITY_WINDOW_MS = 30_000L // 30 detik prioritas untuk jalur baru
```

## Mekanisme Kerja Perbaikan

1. **Prioritas Jalur Baru:** Jika listener baru (`school_settings`) menulis data dalam 30 detik terakhir, listener lama (`schools`) akan di-skip
2. **Cache Invalidation:** Setiap kali jadwal di-update, cache di `SchoolScheduleManager` di-invalidate agar data terbaru langsung dipakai
3. **Aggressive Re-Lock:** Saat proteksi di-ON-kan, sistem melakukan 4x percobaan lock dalam 15 detik pertama (1s, 3s, 7s, 15s) dengan invalidate cache di setiap percobaan

## Testing yang Disarankan

1. **Test Case 1: Auto-Lock di Background**
   - Matikan proteksi (OFF)
   - Minimize APK EduLock
   - Aktifkan proteksi (ON) dari Dashboard
   - **Expected:** HP terkunci otomatis tanpa perlu buka APK

2. **Test Case 2: Sinkronisasi Jadwal**
   - Ubah jam pulang di Dashboard (misal: 13:30 → 15:30)
   - Tunggu 5 detik
   - **Expected:** APK membaca jam pulang baru (15:30)

3. **Test Case 3: Race Condition**
   - Update jadwal di jalur baru (`school_settings`)
   - Trigger update di jalur lama (`schools`) dalam 5 detik
   - **Expected:** Data dari jalur baru tetap dipakai (tidak tertimpa)

## Catatan Penting

- Perbaikan ini menggunakan pola yang sama dengan `HolidayOFF` listener yang sudah terbukti berhasil
- Window prioritas 30 detik untuk jalur baru mencegah race condition tanpa mengorbankan fallback ke jalur lama
- Staged re-lock 4x dalam 15 detik mengatasi delay GPS refresh, app lifecycle, dan system throttle di background