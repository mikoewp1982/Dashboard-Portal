package com.satupintu.mobile.ui.screens.student

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
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
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.util.SecurityUtils
import java.util.Calendar
import java.util.Locale
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

private data class MushollaLocationV2(val lat: Double, val lng: Double, val radiusMeters: Double)

private data class PrayerV2Type(
    val enabled: Boolean,
    val requireMuslim: Boolean,
    val eligibleGender: String,
    val locationRequired: Boolean
)

private data class PrayerV2Schedule(
    val prayerType: String,
    val classIds: List<String>,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val active: Boolean
)

private data class PrayerV2Override(
    val date: String,
    val prayerType: String,
    val classIds: List<String>,
    val action: String
)

private data class PrayerItemState(
    val title: String,
    val prayerType: String,
    val isEnabled: Boolean,
    val isRequiredToday: Boolean,
    val timeWindowLabel: String,
    val statusLabel: String,
    val canSubmit: Boolean,
    val disableReason: String
)

private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()

private fun normalizeVariant(value: String): String = value.trim().lowercase()

private fun getSchoolIdVariants(value: String): List<String> {
    val canonical = normalizeVariant(value)
    if (canonical.isBlank()) return emptyList()
    val legacy = canonical.replace(Regex("[\\s\\-]+"), "_")
    return if (legacy.isNotBlank() && legacy != canonical) listOf(canonical, legacy) else listOf(canonical)
}

private fun sanitizeRecordId(value: String): String {
    return value.trim().replace(Regex("[^A-Za-z0-9_-]"), "_")
}

private fun toYmd(cal: Calendar): String {
    val y = cal.get(Calendar.YEAR)
    val m = cal.get(Calendar.MONTH) + 1
    val d = cal.get(Calendar.DAY_OF_MONTH)
    return "%04d-%02d-%02d".format(y, m, d)
}

private fun parseTimeToMinutes(raw: String, defaultHour: Int, defaultMinute: Int): Int {
    val trimmed = raw.trim().replace(".", ":")
    val parts = trimmed.split(":").map { it.trim() }.filter { it.isNotEmpty() }
    val hour = parts.getOrNull(0)?.toIntOrNull() ?: defaultHour
    val minute = parts.getOrNull(1)?.toIntOrNull() ?: defaultMinute
    return hour.coerceIn(0, 23) * 60 + minute.coerceIn(0, 59)
}

/**
 * Match web admin [normalizeClassName]: VII-A / VII A / 7A → 7A.
 */
private fun normalizeClassCompact(value: String): String {
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

/**
 * RTDB may store classIds as a string array or as a map (`{ classKey: true }` / `{ "0": "id" }`).
 */
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
            is Number -> {
                // Indexed array cell holding a non-string; ignore numeric payload, use key only if non-index
            }
            else -> {
                val asString = child.getValue(String::class.java)?.trim().orEmpty()
                if (asString.isNotBlank()) values += asString
            }
        }
    }
    if (values.isNotEmpty()) return values.distinct()
    // Single string leaf (rare)
    val leaf = snapshot.getValue(String::class.java)?.trim().orEmpty()
    return if (leaf.isNotBlank()) listOf(leaf) else emptyList()
}

private fun hasClassMatch(classIds: List<String>, className: String, classLabelMap: Map<String, String>): Boolean {
    val studentNorm = normalizeClassCompact(className)
    if (studentNorm.isBlank() || classIds.isEmpty()) return false
    return classIds.any { id ->
        val rawId = id.trim()
        if (rawId.isBlank()) return@any false
        val label = classLabelMap[rawId] ?: classLabelMap.entries.firstOrNull {
            normalizeClassCompact(it.key) == normalizeClassCompact(rawId)
        }?.value
        val candidates = listOfNotNull(rawId, label).map { normalizeClassCompact(it) }.filter { it.isNotBlank() }
        candidates.any { it == studentNorm }
    }
}

private fun isNonMuslim(religionRaw: String): Boolean {
    val r = religionRaw.trim().lowercase()
    if (r.isEmpty()) return false
    if (r == "non_islam" || r == "non-islam" || r == "non muslim" || r == "nonmuslim") return true
    if (r.contains("non") && r.contains("islam")) return true
    if (r.contains("kristen") || r.contains("katolik") || r.contains("hindu") || r.contains("buddha") || r.contains("konghucu")) return true
    return false
}

