import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  FileText,
  AlertCircle,
  BookOpen,
  UserCheck,
  Check,
  RotateCcw,
  Cpu,
  Layers,
  Image as ImageIcon,
  Camera,
  X,
  Plus,
  Trash2,
  Eye,
  ArrowRight,
  School,
  GraduationCap,
  Users,
  Maximize2,
  RefreshCw,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ExtractedTimetableRow, Teacher, User } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';

// Helper to generate realistic visual timetable images as Base64 for instant demo testing
function generateSampleTimetableImage(preset: 'kle_ece7' | 'cse4' | 'ece6' | 'aiml5'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (preset === 'kle_ece7') {
    // Top KLE College Header Banner
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, 140);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 15, canvas.width - 40, 110);

    // Header Titles
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("K.L.E. Society's", canvas.width / 2, 45);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('KLE College of Engg. & Technology, Chikodi', canvas.width / 2, 75);
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('DEPT. OF ELECTRONICS & COMMUNICATION ENGG.', canvas.width / 2, 102);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Doc #: FMTC0301  |  Rev: 1.0', 35, 42);
    ctx.fillText('Academic Year: 2026-27 [Odd Sem]', 35, 145);
    ctx.fillText('W.E.F: 20.07.2026', 35, 165);

    ctx.textAlign = 'right';
    ctx.fillText('Semester: VII (7th Sem)', canvas.width - 35, 145);
    ctx.fillText('Lecture Hall: ECLH22', canvas.width - 35, 165);

    // TIME TABLE (R0) Banner
    ctx.textAlign = 'center';
    ctx.fillStyle = '#13284A';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TIME TABLE (R0) & COURSE ALLOCATION MATRIX', canvas.width / 2, 158);

    // Draw Master Course / Staff allocation table
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(20, 185, canvas.width - 40, 620);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 185, canvas.width - 40, 620);

    // Table Header Bar
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(20, 185, canvas.width - 40, 45);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('COURSE TITLE', 40, 213);
    ctx.fillText('ABBR', 440, 213);
    ctx.fillText('COURSE CODE', 540, 213);
    ctx.fillText('DESIGNATED FACULTY / PROFESSOR', 710, 213);
    ctx.fillText('INITIAL', 1080, 213);

    const rows = [
      { name: 'Microwave Engineering and Antenna Theory', abbr: 'M&A', code: 'BEC701', staff: 'Dr. Sanjay Pujari', init: 'SAP' },
      { name: 'Computer Networks and Protocols', abbr: 'CNP', code: 'BEC702', staff: 'Mr. Mallikarjun Biradar', init: 'MRB' },
      { name: 'Wireless Communication Systems', abbr: 'WCS', code: 'BEC703', staff: 'Ms. Laxmi R Motagi', init: 'LRM' },
      { name: 'Radar Communication', abbr: 'RC', code: 'BEC714D', staff: 'Mr. Prashant A H.', init: 'PAH' },
      { name: 'Non-conventional energy recourses', abbr: 'NCER', code: 'BME755D', staff: 'Mr. Amit Ghantimath', init: 'ASG' },
      { name: 'Microwave Engineering & Antenna Theory Lab(IPCC)', abbr: 'M&A LAB', code: 'BECL701', staff: 'Mr. Avadhut Ambole', init: 'AVA' },
      { name: 'Computer Networks and Protocols Lab(IPCC)', abbr: 'CNPL LAB', code: 'BECL702', staff: 'Mr. Mallikarjun Biradar', init: 'MRB' },
      { name: 'Major Project Phase-II', abbr: 'MPP-II', code: 'BEC786', staff: 'Mr. Mallikarjun Biradar', init: 'MRB' },
    ];

    let y = 265;
    rows.forEach((r, idx) => {
      if (idx % 2 === 0) {
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(20, y - 24, canvas.width - 40, 52);
      }

      ctx.fillStyle = '#0F172A';
      ctx.font = '500 14px sans-serif';
      ctx.fillText(r.name, 40, y + 8);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(r.abbr, 440, y + 8);

      ctx.fillStyle = '#1E3A8A';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(r.code, 540, y + 8);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(r.staff, 710, y + 8);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(r.init, 1080, y + 8);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, y + 28);
      ctx.lineTo(canvas.width - 20, y + 28);
      ctx.stroke();

      y += 54;
    });

    // Class Coordinator & Footnote
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Class Coordinator: Mr. Amit Ghantimath', 40, y + 25);
    ctx.fillText('Lab Batches: B1 (1-21), B2 (22-43), B3 (44-62)', 540, y + 25);

    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('HOD ECE • Academic Coordinator • Principal KLE College Chikodi', 40, 820);

    return canvas.toDataURL('image/png');
  }

  // Fallback visual boards
  ctx.fillStyle = '#13284A';
  ctx.fillRect(0, 0, canvas.width, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('APEX INSTITUTE OF TECHNOLOGY & SCIENCE', 40, 48);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px sans-serif';
  let subtitle = 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING • SEMESTER IV TIMETABLE';
  if (preset === 'ece6') subtitle = 'DEPARTMENT OF ELECTRONICS & COMMUNICATION • SEMESTER VI TIMETABLE';
  if (preset === 'aiml5') subtitle = 'DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING • SEMESTER V ALLOCATION';
  ctx.fillText(subtitle, 40, 82);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(40, 140, 1120, 620);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 140, 1120, 620);

  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(40, 140, 1120, 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('SL', 60, 172);
  ctx.fillText('COURSE CODE', 110, 172);
  ctx.fillText('COURSE / SUBJECT TITLE', 300, 172);
  ctx.fillText('CR', 670, 172);
  ctx.fillText('DEPT', 720, 172);
  ctx.fillText('DESIGNATED PROFESSOR / INSTRUCTOR', 810, 172);

  const rows = preset === 'ece6' ? [
    { code: '21EC601', name: 'Digital Signal Processing (DSP)', cr: '4', dept: 'ECE', teacher: 'Dr. Vikram Rao' },
    { code: '21EC602', name: 'VLSI Design & Embedded Architecture', cr: '4', dept: 'ECE', teacher: 'Prof. Deepa Nair' },
    { code: '21EC603', name: 'Wireless & Cellular Communication', cr: '4', dept: 'ECE', teacher: 'Dr. Vikram Rao' },
    { code: '21EC604', name: 'Antenna Theory & Wave Propagation', cr: '3', dept: 'ECE', teacher: 'Dr. Meera Nambiar' },
    { code: '21EC605', name: 'Embedded Systems & IoT Laboratory', cr: '2', dept: 'ECE', teacher: 'Prof. Deepa Nair' },
    { code: '21EC606', name: 'Microcontroller Interfacing', cr: '3', dept: 'ECE', teacher: 'Prof. Sneha Deshmukh' },
  ] : preset === 'aiml5' ? [
    { code: '22AI501', name: 'Deep Learning & Neural Architectures', cr: '4', dept: 'AI-ML', teacher: 'Dr. Ramesh Kumar' },
    { code: '22AI502', name: 'Natural Language Processing (NLP)', cr: '4', dept: 'AI-ML', teacher: 'Prof. Anjali Sharma' },
    { code: '22AI503', name: 'Computer Vision & Image Processing', cr: '4', dept: 'AI-ML', teacher: 'Dr. Priya Sundaram' },
    { code: '22AI504', name: 'Reinforcement Learning & Game Theory', cr: '3', dept: 'AI-ML', teacher: 'Dr. Alok Verma' },
    { code: '22AI505', name: 'Big Data Engineering & Spark Lab', cr: '3', dept: 'AI-ML', teacher: 'Prof. Vikram Seth' },
    { code: '22AI506', name: 'Cloud Computing & MLOps Infrastructure', cr: '3', dept: 'AI-ML', teacher: 'Dr. Deepak Joshi' },
  ] : [
    { code: '23CS401', name: 'Design and Analysis of Algorithms (DAA)', cr: '4', dept: 'CSE', teacher: 'Dr. Ramesh Kumar' },
    { code: '23CS402', name: 'Database Management Systems (DBMS)', cr: '4', dept: 'CSE', teacher: 'Prof. Anjali Sharma' },
    { code: '23CS403', name: 'Operating Systems Architecture (OS)', cr: '4', dept: 'CSE', teacher: 'Dr. Priya Sundaram' },
    { code: '23CS404', name: 'Software Engineering & Agile Methodology', cr: '3', dept: 'CSE', teacher: 'Prof. Vikram Seth' },
    { code: '23CS405', name: 'Microcontrollers & Embedded Systems', cr: '4', dept: 'CSE', teacher: 'Dr. Deepak Joshi' },
    { code: '23CS406', name: 'Computer Networks & Internet Protocols', cr: '4', dept: 'CSE', teacher: 'Dr. Ramesh Kumar' },
  ];

  let y = 230;
  rows.forEach((r, idx) => {
    if (idx % 2 === 0) {
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(40, y - 30, 1120, 60);
    }
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${idx + 1}.`, 60, y + 5);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(r.code, 110, y + 5);

    ctx.fillStyle = '#0F172A';
    ctx.font = '500 15px sans-serif';
    ctx.fillText(r.name, 300, y + 5);

    ctx.fillStyle = '#475569';
    ctx.fillText(r.cr, 675, y + 5);

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(r.dept, 720, y + 5);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(r.teacher, 810, y + 5);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y + 30);
    ctx.lineTo(1160, y + 30);
    ctx.stroke();

    y += 60;
  });

  return canvas.toDataURL('image/png');
}

interface TimetableAIViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const TimetableAIView: React.FC<TimetableAIViewProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/png');
  const [targetSemester, setTargetSemester] = useState<number>(7);
  const [targetDept, setTargetDept] = useState<string>('ECE');

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [extractedRows, setExtractedRows] = useState<ExtractedTimetableRow[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<(Teacher & { user?: User })[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationStats, setConfirmationStats] = useState<{
    createdAssignments: number;
    createdSubjectsCount: number;
    createdProfessorsCount: number;
    totalSubjects: number;
  } | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useAuth();

  // Load available teachers on mount
  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await api.getTeachers();
      setAvailableTeachers(res.teachers || []);
    } catch (e) {
      console.error('Failed to load teachers:', e);
    }
  };

  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv');

    if (!isImage && !isPdf && !isText) {
      showToast('Please upload a valid document (PDF, PNG, JPG, WEBP, or TXT).', 'warning');
      return;
    }

    setFileName(file.name);

    if (isText) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
        setActiveTab('text');
        showToast(`Loaded schedule text file: ${file.name}`, 'info');
      };
      reader.readAsText(file);
      return;
    }

    // Handle PDF or Image file
    const mime = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');
    setImageMimeType(mime);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageData(result);
      setActiveTab('photo');
      showToast(`Loaded ${isPdf ? 'PDF Schedule Document' : 'Timetable Photo'}: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePresetPhoto = (preset: 'kle_ece7' | 'cse4' | 'ece6' | 'aiml5') => {
    const dataUrl = generateSampleTimetableImage(preset);
    setImageData(dataUrl);
    setImageMimeType('image/png');

    if (preset === 'kle_ece7') {
      setFileName('KLE_CET_Chikodi_ECE_Sem7_Timetable.png');
      setTargetSemester(7);
      setTargetDept('ECE');
      showToast('Loaded KLE College of Engg. & Tech ECE Sem 7 Timetable Board!', 'info');
    } else if (preset === 'cse4') {
      setFileName('AIT_CSE_Sem4_Timetable_Board.png');
      setTargetSemester(4);
      setTargetDept('CSE');
      showToast('Loaded CSE Sem 4 Timetable!', 'info');
    } else if (preset === 'ece6') {
      setFileName('AIT_ECE_Sem6_Faculty_Allocation.png');
      setTargetSemester(6);
      setTargetDept('ECE');
      showToast('Loaded ECE Sem 6 Schedule!', 'info');
    } else {
      setFileName('AIT_AIML_Sem5_Course_Matrix.png');
      setTargetSemester(5);
      setTargetDept('AI-ML');
      showToast('Loaded AI-ML Sem 5 Matrix!', 'info');
    }
  };

  const loadKLETextTimetable = () => {
    setFileName('KLE_College_ECE_Sem7_Schedule_FMTC0301.txt');
    setTargetSemester(7);
    setTargetDept('ECE');
    setRawText(`K.L.E. Society's
KLE College of Engg. & Technology, Chikodi
DEPT. OF ELECTRONICS & COMMUNICATION ENGG.
FORM ISO21001: 2018-KLECET
Document #: FMTC0301 | Rev: 1.0
Academic Year: 2026-27 [Odd Sem] | W.E.F: 20.07.2026
Semester: VII | Lecture Hall No: ECLH22

====================================================================================================================
COURSE TITLE                                            | ABBR.     | COURSE CODE | STAFF NAME             | INITIAL
====================================================================================================================
Microwave Engineering and Antenna Theory                | M&A       | BEC701      | Dr. Sanjay Pujari      | SAP
Computer Networks and Protocols                         | CNP       | BEC702      | Mr. Mallikarjun Biradar| MRB
Wireless Communication Systems                          | WCS       | BEC703      | Ms. Laxmi R Motagi     | LRM
Radar Communication                                     | RC        | BEC714D     | Mr. Prashant A H.      | PAH
Non-conventional energy recourses                       | NCER      | BME755D     | Mr. Amit Ghantimath    | ASG
Microwave Engineering and Antenna Theory Lab(IPCC)      | M&A LAB   | BECL701     | Mr. Avadhut Ambole     | AVA
Computer Networks and Protocols Lab(IPCC)               | CNPL LAB  | BECL702     | Mr. Mallikarjun Biradar| MRB
Major Project Phase-II                                  | MPP-II    | BEC786      | Mr. Mallikarjun Biradar| MRB
====================================================================================================================
Class Coordinator: Mr. Amit Ghantimath
Lab Batches: B1 (1-21), B2 (22-43), B3 (44-62)
Verified by: Head of Dept. of E.C.E. | Academic Coordinator | Principal`);
    showToast('Loaded KLE College ECE Sem 7 schedule text!', 'info');
  };

  const handleStartExtraction = async () => {
    if (activeTab === 'photo' && !imageData) {
      showToast('Please upload a timetable photo / PDF or select a preset schedule.', 'warning');
      return;
    }
    if (activeTab === 'text' && !rawText.trim()) {
      showToast('Please provide timetable text or load a sample document.', 'warning');
      return;
    }

    setIsProcessing(true);
    setIsConfirmed(false);
    setConfirmationStats(null);

    try {
      const payload = {
        fileName: fileName || (activeTab === 'photo' ? 'Timetable_Document.png' : 'Timetable.txt'),
        rawText: activeTab === 'text' ? rawText : '',
        imageData: activeTab === 'photo' && imageData ? imageData : undefined,
        imageMimeType: activeTab === 'photo' ? imageMimeType : undefined,
        semester: targetSemester,
        departmentCode: targetDept,
      };

      const res = await api.uploadTimetable(payload);
      setUploadId(res.uploadId);
      setExtractedRows(res.extractedRows);
      if (res.availableTeachers && res.availableTeachers.length > 0) {
        setAvailableTeachers(res.availableTeachers);
      }
      showToast(
        `AI successfully scanned timetable and extracted ${res.totalRows} subjects & professors!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Timetable extraction failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTeacherChange = (index: number, teacherId: string) => {
    const updated = [...extractedRows];
    if (teacherId === '__new__') {
      updated[index] = {
        ...updated[index],
        matchedTeacherId: null,
        isNewProfessor: true,
        confidence: 0.95,
      };
    } else {
      const selectedTeacher = availableTeachers.find((t) => t.id === teacherId);
      updated[index] = {
        ...updated[index],
        matchedTeacherId: teacherId,
        matchedTeacherName: selectedTeacher?.user?.name || selectedTeacher?.teacherCode || 'Faculty',
        isNewProfessor: false,
        confidence: 0.98,
      };
    }
    setExtractedRows(updated);
  };

  const handleRowFieldChange = (
    index: number,
    field: keyof ExtractedTimetableRow,
    value: any
  ) => {
    const updated = [...extractedRows];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setExtractedRows(updated);
  };

  const handleAddRow = () => {
    const newRow: ExtractedTimetableRow = {
      id: `ext-row-custom-${Date.now()}`,
      semester: targetSemester,
      subjectCode: `${targetDept}${targetSemester}0${extractedRows.length + 1}`,
      subjectName: 'New Subject Course',
      teacherNameRaw: 'Assigned Professor',
      matchedTeacherId: availableTeachers[0]?.id || null,
      matchedTeacherName: availableTeachers[0]?.user?.name,
      confidence: 1.0,
      confirmed: false,
      departmentCode: targetDept,
      credits: 4,
    };
    setExtractedRows([...extractedRows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = extractedRows.filter((_, i) => i !== index);
    setExtractedRows(updated);
  };

  const handleConfirmAssignments = async () => {
    if (!uploadId && extractedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const targetId = uploadId || `tt-${Date.now()}`;
      const res = await api.confirmTimetable(targetId, extractedRows);
      setIsConfirmed(true);
      setConfirmationStats({
        createdAssignments: res.createdAssignments,
        createdSubjectsCount: res.createdSubjectsCount,
        createdProfessorsCount: res.createdProfessorsCount,
        totalSubjects: res.totalSubjects,
      });
      showToast(
        `Success! Provisioned ${res.createdSubjectsCount} subjects, registered ${res.createdProfessorsCount} faculty, and committed ${res.createdAssignments} active assignments!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <StatusPill status="good" label={`${Math.round(confidence * 100)}% High`} size="sm" />;
    } else if (confidence >= 0.7) {
      return <StatusPill status="warning" label={`${Math.round(confidence * 100)}% Med`} size="sm" />;
    }
    return <StatusPill status="critical" label={`${Math.round(confidence * 100)}% Review`} size="sm" />;
  };

  const isPdfFile = imageMimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-5">
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Overview" />
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#E0982A]" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#13284A] font-serif flex items-center gap-2">
                <span>AI Timetable Photo & PDF Schedule Extractor</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#2E6FB0] border border-blue-200">
                  Multimodal Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-xs text-[#667085] mt-1 max-w-2xl">
                Upload or snap a photo of your departmental timetable matrix (e.g. KLE College Chikodi, VTU, autonomous institutions). Gemini Vision automatically extracts{' '}
                <strong className="text-slate-800 font-semibold">Subject Titles, Course Codes (e.g. BEC701, BECL701), Semesters, and Professors</strong>, 
                provisioning subjects and faculty allocations directly to your active database.
              </p>
            </div>
          </div>
        </div>

        {/* Target Department & Semester Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Dept
            </label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] text-slate-800"
            >
              <option value="ECE">ECE (Electronics & Comm)</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ISE">ISE (Information Science)</option>
              <option value="MECH">MECH (Mechanical)</option>
              <option value="CIVIL">CIVIL (Civil)</option>
              <option value="AI-ML">AI-ML (Artificial Intelligence)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={targetSemester}
              onChange={(e) => setTargetSemester(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] text-slate-800"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s} {s === 7 ? '(VII)' : s === 6 ? '(VI)' : s === 5 ? '(V)' : s === 4 ? '(IV)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Input Mode Navigation Tabs */}
      <div className="flex border-b border-[#DCE3ED] bg-white rounded-t-xl px-4 pt-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('photo')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'photo'
              ? 'border-[#2E6FB0] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-[#2E6FB0]" />
          <span>Upload Timetable Photo / PDF Document</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
            Recommended
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'text'
              ? 'border-[#2E6FB0] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Paste Text / Raw Schedule Matrix</span>
        </button>
      </div>

      {/* Upload Box Container */}
      <div className="bg-white p-6 rounded-b-xl border border-t-0 border-[#DCE3ED] shadow-xs space-y-5">
        {activeTab === 'photo' ? (
          <div className="space-y-4">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {!imageData ? (
              /* Drag & Drop Area */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-[#2E6FB0] bg-blue-50/60 scale-[1.005]'
                    : 'border-[#CBD5E1] hover:border-[#2E6FB0] hover:bg-slate-50/70'
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-[#2E6FB0] border border-blue-200 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-[#13284A]">
                  Click to Upload or Drag & Drop Timetable PDF / Image Photo
                </h3>
                <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
                  Supports PDF files, PNG, JPG, JPEG, or WEBP photos of department timetable matrices, notice boards, or syllabus allocations.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-[#13284A] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Browse PDF or Photo File
                  </span>
                </div>
              </div>
            ) : (
              /* Active Image or PDF Preview Card */
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPdfFile ? (
                      <FileText className="w-4 h-4 text-red-600" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-[#2E6FB0]" />
                    )}
                    <span className="text-xs font-bold text-[#13284A]">{fileName || 'Timetable_Document.png'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {isPdfFile ? 'PDF Document Ready' : 'Photo Loaded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isPdfFile && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        View Full Size
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageData(null);
                        setFileName('');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>

                {isPdfFile ? (
                  <div className="p-6 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-[#13284A]">{fileName}</div>
                    <div className="text-xs text-[#667085]">
                      PDF document loaded and ready for Multimodal Gemini Vision analysis. Click "Extract Subjects, Codes & Professors" below.
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white max-h-72 flex items-center justify-center group">
                    <img
                      src={imageData}
                      alt="Timetable Preview"
                      className="max-h-72 w-auto object-contain cursor-pointer"
                      onClick={() => setPreviewModalOpen(true)}
                    />
                    <div
                      onClick={() => setPreviewModalOpen(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-semibold gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Click to Expand Timetable Photo
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Preset Photos (Instant 1-Click Testing) */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#13284A]">
                <Sparkles className="w-4 h-4 text-[#E0982A] shrink-0" />
                <span className="font-semibold">Instant Test Presets:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetPhoto('kle_ece7')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  KLE College ECE Sem 7 (Chikodi)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPhoto('cse4')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-[#2E6FB0] hover:bg-blue-100/70 transition-colors"
                >
                  CSE Sem 4 Board
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPhoto('ece6')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-[#2E6FB0] hover:bg-blue-100/70 transition-colors"
                >
                  ECE Sem 6 Board
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPhoto('aiml5')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-[#2E6FB0] hover:bg-blue-100/70 transition-colors"
                >
                  AI-ML Sem 5 Matrix
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Text / OCR Input Tab */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Raw Schedule Text / OCR Matrix
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadKLETextTimetable}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  Load KLE College ECE Sem 7 Text
                </button>
              </div>
            </div>

            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste schedule data, OCR text, or CSV table lines here..."
              className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50/70 border border-[#DCE3ED] rounded-lg focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>
        )}

        {/* Action Controls & Model Details */}
        <div className="pt-3 border-t border-[#DCE3ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Cpu className="w-4 h-4 text-[#2E6FB0]" />
            <span>Target Model: Gemini 3.7 Flash • Multimodal Multitask Vision & Document OCR</span>
          </div>

          <button
            id="extract-timetable-ai-btn"
            disabled={isProcessing || (activeTab === 'photo' ? !imageData : !rawText.trim())}
            onClick={handleStartExtraction}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#E0982A]" />
                <span>Gemini Vision AI Extracting Subjects & Faculty...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E0982A]" />
                <span>Extract Subjects, Codes & Professors</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Review Grid */}
      {extractedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden space-y-0">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#DCE3ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#13284A] flex items-center gap-2">
                <span>AI Timetable Review & Provisioning Matrix</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  {extractedRows.length} Subjects Detected
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2E6FB0] border border-blue-200 text-xs font-semibold">
                  Target: {targetDept} Sem {targetSemester}
                </span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Review extracted subject codes, titles, credits, and assigned faculty. When confirmed, subjects will be created in the master catalog and assigned to the active semester.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-[#DCE3ED] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#2E6FB0]" />
                Add Row
              </button>

              <button
                id="confirm-timetable-matrix-btn"
                disabled={isProcessing || isConfirmed}
                onClick={handleConfirmAssignments}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E8E5A] text-white hover:bg-[#1E8E5A]/90 transition-colors flex items-center gap-1.5 disabled:opacity-60 shadow-xs"
              >
                <Check className="w-4 h-4" />
                {isConfirmed ? 'Subjects & Faculty Provisioned' : 'Confirm & Provision All to Campus'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Sem</th>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Professor / Faculty</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedRows.map((row, idx) => (
                  <tr key={row.id || `ext-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* Semester */}
                    <td className="py-3 px-4">
                      <select
                        value={row.semester}
                        onChange={(e) => handleRowFieldChange(idx, 'semester', Number(e.target.value))}
                        className="px-2 py-1 text-xs font-bold rounded border border-[#DCE3ED] bg-white text-slate-800"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Sem {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Subject Code */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.subjectCode}
                        onChange={(e) => handleRowFieldChange(idx, 'subjectCode', e.target.value.toUpperCase())}
                        className="w-24 px-2 py-1 font-mono font-bold text-xs rounded border border-[#DCE3ED] text-[#13284A] bg-white uppercase focus:ring-1 focus:ring-[#2E6FB0]"
                      />
                    </td>

                    {/* Subject Title */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.subjectName}
                        onChange={(e) => handleRowFieldChange(idx, 'subjectName', e.target.value)}
                        className="w-64 px-2 py-1 font-semibold text-xs rounded border border-[#DCE3ED] text-slate-800 bg-white focus:ring-1 focus:ring-[#2E6FB0]"
                      />
                    </td>

                    {/* Credits */}
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={row.credits || (row.subjectCode.startsWith('BECL') ? 2 : 4)}
                        onChange={(e) => handleRowFieldChange(idx, 'credits', Number(e.target.value))}
                        className="w-14 px-2 py-1 text-xs rounded border border-[#DCE3ED] text-slate-800 bg-white text-center font-bold"
                      />
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.departmentCode || targetDept}
                        onChange={(e) => handleRowFieldChange(idx, 'departmentCode', e.target.value.toUpperCase())}
                        className="w-20 px-2 py-1 text-xs rounded border border-[#DCE3ED] text-slate-800 bg-white font-semibold uppercase"
                      />
                    </td>

                    {/* Assigned Professor Selector */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-[#2E6FB0] shrink-0" />
                          <select
                            value={row.matchedTeacherId || (row.isNewProfessor ? '__new__' : '')}
                            onChange={(e) => handleTeacherChange(idx, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white max-w-[240px]"
                          >
                            <option value="">-- Match Registered Faculty --</option>
                            {availableTeachers.map((t, tIdx) => (
                              <option key={t.id || t.teacherCode || `teach-opt-${tIdx}`} value={t.id}>
                                {t.user?.name || t.teacherCode} ({t.teacherCode} - {t.department})
                              </option>
                            ))}
                            <option value="__new__">
                              + Auto-Register: "{row.teacherNameRaw}"
                            </option>
                          </select>
                        </div>
                        {row.isNewProfessor && (
                          <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 pl-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                            Will auto-create faculty account for "{row.teacherNameRaw}"
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4">
                      {getConfidenceBadge(row.confidence)}
                    </td>

                    {/* Delete */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Post-Confirmation Summary Banner */}
          {isConfirmed && (
            <div className="p-5 bg-emerald-50 border-t border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="font-bold text-sm">
                  Timetable Successfully Committed & Provisioned to Campus Database!
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-slate-500 text-[11px]">Subjects In Catalog</div>
                  <div className="text-emerald-800 font-bold text-base mt-0.5">
                    {confirmationStats?.totalSubjects || extractedRows.length} Courses
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-slate-500 text-[11px]">Live Teacher Assignments</div>
                  <div className="text-emerald-800 font-bold text-base mt-0.5">
                    {confirmationStats?.createdAssignments || extractedRows.length} Active in Sem {targetSemester}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <div className="text-slate-500 text-[11px]">Faculty Registered</div>
                  <div className="text-emerald-800 font-bold text-base mt-0.5">
                    {confirmationStats?.createdProfessorsCount ?? 0} New Accounts Created
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Size Image Preview Modal */}
      {previewModalOpen && imageData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">{fileName || 'Timetable_Image_Full_Preview'}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 max-h-[75vh] overflow-auto flex items-center justify-center">
              <img src={imageData} alt="Full Size Timetable" className="max-w-full h-auto rounded shadow-xs" />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
