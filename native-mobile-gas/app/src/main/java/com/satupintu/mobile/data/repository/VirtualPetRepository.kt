package com.satupintu.mobile.data.repository

import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.MutableData
import com.google.firebase.database.Query
import com.google.firebase.database.Transaction
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.DisciplineRule
import com.satupintu.mobile.data.model.PetAchievement
import com.satupintu.mobile.data.model.PetQuest
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.util.DayScheduleRule
import com.satupintu.mobile.util.HolidayRule
import com.satupintu.mobile.util.isValidPrayerDay
import com.satupintu.mobile.util.parseHolidaySnapshot
import com.satupintu.mobile.util.parseScheduleSnapshot
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.tasks.await
import java.util.Calendar
import java.util.UUID
import kotlin.coroutines.resume

class VirtualPetRepository {
    data class PrayerRealtimeInfo(
        val status: String? = null,
        val isEffectiveDay: Boolean = true
    )

    private val db = FirebaseDatabase.getInstance().reference
    private fun normalizeScope(value: String?): String = value?.trim()?.lowercase().orEmpty()
    private fun normalizeIdentity(value: String?): String = value?.trim().orEmpty()
    private fun rankPetCandidate(pet: VirtualPet): Long {
        return maxOf(
            pet.updatedAt,
            pet.lastQuestReset,
            pet.lastPlayed,
            pet.lastFed
        )
    }

    private fun stablePetStudentKey(pet: VirtualPet): String {
        return pet.studentId.trim()
    }

    private fun normalizeIdentitySet(values: Set<String>): Set<String> {
        return values.map(::normalizeIdentity).filter { it.isNotBlank() }.toSet()
    }

    private fun snapshotMatchesStudent(snapshot: DataSnapshot, identityAliases: Set<String>): Boolean {
        if (identityAliases.isEmpty()) return false
        val loweredAliases = identityAliases.map { it.lowercase() }.toSet()
        val candidates = listOf(
            snapshot.child("studentId").getValue(String::class.java),
            snapshot.child("nisn").getValue(String::class.java),
            snapshot.child("studentNisn").getValue(String::class.java),
            snapshot.key
        ).map(::normalizeIdentity)
        return candidates.any { candidate ->
            candidate in identityAliases || candidate.lowercase() in loweredAliases
        }
    }

    private fun parseDisciplineRuleCategories(snapshot: DataSnapshot): Map<Int, String> {
        return snapshot.children.mapNotNull { child ->
            try {
                val rule = child.getValue(DisciplineRule::class.java) ?: return@mapNotNull null
                val resolvedId = if (rule.id != 0) rule.id else child.key?.toIntOrNull() ?: return@mapNotNull null
                resolvedId to rule.category.trim().uppercase()
            } catch (_: Exception) {
                null
            }
        }.toMap()
    }

    private fun isBetterPetCandidate(candidate: VirtualPet, current: VirtualPet): Boolean {
        val candidateScore = rankPetCandidate(candidate)
        val currentScore = rankPetCandidate(current)
        return when {
            candidateScore != currentScore -> candidateScore > currentScore
            candidate.updatedAt != current.updatedAt -> candidate.updatedAt > current.updatedAt
            candidate.level != current.level -> candidate.level > current.level
            candidate.experiencePoints != current.experiencePoints -> candidate.experiencePoints > current.experiencePoints
            else -> candidate.id > current.id
        }
    }

    private fun selectBestPetsByStudent(pets: List<VirtualPet>): List<VirtualPet> {
        val bestByStudent = linkedMapOf<String, VirtualPet>()
        for (pet in pets) {
            val studentKey = stablePetStudentKey(pet)
            if (studentKey.isBlank()) continue

            val current = bestByStudent[studentKey]
            if (current == null || isBetterPetCandidate(pet, current)) {
                bestByStudent[studentKey] = pet
            }
        }
        return bestByStudent.values.toList()
    }

