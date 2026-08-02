package com.sekolah.edulock

import android.content.Context
import android.os.BatteryManager
import android.util.Log
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue

class FirebaseReporter(private val context: Context, private val prefsManager: PreferencesManager) {

    private val db = SchoolServiceGuard.database(context)
    private val activeDevicesRef = db.getReference("active_devices")
    
    // Throttling variables
    private var lastReportTime: Long = 0
    private var lastReportedData: Map<String, Any?> = emptyMap()
    private val HEARTBEAT_INTERVAL = 60 * 1000L // 1 menit heartbeat agar monitoring web tetap hidup
    private val MIN_UPDATE_INTERVAL = 15 * 1000L    // 15 detik jika data berubah
    private var masterSwitchListenerStarted = false

    private fun ensureMasterSwitchListener(schoolId: String, deviceId: String) {
        if (masterSwitchListenerStarted || schoolId.isBlank() || deviceId.isBlank()) return
        masterSwitchListenerStarted = true
        val ref = db.getReference("schools").child(schoolId).child("commands").child("master_switch").child("latest")
        ref.addValueEventListener(object : com.google.firebase.database.ValueEventListener {
            override fun onDataChange(snapshot: com.google.firebase.database.DataSnapshot) {
                if (!snapshot.exists()) return
                val commandId = snapshot.child("commandId").getValue(String::class.java).orEmpty()
                val requestedState = snapshot.child("requestedState").getValue(Boolean::class.java) ?: false
                if (commandId.isNotBlank()) {
                    val ackData = hashMapOf<String, Any?>(
                        "lastMasterSwitchCommandId" to commandId,
                        "lastMasterSwitchAppliedState" to requestedState,
                        "lastMasterSwitchAppliedAt" to ServerValue.TIMESTAMP,
                        "lastMasterSwitchAckSource" to "runtime"
                    )
                    activeDevicesRef.child(schoolId).child(deviceId).updateChildren(ackData)
                }
            }
            override fun onCancelled(error: com.google.firebase.database.DatabaseError) {}
        })
    }

    fun sendStatusUpdate(
        latitude: Double?,
        longitude: Double?,
        isInsideZone: Boolean,
        trustScore: Int,
        isGpsActive: Boolean,
        isInternetActive: Boolean,
        statusMessage: String,
        isAccessibilityEnabled: Boolean,
        isDeviceAdminEnabled: Boolean,
        isProtectionActive: Boolean,
        isPermissionActive: Boolean,
        complianceStatus: String,
        protectionHealth: String,
        lastProtectionCheckAt: Long,
        appVersionCode: Int
    ) {
        val nisn = prefsManager.nisn
        val name = prefsManager.studentName
        val studentClass = prefsManager.studentClass
        val schoolId = prefsManager.schoolId.trim().lowercase()

        val deviceId = prefsManager.deviceId
        if (nisn.isEmpty() || schoolId.isEmpty() || deviceId.isEmpty()) return

        ensureMasterSwitchListener(schoolId, deviceId)

        // Setup OnDisconnect Hook (Memastikan status Offline saat aplikasi mati/force close)
        val deviceNode = activeDevicesRef.child(schoolId).child(deviceId)
        deviceNode.child("deviceStatus").onDisconnect().setValue("Offline")
        deviceNode.child("isInternetActive").onDisconnect().setValue(false)
        deviceNode.child("statusMessage").onDisconnect().setValue("Offline / Disconnected")
        deviceNode.child("complianceStatus").onDisconnect().setValue("OFFLINE")
        deviceNode.child("lastUpdated").onDisconnect().setValue(ServerValue.TIMESTAMP)

        // Data saat ini
        val currentData = mutableMapOf<String, Any>(
            "deviceId" to deviceId,
            "nisn" to nisn,
            "name" to name,
            "class" to studentClass,
            "latitude" to (latitude ?: 0.0),
            "longitude" to (longitude ?: 0.0),
            "isInsideZone" to isInsideZone,
            "trustScore" to trustScore,
            "isGpsActive" to isGpsActive,
            "isInternetActive" to isInternetActive,
            "statusMessage" to statusMessage,
            "deviceStatus" to "Online",
            "isAccessibilityEnabled" to isAccessibilityEnabled,
            "isDeviceAdminEnabled" to isDeviceAdminEnabled,
            "isProtectionActive" to isProtectionActive,
            "isPermissionActive" to isPermissionActive,
            "complianceStatus" to complianceStatus,
            "protectionHealth" to protectionHealth,
            "lastProtectionCheckAt" to lastProtectionCheckAt,
            "appVersionCode" to appVersionCode
        )

        getBatteryLevel()?.let { currentData["battery"] = it }

        // THROTTLING CHECK:
        // Kirim update HANYA jika:
        // 1. Sudah waktunya heartbeat (> 5 menit) -> WAJIB KIRIM
        // 2. ATAU (Data Berubah DAN Sudah lewat jeda minimum 30 detik)
        
        val currentTime = System.currentTimeMillis()
        val timeSinceLastReport = currentTime - lastReportTime
        
        val isHeartbeatDue = timeSinceLastReport > HEARTBEAT_INTERVAL
        val isDataChanged = hasDataChanged(currentData)
        val isMinIntervalPassed = timeSinceLastReport > MIN_UPDATE_INTERVAL

        if (!isHeartbeatDue && !(isDataChanged && isMinIntervalPassed)) {
            // Skip update untuk menghemat kuota & koneksi Firebase
            return
        }

        // Tambahkan timestamp server saat kirim
        val updateData = currentData.toMutableMap()
        updateData["lastUpdated"] = ServerValue.TIMESTAMP
        updateData["lastSeenAt"] = ServerValue.TIMESTAMP

        deviceNode.updateChildren(updateData)
            .addOnSuccessListener {
                // Update cache lokal setelah sukses kirim
                lastReportTime = currentTime
                lastReportedData = currentData
            }
            .addOnFailureListener {
                Log.e("FirebaseReporter", "Failed to update status: ${it.message}")
            }
    }
    
    private fun hasDataChanged(newData: Map<String, Any?>): Boolean {
        // Cek field penting saja
        val keysToCheck = listOf(
            "latitude", "longitude", "isInsideZone", "trustScore", 
            "isGpsActive", "isInternetActive", "statusMessage", "deviceStatus",
            "isAccessibilityEnabled", "isDeviceAdminEnabled", "isProtectionActive",
            "isPermissionActive", "complianceStatus", "protectionHealth", "battery"
        )
        
        for (key in keysToCheck) {
            if (newData[key] != lastReportedData[key]) {
                return true
            }
        }
        return false
    }

    fun reportOffline() {
        val nisn = prefsManager.nisn
        val schoolId = prefsManager.schoolId.trim().lowercase()
        val deviceId = prefsManager.deviceId
        if (nisn.isEmpty() || schoolId.isEmpty() || deviceId.isEmpty()) return

        val deviceNode = activeDevicesRef.child(schoolId).child(deviceId)
        val offlineData = mapOf(
            "deviceStatus" to "Offline",
            "isInternetActive" to false,
            "statusMessage" to "App Uninstalled / Stopped",
            "complianceStatus" to "OFFLINE",
            "lastUpdated" to ServerValue.TIMESTAMP
        )
        
        deviceNode.updateChildren(offlineData)
    }

    private fun getBatteryLevel(): Int? {
        return try {
            val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                .takeIf { it in 0..100 }
        } catch (_: Exception) {
            null
        }
    }
}
