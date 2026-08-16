package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Student
import com.satupintu.mobile.data.model.Teacher
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.TeacherRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

private data class PrayerV2TypeRule(
    val enabled: Boolean,
    val requireMuslim: Boolean,
    val eligibleGender: String
)

private data class PrayerV2Schedule(
    val prayerType: String,
    val classIds: List<String>,
    val dayOfWeek: Int,
    val active: Boolean
)

private data class PrayerV2Override(
    val date: String,
    val prayerType: String,
    val classIds: List<String>,
    val action: String
)

private data class PrayerLogV2(
    val studentId: String = "",
    val nisn: String = "",
    val username: String = "",
    val date: Long = 0L,
    val status: String = "",
    val prayerType: String = ""
)

data class TeacherPrayerHistoryRow(
    val studentName: String,
    val studentNisn: String,
    val date: Long,
    val statusLabel: String
)

class TeacherPrayerV2ViewModel : ViewModel() {
    private val teacherRepository = TeacherRepository()
    private val studentRepository = StudentRepository()
    private val db = FirebaseDatabase.getInstance().reference

    private val _teacher = MutableStateFlow<Teacher?>(null)
    val teacher: StateFlow<Teacher?> = _teacher.asStateFlow()

    private val _students = MutableStateFlow<List<Student>>(emptyList())
    private val _logs = MutableStateFlow<List<PrayerLogV2>>(emptyList())
    private val _prayerItems = MutableStateFlow<List<TeacherPrayerItem>>(emptyList())
    val prayerItems: StateFlow<List<TeacherPrayerItem>> = _prayerItems.asStateFlow()

    private val _historyRows = MutableStateFlow<List<TeacherPrayerHistoryRow>>(emptyList())
    val historyRows: StateFlow<List<TeacherPrayerHistoryRow>> = _historyRows.asStateFlow()

    private val _selectedDate = MutableStateFlow(System.currentTimeMillis())
    val selectedDate: StateFlow<Long> = _selectedDate.asStateFlow()

    private val _selectedPrayerType = MutableStateFlow("DHUHA")
    val selectedPrayerType: StateFlow<String> = _selectedPrayerType.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _typeRules = MutableStateFlow<Map<String, PrayerV2TypeRule>>(emptyMap())
    private val _schedules = MutableStateFlow<List<PrayerV2Schedule>>(emptyList())
    private val _overrides = MutableStateFlow<List<PrayerV2Override>>(emptyList())
    private val _classLabelMap = MutableStateFlow<Map<String, String>>(emptyMap())

    private var teacherJob: Job? = null
    private var studentJob: Job? = null

    private var logsListener: ValueEventListener? = null
    private var logsQuery: com.google.firebase.database.Query? = null
    private var currentLogsScope: String = ""

    private var typesListener: ValueEventListener? = null
    private var schedulesListener: ValueEventListener? = null
    private var overridesListener: ValueEventListener? = null
    private var classesListener: ValueEventListener? = null
    private var configScopeKey: String = ""

