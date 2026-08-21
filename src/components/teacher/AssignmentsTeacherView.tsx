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
import { Assignment, Subject } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { downloadAssignmentPdf } from '../../lib/assignmentPdf';

export const AssignmentsTeacherView: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, refreshNotifications } = useAuth();

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    instructions: '',
    dueDate: '',
    pdfData: '',
    pdfFileName: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track Submissions Modal
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

  const fetchAssignments = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const res = await api.getTeacherAssignments(selectedSubjectId);
      setAssignments(res.assignments);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      fetchAssignments();
    }
  }, [selectedSubjectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('Please select a valid PDF file.', 'error');
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
    if (!selectedSubjectId) return;
    try {
      const currentSubject = subjects.find(
        (s) => (s.id || s.subjectId) === selectedSubjectId
      );

      const res = await api.createAssignment({
        subjectId: selectedSubjectId,
        title: createForm.title,
        instructions: createForm.instructions,
        dueDate: createForm.dueDate,
        pdfData: createForm.pdfData || undefined,
        pdfFileName: createForm.pdfFileName || undefined,
      });

      showToast(
        `Assignment published successfully! Broadcast alert dispatched to ${res.enrolledCount} enrolled students.`,
        'success'
      );
      setIsCreateModalOpen(false);
      setCreateForm({ title: '', instructions: '', dueDate: '', pdfData: '', pdfFileName: '' });
      fetchAssignments();
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message, 'error');
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
        subjectCode: assignment.subjectCode || currentSubject?.code || currentSubject?.subjectCode,
        subjectName: assignment.subjectName || currentSubject?.name || currentSubject?.subjectName,
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

  const handlePreviewPdfDraft = () => {
    if (!createForm.title || !createForm.instructions) {
      showToast('Please enter title and instructions first to preview the PDF.', 'info');
      return;
    }
    const currentSub = subjects.find((s) => (s.id || s.subjectId) === selectedSubjectId);
    downloadAssignmentPdf({
      title: createForm.title,
      instructions: createForm.instructions,
      dueDate: createForm.dueDate || new Date().toISOString(),
      subjectCode: currentSub?.code || currentSub?.subjectCode || 'CSE-301',
      subjectName: currentSub?.name || currentSub?.subjectName || 'Coursework',
      pdfData: createForm.pdfData,
      pdfFileName: createForm.pdfFileName,
    });
  };

  const openRoster = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setRosterLoading(true);
    try {
      const res = await api.getAssignmentRoster(assignment.id);
      setAssignmentRoster(res.students);
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
      showToast('All enrolled students marked as submitted.', 'info');
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Subject Selector */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">
              Assignment Submission Tracker
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              Pure Status Tracker (No Marks)
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Publish assignment worksheets and PDF briefs to students, and manage coursework submission status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-lg border border-[#DCE3ED] bg-white text-[#13284A] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
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

          <button
            id="create-assignment-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Publish Assignment</span>
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#667085]">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-sm text-[#667085]">
            No assignments created for this subject yet. Click "Create & Publish Assignment" to post one.
          </div>
        ) : (
          assignments.map((assignment, idx) => {
            const completionRate =
              assignment.stats?.totalStudents > 0
                ? Math.round((assignment.stats.submittedCount / assignment.stats.totalStudents) * 100)
                : 0;

            return (
              <div
                key={assignment.id || `asg-item-${idx}`}
                className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {assignment.subjectCode}
                    </span>
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    {assignment.pdfData && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#2E6FB0] border border-sky-200">
                        <FileText className="w-3 h-3" />
                        PDF Document Attached
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#13284A]">{assignment.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line">
                    {assignment.instructions}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      <span className="text-emerald-700">{assignment.stats?.submittedCount || 0} Submitted</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700">{assignment.stats?.notSubmittedCount || 0} Pending</span>
                    </div>
                    <div className="w-36 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPdf(assignment)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#DCE3ED] hover:bg-slate-50 text-[#13284A] transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Download Assignment Sheet PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-[#2E6FB0]" />
                      Download PDF
                    </button>

                    <button
                      id={`track-submissions-btn-${assignment.id}`}
                      onClick={() => openRoster(assignment)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Manage Submissions
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create & Publish Assignment"
        subtitle="Publishes assignment instructions & PDF problem sheets to all enrolled students."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Exercise 4: Dijkstra Shortest Path Implementation"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline</label>
            <input
              type="date"
              required
              value={createForm.dueDate}
              onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions & Problem Statement
            </label>
            <textarea
              rows={4}
              required
              placeholder="Specify requirements, report format, question list, submission format, or lab worksheet instructions..."
              value={createForm.instructions}
              onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden font-mono text-[11px]"
            />
          </div>

          {/* PDF Attachment / Auto-PDF Generator option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2E6FB0]" />
                Assignment PDF Document
              </label>
              <button
                type="button"
                onClick={handlePreviewPdfDraft}
                className="text-[11px] font-semibold text-[#2E6FB0] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Preview Generated PDF
              </button>
            </div>

            <p className="text-[11px] text-[#667085]">
              Students will be able to download the officially formatted PDF worksheet. You can also upload a custom PDF file below if you have one prepared.
            </p>

            <div className="flex items-center gap-2 pt-1">
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
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-[#DCE3ED] hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#2E6FB0]" />
                {createForm.pdfFileName ? 'Change Uploaded PDF' : 'Upload Custom PDF File'}
              </button>

              {createForm.pdfFileName && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">{createForm.pdfFileName}</span>
                  <button
                    type="button"
                    onClick={() => setCreateForm((p) => ({ ...p, pdfData: '', pdfFileName: '' }))}
                    className="ml-1 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck2 className="w-4 h-4" />
                Publish Assignment & PDF
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Manage Submissions Roster Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => {
          setSelectedAssignment(null);
          setRosterSearch('');
        }}
        title={`Submission Roster: ${selectedAssignment?.title}`}
        subtitle="Track and mark individual student submissions."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Class Progress:</span>
              <span className="text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                {assignmentRoster.filter((s) => s.status === 'submitted').length} / {assignmentRoster.length} Submitted
              </span>
            </div>
            <button
              type="button"
              onClick={markAllSubmitted}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-[#DCE3ED] hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Mark All as Submitted
            </button>
          </div>

          {/* Student Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or USN..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          {/* Submissions Roster List */}
          <div className="border border-[#DCE3ED] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
            {rosterLoading ? (
              <div className="p-8 text-center text-xs text-[#667085]">Loading student roster...</div>
            ) : assignmentRoster.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#667085]">No students enrolled in this cohort.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#DCE3ED] text-[#13284A] font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">USN</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3ED]">
                  {assignmentRoster
                    .filter((s) => {
                      if (!rosterSearch) return true;
                      const q = rosterSearch.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.usn.toLowerCase().includes(q)
                      );
                    })
                    .map((student) => {
                      const isSub = student.status === 'submitted';
                      return (
                        <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {student.usn}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#13284A]">
                            {student.name}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusPill
                              status={student.status}
                              label={isSub ? 'Submitted' : 'Pending'}
                              size="sm"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleStudentSubmission(student.studentId, student.status)}
                              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                isSub
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isSub ? 'Mark Pending' : 'Mark Submitted'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAssignment(null);
                setRosterSearch('');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
