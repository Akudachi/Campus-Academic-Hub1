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
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
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
    institutionName: 'Campus Institute of Technology',
    campusCode: 'CIT-2026',
    academicYear: '2025-2026',
    currentSemesterTerm: 'Even Semester (Sem 2, 4, 6, 8)',
    semesterTermType: 'even',
  });
  const [loading, setLoading] = useState(true);

  // Branch Quick Access Modal State
  const [isBranchHubOpen, setIsBranchHubOpen] = useState(false);
  const [selectedBranchCode, setSelectedBranchCode] = useState('CSE');

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const [tRes, sRes, semRes, attRes, setRes, deptRes] = await Promise.all([
          api.getTeachers().catch(() => ({ total: 0, teachers: [] })),
          api.getStudents().catch(() => ({ total: 0, students: [] })),
          api.getSemesters().catch(() => ({ semesters: [] })),
          api.getAttendanceReport({}).catch(() => ({
            metrics: { avgAttendance: 0, below80Count: 0, below50Count: 0 },
          })),
          api.getCampusSettings().catch(() => ({
            settings: {
              institutionName: 'Campus Institute of Technology',
              campusCode: 'CIT-2026',
              academicYear: '2025-2026',
              currentSemesterTerm: 'Even Semester (Sem 2, 4, 6, 8)',
              semesterTermType: 'even',
            },
          })),
          api.getDepartments().catch(() => ({ departments: [] })),
        ]);

        setTeachersCount(tRes.total ?? (tRes.teachers?.length || 0));
        setStudentsCount(sRes.total ?? (sRes.students?.length || 0));
        setActiveSemesters((semRes.semesters || []).filter((s: any) => s.status === 'active'));
        if (attRes?.metrics) {
          setAttendanceSummary(attRes.metrics);
        }
        if (deptRes?.departments) {
          setDepartments(deptRes.departments);
        }
        if (setRes?.settings) {
          setCampusInfo({
            institutionName: setRes.settings.institutionName || 'Campus Institute of Technology',
            campusCode: setRes.settings.campusCode || 'CIT-2026',
            academicYear: setRes.settings.academicYear || '2025-2026',
            currentSemesterTerm: setRes.settings.currentSemesterTerm || 'Even Semester (Sem 2, 4, 6, 8)',
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
    <div className="space-y-4 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Mobile App Style Hero Header */}
      <div className="bg-linear-to-br from-[#13284A] via-[#1E3A63] to-[#2E6FB0] p-4 sm:p-5 rounded-2xl text-white shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#E0982A] text-slate-950">
                ADMINISTRATOR
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-white">
                {campusInfo.academicYear}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live System
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              {campusInfo.institutionName}
            </h1>
            <p className="text-[11px] text-slate-200">
              {departments.length} Branches • {teachersCount} Faculty • {studentsCount} Enrolled Students
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
            <button
              id="quick-import-students-btn"
              onClick={() => onNavigate('students')}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-[#13284A] hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Users className="w-3.5 h-3.5 text-[#2E6FB0]" />
              <span>Enroll Students</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats (Compact 4-column Grid: 2x2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Total Faculty</span>
          <span className="text-base sm:text-lg font-bold text-[#13284A]">{teachersCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Enrolled Students</span>
          <span className="text-base sm:text-lg font-bold text-[#2E6FB0]">{studentsCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Campus Attendance</span>
          <span className="text-base sm:text-lg font-bold text-emerald-700">
            {attendanceSummary.avgAttendance > 0 ? `${attendanceSummary.avgAttendance}%` : '100%'}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs text-center">
          <span className="text-[10px] font-semibold text-slate-500 block truncate">Attendance Alerts</span>
          <span className="text-base sm:text-lg font-bold text-amber-700">
            {attendanceSummary.below80Count}
          </span>
        </div>
      </div>

      {/* Term Status Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#13284A] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2E6FB0]" />
            Active Academic Term
          </span>
          <button
            onClick={() => onNavigate('semesters')}
            className="text-[11px] font-semibold text-[#2E6FB0] hover:underline"
          >
            Configure →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-semibold">Active Cycle</span>
            <span className="font-bold text-[#13284A]">
              {campusInfo.semesterTermType === 'even' ? 'Even Semesters (2, 4, 6, 8)' : 'Odd Semesters (1, 3, 5, 7)'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-semibold">Active Cohorts</span>
            <span className="font-bold text-[#2E6FB0]">
              {activeSemesters.length} Active Semesters
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-semibold">Threshold</span>
            <span className="font-bold text-emerald-700">
              80% Attendance Rule
            </span>
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
