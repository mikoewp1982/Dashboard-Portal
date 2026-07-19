package com.sekolah.edulock

import android.content.Intent
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_overlay_lock)
        lockStateManager = LockStateManager.getInstance(this)
        lockEnforcer = LockEnforcer(this)

        tvMessage = findViewById(R.id.tvLockMessage) // Ensure this ID exists
        btnAction = findViewById(R.id.btnAction) // Ensure this ID exists

        val message = intent.getStringExtra("MESSAGE") ?: "PERANGKAT TERKUNCI!"
        val target = intent.getStringExtra("TARGET") ?: "location"
        tvMessage.text = message

        btnAction.setOnClickListener {
            try {
                val intent = when (target) {
                    "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                    else -> Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Tidak bisa membuka pengaturan.", Toast.LENGTH_SHORT).show()
            }
        }

        // Delay start kiosk mode to ensure UI is ready
        handler.postDelayed({
            startKioskMode()
        }, 500)
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
    }

    private fun startKioskMode() {
        val prefsManager = PreferencesManager(this)
        if (isKioskModeActive) return
        if (!prefsManager.isProtectionActive) return
        if (prefsManager.isHolidayMode) return
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
        val target = intent.getStringExtra("TARGET") ?: "location"
        val message = if (target == "accessibility") {
            "HARAP NYALAKAN PROTEKSI!"
        } else {
            "HARAP NYALAKAN GPS!"
        }
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun shouldStayLocked(): Boolean {
        val prefs = PreferencesManager(this)
        if (!prefs.isProtectionActive) return false
        if (prefs.isHolidayMode) return false
        if (prefs.isEmergencyUnlocked) return false
        if (prefs.isUninstallBypassActive()) return false
        if (PermissionManager(this).isPermissionActive()) return false
        return true
    }
}
