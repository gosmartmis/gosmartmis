import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Class {
  id: string;
  name: string;
  level: string;
  stream?: string;
  capacity: number;
  school_id: string;
  academic_year_id: string;
  created_at: string;
  student_count?: number;
}

interface UseClassesReturn {
  classes: Class[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useClasses = (schoolId: string | null, academicYearId?: string): UseClassesReturn => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch student counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            ...cls,
            student_count: count || 0
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [schoolId, academicYearId]);

  return { classes, loading, error, refetch: fetchClasses };
};