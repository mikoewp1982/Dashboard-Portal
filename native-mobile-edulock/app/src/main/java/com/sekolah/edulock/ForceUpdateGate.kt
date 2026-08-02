package com.sekolah.edulock

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.database.ValueEventListener

/**
 * Gate ringan untuk memantau kebijakan force update dari Super Admin
 * dan mengarahkan activity aktif ke ForceUpdateActivity bila perlu.
 */
class ForceUpdateGate(
    private val activity: AppCompatActivity
) {
    private val prefsManager = PreferencesManager(activity)
    private val versionCheckService = VersionCheckService(activity)
    private var versionListener: ValueEventListener? = null

    fun start() {
        launchIfRequired(prefsManager.forceUpdateMessage)

        versionListener = versionCheckService.startListening(BuildConfig.VERSION_CODE) { policy ->
            prefsManager.isForceUpdateRequired = policy.updateRequired
            prefsManager.forceUpdateMessage = policy.message.orEmpty()

            if (policy.updateRequired) {
                launchIfRequired(policy.message)
            }
        }
    }

    fun stop() {
        versionCheckService.stopListening(versionListener)
        versionListener = null
    }

    private fun launchIfRequired(message: String?) {
        if (!prefsManager.isForceUpdateRequired) return
        if (activity is ForceUpdateActivity) return

        val intent = Intent(activity, ForceUpdateActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra(ForceUpdateActivity.EXTRA_MESSAGE, message)
        }
        activity.startActivity(intent)
    }
}
