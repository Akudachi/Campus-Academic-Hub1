import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';
import { BackButton } from '../common/BackButton';

interface StudentMarksViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentMarksView: React.FC<StudentMarksViewProps> = ({ onBack, onNavigate }) => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMarks = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentMarks();
        setTestResults(res.testResults || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const totalEvaluated = testResults.length;
  const overallAvg =
    totalEvaluated > 0
      ? (
          testResults.reduce((acc, r) => {
            const studentScore = Number(r.studentMarks ?? r.marksObtained ?? 0);
            const maxM = Number(r.maxMarks) || 25;
            return acc + (studentScore / maxM) * 100;
          }, 0) / totalEvaluated
        ).toFixed(1)
      : '0.0';

  const filteredResults = testResults.filter((test) => {
    if (!searchQuery) return true;
    return (
      test.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in pb-6">
      {/* Mobile Header Bar */}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <BackButton onClick={onBack} label="Back to Home" />
        ) : (
          <h1 className="text-lg sm:text-xl font-bold text-[#13284A] font-display">
            Internal Test Scores
          </h1>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Official Release
        </span>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <MetricCard
          title="Overall Test Average"
          value={`${overallAvg}%`}
          subtitle="Cumulative score across published tests"
          icon={Award}
          accentColor="amber"
        />
        <MetricCard
          title="Published Test Evaluations"
          value={totalEvaluated}
          subtitle="Official mark sheets released"
          icon={BarChart2}
          accentColor="blue"
        />
      </div>

      {/* Search Bar on Mobile */}
      <div className="bg-white p-3 rounded-2xl border border-[#DCE3ED] shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Filter scorecards by subject or test name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Test Results Scorecards */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#667085] px-1">
          Assessment Scorecards
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading test evaluations...</div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-[#DCE3ED] text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No Published Marks Found</p>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              Test marks will appear here once faculty complete evaluations and officially publish score sheets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredResults.map((test, idx) => {
              const studentScore = Number(test.studentMarks ?? test.marksObtained ?? 0);
              const maxScore = Number(test.maxMarks) || 25;
              const scorePct = maxScore > 0 ? Math.round((studentScore / maxScore) * 100) : 0;
              const classAvg = test.classAverage !== undefined ? test.classAverage : '-';
              const highMark = test.highestMarks !== undefined ? test.highestMarks : '-';

              return (
                <div
                  key={test.id || test.sheetId || `test-res-${idx}`}
                  className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE3ED] shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[#13284A]">
                          {test.subjectCode}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-[#13284A] mt-1.5 truncate">
                          {test.testName}
                        </h4>
                        <p className="text-[11px] text-[#667085] truncate">{test.subjectName}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl font-black font-mono text-[#13284A]">
                            {studentScore}
                          </span>
                          <span className="text-xs font-bold text-slate-400 font-mono">/ {maxScore}</span>
                        </div>
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          scorePct >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {scorePct}% Score
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E0982A] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(scorePct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Benchmark Footer */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-[#667085] bg-slate-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 rounded-b-3xl">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class Average</span>
                      <p className="font-mono font-black text-slate-800 text-sm">
                        {classAvg} <span className="text-xs text-slate-400 font-medium">/ {maxScore}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
                      <p className="font-mono font-black text-emerald-700 text-sm">
                        {highMark} <span className="text-xs text-slate-400 font-medium">/ {maxScore}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

