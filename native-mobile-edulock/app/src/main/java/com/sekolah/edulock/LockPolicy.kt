package com.sekolah.edulock

enum class ProtectionMode {
    SOFT,
    HARD
}

object LockPolicy {
    const val PACKAGE_SWITCH_GRACE_MS = 5_000L
    const val KIOSK_RETRY_MIN_INTERVAL_MS = 10_000L
    const val KIOSK_FAILURE_COOLDOWN_MS = 60_000L
    const val OVERLAY_DEBOUNCE_MS = 1_000L

    fun currentProtectionMode(prefsManager: PreferencesManager): ProtectionMode {
        return if (prefsManager.prefs.getString(KEY_PROTECTION_MODE, ProtectionMode.HARD.name) == ProtectionMode.SOFT.name) {
            ProtectionMode.SOFT
        } else {
            ProtectionMode.HARD
        }
    }

    fun setProtectionMode(prefsManager: PreferencesManager, mode: ProtectionMode) {
        prefsManager.prefs.edit().putString(KEY_PROTECTION_MODE, mode.name).apply()
    }

    private const val KEY_PROTECTION_MODE = "protection_mode"
}
