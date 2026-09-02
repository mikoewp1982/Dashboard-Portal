package com.sekolah.edulock

import android.content.Context
import android.content.Intent

/**
 * Escape hatch: selama GPS/Lokasi HP mati, jangan kiosk/lock screen
 * (siswa tidak bisa membuka Pengaturan Lokasi). Tampilkan overlay recovery saja.
 * Setelah GPS nyala, proteksi sekolah berjalan normal.
 */
object GpsEnableOverlay {

    @Volatile
    private var lastShownAt = 0L

    fun isRequired(context: Context): Boolean {
        val prefs = PreferencesManager(context)
        if (!prefs.isSetupCompleted) return false
        if (prefs.isHolidayMode) return false
        if (PermissionManager(context).isPermissionActive()) return false
        if (prefs.isUninstallBypassActive()) return false
        if (prefs.isEmergencyUnlocked) return false
        if (!SchoolScheduleManager(prefs).isSchoolTime()) return false
        return !LocationMonitor(context, prefs).isGpsEnabled()
    }

    fun show(context: Context, atSchool: Boolean = false) {
        val prefs = PreferencesManager(context)
        val now = System.currentTimeMillis()
        prefs.isSettingsOpen = true
        prefs.settingsGraceUntil = now + 120_000L

        LockEnforcer(context).stopKiosk()

        val fg = prefs.lastForegroundPackage.orEmpty().lowercase()
        if (fg.contains("settings")) return
        if (now - lastShownAt < 2_500L) return
        lastShownAt = now

        val title = if (atSchool) {
            "GPS MATI DI AREA SEKOLAH!\nNyalakan GPS dulu. Setelah GPS aktif, proteksi berlanjut."
        } else {
            "GPS MATI!\nNyalakan GPS untuk melanjutkan."
        }
        val message = title + "\n\n" + context.getString(R.string.gps_enable_steps)

        val intent = Intent(context, OverlayLockActivity::class.java).apply {
            putExtra("MESSAGE", message)
            putExtra("TARGET", "gps")
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        context.startActivity(intent)
    }
}