private fun isMaleStudent(genderRaw: String): Boolean {
    val g = genderRaw.trim().lowercase(Locale.ROOT)
    if (g.isBlank()) return false
    if (g == "l" || g == "lk" || g == "laki" || g.contains("laki")) return true
    if (g == "male" || g.contains("male")) return true
    if (g.contains("putra")) return true
    return false
}

private fun isFemaleStudent(genderRaw: String): Boolean {
    val g = genderRaw.trim().lowercase(Locale.ROOT)
    if (g.isBlank()) return false
    if (g == "p" || g == "pr" || g == "perempuan" || g.contains("perempuan")) return true
    if (g == "female" || g.contains("female")) return true
    if (g.contains("putri")) return true
    return false
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

private fun pickScheduleForClass(
    prayerType: String,
    dayOfWeek: Int,
    className: String,
    schedules: List<PrayerV2Schedule>,
    classLabelMap: Map<String, String>,
    preferActive: Boolean = true
): PrayerV2Schedule? {
    val forType = schedules.filter { it.prayerType == prayerType }
    val classMatched = forType.filter { hasClassMatch(it.classIds, className, classLabelMap) }
    val pool = if (preferActive) {
        classMatched.filter { it.active }.ifEmpty { classMatched }
    } else {
        classMatched
    }
    return pool.firstOrNull { it.dayOfWeek == dayOfWeek }
        ?: pool.firstOrNull()
        ?: forType.filter { if (preferActive) it.active else true }.firstOrNull { it.dayOfWeek == dayOfWeek }
}

private fun resolveActiveRule(
    prayerType: String,
    todayYmd: String,
    dayOfWeek: Int,
    className: String,
    schedules: List<PrayerV2Schedule>,
    overrides: List<PrayerV2Override>,
    classLabelMap: Map<String, String>
): Pair<Boolean, PrayerV2Schedule?> {
    val normalizedClass = className.trim()
    if (normalizedClass.isBlank()) return false to null

    val off = overrides.firstOrNull {
        it.prayerType == prayerType && it.date == todayYmd && it.action == "deactivate" && hasClassMatch(it.classIds, normalizedClass, classLabelMap)
    }
    if (off != null) return false to null

    val on = overrides.firstOrNull {
        it.prayerType == prayerType && it.date == todayYmd && it.action == "activate" && hasClassMatch(it.classIds, normalizedClass, classLabelMap)
    }
    if (on != null) {
        // Activate forces eligibility even without a weekly row; still prefer this class's window when present.
        val schedule = pickScheduleForClass(prayerType, dayOfWeek, normalizedClass, schedules, classLabelMap, preferActive = false)
        return true to schedule
    }

    val schedule = schedules.firstOrNull {
        it.active && it.prayerType == prayerType && it.dayOfWeek == dayOfWeek && hasClassMatch(it.classIds, normalizedClass, classLabelMap)
    }
    return (schedule != null) to schedule
}

private fun isTimeInWindow(now: Calendar, start: String, end: String): Boolean {
    val nowMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    val startMinutes = parseTimeToMinutes(start, 7, 0)
    val endMinutes = parseTimeToMinutes(end, 7, 30)
    return nowMinutes in startMinutes..endMinutes
}

private fun toReadableTimeWindow(start: String, end: String): String {
    val s = start.trim().replace(".", ":").ifBlank { "07:00" }
    val e = end.trim().replace(".", ":").ifBlank { "07:30" }
    return "$s - $e"
}

private fun isDeviceTimeTrusted(context: Context): Boolean {
    return SecurityUtils.isAutomaticTimeEnabled(context) && SecurityUtils.isAutomaticTimeZoneEnabled(context)
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun PrayerDhuhaJumatScreen(
    studentCredential: String,
    studentId: String,
    schoolId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val db = remember { FirebaseDatabase.getInstance() }
    val studentRepository = remember { StudentRepository() }

    var resolvedSchoolId by remember { mutableStateOf(normalizeScope(schoolId)) }
    var studentWriteId by remember(studentId) { mutableStateOf(studentId.trim()) }
    var studentName by remember { mutableStateOf("") }
    var studentClass by remember { mutableStateOf("") }
    var religion by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }

    var types by remember { mutableStateOf<Map<String, PrayerV2Type>>(emptyMap()) }
    var schedules by remember { mutableStateOf<List<PrayerV2Schedule>>(emptyList()) }
    var overrides by remember { mutableStateOf<List<PrayerV2Override>>(emptyList()) }
    var classLabelMap by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var musholla by remember { mutableStateOf(MushollaLocationV2(lat = -7.6698, lng = 112.5432, radiusMeters = 25.0)) }

    var permissionGranted by remember { mutableStateOf(false) }
    var isChecking by remember { mutableStateOf(false) }
    var coords by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    var distanceMeters by remember { mutableStateOf<Double?>(null) }
    var locationAccuracy by remember { mutableStateOf<Float?>(null) }
    var locationProvider by remember { mutableStateOf<String?>(null) }
    var mockLocationDetected by remember { mutableStateOf(false) }

    var dhuhaStatus by remember { mutableStateOf<String?>(null) }
    var jumatStatus by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }
    var loadingConfig by remember { mutableStateOf(true) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val ok = result.values.all { it }
        permissionGranted = ok
        if (!ok) {
            Toast.makeText(context, "Izin lokasi ditolak. Presensi membutuhkan lokasi.", Toast.LENGTH_LONG).show()
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

    LaunchedEffect(studentCredential, studentId, schoolId) {
        runCatching {
            studentRepository.resolveStudent(studentId = studentId, credential = studentCredential, schoolId = schoolId)
        }.onSuccess { student ->
            if (student != null) {
                val resolved = normalizeScope(student.schoolId).ifBlank { resolvedSchoolId }
                if (resolved.isNotBlank()) resolvedSchoolId = resolved
                studentWriteId = student.recordId.trim().ifBlank { studentId.trim() }
                studentName = student.name.trim()
                studentClass = student.className.trim()
                religion = student.religion.trim()
                gender = student.gender.trim()
            }
        }
    }

    DisposableEffect(resolvedSchoolId) {
        val canonical = normalizeScope(resolvedSchoolId)
        val variants = getSchoolIdVariants(canonical)
        var mushListener: ValueEventListener? = null
        val mushRefs = variants.map { variant ->
            db.getReference("school_settings").child(variant).child("prayer").child("musholla_location")
        }
        val mushUnsubs = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()
        var fallbackRootListener: ValueEventListener? = null

        fun applyMusholla(snapshot: DataSnapshot) {
            val lat = snapshot.child("latitude").getValue(Double::class.java) ?: snapshot.child("lat").getValue(Double::class.java) ?: Double.NaN
            val lng = snapshot.child("longitude").getValue(Double::class.java) ?: snapshot.child("lng").getValue(Double::class.java) ?: Double.NaN
            val radius = snapshot.child("radius").getValue(Double::class.java) ?: snapshot.child("radiusMeters").getValue(Double::class.java) ?: Double.NaN
            if (!SecurityUtils.isValidCoordinate(lat, lng) || !radius.isFinite() || radius <= 0) return
            musholla = MushollaLocationV2(lat = lat, lng = lng, radiusMeters = radius)
        }

        mushListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    applyMusholla(snapshot)
                    return
                }
                if (fallbackRootListener == null) {
                    fallbackRootListener = object : ValueEventListener {
                        override fun onDataChange(rootSnapshot: DataSnapshot) {
                            if (rootSnapshot.exists()) {
                                applyMusholla(rootSnapshot)
                            }
                        }

                        override fun onCancelled(error: DatabaseError) {}
                    }
                    db.getReference("musholla_location").addValueEventListener(fallbackRootListener as ValueEventListener)
                }
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        mushRefs.forEach { ref ->
            val listener = mushListener as ValueEventListener
            ref.addValueEventListener(listener)
            mushUnsubs += ref to listener
        }

        // Admin writes canonical schoolId; also listen to legacy underscore variant so siswa still finds config.
        val prayerConfigUnsubs = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()
        val typesByVariant = linkedMapOf<String, Map<String, PrayerV2Type>>()
        val schedulesByVariant = linkedMapOf<String, List<PrayerV2Schedule>>()
        val overridesByVariant = linkedMapOf<String, List<PrayerV2Override>>()

        fun publishPreferredConfig() {
            val preferred = variants.firstOrNull { typesByVariant[it]?.isNotEmpty() == true }
                ?: variants.firstOrNull { schedulesByVariant[it]?.isNotEmpty() == true }
                ?: variants.firstOrNull()
            if (preferred != null) {
                types = typesByVariant[preferred] ?: emptyMap()
                schedules = schedulesByVariant[preferred] ?: emptyList()
                overrides = overridesByVariant[preferred] ?: emptyList()
            }
            loadingConfig = false
        }

        variants.forEach { variant ->
            val base = db.getReference("school_settings").child(variant).child("prayer_v2")
            val typesRef = base.child("types")
            val schedulesRef = base.child("schedules")
            val overridesRef = base.child("overrides")

            val typesListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val next = linkedMapOf<String, PrayerV2Type>()
                    snapshot.children.forEach { child ->
                        val key = child.key?.trim()?.uppercase(Locale.ROOT).orEmpty()
                        if (key.isBlank()) return@forEach
                        next[key] = PrayerV2Type(
                            enabled = child.child("enabled").getValue(Boolean::class.java) ?: true,
                            requireMuslim = child.child("requireMuslim").getValue(Boolean::class.java) ?: true,
                            eligibleGender = child.child("eligibleGender").getValue(String::class.java)?.trim().orEmpty(),
                            locationRequired = child.child("locationRequired").getValue(Boolean::class.java) ?: true
                        )
                    }
                    typesByVariant[variant] = next
                    publishPreferredConfig()
                }

                override fun onCancelled(error: DatabaseError) {
                    loadingConfig = false
                }
            }

            val schedulesListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val next = snapshot.children.mapNotNull { child ->
                        val prayerType = child.child("prayerType").getValue(String::class.java)?.trim()?.uppercase(Locale.ROOT).orEmpty()
                        if (prayerType.isBlank()) return@mapNotNull null
                        PrayerV2Schedule(
                            prayerType = prayerType,
                            classIds = parseClassIds(child.child("classIds")),
                            dayOfWeek = child.child("dayOfWeek").getValue(Int::class.java) ?: 5,
                            startTime = child.child("startTime").getValue(String::class.java)?.trim().orEmpty(),
                            endTime = child.child("endTime").getValue(String::class.java)?.trim().orEmpty(),
                            active = child.child("active").getValue(Boolean::class.java) ?: true
                        )
                    }
                    schedulesByVariant[variant] = next
                    publishPreferredConfig()
                }

                override fun onCancelled(error: DatabaseError) {}
            }

            val overridesListener = object : ValueEventListener {
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
                    overridesByVariant[variant] = next
                    publishPreferredConfig()
                }

                override fun onCancelled(error: DatabaseError) {}
            }

            typesRef.addValueEventListener(typesListener)
            schedulesRef.addValueEventListener(schedulesListener)
            overridesRef.addValueEventListener(overridesListener)
            prayerConfigUnsubs += typesRef to typesListener
            prayerConfigUnsubs += schedulesRef to schedulesListener
            prayerConfigUnsubs += overridesRef to overridesListener
        }

        // Load class list to resolve class push-key IDs to labels (e.g. "-NxQ7abc" -> "VII-A")
        val classMapByVariant = linkedMapOf<String, Map<String, String>>()
        val classUnsubs = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()
        fun publishPreferredClasses() {
            val preferred = variants.firstOrNull { classMapByVariant[it]?.isNotEmpty() == true } ?: variants.firstOrNull()
            if (preferred != null) {
                classLabelMap = classMapByVariant[preferred] ?: emptyMap()
            }
        }
        variants.forEach { variant ->
            val classesRef = db.getReference("gas/schools").child(variant).child("classes")
            val classesListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val nextMap = mutableMapOf<String, String>()
                    snapshot.children.forEach { child ->
                        val key = child.key ?: return@forEach
                        val label = child.child("className").getValue(String::class.java)
                            ?: child.child("name").getValue(String::class.java)
                            ?: child.child("kelas").getValue(String::class.java)
                            ?: key
                        nextMap[key] = label.trim()
                    }
                    classMapByVariant[variant] = nextMap
                    publishPreferredClasses()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            classesRef.addValueEventListener(classesListener)
            classUnsubs += classesRef to classesListener
        }

        var dhuhaListener: ValueEventListener? = null
        var jumatListener: ValueEventListener? = null

        fun attachStatusListeners() {
            val scope = canonical
            if (scope.isBlank() || studentWriteId.isBlank()) return
            val todayKey = toYmd(Calendar.getInstance())
            val dhuhaId = sanitizeRecordId("${scope}_${studentWriteId}_${todayKey}_DHUHA")
            val jumatId = sanitizeRecordId("${scope}_${studentWriteId}_${todayKey}_JUMAT")
            val dhuhaRef = db.getReference("prayer_attendance_v2_by_school").child(scope).child(dhuhaId)
            val jumatRef = db.getReference("prayer_attendance_v2_by_school").child(scope).child(jumatId)

            dhuhaListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    dhuhaStatus = snapshot.child("status").getValue(String::class.java)
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            jumatListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    jumatStatus = snapshot.child("status").getValue(String::class.java)
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            dhuhaRef.addValueEventListener(dhuhaListener as ValueEventListener)
            jumatRef.addValueEventListener(jumatListener as ValueEventListener)
        }

        attachStatusListeners()

        onDispose {
            mushUnsubs.forEach { (ref, listener) -> ref.removeEventListener(listener) }
            fallbackRootListener?.let { db.getReference("musholla_location").removeEventListener(it) }
            prayerConfigUnsubs.forEach { (ref, listener) -> ref.removeEventListener(listener) }
            classUnsubs.forEach { (ref, listener) -> ref.removeEventListener(listener) }
            dhuhaListener?.let {
                val todayKey = toYmd(Calendar.getInstance())
                val id = sanitizeRecordId("${canonical}_${studentWriteId}_${todayKey}_DHUHA")
                db.getReference("prayer_attendance_v2_by_school").child(canonical).child(id).removeEventListener(it)
            }
            jumatListener?.let {
                val todayKey = toYmd(Calendar.getInstance())
                val id = sanitizeRecordId("${canonical}_${studentWriteId}_${todayKey}_JUMAT")
                db.getReference("prayer_attendance_v2_by_school").child(canonical).child(id).removeEventListener(it)
            }
        }
    }

    DisposableEffect(permissionGranted) {
        if (!permissionGranted) return@DisposableEffect onDispose {}
        val fused = LocationServices.getFusedLocationProviderClient(context)
        val locationRequest = com.google.android.gms.location.LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000)
            .setMinUpdateDistanceMeters(1f)
            .build()
        val locationCallback = object : com.google.android.gms.location.LocationCallback() {
            override fun onLocationResult(result: com.google.android.gms.location.LocationResult) {
                result.lastLocation?.let { loc ->
                    val lat = loc.latitude
                    val lng = loc.longitude
                    coords = lat to lng
                    locationAccuracy = loc.accuracy
                    locationProvider = loc.provider
                    mockLocationDetected = SecurityUtils.isMockLocation(loc)
                    distanceMeters = haversineMeters(lat, lng, musholla.lat, musholla.lng)
                }
            }
        }
        if (androidx.core.app.ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fused.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper())
        }
        onDispose {
            fused.removeLocationUpdates(locationCallback)
        }
    }

    fun checkLocation() {
        if (!permissionGranted) {
            Toast.makeText(context, "Izin lokasi belum aktif.", Toast.LENGTH_LONG).show()
            return
        }
        if (isChecking) return
        isChecking = true
        val fused = LocationServices.getFusedLocationProviderClient(context)
        val token = CancellationTokenSource()
        try {
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, token.token)
                .addOnSuccessListener { location: Location? ->
                    val loc = location
                    if (loc == null) {
                        isChecking = false
                        Toast.makeText(context, "Gagal mengambil lokasi.", Toast.LENGTH_LONG).show()
                        return@addOnSuccessListener
                    }
                    val lat = loc.latitude
                    val lng = loc.longitude
                    coords = lat to lng
                    locationAccuracy = loc.accuracy
                    locationProvider = loc.provider
                    mockLocationDetected = SecurityUtils.isMockLocation(loc)
                    val dist = haversineMeters(lat, lng, musholla.lat, musholla.lng)
                    distanceMeters = dist
                    isChecking = false
                }
                .addOnFailureListener { e ->
                    isChecking = false
                    Toast.makeText(context, "Gagal cek lokasi: ${e.message}", Toast.LENGTH_LONG).show()
                }
        } catch (e: Exception) {
            isChecking = false
            Toast.makeText(context, "Gagal cek lokasi: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun submitPrayer(prayerType: String, schedule: PrayerV2Schedule?) {
        if (isSubmitting) return
        val canonical = normalizeScope(resolvedSchoolId)
        if (canonical.isBlank()) {
            Toast.makeText(context, "Sekolah tidak terdeteksi.", Toast.LENGTH_LONG).show()
            return
        }

        val typeRule = types[prayerType] ?: PrayerV2Type(enabled = false, requireMuslim = true, eligibleGender = "all", locationRequired = true)
        if (!typeRule.enabled) {
            Toast.makeText(context, "Fitur belum aktif di sekolah.", Toast.LENGTH_LONG).show()
            return
        }

        val current = Calendar.getInstance()
        val todayKey = toYmd(current)
        val dayOfWeek = current.get(Calendar.DAY_OF_WEEK)
        val mappedDay = when (dayOfWeek) {
            Calendar.SUNDAY -> 0
            Calendar.MONDAY -> 1
            Calendar.TUESDAY -> 2
            Calendar.WEDNESDAY -> 3
            Calendar.THURSDAY -> 4
            Calendar.FRIDAY -> 5
            Calendar.SATURDAY -> 6
            else -> 5
        }

        val nonMuslim = isNonMuslim(religion)
        if (typeRule.requireMuslim && nonMuslim) {
            Toast.makeText(context, "Tidak berlaku untuk siswa non muslim.", Toast.LENGTH_LONG).show()
            return
        }

        val eligible = typeRule.eligibleGender.trim().lowercase(Locale.ROOT)
        if (eligible == "male" && !isMaleStudent(gender)) {
            Toast.makeText(context, "Khusus siswa putra.", Toast.LENGTH_LONG).show()
            return
        }
        if (eligible == "female" && !isFemaleStudent(gender)) {
            Toast.makeText(context, "Khusus siswa putri.", Toast.LENGTH_LONG).show()
            return
        }

        val (activeToday, effectiveSchedule) = resolveActiveRule(prayerType, todayKey, mappedDay, studentClass, schedules, overrides, classLabelMap)
        if (!activeToday) {
            Toast.makeText(context, "Hari ini tidak ada jadwal untuk kelas anda.", Toast.LENGTH_LONG).show()
            return
        }

        val useSchedule = effectiveSchedule ?: schedule
        val start = useSchedule?.startTime?.ifBlank { "07:00" } ?: "07:00"
        val end = useSchedule?.endTime?.ifBlank { "07:30" } ?: "07:30"
        if (!isTimeInWindow(current, start, end)) {
            Toast.makeText(context, "Presensi hanya tersedia pada jam $start - $end.", Toast.LENGTH_LONG).show()
            return
        }

        if (typeRule.locationRequired) {
            val dist = distanceMeters
            if (coords == null || dist == null) {
                Toast.makeText(context, "Silakan cek lokasi dulu.", Toast.LENGTH_LONG).show()
                return
            }
            if (mockLocationDetected) {
                Toast.makeText(context, "Lokasi palsu terdeteksi. Presensi diblokir.", Toast.LENGTH_LONG).show()
                return
            }
            if (dist > musholla.radiusMeters) {
                Toast.makeText(context, "Anda harus berada di area musholla untuk presensi.", Toast.LENGTH_LONG).show()
                return
            }
        }

        if (!isDeviceTimeTrusted(context)) {
            Toast.makeText(context, "Aktifkan tanggal otomatis dan zona waktu otomatis sebelum presensi.", Toast.LENGTH_LONG).show()
            return
        }

        isSubmitting = true
        val now = System.currentTimeMillis()
        val recordId = sanitizeRecordId("${canonical}_${studentWriteId.trim()}_${todayKey}_${prayerType}")
        val normalizedCredential = studentCredential.trim()
        val isNumeric = normalizedCredential.isNotBlank() && normalizedCredential.all { it.isDigit() }
        val nisnValue = if (isNumeric) normalizedCredential else ""
        val usernameValue = if (!isNumeric) normalizedCredential else ""

        val payload = hashMapOf<String, Any?>(
            "schoolId" to canonical,
            "studentId" to studentWriteId.trim().ifBlank { studentId.trim() },
            "nisn" to nisnValue,
            "username" to usernameValue,
            "studentNameSnapshot" to studentName.trim().ifBlank { null },
            "classNameSnapshot" to studentClass.trim().ifBlank { null },
            "genderSnapshot" to gender.trim().ifBlank { null },
            "prayerType" to prayerType,
            "dateKey" to todayKey,
            "date" to now,
            "status" to "PRAY",
            "lat" to (coords?.first ?: null),
            "lng" to (coords?.second ?: null),
            "accuracy" to locationAccuracy,
            "provider" to locationProvider,
            "isMockLocation" to mockLocationDetected,
            "deviceTimeTrusted" to true,
            "deviceId" to SecurityUtils.getDeviceBindingId(context),
            "recordedBy" to "APP_NATIVE_V2",
            "createdAt" to now,
            "updatedAt" to now
        )

        val updates = mapOf<String, Any?>(
            "prayer_attendance_v2/$recordId" to payload,
            "prayer_attendance_v2_by_school/$canonical/$recordId" to payload
        )
        db.reference.updateChildren(updates)
            .addOnSuccessListener {
                Toast.makeText(context, "Presensi berhasil dicatat.", Toast.LENGTH_LONG).show()
                isSubmitting = false
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Gagal presensi: ${e.message}", Toast.LENGTH_LONG).show()
                isSubmitting = false
            }
    }

    val pageBackground = remember {
        Brush.verticalGradient(
            colors = listOf(
                Color(0xFF12D6C6),
                Color(0xFF0F7BFF),
                Color(0xFF0F2A43)
            )
        )
    }

    val today = remember { Calendar.getInstance() }
    val todayKey = remember { toYmd(today) }
    val mappedDay = remember {
        when (today.get(Calendar.DAY_OF_WEEK)) {
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

    val typeDhuha = types["DHUHA"] ?: PrayerV2Type(false, true, "all", true)
    val typeJumat = types["JUMAT"] ?: PrayerV2Type(false, true, "male", true)

    val nonMuslim = isNonMuslim(religion)
    val isMale = isMaleStudent(gender)
    val isFemale = isFemaleStudent(gender)

    val (dhuhaActive, dhuhaSchedule) = resolveActiveRule("DHUHA", todayKey, mappedDay, studentClass, schedules, overrides, classLabelMap)
    val (jumatActive, jumatSchedule) = resolveActiveRule("JUMAT", todayKey, mappedDay, studentClass, schedules, overrides, classLabelMap)

    val dhuhaWindow = toReadableTimeWindow(dhuhaSchedule?.startTime ?: "07:00", dhuhaSchedule?.endTime ?: "07:30")
    val jumatWindow = toReadableTimeWindow(jumatSchedule?.startTime ?: "07:00", jumatSchedule?.endTime ?: "07:30")

    fun buildItem(
        title: String,
        prayerType: String,
        typeRule: PrayerV2Type,
        activeToday: Boolean,
        activeSchedule: PrayerV2Schedule?,
        timeLabel: String,
        currentStatus: String?
    ): PrayerItemState {
        val already = currentStatus?.trim()?.uppercase(Locale.ROOT) == "PRAY"
        if (!typeRule.enabled) {
            return PrayerItemState(title, prayerType, false, false, timeLabel, "Nonaktif", false, "Fitur belum diaktifkan admin")
        }
        if (typeRule.requireMuslim && nonMuslim) {
            return PrayerItemState(title, prayerType, true, false, timeLabel, "Tidak berlaku", false, "Non muslim")
        }
        val eligible = typeRule.eligibleGender.trim().lowercase(Locale.ROOT)
        if (eligible == "male" && !isMale) {
            return PrayerItemState(title, prayerType, true, false, timeLabel, "Tidak wajib", false, "Khusus putra")
        }
        if (eligible == "female" && !isFemale) {
            return PrayerItemState(title, prayerType, true, false, timeLabel, "Tidak wajib", false, "Khusus putri")
        }
        if (!activeToday) {
            return PrayerItemState(title, prayerType, true, false, timeLabel, "Tidak dijadwalkan", false, "Tidak ada jadwal hari ini")
        }
        
        val start = activeSchedule?.startTime?.ifBlank { "07:00" } ?: "07:00"
        val end = activeSchedule?.endTime?.ifBlank { "07:30" } ?: "07:30"
        val inWindow = isTimeInWindow(Calendar.getInstance(), start, end)

        if (already) {
            return PrayerItemState(title, prayerType, true, true, timeLabel, "Sudah Presensi", false, "Sudah presensi hari ini")
        }
        
        if (!inWindow) {
            return PrayerItemState(title, prayerType, true, true, timeLabel, "Di luar jam operasional", false, "Waktu presensi $start - $end")
        }
        
        return PrayerItemState(title, prayerType, true, true, timeLabel, "Belum Presensi", true, "")
    }

    val dhuhaItem = buildItem("Sholat Dhuha", "DHUHA", typeDhuha, dhuhaActive, dhuhaSchedule, dhuhaWindow, dhuhaStatus)
    val jumatItem = buildItem("Sholat Jum'at", "JUMAT", typeJumat, jumatActive, jumatSchedule, jumatWindow, jumatStatus)

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
                    title = { Text("Presensi Dhuha & Jum'at", fontWeight = FontWeight.Bold) },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(pageBackground)
                .padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.10f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "Tanggal: $todayKey",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.White.copy(alpha = 0.9f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Lokasi musholla: radius ${musholla.radiusMeters.toInt()}m",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.75f)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Button(
                                onClick = { checkLocation() },
                                enabled = !isChecking,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.White.copy(alpha = 0.18f),
                                    contentColor = Color.White
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                if (isChecking) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(18.dp),
                                        color = Color.White,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text("Mengecek lokasi...")
                                } else {
                                    Icon(Icons.Default.LocationOn, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Cek Lokasi Musholla")
                                }
                            }

                            val dist = distanceMeters
                            if (coords != null && dist != null) {
                                Spacer(modifier = Modifier.height(10.dp))
                                val inside = dist <= musholla.radiusMeters && !mockLocationDetected
                                val label = if (inside) "Di dalam area musholla" else "Di luar area musholla"
                                val color = if (inside) Color(0xFF69F0AE) else Color(0xFFFF8A80)
                                Text(
                                    text = "$label • ${dist.toInt()}m",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = color,
                                    maxLines = 1
                                )
                            }
                            if (mockLocationDetected) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Lokasi palsu terdeteksi. Presensi diblokir.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFFF44336)
                                )
                            }
                        }
                    }
                }

                item {
                    PrayerItemCard(
                        item = dhuhaItem,
                        onSubmit = { submitPrayer("DHUHA", dhuhaSchedule) },
                        isSubmitting = isSubmitting,
                        needsLocation = typeDhuha.locationRequired
                    )
                }
                item {
                    PrayerItemCard(
                        item = jumatItem,
                        onSubmit = { submitPrayer("JUMAT", jumatSchedule) },
                        isSubmitting = isSubmitting,
                        needsLocation = typeJumat.locationRequired
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            if (loadingConfig) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.25f)),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F2A43).copy(alpha = 0.85f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(text = "Memuat konfigurasi...", color = Color.White)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PrayerItemCard(
    item: PrayerItemState,
    onSubmit: () -> Unit,
    isSubmitting: Boolean,
    needsLocation: Boolean
) {
    val statusColor = when (item.statusLabel) {
        "Sudah Presensi" -> Color(0xFF69F0AE)
        "Belum Presensi" -> Color(0xFFFFD54F)
        "Tidak dijadwalkan" -> Color.White.copy(alpha = 0.7f)
        else -> Color.White.copy(alpha = 0.8f)
    }
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.10f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Jam: ${item.timeWindowLabel}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.75f)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = item.statusLabel,
                        style = MaterialTheme.typography.bodyMedium,
                        color = statusColor,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (item.disableReason.isNotBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = item.disableReason,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.65f)
                        )
                    } else if (needsLocation) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Wajib berada di musholla",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.65f)
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(12.dp))
                        .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = item.prayerType,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onSubmit,
                enabled = item.canSubmit && !isSubmitting,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (item.canSubmit) Color(0xFF0F7BFF) else Color.White.copy(alpha = 0.12f),
                    contentColor = Color.White,
                    disabledContainerColor = Color.White.copy(alpha = 0.12f),
                    disabledContentColor = Color.White.copy(alpha = 0.6f)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isSubmitting && item.canSubmit) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Menyimpan...")
                } else {
                    Text("Presensi")
                }
            }
        }
    }
}
