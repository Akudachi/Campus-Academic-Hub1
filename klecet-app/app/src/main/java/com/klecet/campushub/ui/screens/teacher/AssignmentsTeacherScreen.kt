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
import com.klecet.campushub.model.Assignment
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.TeacherViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssignmentsTeacherScreen(
    teacherViewModel: TeacherViewModel,
    onBack: () -> Unit
) {
    val assignments by teacherViewModel.assignments.collectAsState()
    val submissionRoster by teacherViewModel.submissionRoster.collectAsState()
    val selectedSubject by teacherViewModel.selectedSubject.collectAsState()
    val isLoading by teacherViewModel.isLoading.collectAsState()

    var isCreateAssignmentDialogOpen by remember { mutableStateOf(false) }
    var selectedAssignmentForRoster by remember { mutableStateOf<Assignment?>(null) }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Assignments & Coursework",
                subtitle = "${selectedSubject?.code ?: "CSE"} • ${assignments.size} Posted Tasks",
                role = UserRole.TEACHER,
                onBackClick = onBack
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isCreateAssignmentDialogOpen = true },
                containerColor = NavyDark,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Assignment")
            }
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
                title = "Coursework Tasks (${assignments.size})",
                subtitle = "Manage student problem sets and submissions"
            )

            if (assignments.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No assignments posted yet. Tap + to publish your first assignment.", color = TextMuted)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(assignments, key = { it.id }) { assignment ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedAssignmentForRoster = assignment
                                    teacherViewModel.loadAssignmentRoster(assignment.id)
                                },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = assignment.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = TextMain
                                    )
                                    StatusPill(
                                        text = "Due: ${assignment.dueDate}",
                                        type = "warning"
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = assignment.instructions,
                                    fontSize = 12.sp,
                                    color = TextMuted,
                                    maxLines = 2
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    if (assignment.pdfFileName != null) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Outlined.PictureAsPdf, contentDescription = null, tint = RoseDanger, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(assignment.pdfFileName, fontSize = 11.sp, color = TextMuted)
                                        }
                                    } else {
                                        Text("No attachment", fontSize = 11.sp, color = TextSubtle)
                                    }

                                    Text(
                                        text = "Tap to Review Submissions →",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BluePrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Create Assignment Dialog
    if (isCreateAssignmentDialogOpen) {
        var title by remember { mutableStateOf("") }
        var instructions by remember { mutableStateOf("") }
        var dueDate by remember { mutableStateOf("2026-04-10") }
        var pdfFileName by remember { mutableStateOf("Assignment_Problem_Set.pdf") }

        AlertDialog(
            onDismissRequest = { isCreateAssignmentDialogOpen = false },
            title = { Text("Publish New Assignment", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Assignment Title") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = dueDate,
                        onValueChange = { dueDate = it },
                        label = { Text("Due Date (YYYY-MM-DD)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = instructions,
                        onValueChange = { instructions = it },
                        label = { Text("Instructions & Questions") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(90.dp)
                    )
                    OutlinedTextField(
                        value = pdfFileName,
                        onValueChange = { pdfFileName = it },
                        label = { Text("Attachment Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank() && selectedSubject != null) {
                            teacherViewModel.createAssignment(
                                subjectId = selectedSubject!!.subjectId,
                                semesterId = selectedSubject!!.semesterId,
                                title = title,
                                instructions = instructions,
                                dueDate = dueDate,
                                pdfData = "sample_pdf_base64_data",
                                pdfFileName = pdfFileName
                            ) {
                                isCreateAssignmentDialogOpen = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                ) {
                    Text("Publish to Students")
                }
            },
            dismissButton = {
                TextButton(onClick = { isCreateAssignmentDialogOpen = false }) { Text("Cancel") }
            }
        )
    }

    // Submissions Roster Modal Sheet
    if (selectedAssignmentForRoster != null) {
        ModalBottomSheet(
            onDismissRequest = { selectedAssignmentForRoster = null },
            containerColor = SurfaceWhite,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp)
            ) {
                Text(
                    text = selectedAssignmentForRoster!!.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    text = "Tap student status to toggle submission status:",
                    fontSize = 12.sp,
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(14.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 380.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(submissionRoster) { sub ->
                        val isSubmitted = sub.status == "submitted"
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    teacherViewModel.toggleSubmissionStatus(
                                        selectedAssignmentForRoster!!.id,
                                        sub.studentId,
                                        sub.status
                                    )
                                },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = SlateBg),
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
                                    Text(sub.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(sub.usn, fontSize = 11.sp, color = TextMuted)
                                }

                                Surface(
                                    color = if (isSubmitted) EmeraldSuccess else RoseDanger,
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Text(
                                        text = if (isSubmitted) "SUBMITTED" else "NOT SUBMITTED",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
