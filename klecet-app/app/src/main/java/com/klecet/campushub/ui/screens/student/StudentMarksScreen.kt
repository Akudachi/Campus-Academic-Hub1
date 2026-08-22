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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.StudentViewModel

@Composable
fun StudentMarksScreen(
    studentViewModel: StudentViewModel,
    onBack: () -> Unit
) {
    val marksList by studentViewModel.testMarks.collectAsState()

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Continuous Internal Evaluation",
                subtitle = "Published Test Marks & Analytics",
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
            SectionHeader(
                title = "Published CIE Test Reports",
                subtitle = "Internal assessment scores confirmed by faculty"
            )

            if (marksList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No CIE test marks published yet for this semester.", color = TextMuted)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(marksList) { item ->
                        val testName = item["testName"]?.toString() ?: "CIE Test 1"
                        val subjectName = item["subjectName"]?.toString() ?: "Algorithms"
                        val subjectCode = item["subjectCode"]?.toString() ?: "21CS42"
                        val marks = (item["marks"] as? Number)?.toDouble() ?: 0.0
                        val maxMarks = (item["maxMarks"] as? Number)?.toDouble() ?: 50.0
                        val percentage = if (maxMarks > 0) (marks / maxMarks) * 100 else 0.0

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(testName, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = NavyDark)
                                        Text("$subjectCode - $subjectName", fontSize = 12.sp, color = TextMuted)
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = "${marks.toInt()} / ${maxMarks.toInt()}",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 20.sp,
                                            color = TextMain
                                        )
                                        StatusPill(
                                            text = "${percentage.toInt()}%",
                                            type = if (percentage >= 70) "success" else "warning"
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                LinearProgressIndicator(
                                    progress = (percentage / 100f).toFloat().coerceIn(0f, 1f),
                                    color = if (percentage >= 70) EmeraldSuccess else GoldAccent,
                                    trackColor = SlateBg,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
