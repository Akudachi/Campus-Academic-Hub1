import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNavBar } from './components/common/BottomNavBar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { Modal } from './components/common/Modal';
import { LoginView } from './components/auth/LoginView';
import { LoginPage } from './components/auth/LoginPage';
import { OfflineBanner } from './components/common/OfflineBanner';
import { SplashScreen } from './components/common/SplashScreen';
import { AppLogo } from './components/common/AppLogo';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { api } from './lib/api';

// Admin Components
import { AdminOverview } from './components/admin/AdminOverview';
import { TeacherMasterView } from './components/admin/TeacherMasterView';
import { StudentImportView } from './components/admin/StudentImportView';
import { TimetableAIView } from './components/admin/TimetableAIView';
import { SemesterManagerView } from './components/admin/SemesterManagerView';
import { NoticesEventsAdminView } from './components/admin/NoticesEventsAdminView';
import { ReportsAdminView } from './components/admin/ReportsAdminView';
import { CampusSettingsView } from './components/admin/CampusSettingsView';

// Teacher Components
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AttendanceTakingView } from './components/teacher/AttendanceTakingView';
import { AssignmentsTeacherView } from './components/teacher/AssignmentsTeacherView';
import { TestMarksTeacherView } from './components/teacher/TestMarksTeacherView';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentAttendanceView } from './components/student/StudentAttendanceView';
import { StudentAssignmentsView } from './components/student/StudentAssignmentsView';
import { StudentMarksView } from './components/student/StudentMarksView';
import { StudentNoticesEventsView } from './components/student/StudentNoticesEventsView';
import { StudentProfileView } from './components/student/StudentProfileView';

