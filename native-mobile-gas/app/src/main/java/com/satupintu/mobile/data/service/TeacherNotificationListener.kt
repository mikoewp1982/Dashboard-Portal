package com.satupintu.mobile.data.service

import android.content.Context
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.utils.NotificationHelper

class TeacherNotificationListener(private val context: Context) {

    private val notificationHelper = NotificationHelper(context)
    private var isFirstLoadLiteracy = true
    private var isFirstLoadBullying = true
    private var isFirstLoadAnnouncement = true
    
    // Track known IDs to avoid spamming on restart (simplified approach)
    // Ideally this should be persisted, but for this session memory is okay
    private val knownLiteracyIds = mutableSetOf<String>()
    private val knownBullyingIds = mutableSetOf<String>()
    private var lastAnnouncementId: String? = null
    
    // Listeners references for cleanup
    private var literacyListener: ValueEventListener? = null
    private var bullyingListener: ValueEventListener? = null
    private var teacherAnnouncementListener: ValueEventListener? = null
    private var studentAnnouncementListener: ValueEventListener? = null
    private var studentPetListener: ValueEventListener? = null
    
    private val db = FirebaseDatabase.getInstance()
    
    // State tracking for Pet
    private var lastPetState: String = "HEALTHY" // HEALTHY, SICK, DEAD

    fun startListening(userRole: String, userCredential: String = "", schoolId: String = "") {
        // Stop any existing listeners first to avoid duplicates or wrong role data
        stopListening()
        
        if (userRole == "Guru") {
            listenForTeacherSpecifics(schoolId)
            listenForTeacherAnnouncements(schoolId, userCredential)
        } else if (userRole == "Siswa") {
            listenForStudentAnnouncements(schoolId, userCredential)
            if (userCredential.isNotEmpty()) {
                listenForStudentPet(userCredential)
            }
        }
    }
    
    fun stopListening() {
        literacyListener?.let { db.getReference("literacy_logs").removeEventListener(it) }
        bullyingListener?.let { db.getReference("bullying_reports").removeEventListener(it) }
        
        if (teacherAnnouncementListener != null && activeTeacherAnnouncementRef != null) {
            activeTeacherAnnouncementRef?.removeEventListener(teacherAnnouncementListener!!)
        }
        if (studentAnnouncementListener != null && activeStudentAnnouncementRef != null) {
            activeStudentAnnouncementRef?.removeEventListener(studentAnnouncementListener!!)
        }
        
        // Remove Pet Listener
        if (studentPetListener != null && activePetRef != null) {
            activePetRef?.removeEventListener(studentPetListener!!)
        }
        
        literacyListener = null
        bullyingListener = null
        teacherAnnouncementListener = null
        studentAnnouncementListener = null
        studentPetListener = null
        activePetRef = null
        activeTeacherAnnouncementRef = null
        activeStudentAnnouncementRef = null
    }
    
    // Helper to remove pet listener properly
    private var activePetRef: com.google.firebase.database.Query? = null
    private var activeTeacherAnnouncementRef: com.google.firebase.database.Query? = null
    private var activeStudentAnnouncementRef: com.google.firebase.database.Query? = null
    
    private fun listenForStudentPet(nisn: String) {
        // 1. Find Student ID from NISN
        val studentsRef = db.getReference("students")
        fun attachPetListener(studentId: String) {
            if (studentId.isBlank()) return
            val petRef = db.getReference("virtual_pets").orderByChild("studentId").equalTo(studentId)
            activePetRef = petRef

            val pListener = object : ValueEventListener {
                override fun onDataChange(petSnapshot: DataSnapshot) {
                    if (!petSnapshot.exists()) return

                    var chosen: DataSnapshot? = null
                    var chosenScore = Long.MIN_VALUE

                    for (child in petSnapshot.children) {
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
                    val isSick = !isDead && (health < 30 || happiness < 30)

                    val currentState = when {
                        isDead -> "DEAD"
                        isSick -> "SICK"
                        else -> "HEALTHY"
                    }

                    if (currentState != lastPetState) {
                        if (currentState == "DEAD") {
                            notificationHelper.showNotification(
                                "🚨 Pet Anda MATI!",
                                "Sayang sekali, Pet Anda telah mati. Hubungi Admin untuk pemulihan."
                            )
                        } else if (currentState == "SICK") {
                            notificationHelper.showNotification(
                                "⚠️ Pet Anda SAKIT!",
                                "Kesehatan Pet menurun drastis. Segera cek dan rawat Pet Anda!"
                            )
                        }
                        lastPetState = currentState
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            }

            petRef.addValueEventListener(pListener)
            studentPetListener = pListener
        }

        studentsRef.child(nisn).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(directSnapshot: DataSnapshot) {
                if (directSnapshot.exists()) {
                    attachPetListener(directSnapshot.key.orEmpty())
                    return
                }

                studentsRef.orderByChild("nisn").equalTo(nisn).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        if (snapshot.exists()) {
                            val studentNode = snapshot.children.first()
                            attachPetListener(studentNode.key.orEmpty())
                        }
                    }
                    override fun onCancelled(error: DatabaseError) {}
                })
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }
    
    private fun listenForTeacherSpecifics(schoolId: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)

        // Listen for Literacy Logs
        val lListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var newItemsCount = 0
                
                for (child in snapshot.children) {
                    val id = child.key ?: continue
                    val logSchoolId = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotEmpty() && logSchoolId.isNotEmpty() && logSchoolId != normalizedSchoolId) {
                        continue
                    }
                    val status = child.child("status").getValue(String::class.java)
                    
                    if (status == "pending") {
                        if (!knownLiteracyIds.contains(id)) {
                            knownLiteracyIds.add(id)
                            if (!isFirstLoadLiteracy) {
                                newItemsCount++
                            }
                        }
                    }
                }

