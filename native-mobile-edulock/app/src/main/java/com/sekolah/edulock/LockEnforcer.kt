package com.sekolah.edulock

import android.content.Context
import android.content.Intent

class LockEnforcer(private val context: Context) {
    private val metricsLogger = LockMetricsLogger()

    fun showLockScreen(message: String, traceId: String? = null) {
        val intent = Intent(context, LockScreenActivity::class.java).apply {
            putExtra("MESSAGE", message)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        traceId?.let { metricsLogger.markOverlayShown(it, message) }
    }

    fun showRecoveryOverlay(message: String, target: String = "location", traceId: String? = null) {
        val intent = Intent(context, OverlayLockActivity::class.java).apply {
            putExtra("MESSAGE", message)
            putExtra("TARGET", target)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        traceId?.let { metricsLogger.markOverlayShown(it, message) }
    }

    fun relaunchEduLock(traceId: String? = null) {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        context.startActivity(launchIntent)
        traceId?.let { metricsLogger.markAppRelaunched(it, context.packageName) }
    }

    fun requestKiosk(traceId: String? = null) {
        val intent = Intent("com.sekolah.edulock.ACTION_START_KIOSK").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
        traceId?.let { metricsLogger.markLockTaskConfirmed(it, success = true) }
    }

    fun stopKiosk() {
        val intent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
    }

    fun dismissLockScreen() {
        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN").apply {
            setPackage(context.packageName)
        }
        context.sendBroadcast(intent)
    }
}
