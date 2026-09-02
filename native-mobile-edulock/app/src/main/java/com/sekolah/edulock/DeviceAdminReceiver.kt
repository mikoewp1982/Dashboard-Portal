package com.sekolah.edulock

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
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
            // Paksa buka MainActivity agar activateDeviceAdmin() terpanggil dari foreground
            try {
                prefsManager.deviceAdminRequestUntil = System.currentTimeMillis() + 60_000L
                val relaunchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                }
                context.startActivity(relaunchIntent)
            } catch (_: Exception) { }
        }
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence? {
        val prefsManager = PreferencesManager(context)
        if (prefsManager.isUninstallBypassActive()) return null

        // Log percobaan (AntiUninstallService Accessibility akan menendang keluar)
        logToDatabase(
            context,
            "DISABLE_ADMIN_ATTEMPTED",
            "User mencoba menonaktifkan Device Admin — Accessibility service akan menendang keluar."
        )

        // TIDAK meluncurkan AdminPasswordActivity — overlay sudah dihapus.
        // Penjagaan dilakukan oleh AntiUninstallService (tendang langsung via Accessibility).
        return null
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
