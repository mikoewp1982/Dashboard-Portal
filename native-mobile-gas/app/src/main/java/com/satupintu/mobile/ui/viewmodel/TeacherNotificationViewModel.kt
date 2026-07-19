package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Teacher
import com.satupintu.mobile.data.repository.BullyingRepository
import com.satupintu.mobile.data.repository.LiteracyRepository
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.TeacherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.launch

data class NotificationItem(
    val id: String,
    val type: NotificationType,
    val title: String,
    val description: String,
    val timestamp: Long,
    val relatedId: String // ID of the log or report
)

enum class NotificationType {
    ANNOUNCEMENT,
    LITERACY,
    BULLYING
}

class TeacherNotificationViewModel : ViewModel() {
    private val db = FirebaseDatabase.getInstance().reference
    private val bullyingRepository = BullyingRepository()
    private val literacyRepository = LiteracyRepository()
    private val studentRepository = StudentRepository()
    private val teacherRepository = TeacherRepository()

    private val _notifications = MutableStateFlow<List<NotificationItem>>(emptyList())
    val notifications: StateFlow<List<NotificationItem>> = _notifications.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    private val _teacher = MutableStateFlow<Teacher?>(null)
    val teacher: StateFlow<Teacher?> = _teacher.asStateFlow()
    private var teacherJob: Job? = null
    private var dataJob: Job? = null

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }

        private fun normalizeClassName(value: String): String {
        var normalized = value.uppercase().replace("KELAS", "").trim()
        normalized = normalized.replace("VIII", "8")
        normalized = normalized.replace("VII", "7")
        normalized = normalized.replace("IX", "9")
        normalized = normalized.replace("III", "3")
        normalized = normalized.replace("II", "2")
        normalized = normalized.replace("IV", "4")
        normalized = normalized.replace("VI", "6")
        normalized = normalized.replace("V", "5")
        return normalized.replace("\\s".toRegex(), "").trim()
    }

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    fun loadNotifications(teacherNuptk: String, schoolId: String) {
        teacherJob?.cancel()
        teacherJob = viewModelScope.launch {
            _isLoading.value = true
            val teacher = try {
                teacherRepository.resolveTeacher(teacherNuptk.trim(), schoolId)
            } catch (e: Exception) {
                null
            }
            if (teacher != null) {
                _teacher.value = teacher
                loadData(teacher.homeroomClass, teacher.schoolId)
            } else {
                _teacher.value = null
                _notifications.value = emptyList()
                _isLoading.value = false
            }
        }
    }

    private fun loadData(className: String, schoolId: String) {
        dataJob?.cancel()
        dataJob = viewModelScope.launch {
            val studentsFlow = studentRepository.getStudents(schoolId)
            val reportsFlow = bullyingRepository.getAllReports(schoolId)
            val literacyFlow = literacyRepository.getLiteracyLogs(schoolId)
            val announcementsFlow = getTeacherAnnouncements(schoolId)

            combine(studentsFlow, reportsFlow, literacyFlow, announcementsFlow) { allStudents, allReports, allLogs, announcements ->
                val normalizedClassName = normalizeClassName(className)
                val normalizedSchoolId = normalizeScope(schoolId)
                val classStudents = allStudents.filter { student ->
                    val matchesClass = normalizeClassName(student.className) == normalizedClassName
                    val matchesSchool = normalizedSchoolId.isBlank() || normalizeScope(student.schoolId) == normalizedSchoolId
                    matchesClass && matchesSchool
                }
                val classStudentIds = classStudents.flatMap { student ->
                    listOf(normalizeIdentity(student.id), normalizeIdentity(student.nisn))
                }.filter { it.isNotBlank() }.toSet()

                val classStudentNames = classStudents
                    .map { it.name.trim().lowercase().replace("[^a-z0-9]".toRegex(), "") }
                    .filter { it.isNotBlank() }
                    .toSet()

                val notifs = mutableListOf<NotificationItem>()
                notifs += announcements

                // 1. Pending Bullying Reports
                val pendingReports = allReports.filter { report ->
                    val isRelevant = classStudentIds.contains(normalizeIdentity(report.reporterId)) ||
                        classStudentIds.contains(normalizeIdentity(report.victimId)) ||
                        classStudentIds.contains(normalizeIdentity(report.perpetratorId))
                    isRelevant && report.status.equals("PENDING", ignoreCase = true)
                }

                pendingReports.forEach { report ->
                    notifs.add(
                        NotificationItem(
                            id = "B-${report.id}",
                            type = NotificationType.BULLYING,
                            title = "Laporan Bullying Baru",
                            description = "Laporan tipe ${report.incidentType} perlu ditinjau.",
                            timestamp = report.createdAt,
                            relatedId = report.id
                        )
                    )
                }

                val pendingLogs = allLogs.filter { log ->
                    val logStudentId = normalizeIdentity(log.studentId)
                    val logStudentName = log.studentName
                        .trim()
                        .lowercase()
                        .replace("[^a-z0-9]".toRegex(), "")

                    val matchesRoster = (logStudentId.isNotBlank() && classStudentIds.contains(logStudentId)) ||
                        (logStudentId.isBlank() && logStudentName.isNotBlank() && classStudentNames.contains(logStudentName))

                    matchesRoster && log.status.equals("pending", ignoreCase = true)
                }

                pendingLogs.forEach { log ->
                    notifs.add(
                        NotificationItem(
                            id = "L-${log.id}",
                            type = NotificationType.LITERACY,
                            title = "Tugas Literasi Masuk",
                            description = "${log.studentName} mengumpulkan ringkasan buku '${log.bookTitle}'.",
                            timestamp = log.timestamp,
                            relatedId = log.id
                        )
                    )
                }

                notifs
                    .distinctBy { it.id }
                    .sortedByDescending { it.timestamp }
            }.collect { sortedNotifs ->
                _notifications.value = sortedNotifs
                _isLoading.value = false
            }
        }
    }

    private fun getTeacherAnnouncements(schoolId: String): Flow<List<NotificationItem>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        
        if (normalizedSchoolId.isBlank() || _teacher.value == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val teacherId = normalizeIdentity(_teacher.value!!.id)
        val ref = db.child("gas/schools/$normalizedSchoolId/notification_inbox/teacher/$teacherId")

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = mutableListOf<NotificationItem>()
                for (child in snapshot.children) {
                    val title = child.child("title").getValue(String::class.java)?.trim() ?: "Pengumuman Guru"
                    val content = child.child("message").getValue(String::class.java)?.trim() ?: ""
                    val date = child.child("sentAt").getValue(Long::class.java) ?: System.currentTimeMillis()
                    
                    if (content.isNotBlank()) {
                        list.add(
                            NotificationItem(
                                id = "A-${child.key.orEmpty()}",
                                type = NotificationType.ANNOUNCEMENT,
                                title = title.ifBlank { "Pengumuman Guru" },
                                description = content,
                                timestamp = date,
                                relatedId = child.key.orEmpty()
                            )
                        )
                    }
                }
                trySend(list)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    override fun onCleared() {
        teacherJob?.cancel()
        dataJob?.cancel()
        super.onCleared()
    }
}