    init {
        val filteredStudentsFlow = combine(_teacher, _students, _searchQuery) { teacher, students, query ->
            filterStudents(teacher, students, query)
        }

        viewModelScope.launch {
            combine(
                filteredStudentsFlow,
                _logs,
                _selectedDate,
                _selectedPrayerType,
                _typeRules,
                _schedules,
                _overrides,
                _classLabelMap
            ) { values ->
                val students = values[0] as List<Student>
                val logs = values[1] as List<PrayerLogV2>
                val selectedDate = values[2] as Long
                val prayerType = values[3] as String
                val typeRules = values[4] as Map<String, PrayerV2TypeRule>
                val schedules = values[5] as List<PrayerV2Schedule>
                val overrides = values[6] as List<PrayerV2Override>
                val classLabelMap = values[7] as Map<String, String>
                val (startOfDay, endOfDay) = getDayRange(selectedDate)
                val dayKey = ymdKey(selectedDate)
                val dayOfWeek = mappedDayOfWeek(selectedDate)
                val rule = typeRules[prayerType] ?: PrayerV2TypeRule(false, true, "all")
                students.map { student ->
                    val eligibility = resolveEligibility(
                        student = student,
                        prayerType = prayerType,
                        rule = rule,
                        dayKey = dayKey,
                        dayOfWeek = dayOfWeek,
                        schedules = schedules,
                        overrides = overrides,
                        classLabelMap = classLabelMap
                    )
                    val todayLog = logs
                        .asSequence()
                        .filter { it.prayerType == prayerType }
                        .filter { it.date in startOfDay..endOfDay }
                        .filter { matchesStudent(it, student) }
                        .maxByOrNull { it.date }

                    var statusStr: String
                    var canSelect = false

                    if (!eligibility.eligible) {
                        statusStr = eligibility.label
                    } else if (!eligibility.scheduled) {
                        statusStr = "Tidak dijadwalkan"
                        canSelect = true
                    } else {
                        statusStr = toPrayerLabel(todayLog?.status)
                        canSelect = true
                    }

                    TeacherPrayerItem(
                        student = student,
                        status = statusStr,
                        submittedAt = todayLog?.date,
                        canSelect = canSelect
                    )
                }
            }.collect { items ->
                _prayerItems.value = items
                _isLoading.value = false
            }
        }

        viewModelScope.launch {
            combine(filteredStudentsFlow, _logs, _selectedPrayerType) { students, logs, prayerType ->
                buildHistory(students, logs, prayerType)
            }.collect { rows ->
                _historyRows.value = rows
            }
        }
    }

