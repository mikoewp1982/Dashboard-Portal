package com.sekolah.edulock

import android.accessibilityservice.AccessibilityService
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import kotlin.math.min

/**
 * Anti-uninstall berbasis Accessibility (jalur event 1.3.19 + watchdog aman).
 *
 * Jangan panggil AccessibilityService.windows dari timer: di beberapa OEM itu
 * membuat service crash/unbind, sehingga Device Admin jadi bebas dibuka.
 */
class AntiUninstallService : AccessibilityService() {

    private val lockStateManager by lazy { LockStateManager.getInstance(this) }
    private val lockEnforcer by lazy { LockEnforcer(this) }
    private val metricsLogger by lazy { LockMetricsLogger() }
    private val devicePolicyManager by lazy { getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager }
    private val compName by lazy { ComponentName(this, DeviceAdminReceiver::class.java) }
    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastKickAt = 0L

    private val watchdogRunnable = object : Runnable {
        override fun run() {
            try {
                scanActiveRoot("watchdog")
            } catch (t: Throwable) {
                Log.w(TAG, "Watchdog failed: ${t.message}")
            } finally {
                mainHandler.postDelayed(this, WATCHDOG_INTERVAL_MS)
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        runtime = this
        Log.i(TAG, "Accessibility connected")
        mainHandler.removeCallbacks(watchdogRunnable)
        mainHandler.post(watchdogRunnable)
    }

    override fun onUnbind(intent: Intent?): Boolean {
        mainHandler.removeCallbacks(watchdogRunnable)
        if (runtime === this) runtime = null
        Log.w(TAG, "Accessibility unbound")
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(watchdogRunnable)
        if (runtime === this) runtime = null
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        try {
            val prefsManager = PreferencesManager(this)
            val now = System.currentTimeMillis()
            val uninstallBypass = prefsManager.isUninstallBypassActive(now)
            val packageName = event.packageName?.toString().orEmpty()

            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && packageName.isNotBlank()) {
                prefsManager.lastForegroundPackage = packageName
            }

            if (!uninstallBypass) {
                val root = rootInActiveWindow
                val rootPkg = root?.packageName?.toString().orEmpty()
                val looksProtected = isProtectedSystemPackage(packageName) || isProtectedSystemPackage(rootPkg)
                if (looksProtected || shouldInspectAnyway(packageName, rootPkg)) {
                    if (kickIfDangerous(root, packageName.ifBlank { rootPkg }, "event:${event.eventType}")) {
                        return
                    }
                    if (root == null) {
                        mainHandler.postDelayed({ scanActiveRoot("retry-null-root") }, 300L)
                    }
                }
            }

            val isSettingsGrace = prefsManager.isSettingsOpen || now < prefsManager.settingsGraceUntil
            val gpsOff = try {
                LocationMonitor(this, prefsManager).isGpsEnabled().not()
            } catch (_: Exception) {
                false
            }
            val shouldSkipWhitelist = !prefsManager.isProtectionActive || uninstallBypass ||
                !prefsManager.isSetupCompleted || prefsManager.isHolidayMode || isSettingsGrace || gpsOff

            if (shouldSkipWhitelist) return

            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                val decision = lockStateManager.onForegroundPackageChanged(packageName)
                if (decision.shouldRelaunchEduLock) {
                    val traceId = metricsLogger.startTrace("accessibility", packageName)
                    metricsLogger.markDecisionEmitted(traceId, decision)
                    lockEnforcer.showLockScreen("PERANGKAT TERKUNCI!\nKembali ke EduLock.", traceId)
                    lockEnforcer.relaunchEduLock(traceId)
                    if (decision.shouldAttemptKiosk) {
                        lockEnforcer.requestKiosk(traceId)
                    }
                    metricsLogger.finishTrace(traceId)
                    Toast.makeText(this, "AKSES DITOLAK! Hanya Aplikasi Sekolah yang diizinkan.", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (t: Throwable) {
            Log.e(TAG, "onAccessibilityEvent crashed: ${t.message}", t)
        }
    }

    fun pokeAfterWake() {
        mainHandler.removeCallbacks(watchdogRunnable)
        mainHandler.post(watchdogRunnable)
        mainHandler.post { scanActiveRoot("wake-poke") }
        mainHandler.postDelayed({ scanActiveRoot("wake-poke-delayed") }, 600L)
    }

    private fun scanActiveRoot(source: String) {
        val root = try {
            rootInActiveWindow
        } catch (_: Exception) {
            null
        }
        val packageName = root?.packageName?.toString().orEmpty()
        
        val looksProtected = isProtectedSystemPackage(packageName)
        if (!looksProtected && !shouldInspectAnyway(packageName, packageName)) {
            return
        }
        
        kickIfDangerous(root, packageName, source)
    }

    private fun kickIfDangerous(
        rootNode: AccessibilityNodeInfo?,
        packageName: String,
        source: String
    ): Boolean {
        if (rootNode == null) return false

        val prefsManager = PreferencesManager(this)
        val now = System.currentTimeMillis()
        if (prefsManager.isUninstallBypassActive(now)) return false

        val isAdminActive = try {
            devicePolicyManager.isAdminActive(compName)
        } catch (_: Exception) {
            true
        }

        if (isAdminActive) {
            prefsManager.deviceAdminRequestUntil = 0L
        }

        // Halaman izin setup (overlay / baterai / aksesibilitas) JANGAN ditendang.
        if (isBenignPermissionSettingsPage(rootNode)) return false

        // GPS mati: izinkan halaman Lokasi agar overlay "Nyalakan GPS" bisa dipakai.
        if (!LocationMonitor(this, prefsManager).isGpsEnabled() && isLocationSettingsPage(rootNode)) {
            prefsManager.isSettingsOpen = true
            prefsManager.settingsGraceUntil = now + 120_000L
            return false
        }

        val uninstallDialog = isEduLockUninstallDialog(rootNode)
        val deviceAdminPage = isEduLockDeviceAdminManagementPage(rootNode)
        val appInfoPage = isEduLockAppInfoPage(rootNode)
        val deviceAdminActivationPage = isEduLockDeviceAdminActivationPage(rootNode)

        // Saat Konfigurasi Awal belum selesai: izinkan Settings untuk Overlay/Baterai/dll.
        // Hanya blok dialog uninstall EduLock (kalau ada).
        if (!prefsManager.isSetupCompleted) {
            if (!uninstallDialog) return false
        }

        val isSettingsGrace = prefsManager.isSettingsOpen || now < prefsManager.settingsGraceUntil
        // Grace setup/izin Settings: jangan tendang halaman app info / settings biasa.
        // Device Admin management + dialog uninstall tetap ditendang setelah setup selesai.
        if (isSettingsGrace && !deviceAdminPage && !uninstallDialog && !deviceAdminActivationPage) {
            return false
        }

        val isDeviceAdminRequest = now < prefsManager.deviceAdminRequestUntil
        val isActivationAllowed =
            !isAdminActive && isDeviceAdminRequest && deviceAdminActivationPage

        val activationPageHasUninstall = hasAnyText(
            rootNode,
            listOf(
                "Uninstal aplikasi", "Uninstal app",
                "Uninstall aplikasi", "Uninstall app",
                "Uninstall", "Copot pemasangan", "Hapus instal",
                "Deactivate & uninstall", "Deactivate and uninstall",
                "Remove device admin"
            )
        )

        // Safety net: Activation page diakses LUAR Setup awal (isDeviceAdminRequest habis)
        // ATAU ada tombol uninstall apa pun di halaman Activation → KICK (bahaya!).
        val isActivationPageDangerous = (deviceAdminActivationPage && !isActivationAllowed) ||
            (deviceAdminActivationPage && activationPageHasUninstall)

        val isDangerousPage =
            uninstallDialog || appInfoPage || deviceAdminPage || isActivationPageDangerous
        if (!isDangerousPage || isActivationAllowed) return false

        if (now - lastKickAt < KICK_DEBOUNCE_MS) return true
        lastKickAt = now

        Log.w(TAG, "KICK anti-uninstall source=$source pkg=$packageName")
        prefsManager.isSettingsOpen = false
        prefsManager.settingsGraceUntil = 0L
        prefsManager.deviceAdminRequestUntil = 0L
        try {
            performGlobalAction(GLOBAL_ACTION_BACK)
        } catch (_: Exception) {
        }
        try {
            performGlobalAction(GLOBAL_ACTION_HOME)
        } catch (_: Exception) {
        }

        try {
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
            }
            startActivity(intent)
        } catch (t: Throwable) {
            Log.e(TAG, "startActivity after kick failed: ${t.message}")
        }
        Toast.makeText(this, "⛔ Akses ditolak! EduLock dilindungi dari penghapusan.", Toast.LENGTH_SHORT).show()
        return true
    }

    /** Overlay / baterai / aksesibilitas: sering ada teks EduLock + tombol Izinkan/Nonaktifkan. */
    private fun isBenignPermissionSettingsPage(rootNode: AccessibilityNodeInfo): Boolean {
        return hasAnyText(
            rootNode,
            listOf(
                "Tampil di atas aplikasi lain",
                "Tampilkan di atas aplikasi lain",
                "Display over other apps",
                "Appear on top",
                "Draw over other apps",
                "Izinkan tampil di atas aplikasi lain",
                "izin menampilkan di atas aplikasi lain",
                "Abaikan pengoptimalan baterai",
                "Optimisasi baterai",
                "Battery optimization",
                "Ignore battery optimizations",
                "Penghemat baterai",
                "Layanan aksesibilitas",
                "Installed services",
                "Layanan terpasang",
                "Layanan terinstal",
                "EduLock Protection"
            )
        )
    }

    private fun isLocationSettingsPage(rootNode: AccessibilityNodeInfo): Boolean {
        return hasAnyText(
            rootNode,
            listOf(
                "Use location",
                "Gunakan lokasi",
                "Location services",
                "Layanan lokasi",
                "Nyalakan lokasi",
                "Turn on location",
                "Location accuracy",
                "Akurasi lokasi",
                "GPS"
            )
        )
    }

    private fun shouldInspectAnyway(eventPkg: String, rootPkg: String): Boolean {
        val merged = "$eventPkg $rootPkg".lowercase()
        return merged.contains("settings") ||
            merged.contains("packageinstaller") ||
            merged.contains("security") ||
            merged.contains("deviceadmin") ||
            merged.contains("safecenter") ||
            merged.contains("systemmanager")
    }

    private fun isProtectedSystemPackage(packageName: String): Boolean {
        val pkg = packageName.lowercase()
        if (pkg.isBlank()) return false
        return pkg.contains("settings") ||
            pkg.contains("packageinstaller") ||
            pkg.contains("permissioncontroller") ||
            pkg.contains("securitycenter") ||
            pkg.contains("safecenter") ||
            pkg.contains("systemmanager") ||
            pkg.contains("deviceadmin") ||
            pkg.contains("samsung.android.sm")
    }

    private fun hasAnyText(rootNode: AccessibilityNodeInfo, keywords: List<String>): Boolean {
        for (keyword in keywords) {
            try {
                if (rootNode.findAccessibilityNodeInfosByText(keyword).isNotEmpty()) return true
            } catch (_: Exception) {
            }
        }
        val blob = collectVisibleText(rootNode)
        return keywords.any { blob.contains(it.lowercase()) }
    }

    private fun collectVisibleText(rootNode: AccessibilityNodeInfo): String {
        val out = StringBuilder()
        fun add(node: AccessibilityNodeInfo?) {
            if (node == null) return
            try {
                out.append(node.text ?: "").append(' ')
                out.append(node.contentDescription ?: "").append(' ')
            } catch (_: Exception) {
            }
        }
        add(rootNode)
        val childCount = try {
            min(rootNode.childCount, 48)
        } catch (_: Exception) {
            0
        }
        for (i in 0 until childCount) {
            val child = try {
                rootNode.getChild(i)
            } catch (_: Exception) {
                null
            } ?: continue
            add(child)
            val grandCount = try {
                min(child.childCount, 24)
            } catch (_: Exception) {
                0
            }
            for (j in 0 until grandCount) {
                val grand = try {
                    child.getChild(j)
                } catch (_: Exception) {
                    null
                } ?: continue
                add(grand)
                try {
                    grand.recycle()
                } catch (_: Exception) {
                }
            }
            try {
                child.recycle()
            } catch (_: Exception) {
            }
        }
        return out.toString().lowercase()
    }

    private fun isEduLockUninstallDialog(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            val uninstallDialogKeywords = listOf(
                "Do you want to uninstall", "mencopot pemasangan",
                "uninstall this app", "hapus aplikasi ini",
                "meng-uninstal", "ingin meng-uninstal", "hapus instalasi",
                "Uninstal aplikasi", "Uninstal app",
                "Uninstall aplikasi", "Uninstall app",
                "Uninstall this", "Uninstall EduLock",
                "Copot pemasangan", "Copot pemasangan aplikasi",
                "Hapus instalan", "Hapus instal", "Hapus pemasangan",
                "Deactivate & uninstall", "Deactivate and uninstall",
                "Uninstall & deactivate", "Remove device admin",
                "Disable this device admin", "Nonaktifkan admin perangkat ini",
                "Uninstal", "Uninstall"
            )
            val hasUninstall = hasAnyText(rootNode, uninstallDialogKeywords)
            val hasAppRef = hasAnyText(rootNode, listOf("EduLock", "com.sekolah.edulock"))
            // Safety net longgar: jika ada keyword "Uninstal/Uninstall" + jelas tentang app kita
            // (meskipun dialog tidak menulis "EduLock" di body, tapi package setting app info
            //  sudah terdeteksi via isEduLockAppInfoPage).
            hasUninstall && (hasAppRef || isEduLockAppInfoPage(rootNode))
        } catch (_: Exception) {
            false
        }
    }

    private fun isEduLockAppInfoPage(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            if (!hasAnyText(rootNode, listOf("EduLock", "com.sekolah.edulock"))) return false

            val isAppListScreen = hasAnyText(
                rootNode,
                listOf(
                    "Kelola aplikasi", "Daftar aplikasi", "Semua aplikasi", "Aplikasi terinstal",
                    "App management", "Manage apps", "All apps", "Installed apps", "App list"
                )
            )
            if (isAppListScreen) return false

            hasAnyText(
                rootNode,
                listOf(
                    "Paksa berhenti", "Force stop",
                    "Copot pemasangan", "Hapus instalan", "Uninstall",
                    "Penyimpanan & cache", "Penyimpanan dan cache", "Storage & cache",
                    "Hapus data", "Clear data", "Clear storage"
                )
            )
        } catch (_: Exception) {
            false
        }
    }

    private fun isEduLockDeviceAdminActivationPage(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            val hasApp = hasAnyText(rootNode, listOf("EduLock", "com.sekolah.edulock"))
            val hasActivate = hasAnyText(
                rootNode,
                listOf(
                    "Aktifkan aplikasi admin perangkat ini",
                    "Activate this device admin app",
                    "Aktifkan",
                    "Activate"
                )
            )
            val hasBlockedKeyword = hasAnyText(
                rootNode,
                listOf("Nonaktifkan", "Deactivate", "Turn off", "Matikan")
            )
            hasApp && hasActivate && !hasBlockedKeyword
        } catch (_: Exception) {
            false
        }
    }

