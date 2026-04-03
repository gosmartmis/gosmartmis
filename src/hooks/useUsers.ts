import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  school_id: string | null;
  school_name: string | null;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          phone,
          avatar_url,
          is_active,
          created_at,
          school_id,
          schools ( name )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: UserProfile[] = (data || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        phone: row.phone,
        avatar_url: row.avatar_url,
        is_active: row.is_active,
        created_at: row.created_at,
        school_id: row.school_id,
        school_name: row.schools?.name ?? null,
      }));

      setUsers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('useUsers fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleActive = async (userId: string, currentValue: boolean) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !currentValue } : u))
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: !currentValue })
      .eq('id', userId);

    if (updateError) {
      console.error('toggleActive error:', updateError);
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: currentValue } : u))
      );
      return { success: false, error: updateError.message };
    }

    return { success: true };
  };

  return { users, loading, error, refetch: fetchUsers, toggleActive };
};
