package com.sekolah.edulock

import android.content.Context
import android.content.SharedPreferences
import java.util.Calendar
import kotlin.math.abs
import kotlin.math.ceil
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

class PermissionManager(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        "EduLockPermissions", Context.MODE_PRIVATE
    )

    private val database = SchoolServiceGuard.database(context)
    private val activeCodesRef = database.getReference("active_codes")
    private val activeSessionsRef = database.getReference("active_sessions")
    private val activeSessionsBySchoolRef = database.getReference("active_sessions_by_school")

    private var revocationListener: ValueEventListener? = null
    private var currentNisn: String? = null
    private var remoteActivationHandler: android.os.Handler? = null
    private var remoteActivationRunnable: Runnable? = null

    companion object {
        private const val KEY_PERMISSION_GRANTED = "permission_granted"
        private const val KEY_PERMISSION_START_TIME = "permission_start_time"
        private const val KEY_PERMISSION_DURATION = "permission_duration"
        private const val KEY_PERMISSION_CODE_USED = "permission_code_used"
    }

    data class CodeValidationResult(
        val durationMinutes: Int? = null,
        val errorMessage: String? = null
    )

    private fun parseTimeToMinutes(rawValue: String?): Int? {
        val value = rawValue?.trim().orEmpty()
        if (value.isEmpty()) return null

        val parts = value.split(":")
        if (parts.size != 2) return null

        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null

        if (hour !in 0..23 || minute !in 0..59) return null

        return (hour * 60) + minute
    }

    private fun calculateRemainingSessionMinutes(currentMinutes: Int, startMinutes: Int, endMinutes: Int): Int? {
        return if (endMinutes >= startMinutes) {
            if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
                null
            } else {
                endMinutes - currentMinutes
            }
        } else {
            when {
                currentMinutes >= startMinutes -> (24 * 60 - currentMinutes) + endMinutes
                currentMinutes < endMinutes -> endMinutes - currentMinutes
                else -> null
            }
        }
    }

    /**
     * Validasi kode dari Firebase (Dynamic Code)
     * Kode hanya valid jika ada di Firebase dan belum expired
     */
    fun validateCode(code: String, callback: (CodeValidationResult) -> Unit) {
        activeCodesRef.child(code.uppercase().trim()).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    val prefsManager = PreferencesManager(context)
                    val localSchoolId = prefsManager.schoolId.trim().lowercase()
                    val codeSchoolId = snapshot.child("schoolId").getValue(String::class.java)
                        ?.trim()
                        ?.lowercase()
                        .orEmpty()
                    val expiresAt = snapshot.child("expiresAt").getValue(Long::class.java) ?: 0
                    val duration = snapshot.child("duration").getValue(Int::class.java) ?: 0
                    val sessionStart = snapshot.child("sessionStart").getValue(String::class.java)
                    val sessionEnd = snapshot.child("sessionEnd").getValue(String::class.java)
                    val currentTime = System.currentTimeMillis()
                    val now = Calendar.getInstance()
                    val currentMinutes = (now.get(Calendar.HOUR_OF_DAY) * 60) + now.get(Calendar.MINUTE)
                    val startMinutes = parseTimeToMinutes(sessionStart)
                    val endMinutes = parseTimeToMinutes(sessionEnd)

                    if (codeSchoolId.isNotEmpty() && localSchoolId.isNotEmpty() && codeSchoolId != localSchoolId) {
                        callback(CodeValidationResult(errorMessage = "Kode izin bukan untuk sekolah ini."))
                        return
                    }

                    if (currentTime >= expiresAt) {
                        callback(CodeValidationResult(errorMessage = "Kode izin sudah kedaluwarsa. Minta kode baru dari guru."))
                        return
                    }

                    if (duration <= 0) {
                        callback(CodeValidationResult(errorMessage = "Durasi izin pada kode tidak valid."))
                        return
                    }

                    if (startMinutes != null && endMinutes != null) {
                        val remainingSessionMinutes = calculateRemainingSessionMinutes(
                            currentMinutes = currentMinutes,
                            startMinutes = startMinutes,
                            endMinutes = endMinutes
                        )

                        if (remainingSessionMinutes == null || remainingSessionMinutes <= 0) {
                            callback(
                                CodeValidationResult(
                                    errorMessage = "Kode izin hanya bisa dipakai pukul ${sessionStart ?: "-"} - ${sessionEnd ?: "-"}."
                                )
                            )
                            return
                        }

                        callback(
                            CodeValidationResult(
                                durationMinutes = minOf(duration, remainingSessionMinutes)
                            )
                        )
                        return
                    }

                    callback(CodeValidationResult(durationMinutes = duration))
                } else {
                    callback(CodeValidationResult(errorMessage = "Kode izin tidak ditemukan."))
                }
            }

            override fun onCancelled(error: DatabaseError) {
                callback(CodeValidationResult(errorMessage = "Gagal memvalidasi kode izin."))
            }
        })
    }

    /**
     * Start Active Session in Firebase
     * Ini membuat siswa muncul di Dashboard Guru
     */
    fun startSession(nisn: String, name: String, studentClass: String, durationMinutes: Int) {
        val endTime = System.currentTimeMillis() + (durationMinutes * 60 * 1000)
        val prefsManager = PreferencesManager(context)
        val schoolId = prefsManager.schoolId.trim().lowercase()
        
        val sessionData = mapOf(
            "nisn" to nisn,
            "name" to name,
            "class" to studentClass,
            "schoolId" to schoolId,
            "startTime" to System.currentTimeMillis(),
            "endTime" to endTime,
            "duration" to durationMinutes,
            "deviceModel" to android.os.Build.MODEL,
            "deviceId" to prefsManager.deviceId
        )
        
        activeSessionsRef.child(nisn).setValue(sessionData)
            .addOnFailureListener { e ->
                android.widget.Toast.makeText(context, "Gagal lapor aktif: ${e.message}. Cek aturan database.", android.widget.Toast.LENGTH_LONG).show()
            }
        if (schoolId.isNotEmpty()) {
            activeSessionsBySchoolRef.child(schoolId).child(nisn).setValue(sessionData)
        }
        startListeningForRevocation(nisn)
    }

    /**
     * End Active Session
     * Menghapus siswa dari Dashboard Guru
     */
    fun endSession(nisn: String) {
        clearRemoteSessionRecord(nisn)
    }

    /**
     * Resume Session Monitoring (called on app start if permission active)
     */
    fun resumeSession(nisn: String) {
        startListeningForRevocation(nisn)
    }

    private var pollingHandler: android.os.Handler? = null
    private var pollingRunnable: Runnable? = null

    /**
     * Listen for Revocation (Pembatalan Izin oleh Guru)
     * Menggunakan Dual-Mechanism: Realtime Listener + Polling (Backup)
     */
    private fun startListeningForRevocation(nisn: String) {
        if (nisn.isEmpty()) {
            android.util.Log.e("PermissionManager", "Cannot listen: NISN is empty")
            return
        }

        // 1. Setup Realtime Listener
        setupRealtimeListener(nisn)

        // 2. Setup Polling (Backup jika realtime gagal)
        startPolling(nisn)
    }

    private fun setupRealtimeListener(nisn: String) {
        if (currentNisn == nisn && revocationListener != null) {
            // Already listening, but let's refresh just in case
            activeSessionsRef.child(nisn).keepSynced(true)
            return
        }

        stopListeningForRevocation()
        currentNisn = nisn

        activeSessionsRef.child(nisn).keepSynced(true)

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                handleSessionSnapshot(nisn, snapshot, "Realtime")
            }

            override fun onCancelled(error: DatabaseError) {
                android.util.Log.e("PermissionManager", "Listener cancelled: ${error.message}")
            }
        }

        revocationListener = listener
        activeSessionsRef.child(nisn).addValueEventListener(listener)
    }

    private fun startPolling(nisn: String) {
        stopPolling() // Stop old polling if any

        pollingHandler = android.os.Handler(android.os.Looper.getMainLooper())
        pollingRunnable = object : Runnable {
            override fun run() {
                // Poll terus selama listener aktif — juga untuk MENEMUKAN izin remote baru
                // (bukan hanya cabut). Sebelumnya polling berhenti jika lokal belum grant.
                activeSessionsRef.child(nisn).get().addOnSuccessListener { snapshot ->
                    handleSessionSnapshot(nisn, snapshot, "Polling")
                }.addOnFailureListener {
                    // Ignore error silently in production
                }

                pollingHandler?.postDelayed(this, 10000)
            }
        }
        pollingHandler?.post(pollingRunnable!!)
    }

    private fun stopPolling() {
        pollingRunnable?.let { pollingHandler?.removeCallbacks(it) }
        pollingHandler = null
        pollingRunnable = null
    }

    private fun clearRemoteSessionRecord(nisn: String) {
        activeSessionsRef.child(nisn).removeValue()
        val schoolId = PreferencesManager(context).schoolId.trim().lowercase()
        if (schoolId.isNotEmpty()) {
            activeSessionsBySchoolRef.child(schoolId).child(nisn).removeValue()
        }
    }

    private fun cancelScheduledRemoteActivation() {
        remoteActivationRunnable?.let { runnable ->
            remoteActivationHandler?.removeCallbacks(runnable)
        }
        remoteActivationRunnable = null
        remoteActivationHandler = null
    }

    private fun scheduleRemoteActivationCheck(nisn: String, delayMs: Long) {
        cancelScheduledRemoteActivation()

        if (delayMs <= 0L) return

        val safeDelay = delayMs.coerceAtMost(12 * 60 * 60 * 1000L)
        remoteActivationHandler = android.os.Handler(android.os.Looper.getMainLooper())
        remoteActivationRunnable = Runnable {
            activeSessionsRef.child(nisn).get().addOnSuccessListener { snapshot ->
                handleSessionSnapshot(nisn, snapshot, "Scheduled")
            }
        }
        remoteActivationHandler?.postDelayed(remoteActivationRunnable!!, safeDelay)
    }

    private fun getLocalPermissionEndTime(): Long {
        if (!prefs.getBoolean(KEY_PERMISSION_GRANTED, false)) {
            return 0L
        }

        val startTime = prefs.getLong(KEY_PERMISSION_START_TIME, 0L)
        val duration = prefs.getInt(KEY_PERMISSION_DURATION, 0)
        return startTime + (duration * 60 * 1000L)
    }

    private fun buildRemotePermissionLabel(snapshot: DataSnapshot): String {
        val activationSource = snapshot.child("activationSource").getValue(String::class.java)?.trim().orEmpty()
        val activationLabel = snapshot.child("activationLabel").getValue(String::class.java)?.trim().orEmpty()
        return if (activationSource == "admin-class" && activationLabel.isNotEmpty()) {
            "ADMIN-KELAS-$activationLabel"
        } else {
            snapshot.child("code").getValue(String::class.java)?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?: "REMOTE-SESSION"
        }
    }

    private fun handleSessionSnapshot(nisn: String, snapshot: DataSnapshot, source: String) {
        val isGranted = prefs.getBoolean(KEY_PERMISSION_GRANTED, false)

        if (!snapshot.exists()) {
            cancelScheduledRemoteActivation()
            android.util.Log.d("PermissionManager", "Session missing detected via $source")
            
            if (isGranted) {
                val handler = android.os.Handler(android.os.Looper.getMainLooper())
                handler.post {
                    if (prefs.getBoolean(KEY_PERMISSION_GRANTED, false)) {
                        revokePermission(removeRemoteSession = false, keepListening = true)
                        android.widget.Toast.makeText(context.applicationContext, "Izin dicabut oleh Guru!", android.widget.Toast.LENGTH_LONG).show()
                    }
                }
            }
            return
        }

        val startTime = snapshot.child("startTime").getValue(Long::class.java) ?: 0L
        val endTime = snapshot.child("endTime").getValue(Long::class.java) ?: 0L
        val duration = snapshot.child("duration").getValue(Int::class.java) ?: 0
        val sessionStart = snapshot.child("sessionStart").getValue(String::class.java)
        val sessionEnd = snapshot.child("sessionEnd").getValue(String::class.java)
        val now = System.currentTimeMillis()
        val nowCal = Calendar.getInstance()
        val currentMinutes = (nowCal.get(Calendar.HOUR_OF_DAY) * 60) + nowCal.get(Calendar.MINUTE)
        val startMinutes = parseTimeToMinutes(sessionStart)
        val endMinutes = parseTimeToMinutes(sessionEnd)

        // Prefer jam dinding lokal (sessionStart/sessionEnd) — anti-bug timezone server UTC
        // yang membuat startTime/endTime bergeser ~+7 jam di WIB.
        val clockRemaining = if (startMinutes != null && endMinutes != null) {
            calculateRemainingSessionMinutes(currentMinutes, startMinutes, endMinutes)
        } else {
            null
        }

        if (clockRemaining != null) {
            cancelScheduledRemoteActivation()
            if (clockRemaining <= 0) {
                revokePermission(removeRemoteSession = true, keepListening = true, showReturnToMain = isGranted)
                return
            }
            val localEndTime = getLocalPermissionEndTime()
            val expectedEnd = now + (clockRemaining * 60_000L)
            if (!isGranted || abs(localEndTime - expectedEnd) > 60_000L) {
                grantPermission(buildRemotePermissionLabel(snapshot), clockRemaining)
                startPolling(nisn)
            }
            return
        }

        if (startTime > now) {
            scheduleRemoteActivationCheck(nisn, startTime - now)
            return
        }

        cancelScheduledRemoteActivation()

        val remainingMinutes = when {
            endTime > now -> maxOf(1, ceil((endTime - now).toDouble() / 60000.0).toInt())
            duration > 0 -> duration
            else -> 0
        }

        if (remainingMinutes <= 0) {
            revokePermission(removeRemoteSession = true, keepListening = true, showReturnToMain = isGranted)
            return
        }

        val localEndTime = getLocalPermissionEndTime()
        if (!isGranted || abs(localEndTime - endTime) > 60_000L) {
            grantPermission(buildRemotePermissionLabel(snapshot), remainingMinutes)
            startPolling(nisn)
        }
    }

    private fun stopListeningForRevocation() {
        cancelScheduledRemoteActivation()
        currentNisn?.let { nisn ->
            revocationListener?.let { listener ->
                activeSessionsRef.child(nisn).removeEventListener(listener)
            }
        }
        revocationListener = null
        currentNisn = null
        stopPolling()
    }

    /**
     * Grant permission dengan kode
     */
    fun grantPermission(code: String, durationMinutes: Int) {
        prefs.edit().apply {
            putBoolean(KEY_PERMISSION_GRANTED, true)
            putLong(KEY_PERMISSION_START_TIME, System.currentTimeMillis())
            putInt(KEY_PERMISSION_DURATION, durationMinutes)
            putString(KEY_PERMISSION_CODE_USED, code)
            apply()
        }

        try {
            val intent = android.content.Intent("com.sekolah.edulock.ACTION_DISMISS_LOCKSCREEN")
            intent.setPackage(context.packageName)
            context.sendBroadcast(intent)
        } catch (_: Exception) {
        }

        try {
            val intent = android.content.Intent("com.sekolah.edulock.ACTION_STOP_KIOSK")
            intent.setPackage(context.packageName)
            context.sendBroadcast(intent)
        } catch (_: Exception) {
        }

        currentNisn?.let { startPolling(it) }
    }

    /**
     * Cek apakah permission masih aktif
     */
    fun isPermissionActive(): Boolean {
        if (!prefs.getBoolean(KEY_PERMISSION_GRANTED, false)) {
            return false
        }

        val startTime = prefs.getLong(KEY_PERMISSION_START_TIME, 0)
        val duration = prefs.getInt(KEY_PERMISSION_DURATION, 0)
        val currentTime = System.currentTimeMillis()

        val elapsedMinutes = (currentTime - startTime) / 1000 / 60

        // Jika sudah lewat durasi, revoke permission
        if (elapsedMinutes >= duration) {
            revokePermission(removeRemoteSession = true, keepListening = true)
            return false
        }

        return true
    }

    /**
     * Get remaining time in minutes
     */
    fun getRemainingMinutes(): Int {
        if (!isPermissionActive()) {
            return 0
        }

        val startTime = prefs.getLong(KEY_PERMISSION_START_TIME, 0)
        val duration = prefs.getInt(KEY_PERMISSION_DURATION, 0)
        val currentTime = System.currentTimeMillis()

        val elapsedMinutes = (currentTime - startTime) / 1000 / 60
        val remaining = duration - elapsedMinutes.toInt()

        return if (remaining > 0) remaining else 0
    }

    /**
     * Get remaining time as formatted string (HH:mm)
     */
    fun getRemainingTimeFormatted(): String {
        val totalMinutes = getRemainingMinutes()
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60
        return String.format("%02d:%02d", hours, minutes)
    }

    /**
     * Revoke permission
     */
    fun revokePermission(
        removeRemoteSession: Boolean = true,
        keepListening: Boolean = false,
        showReturnToMain: Boolean = true
    ) {
        val wasGranted = prefs.getBoolean(KEY_PERMISSION_GRANTED, false)

        prefs.edit().apply {
            putBoolean(KEY_PERMISSION_GRANTED, false)
            remove(KEY_PERMISSION_START_TIME)
            remove(KEY_PERMISSION_DURATION)
            remove(KEY_PERMISSION_CODE_USED)
            apply()
        }

        val prefsManager = PreferencesManager(context)
        val nisn = prefsManager.nisn
        if (removeRemoteSession && nisn.isNotEmpty()) {
            clearRemoteSessionRecord(nisn)
        }

        if (!keepListening) {
            stopListeningForRevocation()
        }

        // Force user back to MainActivity (Lock Screen)
        if (showReturnToMain && wasGranted) {
            try {
                val intent = android.content.Intent(context, MainActivity::class.java)
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK)
                context.startActivity(intent)
            } catch (e: Exception) {
                android.util.Log.e("PermissionManager", "Failed to launch MainActivity: ${e.message}")
            }
        }
    }

    /**
     * Get permission details
     */
    fun getPermissionDetails(): PermissionDetails? {
        if (!isPermissionActive()) {
            return null
        }

        return PermissionDetails(
            codeUsed = prefs.getString(KEY_PERMISSION_CODE_USED, "") ?: "",
            startTime = prefs.getLong(KEY_PERMISSION_START_TIME, 0),
            durationMinutes = prefs.getInt(KEY_PERMISSION_DURATION, 0),
            remainingMinutes = getRemainingMinutes()
        )
    }

    /**
     * Log permission usage ke database
     */
    fun logPermissionUsage(nisn: String, code: String, durationMinutes: Int) {
        try {
            val dbHelper = DatabaseHelper(context)
            val prefsManager = PreferencesManager(context)
            val studentId = prefsManager.studentId

            if (studentId > 0) {
                dbHelper.insertViolation(
                    studentId,
                    "PERMISSION_GRANTED",
                    "Izin penggunaan HP diberikan dengan kode: $code untuk durasi: $durationMinutes menit"
                )
            }

            // Log to Firebase
            val firebaseManager = FirebaseManager.getInstance(context)
            firebaseManager.logPermission(nisn, code, durationMinutes)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Log pelanggaran ke database
     */
    fun logViolation(nisn: String, violationType: String, description: String) {
        try {
            val dbHelper = DatabaseHelper(context)
            val prefsManager = PreferencesManager(context)
            val studentId = prefsManager.studentId
            val schoolId = prefsManager.schoolId

            if (studentId > 0) {
                dbHelper.insertViolation(studentId, violationType, description)
            }

            // Log to Firebase
            val firebaseManager = FirebaseManager.getInstance(context)
            firebaseManager.logViolation(nisn, schoolId, violationType, description, 0.0, 0.0)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

}

// Data class untuk detail permission
data class PermissionDetails(
    val codeUsed: String,
    val startTime: Long,
    val durationMinutes: Int,
    val remainingMinutes: Int
)
