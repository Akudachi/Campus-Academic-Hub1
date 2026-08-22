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
import { AppLogo } from './AppLogo';

interface HeaderProps {
  onOpenLoginModal?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLoginModal, onNavigate }) => {
  const { user, teacher, student, role, personas, switchPersona, logout, unreadCount } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState("K.L.E. College of Engineering & Technology");
  const [academicYear, setAcademicYear] = useState('2026–27');
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

  const getRoleBadge = (isCompact = false) => {
    switch (role) {
      case 'admin':
        return (
          <span className={`inline-flex items-center gap-1 font-bold bg-[#13284A] text-white tracking-wide rounded-full shadow-2xs ${
            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
          }`}>
            <ShieldCheck className="w-3 h-3 text-[#5B93D1]" />
            ADMIN
          </span>
        );
      case 'teacher':
        return (
          <span className={`inline-flex items-center gap-1 font-bold bg-[#2E6FB0] text-white tracking-wide rounded-full shadow-2xs ${
            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
          }`}>
            <BookOpen className="w-3 h-3" />
            {teacher?.teacherCode || 'FACULTY'}
          </span>
        );
      case 'student':
        return (
          <span className={`inline-flex items-center gap-1 font-bold bg-[#1E8E5A] text-white tracking-wide rounded-full shadow-2xs ${
            isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
          }`}>
            <GraduationCap className="w-3 h-3" />
            {student?.usn ? student.usn.slice(-6) : 'STUDENT'}
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCE3ED] shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo & College Info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs shrink-0 ring-1 ring-slate-200">
                <AppLogo className="w-full h-full" withSquircle={true} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-heading text-sm sm:text-base lg:text-lg font-bold text-[#13284A] tracking-tight truncate">
                    KLECET Portal
                  </h1>
                  <span className="text-[8px] sm:text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] truncate hidden sm:flex items-center gap-1.5">
                  <span className="font-medium">{institutionName}</span>
                  <span>•</span>
                  <span>AY {academicYear}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#2E6FB0] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">{currentTerm}</span>
                </p>
                <div className="sm:hidden flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                    {institutionName}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Institutional Status Badge (Desktop) */}
            <div className="hidden lg:flex items-center bg-[#F3F6FB] border border-[#DCE3ED] rounded-xl px-3 py-1.5 gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-[#13284A]">
                {institutionName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-mono font-bold text-[#2E6FB0]">
                AY {academicYear}
              </span>
            </div>

            {/* Right Action Tools: Network, Notifications, Persona Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Network Status Badge */}
              {!isOnline && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 text-[10px] sm:text-xs font-bold shadow-2xs"
                  title="Offline Mode Active"
                >
                  <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 animate-pulse" />
                  <span className="hidden xs:inline">Offline</span>
                </div>
              )}

              {/* Notifications Button */}
              <button
                id="header-notification-btn"
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-[#13284A] hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 active:scale-95"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C0392B] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Quick Sign Out Button (Desktop) */}
              <button
                type="button"
                id="header-direct-logout-btn"
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100/90 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>

              {/* Mobile Role Switcher Pill & Desktop Profile Dropdown */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#DCE3ED] hover:bg-slate-50 transition-all bg-white shadow-2xs active:scale-95 cursor-pointer"
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                    role === 'admin' ? 'bg-[#13284A]' : role === 'teacher' ? 'bg-[#2E6FB0]' : 'bg-[#1E8E5A]'
                  }`}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  
                  {/* Mobile Role Label */}
                  <div className="sm:hidden flex items-center gap-1 pr-1">
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Desktop Role Details */}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#13284A] truncate max-w-[130px]">
                      {user?.name || 'Academic User'}
                    </div>
                    <div className="text-[11px] text-[#667085] leading-none mt-0.5">
                      {getRoleBadge(true)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu / Switcher Sheet */}
                {isPersonaMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-slate-900/30 sm:bg-transparent"
                      onClick={() => setIsPersonaMenuOpen(false)}
                    />
                    <div className="fixed sm:absolute right-0 bottom-0 sm:bottom-auto sm:top-full sm:mt-2 w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#DCE3ED] py-2 z-50 animate-slide-up sm:animate-fade-in max-h-[85vh] flex flex-col">
                      {/* Mobile Sheet Handle */}
                      <div className="sm:hidden pt-2 pb-1 flex justify-center items-center">
                        <div className="w-10 h-1 rounded-full bg-slate-300" />
                      </div>

                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Current Account</p>
                        <p className="text-sm font-bold text-[#13284A] mt-0.5">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-2">{getRoleBadge()}</div>
                      </div>

                      {/* Quick Portal Switcher for Admins if available */}
                      {role === 'admin' && personas.length > 1 && (
                        <div className="p-3 overflow-y-auto max-h-48 border-b border-slate-100">
                          <div className="flex items-center justify-between px-1 mb-2">
                            <p className="text-[11px] font-bold text-[#667085] uppercase tracking-wider flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-[#2E6FB0]" />
                              Quick Portal Switch (Admin)
                            </p>
                          </div>
                          <div className="space-y-1">
                            {personas.filter((p) => p.user.id !== user?.id).slice(0, 5).map((p) => {
                              return (
                                <button
                                  key={p.user.id}
                                  onClick={() => {
                                    switchPersona(p.user.id);
                                    setIsPersonaMenuOpen(false);
                                  }}
                                  className="w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 hover:bg-slate-100 text-slate-700 bg-white border border-slate-200/80 cursor-pointer"
                                >
                                  <div className="min-w-0 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.user.role === 'admin' ? 'bg-[#13284A]' : p.user.role === 'teacher' ? 'bg-[#2E6FB0]' : 'bg-emerald-600'}`} />
                                    <div className="truncate font-semibold text-xs">{p.user.name}</div>
                                  </div>
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                    {p.user.role}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-2 bg-slate-50/80 rounded-b-2xl space-y-1">
                        {onOpenLoginModal && (
                          <button
                            onClick={() => {
                              setIsPersonaMenuOpen(false);
                              onOpenLoginModal();
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            Switch Portal / Change Account
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsPersonaMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
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
