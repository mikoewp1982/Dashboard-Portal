package com.sekolah.edulock

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.app.ActivityCompat

class LocationMonitor(private val context: Context, private val prefsManager: PreferencesManager) {

    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private var lastLocation: Location? = null
    private var isListening = false

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            lastLocation = location
            prefsManager.lastGpsActiveTimestamp = System.currentTimeMillis()
            updateSchoolPresenceFromLocation(location)
            if (isInsideSchoolArea()) {
                prefsManager.isInsideSchoolZone = true
            }
        }
        override fun onProviderEnabled(provider: String) {
            prefsManager.lastGpsActiveTimestamp = System.currentTimeMillis()
        }
        override fun onProviderDisabled(provider: String) {}
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    }

    fun startListening() {
        if (isListening) return
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        try {
            var registered = false
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    12_000L,
                    12f,
                    locationListener,
                    android.os.Looper.getMainLooper()
                )
                registered = true
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    25_000L,
                    25f,
                    locationListener,
                    android.os.Looper.getMainLooper()
                )
                registered = true
            }
            isListening = registered
            if (registered) {
                android.util.Log.d("LocationMonitor", "Active location updates started")
            } else {
                android.util.Log.w("LocationMonitor", "No location provider enabled; listening not started")
            }
        } catch (e: Exception) {
            android.util.Log.e("LocationMonitor", "Failed to start active location updates: ${e.message}")
        }
    }

    fun stopListening() {
        if (!isListening) return
        try {
            locationManager.removeUpdates(locationListener)
            isListening = false
            android.util.Log.d("LocationMonitor", "Active location updates stopped")
        } catch (_: Exception) {}
    }

    /** True jika saklar Lokasi ON dan setidaknya SATU provider lokasi tersedia (GPS OR Network). */
    fun isGpsEnabled(): Boolean {
        return try {
            val masterOn = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                locationManager.isLocationEnabled
            } else {
                @Suppress("DEPRECATION")
                val mode = android.provider.Settings.Secure.getInt(
                    context.contentResolver,
                    android.provider.Settings.Secure.LOCATION_MODE,
                    android.provider.Settings.Secure.LOCATION_MODE_OFF
                )
                mode != android.provider.Settings.Secure.LOCATION_MODE_OFF
            }
            if (!masterOn) return false
            val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            gpsEnabled || networkEnabled
        } catch (_: Exception) {
            try {
                val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
                gpsEnabled || networkEnabled
            } catch (_: Exception) {
                false
            }
        }
    }

    fun getCurrentLocation(): Location? {
        // Cek Mode Paksa (Emulator/Debug)
        // Batasi penggunaan lokasi paksa HANYA saat emulator aktif
        if (prefsManager.isForcedLocation && prefsManager.isEmulator) {
             val fakeLocation = Location("MOCK_PROVIDER")
             fakeLocation.latitude = prefsManager.schoolLatitude
             fakeLocation.longitude = prefsManager.schoolLongitude
             fakeLocation.accuracy = 1.0f
             fakeLocation.time = System.currentTimeMillis()
             return fakeLocation
        }

        return getRealLocation()
    }

    private fun getRealLocation(): Location? {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return null
        }
        
        // Pastikan listening aktif
        if (!isListening) {
            startListening()
        }

        // Coba dapatkan lokasi terakhir yang diketahui
        val locationGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        val locationNetwork = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

        val now = System.currentTimeMillis()
        val maxAgeMs = 5 * 60 * 1000L // 5 menit untuk "fresh"

        fun isFresh(loc: Location): Boolean {
            val age = kotlin.math.abs(now - loc.time)
            return age <= maxAgeMs
        }

        val candidates = listOf(locationGPS, locationNetwork, lastLocation).filterNotNull().filter { isFresh(it) }
        val bestLocation = when {
            candidates.isEmpty() -> null
            candidates.size == 1 -> candidates.first()
            else -> {
                val sorted = candidates.sortedWith(
                    compareBy<Location> { if (it.hasAccuracy()) it.accuracy else Float.MAX_VALUE }
                        .thenByDescending { it.time }
                )
                sorted.firstOrNull()
            }
        }

        if (bestLocation != null) {
            lastLocation = bestLocation
            return bestLocation
        }

        // FALLBACK: Jika tidak ada lokasi fresh, gunakan cache terakhir (max 60 menit)
        val cachedAge = lastLocation?.let { kotlin.math.abs(now - it.time) } ?: Long.MAX_VALUE
        val maxCacheAgeMs = 60 * 60 * 1000L // 60 menit
        if (cachedAge <= maxCacheAgeMs) {
            android.util.Log.d("LocationMonitor", "Using cached location (age: ${cachedAge / 1000}s)")
            return lastLocation
        }

        return null
    }


    private fun isEmulator(): Boolean {
        return (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic"))
                || android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.FINGERPRINT.startsWith("unknown")
                || android.os.Build.HARDWARE.contains("goldfish")
                || android.os.Build.HARDWARE.contains("ranchu")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.MODEL.contains("Android SDK built for x86")
                || android.os.Build.MANUFACTURER.contains("Genymotion")
                || android.os.Build.PRODUCT.contains("sdk_google")
                || android.os.Build.PRODUCT.contains("google_sdk")
                || android.os.Build.PRODUCT.contains("sdk")
                || android.os.Build.PRODUCT.contains("sdk_x86")
                || android.os.Build.PRODUCT.contains("vbox86p")
                || android.os.Build.PRODUCT.contains("emulator")
                || android.os.Build.PRODUCT.contains("simulator")
                || android.os.Build.PRODUCT.contains("sdk_gphone")
    }


    fun isInsideSchoolArea(): Boolean {
        val currentLocation = getCurrentLocation()
        if (currentLocation == null) {
            return prefsManager.isRecentGeofenceInside()
        }

        val distanceInMeters = distanceToSchoolMeters(currentLocation)
        val schoolRadius = prefsManager.schoolRadius
        if (distanceInMeters <= schoolRadius) return true

        if (prefsManager.isRecentGeofenceOutside()) return false

        // Hybrid konservatif: izinkan toleransi kecil untuk noise GPS jika event ENTER/DWELL masih segar.
        if (prefsManager.isRecentGeofenceInside()) {
            return distanceInMeters <= schoolRadius + nearSchoolBufferMeters()
        }

        return false
    }

    fun nearSchoolBufferMeters(): Double {
        return maxOf(50.0, prefsManager.schoolRadius * 0.15)
    }

    fun distanceToSchoolMeters(location: Location): Float {
        val results = FloatArray(1)
        Location.distanceBetween(
            location.latitude,
            location.longitude,
            prefsManager.schoolLatitude,
            prefsManager.schoolLongitude,
            results
        )
        return results[0]
    }

    /** Within school radius or the hybrid near-school buffer. */
    fun isNearSchool(location: Location): Boolean {
        return distanceToSchoolMeters(location) <= prefsManager.schoolRadius + nearSchoolBufferMeters()
    }

    /**
     * Persist / clear "near school" evidence from a fix.
     * Fresh fix clearly outside clears presence so sick-at-home (GPS on) stays fail-open.
     */
    fun updateSchoolPresenceFromLocation(location: Location?, now: Long = System.currentTimeMillis()) {
        if (location == null) return
        if (isNearSchool(location)) {
            prefsManager.markNearSchool(now)
        } else {
            prefsManager.clearNearSchoolPresence()
        }
    }

    /**
     * Indication the student "should be at school" for GPS-off / offline hard protection:
     * sticky inside, recent geofence ENTER/DWELL, persisted last-near-school, or stale last-known near school.
     */
    fun hasSchoolPresenceIndication(now: Long = System.currentTimeMillis()): Boolean {
        if (prefsManager.isInsideSchoolZone) return true

        // Longer freshness than hybrid location (2 min): presence survives GPS kill after ENTER.
        if (prefsManager.isRecentGeofenceInside(now, freshnessMs = 30 * 60 * 1000L)) return true

        if (prefsManager.hasRecentNearSchoolPresence(now)) return true

        val staleNear = getLastKnownLocationAnyAge(
            maxAgeMs = PreferencesManager.NEAR_SCHOOL_PRESENCE_FRESHNESS_MS
        )
        if (staleNear != null && isNearSchool(staleNear)) {
            prefsManager.markNearSchool(now)
            return true
        }
        return false
    }

    fun shouldEnforcePresenceProtection(now: Long = System.currentTimeMillis()): Boolean {
        return hasSchoolPresenceIndication(now)
    }

    /** Last-known fix without the 2-minute "fresh" filter (presence evidence only). */
    private fun getLastKnownLocationAnyAge(maxAgeMs: Long): Location? {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return null
        }
        val now = System.currentTimeMillis()
        val candidates = listOfNotNull(
            locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER),
            locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER),
            lastLocation
        ).filter { kotlin.math.abs(now - it.time) <= maxAgeMs }

        if (candidates.isEmpty()) return null
        return candidates.sortedWith(
            compareBy<Location> { if (it.hasAccuracy()) it.accuracy else Float.MAX_VALUE }
                .thenByDescending { it.time }
        ).firstOrNull()
    }
}
