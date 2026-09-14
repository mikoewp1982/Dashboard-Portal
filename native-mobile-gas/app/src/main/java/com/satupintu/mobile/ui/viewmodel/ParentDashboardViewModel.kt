package com.satupintu.mobile.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Attendance
import com.satupintu.mobile.data.model.DisciplineRecord
import com.satupintu.mobile.util.DayScheduleRule
import com.satupintu.mobile.util.HolidayRule
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.util.findHoliday
import com.satupintu.mobile.util.formatAttendanceTime
import com.satupintu.mobile.util.formatIndonesianShortDay
import com.satupintu.mobile.util.getSchoolIdVariants
import com.satupintu.mobile.util.isFutureDay
import com.satupintu.mobile.util.isValidSchoolDay
import com.satupintu.mobile.util.matchesHomeroomClass
import com.satupintu.mobile.util.normalizeScope
import com.satupintu.mobile.util.parseActiveDaysSnapshot
import com.satupintu.mobile.util.parseHolidaySnapshot
import com.satupintu.mobile.util.parseScheduleSnapshot
import com.satupintu.mobile.util.resolveScheduleRule
import com.satupintu.mobile.util.toAdminDayOfWeek
import com.satupintu.mobile.util.toDateKey
import com.satupintu.mobile.utils.SecurePreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class LinkedChild(
    val studentId: String = "",
    val nisn: String = "",
    val name: String = "",
    val className: String = "",
    val schoolId: String = "",
    val schoolName: String = ""
)

data class ParentDailyPrayer(
    val dateStr: String = "",
    val prayerType: String = "Dzuhur",
    val status: String = "Belum",
    val timestamp: Long = 0L,
    val formattedTime: String = "",
    val formattedDate: String = ""
)

data class ParentHabitCheck(
    val habitName: String,
    val isDone: Boolean
)

enum class ChildReturnStatus {
    NOT_IN_SCHOOL_TODAY,          // Hari libur / tidak hadir / izin / sakit
    SAFE_AT_SCHOOL,               // Jam sekolah & berada di dalam lingkungan sekolah
    ALREADY_CHECKED_OUT,          // Sudah tap pulang (dalam perjalanan / sudah sampai di rumah)
    OVERDUE_IN_SCHOOL,            // Lewat jam pulang tapi masih di sekolah (misal ekskul / les)
    OVERDUE_OUTSIDE_UNVERIFIED,   // ⚠️ PERHATIAN: Lewat jam pulang, belum tap pulang, dan di luar sekolah
    OUTSIDE_SCHOOL_HOURS,         // Di luar sekolah sebelum jam pulang
    DEVICE_DISCONNECTED           // HP offline / tidak terhubung
}

data class ChildActivityState(
    val hasDevice: Boolean = false,
    val deviceId: String = "",
    val isOnline: Boolean = false,
    val deviceStatus: String = "Offline",
    val batteryLevel: Int? = null,
    val isGpsActive: Boolean = true,
    val isInternetActive: Boolean = true,
    val isInsideSchoolZone: Boolean? = null,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val lastSeenAt: Long = 0L,
    val statusMessage: String = "",
    val schoolStartHour: String = "07:00",
    val schoolEndHour: String = "14:00",
    val prayerDzuhurHour: String = "12:00",
    val prayerTitle: String = "Sholat Dzuhur Berjamaah",
    val schoolLocationLat: Double? = null,
    val schoolLocationLng: Double? = null,
    val schoolRadiusMeters: Double? = null,
    val returnStatus: ChildReturnStatus = ChildReturnStatus.SAFE_AT_SCHOOL,
    val returnStatusTitle: String = "Memuat aktivitas...",
    val returnStatusDesc: String = "",
    val overdueMinutes: Long = 0L,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val todayAttendanceStatus: String = "Belum Presensi",
    val studentPhone: String = "",
    val schoolPhone: String = "",
    val homeroomTeacherName: String = "",
    val homeroomTeacherPhone: String = "",
    val trustScore: Int? = null,
    val complianceStatus: String? = null,
    val isProtectionActive: Boolean = false,
    val isAccessibilityEnabled: Boolean = false,
    val isDeviceAdminEnabled: Boolean = false,
    val brandOEM: String = "",
    val modelOEM: String = "",
    val appVersionCode: Long? = null,
    val fcmToken: String = "",
    val boundDeviceId: String = "",
    val lastFindDeviceCommandId: String = "",
    val isAlarmActive: Boolean = false,
    val isFindDeviceLoading: Boolean = false,
    val findDeviceFeedback: String? = null
)

data class ParentDashboardUiState(
    val isLoading: Boolean = true,
    val activeChild: LinkedChild? = null,
    val linkedChildren: List<LinkedChild> = emptyList(),
    val todayAttendance: Attendance? = null,
    val isTodayHoliday: Boolean = false,
    val holidayDescription: String? = null,
    val monthlySummary: MonthlyAttendanceSummary? = null,
    val attendanceHistory: List<Attendance> = emptyList(),
    val todayPrayerStatus: String = "Belum Sholat",
    val prayerHistory: List<ParentDailyPrayer> = emptyList(),
    val todayHabitsCount: Int = 0,
    val todayHabitsList: List<ParentHabitCheck> = emptyList(),
    val totalDisciplinePoints: Int = 0,
    val disciplineRecords: List<DisciplineRecord> = emptyList(),
    val homeroomTeacherName: String = "",
    val homeroomTeacherPhone: String = "",
    val childActivity: ChildActivityState = ChildActivityState(),
    val errorMessage: String? = null
)

class ParentDashboardViewModel(application: Application) : AndroidViewModel(application) {

    private val db = FirebaseDatabase.getInstance()
    private val prefs = SecurePreferences.getSessionPrefs(application)

    private val _uiState = MutableStateFlow(ParentDashboardUiState())
    val uiState: StateFlow<ParentDashboardUiState> = _uiState.asStateFlow()

    private var attendanceListeners = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()
    private var prayerListeners = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()
    private val prayerLogsBySource = mutableMapOf<String, List<ParentDailyPrayer>>()
    private var habitListeners = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()
    private val habitsTodayBySource = mutableMapOf<String, List<Boolean>>()
    private var disciplineListener: Pair<com.google.firebase.database.Query, ValueEventListener>? = null
    private var deviceListener: Pair<com.google.firebase.database.Query, ValueEventListener>? = null
    private var teacherListener: Pair<com.google.firebase.database.Query, ValueEventListener>? = null

    private var schoolStartHourCached: String = "07:00"
    private var schoolEndHourCached: String = "14:00"
    private var prayerDzuhurHourCached: String = "12:00"
    private var prayerTitleCached: String = "Sholat Dzuhur Berjamaah"
    private var cachedSchedules: Map<Int, DayScheduleRule> = emptyMap()
    private var cachedHolidays: List<HolidayRule> = emptyList()
    private var schoolSettingsListeners = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()

    private var schoolLatCached: Double? = null
    private var schoolLngCached: Double? = null
    private var schoolRadCached: Double? = null
    private var schoolPhoneCached: String = ""
    private var lastDeviceSnapshot: DataSnapshot? = null
    private var studentPhoneCached: String = ""
    private var boundDeviceIdCached: String = ""
    private var rawActiveDevicesSnapshot: DataSnapshot? = null
    private var isHolidayCached: Boolean = false
    private var holidayDescCached: String? = null
    private var rawTeachersSnapshot: DataSnapshot? = null
    private var homeroomTeacherNameCached: String = ""
    private var homeroomTeacherPhoneCached: String = ""

