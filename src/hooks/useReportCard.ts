import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ReportCardData } from '../types/report-card';

/* ─── helpers ────────────────────────────────────────────────────────── */
function gradeFromAvg(avg: number): string {
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 60) return 'C';
  if (avg >= 50) return 'D';
  return 'F';
}

function buildTeacherComment(
  name: string,
  avg: number,
  subjects: { subject: string; percentage: number }[]
): string {
  if (!subjects.length) return 'Keep up the good work and continue striving for excellence.';
  const best = subjects.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  const worst = subjects.reduce((a, b) => (b.percentage < a.percentage ? b : a));
  if (avg >= 80)
    return `${name} has demonstrated exceptional academic performance this term, especially in ${best.subject}. Their dedication is commendable and we encourage them to maintain this high standard.`;
  if (avg >= 65)
    return `${name} has shown commendable effort this term. Their performance in ${best.subject} is particularly noteworthy. Further attention to ${worst.subject} would help improve overall results.`;
  if (avg >= 50)
    return `${name} has performed satisfactorily this term. There is room for improvement, particularly in ${worst.subject}. We encourage additional revision to achieve better results next term.`;
  return `${name} has faced academic challenges this term and requires additional support, especially in ${worst.subject}. Regular attendance and consistent study habits will make a significant difference.`;
}

function buildDirectorComment(name: string, avg: number, decision: string): string {
  if (decision === 'promoted')
    return `${name} has demonstrated the academic competency required for promotion. Their commitment to excellence is commendable, and we encourage continued dedication to their studies.`;
  if (decision === 'conditional')
    return `${name} has shown potential but must work harder to strengthen academic performance. We encourage parents and guardians to provide additional support, and ${name} to focus on consistent revision.`;
  return `${name} requires further time to consolidate their understanding of the curriculum. A structured remedial programme and close collaboration between school and family is recommended.`;
}

