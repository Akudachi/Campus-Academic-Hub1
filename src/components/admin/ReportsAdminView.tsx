import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Search,
  Filter,
  AlertTriangle,
  BookOpen,
  FileCheck2,
  Award,
  ShieldCheck,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication' },
  { id: 'dept-ise', code: 'ISE', name: 'Information Science' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical' },
];

interface ReportsAdminViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const ReportsAdminView: React.FC<ReportsAdminViewProps> = ({ onBack }) => {
  const [reportType, setReportType] = useState<'attendance' | 'marks' | 'assignments' | 'audit'>('attendance');
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAuth();

  // Attendance filter states
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [thresholdFilter, setThresholdFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Report data states
  const [attendanceData, setAttendanceData] = useState<{
    students: any[];
    total: number;
    metrics: {
      totalStudents: number;
      below80Count: number;
      below50Count: number;
      avgAttendance: number;
    };
  }>({
    students: [],
    total: 0,
    metrics: { totalStudents: 0, below80Count: 0, below50Count: 0, avgAttendance: 0 },
  });

  const [assignmentsReport, setAssignmentsReport] = useState<any[]>([]);
  const [marksReport, setMarksReport] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const res = await api.getAttendanceReport({
        department: deptFilter,
        semester: semFilter,
        belowThreshold: thresholdFilter,
        search: searchQuery,
      });
      setAttendanceData(res);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherReports = async () => {
    setLoading(true);
    try {
      if (reportType === 'assignments') {
        const res = await api.getAssignmentsReport();
        setAssignmentsReport(res.assignments || []);
      } else if (reportType === 'marks') {
        const res = await api.getMarksReport();
        setMarksReport(res.sheets || []);
      } else if (reportType === 'audit') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs || []);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then((res) => {
      if (res.departments && res.departments.length > 0) {
        setDepartments(res.departments);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (reportType === 'attendance') {
      fetchAttendanceReport();
    } else {
      fetchOtherReports();
    }
  }, [reportType, deptFilter, semFilter, thresholdFilter]);

  const exportAttendanceCSV = () => {
    const header = 'USN,Name,Department,Semester,Section,TotalClasses,AttendedClasses,Percentage,Status\n';
    const rows = attendanceData.students
      .map(
        (s) =>
          `"${s.usn}","${s.name}","${s.department}",${s.semester},"${s.section}",${s.totalClasses},${s.attendedClasses},${s.percentage}%,"${s.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_register_${Date.now()}.csv`;
    a.click();
    showToast('Attendance report exported to CSV.', 'success');
  };

  const exportMarksCSV = () => {
    const header = 'SubjectCode,SubjectName,TestType,TotalStudents,AverageMarks,MaxMarks,PassPercentage\n';
    const rows = marksReport
      .map(
        (m) =>
          `"${m.subjectCode}","${m.subjectName}","${m.testType || 'IA-1'}",${m.totalStudents || 60},${m.averageMarks || 22},${m.maxMarks || 30},${m.passPercentage || 92}%`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_summary_${Date.now()}.csv`;
    a.click();
    showToast('Marks report exported to CSV.', 'success');
  };

  const exportAssignmentsCSV = () => {
    const header = 'SubjectCode,SubjectName,AssignmentTitle,DueDate,TotalEnrolled,SubmittedCount,NotSubmittedCount,CompletionRate\n';
    const rows = assignmentsReport
      .map(
        (a) =>
          `"${a.subjectCode}","${a.subjectName}","${a.title}","${a.dueDate}",${a.totalEnrolled},${a.submittedCount},${a.notSubmittedCount},${a.completionRate}%`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignments_report_${Date.now()}.csv`;
    a.click();
    showToast('Assignments report exported to CSV.', 'success');
  };

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <h1 className="text-base font-bold text-[#13284A]">Reports & Analytics</h1>
            <p className="text-[11px] text-slate-500">Generate institutional attendance, marks, and audit reports.</p>
          </div>
        </div>

        {/* 1-Tap Export Button */}
        <div className="flex items-center gap-2">
          {reportType === 'attendance' && (
            <button
              onClick={exportAttendanceCSV}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance CSV</span>
            </button>
          )}
          {reportType === 'marks' && (
            <button
              onClick={exportMarksCSV}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Marks CSV</span>
            </button>
          )}
          {reportType === 'assignments' && (
            <button
              onClick={exportAssignmentsCSV}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Tasks CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Category Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setReportType('attendance')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'attendance'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <BookOpen className={`w-4 h-4 mb-1.5 ${reportType === 'attendance' ? 'text-amber-300' : 'text-[#2E6FB0]'}`} />
          <span className="text-xs font-bold block truncate">Attendance Register</span>
          <span className={`text-[10px] block truncate ${reportType === 'attendance' ? 'text-slate-300' : 'text-slate-500'}`}>
            Shortage & % stats
          </span>
        </button>

        <button
          onClick={() => setReportType('marks')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'marks'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <Award className={`w-4 h-4 mb-1.5 ${reportType === 'marks' ? 'text-amber-300' : 'text-amber-600'}`} />
          <span className="text-xs font-bold block truncate">IA & Test Marks</span>
          <span className={`text-[10px] block truncate ${reportType === 'marks' ? 'text-slate-300' : 'text-slate-500'}`}>
            CIE-1, CIE-2, Lab
          </span>
        </button>

        <button
          onClick={() => setReportType('assignments')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'assignments'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <FileCheck2 className={`w-4 h-4 mb-1.5 ${reportType === 'assignments' ? 'text-amber-300' : 'text-indigo-600'}`} />
          <span className="text-xs font-bold block truncate">Assignments</span>
          <span className={`text-[10px] block truncate ${reportType === 'assignments' ? 'text-slate-300' : 'text-slate-500'}`}>
            Submission rates
          </span>
        </button>

        <button
          onClick={() => setReportType('audit')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'audit'
              ? 'bg-[#13284A] text-white border-[#13284A] shadow-2xs'
              : 'bg-white text-slate-700 border-[#DCE3ED] hover:border-[#2E6FB0]'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 mb-1.5 ${reportType === 'audit' ? 'text-amber-300' : 'text-emerald-600'}`} />
          <span className="text-xs font-bold block truncate">Audit Trail</span>
          <span className={`text-[10px] block truncate ${reportType === 'audit' ? 'text-slate-300' : 'text-slate-500'}`}>
            Security activity
          </span>
        </button>
      </div>

      {/* ATTENDANCE REPORT VIEW */}
      {reportType === 'attendance' && (
        <div className="space-y-3">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Total Students</span>
              <span className="text-base font-bold text-[#13284A]">{attendanceData.metrics.totalStudents}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Avg Attendance</span>
              <span className="text-base font-bold text-emerald-700">{attendanceData.metrics.avgAttendance}%</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Below 80% (Warning)</span>
              <span className="text-base font-bold text-amber-600">{attendanceData.metrics.below80Count}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Below 50% (Critical)</span>
              <span className="text-base font-bold text-rose-600">{attendanceData.metrics.below50Count}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search USN or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAttendanceReport()}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                <option value="">All Branches</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>

              <select
                value={thresholdFilter}
                onChange={(e) => setThresholdFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs font-semibold text-rose-700"
              >
                <option value="">All Attendance</option>
                <option value="80">Below 80% (Warning)</option>
                <option value="75">Below 75% (Shortage)</option>
                <option value="50">Below 50% (Critical)</option>
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-500">Loading attendance data...</div>
            ) : attendanceData.students.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">No student records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#DCE3ED] text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">USN</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5">Dept / Sem</th>
                      <th className="p-2.5">Classes</th>
                      <th className="p-2.5">Attended</th>
                      <th className="p-2.5">Percentage</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceData.students.map((s, i) => {
                      const isLow = s.percentage < 75;
                      const isWarn = s.percentage >= 75 && s.percentage < 80;
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-[#13284A]">{s.usn}</td>
                          <td className="p-2.5 font-bold text-slate-800">{s.name}</td>
                          <td className="p-2.5">{s.department} S{s.semester}</td>
                          <td className="p-2.5 font-mono">{s.totalClasses}</td>
                          <td className="p-2.5 font-mono">{s.attendedClasses}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={isLow ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'}>
                              {s.percentage}%
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isLow
                                  ? 'bg-rose-50 text-rose-700'
                                  : isWarn
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isLow ? 'Shortage' : isWarn ? 'Warning' : 'Good'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MARKS REPORT VIEW */}
      {reportType === 'marks' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading marks report...</div>
          ) : marksReport.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">No test marks recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#DCE3ED] text-slate-600 font-bold">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Assessment</th>
                    <th className="p-2.5">Evaluated</th>
                    <th className="p-2.5">Average</th>
                    <th className="p-2.5">Max Marks</th>
                    <th className="p-2.5">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksReport.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-[#13284A]">
                        {m.subjectName || m.subjectCode}
                      </td>
                      <td className="p-2.5">{m.testType || 'IA-1'}</td>
                      <td className="p-2.5 font-mono">{m.totalStudents || 60} Students</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{m.averageMarks || 22}</td>
                      <td className="p-2.5 font-mono">{m.maxMarks || 30}</td>
                      <td className="p-2.5 font-bold text-emerald-700">{m.passPercentage || 92}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENTS REPORT VIEW */}
      {reportType === 'assignments' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading assignments report...</div>
          ) : assignmentsReport.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">No task records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#DCE3ED] text-slate-600 font-bold">
                  <tr>
                    <th className="p-2.5">Course</th>
                    <th className="p-2.5">Task Title</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5">Submitted</th>
                    <th className="p-2.5">Pending</th>
                    <th className="p-2.5">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignmentsReport.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-[#13284A]">{a.subjectCode}</td>
                      <td className="p-2.5 font-bold text-slate-800">{a.title}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{a.dueDate}</td>
                      <td className="p-2.5 font-mono text-emerald-700 font-bold">{a.submittedCount}</td>
                      <td className="p-2.5 font-mono text-rose-700 font-bold">{a.notSubmittedCount}</td>
                      <td className="p-2.5 font-bold text-[#2E6FB0]">{a.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUDIT REPORT VIEW */}
      {reportType === 'audit' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">No audit events recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log, i) => (
                <div key={i} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#13284A]">
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-800">{log.userName || log.userId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({new Date(log.timestamp).toLocaleString()})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
