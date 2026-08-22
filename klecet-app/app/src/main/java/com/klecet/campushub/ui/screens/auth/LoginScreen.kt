package com.klecet.campushub.ui.screens.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klecet.campushub.model.PersonaItem
import com.klecet.campushub.model.UserRole
import com.klecet.campushub.ui.components.AppLogo
import com.klecet.campushub.ui.components.PersonaPickerSheet
import com.klecet.campushub.ui.theme.*
import com.klecet.campushub.viewmodel.AuthUiState
import com.klecet.campushub.viewmodel.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onLoginSuccess: (UserRole) -> Unit
) {
    val uiState by authViewModel.uiState.collectAsState()
    val personas by authViewModel.personas.collectAsState()

    var selectedTab by remember { mutableStateOf(UserRole.STUDENT) }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isPersonaSheetOpen by remember { mutableStateOf(false) }
    var isConfigDialogVisible by remember { mutableStateOf(false) }
    var customBaseUrl by remember { mutableStateOf(com.klecet.campushub.network.AuthManager.getBaseUrl()) }

    // Pre-fill convenient demo hints when switching tabs
    LaunchedEffect(selectedTab) {
        when (selectedTab) {
            UserRole.STUDENT -> {
                identifier = "2KL23CS001"
                password = "student123"
            }
            UserRole.TEACHER -> {
                identifier = "T001"
                password = "teacher123"
            }
            UserRole.ADMIN -> {
                identifier = "admin@klecet.edu"
                password = "admin123"
            }
        }
    }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onLoginSuccess((uiState as AuthUiState.Success).role)
            authViewModel.resetState()
        }
    }

    Scaffold(
        containerColor = SlateBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Institutional Top Bar
            Surface(
                color = NavyDark,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    AppLogo(size = 48)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "K.L.E. College of Engineering & Technology",
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Central Academic Operations Portal",
                        color = BlueAccent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main Login Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Text(
                        text = "Institutional Sign In",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = NavyDark
                    )
                    Text(
                        text = "Select your role to access role-specific features",
                        style = MaterialTheme.typography.bodySmall.copy(color = TextMuted)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // 3-Role Tab Selector
                    Surface(
                        color = SlateBg,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            listOf(
                                Triple(UserRole.STUDENT, "Student", Icons.Default.School),
                                Triple(UserRole.TEACHER, "Faculty", Icons.Default.Person),
                                Triple(UserRole.ADMIN, "Admin", Icons.Default.AdminPanelSettings)
                            ).forEach { (role, label, icon) ->
                                val isSelected = selectedTab == role
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isSelected) NavyDark else Color.Transparent)
                                        .clickable { selectedTab = role }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = icon,
                                            contentDescription = null,
                                            tint = if (isSelected) GoldAccent else TextMuted,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = label,
                                            color = if (isSelected) Color.White else TextMuted,
                                            fontSize = 12.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Dynamic Identifier Field
                    OutlinedTextField(
                        value = identifier,
                        onValueChange = { identifier = it },
                        label = {
                            Text(
                                when (selectedTab) {
                                    UserRole.STUDENT -> "Student USN (e.g. 2KL23CS001)"
                                    UserRole.TEACHER -> "Faculty Code / Email (e.g. T001)"
                                    UserRole.ADMIN -> "Admin Email / Access Key"
                                }
                            )
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = when (selectedTab) {
                                    UserRole.STUDENT -> Icons.Outlined.Badge
                                    UserRole.TEACHER -> Icons.Outlined.Person
                                    UserRole.ADMIN -> Icons.Outlined.AdminPanelSettings
                                },
                                contentDescription = null,
                                tint = BluePrimary
                            )
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Password Field
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.Lock,
                                contentDescription = null,
                                tint = BluePrimary
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = TextMuted
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Error Banner
                    if (uiState is AuthUiState.Error) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            color = RoseDanger.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = RoseDanger,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = (uiState as AuthUiState.Error).message,
                                    color = RoseDanger,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Sign In Button
                    Button(
                        onClick = {
                            val creds = mutableMapOf<String, String>(
                                "role" to selectedTab.name.lowercase(),
                                "password" to password
                            )
                            when (selectedTab) {
                                UserRole.STUDENT -> creds["usn"] = identifier
                                UserRole.TEACHER -> creds["teacherCode"] = identifier
                                UserRole.ADMIN -> creds["email"] = identifier
                            }
                            authViewModel.login(creds)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyDark),
                        enabled = uiState !is AuthUiState.Loading && identifier.isNotBlank() && password.isNotBlank()
                    ) {
                        if (uiState is AuthUiState.Loading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Sign In to Portal",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Demo Persona Switcher Button
                    OutlinedButton(
                        onClick = { isPersonaSheetOpen = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(BluePrimary))
                    ) {
                        Icon(
                            imageVector = Icons.Default.FlashOn,
                            contentDescription = null,
                            tint = GoldAccent,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "1-Click Demo Personas",
                            color = BluePrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Backend Server Settings Link
            TextButton(onClick = { isConfigDialogVisible = true }) {
                Icon(
                    imageVector = Icons.Outlined.Settings,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Configure Backend Server URL",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Developer Footer
            Text(
                text = "Developed by Adarsh Kudachi",
                color = TextMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Persona Sheet Modal
    PersonaPickerSheet(
        isOpen = isPersonaSheetOpen,
        personas = personas,
        onClose = { isPersonaSheetOpen = false },
        onSelectPersona = { persona ->
            authViewModel.loginWithPersona(persona)
        }
    )

    // Backend URL Configuration Dialog
    if (isConfigDialogVisible) {
        AlertDialog(
            onDismissRequest = { isConfigDialogVisible = false },
            title = { Text("Backend Server URL") },
            text = {
                Column {
                    Text(
                        text = "Specify your running server base URL (e.g. for physical devices on local Wi-Fi or Cloud Run instance):",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = customBaseUrl,
                        onValueChange = { customBaseUrl = it },
                        label = { Text("API Base URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        com.klecet.campushub.network.AuthManager.setBaseUrl(customBaseUrl)
                        isConfigDialogVisible = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyDark)
                ) {
                    Text("Save & Reconnect")
                }
            },
            dismissButton = {
                TextButton(onClick = { isConfigDialogVisible = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
