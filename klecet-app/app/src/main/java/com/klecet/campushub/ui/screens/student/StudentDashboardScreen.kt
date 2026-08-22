package com.klecet.campushub.ui.screens.student

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.StudentSubjectAttendanceSummary
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.navigation.Screen
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel
import com.klecet.campushub.viewmodel.StudentViewModel

@Composable
fun StudentDashboardScreen(
    studentViewModel: StudentViewModel,
    authViewModel: AuthViewModel,
    notificationViewModel: NotificationViewModel,
    onNavigate: (String) -> Unit
) {
    val dashboardSummary by studentViewModel.dashboardSummary.collectAsState()
    val currentUser by authViewModel.currentUser.collectAsState()
    val currentStudent by authViewModel.currentStudent.collectAsState()
    val unreadNotifications by notificationViewModel.unreadCount.collectAsState()
    val notifications by notificationViewModel.notifications.collectAsState()
    val personas by authViewModel.personas.collectAsState()

    var isNotificationSheetOpen by remember { mutableStateOf(false) }
    var isPersonaSheetOpen by remember { mutableStateOf(false) }

    val overallPercentage = dashboardSummary?.overallAttendancePercentage ?: 85.0
    val isAttendanceGood = overallPercentage >= 75.0

    Scaffold(
        topBar = {
            CampusHeader(
                title = currentUser?.name ?: "Student Portal",
                subtitle = "${currentStudent?.usn ?: "2KL23CS001"} • Sem ${currentStudent?.currentSemester ?: 4} (${currentStudent?.department ?: "CSE"})",
                role = UserRole.STUDENT,
                unreadNotificationsCount = unreadNotifications,
                onNotificationsClick = { isNotificationSheetOpen = true },
                onPersonaPickerClick = { isPersonaSheetOpen = true }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceWhite,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigate(Screen.StudentAttendance.route) },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Attendance") },
                    label = { Text("Attendance", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigate(Screen.StudentAssignments.route) },
                    icon = { Icon(Icons.Default.Assignment, contentDescription = "Tasks") },
                    label = { Text("Tasks", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigate(Screen.StudentMarks.route) },
                    icon = { Icon(Icons.Default.Grade, contentDescription = "CIE") },
                    label = { Text("Marks", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigate(Screen.StudentProfile.route) },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp) }
                )
            }
        },
        containerColor = SlateBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Overall Attendance Highlight Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate(Screen.StudentAttendance.route) },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = NavyDark),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "OVERALL ATTENDANCE",
                            color = GoldAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${overallPercentage.toInt()}%",
                            color = Color.White,
                            fontSize = 34.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${dashboardSummary?.attendedClasses ?: 34} Attended / ${dashboardSummary?.totalClasses ?: 40} Held",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        StatusPill(
                            text = if (isAttendanceGood) "ELIGIBLE FOR EXAMS (>75%)" else "ATTENDANCE SHORTAGE (<75%)",
                            type = if (isAttendanceGood) "success" else "error"
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(if (isAttendanceGood) EmeraldSuccess.copy(alpha = 0.2f) else RoseDanger.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isAttendanceGood) Icons.Default.Verified else Icons.Default.Warning,
                            contentDescription = null,
                            tint = if (isAttendanceGood) EmeraldSuccess else RoseDanger,
                            modifier = Modifier.size(34.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quick Metrics Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Pending Coursework",
                    value = "${dashboardSummary?.pendingAssignmentsCount ?: 1}",
                    subtitle = "Assignments Due",
                    icon = Icons.Default.AssignmentLate,
                    color = RoseDanger,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.StudentAssignments.route) }
                )
                MetricCard(
                    title = "Latest CIE Score",
                    value = "${dashboardSummary?.latestPublishedTest?.marks?.toInt() ?: 44}/50",
                    subtitle = dashboardSummary?.latestPublishedTest?.subjectCode ?: "21CS42",
                    icon = Icons.Default.EmojiEvents,
                    color = EmeraldSuccess,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.StudentMarks.route) }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Subject Attendance Breakdown
            SectionHeader(
                title = "Subject Attendance Tracking",
                subtitle = "Even Semester IV Subjects",
                actionText = "View All",
                onActionClick = { onNavigate(Screen.StudentAttendance.route) }
            )

            val subjects = dashboardSummary?.subjectSummaries ?: emptyList()
            if (subjects.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite)
                ) {
                    Box(modifier = Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                        Text("No subjects registered yet.", color = TextMuted)
                    }
                }
            } else {
                subjects.forEach { sub ->
                    SubjectAttendanceItem(subject = sub)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Circulars & Events Action
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate(Screen.StudentNoticesEvents.route) },
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(GoldAccent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Campaign, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(24.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Official College Notices & Events", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Stay updated on timetables, CIEs and fest", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    NotificationDrawerSheet(
        isOpen = isNotificationSheetOpen,
        notifications = notifications,
        onClose = { isNotificationSheetOpen = false },
        onMarkRead = { notificationViewModel.markAsRead(it) },
        onMarkAllRead = { notificationViewModel.markAllAsRead() }
    )

    PersonaPickerSheet(
        isOpen = isPersonaSheetOpen,
        personas = personas,
        onClose = { isPersonaSheetOpen = false },
        onSelectPersona = { persona ->
            authViewModel.loginWithPersona(persona)
        }
    )
}

@Composable
fun SubjectAttendanceItem(subject: StudentSubjectAttendanceSummary) {
    val isGood = subject.percentage >= 75.0

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${subject.subjectCode} - ${subject.subjectName}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TextMain
                    )
                    Text(
                        text = "Prof: ${subject.teacherName}",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }

                StatusPill(
                    text = "${subject.percentage.toInt()}%",
                    type = if (isGood) "success" else "error"
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = (subject.percentage / 100f).toFloat().coerceIn(0f, 1f),
                color = if (isGood) EmeraldSuccess else RoseDanger,
                trackColor = SlateBg,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp))
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "${subject.attendedClasses} attended out of ${subject.totalClasses} classes",
                fontSize = 11.sp,
                color = TextMuted
            )
        }
    }
}
