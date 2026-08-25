import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  Save,
  Users,
  CheckCheck,
  RotateCcw,
  BarChart3,
  Calendar,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';

interface AttendanceTakingViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const AttendanceTakingView: React.FC<AttendanceTakingViewProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'take' | 'analytics' | 'history'>('take');
  const [loading, setLoading] = useState(true);
  const { teacher, showToast } = useAuth();
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const dept = teacher?.department || 'CSE';
      const res = await api.autoAssignTeachers({ department: dept, replaceExisting: false });
      showToast(res.message || `Assigned ${res.assignedCount} subjects!`, 'success');
      const subRes = await api.getTeacherSubjects();
      setSubjects(subRes.subjects || []);
      if (subRes.subjects && subRes.subjects.length > 0) {
        setSelectedSubjectId(subRes.subjects[0].id || subRes.subjects[0].subjectId);
      }
    } catch (err: any) {
      showToast(err.message || 'Auto-assign failed.', 'error');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Active Session Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('Period 1 (09:00 - 10:00)');
  const [topic, setTopic] = useState('Regular Class Lecture');
  const [roster, setRoster] = useState<{ studentId: string; usn: string; name: string; currentPercentage: number; status: 'present' | 'absent' }[]>([]);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRosterStatus, setFilterRosterStatus] = useState<'all' | 'present' | 'absent'>('all');

  // Analytics & History state
  const [analyticsData, setAnalyticsData] = useState<{
    students: any[];
    totalClassesConducted: number;
    below80Count: number;
    below50Count: number;
  }>({ students: [], totalClassesConducted: 0, below80Count: 0, below50Count: 0 });
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'below80' | 'below50'>('all');
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  // Load teacher assigned subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.getTeacherSubjects();
        setSubjects(res.subjects || []);
        if (res.subjects && res.subjects.length > 0) {
          const firstId = res.subjects[0].id || res.subjects[0].subjectId;
          setSelectedSubjectId(firstId);
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch roster when selected subject changes
  const fetchRoster = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await api.getAttendanceRoster(selectedSubjectId);
      setRoster(
        (res.students || []).map((s: any) => ({
          ...s,
          status: 'present', // All present by default for fast marking
        }))
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await api.getTeacherAttendanceAnalytics(selectedSubjectId, analyticsFilter === 'all' ? undefined : analyticsFilter);
      setAnalyticsData(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchPastSessions = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await api.getTeacherAttendanceSessions(selectedSubjectId);
      setPastSessions(res.sessions || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      if (activeTab === 'take') fetchRoster();
      if (activeTab === 'analytics') fetchAnalytics();
      if (activeTab === 'history') fetchPastSessions();
    }
  }, [selectedSubjectId, activeTab, analyticsFilter]);

  const toggleStudentStatus = (studentId: string) => {
    setRoster((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? { ...s, status: s.status === 'present' ? 'absent' : 'present' }
          : s
      )
    );
  };

  const markAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'present' })));
    showToast('All students marked present.', 'info');
  };

  const markAllAbsent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'absent' })));
    showToast('All students marked absent.', 'info');
  };

  const handleSaveAttendance = async (submitImmediately: boolean) => {
    if (!selectedSubjectId) return;
    setIsProcessing(true);
    try {
      const records = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
      }));

      await api.createAttendanceSession({
        subjectId: selectedSubjectId,
        date,
        period,
        topic,
        records,
        submitImmediately,
      });

      showToast(
        submitImmediately
          ? 'Attendance recorded & submitted successfully.'
          : 'Attendance draft saved.',
        'success'
      );
      setIsSubmitConfirmOpen(false);
      setActiveTab('history');
      fetchPastSessions();
    } catch (err: any) {
      showToast(err.message || 'Failed to record attendance', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;

  const filteredRoster = roster.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRosterStatus === 'all'
        ? true
        : filterRosterStatus === 'present'
        ? student.status === 'present'
        : student.status === 'absent';
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Back Nav */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Dashboard" />
        </div>
      )}

      {/* Header & Course Switcher */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#13284A]">
              Attendance Terminal
            </h2>
            <p className="text-[11px] text-slate-500">
              1-Tap digital roster marking with live shortage indicators.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              id="teacher-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden truncate"
            >
              {subjects.map((sub, index) => {
                const subVal = sub.id || sub.subjectId || `sub-opt-${index}`;
                return (
                  <option key={subVal} value={subVal}>
                    {sub.code || sub.subjectCode} - {sub.name || sub.subjectName} (Sem {sub.semesterNumber || 4})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Modern Segmented Tab Switcher (Mobile App Style) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('take')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'take'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'analytics'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'history'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[#13284A] text-sm">No Courses Assigned Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You do not have any subjects assigned yet. Please contact the administrator or department head to allocate your courses.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB: TAKE ATTENDANCE */}
          {activeTab === 'take' && (
        <div className="space-y-3">
          {/* Session Parameters (Compact 3-col/responsive) */}
          <div className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium truncate"
              >
                <option value="Period 1 (09:00 - 10:00)">P1 (09:00 - 10:00)</option>
                <option value="Period 2 (10:00 - 11:00)">P2 (10:00 - 11:00)</option>
                <option value="Period 3 (11:15 - 12:15)">P3 (11:15 - 12:15)</option>
                <option value="Period 4 (13:00 - 14:00)">P4 (13:00 - 14:00)</option>
                <option value="Period 5 (14:00 - 15:00)">P5 (14:00 - 15:00)</option>
                <option value="Period 6 (15:00 - 16:00)">P6 (15:00 - 16:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic covered..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
          </div>

          {/* Fast Marking Roster Header & Search */}
          <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {presentCount} Present
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {absentCount} Absent
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={markAllPresent}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-98"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={markAllAbsent}
                  className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-98"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter by name or USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
          </div>

          {/* Student Roster Cards (Compact Single/2-Col Mobile Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredRoster.map((student, index) => {
              const isPresent = student.status === 'present';
              const sKey = student.studentId || student.usn || `stu-roster-${index}`;
              return (
                <div
                  key={sKey}
                  id={`student-attendance-card-${student.usn || index}`}
                  onClick={() => toggleStudentStatus(student.studentId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs select-none active:scale-98 ${
                    isPresent
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {student.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span>{student.usn}</span>
                      <span>•</span>
                      <span
                        className={
                          (student.currentPercentage || 85) < 75
                            ? 'text-rose-600 font-bold'
                            : 'text-slate-600 font-semibold'
                        }
                      >
                        {student.currentPercentage || 85}% Att.
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-rose-600 text-white shadow-2xs'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>P</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>A</span>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Submit Action Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              Total {roster.length} students enrolled
            </span>

            <button
              type="button"
              id="submit-attendance-btn"
              onClick={() => setIsSubmitConfirmOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#1E3A63] transition-all flex items-center gap-1.5 shadow-2xs active:scale-98"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finalize & Submit</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Classes</span>
              <span className="text-base font-bold text-[#13284A]">
                {analyticsData.totalClassesConducted || pastSessions.length || 0}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs">
              <span className="text-[10px] text-amber-700 font-semibold block">Shortage (&lt;80%)</span>
              <span className="text-base font-bold text-amber-700">
                {analyticsData.below80Count || 0}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs">
              <span className="text-[10px] text-rose-700 font-semibold block">Critical (&lt;50%)</span>
              <span className="text-base font-bold text-rose-700">
                {analyticsData.below50Count || 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs divide-y divide-slate-100">
            {(analyticsData.students || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No shortage records found. All students above compliance threshold.
              </div>
            ) : (
              (analyticsData.students || []).map((st: any, idx: number) => (
                <div key={st.studentId || idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{st.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{st.usn}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${st.percentage < 75 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {st.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {st.attended}/{st.total} attended
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs divide-y divide-slate-100 text-xs">
          {pastSessions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No past sessions logged for this subject yet.</div>
          ) : (
            pastSessions.map((sess: any, idx: number) => (
              <div key={sess.id || idx} className="p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{sess.date}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({sess.period || 'P1'})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{sess.topic || 'Regular Class'}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-700 font-bold">{sess.presentCount || sess.recordsCount?.present || 0}P</span>
                  <span className="text-slate-300 mx-1">/</span>
                  <span className="text-rose-700 font-bold">{sess.absentCount || sess.recordsCount?.absent || 0}A</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

          {/* History tab content */}
        </>
      )}

      {/* Confirm Finalize Modal */}
      <Modal
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Finalize Attendance"
        subtitle="Confirm attendance roster submission."
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Submit attendance for <strong className="text-slate-900">{date} ({period})</strong>?
          </p>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between font-bold">
            <span className="text-emerald-700">{presentCount} Present</span>
            <span className="text-rose-700">{absentCount} Absent</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSubmitConfirmOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSaveAttendance(true)}
              className="px-4 py-1.5 rounded-lg bg-[#13284A] text-white font-bold disabled:opacity-50"
            >
              {isProcessing ? 'Submitting...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
