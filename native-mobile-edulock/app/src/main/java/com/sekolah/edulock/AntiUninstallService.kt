package com.sekolah.edulock

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import android.content.Intent

class AntiUninstallService : AccessibilityService() {

    private val permissionManager by lazy { PermissionManager(this) }
    private val lockStateManager by lazy { LockStateManager.getInstance(this) }
    private val lockEnforcer by lazy { LockEnforcer(this) }
    private val metricsLogger by lazy { LockMetricsLogger() }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val prefsManager = PreferencesManager(this)
        val now = System.currentTimeMillis()
        val isSettingsGrace = prefsManager.isSettingsOpen || now < prefsManager.settingsGraceUntil
        val isDeviceAdminRequest = now < prefsManager.deviceAdminRequestUntil
        val uninstallBypass = prefsManager.isUninstallBypassActive(now)

        // TRACK FOREGROUND PACKAGE (Untuk Whitelist App Sekolah)
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: ""
            prefsManager.lastForegroundPackage = packageName

            if (isSettingsGrace) {
                return
            }

            if (isDeviceAdminRequest && isProtectedSystemPackage(packageName)) {
                val rootNode = rootInActiveWindow
                if (rootNode != null && isEduLockDeviceAdminActivationPage(rootNode)) {
                    return
                }
            }

