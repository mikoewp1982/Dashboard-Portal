package com.sekolah.edulock

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

class StudentRemoteConfigService {
    data class AttendanceToday(
        val dateKey: String,
        val status: String,
        val source: String
    )

    data class ConfigPayload(
        val latitude: Double,
        val longitude: Double,
        val radius: Double,
        val source: String,
        val attendanceToday: AttendanceToday?
    )

    fun fetchConfig(
        auth: FirebaseAuth,
        callback: (ConfigPayload?, String?) -> Unit
    ) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            callback(null, "Sesi siswa belum aktif.")
            return
        }

        val db = FirebaseDatabase.getInstance()
        val prefs = PreferencesManager(SchoolServiceGuard.firebaseApp(auth.app.applicationContext).applicationContext)
        val schoolId = SchoolServiceGuard.normalizeSchoolId(prefs.schoolId)
        if (schoolId.isEmpty()) {
            callback(null, "School ID tidak tersedia")
            return
        }

        db.getReference("schools/$schoolId/config/edulock_geofence")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val dedicatedConfig = parseGeofence(snapshot, "edulock_geofence")
                    if (dedicatedConfig != null) {
                        callback(dedicatedConfig, null)
                    } else {
                        fetchLegacyGasConfig(db, schoolId, callback)
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    // A temporary read failure must not remove the last known
                    // safe configuration. Try the established GAS source.
                    fetchLegacyGasConfig(db, schoolId, callback)
                }
            })
    }

    private fun fetchLegacyGasConfig(
        db: FirebaseDatabase,
        schoolId: String,
        callback: (ConfigPayload?, String?) -> Unit
    ) {
        db.getReference("gas/schools/$schoolId")
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val legacyConfig = parseGeofence(snapshot, "gas_legacy")
                    if (legacyConfig != null) {
                        callback(legacyConfig, null)
                    } else {
                        callback(null, "Data lokasi EduLock belum tersedia")
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    callback(null, "Gagal sinkron konfigurasi siswa: ${error.message}")
                }
            })
    }

    private fun parseGeofence(snapshot: DataSnapshot, source: String): ConfigPayload? {
        if (!snapshot.exists()) return null

        val latitude = readDouble(snapshot.child("latitude")) ?: return null
        val longitude = readDouble(snapshot.child("longitude")) ?: return null
        val radius = readDouble(snapshot.child("radius")) ?: return null
        if (
            latitude !in -90.0..90.0 ||
            longitude !in -180.0..180.0 ||
            radius !in MIN_RADIUS_METERS..MAX_RADIUS_METERS
        ) {
            return null
        }

        return ConfigPayload(
            latitude = latitude,
            longitude = longitude,
            radius = radius,
            source = source,
            attendanceToday = null
        )
    }

    private fun readDouble(snapshot: DataSnapshot): Double? {
        snapshot.getValue(Double::class.java)?.let { return it }
        snapshot.getValue(Long::class.java)?.let { return it.toDouble() }
        return snapshot.getValue(String::class.java)
            ?.trim()
            ?.replace(",", ".")
            ?.toDoubleOrNull()
    }

    companion object {
        private const val MIN_RADIUS_METERS = 50.0
        private const val MAX_RADIUS_METERS = 5000.0
    }
}
