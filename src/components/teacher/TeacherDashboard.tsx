import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Users,
  CheckCircle2,
  FileCheck2,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  GraduationCap,
  Zap,
  ChevronRight,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StatusPill } from '../common/StatusPill';

interface TeacherDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { user, teacher } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subRes, sessRes] = await Promise.all([
          api.getTeacherSubjects(),
          api.getTeacherAttendanceSessions(),
        ]);
        setSubjects(subRes.subjects || []);
        setRecentSessions(sessRes.sessions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute distinct semesters assigned to this faculty
  const assignedSemesters = useMemo(() => {
    const semMap = new Map<number, { semesterNumber: number; department: string; count: number; subjects: any[] }>();

    subjects.forEach((sub) => {
      const semNum = Number(sub.semesterNumber) || 4;
      const dept = sub.departmentCode || sub.department || 'CSE';
      if (!semMap.has(semNum)) {
        semMap.set(semNum, {
          semesterNumber: semNum,
          department: dept,
          count: 0,
          subjects: [],
        });
      }
      const entry = semMap.get(semNum)!;
      entry.count += 1;
      entry.subjects.push(sub);
    });

    return Array.from(semMap.values()).sort((a, b) => a.semesterNumber - b.semesterNumber);
  }, [subjects]);

  // Filter subjects based on selected semester
  const filteredSubjects = useMemo(() => {
    if (selectedSemester === 'all') return subjects;
    const targetSem = Number(selectedSemester);
    return subjects.filter((s) => (Number(s.semesterNumber) || 4) === targetSem);
  }, [subjects, selectedSemester]);

  // Filter recent sessions based on selected semester
  const filteredSessions = useMemo(() => {
    if (selectedSemester === 'all') return recentSessions.slice(0, 5);
    const targetSem = Number(selectedSemester);
    const semSubjectIds = subjects
      .filter((s) => (Number(s.semesterNumber) || 4) === targetSem)
      .map((s) => s.id || s.subjectId);

    return recentSessions
      .filter((sess) => semSubjectIds.includes(sess.subjectId))
      .slice(0, 5);
  }, [recentSessions, subjects, selectedSemester]);

  const totalEnrolledInSelection = useMemo(() => {
    return filteredSubjects.reduce((acc, s) => acc + (s.enrolledStudentsCount || s.studentsCount || 0), 0);
  }, [filteredSubjects]);

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Header Banner */}
      <div className="bg-[#13284A] p-4 sm:p-5 rounded-2xl text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#E0982A] text-slate-950">
                {teacher?.teacherCode || 'FACULTY'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-white">
                {teacher?.department || 'CSE'} Department
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {teacher?.designation || 'Faculty'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              {user?.name || 'Faculty Portal'}
            </h1>
            <p className="text-[11px] text-slate-300">
              {todayDateStr} • {assignedSemesters.length} Teaching Cohorts • {subjects.length} Assigned Courses
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <button
              id="quick-take-attendance-btn"
              onClick={() => onNavigate('attendance')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-white text-[#13284A] hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 text-[#2E6FB0]" />
              <span>Mark Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Cards (High Contrast & Clear) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onNavigate('attendance')}
          className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0] transition-all text-left flex flex-col justify-between group active:scale-98"
        >
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 w-fit mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#13284A] block truncate">Attendance</span>
            <span className="text-[10px] text-slate-500 block truncate">Digital Roll Call</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('marks')}
          className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0] transition-all text-left flex flex-col justify-between group active:scale-98"
        >
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 w-fit mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#13284A] block truncate">Internal Marks</span>
            <span className="text-[10px] text-slate-500 block truncate">IA1, IA2 & Lab</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('assignments')}
          className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0] transition-all text-left flex flex-col justify-between group active:scale-98"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 w-fit mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#13284A] block truncate">Tasks & Work</span>
            <span className="text-[10px] text-slate-500 block truncate">Post Assignments</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('notices-events')}
          className="p-3.5 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0] transition-all text-left flex flex-col justify-between group active:scale-98"
        >
          <div className="p-2 rounded-lg bg-blue-50 text-[#2E6FB0] w-fit mb-2 group-hover:bg-[#2E6FB0] group-hover:text-white transition-colors">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#13284A] block truncate">Notices & Circulars</span>
            <span className="text-[10px] text-slate-500 block truncate">Campus Updates</span>
          </div>
        </button>
      </div>

      {/* Cohort Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#13284A] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2E6FB0]" />
            Semester Filter
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">{filteredSubjects.length} Active Courses</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="sem-filter-all-btn"
            onClick={() => setSelectedSemester('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedSemester === 'all'
                ? 'bg-[#13284A] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Semesters</span>
            <span className="text-[10px] opacity-80">({subjects.length})</span>
          </button>

          {assignedSemesters.map((sem) => {
            const isSelected = selectedSemester === String(sem.semesterNumber);
            return (
              <button
                key={`sem-btn-${sem.semesterNumber}`}
                id={`sem-filter-btn-${sem.semesterNumber}`}
                onClick={() => setSelectedSemester(String(sem.semesterNumber))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2E6FB0] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Sem {sem.semesterNumber}</span>
                <span className="text-[10px] opacity-80">({sem.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Courses</span>
          <span className="text-base sm:text-lg font-bold text-[#13284A]">{filteredSubjects.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Recent Sessions</span>
          <span className="text-base sm:text-lg font-bold text-emerald-700">{filteredSessions.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Total Students</span>
          <span className="text-base sm:text-lg font-bold text-[#2E6FB0]">{totalEnrolledInSelection}</span>
        </div>
      </div>

      {/* Assigned Subjects List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#13284A] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#2E6FB0]" />
            My Assigned Courses
          </span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-[#DCE3ED] text-xs text-slate-500">
            No subjects assigned for this semester.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSubjects.map((sub, index) => (
              <div
                key={sub.id || sub.subjectId || sub.code || `sub-item-${index}`}
                className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0]/60 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-[#13284A] border border-slate-200">
                        {sub.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Sem {sub.semesterNumber} • {sub.credits || 4} Credits
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#13284A] mt-1 leading-snug break-words">
                      {sub.name}
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {sub.enrolledStudentsCount || sub.studentsCount || 0} Students
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={() => onNavigate('marks')}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    Enter Marks
                  </button>
                  <button
                    onClick={() => onNavigate('assignments')}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Post Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-[#DCE3ED] flex items-center justify-between">
          <span className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
            Recent Attendance Sessions
          </span>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-[11px] font-semibold text-[#2E6FB0] hover:underline"
          >
            View All Register →
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No attendance sessions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredSessions.map((sess, index) => (
              <div key={sess.id || `sess-${sess.date}-${index}`} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-800 truncate">{sess.subjectName || sess.subjectCode}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">({sess.date})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{sess.topic || sess.period || 'Lecture Session'}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-emerald-700">
                    {sess.presentCount || sess.recordsCount?.present || 0} Present
                  </span>
                  <span className="text-slate-300 mx-1">/</span>
                  <span className="text-[11px] font-bold text-rose-700">
                    {sess.absentCount || sess.recordsCount?.absent || 0} Absent
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
