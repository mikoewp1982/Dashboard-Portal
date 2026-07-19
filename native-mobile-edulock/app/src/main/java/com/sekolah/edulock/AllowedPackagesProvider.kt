package com.sekolah.edulock

class AllowedPackagesProvider(private val prefsManager: PreferencesManager) {

    fun isAllowedPackage(packageName: String?): Boolean {
        val normalized = packageName?.trim().orEmpty()
        if (normalized.isBlank()) return false

        if (alwaysAllowedPrefixes.any { normalized.startsWith(it) }) return true
        if (isKeyboardPackage(normalized)) return true

        if (prefsManager.isUninstallBypassActive()) {
            if (uninstallBypassPrefixes.any { normalized.startsWith(it) }) return true
        }

        return false
    }

    fun isKeyboardPackage(packageName: String): Boolean {
        val normalized = packageName.trim()
        return keyboardPrefixes.any { normalized.startsWith(it) } ||
            normalized.contains("inputmethod", ignoreCase = true) ||
            normalized.contains("keyboard", ignoreCase = true)
    }

    private val alwaysAllowedPrefixes = listOf(
        "com.sekolah.edulock",
        SchoolAppRegistry.STUDENT_GAS_PACKAGE,
        "android",
        "com.android.systemui",
        "com.android.permissioncontroller",
        "com.google.android.permissioncontroller"
    )

    private val uninstallBypassPrefixes = listOf(
        "com.android.settings",
        "com.google.android.packageinstaller",
        "com.android.packageinstaller"
    )

    private val keyboardPrefixes = listOf(
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",
        "com.sec.android.inputmethod"
    )
}
