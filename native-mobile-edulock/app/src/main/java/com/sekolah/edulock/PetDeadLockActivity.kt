package com.sekolah.edulock

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class PetDeadLockActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var lockEnforcer: LockEnforcer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pet_dead_lock)
        
        prefsManager = PreferencesManager(this)
        lockEnforcer = LockEnforcer(this)

        val btnUnderstood = findViewById<Button>(R.id.btnUnderstood)
        btnUnderstood.setOnClickListener {
            // Dismiss temporarily
            prefsManager.lastPetDeadAckAt = System.currentTimeMillis()
            Toast.makeText(this, "Akses dibuka sementara.", Toast.LENGTH_SHORT).show()
            lockEnforcer.stopKiosk()
            finish()
        }
    }

    override fun onResume() {
        super.onResume()
        startKioskMode()
    }

    private fun startKioskMode() {
        try {
            val activityManager = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
            val isSystemLocked = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                activityManager.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
            } else {
                @Suppress("DEPRECATION")
                activityManager.isInLockTaskMode
            }
            if (!isSystemLocked) {
                startLockTask()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onBackPressed() {
        Toast.makeText(this, "Anda harus menekan tombol 'Saya Mengerti'", Toast.LENGTH_SHORT).show()
    }
}
