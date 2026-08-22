package com.klecet.campushub.network

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.klecet.campushub.model.Student
import com.klecet.campushub.model.Teacher
import com.klecet.campushub.model.User
import com.klecet.campushub.model.UserRole
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AuthManager {
    private const val PREFS_NAME = "campus_hub_auth_prefs"
    private const val KEY_TOKEN = "cah_jwt_token"
    private const val KEY_USER_ID = "cah_user_id"
    private const val KEY_USER_JSON = "cah_user_json"
    private const val KEY_TEACHER_JSON = "cah_teacher_json"
    private const val KEY_STUDENT_JSON = "cah_student_json"
    private const val KEY_BASE_URL = "cah_custom_base_url"

    // Default development server address (accessible in Android emulator via 10.0.2.2 or physical device URL)
    const val DEFAULT_BASE_URL = "https://ais-dev-g3zpe6tqdiq6wtcs3r7bbs-642846774352.asia-southeast1.run.app/"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _currentTeacher = MutableStateFlow<Teacher?>(null)
    val currentTeacher: StateFlow<Teacher?> = _currentTeacher.asStateFlow()

    private val _currentStudent = MutableStateFlow<Student?>(null)
    val currentStudent: StateFlow<Student?> = _currentStudent.asStateFlow()

    private val _currentRole = MutableStateFlow<UserRole>(UserRole.STUDENT)
    val currentRole: StateFlow<UserRole> = _currentRole.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadSavedSession()
    }

    private fun loadSavedSession() {
        val token = getToken()
        val userJson = prefs.getString(KEY_USER_JSON, null)
        val teacherJson = prefs.getString(KEY_TEACHER_JSON, null)
        val studentJson = prefs.getString(KEY_STUDENT_JSON, null)

        if (!token.isNullOrBlank() && !userJson.isNullOrBlank()) {
            try {
                val user = gson.fromJson(userJson, User::class.java)
                val teacher = if (teacherJson != null) gson.fromJson(teacherJson, Teacher::class.java) else null
                val student = if (studentJson != null) gson.fromJson(studentJson, Student::class.java) else null

                _currentUser.value = user
                _currentTeacher.value = teacher
                _currentStudent.value = student
                _currentRole.value = user.role
                _isLoggedIn.value = true
            } catch (e: Exception) {
                clearSession()
            }
        }
    }

    fun saveSession(token: String, user: User, teacher: Teacher? = null, student: Student? = null) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, user.id)
            .putString(KEY_USER_JSON, gson.toJson(user))
            .apply()

        if (teacher != null) {
            prefs.edit().putString(KEY_TEACHER_JSON, gson.toJson(teacher)).apply()
        } else {
            prefs.edit().remove(KEY_TEACHER_JSON).apply()
        }

        if (student != null) {
            prefs.edit().putString(KEY_STUDENT_JSON, gson.toJson(student)).apply()
        } else {
            prefs.edit().remove(KEY_STUDENT_JSON).apply()
        }

        _currentUser.value = user
        _currentTeacher.value = teacher
        _currentStudent.value = student
        _currentRole.value = user.role
        _isLoggedIn.value = true
    }

    fun getToken(): String? {
        return if (::prefs.isInitialized) prefs.getString(KEY_TOKEN, null) else null
    }

    fun getUserId(): String? {
        return if (::prefs.isInitialized) prefs.getString(KEY_USER_ID, null) else null
    }

    fun getBaseUrl(): String {
        return if (::prefs.isInitialized) {
            prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        } else {
            DEFAULT_BASE_URL
        }
    }

    fun setBaseUrl(url: String) {
        val clean = if (!url.endsWith("/")) "$url/" else url
        if (::prefs.isInitialized) {
            prefs.edit().putString(KEY_BASE_URL, clean).apply()
        }
    }

    fun clearSession() {
        if (::prefs.isInitialized) {
            prefs.edit()
                .remove(KEY_TOKEN)
                .remove(KEY_USER_ID)
                .remove(KEY_USER_JSON)
                .remove(KEY_TEACHER_JSON)
                .remove(KEY_STUDENT_JSON)
                .apply()
        }
        _currentUser.value = null
        _currentTeacher.value = null
        _currentStudent.value = null
        _currentRole.value = UserRole.STUDENT
        _isLoggedIn.value = false
    }
}