    private fun parsePet(snapshot: DataSnapshot): VirtualPet? {
        return try {
            snapshot.getValue(VirtualPet::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun getVirtualPetByStudentIds(studentIds: Set<String>, schoolId: String = ""): Flow<VirtualPet?> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        val identityAliases = normalizeIdentitySet(studentIds)
        
        if (identityAliases.isEmpty()) {
            trySend(null)
            awaitClose { }
            return@callbackFlow
        }

        val petsByAlias = mutableMapOf<String, VirtualPet?>()
        val queries = mutableListOf<Pair<Query, ValueEventListener>>()
        var initializedCount = 0
        
        fun emitBestPet() {
            val allFound = petsByAlias.values.filterNotNull()
            val exactMatches = mutableListOf<VirtualPet>()
            val legacyMatches = mutableListOf<VirtualPet>()
            
            for (pet in allFound) {
                val petSchoolId = normalizeScope(pet.schoolId)
                when {
                    normalizedSchoolId.isBlank() || petSchoolId == normalizedSchoolId -> exactMatches.add(pet)
                    petSchoolId.isBlank() -> legacyMatches.add(pet)
                }
            }
            val chosenPet = (exactMatches.maxByOrNull(::rankPetCandidate)
                ?: legacyMatches.maxByOrNull(::rankPetCandidate))
                
            trySend(chosenPet)
        }

        identityAliases.forEach { alias ->
            val query = db.child("virtual_pets").orderByChild("studentId").equalTo(alias)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    var bestPetForAlias: VirtualPet? = null
                    for (child in snapshot.children) {
                        val parsedPet = parsePet(child) ?: continue
                        if (bestPetForAlias == null || isBetterPetCandidate(parsedPet, bestPetForAlias)) {
                            bestPetForAlias = parsedPet
                        }
                    }
                    petsByAlias[alias] = bestPetForAlias
                    
                    if (initializedCount < identityAliases.size) {
                        initializedCount++
                    }
                    
                    if (initializedCount == identityAliases.size) {
                        emitBestPet()
                    }
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
            query.addValueEventListener(listener)
            queries += query to listener
        }

        awaitClose { 
            queries.forEach { (query, listener) -> query.removeEventListener(listener) } 
        }
    }

    fun getVirtualPetByStudentId(studentId: String, schoolId: String = ""): Flow<VirtualPet?> =
        getVirtualPetByStudentIds(setOf(studentId.trim()), schoolId)

    fun getAllPets(schoolId: String = ""): Flow<List<VirtualPet>> = callbackFlow {
        val normalizedSchoolId = normalizeScope(schoolId)
        val ref = db.child("virtual_pets")
        val query: Query = if (normalizedSchoolId.isBlank()) {
            ref
        } else {
            ref.orderByChild("schoolId").equalTo(normalizedSchoolId)
        }
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val pets = mutableListOf<VirtualPet>()
                for (child in snapshot.children) {
                    val pet = parsePet(child)
                    if (pet != null && (normalizedSchoolId.isBlank() || normalizeScope(pet.schoolId) == normalizedSchoolId)) {
                        pets.add(pet)
                    }
                }
                trySend(selectBestPetsByStudent(pets))
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    suspend fun insertVirtualPet(pet: VirtualPet): String {
        val normalizedSchoolId = normalizeScope(pet.schoolId)
        val petId = if (pet.id.isEmpty()) UUID.randomUUID().toString() else pet.id
        val newPet = pet.copy(id = petId, schoolId = normalizedSchoolId)
        db.child("virtual_pets").child(petId).setValue(newPet).await()
        return petId
    }

    suspend fun updateVirtualPet(pet: VirtualPet) {
        db.child("virtual_pets")
            .child(pet.id)
            .setValue(pet.copy(schoolId = normalizeScope(pet.schoolId)))
            .await()
    }

    fun getPetQuests(petId: String): Flow<List<PetQuest>> = callbackFlow {
        val normalizedPetId = petId.trim()
        val ref = db.child("pet_quests")
        val query = ref.orderByChild("petId").equalTo(normalizedPetId)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val quests = mutableListOf<PetQuest>()
                for (child in snapshot.children) {
                    val quest = child.getValue(PetQuest::class.java)
                    if (quest != null && quest.petId.trim() == normalizedPetId) {
                        quests.add(quest)
                    }
                }
                trySend(quests)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun insertPetQuest(quest: PetQuest) {
        val questId = if (quest.id.isEmpty()) UUID.randomUUID().toString() else quest.id
        val newQuest = quest.copy(id = questId)
        db.child("pet_quests").child(questId).setValue(newQuest)
    }

    fun updatePetQuest(quest: PetQuest) {
        db.child("pet_quests").child(quest.id).setValue(quest)
    }

    suspend fun completeQuestAndRewardIfNeeded(
        petId: String,
        quest: PetQuest
    ): Boolean = suspendCancellableCoroutine { continuation ->
        val normalizedPetId = petId.trim()
        if (normalizedPetId.isEmpty() || quest.id.isBlank()) {
            continuation.resume(false)
            return@suspendCancellableCoroutine
        }

        val questRef = db.child("pet_quests").child(quest.id)
        val now = System.currentTimeMillis()

        questRef.runTransaction(object : Transaction.Handler {
            override fun doTransaction(currentData: MutableData): Transaction.Result {
                val currentQuest = currentData.getValue(PetQuest::class.java) ?: return Transaction.abort()
                val synchronizedProgress = maxOf(currentQuest.progress, quest.progress).coerceAtMost(currentQuest.target)

                if (currentQuest.completed || currentQuest.rewardGrantedAt > 0L) {
                    return Transaction.abort()
                }

                if (synchronizedProgress < currentQuest.target) {
                    return Transaction.abort()
                }

                currentData.value = currentQuest.copy(
                    progress = synchronizedProgress,
                    completed = true,
                    completedAt = if (currentQuest.completedAt > 0L) currentQuest.completedAt else now,
                    rewardGrantedAt = if (currentQuest.rewardGrantedAt > 0L) currentQuest.rewardGrantedAt else now
                )
                return Transaction.success(currentData)
            }

            override fun onComplete(
                error: DatabaseError?,
                committed: Boolean,
                currentData: DataSnapshot?
            ) {
                if (error != null || !committed) {
                    if (continuation.isActive) continuation.resume(false)
                    return
                }

                rewardPetForQuestCompletion(
                    normalizedPetId = normalizedPetId,
                    reward = quest.reward
                ) { rewarded ->
                    if (continuation.isActive) continuation.resume(rewarded)
                }
            }
        })
    }
    
    fun deletePetQuest(questId: String) {
        db.child("pet_quests").child(questId).removeValue()
    }

    private fun rewardPetForQuestCompletion(
        normalizedPetId: String,
        reward: Int,
        onComplete: (Boolean) -> Unit
    ) {
        val petRef = db.child("virtual_pets").child(normalizedPetId)
        petRef.runTransaction(object : Transaction.Handler {
            override fun doTransaction(currentData: MutableData): Transaction.Result {
                val currentPet = currentData.getValue(VirtualPet::class.java) ?: return Transaction.abort()
                currentData.value = applyQuestReward(currentPet, reward)
                return Transaction.success(currentData)
            }

            override fun onComplete(
                error: DatabaseError?,
                committed: Boolean,
                currentData: DataSnapshot?
            ) {
                onComplete(error == null && committed)
            }
        })
    }

    private fun applyQuestReward(pet: VirtualPet, reward: Int): VirtualPet {
        var updatedPet = pet.copy(
            coins = pet.coins + reward,
            experiencePoints = pet.experiencePoints + (reward / 2),
            updatedAt = System.currentTimeMillis()
        )

        while (updatedPet.experiencePoints >= updatedPet.level * 100) {
            val xpThreshold = updatedPet.level * 100
            updatedPet = updatedPet.copy(
                level = updatedPet.level + 1,
                experiencePoints = updatedPet.experiencePoints - xpThreshold,
                intelligence = (updatedPet.intelligence + 2).coerceAtMost(100),
                updatedAt = System.currentTimeMillis()
            )
        }

        return updatedPet
    }

    // Realtime Monitoring Methods
    fun getRealtimeReadingDuration(studentId: String): Flow<Long> = getRealtimeReadingDuration(setOf(studentId))

    fun getRealtimeReadingDuration(studentIds: Set<String>): Flow<Long> = callbackFlow {
        val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val aliases = normalizeIdentitySet(studentIds)
        if (aliases.isEmpty()) {
            trySend(0L)
            awaitClose { }
            return@callbackFlow
        }

        val totalsByAlias = mutableMapOf<String, Long>()
        val refs = mutableListOf<Pair<com.google.firebase.database.DatabaseReference, ValueEventListener>>()

        fun emitReadingTotal() {
            trySend(totalsByAlias.values.maxOrNull() ?: 0L)
        }

        aliases.forEach { alias ->
            val ref = db.child("student_activities").child(alias).child("reading_log").child(todayStr)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    var total = 0L
                    for (child in snapshot.children) {
                        val duration = child.child("duration").getValue(Long::class.java) ?: 0L
                        total += duration
                    }
                    totalsByAlias[alias] = total
                    emitReadingTotal()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
            ref.addValueEventListener(listener)
            refs += ref to listener
        }

        awaitClose { refs.forEach { (ref, listener) -> ref.removeEventListener(listener) } }
    }

    fun getRealtimeHabits(studentId: String): Flow<Int> = getRealtimeHabits(setOf(studentId))

    fun getRealtimeHabits(studentIds: Set<String>, schoolId: String = ""): Flow<Int> = callbackFlow {
        val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val aliases = normalizeIdentitySet(studentIds)
        val normalizedSchoolId = normalizeScope(schoolId)
        if (aliases.isEmpty()) {
            trySend(0)
            awaitClose { }
            return@callbackFlow
        }

        val countsByAlias = mutableMapOf<String, Int>()
        val refs = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()

        fun emitHabitCount() {
            trySend(countsByAlias.values.maxOrNull() ?: 0)
        }

        aliases.forEach { alias ->
            val legacyRef = db.child("seven_habits_logs").child(alias).child(todayStr).child("habits")
            val scopedRef = if (normalizedSchoolId.isBlank()) {
                null
            } else {
                db.child("seven_habits_logs_by_school").child(normalizedSchoolId).child(alias).child(todayStr).child("habits")
            }

            var scopedHasData = false

            val scopedListener = scopedRef?.let {
                object : ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        var count = 0
                        for (child in snapshot.children) {
                            if (child.getValue(Boolean::class.java) == true) count++
                        }
                        scopedHasData = snapshot.exists()
                        if (scopedHasData) {
                            countsByAlias[alias] = count
                            emitHabitCount()
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
                    var count = 0
                    for (child in snapshot.children) {
                        if (child.getValue(Boolean::class.java) == true) count++
                    }
                    countsByAlias[alias] = count
                    emitHabitCount()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }

            scopedRef?.addValueEventListener(scopedListener!!)
            legacyRef.addValueEventListener(legacyListener)

            scopedRef?.let { refs += it to scopedListener!! }
            refs += legacyRef to legacyListener
        }

        awaitClose { refs.forEach { (ref, listener) -> ref.removeEventListener(listener) } }
    }

    fun getRealtimeAttendance(studentId: String): Flow<Map<String, Any?>> = getRealtimeAttendance(setOf(studentId))

    fun getRealtimeAttendance(studentIds: Set<String>, schoolId: String = ""): Flow<Map<String, Any?>> = callbackFlow {
        val aliases = normalizeIdentitySet(studentIds)
        val normalizedSchoolId = normalizeScope(schoolId)
        val calendar = java.util.Calendar.getInstance()
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
        calendar.set(java.util.Calendar.MINUTE, 0)
        calendar.set(java.util.Calendar.SECOND, 0)
        calendar.set(java.util.Calendar.MILLISECOND, 0)
        val startOfDay = calendar.timeInMillis

        calendar.set(java.util.Calendar.HOUR_OF_DAY, 23)
        calendar.set(java.util.Calendar.MINUTE, 59)
        calendar.set(java.util.Calendar.SECOND, 59)
        val endOfDay = calendar.timeInMillis

        val ref = db.child("attendance")
        val query = ref.orderByChild("date").startAt(startOfDay.toDouble()).endAt(endOfDay.toDouble())

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var latestRecord: DataSnapshot? = null
                var latestScore = Long.MIN_VALUE

                for (child in snapshot.children) {
                    val recordSchoolId = normalizeScope(child.child("schoolId").getValue(String::class.java))
                    if (normalizedSchoolId.isNotBlank() && recordSchoolId.isNotBlank() && recordSchoolId != normalizedSchoolId) {
                        continue
                    }
                    if (!snapshotMatchesStudent(child, aliases)) continue

                    val updatedAt = child.child("updatedAt").getValue(Long::class.java) ?: 0L
                    val date = child.child("date").getValue(Long::class.java) ?: 0L
                    val createdAt = child.child("createdAt").getValue(Long::class.java) ?: 0L
                    val score = maxOf(updatedAt, date, createdAt)
                    if (latestRecord == null || score >= latestScore) {
                        latestRecord = child
                        latestScore = score
                    }
                }

                val status = latestRecord?.child("status")?.getValue(String::class.java)
                val checkOutTime = latestRecord?.child("checkOutTime")?.value?.toString().orEmpty()

                // Return both status and checkOutTime
                val result = mapOf(
                    "status" to status,
                    "checkOutTime" to checkOutTime
                )
                trySend(result)
            }
            override fun onCancelled(error: DatabaseError) { close(error.toException()) }
        }
        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun getRealtimePrayerInfo(studentId: String, schoolId: String = ""): Flow<PrayerRealtimeInfo> =
        getRealtimePrayerInfo(setOf(studentId), schoolId)

    fun getRealtimePrayerInfo(studentIds: Set<String>, schoolId: String = ""): Flow<PrayerRealtimeInfo> = callbackFlow {
        val identityAliases = normalizeIdentitySet(studentIds)
        val normalizedSchoolId = normalizeScope(schoolId)
        val today = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startOfDay = today.timeInMillis
        val endOfDay = Calendar.getInstance().apply {
            timeInMillis = startOfDay
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis

        var latestStatus: String? = null
        var legacySchedules: Map<Int, DayScheduleRule> = emptyMap()
        var scopedSchedules: Map<Int, DayScheduleRule>? = null
        var legacyHolidays: List<HolidayRule> = emptyList()
        var scopedHolidays: List<HolidayRule>? = null

        fun emitRealtimePrayer() {
            val schedules = scopedSchedules ?: legacySchedules
            val holidays = scopedHolidays ?: legacyHolidays
            val isEffectiveDay = isValidPrayerDay(Calendar.getInstance(), schedules, holidays)
            trySend(PrayerRealtimeInfo(status = latestStatus, isEffectiveDay = isEffectiveDay))
        }

        val prayerQuery = db.child("prayer_attendance")
            .orderByChild("date")
            .startAt(startOfDay.toDouble())
            .endAt(endOfDay.toDouble())
        val prayerListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                var latestRecord: DataSnapshot? = null
                var latestScore = Long.MIN_VALUE
                for (child in snapshot.children) {
                    val logSchoolId = normalizeScope(child.child("schoolId").getValue(String::class.java))
                    if (!snapshotMatchesStudent(child, identityAliases)) continue
                    if (normalizedSchoolId.isNotBlank() && logSchoolId.isNotBlank() && logSchoolId != normalizedSchoolId) continue

                    val updatedAt = child.child("updatedAt").getValue(Long::class.java) ?: 0L
                    val date = child.child("date").getValue(Long::class.java) ?: 0L
                    val createdAt = child.child("createdAt").getValue(Long::class.java) ?: 0L
                    val score = maxOf(updatedAt, date, createdAt)
                    if (latestRecord == null || score >= latestScore) {
                        latestRecord = child
                        latestScore = score
                    }
                }

                latestStatus = latestRecord?.child("status")?.getValue(String::class.java)
                emitRealtimePrayer()
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        val legacyScheduleRef = db.child("prayer_schedules")
        val legacyScheduleListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                legacySchedules = parseScheduleSnapshot(snapshot)
                emitRealtimePrayer()
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        val legacyHolidayRef = db.child("holidays")
        val legacyHolidayListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                legacyHolidays = parseHolidaySnapshot(snapshot)
                emitRealtimePrayer()
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }

        prayerQuery.addValueEventListener(prayerListener)
        legacyScheduleRef.addValueEventListener(legacyScheduleListener)
        legacyHolidayRef.addValueEventListener(legacyHolidayListener)

        var scopedScheduleRef: com.google.firebase.database.DatabaseReference? = null
        var scopedScheduleListener: ValueEventListener? = null
        var scopedHolidayRef: com.google.firebase.database.DatabaseReference? = null
        var scopedHolidayListener: ValueEventListener? = null

        if (normalizedSchoolId.isNotBlank()) {
            scopedScheduleRef = db.child("school_settings").child(normalizedSchoolId).child("prayer").child("schedules")
            scopedScheduleListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    scopedSchedules = if (snapshot.exists()) parseScheduleSnapshot(snapshot) else null
                    emitRealtimePrayer()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }

            scopedHolidayRef = db.child("school_settings").child(normalizedSchoolId).child("attendance").child("holidays")
            scopedHolidayListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    scopedHolidays = if (snapshot.exists()) parseHolidaySnapshot(snapshot) else null
                    emitRealtimePrayer()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }

            scopedScheduleRef.addValueEventListener(scopedScheduleListener)
            scopedHolidayRef.addValueEventListener(scopedHolidayListener)
        } else {
            emitRealtimePrayer()
        }

        awaitClose {
            prayerQuery.removeEventListener(prayerListener)
            legacyScheduleRef.removeEventListener(legacyScheduleListener)
            legacyHolidayRef.removeEventListener(legacyHolidayListener)
            scopedScheduleRef?.let { ref -> scopedScheduleListener?.let(ref::removeEventListener) }
            scopedHolidayRef?.let { ref -> scopedHolidayListener?.let(ref::removeEventListener) }
        }
    }

    fun getRealtimeDisciplinePenalty(studentIds: Set<String>, schoolId: String = ""): Flow<Int> = callbackFlow {
        val aliases = normalizeIdentitySet(studentIds)
        val normalizedSchoolId = normalizeScope(schoolId)
        if (aliases.isEmpty()) {
            trySend(0)
            awaitClose { }
            return@callbackFlow
        }

        val startOfDay = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        val endOfDay = Calendar.getInstance().apply {
            timeInMillis = startOfDay
            add(Calendar.DAY_OF_YEAR, 1)
        }.timeInMillis

        var globalRuleCategories: Map<Int, String> = emptyMap()
        var scopedRuleCategories: Map<Int, String>? = null
        val snapshotsByAlias = mutableMapOf<String, DataSnapshot?>()

        fun calculatePenalty(snapshot: DataSnapshot?, alias: String): Int {
            if (snapshot == null) return 0
            val activeRuleCategories = scopedRuleCategories?.takeIf { it.isNotEmpty() } ?: globalRuleCategories
            var totalPenalty = 0

            for (child in snapshot.children) {
                val recordSchoolId = normalizeScope(child.child("schoolId").getValue(String::class.java))
                if (normalizedSchoolId.isNotBlank() && recordSchoolId.isNotBlank() && recordSchoolId != normalizedSchoolId) {
                    continue
                }
                if (!snapshotMatchesStudent(child, setOf(alias))) continue

                val status = child.child("status").getValue(String::class.java)?.trim()?.uppercase().orEmpty()
                if (status.isNotBlank() && status != "APPROVED") continue

                val date = child.child("date").getValue(Long::class.java)
                    ?: child.child("updatedAt").getValue(Long::class.java)
                    ?: child.child("createdAt").getValue(Long::class.java)
                    ?: 0L
                if (date !in startOfDay until endOfDay) continue

                val points = child.child("points").getValue(Int::class.java) ?: 0
                val ruleId = child.child("ruleId").getValue(Int::class.java) ?: 0
                val category = activeRuleCategories[ruleId]
                    ?: if (points > 0) "VIOLATION" else ""
                if (category == "VIOLATION") {
                    totalPenalty += points
                }
            }

            return totalPenalty
        }

        fun emitPenalty() {
            val penalty = aliases.maxOfOrNull { alias ->
                calculatePenalty(snapshotsByAlias[alias], alias)
            } ?: 0
            trySend(penalty.coerceAtLeast(0))
        }

        val recordsListeners = mutableListOf<Pair<Query, ValueEventListener>>()
        aliases.forEach { alias ->
            val query = db.child("discipline_records").orderByChild("studentId").equalTo(alias)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    snapshotsByAlias[alias] = snapshot
                    emitPenalty()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
            query.addValueEventListener(listener)
            recordsListeners += query to listener
        }

        val globalRulesRef = db.child("discipline_rules")
        val globalRulesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                globalRuleCategories = parseDisciplineRuleCategories(snapshot)
                emitPenalty()
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        globalRulesRef.addValueEventListener(globalRulesListener)

        var scopedRulesRef: com.google.firebase.database.DatabaseReference? = null
        var scopedRulesListener: ValueEventListener? = null
        if (normalizedSchoolId.isNotBlank()) {
            scopedRulesRef = db.child("discipline_rules_by_school").child(normalizedSchoolId)
            scopedRulesListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    scopedRuleCategories = if (snapshot.exists()) {
                        parseDisciplineRuleCategories(snapshot)
                    } else {
                        null
                    }
                    emitPenalty()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }
            scopedRulesRef.addValueEventListener(scopedRulesListener)
        } else {
            emitPenalty()
        }

        awaitClose {
            recordsListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
            globalRulesRef.removeEventListener(globalRulesListener)
            scopedRulesRef?.let { ref -> scopedRulesListener?.let(ref::removeEventListener) }
        }
    }

    fun getRealtimeLiteracyCount(studentId: String, studentName: String, schoolId: String = ""): Flow<Int> =
        getRealtimeLiteracyCount(setOf(studentId), studentName, schoolId)

    fun getRealtimeLiteracyCount(studentIds: Set<String>, studentName: String, schoolId: String = ""): Flow<Int> = callbackFlow {
        val identityAliases = normalizeIdentitySet(studentIds)
        val normalizedSchoolId = normalizeScope(schoolId)
        val ref = db.child("literacy_logs")

        if (identityAliases.isEmpty()) {
            trySend(0)
            awaitClose { }
            return@callbackFlow
        }

        val countsByAlias = mutableMapOf<String, Int>()
        val queries = mutableListOf<Pair<com.google.firebase.database.Query, ValueEventListener>>()

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startOfDay = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, 1)
        val endOfDay = calendar.timeInMillis

        fun emitLiteracyCount() {
            trySend(countsByAlias.values.maxOrNull() ?: 0)
        }

        identityAliases.forEach { alias ->
            val query = ref.orderByChild("studentId").equalTo(alias)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    var count = 0
                    for (child in snapshot.children) {
                        val timestamp = child.child("timestamp").getValue(Long::class.java) ?: 0L
                        val logStudentName = child.child("studentName").getValue(String::class.java).orEmpty().trim()
                        val logSchoolId = normalizeScope(child.child("schoolId").getValue(String::class.java))
                        val matchesStudent = when {
                            snapshotMatchesStudent(child, setOf(alias)) -> true
                            studentName.isNotBlank() -> logStudentName.equals(studentName, ignoreCase = true)
                            else -> false
                        }

                        if ((normalizedSchoolId.isBlank() || logSchoolId == normalizedSchoolId) &&
                            matchesStudent &&
                            timestamp in startOfDay until endOfDay
                        ) {
                            count++
                        }
                    }
                    countsByAlias[alias] = count
                    emitLiteracyCount()
                }

                override fun onCancelled(error: DatabaseError) {
                    close(error.toException())
                }
            }

