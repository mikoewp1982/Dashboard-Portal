package com.satupintu.mobile.data.service

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue
import com.google.firebase.database.ValueEventListener

class PresenceService {
    private val db = FirebaseDatabase.getInstance()
    private val connectedRef = db.getReference(".info/connected")
    private var connectionListener: ValueEventListener? = null
    
    private var currentSchoolId: String? = null
    private var currentLoginKey: String? = null
    private var currentRole: String? = null

    fun startListening(loginKey: String, schoolId: String, role: String) {
        if (loginKey.isBlank() || schoolId.isBlank()) return
        
        currentLoginKey = loginKey
        currentSchoolId = schoolId
        currentRole = role
        
        val deviceRef = db.getReference("active_devices/$schoolId/$loginKey")
        
        connectionListener = connectedRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val connected = snapshot.getValue(Boolean::class.java) ?: false
                if (connected) {
                    val onlineStatus = mapOf(
                        "status" to "ONLINE",
                        "lastSeenAt" to ServerValue.TIMESTAMP,
                        "username" to loginKey,
                        "accountType" to role
                    )
                    
                    val offlineStatus = mapOf(
                        "status" to "OFFLINE",
                        "lastSeenAt" to ServerValue.TIMESTAMP,
                        "username" to loginKey,
                        "accountType" to role
                    )
                    
                    deviceRef.onDisconnect().setValue(offlineStatus).addOnCompleteListener {
                        deviceRef.setValue(onlineStatus)
                    }
                }
            }
            override fun onCancelled(error: DatabaseError) {
                // Ignore
            }
        })
    }
    
    fun stopListening() {
        connectionListener?.let { connectedRef.removeEventListener(it) }
        connectionListener = null
        
        if (currentSchoolId != null && currentLoginKey != null) {
            val deviceRef = db.getReference("active_devices/$currentSchoolId/$currentLoginKey")
            val offlineStatus = mapOf(
                "status" to "OFFLINE",
                "lastSeenAt" to ServerValue.TIMESTAMP,
                "username" to currentLoginKey,
                "accountType" to currentRole
            )
            deviceRef.setValue(offlineStatus)
            deviceRef.onDisconnect().cancel()
        }
        
        currentSchoolId = null
        currentLoginKey = null
        currentRole = null
    }
}
