package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Attendance
import com.satupintu.mobile.data.model.DisciplineRecord
import com.satupintu.mobile.data.model.DisciplineRule
import com.satupintu.mobile.util.DayScheduleRule
import com.satupintu.mobile.util.HolidayRule
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.util.findHoliday
import com.satupintu.mobile.util.isValidSchoolDay
import com.satupintu.mobile.util.normalizeScope
import com.satupintu.mobile.util.parseHolidaySnapshot
import com.satupintu.mobile.util.parseScheduleSnapshot
import com.satupintu.mobile.util.resolveScheduleRule
import com.satupintu.mobile.util.toDateKey
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

data class DailyAttendanceSummary(
    val day: Int,
    val dayName: String,
    val status: String, // "H", "S", "I", "A", "-"
    val dateStr: String
)

data class MonthlyAttendanceSummary(
    val summaries: List<DailyAttendanceSummary>,
    val totalH: Int,
    val totalS: Int,
    val totalI: Int,
    val totalA: Int
)

sealed class AttendanceUiState {
    object Loading : AttendanceUiState()
    data class Success(
        val history: List<Attendance>,
        val todayAttendance: Attendance?,
        val todaySchedule: String,
        val isHoliday: Boolean,
        val studentName: String,
        val schoolName: String,
        val schoolLat: Double,
        val schoolLng: Double,
        val schoolRadius: Double = 100.0,
        val monthlySummary: MonthlyAttendanceSummary? = null, // Tambah rekap bulanan
        val errorMessage: String? = null // Add transient error message
    ) : AttendanceUiState()
    data class Error(val message: String) : AttendanceUiState()
}

class AttendanceViewModel : ViewModel() {
    companion object {
        // Allow limited early arrival so students who come before the bell can still check in.
        private const val CHECK_IN_EARLY_ALLOWANCE_MINUTES = 120
        // Allow limited overtime for check-out while still blocking late-night attendance actions.
        private const val CHECK_OUT_LATE_ALLOWANCE_MINUTES = 180
    }

    private val _uiState = MutableStateFlow<AttendanceUiState>(AttendanceUiState.Loading)
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    private val db = FirebaseDatabase.getInstance()
    private var currentStudentId: String? = null
    private var currentStudentName: String = ""
    private var currentStudentClass: String = ""
    private var currentSchoolId: String = ""
    private var currentSchoolName: String = ""
    private var currentEntryTime: String = "07:00" // Default entry time
    private var currentExitTime: String = "13:30" // Default exit time

    // Dynamic School Location (defaults match web dashboard)
    private var schoolLat = -7.6698
    private var schoolLng = 112.5432
    private var schoolRadius = 50.0 // meters

    // Local cache for reactive updates
    private var currentHistory: List<Attendance> = emptyList()
    private var currentTodayAttendance: Attendance? = null
    private var currentHolidayDescription: String? = null
    private var currentIsSpecificHoliday: Boolean = false
    private var currentMonthlySummary: MonthlyAttendanceSummary? = null
    private var currentSchedules: Map<Int, DayScheduleRule> = emptyMap()
    private var currentHolidays: List<HolidayRule> = emptyList()
    private var deviceTimeTrusted: Boolean = true

    private val historyListeners = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()
    private var legacyLocationListener: ValueEventListener? = null
    private var scopedLocationListener: ValueEventListener? = null
    private var legacyHolidayListener: ValueEventListener? = null
    private var scopedHolidayListener: ValueEventListener? = null
    private var legacyScheduleListener: ValueEventListener? = null
    private var scopedScheduleListener: ValueEventListener? = null

    fun clearError() {
        val currentState = _uiState.value
        if (currentState is AttendanceUiState.Success) {
            _uiState.value = currentState.copy(errorMessage = null)
        }
    }

