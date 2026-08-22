package com.klecet.campushub.ui.screens.teacher

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.TestMarkSheet
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.TeacherViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TestMarksTeacherScreen(
    teacherViewModel: TeacherViewModel,
    onBack: () -> Unit
) {
    val markSheets by teacherViewModel.markSheets.collectAsState()
    val currentMarkSheet by teacherViewModel.currentMarkSheet.collectAsState()
    val studentMarkRoster by teacherViewModel.studentMarkRoster.collectAsState()
    val selectedSubject by teacherViewModel.selectedSubject.collectAsState()
    val isLoading by teacherViewModel.isLoading.collectAsState()

    var isCreateSheetDialogOpen by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "CIE Internal Marks Sheets",
                subtitle = "${selectedSubject?.code ?: "CSE"} • Internal Evaluations",
                role = UserRole.TEACHER,
                onBackClick = onBack
            )
        },
        floatingActionButton = {
            if (currentMarkSheet == null) {
                FloatingActionButton(
                    onClick = { isCreateSheetDialogOpen = true },
                    containerColor = NavyDark,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create CIE Test Sheet")
                }
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
            if (currentMarkSheet == null) {
                // List of Mark Sheets View
                SectionHeader(
                    title = "Continuous Internal Evaluation (CIE) Tests",
                    subtitle = "Select a test mark sheet to edit or publish"
                )

                if (markSheets.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No test mark sheets created yet. Tap + to generate one.", color = TextMuted)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(markSheets, key = { it.id }) { sheet ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { teacherViewModel.loadMarkSheetDetails(sheet.id) },
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
                                        Text(
                                            text = sheet.testName,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = NavyDark
                                        )
                                        StatusPill(
                                            text = if (sheet.published) "PUBLISHED" else "DRAFT",
                                            type = if (sheet.published) "success" else "warning"
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = "Max Marks: ${sheet.maxMarks.toInt()} • Average: ${String.format("%.1f", sheet.stats?.averageMarks ?: 0.0)}",
                                        fontSize = 12.sp,
                                        color = TextMuted
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Text(
                                        text = "Tap to Enter Student Scores →",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BluePrimary
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                // Active Mark Sheet Detail / Entry View
                val sheet = currentMarkSheet!!

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(sheet.testName, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = NavyDark)
                        Text("Max Marks: ${sheet.maxMarks.toInt()}", fontSize = 12.sp, color = TextMuted)
                    }

                    Button(
                        onClick = { teacherViewModel.togglePublishMarkSheet(sheet.id, sheet.published) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (sheet.published) AmberWarning else EmeraldSuccess
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (sheet.published) "Unpublish" else "Publish to Students",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Score Entry Table
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(studentMarkRoster) { item ->
                        var markInput by remember(item.marks) { mutableStateOf(if (item.marks > 0) item.marks.toString() else "") }

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
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
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextMain)
                                    Text(item.usn, fontSize = 11.sp, color = TextMuted)
                                }

                                OutlinedTextField(
                                    value = markInput,
                                    onValueChange = {
                                        markInput = it
                                        val num = it.toDoubleOrNull() ?: 0.0
                                        teacherViewModel.updateStudentMark(item.studentId, num)
                                    },
                                    label = { Text("/ ${sheet.maxMarks.toInt()}", fontSize = 10.sp) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.width(90.dp),
                                    shape = RoundedCornerShape(8.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { teacherViewModel.loadMarkSheets(selectedSubject?.subjectId) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Back to Sheets")
                    }

                    Button(
                        onClick = {
                            teacherViewModel.saveMarks(sheet.id) {
                                // saved
                            }
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                    ) {
                        Text("Save All Marks")
                    }
                }
            }
        }
    }

    // Create Mark Sheet Dialog
    if (isCreateSheetDialogOpen) {
        var testName by remember { mutableStateOf("CIE Test 1") }
        var maxMarks by remember { mutableStateOf("50") }

        AlertDialog(
            onDismissRequest = { isCreateSheetDialogOpen = false },
            title = { Text("Generate CIE Mark Sheet") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = testName,
                        onValueChange = { testName = it },
                        label = { Text("Evaluation Name (e.g. CIE Test 1)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = maxMarks,
                        onValueChange = { maxMarks = it },
                        label = { Text("Maximum Marks (e.g. 50 or 25)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (selectedSubject != null && testName.isNotBlank()) {
                            teacherViewModel.createMarkSheet(
                                subjectId = selectedSubject!!.subjectId,
                                semesterId = selectedSubject!!.semesterId,
                                testName = testName,
                                maxMarks = maxMarks.toDoubleOrNull() ?: 50.0,
                                published = false
                            ) {
                                isCreateSheetDialogOpen = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                ) {
                    Text("Create Sheet")
                }
            },
            dismissButton = {
                TextButton(onClick = { isCreateSheetDialogOpen = false }) { Text("Cancel") }
            }
        )
    }
}
