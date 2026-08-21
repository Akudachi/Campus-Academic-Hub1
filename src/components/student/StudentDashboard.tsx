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
  const { user, student } = useAuth();
  const [data, setData] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

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

  const overallAtt = data?.overallAttendance || 0;
  const hasShortage = overallAtt < 80;
  const isCritical = overallAtt < 50;

  const quickNav = [
    { id: 'attendance', label: 'Attendance Ledger', icon: Clock, count: `${overallAtt}%`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'assignments', label: 'Assignments', icon: FileCheck2, count: `${data?.pendingAssignmentsCount || 0} Pending`, color: 'bg-blue-50 text-[#2E6FB0] border-blue-200' },
    { id: 'marks', label: 'Test Marks', icon: Award, count: `${data?.publishedMarksCount || 0} Evaluated`, color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { id: 'notices-events', label: 'Circulars & Events', icon: Megaphone, count: `${(data?.recentNotices?.length || 0) + (data?.upcomingEvents?.length || 0)} Updates`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Digital Identity Card (Instagram / Consumer App inspired) */}
      <div className="bg-linear-to-r from-[#13284A] via-[#1E3A63] to-[#2E6FB0] p-6 sm:p-7 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            {/* Student Avatar Visual */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold font-display shadow-md shrink-0">
              {(data?.student?.name || user?.name || 'S').charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E0982A] text-slate-900 shadow-xs">
                  {student?.usn || data?.student?.usn || '2KL23CS001'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/10">
                  {data?.student?.department || 'CSE'} Dept
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Student
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                {data?.student?.name || user?.name || 'Student'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Semester {data?.student?.currentSemester || 4} • Section {data?.student?.section || 'A'} • Academic Year 2025–26
              </p>
            </div>
          </div>

          {/* Quick Attendance Dial Badge */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Overall Attendance
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {overallAtt}%
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
                hasShortage
                  ? isCritical
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400 text-slate-900'
                  : 'bg-emerald-400 text-slate-900'
              }`}
            >
              {overallAtt >= 80 ? '✓' : '!'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid (Swiggy / Consumer style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-4 rounded-xl border bg-white text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-98 flex flex-col justify-between space-y-3 group ${item.color}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-2 rounded-lg bg-white shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#13284A] font-heading">{item.label}</h3>
                <span className="text-[11px] font-bold opacity-80 mt-0.5 block">{item.count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Attendance Shortage Warning Alert */}
      {hasShortage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
            isCritical
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider font-heading">
              {isCritical ? 'CRITICAL ATTENDANCE ALERT (<50%)' : 'INSTITUTIONAL ATTENDANCE SHORTAGE WARNING (<80%)'}
            </h4>
            <p className="text-xs leading-relaxed">
              Your overall cumulative attendance is currently at{' '}
              <strong className="font-mono">{overallAtt}%</strong>. Institutional regulations mandate a minimum of 80% attendance to be eligible for end-semester examinations. Please maintain regular attendance.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Overall Attendance"
          value={`${overallAtt}%`}
          subtitle="Across all enrolled courses"
          icon={BookOpen}
          accentColor={hasShortage ? (isCritical ? 'red' : 'amber') : 'green'}
        />
        <MetricCard
          title="Pending Assignments"
          value={data?.pendingAssignmentsCount || 0}
          subtitle="Awaiting course submission"
          icon={FileCheck2}
          accentColor="blue"
        />
        <MetricCard
          title="Published Test Results"
          value={data?.publishedMarksCount || 0}
          subtitle="Internal evaluations published"
          icon={Award}
          accentColor="navy"
        />
      </div>

      {/* Subject-Wise Attendance Overview with Modern Bars */}
      <div className="bg-white rounded-2xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2E6FB0]" />
            <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
              Course-wise Attendance Status
            </h2>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-[#2E6FB0] hover:underline flex items-center gap-1"
          >
            Detailed Ledger <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(data?.subjectAttendance || []).map((sub: any, index: number) => (
            <div key={sub.subjectId || sub.subjectCode || `sub-att-${index}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 text-xs transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#13284A] border border-slate-200 text-[11px]">
                    {sub.subjectCode}
                  </span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{sub.subjectName}</span>
                </div>
                <p className="text-[#667085]">
                  Attended: <strong className="text-slate-700">{sub.attendedClasses}</strong> of <strong className="text-slate-700">{sub.totalClasses}</strong> classes conducted
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
                <span className="font-mono font-extrabold text-xs w-10 text-right">{sub.percentage}%</span>
                <StatusPill status={sub.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent Notices & Upcoming Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Notices */}
        <div className="bg-white rounded-2xl border border-[#DCE3ED] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-[#2E6FB0]" />
              Recent Circulars
            </h2>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-semibold text-[#2E6FB0] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2.5">
            {(data?.recentNotices || []).length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">No circulars posted yet.</p>
            ) : (
              (data?.recentNotices || []).slice(0, 3).map((n: any, idx: number) => (
                <div key={n.id || `not-item-${idx}`} className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between">
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
        <div className="bg-white rounded-2xl border border-[#DCE3ED] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              Upcoming Events
            </h2>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-semibold text-[#2E6FB0] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2.5">
            {(data?.upcomingEvents || []).length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">No upcoming events scheduled.</p>
            ) : (
              (data?.upcomingEvents || []).slice(0, 3).map((ev: any, idx: number) => (
                <div key={ev.id || `ev-item-${idx}`} className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 space-y-1 hover:border-purple-200 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#13284A]">{ev.title}</span>
                    <span className="font-semibold text-purple-700">{new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{ev.venue} • {ev.organizer}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
