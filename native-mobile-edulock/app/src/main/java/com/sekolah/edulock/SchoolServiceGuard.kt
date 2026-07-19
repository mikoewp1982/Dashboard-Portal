package com.sekolah.edulock

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.FirebaseDatabase

object SchoolServiceGuard {
    fun firebaseApp(context: Context): FirebaseApp = FirebaseApp.getInstance()

    fun database(context: Context): FirebaseDatabase = FirebaseDatabase.getInstance()

    fun auth(context: Context): FirebaseAuth = FirebaseAuth.getInstance()

    fun normalizeSchoolId(value: String?): String = value?.trim()?.lowercase().orEmpty()

    fun readFlexibleBoolean(snapshot: DataSnapshot, defaultValue: Boolean = false): Boolean {
        if (!snapshot.exists()) return defaultValue

        snapshot.getValue(Boolean::class.java)?.let { return it }
        snapshot.getValue(Long::class.java)?.let { return it != 0L }

        val raw = snapshot.getValue(String::class.java)?.trim()?.lowercase() ?: return defaultValue
        return when (raw) {
            "true", "1", "yes", "on" -> true
            "false", "0", "no", "off" -> false
            else -> defaultValue
        }
    }

    fun isSchoolServiceActive(snapshot: DataSnapshot): Boolean {
        val schoolActive = readFlexibleBoolean(snapshot.child("isActive"), true)
        val serviceActive = readFlexibleBoolean(snapshot.child("serviceStatus").child("serviceActive"), true)
        return schoolActive && serviceActive
    }

    fun inactiveMessage(): String = "Layanan sekolah sedang dinonaktifkan oleh Super Admin. Hubungi admin sekolah."
}
