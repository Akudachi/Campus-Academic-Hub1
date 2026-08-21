import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StatusPill } from '../common/StatusPill';
import { BackButton } from '../common/BackButton';
import { downloadAssignmentPdf } from '../../lib/assignmentPdf';
import { useAuth } from '../../context/AuthContext';

interface StudentAssignmentsViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentAssignmentsView: React.FC<StudentAssignmentsViewProps> = ({ onBack, onNavigate }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'submitted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useAuth();

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentAssignments();
        setAssignments(res.assignments || []);
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

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'pending') return a.status !== 'submitted';
      if (filterType === 'submitted') return a.status === 'submitted';
      return true;
    });
  }, [assignments, filterType, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in pb-6">
      {/* Mobile Header Bar */}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <BackButton onClick={onBack} label="Back to Home" />
        ) : (
          <h1 className="text-lg sm:text-xl font-bold text-[#13284A] font-display">
            Assignments & Tasks
          </h1>
        )}

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 shadow-2xs">
            {pendingCount} Due
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 shadow-2xs">
            {submittedCount} Done
          </span>
        </div>
      </div>

      {/* Segmented Filter & Search */}
      <div className="bg-white p-3 rounded-2xl border border-[#DCE3ED] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'all' ? 'bg-white text-[#13284A] shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'pending' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterType('submitted')}
              className={`py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                filterType === 'submitted' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Submitted ({submittedCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2E6FB0]"
            />
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
            No coursework found matching your filter.
          </div>
        ) : (
          filteredAssignments.map((assignment, idx) => {
            const isSubmitted = assignment.status === 'submitted';

            return (
              <div
                key={assignment.id || `stu-asg-${idx}`}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE3ED] shadow-2xs space-y-3.5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[#13284A]">
                        {assignment.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {assignment.subjectName}
                      </span>
                      {assignment.pdfData && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-[#2E6FB0] border border-sky-200">
                          <FileText className="w-3 h-3" />
                          PDF
                        </span>
                      )}
                    </div>

                    <StatusPill
                      status={assignment.status}
                      label={isSubmitted ? 'Submitted' : 'Pending Due'}
                      size="sm"
                    />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#13284A] font-heading">{assignment.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3">
                    {assignment.instructions}
                  </p>
                </div>

                {/* Card Action Strip */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#667085] text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Due Date: <strong className="text-slate-800 font-mono">{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleDownloadPdf(assignment)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#13284A] active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="Download Assignment Worksheet PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-[#2E6FB0]" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

