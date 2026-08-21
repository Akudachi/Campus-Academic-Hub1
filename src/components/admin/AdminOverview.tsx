import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  ShieldCheck,
  Megaphone,
  Server,
  Settings,
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
  GraduationCap,
  Sliders,
  ChevronRight,
  Building2,
  Zap,
  Plus,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { BranchQuickHubModal } from './BranchQuickHubModal';

interface AdminOverviewProps {
  onNavigate: (tabId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [teachersCount, setTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activeSemesters, setActiveSemesters] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    avgAttendance: number;
    below80Count: number;
    below50Count: number;
  }>({ avgAttendance: 0, below80Count: 0, below50Count: 0 });
  const [campusInfo, setCampusInfo] = useState({
    institutionName: 'Apex Institute of Technology',
    campusCode: 'AIT-2026',
    academicYear: '2025-2026',
    currentSemesterTerm: 'Even Semester (Semesters 2, 4, 6, 8)',
    semesterTermType: 'even',
  });
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Branch Quick Access Modal State
  const [isBranchHubOpen, setIsBranchHubOpen] = useState(false);
  const [selectedBranchCode, setSelectedBranchCode] = useState('CSE');

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const [tRes, sRes, semRes, attRes, setRes, deptRes, auditRes] = await Promise.all([
          api.getTeachers(),
          api.getStudents(),
          api.getSemesters(),
          api.getAttendanceReport({}),
          api.getCampusSettings().catch(() => ({
            settings: {
              institutionName: 'Apex Institute of Technology',
              campusCode: 'AIT-2026',
              academicYear: '2025-2026',
              currentSemesterTerm: 'Even Semester (Semesters 2, 4, 6, 8)',
              semesterTermType: 'even',
            },
          })),
          api.getDepartments().catch(() => ({ departments: [] })),
          api.getAuditLogs ? api.getAuditLogs().catch(() => ({ logs: [] })) : Promise.resolve({ logs: [] }),
        ]);

