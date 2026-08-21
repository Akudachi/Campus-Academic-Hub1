import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Info,
  Calendar,
  Sparkles,
  Search,
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
  const [filterType, setFilterType] = useState<'all' | 'shortage' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const canMiss = Math.floor((attended - 0.8 * total) / 0.8);
      return canMiss > 0
        ? `Safe buffer: You can miss up to ${canMiss} upcoming class${canMiss > 1 ? 'es' : ''} and remain >=80%.`
        : `On boundary: You must attend the next lecture to stay above 80%.`;
    } else {
      const needed = Math.ceil((0.8 * total - attended) / 0.2);
      return `Shortage Alert: You must attend the next ${needed} consecutive class${needed > 1 ? 'es' : ''} without absence to restore 80%.`;
    }
  };

  const filteredSubjects = useMemo(() => {
    const list = data?.subjects || [];
    return list.filter((sub) => {
      const matchesSearch =
        sub.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'shortage') return sub.percentage < 80;
      if (filterType === 'safe') return sub.percentage >= 80;
      return true;
    });
  }, [data?.subjects, filterType, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in pb-6">
      {/* Mobile-First Header Bar */}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <BackButton onClick={onBack} label="Back to Home" />
        ) : (
          <h1 className="text-lg sm:text-xl font-bold text-[#13284A] font-display">
            Attendance Ledger
          </h1>
        )}

        <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold shadow-2xs ${
          overall >= 80 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          Overall: {overall}%
        </span>
      </div>

      {/* Warning Banner if Shortage */}
      {(hasShortage || hasSubjectShortage) && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <h4 className="font-extrabold uppercase tracking-wider text-amber-900">
              Institutional Minimum Attendance: 80%
            </h4>
            <p className="text-amber-800">
              College policy requires at least 80% attendance in each course. Courses falling below 50% are subject to debarment from semester exams.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
          subtitle="Total conducted sessions"
          icon={CheckCircle2}
          accentColor="blue"
        />
        <MetricCard
          title="Courses in Shortage"
          value={(data?.subjects || []).filter((s) => s.percentage < 80).length}
          subtitle="Courses requiring recovery"
          icon={ShieldAlert}
          accentColor={hasSubjectShortage ? 'amber' : 'green'}
        />
      </div>

      {/* Mobile Segmented Filter Controls */}
      <div className="bg-white p-3 rounded-2xl border border-[#DCE3ED] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* iOS Segmented Control */}
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'all' ? 'bg-white text-[#13284A] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({data?.subjects?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('shortage')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'shortage' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Shortage ({(data?.subjects || []).filter((s) => s.percentage < 80).length})
            </button>
            <button
              onClick={() => setFilterType('safe')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Safe ({(data?.subjects || []).filter((s) => s.percentage >= 80).length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2E6FB0]"
            />
          </div>
        </div>
      </div>

      {/* Course Breakdown Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading attendance breakdown...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
            No courses match the selected filter.
          </div>
        ) : (
          filteredSubjects.map((sub, idx) => {
            const isGood = sub.percentage >= 80;
            const isCritical = sub.percentage < 50;

            return (
              <div
                key={sub.subjectId || sub.subjectCode || `sub-breakdown-${idx}`}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE3ED] shadow-2xs space-y-3.5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[#13284A]">
                        {sub.subjectCode}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[#13284A] truncate">{sub.subjectName}</h4>
                    </div>
                    <p className="text-[11px] text-[#667085]">
                      Faculty: <span className="font-semibold text-slate-700">{sub.teacherName || 'Faculty Assigned'}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className={`font-mono text-lg font-black ${isGood ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {sub.percentage}%
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {sub.attendedClasses} / {sub.totalClasses} classes
                      </p>
                    </div>
                    <StatusPill status={sub.status} size="md" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
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
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-start gap-2.5 text-xs">
                  <HelpCircle className="w-4 h-4 text-[#2E6FB0] shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-relaxed font-medium">
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

