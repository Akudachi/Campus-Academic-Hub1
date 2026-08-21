import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Save,
  BarChart2,
  Users,
  AlertCircle,
  Search,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TestMarkSheet } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';

interface TestMarksTeacherViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const TestMarksTeacherView: React.FC<TestMarksTeacherViewProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [markSheets, setMarkSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, refreshNotifications } = useAuth();

  // Create MarkSheet Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    testName: '',
    maxMarks: 25,
  });

  // Mark Entry Modal
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [activeSheetDetails, setActiveSheetDetails] = useState<{
    sheet: TestMarkSheet;
    subject: any;
    students: { studentId: string; usn: string; name: string; marks: number; hasEntry: boolean }[];
  } | null>(null);
  const [studentMarksState, setStudentMarksState] = useState<{ [studentId: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [marksSearch, setMarksSearch] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.getTeacherSubjects();
        setSubjects(res.subjects || []);
        if (res.subjects && res.subjects.length > 0) {
          const firstId = res.subjects[0].id || res.subjects[0].subjectId;
          setSelectedSubjectId(firstId);
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const fetchSheets = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const res = await api.getTeacherMarkSheets(selectedSubjectId);
      setMarkSheets(res.sheets || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSheets();
    }
  }, [selectedSubjectId]);

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    try {
      await api.createMarkSheet({
        subjectId: selectedSubjectId,
        testName: createForm.testName.trim(),
        maxMarks: Number(createForm.maxMarks),
      });
      showToast(`Test '${createForm.testName}' created!`, 'success');
      setIsCreateModalOpen(false);
      setCreateForm({ testName: '', maxMarks: 25 });
      fetchSheets();
    } catch (err: any) {
      showToast(err.message || 'Failed to create sheet', 'error');
    }
  };

  const openSheetForGrading = async (sheetId: string) => {
    setActiveSheetId(sheetId);
    setIsProcessing(true);
    try {
      const res = await api.getMarkSheetDetails(sheetId);
      setActiveSheetDetails(res);
      const initialMarks: { [id: string]: number } = {};
      (res.students || []).forEach((s: any) => {
        initialMarks[s.studentId] = s.marks ?? 0;
      });
      setStudentMarksState(initialMarks);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!activeSheetId) return;
    setIsProcessing(true);
    try {
      const payload = Object.entries(studentMarksState).map(([studentId, marks]) => ({
        studentId,
        marks: Number(marks),
      }));

      await api.updateMarks(activeSheetId, payload);
      showToast('Student scores updated successfully.', 'success');
      fetchSheets();
      const res = await api.getMarkSheetDetails(activeSheetId);
      setActiveSheetDetails(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to save scores', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublish = async (sheetId: string, currentPublished: boolean) => {
    try {
      const newStatus = !currentPublished;
      await api.publishMarkSheet(sheetId, newStatus);
      showToast(
        newStatus
          ? 'Marks published to student portal.'
          : 'Marks set to draft mode (hidden from students).',
        'info'
      );
      fetchSheets();
      if (activeSheetDetails && activeSheetDetails.sheet.id === sheetId) {
        setActiveSheetDetails({
          ...activeSheetDetails,
          sheet: { ...activeSheetDetails.sheet, published: newStatus },
        });
      }
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const enteredMarksList = Object.values(studentMarksState).map(Number);
  const liveAvg =
    enteredMarksList.length > 0
      ? (enteredMarksList.reduce((a, b) => a + b, 0) / enteredMarksList.length).toFixed(1)
      : '0.0';
  const liveHigh = enteredMarksList.length > 0 ? Math.max(...enteredMarksList) : 0;

  return (
    <div className="space-y-3.5 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Navigation */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Dashboard" />
        </div>
      )}

      {/* Header & Course Selector */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#13284A]">
              Test & Exam Scores
            </h2>
            <p className="text-[11px] text-slate-500">
              Grade internal tests and toggle student publication status.
            </p>
          </div>

          <button
            id="create-marksheet-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#1E3A63] transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B93D1]" />
            <span>+ New Test Sheet</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Course:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden truncate"
          >
            {subjects.map((sub, index) => {
              const val = sub.id || sub.subjectId || `sub-opt-${index}`;
              return (
                <option key={val} value={val}>
                  {sub.code || sub.subjectCode} - {sub.name || sub.subjectName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Mark Sheets List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED]">
            Loading test sheets...
          </div>
        ) : markSheets.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] text-center text-xs text-slate-500 space-y-2 shadow-2xs">
            <Award className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No test sheets created for this course yet.</p>
            <p className="text-[11px] text-slate-400">Click "+ New Test Sheet" to initialize assessment grading.</p>
          </div>
        ) : (
          markSheets.map((sheet, index) => (
            <div
              key={sheet.id || `sheet-${index}`}
              className="bg-white p-3.5 rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0]/60 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#13284A] border border-slate-200">
                      {sheet.subjectCode || 'TEST'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      Max: {sheet.maxMarks}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        sheet.published
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {sheet.published ? 'Published to Students' : 'Draft (Hidden)'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#13284A] mt-1 break-words">
                    {sheet.testName}
                  </h3>
                </div>

                <div className="text-right shrink-0 text-xs">
                  <span className="text-[10px] text-slate-500 block">Class Avg</span>
                  <span className="font-mono font-bold text-emerald-700">{sheet.averageMarks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] text-slate-500">
                  <span>High: <strong className="text-slate-800 font-mono">{sheet.highestMarks}</strong></span>
                  <span className="mx-1">•</span>
                  <span>{sheet.evaluatedCount || 0} evaluated</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePublish(sheet.id, sheet.published)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors flex items-center gap-1 ${
                      sheet.published
                        ? 'bg-sky-50 text-[#2E6FB0] border-sky-200 hover:bg-sky-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {sheet.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {sheet.published ? 'Published' : 'Publish'}
                  </button>

                  <button
                    id={`enter-marks-btn-${sheet.id}`}
                    onClick={() => openSheetForGrading(sheet.id)}
                    className="px-3 py-1 text-[11px] font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#1E3A63] transition-colors flex items-center gap-1 shadow-2xs active:scale-98"
                  >
                    <Award className="w-3 h-3 text-[#E0982A]" />
                    <span>Grade</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Mark Sheet Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Test Sheet"
        subtitle="Initialize assessment grading."
        maxWidth="sm"
      >
        <form onSubmit={handleCreateSheet} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Test Title</label>
            <input
              type="text"
              required
              placeholder="e.g. IA-1 / Quiz 1"
              value={createForm.testName}
              onChange={(e) => setCreateForm({ ...createForm, testName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Marks</label>
            <input
              type="number"
              min={10}
              max={100}
              required
              value={createForm.maxMarks}
              onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#DCE3ED]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#13284A] text-white font-bold"
            >
              Create Sheet
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Entry Modal (Mobile Compact Roster) */}
      <Modal
        isOpen={!!activeSheetId && !!activeSheetDetails}
        onClose={() => {
          setActiveSheetId(null);
          setActiveSheetDetails(null);
          setMarksSearch('');
        }}
        title={activeSheetDetails?.sheet?.testName || 'Grade Entry'}
        subtitle={`Max Marks: ${activeSheetDetails?.sheet?.maxMarks || 25}`}
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div>
              <span className="text-[10px] text-slate-500 block">Class Avg</span>
              <span className="font-mono font-bold text-emerald-800">{liveAvg}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Top Score</span>
              <span className="font-mono font-bold text-slate-800">{liveHigh}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Students</span>
              <span className="font-mono font-bold text-slate-800">{activeSheetDetails?.students?.length || 0}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search student or USN..."
              value={marksSearch}
              onChange={(e) => setMarksSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
            />
          </div>

          {/* Student Grading List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {(activeSheetDetails?.students || [])
              .filter((s: any) => {
                if (!marksSearch.trim()) return true;
                const q = marksSearch.toLowerCase();
                return (s.name || '').toLowerCase().includes(q) || (s.usn || '').toLowerCase().includes(q);
              })
              .map((student: any) => {
                const currentMark = studentMarksState[student.studentId] ?? student.marks ?? 0;
                const maxM = activeSheetDetails?.sheet?.maxMarks || 25;
                const isInvalid = currentMark < 0 || currentMark > maxM;

                return (
                  <div key={student.studentId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 block truncate">{student.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{student.usn}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={maxM}
                        step={0.5}
                        value={currentMark}
                        onChange={(e) =>
                          setStudentMarksState({
                            ...studentMarksState,
                            [student.studentId]: Number(e.target.value),
                          })
                        }
                        className={`w-16 px-2 py-1 text-right font-mono font-bold text-xs rounded-lg border ${
                          isInvalid
                            ? 'border-rose-500 bg-rose-50 text-rose-800'
                            : 'border-[#DCE3ED] bg-white text-[#13284A]'
                        } focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden`}
                      />
                      <span className="text-[11px] font-mono text-slate-400 font-bold">/ {maxM}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() =>
                handleTogglePublish(
                  activeSheetDetails!.sheet.id,
                  activeSheetDetails!.sheet.published
                )
              }
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border flex items-center gap-1 ${
                activeSheetDetails?.sheet?.published
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {activeSheetDetails?.sheet?.published ? 'Visible to Students' : 'Draft Mode'}
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveMarks}
              className="px-4 py-1.5 rounded-lg bg-[#13284A] text-white font-bold flex items-center gap-1 shadow-2xs active:scale-98 disabled:opacity-50"
            >
              <Save className="w-3 h-3 text-[#E0982A]" />
              <span>{isProcessing ? 'Saving...' : 'Save Scores'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
