package com.klecet.campushub.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.Department
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.components.SectionHeader
import com.klecet.campushub.ui.components.StatusPill
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AdminViewModel

@Composable
fun DepartmentManagerScreen(
    adminViewModel: AdminViewModel,
    onBack: () -> Unit
) {
    val departments by adminViewModel.departments.collectAsState()

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Academic Departments",
                subtitle = "${departments.size} Active Faculties",
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
                title = "Engineering Disciplines",
                subtitle = "Department leadership, faculty allocations & students"
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(departments) { dept ->
                    DepartmentCard(dept = dept)
                }
            }
        }
    }
}

@Composable
fun DepartmentCard(dept: Department) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
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
                            text = dept.code,
                            color = GoldAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = dept.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextMain
                        )
                        Text(
                            text = "HOD: ${dept.headOfDepartment ?: "Dr. S. K. Patil"}",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }
                }
                StatusPill(text = "EST. ${dept.establishedYear ?: "2008"}", type = "info")
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${dept.teachersCount} Teachers",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BluePrimary
                )
                Text(
                    text = "${dept.studentsCount} Students",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldSuccess
                )
                Text(
                    text = "${dept.subjectsCount} Subjects",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = NavyDark
                )
            }
        }
    }
}
