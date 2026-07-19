package com.sekolah.edulock

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

class GeofenceCoordinator(private val context: Context) {
    private val appContext = context.applicationContext
    private val prefsManager = PreferencesManager(appContext)
    private val geofencingClient by lazy { LocationServices.getGeofencingClient(appContext) }

    fun syncSchoolGeofence() {
        if (!BuildConfig.USE_GEOFENCING) return
        if (!hasRequiredPermissions()) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isBlank()) return

        val geofence = Geofence.Builder()
            .setRequestId(requestId(schoolId))
            .setCircularRegion(
                prefsManager.schoolLatitude,
                prefsManager.schoolLongitude,
                prefsManager.schoolRadius.toFloat().coerceAtLeast(MIN_RADIUS_METERS)
            )
            .setTransitionTypes(
                Geofence.GEOFENCE_TRANSITION_ENTER or
                    Geofence.GEOFENCE_TRANSITION_EXIT or
                    Geofence.GEOFENCE_TRANSITION_DWELL
            )
            .setLoiteringDelay(DWELL_DELAY_MS)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .build()

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(
                GeofencingRequest.INITIAL_TRIGGER_ENTER or
                    GeofencingRequest.INITIAL_TRIGGER_EXIT
            )
            .addGeofence(geofence)
            .build()

        try {
            geofencingClient.removeGeofences(listOf(requestId(schoolId))).addOnCompleteListener {
                try {
                    geofencingClient.addGeofences(request, geofencePendingIntent())
                        .addOnFailureListener { error ->
                            android.util.Log.e("GeofenceCoordinator", "addGeofences failed: ${error.message}")
                        }
                } catch (error: SecurityException) {
                    android.util.Log.e("GeofenceCoordinator", "Permission denied while adding geofence: ${error.message}")
                }
            }
        } catch (error: SecurityException) {
            android.util.Log.e("GeofenceCoordinator", "Permission denied while syncing geofence: ${error.message}")
        }
    }

    fun clearSchoolGeofence() {
        if (!BuildConfig.USE_GEOFENCING) return
        if (!hasRequiredPermissions()) return

        try {
            geofencingClient.removeGeofences(geofencePendingIntent())
        } catch (error: SecurityException) {
            android.util.Log.e("GeofenceCoordinator", "Permission denied while clearing geofence: ${error.message}")
        }
    }

    private fun geofencePendingIntent(): PendingIntent {
        val intent = Intent(appContext, GeofenceBroadcastReceiver::class.java).apply {
            action = ACTION_GEOFENCE_TRANSITION
            setPackage(appContext.packageName)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getBroadcast(appContext, REQUEST_CODE, intent, flags)
    }

    private fun hasRequiredPermissions(): Boolean {
        val fineLocationGranted =
            ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!fineLocationGranted) return false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val backgroundGranted =
                ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED
            if (!backgroundGranted) return false
        }

        return true
    }

    private fun requestId(schoolId: String): String = "school_geofence_$schoolId"

    companion object {
        const val ACTION_GEOFENCE_TRANSITION = "com.sekolah.edulock.ACTION_GEOFENCE_TRANSITION"
        private const val REQUEST_CODE = 5011
        private const val DWELL_DELAY_MS = 60_000
        private const val MIN_RADIUS_METERS = 50f
    }
}
