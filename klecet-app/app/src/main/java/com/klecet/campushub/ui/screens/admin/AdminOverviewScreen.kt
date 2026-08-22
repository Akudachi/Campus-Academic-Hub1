package com.klecet.campushub.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.navigation.Screen
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel

@Composable
fun AdminOverviewScreen(
    adminViewModel: AdminViewModel,
    authViewModel: AuthViewModel,
    notificationViewModel: NotificationViewModel,
    onNavigate: (String) -> Unit
) {
    val systemStatus by adminViewModel.systemStatus.collectAsState()
    val campusSettings by adminViewModel.campusSettings.collectAsState()
    val unreadNotifications by notificationViewModel.unreadCount.collectAsState()
    val notifications by notificationViewModel.notifications.collectAsState()
    val personas by authViewModel.personas.collectAsState()

    var isNotificationSheetOpen by remember { mutableStateOf(false) }
    var isPersonaSheetOpen by remember { mutableStateOf(false) }

    val stats = systemStatus?.databaseStats

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Admin Central Operations",
                subtitle = campusSettings.institutionName,
                role = UserRole.ADMIN,
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
            // Semester Banner
            Surface(
                color = NavyDark,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = campusSettings.academicYear,
                            color = GoldAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = campusSettings.currentSemesterTerm,
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    StatusPill(text = "LIVE SESSION", type = "success")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Metric Cards Grid
            SectionHeader(title = "Campus Operations Telemetry")

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Faculty",
                    value = (stats?.teachersCount ?: 0).toString(),
                    subtitle = "Active Teachers",
                    icon = Icons.Default.Person,
                    color = BluePrimary,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.TeacherMaster.route) }
                )
                MetricCard(
                    title = "Students",
                    value = (stats?.studentsCount ?: 0).toString(),
                    subtitle = "Enrolled",
                    icon = Icons.Default.School,
                    color = EmeraldSuccess,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.StudentImport.route) }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricCard(
                    title = "Semesters",
                    value = (stats?.semestersCount ?: 0).toString(),
                    subtitle = "Terms",
                    icon = Icons.Default.CalendarMonth,
                    color = GoldAccent,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.SemesterManager.route) }
                )
                MetricCard(
                    title = "Attendance",
                    value = (stats?.attendanceSessionsCount ?: 0).toString(),
                    subtitle = "Sessions Logged",
                    icon = Icons.Default.CheckCircle,
                    color = RoseDanger,
                    modifier = Modifier.weight(1f),
                    onClick = { onNavigate(Screen.ReportsAdmin.route) }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Quick Operations Grid
            SectionHeader(title = "Administrative Modules")

            val modules = listOf(
                AdminModuleItem("Faculty Master", "Manage professors & allocations", Icons.Default.People, BluePrimary, Screen.TeacherMaster.route),
                AdminModuleItem("Student Directory", "Roster & Bulk CSV Import", Icons.Default.School, EmeraldSuccess, Screen.StudentImport.route),
                AdminModuleItem("AI Timetable Extraction", "Gemini vision timetable parser", Icons.Default.AutoAwesome, GoldAccent, Screen.TimetableAi.route),
                AdminModuleItem("Semester Terms", "Term progression & promotion", Icons.Default.Layers, BlueAccent, Screen.SemesterManager.route),
                AdminModuleItem("Departments", "CSE, ECE, ME, CV, AIML", Icons.Default.Business, NavyDark, Screen.DepartmentManager.route),
                AdminModuleItem("Circulars & Events", "Publish notices across college", Icons.Default.Campaign, RoseDanger, Screen.NoticesEventsAdmin.route),
                AdminModuleItem("Analytics & Reports", "Audit logs & compliance", Icons.Default.BarChart, BluePrimary, Screen.ReportsAdmin.route),
                AdminModuleItem("Campus Settings", "Institution info & database", Icons.Default.Settings, TextMuted, Screen.CampusSettings.route)
            )

            modules.chunked(2).forEach { rowItems ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    rowItems.forEach { item ->
                        AdminModuleCard(
                            item = item,
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate(item.route) }
                        )
                    }
                    if (rowItems.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
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

data class AdminModuleItem(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val color: Color,
    val route: String
)

@Composable
fun AdminModuleCard(
    item: AdminModuleItem,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(item.color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = null,
                    tint = item.color,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMain
                )
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = item.description,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 11.sp,
                    color = TextMuted
                ),
                maxLines = 2
            )
        }
    }
}
