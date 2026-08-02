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

        val shouldSkipEnforcement = !prefsManager.isProtectionActive || uninstallBypass || !prefsManager.isSetupCompleted || prefsManager.isHolidayMode || isSettingsGrace

        if (shouldSkipEnforcement) {
            // Setup Mode / Settings Grace / Protection OFF: Izinkan user mengaktifkan permission (Overlay, Battery, dll)
            return
        }

        // TRACK FOREGROUND PACKAGE (Untuk Whitelist App Sekolah)
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: ""
            prefsManager.lastForegroundPackage = packageName
            val rootNode = rootInActiveWindow

            if (rootNode != null && handleProtectedAdminScreen(packageName, rootNode, isDeviceAdminRequest, prefsManager)) {
                return
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
                
                // Buka kembali aplikasi EduLock (langsung ke MainActivity agar tidak mampir ke halaman login)
                val intent = Intent(this, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                startActivity(intent)
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

    private fun handleProtectedAdminScreen(
        packageName: String,
        rootNode: AccessibilityNodeInfo,
        isDeviceAdminRequest: Boolean,
        prefsManager: PreferencesManager
    ): Boolean {
        val now = System.currentTimeMillis()
        val isSettingsGrace = prefsManager.isSettingsOpen || now < prefsManager.settingsGraceUntil
        val uninstallBypass = prefsManager.isUninstallBypassActive(now)

        if (!prefsManager.isProtectionActive || uninstallBypass || !prefsManager.isSetupCompleted || prefsManager.isHolidayMode || isSettingsGrace) {
            return false
        }

        if (!isProtectedSystemPackage(packageName)) {
            return false
        }

        if (isDeviceAdminRequest && isEduLockDeviceAdminActivationPage(rootNode)) {
            return false
        }

        val isBlockedAdminPage =
            isEduLockAppInfoPage(rootNode) ||
            isEduLockDeviceAdminManagementPage(rootNode)

        if (!isBlockedAdminPage) {
            return false
        }

        prefsManager.isSettingsOpen = false
        prefsManager.settingsGraceUntil = 0L
        prefsManager.deviceAdminRequestUntil = 0L

        performGlobalAction(GLOBAL_ACTION_BACK)
        performGlobalAction(GLOBAL_ACTION_HOME)

        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)

        Toast.makeText(this, "⛔ Menu Admin Perangkat tidak boleh dibuka. Kembali ke EduLock.", Toast.LENGTH_LONG).show()
        return true
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

    private fun isEduLockDeviceAdminManagementPage(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            val appMentions = listOf("EduLock", "com.sekolah.edulock")
            val deviceAdminKeywords = listOf(
                "Aplikasi admin perangkat",
                "Administrator perangkat",
                "Admin perangkat",
                "Nonaktifkan",
                "Matikan",
                "Turn off",
                "Deactivate",
                "Device admin apps",
                "Device administrators"
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
