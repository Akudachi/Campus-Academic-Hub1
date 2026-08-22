package com.klecet.campushub.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.StudentViewModel

@Composable
fun StudentAttendanceScreen(
    studentViewModel: StudentViewModel,
    onBack: () -> Unit
) {
    val dashboardSummary by studentViewModel.dashboardSummary.collectAsState()
    val subjects = dashboardSummary?.subjectSummaries ?: emptyList()
    val overallPercentage = dashboardSummary?.overallAttendancePercentage ?: 85.0

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Subject Attendance Breakdown",
                subtitle = "Mandatory 75% VTU Threshold Compliance",
                role = UserRole.STUDENT,
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
            // Aggregate Summary Bar
            Card(
                modifier = Modifier.fillMaxWidth(),
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
                    Column {
                        Text("Cumulative Attendance", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("${dashboardSummary?.attendedClasses ?: 0} / ${dashboardSummary?.totalClasses ?: 0} Total Sessions Attended", fontSize = 12.sp, color = TextMuted)
                    }
                    Text(
                        text = "${overallPercentage.toInt()}%",
                        color = if (overallPercentage >= 75.0) EmeraldSuccess else RoseDanger,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 24.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            SectionHeader(
                title = "Individual Subject Breakdown (${subjects.size})",
                subtitle = "Real-time logged class statistics"
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(subjects) { subject ->
                    SubjectAttendanceItem(subject = subject)
                }
            }
        }
    }
}
