import type { StudentRanking } from '../../../../hooks/useTopStudents';

interface Props {
  classTops: Record<string, StudentRanking[]>;
  termName: string;
}

const RANK_ICONS = ['ri-trophy-fill text-amber-500', 'ri-medal-fill text-gray-400', 'ri-medal-fill text-orange-600'];

function barColor(avg: number) {
  if (avg >= 80) return 'bg-emerald-500';
  if (avg >= 70) return 'bg-teal-500';
  if (avg >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ClassLeaderboard({ classTops, termName }: Props) {
  const classNames = Object.keys(classTops).sort();

  if (classNames.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-group-line text-3xl text-teal-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No class data yet</h3>
        <p className="text-sm text-gray-500">Class rankings will appear once marks are approved for {termName}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {classNames.map(className => {
        const students = classTops[className];
        const topAvg = students[0]?.averageScore ?? 0;
        return (
          <div key={className} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Class header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {className.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{className}</p>
                  <p className="text-xs text-gray-500">Top {students.length} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-teal-600">{topAvg.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">Class best</p>
              </div>
            </div>

            {/* Student rows */}
            <div className="divide-y divide-gray-50">
              {students.map(student => (
                <div key={student.studentId} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  {/* Rank */}
                  <div className="w-7 flex-shrink-0 flex items-center justify-center">
                    {student.rank <= 3 ? (
                      <i className={`${RANK_ICONS[student.rank - 1]} text-lg`}></i>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{student.rank}</span>
                    )}
                  </div>
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{student.studentName}</p>
                    <p className="text-xs text-gray-400">{student.studentCode}</p>
                  </div>
                  {/* Score */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                      <div className={`h-full rounded-full ${barColor(student.averageScore)}`} style={{ width: `${student.averageScore}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${student.averageScore >= 70 ? 'text-emerald-600' : student.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {student.averageScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
