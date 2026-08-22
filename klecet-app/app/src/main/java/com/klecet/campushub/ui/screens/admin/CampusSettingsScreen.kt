package com.klecet.campushub.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel
import kotlinx.coroutines.launch

@Composable
fun CampusSettingsScreen(
    adminViewModel: AdminViewModel,
    onBack: () -> Unit
) {
    val campusSettings by adminViewModel.campusSettings.collectAsState()
    val systemStatus by adminViewModel.systemStatus.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var instName by remember(campusSettings) { mutableStateOf(campusSettings.institutionName) }
    var campusCode by remember(campusSettings) { mutableStateOf(campusSettings.campusCode) }
    var acadYear by remember(campusSettings) { mutableStateOf(campusSettings.academicYear) }
    var minAttendance by remember(campusSettings) { mutableStateOf(campusSettings.minAttendanceWarning.toString()) }
    var statusFeedback by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Campus Hub Settings",
                subtitle = "Institutional configurations & Database",
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
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("College Identity & Academic Calendar", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = instName,
                        onValueChange = { instName = it },
                        label = { Text("Institution Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = campusCode,
                            onValueChange = { campusCode = it },
                            label = { Text("Campus Code") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = acadYear,
                            onValueChange = { acadYear = it },
                            label = { Text("Academic Year") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = minAttendance,
                        onValueChange = { minAttendance = it },
                        label = { Text("Minimum Attendance Threshold (%)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                ApiClient.apiService.updateCampusSettings(
                                    mapOf(
                                        "institutionName" to instName,
                                        "campusCode" to campusCode,
                                        "academicYear" to acadYear,
                                        "minAttendanceWarning" to (minAttendance.toIntOrNull() ?: 75)
                                    )
                                )
                                adminViewModel.loadOverview()
                                statusFeedback = "Campus settings updated successfully"
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                    ) {
                        Text("Save Configurations")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Demo Dataset Operations
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Sample Data & Database Controls", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Seed comprehensive demo datasets (teachers, students, semesters, CIE sheets, assignments, notices) or reset state.",
                        fontSize = 12.sp,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                ApiClient.apiService.loadSampleDataset()
                                adminViewModel.loadAllAdminData()
                                statusFeedback = "Sample demo dataset successfully populated!"
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = BluePrimary)
                    ) {
                        Icon(Icons.Default.Storage, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Seed Full KLECET Demo Dataset")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                ApiClient.apiService.resetDatabase()
                                adminViewModel.loadAllAdminData()
                                statusFeedback = "Database reset to initial clean state."
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(RoseDanger))
                    ) {
                        Text("Reset Database", color = RoseDanger, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (statusFeedback != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = EmeraldSuccess.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = statusFeedback!!,
                        color = EmeraldSuccess,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }
    }
}
