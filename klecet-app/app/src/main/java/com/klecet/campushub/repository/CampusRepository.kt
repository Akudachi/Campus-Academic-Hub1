package com.klecet.campushub.repository

import com.google.gson.Gson
import com.klecet.campushub.model.*
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.network.AuthManager
import com.klecet.campushub.network.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CampusRepository {

    private val api = ApiClient.apiService
    private val gson = Gson()

    // --- Authentication ---
    suspend fun login(credentials: Map<String, String>): NetworkResult<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.login(credentials)
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                AuthManager.saveSession(data.token, data.user, data.teacher, data.student)
                NetworkResult.Success(data)
            } else {
                val errMsg = response.errorBody()?.string() ?: "Login failed. Please check your credentials."
                NetworkResult.Error(errMsg, response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network connection error")
        }
    }

    suspend fun getPersonas(): NetworkResult<List<PersonaItem>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getPersonas()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!.personas)
            } else {
                NetworkResult.Error("Failed to fetch demo personas", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getMe(): NetworkResult<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMe()
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                AuthManager.saveSession(data.token, data.user, data.teacher, data.student)
                NetworkResult.Success(data)
            } else {
                NetworkResult.Error("Session expired", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Admin: Faculty ---
    suspend fun getTeachers(): NetworkResult<List<Teacher>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTeachers()
            if (response.isSuccessful && response.body() != null) {
                val rawList = response.body()!!["teachers"] as? List<*> ?: emptyList<Any>()
                val teachers = rawList.map {
                    gson.fromJson(gson.toJson(it), Teacher::class.java)
                }
                NetworkResult.Success(teachers)
            } else {
                NetworkResult.Error("Failed to load teachers", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createTeacher(payload: Map<String, String>): NetworkResult<Teacher> = withContext(Dispatchers.IO) {
        try {
            val response = api.createTeacher(payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["teacher"]
                val teacher = gson.fromJson(gson.toJson(raw), Teacher::class.java)
                NetworkResult.Success(teacher)
            } else {
                NetworkResult.Error("Failed to create teacher", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateTeacher(id: String, payload: Map<String, String>): NetworkResult<Teacher> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateTeacher(id, payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["teacher"]
                val teacher = gson.fromJson(gson.toJson(raw), Teacher::class.java)
                NetworkResult.Success(teacher)
            } else {
                NetworkResult.Error("Failed to update teacher", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteTeacher(id: String): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteTeacher(id)
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to delete teacher", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun assignSubject(teacherId: String, subjectId: String, semesterId: String?): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val map = mutableMapOf("subjectId" to subjectId)
            semesterId?.let { map["semesterId"] = it }
            val response = api.assignTeacherSubject(teacherId, map)
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to assign subject", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun unassignSubject(teacherId: String, subjectId: String): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.unassignTeacherSubject(teacherId, subjectId)
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to remove subject", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun autoAssignTeachers(department: String?, semester: Int?): NetworkResult<String> = withContext(Dispatchers.IO) {
        try {
            val payload = mutableMapOf<String, Any>()
            department?.let { payload["department"] = it }
            semester?.let { payload["semesterNumber"] = it }
            val response = api.autoAssignTeachers(payload)
            if (response.isSuccessful && response.body() != null) {
                val msg = response.body()!!["message"] as? String ?: "Auto-assigned successfully"
                NetworkResult.Success(msg)
            } else {
                NetworkResult.Error("Auto-assign failed", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Admin: Students ---
    suspend fun getStudents(): NetworkResult<List<Student>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudents()
            if (response.isSuccessful && response.body() != null) {
                val rawList = response.body()!!["students"] as? List<*> ?: emptyList<Any>()
                val students = rawList.map {
                    gson.fromJson(gson.toJson(it), Student::class.java)
                }
                NetworkResult.Success(students)
            } else {
                NetworkResult.Error("Failed to load students", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createStudent(payload: Map<String, Any>): NetworkResult<Student> = withContext(Dispatchers.IO) {
        try {
            val response = api.createStudent(payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["student"]
                val student = gson.fromJson(gson.toJson(raw), Student::class.java)
                NetworkResult.Success(student)
            } else {
                NetworkResult.Error("Failed to create student", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateStudent(id: String, payload: Map<String, Any>): NetworkResult<Student> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateStudent(id, payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["student"]
                val student = gson.fromJson(gson.toJson(raw), Student::class.java)
                NetworkResult.Success(student)
            } else {
                NetworkResult.Error("Failed to update student", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteStudent(id: String): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteStudent(id)
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to delete student", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Admin: Semesters & Departments ---
    suspend fun getSemesters(): NetworkResult<List<Semester>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getSemesters()
            if (response.isSuccessful && response.body() != null) {
                val semesters = response.body()!!["semesters"] ?: emptyList()
                NetworkResult.Success(semesters)
            } else {
                NetworkResult.Error("Failed to load semesters", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getDepartments(): NetworkResult<List<Department>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getDepartments()
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["departments"] as? List<*> ?: emptyList<Any>()
                val depts = raw.map { gson.fromJson(gson.toJson(it), Department::class.java) }
                NetworkResult.Success(depts)
            } else {
                NetworkResult.Error("Failed to load departments", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getSubjects(): NetworkResult<List<Subject>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getSubjects()
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["subjects"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load subjects", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Teacher API ---
    suspend fun getTeacherSubjects(): NetworkResult<List<TeacherAssignedSubjectSummary>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTeacherSubjects()
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["subjects"] as? List<*> ?: emptyList<Any>()
                val list = raw.map { gson.fromJson(gson.toJson(it), TeacherAssignedSubjectSummary::class.java) }
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load teacher subjects", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getAttendanceRoster(subjectId: String, semesterId: String? = null): NetworkResult<List<Map<String, Any>>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAttendanceRoster(subjectId, semesterId)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["students"] as? List<Map<String, Any>> ?: emptyList()
                NetworkResult.Success(raw)
            } else {
                NetworkResult.Error("Failed to load roster", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createAttendanceSession(payload: Map<String, Any>): NetworkResult<AttendanceSession> = withContext(Dispatchers.IO) {
        try {
            val response = api.createAttendanceSession(payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["session"]
                val session = gson.fromJson(gson.toJson(raw), AttendanceSession::class.java)
                NetworkResult.Success(session)
            } else {
                NetworkResult.Error("Failed to save attendance session", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getTeacherAttendanceSessions(subjectId: String? = null): NetworkResult<List<AttendanceSession>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTeacherAttendanceSessions(subjectId)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["sessions"] ?: emptyList()
                NetworkResult.Success(raw)
            } else {
                NetworkResult.Error("Failed to load attendance history", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getTeacherAssignments(subjectId: String? = null): NetworkResult<List<Assignment>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTeacherAssignments(subjectId)
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["assignments"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load assignments", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createAssignment(payload: Map<String, Any>): NetworkResult<Assignment> = withContext(Dispatchers.IO) {
        try {
            val response = api.createAssignment(payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["assignment"]
                val assignment = gson.fromJson(gson.toJson(raw), Assignment::class.java)
                NetworkResult.Success(assignment)
            } else {
                NetworkResult.Error("Failed to create assignment", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getAssignmentRoster(assignmentId: String): NetworkResult<List<StudentSubmissionRosterItem>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAssignmentRoster(assignmentId)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["students"] as? List<*> ?: emptyList<Any>()
                val list = raw.map { gson.fromJson(gson.toJson(it), StudentSubmissionRosterItem::class.java) }
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load submissions", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateSubmissionStatus(assignmentId: String, studentId: String, status: String): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateSubmissionStatus(assignmentId, mapOf("studentId" to studentId, "status" to status))
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to update status", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getTeacherMarkSheets(subjectId: String? = null): NetworkResult<List<TestMarkSheet>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTeacherMarkSheets(subjectId)
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["sheets"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load mark sheets", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createMarkSheet(payload: Map<String, Any>): NetworkResult<TestMarkSheet> = withContext(Dispatchers.IO) {
        try {
            val response = api.createMarkSheet(payload)
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["sheet"]
                val sheet = gson.fromJson(gson.toJson(raw), TestMarkSheet::class.java)
                NetworkResult.Success(sheet)
            } else {
                NetworkResult.Error("Failed to create mark sheet", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getMarkSheetDetails(sheetId: String): NetworkResult<Pair<TestMarkSheet, List<StudentMarkRosterItem>>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getMarkSheetDetails(sheetId)
            if (response.isSuccessful && response.body() != null) {
                val rawSheet = response.body()!!["sheet"]
                val sheet = gson.fromJson(gson.toJson(rawSheet), TestMarkSheet::class.java)
                val rawStudents = response.body()!!["students"] as? List<*> ?: emptyList<Any>()
                val students = rawStudents.map { gson.fromJson(gson.toJson(it), StudentMarkRosterItem::class.java) }
                NetworkResult.Success(Pair(sheet, students))
            } else {
                NetworkResult.Error("Failed to load mark sheet details", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateMarks(sheetId: String, marks: List<Map<String, Any>>): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateMarks(sheetId, mapOf("studentMarks" to marks))
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to save marks", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun publishMarkSheet(sheetId: String, published: Boolean): NetworkResult<TestMarkSheet> = withContext(Dispatchers.IO) {
        try {
            val response = api.publishMarkSheet(sheetId, mapOf("published" to published))
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["sheet"]
                val sheet = gson.fromJson(gson.toJson(raw), TestMarkSheet::class.java)
                NetworkResult.Success(sheet)
            } else {
                NetworkResult.Error("Failed to update publish state", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Student (100% Read Only) ---
    suspend fun getStudentDashboard(): NetworkResult<StudentDashboardSummary> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentDashboard()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to load student dashboard", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getStudentAttendance(): NetworkResult<Map<String, Any>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentAttendance()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to load attendance", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getStudentAssignments(): NetworkResult<List<Assignment>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentAssignments()
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["assignments"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load coursework", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getStudentMarks(): NetworkResult<List<Map<String, Any>>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentMarks()
            if (response.isSuccessful && response.body() != null) {
                val raw = response.body()!!["testResults"] as? List<Map<String, Any>> ?: emptyList()
                NetworkResult.Success(raw)
            } else {
                NetworkResult.Error("Failed to load test marks", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getStudentNotices(): NetworkResult<List<Notice>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentNotices()
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["notices"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load circulars", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getStudentEvents(): NetworkResult<List<Event>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getStudentEvents()
            if (response.isSuccessful && response.body() != null) {
                val list = response.body()!!["events"] ?: emptyList()
                NetworkResult.Success(list)
            } else {
                NetworkResult.Error("Failed to load events", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    // --- Common Notifications & Settings ---
    suspend fun getNotifications(): NetworkResult<Pair<List<Notification>, Int>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getNotifications()
            if (response.isSuccessful && response.body() != null) {
                val rawList = response.body()!!["notifications"] as? List<*> ?: emptyList<Any>()
                val notifications = rawList.map { gson.fromJson(gson.toJson(it), Notification::class.java) }
                val unread = (response.body()!!["unreadCount"] as? Number)?.toInt() ?: 0
                NetworkResult.Success(Pair(notifications, unread))
            } else {
                NetworkResult.Error("Failed to load notifications", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun markNotificationRead(id: String): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.markNotificationRead(id)
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to mark read", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun markAllNotificationsRead(): NetworkResult<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api.markAllNotificationsRead()
            if (response.isSuccessful) NetworkResult.Success(true)
            else NetworkResult.Error("Failed to mark all read", response.code())
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getCampusSettings(): NetworkResult<CampusSettings> = withContext(Dispatchers.IO) {
        try {
            val response = api.getCampusSettings()
            if (response.isSuccessful && response.body() != null) {
                val settings = response.body()!!["settings"] ?: CampusSettings()
                NetworkResult.Success(settings)
            } else {
                NetworkResult.Error("Failed to load campus settings", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getSystemStatus(): NetworkResult<SystemStatusInfo> = withContext(Dispatchers.IO) {
        try {
            val response = api.getSystemStatus()
            if (response.isSuccessful && response.body() != null) {
                val status = response.body()!!["status"] ?: SystemStatusInfo()
                NetworkResult.Success(status)
            } else {
                NetworkResult.Error("Failed to load system status", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun getAuditLogs(): NetworkResult<List<AuditLog>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getAuditLogs()
            if (response.isSuccessful && response.body() != null) {
                val logs = response.body()!!["logs"] ?: emptyList()
                NetworkResult.Success(logs)
            } else {
                NetworkResult.Error("Failed to load audit logs", response.code())
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}
