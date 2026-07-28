package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.LiteracyLog
import com.satupintu.mobile.data.model.LiteracyTask
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class LiteracyRepository {
    private val db = FirebaseDatabase.getInstance().reference

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    private fun normalizeIdentity(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    private fun normalizeIdentitySet(values: Set<String>): Set<String> {
        return values.map(::normalizeIdentity).filter { it.isNotBlank() }.toSet()
    }

    private fun matchesStudentIdentity(snapshot: DataSnapshot, aliases: Set<String>): Boolean {
        if (aliases.isEmpty()) return false
        val candidates = listOf(
            snapshot.child("studentId").getValue(String::class.java),
            snapshot.child("nisn").getValue(String::class.java),
            snapshot.child("studentNisn").getValue(String::class.java),
            snapshot.child("username").getValue(String::class.java),
            snapshot.key
        ).map(::normalizeIdentity)
        return candidates.any(aliases::contains)
    }

    fun getLiteracyTasks(schoolId: String = ""): Flow<List<LiteracyTask>> = callbackFlow {
        val scope = normalizeScope(schoolId)
        val ref = if (scope.isBlank()) {
            db.child("literacy_tasks")
        } else {
            db.child("literacy_tasks").orderByChild("schoolId").equalTo(scope)
        }
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val tasks = mutableListOf<LiteracyTask>()
                for (child in snapshot.children) {
                    try {
                        val id = child.key ?: continue
                        val title = child.child("title").getValue(String::class.java) ?: ""
                        val description = child.child("description").getValue(String::class.java) ?: ""
                        val points = child.child("points").getValue(Int::class.java) ?: 0
                        val durationMinutes = child.child("durationMinutes").getValue(Int::class.java) ?: 0
                        val isActive = child.child("isActive").getValue(Boolean::class.java) ?: false
                        val createdAt = child.child("createdAt").getValue(Long::class.java) ?: 0L
                        val schoolId = child.child("schoolId").getValue(String::class.java) ?: ""
                        val taskScope = normalizeScope(schoolId)

                        if (scope.isBlank() || taskScope == scope) {
                            tasks.add(
                                LiteracyTask(
                                    id,
                                    title,
                                    description,
                                    points,
                                    durationMinutes,
                                    isActive,
                                    createdAt,
                                    schoolId
                                )
                            )
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                trySend(tasks.sortedByDescending { it.createdAt })
            }
            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    fun getLiteracyLogs(schoolId: String = "", studentId: String = ""): Flow<List<LiteracyLog>> {
        return getLiteracyLogs(
            schoolId = schoolId,
            studentIds = setOf(studentId)
        )
    }

    fun getLiteracyLogs(schoolId: String = "", studentIds: Set<String>): Flow<List<LiteracyLog>> = callbackFlow {
        val schoolScope = normalizeScope(schoolId)
        val studentAliases = normalizeIdentitySet(studentIds)
        val ref = if (schoolScope.isBlank()) {
            db.child("literacy_logs")
        } else {
            db.child("literacy_logs_by_school").child(schoolScope)
        }
        
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val logs = mutableListOf<LiteracyLog>()
                for (child in snapshot.children) {
                    try {
                        val id = child.key ?: continue
                        val studentId = child.child("studentId").getValue(String::class.java)
                            ?: child.child("nisn").getValue(String::class.java)
                            ?: child.child("studentNisn").getValue(String::class.java)
                            ?: ""
                        // Handle potential naming variations from different client versions
                        val studentName = child.child("studentName").getValue(String::class.java) 
                            ?: child.child("name").getValue(String::class.java) ?: "Unknown"
                        
                        val studentClass = child.child("studentClass").getValue(String::class.java)
                            ?: child.child("class").getValue(String::class.java)
                            ?: child.child("kelas").getValue(String::class.java) ?: ""
                        val schoolId = child.child("schoolId").getValue(String::class.java) ?: ""
                            
                        val taskId = child.child("taskId").getValue(String::class.java) ?: ""
                        val taskTitle = child.child("taskTitle").getValue(String::class.java) ?: ""

                        val bookTitle = child.child("bookTitle").getValue(String::class.java) ?: ""
                        val author = child.child("author").getValue(String::class.java) ?: ""
                        val summary = child.child("summary").getValue(String::class.java) ?: ""
                        val status = child.child("status").getValue(String::class.java) ?: "PENDING"
                        val grade = child.child("grade").getValue(String::class.java)
                        val feedback = child.child("feedback").getValue(String::class.java)
                        val timestamp = child.child("timestamp").getValue(Long::class.java) 
                            ?: child.child("submittedAt").getValue(String::class.java)?.let { 
                                System.currentTimeMillis() 
                            } ?: System.currentTimeMillis()

                        val logSchoolScope = normalizeScope(schoolId)
                        val matchesSchool = schoolScope.isBlank() || logSchoolScope == schoolScope || ref.key == schoolScope
                        val matchesStudent = studentAliases.isEmpty() || matchesStudentIdentity(child, studentAliases)
                        if (!matchesSchool || !matchesStudent) {
                            continue
                        }

                        logs.add(LiteracyLog(
                            id = id,
                            studentId = studentId,
                            studentName = studentName,
                            studentClass = studentClass,
                            schoolId = schoolId,
                            taskId = taskId,
                            taskTitle = taskTitle,
                            bookTitle = bookTitle,
                            author = author,
                            summary = summary,
                            status = status,
                            grade = grade,
                            feedback = feedback,
                            timestamp = timestamp
                        ))
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                // Sort by timestamp descending (newest first)
                trySend(logs.sortedByDescending { it.timestamp })
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    fun submitLog(log: LiteracyLog, onComplete: (Boolean) -> Unit) {
        val normalizedStudentId = log.studentId.trim()
        val normalizedSchoolId = normalizeScope(log.schoolId)
        if (normalizedStudentId.isBlank() || normalizedSchoolId.isBlank()) {
            onComplete(false)
            return
        }

        val ref = db.child("literacy_logs").push()
        val pushKey = ref.key ?: System.currentTimeMillis().toString()
        val logWithId = log.copy(
            id = pushKey,
            studentId = normalizedStudentId,
            studentName = log.studentName.trim(),
            studentClass = log.studentClass.trim(),
            schoolId = normalizedSchoolId,
            taskId = log.taskId.trim(),
            taskTitle = log.taskTitle.trim(),
            bookTitle = log.bookTitle.trim(),
            author = log.author.trim(),
            summary = log.summary.trim(),
            status = "PENDING"
        )
        
        val updates = HashMap<String, Any>()
        updates["literacy_logs/$pushKey"] = logWithId
        updates["literacy_logs_by_school/$normalizedSchoolId/$pushKey"] = logWithId

        db.updateChildren(updates)
            .addOnSuccessListener { onComplete(true) }
            .addOnFailureListener { onComplete(false) }
    }

    fun updateLogGrade(schoolId: String = "", logId: String, grade: String, feedback: String, onComplete: (Boolean) -> Unit) {
        val updates = HashMap<String, Any>()
        updates["literacy_logs/$logId/grade"] = grade
        updates["literacy_logs/$logId/feedback"] = feedback
        updates["literacy_logs/$logId/status"] = "GRADED"
        updates["literacy_logs/$logId/gradedAt"] = System.currentTimeMillis()

        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isNotBlank()) {
            updates["literacy_logs_by_school/$normalizedSchoolId/$logId/grade"] = grade
            updates["literacy_logs_by_school/$normalizedSchoolId/$logId/feedback"] = feedback
            updates["literacy_logs_by_school/$normalizedSchoolId/$logId/status"] = "GRADED"
            updates["literacy_logs_by_school/$normalizedSchoolId/$logId/gradedAt"] = System.currentTimeMillis()
        }

        db.updateChildren(updates)
            .addOnSuccessListener { onComplete(true) }
            .addOnFailureListener { onComplete(false) }
    }

    fun deleteLog(logId: String, onComplete: (Boolean) -> Unit) {
        db.child("literacy_logs").child(logId).removeValue()
            .addOnSuccessListener { onComplete(true) }
            .addOnFailureListener { onComplete(false) }
    }
}
