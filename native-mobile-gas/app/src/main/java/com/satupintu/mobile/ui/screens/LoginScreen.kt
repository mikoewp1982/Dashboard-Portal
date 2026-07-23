package com.satupintu.mobile.ui.screens

import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.security.MessageDigest
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import com.satupintu.mobile.R
import com.satupintu.mobile.BuildConfig
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.util.SecurityUtils
import com.satupintu.mobile.utils.SecurePreferences

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var emailInput by remember { mutableStateOf("") }
    var schoolIdInput by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val colorScheme = MaterialTheme.colorScheme
    val scrollState = rememberScrollState()
    val displayVersion = remember { "v${BuildConfig.VERSION_NAME.substringBefore("-")}" }
    val mainHandler = remember { Handler(Looper.getMainLooper()) }
    val debugServerUrl = "http://192.168.1.122:7777/event"
    val debugSessionId = "student-login-tenant"
    val studentDeviceBindUrl = "https://us-central1-dashboard-portal-179f7.cloudfunctions.net/registerStudentDevice"

    fun debugReport(hypothesisId: String, location: String, msg: String, data: Map<String, Any?> = emptyMap()) {
        Thread {
            runCatching {
                val payloadData = data.entries.joinToString(",") { (key, value) ->
                    val safeKey = key.replace("\"", "\\\"")
                    val safeValue = (value ?: "").toString()
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                    "\"$safeKey\":\"$safeValue\""
                }
                val payload = """
                    {"sessionId":"$debugSessionId","runId":"pre-fix","hypothesisId":"$hypothesisId","location":"$location","msg":"[DEBUG] $msg","data":{$payloadData},"ts":${System.currentTimeMillis()}}
                """.trimIndent()
                val connection = (URL(debugServerUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 2500
                    readTimeout = 2500
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }
                connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
                connection.inputStream.close()
                connection.disconnect()
            }
        }.start()
    }

    fun registerStudentDeviceViaCloudFunction(
        requestedSchoolId: String,
        usernameInput: String,
        userPassword: String,
        deviceId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        Thread {
            runCatching {
                val payload = JSONObject().apply {
                    put("requestedSchoolId", requestedSchoolId)
                    put("usernameInput", usernameInput)
                    put("userPassword", userPassword)
                    put("deviceId", deviceId)
                }

                val connection = (URL(studentDeviceBindUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 3000
                    readTimeout = 3000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }

                connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }

                val responseText = (if (connection.responseCode in 200..299) {
                    connection.inputStream
                } else {
                    connection.errorStream ?: connection.inputStream
                }).bufferedReader().use { it.readText() }

                val responseJson = runCatching { JSONObject(responseText) }.getOrDefault(JSONObject())
                val success = connection.responseCode in 200..299 && responseJson.optBoolean("success", false)
                connection.disconnect()

                if (!success) {
                    val message = responseJson.optString("message").ifBlank {
                        "Gagal mendaftarkan perangkat siswa ke server."
                    }
                    mainHandler.post { onError(message) }
                    return@runCatching
                }

                mainHandler.post(onSuccess)
            }.onFailure { error ->
                val message = error.message?.takeIf { it.isNotBlank() }
                    ?: "Gagal menghubungi server registrasi perangkat."
                mainHandler.post { onError(message) }
            }
        }.start()
    }

    fun hasInternetConnection(): Boolean {
        val cm = context.getSystemService(ConnectivityManager::class.java) ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }

    // Helper function for Device Check
    fun checkDeviceAndProceed(
        userPassword: String,
        usernameInput: String,
        requestedSchoolId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        fun normalizeScope(value: String): String = value.trim().lowercase()

        val deviceId = SecurityUtils.getDeviceBindingId(context)
        val db = FirebaseDatabase.getInstance()
        val rootRef = db.reference
        val prefs = SecurePreferences.getSessionPrefs(context)
        val flavor = SecurityUtils.normalizeAudienceFlavor(BuildConfig.FLAVOR)
        val normalizedPassword = userPassword.trim()
        val normalizedLoginKey = usernameInput.trim().lowercase()
        val requestedSchoolScope = normalizeScope(requestedSchoolId)
        val requestedTenantAliases = linkedSetOf<String>().apply {
            if (requestedSchoolScope.isNotBlank()) add(requestedSchoolScope)
        }
        val now = System.currentTimeMillis()

        // #region debug-point A:login-entry
        debugReport(
            hypothesisId = "A",
            location = "LoginScreen.kt:checkDeviceAndProceed",
            msg = "student login flow entered",
            data = mapOf(
                "flavor" to flavor,
                "version" to BuildConfig.VERSION_NAME,
                "requestedSchoolId" to requestedSchoolId,
                "usernameInput" to usernameInput,
                "passwordLength" to normalizedPassword.length,
            )
        )
        // #endregion

        fun sha256Hex(input: String): String {
            val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
            return bytes.joinToString("") { b -> "%02x".format(b) }
        }

        fun readString(snapshot: DataSnapshot?, vararg keys: String): String {
            if (snapshot == null) return ""
            for (key in keys) {
                val value = snapshot.child(key).getValue(String::class.java)?.trim()
                if (!value.isNullOrEmpty()) return value
            }
            return ""
        }

        fun normalizeLookupKey(value: String?): String {
            return value.orEmpty()
                .trim()
                .lowercase()
                .replace("\\s+".toRegex(), "_")
                .replace(Regex("[^a-z0-9_]"), "")
        }

        var resolvedSchoolId = requestedSchoolScope

        fun resolveRequestedTenantAliases(onResolved: () -> Unit) {
            if (requestedSchoolScope.isBlank()) {
                onResolved()
                return
            }

            val aliases = linkedSetOf(requestedSchoolScope)

            fun finish() {
                requestedTenantAliases.clear()
                requestedTenantAliases.addAll(aliases.filter { it.isNotBlank() })
                // #region debug-point B:tenant-aliases
                debugReport(
                    hypothesisId = "B",
                    location = "LoginScreen.kt:resolveRequestedTenantAliases",
                    msg = "tenant aliases resolved",
                    data = mapOf(
                        "requestedSchoolScope" to requestedSchoolScope,
                        "resolvedSchoolId" to resolvedSchoolId,
                        "aliases" to requestedTenantAliases.joinToString("|"),
                    )
                )
                // #endregion
                onResolved()
            }

            rootRef.child("schools").child(requestedSchoolScope).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        resolvedSchoolId = normalizeScope(readString(snapshot, "schoolId").ifBlank { snapshot.key.orEmpty() })
                        aliases.add(resolvedSchoolId)
                        aliases.add(normalizeScope(readString(snapshot, "npsn")))
                        finish()
                        return
                    }

                    rootRef.child("schools").orderByChild("npsn").equalTo(requestedSchoolScope)
                        .addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(npsnSnapshot: DataSnapshot) {
                                val schoolSnapshot = npsnSnapshot.children.firstOrNull()
                                if (schoolSnapshot != null) {
                                    resolvedSchoolId = normalizeScope(readString(schoolSnapshot, "schoolId").ifBlank { schoolSnapshot.key.orEmpty() })
                                    aliases.add(resolvedSchoolId)
                                    aliases.add(normalizeScope(readString(schoolSnapshot, "npsn")))
                                }
                                finish()
                            }

                            override fun onCancelled(error: DatabaseError) {
                                finish()
                            }
                        })
                }

                override fun onCancelled(error: DatabaseError) {
                    finish()
                }
            })
        }

        fun matchesRequestedTenant(
            schoolId: String?,
            npsn: String? = ""
        ): Boolean {
            val candidates = linkedSetOf(
                normalizeScope(schoolId.orEmpty()),
                normalizeScope(npsn.orEmpty())
            ).filter { it.isNotBlank() }
            return requestedTenantAliases.isNotEmpty() && candidates.any { requestedTenantAliases.contains(it) }
        }

        fun saveSession(
            role: String,
            schoolId: String = "",
            npsn: String = "",
            schoolName: String = "",
            displayName: String = "",
            studentId: String = "",
            studentClass: String = "",
            loginKey: String = "",
            teacherId: String = "",
            nisn: String = "",
            username: String = ""
        ): Boolean {
            val normalizedSchoolId = normalizeScope(schoolId)
            if (requestedTenantAliases.isEmpty()) {
                onError("Kode sekolah wajib diisi sebelum login.")
                return false
            }
            if (normalizedSchoolId.isBlank() || !matchesRequestedTenant(schoolId, npsn)) {
                onError("Akun ini tidak berada pada tenant sekolah yang dipilih.")
                return false
            }
            prefs.edit().apply {
                putString("user_role", role)
                putString("user_school_id", normalizedSchoolId)
                putString("user_npsn", npsn.trim())
                putBoolean("user_is_osis_staff", false)
                putBoolean("session_persistent", role.trim().lowercase() == "principal")
                putString("user_school_name", schoolName)
                putString("user_display_name", displayName)
                putString("user_student_id", studentId)
                putString("user_nisn", nisn.trim())
                putString("user_username", username.trim())
                putString("user_student_name", displayName)
                putString("user_student_class", studentClass)
                putString("user_teacher_id", teacherId)
                putString("user_login_key", loginKey.trim())
                putString("user_credential", loginKey.trim())
                putString("user_boundary", SecurityUtils.normalizeScope(BuildConfig.MOBILE_BOUNDARY))
                SecurityUtils.persistSession(this, now)
                apply()
            }
            return true
        }

        fun verifyCredential(
            snapshot: DataSnapshot,
            roleLabel: String,
            fallbackPlainValues: Set<String>
        ): Boolean {
            val hashCandidates = listOf(
                readString(snapshot, "passwordHash"),
                readString(snapshot, "credentialHash")
            ).filter { it.isNotBlank() }
            if (hashCandidates.isNotEmpty()) {
                return hashCandidates.any { it.equals(sha256Hex(normalizedPassword), ignoreCase = true) }
            }

            val plainCandidates = linkedSetOf<String>()
            plainCandidates.addAll(
                listOf(
                    readString(snapshot, "password"),
                    readString(snapshot, "credential")
                ).filter { it.isNotBlank() }
            )
            plainCandidates.addAll(fallbackPlainValues.filter { it.isNotBlank() })
            if (plainCandidates.isEmpty()) {
                onError("Akun $roleLabel belum memiliki kredensial yang valid. Hubungi admin untuk set password.")
                return false
            }
            val isValid = plainCandidates.any { normalizeScope(it) == normalizeScope(normalizedPassword) }
            if (!isValid) {
                onError("Password yang dimasukkan salah.")
            }
            return isValid
        }

        fun matchesRequestedSchool(snapshot: DataSnapshot?): Boolean {
            if (snapshot == null || !snapshot.exists()) return false
            
            val pathStr = snapshot.ref.toString()
            if (pathStr.contains("/gas/schools/")) {
                return true // If it's in the tenant's path, it definitely matches
            }

            val snapshotSchoolId = normalizeScope(readString(snapshot, "schoolId"))
            val snapshotNpsn = normalizeScope(readString(snapshot, "npsn"))
            return snapshotSchoolId.isNotBlank() && matchesRequestedTenant(snapshotSchoolId, snapshotNpsn)
        }

        fun queryByChild(path: String, child: String, value: String, onResult: (DataSnapshot?) -> Unit, onFail: (String) -> Unit) {
            rootRef.child(path).orderByChild(child).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val firstMatch = snapshot.children.firstOrNull { matchesRequestedSchool(it) }
                    // #region debug-point C:query-result
                    debugReport(
                        hypothesisId = "C",
                        location = "LoginScreen.kt:queryByChild",
                        msg = "queryByChild finished",
                        data = mapOf(
                            "path" to path,
                            "child" to child,
                            "value" to value,
                            "childrenCount" to snapshot.childrenCount,
                            "matchedPath" to (firstMatch?.ref?.path?.toString() ?: ""),
                            "matchedSchoolId" to readString(firstMatch, "schoolId"),
                            "matchedNpsn" to readString(firstMatch, "npsn"),
                        )
                    )
                    // #endregion
                    onResult(firstMatch)
                }

                override fun onCancelled(error: DatabaseError) {
                    onFail(error.message)
                }
            })
        }

        fun queryByChildCandidates(
            path: String,
            child: String,
            values: Iterable<String>,
            onResult: (DataSnapshot?) -> Unit,
            onFail: (String) -> Unit
        ) {
            val candidates = values
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .distinct()

            if (candidates.isEmpty()) {
                onResult(null)
                return
            }

            fun queryNext(index: Int) {
                if (index >= candidates.size) {
                    onResult(null)
                    return
                }

                queryByChild(
                    path = path,
                    child = child,
                    value = candidates[index],
                    onResult = { snapshot ->
                        if (snapshot != null) {
                            onResult(snapshot)
                        } else {
                            queryNext(index + 1)
                        }
                    },
                    onFail = onFail
                )
            }

            queryNext(0)
        }

        fun findPrincipalByAlias(path: String, alias: String, onResult: (DataSnapshot?) -> Unit, onFail: (String) -> Unit) {
            val normalizedAlias = normalizeLookupKey(alias.substringBefore("@"))
            if (normalizedAlias.isBlank()) {
                onResult(null)
                return
            }

            rootRef.child(path).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        onResult(null)
                        return
                    }

                    val candidates = snapshot.children.filter { child ->
                        if (!matchesRequestedSchool(child)) return@filter false

                        val usernameKey = normalizeLookupKey(readString(child, "username"))
                        val nameKey = normalizeLookupKey(readString(child, "name", "nama", "principalName"))
                        usernameKey == normalizedAlias ||
                            nameKey == normalizedAlias ||
                            usernameKey.startsWith(normalizedAlias) ||
                            nameKey.startsWith(normalizedAlias)
                    }

                    val exactMatch = candidates.firstOrNull { child ->
                        val usernameKey = normalizeLookupKey(readString(child, "username"))
                        val nameKey = normalizeLookupKey(readString(child, "name", "nama", "principalName"))
                        usernameKey == normalizedAlias || nameKey == normalizedAlias
                    }

                    onResult(exactMatch ?: candidates.firstOrNull())
                }

                override fun onCancelled(error: DatabaseError) {
                    onFail(error.message)
                }
            })
        }

        fun isPrincipalProfile(snapshot: DataSnapshot?): Boolean {
            if (snapshot == null || !snapshot.exists()) return false
            val markers = listOf(
                readString(snapshot, "role"),
                readString(snapshot, "jabatan"),
                readString(snapshot, "position"),
                readString(snapshot, "title")
            ).joinToString(" ").lowercase()

            return markers.contains("principal") ||
                markers.contains("headmaster") ||
                markers.contains("kepala sekolah") ||
                markers.contains("kepala_sekolah") ||
                markers.contains("kepsek")
        }

        fun ensureAllowedGuruStaffProfile(snapshot: DataSnapshot): Boolean {
            val roleValue = normalizeScope(readString(snapshot, "role"))
            if (roleValue == "staff") return true
            onError("APK GAS Guru hanya menerima akun guru atau petugas yang terdaftar resmi.")
            return false
        }

        fun ensureSchoolServiceActive(schoolIdValue: String, npsnValue: String = "", onAllowed: () -> Unit) {
            val normalizedSchoolId = normalizeScope(schoolIdValue)
            if (normalizedSchoolId.isBlank()) {
                onError("Akun belum memiliki schoolId yang valid.")
                return
            }
            if (!matchesRequestedTenant(schoolIdValue, npsnValue)) {
                onError("Akun ini bukan milik tenant sekolah yang dipilih.")
                return
            }

            rootRef.child("schools").child(normalizedSchoolId).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        onAllowed()
                        return
                    }

                    val schoolActive = snapshot.child("isActive").getValue(Boolean::class.java)
                    val serviceActive = snapshot.child("serviceStatus").child("serviceActive").getValue(Boolean::class.java)
                    if (schoolActive == false || serviceActive == false) {
                        onError("Layanan sekolah sedang dinonaktifkan oleh Super Admin.")
                        return
                    }

                    onAllowed()
                }

                override fun onCancelled(error: DatabaseError) {
                    onError("Gagal memverifikasi status layanan sekolah: ${error.message}")
                }
            })
        }

        fun completeTeacherLogin(snapshot: DataSnapshot) {
            val teacherPath = snapshot.ref.path.toString().removePrefix("/")
            val schoolIdValue = readString(snapshot, "schoolId").ifBlank { resolvedSchoolId }
            val npsnValue = readString(snapshot, "npsn")
            val schoolNameValue = readString(snapshot, "schoolName")
            val displayNameValue = readString(snapshot, "name", "nama")
            val teacherIdentity = readString(snapshot, "nuptk", "credential", "username").ifBlank { userPassword }
            val registeredDeviceId = readString(snapshot, "deviceId", "device")
            if (!SecurityUtils.matchesStoredDeviceBinding(context, registeredDeviceId)) {
                onError("Login Ditolak: Akun guru terkunci di perangkat lain. Minta Admin Reset Device.")
                return
            }
            ensureSchoolServiceActive(schoolIdValue, npsnValue) {
                val updates = mutableMapOf<String, Any>(
                    "$teacherPath/lastLogin" to now,
                    "$teacherPath/lastLoginAt" to now
                )
                if (registeredDeviceId.isBlank()) {
                    updates["$teacherPath/deviceId"] = deviceId
                    updates["$teacherPath/device"] = deviceId
                }
                rootRef.updateChildren(updates)
                    .addOnSuccessListener {
                        if (!saveSession(
                            role = "teacher",
                            schoolId = schoolIdValue,
                            npsn = npsnValue,
                            schoolName = schoolNameValue,
                            displayName = displayNameValue,
                            loginKey = teacherIdentity,
                            teacherId = teacherIdentity
                        )) {
                            return@addOnSuccessListener
                        }
                        onSuccess()
                    }
                    .addOnFailureListener { e ->
                        onError("Login Ditolak: Akun terkunci di perangkat lain atau gagal mendaftarkan perangkat.")
                    }
            }
        }

        fun bindPrincipal(snapshot: DataSnapshot) {
            if (!matchesRequestedSchool(snapshot)) {
                onError("Akun kepala sekolah tidak berada pada tenant sekolah yang dipilih.")
                return
            }
            val isActive = snapshot.child("isActive").getValue(Boolean::class.java) ?: true
            if (!isActive) {
                onError("Akun kepala sekolah dinonaktifkan.")
                return
            }

            val registeredDeviceId = readString(snapshot, "deviceId", "device")
            if (!SecurityUtils.matchesStoredDeviceBinding(context, registeredDeviceId)) {
                onError("Akun kepala sekolah terkunci pada perangkat lain. Hubungi admin untuk reset.")
                return
            }

            val schoolIdValue = readString(snapshot, "schoolId").ifBlank { resolvedSchoolId }
            val npsnValue = readString(snapshot, "npsn")
            val schoolNameValue = readString(snapshot, "schoolName")
            val displayNameValue = readString(snapshot, "name", "nama", "principalName").ifBlank { "Kepala Sekolah" }
            val principalLoginKey = readString(snapshot, "username", "principalId", "nip").ifBlank {
                usernameInput.substringBefore("@").trim().lowercase()
            }
            val updates = hashMapOf<String, Any?>(
                "${snapshot.ref.path.toString().removePrefix("/")}/deviceId" to deviceId,
                "${snapshot.ref.path.toString().removePrefix("/")}/device" to deviceId,
                "${snapshot.ref.path.toString().removePrefix("/")}/lastLoginAt" to now
            )

            ensureSchoolServiceActive(schoolIdValue, npsnValue) {
                rootRef.updateChildren(updates)
                    .addOnSuccessListener {
                        if (!saveSession(
                                role = "principal",
                                schoolId = schoolIdValue,
                                npsn = npsnValue,
                                schoolName = schoolNameValue,
                                displayName = displayNameValue,
                                loginKey = principalLoginKey
                            )) {
                            return@addOnSuccessListener
                        }
                        onSuccess()
                    }
                    .addOnFailureListener { e -> onError("Gagal mendaftarkan perangkat kepala sekolah: ${e.message}") }
            }
        }

        fun checkPrincipalFromTeacherNode() {
            if (resolvedSchoolId.isBlank()) {
                onError("School ID required.")
                return
            }
            fun handleCandidate(snapshot: DataSnapshot?) {
                if (snapshot != null && snapshot.exists() && isPrincipalProfile(snapshot)) {
                    bindPrincipal(snapshot)
                } else {
                    onError("Akun kepala sekolah tidak ditemukan. Pastikan profil principal memiliki schoolId yang benar.")
                }
            }

            val teacherPath = "gas/schools/$resolvedSchoolId/teachers"
            val teachersRef = rootRef.child(teacherPath)
            teachersRef.child(userPassword).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists() && isPrincipalProfile(snapshot)) {
                        bindPrincipal(snapshot)
                    } else {
                        queryByChild(
                            path = teacherPath,
                            child = "nuptk",
                            value = userPassword,
                            onResult = { teacherSnapshot ->
                                if (teacherSnapshot != null && isPrincipalProfile(teacherSnapshot)) {
                                    bindPrincipal(teacherSnapshot)
                                } else {
                                    val usernameKey = usernameInput.substringBefore("@").trim().lowercase()
                                    queryByChild(
                                        path = teacherPath,
                                        child = "username",
                                        value = usernameKey,
                                        onResult = { byUsername -> handleCandidate(byUsername) },
                                        onFail = { message -> onError("Gagal memverifikasi kepala sekolah: $message") }
                                    )
                                }
                            },
                            onFail = { message -> onError("Gagal memverifikasi kepala sekolah: $message") }
                        )
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    onError("Gagal memverifikasi kepala sekolah: ${error.message}")
                }
            })
        }

        fun verifyAndBindPrincipal(snapshot: DataSnapshot): Boolean {
            if (!verifyCredential(
                    snapshot,
                    "kepala sekolah",
                    setOf(readString(snapshot, "nip"), readString(snapshot, "nuptk"))
                )) {
                return false
            }

            val schoolIdValue = normalizeScope(readString(snapshot, "schoolId"))
            if (schoolIdValue.isBlank()) {
                onError("Akun kepala sekolah belum memiliki schoolId.")
                return false
            }

            bindPrincipal(snapshot)
            return true
        }

        fun checkPrincipalAccount() {
            val usernameRaw = usernameInput.substringBefore("@").trim().lowercase()
            if (usernameRaw.isBlank()) {
                onError("Username Kepala Sekolah diperlukan.")
                return
            }
            rootRef.child("principals").child(usernameRaw).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        bindPrincipal(snapshot)
                    } else {
                        checkPrincipalFromTeacherNode()
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    checkPrincipalFromTeacherNode()
                }
            })
        }

        fun bindStudent(studentSnapshot: DataSnapshot, legacySnapshot: DataSnapshot?) {
            // #region debug-point D:bind-student-entry
            debugReport(
                hypothesisId = "D",
                location = "LoginScreen.kt:bindStudent",
                msg = "bindStudent entered",
                data = mapOf(
                    "studentPath" to studentSnapshot.ref.path.toString(),
                    "studentKey" to (studentSnapshot.key ?: ""),
                    "studentName" to readString(studentSnapshot, "name", "nama"),
                    "studentUsername" to readString(studentSnapshot, "username"),
                    "studentNisn" to readString(studentSnapshot, "nisn"),
                    "studentSchoolId" to readString(studentSnapshot, "schoolId"),
                    "studentNpsn" to readString(studentSnapshot, "npsn"),
                    "resolvedSchoolId" to resolvedSchoolId,
                    "requestedAliases" to requestedTenantAliases.joinToString("|"),
                )
            )
            // #endregion
            if (!matchesRequestedSchool(studentSnapshot)) {
                // #region debug-point D:bind-student-tenant-reject
                debugReport(
                    hypothesisId = "D",
                    location = "LoginScreen.kt:bindStudent",
                    msg = "bindStudent rejected by tenant filter",
                    data = mapOf(
                        "studentPath" to studentSnapshot.ref.path.toString(),
                        "studentSchoolId" to readString(studentSnapshot, "schoolId"),
                        "studentNpsn" to readString(studentSnapshot, "npsn"),
                        "resolvedSchoolId" to resolvedSchoolId,
                        "requestedAliases" to requestedTenantAliases.joinToString("|"),
                    )
                )
                // #endregion
                onError("Akun siswa tidak berada pada tenant sekolah yang dipilih.")
                return
            }
            val nisnValue = readString(studentSnapshot, "nisn").ifEmpty { studentSnapshot.key ?: userPassword }
            val schoolIdValue = readString(studentSnapshot, "schoolId").ifBlank { resolvedSchoolId }
            val npsnValue = readString(studentSnapshot, "npsn")
            val schoolNameValue = readString(studentSnapshot, "schoolName")
            val displayName = readString(studentSnapshot, "name", "nama")
            val className = readString(studentSnapshot, "class", "kelas", "className")
            if (!verifyCredential(studentSnapshot, "siswa", setOf(readString(studentSnapshot, "nisn")))) {
                // #region debug-point D:bind-student-credential-reject
                debugReport(
                    hypothesisId = "D",
                    location = "LoginScreen.kt:bindStudent",
                    msg = "bindStudent rejected by credential validation",
                    data = mapOf(
                        "studentPath" to studentSnapshot.ref.path.toString(),
                        "studentNisn" to nisnValue,
                    )
                )
                // #endregion
                return
            }
            val registeredDeviceId = readString(studentSnapshot, "deviceId", "device")

            if (!SecurityUtils.matchesStoredDeviceBinding(context, registeredDeviceId)) {
                // #region debug-point D:bind-student-device-reject
                debugReport(
                    hypothesisId = "D",
                    location = "LoginScreen.kt:bindStudent",
                    msg = "bindStudent rejected by device binding",
                    data = mapOf(
                        "studentPath" to studentSnapshot.ref.path.toString(),
                        "registeredDeviceId" to registeredDeviceId,
                        "currentDeviceId" to deviceId,
                    )
                )
                // #endregion
                onError("Akun ini terkunci pada perangkat lain. Hubungi Admin/Wali Kelas untuk reset.")
                return
            }

            val studentPath = studentSnapshot.ref.path.toString().removePrefix("/")
            val updates = hashMapOf<String, Any?>(
                "$studentPath/deviceId" to deviceId,
                "$studentPath/device" to deviceId,
                "$studentPath/lastLogin" to now,
                "$studentPath/lastLoginAt" to now,
            )

            fun finalizeStudentLogin() {
                if (!saveSession(
                    role = "student",
                    schoolId = schoolIdValue,
                    npsn = npsnValue,
                    schoolName = schoolNameValue,
                    displayName = displayName,
                    studentId = studentSnapshot.key ?: "",
                    studentClass = className,
                    loginKey = nisnValue,
                    nisn = nisnValue,
                    username = readString(studentSnapshot, "username")
                )) {
                    return
                }
                // Update master_students asynchronously if available
                runCatching {
                    rootRef.child("master_students/$nisnValue/deviceId").setValue(deviceId)
                    rootRef.child("master_students/$nisnValue/device").setValue(deviceId)
                }
                onSuccess()
            }

            ensureSchoolServiceActive(schoolIdValue, npsnValue) {
                rootRef.updateChildren(updates)
                    .addOnSuccessListener {
                        if (legacySnapshot != null && legacySnapshot.exists()) {
                            val legacyKey = legacySnapshot.key ?: nisnValue
                            val legacyDeviceId = readString(legacySnapshot, "deviceId", "device")
                            if (legacyDeviceId.isBlank()) {
                                rootRef.child("students/$legacyKey/deviceId").setValue(deviceId)
                                rootRef.child("students/$legacyKey/device").setValue(deviceId)
                            }
                        }
                        finalizeStudentLogin()
                    }
                    .addOnFailureListener { e ->
                        val rawMessage = e.message.orEmpty()
                        if (rawMessage.contains("Permission denied", ignoreCase = true)) {
                            registerStudentDeviceViaCloudFunction(
                                requestedSchoolId = requestedSchoolId,
                                usernameInput = usernameInput,
                                userPassword = userPassword,
                                deviceId = deviceId,
                                onSuccess = { finalizeStudentLogin() },
                                onError = { message ->
                                    onError("Login Ditolak: Akun terkunci di perangkat lain. Minta Admin/Wali Kelas untuk Reset Device.")
                                }
                            )
                        } else {
                            onError("Gagal mendaftarkan perangkat: ${e.message}")
                        }
                    }
            }
        }

        fun completeStaffLogin(staffSnapshot: DataSnapshot) {
            if (!matchesRequestedSchool(staffSnapshot)) {
                onError("Akun petugas tidak berada pada tenant sekolah yang dipilih.")
                return
            }
            val schoolIdValue = readString(staffSnapshot, "schoolId").ifBlank { resolvedSchoolId }
            val npsnValue = readString(staffSnapshot, "npsn")
            val schoolNameValue = readString(staffSnapshot, "schoolName")
            val displayNameValue = readString(staffSnapshot, "name", "nama")
            val staffIdentity = readString(staffSnapshot, "username", "staffId", "id").ifBlank {
                usernameInput.substringBefore("@").trim().lowercase()
            }
            val registeredDeviceId = staffSnapshot.child("deviceId").getValue(String::class.java)

            ensureSchoolServiceActive(schoolIdValue, npsnValue) {
                if (registeredDeviceId == null || registeredDeviceId.isEmpty()) {
                    staffSnapshot.ref.updateChildren(
                        mutableMapOf<String, Any>(
                            "deviceId" to deviceId,
                            "device" to deviceId,
                            "lastLoginAt" to now
                        )
                    )
                        .addOnSuccessListener {
                            if (!saveSession(
                                    role = "staff",
                                    schoolId = schoolIdValue,
                                    npsn = npsnValue,
                                    schoolName = schoolNameValue,
                                    displayName = displayNameValue,
                                    loginKey = staffIdentity
                                )) {
                                return@addOnSuccessListener
                            }
                            onSuccess()
                        }
                        .addOnFailureListener { e -> onError("Gagal mendaftarkan perangkat: ${e.message}") }
                } else if (SecurityUtils.matchesStoredDeviceBinding(context, registeredDeviceId)) {
                    if (!saveSession(
                            role = "staff",
                            schoolId = schoolIdValue,
                            npsn = npsnValue,
                            schoolName = schoolNameValue,
                            displayName = displayNameValue,
                            loginKey = staffIdentity
                        )) {
                        return@ensureSchoolServiceActive
                    }
                    onSuccess()
                } else {
                    onError("Login Ditolak: Akun terkunci di perangkat lain. Minta Admin Reset Device.")
                }
            }
        }

        fun checkStudentAndTeacher() {
            if (resolvedSchoolId.isBlank()) {
                onError("School ID required.")
                return
            }
            val studentPath = "gas/schools/$resolvedSchoolId/students"
            val masterStudentsRef = rootRef.child(studentPath)
            val usernameRaw = usernameInput.substringBefore("@").trim()
            val usernameCandidates = linkedSetOf(
                usernameRaw,
                usernameRaw.lowercase()
            )
            val nameCandidates = linkedSetOf(
                usernameInput.trim(),
                usernameRaw
            )
            masterStudentsRef.child(userPassword).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        bindStudent(snapshot, null)
                    } else {
                        queryByChild(
                            path = studentPath,
                            child = "nisn",
                            value = userPassword,
                            onResult = { masterSnapshot ->
                                if (masterSnapshot != null) {
                                    bindStudent(masterSnapshot, null)
                                } else {
                                    queryByChildCandidates(
                                        path = studentPath,
                                        child = "username",
                                        values = usernameCandidates,
                                        onResult = { byUsername ->
                                            if (byUsername != null) {
                                                bindStudent(byUsername, null)
                                            } else {
                                                queryByChildCandidates(
                                                    path = studentPath,
                                                    child = "name",
                                                    values = nameCandidates,
                                                    onResult = { byName ->
                                                        if (byName != null) {
                                                            bindStudent(byName, null)
                                                        } else {
                                                            queryByChildCandidates(
                                                                path = studentPath,
                                                                child = "nama",
                                                                values = nameCandidates,
                                                                onResult = { byNama ->
                                                                    if (byNama != null) {
                                                                        bindStudent(byNama, null)
                                                                    } else {
                                                                        // #region debug-point E:student-not-found
                                                                        debugReport(
                                                                            hypothesisId = "E",
                                                                            location = "LoginScreen.kt:checkStudentAndTeacher",
                                                                            msg = "student profile not found after all lookup candidates",
                                                                            data = mapOf(
                                                                                "studentPath" to studentPath,
                                                                                "resolvedSchoolId" to resolvedSchoolId,
                                                                                "requestedAliases" to requestedTenantAliases.joinToString("|"),
                                                                                "userPassword" to userPassword,
                                                                                "usernameCandidates" to usernameCandidates.joinToString("|"),
                                                                                "nameCandidates" to nameCandidates.joinToString("|"),
                                                                            )
                                                                        )
                                                                        // #endregion
                                                                        onError("Data profil siswa tidak ditemukan di sekolah ini.")
                                                                    }
                                                                },
                                                                onFail = { message -> onError("Gagal memverifikasi data siswa: $message") }
                                                            )
                                                        }
                                                    },
                                                    onFail = { message -> onError("Gagal memverifikasi data siswa: $message") }
                                                )
                                            }
                                        },
                                        onFail = { message -> onError("Gagal memverifikasi data siswa: $message") }
                                    )
                                }
                            },
                            onFail = { message -> onError("Gagal memverifikasi data siswa: $message") }
                        )
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    onError("Gagal memverifikasi data siswa: ${error.message}")
                }
            })
        }

        fun checkTeacherMaster() {
            if (resolvedSchoolId.isBlank()) {
                onError("School ID required.")
                return
            }
            val teacherPath = "gas/schools/$resolvedSchoolId/teachers"
            val teachersRef = rootRef.child(teacherPath)
            teachersRef.child(userPassword).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) {
                        if (!verifyCredential(snapshot, "guru", setOf(readString(snapshot, "nuptk")))) {
                            return
                        }
                        completeTeacherLogin(snapshot)
                    } else {
                        queryByChild(
                            path = teacherPath,
                            child = "nuptk",
                            value = userPassword,
                            onResult = { teacherSnapshot ->
                                if (teacherSnapshot != null) {
                                    if (!verifyCredential(teacherSnapshot, "guru", setOf(readString(teacherSnapshot, "nuptk")))) {
                                        return@queryByChild
                                    }
                                    completeTeacherLogin(teacherSnapshot)
                                } else {
                                    val usernameKey = usernameInput.substringBefore("@").trim().lowercase()
                                    queryByChild(
                                        path = teacherPath,
                                        child = "username",
                                        value = usernameKey,
                                        onResult = { byUsername ->
                                            if (byUsername != null) {
                                                if (!verifyCredential(byUsername, "guru", setOf(readString(byUsername, "nuptk")))) {
                                                    return@queryByChild
                                                }
                                                completeTeacherLogin(byUsername)
                                            } else {
                                                checkStudentAndTeacher()
                                            }
                                        },
                                        onFail = { message -> checkStudentAndTeacher() }
                                    )
                                }
                            },
                            onFail = { message -> checkStudentAndTeacher() }
                        )
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    checkStudentAndTeacher()
                }
            })
        }
        
        // 0.5 Cek Petugas Tatib di Database (Dynamic Staff)
        val username = usernameInput.split("@")[0]

        fun proceedStaffStudentTeacher() {
            if (resolvedSchoolId.isBlank()) {
                onError("School ID required.")
                return
            }
            val staffPath = "gas/schools/$resolvedSchoolId/staff"
            val staffRef = db.getReference(staffPath)
            
            val staffKeyRef = staffRef.child(username)
            staffKeyRef.addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(staffSnapshot: DataSnapshot) {
                    if (staffSnapshot.exists()) {
                        // Ditemukan sebagai Staff
                        val isActive = staffSnapshot.child("isActive").getValue(Boolean::class.java) ?: true
                        
                        if (isActive) {
                            if (!ensureAllowedGuruStaffProfile(staffSnapshot)) {
                                return
                            }
                            if (!verifyCredential(staffSnapshot, "staff", emptySet())) {
                                return
                            }
                            completeStaffLogin(staffSnapshot)
                        } else {
                            onError("Akun staff dinonaktifkan.")
                        }
                    } else {
                        staffRef.orderByChild("username").equalTo(username).addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(legacyStaffSnapshot: DataSnapshot) {
                                if (legacyStaffSnapshot.exists()) {
                                    val staffData = legacyStaffSnapshot.children.first()
                                    val isActive = staffData.child("isActive").getValue(Boolean::class.java) ?: true

                                    if (isActive) {
                                        if (!ensureAllowedGuruStaffProfile(staffData)) {
                                            return
                                        }
                                        if (!verifyCredential(staffData, "staff", emptySet())) {
                                            return
                                        }
                                        completeStaffLogin(staffData)
                                    } else {
                                        onError("Akun staff dinonaktifkan.")
                                    }
                                } else {
                                    // Lanjut ke Cek Guru/Siswa jika bukan Staff
                                    checkTeacherMaster()
                                }
                            }

                            override fun onCancelled(error: DatabaseError) {
                                onError("Gagal memverifikasi staff: ${error.message}")
                            }
                        })
                    }
                }
                
                override fun onCancelled(error: DatabaseError) {
                    onError("Gagal memverifikasi staff: ${error.message}")
                }
            })
        }

        resolveRequestedTenantAliases {
            if (flavor == "kepala") {
                checkPrincipalAccount()
            } else if (flavor == "siswa") {
                // APK siswa harus memprioritaskan jalur siswa agar akun OSIS yang tetap memakai akun siswa
                // tidak tertangkap ke node staff legacy dengan username yang sama.
                checkStudentAndTeacher()
            } else {
                proceedStaffStudentTeacher()
            }
        }
    }


    // Domain default untuk auto-complete email
    val allowed = SecurityUtils.normalizeAudienceFlavor(BuildConfig.FLAVOR)
    val defaultDomain = when (allowed) {
        "kepala" -> "@kepsek.edulock.local"
        else -> "@spentgapa.sch.id"
    }
    val usernameLabel = when (allowed) {
        "guru" -> "Username (Nama Guru)"
        "kepala" -> "Username Kepala Sekolah"
        else -> "Username (Nama Siswa)"
    }
    val usernamePlaceholder = when (allowed) {
        "guru" -> "Masukkan Nama Guru"
        "kepala" -> "Masukkan Username Kepala Sekolah"
        else -> "Masukkan Nama Siswa"
    }
    val schoolLabel = "Kode Sekolah / NPSN"
    val schoolPlaceholder = "Masukkan kode sekolah Anda"
    val passwordLabel = when (allowed) {
        "guru" -> "Password (NUPTK)"
        "kepala" -> "Password / NIP"
        else -> "Password (NISN)"
    }
    val passwordPlaceholder = when (allowed) {
        "guru" -> "Masukkan NUPTK"
        "kepala" -> "Masukkan Password atau NIP"
        else -> "Masukkan NISN"
    }

    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF12D6C6),
            Color(0xFF0F7BFF),
            Color(0xFF0F2A43)
        )
    )
    val brandBrush = Brush.linearGradient(listOf(colorScheme.primary, colorScheme.secondary))
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Color.White.copy(alpha = 0.65f),
        unfocusedBorderColor = Color.White.copy(alpha = 0.35f),
        focusedLabelColor = Color.White.copy(alpha = 0.9f),
        unfocusedLabelColor = Color.White.copy(alpha = 0.85f),
        cursorColor = Color.White,
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedContainerColor = Color.White.copy(alpha = 0.12f),
        unfocusedContainerColor = Color.White.copy(alpha = 0.10f),
        focusedTrailingIconColor = Color.White.copy(alpha = 0.9f),
        unfocusedTrailingIconColor = Color.White.copy(alpha = 0.75f)
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.22f),
                            Color.Transparent
                        ),
                        radius = 900f,
                        center = androidx.compose.ui.geometry.Offset(140f, 240f)
                    )
                )
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.14f),
                            Color.Transparent
                        ),
                        radius = 700f,
                        center = androidx.compose.ui.geometry.Offset(820f, 980f)
                    )
                )
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 440.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B1F33).copy(alpha = 0.22f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        color = Color.White.copy(alpha = 0.14f),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(22.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.school_logo),
                            contentDescription = "Logo Aplikasi",
                            modifier = Modifier.padding(14.dp).size(72.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = context.getString(R.string.app_name),
                        style = MaterialTheme.typography.headlineSmall.copy(brush = brandBrush),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Gerbang Aplikasi Sekolah",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color.White.copy(alpha = 0.9f),
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = displayVersion,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    OutlinedTextField(
                        value = schoolIdInput,
                        onValueChange = { schoolIdInput = it },
                        label = { Text(schoolLabel) },
                        placeholder = { Text(schoolPlaceholder, color = Color.White.copy(alpha = 0.6f)) },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        singleLine = true,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = fieldColors
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text(usernameLabel) },
                        placeholder = { Text(usernamePlaceholder, color = Color.White.copy(alpha = 0.6f)) },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = fieldColors
                    )

                    if (emailInput.isNotEmpty() && !emailInput.contains("@")) {
                        val previewUsername = emailInput.trim().lowercase()
                            .replace("\\s+".toRegex(), "_")
                            .replace(Regex("[^a-z0-9_]"), "")

                        Text(
                            text = "Login sebagai: $previewUsername$defaultDomain",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.85f),
                            modifier = Modifier
                                .align(Alignment.Start)
                                .padding(start = 8.dp, top = 6.dp)
                        )
                    } else {
                        Spacer(modifier = Modifier.height(6.dp))
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text(passwordLabel) },
                        placeholder = { Text(passwordPlaceholder, color = Color.White.copy(alpha = 0.6f)) },
                        modifier = Modifier.fillMaxWidth(),
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = fieldColors,
                        trailingIcon = {
                            val image = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff
                            val description = if (passwordVisible) "Sembunyikan Password" else "Tampilkan Password"

                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(imageVector = image, contentDescription = description)
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    Button(
                        onClick = {
                if (schoolIdInput.isNotEmpty() && emailInput.isNotEmpty() && password.isNotEmpty()) {
                    if (!hasInternetConnection()) {
                        Toast.makeText(context, "Tidak ada koneksi internet. Coba nyalakan data/WiFi.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (SecurityUtils.isDeviceCompromised()) {
                        Toast.makeText(context, "Perangkat terdeteksi tidak aman. Login diblokir.", Toast.LENGTH_LONG).show()
                        return@Button
                    }
                    isLoading = true
                    
                    // Logika Auto-Append Domain & Sanitasi
                    // 1. Trim spasi awal/akhir
                    val rawInput = emailInput.trim()
                    val cleanUsername = rawInput.lowercase()
                        .replace("\\s+".toRegex(), "_") // Spasi jadi underscore
                        .replace(Regex("[^a-z0-9_]"), "") // Hapus karakter aneh selain _
                    
                    val finalEmail = if (rawInput.contains("@")) {
                        rawInput
                    } else {
                        // 2. Jika input adalah username (bukan email)
                        // Dari screenshot dashboard: "ACSELIN UKE" -> "acselin_uke"
                        // Ganti spasi dengan underscore, lalu bersihkan karakter lain
                        "$cleanUsername$defaultDomain"
                    }
                    
                    // 3. Password juga perlu di-trim untuk mengatasi "spasi hantu"
                    val finalPassword = password.trim()
                    val requestedSchoolId = schoolIdInput.trim().lowercase()
                    val boundaryOk = SecurityUtils.isFirebaseProjectAllowed(SecurityUtils.getActiveFirebaseProjectId())
                    if (!boundaryOk) {
                        isLoading = false
                        Toast.makeText(
                            context,
                            "Konfigurasi Firebase aplikasi tidak sesuai boundary ${BuildConfig.MOBILE_BOUNDARY}.",
                            Toast.LENGTH_LONG
                        ).show()
                        return@Button
                    }
                    val auth = runCatching { com.google.firebase.auth.FirebaseAuth.getInstance() }.getOrElse {
                        isLoading = false
                        Toast.makeText(context, "Layanan autentikasi belum siap. Coba buka ulang aplikasi.", Toast.LENGTH_LONG).show()
                        return@Button
                    }

                    val prefs = SecurePreferences.getSessionPrefs(context)

                    fun proceedAfterAuth() {
                        checkDeviceAndProceed(
                            userPassword = finalPassword,
                            usernameInput = finalEmail,
                            requestedSchoolId = requestedSchoolId,
                            onSuccess = {
                                val role = prefs.getString("user_role", "") ?: ""
                                val ok = when (allowed) {
                                    "siswa" -> role == "student"
                                    "guru" -> role == "teacher" || role == "staff"
                                    "kepala" -> role == "principal"
                                    else -> true
                                }
                                if (!ok) {
                                    isLoading = false
                                    prefs.edit().clear().apply()
                                    auth.signOut()
                                    val msg = when (allowed) {
                                        "siswa" -> "APK GAS Siswa hanya untuk akun siswa."
                                        "guru" -> "APK GAS Guru hanya untuk akun guru/petugas."
                                        "kepala" -> "APK GAS Kepala Sekolah hanya untuk akun kepala sekolah."
                                        else -> "Akun tidak sesuai dengan aplikasi ini."
                                    }
                                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    return@checkDeviceAndProceed
                                }

                                isLoading = false
                                Toast.makeText(context, "Login Berhasil!", Toast.LENGTH_SHORT).show()
                                onLoginSuccess()
                            },
                            onError = { msg ->
                                isLoading = false
                                prefs.edit().clear().apply()
                                auth.signOut()
                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            }
                        )
                    }

                    if (auth.currentUser != null) {
                        proceedAfterAuth()
                    } else {
                        auth.signInAnonymously().addOnCompleteListener { anonTask ->
                            if (anonTask.isSuccessful) {
                                proceedAfterAuth()
                            } else {
                                val authErrorMessage = anonTask.exception?.message?.trim().orEmpty()
                                debugReport(
                                    hypothesisId = "A",
                                    location = "LoginScreen.kt:signInAnonymously",
                                    msg = "anonymous auth failed",
                                    data = mapOf(
                                        "firebaseProjectId" to SecurityUtils.getActiveFirebaseProjectId(),
                                        "allowedProjectIds" to BuildConfig.ALLOWED_FIREBASE_PROJECT_IDS,
                                        "exception" to authErrorMessage,
                                    )
                                )
                                isLoading = false
                                Toast.makeText(
                                    context,
                                    if (BuildConfig.DEBUG && authErrorMessage.isNotBlank()) {
                                        "Login gagal Auth: $authErrorMessage"
                                    } else {
                                        "Login gagal: Auth belum siap. Aktifkan Anonymous di Firebase Auth atau cek koneksi."
                                    },
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                } else {
                    val emptyMessage = when (allowed) {
                        "kepala" -> "Mohon isi Kode Sekolah, Username Kepala Sekolah, dan Password/NIP."
                        "guru" -> "Mohon isi Kode Sekolah, Username, dan Password (NUPTK)."
                        else -> "Mohon isi Kode Sekolah, Username, dan Password (NISN)."
                    }
                    Toast.makeText(context, emptyMessage, Toast.LENGTH_SHORT).show()
                }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        enabled = !isLoading,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF0B1F33).copy(alpha = 0.55f),
                            contentColor = Color.White,
                            disabledContainerColor = Color(0xFF0B1F33).copy(alpha = 0.25f),
                            disabledContentColor = Color.White.copy(alpha = 0.55f)
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(text = "Masuk", style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
            }
        }
    }
}

// Extracted Error Handler untuk menghindari duplikasi
fun handleLoginError(task: com.google.android.gms.tasks.Task<com.google.firebase.auth.AuthResult>, 
                     context: android.content.Context, 
                     finalEmail: String, 
                     finalPassword: String, 
                     auth: FirebaseAuth,
                     onResult: (Boolean) -> Unit) {
    
    val errorMessage = when {
        task.exception?.message?.contains("timeout", ignoreCase = true) == true ||
        task.exception?.message?.contains("timed out", ignoreCase = true) == true ||
        task.exception?.message?.contains("Connection timed out", ignoreCase = true) == true ->
            "Koneksi timeout. Coba ganti jaringan (WiFi/data), matikan Private DNS, atau coba lagi."
        task.exception?.message?.contains("password") == true -> "Password (NISN/NUPTK) salah"
        task.exception?.message?.contains("user-not-found") == true ||
        task.exception?.message?.contains("incorrect") == true ||
        task.exception?.message?.contains("INVALID_LOGIN_CREDENTIALS") == true ->
            "Login ditolak. Akun belum terdaftar atau password salah. Hubungi Admin untuk pembuatan akun."
        task.exception?.message?.contains("badly formatted") == true -> "Format username salah"
        task.exception?.message?.contains("configuration-not-found") == true || 
        task.exception?.message?.contains("INVALID_CONFIG") == true -> 
            "Kesalahan Konfigurasi: Hubungi Admin (Email/Password Provider)"
        else -> "Login Gagal: ${task.exception?.message}"
    }
    
    // Tampilkan error jika bukan flow Auto-Register (yang return di atas)
    if (errorMessage.isNotEmpty()) {
        Toast.makeText(context, errorMessage, Toast.LENGTH_SHORT).show()
        onResult(false)
    }
}
