interface TermStat {
  termId: string;
  termName: string;
  avgPct: number;
  passRate: number;
  totalAssessments: number;
  startDate?: string;
}

interface Props {
  terms: TermStat[];
}

export default function TermTrends({ terms }: Props) {
  if (terms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-line-chart-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No trend data yet</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Term trends appear once marks have been submitted for at least one term.
        </p>
      </div>
    );
  }

  const maxAvg = Math.max(...terms.map(t => t.avgPct), 1);

  return (
    <div className="space-y-6">
      {/* Visual timeline bars */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-6">Average Score Per Term</h3>
        <div className="space-y-5">
          {terms.map((term, i) => {
            const prev = terms[i - 1];
            const delta = prev ? term.avgPct - prev.avgPct : null;
            const barPct = (term.avgPct / Math.max(maxAvg, 100)) * 100;
            const barColor = term.avgPct >= 70 ? 'bg-emerald-500' : term.avgPct >= 60 ? 'bg-teal-500' : term.avgPct >= 50 ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={term.termId}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      term.avgPct >= 70 ? 'bg-emerald-500' : term.avgPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}>{i + 1}</div>
                    <span className="font-semibold text-gray-900 text-sm">{term.termName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {delta !== null && (
                      <span className={`flex items-center gap-1 font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        <i className={delta >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                        {Math.abs(delta).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">{term.totalAssessments} assessments</span>
                    <span className="font-bold text-gray-900">{term.avgPct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Pass rate: <span className="font-semibold text-gray-600">{term.passRate}%</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Term-by-Term Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Term</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Assessments</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {terms.map((term, i) => {
                const prev = terms[i - 1];
                const delta = prev ? term.avgPct - prev.avgPct : null;
                return (
                  <tr key={term.termId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-400 font-semibold">{i + 1}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900 text-sm">{term.termName}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-base font-bold ${term.avgPct >= 70 ? 'text-emerald-600' : term.avgPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {term.avgPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">{term.passRate}%</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-500">{term.totalAssessments}</td>
                    <td className="px-6 py-3 text-center">
                      {delta === null ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-sm font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          <i className={delta >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                          {Math.abs(delta).toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
