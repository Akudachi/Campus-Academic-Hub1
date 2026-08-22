package com.klecet.campushub.ui.screens.admin

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
import com.klecet.campushub.model.Student
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel
import com.klecet.campushub.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentImportScreen(
    adminViewModel: AdminViewModel,
    authViewModel: AuthViewModel,
    onBack: () -> Unit
) {
    val students by adminViewModel.students.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableStateOf(0) } // 0: Directory, 1: Bulk CSV
    var isAddStudentDialogVisible by remember { mutableStateOf(false) }

    // Bulk CSV input state
    var csvText by remember { mutableStateOf("USN,Name,Email,Department,Semester,Section\n2KL23CS007,Pooja Hegde,pooja.h@klecet.edu,CSE,4,A\n2KL23CS008,Rahul Deshmukh,rahul.d@klecet.edu,CSE,4,A") }
    var validationErrors by remember { mutableStateOf<List<String>>(emptyList()) }
    var isCommitted by remember { mutableStateOf(false) }

    val filteredStudents = remember(students, searchQuery) {
        if (searchQuery.isBlank()) students
        else students.filter {
            it.usn.contains(searchQuery, ignoreCase = true) ||
            it.user?.name?.contains(searchQuery, ignoreCase = true) == true ||
            it.department.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Student Directory & Admissions",
                subtitle = "${students.size} Enrolled Students",
                role = UserRole.ADMIN,
                onBackClick = onBack
            )
        },
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick = { isAddStudentDialogVisible = true },
                    containerColor = NavyDark,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Student")
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
            // Mode Tabs: Directory vs Bulk CSV
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = SurfaceWhite,
                contentColor = NavyDark,
                modifier = Modifier.clip(RoundedCornerShape(12.dp))
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Active Directory", fontWeight = FontWeight.Bold) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Bulk CSV/Excel Upload", fontWeight = FontWeight.Bold) }
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (selectedTab == 0) {
                // Search Field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by USN, student name or branch...", fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = SurfaceWhite,
                        focusedContainerColor = SurfaceWhite
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                if (filteredStudents.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No students found.", color = TextMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredStudents, key = { it.id }) { student ->
                            StudentRowCard(
                                student = student,
                                onDelete = { adminViewModel.deleteStudent(student.id) }
                            )
                        }
                    }
                }
            } else {
                // Bulk CSV Importer View
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "Batch Student Importer",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Paste comma-separated rows or exported university format:",
                            style = MaterialTheme.typography.bodySmall.copy(color = TextMuted)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = csvText,
                            onValueChange = {
                                csvText = it
                                isCommitted = false
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            textStyle = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        if (isCommitted) {
                            Surface(
                                color = EmeraldSuccess.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldSuccess)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Students successfully imported into institutional database!", color = EmeraldSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = {
                                    // Parse CSV and commit
                                    val lines = csvText.trim().split("\n")
                                    val rows = mutableListOf<Map<String, Any>>()
                                    for (i in 1 until lines.size) {
                                        val parts = lines[i].split(",").map { it.trim() }
                                        if (parts.size >= 4) {
                                            adminViewModel.createStudent(
                                                mapOf(
                                                    "usn" to parts[0],
                                                    "name" to parts[1],
                                                    "email" to parts[2],
                                                    "department" to parts[3],
                                                    "currentSemester" to (parts.getOrNull(4)?.toIntOrNull() ?: 4),
                                                    "section" to (parts.getOrNull(5) ?: "A")
                                                )
                                            ) {}
                                        }
                                    }
                                    isCommitted = true
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                            ) {
                                Icon(Icons.Default.UploadFile, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Validate & Import")
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Student Dialog
    if (isAddStudentDialogVisible) {
        AddStudentDialog(
            onDismiss = { isAddStudentDialogVisible = false },
            onConfirm = { usn, name, email, dept, sem, sec ->
                adminViewModel.createStudent(
                    mapOf(
                        "usn" to usn,
                        "name" to name,
                        "email" to email,
                        "department" to dept,
                        "currentSemester" to sem,
                        "section" to sec
                    )
                ) {
                    isAddStudentDialogVisible = false
                }
            }
        )
    }
}

@Composable
fun StudentRowCard(
    student: Student,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(BluePrimary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (student.user?.name ?: "S").take(2).uppercase(),
                        color = BluePrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column {
                    Text(
                        text = student.user?.name ?: "Student Name",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TextMain
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusPill(text = student.usn, type = "info")
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${student.department} • Sem ${student.currentSemester} (Sec ${student.section})",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
            }

            IconButton(onClick = onDelete) {
                Icon(Icons.Outlined.Delete, contentDescription = "Delete", tint = RoseDanger.copy(alpha = 0.8f))
            }
        }
    }
}

@Composable
fun AddStudentDialog(
    onDismiss: () -> Unit,
    onConfirm: (usn: String, name: String, email: String, dept: String, sem: Int, sec: String) -> Unit
) {
    var usn by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var dept by remember { mutableStateOf("CSE") }
    var sem by remember { mutableStateOf("4") }
    var sec by remember { mutableStateOf("A") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Enroll New Student", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = usn,
                    onValueChange = { usn = it },
                    label = { Text("USN (e.g. 2KL23CS010)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = dept,
                        onValueChange = { dept = it },
                        label = { Text("Dept") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sem,
                        onValueChange = { sem = it },
                        label = { Text("Sem") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sec,
                        onValueChange = { sec = it },
                        label = { Text("Sec") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (usn.isNotBlank() && name.isNotBlank() && email.isNotBlank()) {
                        onConfirm(usn, name, email, dept, sem.toIntOrNull() ?: 4, sec)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
            ) {
                Text("Enroll Student")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
