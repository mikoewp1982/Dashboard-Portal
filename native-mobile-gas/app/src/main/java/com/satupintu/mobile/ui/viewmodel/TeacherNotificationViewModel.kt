package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.BullyingReport
import com.satupintu.mobile.data.model.LiteracyLog
import com.satupintu.mobile.data.model.LiteracyTask
import com.satupintu.mobile.data.model.Student
import com.satupintu.mobile.data.model.Teacher
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.data.model.isDeadByRule
import com.satupintu.mobile.data.repository.BullyingRepository
import com.satupintu.mobile.data.repository.LiteracyRepository
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.TeacherRepository
import com.satupintu.mobile.data.repository.VirtualPetRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.combine
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
    LITERACY_INCOMPLETE,
    BULLYING,
    PET_DEAD
}

private data class TeacherNotifBundle(
    val students: List<Student>,
    val reports: List<BullyingReport>,
    val logs: List<LiteracyLog>,
    val announcements: List<NotificationItem>
)

class TeacherNotificationViewModel : ViewModel() {
    private val db = FirebaseDatabase.getInstance().reference
    private val bullyingRepository = BullyingRepository()
    private val literacyRepository = LiteracyRepository()
    private val studentRepository = StudentRepository()
    private val teacherRepository = TeacherRepository()
    private val petRepository = VirtualPetRepository()

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

    private fun normalizeName(value: String?): String {
        return value
            ?.trim()
            ?.lowercase()
            ?.replace("[^a-z0-9]".toRegex(), "")
            .orEmpty()
    }

    private fun studentIdentitySet(student: Student): Set<String> {
        return listOf(
            normalizeIdentity(student.recordId),
            normalizeIdentity(student.id),
            normalizeIdentity(student.nisn),
            normalizeIdentity(student.username)
        ).filter { it.isNotBlank() }.toSet()
    }

