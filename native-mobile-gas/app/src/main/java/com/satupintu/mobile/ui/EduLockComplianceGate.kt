package com.satupintu.mobile.ui

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

private const val EDULOCK_PACKAGE = "com.sekolah.edulock"
private const val TELEMETRY_STALE_MS = 15 * 60 * 1000L

data class EduLockComplianceState(
    val isChecking: Boolean = true,
    val isBlocked: Boolean = false,
    val reason: String = ""
)

/**
 * Fail-compatible untuk APK EduLock lama:
 * - EduLock tidak terpasang: blokir.
 * - Telemetry baru menyatakan NON_COMPLIANT/stale: blokir.
 * - Node telemetry belum punya field compliance (APK lama): izinkan.
 * - Admin mematikan proteksi: izinkan.
 */
@Composable
fun rememberEduLockComplianceState(
    context: Context,
    schoolId: String,
    aliases: Set<String>,
    enabled: Boolean
): State<EduLockComplianceState> {
    val state = remember(schoolId, aliases, enabled) {
        mutableStateOf(EduLockComplianceState(isChecking = enabled))
    }

    DisposableEffect(schoolId, aliases, enabled) {
        if (!enabled) {
            state.value = EduLockComplianceState(isChecking = false)
            return@DisposableEffect onDispose {}
        }

        if (!isEduLockInstalled(context)) {
            state.value = EduLockComplianceState(
                isChecking = false,
                isBlocked = true,
                reason = "Aplikasi EduLock tidak ditemukan. Install EduLock untuk menggunakan fitur siswa."
            )
            return@DisposableEffect onDispose {}
        }

        if (schoolId.isBlank() || aliases.isEmpty()) {
            state.value = EduLockComplianceState(isChecking = false)
            return@DisposableEffect onDispose {}
        }

        val ref = FirebaseDatabase.getInstance()
            .getReference("active_devices")
            .child(schoolId.trim().lowercase())

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val record = findLatestMatchingDevice(snapshot, aliases)
                if (record == null) {
                    // Backward-compatible: jangan memblokir sebelum EduLock baru mengirim telemetry.
                    state.value = EduLockComplianceState(isChecking = false)
                    return
                }

                val compliance = readString(record, "complianceStatus").uppercase()
                val health = readString(record, "protectionHealth").uppercase()
                val hasNewTelemetry = compliance.isNotBlank() || health.isNotBlank()
                if (!hasNewTelemetry) {
                    state.value = EduLockComplianceState(isChecking = false)
                    return
                }

                val protectionActive = readBoolean(record, "isProtectionActive")
                if (protectionActive == false || compliance == "PAUSED" || health == "ADMIN_DISABLED") {
                    state.value = EduLockComplianceState(isChecking = false)
                    return
                }

                val lastUpdated = readLong(record, "lastProtectionCheckAt", "lastUpdated")
                val stale = lastUpdated > 0L && System.currentTimeMillis() - lastUpdated > TELEMETRY_STALE_MS
                val blocked = stale ||
                    compliance == "NON_COMPLIANT" ||
                    health == "ACCESSIBILITY_OFF" ||
                    health == "DEVICE_ADMIN_OFF"

                state.value = EduLockComplianceState(
                    isChecking = false,
                    isBlocked = blocked,
                    reason = when {
                        health == "ACCESSIBILITY_OFF" ->
                            "Proteksi Aksesibilitas EduLock tidak aktif. Aktifkan EduLock Protection terlebih dahulu."
                        health == "DEVICE_ADMIN_OFF" ->
                            "Administrator Perangkat EduLock tidak aktif. Aktifkan proteksi perangkat terlebih dahulu."
                        stale ->
                            "Status perlindungan EduLock sudah tidak terhubung lebih dari 15 menit. Buka EduLock untuk memulihkan proteksi."
                        blocked ->
                            "Proteksi EduLock belum sehat. Buka EduLock dan selesaikan aktivasi proteksi."
                        else -> ""
                    }
                )
            }

            override fun onCancelled(error: DatabaseError) {
                // Fail-open pada gangguan Firebase agar GAS tidak rusak karena jaringan.
                state.value = EduLockComplianceState(isChecking = false)
            }
        }

        ref.addValueEventListener(listener)
        onDispose { ref.removeEventListener(listener) }
    }

    return state
}

@Composable
fun EduLockComplianceOverlay(
    state: EduLockComplianceState,
    onOpenEduLock: () -> Unit,
    onLogout: () -> Unit
) {
    if (!state.isChecking && !state.isBlocked) return

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF450A0A).copy(alpha = 0.97f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (state.isChecking) {
                    CircularProgressIndicator(color = Color.White)
                } else {
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = "Proteksi EduLock tidak aktif",
                        tint = Color.White,
                        modifier = Modifier.size(42.dp)
                    )
                }

                Text(
                    text = if (state.isChecking) "Memeriksa Proteksi EduLock" else "AKSES GAS DITAHAN",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = if (state.isChecking) {
                        "Mohon tunggu sebentar."
                    } else {
                        state.reason
                    },
                    textAlign = TextAlign.Center,
                    color = Color.White.copy(alpha = 0.9f)
                )

                if (!state.isChecking) {
                    Button(onClick = onOpenEduLock) {
                        Text("BUKA EDULOCK")
                    }
                    Button(onClick = onLogout) {
                        Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("Keluar", modifier = Modifier.padding(start = 8.dp))
                    }
                }
            }
        }
    }
}

fun openEduLock(context: Context): Boolean {
    return try {
        val intent = context.packageManager.getLaunchIntentForPackage(EDULOCK_PACKAGE) ?: return false
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        context.startActivity(intent)
        true
    } catch (_: Exception) {
        false
    }
}

private fun isEduLockInstalled(context: Context): Boolean {
    return try {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            context.packageManager.getPackageInfo(
                EDULOCK_PACKAGE,
                PackageManager.PackageInfoFlags.of(0)
            )
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(EDULOCK_PACKAGE, 0)
        }
        true
    } catch (_: Exception) {
        false
    }
}

private fun findLatestMatchingDevice(root: DataSnapshot, aliases: Set<String>): DataSnapshot? {
    val normalizedAliases = aliases.map { it.trim() }.filter { it.isNotBlank() }.toSet()
    var best: DataSnapshot? = null
    var bestUpdated = Long.MIN_VALUE
    for (child in root.children) {
        val candidates = setOf(
            readString(child, "nisn"),
            readString(child, "studentNisn"),
            readString(child, "studentId"),
            readString(child, "studentKey"),
            readString(child, "username")
        ).filter { it.isNotBlank() }
        if (candidates.none { it in normalizedAliases }) continue
        val updated = readLong(child, "lastProtectionCheckAt", "lastUpdated")
        if (best == null || updated >= bestUpdated) {
            best = child
            bestUpdated = updated
        }
    }
    return best
}

private fun readString(snapshot: DataSnapshot, key: String): String {
    return snapshot.child(key).getValue(String::class.java).orEmpty().trim()
}

private fun readBoolean(snapshot: DataSnapshot, key: String): Boolean? {
    return try {
        snapshot.child(key).getValue(Boolean::class.java)
    } catch (_: Exception) {
        null
    }
}

private fun readLong(snapshot: DataSnapshot, vararg keys: String): Long {
    for (key in keys) {
        try {
            snapshot.child(key).getValue(Long::class.java)?.let { return it }
        } catch (_: Exception) {
        }
        snapshot.child(key).getValue(String::class.java)?.toLongOrNull()?.let { return it }
    }
    return 0L
}
