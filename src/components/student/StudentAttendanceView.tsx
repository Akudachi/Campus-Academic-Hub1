import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StatusPill } from '../common/StatusPill';
import { MetricCard } from '../common/MetricCard';
import { BackButton } from '../common/BackButton';

interface StudentAttendanceViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ onBack, onNavigate }) => {
  const [data, setData] = useState<{
    overallPercentage: number;
    totalAllClasses: number;
    totalAllAttended: number;
    subjects: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentAttendance();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const overall = data?.overallPercentage || 0;
  const hasShortage = overall < 80;
  const hasSubjectShortage = (data?.subjects || []).some((s) => s.percentage < 80);

  // Helper: calculate classes needed to reach 80% or safe margin
  const getMarginAdvice = (attended: number, total: number) => {
    if (total === 0) return 'No classes conducted yet.';
    const currentPct = (attended / total) * 100;
    if (currentPct >= 80) {
      // Calculate how many can miss
      const canMiss = Math.floor((attended - 0.8 * total) / 0.8);
      return canMiss > 0
        ? `Safe buffer: You can miss up to ${canMiss} upcoming class${canMiss > 1 ? 'es' : ''} and remain >=80%.`
        : `On boundary: You must attend the next lecture to stay above 80%.`;
    } else {
      // Calculate consecutive classes needed: (attended + x)/(total + x) >= 0.8 => attended + x >= 0.8*total + 0.8*x => 0.2*x >= 0.8*total - attended
      const needed = Math.ceil((0.8 * total - attended) / 0.2);
      return `Shortage Alert: You must attend the next ${needed} consecutive class${needed > 1 ? 'es' : ''} without absence to restore 80%.`;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Dashboard" />
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">
            Verified Attendance Records
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Course-by-course attendance logs synchronized in real-time from faculty submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#13284A] text-white">
            Overall: {overall}%
          </span>
        </div>
      </div>

      {/* Warning Banner */}
      {(hasShortage || hasSubjectShortage) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <h4 className="font-bold uppercase tracking-wider text-amber-900">
              Institutional Attendance Shortage Alert
            </h4>
            <p>
              Apex Institute of Technology regulations mandate that all students maintain a minimum of 80% attendance in each registered theory and practical course. Courses falling below 80% require formal departmental review, and courses below 50% are subject to examination debarment.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Overall Attendance"
          value={`${overall}%`}
          subtitle="Cumulative across all courses"
          icon={BookOpen}
          accentColor={overall < 50 ? 'red' : overall < 80 ? 'amber' : 'green'}
        />
        <MetricCard
          title="Classes Attended"
          value={`${data?.totalAllAttended || 0} / ${data?.totalAllClasses || 0}`}
          subtitle="Total lecture & lab sessions"
          icon={CheckCircle2}
          accentColor="blue"
        />
        <MetricCard
          title="Courses in Shortage"
          value={(data?.subjects || []).filter((s) => s.percentage < 80).length}
          subtitle="Courses requiring recovery"
          icon={ShieldAlert}
          accentColor={hasSubjectShortage ? 'amber' : 'slate'}
        />
      </div>

      {/* Subject-Wise Detailed Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
          Individual Course Breakdown
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading attendance breakdown...</div>
        ) : (
          (data?.subjects || []).map((sub, idx) => {
            const isGood = sub.percentage >= 80;
            const isCritical = sub.percentage < 50;

            return (
              <div
                key={sub.subjectId || sub.subjectCode || `sub-breakdown-${idx}`}
                className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {sub.subjectCode}
                      </span>
                      <h4 className="text-base font-bold text-[#13284A]">{sub.subjectName}</h4>
                    </div>
                    <p className="text-xs text-[#667085] mt-1">
                      Faculty: <span className="font-semibold text-slate-700">{sub.teacherName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-[#13284A]">{sub.percentage}%</span>
                      <p className="text-[11px] text-[#667085]">
                        {sub.attendedClasses} of {sub.totalClasses} Conducted
                      </p>
                    </div>
                    <StatusPill status={sub.status} size="md" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical
                        ? 'bg-rose-600'
                        : isGood
                        ? 'bg-emerald-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  />
                </div>

                {/* Margin Calculator / Attendance Advice */}
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-100 flex items-start gap-2 text-xs">
                  <HelpCircle className="w-4 h-4 text-[#2E6FB0] shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-snug">
                    {getMarginAdvice(sub.attendedClasses, sub.totalClasses)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
