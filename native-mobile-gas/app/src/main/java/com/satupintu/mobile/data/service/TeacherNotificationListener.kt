package com.satupintu.mobile.data.service

import android.content.Context
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.Query
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.utils.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class TeacherNotificationListener(private val context: Context) {

    private val notificationHelper = NotificationHelper(context)
    private var isFirstLoadLiteracy = true
    private var isFirstLoadBullying = true
    private var isFirstLoadIncompleteLiteracy = true
    private var isFirstLoadPetDeath = true

    // Track known IDs to avoid spamming on restart (session memory)
    private val knownLiteracyIds = mutableSetOf<String>()
    private val knownBullyingIds = mutableSetOf<String>()
    private var lastAnnouncementId: String? = null
    private var lastIncompleteSignature: String? = null
    private var lastIncompleteNotifyAt = 0L
    private val knownDeadPetStudentKeys = mutableSetOf<String>()
    private val petDeadStateByStudent = mutableMapOf<String, Boolean>()

    // Listeners references for cleanup
    private var literacyListener: ValueEventListener? = null
    private var bullyingListener: ValueEventListener? = null
    private var teacherAnnouncementListener: ValueEventListener? = null
    private var studentAnnouncementListener: ValueEventListener? = null
    private var studentPetListener: ValueEventListener? = null
    private var studentsListener: ValueEventListener? = null
    private var incompleteTasksListener: ValueEventListener? = null
    private var incompleteLogsListener: ValueEventListener? = null
    private var supervisedPetsListener: ValueEventListener? = null

    private val db = FirebaseDatabase.getInstance()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var teacherBootstrapJob: Job? = null

    // State tracking for student Pet (siswa role)
    private var lastPetState: String = "HEALTHY" // HEALTHY, SICK, DEAD

    // Supervised roster for guru role
    private var supervisedClassName: String = ""
    private var supervisedSchoolId: String = ""
    private var supervisedStudentIds: Set<String> = emptySet()
    private var supervisedStudentNames: Set<String> = emptySet()
    private var supervisedStudentLabels: Map<String, String> = emptyMap() // identity -> display name
    private var rosterReady: Boolean = false
    private var teacherDataListenersStarted: Boolean = false

    // Cached literacy snapshots for incomplete evaluation
    private var cachedActiveTasks: List<Pair<String, String>> = emptyList() // id to title
    private var cachedLogsByStudent: Map<String, Set<String>> = emptyMap() // studentId -> submitted taskIds

    private var activePetRef: Query? = null
    private val petQueryListeners = mutableListOf<Pair<Query, ValueEventListener>>()
    private var activeBullyingRef: Query? = null
    private var activeTeacherAnnouncementRef: DatabaseReference? = null
    private var activeStudentAnnouncementRef: DatabaseReference? = null
    private var activeStudentsRef: DatabaseReference? = null
    private var activeTasksRef: Query? = null
    private var activeLogsRef: Query? = null
    private var activeSupervisedPetsRef: Query? = null
    private val teacherAnnouncementListeners =
        mutableListOf<Pair<DatabaseReference, ValueEventListener>>()
    private val studentAnnouncementListeners =
        mutableListOf<Pair<DatabaseReference, ValueEventListener>>()

    fun startListening(userRole: String, userCredential: String = "", schoolId: String = "") {
        startListening(userRole, setOf(userCredential).filter { it.isNotBlank() }.toSet(), schoolId)
    }

    fun startListening(userRole: String, identityAliases: Set<String>, schoolId: String = "") {
        // Stop any existing listeners first to avoid duplicates or wrong role data
        stopListening()

        val aliases = identityAliases.map { it.trim() }.filter { it.isNotBlank() }.toSet()

        if (userRole == "Guru") {
            bootstrapTeacherListening(schoolId, aliases)
            listenForTeacherAnnouncements(schoolId, aliases)
        } else if (userRole == "Siswa") {
            listenForStudentAnnouncements(schoolId, aliases)
            listenForStudentPet(schoolId, aliases)
        }
    }

    fun stopListening() {
        teacherBootstrapJob?.cancel()
        teacherBootstrapJob = null
        scope.coroutineContext.cancelChildren()

        literacyListener?.let { db.getReference("literacy_logs").removeEventListener(it) }
        bullyingListener?.let {
            activeBullyingRef?.removeEventListener(it)
        }
        studentsListener?.let { activeStudentsRef?.removeEventListener(it) }
        incompleteTasksListener?.let { activeTasksRef?.removeEventListener(it) }
        incompleteLogsListener?.let { activeLogsRef?.removeEventListener(it) }
        supervisedPetsListener?.let { activeSupervisedPetsRef?.removeEventListener(it) }

        teacherAnnouncementListeners.forEach { (ref, listener) ->
            ref.removeEventListener(listener)
        }
        studentAnnouncementListeners.forEach { (ref, listener) ->
            ref.removeEventListener(listener)
        }
        teacherAnnouncementListeners.clear()
        studentAnnouncementListeners.clear()

        petQueryListeners.forEach { (ref, listener) -> ref.removeEventListener(listener) }
        petQueryListeners.clear()

        literacyListener = null
        bullyingListener = null
        teacherAnnouncementListener = null
        studentAnnouncementListener = null
        studentPetListener = null
        studentsListener = null
        incompleteTasksListener = null
        incompleteLogsListener = null
        supervisedPetsListener = null
        activePetRef = null
        activeBullyingRef = null
        activeTeacherAnnouncementRef = null
        activeStudentAnnouncementRef = null
        activeStudentsRef = null
        activeTasksRef = null
        activeLogsRef = null
        activeSupervisedPetsRef = null

        isFirstLoadLiteracy = true
        isFirstLoadBullying = true
        isFirstLoadIncompleteLiteracy = true
        isFirstLoadPetDeath = true
        knownLiteracyIds.clear()
        knownBullyingIds.clear()
        knownDeadPetStudentKeys.clear()
        petDeadStateByStudent.clear()
        lastIncompleteSignature = null
        lastIncompleteNotifyAt = 0L
        lastAnnouncementId = null
        supervisedClassName = ""
        supervisedSchoolId = ""
        supervisedStudentIds = emptySet()
        supervisedStudentNames = emptySet()
        supervisedStudentLabels = emptyMap()
        rosterReady = false
        teacherDataListenersStarted = false
        cachedActiveTasks = emptyList()
        cachedLogsByStudent = emptyMap()
        lastPetState = "HEALTHY"
    }

    private fun bootstrapTeacherListening(schoolId: String, identityAliases: Set<String>) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        if (normalizedSchoolId.isBlank()) {
            // Fallback: school-scoped listeners without class filter
            startTeacherDataListeners(normalizedSchoolId)
            return
        }

        teacherBootstrapJob = scope.launch {
            val homeroom = resolveTeacherHomeroom(normalizedSchoolId, identityAliases)
            supervisedClassName = normalizeClassName(homeroom)
            supervisedSchoolId = normalizedSchoolId
            listenForSupervisedStudents(normalizedSchoolId)
            startTeacherDataListeners(normalizedSchoolId)
        }
    }

    private suspend fun resolveTeacherHomeroom(schoolId: String, aliases: Set<String>): String {
        val teachersRef = db.getReference("gas/schools/$schoolId/teachers")
        for (alias in aliases) {
            try {
                val direct = teachersRef.child(alias).get().await()
                parseHomeroom(direct)?.let { return it }

                val byNuptk = teachersRef.orderByChild("nuptk").equalTo(alias).get().await()
                byNuptk.children.firstOrNull()?.let { parseHomeroom(it) }?.let { return it }

                val byUsername = teachersRef.orderByChild("username").equalTo(alias).get().await()
                byUsername.children.firstOrNull()?.let { parseHomeroom(it) }?.let { return it }
            } catch (_: Exception) {
                // try next alias
            }
        }
        return ""
    }

    private fun parseHomeroom(snapshot: DataSnapshot): String? {
        if (!snapshot.exists()) return null
        return snapshot.child("homeroomClass").getValue(String::class.java)
            ?: snapshot.child("class").getValue(String::class.java)
            ?: snapshot.child("kelas").getValue(String::class.java)
            ?: snapshot.child("wali_kelas").getValue(String::class.java)
    }

    private fun listenForSupervisedStudents(schoolId: String) {
        val ref = db.getReference("gas/schools/$schoolId/students")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val ids = mutableSetOf<String>()
                val names = mutableSetOf<String>()
                val labels = mutableMapOf<String, String>()
                val targetClass = supervisedClassName

                for (child in snapshot.children) {
                    val className = child.child("className").getValue(String::class.java)
                        ?: child.child("kelas").getValue(String::class.java)
                        ?: child.child("class").getValue(String::class.java)
                        ?: ""
                    if (targetClass.isNotBlank() && normalizeClassName(className) != targetClass) {
                        continue
                    }

                    val name = child.child("name").getValue(String::class.java)
                        ?: child.child("nama").getValue(String::class.java)
                        ?: "Siswa"
                    val identities = listOf(
                        child.key,
                        child.child("id").getValue(String::class.java),
                        child.child("nisn").getValue(String::class.java),
                        child.child("username").getValue(String::class.java)
                    ).map { it?.trim().orEmpty() }.filter { it.isNotBlank() }

                    identities.forEach { id ->
                        ids.add(id)
                        labels[id] = name
                        labels[id.lowercase()] = name
                    }
                    val normalizedName = normalizeName(name)
                    if (normalizedName.isNotBlank()) names.add(normalizedName)
                }

                supervisedStudentIds = ids
                supervisedStudentNames = names
                supervisedStudentLabels = labels
                rosterReady = true
                evaluateIncompleteLiteracy()
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        ref.addValueEventListener(listener)
        studentsListener = listener
        activeStudentsRef = ref
    }

    private fun startTeacherDataListeners(schoolId: String) {
        if (teacherDataListenersStarted) return
        teacherDataListenersStarted = true
        listenForPendingLiteracy(schoolId)
        listenForBullying(schoolId)
        listenForIncompleteLiteracy(schoolId)
        listenForSupervisedPetDeaths(schoolId)
    }

    private fun isSupervisedStudent(studentId: String?, studentName: String? = null): Boolean {
        if (!rosterReady) {
            // Until roster loads, keep school-scoped behavior for pending literacy/aduan
            return true
        }
        if (supervisedClassName.isBlank() && supervisedStudentIds.isEmpty()) {
            return true
        }
        val id = studentId?.trim().orEmpty()
        if (id.isNotBlank()) {
            if (supervisedStudentIds.contains(id) ||
                supervisedStudentIds.any { it.equals(id, ignoreCase = true) }
            ) {
                return true
            }
        }
        val name = normalizeName(studentName)
        return name.isNotBlank() && supervisedStudentNames.contains(name)
    }

    private fun listenForPendingLiteracy(schoolId: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        val lListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var newItemsCount = 0

                for (child in snapshot.children) {
                    val id = child.key ?: continue
                    val logSchoolId = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotEmpty() && logSchoolId.isNotEmpty() && logSchoolId != normalizedSchoolId) {
                        continue
                    }
                    val status = child.child("status").getValue(String::class.java)
                    val studentId = child.child("studentId").getValue(String::class.java)
                        ?: child.child("nisn").getValue(String::class.java)
                    val studentName = child.child("studentName").getValue(String::class.java)
                        ?: child.child("name").getValue(String::class.java)

                    if (status.equals("pending", ignoreCase = true) &&
                        isSupervisedStudent(studentId, studentName)
                    ) {
                        if (!knownLiteracyIds.contains(id)) {
                            knownLiteracyIds.add(id)
                            if (!isFirstLoadLiteracy) {
                                newItemsCount++
                            }
                        }
                    }
                }

                if (newItemsCount > 0) {
                    notificationHelper.showNotification(
                        "Tugas Literasi Baru",
                        "Ada $newItemsCount tugas literasi baru yang perlu dinilai.",
                        NotificationHelper.NOTIFICATION_ID_LITERACY_PENDING
                    )
                }
                isFirstLoadLiteracy = false
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        db.getReference("literacy_logs").addValueEventListener(lListener)
        literacyListener = lListener
    }

    private fun listenForBullying(schoolId: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        val bListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var newItemsCount = 0

                for (child in snapshot.children) {
                    val id = child.key ?: continue
                    val logSchoolId = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotEmpty() && logSchoolId.isNotEmpty() && logSchoolId != normalizedSchoolId) {
                        continue
                    }
                    val status = child.child("status").getValue(String::class.java)
                    val reporterId = child.child("reporterId").getValue(String::class.java)
                    val victimId = child.child("victimId").getValue(String::class.java)
                    val perpetratorId = child.child("perpetratorId").getValue(String::class.java)

                    val relevant = isSupervisedStudent(reporterId) ||
                        isSupervisedStudent(victimId) ||
                        isSupervisedStudent(perpetratorId)

                    if (relevant &&
                        (status.equals("Unhandled", ignoreCase = true) ||
                            status.equals("Belum Ditangani", ignoreCase = true) ||
                            status.equals("PENDING", ignoreCase = true))
                    ) {
                        if (!knownBullyingIds.contains(id)) {
                            knownBullyingIds.add(id)
                            if (!isFirstLoadBullying) {
                                newItemsCount++
                            }
                        }
                    }
                }

                if (newItemsCount > 0) {
                    notificationHelper.showNotification(
                        "Laporan Bullying Baru",
                        "Ada $newItemsCount laporan bullying baru yang masuk.",
                        NotificationHelper.NOTIFICATION_ID_BULLYING
                    )
                }
                isFirstLoadBullying = false
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        db.getReference("gas/schools/${normalizedSchoolId}/halo_spentgapa_reports").also { ref ->
            activeBullyingRef = ref
            ref.addValueEventListener(bListener)
        }
        bullyingListener = bListener
    }

    private fun listenForIncompleteLiteracy(schoolId: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)

        val tasksQuery: Query = if (normalizedSchoolId.isBlank()) {
            db.getReference("literacy_tasks")
        } else {
            db.getReference("literacy_tasks").orderByChild("schoolId").equalTo(normalizedSchoolId)
        }
        val tasksListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val tasks = mutableListOf<Pair<String, String>>()
                for (child in snapshot.children) {
                    val id = child.key ?: continue
                    val isActive = child.child("isActive").getValue(Boolean::class.java) ?: false
                    val taskSchool = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (!isActive) continue
                    if (normalizedSchoolId.isNotBlank() && taskSchool.isNotBlank() && taskSchool != normalizedSchoolId) {
                        continue
                    }
                    val title = child.child("title").getValue(String::class.java) ?: "Tugas Literasi"
                    tasks.add(id to title)
                }
                cachedActiveTasks = tasks
                evaluateIncompleteLiteracy()
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        tasksQuery.addValueEventListener(tasksListener)
        incompleteTasksListener = tasksListener
        activeTasksRef = tasksQuery

        val logsQuery: Query = if (normalizedSchoolId.isBlank()) {
            db.getReference("literacy_logs")
        } else {
            db.getReference("literacy_logs_by_school").child(normalizedSchoolId)
        }
        val logsListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val byStudent = mutableMapOf<String, MutableSet<String>>()
                for (child in snapshot.children) {
                    val studentId = child.child("studentId").getValue(String::class.java)
                        ?: child.child("nisn").getValue(String::class.java)
                        ?: child.child("studentNisn").getValue(String::class.java)
                        ?: continue
                    val taskId = child.child("taskId").getValue(String::class.java)?.trim().orEmpty()
                    if (taskId.isBlank()) continue
                    val key = studentId.trim()
                    if (key.isBlank()) continue
                    byStudent.getOrPut(key) { mutableSetOf() }.add(taskId)
                    byStudent.getOrPut(key.lowercase()) { mutableSetOf() }.add(taskId)
                }
                cachedLogsByStudent = byStudent
                evaluateIncompleteLiteracy()
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        logsQuery.addValueEventListener(logsListener)
        incompleteLogsListener = logsListener
        activeLogsRef = logsQuery
    }

    private fun evaluateIncompleteLiteracy() {
        if (!rosterReady || cachedActiveTasks.isEmpty()) {
            if (rosterReady && cachedActiveTasks.isEmpty()) {
                isFirstLoadIncompleteLiteracy = false
                lastIncompleteSignature = ""
            }
            return
        }
        if (supervisedStudentIds.isEmpty() && supervisedClassName.isNotBlank()) {
            // Class known but empty roster — nothing to notify
            isFirstLoadIncompleteLiteracy = false
            return
        }

        // Build unique supervised students by preferred identity (nisn-like keys from labels)
        val uniqueStudents = linkedMapOf<String, String>() // primaryKey -> displayName
        supervisedStudentLabels.forEach { (identity, name) ->
            // Prefer non-lowercase duplicate keys; skip pure lowercase mirror entries when original exists
            val primary = identity
            if (primary.isBlank()) return@forEach
            val existing = uniqueStudents.entries.firstOrNull { (key, value) ->
                value.equals(name, ignoreCase = true) || key.equals(primary, ignoreCase = true)
            }
            if (existing == null) {
                uniqueStudents[primary] = name
            }
        }

        // Fallback: if labels empty, use ids directly
        if (uniqueStudents.isEmpty()) {
            supervisedStudentIds.forEach { id ->
                uniqueStudents.putIfAbsent(id, supervisedStudentLabels[id] ?: "Siswa")
            }
        }

        val incompleteNames = mutableListOf<String>()
        val incompleteKeys = mutableSetOf<String>()
        uniqueStudents.forEach { (primaryKey, displayName) ->
            val aliases = supervisedStudentIds.filter {
                it.equals(primaryKey, ignoreCase = true) ||
                    supervisedStudentLabels[it].equals(displayName, ignoreCase = true)
            }.ifEmpty { listOf(primaryKey) }

            val submitted = mutableSetOf<String>()
            aliases.forEach { alias ->
                cachedLogsByStudent[alias]?.let { submitted.addAll(it) }
                cachedLogsByStudent[alias.lowercase()]?.let { submitted.addAll(it) }
            }

            val missing = cachedActiveTasks.any { (taskId, _) -> !submitted.contains(taskId) }
            if (missing) {
                incompleteKeys.add(primaryKey.lowercase())
                incompleteNames.add(displayName)
            }
        }

        val signature = buildString {
            append(cachedActiveTasks.map { it.first }.sorted().joinToString(","))
            append("|")
            append(incompleteKeys.sorted().joinToString(","))
        }

        if (isFirstLoadIncompleteLiteracy) {
            lastIncompleteSignature = signature
            isFirstLoadIncompleteLiteracy = false
            return
        }

        if (incompleteKeys.isEmpty()) {
            lastIncompleteSignature = signature
            return
        }

        val previousKeys = lastIncompleteSignature
            ?.substringAfter("|", "")
            ?.split(",")
            ?.filter { it.isNotBlank() }
            ?.toSet()
            .orEmpty()
        val newlyIncomplete = incompleteKeys - previousKeys
        val tasksChanged = lastIncompleteSignature?.substringBefore("|") !=
            cachedActiveTasks.map { it.first }.sorted().joinToString(",")

        val now = System.currentTimeMillis()
        val cooldownElapsed = now - lastIncompleteNotifyAt >= INCOMPLETE_COOLDOWN_MS
        val shouldNotify = (newlyIncomplete.isNotEmpty() || (tasksChanged && incompleteKeys.isNotEmpty())) &&
            cooldownElapsed &&
            signature != lastIncompleteSignature

        if (shouldNotify) {
            val preview = incompleteNames.distinct().take(3).joinToString(", ")
            val more = incompleteNames.distinct().size - 3
            val namePart = if (more > 0) "$preview, +$more lainnya" else preview
            notificationHelper.showNotification(
                "Literasi Belum Dikerjakan",
                "${incompleteKeys.size} siswa belum mengerjakan literasi aktif ($namePart).",
                NotificationHelper.NOTIFICATION_ID_LITERACY_INCOMPLETE
            )
            lastIncompleteNotifyAt = now
        }
        lastIncompleteSignature = signature
    }

    private fun listenForSupervisedPetDeaths(schoolId: String) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        val petsQuery: Query = if (normalizedSchoolId.isBlank()) {
            db.getReference("virtual_pets")
        } else {
            db.getReference("virtual_pets").orderByChild("schoolId").equalTo(normalizedSchoolId)
        }

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                if (!rosterReady) return

                val bestByStudent = linkedMapOf<String, DataSnapshot>()
                for (child in snapshot.children) {
                    val petSchool = normalizeSchoolScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotBlank() && petSchool.isNotBlank() && petSchool != normalizedSchoolId) {
                        continue
                    }
                    val studentId = child.child("studentId").getValue(String::class.java)?.trim().orEmpty()
                    if (studentId.isBlank() || !isSupervisedStudent(studentId)) continue

                    val key = studentId
                    val existing = bestByStudent[key]
                    if (existing == null || rankPet(child) > rankPet(existing)) {
                        bestByStudent[key] = child
                    }
                }

                val newlyDeadNames = mutableListOf<String>()
                bestByStudent.forEach { (studentId, petSnap) ->
                    val status = petSnap.child("status").getValue(String::class.java) ?: "HAPPY"
                    val health = petSnap.child("health").getValue(Int::class.java) ?: 100
                    val happiness = petSnap.child("happiness").getValue(Int::class.java) ?: 100
                    val energy = petSnap.child("energy").getValue(Int::class.java) ?: 100
                    val hunger = petSnap.child("hunger").getValue(Int::class.java) ?: 0
                    val manualReviveUntil = petSnap.child("manualReviveUntil").getValue(Long::class.java) ?: 0L
                    val fullness = (100 - hunger).coerceIn(0, 100)
                    val lowestVital = minOf(health, happiness, energy, fullness)
                    val isGraceActive = manualReviveUntil > System.currentTimeMillis()
                    val isDead = !isGraceActive && (
                        status.equals("DEAD", ignoreCase = true) ||
                            health <= 0 ||
                            lowestVital <= 0
                        )

                    // Align with shared rule helper fields when possible
                    val wasDead = petDeadStateByStudent[studentId.lowercase()] == true
                    petDeadStateByStudent[studentId.lowercase()] = isDead

                    if (isFirstLoadPetDeath) {
                        if (isDead) knownDeadPetStudentKeys.add(studentId.lowercase())
                        return@forEach
                    }

                    if (isDead && !wasDead && !knownDeadPetStudentKeys.contains(studentId.lowercase())) {
                        knownDeadPetStudentKeys.add(studentId.lowercase())
                        val name = supervisedStudentLabels[studentId]
                            ?: supervisedStudentLabels[studentId.lowercase()]
                            ?: "Siswa"
                        newlyDeadNames.add(name)
                    } else if (!isDead) {
                        knownDeadPetStudentKeys.remove(studentId.lowercase())
                    }
                }

                if (isFirstLoadPetDeath) {
                    isFirstLoadPetDeath = false
                    return
                }

                if (newlyDeadNames.isNotEmpty()) {
                    val preview = newlyDeadNames.distinct().take(3).joinToString(", ")
                    val more = newlyDeadNames.distinct().size - 3
                    val namePart = if (more > 0) "$preview, +$more lainnya" else preview
                    val title = if (newlyDeadNames.size == 1) "Pet Siswa Mati" else "Pet Siswa Mati"
                    val body = if (newlyDeadNames.size == 1) {
                        "Pet $namePart telah mati."
                    } else {
                        "${newlyDeadNames.size} pet siswa mati ($namePart)."
                    }
                    notificationHelper.showNotification(
                        title,
                        body,
                        NotificationHelper.NOTIFICATION_ID_PET_DEAD
                    )
                }
            }

            override fun onCancelled(error: DatabaseError) {}
        }
        petsQuery.addValueEventListener(listener)
        supervisedPetsListener = listener
        activeSupervisedPetsRef = petsQuery
    }

    private fun rankPet(child: DataSnapshot): Long {
        val updatedAt = child.child("updatedAt").getValue(Long::class.java) ?: 0L
        val lastQuestReset = child.child("lastQuestReset").getValue(Long::class.java) ?: 0L
        val lastPlayed = child.child("lastPlayed").getValue(Long::class.java) ?: 0L
        val lastFed = child.child("lastFed").getValue(Long::class.java) ?: 0L
        return maxOf(updatedAt, lastQuestReset, lastPlayed, lastFed)
    }

    private fun listenForStudentPet(schoolId: String, identityAliases: Set<String>) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        val aliases = identityAliases.map { it.trim() }.filter { it.isNotBlank() }.toSet()
        if (aliases.isEmpty()) return

        val bestByAlias = mutableMapOf<String, DataSnapshot?>()

        fun emitBest() {
            val chosen = bestByAlias.values.filterNotNull().maxByOrNull(::rankPet) ?: return
            val petSchoolId = normalizeSchoolScope(chosen.child("schoolId").getValue(String::class.java))
            if (normalizedSchoolId.isNotBlank() && petSchoolId.isNotBlank() && petSchoolId != normalizedSchoolId) return

            val status = chosen.child("status").getValue(String::class.java) ?: "HAPPY"
            val health = chosen.child("health").getValue(Int::class.java) ?: 100
            val happiness = chosen.child("happiness").getValue(Int::class.java) ?: 100
            val energy = chosen.child("energy").getValue(Int::class.java) ?: 100
            val hunger = chosen.child("hunger").getValue(Int::class.java) ?: 0
            val manualReviveUntil = chosen.child("manualReviveUntil").getValue(Long::class.java) ?: 0L

            val fullness = (100 - hunger).coerceIn(0, 100)
            val lowestVital = minOf(health, happiness, energy, fullness)
            val isGraceActive = manualReviveUntil > System.currentTimeMillis()
            val isDead = !isGraceActive && (status == "DEAD" || health <= 0 || lowestVital <= 0)
            val isSick = !isDead && (health < 30 || happiness < 30)

            val currentState = when {
                isDead -> "DEAD"
                isSick -> "SICK"
                else -> "HEALTHY"
            }

            if (currentState != lastPetState) {
                if (currentState == "DEAD") {
                    notificationHelper.showNotification(
                        "🚨 Pet Anda MATI!",
                        "Sayang sekali, Pet Anda telah mati. Hubungi Admin untuk pemulihan."
                    )
                } else if (currentState == "SICK") {
                    notificationHelper.showNotification(
                        "⚠️ Pet Anda SAKIT!",
                        "Kesehatan Pet menurun drastis. Segera cek dan rawat Pet Anda!"
                    )
                }
                lastPetState = currentState
            }
        }

        aliases.forEach { alias ->
            val petQuery = db.getReference("virtual_pets").orderByChild("studentId").equalTo(alias)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) {
                        bestByAlias[alias] = null
                        return
                    }

                    var chosen: DataSnapshot? = null
                    var chosenScore = Long.MIN_VALUE
                    for (child in snapshot.children) {
                        val score = rankPet(child)
                        if (chosen == null || score > chosenScore) {
                            chosen = child
                            chosenScore = score
                        }
                    }

                    bestByAlias[alias] = chosen
                    emitBest()
                }

                override fun onCancelled(error: DatabaseError) {}
            }

            petQuery.addValueEventListener(listener)
            petQueryListeners.add(petQuery to listener)
            studentPetListener = listener
            activePetRef = petQuery
        }
    }

    private fun listenForTeacherAnnouncements(schoolId: String, identityAliases: Set<String>) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        if (normalizedSchoolId.isBlank() || identityAliases.isEmpty()) return

        identityAliases.forEach { alias ->
            val ref = db.getReference("gas/schools/$normalizedSchoolId/notification_inbox/teacher/$alias")
            val tListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) return

                    val lastChild = snapshot.children.maxByOrNull { child ->
                        child.child("sentAt").getValue(Long::class.java) ?: Long.MIN_VALUE
                    } ?: return
                    val id = lastChild.key ?: return
                    val content = lastChild.child("message").value?.toString() ?: "Pengumuman Baru"
                    val title = lastChild.child("title").value?.toString() ?: "Pengumuman Guru"

                    if (lastAnnouncementId != null && lastAnnouncementId != id) {
                        notificationHelper.showNotification(
                            title,
                            content,
                            NotificationHelper.NOTIFICATION_ID_ANNOUNCEMENT
                        )
                    }
                    lastAnnouncementId = id
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            ref.addValueEventListener(tListener)
            teacherAnnouncementListeners.add(ref to tListener)
            teacherAnnouncementListener = tListener
            activeTeacherAnnouncementRef = ref
        }
    }

    private fun listenForStudentAnnouncements(schoolId: String, identityAliases: Set<String>) {
        val normalizedSchoolId = normalizeSchoolScope(schoolId)
        if (normalizedSchoolId.isBlank() || identityAliases.isEmpty()) return

        identityAliases.forEach { alias ->
            val ref = db.getReference("gas/schools/$normalizedSchoolId/notification_inbox/student/$alias")
            val sListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (!snapshot.exists()) return

                    val lastChild = snapshot.children.maxByOrNull { child ->
                        child.child("sentAt").getValue(Long::class.java) ?: Long.MIN_VALUE
                    } ?: return
                    val id = lastChild.key ?: return
                    val content = lastChild.child("message").value?.toString() ?: "Pengumuman Baru"
                    val title = lastChild.child("title").value?.toString() ?: "Pengumuman Siswa"

                    if (lastAnnouncementId != null && lastAnnouncementId != id) {
                        notificationHelper.showNotification(title, content)
                    }
                    lastAnnouncementId = id
                }

                override fun onCancelled(error: DatabaseError) {}
            }
            ref.addValueEventListener(sListener)
            studentAnnouncementListeners.add(ref to sListener)
            studentAnnouncementListener = sListener
            activeStudentAnnouncementRef = ref
        }
    }

    private fun normalizeSchoolScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    private fun normalizeClassName(value: String): String {
        var normalized = value.uppercase().replace("KELAS", "").trim()
        normalized = normalized.replace("VIII", "8")
        normalized = normalized.replace("VII", "7")
        normalized = normalized.replace("IX", "9")
        normalized = normalized.replace("III", "3")
        normalized = normalized.replace("II", "2")
        normalized = normalized.replace("IV", "4")
        normalized = normalized.replace("VI", "6")
        normalized = normalized.replace("V", "5")
        return normalized.replace("\\s".toRegex(), "").trim()
    }

    private fun normalizeName(value: String?): String {
        return value
            ?.trim()
            ?.lowercase()
            ?.replace("[^a-z0-9]".toRegex(), "")
            .orEmpty()
    }

    companion object {
        private const val INCOMPLETE_COOLDOWN_MS = 30 * 60 * 1000L // 30 minutes digest cooldown
    }
}
