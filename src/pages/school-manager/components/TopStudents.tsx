import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTopStudents } from '../../../hooks/useTopStudents';
import SchoolLeaderboard from './leaderboard/SchoolLeaderboard';
import ClassLeaderboard from './leaderboard/ClassLeaderboard';
import SubjectLeaderboard from './leaderboard/SubjectLeaderboard';
import TermImprovementChart from './leaderboard/TermImprovementChart';

type ViewTab = 'school' | 'class' | 'subject' | 'trends';

const TABS: { id: ViewTab; label: string; icon: string }[] = [
  { id: 'school',  label: 'School Top 10', icon: 'ri-trophy-line'        },
  { id: 'class',   label: 'By Class',      icon: 'ri-group-line'         },
  { id: 'subject', label: 'By Subject',    icon: 'ri-book-open-line'     },
  { id: 'trends',  label: 'Term Trends',   icon: 'ri-line-chart-line'    },
];

export default function TopStudents() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const {
    data,
    loading,
    error,
    refetch,
    terms,
    termsLoading,
    selectedTermId,
    setSelectedTermId,
  } = useTopStudents(schoolId);

  const [view, setView] = useState<ViewTab>('school');

  const selectedTermName =
    selectedTermId === '__all__'
      ? 'All Terms'
      : terms.find(t => t.id === selectedTermId)?.name ?? 'Selected Term';

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Computing student rankings…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
          <i className="ri-error-warning-line text-3xl text-red-500"></i>
          <div className="flex-1">
            <p className="font-semibold text-red-800">Failed to load leaderboard</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Top Students Leaderboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Recognising academic excellence — ranked from approved marks only
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Term filter — hidden on trends tab (trends always use all terms) */}
          {view !== 'trends' && (
            <div className="flex items-center gap-2">
              <i className="ri-calendar-line text-gray-400 text-sm"></i>
              <select
                value={selectedTermId}
                onChange={e => setSelectedTermId(e.target.value)}
                disabled={termsLoading}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
              >
                <option value="__all__">All Terms</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {view === 'trends' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl">
              <i className="ri-information-line text-teal-500 text-sm"></i>
              <span className="text-xs text-teal-700 font-medium">All terms · auto</span>
            </div>
          )}
          {/* Refresh */}
          <button
            onClick={refetch}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary KPI strip ────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Students Ranked',   value: data.totalStudentsRanked, icon: 'ri-user-star-line',       color: 'teal'    },
            { label: 'Marks Analysed',    value: data.totalMarksAnalysed,  icon: 'ri-file-list-line',       color: 'emerald' },
            { label: 'Classes Competing', value: Object.keys(data.classTops).length,   icon: 'ri-group-line',           color: 'amber'   },
            { label: 'Subjects Covered',  value: Object.keys(data.subjectTops).length, icon: 'ri-book-open-line',       color: 'orange'  },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-9 h-9 bg-${c.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                <i className={`${c.icon} text-lg text-${c.color}-600`}></i>
              </div>
              <p className={`text-2xl font-bold text-${c.color}-600`}>{c.value}</p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              view === t.id ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <i className={t.icon}></i>
            {t.label}
            {t.id === 'school' && data && data.schoolTop.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                {data.schoolTop.length}
              </span>
            )}
            {t.id === 'trends' && data && data.termTrends.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                {data.termTrends.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {data && view === 'school' && (
        <SchoolLeaderboard
          students={data.schoolTop}
          totalRanked={data.totalStudentsRanked}
          totalMarks={data.totalMarksAnalysed}
          termName={selectedTermName}
        />
      )}
      {data && view === 'class' && (
        <ClassLeaderboard classTops={data.classTops} termName={selectedTermName} />
      )}
      {data && view === 'subject' && (
        <SubjectLeaderboard subjectTops={data.subjectTops} termName={selectedTermName} />
      )}
      {data && view === 'trends' && (
        <TermImprovementChart
          termTrends={data.termTrends}
          mostImproved={data.mostImproved}
          studentTermMatrix={data.studentTermMatrix}
        />
      )}

      {/* No data at all */}
      {data &&
        data.totalStudentsRanked === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-trophy-line text-3xl text-teal-400"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nothing to rank yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            The leaderboard will populate once teachers submit marks and they are approved for {selectedTermName}.
          </p>
        </div>
      )}
    </div>
  );
}
