package com.klecet.campushub.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.klecet.campushub.model.*
import com.klecet.campushub.network.AuthManager
import com.klecet.campushub.network.NetworkResult
import com.klecet.campushub.repository.CampusRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val user: User, val role: UserRole) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel(
    private val repository: CampusRepository = CampusRepository()
) : ViewModel() {

    val currentUser: StateFlow<User?> = AuthManager.currentUser
    val currentTeacher: StateFlow<Teacher?> = AuthManager.currentTeacher
    val currentStudent: StateFlow<Student?> = AuthManager.currentStudent
    val currentRole: StateFlow<UserRole> = AuthManager.currentRole
    val isLoggedIn: StateFlow<Boolean> = AuthManager.isLoggedIn

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _personas = MutableStateFlow<List<PersonaItem>>(emptyList())
    val personas: StateFlow<List<PersonaItem>> = _personas.asStateFlow()

    private val _isLoadingPersonas = MutableStateFlow(false)
    val isLoadingPersonas: StateFlow<Boolean> = _isLoadingPersonas.asStateFlow()

    init {
        loadPersonas()
    }

    fun loadPersonas() {
        viewModelScope.launch {
            _isLoadingPersonas.value = true
            when (val result = repository.getPersonas()) {
                is NetworkResult.Success -> _personas.value = result.data
                else -> {}
            }
            _isLoadingPersonas.value = false
        }
    }

    fun login(credentials: Map<String, String>) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            when (val result = repository.login(credentials)) {
                is NetworkResult.Success -> {
                    _uiState.value = AuthUiState.Success(result.data.user, result.data.user.role)
                }
                is NetworkResult.Error -> {
                    _uiState.value = AuthUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun loginWithPersona(persona: PersonaItem) {
        val creds = when (persona.user.role) {
            UserRole.ADMIN -> mapOf("role" to "admin", "password" to "admin123")
            UserRole.TEACHER -> mapOf("role" to "teacher", "teacherCode" to (persona.teacher?.teacherCode ?: "T001"), "password" to "teacher123")
            UserRole.STUDENT -> mapOf("role" to "student", "usn" to (persona.student?.usn ?: "2KL23CS001"), "password" to "student123")
        }
        login(creds)
    }

    fun logout() {
        AuthManager.clearSession()
        _uiState.value = AuthUiState.Idle
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}
