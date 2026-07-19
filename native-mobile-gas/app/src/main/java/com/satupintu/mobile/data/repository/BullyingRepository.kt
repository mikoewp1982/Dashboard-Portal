package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.BullyingReport
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.concurrent.atomic.AtomicBoolean

class BullyingRepository {
    private val db = FirebaseDatabase.getInstance().reference
    private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()
    private fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()

    private fun parseReport(snapshot: DataSnapshot): BullyingReport? {
        return try {
            snapshot.getValue(BullyingReport::class.java)?.copy(id = snapshot.key ?: "")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getAllReports(schoolId: String = ""): Flow<List<BullyingReport>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isBlank()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val ref = db.child("gas/schools/$normalizedSchoolId/halo_spentgapa_reports")
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val reports = snapshot.children.mapNotNull(::parseReport)
                    .sortedByDescending { it.createdAt }
                trySend(reports)
            }
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    fun updateReportStatus(schoolId: String, reportId: String, status: String, onComplete: (Boolean) -> Unit) {
        val normalizedSchoolId = normalizeScope(schoolId)
        val normalizedReportId = reportId.trim()
        if (normalizedSchoolId.isBlank() || normalizedReportId.isBlank()) {
            onComplete(false)
            return
        }

        val updates = hashMapOf<String, Any>(
            "status" to status,
            "updatedAt" to System.currentTimeMillis()
        )
        if (status == "RESOLVED" || status == "CLOSED") {
            updates["resolvedAt"] = System.currentTimeMillis()
        }

        db.child("gas/schools/$normalizedSchoolId/halo_spentgapa_reports").child(normalizedReportId)
            .updateChildren(updates)
            .addOnSuccessListener { onComplete(true) }
            .addOnFailureListener { onComplete(false) }
    }

    fun createReport(report: BullyingReport, onComplete: (Boolean) -> Unit) {
        val normalizedSchoolId = normalizeScope(report.schoolId)
        if (normalizedSchoolId.isBlank()) {
            onComplete(false)
            return
        }

        val ref = db.child("gas/schools/$normalizedSchoolId/halo_spentgapa_reports")
        val key = ref.push().key
        if (key == null) {
            onComplete(false)
            return
        }

        val newReport = report.copy(
            id = key,
            schoolId = normalizedSchoolId,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        ref.child(key).setValue(newReport)
            .addOnSuccessListener { onComplete(true) }
            .addOnFailureListener { onComplete(false) }
    }

    fun getStudentReports(studentId: String, schoolId: String = ""): Flow<List<BullyingReport>> {
        return getStudentReports(setOf(studentId), schoolId)
    }

    fun getStudentReports(studentIds: Set<String>, schoolId: String = ""): Flow<List<BullyingReport>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        val normalizedStudentIds = studentIds
            .map(::normalizeIdentity)
            .filter { it.isNotBlank() }
            .distinct()
            .toSet()

        if (normalizedStudentIds.isEmpty() || normalizedSchoolId.isBlank()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val ref = db.child("gas/schools/$normalizedSchoolId/halo_spentgapa_reports")
        
        // Listen to all reports and filter locally, or use orderByChild?
        // Let's use orderByChild("reporterId") if possible, but we can't easily query multiple IDs in one listener.
        // So we just fetch all and filter locally for simplicity and because it's scoped by tenant.
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val reports = snapshot.children.mapNotNull(::parseReport)
                    .filter { report ->
                        val reporter = normalizeIdentity(report.reporterId)
                        reporter.isNotBlank() && normalizedStudentIds.any { it == reporter }
                    }
                    .sortedByDescending { it.createdAt }
                trySend(reports)
            }
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }
}
