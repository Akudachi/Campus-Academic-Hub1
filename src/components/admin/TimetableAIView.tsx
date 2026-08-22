import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Building2,
  GraduationCap,
  Info,
  RefreshCw,
  Search,
  UserCheck,
  Check,
  Edit2,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Teacher, User, Department, Semester, ExtractedTimetableRow, Subject } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';

export interface SubjectAllocationRow {
  id: string;
  slNo: number;
  teacherCode: string;
  teacherName: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentCode: string;
  semesterNumber: number;
  status?: 'valid' | 'warning' | 'invalid';
  errorMessage?: string;
}

interface TimetableAIViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const TimetableAIView: React.FC<TimetableAIViewProps> = ({ onBack }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ECE');
  const [selectedSem, setSelectedSem] = useState<number>(7);
  const [availableTeachers, setAvailableTeachers] = useState<(Teacher & { user?: User })[]>([]);
  const [existingSubjects, setExistingSubjects] = useState<Subject[]>([]);

  // CSV Upload & Staging
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRawText, setCsvRawText] = useState('');
  const [stagedRows, setStagedRows] = useState<SubjectAllocationRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active saved allocations in local storage & loaded from server
  const [savedAllocations, setSavedAllocations] = useState<SubjectAllocationRow[]>(() => {
    const saved = localStorage.getItem('kle_subject_allocations_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Default initial seeded allocations
    return [
      {
        id: 'alloc-1',
        slNo: 1,
        teacherCode: 'T001',
        teacherName: 'Dr. Sanjay Pujari',
        subjectCode: 'BEC701',
        subjectName: 'Microwave Engineering and Antenna Theory',
        credits: 4,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-2',
        slNo: 2,
        teacherCode: 'T002',
        teacherName: 'Mr. Mallikarjun Biradar',
        subjectCode: 'BEC702',
        subjectName: 'Computer Networks and Protocols',
        credits: 4,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-3',
        slNo: 3,
        teacherCode: 'T003',
        teacherName: 'Ms. Laxmi R Motagi',
        subjectCode: 'BEC703',
        subjectName: 'Wireless Communication Systems',
        credits: 4,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-4',
        slNo: 4,
        teacherCode: 'T004',
        teacherName: 'Mr. Prashant A H.',
        subjectCode: 'BEC714D',
        subjectName: 'Radar Communication',
        credits: 3,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-5',
        slNo: 5,
        teacherCode: 'T005',
        teacherName: 'Mr. Amit Ghantimath',
        subjectCode: 'BME755D',
        subjectName: 'Non-conventional energy resources',
        credits: 3,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-6',
        slNo: 6,
        teacherCode: 'T006',
        teacherName: 'Mr. Avadhut Ambole',
        subjectCode: 'BECL701',
        subjectName: 'Microwave Engineering Lab(IPCC)',
        credits: 2,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-7',
        slNo: 7,
        teacherCode: 'T002',
        teacherName: 'Mr. Mallikarjun Biradar',
        subjectCode: 'BECL702',
        subjectName: 'Computer Networks and Protocols Lab',
        credits: 2,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
      {
        id: 'alloc-8',
        slNo: 8,
        teacherCode: 'T002',
        teacherName: 'Mr. Mallikarjun Biradar',
        subjectCode: 'BEC786',
        subjectName: 'Major Project Phase-II',
        credits: 6,
        departmentCode: 'ECE',
        semesterNumber: 7,
      },
    ];
  });

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    teacherCode: '',
    teacherName: '',
    subjectCode: '',
    subjectName: '',
    credits: 4,
  });

  const { showToast } = useAuth();

  useEffect(() => {
    localStorage.setItem('kle_subject_allocations_v2', JSON.stringify(savedAllocations));
  }, [savedAllocations]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [deptRes, semRes, teachRes, subRes] = await Promise.all([
        api.getDepartments(),
        api.getSemesters(),
        api.getTeachers(),
        api.getSubjects().catch(() => ({ subjects: [] })),
      ]);

      const depts = deptRes.departments || [];
      const sems = semRes.semesters || [];
      setDepartments(depts);
      setSemesters(sems);
      setAvailableTeachers(teachRes.teachers || []);
      setExistingSubjects(subRes.subjects || []);

      if (depts.length > 0) {
        setSelectedDept((prev) => {
          const exists = depts.some((d) => d.code.toUpperCase() === prev.toUpperCase());
          return exists ? prev : depts[0].code;
        });
      }
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
  };

  // --- CSV TEMPLATE GENERATOR ---

  const handleDownloadCsvTemplate = () => {
    const csvContent = `Sl No,Teacher Code,Teacher Name,Subject Code,Subject Title,Credit,Department,Semester
1,T001,Dr. Sanjay Pujari,BEC701,Microwave Engineering and Antenna Theory,4,${selectedDept},${selectedSem}
2,T002,Mr. Mallikarjun Biradar,BEC702,Computer Networks and Protocols,4,${selectedDept},${selectedSem}
3,T003,Ms. Laxmi R Motagi,BEC703,Wireless Communication Systems,4,${selectedDept},${selectedSem}
4,T004,Mr. Prashant A H.,BEC714D,Radar Communication,3,${selectedDept},${selectedSem}
5,T005,Mr. Amit Ghantimath,BME755D,Non-conventional energy resources,3,${selectedDept},${selectedSem}
6,T006,Mr. Avadhut Ambole,BECL701,Microwave Engineering Lab(IPCC),2,${selectedDept},${selectedSem}
7,T002,Mr. Mallikarjun Biradar,BECL702,Computer Networks and Protocols Lab,2,${selectedDept},${selectedSem}
8,T002,Mr. Mallikarjun Biradar,BEC786,Major Project Phase-II,6,${selectedDept},${selectedSem}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Subject_Teacher_Allocation_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Subject & Teacher CSV Template (with Subject Code)!', 'success');
  };

  // --- CSV PARSING & PROCESSING ---

  const parseCsvText = (text: string): string[][] => {
    const lines: string[][] = [];
    const rows = text.split(/\r\n|\n|\r/);

    for (let r = 0; r < rows.length; r++) {
      const rowStr = rows[r].trim();
      if (!rowStr) continue;

      const cells: string[] = [];
      let inQuote = false;
      let currCell = '';

      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if ((char === ',' || char === '\t') && !inQuote) {
          cells.push(currCell.trim());
          currCell = '';
        } else {
          currCell += char;
        }
      }
      cells.push(currCell.trim());
      lines.push(cells);
    }
    return lines;
  };

  const processCsvFile = (content: string, filename: string) => {
    setCsvRawText(content);
    setCsvFileName(filename);

    const matrix = parseCsvText(content);
    if (matrix.length === 0) {
      showToast('Uploaded CSV file is empty.', 'warning');
      return;
    }

    // Inspect header row
    const rawHeader = matrix[0];
    const cleanHeader = rawHeader.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

    let slNoIdx = -1;
    let teacherCodeIdx = -1;
    let teacherNameIdx = -1;
    let subjectCodeIdx = -1;
    let subjectIdx = -1;
    let creditIdx = -1;
    let deptIdx = -1;
    let semIdx = -1;

    cleanHeader.forEach((h, idx) => {
      // Teacher Code exact check
      if (['teachercode', 'staffcode', 'facultycode', 'tcode', 'facultyshortcode', 'staffinitial', 'teacherid', 'facultyid'].includes(h)) {
        teacherCodeIdx = idx;
      }
      // Subject Code exact check
      else if (['subjectcode', 'coursecode', 'subcode', 'scode', 'papercode', 'courseid'].includes(h)) {
        subjectCodeIdx = idx;
      }
      // Subject Title / Name check
      else if (['subjecttitle', 'subjectname', 'coursetitle', 'coursename', 'subject', 'course', 'paper', 'title'].includes(h)) {
        subjectIdx = idx;
      }
      // Teacher Name check
      else if (['teachername', 'staffname', 'facultyname', 'facultymember', 'teacher', 'faculty', 'professor', 'lecturer'].includes(h)) {
        teacherNameIdx = idx;
      }
      // Sl No
      else if (['slno', 'sno', 'serialno', 'serialnumber', 'srno', 'sl', 'no', 'serial'].includes(h)) {
        slNoIdx = idx;
      }
      // Credit
      else if (['credit', 'credits', 'cr', 'hrs', 'hours'].includes(h)) {
        creditIdx = idx;
      }
      // Department
      else if (['department', 'dept', 'branch'].includes(h)) {
        deptIdx = idx;
      }
      // Semester
      else if (['semester', 'sem'].includes(h)) {
        semIdx = idx;
      }
      // Fallback for "name" if teacher name not set
      else if (h === 'name' && teacherNameIdx === -1) {
        teacherNameIdx = idx;
      }
    });

    const isHeaderRow =
      slNoIdx !== -1 ||
      teacherCodeIdx !== -1 ||
      teacherNameIdx !== -1 ||
      subjectCodeIdx !== -1 ||
      subjectIdx !== -1 ||
      cleanHeader.some((h) =>
        ['slno', 'teacher', 'faculty', 'subject', 'course', 'credit', 'code', 'title'].some((k) =>
          h.includes(k)
        )
      );

    const startIndex = isHeaderRow ? 1 : 0;
    const staged: SubjectAllocationRow[] = [];

    for (let i = startIndex; i < matrix.length; i++) {
      const row = matrix[i];
      if (row.length < 2) continue;

      let slNo = slNoIdx !== -1 && row[slNoIdx] ? parseInt(row[slNoIdx], 10) : staged.length + 1;
      if (isNaN(slNo)) slNo = staged.length + 1;

      let tCode = teacherCodeIdx !== -1 ? row[teacherCodeIdx] : '';
      let tName = teacherNameIdx !== -1 ? row[teacherNameIdx] : '';
      let subCode = subjectCodeIdx !== -1 ? row[subjectCodeIdx] : '';
      let subName = subjectIdx !== -1 ? row[subjectIdx] : '';
      let creditVal = creditIdx !== -1 ? parseInt(row[creditIdx], 10) : 4;
      let deptVal = deptIdx !== -1 && row[deptIdx] ? row[deptIdx] : selectedDept;
      let semVal = semIdx !== -1 && row[semIdx] ? parseInt(row[semIdx], 10) : selectedSem;

      // Standard positional mapping if headers were generic or positional:
      // Case 1: 6+ Columns -> [Sl No, Teacher Code, Teacher Name, Subject Code, Subject Title, Credit, ...]
      if (row.length >= 6) {
        if (!tCode && row[1]) tCode = row[1];
        if (!tName && row[2]) tName = row[2];
        if (!subCode && row[3]) subCode = row[3];
        if (!subName && row[4]) subName = row[4];
        if (isNaN(creditVal) && row[5]) creditVal = parseInt(row[5], 10) || 4;
      }
      // Case 2: 5 Columns -> [Sl No, Teacher Code, Teacher Name, Subject Title, Credit]
      else if (row.length === 5) {
        if (!tCode && row[1]) tCode = row[1];
        if (!tName && row[2]) tName = row[2];
        if (!subName && row[3]) subName = row[3];
        if (isNaN(creditVal) && row[4]) creditVal = parseInt(row[4], 10) || 4;
      }

      // Smart heuristic safety check: If tCode looks like a full name and tName looks like a code, swap them
      if (
        tCode &&
        tName &&
        (tCode.toLowerCase().startsWith('dr.') ||
          tCode.toLowerCase().startsWith('prof.') ||
          tCode.toLowerCase().startsWith('mr.') ||
          tCode.toLowerCase().startsWith('ms.') ||
          tCode.includes(' ')) &&
        tName.length <= 8 &&
        !tName.includes(' ')
      ) {
        const temp = tCode;
        tCode = tName;
        tName = temp;
      }

      // Smart heuristic safety check: If subCode is long title and subName is standard code (e.g. BEC701)
      if (
        subCode &&
        subName &&
        subCode.length > 12 &&
        subName.length <= 8 &&
        /^[A-Z0-9]+$/i.test(subName)
      ) {
        const temp = subCode;
        subCode = subName;
        subName = temp;
      }

      // If subjectCode is not distinct, check if subject title starts with code
      if (!subCode && subName) {
        const match = subName.match(/^([A-Z0-9]{5,8})\s*[-:]?\s*(.*)$/i);
        if (match) {
          subCode = match[1].toUpperCase();
          subName = match[2] || match[1];
        } else {
          subCode = `B${deptVal.slice(0, 2).toUpperCase()}${semVal}0${staged.length + 1}`;
        }
      }

      // If teacherCode is empty, generate from initials
      if (!tCode && tName) {
        const initials = tName
          .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 3);
        tCode = initials ? `T-${initials}` : `T${(staged.length + 1).toString().padStart(3, '0')}`;
      }

      let status: 'valid' | 'warning' | 'invalid' = 'valid';
      let errorMessage = '';

      if (!subName.trim()) {
        status = 'invalid';
        errorMessage = 'Subject title is missing';
      } else if (!tName.trim()) {
        status = 'warning';
        errorMessage = 'Teacher Name is blank';
        tName = 'Faculty Member';
      }

      staged.push({
        id: `stage-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        slNo: slNo || staged.length + 1,
        teacherCode: tCode.trim().toUpperCase(),
        teacherName: tName.trim(),
        subjectCode: (subCode || `BEC${semVal}0${staged.length + 1}`).trim().toUpperCase(),
        subjectName: subName.trim(),
        credits: isNaN(creditVal) || creditVal <= 0 ? 4 : creditVal,
        departmentCode: deptVal.trim().toUpperCase(),
        semesterNumber: isNaN(semVal) ? selectedSem : semVal,
        status,
        errorMessage,
      });
    }

    setStagedRows(staged);
    showToast(`Parsed ${staged.length} records from ${filename}`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvFile(content, file.name);
    };
    reader.readAsText(file);
  };

  // Commit Staged CSV Rows to Master Registry & Server
  const handleCommitStagedRows = async () => {
    if (stagedRows.length === 0) {
      showToast('No staged records to commit.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Format extracted rows for server sync
      const extractedForApi: ExtractedTimetableRow[] = stagedRows.map((r, idx) => ({
        id: `sub-row-${Date.now()}-${idx}`,
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        teacherNameRaw: `${r.teacherName} (${r.teacherCode})`,
        matchedTeacherId: null,
        departmentCode: r.departmentCode || selectedDept,
        semester: r.semesterNumber || selectedSem,
        credits: r.credits || 4,
        confidence: 1.0,
        confirmed: true,
      }));

      // Call server to persist subjects and auto-link teacher records
      const uploadRes = await api.uploadTimetable({
        fileName: csvFileName || 'Subject_Import.csv',
        rawText: csvRawText,
        semester: selectedSem,
        departmentCode: selectedDept,
      });

      if (uploadRes?.uploadId) {
        await api.confirmTimetable(uploadRes.uploadId, extractedForApi);
      }

      // Update local master allocations
      setSavedAllocations((prev) => {
        // Remove prior items for current selected branch/semester to avoid duplicates
        const filtered = prev.filter(
          (item) =>
            !(
              item.departmentCode.toUpperCase() === selectedDept.toUpperCase() &&
              item.semesterNumber === selectedSem
            )
        );
        return [...filtered, ...stagedRows];
      });

      showToast(
        `Successfully imported and saved ${stagedRows.length} subject & teacher allocations for ${selectedDept} Sem ${selectedSem}!`,
        'success'
      );

      setStagedRows([]);
      setCsvFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast(err.message || 'Failed to commit allocations to server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STAGED ROW EDITING ---

  const handleUpdateStagedField = (id: string, field: keyof SubjectAllocationRow, value: any) => {
    setStagedRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleDeleteStagedRow = (id: string) => {
    setStagedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddStagedRow = () => {
    const newSl = stagedRows.length + 1;
    const newRow: SubjectAllocationRow = {
      id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      slNo: newSl,
      teacherCode: `T00${newSl}`,
      teacherName: 'Faculty Member',
      subjectCode: `B${selectedDept.slice(0, 2).toUpperCase()}${selectedSem}0${newSl}`,
      subjectName: 'New Subject Course',
      credits: 4,
      departmentCode: selectedDept,
      semesterNumber: selectedSem,
      status: 'valid',
    };
    setStagedRows((prev) => [...prev, newRow]);
  };

  // --- MASTER ALLOCATION EDITING & EXPORT ---

  const handleExportAllocationsCsv = () => {
    const records = activeSemesterAllocations;
    if (records.length === 0) {
      showToast(`No allocations found for ${selectedDept} Semester ${selectedSem}.`, 'warning');
      return;
    }

    const headers = ['Sl No', 'Teacher Code', 'Teacher Name', 'Subject Code', 'Subject Name', 'Credits', 'Department', 'Semester'];
    const csvLines = [headers.join(',')];

    records.forEach((r, idx) => {
      const escape = (val: string | number) => `"${String(val || '').replace(/"/g, '""')}"`;
      csvLines.push(
        [
          idx + 1,
          escape(r.teacherCode),
          escape(r.teacherName),
          escape(r.subjectCode),
          escape(r.subjectName),
          escape(r.credits),
          escape(r.departmentCode),
          escape(r.semesterNumber),
        ].join(',')
      );
    });

    const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Subject_Allocations_${selectedDept}_Sem${selectedSem}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${records.length} allocations to CSV!`, 'success');
  };

  const handleDeleteSavedRow = (id: string) => {
    setSavedAllocations((prev) => prev.filter((r) => r.id !== id));
    showToast('Removed allocation record', 'info');
  };

  const handleClearSemesterAllocations = () => {
    if (!window.confirm(`Are you sure you want to clear all subject allocations for ${selectedDept} Semester ${selectedSem}?`)) {
      return;
    }
    setSavedAllocations((prev) =>
      prev.filter(
        (r) =>
          !(
            r.departmentCode.toUpperCase() === selectedDept.toUpperCase() &&
            r.semesterNumber === selectedSem
          )
      )
    );
    showToast(`Cleared allocations for ${selectedDept} Semester ${selectedSem}`, 'info');
  };

  const handleAddManualAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.subjectName || !manualForm.teacherName) {
      showToast('Please enter subject title and teacher name', 'warning');
      return;
    }

    const newSl = activeSemesterAllocations.length + 1;
    const subCode =
      manualForm.subjectCode.trim() ||
      `B${selectedDept.slice(0, 2).toUpperCase()}${selectedSem}0${newSl}`;

    const tCode =
      manualForm.teacherCode.trim() ||
      `T${newSl.toString().padStart(3, '0')}`;

    const newAlloc: SubjectAllocationRow = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      slNo: newSl,
      teacherCode: tCode.toUpperCase(),
      teacherName: manualForm.teacherName.trim(),
      subjectCode: subCode.toUpperCase(),
      subjectName: manualForm.subjectName.trim(),
      credits: Number(manualForm.credits) || 4,
      departmentCode: selectedDept,
      semesterNumber: selectedSem,
    };

    setSavedAllocations((prev) => [...prev, newAlloc]);
    setShowAddModal(false);
    setManualForm({
      teacherCode: '',
      teacherName: '',
      subjectCode: '',
      subjectName: '',
      credits: 4,
    });
    showToast(`Added ${newAlloc.subjectName} (${newAlloc.teacherName})`, 'success');
  };

  // Filter saved records for active department & semester
  const activeSemesterAllocations = savedAllocations.filter(
    (item) =>
      (item.departmentCode ? item.departmentCode.toUpperCase() === selectedDept.toUpperCase() : true) &&
      (item.semesterNumber ? item.semesterNumber === selectedSem : true)
  );

  const filteredAllocations = activeSemesterAllocations.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.teacherName.toLowerCase().includes(q) ||
      item.teacherCode.toLowerCase().includes(q) ||
      item.subjectName.toLowerCase().includes(q) ||
      item.subjectCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden animate-fade-in pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-3">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-[#13284A]">Subject & Faculty Allocation CSV Manager</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2E6FB0] text-xs font-mono font-bold border border-blue-200">
                {selectedDept} - Semester {selectedSem}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Import course and teacher assignments directly from CSV (Sl No, Teacher Code, Teacher Name, Subject Code, Subject Title, Credit).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download CSV Template */}
          <button
            onClick={handleDownloadCsvTemplate}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors shadow-2xs"
            title="Download CSV format template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>

          {/* Export Current Allocations */}
          <button
            onClick={handleExportAllocationsCsv}
            disabled={activeSemesterAllocations.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors"
            title="Export to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E6FB0]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Branch & Semester Selection Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
          {/* Branch Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <span className="font-bold text-slate-400 text-[11px] shrink-0">Branch:</span>
            {departments.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">No branches</span>
            ) : (
              departments.map((dept) => (
                <button
                  key={dept.id || dept.code}
                  onClick={() => setSelectedDept(dept.code)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 ${
                    selectedDept.toUpperCase() === dept.code.toUpperCase()
                      ? 'bg-[#13284A] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept.code}
                </button>
              ))
            )}
          </div>

          {/* Semester Pills */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 text-[11px] shrink-0">Semester:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSem(s)}
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedSem === s
                    ? 'bg-[#2E6FB0] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sem {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CSV UPLOAD DROPZONE / IMPORT CARD */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
                Upload CSV File
              </h2>
              <p className="text-[11px] text-slate-500">
                Columns supported: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[10px]">Sl No, Teacher Code, Teacher Name, Subject Code, Subject Title, Credit</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCsvTemplate}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get Template (.csv)</span>
          </button>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-[#2E6FB0] hover:bg-blue-50/40 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt,.tsv"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-[#2E6FB0] flex items-center justify-center transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 group-hover:text-[#13284A]">
              Click to browse or drop your CSV file here
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports standard UTF-8 .csv files with header or comma-separated rows
            </p>
          </div>
        </div>

        {/* STAGED CSV PREVIEW TABLE */}
        {stagedRows.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {stagedRows.length} Staged Rows Ready for Review
                </span>
                {csvFileName && (
                  <span className="text-xs text-slate-500 font-mono">({csvFileName})</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddStagedRow}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
                <button
                  onClick={() => {
                    setStagedRows([]);
                    setCsvFileName('');
                  }}
                  className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommitStagedRows}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Allocations to Registry</span>
                </button>
              </div>
            </div>

            {/* Editable Review Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#13284A] text-white text-[11px] font-bold">
                    <th className="p-2.5 w-16 text-center">Sl No</th>
                    <th className="p-2.5 w-28">Teacher Code</th>
                    <th className="p-2.5 w-44">Teacher Name</th>
                    <th className="p-2.5 w-28">Subject Code</th>
                    <th className="p-2.5">Subject Title</th>
                    <th className="p-2.5 w-20 text-center">Credit</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {stagedRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {/* Sl No */}
                      <td className="p-2 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Teacher Code */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.teacherCode}
                          onChange={(e) => handleUpdateStagedField(row.id, 'teacherCode', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs font-bold text-[#13284A] focus:border-[#2E6FB0] focus:outline-none uppercase"
                          placeholder="T001"
                        />
                      </td>

                      {/* Teacher Name */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.teacherName}
                          onChange={(e) => handleUpdateStagedField(row.id, 'teacherName', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-[#2E6FB0] focus:outline-none"
                          placeholder="Faculty Name"
                        />
                      </td>

                      {/* Subject Code */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.subjectCode}
                          onChange={(e) => handleUpdateStagedField(row.id, 'subjectCode', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs font-bold text-[#13284A] focus:border-[#2E6FB0] focus:outline-none uppercase"
                          placeholder="BEC701"
                        />
                      </td>

                      {/* Subject Title */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.subjectName}
                          onChange={(e) => handleUpdateStagedField(row.id, 'subjectName', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:border-[#2E6FB0] focus:outline-none"
                          placeholder="Subject Title"
                        />
                      </td>

                      {/* Credits */}
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={row.credits}
                          onChange={(e) => handleUpdateStagedField(row.id, 'credits', parseInt(e.target.value, 10) || 4)}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-center text-[#13284A] focus:border-[#2E6FB0] focus:outline-none"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteStagedRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MASTER SUBJECT & FACULTY ALLOCATIONS TABLE */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2E6FB0]" />
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
                Active Course Allocations — {selectedDept} Semester {selectedSem}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                {activeSemesterAllocations.length} Subjects
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configured subjects, assigned faculty codes, and academic credits for this semester.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-[#2E6FB0] focus:outline-none w-48 sm:w-56"
              />
            </div>

            {activeSemesterAllocations.length > 0 && (
              <button
                onClick={handleClearSemesterAllocations}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
              >
                Clear All
              </button>
            )}

            <button
              onClick={() => {
                setManualForm({
                  teacherCode: `T00${activeSemesterAllocations.length + 1}`,
                  teacherName: '',
                  subjectCode: `B${selectedDept.slice(0, 2).toUpperCase()}${selectedSem}0${activeSemesterAllocations.length + 1}`,
                  subjectName: '',
                  credits: 4,
                });
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#13284A] hover:bg-[#2E6FB0] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Master Allocations Table */}
        {filteredAllocations.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2.5">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-700">No subject allocations found for {selectedDept} Semester {selectedSem}.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload your CSV file above or add subjects manually using the button.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-[#2E6FB0] text-white font-bold text-xs hover:bg-[#13284A] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV File</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#13284A] text-[11px] font-bold">
                  <th className="p-2.5 w-16 text-center font-mono">Sl No</th>
                  <th className="p-2.5 w-28 font-mono">Teacher Code</th>
                  <th className="p-2.5 w-52">Teacher Name</th>
                  <th className="p-2.5 w-28 font-mono">Subject Code</th>
                  <th className="p-2.5">Subject Title</th>
                  <th className="p-2.5 w-20 text-center font-mono">Credit</th>
                  <th className="p-2.5 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAllocations.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* Serial No */}
                    <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Teacher Code */}
                    <td className="p-2.5 font-mono font-bold text-[#13284A]">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2E6FB0] border border-blue-100 text-[10px]">
                        {row.teacherCode || 'T001'}
                      </span>
                    </td>

                    {/* Teacher Name */}
                    <td className="p-2.5 font-semibold text-slate-800 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {row.teacherName.charAt(0)}
                      </div>
                      <span className="truncate max-w-[180px]">{row.teacherName}</span>
                    </td>

                    {/* Subject Code */}
                    <td className="p-2.5 font-mono font-bold text-[#13284A]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                        {row.subjectCode}
                      </span>
                    </td>

                    {/* Subject Title */}
                    <td className="p-2.5 font-bold text-[#13284A]">
                      {row.subjectName}
                    </td>

                    {/* Credits */}
                    <td className="p-2.5 text-center font-mono font-bold text-[#2E6FB0]">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                        {row.credits}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteSavedRow(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete course allocation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL ADD SUBJECT ALLOCATION MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Subject Allocation — ${selectedDept} Sem ${selectedSem}`}
      >
        <form onSubmit={handleAddManualAllocation} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teacher Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={manualForm.teacherCode}
                onChange={(e) => setManualForm({ ...manualForm, teacherCode: e.target.value })}
                placeholder="e.g. T001 / SAP"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-[#2E6FB0] focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teacher Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={manualForm.teacherName}
                onChange={(e) => setManualForm({ ...manualForm, teacherName: e.target.value })}
                placeholder="e.g. Dr. Sanjay Pujari"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-[#2E6FB0] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                value={manualForm.subjectCode}
                onChange={(e) => setManualForm({ ...manualForm, subjectCode: e.target.value })}
                placeholder={`BEC${selectedSem}01`}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-[#2E6FB0] focus:outline-none uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Subject Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={manualForm.subjectName}
                onChange={(e) => setManualForm({ ...manualForm, subjectName: e.target.value })}
                placeholder="e.g. Microwave Engineering"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:border-[#2E6FB0] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Credits
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={manualForm.credits}
              onChange={(e) => setManualForm({ ...manualForm, credits: parseInt(e.target.value, 10) || 4 })}
              className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:border-[#2E6FB0] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#13284A] hover:bg-[#2E6FB0] text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Subject</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
