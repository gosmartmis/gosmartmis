import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TestimonialSubmission {
  id: string;
  name: string;
  role: string;
  school: string;
  quote: string;
  photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}

interface UseTestimonialSubmissionsReturn {
  submissions: TestimonialSubmission[];
  loading: boolean;
  submitting: boolean;
  submit: (data: Omit<TestimonialSubmission, 'id' | 'status' | 'submitted_at' | 'reviewed_at'>) => Promise<boolean>;
  updateStatus: (id: string, status: 'approved' | 'rejected') => Promise<boolean>;
  refetch: () => void;
}

export function useTestimonialSubmissions(): UseTestimonialSubmissionsReturn {
  const [submissions, setSubmissions] = useState<TestimonialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonial_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (!cancelled && !error && data) {
        setSubmissions(data as TestimonialSubmission[]);
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [tick]);

  const submit = useCallback(async (
    data: Omit<TestimonialSubmission, 'id' | 'status' | 'submitted_at' | 'reviewed_at'>
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('testimonial_submissions').insert({
        ...data,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      if (error) return false;
      refetch();
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [refetch]);

  const updateStatus = useCallback(async (id: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('testimonial_submissions')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return false;
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status, reviewed_at: new Date().toISOString() } : s));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { submissions, loading, submitting, submit, updateStatus, refetch };
}
