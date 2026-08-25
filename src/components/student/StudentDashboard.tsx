import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  FileCheck2,
  Award,
  AlertTriangle,
  Clock,
  Megaphone,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  TrendingUp,
  User,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StudentDashboardSummary } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { useAuth } from '../../context/AuthContext';

interface StudentDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user, student, showToast } = useAuth();
  const [data, setData] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUsn, setCopiedUsn] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleCopyUsn = () => {
    const usn = student?.usn || data?.student?.usn || '2KL23CS001';
    navigator.clipboard.writeText(usn);
    setCopiedUsn(true);
    showToast('USN copied to clipboard!', 'success');
    setTimeout(() => setCopiedUsn(false), 2000);
  };

  const overallAtt = data?.overallAttendance || 0;
  const hasShortage = overallAtt < 80;
  const isCritical = overallAtt < 50;

  const quickNav = [
    {
      id: 'attendance',
      label: 'Attendance',
      sublabel: `${overallAtt}% Present`,
      icon: Clock,
      badge: overallAtt >= 80 ? 'Good' : 'Shortage',
      badgeColor: overallAtt >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
      iconBg: 'bg-emerald-500 text-white',
      border: 'border-emerald-100 hover:border-emerald-300',
    },
    {
      id: 'assignments',
      label: 'Assignments',
      sublabel: `${data?.pendingAssignmentsCount || 0} Due`,
      icon: FileCheck2,
      badge: data?.pendingAssignmentsCount ? `${data.pendingAssignmentsCount} Active` : 'Done',
      badgeColor: data?.pendingAssignmentsCount ? 'bg-sky-100 text-[#2E6FB0]' : 'bg-slate-100 text-slate-700',
      iconBg: 'bg-[#2E6FB0] text-white',
      border: 'border-sky-100 hover:border-sky-300',
    },
    {
      id: 'marks',
      label: 'Test Marks',
      sublabel: `${data?.publishedMarksCount || 0} Results`,
      icon: Award,
      badge: 'Evaluated',
      badgeColor: 'bg-amber-100 text-amber-900',
      iconBg: 'bg-[#E0982A] text-slate-950',
      border: 'border-amber-100 hover:border-amber-300',
    },
    {
      id: 'notices-events',
      label: 'Circulars',
      sublabel: `${(data?.recentNotices?.length || 0) + (data?.upcomingEvents?.length || 0)} Updates`,
      icon: Megaphone,
      badge: 'Live',
      badgeColor: 'bg-purple-100 text-purple-800',
      iconBg: 'bg-purple-600 text-white',
      border: 'border-purple-100 hover:border-purple-300',
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Student Digital Campus Pass / ID Card (Apple Wallet Inspired) */}
      <div className="bg-linear-to-br from-[#13284A] via-[#1A345B] to-[#2E6FB0] p-5 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/15">
        {/* Holographic Watermark Glow */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <GraduationCap className="w-36 h-36 text-white" />
        </div>

        <div className="relative z-10 flex flex-col justify-between gap-5">
          {/* Card Top Strip */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20">
                STUDENT PASS
              </span>
              <span className="text-[11px] font-semibold text-slate-200">
                {data?.student?.department || student?.department || 'CSE'} Dept
              </span>
            </div>

            <button
              onClick={handleCopyUsn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-[11px] font-mono font-bold text-amber-300 border border-white/20 transition-all cursor-pointer shadow-2xs"
              title="Click to copy USN"
            >
              {copiedUsn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{student?.usn || data?.student?.usn || '2KL23CS001'}</span>
            </button>
          </div>

          {/* Student Profile & Attendance Gauge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center text-white text-xl sm:text-2xl font-black font-display shadow-md shrink-0 ring-2 ring-white/20">
                {(data?.student?.user?.name || data?.student?.name || user?.name || 'S').charAt(0)}
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display text-white truncate">
                  {data?.student?.user?.name || data?.student?.name || user?.name || 'Student'}
                </h1>
                <p className="text-xs text-slate-200 font-medium mt-0.5">
                  Semester {data?.student?.currentSemester || student?.currentSemester || 4} • Section {data?.student?.section || 'A'}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3" />
                    Enrolled • AY 2025–26
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Circular Progress Badge */}
            <div
              onClick={() => onNavigate('attendance')}
              className="bg-white/10 hover:bg-white/15 active:scale-95 transition-all backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 flex items-center justify-between sm:justify-start gap-4 shrink-0 cursor-pointer group"
            >
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-300 block tracking-wider">
                  Attendance
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {overallAtt}%
                  </span>
                  <span className={`text-[10px] font-extrabold ${overallAtt >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {overallAtt >= 80 ? 'Safe' : 'Shortage'}
                  </span>
                </div>
              </div>

              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-inner ${
                hasShortage
                  ? isCritical
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400 text-slate-900'
                  : 'bg-emerald-400 text-slate-900'
              }`}>
                {overallAtt >= 80 ? '✓' : '!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Touch Tiles (Mobile Native Style) */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#667085] mb-2.5 px-1">
          Quick Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {quickNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`p-3.5 sm:p-4 rounded-2xl bg-white border border-[#DCE3ED] text-left transition-all active:scale-95 shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3 cursor-pointer group ${item.border}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${item.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#13284A] font-heading group-hover:text-[#2E6FB0] transition-colors flex items-center justify-between">
                    <span>{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                    {item.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attendance Shortage Warning Alert if needed */}
      {hasShortage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-2xs ${
            isCritical
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold uppercase tracking-wider">
              {isCritical ? 'Critical Attendance Warning (<50%)' : 'Attendance Shortage Warning (<80%)'}
            </h4>
            <p className="text-slate-700 leading-relaxed">
              Your overall attendance is currently at <strong className="font-mono font-bold">{overallAtt}%</strong>. Institutional policy requires at least 80% to avoid exam debarment.
            </p>
          </div>
        </div>
      )}

      {/* Subject-Wise Attendance Breakdown Cards */}
      <div className="bg-white rounded-3xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-[#DCE3ED] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2E6FB0] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#13284A] uppercase tracking-wider font-heading">
                Course Attendance
              </h2>
              <p className="text-[11px] text-[#667085]">
                Semester {data?.student?.currentSemester || student?.currentSemester || 4} registered coursework
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-[#2E6FB0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Full Ledger <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 p-2 sm:p-3">
          {(data?.subjectAttendance || []).map((sub: any, index: number) => {
            const isSubShortage = sub.percentage < 80;
            return (
              <div
                key={sub.subjectId || sub.subjectCode || `sub-att-${index}`}
                onClick={() => onNavigate('attendance')}
                className="p-3 sm:p-4 rounded-2xl hover:bg-slate-50/80 active:scale-[0.99] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-[#13284A] border border-slate-200 text-[10px]">
                      {sub.subjectCode}
                    </span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                      {sub.subjectName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Attended <strong className="text-slate-800 font-bold">{sub.attendedClasses}</strong> of <strong className="text-slate-800 font-bold">{sub.totalClasses}</strong> classes
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                  <div className="w-24 sm:w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sub.percentage < 50
                          ? 'bg-rose-600'
                          : sub.percentage < 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    />
                  </div>
                  <span className={`font-mono font-extrabold text-xs w-12 text-right ${isSubShortage ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {sub.percentage}%
                  </span>
                  <StatusPill status={sub.status} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Circulars & Events Dual Mobile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notices */}
        <div className="bg-white rounded-3xl border border-[#DCE3ED] shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#2E6FB0] flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
                Campus Circulars
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-bold text-[#2E6FB0] hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2">
            {(data?.recentNotices || []).length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">No active circulars.</p>
            ) : (
              (data?.recentNotices || []).slice(0, 2).map((n: any, idx: number) => (
                <div
                  key={n.id || `not-item-${idx}`}
                  onClick={() => onNavigate('notices-events')}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-blue-200 active:scale-[0.99] transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#13284A] line-clamp-1">{n.title}</span>
                    <StatusPill status={n.priority} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-3xl border border-[#DCE3ED] shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
                Upcoming Events
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-bold text-[#2E6FB0] hover:underline cursor-pointer"
            >
              Calendar →
            </button>
          </div>

          <div className="space-y-2">
            {(data?.upcomingEvents || []).length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">No upcoming events scheduled.</p>
            ) : (
              (data?.upcomingEvents || []).slice(0, 2).map((ev: any, idx: number) => (
                <div
                  key={ev.id || `ev-item-${idx}`}
                  onClick={() => onNavigate('notices-events')}
                  className="p-3 rounded-2xl bg-purple-50/30 border border-purple-100/70 hover:border-purple-200 active:scale-[0.99] transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-[#13284A] truncate">{ev.title}</span>
                    <span className="font-extrabold text-purple-700 shrink-0 text-[11px]">
                      {new Date(ev.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">{ev.venue} • {ev.organizer}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