    private fun resolveHomeroomTeacher() {
        val snapshot = rawTeachersSnapshot ?: return
        val childClass = _uiState.value.activeChild?.className.orEmpty()
        var foundName = ""
        var foundPhone = ""

        if (snapshot.exists() && childClass.isNotBlank()) {
            for (tSnap in snapshot.children) {
                val status = tSnap.child("status").getValue(String::class.java).orEmpty()
                if (status.equals("Nonaktif", ignoreCase = true) || status.equals("Inactive", ignoreCase = true)) {
                    continue
                }

                val tClass = tSnap.child("class").getValue(String::class.java)
                    ?: tSnap.child("kelas").getValue(String::class.java)
                    ?: tSnap.child("className").getValue(String::class.java)
                    ?: tSnap.child("homeroomClass").getValue(String::class.java)
                    ?: ""

                if (tClass.isNotBlank() && (matchesHomeroomClass(childClass, tClass) || tClass.trim().equals(childClass.trim(), ignoreCase = true))) {
                    foundName = tSnap.child("name").getValue(String::class.java)
                        ?: tSnap.child("nama").getValue(String::class.java)
                        ?: ""
                    foundPhone = tSnap.child("phone").getValue(String::class.java)
                        ?: tSnap.child("noHp").getValue(String::class.java)
                        ?: tSnap.child("no_hp").getValue(String::class.java)
                        ?: tSnap.child("telepon").getValue(String::class.java)
                        ?: ""
                    break
                }
            }
        }

        homeroomTeacherNameCached = foundName
        homeroomTeacherPhoneCached = foundPhone
        _uiState.value = _uiState.value.copy(
            homeroomTeacherName = foundName,
            homeroomTeacherPhone = foundPhone
        )
        recomputeChildActivity()
    }

    init {
        checkIsTodayHoliday()
        loadSessionAndChildren()
    }

    private fun checkIsTodayHoliday(schoolScheduleSnap: DataSnapshot? = null, holidaysSnap: DataSnapshot? = null) {
        val cal = Calendar.getInstance()
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
        val todayStr = toDateKey(cal)

        var isHol = false
        var desc = ""

        // 1. Cek Libur Kalender / Nasional
        if (holidaysSnap != null && holidaysSnap.exists()) {
            for (h in holidaysSnap.children) {
                val hDate = h.child("date").getValue(String::class.java)?.trim().orEmpty()
                val hKey = h.key?.trim().orEmpty()
                if (hDate == todayStr || hKey == todayStr) {
                    isHol = true
                    desc = h.child("description").getValue(String::class.java)
                        ?: h.child("nama").getValue(String::class.java)
                        ?: "Libur Nasional"
                    break
                }
            }
        }

        // 2. Cek Jadwal Sekolah
        if (!isHol && schoolScheduleSnap != null && schoolScheduleSnap.exists()) {
            val dayRule = schoolScheduleSnap.child(dayOfWeek.toString())
            if (dayRule.exists()) {
                val ruleIsHoliday = dayRule.child("isHoliday").getValue(Boolean::class.java) ?: false
                val active = dayRule.child("active").getValue(Boolean::class.java) ?: true
                if (ruleIsHoliday || !active) {
                    isHol = true
                    desc = "Jadwal Libur Sekolah"
                }
            }
        }

        // 3. Hari Minggu default libur jika tidak ada jadwal khusus
        if (!isHol && dayOfWeek == Calendar.SUNDAY) {
            isHol = true
            desc = "Hari Minggu (Libur Akhir Pekan)"
        }

        isHolidayCached = isHol
        holidayDescCached = if (isHol) desc.ifBlank { "Hari Ini Libur" } else null

        if (isHol) {
            schoolStartHourCached = "Libur"
            schoolEndHourCached = "Libur"
            prayerDzuhurHourCached = "Libur"
        }

        _uiState.value = _uiState.value.copy(
            isTodayHoliday = isHolidayCached,
            holidayDescription = holidayDescCached
        )
    }

