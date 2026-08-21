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
  AlertTriangle,
  Layers,
  GraduationCap,
  Sparkles,
  ClipboardList,
  BarChart2,
  ChevronRight,
  Zap,
  PlusCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../common/MetricCard';
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

  // Active semester detail object if a specific sem is selected
  const activeSemesterInfo = useMemo(() => {
    if (selectedSemester === 'all') return null;
    return assignedSemesters.find((s) => s.semesterNumber === Number(selectedSemester)) || null;
  }, [assignedSemesters, selectedSemester]);

  const totalEnrolledInSelection = useMemo(() => {
    return filteredSubjects.reduce((acc, s) => acc + (s.enrolledStudentsCount || s.studentsCount || 0), 0);
  }, [filteredSubjects]);

  const totalCreditsInSelection = useMemo(() => {
    return filteredSubjects.reduce((acc, s) => acc + (Number(s.credits) || 0), 0);
  }, [filteredSubjects]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern Teacher Welcome Header (SaaS Hero) */}
      <div className="bg-linear-to-r from-[#13284A] via-[#1E3A63] to-[#2E6FB0] p-6 sm:p-7 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E0982A] text-slate-900 shadow-xs">
                {teacher?.teacherCode || 'FACULTY'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/10">
                {teacher?.department || 'CSE'} Department
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {teacher?.designation || 'Faculty Member'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Welcome back, {user?.name || 'Professor'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Academic Session 2025–2026 • {assignedSemesters.length} Active Teaching Cohort{assignedSemesters.length !== 1 ? 's' : ''} assigned.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="quick-take-attendance-btn"
              onClick={() => onNavigate('attendance')}
              className="px-5 py-3 text-xs font-extrabold rounded-xl bg-white text-[#13284A] hover:bg-slate-100 transition-all flex items-center gap-2 shadow-md active:scale-98"
            >
              <Zap className="w-4 h-4 text-[#2E6FB0]" />
              <span>1-Tap Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Semester Selector Chips (Swiggy style pill filters) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE3ED] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2E6FB0]" />
            <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
              Assigned Semester Workloads
            </h2>
          </div>
          <span className="text-[11px] text-[#667085]">
            Filter by semester to inspect courses, enrolled rosters, and attendance records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            id="sem-filter-all-btn"
            onClick={() => setSelectedSemester('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-98 ${
              selectedSemester === 'all'
                ? 'bg-[#13284A] text-white ring-2 ring-[#13284A]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#DCE3ED]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>All Workloads</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                selectedSemester === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {subjects.length} Courses
            </span>
          </button>

          {assignedSemesters.map((sem) => {
            const isSelected = selectedSemester === String(sem.semesterNumber);
            return (
              <button
                key={`sem-btn-${sem.semesterNumber}`}
                id={`sem-filter-btn-${sem.semesterNumber}`}
                onClick={() => setSelectedSemester(String(sem.semesterNumber))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-98 ${
                  isSelected
                    ? 'bg-[#2E6FB0] text-white ring-2 ring-[#2E6FB0]/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-[#DCE3ED]'
                }`}
              >
                <span>Semester {sem.semesterNumber}</span>
                <span className="text-[10px] opacity-80 font-normal">({sem.department})</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2E6FB0] border border-blue-200'
                  }`}
                >
                  {sem.count} Course{sem.count !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Semester Highlight Banner */}
      {activeSemesterInfo && (
        <div className="bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#2E6FB0] text-white rounded-xl shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#13284A] font-heading">
                  Semester {activeSemesterInfo.semesterNumber} ({activeSemesterInfo.department}) Dossier
                </h3>
                <p className="text-xs text-[#667085]">
                  Department of {activeSemesterInfo.department} • Section A
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('attendance')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#DCE3ED] hover:bg-slate-50 text-[#13284A] shadow-xs flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-[#2E6FB0]" />
                Attendance
              </button>
              <button
                onClick={() => onNavigate('marks')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#DCE3ED] hover:bg-slate-50 text-[#13284A] shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-[#E0982A]" />
                Test Marks
              </button>
              <button
                onClick={() => onNavigate('assignments')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 shadow-xs flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Assignments
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Assigned Subjects</span>
              <span className="text-lg font-extrabold text-[#13284A]">{activeSemesterInfo.count} Courses</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Cohort Size</span>
              <span className="text-lg font-extrabold text-[#2E6FB0]">{totalEnrolledInSelection} Students</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Weekly Credits</span>
              <span className="text-lg font-extrabold text-slate-800">{totalCreditsInSelection} Credits</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Conducted Sessions</span>
              <span className="text-lg font-extrabold text-emerald-700">{filteredSessions.length} Classes</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={selectedSemester === 'all' ? 'Total Assigned Courses' : `Sem ${selectedSemester} Courses`}
          value={filteredSubjects.length}
          subtitle={`${selectedSemester === 'all' ? 'All active' : `Semester ${selectedSemester}`} workload`}
          icon={BookOpen}
          accentColor="blue"
        />
        <MetricCard
          title={selectedSemester === 'all' ? 'Attendance Sessions' : `Sem ${selectedSemester} Sessions`}
          value={filteredSessions.length}
          subtitle="Immutable rosters logged"
          icon={CheckCircle2}
          accentColor="green"
        />
        <MetricCard
          title={selectedSemester === 'all' ? 'Active Students Enrolled' : `Sem ${selectedSemester} Students`}
          value={totalEnrolledInSelection}
          subtitle="Under active instruction"
          icon={Users}
          accentColor="navy"
        />
      </div>

      {/* High-Craft Subject Cards Grid (Instagram / Swiggy modern card design) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#2E6FB0]" />
            <span>
              {selectedSemester === 'all'
                ? 'Your Assigned Teaching Portfolio'
                : `Semester ${selectedSemester} Assigned Courses`}
            </span>
          </h2>
          <span className="text-xs text-[#667085] font-semibold">
            {filteredSubjects.length} Course{filteredSubjects.length !== 1 ? 's' : ''} Displayed
          </span>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE3ED] text-xs text-[#667085] space-y-2 shadow-xs">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No subjects found for the selected semester.</p>
            <p className="text-[11px] text-[#667085]">
              Select another semester or click "All Workloads" to view all assigned subjects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.map((sub, index) => (
              <div
                key={sub.id || sub.subjectId || sub.code || `sub-item-${index}`}
                className="bg-white p-5 rounded-2xl border border-[#DCE3ED] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#2E6FB0]/60 hover:shadow-md transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-slate-100 text-[#13284A] border border-slate-200">
                      {sub.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {sub.credits} Credits • {sub.type || 'Core Theory'}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-[#13284A] font-heading group-hover:text-[#2E6FB0] transition-colors">
                    {sub.name}
                  </h3>
                  
                  <p className="text-xs text-[#667085]">
                    Department of {sub.department || sub.departmentCode || 'CSE'} • Semester {sub.semesterNumber} (Section A)
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {sub.enrolledStudentsCount || sub.studentsCount || 0} Students Enrolled
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-[#2E6FB0] hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      Attendance →
                    </button>
                    <button
                      onClick={() => onNavigate('marks')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                      Marks →
                    </button>
                    <button
                      onClick={() => onNavigate('assignments')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      Assignments →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance Logs */}
      <div className="bg-white rounded-2xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
            {selectedSemester === 'all'
              ? 'Recent Attendance Submissions'
              : `Semester ${selectedSemester} Attendance Submissions`}
          </h3>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-[#2E6FB0] hover:underline"
          >
            View Full Log →
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#667085]">
            {selectedSemester === 'all'
              ? 'No attendance sessions logged yet.'
              : `No attendance sessions logged yet for Semester ${selectedSemester}.`}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSessions.map((sess, index) => (
              <div key={sess.id || `sess-${sess.date}-${index}`} className="p-4 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{sess.subjectName}</span>
                    <span className="font-mono text-[11px] text-slate-500">({sess.subjectCode})</span>
                    <StatusPill status={sess.status} size="sm" />
                  </div>
                  <p className="text-[#667085]">
                    Date: {sess.date} • Period: {sess.period || 'Period 1'} • Topic: {sess.topic || 'Regular Lecture'}
                  </p>
                </div>
                <div className="text-right font-medium">
                  <span className="text-emerald-700 font-bold">{sess.presentCount || sess.recordsCount?.present || 0} Present</span>
                  <span className="text-slate-400 mx-1.5">/</span>
                  <span className="text-rose-700 font-bold">{sess.absentCount || sess.recordsCount?.absent || 0} Absent</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
