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
import { MetricCard } from '../common/MetricCard';
import { useAuth } from '../../context/AuthContext';

export const TestMarksTeacherView: React.FC = () => {
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
        setSubjects(res.subjects);
        if (res.subjects.length > 0) {
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
      setMarkSheets(res.sheets);
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
        testName: createForm.testName,
        maxMarks: Number(createForm.maxMarks),
      });
      showToast(`Test mark sheet '${createForm.testName}' created!`, 'success');
      setIsCreateModalOpen(false);
      setCreateForm({ testName: '', maxMarks: 25 });
      fetchSheets();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openSheetForGrading = async (sheetId: string) => {
    setActiveSheetId(sheetId);
    setIsProcessing(true);
    try {
      const res = await api.getMarkSheetDetails(sheetId);
      setActiveSheetDetails(res);
      const initialMarks: { [id: string]: number } = {};
      res.students.forEach((s) => {
        initialMarks[s.studentId] = s.marks || 0;
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
      // Re-fetch details
      const res = await api.getMarkSheetDetails(activeSheetId);
      setActiveSheetDetails(res);
    } catch (err: any) {
      showToast(err.message, 'error');
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
          ? 'Marks published! Students can now view their scores.'
          : 'Marks unpublished (draft mode). Hidden from students.',
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

  // Compute live grading metrics in modal
  const enteredMarksList = Object.values(studentMarksState).map(Number);
  const liveAvg =
    enteredMarksList.length > 0
      ? (enteredMarksList.reduce((a, b) => a + b, 0) / enteredMarksList.length).toFixed(1)
      : '0.0';
  const liveHigh = enteredMarksList.length > 0 ? Math.max(...enteredMarksList) : 0;
  const liveLow = enteredMarksList.length > 0 ? Math.min(...enteredMarksList) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Subject Selector */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">
              Test Marks & Internal Assessment Evaluator
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Grade internal assessments, quizzes, and laboratory exams. Students only see marks when published.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
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

          <button
            id="create-marksheet-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Test Sheet</span>
          </button>
        </div>
      </div>

      {/* Sheets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#667085]">Loading test mark sheets...</div>
        ) : markSheets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-sm text-[#667085]">
            No test mark sheets created for this subject yet. Click "New Test Sheet" to begin.
          </div>
        ) : (
          markSheets.map((sheet, index) => (
            <div
              key={sheet.id || `sheet-${index}`}
              className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    {sheet.subjectCode}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Max Marks: {sheet.maxMarks}
                  </span>
                  {sheet.published ? (
                    <StatusPill status="published" label="Published to Students" size="sm" />
                  ) : (
                    <StatusPill status="pending" label="Draft (Hidden from Students)" size="sm" />
                  )}
                </div>
                <h3 className="text-base font-bold text-[#13284A]">{sheet.testName}</h3>
                <div className="flex items-center gap-4 text-xs text-[#667085] pt-1">
                  <span>Class Average: <strong className="text-emerald-800 font-mono">{sheet.averageMarks}</strong></span>
                  <span>Highest: <strong className="text-slate-800 font-mono">{sheet.highestMarks}</strong></span>
                  <span>Evaluated: <strong className="text-slate-800 font-mono">{sheet.evaluatedCount}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTogglePublish(sheet.id, sheet.published)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                    sheet.published
                      ? 'bg-sky-50 text-[#2E6FB0] border-sky-200 hover:bg-sky-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {sheet.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {sheet.published ? 'Published' : 'Publish to Students'}
                </button>

                <button
                  id={`enter-marks-btn-${sheet.id}`}
                  onClick={() => openSheetForGrading(sheet.id)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-3.5 h-3.5 text-[#E0982A]" />
                  Enter / Edit Scores
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Mark Sheet Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Test Mark Sheet"
        subtitle="Initialize an evaluation sheet for Internal Assessment or Quiz."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSheet} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test / Assessment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Internal Assessment Test 2 (IA-2)"
              value={createForm.testName}
              onChange={(e) => setCreateForm({ ...createForm, testName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks Scale</label>
            <input
              type="number"
              min={10}
              max={100}
              required
              value={createForm.maxMarks}
              onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#DCE3ED] bg-white font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90"
            >
              Initialize Sheet
            </button>
          </div>
        </form>
      </Modal>

      {/* Enter Scores Grid Modal */}
      <Modal
        isOpen={!!activeSheetId && !!activeSheetDetails}
        onClose={() => {
          setActiveSheetId(null);
          setActiveSheetDetails(null);
          setMarksSearch('');
        }}
        title={`Grade Entry: ${activeSheetDetails?.sheet?.testName}`}
        subtitle={`Max Marks: ${activeSheetDetails?.sheet?.maxMarks} • ${activeSheetDetails?.subject?.name || 'Class'}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Live Stats Header */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs">
            <div>
              <span className="text-slate-500 font-medium">Class Average</span>
              <p className="text-base font-bold text-emerald-800 font-mono">
                {liveAvg} / {activeSheetDetails?.sheet?.maxMarks}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Highest Score</span>
              <p className="text-base font-bold text-slate-800 font-mono">
                {liveHigh} / {activeSheetDetails?.sheet?.maxMarks}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Evaluated</span>
              <p className="text-base font-bold text-slate-800 font-mono">
                {activeSheetDetails?.students.length || 0} Students
              </p>
            </div>
          </div>

          {/* Search filter for students */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or USN..."
              value={marksSearch}
              onChange={(e) => setMarksSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white placeholder-slate-400 focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          {/* Student Grading Roster Table */}
          <div className="border border-[#DCE3ED] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#667085] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4">USN</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 text-right">
                    Score (out of {activeSheetDetails?.sheet?.maxMarks})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSheetDetails?.students
                  .filter((s) => {
                    if (!marksSearch.trim()) return true;
                    const q = marksSearch.toLowerCase();
                    const nameMatch = (s.name || '').toLowerCase().includes(q);
                    const usnMatch = (s.usn || '').toLowerCase().includes(q);
                    return nameMatch || usnMatch;
                  })
                  .map((student, idx) => {
                    const currentMark = studentMarksState[student.studentId] ?? student.marks ?? 0;
                    const maxM = activeSheetDetails.sheet.maxMarks;
                    const isInvalid = currentMark < 0 || currentMark > maxM;
                    const displayName = student.name || `Student (${student.usn})`;

                    return (
                      <tr key={student.studentId || student.usn || `sheet-stu-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#13284A] whitespace-nowrap">{student.usn || 'N/A'}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-800 text-sm">{displayName}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
                              className={`w-20 px-2.5 py-1 text-right font-mono font-bold text-xs rounded-lg border ${
                                isInvalid
                                  ? 'border-rose-500 bg-rose-50 text-rose-800'
                                  : 'border-[#DCE3ED] bg-white text-[#13284A]'
                              } focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden`}
                            />
                            <span className="font-mono text-slate-400 font-semibold">/ {maxM}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {activeSheetDetails?.students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-[#667085]">
                      No students found for this subject's semester.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleTogglePublish(
                    activeSheetDetails!.sheet.id,
                    activeSheetDetails!.sheet.published
                  )
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 ${
                  activeSheetDetails?.sheet?.published
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {activeSheetDetails?.sheet?.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {activeSheetDetails?.sheet?.published ? 'Visible to Students' : 'Draft (Unpublished)'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSheetId(null);
                  setActiveSheetDetails(null);
                  setMarksSearch('');
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600 shadow-xs"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveMarks}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#E0982A]" />
                {isProcessing ? 'Saving Scores...' : 'Save Student Marks'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
