package com.sekolah.edulock

import android.content.Intent
import android.os.Build
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Terima push FCM dari admin (Master Switch) agar HP bangkit
 * meski MonitoringService sempat di-kill OEM / pengguna main app lain.
 */
class EduLockMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "onNewToken")
        FcmTokenRegistrar.uploadToken(applicationContext, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val type = message.data["type"].orEmpty()
        Log.d(TAG, "onMessageReceived type=$type")

        when (type) {
            "edulock_master_switch" -> {
                val requestedState = message.data["requestedState"].equals("true", ignoreCase = true)
                val commandId = message.data["commandId"].orEmpty()

                try {
                    val prefs = PreferencesManager(applicationContext)
                    prefs.isProtectionActive = requestedState
                } catch (_: Exception) {
                }

                val serviceIntent = Intent(applicationContext, MonitoringService::class.java).apply {
                    action = MonitoringService.ACTION_FCM_WAKE
                    putExtra(MonitoringService.EXTRA_REQUESTED_PROTECTION, requestedState)
                    putExtra(MonitoringService.EXTRA_COMMAND_ID, commandId)
                }
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        applicationContext.startForegroundService(serviceIntent)
                    } else {
                        applicationContext.startService(serviceIntent)
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "Gagal start MonitoringService dari FCM: ${t.message}")
                }
            }
            "edulock_find_device" -> {
                val commandId = message.data["commandId"].orEmpty()
                val durationMs = message.data["durationMs"]?.toLongOrNull() ?: 45_000L
                val serviceIntent = Intent(applicationContext, MonitoringService::class.java).apply {
                    action = MonitoringService.ACTION_FIND_DEVICE_ALARM
                    putExtra(MonitoringService.EXTRA_COMMAND_ID, commandId)
                    putExtra(MonitoringService.EXTRA_FIND_DEVICE_DURATION_MS, durationMs)
                }
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        applicationContext.startForegroundService(serviceIntent)
                    } else {
                        applicationContext.startService(serviceIntent)
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "Gagal start alarm pencarian device: ${t.message}")
                }
            }
            "edulock_stop_find_device" -> {
                val commandId = message.data["commandId"].orEmpty()
                val serviceIntent = Intent(applicationContext, MonitoringService::class.java).apply {
                    action = MonitoringService.ACTION_STOP_FIND_DEVICE_ALARM
                    putExtra(MonitoringService.EXTRA_COMMAND_ID, commandId)
                }
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        applicationContext.startForegroundService(serviceIntent)
                    } else {
                        applicationContext.startService(serviceIntent)
                    }
                } catch (t: Throwable) {
                    Log.e(TAG, "Gagal menghentikan alarm pencarian device: ${t.message}")
                }
            }
            else -> return
        }
    }

    companion object {
        private const val TAG = "EduLockFcm"
    }
}
