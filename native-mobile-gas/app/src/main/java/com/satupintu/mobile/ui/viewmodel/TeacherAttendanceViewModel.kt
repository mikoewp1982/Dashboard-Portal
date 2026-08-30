package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satupintu.mobile.data.model.Attendance
import com.satupintu.mobile.data.model.Student
import com.satupintu.mobile.data.model.Teacher
import com.satupintu.mobile.data.repository.AttendanceRepository
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.TeacherRepository
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.util.DayScheduleRule
import com.satupintu.mobile.util.HolidayRule
import com.satupintu.mobile.util.isValidSchoolDay
import com.satupintu.mobile.util.normalizeScope
import com.satupintu.mobile.util.parseHolidaySnapshot
import com.satupintu.mobile.util.parseScheduleSnapshot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.*

data class StudentAttendanceItem(
    val student: Student,
    val status: String, // PRESENT, SICK, PERMIT, ALPHA, or UNMARKED
    val notes: String? = null,
    val attendanceId: String? = null,
    val attendance: Attendance? = null,
    val isPendingTeacherVerification: Boolean = false,
    val isEditableBySecretary: Boolean = true,
    val isSelfSecretaryRow: Boolean = false
)

class TeacherAttendanceViewModel : ViewModel() {
    private val studentRepository = StudentRepository()
    private val attendanceRepository = AttendanceRepository()
    private val teacherRepository = TeacherRepository()

    private val _teacher = MutableStateFlow<Teacher?>(null)
    val teacher: StateFlow<Teacher?> = _teacher.asStateFlow()
    private val _attendanceManagerLabel = MutableStateFlow("Wali Kelas")
    val attendanceManagerLabel: StateFlow<String> = _attendanceManagerLabel.asStateFlow()

    private val _attendanceList = MutableStateFlow<List<StudentAttendanceItem>>(emptyList())
    val attendanceList: StateFlow<List<StudentAttendanceItem>> = _attendanceList.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _selectedDate = MutableStateFlow(System.currentTimeMillis())
    val selectedDate: StateFlow<Long> = _selectedDate.asStateFlow()

    // Statistics
    val attendanceStats: StateFlow<Map<String, Int>> = _attendanceList.map { list ->
        mapOf(
            "PRESENT" to list.count { it.status == "PRESENT" },
            "SICK" to list.count { it.status == "SICK" },
            "PERMIT" to list.count { it.status == "PERMIT" },
            "ABSENT" to list.count { it.status == "ABSENT" },
            "TOTAL" to list.size
        )
    }.stateIn(viewModelScope, SharingStarted.Lazily, emptyMap())

    // Monthly Recap
    private val _selectedMonth = MutableStateFlow(Calendar.getInstance().get(Calendar.MONTH))
    val selectedMonth: StateFlow<Int> = _selectedMonth.asStateFlow()

    private val _selectedYear = MutableStateFlow(Calendar.getInstance().get(Calendar.YEAR))
    val selectedYear: StateFlow<Int> = _selectedYear.asStateFlow()

    private val _selectedWeekStart = MutableStateFlow(startOfWeek(System.currentTimeMillis()))
    val selectedWeekStart: StateFlow<Long> = _selectedWeekStart.asStateFlow()

    private val _monthlyRecap = MutableStateFlow<Map<String, Map<String, Int>>>(emptyMap())
    val monthlyRecap: StateFlow<Map<String, Map<String, Int>>> = _monthlyRecap.asStateFlow()
    private val _weeklyRecap = MutableStateFlow<Map<String, Map<String, Int>>>(emptyMap())
    val weeklyRecap: StateFlow<Map<String, Map<String, Int>>> = _weeklyRecap.asStateFlow()
    private val _schedules = MutableStateFlow<Map<Int, DayScheduleRule>>(emptyMap())
    private val _holidays = MutableStateFlow<List<HolidayRule>>(emptyList())

    private var legacyScheduleListener: ValueEventListener? = null
    private var scopedScheduleListener: ValueEventListener? = null
    private var legacyHolidayListener: ValueEventListener? = null
    private var scopedHolidayListener: ValueEventListener? = null
    private var currentScopeKey: String = ""
    private var requestedSchoolScope: String = ""
    private var classSecretaryAliases: Set<String> = emptySet()
    private var teacherJob: Job? = null
    private var dailyJob: Job? = null
    private var monthlyJob: Job? = null
    private var weeklyJob: Job? = null

