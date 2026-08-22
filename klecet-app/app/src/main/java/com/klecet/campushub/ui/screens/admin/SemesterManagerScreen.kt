package com.klecet.campushub.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.Semester
import com.klecet.campushub.model.SemesterStatus
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel

@Composable
fun SemesterManagerScreen(
    adminViewModel: AdminViewModel,
    onBack: () -> Unit
) {
    val semesters by adminViewModel.semesters.collectAsState()
    val campusSettings by adminViewModel.campusSettings.collectAsState()

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Semester Terms & Progression",
                subtitle = "${campusSettings.academicYear} • ${campusSettings.currentSemesterTerm}",
                role = UserRole.ADMIN,
                onBackClick = onBack
            )
        },
        containerColor = SlateBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Surface(
                color = NavyDark,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Current Term Architecture",
                        color = GoldAccent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = campusSettings.currentSemesterTerm,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Students are enrolled in Even Semesters (IV, VI, VIII). Faculty allocations are active.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            SectionHeader(
                title = "Semesters Roster (${semesters.size})",
                subtitle = "Active & Configured Term Stages"
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(semesters) { sem ->
                    SemesterCard(semester = sem)
                }
            }
        }
    }
}

@Composable
fun SemesterCard(semester: Semester) {
    val isActive = semester.status == SemesterStatus.ACTIVE

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) SurfaceWhite else SlateBg
        ),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(if (isActive) BluePrimary else BorderSlate)
        )
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Semester ${semester.number}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = NavyDark
                )
                StatusPill(
                    text = semester.status.name,
                    type = if (isActive) "success" else "warning"
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "${semester.departmentCode} • Section ${semester.section}",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMain
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "${semester.subjectsCount} Subjects • ${semester.studentsCount} Students",
                fontSize = 11.sp,
                color = TextMuted
            )
        }
    }
}
