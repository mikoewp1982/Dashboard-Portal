package com.satupintu.mobile.ui.screens.student

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.util.formatIndonesianShortDay
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.text.SimpleDateFormat
import kotlin.concurrent.thread
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

private data class MushollaLocation(val lat: Double, val lng: Double, val radiusMeters: Double)
private data class PrayerHistoryRecord(
    val id: String,
    val studentId: String,
    val nisn: String,
    val schoolId: String,
    val date: Long,
    val status: String
)
private data class DailyPrayerSummary(
    val day: Int,
    val dayName: String,
    val statusCode: String,
    val dateKey: String,
    val submittedAt: Long?
)
private data class MonthlyPrayerSummary(
    val summaries: List<DailyPrayerSummary>,
    val totalPray: Int,
    val totalNotPray: Int,
    val totalPermit: Int,
    val totalHalangan: Int
)

private fun calculateExemptPrayerMonthlySummary(): MonthlyPrayerSummary {
    val workingCalendar = Calendar.getInstance()
    val currentMonth = workingCalendar.get(Calendar.MONTH)
    val currentYear = workingCalendar.get(Calendar.YEAR)
    workingCalendar.set(Calendar.YEAR, currentYear)
    workingCalendar.set(Calendar.MONTH, currentMonth)
    workingCalendar.set(Calendar.DAY_OF_MONTH, 1)

    val daysInMonth = workingCalendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val summaries = (1..daysInMonth).map { day ->
        workingCalendar.set(Calendar.DAY_OF_MONTH, day)
        val dateKey = toYmd(workingCalendar)
        DailyPrayerSummary(
            day = day,
            dayName = formatIndonesianShortDay(workingCalendar.time),
            statusCode = "-",
            dateKey = dateKey,
            submittedAt = null
        )
    }

    return MonthlyPrayerSummary(
        summaries = summaries,
        totalPray = 0,
        totalNotPray = 0,
        totalPermit = 0,
        totalHalangan = 0
    )
}

private fun toYmd(cal: Calendar): String {
    val y = cal.get(Calendar.YEAR)
    val m = cal.get(Calendar.MONTH) + 1
    val d = cal.get(Calendar.DAY_OF_MONTH)
    return "%04d-%02d-%02d".format(y, m, d)
}

private fun haversineMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val r = 6371e3
    val phi1 = Math.toRadians(lat1)
    val phi2 = Math.toRadians(lat2)
    val dPhi = Math.toRadians(lat2 - lat1)
    val dLambda = Math.toRadians(lon2 - lon1)
    val a = sin(dPhi / 2) * sin(dPhi / 2) + cos(phi1) * cos(phi2) * sin(dLambda / 2) * sin(dLambda / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c
}

private fun isNonMuslim(religionRaw: String): Boolean {
    val r = religionRaw.trim().lowercase()
    if (r.isEmpty()) return false
    if (r == "non_islam" || r == "non-islam" || r == "non muslim" || r == "nonmuslim") return true
    if (r.contains("non") && r.contains("islam")) return true
    if (r.contains("kristen") || r.contains("katolik") || r.contains("hindu") || r.contains("buddha") || r.contains("konghucu")) return true
    return false
}

private fun isPrayerEffectiveDay(calendar: Calendar, schedules: Map<String, Boolean>, holidays: Set<String>): Boolean {
    val todayStart = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    val targetStart = calendar.clone() as Calendar
    targetStart.set(Calendar.HOUR_OF_DAY, 0)
    targetStart.set(Calendar.MINUTE, 0)
    targetStart.set(Calendar.SECOND, 0)
    targetStart.set(Calendar.MILLISECOND, 0)
    if (targetStart.timeInMillis > todayStart) return false
    if (calendar.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY) return false
    if (holidays.contains(toYmd(calendar))) return false

    val dayKey = calendar.get(Calendar.DAY_OF_WEEK).toString()
    if (schedules.isEmpty()) return true
    val isHoliday = schedules[dayKey] ?: true
    return !isHoliday
}

private fun mapPrayerStatusToCode(status: String?): String {
    return when (status?.trim()?.uppercase(Locale.ROOT)) {
        "PRAY" -> "S"
        "PERMIT" -> "I"
        "HALANGAN" -> "H"
        "NOT_PRAY" -> "TS"
        else -> "TS"
    }
}

