import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Subject {
  id: string;
  name: string;
  code: string;
  school_id: string;
  created_at: string;
}

interface UseSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubjects = (schoolId: string | null): UseSubjectsReturn => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setSubjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [schoolId]);

  return { subjects, loading, error, refetch: fetchSubjects };
};