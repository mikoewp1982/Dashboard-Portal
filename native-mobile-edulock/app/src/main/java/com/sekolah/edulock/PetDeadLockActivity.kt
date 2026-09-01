package com.sekolah.edulock

import android.os.Bundle
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class PetDeadLockActivity : AppCompatActivity() {

    companion object {
        @Volatile
        var isShowing: Boolean = false
            private set
    }

    private lateinit var prefsManager: PreferencesManager
    private lateinit var lockEnforcer: LockEnforcer
    private lateinit var scheduleManager: SchoolScheduleManager
    private val dismissReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN") {
                finishPetDeadLock()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        isShowing = true
        setContentView(R.layout.activity_pet_dead_lock)
        
        prefsManager = PreferencesManager(this)
        lockEnforcer = LockEnforcer(this)
        scheduleManager = SchoolScheduleManager(prefsManager)

        val btnUnderstood = findViewById<Button>(R.id.btnUnderstood)
        btnUnderstood.setOnClickListener {
            // Dismiss temporarily
            prefsManager.lastPetDeadAckAt = System.currentTimeMillis()
            prefsManager.petDeadReminderCount = prefsManager.petDeadReminderCount + 1
            Toast.makeText(this, "Akses dibuka sementara.", Toast.LENGTH_SHORT).show()
            finishPetDeadLock()
        }
    }

    override fun onResume() {
        super.onResume()
        isShowing = true
        if (scheduleManager.isSchoolTime() || prefsManager.isHolidayMode || !prefsManager.isProtectionActive) {
            finishPetDeadLock()
            return
        }
    }

    override fun onStart() {
        super.onStart()
        isShowing = true
        val filter = IntentFilter("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(dismissReceiver, filter)
        }
    }

    override fun onStop() {
        super.onStop()
        try {
            unregisterReceiver(dismissReceiver)
        } catch (_: Exception) {
        }
    }

    override fun onDestroy() {
        isShowing = false
        super.onDestroy()
    }

    private fun finishPetDeadLock() {
        isShowing = false
        finish()
    }

    override fun onBackPressed() {
        Toast.makeText(this, "Anda harus menekan tombol 'Saya Mengerti'", Toast.LENGTH_SHORT).show()
    }
}