private fun calculatePrayerMonthlySummary(
    history: List<PrayerHistoryRecord>,
    schedules: Map<String, Boolean>,
    holidays: Set<String>
): MonthlyPrayerSummary {
    val workingCalendar = Calendar.getInstance()
    val currentMonth = workingCalendar.get(Calendar.MONTH)
    val currentYear = workingCalendar.get(Calendar.YEAR)
    workingCalendar.set(Calendar.YEAR, currentYear)
    workingCalendar.set(Calendar.MONTH, currentMonth)
    workingCalendar.set(Calendar.DAY_OF_MONTH, 1)

    val daysInMonth = workingCalendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val summaries = mutableListOf<DailyPrayerSummary>()
    var totalPray = 0
    var totalNotPray = 0
    var totalPermit = 0
    var totalHalangan = 0

    val latestByDate = history
        .filter {
            val cal = Calendar.getInstance().apply { timeInMillis = it.date }
            cal.get(Calendar.YEAR) == currentYear && cal.get(Calendar.MONTH) == currentMonth
        }
        .groupBy { toYmd(Calendar.getInstance().apply { timeInMillis = it.date }) }
        .mapValues { (_, records) -> records.maxByOrNull { it.date } }

    for (day in 1..daysInMonth) {
        workingCalendar.set(Calendar.DAY_OF_MONTH, day)
        workingCalendar.set(Calendar.HOUR_OF_DAY, 0)
        workingCalendar.set(Calendar.MINUTE, 0)
        workingCalendar.set(Calendar.SECOND, 0)
        workingCalendar.set(Calendar.MILLISECOND, 0)

        val dateKey = toYmd(workingCalendar)
        val dayName = formatIndonesianShortDay(workingCalendar.time)
        if (!isPrayerEffectiveDay(workingCalendar, schedules, holidays)) {
            summaries += DailyPrayerSummary(
                day = day,
                dayName = dayName,
                statusCode = "-",
                dateKey = dateKey,
                submittedAt = null
            )
            continue
        }

        val latestRecord = latestByDate[dateKey]
        val code = mapPrayerStatusToCode(latestRecord?.status)
        when (code) {
            "S" -> totalPray += 1
            "I" -> totalPermit += 1
            "H" -> totalHalangan += 1
            "TS" -> totalNotPray += 1
        }
        summaries += DailyPrayerSummary(
            day = day,
            dayName = dayName,
            statusCode = code,
            dateKey = dateKey,
            submittedAt = latestRecord?.date
        )
    }

    return MonthlyPrayerSummary(
        summaries = summaries,
        totalPray = totalPray,
        totalNotPray = totalNotPray,
        totalPermit = totalPermit,
        totalHalangan = totalHalangan
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun PrayerScreen(
    studentCredential: String,
    studentId: String,
    schoolId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val db = remember { FirebaseDatabase.getInstance() }

    var resolvedSchoolId by remember { mutableStateOf(schoolId.trim().lowercase()) }
    var religion by remember { mutableStateOf("") }
    var studentName by remember { mutableStateOf("") }
    var studentClass by remember { mutableStateOf("") }
    var studentWriteId by remember(studentId) { mutableStateOf(studentId.trim()) }
    var identityAliases by remember(studentCredential, studentId) {
        mutableStateOf(
            linkedSetOf(studentId.trim(), studentCredential.trim())
                .map { it.trim().lowercase() }
                .filter { it.isNotBlank() }
                .toSet()
        )
    }

    var musholla by remember { mutableStateOf(MushollaLocation(lat = -7.6698, lng = 112.5432, radiusMeters = 25.0)) }
    var schedules by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) } // dayKey -> isHoliday
    var holidays by remember { mutableStateOf<Set<String>>(emptySet()) } // yyyy-mm-dd

    var permissionGranted by remember { mutableStateOf(false) }
    var isChecking by remember { mutableStateOf(false) }
    var coords by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    var distanceMeters by remember { mutableStateOf<Double?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }
    var locationAccuracy by remember { mutableStateOf<Float?>(null) }
    var locationProvider by remember { mutableStateOf<String?>(null) }
    var mockLocationDetected by remember { mutableStateOf(false) }
    var selectedTabIndex by remember { mutableStateOf(0) }
    var prayerHistoryLoading by remember { mutableStateOf(true) }
    var prayerHistoryRaw by remember { mutableStateOf<List<PrayerHistoryRecord>>(emptyList()) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val ok = result.values.all { it }
        permissionGranted = ok
        if (!ok) {
            Toast.makeText(context, "Izin lokasi ditolak. Presensi sholat membutuhkan lokasi.", Toast.LENGTH_LONG).show()
        }
    }

    LaunchedEffect(Unit) {
        val okFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val okCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        permissionGranted = okFine || okCoarse
        if (!permissionGranted) {
            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    DisposableEffect(studentCredential, studentId, schoolId) {
        var legacyMushollaListener: ValueEventListener? = null
        var scopedMushollaListener: ValueEventListener? = null
        var legacySchedulesListener: ValueEventListener? = null
        var scopedSchedulesListener: ValueEventListener? = null
        var legacyHolidaysListener: ValueEventListener? = null
        var scopedHolidaysListener: ValueEventListener? = null
        var prayerHistoryListener: ValueEventListener? = null
        var prayerHistoryQuery: com.google.firebase.database.Query? = null

        var legacyMusholla: MushollaLocation? = null
        var scopedMusholla: MushollaLocation? = null
        var legacySchedules: Map<String, Boolean>? = null
        var scopedSchedules: Map<String, Boolean>? = null
        var legacyHolidays: Set<String>? = null
        var scopedHolidays: Set<String>? = null
        var attachedScopeKey = resolvedSchoolId
        var prayerHistoryScopeKey = ""
        var scopedMushollaAvailable = false
        var scopedSchedulesAvailable = false
        var scopedHolidaysAvailable = false

        fun applyMusholla() {
            val picked = scopedMusholla ?: legacyMusholla
            if (picked != null) musholla = picked
        }
        fun applySchedules() {
            val picked = scopedSchedules ?: legacySchedules
            if (picked != null) schedules = picked else schedules = emptyMap()
        }
        fun applyHolidays() {
            val picked = scopedHolidays ?: legacyHolidays
            if (picked != null) holidays = picked else holidays = emptySet()
        }

        fun normalizeIdentity(value: String?): String = value?.trim()?.lowercase().orEmpty()
        fun updateIdentityAliases(extra: Set<String>) {
            val merged = identityAliases
                .plus(extra.map { it.trim().lowercase() })
                .filter { it.isNotBlank() }
                .toSet()
            identityAliases = merged
        }

        fun applyStudentProfile(snapshot: DataSnapshot?) {
            if (snapshot == null || !snapshot.exists()) return
            val school = snapshot.child("schoolId").getValue(String::class.java)?.trim()?.lowercase().orEmpty()
            val rel = snapshot.child("religion").getValue(String::class.java)
                ?: snapshot.child("agama").getValue(String::class.java)
                ?: ""
            val name = snapshot.child("name").getValue(String::class.java).orEmpty().trim()
            val classValue = (
                snapshot.child("class").getValue(String::class.java)
                    ?: snapshot.child("kelas").getValue(String::class.java)
                    ?: ""
                ).trim()
            val nisn = snapshot.child("nisn").getValue(String::class.java).orEmpty().trim()
            val username = snapshot.child("username").getValue(String::class.java).orEmpty().trim()
            if (school.isNotBlank()) {
                resolvedSchoolId = school
            }
            if (rel.isNotBlank()) {
                religion = rel
            }
            if (name.isNotBlank()) studentName = name
            if (classValue.isNotBlank()) studentClass = classValue
            studentWriteId = snapshot.key?.trim().orEmpty().ifBlank { studentId.trim() }
            updateIdentityAliases(setOf(studentWriteId, nisn, username, studentCredential))
        }

        fun attachScopedListeners(scope: String) {
            if (scope.isBlank()) return
            if (attachedScopeKey == scope && (scopedMushollaListener != null || scopedSchedulesListener != null || scopedHolidaysListener != null)) {
                return
            }

            if (attachedScopeKey.isNotBlank()) {
                scopedMushollaListener?.let {
                    db.getReference("school_settings").child(attachedScopeKey).child("prayer").child("musholla_location")
                        .removeEventListener(it)
                }
                scopedSchedulesListener?.let {
                    db.getReference("school_settings").child(attachedScopeKey).child("prayer").child("schedules")
                        .removeEventListener(it)
                }
                scopedHolidaysListener?.let {
                    db.getReference("school_settings").child(attachedScopeKey).child("attendance").child("holidays")
                        .removeEventListener(it)
                }
            }
            attachedScopeKey = scope

            val mushRef = db.getReference("school_settings").child(scope).child("prayer").child("musholla_location")
            scopedMushollaListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        scopedMushollaAvailable = false
                        scopedMusholla = null
                        applyMusholla()
                        if (!scopedMushollaAvailable && legacyMushollaListener == null) {
                            legacyMushollaListener = object : ValueEventListener {
                                override fun onDataChange(legacySnapshot: DataSnapshot) {
                                    if (!scopedMushollaAvailable && legacySnapshot.exists()) {
                                        val lat = legacySnapshot.child("latitude").getValue(Double::class.java) ?: legacySnapshot.child("lat").getValue(Double::class.java) ?: Double.NaN
                                        val lng = legacySnapshot.child("longitude").getValue(Double::class.java) ?: legacySnapshot.child("lng").getValue(Double::class.java) ?: Double.NaN
                                        val radius = legacySnapshot.child("radius").getValue(Double::class.java) ?: legacySnapshot.child("radiusMeters").getValue(Double::class.java) ?: Double.NaN
                                        if (!lat.isFinite() || !lng.isFinite() || !radius.isFinite()) return
                                        legacyMusholla = MushollaLocation(lat, lng, radius)
                                        applyMusholla()
                                    }
                                }
                                override fun onCancelled(error: DatabaseError) {}
                            }
                            db.getReference("musholla_location").addValueEventListener(legacyMushollaListener as ValueEventListener)
                        }
                        return
                    }
                    val lat = snapshot.child("latitude").getValue(Double::class.java) ?: snapshot.child("lat").getValue(Double::class.java) ?: Double.NaN
                    val lng = snapshot.child("longitude").getValue(Double::class.java) ?: snapshot.child("lng").getValue(Double::class.java) ?: Double.NaN
                    val radius = snapshot.child("radius").getValue(Double::class.java) ?: snapshot.child("radiusMeters").getValue(Double::class.java) ?: Double.NaN
                    if (!lat.isFinite() || !lng.isFinite() || !radius.isFinite()) return
                    scopedMushollaAvailable = true
                    scopedMusholla = MushollaLocation(lat, lng, radius)
                    applyMusholla()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            mushRef.addValueEventListener(scopedMushollaListener as ValueEventListener)

            val schedRef = db.getReference("school_settings").child(scope).child("prayer").child("schedules")
            scopedSchedulesListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        scopedSchedulesAvailable = false
                        scopedSchedules = null
                        applySchedules()
                        if (!scopedSchedulesAvailable && legacySchedulesListener == null) {
                            legacySchedulesListener = object : ValueEventListener {
                                override fun onDataChange(legacySnapshot: DataSnapshot) {
                                    if (!scopedSchedulesAvailable && legacySnapshot.exists()) {
                                        val map = mutableMapOf<String, Boolean>()
                                        for (child in legacySnapshot.children) {
                                            val key = child.key ?: continue
                                            val isHoliday = child.child("isHoliday").getValue(Boolean::class.java) ?: false
                                            map[key] = isHoliday
                                        }
                                        legacySchedules = map
                                        applySchedules()
                                    }
                                }
                                override fun onCancelled(error: DatabaseError) {}
                            }
                            db.getReference("prayer_schedules").addValueEventListener(legacySchedulesListener as ValueEventListener)
                        }
                        return
                    }
                    val map = mutableMapOf<String, Boolean>()
                    for (child in snapshot.children) {
                        val key = child.key ?: continue
                        val isHoliday = child.child("isHoliday").getValue(Boolean::class.java) ?: false
                        map[key] = isHoliday
                    }
                    scopedSchedulesAvailable = true
                    scopedSchedules = map
                    applySchedules()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            schedRef.addValueEventListener(scopedSchedulesListener as ValueEventListener)

            val holRef = db.getReference("school_settings").child(scope).child("attendance").child("holidays")
            scopedHolidaysListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        scopedHolidaysAvailable = false
                        scopedHolidays = null
                        applyHolidays()
                        if (!scopedHolidaysAvailable && legacyHolidaysListener == null) {
                            legacyHolidaysListener = object : ValueEventListener {
                                override fun onDataChange(legacySnapshot: DataSnapshot) {
                                    if (!scopedHolidaysAvailable && legacySnapshot.exists()) {
                                        val set = mutableSetOf<String>()
                                        for (child in legacySnapshot.children) {
                                            val date = child.child("date").getValue(String::class.java) ?: ""
                                            if (date.isNotBlank()) set.add(date.trim())
                                        }
                                        legacyHolidays = set
                                        applyHolidays()
                                    }
                                }
                                override fun onCancelled(error: DatabaseError) {}
                            }
                            db.getReference("holidays").addValueEventListener(legacyHolidaysListener as ValueEventListener)
                        }
                        return
                    }
                    val set = mutableSetOf<String>()
                    for (child in snapshot.children) {
                        val date = child.child("date").getValue(String::class.java) ?: ""
                        if (date.isNotBlank()) set.add(date.trim())
                    }
                    scopedHolidaysAvailable = true
                    scopedHolidays = set
                    applyHolidays()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            holRef.addValueEventListener(scopedHolidaysListener as ValueEventListener)
        }

        fun attachPrayerHistoryListener(scope: String) {
            val normalizedScope = scope.trim().lowercase()
            if (prayerHistoryScopeKey == normalizedScope && prayerHistoryListener != null) return

            if (prayerHistoryListener != null) {
                prayerHistoryQuery?.removeEventListener(prayerHistoryListener as ValueEventListener)
            }

            prayerHistoryScopeKey = normalizedScope
            prayerHistoryLoading = true
            val baseRef = db.getReference("prayer_attendance")
            val query = if (normalizedScope.isNotBlank()) {
                baseRef.orderByChild("schoolId").equalTo(normalizedScope)
            } else {
                baseRef
            }
            prayerHistoryQuery = query

            prayerHistoryListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val aliases = identityAliases
                    val filtered = snapshot.children.mapNotNull { child ->
                        val recordStudentId = normalizeIdentity(child.child("studentId").getValue(String::class.java))
                        val recordNisn = normalizeIdentity(child.child("nisn").getValue(String::class.java))
                        val recordUsername = normalizeIdentity(child.child("username").getValue(String::class.java))
                        val recordSchoolId = normalizeIdentity(child.child("schoolId").getValue(String::class.java))
                        val submittedAt = child.child("date").getValue(Long::class.java)
                            ?: child.child("createdAt").getValue(Long::class.java)
                            ?: 0L
                        val status = child.child("status").getValue(String::class.java)?.trim().orEmpty()
                        val matchesSchool = normalizedScope.isBlank() || recordSchoolId == normalizedScope
                        val matchesStudent = aliases.contains(recordStudentId) || aliases.contains(recordNisn) || aliases.contains(recordUsername)
                        if (!matchesSchool || !matchesStudent || submittedAt <= 0L) return@mapNotNull null
                        PrayerHistoryRecord(
                            id = child.key.orEmpty(),
                            studentId = recordStudentId,
                            nisn = recordNisn,
                            schoolId = recordSchoolId,
                            date = submittedAt,
                            status = status
                        )
                    }.sortedByDescending { it.date }

                    prayerHistoryRaw = filtered
                    prayerHistoryLoading = false
                }

                override fun onCancelled(error: DatabaseError) {
                    prayerHistoryRaw = emptyList()
                    prayerHistoryLoading = false
                }
            }

            query.addValueEventListener(prayerHistoryListener as ValueEventListener)
        }

        if (resolvedSchoolId.isNotBlank()) {
            attachScopedListeners(resolvedSchoolId)
            attachPrayerHistoryListener(resolvedSchoolId)
        }

        fun resolveStudentProfile() {
            val normalizedCredential = studentCredential.trim()
            val normalizedId = studentId.trim()
            val isNumeric = normalizedCredential.isNotBlank() && normalizedCredential.all { it.isDigit() }
            val nisnCandidate = if (isNumeric) normalizedCredential else ""
            val usernameCandidate = if (!isNumeric) normalizedCredential else ""

            fun onFound(snapshot: DataSnapshot) {
                applyStudentProfile(snapshot)
                attachScopedListeners(resolvedSchoolId)
                attachPrayerHistoryListener(resolvedSchoolId)
            }

            fun lookupByKey(refPath: String, key: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                if (key.isBlank()) {
                    onMiss()
                    return
                }
                db.getReference(refPath).child(key).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        if (snapshot.exists()) onHit(snapshot) else onMiss()
                    }
                    override fun onCancelled(error: DatabaseError) {}
                })
            }

            fun lookupByFieldQuery(refPath: String, field: String, value: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                db.getReference(refPath).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        if (snapshot.exists()) onHit(snapshot.children.first()) else onMiss()
                    }
                    override fun onCancelled(error: DatabaseError) {}
                })
            }

            fun lookupByField(refPath: String, field: String, value: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
                if (value.isBlank()) {
                    onMiss()
                    return
                }
                if (refPath == "students" && field == "nisn") {
                    lookupByKey(refPath, value, onHit) {
                        lookupByFieldQuery(refPath, field, value, onHit, onMiss)
                    }
                    return
                }
                lookupByFieldQuery(refPath, field, value, onHit, onMiss)
            }

            lookupByKey("gas/schools/$resolvedSchoolId/students", normalizedId, ::onFound) {
                lookupByKey("master_students", normalizedId, ::onFound) {
                    lookupByKey("students", normalizedId, ::onFound) {
                        lookupByField("gas/schools/$resolvedSchoolId/students", "nisn", nisnCandidate, ::onFound) {
                            lookupByField("master_students", "nisn", nisnCandidate, ::onFound) {
                                lookupByField("students", "nisn", nisnCandidate, ::onFound) {
                                    lookupByField("gas/schools/$resolvedSchoolId/students", "username", usernameCandidate, ::onFound) {
                                        lookupByField("master_students", "username", usernameCandidate, ::onFound) {
                                            lookupByField("students", "username", usernameCandidate, ::onFound) {
                                                attachPrayerHistoryListener(resolvedSchoolId)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        resolveStudentProfile()

        onDispose {
            if (legacyMushollaListener != null) db.getReference("musholla_location").removeEventListener(legacyMushollaListener as ValueEventListener)
            if (legacySchedulesListener != null) db.getReference("prayer_schedules").removeEventListener(legacySchedulesListener as ValueEventListener)
            if (legacyHolidaysListener != null) db.getReference("holidays").removeEventListener(legacyHolidaysListener as ValueEventListener)

            if (scopedMushollaListener != null && attachedScopeKey.isNotBlank()) {
                db.getReference("school_settings").child(attachedScopeKey).child("prayer").child("musholla_location")
                    .removeEventListener(scopedMushollaListener as ValueEventListener)
            }
            if (scopedSchedulesListener != null && attachedScopeKey.isNotBlank()) {
                db.getReference("school_settings").child(attachedScopeKey).child("prayer").child("schedules")
                    .removeEventListener(scopedSchedulesListener as ValueEventListener)
            }
            if (scopedHolidaysListener != null && attachedScopeKey.isNotBlank()) {
                db.getReference("school_settings").child(attachedScopeKey).child("attendance").child("holidays")
                    .removeEventListener(scopedHolidaysListener as ValueEventListener)
            }
            if (prayerHistoryListener != null) {
                prayerHistoryQuery?.removeEventListener(prayerHistoryListener as ValueEventListener)
            }
        }
    }

    val cal = remember { Calendar.getInstance() }
    val todayYmd = remember { toYmd(cal) }
    val dayKey = remember { cal.get(Calendar.DAY_OF_WEEK).toString() }

    val isHolidayBySchedule = when {
        cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY -> true
        schedules.isEmpty() -> false
        schedules[dayKey] == null -> true
        else -> schedules[dayKey] == true
    }
    val isHolidayByDate = holidays.contains(todayYmd)
    val nonMuslim = isNonMuslim(religion)
    val deviceTimeTrusted = SecurityUtils.isAutomaticTimeEnabled(context) &&
        SecurityUtils.isAutomaticTimeZoneEnabled(context)

    val canAttemptByRule = !nonMuslim && !isHolidayBySchedule && !isHolidayByDate
    val canAttemptByLocation = coords != null &&
        distanceMeters != null &&
        !mockLocationDetected &&
        (distanceMeters ?: 0.0) <= musholla.radiusMeters
    val canSubmit = canAttemptByRule && canAttemptByLocation && deviceTimeTrusted && !isSubmitting
    val prayerHistory = remember(prayerHistoryRaw, resolvedSchoolId) {
        prayerHistoryRaw.filter { record ->
            resolvedSchoolId.isBlank() || record.schoolId.isBlank() || record.schoolId == resolvedSchoolId
        }.sortedByDescending { it.date }
    }
    val prayerMonthlySummary = remember(prayerHistory, schedules, holidays, nonMuslim) {
        if (nonMuslim) {
            calculateExemptPrayerMonthlySummary()
        } else {
            calculatePrayerMonthlySummary(prayerHistory, schedules, holidays)
        }
    }
    // #region debug-point A-E:prayer-location-reporting
    val reportPrayerLocationDebug = remember(context) {
        { hypothesisId: String, message: String, data: Map<String, Any?> ->
            thread(start = true) {
                runCatching {
                    val payload = JSONObject(
                        mapOf(
                            "sessionId" to "prayer-location-error",
                            "runId" to "pre-fix",
                            "hypothesisId" to hypothesisId,
                            "location" to "PrayerScreen.kt:checkLocation",
                            "msg" to message,
                            "data" to JSONObject(data),
                            "ts" to System.currentTimeMillis()
                        )
                    ).toString()
                    val connection = (URL("http://127.0.0.1:7777/event").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json")
                        connectTimeout = 1500
                        readTimeout = 1500
                    }
                    connection.outputStream.bufferedWriter().use { it.write(payload) }
                    connection.inputStream.close()
                    connection.disconnect()
                }
            }
        }
    }
    // #endregion

    fun applyPrayerLocation(loc: Location, source: String): Boolean {
        val lat = loc.latitude
        val lng = loc.longitude
        if (!SecurityUtils.isValidCoordinate(lat, lng)) {
            // #region debug-point C:prayer-location-invalid-coordinate
            reportPrayerLocationDebug(
                "C",
                "[DEBUG] Prayer location coordinate invalid",
                mapOf("latitude" to lat, "longitude" to lng, "source" to source)
            )
            // #endregion
            Toast.makeText(context, "Koordinat lokasi tidak valid. Coba aktifkan ulang GPS.", Toast.LENGTH_LONG).show()
            return false
        }
        if (SecurityUtils.isMockLocation(loc)) {
            mockLocationDetected = true
            coords = lat to lng
            distanceMeters = haversineMeters(lat, lng, musholla.lat, musholla.lng)
            locationAccuracy = loc.accuracy
            locationProvider = loc.provider
            // #region debug-point D:prayer-location-mock-detected
            reportPrayerLocationDebug(
                "D",
                "[DEBUG] Prayer location mock detected",
                mapOf(
                    "latitude" to lat,
                    "longitude" to lng,
                    "distanceMeters" to distanceMeters,
                    "accuracy" to loc.accuracy,
                    "provider" to loc.provider,
                    "source" to source
                )
            )
            // #endregion
            Toast.makeText(context, "Lokasi palsu terdeteksi. Presensi sholat diblokir.", Toast.LENGTH_LONG).show()
            return true
        }
        mockLocationDetected = false
        coords = lat to lng
        distanceMeters = haversineMeters(lat, lng, musholla.lat, musholla.lng)
        locationAccuracy = loc.accuracy
        locationProvider = loc.provider
        // #region debug-point D:prayer-location-success
        reportPrayerLocationDebug(
            "D",
            "[DEBUG] Prayer location resolved successfully",
            mapOf(
                "latitude" to lat,
                "longitude" to lng,
                "distanceMeters" to distanceMeters,
                "accuracy" to loc.accuracy,
                "provider" to loc.provider,
                "source" to source
            )
        )
        // #endregion
        return true
    }

    fun requestLastKnownPrayerLocation(
        fused: com.google.android.gms.location.FusedLocationProviderClient,
        trigger: String,
        originalError: String? = null
    ) {
        // #region debug-point B:prayer-location-last-known-request
        reportPrayerLocationDebug(
            "B",
            "[DEBUG] Prayer location fallback to lastLocation",
            mapOf("trigger" to trigger, "originalError" to (originalError ?: ""))
        )
        // #endregion
        fused.lastLocation
            .addOnSuccessListener { lastLoc ->
                if (lastLoc == null) {
                    // #region debug-point B:prayer-location-last-known-null
                    reportPrayerLocationDebug(
                        "B",
                        "[DEBUG] Prayer lastLocation returned null",
                        mapOf("trigger" to trigger, "originalError" to (originalError ?: ""))
                    )
                    // #endregion
                    Toast.makeText(context, "Gagal mengambil lokasi. Pastikan GPS aktif.", Toast.LENGTH_LONG).show()
                    isChecking = false
                    return@addOnSuccessListener
                }
                applyPrayerLocation(lastLoc, "lastLocation:$trigger")
                isChecking = false
            }
            .addOnFailureListener { fallbackError ->
                // #region debug-point E:prayer-location-last-known-failure
                reportPrayerLocationDebug(
                    "E",
                    "[DEBUG] Prayer lastLocation failed",
                    mapOf(
                        "trigger" to trigger,
                        "originalError" to (originalError ?: ""),
                        "errorClass" to fallbackError.javaClass.name,
                        "errorMessage" to (fallbackError.message ?: "")
                    )
                )
                // #endregion
                Toast.makeText(
                    context,
                    "Gagal cek lokasi: ${fallbackError.message ?: originalError ?: "provider lokasi bermasalah"}",
                    Toast.LENGTH_LONG
                ).show()
                isChecking = false
            }
    }

    fun checkLocation() {
        // #region debug-point A:prayer-location-entry
        reportPrayerLocationDebug(
            "A",
            "[DEBUG] Prayer location check requested",
            mapOf(
                "permissionGranted" to permissionGranted,
                "resolvedSchoolId" to resolvedSchoolId,
                "studentId" to studentWriteId,
                "deviceTimeTrusted" to deviceTimeTrusted,
                "mushollaLat" to musholla.lat,
                "mushollaLng" to musholla.lng,
                "mushollaRadius" to musholla.radiusMeters
            )
        )
        // #endregion
        if (!permissionGranted) {
            // #region debug-point A:prayer-location-permission-missing
            reportPrayerLocationDebug(
                "A",
                "[DEBUG] Prayer location permission missing",
                mapOf("permissionGranted" to permissionGranted)
            )
            // #endregion
            Toast.makeText(context, "Izin lokasi belum diberikan.", Toast.LENGTH_LONG).show()
            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
            return
        }
        isChecking = true
        try {
            val fused = LocationServices.getFusedLocationProviderClient(context)
            val token = CancellationTokenSource()
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, token.token)
                .addOnSuccessListener { loc ->
                    if (loc == null) {
                        // #region debug-point B:prayer-location-null-result
                        reportPrayerLocationDebug(
                            "B",
                            "[DEBUG] Prayer location provider returned null",
                            mapOf("provider" to "fused")
                        )
                        // #endregion
                        requestLastKnownPrayerLocation(fused, "current-null")
                        return@addOnSuccessListener
                    }
                    applyPrayerLocation(loc, "current")
                    isChecking = false
                }
                .addOnFailureListener { e ->
                    // #region debug-point E:prayer-location-failure
                    reportPrayerLocationDebug(
                        "E",
                        "[DEBUG] Prayer location request failed",
                        mapOf(
                            "errorClass" to (e.javaClass.name),
                            "errorMessage" to (e.message ?: "")
                        )
                    )
                    // #endregion
                    requestLastKnownPrayerLocation(fused, "current-failure", e.message)
                }
        } catch (e: Exception) {
            // #region debug-point E:prayer-location-exception
            reportPrayerLocationDebug(
                "E",
                "[DEBUG] Prayer location exception thrown",
                mapOf(
                    "errorClass" to (e.javaClass.name),
                    "errorMessage" to (e.message ?: "")
                )
            )
            // #endregion
            isChecking = false
            Toast.makeText(context, "Gagal cek lokasi: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun submitPrayer() {
        if (!canAttemptByRule) {
            val reason = when {
                nonMuslim -> "Presensi sholat tidak berlaku untuk siswa non muslim."
                isHolidayBySchedule -> "Hari ini non-efektif (jadwal libur)."
                isHolidayByDate -> "Hari ini libur (tanggal merah)."
                else -> "Tidak bisa presensi."
            }
            Toast.makeText(context, reason, Toast.LENGTH_LONG).show()
            return
        }
        if (!canAttemptByLocation) {
            val locationMessage = if (mockLocationDetected) {
                "Lokasi palsu terdeteksi. Presensi sholat diblokir."
            } else {
                "Anda harus berada di area musholla untuk presensi."
            }
            Toast.makeText(context, locationMessage, Toast.LENGTH_LONG).show()
            return
        }
        if (!deviceTimeTrusted) {
            Toast.makeText(context, "Aktifkan tanggal otomatis dan zona waktu otomatis sebelum presensi.", Toast.LENGTH_LONG).show()
            return
        }
        isSubmitting = true
        val now = System.currentTimeMillis()
        val todayKey = toYmd(Calendar.getInstance())
        val recordId = listOf(
            resolvedSchoolId.trim().lowercase(),
            studentWriteId.trim(),
            todayKey,
            "PRAY"
        ).joinToString("_").replace(Regex("[^A-Za-z0-9_-]"), "_")
        val normalizedCredential = studentCredential.trim()
        val isNumeric = normalizedCredential.isNotBlank() && normalizedCredential.all { it.isDigit() }
        val nisnValue = if (isNumeric) normalizedCredential else ""
        val usernameValue = if (!isNumeric) normalizedCredential else ""
        val payload = hashMapOf<String, Any?>(
            "schoolId" to resolvedSchoolId,
            "studentId" to studentWriteId.trim().ifBlank { studentId.trim() },
            "nisn" to nisnValue,
            "username" to usernameValue,
            "studentNameSnapshot" to studentName.trim().ifBlank { null },
            "classNameSnapshot" to studentClass.trim().ifBlank { null },
            "date" to now,
            "status" to "PRAY",
            "lat" to (coords?.first ?: null),
            "lng" to (coords?.second ?: null),
            "accuracy" to locationAccuracy,
            "provider" to locationProvider,
            "isMockLocation" to mockLocationDetected,
            "deviceTimeTrusted" to deviceTimeTrusted,
            "deviceId" to SecurityUtils.getDeviceBindingId(context),
            "recordedBy" to "APP_NATIVE",
            "createdAt" to now,
            "updatedAt" to now
        )

        val schoolScope = resolvedSchoolId.trim().lowercase()
        val updates = mapOf<String, Any?>(
            "prayer_attendance/$recordId" to payload,
            "prayer_attendance_by_school/$schoolScope/$recordId" to payload
        )
        db.reference.updateChildren(updates)
            .addOnSuccessListener {
                Toast.makeText(context, "Presensi sholat berhasil dicatat.", Toast.LENGTH_LONG).show()
                isSubmitting = false
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Gagal presensi: ${e.message}", Toast.LENGTH_LONG).show()
                isSubmitting = false
            }
    }

    Scaffold(
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            listOf(
                                Color(0xFF0F2A43),
                                Color(0xFF0F7BFF)
                            )
                        )
                    )
            ) {
                TopAppBar(
                    title = { Text("Presensi Sholat", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White
                    )
                )
            }
        }
    ) { padding ->
        val pageBackground = remember {
            Brush.verticalGradient(
                colors = listOf(
                    Color(0xFF12D6C6),
                    Color(0xFF0F7BFF),
                    Color(0xFF0F2A43)
                )
            )
        }
        val cardShape = remember { RoundedCornerShape(20.dp) }
        val cardBorder = Color.White.copy(alpha = 0.18f)
        val cardBg = Color(0xFF0B1F33).copy(alpha = 0.22f)

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(pageBackground)
                .padding(padding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = Color.Transparent,
                    contentColor = Color.White,
                    indicator = { tabPositions ->
                        val currentTab = tabPositions[selectedTabIndex]
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .wrapContentSize(Alignment.BottomStart)
                        ) {
                            Box(
                                modifier = Modifier
                                    .offset(x = currentTab.left)
                                    .width(currentTab.width)
                                    .height(3.dp)
                                    .background(Color.White, RoundedCornerShape(999.dp))
                            )
                        }
                    }
                ) {
                    listOf("Presensi", "Riwayat").forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            selectedContentColor = Color.White,
                            unselectedContentColor = Color.White.copy(alpha = 0.7f),
                            text = { Text(title) }
                        )
                    }
                }

                when (selectedTabIndex) {
                    0 -> Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = cardShape,
                            colors = CardDefaults.cardColors(containerColor = cardBg),
                            border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Aturan Hari", fontWeight = FontWeight.Bold, color = Color.White)
                                Text("Hari efektif: ${if (!isHolidayBySchedule) "Ya" else "Tidak"}", color = Color.White.copy(alpha = 0.9f))
                                Text("Tanggal merah: ${if (!isHolidayByDate) "Tidak" else "Ya"}", color = Color.White.copy(alpha = 0.9f))
                                Text(
                                    "Aturan sholat: ${if (nonMuslim) "Tidak berlaku (Non Muslim)" else "Berlaku"}",
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = cardShape,
                            colors = CardDefaults.cardColors(containerColor = cardBg),
                            border = androidx.compose.foundation.BorderStroke(1.dp, cardBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Lokasi Musholla", fontWeight = FontWeight.Bold, color = Color.White)
                                Text(
                                    "Target: %.6f, %.6f | Radius %.0fm".format(musholla.lat, musholla.lng, musholla.radiusMeters),
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                                Text(
                                    text = "Lokasi Anda: " + (coords?.let { "%.6f, %.6f".format(it.first, it.second) } ?: "-"),
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                                Text(
                                    text = "Jarak: " + (distanceMeters?.let { "%.0fm".format(it) } ?: "-"),
                                    color = Color.White.copy(alpha = 0.9f)
                                )

                                Spacer(modifier = Modifier.height(6.dp))
                                Button(
                                    onClick = { checkLocation() },
                                    enabled = !isChecking,
                                    modifier = Modifier.fillMaxWidth().height(52.dp),
                                    shape = RoundedCornerShape(18.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color.White.copy(alpha = 0.16f),
                                        contentColor = Color.White
                                    )
                                ) {
                                    if (isChecking) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                                    } else {
                                        Icon(Icons.Default.LocationOn, contentDescription = null)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Cek Lokasi Sekarang")
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = { submitPrayer() },
                            enabled = canSubmit,
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(18.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF0B1F33).copy(alpha = 0.55f),
                                contentColor = Color.White,
                                disabledContainerColor = Color(0xFF0B1F33).copy(alpha = 0.25f),
                                disabledContentColor = Color.White.copy(alpha = 0.55f)
                            )
                        ) {
                            Text(if (isSubmitting) "Memproses..." else "Presensi Sholat")
                        }

                        if (!canAttemptByRule) {
                            val reason = when {
                                nonMuslim -> "Presensi sholat tidak berlaku untuk siswa non muslim."
                                isHolidayBySchedule -> "Hari ini non-efektif (jadwal libur)."
                                isHolidayByDate -> "Hari ini libur (tanggal merah)."
                                else -> "Tidak bisa presensi."
                            }
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = cardShape,
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1A1A).copy(alpha = 0.45f)),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFB4A9).copy(alpha = 0.35f))
                            ) {
                                Text(
                                    text = reason,
                                    color = Color(0xFFFFB4A9),
                                    style = MaterialTheme.typography.bodySmall,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        } else if (!canAttemptByLocation) {
                            Text(
                                if (mockLocationDetected) {
                                    "Catatan: lokasi palsu terdeteksi sehingga presensi diblokir."
                                } else {
                                    "Catatan: presensi aktif jika berada di area musholla."
                                },
                                color = Color.White.copy(alpha = 0.75f),
                                style = MaterialTheme.typography.bodySmall
                            )
                        } else if (!deviceTimeTrusted) {
                            Text(
                                "Catatan: aktifkan tanggal otomatis dan zona waktu otomatis sebelum presensi.",
                                color = Color.White.copy(alpha = 0.75f),
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }

                    else -> PrayerHistoryContent(
                        isLoading = prayerHistoryLoading,
                        summary = prayerMonthlySummary
                    )
                }
            }
        }
    }
}

@Composable
private fun PrayerHistoryContent(
    isLoading: Boolean,
    summary: MonthlyPrayerSummary
) {
    val monthYearFormatter = remember { SimpleDateFormat("MMMM yyyy", Locale("id", "ID")) }
    val dateFormatter = remember { SimpleDateFormat("dd/MM/yyyy", Locale("id", "ID")) }

    fun chipColor(statusCode: String): Color {
        return when (statusCode) {
            "S" -> Color(0xFF86EFAC)
            "TS" -> Color(0xFFFFB4A9)
            "I" -> Color(0xFFFDE68A)
            "H" -> Color(0xFFE9B8FF)
            else -> Color.White.copy(alpha = 0.45f)
        }
    }

    fun chipBackground(statusCode: String): Color {
        return when (statusCode) {
            "S" -> Color(0xFF16A34A).copy(alpha = 0.18f)
            "TS" -> Color(0xFFEF4444).copy(alpha = 0.18f)
            "I" -> Color(0xFFF59E0B).copy(alpha = 0.18f)
            "H" -> Color(0xFF8E24AA).copy(alpha = 0.18f)
            else -> Color.Transparent
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color.White)
            }
            return
        }

        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0B1F33).copy(alpha = 0.22f)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.14f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Rekap Bulanan ${monthYearFormatter.format(Date())}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("S", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = Color(0xFF86EFAC))
                        Text("${summary.totalPray}", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("TS", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = Color(0xFFFFB4A9))
                        Text("${summary.totalNotPray}", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("I", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = Color(0xFFFDE68A))
                        Text("${summary.totalPermit}", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("H", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = Color(0xFFE9B8FF))
                        Text("${summary.totalHalangan}", style = MaterialTheme.typography.titleMedium, color = Color.White)
                    }
                }
            }
        }

        Text(
            text = "Keterangan: S = Sholat, TS = Tidak Sholat, I = Izin, H = Halangan",
            style = MaterialTheme.typography.labelSmall,
            color = Color.White.copy(alpha = 0.78f),
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F7BFF))
        ) {
            Row(
                modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("No", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(0.5f))
                Text("Hari/Tgl", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(1.5f))
                Text("Jam", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(1f))
                Text("Ket", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.weight(1.2f))
            }
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            itemsIndexed(summary.summaries) { index, daily ->
                val calendar = Calendar.getInstance().apply {
                    val parts = daily.dateKey.split("-")
                    set(Calendar.YEAR, parts.getOrNull(0)?.toIntOrNull() ?: get(Calendar.YEAR))
                    set(Calendar.MONTH, (parts.getOrNull(1)?.toIntOrNull() ?: 1) - 1)
                    set(Calendar.DAY_OF_MONTH, parts.getOrNull(2)?.toIntOrNull() ?: 1)
                }
                val jam = daily.submittedAt?.let { SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(it)) } ?: "-"
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0B1F33).copy(alpha = 0.18f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.14f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("${index + 1}", style = MaterialTheme.typography.bodyMedium, color = Color.White, modifier = Modifier.weight(0.5f))
                        Column(modifier = Modifier.weight(1.5f)) {
                            Text(daily.dayName, style = MaterialTheme.typography.bodyMedium, color = Color.White, maxLines = 1)
                            Text(dateFormatter.format(calendar.time), style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.72f), maxLines = 1)
                        }
                        Text(jam, style = MaterialTheme.typography.bodyMedium, color = Color.White, modifier = Modifier.weight(1f))
                        Surface(
                            color = chipBackground(daily.statusCode),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1.2f)
                        ) {
                            Text(
                                text = if (daily.statusCode == "-") "-" else daily.statusCode,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                color = chipColor(daily.statusCode),
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}