    private fun matchesStudentAliases(candidate: String, aliases: Set<String>): Boolean {
        val normalized = normalizeIdentity(candidate)
        if (normalized.isBlank()) return false
        if (aliases.contains(normalized)) return true
        val lowered = normalized.lowercase()
        return aliases.any { it.lowercase() == lowered }
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
                val effectiveSchoolId = normalizeScope(teacher.schoolId).ifBlank { normalizeScope(schoolId) }
                loadData(teacher.homeroomClass, effectiveSchoolId)
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
            val tasksFlow = literacyRepository.getLiteracyTasks(schoolId)
            val petsFlow = petRepository.getAllPets(schoolId)

            val baseFlow = combine(studentsFlow, reportsFlow, literacyFlow, announcementsFlow) {
                    allStudents, allReports, allLogs, announcements ->
                TeacherNotifBundle(allStudents, allReports, allLogs, announcements)
            }

            combine(baseFlow, tasksFlow, petsFlow) { bundle, tasks, pets ->
                buildNotifications(
                    className = className,
                    schoolId = schoolId,
                    allStudents = bundle.students,
                    allReports = bundle.reports,
                    allLogs = bundle.logs,
                    announcements = bundle.announcements,
                    tasks = tasks,
                    pets = pets
                )
            }.collect { sortedNotifs ->
                _notifications.value = sortedNotifs
                _isLoading.value = false
            }
        }
    }

    private fun buildNotifications(
        className: String,
        schoolId: String,
        allStudents: List<Student>,
        allReports: List<BullyingReport>,
        allLogs: List<LiteracyLog>,
        announcements: List<NotificationItem>,
        tasks: List<LiteracyTask>,
        pets: List<VirtualPet>
    ): List<NotificationItem> {
        val normalizedClassName = normalizeClassName(className)
        val normalizedSchoolId = normalizeScope(schoolId)
        val classStudents = allStudents.filter { student ->
            val matchesClass = normalizedClassName.isBlank() ||
                normalizeClassName(student.className) == normalizedClassName
            val matchesSchool = normalizedSchoolId.isBlank() ||
                normalizeScope(student.schoolId) == normalizedSchoolId
            matchesClass && matchesSchool
        }
        val classStudentIds = classStudents
            .flatMap { studentIdentitySet(it) }
            .filter { it.isNotBlank() }
            .toSet()

        val classStudentNames = classStudents
            .map { normalizeName(it.name) }
            .filter { it.isNotBlank() }
            .toSet()

        val notifs = mutableListOf<NotificationItem>()
        notifs += announcements

        // 1. Pending Bullying Reports (supervised students only)
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

        // 2. Pending literacy submissions to grade
        val pendingLogs = allLogs.filter { log ->
            val logStudentId = normalizeIdentity(log.studentId)
            val logStudentName = normalizeName(log.studentName)

            val matchesRoster = (logStudentId.isNotBlank() && classStudentIds.contains(logStudentId)) ||
                (logStudentName.isNotBlank() && classStudentNames.contains(logStudentName))

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

        // 3. Supervised students who have not completed active literacy tasks
        val activeTasks = tasks.filter { task ->
            task.isActive &&
                (normalizedSchoolId.isBlank() || normalizeScope(task.schoolId) == normalizedSchoolId)
        }
        if (activeTasks.isNotEmpty() && classStudents.isNotEmpty()) {
            val incompleteStudents = mutableListOf<Pair<Student, List<LiteracyTask>>>()
            classStudents.forEach { student ->
                val aliases = studentIdentitySet(student)
                val submittedTaskIds = allLogs
                    .filter { log -> matchesStudentAliases(log.studentId, aliases) }
                    .map { it.taskId.trim() }
                    .filter { it.isNotBlank() }
                    .toSet()
                val missing = activeTasks.filter { task -> !submittedTaskIds.contains(task.id.trim()) }
                if (missing.isNotEmpty()) {
                    incompleteStudents += student to missing
                }
            }

            if (incompleteStudents.isNotEmpty()) {
                val namesPreview = incompleteStudents
                    .take(3)
                    .joinToString(", ") { it.first.name.trim().ifBlank { "Siswa" } }
                val more = incompleteStudents.size - 3
                val namePart = if (more > 0) "$namesPreview, +$more lainnya" else namesPreview
                val taskCount = activeTasks.size
                val newestTaskAt = activeTasks.maxOfOrNull { it.createdAt } ?: System.currentTimeMillis()
                notifs.add(
                    NotificationItem(
                        id = "LI-DIGEST-${normalizedClassName.ifBlank { "all" }}-$taskCount-${incompleteStudents.size}",
                        type = NotificationType.LITERACY_INCOMPLETE,
                        title = "Literasi Belum Dikerjakan",
                        description = "${incompleteStudents.size} siswa belum mengerjakan tugas literasi aktif ($namePart).",
                        timestamp = newestTaskAt,
                        relatedId = "literacy_incomplete"
                    )
                )
            }
        }

        // 4. Dead pets for supervised students
        val petByStudentKey = linkedMapOf<String, VirtualPet>()
        pets.forEach { pet ->
            val key = normalizeIdentity(pet.studentId)
            if (key.isNotBlank() && !petByStudentKey.containsKey(key)) {
                petByStudentKey[key] = pet
            }
        }

        classStudents.forEach { student ->
            val aliases = studentIdentitySet(student)
            val pet = aliases.firstNotNullOfOrNull { alias ->
                petByStudentKey.entries.firstOrNull { (key, _) ->
                    matchesStudentAliases(key, setOf(alias))
                }?.value
            } ?: aliases.firstNotNullOfOrNull { alias ->
                pets.firstOrNull { matchesStudentAliases(it.studentId, setOf(alias)) }
            }

            if (pet != null && pet.isDeadByRule()) {
                val stableId = normalizeIdentity(student.nisn)
                    .ifBlank { normalizeIdentity(student.id) }
                    .ifBlank { normalizeIdentity(student.recordId) }
                    .ifBlank { normalizeName(student.name) }
                notifs.add(
                    NotificationItem(
                        id = "P-$stableId",
                        type = NotificationType.PET_DEAD,
                        title = "Pet Siswa Mati",
                        description = "Pet ${student.name.trim().ifBlank { "siswa" }} telah mati. Perlu tindak lanjut.",
                        timestamp = pet.updatedAt.takeIf { it > 0L } ?: System.currentTimeMillis(),
                        relatedId = pet.id.ifBlank { stableId }
                    )
                )
            }
        }

        return notifs
            .distinctBy { it.id }
            .sortedByDescending { it.timestamp }
    }

    private fun getTeacherAnnouncements(schoolId: String): Flow<List<NotificationItem>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        val teacher = _teacher.value

        if (normalizedSchoolId.isBlank() || teacher == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val identityCandidates = linkedSetOf(
            normalizeIdentity(teacher.id),
            normalizeIdentity(teacher.nuptk),
            normalizeIdentity(teacher.email)
        ).filter { it.isNotBlank() }.toSet()

        if (identityCandidates.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val listeners = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()
        val notificationsMap = linkedMapOf<String, NotificationItem>()

        fun emitData() {
            trySend(notificationsMap.values.sortedByDescending { it.timestamp })
        }

        identityCandidates.forEach { identity ->
            val ref = db.child("gas/schools/$normalizedSchoolId/notification_inbox/teacher/$identity")
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    for (child in snapshot.children) {
                        val title = child.child("title").getValue(String::class.java)?.trim() ?: "Pengumuman Guru"
                        val content = child.child("message").getValue(String::class.java)?.trim() ?: ""
                        val date = child.child("sentAt").getValue(Long::class.java) ?: System.currentTimeMillis()
                        val id = child.key.orEmpty()

                        if (content.isNotBlank() && id.isNotBlank()) {
                            notificationsMap[id] = NotificationItem(
                                id = "A-$id",
                                type = NotificationType.ANNOUNCEMENT,
                                title = title.ifBlank { "Pengumuman Guru" },
                                description = content,
                                timestamp = date,
                                relatedId = id
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

    override fun onCleared() {
        teacherJob?.cancel()
        dataJob?.cancel()
        super.onCleared()
    }
}
