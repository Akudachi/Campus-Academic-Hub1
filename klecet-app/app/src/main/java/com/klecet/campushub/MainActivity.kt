package com.klecet.campushub

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.klecet.campushub.network.ApiClient
import com.klecet.campushub.network.AuthManager
import com.klecet.campushub.ui.navigation.CampusNavGraph
import com.klecet.campushub.ui.theme.CampusAcademicHubTheme
import com.klecet.campushub.ui.theme.SlateBg
import com.klecet.campushub.viewmodel.AdminViewModel
import com.klecet.campushub.viewmodel.AuthViewModel
import com.klecet.campushub.viewmodel.NotificationViewModel
import com.klecet.campushub.viewmodel.StudentViewModel
import com.klecet.campushub.viewmodel.TeacherViewModel

class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private val adminViewModel: AdminViewModel by viewModels()
    private val teacherViewModel: TeacherViewModel by viewModels()
    private val studentViewModel: StudentViewModel by viewModels()
    private val notificationViewModel: NotificationViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        AuthManager.init(applicationContext)
        ApiClient.init(applicationContext)

        setContent {
            CampusAcademicHubTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = SlateBg
                ) {
                    val navController = rememberNavController()

                    CampusNavGraph(
                        navController = navController,
                        authViewModel = authViewModel,
                        adminViewModel = adminViewModel,
                        teacherViewModel = teacherViewModel,
                        studentViewModel = studentViewModel,
                        notificationViewModel = notificationViewModel
                    )
                }
            }
        }
    }
}
