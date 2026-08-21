import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MetricCard } from '../common/MetricCard';

export const StudentMarksView: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentMarks();
        setTestResults(res.testResults);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#13284A] font-serif">
              Internal Assessment & Test Results
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
              Official Published Scores
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Faculty-published internal test marks, benchmarks, and class averages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#2E6FB0]" />
            Verified by Academic Registrar
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Test Results Table & Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#13284A] uppercase tracking-wider">
          Course Assessment Scorecards
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#667085]">Loading test evaluations...</div>
        ) : testResults.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Published Marks Yet</p>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              Test marks will appear here once faculty complete evaluations and officially publish the mark sheets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testResults.map((test, idx) => {
              const studentScore = Number(test.studentMarks ?? test.marksObtained ?? 0);
              const maxScore = Number(test.maxMarks) || 25;
              const scorePct = maxScore > 0 ? Math.round((studentScore / maxScore) * 100) : 0;
              const classAvg = test.classAverage !== undefined ? test.classAverage : '-';
              const highMark = test.highestMarks !== undefined ? test.highestMarks : '-';

              return (
                <div
                  key={test.id || test.sheetId || `test-res-${idx}`}
                  className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#13284A]">
                          {test.subjectCode}
                        </span>
                        <h4 className="text-base font-bold text-[#13284A] mt-1.5">{test.testName}</h4>
                        <p className="text-xs text-[#667085]">{test.subjectName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-[#13284A]">
                          {studentScore}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono"> / {maxScore}</span>
                        <div className="text-[11px] font-bold text-emerald-700">{scorePct}% Score</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E0982A] h-full rounded-full"
                        style={{ width: `${Math.min(scorePct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Benchmark Footer */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-[#667085] bg-[#F8FAFC] -mx-5 -mb-5 p-3 rounded-b-xl">
                    <div>
                      <span>Class Average:</span>
                      <p className="font-mono font-bold text-slate-800">
                        {classAvg} / {maxScore}
                      </p>
                    </div>
                    <div>
                      <span>Highest Score:</span>
                      <p className="font-mono font-bold text-slate-800">
                        {highMark} / {maxScore}
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
