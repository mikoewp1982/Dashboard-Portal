package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.Query
import com.google.firebase.database.ValueEventListener
import com.satupintu.mobile.data.model.DisciplineRecord
import com.satupintu.mobile.data.model.DisciplineRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class DisciplineUiState {
    object Loading : DisciplineUiState()
    data class Success(
        val violationPoints: Int,
        val achievementPoints: Int,
        val records: List<DisciplineRecordWithRule>
    ) : DisciplineUiState()
    data class Error(val message: String) : DisciplineUiState()
}

data class DisciplineRecordWithRule(
    val record: DisciplineRecord,
    val rule: DisciplineRule?
)

class DisciplineViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<DisciplineUiState>(DisciplineUiState.Loading)
    val uiState: StateFlow<DisciplineUiState> = _uiState.asStateFlow()

    private val db = FirebaseDatabase.getInstance()
    private var globalRulesListener: ValueEventListener? = null
    private var scopedRulesListener: ValueEventListener? = null
    private val recordListeners = mutableListOf<Pair<Query, ValueEventListener>>()

    private var currentSchoolId: String = ""
    private var currentIdentityAliases: Set<String> = emptySet()
    private var globalRules: Map<Int, DisciplineRule> = emptyMap()
    private var scopedRules: Map<Int, DisciplineRule> = emptyMap()
    private var selectedRules: Map<Int, DisciplineRule> = emptyMap()
    private val recordsByAlias = mutableMapOf<String, List<DisciplineRecord>>()

    fun loadData(userCredential: String, studentId: String, schoolId: String) {
        viewModelScope.launch {
            _uiState.value = DisciplineUiState.Loading
            detachAllListeners()

            resolveStudentSnapshot(
                userCredential = userCredential,
                studentId = studentId,
                schoolId = schoolId,
                onResolved = { studentSnapshot ->
                    if (studentSnapshot != null) {
                        val identityAliases = linkedSetOf(
                            normalizeIdentity(studentSnapshot.key),
                            normalizeIdentity(studentSnapshot.child("id").getValue(String::class.java)),
                            normalizeIdentity(studentSnapshot.child("nisn").getValue(String::class.java)),
                            normalizeIdentity(studentSnapshot.child("username").getValue(String::class.java)),
                            normalizeIdentity(studentId),
                            normalizeIdentity(userCredential)
                        ).filter { it.isNotBlank() }.toSet()

                        val resolvedSchoolId = normalizeScope(
                            schoolId.ifBlank {
                                studentSnapshot.child("schoolId").getValue(String::class.java).orEmpty()
                            }
                        )

                        currentSchoolId = resolvedSchoolId
                        currentIdentityAliases = identityAliases

                        attachRuleListeners(resolvedSchoolId)
                        attachRecordListeners(identityAliases, resolvedSchoolId)
                    } else {
                        _uiState.value = DisciplineUiState.Error("Data siswa tidak ditemukan.")
                    }
                },
                onError = { message ->
                    _uiState.value = DisciplineUiState.Error(message)
                }
            )
        }
    }

    private fun resolveStudentSnapshot(
        userCredential: String,
        studentId: String,
        schoolId: String,
        onResolved: (DataSnapshot?) -> Unit,
        onError: (String) -> Unit
    ) {
        val normalizedStudentId = studentId.trim()
        val normalizedCredential = userCredential.trim()
        val isNumeric = normalizedCredential.isNotEmpty() && normalizedCredential.all { it.isDigit() }
        val nisn = if (isNumeric) normalizedCredential else ""
        val username = if (!isNumeric) normalizedCredential else ""

        fun lookupByKey(refPath: String, key: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
            if (key.isBlank()) {
                onMiss()
                return
            }
            db.getReference(refPath).child(key).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) onHit(snapshot) else onMiss()
                }

                override fun onCancelled(error: DatabaseError) {
                    onError(error.message)
                }
            })
        }

        fun lookupByFieldQuery(refPath: String, field: String, value: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
            db.getReference(refPath).orderByChild(field).equalTo(value).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (snapshot.exists()) onHit(snapshot.children.first()) else onMiss()
                }

                override fun onCancelled(error: DatabaseError) {
                    onError(error.message)
                }
            })
        }

        fun lookupByField(refPath: String, field: String, value: String, onHit: (DataSnapshot) -> Unit, onMiss: () -> Unit) {
            if (value.isBlank()) {
                onMiss()
                return
            }
            if (refPath == "students" && field == "nisn") {
                lookupByKey(refPath, value, onHit) {
                    lookupByFieldQuery(refPath, field, value, onHit, onMiss)
                }
                return
            }
            lookupByFieldQuery(refPath, field, value, onHit, onMiss)
        }

        lookupByKey("gas/schools/$schoolId/students", normalizedStudentId, onResolved) {
            lookupByKey("master_students", normalizedStudentId, onResolved) {
                lookupByKey("students", normalizedStudentId, onResolved) {
                    lookupByField("gas/schools/$schoolId/students", "nisn", nisn, onResolved) {
                        lookupByField("master_students", "nisn", nisn, onResolved) {
                            lookupByField("students", "nisn", nisn, onResolved) {
                                lookupByField("gas/schools/$schoolId/students", "username", username, onResolved) {
                                    lookupByField("master_students", "username", username, onResolved) {
                                        lookupByField("students", "username", username, onResolved) {
                                            onResolved(null)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun attachRuleListeners(schoolId: String) {
        globalRulesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                globalRules = parseRules(snapshot)
                refreshSelectedRules()
            }

            override fun onCancelled(error: DatabaseError) {
                _uiState.value = DisciplineUiState.Error("Gagal memuat aturan: ${error.message}")
            }
        }
        db.getReference("discipline_rules").addValueEventListener(globalRulesListener as ValueEventListener)

        val normalizedSchoolId = normalizeScope(schoolId)
        if (normalizedSchoolId.isBlank()) {
            scopedRules = emptyMap()
            refreshSelectedRules()
            return
        }

        scopedRulesListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                scopedRules = parseRules(snapshot)
                refreshSelectedRules()
            }

            override fun onCancelled(error: DatabaseError) {
                _uiState.value = DisciplineUiState.Error("Gagal memuat aturan sekolah: ${error.message}")
            }
        }
        db.getReference("discipline_rules_by_school").child(normalizedSchoolId)
            .addValueEventListener(scopedRulesListener as ValueEventListener)
    }

    private fun refreshSelectedRules() {
        selectedRules = if (scopedRules.isNotEmpty()) scopedRules else globalRules
        recomputeUi()
    }

    private fun attachRecordListeners(studentIdentityCandidates: Set<String>, schoolId: String) {
        val recordsRef = db.getReference("discipline_records")
        val normalizedSchoolId = normalizeScope(schoolId)
        val aliases = studentIdentityCandidates.map { it.trim() }.filter { it.isNotBlank() }.distinct()
        if (aliases.isEmpty()) {
            recordsByAlias.clear()
            recomputeUi()
            return
        }

        aliases.forEach { alias ->
            val query = recordsRef.orderByChild("studentId").equalTo(alias)
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val records = snapshot.children.mapNotNull { child ->
                        val parsed = child.getValue(DisciplineRecord::class.java) ?: return@mapNotNull null
                        val resolved = parsed.copy(id = child.key ?: parsed.id)
                        if (normalizedSchoolId.isNotBlank()) {
                            val recordSchool = normalizeScope(resolved.schoolId)
                            if (recordSchool.isNotBlank() && recordSchool != normalizedSchoolId) return@mapNotNull null
                        }
                        resolved
                    }
                    recordsByAlias[alias] = records
                    recomputeUi()
                }

                override fun onCancelled(error: DatabaseError) {
                    _uiState.value = DisciplineUiState.Error("Gagal memuat catatan: ${error.message}")
                }
            }

            query.addValueEventListener(listener)
            recordListeners += query to listener
        }
    }

    private fun parseRules(snapshot: DataSnapshot): Map<Int, DisciplineRule> {
        val rulesMap = mutableMapOf<Int, DisciplineRule>()
        for (child in snapshot.children) {
            val rule = child.getValue(DisciplineRule::class.java)
            if (rule != null) {
                val resolvedId = if (rule.id != 0) rule.id else child.key?.toIntOrNull() ?: 0
                if (resolvedId != 0) {
                    rulesMap[resolvedId] = rule.copy(id = resolvedId)
                }
            }
        }
        return rulesMap
    }

    private fun recomputeUi() {
        val merged = linkedMapOf<String, DisciplineRecord>()
        recordsByAlias.values.flatten().forEach { record ->
            val status = record.status.trim().uppercase()
            if (status.isNotBlank() && status != "APPROVED") return@forEach

            val resolvedId = record.id.trim().ifBlank {
                listOf(record.studentId.trim(), record.date.toString(), record.ruleId.toString(), record.points.toString()).joinToString("_")
            }
            val existing = merged[resolvedId]
            if (existing == null || record.updatedAt >= existing.updatedAt) {
                merged[resolvedId] = record
            }
        }

        val recordsWithRules = mutableListOf<DisciplineRecordWithRule>()
        var totalViolation = 0
        var totalAchievement = 0

        merged.values.forEach { record ->
            val rule = selectedRules[record.ruleId]
            recordsWithRules.add(DisciplineRecordWithRule(record, rule))
            val category = rule?.category?.trim()?.uppercase().orEmpty()
            if (category == "VIOLATION") totalViolation += record.points else if (category == "ACHIEVEMENT") totalAchievement += record.points
        }

        recordsWithRules.sortByDescending { it.record.date }
        _uiState.value = DisciplineUiState.Success(
            violationPoints = totalViolation,
            achievementPoints = totalAchievement,
            records = recordsWithRules
        )
    }

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }

    private fun detachAllListeners() {
        recordListeners.forEach { (query, listener) -> query.removeEventListener(listener) }
        recordListeners.clear()
        recordsByAlias.clear()

        globalRulesListener?.let { db.getReference("discipline_rules").removeEventListener(it) }
        scopedRulesListener?.let { listener ->
            val scope = currentSchoolId.trim().lowercase()
            if (scope.isNotBlank()) {
                db.getReference("discipline_rules_by_school").child(scope).removeEventListener(listener)
            }
        }
        globalRulesListener = null
        scopedRulesListener = null
        globalRules = emptyMap()
        scopedRules = emptyMap()
        selectedRules = emptyMap()
    }

    override fun onCleared() {
        detachAllListeners()
        super.onCleared()
    }
}
