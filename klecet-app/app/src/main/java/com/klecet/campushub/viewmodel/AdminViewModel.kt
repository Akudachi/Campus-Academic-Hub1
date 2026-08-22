package com.klecet.campushub.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.klecet.campushub.model.*
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.network.GeminiService
import com.klecet.campushub.network.NetworkResult
import com.klecet.campushub.repository.CampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AdminViewModel(
    private val repository: CampusRepository = CampusRepository()
) : ViewModel() {

    // --- Overview & System ---
    private val _systemStatus = MutableStateFlow<SystemStatusInfo?>(null)
    val systemStatus: StateFlow<SystemStatusInfo?> = _systemStatus.asStateFlow()

    private val _campusSettings = MutableStateFlow(CampusSettings())
    val campusSettings: StateFlow<CampusSettings> = _campusSettings.asStateFlow()

    private val _auditLogs = MutableStateFlow<List<AuditLog>>(emptyList())
    val auditLogs: StateFlow<List<AuditLog>> = _auditLogs.asStateFlow()

    // --- Teachers ---
    private val _teachers = MutableStateFlow<List<Teacher>>(emptyList())
    val teachers: StateFlow<List<Teacher>> = _teachers.asStateFlow()

    // --- Students ---
    private val _students = MutableStateFlow<List<Student>>(emptyList())
    val students: StateFlow<List<Student>> = _students.asStateFlow()

    // --- Semesters & Subjects & Departments ---
    private val _semesters = MutableStateFlow<List<Semester>>(emptyList())
    val semesters: StateFlow<List<Semester>> = _semesters.asStateFlow()

    private val _subjects = MutableStateFlow<List<Subject>>(emptyList())
    val subjects: StateFlow<List<Subject>> = _subjects.asStateFlow()

    private val _departments = MutableStateFlow<List<Department>>(emptyList())
    val departments: StateFlow<List<Department>> = _departments.asStateFlow()

    // --- Timetable AI Extracted Rows ---
    private val _extractedRows = MutableStateFlow<List<ExtractedTimetableRow>>(emptyList())
    val extractedRows: StateFlow<List<ExtractedTimetableRow>> = _extractedRows.asStateFlow()

    // --- UI Loading & Feedback ---
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    init {
        loadAllAdminData()
    }

    fun loadAllAdminData() {
        viewModelScope.launch {
            _isLoading.value = true
            loadOverview()
            loadTeachers()
            loadStudents()
            loadSemesters()
            loadSubjects()
            loadDepartments()
            loadAuditLogs()
            _isLoading.value = false
        }
    }

    fun loadOverview() {
        viewModelScope.launch {
            when (val res = repository.getSystemStatus()) {
                is NetworkResult.Success -> _systemStatus.value = res.data
                else -> {}
            }
            when (val res = repository.getCampusSettings()) {
                is NetworkResult.Success -> _campusSettings.value = res.data
                else -> {}
            }
        }
    }

    fun loadTeachers() {
        viewModelScope.launch {
            when (val res = repository.getTeachers()) {
                is NetworkResult.Success -> _teachers.value = res.data
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun createTeacher(payload: Map<String, String>, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.createTeacher(payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Faculty ${res.data.user?.name ?: ""} created successfully"
                    loadTeachers()
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun updateTeacher(id: String, payload: Map<String, String>, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.updateTeacher(id, payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Faculty updated successfully"
                    loadTeachers()
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun deleteTeacher(id: String) {
        viewModelScope.launch {
            when (val res = repository.deleteTeacher(id)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Faculty removed"
                    loadTeachers()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun assignSubject(teacherId: String, subjectId: String, semesterId: String?) {
        viewModelScope.launch {
            when (val res = repository.assignSubject(teacherId, subjectId, semesterId)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Subject assigned to faculty"
                    loadTeachers()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun unassignSubject(teacherId: String, subjectId: String) {
        viewModelScope.launch {
            when (val res = repository.unassignSubject(teacherId, subjectId)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Subject unassigned"
                    loadTeachers()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun autoAssignTeachers(dept: String?, sem: Int?) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.autoAssignTeachers(dept, sem)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = res.data
                    loadTeachers()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun loadStudents() {
        viewModelScope.launch {
            when (val res = repository.getStudents()) {
                is NetworkResult.Success -> _students.value = res.data
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun createStudent(payload: Map<String, Any>, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.createStudent(payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Student created successfully"
                    loadStudents()
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun updateStudent(id: String, payload: Map<String, Any>, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.updateStudent(id, payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Student updated successfully"
                    loadStudents()
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun deleteStudent(id: String) {
        viewModelScope.launch {
            when (val res = repository.deleteStudent(id)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Student removed"
                    loadStudents()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun loadSemesters() {
        viewModelScope.launch {
            when (val res = repository.getSemesters()) {
                is NetworkResult.Success -> _semesters.value = res.data
                else -> {}
            }
        }
    }

    fun loadSubjects() {
        viewModelScope.launch {
            when (val res = repository.getSubjects()) {
                is NetworkResult.Success -> _subjects.value = res.data
                else -> {}
            }
        }
    }

    fun loadDepartments() {
        viewModelScope.launch {
            when (val res = repository.getDepartments()) {
                is NetworkResult.Success -> _departments.value = res.data
                else -> {}
            }
        }
    }

    fun loadAuditLogs() {
        viewModelScope.launch {
            when (val res = repository.getAuditLogs()) {
                is NetworkResult.Success -> _auditLogs.value = res.data
                else -> {}
            }
        }
    }

    // --- Timetable AI Upload & Gemini Extraction ---
    fun parseTimetable(
        fileName: String?,
        rawText: String?,
        fileContent: String?,
        imageData: String?,
        imageMimeType: String?,
        semester: Int,
        departmentCode: String
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            val res = GeminiService.extractViaBackend(
                fileName = fileName,
                rawText = rawText,
                fileContent = fileContent,
                imageData = imageData,
                imageMimeType = imageMimeType,
                semester = semester,
                departmentCode = departmentCode
            )
            if (res.isSuccess) {
                _extractedRows.value = res.getOrDefault(emptyList())
                _toastMessage.value = "Timetable successfully parsed! ${_extractedRows.value.size} subjects extracted."
            } else {
                _toastMessage.value = "Timetable extraction failed: ${res.exceptionOrNull()?.message}"
            }
            _isLoading.value = false
        }
    }

    fun updateExtractedRow(index: Int, row: ExtractedTimetableRow) {
        val list = _extractedRows.value.toMutableList()
        if (index in list.indices) {
            list[index] = row
            _extractedRows.value = list
        }
    }

    fun confirmTimetableRows(uploadId: String, onComplete: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val res = ApiClient.apiService.confirmTimetable(uploadId, mapOf("confirmedRows" to _extractedRows.value))
                if (res.isSuccessful) {
                    _toastMessage.value = "Timetable confirmed! Subjects and allocations updated."
                    loadAllAdminData()
                    onComplete()
                } else {
                    _toastMessage.value = "Confirmation failed"
                }
            } catch (e: Exception) {
                _toastMessage.value = e.localizedMessage ?: "Error confirming timetable"
            }
            _isLoading.value = false
        }
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
