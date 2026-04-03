import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Term {
  id: string;
  name: string;
  academic_year_id: string;
  school_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface UseTermsReturn {
  terms: Term[];
  activeTerm: Term | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTerms = (schoolId: string | null, academicYearId?: string): UseTermsReturn => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('terms')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTerms(data || []);
      
      // Find active term
      const active = (data || []).find(term => term.is_active);
      setActiveTerm(active || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch terms');
      console.error('Error fetching terms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [schoolId, academicYearId]);

  return { terms, activeTerm, loading, error, refetch: fetchTerms };
};