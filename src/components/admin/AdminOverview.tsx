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
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';

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

  const quickLaunchItems = [
    {
      id: 'teachers',
      title: 'Faculty Master',
      sub: 'Manage professors & workloads',
      icon: UserCheck,
      color: 'bg-blue-50 text-[#2E6FB0] border-blue-200 hover:border-[#2E6FB0]',
    },
    {
      id: 'students',
      title: 'Student Enroll',
      sub: 'XLSX batch uploads & USNs',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-700',
    },
    {
      id: 'timetable',
      title: 'AI Timetable',
      sub: 'Smart subject & faculty mapping',
      icon: Sparkles,
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-700',
    },
    {
      id: 'semesters',
      title: 'Term Manager',
      sub: 'Even & Odd term cycle switch',
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-700',
    },
    {
      id: 'notices-events',
      title: 'Circulars & Events',
      sub: 'Broadcast campus announcements',
      icon: Megaphone,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-700',
    },
    {
      id: 'reports',
      title: 'Executive Reports',
      sub: 'Attendance & marks exports',
      icon: BarChart3,
      color: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-700',
    },
    {
      id: 'settings',
      title: 'Settings & Cloud',
      sub: 'Backups, departments & rules',
      icon: Settings,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-700',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modern SaaS Executive Header (Swiggy / Stripe inspired) */}
      <div className="bg-linear-to-r from-[#13284A] via-[#1A365D] to-[#1E3A63] p-6 sm:p-7 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Campus OS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/10">
                AY {campusInfo.academicYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2E6FB0]/50 text-white border border-[#5B93D1]/40">
                {campusInfo.semesterTermType === 'even' ? 'Even Term (2, 4, 6, 8)' : 'Odd Term (1, 3, 5, 7)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              {campusInfo.institutionName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Campus Code: <strong className="font-mono text-white">{campusInfo.campusCode}</strong> • Centralized academic administration, faculty workload assignments, and real-time attendance compliance.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-400 text-slate-900 hover:bg-amber-300 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>AI Timetable</span>
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-2 shadow-xs active:scale-98 backdrop-blur-xs"
            >
              <Users className="w-4 h-4 text-[#8FC4F8]" />
              <span>Bulk Enroll</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all shadow-xs active:scale-98"
              title="Campus Settings"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Swiggy / Consumer-style Quick Action Tiles Carousel / Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider font-heading flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#2E6FB0]" />
            <span>Campus Quick Launchpad</span>
          </h2>
          <span className="text-[11px] text-[#667085] font-medium">1-Click Fast Navigation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {quickLaunchItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`p-3.5 rounded-xl border bg-white text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-98 group flex flex-col justify-between space-y-2 ${item.color}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-lg bg-white shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#13284A] line-clamp-1">{item.title}</h3>
                  <p className="text-[10px] text-[#667085] line-clamp-1 mt-0.5">{item.sub}</p>
                </div>
              </button>
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
    </div>
  );
};
