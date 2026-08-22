import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  BookOpen,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  UserCheck,
  Check,
  Download,
  AlertTriangle,
  Edit2,
  Save,
  Zap,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Teacher, User, Subject, TeacherImportRowResult, Department } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { parseTeacherFile, parseTeacherText, downloadTeacherSampleExcel } from '../../lib/excelParser';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Eng' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Comm Eng' },
  { id: 'dept-ise', code: 'ISE', name: 'Information Science' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Eng' },
  { id: 'dept-civil', code: 'CIVIL', name: 'Civil Eng' },
];

interface TeacherMasterViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const TeacherMasterView: React.FC<TeacherMasterViewProps> = ({ onBack, onNavigate }) => {
  const [teachers, setTeachers] = useState<(Teacher & { user: User; assignedSubjectsCount: number })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<(Teacher & { user: User }) | null>(null);
  const [selectedSubjectIdToAssign, setSelectedSubjectIdToAssign] = useState('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Auto-Assign Modal State
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
  const [autoAssignDept, setAutoAssignDept] = useState('ALL');
  const [autoAssignSem, setAutoAssignSem] = useState('all');
  const [autoAssignReplace, setAutoAssignReplace] = useState(false);
  const [isSubmittingAutoAssign, setIsSubmittingAutoAssign] = useState(false);

  // Edit Teacher Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<(Teacher & { user: User }) | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    department: 'CSE',
    teacherCode: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech',
  });

  const { showToast } = useAuth();

  // Individual Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'CSE',
    teacherCode: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech',
    initialSubjectId: '',
  });
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  // Bulk Import Workflow States
  const [bulkStep, setBulkStep] = useState<'upload' | 'validation' | 'complete'>('upload');
  const [bulkText, setBulkText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [validationResults, setValidationResults] = useState<TeacherImportRowResult[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<Partial<TeacherImportRowResult>>({});
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teaRes, subRes, deptRes] = await Promise.all([
        api.getTeachers(),
        api.getSubjects(),
        api.getDepartments().catch(() => ({ departments: DEFAULT_DEPARTMENTS })),
      ]);
      setTeachers(teaRes.teachers);
      setSubjects(subRes.subjects);
      if (deptRes.departments && deptRes.departments.length > 0) {
        setDepartments(deptRes.departments);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute next recommended teacher code
  const getNextTeacherCode = () => {
    if (teachers.length === 0) return 'T008';
    const numbers = teachers
      .map((t) => parseInt(t.teacherCode.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 7;
    return `T${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    const nextCode = getNextTeacherCode();
    setFormData({
      name: '',
      email: '',
      department: 'CSE',
      teacherCode: nextCode,
      designation: 'Assistant Professor',
      qualification: 'M.Tech',
      initialSubjectId: '',
    });
    setIsAddModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const cleanName = name
      .toLowerCase()
      .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '.');
    const email = cleanName ? `${cleanName}@campus.edu` : '';
    setFormData((prev) => ({
      ...prev,
      name,
      email: prev.email && !prev.email.includes('@campus.edu') ? prev.email : email,
    }));
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.teacherCode.trim()) {
      showToast('Please fill all required faculty fields.', 'warning');
      return;
    }

    setIsSubmittingTeacher(true);
    try {
      await api.createTeacher({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
        teacherCode: formData.teacherCode.trim().toUpperCase(),
        designation: formData.designation,
        qualification: formData.qualification,
        initialSubjectId: formData.initialSubjectId || undefined,
      });

      showToast(`Faculty ${formData.name} (${formData.teacherCode.toUpperCase()}) added successfully!`, 'success');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleOpenEditModal = (t: Teacher & { user: User }) => {
    setSelectedTeacherForEdit(t);
    setEditFormData({
      name: t.user?.name || '',
      email: t.user?.email || '',
      department: t.department || 'CSE',
      teacherCode: t.teacherCode || '',
      designation: t.designation || 'Assistant Professor',
      qualification: t.qualification || 'M.Tech',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForEdit) return;
    setIsSubmittingTeacher(true);
    try {
      await api.updateTeacher(selectedTeacherForEdit.id, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        department: editFormData.department,
        teacherCode: editFormData.teacherCode.trim().toUpperCase(),
        designation: editFormData.designation,
        qualification: editFormData.qualification,
      });
      showToast(`Updated faculty ${editFormData.teacherCode.toUpperCase()} (${editFormData.name})`, 'success');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update faculty', 'error');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (t: Teacher & { user: User }) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${t.user?.name}" (${t.teacherCode})?`)) {
      return;
    }
    try {
      await api.deleteTeacher(t.id);
      showToast(`Faculty ${t.teacherCode} deleted.`, 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete faculty', 'error');
    }
  };

  const handleAutoAssign = async () => {
    setIsSubmittingAutoAssign(true);
    try {
      const res = await api.autoAssignTeachers({
        department: autoAssignDept === 'ALL' ? undefined : autoAssignDept,
        semesterNumber: autoAssignSem === 'all' ? undefined : Number(autoAssignSem),
        replaceExisting: autoAssignReplace,
      });
      showToast(res.message || `Successfully auto-assigned ${res.assignedCount} subjects.`, 'success');
      setIsAutoAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Auto-assign failed.', 'error');
    } finally {
      setIsSubmittingAutoAssign(false);
    }
  };

  const handleOpenAssignModal = (teacher: Teacher & { user: User }) => {
    setSelectedTeacherForAssign(teacher);
    setSelectedSubjectIdToAssign('');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForAssign || !selectedSubjectIdToAssign) {
      showToast('Please select a course to assign.', 'warning');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await api.assignTeacherSubject(selectedTeacherForAssign.id, {
        subjectId: selectedSubjectIdToAssign,
      });
      showToast('Course subject successfully assigned to faculty.', 'success');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Bulk File Handling
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setUploadedFileName(file.name);
    setIsProcessingBulk(true);
    try {
      let parsedRows: any[] = [];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        parsedRows = await parseTeacherFile(file);
      } else {
        const text = await file.text();
        setBulkText(text);
        parsedRows = parseTeacherText(text);
      }

      if (parsedRows.length === 0) {
        showToast('No readable teacher records found in this file.', 'warning');
        setIsProcessingBulk(false);
        return;
      }

      const res = await api.validateTeacherImport({ rows: parsedRows, fileName: file.name });
      setValidationResults(res.results);
      setValidCount(res.validRows);
      setInvalidCount(res.invalidRows);
      setBulkStep('validation');
      showToast(`Extracted and validated ${res.totalRows} faculty records from ${file.name}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to read file', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleValidateTextImport = async () => {
    if (!bulkText.trim()) {
      showToast('Please upload an Excel spreadsheet or paste faculty CSV records.', 'warning');
      return;
    }

    setIsProcessingBulk(true);
    try {
      const parsedRows = parseTeacherText(bulkText);
      const res = await api.validateTeacherImport({
        rows: parsedRows.length > 0 ? parsedRows : undefined,
        rawText: parsedRows.length === 0 ? bulkText : undefined,
      });

      setValidationResults(res.results);
      setValidCount(res.validRows);
      setInvalidCount(res.invalidRows);
      setBulkStep('validation');
      showToast(`Validated ${res.totalRows} faculty rows: ${res.validRows} ready to import.`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleCommitBulkImport = async () => {
    setIsProcessingBulk(true);
    try {
      const res = await api.commitTeacherImport({ rows: validationResults });
      showToast(
        `Faculty import successful: ${res.insertedCount} new faculty added, ${res.updatedCount} records updated with CSV codes.`,
        'success'
      );
      setBulkStep('complete');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleSaveInlineEdit = (index: number) => {
    const updated = [...validationResults];
    const currentRow = updated[index];
    const newCode = (editedRowData.teacherCode || currentRow.teacherCode).toUpperCase().trim();
    const newName = (editedRowData.name || currentRow.name).trim();
    const newDept = (editedRowData.department || currentRow.department).toUpperCase().trim();
    const newEmail = (editedRowData.email || currentRow.email).toLowerCase().trim();
    const newDesig = (editedRowData.designation || currentRow.designation).trim();
    const newQual = (editedRowData.qualification || currentRow.qualification).trim();

    const errors: string[] = [];
    if (!newName || newName.length < 2) errors.push('Faculty name is required.');
    if (!newCode) errors.push('Teacher Code is required.');

    updated[index] = {
      ...currentRow,
      teacherCode: newCode,
      name: newName,
      department: newDept,
      email: newEmail,
      designation: newDesig,
      qualification: newQual,
      isValid: errors.length === 0,
      errors,
    };

    setValidationResults(updated);
    setValidCount(updated.filter((r) => r.isValid).length);
    setInvalidCount(updated.filter((r) => !r.isValid).length);
    setEditingRowIndex(null);
    setEditedRowData({});
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesDept = deptFilter === 'ALL' || t.department === deptFilter;
    const matchesSearch =
      (t.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacherCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Navigation & Header */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Overview" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">Faculty & Teachers</h2>
          <p className="text-xs text-[#667085] mt-0.5">Faculty directory, codes, and course assignments.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <button
            id="open-auto-assign-modal-btn"
            onClick={() => setIsAutoAssignModalOpen(true)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            <span>Auto-Assign Subjects</span>
          </button>
          <button
            id="open-add-teacher-modal-btn"
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#2E6FB0]" />
            <span>Add Faculty</span>
          </button>
          <button
            id="open-teacher-import-modal-btn"
            onClick={() => {
              setBulkStep('upload');
              setUploadedFileName('');
              setBulkText('');
              setIsBulkModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-4 h-4 text-[#5B93D1]" />
            <span>Bulk Import (XLSX / CSV)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Faculty Members"
          value={teachers.length}
          subtitle="Registered professors and instructors"
          icon={GraduationCap}
          accentColor="navy"
        />
        <MetricCard
          title="Active Course Mappings"
          value={teachers.reduce((acc, t) => acc + (t.assignedSubjectsCount || 0), 0)}
          subtitle="Subjects with assigned faculty"
          icon={BookOpen}
          accentColor="blue"
        />
        <MetricCard
          title="Departments Active"
          value={Array.from(new Set(teachers.map((t) => t.department))).length}
          subtitle="CSE, ECE, ISE, MECH"
          icon={CheckCircle2}
          accentColor="green"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#DCE3ED]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="search-teachers-input"
            type="text"
            placeholder="Search by faculty name, code, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-semibold text-[#667085] shrink-0">Dept:</span>
          {['ALL', ...departments.map((d) => d.code)].map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                deptFilter === d
                  ? 'bg-[#13284A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Teacher Master Table */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#667085]">Loading faculty records...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#667085]">No faculty found matching the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation & Qual</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Assigned Courses</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t, idx) => (
                  <tr key={t.id || t.teacherCode || `tea-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#13284A]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {t.teacherCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{t.user?.name}</div>
                      <div className="text-[11px] text-[#667085]">ID: {t.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{t.department}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{t.designation}</div>
                      <div className="text-[11px] text-slate-500">{t.qualification}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {t.user?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          (t.assignedSubjectsCount || 0) > 0
                            ? 'bg-blue-50 text-[#2E6FB0] border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.assignedSubjectsCount || 0} Subjects
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAssignModal(t)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#DCE3ED] bg-white text-[#2E6FB0] hover:bg-blue-50 transition-colors shadow-2xs"
                        >
                          Assign Subject
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 text-xs font-semibold rounded-md border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                          title="Edit Faculty Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t)}
                          className="p-1.5 text-xs font-semibold rounded-md border border-[#DCE3ED] bg-white text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs"
                          title="Delete Faculty Member"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Assign Subjects Modal */}
      <Modal
        isOpen={isAutoAssignModalOpen}
        onClose={() => setIsAutoAssignModalOpen(false)}
        title="Auto-Assign Subjects to Faculty"
        subtitle="Automatically balance and assign semester courses to department faculty members."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Automated Course Distribution</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Assigns all active subjects evenly across teaching staff according to matching branch/department and semester curriculum.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
            <select
              value={autoAssignDept}
              onChange={(e) => setAutoAssignDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium"
            >
              <option value="ALL">All Departments (Campus-Wide)</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Semester</label>
            <select
              value={autoAssignSem}
              onChange={(e) => setAutoAssignSem(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium"
            >
              <option value="all">All Active Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="replace-existing-check"
              checked={autoAssignReplace}
              onChange={(e) => setAutoAssignReplace(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="replace-existing-check" className="text-xs font-medium text-slate-700 cursor-pointer">
              Replace and rebalance existing course assignments for selected faculty
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAutoAssignModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={isSubmittingAutoAssign}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              {isSubmittingAutoAssign ? 'Assigning...' : 'Auto-Assign Now'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Single Teacher Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Faculty Details"
        subtitle={`Modify profile and teacher code for ${selectedTeacherForEdit?.user?.name || 'Faculty'}.`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Code (as shown in CSV)</label>
              <input
                type="text"
                required
                placeholder="e.g. T001, ECE01"
                value={editFormData.teacherCode}
                onChange={(e) => setEditFormData({ ...editFormData, teacherCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white font-medium"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Varma"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Faculty Email</label>
            <input
              type="email"
              required
              placeholder="e.g. rajesh.varma@campus.edu"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                placeholder="e.g. Associate Professor"
                value={editFormData.designation}
                onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
              <input
                type="text"
                placeholder="e.g. Ph.D / M.Tech"
                value={editFormData.qualification}
                onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTeacher}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#5B93D1]" />
              {isSubmittingTeacher ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Single Teacher Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Individual Faculty"
        subtitle="Create an individual teacher profile and optionally assign their initial course."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Code</label>
              <input
                type="text"
                required
                placeholder="e.g. T008"
                value={formData.teacherCode}
                onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white font-medium"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Varma"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Faculty Email</label>
            <input
              type="email"
              required
              placeholder="e.g. rajesh.varma@campus.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                placeholder="e.g. Associate Professor"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
              <input
                type="text"
                placeholder="e.g. Ph.D / M.Tech"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>
          </div>

          {subjects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Initial Course / Subject (Optional)
              </label>
              <select
                value={formData.initialSubjectId}
                onChange={(e) => setFormData({ ...formData, initialSubjectId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white"
              >
                <option value="">-- Assign Later via AI Timetable or Manual --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} (Sem {sub.semesterNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTeacher}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-[#5B93D1]" />
              {isSubmittingTeacher ? 'Creating...' : 'Create Faculty Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Subject Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Course Subject"
        subtitle={`Assign a semester subject to ${selectedTeacherForAssign?.user?.name || 'Faculty'}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubject} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <p className="font-semibold text-[#13284A]">Faculty Member:</p>
            <p className="font-medium text-slate-700 mt-0.5">
              {selectedTeacherForAssign?.user?.name} ({selectedTeacherForAssign?.teacherCode}) - {selectedTeacherForAssign?.department}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subject</label>
            <select
              value={selectedSubjectIdToAssign}
              onChange={(e) => setSelectedSubjectIdToAssign(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} (Semester {sub.semesterNumber}, {sub.departmentCode || 'CSE'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAssign || !selectedSubjectIdToAssign}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmittingAssign ? 'Assigning...' : 'Confirm Subject Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Faculty Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setBulkStep('upload');
          setValidationResults([]);
          setUploadedFileName('');
        }}
        title="Faculty Bulk Import Workflow"
        subtitle="Upload XLSX/CSV spreadsheet or paste faculty records with automatic column mapping."
        maxWidth="4xl"
      >
        {bulkStep === 'upload' && (
          <div className="space-y-4">
            {/* Download Template Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-[#13284A]">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#2E6FB0] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Columns: Teacher Code, Faculty Name, Department, Email, Designation, Qualification, Subject Code</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Excel (.xlsx, .xls) and CSV supported. Teacher codes in CSV are strictly preserved and synchronized.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadTeacherSampleExcel}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#2E6FB0] text-[#2E6FB0] hover:bg-blue-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download XLSX Template
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#2E6FB0] bg-blue-50/50 scale-[0.99]'
                  : 'border-[#DCE3ED] bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#2E6FB0] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-800">
                {uploadedFileName ? (
                  <span className="text-[#2E6FB0]">Selected: {uploadedFileName}</span>
                ) : (
                  'Click to browse or drag & drop faculty spreadsheet (.xlsx, .xls, .csv)'
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Auto-detects columns and previews records before importing
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-[#DCE3ED]"></div>
              <span className="shrink-0 mx-3 text-[11px] font-semibold text-slate-400">OR PASTE CSV / TEXT</span>
              <div className="grow border-t border-[#DCE3ED]"></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paste Faculty Records</label>
              <textarea
                rows={4}
                placeholder="T001, Dr. Rajesh Varma, CSE, rajesh.varma@campus.edu, Professor, Ph.D, 21CS41&#10;ECE01, Prof. Sunita Rao, ECE, sunita.rao@campus.edu, Associate Professor, M.Tech, 21EC42"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidateTextImport}
                disabled={isProcessingBulk}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Layers className="w-4 h-4 text-[#5B93D1]" />
                {isProcessingBulk ? 'Processing...' : 'Validate & Preview'}
              </button>
            </div>
          </div>
        )}

        {bulkStep === 'validation' && (
          <div className="space-y-4">
            {/* Validation Metrics Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Processed</span>
                <span className="text-lg font-bold text-slate-800">{validationResults.length} rows</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-700 block">Valid & Ready</span>
                <span className="text-lg font-bold text-emerald-800">{validCount} rows</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-700 block">Warnings / Invalid</span>
                <span className="text-lg font-bold text-amber-800">{invalidCount} rows</span>
              </div>
            </div>

            {/* Validation Table with Inline Editing */}
            <div className="max-h-72 overflow-y-auto border border-[#DCE3ED] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResults.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        editingRowIndex === idx
                          ? 'bg-blue-50/50'
                          : row.isValid
                          ? 'hover:bg-slate-50/60'
                          : 'bg-rose-50/40 hover:bg-rose-50/60'
                      }`}
                    >
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {row.isExisting ? 'Update' : 'New'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600" title={row.errors?.join(', ')}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">
                        {editingRowIndex === idx ? (
                          <input
                            type="text"
                            value={editedRowData.teacherCode ?? row.teacherCode}
                            onChange={(e) => setEditedRowData({ ...editedRowData, teacherCode: e.target.value })}
                            className="w-20 px-2 py-0.5 text-xs font-mono uppercase font-bold border rounded"
                          />
                        ) : (
                          row.teacherCode
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {editingRowIndex === idx ? (
                          <input
                            type="text"
                            value={editedRowData.name ?? row.name}
                            onChange={(e) => setEditedRowData({ ...editedRowData, name: e.target.value })}
                            className="w-36 px-2 py-0.5 text-xs border rounded font-semibold"
                          />
                        ) : (
                          <div className="font-semibold text-slate-800">{row.name}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {editingRowIndex === idx ? (
                          <select
                            value={editedRowData.department ?? row.department}
                            onChange={(e) => setEditedRowData({ ...editedRowData, department: e.target.value })}
                            className="px-1.5 py-0.5 text-xs border rounded bg-white"
                          >
                            {departments.map((d) => (
                              <option key={d.code} value={d.code}>
                                {d.code}
                              </option>
                            ))}
                          </select>
                        ) : (
                          row.department
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {editingRowIndex === idx ? (
                          <input
                            type="email"
                            value={editedRowData.email ?? row.email}
                            onChange={(e) => setEditedRowData({ ...editedRowData, email: e.target.value })}
                            className="w-40 px-2 py-0.5 text-xs border rounded"
                          />
                        ) : (
                          row.email
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {editingRowIndex === idx ? (
                          <input
                            type="text"
                            value={editedRowData.designation ?? row.designation}
                            onChange={(e) => setEditedRowData({ ...editedRowData, designation: e.target.value })}
                            className="w-32 px-2 py-0.5 text-xs border rounded"
                          />
                        ) : (
                          row.designation
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingRowIndex === idx ? (
                          <button
                            onClick={() => handleSaveInlineEdit(idx)}
                            className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingRowIndex(idx);
                              setEditedRowData({ ...row });
                            }}
                            className="text-slate-500 hover:text-[#2E6FB0] p-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setBulkStep('upload')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleCommitBulkImport}
                disabled={isProcessingBulk || validCount === 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Check className="w-4 h-4" />
                {isProcessingBulk ? 'Importing Roster...' : `Commit Import (${validCount} Faculty)`}
              </button>
            </div>
          </div>
        )}

        {bulkStep === 'complete' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Faculty Roster Successfully Imported</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Faculty member profiles and teacher codes have been updated in the campus system and faculty dashboard.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkStep('upload');
                  setValidationResults([]);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90"
              >
                Done & Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
