package com.klecet.campushub.ui.screens.admin

import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.components.SectionHeader
import com.klecet.campushub.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun NoticesEventsAdminScreen(
    onBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()

    var noticeTitle by remember { mutableStateOf("") }
    var noticeBody by remember { mutableStateOf("") }
    var noticePriority by remember { mutableStateOf("normal") }
    var isNoticePosted by remember { mutableStateOf(false) }

    var eventTitle by remember { mutableStateOf("") }
    var eventDate by remember { mutableStateOf("2026-03-25") }
    var eventVenue by remember { mutableStateOf("Dr. Prabhakar Kore Seminar Hall") }
    var eventDescription by remember { mutableStateOf("") }
    var isEventPosted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Circulars & Campus Events",
                subtitle = "Broadcast official updates",
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
            // Notice Publishing Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Publish Official Circular / Notice",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = noticeTitle,
                        onValueChange = { noticeTitle = it },
                        label = { Text("Circular Title (e.g. CIE-1 Schedule)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = noticeBody,
                        onValueChange = { noticeBody = it },
                        label = { Text("Notice Body & Instructions") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                ApiClient.apiService.createNotice(
                                    mapOf(
                                        "title" to noticeTitle,
                                        "body" to noticeBody,
                                        "priority" to noticePriority,
                                        "audienceType" to "everyone"
                                    )
                                )
                                isNoticePosted = true
                                noticeTitle = ""
                                noticeBody = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyDark),
                        enabled = noticeTitle.isNotBlank() && noticeBody.isNotBlank()
                    ) {
                        Text("Broadcast Notice to Campus")
                    }

                    if (isNoticePosted) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Circular published successfully!", color = EmeraldSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Event Publishing Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Schedule Campus Event",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = eventTitle,
                        onValueChange = { eventTitle = it },
                        label = { Text("Event Name (e.g. INVENTO 2026 Tech Fest)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = eventDate,
                            onValueChange = { eventDate = it },
                            label = { Text("Date") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = eventVenue,
                            onValueChange = { eventVenue = it },
                            label = { Text("Venue") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = eventDescription,
                        onValueChange = { eventDescription = it },
                        label = { Text("Description & Highlights") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                ApiClient.apiService.createEvent(
                                    mapOf(
                                        "title" to eventTitle,
                                        "date" to eventDate,
                                        "venue" to eventVenue,
                                        "description" to eventDescription
                                    )
                                )
                                isEventPosted = true
                                eventTitle = ""
                                eventDescription = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = BluePrimary),
                        enabled = eventTitle.isNotBlank()
                    ) {
                        Text("Add Campus Event")
                    }

                    if (isEventPosted) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Event scheduled successfully!", color = EmeraldSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
