package com.satupintu.mobile.data.service

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

data class ForceUpdatePolicy(
    val updateRequired: Boolean = false,
    val message: String? = null
)

/**
 * Membaca kebijakan force-update Super Admin dari `app_settings/android`.
 * Fail-open: error/network → tidak mengunci aplikasi.
 */
class VersionCheckService {
    private val db = FirebaseDatabase.getInstance()

    fun checkVersion(currentVersionCode: Int, onResult: (isUpdateRequired: Boolean, message: String?) -> Unit) {
        observeVersionPolicy(currentVersionCode, continuous = false) { policy ->
            onResult(policy.updateRequired, policy.message)
        }
    }

    /**
     * @return ValueEventListener yang bisa di-remove oleh caller (untuk continuous=true).
     * Untuk continuous=false, listener one-shot dan return value boleh diabaikan.
     */
    fun observeVersionPolicy(
        currentVersionCode: Int,
        continuous: Boolean = true,
        onResult: (ForceUpdatePolicy) -> Unit
    ): ValueEventListener {
        val versionRef = db.getReference("app_settings/android")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val minVersion = readFlexibleInt(snapshot.child("min_version_code_gas"))
                val updateMessage = snapshot.child("update_message").getValue(String::class.java)
                    ?.trim()
                    ?.takeIf { it.isNotEmpty() }

                onResult(
                    ForceUpdatePolicy(
                        updateRequired = minVersion > 0 && currentVersionCode < minVersion,
                        message = updateMessage
                    )
                )
            }

            override fun onCancelled(error: DatabaseError) {
                // Fail-open: jangan kunci jika Firebase gagal dibaca.
                onResult(ForceUpdatePolicy(updateRequired = false, message = null))
            }
        }

        if (continuous) {
            versionRef.addValueEventListener(listener)
        } else {
            versionRef.addListenerForSingleValueEvent(listener)
        }
        return listener
    }

    fun stopObserving(listener: ValueEventListener) {
        db.getReference("app_settings/android").removeEventListener(listener)
    }

    private fun readFlexibleInt(snapshot: DataSnapshot): Int {
        val raw = snapshot.value ?: return 0
        return when (raw) {
            is Int -> raw
            is Long -> raw.toInt()
            is Double -> raw.toInt()
            is Float -> raw.toInt()
            is String -> raw.trim().toIntOrNull() ?: 0
            else -> 0
        }
    }
}
