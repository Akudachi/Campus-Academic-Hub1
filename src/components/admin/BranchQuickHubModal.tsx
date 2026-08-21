import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Layers,
  Award,
  BarChart3,
  Percent,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Department, Student } from '../../types';
import { Modal } from '../common/Modal';

interface BranchQuickHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDeptCode?: string;
  onNavigate?: (tabId: string, params?: any) => void;
}

export const BranchQuickHubModal: React.FC<BranchQuickHubModalProps> = ({
  isOpen,
  onClose,
  initialDeptCode = 'CSE',
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>(initialDeptCode);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemFilter, setSelectedSemFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    if (initialDeptCode) {
      setSelectedDeptCode(initialDeptCode);
    }
  }, [initialDeptCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, studRes] = await Promise.all([
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getStudents().catch(() => ({ students: [] })),
      ]);

      if (deptRes?.departments && deptRes.departments.length > 0) {
        setDepartments(deptRes.departments);
      }
      setStudents(studRes?.students || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const currentDept: any = departments.find(
    (d) => d.code.toUpperCase() === selectedDeptCode.toUpperCase()
  ) || {
    id: `dept-${selectedDeptCode.toLowerCase()}`,
    code: selectedDeptCode,
    name: `${selectedDeptCode} Department`,
    studentsCount: 0,
    overallAttendance: 0,
    overallTestMarkAvg: 0,
    semesterBreakdown: [],
  };

  const branchStudents = students.filter(
    (s) => (s.department || '').toUpperCase() === selectedDeptCode.toUpperCase()
  );

  const overallAttendance = currentDept.overallAttendance ?? 0;
  const overallTestMarkAvg = currentDept.overallTestMarkAvg ?? 0;

  // Build the 8 semester breakdown
  const semesterList = [1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
    const existing = (currentDept.semesterBreakdown || []).find((b: any) => b.semesterNumber === semNum);
    const semStudents = branchStudents.filter((s) => s.currentSemester === semNum);
    
    const att = existing?.attendancePercentage ?? 0;
    const marks = existing?.testMarkAverage ?? 0;
    const count = semStudents.length > 0 ? semStudents.length : (existing?.studentCount ?? 0);

    return {
      semesterNumber: semNum,
      studentCount: count,
      attendancePercentage: att,
      testMarkAverage: marks,
    };
  });

  const filteredSemesters = selectedSemFilter === 'all'
    ? semesterList
    : semesterList.filter((s) => s.semesterNumber === selectedSemFilter);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="4xl"
    >
      <div className="space-y-4 -mt-3 text-xs">
        {/* Branch Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          <span className="font-bold text-[#13284A] shrink-0 mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#2E6FB0]" />
            Branch:
          </span>
          {departments.map((dept) => {
            const isSelected = dept.code.toUpperCase() === selectedDeptCode.toUpperCase();
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => {
                  setSelectedDeptCode(dept.code);
                  setSelectedSemFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#13284A] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="font-mono">{dept.code}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Selected Branch Header */}
        <div className="bg-linear-to-r from-[#13284A] to-[#1E3A63] p-4 rounded-xl text-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono px-2 py-0.5 rounded text-xs font-bold bg-blue-500/30 border border-blue-400/40 text-blue-200">
                {currentDept.code}
              </span>
              <h2 className="text-base font-bold text-white">{currentDept.name}</h2>
            </div>
            <p className="text-[11px] text-slate-300">
              Semesters 1 to 8 Overview
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg font-semibold text-white shrink-0 border border-white/10">
            <Users className="w-4 h-4 text-emerald-300" />
            <span>{branchStudents.length} Enrolled Students</span>
          </div>
        </div>

        {/* Two Performance Cards: Attendance & Test Marks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Attendance */}
          <div className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#13284A] uppercase tracking-wider text-[11px]">
                    Attendance Rate
                  </h3>
                  <span className="text-[10px] text-slate-500">Target: 80%</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold ${
                  overallAttendance >= 80 ? 'text-emerald-700' : overallAttendance > 0 ? 'text-amber-600' : 'text-slate-600'
                }`}>
                  {overallAttendance > 0 ? `${overallAttendance}%` : '-'}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, overallAttendance))}%` }}
              />
            </div>
          </div>

          {/* Test Marks */}
          <div className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-[#2E6FB0] rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#13284A] uppercase tracking-wider text-[11px]">
                    Test Marks Average
                  </h3>
                  <span className="text-[10px] text-slate-500">Max Score: 100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#2E6FB0]">
                  {overallTestMarkAvg > 0 ? overallTestMarkAvg : '-'}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#2E6FB0] rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, overallTestMarkAvg))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Semester-Wise Breakdown (Semesters 1 to 8) */}
        <div className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="font-bold text-[#13284A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2E6FB0]" />
              Semesters 1 to 8 Breakdown
            </span>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedSemFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedSemFilter === 'all'
                    ? 'bg-[#13284A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sNum) => (
                <button
                  key={sNum}
                  type="button"
                  onClick={() => setSelectedSemFilter(sNum)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    selectedSemFilter === sNum
                      ? 'bg-[#2E6FB0] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  S{sNum}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Semester Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredSemesters.map((sem) => (
              <div
                key={sem.semesterNumber}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-[#13284A]">
                    Sem {sem.semesterNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {sem.studentCount} st.
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Att:</span>
                  <span className="font-bold text-slate-700">
                    {sem.attendancePercentage > 0 ? `${sem.attendancePercentage}%` : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Avg:</span>
                  <span className="font-bold text-[#2E6FB0]">
                    {sem.testMarkAverage > 0 ? sem.testMarkAverage : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