    fun setMonth(month: Int) {
        _selectedMonth.value = month
        loadMonthlyRecap()
    }

    fun setYear(year: Int) {
        _selectedYear.value = year
        loadMonthlyRecap()
    }

    fun setSelectedWeek(dateMillis: Long) {
        _selectedWeekStart.value = startOfWeek(dateMillis)
        loadWeeklyRecap()
    }

    fun moveSelectedWeek(offset: Int) {
        val calendar = Calendar.getInstance().apply { timeInMillis = _selectedWeekStart.value }
        calendar.add(Calendar.DAY_OF_MONTH, offset * 7)
        _selectedWeekStart.value = startOfDay(calendar.timeInMillis)
        loadWeeklyRecap()
    }

    private fun loadMonthlyRecap() {
        monthlyJob?.cancel()
        monthlyJob = viewModelScope.launch {
            val month = _selectedMonth.value
            val year = _selectedYear.value
            
            val teacherSchoolScope = resolvedTeacherSchoolScope()
            val studentsFlow = studentRepository.getStudents(teacherSchoolScope)
            val monthlyAttendanceFlow = attendanceRepository.getAttendanceByMonth(month, year, teacherSchoolScope)

            combine(studentsFlow, monthlyAttendanceFlow, _schedules, _holidays) { students, records, schedules, holidays ->
                val targetClass = _teacher.value?.homeroomClass ?: ""
                val classStudents = students.filter {
                    matchesHomeroomClass(it.className, targetClass) &&
                        (teacherSchoolScope.isBlank() || normalizeScope(it.schoolId) == teacherSchoolScope)
                }

                val calendar = Calendar.getInstance()
                calendar.set(Calendar.YEAR, year)
                calendar.set(Calendar.MONTH, month)
                calendar.set(Calendar.DAY_OF_MONTH, 1)
                val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
                val validDates = buildValidDateKeys(
                    days = (1..daysInMonth).map { day ->
                        Calendar.getInstance().apply {
                            set(Calendar.YEAR, year)
                            set(Calendar.MONTH, month)
                            set(Calendar.DAY_OF_MONTH, day)
                        }
                    },
                    schedules = schedules,
                    holidays = holidays
                )

                buildRecapMap(classStudents, records, teacherSchoolScope, validDates)
            }.collect {
                _monthlyRecap.value = it
            }
        }
    }

    private fun loadWeeklyRecap() {
        weeklyJob?.cancel()
        weeklyJob = viewModelScope.launch {
            val weekStart = _selectedWeekStart.value
            val weekEnd = endOfDay(weekStart + (6L * 24L * 60L * 60L * 1000L))

            val teacherSchoolScope = resolvedTeacherSchoolScope()
            val studentsFlow = studentRepository.getStudents(teacherSchoolScope)
            val weeklyAttendanceFlow = attendanceRepository.getAttendanceByRange(weekStart, weekEnd, teacherSchoolScope)

            combine(studentsFlow, weeklyAttendanceFlow, _schedules, _holidays) { students, records, schedules, holidays ->
                val targetClass = _teacher.value?.homeroomClass ?: ""
                val classStudents = students.filter {
                    matchesHomeroomClass(it.className, targetClass) &&
                        (teacherSchoolScope.isBlank() || normalizeScope(it.schoolId) == teacherSchoolScope)
                }

                val validDates = buildValidDateKeys(
                    days = (0..6).map { offset ->
                        Calendar.getInstance().apply {
                            timeInMillis = weekStart
                            add(Calendar.DAY_OF_MONTH, offset)
                        }
                    },
                    schedules = schedules,
                    holidays = holidays
                )

                buildRecapMap(classStudents, records, teacherSchoolScope, validDates)
            }.collect {
                _weeklyRecap.value = it
            }
        }
    }

