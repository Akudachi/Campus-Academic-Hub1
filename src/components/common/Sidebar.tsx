import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Megaphone,
  BarChart3,
  BookOpen,
  FileCheck2,
  Award,
  Calendar,
  Layers,
  GraduationCap,
  Settings,
  LogOut,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { role, user, logout } = useAuth();

  const adminNav = [
    { id: 'overview', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: 'Teacher Master', icon: UserCheck },
    { id: 'students', label: 'Student Import & Master', icon: Users },
    { id: 'timetable', label: 'Subject & Faculty CSV', icon: FileSpreadsheet, badge: 'CSV' },
    { id: 'semesters', label: 'Semester Lifecycle', icon: Layers },
    { id: 'notices-events', label: 'Notices & Events', icon: Megaphone },
    { id: 'reports', label: 'Comprehensive Reports', icon: BarChart3 },
    { id: 'settings', label: 'Campus Settings & Deploy', icon: Settings },
  ];

  const teacherNav = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { id: 'notices-events', label: 'Notices & Events', icon: Megaphone },
    { id: 'attendance', label: 'Take Attendance', icon: BookOpen },
    { id: 'assignments', label: 'Assignments Tracker', icon: FileCheck2 },
    { id: 'marks', label: 'Test Marks Entry', icon: Award },
  ];

  const studentNav = [
    { id: 'dashboard', label: 'Student Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'My Attendance', icon: BookOpen },
    { id: 'assignments', label: 'My Assignments', icon: FileCheck2 },
    { id: 'marks', label: 'Test Marks (Published)', icon: Award },
    { id: 'notices-events', label: 'Notices & Events', icon: Megaphone },
    { id: 'profile', label: 'Academic Profile', icon: GraduationCap },
  ];

  let currentNav = adminNav;
  if (role === 'teacher') currentNav = teacherNav;
  if (role === 'student') currentNav = studentNav;

  return (
    <aside className="w-64 bg-white border-r border-[#DCE3ED] shrink-0 flex flex-col justify-between py-5 px-3 h-full overflow-y-auto">
      <div className="space-y-5">
        {/* Role Header Title */}
        <div className="px-3">
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
            {role === 'admin' ? 'Administration' : role === 'teacher' ? 'Faculty Portal' : 'Student Portal'}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                role === 'admin'
                  ? 'bg-[#13284A]'
                  : role === 'teacher'
                  ? 'bg-[#2E6FB0]'
                  : 'bg-[#1E8E5A]'
              }`}
            />
            <span className="text-sm font-bold text-[#13284A] capitalize">
              {role === 'admin' ? 'Operations Hub' : role === 'teacher' ? 'Faculty Workspace' : 'Student Workspace'}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#13284A] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-[#13284A] hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#5B93D1]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-[#E0982A] text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Status & Direct Sign Out Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                role === 'admin' ? 'bg-[#13284A]' : role === 'teacher' ? 'bg-[#2E6FB0]' : 'bg-emerald-700'
              }`}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1 truncate">
                <Shield className="w-2.5 h-2.5 text-slate-400" />
                <span>{role} Portal</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="sidebar-logout-btn"
          onClick={() => logout()}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
