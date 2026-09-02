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
        const val EXTRA_REQUESTED_PROTECTION = "requested_protection"
        const val EXTRA_COMMAND_ID = "command_id"
        const val EXTRA_FIND_DEVICE_DURATION_MS = "find_device_duration_ms"
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
    private lateinit var lockStateManager: LockStateManager
    private lateinit var lockEnforcer: LockEnforcer
    private lateinit var lockMetricsLogger: LockMetricsLogger
    private lateinit var geofenceCoordinator: GeofenceCoordinator
    private val studentRemoteConfigService = StudentRemoteConfigService()
    private var lastAccessibilityPromptTime: Long = 0L
    private var lastAccessibilityLockTime: Long = 0L
    private var lastAdminPromptTime: Long = 0L
    private var lastOverlayRecoverAt: Long = 0L
    private var lastGpsMustEnableOverlayAt: Long = 0L
    private var lastPermissionReleaseAt: Long = 0L
    private var lastRemoteConfigSyncAt: Long = 0L
    
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
            firebaseConnectedListener = object : com.google.firebase.database.ValueEventListener {
                override fun onDataChange(snapshot: com.google.firebase.database.DataSnapshot) {
                    val connected = snapshot.getValue(Boolean::class.java) ?: false
                    if (::offlineMonitor.isInitialized) {
                        offlineMonitor.isFirebaseConnected = connected
                        if (connected) {
                            offlineMonitor.lastFirebaseConnectedAt = System.currentTimeMillis()
                        }
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

    private fun forceSyncProtectionStatus() {
        try {
            val schoolId = prefsManager.schoolId.trim().lowercase()
            if (schoolId.isEmpty()) return
            val database = SchoolServiceGuard.database(this)
            val ref = database.getReference("schools").child(schoolId).child("config").child("is_active_protection")
            ref.get().addOnSuccessListener { snap ->
                val isActive = readFlexibleBoolean(snap, true)
                if (isActive != prefsManager.isProtectionActive) {
                    android.util.Log.d("MonitoringService", "[forceSync] Protection status drift detected: local=${prefsManager.isProtectionActive}, remote=$isActive. Reapplying listener logic.")
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
        lockStateManager = LockStateManager.getInstance(this)
        lockEnforcer = LockEnforcer(this)
        lockMetricsLogger = LockMetricsLogger()
        geofenceCoordinator = GeofenceCoordinator(this)

        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        compName = ComponentName(this, DeviceAdminReceiver::class.java)
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        
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
        startHolidayListListener()
        startGpsPolicyListener()
        startDailyAttendanceListener()
        startDeviceBindingListener()
        startSchoolServiceStatusListener()
        startPetStatusListener()
        startForceUpdateListener()
        geofenceCoordinator.syncSchoolGeofence()
        KeepAliveWorker.schedule(this)
        FcmTokenRegistrar.refreshAndUpload(this)
        locationMonitor.startListening()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        locationMonitor.startListening()
        val action = intent?.action
        if (action == ACTION_UI_FOREGROUND) {
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
        startHolidayListListener()
        startGpsPolicyListener()
        startDailyAttendanceListener()
        startDeviceBindingListener()
        startSchoolServiceStatusListener()
        startPetStatusListener()
        startForceUpdateListener()
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

        val forceWake = action == ACTION_FCM_WAKE ||
            action == ACTION_FORCE_ENFORCE ||
            action == ACTION_KEEPALIVE
        if (forceWake) {
            acquireWakeLock()
            handler.post {
                try {
                    forceSyncProtectionStatus()
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
        syncSchoolConfigFromApi()

        // Safety net: jika force update aktif, pastikan kiosk dimatikan
        if (prefsManager.isForceUpdateRequired) {
            lockEnforcer.stopKiosk()
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
        // ==========================================
        // 1. CEK MODE DARURAT (EMERGENCY UNLOCK)
        // ==========================================
        if (prefsManager.isEmergencyUnlocked) {
            if (isInternet) {
                // Internet kembali -> Reset mode darurat & Lanjut monitoring
                prefsManager.isEmergencyUnlocked = false
                prefsManager.isForcedLocation = false 
                showToast("Internet Kembali. Mode Darurat Dinonaktifkan.")
                updateNotification("EduLock Aktif", "Koneksi pulih. Monitoring dilanjutkan.")
            } else {
                // Masih offline -> Hitung sisa waktu darurat (Max 10 menit)
                val emergencyDuration = System.currentTimeMillis() - prefsManager.emergencyUnlockTimestamp
                val maxEmergencyMs = 10 * 60 * 1000L // 10 menit

                if (emergencyDuration >= maxEmergencyMs) {
                    // Waktu habis -> Kunci ulang
                    prefsManager.isEmergencyUnlocked = false
                    triggerLockdown(
                        "WAKTU DARURAT HABIS!\nSisa 10 menit telah berlalu. Silakan hubungi guru/admin.",
                        bypassRecoveryTargets = true
                    )
                    return
                } else {
                    // Update notifikasi dengan sisa waktu
                    val remainingMs = maxEmergencyMs - emergencyDuration
                    val remainingMins = remainingMs / 60000
                    val remainingSecs = (remainingMs / 1000) % 60
                    val timeString = String.format("%02d:%02d", remainingMins, remainingSecs)
                    
                    updateNotification("Mode Darurat", "Sisa waktu: $timeString menit")
                    return
                }
            }
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
            val isInsideNow = locationMonitor.isInsideSchoolArea()

            // Persist near-school evidence (or clear it when a fresh fix proves outside).
            // Sticky isInsideSchoolZone remains separate for full in-school lockdown / keluar-area.
            locationMonitor.updateSchoolPresenceFromLocation(currentLocation, now)

            // CEK KHUSUS EMULATOR / FAKE LOCATION
            // Jika LocationMonitor sudah mengembalikan fake location (isForcedLocation), maka isInsideNow = true.
            
            if (isInsideNow) {
                prefsManager.isInsideSchoolZone = true
                
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
                 sendBroadcast(intent)
             }
             return
        } else {
            // JIKA PROTEKSI AKTIF:
            // Cek Reward Harian
            trustScoreManager.checkAndApplyDailyReward()
        }

        // CEK WAJIB: Device Admin aktif saat proteksi ON
        // Jika OFF tanpa izin uninstall, segera arahkan ke halaman aktivasi Device Admin OS (Opsi A)
        try {
            if (!devicePolicyManager.isAdminActive(compName) &&
                !prefsManager.isUninstallBypassActive(now) &&
                prefsManager.isSetupCompleted &&
                !isSettingsGrace
            ) {
                if (now - lastAdminPromptTime > 15_000) {
                    lastAdminPromptTime = now
                    prefsManager.deviceAdminRequestUntil = now + 60_000L
                    val relaunchIntent = Intent(this, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    }
                    startActivity(relaunchIntent)
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
                if (isSchoolTime && prefsManager.isInsideSchoolZone && !prefsManager.isHolidayMode) {
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
        // 5.5 CEK KEMATIAN PET (HUKUMAN KEDISIPLINAN)
        // Interval: first → second → repeat (angka terakhir berulang).
        // Overlay pertama TIDAK langsung; tunggu interval pertama sejak pet mati / ack.
        // ==========================================
        if (!isSchoolTime && prefsManager.isPetDead) {
            if (PetDeadLockActivity.isShowing) {
                return
            }
            var lastAck = prefsManager.lastPetDeadAckAt
            if (lastAck <= 0L) {
                // State lama / crash: mulai hitung dari sekarang agar interval pertama tetap dihormati
                prefsManager.lastPetDeadAckAt = now
                prefsManager.petDeadReminderCount = 0
                lastAck = now
            }
            val reminderIntervalMs = resolvePetDeadReminderIntervalMs()
            if (now - lastAck >= reminderIntervalMs) {
                hideOverlayLock() // bersihkan lock lain
                lockEnforcer.showPetDeadLock()
                return
            }
        }

        // ==========================================
        // 6. CEK JADWAL & STOP JIKA BUKAN WAKTU SEKOLAH / HARI TIDAK EFEKTIF
        // ==========================================
        if (!isSchoolTime) {
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
        
        if (!isSettingsGrace && !isPermissionActive) {
            // Grace period diperkecil agar enforcement lebih responsif di lapangan.
            val lastSwitchTime = prefsManager.appSwitchTimestamp
            if (now - lastSwitchTime < LockPolicy.PACKAGE_SWITCH_GRACE_MS) {
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
        // 7.3 Instant Airplane Mode Check
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
            // GPS null: still track offline below (student may kill both).
        } else if (checkLeaveArea && !locationMonitor.isInsideSchoolArea()) {
            if (gracePeriodManager.isGracePeriodActive()) {
                showToast("Peringatan: Anda di luar area! Sisa waktu toleransi: ${gracePeriodManager.getRemainingTime() / 1000} detik")
            } else {
                triggerLockdown("KELUAR AREA SEKOLAH!\nKembali ke zona aman.")
            }
        }

        offlineMonitor.checkInternetAndTrack(
            onWarningTriggered = { remainingMs ->
                showToast("PERINGATAN! Internet mati. Lockdown dalam ${remainingMs / 1000} detik.")
            },
            onLockdownTriggered = {
                triggerLockdown(
                    "KONEKSI HILANG!\nAnda offline lebih dari 2 menit di jam sekolah.",
                    bypassRecoveryTargets = true
                )
            }
        )
    }

    // Implementasi Helper Method isAppOnForeground
    // Removed duplicate implementation since it was already defined below
    
    private fun triggerLockdown(
        message: String,
        bypassRecoveryTargets: Boolean = false
    ) {
        if (!bypassRecoveryTargets && prefsManager.anyRecoveryTargetActive()) {
            return
        }
        if (GpsEnableOverlay.isRequired(this)) {
            GpsEnableOverlay.show(this, atSchool = true)
            return
        }
        trustScoreManager.applyGraduatedPenalty()
        
        val intent = Intent(this, LockScreenActivity::class.java)
        intent.putExtra("MESSAGE", message)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }

    private fun showLockScreen(message: String) {
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
        try {
            if (overlayLockView != null) return
            if (!hasOverlayPermission()) {
                requestOverlayPermissionRecovery("showOverlayLock")
                return
            }

            val root = FrameLayout(this)
            root.setBackgroundColor(Color.parseColor("#CC000000"))
            root.setOnTouchListener { _, _ -> true }

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
                    val intent = Intent(this, LockScreenActivity::class.java)
                    intent.putExtra("MESSAGE", message)
                    intent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_CLEAR_TOP or
                            Intent.FLAG_ACTIVITY_SINGLE_TOP
                    )
                    startActivity(intent)
                } catch (_: Exception) {
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
            }
        }
        uninstallDbRef?.addValueEventListener(uninstallListener!!)
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
            }
        }
        holidayModeRef?.addValueEventListener(holidayModeListener!!)
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
                    
                    if (isActive) {
                        showToast("🛡️ PROTEKSI SEKOLAH DIAKTIFKAN! 🛡️")
                        updateNotification("EduLock Aktif", "Keamanan sekolah telah diaktifkan")

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

                        handler.post { performChecks() }
                        handler.postDelayed({ performChecks() }, 2000)
                    } else {
                        cancelProtectionOnRetries()
                        showToast("🔕 Mode Senyap (Silent) Aktif")
                        updateNotification("Mode Senyap", "Monitoring Dinonaktifkan oleh Admin")
                        
                        // Dismiss lock screen & Stop Kiosk
                        val intent = Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
                        sendBroadcast(intent)
                        
                        val stopIntent = Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
                        stopIntent.setPackage(packageName)
                        sendBroadcast(stopIntent)
                    }

                    if (wasActive && !isActive) {
                        handler.post { performChecks() }
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Protection listener cancelled: ${error.message}")
            }
        }
        protectionStatusRef?.addValueEventListener(protectionStatusListener!!)
    }

    private fun cancelProtectionOnRetries() {
        handler.removeCallbacks(protectionOnRetryRunnable)
    }

    /**
     * Saat admin menyalakan proteksi di jam sekolah: kunci hanya jika ada bukti
     * kehadiran di zona sekolah. Jangan paksa isInsideSchoolZone = true (anak di rumah
     * tidak boleh terkunci). Retry ~2s lalu ~5s menunggu fix GPS.
     */
    private fun tryEnforceProtectionOnActivation(): Boolean {
        if (!prefsManager.isProtectionActive || prefsManager.isHolidayMode || permissionManager.isPermissionActive()) {
            cancelProtectionOnRetries()
            return false
        }
        if (prefsManager.anyRecoveryTargetActive()) {
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
        val now = System.currentTimeMillis()
        val loc = locationMonitor.getCurrentLocation()
        locationMonitor.updateSchoolPresenceFromLocation(loc, now)
        val shouldLock = locationMonitor.shouldEnforcePresenceProtection(now) ||
            locationMonitor.isInsideSchoolArea()

        if (!shouldLock) {
            android.util.Log.d("MonitoringService", "Protection ON but no school presence yet; not locking")
            return false
        }

        enforceLockAfterProtectionOn()
        cancelProtectionOnRetries()
        return true
    }

    private fun enforceLockAfterProtectionOn() {
        if (prefsManager.anyRecoveryTargetActive()) {
            lockEnforcer.stopKiosk()
            return
        }
        if (shouldShowGpsEnableOverlay()) {
            showGpsEnableOverlayOnly()
            return
        }

        prefsManager.appSwitchTimestamp = 0L

        if (!hasOverlayPermission()) {
            requestOverlayPermissionRecovery("protection_on")
        } else {
            showOverlayLock("PERANGKAT TERKUNCI!\nProteksi Sekolah Diaktifkan.")
        }

        try {
            showLockScreen("Proteksi diaktifkan kembali. EduLock mengunci perangkat.")
            lockEnforcer.relaunchEduLock()
            lockEnforcer.requestKiosk()
        } catch (_: Exception) {
        }

        handler.postDelayed({
            if (!prefsManager.anyRecoveryTargetActive()) {
                try {
                    lockEnforcer.relaunchEduLock()
                    lockEnforcer.requestKiosk()
                } catch (_: Exception) {}
            }
        }, 500)
        handler.postDelayed({
            if (!prefsManager.anyRecoveryTargetActive()) {
                try {
                    lockEnforcer.relaunchEduLock()
                    lockEnforcer.requestKiosk()
                } catch (_: Exception) {}
            }
        }, 1500)
    }

    private fun shouldShowGpsEnableOverlay(): Boolean {
        return GpsEnableOverlay.isRequired(this)
    }

    private fun showGpsEnableOverlayOnly() {
        hideOverlayLock()
        GpsEnableOverlay.show(this, atSchool = prefsManager.isInsideSchoolZone ||
            locationMonitor.shouldEnforcePresenceProtection())
    }

    private fun enforceGpsOnWhenEduLockOpen() {
        if (!prefsManager.isUiForeground) return
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
        return try {
            val am = getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            val enabledServices = am.getEnabledAccessibilityServiceList(android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            enabledServices.any {
                it.resolveInfo.serviceInfo.packageName == packageName &&
                    it.resolveInfo.serviceInfo.name.endsWith(AntiUninstallService::class.java.simpleName)
            }
        } catch (_: Exception) {
            false
        }
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

                    if (!startTimeStr.isNullOrEmpty() && !endTimeStr.isNullOrEmpty()) {
                        try {
                            val partsStart = startTimeStr.split(":")
                            val partsEnd = endTimeStr.split(":")
                            val sh = partsStart.getOrNull(0)?.toInt() ?: prefsManager.schoolStartHour
                            val sm = partsStart.getOrNull(1)?.toInt() ?: prefsManager.schoolStartMinute
                            val eh = partsEnd.getOrNull(0)?.toInt() ?: prefsManager.schoolEndHour
                            val em = partsEnd.getOrNull(1)?.toInt() ?: prefsManager.schoolEndMinute
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

                    if (locationConfigChanged) {
                        refreshZoneStateAfterSchoolConfigChange()
                    }
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "School config listener cancelled: ${error.message}")
            }
        }
        schoolConfigRef?.addValueEventListener(schoolConfigListener!!)
        syncSchoolConfigFromApi(force = true)
    }

    private fun refreshZoneStateAfterSchoolConfigChange() {
        prefsManager.isInsideSchoolZone = locationMonitor.isInsideSchoolArea()
        handler.post { performChecks() }
    }

    private fun syncSchoolConfigFromApi(force: Boolean = false) {
        val now = System.currentTimeMillis()
        if (!force && now - lastRemoteConfigSyncAt < 60_000L) {
            return
        }
        lastRemoteConfigSyncAt = now

        studentRemoteConfigService.fetchConfig(SchoolServiceGuard.auth(this)) { config, _ ->
            if (config == null) {
                return@fetchConfig
            }

            config.attendanceToday?.let { attendance ->
                if (attendance.dateKey.isNotBlank()) {
                    prefsManager.dailyAttendanceDateKey = attendance.dateKey
                }
                prefsManager.dailyAttendanceStatus = attendance.status.trim()
            }

            val locationChanged =
                config.latitude != prefsManager.schoolLatitude ||
                config.longitude != prefsManager.schoolLongitude ||
                config.radius != prefsManager.schoolRadius
            if (!locationChanged) {
                handler.post { performChecks() }
                return@fetchConfig
            }

            prefsManager.schoolLatitude = config.latitude
            prefsManager.schoolLongitude = config.longitude
            prefsManager.schoolRadius = config.radius
            geofenceCoordinator.syncSchoolGeofence()
            refreshZoneStateAfterSchoolConfigChange()
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
                        obj.put("enabled", readFlexibleBoolean(node.child("enabled"), k != "sun"))
                        obj.put("start", node.child("start").getValue(String::class.java) ?: "07:00")
                        obj.put("end", node.child("end").getValue(String::class.java) ?: "14:00")
                        root.put(k, obj)
                    }
                    prefsManager.weekdayScheduleJson = root.toString()
                    // Jadwal berubah dari admin → enforce ulang tanpa tunggu buka UI
                    handler.post {
                        try {
                            performChecks()
                        } catch (_: Exception) {
                        }
                    }
                } catch (_: Exception) {
                }
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("MonitoringService", "Weekday schedule listener cancelled: ${error.message}")
            }
        }
        weekdayScheduleRef?.addValueEventListener(weekdayScheduleListener!!)
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

                    val warnMs = toLongMs(snapshot.child("gps_off_warn_ms"), prefsManager.gpsOffWarnMs).coerceAtLeast(0L)
                    val lockMs = toLongMs(snapshot.child("gps_off_lock_ms"), prefsManager.gpsOffLockMs).coerceAtLeast(0L)
                    val petFirstMs = toLongMs(
                        snapshot.child("pet_dead_reminder_first_ms"),
                        prefsManager.petDeadReminderFirstMs
                    ).coerceAtLeast(60_000L)
                    val petSecondMs = toLongMs(
                        snapshot.child("pet_dead_reminder_second_ms"),
                        prefsManager.petDeadReminderSecondMs
                    ).coerceAtLeast(60_000L)
                    val petRepeatMs = toLongMs(
                        snapshot.child("pet_dead_reminder_repeat_ms"),
                        prefsManager.petDeadReminderRepeatMs
                    ).coerceAtLeast(60_000L)

                    val safeLock = lockMs
                    val safeWarn = if (safeLock > 0 && warnMs > safeLock) safeLock else warnMs

                    prefsManager.gpsOffWarnMs = safeWarn
                    prefsManager.gpsOffLockMs = safeLock
                    prefsManager.petDeadReminderFirstMs = petFirstMs
                    prefsManager.petDeadReminderSecondMs = petSecondMs
                    prefsManager.petDeadReminderRepeatMs = petRepeatMs
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
        
        // Aturan ketat: Jika di jam sekolah, offline / mode pesawat memaksa strict mode AKTIF
        // (Siswa tidak boleh bypass pantauan dengan cara mematikan internet, meskipun admin sedang mematikan proteksi)
        if (scheduleManager.isSchoolTime()) {
            val isAirplaneOn = if (::offlineMonitor.isInitialized) {
                offlineMonitor.isAirplaneModeActive()
            } else {
                try { android.provider.Settings.Global.getInt(contentResolver, android.provider.Settings.Global.AIRPLANE_MODE_ON, 0) != 0 } catch (_: Exception) { false }
            }
            val isOfflineTooLong = if (::offlineMonitor.isInitialized) offlineMonitor.getOfflineDuration() > 2 * 60 * 1000L else false
            
            if (isAirplaneOn || isOfflineTooLong) {
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
                val status = record.child("status").getValue(String::class.java) ?: "HAPPY"
                val health = record.child("health").getValue(Int::class.java) ?: 100
                val happiness = record.child("happiness").getValue(Int::class.java) ?: 100
                val energy = record.child("energy").getValue(Int::class.java) ?: 100
                val hunger = record.child("hunger").getValue(Int::class.java) ?: 0
                val manualReviveUntil = record.child("manualReviveUntil").getValue(Long::class.java) ?: 0L

                val fullness = (100 - hunger).coerceIn(0, 100)
                val lowestVital = minOf(health, happiness, energy, fullness)
                val isGraceActive = manualReviveUntil > System.currentTimeMillis()
                val isDead = !isGraceActive && (status == "DEAD" || health <= 0 || lowestVital <= 0)

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
