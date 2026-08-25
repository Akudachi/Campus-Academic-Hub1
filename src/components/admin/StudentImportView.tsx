import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Mail,
  GraduationCap,
  Layers,
  Settings,
  Grid,
  List,
  Filter,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Student, User, StudentImportRowResult, Department } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { parseStudentFile, parseStudentText, downloadStudentSampleExcel } from '../../lib/excelParser';

interface StudentImportViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentImportView: React.FC<StudentImportViewProps> = ({ onBack }) => {
  const [students, setStudents] = useState<(Student & { user: User })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  const [copiedUsn, setCopiedUsn] = useState<string | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSingleAddModalOpen, setIsSingleAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<(Student & { user: User }) | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<(Student & { user: User }) | null>(null);

  const { showToast } = useAuth();

  // Cohort target for bulk upload
  const [targetDept, setTargetDept] = useState('');
  const [targetSem, setTargetSem] = useState(4);
  const [targetSec, setTargetSec] = useState('A');

  // File upload drag state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Single Student Form State
  const [singleStudent, setSingleStudent] = useState({
    usn: '',
    name: '',
    department: '',
    semester: 4,
    section: 'A',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Student Form State
  const [editFormData, setEditFormData] = useState({
    usn: '',
    name: '',
    department: '',
    semester: 4,
    section: 'A',
    email: '',
  });

  // Import Workflow State
  const [importStep, setImportStep] = useState<'upload' | 'validation' | 'complete'>('upload');
  const [, setBatchId] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [validationResults, setValidationResults] = useState<StudentImportRowResult[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<Partial<StudentImportRowResult>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [stuRes, deptRes] = await Promise.all([
        api.getStudents(),
        api.getDepartments().catch(() => ({ departments: [] })),
      ]);
      setStudents(stuRes.students);
      setDepartments(deptRes.departments || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudent.usn.trim() || !singleStudent.name.trim()) {
      showToast('Please provide both USN and Student Name.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createStudent({
        usn: singleStudent.usn.trim().toUpperCase(),
        name: singleStudent.name.trim(),
        department: singleStudent.department,
        semester: Number(singleStudent.semester),
        section: singleStudent.section,
        email: singleStudent.email.trim() || `${singleStudent.usn.trim().toLowerCase()}@student.campus.edu`,
      });
      showToast(`Student ${singleStudent.name} (${singleStudent.usn.toUpperCase()}) added!`, 'success');
      setIsSingleAddModalOpen(false);
      setSingleStudent({
        usn: '',
        name: '',
        department: 'CSE',
        semester: 4,
        section: 'A',
        email: '',
      });
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (stu: Student & { user: User }) => {
    setStudentToEdit(stu);
    setEditFormData({
      usn: stu.usn,
      name: stu.user?.name || (stu as any).name || '',
      department: stu.department,
      semester: stu.currentSemester,
      section: stu.section,
      email: stu.user?.email || '',
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToEdit) return;
    setIsSubmitting(true);
    try {
      await api.updateStudent(studentToEdit.id, {
        usn: editFormData.usn.trim().toUpperCase(),
        name: editFormData.name.trim(),
        department: editFormData.department,
        semester: Number(editFormData.semester),
        section: editFormData.section,
        email: editFormData.email.trim(),
      });
      showToast('Student record updated successfully!', 'success');
      setStudentToEdit(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to update student', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudent(studentToDelete.id);
      showToast(`Student ${studentToDelete.usn} deleted successfully.`, 'info');
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete student', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUsn = (usn: string) => {
    navigator.clipboard.writeText(usn);
    setCopiedUsn(usn);
    showToast(`Copied USN ${usn}`, 'info');
    setTimeout(() => setCopiedUsn(null), 2000);
  };

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
    setIsProcessing(true);
    try {
      const options = {
        defaultDept: targetDept,
        defaultSemester: targetSem,
        defaultSection: targetSec,
      };

      let parsedRows: any[] = [];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        parsedRows = await parseStudentFile(file, options);
      } else {
        const text = await file.text();
        setRawText(text);
        parsedRows = parseStudentText(text, options);
      }

      if (parsedRows.length === 0) {
        showToast('No valid student rows found in file.', 'warning');
        setIsProcessing(false);
        return;
      }

      const res = await api.validateStudentImport({
        rows: parsedRows,
        fileName: file.name,
        department: targetDept,
        semester: targetSem,
        section: targetSec,
      });

      setBatchId(res.batchId);
      setValidationResults(res.results);
      setValidCount(res.validRows);
      setInvalidCount(res.invalidRows);
      setImportStep('validation');
      showToast(`Extracted ${res.totalRows} students from ${file.name}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to read file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    setIsProcessing(true);
    try {
      const res = await api.commitStudentImport({ rows: validationResults });
      showToast(
        `Import complete: ${res.insertedCount} new students enrolled, ${res.updatedCount} updated.`,
        'success'
      );
      setImportStep('complete');
      fetchStudents();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveInlineEdit = (index: number) => {
    const updated = [...validationResults];
    const currentRow = updated[index];
    const newUsn = (editedRowData.usn || currentRow.usn).toUpperCase().trim();
    const newName = (editedRowData.name || currentRow.name).trim();
    const newDept = (editedRowData.department || currentRow.department).toUpperCase().trim();
    const newSem = Number(editedRowData.semester || currentRow.semester);
    const newSec = (editedRowData.section || currentRow.section).toUpperCase().trim();

    const errors: string[] = [];
    if (!newUsn || newUsn.length < 4) errors.push('USN must be at least 4 alphanumeric characters.');
    if (!newName || newName.length < 2) errors.push('Name must be at least 2 characters.');

    updated[index] = {
      ...currentRow,
      usn: newUsn,
      name: newName,
      department: newDept,
      semester: newSem,
      section: newSec,
      isValid: errors.length === 0,
      errors,
    };

    setValidationResults(updated);
    setValidCount(updated.filter((r) => r.isValid).length);
    setInvalidCount(updated.filter((r) => !r.isValid).length);
    setEditingRowIndex(null);
    setEditedRowData({});
  };

  const filteredStudents = students.filter((s) => {
    const matchesDept = deptFilter === 'ALL' || s.department.toUpperCase() === deptFilter.toUpperCase();
    const matchesSem = semFilter === 'ALL' || String(s.currentSemester) === semFilter;
    const matchesSearch =
      (s.user?.name || (s as any).name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSem && matchesSearch;
  });

  return (
    <div className="space-y-3.5 animate-fade-in pb-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#13284A]">Student Directory</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2E6FB0] text-xs font-mono font-bold">
                {students.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Manage enrolled student rosters, USNs, and cohorts.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSingleAddModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#DCE3ED] text-[#13284A] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#2E6FB0]" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => {
              setImportStep('upload');
              setUploadedFileName('');
              setIsImportModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, USN, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
            <button
              onClick={() => setViewLayout('cards')}
              title="Card View"
              className={`p-1.5 rounded-md transition-colors ${
                viewLayout === 'cards' ? 'bg-white text-[#13284A] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('table')}
              title="Table View"
              className={`p-1.5 rounded-md transition-colors ${
                viewLayout === 'table' ? 'bg-white text-[#13284A] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 shrink-0 text-[11px]">Branch:</span>
          <button
            onClick={() => setDeptFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors shrink-0 ${
              deptFilter === 'ALL' ? 'bg-[#13284A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {departments.map((dept) => (
            <button
              key={dept.code}
              onClick={() => setDeptFilter(dept.code)}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors shrink-0 ${
                deptFilter === dept.code
                  ? 'bg-[#13284A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.code}
            </button>
          ))}
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-400 shrink-0 text-[11px]">Sem:</span>
          <button
            onClick={() => setSemFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors shrink-0 ${
              semFilter === 'ALL' ? 'bg-[#2E6FB0] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All (1–8)
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              onClick={() => setSemFilter(semFilter === String(s) ? 'ALL' : String(s))}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors shrink-0 ${
                semFilter === String(s) ? 'bg-[#2E6FB0] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Display */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED]">
          Loading student roster...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED] space-y-2">
          <p className="font-semibold text-slate-700">No students found matching filters.</p>
          <button
            onClick={() => {
              setDeptFilter('ALL');
              setSemFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs text-[#2E6FB0] hover:underline font-bold"
          >
            Clear Filters
          </button>
        </div>
      ) : viewLayout === 'cards' ? (
        /* Native App Card Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((s) => {
            const displayName = s.user?.name || s.name || 'Unknown Student';
            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-[#DCE3ED] p-3.5 flex flex-col justify-between shadow-2xs hover:border-[#2E6FB0]/40 transition-all group"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Avatar, Name, USN */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#13284A]/5 text-[#13284A] font-bold text-xs flex items-center justify-center border border-[#13284A]/10 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-[#13284A] truncate">{displayName}</h3>
                        <p className="text-[11px] text-slate-500 truncate">{s.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      onClick={() => handleCopyUsn(s.usn)}
                      title="Click to copy USN"
                      className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200/60"
                    >
                      <span>{s.usn}</span>
                      {copiedUsn === s.usn ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-[#13284A] text-white">
                        {s.department}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2E6FB0]">
                        Sem {s.currentSemester}-{s.section}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active Student
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      title="Edit Student"
                      className="p-1 rounded-md text-slate-400 hover:text-[#2E6FB0] hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setStudentToDelete(s)}
                      title="Delete Student"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">USN</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#13284A]">
                      <button
                        onClick={() => handleCopyUsn(s.usn)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1"
                      >
                        {s.usn}
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.user?.name || (s as any).name || 'Student'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{s.department}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2E6FB0] font-bold text-[11px]">
                        Sem {s.currentSemester} ({s.section})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{s.user?.email}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1 rounded text-slate-400 hover:text-[#2E6FB0] hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SINGLE STUDENT ADD MODAL */}
      <Modal
        isOpen={isSingleAddModalOpen}
        onClose={() => setIsSingleAddModalOpen(false)}
        title="Add Single Student"
        maxWidth="md"
      >
        <form onSubmit={handleAddSingleStudent} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={singleStudent.name}
                onChange={(e) => setSingleStudent({ ...singleStudent, name: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">USN (University Seat No.)</label>
              <input
                type="text"
                placeholder="e.g. 2KL22EC045"
                value={singleStudent.usn}
                onChange={(e) => setSingleStudent({ ...singleStudent, usn: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={singleStudent.department}
                onChange={(e) => setSingleStudent({ ...singleStudent, department: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={singleStudent.semester}
                onChange={(e) => setSingleStudent({ ...singleStudent, semester: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                placeholder="A"
                value={singleStudent.section}
                onChange={(e) => setSingleStudent({ ...singleStudent, section: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="Auto-generated if left blank"
                value={singleStudent.email}
                onChange={(e) => setSingleStudent({ ...singleStudent, email: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSingleAddModalOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#13284A] hover:bg-[#2E6FB0] rounded-lg shadow-2xs"
            >
              {isSubmitting ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={!!studentToEdit}
        onClose={() => setStudentToEdit(null)}
        title="Edit Student Record"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">USN</label>
              <input
                type="text"
                value={editFormData.usn}
                onChange={(e) => setEditFormData({ ...editFormData, usn: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={editFormData.semester}
                onChange={(e) => setEditFormData({ ...editFormData, semester: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                value={editFormData.section}
                onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStudentToEdit(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#13284A] hover:bg-[#2E6FB0] rounded-lg shadow-2xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">
                Delete student {studentToDelete?.user?.name || studentToDelete?.name} ({studentToDelete?.usn})?
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This will remove the student from active enrollment records.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStudentToDelete(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteStudent}
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* IMPORT EXCEL MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportStep('upload');
          setValidationResults([]);
          setUploadedFileName('');
        }}
        title="Student Bulk Import (XLSX / CSV)"
        maxWidth="4xl"
      >
        {importStep === 'upload' && (
          <div className="space-y-3.5 text-xs">
            {/* Target Cohort Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-[#13284A] mb-2">
                <Settings className="w-3.5 h-3.5 text-[#2E6FB0]" />
                <span>Target Cohort Assignment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Semester</label>
                  <select
                    value={targetSem}
                    onChange={(e) => setTargetSem(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] bg-white text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Section</label>
                  <input
                    type="text"
                    value={targetSec}
                    onChange={(e) => setTargetSec(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#DCE3ED] text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#2E6FB0] bg-blue-50/50'
                  : 'border-slate-300 hover:border-[#2E6FB0] bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#2E6FB0] mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-xs">
                {uploadedFileName ? uploadedFileName : 'Click to browse or drag & drop Excel / CSV file'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Columns: Sl.No, USN, Student Name</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={downloadStudentSampleExcel}
                className="text-xs text-[#2E6FB0] hover:underline font-bold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample Excel Template
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {importStep === 'validation' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-bold text-[#13284A]">
                Validated: {validCount} valid rows, {invalidCount} with issues
              </span>
              <button
                onClick={handleCommitImport}
                disabled={validCount === 0 || isProcessing}
                className="px-4 py-1.5 rounded-lg bg-[#13284A] text-white font-bold hover:bg-[#2E6FB0] transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Enrolling...' : `Enroll (${validCount}) Students`}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">USN</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResults.map((r, i) => (
                    <tr key={i} className={r.isValid ? 'bg-white' : 'bg-rose-50/50'}>
                      <td className="p-2 font-mono">{r.rowNumber}</td>
                      <td className="p-2 font-mono font-bold">{r.usn}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">
                        {r.isValid ? (
                          <span className="text-emerald-700 font-bold">Valid</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{r.errors.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setImportStep('upload')}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {importStep === 'complete' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Enrollment Complete!</h3>
            <p className="text-xs text-slate-500">Students have been enrolled into the system.</p>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#13284A] text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