/* ─── hook ───────────────────────────────────────────────────────────── */
export function useReportCard(studentId: string, termId: string) {
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !termId) return;
    fetchReportCard();
  }, [studentId, termId]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Student + class + school
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id, student_id, full_name, school_id, class_id,
          classes (id, name),
          schools (id, name, address, phone, logo_url)
        `)
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found');

      // 2. Term info
      const { data: term, error: termError } = await supabase
        .from('terms')
        .select('id, name, start_date, end_date')
        .eq('id', termId)
        .maybeSingle();

      if (termError) throw termError;
      if (!term) throw new Error('Term not found');

      // 3. Academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('name')
        .eq('school_id', student.school_id)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 4. Marks for student + term
      const { data: marks, error: marksError } = await supabase
        .from('marks')
        .select(`id, score, max_score, percentage, grade, status, subjects (id, name)`)
        .eq('student_id', studentId)
        .eq('term_id', termId)
        .order('created_at', { ascending: true });

      if (marksError) throw marksError;

      // 5. Attendance during the term
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('status, date')
        .eq('student_id', studentId)
        .eq('school_id', student.school_id)
        .gte('date', term.start_date)
        .lte('date', term.end_date);

      const presentCount = (attendanceRecords || []).filter(a => a.status === 'present').length;
      const absentCount  = (attendanceRecords || []).filter(a => a.status === 'absent').length;
      const lateCount    = (attendanceRecords || []).filter(a => a.status === 'late').length;
      const totalDays    = (attendanceRecords || []).length;
      const attendancePct = totalDays > 0
        ? Math.round(((presentCount + lateCount) / totalDays) * 100)
        : 0;

      // 6. Existing report_cards row — all real columns
      const { data: reportCard } = await supabase
        .from('report_cards')
        .select(
          'id, total_marks, average_percentage, class_rank, overall_grade, teacher_remarks, director_remarks, is_finalized, generated_at'
        )
        .eq('student_id', studentId)
        .eq('term_id', termId)
        .maybeSingle();

      // 7. Class size
      const { count: classSize } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', student.class_id);

      // 8. Build subjects array
      const subjects = (marks || []).map(m => ({
        subject: (m.subjects as any)?.name || 'Unknown',
        score:   Number((m as any).score) || 0,
        maxScore: Number((m as any).max_score) || 100,
        percentage: Number((m as any).percentage) || 0,
      }));

      // 9. Compute totals (prefer stored values from report_cards when available)
      const computedTotal = subjects.reduce((s, sub) => s + sub.score, 0);
      const computedMax   = subjects.reduce((s, sub) => s + sub.maxScore, 0) || subjects.length * 100;
      const computedAvg   = subjects.length > 0
        ? Math.round(subjects.reduce((s, sub) => s + sub.percentage, 0) / subjects.length)
        : 0;

      const totalScore   = reportCard?.total_marks ? Number(reportCard.total_marks) : computedTotal;
      const maxTotalScore = computedMax;
      const averageScore  = reportCard?.average_percentage ? Number(reportCard.average_percentage) : computedAvg;

      // 10. Class rank — use stored rank if present; otherwise compute live from marks
      let classRank = reportCard?.class_rank || 0;
      if (!classRank && subjects.length > 0) {
        const { data: allTermMarks } = await supabase
          .from('marks')
          .select('student_id, score')
          .eq('term_id', termId);

        if (allTermMarks && allTermMarks.length > 0) {
          const totalsMap = new Map<string, number>();
          allTermMarks.forEach(m => {
            const prev = totalsMap.get(m.student_id) || 0;
            totalsMap.set(m.student_id, prev + Number((m as any).score || 0));
          });
          const myTotal = totalsMap.get(studentId) || computedTotal;
          classRank = 1;
          totalsMap.forEach((t, sid) => {
            if (sid !== studentId && t > myTotal) classRank++;
          });
        }
      }
      if (!classRank) classRank = 1;

      // 11. Promotion decision
      let decision: 'promoted' | 'repeat' | 'conditional' = 'conditional';
      if (averageScore >= 50) decision = 'promoted';
      else if (averageScore < 30) decision = 'repeat';

      // 12. Comments — prefer stored remarks; auto-generate only as fallback
      const teacherComment = reportCard?.teacher_remarks
        || buildTeacherComment(student.full_name, averageScore, subjects);
      const directorComment = reportCard?.director_remarks
        || buildDirectorComment(student.full_name, averageScore, decision);

      // 13. Auto-persist report_cards row when previewed for the first time
      //     (so data survives and rank/grade/remarks are stored)
      if (subjects.length > 0 && !reportCard) {
        await supabase.from('report_cards').insert({
          student_id:         studentId,
          term_id:            termId,
          school_id:          student.school_id,
          class_id:           student.class_id,
          total_marks:        computedTotal,
          average_percentage: computedAvg,
          class_rank:         classRank,
          overall_grade:      gradeFromAvg(computedAvg),
          teacher_remarks:    buildTeacherComment(student.full_name, computedAvg, subjects),
          director_remarks:   buildDirectorComment(student.full_name, computedAvg, decision),
          is_finalized:       false,
          generated_at:       new Date().toISOString(),
        });
      } else if (subjects.length > 0 && reportCard && !reportCard.class_rank) {
        // Backfill missing rank on existing row
        await supabase.from('report_cards')
          .update({
            class_rank:    classRank,
            overall_grade: gradeFromAvg(averageScore),
          })
          .eq('id', reportCard.id);
      }

      // 14. Assemble final ReportCardData
      const data: ReportCardData = {
        schoolBranding: {
          logo:         (student.schools as any)?.logo_url || '',
          name:         (student.schools as any)?.name || 'School',
          motto:        'Excellence in Education',
          address:      (student.schools as any)?.address || '',
          phone:        (student.schools as any)?.phone || '',
          academicYear: academicYear?.name || new Date().getFullYear().toString(),
          term:         term.name,
        },
        studentInfo: {
          name:         student.full_name,
          studentCode:  student.student_id,
          class:        (student.classes as any)?.name || 'N/A',
          academicYear: academicYear?.name || new Date().getFullYear().toString(),
          term:         term.name,
        },
        subjects,
        totalScore,
        maxTotalScore,
        averageScore,
        classRank,
        totalStudents: classSize || 1,
        attendance: {
          present: presentCount,
          absent:  absentCount,
          late:    lateCount,
          total:   totalDays,
          percentage: attendancePct,
        },
        teacherComment,
        directorComment,
        decision,
        generatedDate: reportCard?.generated_at
          ? new Date(reportCard.generated_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
          : new Date().toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            }),
      };

      setReportCardData(data);
    } catch (err) {
      console.error('useReportCard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  return { reportCardData, loading, error, refetch: fetchReportCard };
}
