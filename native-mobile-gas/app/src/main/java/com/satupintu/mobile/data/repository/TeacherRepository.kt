package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.Query
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.Teacher
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class TeacherRepository {
    private val db = FirebaseDatabase.getInstance().reference
    private fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()

    private fun parseTeacherSnapshot(snapshot: DataSnapshot): Teacher? {
        if (!snapshot.exists()) return null
        return try {
            val id = snapshot.key ?: ""
            val name = snapshot.child("name").getValue(String::class.java)
                ?: snapshot.child("nama").getValue(String::class.java)
                ?: ""
            val nuptkVal = snapshot.child("nuptk").getValue(String::class.java) ?: id
            val homeroomClass = snapshot.child("homeroomClass").getValue(String::class.java)
                ?: snapshot.child("class").getValue(String::class.java)
                ?: snapshot.child("kelas").getValue(String::class.java)
                ?: snapshot.child("wali_kelas").getValue(String::class.java)
                ?: ""
            val schoolId = snapshot.child("schoolId").getValue(String::class.java) ?: ""
            val email = snapshot.child("email").getValue(String::class.java) ?: ""
            val phone = snapshot.child("phone").getValue(String::class.java)
                ?: snapshot.child("no_hp").getValue(String::class.java)
                ?: ""

            Teacher(
                id = id,
                nuptk = nuptkVal,
                name = name,
                homeroomClass = homeroomClass,
                schoolId = schoolId,
                email = email,
                phone = phone
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getTeacherByNuptk(nuptk: String, schoolId: String): Flow<Teacher?> = callbackFlow {
        val normalizedSchoolId = schoolId.trim().lowercase()
        val normalizedNuptk = nuptk.trim()
        
        if (normalizedSchoolId.isBlank() || normalizedNuptk.isBlank()) {
            trySend(null)
            close()
            return@callbackFlow
        }

        val ref = db.child("gas/schools/$normalizedSchoolId/teachers")
        
        val directRef = ref.child(normalizedNuptk)

        val directListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (snapshot.exists()) {
                    trySend(parseTeacherSnapshot(snapshot))
                } else {
                    val query = ref.orderByChild("nuptk").equalTo(normalizedNuptk)
                    query.addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(querySnapshot: DataSnapshot) {
                            if (querySnapshot.exists()) {
                                trySend(parseTeacherSnapshot(querySnapshot.children.first()))
                            } else {
                                // Try username
                                val usernameQuery = ref.orderByChild("username").equalTo(normalizedNuptk)
                                usernameQuery.addListenerForSingleValueEvent(object : ValueEventListener {
                                    override fun onDataChange(userSnapshot: DataSnapshot) {
                                        if (userSnapshot.exists()) {
                                            trySend(parseTeacherSnapshot(userSnapshot.children.first()))
                                        } else {
                                            trySend(null)
                                        }
                                    }
                                    override fun onCancelled(error: DatabaseError) {
                                        trySend(null)
                                    }
                                })
                            }
                        }

                        override fun onCancelled(error: DatabaseError) {
                            trySend(null)
                        }
                    })
                }
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        directRef.addValueEventListener(directListener)
        awaitClose {
            directRef.removeEventListener(directListener)
        }
    }

    suspend fun resolveTeacher(credential: String, schoolId: String = ""): Teacher? {
        val normalizedCredential = normalizeIdentity(credential)
        val normalizedSchoolId = schoolId.trim().lowercase()
        
        if (normalizedCredential.isBlank() || normalizedSchoolId.isBlank()) return null
        
        val path = "gas/schools/$normalizedSchoolId/teachers"

        suspend fun lookupByKey(key: String): Teacher? {
            return suspendCancellableCoroutine { cont ->
                db.child(path).child(key).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resume(parseTeacherSnapshot(snapshot))
                    }

                    override fun onCancelled(error: DatabaseError) {
                        cont.resumeWithException(error.toException())
                    }
                })
            }
        }

        suspend fun lookupByField(field: String, value: String): Teacher? {
            return suspendCancellableCoroutine { cont ->
                db.child(path).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resume(snapshot.children.firstOrNull()?.let(::parseTeacherSnapshot))
                    }

                    override fun onCancelled(error: DatabaseError) {
                        cont.resumeWithException(error.toException())
                    }
                })
            }
        }

        lookupByKey(normalizedCredential)?.let { return it }
        lookupByField("nuptk", normalizedCredential)?.let { return it }
        lookupByField("username", normalizedCredential)?.let { return it }
        return null
    }
}

