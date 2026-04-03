import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ReportCardStudent {
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  averageScore: number;
  classRank: number;
  totalStudents: number;
  isFinalized: boolean;
  marksApproved: boolean;
  feesBalance: number;
  generatedAt: string | null;
}

export interface ReportCardClassSummary {
  classId: string;
  className: string;
  totalStudents: number;
  generated: number;
  approved: number;
  locked: number;
}

export interface ReportCardStats {
  totalGenerated: number;
  pendingApprovals: number;
  lockedDueToFees: number;
  fullyPaid: number;
}

export function useReportCardControl(selectedTermId?: string) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id || null;

  const [students, setStudents] = useState<ReportCardStudent[]>([]);
  const [classSummaries, setClassSummaries] = useState<ReportCardClassSummary[]>([]);
  const [stats, setStats] = useState<ReportCardStats>({
    totalGenerated: 0,
    pendingApprovals: 0,
    lockedDueToFees: 0,
    fullyPaid: 0,
  });
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch terms
      const { data: termsData } = await supabase
        .from('terms')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      const termsList = termsData || [];
      setTerms(termsList);

      const activeTerm = selectedTermId || termsList[0]?.id;
      if (!activeTerm) {
        setLoading(false);
        return;
      }

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name');

      setClasses((classesData || []).map(c => ({ id: c.id, name: c.name })));

      // Fetch all active students with class info
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, student_id, full_name, class_id, classes ( id, name )')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;
      if (!studentsData || studentsData.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = studentsData.map(s => s.id);

      // Fetch report cards for this term
      const { data: reportCardsData } = await supabase
        .from('report_cards')
        .select('student_id, average_percentage, class_rank, is_finalized, generated_at')
        .eq('term_id', activeTerm)
        .eq('school_id', schoolId)
        .in('student_id', studentIds);

      // Fetch marks approval status for this term
      const { data: marksData } = await supabase
        .from('marks')
        .select('student_id, status')
        .eq('term_id', activeTerm)
        .eq('school_id', schoolId)
        .in('student_id', studentIds);

      // Fetch fee records for this term
      const { data: feeData } = await supabase
        .from('fee_records')
        .select('student_id, balance')
        .eq('term_id', activeTerm)
        .eq('school_id', schoolId)
        .in('student_id', studentIds);

      // Build lookup maps
      const rcMap = new Map((reportCardsData || []).map(rc => [rc.student_id, rc]));

      const feeMap = new Map<string, number>();
      (feeData || []).forEach(f => {
        const prev = feeMap.get(f.student_id) || 0;
        feeMap.set(f.student_id, prev + Math.max(0, Number(f.balance || 0)));
      });

      const marksMap = new Map<string, string[]>();
      (marksData || []).forEach(m => {
        const arr = marksMap.get(m.student_id) || [];
        arr.push(m.status);
        marksMap.set(m.student_id, arr);
      });

      // Class size map
      const classSizeMap = new Map<string, number>();
      studentsData.forEach(s => {
        classSizeMap.set(s.class_id, (classSizeMap.get(s.class_id) || 0) + 1);
      });

      const termName = termsList.find(t => t.id === activeTerm)?.name || '';

      const result: ReportCardStudent[] = studentsData.map(s => {
        const rc = rcMap.get(s.id);
        const feeBal = feeMap.get(s.id) || 0;
        const markStatuses = marksMap.get(s.id) || [];
        // Accept 'verified' OR 'approved' — Dean verification is sufficient to generate report cards
        const marksApproved =
          markStatuses.length > 0 &&
          markStatuses.some(st => ['verified', 'approved'].includes(st));

        return {
          studentId: s.id,
          studentName: s.full_name,
          studentCode: s.student_id,
          classId: s.class_id,
          className: (s.classes as any)?.name || 'N/A',
          termId: activeTerm,
          termName,
          averageScore: rc ? Number(rc.average_percentage) : 0,
          classRank: rc?.class_rank || 0,
          totalStudents: classSizeMap.get(s.class_id) || 1,
          isFinalized: rc?.is_finalized || false,
          marksApproved,
          feesBalance: feeBal,
          generatedAt: rc?.generated_at || null,
        };
      });

      setStudents(result);

      // Build class summaries
      const summaryMap = new Map<string, ReportCardClassSummary>();
      result.forEach(s => {
        if (!summaryMap.has(s.classId)) {
          summaryMap.set(s.classId, {
            classId: s.classId,
            className: s.className,
            totalStudents: 0,
            generated: 0,
            approved: 0,
            locked: 0,
          });
        }
        const entry = summaryMap.get(s.classId)!;
        entry.totalStudents += 1;
        if (s.generatedAt) entry.generated += 1;
        if (s.isFinalized) entry.approved += 1;
        if (s.feesBalance > 0) entry.locked += 1;
      });
      setClassSummaries(Array.from(summaryMap.values()).sort((a, b) => a.className.localeCompare(b.className)));

      setStats({
        totalGenerated: result.filter(s => s.generatedAt !== null).length,
        pendingApprovals: result.filter(s => s.marksApproved && !s.isFinalized).length,
        lockedDueToFees: result.filter(s => s.feesBalance > 0).length,
        fullyPaid: result.filter(s => s.feesBalance === 0).length,
      });
    } catch (err) {
      console.error('Error fetching report card control data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedTermId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const finalizeReportCard = async (studentId: string, tId: string) => {
    // 1. Look up student's class_id and school_id
    const { data: studentData } = await supabase
      .from('students')
      .select('class_id, school_id, full_name')
      .eq('id', studentId)
      .maybeSingle();

    const classId        = studentData?.class_id || null;
    const studentSchoolId = studentData?.school_id || schoolId;

    // 2. Fetch ALL active students in the same class (for rank computation)
    const { data: classStudents } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('class_id', classId)
      .eq('status', 'active');

    const classStudentIds = (classStudents || []).map(s => s.id);
    const nameMap = new Map<string, string>(
      (classStudents || []).map(s => [s.id, s.full_name])
    );

    // 3. Fetch ALL marks for the term across all class students
    const { data: allMarks } = await supabase
      .from('marks')
      .select('student_id, score, max_score, percentage, subjects (name)')
      .eq('term_id', tId)
      .in('student_id', classStudentIds.length > 0 ? classStudentIds : [studentId]);

    // 4. Aggregate per-student totals and subject lists
    const studentStats = new Map<
      string,
      { total: number; maxTotal: number; avgPct: number; subjectList: { subject: string; percentage: number }[] }
    >();

    (allMarks || []).forEach(m => {
      const sid = m.student_id;
      const prev = studentStats.get(sid) || { total: 0, maxTotal: 0, avgPct: 0, subjectList: [] };
      const score  = Number((m as any).score) || 0;
      const maxSc  = Number((m as any).max_score) || 100;
      const pct    = Number((m as any).percentage) || Math.min(100, Math.round((score / maxSc) * 100));
      prev.total    += score;
      prev.maxTotal += maxSc;
      prev.subjectList.push({
        subject:    (m.subjects as any)?.name || 'Subject',
        percentage: pct,
      });
      studentStats.set(sid, prev);
    });

    // Compute average percentage per student
    studentStats.forEach((stats, sid) => {
      stats.avgPct = stats.subjectList.length > 0
        ? Math.round(stats.subjectList.reduce((s, sub) => s + sub.percentage, 0) / stats.subjectList.length)
        : 0;
      studentStats.set(sid, stats);
    });

    // 5. Rank all students (descending total score, tie-safe)
    const sorted = Array.from(studentStats.entries())
      .sort(([, a], [, b]) => b.total - a.total);

    const rankMap = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i][1].total < sorted[i - 1][1].total) currentRank = i + 1;
      rankMap.set(sorted[i][0], currentRank);
    }

    // 6. Helper functions for auto-generating comments
    const genTeacherRemark = (name: string, avg: number, subs: { subject: string; percentage: number }[]): string => {
      if (!subs.length) return 'Keep up the good work.';
      const best  = subs.reduce((a, b) => (b.percentage > a.percentage ? b : a));
      const worst = subs.reduce((a, b) => (b.percentage < a.percentage ? b : a));
      if (avg >= 80) return `${name} has demonstrated exceptional academic performance this term, especially in ${best.subject}. We encourage them to maintain this high standard.`;
      if (avg >= 65) return `${name} has shown commendable effort this term. Their performance in ${best.subject} is noteworthy. Further attention to ${worst.subject} would improve overall results.`;
      if (avg >= 50) return `${name} has performed satisfactorily. There is room for improvement, particularly in ${worst.subject}. Additional revision is encouraged.`;
      return `${name} requires additional support, especially in ${worst.subject}. Regular attendance and consistent effort will make a significant difference.`;
    };

    const genDirectorRemark = (name: string, avg: number): string => {
      if (avg >= 50) return `${name} has demonstrated the academic competency required for promotion. Their commitment is commendable, and we encourage continued dedication.`;
      if (avg >= 30) return `${name} has shown potential but must work harder. We encourage focused effort and parental support to achieve promotion next term.`;
      return `${name} requires further time to consolidate curriculum understanding. A structured remedial programme is recommended.`;
    };

    const gradeLabel = (avg: number) =>
      avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';

    // 7. Upsert report_cards for the target student
    const myStats  = studentStats.get(studentId) || { total: 0, maxTotal: 0, avgPct: 0, subjectList: [] };
    const myRank   = rankMap.get(studentId) || 1;
    const myName   = studentData?.full_name || 'Student';

    const { data: existing } = await supabase
      .from('report_cards')
      .select('id, teacher_remarks, director_remarks')
      .eq('student_id', studentId)
      .eq('term_id', tId)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      student_id:         studentId,
      term_id:            tId,
      school_id:          studentSchoolId,
      is_finalized:       true,
      generated_at:       new Date().toISOString(),
      total_marks:        myStats.total,
      average_percentage: myStats.avgPct,
      class_rank:         myRank,
      overall_grade:      gradeLabel(myStats.avgPct),
      // Only write auto-generated remarks when no manual remarks exist
      teacher_remarks:  existing?.teacher_remarks || genTeacherRemark(myName, myStats.avgPct, myStats.subjectList),
      director_remarks: existing?.director_remarks || genDirectorRemark(myName, myStats.avgPct),
    };
    if (classId) payload.class_id = classId;

    if (existing?.id) {
      const { error } = await supabase.from('report_cards').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('report_cards').insert(payload);
      if (error) throw error;
    }

    // 8. Batch-update ranks for all other class students that already have report_cards rows
    if (rankMap.size > 1) {
      const otherIds = Array.from(rankMap.keys()).filter(id => id !== studentId);
      await Promise.allSettled(
        otherIds.map(async (sid) => {
          const rank  = rankMap.get(sid) || 1;
          const stats = studentStats.get(sid);
          if (!stats) return;
          const sName = nameMap.get(sid) || 'Student';

          const { data: existRow } = await supabase
            .from('report_cards')
            .select('id, teacher_remarks, director_remarks')
            .eq('student_id', sid)
            .eq('term_id', tId)
            .maybeSingle();

          if (existRow?.id) {
            await supabase.from('report_cards').update({
              class_rank:    rank,
              overall_grade: gradeLabel(stats.avgPct),
              // backfill remarks only if missing
              ...(existRow.teacher_remarks  ? {} : { teacher_remarks:  genTeacherRemark(sName, stats.avgPct, stats.subjectList) }),
              ...(existRow.director_remarks ? {} : { director_remarks: genDirectorRemark(sName, stats.avgPct) }),
            }).eq('id', existRow.id);
          }
        })
      );
    }

    await fetchData();
  };

  const unfinalizeReportCard = async (studentId: string, tId: string) => {
    const { error: updateError } = await supabase
      .from('report_cards')
      .update({ is_finalized: false })
      .eq('student_id', studentId)
      .eq('term_id', tId);
    if (updateError) throw updateError;
    await fetchData();
  };

  return {
    students,
    classSummaries,
    stats,
    terms,
    classes,
    loading,
    error,
    refetch: fetchData,
    finalizeReportCard,
    unfinalizeReportCard,
  };
}
