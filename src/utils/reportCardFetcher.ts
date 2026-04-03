import { supabase } from '../lib/supabase';
import { ReportCardData } from '../types/report-card';

/**
 * Fetch real report card data for a student/term from Supabase.
 * Uses the correct column names matching the actual DB schema.
 */
export async function fetchReportCardData(
  studentId: string,
  termId: string
): Promise<{ data: ReportCardData | null; error: string | null }> {
  try {
    if (!studentId || !termId) {
      return { data: null, error: 'Student ID and Term ID are required.' };
    }

    // 1. Fetch student with class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        full_name,
        school_id,
        class_id,
        classes (id, name)
      `)
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) throw new Error('Student not found.');

    const studentFullName = (student.full_name || 'Student').trim();

    // 2. Fetch school info separately (safer than nested join)
    const { data: school } = await supabase
      .from('schools')
      .select('id, name, address, phone, logo_url')
      .eq('id', student.school_id)
      .maybeSingle();

    // 3. Fetch term info
    const { data: term, error: termError } = await supabase
      .from('terms')
      .select('id, name, start_date, end_date')
      .eq('id', termId)
      .maybeSingle();

    if (termError) throw termError;
    if (!term) throw new Error('Term not found.');

    // 4. Fetch academic year for this school
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('name')
      .eq('school_id', student.school_id)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch approved/verified marks for this student + term
    const { data: marks, error: marksError } = await supabase
      .from('marks')
      .select(`
        id,
        score,
        max_score,
        percentage,
        grade,
        status,
        subjects (name)
      `)
      .eq('student_id', studentId)
      .eq('term_id', termId)
      .in('status', ['approved', 'verified', 'finalized', 'pending'])
      .order('created_at', { ascending: true });

    if (marksError) throw marksError;

    // 6. Fetch attendance for this student during the term
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, date')
      .eq('student_id', studentId)
      .gte('date', term.start_date || '1900-01-01')
      .lte('date', term.end_date || '9999-12-31');

    const presentCount = (attendance || []).filter(a => a.status === 'present').length;
    const absentCount = (attendance || []).filter(a => a.status === 'absent').length;
    const lateCount = (attendance || []).filter(a => a.status === 'late').length;
    const totalDays = (attendance || []).length;
    const attendancePct = totalDays > 0
      ? Math.round(((presentCount + lateCount) / totalDays) * 100)
      : 0;

    // 7. Fetch report_card record — use correct column names matching the DB schema
    const { data: reportCard } = await supabase
      .from('report_cards')
      .select(
        'id, total_marks, average_percentage, class_rank, overall_grade, teacher_remarks, director_remarks, is_finalized, generated_at'
      )
      .eq('student_id', studentId)
      .eq('term_id', termId)
      .maybeSingle();

    // 8. Count total students in the class for ranking
    const { count: classSize } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', student.class_id)
      .eq('status', 'active');

    // 9. Build subjects array from marks
    const subjects = (marks || []).map(m => {
      const score = Number((m as any).score) || 0;
      const maxScore = Number((m as any).max_score) || 100;
      const percentage = Number((m as any).percentage) || Math.min(100, Math.round((score / maxScore) * 100));
      return {
        subject: (m.subjects as { name?: string } | null)?.name || 'Unknown',
        score,
        maxScore,
        percentage,
      };
    });

    // 10. Compute totals — prefer stored values when available
    const totalScore = reportCard?.total_marks
      ? Number(reportCard.total_marks)
      : subjects.reduce((s, sub) => s + sub.score, 0);

    const maxTotalScore = subjects.length * 100;

    const averageScore = reportCard?.average_percentage
      ? Number(reportCard.average_percentage)
      : subjects.length > 0
      ? Math.round(subjects.reduce((s, sub) => s + sub.percentage, 0) / subjects.length)
      : 0;

    // 11. Compute class rank — use stored rank if available, else compute live from marks
    let classRank = reportCard?.class_rank || 0;
    if (!classRank && subjects.length > 0) {
      const { data: classmateMarks } = await supabase
        .from('marks')
        .select('student_id, score')
        .eq('term_id', termId);

      if (classmateMarks && classmateMarks.length > 0) {
        const studentTotals = new Map<string, number>();
        classmateMarks.forEach(m => {
          const prev = studentTotals.get(m.student_id) || 0;
          studentTotals.set(m.student_id, prev + Number((m as any).score || 0));
        });
        const myTotal = studentTotals.get(studentId) || totalScore;
        classRank = 1;
        studentTotals.forEach((total, sid) => {
          if (sid !== studentId && total > myTotal) classRank++;
        });
      }
    }
    if (!classRank) classRank = 1;

    // 12. Determine promotion decision
    let decision: 'promoted' | 'repeat' | 'conditional' = 'conditional';
    if (averageScore >= 50) decision = 'promoted';
    else if (averageScore < 30) decision = 'repeat';

    // 13. Use stored comments when available, auto-generate only as fallback
    const teacherComment =
      reportCard?.teacher_remarks ||
      generateTeacherComment(studentFullName, averageScore, subjects);
    const directorComment =
      reportCard?.director_remarks ||
      generateDirectorComment(studentFullName, averageScore, decision);

    // 14. Build final ReportCardData
    const data: ReportCardData = {
      schoolBranding: {
        logo: school?.logo_url || '',
        name: school?.name || 'Go Smart Academy',
        motto: 'Excellence in Education',
        address: school?.address || 'Kigali, Rwanda',
        phone: school?.phone || '',
        academicYear: academicYear?.name || String(new Date().getFullYear()),
        term: term.name,
      },
      studentInfo: {
        name: studentFullName,
        studentCode: student.student_id,
        class: (student.classes as { name?: string } | null)?.name || 'N/A',
        academicYear: academicYear?.name || String(new Date().getFullYear()),
        term: term.name,
      },
      subjects,
      totalScore,
      maxTotalScore,
      averageScore,
      classRank,
      totalStudents: classSize || 1,
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: totalDays,
        percentage: attendancePct,
      },
      teacherComment,
      directorComment,
      decision,
      generatedDate: reportCard?.generated_at
        ? new Date(reportCard.generated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
    };

    return { data, error: null };
  } catch (err) {
    console.error('fetchReportCardData error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load report card.',
    };
  }
}

/** Generate a contextual teacher comment based on performance */
function generateTeacherComment(name: string, avg: number, subjects: { subject: string; percentage: number }[]): string {
  const best = subjects.reduce((a, b) => (b.percentage > a.percentage ? b : a), subjects[0]);
  const worst = subjects.reduce((a, b) => (b.percentage < a.percentage ? b : a), subjects[0]);

  if (avg >= 80) {
    return `${name} has demonstrated exceptional academic performance this term. Their dedication and hard work are clearly reflected in their results${best ? `, especially in ${best.subject}` : ''}. We are proud of their achievements and encourage them to maintain this high standard.`;
  }
  if (avg >= 65) {
    return `${name} has shown commendable effort and good understanding of the curriculum this term${best ? `. Their performance in ${best.subject} is particularly noteworthy` : ''}. ${worst ? `Further attention to ${worst.subject} would help improve overall results.` : 'Keep up the consistent work.'}`;
  }
  if (avg >= 50) {
    return `${name} has performed satisfactorily this term. There is room for improvement${worst ? `, particularly in ${worst.subject}` : ''}. We encourage ${name} to seek additional support and dedicate more time to revision to achieve better results next term.`;
  }
  return `${name} has faced challenges this term and requires additional support to improve their academic performance. We strongly encourage regular attendance, timely completion of assignments, and seeking help from teachers${worst ? `, especially in ${worst.subject}` : ''}. With consistent effort, improvement is achievable.`;
}

/** Generate a contextual director comment based on decision */
function generateDirectorComment(name: string, avg: number, decision: string): string {
  if (decision === 'promoted') {
    return `${name} has demonstrated the academic competency required for promotion to the next level. Their commitment to excellence is commendable. We encourage them to continue building on this strong foundation and remain dedicated to their studies.`;
  }
  if (decision === 'conditional') {
    return `${name} has shown potential but must work harder to strengthen their academic performance. We encourage parents and guardians to provide additional support at home. With focused effort and consistent revision, ${name} can achieve promotion next term.`;
  }
  return `${name} requires further time to consolidate their understanding of the curriculum before progressing. We recommend a structured remedial program and close collaboration between the school and family to support ${name}'s academic development.`;
}
