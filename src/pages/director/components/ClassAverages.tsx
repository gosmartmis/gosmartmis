interface ClassStat {
  classId: string;
  className: string;
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
  classes: ClassStat[];
  termName: string;
}

function letterGrade(pct: number) {
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function gradeStyle(pct: number) {
  if (pct >= 80) return { ring: 'ring-emerald-400', bg: 'from-emerald-500 to-teal-500',    text: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Excellent'  };
  if (pct >= 70) return { ring: 'ring-teal-400',    bg: 'from-teal-500 to-emerald-500',    text: 'text-teal-600',    bar: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700',       label: 'Good'       };
  if (pct >= 60) return { ring: 'ring-amber-400',   bg: 'from-amber-400 to-orange-400',   text: 'text-amber-600',   bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',     label: 'Average'    };
  if (pct >= 50) return { ring: 'ring-orange-400',  bg: 'from-orange-400 to-red-400',     text: 'text-orange-600',  bar: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700',   label: 'Below Avg'  };
  return           { ring: 'ring-red-400',     bg: 'from-red-500 to-red-600',        text: 'text-red-600',     bar: 'bg-red-500',     badge: 'bg-red-100 text-red-700',         label: 'Needs Help' };
}

export default function ClassAverages({ classes, termName }: Props) {
  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-group-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No class data yet</h3>
        <p className="text-sm text-gray-500">Class averages for {termName} will appear here once marks are submitted.</p>
      </div>
    );
  }

  const sorted = [...classes].sort((a, b) => b.avgPct - a.avgPct);

  return (
    <div className="space-y-6">
      {/* Ranking table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Class Average Ranking</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ranked by average score · {termName}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Students</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Average</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grade Breakdown</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((cls, i) => {
                const s = gradeStyle(cls.avgPct);
                const total = cls.gradeA + cls.gradeB + cls.gradeC + cls.gradeD + cls.gradeF || 1;
                return (
                  <tr key={cls.classId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {i === 0 ? <i className="ri-trophy-fill text-xl text-amber-400"></i>
                        : i === 1 ? <i className="ri-medal-fill text-xl text-gray-400"></i>
                        : i === 2 ? <i className="ri-medal-fill text-xl text-amber-700"></i>
                        : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {letterGrade(cls.avgPct)}
                        </div>
                        <span className="font-semibold text-gray-900">{cls.className}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{cls.studentCount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-lg font-bold ${s.text}`}>{cls.avgPct.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-gray-900">{cls.passRate}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${cls.passRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Stacked mini bar */}
                      <div className="flex h-4 rounded-full overflow-hidden w-32 gap-px">
                        {[
                          { count: cls.gradeA, color: 'bg-emerald-500' },
                          { count: cls.gradeB, color: 'bg-teal-500'    },
                          { count: cls.gradeC, color: 'bg-amber-400'   },
                          { count: cls.gradeD, color: 'bg-orange-400'  },
                          { count: cls.gradeF, color: 'bg-red-500'     },
                        ].map((g, gi) => g.count > 0 && (
                          <div key={gi} className={`${g.color} h-full`} style={{ width: `${(g.count / total) * 100}%` }} title={`${g.count}`} />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        <span>A:{cls.gradeA}</span>
                        <span>B:{cls.gradeB}</span>
                        <span>C:{cls.gradeC}</span>
                        <span>D:{cls.gradeD}</span>
                        <span>F:{cls.gradeF}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.badge}`}>
                        {s.label}
                      </span>
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
