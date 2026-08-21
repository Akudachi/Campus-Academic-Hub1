import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  Award,
  Users,
  UserCheck,
  Sparkles,
  Megaphone,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavBarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenNotifications?: () => void;
  onOpenLoginModal?: () => void;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAi?: boolean;
  badge?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { role, unreadCount } = useAuth();

  // Admin Bottom Bar: Overview, Students, Faculty, Timetable, Notices, Settings
  const adminTabs: NavTabItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Faculty', icon: UserCheck },
    { id: 'timetable', label: 'Timetable', icon: Sparkles, isAi: true },
    { id: 'notices-events', label: 'Notices', icon: Megaphone, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const teacherTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'assignments', label: 'Tasks', icon: FileCheck2 },
    { id: 'notices-events', label: 'Notices', icon: Megaphone, badge: unreadCount },
  ];

  const studentTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'assignments', label: 'Tasks', icon: FileCheck2 },
    { id: 'notices-events', label: 'Notices', icon: Megaphone, badge: unreadCount },
  ];

  const tabs = role === 'admin' ? adminTabs : role === 'teacher' ? teacherTabs : studentTabs;

  return (
    <nav
      id="saas-bottom-nav-bar"
      aria-label="Mobile Web App Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE3ED] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden transition-all"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div
        className={`grid ${
          tabs.length === 6 ? 'grid-cols-6' : 'grid-cols-5'
        } items-center h-16 max-w-lg mx-auto px-0.5`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'notices-events' && (activeTab === 'notices' || activeTab === 'notices-events'));

          return (
            <button
              key={tab.id}
              id={`bottom-nav-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full py-1 transition-all select-none touch-manipulation cursor-pointer group active:scale-95 ${
                isActive ? 'text-[#13284A]' : 'text-[#667085] hover:text-[#13284A]'
              }`}
            >
              {/* Active Indicator Highlight Pill */}
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#13284A] text-white shadow-xs scale-105'
                    : 'bg-transparent text-slate-500 group-hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-2'
                  }`}
                />
                {tab.isAi && (
                  <span
                    className={`absolute -top-1 -right-1 text-[7px] font-extrabold px-0.5 rounded-full ${
                      isActive ? 'bg-[#E0982A] text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    AI
                  </span>
                )}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C0392B] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span
                className={`text-[9.5px] mt-0.5 tracking-tight transition-all duration-200 truncate max-w-[56px] text-center ${
                  isActive ? 'font-extrabold text-[#13284A]' : 'font-medium text-[#667085]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
