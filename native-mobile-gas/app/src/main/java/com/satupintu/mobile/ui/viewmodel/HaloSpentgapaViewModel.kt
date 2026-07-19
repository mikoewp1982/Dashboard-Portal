package com.satupintu.mobile.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.satupintu.mobile.data.model.BullyingReport
import com.satupintu.mobile.data.repository.BullyingRepository
import com.satupintu.mobile.data.repository.StudentRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class HaloSpentgapaViewModel : ViewModel() {
    private val repository = BullyingRepository()
    private val studentRepository = StudentRepository()
    
    private val _reports = MutableStateFlow<List<BullyingReport>>(emptyList())
    val reports: StateFlow<List<BullyingReport>> = _reports

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private var loadJob: Job? = null

    fun loadReports(studentCredential: String, studentId: String, schoolId: String) {
        _isLoading.value = true
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            try {
                val identityCandidates = linkedSetOf(
                    normalizeIdentity(studentCredential),
                    normalizeIdentity(studentId)
                ).filter { it.isNotBlank() }.toMutableSet()

                val student = try {
                    studentRepository.resolveStudent(
                        studentId = studentId,
                        credential = studentCredential,
                        schoolId = schoolId
                    )
                } catch (e: Exception) {
                    null
                }
                student?.let {
                    identityCandidates += normalizeIdentity(it.id)
                    identityCandidates += normalizeIdentity(it.nisn)
                    identityCandidates += normalizeIdentity(it.username)
                }

                val resolvedSchoolId = schoolId.ifBlank { student?.schoolId.orEmpty() }

                repository.getStudentReports(identityCandidates, resolvedSchoolId).collect {
                    _reports.value = it
                    _isLoading.value = false
                }
            } catch (e: Exception) {
                _isLoading.value = false
                // Handle error
            }
        }
    }

    private fun normalizeIdentity(value: String?): String {
        return value?.trim().orEmpty()
    }
}
