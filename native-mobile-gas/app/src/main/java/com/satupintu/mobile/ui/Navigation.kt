package com.satupintu.mobile.ui

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Logout
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
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.BuildConfig
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.data.model.isDeadByRule
import com.satupintu.mobile.data.repository.VirtualPetRepository
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.utils.SecurePreferences
import com.satupintu.mobile.ui.screens.*
import com.satupintu.mobile.ui.screens.teacher.TeacherAttendanceScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherDisciplineScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherLiteracyScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherStudentsScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherBullyingScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherNotificationScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherPrayerScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherSevenHabitsScreen
import com.satupintu.mobile.ui.screens.student.ReportBullyingScreen
import com.satupintu.mobile.ui.screens.student.HaloSpentgapaScreen
import com.satupintu.mobile.ui.screens.student.PrayerScreen
import com.satupintu.mobile.ui.screens.student.ENGLISH_DICTIONARY_ROUTE
import com.satupintu.mobile.ui.screens.student.JAVANESE_DICTIONARY_ROUTE
import com.satupintu.mobile.ui.screens.student.StudentEnglishDictionaryScreen
import com.satupintu.mobile.ui.screens.student.StudentJavaneseDictionaryScreen
import com.satupintu.mobile.ui.screens.student.StudentToolsScreen
import com.satupintu.mobile.ui.screens.student.TOOLS_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_ATTENDANCE_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_BULLYING_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_DISCIPLINE_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_LITERACY_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_PRAYER_ROUTE
import com.satupintu.mobile.ui.screens.principal.PRINCIPAL_SEVEN_HABITS_ROUTE
import com.satupintu.mobile.ui.screens.principal.PrincipalAttendanceScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalBullyingScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalDashboardScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalDisciplineScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalLiteracyScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalPrayerScreen
import com.satupintu.mobile.ui.screens.principal.PrincipalSevenHabitsScreen
import com.satupintu.mobile.ui.screens.staff.StaffDisciplineScreen
import com.satupintu.mobile.ui.screens.staff.StaffViolationHistoryScreen

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
    val sessionRole = (prefs.getString("user_role", "") ?: "").trim().lowercase()
    val sessionSchoolId = (prefs.getString("user_school_id", "") ?: "").trim().lowercase()
    val authUid = runCatching { FirebaseAuth.getInstance().currentUser?.uid.orEmpty() }.getOrDefault("")
    val hasTriggeredSchoolLock = remember(sessionRole, sessionSchoolId, authUid) { false }

    LaunchedEffect(flavor) {
        if (SecurityUtils.isSessionExpired(prefs)) {
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

    Box(modifier = Modifier.fillMaxSize()) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            val currentRole = prefs.getString("user_role", "") ?: ""
            val canResumeSession = SecurityUtils.isFirebaseProjectAllowed(SecurityUtils.getActiveFirebaseProjectId()) &&
                !SecurityUtils.isSessionExpired(prefs) &&
                SecurityUtils.isSessionConsistent(prefs, flavor) &&
                SecurityUtils.isRouteAllowed("home", currentRole, flavor, prefs)
            val requestedSessionRoute = pendingRoute?.takeIf {
                SecurityUtils.isRouteAllowed(it, currentRole, flavor, prefs)
            } ?: "home"

            LaunchedEffect(canResumeSession) {
                if (canResumeSession) {
                    navController.navigate(requestedSessionRoute) {
                        popUpTo("login") { inclusive = true }
                    }
                    pendingRoute?.let(onRouteConsumed)
                }
            }

            LoginScreen(
                onLoginSuccess = {
                    val roleAfterLogin = prefs.getString("user_role", "") ?: ""
                    val loginTargetRoute = pendingRoute?.takeIf {
                        SecurityUtils.isRouteAllowed(it, roleAfterLogin, flavor, prefs)
                    } ?: "home"
                    navController.navigate(loginTargetRoute) { popUpTo("login") { inclusive = true } }
                    pendingRoute?.let(onRouteConsumed)
                }
            )
        }
        composable("home") {
            GuardedRoute("home") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val role = prefs.getString("user_role", "") ?: ""
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }

                if (flavor == "kepala" || role == "principal") {
                    PrincipalDashboardScreen(
                        onNavigate = { route -> navController.navigate(route) },
                        onLogout = logout
                    )
                } else {
                    HomeScreen(
                        onNavigate = { route ->
                            navController.navigate(route)
                        },
                        onLogout = logout
                    )
                }
            }
        }
        composable(PRINCIPAL_ATTENDANCE_ROUTE) {
            GuardedRoute(PRINCIPAL_ATTENDANCE_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalAttendanceScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
        composable(PRINCIPAL_LITERACY_ROUTE) {
            GuardedRoute(PRINCIPAL_LITERACY_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalLiteracyScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
        composable(PRINCIPAL_PRAYER_ROUTE) {
            GuardedRoute(PRINCIPAL_PRAYER_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalPrayerScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
        composable(PRINCIPAL_SEVEN_HABITS_ROUTE) {
            GuardedRoute(PRINCIPAL_SEVEN_HABITS_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalSevenHabitsScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
        composable(PRINCIPAL_DISCIPLINE_ROUTE) {
            GuardedRoute(PRINCIPAL_DISCIPLINE_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalDisciplineScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
        composable(PRINCIPAL_BULLYING_ROUTE) {
            GuardedRoute(PRINCIPAL_BULLYING_ROUTE) {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val logout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                }
                PrincipalBullyingScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = logout
                )
            }
        }
            composable("attendance") {
                GuardedRoute("attendance") {
                    val context = LocalContext.current
                    val prefs = SecurePreferences.getSessionPrefs(context)
                    val credential = SecurityUtils.getStoredLoginKey(prefs)
                    val studentKey = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                    val sessionSchoolId = SecurityUtils.getStoredSchoolId(prefs)

                    AttendanceScreen(
                        userStudentKey = studentKey,
                        userNisn = credential,
                        userUsername = credential,
                        userSchoolId = sessionSchoolId,
                        onNavigateBack = { navController.popBackStack() }
                    )
                }
            }
            composable("profile") {
                GuardedRoute("profile") {
                    ProfileScreen(
                        onLogout = {
                            runCatching { FirebaseAuth.getInstance().signOut() }
                            navController.navigate("login") {
                                popUpTo("home") { inclusive = true }
                            }
                        },
                        onBack = { navController.popBackStack() }
                    )
                }
            }
            composable("tasks") {
                GuardedRoute("tasks") {
                    TasksScreen()
                }
            }
            // Library Route - Native Implementation
            composable("library") {
            GuardedRoute("library") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val studentName = prefs.getString("user_student_name", "") ?: ""
                val studentClass = prefs.getString("user_student_class", "") ?: ""
                val studentSchoolId = SecurityUtils.getStoredSchoolId(prefs)

                com.satupintu.mobile.ui.screens.student.StudentLibraryScreen(
                    studentId = studentId,
                    initialStudentName = studentName,
                    initialStudentClass = studentClass,
                    initialStudentSchoolId = studentSchoolId,
                    onBack = { navController.popBackStack() },
                    onReadBook = { bookUrl, bookTitle ->
                        val encodedUrl = android.net.Uri.encode(bookUrl)
                        navController.navigate("pdf_viewer/$encodedUrl/${android.net.Uri.encode(bookTitle)}")
                    }
                )
            }
            }

        composable(TOOLS_ROUTE) {
            GuardedRoute(TOOLS_ROUTE) {
                StudentToolsScreen(
                    onBack = { navController.popBackStack() },
                    onNavigate = { route -> navController.navigate(route) }
                )
            }
        }
        composable(ENGLISH_DICTIONARY_ROUTE) {
            GuardedRoute(ENGLISH_DICTIONARY_ROUTE) {
                StudentEnglishDictionaryScreen(
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable(JAVANESE_DICTIONARY_ROUTE) {
            GuardedRoute(JAVANESE_DICTIONARY_ROUTE) {
                StudentJavaneseDictionaryScreen(
                    onBack = { navController.popBackStack() }
                )
            }
        }
        
        composable(
            route = "pdf_viewer/{url}/{title}",
            arguments = listOf(
                androidx.navigation.navArgument("url") { type = androidx.navigation.NavType.StringType },
                androidx.navigation.navArgument("title") { type = androidx.navigation.NavType.StringType }
            )
        ) { backStackEntry ->
            val url = backStackEntry.arguments?.getString("url") ?: ""
            val title = backStackEntry.arguments?.getString("title") ?: "Buku"
            
            NativePdfReaderScreen(
                url = url,
                title = title,
                onBack = { navController.popBackStack() }
            )
        }
        composable("discipline") { 
            GuardedRoute("discipline") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                DisciplineScreen(
                    userCredential = credential,
                    studentId = studentId,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("osis_discipline") {
            GuardedRoute("osis_discipline") {
                StaffDisciplineScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
        composable("virtual_pet") {
            GuardedRoute("virtual_pet") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                VirtualPetScreen(
                    studentId = studentId,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() },
                    onOpenLiteracy = { navController.navigate("tasks") },
                    onOpenAttendance = { navController.navigate("attendance") },
                    onOpenPrayer = { navController.navigate("prayer") },
                    onOpenSevenHabits = { navController.navigate("seven_habits") },
                    onOpenLibrary = { navController.navigate("library") }
                )
            }
        }
        composable("seven_habits") { 
            GuardedRoute("seven_habits") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                SevenHabitsScreen(
                    studentId = studentId,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("prayer") {
            GuardedRoute("prayer") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                PrayerScreen(
                    studentCredential = credential,
                    studentId = studentId,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("halo_spentgapa") {
            GuardedRoute("halo_spentgapa") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)
                HaloSpentgapaScreen(
                    studentCredential = credential,
                    studentId = studentId,
                    schoolId = schoolId,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToReport = { category ->
                        navController.navigate("report_bullying/$category")
                    }
                )
            }
        }
        composable(
            route = "report_bullying/{category}",
            arguments = listOf(
                androidx.navigation.navArgument("category") { type = androidx.navigation.NavType.StringType }
            )
        ) { backStackEntry ->
            GuardedRoute("halo_spentgapa") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)
                val category = backStackEntry.arguments?.getString("category") ?: "BULLYING"

                ReportBullyingScreen(
                    userCredential = credential,
                    studentId = studentId,
                    schoolId = schoolId,
                    category = category,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
        composable("notifications") { 
            GuardedRoute("notifications") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredLoginKey(prefs)
                val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
                val studentClass = prefs.getString("user_student_class", "") ?: ""
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                com.satupintu.mobile.ui.screens.student.StudentNotificationScreen(
                    studentCredential = credential,
                    studentId = studentId,
                    studentClass = studentClass,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }

        // Teacher Routes
        composable("teacher_student_list") {
            GuardedRoute("teacher_student_list") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherStudentsScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_attendance") {
            GuardedRoute("teacher_attendance") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherAttendanceScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_prayer") {
            GuardedRoute("teacher_prayer") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherPrayerScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_discipline") { 
            GuardedRoute("teacher_discipline") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherDisciplineScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_literacy") {
            GuardedRoute("teacher_literacy") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)
                TeacherLiteracyScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_bullying_reports") {
            GuardedRoute("teacher_bullying_reports") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherBullyingScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        composable("teacher_notifications") {
            GuardedRoute("teacher_notifications") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherNotificationScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() },
                    onNavigateToBullying = { navController.navigate("teacher_bullying_reports") },
                    onNavigateToLiteracy = { navController.navigate("teacher_literacy") }
                )
            }
        }
        composable("teacher_seven_habits") {
            GuardedRoute("teacher_seven_habits") {
                val context = LocalContext.current
                val prefs = SecurePreferences.getSessionPrefs(context)
                val credential = SecurityUtils.getStoredTeacherKey(prefs)
                val schoolId = SecurityUtils.getStoredSchoolId(prefs)

                TeacherSevenHabitsScreen(
                    teacherNuptk = credential,
                    schoolId = schoolId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
        
        // Staff Routes
        composable("staff_discipline") {
            GuardedRoute("osis_discipline") {
                StaffDisciplineScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
        composable("staff_violation_history") {
            GuardedRoute("osis_discipline") {
                StaffViolationHistoryScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }

        if (sessionRole == "student" && (petLockState.isChecking || petLockState.isDead)) {
            StudentPetLockOverlay(
                isChecking = petLockState.isChecking,
                petName = petLockState.petName,
                onLogout = {
                    prefs.edit().clear().apply()
                    runCatching { FirebaseAuth.getInstance().signOut() }
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}

private data class StudentPetLockState(
    val isChecking: Boolean = false,
    val isDead: Boolean = false,
    val petName: String = "Sahabat Belajar"
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

    val repository = VirtualPetRepository()
    repository.getVirtualPetByStudentIds(aliases, schoolId).collect { pet ->
        value = StudentPetLockState(
            isChecking = false,
            isDead = pet?.let(::isStudentPetLockedDead) == true,
            petName = pet?.petName?.ifBlank { "Sahabat Belajar" } ?: "Sahabat Belajar"
        )
    }
}

private fun isStudentPetLockedDead(pet: VirtualPet): Boolean {
    return pet.isDeadByRule()
}

@Composable
private fun StudentPetLockOverlay(
    isChecking: Boolean,
    petName: String,
    onLogout: () -> Unit
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
                        "$petName sedang mati. APK GAS Siswa baru bisa dipakai lagi setelah admin melakukan revive."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.88f)
                )

                if (!isChecking) {
                    Text(
                        text = "Begitu admin merevive pet, aplikasi akan terbuka otomatis tanpa perlu install ulang.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFFFD8D8)
                    )

                    Button(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Keluar",
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Keluar",
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
            }
        }
    }
}
