package com.satupintu.mobile.data.service

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

data class ForceUpdatePolicy(
    val updateRequired: Boolean = false,
    val message: String? = null,
    val downloadUrl: String? = null
)

/**
 * Membaca kebijakan force-update Super Admin dari `app_settings/android`.
 * Mendukung pembatasan versi terpisah per peran: "siswa", "ortu", "guru", "kepala".
 * Fail-open: error/network → tidak mengunci aplikasi.
 */
class VersionCheckService {
    private val db = FirebaseDatabase.getInstance()

    fun checkVersion(
        currentVersionCode: Int,
        appType: String = "siswa",
        onResult: (isUpdateRequired: Boolean, message: String?) -> Unit
    ) {
        observeVersionPolicy(currentVersionCode, appType = appType, continuous = false) { policy ->
            onResult(policy.updateRequired, policy.message)
        }
    }

    /**
     * @return ValueEventListener yang bisa di-remove oleh caller (untuk continuous=true).
     * Untuk continuous=false, listener one-shot dan return value boleh diabaikan.
     */
    fun observeVersionPolicy(
        currentVersionCode: Int,
        appType: String = "siswa",
        continuous: Boolean = true,
        onResult: (ForceUpdatePolicy) -> Unit
    ): ValueEventListener {
        val versionRef = db.getReference("app_settings/android")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val minKey = when (appType) {
                    "ortu" -> "min_version_code_ortu"
                    "guru" -> "min_version_code_guru"
                    "kepala" -> "min_version_code_kepala"
                    else -> "min_version_code_gas"
                }
                val minVersion = readFlexibleInt(snapshot.child(minKey))

                val customMsgKey = when (appType) {
                    "ortu" -> "update_message_ortu"
                    "guru" -> "update_message_guru"
                    "kepala" -> "update_message_kepala"
                    else -> "update_message"
                }
                val updateMessage = snapshot.child(customMsgKey).getValue(String::class.java)?.trim()?.takeIf { it.isNotEmpty() }
                    ?: snapshot.child("update_message").getValue(String::class.java)?.trim()?.takeIf { it.isNotEmpty() }

                val customUrlKey = when (appType) {
                    "ortu" -> "download_url_ortu"
                    "guru" -> "download_url_guru"
                    "kepala" -> "download_url_kepala"
                    else -> "download_url_gas"
                }
                val defaultUrl = when (appType) {
                    "ortu" -> "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/ortu"
                    "guru" -> "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/guru/install"
                    "kepala" -> "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/kepala/install"
                    else -> "https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/g"
                }
                val downloadUrl = snapshot.child(customUrlKey).getValue(String::class.java)?.trim()?.takeIf { it.isNotEmpty() }
                    ?: defaultUrl

                onResult(
                    ForceUpdatePolicy(
                        updateRequired = minVersion > 0 && currentVersionCode < minVersion,
                        message = updateMessage,
                        downloadUrl = downloadUrl
                    )
                )
            }

            override fun onCancelled(error: DatabaseError) {
                // Fail-open: jangan kunci jika Firebase gagal dibaca.
                onResult(ForceUpdatePolicy(updateRequired = false, message = null, downloadUrl = null))
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
