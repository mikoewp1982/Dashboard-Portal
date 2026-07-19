package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satupintu.mobile.data.model.DisciplineRecord
import com.satupintu.mobile.data.model.DisciplineRule
import com.satupintu.mobile.data.model.Student
import com.satupintu.mobile.data.model.Teacher
import com.satupintu.mobile.data.repository.DisciplineRepository
import com.satupintu.mobile.data.repository.StudentRepository
import com.satupintu.mobile.data.repository.TeacherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

data class DisciplineStats(
    val violationCount: Int = 0,
    val violationPoints: Int = 0,
    val achievementCount: Int = 0,
    val achievementPoints: Int = 0
)

data class DisciplineHistoryItem(
    val record: DisciplineRecord,
    val student: Student,
    val rule: DisciplineRule?
)

class TeacherDisciplineViewModel : ViewModel() {
    private val disciplineRepository = DisciplineRepository()
    private val studentRepository = StudentRepository()
    private val teacherRepository = TeacherRepository()

    private val _teacher = MutableStateFlow<Teacher?>(null)
    val teacher: StateFlow<Teacher?> = _teacher.asStateFlow()

    private val _students = MutableStateFlow<List<Student>>(emptyList())
    val students: StateFlow<List<Student>> = _students.asStateFlow()

    private val _rules = MutableStateFlow<List<DisciplineRule>>(emptyList())
    val rules: StateFlow<List<DisciplineRule>> = _rules.asStateFlow()

    private val _stats = MutableStateFlow(DisciplineStats())
    val stats: StateFlow<DisciplineStats> = _stats.asStateFlow()

    private val _history = MutableStateFlow<List<DisciplineHistoryItem>>(emptyList())
    val history: StateFlow<List<DisciplineHistoryItem>> = _history.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    private var teacherJob: Job? = null
    private var dataJob: Job? = null

    // For UI state when adding a record
    private val _selectedStudent = MutableStateFlow<Student?>(null)
    val selectedStudent: StateFlow<Student?> = _selectedStudent.asStateFlow()

