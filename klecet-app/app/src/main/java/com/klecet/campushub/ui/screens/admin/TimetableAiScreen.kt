package com.klecet.campushub.ui.screens.admin

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.klecet.campushub.model.ExtractedTimetableRow
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableAiScreen(
    adminViewModel: AdminViewModel,
    onBack: () -> Unit
) {
    val extractedRows by adminViewModel.extractedRows.collectAsState()
    val isLoading by adminViewModel.isLoading.collectAsState()
    val toastMessage by adminViewModel.toastMessage.collectAsState()

    var department by remember { mutableStateOf("CSE") }
    var semester by remember { mutableStateOf("4") }
    var rawText by remember {
        mutableStateOf(
            """K.L.E. College of Engineering & Technology, Chikodi
Department of Computer Science & Engineering
CLASS TIME TABLE: IV SEMESTER (EVEN TERM 2025-2026)

Monday:
09:00 - 10:00: 21CS42 Design and Analysis of Algorithms - Dr. Ramesh Patil
10:00 - 11:00: 21CS43 Microcontrollers & Embedded Systems - Prof. Sunita Kulkarni
11:15 - 12:15: 21CS44 Operating Systems - Prof. Anand Deshpande
02:00 - 04:00: 21CSL46 DAA Laboratory - Dr. Ramesh Patil

Tuesday:
09:00 - 10:00: 21MAT41 Complex Analysis & Probability - Prof. Rajesh Joshi
10:00 - 11:00: 21CS42 Design and Analysis of Algorithms - Dr. Ramesh Patil
11:15 - 12:15: 21CS45 Advanced Java & Web Tech - Prof. Pooja Hegde"""
        )
    }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "AI Timetable Extraction",
                subtitle = "Gemini OCR & Professor Matching",
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Gemini AI Banner
            Surface(
                color = NavyDark,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(GoldAccent.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = GoldAccent,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Gemini Vision Timetable Parser",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = "Extracts course codes, teacher names, and automatically links faculty allocations.",
                            color = Color.White.copy(alpha = 0.75f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Configuration & Input Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Timetable Input & Target Term",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = department,
                            onValueChange = { department = it },
                            label = { Text("Department") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = semester,
                            onValueChange = { semester = it },
                            label = { Text("Semester") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Paste Raw Timetable / Schedule Text:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    OutlinedTextField(
                        value = rawText,
                        onValueChange = { rawText = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp),
                        shape = RoundedCornerShape(10.dp),
                        textStyle = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            adminViewModel.parseTimetable(
                                fileName = "timetable_sem$semester.txt",
                                rawText = rawText,
                                fileContent = null,
                                imageData = null,
                                imageMimeType = null,
                                semester = semester.toIntOrNull() ?: 4,
                                departmentCode = department
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyDark),
                        enabled = !isLoading && rawText.isNotBlank()
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Default.Psychology, contentDescription = null, modifier = Modifier.size(18.dp), tint = GoldAccent)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Extract with Gemini AI", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Extraction Results
            if (extractedRows.isNotEmpty()) {
                SectionHeader(
                    title = "Extracted Subject Allocations (${extractedRows.size})",
                    subtitle = "Review and confirm AI faculty assignments"
                )

                extractedRows.forEachIndexed { index, row ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${row.subjectCode} - ${row.subjectName}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = TextMain
                                )
                                StatusPill(
                                    text = "${(row.confidence * 100).toInt()}% Match",
                                    type = if (row.confidence >= 0.8) "success" else "warning"
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Professor: ${row.matchedTeacherName ?: row.teacherNameRaw}",
                                    fontSize = 12.sp,
                                    color = BluePrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "${row.credits ?: 4} Credits • ${row.weeklyHours ?: 4} hrs/wk",
                                    fontSize = 11.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        adminViewModel.confirmTimetableRows("upload_${System.currentTimeMillis()}") {
                            // confirmed
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Confirm & Apply Allocations to Database", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
