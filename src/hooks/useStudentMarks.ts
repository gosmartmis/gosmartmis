import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SubjectMark {
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  teacher: string;
}

interface ExamResult {
  name: string;
  date: string;
  status: 'approved' | 'verified' | 'pending';
  subjects: SubjectMark[];
  total: number;
  maxTotal: number;
  average: number;
  rank: number;
  classSize: number;
}

interface TermExams {
  term: string;
  termId: string;
  exams: ExamResult[];
}

export function useStudentMarks(studentId: string) {
  const [examResults, setExamResults] = useState<TermExams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    fetchMarks();
  }, [studentId]);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student's class_id
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('class_id, school_id')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) throw new Error('Student not found');

      // Fetch all terms for this school
      const { data: terms, error: termsError } = await supabase
        .from('terms')
        .select('id, name, start_date, end_date')
        .eq('school_id', student.school_id)
        .order('start_date', { ascending: false });

      if (termsError) throw termsError;

      const results: TermExams[] = [];

      for (const term of terms || []) {
        // Fetch marks for this student + term
        const { data: marks, error: marksError } = await supabase
          .from('marks')
          .select(`
            id,
            score,
            max_score,
            percentage,
            grade,
            status,
            subjects (
              name
            ),
            profiles (
              full_name
            )
          `)
          .eq('student_id', studentId)
          .eq('term_id', term.id)
          .order('created_at', { ascending: true });

        if (marksError) throw marksError;
        if (!marks || marks.length === 0) continue;

        // Calculate totals
        const total = marks.reduce((sum, m) => sum + (Number((m as any).score) || 0), 0);
        const maxTotal = marks.reduce((sum, m) => sum + (Number((m as any).max_score) || 100), 0);
        const average = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

        // Get class rank via report_cards table
        const { data: reportCard } = await supabase
          .from('report_cards')
          .select('class_rank')
          .eq('student_id', studentId)
          .eq('term_id', term.id)
          .maybeSingle();

        // Get class size
        const { count: classSize } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', student.class_id);

        // Determine status
        const allApproved = marks.every(m => m.status === 'approved');
        const anyVerified = marks.some(m => m.status === 'verified');
        const status: 'approved' | 'verified' | 'pending' = allApproved
          ? 'approved'
          : anyVerified
          ? 'verified'
          : 'pending';

        // Format subjects
        const subjects: SubjectMark[] = marks.map(mark => ({
          subject: (mark.subjects as any)?.name || 'Unknown',
          score: Number((mark as any).score) || 0,
          maxScore: Number((mark as any).max_score) || 100,
          grade: mark.grade || 'N/A',
          teacher: (mark.profiles as any)?.full_name || 'N/A',
        }));

        results.push({
          term: term.name,
          termId: term.id,
          exams: [
            {
              name: `${term.name} Examination`,
              date: new Date(term.end_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              status,
              subjects,
              total,
              maxTotal,
              average,
              rank: reportCard?.class_rank || 1,
              classSize: classSize || 1,
            },
          ],
        });
      }

      setExamResults(results);
    } catch (err) {
      console.error('Error fetching student marks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  return { examResults, loading, error, refetch: fetchMarks };
}
