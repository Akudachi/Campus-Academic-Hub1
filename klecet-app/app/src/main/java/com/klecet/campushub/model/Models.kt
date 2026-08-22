package com.klecet.campushub.model

import com.google.gson.annotations.SerializedName

enum class UserRole {
    @SerializedName("admin")
    ADMIN,
    @SerializedName("teacher")
    TEACHER,
    @SerializedName("student")
    STUDENT;

    val value: String
        get() = name.lowercase()
}

enum class UserStatus {
    @SerializedName("active")
    ACTIVE,
    @SerializedName("disabled")
    DISABLED
}

enum class SemesterStatus {
    @SerializedName("setup")
    SETUP,
    @SerializedName("active")
    ACTIVE,
    @SerializedName("archived")
    ARCHIVED
}

enum class AttendanceStatus {
    @SerializedName("present")
    PRESENT,
    @SerializedName("absent")
    ABSENT
}

enum class SubmissionStatus {
    @SerializedName("submitted")
    SUBMITTED,
    @SerializedName("not_submitted")
    NOT_SUBMITTED
}

enum class NoticeAudienceType {
    @SerializedName("everyone")
    EVERYONE,
    @SerializedName("department")
    DEPARTMENT,
    @SerializedName("semester")
    SEMESTER
}

enum class NotificationType {
    @SerializedName("attendance")
    ATTENDANCE,
    @SerializedName("assignment")
    ASSIGNMENT,
    @SerializedName("marks")
    MARKS,
    @SerializedName("notice")
    NOTICE,
    @SerializedName("event")
    EVENT,
    @SerializedName("system")
    SYSTEM
}

data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val role: UserRole = UserRole.STUDENT,
    val status: UserStatus = UserStatus.ACTIVE,
    val avatar: String? = null,
    val phone: String? = null,
    val createdAt: String = ""
)

data class TeacherAssignedSubjectSummary(
    val assignmentId: String = "",
    val subjectId: String = "",
    val semesterId: String = "",
    val code: String = "",
    val name: String = "",
    val semesterNumber: Int = 0,
    val departmentCode: String = ""
)

data class Teacher(
    val id: String = "",
    val userId: String = "",
    val teacherCode: String = "",
    val department: String = "CSE",
    val designation: String? = null,
    val qualification: String? = null,
    val user: User? = null,
    val assignedSubjects: List<TeacherAssignedSubjectSummary> = emptyList(),
    val assignedSubjectsCount: Int = 0
)

data class Student(
    val id: String = "",
    val userId: String = "",
    val usn: String = "",
    val department: String = "CSE",
    val currentSemester: Int = 4,
    val section: String = "A",
    val user: User? = null
)

data class Department(
    val id: String = "",
    val name: String = "",
    val code: String = "",
    val description: String? = null,
    val headOfDepartment: String? = null,
    val establishedYear: String? = null,
    val createdAt: String? = null,
    val studentsCount: Int = 0,
    val teachersCount: Int = 0,
    val semestersCount: Int = 0,
    val subjectsCount: Int = 0
)

data class Semester(
    val id: String = "",
    val number: Int = 1,
    val academicYear: String = "2025-2026",
    val departmentCode: String = "CSE",
    val section: String = "A",
    val status: SemesterStatus = SemesterStatus.ACTIVE,
    val createdAt: String = "",
    val subjectsCount: Int = 0,
    val studentsCount: Int = 0,
    val teacherAssignmentsCount: Int = 0
)

data class Subject(
    val id: String = "",
    val name: String = "",
    val code: String = "",
    val departmentId: String = "",
    val semesterNumber: Int = 4,
    val credits: Int? = 4,
    val departmentCode: String? = null,
    val departmentName: String? = null
)

data class TeacherSubjectAssignment(
    val id: String = "",
    val teacherId: String = "",
    val subjectId: String = "",
    val semesterId: String = "",
    val createdFrom: String = "manual",
    val confirmedByAdmin: Boolean = true,
    val teacher: Teacher? = null,
    val subject: Subject? = null,
    val semester: Semester? = null
)

