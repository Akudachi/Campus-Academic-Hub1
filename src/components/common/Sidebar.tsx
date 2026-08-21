import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  Megaphone,
  BarChart3,
  BookOpen,
  FileCheck2,
  Award,
  Calendar,
  Sparkles,
  Layers,
  GraduationCap,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { role } = useAuth();

  const adminNav = [
    { id: 'overview', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'teachers', label: 'Teacher Master', icon: UserCheck },
    { id: 'students', label: 'Student Import & Master', icon: Users },
    { id: 'timetable', label: 'Timetable AI Review', icon: Sparkles, badge: 'AI' },
    { id: 'semesters', label: 'Semester Lifecycle', icon: Layers },
    { id: 'notices-events', label: 'Notices & Events', icon: Megaphone },
    { id: 'reports', label: 'Comprehensive Reports', icon: BarChart3 },
    { id: 'settings', label: 'Campus Settings & Deploy', icon: Settings },
  ];

  const teacherNav = [
    { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
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
    <aside className="w-64 bg-white border-r border-[#DCE3ED] shrink-0 flex flex-col justify-between py-6 px-3">
      <div className="space-y-6">
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
              {role === 'admin' ? 'Operations Hub' : role === 'teacher' ? 'Academic Workspace' : 'Read-Only Workspace'}
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

      {/* Role Security Notice footer */}
      <div className="px-3 pt-4 border-t border-slate-100">
        {role === 'student' ? (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Read-Only Portal</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-snug">
              Academic records are verified and managed by assigned faculty & administration.
            </p>
          </div>
        ) : role === 'teacher' ? (
          <div className="p-2.5 rounded-xl bg-blue-50/50 border border-[#2E6FB0]/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#13284A]">
              <BookOpen className="w-3.5 h-3.5 text-[#2E6FB0] shrink-0" />
              <span>Assigned Subjects</span>
            </div>
            <p className="text-[11px] text-[#667085] leading-snug">
              Mutations locked to your verified semester assignments only.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-[11px] font-semibold text-[#13284A]">College Administration</p>
            <p className="text-[10px] text-[#667085]">Apex Institute of Technology</p>
          </div>
        )}
      </div>
    </aside>
  );
};
