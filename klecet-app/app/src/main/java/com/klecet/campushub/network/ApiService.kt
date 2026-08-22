package com.klecet.campushub.network

import com.klecet.campushub.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // --- Authentication ---
    @POST("api/auth/login")
    suspend fun login(@Body credentials: Map<String, String>): Response<AuthResponse>

    @GET("api/me")
    suspend fun getMe(): Response<AuthResponse>

    @GET("api/auth/personas")
    suspend fun getPersonas(): Response<PersonasResponse>

    // --- Admin: Faculty Master ---
    @GET("api/admin/teachers")
    suspend fun getTeachers(): Response<Map<String, Any>>

    @POST("api/admin/teachers")
    suspend fun createTeacher(@Body payload: Map<String, String>): Response<Map<String, Any>>

    @PUT("api/admin/teachers/{id}")
    suspend fun updateTeacher(@Path("id") id: String, @Body payload: Map<String, String>): Response<Map<String, Any>>

    @DELETE("api/admin/teachers/{id}")
    suspend fun deleteTeacher(@Path("id") id: String): Response<GenericSuccessResponse>

    @POST("api/admin/teachers/{id}/assign-subject")
    suspend fun assignTeacherSubject(@Path("id") id: String, @Body payload: Map<String, String>): Response<Map<String, Any>>

    @DELETE("api/admin/teachers/{id}/assign-subject/{subjectId}")
    suspend fun unassignTeacherSubject(@Path("id") id: String, @Path("subjectId") subjectId: String): Response<GenericSuccessResponse>

    @POST("api/admin/teachers/auto-assign")
    suspend fun autoAssignTeachers(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @POST("api/admin/teachers/import/validate")
    suspend fun validateTeacherImport(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @POST("api/admin/teachers/import/commit")
    suspend fun commitTeacherImport(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    // --- Admin: Students Master ---
    @GET("api/admin/students")
    suspend fun getStudents(): Response<Map<String, Any>>

    @POST("api/admin/students")
    suspend fun createStudent(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @PUT("api/admin/students/{id}")
    suspend fun updateStudent(@Path("id") id: String, @Body payload: Map<String, Any>): Response<Map<String, Any>>

    @DELETE("api/admin/students/{id}")
    suspend fun deleteStudent(@Path("id") id: String): Response<GenericSuccessResponse>

    @POST("api/admin/students/import/validate")
    suspend fun validateStudentImport(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @POST("api/admin/students/import/commit")
    suspend fun commitStudentImport(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    // --- Admin: Subjects ---
    @GET("api/admin/subjects")
    suspend fun getSubjects(): Response<Map<String, List<Subject>>>

    // --- Admin: Timetable AI ---
    @POST("api/admin/timetable/upload")
    suspend fun uploadTimetable(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @GET("api/admin/timetable/{id}/review")
    suspend fun getTimetableReview(@Path("id") id: String): Response<Map<String, Any>>

    @POST("api/admin/timetable/{id}/confirm")
    suspend fun confirmTimetable(@Path("id") id: String, @Body payload: Map<String, Any>): Response<Map<String, Any>>

    // --- Admin: Semesters ---
    @GET("api/admin/semesters")
    suspend fun getSemesters(): Response<Map<String, List<Semester>>>

    @POST("api/admin/semesters")
    suspend fun createSemester(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @DELETE("api/admin/semesters/{id}")
    suspend fun deleteSemester(@Path("id") id: String): Response<GenericSuccessResponse>

    @POST("api/admin/semesters/activate")
    suspend fun activateSemester(@Body payload: Map<String, String>): Response<Map<String, Any>>

    @POST("api/admin/semesters/{id}/complete-and-promote")
    suspend fun completeAndPromoteSemester(@Path("id") id: String, @Body payload: Map<String, Any>): Response<Map<String, Any>>

    // --- Admin: Academic Departments ---
    @GET("api/departments")
    suspend fun getDepartments(): Response<Map<String, Any>>

    @POST("api/admin/departments")
    suspend fun createDepartment(@Body payload: Map<String, String>): Response<Map<String, Any>>

    @PUT("api/admin/departments/{id}")
    suspend fun updateDepartment(@Path("id") id: String, @Body payload: Map<String, String>): Response<Map<String, Any>>

    @DELETE("api/admin/departments/{id}")
    suspend fun deleteDepartment(@Path("id") id: String): Response<Map<String, Any>>

    // --- Admin: Notices & Events ---
    @POST("api/admin/notices")
    suspend fun createNotice(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @POST("api/admin/events")
    suspend fun createEvent(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    // --- Admin: Reports & System ---
    @GET("api/admin/reports/attendance")
    suspend fun getAttendanceReport(@QueryMap params: Map<String, String>): Response<Map<String, Any>>

    @GET("api/admin/reports/assignments")
    suspend fun getAssignmentsReport(): Response<Map<String, Any>>

    @GET("api/admin/reports/marks")
    suspend fun getMarksReport(): Response<Map<String, Any>>

    @GET("api/admin/audit-logs")
    suspend fun getAuditLogs(): Response<Map<String, List<AuditLog>>>

    @GET("api/settings")
    suspend fun getCampusSettings(): Response<Map<String, CampusSettings>>

    @POST("api/admin/settings")
    suspend fun updateCampusSettings(@Body payload: Map<String, Any>): Response<Map<String, CampusSettings>>

    @POST("api/admin/semesters/switch-term")
    suspend fun switchSemesterTerm(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @GET("api/admin/system/status")
    suspend fun getSystemStatus(): Response<Map<String, SystemStatusInfo>>

    @POST("api/admin/load-demo")
    suspend fun loadSampleDataset(): Response<GenericSuccessResponse>

    @POST("api/admin/reset")
    suspend fun resetDatabase(): Response<GenericSuccessResponse>

    // --- Teacher Endpoints ---
    @GET("api/teacher/subjects")
    suspend fun getTeacherSubjects(): Response<Map<String, Any>>

    @GET("api/teacher/attendance/sessions")
    suspend fun getTeacherAttendanceSessions(@Query("subjectId") subjectId: String? = null): Response<Map<String, List<AttendanceSession>>>

    @GET("api/teacher/attendance/roster")
    suspend fun getAttendanceRoster(
        @Query("subjectId") subjectId: String,
        @Query("semesterId") semesterId: String? = null
    ): Response<Map<String, Any>>

    @POST("api/teacher/attendance/sessions")
    suspend fun createAttendanceSession(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @POST("api/teacher/attendance/sessions/{id}/submit")
    suspend fun submitAttendanceSession(@Path("id") id: String): Response<GenericSuccessResponse>

    @GET("api/teacher/attendance/analytics")
    suspend fun getTeacherAttendanceAnalytics(@QueryMap params: Map<String, String>): Response<Map<String, Any>>

    @GET("api/teacher/assignments")
    suspend fun getTeacherAssignments(@Query("subjectId") subjectId: String? = null): Response<Map<String, List<Assignment>>>

    @POST("api/teacher/assignments")
    suspend fun createAssignment(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @GET("api/teacher/assignments/{id}/roster")
    suspend fun getAssignmentRoster(@Path("id") id: String): Response<Map<String, Any>>

    @PATCH("api/teacher/assignments/{id}/submission-status")
    suspend fun updateSubmissionStatus(
        @Path("id") id: String,
        @Body payload: Map<String, String>
    ): Response<Map<String, Any>>

    @GET("api/teacher/marks/sheets")
    suspend fun getTeacherMarkSheets(@Query("subjectId") subjectId: String? = null): Response<Map<String, List<TestMarkSheet>>>

    @POST("api/teacher/marks/sheets")
    suspend fun createMarkSheet(@Body payload: Map<String, Any>): Response<Map<String, Any>>

    @GET("api/teacher/marks/sheets/{id}")
    suspend fun getMarkSheetDetails(@Path("id") id: String): Response<Map<String, Any>>

    @PATCH("api/teacher/marks/sheets/{id}/marks")
    suspend fun updateMarks(@Path("id") id: String, @Body payload: Map<String, Any>): Response<GenericSuccessResponse>

    @POST("api/teacher/marks/sheets/{id}/publish")
    suspend fun publishMarkSheet(@Path("id") id: String, @Body payload: Map<String, Boolean>): Response<Map<String, Any>>

    // --- Student Endpoints (100% Read-Only) ---
    @GET("api/student/dashboard")
    suspend fun getStudentDashboard(): Response<StudentDashboardSummary>

    @GET("api/student/attendance")
    suspend fun getStudentAttendance(): Response<Map<String, Any>>

    @GET("api/student/assignments")
    suspend fun getStudentAssignments(): Response<Map<String, List<Assignment>>>

    @GET("api/student/marks")
    suspend fun getStudentMarks(): Response<Map<String, Any>>

    @GET("api/student/profile")
    suspend fun getStudentProfile(): Response<Map<String, Student>>

    @GET("api/student/notices")
    suspend fun getStudentNotices(): Response<Map<String, List<Notice>>>

    @GET("api/student/events")
    suspend fun getStudentEvents(): Response<Map<String, List<Event>>>

    // --- Common Notifications ---
    @GET("api/notifications")
    suspend fun getNotifications(): Response<Map<String, Any>>

    @PATCH("api/notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): Response<GenericSuccessResponse>

    @POST("api/notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<GenericSuccessResponse>
}
