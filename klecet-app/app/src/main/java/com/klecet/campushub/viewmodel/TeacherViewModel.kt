package com.klecet.campushub.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.klecet.campushub.model.*
import com.klecet.campushub.network.NetworkResult
import com.klecet.campushub.repository.CampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TeacherViewModel(
    private val repository: CampusRepository = CampusRepository()
) : ViewModel() {

    // Assigned Subjects
    private val _assignedSubjects = MutableStateFlow<List<TeacherAssignedSubjectSummary>>(emptyList())
    val assignedSubjects: StateFlow<List<TeacherAssignedSubjectSummary>> = _assignedSubjects.asStateFlow()

    private val _selectedSubject = MutableStateFlow<TeacherAssignedSubjectSummary?>(null)
    val selectedSubject: StateFlow<TeacherAssignedSubjectSummary?> = _selectedSubject.asStateFlow()

    // Attendance Taking & History
    private val _attendanceRoster = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val attendanceRoster: StateFlow<List<Map<String, Any>>> = _attendanceRoster.asStateFlow()

    private val _attendanceHistory = MutableStateFlow<List<AttendanceSession>>(emptyList())
    val attendanceHistory: StateFlow<List<AttendanceSession>> = _attendanceHistory.asStateFlow()

    // Assignments
    private val _assignments = MutableStateFlow<List<Assignment>>(emptyList())
    val assignments: StateFlow<List<Assignment>> = _assignments.asStateFlow()

    private val _submissionRoster = MutableStateFlow<List<StudentSubmissionRosterItem>>(emptyList())
    val submissionRoster: StateFlow<List<StudentSubmissionRosterItem>> = _submissionRoster.asStateFlow()

    // Test Mark Sheets
    private val _markSheets = MutableStateFlow<List<TestMarkSheet>>(emptyList())
    val markSheets: StateFlow<List<TestMarkSheet>> = _markSheets.asStateFlow()

    private val _currentMarkSheet = MutableStateFlow<TestMarkSheet?>(null)
    val currentMarkSheet: StateFlow<TestMarkSheet?> = _currentMarkSheet.asStateFlow()

    private val _studentMarkRoster = MutableStateFlow<List<StudentMarkRosterItem>>(emptyList())
    val studentMarkRoster: StateFlow<List<StudentMarkRosterItem>> = _studentMarkRoster.asStateFlow()

    // UI Feedback
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    init {
        loadTeacherData()
    }

    fun loadTeacherData() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val res = repository.getTeacherSubjects()) {
                is NetworkResult.Success -> {
                    _assignedSubjects.value = res.data
                    if (_selectedSubject.value == null && res.data.isNotEmpty()) {
                        _selectedSubject.value = res.data.first()
                        loadSubjectDetails(res.data.first().subjectId)
                    }
                }
                else -> {}
            }
            loadAssignments()
            loadMarkSheets()
            _isLoading.value = false
        }
    }

    fun selectSubject(subject: TeacherAssignedSubjectSummary) {
        _selectedSubject.value = subject
        loadSubjectDetails(subject.subjectId)
    }

    fun loadSubjectDetails(subjectId: String) {
        loadAttendanceRoster(subjectId)
        loadAttendanceHistory(subjectId)
        loadAssignments(subjectId)
        loadMarkSheets(subjectId)
    }

    fun loadAttendanceRoster(subjectId: String) {
        viewModelScope.launch {
            when (val res = repository.getAttendanceRoster(subjectId)) {
                is NetworkResult.Success -> _attendanceRoster.value = res.data
                else -> {}
            }
        }
    }

    fun loadAttendanceHistory(subjectId: String? = null) {
        viewModelScope.launch {
            when (val res = repository.getTeacherAttendanceSessions(subjectId)) {
                is NetworkResult.Success -> _attendanceHistory.value = res.data
                else -> {}
            }
        }
    }

    fun submitAttendance(
        subjectId: String,
        semesterId: String?,
        date: String,
        period: String?,
        topic: String?,
        records: List<Map<String, String>>,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            val payload = mutableMapOf<String, Any>(
                "subjectId" to subjectId,
                "date" to date,
                "records" to records,
                "submitImmediately" to true
            )
            semesterId?.let { payload["semesterId"] = it }
            period?.let { payload["period"] = it }
            topic?.let { payload["topic"] = it }

            when (val res = repository.createAttendanceSession(payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Attendance locked & saved successfully"
                    loadAttendanceHistory(subjectId)
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun loadAssignments(subjectId: String? = null) {
        viewModelScope.launch {
            when (val res = repository.getTeacherAssignments(subjectId)) {
                is NetworkResult.Success -> _assignments.value = res.data
                else -> {}
            }
        }
    }

    fun createAssignment(
        subjectId: String,
        semesterId: String?,
        title: String,
        instructions: String,
        dueDate: String,
        pdfData: String?,
        pdfFileName: String?,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            val payload = mutableMapOf<String, Any>(
                "subjectId" to subjectId,
                "title" to title,
                "instructions" to instructions,
                "dueDate" to dueDate
            )
            semesterId?.let { payload["semesterId"] = it }
            pdfData?.let { payload["pdfData"] = it }
            pdfFileName?.let { payload["pdfFileName"] = it }

            when (val res = repository.createAssignment(payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Assignment posted successfully"
                    loadAssignments(_selectedSubject.value?.subjectId)
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun loadAssignmentRoster(assignmentId: String) {
        viewModelScope.launch {
            when (val res = repository.getAssignmentRoster(assignmentId)) {
                is NetworkResult.Success -> _submissionRoster.value = res.data
                else -> {}
            }
        }
    }

    fun toggleSubmissionStatus(assignmentId: String, studentId: String, currentStatus: String) {
        val newStatus = if (currentStatus == "submitted") "not_submitted" else "submitted"
        viewModelScope.launch {
            when (val res = repository.updateSubmissionStatus(assignmentId, studentId, newStatus)) {
                is NetworkResult.Success -> {
                    _submissionRoster.value = _submissionRoster.value.map {
                        if (it.studentId == studentId) it.copy(status = newStatus) else it
                    }
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun loadMarkSheets(subjectId: String? = null) {
        viewModelScope.launch {
            when (val res = repository.getTeacherMarkSheets(subjectId)) {
                is NetworkResult.Success -> _markSheets.value = res.data
                else -> {}
            }
        }
    }

    fun createMarkSheet(
        subjectId: String,
        semesterId: String?,
        testName: String,
        maxMarks: Double,
        published: Boolean,
        onSuccess: () -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            val payload = mutableMapOf<String, Any>(
                "subjectId" to subjectId,
                "testName" to testName,
                "maxMarks" to maxMarks,
                "published" to published
            )
            semesterId?.let { payload["semesterId"] = it }

            when (val res = repository.createMarkSheet(payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "CIE Mark Sheet created"
                    loadMarkSheets(_selectedSubject.value?.subjectId)
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun loadMarkSheetDetails(sheetId: String) {
        viewModelScope.launch {
            when (val res = repository.getMarkSheetDetails(sheetId)) {
                is NetworkResult.Success -> {
                    _currentMarkSheet.value = res.data.first
                    _studentMarkRoster.value = res.data.second
                }
                else -> {}
            }
        }
    }

    fun updateStudentMark(studentId: String, mark: Double) {
        _studentMarkRoster.value = _studentMarkRoster.value.map {
            if (it.studentId == studentId) it.copy(marks = mark, hasEntry = true) else it
        }
    }

    fun saveMarks(sheetId: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val payload = _studentMarkRoster.value.map {
                mapOf("studentId" to it.studentId, "marks" to it.marks)
            }
            when (val res = repository.updateMarks(sheetId, payload)) {
                is NetworkResult.Success -> {
                    _toastMessage.value = "Marks saved successfully"
                    loadMarkSheetDetails(sheetId)
                    onSuccess()
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun togglePublishMarkSheet(sheetId: String, currentPublished: Boolean) {
        viewModelScope.launch {
            when (val res = repository.publishMarkSheet(sheetId, !currentPublished)) {
                is NetworkResult.Success -> {
                    _currentMarkSheet.value = res.data
                    _toastMessage.value = if (!currentPublished) "Marks published to students" else "Marks unpublished"
                    loadMarkSheets(_selectedSubject.value?.subjectId)
                }
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