            // LOGIKA WHITELIST ENFORCEMENT (Buka Paksa EduLock jika keluar dari Whitelist)
            // Hanya aktif jika Proteksi Aktif DAN Di Sekolah DAN BUKAN Mode Acara/Libur
            val decision = lockStateManager.onForegroundPackageChanged(packageName)
            if (decision.shouldRelaunchEduLock) {
                val traceId = metricsLogger.startTrace("accessibility", packageName)
                metricsLogger.markDecisionEmitted(traceId, decision)
                android.util.Log.d("AntiUninstall", "Blocking package: $packageName state=${decision.state}")
                lockEnforcer.showLockScreen("PERANGKAT TERKUNCI!\nKembali ke EduLock.", traceId)
                lockEnforcer.relaunchEduLock(traceId)
                if (decision.shouldAttemptKiosk) {
                    lockEnforcer.requestKiosk(traceId)
                }
                metricsLogger.finishTrace(traceId)
                Toast.makeText(this, "AKSES DITOLAK! Hanya Aplikasi Sekolah yang diizinkan.", Toast.LENGTH_SHORT).show()
            }
        }

        if (uninstallBypass || !prefsManager.isSetupCompleted || prefsManager.isHolidayMode || isSettingsGrace) {
            // Setup Mode: Izinkan akses ke Settings agar user bisa mengaktifkan permission
            return 
        }

        // Monitor semua package yang relevan dengan Settings atau Installer
        val packageName = event.packageName?.toString() ?: ""
        
        // Daftar package yang perlu diawasi (Settings, Package Installer)
        // Permission Controller DIHAPUS dari blacklist agar runtime permission dialog bisa muncul
        val suspiciousPackages = listOf(
            "com.android.settings",
            "com.google.android.packageinstaller",
            "com.android.packageinstaller"
        )

        // Jika package termasuk yang dicurigai, lakukan pengecekan
        if (suspiciousPackages.any { packageName.contains(it) }) {
            val rootNode = rootInActiveWindow ?: return
            
            // Cek apakah halaman ini adalah halaman detail aplikasi EduLock atau dialog uninstall
            if (isEduLockAppInfoPage(rootNode)) {
                // Blokir akses dengan kembali ke Home atau Back
                performGlobalAction(GLOBAL_ACTION_BACK)
                performGlobalAction(GLOBAL_ACTION_HOME)
                
                Toast.makeText(this, "⛔ DILARANG! Minta Izin Uninstall dari Admin Sekolah dulu.", Toast.LENGTH_LONG).show()
                
                // Buka kembali aplikasi EduLock (BUKAN package settings!)
                val intent = packageManager.getLaunchIntentForPackage("com.sekolah.edulock")
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    startActivity(intent)
                } else {
                    // Fallback jika intent null
                     performGlobalAction(GLOBAL_ACTION_HOME)
                }
            }
        }
    }

    private fun isEduLockAppInfoPage(rootNode: AccessibilityNodeInfo): Boolean {
        try {
            // 1. Cek Spesifik: Dialog Konfirmasi Uninstall
            // "Do you want to uninstall this app?" atau "Apakah Anda ingin mencopot pemasangan aplikasi ini?"
            val uninstallDialogKeywords = listOf(
                "Do you want to uninstall", "mencopot pemasangan",
                "uninstall this app", "hapus aplikasi ini"
            )
            for (keyword in uninstallDialogKeywords) {
                if (rootNode.findAccessibilityNodeInfosByText(keyword).isNotEmpty()) {
                    // Jika dialog muncul, kita asumsikan itu berbahaya jika EduLock baru saja aktif
                    // Tapi lebih aman cek judulnya juga
                    if (rootNode.findAccessibilityNodeInfosByText("EduLock").isNotEmpty()) {
                        return true
                    }
                }
            }

            // 2. Cek Halaman Detail Aplikasi atau Device Admin
            // Cari teks "EduLock"
            val list = rootNode.findAccessibilityNodeInfosByText("EduLock")
            if (list.isNotEmpty()) {

                val deviceAdminScreenKeywords = listOf(
                    "Aplikasi admin perangkat",
                    "Device admin apps",
                    "Device administrators",
                    "Administrator perangkat",
                    "Administrators perangkat",
                    "Admin perangkat"
                )
                for (keyword in deviceAdminScreenKeywords) {
                    val nodes = rootNode.findAccessibilityNodeInfosByText(keyword)
                    if (nodes.isNotEmpty()) {
                        return true
                    }
                }
                
                val keywords = listOf(
                    "Uninstall", "Copot", "Hapus", 
                    "Force stop", "Paksa berhenti", "Berhenti",
                    "Disable", "Nonaktifkan",
                    "Deactivate", "Nonaktifkan admin", // Untuk Device Admin
                    "Device admin", "Administrator perangkat",
                    "Storage", "Penyimpanan", // Mencegah Clear Data
                    "Permissions", "Izin", // Mencegah ubah izin
                    "Open", "Buka" // Tombol Buka biasanya ada di App Info, ini indikator kuat kita di App Info
                )

                for (keyword in keywords) {
                    // Case insensitive search
                    val nodes = rootNode.findAccessibilityNodeInfosByText(keyword)
                    if (nodes.isNotEmpty()) {
                        return true
                    }
                }
            }
        } catch (e: Exception) {
            // Safe fallback
            return false
        }
        
        return false
    }

    private fun isProtectedSystemPackage(packageName: String): Boolean {
        return packageName.contains("com.android.settings") ||
            packageName.contains("com.google.android.packageinstaller") ||
            packageName.contains("com.android.packageinstaller")
    }

    private fun isEduLockDeviceAdminActivationPage(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            val appMentions = listOf("EduLock", "com.sekolah.edulock")
            val deviceAdminKeywords = listOf(
                "Aktifkan aplikasi admin perangkat ini",
                "Administrator perangkat",
                "Admin perangkat",
                "Aplikasi admin perangkat",
                "Activate this device admin app",
                "Device administrator",
                "Device admin"
            )

            val hasApp = appMentions.any { rootNode.findAccessibilityNodeInfosByText(it).isNotEmpty() }
            val hasAdminKeyword = deviceAdminKeywords.any { rootNode.findAccessibilityNodeInfosByText(it).isNotEmpty() }
            hasApp && hasAdminKeyword
        } catch (_: Exception) {
            false
        }
    }

    override fun onInterrupt() {
        // Required method
    }
}