data class RecordsCount(
    val total: Int = 0,
    val present: Int = 0,
    val absent: Int = 0
)

data class AttendanceSession(
    val id: String = "",
    val subjectId: String = "",
    val teacherId: String = "",
    val semesterId: String = "",
    val date: String = "",
    val period: String? = null,
    val topic: String? = null,
    val createdAt: String = "",
    val submitted: Boolean = false,
    val subject: Subject? = null,
    val teacher: Teacher? = null,
    val recordsCount: RecordsCount? = null
)

data class AttendanceRecord(
    val id: String = "",
    val attendanceSessionId: String = "",
    val studentId: String = "",
    val status: AttendanceStatus = AttendanceStatus.PRESENT,
    val student: Student? = null
)

data class AssignmentStats(
    val totalStudents: Int = 0,
    val submittedCount: Int = 0,
    val notSubmittedCount: Int = 0
)

data class Assignment(
    val id: String = "",
    val subjectId: String = "",
    val teacherId: String = "",
    val semesterId: String = "",
    val title: String = "",
    val instructions: String = "",
    val dueDate: String = "",
    val createdAt: String = "",
    val pdfData: String? = null,
    val pdfFileName: String? = null,
    val subject: Subject? = null,
    val teacher: Teacher? = null,
    val stats: AssignmentStats? = null
)

data class StudentSubmissionRosterItem(
    val submissionId: String = "",
    val studentId: String = "",
    val usn: String = "",
    val name: String = "",
    val status: String = "not_submitted",
    val markedAt: String = ""
)

data class TestMarkSheetStats(
    val averageMarks: Double = 0.0,
    val highestMarks: Double = 0.0,
    val lowestMarks: Double = 0.0,
    val totalEvaluated: Int = 0
)

data class TestMarkSheet(
    val id: String = "",
    val subjectId: String = "",
    val teacherId: String = "",
    val semesterId: String = "",
    val testName: String = "CIE Test 1",
    val maxMarks: Double = 50.0,
    val published: Boolean = false,
    val createdAt: String = "",
    val updatedAt: String? = null,
    val subject: Subject? = null,
    val teacher: Teacher? = null,
    val stats: TestMarkSheetStats? = null
)

data class StudentMarkRosterItem(
    val studentId: String = "",
    val usn: String = "",
    val name: String = "",
    val marks: Double = 0.0,
    val hasEntry: Boolean = false
)

data class Notice(
    val id: String = "",
    val title: String = "",
    val body: String = "",
    val createdBy: String = "",
    val authorName: String? = null,
    val audienceType: NoticeAudienceType = NoticeAudienceType.EVERYONE,
    val audienceTargetId: String? = null,
    val priority: String? = "normal",
    val createdAt: String = ""
)

data class Event(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val date: String = "",
    val venue: String = "",
    val posterImageUrl: String? = null,
    val createdBy: String = "",
    val organizer: String? = null,
    val createdAt: String = ""
)

data class Notification(
    val id: String = "",
    val userId: String = "",
    val type: NotificationType = NotificationType.SYSTEM,
    val title: String = "",
    val message: String = "",
    val link: String? = null,
    val read: Boolean = false,
    val createdAt: String = ""
)

data class ExtractedTimetableRow(
    val id: String = "",
    val semester: Int = 4,
    val subjectName: String = "",
    val subjectCode: String = "",
    val teacherNameRaw: String = "",
    val teacherCode: String? = null,
    val matchedTeacherId: String? = null,
    val matchedTeacherName: String? = null,
    val confidence: Double = 1.0,
    val confirmed: Boolean = true,
    val departmentCode: String? = "CSE",
    val credits: Int? = 4,
    val isNewProfessor: Boolean? = false,
    val professorEmail: String? = null,
    val weeklyHours: Int? = 4
)