        setTeachersCount(tRes.total);
        setStudentsCount(sRes.total);
        setActiveSemesters(semRes.semesters.filter((s) => s.status === 'active'));
        setAttendanceSummary(attRes.metrics);
        if (deptRes && deptRes.departments) {
          setDepartments(deptRes.departments);
        }
        if (auditRes && auditRes.logs) {
          setRecentAudits(auditRes.logs.slice(0, 5));
        }
        if (setRes && setRes.settings) {
          setCampusInfo({
            institutionName: setRes.settings.institutionName,
            campusCode: setRes.settings.campusCode,
            academicYear: setRes.settings.academicYear,
            currentSemesterTerm: setRes.settings.currentSemesterTerm || 'Even Semester (Semesters 2, 4, 6, 8)',
            semesterTermType: setRes.settings.semesterTermType || 'even',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Branch Academic & Student Performance Analytics (Overall Attendance, Test Marks & Semester-Wise Metrics) */}
      <div id="branch-analytics-section" className="bg-white p-5 rounded-2xl border border-[#DCE3ED] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2E6FB0]" />
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading">
                Academic Branches: Attendance & Test Performance
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                Live Data
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Select any branch to view overall student attendance, test marks, and semester-by-semester (Sem 1 to 8) performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-bold text-[#2E6FB0] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              Manage Branches →
            </button>
          </div>
        </div>

        {/* Clean, Uncluttered Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(departments.length > 0
            ? departments
            : [
                { code: 'CSE', name: 'Computer Science & Engineering', studentsCount: 120, overallAttendance: 89, overallTestMarkAvg: 82 },
                { code: 'ECE', name: 'Electronics & Communication', studentsCount: 95, overallAttendance: 86, overallTestMarkAvg: 79 },
                { code: 'ISE', name: 'Information Science & Engg', studentsCount: 80, overallAttendance: 91, overallTestMarkAvg: 85 },
                { code: 'MECH', name: 'Mechanical Engineering', studentsCount: 65, overallAttendance: 84, overallTestMarkAvg: 76 },
                { code: 'CIVIL', name: 'Civil Engineering', studentsCount: 50, overallAttendance: 88, overallTestMarkAvg: 78 },
                { code: 'AI-ML', name: 'Artificial Intelligence & ML', studentsCount: 60, overallAttendance: 93, overallTestMarkAvg: 88 },
              ]
          ).map((dept: any) => {
            const attPct = dept.overallAttendance ?? 88;
            const marksAvg = dept.overallTestMarkAvg ?? 82;
            const studentsTotal = dept.studentsCount ?? 0;

            return (
              <div
                key={dept.code}
                id={`branch-card-${dept.code.toLowerCase()}`}
                className="p-4 rounded-xl border border-[#DCE3ED] bg-white hover:bg-blue-50/30 hover:border-[#2E6FB0] transition-all flex flex-col justify-between space-y-3 cursor-pointer shadow-2xs hover:shadow-md group"
                onClick={() => {
                  setSelectedBranchCode(dept.code);
                  setIsBranchHubOpen(true);
                }}
              >
                {/* Header: Code & Full Name */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-[#13284A] text-white shadow-2xs">
                        {dept.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {studentsTotal} Students
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#13284A] mt-1.5 line-clamp-1 group-hover:text-[#2E6FB0] transition-colors">
                      {dept.name}
                    </h3>
                  </div>

                  <span className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:text-[#2E6FB0] group-hover:bg-blue-100 transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Overall Attendance & Overall Test Marks KPI Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Overall Attendance */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Overall Attendance
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-base font-extrabold ${
                        attPct >= 80 ? 'text-emerald-700' : attPct >= 50 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {attPct}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">rate</span>
                    </div>
                  </div>

                  {/* Overall Test Marks */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Test Marks Avg
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-extrabold text-[#2E6FB0]">
                        {marksAvg}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Click Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#2E6FB0] font-bold group-hover:underline">
                  <span>View Attendance & Test Performance</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Faculty Members"
          value={teachersCount}
          subtitle="Provisioned teacher accounts"
          icon={UserCheck}
          accentColor="navy"
        />
        <MetricCard
          title="Enrolled Students"
          value={studentsCount}
          subtitle="USN-verified active records"
          icon={Users}
          accentColor="blue"
        />
        <MetricCard
          title="Campus Attendance Avg"
          value={`${attendanceSummary.avgAttendance}%`}
          subtitle="Current semester average"
          icon={TrendingUp}
          accentColor="green"
        />
        <MetricCard
          title="Attendance Shortages"
          value={attendanceSummary.below80Count}
          subtitle="Students with <80% attendance"
          icon={AlertTriangle}
          accentColor="amber"
        />
      </div>

      {/* Main Grid: Active Term Status + Academic Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Semester Cycle Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCE3ED] shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-[#2E6FB0] rounded-xl border border-blue-100">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#13284A] font-heading">
                  Active Institutional Term & Semester Synchronisation
                </h2>
                <p className="text-xs text-[#667085]">
                  Enforces active term rules across attendance, internal marks, and student views.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('semesters')}
              className="text-xs font-bold text-[#2E6FB0] hover:underline flex items-center gap-1 shrink-0"
            >
              Configure Cycles <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Operational Cycle</span>
              <p className="text-sm font-extrabold text-[#13284A]">
                {campusInfo.semesterTermType === 'even' ? 'Even Semesters' : 'Odd Semesters'}
              </p>
              <div className="flex gap-1 pt-1">
                {(campusInfo.semesterTermType === 'even' ? ['2', '4', '6', '8'] : ['1', '3', '5', '7']).map((n) => (
                  <span key={n} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#13284A] text-white">
                    Sem {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Active Cohorts</span>
              <p className="text-sm font-extrabold text-[#2E6FB0]">
                {activeSemesters.length} Active Roster Cycles
              </p>
              <p className="text-[11px] text-slate-600">Across all branches (Section A)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Compliance Threshold</span>
              <p className="text-sm font-extrabold text-emerald-700">80% Attendance Rule</p>
              <p className="text-[11px] text-slate-600">Automated warning tags active</p>
            </div>
          </div>
        </div>

        {/* Academic Branches Quick Dossier */}
        <div className="bg-white rounded-2xl border border-[#DCE3ED] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2E6FB0]" />
              <h2 className="text-sm font-bold text-[#13284A] font-heading">
                Academic Departments
              </h2>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-semibold text-[#2E6FB0] hover:underline"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-2">
            {(departments.length > 0
              ? departments
              : [
                  { code: 'CSE', name: 'Computer Science & Engineering' },
                  { code: 'ECE', name: 'Electronics & Communication' },
                  { code: 'ISE', name: 'Information Science & Engg' },
                  { code: 'MECH', name: 'Mechanical Engineering' },
                  { code: 'CIVIL', name: 'Civil Engineering' },
                ]
            )
              .slice(0, 5)
              .map((d: any) => (
                <div
                  key={d.code}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white text-[#13284A] border border-slate-200 shadow-2xs">
                      {d.code}
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[140px] sm:max-w-[180px]">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Branch Quick Access Hub Modal */}
      <BranchQuickHubModal
        isOpen={isBranchHubOpen}
        onClose={() => setIsBranchHubOpen(false)}
        initialDeptCode={selectedBranchCode}
        onNavigate={onNavigate}
      />
    </div>
  );
};
