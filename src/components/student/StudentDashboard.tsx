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

  const hasShortage = (data?.overallAttendance || 0) < 80;
  const isCritical = (data?.overallAttendance || 0) < 50;

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">
              Student Academic Terminal
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#13284A] text-white">
              {student?.usn || data?.student?.usn || '2KL23CS001'}
            </span>
          </div>
          <p className="text-xs text-[#667085]">
            {data?.student?.name || user?.name} • {data?.student?.department} Department • Semester {data?.student?.currentSemester} (Sec {data?.student?.section})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Read-Only Roster
          </span>
        </div>
      </div>

      {/* Attendance Shortage Warning Alert */}
      {hasShortage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            isCritical
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <AlertTriangle className={`w-5 h-5 shrink-0 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isCritical ? 'CRITICAL ATTENDANCE ALERT (<50%)' : 'INSTITUTIONAL ATTENDANCE SHORTAGE WARNING (<80%)'}
            </h4>
            <p className="text-xs leading-relaxed">
              Your overall cumulative attendance is currently at{' '}
              <strong className="font-mono">{data?.overallAttendance}%</strong>. Institutional regulations mandate a minimum of 80% attendance to be eligible for end-semester examinations. Please contact your course faculty.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Overall Attendance"
          value={`${data?.overallAttendance || 0}%`}
          subtitle="Across all enrolled courses"
          icon={BookOpen}
          accentColor={hasShortage ? (isCritical ? 'red' : 'amber') : 'green'}
        />
        <MetricCard
          title="Pending Coursework"
          value={data?.pendingAssignmentsCount || 0}
          subtitle="Assignments awaiting submission"
          icon={FileCheck2}
          accentColor="blue"
        />
        <MetricCard
          title="Published Test Results"
          value={data?.publishedMarksCount || 0}
          subtitle="Official internal test evaluations"
          icon={Award}
          accentColor="navy"
        />
      </div>

      {/* Subject-Wise Attendance Overview */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
            Subject-wise Attendance Status
          </h3>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-[#2E6FB0] hover:underline"
          >
            Detailed Ledger →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(data?.subjectAttendance || []).map((sub: any, index: number) => (
            <div key={sub.subjectId || sub.subjectCode || `sub-att-${index}`} className="p-4 flex items-center justify-between hover:bg-slate-50 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#13284A]">{sub.subjectCode}</span>
                  <span className="font-bold text-slate-800">{sub.subjectName}</span>
                </div>
                <p className="text-[#667085]">
                  Classes Attended: <span className="font-semibold text-slate-700">{sub.attendedClasses} of {sub.totalClasses}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full ${
                      sub.percentage < 50
                        ? 'bg-rose-600'
                        : sub.percentage < 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs">{sub.percentage}%</span>
                <StatusPill status={sub.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent Notices & Upcoming Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Notices */}
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-[#2E6FB0]" />
              Recent Circulars
            </h3>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-semibold text-[#2E6FB0] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {(data?.recentNotices || []).slice(0, 3).map((n: any, idx: number) => (
              <div key={n.id || `not-item-${idx}`} className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#13284A] line-clamp-1">{n.title}</span>
                  <StatusPill status={n.priority} size="sm" />
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              Upcoming Events
            </h3>
            <button
              onClick={() => onNavigate('notices-events')}
              className="text-xs font-semibold text-[#2E6FB0] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {(data?.upcomingEvents || []).slice(0, 3).map((ev: any, idx: number) => (
              <div key={ev.id || `ev-item-${idx}`} className="p-2.5 rounded-lg bg-purple-50/40 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#13284A]">{ev.title}</span>
                  <span className="font-semibold text-purple-700">{new Date(ev.date).toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-slate-600">{ev.venue} • {ev.organizer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
