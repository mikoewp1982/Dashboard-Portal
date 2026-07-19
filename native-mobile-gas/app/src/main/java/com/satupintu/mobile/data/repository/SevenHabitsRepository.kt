package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.HabitLog
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.text.SimpleDateFormat
import java.util.*

class SevenHabitsRepository {
    private val db = FirebaseDatabase.getInstance().reference

    private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()

    fun getStudentLogs(studentId: String): Flow<Map<String, HabitLog>> = getStudentLogs(studentId, "")

    fun getStudentLogs(studentId: String, schoolId: String): Flow<Map<String, HabitLog>> = callbackFlow {
        val normalizedStudentId = studentId.trim()
        val normalizedSchoolId = normalizeScope(schoolId)

        if (normalizedStudentId.isBlank()) {
            trySend(emptyMap())
            close()
            return@callbackFlow
        }

        val legacyRef = db.child("seven_habits_logs").child(normalizedStudentId)
        val scopedRef = if (normalizedSchoolId.isBlank()) {
            null
        } else {
            db.child("seven_habits_logs_by_school").child(normalizedSchoolId).child(normalizedStudentId)
        }

        var scopedHasData = false

        val scopedListener = scopedRef?.let { ref ->
            object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val logs = readLogsSnapshot(snapshot, normalizedStudentId, normalizedSchoolId)
                    scopedHasData = logs.isNotEmpty()
                    if (scopedHasData) {
                        trySend(logs)
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
        }

        val legacyListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (scopedHasData) return
                val logs = readLogsSnapshot(snapshot, normalizedStudentId, normalizedSchoolId)
                trySend(logs)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        scopedRef?.addValueEventListener(scopedListener!!)
        legacyRef.addValueEventListener(legacyListener)

        awaitClose {
            scopedRef?.removeEventListener(scopedListener!!)
            legacyRef.removeEventListener(legacyListener)
        }
    }

    fun saveLog(log: HabitLog, onComplete: (Boolean) -> Unit) {
        val studentId = log.studentId.trim()
        val date = log.date.trim()
        val schoolId = normalizeScope(log.schoolId)

        if (studentId.isBlank() || date.isBlank()) {
            onComplete(false)
            return
        }

        if (schoolId.isBlank()) {
            db.child("seven_habits_logs")
                .child(studentId)
                .child(date)
                .setValue(log)
                .addOnCompleteListener { task -> onComplete(task.isSuccessful) }
            return
        }

        val updates = hashMapOf<String, Any?>(
            "seven_habits_logs/$studentId/$date" to log,
            "seven_habits_logs_by_school/$schoolId/$studentId/$date" to log
        )
        db.updateChildren(updates).addOnCompleteListener { task ->
            onComplete(task.isSuccessful)
        }
    }

    private fun readLogsSnapshot(
        snapshot: DataSnapshot,
        fallbackStudentId: String,
        normalizedSchoolId: String
    ): Map<String, HabitLog> {
        val logs = linkedMapOf<String, HabitLog>()
        snapshot.children.forEach { child ->
            val parsed = parseHabitLog(child, fallbackStudentId)
            if (parsed != null) {
                val parsedSchoolId = normalizeScope(parsed.schoolId)
                if (normalizedSchoolId.isBlank() || parsedSchoolId.isBlank() || parsedSchoolId == normalizedSchoolId) {
                    logs[parsed.date] = parsed
                }
            }
        }
        return logs
    }

    private fun parseHabitLog(snapshot: DataSnapshot, fallbackStudentId: String): HabitLog? {
        val date = snapshot.child("date").getValue(String::class.java)
            ?: snapshot.key
            ?: return null

        val studentId = snapshot.child("studentId").getValue(String::class.java)
            ?: fallbackStudentId
        if (studentId.isBlank()) return null

        val habitsNode = snapshot.child("habits")
        val habits = linkedMapOf(
            "habit1" to readHabitValue(habitsNode, snapshot, "habit1"),
            "habit2" to readHabitValue(habitsNode, snapshot, "habit2"),
            "habit3" to readHabitValue(habitsNode, snapshot, "habit3"),
            "habit4" to readHabitValue(habitsNode, snapshot, "habit4"),
            "habit5" to readHabitValue(habitsNode, snapshot, "habit5"),
            "habit6" to readHabitValue(habitsNode, snapshot, "habit6"),
            "habit7" to readHabitValue(habitsNode, snapshot, "habit7")
        )

        return HabitLog(
            id = snapshot.child("id").getValue(String::class.java) ?: "${studentId}_$date",
            studentId = studentId,
            schoolId = snapshot.child("schoolId").getValue(String::class.java).orEmpty(),
            date = date,
            habits = habits,
            timestamp = snapshot.child("timestamp").getValue(Long::class.java) ?: 0L
        )
    }

    private fun readHabitValue(
        habitsNode: DataSnapshot,
        rootNode: DataSnapshot,
        key: String
    ): Boolean {
        return habitsNode.child(key).getValue(Boolean::class.java)
            ?: rootNode.child(key).getValue(Boolean::class.java)
            ?: false
    }
}

