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
  RefreshCw,
  Edit2,
  Save,
  Check,
  UserCheck,
  FileText,
  X,
  Layers,
  Settings,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Student, User, StudentImportRowResult, Department } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { parseStudentFile, parseStudentText, downloadStudentSampleExcel } from '../../lib/excelParser';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Eng' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Comm Eng' },
  { id: 'dept-ise', code: 'ISE', name: 'Information Science' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Eng' },
  { id: 'dept-civil', code: 'CIVIL', name: 'Civil Eng' },
];

export const StudentImportView: React.FC = () => {
  const [students, setStudents] = useState<(Student & { user: User })[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSingleAddModalOpen, setIsSingleAddModalOpen] = useState(false);
  const { showToast } = useAuth();

  // Cohort target for bulk upload
  const [targetDept, setTargetDept] = useState('CSE');
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
    department: 'CSE',
    semester: 4,
    section: 'A',
    email: '',
  });
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // Import Workflow State
  const [importStep, setImportStep] = useState<'upload' | 'validation' | 'complete'>('upload');
  const [batchId, setBatchId] = useState<string>('');
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
        api.getDepartments().catch(() => ({ departments: DEFAULT_DEPARTMENTS })),
      ]);
      setStudents(stuRes.students);
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
    fetchStudents();
  }, []);

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudent.usn.trim() || !singleStudent.name.trim()) {
      showToast('Please provide both USN and Student Name.', 'warning');
      return;
    }
    setIsSubmittingSingle(true);
    try {
      await api.createStudent({
        usn: singleStudent.usn.trim().toUpperCase(),
        name: singleStudent.name.trim(),
        department: singleStudent.department,
        semester: Number(singleStudent.semester),
        section: singleStudent.section,
        email: singleStudent.email.trim() || `${singleStudent.usn.trim().toLowerCase()}@student.campus.edu`,
      });
      showToast(`Student ${singleStudent.name} (${singleStudent.usn.toUpperCase()}) added successfully!`, 'success');
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
      setIsSubmittingSingle(false);
    }
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
        showToast('No valid student rows found (Columns: 1. Sl.No, 2. USN, 3. Name).', 'warning');
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
      showToast(`Extracted ${res.totalRows} students (1: Sl.No, 2: USN, 3: Name) from ${file.name}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to read file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateImport = async () => {
    if (!rawText.trim()) {
      showToast('Please upload an Excel file or paste student spreadsheet rows.', 'warning');
      return;
    }
    setIsProcessing(true);
    try {
      const options = {
        defaultDept: targetDept,
        defaultSemester: targetSem,
        defaultSection: targetSec,
      };
      const parsedRows = parseStudentText(rawText, options);
      const res = await api.validateStudentImport({
        rows: parsedRows.length > 0 ? parsedRows : undefined,
        rawText: parsedRows.length === 0 ? rawText : undefined,
        department: targetDept,
        semester: targetSem,
        section: targetSec,
      });
      setBatchId(res.batchId);
      setValidationResults(res.results);
      setValidCount(res.validRows);
      setInvalidCount(res.invalidRows);
      setImportStep('validation');
      showToast(`Validated ${res.totalRows} student rows: ${res.validRows} valid, ${res.invalidRows} issues.`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    setIsProcessing(true);
    try {
      const res = await api.commitStudentImport({ rows: validationResults });
      showToast(
        `Enrollment complete: ${res.insertedCount} new students enrolled, ${res.updatedCount} records updated.`,
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
    if (!['CSE', 'ECE', 'ISE', 'MECH', 'CIVIL'].includes(newDept)) errors.push('Invalid department code.');
    if (isNaN(newSem) || newSem < 1 || newSem > 8) errors.push('Semester must be between 1 and 8.');

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

  const downloadErrorReport = () => {
    const invalidRows = validationResults.filter((r) => !r.isValid);
    if (invalidRows.length === 0) {
      showToast('No invalid rows to download.', 'info');
      return;
    }
    const header = 'Row,USN,Name,Department,Semester,Section,Errors\n';
    const rows = invalidRows
      .map(
        (r) =>
          `${r.rowNumber},"${r.usn}","${r.name}","${r.department}",${r.semester},"${r.section}","${r.errors.join('; ')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_import_error_report_${Date.now()}.csv`;
    a.click();
  };

  const filteredStudents = students.filter((s) => {
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesSem = semFilter === 'ALL' || String(s.currentSemester) === semFilter;
    const matchesSearch =
      (s.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSem && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">Student Master & Bulk Enrollment</h2>
          <p className="text-xs text-[#667085] mt-1">
            Admin-controlled student roster. Upload 3-column XLSX/CSV files (1: Sl.No, 2: USN, 3: Name) with live validation.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <button
            id="open-single-student-modal-btn"
            onClick={() => setIsSingleAddModalOpen(true)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#2E6FB0]" />
            <span>Add Student</span>
          </button>
          <button
            id="open-student-import-modal-btn"
            onClick={() => {
              setImportStep('upload');
              setUploadedFileName('');
              setIsImportModalOpen(true);
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
          title="Total Enrolled Students"
          value={students.length}
          subtitle="Unique USN-verified student records"
          icon={Users}
          accentColor="navy"
        />
        <MetricCard
          title="Active Semester 4"
          value={students.filter((s) => s.currentSemester === 4).length}
          subtitle="CSE & ECE Cohorts"
          icon={FileSpreadsheet}
          accentColor="blue"
        />
        <MetricCard
          title="Departments Represented"
          value={Array.from(new Set(students.map((s) => s.department))).length}
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
            id="search-students-input"
            type="text"
            placeholder="Search by student name, USN, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-[#667085]">Dept:</span>
            {['ALL', ...departments.map((d) => d.code)].map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  deptFilter === d
                    ? 'bg-[#13284A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#667085]">Sem:</span>
            {['ALL', '4', '6'].map((s) => (
              <button
                key={s}
                onClick={() => setSemFilter(s)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  semFilter === s
                    ? 'bg-[#2E6FB0] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'ALL' ? 'ALL' : `Sem ${s}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#667085]">Loading enrolled student records...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#667085]">No students found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester & Section</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-4">Access Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || s.usn || `stu-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#13284A]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {s.usn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.user?.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{s.department}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        Sem {s.currentSemester} - Sec {s.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{s.user?.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        100% Read-Only
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportStep('upload');
          setValidationResults([]);
          setUploadedFileName('');
        }}
        title="Student Bulk Import (3-Column Format)"
        subtitle="1st Col: Sl.No | 2nd Col: USN | 3rd Col: Name. Any extra columns or non-student rows are automatically ignored."
        maxWidth="4xl"
      >
        {importStep === 'upload' && (
          <div className="space-y-4">
            {/* Target Cohort Assignment Bar */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#13284A] mb-2.5">
                <Settings className="w-3.5 h-3.5 text-[#2E6FB0]" />
                <span>Target Cohort Assignment (For 3-Column List)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Department</label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} ({d.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Semester</label>
                  <select
                    value={targetSem}
                    onChange={(e) => setTargetSem(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
                  <select
                    value={targetSec}
                    onChange={(e) => setTargetSec(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Download Template Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-[#13284A]">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#2E6FB0] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">3 Columns: Column 1 = Sl.No, Column 2 = USN, Column 3 = Name</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Excel (.xlsx, .xls) and CSV supported. Other columns/rows are safely ignored.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadStudentSampleExcel}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#2E6FB0] text-[#2E6FB0] hover:bg-blue-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download 3-Col Template (.xlsx)
              </button>
            </div>

            {/* Drag and Drop Zone */}
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
                  'Click to browse or drag & drop student file (1: Sl.No, 2: USN, 3: Name)'
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Reads 3 columns and automatically filters out extraneous rows
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-xs text-slate-400 font-semibold uppercase">Or Paste 3 Columns</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste 3-Column Text (Sl.No, USN, Name)
              </label>
              <textarea
                rows={5}
                placeholder={`Sl.No, USN, Name\n1, 2KL23CS011, Ananya Rao\n2, 2KL23CS012, Vignesh Iyer\n3, 2KL23CS013, Rohit Sharma`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setRawText(
                    `Sl.No, USN, Name\n1, 2KL23CS011, Ananya Rao\n2, 2KL23CS012, Vignesh Iyer\n3, 2KL23CS013, Rohit Sharma\n4, 2KL23CS014, Pooja Hegde\n5, 2KL23CS015, Divya Kulkarni`
                  )
                }
                className="text-xs text-[#2E6FB0] hover:underline font-semibold"
              >
                Fill 3-Column Sample Data
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleValidateImport}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#5B93D1]" />
                  {isProcessing ? 'Validating...' : 'Validate 3-Column Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {importStep === 'validation' && (
          <div className="space-y-4">
            {/* Validation Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-slate-500">Students Extracted</span>
                <p className="text-xl font-bold text-slate-800">{validationResults.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-emerald-700">Valid Rows</span>
                <p className="text-xl font-bold text-emerald-800">{validCount}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-rose-700">Need Correction</span>
                <p className="text-xl font-bold text-rose-800">{invalidCount}</p>
              </div>
            </div>

            {invalidCount > 0 && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Some rows contain validation errors. You can fix them inline below or download a report.</span>
                </div>
                <button
                  onClick={downloadErrorReport}
                  className="text-xs font-bold text-[#2E6FB0] hover:underline flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Error CSV
                </button>
              </div>
            )}

            {/* Validation Row Inspector */}
            <div className="border border-[#DCE3ED] rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Sl.No</th>
                    <th className="py-2 px-3">USN</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Dept & Sem</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResults.map((row, idx) => {
                    const isEditing = editingRowIndex === idx;
                    return (
                      <tr key={`val-row-${row.usn || row.rowNumber || idx}`} className={row.isValid ? 'bg-white' : 'bg-rose-50/40'}>
                        <td className="py-2 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedRowData.usn !== undefined ? editedRowData.usn : row.usn}
                              onChange={(e) => setEditedRowData({ ...editedRowData, usn: e.target.value })}
                              className="px-1.5 py-0.5 border rounded text-xs w-28 uppercase"
                            />
                          ) : (
                            row.usn
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedRowData.name !== undefined ? editedRowData.name : row.name}
                              onChange={(e) => setEditedRowData({ ...editedRowData, name: e.target.value })}
                              className="px-1.5 py-0.5 border rounded text-xs w-36"
                            />
                          ) : (
                            row.name
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          {row.department} - Sem {row.semester} ({row.section})
                        </td>
                        <td className="py-2 px-3">
                          {row.isExisting ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200">
                              Update Existing
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              New Student
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <StatusPill status="good" label="Valid" size="sm" />
                          ) : (
                            <div className="space-y-0.5">
                              <StatusPill status="critical" label="Error" size="sm" />
                              <p className="text-[10px] text-rose-700 font-medium">{row.errors[0]}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveInlineEdit(idx)}
                              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                              title="Save inline fix"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRowIndex(idx);
                                setEditedRowData(row);
                              }}
                              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
                              title="Edit row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImportStep('upload')}
                className="px-3 py-1.5 text-xs text-slate-600 hover:underline"
              >
                ← Back to Upload
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={validCount === 0 || isProcessing}
                  onClick={handleCommitImport}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E8E5A] text-white hover:bg-[#1E8E5A]/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  {isProcessing ? 'Enrolling...' : `Commit & Enroll ${validCount} Valid Students`}
                </button>
              </div>
            </div>
          </div>
        )}

        {importStep === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#13284A]">Student Roster Updated!</h4>
              <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
                All student records have been committed to the database. Students can now access their personalized student portal.
              </p>
            </div>
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportStep('upload');
              }}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Single Student Enrollment Modal */}
      <Modal
        isOpen={isSingleAddModalOpen}
        onClose={() => setIsSingleAddModalOpen(false)}
        title="Enroll Individual Student"
        subtitle="Create an individual student record with verified USN and cohort assignment."
        maxWidth="md"
      >
        <form onSubmit={handleAddSingleStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Divya Kulkarni"
              value={singleStudent.name}
              onChange={(e) => {
                const name = e.target.value;
                setSingleStudent({ ...singleStudent, name });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">USN / Roll Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 2KL23CS015"
                value={singleStudent.usn}
                onChange={(e) => {
                  const usn = e.target.value.toUpperCase();
                  setSingleStudent({
                    ...singleStudent,
                    usn,
                    email: singleStudent.email || (usn ? `${usn.toLowerCase()}@student.campus.edu` : ''),
                  });
                }}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={singleStudent.department}
                onChange={(e) => setSingleStudent({ ...singleStudent, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white font-medium"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} ({d.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester</label>
              <select
                value={singleStudent.semester}
                onChange={(e) => setSingleStudent({ ...singleStudent, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <select
                value={singleStudent.section}
                onChange={(e) => setSingleStudent({ ...singleStudent, section: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white font-medium"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Student Email</label>
            <input
              type="email"
              placeholder="e.g. 2kl23cs015@student.campus.edu"
              value={singleStudent.email}
              onChange={(e) => setSingleStudent({ ...singleStudent, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
            <p className="text-[10px] text-[#667085] mt-1">
              Auto-generated as USN@student.campus.edu if left blank.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSingleAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingSingle}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-[#5B93D1]" />
              {isSubmittingSingle ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
