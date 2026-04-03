import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTerms } from './useTerms';

// ─── Public types ──────────────────────────────────────────────────────────

export interface StudentRanking {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  averageScore: number;
  subjectCount: number;
  rank: number;
  passCount: number;
  failCount: number;
}

export interface SubjectLeader {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  score: number;
  rawScore: number;
  maxScore: number;
  rank: number;
}

export interface TermTrendPoint {
  termId: string;
  termName: string;
  avgScore: number;
  passRate: number;
  totalStudents: number;
  totalMarks: number;
  delta: number | null;   // change vs previous term (null for first)
}

export interface MostImproved {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  previousScore: number;
  currentScore: number;
  improvement: number;
  previousTermName: string;
  currentTermName: string;
}

export interface StudentTermRow {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  termScores: Array<{ termId: string; termName: string; avg: number | null }>;
  overallAvg: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient';
}

export interface TopStudentsData {
  // filtered by selectedTermId
  schoolTop: StudentRanking[];
  classTops: Record<string, StudentRanking[]>;
  subjectTops: Record<string, SubjectLeader[]>;
  totalStudentsRanked: number;
  totalMarksAnalysed: number;
  // always all-terms
  termTrends: TermTrendPoint[];
  mostImproved: MostImproved[];
  studentTermMatrix: StudentTermRow[];
}

