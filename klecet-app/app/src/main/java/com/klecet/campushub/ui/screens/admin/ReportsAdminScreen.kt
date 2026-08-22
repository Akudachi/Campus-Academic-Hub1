package com.klecet.campushub.ui.screens.admin

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
import com.klecet.campushub.model.AuditLog
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.components.SectionHeader
import com.klecet.campushub.ui.components.StatusPill
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel

@Composable
fun ReportsAdminScreen(
    adminViewModel: AdminViewModel,
    onBack: () -> Unit
) {
    val auditLogs by adminViewModel.auditLogs.collectAsState()

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Analytics & Audit Logs",
                subtitle = "Institutional operations trace",
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
                .padding(16.dp)
        ) {
            SectionHeader(
                title = "Live Audit Event Stream (${auditLogs.size})",
                subtitle = "Security and data change logs"
            )

            if (auditLogs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No audit events recorded yet.", color = TextMuted)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(auditLogs) { log ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = log.action,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = NavyDark
                                    )
                                    StatusPill(text = log.userRole.name, type = "info")
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${log.userName} • ${log.details}",
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = log.timestamp,
                                    fontSize = 10.sp,
                                    color = TextSubtle
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
