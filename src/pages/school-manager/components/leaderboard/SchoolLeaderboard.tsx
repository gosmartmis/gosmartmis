import type { StudentRanking } from '../../../../hooks/useTopStudents';

interface Props {
  students: StudentRanking[];
  totalRanked: number;
  totalMarks: number;
  termName: string;
}

function rankStyle(rank: number) {
  if (rank === 1) return { ring: 'ring-amber-400 bg-gradient-to-br from-amber-400 to-yellow-500', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: 'ri-trophy-fill' };
  if (rank === 2) return { ring: 'ring-gray-400 bg-gradient-to-br from-gray-400 to-slate-500',   text: 'text-gray-600',  badge: 'bg-gray-100 text-gray-700',   icon: 'ri-medal-fill'   };
  if (rank === 3) return { ring: 'ring-orange-400 bg-gradient-to-br from-orange-500 to-red-400', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', icon: 'ri-medal-fill'  };
  return { ring: '', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-700', icon: '' };
}

function scoreBg(avg: number) {
  if (avg >= 80) return 'bg-emerald-500';
  if (avg >= 70) return 'bg-teal-500';
  if (avg >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function badgeLabel(rank: number) {
  if (rank === 1) return 'Excellence Award';
  if (rank === 2) return 'Silver Achievement';
  if (rank === 3) return 'Bronze Achievement';
  if (rank <= 5) return 'High Achiever';
  return 'Top 10';
}

export default function SchoolLeaderboard({ students, totalRanked, totalMarks, termName }: Props) {
  const top3  = students.slice(0, 3);
  const rest  = students.slice(3);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-trophy-line text-3xl text-amber-400"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No rankings yet</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Rankings appear once approved marks exist for {termName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-1">School-Wide Leaderboard</h3>
            <p className="text-teal-100 text-sm">Ranked by average score across all approved marks — {termName}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold">{totalRanked}</p>
              <p className="text-xs text-teal-100">Students ranked</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold">{totalMarks}</p>
              <p className="text-xs text-teal-100">Marks analysed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Reorder: 2nd, 1st, 3rd for podium effect */}
          {[top3[1], top3[0], top3[2]].map((student, i) => {
            if (!student) return null;
            const podiumRank = [2, 1, 3][i];
            const s = rankStyle(podiumRank);
            return (
              <div
                key={student.studentId}
                className={`bg-white rounded-2xl border-2 p-6 text-center flex flex-col items-center gap-3 ${
                  podiumRank === 1 ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'
                }`}
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full ring-4 ${s.ring} flex items-center justify-center text-white font-bold text-xl`}>
                  {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  podiumRank === 1 ? 'bg-amber-500' : podiumRank === 2 ? 'bg-gray-500' : 'bg-orange-600'
                }`}>
                  {podiumRank}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{student.studentName}</p>
                  <p className="text-xs text-gray-500">{student.studentCode} · {student.className}</p>
                </div>
                <p className={`text-2xl font-bold ${s.text}`}>{student.averageScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{student.subjectCount} subjects · {student.passCount} passed</p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
                  {podiumRank === 1 && <i className="ri-trophy-fill mr-1"></i>}
                  {badgeLabel(podiumRank)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Ranks 4–10 */}
      {rest.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-900">Ranks 4 – 10</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {rest.map(student => (
              <div key={student.studentId} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Rank circle */}
                <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">{student.rank}</span>
                </div>
                {/* Avatar */}
                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{student.studentName}</p>
                  <p className="text-xs text-gray-500">{student.studentCode} · {student.className}</p>
                </div>
                {/* Score bar */}
                <div className="w-32 hidden sm:block">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(student.averageScore)}`} style={{ width: `${student.averageScore}%` }} />
                  </div>
                </div>
                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-base font-bold ${student.averageScore >= 70 ? 'text-emerald-600' : student.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {student.averageScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">{student.subjectCount} subs</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap hidden md:block ${rankStyle(student.rank).badge}`}>
                  {badgeLabel(student.rank)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
