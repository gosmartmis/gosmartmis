import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  average_score: number;
  pass_rate: number;
  student_count: number;
  top_score: number;
  lowest_score: number;
}

interface UseSubjectPerformanceReturn {
  subjectPerformance: SubjectPerformance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubjectPerformance = (
  schoolId: string | null,
  termId?: string,
  classId?: string
): UseSubjectPerformanceReturn => {
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjectPerformance = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch marks for subjects
      let marksQuery = supabase
        .from('marks')
        .select('subject_id, score, max_score, student_id')
        .eq('school_id', schoolId);

      if (termId) marksQuery = marksQuery.eq('term_id', termId);
      if (classId) marksQuery = marksQuery.eq('class_id', classId);

      const { data: marks, error: marksError } = await marksQuery;

      if (marksError) throw marksError;

      // Calculate performance metrics for each subject
      const performance = (subjects || []).map(subject => {
        const subjectMarks = (marks || []).filter(m => m.subject_id === subject.id);

        if (subjectMarks.length === 0) {
          return {
            subject_id: subject.id,
            subject_name: subject.name,
            average_score: 0,
            pass_rate: 0,
            student_count: 0,
            top_score: 0,
            lowest_score: 0
          };
        }

        // Calculate percentages
        const percentages = subjectMarks.map(mark => ((mark as any).score / ((mark as any).max_score || 100)) * 100);

        // Calculate average score
        const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
        const averageScore = totalPercentage / percentages.length;

        // Calculate pass rate (assuming 50% is passing)
        const passCount = percentages.filter(p => p >= 50).length;
        const passRate = (passCount / percentages.length) * 100;

        // Get unique student count
        const uniqueStudents = new Set(subjectMarks.map(m => m.student_id));

        return {
          subject_id: subject.id,
          subject_name: subject.name,
          average_score: Math.round(averageScore),
          pass_rate: Math.round(passRate),
          student_count: uniqueStudents.size,
          top_score: Math.round(Math.max(...percentages)),
          lowest_score: Math.round(Math.min(...percentages))
        };
      }).filter(s => s.student_count > 0); // Only include subjects with marks

      setSubjectPerformance(performance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subject performance');
      console.error('Error fetching subject performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectPerformance();
  }, [schoolId, termId, classId]);

  return { subjectPerformance, loading, error, refetch: fetchSubjectPerformance };
};