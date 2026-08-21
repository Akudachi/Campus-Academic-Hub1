import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Layers,
  FileText,
  Camera,
  School,
  Check,
  RotateCcw,
  Eye,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ExtractedTimetableRow, Teacher, User, Subject } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';

// Helper to generate realistic visual timetable images as Base64 for instant demo testing
function generateSampleTimetableImage(preset: 'kle_ece7' | 'cse4' | 'ece6' | 'aiml5'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top College Header Banner
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, 140);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 15, canvas.width - 40, 110);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("K.L.E. Society's", canvas.width / 2, 45);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('KLE College of Engineering & Technology', canvas.width / 2, 75);
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING', canvas.width / 2, 102);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Doc #: FMTC0301 | Rev: 1.0', 35, 42);
  ctx.fillText('Academic Year: 2026-27 [Odd Sem]', 35, 145);
  ctx.fillText('W.E.F: 20.07.2026', 35, 165);

  ctx.textAlign = 'right';
  ctx.fillText('Semester: VII (7th Sem)', canvas.width - 35, 145);
  ctx.fillText('Lecture Hall: ECLH22', canvas.width - 35, 165);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#13284A';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('TIME TABLE & COURSE ALLOCATION MATRIX', canvas.width / 2, 158);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(20, 185, canvas.width - 40, 620);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 185, canvas.width - 40, 620);

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
    { name: 'Non-conventional energy resources', abbr: 'NCER', code: 'BME755D', staff: 'Mr. Amit Ghantimath', init: 'ASG' },
    { name: 'Microwave Engineering Lab(IPCC)', abbr: 'M&A LAB', code: 'BECL701', staff: 'Mr. Avadhut Ambole', init: 'AVA' },
    { name: 'Computer Networks and Protocols Lab', abbr: 'CNPL LAB', code: 'BECL702', staff: 'Mr. Mallikarjun Biradar', init: 'MRB' },
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

  return canvas.toDataURL('image/png');
}

interface TimetableAIViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

interface PeriodSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  periodNumber: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  room: string;
}

const DEFAULT_SCHEDULE_SLOTS: PeriodSlot[] = [
  { id: 's1', day: 'Mon', periodNumber: 1, time: '09:00 - 10:00 AM', subjectCode: '21CS42', subjectName: 'Design & Analysis of Algorithms', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's2', day: 'Mon', periodNumber: 2, time: '10:00 - 11:00 AM', subjectCode: '21CS43', subjectName: 'Microcontrollers & Embedded Systems', teacherName: 'Prof. Ananya Rao', room: 'LH-301' },
  { id: 's3', day: 'Mon', periodNumber: 3, time: '11:15 - 12:15 PM', subjectCode: '21CS44', subjectName: 'Operating Systems', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's4', day: 'Mon', periodNumber: 4, time: '01:00 - 02:00 PM', subjectCode: '21MAT41', subjectName: 'Complex Analysis & Transforms', teacherName: 'Dr. Vinod Kumar', room: 'LH-301' },
  { id: 's5', day: 'Tue', periodNumber: 1, time: '09:00 - 10:00 AM', subjectCode: '21CS43', subjectName: 'Microcontrollers & Embedded Systems', teacherName: 'Prof. Ananya Rao', room: 'LH-301' },
  { id: 's6', day: 'Tue', periodNumber: 2, time: '10:00 - 11:00 AM', subjectCode: '21CS42', subjectName: 'Design & Analysis of Algorithms', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's7', day: 'Tue', periodNumber: 3, time: '11:15 - 01:15 PM', subjectCode: '21CSL46', subjectName: 'Algorithms Laboratory', teacherName: 'Dr. Ramesh Patil', room: 'Lab 4' },
  { id: 's8', day: 'Wed', periodNumber: 1, time: '09:00 - 10:00 AM', subjectCode: '21CS44', subjectName: 'Operating Systems', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's9', day: 'Wed', periodNumber: 2, time: '10:00 - 11:00 AM', subjectCode: '21MAT41', subjectName: 'Complex Analysis & Transforms', teacherName: 'Dr. Vinod Kumar', room: 'LH-301' },
  { id: 's10', day: 'Wed', periodNumber: 3, time: '11:15 - 12:15 PM', subjectCode: '21CS42', subjectName: 'Design & Analysis of Algorithms', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's11', day: 'Thu', periodNumber: 1, time: '09:00 - 10:00 AM', subjectCode: '21CS43', subjectName: 'Microcontrollers & Embedded Systems', teacherName: 'Prof. Ananya Rao', room: 'LH-301' },
  { id: 's12', day: 'Thu', periodNumber: 2, time: '10:00 - 11:00 AM', subjectCode: '21CS44', subjectName: 'Operating Systems', teacherName: 'Dr. Ramesh Patil', room: 'LH-301' },
  { id: 's13', day: 'Fri', periodNumber: 1, time: '09:00 - 10:00 AM', subjectCode: '21MAT41', subjectName: 'Complex Analysis & Transforms', teacherName: 'Dr. Vinod Kumar', room: 'LH-301' },
  { id: 's14', day: 'Fri', periodNumber: 2, time: '10:00 - 12:00 PM', subjectCode: '21CSL47', subjectName: 'Microcontrollers Laboratory', teacherName: 'Prof. Ananya Rao', room: 'Hardware Lab' },
];

