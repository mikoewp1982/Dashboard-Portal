package com.sekolah.edulock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent

class GeofenceBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!BuildConfig.USE_GEOFENCING) return
        if (intent.action != GeofenceCoordinator.ACTION_GEOFENCE_TRANSITION) return

        val event = GeofencingEvent.fromIntent(intent)
        if (event == null || event.hasError()) {
            android.util.Log.e("GeofenceReceiver", "Invalid geofence event")
            return
        }

        val transition = event.geofenceTransition
        val transitionLabel = when (transition) {
            Geofence.GEOFENCE_TRANSITION_ENTER -> "ENTER"
            Geofence.GEOFENCE_TRANSITION_EXIT -> "EXIT"
            Geofence.GEOFENCE_TRANSITION_DWELL -> "DWELL"
            else -> return
        }

        val appContext = context.applicationContext
        val prefsManager = PreferencesManager(appContext)
        val lockStateManager = LockStateManager.getInstance(appContext)
        val lockEnforcer = LockEnforcer(appContext)
        val metricsLogger = LockMetricsLogger()

        prefsManager.lastGeofenceTransition = transitionLabel
        prefsManager.lastGeofenceTransitionAt = System.currentTimeMillis()
        prefsManager.isInsideSchoolZone = transition != Geofence.GEOFENCE_TRANSITION_EXIT

        val traceId = metricsLogger.startTrace("geofence", transitionLabel)
        val decision = lockStateManager.reconcile()

        if (decision.shouldShowOverlay) {
            lockEnforcer.showRecoveryOverlay(
                message = "EduLock aktif: area sekolah terdeteksi ($transitionLabel).",
                target = "geofence",
                traceId = traceId
            )
            if (decision.shouldRelaunchEduLock) {
                lockEnforcer.relaunchEduLock(traceId)
            }
            if (decision.shouldAttemptKiosk) {
                lockEnforcer.requestKiosk(traceId)
            }
            return
        }

        lockEnforcer.dismissLockScreen()
        lockEnforcer.stopKiosk()
    }
}
