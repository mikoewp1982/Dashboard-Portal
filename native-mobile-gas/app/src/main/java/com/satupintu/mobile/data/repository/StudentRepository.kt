package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Student
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class StudentRepository {
    private val db = FirebaseDatabase.getInstance().reference
    private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()
    private fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()

    fun getStudents(schoolId: String = ""): Flow<List<Student>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isBlank()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val ref = db.child("gas/schools/$normalizedSchoolId/students")

        fun readStudents(snapshot: DataSnapshot): List<Student> {
            val students = mutableListOf<Student>()
            for (studentSnapshot in snapshot.children) {
                val student = parseStudent(studentSnapshot)
                if (student != null) students.add(student)
            }
            return students.sortedBy { it.name }
        }

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                trySend(readStudents(snapshot))
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        ref.addValueEventListener(listener)
        awaitClose { ref.removeEventListener(listener) }
    }

    suspend fun resolveStudent(
        studentId: String = "",
        credential: String = "",
        schoolId: String = ""
    ): Student? {
        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isBlank()) return null
        
        val candidates = linkedSetOf(
            normalizeIdentity(studentId),
            normalizeIdentity(credential)
        ).filter { it.isNotBlank() }

        if (candidates.isEmpty()) return null

        val path = "gas/schools/$normalizedSchoolId/students"

        suspend fun lookupByKey(key: String): Student? {
            if (key.isBlank()) return null
            return suspendCancellableCoroutine { cont ->
                db.child(path).child(key).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resume(parseStudent(snapshot))
                    }

                    override fun onCancelled(error: DatabaseError) {
                        cont.resumeWithException(error.toException())
                    }
                })
            }
        }

        suspend fun lookupByField(field: String, value: String): Student? {
            if (value.isBlank()) return null
            return suspendCancellableCoroutine { cont ->
                db.child(path).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resume(snapshot.children.firstOrNull()?.let(::parseStudent))
                    }

                    override fun onCancelled(error: DatabaseError) {
                        cont.resumeWithException(error.toException())
                    }
                })
            }
        }

        // 1. Try by key (if ID is the push key)
        for (candidate in candidates) {
            lookupByKey(candidate)?.let { return it }
        }

        // 2. Try by nisn (usually numeric)
        val numericCandidates = candidates.filter { it.all(Char::isDigit) }
        for (candidate in numericCandidates) {
            lookupByField("nisn", candidate)?.let { return it }
        }

        // 3. Try by username
        for (candidate in candidates) {
            lookupByField("username", candidate)?.let { return it }
        }

        return null
    }

    private fun parseStudent(snapshot: DataSnapshot): Student? {
        try {
            val id = snapshot.child("nisn").getValue(String::class.java) ?: snapshot.key ?: return null
            val name = snapshot.child("name").getValue(String::class.java) ?: snapshot.child("nama").getValue(String::class.java) ?: ""
            val nisn = snapshot.child("nisn").getValue(String::class.java) ?: ""
            val schoolId = snapshot.child("schoolId").getValue(String::class.java) ?: ""
            val className = snapshot.child("class").getValue(String::class.java) 
                ?: snapshot.child("className").getValue(String::class.java) 
                ?: snapshot.child("kelas").getValue(String::class.java) ?: ""
            val gender = snapshot.child("gender").getValue(String::class.java) ?: snapshot.child("jenis_kelamin").getValue(String::class.java) ?: ""
            val parentName = snapshot.child("parentName").getValue(String::class.java) ?: snapshot.child("nama_orang_tua").getValue(String::class.java)
            val parentPhone = snapshot.child("parentPhone").getValue(String::class.java) ?: snapshot.child("no_hp_ortu").getValue(String::class.java)
            val deviceId = snapshot.child("deviceId").getValue(String::class.java)
                ?: snapshot.child("device").getValue(String::class.java)
            val religion = snapshot.child("religion").getValue(String::class.java)
                ?: snapshot.child("agama").getValue(String::class.java)
                ?: ""
            val username = snapshot.child("username").getValue(String::class.java) ?: ""

            return Student(
                id = id,
                name = name,
                nisn = nisn,
                schoolId = schoolId,
                className = className,
                gender = gender,
                parentName = parentName,
                parentPhone = parentPhone,
                deviceId = deviceId,
                religion = religion.trim(),
                username = username.trim()
            )
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
