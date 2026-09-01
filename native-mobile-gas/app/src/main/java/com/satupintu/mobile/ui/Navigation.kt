package com.satupintu.mobile.ui

import android.app.Activity
import android.content.ContextWrapper
import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.BuildConfig
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.data.model.isDeadByRule
import com.satupintu.mobile.data.repository.VirtualPetRepository
import com.satupintu.mobile.data.service.ForceUpdatePolicy
import com.satupintu.mobile.data.service.VersionCheckService
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.utils.SecurePreferences

@Composable
fun AppNavigation(
    requestedRoute: String? = null,
    onRouteConsumed: (String) -> Unit = {}
) {
    val navController = rememberNavController()
    val context = LocalContext.current
    val prefs = SecurePreferences.getSessionPrefs(context)
    val flavor = SecurityUtils.normalizeAudienceFlavor(BuildConfig.FLAVOR)
    val pendingRoute = requestedRoute?.trim()?.takeIf { it.isNotEmpty() }
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRouteKey = currentBackStackEntry?.destination?.route ?: "login"
    val authUid = runCatching { FirebaseAuth.getInstance().currentUser?.uid.orEmpty() }.getOrDefault("")
    val sessionRole = remember(currentRouteKey, authUid) {
        SecurityUtils.getStoredRole(prefs)
    }
    val sessionSchoolId = remember(currentRouteKey, authUid) {
        SecurityUtils.getStoredSchoolId(prefs)
    }
    val hasTriggeredSchoolLock = remember(sessionRole, sessionSchoolId, authUid) { false }

    LaunchedEffect(flavor) {
        if (SecurityUtils.isSessionExpired(prefs)) {
            runCatching { SecurityUtils.clearLastLoginIdentity(context) }
            prefs.edit().clear().apply()
        }
    }

    val initialRole = prefs.getString("user_role", "") ?: ""
    val initialBoundaryOk = SecurityUtils.isFirebaseProjectAllowed(SecurityUtils.getActiveFirebaseProjectId())
    val initialSessionValid = SecurityUtils.isSessionConsistent(prefs, flavor)
    val initialSessionExpired = SecurityUtils.isSessionExpired(prefs)
    val initialHomeAllowed = SecurityUtils.isRouteAllowed("home", initialRole, flavor, prefs)
    val startDestination = if (initialBoundaryOk && !initialSessionExpired && initialSessionValid && initialHomeAllowed) {
        "home"
    } else {
        "login"
    }

    LaunchedEffect(pendingRoute, startDestination, initialRole, initialBoundaryOk, initialSessionExpired, initialSessionValid) {
        val targetRoute = pendingRoute ?: return@LaunchedEffect
        val canOpenRequestedRoute = initialBoundaryOk &&
            !initialSessionExpired &&
            initialSessionValid &&
            SecurityUtils.isRouteAllowed(targetRoute, initialRole, flavor, prefs)

        if (!canOpenRequestedRoute) return@LaunchedEffect
        if (targetRoute == startDestination) {
            onRouteConsumed(targetRoute)
            return@LaunchedEffect
        }

        navController.navigate(targetRoute) {
            launchSingleTop = true
        }
        onRouteConsumed(targetRoute)
    }

    DisposableEffect(sessionRole, sessionSchoolId, authUid) {
        val schoolScopedRoles = setOf("student", "teacher", "staff", "principal")
        if (authUid.isBlank() || sessionSchoolId.isBlank() || sessionRole !in schoolScopedRoles) {
            return@DisposableEffect onDispose {}
        }

        var isKicked = hasTriggeredSchoolLock
        val schoolRef = FirebaseDatabase.getInstance().getReference("schools").child(sessionSchoolId)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!snapshot.exists() || isKicked) return

                val schoolActive = snapshot.child("isActive").getValue(Boolean::class.java)
                val serviceActive = snapshot.child("serviceStatus").child("serviceActive").getValue(Boolean::class.java)
                if (schoolActive != false && serviceActive != false) return

                isKicked = true
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
                prefs.edit().clear().apply()
                runCatching { FirebaseAuth.getInstance().signOut() }
                Toast.makeText(context, "Layanan sekolah dinonaktifkan oleh Super Admin.", Toast.LENGTH_LONG).show()
                navController.navigate("login") {
                    popUpTo(0) { inclusive = true }
                }
            }

            override fun onCancelled(error: DatabaseError) {}
        }

        schoolRef.addValueEventListener(listener)
        onDispose {
            schoolRef.removeEventListener(listener)
        }
    }

    @Composable
    fun GuardedRoute(route: String, content: @Composable () -> Unit) {
        val role = prefs.getString("user_role", "") ?: ""
        val expired = SecurityUtils.isSessionExpired(prefs)
        val sessionValid = SecurityUtils.isSessionConsistent(prefs, flavor)
        val boundaryOk = SecurityUtils.isFirebaseProjectAllowed(SecurityUtils.getActiveFirebaseProjectId())
        val allowed = boundaryOk && !expired && sessionValid && SecurityUtils.isRouteAllowed(route, role, flavor, prefs)

        LaunchedEffect(route, role, expired, sessionValid, boundaryOk) {
            if (!allowed) {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
                prefs.edit().clear().apply()
                runCatching { FirebaseAuth.getInstance().signOut() }
                if (!boundaryOk) {
                    Toast.makeText(
                        context,
                        "Konfigurasi Firebase aplikasi tidak sesuai boundary ${BuildConfig.MOBILE_BOUNDARY}.",
                        Toast.LENGTH_LONG
                    ).show()
                }
                navController.navigate("login") {
                    popUpTo(0) { inclusive = true }
                }
            } else {
                prefs.edit().apply {
                    SecurityUtils.touchSession(this)
                    apply()
                }
            }
        }

        if (allowed) {
            content()
        }
    }

    val petLockState = rememberStudentPetLockState(prefs).value
    val eduLockAliases = remember(
        sessionRole,
        sessionSchoolId,
        currentRouteKey,
        authUid,
        SecurityUtils.getStoredStudentKey(prefs),
        SecurityUtils.getStoredNisn(prefs),
        SecurityUtils.getStoredLoginKey(prefs)
    ) {
        SecurityUtils.getStoredStudentAliases(prefs)
    }
    val eduLockComplianceState = rememberEduLockComplianceState(
        context = context,
        schoolId = sessionSchoolId,
        aliases = eduLockAliases,
        enabled = sessionRole == "student"
    ).value
    val lastEduLockWarning = remember(sessionRole, sessionSchoolId, authUid) { mutableStateOf("") }
    LaunchedEffect(sessionRole, eduLockComplianceState.warningMessage) {
        val warning = eduLockComplianceState.warningMessage.trim()
        if (sessionRole != "student") {
            lastEduLockWarning.value = ""
            return@LaunchedEffect
        }

        if (warning.isBlank()) {
            lastEduLockWarning.value = ""
            return@LaunchedEffect
        }

        if (warning != lastEduLockWarning.value) {
            lastEduLockWarning.value = warning
            Toast.makeText(context, warning, Toast.LENGTH_LONG).show()
        }
    }
    // Force update HANYA berlaku untuk varian siswa (siswa/legacySiswa).
    // Flavor guru dan kepala sekolah bebas dan kebal dari force update siswa.
    val isStudentFlavor = flavor == "siswa" || flavor == "legacySiswa" || sessionRole == "student"
    val forceUpdatePolicy = rememberForceUpdatePolicy(
        currentVersionCode = BuildConfig.VERSION_CODE,
        enabled = isStudentFlavor
    ).value

    val studentPetViewModel: com.satupintu.mobile.ui.viewmodel.VirtualPetViewModel? = if (sessionRole == "student") {
        val activity = context as? androidx.activity.ComponentActivity
        if (activity != null) {
            androidx.lifecycle.viewmodel.compose.viewModel(viewModelStoreOwner = activity)
        } else {
            androidx.lifecycle.viewmodel.compose.viewModel()
        }
    } else null

    if (sessionRole == "student" && studentPetViewModel != null) {
        val loginKey = SecurityUtils.getStoredLoginKey(prefs)
        LaunchedEffect(loginKey, sessionSchoolId) {
            if (loginKey.isNotBlank()) {
                studentPetViewModel.loadPet(loginKey, sessionSchoolId)
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        NavHost(navController = navController, startDestination = startDestination) {
            gasAppNavGraph(
                navController = navController,
                prefs = prefs,
                flavor = flavor,
                pendingRoute = pendingRoute,
                onRouteConsumed = onRouteConsumed,
                studentPetViewModel = studentPetViewModel,
                guardedRoute = { route, content -> GuardedRoute(route, content) }
            )
        }

        if (sessionRole == "student" && (petLockState.isChecking || petLockState.isDead)) {
            StudentPetLockOverlay(
                isChecking = petLockState.isChecking,
                petName = petLockState.petName,
                studentName = petLockState.studentName,
                onCloseApp = {
                    findActivityFromContext(context)?.let { activity ->
                        runCatching { activity.finishAndRemoveTask() }
                            .onFailure { activity.finish() }
                    }
                }
            )
        }

        if (sessionRole == "student" &&
            (eduLockComplianceState.isChecking || eduLockComplianceState.isBlocked)
        ) {
            EduLockComplianceOverlay(
                state = eduLockComplianceState,
                onOpenEduLock = {
                    if (!openEduLockApp(context)) {
                        Toast.makeText(
                            context,
                            "EduLock belum terpasang. Hubungi Admin Sekolah untuk mendapatkan APK.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                },
                onClose = {
                    (context as? android.app.Activity)?.moveTaskToBack(true)
                },
                onQuickAccessibility = {
                    openEduLockAccessibilitySettings(context)
                },
                onQuickDeviceAdmin = {
                    openDeviceAdminSettings(context)
                }
            )
        }

        // Prioritas tertinggi: force update dari Super Admin khusus varian siswa.
        if (isStudentFlavor && forceUpdatePolicy.updateRequired) {
            ForceUpdateScreen(
                customMessage = forceUpdatePolicy.message,
                downloadUrl = forceUpdatePolicy.downloadUrl
            )
        }
    }
}

@Composable
private fun rememberForceUpdatePolicy(
    currentVersionCode: Int,
    enabled: Boolean = true
): State<ForceUpdatePolicy> {
    val state = remember(currentVersionCode, enabled) {
        mutableStateOf(ForceUpdatePolicy(updateRequired = false))
    }

    if (!enabled) {
        return state
    }

    DisposableEffect(currentVersionCode, enabled) {
        val service = VersionCheckService()
        val listener = service.observeVersionPolicy(currentVersionCode, continuous = true) { policy ->
            state.value = policy
        }
        onDispose {
            service.stopObserving(listener)
        }
    }

    return state
}

private data class StudentPetLockState(
    val isChecking: Boolean = false,
    val isDead: Boolean = false,
    val petName: String = "Sahabat Belajar",
    val studentName: String = "Siswa"
)

@Composable
private fun rememberStudentPetLockState(
    prefs: android.content.SharedPreferences
) = produceState(
    initialValue = StudentPetLockState(
        isChecking = SecurityUtils.getStoredRole(prefs) == "student" &&
            SecurityUtils.getStoredStudentKey(prefs).isNotBlank()
    ),
    SecurityUtils.getStoredRole(prefs),
    SecurityUtils.getStoredSchoolId(prefs),
    SecurityUtils.getStoredStudentKey(prefs),
    SecurityUtils.getStoredNisn(prefs),
    SecurityUtils.getStoredLoginKey(prefs)
) {
    val role = SecurityUtils.getStoredRole(prefs)
    val schoolId = SecurityUtils.getStoredSchoolId(prefs)
    val aliases = SecurityUtils.getStoredStudentAliases(prefs)

    if (role != "student" || aliases.isEmpty()) {
        value = StudentPetLockState(isChecking = false)
        return@produceState
    }

    val studentName = prefs.getString("user_student_name", "")?.ifBlank { "Siswa" } ?: "Siswa"

    val repository = VirtualPetRepository()
    repository.getVirtualPetByStudentIds(aliases, schoolId).collect { pet ->
        value = StudentPetLockState(
            isChecking = false,
            isDead = pet?.let(::isStudentPetLockedDead) == true,
            petName = pet?.petName?.ifBlank { "Sahabat Belajar" } ?: "Sahabat Belajar",
            studentName = studentName
        )
    }
}

private fun isStudentPetLockedDead(pet: VirtualPet): Boolean {
    return pet.isDeadByRule()
}

private tailrec fun findActivityFromContext(context: Any?): Activity? = when (context) {
    is Activity -> context
    is ContextWrapper -> findActivityFromContext(context.baseContext)
    else -> null
}

@Composable
private fun StudentPetLockOverlay(
    isChecking: Boolean,
    petName: String,
    studentName: String,
    onCloseApp: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF03182F).copy(alpha = 0.94f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF071E36)),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                Color(0xFF0D2745),
                                Color(0xFF071E36)
                            )
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = if (isChecking) Color.White.copy(alpha = 0.12f) else Color(0xFFFFE1E1)
                ) {
                    if (isChecking) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .padding(16.dp)
                                .size(28.dp),
                            strokeWidth = 3.dp,
                            color = Color.White
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Pet Terkunci",
                            tint = Color(0xFFB00020),
                            modifier = Modifier
                                .padding(16.dp)
                                .size(28.dp)
                        )
                    }
                }

                Text(
                    text = if (isChecking) "Memeriksa Status Sahabat Belajar" else "Akses APK Ditahan",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text(
                    text = if (isChecking) {
                        "Mohon tunggu, aplikasi sedang memastikan kondisi pet kamu."
                    } else {
                        "Hai! $studentName, pet kamu membutuhkan bantuan admin. Akses APK GAS Siswa baru bisa dipakai lagi setelah pet kamu direvive (dihidupkan kembali)."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.88f)
                )

                if (!isChecking) {
                    Text(
                        text = "Setelah admin menghidupkan kembali (revive) pet kamu, aplikasi akan terbuka otomatis tanpa perlu install ulang.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFFFD8D8)
                    )

                    Button(onClick = onCloseApp) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Tutup",
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Tutup",
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }
        }
    }
}
