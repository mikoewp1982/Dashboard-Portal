package com.sekolah.edulock

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener

class RegistrationActivity : AppCompatActivity() {

    private lateinit var etNPSN: EditText
    private lateinit var etNISN: EditText
    private lateinit var etName: EditText
    private lateinit var btnRegister: Button

    private lateinit var prefsManager: PreferencesManager
    private lateinit var dbHelper: DatabaseHelper
    private lateinit var forceUpdateGate: ForceUpdateGate
    private val auth by lazy { SchoolServiceGuard.auth(this) }
    private val studentAuthService: StudentAuthService by lazy { StudentAuthService() }
    private val lookupHandler = Handler(Looper.getMainLooper())
    private var pendingLookupRunnable: Runnable? = null
    private var lookupSequence = 0
    private var lastResolvedLookupKey: String? = null

    companion object {
        private const val SCHOOL_DISABLED_TITLE = "Layanan Sekolah Nonaktif"
        private const val NAME_HINT_DEFAULT = "Terisi otomatis dari database"
        private const val NAME_HINT_LOADING = "Mencari nama siswa..."
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (BuildConfig.FLAVOR.contains("admin", ignoreCase = true)) {
            startActivity(Intent(this, AdminWebActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_registration)

        prefsManager = PreferencesManager(this)
        dbHelper = DatabaseHelper(this)
        forceUpdateGate = ForceUpdateGate(this)

        // Cek apakah user sudah register
        if (prefsManager.isRegistered) {
            ensureStudentSignedIn {
                verifyCurrentSchoolStatusAndProceed()
            }
            return
        }
        
        // Cek Error Message dari Intent (misal logout paksa)
        val errorMessage = intent.getStringExtra("ERROR_MESSAGE")
        if (errorMessage != null) {
            androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Peringatan Keamanan")
                .setMessage(errorMessage)
                .setPositiveButton("OK", null)
                .setCancelable(false)
                .show()
        }

        initViews()
        setupListeners()
    }

    override fun onStart() {
        super.onStart()
        forceUpdateGate.start()
    }

    override fun onStop() {
        super.onStop()
        forceUpdateGate.stop()
    }

    private fun initViews() {
        etNPSN = findViewById(R.id.etNPSN)
        etNISN = findViewById(R.id.etNISN)
        etName = findViewById(R.id.etName)
        btnRegister = findViewById(R.id.btnRegister)
    }

    private fun setupListeners() {
        val studentLookupWatcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = Unit

            override fun afterTextChanged(s: Editable?) {
                scheduleStudentLookup()
            }
        }

        etNPSN.addTextChangedListener(studentLookupWatcher)
        etNISN.addTextChangedListener(studentLookupWatcher)

        btnRegister.setOnClickListener {
            val npsn = etNPSN.text.toString().trim()
            val nisn = etNISN.text.toString().trim()
            val name = etName.text.toString().trim()

            if (validateInput(npsn, nisn, name)) {
                verifyStudentWithServer(npsn, nisn, name)
            }
        }
    }

    private fun scheduleStudentLookup() {
        pendingLookupRunnable?.let(lookupHandler::removeCallbacks)
        lookupSequence += 1

        val npsn = etNPSN.text.toString().trim()
        val nisn = etNISN.text.toString().trim()
        val lookupKey = buildLookupKey(npsn, nisn)

        if (lookupKey != lastResolvedLookupKey) {
            etName.setText("")
            etName.error = null
            etName.hint = NAME_HINT_DEFAULT
        }

        if (npsn.isBlank() || nisn.isBlank()) {
            lastResolvedLookupKey = null
            return
        }

        if (lookupKey == lastResolvedLookupKey && etName.text.toString().trim().isNotBlank()) {
            return
        }

        val currentSequence = lookupSequence
        etName.hint = NAME_HINT_LOADING
        pendingLookupRunnable = Runnable {
            lookupStudentName(npsn, nisn, lookupKey, currentSequence)
        }
        lookupHandler.postDelayed(pendingLookupRunnable!!, 400)
    }

    private fun lookupStudentName(
        npsn: String,
        nisn: String,
        lookupKey: String,
        requestSequence: Int
    ) {
        studentAuthService.lookupStudent(npsn, nisn) { result, error ->
            runOnUiThread {
                val currentKey = buildLookupKey(
                    etNPSN.text.toString().trim(),
                    etNISN.text.toString().trim()
                )
                if (requestSequence != lookupSequence || currentKey != lookupKey) {
                    return@runOnUiThread
                }

                if (result == null) {
                    lastResolvedLookupKey = null
                    etName.setText("")
                    etName.hint = NAME_HINT_DEFAULT
                    etName.error = error ?: "Nama siswa tidak ditemukan."
                    return@runOnUiThread
                }

                lastResolvedLookupKey = lookupKey
                etName.error = null
                etName.hint = NAME_HINT_DEFAULT
                etName.setText(result.studentName)
            }
        }
    }

    private fun buildLookupKey(npsn: String, nisn: String): String {
        return "$npsn|$nisn"
    }

    private fun verifyStudentWithServer(npsn: String, nisn: String, name: String) {
        // Show loading state
        btnRegister.isEnabled = false
        btnRegister.text = "Memverifikasi..."

        val normalizedNisn = nisn.trim()
        val deviceId = prefsManager.getDeviceBindingId(this)
        prefsManager.deviceId = deviceId

        studentAuthService.requestToken(
            npsn = npsn,
            nisn = normalizedNisn,
            name = name,
            deviceId = deviceId
        ) { result, error ->
            runOnUiThread {
                if (result == null) {
                    btnRegister.isEnabled = true
                    btnRegister.text = "Daftar"
                    Toast.makeText(this@RegistrationActivity, error ?: "Gagal verifikasi siswa.", Toast.LENGTH_LONG).show()
                    return@runOnUiThread
                }

                // Kita sudah signInAnonymously di StudentAuthService
                prefsManager.schoolId = result.schoolId
                prefsManager.schoolNpsn = result.schoolNpsn
                registerStudent(
                    result.nisn,
                    result.studentName.ifBlank { name },
                    result.className,
                    result.studentKey,
                    result.studentUsername
                )
            }
        }
    }

    private fun verifyCurrentSchoolStatusAndProceed() {
        val schoolId = SchoolServiceGuard.normalizeSchoolId(prefsManager.schoolId)
        if (schoolId.isBlank()) {
            prefsManager.isRegistered = false
            initViews()
            setupListeners()
            return
        }

        ensureSchoolServiceActive(schoolId, onDenied = {
            prefsManager.isRegistered = false
            prefsManager.isSetupCompleted = false
            initViews()
            setupListeners()
            showSchoolInactiveDialog()
        }) {
            checkSetupAndProceed()
        }
    }

    private fun ensureStudentSignedIn(onReady: () -> Unit) {
        if (auth.currentUser != null && prefsManager.studentRemoteKey.isNotBlank()) {
            onReady()
            return
        }

        val nisn = prefsManager.nisn.trim()
        val schoolNpsn = prefsManager.schoolNpsn.trim()
        val name = prefsManager.studentName.trim()
        val deviceId = prefsManager.deviceId.trim()
        if (nisn.isBlank() || schoolNpsn.isBlank() || name.isBlank() || deviceId.isBlank()) {
            prefsManager.isRegistered = false
            initViews()
            setupListeners()
            return
        }

        studentAuthService.requestToken(
            npsn = schoolNpsn,
            nisn = nisn,
            name = name,
            deviceId = deviceId
        ) { result, error ->
            runOnUiThread {
                if (result == null) {
                    prefsManager.isRegistered = false
                    prefsManager.isSetupCompleted = false
                    initViews()
                    setupListeners()
                    Toast.makeText(this@RegistrationActivity, error ?: "Sesi siswa tidak valid.", Toast.LENGTH_LONG).show()
                    return@runOnUiThread
                }

                // Sudah signInAnonymously, langsung update state
                prefsManager.schoolId = result.schoolId
                prefsManager.schoolNpsn = result.schoolNpsn
                prefsManager.saveStudentRemoteIdentity(result.studentKey, result.studentUsername)
                onReady()
            }
        }
    }

    private fun ensureSchoolServiceActive(
        schoolId: String,
        onDenied: (() -> Unit)? = null,
        onAllowed: () -> Unit
    ) {
        val normalizedSchoolId = SchoolServiceGuard.normalizeSchoolId(schoolId)
        if (normalizedSchoolId.isBlank()) {
            onAllowed()
            return
        }

        val database = SchoolServiceGuard.database(this)
        database.getReference("schools").child(normalizedSchoolId)
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val isAllowed = !snapshot.exists() || SchoolServiceGuard.isSchoolServiceActive(snapshot)
                    if (isAllowed) {
                        onAllowed()
                        return
                    }

                    btnRegister.isEnabled = true
                    btnRegister.text = "Daftar"
                    onDenied?.invoke() ?: showSchoolInactiveDialog()
                }

                override fun onCancelled(error: DatabaseError) {
                    btnRegister.isEnabled = true
                    btnRegister.text = "Daftar"
                    Toast.makeText(
                        this@RegistrationActivity,
                        "Gagal memeriksa status layanan sekolah: ${error.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun showSchoolInactiveDialog() {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(SCHOOL_DISABLED_TITLE)
            .setMessage(SchoolServiceGuard.inactiveMessage())
            .setPositiveButton("OK", null)
            .setCancelable(false)
            .show()
    }

    private fun validateInput(npsn: String, nisn: String, name: String): Boolean {
        if (npsn.isEmpty()) {
            etNPSN.error = "NPSN tidak boleh kosong"
            return false
        }
        if (nisn.isEmpty()) {
            etNISN.error = "NISN tidak boleh kosong"
            return false
        }
        if (name.isEmpty()) {
            etName.error = "Nama siswa belum ditemukan. Periksa NPSN dan NISN."
            return false
        }
        return true
    }

    private fun registerStudent(
        nisn: String,
        name: String,
        studentClass: String,
        studentKey: String,
        studentUsername: String
    ) {
        // Simpan ke database lokal
        val id = dbHelper.insertStudent(nisn, name, studentClass)

        if (id > 0) {
            val deviceId = prefsManager.getDeviceBindingId(this)
            prefsManager.deviceId = deviceId

            // Simpan ke Shared Preferences
            prefsManager.saveStudentRegistration(
                id,
                nisn,
                name,
                studentClass,
                deviceId,
                studentKey,
                studentUsername
            )

            // Update Device UUID & Telemetry awal ke Firebase
            updateFirebaseDeviceBinding(studentKey, deviceId)

            Toast.makeText(this, "Registrasi Berhasil", Toast.LENGTH_SHORT).show()

            // Pindah ke SetupActivity (Konfigurasi Awal)
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
        } else {
            btnRegister.isEnabled = true
            btnRegister.text = "Daftar"
            Toast.makeText(this, "Gagal menyimpan data lokal", Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkSetupAndProceed() {
        if (prefsManager.isSetupCompleted) {
            startActivity(Intent(this, MainActivity::class.java))
        } else {
            startActivity(Intent(this, SetupActivity::class.java))
        }
        finish()
    }

    private fun updateFirebaseDeviceBinding(studentKey: String, deviceId: String) {
        val database = SchoolServiceGuard.database(this)
        val schoolId = prefsManager.schoolId
        val studentRef = database.getReference("gas/schools/$schoolId/students").child(studentKey)
        
        // Update device_uuid and sync deviceId
        studentRef.child("device_uuid").setValue(deviceId)
        studentRef.child("deviceId").setValue(deviceId)
        studentRef.child("device").setValue(deviceId)
            .addOnFailureListener {
                Toast.makeText(this, "Gagal binding device ke server", Toast.LENGTH_SHORT).show()
            }

        try {
            val reporter = FirebaseReporter(this, prefsManager)
            reporter.sendStatusUpdate(
                latitude = 0.0,
                longitude = 0.0,
                isInsideZone = true,
                trustScore = 100,
                isGpsActive = false,
                isInternetActive = true,
                statusMessage = "Online / Fresh Registration",
                isAccessibilityEnabled = false,
                isDeviceAdminEnabled = false,
                isProtectionActive = prefsManager.isProtectionActive,
                isPermissionActive = false,
                complianceStatus = "NON_COMPLIANT",
                protectionHealth = "ACCESSIBILITY_OFF",
                lastProtectionCheckAt = System.currentTimeMillis(),
                appVersionCode = BuildConfig.VERSION_CODE
            )
        } catch (_: Exception) {
        }
    }
}
