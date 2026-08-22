package com.klecet.campushub.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.screens.admin.*
import com.klecet.campushub.ui.screens.auth.LoginScreen
import com.klecet.campushub.ui.screens.auth.SplashScreen
import com.klecet.campushub.ui.screens.student.*
import com.klecet.campushub.ui.screens.teacher.*
import com.klecet.campushub.viewmodel.AdminViewModel
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel
import com.klecet.campushub.viewmodel.StudentViewModel
import com.klecet.campushub.viewmodel.TeacherViewModel

@Composable
fun CampusNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    adminViewModel: AdminViewModel,
    teacherViewModel: TeacherViewModel,
    studentViewModel: StudentViewModel,
    notificationViewModel: NotificationViewModel
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        // --- Splash & Auth ---
        composable(Screen.Splash.route) {
            SplashScreen(
                onTimeout = {
                    if (authViewModel.isLoggedIn.value) {
                        when (authViewModel.currentRole.value) {
                            UserRole.ADMIN -> navController.navigate(Screen.AdminOverview.route) { popUpTo(0) }
                            UserRole.TEACHER -> navController.navigate(Screen.TeacherDashboard.route) { popUpTo(0) }
                            UserRole.STUDENT -> navController.navigate(Screen.StudentDashboard.route) { popUpTo(0) }
                        }
                    } else {
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = { role ->
                    when (role) {
                        UserRole.ADMIN -> navController.navigate(Screen.AdminOverview.route) { popUpTo(0) }
                        UserRole.TEACHER -> navController.navigate(Screen.TeacherDashboard.route) { popUpTo(0) }
                        UserRole.STUDENT -> navController.navigate(Screen.StudentDashboard.route) { popUpTo(0) }
                    }
                }
            )
        }

        // --- Admin Destinations ---
        composable(Screen.AdminOverview.route) {
            AdminOverviewScreen(
                adminViewModel = adminViewModel,
                authViewModel = authViewModel,
                notificationViewModel = notificationViewModel,
                onNavigate = { route -> navController.navigate(route) }
            )
        }

        composable(Screen.TeacherMaster.route) {
            TeacherMasterScreen(
                adminViewModel = adminViewModel,
                authViewModel = authViewModel,
                notificationViewModel = notificationViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentImport.route) {
            StudentImportScreen(
                adminViewModel = adminViewModel,
                authViewModel = authViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.TimetableAi.route) {
            TimetableAiScreen(
                adminViewModel = adminViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.SemesterManager.route) {
            SemesterManagerScreen(
                adminViewModel = adminViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.DepartmentManager.route) {
            DepartmentManagerScreen(
                adminViewModel = adminViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.NoticesEventsAdmin.route) {
            NoticesEventsAdminScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.ReportsAdmin.route) {
            ReportsAdminScreen(
                adminViewModel = adminViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CampusSettings.route) {
            CampusSettingsScreen(
                adminViewModel = adminViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        // --- Teacher Destinations ---
        composable(Screen.TeacherDashboard.route) {
            TeacherDashboardScreen(
                teacherViewModel = teacherViewModel,
                authViewModel = authViewModel,
                notificationViewModel = notificationViewModel,
                onNavigate = { route -> navController.navigate(route) }
            )
        }

        composable(Screen.AttendanceTaking.route) {
            AttendanceTakingScreen(
                teacherViewModel = teacherViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.AssignmentsTeacher.route) {
            AssignmentsTeacherScreen(
                teacherViewModel = teacherViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.TestMarksTeacher.route) {
            TestMarksTeacherScreen(
                teacherViewModel = teacherViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        // --- Student Destinations ---
        composable(Screen.StudentDashboard.route) {
            StudentDashboardScreen(
                studentViewModel = studentViewModel,
                authViewModel = authViewModel,
                notificationViewModel = notificationViewModel,
                onNavigate = { route -> navController.navigate(route) }
            )
        }

        composable(Screen.StudentAttendance.route) {
            StudentAttendanceScreen(
                studentViewModel = studentViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentAssignments.route) {
            StudentAssignmentsScreen(
                studentViewModel = studentViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentMarks.route) {
            StudentMarksScreen(
                studentViewModel = studentViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentNoticesEvents.route) {
            StudentNoticesEventsScreen(
                studentViewModel = studentViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.StudentProfile.route) {
            StudentProfileScreen(
                authViewModel = authViewModel,
                onLogout = { navController.navigate(Screen.Login.route) { popUpTo(0) } },
                onBack = { navController.popBackStack() }
            )
        }
    }
}
