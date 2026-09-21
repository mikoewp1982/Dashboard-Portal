package com.sekolah.edulock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.net.Uri
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Space
import android.widget.TextView
import android.widget.Toast
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import org.json.JSONObject

class MonitoringService : Service() {
    data class ProtectionTelemetry(
        val isAccessibilityEnabled: Boolean,
        val isDeviceAdminEnabled: Boolean,
        val isProtectionActive: Boolean,
        val isPermissionActive: Boolean,
        val complianceStatus: String,
        val protectionHealth: String,
        val checkedAt: Long,
        val appVersionCode: Int
    )

    companion object {
        const val ACTION_FCM_WAKE = "com.sekolah.edulock.ACTION_FCM_WAKE"
        const val ACTION_FORCE_ENFORCE = "com.sekolah.edulock.ACTION_FORCE_ENFORCE"
        const val ACTION_KEEPALIVE = "com.sekolah.edulock.ACTION_KEEPALIVE"
        const val ACTION_FIND_DEVICE_ALARM = "com.sekolah.edulock.ACTION_FIND_DEVICE_ALARM"
        const val ACTION_STOP_FIND_DEVICE_ALARM = "com.sekolah.edulock.ACTION_STOP_FIND_DEVICE_ALARM"
        const val ACTION_UI_FOREGROUND = "com.sekolah.edulock.ACTION_UI_FOREGROUND"
        // [FIX B-2/H5] Action yang dikirim LockScreenActivity / OverlayLockActivity saat
        // onResume, minta MonitoringService segera membersihkan window manager overlay
        // (overlayLockView) yang mungkin bertindih di atas activity.
        const val ACTION_HIDE_WINDOW_OVERLAY = "com.sekolah.edulock.ACTION_HIDE_WINDOW_OVERLAY"
        // [Fase 2 - FCM Command Extension]
        const val ACTION_CHECK_PERM = "com.sekolah.edulock.ACTION_CHECK_PERM"
        const val ACTION_SYNC_NOW = "com.sekolah.edulock.ACTION_SYNC_NOW"
        const val ACTION_FORCE_RELOCK = "com.sekolah.edulock.ACTION_FORCE_RELOCK"
        const val ACTION_KILL_LOCK = "com.sekolah.edulock.ACTION_KILL_LOCK"
        const val ACTION_RESTORE_LOCK = "com.sekolah.edulock.ACTION_RESTORE_LOCK"
        const val EXTRA_REQUESTED_PROTECTION = "requested_protection"
        const val EXTRA_COMMAND_ID = "command_id"
        const val EXTRA_TRIGGER_SOURCE = "trigger_source"
        const val EXTRA_TRIGGER_DETAIL = "trigger_detail"
        const val EXTRA_FIND_DEVICE_DURATION_MS = "find_device_duration_ms"
        // EXTRA untuk command KILL_LOCK: durasi maks kill switch (default 60 menit, cap 24 jam)
        const val EXTRA_KILL_DURATION_MS = "kill_duration_ms"
        // [Fase 2.2 - Langkah7: Periodic reminder CHECK_PERM interval]
        private const val PERMISSION_REMINDER_INTERVAL_MS = 2L * 60L * 60L * 1000L // 2 jam
        private const val RC_PERMISSION_REMINDER = 20101
        @Volatile
        private var lastForceEnforceHandledAt = 0L
        private const val FORCE_ENFORCE_HANDLE_THROTTLE_MS = 4_000L
        private const val PERFORM_CHECKS_MIN_GAP_MS = 1_000L
        private const val NOTIF_ID_RECOVERY_PERM = 1107
        private const val NOTIF_ID_FCM_COMMAND = 1108
        private const val CHANNEL_ID_FCM_COMMAND = "EduLockFcmCommands"
    }

    private lateinit var prefsManager: PreferencesManager
    private lateinit var permissionManager: PermissionManager
    private lateinit var offlineMonitor: OfflineMonitor
    private lateinit var locationMonitor: LocationMonitor
    private lateinit var trustScoreManager: TrustScoreManager
    private lateinit var gracePeriodManager: GracePeriodManager
    private lateinit var scheduleManager: SchoolScheduleManager
    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var compName: ComponentName
    private lateinit var firebaseReporter: FirebaseReporter
    private lateinit var firebaseManager: FirebaseManager
    private lateinit var lockStateManager: LockStateManager
    private lateinit var lockEnforcer: LockEnforcer
    private lateinit var lockMetricsLogger: LockMetricsLogger
    private lateinit var geofenceCoordinator: GeofenceCoordinator
    private lateinit var schoolLocalDataManager: SchoolLocalDataManager
    private lateinit var schoolSyncCoordinator: SchoolSyncCoordinator
    private var lastAccessibilityPromptTime: Long = 0L
    private var lastAccessibilityLockTime: Long = 0L
    private var lastAdminPromptTime: Long = 0L
    private var lastOverlayRecoverAt: Long = 0L
    private var lastGpsMustEnableOverlayAt: Long = 0L
    private var lastPermissionReleaseAt: Long = 0L
    private var lastPerformChecksAtLocal: Long = 0L
    
    private val handler = Handler(Looper.getMainLooper())
    private val protectionOnRetryRunnable = Runnable { tryEnforceProtectionOnActivation() }
    private val monitoringIntervalMs = if (BuildConfig.USE_GEOFENCING) 5_000L else 3_000L
    private val initialMonitoringDelayMs = if (BuildConfig.USE_GEOFENCING) 3_000L else 10_000L
    private var uninstallListener: ValueEventListener? = null
    private var uninstallDbRef: com.google.firebase.database.DatabaseReference? = null
    private var holidayModeListener: ValueEventListener? = null
    private var holidayModeRef: com.google.firebase.database.DatabaseReference? = null
    private var protectionStatusListener: ValueEventListener? = null
    private var protectionStatusRef: com.google.firebase.database.DatabaseReference? = null
    private var deviceBindingListener: ValueEventListener? = null
    private var deviceBindingRef: com.google.firebase.database.DatabaseReference? = null
    private var schoolConfigListener: ValueEventListener? = null
    private var schoolConfigRef: com.google.firebase.database.DatabaseReference? = null
    private var weekdayScheduleListener: ValueEventListener? = null
    private var weekdayScheduleRef: com.google.firebase.database.DatabaseReference? = null
    private var schoolSettingsScheduleListener: ValueEventListener? = null
    private var schoolSettingsScheduleRef: com.google.firebase.database.DatabaseReference? = null
    private var serverTimeOffsetListener: ValueEventListener? = null
    private var serverTimeOffsetRef: com.google.firebase.database.DatabaseReference? = null
    private var holidayListListener: ValueEventListener? = null
    private var holidayListRef: com.google.firebase.database.DatabaseReference? = null
    private var gpsPolicyListener: ValueEventListener? = null
    private var gpsPolicyRef: com.google.firebase.database.DatabaseReference? = null
    private var dailyAttendanceListener: ValueEventListener? = null
    private var dailyAttendanceRef: com.google.firebase.database.DatabaseReference? = null
    private var flatDailyAttendanceListener: ValueEventListener? = null
    private var flatDailyAttendanceQuery: com.google.firebase.database.Query? = null
    private var legacyDailyAttendanceStatusCache: String = ""
    private var flatDailyAttendanceStatusCache: String = ""
    private var schoolServiceStatusListener: ValueEventListener? = null
    private var schoolServiceStatusRef: com.google.firebase.database.DatabaseReference? = null
    private var petStatusListener: ValueEventListener? = null
    private var petStatusQuery: com.google.firebase.database.Query? = null
    private var versionCheckService: VersionCheckService? = null
    private var forceUpdateListener: ValueEventListener? = null
    private var overlayLockView: View? = null
    private lateinit var windowManager: WindowManager
    private var hasTriggeredSchoolServiceExit = false
    private val protectionPollingIntervalMs = 30_000L
    private var protectionPollingRunnable: Runnable? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val wakeLockTimeoutMs = 10_000L
    private var firebaseConnectedListener: com.google.firebase.database.ValueEventListener? = null
    private var firebaseConnectedRef: com.google.firebase.database.DatabaseReference? = null

    private fun resolvePetDeadReminderIntervalMs(): Long {
        // Siklus hukuman: interval-1 → interval-2 → interval-3, lalu ulang angka terakhir.
        // Contoh admin 30/20/10: 30 → 20 → 10 → 10 → ...
        return when (prefsManager.petDeadReminderCount) {
            0 -> prefsManager.petDeadReminderFirstMs
            1 -> prefsManager.petDeadReminderSecondMs
            else -> prefsManager.petDeadReminderRepeatMs
        }.coerceAtLeast(60_000L)
    }
    
