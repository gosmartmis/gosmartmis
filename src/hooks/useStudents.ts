import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Student {
  id: string;
  full_name: string;
  student_id: string;
  class_id: string;
  school_id: string;
  date_of_birth?: string;
  gender?: string;
  status: string;
  created_at: string;
  class_name?: string;
}

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudents = (schoolId: string | null, classId?: string): UseStudentsReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select(`
          *,
          classes:class_id (
            name
          )
        `)
        .eq('school_id', schoolId)
        .order('full_name', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const studentsWithClassName = (data || []).map(student => ({
        ...student,
        class_name: student.classes?.name || 'N/A'
      }));

      setStudents(studentsWithClassName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolId, classId]);

  return { students, loading, error, refetch: fetchStudents };
};