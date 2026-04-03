import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface HolidayPackageDB {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string | null;
  subject_id: string | null;
  term_id: string | null;
  title: string;
  description: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  due_date: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface CreatePackagePayload {
  title: string;
  description: string;
  class_id: string;
  subject_id: string;
  due_date?: string;
  attachment_name?: string;
  attachment_url?: string;
}

interface UseHolidayPackagesReturn {
  packages: HolidayPackageDB[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  createPackage: (payload: CreatePackagePayload) => Promise<boolean>;
  deletePackage: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useHolidayPackages(params: {
  teacherId?: string | null;
  classId?: string | null;
  schoolId: string | null;
}): UseHolidayPackagesReturn {
  const { teacherId, classId, schoolId } = params;
  const [packages, setPackages] = useState<HolidayPackageDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('holiday_packages')
        .select(`
          *,
          classes:class_id ( name ),
          subjects:subject_id ( name ),
          profiles:teacher_id ( full_name )
        `)
        .eq('school_id', schoolId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      if (classId && !teacherId) {
        query = query.eq('class_id', classId);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const mapped: HolidayPackageDB[] = (data || []).map((row: any) => ({
        ...row,
        class_name: row.classes?.name ?? null,
        subject_name: row.subjects?.name ?? null,
        teacher_name: row.profiles?.full_name ?? null,
      }));

      setPackages(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holiday packages');
    } finally {
      setLoading(false);
    }
  }, [schoolId, teacherId, classId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (payload: CreatePackagePayload): Promise<boolean> => {
    if (!schoolId || !teacherId) return false;
    try {
      setCreating(true);
      const { error: insertErr } = await supabase.from('holiday_packages').insert({
        school_id: schoolId,
        teacher_id: teacherId,
        class_id: payload.class_id,
        subject_id: payload.subject_id,
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date || null,
        attachment_name: payload.attachment_name || null,
        attachment_url: payload.attachment_url || null,
        is_published: true,
      });
      if (insertErr) throw insertErr;
      await fetchPackages();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create package');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const deletePackage = async (id: string): Promise<boolean> => {
    try {
      const { error: delErr } = await supabase
        .from('holiday_packages')
        .delete()
        .eq('id', id);
      if (delErr) throw delErr;
      setPackages(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
      return false;
    }
  };

  return { packages, loading, error, creating, createPackage, deletePackage, refetch: fetchPackages };
}
