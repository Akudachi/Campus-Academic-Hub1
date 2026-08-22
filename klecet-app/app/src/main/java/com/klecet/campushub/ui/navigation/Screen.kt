package com.klecet.campushub.ui.navigation

sealed class Screen(val route: String) {
    // Auth & Splash
    object Splash : Screen("splash")
    object Login : Screen("login")

    // Admin Screens
    object AdminOverview : Screen("admin_overview")
    object TeacherMaster : Screen("teacher_master")
    object StudentImport : Screen("student_import")
    object TimetableAi : Screen("timetable_ai")
    object SemesterManager : Screen("semester_manager")
    object DepartmentManager : Screen("department_manager")
    object NoticesEventsAdmin : Screen("notices_events_admin")
    object ReportsAdmin : Screen("reports_admin")
    object CampusSettings : Screen("campus_settings")

    // Teacher Screens
    object TeacherDashboard : Screen("teacher_dashboard")
    object AttendanceTaking : Screen("attendance_taking")
    object AssignmentsTeacher : Screen("assignments_teacher")
    object TestMarksTeacher : Screen("test_marks_teacher")

    // Student Screens
    object StudentDashboard : Screen("student_dashboard")
    object StudentAttendance : Screen("student_attendance")
    object StudentAssignments : Screen("student_assignments")
    object StudentMarks : Screen("student_marks")
    object StudentNoticesEvents : Screen("student_notices_events")
    object StudentProfile : Screen("student_profile")
}
