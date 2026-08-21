import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Bell,
  UserCheck,
  ChevronDown,
  LogOut,
  ShieldCheck,
  BookOpen,
  User,
  Sparkles,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDrawer } from './NotificationDrawer';
import { api } from '../../lib/api';
import { storageService } from '../../lib/storageService';

interface HeaderProps {
  onOpenLoginModal?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLoginModal, onNavigate }) => {
  const { user, teacher, student, role, personas, switchPersona, logout, unreadCount } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState('Apex Institute of Technology');
  const [academicYear, setAcademicYear] = useState('2025–26');
  const [currentTerm, setCurrentTerm] = useState('Even Sem (2, 4, 6, 8)');
  const [isOnline, setIsOnline] = useState<boolean>(storageService.isOnline());

  useEffect(() => {
    const unsub = storageService.subscribeToNetworkStatus((online) => {
      setIsOnline(online);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    api.getCampusSettings()
      .then((res) => {
        if (res.settings) {
          setInstitutionName(res.settings.institutionName);
          setAcademicYear(res.settings.academicYear);
          if (res.settings.semesterTermType === 'even') {
            setCurrentTerm('Even Sem (2, 4, 6, 8)');
          } else if (res.settings.semesterTermType === 'odd') {
            setCurrentTerm('Odd Sem (1, 3, 5, 7)');
          } else if (res.settings.currentSemesterTerm) {
            setCurrentTerm(res.settings.currentSemesterTerm);
          }
        }
      })
      .catch(() => {});
  }, []);

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#13284A] text-white tracking-wide">
            <ShieldCheck className="w-3 h-3" />
            ADMIN
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2E6FB0] text-white tracking-wide">
            <BookOpen className="w-3 h-3" />
            FACULTY ({teacher?.teacherCode || 'T001'})
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1E8E5A] text-white tracking-wide">
            <GraduationCap className="w-3 h-3" />
            STUDENT ({student?.usn || 'STUDENT'})
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#DCE3ED] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & College Info */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#13284A] flex items-center justify-center text-white shadow-xs shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#5B93D1]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-serif text-sm sm:text-lg font-bold text-[#13284A] tracking-tight truncate">
                    Campus Hub
                  </h1>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    SaaS App
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] truncate hidden sm:flex items-center gap-1.5">
                  <span>{institutionName}</span>
                  <span>•</span>
                  <span>AY {academicYear}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#2E6FB0] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">{currentTerm}</span>
                </p>
                <div className="sm:hidden mt-0.5">
                  {getRoleBadge()}
                </div>
              </div>
            </div>

            {/* Middle Quick Persona Switcher Bar (For Seamless Testing & Demonstration) */}
            <div className="hidden lg:flex items-center bg-[#F3F6FB] border border-[#DCE3ED] rounded-xl p-1 gap-1">
              <span className="text-[11px] font-semibold text-[#667085] px-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#2E6FB0]" />
                Role Switcher:
              </span>
              {personas.slice(0, 4).map((p) => {
                const isActive = user?.id === p.user.id;
                return (
                  <button
                    key={p.user.id}
                    onClick={() => switchPersona(p.user.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-white text-[#13284A] shadow-xs font-semibold border border-[#DCE3ED]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {p.user.role === 'admin' ? 'Admin' : p.user.role === 'teacher' ? `Faculty (${p.teacher?.teacherCode})` : `Student (${p.student?.usn?.slice(-3)})`}
                  </button>
                );
              })}
            </div>

            {/* Right Action Tools: Notifications, User Profile, Switcher Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Network Status Badge */}
              {!isOnline ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold shadow-2xs"
                  title="Offline Mode Active: Serving local storage cache"
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  <span className="hidden sm:inline">Offline</span>
                </div>
              ) : (
                <button
                  onClick={() => storageService.setSimulatedOffline(true)}
                  title="Simulate Offline Mode to test Local Storage caching"
                  className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>Online</span>
                </button>
              )}

              {/* Notifications Button */}
              <button
                id="header-notification-btn"
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-[#13284A] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C0392B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Dropdown / Switcher */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#DCE3ED] hover:bg-slate-50 transition-all bg-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-[#13284A] border border-slate-200">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#13284A] truncate max-w-[130px]">
                      {user?.name || 'Academic User'}
                    </div>
                    <div className="text-[11px] text-[#667085] leading-none mt-0.5">
                      {getRoleBadge()}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isPersonaMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsPersonaMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#DCE3ED] py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-[#667085] uppercase">Signed In As</p>
                        <p className="text-sm font-bold text-[#13284A] mt-0.5">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-2">{getRoleBadge()}</div>
                      </div>

                      {/* Switch Persona section */}
                      <div className="p-2">
                        <p className="px-2 py-1 text-[11px] font-bold text-[#667085] uppercase tracking-wider">
                          Switch User Persona
                        </p>
                        <div className="max-h-56 overflow-y-auto space-y-1 mt-1">
                          {personas.map((p) => (
                            <button
                              key={p.user.id}
                              onClick={() => {
                                switchPersona(p.user.id);
                                setIsPersonaMenuOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                                user?.id === p.user.id
                                  ? 'bg-blue-50/80 text-[#13284A] font-semibold border border-[#2E6FB0]/30'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-md bg-slate-200/80 shrink-0 flex items-center justify-center font-bold text-[10px]">
                                {p.user.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-semibold">{p.user.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{p.displaySub}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 p-2">
                        {onOpenLoginModal && (
                          <button
                            onClick={() => {
                              setIsPersonaMenuOpen(false);
                              onOpenLoginModal();
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            Login with Another Account
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsPersonaMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Notifications */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};