    fun setTeacherNuptk(nuptk: String, schoolId: String) {
        teacherJob?.cancel()
        teacherJob = viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            val teacher = try {
                teacherRepository.resolveTeacher(nuptk.trim(), schoolId)
            } catch (error: Exception) {
                null
            }
            _teacher.value = teacher
            if (teacher != null) {
                loadData(teacher.homeroomClass, teacher.schoolId)
            } else {
                _students.value = emptyList()
                _history.value = emptyList()
                _stats.value = DisciplineStats()
                _errorMessage.value = "Data wali kelas tidak ditemukan."
                _isLoading.value = false
            }
        }
    }

    private fun loadData(className: String, schoolId: String) {
        dataJob?.cancel()
        dataJob = viewModelScope.launch {
            _errorMessage.value = null
            val studentsFlow = studentRepository.getStudents(schoolId)
            val recordsFlow = disciplineRepository.getAllRecords(schoolId)
            val rulesFlow = disciplineRepository.getRules(schoolId)

            combine(studentsFlow, recordsFlow, rulesFlow) { allStudents, allRecords, allRules ->
                val normalizedSchoolId = normalizeScope(schoolId)
                val normalizedClassName = normalizeClassName(className)
                val scopedStudents = if (normalizedSchoolId.isBlank()) {
                    allStudents
                } else {
                    allStudents.filter { normalizeScope(it.schoolId) == normalizedSchoolId }
                }
                val classStudents = if (normalizedClassName.isBlank()) {
                    scopedStudents
                } else {
                    scopedStudents.filter { normalizeClassName(it.className) == normalizedClassName }
                }
                val studentIdentities = classStudents.flatMap { student ->
                    listOf(normalizeIdentity(student.id), normalizeIdentity(student.nisn))
                }.filter { it.isNotBlank() }.toSet()

                val classRecords = allRecords.filter { record ->
                    val recordSchoolScope = normalizeScope(record.schoolId)
                    val matchesSchool = normalizedSchoolId.isBlank() ||
                        recordSchoolScope.isBlank() ||
                        recordSchoolScope == normalizedSchoolId
                    matchesSchool && studentIdentities.contains(normalizeIdentity(record.studentId))
                }

                Triple(classStudents, classRecords, allRules.filter { it.isActive })
            }
                .catch { error ->
                    _students.value = emptyList()
                    _rules.value = emptyList()
                    _history.value = emptyList()
                    _stats.value = DisciplineStats()
                    _errorMessage.value = "Data kedisiplinan gagal dimuat."
                    _isLoading.value = false
                }
                .collect { (classStudents, classRecords, allRules) ->
                _students.value = classStudents
                _rules.value = allRules

                if (allRules.isNotEmpty()) {
                    calculateStats(classRecords, allRules)
                    generateHistory(classRecords, classStudents, allRules)
                } else {
                    _stats.value = DisciplineStats()
                    _history.value = emptyList()
                }

                _isLoading.value = false
            }
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    init {
        // loadRules() // No longer needed as we load in loadData
    }

    fun selectStudent(student: Student) {
        _selectedStudent.value = student
    }

    fun clearSelection() {
        _selectedStudent.value = null
    }

    fun addRecord(rule: DisciplineRule, description: String, onComplete: (Boolean) -> Unit) {
        val teacherData = _teacher.value ?: return
        val student = _selectedStudent.value ?: return
        val now = System.currentTimeMillis()
        val reporterName = teacherData.name.ifBlank { "Guru" }
        val studentIdentifier = student.id.ifBlank { student.nisn }

        val record = DisciplineRecord(
            schoolId = teacherData.schoolId.ifBlank { student.schoolId },
            studentId = studentIdentifier,
            studentNameSnapshot = student.name,
            classNameSnapshot = student.className,
            ruleId = rule.id,
            ruleNameSnapshot = rule.ruleName,
            date = now,
            points = rule.points,
            description = description.trim().ifBlank { null },
            recordedBy = reporterName,
            reportedByUserId = teacherData.nuptk.ifBlank { teacherData.id },
            reportedByName = reporterName,
            reportedByRole = "teacher",
            sourceApp = "gas_teacher_app",
            status = "APPROVED",
            createdAt = now,
            updatedAt = now
        )

        _isLoading.value = true
        disciplineRepository.saveRecord(record) { success ->
            _isLoading.value = false
            onComplete(success)
        }
    }

    override fun onCleared() {
        teacherJob?.cancel()
        dataJob?.cancel()
        super.onCleared()
    }
    
    private fun generateHistory(records: List<DisciplineRecord>, students: List<Student>, rules: List<DisciplineRule>) {
        val studentByIdentity = LinkedHashMap<String, Student>()
        students.forEach { student ->
            listOf(student.id, student.nisn)
                .map { normalizeIdentity(it) }
                .filter { it.isNotBlank() }
                .distinct()
                .forEach { identity ->
                    if (!studentByIdentity.containsKey(identity)) {
                        studentByIdentity[identity] = student
                    }
                }
        }
        val ruleById = rules.associateBy { it.id }
        val historyItems = records.mapNotNull { record ->
            val recordIdentity = normalizeIdentity(record.studentId)
            val student = studentByIdentity[recordIdentity]
            val rule = ruleById[record.ruleId]
            
            if (student != null) {
                DisciplineHistoryItem(record, student, rule)
            } else {
                null
            }
        }.sortedByDescending { it.record.date }
        
        _history.value = historyItems
    }
    
    private fun calculateStats(records: List<DisciplineRecord>, rules: List<DisciplineRule>) {
        var vCount = 0
        var vPoints = 0
        var aCount = 0
        var aPoints = 0
        
        records.forEach { record ->
            val rule = rules.find { it.id == record.ruleId }
            if (rule != null) {
                if (rule.category == "VIOLATION") {
                    vCount++
                    vPoints += record.points
                } else {
                    aCount++
                    aPoints += record.points
                }
            }
        }
        
        _stats.value = DisciplineStats(vCount, vPoints, aCount, aPoints)
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

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }

    private fun normalizeScope(value: String?): String {
        return value?.trim()?.lowercase().orEmpty()
    }
}