data class StudentImportRowResult(
    val rowNumber: Int = 0,
    val usn: String = "",
    val name: String = "",
    val email: String = "",
    val department: String = "CSE",
    val semester: Int = 4,
    val section: String = "A",
    val isValid: Boolean = true,
    val isExisting: Boolean = false,
    val errors: List<String> = emptyList()
)

data class TeacherImportRowResult(
    val rowNumber: Int = 0,
    val teacherCode: String = "",
    val name: String = "",
    val department: String = "CSE",
    val email: String = "",
    val designation: String = "Assistant Professor",
    val qualification: String = "M.Tech",
    val subjectCode: String? = null,
    val subjectName: String? = null,
    val isValid: Boolean = true,
    val isExisting: Boolean = false,
    val errors: List<String> = emptyList()
)

data class AuditLog(
    val id: String = "",
    val userId: String = "",
    val userName: String = "",
    val userRole: UserRole = UserRole.ADMIN,
    val action: String = "",
    val details: String = "",
    val timestamp: String = ""
)

data class StudentSubjectAttendanceSummary(
    val subjectId: String = "",
    val subjectName: String = "",
    val subjectCode: String = "",
    val teacherName: String = "",
    val totalClasses: Int = 0,
    val attendedClasses: Int = 0,
    val percentage: Double = 0.0,
    val status: String = "good"
)

data class LatestPublishedTest(
    val testName: String = "",
    val subjectName: String = "",
    val subjectCode: String = "",
    val marks: Double = 0.0,
    val maxMarks: Double = 50.0,
    val percentage: Double = 0.0
)

data class StudentDashboardSummary(
    val student: Student = Student(),
    val overallAttendancePercentage: Double = 0.0,
    val totalClasses: Int = 0,
    val attendedClasses: Int = 0,
    val pendingAssignmentsCount: Int = 0,
    val totalAssignmentsCount: Int = 0,
    val latestPublishedTest: LatestPublishedTest? = null,
    val unreadNoticesCount: Int = 0,
    val upcomingEventsCount: Int = 0,
    val subjectSummaries: List<StudentSubjectAttendanceSummary> = emptyList()
)

data class CampusSettings(
    val institutionName: String = "K.L.E. Society's KLE College of Engineering and Technology",
    val shortName: String = "KLECET",
    val campusCode: String = "KLECET-2026",
    val academicYear: String = "2025-2026",
    val currentSemesterTerm: String = "Even Semester (IV, VI, VIII)",
    val semesterTermType: String = "even",
    val minAttendanceWarning: Int = 75,
    val adminContactEmail: String = "admin@klecet.edu",
    val systemStatus: String = "operational"
)

data class DatabaseStats(
    val usersCount: Int = 0,
    val teachersCount: Int = 0,
    val studentsCount: Int = 0,
    val subjectsCount: Int = 0,
    val semestersCount: Int = 0,
    val attendanceSessionsCount: Int = 0,
    val assignmentsCount: Int = 0,
    val testMarkSheetsCount: Int = 0,
    val noticesCount: Int = 0,
    val eventsCount: Int = 0
)

data class SystemStatusInfo(
    val serverTime: String = "",
    val uptimeSeconds: Long = 0,
    val nodeVersion: String = "",
    val environment: String = "production",
    val geminiConfigured: Boolean = true,
    val databaseStats: DatabaseStats = DatabaseStats()
)

// Response Wrappers
data class AuthResponse(
    val token: String = "",
    val user: User = User(),
    val teacher: Teacher? = null,
    val student: Student? = null
)

data class PersonaItem(
    val user: User = User(),
    val teacher: Teacher? = null,
    val student: Student? = null,
    val displaySub: String = ""
)

data class PersonasResponse(
    val personas: List<PersonaItem> = emptyList()
)

data class GenericSuccessResponse(
    val success: Boolean = true,
    val message: String = ""
)
