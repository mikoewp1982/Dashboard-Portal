package com.sekolah.edulock

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.MotionEvent
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class OverlayLockActivity : AppCompatActivity() {

    private lateinit var tvMessage: TextView
    private lateinit var btnAction: Button
    private val handler = Handler(Looper.getMainLooper())
    private var tapCount = 0
    private var lastTapTime = 0L
    private var isEmergencyDialogShowing = false
    private var isKioskModeActive = false
    private lateinit var lockStateManager: LockStateManager
    private lateinit var lockEnforcer: LockEnforcer
    private lateinit var prefsManager: PreferencesManager

    private val gpsWatchRunnable = object : Runnable {
        override fun run() {
            if (!shouldStayLocked()) {
                stopKioskMode()
                finish()
                return
            }
            handler.postDelayed(this, 1000L)
        }
    }

    private val dismissReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN") {
                // Jangan ditutup paksa selama GPS masih mati — Mode Senyap sering broadcast dismiss.
                if (isGpsRecoveryTarget() && !LocationMonitor(this@OverlayLockActivity, prefsManager).isGpsEnabled()) {
                    return
                }
                stopKioskMode()
                finish()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_overlay_lock)
        lockStateManager = LockStateManager.getInstance(this)
        lockEnforcer = LockEnforcer(this)
        prefsManager = PreferencesManager(this)

        tvMessage = findViewById(R.id.tvLockMessage) // Ensure this ID exists
        btnAction = findViewById(R.id.btnAction) // Ensure this ID exists

        val message = intent.getStringExtra("MESSAGE") ?: "PERANGKAT TERKUNCI!"
        val target = overlayTarget()
        tvMessage.text = message
        btnAction.text = resolveActionLabel(target)

        // Untuk target pengaturan selain accessibility, tetap buka recovery segera.
        // Accessibility sengaja tidak langsung diberi grace; grace baru aktif saat user
        // benar-benar menekan tombol menuju halaman Accessibility Settings.
        if (isAnySettingsRecoveryTarget(target) && target != "accessibility") {
            stopKioskMode()
            val prefsTarget = mapTargetToPrefsConstant(target)
            if (prefsTarget != null) {
                prefsManager.startRecoveryForTarget(prefsTarget, 300_000L)
            } else {
                prefsManager.isSettingsOpen = true
                prefsManager.settingsGraceUntil = System.currentTimeMillis() + 300_000L
            }
        }

        btnAction.setOnClickListener {
            if (isSettingsRecoveryTarget(target)) {
                stopKioskMode()
                val prefsTarget = mapTargetToPrefsConstant(target)
                if (prefsTarget != null) {
                    prefsManager.startRecoveryForTarget(prefsTarget, 300_000L)
                } else {
                    prefsManager.isSettingsOpen = true
                    prefsManager.settingsGraceUntil = System.currentTimeMillis() + 120_000L
                }
            }
            try {
                val targetIntent = resolveTargetIntent(target)
                startActivity(targetIntent)
            } catch (_: Exception) {
                Toast.makeText(this, "Tidak bisa membuka pengaturan.", Toast.LENGTH_SHORT).show()
            }
        }

        val filter = IntentFilter("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(dismissReceiver, filter)
        }

        if (!isAnySettingsRecoveryTarget(target)) {
            handler.postDelayed({
                startKioskMode()
            }, 500)
        }

        handler.post(gpsWatchRunnable)
    }

    private fun showEmergencyUnlockDialog() {
        if (isEmergencyDialogShowing) return
        isEmergencyDialogShowing = true

        val input = EditText(this)
        input.hint = "Password Darurat"
        input.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD

        AlertDialog.Builder(this)
            .setTitle("Mode Darurat")
            .setMessage("Masukkan password darurat harian untuk membuka sementara.")
            .setView(input)
            .setCancelable(false)
            .setPositiveButton("Buka") { _, _ ->
                val password = input.text.toString()
                val prefsManager = PreferencesManager(this)
                val calendar = java.util.Calendar.getInstance()
                val dayOfMonth = calendar.get(java.util.Calendar.DAY_OF_MONTH)
                val dynamicPassword = "EduLock$dayOfMonth"

                if (password == dynamicPassword) {
                    val dbHelper = DatabaseHelper(this)
                    dbHelper.logViolation(
                        prefsManager.nisn,
                        "EMERGENCY_UNLOCK",
                        "Dibuka paksa dengan password manual saat offline/darurat."
                    )

                    prefsManager.isForcedLocation = true
                    prefsManager.isInsideSchoolZone = true
                    prefsManager.isEmergencyUnlocked = true
                    prefsManager.emergencyUnlockTimestamp = System.currentTimeMillis()

                    lockEnforcer.stopKiosk()
                    finish()
                } else {
                    Toast.makeText(this, "Password Salah!", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Batal", null)
            .setOnDismissListener { isEmergencyDialogShowing = false }
            .show()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
            val now = System.currentTimeMillis()

            if (lastTapTime > 0L && now - lastTapTime > 1200L) {
                tapCount = 0
            }
            lastTapTime = now
            tapCount++

            when (tapCount) {
                in 3..6 -> {
                    val remaining = 7 - tapCount
                    Toast.makeText(this, "Ketuk ${remaining}× lagi...", Toast.LENGTH_SHORT).show()
                }
            }

            if (tapCount >= 7) {
                tapCount = 0
                lastTapTime = 0L
                showEmergencyUnlockDialog()
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    override fun onResume() {
        super.onResume()
        
        // Cek Silent Mode
        val prefsManager = PreferencesManager(this)
        prefsManager.isUiForeground = true
        prefsManager.uiForegroundAt = System.currentTimeMillis()

        try {
            val ping = Intent(this, MonitoringService::class.java)
            ping.action = "com.sekolah.edulock.ACTION_UI_FOREGROUND"
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(ping)
            } else {
                startService(ping)
            }
        } catch (_: Exception) {
        }
        if (isAnySettingsRecoveryTarget() && overlayTarget() != "accessibility") {
            // #region debug-point D:onresume-settings-target
            return
        }


        if (!shouldStayLocked()) {
            stopKioskMode()
            finish()
            return
        }

        val decision = lockStateManager.reconcile(lockStateManager.buildSnapshot("overlay.lock.guard"))
        if (decision.shouldAttemptKiosk) {
            startKioskMode()
        } else {
            stopKioskMode()
        }
    }

    override fun onPause() {
        super.onPause()
        prefsManager.isUiForeground = false
        prefsManager.uiForegroundAt = System.currentTimeMillis()
    }

    override fun onStop() {
        super.onStop()
        prefsManager.isUiForeground = false
        prefsManager.uiForegroundAt = System.currentTimeMillis()
    }

    private fun startKioskMode() {
        if (isAnySettingsRecoveryTarget() && overlayTarget() != "accessibility") return
        if (prefsManager.anyRecoveryTargetActive() && overlayTarget() != "accessibility") return
        val prefsManager = PreferencesManager(this)
        if (isKioskModeActive) return
        if (prefsManager.isHolidayMode) return
        // Izinkan kiosk jika shouldStayLocked() true (termasuk offline fail-safe)
        if (!shouldStayLocked()) return
        val now = System.currentTimeMillis()
        if (now < prefsManager.lockTaskCooldownUntil) return

        try {
            val activityManager = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
            val isSystemLocked = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                activityManager.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
            } else {
                @Suppress("DEPRECATION")
                activityManager.isInLockTaskMode
            }
            if (isSystemLocked) {
                isKioskModeActive = true
                return
            }

            if (now - prefsManager.lockTaskLastAttemptAt < LockPolicy.KIOSK_RETRY_MIN_INTERVAL_MS) return
            prefsManager.lockTaskLastAttemptAt = now

            startLockTask()
            isKioskModeActive = true

            handler.postDelayed({
                try {
                    val am = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
                    val locked = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                        am.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
                    } else {
                        @Suppress("DEPRECATION")
                        am.isInLockTaskMode
                    }

                    if (!locked) {
                        isKioskModeActive = false
                        prefsManager.lockTaskCooldownUntil = System.currentTimeMillis() + LockPolicy.KIOSK_FAILURE_COOLDOWN_MS
                    }
                } catch (_: Exception) {
                }
            }, 1500L)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun stopKioskMode() {
        try {
            stopLockTask()
            isKioskModeActive = false
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onBackPressed() {
        // Disable back button
        val target = overlayTarget()
        val message = when (target) {
            "accessibility" -> "HARAP NYALAKAN PROTEKSI!"
            "geofence" -> "KEMBALI KE EDULOCK!"
            else -> "HARAP NYALAKAN GPS / LOKASI!"
        }
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun overlayTarget(): String {
        return intent.getStringExtra("TARGET") ?: "location"
    }

    private fun isGpsRecoveryTarget(target: String = overlayTarget()): Boolean {
        return target == "location" || target == "gps"
    }

    private fun isAnySettingsRecoveryTarget(target: String = overlayTarget()): Boolean {
        return when (target) {
            "location", "gps", "accessibility", "overlay", "battery", "location_permission", "device_admin" -> true
            else -> false
        }
    }

    private fun isSettingsRecoveryTarget(target: String = overlayTarget()): Boolean {
        return isAnySettingsRecoveryTarget(target)
    }

    private fun mapTargetToPrefsConstant(target: String): String? {
        return when (target) {
            "location", "gps" -> PreferencesManager.RECOVERY_TARGET_GPS
            "accessibility" -> PreferencesManager.RECOVERY_TARGET_ACCESSIBILITY
            "overlay" -> PreferencesManager.RECOVERY_TARGET_OVERLAY
            "battery" -> PreferencesManager.RECOVERY_TARGET_BATTERY
            "location_permission" -> PreferencesManager.RECOVERY_TARGET_LOCATION_PERMISSION
            "device_admin" -> PreferencesManager.RECOVERY_TARGET_DEVICE_ADMIN
            else -> null
        }
    }

    private fun resolveActionLabel(target: String): String {
        return when (target) {
            "accessibility" -> "Buka Pengaturan Aksesibilitas"
            "overlay" -> "Buka Pengaturan Tampil di Atas App"
            "battery" -> "Buka Pengaturan Baterai"
            "location_permission" -> "Buka Pengaturan Izin Lokasi"
            "device_admin" -> "Aktifkan Administrator Perangkat"
            "geofence" -> "Kembali ke EduLock"
            else -> "Buka Pengaturan Lokasi"
        }
    }

    private fun resolveTargetIntent(target: String): Intent {
        return when (target) {
            "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            "overlay" -> Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:$packageName")
            )
            "battery" -> Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = android.net.Uri.parse("package:$packageName")
            }
            "location_permission" -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = android.net.Uri.fromParts("package", packageName, null)
            }
            "device_admin" -> {
                val compName = ComponentName(this@OverlayLockActivity, DeviceAdminReceiver::class.java)
                Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, compName)
                }
            }
            "geofence" -> Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            else -> Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
    }

    private fun shouldStayLocked(): Boolean {
        val prefs = if (::prefsManager.isInitialized) prefsManager else PreferencesManager(this)
        if (prefs.isHolidayMode) return false
        if (prefs.isEmergencyUnlocked) return false
        if (prefs.isUninstallBypassActive()) return false
        if (PermissionManager(this).isPermissionActive()) return false

        // Recovery Settings harus tetap tampil walau status proteksi belum sempat sinkron.
        // Ini mencegah overlay Accessibility/Overlay/Battery/Location langsung finish
        // sesaat setelah muncul ketika admin baru saja mengaktifkan proteksi.
        if (isAnySettingsRecoveryTarget() && prefs.anyRecoveryTargetActive()) {
            return true
        }

        if (isGpsRecoveryTarget()) {
            if (!prefs.isSetupCompleted) return false
            return !LocationMonitor(this, prefs).isGpsEnabled()
        }

        // Fail-safe: Jika di jam sekolah dan offline/mode pesawat, tetap harus terkunci
        if (!prefs.isProtectionActive) {
            val scheduleManager = SchoolScheduleManager(prefs)
            if (scheduleManager.isSchoolTime()) {
                val isAirplaneOn = try {
                    android.provider.Settings.Global.getInt(contentResolver, android.provider.Settings.Global.AIRPLANE_MODE_ON, 0) != 0
                } catch (_: Exception) { false }
                val lastOnline = prefs.lastOnlineTimestamp
                val offlineDuration = if (lastOnline > 0) System.currentTimeMillis() - lastOnline else 0L
                val isOfflineTooLong = offlineDuration > 2 * 60 * 1000L

                if (isAirplaneOn || isOfflineTooLong) {
                    return true
                }
            }
            return false
        }

        return true
    }

    override fun onDestroy() {
        handler.removeCallbacks(gpsWatchRunnable)
        try {
            unregisterReceiver(dismissReceiver)
        } catch (_: Exception) {
        }
        super.onDestroy()
    }
}
