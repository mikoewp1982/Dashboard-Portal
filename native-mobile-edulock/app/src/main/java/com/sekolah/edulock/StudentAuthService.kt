package com.sekolah.edulock

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

class StudentAuthService {
    data class StudentLookupResult(
        val nisn: String,
        val studentName: String,
        val studentUsername: String,
        val className: String,
        val schoolId: String,
        val schoolName: String,
        val schoolNpsn: String,
        val studentKey: String
    )

    data class TokenResult(
        val token: String,
        val nisn: String,
        val studentName: String,
        val studentUsername: String,
        val className: String,
        val schoolId: String,
        val schoolName: String,
        val schoolNpsn: String,
        val studentKey: String
    )

    fun lookupStudent(
        npsn: String,
        nisn: String,
        callback: (StudentLookupResult?, String?) -> Unit
    ) {
        ensureAnonymousAuth { authError ->
            if (authError != null) {
                callback(null, authError)
                return@ensureAnonymousAuth
            }

            val db = FirebaseDatabase.getInstance()
            resolveSchoolAndStudent(db, npsn, nisn, null) { schoolSnapshot, studentSnapshot, error ->
                if (schoolSnapshot == null || studentSnapshot == null) {
                    callback(null, error ?: "Siswa tidak ditemukan.")
                    return@resolveSchoolAndStudent
                }

                callback(
                    extractStudentLookup(
                        studentSnapshot = studentSnapshot,
                        schoolId = schoolSnapshot.key ?: "",
                        schoolName = schoolSnapshot.child("schoolName").getValue(String::class.java)
                            ?: schoolSnapshot.child("name").getValue(String::class.java)
                            ?: "",
                        schoolNpsn = npsn
                    ),
                    null
                )
            }
        }
    }

    fun requestToken(
        npsn: String,
        nisn: String,
        name: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit
    ) {
        ensureAnonymousAuth { authError ->
            if (authError != null) {
                callback(null, authError)
                return@ensureAnonymousAuth
            }

            verifyStudentWithDatabase(npsn, nisn, name, deviceId, callback)
        }
    }

    private fun verifyStudentWithDatabase(
        npsn: String,
        nisn: String,
        name: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit
    ) {
        val db = FirebaseDatabase.getInstance()
        resolveSchoolAndStudent(db, npsn, nisn, name) { schoolSnapshot, studentSnapshot, error ->
            if (schoolSnapshot == null || studentSnapshot == null) {
                callback(null, error ?: "Siswa tidak ditemukan.")
                return@resolveSchoolAndStudent
            }

            val schoolId = schoolSnapshot.key ?: ""
            val schoolName = schoolSnapshot.child("schoolName").getValue(String::class.java)
                ?: schoolSnapshot.child("name").getValue(String::class.java)
                ?: ""
            bindAndReturn(studentSnapshot, schoolId, schoolName, npsn, deviceId, callback)
        }
    }

