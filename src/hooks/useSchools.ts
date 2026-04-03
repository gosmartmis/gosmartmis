import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface School {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  subscription_plan: string;
  subscription_status: string;
  max_students: number;
  max_teachers: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export const useSchools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      // Fetch student counts for each school
      const schoolsWithCounts = await Promise.all(
        (schoolsData || []).map(async (school) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('status', 'active');

          return {
            ...school,
            student_count: count || 0,
          };
        })
      );

      setSchools(schoolsWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schools');
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const addSchool = async (schoolData: any) => {
    try {
      // Strip onboarding-only fields that don't exist in the schools table
      const {
        create_director_account: _cda,
        director_name: _dn,
        director_email: _de,
        send_welcome_email: _swe,
        ...dbData
      } = schoolData;

      const { data, error } = await supabase
        .from('schools')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      await fetchSchools();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding school:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add school' };
    }
  };

  const updateSchool = async (id: string, updates: Partial<School>) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchSchools();
      return { success: true };
    } catch (err) {
      console.error('Error updating school:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update school' };
    }
  };

  const deleteSchool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSchools();
      return { success: true };
    } catch (err) {
      console.error('Error deleting school:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete school' };
    }
  };

  return {
    schools,
    loading,
    error,
    refetch: fetchSchools,
    addSchool,
    updateSchool,
    deleteSchool,
  };
};