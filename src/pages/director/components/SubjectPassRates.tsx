interface SubjectStat {
  subjectId: string;
  subjectName: string;
  studentCount: number;
  avgPct: number;
  passRate: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
  gradeF: number;
}

interface Props {
  subjects: SubjectStat[];
  termName: string;
}

function gradeColor(pct: number) {
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'Excellent' };
  if (pct >= 70) return { bar: 'bg-teal-500',    text: 'text-teal-700',    badge: 'bg-teal-100 text-teal-700',    label: 'Good'      };
  if (pct >= 60) return { bar: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   label: 'Average'   };
  if (pct >= 50) return { bar: 'bg-orange-500',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700', label: 'Below Avg' };
  return           { bar: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',     label: 'Needs Help' };
}

export default function SubjectPassRates({ subjects, termName }: Props) {
  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-bar-chart-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No subject data yet</h3>
        <p className="text-sm text-gray-500">Marks for {termName} will appear here once teachers submit them.</p>
      </div>
    );
  }

  const sorted = [...subjects].sort((a, b) => b.passRate - a.passRate);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="space-y-6">
      {/* Top/Bottom callout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-trophy-line text-emerald-600 text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Top Subject</p>
            <p className="font-bold text-gray-900">{best.subjectName}</p>
            <p className="text-xs text-emerald-700">{best.passRate}% pass rate · avg {best.avgPct.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-alert-line text-red-600 text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Needs Attention</p>
            <p className="font-bold text-gray-900">{worst.subjectName}</p>
            <p className="text-xs text-red-700">{worst.passRate}% pass rate · avg {worst.avgPct.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Subject bars */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Pass Rate by Subject</h3>
          <p className="text-xs text-gray-500 mt-0.5">Sorted highest → lowest · pass threshold: 50%</p>
        </div>
        <div className="divide-y divide-gray-50">
          {sorted.map((sub, i) => {
            const c = gradeColor(sub.avgPct);
            return (
              <div key={sub.subjectId} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">{i + 1}</span>

                  {/* Subject info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm truncate">{sub.subjectName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${c.badge}`}>{c.label}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-xs text-gray-500">
                        <span>{sub.studentCount} students</span>
                        <span className={`font-bold text-sm ${c.text}`}>{sub.passRate}% pass</span>
                        <span className="font-bold text-sm text-gray-700">avg {sub.avgPct.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Pass rate bar */}
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${sub.passRate}%` }} />
                      {/* 50% threshold line */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60" style={{ left: '50%' }} />
                    </div>

                    {/* Grade mini-breakdown */}
                    <div className="flex items-center gap-3 mt-2">
                      {[
                        { label: 'A', count: sub.gradeA, color: 'text-emerald-600' },
                        { label: 'B', count: sub.gradeB, color: 'text-teal-600'    },
                        { label: 'C', count: sub.gradeC, color: 'text-amber-600'   },
                        { label: 'D', count: sub.gradeD, color: 'text-orange-600'  },
                        { label: 'F', count: sub.gradeF, color: 'text-red-600'     },
                      ].map(g => (
                        <span key={g.label} className={`text-xs font-medium ${g.color}`}>
                          {g.label}: {g.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
