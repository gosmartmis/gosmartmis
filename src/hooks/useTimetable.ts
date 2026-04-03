import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TimetableEntry {
  id: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_published: boolean;
  class_id: string;
  class_name: string;
  subject_id: string | null;
  subject_name: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
}

export interface DaySchedule {
  day: string;
  periods: TimetableEntry[];
}

export interface TimetableData {
  classId: string;
  className: string;
  schedule: DaySchedule[];
  isPublished: boolean;
  totalPeriods: number;
  uniqueSubjects: number;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface UseTimetableReturn {
  timetable: TimetableData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching timetable by class ID (used by students)
 */
export const useStudentTimetable = (
  schoolId: string | null,
  classId: string | null
): UseTimetableReturn => {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = async () => {
    if (!schoolId || !classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          is_break,
          is_published,
          class_id,
          subject_id,
          teacher_id,
          classes:class_id (name),
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `)
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .eq('is_published', true)
        .order('day_of_week', { ascending: true })
        .order('period_number', { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setTimetable(null);
        return;
      }

      const entries: TimetableEntry[] = data.map((row: any) => ({
        id: row.id,
        day_of_week: row.day_of_week,
        period_number: row.period_number,
        start_time: row.start_time,
        end_time: row.end_time,
        is_break: row.is_break ?? false,
        is_published: row.is_published ?? false,
        class_id: row.class_id,
        class_name: row.classes?.name ?? 'Unknown',
        subject_id: row.subject_id,
        subject_name: row.subjects?.name ?? null,
        teacher_id: row.teacher_id,
        teacher_name: row.profiles?.full_name ?? null,
      }));

      const className = entries[0]?.class_name ?? 'Unknown';
      const schedule: DaySchedule[] = WEEK_DAYS.map(day => ({
        day,
        periods: entries
          .filter(e => e.day_of_week === day)
          .sort((a, b) => a.period_number - b.period_number),
      }));

      const nonBreakPeriods = entries.filter(e => !e.is_break);
      const uniqueSubjects = new Set(nonBreakPeriods.map(e => e.subject_name).filter(Boolean)).size;

      setTimetable({
        classId,
        className,
        schedule,
        isPublished: true,
        totalPeriods: nonBreakPeriods.length,
        uniqueSubjects,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [schoolId, classId]);

  return { timetable, loading, error, refetch: fetchTimetable };
};

/**
 * Hook for fetching timetable by teacher ID (used by teachers)
 */
export const useTeacherTimetable = (
  schoolId: string | null,
  teacherId: string | null
): UseTimetableReturn => {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = async () => {
    if (!schoolId || !teacherId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          is_break,
          is_published,
          class_id,
          subject_id,
          teacher_id,
          classes:class_id (name),
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `)
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherId)
        .order('day_of_week', { ascending: true })
        .order('period_number', { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setTimetable(null);
        return;
      }

      const entries: TimetableEntry[] = data.map((row: any) => ({
        id: row.id,
        day_of_week: row.day_of_week,
        period_number: row.period_number,
        start_time: row.start_time,
        end_time: row.end_time,
        is_break: row.is_break ?? false,
        is_published: row.is_published ?? false,
        class_id: row.class_id,
        class_name: row.classes?.name ?? 'Unknown',
        subject_id: row.subject_id,
        subject_name: row.subjects?.name ?? null,
        teacher_id: row.teacher_id,
        teacher_name: row.profiles?.full_name ?? null,
      }));

      // Group by day, then by period — merge multi-class entries per slot
      const schedule: DaySchedule[] = WEEK_DAYS.map(day => ({
        day,
        periods: entries
          .filter(e => e.day_of_week === day)
          .sort((a, b) => a.period_number - b.period_number),
      }));

      const nonBreakPeriods = entries.filter(e => !e.is_break);
      const uniqueClasses = new Set(nonBreakPeriods.map(e => e.class_id)).size;

      setTimetable({
        classId: teacherId,
        className: entries[0]?.teacher_name ?? 'Teacher',
        schedule,
        isPublished: true,
        totalPeriods: nonBreakPeriods.length,
        uniqueSubjects: uniqueClasses,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [schoolId, teacherId]);

  return { timetable, loading, error, refetch: fetchTimetable };
};
