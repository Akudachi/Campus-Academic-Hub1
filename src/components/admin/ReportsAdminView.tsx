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
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication' },
  { id: 'dept-ise', code: 'ISE', name: 'Information Science' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical' },
];

export const ReportsAdminView: React.FC = () => {
  const [reportType, setReportType] = useState<'attendance' | 'assignments' | 'marks' | 'audit'>('attendance');
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
        setAssignmentsReport(res.assignments);
      } else if (reportType === 'marks') {
        const res = await api.getMarksReport();
        setMarksReport(res.sheets);
      } else if (reportType === 'audit') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs);
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
    a.download = `attendance_report_${Date.now()}.csv`;
    a.click();
    showToast('Attendance report exported to CSV.', 'success');
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

  const exportMarksCSV = () => {
    const header = 'SubjectCode,SubjectName,TestName,MaxMarks,EvaluatedStudents,AverageMarks,Published\n';
    const rows = marksReport
      .map(
        (m) =>
          `"${m.subjectCode}","${m.subjectName}","${m.testName}",${m.maxMarks},${m.evaluatedCount},${m.averageMarks},${m.published}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_report_${Date.now()}.csv`;
    a.click();
    showToast('Marks report exported to CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">Comprehensive Academic Reports</h2>
          <p className="text-xs text-[#667085] mt-1">
            Department-wide analytics, attendance shortages (&lt;80%), submission tracking, and audit trails with 1-click CSV exports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reportType === 'attendance' && (
            <button
              id="export-attendance-csv-btn"
              onClick={exportAttendanceCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#5B93D1]" />
              Export Attendance CSV
            </button>
          )}
          {reportType === 'assignments' && (
            <button
              id="export-assignments-csv-btn"
              onClick={exportAssignmentsCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#5B93D1]" />
              Export Assignments CSV
            </button>
          )}
          {reportType === 'marks' && (
            <button
              id="export-marks-csv-btn"
              onClick={exportMarksCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#5B93D1]" />
              Export Marks CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Touch-scrollable on mobile */}
      <div className="flex border-b border-[#DCE3ED] gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto whitespace-nowrap touch-scroll pb-1">
        <button
          onClick={() => setReportType('attendance')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            reportType === 'attendance'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Attendance Analytics</span>
        </button>
        <button
          onClick={() => setReportType('assignments')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            reportType === 'assignments'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-[#2E6FB0]" />
          <span>Assignments Tracking</span>
        </button>
        <button
          onClick={() => setReportType('marks')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            reportType === 'marks'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-[#E0982A]" />
          <span>Test Marks Matrices</span>
        </button>
        <button
          onClick={() => setReportType('audit')}
          className={`pb-2.5 sm:pb-3 flex items-center gap-2 transition-colors border-b-2 shrink-0 ${
            reportType === 'audit'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span>Audit Log Ledger</span>
        </button>
      </div>

      {/* Attendance Tab Content */}
      {reportType === 'attendance' && (
        <div className="space-y-5">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Average Attendance"
              value={`${attendanceData.metrics.avgAttendance}%`}
              subtitle="Campus-wide aggregate"
              accentColor="blue"
            />
            <MetricCard
              title="Total Evaluated"
              value={attendanceData.metrics.totalStudents}
              subtitle="Enrolled students"
              accentColor="slate"
            />
            <MetricCard
              title="Shortage (<80%)"
              value={attendanceData.metrics.below80Count}
              subtitle="Formal warning threshold"
              accentColor="amber"
            />
            <MetricCard
              title="Critical (<50%)"
              value={attendanceData.metrics.below50Count}
              subtitle="Debarred candidate alert"
              accentColor="red"
            />
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student USN or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAttendanceReport()}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>

              <select
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white"
              >
                <option value="">All Semesters</option>
                <option value="4">Semester 4 (Active)</option>
                <option value="6">Semester 6</option>
              </select>

              <select
                value={thresholdFilter}
                onChange={(e) => setThresholdFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-semibold text-rose-800"
              >
                <option value="">All Attendance Ranges</option>
                <option value="80">Below 80% (Warning)</option>
                <option value="50">Below 50% (Critical Debarred)</option>
              </select>
            </div>

            <button
              onClick={fetchAttendanceReport}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Apply Filter
            </button>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-sm text-[#667085]">Compiling report...</div>
            ) : attendanceData.students.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#667085]">No students match filter criteria.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">USN</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department & Sem</th>
                    <th className="py-3 px-4">Classes Attended</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.students.map((s, idx) => (
                    <tr key={s.studentId || s.usn || `att-rep-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#13284A]">{s.usn}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {s.department} • Sem {s.semester}-{s.section}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {s.attendedClasses} / {s.totalClasses}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-mono font-bold text-xs ${
                            s.percentage < 50
                              ? 'text-rose-700'
                              : s.percentage < 80
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={s.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab Content */}
      {reportType === 'assignments' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#667085]">Compiling assignments metrics...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assignment Title</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Enrolled</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Not Submitted</th>
                  <th className="py-3 px-4">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignmentsReport.map((a, idx) => (
                  <tr key={a.id || `asg-rep-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#13284A]">{a.subjectCode}</div>
                      <div className="text-[11px] text-slate-500">{a.subjectName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{a.title}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(a.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{a.totalEnrolled}</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{a.submittedCount}</td>
                    <td className="py-3 px-4 text-rose-700 font-bold">{a.notSubmittedCount}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-[#2E6FB0]">{a.completionRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Marks Tab Content */}
      {reportType === 'marks' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#667085]">Compiling marks matrices...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Test Name</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Evaluated Count</th>
                  <th className="py-3 px-4">Class Average</th>
                  <th className="py-3 px-4">Student Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksReport.map((m, idx) => (
                  <tr key={m.id || `mark-rep-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#13284A]">{m.subjectCode}</div>
                      <div className="text-[11px] text-slate-500">{m.subjectName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{m.testName}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{m.maxMarks}</td>
                    <td className="py-3 px-4">{m.evaluatedCount} Students</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{m.averageMarks} / {m.maxMarks}</td>
                    <td className="py-3 px-4">
                      {m.published ? (
                        <StatusPill status="published" label="Published to Students" size="sm" />
                      ) : (
                        <StatusPill status="pending" label="Draft (Faculty Only)" size="sm" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Audit Log Content */}
      {reportType === 'audit' && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED]">
            <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
              Immutable Academic Action Ledger
            </h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log, idx) => (
                <tr key={log.id || `audit-row-${idx}`} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 font-bold text-[#13284A]">{log.actorName}</td>
                  <td className="py-3 px-4 text-blue-700 font-semibold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600">{log.targetEntity}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