    fun setTeacherNuptk(nuptk: String, schoolId: String) {
        teacherJob?.cancel()
        teacherJob = viewModelScope.launch {
            _attendanceManagerLabel.value = "Wali Kelas"
            requestedSchoolScope = normalizeScope(schoolId)
            classSecretaryAliases = emptySet()
            val teacher = try {
                teacherRepository.resolveTeacher(nuptk.trim(), schoolId)
            } catch (e: Exception) {
                null
            }
            _teacher.value = teacher
            attachRuleListeners(resolvedTeacherSchoolScope())
            loadDataForDate(_selectedDate.value)
            setSelectedWeek(_selectedDate.value)
            loadMonthlyRecap()
        }
    }

    fun setClassSecretaryContext(
        secretaryName: String,
        className: String,
        schoolId: String,
        secretaryAliases: Set<String>
    ) {
        teacherJob?.cancel()
        teacherJob = viewModelScope.launch {
            _attendanceManagerLabel.value = "Sekretaris Kelas"
            requestedSchoolScope = normalizeScope(schoolId)
            classSecretaryAliases = secretaryAliases.map { normalizeIdentity(it) }.filter { it.isNotBlank() }.toSet()
            _teacher.value = Teacher(
                id = secretaryName.trim().ifBlank { className.trim() },
                name = secretaryName.trim().ifBlank { "Sekretaris Kelas" },
                homeroomClass = className.trim(),
                schoolId = schoolId.trim()
            )
            attachRuleListeners(resolvedTeacherSchoolScope())
            loadDataForDate(_selectedDate.value)
            setSelectedWeek(_selectedDate.value)
            loadMonthlyRecap()
        }
    }

    init {
        // Observe selectedDate changes and reload data
        viewModelScope.launch {
            _selectedDate.collect { date ->
                loadDataForDate(date)
            }
        }
    }

