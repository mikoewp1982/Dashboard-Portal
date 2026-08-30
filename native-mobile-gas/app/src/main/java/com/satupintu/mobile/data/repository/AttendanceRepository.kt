package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.Query
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Attendance
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.Calendar

class AttendanceRepository {
    private val db = FirebaseDatabase.getInstance().reference

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    private fun asLong(value: Any?): Long {
        return when (value) {
            is Long -> value
            is Int -> value.toLong()
            is Double -> value.toLong()
            is Float -> value.toLong()
            is Number -> value.toLong()
            is String -> value.toLongOrNull() ?: 0L
            else -> 0L
        }
    }

    private fun asDouble(value: Any?): Double? {
        return when (value) {
            null -> null
            is Double -> value
            is Float -> value.toDouble()
            is Long -> value.toDouble()
            is Int -> value.toDouble()
            is Number -> value.toDouble()
            is String -> value.toDoubleOrNull()
            else -> null
        }
    }

    private fun asFloat(value: Any?): Float? {
        return asDouble(value)?.toFloat()
    }

    private fun parseAttendance(snapshot: DataSnapshot): Attendance? {
        return try {
            val id = snapshot.key ?: return null
            val raw = snapshot.value as? Map<*, *> ?: emptyMap<Any, Any>()
            Attendance(
                id = id,
                studentId = raw["studentId"]?.toString().orEmpty(),
                schoolId = raw["schoolId"]?.toString().orEmpty(),
                date = asLong(raw["date"]),
                status = raw["status"]?.toString() ?: "ABSENT",
                checkInTime = raw["checkInTime"]?.toString().orEmpty(),
                checkOutTime = raw["checkOutTime"]?.toString(),
                checkInMethod = raw["checkInMethod"]?.toString() ?: "MANUAL",
                notes = raw["notes"]?.toString(),
                proofDocument = raw["proofDocument"]?.toString(),
                recordedBy = raw["recordedBy"]?.toString(),
                verificationStatus = raw["verificationStatus"]?.toString() ?: "APPROVED",
                verifiedBy = raw["verifiedBy"]?.toString(),
                verifiedAt = raw["verifiedAt"]?.let(::asLong)?.takeIf { it > 0L },
                proposedBy = raw["proposedBy"]?.toString(),
                proposedAt = raw["proposedAt"]?.let(::asLong)?.takeIf { it > 0L },
                proposedStatus = raw["proposedStatus"]?.toString(),
                latitude = asDouble(raw["latitude"]),
                longitude = asDouble(raw["longitude"]),
                locationAccuracyMeters = asFloat(raw["locationAccuracyMeters"]),
                locationProvider = raw["locationProvider"]?.toString(),
                isMockLocation = raw["isMockLocation"] as? Boolean ?: false,
                deviceTimeTrusted = raw["deviceTimeTrusted"] as? Boolean ?: true,
                nisn = raw["nisn"]?.toString().orEmpty(),
                username = raw["username"]?.toString().orEmpty(),
                studentName = raw["studentName"]?.toString().orEmpty(),
                className = raw["className"]?.toString().orEmpty()
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun attendanceQuery(schoolId: String, start: Long, end: Long): Query {
        val normalizedSchoolId = normalizeScope(schoolId)
        return if (normalizedSchoolId.isNotBlank()) {
            db.child("attendance_by_school").child(normalizedSchoolId)
                .orderByChild("date")
                .startAt(start.toDouble())
                .endAt(end.toDouble())
        } else {
            db.child("attendance")
                .orderByChild("date")
                .startAt(start.toDouble())
                .endAt(end.toDouble())
        }
    }

    fun getAttendanceByRange(startMillis: Long, endMillis: Long, schoolId: String = ""): Flow<List<Attendance>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        val query = attendanceQuery(normalizedSchoolId, startMillis, endMillis)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val records = snapshot.children.mapNotNull(::parseAttendance).filter { attendance ->
                    normalizedSchoolId.isBlank() || normalizeScope(attendance.schoolId) == normalizedSchoolId
                }
                trySend(records)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun getAttendanceByDate(dateMillis: Long, schoolId: String = ""): Flow<List<Attendance>> = callbackFlow {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = dateMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startOfDay = calendar.timeInMillis

        calendar.set(Calendar.HOUR_OF_DAY, 23)
        calendar.set(Calendar.MINUTE, 59)
        calendar.set(Calendar.SECOND, 59)
        val endOfDay = calendar.timeInMillis

        val normalizedSchoolId = normalizeScope(schoolId)
        val query = attendanceQuery(normalizedSchoolId, startOfDay, endOfDay)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val records = snapshot.children.mapNotNull(::parseAttendance).filter { attendance ->
                    normalizedSchoolId.isBlank() || normalizeScope(attendance.schoolId) == normalizedSchoolId
                }
                trySend(records)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun getAttendanceByMonth(month: Int, year: Int, schoolId: String = ""): Flow<List<Attendance>> = callbackFlow {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.YEAR, year)
        calendar.set(Calendar.MONTH, month)
        calendar.set(Calendar.DAY_OF_MONTH, 1)
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startOfMonth = calendar.timeInMillis

        calendar.add(Calendar.MONTH, 1)
        calendar.add(Calendar.MILLISECOND, -1)
        val endOfMonth = calendar.timeInMillis

        val normalizedSchoolId = normalizeScope(schoolId)
        val query = attendanceQuery(normalizedSchoolId, startOfMonth, endOfMonth)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val records = snapshot.children.mapNotNull(::parseAttendance).filter { attendance ->
                    normalizedSchoolId.isBlank() || normalizeScope(attendance.schoolId) == normalizedSchoolId
                }
                trySend(records)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun saveAttendance(attendance: Attendance, onComplete: (Boolean) -> Unit) {
        val normalizedSchoolId = normalizeScope(attendance.schoolId)
        if (normalizedSchoolId.isBlank()) {
            onComplete(false)
            return
        }
        val attendanceId = if (attendance.id.isNotEmpty()) {
            attendance.id
        } else {
            db.child("attendance").push().key.orEmpty()
        }
        if (attendanceId.isBlank()) {
            onComplete(false)
            return
        }

        val attendanceWithId = attendance.copy(id = attendanceId, schoolId = normalizedSchoolId)
        val updates = mapOf<String, Any?>(
            "attendance/$attendanceId" to attendanceWithId,
            "attendance_by_school/$normalizedSchoolId/$attendanceId" to attendanceWithId
        )
        db.updateChildren(updates).addOnCompleteListener { task ->
            onComplete(task.isSuccessful)
        }
    }

    fun deleteAttendance(attendanceId: String, schoolId: String = "", onComplete: (Boolean) -> Unit) {
        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isBlank()) {
            onComplete(false)
            return
        }
        val updates = mapOf<String, Any?>(
            "attendance/$attendanceId" to null,
            "attendance_by_school/$normalizedSchoolId/$attendanceId" to null
        )
        db.updateChildren(updates).addOnCompleteListener { task ->
            onComplete(task.isSuccessful)
        }
    }
}
