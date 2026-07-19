package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.satupintu.mobile.data.model.PetAchievement
import com.satupintu.mobile.data.model.PetQuest
import com.satupintu.mobile.data.model.VirtualPet
import com.satupintu.mobile.data.model.isManualReviveGraceActive
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.VirtualPetRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import java.util.Calendar

data class VirtualPetUiState(
    val pet: VirtualPet? = null,
    val quests: List<PetQuest> = emptyList(),
    val achievements: List<PetAchievement> = emptyList(),
    val criteriaCards: List<StudentCriteriaCard> = emptyList(),
    val actionCards: List<StudentActionCard> = emptyList(),
    val leaderboard: List<VirtualPet> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

data class StudentCriteriaCard(
    val key: String,
    val title: String,
    val subtitle: String,
    val progress: Int,
    val status: String,
    val isAchieved: Boolean
)

data class StudentActionCard(
    val key: String,
    val title: String,
    val subtitle: String,
    val progress: Int,
    val status: String
)

class VirtualPetViewModel : ViewModel() {
    private val repository = VirtualPetRepository()
    private val studentRepository = StudentRepository()
    private val _uiState = MutableStateFlow(VirtualPetUiState(isLoading = true))
    val uiState: StateFlow<VirtualPetUiState> = _uiState.asStateFlow()

    private data class DailyQuestTemplate(
        val title: String,
        val description: String,
        val target: Int,
        val reward: Int
    )

    private data class AchievementTemplate(
        val title: String,
        val description: String,
        val icon: String
    )

    companion object {
        private val DAILY_QUEST_TEMPLATES = listOf(
            DailyQuestTemplate(
                title = "Tugas Literasi Hari Ini",
                description = "Kirim minimal 1 tugas/laporan literasi hari ini",
                target = 1,
                reward = 30
            ),
            DailyQuestTemplate(
                title = "Absensi Sekolah Hari Ini",
                description = "Masuk sekolah dan tercatat hadir atau terlambat",
                target = 1,
                reward = 30
            ),
            DailyQuestTemplate(
                title = "Presensi Sholat Hari Ini",
                description = "Lengkapi presensi sholat hari ini jika hari efektif",
                target = 1,
                reward = 30
            ),
            DailyQuestTemplate(
                title = "Praktik 3 Kebiasaan",
                description = "Lakukan 3 dari 7 kebiasaan",
                target = 3,
                reward = 50
            ),
            DailyQuestTemplate(
                title = "Membaca Buku",
                description = "Baca buku di e-perpus min. 1 jam",
                target = 1,
                reward = 40
            )
        )

        private val ACHIEVEMENT_TEMPLATES = listOf(
            AchievementTemplate(
                title = "Pemula",
                description = "Pet berhasil diaktifkan dan siap bertumbuh",
                icon = "star"
            ),
            AchievementTemplate(
                title = "Pembelajar Aktif",
                description = "Menyelesaikan target literasi harian",
                icon = "menu_book"
            ),
            AchievementTemplate(
                title = "Disiplin Sekolah",
                description = "Hadir sekolah tertib tanpa catatan pelanggaran hari ini",
                icon = "fact_check"
            ),
            AchievementTemplate(
                title = "Bintang 7KAIH",
                description = "Menuntaskan minimal 3 kebiasaan baik hari ini",
                icon = "bolt"
            ),
            AchievementTemplate(
                title = "Ibadah Tertib",
                description = "Presensi sholat hari ini tercatat sesuai aturan",
                icon = "favorite"
            )
        )
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }

    private var petJob: Job? = null
    private var leaderboardJob: Job? = null
    private var questResetJob: Job? = null
    private var lastQuestResetGuardKey: String? = null
    private val pendingAutoRewardQuestIds = mutableSetOf<String>()
    private val pendingQuestTemplateKeys = mutableSetOf<String>()
    private val pendingQuestDeleteIds = mutableSetOf<String>()
    private val pendingAchievementUnlockIds = mutableSetOf<String>()
    private val pendingAchievementTemplateKeys = mutableSetOf<String>()
    private val pendingAchievementDeleteIds = mutableSetOf<String>()

    fun loadLeaderboard(schoolId: String) {
        leaderboardJob?.cancel()
        val normalizedSchoolId = schoolId.trim().lowercase()
        leaderboardJob = viewModelScope.launch {
            combine(
                repository.getAllPets(normalizedSchoolId),
                studentRepository.getStudents(normalizedSchoolId)
            ) { pets, students ->
                val scopedStudents = if (normalizedSchoolId.isBlank()) {
                    students
                } else {
                    students.filter { it.schoolId.trim().lowercase() == normalizedSchoolId }
                }

                val studentMap = buildMap {
                    scopedStudents.forEach { student ->
                        val stableId = student.id.trim()
                        val nisn = student.nisn.trim()
                        if (stableId.isNotEmpty()) put(stableId, student)
                        if (nisn.isNotEmpty()) put(nisn, student)
                    }
                }

                pets.mapNotNull { pet ->
                    val student = studentMap[pet.studentId.trim()] ?: return@mapNotNull null
                    pet.copy(
                        petName = student.name.ifBlank { pet.petName }
                    )
                }.sortedWith(
                    compareByDescending<VirtualPet> { it.level }
                        .thenByDescending { it.experiencePoints }
                        .thenByDescending { it.coins }
                        .thenByDescending { it.updatedAt }
                )
            }.collect { sortedPets ->
                _uiState.update { it.copy(leaderboard = sortedPets) }
            }
        }
    }

    fun loadPet(credential: String, sessionSchoolId: String = "") {
        petJob?.cancel()
        petJob = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                // Resolve Student Key from Credential (NISN/Username)
                val resolution = resolveStudentIdentity(credential, sessionSchoolId)
                if (resolution == null) {
                    _uiState.update { it.copy(error = "Siswa tidak ditemukan", isLoading = false) }
                    return@launch
                }

                val effectiveSchoolId = sessionSchoolId.trim().ifBlank { resolution.schoolId }
                loadLeaderboard(effectiveSchoolId)
                val identityAliases = buildStudentIdentityAliases(resolution, credential)

                repository.getVirtualPetByStudentIds(identityAliases, effectiveSchoolId).flatMapLatest { pet ->
                    if (pet == null) {
                        flow {
                            createPet(resolution.studentKey, resolution.studentName, effectiveSchoolId)
                            emitAll(
                                repository.getVirtualPetByStudentIds(identityAliases, effectiveSchoolId)
                                    .filterNotNull()
                                    .take(1)
                                    .flatMapLatest { createdPet ->
                                        observePetSnapshot(
                                            pet = createdPet,
                                            identityAliases = identityAliases,
                                            effectiveSchoolId = effectiveSchoolId,
                                            resolution = resolution
                                        )
                                    }
                            )
                        }
                    } else {
                        observePetSnapshot(
                            pet = pet,
                            identityAliases = identityAliases,
                            effectiveSchoolId = effectiveSchoolId,
                            resolution = resolution
                        )
                    }
                }.collect { (currentPet, quests, achievements, criteriaCards, actionCards) ->
                    _uiState.update { 
                        it.copy(
                            pet = currentPet,
                            quests = quests,
                            achievements = achievements,
                            criteriaCards = criteriaCards,
                            actionCards = actionCards,
                            isLoading = false
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to load pet", isLoading = false) }
            }
        }
    }

    data class RealtimeStats(
        val readingDuration: Long,
        val habitsCount: Int,
        val attendanceData: Map<String, Any?>,
        val literacyCount: Int,
        val prayerInfo: VirtualPetRepository.PrayerRealtimeInfo,
        val disciplinePenalty: Int
    )

    private data class Quintuple<A, B, C, D, E>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D
        ,
        val fifth: E
    )

    private data class StudentIdentity(
        val studentKey: String,
        val studentName: String,
        val schoolId: String,
        val religion: String,
        val identityAliases: Set<String>
    )

    private fun isPrayerExempt(religionRaw: String): Boolean {
        val normalized = religionRaw.trim().lowercase()
        if (normalized.isEmpty()) return false
        if (normalized == "non_islam" || normalized == "non-islam" || normalized == "non muslim" || normalized == "nonmuslim") return true
        return normalized.contains("kristen") ||
            normalized.contains("katolik") ||
            normalized.contains("hindu") ||
            normalized.contains("buddha") ||
            normalized.contains("konghucu")
    }

    private fun buildStudentIdentityAliases(resolution: StudentIdentity, credential: String): Set<String> {
        return linkedSetOf(
            credential.trim(),
            *resolution.identityAliases.toTypedArray()
        ).map { it.trim() }.filter { it.isNotBlank() }.toSet()
    }

    private fun observePetSnapshot(
        pet: VirtualPet,
        identityAliases: Set<String>,
        effectiveSchoolId: String,
        resolution: StudentIdentity
    ): Flow<Quintuple<VirtualPet, List<PetQuest>, List<PetAchievement>, List<StudentCriteriaCard>, List<StudentActionCard>>> {
        val normalizedSchoolId = effectiveSchoolId.trim().lowercase()

        return flow {
            val syncedPet = if (
                pet.petName != resolution.studentName ||
                pet.schoolId.trim().lowercase() != normalizedSchoolId
            ) {
                val updatedPet = pet.copy(
                    petName = resolution.studentName,
                    schoolId = normalizedSchoolId
                )
                repository.updateVirtualPet(updatedPet)
                updatedPet
            } else {
                pet
            }

            emitAll(combine(
                repository.getPetQuests(syncedPet.id),
                repository.getPetAchievements(syncedPet.id),
                combine(
                    repository.getRealtimeReadingDuration(identityAliases),
                    repository.getRealtimeHabits(identityAliases, normalizedSchoolId),
                    repository.getRealtimeAttendance(identityAliases, normalizedSchoolId),
                    repository.getRealtimeLiteracyCount(identityAliases, resolution.studentName, normalizedSchoolId),
                    repository.getRealtimePrayerInfo(identityAliases, normalizedSchoolId),
                ) { r, h, a, l, p -> RealtimeStats(r, h, a, l, p, 0) }.combine(
                    repository.getRealtimeDisciplinePenalty(identityAliases, normalizedSchoolId)
                ) { baseStats, disciplinePenalty ->
                    baseStats.copy(disciplinePenalty = disciplinePenalty)
                }
            ) { quests, achievements, stats ->
            checkDailyReset(syncedPet, quests)
            syncQuestCatalog(syncedPet, quests)
            syncAchievementCatalog(syncedPet, achievements)

            val targetMillis = 60 * 60 * 1000f
            val saturationPct = (stats.readingDuration / targetMillis * 100).coerceAtMost(100f).toInt()
            val calculatedHunger = 100 - saturationPct
            val calculatedEnergy = ((stats.habitsCount / 7f) * 100).coerceAtMost(100f).toInt()

            val statusStr = stats.attendanceData["status"] as? String
            val checkOutTime = stats.attendanceData["checkOutTime"] as? String ?: ""
            var happinessScore = 100

            if (statusStr != null) {
                val isLate = statusStr.equals("TERLAMBAT", ignoreCase = true) || statusStr.equals("LATE", ignoreCase = true)
                val isAbsent = statusStr.equals("ABSENT", ignoreCase = true) || statusStr.equals("ALPA", ignoreCase = true)
                val isPermit =
                    statusStr.equals("IZIN", ignoreCase = true) ||
                        statusStr.equals("SAKIT", ignoreCase = true) ||
                        statusStr.equals("PERMIT", ignoreCase = true) ||
                        statusStr.equals("SICK", ignoreCase = true)

                if (isAbsent) {
                    happinessScore = 0
                } else if (isPermit) {
                    happinessScore = 50
                } else {
                    if (isLate) {
                        happinessScore -= 10
                    }

                    val calendar = Calendar.getInstance()
                    val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
                    val isFriday = calendar.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY
                    val dismissalHour = if (isFriday) 11 else 14

                    if (checkOutTime.isNotEmpty()) {
                        val checkOutHour = try {
                            if (checkOutTime.contains(":")) {
                                checkOutTime.split(":")[0].toInt()
                            } else {
                                val millis = checkOutTime.toLong()
                                val c = Calendar.getInstance()
                                c.timeInMillis = millis
                                c.get(Calendar.HOUR_OF_DAY)
                            }
                        } catch (e: Exception) {
                            dismissalHour
                        }

                        if (checkOutHour < dismissalHour) {
                            happinessScore -= 25
                        }
                    } else if (currentHour >= dismissalHour) {
                        happinessScore -= 25
                        _uiState.update { it.copy(message = "Jangan lupa Check-Out sebelum pulang! Kebahagiaan berkurang.") }
                    }
                }
            }

            val attendanceBaseline = happinessScore.coerceIn(0, 100)
            val calculatedHappiness = (attendanceBaseline - stats.disciplinePenalty).coerceIn(0, 100)
            val prayerStatus = stats.prayerInfo.status?.trim()?.uppercase()
            val calculatedHealth = when {
                isPrayerExempt(resolution.religion) -> 100
                !stats.prayerInfo.isEffectiveDay -> 100
                prayerStatus == "PRAY" -> 100
                prayerStatus == "PERMIT" || prayerStatus == "HALANGAN" -> 100
                prayerStatus == "NOT_PRAY" -> 20
                else -> 20
            }

            val newHealth = calculatedHealth
            val newHappiness = calculatedHappiness
            val newEnergy = calculatedEnergy
            val newHunger = calculatedHunger
            val criteriaCards = buildCriteriaCards(
                stats = stats,
                religion = resolution.religion,
                happinessScore = newHappiness,
                healthScore = newHealth
            )
            val actionCards = buildActionCards(
                stats = stats,
                religion = resolution.religion,
                happinessScore = newHappiness
            )
            synchronizeAchievements(achievements, criteriaCards)

            val fullness = (100 - newHunger).coerceIn(0, 100)
            val lowestVital = minOf(newHealth, newHappiness, newEnergy, fullness)
            val averageStats = (newHealth + newHappiness + newEnergy + fullness) / 4
            val reviveGraceActive = syncedPet.isManualReviveGraceActive()
            var newStatus = when {
                !reviveGraceActive && lowestVital <= 0 -> "DEAD"
                lowestVital < 30 || newHealth < 30 || newHappiness < 30 -> "SICK"
                lowestVital < 60 || newHappiness < 50 -> "SAD"
                else -> "HAPPY"
            }

            if (!reviveGraceActive && syncedPet.status == "DEAD") {
                newStatus = "DEAD"
            }

            var newLevel = syncedPet.level
            var newXp = syncedPet.experiencePoints

            if (!reviveGraceActive && averageStats < 40 && syncedPet.level > 1 && newStatus != "DEAD") {
                newLevel = 1
                newXp = 0
                _uiState.update { it.copy(message = "Level Reset ke 1 karena nilai keaktifan rendah!") }
            }

            val updatedQuests = quests.map { quest ->
                var newProgress = quest.progress
                when (quest.title) {
                    "Tugas Literasi Hari Ini" -> {
                        newProgress = stats.literacyCount.coerceAtMost(quest.target)
                    }
                    "Absensi Sekolah Hari Ini" -> {
                        val status = stats.attendanceData["status"] as? String
                        val normalizedStatus = status?.trim()?.uppercase()
                        if (normalizedStatus in setOf("PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME", "LATE", "TERLAMBAT")) {
                            newProgress = 1
                        }
                    }
                    "Presensi Sholat Hari Ini" -> {
                        val normalizedPrayerStatus = stats.prayerInfo.status?.trim()?.uppercase()
                        val prayerCompleted = when {
                            isPrayerExempt(resolution.religion) -> true
                            !stats.prayerInfo.isEffectiveDay -> true
                            normalizedPrayerStatus in setOf("PRAY", "PERMIT", "HALANGAN") -> true
                            else -> false
                        }
                        newProgress = if (prayerCompleted) 1 else 0
                    }
                    "Praktik 3 Kebiasaan" -> {
                        newProgress = stats.habitsCount.coerceAtMost(quest.target)
                    }
                    "Membaca Buku" -> {
                        if (stats.readingDuration >= 60 * 60 * 1000) {
                            newProgress = 1
                        }
                    }
                }
                quest.copy(progress = newProgress)
            }
            synchronizeQuestProgress(syncedPet.id, quests, updatedQuests)

            val normalizedManualReviveUntil = if (reviveGraceActive) syncedPet.manualReviveUntil else 0L
            var finalPet = syncedPet.copy(
                hunger = newHunger,
                energy = newEnergy,
                happiness = newHappiness,
                health = newHealth,
                status = newStatus,
                level = newLevel,
                experiencePoints = newXp,
                manualReviveUntil = normalizedManualReviveUntil
            )

            if (kotlin.math.abs(syncedPet.hunger - newHunger) > 1 ||
                kotlin.math.abs(syncedPet.energy - newEnergy) > 1 ||
                kotlin.math.abs(syncedPet.happiness - newHappiness) > 1 ||
                kotlin.math.abs(syncedPet.health - newHealth) > 1 ||
                syncedPet.status != newStatus ||
                syncedPet.level != newLevel ||
                syncedPet.manualReviveUntil != normalizedManualReviveUntil
            ) {
                finalPet = finalPet.copy(updatedAt = System.currentTimeMillis())
                repository.updateVirtualPet(finalPet)
            } else {
                finalPet = syncedPet
            }

            val curatedQuestList = curatedQuests(updatedQuests)
            val curatedAchievements = curatedAchievements(achievements)
            Quintuple(finalPet, curatedQuestList, curatedAchievements, criteriaCards, actionCards)
            })
        }
    }

    private suspend fun resolveStudentIdentity(credential: String, sessionSchoolId: String = ""): StudentIdentity? {
        val candidate = credential.trim()
        if (candidate.isBlank()) return null

        val db = com.google.firebase.database.FirebaseDatabase.getInstance()

        fun extractIdentity(snapshot: DataSnapshot): StudentIdentity? {
            if (!snapshot.exists()) return null

            val studentKey = snapshot.key?.trim().orEmpty()
            if (studentKey.isBlank()) return null

            val nisn = snapshot.child("nisn").getValue(String::class.java).orEmpty().trim()
            val username = snapshot.child("username").getValue(String::class.java).orEmpty().trim()
            val name = (
                snapshot.child("name").getValue(String::class.java)
                    ?: snapshot.child("nama").getValue(String::class.java)
                    ?: snapshot.child("nama_lengkap").getValue(String::class.java)
                    ?: "Siswa"
                ).trim()
            val schoolId = snapshot.child("schoolId").getValue(String::class.java).orEmpty().trim().lowercase()
            val religion = (
                snapshot.child("religion").getValue(String::class.java)
                    ?: snapshot.child("agama").getValue(String::class.java)
                    ?: ""
                ).trim()

            val aliases = linkedSetOf(
                studentKey,
                nisn,
                username,
                candidate
            ).map { it.trim() }.filter { it.isNotBlank() }.toSet()

            return StudentIdentity(studentKey, name, schoolId, religion, aliases)
        }

        suspend fun lookupByKey(path: String, key: String): StudentIdentity? {
            return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
                db.getReference(path).child(key).addListenerForSingleValueEvent(object : com.google.firebase.database.ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resumeWith(Result.success(extractIdentity(snapshot)))
                    }
                    override fun onCancelled(error: com.google.firebase.database.DatabaseError) {
                        cont.resumeWith(Result.success(null))
                    }
                })
            }
        }

        suspend fun lookupByField(path: String, field: String, value: String): StudentIdentity? {
            return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
                db.getReference(path).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : com.google.firebase.database.ValueEventListener {
                    override fun onDataChange(snapshot: DataSnapshot) {
                        cont.resumeWith(Result.success(extractIdentity(snapshot.children.firstOrNull() ?: snapshot)))
                    }
                    override fun onCancelled(error: com.google.firebase.database.DatabaseError) {
                        cont.resumeWith(Result.success(null))
                    }
                })
            }
        }

        if (sessionSchoolId.isNotBlank()) {
            lookupByKey("gas/schools/$sessionSchoolId/students", candidate)?.let { return it }
        }
        lookupByKey("master_students", candidate)?.let { return it }
        lookupByKey("students", candidate)?.let { return it }

        if (sessionSchoolId.isNotBlank()) {
            lookupByField("gas/schools/$sessionSchoolId/students", "username", candidate)?.let { return it }
        }
        lookupByField("master_students", "username", candidate)?.let { return it }
        lookupByField("students", "username", candidate)?.let { return it }

        if (candidate.all(Char::isDigit)) {
            if (sessionSchoolId.isNotBlank()) {
                lookupByField("gas/schools/$sessionSchoolId/students", "nisn", candidate)?.let { return it }
            }
            lookupByField("master_students", "nisn", candidate)?.let { return it }
            lookupByField("students", "nisn", candidate)?.let { return it }
        }

        return null
    }

    private suspend fun createPet(studentId: String, studentName: String, schoolId: String) {
        val ownerUid = FirebaseAuth.getInstance().currentUser?.uid.orEmpty().trim()
        if (ownerUid.isBlank()) {
            throw IllegalStateException("Sesi Firebase tidak aktif untuk membuat virtual pet")
        }

        val newPet = VirtualPet(
            studentId = studentId,
            schoolId = schoolId,
            ownerUid = ownerUid,
            petName = studentName,
            petType = "CAT",
            status = "HAPPY",
            lastFed = System.currentTimeMillis(),
            lastPlayed = System.currentTimeMillis(),
            accessories = null,
            intelligence = 50,
            energy = 80,
            social = 60,
            coins = 100,
            lastQuestReset = System.currentTimeMillis()
        )
        val petId = repository.insertVirtualPet(newPet)

        // Initial Quests
        createDailyQuests(petId)

        // Initial Achievements
        val achievements = ACHIEVEMENT_TEMPLATES.map { template ->
            PetAchievement(
                petId = petId,
                title = template.title,
                description = template.description,
                icon = template.icon,
                unlocked = template.title == "Pemula",
                unlockedAt = if (template.title == "Pemula") System.currentTimeMillis() else 0L
            )
        }
        achievements.forEach { repository.insertPetAchievement(it) }
    }
    
    private suspend fun createDailyQuests(petId: String) {
        syncMissingQuestTemplates(
            petId = petId,
            missingTemplates = DAILY_QUEST_TEMPLATES
        )
    }

    private fun checkDailyReset(pet: VirtualPet, quests: List<PetQuest>) {
        val lastReset = pet.lastQuestReset
        val calendar = Calendar.getInstance()
        val currentDay = calendar.get(Calendar.DAY_OF_YEAR)
        
        calendar.timeInMillis = lastReset
        val lastResetDay = calendar.get(Calendar.DAY_OF_YEAR)
        
        if (currentDay == lastResetDay) return

        val guardKey = "${calendar.get(Calendar.YEAR)}-$currentDay-${pet.id}"
        if (lastQuestResetGuardKey == guardKey) return

        if (questResetJob?.isActive == true) return
        lastQuestResetGuardKey = guardKey

        questResetJob = viewModelScope.launch {
            repository.deletePetQuests(pet.id)
            createDailyQuests(pet.id)
            repository.updateVirtualPet(pet.copy(lastQuestReset = System.currentTimeMillis()))
        }
    }

    private fun syncQuestCatalog(pet: VirtualPet, quests: List<PetQuest>) {
        cleanupDuplicateQuests(quests)

        val requiredByTitle = DAILY_QUEST_TEMPLATES.associateBy { it.title }
        val legacyTitles = setOf("Belajar Fokus", "Hadir Hari Ini")
        val questIdsToRemove = quests
            .filter { quest -> quest.title in legacyTitles || requiredByTitle[quest.title] == null }
            .map { it.id }

        val missingTemplates = DAILY_QUEST_TEMPLATES.filter { template ->
            quests.none { it.title == template.title }
        }

        if (questIdsToRemove.isEmpty() && missingTemplates.isEmpty()) {
            return
        }

        viewModelScope.launch {
            questIdsToRemove.forEach(repository::deletePetQuest)
            syncMissingQuestTemplates(
                petId = pet.id,
                missingTemplates = missingTemplates
            )
        }
    }

    private fun syncAchievementCatalog(pet: VirtualPet, achievements: List<PetAchievement>) {
        cleanupDuplicateAchievements(achievements)

        val existingTitles = achievements.map { it.title }.toSet()
        val missingTemplates = ACHIEVEMENT_TEMPLATES.filter { template ->
            val templateKey = "${pet.id}:${template.title.trim()}"
            template.title !in existingTitles && pendingAchievementTemplateKeys.add(templateKey)
        }
        if (missingTemplates.isEmpty()) return

        viewModelScope.launch {
            try {
                missingTemplates.forEach { template ->
                    repository.insertPetAchievement(
                        PetAchievement(
                            petId = pet.id,
                            title = template.title,
                            description = template.description,
                            icon = template.icon,
                            unlocked = template.title == "Pemula",
                            unlockedAt = if (template.title == "Pemula") System.currentTimeMillis() else 0L
                        )
                    )
                }
            } finally {
                missingTemplates.forEach { template ->
                    pendingAchievementTemplateKeys.remove("${pet.id}:${template.title.trim()}")
                }
            }
        }
    }

    private fun buildCriteriaCards(
        stats: RealtimeStats,
        religion: String,
        happinessScore: Int,
        healthScore: Int
    ): List<StudentCriteriaCard> {
        val readingMinutes = (stats.readingDuration / 60000L).toInt()
        val literacyProgress = ((stats.readingDuration / (60f * 60f * 1000f)) * 100f).toInt().coerceIn(0, 100)
        val literacyAchieved = stats.readingDuration >= 60 * 60 * 1000 || stats.literacyCount > 0

        val attendanceStatus = (stats.attendanceData["status"] as? String).orEmpty().trim().uppercase()
        val disciplineFree = stats.disciplinePenalty <= 0
        val attendanceAchieved = attendanceStatus in setOf("PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME", "LATE", "TERLAMBAT") && disciplineFree && happinessScore >= 75

        val habitsTarget = 3
        val habitsProgress = ((stats.habitsCount / habitsTarget.toFloat()) * 100f).toInt().coerceIn(0, 100)
        val habitsAchieved = stats.habitsCount >= habitsTarget

        val prayerStatus = stats.prayerInfo.status?.trim()?.uppercase().orEmpty()
        val prayerExempt = isPrayerExempt(religion)
        val prayerAchieved = prayerExempt || !stats.prayerInfo.isEffectiveDay || prayerStatus in setOf("PRAY", "PERMIT", "HALANGAN")

        return listOf(
            StudentCriteriaCard(
                key = "literacy",
                title = "Literasi Aktif",
                subtitle = "Baca 60 menit atau kirim 1 aktivitas literasi",
                progress = literacyProgress,
                status = if (literacyAchieved) {
                    "Tercapai: $readingMinutes menit, ${stats.literacyCount} aktivitas"
                } else {
                    "$readingMinutes/60 menit, ${stats.literacyCount} aktivitas"
                },
                isAchieved = literacyAchieved
            ),
            StudentCriteriaCard(
                key = "attendance",
                title = "Disiplin Sekolah",
                subtitle = "Hadir tertib tanpa pelanggaran hari ini",
                progress = happinessScore.coerceIn(0, 100),
                status = when {
                    attendanceAchieved -> "Hadir tertib, skor disiplin $happinessScore%"
                    attendanceStatus.isBlank() -> "Belum ada data absensi hari ini"
                    stats.disciplinePenalty > 0 -> "Ada penalti pelanggaran ${stats.disciplinePenalty}%"
                    else -> "Status absensi: ${attendanceStatus.lowercase().replaceFirstChar { it.uppercase() }}"
                },
                isAchieved = attendanceAchieved
            ),
            StudentCriteriaCard(
                key = "habits",
                title = "Bintang 7KAIH",
                subtitle = "Tuntaskan minimal 3 kebiasaan baik",
                progress = habitsProgress,
                status = if (habitsAchieved) {
                    "${stats.habitsCount} kebiasaan selesai hari ini"
                } else {
                    "${stats.habitsCount}/3 kebiasaan menuju target"
                },
                isAchieved = habitsAchieved
            ),
            StudentCriteriaCard(
                key = "prayer",
                title = "Ibadah Tertib",
                subtitle = "Presensi sholat sesuai aturan hari ini",
                progress = healthScore.coerceIn(0, 100),
                status = when {
                    prayerExempt -> "Tidak wajib untuk agama ini"
                    !stats.prayerInfo.isEffectiveDay -> "Hari ini bukan hari efektif sholat"
                    prayerAchieved -> "Presensi sholat tercatat: ${prayerStatus.ifBlank { "SELESAI" }}"
                    prayerStatus.isBlank() -> "Belum ada presensi sholat hari ini"
                    else -> "Status presensi: ${prayerStatus.lowercase().replaceFirstChar { it.uppercase() }}"
                },
                isAchieved = prayerAchieved
            )
        )
    }

    private fun buildActionCards(
        stats: RealtimeStats,
        religion: String,
        happinessScore: Int
    ): List<StudentActionCard> {
        val readingMinutes = (stats.readingDuration / 60000L).toInt().coerceAtLeast(0)
        val readingProgress = ((stats.readingDuration / (60f * 60f * 1000f)) * 100f).toInt().coerceIn(0, 100)
        val literacyProgress = if (stats.literacyCount > 0) 100 else 0

        val attendanceStatus = (stats.attendanceData["status"] as? String).orEmpty().trim().uppercase()
        val attendanceLabel = when (attendanceStatus) {
            "PRESENT", "HADIR", "TEPAT WAKTU", "ON TIME" -> "Hadir"
            "LATE", "TERLAMBAT" -> "Terlambat"
            "IZIN", "SAKIT", "PERMIT", "SICK" -> "Izin/Sakit"
            "ABSENT", "ALPA" -> "Alpa"
            else -> if (attendanceStatus.isBlank()) "Belum ada" else attendanceStatus
        }

        val prayerStatus = stats.prayerInfo.status?.trim()?.uppercase().orEmpty()
        val prayerExempt = isPrayerExempt(religion)
        val prayerLabel = when {
            prayerExempt -> "Tidak wajib"
            !stats.prayerInfo.isEffectiveDay -> "Tidak efektif"
            prayerStatus in setOf("PRAY") -> "Sholat"
            prayerStatus in setOf("PERMIT", "HALANGAN") -> "Izin"
            prayerStatus.isBlank() -> "Belum ada"
            else -> prayerStatus
        }

        val habitsProgress = ((stats.habitsCount / 7f) * 100f).toInt().coerceIn(0, 100)

        val disciplinePenalty = stats.disciplinePenalty.coerceAtLeast(0)
        val disciplineHint = if (disciplinePenalty > 0) "Penalti $disciplinePenalty%" else "Tanpa penalti"

        return listOf(
            StudentActionCard(
                key = "literacy_task",
                title = "Literasi",
                subtitle = "Tugas / laporan literasi",
                progress = literacyProgress,
                status = if (stats.literacyCount > 0) "Selesai: ${stats.literacyCount} aktivitas" else "Belum ada aktivitas hari ini"
            ),
            StudentActionCard(
                key = "attendance",
                title = "Kehadiran",
                subtitle = "Absensi & presensi sholat",
                progress = happinessScore.coerceIn(0, 100),
                status = "Absensi: $attendanceLabel • Sholat: $prayerLabel • $disciplineHint"
            ),
            StudentActionCard(
                key = "habits",
                title = "7KAIH",
                subtitle = "Kebiasaan baik harian",
                progress = habitsProgress,
                status = "${stats.habitsCount}/7 kebiasaan terisi"
            ),
            StudentActionCard(
                key = "library",
                title = "E-Perpus",
                subtitle = "Baca buku untuk kenyang",
                progress = readingProgress,
                status = "$readingMinutes/60 menit membaca hari ini"
            )
        )
    }

    private fun curatedAchievements(achievements: List<PetAchievement>): List<PetAchievement> {
        val order = ACHIEVEMENT_TEMPLATES.mapIndexed { index, template -> template.title to index }.toMap()
        return achievements
            .filter { it.title in order.keys }
            .groupBy { it.title }
            .values
            .map(::selectCanonicalAchievement)
            .sortedWith(
                compareBy<PetAchievement> { order[it.title] ?: Int.MAX_VALUE }
                    .thenByDescending { it.unlockedAt }
            )
    }

    private fun curatedQuests(quests: List<PetQuest>): List<PetQuest> {
        val order = DAILY_QUEST_TEMPLATES.mapIndexed { index, template -> template.title to index }.toMap()
        return quests
            .filter { it.title in order.keys }
            .groupBy { it.title.trim() }
            .values
            .map(::selectCanonicalQuest)
            .sortedWith(compareBy { order[it.title] ?: Int.MAX_VALUE })
    }

    private fun cleanupDuplicateQuests(quests: List<PetQuest>) {
        quests
            .filter { it.title.isNotBlank() }
            .groupBy { it.title.trim() }
            .values
            .forEach { duplicates ->
                if (duplicates.size <= 1) return@forEach

                val canonical = selectCanonicalQuest(duplicates)
                duplicates
                    .filter { it.id.isNotBlank() && it.id != canonical.id }
                    .forEach { duplicate ->
                        if (!pendingQuestDeleteIds.add(duplicate.id)) return@forEach

                        viewModelScope.launch {
                            try {
                                repository.deletePetQuest(duplicate.id)
                            } finally {
                                pendingQuestDeleteIds.remove(duplicate.id)
                            }
                        }
                    }
            }
    }

    private fun selectCanonicalQuest(quests: List<PetQuest>): PetQuest {
        return quests.maxWithOrNull(
            compareBy<PetQuest> { if (it.completed) 1 else 0 }
                .thenBy { it.rewardGrantedAt }
                .thenBy { it.completedAt }
                .thenBy { it.progress }
                .thenBy { it.id }
        ) ?: quests.first()
    }

    private suspend fun syncMissingQuestTemplates(
        petId: String,
        missingTemplates: List<DailyQuestTemplate>
    ) {
        val acceptedTemplates = missingTemplates.filter { template ->
            val templateKey = "${petId.trim()}:${template.title.trim()}"
            pendingQuestTemplateKeys.add(templateKey)
        }

        if (acceptedTemplates.isEmpty()) return

        try {
            acceptedTemplates.forEach { template ->
                repository.insertPetQuest(
                    PetQuest(
                        petId = petId,
                        title = template.title,
                        description = template.description,
                        target = template.target,
                        reward = template.reward
                    )
                )
            }
        } finally {
            acceptedTemplates.forEach { template ->
                pendingQuestTemplateKeys.remove("${petId.trim()}:${template.title.trim()}")
            }
        }
    }

    private fun cleanupDuplicateAchievements(achievements: List<PetAchievement>) {
        achievements
            .filter { it.title.isNotBlank() }
            .groupBy { it.title.trim() }
            .values
            .forEach { duplicates ->
                if (duplicates.size <= 1) return@forEach

                val canonical = selectCanonicalAchievement(duplicates)
                duplicates
                    .filter { it.id.isNotBlank() && it.id != canonical.id }
                    .forEach { duplicate ->
                        if (!pendingAchievementDeleteIds.add(duplicate.id)) return@forEach

                        viewModelScope.launch {
                            try {
                                repository.deletePetAchievement(duplicate.id)
                            } finally {
                                pendingAchievementDeleteIds.remove(duplicate.id)
                            }
                        }
                    }
            }
    }

    private fun selectCanonicalAchievement(achievements: List<PetAchievement>): PetAchievement {
        return achievements.maxWithOrNull(
            compareBy<PetAchievement> { if (it.unlocked) 1 else 0 }
                .thenBy { it.unlockedAt }
                .thenBy { it.id }
        ) ?: achievements.first()
    }

    private fun synchronizeAchievements(
        achievements: List<PetAchievement>,
        criteriaCards: List<StudentCriteriaCard>
    ) {
        val unlockedKeys = criteriaCards.filter { it.isAchieved }.map { it.key }.toSet()
        achievements.forEach { achievement ->
            val shouldUnlock = when (achievement.title) {
                "Pemula" -> true
                "Pembelajar Aktif" -> "literacy" in unlockedKeys
                "Disiplin Sekolah" -> "attendance" in unlockedKeys
                "Bintang 7KAIH" -> "habits" in unlockedKeys
                "Ibadah Tertib" -> "prayer" in unlockedKeys
                else -> false
            }

            if (shouldUnlock && !achievement.unlocked) {
                triggerAchievementUnlock(achievement)
            }
        }
    }

    private fun triggerAchievementUnlock(achievement: PetAchievement) {
        if (achievement.id.isBlank()) return
        if (!pendingAchievementUnlockIds.add(achievement.id)) return

        viewModelScope.launch {
            try {
                val unlocked = repository.unlockAchievementIfNeeded(achievement.id)
                if (unlocked) {
                    _uiState.update { it.copy(message = "Pencapaian baru terbuka: ${achievement.title}") }
                }
            } finally {
                pendingAchievementUnlockIds.remove(achievement.id)
            }
        }
    }

    fun feedPet(pet: VirtualPet) {
        viewModelScope.launch {
            _uiState.update { it.copy(message = "Buka E-Perpus untuk membuat pet kenyang.") }
        }
    }

    fun playWithPet(pet: VirtualPet) {
        viewModelScope.launch {
            _uiState.update { it.copy(message = "Buka 7KAIH untuk menambah energi pet.") }
        }
    }

    fun strokePet(pet: VirtualPet) {
        viewModelScope.launch {
            _uiState.update { it.copy(message = "Pilih Absensi atau Presensi Sholat untuk mempengaruhi pet.") }
        }
    }

    // Legacy support
    fun studyWithPet(pet: VirtualPet) {
         // No-op or redirect to stroke logic if called
         strokePet(pet)
    }

    fun sleepPet(pet: VirtualPet) {
        viewModelScope.launch {
            _uiState.update { it.copy(message = "Buka Tugas Literasi untuk progres belajar pet.") }
        }
    }

    private fun synchronizeQuestProgress(
        petId: String,
        currentQuests: List<PetQuest>,
        updatedQuests: List<PetQuest>
    ) {
        currentQuests.zip(updatedQuests).forEach { (currentQuest, updatedQuest) ->
            val normalizedProgress = updatedQuest.progress.coerceIn(0, updatedQuest.target)
            val questForSync = updatedQuest.copy(progress = normalizedProgress)
            val progressChanged = currentQuest.progress != normalizedProgress
            val readyForAutoReward =
                !currentQuest.completed &&
                    currentQuest.rewardGrantedAt <= 0L &&
                    normalizedProgress >= currentQuest.target

            when {
                readyForAutoReward -> triggerAutoQuestReward(petId, questForSync)
                progressChanged -> repository.updatePetQuest(
                    currentQuest.copy(progress = normalizedProgress)
                )
            }
        }
    }

    private fun triggerAutoQuestReward(petId: String, quest: PetQuest) {
        if (quest.id.isBlank()) return
        if (!pendingAutoRewardQuestIds.add(quest.id)) return

        viewModelScope.launch {
            try {
                val rewarded = repository.completeQuestAndRewardIfNeeded(petId, quest)
                if (rewarded) {
                    _uiState.update {
                        it.copy(
                            message = "${quest.title} selesai otomatis. +${quest.reward} koin dan +${quest.reward / 2} XP."
                        )
                    }
                }
            } finally {
                pendingAutoRewardQuestIds.remove(quest.id)
            }
        }
    }
}