    fun loadData(studentKeyCandidate: String, nisn: String, username: String, schoolId: String) {
        viewModelScope.launch {
            _uiState.value = AttendanceUiState.Loading
            detachAllListeners()

            val normalizedCandidate = studentKeyCandidate.trim()
            val normalizedNisn = nisn.trim()
            val normalizedUsername = username.trim()

            fun applyStudentSnapshot(studentSnapshot: DataSnapshot) {
                val studentKey = studentSnapshot.key?.trim().orEmpty()
                if (studentKey.isBlank()) {
                    _uiState.value = AttendanceUiState.Error("Data siswa tidak valid.")
                    return
                }

                val resolvedNisn = studentSnapshot.child("nisn").getValue(String::class.java).orEmpty().trim()
                val resolvedUsername = studentSnapshot.child("username").getValue(String::class.java).orEmpty().trim()

                currentStudentId = studentKey
                currentStudentName = studentSnapshot.child("name").getValue(String::class.java) ?: "Siswa"
                currentStudentClass = (
                    studentSnapshot.child("class").getValue(String::class.java)
                        ?: studentSnapshot.child("kelas").getValue(String::class.java)
                        ?: ""
                    ).trim()
                currentSchoolId = normalizeScope(studentSnapshot.child("schoolId").getValue(String::class.java))
                currentSchoolName = studentSnapshot.child("schoolName").getValue(String::class.java).orEmpty().trim()

                val identityAliases = linkedSetOf(studentKey, resolvedNisn, resolvedUsername, normalizedNisn, normalizedUsername)
                    .map { it.trim() }
                    .filter { it.isNotBlank() }
                    .toSet()

                attachRuleListeners()
                loadAttendanceHistory(identityAliases)
            }

            fun failNotFound() {
                _uiState.value = AttendanceUiState.Error("Data siswa tidak ditemukan.")
            }

            fun lookupByKey(refPath: String, key: String, onFound: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                db.getReference(refPath).child(key).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        if (snapshot.exists()) onFound(snapshot) else onMiss()
                    }
                    override fun onCancelled(error: DatabaseError) {
                        _uiState.value = AttendanceUiState.Error(error.message)
                    }
                })
            }

            fun lookupByFieldQuery(refPath: String, field: String, value: String, onFound: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                db.getReference(refPath).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        if (snapshot.exists()) onFound(snapshot.children.first()) else onMiss()
                    }
                    override fun onCancelled(error: DatabaseError) {
                        _uiState.value = AttendanceUiState.Error(error.message)
                    }
                })
            }

            fun lookupByField(refPath: String, field: String, value: String, onFound: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                if (refPath == "students" && field == "nisn") {
                    lookupByKey(refPath, value, onFound) {
                        lookupByFieldQuery(refPath, field, value, onFound, onMiss)
                    }
                    return
                }
                lookupByFieldQuery(refPath, field, value, onFound, onMiss)
            }

            if (normalizedCandidate.isNotBlank()) {
                lookupByKey("gas/schools/$schoolId/students", normalizedCandidate, ::applyStudentSnapshot) {
                    lookupByKey("master_students", normalizedCandidate, ::applyStudentSnapshot) {
                        lookupByKey("students", normalizedCandidate, ::applyStudentSnapshot) {
                            lookupByField("gas/schools/$schoolId/students", "username", normalizedCandidate, ::applyStudentSnapshot) {
                                lookupByField("master_students", "username", normalizedCandidate, ::applyStudentSnapshot) {
                                    lookupByField("students", "username", normalizedCandidate, ::applyStudentSnapshot) {
                                        if (normalizedCandidate.all { it.isDigit() }) {
                                            lookupByField("gas/schools/$schoolId/students", "nisn", normalizedCandidate, ::applyStudentSnapshot) {
                                                lookupByField("master_students", "nisn", normalizedCandidate, ::applyStudentSnapshot) {
                                                    lookupByField("students", "nisn", normalizedCandidate, ::applyStudentSnapshot) {
                                                        failNotFound()
                                                    }
                                                }
                                            }
                                        } else {
                                            failNotFound()
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return@launch
            }

            if (normalizedNisn.isNotBlank()) {
                lookupByField("gas/schools/$schoolId/students", "nisn", normalizedNisn, ::applyStudentSnapshot) {
                    lookupByField("master_students", "nisn", normalizedNisn, ::applyStudentSnapshot) {
                        lookupByField("students", "nisn", normalizedNisn, ::applyStudentSnapshot) {
                            failNotFound()
                        }
                    }
                }
                return@launch
            }

            if (normalizedUsername.isNotBlank()) {
                lookupByField("gas/schools/$schoolId/students", "username", normalizedUsername, ::applyStudentSnapshot) {
                    lookupByField("master_students", "username", normalizedUsername, ::applyStudentSnapshot) {
                        lookupByField("students", "username", normalizedUsername, ::applyStudentSnapshot) {
                            failNotFound()
                        }
                    }
                }
                return@launch
            }

            _uiState.value = AttendanceUiState.Error("Sesi siswa tidak valid. Silakan login ulang.")
        }
    }

    private fun readSnapshotDouble(snapshot: DataSnapshot, key: String, fallback: Double): Double {
        val raw = snapshot.child(key).value ?: return fallback
        return when (raw) {
            is Number -> raw.toDouble()
            is String -> raw.trim().toDoubleOrNull() ?: fallback
            else -> fallback
        }
    }

    private fun attachRuleListeners() {
        var scopedLocationAvailable = false
        var scopedSchedulesAvailable = false
        var scopedHolidaysAvailable = false

        fun applyLocation(source: DataSnapshot?) {
            val snapshot = source ?: run {
                schoolLat = -7.6698
                schoolLng = 112.5432
                schoolRadius = 50.0
                updateUiState()
                return
            }

            schoolLat = readSnapshotDouble(snapshot, "latitude", -7.6698)
            schoolLng = readSnapshotDouble(snapshot, "longitude", 112.5432)
            val nextRadius = readSnapshotDouble(snapshot, "radius", 50.0)
            schoolRadius = if (nextRadius > 0) nextRadius else 50.0
            updateUiState()
        }

        fun applySchedules(snapshot: DataSnapshot) {
            currentSchedules = parseScheduleSnapshot(snapshot)
            refreshRuleDerivedState()
        }

        fun applyHolidays(snapshot: DataSnapshot) {
            currentHolidays = parseHolidaySnapshot(snapshot)
            refreshRuleDerivedState()
        }

        if (currentSchoolId.isNotBlank()) {
            scopedLocationListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        scopedLocationAvailable = true
                        applyLocation(snapshot)
                    } else if (!scopedLocationAvailable && legacyLocationListener == null) {
                        legacyLocationListener = object : ValueEventListener {
                            override fun onDataChange(legacySnapshot: DataSnapshot) {
                                if (!scopedLocationAvailable && legacySnapshot.exists()) {
                                    applyLocation(legacySnapshot)
                                }
                            }
                            override fun onCancelled(error: DatabaseError) {}
                        }
                        db.getReference("school_location").addValueEventListener(legacyLocationListener as ValueEventListener)
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("school_settings").child(currentSchoolId).child("attendance").child("school_location")
                .addValueEventListener(scopedLocationListener as ValueEventListener)

            scopedScheduleListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        scopedSchedulesAvailable = true
                        applySchedules(snapshot)
                    } else if (!scopedSchedulesAvailable && legacyScheduleListener == null) {
                        legacyScheduleListener = object : ValueEventListener {
                            override fun onDataChange(legacySnapshot: DataSnapshot) {
                                if (!scopedSchedulesAvailable && legacySnapshot.exists()) {
                                    applySchedules(legacySnapshot)
                                }
                            }
                            override fun onCancelled(error: DatabaseError) {}
                        }
                        db.getReference("schedules").addValueEventListener(legacyScheduleListener as ValueEventListener)
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("school_settings").child(currentSchoolId).child("attendance").child("schedules")
                .addValueEventListener(scopedScheduleListener as ValueEventListener)

            scopedHolidayListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        scopedHolidaysAvailable = true
                        applyHolidays(snapshot)
                    } else if (!scopedHolidaysAvailable && legacyHolidayListener == null) {
                        legacyHolidayListener = object : ValueEventListener {
                            override fun onDataChange(legacySnapshot: DataSnapshot) {
                                if (!scopedHolidaysAvailable && legacySnapshot.exists()) {
                                    applyHolidays(legacySnapshot)
                                }
                            }
                            override fun onCancelled(error: DatabaseError) {}
                        }
                        db.getReference("holidays").addValueEventListener(legacyHolidayListener as ValueEventListener)
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("school_settings").child(currentSchoolId).child("attendance").child("holidays")
                .addValueEventListener(scopedHolidayListener as ValueEventListener)
        } else {
            legacyLocationListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) applyLocation(snapshot)
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("school_location").addValueEventListener(legacyLocationListener as ValueEventListener)

            legacyScheduleListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) applySchedules(snapshot)
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("schedules").addValueEventListener(legacyScheduleListener as ValueEventListener)

            legacyHolidayListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) applyHolidays(snapshot)
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            db.getReference("holidays").addValueEventListener(legacyHolidayListener as ValueEventListener)
        }
    }

    private fun refreshRuleDerivedState() {
        val todayKey = toDateKey(System.currentTimeMillis())
        val holiday = findHoliday(currentHolidays, todayKey)
        currentHolidayDescription = holiday?.description?.ifBlank { "Libur Nasional" }
        currentIsSpecificHoliday = holiday != null
        currentMonthlySummary = calculateMonthlySummary(currentHistory)
        updateUiState(currentMonthlySummary)
    }

    private fun calculateMonthlySummary(history: List<Attendance>): MonthlyAttendanceSummary {
        val calendar = Calendar.getInstance()
        val currentMonth = calendar.get(Calendar.MONTH)
        val currentYear = calendar.get(Calendar.YEAR)
        val today = Calendar.getInstance()
        
        calendar.set(Calendar.YEAR, currentYear)
        calendar.set(Calendar.MONTH, currentMonth)
        calendar.set(Calendar.DAY_OF_MONTH, 1)
        
        val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
        val summaries = mutableListOf<DailyAttendanceSummary>()
        var totalH = 0
        var totalS = 0
        var totalI = 0
        var totalA = 0
        
        val latestByDate = history
            .filter {
                val attCal = Calendar.getInstance().apply { timeInMillis = it.date }
                attCal.get(Calendar.YEAR) == currentYear && attCal.get(Calendar.MONTH) == currentMonth
            }
            .groupBy { toDateKey(it.date) }
            .mapValues { (_, records) -> records.maxByOrNull { it.date } }
        
        for (day in 1..daysInMonth) {
            calendar.set(Calendar.DAY_OF_MONTH, day)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            
            val dayName = com.satupintu.mobile.util.formatIndonesianShortDay(calendar.time)
            val dateStr = toDateKey(calendar)
            
            if (!isValidSchoolDay(calendar, currentSchedules, currentHolidays)) {
                summaries.add(DailyAttendanceSummary(day, dayName, "-", dateStr))
                continue
            }
            
            val attendance = latestByDate[dateStr]
            
            val status = when (attendance?.status) {
                "PRESENT", "LATE" -> {
                    totalH++
                    "H"
                }
                "SICK" -> {
                    totalS++
                    "S"
                }
                "PERMIT" -> {
                    totalI++
                    "I"
                }
                "ABSENT" -> {
                    totalA++
                    "A"
                }
                else -> {
                    totalA++
                    "A"
                }
            }
            
            summaries.add(DailyAttendanceSummary(day, dayName, status, dateStr))
        }
        
        return MonthlyAttendanceSummary(summaries, totalH, totalS, totalI, totalA)
    }
    
    private fun loadAttendanceHistory(studentAliases: Set<String>) {
        val normalizedAliases = studentAliases.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        if (normalizedAliases.isEmpty()) {
            currentHistory = emptyList()
            currentTodayAttendance = null
            updateUiState(calculateMonthlySummary(emptyList()))
            return
        }

        val normalizedSchoolId = normalizeScope(currentSchoolId)
        val historyBySource = mutableMapOf<String, List<Attendance>>()

        fun recompute() {
            val merged = linkedMapOf<String, Attendance>()
            historyBySource.values.flatten().forEach { item ->
                val existing = merged[item.id]
                if (existing == null || item.date >= existing.date) {
                    merged[item.id] = item
                }
            }

            val history = merged.values.sortedByDescending { it.date }
            val todayStr = toDateKey(Calendar.getInstance())
            val todayAttendance = history
                .filter { toDateKey(it.date) == todayStr }
                .maxByOrNull { it.date }

            val monthlySummary = calculateMonthlySummary(history)
            currentMonthlySummary = monthlySummary
            currentHistory = history
            currentTodayAttendance = todayAttendance
            updateUiState(monthlySummary)
        }

        fun attachHistoryListener(
            sourceKey: String,
            query: com.google.firebase.database.Query,
            schoolFilter: String? = null
        ) {
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val items = snapshot.children.mapNotNull { child ->
                        val parsed = child.getValue(Attendance::class.java) ?: return@mapNotNull null
                        parsed.copy(id = child.key ?: "")
                    }.filter { attendance ->
                        schoolFilter.isNullOrBlank() || normalizeScope(attendance.schoolId) == schoolFilter
                    }
                    historyBySource[sourceKey] = items
                    recompute()
                }

                override fun onCancelled(error: DatabaseError) {
                    _uiState.value = AttendanceUiState.Error("Gagal memuat riwayat absensi: ${error.message}")
                }
            }
            query.addValueEventListener(listener)
            historyListeners += query to listener
        }

        normalizedAliases.forEach { alias ->
            if (normalizedSchoolId.isNotBlank()) {
                attachHistoryListener(
                    sourceKey = "scoped:$alias",
                    query = db.getReference("attendance_by_school").child(normalizedSchoolId)
                        .orderByChild("studentId")
                        .equalTo(alias),
                    schoolFilter = normalizedSchoolId
                )
                attachHistoryListener(
                    sourceKey = "legacy:$alias",
                    query = db.getReference("attendance")
                        .orderByChild("studentId")
                        .equalTo(alias),
                    schoolFilter = normalizedSchoolId
                )
            } else {
                attachHistoryListener(
                    sourceKey = "legacy:$alias",
                    query = db.getReference("attendance")
                        .orderByChild("studentId")
                        .equalTo(alias)
                )
            }
        }
    }
    
    private fun updateUiState(monthlySummary: MonthlyAttendanceSummary? = null) {
        val calendar = Calendar.getInstance()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        val summaryToUse = monthlySummary ?: currentMonthlySummary

        val todayRule = resolveScheduleRule(dayOfWeek, currentSchedules, "07:00", "13:30")
        currentEntryTime = todayRule.startTime.ifBlank { "07:00" }
        currentExitTime = todayRule.endTime.ifBlank { "13:30" }

        val isHoliday = !isValidSchoolDay(calendar, currentSchedules, currentHolidays)
        val todaySchedule = when {
            currentIsSpecificHoliday -> "Libur: ${currentHolidayDescription ?: "Libur Nasional"}"
            isHoliday -> "Libur"
            else -> "${currentEntryTime} - ${currentExitTime}"
        }

        _uiState.value = AttendanceUiState.Success(
            history = currentHistory,
            todayAttendance = currentTodayAttendance,
            todaySchedule = todaySchedule,
            isHoliday = isHoliday,
            studentName = currentStudentName,
            schoolName = currentSchoolName,
            schoolLat = schoolLat,
            schoolLng = schoolLng,
            schoolRadius = schoolRadius,
            monthlySummary = summaryToUse
        )
    }

    fun checkIn(
        lat: Double,
        lng: Double,
        accuracyMeters: Float? = null,
        isMockLocation: Boolean = false,
        locationProvider: String? = null,
        deviceTimeTrusted: Boolean = true
    ) {
        val studentId = currentStudentId
        if (studentId == null) {
            val currentState = _uiState.value
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = "Gagal: ID Siswa tidak ditemukan. Silakan muat ulang.")
            }
            return
        }

        this.deviceTimeTrusted = deviceTimeTrusted

        if (!deviceTimeTrusted) {
            val currentState = _uiState.value
            val errorMsg = "Tanggal/jam perangkat tidak dipercaya. Aktifkan tanggal otomatis dan zona waktu otomatis."
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }

        if (!SecurityUtils.isValidCoordinate(lat, lng)) {
            val currentState = _uiState.value
            val errorMsg = "Koordinat lokasi tidak valid. Aktifkan GPS lalu coba lagi."
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }

        if (!SecurityUtils.isValidCoordinate(schoolLat, schoolLng)) {
            val currentState = _uiState.value
            val errorMsg = "Lokasi sekolah belum valid. Hubungi admin untuk memeriksa pengaturan geofence."
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }

        if (isMockLocation) {
            val currentState = _uiState.value
            val errorMsg = "Lokasi palsu terdeteksi. Absensi diblokir."
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }

        if (!isValidSchoolDay(Calendar.getInstance(), currentSchedules, currentHolidays)) {
            val currentState = _uiState.value
            val errorMsg = currentHolidayDescription?.let { "Hari ini libur: $it" } ?: "Hari ini bukan hari efektif absensi."
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }
        
        val distance = calculateDistance(lat, lng, schoolLat, schoolLng)

        if (distance > schoolRadius) {
            val currentState = _uiState.value
            val errorMsg = "Jarak terlalu jauh (${distance.toInt()}m). Maksimal ${schoolRadius.toInt()}m dari sekolah.\n" +
                           "Pastikan Anda sudah berada di lingkungan sekolah."
            
            if (currentState is AttendanceUiState.Success) {
                 _uiState.value = currentState.copy(errorMessage = errorMsg)
            } else {
                 _uiState.value = AttendanceUiState.Error(errorMsg)
            }
            return
        }

        // Check if already checked in today
        val currentState = _uiState.value
        if (currentState is AttendanceUiState.Success) {
             val todayAtt = currentState.todayAttendance
             
             if (todayAtt != null) {
                 val status = todayAtt.status
                 
                 // If status is PRESENT or LATE, assume check-in is done, check for check-out
                 if (status == "PRESENT" || status == "LATE") {
                     if (todayAtt.checkOutTime == null) {
                         if (!isWithinCheckOutWindow()) {
                             _uiState.value = currentState.copy(
                                 errorMessage = buildCheckOutWindowErrorMessage()
                             )
                             return
                         }
                         // Perform Check Out
                         performCheckOut(todayAtt)
                         return
                     } else {
                         _uiState.value = currentState.copy(errorMessage = "Anda sudah melakukan absen masuk dan pulang hari ini.")
                         return
                     }
                 } else {
                     if (!isWithinCheckInWindow()) {
                         _uiState.value = currentState.copy(
                             errorMessage = buildCheckInWindowErrorMessage()
                         )
                         return
                     }
                     // If status is ALPHA, SICK, PERMIT, or UNMARKED, allow override (Student arrived late/was wrongly marked)
                     // We update the EXISTING record instead of creating a new one.
                     performCheckIn(
                         studentId = studentId,
                         lat = lat,
                         lng = lng,
                         accuracyMeters = accuracyMeters,
                         isMockLocation = isMockLocation,
                         locationProvider = locationProvider,
                         existingId = todayAtt.id
                     )
                     return
                 }
             }
        }
        
        if (!isWithinCheckInWindow()) {
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = buildCheckInWindowErrorMessage())
            } else {
                _uiState.value = AttendanceUiState.Error(buildCheckInWindowErrorMessage())
            }
            return
        }

        // Perform Check In (New Record)
        performCheckIn(
            studentId = studentId,
            lat = lat,
            lng = lng,
            accuracyMeters = accuracyMeters,
            isMockLocation = isMockLocation,
            locationProvider = locationProvider
        )
    }

    private fun performCheckIn(
        studentId: String,
        lat: Double,
        lng: Double,
        accuracyMeters: Float? = null,
        isMockLocation: Boolean = false,
        locationProvider: String? = null,
        existingId: String? = null
    ) {
        val normalizedSchoolId = normalizeScope(currentSchoolId)
        if (normalizedSchoolId.isBlank()) {
            val currentState = _uiState.value
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = "Gagal check-in: schoolId kosong")
            } else {
                _uiState.value = AttendanceUiState.Error("Gagal check-in: schoolId kosong")
            }
            return
        }

        val attendanceId = existingId ?: db.getReference("attendance").push().key.orEmpty()
        if (attendanceId.isBlank()) {
            val currentState = _uiState.value
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = "Gagal check-in: id attendance kosong")
            } else {
                _uiState.value = AttendanceUiState.Error("Gagal check-in: id attendance kosong")
            }
            return
        }

        val now = System.currentTimeMillis()
        
        // Calculate status based on currentEntryTime
        val calendar = Calendar.getInstance()
        val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
        val currentMinute = calendar.get(Calendar.MINUTE)
        
        // Parse entry time (format "HH:mm")
        val entryParts = currentEntryTime.split(":")
        val entryHour = entryParts.getOrNull(0)?.toIntOrNull() ?: 7
        val entryMinute = entryParts.getOrNull(1)?.toIntOrNull() ?: 0
        
        val isLate = currentHour > entryHour || (currentHour == entryHour && currentMinute > entryMinute)
        val status = if (isLate) "LATE" else "PRESENT"
        val notes = if (isLate) "Mobile Check-in (Terlambat)" else "Mobile Check-in"

        // INTEGRATION: Auto-record Discipline Violation if Late
        if (isLate) {
            recordLatePenalty(studentId, now)
        }

        val attendance = Attendance(
            id = attendanceId,
            studentId = studentId,
            schoolId = normalizedSchoolId,
            date = now,
            status = status,
            checkInTime = now.toString(), // Save as timestamp string for consistency
            checkInMethod = "MANUAL",
            notes = notes,
            recordedBy = "Student",
            latitude = lat,
            longitude = lng,
            locationAccuracyMeters = accuracyMeters,
            locationProvider = locationProvider,
            isMockLocation = isMockLocation,
            deviceTimeTrusted = deviceTimeTrusted
        )

        val updates = mapOf<String, Any?>(
            "attendance/$attendanceId" to attendance,
            "attendance_by_school/$normalizedSchoolId/$attendanceId" to attendance
        )
        db.reference.updateChildren(updates).addOnFailureListener {
            val currentState = _uiState.value
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = "Gagal check-in: ${it.message}")
            } else {
                _uiState.value = AttendanceUiState.Error("Gagal check-in: ${it.message}")
            }
        }
    }

    private fun performCheckOut(attendance: Attendance) {
        val normalizedSchoolId = normalizeScope(attendance.schoolId)
        if (attendance.id.isBlank() || normalizedSchoolId.isBlank()) return
        val now = System.currentTimeMillis()
        
        val updatedAttendance = attendance.copy(
            checkOutTime = now.toString(),
            schoolId = normalizedSchoolId
        )

        val updates = mapOf<String, Any?>(
            "attendance/${attendance.id}" to updatedAttendance,
            "attendance_by_school/$normalizedSchoolId/${attendance.id}" to updatedAttendance
        )
        db.reference.updateChildren(updates).addOnFailureListener {
            val currentState = _uiState.value
            if (currentState is AttendanceUiState.Success) {
                _uiState.value = currentState.copy(errorMessage = "Gagal check-out: ${it.message}")
            } else {
                _uiState.value = AttendanceUiState.Error("Gagal check-out: ${it.message}")
            }
        }
    }

    private fun parseTimeToMinutes(value: String, fallbackHour: Int, fallbackMinute: Int): Int {
        val parts = value.split(":")
        val hour = parts.getOrNull(0)?.trim()?.toIntOrNull() ?: fallbackHour
        val minute = parts.getOrNull(1)?.trim()?.toIntOrNull() ?: fallbackMinute
        return (hour * 60 + minute).coerceIn(0, 23 * 60 + 59)
    }

    private fun currentMinutesOfDay(calendar: Calendar = Calendar.getInstance()): Int {
        return calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    }

    private fun isWithinCheckInWindow(calendar: Calendar = Calendar.getInstance()): Boolean {
        val nowMinutes = currentMinutesOfDay(calendar)
        val entryMinutes = parseTimeToMinutes(currentEntryTime, 7, 0)
        val exitMinutes = parseTimeToMinutes(currentExitTime, 13, 30)
        val earliestCheckIn = (entryMinutes - CHECK_IN_EARLY_ALLOWANCE_MINUTES).coerceAtLeast(0)
        return nowMinutes in earliestCheckIn..exitMinutes
    }

    private fun isWithinCheckOutWindow(calendar: Calendar = Calendar.getInstance()): Boolean {
        val nowMinutes = currentMinutesOfDay(calendar)
        val entryMinutes = parseTimeToMinutes(currentEntryTime, 7, 0)
        val exitMinutes = parseTimeToMinutes(currentExitTime, 13, 30)
        val latestCheckOut = (exitMinutes + CHECK_OUT_LATE_ALLOWANCE_MINUTES).coerceAtMost(23 * 60 + 59)
        return nowMinutes in entryMinutes..latestCheckOut
    }

    private fun buildCheckInWindowErrorMessage(): String {
        return "Absen datang hanya tersedia pada jam sekolah (${currentEntryTime} - ${currentExitTime})."
    }

    private fun buildCheckOutWindowErrorMessage(): String {
        return "Absen pulang hanya tersedia sampai batas akhir presensi hari ini."
    }

    // Manual Haversine formula calculation (Adopting from reference project)
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6371000.0 // Earth radius in meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private fun recordLatePenalty(studentId: String, date: Long) {
        db.getReference("discipline_rules").addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    val rules = snapshot.children.mapNotNull { it.getValue(DisciplineRule::class.java) }
                    val lateRule = rules
                        .filter { it.isActive && it.category.trim().uppercase() == "VIOLATION" }
                        .find { it.ruleName.contains("Terlambat", ignoreCase = true) }
                    
                    if (lateRule != null) {
                        savePenalty(studentId, lateRule, date)
                    }
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    private fun savePenalty(studentId: String, rule: DisciplineRule, date: Long) {
        val normalizedSchoolId = normalizeScope(currentSchoolId)
        if (normalizedSchoolId.isBlank()) return
        val recordId = listOf(
            normalizedSchoolId,
            studentId.trim(),
            toDateKey(date),
            rule.id.toString()
        ).joinToString("_").replace(Regex("[^A-Za-z0-9_-]"), "_")
        
        val record = DisciplineRecord(
            id = recordId,
            schoolId = normalizedSchoolId,
            studentId = studentId,
            studentNameSnapshot = currentStudentName,
            classNameSnapshot = currentStudentClass,
            ruleId = rule.id,
            ruleNameSnapshot = rule.ruleName,
            date = date,
            points = rule.points,
            description = "Otomatis: ${rule.ruleName}",
            recordedBy = "System (Attendance)",
            sourceApp = "GAS",
            status = "APPROVED",
            createdAt = date,
            updatedAt = date
        )

        val updates = mapOf<String, Any?>(
            "discipline_records/$recordId" to record,
            "discipline_records_by_school/$normalizedSchoolId/$recordId" to record
        )
        db.reference.updateChildren(updates)
    }

    private fun detachAllListeners() {
        historyListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        historyListeners.clear()
        legacyLocationListener?.let { db.getReference("school_location").removeEventListener(it) }
        legacyHolidayListener?.let { db.getReference("holidays").removeEventListener(it) }
        legacyScheduleListener?.let { db.getReference("schedules").removeEventListener(it) }

        if (currentSchoolId.isNotBlank()) {
            scopedLocationListener?.let {
                db.getReference("school_settings").child(currentSchoolId).child("attendance").child("school_location")
                    .removeEventListener(it)
            }
            scopedHolidayListener?.let {
                db.getReference("school_settings").child(currentSchoolId).child("attendance").child("holidays")
                    .removeEventListener(it)
            }
            scopedScheduleListener?.let {
                db.getReference("school_settings").child(currentSchoolId).child("attendance").child("schedules")
                    .removeEventListener(it)
            }
        }

        legacyLocationListener = null
        scopedLocationListener = null
        legacyHolidayListener = null
        scopedHolidayListener = null
        legacyScheduleListener = null
        scopedScheduleListener = null
    }

    override fun onCleared() {
        super.onCleared()
        detachAllListeners()
    }
}
