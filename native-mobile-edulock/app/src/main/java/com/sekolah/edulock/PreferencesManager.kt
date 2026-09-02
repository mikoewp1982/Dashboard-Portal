package com.sekolah.edulock

import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings

class PreferencesManager(context: Context) {

    val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME, Context.MODE_PRIVATE
    )

    init {
        // Hapus logika migrasi lama karena kita ganti KEY_ADMIN_PASSWORD
        // Hal ini akan otomatis memaksa aplikasi menggunakan default value baru
    }

    companion object {
        private const val PREFS_NAME = "EduLockPrefs"

        // Keys
        private const val KEY_NISN = "nisn"
        private const val KEY_STUDENT_NAME = "student_name"
        private const val KEY_CLASS = "class"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_IS_REGISTERED = "is_registered"
        private const val KEY_SCHOOL_ID = "school_id"
        private const val KEY_SCHOOL_NPSN = "school_npsn"
        private const val KEY_STUDENT_REMOTE_KEY = "student_remote_key"
        private const val KEY_STUDENT_USERNAME = "student_username"
        private const val KEY_SCHOOL_LAT = "school_lat"
        private const val KEY_SCHOOL_LON = "school_lon"
        private const val KEY_SCHOOL_RADIUS = "school_radius"
        private const val KEY_SCHOOL_START_HOUR = "school_start_hour"
        private const val KEY_SCHOOL_END_HOUR = "school_end_hour"
        private const val KEY_SCHOOL_START_MINUTE = "school_start_minute"
        private const val KEY_SCHOOL_END_MINUTE = "school_end_minute"
        private const val KEY_WEEKDAY_SCHEDULE_JSON = "weekday_schedule_json"
        private const val KEY_HOLIDAY_LIST_JSON = "holiday_list_json"
        private const val KEY_GPS_OFF_WARN_MS = "gps_off_warn_ms"
        private const val KEY_GPS_OFF_LOCK_MS = "gps_off_lock_ms"
        private const val KEY_ADMIN_PASSWORD = "admin_password_final" // Kunci baru versi final
        private const val KEY_FIRST_LAUNCH = "first_launch"
        private const val KEY_STUDENT_ID = "student_id"
        private const val KEY_UNINSTALL_AUTHORIZED = "uninstall_authorized"
        private const val KEY_UNINSTALL_BYPASS_UNTIL = "uninstall_bypass_until"
        
        // Offline & Monitoring Keys
        private const val KEY_LAST_ONLINE_TIMESTAMP = "last_online_timestamp"
        private const val KEY_OFFLINE_DURATION_ACCUMULATED = "offline_duration_accumulated"
        private const val KEY_TRUST_SCORE = "trust_score"
        private const val KEY_GRACE_PERIOD_END = "grace_period_end"
        private const val KEY_IS_INSIDE_SCHOOL_ZONE = "is_inside_school_zone"
        private const val KEY_LAST_DAILY_SCORE_UPDATE = "last_daily_score_update"
        private const val KEY_VIOLATION_STREAK = "violation_streak"
        private const val KEY_LAST_GPS_ACTIVE_TIMESTAMP = "last_gps_active_timestamp"
        private const val KEY_IS_HOLIDAY_MODE = "is_holiday_mode"
        private const val KEY_IS_EMULATOR = "is_emulator"
        private const val KEY_IS_FORCED_LOCATION = "is_forced_location"
        private const val KEY_IS_SETTINGS_OPEN = "is_settings_open"
        private const val KEY_SETTINGS_GRACE_UNTIL = "settings_grace_until"
        private const val KEY_DEVICE_ADMIN_REQUEST_UNTIL = "device_admin_request_until"
        private const val KEY_IS_PROTECTION_ACTIVE = "is_protection_active"
        private const val KEY_SETUP_COMPLETED = "setup_completed"
        private const val KEY_UI_FOREGROUND = "ui_foreground"
        private const val KEY_UI_FOREGROUND_AT = "ui_foreground_at"
        private const val KEY_LAST_FOREGROUND_PACKAGE = "last_foreground_package"
        private const val KEY_APP_SWITCH_TIMESTAMP = "app_switch_timestamp"
        private const val KEY_LOCKTASK_COOLDOWN_UNTIL = "locktask_cooldown_until"
        private const val KEY_LOCKTASK_LAST_ATTEMPT_AT = "locktask_last_attempt_at"
        private const val KEY_FORCE_UPDATE_REQUIRED = "force_update_required"
        private const val KEY_FORCE_UPDATE_MESSAGE = "force_update_message"
        private const val KEY_FORCE_UPDATE_DOWNLOAD_URL = "force_update_download_url"
        private const val KEY_DAILY_ATTENDANCE_DATE_KEY = "daily_attendance_date_key"
        private const val KEY_DAILY_ATTENDANCE_STATUS = "daily_attendance_status"
        private const val KEY_LAST_GEOFENCE_TRANSITION = "last_geofence_transition"
        private const val KEY_LAST_GEOFENCE_TRANSITION_AT = "last_geofence_transition_at"
        private const val KEY_LAST_NEAR_SCHOOL_AT = "last_near_school_at"
        private const val KEY_IS_PET_DEAD = "is_pet_dead"
        private const val KEY_LAST_PET_DEAD_ACK_AT = "last_pet_dead_ack_at"
        private const val KEY_PET_DEAD_REMINDER_COUNT = "pet_dead_reminder_count"
        private const val KEY_PET_DEAD_REMINDER_FIRST_MS = "pet_dead_reminder_first_ms"
        private const val KEY_PET_DEAD_REMINDER_SECOND_MS = "pet_dead_reminder_second_ms"
        private const val KEY_PET_DEAD_REMINDER_REPEAT_MS = "pet_dead_reminder_repeat_ms"
        private const val KEY_SCHOOL_SERVICE_EXIT_AT = "school_service_exit_at"

        // ===== Recovery Target-Specific Grace Keys (PR Bug: Settings Recovery Family) =====
        // Targets: accessibility, overlay, battery, location_permission, gps, device_admin
        // Tujuannya: setiap izin punya state recovery SENDIRI,
        // sehingga recovery GPS tidak meng-clear recovery Accessibility (dan sebaliknya).
        const val RECOVERY_TARGET_ACCESSIBILITY = "accessibility"
        const val RECOVERY_TARGET_OVERLAY = "overlay"
        const val RECOVERY_TARGET_BATTERY = "battery"
        const val RECOVERY_TARGET_LOCATION_PERMISSION = "location_permission"
        const val RECOVERY_TARGET_GPS = "gps"
        const val RECOVERY_TARGET_DEVICE_ADMIN = "device_admin"
        private const val KEY_PREFIX_RECOVERY_ACTIVE = "recovery_active_"
        private const val KEY_PREFIX_RECOVERY_GRACE_UNTIL = "recovery_grace_until_"

        /** Default TTL for "last fix near school" presence evidence (covers a school day). */
        const val NEAR_SCHOOL_PRESENCE_FRESHNESS_MS = 12 * 60 * 60 * 1000L
    }

    var isForceUpdateRequired: Boolean
        get() = prefs.getBoolean(KEY_FORCE_UPDATE_REQUIRED, false)
        set(value) = prefs.edit().putBoolean(KEY_FORCE_UPDATE_REQUIRED, value).apply()

    var forceUpdateMessage: String
        get() = prefs.getString(KEY_FORCE_UPDATE_MESSAGE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_FORCE_UPDATE_MESSAGE, value).apply()

    var forceUpdateDownloadUrl: String
        get() = prefs.getString(KEY_FORCE_UPDATE_DOWNLOAD_URL, VersionCheckService.DEFAULT_EDULOCK_DOWNLOAD_URL)
            ?: VersionCheckService.DEFAULT_EDULOCK_DOWNLOAD_URL
        set(value) = prefs.edit().putString(KEY_FORCE_UPDATE_DOWNLOAD_URL, value).apply()

    var isPetDead: Boolean
        get() = prefs.getBoolean(KEY_IS_PET_DEAD, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PET_DEAD, value).apply()

    var lastPetDeadAckAt: Long
        get() = prefs.getLong(KEY_LAST_PET_DEAD_ACK_AT, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_PET_DEAD_ACK_AT, value).apply()

    var petDeadReminderCount: Int
        get() = prefs.getInt(KEY_PET_DEAD_REMINDER_COUNT, 0)
        set(value) = prefs.edit().putInt(KEY_PET_DEAD_REMINDER_COUNT, value.coerceAtLeast(0)).apply()

    var petDeadReminderFirstMs: Long
        get() = prefs.getLong(KEY_PET_DEAD_REMINDER_FIRST_MS, 30 * 60 * 1000L)
        set(value) = prefs.edit().putLong(KEY_PET_DEAD_REMINDER_FIRST_MS, value.coerceAtLeast(60_000L)).apply()

    var petDeadReminderSecondMs: Long
        get() = prefs.getLong(KEY_PET_DEAD_REMINDER_SECOND_MS, 20 * 60 * 1000L)
        set(value) = prefs.edit().putLong(KEY_PET_DEAD_REMINDER_SECOND_MS, value.coerceAtLeast(60_000L)).apply()

    var petDeadReminderRepeatMs: Long
        get() = prefs.getLong(KEY_PET_DEAD_REMINDER_REPEAT_MS, 10 * 60 * 1000L)
        set(value) = prefs.edit().putLong(KEY_PET_DEAD_REMINDER_REPEAT_MS, value.coerceAtLeast(60_000L)).apply()

    var lockTaskCooldownUntil: Long
        get() = prefs.getLong(KEY_LOCKTASK_COOLDOWN_UNTIL, 0L)
        set(value) = prefs.edit().putLong(KEY_LOCKTASK_COOLDOWN_UNTIL, value).apply()

    var lockTaskLastAttemptAt: Long
        get() = prefs.getLong(KEY_LOCKTASK_LAST_ATTEMPT_AT, 0L)
        set(value) = prefs.edit().putLong(KEY_LOCKTASK_LAST_ATTEMPT_AT, value).apply()

    var dailyAttendanceDateKey: String
        get() = prefs.getString(KEY_DAILY_ATTENDANCE_DATE_KEY, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DAILY_ATTENDANCE_DATE_KEY, value).apply()

    var dailyAttendanceStatus: String
        get() = prefs.getString(KEY_DAILY_ATTENDANCE_STATUS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DAILY_ATTENDANCE_STATUS, value).apply()

    var lastGeofenceTransition: String
        get() = prefs.getString(KEY_LAST_GEOFENCE_TRANSITION, "") ?: ""
        set(value) = prefs.edit().putString(KEY_LAST_GEOFENCE_TRANSITION, value).apply()

    var lastGeofenceTransitionAt: Long
        get() = prefs.getLong(KEY_LAST_GEOFENCE_TRANSITION_AT, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_GEOFENCE_TRANSITION_AT, value).apply()

    fun isRecentGeofenceInside(now: Long = System.currentTimeMillis(), freshnessMs: Long = 2 * 60 * 1000L): Boolean {
        if (!BuildConfig.USE_GEOFENCING) return false
        val transitionAt = lastGeofenceTransitionAt
        if (transitionAt <= 0L || now - transitionAt > freshnessMs) return false
        return lastGeofenceTransition == "ENTER" || lastGeofenceTransition == "DWELL"
    }

    fun isRecentGeofenceOutside(now: Long = System.currentTimeMillis(), freshnessMs: Long = 2 * 60 * 1000L): Boolean {
        if (!BuildConfig.USE_GEOFENCING) return false
        val transitionAt = lastGeofenceTransitionAt
        if (transitionAt <= 0L || now - transitionAt > freshnessMs) return false
        return lastGeofenceTransition == "EXIT"
    }

    var lastNearSchoolAt: Long
        get() = prefs.getLong(KEY_LAST_NEAR_SCHOOL_AT, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_NEAR_SCHOOL_AT, value).apply()

    fun markNearSchool(now: Long = System.currentTimeMillis()) {
        lastNearSchoolAt = now
    }

    fun clearNearSchoolPresence() {
        lastNearSchoolAt = 0L
    }

    fun hasRecentNearSchoolPresence(
        now: Long = System.currentTimeMillis(),
        freshnessMs: Long = NEAR_SCHOOL_PRESENCE_FRESHNESS_MS
    ): Boolean {
        val at = lastNearSchoolAt
        return at > 0L && now - at <= freshnessMs
    }

    var appSwitchTimestamp: Long
        get() = prefs.getLong(KEY_APP_SWITCH_TIMESTAMP, 0L)
        set(value) = prefs.edit().putLong(KEY_APP_SWITCH_TIMESTAMP, value).apply()

    var lastForegroundPackage: String?
        get() = prefs.getString(KEY_LAST_FOREGROUND_PACKAGE, null)
        set(value) = prefs.edit().putString(KEY_LAST_FOREGROUND_PACKAGE, value).apply()

    var isProtectionActive: Boolean
        get() = prefs.getBoolean(KEY_IS_PROTECTION_ACTIVE, true) // Default TRUE (Active Mode)
        set(value) = prefs.edit().putBoolean(KEY_IS_PROTECTION_ACTIVE, value).apply()

    var isSetupCompleted: Boolean
        get() = prefs.getBoolean(KEY_SETUP_COMPLETED, false)
        set(value) = prefs.edit().putBoolean(KEY_SETUP_COMPLETED, value).apply()

    var isUiForeground: Boolean
        get() = prefs.getBoolean(KEY_UI_FOREGROUND, false)
        set(value) = prefs.edit().putBoolean(KEY_UI_FOREGROUND, value).apply()

    var uiForegroundAt: Long
        get() = prefs.getLong(KEY_UI_FOREGROUND_AT, 0L)
        set(value) = prefs.edit().putLong(KEY_UI_FOREGROUND_AT, value).apply()

    var isSettingsOpen: Boolean
        get() = prefs.getBoolean(KEY_IS_SETTINGS_OPEN, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_SETTINGS_OPEN, value).apply()

    var settingsGraceUntil: Long
        get() = prefs.getLong(KEY_SETTINGS_GRACE_UNTIL, 0L)
        set(value) = prefs.edit().putLong(KEY_SETTINGS_GRACE_UNTIL, value).apply()

    var deviceAdminRequestUntil: Long
        get() = prefs.getLong(KEY_DEVICE_ADMIN_REQUEST_UNTIL, 0L)
        set(value) = prefs.edit().putLong(KEY_DEVICE_ADMIN_REQUEST_UNTIL, value).apply()

    var isEmulator: Boolean
        get() = prefs.getBoolean(KEY_IS_EMULATOR, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_EMULATOR, value).apply()

    var isForcedLocation: Boolean
        get() = prefs.getBoolean(KEY_IS_FORCED_LOCATION, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_FORCED_LOCATION, value).apply()

    var isEmergencyUnlocked: Boolean
        get() = prefs.getBoolean("is_emergency_unlocked", false)
        set(value) = prefs.edit().putBoolean("is_emergency_unlocked", value).apply()

    var emergencyUnlockTimestamp: Long
        get() = prefs.getLong("emergency_unlock_timestamp", 0L)
        set(value) = prefs.edit().putLong("emergency_unlock_timestamp", value).apply()

    var isHolidayMode: Boolean
        get() = prefs.getBoolean(KEY_IS_HOLIDAY_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_HOLIDAY_MODE, value).apply()

    // Offline Monitoring
    var lastGpsActiveTimestamp: Long
        get() = prefs.getLong(KEY_LAST_GPS_ACTIVE_TIMESTAMP, System.currentTimeMillis())
        set(value) = prefs.edit().putLong(KEY_LAST_GPS_ACTIVE_TIMESTAMP, value).apply()

    var violationStreak: Int
        get() = prefs.getInt(KEY_VIOLATION_STREAK, 0)
        set(value) = prefs.edit().putInt(KEY_VIOLATION_STREAK, value).apply()

    var lastDailyScoreUpdate: Long
        get() = prefs.getLong(KEY_LAST_DAILY_SCORE_UPDATE, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_DAILY_SCORE_UPDATE, value).apply()

    var isInsideSchoolZone: Boolean
        get() = prefs.getBoolean(KEY_IS_INSIDE_SCHOOL_ZONE, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_INSIDE_SCHOOL_ZONE, value).apply()

    var lastOnlineTimestamp: Long
        get() = prefs.getLong(KEY_LAST_ONLINE_TIMESTAMP, System.currentTimeMillis())
        set(value) = prefs.edit().putLong(KEY_LAST_ONLINE_TIMESTAMP, value).apply()

    var offlineDurationAccumulated: Long
        get() = prefs.getLong(KEY_OFFLINE_DURATION_ACCUMULATED, 0L)
        set(value) = prefs.edit().putLong(KEY_OFFLINE_DURATION_ACCUMULATED, value).apply()

    var trustScore: Int
        get() = prefs.getInt(KEY_TRUST_SCORE, 100) // Default score 100
        set(value) = prefs.edit().putInt(KEY_TRUST_SCORE, value).apply()
        
    var gracePeriodEndTime: Long
        get() = prefs.getLong(KEY_GRACE_PERIOD_END, 0L)
        set(value) = prefs.edit().putLong(KEY_GRACE_PERIOD_END, value).apply()

    // Student info
    var isUninstallAuthorized: Boolean
        get() = prefs.getBoolean(KEY_UNINSTALL_AUTHORIZED, false)
        set(value) = prefs.edit().putBoolean(KEY_UNINSTALL_AUTHORIZED, value).apply()

    var uninstallBypassUntil: Long
        get() = prefs.getLong(KEY_UNINSTALL_BYPASS_UNTIL, 0L)
        set(value) = prefs.edit().putLong(KEY_UNINSTALL_BYPASS_UNTIL, value).apply()

    fun isUninstallBypassActive(now: Long = System.currentTimeMillis()): Boolean {
        return isUninstallAuthorized || now < uninstallBypassUntil
    }

    var studentId: Long
        get() = prefs.getLong(KEY_STUDENT_ID, -1)
        set(value) = prefs.edit().putLong(KEY_STUDENT_ID, value).apply()

    var nisn: String
        get() = prefs.getString(KEY_NISN, "")?.trim() ?: ""
        set(value) = prefs.edit().putString(KEY_NISN, value.trim()).apply()

    var studentName: String
        get() = prefs.getString(KEY_STUDENT_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_STUDENT_NAME, value).apply()

    var studentClass: String
        get() = prefs.getString(KEY_CLASS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_CLASS, value).apply()

    var schoolId: String
        get() = prefs.getString(KEY_SCHOOL_ID, "")?.trim() ?: ""
        set(value) = prefs.edit().putString(KEY_SCHOOL_ID, value.trim()).apply()

    var schoolNpsn: String
        get() = prefs.getString(KEY_SCHOOL_NPSN, "")?.trim() ?: ""
        set(value) = prefs.edit().putString(KEY_SCHOOL_NPSN, value.trim()).apply()

    var studentRemoteKey: String
        get() = prefs.getString(KEY_STUDENT_REMOTE_KEY, "")?.trim() ?: ""
        set(value) = prefs.edit().putString(KEY_STUDENT_REMOTE_KEY, value.trim()).apply()

    var studentUsername: String
        get() = prefs.getString(KEY_STUDENT_USERNAME, "")?.trim() ?: ""
        set(value) = prefs.edit().putString(KEY_STUDENT_USERNAME, value.trim()).apply()

    var deviceId: String
        get() = prefs.getString(KEY_DEVICE_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var isRegistered: Boolean
        get() = prefs.getBoolean(KEY_IS_REGISTERED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_REGISTERED, value).apply()

    // School settings
    var schoolLatitude: Double
        get() = prefs.getString(KEY_SCHOOL_LAT, "-7.2575")?.toDouble() ?: -7.2575
        set(value) = prefs.edit().putString(KEY_SCHOOL_LAT, value.toString()).apply()

    var schoolLongitude: Double
        get() = prefs.getString(KEY_SCHOOL_LON, "112.7521")?.toDouble() ?: 112.7521
        set(value) = prefs.edit().putString(KEY_SCHOOL_LON, value.toString()).apply()

    var schoolRadius: Double
        get() = prefs.getString(KEY_SCHOOL_RADIUS, "500.0")?.toDouble() ?: 500.0
        set(value) = prefs.edit().putString(KEY_SCHOOL_RADIUS, value.toString()).apply()

    var schoolStartHour: Int
        get() = prefs.getInt(KEY_SCHOOL_START_HOUR, 7)
        set(value) = prefs.edit().putInt(KEY_SCHOOL_START_HOUR, value).apply()

    var schoolEndHour: Int
        get() = prefs.getInt(KEY_SCHOOL_END_HOUR, 15)
        set(value) = prefs.edit().putInt(KEY_SCHOOL_END_HOUR, value).apply()
    
    var schoolStartMinute: Int
        get() = prefs.getInt(KEY_SCHOOL_START_MINUTE, 0)
        set(value) = prefs.edit().putInt(KEY_SCHOOL_START_MINUTE, value).apply()

    var schoolEndMinute: Int
        get() = prefs.getInt(KEY_SCHOOL_END_MINUTE, 0)
        set(value) = prefs.edit().putInt(KEY_SCHOOL_END_MINUTE, value).apply()

    var weekdayScheduleJson: String
        get() = prefs.getString(KEY_WEEKDAY_SCHEDULE_JSON, "") ?: ""
        set(value) = prefs.edit().putString(KEY_WEEKDAY_SCHEDULE_JSON, value).apply()

    var holidayListJson: String
        get() = prefs.getString(KEY_HOLIDAY_LIST_JSON, "") ?: ""
        set(value) = prefs.edit().putString(KEY_HOLIDAY_LIST_JSON, value).apply()

    var gpsOffWarnMs: Long
        get() = prefs.getLong(KEY_GPS_OFF_WARN_MS, 3 * 60 * 1000L)
        set(value) = prefs.edit().putLong(KEY_GPS_OFF_WARN_MS, value).apply()

    var gpsOffLockMs: Long
        get() = prefs.getLong(KEY_GPS_OFF_LOCK_MS, 5 * 60 * 1000L)
        set(value) = prefs.edit().putLong(KEY_GPS_OFF_LOCK_MS, value).apply()

    // Admin settings
    var adminPassword: String
        get() = prefs.getString(KEY_ADMIN_PASSWORD, "SpEnT9@P@_2007") ?: "SpEnT9@P@_2007"
        set(value) = prefs.edit().putString(KEY_ADMIN_PASSWORD, value).apply()

    var isFirstLaunch: Boolean
        get() = prefs.getBoolean(KEY_FIRST_LAUNCH, true)
        set(value) = prefs.edit().putBoolean(KEY_FIRST_LAUNCH, value).apply()

    // Get device ID (Android ID)
    fun getAndroidDeviceId(context: Context): String {
        return Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )?.trim().orEmpty()
    }

    fun getDeviceBindingId(context: Context): String {
        val raw = listOf(
            getAndroidDeviceId(context),
            android.os.Build.BRAND.orEmpty(),
            android.os.Build.DEVICE.orEmpty(),
            android.os.Build.MODEL.orEmpty(),
            android.os.Build.MANUFACTURER.orEmpty(),
            android.os.Build.HARDWARE.orEmpty()
        ).joinToString("|")
        val bytes = java.security.MessageDigest.getInstance("SHA-256").digest(raw.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun matchesStoredDeviceBinding(context: Context, storedDeviceId: String?): Boolean {
        val stored = storedDeviceId?.trim().orEmpty()
        if (stored.isBlank()) return true
        val candidates = setOf(getDeviceBindingId(context), getAndroidDeviceId(context)).filter { it.isNotBlank() }
        return candidates.contains(stored)
    }

    // Clear all data
    fun clearAll() {
        prefs.edit().clear().apply()
    }

    fun claimSchoolServiceExit(now: Long = System.currentTimeMillis(), cooldownMs: Long = 15_000L): Boolean {
        val last = prefs.getLong(KEY_SCHOOL_SERVICE_EXIT_AT, 0L)
        if (last > 0L && now - last < cooldownMs) return false
        prefs.edit().putLong(KEY_SCHOOL_SERVICE_EXIT_AT, now).apply()
        return true
    }

    fun resetSchoolServiceExitClaim() {
        prefs.edit().remove(KEY_SCHOOL_SERVICE_EXIT_AT).apply()
    }

    // Save student registration
    fun saveStudentRegistration(
        studentId: Long,
        nisn: String,
        name: String,
        className: String,
        deviceId: String,
        remoteStudentKey: String = "",
        username: String = ""
    ) {
        prefs.edit().apply {
            putLong(KEY_STUDENT_ID, studentId)
            putString(KEY_NISN, nisn)
            putString(KEY_STUDENT_NAME, name)
            putString(KEY_CLASS, className)
            putString(KEY_DEVICE_ID, deviceId)
            putString(KEY_STUDENT_REMOTE_KEY, remoteStudentKey.trim())
            putString(KEY_STUDENT_USERNAME, username.trim())
            putBoolean(KEY_IS_REGISTERED, true)
            putBoolean(KEY_FIRST_LAUNCH, false)
        }.apply()
    }

    fun saveStudentRemoteIdentity(remoteStudentKey: String, username: String) {
        prefs.edit().apply {
            putString(KEY_STUDENT_REMOTE_KEY, remoteStudentKey.trim())
            putString(KEY_STUDENT_USERNAME, username.trim())
        }.apply()
    }

    // ============================================================
    // Target-Specific Recovery Grace (Bug PR: Settings Recovery)
    // ============================================================

    private fun isValidRecoveryTarget(target: String): Boolean {
        return when (target) {
            RECOVERY_TARGET_ACCESSIBILITY,
            RECOVERY_TARGET_OVERLAY,
            RECOVERY_TARGET_BATTERY,
            RECOVERY_TARGET_LOCATION_PERMISSION,
            RECOVERY_TARGET_GPS,
            RECOVERY_TARGET_DEVICE_ADMIN -> true
            else -> false
        }
    }

    /**
     * Mulai recovery untuk target izin tertentu.
     * Set state active + graceUntil (default 180 detik = 3 menit).
     * Jangan lupa stopKioskMode sebelum panggil ini di UI.
     */
    fun startRecoveryForTarget(
        target: String,
        graceMs: Long = 180_000L,
        now: Long = System.currentTimeMillis()
    ) {
        if (!isValidRecoveryTarget(target)) return
        val grace = graceMs.coerceAtLeast(30_000L)
        prefs.edit().apply {
            putBoolean(KEY_PREFIX_RECOVERY_ACTIVE + target, true)
            putLong(KEY_PREFIX_RECOVERY_GRACE_UNTIL + target, now + grace)
        }.apply()
        // Legacy global gate tetap di-set sebagai safety net (jangan overwrite lebih kecil)
        val globalGrace = now + grace
        if (globalGrace > settingsGraceUntil) {
            settingsGraceUntil = globalGrace
        }
        isSettingsOpen = true
    }

    /** Clear recovery state untuk target tertentu (misal setelah izin berhasil diaktifkan). */
    fun clearRecoveryForTarget(target: String) {
        if (!isValidRecoveryTarget(target)) return
        prefs.edit().apply {
            remove(KEY_PREFIX_RECOVERY_ACTIVE + target)
            remove(KEY_PREFIX_RECOVERY_GRACE_UNTIL + target)
        }.apply()
        // Jika sudah tidak ada recovery target aktif sama sekali, clear legacy global gate juga
        if (!anyRecoveryTargetActive()) {
            isSettingsOpen = false
            if (settingsGraceUntil > 0L && System.currentTimeMillis() < settingsGraceUntil) {
                // Biarkan legacy grace sampai habis untuk kompatibilitas, tapi jangan false positive kick
            } else {
                settingsGraceUntil = 0L
            }
        }
    }

    /** Cek apakah recovery untuk target ini MASIH AKTIF (belum lewat grace & flag active true). */
    fun isRecoveryActiveForTarget(
        target: String,
        now: Long = System.currentTimeMillis()
    ): Boolean {
        if (!isValidRecoveryTarget(target)) return false
        val active = prefs.getBoolean(KEY_PREFIX_RECOVERY_ACTIVE + target, false)
        if (!active) return false
        val graceUntil = prefs.getLong(KEY_PREFIX_RECOVERY_GRACE_UNTIL + target, 0L)
        if (now > graceUntil) {
            // Grace expired: auto-clean target ini
            clearRecoveryForTarget(target)
            return false
        }
        return true
    }

    /**
     * Perpanjang grace untuk target recovery aktif.
     * Dipanggil saat MonitoringService mendeteksi user masih di Settings package untuk target ini.
     */
    fun extendRecoveryGraceIfActive(
        target: String,
        additionalMs: Long = 60_000L,
        now: Long = System.currentTimeMillis()
    ): Boolean {
        if (!isRecoveryActiveForTarget(target, now)) return false
        val currentGrace = prefs.getLong(KEY_PREFIX_RECOVERY_GRACE_UNTIL + target, 0L)
        val newGrace = (now + additionalMs).coerceAtLeast(currentGrace)
        prefs.edit().putLong(KEY_PREFIX_RECOVERY_GRACE_UNTIL + target, newGrace).apply()
        // Perpanjang juga legacy global
        if (newGrace > settingsGraceUntil) {
            settingsGraceUntil = newGrace
        }
        return true
    }

    /**
     * Cek APA SAJA recovery target yang masih aktif.
     * Ini GATE UTAMA untuk menunda relaunchEduLock/requestKiosk.
     */
    fun anyRecoveryTargetActive(now: Long = System.currentTimeMillis()): Boolean {
        val targets = listOf(
            RECOVERY_TARGET_ACCESSIBILITY,
            RECOVERY_TARGET_OVERLAY,
            RECOVERY_TARGET_BATTERY,
            RECOVERY_TARGET_LOCATION_PERMISSION,
            RECOVERY_TARGET_GPS,
            RECOVERY_TARGET_DEVICE_ADMIN
        )
        // Juga cek legacy global grace sebagai safety net
        val legacyActive = isSettingsOpen || now < settingsGraceUntil || now < deviceAdminRequestUntil
        if (legacyActive) return true
        return targets.any { isRecoveryActiveForTarget(it, now) }
    }

    /** Dapatkan daftar target recovery yang masih aktif (untuk logging/debug). */
    fun getActiveRecoveryTargets(now: Long = System.currentTimeMillis()): List<String> {
        val targets = listOf(
            RECOVERY_TARGET_ACCESSIBILITY,
            RECOVERY_TARGET_OVERLAY,
            RECOVERY_TARGET_BATTERY,
            RECOVERY_TARGET_LOCATION_PERMISSION,
            RECOVERY_TARGET_GPS,
            RECOVERY_TARGET_DEVICE_ADMIN
        )
        return targets.filter { isRecoveryActiveForTarget(it, now) }
    }

    /** Clear SEMUA recovery state (digunakan saat logout / uninstall mode ON). */
    fun clearAllRecoveryTargets() {
        val targets = listOf(
            RECOVERY_TARGET_ACCESSIBILITY,
            RECOVERY_TARGET_OVERLAY,
            RECOVERY_TARGET_BATTERY,
            RECOVERY_TARGET_LOCATION_PERMISSION,
            RECOVERY_TARGET_GPS,
            RECOVERY_TARGET_DEVICE_ADMIN
        )
        val edit = prefs.edit()
        targets.forEach { t ->
            edit.remove(KEY_PREFIX_RECOVERY_ACTIVE + t)
            edit.remove(KEY_PREFIX_RECOVERY_GRACE_UNTIL + t)
        }
        edit.apply()
        isSettingsOpen = false
        settingsGraceUntil = 0L
    }
}
