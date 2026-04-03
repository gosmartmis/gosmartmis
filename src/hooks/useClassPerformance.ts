import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ClassPerformance {
  class_id: string;
  class_name: string;
  student_count: number;
  average_score: number;
  pass_rate: number;
  attendance_rate: number;
}

interface UseClassPerformanceReturn {
  classPerformance: ClassPerformance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useClassPerformance = (
  schoolId: string | null,
  termId?: string
): UseClassPerformanceReturn => {
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassPerformance = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all classes with student counts
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          students:students(count)
        `)
        .eq('school_id', schoolId)
        .order('name');

      if (classesError) throw classesError;

      // Fetch marks for each class
      let marksQuery = supabase
        .from('marks')
        .select('class_id, score, max_score')
        .eq('school_id', schoolId);

      if (termId) marksQuery = marksQuery.eq('term_id', termId);

      const { data: marks, error: marksError } = await marksQuery;

      if (marksError) throw marksError;

      // Fetch attendance for each class
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('class_id, status')
        .eq('school_id', schoolId);

      if (attendanceError) throw attendanceError;

      // Calculate performance metrics for each class
      const performance = (classes || []).map(cls => {
        const classMarks = (marks || []).filter(m => m.class_id === cls.id);
        const classAttendance = (attendance || []).filter(a => a.class_id === cls.id);

        // Calculate average score
        const totalPercentage = classMarks.reduce((sum, mark) => {
          return sum + ((mark as any).score / ((mark as any).max_score || 100)) * 100;
        }, 0);
        const averageScore = classMarks.length > 0 ? totalPercentage / classMarks.length : 0;

        // Calculate pass rate (assuming 50% is passing)
        const passCount = classMarks.filter(mark => {
          return ((mark as any).score / ((mark as any).max_score || 100)) * 100 >= 50;
        }).length;
        const passRate = classMarks.length > 0 ? (passCount / classMarks.length) * 100 : 0;

        // Calculate attendance rate
        const presentCount = classAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = classAttendance.length > 0 
          ? (presentCount / classAttendance.length) * 100 
          : 0;

        return {
          class_id: cls.id,
          class_name: cls.name,
          student_count: cls.students?.[0]?.count || 0,
          average_score: Math.round(averageScore),
          pass_rate: Math.round(passRate),
          attendance_rate: Math.round(attendanceRate)
        };
      });

      setClassPerformance(performance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch class performance');
      console.error('Error fetching class performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassPerformance();
  }, [schoolId, termId]);

  return { classPerformance, loading, error, refetch: fetchClassPerformance };
};