    private fun ensureAnonymousAuth(callback: (String?) -> Unit) {
        val auth = FirebaseAuth.getInstance()
        if (auth.currentUser != null) {
            callback(null)
            return
        }

        auth.signInAnonymously().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                callback(null)
            } else {
                callback("Gagal terhubung ke server autentikasi: ${task.exception?.message}")
            }
        }
    }

    private fun resolveSchoolAndStudent(
        db: FirebaseDatabase,
        npsn: String,
        nisn: String,
        name: String?,
        callback: (DataSnapshot?, DataSnapshot?, String?) -> Unit
    ) {
        resolveSchoolByNpsn(db, npsn) { schoolSnapshot, schoolError ->
            if (schoolSnapshot == null) {
                callback(null, null, schoolError ?: "Sekolah tidak ditemukan.")
                return@resolveSchoolByNpsn
            }

            val schoolId = schoolSnapshot.key ?: ""
            val studentsRef = db.getReference("gas/schools/$schoolId/students")
            findStudentByNisn(studentsRef, nisn) { nisnSnapshot, nisnError ->
                if (nisnSnapshot != null) {
                    callback(schoolSnapshot, nisnSnapshot, null)
                    return@findStudentByNisn
                }

                if (name.isNullOrBlank()) {
                    callback(null, null, nisnError ?: "Siswa dengan NISN $nisn tidak ditemukan.")
                    return@findStudentByNisn
                }

                findStudentByUsername(studentsRef, name) { usernameSnapshot, usernameError ->
                    if (usernameSnapshot != null) {
                        callback(schoolSnapshot, usernameSnapshot, null)
                    } else {
                        callback(
                            null,
                            null,
                            usernameError ?: nisnError ?: "Siswa tidak ditemukan. Pastikan nama atau NISN benar."
                        )
                    }
                }
            }
        }
    }

    private fun resolveSchoolByNpsn(
        db: FirebaseDatabase,
        npsn: String,
        callback: (DataSnapshot?, String?) -> Unit
    ) {
        val directSchoolRef = db.getReference("schools/$npsn")
        directSchoolRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(directSnapshot: DataSnapshot) {
                if (directSnapshot.exists()) {
                    callback(directSnapshot, null)
                    return
                }

                val schoolsRef = db.getReference("schools")
                schoolsRef.orderByChild("npsn").equalTo(npsn)
                    .addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(snapshot: DataSnapshot) {
                            if (snapshot.exists()) {
                                callback(snapshot.children.first(), null)
                                return
                            }

                            val npsnNum = npsn.toLongOrNull()
                            if (npsnNum == null) {
                                callback(null, "Sekolah dengan NPSN $npsn tidak ditemukan.")
                                return
                            }

                            schoolsRef.orderByChild("npsn").equalTo(npsnNum.toDouble())
                                .addListenerForSingleValueEvent(object : ValueEventListener {
                                    override fun onDataChange(numSnapshot: DataSnapshot) {
                                        if (numSnapshot.exists()) {
                                            callback(numSnapshot.children.first(), null)
                                        } else {
                                            callback(null, "Sekolah dengan NPSN $npsn tidak ditemukan.")
                                        }
                                    }

                                    override fun onCancelled(error: DatabaseError) {
                                        callback(null, "Gagal menghubungi database: ${error.message}")
                                    }
                                })
                        }

                        override fun onCancelled(error: DatabaseError) {
                            callback(null, "Gagal menghubungi database: ${error.message}")
                        }
                    })
            }

            override fun onCancelled(error: DatabaseError) {
                callback(null, "Gagal menghubungi database: ${error.message}")
            }
        })
    }

    private fun findStudentByNisn(
        studentsRef: DatabaseReference,
        nisn: String,
        callback: (DataSnapshot?, String?) -> Unit
    ) {
        studentsRef.orderByChild("nisn").equalTo(nisn)
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(nisnSnapshot: DataSnapshot) {
                    if (nisnSnapshot.exists()) {
                        callback(nisnSnapshot.children.first(), null)
                        return
                    }

                    val nisnNumber = nisn.toLongOrNull()
                    if (nisnNumber == null) {
                        findStudentByKey(studentsRef, nisn, callback)
                        return
                    }

                    studentsRef.orderByChild("nisn").equalTo(nisnNumber.toDouble())
                        .addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(numericSnapshot: DataSnapshot) {
                                if (numericSnapshot.exists()) {
                                    callback(numericSnapshot.children.first(), null)
                                    return
                                }

                                findStudentByKey(studentsRef, nisn, callback)
                            }

                            override fun onCancelled(error: DatabaseError) {
                                callback(null, error.message)
                            }
                        })
                }

                override fun onCancelled(error: DatabaseError) {
                    callback(null, error.message)
                }
            })
    }

    private fun findStudentByKey(
        studentsRef: DatabaseReference,
        nisn: String,
        callback: (DataSnapshot?, String?) -> Unit
    ) {
        studentsRef.child(nisn).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(directNisnSnapshot: DataSnapshot) {
                if (directNisnSnapshot.exists()) {
                    callback(directNisnSnapshot, null)
                } else {
                    callback(null, "Siswa dengan NISN $nisn tidak ditemukan.")
                }
            }

            override fun onCancelled(error: DatabaseError) {
                callback(null, error.message)
            }
        })
    }

    private fun findStudentByUsername(
        studentsRef: DatabaseReference,
        name: String,
        callback: (DataSnapshot?, String?) -> Unit
    ) {
        val usernameCandidate = name.trim()
            .lowercase()
            .replace("\\s+".toRegex(), "_")
            .replace(Regex("[^a-z0-9_]"), "")

        if (usernameCandidate.isBlank()) {
            callback(null, "Nama siswa tidak valid.")
            return
        }

        studentsRef.orderByChild("username").equalTo(usernameCandidate)
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(studentSnapshot: DataSnapshot) {
                    if (studentSnapshot.exists()) {
                        callback(studentSnapshot.children.first(), null)
                    } else {
                        callback(null, "Siswa tidak ditemukan. Pastikan nama atau NISN benar.")
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    callback(null, error.message)
                }
            })
    }

    private fun extractStudentLookup(
        studentSnapshot: DataSnapshot,
        schoolId: String,
        schoolName: String,
        schoolNpsn: String
    ): StudentLookupResult {
        val studentNisn = studentSnapshot.child("nisn").getValue(String::class.java)
            ?: studentSnapshot.key
            ?: ""
        val studentName = studentSnapshot.child("name").getValue(String::class.java)
            ?: studentSnapshot.child("nama").getValue(String::class.java)
            ?: ""
        val studentUsername = studentSnapshot.child("username").getValue(String::class.java)
            ?.trim()
            .orEmpty()
        val className = studentSnapshot.child("class").getValue(String::class.java)
            ?: studentSnapshot.child("kelas").getValue(String::class.java)
            ?: ""

        return StudentLookupResult(
            nisn = studentNisn,
            studentName = studentName,
            studentUsername = studentUsername,
            className = className,
            schoolId = schoolId,
            schoolName = schoolName,
            schoolNpsn = schoolNpsn,
            studentKey = studentSnapshot.key ?: studentNisn
        )
    }

    private fun bindAndReturn(
        studentSnapshot: DataSnapshot,
        schoolId: String,
        schoolName: String,
        schoolNpsn: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit
    ) {
        val registeredDeviceId = studentSnapshot.child("device_uuid").getValue(String::class.java) ?: studentSnapshot.child("deviceId").getValue(String::class.java) ?: studentSnapshot.child("device").getValue(String::class.java)

        if (!registeredDeviceId.isNullOrEmpty() && !registeredDeviceId.trim().equals(deviceId.trim(), ignoreCase = true)) {
            callback(null, "Akun ini sudah aktif di perangkat lain. Hubungi Admin/Wali Kelas untuk mereset akun.")
            return
        }

        // Write deviceId
        studentSnapshot.ref.child("deviceId").setValue(deviceId)
        studentSnapshot.ref.child("device").setValue(deviceId)
        studentSnapshot.ref.child("lastLoginEduLock").setValue(System.currentTimeMillis())

        val studentLookup = extractStudentLookup(
            studentSnapshot = studentSnapshot,
            schoolId = schoolId,
            schoolName = schoolName,
            schoolNpsn = schoolNpsn
        )

        callback(TokenResult(
            token = "ANONYMOUS_AUTH",
            schoolId = studentLookup.schoolId,
            schoolName = studentLookup.schoolName,
            schoolNpsn = studentLookup.schoolNpsn,
            nisn = studentLookup.nisn,
            studentName = studentLookup.studentName,
            studentUsername = studentLookup.studentUsername,
            className = studentLookup.className,
            studentKey = studentLookup.studentKey
        ), null)
    }
}
