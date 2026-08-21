import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNavBar } from './components/common/BottomNavBar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { Modal } from './components/common/Modal';
import { LoginView } from './components/auth/LoginView';
import { OfflineBanner } from './components/common/OfflineBanner';

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
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, role, isLoading, toasts, removeToast } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#13284A] text-white flex items-center justify-center animate-pulse">
          <GraduationCap className="w-7 h-7 text-[#5B93D1]" />
        </div>
        <p className="text-sm font-semibold text-[#13284A]">Initializing Campus Academic Hub...</p>
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
          return <TeacherMasterView />;
        case 'students':
          return <StudentImportView />;
        case 'timetable':
          return <TimetableAIView />;
        case 'semesters':
          return <SemesterManagerView />;
        case 'notices-events':
          return <NoticesEventsAdminView />;
        case 'reports':
          return <ReportsAdminView />;
        case 'settings':
          return <CampusSettingsView />;
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
          return <AttendanceTakingView />;
        case 'assignments':
          return <AssignmentsTeacherView />;
        case 'marks':
          return <TestMarksTeacherView />;
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
          return <StudentAttendanceView />;
        case 'assignments':
          return <StudentAssignmentsView />;
        case 'marks':
          return <StudentMarksView />;
        case 'notices-events':
          return <StudentNoticesEventsView />;
        case 'profile':
          return <StudentProfileView />;
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
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
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
              <div className="flex-1 overflow-y-auto">
                <Sidebar activeTab={activeTab} onSelectTab={handleNavigate} />
              </div>
            </div>
          </div>
        )}

        {/* Content Container - Responsive padding for mobile bottom bar */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 min-w-0 overflow-y-auto pb-24 lg:pb-8">
          {renderContent()}
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
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
