package com.sekolah.edulock

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.database.ValueEventListener

/**
 * Layar kunci wajib-update dari Super Admin.
 * Sengaja TIDAK memakai startLockTask agar siswa bisa keluar
 * dan menginstall APK baru dari Files/WhatsApp.
 */
class ForceUpdateActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var versionCheckService: VersionCheckService
    private var versionListener: ValueEventListener? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_force_update)

        prefsManager = PreferencesManager(this)
        versionCheckService = VersionCheckService(this)

        // Pastikan kiosk tidak menahan instalasi update
        try {
            LockEnforcer(this).stopKiosk()
            stopLockTask()
        } catch (_: Exception) {
        }

        val message = intent.getStringExtra(EXTRA_MESSAGE)
            ?.takeIf { it.isNotBlank() }
            ?: prefsManager.forceUpdateMessage.takeIf { it.isNotBlank() }
            ?: DEFAULT_MESSAGE

        findViewById<TextView>(R.id.tvForceUpdateMessage).text = message
        findViewById<Button>(R.id.btnCloseForceUpdate).setOnClickListener {
            finishAffinity()
        }
    }

    override fun onResume() {
        super.onResume()
        // Jika Super Admin sudah menurunkan min version / user sudah update, lepas layar
        if (!prefsManager.isForceUpdateRequired) {
            finish()
            return
        }
        try {
            LockEnforcer(this).stopKiosk()
        } catch (_: Exception) {
        }
    }

    override fun onStart() {
        super.onStart()
        versionListener = versionCheckService.startListening(BuildConfig.VERSION_CODE) { policy ->
            prefsManager.isForceUpdateRequired = policy.updateRequired
            prefsManager.forceUpdateMessage = policy.message.orEmpty()

            if (!policy.updateRequired) {
                finish()
                return@startListening
            }

            findViewById<TextView>(R.id.tvForceUpdateMessage).text =
                policy.message?.takeIf { it.isNotBlank() }
                    ?: prefsManager.forceUpdateMessage.takeIf { it.isNotBlank() }
                    ?: DEFAULT_MESSAGE
        }
    }

    override fun onStop() {
        super.onStop()
        versionCheckService.stopListening(versionListener)
        versionListener = null
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Blokir back — wajib update
    }

    companion object {
        const val EXTRA_MESSAGE = "MESSAGE"
        private const val DEFAULT_MESSAGE =
            "Versi EduLock Anda sudah usang dan dikunci oleh Super Admin.\n\nSilakan unduh APK terbaru dari Admin Sekolah, lalu install ulang."
    }
}