            query.addValueEventListener(listener)
            queries += query to listener
        }

        awaitClose {
            queries.forEach { (query, listener) -> query.removeEventListener(listener) }
        }
    }

    fun deletePetQuests(petId: String) {
        val normalizedPetId = petId.trim()
        val ref = db.child("pet_quests")
        val query = ref.orderByChild("petId").equalTo(normalizedPetId)
        query.addListenerForSingleValueEvent(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                for (child in snapshot.children) {
                    val questPetId = child.child("petId").getValue(String::class.java).orEmpty().trim()
                    if (questPetId == normalizedPetId) {
                        child.ref.removeValue()
                    }
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        })
    }

    fun getPetAchievements(petId: String): Flow<List<PetAchievement>> = callbackFlow {
        val normalizedPetId = petId.trim()
        val ref = db.child("pet_achievements")
        val query = ref.orderByChild("petId").equalTo(normalizedPetId)
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val achievements = mutableListOf<PetAchievement>()
                for (child in snapshot.children) {
                    val achievement = child.getValue(PetAchievement::class.java)
                    if (achievement != null && achievement.petId.trim() == normalizedPetId) {
                        achievements.add(achievement)
                    }
                }
                trySend(achievements)
            }

            override fun onCancelled(error: DatabaseError) {
                close(error.toException())
            }
        }
        query.addValueEventListener(listener)
        awaitClose { query.removeEventListener(listener) }
    }

    fun insertPetAchievement(achievement: PetAchievement) {
        val id = if (achievement.id.isEmpty()) java.util.UUID.randomUUID().toString() else achievement.id
        val newAchievement = achievement.copy(id = id)
        db.child("pet_achievements").child(id).setValue(newAchievement)
    }

    fun deletePetAchievement(achievementId: String) {
        val normalizedAchievementId = achievementId.trim()
        if (normalizedAchievementId.isEmpty()) return
        db.child("pet_achievements").child(normalizedAchievementId).removeValue()
    }

    suspend fun unlockAchievementIfNeeded(achievementId: String): Boolean =
        suspendCancellableCoroutine { continuation ->
            val normalizedAchievementId = achievementId.trim()
            if (normalizedAchievementId.isEmpty()) {
                continuation.resume(false)
                return@suspendCancellableCoroutine
            }

            db.child("pet_achievements").child(normalizedAchievementId)
                .runTransaction(object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val currentAchievement = currentData.getValue(PetAchievement::class.java)
                            ?: return Transaction.abort()
                        if (currentAchievement.unlocked) {
                            return Transaction.abort()
                        }

                        currentData.value = currentAchievement.copy(
                            unlocked = true,
                            unlockedAt = System.currentTimeMillis()
                        )
                        return Transaction.success(currentData)
                    }

                    override fun onComplete(
                        error: DatabaseError?,
                        committed: Boolean,
                        currentData: DataSnapshot?
                    ) {
                        if (continuation.isActive) {
                            continuation.resume(error == null && committed)
                        }
                    }
                })
        }
}
