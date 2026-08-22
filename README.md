# Campus Academic Hub - Native Android (Kotlin + Jetpack Compose)

A fully native modern Android application for **Campus Academic Hub**, built with **Kotlin**, **Jetpack Compose (Material3)**, **Retrofit**, and **Coroutines Flow (MVVM)**.

Connected with backend API: `https://campus-academic-hub1.onrender.com`

---

## 🏛️ Features & Role Portals

### 👑 1. Admin Portal
- **Overview & Metrics**: Live counts of departments, faculties, enrolled students, and system health.
- **Teacher Master**: Comprehensive faculty directory, teacher registration, department assignments, and subject allocation.
- **Student Import & Management**: Student registry, batch bulk enrollment with dynamic field mapping, semester status tracking.
- **AI Timetable Generator (Gemini AI)**: Intelligent OCR and timetable parsing with multimodal image/PDF prompt analysis and backend-secured proxying.
- **Academic Hierarchy**: Semester lifecycle management, promotion batch workflows, and department configurations.
- **Notices & Events**: Broadcast circulars, circular priority management, and campus calendar publishing.
- **System Reports**: Student academic performance analytics, attendance compliance monitoring, and PDF/CSV data exports.
- **Campus Settings**: Institution branding, academic calendar dates, and authentication security policies.

### 👨‍🏫 2. Teacher Portal
- **Classroom Dashboard**: Real-time summary of assigned courses, upcoming class schedules, and attendance alerts.
- **Digital Attendance System**: Batch attendance register with Present / Absent / Late quick-toggles and persistent cloud sync.
- **Continuous Assessment & Assignments**: Assignment creation, deadline tracking, and grading workflows.
- **Internal Marks & Grading**: Comprehensive test assessment scoring with automatic calculation.

### 🎓 3. Student Portal
- **Personal Dashboard**: Real-time attendance percentage, timetable schedules, circular notifications, and grade cards.
- **Subject-wise Attendance**: Detailed breakdown of subject attendance with eligibility warning alerts.
- **Assignment Submissions**: Submission status tracking and deadline reminders.
- **Grade & Marks Cards**: Semester test results and performance breakdown.
- **Academic Notices**: Real-time campus announcements and event feeds.
- **Profile & ID Card**: Student profile credentials, contact info, and enrolled subjects.

---

## 🏗️ Architecture & Tech Stack

```
app/src/main/java/com/klecet/campushub/
├── MainActivity.kt               # Single Activity host with Jetpack Compose
├── CampusApplication.kt          # Application class initializing Auth and ApiClient
├── model/
│   └── Models.kt                 # Data classes and JSON serialization schemas
├── network/
│   ├── ApiClient.kt              # OkHttpClient, Retrofit instance, AuthInterceptor
│   ├── ApiService.kt             # REST endpoints matching backend API
│   ├── AuthManager.kt            # Session token & role state persistence
│   ├── GeminiService.kt          # AI Timetable extraction via secure backend route
│   └── NetworkResult.kt          # Sealed UI state wrappers (Success, Error, Loading)
├── repository/
│   └── CampusRepository.kt       # Single source of truth with Dispatchers.IO
├── viewmodel/
│   ├── AuthViewModel.kt          # Authentication & persona switching
│   ├── AdminViewModel.kt         # Admin domain logic and state flows
│   ├── TeacherViewModel.kt       # Teacher classroom & attendance logic
│   ├── StudentViewModel.kt       # Student portal & grades logic
│   └── NotificationViewModel.kt   # System-wide announcements and alerts
└── ui/
    ├── theme/                    # Institutional Material3 Theme (Color, Type, Shape, Theme)
    ├── navigation/               # Type-safe Navigation Graph (CampusNavGraph, Screen)
    ├── components/               # Reusable atomic UI (Header, Cards, Pills, Sheets)
    └── screens/
        ├── auth/                 # SplashScreen, LoginScreen
        ├── admin/                # 9 Admin Screens (Overview, Teachers, Students, Timetable AI, etc.)
        ├── teacher/              # Teacher Dashboard, Attendance, Assignments, Test Marks
        └── student/              # Student Dashboard, Attendance, Assignments, Marks, Notices, Profile
```

- **UI Framework**: Jetpack Compose 1.7+ with Material3 Design System
- **Language**: Kotlin 2.0+
- **Network**: Retrofit 2.11 + OkHttp 4.12 + Gson
- **Async**: Kotlin Coroutines & `StateFlow` / `SharedFlow`
- **Architecture**: MVVM (Model-View-ViewModel) + Repository Pattern
- **Target SDK**: Android 14 / 15 (API 34/35), Min SDK: API 26 (Android 8.0)

---

## 🚀 How to Run in Android Studio

1. Open **Android Studio** (Ladybug / Koala / Hedgehog or newer).
2. Select **File > Open...** and choose this project root directory.
3. Allow Gradle to sync dependencies (`gradle-8.10.2` & `agp 8.7.2`).
4. Select an Emulator (e.g. Pixel 8 / 9 with API 34+) or connect a physical Android device.
5. Click **Run (`Shift + F10`)** to build and launch the app.

---

## 🔑 Demo Credentials

| Role | Username / ID | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Teacher** | `TCH001` (or `teacher`) | `teacher123` |
| **Student** | `21CS001` (or `student`) | `student123` |

*Quick login buttons are also available on the login screen for instant persona switching.*
