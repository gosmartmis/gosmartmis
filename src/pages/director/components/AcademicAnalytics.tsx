import { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMarks } from '../../../hooks/useMarks';
import { useTerms } from '../../../hooks/useTerms';
import SubjectPassRates from './SubjectPassRates';
import ClassAverages from './ClassAverages';
import TermTrends from './TermTrends';

// ─── Shared types (also exported for sub-components) ─────────────────────────
export interface SubjectStat {
  subjectId: string;
  subjectName: string;
  studentCount: number;
  avgPct: number;
  passRate: number;
  gradeA: number; gradeB: number; gradeC: number; gradeD: number; gradeF: number;
}
export interface ClassStat {
  classId: string;
  className: string;
  studentCount: number;
  avgPct: number;
  passRate: number;
  gradeA: number; gradeB: number; gradeC: number; gradeD: number; gradeF: number;
}
export interface TermStat {
  termId: string;
  termName: string;
  avgPct: number;
  passRate: number;
  totalAssessments: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gradeLabel(pct: number) {
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function computeGrades(pcts: number[]) {
  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  pcts.forEach(p => {
    if      (p >= 80) counts.A++;
    else if (p >= 70) counts.B++;
    else if (p >= 60) counts.C++;
    else if (p >= 50) counts.D++;
    else              counts.F++;
  });
  return counts;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type TabId = 'overview' | 'subjects' | 'classes' | 'trends';

interface Props {
  setActiveTab?: (tab: string) => void;
}

export default function AcademicAnalytics(_props: Props) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { terms, loading: termsLoading } = useTerms(schoolId);
  const { marks, loading: marksLoading } = useMarks({ schoolId });

  const [selectedTermId, setSelectedTermId] = useState<string>('__all__');
  const [view, setView] = useState<TabId>('overview');

  // ── Filter marks by term ────────────────────────────────────────────────────
  const filteredMarks = useMemo(() => {
    const valid = marks.filter(m => m.status !== 'rejected');
    return selectedTermId === '__all__' ? valid : valid.filter(m => m.term_id === selectedTermId);
  }, [marks, selectedTermId]);

  const selectedTermName = useMemo(() => {
    if (selectedTermId === '__all__') return 'All Terms';
    return terms.find(t => t.id === selectedTermId)?.name || 'Selected Term';
  }, [selectedTermId, terms]);

  // ── Compute subject stats ───────────────────────────────────────────────────
  const subjectStats = useMemo((): SubjectStat[] => {
    const map = new Map<string, { name: string; pcts: number[] }>();
    filteredMarks.forEach(m => {
      const pct = Number(m.max_score) > 0 ? (Number(m.score) / Number(m.max_score)) * 100 : 0;
      if (!map.has(m.subject_id)) map.set(m.subject_id, { name: m.subject_name || 'Unknown', pcts: [] });
      map.get(m.subject_id)!.pcts.push(pct);
    });
    return Array.from(map.entries()).map(([subjectId, { name, pcts }]) => {
      const avg    = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      const passed = pcts.filter(p => p >= 50).length;
      const g      = computeGrades(pcts);
      return {
        subjectId, subjectName: name, studentCount: pcts.length,
        avgPct: Math.round(avg * 10) / 10,
        passRate: Math.round((passed / pcts.length) * 100),
        gradeA: g.A, gradeB: g.B, gradeC: g.C, gradeD: g.D, gradeF: g.F,
      };
    });
  }, [filteredMarks]);

  // ── Compute class stats ─────────────────────────────────────────────────────
  const classStats = useMemo((): ClassStat[] => {
    const map = new Map<string, { name: string; pcts: number[] }>();
    filteredMarks.forEach(m => {
      const pct = Number(m.max_score) > 0 ? (Number(m.score) / Number(m.max_score)) * 100 : 0;
      if (!map.has(m.class_id)) map.set(m.class_id, { name: m.class_name || 'Unknown', pcts: [] });
      map.get(m.class_id)!.pcts.push(pct);
    });
    return Array.from(map.entries()).map(([classId, { name, pcts }]) => {
      const avg    = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      const passed = pcts.filter(p => p >= 50).length;
      const g      = computeGrades(pcts);
      return {
        classId, className: name, studentCount: pcts.length,
        avgPct: Math.round(avg * 10) / 10,
        passRate: Math.round((passed / pcts.length) * 100),
        gradeA: g.A, gradeB: g.B, gradeC: g.C, gradeD: g.D, gradeF: g.F,
      };
    });
  }, [filteredMarks]);

  // ── Compute term-level stats (for trends tab, always all terms) ─────────────
  const termStats = useMemo((): TermStat[] => {
    const validMarks = marks.filter(m => m.status !== 'rejected');
    return terms.map(t => {
      const tMarks = validMarks.filter(m => m.term_id === t.id);
      if (tMarks.length === 0) return null;
      const pcts   = tMarks.map(m => Number(m.max_score) > 0 ? (Number(m.score) / Number(m.max_score)) * 100 : 0);
      const avg    = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      const passed = pcts.filter(p => p >= 50).length;
      return {
        termId: t.id, termName: t.name,
        avgPct: Math.round(avg * 10) / 10,
        passRate: Math.round((passed / pcts.length) * 100),
        totalAssessments: tMarks.length,
      };
    }).filter(Boolean) as TermStat[];
  }, [marks, terms]);

  // ── Top-level stats ─────────────────────────────────────────────────────────
  const allPcts = filteredMarks.map(m => Number(m.max_score) > 0 ? (Number(m.score) / Number(m.max_score)) * 100 : 0);
  const schoolAvg  = allPcts.length > 0 ? allPcts.reduce((s, p) => s + p, 0) / allPcts.length : 0;
  const passRate   = allPcts.length > 0 ? (allPcts.filter(p => p >= 50).length / allPcts.length) * 100 : 0;
  const failingSubs = subjectStats.filter(s => s.passRate < 50).length;
  const grades = computeGrades(allPcts);

  // ── Best/worst ──────────────────────────────────────────────────────────────
  const bestSub   = [...subjectStats].sort((a, b) => b.passRate - a.passRate)[0];
  const worstSub  = [...subjectStats].sort((a, b) => a.passRate - b.passRate)[0];
  const bestClass = [...classStats].sort((a, b) => b.avgPct - a.avgPct)[0];
  const worstClass= [...classStats].sort((a, b) => a.avgPct - b.avgPct)[0];

  const isLoading = termsLoading || marksLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-500 mt-4">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Subject pass rates, class averages, and term-over-term trends
          </p>
        </div>
        {/* Term selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <i className="ri-calendar-line text-gray-400"></i>
          <select
            value={selectedTermId}
            onChange={e => setSelectedTermId(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            <option value="__all__">All Terms</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── KPI stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'ri-bar-chart-line', label: 'School Average',
            value: allPcts.length > 0 ? `${schoolAvg.toFixed(1)}%` : '—',
            sub: selectedTermName,
            color: schoolAvg >= 70 ? 'emerald' : schoolAvg >= 50 ? 'amber' : 'red',
          },
          {
            icon: 'ri-user-follow-line', label: 'Pass Rate',
            value: allPcts.length > 0 ? `${passRate.toFixed(1)}%` : '—',
            sub: `${allPcts.filter(p => p >= 50).length} / ${allPcts.length} students`,
            color: passRate >= 70 ? 'emerald' : passRate >= 50 ? 'amber' : 'red',
          },
          {
            icon: 'ri-file-text-line', label: 'Assessments',
            value: filteredMarks.length,
            sub: `${subjectStats.length} subjects · ${classStats.length} classes`,
            color: 'teal',
          },
          {
            icon: 'ri-alert-line', label: 'Failing Subjects',
            value: failingSubs,
            sub: failingSubs === 0 ? 'All subjects passing' : 'Below 50% pass rate',
            color: failingSubs === 0 ? 'emerald' : 'red',
          },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-${c.color}-100 rounded-xl flex items-center justify-center`}>
                <i className={`${c.icon} text-xl text-${c.color}-600`}></i>
              </div>
            </div>
            <p className={`text-3xl font-bold text-${c.color}-600`}>{c.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{c.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {([
          { id: 'overview' as TabId, label: 'Overview',      icon: 'ri-dashboard-line'    },
          { id: 'subjects' as TabId, label: 'By Subject',    icon: 'ri-book-line'          },
          { id: 'classes'  as TabId, label: 'By Class',      icon: 'ri-group-line'         },
          { id: 'trends'   as TabId, label: 'Term Trends',   icon: 'ri-line-chart-line'    },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              view === t.id ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <i className={t.icon}></i>{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ────────────────────────────────────────────── */}
      {view === 'overview' && (
        <div className="space-y-6">
          {allPcts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-pie-chart-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No marks data yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Analytics will populate once teachers submit marks and they are approved.
              </p>
            </div>
          ) : (
            <>
              {/* Grade distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-5">Grade Distribution — {selectedTermName}</h3>
                <div className="space-y-3">
                  {[
                    { label: 'A  (≥80%)', count: grades.A, color: 'bg-emerald-500', text: 'text-emerald-700' },
                    { label: 'B  (70–79%)', count: grades.B, color: 'bg-teal-500',  text: 'text-teal-700'    },
                    { label: 'C  (60–69%)', count: grades.C, color: 'bg-amber-500', text: 'text-amber-700'   },
                    { label: 'D  (50–59%)', count: grades.D, color: 'bg-orange-500',text: 'text-orange-700'  },
                    { label: 'F  (<50%)',   count: grades.F, color: 'bg-red-500',   text: 'text-red-700'     },
                  ].map(g => {
                    const pct = allPcts.length > 0 ? (g.count / allPcts.length) * 100 : 0;
                    return (
                      <div key={g.label} className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">{g.label}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${g.color} rounded-full flex items-center justify-end pr-2 transition-all`} style={{ width: `${pct}%`, minWidth: pct > 0 ? '24px' : '0' }}>
                            {pct >= 5 && <span className="text-white text-xs font-bold">{g.count}</span>}
                          </div>
                        </div>
                        <span className={`text-sm font-bold w-12 text-right flex-shrink-0 ${g.text}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Best/Worst grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subjects */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Subject Highlights</h3>
                  {bestSub && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Best Subject</p>
                      <p className="font-bold text-gray-900">{bestSub.subjectName}</p>
                      <p className="text-sm text-emerald-700 mt-1">{bestSub.passRate}% pass · avg {bestSub.avgPct.toFixed(1)}% · {bestSub.studentCount} students</p>
                    </div>
                  )}
                  {worstSub && worstSub.subjectId !== bestSub?.subjectId && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Needs Attention</p>
                      <p className="font-bold text-gray-900">{worstSub.subjectName}</p>
                      <p className="text-sm text-red-700 mt-1">{worstSub.passRate}% pass · avg {worstSub.avgPct.toFixed(1)}% · {worstSub.studentCount} students</p>
                    </div>
                  )}
                </div>

                {/* Classes */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-gray-900">Class Highlights</h3>
                  {bestClass && (
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">Top Class</p>
                      <p className="font-bold text-gray-900">{bestClass.className}</p>
                      <p className="text-sm text-teal-700 mt-1">Grade {gradeLabel(bestClass.avgPct)} · avg {bestClass.avgPct.toFixed(1)}% · {bestClass.passRate}% pass</p>
                    </div>
                  )}
                  {worstClass && worstClass.classId !== bestClass?.classId && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Needs Support</p>
                      <p className="font-bold text-gray-900">{worstClass.className}</p>
                      <p className="text-sm text-amber-700 mt-1">Grade {gradeLabel(worstClass.avgPct)} · avg {worstClass.avgPct.toFixed(1)}% · {worstClass.passRate}% pass</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Subject tab ──────────────────────────────────────────────── */}
      {view === 'subjects' && (
        <SubjectPassRates subjects={subjectStats} termName={selectedTermName} />
      )}

      {/* ── Class tab ────────────────────────────────────────────────── */}
      {view === 'classes' && (
        <ClassAverages classes={classStats} termName={selectedTermName} />
      )}

      {/* ── Trends tab ───────────────────────────────────────────────── */}
      {view === 'trends' && (
        <TermTrends terms={termStats} />
      )}

    </div>
  );
}
