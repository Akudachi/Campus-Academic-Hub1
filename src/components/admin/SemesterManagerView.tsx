import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Archive,
  Calendar,
  AlertCircle,
  BookOpen,
  Users,
  ShieldCheck,
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  GraduationCap,
  CheckSquare,
  Square,
  Trash2,
  Clock,
  Sparkles,
  Filter,
  Check,
  UserCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Semester, Department, CampusSettings } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

interface EnrichedSemester extends Semester {
  name: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  subjectsCount: number;
  studentsCount: number;
  teacherAssignmentsCount: number;
}

interface SemesterStudentItem {
  id: string;
  userId: string;
  usn: string;
  name: string;
  email: string;
  department: string;
  currentSemester: number;
  section: string;
  attendancePercentage: number;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Eng' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Comm Eng' },
  { id: 'dept-ise', code: 'ISE', name: 'Information Science' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Eng' },
  { id: 'dept-civil', code: 'CIVIL', name: 'Civil Eng' },
  { id: 'dept-aiml', code: 'AI-ML', name: 'Artificial Intelligence' },
];

export const SemesterManagerView: React.FC = () => {
  const [semesters, setSemesters] = useState<EnrichedSemester[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [settings, setSettings] = useState<CampusSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [switchingTerm, setSwitchingTerm] = useState(false);
  const { showToast } = useAuth();

  // Create Semester Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSemNumber, setNewSemNumber] = useState<number>(6);
  const [newSemDept, setNewSemDept] = useState<string>('CSE');
  const [newSemSection, setNewSemSection] = useState<string>('A');
  const [newSemAY, setNewSemAY] = useState<string>('2025-2026');
  const [newSemStatus, setNewSemStatus] = useState<'setup' | 'active'>('active');

  // Promotion Modal State
  const [promoteSemester, setPromoteSemester] = useState<EnrichedSemester | null>(null);
  const [semesterStudents, setSemesterStudents] = useState<SemesterStudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetSemesterNum, setTargetSemesterNum] = useState<number>(7);
  const [targetAY, setTargetAY] = useState<string>('2025-2026');
  const [autoActivateNext, setAutoActivateNext] = useState<boolean>(true);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const [semRes, deptRes, settingsRes] = await Promise.all([
        api.getSemesters(),
        api.getDepartments().catch(() => ({ departments: DEFAULT_DEPARTMENTS })),
        api.getCampusSettings().catch(() => ({ settings: null })),
      ]);
      setSemesters(semRes.semesters as EnrichedSemester[]);
      if (deptRes.departments && deptRes.departments.length > 0) {
        setDepartments(deptRes.departments);
      }
      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load semester cycles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleSwitchTerm = async (termType: 'even' | 'odd') => {
    setSwitchingTerm(true);
    try {
      const res = await api.switchSemesterTerm({
        termType,
        activateMatchingSemesters: true,
      });
      setSettings(res.settings);
      showToast(
        `Switched operational term to ${termType === 'even' ? 'Even Semesters (2, 4, 6, 8)' : 'Odd Semesters (1, 3, 5, 7)'}! Updated semester cycles.`,
        'success'
      );
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch semester term', 'error');
    } finally {
      setSwitchingTerm(false);
    }
  };

  const handleActivate = async (semesterId: string) => {
    setIsProcessing(true);
    try {
      await api.activateSemester(semesterId);
      showToast('Semester activated! It is now the primary active term.', 'success');
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to activate semester', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.createSemester({
        number: Number(newSemNumber),
        departmentCode: newSemDept,
        section: newSemSection,
        academicYear: newSemAY,
        status: newSemStatus,
      });
      showToast(`Semester ${newSemNumber} (${newSemDept} Sec ${newSemSection}) created successfully!`, 'success');
      setIsCreateModalOpen(false);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to create semester', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSemester = async (sem: EnrichedSemester) => {
    if (!window.confirm(`Are you sure you want to delete Semester ${sem.number} (${sem.departmentCode})?`)) return;
    setIsProcessing(true);
    try {
      await api.deleteSemester(sem.id);
      showToast(`Semester ${sem.number} deleted successfully.`, 'info');
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete semester', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPromotionWizard = async (sem: EnrichedSemester) => {
    setPromoteSemester(sem);
    const nextNum = sem.number < 8 ? sem.number + 1 : 9;
    setTargetSemesterNum(nextNum);
    setTargetAY(sem.academicYear || '2025-2026');
    setAutoActivateNext(true);
    setLoadingStudents(true);

    try {
      const res = await api.getSemesterStudents(sem.id);
      setSemesterStudents(res.students);
      // Pre-select all students
      setSelectedStudentIds(res.students.map((s) => s.id));
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch semester students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === semesterStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(semesterStudents.map((s) => s.id));
    }
  };

  const handleExecutePromotion = async () => {
    if (!promoteSemester) return;
    setIsProcessing(true);
    try {
      const res = await api.completeAndPromoteSemester(promoteSemester.id, {
        targetSemesterNumber: targetSemesterNum,
        targetAcademicYear: targetAY,
        studentIds: selectedStudentIds,
        activateNextSemester: autoActivateNext,
      });

      showToast(res.message, 'success');
      setPromoteSemester(null);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete semester and promote students', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSemesters = semesters.filter((s) => {
    if (selectedDeptFilter === 'ALL') return true;
    return s.departmentCode.toUpperCase() === selectedDeptFilter.toUpperCase();
  });

  const activeSemestersCount = semesters.filter((s) => s.status === 'active').length;
  const totalStudentsEnrolled = semesters.reduce((acc, s) => acc + (s.studentsCount || 0), 0);

  // Group student distribution across semesters for current department filter
  const currentDeptForMap = selectedDeptFilter === 'ALL' ? 'CSE' : selectedDeptFilter;
  const progressionSteps = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">Semester Lifecycle & Batch Promotion</h2>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#13284A]/10 text-[#13284A]">
              Automated Progression
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 max-w-2xl">
            Create academic terms for any semester (1 through 8). When a semester is completed, students automatically transfer to the next semester cycle (e.g. Sem 6 ➔ Sem 7) while locking historic attendance and mark records.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Semester Cycle
        </button>
      </div>

      {/* Campus Term Parity Quick-Switch Banner */}
      <div className="p-4 rounded-xl bg-white border border-[#DCE3ED] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[#2E6FB0]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#13284A]">Active Institutional Term:</span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 text-[#13284A] border border-blue-200">
                {settings?.semesterTermType === 'even'
                  ? 'Even Semester (2, 4, 6, 8)'
                  : settings?.semesterTermType === 'odd'
                  ? 'Odd Semester (1, 3, 5, 7)'
                  : settings?.currentSemesterTerm || 'Even Semester (2, 4, 6, 8)'}
              </span>
            </div>
            <p className="text-[11px] text-[#667085] mt-0.5">
              {settings?.semesterTermType === 'even'
                ? 'Currently running even terms (Semesters 2, 4, 6, 8). Switch below to activate odd terms across all branches.'
                : settings?.semesterTermType === 'odd'
                ? 'Currently running odd terms (Semesters 1, 3, 5, 7). Switch below to activate even terms across all branches.'
                : 'Custom active term configured in Campus Settings.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSwitchTerm('even')}
            disabled={switchingTerm || settings?.semesterTermType === 'even'}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
              settings?.semesterTermType === 'even'
                ? 'bg-blue-50 border-[#2E6FB0] text-[#13284A] font-extrabold cursor-default'
                : 'bg-white border-[#DCE3ED] text-[#667085] hover:bg-slate-50 hover:border-blue-300'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${settings?.semesterTermType === 'even' ? 'text-[#2E6FB0]' : 'text-slate-300'}`} />
            Even Term (2, 4, 6, 8)
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTerm('odd')}
            disabled={switchingTerm || settings?.semesterTermType === 'odd'}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
              settings?.semesterTermType === 'odd'
                ? 'bg-blue-50 border-[#2E6FB0] text-[#13284A] font-extrabold cursor-default'
                : 'bg-white border-[#DCE3ED] text-[#667085] hover:bg-slate-50 hover:border-blue-300'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${settings?.semesterTermType === 'odd' ? 'text-[#2E6FB0]' : 'text-slate-300'}`} />
            Odd Term (1, 3, 5, 7)
          </button>
        </div>
      </div>

      {/* Visual Progression Map */}
      <div className="bg-gradient-to-r from-slate-900 via-[#13284A] to-[#1E3A63] p-5 rounded-xl text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Department Academic Progression Pipeline ({currentDeptForMap})
            </h3>
          </div>
          <span className="text-[11px] text-slate-300">
            {activeSemestersCount} Active Cycle{activeSemestersCount === 1 ? '' : 's'} • {totalStudentsEnrolled} Total Students Managed
          </span>
        </div>

        {/* Step Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 pt-1">
          {progressionSteps.map((semNum) => {
            const matchSem = semesters.find(
              (s) => s.number === semNum && (selectedDeptFilter === 'ALL' ? s.departmentCode === 'CSE' : s.departmentCode === selectedDeptFilter)
            );
            const isActive = matchSem?.status === 'active';
            const isArchived = matchSem?.status === 'archived';
            const studentCount = matchSem?.studentsCount || 0;

            return (
              <div
                key={semNum}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-[#2E6FB0]/40 border-amber-400/80 ring-2 ring-amber-400/40 shadow-sm'
                    : isArchived
                    ? 'bg-white/5 border-white/10 opacity-75'
                    : matchSem
                    ? 'bg-white/10 border-white/20'
                    : 'bg-black/20 border-dashed border-white/10 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold">Sem {semNum}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Term" />
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {studentCount}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-amber-300' : isArchived ? 'text-slate-400' : 'text-slate-300'}`}>
                    {matchSem ? matchSem.status : 'Empty'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDeptFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedDeptFilter === 'ALL'
              ? 'bg-[#13284A] text-white shadow-xs'
              : 'bg-white border border-[#DCE3ED] text-[#667085] hover:bg-slate-50'
          }`}
        >
          All Departments ({semesters.length})
        </button>
        {departments.map((dept) => {
          const count = semesters.filter((s) => s.departmentCode === dept.code).length;
          return (
            <button
              key={dept.code}
              onClick={() => setSelectedDeptFilter(dept.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedDeptFilter === dept.code
                  ? 'bg-[#13284A] text-white shadow-xs'
                  : 'bg-white border border-[#DCE3ED] text-[#667085] hover:bg-slate-50'
              }`}
            >
              {dept.code} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Semesters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-sm text-[#667085] bg-white rounded-xl border border-[#DCE3ED]">
            Loading semester lifecycles...
          </div>
        ) : filteredSemesters.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-[#667085] bg-white rounded-xl border border-[#DCE3ED] space-y-3">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No semester cycles found for {selectedDeptFilter}.</p>
            <button
              onClick={() => {
                if (selectedDeptFilter !== 'ALL') setNewSemDept(selectedDeptFilter);
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Semester Cycle
            </button>
          </div>
        ) : (
          filteredSemesters.map((sem, idx) => {
            const isActive = sem.status === 'active';
            const isSetup = sem.status === 'setup';
            const isArchived = sem.status === 'archived';

            return (
              <div
                key={sem.id || `sem-${idx}`}
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                  isActive
                    ? 'border-[#13284A] ring-2 ring-[#13284A]/10 bg-gradient-to-b from-blue-50/20 to-white'
                    : 'border-[#DCE3ED]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-[#13284A] border border-slate-200">
                          Sem {sem.number} • {sem.departmentCode}
                        </span>
                        <span className="text-[11px] font-bold text-[#667085]">
                          Sec {sem.section}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#13284A] mt-1.5 font-serif">
                        Semester {sem.number} ({sem.departmentCode})
                      </h3>
                      <p className="text-[11px] text-[#667085]">
                        Academic Year: <strong>AY {sem.academicYear}</strong>
                      </p>
                    </div>
                    <StatusPill status={sem.status} size="sm" />
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-lg space-y-2 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-[#2E6FB0]" />
                        Enrolled Students:
                      </span>
                      <span className="font-bold text-[#13284A]">{sem.studentsCount} Students</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <BookOpen className="w-3.5 h-3.5 text-[#2E6FB0]" />
                        Subjects Offered:
                      </span>
                      <span className="font-bold text-slate-800">{sem.subjectsCount} Subjects</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-[#2E6FB0]" />
                        Faculty Allocated:
                      </span>
                      <span className="font-bold text-slate-800">{sem.teacherAssignmentsCount} Faculty</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
                  {isSetup && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleActivate(sem.id)}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start / Set as Active Term
                    </button>
                  )}

                  {isActive && (
                    <button
                      disabled={isProcessing}
                      onClick={() => openPromotionWizard(sem)}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                      Complete & Transfer to Sem {sem.number < 8 ? sem.number + 1 : 'Graduation'} →
                    </button>
                  )}

                  {isArchived && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 py-2 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center gap-1.5">
                        <Archive className="w-3.5 h-3.5" />
                        Archived & Read-Only
                      </div>
                      <button
                        title="Reactivate Semester"
                        onClick={() => handleActivate(sem.id)}
                        className="p-2 text-xs text-slate-500 hover:text-[#2E6FB0] hover:bg-slate-100 rounded-lg transition-colors border border-[#DCE3ED] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {sem.studentsCount === 0 && (
                    <button
                      onClick={() => handleDeleteSemester(sem)}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-rose-600 transition-colors pt-1 cursor-pointer"
                    >
                      Remove Empty Cycle
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE SEMESTER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Semester Cycle"
        subtitle="Provision an academic cycle for any semester (1 through 8)."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSemester} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Semester Number *</label>
              <select
                value={newSemNumber}
                onChange={(e) => setNewSemNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Department / Branch *</label>
              <select
                value={newSemDept}
                onChange={(e) => setNewSemDept(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] bg-white"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Section *</label>
              <input
                type="text"
                value={newSemSection}
                onChange={(e) => setNewSemSection(e.target.value.toUpperCase())}
                placeholder="e.g. A, B, C"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Academic Year *</label>
              <input
                type="text"
                value={newSemAY}
                onChange={(e) => setNewSemAY(e.target.value)}
                placeholder="e.g. 2025-2026"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700">Initial Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewSemStatus('active')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  newSemStatus === 'active'
                    ? 'border-[#13284A] bg-blue-50/50 text-[#13284A] font-bold'
                    : 'border-[#DCE3ED] text-[#667085]'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  Start Live (Active)
                </p>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Immediately ready for attendance taking & test marks.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNewSemStatus('setup')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  newSemStatus === 'setup'
                    ? 'border-[#13284A] bg-blue-50/50 text-[#13284A] font-bold'
                    : 'border-[#DCE3ED] text-[#667085]'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Draft / Setup
                </p>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Configure student lists & timetables before opening term.
                </p>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors shadow-xs cursor-pointer"
            >
              {isProcessing ? 'Creating...' : 'Create Semester Cycle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* BATCH PROMOTION & PROGRESSION MODAL */}
      <Modal
        isOpen={!!promoteSemester}
        onClose={() => setPromoteSemester(null)}
        title={
          promoteSemester
            ? `Promote & Transfer Semester ${promoteSemester.number} (${promoteSemester.departmentCode})`
            : 'Promote Students'
        }
        subtitle="Archive current term and automatically progress students to the next semester cycle."
        maxWidth="2xl"
      >
        {promoteSemester && (
          <div className="space-y-4 text-xs">
            {/* Progression Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Current Semester</span>
                <h4 className="text-sm font-bold text-[#13284A]">
                  Semester {promoteSemester.number} ({promoteSemester.departmentCode})
                </h4>
                <p className="text-[11px] text-[#667085]">Section {promoteSemester.section} • AY {promoteSemester.academicYear}</p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-2xs">
                <ArrowRight className="w-5 h-5 text-[#2E6FB0] animate-pulse" />
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500">Target Progression</span>
                <h4 className="text-sm font-bold text-emerald-800">
                  {targetSemesterNum <= 8 ? `Semester ${targetSemesterNum} (${promoteSemester.departmentCode})` : 'Graduation / Alumni'}
                </h4>
                <p className="text-[11px] text-emerald-700">Section {promoteSemester.section} • AY {targetAY}</p>
              </div>
            </div>

            {/* Target Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Target Semester Number</label>
                <select
                  value={targetSemesterNum}
                  onChange={(e) => setTargetSemesterNum(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white focus:ring-1 focus:ring-[#2E6FB0]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n} {n === promoteSemester.number + 1 ? '(Next Sequential)' : ''}
                    </option>
                  ))}
                  <option value={9}>🎓 Semester 8 Complete (Graduate Batch)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Next Academic Year</label>
                <input
                  type="text"
                  value={targetAY}
                  onChange={(e) => setTargetAY(e.target.value)}
                  placeholder="e.g. 2025-2026 or 2026-2027"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white focus:ring-1 focus:ring-[#2E6FB0]"
                />
              </div>

              <div className="col-span-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoActivateNext}
                    onChange={(e) => setAutoActivateNext(e.target.checked)}
                    className="w-4 h-4 rounded text-[#13284A] focus:ring-[#2E6FB0]"
                  />
                  <span className="font-semibold text-slate-800">
                    Automatically create & activate Semester {targetSemesterNum <= 8 ? targetSemesterNum : '8+'} as the active live term
                  </span>
                </label>
              </div>
            </div>

            {/* Student Selection Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800">
                    Select Students to Transfer & Promote ({selectedStudentIds.length} / {semesterStudents.length})
                  </h4>
                  <span className="text-[11px] text-[#667085]">
                    (Uncheck to detain / retain specific students)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-xs font-bold text-[#2E6FB0] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {selectedStudentIds.length === semesterStudents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-[#DCE3ED] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {loadingStudents ? (
                  <div className="p-8 text-center text-xs text-[#667085]">Loading students...</div>
                ) : semesterStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#667085]">
                    No enrolled students found in Semester {promoteSemester.number} ({promoteSemester.departmentCode}).
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.length === semesterStudents.length && semesterStudents.length > 0}
                            onChange={handleSelectAllStudents}
                            className="w-3.5 h-3.5 rounded text-[#13284A]"
                          />
                        </th>
                        <th className="p-2.5 font-bold text-slate-700">USN</th>
                        <th className="p-2.5 font-bold text-slate-700">Student Name</th>
                        <th className="p-2.5 font-bold text-slate-700 text-right">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {semesterStudents.map((st) => {
                        const isSelected = selectedStudentIds.includes(st.id);
                        return (
                          <tr
                            key={st.id}
                            onClick={() => toggleStudentSelection(st.id)}
                            className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/30' : 'opacity-60 bg-rose-50/20'
                            }`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleStudentSelection(st.id)}
                                className="w-3.5 h-3.5 rounded text-[#13284A]"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-[#13284A]">{st.usn}</td>
                            <td className="p-2.5 font-medium text-slate-800">{st.name}</td>
                            <td className="p-2.5 text-right font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  st.attendancePercentage >= 75
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {st.attendancePercentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Confirmation & Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-[#667085]">
                Freezes Sem {promoteSemester.number} records and moves <strong>{selectedStudentIds.length}</strong> student{selectedStudentIds.length === 1 ? '' : 's'} to Sem {targetSemesterNum}.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromoteSemester(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecutePromotion}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  {isProcessing
                    ? 'Transferring...'
                    : `Complete Sem ${promoteSemester.number} & Promote (${selectedStudentIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
