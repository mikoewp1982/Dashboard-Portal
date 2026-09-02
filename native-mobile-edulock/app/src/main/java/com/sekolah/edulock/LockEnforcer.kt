package com.sekolah.edulock

import android.content.Context
import android.content.Intent

class LockEnforcer(private val context: Context) {
    companion object {
        @Volatile
        private var lastRecoveryOverlayShownAt = 0L
        @Volatile
        private var lastRecoveryOverlayTarget = ""
    }

    private val metricsLogger = LockMetricsLogger()
    private val prefsManager: PreferencesManager by lazy { PreferencesManager(context) }

    /**
     * Gate utama: jika ada recovery target aktif (Accessibility/Overlay/Battery/Location/GPS/DeviceAdmin
     * sedang dalam proses perbaikan dari Settings), JANGAN ganggu dengan kiosk/relaunch agresif.
     * User butuh jeda untuk masuk ke Settings dan mengaktifkan izin tersebut.
     */
    private fun shouldDeferAggressiveLock(now: Long = System.currentTimeMillis()): Boolean {
        return prefsManager.anyRecoveryTargetActive(now) || prefsManager.isForceUpdateRequired
    }

    fun showLockScreen(message: String, traceId: String? = null) {
        if (prefsManager.isForceUpdateRequired) return
        if (GpsEnableOverlay.isRequired(context)) {
            GpsEnableOverlay.show(context, atSchool = true)
            return
        }
        // Accessibility recovery tidak boleh membuka celah bebas memakai HP.
        // Saat target ini belum diperbaiki, tetap paksa layar kunci tampil.
        if (prefsManager.isRecoveryActiveForTarget(PreferencesManager.RECOVERY_TARGET_ACCESSIBILITY)) {
            val intent = Intent(context, LockScreenActivity::class.java).apply {
                putExtra("MESSAGE", message)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            context.startActivity(intent)
            traceId?.let { metricsLogger.markOverlayShown(it, message) }
            return
        }
        if (shouldDeferAggressiveLock()) {
            // Recovery settings sedang berlangsung: cukup pastikan EduLock di-foreground,
            // TAPI JANGAN start kiosk yang akan memblokir tombol Settings.
            relaunchEduLock(traceId)
            return
        }
        relaunchEduLock(traceId)
        requestKiosk(traceId)
    }

    fun showPetDeadLock(traceId: String? = null) {
        val intent = Intent(context, PetDeadLockActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        traceId?.let { metricsLogger.markOverlayShown(it, "PET_DEAD_LOCK") }
    }

    fun showRecoveryOverlay(message: String, target: String = "location", traceId: String? = null) {
        if (target != "gps" && target != "accessibility" && GpsEnableOverlay.isRequired(context)) {
            GpsEnableOverlay.show(context, atSchool = target == "geofence")
            return
        }

        val mappedTarget = when (target) {
            "location", "gps" -> PreferencesManager.RECOVERY_TARGET_GPS
            "accessibility" -> PreferencesManager.RECOVERY_TARGET_ACCESSIBILITY
            "overlay" -> PreferencesManager.RECOVERY_TARGET_OVERLAY
            "battery" -> PreferencesManager.RECOVERY_TARGET_BATTERY
            "location_permission" -> PreferencesManager.RECOVERY_TARGET_LOCATION_PERMISSION
            "device_admin" -> PreferencesManager.RECOVERY_TARGET_DEVICE_ADMIN
            else -> null
        }
        if (mappedTarget != null && target != "accessibility") {
            prefsManager.startRecoveryForTarget(mappedTarget, 300_000L)
        } else if (mappedTarget == null) {
            prefsManager.isSettingsOpen = true
            prefsManager.settingsGraceUntil = System.currentTimeMillis() + 300_000L
        }
        if (target != "accessibility") {
            stopKiosk()
        }

        val now = System.currentTimeMillis()
        if (target == lastRecoveryOverlayTarget && now - lastRecoveryOverlayShownAt < 2_500L) {
            return
        }
        lastRecoveryOverlayShownAt = now
        lastRecoveryOverlayTarget = target

        val intent = Intent(context, OverlayLockActivity::class.java).apply {
            putExtra("MESSAGE", message)
            putExtra("TARGET", target)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        traceId?.let { metricsLogger.markOverlayShown(it, message) }
    }

    fun relaunchEduLock(traceId: String? = null) {
        if (prefsManager.isForceUpdateRequired || shouldDeferAggressiveLock()) {
            // Recovery settings / Force update aktif: JANGAN relaunch yang akan mengganggu navigasi user ke Browser/Settings.
            // Cukup log (tidak ada UI block).
            return
        }
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        traceId?.let { metricsLogger.markAppRelaunched(it, context.packageName) }
    }

    fun requestKiosk(traceId: String? = null) {
        if (prefsManager.isForceUpdateRequired) return
        if (GpsEnableOverlay.isRequired(context)) return
        if (shouldDeferAggressiveLock()) return
        val intent = Intent("com.sekolah.edulock.ACTION_START_KIOSK").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
        traceId?.let { metricsLogger.markLockTaskConfirmed(it, success = true) }
    }

    fun stopKiosk() {
        val intent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
    }

    fun dismissLockScreen() {
        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
    }
}
