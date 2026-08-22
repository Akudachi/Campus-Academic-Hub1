package com.klecet.campushub.ui.screens.teacher

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import com.klecet.campushub.model.TeacherAssignedSubjectSummary
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.navigation.Screen
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel
import com.klecet.campushub.viewmodel.TeacherViewModel

@Composable
fun TeacherDashboardScreen(
    teacherViewModel: TeacherViewModel,
    authViewModel: AuthViewModel,
    notificationViewModel: NotificationViewModel,
    onNavigate: (String) -> Unit
) {
    val assignedSubjects by teacherViewModel.assignedSubjects.collectAsState()
    val selectedSubject by teacherViewModel.selectedSubject.collectAsState()
    val attendanceHistory by teacherViewModel.attendanceHistory.collectAsState()
    val assignments by teacherViewModel.assignments.collectAsState()
    val markSheets by teacherViewModel.markSheets.collectAsState()
    val currentUser by authViewModel.currentUser.collectAsState()
    val currentTeacher by authViewModel.currentTeacher.collectAsState()
    val unreadNotifications by notificationViewModel.unreadCount.collectAsState()
    val notifications by notificationViewModel.notifications.collectAsState()
    val personas by authViewModel.personas.collectAsState()

    var isNotificationSheetOpen by remember { mutableStateOf(false) }
    var isPersonaSheetOpen by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CampusHeader(
                title = currentUser?.name ?: "Faculty Portal",
                subtitle = "${currentTeacher?.teacherCode ?: "T001"} • ${currentTeacher?.department ?: "CSE"}",
                role = UserRole.TEACHER,
                unreadNotificationsCount = unreadNotifications,
                onNotificationsClick = { isNotificationSheetOpen = true },
                onPersonaPickerClick = { isPersonaSheetOpen = true }
            )
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
            // Subject Filter Chips
            Text(
                text = "Teaching Allocation Subjects",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = NavyDark)
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (assignedSubjects.isEmpty()) {
                Surface(
                    color = SurfaceWhite,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "No teaching subjects assigned yet. Admin will assign subjects via Timetable AI or Faculty Master.",
                        color = TextMuted,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(assignedSubjects) { subject ->
                        val isSelected = selectedSubject?.subjectId == subject.subjectId
                        Surface(
                            color = if (isSelected) NavyDark else SurfaceWhite,
                            shape = RoundedCornerShape(12.dp),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(if (isSelected) NavyDark else BorderSlate)),
                            modifier = Modifier.clickable { teacherViewModel.selectSubject(subject) }
                        ) {
                            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                                Text(
                                    text = subject.code,
                                    color = if (isSelected) GoldAccent else TextMuted,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = subject.name,
                                    color = if (isSelected) Color.White else TextMain,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Sem ${subject.semesterNumber} • ${subject.departmentCode}",
                                    color = if (isSelected) Color.White.copy(alpha = 0.7f) else TextMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Primary Faculty Actions (Take Attendance, Post Assignment, CIE Marks)
            SectionHeader(title = "Academic Actions")

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Daily Attendance",
                    value = "${attendanceHistory.size}",
                    subtitle = "Log Class Roster",
                    icon = Icons.Default.CheckCircle,
                    color = EmeraldSuccess,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.AttendanceTaking.route) }
                )
                MetricCard(
                    title = "Coursework",
                    value = "${assignments.size}",
                    subtitle = "Assignments Roster",
                    icon = Icons.Default.Assignment,
                    color = BluePrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.AssignmentsTeacher.route) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            MetricCard(
                title = "CIE Test Marks Sheets",
                value = "${markSheets.size}",
                subtitle = "Manage Test 1 / Test 2 Marks & Publishing",
                icon = Icons.Default.Grade,
                color = GoldAccent,
                onClick = { onNavigate(Screen.TestMarksTeacher.route) }
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Recent Attendance History
            SectionHeader(
                title = "Recent Attendance Sessions",
                subtitle = "Past logged classroom sessions"
            )

            if (attendanceHistory.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite)
                ) {
                    Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                        Text("No attendance sessions recorded yet.", color = TextMuted, fontSize = 13.sp)
                    }
                }
            } else {
                attendanceHistory.take(5).forEach { session ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = session.date,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = TextMain
                                )
                                Text(
                                    text = session.topic ?: "Classroom lecture",
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                            }
                            StatusPill(
                                text = "${session.recordsCount?.present ?: 0} Present / ${session.recordsCount?.total ?: 0}",
                                type = "success"
                            )
                        }
                    }
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
