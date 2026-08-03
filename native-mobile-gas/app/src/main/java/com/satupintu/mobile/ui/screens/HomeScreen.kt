package com.satupintu.mobile.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.CircleShape
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.utils.SecurePreferences
import com.satupintu.mobile.ui.viewmodel.TeacherNotificationViewModel

import androidx.compose.ui.res.painterResource
import androidx.compose.ui.graphics.Brush
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Image
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.layout.ContentScale
import com.satupintu.mobile.R
import com.satupintu.mobile.BuildConfig

/** Shared home-menu icon box so guru/siswa tiles stay visually consistent. */
private val HomeMenuIconMaxSize = 96.dp
private val HomeMenuIconPanelHeight = 110.dp

data class StudentFeatureItem(
    val title: String,
    val iconVector: ImageVector? = null,
    val iconRes: Int? = null,
    val route: String,
    val color: Color,
    val subtitle: String = "",
    val badgeCount: Int = 0
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(onNavigate: (String) -> Unit, onLogout: () -> Unit) {
    val context = LocalContext.current
    val auth = FirebaseAuth.getInstance()
    val colorScheme = MaterialTheme.colorScheme
    val allowed = SecurityUtils.normalizeAudienceFlavor(BuildConfig.FLAVOR)
    
    // --- MANDATORY PERMISSION & GPS CHECK ---
    var showPermissionDialog by remember { mutableStateOf(false) }
    var showGpsDialog by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        // If any required permission is denied, show dialog again
        val allGranted = result.values.all { it }
        if (!allGranted) {
            showPermissionDialog = true
        }
    }

    fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            showPermissionDialog = true
        }
    }

    fun checkGps() {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        if (!isGpsEnabled) {
            showGpsDialog = true
        }
    }

    LaunchedEffect(Unit) {
        checkAndRequestPermissions()
        checkGps()
    }

    if (showPermissionDialog) {
        AlertDialog(
            onDismissRequest = { /* Mandatory: do not dismiss */ },
            title = { Text("Izin Diperlukan (Wajib)") },
            text = { Text("Agar Anda menerima notifikasi penting dari sekolah dan fitur Absensi berjalan lancar, mohon izinkan Notifikasi dan Lokasi.") },
            confirmButton = {
                TextButton(onClick = {
                    showPermissionDialog = false
                    val permissions = mutableListOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        permissions.add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                    permissionLauncher.launch(permissions.toTypedArray())
                }) {
                    Text("Izinkan Sekarang")
                }
            }
        )
    }

    if (showGpsDialog) {
        AlertDialog(
            onDismissRequest = { /* Mandatory: do not dismiss */ },
            title = { Text("GPS Wajib Aktif") },
            text = { Text("Aplikasi ini membutuhkan GPS yang aktif untuk fitur Absensi.") },
            confirmButton = {
                TextButton(onClick = {
                    val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                    context.startActivity(intent)
                }) {
                    Text("Buka Pengaturan")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    checkGps()
                }) {
                    Text("Cek Status GPS")
                }
            }
        )
    }
    // ----------------------------------------

    var userName by remember { mutableStateOf("Memuat...") }
    var userRole by remember { mutableStateOf("") }
    var userClass by remember { mutableStateOf("") }
    var userUsername by remember { mutableStateOf("") }
    var userNisn by remember { mutableStateOf("") }
    var userSchoolName by remember { mutableStateOf("") }
    var announcementText by remember { mutableStateOf("Memuat pengumuman...") }
    var isOsis by remember { mutableStateOf(false) }

    val teacherNotificationViewModel: TeacherNotificationViewModel = viewModel()
    val teacherNotifications by teacherNotificationViewModel.notifications.collectAsState()
    val teacherNotifBadgeCount = teacherNotifications.size

    LaunchedEffect(userRole) {
        if (userRole == "Guru") {
            val prefs = SecurePreferences.getSessionPrefs(context)
            val teacherKey = SecurityUtils.getStoredTeacherKey(prefs)
                .ifBlank { SecurityUtils.getStoredLoginKey(prefs) }
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)
            if (teacherKey.isNotBlank() && schoolId.isNotBlank()) {
                teacherNotificationViewModel.loadNotifications(teacherKey, schoolId)
            }
        }
    }

    // Fetch User Data logic
    LaunchedEffect(Unit) {
        val prefs = SecurePreferences.getSessionPrefs(context)
        if (SecurityUtils.isSessionExpired(prefs)) {
            prefs.edit().clear().apply()
            auth.signOut()
            onLogout()
            return@LaunchedEffect
        }
        val credential = SecurityUtils.getStoredLoginKey(prefs)
        val studentSessionId = SecurityUtils.getStoredStudentId(prefs).ifBlank { credential }
        val studentSessionClass = prefs.getString("user_student_class", "") ?: ""
        val sessionSchoolName = prefs.getString("user_school_name", "") ?: ""
        val sessionSchoolId = SecurityUtils.getStoredSchoolId(prefs)
        val storedRoleKey = SecurityUtils.getStoredRole(prefs)

        val ok = when (allowed) {
            "siswa" -> storedRoleKey == "student"
            "guru" -> storedRoleKey == "teacher" || storedRoleKey == "staff"
            else -> true
        }
        if (!ok) {
            prefs.edit().clear().apply()
            auth.signOut()
            onLogout()
            return@LaunchedEffect
        }
        
        userNisn = credential
        userSchoolName = sessionSchoolName.trim()
        
        val db = FirebaseDatabase.getInstance()

        fun readString(snapshot: DataSnapshot, vararg keys: String): String {
            for (key in keys) {
                val value = snapshot.child(key).getValue(String::class.java)?.trim()
                if (!value.isNullOrEmpty()) return value
            }
            return ""
        }

        fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()
        fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()
        fun normalizeSchoolName(value: String?): String = value?.trim().orEmpty()

        fun loadInboxAnnouncement(rolePath: String, identityCandidates: Set<String>) {
            val normalizedSchoolId = normalizeScope(sessionSchoolId)
            val candidates = identityCandidates.map { normalizeIdentity(it) }.filter { it.isNotBlank() }.toSet()
            if (normalizedSchoolId.isBlank() || candidates.isEmpty()) {
                announcementText = "Tidak ada pengumuman terbaru."
                return
            }

            val latestById = linkedMapOf<String, Pair<Long, String>>()
            fun refreshAnnouncement() {
                val best = latestById.values.maxByOrNull { it.first }
                announcementText = best?.second?.takeIf { it.isNotBlank() } ?: "Tidak ada pengumuman terbaru."
            }

            candidates.forEach { identity ->
                db.getReference("gas/schools/$normalizedSchoolId/notification_inbox/$rolePath/$identity")
                    .addValueEventListener(object : ValueEventListener {
                        override fun onDataChange(annoSnapshot: DataSnapshot) {
                            try {
                                for (child in annoSnapshot.children) {
                                    val id = child.key.orEmpty()
                                    if (id.isBlank()) continue
                                    val content = child.child("message").getValue(String::class.java)?.trim().orEmpty()
                                        .ifBlank { child.child("content").getValue(String::class.java)?.trim().orEmpty() }
                                    if (content.isBlank()) continue
                                    val sentAt = child.child("sentAt").getValue(Long::class.java)
                                        ?: child.child("deliveredAt").getValue(Long::class.java)
                                        ?: child.child("date").getValue(Long::class.java)
                                        ?: 0L
                                    latestById[id] = sentAt to content
                                }
                                refreshAnnouncement()
                            } catch (e: Exception) {
                                announcementText = "Gagal memuat pengumuman."
                                e.printStackTrace()
                            }
                        }

                        override fun onCancelled(error: DatabaseError) {
                            announcementText = "Gagal memuat pengumuman."
                        }
                    })
            }
        }

        fun loadStudentAnnouncement(studentClassName: String) {
            val candidates = SecurityUtils.getStoredStudentAliases(prefs) + setOf(
                normalizeIdentity(credential),
                normalizeIdentity(studentSessionId)
            )
            loadInboxAnnouncement("student", candidates)
        }

        fun checkOsisMembership(nisn: String) {
            val aliases = (SecurityUtils.getStoredStudentAliases(prefs) + setOf(nisn.trim()))
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .toSet()
            if (aliases.isEmpty()) {
                isOsis = false
                prefs.edit().putBoolean("user_is_osis_staff", false).apply()
                return
            }

            fun updateOsisMembership(active: Boolean) {
                isOsis = active
                prefs.edit().putBoolean("user_is_osis_staff", active).apply()
            }

            fun parseActive(snapshot: DataSnapshot): Boolean {
                val role = snapshot.child("role").getValue(String::class.java)?.trim()?.lowercase().orEmpty()
                if (role.isNotEmpty() && role != "osis" && role != "petugas osis") return false

                val boolActive = snapshot.child("isActive").getValue(Boolean::class.java)
                if (boolActive != null) return boolActive

                val status = snapshot.child("status").getValue(String::class.java)?.trim()?.lowercase().orEmpty()
                if (status.isBlank()) return true
                if (status == "nonaktif" || status == "inactive" || status == "false" || status == "0") return false
                if (status == "aktif" || status == "active" || status == "true" || status == "1") return true
                return true
            }

            fun findMatchingStaff(snapshot: DataSnapshot): DataSnapshot? {
                if (!snapshot.exists()) return null

                val isSingleStaffNode = snapshot.hasChild("role") ||
                    snapshot.hasChild("status") ||
                    snapshot.hasChild("isActive") ||
                    snapshot.hasChild("nisn") ||
                    snapshot.hasChild("username")

                val candidates = if (isSingleStaffNode) snapshot.children.toList().let { listOf(snapshot) } else snapshot.children.toList()

                return candidates.firstOrNull { node ->
                    val identityCandidates = linkedSetOf(
                        node.key.orEmpty(),
                        node.child("nisn").getValue(String::class.java).orEmpty(),
                        node.child("username").getValue(String::class.java).orEmpty(),
                        node.child("id").getValue(String::class.java).orEmpty(),
                        node.child("studentId").getValue(String::class.java).orEmpty()
                    ).map { it.trim() }.filter { it.isNotBlank() }

                    identityCandidates.any { candidate ->
                        aliases.any { alias -> candidate.equals(alias, ignoreCase = true) }
                    }
                }
            }

            fun processRealtimeSnapshot(snapshot: DataSnapshot) {
                val staffNode = findMatchingStaff(snapshot)
                updateOsisMembership(staffNode?.let { parseActive(it) } == true)
            }

            if (sessionSchoolId.isNotBlank()) {
                val staffRef = db.getReference("gas/schools/$sessionSchoolId/staff")
                staffRef.addValueEventListener(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        processRealtimeSnapshot(snapshot)
                    }

                    override fun onCancelled(error: DatabaseError) {
                        updateOsisMembership(false)
                    }
                })
            } else {
                val masterStaffRef = db.getReference("master_staff")
                masterStaffRef.addValueEventListener(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        processRealtimeSnapshot(snapshot)
                    }

                    override fun onCancelled(error: DatabaseError) {
                        updateOsisMembership(false)
                    }
                })
            }
        }

        fun loadTeacherAnnouncement() {
            val candidates = setOf(
                SecurityUtils.getStoredTeacherKey(prefs),
                normalizeIdentity(credential)
            )
            loadInboxAnnouncement("teacher", candidates)
        }

        fun checkStudentAndTeacher() {
            if (credential.isNotEmpty()) {
                if (storedRoleKey == "student") {
                    fun applyStudentData(snapshot: DataSnapshot) {
                        userName = readString(snapshot, "name", "nama").ifEmpty { "Siswa" }
                        userClass = readString(snapshot, "class", "kelas").ifEmpty { "-" }
                        userSchoolName = normalizeSchoolName(
                            readString(snapshot, "schoolName", "school_name")
                        ).ifBlank { userSchoolName }
                        userUsername = readString(snapshot, "username")
                        userRole = "Siswa"
                        checkOsisMembership(credential)
                        loadStudentAnnouncement(userClass)
                    }

                    fun searchLegacyStudents() {
                        val studentsRef = db.getReference("students")
                        studentsRef.child(credential).addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(legacyDirectSnapshot: DataSnapshot) {
                                if (legacyDirectSnapshot.exists()) {
                                    applyStudentData(legacyDirectSnapshot)
                                    return
                                }

                                studentsRef.orderByChild("nisn").equalTo(credential).addListenerForSingleValueEvent(object : ValueEventListener {
                                    override fun onDataChange(legacySnapshot: DataSnapshot) {
                                        if (legacySnapshot.exists()) {
                                            applyStudentData(legacySnapshot.children.first())
                                        } else {
                                            studentsRef.orderByChild("username").equalTo(credential).addListenerForSingleValueEvent(object : ValueEventListener {
                                                override fun onDataChange(usernameSnapshot: DataSnapshot) {
                                                    if (usernameSnapshot.exists()) {
                                                        applyStudentData(usernameSnapshot.children.first())
                                                    } else {
                                                        userName = prefs.getString("user_display_name", "")?.takeIf { it.isNotBlank() } ?: auth.currentUser?.email?.takeIf { it.isNotBlank() } ?: "Siswa"
                                                        userRole = "Siswa"
                                                        userClass = prefs.getString("user_student_class", "") ?: "-"
                                                        checkOsisMembership(credential)
                                                        loadStudentAnnouncement(userClass)
                                                    }
                                                }
                                                override fun onCancelled(error: DatabaseError) {
                                                    userName = prefs.getString("user_display_name", "")?.takeIf { it.isNotBlank() } ?: auth.currentUser?.email?.takeIf { it.isNotBlank() } ?: "Siswa"
                                                    userRole = "Siswa"
                                                    userClass = prefs.getString("user_student_class", "") ?: "-"
                                                    checkOsisMembership(credential)
                                                    loadStudentAnnouncement(userClass)
                                                }
                                            })
                                        }
                                    }
                                    override fun onCancelled(error: DatabaseError) {}
                                })
                            }
                            override fun onCancelled(error: DatabaseError) {}
                        })
                    }

                    fun searchMasterStudents() {
                        val masterStudentRef = db.getReference("master_students").child(credential)
                        masterStudentRef.addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(snapshot: DataSnapshot) {
                                if (snapshot.exists()) {
                                    applyStudentData(snapshot)
                                } else {
                                    db.getReference("master_students").orderByChild("nisn").equalTo(credential)
                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                            override fun onDataChange(masterQuerySnapshot: DataSnapshot) {
                                                if (masterQuerySnapshot.exists()) {
                                                    applyStudentData(masterQuerySnapshot.children.first())
                                                } else {
                                                    db.getReference("master_students").orderByChild("username").equalTo(credential)
                                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                                            override fun onDataChange(usernameSnapshot: DataSnapshot) {
                                                                if (usernameSnapshot.exists()) {
                                                                    applyStudentData(usernameSnapshot.children.first())
                                                                } else {
                                                                    searchLegacyStudents()
                                                                }
                                                            }
                                                            override fun onCancelled(error: DatabaseError) { searchLegacyStudents() }
                                                        })
                                                }
                                            }
                                            override fun onCancelled(error: DatabaseError) { searchLegacyStudents() }
                                        })
                                }
                            }
                            override fun onCancelled(error: DatabaseError) { searchLegacyStudents() }
                        })
                    }

                    if (sessionSchoolId.isNotBlank()) {
                        val tenantRef = db.getReference("gas/schools/$sessionSchoolId/students").child(credential)
                        tenantRef.addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(snapshot: DataSnapshot) {
                                if (snapshot.exists()) {
                                    applyStudentData(snapshot)
                                } else {
                                    db.getReference("gas/schools/$sessionSchoolId/students").orderByChild("nisn").equalTo(credential)
                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                            override fun onDataChange(tenantQuerySnapshot: DataSnapshot) {
                                                if (tenantQuerySnapshot.exists()) {
                                                    applyStudentData(tenantQuerySnapshot.children.first())
                                                } else {
                                                    db.getReference("gas/schools/$sessionSchoolId/students").orderByChild("username").equalTo(credential)
                                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                                            override fun onDataChange(usernameSnapshot: DataSnapshot) {
                                                                if (usernameSnapshot.exists()) {
                                                                    applyStudentData(usernameSnapshot.children.first())
                                                                } else {
                                                                    searchMasterStudents()
                                                                }
                                                            }
                                                            override fun onCancelled(error: DatabaseError) { searchMasterStudents() }
                                                        })
                                                }
                                            }
                                            override fun onCancelled(error: DatabaseError) { searchMasterStudents() }
                                        })
                                }
                            }
                            override fun onCancelled(error: DatabaseError) { searchMasterStudents() }
                        })
                    } else {
                        searchMasterStudents()
                    }
                } else {
                    fun applyTeacherData(snapshot: DataSnapshot) {
                        userName = readString(snapshot, "name", "nama").ifEmpty { "Guru" }
                        userRole = "Guru"
                        userClass = readString(snapshot, "homeroomClass", "class", "kelas", "wali_kelas")
                        userSchoolName = normalizeSchoolName(
                            readString(snapshot, "schoolName", "school_name")
                        ).ifBlank { userSchoolName }
                        isOsis = false
                        loadTeacherAnnouncement()
                    }

                    fun searchMasterTeachers() {
                        val masterTeacherRef = db.getReference("master_teachers").child(credential)
                        masterTeacherRef.addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(snapshot: DataSnapshot) {
                                if (snapshot.exists()) {
                                    applyTeacherData(snapshot)
                                } else {
                                    db.getReference("master_teachers").orderByChild("nuptk").equalTo(credential)
                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                            override fun onDataChange(masterTeacherSnapshot: DataSnapshot) {
                                                if (masterTeacherSnapshot.exists()) {
                                                    applyTeacherData(masterTeacherSnapshot.children.first())
                                                } else {
                                                    val teachersRef = db.getReference("teachers")
                                                    teachersRef.child(credential).addListenerForSingleValueEvent(object : ValueEventListener {
                                                        override fun onDataChange(legacyTeacherDirectSnapshot: DataSnapshot) {
                                                            if (legacyTeacherDirectSnapshot.exists()) {
                                                                applyTeacherData(legacyTeacherDirectSnapshot)
                                                                return
                                                            }

                                                            teachersRef.orderByChild("nuptk").equalTo(credential).addListenerForSingleValueEvent(object : ValueEventListener {
                                                                override fun onDataChange(teacherSnapshot: DataSnapshot) {
                                                                    if (teacherSnapshot.exists()) {
                                                                        applyTeacherData(teacherSnapshot.children.first())
                                                                    } else {
                                                                        userName = auth.currentUser?.email ?: "User"
                                                                        isOsis = false
                                                                    }
                                                                }

                                                                override fun onCancelled(error: DatabaseError) {}
                                                            })
                                                        }

                                                        override fun onCancelled(error: DatabaseError) {}
                                                    })
                                                }
                                            }

                                            override fun onCancelled(error: DatabaseError) {}
                                        })
                                }
                            }

                            override fun onCancelled(error: DatabaseError) {}
                        })
                    }

                    if (sessionSchoolId.isNotBlank()) {
                        val tenantRef = db.getReference("gas/schools/$sessionSchoolId/teachers").child(credential)
                        tenantRef.addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(snapshot: DataSnapshot) {
                                if (snapshot.exists()) {
                                    applyTeacherData(snapshot)
                                } else {
                                    db.getReference("gas/schools/$sessionSchoolId/teachers").orderByChild("nuptk").equalTo(credential)
                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                            override fun onDataChange(querySnapshot: DataSnapshot) {
                                                if (querySnapshot.exists()) {
                                                    applyTeacherData(querySnapshot.children.first())
                                                } else {
                                                    db.getReference("gas/schools/$sessionSchoolId/teachers").orderByChild("username").equalTo(credential)
                                                        .addListenerForSingleValueEvent(object : ValueEventListener {
                                                            override fun onDataChange(unameSnapshot: DataSnapshot) {
                                                                if (unameSnapshot.exists()) {
                                                                    applyTeacherData(unameSnapshot.children.first())
                                                                } else {
                                                                    searchMasterTeachers()
                                                                }
                                                            }
                                                            override fun onCancelled(error: DatabaseError) { searchMasterTeachers() }
                                                        })
                                                }
                                            }
                                            override fun onCancelled(error: DatabaseError) { searchMasterTeachers() }
                                        })
                                }
                            }
                            override fun onCancelled(error: DatabaseError) { searchMasterTeachers() }
                        })
                    } else {
                        searchMasterTeachers()
                    }
                }
            } else {
                userName = auth.currentUser?.email ?: "Tamu"
                isOsis = false
            }
        }

        val email = auth.currentUser?.email?.trim().orEmpty()
        val username = email.substringBefore("@").lowercase()
        val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)

        if (username.isNotEmpty()) {
            val staffRef = db.getReference("staff")
            staffRef.orderByChild("username").equalTo(username).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(staffSnapshot: DataSnapshot) {
                    if (staffSnapshot.exists()) {
                        val staffData = staffSnapshot.children.first()
                        val isActive = staffData.child("isActive").getValue(Boolean::class.java) ?: true
                        val registeredDeviceId = staffData.child("deviceId").getValue(String::class.java).orEmpty()

                        if (isActive && registeredDeviceId.isNotEmpty() && registeredDeviceId == deviceId) {
                            userName = staffData.child("name").getValue(String::class.java) ?: "Petugas Tatib"
                            userRole = "Staff"
                            userClass = "Tim Ketertiban"
                            userSchoolName = normalizeSchoolName(
                                staffData.child("schoolName").getValue(String::class.java)
                            ).ifBlank { userSchoolName }
                            announcementText = "Selamat bekerja, tegakkan kedisiplinan!"
                            isOsis = false
                            return
                        }
                    }
                    checkStudentAndTeacher()
                }

                override fun onCancelled(error: DatabaseError) {
                    checkStudentAndTeacher()
                }
            })
        } else {
            checkStudentAndTeacher()
        }
    }

    val accentBlue = colorScheme.primary
    val accentTeal = colorScheme.tertiary
    val accentGold = colorScheme.secondary
    val accentViolet = Color(0xFF4C3D8F)
    val accentIndigo = Color(0xFF1E40AF)
    val accentRed = Color(0xFFB42318)
    val accentOrange = Color(0xFFC2410C)

    val baseStudentFeatures = listOf(
        StudentFeatureItem(title = "Absensi", iconRes = R.drawable.ic_menu_absensi, route = "attendance", color = accentBlue),
        StudentFeatureItem(title = "Presensi Sholat", iconRes = R.drawable.ic_menu_presensi_sholat, route = "prayer", color = accentTeal),
        StudentFeatureItem(title = "Lentera Digital", iconRes = R.drawable.ic_menu_lentera_digital, route = "library", color = accentTeal),
        StudentFeatureItem(title = "7 KAIH", iconRes = R.drawable.ic_menu_kaih7, route = "seven_habits", color = accentIndigo),
        StudentFeatureItem(title = "Virtual Pet", iconRes = R.drawable.ic_menu_virtual_pet, route = "virtual_pet", color = accentGold),
        StudentFeatureItem(title = "Kedisiplinan", iconRes = R.drawable.ic_menu_kedisiplinan, route = "discipline", color = accentViolet),
        StudentFeatureItem(title = "Layanan Aduan", iconRes = R.drawable.ic_menu_layanan_aduan, route = "halo_spentgapa", color = accentRed),
        StudentFeatureItem(title = "Notifikasi", iconRes = R.drawable.ic_menu_notifikasi, route = "notifications", color = accentOrange),
        StudentFeatureItem(title = "Tools", iconRes = R.drawable.ic_menu_tools, route = "tools", color = accentGold)
    )
    val studentFeatures = if (isOsis) {
        baseStudentFeatures + StudentFeatureItem(
            title = "Catat Pelanggaran",
            iconRes = R.drawable.ic_menu_catat_pelanggaran,
            route = "osis_discipline",
            color = accentRed
        )
    } else {
        baseStudentFeatures
    }

    val teacherFeatures = listOf(
        StudentFeatureItem(title = "Data Siswa", iconRes = R.drawable.ic_menu_data_siswa, route = "teacher_student_list", color = accentBlue),
        StudentFeatureItem(title = "Presensi Siswa", iconRes = R.drawable.ic_menu_absensi, route = "teacher_attendance", color = accentTeal),
        StudentFeatureItem(title = "Presensi Sholat", iconRes = R.drawable.ic_menu_presensi_sholat, route = "teacher_prayer", color = accentIndigo),
        StudentFeatureItem(title = "Literasi & Tugas", iconRes = R.drawable.ic_menu_lentera_digital, route = "teacher_literacy", color = accentViolet),
        StudentFeatureItem(title = "7 KAIH", iconRes = R.drawable.ic_menu_kaih7, route = "teacher_seven_habits", color = accentIndigo),
        StudentFeatureItem(title = "Kedisiplinan", iconRes = R.drawable.ic_menu_kedisiplinan, route = "teacher_discipline", color = accentRed),
        StudentFeatureItem(title = "Layanan Aduan", iconRes = R.drawable.ic_menu_layanan_aduan, route = "teacher_bullying_reports", color = accentGold),
        StudentFeatureItem(
            title = "Notifikasi",
            iconRes = R.drawable.ic_menu_notifikasi,
            route = "teacher_notifications",
            color = accentOrange,
            badgeCount = teacherNotifBadgeCount
        ),
        StudentFeatureItem(title = "Rekapitulasi", iconRes = R.drawable.ic_menu_rekapitulasi, route = "teacher_recap", color = accentBlue)
    )

    val staffFeatures = listOf(
        StudentFeatureItem(title = "Input Pelanggaran", iconRes = R.drawable.ic_menu_kedisiplinan, route = "staff_discipline", color = accentRed),
        StudentFeatureItem(title = "Data Pelanggaran", iconRes = R.drawable.ic_menu_absensi, route = "staff_violation_history", color = accentBlue)
    )
    val screenBackground = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF12D6C6),
            Color(0xFF0F7BFF),
            Color(0xFF0F2A43)
        )
    )
    val activeStatusColor = colorScheme.tertiary
    val teacherHomeroomLabel = remember(userRole, userClass) {
        if (userRole == "Guru" && userClass.isNotBlank() && userClass != "-") "Wali Kelas $userClass" else ""
    }
    val studentClassLabel = remember(userRole, userClass) {
        if (userRole == "Siswa" && userClass.isNotBlank() && userClass != "-") "Kelas $userClass" else ""
    }
    val resolvedSchoolLabel = remember(userSchoolName) {
        userSchoolName.trim().ifBlank { "SMPN 3 Pacet" }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (teacherHomeroomLabel.isNotBlank()) {
                                "Hai, $userName $teacherHomeroomLabel"
                            } else {
                                "Hai, $userName"
                            },
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium, // Smaller font size
                            maxLines = 1,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                        if (studentClassLabel.isNotBlank()) {
                            Text(
                                text = studentClassLabel,
                                style = MaterialTheme.typography.bodySmall,
                                color = colorScheme.onBackground.copy(alpha = 0.8f)
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            val roleText = when (userRole) {
                                "Guru" -> "Guru $resolvedSchoolLabel"
                                "Staff" -> "Staff $resolvedSchoolLabel"
                                else -> "Siswa $resolvedSchoolLabel"
                            }
                            Text(
                                text = roleText,
                                style = MaterialTheme.typography.bodySmall,
                                color = colorScheme.onBackground.copy(alpha = 0.7f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = activeStatusColor.copy(alpha = 0.12f),
                                contentColor = activeStatusColor,
                                shape = RoundedCornerShape(999.dp)
                            ) {
                                Text(
                                    text = "AKTIF",
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = colorScheme.onBackground,
                    actionIconContentColor = colorScheme.onBackground
                ),
                actions = {
                    IconButton(onClick = {
                        // Clear session before logout
                        val prefs = context.getSharedPreferences("app_session", Context.MODE_PRIVATE)
                        prefs.edit().clear().apply()
                        onLogout()
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(screenBackground)
                .padding(paddingValues)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.18f),
                                Color.Transparent
                            ),
                            radius = 1000f,
                            center = androidx.compose.ui.geometry.Offset(160f, 320f)
                        )
                    )
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.12f),
                                Color.Transparent
                            ),
                            radius = 800f,
                            center = androidx.compose.ui.geometry.Offset(980f, 1180f)
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                val isStudentMode = userRole != "Guru" && userRole != "Staff"
                val heroBrush = when (userRole) {
                    "Guru" -> Brush.linearGradient(listOf(colorScheme.primary, colorScheme.tertiary))
                    "Staff" -> Brush.linearGradient(listOf(colorScheme.primary, colorScheme.secondary))
                    else -> Brush.linearGradient(
                        listOf(
                            Color(0xFF12D6C6),
                            Color(0xFF0F7BFF),
                            Color(0xFF0F2A43)
                        )
                    )
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 18.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isStudentMode) Color.White.copy(alpha = 0.18f) else colorScheme.outline
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(heroBrush)
                            .padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                val headerTitle = when (userRole) {
                                    "Guru" -> "Dashboard"
                                    "Staff" -> "Panel Staff"
                                    else -> "Pengumuman Terbaru"
                                }
                                Text(
                                    text = headerTitle,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = when (userRole) {
                                        "Guru", "Staff" -> colorScheme.onPrimary.copy(alpha = 0.95f)
                                        else -> Color.White.copy(alpha = 0.95f)
                                    }
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                if (userRole == "Siswa" || userRole.isEmpty()) {
                                    Text(
                                        text = announcementText,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color.White.copy(alpha = 0.9f),
                                        maxLines = 3,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                    )
                                } else {
                                    val subtitle = when (userRole) {
                                        "Guru" -> "Monitoring aktivitas siswa"
                                        else -> "Input pelanggaran siswa"
                                    }
                                    Text(
                                        text = subtitle,
                                        style = MaterialTheme.typography.titleLarge,
                                        color = colorScheme.onPrimary.copy(alpha = 0.95f)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            val heroIcon = when (userRole) {
                                "Guru" -> Icons.Default.DateRange
                                "Staff" -> Icons.Default.Warning
                                else -> Icons.Default.Notifications
                            }
                            Surface(
                                color = if (isStudentMode) Color.White.copy(alpha = 0.16f) else colorScheme.surface.copy(alpha = 0.35f),
                                shape = RoundedCornerShape(18.dp)
                            ) {
                                Icon(
                                    imageVector = heroIcon,
                                    contentDescription = null,
                                    tint = if (isStudentMode) Color.White else colorScheme.onSurface,
                                    modifier = Modifier.padding(12.dp).size(22.dp)
                                )
                            }
                        }
                    }
                }

                Text(
                    text = when (userRole) {
                        "Guru" -> "Menu Guru"
                        "Staff" -> "Menu Staff"
                        else -> "Menu Siswa"
                    },
                    style = MaterialTheme.typography.titleLarge,
                    color = colorScheme.onBackground,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    val currentFeatures = when (userRole) {
                        "Guru" -> teacherFeatures
                        "Staff" -> staffFeatures
                        else -> studentFeatures
                    }
                    items(currentFeatures) { feature ->
                        StudentFeatureCard(feature) { route ->
                            onNavigate(route)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StudentFeatureCard(
    feature: StudentFeatureItem,
    onClick: (String) -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val outerShape = RoundedCornerShape(24.dp)
    val panelShape = RoundedCornerShape(20.dp)
    val pillShape = RoundedCornerShape(999.dp)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(174.dp)
            .clickable { onClick(feature.route) },
        shape = outerShape,
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF8DC4F6).copy(alpha = 0.30f),
                            Color(0xFF4F9AE8).copy(alpha = 0.24f),
                            Color(0xFF1F5EA8).copy(alpha = 0.34f)
                        )
                    ),
                    shape = outerShape
                )
                .border(
                    width = 1.dp,
                    color = Color.White.copy(alpha = 0.12f),
                    shape = outerShape
                )
        ) {
            if (feature.badgeCount > 0) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp),
                    shape = CircleShape,
                    color = Color(0xFFDC2626)
                ) {
                    Text(
                        text = if (feature.badgeCount > 99) "99+" else feature.badgeCount.toString(),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.18f),
                                Color.Transparent
                            ),
                            radius = 420f
                        ),
                        shape = outerShape
                    )
            )
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(HomeMenuIconPanelHeight)
                        .clip(panelShape)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.12f),
                                    colorScheme.primary.copy(alpha = 0.10f),
                                    Color(0xFF1C5A9A).copy(alpha = 0.18f)
                                )
                            ),
                            shape = panelShape
                        )
                        .border(
                            width = 1.dp,
                            color = Color.White.copy(alpha = 0.20f),
                            shape = panelShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 8.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        Color.White.copy(alpha = 0.06f),
                                        Color.Transparent
                                    )
                                ),
                                shape = RoundedCornerShape(16.dp)
                            )
                            .border(
                                width = 1.dp,
                                color = Color.White.copy(alpha = 0.10f),
                                shape = RoundedCornerShape(16.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (feature.iconRes != null) {
                            Image(
                                painter = painterResource(id = feature.iconRes),
                                contentDescription = feature.title,
                                contentScale = ContentScale.Fit,
                                modifier = Modifier
                                    .size(HomeMenuIconMaxSize)
                                    .clip(RoundedCornerShape(12.dp))
                                    // Mild boost for portrait assets that already include padding.
                                    .scale(1.28f)
                            )
                        } else if (feature.iconVector != null) {
                            Icon(
                                imageVector = feature.iconVector,
                                contentDescription = feature.title,
                                tint = Color.White,
                                modifier = Modifier.size(HomeMenuIconMaxSize)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Surface(
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .height(34.dp),
                    shape = pillShape,
                    color = Color.Transparent,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.28f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        Color.White.copy(alpha = 0.18f),
                                        Color(0xFF9FCAE9).copy(alpha = 0.20f),
                                        Color(0xFF5D91CC).copy(alpha = 0.30f)
                                    )
                                ),
                                shape = pillShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = feature.title,
                            style = MaterialTheme.typography.titleSmall,
                            color = Color.White,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            maxLines = 1
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                if (feature.subtitle.isNotBlank()) {
                    Text(
                        text = feature.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.72f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        maxLines = 1
                    )
                }
            }
        }
    }
}
