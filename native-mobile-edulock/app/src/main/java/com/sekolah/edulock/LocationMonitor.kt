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

        // AUTO-DETECT EMULATOR & FORCE LOCATION
        // Ini menangani kasus di mana user lupa menyalakan mode paksa di emulator
        /*
        if (isEmulator()) {
             // Cek jika lokasi asli jauh dari sekolah (misal > 5000m)
             val realLocation = getRealLocation()
             if (realLocation != null) {
                 val results = FloatArray(1)
                 Location.distanceBetween(
                    realLocation.latitude, realLocation.longitude,
                    prefsManager.schoolLatitude, prefsManager.schoolLongitude,
                    results
                 )
                 
                 // Jika jarak > 2000 meter (2km), asumsikan ini lokasi default emulator (Googleplex dll)
                 if (results[0] > 2000) {
                     // AUTO FORCE!
                     prefsManager.isForcedLocation = true
                     prefsManager.isEmulator = true // Pastikan flag ini aktif
                     
                     val fakeLocation = Location("AUTO_EMULATOR_FIX")
                     fakeLocation.latitude = prefsManager.schoolLatitude
                     fakeLocation.longitude = prefsManager.schoolLongitude
                     fakeLocation.accuracy = 1.0f
                     fakeLocation.time = System.currentTimeMillis()
                     return fakeLocation
                 }
             } else {
                 // Jika lokasi null di emulator, paksa saja biar aman
                 prefsManager.isForcedLocation = true
                 prefsManager.isEmulator = true
                 
                 val fakeLocation = Location("AUTO_EMULATOR_FIX_NULL")
                 fakeLocation.latitude = prefsManager.schoolLatitude
                 fakeLocation.longitude = prefsManager.schoolLongitude
                 fakeLocation.accuracy = 1.0f
                 fakeLocation.time = System.currentTimeMillis()
                 return fakeLocation
             }
        }
        */

        return getRealLocation()
    }

    private fun getRealLocation(): Location? {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return null
        }
        
        // Coba dapatkan lokasi terakhir yang diketahui
        val locationGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        val locationNetwork = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

        val now = System.currentTimeMillis()
        val maxAgeMs = 2 * 60 * 1000L // 2 menit untuk "fresh"

        fun isFresh(loc: Location): Boolean {
            val age = kotlin.math.abs(now - loc.time)
            return age <= maxAgeMs
        }

        val candidates = listOf(locationGPS, locationNetwork).filterNotNull().filter { isFresh(it) }
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

        // FALLBACK: Jika tidak ada lokasi fresh, gunakan cache terakhir (max 30 menit)
        // Ini mencegah isInsideSchoolArea() mengembalikan false saat HP idle lama
        // (misalnya: layar mati selama Mode Acara berlangsung berjam-jam)
        val cachedAge = lastLocation?.let { kotlin.math.abs(now - it.time) } ?: Long.MAX_VALUE
        val maxCacheAgeMs = 30 * 60 * 1000L // 30 menit
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
