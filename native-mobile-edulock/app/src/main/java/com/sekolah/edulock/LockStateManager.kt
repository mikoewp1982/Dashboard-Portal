package com.sekolah.edulock

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class LockState {
    UNLOCKED,
    SOFT_LOCKED,
    HARD_LOCKED,
    TEMP_PERMISSION,
    SETTINGS_GRACE,
    UNINSTALL_BYPASS,
    EMERGENCY_UNLOCK,
    HOLIDAY_FREE,
    PROTECTION_OFF
}

enum class LockReason {
    NONE,
    APP_NOT_ALLOWED,
    TEMP_PERMISSION_ACTIVE,
    SETTINGS_GRACE_ACTIVE,
    UNINSTALL_BYPASS_ACTIVE,
    HOLIDAY_MODE_ACTIVE,
    PROTECTION_DISABLED,
    EMERGENCY_UNLOCK_ACTIVE,
    OUTSIDE_SCHOOL_ZONE,
    OUTSIDE_SCHOOL_TIME,
    STRICT_MODE_INACTIVE,
    SETUP_INCOMPLETE,
    SCHOOL_SERVICE_INACTIVE,
    ALLOWED_PACKAGE
}

data class LockDecision(
    val state: LockState,
    val reason: LockReason,
    val shouldShowOverlay: Boolean,
    val shouldRelaunchEduLock: Boolean,
    val shouldAttemptKiosk: Boolean,
    val blockedPackage: String? = null,
    val decidedAt: Long = System.currentTimeMillis()
)

data class LockContextSnapshot(
    val isSetupCompleted: Boolean,
    val isProtectionActive: Boolean,
    val isHolidayMode: Boolean,
    val isEmergencyUnlocked: Boolean,
    val isUninstallBypassActive: Boolean,
    val isSettingsGraceActive: Boolean,
    val isPermissionActive: Boolean,
    val isSchoolTime: Boolean,
    val isStrictMode: Boolean,
    val isInsideSchoolZone: Boolean,
    val currentForegroundPackage: String?,
    val isSchoolServiceActive: Boolean,
    val protectionMode: ProtectionMode
)

class LockStateManager private constructor(private val appContext: android.content.Context) {
    private val prefsManager = PreferencesManager(appContext)
    private val permissionManager = PermissionManager(appContext)
    private val allowedPackagesProvider = AllowedPackagesProvider(prefsManager)
    private val scheduleManager = SchoolScheduleManager(prefsManager)
    private val _state = MutableStateFlow(
        LockDecision(
            state = LockState.UNLOCKED,
            reason = LockReason.NONE,
            shouldShowOverlay = false,
            shouldRelaunchEduLock = false,
            shouldAttemptKiosk = false
        )
    )

    fun observeState(): StateFlow<LockDecision> = _state.asStateFlow()

    fun currentDecision(): LockDecision = _state.value

    fun buildSnapshot(currentForegroundPackage: String? = prefsManager.lastForegroundPackage): LockContextSnapshot {
        val now = System.currentTimeMillis()
        val settingsGraceActive = prefsManager.isSettingsOpen ||
            now < prefsManager.settingsGraceUntil ||
            now < prefsManager.deviceAdminRequestUntil

        return LockContextSnapshot(
            isSetupCompleted = prefsManager.isSetupCompleted,
            isProtectionActive = prefsManager.isProtectionActive,
            isHolidayMode = prefsManager.isHolidayMode,
            isEmergencyUnlocked = prefsManager.isEmergencyUnlocked,
            isUninstallBypassActive = prefsManager.isUninstallBypassActive(now),
            isSettingsGraceActive = settingsGraceActive,
            isPermissionActive = permissionManager.isPermissionActive(),
            isSchoolTime = scheduleManager.isSchoolTime(),
            isStrictMode = isStrictModeNow(),
            isInsideSchoolZone = prefsManager.isInsideSchoolZone,
            currentForegroundPackage = currentForegroundPackage,
            isSchoolServiceActive = true,
            protectionMode = LockPolicy.currentProtectionMode(prefsManager)
        )
    }

    fun onForegroundPackageChanged(packageName: String?): LockDecision {
        val normalizedPackage = packageName?.trim().orEmpty().ifBlank { null }
        prefsManager.lastForegroundPackage = normalizedPackage
        val decision = evaluate(buildSnapshot(normalizedPackage))
        _state.value = decision
        return decision
    }

    fun reconcile(snapshot: LockContextSnapshot = buildSnapshot()): LockDecision {
        val decision = evaluate(snapshot)
        _state.value = decision
        return decision
    }

