package com.sekolah.edulock

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.Manifest
import android.util.Log
import android.content.Context.ACCESSIBILITY_SERVICE
import android.content.Context.DEVICE_POLICY_SERVICE
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityManager
import android.app.admin.DevicePolicyManager
import androidx.core.content.ContextCompat

class ScreenReceiver : BroadcastReceiver() {

    companion object {
        private const val WAKE_SYNC_THROTTLE_MS = 60_000L
        private const val KEY_LAST_WAKE_SYNC_AT = "last_wake_sync_at"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (BuildConfig.FLAVOR.contains("admin", ignoreCase = true)) return
        if (intent.action != Intent.ACTION_USER_PRESENT && intent.action != Intent.ACTION_SCREEN_ON) return

        Log.d("ScreenReceiver", "User Present / Screen On. Ensuring Service is running + wake-sync.")

        val serviceIntent = Intent(context, MonitoringService::class.java).apply {
            action = MonitoringService.ACTION_FORCE_ENFORCE
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        KeepAliveWorker.schedule(context)
        FcmTokenRegistrar.refreshAndUpload(context)

        // Bangunkan ulang jalur anti-uninstall setelah sleep lama:
        // Accessibility bisa tetap "enabled" di Settings tetapi instance runtime mati / tidak kirim event.
        AntiUninstallService.pokeAfterWakeIfAlive()
        val accessibilityMarkedEnabled = isAccessibilityEnabled(context)
        if (accessibilityMarkedEnabled && !AntiUninstallService.isRuntimeAlive()) {
            Log.w("ScreenReceiver", "Accessibility enabled in Settings but runtime instance is NULL after wake — bringing MainActivity")
            try {
                val wakeUi = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                    putExtra("wake_accessibility_heal", true)
                }
                context.startActivity(wakeUi)
            } catch (t: Throwable) {
                Log.e("ScreenReceiver", "Failed to wake MainActivity for accessibility heal: ${t.message}")
            }
        }

        val prefsManager = PreferencesManager(context)
        // Overlay sering dicabut OEM saat sleep + Mode Senyap; bangunkan UI agar siswa aktifkan lagi
        try {
            val overlayOk = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                android.provider.Settings.canDrawOverlays(context)
            } else {
                true
            }
            if (!overlayOk &&
                prefsManager.isProtectionActive &&
                !prefsManager.isHolidayMode &&
                prefsManager.isSetupCompleted
            ) {
                Log.w("ScreenReceiver", "Overlay permission missing after wake — bringing MainActivity")
                val wakeOverlay = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                    putExtra("force_overlay_recover", true)
                }
                context.startActivity(wakeOverlay)
            }
        } catch (t: Throwable) {
            Log.e("ScreenReceiver", "Overlay wake recover failed: ${t.message}")
        }

        val prefs = prefsManager.prefs
        val lastSync: Long = prefs.getLong(KEY_LAST_WAKE_SYNC_AT, 0L)
        val now: Long = System.currentTimeMillis()
        if ((now - lastSync) < WAKE_SYNC_THROTTLE_MS) return

        // Step 1: self-heal setup_completed (lokal)
        SetupActivity.ensureSetupCompletedIfHealed(context)

        // Step 2: throttle-aware force-flush ke RTDB (jika identitas siswa tersedia)
        try {
            val nisn = prefsManager.nisn
            val schoolId = prefsManager.schoolId
            val deviceId = prefsManager.deviceId
            if (nisn.isNotBlank() && schoolId.isNotBlank() && deviceId.isNotBlank()) {
                val reporter = FirebaseReporter(context, prefsManager)
                val devicePolicyManager = context.getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
                val compName = ComponentName(context, DeviceAdminReceiver::class.java)
                val isAdminActive = devicePolicyManager.isAdminActive(compName)
                val isAccessibilityEnabled = isAccessibilityEnabled(context)
                val accessibilityRuntimeAlive = AntiUninstallService.isRuntimeAlive()
                val health = when {
                    !isAccessibilityEnabled -> "ACCESSIBILITY_OFF"
                    !accessibilityRuntimeAlive -> "ACCESSIBILITY_ZOMBIE"
                    !isAdminActive -> "DEVICE_ADMIN_OFF"
                    else -> "HEALTHY"
                }
                val compliance = if (health == "HEALTHY") "COMPLIANT" else "NON_COMPLIANT"
                reporter.sendStatusUpdate(
                    latitude = 0.0,
                    longitude = 0.0,
                    isInsideZone = true,
                    trustScore = 100,
                    isGpsActive = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED,
                    isInternetActive = true,
                    statusMessage = "Wake-sync via ScreenReceiver",
                    isAccessibilityEnabled = isAccessibilityEnabled,
                    isDeviceAdminEnabled = isAdminActive,
                    isProtectionActive = prefsManager.isProtectionActive,
                    isPermissionActive = false,
                    complianceStatus = compliance,
                    protectionHealth = health,
                    lastProtectionCheckAt = System.currentTimeMillis(),
                    appVersionCode = BuildConfig.VERSION_CODE,
                    isSetupCompleted = prefsManager.isSetupCompleted,
                    forceFlush = true
                )
                prefs.edit().putLong(KEY_LAST_WAKE_SYNC_AT, now).apply()
            }
        } catch (t: Throwable) {
            Log.e("ScreenReceiver", "Wake-sync RTDB failed: ${t.message}")
        }
    }

    private fun isAccessibilityEnabled(context: Context): Boolean {
        val am = context.getSystemService(ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        for (service in enabledServices) {
            if (service.resolveInfo.serviceInfo.packageName == context.packageName &&
                service.resolveInfo.serviceInfo.name.endsWith("AntiUninstallService")) {
                return true
            }
        }
        return false
    }
}