    private fun isEduLockDeviceAdminManagementPage(rootNode: AccessibilityNodeInfo): Boolean {
        return try {
            if (!hasAnyText(rootNode, listOf("EduLock", "com.sekolah.edulock"))) return false

            // Harus ada konteks Device Admin — jangan cocokkan "Disable" sembarangan
            // (halaman Overlay/Baterai sering punya tombol Nonaktifkan/Disable).
            val hasAdminContext = hasAnyText(
                rootNode,
                listOf(
                    "Aplikasi admin perangkat",
                    "Device admin apps",
                    "Device administrators",
                    "Administrator perangkat",
                    "Admin perangkat",
                    "Device admin",
                    "admin perangkat ini",
                    "Remove device admin",
                    "Deactivate & uninstall",
                    "Uninstal aplikasi admin",
                    "Uninstal aplikasi"
                )
            )
            if (!hasAdminContext) return false

            hasAnyText(
                rootNode,
                listOf(
                    "Nonaktifkan",
                    "Deactivate",
                    "Turn off",
                    "Matikan",
                    "Disable this device admin",
                    "Hapus instalasi",
                    "Deactivate & uninstall",
                    "Remove device admin"
                )
            ) || hasAdminContext // daftar admin yang menampilkan EduLock sudah cukup berbahaya
        } catch (_: Exception) {
            false
        }
    }

    override fun onInterrupt() {
        // Required method
    }

    companion object {
        private const val TAG = "AntiUninstall"
        private const val WATCHDOG_INTERVAL_MS = 1_000L
        private const val KICK_DEBOUNCE_MS = 700L

        @Volatile
        private var runtime: AntiUninstallService? = null

        fun isRuntimeAlive(): Boolean = runtime != null

        fun pokeAfterWakeIfAlive() {
            runtime?.pokeAfterWake()
        }
    }
}