    private fun attachRuleListeners(scopeKey: String) {
        if (currentScopeKey == scopeKey && (legacyScheduleListener != null || scopedScheduleListener != null)) {
            return
        }

        detachRuleListeners()
        currentScopeKey = scopeKey

        legacyScheduleListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (_schedules.value.isEmpty() || scopedScheduleListener == null) {
                    _schedules.value = parseScheduleSnapshot(snapshot)
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        FirebaseDatabase.getInstance().getReference("schedules")
            .addValueEventListener(legacyScheduleListener as ValueEventListener)

        legacyHolidayListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (_holidays.value.isEmpty() || scopedHolidayListener == null) {
                    _holidays.value = parseHolidaySnapshot(snapshot)
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        FirebaseDatabase.getInstance().getReference("holidays")
            .addValueEventListener(legacyHolidayListener as ValueEventListener)

        if (scopeKey.isBlank()) return

        scopedScheduleListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                _schedules.value = if (snapshot.exists()) parseScheduleSnapshot(snapshot) else emptyMap()
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        FirebaseDatabase.getInstance().getReference("school_settings")
            .child(scopeKey)
            .child("attendance")
            .child("schedules")
            .addValueEventListener(scopedScheduleListener as ValueEventListener)

        scopedHolidayListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                _holidays.value = if (snapshot.exists()) parseHolidaySnapshot(snapshot) else emptyList()
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        FirebaseDatabase.getInstance().getReference("school_settings")
            .child(scopeKey)
            .child("attendance")
            .child("holidays")
            .addValueEventListener(scopedHolidayListener as ValueEventListener)
    }

    private fun detachRuleListeners() {
        legacyScheduleListener?.let {
            FirebaseDatabase.getInstance().getReference("schedules").removeEventListener(it)
        }
        scopedScheduleListener?.let {
            if (currentScopeKey.isNotBlank()) {
                FirebaseDatabase.getInstance().getReference("school_settings")
                    .child(currentScopeKey)
                    .child("attendance")
                    .child("schedules")
                    .removeEventListener(it)
            }
        }
        legacyHolidayListener?.let {
            FirebaseDatabase.getInstance().getReference("holidays").removeEventListener(it)
        }
        scopedHolidayListener?.let {
            if (currentScopeKey.isNotBlank()) {
                FirebaseDatabase.getInstance().getReference("school_settings")
                    .child(currentScopeKey)
                    .child("attendance")
                    .child("holidays")
                    .removeEventListener(it)
            }
        }

        legacyScheduleListener = null
        scopedScheduleListener = null
        legacyHolidayListener = null
        scopedHolidayListener = null
        currentScopeKey = ""
    }

    private fun loadDataForDate(date: Long) {
        dailyJob?.cancel()
        dailyJob = viewModelScope.launch {
            val teacherSchoolScope = resolvedTeacherSchoolScope()
            val studentsFlow = studentRepository.getStudents(teacherSchoolScope)
            val attendanceFlow = attendanceRepository.getAttendanceByDate(date, teacherSchoolScope)

            combine(studentsFlow, attendanceFlow) { students, attendances ->
                val targetClass = _teacher.value?.homeroomClass ?: ""
                val attendanceByIdentity = linkedMapOf<String, Attendance>()

                attendances.forEach { attendance ->
                    if (!matchesAttendanceScope(attendance, teacherSchoolScope)) return@forEach
                    attendanceIdentityCandidates(attendance).forEach { identity ->
                        val current = attendanceByIdentity[identity]
                        if (current == null || attendance.date > current.date) {
                            attendanceByIdentity[identity] = attendance
                        }
                    }
                }
                students
                    .filter {
                        matchesHomeroomClass(it.className, targetClass) &&
                            (teacherSchoolScope.isBlank() || normalizeScope(it.schoolId) == teacherSchoolScope)
                    }
                    .map { student ->
                    // Find attendance record for this student
                    val record = studentIdentityCandidates(student)
                        .mapNotNull { attendanceByIdentity[it] }
                        .maxByOrNull { it.date }
                    val isSelfSecretaryRow = isCurrentSecretaryStudent(student)
                    val editableBySecretary = canSecretaryEdit(student, record)
                    StudentAttendanceItem(
                        student = student,
                        status = record?.status ?: "UNMARKED",
                        notes = record?.notes,
                        attendanceId = record?.id,
                        attendance = record,
                        isPendingTeacherVerification = record?.let(::isPendingTeacherVerification) == true,
                        isEditableBySecretary = editableBySecretary,
                        isSelfSecretaryRow = isSelfSecretaryRow
                    )
                }
            }.collect { items ->
                _attendanceList.value = items
                _isLoading.value = false
            }
        }
    }

    fun setDate(date: Long) {
        _selectedDate.value = date
        val normalizedWeek = startOfWeek(date)
        if (_selectedWeekStart.value != normalizedWeek) {
            _selectedWeekStart.value = normalizedWeek
            loadWeeklyRecap()
        }
        _isLoading.value = true
    }

    fun updateNote(studentId: String, note: String) {
        val currentItem = _attendanceList.value.find { preferredStudentIdentity(it.student) == studentId } ?: return
        if (isSecretaryMode() && !currentItem.isEditableBySecretary) return
        
        // Optimistic update
        val updatedList = _attendanceList.value.map {
            if (preferredStudentIdentity(it.student) == studentId) it.copy(notes = note) else it
        }
        _attendanceList.value = updatedList
        
        // Save to repo
        val newRecord = buildAttendanceRecord(
            item = currentItem,
            status = currentItem.status,
            notesOverride = note
        )
        attendanceRepository.saveAttendance(newRecord) { success ->
            // If new record created, we might want to reload to get the new ID, 
            // but for now relying on optimistic UI and eventual consistency is okay.
            // Ideally, saveAttendance should return the ID.
            if (success && currentItem.attendanceId.isNullOrEmpty()) {
                // Force reload to get the new ID if it was a new record
                loadDataForDate(_selectedDate.value)
            }
            if (success) {
                loadWeeklyRecap()
                loadMonthlyRecap()
            }
        }
    }

    fun markAllPresent() {
        val currentList = _attendanceList.value.filter { canEditAttendanceItem(it) }
        val updatedList = _attendanceList.value.map { item ->
            if (canEditAttendanceItem(item)) item.copy(status = "PRESENT") else item
        }
        _attendanceList.value = updatedList // Optimistic update

        // Save all to repo
        // Note: In a real app, you might want to batch this or use a specific API endpoint
        // For Firebase RTDB, we can just loop and save for now (or construct a multi-path update)
        currentList.forEach { item ->
            val newRecord = buildAttendanceRecord(item = item, status = "PRESENT")
            attendanceRepository.saveAttendance(newRecord) { }
        }
        loadWeeklyRecap()
        loadMonthlyRecap()
    }

    fun updateAttendance(studentId: String, status: String) {
        val currentItem = _attendanceList.value.find { preferredStudentIdentity(it.student) == studentId } ?: return
        if (!canEditAttendanceItem(currentItem)) return
        
        val newRecord = buildAttendanceRecord(item = currentItem, status = status)
        
        // Optimistic update
        val updatedList = _attendanceList.value.map {
            if (preferredStudentIdentity(it.student) == studentId) it.copy(status = status) else it
        }
        _attendanceList.value = updatedList

        attendanceRepository.saveAttendance(newRecord) { success ->
            if (!success) {
                // Revert if failed (optional, usually RTDB is reliable offline)
            } else if (currentItem.attendanceId.isNullOrEmpty()) {
                 // Force reload to get the new ID if it was a new record
                 loadDataForDate(_selectedDate.value)
            }
            if (success) {
                loadWeeklyRecap()
                loadMonthlyRecap()
            }
        }
    }

    fun saveAttendanceSelections(
        selections: Map<String, String>,
        onComplete: (Boolean) -> Unit
    ) {
        if (selections.isEmpty()) {
            onComplete(true)
            return
        }

        val currentItems = _attendanceList.value.associateBy { preferredStudentIdentity(it.student) }
        var remaining = selections.size
        var allSuccess = true

        fun finishOne(success: Boolean) {
            if (!success) allSuccess = false
            remaining -= 1
            if (remaining == 0) {
                loadDataForDate(_selectedDate.value)
                loadWeeklyRecap()
                loadMonthlyRecap()
                onComplete(allSuccess)
            }
        }

        selections.forEach { (studentId, status) ->
            val currentItem = currentItems[studentId]
            if (currentItem == null) {
                finishOne(false)
                return@forEach
            }
            if (!canEditAttendanceItem(currentItem)) {
                finishOne(false)
                return@forEach
            }

            if (status == "UNMARKED") {
                val attendanceId = currentItem.attendanceId
                if (attendanceId.isNullOrBlank()) {
                    finishOne(true)
                } else {
                    if (isSecretaryMode() && !currentItem.isPendingTeacherVerification) {
                        finishOne(false)
                        return@forEach
                    }
                    attendanceRepository.deleteAttendance(attendanceId, resolvedStudentSchoolScope(currentItem.student)) { success ->
                        finishOne(success)
                    }
                }
                return@forEach
            }

            val newRecord = buildAttendanceRecord(item = currentItem, status = status)

            attendanceRepository.saveAttendance(newRecord) { success ->
                finishOne(success)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        teacherJob?.cancel()
        dailyJob?.cancel()
        monthlyJob?.cancel()
        weeklyJob?.cancel()
        detachRuleListeners()
    }

    private fun buildValidDateKeys(
        days: List<Calendar>,
        schedules: Map<Int, DayScheduleRule>,
        holidays: List<HolidayRule>
    ): List<Long> {
        return days.mapNotNull { day ->
            day.set(Calendar.HOUR_OF_DAY, 0)
            day.set(Calendar.MINUTE, 0)
            day.set(Calendar.SECOND, 0)
            day.set(Calendar.MILLISECOND, 0)
            if (isValidSchoolDay(day, schedules, holidays)) {
                day.timeInMillis
            } else {
                null
            }
        }
    }

    private fun buildRecapMap(
        classStudents: List<Student>,
        records: List<Attendance>,
        scopeKey: String,
        validDates: List<Long>
    ): Map<String, Map<String, Int>> {
        val recordsByStudentAndDay = mutableMapOf<String, MutableMap<Long, Attendance>>()

        records.forEach { attendance ->
            if (!matchesAttendanceScope(attendance, scopeKey)) return@forEach
            val dayKey = startOfDay(attendance.date)
            attendanceIdentityCandidates(attendance).forEach { identity ->
                val byDay = recordsByStudentAndDay.getOrPut(identity) { mutableMapOf() }
                val current = byDay[dayKey]
                if (current == null || attendance.date > current.date) {
                    byDay[dayKey] = attendance
                }
            }
        }

        val recapMap = mutableMapOf<String, Map<String, Int>>()
        classStudents.forEach { student ->
            val studentRecordsByDay = linkedMapOf<Long, Attendance>()
            studentIdentityCandidates(student).forEach { candidate ->
                recordsByStudentAndDay[candidate]?.forEach { (day, attendance) ->
                    val current = studentRecordsByDay[day]
                    if (current == null || attendance.date > current.date) {
                        studentRecordsByDay[day] = attendance
                    }
                }
            }

            var h = 0
            var s = 0
            var i = 0
            var a = 0

            validDates.forEach { dayKey ->
                val log = studentRecordsByDay[dayKey]
                if (log != null && !isPendingTeacherVerification(log)) {
                    when (log.status.uppercase(Locale.ROOT).trim()) {
                        "PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME", "LATE", "TERLAMBAT" -> h++
                        "SICK", "SAKIT" -> s++
                        "PERMIT", "IZIN", "LEAVE" -> i++
                        "ABSENT", "ALPA", "ALPHA" -> a++
                        else -> a++
                    }
                } else {
                    a++
                }
            }

            recapMap[preferredStudentIdentity(student)] = mapOf(
                "PRESENT" to h,
                "SICK" to s,
                "PERMIT" to i,
                "ABSENT" to a
            )
        }

        return recapMap
    }

    private fun startOfDay(timeMillis: Long): Long {
        return Calendar.getInstance().apply {
            timeInMillis = timeMillis
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun endOfDay(timeMillis: Long): Long {
        return Calendar.getInstance().apply {
            timeInMillis = timeMillis
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }

    private fun startOfWeek(timeMillis: Long): Long {
        return Calendar.getInstance().apply {
            firstDayOfWeek = Calendar.MONDAY
            timeInMillis = timeMillis
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            while (get(Calendar.DAY_OF_WEEK) != Calendar.MONDAY) {
                add(Calendar.DAY_OF_MONTH, -1)
            }
        }.timeInMillis
    }

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }

    private fun normalizeClassName(value: String?): String {
        var normalized = value.orEmpty().uppercase().replace("KELAS", "").trim()
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

    private fun matchesHomeroomClass(studentClass: String?, targetClass: String?): Boolean {
        val left = normalizeClassName(studentClass)
        val right = normalizeClassName(targetClass)
        if (left.isBlank() || right.isBlank()) return false
        return left == right
    }

    private fun studentIdentityCandidates(student: Student): List<String> {
        return listOf(
            normalizeIdentity(student.recordId),
            normalizeIdentity(student.nisn),
            normalizeIdentity(student.id),
            normalizeIdentity(student.username)
        ).filter { it.isNotBlank() }.distinct()
    }

    private fun attendanceIdentityCandidates(attendance: Attendance): List<String> {
        return listOf(
            normalizeIdentity(attendance.studentId),
            normalizeIdentity(attendance.nisn),
            normalizeIdentity(attendance.username)
        ).filter { it.isNotBlank() }.distinct()
    }

    private fun preferredStudentIdentity(student: Student): String {
        return studentIdentityCandidates(student).firstOrNull().orEmpty()
    }

    private fun resolvedTeacherSchoolScope(): String {
        return listOf(
            normalizeScope(_teacher.value?.schoolId),
            requestedSchoolScope
        ).firstOrNull { it.isNotBlank() }.orEmpty()
    }

    private fun resolvedStudentSchoolScope(student: Student): String {
        return listOf(
            normalizeScope(student.schoolId),
            resolvedTeacherSchoolScope()
        ).firstOrNull { it.isNotBlank() }.orEmpty()
    }

    private fun isSecretaryMode(): Boolean {
        return _attendanceManagerLabel.value == "Sekretaris Kelas"
    }

    private fun isPendingTeacherVerification(attendance: Attendance): Boolean {
        return attendance.verificationStatus.trim().uppercase(Locale.ROOT) == "PENDING_TEACHER"
    }

    private fun isCurrentSecretaryStudent(student: Student): Boolean {
        if (classSecretaryAliases.isEmpty()) return false
        return studentIdentityCandidates(student).any { classSecretaryAliases.contains(normalizeIdentity(it)) }
    }

    private fun canSecretaryEdit(student: Student, record: Attendance?): Boolean {
        if (!isSecretaryMode()) return true
        if (isCurrentSecretaryStudent(student)) return false
        if (record == null) return true
        val currentActor = normalizeIdentity(currentRecordedBy())
        return listOf(
            normalizeIdentity(record.recordedBy),
            normalizeIdentity(record.proposedBy),
            normalizeIdentity(record.verifiedBy)
        ).any { owner -> owner.isNotBlank() && owner == currentActor }
    }

    private fun canEditAttendanceItem(item: StudentAttendanceItem): Boolean {
        return if (isSecretaryMode()) item.isEditableBySecretary else true
    }

    private fun buildAttendanceRecord(
        item: StudentAttendanceItem,
        status: String,
        notesOverride: String? = item.notes
    ): Attendance {
        val existing = item.attendance
        val now = System.currentTimeMillis()
        val normalizedStatus = status.trim().uppercase(Locale.ROOT)
        val actor = currentRecordedBy()

        return if (isSecretaryMode()) {
            Attendance(
                id = item.attendanceId ?: existing?.id.orEmpty(),
                studentId = preferredStudentIdentity(item.student),
                schoolId = resolvedStudentSchoolScope(item.student),
                date = _selectedDate.value,
                status = normalizedStatus,
                checkInTime = now.toString(),
                checkOutTime = existing?.checkOutTime,
                checkInMethod = "MANUAL_CLASS_SECRETARY",
                notes = notesOverride,
                proofDocument = existing?.proofDocument,
                recordedBy = actor,
                verificationStatus = "APPROVED",
                verifiedBy = actor,
                verifiedAt = now,
                proposedBy = null,
                proposedAt = null,
                proposedStatus = null,
                latitude = existing?.latitude,
                longitude = existing?.longitude,
                locationAccuracyMeters = existing?.locationAccuracyMeters,
                locationProvider = existing?.locationProvider,
                isMockLocation = existing?.isMockLocation ?: false,
                deviceTimeTrusted = existing?.deviceTimeTrusted ?: true,
                nisn = item.student.nisn,
                username = item.student.username,
                studentName = item.student.name,
                className = item.student.className,
                isEarlyCheckout = existing?.isEarlyCheckout ?: false
            )
        } else {
            Attendance(
                id = item.attendanceId ?: existing?.id.orEmpty(),
                studentId = preferredStudentIdentity(item.student),
                schoolId = resolvedStudentSchoolScope(item.student),
                date = _selectedDate.value,
                status = normalizedStatus,
                checkInTime = now.toString(),
                checkOutTime = existing?.checkOutTime,
                checkInMethod = "MANUAL_TEACHER",
                notes = notesOverride,
                proofDocument = existing?.proofDocument,
                recordedBy = actor,
                verificationStatus = "APPROVED",
                verifiedBy = actor,
                verifiedAt = now,
                proposedBy = existing?.proposedBy,
                proposedAt = existing?.proposedAt,
                proposedStatus = existing?.proposedStatus,
                latitude = existing?.latitude,
                longitude = existing?.longitude,
                locationAccuracyMeters = existing?.locationAccuracyMeters,
                locationProvider = existing?.locationProvider,
                isMockLocation = existing?.isMockLocation ?: false,
                deviceTimeTrusted = existing?.deviceTimeTrusted ?: true,
                nisn = item.student.nisn,
                username = item.student.username,
                studentName = item.student.name,
                className = item.student.className,
                isEarlyCheckout = existing?.isEarlyCheckout ?: false
            )
        }
    }

    private fun currentCheckInMethod(): String {
        return if (_attendanceManagerLabel.value == "Sekretaris Kelas") {
            "MANUAL_CLASS_SECRETARY"
        } else {
            "MANUAL_TEACHER"
        }
    }

    private fun currentRecordedBy(): String {
        val actorName = _teacher.value?.name?.trim().orEmpty().ifBlank { _attendanceManagerLabel.value }
        return "${_attendanceManagerLabel.value}: $actorName"
    }

    private fun matchesStudent(attendance: Attendance, student: Student): Boolean {
        val attendanceIds = attendanceIdentityCandidates(attendance).toSet()
        if (attendanceIds.isEmpty()) return false
        return studentIdentityCandidates(student).any { attendanceIds.contains(it) }
    }

    private fun matchesAttendanceScope(attendance: Attendance, scopeKey: String): Boolean {
        if (scopeKey.isBlank()) return true
        val attendanceScope = normalizeScope(attendance.schoolId)
        return attendanceScope.isBlank() || attendanceScope == scopeKey
    }
}
