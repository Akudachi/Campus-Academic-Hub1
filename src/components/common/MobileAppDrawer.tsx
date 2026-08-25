import React, { useEffect } from 'react';
import {
  X,
  Layers,
  Megaphone,
  BarChart3,
  Settings,
  GraduationCap,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  Award,
  FileCheck2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenNotifications?: () => void;
  onOpenLoginModal?: () => void;
}

export const MobileAppDrawer: React.FC<MobileAppDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenNotifications,
  onOpenLoginModal,
}) => {
  const { user, teacher, student, role, personas, switchPersona, logout, unreadCount } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Secondary or extra pages by role
  const adminExtras = [
    { id: 'notices-events', label: 'Notices & Circulars', desc: 'Broadcast updates & events', icon: Megaphone },
    { id: 'semesters', label: 'Semester Manager', desc: 'Cohorts & active terms', icon: Layers },
    { id: 'reports', label: 'Reports & Export', desc: 'Accreditation & audit exports', icon: BarChart3 },
    { id: 'settings', label: 'Campus Settings', desc: 'Branding & system configuration', icon: Settings },
  ];

  const studentExtras = [
    { id: 'notices-events', label: 'Circulars & Events', desc: 'Official notices & fest calendar', icon: Megaphone },
    { id: 'profile', label: 'Academic Profile', desc: 'USN, courses & cohort details', icon: GraduationCap },
  ];

  const teacherExtras = [
    { id: 'notices-events', label: 'Circulars & Events', desc: 'Campus announcements & dates', icon: Megaphone },
    { id: 'dashboard', label: 'Curriculum & Courses', desc: 'Assigned subjects breakdown', icon: BookOpen },
  ];

  const extraPages = role === 'admin' ? adminExtras : role === 'student' ? studentExtras : teacherExtras;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* App-like Bottom Sheet Container */}
      <div
        className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col max-h-[85vh] overflow-hidden border-t border-[#DCE3ED] animate-slide-up"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Drag Handle Bar */}
        <div className="pt-3 pb-2 flex justify-center items-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-[#13284A] border border-slate-200">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#13284A] leading-tight truncate max-w-[200px]">
                {user?.name}
              </h3>
              <p className="text-[11px] text-[#667085] flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    role === 'admin'
                      ? 'bg-[#13284A]'
                      : role === 'teacher'
                      ? 'bg-[#2E6FB0]'
                      : 'bg-[#1E8E5A]'
                  }`}
                />
                <span className="capitalize font-semibold">{role}</span>
                <span>•</span>
                <span className="font-mono">
                  {role === 'student'
                    ? student?.usn || 'Student'
                    : role === 'teacher'
                    ? teacher?.teacherCode || 'Faculty'
                    : 'System Admin'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Quick Notification & Action Bar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (onOpenNotifications) onOpenNotifications();
              }}
              className="p-3 rounded-xl bg-slate-50 border border-[#DCE3ED] flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative p-2 rounded-lg bg-blue-100/70 text-[#2E6FB0]">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C0392B] text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#13284A] block">Alerts</span>
                  <span className="text-[10px] text-[#667085]">
                    {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                if (onOpenLoginModal) onOpenLoginModal();
              }}
              className="p-3 rounded-xl bg-slate-50 border border-[#DCE3ED] flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-200/70 text-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#13284A] block">Accounts</span>
                  <span className="text-[10px] text-[#667085]">Switch & sign in</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Extra / Secondary Pages Navigation */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              Additional Portal Modules
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {extraPages.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#13284A] border-[#13284A] text-white shadow-xs'
                        : 'bg-white border-[#DCE3ED] hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-[#2E6FB0]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isActive ? 'text-white' : 'text-[#13284A]'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[11px] ${
                            isActive ? 'text-white/80' : 'text-[#667085]'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Status & Sign Out */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[10px] uppercase font-bold text-slate-400">Signed In As</div>
              <div className="font-bold text-xs text-[#13284A] truncate mt-0.5">{user?.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>

            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out from Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
