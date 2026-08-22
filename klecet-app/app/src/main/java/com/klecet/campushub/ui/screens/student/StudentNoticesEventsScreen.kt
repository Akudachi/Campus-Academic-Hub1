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
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.components.SectionHeader
import com.klecet.campushub.ui.components.StatusPill
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.StudentViewModel

@Composable
fun StudentNoticesEventsScreen(
    studentViewModel: StudentViewModel,
    onBack: () -> Unit
) {
    val notices by studentViewModel.notices.collectAsState()
    val events by studentViewModel.events.collectAsState()

    var selectedTab by remember { mutableStateOf(0) } // 0: Notices, 1: Events

    Scaffold(
        topBar = {
            CampusHeader(
                title = "College Bulletins & Events",
                subtitle = "Official updates from KLECET administration",
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
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = SurfaceWhite,
                contentColor = NavyDark,
                modifier = Modifier.clip(RoundedCornerShape(12.dp))
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Circulars (${notices.size})", fontWeight = FontWeight.Bold) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Events (${events.size})", fontWeight = FontWeight.Bold) }
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (selectedTab == 0) {
                if (notices.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No active circulars at this moment.", color = TextMuted)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(notices) { notice ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(notice.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyDark, modifier = Modifier.weight(1f))
                                        StatusPill(text = notice.priority?.uppercase() ?: "NORMAL", type = if (notice.priority == "high") "error" else "info")
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(notice.body, fontSize = 13.sp, color = TextMuted)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("By: ${notice.authorName ?: "Dean Office"} • ${notice.createdAt}", fontSize = 10.sp, color = TextSubtle)
                                }
                            }
                        }
                    }
                }
            } else {
                if (events.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No upcoming events scheduled.", color = TextMuted)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(events) { event ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(event.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = NavyDark)
                                        StatusPill(text = event.date, type = "warning")
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Venue: ${event.venue}", fontSize = 12.sp, color = BluePrimary, fontWeight = FontWeight.SemiBold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(event.description, fontSize = 12.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
