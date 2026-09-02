package com.sekolah.edulock

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener

/**
 * Membaca kebijakan force-update dari Super Admin:
 * RTDB path: app_settings/android
 *  - min_version_code_edulock
 *  - update_message (atau update_message_edulock)
 *  - download_url_edulock (atau download_url)
 *
 * Fail-open: error jaringan / node kosong = tidak mengunci.
 */
class VersionCheckService(private val context: android.content.Context) {

    data class VersionPolicy(
        val updateRequired: Boolean,
        val message: String?,
        val downloadUrl: String? = DEFAULT_EDULOCK_DOWNLOAD_URL
    )

    private val db = SchoolServiceGuard.database(context)
    private val versionRef = db.getReference("app_settings").child("android")

    fun checkOnce(currentVersionCode: Int, onResult: (VersionPolicy) -> Unit) {
        versionRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                onResult(parsePolicy(snapshot, currentVersionCode))
            }

            override fun onCancelled(error: DatabaseError) {
                onResult(VersionPolicy(updateRequired = false, message = null, downloadUrl = DEFAULT_EDULOCK_DOWNLOAD_URL))
            }
        })
    }

    fun startListening(
        currentVersionCode: Int,
        onResult: (VersionPolicy) -> Unit
    ): ValueEventListener {
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                onResult(parsePolicy(snapshot, currentVersionCode))
            }

            override fun onCancelled(error: DatabaseError) {
                // Fail-open: jangan kunci jika listener error
            }
        }
        versionRef.addValueEventListener(listener)
        return listener
    }

    fun stopListening(listener: ValueEventListener?) {
        if (listener != null) {
            try {
                versionRef.removeEventListener(listener)
            } catch (_: Exception) {
            }
        }
    }

    private fun parsePolicy(snapshot: DataSnapshot, currentVersionCode: Int): VersionPolicy {
        if (!snapshot.exists()) {
            return VersionPolicy(updateRequired = false, message = null, downloadUrl = DEFAULT_EDULOCK_DOWNLOAD_URL)
        }

        val minVersion = readFlexibleInt(snapshot.child("min_version_code_edulock"), 0)
        val message = snapshot.child("update_message_edulock").getValue(String::class.java)
            ?.takeIf { it.isNotBlank() }
            ?: snapshot.child("update_message").getValue(String::class.java)

        val downloadUrl = snapshot.child("download_url_edulock").getValue(String::class.java)
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?: snapshot.child("download_url").getValue(String::class.java)
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
            ?: DEFAULT_EDULOCK_DOWNLOAD_URL

        val required = minVersion > 0 && currentVersionCode < minVersion
        return VersionPolicy(updateRequired = required, message = message, downloadUrl = downloadUrl)
    }

    private fun readFlexibleInt(snapshot: DataSnapshot, defaultValue: Int): Int {
        if (!snapshot.exists()) return defaultValue
        try {
            snapshot.getValue(Int::class.java)?.let { return it }
        } catch (_: Exception) {
        }
        try {
            snapshot.getValue(Long::class.java)?.let { return it.toInt() }
        } catch (_: Exception) {
        }
        try {
            val s = snapshot.getValue(String::class.java)?.trim()
            if (!s.isNullOrEmpty()) return s.toInt()
        } catch (_: Exception) {
        }
        return defaultValue
    }

    companion object {
        const val DEFAULT_EDULOCK_DOWNLOAD_URL = "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/edulock/install"
    }
}
