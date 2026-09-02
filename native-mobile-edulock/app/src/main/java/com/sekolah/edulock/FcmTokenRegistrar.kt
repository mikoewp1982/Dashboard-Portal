package com.sekolah.edulock

import android.content.Context
import android.util.Log
import com.google.firebase.database.ServerValue
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Menyimpan token FCM ke `active_devices/{schoolId}/{deviceId}` agar admin
 * bisa menembak wake/push (Master Switch) ke HP siswa.
 */
object FcmTokenRegistrar {
    private const val TAG = "FcmTokenRegistrar"
    private const val KEY_LAST_FCM_TOKEN = "last_fcm_token"

    fun refreshAndUpload(context: Context) {
        try {
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token ->
                    if (!token.isNullOrBlank()) {
                        uploadToken(context, token)
                    }
                }
                .addOnFailureListener { e ->
                    Log.w(TAG, "Gagal ambil FCM token: ${e.message}")
                }
        } catch (t: Throwable) {
            Log.w(TAG, "FCM belum siap: ${t.message}")
        }
    }

    fun uploadToken(context: Context, token: String) {
        val trimmed = token.trim()
        if (trimmed.isEmpty()) return

        val prefsManager = PreferencesManager(context)
        val schoolId = prefsManager.schoolId.trim().lowercase()
        val deviceId = prefsManager.deviceId.trim()
        if (schoolId.isEmpty() || deviceId.isEmpty()) return

        val localPrefs = context.getSharedPreferences("EduLockFcm", Context.MODE_PRIVATE)
        val previous = localPrefs.getString(KEY_LAST_FCM_TOKEN, "").orEmpty()
        if (previous == trimmed) {
            // Tetap pastikan node remote punya token (mis. setelah clear data server).
        } else {
            localPrefs.edit().putString(KEY_LAST_FCM_TOKEN, trimmed).apply()
        }

        try {
            val db = SchoolServiceGuard.database(context)
            val updates = hashMapOf<String, Any>(
                "fcmToken" to trimmed,
                "fcmTokenUpdatedAt" to ServerValue.TIMESTAMP
            )
            db.getReference("active_devices")
                .child(schoolId)
                .child(deviceId)
                .updateChildren(updates)
                .addOnSuccessListener {
                    Log.d(TAG, "FCM token tersimpan ke active_devices")
                }
                .addOnFailureListener { e ->
                    Log.w(TAG, "Gagal simpan FCM token: ${e.message}")
                }
        } catch (t: Throwable) {
            Log.w(TAG, "uploadToken error: ${t.message}")
        }
    }
}
