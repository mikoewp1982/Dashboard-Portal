package com.sekolah.edulock

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.database.ValueEventListener

/**
 * Layar kunci wajib-update dari Super Admin.
 * Sengaja TIDAK memakai startLockTask agar siswa bisa keluar
 * dan menginstall APK baru dari Browser/Files/WhatsApp.
 */
class ForceUpdateActivity : AppCompatActivity() {

    private lateinit var prefsManager: PreferencesManager
    private lateinit var versionCheckService: VersionCheckService
    private var versionListener: ValueEventListener? = null
    private var currentDownloadUrl: String = VersionCheckService.DEFAULT_EDULOCK_DOWNLOAD_URL

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

        currentDownloadUrl = intent.getStringExtra(EXTRA_DOWNLOAD_URL)
            ?.takeIf { it.isNotBlank() }
            ?: prefsManager.forceUpdateDownloadUrl.takeIf { it.isNotBlank() }
            ?: VersionCheckService.DEFAULT_EDULOCK_DOWNLOAD_URL

        findViewById<TextView>(R.id.tvForceUpdateMessage).text = message

        val btnDownload = findViewById<Button>(R.id.btnDownloadUpdate)
        btnDownload?.setOnClickListener {
            openDownloadUrl(currentDownloadUrl)
        }

        findViewById<Button>(R.id.btnCloseForceUpdate).setOnClickListener {
            finishAffinity()
            moveTaskToBack(true)
        }
    }

    private fun openDownloadUrl(url: String) {
        try {
            val targetUrl = url.trim().ifEmpty { VersionCheckService.DEFAULT_EDULOCK_DOWNLOAD_URL }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Gagal membuka tautan unduh: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
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
            policy.downloadUrl?.let {
                prefsManager.forceUpdateDownloadUrl = it
                currentDownloadUrl = it
            }

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
        const val EXTRA_DOWNLOAD_URL = "DOWNLOAD_URL"
        private const val DEFAULT_MESSAGE =
            "Versi EduLock Anda sudah usang dan dikunci oleh Super Admin.\n\nSilakan unduh APK terbaru melalui tombol di bawah ini, lalu install manual di HP ini."
    }
}
