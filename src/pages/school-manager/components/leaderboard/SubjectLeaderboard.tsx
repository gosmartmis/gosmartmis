import type { SubjectLeader } from '../../../../hooks/useTopStudents';

interface Props {
  subjectTops: Record<string, SubjectLeader[]>;
  termName: string;
}

const SUBJECT_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-indigo-600',
  'from-cyan-500 to-teal-600',
  'from-green-500 to-emerald-600',
];

const RANK_ICONS = ['ri-trophy-fill text-amber-500', 'ri-medal-fill text-gray-400', 'ri-medal-fill text-orange-600'];

export default function SubjectLeaderboard({ subjectTops, termName }: Props) {
  const subjectNames = Object.keys(subjectTops).sort();

  if (subjectNames.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-book-open-line text-3xl text-emerald-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No subject data yet</h3>
        <p className="text-sm text-gray-500">Subject rankings will appear once marks are approved for {termName}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {subjectNames.map((subName, si) => {
        const students = subjectTops[subName];
        const topScore = students[0]?.score ?? 0;
        const colorClass = SUBJECT_COLORS[si % SUBJECT_COLORS.length];
        return (
          <div key={subName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Subject header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                  <i className="ri-book-line text-lg"></i>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{subName}</p>
                  <p className="text-xs text-gray-500">Top {students.length} scorers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">{topScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">Highest score</p>
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
                  <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  {/* Name + class */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{student.studentName}</p>
                    <p className="text-xs text-gray-400">{student.className} · {student.studentCode}</p>
                  </div>
                  {/* Raw score + percentage */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${student.score >= 80 ? 'text-emerald-600' : student.score >= 60 ? 'text-teal-600' : student.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {student.score.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">{student.rawScore}/{student.maxScore}</p>
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
