import type { TermTrendPoint, MostImproved, StudentTermRow } from '../../../../hooks/useTopStudents';

interface Props {
  termTrends: TermTrendPoint[];
  mostImproved: MostImproved[];
  studentTermMatrix: StudentTermRow[];
}

function trendColor(avg: number) {
  if (avg >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (avg >= 70) return { bar: 'bg-teal-500',    text: 'text-teal-600'    };
  if (avg >= 60) return { bar: 'bg-amber-500',   text: 'text-amber-600'   };
  return           { bar: 'bg-red-500',     text: 'text-red-600'     };
}

function matrixCellColor(avg: number | null) {
  if (avg === null) return 'bg-gray-50 text-gray-300';
  if (avg >= 80) return 'bg-emerald-50 text-emerald-700 font-bold';
  if (avg >= 70) return 'bg-teal-50 text-teal-700 font-semibold';
  if (avg >= 60) return 'bg-amber-50 text-amber-700';
  if (avg >= 50) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}

function TrendBadge({ trend }: { trend: StudentTermRow['trend'] }) {
  if (trend === 'improving')   return <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><i className="ri-arrow-up-line"></i>Improving</span>;
  if (trend === 'declining')   return <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><i className="ri-arrow-down-line"></i>Declining</span>;
  if (trend === 'stable')      return <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><i className="ri-subtract-line"></i>Stable</span>;
  return <span className="text-xs text-gray-400">—</span>;
}

export default function TermImprovementChart({ termTrends, mostImproved, studentTermMatrix }: Props) {
  const maxAvg = Math.max(...termTrends.map(t => t.avgScore), 1);

  if (termTrends.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-line-chart-line text-3xl text-teal-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No trend data yet</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Term trends appear once approved marks exist for at least one term.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── 1. School performance per term ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900">School Average — Term by Term</h3>
            <p className="text-xs text-gray-500 mt-0.5">Based on all approved marks across all students</p>
          </div>
        </div>

        <div className="space-y-5">
          {termTrends.map((term, i) => {
            const c = trendColor(term.avgScore);
            const barW = (term.avgScore / Math.max(maxAvg, 100)) * 100;
            return (
              <div key={term.termId}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${c.bar}`}>
                      {i + 1}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{term.termName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {term.delta !== null && (
                      <span className={`flex items-center gap-1 font-semibold text-xs ${term.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        <i className={term.delta >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                        {Math.abs(term.delta).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{term.totalStudents} students · {term.totalMarks} marks</span>
                    <span className={`text-base font-bold ${c.text}`}>{term.avgScore.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${barW}%` }} />
                </div>

                {/* Pass rate */}
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Pass rate: <span className="font-semibold text-gray-600">{term.passRate}%</span></span>
                  <span className={term.delta !== null && term.delta >= 0 ? 'text-emerald-600' : term.delta !== null ? 'text-red-600' : 'text-gray-400'}>
                    {term.delta !== null
                      ? (term.delta >= 0 ? `↑ Up ${term.delta.toFixed(1)}% from previous term` : `↓ Down ${Math.abs(term.delta).toFixed(1)}% from previous term`)
                      : 'First term on record'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        {termTrends.length > 1 && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Term</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {termTrends.map((term, i) => (
                  <tr key={term.termId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-semibold">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{term.termName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${trendColor(term.avgScore).text}`}>{term.avgScore.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{term.passRate}%</td>
                    <td className="px-4 py-3 text-center text-gray-500">{term.totalStudents}</td>
                    <td className="px-4 py-3 text-center">
                      {term.delta === null ? (
                        <span className="text-xs text-gray-400">baseline</span>
                      ) : (
                        <span className={`flex items-center justify-center gap-1 font-bold ${term.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          <i className={term.delta >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                          {Math.abs(term.delta).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. Most improved students ──────────────────────────────── */}
      {mostImproved.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Most Improved Students</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparing <span className="font-semibold">{mostImproved[0]?.previousTermName}</span> → <span className="font-semibold">{mostImproved[0]?.currentTermName}</span>
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {mostImproved.map((student, i) => {
              const isImproved = student.improvement > 0;
              const isDeclined = student.improvement < 0;
              return (
                <div key={student.studentId} className={`px-6 py-4 flex items-center gap-4 ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                  {/* Medal */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100' : i === 1 ? 'bg-gray-100' : i === 2 ? 'bg-orange-100' : 'bg-teal-50'
                  }`}>
                    {i < 3 ? (
                      <i className={`${['ri-trophy-fill text-amber-500', 'ri-medal-fill text-gray-400', 'ri-medal-fill text-orange-600'][i]} text-lg`}></i>
                    ) : (
                      <span className="text-sm font-bold text-teal-600">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{student.studentName}</p>
                    <p className="text-xs text-gray-500">{student.className} · {student.studentCode}</p>
                  </div>

                  {/* Score journey */}
                  <div className="flex items-center gap-2 text-sm flex-shrink-0">
                    <span className="text-gray-500">{student.previousScore.toFixed(1)}%</span>
                    <i className="ri-arrow-right-line text-gray-400"></i>
                    <span className="font-bold text-gray-900">{student.currentScore.toFixed(1)}%</span>
                  </div>

                  {/* Improvement badge */}
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold flex-shrink-0 ${
                    isImproved ? 'bg-emerald-100 text-emerald-700' : isDeclined ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <i className={isImproved ? 'ri-arrow-up-line' : isDeclined ? 'ri-arrow-down-line' : 'ri-subtract-line'}></i>
                    {Math.abs(student.improvement).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. Student score matrix ────────────────────────────────── */}
      {studentTermMatrix.length > 0 && termTrends.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Top Students — Score Progression</h3>
            <p className="text-xs text-gray-500 mt-0.5">Average score per term for the top 10 students by overall performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">Student</th>
                  {studentTermMatrix[0]?.termScores.map(ts => (
                    <th key={ts.termId} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap min-w-[90px]">
                      {ts.termName}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Overall</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentTermMatrix.map((student, i) => (
                  <tr key={student.studentId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-teal-500'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{student.studentName}</p>
                          <p className="text-xs text-gray-400">{student.className}</p>
                        </div>
                      </div>
                    </td>
                    {student.termScores.map(ts => (
                      <td key={ts.termId} className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs min-w-[52px] ${matrixCellColor(ts.avg)}`}>
                          {ts.avg !== null ? `${ts.avg.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${student.overallAvg >= 70 ? 'text-emerald-600' : student.overallAvg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {student.overallAvg.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TrendBadge trend={student.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
