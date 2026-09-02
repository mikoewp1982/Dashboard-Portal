package com.sekolah.edulock

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Watchdog periodik: hidupkan ulang MonitoringService + refresh FCM token
 * agar EduLock tidak lama OFFLINE saat siswa main app lain.
 */
class KeepAliveWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    override fun doWork(): Result {
        return try {
            if (BuildConfig.FLAVOR.contains("admin", ignoreCase = true)) {
                return Result.success()
            }
            val prefs = PreferencesManager(applicationContext)
            if (!prefs.isRegistered || prefs.nisn.isBlank()) {
                return Result.success()
            }

            val intent = Intent(applicationContext, MonitoringService::class.java).apply {
                action = MonitoringService.ACTION_KEEPALIVE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                applicationContext.startForegroundService(intent)
            } else {
                applicationContext.startService(intent)
            }
            FcmTokenRegistrar.refreshAndUpload(applicationContext)
            Result.success()
        } catch (t: Throwable) {
            Log.w(TAG, "KeepAlive gagal: ${t.message}")
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "KeepAliveWorker"
        private const val UNIQUE_NAME = "edulock_keepalive"

        fun schedule(context: Context) {
            try {
                val request = PeriodicWorkRequestBuilder<KeepAliveWorker>(15, TimeUnit.MINUTES)
                    .setConstraints(
                        Constraints.Builder()
                            .setRequiresBatteryNotLow(false)
                            .build()
                    )
                    .build()
                WorkManager.getInstance(context.applicationContext)
                    .enqueueUniquePeriodicWork(
                        UNIQUE_NAME,
                        ExistingPeriodicWorkPolicy.KEEP,
                        request
                    )
            } catch (t: Throwable) {
                Log.w(TAG, "Gagal schedule KeepAlive: ${t.message}")
            }
        }
    }
}
