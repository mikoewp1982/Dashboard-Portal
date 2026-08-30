package com.satupintu.mobile.ui

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.composable
import com.google.firebase.auth.FirebaseAuth
import com.satupintu.mobile.BuildConfig
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
import com.satupintu.mobile.ui.screens.teacher.TeacherPrayerDhuhaJumatScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherRecapScreen
import com.satupintu.mobile.ui.screens.teacher.TeacherSevenHabitsScreen
import com.satupintu.mobile.ui.screens.student.ReportBullyingScreen
import com.satupintu.mobile.ui.screens.student.HaloSpentgapaScreen
import com.satupintu.mobile.ui.screens.student.PrayerScreen
import com.satupintu.mobile.ui.screens.student.PrayerDhuhaJumatScreen
import com.satupintu.mobile.ui.screens.student.ENGLISH_DICTIONARY_ROUTE
import com.satupintu.mobile.ui.screens.student.JAVANESE_DICTIONARY_ROUTE
import com.satupintu.mobile.ui.screens.student.KBBI_DICTIONARY_ROUTE
import com.satupintu.mobile.ui.screens.student.RELIGIOUS_BOOK_ROUTE
import com.satupintu.mobile.ui.screens.student.StudentEnglishDictionaryScreen
import com.satupintu.mobile.ui.screens.student.StudentJavaneseDictionaryScreen
import com.satupintu.mobile.ui.screens.student.StudentKbbiScreen
import com.satupintu.mobile.ui.screens.student.StudentReligiousBookScreen
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
import com.satupintu.mobile.ui.viewmodel.VirtualPetViewModel

/**
 * Route table extracted from AppNavigation so NavigationKt stays under dex size limits.
 * Cold-start ClassNotFoundException for NavigationKt was caused by an oversized facade class
 * whose definition was dropped from the APK while inner classes remained.
 */
