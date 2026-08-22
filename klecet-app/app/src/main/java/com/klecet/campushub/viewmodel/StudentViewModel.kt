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

class StudentViewModel(
    private val repository: CampusRepository = CampusRepository()
) : ViewModel() {

    // Dashboard Summary (Overall attendance %, total classes, latest test marks, unread circulars)
    private val _dashboardSummary = MutableStateFlow<StudentDashboardSummary?>(null)
    val dashboardSummary: StateFlow<StudentDashboardSummary?> = _dashboardSummary.asStateFlow()

    // Attendance Details
    private val _attendanceData = MutableStateFlow<Map<String, Any>>(emptyMap())
    val attendanceData: StateFlow<Map<String, Any>> = _attendanceData.asStateFlow()

    // Coursework / Assignments
    private val _assignments = MutableStateFlow<List<Assignment>>(emptyList())
    val assignments: StateFlow<List<Assignment>> = _assignments.asStateFlow()

    // Test CIE Marks
    private val _testMarks = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val testMarks: StateFlow<List<Map<String, Any>>> = _testMarks.asStateFlow()

    // Circulars & Events
    private val _notices = MutableStateFlow<List<Notice>>(emptyList())
    val notices: StateFlow<List<Notice>> = _notices.asStateFlow()

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    // UI Loading & Feedback
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    init {
        loadStudentData()
    }

    fun loadStudentData() {
        viewModelScope.launch {
            _isLoading.value = true
            loadDashboardSummary()
            loadAttendance()
            loadAssignments()
            loadMarks()
            loadNotices()
            loadEvents()
            _isLoading.value = false
        }
    }

    fun loadDashboardSummary() {
        viewModelScope.launch {
            when (val res = repository.getStudentDashboard()) {
                is NetworkResult.Success -> _dashboardSummary.value = res.data
                is NetworkResult.Error -> _toastMessage.value = res.message
                else -> {}
            }
        }
    }

    fun loadAttendance() {
        viewModelScope.launch {
            when (val res = repository.getStudentAttendance()) {
                is NetworkResult.Success -> _attendanceData.value = res.data
                else -> {}
            }
        }
    }

    fun loadAssignments() {
        viewModelScope.launch {
            when (val res = repository.getStudentAssignments()) {
                is NetworkResult.Success -> _assignments.value = res.data
                else -> {}
            }
        }
    }

    fun loadMarks() {
        viewModelScope.launch {
            when (val res = repository.getStudentMarks()) {
                is NetworkResult.Success -> _testMarks.value = res.data
                else -> {}
            }
        }
    }

    fun loadNotices() {
        viewModelScope.launch {
            when (val res = repository.getStudentNotices()) {
                is NetworkResult.Success -> _notices.value = res.data
                else -> {}
            }
        }
    }

    fun loadEvents() {
        viewModelScope.launch {
            when (val res = repository.getStudentEvents()) {
                is NetworkResult.Success -> _events.value = res.data
                else -> {}
            }
        }
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
