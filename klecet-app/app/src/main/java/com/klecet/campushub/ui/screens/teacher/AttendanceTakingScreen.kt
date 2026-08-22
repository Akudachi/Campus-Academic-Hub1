package com.klecet.campushub.ui.screens.teacher

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import com.klecet.campushub.viewmodel.TeacherViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceTakingScreen(
    teacherViewModel: TeacherViewModel,
    onBack: () -> Unit
) {
    val selectedSubject by teacherViewModel.selectedSubject.collectAsState()
    val roster by teacherViewModel.attendanceRoster.collectAsState()
    val isLoading by teacherViewModel.isLoading.collectAsState()

    val currentDate = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    var dateText by remember { mutableStateOf(currentDate) }
    var periodText by remember { mutableStateOf("Period 1 (09:00 - 10:00 AM)") }
    var topicText by remember { mutableStateOf("Asymptotic Notations & Master Theorem") }

    // Local Map of studentId -> AttendanceStatus ("present" / "absent")
    val attendanceMap = remember { mutableStateMapOf<String, String>() }

    // Populate default all present when roster loads
    LaunchedEffect(roster) {
        roster.forEach { studentMap ->
            val id = studentMap["id"]?.toString() ?: ""
            if (id.isNotBlank() && !attendanceMap.containsKey(id)) {
                attendanceMap[id] = "present"
            }
        }
    }

    val presentCount = attendanceMap.values.count { it == "present" }
    val absentCount = attendanceMap.values.count { it == "absent" }
    val totalStudents = roster.size

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Mark Class Attendance",
                subtitle = "${selectedSubject?.code ?: "CSE"} - ${selectedSubject?.name ?: "Subject"}",
                role = UserRole.TEACHER,
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
            // Class Details Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = dateText,
                            onValueChange = { dateText = it },
                            label = { Text("Date") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        )
                        OutlinedTextField(
                            value = periodText,
                            onValueChange = { periodText = it },
                            label = { Text("Session / Period") },
                            modifier = Modifier.weight(1.5f),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = topicText,
                        onValueChange = { topicText = it },
                        label = { Text("Topic Delivered Today") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Attendance Tally & Batch Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusPill(text = "$presentCount Present", type = "success")
                    Spacer(modifier = Modifier.width(6.dp))
                    StatusPill(text = "$absentCount Absent", type = "error")
                }

                Row {
                    TextButton(
                        onClick = {
                            roster.forEach { studentMap ->
                                val id = studentMap["id"]?.toString() ?: ""
                                if (id.isNotBlank()) attendanceMap[id] = "present"
                            }
                        }
                    ) {
                        Text("All Present", fontSize = 12.sp, color = EmeraldSuccess, fontWeight = FontWeight.Bold)
                    }

                    TextButton(
                        onClick = {
                            roster.forEach { studentMap ->
                                val id = studentMap["id"]?.toString() ?: ""
                                if (id.isNotBlank()) attendanceMap[id] = "absent"
                            }
                        }
                    ) {
                        Text("All Absent", fontSize = 12.sp, color = RoseDanger, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Student Attendance List
            if (roster.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No students in this class roster.", color = TextMuted)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(roster) { studentMap ->
                        val id = studentMap["id"]?.toString() ?: ""
                        val usn = studentMap["usn"]?.toString() ?: ""
                        val name = (studentMap["user"] as? Map<*, *>)?.get("name")?.toString()
                            ?: studentMap["name"]?.toString()
                            ?: "Student"
                        val status = attendanceMap[id] ?: "present"
                        val isPresent = status == "present"

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    attendanceMap[id] = if (isPresent) "absent" else "present"
                                },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isPresent) SurfaceWhite else RoseDanger.copy(alpha = 0.06f)
                            ),
                            border = CardDefaults.outlinedCardBorder().copy(
                                brush = androidx.compose.ui.graphics.SolidColor(if (isPresent) BorderSlate else RoseDanger.copy(alpha = 0.4f))
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(if (isPresent) EmeraldSuccess.copy(alpha = 0.15f) else RoseDanger.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = name.take(2).uppercase(),
                                            color = if (isPresent) EmeraldSuccess else RoseDanger,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(10.dp))

                                    Column {
                                        Text(text = name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextMain)
                                        Text(text = usn, fontSize = 11.sp, color = TextMuted)
                                    }
                                }

                                Surface(
                                    color = if (isPresent) EmeraldSuccess else RoseDanger,
                                    shape = RoundedCornerShape(20.dp),
                                    modifier = Modifier.clickable {
                                        attendanceMap[id] = if (isPresent) "absent" else "present"
                                    }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = if (isPresent) Icons.Default.Check else Icons.Default.Close,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = if (isPresent) "PRESENT" else "ABSENT",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Save Attendance Button
            Button(
                onClick = {
                    if (selectedSubject != null) {
                        val records = attendanceMap.map { (studentId, status) ->
                            mapOf("studentId" to studentId, "status" to status)
                        }
                        teacherViewModel.submitAttendance(
                            subjectId = selectedSubject!!.subjectId,
                            semesterId = selectedSubject!!.semesterId,
                            date = dateText,
                            period = periodText,
                            topic = topicText,
                            records = records
                        ) {
                            onBack()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NavyDark),
                enabled = !isLoading && selectedSubject != null && roster.isNotEmpty()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = GoldAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Lock & Submit Attendance", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