fun NavGraphBuilder.gasAppNavGraph(
    navController: NavHostController,
    prefs: android.content.SharedPreferences,
    flavor: String,
    pendingRoute: String?,
    onRouteConsumed: (String) -> Unit,
    studentPetViewModel: VirtualPetViewModel?,
    guardedRoute: @Composable (route: String, content: @Composable () -> Unit) -> Unit
) {
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
        guardedRoute("home") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val role = prefs.getString("user_role", "") ?: ""
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_ATTENDANCE_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_LITERACY_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_PRAYER_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_SEVEN_HABITS_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_DISCIPLINE_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
        guardedRoute(PRINCIPAL_BULLYING_ROUTE) {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val logout = {
                runCatching { SecurityUtils.clearLastLoginIdentity(context) }
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
            guardedRoute("attendance") {
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
            guardedRoute("profile") {
                val ctx = LocalContext.current
                ProfileScreen(
                    onLogout = {
                        runCatching { SecurityUtils.clearLastLoginIdentity(ctx) }
                        SecurePreferences.getSessionPrefs(ctx).edit().clear().apply()
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
            guardedRoute("tasks") {
                TasksScreen()
            }
        }
        // Library Route - Native Implementation
        composable(
            route = "library?initialTab={initialTab}",
            arguments = listOf(
                androidx.navigation.navArgument("initialTab") {
                    type = androidx.navigation.NavType.IntType
                    defaultValue = 1
                }
            )
        ) { backStackEntry ->
        guardedRoute("library") {
            val initialTab = backStackEntry.arguments?.getInt("initialTab") ?: 1
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredLoginKey(prefs)
            val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
            val studentName = prefs.getString("user_student_name", "") ?: ""
            val studentClass = prefs.getString("user_student_class", "") ?: ""
            val studentSchoolId = SecurityUtils.getStoredSchoolId(prefs)

            com.satupintu.mobile.ui.screens.student.StudentLibraryScreen(
                studentId = studentId,
                initialTab = initialTab,
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
        guardedRoute(TOOLS_ROUTE) {
            StudentToolsScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { route -> navController.navigate(route) }
            )
        }
    }
    composable(ENGLISH_DICTIONARY_ROUTE) {
        guardedRoute(ENGLISH_DICTIONARY_ROUTE) {
            StudentEnglishDictionaryScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
    composable(JAVANESE_DICTIONARY_ROUTE) {
        guardedRoute(JAVANESE_DICTIONARY_ROUTE) {
            StudentJavaneseDictionaryScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
    composable(KBBI_DICTIONARY_ROUTE) {
        guardedRoute(KBBI_DICTIONARY_ROUTE) {
            StudentKbbiScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
    composable(RELIGIOUS_BOOK_ROUTE) {
        guardedRoute(RELIGIOUS_BOOK_ROUTE) {
            StudentReligiousBookScreen(
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
        val context = LocalContext.current
        val prefs = SecurePreferences.getSessionPrefs(context)
        val credential = SecurityUtils.getStoredLoginKey(prefs)
        val readerStudentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
        val readerSchoolId = SecurityUtils.getStoredSchoolId(prefs)
        val readerAliases = SecurityUtils.getStoredStudentAliases(prefs) + setOf(readerStudentId, credential)
        
        NativePdfReaderScreen(
            url = url,
            title = title,
            studentId = readerStudentId,
            schoolId = readerSchoolId,
            studentAliases = readerAliases.filter { it.isNotBlank() }.toSet(),
            onBack = { navController.popBackStack() }
        )
    }
    composable("discipline") { 
        guardedRoute("discipline") {
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
        guardedRoute("osis_discipline") {
            StaffDisciplineScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
    composable("virtual_pet") {
        guardedRoute("virtual_pet") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredLoginKey(prefs)
            val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)

            VirtualPetScreen(
                studentId = studentId,
                schoolId = schoolId,
                onBack = { navController.popBackStack() },
                onOpenLiteracy = { navController.navigate("library?initialTab=2") },
                onOpenAttendance = { navController.navigate("attendance") },
                onOpenPrayer = { navController.navigate("prayer") },
                onOpenSevenHabits = { navController.navigate("seven_habits") },
                onOpenLibrary = { navController.navigate("library") },
                viewModel = studentPetViewModel ?: androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }
    }
    composable("seven_habits") { 
        guardedRoute("seven_habits") {
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
        guardedRoute("prayer") {
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
    composable("prayer_dhuha_jumat") {
        guardedRoute("prayer_dhuha_jumat") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredLoginKey(prefs)
            val studentId = SecurityUtils.getStoredStudentKey(prefs).ifBlank { credential }
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)

            PrayerDhuhaJumatScreen(
                studentCredential = credential,
                studentId = studentId,
                schoolId = schoolId,
                onBack = { navController.popBackStack() }
            )
        }
    }
    composable("halo_spentgapa") {
        guardedRoute("halo_spentgapa") {
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
        guardedRoute("halo_spentgapa") {
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
        guardedRoute("notifications") {
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
        guardedRoute("teacher_student_list") {
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
        guardedRoute("teacher_attendance") {
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
    composable("secretary_attendance") {
        guardedRoute("secretary_attendance") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)
            val secretaryAliases = SecurityUtils.getStoredStudentAliases(prefs)
            val studentClass = prefs.getString("user_student_class", "").orEmpty().trim()
            val studentName = prefs.getString("user_student_name", "").orEmpty()
                .ifBlank { prefs.getString("user_display_name", "").orEmpty() }
                .trim()

            TeacherAttendanceScreen(
                teacherNuptk = "",
                schoolId = schoolId,
                onBack = { navController.popBackStack() },
                isClassSecretaryMode = true,
                secretaryName = studentName,
                secretaryClass = studentClass,
                secretaryAliases = secretaryAliases
            )
        }
    }
    composable("teacher_prayer") {
        guardedRoute("teacher_prayer") {
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
    composable("teacher_prayer_dhuha_jumat") {
        guardedRoute("teacher_prayer_dhuha_jumat") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredTeacherKey(prefs)
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)

            TeacherPrayerDhuhaJumatScreen(
                teacherNuptk = credential,
                schoolId = schoolId,
                onBack = { navController.popBackStack() }
            )
        }
    }
    composable("teacher_discipline") { 
        guardedRoute("teacher_discipline") {
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
        guardedRoute("teacher_literacy") {
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
        guardedRoute("teacher_bullying_reports") {
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
        guardedRoute("teacher_notifications") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredTeacherKey(prefs)
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)

            TeacherNotificationScreen(
                teacherNuptk = credential,
                schoolId = schoolId,
                onBack = { navController.popBackStack() },
                onNavigateToBullying = { navController.navigate("teacher_bullying_reports") },
                onNavigateToLiteracy = { navController.navigate("teacher_literacy") },
                onNavigateToStudents = { navController.navigate("teacher_student_list") }
            )
        }
    }
    composable("teacher_seven_habits") {
        guardedRoute("teacher_seven_habits") {
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
    composable("teacher_recap") {
        guardedRoute("teacher_recap") {
            val context = LocalContext.current
            val prefs = SecurePreferences.getSessionPrefs(context)
            val credential = SecurityUtils.getStoredTeacherKey(prefs)
            val schoolId = SecurityUtils.getStoredSchoolId(prefs)

            TeacherRecapScreen(
                teacherNuptk = credential,
                schoolId = schoolId,
                onBack = { navController.popBackStack() }
            )
        }
    }
    
    // Staff Routes
    composable("staff_discipline") {
        guardedRoute("osis_discipline") {
            StaffDisciplineScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
    composable("staff_violation_history") {
        guardedRoute("osis_discipline") {
            StaffViolationHistoryScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
