import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TimetableRow {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  term_id: string | null;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_published: boolean;
  subject_name?: string;
  teacher_name?: string;
}

export interface PeriodSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface UpsertPeriodPayload {
  school_id: string;
  class_id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  subject_id: string | null;
  teacher_id: string | null;
  term_id: string | null;
  is_published: boolean;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface UseAdminTimetableReturn {
  entries: TimetableRow[];
  loading: boolean;
  saving: boolean;
  publishing: boolean;
  error: string | null;
  isPublished: boolean;
  fetchTimetable: (classId: string) => Promise<void>;
  upsertPeriod: (payload: UpsertPeriodPayload) => Promise<boolean>;
  deletePeriod: (classId: string, dayOfWeek: string, periodNumber: number) => Promise<boolean>;
  publishTimetable: (classId: string, schoolId: string) => Promise<boolean>;
  unpublishTimetable: (classId: string, schoolId: string) => Promise<boolean>;
  clearTimetable: (classId: string, schoolId: string) => Promise<boolean>;
}

export const useAdminTimetable = (schoolId: string | null): UseAdminTimetableReturn => {
  const [entries, setEntries] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const fetchTimetable = useCallback(async (classId: string) => {
    if (!schoolId || !classId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('timetables')
        .select(`
          id, school_id, class_id, subject_id, teacher_id, term_id,
          day_of_week, period_number, start_time, end_time, is_break, is_published,
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `)
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .order('day_of_week')
        .order('period_number');

      if (fetchError) throw fetchError;

      const rows: TimetableRow[] = (data || []).map((r: any) => ({
        id: r.id,
        school_id: r.school_id,
        class_id: r.class_id,
        subject_id: r.subject_id,
        teacher_id: r.teacher_id,
        term_id: r.term_id,
        day_of_week: r.day_of_week,
        period_number: r.period_number,
        start_time: r.start_time,
        end_time: r.end_time,
        is_break: r.is_break ?? false,
        is_published: r.is_published ?? false,
        subject_name: r.subjects?.name ?? null,
        teacher_name: r.profiles?.full_name ?? null,
      }));

      setEntries(rows);
      setIsPublished(rows.length > 0 && rows.every(r => r.is_published));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const upsertPeriod = async (payload: UpsertPeriodPayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      // Check if row exists
      const { data: existing } = await supabase
        .from('timetables')
        .select('id')
        .eq('school_id', payload.school_id)
        .eq('class_id', payload.class_id)
        .eq('day_of_week', payload.day_of_week)
        .eq('period_number', payload.period_number)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('timetables')
          .update({
            subject_id: payload.subject_id,
            teacher_id: payload.teacher_id,
            term_id: payload.term_id,
            is_break: payload.is_break,
            start_time: payload.start_time,
            end_time: payload.end_time,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('timetables')
          .insert(payload);
        if (insertError) throw insertError;
      }

      await fetchTimetable(payload.class_id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save period');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePeriod = async (classId: string, dayOfWeek: string, periodNumber: number): Promise<boolean> => {
    if (!schoolId) return false;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('timetables')
        .delete()
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .eq('day_of_week', dayOfWeek)
        .eq('period_number', periodNumber);
      if (deleteError) throw deleteError;
      await fetchTimetable(classId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete period');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publishTimetable = async (classId: string, sId: string): Promise<boolean> => {
    setPublishing(true);
    setError(null);
    try {
      const { error: pubError } = await supabase
        .from('timetables')
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .eq('school_id', sId)
        .eq('class_id', classId);
      if (pubError) throw pubError;
      await fetchTimetable(classId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish timetable');
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const unpublishTimetable = async (classId: string, sId: string): Promise<boolean> => {
    setPublishing(true);
    setError(null);
    try {
      const { error: upError } = await supabase
        .from('timetables')
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq('school_id', sId)
        .eq('class_id', classId);
      if (upError) throw upError;
      await fetchTimetable(classId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish timetable');
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const clearTimetable = async (classId: string, sId: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const { error: clearError } = await supabase
        .from('timetables')
        .delete()
        .eq('school_id', sId)
        .eq('class_id', classId);
      if (clearError) throw clearError;
      setEntries([]);
      setIsPublished(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear timetable');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    entries,
    loading,
    saving,
    publishing,
    error,
    isPublished,
    fetchTimetable,
    upsertPeriod,
    deletePeriod,
    publishTimetable,
    unpublishTimetable,
    clearTimetable,
  };
};

export { WEEK_DAYS };