    fun setTeacherNuptk(nuptk: String, schoolId: String) {
        teacherJob?.cancel()
        teacherJob = viewModelScope.launch {
            val teacher = runCatching { teacherRepository.resolveTeacher(nuptk.trim(), schoolId) }.getOrNull()
            _teacher.value = teacher
            val schoolScope = normalizeScope(teacher?.schoolId)
            attachConfigListeners(schoolScope)
            attachLogsListener(schoolScope)
            loadStudents(schoolScope)
        }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedDate(date: Long) {
        _selectedDate.value = date
    }

    fun setPrayerType(type: String) {
        val normalized = type.trim().uppercase(Locale.ROOT)
        if (normalized == "DHUHA" || normalized == "JUMAT") {
            _selectedPrayerType.value = normalized
        }
    }

    fun submitManualPrayer(
        selectedItems: List<ManualPrayerSubmission>,
        selectedDate: Long,
        prayerType: String,
        onComplete: (ManualPrayerResult) -> Unit
    ) {
        if (selectedItems.isEmpty()) {
            onComplete(ManualPrayerResult(false, "Pilih siswa yang akan dicatat manual."))
            return
        }

        val normalizedPrayerType = prayerType.trim().uppercase(Locale.ROOT)
        if (normalizedPrayerType != "DHUHA" && normalizedPrayerType != "JUMAT") {
            onComplete(ManualPrayerResult(false, "Jenis sholat tidak valid."))
            return
        }

        _isSubmitting.value = true
        val now = System.currentTimeMillis()
        val storedDate = createStoredTimestampForSelectedDate(selectedDate, now)
        val dayKey = ymdKey(selectedDate)
        val updates = mutableMapOf<String, Any?>()

        selectedItems.forEach { selection ->
            val item = selection.item
            val schoolId = normalizeScope(item.student.schoolId)
            val resolvedStudentId = preferredStudentIdentity(item.student)
            val recordId = sanitizeRecordId("${schoolId}_${resolvedStudentId}_${dayKey}_${normalizedPrayerType}")
            val payload = mapOf(
                "schoolId" to schoolId,
                "studentId" to resolvedStudentId,
                "nisn" to normalizeIdentity(item.student.nisn),
                "studentName" to item.student.name,
                "classNameSnapshot" to item.student.className,
                "prayerType" to normalizedPrayerType,
                "dateKey" to dayKey,
                "date" to storedDate,
                "status" to selection.status,
                "recordedBy" to "TEACHER_MANUAL",
                "createdAt" to now,
                "updatedAt" to now
            )
            payload.forEach { (field, value) ->
                updates["prayer_attendance_v2/$recordId/$field"] = value
                updates["prayer_attendance_v2_by_school/$schoolId/$recordId/$field"] = value
            }
        }

        if (updates.isEmpty()) {
            _isSubmitting.value = false
            onComplete(ManualPrayerResult(false, "Tidak ada data yang bisa disimpan."))
            return
        }

        FirebaseDatabase.getInstance().reference.updateChildren(updates)
            .addOnSuccessListener {
                _isSubmitting.value = false
                onComplete(ManualPrayerResult(true, "Presensi manual berhasil disimpan."))
            }
            .addOnFailureListener { error ->
                _isSubmitting.value = false
                onComplete(ManualPrayerResult(false, "Gagal menyimpan presensi manual: ${error.message}"))
            }
    }

    private fun loadStudents(schoolId: String = "") {
        studentJob?.cancel()
        studentJob = viewModelScope.launch {
            studentRepository.getStudents(schoolId).collect { students ->
                _students.value = students
            }
        }
    }

    private fun attachLogsListener(schoolId: String) {
        val scopeKey = normalizeScope(schoolId)
        if (scopeKey.isBlank()) return

        if (logsQuery != null && currentLogsScope == scopeKey && logsListener != null) return

        detachLogsListener()
        currentLogsScope = scopeKey

        val now = System.currentTimeMillis().toDouble()
        val start = (System.currentTimeMillis() - TimeUnit.DAYS.toMillis(90)).toDouble()
        val ref = db.child("prayer_attendance_v2_by_school").child(scopeKey)
        val query = ref.orderByChild("date").startAt(start).endAt(now)
        logsQuery = query

        logsListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val logs = mutableListOf<PrayerLogV2>()
                for (child in snapshot.children) {
                    val studentIdValue = child.child("studentId").getValue(String::class.java) ?: ""
                    val nisnValue = child.child("nisn").getValue(String::class.java) ?: ""
                    val dateValue = child.child("date").getValue(Long::class.java)
                        ?: child.child("createdAt").getValue(Long::class.java)
                        ?: 0L
                    val statusValue = child.child("status").getValue(String::class.java) ?: ""
                    val typeValue = child.child("prayerType").getValue(String::class.java) ?: ""
                    logs.add(
                        PrayerLogV2(
                            studentId = studentIdValue,
                            nisn = nisnValue,
                            date = dateValue,
                            status = statusValue,
                            prayerType = typeValue.trim().uppercase(Locale.ROOT)
                        )
                    )
                }
                _logs.value = logs
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        query.addValueEventListener(logsListener as ValueEventListener)
    }

    private fun detachLogsListener() {
        val listener = logsListener ?: return
        val query = logsQuery ?: return
        query.removeEventListener(listener)
        logsListener = null
        logsQuery = null
        currentLogsScope = ""
    }

    private fun attachConfigListeners(schoolId: String) {
        val scopeKey = normalizeScope(schoolId)
        if (scopeKey.isBlank()) return
        if (configScopeKey == scopeKey && (typesListener != null || schedulesListener != null || overridesListener != null)) return

        detachConfigListeners()
        configScopeKey = scopeKey

        val base = db.child("school_settings").child(scopeKey).child("prayer_v2")

        val typesRef = base.child("types")
        val schedulesRef = base.child("schedules")
        val overridesRef = base.child("overrides")
        val classesRef = db.child("gas").child("schools").child(scopeKey).child("classes")

        typesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val next = linkedMapOf<String, PrayerV2TypeRule>()
                snapshot.children.forEach { child ->
                    val key = child.key?.trim()?.uppercase(Locale.ROOT).orEmpty()
                    if (key.isBlank()) return@forEach
                    next[key] = PrayerV2TypeRule(
                        enabled = child.child("enabled").getValue(Boolean::class.java) ?: true,
                        requireMuslim = child.child("requireMuslim").getValue(Boolean::class.java) ?: true,
                        eligibleGender = child.child("eligibleGender").getValue(String::class.java)?.trim().orEmpty()
                    )
                }
                _typeRules.value = next
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        schedulesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val next = snapshot.children.mapNotNull { child ->
                    val prayerType = child.child("prayerType").getValue(String::class.java)?.trim()?.uppercase(Locale.ROOT).orEmpty()
                    if (prayerType.isBlank()) return@mapNotNull null
                    PrayerV2Schedule(
                        prayerType = prayerType,
                        classIds = parseClassIds(child.child("classIds")),
                        dayOfWeek = child.child("dayOfWeek").getValue(Int::class.java) ?: 5,
                        active = child.child("active").getValue(Boolean::class.java) ?: true
                    )
                }
                _schedules.value = next
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        overridesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val next = snapshot.children.mapNotNull { child ->
                    val date = child.child("date").getValue(String::class.java)?.trim().orEmpty()
                    val prayerType = child.child("prayerType").getValue(String::class.java)?.trim()?.uppercase(Locale.ROOT).orEmpty()
                    if (date.isBlank() || prayerType.isBlank()) return@mapNotNull null
                    PrayerV2Override(
                        date = date,
                        prayerType = prayerType,
                        classIds = parseClassIds(child.child("classIds")),
                        action = child.child("action").getValue(String::class.java)?.trim()?.lowercase(Locale.ROOT).orEmpty()
                    )
                }
                _overrides.value = next
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        classesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val next = mutableMapOf<String, String>()
                snapshot.children.forEach { child ->
                    val key = child.key ?: return@forEach
                    val label = child.child("className").getValue(String::class.java)
                        ?: child.child("name").getValue(String::class.java)
                        ?: child.child("kelas").getValue(String::class.java)
                        ?: key
                    next[key] = label.trim()
                }
                _classLabelMap.value = next
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        typesRef.addValueEventListener(typesListener as ValueEventListener)
        schedulesRef.addValueEventListener(schedulesListener as ValueEventListener)
        overridesRef.addValueEventListener(overridesListener as ValueEventListener)
        classesRef.addValueEventListener(classesListener as ValueEventListener)
    }

    private fun detachConfigListeners() {
        if (configScopeKey.isBlank()) return
        val base = db.child("school_settings").child(configScopeKey).child("prayer_v2")
        typesListener?.let { base.child("types").removeEventListener(it) }
        schedulesListener?.let { base.child("schedules").removeEventListener(it) }
        overridesListener?.let { base.child("overrides").removeEventListener(it) }
        classesListener?.let {
            db.child("gas").child("schools").child(configScopeKey).child("classes").removeEventListener(it)
        }
        typesListener = null
        schedulesListener = null
        overridesListener = null
        classesListener = null
        configScopeKey = ""
        _classLabelMap.value = emptyMap()
    }

    private data class Eligibility(
        val eligible: Boolean,
        val label: String,
        val scheduled: Boolean
    )

    private fun resolveEligibility(
        student: Student,
        prayerType: String,
        rule: PrayerV2TypeRule,
        dayKey: String,
        dayOfWeek: Int,
        schedules: List<PrayerV2Schedule>,
        overrides: List<PrayerV2Override>,
        classLabelMap: Map<String, String>
    ): Eligibility {
        if (!rule.enabled) return Eligibility(false, "Nonaktif", false)

        val religion = normalizeReligion(student.religion)
        val nonMuslim = religion.isNotBlank() && religion != "islam" && religion != "muslim"
        if (rule.requireMuslim && nonMuslim) return Eligibility(false, "Non-Muslim", false)

        val eligibleGender = rule.eligibleGender.trim().lowercase(Locale.ROOT)
        if (eligibleGender == "male" && !isMaleStudent(student.gender)) return Eligibility(false, "Tidak wajib", false)
        if (eligibleGender == "female" && isMaleStudent(student.gender)) return Eligibility(false, "Tidak wajib", false)

        val className = student.className.trim()
        if (className.isBlank()) return Eligibility(false, "Tidak dijadwalkan", false)

        val isScheduled = isScheduledForClass(prayerType, dayKey, dayOfWeek, className, schedules, overrides, classLabelMap)
        return Eligibility(true, "", isScheduled)
    }

    private fun parseClassIds(snapshot: DataSnapshot): List<String> {
        if (!snapshot.exists()) return emptyList()
        val values = mutableListOf<String>()
        snapshot.children.forEach { child ->
            when (val raw = child.value) {
                is String -> {
                    val trimmed = raw.trim()
                    if (trimmed.isNotBlank()) values += trimmed
                }
                is Boolean -> {
                    if (raw) {
                        val key = child.key?.trim().orEmpty()
                        if (key.isNotBlank() && key.toIntOrNull() == null) values += key
                    }
                }
                else -> {
                    val asString = child.getValue(String::class.java)?.trim().orEmpty()
                    if (asString.isNotBlank()) values += asString
                }
            }
        }
        if (values.isNotEmpty()) return values.distinct()
        val leaf = snapshot.getValue(String::class.java)?.trim().orEmpty()
        return if (leaf.isNotBlank()) listOf(leaf) else emptyList()
    }

    private fun hasClassMatch(classIds: List<String>, className: String, classLabelMap: Map<String, String>): Boolean {
        val studentNorm = normalizeClassName(className)
        if (studentNorm.isBlank() || classIds.isEmpty()) return false
        return classIds.any { id ->
            val rawId = id.trim()
            if (rawId.isBlank()) return@any false
            val label = classLabelMap[rawId]
            val candidates = listOfNotNull(rawId, label).map { normalizeClassName(it) }.filter { it.isNotBlank() }
            candidates.any { it == studentNorm }
        }
    }

    private fun isScheduledForClass(
        prayerType: String,
        dayKey: String,
        dayOfWeek: Int,
        className: String,
        schedules: List<PrayerV2Schedule>,
        overrides: List<PrayerV2Override>,
        classLabelMap: Map<String, String>
    ): Boolean {
        val off = overrides.firstOrNull {
            it.prayerType == prayerType && it.date == dayKey && it.action == "deactivate" && hasClassMatch(it.classIds, className, classLabelMap)
        }
        if (off != null) return false

        val on = overrides.firstOrNull {
            it.prayerType == prayerType && it.date == dayKey && it.action == "activate" && hasClassMatch(it.classIds, className, classLabelMap)
        }
        if (on != null) return true

        return schedules.any {
            it.active &&
                it.prayerType == prayerType &&
                it.dayOfWeek == dayOfWeek &&
                hasClassMatch(it.classIds, className, classLabelMap)
        }
    }

    private fun buildHistory(
        students: List<Student>,
        logs: List<PrayerLogV2>,
        prayerType: String
    ): List<TeacherPrayerHistoryRow> {
        if (students.isEmpty()) return emptyList()
        val studentsByKey = students.associateBy { teacherPrayerIdentityKey(it.id, it.nisn) }
        val candidates = logs
            .asSequence()
            .filter { it.prayerType == prayerType }
            .mapNotNull { log ->
                val student = students.firstOrNull { matchesStudent(log, it) } ?: return@mapNotNull null
                TeacherPrayerHistoryRow(
                    studentName = student.name,
                    studentNisn = student.nisn,
                    date = log.date,
                    statusLabel = toPrayerLabel(log.status)
                )
            }
            .sortedByDescending { it.date }
            .take(80)
            .toList()
        if (candidates.isNotEmpty()) return candidates
        return studentsByKey.values.map {
            TeacherPrayerHistoryRow(
                studentName = it.name,
                studentNisn = it.nisn,
                date = 0L,
                statusLabel = "-"
            )
        }
    }

    private fun filterStudents(
        teacher: Teacher?,
        students: List<Student>,
        query: String
    ): List<Student> {
        val className = normalizeClassName(teacher?.homeroomClass.orEmpty())
        if (className.isBlank()) return emptyList()

        return students
            .filter { normalizeClassName(it.className) == className }
            .filter {
                query.isBlank() ||
                    it.name.contains(query, ignoreCase = true) ||
                    it.nisn.contains(query, ignoreCase = true) ||
                    it.id.contains(query, ignoreCase = true)
            }
            .sortedBy { it.name }
    }

    private fun matchesStudent(log: PrayerLogV2, student: Student): Boolean {
        val logCandidates = linkedSetOf(
            normalizeIdentity(log.studentId),
            normalizeIdentity(log.nisn),
            normalizeIdentity(log.username)
        ).filter { it.isNotBlank() }
        if (logCandidates.isEmpty()) return false
        return studentIdentityCandidates(student).any { logCandidates.contains(it) }
    }

    private fun studentIdentityCandidates(student: Student): Set<String> {
        return linkedSetOf(
            normalizeIdentity(student.recordId),
            normalizeIdentity(student.id),
            normalizeIdentity(student.nisn),
            normalizeIdentity(student.username)
        ).filter { it.isNotBlank() }.toSet()
    }

    private fun preferredStudentIdentity(student: Student): String {
        val preferred = normalizeIdentity(student.nisn).ifBlank { normalizeIdentity(student.recordId) }.ifBlank { normalizeIdentity(student.id) }
        return preferred.ifBlank { normalizeIdentity(student.username) }
    }

    private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()
    private fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()

    private fun normalizeReligion(value: String?): String {
        return value?.trim()?.lowercase(Locale.ROOT).orEmpty()
    }

    private fun isMaleStudent(genderRaw: String?): Boolean {
        val g = genderRaw?.trim()?.lowercase(Locale.ROOT).orEmpty()
        if (g.isBlank()) return false
        if (g == "l" || g == "lk" || g.contains("laki")) return true
        if (g == "male" || g.contains("male")) return true
        if (g.contains("putra")) return true
        return false
    }

    private fun normalizeClassName(value: String): String {
        var normalized = value.uppercase(Locale.ROOT).replace("KELAS", "").trim()
        normalized = normalized
            .replace("VIII", "8")
            .replace("VII", "7")
            .replace("IX", "9")
            .replace("III", "3")
            .replace("II", "2")
            .replace("IV", "4")
            .replace("VI", "6")
            .replace("V", "5")
            .replace(Regex("[^A-Z0-9]"), "")
            .trim()
        return normalized
    }

    private fun sanitizeRecordId(value: String): String {
        return value.trim().replace(Regex("[^A-Za-z0-9_-]"), "_")
    }

    private fun getDayRange(targetTimeInMillis: Long): Pair<Long, Long> {
        val startOfDay = Calendar.getInstance().apply {
            timeInMillis = targetTimeInMillis
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val endOfDay = Calendar.getInstance().apply {
            timeInMillis = targetTimeInMillis
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
        return startOfDay to endOfDay
    }

    private fun createStoredTimestampForSelectedDate(selectedDate: Long, fallbackNow: Long): Long {
        val selectedCalendar = Calendar.getInstance().apply { timeInMillis = selectedDate }
        val nowCalendar = Calendar.getInstance().apply { timeInMillis = fallbackNow }
        selectedCalendar.set(Calendar.HOUR_OF_DAY, nowCalendar.get(Calendar.HOUR_OF_DAY))
        selectedCalendar.set(Calendar.MINUTE, nowCalendar.get(Calendar.MINUTE))
        selectedCalendar.set(Calendar.SECOND, nowCalendar.get(Calendar.SECOND))
        selectedCalendar.set(Calendar.MILLISECOND, nowCalendar.get(Calendar.MILLISECOND))
        return selectedCalendar.timeInMillis
    }

    private fun ymdKey(timeInMillis: Long): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(timeInMillis))
    }

    private fun mappedDayOfWeek(epochMillis: Long): Int {
        val cal = Calendar.getInstance().apply { timeInMillis = epochMillis }
        return when (cal.get(Calendar.DAY_OF_WEEK)) {
            Calendar.SUNDAY -> 0
            Calendar.MONDAY -> 1
            Calendar.TUESDAY -> 2
            Calendar.WEDNESDAY -> 3
            Calendar.THURSDAY -> 4
            Calendar.FRIDAY -> 5
            Calendar.SATURDAY -> 6
            else -> 5
        }
    }

    private fun toPrayerLabel(status: String?): String {
        return when (status?.uppercase(Locale.ROOT)) {
            "PRAY" -> "Sudah Presensi"
            "PERMIT" -> "Izin"
            "HALANGAN" -> "Halangan"
            "NOT_PRAY" -> "Tidak Sholat"
            else -> "Belum Presensi"
        }
    }

    override fun onCleared() {
        detachLogsListener()
        detachConfigListeners()
        teacherJob?.cancel()
        studentJob?.cancel()
        super.onCleared()
    }
}

private fun teacherPrayerIdentityKey(id: String, nisn: String): String {
    val idPart = id.trim().lowercase(Locale.ROOT)
    val nisnPart = nisn.trim().lowercase(Locale.ROOT)
    return if (nisnPart.isNotBlank()) nisnPart else idPart
}
