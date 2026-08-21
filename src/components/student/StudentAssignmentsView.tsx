import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StatusPill } from '../common/StatusPill';
import { downloadAssignmentPdf } from '../../lib/assignmentPdf';
import { useAuth } from '../../context/AuthContext';

export const StudentAssignmentsView: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAuth();

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentAssignments();
        setAssignments(res.assignments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const handleDownloadPdf = (assignment: any) => {
    try {
      downloadAssignmentPdf({
        id: assignment.id || assignment.assignmentId,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt,
        subjectCode: assignment.subjectCode,
        subjectName: assignment.subjectName,
        teacherName: assignment.teacherName,
        semester: assignment.semester,
        department: assignment.department,
        pdfData: assignment.pdfData,
        pdfFileName: assignment.pdfFileName,
      });
      showToast(`Downloading official assignment PDF for "${assignment.title}"...`, 'success');
    } catch (e: any) {
      showToast(`Failed to generate PDF: ${e.message}`, 'error');
    }
  };

  const submittedCount = assignments.filter((a) => a.status === 'submitted').length;
  const pendingCount = assignments.filter((a) => a.status !== 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">
            Coursework & Assignments Status
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Faculty-issued problem sets, laboratory worksheets, and coursework submission ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {submittedCount} Submitted
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
            No assignments currently active for your semester cohort.
          </div>
        ) : (
          assignments.map((assignment, idx) => {
            const isSubmitted = assignment.status === 'submitted';

            return (
              <div
                key={assignment.id || `stu-asg-${idx}`}
                className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#13284A]">
                      {assignment.subjectCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {assignment.subjectName}
                    </span>
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    {assignment.pdfData && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#2E6FB0] border border-sky-200">
                        <FileText className="w-3 h-3" />
                        PDF Attached
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#13284A]">{assignment.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                    {assignment.instructions}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPdf(assignment)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#DCE3ED] hover:bg-slate-50 text-[#13284A] flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Download Assignment Worksheet PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-[#2E6FB0]" />
                      Download PDF
                    </button>
                    <StatusPill
                      status={assignment.status}
                      label={isSubmitted ? 'Submitted (Verified)' : 'Not Submitted'}
                      size="md"
                    />
                  </div>
                  <span className="text-[11px] text-[#667085]">
                    {isSubmitted ? `Recorded on ${new Date(assignment.markedAt).toLocaleDateString()}` : 'Pending Faculty Verification'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
