import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AcademicYear {
  id: string;
  name: string;
  school_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface UseAcademicYearsReturn {
  academicYears: AcademicYear[];
  activeYear: AcademicYear | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAcademicYears = (schoolId: string | null): UseAcademicYearsReturn => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicYears = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;

      setAcademicYears(data || []);
      
      // Find active academic year
      const active = (data || []).find(year => year.is_active);
      setActiveYear(active || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch academic years');
      console.error('Error fetching academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, [schoolId]);

  return { academicYears, activeYear, loading, error, refetch: fetchAcademicYears };
};