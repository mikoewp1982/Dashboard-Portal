package com.sekolah.edulock

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class DeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(
            context,
            "✅ EduLock Device Admin Aktif - Aplikasi terlindungi",
            Toast.LENGTH_LONG
        ).show()

        // Log aktivasi
        logToDatabase(context, "DEVICE_ADMIN_ENABLED", "Device Admin diaktifkan")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        val prefsManager = PreferencesManager(context)
        Toast.makeText(
            context,
            "⚠️ EduLock Device Admin Dinonaktifkan",
            Toast.LENGTH_LONG
        ).show()

        // Log deaktivasi
        logToDatabase(context, "DEVICE_ADMIN_DISABLED", "Device Admin dinonaktifkan")

        if (!prefsManager.isUninstallBypassActive()) {
            val relaunchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            context.startActivity(relaunchIntent)
        }
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence? {
        val prefsManager = PreferencesManager(context)
        if (prefsManager.isUninstallBypassActive()) return null

        // Hindari menarik layar secara agresif dari halaman sistem agar flow tetap stabil.
        // Jika user benar-benar menonaktifkan admin, onDisabled() akan membawa mereka kembali
        // ke EduLock dan MainActivity akan menampilkan prompt Device Admin yang resmi.
        logToDatabase(
            context,
            "DISABLE_ADMIN_ATTEMPTED",
            "User mencoba menonaktifkan Device Admin"
        )

        return """
            ⚠️ PERINGATAN KEAMANAN ⚠️
            
            Menonaktifkan EduLock Device Admin memerlukan PASSWORD ADMIN SEKOLAH.
            
            Hanya guru/admin yang memiliki password ini.
            
            Percobaan menonaktifkan tanpa izin akan dicatat sebagai PELANGGARAN.
        """.trimIndent()
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        // Optional: Track password changes
    }

    override fun onPasswordFailed(context: Context, intent: Intent) {
        super.onPasswordFailed(context, intent)
        // Optional: Track failed password attempts
    }

    private fun logToDatabase(context: Context, type: String, description: String) {
        try {
            val prefsManager = PreferencesManager(context)
            val dbHelper = DatabaseHelper(context)
            val nisn = prefsManager.nisn

            if (nisn.isNotEmpty()) {
                dbHelper.logViolation(nisn, type, description)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
