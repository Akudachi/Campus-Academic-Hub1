package com.klecet.campushub.ui.screens.student

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.CampusHeader
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AuthViewModel

@Composable
fun StudentProfileScreen(
    authViewModel: AuthViewModel,
    onLogout: () -> Unit,
    onBack: () -> Unit
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val currentStudent by authViewModel.currentStudent.collectAsState()

    Scaffold(
        topBar = {
            CampusHeader(
                title = "Student Institutional Profile",
                subtitle = "Enrolled Record Details",
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Avatar Header
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(NavyDark),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = (currentUser?.name ?: "S").take(2).uppercase(),
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold,
                    fontSize = 26.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = currentUser?.name ?: "Student Name",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = TextMain
            )
            Text(
                text = currentStudent?.usn ?: "2KL23CS001",
                fontSize = 14.sp,
                color = BluePrimary,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(20.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSlate))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ProfileItemRow("Email Address", currentUser?.email ?: "student@klecet.edu")
                    ProfileItemRow("Department / Discipline", currentStudent?.department ?: "Computer Science & Engineering")
                    ProfileItemRow("Current Semester", "Semester ${currentStudent?.currentSemester ?: 4}")
                    ProfileItemRow("Section", "Section ${currentStudent?.section ?: "A"}")
                    ProfileItemRow("Institution", "K.L.E. College of Engineering & Tech, Chikodi")
                    ProfileItemRow("Affiliation", "Visvesvaraya Technological University (VTU)")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    authViewModel.logout()
                    onLogout()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RoseDanger)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out of Portal", fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Developed by Adarsh Kudachi",
                color = TextMuted,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun ProfileItemRow(label: String, value: String) {
    Column {
        Text(label, fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Medium)
        Text(value, fontSize = 14.sp, color = TextMain, fontWeight = FontWeight.SemiBold)
    }
}