    // Receiver untuk mendeteksi layar nyala (Screen ON) dan Mode Pesawat secara dinamis
    private val screenReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action
            if (action == Intent.ACTION_SCREEN_ON || action == Intent.ACTION_USER_PRESENT) {
                acquireWakeLock()
                // Force Check saat layar nyala
                handler.post { performChecks() }
                handler.postDelayed({ forceSyncProtectionStatus() }, 1_500)
                // Anti-uninstall: poke Accessibility setelah sleep (event sering macet).
                handler.post { AntiUninstallService.pokeAfterWakeIfAlive() }
                handler.postDelayed({ AntiUninstallService.pokeAfterWakeIfAlive() }, 800L)
                handler.postDelayed({ AntiUninstallService.pokeAfterWakeIfAlive() }, 2_000L)

                // Force Sync Permission
                if (::permissionManager.isInitialized) {
                    val nisn = prefsManager.nisn
                    if (nisn.isNotEmpty()) {
                        permissionManager.resumeSession(nisn)
                    }
                }
            } else if (action == Intent.ACTION_AIRPLANE_MODE_CHANGED) {
                acquireWakeLock()
                val isAirplaneOn = if (::offlineMonitor.isInitialized) {
                    offlineMonitor.isAirplaneModeActive()
                } else {
                    try {
                        Settings.Global.getInt(context?.contentResolver, Settings.Global.AIRPLANE_MODE_ON, 0) != 0
                    } catch (_: Exception) {
                        false
                    }
                }

                android.util.Log.d("MonitoringService", "ACTION_AIRPLANE_MODE_CHANGED: isAirplaneOn=$isAirplaneOn")
                if (isAirplaneOn) {
                    val isSchool = if (::scheduleManager.isInitialized) scheduleManager.isSchoolTime() else false
                    val isProtection = prefsManager.isProtectionActive && !prefsManager.isHolidayMode
                    val isPermissionActive = if (::permissionManager.isInitialized) permissionManager.isPermissionActive() else false
                    val hasPresence = if (::locationMonitor.isInitialized) locationMonitor.shouldEnforcePresenceProtection(System.currentTimeMillis()) else false

                    if (isStrictModeNow() || (isProtection && !isPermissionActive && (isSchool || prefsManager.isInsideSchoolZone || hasPresence))) {
                        triggerLockdown(
                            "MODE PESAWAT DILARANG SAAT JAM SEKOLAH!\nHarap matikan Mode Pesawat.",
                            bypassRecoveryTargets = true
                        )
                    }
                } else {
                    // Siswa mematikan mode pesawat -> langsung jalankan pemeriksaan pemulihan
                    handler.post { performChecks() }
                }
            }
        }
    }

    private fun acquireWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "EduLock::MonitoringWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire(wakeLockTimeoutMs)
            }
        } catch (_: Exception) { }
    }

    private fun markRuntimeTrigger(
        source: String,
        detail: String? = null,
        now: Long = System.currentTimeMillis()
    ) {
        try {
            if (::prefsManager.isInitialized) {
                prefsManager.markRuntimeTrigger(source, detail, now)
            }
        } catch (_: Exception) {
        }
    }

    private fun markRuntimeHealth(
        health: String,
        reason: String? = null,
        now: Long = System.currentTimeMillis()
    ) {
        try {
            if (::prefsManager.isInitialized) {
                prefsManager.markRuntimeHealth(health, reason, now)
            }
        } catch (_: Exception) {
        }
    }

    private fun markListenerRefresh(source: String, now: Long = System.currentTimeMillis()) {
        try {
            if (::prefsManager.isInitialized) {
                prefsManager.markRuntimeListenerRefresh(source, now)
            }
        } catch (_: Exception) {
        }
    }

    private fun shouldForceSchoolSync(now: Long = System.currentTimeMillis()): Boolean {
        val lastSuccess = prefsManager.runtimeLastSyncSuccessAt
        if (lastSuccess <= 0L) return true
        if (prefsManager.runtimeLastSyncError.isNotBlank()) return true
        if (prefsManager.schoolLocalSyncState != SchoolLocalDataManager.SYNC_STATE_READY) return true
        return now - lastSuccess > 6L * 60L * 60L * 1000L
    }

    /**
     * Listener Firebase .info/connected — mendeteksi apakah WebSocket Firebase benar-benar
     * terhubung ke server. Ini menutup celah kuota medsos (TikTok/IG saja tanpa kuota umum).
     *
     * Jika Firebase terputus (karena kuota umum habis), OfflineMonitor akan mengetahui
     * bahwa internet yang dilihat Android (hasTransport=CELLULAR) sebenarnya "palsu"
     * dan memicu countdown offline lockdown.
     */
    private fun startFirebaseConnectedListener() {
        if (firebaseConnectedListener != null) return
        try {
            val database = SchoolServiceGuard.database(this)
            firebaseConnectedRef = database.getReference(".info/connected")
            markListenerRefresh("firebase_connected_listener")
            firebaseConnectedListener = object : com.google.firebase.database.ValueEventListener {
                override fun onDataChange(snapshot: com.google.firebase.database.DataSnapshot) {
                    val connected = snapshot.getValue(Boolean::class.java) ?: false
                    if (::offlineMonitor.isInitialized) {
                        offlineMonitor.isFirebaseConnected = connected
                        if (connected) {
                            offlineMonitor.lastFirebaseConnectedAt = System.currentTimeMillis()
                        }
                    }
                    if (connected) {
                        markRuntimeHealth("FIREBASE_CONNECTED", "websocket_connected")
                    } else {
                        markRuntimeHealth("FIREBASE_DISCONNECTED", "websocket_disconnected")
                    }
                    android.util.Log.d("MonitoringService", "[FirebaseConnected] status=$connected")
                }

                override fun onCancelled(error: com.google.firebase.database.DatabaseError) {}
            }
            firebaseConnectedRef?.addValueEventListener(firebaseConnectedListener!!)
        } catch (e: Exception) {
            android.util.Log.w("MonitoringService", "startFirebaseConnectedListener gagal: ${e.message}")
        }
    }

    private fun startForceSyncProtectionPolling() {
        if (protectionPollingRunnable != null) return
        protectionPollingRunnable = object : Runnable {
            override fun run() {
                forceSyncProtectionStatus()
                handler.postDelayed(this, protectionPollingIntervalMs)
            }
        }
        handler.postDelayed(protectionPollingRunnable!!, 15_000L)
    }

    private fun forceSyncProtectionStatus(forceTriggerListener: Boolean = false) {
        try {
            val schoolId = prefsManager.schoolId.trim().lowercase()
            if (schoolId.isEmpty()) return
            val database = SchoolServiceGuard.database(this)
            val ref = database.getReference("schools").child(schoolId).child("config").child("is_active_protection")
            ref.get().addOnSuccessListener { snap ->
                val isActive = readFlexibleBoolean(snap, true)
                if (isActive != prefsManager.isProtectionActive || forceTriggerListener) {
                    android.util.Log.d("MonitoringService", "[forceSync] Protection status drift/force detected: local=${prefsManager.isProtectionActive}, remote=$isActive, force=$forceTriggerListener. Reapplying listener logic.")
                    protectionStatusListener?.onDataChange(snap)
                }
            }.addOnFailureListener {
                android.util.Log.w("MonitoringService", "[forceSync] get protection status gagal: ${it.message}")
            }
        } catch (_: Exception) { }
    }

    override fun onCreate() {
        super.onCreate()
        prefsManager = PreferencesManager(this)
        val now = System.currentTimeMillis()
        prefsManager.runtimeLastServiceStartAt = now
        markRuntimeTrigger("service_create", "onCreate", now)
        markRuntimeHealth("SERVICE_STARTING", "onCreate", now)

        // Self-healing: jika semua izin setup sudah ON tapi setup_completed false,
        // set true otomatis dan force-flush RTDB. (Menanggapi badge Setup merah abadi.)
        SetupActivity.ensureSetupCompletedIfHealed(this)

        permissionManager = PermissionManager(this)
        prefsManager.nisn.takeIf { it.isNotEmpty() }?.let { permissionManager.resumeSession(it) }
        offlineMonitor = OfflineMonitor(this, prefsManager)
        locationMonitor = LocationMonitor(this, prefsManager)
        trustScoreManager = TrustScoreManager(this, prefsManager)
        gracePeriodManager = GracePeriodManager(this, prefsManager)
        scheduleManager = SchoolScheduleManager(prefsManager)
        firebaseReporter = FirebaseReporter(this, prefsManager)
        firebaseManager = FirebaseManager.getInstance(this)
        lockStateManager = LockStateManager.getInstance(this)
        lockEnforcer = LockEnforcer(this)
        lockMetricsLogger = LockMetricsLogger()
        geofenceCoordinator = GeofenceCoordinator(this)
        schoolLocalDataManager = SchoolLocalDataManager(prefsManager)
        schoolSyncCoordinator = SchoolSyncCoordinator(prefsManager, schoolLocalDataManager)
        bootstrapSchoolLocalDataIfNeeded()

        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        compName = ComponentName(this, DeviceAdminReceiver::class.java)
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        // [FIX BUG66-A Accessibility Stuck 1 menit]
        // Deteksi perubahan state aksesbilitas SECARA INSTANT (bukan nunggu loop performChecks throttle).
        // Sebelumnya: perubahan aksesbilitas baru terdeteksi 12x loop performChecks ≈ 60 detik.
        // Setelah fix: <500ms setelah user mengaktifkan toggle aksesbilitas → enforceLockAfterProtectionOn
        // dipanggil kembali → otomatis cek fullCompliance → hideOverlayLock / masuk kiosk penuh.
        try {
            val am = getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            val a11yListener = object : android.view.accessibility.AccessibilityManager.AccessibilityStateChangeListener {
                override fun onAccessibilityStateChanged(enabled: Boolean) {
                    android.util.Log.d("MonitoringService", "[A11yListener] state changed -> enabled=$enabled")
                    lastPerformChecksAtLocal = 0L // Force bypass throttle performChecks next loop
                    handler.postDelayed({
                        try {
                            if (enabled) {
                                hideOverlayLock()
                                lockEnforcer.dismissLockScreen()
                            }
                            if (::prefsManager.isInitialized && prefsManager.isProtectionActive) {
                                enforceLockAfterProtectionOn()
                            }
                        } catch (_: Exception) {}
                    }, 500L)
                }
            }
            am.addAccessibilityStateChangeListener(a11yListener)
            // Fallback: system broadcast (beberapa vendor HiOS/ColorOS lambat memanggil listener)
            val sysFilter = android.content.IntentFilter()
            sysFilter.addAction("android.accessibilityservice.AccessibilityServiceStateChanged")
            sysFilter.addAction("com.android.server.accessibility.AccessibilityServiceStateChanged")
            sysFilter.addAction(Intent.ACTION_USER_PRESENT)
            try { registerReceiver(accessibilitySystemReceiver, sysFilter) } catch (_: Exception) {}
        } catch (_: Exception) {}

        // Register Screen & System Events Receiver
        val filter = android.content.IntentFilter()
        filter.addAction(Intent.ACTION_SCREEN_ON)
        filter.addAction(Intent.ACTION_USER_PRESENT)
        filter.addAction(Intent.ACTION_AIRPLANE_MODE_CHANGED)
        registerReceiver(screenReceiver, filter)

        startForegroundService()
        startMonitoring()
        startForceSyncProtectionPolling()
        startFirebaseConnectedListener()
        startUninstallAuthorizationListener()
        startHolidayModeListener()
        startProtectionStatusListener()
        startSchoolConfigListener()
        startWeekdayScheduleListener()
        startSchoolSettingsScheduleListener()
        startServerTimeOffsetListener()
        startHolidayListListener()
        startGpsPolicyListener()
        startDailyAttendanceListener()
        startDeviceBindingListener()
        startSchoolServiceStatusListener()
        startPetStatusListener()
        startForceUpdateListener()
        markListenerRefresh("service_onCreate_listeners")
        // [Fase 2.2 - Langkah7: Schedule alarm periodic reminder CHECK_PERM (setiap ~2 jam)]
        if (prefsManager.isSetupCompleted && !prefsManager.isKillSwitchActive()) {
            ensurePermissionReminderAlarm()
        } else {
            cancelPermissionReminderAlarm()
        }
        geofenceCoordinator.syncSchoolGeofence()
        KeepAliveWorker.schedule(this)
        WatchdogAlarmReceiver.schedule(this)
        FcmTokenRegistrar.refreshAndUpload(this)
        locationMonitor.startListening()
    }

    private val accessibilitySystemReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            try {
                android.util.Log.d("MonitoringService", "[A11ySystemRecv] received -> " + (intent?.action ?: "null"))
                lastPerformChecksAtLocal = 0L
                handler.postDelayed({
                    try {
                        if (::prefsManager.isInitialized && prefsManager.isProtectionActive) {
                            hideOverlayLock()
                            enforceLockAfterProtectionOn()
                        }
                    } catch (_: Exception) {}
                }, 300L)
            } catch (_: Exception) {}
        }
    }

    private fun bootstrapSchoolLocalDataIfNeeded() {
        if (schoolLocalDataManager.hasReadyPayload()) return
        if (prefsManager.schoolId.isBlank()) return
        val hasLegacyCache =
            prefsManager.weekdayScheduleJson.isNotBlank() ||
                prefsManager.holidayListJson.isNotBlank() ||
                prefsManager.schoolLatitude != -7.2575 ||
                prefsManager.schoolLongitude != 112.7521 ||
                prefsManager.schoolRadius != 500.0 ||
                prefsManager.schoolStartHour != 7 ||
                prefsManager.schoolEndHour != 15 ||
                prefsManager.gpsOffWarnMs != 3 * 60 * 1000L ||
                prefsManager.gpsOffLockMs != 5 * 60 * 1000L
        if (hasLegacyCache) {
            schoolLocalDataManager.refreshPayloadFromPrefs("bootstrap_legacy_cache_service")
        }
    }

    private fun persistSchoolLocalDataSnapshot(source: String) {
        schoolLocalDataManager.refreshPayloadFromPrefs(source)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        locationMonitor.startListening()
        val action = intent?.action
        val triggerSource = intent?.getStringExtra(EXTRA_TRIGGER_SOURCE).orEmpty()
        val triggerDetail = intent?.getStringExtra(EXTRA_TRIGGER_DETAIL).orEmpty()
        val startNow = System.currentTimeMillis()
        prefsManager.runtimeLastServiceStartAt = startNow
        markRuntimeTrigger(
            source = triggerSource.ifBlank { action ?: "service_start" },
            detail = triggerDetail.ifBlank { action ?: "onStartCommand" },
            now = startNow
        )
        markRuntimeHealth("SERVICE_RUNNING", action ?: "onStartCommand", startNow)

        if (action == ACTION_UI_FOREGROUND) {
            val enforcementActive = prefsManager.isProtectionActive &&
                !prefsManager.isHolidayMode &&
                !prefsManager.isEmergencyUnlocked &&
                !permissionManager.isPermissionActive()
            val hasRecovery = prefsManager.anyRecoveryTargetActive()
            // [FIX X - SetupProtectionService overlay merah PROTEKSI AKTIF]
            // ACTION_UI_FOREGROUND = EduLock Activity tampil di foreground user
            // → sudah bukan fase setup awal lagi (setup overlay merah seharusnya
            // di MainActivity yang handle stop nya, tapi ini safety belt 100% agar
            // tidak tertanam selamanya di tombol Minta Izin.)
            try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}

            if (!(enforcementActive || hasRecovery)) {
                hideOverlayLock()
            }
        }
        // [B-2] Activity onResume minta bersihkan window manager overlay lockview di atasnya.
        if (action == ACTION_HIDE_WINDOW_OVERLAY) {
            hideOverlayLock()
        }

        if (intent?.hasExtra(EXTRA_REQUESTED_PROTECTION) == true) {
            prefsManager.isProtectionActive = intent.getBooleanExtra(EXTRA_REQUESTED_PROTECTION, prefsManager.isProtectionActive)
        }

        prefsManager.nisn.takeIf { it.isNotEmpty() }?.let { permissionManager.resumeSession(it) }

        // Pastikan listener berjalan, terutama jika service di-restart atau baru login
        startForceSyncProtectionPolling()
        startFirebaseConnectedListener()
        startUninstallAuthorizationListener()
        startHolidayModeListener()
        startProtectionStatusListener()
        startSchoolConfigListener()
        startWeekdayScheduleListener()
        startSchoolSettingsScheduleListener()
        startServerTimeOffsetListener()
        startHolidayListListener()
        startGpsPolicyListener()
        startDailyAttendanceListener()
        startDeviceBindingListener()
        startSchoolServiceStatusListener()
        startPetStatusListener()
        startForceUpdateListener()
        markListenerRefresh("service_onStartCommand")
        geofenceCoordinator.syncSchoolGeofence()
        KeepAliveWorker.schedule(this)
        FcmTokenRegistrar.refreshAndUpload(this)

        if (action == ACTION_FIND_DEVICE_ALARM) {
            acquireWakeLock()
            val commandId = intent.getStringExtra(EXTRA_COMMAND_ID).orEmpty()
            val durationMs = intent.getLongExtra(EXTRA_FIND_DEVICE_DURATION_MS, 45_000L)
                .coerceIn(15_000L, 120_000L)
            val alarmUntilTs = System.currentTimeMillis() + durationMs
            try {
                var ackStatus = "ALARM_STARTED"
                var streamUsed: String = "ALARM"
                var usedMusicFallback = false
                var usedVibrationFallback = false
                DeviceLocatorAlarm.start(
                    context = this,
                    durationMs = durationMs,
                    onFinished = {
                        firebaseReporter.acknowledgeFindDeviceCommand(
                            commandId = commandId,
                            status = "ALARM_FINISHED",
                            alarmUntil = null,
                            ackSource = "runtime",
                            usedMusicFallback = usedMusicFallback,
                            usedVibrationFallback = usedVibrationFallback,
                            streamUsed = streamUsed
                        )
                    },
                    onStartedWithFallback = { toMusicFallback, toVibrationFallback ->
                        usedMusicFallback = toMusicFallback
                        usedVibrationFallback = toVibrationFallback
                        streamUsed = when {
                            usedMusicFallback -> "MUSIC_FALLBACK"
                            else -> "ALARM"
                        }
                        ackStatus = if (usedMusicFallback) {
                            "ALARM_STARTED_FALLBACK_MUSIC"
                        } else {
                            "ALARM_STARTED"
                        }
                        if (!DeviceLocatorAlarm.isRunning()) {
                            ackStatus = if (usedVibrationFallback) {
                                "ALARM_STARTED_VIBRATION_ONLY"
                            } else {
                                "FAILED_SILENT"
                            }
                        }
                        firebaseReporter.acknowledgeFindDeviceCommand(
                            commandId = commandId,
                            status = ackStatus,
                            alarmUntil = alarmUntilTs,
                            ackSource = "runtime",
                            usedMusicFallback = usedMusicFallback,
                            usedVibrationFallback = usedVibrationFallback,
                            streamUsed = streamUsed
                        )
                    }
                )
            } catch (t: Throwable) {
                firebaseReporter.acknowledgeFindDeviceCommand(
                    commandId = commandId,
                    status = "FAILED",
                    alarmUntil = null,
                    ackSource = "runtime",
                    streamUsed = "EXCEPTION"
                )
                android.util.Log.e("MonitoringService", "Gagal memulai alarm pencarian device: ${t.message}")
            }
        }

        if (action == ACTION_STOP_FIND_DEVICE_ALARM) {
            acquireWakeLock()
            val commandId = intent.getStringExtra(EXTRA_COMMAND_ID).orEmpty()
            try {
                if (DeviceLocatorAlarm.isRunning()) {
                    DeviceLocatorAlarm.stop()
                }
                firebaseReporter.acknowledgeFindDeviceCommand(
                    commandId = commandId,
                    status = "ALARM_STOPPED",
                    alarmUntil = null,
                    ackSource = "runtime"
                )
            } catch (t: Throwable) {
                firebaseReporter.acknowledgeFindDeviceCommand(
                    commandId = commandId,
                    status = "FAILED",
                    alarmUntil = null,
                    ackSource = "runtime"
                )
                android.util.Log.e("MonitoringService", "Gagal menghentikan alarm pencarian device: ${t.message}")
            }
        }

        val now = System.currentTimeMillis()
        if (action == ACTION_FORCE_ENFORCE) {
            if (now - lastForceEnforceHandledAt < FORCE_ENFORCE_HANDLE_THROTTLE_MS) {

                return START_STICKY
            }
            lastForceEnforceHandledAt = now
        }

        val forceWake = action == ACTION_FCM_WAKE ||
            action == ACTION_FORCE_ENFORCE ||
            action == ACTION_KEEPALIVE ||
            action == ACTION_CHECK_PERM ||
            action == ACTION_SYNC_NOW ||
            action == ACTION_FORCE_RELOCK
        if (forceWake) {
            acquireWakeLock()
            if (shouldForceSchoolSync(startNow)) {
                try {
                    syncSchoolConfigFromApi(
                        force = true,
                        requestSource = "forcewake_${action ?: "unknown"}"
                    )
                } catch (_: Exception) {
                }
            }
            val isFcmWake = action == ACTION_FCM_WAKE
            handler.post {
                try {
                    forceSyncProtectionStatus(forceTriggerListener = isFcmWake)
                } catch (_: Exception) {
                }
                try {
                    performChecks()
                } catch (_: Exception) {
                }
            }
            handler.postDelayed({
                try {
                    performChecks()
                } catch (_: Exception) {
                }
            }, 1_500)
        }

        // [Fase 2 - Langkah 6 Command Routing]
        val commandId = intent?.getStringExtra(EXTRA_COMMAND_ID).orEmpty()
        when (action) {
            ACTION_CHECK_PERM -> {
                handleActionCheckPerm(commandId)
            }
            ACTION_SYNC_NOW -> {
                handleActionSyncNow(commandId)
            }
            ACTION_FORCE_RELOCK -> {
                handleActionForceRelock(commandId, now)
            }
            ACTION_KILL_LOCK -> {
                val killDurationMs = intent?.getLongExtra(
                    EXTRA_KILL_DURATION_MS,
                    60L * 60L * 1000L
                ) ?: (60L * 60L * 1000L)
                handleActionKillLock(commandId, killDurationMs, now)
            }
            ACTION_RESTORE_LOCK -> {
                handleActionRestoreLock(commandId, now)
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startMonitoring() {
        // V1 tetap mempertahankan delay lama. V2 hybrid mempercepat start karena geofence
        // menjadi trigger tambahan, sementara polling dipertahankan sebagai watchdog.
        handler.postDelayed(object : Runnable {
            override fun run() {
                performChecks()
                handler.postDelayed(this, monitoringIntervalMs)
            }
        }, initialMonitoringDelayMs)
    }

    private fun performChecks() {
        if (!::prefsManager.isInitialized) {
            prefsManager = PreferencesManager(this)
        }
        val checksStartedAt = System.currentTimeMillis()
        prefsManager.runtimeLastServiceHeartbeatAt = checksStartedAt
        val lastCheck = lastPerformChecksAtLocal

        // [Fase 2 - Kill Switch Short Circuit]
        // Jika kill switch aktif -> jangan jalankan enforcement apapun. Cukup:
        // 1. Pastikan overlay/lockscreen tidak tertanam (bersihkan jika sisa).
        // 2. Update status ke Firebase reporter bahwa kill switch aktif.
        // 3. Update notifikasi foreground reminder durasi kill switch.
        // 4. Jangan jalankan block performChecks enforcement (GPS, overlay, lock dll).
        if (prefsManager.isKillSwitchActive(checksStartedAt)) {
            markRuntimeHealth("KILL_SWITCH_ACTIVE", "performChecks", checksStartedAt)
            try {
                hideOverlayLock()
            } catch (_: Exception) {}
            try {
                if (::lockEnforcer.isInitialized) {
                    lockEnforcer.dismissLockScreen()
                    lockEnforcer.stopKiosk()
                }
            } catch (_: Exception) {}
            try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}
            val remainingMs = (prefsManager.killSwitchUntil - checksStartedAt).coerceAtLeast(0L)
            val remainingMin = (remainingMs / 60_000L).coerceAtLeast(0L)
            try {
                updateNotification(
                    "EduLock: Kill Switch Aktif",
                    "Sisa durasi ${remainingMin}m. Enforcement ditangguhkan admin."
                )
            } catch (_: Exception) {}
            lastPerformChecksAtLocal = checksStartedAt
            // Jangan lanjut ke block enforcement di bawah ini.
            return
        }

        if (lastCheck > 0L && checksStartedAt - lastCheck < PERFORM_CHECKS_MIN_GAP_MS) {
            return
        }
        lastPerformChecksAtLocal = checksStartedAt
        syncSchoolConfigFromApi()

        // Safety net: force update wajib harus menjadi prioritas tertinggi.
        // Jangan izinkan jalur GPS / overlay / lockscreen biasa menimpa layar update.
        if (prefsManager.isForceUpdateRequired) {
            markRuntimeHealth("FORCE_UPDATE_REQUIRED", "performChecks", checksStartedAt)
            hideOverlayLock()
            lockEnforcer.dismissLockScreen()
            lockEnforcer.stopKiosk()
            try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}
            return
        }

        // ==========================================
        // 0bis. PRIORITAS TERTINGGI #2 — MODE PESAWAT (selain force update)
        // TIDAK BOLEH ada enforcement lain (GPS overlay / showRecoveryOverlay / EduLock Main relaunch)
        // berjalan sebelum Mode Pesawat ditangani. Ini mencegah "EduLock Main muncul dahulu +
        // OverlayLockActivity pink muncul beberapa detik kemudian" bug pada build 66.
        // [FIX BUG67-GRACE3] Beri GRACE PERIOD 30 DETIK setelah user menekan tombol "MATIKAN MODE PESAWAT"
        // agar user sempat scroll Settings → cari toggle → tekan OFF tanpa ditendang balik ke LockScreen.
        // ==========================================
        if (::offlineMonitor.isInitialized && offlineMonitor.isAirplaneModeActive()) {
            val inSchoolWindow = try { scheduleManager.isSchoolTime() } catch (_: Exception) { true }
            if (inSchoolWindow) {
                val now = System.currentTimeMillis()
                val isGraceActive = ::prefsManager.isInitialized &&
                        prefsManager.isSettingsOpen &&
                        now < prefsManager.settingsGraceUntil
                if (!isGraceActive) {
                    triggerLockdown(
                        "MODE PESAWAT DILARANG SAAT JAM SEKOLAH!\nHarap matikan Mode Pesawat.",
                        bypassRecoveryTargets = true
                    )
                    return
                }
            }
        }

        // ==========================================
        // 0. PRE-FETCH DATA PENTING
        // ==========================================
        val currentLocation = locationMonitor.getCurrentLocation()
        val isInternet = offlineMonitor.isInternetAvailable()
        val trustScore = prefsManager.trustScore
        val isGpsActive = locationMonitor.isGpsEnabled()
        enforceGpsOnWhenEduLockOpen()
        val isSchoolTime = scheduleManager.isSchoolTime()
        val isAfterSchool = scheduleManager.isAfterSchoolHours()
        val protectionTelemetry = buildProtectionTelemetry(isSchoolTime)
        val runtimeHealth = when {
            prefsManager.anyRecoveryTargetActive(checksStartedAt) -> "RECOVERY_ACTIVE"
            !isInternet && schoolLocalDataManager.hasReadyPayload() -> "OFFLINE_CACHE_ACTIVE"
            else -> "MONITORING_ACTIVE"
        }
        val runtimeReason = "protection=${protectionTelemetry.protectionHealth};sync=${prefsManager.schoolLocalSyncState}"
        markRuntimeHealth(runtimeHealth, runtimeReason, checksStartedAt)

        // ==========================================
        // 1. CEK MODE DARURAT (EMERGENCY UNLOCK)
        // ==========================================
        if (prefsManager.isEmergencyUnlocked) {
            prefsManager.isEmergencyUnlocked = false
            prefsManager.isForcedLocation = false 
            showToast("Mode Darurat Dinonaktifkan.")
            updateNotification("EduLock Aktif", "Monitoring dilanjutkan.")
        }

        // ==========================================
        // 2. UPDATE STATUS ZONA & LOKASI (SELALU JALAN)
        // ==========================================
        // Penting: Ini harus jalan MESKIPUN Silent Mode, agar status "Inside/Outside" selalu fresh.
        
        val now = System.currentTimeMillis()
        val currentFgPkg = prefsManager.lastForegroundPackage.orEmpty()
        val isSettingsPackage = currentFgPkg.startsWith("com.android.settings") ||
                currentFgPkg.startsWith("com.samsung.accessibility") ||
                currentFgPkg.contains("settings") ||
                currentFgPkg == "android"
        val activeTargets = prefsManager.getActiveRecoveryTargets(now)
        if (activeTargets.isNotEmpty()) {
            for (target in activeTargets) {
                val isTargetOn = when (target) {
                    PreferencesManager.RECOVERY_TARGET_GPS -> locationMonitor.isGpsEnabled()
                    PreferencesManager.RECOVERY_TARGET_ACCESSIBILITY -> protectionTelemetry.isAccessibilityEnabled
                    PreferencesManager.RECOVERY_TARGET_DEVICE_ADMIN -> protectionTelemetry.isDeviceAdminEnabled
                    PreferencesManager.RECOVERY_TARGET_OVERLAY -> hasOverlayPermission()
                    PreferencesManager.RECOVERY_TARGET_BATTERY -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                            pm.isIgnoringBatteryOptimizations(packageName)
                        } else true
                    }
                    PreferencesManager.RECOVERY_TARGET_LOCATION_PERMISSION -> {
                        androidx.core.content.ContextCompat.checkSelfPermission(this@MonitoringService, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
                    }
                    else -> true
                }
                if (isTargetOn) {
                    prefsManager.clearRecoveryForTarget(target)
                } else if (isSettingsPackage) {
                    prefsManager.extendRecoveryGraceIfActive(target, 60_000L, now)
                }
            }
        }

        val remainingActive = prefsManager.getActiveRecoveryTargets(now)
        val legacyActive = prefsManager.isSettingsOpen || now < prefsManager.settingsGraceUntil || now < prefsManager.deviceAdminRequestUntil
        if (remainingActive.isEmpty() && !legacyActive) {
            prefsManager.isSettingsOpen = false
            prefsManager.settingsGraceUntil = 0L
        }

        val isSettingsGrace =
            (prefsManager.anyRecoveryTargetActive(now) || legacyActive) && (isSettingsPackage || currentFgPkg == packageName)
        val isDeviceAdminRecoveryActive =
            !protectionTelemetry.isDeviceAdminEnabled || now < prefsManager.deviceAdminRequestUntil

        if (currentLocation != null) {
            val stickyBefore = prefsManager.isInsideSchoolZone
            val isInsideNow = locationMonitor.isInsideSchoolArea()

            // Persist near-school evidence (or clear it when a fresh fix proves outside).
            // Sticky isInsideSchoolZone remains separate for full in-school lockdown / keluar-area.
            locationMonitor.updateSchoolPresenceFromLocation(currentLocation, now)

            // CEK KHUSUS EMULATOR / FAKE LOCATION
            // Jika LocationMonitor sudah mengembalikan fake location (isForcedLocation), maka isInsideNow = true.
            
            if (isInsideNow) {
                prefsManager.isInsideSchoolZone = true
                prefsManager.lastInsideSchoolZoneAt = now

                // Tutup System Dialogs jika di dalam zona (hanya Android < 12)
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S && !isSettingsGrace) {
                    try {
                        val closeIntent = Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
                        sendBroadcast(closeIntent)
                    } catch (e: Exception) {
                        // Ignore
                    }
                }
            } else {
                // Jika di luar:
                // Jika Silent Mode -> Update Realtime (False)
                // Jika Active Mode & Jam Sekolah -> Jangan Update (Keep True) agar terdeteksi kabur (Sticky State)
                // Jika Active Mode & Luar Jam -> Update (False)

                if (!isSchoolTime) {
                    prefsManager.isInsideSchoolZone = false
                    prefsManager.clearNearSchoolPresence()
                } else {
                    // [BUG FIX OVERLAY RUMAH JAM EFEKTIF]
                    // Jika DALAM JAM SEKOLAH tapi fresh GPS fix TERBUKTI LUAR RADIUS, dan
                    // TERAKHIR KALI di zona sudah LEBIH DARI 30 MENIT LALU -> reset sticky flag.
                    // Ini mencegah "pulang sebelumjam sekolah isInsideSchoolZone TRUE sampai jam berakhir,
                    // yang berakibat enforcement Proteksi Utama 7.2 bocor memunculkan PERANGKAT TERKUNCI
                    // di rumah saat user buka WA/IG tanpa kiosk penuh (bocor.
                    val lastInside = prefsManager.lastInsideSchoolZoneAt
                    val wasInsideButLeftLongAgo = prefsManager.isInsideSchoolZone &&
                        (lastInside <= 0L || now - lastInside > 30 * 60 * 1000L)
                    if (wasInsideButLeftLongAgo) {
                        prefsManager.isInsideSchoolZone = false
                        prefsManager.clearNearSchoolPresence()
                    }
                }
            }

            // Update GPS Active Timestamp
            prefsManager.lastGpsActiveTimestamp = System.currentTimeMillis()
        }

        // ==========================================
        // 3. KIRIM REPORT KE FIREBASE (SELALU JALAN)
        // ==========================================
        val statusMsg = when {
            !isSchoolTime -> "Diluar Jam Sekolah"
            prefsManager.isInsideSchoolZone -> "Aman (Di Sekolah)"
            else -> "Di Luar Zona Sekolah"
        }
        
        firebaseReporter.sendStatusUpdate(
            latitude = currentLocation?.latitude,
            longitude = currentLocation?.longitude,
            isInsideZone = prefsManager.isInsideSchoolZone,
            trustScore = trustScore,
            isGpsActive = isGpsActive,
            isInternetActive = isInternet,
            statusMessage = statusMsg,
            isAccessibilityEnabled = protectionTelemetry.isAccessibilityEnabled,
            isDeviceAdminEnabled = protectionTelemetry.isDeviceAdminEnabled,
            isProtectionActive = protectionTelemetry.isProtectionActive,
            isPermissionActive = protectionTelemetry.isPermissionActive,
            complianceStatus = protectionTelemetry.complianceStatus,
            protectionHealth = protectionTelemetry.protectionHealth,
            lastProtectionCheckAt = protectionTelemetry.checkedAt,
            appVersionCode = protectionTelemetry.appVersionCode
        )

        // ==========================================
        // 4. CEK MODE ACARA / LIBUR (BYPASS SECURITY)
        // ==========================================
        if (prefsManager.isHolidayMode) {
             hideOverlayLock()
             return
        }
        
        // ==========================================
        // 5. CEK SILENT MODE (BYPASS SECURITY)
        // ==========================================
        if (!prefsManager.isProtectionActive && !isStrictModeNow()) {
             hideOverlayLock()
             try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}
             updateNotification("Mode Senyap", "Monitoring Dinonaktifkan oleh Admin", true)

             val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
             stopIntent.setPackage(packageName)
             sendBroadcast(stopIntent)

             if (shouldShowGpsEnableOverlay()) {
                 showGpsEnableOverlayOnly()
             } else {
                 val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                 intent.putExtra(LockEnforcer.EXTRA_DISMISS_TARGET, "gps")
                 sendBroadcast(intent)
             }
             return
        } else {
            // JIKA PROTEKSI AKTIF:
            // Cek Reward Harian
            trustScoreManager.checkAndApplyDailyReward()
        }

        // Prioritas di luar jam sekolah: jika PET mati, hanya layar PET yang boleh tampil.
        // Jangan izinkan prompt Device Admin / Accessibility / Overlay recovery mendahului.
        if (!isSchoolTime && prefsManager.isPetDead) {
            PetDeadLockActivity.ensureStaleShowingReset(now)
            if (PetDeadLockActivity.isShowing) {
                return
            }
            var lastAck = prefsManager.lastPetDeadAckAt
            if (lastAck <= 0L) {
                prefsManager.lastPetDeadAckAt = now
                prefsManager.petDeadReminderCount = 0
                lastAck = now
            }
            val reminderIntervalMs = resolvePetDeadReminderIntervalMs()
            if (now - lastAck >= reminderIntervalMs) {
                if (!prefsManager.isPetDead) {
                    prefsManager.lastPetDeadAckAt = 0L
                    prefsManager.petDeadReminderCount = 0
                    return@performChecks
                }
                hideOverlayLock()
                lockEnforcer.dismissLockScreen()
                lockEnforcer.stopKiosk()
                lockEnforcer.showPetDeadLock()
                return
            }
        }

        // CEK WAJIB: Device Admin aktif saat proteksi ON
        // Jika OFF saat jam sekolah di area sekolah tanpa izin uninstall, kunci layar kiosk.
        // JANGAN pernah melempar intent aktivasi admin OS secara background karena menyajikan tombol "Uninstal aplikasi".
        try {
            if (!devicePolicyManager.isAdminActive(compName) &&
                !prefsManager.isUninstallBypassActive(now) &&
                prefsManager.isSetupCompleted &&
                !isSettingsGrace &&
                scheduleManager.isSchoolTime() &&
                prefsManager.isInsideSchoolZone &&
                prefsManager.isProtectionActive &&
                !permissionManager.isPermissionActive()
            ) {
                if (now - lastAdminPromptTime > 15_000) {
                    lastAdminPromptTime = now
                    prefsManager.deviceAdminRequestUntil = 0L
                    showLockScreen("PERANGKAT TERKUNCI: Izin Administrator Perangkat dimatikan!")
                }
            }
        } catch (_: Exception) { }

        // CEK WAJIB: Layanan Aksesibilitas aktif saat proteksi ON
        // Jika OFF saat jam sekolah di area sekolah, kunci layar untuk mencegah bypass.
        // Di luar jam sekolah (di rumah), hening total agar tidak mengganggu siswa.
        try {
            if (!protectionTelemetry.isAccessibilityEnabled &&
                !isSettingsGrace &&
                !isDeviceAdminRecoveryActive
            ) {
                val cal = scheduleManager.getSchoolCalendar()
                val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
                val inDaytimeHours = hour in 6..15
                val shouldEnforceAccessibility = (isSchoolTime || (prefsManager.isInsideSchoolZone && inDaytimeHours)) &&
                    prefsManager.isInsideSchoolZone && !prefsManager.isHolidayMode

                if (shouldEnforceAccessibility) {
                    val protectionRecoveryPending =
                        prefsManager.protectionPendingA11yRecovery ||
                            prefsManager.protectionPendingOemRecovery ||
                            now - prefsManager.protectionActivationDialogAt <
                            PreferencesManager.PROTECTION_DIALOG_COOLDOWN_MS
                    if (protectionRecoveryPending) {
                        // Recovery proteksi sudah dijadwalkan oleh activation flow.
                        // Jangan relaunch MainActivity lagi dari performChecks periodik
                        // karena itu membuat dialog recovery tampak flicker.
                        hideOverlayLock()
                        return
                    }
                    if (now - lastAccessibilityLockTime > 1_500) {
                        lastAccessibilityLockTime = now
                        showLockScreen("PROTEKSI WAJIB AKTIF!\n\nBuka Aksesibilitas > Layanan Terinstall > EduLock Protection -> AKTIFKAN.")
                    }
                    return
                }
            }
        } catch (_: Exception) { }

        // ==========================================
        // 5.6 OVERLAY DICABUT OEM (sleep / Mode Senyap)
        // Tanpa SYSTEM_ALERT_WINDOW, kunci/perintah admin gagal diam-diam.
        // Bangunkan MainActivity agar siswa diarahkan aktifkan lagi.
        // ==========================================
        if (prefsManager.isProtectionActive &&
            !prefsManager.isHolidayMode &&
            prefsManager.isSetupCompleted &&
            !hasOverlayPermission()
        ) {
            requestOverlayPermissionRecovery("performChecks")
        }

        // ==========================================
        // 6. CEK JADWAL & STOP JIKA BUKAN WAKTU SEKOLAH / HARI TIDAK EFEKTIF
        // ==========================================
        if (!isSchoolTime) {
            val cal = scheduleManager.getSchoolCalendar()
            val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
            val inDaytimeHours = hour in 6..15
            val shouldHoldLockAtSchool = prefsManager.isInsideSchoolZone &&
                prefsManager.isProtectionActive &&
                !prefsManager.isHolidayMode &&
                inDaytimeHours

            if (!shouldHoldLockAtSchool) {
                hideOverlayLock()
                try {
                    val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
                    stopIntent.setPackage(packageName)
                    sendBroadcast(stopIntent)
                } catch (_: Exception) {
                }

                if (shouldShowGpsEnableOverlay()) {
                    showGpsEnableOverlayOnly()
                } else {
                    try {
                        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                        intent.setPackage(packageName)
                        intent.putExtra(LockEnforcer.EXTRA_DISMISS_TARGET, "gps")
                        sendBroadcast(intent)
                    } catch (_: Exception) {
                    }
                }

                if (isAfterSchool || !scheduleManager.isEffectiveSchoolDayToday()) {
                    prefsManager.isInsideSchoolZone = false
                    prefsManager.clearNearSchoolPresence()
                }
                return
            }
        }

        if (!isStrictModeNow()) {
            hideOverlayLock()
            try {
                val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
                stopIntent.setPackage(packageName)
                sendBroadcast(stopIntent)
            } catch (_: Exception) {
            }
            if (shouldShowGpsEnableOverlay()) {
                showGpsEnableOverlayOnly()
            } else {
                try {
                    val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                    intent.setPackage(packageName)
                    intent.putExtra(LockEnforcer.EXTRA_DISMISS_TARGET, "gps")
                    sendBroadcast(intent)
                } catch (_: Exception) {
                }
            }
            return
        }

        if (shouldShowGpsEnableOverlay()) {
            showGpsEnableOverlayOnly()
            return
        }

        // ==========================================
        // 7. PROTEKSI UTAMA
        // Sticky inside → full lockdown. Near-school presence (without sticky) → GPS/offline only.
        // Never-near-school (sick at home) → fail-open for GPS/net off.
        // ==========================================

        val isPermissionActive = permissionManager.isPermissionActive()
        val hasPresence = locationMonitor.shouldEnforcePresenceProtection(now)

        // 7.1. Belum sticky inside: jangan full app-lock / keluar-area, tapi tetap
        //     tegakkan GPS-off / offline jika ada indikasi kehadiran dekat sekolah.
        if (!prefsManager.isInsideSchoolZone) {
            hideOverlayLock()
            if (isPermissionActive) {
                return
            }
            if (hasPresence) {
                enforceGpsAndOfflinePresenceProtection(currentLocation)
            } else if (currentLocation == null) {
                android.util.Log.d(
                    "MonitoringService",
                    "GPS unavailable without school presence indication — fail-open"
                )
            }
            return
        }

        // 7.2. Aggressive Re-launch (Hanya jika di dalam sekolah & proteksi aktif)
        if (isPermissionActive) {
            hideOverlayLock()
            if (now - lastPermissionReleaseAt > 3000L) {
                lastPermissionReleaseAt = now

                try {
                    val dismissIntent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                    dismissIntent.setPackage(packageName)
                    sendBroadcast(dismissIntent)
                } catch (_: Exception) {
                }

                try {
                    val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
                    stopIntent.setPackage(packageName)
                    sendBroadcast(stopIntent)
                } catch (_: Exception) {
                }

                updateNotification("Izin Aktif", "Monitoring di-pause sementara", true)
            }
            return
        }
        
        val protectionRecoveryPending =
            prefsManager.protectionPendingA11yRecovery ||
                prefsManager.protectionPendingOemRecovery ||
                now - prefsManager.protectionActivationDialogAt <
                PreferencesManager.PROTECTION_DIALOG_COOLDOWN_MS
        if (!isSettingsGrace && !isPermissionActive) {
            if (protectionRecoveryPending || shouldPauseActivationEnforcement(now)) {
                hideOverlayLock()
                return
            }
            // Grace period transisi resmi: hormati switch grace dan lockTaskCooldownUntil
            val lastSwitchTime = prefsManager.appSwitchTimestamp
            val isTransitionGrace = (now - lastSwitchTime < LockPolicy.PACKAGE_SWITCH_GRACE_MS) ||
                (now < prefsManager.lockTaskCooldownUntil)
            if (isTransitionGrace) {
                return
            }

            try {
                if (!isAppOnForeground(this)) {
                    val decision = lockStateManager.reconcile(lockStateManager.buildSnapshot(prefsManager.lastForegroundPackage))
                    if (decision.shouldRelaunchEduLock) {
                        val traceId = lockMetricsLogger.startTrace("monitoring", decision.blockedPackage)
                        lockMetricsLogger.markDecisionEmitted(traceId, decision)
                        showOverlayLock("PERANGKAT TERKUNCI!\nKembali ke EduLock.")
                        lockMetricsLogger.markOverlayShown(traceId, "PERANGKAT TERKUNCI!\nKembali ke EduLock.")
                        lockEnforcer.relaunchEduLock(traceId)
                        if (decision.shouldAttemptKiosk) {
                            lockEnforcer.requestKiosk(traceId)
                        }
                        lockMetricsLogger.finishTrace(traceId)
                    } else {
                        hideOverlayLock()
                    }
                } else {
                    hideOverlayLock()
                }
            } catch (e: Exception) {
                android.util.Log.e("MonitoringService", "Failed to bring app to foreground: ${e.message}")
            }
        }

        // 7.3–7.5 GPS off / keluar area / offline (sticky inside)
        enforceGpsAndOfflinePresenceProtection(currentLocation, checkLeaveArea = true)
    }

    /**
     * Hard warn/lock for GPS-off and prolonged offline when school presence is indicated.
     * @param checkLeaveArea also enforce "keluar area" (sticky-inside path only).
     */
    private fun enforceGpsAndOfflinePresenceProtection(
        currentLocation: android.location.Location?,
        checkLeaveArea: Boolean = false
    ) {
        if (offlineMonitor.isAirplaneModeActive()) {
            triggerLockdown(
                "MODE PESAWAT DILARANG SAAT JAM SEKOLAH!\nHarap matikan Mode Pesawat.",
                bypassRecoveryTargets = true
            )
            return
        }

        if (currentLocation == null) {
            val lastGpsTime = prefsManager.lastGpsActiveTimestamp
            val currentTime = System.currentTimeMillis()
            val gpsOfflineDuration = currentTime - lastGpsTime
            val gpsWarnMs = prefsManager.gpsOffWarnMs.coerceAtLeast(0L)
            val gpsLockMs = prefsManager.gpsOffLockMs.coerceAtLeast(0L)

            if (gpsLockMs == 0L) {
                triggerLockdown("GPS MATI DI SEKOLAH!\nLockdown langsung.")
            } else if (gpsOfflineDuration > gpsLockMs) {
                triggerLockdown("GPS MATI DI SEKOLAH!\nSudah lebih dari ${gpsLockMs / 60000} menit.")
            } else if (gpsWarnMs > 0L && gpsOfflineDuration > gpsWarnMs) {
                val remainingMs = gpsLockMs - gpsOfflineDuration
                if (gpsLockMs > 0L && remainingMs > 0L) {
                    showToast("PERINGATAN! GPS mati. Lockdown dalam ${remainingMs / 1000} detik.")
                } else {
                    showToast("PERINGATAN! GPS mati. Lockdown sebentar lagi.")
                }
            }
        } else if (checkLeaveArea && !locationMonitor.isInsideSchoolArea()) {
            if (gracePeriodManager.isGracePeriodActive()) {
                showToast("Peringatan: Anda di luar area! Sisa waktu toleransi: ${gracePeriodManager.getRemainingTime() / 1000} detik")
            } else {
                triggerLockdown("KELUAR AREA SEKOLAH!\nKembali ke zona aman.")
            }
        }
    }

    // Implementasi Helper Method isAppOnForeground
    // Removed duplicate implementation since it was already defined below

    private fun resolveLockdownAudit(message: String): Pair<String, String>? {
        val compactMessage = message.replace('\n', ' ').trim()
        return when {
            compactMessage.contains("MODE PESAWAT", ignoreCase = true) ->
                "AIRPLANE_MODE_LOCKDOWN" to compactMessage
            compactMessage.contains("GPS MATI DI SEKOLAH", ignoreCase = true) ->
                "GPS_OFF_LOCKDOWN" to compactMessage
            compactMessage.contains("KELUAR AREA SEKOLAH", ignoreCase = true) ->
                "OUT_OF_ZONE_LOCKDOWN" to compactMessage
            compactMessage.contains("KONEKSI HILANG", ignoreCase = true) ->
                "OFFLINE_LOCKDOWN" to compactMessage
            else -> null
        }
    }

    private fun auditCriticalEvent(
        eventKey: String,
        description: String,
        cooldownMs: Long = 60_000L
    ) {
        val nisn = prefsManager.nisn
        if (nisn.isBlank()) return

        val now = System.currentTimeMillis()
        if (prefsManager.lastAuditEventKey == eventKey &&
            now - prefsManager.lastAuditEventAt < cooldownMs
        ) {
            return
        }

        prefsManager.lastAuditEventKey = eventKey
        prefsManager.lastAuditEventAt = now

        val location = if (::locationMonitor.isInitialized) locationMonitor.getCurrentLocation() else null
        firebaseManager.logViolation(
            nisn = nisn,
            schoolId = prefsManager.schoolId,
            violationType = eventKey,
            description = description,
            lat = location?.latitude ?: 0.0,
            lng = location?.longitude ?: 0.0
        )
    }
    
    private fun triggerLockdown(
        message: String,
        bypassRecoveryTargets: Boolean = false
    ) {
        if (prefsManager.isEmergencyUnlocked) {
            lockEnforcer.dismissLockScreen()
            lockEnforcer.stopKiosk()
            return
        }
        if (!bypassRecoveryTargets && prefsManager.anyRecoveryTargetActive()) {
            return
        }
        val isAirplaneLockdown = message.contains("MODE PESAWAT", ignoreCase = true)
        if (!isAirplaneLockdown && GpsEnableOverlay.isRequired(this)) {
            GpsEnableOverlay.show(this, atSchool = true)
            return
        }
        trustScoreManager.applyGraduatedPenalty()
        resolveLockdownAudit(message)?.let { (eventKey, description) ->
            auditCriticalEvent(eventKey, description)
        }
        
        val intent = Intent(this, LockScreenActivity::class.java)
        intent.putExtra("MESSAGE", message)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }

    private fun showLockScreen(message: String) {
        if (prefsManager.isEmergencyUnlocked) {
            lockEnforcer.dismissLockScreen()
            lockEnforcer.stopKiosk()
            return
        }
        if (prefsManager.isForceUpdateRequired) {
            hideOverlayLock()
            lockEnforcer.dismissLockScreen()
            lockEnforcer.stopKiosk()
            return
        }
        try {
            lockEnforcer.relaunchEduLock()
            lockEnforcer.requestKiosk()
        } catch (_: Exception) {
        }

        try {
            val channelId = "EduLockLockScreen"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = getSystemService(NotificationManager::class.java)
                val channel = NotificationChannel(
                    channelId,
                    "EduLock Lock Screen",
                    NotificationManager.IMPORTANCE_HIGH
                )
                manager.createNotificationChannel(channel)
            }

            val fullScreenIntent = (packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this, MainActivity::class.java)).apply {
                putExtra("MESSAGE", message)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
            }
            val fullScreenPendingIntent = android.app.PendingIntent.getActivity(
                this,
                1002,
                fullScreenIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(this, channelId)
                .setContentTitle("EduLock")
                .setContentText("Proteksi aktif")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(fullScreenPendingIntent, true)

            val manager = getSystemService(NotificationManager::class.java)
            manager.notify(1002, builder.build())
        } catch (_: Exception) {
        }
    }

    private fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    /**
     * OEM sering mencabut "Tampil di atas aplikasi lain" saat sleep / Mode Senyap.
     * Tanpa izin ini, showOverlayLock() gagal diam-diam → proteksi ON tidak terkunci.
     * Recovery: bangunkan MainActivity + notifikasi fullscreen agar user aktifkan lagi.
     */
    private fun requestOverlayPermissionRecovery(reason: String) {
        if (hasOverlayPermission()) return
        if (prefsManager.isForceUpdateRequired) return
        if (!prefsManager.isProtectionActive ||
            prefsManager.isHolidayMode ||
            permissionManager.isPermissionActive() ||
            !scheduleManager.isSchoolTime()
        ) {
            return
        }
        val now = System.currentTimeMillis()
        if (now - lastOverlayRecoverAt < 8_000L) return
        lastOverlayRecoverAt = now

        android.util.Log.w("MonitoringService", "Overlay permission missing — recovering ($reason)")
        acquireWakeLock()
        updateNotification(
            "Izin Overlay Hilang",
            "Aktifkan 'Tampil di atas aplikasi lain' agar EduLock bisa mengunci HP"
        )

        try {
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                )
                putExtra("force_overlay_recover", true)
                putExtra("overlay_recover_reason", reason)
            }
            startActivity(intent)
        } catch (e: Exception) {
            android.util.Log.e("MonitoringService", "Gagal buka MainActivity untuk overlay recover: ${e.message}")
        }

        try {
            lockEnforcer.relaunchEduLock()
        } catch (_: Exception) {
        }

        try {
            val channelId = "EduLockOverlayRecover"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = getSystemService(NotificationManager::class.java)
                val channel = NotificationChannel(
                    channelId,
                    "EduLock Overlay Recovery",
                    NotificationManager.IMPORTANCE_HIGH
                )
                manager.createNotificationChannel(channel)
            }
            val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
                putExtra("force_overlay_recover", true)
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
            }
            val pending = android.app.PendingIntent.getActivity(
                this,
                1007,
                fullScreenIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            val notif = NotificationCompat.Builder(this, channelId)
                .setContentTitle("Izin Overlay Hilang")
                .setContentText("Ketuk untuk aktifkan 'Tampil di atas aplikasi lain'")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setContentIntent(pending)
                .setFullScreenIntent(pending, true)
                .setAutoCancel(true)
                .build()
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(1007, notif)
        } catch (_: Exception) {
        }
    }

    private fun showOverlayLock(message: String) {
        // [X] Stop SetupProtectionService (overlay merah PROTEKSI AKTIF) — enforcement != setup awal
        try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}
        try {
            if (overlayLockView != null) return
            if (!hasOverlayPermission()) {
                requestOverlayPermissionRecovery("showOverlayLock")
                return
            }
            // [B-1] Skip overlay window manager jika recovery active atau Lock/Overlay activity foreground
            if (prefsManager.anyRecoveryTargetActive() || prefsManager.isUiForeground) {
                return
            }

            val root = FrameLayout(this)
            root.setBackgroundColor(Color.parseColor("#CC000000"))
            root.setOnTouchListener { _, _ ->
                // [B-3] Return false = child Views (Button) tetap terima click
                false
            }

            val container = LinearLayout(this)
            container.orientation = LinearLayout.VERTICAL
            container.gravity = Gravity.CENTER
            container.setPadding(48, 48, 48, 48)

            val tv = TextView(this)
            tv.text = message
            tv.setTextColor(Color.WHITE)
            tv.textSize = 18f
            tv.gravity = Gravity.CENTER

            val btn = Button(this)
            btn.text = "Buka EduLock"
            btn.setOnClickListener {
                try {
                    // [C] Hapus overlay TERLEBIH DAHULU, baru startActivity
                    hideOverlayLock()

                    val intent = Intent(this, LockScreenActivity::class.java)
                    intent.putExtra("MESSAGE", message)
                    intent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                    startActivity(intent)
                } catch (_: Throwable) {
                }
            }

            container.addView(tv)
            val lpBtn = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lpBtn.topMargin = 24
            container.addView(btn, lpBtn)

            val lp = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            root.addView(container, lp)

            val type =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else WindowManager.LayoutParams.TYPE_PHONE
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
                android.graphics.PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.CENTER

            overlayLockView = root
            windowManager.addView(root, params)
        } catch (_: Exception) {
            overlayLockView = null
        }
    }

    private fun hideOverlayLock() {
        // [FIX X - SetupProtectionService overlay merah PROTEKSI AKTIF]
        // SELALU hentikan SetupProtectionService setiap hideOverlayLock dipanggil
        // (WALAUPUN overlayLockView NULL). Karena skenario user: Accessibility OFF +
        // protect ON → SetupProtectionService ada tapi enforcement overlayLockView
        // tidak terpasanng → old code return sebelum stop.
        try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}
        val v = overlayLockView ?: return
        try {
            windowManager.removeView(v)
        } catch (_: Exception) {
        } finally {
            overlayLockView = null
        }
    }



    private fun showToast(message: String) {
        handler.post {
            Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }

    private fun ensureFcmCommandChannel(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return CHANNEL_ID_FCM_COMMAND
        return try {
            val manager = getSystemService(NotificationManager::class.java)
            val existing = manager.getNotificationChannel(CHANNEL_ID_FCM_COMMAND)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID_FCM_COMMAND,
                    "Perintah EduLock (Admin)",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifikasi perintah jarak jauh dari admin sekolah: cek izin, sync, relock, kill switch."
                    enableLights(true)
                    lightColor = Color.YELLOW
                }
                manager.createNotificationChannel(channel)
            }
            CHANNEL_ID_FCM_COMMAND
        } catch (_: Exception) {
            CHANNEL_ID_FCM_COMMAND
        }
    }

    private fun showFcmCommandNotification(
        title: String,
        messageBody: String,
        openSetupActivity: Boolean = false
    ) {
        try {
            val channelId = ensureFcmCommandChannel()
            val pendingIntentFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            } else {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT
            }
            val contentIntent = if (openSetupActivity) {
                val setupIntent = Intent(this, SetupActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                android.app.PendingIntent.getActivity(
                    this, 0, setupIntent, pendingIntentFlag
                )
            } else {
                val mainIntent = Intent(this, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                android.app.PendingIntent.getActivity(
                    this, 0, mainIntent, pendingIntentFlag
                )
            }
            val builder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setStyle(NotificationCompat.BigTextStyle().bigText(messageBody))
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(contentIntent)
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .notify(NOTIF_ID_FCM_COMMAND, builder.build())
        } catch (_: Exception) {}
    }

    // =========================================================================
    // [Fase 2 - Langkah 6 Command Implementation]
    // Implementasi action handler untuk 5 ACTION FCM baru.
    // Semua handler DEFENSIF: try/catch luar dalam, tidak pernah crash service.
    // =========================================================================

    private fun handleActionCheckPerm(commandId: String) {
        try {
            val now = System.currentTimeMillis()
            val adminActive = EduLockOEMHardeningHelper.isDeviceAdminActive(this)
            val a11yActive = EduLockOEMHardeningHelper.isAccessibilityServiceEnabled(this)
            val overlayActive = EduLockOEMHardeningHelper.isOverlayPermissionGranted(this)
            val batteryActive = EduLockOEMHardeningHelper.isIgnoringBatteryOptimizations(this)
            val broken = mutableListOf<String>()
            if (!adminActive) broken.add("Device Admin")
            if (!a11yActive) broken.add("Accessibility")
            if (!overlayActive) broken.add("Overlay (Tampil di Atas Aplikasi Lain)")
            if (!batteryActive) broken.add("Battery Ignore (Tidak Dioptimalkan)")
            val brand = EduLockOEMHardeningHelper.detectOEMBrand()
            val brokenPermsList = broken.joinToString(separator = ",")
            val allOk = broken.isEmpty()
            // 1. Ack ke Firebase terlebih dahulu (status + hasil perizinan)
            try {
                firebaseReporter.acknowledgeFcmCommand(
                    commandId = commandId,
                    commandType = "CHECK_PERM",
                    status = if (allOk) "OK" else "BROKEN_PERM",
                    ackSource = "runtime",
                    extra = mapOf(
                        "brand" to brand.name,
                        "deviceAdmin" to adminActive.toString(),
                        "accessibility" to a11yActive.toString(),
                        "overlay" to overlayActive.toString(),
                        "batteryIgnore" to batteryActive.toString(),
                        "brokenPerms" to brokenPermsList,
                        "checkedAt" to now.toString()
                    )
                )
            } catch (_: Exception) {}
            // [Fase 2.3 Langkah 8: Telemetry permission_checked event + health endpoint update]
            try {
                val model = android.os.Build.MODEL
                firebaseReporter.reportEvent(
                    "permission_checked",
                    mapOf(
                        "triggerFrom" to (commandId.ifBlank { "periodic_or_policy_change" }),
                        "brand" to brand.name,
                        "model" to model,
                        "admin" to adminActive.toString(),
                        "a11y" to a11yActive.toString(),
                        "overlay" to overlayActive.toString(),
                        "batteryIgnore" to batteryActive.toString(),
                        "brokenPermsList" to brokenPermsList,
                        "allOk" to allOk.toString()
                    )
                )
                firebaseReporter.sendStatusUpdate(
                    latitude = null,
                    longitude = null,
                    isInsideZone = if (::prefsManager.isInitialized) prefsManager.isInsideSchoolZone else false,
                    trustScore = 0,
                    isGpsActive = false,
                    isInternetActive = if (::offlineMonitor.isInitialized) offlineMonitor.isInternetAvailable() else false,
                    statusMessage = if (allOk) "Protection OK" else "Broken Permissions: $brokenPermsList",
                    isAccessibilityEnabled = a11yActive,
                    isDeviceAdminEnabled = adminActive,
                    isProtectionActive = if (::prefsManager.isInitialized) prefsManager.isProtectionActive else true,
                    isPermissionActive = if (::permissionManager.isInitialized) permissionManager.isPermissionActive() else false,
                    complianceStatus = if (allOk) "COMPLIANT" else "PERMISSION_BROKEN",
                    protectionHealth = if (allOk) "GOOD" else "NEEDS_RECOVERY",
                    lastProtectionCheckAt = now,
                    appVersionCode = BuildConfig.VERSION_CODE,
                    forceFlush = !allOk,
                    brandOEM = brand.name,
                    modelOEM = model,
                    isOverlayEnabled = overlayActive,
                    isBatteryIgnoreEnabled = batteryActive,
                    killSwitchActive = prefsManager.isKillSwitchActive(now),
                    killSwitchUntil = prefsManager.killSwitchUntil.takeIf { it > 0L },
                    brokenPermsList = brokenPermsList,
                    lastPermissionCheckAt = now
                )
            } catch (_: Exception) {}
            // 2. Jika ada yang rusak → tampilkan notifikasi recovery + arah ke SetupActivity dengan grace.
            if (!allOk) {
                try {
                    val prefs = prefsManager
                    prefs.isSettingsOpen = true
                    prefs.settingsGraceUntil = now + 180_000L
                    prefs.clearRecoveryForTarget(PreferencesManager.RECOVERY_TARGET_DEVICE_ADMIN)
                    prefs.clearRecoveryForTarget(PreferencesManager.RECOVERY_TARGET_ACCESSIBILITY)
                    prefs.clearRecoveryForTarget(PreferencesManager.RECOVERY_TARGET_OVERLAY)
                    prefs.clearRecoveryForTarget(PreferencesManager.RECOVERY_TARGET_BATTERY)
                } catch (_: Exception) {}
                val msg = buildString {
                    append("Izin yang perlu diperbaiki (Brand ${brand.name}):\n")
                    broken.forEachIndexed { i, s -> append("${i + 1}. $s\n") }
                    append("\nKetuk notifikasi ini untuk masuk ke halaman perbaikan izin EduLock.")
                }
                showFcmCommandNotification(
                    title = "⚠️ EduLock: Perbaiki Izin (Admin #${commandId.takeLast(4)})",
                    messageBody = msg,
                    openSetupActivity = true
                )
            }
        } catch (t: Throwable) {
            Log.e("MS-CheckPerm", "handleActionCheckPerm failed: ${t.message}")
        }
    }

    private fun handleActionSyncNow(commandId: String) {
        try {
            val now = System.currentTimeMillis()
            val brand = EduLockOEMHardeningHelper.detectOEMBrand()
            try {
                syncSchoolConfigFromApi(force = true)
            } catch (_: Exception) {}
            try {
                forceSyncProtectionStatus()
            } catch (_: Exception) {}
            handler.post {
                try { performChecks() } catch (_: Exception) {}
            }
            handler.postDelayed({
                try { performChecks() } catch (_: Exception) {}
            }, 2_000L)
            try {
                firebaseReporter.acknowledgeFcmCommand(
                    commandId = commandId,
                    commandType = "SYNC_NOW",
                    status = "SYNC_SCHEDULED",
                    ackSource = "runtime",
                    extra = mapOf(
                        "brand" to brand.name,
                        "issuedAt" to now.toString()
                    )
                )
            } catch (_: Exception) {}
            showFcmCommandNotification(
                title = "🔄 EduLock: Sync Diminta (Admin)",
                messageBody = "Sinkronisasi jadwal & status proteksi EduLock sedang dijalankan di belakang layar."
            )
        } catch (t: Throwable) {
            Log.e("MS-SyncNow", "handleActionSyncNow failed: ${t.message}")
        }
    }

    private fun handleActionForceRelock(commandId: String, now: Long) {
        try {
            val brand = EduLockOEMHardeningHelper.detectOEMBrand()
            // Reset semua marker yang bisa membatalkan enforcement.
            try {
                prefsManager.isEmergencyUnlocked = false
                prefsManager.isForcedLocation = false
                prefsManager.killSwitchUntil = 0L
                prefsManager.emergencyUnlockTimestamp = 0L
            } catch (_: Exception) {}
            lastForceEnforceHandledAt = 0L
            // Force performChecks segera + delayed
            handler.post {
                try { performChecks() } catch (_: Exception) {}
            }
            handler.postDelayed({
                try { performChecks() } catch (_: Exception) {}
            }, 1_500L)
            try {
                firebaseReporter.acknowledgeFcmCommand(
                    commandId = commandId,
                    commandType = "FORCE_RELOCK",
                    status = "RELOCK_SCHEDULED",
                    ackSource = "runtime",
                    extra = mapOf(
                        "brand" to brand.name,
                        "issuedAt" to now.toString()
                    )
                )
            } catch (_: Exception) {}
            showFcmCommandNotification(
                title = "🔒 EduLock: Force Relock (Admin)",
                messageBody = "Mode darurat & kill switch dicabut. Enforcement EduLock sedang dievaluasi ulang."
            )
        } catch (t: Throwable) {
            Log.e("MS-ForceRelock", "handleActionForceRelock failed: ${t.message}")
        }
    }

    private fun handleActionKillLock(commandId: String, requestedDurationMs: Long, now: Long) {
        try {
            val brand = EduLockOEMHardeningHelper.detectOEMBrand()
            // Cap durasi kill switch: min 5 menit, max 24 jam (jika durasi tidak masuk akal).
            val cappedDuration = requestedDurationMs.coerceIn(5L * 60L * 1000L, 24L * 60L * 60L * 1000L)
            val until = now + cappedDuration
            try {
                // Set kill switch flag PERTAMA → sebelum bersihkan overlay → performChecks berikutnya
                // akan melihat isKillSwitchActive() dan tidak enforce kembali sampai cap habis / RESTORE.
                prefsManager.killSwitchUntil = until
                prefsManager.lastKillSwitchCommandId = commandId.ifBlank { prefsManager.lastKillSwitchCommandId }
                // Juga tandai isEmergencyUnlocked sebagai belt & suspender + isProtectionActive OFF.
                prefsManager.isEmergencyUnlocked = true
                prefsManager.emergencyUnlockTimestamp = now
                prefsManager.isProtectionActive = false
                prefsManager.isSettingsOpen = false
                prefsManager.settingsGraceUntil = 0L
                prefsManager.deviceAdminRequestUntil = 0L
            } catch (_: Exception) {}
            // Bersihkan semua enforcement overlay / lockscreen yang aktif SAAT INI.
            try {
                hideOverlayLock()
            } catch (_: Exception) {}
            try {
                lockEnforcer.dismissLockScreen()
                lockEnforcer.stopKiosk()
            } catch (_: Exception) {}
            try {
                stopService(Intent(this, SetupProtectionService::class.java))
            } catch (_: Exception) {}
            // Update notifikasi foreground jadi "Kill Switch Aktif"
            try {
                val durMin = cappedDuration / 60_000L
                updateNotification(
                    "EduLock: Kill Switch Aktif",
                    "Proteksi DITANGGUHKAN selama ${durMin}m oleh admin. Akan aktif kembali otomatis."
                )
            } catch (_: Exception) {}
            try {
                firebaseReporter.acknowledgeFcmCommand(
                    commandId = commandId,
                    commandType = "KILL_LOCK",
                    status = "KILL_SWITCH_ACTIVE",
                    ackSource = "runtime",
                    extra = mapOf(
                        "brand" to brand.name,
                        "requestedDurationMs" to requestedDurationMs.toString(),
                        "cappedDurationMs" to cappedDuration.toString(),
                        "killUntil" to until.toString(),
                        "issuedAt" to now.toString()
                    )
                )
            } catch (_: Exception) {}
            // [Fase 2.3 Langkah 8: Telemetry kill_switch_activated event + health endpoint update]
            try {
                val model = android.os.Build.MODEL
                firebaseReporter.reportEvent(
                    "kill_switch_activated",
                    mapOf(
                        "commandId" to commandId.ifBlank { "local_or_empty" },
                        "brand" to brand.name,
                        "model" to model,
                        "requestedDurationMs" to requestedDurationMs.toString(),
                        "cappedDurationMs" to cappedDuration.toString(),
                        "killUntil" to until.toString()
                    )
                )
                firebaseReporter.sendStatusUpdate(
                    latitude = null,
                    longitude = null,
                    isInsideZone = if (::prefsManager.isInitialized) prefsManager.isInsideSchoolZone else false,
                    trustScore = 0,
                    isGpsActive = false,
                    isInternetActive = if (::offlineMonitor.isInitialized) offlineMonitor.isInternetAvailable() else false,
                    statusMessage = "Kill Switch aktif s/d $until (${cappedDuration / 60_000L}m)",
                    isAccessibilityEnabled = EduLockOEMHardeningHelper.isAccessibilityServiceEnabled(this),
                    isDeviceAdminEnabled = EduLockOEMHardeningHelper.isDeviceAdminActive(this),
                    isProtectionActive = false,
                    isPermissionActive = if (::permissionManager.isInitialized) permissionManager.isPermissionActive() else false,
                    complianceStatus = "KILL_SWITCH_ACTIVE",
                    protectionHealth = "ADMIN_PAUSED",
                    lastProtectionCheckAt = now,
                    appVersionCode = BuildConfig.VERSION_CODE,
                    forceFlush = true,
                    brandOEM = brand.name,
                    modelOEM = model,
                    isOverlayEnabled = EduLockOEMHardeningHelper.isOverlayPermissionGranted(this),
                    isBatteryIgnoreEnabled = EduLockOEMHardeningHelper.isIgnoringBatteryOptimizations(this),
                    killSwitchActive = true,
                    killSwitchUntil = until,
                    brokenPermsList = "",
                    lastPermissionCheckAt = now
                )
            } catch (_: Exception) {}
            // Periodic reminder alarm mati sementara (tidak perlu spam user selama kill switch)
            cancelPermissionReminderAlarm()
            val durMin = cappedDuration / 60_000L
            showFcmCommandNotification(
                title = "⏸️ EduLock: Kill Switch Aktif (Admin)",
                messageBody = "Proteksi EduLock DITANGGUHKAN selama $durMin menit oleh admin. Akan kembali otomatis setelah batas waktu."
            )
        } catch (t: Throwable) {
            Log.e("MS-KillLock", "handleActionKillLock failed: ${t.message}")
        }
    }

    private fun handleActionRestoreLock(commandId: String, now: Long) {
        try {
            val brand = EduLockOEMHardeningHelper.detectOEMBrand()
            val wasActive = prefsManager.isKillSwitchActive(now) ||
                    prefsManager.isEmergencyUnlocked ||
                    prefsManager.killSwitchUntil > 0L
            try {
                prefsManager.killSwitchUntil = 0L
                prefsManager.isEmergencyUnlocked = false
                prefsManager.emergencyUnlockTimestamp = 0L
                // Kembalikan isProtectionActive = true (sesuai master switch;
                // master_switch listener tetap di FirebaseReporter kalau nanti beda).
                prefsManager.isProtectionActive = true
            } catch (_: Exception) {}
            handler.post {
                try { performChecks() } catch (_: Exception) {}
            }
            handler.postDelayed({
                try { performChecks() } catch (_: Exception) {}
            }, 1_500L)
            try {
                firebaseReporter.acknowledgeFcmCommand(
                    commandId = commandId,
                    commandType = "RESTORE_LOCK",
                    status = if (wasActive) "RESTORED_FROM_KILL" else "NO_KILL_ACTIVE",
                    ackSource = "runtime",
                    extra = mapOf(
                        "brand" to brand.name,
                        "issuedAt" to now.toString()
                    )
                )
            } catch (_: Exception) {}
            // [Fase 2.3 Langkah 8: Telemetry kill_switch_restored event + health endpoint update]
            try {
                val model = android.os.Build.MODEL
                firebaseReporter.reportEvent(
                    "kill_switch_restored",
                    mapOf(
                        "commandId" to commandId.ifBlank { "local_or_empty" },
                        "brand" to brand.name,
                        "model" to model,
                        "wasPreviouslyActive" to wasActive.toString()
                    )
                )
                val a11y = EduLockOEMHardeningHelper.isAccessibilityServiceEnabled(this)
                val admin = EduLockOEMHardeningHelper.isDeviceAdminActive(this)
                val overlay = EduLockOEMHardeningHelper.isOverlayPermissionGranted(this)
                val batt = EduLockOEMHardeningHelper.isIgnoringBatteryOptimizations(this)
                val allOk = a11y && admin && overlay && batt
                firebaseReporter.sendStatusUpdate(
                    latitude = null,
                    longitude = null,
                    isInsideZone = if (::prefsManager.isInitialized) prefsManager.isInsideSchoolZone else false,
                    trustScore = 0,
                    isGpsActive = false,
                    isInternetActive = if (::offlineMonitor.isInitialized) offlineMonitor.isInternetAvailable() else false,
                    statusMessage = if (wasActive) "Kill switch dicabut — proteksi dikembalikan" else "Proteksi normal (tidak ada kill switch)",
                    isAccessibilityEnabled = a11y,
                    isDeviceAdminEnabled = admin,
                    isProtectionActive = true,
                    isPermissionActive = if (::permissionManager.isInitialized) permissionManager.isPermissionActive() else false,
                    complianceStatus = if (allOk) "COMPLIANT" else "PERMISSION_BROKEN",
                    protectionHealth = if (allOk) "GOOD" else "NEEDS_RECOVERY",
                    lastProtectionCheckAt = now,
                    appVersionCode = BuildConfig.VERSION_CODE,
                    forceFlush = wasActive,
                    brandOEM = brand.name,
                    modelOEM = model,
                    isOverlayEnabled = overlay,
                    isBatteryIgnoreEnabled = batt,
                    killSwitchActive = false,
                    killSwitchUntil = 0L,
                    brokenPermsList = buildString {
                        val list = mutableListOf<String>()
                        if (!admin) list.add("Device Admin")
                        if (!a11y) list.add("Accessibility")
                        if (!overlay) list.add("Overlay")
                        if (!batt) list.add("Battery Ignore")
                        list.joinToString(separator = ",")
                    },
                    lastPermissionCheckAt = now
                )
            } catch (_: Exception) {}
            // Kembalikan periodic alarm CHECK_PERM jika setup complete.
            if (prefsManager.isSetupCompleted) ensurePermissionReminderAlarm()
            showFcmCommandNotification(
                title = "✅ EduLock: Kill Switch Dicabut (Admin)",
                messageBody = if (wasActive) "Proteksi EduLock dikembalikan normal. Enforcement segera dievaluasi ulang."
                else "Perintah restore diterima. EduLock sudah dalam mode proteksi normal."
            )
        } catch (t: Throwable) {
            Log.e("MS-RestoreLock", "handleActionRestoreLock failed: ${t.message}")
        }
    }

    // =========================================================================
    // [Fase 2.2 - Langkah 7: Trigger backend otomatis helper & periodic reminder]
    // =========================================================================

    private fun sendCommandToSelf(action: String, reasonTag: String) {
        try {
            val intent = Intent(this, MonitoringService::class.java).apply {
                this.action = action
                putExtra("trigger_reason", reasonTag)
            }
            startService(intent)
        } catch (_: Exception) {}
    }

    private fun ensurePermissionReminderAlarm() {
        try {
            val am = getSystemService(ALARM_SERVICE) as android.app.AlarmManager
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            } else {
                android.app.PendingIntent.FLAG_UPDATE_CURRENT
            }
            val intent = android.content.Intent("com.sekolah.edulock.ACTION_PERIODIC_CHECK_PERM").apply {
                setPackage(packageName)
            }
            val pi = android.app.PendingIntent.getBroadcast(this, RC_PERMISSION_REMINDER, intent, flags)
            val triggerAt = android.os.SystemClock.elapsedRealtime() + PERMISSION_REMINDER_INTERVAL_MS
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(android.app.AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi)
                } else {
                    am.setInexactRepeating(
                        android.app.AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAt,
                        PERMISSION_REMINDER_INTERVAL_MS,
                        pi
                    )
                }
            } catch (_: Exception) {
                // Fallback tanpa wake-up exact, cukup inexact.
                am.setInexactRepeating(
                    android.app.AlarmManager.ELAPSED_REALTIME,
                    triggerAt,
                    PERMISSION_REMINDER_INTERVAL_MS,
                    pi
                )
            }
        } catch (_: Exception) {}
    }

    private fun cancelPermissionReminderAlarm() {
        try {
            val am = getSystemService(ALARM_SERVICE) as android.app.AlarmManager
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.app.PendingIntent.FLAG_NO_CREATE or android.app.PendingIntent.FLAG_IMMUTABLE
            } else {
                android.app.PendingIntent.FLAG_NO_CREATE
            }
            val intent = android.content.Intent("com.sekolah.edulock.ACTION_PERIODIC_CHECK_PERM").apply {
                setPackage(packageName)
            }
            val pi = android.app.PendingIntent.getBroadcast(this, RC_PERMISSION_REMINDER, intent, flags)
            if (pi != null) am.cancel(pi)
        } catch (_: Exception) {}
    }

    private fun startForegroundService() {
        // Cek status silent saat startup
        val isSilent = if (::prefsManager.isInitialized) !prefsManager.isProtectionActive else false
        val channelId = if (isSilent) "MonitoringChannelSilent" else "MonitoringChannel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            
            // Channel High Importance
            val channelHigh = NotificationChannel(
                "MonitoringChannel",
                "EduLock Monitoring",
                NotificationManager.IMPORTANCE_HIGH
            )
            manager.createNotificationChannel(channelHigh)

            // Channel Low Importance (Silent)
            val channelLow = NotificationChannel(
                "MonitoringChannelSilent",
                "EduLock Silent Monitoring",
                NotificationManager.IMPORTANCE_LOW
            )
            manager.createNotificationChannel(channelLow)
        }

        // Intent untuk Full Screen (Auto Open)
        val fullScreenIntent = Intent(this, MainActivity::class.java)
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val fullScreenPendingIntent = android.app.PendingIntent.getActivity(
            this,
            0,
            fullScreenIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(if (isSilent) "Mode Senyap" else "EduLock Aktif")
            .setContentText(if (isSilent) "Monitoring Dinonaktifkan oleh Admin" else "Memantau aktivitas belajar siswa")
            .setSmallIcon(R.mipmap.ic_launcher)

        if (isSilent) {
            builder.setPriority(NotificationCompat.PRIORITY_LOW)
            builder.setCategory(NotificationCompat.CATEGORY_SERVICE)
        } else {
            builder.setPriority(NotificationCompat.PRIORITY_HIGH)
            builder.setCategory(NotificationCompat.CATEGORY_ALARM)
            builder.setFullScreenIntent(fullScreenPendingIntent, true)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val hasLocation = androidx.core.content.ContextCompat.checkSelfPermission(
                    this, android.Manifest.permission.ACCESS_COARSE_LOCATION
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED
                
                if (hasLocation) {
                    startForeground(1, builder.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
                } else {
                    // Fallback ke dataSync jika belum ada permission lokasi (mencegah SecurityException di Android 14)
                    startForeground(1, builder.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
                }
            } catch (e: Exception) {
                try {
                    startForeground(1, builder.build())
                } catch (e2: Exception) {
                    android.util.Log.e("MonitoringService", "Gagal startForeground: ${e2.message}")
                }
            }
        } else {
            startForeground(1, builder.build())
        }
    }
    
    private fun startUninstallAuthorizationListener() {
        // Prevent duplicate listener
        if (uninstallListener != null) return

        val nisn = prefsManager.nisn
        if (nisn.isEmpty()) {
            android.util.Log.e("MonitoringService", "NISN kosong, mencoba lagi dalam 5 detik...")
            handler.postDelayed({ startUninstallAuthorizationListener() }, 5000)
            return
        }

        // Gunakan URL eksplisit (Asia Southeast 1)
        val database = SchoolServiceGuard.database(this)
        uninstallDbRef = database.getReference("students").child(nisn)

        uninstallListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val rawAuthorized = readFlexibleBoolean(snapshot.child("uninstall_authorized"))
                val until = snapshot.child("uninstall_authorized_until").getValue(Long::class.java) ?: 0L
                val now = System.currentTimeMillis()
                val isAuthorized = rawAuthorized && until > now
                
                // Debug Toast untuk memastikan listener hidup
                // showToast("Status Uninstall Remote: $isAuthorized")

                // Hanya update jika berubah agar tidak spam log/toast
                if (isAuthorized != prefsManager.isUninstallAuthorized) {
                    prefsManager.isUninstallAuthorized = isAuthorized
                    if (isAuthorized) {
                        try {
                            val intent = android.content.Intent(this@MonitoringService, MainActivity::class.java).apply {
                                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
                            }
                            startActivity(intent)
                        } catch (e: Exception) {
                            android.util.Log.e("MonitoringService", "Gagal memunculkan layar Uninstall otomatis: ${e.message}")
                        }
                    } else {
                        // Reset bypass flags secara total ketika izin dicabut oleh Admin
                        prefsManager.uninstallBypassUntil = 0L
                        prefsManager.settingsGraceUntil = 0L
                        prefsManager.isSettingsOpen = false

                        try {
                            val intent = android.content.Intent(this@MonitoringService, MainActivity::class.java).apply {
                                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP)
                                putExtra("ACTION_DISMISS_UNINSTALL", true)
                            }
                            startActivity(intent)
                        } catch (e: Exception) {
                            android.util.Log.e("MonitoringService", "Gagal mereset layar Uninstall: ${e.message}")
                        }
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Uninstall listener cancelled: ${error.message}")
                markRuntimeHealth("LISTENER_DEGRADED", "uninstall:${error.message}")
            }
        }
        uninstallDbRef?.addValueEventListener(uninstallListener!!)
        markListenerRefresh("uninstall_listener")
        android.util.Log.d("MonitoringService", "Uninstall Listener started for NISN: $nisn")
    }

    private fun startHolidayModeListener() {
        // Prevent duplicate listener
        if (holidayModeListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        // Listen ke node global sekolah
        // Gunakan URL eksplisit (Asia Southeast 1)
        val database = SchoolServiceGuard.database(this)
        holidayModeRef = database.getReference("schools").child(schoolId).child("config").child("is_holiday_mode")

        holidayModeListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val isHoliday = readFlexibleBoolean(snapshot)
                
                if (isHoliday != prefsManager.isHolidayMode) {
                    prefsManager.isHolidayMode = isHoliday
                    persistSchoolLocalDataSnapshot("listener_holiday_mode_service")
                    if (isHoliday) {
                        showToast("🎉 MODE BEBAS AKTIF! Silakan gunakan HP untuk dokumentasi.")
                        hideOverlayLock()
                        
                        // Update notifikasi agar siswa tahu (SILENT agar tidak memunculkan app)
                        updateNotification("Mode Bebas Aktif", "Silakan gunakan HP dengan bijak", true)

                        // Kirim broadcast untuk menutup LockScreen jika sedang aktif
                        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                        sendBroadcast(intent)
                    } else {
                        hideOverlayLock()
                        showToast("🔒 Mode Bebas Berakhir. Monitoring kembali aktif.")
                        updateNotification("EduLock Aktif", "Memantau aktivitas belajar siswa")

                        // ================================================================
                        // FIX: AGGRESSIVE RE-LOCK saat Holiday Mode DIMATIKAN
                        // ================================================================
                        // ROOT CAUSE: Selama holiday mode aktif, performChecks() selalu
                        // 'return' di step 4 sehingga isInsideSchoolZone TIDAK pernah
                        // di-refresh. Akibatnya ketika mode dimatikan, isInsideSchoolZone
                        // bernilai FALSE (stale) dan step 7.1 langsung return lagi —
                        // siswa tidak pernah dikunci ulang.
                        //
                        // FIX: Force isInsideSchoolZone dari cache lokasi terakhir,
                        // lalu lakukan 3x staged re-lock dalam 10 detik pertama.
                        // ================================================================
                        val shouldEnforce = prefsManager.isProtectionActive &&
                            !permissionManager.isPermissionActive() &&
                            (scheduleManager.isSchoolTime() || prefsManager.isInsideSchoolZone)

                        if (shouldEnforce) {

                            // 1. Force-refresh isInsideSchoolZone dari lokasi cache terakhir
                            val cachedLocation = locationMonitor.getCurrentLocation()
                            if (cachedLocation != null) {
                                val isInside = locationMonitor.isInsideSchoolArea()
                                prefsManager.isInsideSchoolZone = isInside
                                android.util.Log.d("MonitoringService", "HolidayOFF: isInsideSchoolZone=$isInside (from cached GPS)")
                            } else {
                                // Tidak ada lokasi cache → default TRUE (lebih aman: lock dulu)
                                prefsManager.isInsideSchoolZone = true
                                android.util.Log.d("MonitoringService", "HolidayOFF: No cached location, isInsideSchoolZone forced TRUE")
                            }

                            // 2. Aktifkan kembali Kiosk Mode tanpa mengganggu UI (jangan tampilkan layar "Mode Bebas berakhir")
                            try {
                                val startIntent = Intent("com.sekolah.edulock.ACTION_START_KIOSK")
                                startIntent.setPackage(packageName)
                                sendBroadcast(startIntent)
                            } catch (_: Exception) { }

                            // 3. Langsung buka paksa aplikasi ke foreground
                            try {
                                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                                launchIntent?.addFlags(
                                    Intent.FLAG_ACTIVITY_NEW_TASK or
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                                )
                                startActivity(launchIntent)
                            } catch (e: Exception) {
                                android.util.Log.e("MonitoringService", "HolidayOFF: immediate relaunch failed: ${e.message}")
                            }

                            // 4. Jalankan performChecks() segera
                            handler.post { performChecks() }

                            // 5. Staged re-lock: 3x percobaan di 2s, 5s, 10s
                            //    Mengatasi delay GPS refresh, app lifecycle, dan system throttle
                            val stagingDelays = listOf(2000L, 5000L, 10000L)
                            for (delay in stagingDelays) {
                                handler.postDelayed({
                                    if (!prefsManager.isHolidayMode &&
                                        prefsManager.isProtectionActive &&
                                        scheduleManager.isSchoolTime() &&
                                        !permissionManager.isPermissionActive()
                                    ) {
                                        android.util.Log.d("MonitoringService", "HolidayOFF: Staged re-lock at ${delay}ms")
                                        performChecks()
                                        try {
                                            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                                            launchIntent?.addFlags(
                                                Intent.FLAG_ACTIVITY_NEW_TASK or
                                                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                                            )
                                            startActivity(launchIntent)
                                        } catch (_: Exception) { }
                                    }
                                }, delay)
                            }
                        }
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Holiday listener cancelled: ${error.message}")
                markRuntimeHealth("LISTENER_DEGRADED", "holiday:${error.message}")
            }
        }
        holidayModeRef?.addValueEventListener(holidayModeListener!!)
        markListenerRefresh("holiday_listener")
    }

    private fun startProtectionStatusListener() {
        if (protectionStatusListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        protectionStatusRef = database.getReference("schools").child(schoolId).child("config").child("is_active_protection")

        protectionStatusListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                acquireWakeLock()
                // Default ke true (Proteksi Aktif) jika node tidak ditemukan di database
                val isActive = readFlexibleBoolean(snapshot, true)
                if (isActive != prefsManager.isProtectionActive) {
                    val wasActive = prefsManager.isProtectionActive
                    prefsManager.isProtectionActive = isActive
                    persistSchoolLocalDataSnapshot("listener_protection_mode_service")

                    // [Fase 2.2 Langkah7: Trigger Sync + Permission Check otomatis policy berubah]
                    // Admin ubah mode Silent ↔ Aktif → sync state sekolah + cek izin otomatis 30s kemudian.
                    sendCommandToSelf(ACTION_SYNC_NOW, "policy_change_protection")
                    handler.postDelayed({
                        sendCommandToSelf(ACTION_CHECK_PERM, "policy_change_protection_30s")
                    }, 30_000L)

                    if (isActive) {
                        val nowProtect = System.currentTimeMillis()
                        if (!prefsManager.shouldThrottleProtectionToast(nowProtect)) {
                            prefsManager.protectionActivationToastAt = nowProtect
                            showToast("🛡️ PROTEKSI SEKOLAH DIAKTIFKAN! 🛡️")
                        }
                        if (!prefsManager.shouldThrottleProtectionNotif(nowProtect)) {
                            prefsManager.protectionActivationNotifAt = nowProtect
                            updateNotification("EduLock Aktif", "Keamanan sekolah telah diaktifkan")
                        }

                        // Segera pulihkan overlay jika OEM mencabut saat Mode Senyap / sleep
                        if (!hasOverlayPermission() && prefsManager.isSetupCompleted && !prefsManager.isHolidayMode) {
                            requestOverlayPermissionRecovery("protection_on_listener")
                        }

                        val isSchoolTime = scheduleManager.isSchoolTime()
                        val shouldEnforce = isSchoolTime && !prefsManager.isHolidayMode && !permissionManager.isPermissionActive()

                        if (shouldEnforce) {
                            locationMonitor.startListening()
                            cancelProtectionOnRetries()
                            if (shouldShowGpsEnableOverlay()) {
                                showGpsEnableOverlayOnly()
                            } else {
                                val lockedNow = tryEnforceProtectionOnActivation()
                                if (!lockedNow) {
                                    handler.postDelayed(protectionOnRetryRunnable, 2_000L)
                                    handler.postDelayed(protectionOnRetryRunnable, 5_000L)
                                }
                            }
                        }

                        // DEBOUNCE performChecks: hindari bunyi berulang / spam enforcement
                        // ketika callback Firebase sync berjalan bertubi-tubi.
                        fun throttledPerformChecks(delayMs: Long) {
                            handler.postDelayed({
                                val now = System.currentTimeMillis()
                                if (!prefsManager.shouldThrottlePerformChecks(now)) {
                                    prefsManager.lastProtectionPerformChecksAt = now
                                    performChecks()
                                }
                            }, delayMs)
                        }
                        throttledPerformChecks(0L)
                        throttledPerformChecks(2500L)
                    } else {
                        cancelProtectionOnRetries()
                        prefsManager.clearProtectionPendingRecovery()
                        prefsManager.protectionActivationDialogAt = 0L
                        showToast("🔕 Mode Senyap (Silent) Aktif")
                        updateNotification("Mode Senyap", "Monitoring Dinonaktifkan oleh Admin")

                        val hasRecovery = prefsManager.anyRecoveryTargetActive()
                        val dismissTarget = if (hasRecovery) LockEnforcer.DISMISS_TARGET_ENFORCEMENT_ONLY else LockEnforcer.DISMISS_TARGET_ALL

                        // Dismiss lock screen & Stop Kiosk

                        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN").apply {
                            setPackage(packageName)
                            if (hasRecovery) {
                                putExtra(LockEnforcer.EXTRA_DISMISS_TARGET, dismissTarget)
                            }
                        }
                        sendBroadcast(intent)

                        val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK").apply {
                            setPackage(packageName)
                            if (hasRecovery) {
                                putExtra("skip_if_recovery", true)
                            }
                        }
                        sendBroadcast(stopIntent)
                    }

                    if (wasActive && !isActive) {
                        handler.post { performChecks() }
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Protection listener cancelled: ${error.message}")
                markRuntimeHealth("LISTENER_DEGRADED", "protection:${error.message}")
            }
        }
        protectionStatusRef?.addValueEventListener(protectionStatusListener!!)
        markListenerRefresh("protection_listener")
    }

    private fun cancelProtectionOnRetries() {
        handler.removeCallbacks(protectionOnRetryRunnable)
    }

    private fun shouldPauseActivationEnforcement(now: Long = System.currentTimeMillis()): Boolean {
        val currentFgPkg = prefsManager.lastForegroundPackage.orEmpty()
        val isSettingsPackage = currentFgPkg.startsWith("com.android.settings") ||
            currentFgPkg.startsWith("com.samsung.accessibility") ||
            currentFgPkg.contains("settings") ||
            currentFgPkg == "android"
        return prefsManager.shouldPauseEnforcementForRecovery(now, isSettingsPackage)
    }

    /**
     * Saat admin menyalakan proteksi di jam sekolah: kunci hanya jika ada bukti
     * kehadiran di zona sekolah. Jangan paksa isInsideSchoolZone = true (anak di rumah
     * tidak boleh terkunci). Retry ~2s lalu ~5s menunggu fix GPS.
     */
    private fun tryEnforceProtectionOnActivation(): Boolean {
        val now = System.currentTimeMillis()
        if (!prefsManager.isProtectionActive || prefsManager.isHolidayMode || permissionManager.isPermissionActive()) {
            cancelProtectionOnRetries()
            return false
        }
        if (shouldPauseActivationEnforcement(now)) {
            return false
        }
        if (!scheduleManager.isSchoolTime()) {
            android.util.Log.d("MonitoringService", "Protection ON outside school hours; skip lock")
            cancelProtectionOnRetries()
            return false
        }

        locationMonitor.startListening()
        if (shouldShowGpsEnableOverlay()) {
            showGpsEnableOverlayOnly()
            return false
        }
        val loc = locationMonitor.getCurrentLocation()
        locationMonitor.updateSchoolPresenceFromLocation(loc, now)
        val hasPresence = locationMonitor.shouldEnforcePresenceProtection(now)
        val insideSchoolArea = locationMonitor.isInsideSchoolArea()
        val shouldLock = hasPresence || insideSchoolArea

        if (!shouldLock) {
            android.util.Log.d("MonitoringService", "Protection ON but no school presence yet; not locking")
            return false
        }

        enforceLockAfterProtectionOn()
        cancelProtectionOnRetries()
        return true
    }

    private fun enforceLockAfterProtectionOn() {
        val anyRecovery = shouldPauseActivationEnforcement()
        val now = System.currentTimeMillis()
        // [A - Parity V1 1.3.28-54] Cek 4 pilar compliance lengkap
        val accessibilityOk = isAccessibilityServiceEnabled() || permissionManager.isPermissionActive()
        val overlayOk = hasOverlayPermission()
        val gpsOk = !shouldShowGpsEnableOverlay()
        val deviceAdminOk = try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
            val comp = android.content.ComponentName(this, DeviceAdminReceiver::class.java)
            dpm.isAdminActive(comp)
        } catch (_: Exception) { true }
        val fullComplianceNoRecovery = !anyRecovery && accessibilityOk && overlayOk && gpsOk && deviceAdminOk
        if (shouldPauseActivationEnforcement()) {
            lockEnforcer.stopKiosk()
            return
        }
        if (shouldShowGpsEnableOverlay()) {
            showGpsEnableOverlayOnly()
            return
        }

        prefsManager.appSwitchTimestamp = 0L

        // [X] Stop SetupProtectionService (overlay merah PROTEKSI AKTIF) — enforcement != setup awal
        try { stopService(Intent(this, SetupProtectionService::class.java)) } catch (_: Exception) {}

        // ============================================================
        // [B - PARITY NON-HYBRID 1.3.28] DIALOG PRIORITY DULU BARU KIOSK
        // ============================================================
        // Skenario user temukan: Accessibility OFF proteksi ON → hybrid mengunci kiosk DULU,
        // dialog putih muncul KEMUDIAN di atas kiosk (terbalik!).
        // Perbaikan: compliance kurang → HITUNG broken count & jenis:
        //   - 1 broken (hanya Accessibility)  : pendingA11yRecovery=true, relaunch MainActivity DULU
        //   - 2+ broken (Accessibility + Device Admin / Overlay dll): pendingOemRecovery=true,
        //                                                             relaunch MainActivity DULU
        // MainActivity.onResume() akan mendeteksi flag pending ini dan menampilkan dialog yang
        // SESUAI urutan non-hybrid (dialog recovery DULU di halaman EduLock, BUKAN kiosk duluan).
        // HANYA jika compliance FULL → langsung LockScreen kiosk.
        // ============================================================
        val brokenCount = listOf(accessibilityOk, overlayOk, deviceAdminOk).count { !it }
        val onlyA11yBroken = !accessibilityOk && overlayOk && deviceAdminOk

        if (!fullComplianceNoRecovery && !prefsManager.shouldThrottleProtectionDialog(now)) {
            prefsManager.protectionActivationDialogAt = now

            // Reset state dan hentikan kiosk / lockscreen yang setengah aktif agar
            // user melihat dialog recovery DENGAN JELAS di halaman MainActivity.
            hideOverlayLock()
            try {
                lockEnforcer.stopKiosk()
                val dismissIntent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN").apply {
                    setPackage(packageName)
                    putExtra(LockEnforcer.EXTRA_DISMISS_TARGET, LockEnforcer.DISMISS_TARGET_ALL)
                }
                sendBroadcast(dismissIntent)
            } catch (_: Exception) {}

            // Overlay permission broken (tidak related Accessibility/Admin): arahkan ke recovery overlay
            if (!overlayOk) {
                requestOverlayPermissionRecovery("protection_on_priority")
            }

            if (onlyA11yBroken) {
                prefsManager.protectionPendingA11yRecovery = true
                prefsManager.protectionPendingOemRecovery = false
            } else if (brokenCount >= 2) {
                prefsManager.protectionPendingA11yRecovery = false
                prefsManager.protectionPendingOemRecovery = true
            } else {
                prefsManager.clearProtectionPendingRecovery()
            }
        }

        // [A - Parity V1] Full compliance → LANGSUNG LockScreen FULL kiosk (NO overlay window manager)
        if (fullComplianceNoRecovery) {
            hideOverlayLock()
            prefsManager.clearProtectionPendingRecovery()

            try {
                showLockScreen("Proteksi diaktifkan. Perangkat segera terkunci otomatis.")
                lockEnforcer.relaunchEduLock()
                lockEnforcer.requestKiosk()
            } catch (_: Exception) {
            }

            handler.postDelayed({
                if (!shouldPauseActivationEnforcement() && !prefsManager.isUiForeground) {
                    try {
                        lockEnforcer.relaunchEduLock()
                        lockEnforcer.requestKiosk()
                    } catch (_: Exception) {}
                }
            }, 500)
            handler.postDelayed({
                if (!shouldPauseActivationEnforcement() && !prefsManager.isUiForeground) {
                    try {
                        lockEnforcer.relaunchEduLock()
                        lockEnforcer.requestKiosk()
                    } catch (_: Exception) {}
                }
            }, 1500)
            return
        }

        // CASE 2: Compliance kurang (sudah set pending recovery di atas).
        //   - JANGAN panggil showLockScreen / requestKiosk!
        //   - HANYA relaunch MainActivity agar onResume mendeteksi pendingA11y/OEM flag
        //     dan memunculkan dialog recovery SESUAI URUTAN non-hybrid.
        //   - Retry 500ms / 1500ms: cek lagi compliance, jika full → kioskan
        //     jika masih kurang → relaunch MainActivity (jangan dialog spam karena sudah cooldown)
        fun followUp(delayMs: Long) {
            handler.postDelayed({
                if (!prefsManager.isProtectionActive || prefsManager.isHolidayMode) {
                    return@postDelayed
                }
                val nowFollowUp = System.currentTimeMillis()
                val dialogFresh = nowFollowUp - prefsManager.protectionActivationDialogAt <
                    PreferencesManager.PROTECTION_DIALOG_COOLDOWN_MS
                val pendingRecovery = prefsManager.protectionPendingA11yRecovery ||
                    prefsManager.protectionPendingOemRecovery
                val activeRecovery = prefsManager.anyRecoveryTargetActive(nowFollowUp)
                val retryA11y = isAccessibilityServiceEnabled() || permissionManager.isPermissionActive()
                val retryOverlay = hasOverlayPermission()
                val retryDpm = try {
                    val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as android.app.admin.DevicePolicyManager
                    val comp = android.content.ComponentName(this, DeviceAdminReceiver::class.java)
                    dpm.isAdminActive(comp)
                } catch (_: Exception) { true }
                val fullNow = retryA11y && retryOverlay && retryDpm && !shouldPauseActivationEnforcement()
                if (fullNow) {
                    if (!prefsManager.isUiForeground) {
                        try {
                            showLockScreen("Proteksi diaktifkan. Perangkat segera terkunci otomatis.")
                            lockEnforcer.relaunchEduLock()
                            lockEnforcer.requestKiosk()
                        } catch (_: Exception) {}
                    }
                } else if (dialogFresh || pendingRecovery || activeRecovery) {
                    // Dialog recovery sudah/sedang tampil. Jangan relaunch EduLock lagi
                    // karena itu akan menutup lalu membuka ulang dialog dan terlihat flicker.
                    return@postDelayed
                } else if (!prefsManager.isUiForeground) {
                    // Compliance masih kurang → user belum selesai recovery.
                    // Relaunch MainActivity agar onResume re-evaluate dialog pending
                    // (tanpa memaksa kiosk / lockscreen di tengah recovery user).
                    try {
                        lockEnforcer.stopKiosk()
                        lockEnforcer.relaunchEduLock()
                    } catch (_: Exception) {}
                }
            }, delayMs)
        }
        try {
            lockEnforcer.stopKiosk()
            lockEnforcer.relaunchEduLock()
        } catch (_: Exception) {}

        followUp(600)
        followUp(1800)
    }

    private fun shouldShowGpsEnableOverlay(): Boolean {
        return GpsEnableOverlay.isRequired(this)
    }

    private fun showGpsEnableOverlayOnly() {
        hideOverlayLock()
        val atSchool = prefsManager.isInsideSchoolZone ||
            locationMonitor.shouldEnforcePresenceProtection()

        auditCriticalEvent(
            eventKey = "GPS_ENABLE_OVERLAY_SHOWN",
            description = if (atSchool) {
                "Overlay GPS ditampilkan karena GPS wajib aktif saat proteksi sekolah berjalan."
            } else {
                "Overlay GPS ditampilkan untuk memulihkan GPS wajib saat proteksi aktif."
            },
            cooldownMs = 30_000L
        )
        GpsEnableOverlay.show(this, atSchool = atSchool)
    }

    private fun enforceGpsOnWhenEduLockOpen() {
        if (!prefsManager.isUiForeground) return
        if (!scheduleManager.isSchoolTime()) return
        // [BUG FIX OVERLAY RUMAH JAM EFEKTIF]
        // Jangan paksa GPS aktif jika user jelas tidak ada indikasi di sekolah.
        // Walaupun isUiForeground=true (buka EduLock di rumah jam 13.00), tetap bebas GPS off.
        if (!prefsManager.isInsideSchoolZone && !locationMonitor.shouldEnforcePresenceProtection()) return
        if (!shouldShowGpsEnableOverlay()) return
        showGpsEnableOverlayOnly()
    }

    private fun startSchoolServiceStatusListener() {
        if (schoolServiceStatusListener != null) return

        val schoolId = SchoolServiceGuard.normalizeSchoolId(prefsManager.schoolId)
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        schoolServiceStatusRef = database.getReference("schools").child(schoolId)
        schoolServiceStatusListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists()) return
                if (SchoolServiceGuard.isSchoolServiceActive(snapshot)) return
                forceExitBecauseSchoolInactive()
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "School service listener cancelled: ${error.message}")
            }
        }
        schoolServiceStatusRef?.addValueEventListener(schoolServiceStatusListener!!)
    }

    private fun forceExitBecauseSchoolInactive() {
        if (hasTriggeredSchoolServiceExit) return
        if (!prefsManager.claimSchoolServiceExit()) return
        hasTriggeredSchoolServiceExit = true

        val dismissIntent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
        sendBroadcast(dismissIntent)
        stopLockTaskWrapper()

        handler.post {
            Toast.makeText(applicationContext, SchoolServiceGuard.inactiveMessage(), Toast.LENGTH_LONG).show()
        }

        prefsManager.isRegistered = false

        try {
            val intent = Intent(applicationContext, RegistrationActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            intent.putExtra("ERROR_MESSAGE", SchoolServiceGuard.inactiveMessage())
            startActivity(intent)
        } catch (e: Exception) {
            android.util.Log.e("MonitoringService", "Failed to redirect after school deactivation: ${e.message}")
        }

        stopSelf()
    }

    private fun readFlexibleBoolean(snapshot: DataSnapshot, defaultValue: Boolean = false): Boolean {
        if (!snapshot.exists()) return defaultValue
        
        try {
            val b = snapshot.getValue(Boolean::class.java)
            if (b != null) return b
        } catch (_: Exception) {
        }
        try {
            val n = snapshot.getValue(Long::class.java)
            if (n != null) return n != 0L
        } catch (_: Exception) {
        }
        try {
            val s = snapshot.getValue(String::class.java)
            if (s != null) {
                val normalized = s.trim().lowercase()
                if (normalized == "true" || normalized == "1" || normalized == "yes" || normalized == "on") return true
                if (normalized == "false" || normalized == "0" || normalized == "no" || normalized == "off") return false
            }
        } catch (_: Exception) {
        }
        return defaultValue
    }

    private fun buildProtectionTelemetry(isSchoolTime: Boolean): ProtectionTelemetry {
        val checkedAt = System.currentTimeMillis()
        val isAccessibilityEnabled = isAccessibilityServiceEnabled()
        val isDeviceAdminEnabled = devicePolicyManager.isAdminActive(compName)
        val isProtectionActive = prefsManager.isProtectionActive
        val isPermissionActive = permissionManager.isPermissionActive()
        val isPaused = !isProtectionActive || prefsManager.isHolidayMode

        val protectionHealth = when {
            isPaused && prefsManager.isHolidayMode -> "HOLIDAY_MODE"
            isPaused -> "PAUSED"
            !isAccessibilityEnabled && !isDeviceAdminEnabled -> "BOTH_OFF"
            !isAccessibilityEnabled -> "ACCESSIBILITY_OFF"
            !isDeviceAdminEnabled -> "DEVICE_ADMIN_OFF"
            isPermissionActive && isSchoolTime -> "TEMP_PERMISSION_ACTIVE"
            else -> "OK"
        }

        val complianceStatus = when {
            isPaused -> "PAUSED"
            isAccessibilityEnabled && isDeviceAdminEnabled -> "COMPLIANT"
            else -> "NON_COMPLIANT"
        }

        return ProtectionTelemetry(
            isAccessibilityEnabled = isAccessibilityEnabled,
            isDeviceAdminEnabled = isDeviceAdminEnabled,
            isProtectionActive = isProtectionActive,
            isPermissionActive = isPermissionActive,
            complianceStatus = complianceStatus,
            protectionHealth = protectionHealth,
            checkedAt = checkedAt,
            appVersionCode = resolveAppVersionCode()
        )
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        return EduLockOEMHardeningHelper.isAccessibilityServiceEnabled(this)
    }

    private fun resolveAppVersionCode(): Int {
        return try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }
        } catch (_: Exception) {
            0
        }
    }

    private fun startSchoolConfigListener() {
        if (schoolConfigListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        schoolConfigRef = database.getReference("schools").child(schoolId).child("config")

        schoolConfigListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val startTimeStr = snapshot.child("startTime").getValue(String::class.java)
                    val endTimeStr = snapshot.child("endTime").getValue(String::class.java)
                    var locationConfigChanged = false
                    var schoolConfigChanged = false
                    val prevStartHour = prefsManager.schoolStartHour
                    val prevStartMin = prefsManager.schoolStartMinute
                    val prevEndHour = prefsManager.schoolEndHour
                    val prevEndMin = prefsManager.schoolEndMinute

                    if (!startTimeStr.isNullOrEmpty() && !endTimeStr.isNullOrEmpty()) {
                        try {
                            val partsStart = startTimeStr.split(":")
                            val partsEnd = endTimeStr.split(":")
                            val sh = partsStart.getOrNull(0)?.toInt() ?: prefsManager.schoolStartHour
                            val sm = partsStart.getOrNull(1)?.toInt() ?: prefsManager.schoolStartMinute
                            val eh = partsEnd.getOrNull(0)?.toInt() ?: prefsManager.schoolEndHour
                            val em = partsEnd.getOrNull(1)?.toInt() ?: prefsManager.schoolEndMinute
                            if (sh != prevStartHour || sm != prevStartMin || eh != prevEndHour || em != prevEndMin) {
                                schoolConfigChanged = true
                            }
                            prefsManager.schoolStartHour = sh
                            prefsManager.schoolStartMinute = sm
                            prefsManager.schoolEndHour = eh
                            prefsManager.schoolEndMinute = em
                        } catch (_: Exception) {
                        }
                    }

                    val latStr = snapshot.child("latitude").getValue(String::class.java)
                        ?: snapshot.child("latitude").getValue(Double::class.java)?.toString()
                    val lonStr = snapshot.child("longitude").getValue(String::class.java)
                        ?: snapshot.child("longitude").getValue(Double::class.java)?.toString()
                    val radStr = snapshot.child("radius").getValue(String::class.java)
                        ?: snapshot.child("radius").getValue(Double::class.java)?.toString()
                        ?: snapshot.child("radius").getValue(Int::class.java)?.toString()

                    if (latStr != null && lonStr != null) {
                        fun normalizeNumber(input: String): String {
                            return input.trim().replace(",", ".")
                        }

                        val newLat = normalizeNumber(latStr).toDouble()
                        val newLon = normalizeNumber(lonStr).toDouble()
                        val newRad = radStr?.let { normalizeNumber(it).toDouble() } ?: 500.0
                        locationConfigChanged =
                            newLat != prefsManager.schoolLatitude ||
                            newLon != prefsManager.schoolLongitude ||
                            newRad != prefsManager.schoolRadius

                        prefsManager.schoolLatitude = newLat
                        prefsManager.schoolLongitude = newLon
                        prefsManager.schoolRadius = newRad
                        geofenceCoordinator.syncSchoolGeofence()
                    }
                    persistSchoolLocalDataSnapshot("listener_school_config_service")

                    // [Fase 2.2 Langkah7: Trigger SYNC_NOW + CHECK_PERM jika config sekolah berubah (jam atau lokasi)]
                    if (schoolConfigChanged || locationConfigChanged) {
                        sendCommandToSelf(ACTION_SYNC_NOW, "school_config_changed")
                        handler.postDelayed({
                            sendCommandToSelf(ACTION_CHECK_PERM, "school_config_changed_30s")
                        }, 30_000L)
                    }

                    if (locationConfigChanged) {
                        refreshZoneStateAfterSchoolConfigChange()
                    }
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "School config listener cancelled: ${error.message}")
                markRuntimeHealth("LISTENER_DEGRADED", "school_config:${error.message}")
            }
        }
        schoolConfigRef?.addValueEventListener(schoolConfigListener!!)
        markListenerRefresh("school_config_listener")
        syncSchoolConfigFromApi(force = true, requestSource = "listener_bootstrap_school_config")
    }

    private fun refreshZoneStateAfterSchoolConfigChange() {
        prefsManager.isInsideSchoolZone = locationMonitor.isInsideSchoolArea()
        handler.post { performChecks() }
    }

    private fun syncSchoolConfigFromApi(
        force: Boolean = false,
        requestSource: String = "api_request_service"
    ) {
        prefsManager.markRuntimeSyncRequested(requestSource)
        schoolSyncCoordinator.syncFromApi(
            auth = SchoolServiceGuard.auth(this),
            requestSource = requestSource,
            force = force,
            minIntervalMs = 60_000L
        ) { result ->
            if (result.success) {
                prefsManager.markRuntimeSyncSucceeded(requestSource)
            } else if (!result.skipped) {
                prefsManager.markRuntimeSyncFailed(requestSource, result.error)
                val fallbackHealth = if (schoolLocalDataManager.hasReadyPayload()) {
                    "SYNC_DEGRADED"
                } else {
                    "SYNC_FAILED"
                }
                markRuntimeHealth(
                    fallbackHealth,
                    "${requestSource}:${result.error.orEmpty()}",
                    System.currentTimeMillis()
                )
            }
            if (result.locationChanged) {
                geofenceCoordinator.syncSchoolGeofence()
                refreshZoneStateAfterSchoolConfigChange()
                return@syncFromApi
            }
            handler.post { performChecks() }
        }
    }

    private fun startWeekdayScheduleListener() {
        if (weekdayScheduleListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        weekdayScheduleRef = database.getReference("schools").child(schoolId).child("schedule").child("weekdays")

        weekdayScheduleListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val root = JSONObject()
                    val keys = listOf("mon", "tue", "wed", "thu", "fri", "sat", "sun")
                    for (k in keys) {
                        val node = snapshot.child(k)
                        if (!node.exists()) continue
                        val obj = JSONObject()
                        obj.put("enabled", readFlexibleBoolean(node.child("enabled"), k != "sun" && k != "sat"))
                        obj.put("start", node.child("start").getValue(String::class.java) ?: "07:00")
                        obj.put("end", node.child("end").getValue(String::class.java) ?: "14:00")
                        root.put(k, obj)
                    }
                    if (root.length() > 0) {
                        val existing = try { JSONObject(prefsManager.weekdayScheduleJson) } catch (_: Exception) { null }
                        val shouldUpdate = existing == null || existing.length() == 0 || root.length() >= existing.length()
                        if (shouldUpdate) {
                            prefsManager.weekdayScheduleJson = root.toString()
                            persistSchoolLocalDataSnapshot("listener_weekday_schedule_service")
                            handler.post {
                                try {
                                    performChecks()
                                } catch (_: Exception) {
                                }
                            }
                        }
                    }
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Weekday schedule listener cancelled: ${error.message}")
                markRuntimeHealth("LISTENER_DEGRADED", "weekday_schedule:${error.message}")
            }
        }
        weekdayScheduleRef?.addValueEventListener(weekdayScheduleListener!!)
        markListenerRefresh("weekday_schedule_listener")
    }

    private fun startSchoolSettingsScheduleListener() {
        if (schoolSettingsScheduleListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        schoolSettingsScheduleRef = database.getReference("school_settings").child(schoolId).child("attendance").child("schedules")

        schoolSettingsScheduleListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val root = JSONObject()
                    val dayMap = mapOf(
                        1 to "sun",
                        2 to "mon",
                        3 to "tue",
                        4 to "wed",
                        5 to "thu",
                        6 to "fri",
                        7 to "sat"
                    )
                    for ((idx, dayKey) in dayMap) {
                        val node = snapshot.child(idx.toString())
                        if (!node.exists()) continue
                        val isHoliday = readFlexibleBoolean(node.child("isHoliday"), dayKey == "sun" || dayKey == "sat")
                        val start = node.child("startTime").getValue(String::class.java) ?: "06:35"
                        val end = node.child("endTime").getValue(String::class.java) ?: "13:00"
                        val obj = JSONObject().apply {
                            put("enabled", !isHoliday)
                            put("start", start)
                            put("end", end)
                        }
                        root.put(dayKey, obj)
                    }
                    if (root.length() > 0) {
                        prefsManager.weekdayScheduleJson = root.toString()
                        persistSchoolLocalDataSnapshot("listener_school_settings_schedule")
                        handler.post {
                            try {
                                performChecks()
                            } catch (_: Exception) {
                            }
                        }
                    }
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "School settings schedule listener cancelled: ${error.message}")
            }
        }
        schoolSettingsScheduleRef?.addValueEventListener(schoolSettingsScheduleListener!!)
        markListenerRefresh("school_settings_schedule_listener")
    }

    private fun startServerTimeOffsetListener() {
        if (serverTimeOffsetListener != null) return
        val database = SchoolServiceGuard.database(this)
        serverTimeOffsetRef = database.getReference(".info/serverTimeOffset")
        serverTimeOffsetListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val offset = snapshot.getValue(Long::class.java) ?: 0L
                prefsManager.serverTimeOffset = offset
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        serverTimeOffsetRef?.addValueEventListener(serverTimeOffsetListener!!)
        markListenerRefresh("server_time_offset_listener")
    }

    private fun startHolidayListListener() {
        if (holidayListListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        holidayListRef = database.getReference("schools").child(schoolId).child("holidays")

        holidayListListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val root = JSONObject()
                    for (child in snapshot.children) {
                        val dateKey = child.key ?: continue
                        val note = child.child("note").getValue(String::class.java) ?: ""
                        root.put(dateKey, note)
                    }
                    prefsManager.holidayListJson = root.toString()
                    persistSchoolLocalDataSnapshot("listener_holiday_list_service")
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Holiday list listener cancelled: ${error.message}")
            }
        }
        holidayListRef?.addValueEventListener(holidayListListener!!)
    }

    private fun startGpsPolicyListener() {
        if (gpsPolicyListener != null) return

        val schoolId = prefsManager.schoolId.trim().lowercase()
        if (schoolId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        gpsPolicyRef = database.getReference("schools").child(schoolId).child("policy")

        gpsPolicyListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    fun toLongMs(node: DataSnapshot, defaultValue: Long): Long {
                        if (!node.exists()) return defaultValue
                        val n = node.getValue(Long::class.java)
                        if (n != null) return n
                        val i = node.getValue(Int::class.java)
                        if (i != null) return i.toLong()
                        val s = node.getValue(String::class.java)
                        return s?.trim()?.toLongOrNull() ?: defaultValue
                    }
                    fun toLongEither(root: DataSnapshot, snakeKey: String, camelKey: String, defaultValue: Long): Long {
                        val snakeVal = toLongMs(root.child(snakeKey), Long.MIN_VALUE)
                        if (snakeVal != Long.MIN_VALUE) return snakeVal
                        return toLongMs(root.child(camelKey), defaultValue)
                    }

                    val warnMs = toLongEither(
                        snapshot, "gps_off_warn_ms", "gpsOffWarnMs", prefsManager.gpsOffWarnMs
                    ).coerceAtLeast(0L)
                    val lockMs = toLongEither(
                        snapshot, "gps_off_lock_ms", "gpsOffLockMs", prefsManager.gpsOffLockMs
                    ).coerceAtLeast(0L)
                    val petFirstMs = toLongEither(
                        snapshot,
                        "pet_dead_reminder_first_ms",
                        "petDeadReminderFirstMs",
                        prefsManager.petDeadReminderFirstMs
                    ).coerceAtLeast(60_000L)
                    val petSecondMs = toLongEither(
                        snapshot,
                        "pet_dead_reminder_second_ms",
                        "petDeadReminderSecondMs",
                        prefsManager.petDeadReminderSecondMs
                    ).coerceAtLeast(60_000L)
                    val petRepeatMs = toLongEither(
                        snapshot,
                        "pet_dead_reminder_repeat_ms",
                        "petDeadReminderRepeatMs",
                        prefsManager.petDeadReminderRepeatMs
                    ).coerceAtLeast(60_000L)

                    val safeLock = lockMs
                    val safeWarn = if (safeLock > 0 && warnMs > safeLock) safeLock else warnMs

                    prefsManager.gpsOffWarnMs = safeWarn
                    prefsManager.gpsOffLockMs = safeLock
                    prefsManager.petDeadReminderFirstMs = petFirstMs
                    prefsManager.petDeadReminderSecondMs = petSecondMs
                    prefsManager.petDeadReminderRepeatMs = petRepeatMs
                    persistSchoolLocalDataSnapshot("listener_gps_policy_service")
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "GPS policy listener cancelled: ${error.message}")
            }
        }

        gpsPolicyRef?.addValueEventListener(gpsPolicyListener!!)
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

    private fun getDateKeyWib(timestamp: Long): String {
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            sdf.timeZone = java.util.TimeZone.getTimeZone("Asia/Jakarta")
            sdf.format(timestamp)
        } catch (_: Exception) {
            ""
        }
    }

    private fun applyResolvedDailyAttendance(todayKey: String) {
        prefsManager.dailyAttendanceDateKey = todayKey
        prefsManager.dailyAttendanceStatus = flatDailyAttendanceStatusCache.ifBlank {
            legacyDailyAttendanceStatusCache
        }.trim()
    }

    private fun isStrictModeNow(): Boolean {
        if (prefsManager.isHolidayMode) return false
        
        if (scheduleManager.isSchoolTime()) {
            val isAirplaneOn = if (::offlineMonitor.isInitialized) {
                offlineMonitor.isAirplaneModeActive()
            } else {
                try { android.provider.Settings.Global.getInt(contentResolver, android.provider.Settings.Global.AIRPLANE_MODE_ON, 0) != 0 } catch (_: Exception) { false }
            }
            
            if (isAirplaneOn) {
                return true
            }
        }

        if (!prefsManager.isProtectionActive) return false
        if (!scheduleManager.isSchoolTime()) return false
        return true
    }

    private fun startDailyAttendanceListener() {
        if (dailyAttendanceListener != null || flatDailyAttendanceListener != null) return

        val nisn = prefsManager.nisn.trim()
        if (nisn.isEmpty()) return

        val todayKey = getTodayKeyWib()
        if (todayKey.isBlank()) return

        val database = SchoolServiceGuard.database(this)
        val normalizedSchoolId = SchoolServiceGuard.normalizeSchoolId(prefsManager.schoolId)
        legacyDailyAttendanceStatusCache = ""
        flatDailyAttendanceStatusCache = ""

        dailyAttendanceRef = database
            .getReference("students")
            .child(nisn)
            .child("daily_attendance")
            .child(todayKey)

        dailyAttendanceListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                legacyDailyAttendanceStatusCache =
                    snapshot.child("status").getValue(String::class.java)?.trim().orEmpty()
                applyResolvedDailyAttendance(todayKey)
            }

            override fun onCancelled(error: DatabaseError) {
            }
        }
        dailyAttendanceRef?.addValueEventListener(dailyAttendanceListener!!)

        flatDailyAttendanceQuery = database
            .getReference("attendance")
            .orderByChild("studentId")
            .equalTo(nisn)

        flatDailyAttendanceListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                flatDailyAttendanceStatusCache = snapshot.children.mapNotNull { child ->
                    val recordSchoolId = SchoolServiceGuard.normalizeSchoolId(
                        child.child("schoolId").getValue(String::class.java)
                    )
                    if (normalizedSchoolId.isNotBlank() && recordSchoolId != normalizedSchoolId) {
                        return@mapNotNull null
                    }

                    val recordDate = child.child("date").getValue(Long::class.java)
                        ?: child.child("date").getValue(Double::class.java)?.toLong()
                        ?: return@mapNotNull null
                    if (getDateKeyWib(recordDate) != todayKey) {
                        return@mapNotNull null
                    }

                    val recordStatus = child.child("status").getValue(String::class.java)?.trim().orEmpty()
                    if (recordStatus.isBlank()) {
                        return@mapNotNull null
                    }

                    recordDate to recordStatus
                }.maxByOrNull { it.first }?.second.orEmpty()

                applyResolvedDailyAttendance(todayKey)
            }

            override fun onCancelled(error: DatabaseError) {
            }
        }
        flatDailyAttendanceQuery?.addValueEventListener(flatDailyAttendanceListener!!)
    }

    private fun startDeviceBindingListener() {
        if (deviceBindingListener != null) return

        val nisn = prefsManager.nisn
        val localDeviceId = prefsManager.deviceId

        if (nisn.isEmpty() || localDeviceId.isEmpty()) return

        val database = SchoolServiceGuard.database(this)
        deviceBindingRef = database.getReference("students").child(nisn).child("device_uuid")

        deviceBindingListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val remoteDeviceId = snapshot.getValue(String::class.java)
                
                // Jika remote ID ada DAN berbeda dengan local ID -> Konflik!
                if (remoteDeviceId != null && remoteDeviceId != localDeviceId) {
                    android.util.Log.w("MonitoringService", "Device Conflict Detected! Remote: $remoteDeviceId, Local: $localDeviceId")
                    
                    // 1. Cabut Kiosk Mode (jika aktif) agar tidak stuck
                    val intentDismiss = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                    sendBroadcast(intentDismiss)
                    stopLockTaskWrapper()

                    // 2. Tampilkan Pesan Fatal
                    handler.post {
                        Toast.makeText(applicationContext, "AKUN INI TELAH LOGIN DI PERANGKAT LAIN!\nSesi Anda berakhir.", Toast.LENGTH_LONG).show()
                    }

                    // 3. Logout Lokal (Clear Data Penting)
                    prefsManager.isRegistered = false
                    // Kita tidak clearAll() agar data NISN/Nama masih ada untuk kemudahan login ulang jika perlu, 
                    // tapi isRegistered=false akan memaksa masuk RegistrationActivity.

                    // 4. Redirect ke Halaman Registrasi (Logout)
                    try {
                        val intent = Intent(applicationContext, RegistrationActivity::class.java)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                        intent.putExtra("ERROR_MESSAGE", "Akun Anda telah digunakan di perangkat lain. Silakan login kembali jika ini kesalahan.")
                        startActivity(intent)
                    } catch (e: Exception) {
                        android.util.Log.e("MonitoringService", "Failed to redirect to registration: ${e.message}")
                    }

                    // 5. Matikan Service ini
                    stopSelf()
                }
            }

            override fun onCancelled(error: DatabaseError) {
                 android.util.Log.e("MonitoringService", "Device binding listener cancelled: ${error.message}")
            }
        }
        deviceBindingRef?.addValueEventListener(deviceBindingListener!!)
    }
    
    // Helper untuk stop lock task dari service (perlu activity context sebenarnya, tapi kita coba broadcast ke MainActivity)
    private fun stopLockTaskWrapper() {
        // Kita tidak bisa panggil stopLockTask dari Service.
        // Kirim broadcast ke MainActivity untuk melakukannya.
        val intent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
        intent.setPackage(packageName)
        sendBroadcast(intent)
    }

    private fun updateNotification(title: String, content: String, isSilent: Boolean = false) {
        val channelId = if (isSilent) "MonitoringChannelSilent" else "MonitoringChannel"
        // Buat channel secara dinamis jika belum ada (terutama untuk switch mode)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            if (isSilent) {
                val channel = NotificationChannel(
                    channelId,
                    "EduLock Silent Monitoring",
                    NotificationManager.IMPORTANCE_LOW
                )
                manager.createNotificationChannel(channel)
            } else {
                val channel = NotificationChannel(
                    channelId,
                    "EduLock Monitoring",
                    NotificationManager.IMPORTANCE_HIGH
                )
                manager.createNotificationChannel(channel)
            }
        }

        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.mipmap.ic_launcher)

        if (isSilent) {
            // Mode Senyap: Priority Low, Tanpa Full Screen Intent
            builder.setPriority(NotificationCompat.PRIORITY_LOW)
            builder.setCategory(NotificationCompat.CATEGORY_SERVICE)
        } else {
            // Mode Aktif: Priority High, Full Screen Intent (Aggressive)
            builder.setPriority(NotificationCompat.PRIORITY_HIGH)
            builder.setCategory(NotificationCompat.CATEGORY_ALARM)
            
            val fullScreenIntent = Intent(this, MainActivity::class.java)
            fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            val fullScreenPendingIntent = android.app.PendingIntent.getActivity(
                this,
                0,
                fullScreenIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            builder.setFullScreenIntent(fullScreenPendingIntent, true)
        }
            
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(1, builder.build())
    }

    private fun isAppOnForeground(context: Context): Boolean {
        return try {
            val prefs = PreferencesManager(context)
            if (prefs.isUiForeground) return true
            val now = System.currentTimeMillis()
            now - prefs.uiForegroundAt < 2500L
        } catch (_: Exception) {
            false
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        val now = System.currentTimeMillis()
        markRuntimeTrigger("service_task_removed", "onTaskRemoved", now)
        markRuntimeHealth("TASK_REMOVED", "service_task_removed", now)

        try {
            val isSilent = !prefsManager.isProtectionActive
            val isHoliday = prefsManager.isHolidayMode
            val isUninstall = prefsManager.isUninstallBypassActive()
            val isDeviceAdminRequest = System.currentTimeMillis() < prefsManager.deviceAdminRequestUntil
            val isPermission = permissionManager.isPermissionActive()
            val isSchoolTime = scheduleManager.isSchoolTime()
            val shouldEnforce = !isSilent && !isHoliday && !isUninstall && !isPermission && !isDeviceAdminRequest && isSchoolTime

            if (shouldEnforce) {
                val intent = Intent(this, MainActivity::class.java)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                startActivity(intent)
            }
        } catch (_: Exception) {
        }

        try {
            val broadcastIntent = Intent(this, ServiceRestarter::class.java)
            sendBroadcast(broadcastIntent)
        } catch (_: Exception) {
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        val now = System.currentTimeMillis()
        prefsManager.runtimeLastServiceDestroyedAt = now
        markRuntimeTrigger("service_destroy", "onDestroy", now)
        markRuntimeHealth("SERVICE_DESTROYED", "onDestroy", now)

        try {
            locationMonitor.stopListening()
        } catch (_: Exception) {
        }
        
        // Unregister Screen Receiver
        try {
            unregisterReceiver(screenReceiver)
        } catch (e: Exception) {
            // Ignore if not registered
        }

        hideOverlayLock()
        DeviceLocatorAlarm.stop()

        // Remove listener
        if (uninstallDbRef != null && uninstallListener != null) {
            uninstallDbRef?.removeEventListener(uninstallListener!!)
        }
        if (holidayModeRef != null && holidayModeListener != null) {
            holidayModeRef?.removeEventListener(holidayModeListener!!)
        }
        if (protectionStatusRef != null && protectionStatusListener != null) {
            protectionStatusRef?.removeEventListener(protectionStatusListener!!)
        }
        if (schoolConfigRef != null && schoolConfigListener != null) {
            schoolConfigRef?.removeEventListener(schoolConfigListener!!)
        }
        if (weekdayScheduleRef != null && weekdayScheduleListener != null) {
            weekdayScheduleRef?.removeEventListener(weekdayScheduleListener!!)
        }
        if (schoolSettingsScheduleRef != null && schoolSettingsScheduleListener != null) {
            schoolSettingsScheduleRef?.removeEventListener(schoolSettingsScheduleListener!!)
        }
        if (serverTimeOffsetRef != null && serverTimeOffsetListener != null) {
            serverTimeOffsetRef?.removeEventListener(serverTimeOffsetListener!!)
        }
        if (holidayListRef != null && holidayListListener != null) {
            holidayListRef?.removeEventListener(holidayListListener!!)
        }
        if (gpsPolicyRef != null && gpsPolicyListener != null) {
            gpsPolicyRef?.removeEventListener(gpsPolicyListener!!)
        }
        if (dailyAttendanceRef != null && dailyAttendanceListener != null) {
            dailyAttendanceRef?.removeEventListener(dailyAttendanceListener!!)
        }
        if (flatDailyAttendanceQuery != null && flatDailyAttendanceListener != null) {
            flatDailyAttendanceQuery?.removeEventListener(flatDailyAttendanceListener!!)
        }
        if (schoolServiceStatusRef != null && schoolServiceStatusListener != null) {
            schoolServiceStatusRef?.removeEventListener(schoolServiceStatusListener!!)
        }
        if (deviceBindingRef != null && deviceBindingListener != null) {
            deviceBindingRef?.removeEventListener(deviceBindingListener!!)
        }
        if (versionCheckService != null && forceUpdateListener != null) {
            versionCheckService?.stopListening(forceUpdateListener)
            forceUpdateListener = null
        }

        cancelProtectionOnRetries()
        handler.removeCallbacksAndMessages(null)
        // Restart service jika dimatikan
        val broadcastIntent = Intent(this, ServiceRestarter::class.java)
        sendBroadcast(broadcastIntent)
        WatchdogAlarmReceiver.schedule(this, 1_000L)
    }

    private fun startPetStatusListener() {
        if (petStatusListener != null) return

        val nisn = prefsManager.nisn
        val localStudentId = prefsManager.studentId.toString()
        val remoteStudentKey = prefsManager.studentRemoteKey
        val remoteUsername = prefsManager.studentUsername
        val derivedUsername = prefsManager.studentName.trim()
            .lowercase()
            .replace("\\s+".toRegex(), "_")
            .replace(Regex("[^a-z0-9_]"), "")
        val schoolId = prefsManager.schoolId.trim().lowercase()

        val database = SchoolServiceGuard.database(this)
        val aliases = linkedSetOf(
            remoteStudentKey,
            nisn,
            remoteUsername,
            derivedUsername,
            localStudentId
        ).map { it.trim() }
            .filter { it.isNotBlank() && it != "-1" }
            .toSet()
        if (aliases.isEmpty()) return

        val ref = database.getReference("virtual_pets")
        petStatusQuery = if (schoolId.isNotBlank()) {
            ref.orderByChild("schoolId").equalTo(schoolId)
        } else {
            ref.orderByChild("studentId").equalTo(aliases.first())
        }

        petStatusListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists()) return

                var chosen: DataSnapshot? = null
                var chosenScore = Long.MIN_VALUE

                for (child in snapshot.children) {
                    val petStudentId = child.child("studentId").getValue(String::class.java).orEmpty().trim()
                    val petNisn = child.child("nisn").getValue(String::class.java).orEmpty().trim()
                    val petUsername = child.child("username").getValue(String::class.java).orEmpty().trim()
                    val petKey = child.key.orEmpty().trim()
                    val matches = aliases.contains(petStudentId) ||
                        aliases.contains(petNisn) ||
                        aliases.contains(petUsername) ||
                        aliases.contains(petKey)
                    if (!matches && schoolId.isNotBlank()) continue

                    val updatedAt = child.child("updatedAt").getValue(Long::class.java) ?: 0L
                    val lastQuestReset = child.child("lastQuestReset").getValue(Long::class.java) ?: 0L
                    val lastPlayed = child.child("lastPlayed").getValue(Long::class.java) ?: 0L
                    val lastFed = child.child("lastFed").getValue(Long::class.java) ?: 0L
                    val score = maxOf(updatedAt, lastQuestReset, lastPlayed, lastFed)
                    if (chosen == null || score > chosenScore) {
                        chosen = child
                        chosenScore = score
                    }
                }

                val record = chosen ?: return
                val health = record.child("health").getValue(Int::class.java) ?: 100
                val happiness = record.child("happiness").getValue(Int::class.java) ?: 100
                val energy = record.child("energy").getValue(Int::class.java) ?: 100
                val hunger = record.child("hunger").getValue(Int::class.java) ?: 0
                val manualReviveUntil = record.child("manualReviveUntil").getValue(Long::class.java) ?: 0L
                val isGraceActive = manualReviveUntil > System.currentTimeMillis()

                val fullness = (100 - hunger).coerceIn(0, 100)
                val lowestVital = minOf(health, happiness, energy, fullness)
                // PARITY GAS (VirtualPet.isDeadByRule):
                // Pet hanya mati jika status resmi tercatat "DEAD" (hasil evaluasi harian/admin)
                // DAN vitals belum pulih (health <= 0 || lowestVital <= 0).
                // Status basi "DEAD" saat vitals sudah pulih tidak memicu overlay, dan vitals 0 di pagi hari
                // saat status belum DEAD tidak memvonis mati siswa.
                val statusStr = record.child("status").getValue(String::class.java).orEmpty().trim().uppercase()
                val isDead = !isGraceActive && statusStr == "DEAD" && (health <= 0 || lowestVital <= 0)
                val wasDead = prefsManager.isPetDead
                if (isDead != wasDead) {
                    prefsManager.isPetDead = isDead
                    if (isDead) {
                        // Mulai siklus hukuman: tunggu interval pertama sebelum overlay pertama
                        prefsManager.lastPetDeadAckAt = System.currentTimeMillis()
                        prefsManager.petDeadReminderCount = 0
                    } else {
                        prefsManager.lastPetDeadAckAt = 0L
                        prefsManager.petDeadReminderCount = 0
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
            }
        }
        petStatusQuery?.addValueEventListener(petStatusListener!!)
    }

    private fun startForceUpdateListener() {
        if (forceUpdateListener != null) return
        if (versionCheckService == null) {
            versionCheckService = VersionCheckService(this)
        }
        forceUpdateListener = versionCheckService?.startListening(BuildConfig.VERSION_CODE) { policy ->
            prefsManager.isForceUpdateRequired = policy.updateRequired
            prefsManager.forceUpdateMessage = policy.message.orEmpty()
            policy.downloadUrl?.let { prefsManager.forceUpdateDownloadUrl = it }

            if (policy.updateRequired) {
                lockEnforcer.stopKiosk()
                try {
                    val intent = Intent(this, ForceUpdateActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        putExtra(ForceUpdateActivity.EXTRA_MESSAGE, policy.message)
                        putExtra(ForceUpdateActivity.EXTRA_DOWNLOAD_URL, policy.downloadUrl)
                    }
                    startActivity(intent)
                } catch (_: Exception) {
                }
            }
        }
    }
}

