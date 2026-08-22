package com.klecet.campushub.ui.screens.admin

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.klecet.campushub.model.Teacher
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.*
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherMasterScreen(
    adminViewModel: AdminViewModel,
    authViewModel: AuthViewModel,
    notificationViewModel: NotificationViewModel,
    onBack: () -> Unit
) {
    val teachers by adminViewModel.teachers.collectAsState()
    val subjects by adminViewModel.subjects.collectAsState()
    val isLoading by adminViewModel.isLoading.collectAsState()
    val toastMessage by adminViewModel.toastMessage.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var isAddTeacherDialogVisible by remember { mutableStateOf(false) }
    var selectedTeacherForAssign by remember { mutableStateOf<Teacher?>(null) }
    var selectedTeacherToEdit by remember { mutableStateOf<Teacher?>(null) }

    val filteredTeachers = remember(teachers, searchQuery) {
        if (searchQuery.isBlank()) teachers
        else teachers.filter {
            it.user?.name?.contains(searchQuery, ignoreCase = true) == true ||
            it.teacherCode.contains(searchQuery, ignoreCase = true) ||
            it.department.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Faculty Master Directory",
                subtitle = "${teachers.size} Registered Professors",
                role = UserRole.ADMIN,
                onBackClick = onBack
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isAddTeacherDialogVisible = true },
                containerColor = NavyDark,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Faculty")
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
            // Search Field
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, code or department...", fontSize = 13.sp) },
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

            // Action Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total Faculty: ${filteredTeachers.size}",
                    fontSize = 13.sp,
                    color = TextMuted,
                    fontWeight = FontWeight.Medium
                )

                Button(
                    onClick = { adminViewModel.autoAssignTeachers(null, null) },
                    colors = ButtonDefaults.buttonColors(containerColor = BluePrimary),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.AutoFixHigh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Auto-Assign", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Faculty List
            if (filteredTeachers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (searchQuery.isBlank()) "No faculty records found." else "No matching faculty found.",
                        color = TextMuted,
                        fontSize = 14.sp
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredTeachers, key = { it.id }) { teacher ->
                        FacultyCard(
                            teacher = teacher,
                            onAssignSubject = { selectedTeacherForAssign = teacher },
                            onEdit = { selectedTeacherToEdit = teacher },
                            onDelete = { adminViewModel.deleteTeacher(teacher.id) },
                            onUnassignSubject = { subjectId ->
                                adminViewModel.unassignSubject(teacher.id, subjectId)
                            }
                        )
                    }
                }
            }
        }
    }

    // Add Faculty Dialog
    if (isAddTeacherDialogVisible) {
        AddFacultyDialog(
            onDismiss = { isAddTeacherDialogVisible = false },
            onConfirm = { name, email, code, dept, designation, qual ->
                adminViewModel.createTeacher(
                    mapOf(
                        "name" to name,
                        "email" to email,
                        "teacherCode" to code,
                        "department" to dept,
                        "designation" to designation,
                        "qualification" to qual
                    )
                ) {
                    isAddTeacherDialogVisible = false
                }
            }
        )
    }

    // Assign Subject Sheet Dialog
    if (selectedTeacherForAssign != null) {
        AssignSubjectDialog(
            teacher = selectedTeacherForAssign!!,
            allSubjects = subjects,
            onDismiss = { selectedTeacherForAssign = null },
            onAssign = { subjectId, semesterId ->
                adminViewModel.assignSubject(selectedTeacherForAssign!!.id, subjectId, semesterId)
                selectedTeacherForAssign = null
            }
        )
    }
}

@Composable
fun FacultyCard(
    teacher: Teacher,
    onAssignSubject: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onUnassignSubject: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(NavyDark),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (teacher.user?.name ?: "T").take(2).uppercase(),
                            color = GoldAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = teacher.user?.name ?: "Faculty Name",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextMain
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            StatusPill(text = teacher.teacherCode, type = "info")
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${teacher.department} • ${teacher.designation ?: "Professor"}",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }
                }

                IconButton(onClick = onDelete) {
                    Icon(Icons.Outlined.Delete, contentDescription = "Delete", tint = RoseDanger.copy(alpha = 0.8f))
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Assigned Subjects Section
            Text(
                text = "Assigned Teaching Subjects (${teacher.assignedSubjects.size})",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(6.dp))

            if (teacher.assignedSubjects.isEmpty()) {
                Text(
                    text = "No subjects currently assigned.",
                    fontSize = 12.sp,
                    color = TextSubtle
                )
            } else {
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    teacher.assignedSubjects.forEach { sub ->
                        Surface(
                            color = BluePrimary.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BluePrimary.copy(alpha = 0.3f)))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${sub.code} - ${sub.name} (Sem ${sub.semesterNumber})",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = NavyDark
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Remove",
                                    tint = RoseDanger,
                                    modifier = Modifier
                                        .size(14.dp)
                                        .clickable { onUnassignSubject(sub.subjectId) }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Assign Subject Trigger
            OutlinedButton(
                onClick = onAssignSubject,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(BluePrimary))
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp), tint = BluePrimary)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Assign Subject", fontSize = 12.sp, color = BluePrimary, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun AddFacultyDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, email: String, code: String, dept: String, designation: String, qual: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var dept by remember { mutableStateOf("CSE") }
    var designation by remember { mutableStateOf("Assistant Professor") }
    var qualification by remember { mutableStateOf("M.Tech") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Faculty Member", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name (e.g. Dr. Ramesh Patil)") },
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
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it },
                    label = { Text("Faculty Code (e.g. T009)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = dept,
                    onValueChange = { dept = it },
                    label = { Text("Department (e.g. CSE, ECE)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = designation,
                    onValueChange = { designation = it },
                    label = { Text("Designation") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && email.isNotBlank() && code.isNotBlank()) {
                        onConfirm(name, email, code, dept, designation, qualification)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
            ) {
                Text("Create Faculty")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun AssignSubjectDialog(
    teacher: Teacher,
    allSubjects: List<com.klecet.campushub.model.Subject>,
    onDismiss: () -> Unit,
    onAssign: (subjectId: String, semesterId: String?) -> Unit
) {
    var selectedSubjectId by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Assign Subject to ${teacher.user?.name}") },
        text = {
            Column {
                Text("Select from approved syllabus subjects:", fontSize = 13.sp, color = TextMuted)
                Spacer(modifier = Modifier.height(10.dp))
                LazyColumn(modifier = Modifier.heightIn(max = 260.dp)) {
                    items(allSubjects) { sub ->
                        val isSelected = selectedSubjectId == sub.id
                        Surface(
                            color = if (isSelected) BluePrimary.copy(alpha = 0.15f) else SlateBg,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { selectedSubjectId = sub.id },
                            border = if (isSelected) CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BluePrimary)) else null
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(sub.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text("${sub.code} • Sem ${sub.semesterNumber}", fontSize = 11.sp, color = TextMuted)
                                }
                                if (isSelected) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = BluePrimary)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedSubjectId.isNotBlank()) {
                        onAssign(selectedSubjectId, null)
                    }
                },
                enabled = selectedSubjectId.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
            ) {
                Text("Confirm Assignment")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