// Icons & Helpers
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Menu,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, role, isLoading, toasts, removeToast } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [campusInfo, setCampusInfo] = useState({
    institutionName: "K.L.E. Society's KLE College of Engineering and Technology",
    campusCode: 'KLECET-2026',
  });

  useEffect(() => {
    api.getCampusSettings()
      .then((res) => {
        if (res?.settings) {
          setCampusInfo({
            institutionName: res.settings.institutionName,
            campusCode: res.settings.campusCode,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Set default tab when role switches
  useEffect(() => {
    if (role === 'admin') setActiveTab('overview');
    if (role === 'teacher') setActiveTab('dashboard');
    if (role === 'student') setActiveTab('dashboard');
  }, [role]);

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // Not logged in (or loading initial session): Show Institutional Login Page with SplashScreen overlay
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4FA] antialiased text-slate-800 selection:bg-[#2E6FB0] selection:text-white relative">
        <LoginPage />

        {/* Cinematic Splash Screen */}
        {showSplash && (
          <SplashScreen
            brandTitle="KLECET"
            onComplete={() => setShowSplash(false)}
          />
        )}

        {/* Toast Notification Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-32px)] sm:w-full pointer-events-none">
          {toasts.map((toast) => {
            let bg = 'bg-[#13284A] text-white';
            let Icon = CheckCircle2;
            if (toast.type === 'error') {
              bg = 'bg-rose-700 text-white';
              Icon = AlertCircle;
            } else if (toast.type === 'warning') {
              bg = 'bg-amber-600 text-white';
              Icon = AlertTriangle;
            } else if (toast.type === 'info') {
              bg = 'bg-[#2E6FB0] text-white';
              Icon = Info;
            }

            return (
              <div
                key={toast.id}
                className={`p-3.5 rounded-xl shadow-xl flex items-start justify-between gap-3 text-xs font-medium pointer-events-auto border border-white/10 animate-fade-in ${bg}`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Admin Views
    if (role === 'admin') {
      switch (activeTab) {
        case 'overview':
          return <AdminOverview onNavigate={handleNavigate} />;
        case 'teachers':
          return <TeacherMasterView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'students':
          return <StudentImportView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'timetable':
          return <TimetableAIView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'semesters':
          return <SemesterManagerView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'notices':
        case 'notices-events':
          return <NoticesEventsAdminView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'reports':
          return <ReportsAdminView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        case 'settings':
          return <CampusSettingsView onBack={() => handleNavigate('overview')} onNavigate={handleNavigate} />;
        default:
          return <AdminOverview onNavigate={handleNavigate} />;
      }
    }

    // Teacher Views
    if (role === 'teacher') {
      switch (activeTab) {
        case 'dashboard':
          return <TeacherDashboard onNavigate={handleNavigate} />;
        case 'attendance':
          return <AttendanceTakingView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'assignments':
          return <AssignmentsTeacherView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'marks':
          return <TestMarksTeacherView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'notices':
        case 'notices-events':
          return <StudentNoticesEventsView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        default:
          return <TeacherDashboard onNavigate={handleNavigate} />;
      }
    }

    // Student Views (100% Read-Only)
    if (role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard onNavigate={handleNavigate} />;
        case 'attendance':
          return <StudentAttendanceView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'assignments':
          return <StudentAssignmentsView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'marks':
          return <StudentMarksView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'notices':
        case 'notices-events':
          return <StudentNoticesEventsView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        case 'profile':
          return <StudentProfileView onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
        default:
          return <StudentDashboard onNavigate={handleNavigate} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-800 selection:bg-[#2E6FB0] selection:text-white relative">
      {/* Top Header */}
      <Header
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Offline Status & Local Storage Cache Banner */}
      <OfflineBanner />

      {/* Main Body */}
      <div className="flex-1 flex w-full max-w-full lg:max-w-7xl mx-auto overflow-x-hidden min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activeTab={activeTab} onSelectTab={handleNavigate} />
        </div>

        {/* Mobile Sidebar Overlay (Accessible from header menu if used) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 flex flex-col animate-slide-up">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
                  {role} Navigation
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <Sidebar activeTab={activeTab} onSelectTab={handleNavigate} />
              </div>
            </div>
          </div>
        )}

        {/* Content Container - Responsive padding for mobile bottom bar */}
        <main className="flex-1 px-3 py-3 sm:px-5 sm:py-5 lg:p-8 min-w-0 max-w-full overflow-x-hidden overflow-y-auto pb-24 lg:pb-8 flex flex-col justify-between">
          <ErrorBoundary
            fallbackTitle="Section Render Error"
            fallbackSubtitle="An issue occurred while loading this view. Click retry to refresh this view."
            onReset={() => setActiveTab('overview')}
          >
            <div>{renderContent()}</div>
          </ErrorBoundary>

          {/* Institutional Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <AppLogo className="w-5 h-5" withSquircle={true} />
              <span className="font-semibold text-slate-700">{campusInfo.institutionName}</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">{campusInfo.campusCode}</span>
            </div>

            <div className="text-[11px] text-slate-400">
              <span>Academic Operations & Campus ERP Portal</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Modern SaaS Mobile Web App Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Login / Persona Switcher Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Sign In / Switch Persona"
        subtitle="Access role-based operations"
        maxWidth="md"
      >
        <LoginView onClose={() => setIsLoginModalOpen(false)} />
      </Modal>

      {/* Toast Notification Container (Positioned safely above bottom nav bar on mobile) */}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-32px)] sm:w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-[#13284A] text-white';
          let Icon = CheckCircle2;
          if (toast.type === 'error') {
            bg = 'bg-rose-700 text-white';
            Icon = AlertCircle;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-600 text-white';
            Icon = AlertTriangle;
          } else if (toast.type === 'info') {
            bg = 'bg-[#2E6FB0] text-white';
            Icon = Info;
          }

          return (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl shadow-xl flex items-start justify-between gap-3 text-xs font-medium pointer-events-auto border border-white/10 animate-fade-in ${bg}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      {/* Dynamic SaaS Splash Screen - Plays on app boot */}
      {showSplash && (
        <SplashScreen
          brandTitle="KLECET"
          onComplete={() => setShowSplash(false)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary
      fallbackTitle="Application Initialisation Error"
      fallbackSubtitle="An unexpected error occurred during application initialization. Please try reloading the page."
    >
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
