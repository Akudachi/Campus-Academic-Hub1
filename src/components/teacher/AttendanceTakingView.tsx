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
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StatusPill } from '../common/StatusPill';
import { MetricCard } from '../common/MetricCard';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';

interface AttendanceTakingViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const AttendanceTakingView: React.FC<AttendanceTakingViewProps> = ({ onBack, onNavigate }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'take' | 'analytics' | 'history'>('take');
  const [loading, setLoading] = useState(true);
  const { showToast } = useAuth();

  // Active Session Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('Period 1 (09:00 - 10:00)');
  const [topic, setTopic] = useState('Module 3: Dynamic Programming & Matrix Chain Multiplication');
  const [roster, setRoster] = useState<{ studentId: string; usn: string; name: string; currentPercentage: number; status: 'present' | 'absent' }[]>([]);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        setSubjects(res.subjects);
        if (res.subjects.length > 0) {
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
        res.students.map((s) => ({
          ...s,
          status: 'present', // FAST MARKING MODE: All present by default
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
      setPastSessions(res.sessions);
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
          ? 'Attendance finalized and submitted! Records are now immutable.'
          : 'Attendance draft saved successfully.',
        'success'
      );
      setIsSubmitConfirmOpen(false);
      setActiveTab('history');
      fetchPastSessions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const presentCount = roster.filter((r) => r.status === 'present').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-5">
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Dashboard" />
        </div>
      )}

      {/* Top Header & Subject Dropdown */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">
            Digital Attendance Management
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Fast-marking attendance terminal with immutable submission lock and shortage alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 shrink-0">Subject:</label>
          <select
            id="teacher-subject-select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden max-w-xs truncate"
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

      {/* Tabs */}
      <div className="flex border-b border-[#DCE3ED] gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto whitespace-nowrap touch-scroll pb-1">
        <button
          onClick={() => setActiveTab('take')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            activeTab === 'take'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#2E6FB0]" />
          <span>Take Today's Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>Subject Attendance Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            activeTab === 'history'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Session Logs History</span>
        </button>
      </div>

      {/* Tab: Take Attendance */}
      {activeTab === 'take' && (
        <div className="space-y-6">
          {/* Session Parameters Card */}
          <div className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Period / Slot</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium"
              >
                <option value="Period 1 (09:00 - 10:00)">Period 1 (09:00 - 10:00)</option>
                <option value="Period 2 (10:00 - 11:00)">Period 2 (10:00 - 11:00)</option>
                <option value="Period 3 (11:15 - 12:15)">Period 3 (11:15 - 12:15)</option>
                <option value="Period 4 (13:00 - 14:00)">Period 4 (13:00 - 14:00)</option>
                <option value="Period 5 (14:00 - 15:00)">Period 5 (14:00 - 15:00)</option>
                <option value="Period 6 (15:00 - 16:00)">Period 6 (15:00 - 16:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Graph Algorithms / Indexing in SQL"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
          </div>

          {/* Fast Marking Roster Header */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#13284A] uppercase tracking-wider">Fast-Marking Roster:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {presentCount} Present
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {absentCount} Absent
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllPresent}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Roster Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roster.map((student, index) => {
              const isPresent = student.status === 'present';
              const sKey = student.studentId || student.usn || `stu-roster-${index}`;
              return (
                <div
                  key={sKey}
                  id={`student-attendance-card-${student.usn || index}`}
                  onClick={() => toggleStudentStatus(student.studentId)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                    isPresent
                      ? 'bg-emerald-50/40 border-emerald-300/80 hover:bg-emerald-50'
                      : 'bg-rose-50/50 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-[#13284A]">{student.usn}</div>
                    <div className="font-bold text-sm text-slate-800">{student.name}</div>
                    <div className="text-[11px] text-[#667085]">
                      Current: <span className="font-semibold text-slate-700">{student.currentPercentage}%</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPresent ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>PRESENT</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs">
                        <XCircle className="w-4 h-4" />
                        <span>ABSENT</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#667085]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Final submission locks this session permanently into the institutional attendance ledger.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSaveAttendance(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save Draft
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsSubmitConfirmOpen(true)}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4 text-[#5B93D1]" />
                Finalize & Submit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subject Attendance Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Analytics Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Total Classes Conducted"
              value={analyticsData.totalClassesConducted}
              subtitle="Logged in Spring 2026 term"
              accentColor="navy"
            />
            <MetricCard
              title="Students at Risk (<80%)"
              value={analyticsData.below80Count}
              subtitle="Requires institutional warning"
              accentColor="amber"
            />
            <MetricCard
              title="Critical Shortage (<50%)"
              value={analyticsData.below50Count}
              subtitle="Debarred candidate alert"
              accentColor="red"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-[#DCE3ED]">
            <span className="text-xs font-semibold text-[#667085] px-2">Threshold Filter:</span>
            <button
              onClick={() => setAnalyticsFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                analyticsFilter === 'all'
                  ? 'bg-[#13284A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Students ({analyticsData.students.length})
            </button>
            <button
              onClick={() => setAnalyticsFilter('below80')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                analyticsFilter === 'below80'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              Below 80% Warning ({analyticsData.below80Count})
            </button>
            <button
              onClick={() => setAnalyticsFilter('below50')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                analyticsFilter === 'below50'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              Below 50% Critical ({analyticsData.below50Count})
            </button>
          </div>

          {/* Analytics Table */}
          <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Classes Attended</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Status Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyticsData.students.map((s, index) => (
                  <tr key={s.studentId || s.usn || `ana-row-${index}`} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#13284A]">{s.usn}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {s.attendedClasses} / {s.totalClasses} Classes
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.percentage < 50
                                ? 'bg-rose-600'
                                : s.percentage < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(s.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs">{s.percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={s.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Past Sessions History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED]">
            <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
              Submitted & Draft Attendance Logs
            </h3>
          </div>

          {pastSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              No past sessions found for this subject.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Topic Covered</th>
                  <th className="py-3 px-4">Present / Absent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Immutable Locked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastSessions.map((sess, index) => (
                  <tr key={sess.id || `sess-hist-${sess.date}-${index}`} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{sess.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sess.period || 'Period 1'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{sess.topic || 'Regular Lecture'}</td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className="text-emerald-700 font-bold">{sess.presentCount} P</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700 font-bold">{sess.absentCount} A</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={sess.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {sess.status === 'submitted' ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Immutable
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Draft (Editable)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        title="Submit Immutable Attendance"
        subtitle="Confirm class records for Spring 2026"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
            <p className="font-bold">Permanent Submission Notice:</p>
            <p>
              Once submitted, attendance sessions cannot be modified or deleted. Students with attendance dropping below 80% will receive automated warning alerts.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-bold">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Period:</span>
              <span className="font-bold">{period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attendance Breakdown:</span>
              <span className="font-bold text-emerald-700">{presentCount} Present / {absentCount} Absent</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitConfirmOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSaveAttendance(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isProcessing ? 'Submitting...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
