import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Archive,
  Calendar,
  AlertCircle,
  BookOpen,
  Users,
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  GraduationCap,
  CheckSquare,
  Square,
  Trash2,
  Filter,
  UserCheck,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Semester, Department, CampusSettings } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
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

interface SemesterManagerViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const SemesterManagerView: React.FC<SemesterManagerViewProps> = ({ onBack, onNavigate }) => {
  const [semesters, setSemesters] = useState<EnrichedSemester[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [settings, setSettings] = useState<CampusSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedSemNumberFilter, setSelectedSemNumberFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
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

  // Delete Confirmation Modal State
  const [semesterToDelete, setSemesterToDelete] = useState<EnrichedSemester | null>(null);

  // Promotion Modal State
  const [promoteSemester, setPromoteSemester] = useState<EnrichedSemester | null>(null);
  const [graduatingSem8Direct, setGraduatingSem8Direct] = useState<EnrichedSemester | null>(null);
  const [semesterStudents, setSemesterStudents] = useState<SemesterStudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
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
        `Switched to ${termType === 'even' ? 'Even Semesters (2, 4, 6, 8)' : 'Odd Semesters (1, 3, 5, 7)'}`,
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
      showToast('Semester activated successfully', 'success');
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
      showToast(`Semester ${newSemNumber} (${newSemDept}) created!`, 'success');
      setIsCreateModalOpen(false);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to create semester', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeleteSemester = async () => {
    if (!semesterToDelete) return;
    setIsProcessing(true);
    try {
      await api.deleteSemester(semesterToDelete.id);
      showToast(`Semester ${semesterToDelete.number} (${semesterToDelete.departmentCode}) deleted`, 'info');
      setSemesterToDelete(null);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete semester', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPromotionWizard = async (sem: EnrichedSemester) => {
    setPromoteSemester(sem);
    const nextNum = sem.number < 8 ? sem.number + 1 : 8;
    setTargetSemesterNum(nextNum);
    setTargetAY(sem.academicYear || '2025-2026');
    setAutoActivateNext(true);
    setLoadingStudents(true);
    setStudentSearch('');

    try {
      const res = await api.getSemesterStudents(sem.id);
      setSemesterStudents(res.students);
      setSelectedStudentIds(res.students.map((s) => s.id));
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch students', 'error');
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

      showToast(res.message || 'Batch promoted successfully', 'success');
      setPromoteSemester(null);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote students', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectGraduateSem8 = async () => {
    if (!graduatingSem8Direct) return;
    setIsProcessing(true);
    try {
      const res = await api.completeSemester(graduatingSem8Direct.id);
      showToast(res.message || '8th Semester graduated', 'success');
      setGraduatingSem8Direct(null);
      await fetchSemesters();
    } catch (err: any) {
      showToast(err.message || 'Failed to graduate batch', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSemesters = semesters.filter((s) => {
    const matchDept = selectedDeptFilter === 'ALL' || s.departmentCode.toUpperCase() === selectedDeptFilter.toUpperCase();
    const matchSem = selectedSemNumberFilter === 'ALL' || s.number === Number(selectedSemNumberFilter);
    const matchStatus = selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;
    return matchDept && matchSem && matchStatus;
  });

  const searchedStudents = semesterStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.usn.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-3.5 animate-fade-in pb-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <h1 className="text-base font-bold text-[#13284A]">Semester Manager</h1>
            <p className="text-[11px] text-slate-500">Manage semesters 1–8 and student progression.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 shadow-2xs active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Semester</span>
          </button>
        </div>
      </div>

      {/* Quick Term Switcher */}
      <div className="p-3 bg-white rounded-xl border border-[#DCE3ED] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-[#2E6FB0]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#13284A] block">Active Term</span>
            <span className="text-[11px] text-slate-500">
              {settings?.semesterTermType === 'even' ? 'Even Semesters (2, 4, 6, 8)' : 'Odd Semesters (1, 3, 5, 7)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleSwitchTerm('even')}
            disabled={switchingTerm}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              settings?.semesterTermType === 'even'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Even (2, 4, 6, 8)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTerm('odd')}
            disabled={switchingTerm}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              settings?.semesterTermType === 'odd'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Odd (1, 3, 5, 7)
          </button>
        </div>
      </div>

      {/* Quick Filter Strip */}
      <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2">
        {/* Branch Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-500 shrink-0 text-[11px]">Branch:</span>
          <button
            onClick={() => setSelectedDeptFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors shrink-0 ${
              selectedDeptFilter === 'ALL'
                ? 'bg-[#13284A] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {departments.map((dept) => (
            <button
              key={dept.code}
              onClick={() => setSelectedDeptFilter(dept.code)}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors shrink-0 ${
                selectedDeptFilter === dept.code
                  ? 'bg-[#13284A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dept.code}
            </button>
          ))}
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 shrink-0 text-[11px]">Sem:</span>
          <button
            onClick={() => setSelectedSemNumberFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors shrink-0 ${
              selectedSemNumberFilter === 'ALL'
                ? 'bg-[#2E6FB0] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All (1–8)
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedSemNumberFilter(selectedSemNumberFilter === String(num) ? 'ALL' : String(num))}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors shrink-0 ${
                selectedSemNumberFilter === String(num)
                  ? 'bg-[#2E6FB0] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              S{num}
            </button>
          ))}
        </div>
      </div>

      {/* Semesters Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED]">
            Loading semesters...
          </div>
        ) : filteredSemesters.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED] space-y-2">
            <p className="font-semibold text-slate-700">No semesters found</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Semester
            </button>
          </div>
        ) : (
          filteredSemesters.map((sem) => {
            const isActive = sem.status === 'active';
            const isSetup = sem.status === 'setup';
            const isArchived = sem.status === 'archived';

            return (
              <div
                key={sem.id}
                className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between shadow-2xs transition-all ${
                  isActive ? 'border-[#2E6FB0] ring-1 ring-[#2E6FB0]/20' : 'border-[#DCE3ED]'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top line: Badges and Delete Icon */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#13284A] text-white">
                        {sem.departmentCode}
                      </span>
                      <span className="font-bold text-xs text-[#13284A]">
                        Sem {sem.number} <span className="text-slate-400">({sem.section})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={sem.status} size="sm" />
                      <button
                        title="Delete Semester Cycle"
                        onClick={() => setSemesterToDelete(sem)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-lg text-center text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Students</span>
                      <span className="font-bold text-[#13284A]">{sem.studentsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Subjects</span>
                      <span className="font-bold text-[#13284A]">{sem.subjectsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Faculty</span>
                      <span className="font-bold text-[#13284A]">{sem.teacherAssignmentsCount}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 mt-3 space-y-1.5">
                  {isSetup && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleActivate(sem.id)}
                      className="w-full py-1.5 text-xs font-bold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>Set as Active</span>
                    </button>
                  )}

                  {isActive && (
                    <div className="space-y-1">
                      {sem.number === 8 ? (
                        <button
                          disabled={isProcessing}
                          onClick={() => setGraduatingSem8Direct(sem)}
                          className="w-full py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Graduate Sem 8</span>
                        </button>
                      ) : (
                        <button
                          disabled={isProcessing}
                          onClick={() => openPromotionWizard(sem)}
                          className="w-full py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>Promote to Sem {sem.number + 1}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {isArchived && (
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="text-slate-400 text-[11px] font-semibold">Archived</span>
                      <button
                        onClick={() => handleActivate(sem.id)}
                        className="px-2 py-1 text-xs text-[#2E6FB0] hover:underline font-bold"
                      >
                        Reactivate
                      </button>
                    </div>
                  )}

                  {/* Secondary Quick Delete button */}
                  <button
                    onClick={() => setSemesterToDelete(sem)}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-rose-600 transition-colors pt-0.5 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Delete Cycle</span>
                  </button>
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
        title="Add Semester"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester Number</label>
              <select
                value={newSemNumber}
                onChange={(e) => setNewSemNumber(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={newSemDept}
                onChange={(e) => setNewSemDept(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                value={newSemSection}
                onChange={(e) => setNewSemSection(e.target.value.toUpperCase())}
                placeholder="A"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={newSemAY}
                onChange={(e) => setNewSemAY(e.target.value)}
                placeholder="2025-2026"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#13284A] hover:bg-[#2E6FB0] rounded-lg shadow-2xs"
            >
              Save Semester
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!semesterToDelete}
        onClose={() => setSemesterToDelete(null)}
        title="Delete Semester Cycle"
        maxWidth="sm"
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#13284A]">
                Delete Semester {semesterToDelete?.number} ({semesterToDelete?.departmentCode})?
              </p>
              <p className="text-xs text-rose-700 font-medium mt-0.5">
                Section: {semesterToDelete?.section} &bull; AY: {semesterToDelete?.academicYear || '2025-2026'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                This permanently removes this semester cycle and its faculty-course allocations.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Students</span>
              <span className="font-bold text-slate-800 text-sm">{semesterToDelete?.studentsCount ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Subjects</span>
              <span className="font-bold text-slate-800 text-sm">{semesterToDelete?.subjectsCount ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Status</span>
              <span className="font-bold text-slate-800 text-sm capitalize">{semesterToDelete?.status}</span>
            </div>
          </div>

          {/* Action Buttons: Always prominent and visible */}
          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSemesterToDelete(null)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmDeleteSemester}
              className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Deleting...' : 'Delete Semester'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* PROMOTION MODAL */}
      <Modal
        isOpen={!!promoteSemester}
        onClose={() => setPromoteSemester(null)}
        title={`Promote Students: Sem ${promoteSemester?.number} → Sem ${targetSemesterNum}`}
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div>
              <span className="font-bold text-[#13284A] block">Target: Sem {targetSemesterNum}</span>
              <span className="text-[11px] text-slate-500">{promoteSemester?.departmentCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-600 font-semibold">
                Auto-activate next semester
              </label>
              <input
                type="checkbox"
                checked={autoActivateNext}
                onChange={(e) => setAutoActivateNext(e.target.checked)}
                className="rounded text-[#2E6FB0]"
              />
            </div>
          </div>

          {/* Student Search & Select All */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleSelectAllStudents}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 shrink-0"
            >
              {selectedStudentIds.length === semesterStudents.length ? 'Deselect All' : 'Select All'} ({selectedStudentIds.length}/{semesterStudents.length})
            </button>
          </div>

          {/* Student List */}
          <div className="max-h-60 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-1">
            {loadingStudents ? (
              <div className="py-6 text-center text-slate-500">Loading students...</div>
            ) : searchedStudents.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No students found</div>
            ) : (
              searchedStudents.map((s) => {
                const isSelected = selectedStudentIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleStudentSelection(s.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60 border border-blue-200/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#2E6FB0]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <span className="font-bold text-[#13284A] block">{s.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{s.usn}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600">
                      {s.attendancePercentage ? `${s.attendancePercentage}%` : '-'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPromoteSemester(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || selectedStudentIds.length === 0}
              onClick={handleExecutePromotion}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#13284A] hover:bg-[#2E6FB0] rounded-lg shadow-2xs disabled:opacity-50"
            >
              Promote ({selectedStudentIds.length}) Students
            </button>
          </div>
        </div>
      </Modal>

      {/* GRADUATE SEMESTER 8 CONFIRMATION MODAL */}
      <Modal
        isOpen={!!graduatingSem8Direct}
        onClose={() => setGraduatingSem8Direct(null)}
        title="Graduate 8th Semester Batch"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Are you sure you want to graduate and complete{' '}
            <strong>Semester 8 ({graduatingSem8Direct?.departmentCode})</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold">Final Academic Completion:</p>
            <p className="text-[11px]">
              This will archive the 8th semester cohort as graduated and update all associated academic records.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setGraduatingSem8Direct(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDirectGraduateSem8}
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
            >
              Confirm Graduation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