interface UseTopStudentsReturn {
  data: TopStudentsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  terms: { id: string; name: string }[];
  termsLoading: boolean;
  selectedTermId: string;
  setSelectedTermId: (id: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function pct(score: number, max: number): number {
  return max > 0 ? (score / max) * 100 : 0;
}

type RawMark = {
  student_id: string;
  term_id: string;
  score: number;
  max_score: number;
  students: { full_name: string; student_id: string } | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
};

type StudentAgg = {
  name: string; code: string; className: string;
  totalPct: number; count: number; pass: number; fail: number;
};

function buildRankings(marks: RawMark[]): {
  schoolTop: StudentRanking[];
  classTops: Record<string, StudentRanking[]>;
  subjectTops: Record<string, SubjectLeader[]>;
  totalStudentsRanked: number;
  totalMarksAnalysed: number;
} {
  const studentMap = new Map<string, StudentAgg>();
  const classMap   = new Map<string, Map<string, StudentAgg>>();
  type SubjectEntry = { studentId: string; name: string; code: string; className: string; pctScore: number; raw: number; max: number };
  const subjectMap = new Map<string, SubjectEntry[]>();

  marks.forEach(m => {
    const sid    = m.student_id;
    const p      = pct(Number(m.score) || 0, Number(m.max_score) || 100);
    const passed = p >= 50;
    const sName  = m.students?.full_name  || 'Unknown';
    const sCode  = m.students?.student_id || '—';
    const cName  = m.classes?.name  || 'Unknown';
    const subName= m.subjects?.name || 'Unknown';

    // school-wide
    if (!studentMap.has(sid)) studentMap.set(sid, { name: sName, code: sCode, className: cName, totalPct: 0, count: 0, pass: 0, fail: 0 });
    const sa = studentMap.get(sid)!;
    sa.totalPct += p; sa.count++; passed ? sa.pass++ : sa.fail++;

    // per-class
    if (!classMap.has(cName)) classMap.set(cName, new Map());
    const cls = classMap.get(cName)!;
    if (!cls.has(sid)) cls.set(sid, { name: sName, code: sCode, className: cName, totalPct: 0, count: 0, pass: 0, fail: 0 });
    const ca = cls.get(sid)!;
    ca.totalPct += p; ca.count++; passed ? ca.pass++ : ca.fail++;

    // per-subject
    if (!subjectMap.has(subName)) subjectMap.set(subName, []);
    subjectMap.get(subName)!.push({ studentId: sid, name: sName, code: sCode, className: cName, pctScore: p, raw: Number(m.score) || 0, max: Number(m.max_score) || 100 });
  });

  const toRanking = (map: Map<string, StudentAgg>): StudentRanking[] =>
    Array.from(map.entries())
      .map(([sid, a]) => ({
        studentId: sid, studentName: a.name, studentCode: a.code, className: a.className,
        averageScore: Math.round((a.totalPct / a.count) * 10) / 10,
        subjectCount: a.count, passCount: a.pass, failCount: a.fail, rank: 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((s, i) => ({ ...s, rank: i + 1 }));

  const schoolTop = toRanking(studentMap).slice(0, 10);

  const classTops: Record<string, StudentRanking[]> = {};
  classMap.forEach((m, cn) => { classTops[cn] = toRanking(m).slice(0, 5); });

  const subjectTops: Record<string, SubjectLeader[]> = {};
  subjectMap.forEach((entries, sub) => {
    const best = new Map<string, SubjectEntry>();
    entries.forEach(e => { const ex = best.get(e.studentId); if (!ex || e.pctScore > ex.pctScore) best.set(e.studentId, e); });
    subjectTops[sub] = Array.from(best.values())
      .sort((a, b) => b.pctScore - a.pctScore)
      .slice(0, 5)
      .map((e, i) => ({ studentId: e.studentId, studentName: e.name, studentCode: e.code, className: e.className, score: Math.round(e.pctScore * 10) / 10, rawScore: e.raw, maxScore: e.max, rank: i + 1 }));
  });

  return { schoolTop, classTops, subjectTops, totalStudentsRanked: studentMap.size, totalMarksAnalysed: marks.length };
}

function buildTrends(
  allMarks: RawMark[],
  terms: { id: string; name: string }[],
): {
  termTrends: TermTrendPoint[];
  mostImproved: MostImproved[];
  studentTermMatrix: StudentTermRow[];
} {
  // ── Per-term stats ────────────────────────────────────────────────────
  const termTrends: TermTrendPoint[] = [];
  let prevAvg: number | null = null;

  for (const term of terms) {
    const tMarks = allMarks.filter(m => m.term_id === term.id);
    if (tMarks.length === 0) continue;

    const pcts = tMarks.map(m => pct(Number(m.score) || 0, Number(m.max_score) || 100));
    const avg  = pcts.reduce((s, p) => s + p, 0) / pcts.length;
    const pass = pcts.filter(p => p >= 50).length;
    const uniqueStudents = new Set(tMarks.map(m => m.student_id)).size;

    const delta = prevAvg !== null ? Math.round((avg - prevAvg) * 10) / 10 : null;
    prevAvg = avg;

    termTrends.push({
      termId: term.id,
      termName: term.name,
      avgScore: Math.round(avg * 10) / 10,
      passRate: Math.round((pass / pcts.length) * 100),
      totalStudents: uniqueStudents,
      totalMarks: tMarks.length,
      delta,
    });
  }

  // ── Per-student per-term averages ─────────────────────────────────────
  // Map: studentId → termId → { totalPct, count, name, code, class }
  type TermAgg = { totalPct: number; count: number };
  type StudentTermAgg = {
    name: string; code: string; className: string;
    byTerm: Map<string, TermAgg>;
    overallPct: number; overallCount: number;
  };

  const studentTermMap = new Map<string, StudentTermAgg>();

  allMarks.forEach(m => {
    const sid = m.student_id;
    if (!studentTermMap.has(sid)) {
      studentTermMap.set(sid, {
        name: m.students?.full_name || 'Unknown',
        code: m.students?.student_id || '—',
        className: m.classes?.name || '—',
        byTerm: new Map(),
        overallPct: 0, overallCount: 0,
      });
    }
    const sta = studentTermMap.get(sid)!;
    const p = pct(Number(m.score) || 0, Number(m.max_score) || 100);
    sta.overallPct += p; sta.overallCount++;
    if (!sta.byTerm.has(m.term_id)) sta.byTerm.set(m.term_id, { totalPct: 0, count: 0 });
    const ta = sta.byTerm.get(m.term_id)!;
    ta.totalPct += p; ta.count++;
  });

  // ── Most improved (last two terms with data) ──────────────────────────
  const termsWithData = termTrends.map(t => t.termId);
  const mostImproved: MostImproved[] = [];

  if (termsWithData.length >= 2) {
    const prevTermId = termsWithData[termsWithData.length - 2];
    const currTermId = termsWithData[termsWithData.length - 1];
    const prevTermName = termTrends.find(t => t.termId === prevTermId)?.termName ?? '—';
    const currTermName = termTrends.find(t => t.termId === currTermId)?.termName ?? '—';

    const improved: MostImproved[] = [];
    studentTermMap.forEach((sta, sid) => {
      const prevAgg = sta.byTerm.get(prevTermId);
      const currAgg = sta.byTerm.get(currTermId);
      if (!prevAgg || !currAgg) return;
      const prevScore = Math.round((prevAgg.totalPct / prevAgg.count) * 10) / 10;
      const currScore = Math.round((currAgg.totalPct / currAgg.count) * 10) / 10;
      const improvement = Math.round((currScore - prevScore) * 10) / 10;
      improved.push({ studentId: sid, studentName: sta.name, studentCode: sta.code, className: sta.className, previousScore: prevScore, currentScore: currScore, improvement, previousTermName: prevTermName, currentTermName: currTermName });
    });

    improved
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5)
      .forEach(s => mostImproved.push(s));
  }

  // ── Student term matrix (top 10 by overall avg) ───────────────────────
  const termOrder = terms.map(t => ({ id: t.id, name: t.name }));

  const studentTermMatrix: StudentTermRow[] = Array.from(studentTermMap.entries())
    .map(([sid, sta]) => {
      const overallAvg = sta.overallCount > 0 ? Math.round((sta.overallPct / sta.overallCount) * 10) / 10 : 0;
      const termScores = termOrder.map(t => {
        const agg = sta.byTerm.get(t.id);
        return { termId: t.id, termName: t.name, avg: agg ? Math.round((agg.totalPct / agg.count) * 10) / 10 : null };
      }).filter(ts => ts.avg !== null || termOrder.length <= 4); // skip empty terms unless few terms

      // Trend: compare first and last term with data
      const withData = termScores.filter(ts => ts.avg !== null);
      let trend: StudentTermRow['trend'] = 'insufficient';
      if (withData.length >= 2) {
        const first = withData[0].avg!;
        const last  = withData[withData.length - 1].avg!;
        const diff  = last - first;
        trend = diff >= 3 ? 'improving' : diff <= -3 ? 'declining' : 'stable';
      }

      return { studentId: sid, studentName: sta.name, studentCode: sta.code, className: sta.className, termScores, overallAvg, trend };
    })
    .sort((a, b) => b.overallAvg - a.overallAvg)
    .slice(0, 10);

  return { termTrends, mostImproved, studentTermMatrix };
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useTopStudents(schoolId: string | null): UseTopStudentsReturn {
  const { terms, loading: termsLoading } = useTerms(schoolId);
  const [selectedTermId, setSelectedTermId] = useState<string>('__all__');
  const [data, setData] = useState<TopStudentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Always fetch ALL approved marks (we filter client-side)
        const { data: rows, error: fetchError } = await supabase
          .from('marks')
          .select(`
            student_id,
            term_id,
            score,
            max_score,
            students:student_id (full_name, student_id),
            subjects:subject_id (name),
            classes:class_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('status', 'approved');

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const allMarks = (rows || []) as RawMark[];

        // Client-side filter for selected term
        const filteredMarks = selectedTermId === '__all__'
          ? allMarks
          : allMarks.filter(m => m.term_id === selectedTermId);

        const { schoolTop, classTops, subjectTops, totalStudentsRanked, totalMarksAnalysed } = buildRankings(filteredMarks);
        const { termTrends, mostImproved, studentTermMatrix } = buildTrends(allMarks, terms);

        setData({ schoolTop, classTops, subjectTops, totalStudentsRanked, totalMarksAnalysed, termTrends, mostImproved, studentTermMatrix });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [schoolId, selectedTermId, tick, terms]);

  return { data, loading, error, refetch, terms, termsLoading, selectedTermId, setSelectedTermId };
}