    fun loadSessionAndChildren() {
        viewModelScope.launch {
            val sessionStudentId = prefs.getString("user_student_id", "").orEmpty()
            val sessionNisn = prefs.getString("user_nisn", "").orEmpty()
            val sessionName = prefs.getString("user_student_name", "").orEmpty().ifBlank {
                prefs.getString("user_display_name", "").orEmpty().removePrefix("Wali dari ").trim()
            }
            val sessionClass = prefs.getString("user_student_class", "").orEmpty()
            val sessionSchoolId = prefs.getString("user_school_id", "").orEmpty()
            val sessionSchoolName = prefs.getString("user_school_name", "").orEmpty()

            val storedJson = prefs.getString("parent_linked_children_v1", null)
            val childrenList = mutableListOf<LinkedChild>()

            if (!storedJson.isNullOrBlank()) {
                runCatching {
                    val array = JSONArray(storedJson)
                    for (i in 0 until array.length()) {
                        val obj = array.optJSONObject(i) ?: continue
                        childrenList.add(
                            LinkedChild(
                                studentId = obj.optString("studentId"),
                                nisn = obj.optString("nisn"),
                                name = obj.optString("name"),
                                className = obj.optString("className"),
                                schoolId = obj.optString("schoolId"),
                                schoolName = obj.optString("schoolName")
                            )
                        )
                    }
                }
            }

            if (childrenList.isEmpty() && (sessionNisn.isNotBlank() || sessionStudentId.isNotBlank())) {
                val initialChild = LinkedChild(
                    studentId = sessionStudentId.ifBlank { sessionNisn },
                    nisn = sessionNisn,
                    name = sessionName.ifBlank { "Siswa" },
                    className = sessionClass,
                    schoolId = sessionSchoolId,
                    schoolName = sessionSchoolName
                )
                childrenList.add(initialChild)
                saveLinkedChildrenToPrefs(childrenList)
            }

            val active = childrenList.firstOrNull {
                it.studentId == sessionStudentId || it.nisn == sessionNisn
            } ?: childrenList.firstOrNull()

            _uiState.value = _uiState.value.copy(
                activeChild = active,
                linkedChildren = childrenList,
                isLoading = active != null
            )

            if (active != null) {
                attachChildDataListeners(active)
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun switchActiveChild(child: LinkedChild) {
        if (_uiState.value.activeChild?.studentId == child.studentId &&
            _uiState.value.activeChild?.nisn == child.nisn) {
            return
        }
        detachAllListeners()
        boundDeviceIdCached = ""
        lastDeviceSnapshot = null
        rawActiveDevicesSnapshot = null
        rawTeachersSnapshot = null
        homeroomTeacherNameCached = ""
        homeroomTeacherPhoneCached = ""
        habitsTodayBySource.clear()

        // Update active session in prefs so other features align
        prefs.edit().apply {
            putString("user_student_id", child.studentId)
            putString("user_nisn", child.nisn)
            putString("user_student_name", child.name)
            putString("user_student_class", child.className)
            putString("user_school_id", child.schoolId)
            putString("user_school_name", child.schoolName)
            apply()
        }

        _uiState.value = _uiState.value.copy(
            activeChild = child,
            isLoading = true,
            todayAttendance = null,
            monthlySummary = null,
            attendanceHistory = emptyList(),
            todayPrayerStatus = "Memuat...",
            prayerHistory = emptyList(),
            todayHabitsCount = 0,
            todayHabitsList = emptyList(),
            totalDisciplinePoints = 0,
            disciplineRecords = emptyList(),
            homeroomTeacherName = "",
            homeroomTeacherPhone = ""
        )

        attachChildDataListeners(child)
    }

    fun addLinkedChild(
        schoolIdOrNpsn: String,
        nisnInput: String,
        onResult: (Boolean, String) -> Unit
    ) {
        val rawNpsn = schoolIdOrNpsn.trim().lowercase()
        val rawNisn = nisnInput.trim()

        if (rawNpsn.isBlank() || rawNisn.isBlank()) {
            onResult(false, "NPSN Sekolah dan NISN Siswa tidak boleh kosong.")
            return
        }

        val rootRef = db.reference
        fun lookupChildInSchool(resolvedSchoolId: String, schoolName: String) {
            val studentPath = "gas/schools/$resolvedSchoolId/students"
            val masterRef = rootRef.child(studentPath)

            fun handleSnapshot(snap: DataSnapshot) {
                val studentId = snap.key ?: rawNisn
                val name = snap.child("name").getValue(String::class.java)
                    ?: snap.child("nama").getValue(String::class.java)
                    ?: "Siswa"
                val className = snap.child("class").getValue(String::class.java)
                    ?: snap.child("kelas").getValue(String::class.java)
                    ?: snap.child("className").getValue(String::class.java)
                    ?: ""
                val nisnValue = snap.child("nisn").getValue(String::class.java) ?: rawNisn

                val newChild = LinkedChild(
                    studentId = studentId,
                    nisn = nisnValue,
                    name = name,
                    className = className,
                    schoolId = resolvedSchoolId,
                    schoolName = schoolName
                )

                val current = _uiState.value.linkedChildren.toMutableList()
                val existingIndex = current.indexOfFirst { it.nisn == newChild.nisn || it.studentId == newChild.studentId }
                if (existingIndex >= 0) {
                    current[existingIndex] = newChild
                } else {
                    current.add(newChild)
                }

                saveLinkedChildrenToPrefs(current)
                _uiState.value = _uiState.value.copy(linkedChildren = current)
                switchActiveChild(newChild)
                onResult(true, "Berhasil menghubungkan ananda $name.")
            }

            masterRef.child(rawNisn).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        handleSnapshot(snapshot)
                    } else {
                        masterRef.orderByChild("nisn").equalTo(rawNisn).addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(nisnSnap: DataSnapshot) {
                                val match = nisnSnap.children.firstOrNull()
                                if (match != null) {
                                    handleSnapshot(match)
                                } else {
                                    val credNum = rawNisn.toLongOrNull()
                                    if (credNum != null) {
                                        masterRef.orderByChild("nisn").equalTo(credNum.toDouble()).addListenerForSingleValueEvent(object : ValueEventListener {
                                            override fun onDataChange(numSnap: DataSnapshot) {
                                                val numMatch = numSnap.children.firstOrNull()
                                                if (numMatch != null) {
                                                    handleSnapshot(numMatch)
                                                } else {
                                                    onResult(false, "Data siswa dengan NISN $rawNisn tidak ditemukan.")
                                                }
                                            }
                                            override fun onCancelled(error: DatabaseError) {
                                                onResult(false, "Gagal membaca data: ${error.message}")
                                            }
                                        })
                                    } else {
                                        onResult(false, "Data siswa dengan NISN $rawNisn tidak ditemukan di sekolah ini.")
                                    }
                                }
                            }
                            override fun onCancelled(error: DatabaseError) {
                                onResult(false, "Gagal membaca data: ${error.message}")
                            }
                        })
                    }
                }
                override fun onCancelled(error: DatabaseError) {
                    onResult(false, "Gagal membaca data siswa: ${error.message}")
                }
            })
        }

        rootRef.child("schools").child(rawNpsn).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    val resolvedId = snapshot.child("schoolId").getValue(String::class.java)?.ifBlank { snapshot.key } ?: rawNpsn
                    val sName = snapshot.child("name").getValue(String::class.java)?.ifBlank { snapshot.child("schoolName").getValue(String::class.java) } ?: "Sekolah"
                    lookupChildInSchool(resolvedId, sName)
                } else {
                    rootRef.child("schools").orderByChild("npsn").equalTo(rawNpsn).addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(npsnSnap: DataSnapshot) {
                            val match = npsnSnap.children.firstOrNull()
                            if (match != null) {
                                val resolvedId = match.child("schoolId").getValue(String::class.java)?.ifBlank { match.key } ?: rawNpsn
                                val sName = match.child("name").getValue(String::class.java)?.ifBlank { match.child("schoolName").getValue(String::class.java) } ?: "Sekolah"
                                lookupChildInSchool(resolvedId, sName)
                            } else {
                                lookupChildInSchool(rawNpsn, "Sekolah")
                            }
                        }
                        override fun onCancelled(error: DatabaseError) {
                            lookupChildInSchool(rawNpsn, "Sekolah")
                        }
                    })
                }
            }
            override fun onCancelled(error: DatabaseError) {
                lookupChildInSchool(rawNpsn, "Sekolah")
            }
        })
    }

    private fun saveLinkedChildrenToPrefs(list: List<LinkedChild>) {
        runCatching {
            val array = JSONArray()
            list.forEach { child ->
                val obj = JSONObject().apply {
                    put("studentId", child.studentId)
                    put("nisn", child.nisn)
                    put("name", child.name)
                    put("className", child.className)
                    put("schoolId", child.schoolId)
                    put("schoolName", child.schoolName)
                }
                array.put(obj)
            }
            prefs.edit().putString("parent_linked_children_v1", array.toString()).apply()
        }
    }

    private fun attachChildDataListeners(child: LinkedChild) {
        val schoolId = normalizeScope(child.schoolId)
        val studentId = child.studentId.trim()
        val nisn = child.nisn.trim()

        val aliases = linkedSetOf(studentId, nisn).filter { it.isNotBlank() }

        // 1. Attendance Listeners
        val historyBySource = mutableMapOf<String, List<Attendance>>()
        fun recomputeAttendance() {
            val merged = linkedMapOf<String, Attendance>()
            historyBySource.values.flatten().forEach { item ->
                val existing = merged[item.id]
                if (existing == null || item.date >= existing.date) {
                    merged[item.id] = item
                }
            }
            val history = merged.values.sortedByDescending { it.date }
            val todayStr = toDateKey(Calendar.getInstance())
            val todayAtt = history.firstOrNull { toDateKey(it.date) == todayStr }
            val monthly = calculateMonthlySummary(history)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                todayAttendance = todayAtt,
                monthlySummary = monthly,
                attendanceHistory = history
            )
            recomputeChildActivity()
        }

        val variants = getSchoolIdVariants(child.schoolId).ifEmpty { listOf(schoolId) }
        variants.forEach { sVar ->
            aliases.forEach { alias ->
                val q1 = db.getReference("attendance_by_school").child(sVar)
                    .orderByChild("studentId")
                    .equalTo(alias)
                val l1 = object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        historyBySource["scoped_sid_${sVar}_$alias"] = parseAttendanceList(snapshot)
                        recomputeAttendance()
                    }
                    override fun onCancelled(error: DatabaseError) {}
                }
                q1.addValueEventListener(l1)
                attendanceListeners.add(q1 to l1)

                val q2 = db.getReference("attendance_by_school").child(sVar)
                    .orderByChild("nisn")
                    .equalTo(alias)
                val l2 = object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        historyBySource["scoped_nisn_${sVar}_$alias"] = parseAttendanceList(snapshot)
                        recomputeAttendance()
                    }
                    override fun onCancelled(error: DatabaseError) {}
                }
                q2.addValueEventListener(l2)
                attendanceListeners.add(q2 to l2)
            }
        }

        // 2. Prayer Attendance Listener (Multi-variant realtime listener)
        prayerListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        prayerListeners.clear()
        prayerLogsBySource.clear()

        val prayerTimeFormat = SimpleDateFormat("HH:mm 'WIB'", Locale("id", "ID")).apply {
            timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        }
        val prayerDateFormat = SimpleDateFormat("EEEE, d MMM yyyy", Locale("id", "ID")).apply {
            timeZone = TimeZone.getTimeZone("Asia/Jakarta")
        }

        fun recomputeCombinedPrayers() {
            val todayStr = toDateKey(Calendar.getInstance())
            val combined = prayerLogsBySource.values.flatten()
                .distinctBy { "${it.dateStr}_${it.prayerType}_${it.timestamp}" }
                .sortedByDescending { it.timestamp }

            val todayLog = combined.firstOrNull { it.dateStr == todayStr }
            val isPrayerLibur = isHolidayCached || prayerDzuhurHourCached.equals("Libur", ignoreCase = true) || prayerDzuhurHourCached.equals("Tidak ada jadwal sholat", ignoreCase = true)
            val finalTodayStatus = when {
                todayLog != null -> todayLog.status
                isPrayerLibur -> "Tidak ada jadwal sholat"
                else -> "Belum Sholat"
            }

            _uiState.value = _uiState.value.copy(
                todayPrayerStatus = finalTodayStatus,
                prayerHistory = combined
            )
        }

        variants.forEach { sVar ->
            val prayerQuery = db.getReference("prayer_attendance_by_school").child(sVar)
            val pListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val logs = mutableListOf<ParentDailyPrayer>()
                    val todayStr = toDateKey(Calendar.getInstance())
                    val yesterdayCal = Calendar.getInstance().apply { add(Calendar.DATE, -1) }
                    val yesterdayStr = toDateKey(yesterdayCal)

                    for (childSnap in snapshot.children) {
                        val sId = childSnap.child("studentId").getValue(String::class.java)?.trim().orEmpty()
                        val nVal = childSnap.child("nisn").getValue(String::class.java)?.trim().orEmpty()
                        if (aliases.contains(sId) || aliases.contains(nVal)) {
                            val time = childSnap.child("date").getValue(Long::class.java)
                                ?: childSnap.child("createdAt").getValue(Long::class.java)
                                ?: 0L
                            val rawStatus = childSnap.child("status").getValue(String::class.java)?.trim().orEmpty()
                            val dateStr = if (time > 0) toDateKey(time) else ""
                            val pType = childSnap.child("prayerType").getValue(String::class.java)?.trim().orEmpty().ifBlank { "Dzuhur" }

                            val statusDisplay = when (rawStatus.uppercase()) {
                                "PRAY", "PRAYED", "SUDAH", "HADIR", "SUDAH SHOLAT", "SUDAH PRESENSI" -> "Sudah Sholat"
                                "NOT_PRAYED", "TIDAK", "ALPA", "ALPHA", "TIDAK SHOLAT", "BELUM", "BELUM SHOLAT" -> "Tidak Sholat"
                                "PERMIT", "IZIN" -> "Izin"
                                "SICK", "SAKIT" -> "Sakit"
                                "HALANGAN", "BERHALANGAN" -> "Berhalangan (Haid)"
                                else -> if (rawStatus.isNotBlank()) rawStatus else "Sudah Sholat"
                            }

                            val formattedTime = if (time > 0) prayerTimeFormat.format(Date(time)) else ""
                            val friendlyDate = when (dateStr) {
                                todayStr -> if (formattedTime.isNotBlank()) "Hari Ini, $formattedTime" else "Hari Ini"
                                yesterdayStr -> if (formattedTime.isNotBlank()) "Kemarin, $formattedTime" else "Kemarin"
                                else -> if (time > 0) {
                                    "${prayerDateFormat.format(Date(time))} • $formattedTime"
                                } else dateStr
                            }

                            logs.add(
                                ParentDailyPrayer(
                                    dateStr = dateStr,
                                    prayerType = pType,
                                    status = statusDisplay,
                                    timestamp = time,
                                    formattedTime = formattedTime,
                                    formattedDate = friendlyDate
                                )
                            )
                        }
                    }

                    prayerLogsBySource[sVar] = logs
                    recomputeCombinedPrayers()
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            prayerQuery.addValueEventListener(pListener)
            prayerListeners.add(prayerQuery to pListener)
        }

        // 3. 7 KAIH Habits Listener (Multi-source realtime listener: legacy + scoped by school)
        habitListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        habitListeners.clear()
        habitsTodayBySource.clear()

        val defaultHabits = listOf(
            "Bangun Pagi & Rapikan Tempat Tidur",
            "Ibadah Tepat Waktu",
            "Olahraga / Peregangan Tubuh",
            "Makan Makanan Bergizi Seimbang",
            "Gemar Membaca Buku (Literasi)",
            "Peduli Lingkungan & Membuang Sampah",
            "Istirahat & Tidur Cepat"
        )

        fun recomputeHabits() {
            val mergedHabits = MutableList(7) { false }
            habitsTodayBySource.values.forEach { sourceList ->
                sourceList.forEachIndexed { i, isDone ->
                    if (isDone) mergedHabits[i] = true
                }
            }

            var doneCount = 0
            val checks = defaultHabits.mapIndexed { index, habitName ->
                val isDone = mergedHabits[index]
                if (isDone) doneCount++
                ParentHabitCheck(habitName = habitName, isDone = isDone)
            }

            _uiState.value = _uiState.value.copy(
                todayHabitsCount = doneCount,
                todayHabitsList = checks
            )
        }

        fun parseHabitsFromSnapshot(snapshot: DataSnapshot): List<Boolean> {
            val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Jakarta"))
            val todayKey = toDateKey(cal)
            val todaySnap = if (snapshot.hasChild(todayKey)) snapshot.child(todayKey) else snapshot
            val habitsNode = todaySnap.child("habits")

            return (1..7).map { idx ->
                val hKey = "habit$idx"
                val hKeyAlt = "habit_$idx"
                val hKeyShort = "h$idx"
                val habitName = defaultHabits.getOrNull(idx - 1).orEmpty()

                habitsNode.child(hKey).getValue(Boolean::class.java) == true ||
                habitsNode.child(hKeyAlt).getValue(Boolean::class.java) == true ||
                habitsNode.child(hKeyShort).getValue(Boolean::class.java) == true ||
                todaySnap.child(hKey).getValue(Boolean::class.java) == true ||
                todaySnap.child(hKeyAlt).getValue(Boolean::class.java) == true ||
                todaySnap.child(hKeyShort).getValue(Boolean::class.java) == true ||
                (habitName.isNotBlank() && (todaySnap.child(habitName).getValue(Boolean::class.java) == true || habitsNode.child(habitName).getValue(Boolean::class.java) == true))
            }
        }

        aliases.forEach { alias ->
            // Path 1: Global seven_habits_logs/$alias
            val globalHabitQuery = db.getReference("seven_habits_logs").child(alias)
            val gListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    habitsTodayBySource["global_$alias"] = parseHabitsFromSnapshot(snapshot)
                    recomputeHabits()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            globalHabitQuery.addValueEventListener(gListener)
            habitListeners.add(globalHabitQuery to gListener)

            // Path 2: Scoped seven_habits_logs_by_school/$sVar/$alias
            variants.forEach { sVar ->
                val scopedHabitQuery = db.getReference("seven_habits_logs_by_school").child(sVar).child(alias)
                val sListener = object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        habitsTodayBySource["scoped_${sVar}_$alias"] = parseHabitsFromSnapshot(snapshot)
                        recomputeHabits()
                    }
                    override fun onCancelled(error: DatabaseError) {}
                }
                scopedHabitQuery.addValueEventListener(sListener)
                habitListeners.add(scopedHabitQuery to sListener)
            }
        }

        // 4. Discipline Records Listener
        val discQuery = db.getReference("discipline_records").orderByChild("studentId").equalTo(studentId.ifBlank { nisn })
        val dListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val records = mutableListOf<DisciplineRecord>()
                var netPoints = 0

                for (childSnap in snapshot.children) {
                    val rec = childSnap.getValue(DisciplineRecord::class.java)?.copy(id = childSnap.key ?: "")
                    if (rec != null) {
                        records.add(rec)
                        if (rec.status.equals("APPROVED", ignoreCase = true)) {
                            netPoints += rec.points
                        }
                    }
                }

                _uiState.value = _uiState.value.copy(
                    totalDisciplinePoints = netPoints,
                    disciplineRecords = records.sortedByDescending { it.date }
                )
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        discQuery.addValueEventListener(dListener)
        disciplineListener = discQuery to dListener

        // 5. Active Device & Realtime Child Activity Telemetry
        if (schoolId.isNotBlank()) {
            attachSchoolSettingsListeners(schoolId)

            // Load school rules, geofence, and contact for context
            db.getReference("schools").child(schoolId).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snap: DataSnapshot) {
                    val lat = snap.child("latitude").getValue(Double::class.java)
                    val lng = snap.child("longitude").getValue(Double::class.java)
                    val rad = snap.child("radius").getValue(Double::class.java)
                    val phone = snap.child("phone").getValue(String::class.java)?.ifBlank {
                        snap.child("contact").getValue(String::class.java)
                    }.orEmpty()

                    val dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
                    val schedSnap = snap.child("schedule")
                    val weekdaysSnap = schedSnap.child("weekdays")
                    val holSnap = snap.child("holidays")

                    // Fallback to schools/$schoolId/schedule only if school_settings is not populated yet
                    if (cachedSchedules.isEmpty()) {
                        checkIsTodayHoliday(schedSnap, holSnap)

                        val dayMapping = mapOf(
                            Calendar.SUNDAY to "sun",
                            Calendar.MONDAY to "mon",
                            Calendar.TUESDAY to "tue",
                            Calendar.WEDNESDAY to "wed",
                            Calendar.THURSDAY to "thu",
                            Calendar.FRIDAY to "fri",
                            Calendar.SATURDAY to "sat"
                        )
                        val dayKey = dayMapping[dayOfWeek]
                        if (weekdaysSnap.exists() && dayKey != null) {
                            val dayRule = weekdaysSnap.child(dayKey)
                            val start = dayRule.child("start").getValue(String::class.java)
                            val end = dayRule.child("end").getValue(String::class.java)
                            val enabled = dayRule.child("enabled").getValue(Boolean::class.java) ?: true
                            if (enabled && !isHolidayCached) {
                                if (!start.isNullOrBlank()) schoolStartHourCached = start
                                if (!end.isNullOrBlank()) schoolEndHourCached = end
                            }
                        } else if (schedSnap.exists()) {
                            val dayRule = schedSnap.child(dayOfWeek.toString())
                            val isHoliday = dayRule.child("isHoliday").getValue(Boolean::class.java) ?: false
                            val active = dayRule.child("active").getValue(Boolean::class.java) ?: true
                            if (!isHoliday && active && !isHolidayCached) {
                                val start = dayRule.child("startTime").getValue(String::class.java)
                                val end = dayRule.child("endTime").getValue(String::class.java)
                                if (!start.isNullOrBlank()) schoolStartHourCached = start
                                if (!end.isNullOrBlank()) schoolEndHourCached = end
                            }
                        }

                        if (isHolidayCached) {
                            schoolStartHourCached = "Libur"
                            schoolEndHourCached = "Libur"
                            prayerDzuhurHourCached = "Libur"
                        }
                    }

                    schoolLatCached = lat
                    schoolLngCached = lng
                    schoolRadCached = rad
                    schoolPhoneCached = phone
                    recomputeChildActivity()
                }
                override fun onCancelled(error: DatabaseError) {}
            })

            fun pickBestDeviceSnapshot() {
                val snapshot = rawActiveDevicesSnapshot ?: return
                var bestSnap: DataSnapshot? = null
                var bestScore = -1
                var bestLastSeen = 0L

                for (childSnap in snapshot.children) {
                    val dNisn = childSnap.child("nisn").getValue(String::class.java)?.trim().orEmpty()
                    val dStudentId = childSnap.child("studentId").getValue(String::class.java)?.trim().orEmpty()
                    val dKey = childSnap.key?.trim().orEmpty()
                    val dDeviceId = childSnap.child("deviceId").getValue(String::class.java)?.trim().orEmpty()

                    val isKeyBound = boundDeviceIdCached.isNotBlank() && dKey.equals(boundDeviceIdCached, ignoreCase = true)
                    val isDeviceFieldBound = boundDeviceIdCached.isNotBlank() && dDeviceId.equals(boundDeviceIdCached, ignoreCase = true)
                    val isAliasMatch = aliases.contains(dNisn) || aliases.contains(dStudentId) || aliases.contains(dKey)

                    if (isKeyBound || isDeviceFieldBound || isAliasMatch) {
                        var score = 0
                        if (isKeyBound || isDeviceFieldBound) score += 100
                        if (childSnap.hasChild("battery")) score += 25
                        if (childSnap.hasChild("complianceStatus")) score += 20
                        if (childSnap.hasChild("isProtectionActive")) score += 15
                        if (childSnap.hasChild("latitude") || childSnap.hasChild("longitude")) score += 20
                        if (childSnap.hasChild("brandOEM") || childSnap.hasChild("modelOEM")) score += 10
                        if (childSnap.hasChild("trustScore")) score += 10
                        if (childSnap.child("deviceStatus").getValue(String::class.java)?.equals("Online", ignoreCase = true) == true) score += 5

                        val lastSeen = childSnap.child("lastSeenAt").getValue(Long::class.java)
                            ?: childSnap.child("lastUpdated").getValue(Long::class.java)
                            ?: 0L

                        if (score > bestScore || (score == bestScore && lastSeen > bestLastSeen)) {
                            bestScore = score
                            bestLastSeen = lastSeen
                            bestSnap = childSnap
                        }
                    }
                }

                lastDeviceSnapshot = bestSnap
                recomputeChildActivity()
            }

            // Load student profile (phone, class, deviceId binding)
            db.getReference("gas/schools/$schoolId/students").child(studentId.ifBlank { nisn })
                .addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snap: DataSnapshot) {
                        val phone = snap.child("phone").getValue(String::class.java)
                            ?: snap.child("noHp").getValue(String::class.java)
                            ?: snap.child("telepon").getValue(String::class.java)
                            ?: ""
                        studentPhoneCached = phone

                        val freshClass = snap.child("class").getValue(String::class.java)
                            ?: snap.child("kelas").getValue(String::class.java)
                            ?: snap.child("className").getValue(String::class.java)
                        if (!freshClass.isNullOrBlank() && freshClass != _uiState.value.activeChild?.className) {
                            _uiState.value = _uiState.value.copy(
                                activeChild = _uiState.value.activeChild?.copy(className = freshClass)
                            )
                            resolveHomeroomTeacher()
                        }

                        val bDevId = snap.child("deviceId").getValue(String::class.java)
                            ?: snap.child("device").getValue(String::class.java)
                            ?: snap.child("gasDeviceId").getValue(String::class.java)
                            ?: ""
                        if (bDevId.isNotBlank()) {
                            boundDeviceIdCached = bDevId.trim()
                            pickBestDeviceSnapshot()
                        } else {
                            recomputeChildActivity()
                        }
                    }
                    override fun onCancelled(error: DatabaseError) {}
                })

            // 6. Homeroom Teacher Realtime Listener
            teacherListener?.let { (query, listener) -> query.removeEventListener(listener) }
            val teachersRef = db.getReference("gas/schools/$schoolId/teachers")
            val tListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    rawTeachersSnapshot = snapshot
                    resolveHomeroomTeacher()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            teachersRef.addValueEventListener(tListener)
            teacherListener = teachersRef to tListener

            val deviceQuery = db.getReference("active_devices").child(schoolId)
            val devListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    rawActiveDevicesSnapshot = snapshot
                    pickBestDeviceSnapshot()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            deviceQuery.addValueEventListener(devListener)
            deviceListener = deviceQuery to devListener
        }
    }

    private fun attachSchoolSettingsListeners(schoolId: String) {
        if (schoolId.isBlank()) return

        val variants = getSchoolIdVariants(schoolId).ifEmpty { listOf(schoolId) }

        variants.forEach { variant ->
            // 1. Listen to school_settings/$variant/attendance
            val attSettingsRef = db.getReference("school_settings").child(variant).child("attendance")
            val attListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) return

                    val schedulesSnap = snapshot.child("schedules")
                    val holidaysSnap = snapshot.child("holidays")
                    val locSnap = snapshot.child("school_location")

                    if (schedulesSnap.exists()) {
                        cachedSchedules = parseScheduleSnapshot(schedulesSnap)
                    }
                    if (holidaysSnap.exists()) {
                        cachedHolidays = parseHolidaySnapshot(holidaysSnap)
                    }
                    if (locSnap.exists()) {
                        val lat = locSnap.child("latitude").getValue(Double::class.java)
                        val lng = locSnap.child("longitude").getValue(Double::class.java)
                        val rad = locSnap.child("radius").getValue(Double::class.java)
                        if (lat != null && lng != null) {
                            schoolLatCached = lat
                            schoolLngCached = lng
                            schoolRadCached = rad ?: 50.0
                        }
                    }

                    val cal = Calendar.getInstance()
                    val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
                    val todayStr = toDateKey(cal)

                    var isHol = false
                    var holDesc = ""

                    val holRule = findHoliday(cachedHolidays, todayStr)
                    if (holRule != null) {
                        isHol = true
                        holDesc = holRule.description.ifBlank { "Libur Sekolah" }
                    }

                    if (cachedSchedules.isNotEmpty()) {
                        val dayRule = resolveScheduleRule(dayOfWeek, cachedSchedules, "07:00", "14:00")
                        if (dayRule.isHoliday) {
                            isHol = true
                            if (holDesc.isBlank()) {
                                holDesc = if (dayOfWeek == Calendar.SUNDAY) "Hari Minggu (Libur Akhir Pekan)" else "Hari Libur Sekolah"
                            }
                        } else {
                            if (!isHol) {
                                schoolStartHourCached = dayRule.startTime
                                schoolEndHourCached = dayRule.endTime
                            }
                        }
                    } else if (dayOfWeek == Calendar.SUNDAY) {
                        isHol = true
                        holDesc = "Hari Minggu (Libur Akhir Pekan)"
                    }

                    isHolidayCached = isHol
                    holidayDescCached = if (isHol) holDesc.ifBlank { "Hari Ini Libur" } else null

                    if (isHol) {
                        schoolStartHourCached = "Libur"
                        schoolEndHourCached = "Libur"
                        prayerDzuhurHourCached = "Libur"
                    }

                    _uiState.value = _uiState.value.copy(
                        isTodayHoliday = isHolidayCached,
                        holidayDescription = holidayDescCached,
                        monthlySummary = calculateMonthlySummary(_uiState.value.attendanceHistory)
                    )
                    recomputeChildActivity()
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            attSettingsRef.addValueEventListener(attListener)
            schoolSettingsListeners.add(attSettingsRef to attListener)

            // 2. Listen to school_settings/$variant/prayer_v2
            val prayerRef = db.getReference("school_settings").child(variant).child("prayer_v2")
            val prayerListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) return

                    val typesSnap = snapshot.child("types")
                    val schedsSnap = snapshot.child("schedules")
                    val adminDayOfWeek = toAdminDayOfWeek(Calendar.getInstance().get(Calendar.DAY_OF_WEEK))

                    var title = "Sholat Dzuhur Berjamaah"
                    var timeWindow = "12:00"

                    val dzuhurSnap = typesSnap.child("DZUHUR")
                    var isDzuhurActiveToday = true
                    if (dzuhurSnap.exists()) {
                        val enabled = dzuhurSnap.child("enabled").getValue(Boolean::class.java) ?: true
                        val start = dzuhurSnap.child("startTime").getValue(String::class.java).orEmpty()
                        val end = dzuhurSnap.child("endTime").getValue(String::class.java).orEmpty()
                        val label = dzuhurSnap.child("label").getValue(String::class.java) ?: "Sholat Dzuhur"
                        val activeDaysList = dzuhurSnap.child("activeDays").children.mapNotNull {
                            it.getValue(Long::class.java)?.toInt() ?: it.getValue(Int::class.java)
                        }
                        isDzuhurActiveToday = if (activeDaysList.isNotEmpty()) activeDaysList.contains(adminDayOfWeek) else true

                        if (enabled && isDzuhurActiveToday) {
                            title = if (label.contains("sholat", ignoreCase = true)) "$label Berjamaah" else "Sholat $label Berjamaah"
                            timeWindow = when {
                                start.isNotBlank() && end.isNotBlank() -> "$start - $end"
                                start.isNotBlank() -> start
                                else -> "12:00"
                            }
                        } else if (!isDzuhurActiveToday) {
                            timeWindow = "Tidak ada jadwal sholat"
                        }
                    }

                    // Check class-specific overrides or special prayers (e.g. Dhuha for class)
                    val activeChild = _uiState.value.activeChild
                    val childClass = activeChild?.className.orEmpty()

                    if (schedsSnap.exists()) {
                        for (s in schedsSnap.children) {
                            val sDay = s.child("dayOfWeek").getValue(Int::class.java)
                                ?: s.child("dayOfWeek").getValue(Long::class.java)?.toInt()
                            val sActive = s.child("active").getValue(Boolean::class.java) ?: true
                            if (sActive && sDay == adminDayOfWeek) {
                                val classIdsSnap = s.child("classIds")
                                var classMatch = false
                                for (c in classIdsSnap.children) {
                                    val cName = c.getValue(String::class.java).orEmpty()
                                    if (matchesHomeroomClass(childClass, cName) || cName.equals(childClass, ignoreCase = true) || cName.contains("class_demo_7")) {
                                        classMatch = true
                                        break
                                    }
                                }
                                if (classMatch) {
                                    val pType = s.child("prayerType").getValue(String::class.java) ?: "DHUHA"
                                    val sStart = s.child("startTime").getValue(String::class.java).orEmpty()
                                    val sEnd = s.child("endTime").getValue(String::class.java).orEmpty()
                                    title = if (pType.equals("DHUHA", ignoreCase = true)) "Sholat Dhuha" else "Sholat $pType"
                                    if (sStart.isNotBlank() && sEnd.isNotBlank()) {
                                        timeWindow = "$sStart - $sEnd"
                                    } else if (sStart.isNotBlank()) {
                                        timeWindow = sStart
                                    }
                                    break
                                }
                            }
                        }
                    }

                    prayerTitleCached = title
                    if (!isHolidayCached) {
                        prayerDzuhurHourCached = timeWindow
                    }
                    val isPrayerLibur = isHolidayCached || prayerDzuhurHourCached.equals("Libur", ignoreCase = true) || prayerDzuhurHourCached.equals("Tidak ada jadwal sholat", ignoreCase = true)
                    val currentStatus = _uiState.value.todayPrayerStatus
                    // Jika jadwal berubah dari nonaktif menjadi aktif, reset status ke "Belum Sholat"
                    val resetToDefault = !isPrayerLibur && (currentStatus == "Tidak ada jadwal sholat" || currentStatus == "Libur")
                    val finalStatus = when {
                        resetToDefault -> "Belum Sholat"
                        currentStatus == "Belum Sholat" && isPrayerLibur -> "Tidak ada jadwal sholat"
                        else -> currentStatus
                    }

                    _uiState.value = _uiState.value.copy(
                        todayPrayerStatus = finalStatus
                    )
                    recomputeChildActivity()
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            prayerRef.addValueEventListener(prayerListener)
            schoolSettingsListeners.add(prayerRef to prayerListener)
        }
    }

    private fun parseAttendanceList(snapshot: DataSnapshot): List<Attendance> {
        return snapshot.children.mapNotNull { child ->
            runCatching {
                val id = child.key ?: ""
                val studentId = child.child("studentId").getValue(String::class.java) ?: ""
                val schoolId = child.child("schoolId").getValue(String::class.java) ?: ""
                val date = child.child("date").getValue(Long::class.java) ?: 0L
                val status = child.child("status").getValue(String::class.java) ?: "ABSENT"
                var rawCheckIn = child.child("checkInTime").getValue(Any::class.java)?.toString().orEmpty()
                if (rawCheckIn.isBlank()) {
                    rawCheckIn = child.child("time").getValue(Any::class.java)?.toString().orEmpty()
                }
                if (rawCheckIn.isBlank() && date > 0 && status.uppercase() in listOf("PRESENT", "LATE", "HADIR", "TERLAMBAT")) {
                    rawCheckIn = date.toString()
                }

                var rawCheckOut = child.child("checkOutTime").getValue(Any::class.java)?.toString()
                if (rawCheckOut.isNullOrBlank()) {
                    rawCheckOut = child.child("outTime").getValue(Any::class.java)?.toString()
                }
                val checkInTime = formatAttendanceTime(rawCheckIn)
                val checkOutTime = rawCheckOut?.let { formatAttendanceTime(it) }
                val checkInMethod = child.child("checkInMethod").getValue(String::class.java) ?: "MANUAL"
                val notes = child.child("notes").getValue(String::class.java)
                val nisn = child.child("nisn").getValue(String::class.java) ?: ""

                Attendance(
                    id = id,
                    studentId = studentId,
                    schoolId = schoolId,
                    date = date,
                    status = status,
                    checkInTime = checkInTime,
                    checkOutTime = checkOutTime,
                    checkInMethod = checkInMethod,
                    notes = notes,
                    nisn = nisn
                )
            }.getOrNull()
        }
    }

    private fun calculateMonthlySummary(history: List<Attendance>): MonthlyAttendanceSummary {
        val calendar = Calendar.getInstance()
        val currentMonth = calendar.get(Calendar.MONTH)
        val currentYear = calendar.get(Calendar.YEAR)

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
            val dayName = formatIndonesianShortDay(calendar.time)
            val dateStr = toDateKey(calendar)

            val isSchoolDay = isValidSchoolDay(calendar, cachedSchedules, cachedHolidays)
            val attendance = latestByDate[dateStr]

            val status = when (attendance?.status?.uppercase()) {
                "PRESENT", "LATE", "HADIR" -> {
                    totalH++
                    "H"
                }
                "SICK", "SAKIT" -> {
                    totalS++
                    "S"
                }
                "PERMIT", "IZIN" -> {
                    totalI++
                    "I"
                }
                "ABSENT", "ALPA" -> {
                    totalA++
                    "A"
                }
                else -> {
                    if (isSchoolDay) {
                        totalA++
                        "A"
                    } else {
                        "-"
                    }
                }
            }
            summaries.add(DailyAttendanceSummary(day, dayName, status, dateStr))
        }

        return MonthlyAttendanceSummary(summaries, totalH, totalS, totalI, totalA)
    }

    private fun recomputeChildActivity() {
        val active = _uiState.value.activeChild ?: return
        val devSnap = lastDeviceSnapshot
        val todayAtt = _uiState.value.todayAttendance

        val hasDev = devSnap != null && devSnap.exists()
        val rawDevStatus = devSnap?.child("deviceStatus")?.getValue(String::class.java).orEmpty()
        val isDevOnline = rawDevStatus.equals("Online", ignoreCase = true)
        val lastSeen = devSnap?.child("lastSeenAt")?.getValue(Long::class.java)
            ?: devSnap?.child("lastUpdated")?.getValue(Long::class.java)
            ?: 0L
        val now = System.currentTimeMillis()
        val isStale = lastSeen > 0 && (now - lastSeen) > (15 * 60 * 1000L)
        val effectiveOnline = isDevOnline && !isStale

        val battery = devSnap?.child("battery")?.getValue(Int::class.java)
            ?: devSnap?.child("battery")?.getValue(Long::class.java)?.toInt()
        val isGps = devSnap?.child("isGpsActive")?.getValue(Boolean::class.java) ?: true
        val isNet = devSnap?.child("isInternetActive")?.getValue(Boolean::class.java) ?: effectiveOnline
        val isInside = devSnap?.child("isInsideZone")?.getValue(Boolean::class.java)
        val lat = devSnap?.child("latitude")?.getValue(Double::class.java) ?: 0.0
        val lng = devSnap?.child("longitude")?.getValue(Double::class.java) ?: 0.0
        val devMsg = devSnap?.child("statusMessage")?.getValue(String::class.java).orEmpty()
        val devId = devSnap?.key ?: ""

        val checkIn = todayAtt?.checkInTime
        val checkOut = todayAtt?.checkOutTime
        val attStatus = todayAtt?.status?.uppercase() ?: "NONE"

        // Parse schoolEndHour (HH:mm)
        val parts = schoolEndHourCached.split(":")
        val endHour = parts.getOrNull(0)?.toIntOrNull() ?: 14
        val endMin = parts.getOrNull(1)?.toIntOrNull() ?: 0
        val endTotalMinutes = endHour * 60 + endMin

        val cal = Calendar.getInstance()
        val curTotalMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        val isPastDismissal = curTotalMinutes >= endTotalMinutes
        val overdueMins = if (isPastDismissal) (curTotalMinutes - endTotalMinutes).toLong() else 0L

        var returnStatus = ChildReturnStatus.SAFE_AT_SCHOOL
        var returnTitle = "Aman di Sekolah"
        var returnDesc = "Ananda terpantau berada di lingkungan sekolah."

        if (attStatus in listOf("SICK", "SAKIT", "PERMIT", "IZIN", "ABSENT", "ALPA")) {
            returnStatus = ChildReturnStatus.NOT_IN_SCHOOL_TODAY
            returnTitle = "Tidak Berada di Sekolah Hari Ini"
            returnDesc = "Presensi hari ini tercatat dengan keterangan: $attStatus."
        } else if (!checkOut.isNullOrBlank()) {
            returnStatus = ChildReturnStatus.ALREADY_CHECKED_OUT
            returnTitle = "Sudah Tap Pulang Sekolah"
            returnDesc = "Ananda telah melakukan presensi pulang pukul $checkOut WIB."
        } else if (todayAtt == null && isHolidayCached) {
            returnStatus = ChildReturnStatus.NOT_IN_SCHOOL_TODAY
            returnTitle = "Hari Ini Libur Sekolah"
            returnDesc = "Hari ini merupakan ${holidayDescCached ?: "hari libur"}. Tidak ada kegiatan belajar mengajar formal di sekolah."
        } else if (todayAtt == null && isPastDismissal) {
            returnStatus = ChildReturnStatus.NOT_IN_SCHOOL_TODAY
            returnTitle = "Tidak Ada Presensi Hari Ini"
            returnDesc = "Belum tercatat adanya presensi masuk ananda pada hari ini."
        } else if (!isPastDismissal) {
            if (isInside == false) {
                returnStatus = ChildReturnStatus.OUTSIDE_SCHOOL_HOURS
                returnTitle = "⚠️ Terdeteksi di Luar Area Sekolah"
                returnDesc = "Jam belajar sekolah belum usai (jadwal pulang: $schoolEndHourCached WIB), namun posisi HP terpantau berada di luar zona sekolah."
            } else {
                returnStatus = ChildReturnStatus.SAFE_AT_SCHOOL
                returnTitle = "Aman Mengikuti KBM di Sekolah"
                returnDesc = "Ananda terpantau aktif di lingkungan sekolah. Jadwal kepulangan resmi pukul $schoolEndHourCached WIB."
            }
        } else {
            // Sudah lewat jam pulang dan belum tap pulang!
            if (isInside == true) {
                returnStatus = ChildReturnStatus.OVERDUE_IN_SCHOOL
                returnTitle = "Masih di Lingkungan Sekolah (+${overdueMins} mnt)"
                returnDesc = "Waktu kepulangan resmi ($schoolEndHourCached WIB) telah lewat $overdueMins menit, namun ananda masih terpantau berada di area sekolah (kemungkinan ada kegiatan ekstrakurikuler, pembinaan, atau tugas kelompok)."
            } else if (isInside == false) {
                returnStatus = ChildReturnStatus.OVERDUE_OUTSIDE_UNVERIFIED
                returnTitle = "⚠️ Perhatian: Di Luar Sekolah & Belum Tap Pulang"
                returnDesc = "Waktu pulang sekolah ($schoolEndHourCached WIB) telah lewat $overdueMins menit. Ananda belum tercatat tap pulang di gerbang sekolah dan posisinya berada di luar zona sekolah."
            } else {
                returnStatus = if (!effectiveOnline) ChildReturnStatus.DEVICE_DISCONNECTED else ChildReturnStatus.OVERDUE_IN_SCHOOL
                returnTitle = "Sudah Melewati Jam Pulang ($schoolEndHourCached WIB)"
                returnDesc = "Belum ada catatan tap kepulangan hari ini (+${overdueMins} menit)."
            }
        }

        if (!effectiveOnline && hasDev && returnStatus != ChildReturnStatus.ALREADY_CHECKED_OUT) {
            if (returnStatus == ChildReturnStatus.OVERDUE_OUTSIDE_UNVERIFIED) {
                returnDesc += " (Catatan: HP Ananda saat ini sedang Offline/Tidak Ada Sinyal)."
            }
        }

        val complianceStatus = devSnap?.child("complianceStatus")?.getValue(String::class.java)
        val isProtection = devSnap?.child("isProtectionActive")?.getValue(Boolean::class.java)
            ?: (complianceStatus?.equals("COMPLIANT", ignoreCase = true) == true)
        val isAccess = devSnap?.child("isAccessibilityActive")?.getValue(Boolean::class.java)
            ?: devSnap?.child("isAccessibilityEnabled")?.getValue(Boolean::class.java)
            ?: isProtection
        val isAdmin = devSnap?.child("isDeviceAdminActive")?.getValue(Boolean::class.java)
            ?: devSnap?.child("isDeviceAdminEnabled")?.getValue(Boolean::class.java)
            ?: isProtection
        val brand = devSnap?.child("brandOEM")?.getValue(String::class.java)
            ?: devSnap?.child("brand")?.getValue(String::class.java).orEmpty()
        val model = devSnap?.child("modelOEM")?.getValue(String::class.java)
            ?: devSnap?.child("model")?.getValue(String::class.java).orEmpty()
        val trust = devSnap?.child("trustScore")?.getValue(Int::class.java)
            ?: devSnap?.child("trustScore")?.getValue(Long::class.java)?.toInt()
        val appVer = devSnap?.child("appVersionCode")?.getValue(Long::class.java)
        val fcmTok = devSnap?.child("fcmToken")?.getValue(String::class.java).orEmpty()
        val lastCmdId = devSnap?.child("lastFindDeviceCommandId")?.getValue(String::class.java).orEmpty()
        val lastReqAt = devSnap?.child("lastFindDeviceRequestedAt")?.getValue(Long::class.java) ?: 0L
        val isAlarmActive = lastCmdId.startsWith("find_device_start") && (now - lastReqAt < 45_000L)

        val previousState = _uiState.value.childActivity
        val activityState = previousState.copy(
            hasDevice = hasDev,
            deviceId = devId,
            isOnline = effectiveOnline,
            deviceStatus = if (effectiveOnline) "Online" else "Offline",
            batteryLevel = battery,
            isGpsActive = isGps,
            isInternetActive = isNet,
            isInsideSchoolZone = isInside,
            latitude = lat,
            longitude = lng,
            lastSeenAt = lastSeen,
            statusMessage = devMsg,
            schoolStartHour = if (isHolidayCached) "Libur" else schoolStartHourCached,
            schoolEndHour = if (isHolidayCached) "Libur" else schoolEndHourCached,
            prayerDzuhurHour = if (isHolidayCached) "Libur" else prayerDzuhurHourCached,
            prayerTitle = if (isHolidayCached) "Hari Libur" else prayerTitleCached,
            schoolLocationLat = schoolLatCached,
            schoolLocationLng = schoolLngCached,
            schoolRadiusMeters = schoolRadCached,
            returnStatus = returnStatus,
            returnStatusTitle = returnTitle,
            returnStatusDesc = returnDesc,
            overdueMinutes = overdueMins,
            checkInTime = checkIn,
            checkOutTime = checkOut,
            todayAttendanceStatus = if (todayAtt != null) attStatus else if (isHolidayCached) "Hari Ini Libur" else "Belum Presensi",
            studentPhone = studentPhoneCached,
            schoolPhone = schoolPhoneCached,
            homeroomTeacherName = homeroomTeacherNameCached,
            homeroomTeacherPhone = homeroomTeacherPhoneCached,
            trustScore = trust,
            complianceStatus = complianceStatus,
            isProtectionActive = isProtection,
            isAccessibilityEnabled = isAccess,
            isDeviceAdminEnabled = isAdmin,
            brandOEM = brand,
            modelOEM = model,
            appVersionCode = appVer,
            fcmToken = fcmTok,
            boundDeviceId = boundDeviceIdCached.ifBlank { devId },
            lastFindDeviceCommandId = lastCmdId,
            isAlarmActive = isAlarmActive || previousState.isAlarmActive
        )

        _uiState.value = _uiState.value.copy(childActivity = activityState)
    }

    fun triggerFindDevice(onComplete: ((Boolean, String) -> Unit)? = null) {
        val active = _uiState.value.activeChild ?: return
        val currentActivity = _uiState.value.childActivity
        val schoolId = normalizeScope(active.schoolId)
        val nisn = active.nisn
        val studentId = active.studentId
        val deviceId = currentActivity.deviceId.ifBlank { currentActivity.boundDeviceId }

        _uiState.value = _uiState.value.copy(
            childActivity = currentActivity.copy(
                isFindDeviceLoading = true,
                findDeviceFeedback = "Mengirim sinyal bunyikan HP..."
            )
        )

        viewModelScope.launch(Dispatchers.IO) {
            val (success, message) = sendFindDeviceRequest(
                action = "find-device",
                schoolId = schoolId,
                nisn = nisn,
                studentId = studentId,
                deviceId = deviceId
            )
            withContext(Dispatchers.Main) {
                _uiState.value = _uiState.value.copy(
                    childActivity = _uiState.value.childActivity.copy(
                        isFindDeviceLoading = false,
                        findDeviceFeedback = message,
                        isAlarmActive = success
                    )
                )
                onComplete?.invoke(success, message)
            }
        }
    }

    fun stopFindDevice(onComplete: ((Boolean, String) -> Unit)? = null) {
        val active = _uiState.value.activeChild ?: return
        val currentActivity = _uiState.value.childActivity
        val schoolId = normalizeScope(active.schoolId)
        val nisn = active.nisn
        val studentId = active.studentId
        val deviceId = currentActivity.deviceId.ifBlank { currentActivity.boundDeviceId }

        _uiState.value = _uiState.value.copy(
            childActivity = currentActivity.copy(
                isFindDeviceLoading = true,
                findDeviceFeedback = "Menghentikan alarm HP..."
            )
        )

        viewModelScope.launch(Dispatchers.IO) {
            val (success, message) = sendFindDeviceRequest(
                action = "stop-find-device",
                schoolId = schoolId,
                nisn = nisn,
                studentId = studentId,
                deviceId = deviceId
            )
            withContext(Dispatchers.Main) {
                _uiState.value = _uiState.value.copy(
                    childActivity = _uiState.value.childActivity.copy(
                        isFindDeviceLoading = false,
                        findDeviceFeedback = message,
                        isAlarmActive = false
                    )
                )
                onComplete?.invoke(success, message)
            }
        }
    }

    private fun sendFindDeviceRequest(
        action: String,
        schoolId: String,
        nisn: String,
        studentId: String,
        deviceId: String
    ): Pair<Boolean, String> {
        return try {
            val url = URL("https://gerbang-aplikasi-sekolah--kompas-5f0b4.asia-southeast1.hosted.app/api/parent/edulock")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            conn.setRequestProperty("Accept", "application/json")
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.doOutput = true

            val payload = JSONObject().apply {
                put("action", action)
                put("schoolId", schoolId)
                put("nisn", nisn)
                put("studentId", studentId)
                if (deviceId.isNotBlank()) {
                    put("deviceId", deviceId)
                }
                put("durationMs", 45000)
            }

            conn.outputStream.use { os ->
                os.write(payload.toString().toByteArray(Charsets.UTF_8))
                os.flush()
            }

            val responseCode = conn.responseCode
            val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
            val responseText = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val json = runCatching { JSONObject(responseText) }.getOrNull()

            val isOk = json?.optBoolean("success") ?: (responseCode in 200..299)
            val msg = json?.optString("message")
                ?: if (isOk) "Perintah berhasil dikirim." else "Gagal menghubungi server ($responseCode)."
            Pair(isOk, msg)
        } catch (e: Exception) {
            Pair(false, "Koneksi gagal: ${e.localizedMessage ?: "Periksa koneksi internet Anda."}")
        }
    }

    private fun detachAllListeners() {
        attendanceListeners.forEach { (query, listener) ->
            query.removeEventListener(listener)
        }
        attendanceListeners.clear()

        prayerListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        prayerListeners.clear()
        prayerLogsBySource.clear()

        teacherListener?.let { (query, listener) -> query.removeEventListener(listener) }
        teacherListener = null

        habitListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        habitListeners.clear()
        habitsTodayBySource.clear()

        disciplineListener?.let { (query, listener) -> query.removeEventListener(listener) }
        disciplineListener = null

        deviceListener?.let { (query, listener) -> query.removeEventListener(listener) }
        deviceListener = null

        schoolSettingsListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        schoolSettingsListeners.clear()
    }

    override fun onCleared() {
        super.onCleared()
        detachAllListeners()
    }
}
