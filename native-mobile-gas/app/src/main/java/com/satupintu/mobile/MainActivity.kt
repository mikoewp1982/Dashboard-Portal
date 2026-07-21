package com.satupintu.mobile

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.satupintu.mobile.data.service.PresenceService
import com.satupintu.mobile.data.service.TeacherNotificationListener
import com.satupintu.mobile.ui.AppNavigation
import com.satupintu.mobile.ui.theme.GaspaTheme
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.utils.SecurePreferences

import android.content.SharedPreferences
import android.widget.Toast

class MainActivity : ComponentActivity() {
    
    private var notificationListener: TeacherNotificationListener? = null
    private var presenceService: PresenceService? = null
    private var pendingNavigationRoute by mutableStateOf<String?>(null)
    
    // Listen for login/logout changes to start/stop notifications immediately
    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { prefs, key ->
        if (key == "user_login_key" || key == "user_credential" || key == "user_role") {
            val loginKey = SecurityUtils.getStoredLoginKey(prefs)
            if (loginKey.isNotEmpty()) {
                checkUserRoleAndStartListening()
            } else {
                notificationListener?.stopListening()
                presenceService?.stopListening()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingNavigationRoute = resolveRequestedRoute(intent)
        if (SecurityUtils.isDeviceCompromised()) {
            Toast.makeText(this, "Perangkat tidak aman. Aplikasi ditutup untuk melindungi data sekolah.", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        enableEdgeToEdge()
        
        // Register Preference Listener
        val prefs = SecurePreferences.getSessionPrefs(this)
        if (SecurityUtils.isSessionExpired(prefs)) {
            prefs.edit().clear().apply()
        }
        prefs.registerOnSharedPreferenceChangeListener(prefsListener)
        
        checkUserRoleAndStartListening()
        setContent {
            GaspaTheme {
                AppNavigation(
                    requestedRoute = pendingNavigationRoute,
                    onRouteConsumed = { pendingNavigationRoute = null }
                )
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingNavigationRoute = resolveRequestedRoute(intent)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        val prefs = SecurePreferences.getSessionPrefs(this)
        prefs.unregisterOnSharedPreferenceChangeListener(prefsListener)
        notificationListener?.stopListening()
        presenceService?.stopListening()
    }

    private fun checkUserRoleAndStartListening() {
        val prefs = SecurePreferences.getSessionPrefs(this)
        val loginKey = SecurityUtils.getStoredLoginKey(prefs)
        val role = SecurityUtils.getStoredRole(prefs)
        val schoolId = SecurityUtils.getStoredSchoolId(prefs)
        
        if (loginKey.isEmpty() || !SecurityUtils.isSessionConsistent(prefs, SecurityUtils.normalizeAudienceFlavor(BuildConfig.FLAVOR))) {
            notificationListener?.stopListening()
            presenceService?.stopListening()
            return
        }

        val listener = notificationListener ?: TeacherNotificationListener(applicationContext).also {
            notificationListener = it
        }
        val presence = presenceService ?: PresenceService().also {
            presenceService = it
        }

        when (role) {
            "teacher", "staff" -> {
                listener.startListening("Guru", loginKey, schoolId)
                presence.startListening(loginKey, schoolId, role)
            }
            "student" -> {
                listener.startListening("Siswa", loginKey, schoolId)
                presence.startListening(loginKey, schoolId, role)
            }
        }
    }

    private fun resolveRequestedRoute(intent: android.content.Intent?): String? {
        return intent?.getStringExtra("route")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
    }
}
