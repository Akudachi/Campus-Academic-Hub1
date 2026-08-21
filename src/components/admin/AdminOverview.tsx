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
  const [attendanceSummary, setAttendanceSummary] = useState<{
    avgAttendance: number;
    below80Count: number;
    below50Count: number;
  }>({ avgAttendance: 0, below80Count: 0, below50Count: 0 });
  const [campusInfo, setCampusInfo] = useState({
    institutionName: 'Apex Institute of Technology',
    campusCode: 'AIT-2026',
    academicYear: '2025-2026',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const [tRes, sRes, semRes, attRes, setRes] = await Promise.all([
          api.getTeachers(),
          api.getStudents(),
          api.getSemesters(),
          api.getAttendanceReport({}),
          api.getCampusSettings().catch(() => ({ settings: { institutionName: 'Apex Institute of Technology', campusCode: 'AIT-2026', academicYear: '2025-2026' } })),
        ]);
        setTeachersCount(tRes.total);
        setStudentsCount(sRes.total);
        setActiveSemesters(semRes.semesters.filter((s) => s.status === 'active'));
        setAttendanceSummary(attRes.metrics);
        if (setRes && setRes.settings) {
          setCampusInfo({
            institutionName: setRes.settings.institutionName,
            campusCode: setRes.settings.campusCode,
            academicYear: setRes.settings.academicYear,
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">
              College Executive Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#13284A] text-white">
              AY {campusInfo.academicYear}
            </span>
          </div>
          <p className="text-xs text-[#667085]">
            {campusInfo.institutionName} ({campusInfo.campusCode}) • Operations control center for admissions, faculty allocations, and academic compliance.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <button
            onClick={() => onNavigate('settings')}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Server className="w-4 h-4 text-[#2E6FB0]" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => onNavigate('timetable')}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#E0982A]" />
            <span>AI Timetable</span>
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Users className="w-4 h-4 text-[#5B93D1]" />
            <span>Bulk Enroll</span>
          </button>
        </div>
      </div>

      {/* Clean Slate Onboarding Card (Shown when 0 teachers and 0 students) */}
      {!loading && teachersCount === 0 && studentsCount === 0 && (
        <div className="p-5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 rounded-xl border border-[#2E6FB0]/30 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#13284A]">
                <ShieldCheck className="w-5 h-5 text-[#2E6FB0]" />
                <h3 className="text-sm font-bold">Clean Production Slate Ready for Live Testing</h3>
              </div>
              <p className="text-xs text-[#667085] max-w-2xl leading-relaxed">
                All demo records have been cleared. Follow these 3 easy steps to test with your actual institution records:
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
              Clean Slate (0 Demo Records)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onNavigate('teachers')}
              className="p-3.5 bg-white rounded-lg border border-[#DCE3ED] hover:border-[#13284A] transition-all cursor-pointer space-y-1 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#13284A] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-[#13284A] group-hover:text-[#2E6FB0]">Add or Bulk Upload Faculty</h4>
              </div>
              <p className="text-[11px] text-[#667085]">
                Register professor logins via single form or Excel/CSV template.
              </p>
            </div>

            <div
              onClick={() => onNavigate('students')}
              className="p-3.5 bg-white rounded-lg border border-[#DCE3ED] hover:border-[#13284A] transition-all cursor-pointer space-y-1 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E6FB0] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-[#13284A] group-hover:text-[#2E6FB0]">Bulk Enroll Student Cohorts</h4>
              </div>
              <p className="text-[11px] text-[#667085]">
                Upload student USN lists via XLSX with instant batch validation.
              </p>
            </div>

            <div
              onClick={() => onNavigate('timetable')}
              className="p-3.5 bg-white rounded-lg border border-[#DCE3ED] hover:border-[#13284A] transition-all cursor-pointer space-y-1 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E0982A] text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-[#13284A] group-hover:text-[#2E6FB0]">Timetable AI & Subject Mapping</h4>
              </div>
              <p className="text-[11px] text-[#667085]">
                Extract weekly periods and map subjects directly to teachers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Faculty Members"
          value={teachersCount}
          subtitle="Provisioned teacher logins"
          icon={UserCheck}
          accentColor="navy"
        />
        <MetricCard
          title="Enrolled Students"
          value={studentsCount}
          subtitle="USN-verified active students"
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

      {/* Quick Launchpad & Workflows */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
          Core Academic Operations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('teachers')}
            className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs hover:border-[#13284A] transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E6FB0] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#13284A] group-hover:text-[#2E6FB0] transition-colors">
                Teacher Master Directory
              </h4>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Add faculty members, upload CSV registries, and inspect subject allocations.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#2E6FB0] flex items-center gap-1">
              Manage Faculty →
            </div>
          </div>

          <div
            onClick={() => onNavigate('students')}
            className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs hover:border-[#13284A] transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#13284A] group-hover:text-emerald-700 transition-colors">
                Student Bulk Import (XLSX)
              </h4>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Validate student batches, correct errors inline, and update USN records cleanly.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
              Open Import Terminal →
            </div>
          </div>

          <div
            onClick={() => onNavigate('timetable')}
            className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs hover:border-[#13284A] transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#E0982A] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#13284A] group-hover:text-[#E0982A] transition-colors">
                AI Timetable Allocation
              </h4>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Gemini-powered extraction of Semester, Subject, Subject Code, and Faculty with confidence scores.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#E0982A] flex items-center gap-1">
              Extract & Review →
            </div>
          </div>

          <div
            onClick={() => onNavigate('settings')}
            className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs hover:border-[#13284A] transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#13284A] group-hover:text-purple-700 transition-colors">
                Deploy & Data Recovery
              </h4>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                Campus JSON database backups, institutional profile, and production deployment center.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-purple-700 flex items-center gap-1">
              Open Deployment Center →
            </div>
          </div>
        </div>
      </div>

      {/* Active Semester Status Banner */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#13284A]/10 text-[#13284A] rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#667085] uppercase">Current Active Term:</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Spring 2026 (Sem 4)
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Enforcing single active term rules across attendance, assignments, and grade entry.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('semesters')}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          View Semester Lifecycle →
        </button>
      </div>
    </div>
  );
};
