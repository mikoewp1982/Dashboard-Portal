package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.repository.BullyingRepository
import com.satupintu.mobile.data.repository.StudentRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

enum class StudentNotificationType {
    ANNOUNCEMENT,
    REPORT_UPDATE
}

data class StudentNotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val date: Long,
    val type: StudentNotificationType,
    val relatedId: String? = null
)

class StudentNotificationViewModel : ViewModel() {
    private val db = FirebaseDatabase.getInstance().reference
    private val bullyingRepository = BullyingRepository()
    private val studentRepository = StudentRepository()

    private val _notifications = MutableStateFlow<List<StudentNotificationItem>>(emptyList())
    val notifications: StateFlow<List<StudentNotificationItem>> = _notifications

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    private var loadJob: Job? = null

    fun loadNotifications(
        studentCredential: String,
        studentId: String,
        studentClass: String,
        schoolId: String
    ) {
        _isLoading.value = true
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            try {
                val identityCandidates = linkedSetOf(
                    normalizeIdentity(studentCredential),
                    normalizeIdentity(studentId)
                ).filter { it.isNotBlank() }.toMutableSet()

                val resolvedStudent = try {
                    studentRepository.resolveStudent(
                        studentId = studentId,
                        credential = studentCredential,
                        schoolId = schoolId
                    )
                } catch (e: Exception) {
                    null
                }

                resolvedStudent?.let { student ->
                    identityCandidates += normalizeIdentity(student.id)
                    identityCandidates += normalizeIdentity(student.nisn)
                    identityCandidates += normalizeIdentity(student.username)
                }

                val resolvedClass = studentClass.ifBlank { resolvedStudent?.className.orEmpty() }
                val resolvedSchoolId = schoolId.ifBlank { resolvedStudent?.schoolId.orEmpty() }

                // 2. Define Flows
                val announcementsFlow = getAnnouncementsFlow(
                    studentIdentityCandidates = identityCandidates,
                    studentClass = resolvedClass,
                    schoolId = resolvedSchoolId
                )
                val reportsFlow = bullyingRepository.getStudentReports(identityCandidates, resolvedSchoolId)

                // 3. Combine Flows
                combine(announcementsFlow, reportsFlow) { announcements, reports ->
                    val reportNotifs = reports.filter { it.status != "PENDING" }.map { report ->
                        val statusText = when(report.status) {
                            "INVESTIGATING" -> "sedang diproses"
                            "RESOLVED" -> "telah ditindaklanjuti"
                            "CLOSED" -> "telah selesai"
                            else -> "diupdate"
                        }
                        
                        // Use updatedAt as the notification date
                        val date = report.updatedAt.takeIf { it > 0 } ?: report.createdAt

                        StudentNotificationItem(
                            id = "notif_${report.id}",
                            title = "Status Laporan",
                            message = "Laporan ${if(report.category == "INCIDENT") "Peristiwa" else "Bullying"} Anda sekarang statusnya: ${statusText}.",
                            date = date,
                            type = StudentNotificationType.REPORT_UPDATE,
                            relatedId = report.id
                        )
                    }
                    
                    (announcements + reportNotifs).sortedByDescending { it.date }
                }.collect { combinedList ->
                    _notifications.value = combinedList
                    _isLoading.value = false
                }

            } catch (e: Exception) {
                _isLoading.value = false
            }
        }
    }

    private fun getAnnouncementsFlow(
        studentIdentityCandidates: Set<String>,
        studentClass: String,
        schoolId: String
    ): Flow<List<StudentNotificationItem>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        
        if (normalizedSchoolId.isBlank() || studentIdentityCandidates.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        // We listen to notification_inbox for each identity candidate.
        // Usually there is only 1 primary identity (e.g. username/id).
        val listeners = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()
        val notificationsMap = linkedMapOf<String, StudentNotificationItem>()

        fun emitData() {
            trySend(notificationsMap.values.sortedByDescending { it.date })
        }

        studentIdentityCandidates.forEach { identity ->
            val ref = db.child("gas/schools/$normalizedSchoolId/notification_inbox/student/$identity")
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    for (child in snapshot.children) {
                        val title = child.child("title").getValue(String::class.java) ?: "Pengumuman"
                        val content = child.child("message").getValue(String::class.java) ?: ""
                        val date = child.child("sentAt").getValue(Long::class.java) ?: System.currentTimeMillis()
                        val id = child.key ?: ""
                        
                        if (content.isNotEmpty()) {
                            notificationsMap[id] = StudentNotificationItem(
                                id = id,
                                title = title,
                                message = content,
                                date = date,
                                type = StudentNotificationType.ANNOUNCEMENT
                            )
                        }
                    }
                    emitData()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
            ref.addValueEventListener(listener)
            listeners.add(ref to listener)
        }

        awaitClose {
            listeners.forEach { (ref, listener) ->
                ref.removeEventListener(listener)
            }
        }
    }

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }
}
