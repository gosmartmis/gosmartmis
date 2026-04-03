import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  school_id: string;
  academic_year_id: string;
  created_at: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

interface UseTeacherAssignmentsReturn {
  assignments: TeacherAssignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTeacherAssignments = (
  schoolId: string | null,
  teacherId?: string,
  classId?: string
): UseTeacherAssignmentsReturn => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('teacher_assignments')
        .select(`
          *,
          classes:class_id (
            name
          ),
          subjects:subject_id (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `)
        .eq('school_id', schoolId);

      if (teacherId) query = query.eq('teacher_id', teacherId);
      if (classId) query = query.eq('class_id', classId);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const assignmentsWithNames = (data || []).map(assignment => ({
        ...assignment,
        class_name: assignment.classes?.name || 'Unknown',
        subject_name: assignment.subjects?.name || 'Unknown',
        teacher_name: (assignment.profiles as { full_name?: string } | null)?.full_name || 'Unknown'
      }));

      setAssignments(assignmentsWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher assignments');
      console.error('Error fetching teacher assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [schoolId, teacherId, classId]);

  return { assignments, loading, error, refetch: fetchAssignments };
};