                if (newItemsCount > 0) {
                    notificationHelper.showNotification(
                        "Tugas Literasi Baru",
                        "Ada $newItemsCount tugas literasi baru yang perlu dinilai."
                    )
                }
                isFirstLoadLiteracy = false
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        db.getReference("literacy_logs").addValueEventListener(lListener)
        literacyListener = lListener

        // Listen for Bullying Reports
        val bListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var newItemsCount = 0
                
                for (child in snapshot.children) {
                    val id = child.key ?: continue
                    val logSchoolId = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotEmpty() && logSchoolId.isNotEmpty() && logSchoolId != normalizedSchoolId) {
                        continue
                    }
                    val status = child.child("status").getValue(String::class.java)
                    
                    if (status == "Unhandled" || status == "Belum Ditangani" || status == "PENDING") { 
                        if (!knownBullyingIds.contains(id)) {
                            knownBullyingIds.add(id)
                            if (!isFirstLoadBullying) {
                                newItemsCount++
                            }
                        }
                    }
                }

                if (newItemsCount > 0) {
                    notificationHelper.showNotification(
                        "Laporan Bullying Baru",
                        "Ada $newItemsCount laporan bullying baru yang masuk."
                    )
                }
                isFirstLoadBullying = false
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        db.getReference("gas/schools/${normalizedSchoolId}/halo_spentgapa_reports").addValueEventListener(bListener)
        bullyingListener = bListener
    }
    
    private fun listenForTeacherAnnouncements(schoolId: String, teacherCredential: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        if (normalizedSchoolId.isBlank() || teacherCredential.isBlank()) return

        val ref = db.getReference("gas/schools/$normalizedSchoolId/notification_inbox/teacher/$teacherCredential").limitToLast(1)
        activeTeacherAnnouncementRef = ref
        val tListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists()) return
                
                // Get latest announcement
                val lastChild = snapshot.children.lastOrNull()
                val id = lastChild?.key ?: return
                val content = lastChild.child("message").value?.toString() ?: "Pengumuman Baru"
                val title = lastChild.child("title").value?.toString() ?: "Pengumuman Guru"
                
                if (lastAnnouncementId != null && lastAnnouncementId != id) {
                     notificationHelper.showNotification(
                        title,
                        content
                    )
                }
                lastAnnouncementId = id
            }
             override fun onCancelled(error: DatabaseError) {}
        }
        ref.addValueEventListener(tListener)
        teacherAnnouncementListener = tListener
    }

    private fun listenForStudentAnnouncements(schoolId: String, studentCredential: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        if (normalizedSchoolId.isBlank() || studentCredential.isBlank()) return
        
        val ref = db.getReference("gas/schools/$normalizedSchoolId/notification_inbox/student/$studentCredential").limitToLast(1)
        activeStudentAnnouncementRef = ref

        val sListener = object : ValueEventListener {
             override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists()) return
                
                // Get latest announcement
                val lastChild = snapshot.children.lastOrNull()
                val id = lastChild?.key ?: return
                val content = lastChild.child("message").value?.toString() ?: "Pengumuman Baru"
                val title = lastChild.child("title").value?.toString() ?: "Pengumuman Siswa"
                
                if (lastAnnouncementId != null && lastAnnouncementId != id) {
                     notificationHelper.showNotification(
                        title,
                        content
                    )
                }
                lastAnnouncementId = id
            }
             override fun onCancelled(error: DatabaseError) {}
        }
        ref.addValueEventListener(sListener)
        studentAnnouncementListener = sListener
    }
    private fun normalizeSchoolScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }
}