    fun isAllowedPackage(packageName: String?): Boolean = allowedPackagesProvider.isAllowedPackage(packageName)

    private fun evaluate(snapshot: LockContextSnapshot): LockDecision {
        if (!snapshot.isSetupCompleted) {
            return unlockedDecision(LockReason.SETUP_INCOMPLETE, snapshot.currentForegroundPackage)
        }
        if (!snapshot.isSchoolServiceActive) {
            return unlockedDecision(LockReason.SCHOOL_SERVICE_INACTIVE, snapshot.currentForegroundPackage)
        }
        if (snapshot.isUninstallBypassActive) {
            return bypassDecision(LockState.UNINSTALL_BYPASS, LockReason.UNINSTALL_BYPASS_ACTIVE, snapshot.currentForegroundPackage)
        }
        if (snapshot.isEmergencyUnlocked) {
            return bypassDecision(LockState.EMERGENCY_UNLOCK, LockReason.EMERGENCY_UNLOCK_ACTIVE, snapshot.currentForegroundPackage)
        }
        if (snapshot.isSettingsGraceActive) {
            return bypassDecision(LockState.SETTINGS_GRACE, LockReason.SETTINGS_GRACE_ACTIVE, snapshot.currentForegroundPackage)
        }
        if (snapshot.isPermissionActive) {
            return bypassDecision(LockState.TEMP_PERMISSION, LockReason.TEMP_PERMISSION_ACTIVE, snapshot.currentForegroundPackage)
        }
        if (snapshot.isHolidayMode) {
            return bypassDecision(LockState.HOLIDAY_FREE, LockReason.HOLIDAY_MODE_ACTIVE, snapshot.currentForegroundPackage)
        }
        if (!snapshot.isProtectionActive) {
            return bypassDecision(LockState.PROTECTION_OFF, LockReason.PROTECTION_DISABLED, snapshot.currentForegroundPackage)
        }
        if (!snapshot.isSchoolTime) {
            return unlockedDecision(LockReason.OUTSIDE_SCHOOL_TIME, snapshot.currentForegroundPackage)
        }
        if (!snapshot.isStrictMode) {
            return unlockedDecision(LockReason.STRICT_MODE_INACTIVE, snapshot.currentForegroundPackage)
        }
        if (!snapshot.isInsideSchoolZone) {
            return unlockedDecision(LockReason.OUTSIDE_SCHOOL_ZONE, snapshot.currentForegroundPackage)
        }
        if (allowedPackagesProvider.isAllowedPackage(snapshot.currentForegroundPackage)) {
            return unlockedDecision(LockReason.ALLOWED_PACKAGE, snapshot.currentForegroundPackage)
        }

        val state = if (snapshot.protectionMode == ProtectionMode.SOFT) LockState.SOFT_LOCKED else LockState.HARD_LOCKED
        val shouldAttemptKiosk = snapshot.protectionMode == ProtectionMode.HARD
        return LockDecision(
            state = state,
            reason = LockReason.APP_NOT_ALLOWED,
            shouldShowOverlay = true,
            shouldRelaunchEduLock = true,
            shouldAttemptKiosk = shouldAttemptKiosk,
            blockedPackage = snapshot.currentForegroundPackage
        )
    }

    private fun unlockedDecision(reason: LockReason, packageName: String?): LockDecision {
        return LockDecision(
            state = LockState.UNLOCKED,
            reason = reason,
            shouldShowOverlay = false,
            shouldRelaunchEduLock = false,
            shouldAttemptKiosk = false,
            blockedPackage = packageName
        )
    }

    private fun bypassDecision(state: LockState, reason: LockReason, packageName: String?): LockDecision {
        return LockDecision(
            state = state,
            reason = reason,
            shouldShowOverlay = false,
            shouldRelaunchEduLock = false,
            shouldAttemptKiosk = false,
            blockedPackage = packageName
        )
    }

    private fun getTodayKeyWib(): String {
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            sdf.timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
            sdf.format(System.currentTimeMillis())
        } catch (_: Exception) {
            ""
        }
    }

    private fun isStrictModeNow(): Boolean {
        if (prefsManager.isHolidayMode) return false
        if (!prefsManager.isProtectionActive) return false
        if (!scheduleManager.isSchoolTime()) return false
        return true
    }

    companion object {
        @Volatile
        private var instance: LockStateManager? = null

        fun getInstance(context: android.content.Context): LockStateManager {
            return instance ?: synchronized(this) {
                instance ?: LockStateManager(context.applicationContext).also { instance = it }
            }
        }
    }
}