export const TimetableAIView: React.FC<TimetableAIViewProps> = ({ onBack }) => {
  const [activeMainTab, setActiveMainTab] = useState<'schedule' | 'scanner'>('schedule');
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Mon');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSem, setSelectedSem] = useState(4);
  const [scheduleSlots, setScheduleSlots] = useState<PeriodSlot[]>(DEFAULT_SCHEDULE_SLOTS);

  // Scanner State
  const [fileName, setFileName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [targetSemester, setTargetSemester] = useState<number>(4);
  const [targetDept, setTargetDept] = useState<string>('CSE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [extractedRows, setExtractedRows] = useState<ExtractedTimetableRow[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<(Teacher & { user?: User })[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useAuth();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await api.getTeachers();
      setAvailableTeachers(res.teachers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      showToast(`Loaded ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handlePresetPhoto = (preset: 'kle_ece7' | 'cse4' | 'ece6' | 'aiml5') => {
    const dataUrl = generateSampleTimetableImage(preset);
    setImageData(dataUrl);
    if (preset === 'kle_ece7') {
      setFileName('KLE_ECE_Sem7_Timetable.png');
      setTargetSemester(7);
      setTargetDept('ECE');
    } else {
      setFileName('CSE_Sem4_Timetable.png');
      setTargetSemester(4);
      setTargetDept('CSE');
    }
    showToast('Loaded sample timetable preset!', 'info');
  };

  const handleStartExtraction = async () => {
    if (!imageData) {
      showToast('Please upload a timetable photo or select a preset template.', 'warning');
      return;
    }
    setIsProcessing(true);
    setIsConfirmed(false);
    try {
      const res = await api.uploadTimetable({
        fileName: fileName || 'Timetable_Photo.png',
        imageData,
        semester: targetSemester,
        departmentCode: targetDept,
      });
      setUploadId(res.uploadId);
      setExtractedRows(res.extractedRows);
      if (res.availableTeachers) setAvailableTeachers(res.availableTeachers);
      showToast(`AI extracted ${res.totalRows} courses and faculty assignments!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Timetable scan failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitSchedule = async () => {
    if (!uploadId) return;
    setIsProcessing(true);
    try {
      const res = await api.confirmTimetable(uploadId, extractedRows);
      setIsConfirmed(true);
      showToast(
        `Successfully committed ${res.createdSubjectsCount} courses & ${res.createdAssignments} faculty assignments!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to commit timetable', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentDaySlots = scheduleSlots
    .filter((slot) => slot.day === selectedDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs">
        <div className="flex items-center gap-2.5">
          {onBack && <BackButton onClick={onBack} label="Back" />}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#13284A]">Class Timetable & Schedule</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2E6FB0] text-xs font-mono font-bold">
                {selectedDept} - Sem {selectedSem}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">View weekly period timetable or scan timetables with AI.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveMainTab('schedule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'schedule'
                ? 'bg-white text-[#13284A] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Schedule</span>
          </button>
          <button
            onClick={() => setActiveMainTab('scanner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'scanner'
                ? 'bg-[#13284A] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Scanner</span>
          </button>
        </div>
      </div>

      {activeMainTab === 'schedule' ? (
        /* WEEKLY SCHEDULE VIEW */
        <div className="space-y-3">
          {/* Filter Bar: Branch, Semester, Day */}
          <div className="bg-white p-3 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
            {/* Branch & Semester Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="font-bold text-slate-400 text-[11px]">Branch:</span>
                {['CSE', 'ECE', 'ISE', 'MECH', 'CIVIL'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors ${
                      selectedDept === dept
                        ? 'bg-[#13284A] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 text-[11px]">Sem:</span>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSem(s)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                      selectedSem === s
                        ? 'bg-[#2E6FB0] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    S{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Pills */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
              <span className="font-bold text-slate-400 text-[11px] shrink-0">Day:</span>
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    selectedDay === d
                      ? 'bg-[#13284A] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Periods Timeline List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
                {selectedDay} Schedule — {selectedDept} Semester {selectedSem}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">{currentDaySlots.length} Periods Scheduled</span>
            </div>

            {currentDaySlots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-[#DCE3ED] text-xs text-slate-500 space-y-1">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No classes scheduled for {selectedDay}.</p>
                <p className="text-[11px] text-slate-400">Use the AI Scanner to automatically extract full timetable.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentDaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Period Badge */}
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#2E6FB0] uppercase">Period</span>
                        <span className="text-sm font-bold text-[#13284A]">{slot.periodNumber}</span>
                      </div>

                      {/* Course Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-[#13284A] border border-slate-200">
                            {slot.subjectCode}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {slot.time}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[#13284A] mt-0.5">{slot.subjectName}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Faculty: <strong className="text-slate-700">{slot.teacherName}</strong></span>
                          <span>•</span>
                          <span>Room: <strong className="text-slate-700">{slot.room}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Period
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AI TIMETABLE SCANNER VIEW */
        <div className="space-y-3 text-xs">
          {/* Quick Presets & Upload Box */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
            <div>
              <h2 className="text-xs font-bold text-[#13284A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Schedule Scanner & Course Allocation
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload a timetable photo, PDF, or select a preset to auto-populate courses and faculty.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-500 text-[11px]">Demo Presets:</span>
              <button
                onClick={() => handlePresetPhoto('kle_ece7')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-[11px] text-slate-700 transition-colors"
              >
                KLE ECE Sem 7
              </button>
              <button
                onClick={() => handlePresetPhoto('cse4')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-[11px] text-slate-700 transition-colors"
              >
                AIT CSE Sem 4
              </button>
            </div>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#2E6FB0] bg-slate-50/60 p-6 rounded-xl text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, .pdf, .txt"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <Camera className="w-8 h-8 text-[#2E6FB0] mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Click to select Timetable Image / PDF'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, PDF, or text schedule</p>
            </div>

            {/* Scan Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Target: {targetDept} Semester {targetSemester}</span>
              <button
                onClick={handleStartExtraction}
                disabled={isProcessing || !imageData}
                className="px-4 py-2 rounded-lg bg-[#13284A] text-white font-bold text-xs hover:bg-[#2E6FB0] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isProcessing ? 'Scanning...' : 'Scan & Extract Schedule'}</span>
              </button>
            </div>
          </div>

          {/* Extracted Rows Preview */}
          {extractedRows.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#13284A]">
                    Extracted Courses & Faculty ({extractedRows.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Review AI extracted subjects and match with professors.</p>
                </div>
                <button
                  onClick={handleCommitSchedule}
                  disabled={isProcessing || isConfirmed}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isConfirmed ? 'Schedule Committed!' : 'Commit to Database'}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Code</th>
                      <th className="p-2.5">Course Title</th>
                      <th className="p-2.5">Professor</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#13284A]">{r.subjectCode}</td>
                        <td className="p-2.5 font-bold text-slate-800">{r.subjectName}</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">{r.matchedTeacherName || r.teacherNameRaw}</td>
                        <td className="p-2.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            Matched
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
