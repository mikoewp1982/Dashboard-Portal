package com.sekolah.edulock

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

class StudentAuthService {
    data class TokenResult(
        val token: String,
        val nisn: String,
        val studentName: String,
        val className: String,
        val schoolId: String,
        val schoolName: String,
        val schoolNpsn: String,
        val studentKey: String
    )

    fun requestToken(
        npsn: String,
        nisn: String,
        name: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit
    ) {
        val auth = FirebaseAuth.getInstance()
        if (auth.currentUser == null) {
            auth.signInAnonymously().addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    verifyStudentWithDatabase(npsn, nisn, name, deviceId, callback)
                } else {
                    callback(null, "Gagal terhubung ke server autentikasi: ${task.exception?.message}")
                }
            }
        } else {
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
        
        // 1. Coba langsung akses by ID di node 'schools' root
        val directSchoolRef = db.getReference("schools/$npsn")
        directSchoolRef.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(directSnapshot: DataSnapshot) {
                if (directSnapshot.exists()) {
                    proceedWithSchool(directSnapshot, npsn, nisn, name, deviceId, callback, db)
                } else {
                    // 2. Fallback: cari di child "npsn" (String) pada root 'schools'
                    val schoolsRef = db.getReference("schools")
                    schoolsRef.orderByChild("npsn").equalTo(npsn).addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(snapshot: DataSnapshot) {
                            if (!snapshot.exists()) {
                                // Coba cari sebagai Long/Integer siapa tau di DB tersimpan sebagai angka
                                val npsnNum = npsn.toLongOrNull()
                                if (npsnNum != null) {
                                    schoolsRef.orderByChild("npsn").equalTo(npsnNum.toDouble()).addListenerForSingleValueEvent(object : ValueEventListener {
                                        override fun onDataChange(numSnapshot: DataSnapshot) {
                                            if (!numSnapshot.exists()) {
                                                callback(null, "Sekolah dengan NPSN $npsn tidak ditemukan.")
                                                return
                                            }
                                            proceedWithSchool(numSnapshot.children.first(), npsn, nisn, name, deviceId, callback, db)
                                        }
                                        override fun onCancelled(error: DatabaseError) { callback(null, error.message) }
                                    })
                                } else {
                                    callback(null, "Sekolah dengan NPSN $npsn tidak ditemukan.")
                                }
                                return
                            }
                            proceedWithSchool(snapshot.children.first(), npsn, nisn, name, deviceId, callback, db)
                        }
                        override fun onCancelled(error: DatabaseError) {
                            callback(null, "Gagal menghubungi database: ${error.message}")
                        }
                    })
                }
            }
            override fun onCancelled(error: DatabaseError) {
                callback(null, "Gagal menghubungi database: ${error.message}")
            }
        })
    }

    private fun proceedWithSchool(
        schoolSnapshot: DataSnapshot,
        npsn: String,
        nisn: String,
        name: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit,
        db: FirebaseDatabase
    ) {
        val schoolId = schoolSnapshot.key ?: ""
        val schoolName = schoolSnapshot.child("schoolName").getValue(String::class.java) ?: schoolSnapshot.child("name").getValue(String::class.java) ?: ""
        val studentsRef = db.getReference("gas/schools/$schoolId/students")

        val usernameCandidate = name.trim().lowercase().replace("\\s+".toRegex(), "_").replace(Regex("[^a-z0-9_]"), "")
        
        // 2. Resolve identity by username first
        studentsRef.orderByChild("username").equalTo(usernameCandidate).addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(studentSnapshot: DataSnapshot) {
                if (studentSnapshot.exists()) {
                    bindAndReturn(studentSnapshot.children.first(), schoolId, schoolName, npsn, deviceId, callback)
                } else {
                    // 3. Fallback resolve identity by nisn
                    studentsRef.orderByChild("nisn").equalTo(nisn).addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(nisnSnapshot: DataSnapshot) {
                            if (nisnSnapshot.exists()) {
                                bindAndReturn(nisnSnapshot.children.first(), schoolId, schoolName, npsn, deviceId, callback)
                            } else {
                                // Also try exact match on student node key (some structures use nisn as key)
                                studentsRef.child(nisn).addListenerForSingleValueEvent(object : ValueEventListener {
                                    override fun onDataChange(directNisnSnapshot: DataSnapshot) {
                                        if (directNisnSnapshot.exists()) {
                                            bindAndReturn(directNisnSnapshot, schoolId, schoolName, npsn, deviceId, callback)
                                        } else {
                                            callback(null, "Siswa tidak ditemukan. Pastikan Username/Nama atau NISN benar.")
                                        }
                                    }
                                    override fun onCancelled(error: DatabaseError) { callback(null, error.message) }
                                })
                            }
                        }
                        override fun onCancelled(error: DatabaseError) { callback(null, error.message) }
                    })
                }
            }
            override fun onCancelled(error: DatabaseError) { callback(null, error.message) }
        })
    }

    private fun bindAndReturn(
        studentSnapshot: DataSnapshot,
        schoolId: String,
        schoolName: String,
        schoolNpsn: String,
        deviceId: String,
        callback: (TokenResult?, String?) -> Unit
    ) {
        val studentNisn = studentSnapshot.child("nisn").getValue(String::class.java) ?: studentSnapshot.key ?: ""
        val studentName = studentSnapshot.child("name").getValue(String::class.java) ?: studentSnapshot.child("nama").getValue(String::class.java) ?: ""
        val className = studentSnapshot.child("class").getValue(String::class.java) ?: studentSnapshot.child("kelas").getValue(String::class.java) ?: ""
        val registeredDeviceId = studentSnapshot.child("device_uuid").getValue(String::class.java) ?: studentSnapshot.child("deviceId").getValue(String::class.java) ?: studentSnapshot.child("device").getValue(String::class.java)

        if (!registeredDeviceId.isNullOrEmpty() && !registeredDeviceId.trim().equals(deviceId.trim(), ignoreCase = true)) {
            callback(null, "Akun ini sudah aktif di perangkat lain. Hubungi Admin/Wali Kelas untuk mereset akun.")
            return
        }

        // Write deviceId
        studentSnapshot.ref.child("deviceId").setValue(deviceId)
        studentSnapshot.ref.child("device").setValue(deviceId)
        studentSnapshot.ref.child("lastLoginEduLock").setValue(System.currentTimeMillis())

        // We return a "fake" token since we don't use Custom Token anymore in native-mobile-gas flow.
        // We just use anonymous auth. We pass "ANONYMOUS_AUTH" as token.
        callback(TokenResult(
            token = "ANONYMOUS_AUTH",
            schoolId = schoolId,
            schoolName = schoolName,
            schoolNpsn = schoolNpsn,
            nisn = studentNisn,
            studentName = studentName,
            className = className,
            studentKey = studentSnapshot.key ?: studentNisn
        ), null)
    }
}
