import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Check,
  AlertCircle,
  Clock,
  Download,
  FileText,
  Upload,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Assignment } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';
import { downloadAssignmentPdf } from '../../lib/assignmentPdf';

interface AssignmentsTeacherViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const AssignmentsTeacherView: React.FC<AssignmentsTeacherViewProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, refreshNotifications } = useAuth();

  // Create Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    subjectId: '',
    title: '',
    instructions: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    pdfData: '',
    pdfFileName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track Submissions Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentRoster, setAssignmentRoster] = useState<{
    submissionId: string;
    studentId: string;
    usn: string;
    name: string;
    status: 'submitted' | 'not_submitted';
    markedAt: string;
  }[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.getTeacherSubjects();
        setSubjects(res.subjects || []);
        if (res.subjects && res.subjects.length > 0) {
          const firstId = res.subjects[0].id || res.subjects[0].subjectId;
          setSelectedSubjectId(firstId);
          setCreateForm((prev) => ({ ...prev, subjectId: firstId }));
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const fetchAssignments = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const res = await api.getTeacherAssignments(selectedSubjectId);
      setAssignments(res.assignments || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      fetchAssignments();
      setCreateForm((prev) => ({ ...prev, subjectId: selectedSubjectId }));
    }
  }, [selectedSubjectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('Please select a valid PDF document.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('PDF file size must be under 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCreateForm((prev) => ({
        ...prev,
        pdfData: reader.result as string,
        pdfFileName: file.name,
      }));
      showToast(`Attached PDF: "${file.name}"`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubjectId = createForm.subjectId || selectedSubjectId;

    if (!effectiveSubjectId) {
      showToast('Please select a course for this task.', 'warning');
      return;
    }

    if (!createForm.title.trim()) {
      showToast('Please enter an assignment title.', 'warning');
      return;
    }

    if (!createForm.instructions.trim()) {
      showToast('Please enter task instructions or problem description.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetSub = subjects.find(
        (s) => (s.id || s.subjectId) === effectiveSubjectId
      );

      const res = await api.createAssignment({
        subjectId: effectiveSubjectId,
        semesterId: targetSub?.semesterId || (targetSub ? `sem-${targetSub.semesterNumber}` : undefined),
        title: createForm.title.trim(),
        instructions: createForm.instructions.trim(),
        dueDate: createForm.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        pdfData: createForm.pdfData || undefined,
        pdfFileName: createForm.pdfFileName || undefined,
      });

      showToast(
        `Task "${createForm.title}" published! Dispatched to ${res.enrolledCount || 'all'} students.`,
        'success'
      );
      setIsCreateModalOpen(false);
      setCreateForm({
        subjectId: selectedSubjectId,
        title: '',
        instructions: '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        pdfData: '',
        pdfFileName: '',
      });
      fetchAssignments();
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = (assignment: any) => {
    try {
      const currentSubject = subjects.find(
        (s) => (s.id || s.subjectId) === (assignment.subjectId || selectedSubjectId)
      );

      downloadAssignmentPdf({
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        subjectCode: assignment.subjectCode || currentSubject?.code || currentSubject?.subjectCode || 'CSE-301',
        subjectName: assignment.subjectName || currentSubject?.name || currentSubject?.subjectName || 'Coursework',
        teacherName: currentSubject?.teacherName || 'Course Faculty',
        semester: assignment.semesterNumber || currentSubject?.semesterNumber || 4,
        department: assignment.department || currentSubject?.departmentCode || 'CSE',
        pdfData: assignment.pdfData,
        pdfFileName: assignment.pdfFileName,
      });
      showToast(`Generating official PDF for "${assignment.title}"...`, 'success');
    } catch (e: any) {
      showToast(`PDF Export failed: ${e.message}`, 'error');
    }
  };

  const openRoster = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setRosterLoading(true);
    try {
      const res = await api.getAssignmentRoster(assignment.id);
      setAssignmentRoster(res.students || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setRosterLoading(false);
    }
  };

  const toggleStudentSubmission = async (studentId: string, currentStatus: 'submitted' | 'not_submitted') => {
    if (!selectedAssignment) return;
    const newStatus = currentStatus === 'submitted' ? 'not_submitted' : 'submitted';
    try {
      await api.updateSubmissionStatus(selectedAssignment.id, studentId, newStatus);
      setAssignmentRoster((prev) =>
        prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
      );
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const markAllSubmitted = async () => {
    if (!selectedAssignment) return;
    try {
      for (const s of assignmentRoster) {
        if (s.status !== 'submitted') {
          await api.updateSubmissionStatus(selectedAssignment.id, s.studentId, 'submitted');
        }
      }
      setAssignmentRoster((prev) => prev.map((s) => ({ ...s, status: 'submitted' })));
      showToast('All students marked as submitted.', 'info');
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredRoster = assignmentRoster.filter(
    (s) =>
      s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      s.usn.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden animate-fade-in pb-4">
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Dashboard" />
        </div>
      )}

      {/* Header & Course Switcher */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE3ED] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#13284A]">
              Course Tasks & Assignments
            </h2>
            <p className="text-[11px] text-slate-500">
              Publish task briefs, worksheets, and track student submission status.
            </p>
          </div>

          <button
            id="create-assignment-btn"
            onClick={() => {
              setCreateForm((p) => ({
                ...p,
                subjectId: selectedSubjectId || (subjects[0]?.id || ''),
              }));
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#1E3A63] transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B93D1]" />
            <span>+ New Task</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Course:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden truncate"
          >
            {subjects.map((sub, index) => {
              const val = sub.id || sub.subjectId || `asg-opt-${index}`;
              return (
                <option key={val} value={val}>
                  {sub.code || sub.subjectCode} - {sub.name || sub.subjectName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#DCE3ED]">
            Loading coursework...
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] text-center text-xs text-slate-500 space-y-2 shadow-2xs">
            <FileCheck2 className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No assignments posted yet for this course.</p>
            <p className="text-[11px] text-slate-400">Click "+ New Task" to publish your first assignment brief.</p>
          </div>
        ) : (
          assignments.map((assignment, idx) => {
            const totalCount = assignment.stats?.totalStudents || 0;
            const submittedCount = assignment.stats?.submittedCount || 0;
            const pendingCount = assignment.stats?.notSubmittedCount || 0;
            const completionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

            return (
              <div
                key={assignment.id || `asg-item-${idx}`}
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#DCE3ED] shadow-2xs hover:border-[#2E6FB0]/60 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#13284A] border border-slate-200">
                        {assignment.subjectCode || 'COURSE'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                      {assignment.pdfData && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          PDF Attached
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#13284A] mt-1 break-words">
                      {assignment.title}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700">{submittedCount} Sub</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-xs font-bold text-rose-700">{pendingCount} Pend</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {assignment.instructions}
                </p>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadPdf(assignment)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3 h-3 text-[#2E6FB0]" />
                      PDF
                    </button>

                    <button
                      id={`track-submissions-btn-${assignment.id}`}
                      onClick={() => openRoster(assignment)}
                      className="px-3 py-1 text-[11px] font-bold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#1E3A63] transition-colors flex items-center gap-1 active:scale-98"
                    >
                      <Users className="w-3 h-3" />
                      Submissions
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create & Publish Task"
        subtitle="Publish coursework brief, instructions, and PDF worksheets to enrolled students."
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Course</label>
            <select
              value={createForm.subjectId}
              onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white font-bold text-[#13284A]"
            >
              {subjects.map((sub, index) => {
                const val = sub.id || sub.subjectId || `m-opt-${index}`;
                return (
                  <option key={val} value={val}>
                    {sub.code || sub.subjectCode} - {sub.name || sub.subjectName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Exercise 4: Dijkstra Shortest Path"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Submission Deadline</label>
            <input
              type="date"
              required
              value={createForm.dueDate}
              onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Instructions & Problem Statement</label>
            <textarea
              rows={3}
              required
              placeholder="Specify requirements, report format, test cases, or submission guidelines..."
              value={createForm.instructions}
              onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-mono"
            />
          </div>

          {/* PDF Upload / Custom File */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#2E6FB0]" />
              Optional PDF Attachment
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-[#DCE3ED] hover:bg-slate-100 text-slate-700 flex items-center gap-1 shadow-2xs"
              >
                <Upload className="w-3 h-3 text-[#2E6FB0]" />
                {createForm.pdfFileName ? 'Change PDF' : 'Upload PDF'}
              </button>

              {createForm.pdfFileName && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[150px]">
                  {createForm.pdfFileName}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DCE3ED] text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#1E3A63] flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Task'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Submissions Roster Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment ? `Submissions: ${selectedAssignment.title}` : 'Submissions'}
        subtitle="Toggle student submission status for this assignment."
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search USN or student name..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
            <button
              type="button"
              onClick={markAllSubmitted}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shrink-0"
            >
              Mark All Sub
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {rosterLoading ? (
              <div className="p-4 text-center text-slate-500">Loading roster...</div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No students matched.</div>
            ) : (
              filteredRoster.map((s) => {
                const isSub = s.status === 'submitted';
                return (
                  <div key={s.studentId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 block truncate">{s.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{s.usn}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleStudentSubmission(s.studentId, s.status)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                        isSub
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {isSub ? (
                        <>
                          <Check className="w-3 h-3" />
                          Submitted
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Pending
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#13284A] text-white"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
