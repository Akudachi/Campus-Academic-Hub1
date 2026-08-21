import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  Award,
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  MoreHorizontal,
  Bell,
  GraduationCap,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileAppDrawer } from './MobileAppDrawer';

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
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNotifications,
  onOpenLoginModal,
}) => {
  const { role, unreadCount } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Tab configurations per role
  const adminTabs: NavTabItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'notices-events', label: 'Circulars', icon: Megaphone },
    { id: 'timetable', label: 'Timetable', icon: Sparkles, isAi: true },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Faculty', icon: UserCheck },
  ];

  const teacherTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notices-events', label: 'Circulars', icon: Megaphone },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'assignments', label: 'Tasks', icon: FileCheck2 },
  ];

  const studentTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'notices-events', label: 'Circulars', icon: Megaphone },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'assignments', label: 'Tasks', icon: FileCheck2 },
  ];

  const tabs = role === 'admin' ? adminTabs : role === 'teacher' ? teacherTabs : studentTabs;

  // Determine if active tab is one of the secondary tabs (in More)
  const isSecondaryActive = !tabs.some((t) => t.id === activeTab);

  return (
    <>
      {/* SaaS Mobile App Bottom Navigation Bar */}
      <nav
        id="saas-bottom-nav-bar"
        aria-label="Mobile Web App Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE3ED] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden transition-all"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-6 items-center h-16 max-w-xl mx-auto px-0.5 sm:px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`bottom-nav-${tab.id}`}
                onClick={() => {
                  onSelectTab(tab.id);
                  setIsMoreOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center h-full py-1.5 transition-all select-none touch-manipulation group ${
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
                      className={`absolute -top-1 -right-1 text-[8px] font-extrabold px-1 rounded-full ${
                        isActive ? 'bg-[#E0982A] text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      AI
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 truncate max-w-[62px] ${
                    isActive ? 'font-bold text-[#13284A]' : 'font-medium text-[#667085]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* "More" Button for Secondary Pages, Notices, & Quick Tools */}
          <button
            id="bottom-nav-more"
            onClick={() => setIsMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center h-full py-1.5 transition-all select-none touch-manipulation group ${
              isSecondaryActive || isMoreOpen
                ? 'text-[#13284A]'
                : 'text-[#667085] hover:text-[#13284A]'
            }`}
          >
            <div
              className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                isSecondaryActive || isMoreOpen
                  ? 'bg-[#13284A] text-white shadow-xs scale-105'
                  : 'bg-transparent text-slate-500 group-hover:bg-slate-100'
              }`}
            >
              <MoreHorizontal
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSecondaryActive || isMoreOpen ? 'stroke-[2.5px]' : 'stroke-2'
                }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C0392B] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </div>

            <span
              className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                isSecondaryActive || isMoreOpen ? 'font-bold text-[#13284A]' : 'font-medium text-[#667085]'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Modern SaaS Slide-Up Bottom Sheet for Mobile Web App Navigation */}
      <MobileAppDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          onSelectTab(tabId);
          setIsMoreOpen(false);
        }}
        onOpenNotifications={() => {
          setIsMoreOpen(false);
          if (onOpenNotifications) onOpenNotifications();
        }}
        onOpenLoginModal={() => {
          setIsMoreOpen(false);
          if (onOpenLoginModal) onOpenLoginModal();
        }}
      />
    </>
  );
};
