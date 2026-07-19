package com.sekolah.edulock

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase

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
        val schoolId = prefs.schoolId
        if (schoolId.isEmpty()) {
            callback(null, "School ID tidak tersedia")
            return
        }

        db.getReference("gas/schools/$schoolId").addListenerForSingleValueEvent(object : com.google.firebase.database.ValueEventListener {
                    override fun onDataChange(snapshot: com.google.firebase.database.DataSnapshot) {
                        if (!snapshot.exists()) {
                            callback(null, "Data sekolah tidak ditemukan")
                            return
                        }
                        
                        val latitude = snapshot.child("latitude").getValue(Double::class.java) ?: -6.200000
                        val longitude = snapshot.child("longitude").getValue(Double::class.java) ?: 106.816666
                        val radius = snapshot.child("radius").getValue(Double::class.java) ?: 100.0

                        callback(
                            ConfigPayload(
                                latitude = latitude,
                                longitude = longitude,
                                radius = radius,
                                source = "firebase_rtdb",
                                attendanceToday = null
                            ),
                            null
                        )
                    }

                    override fun onCancelled(error: com.google.firebase.database.DatabaseError) {
                        callback(null, "Gagal sinkron konfigurasi siswa: ${error.message}")
                    }
                })
    }

    companion object {
        // No longer using BASE_URL
    }
}
