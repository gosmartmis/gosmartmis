import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TodayClass {
  id: string;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  period_number: number;
  status: 'completed' | 'ongoing' | 'upcoming';
}

interface UseTodayScheduleReturn {
  schedule: TodayClass[];
  loading: boolean;
  error: string | null;
}

export const useTodaySchedule = (
  schoolId: string | null,
  teacherId: string | null
): UseTodayScheduleReturn => {
  const [schedule, setSchedule] = useState<TodayClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        const { data, error: fetchError } = await supabase
          .from('timetables')
          .select(`
            id,
            start_time,
            end_time,
            period_number,
            is_break,
            classes:class_id (name),
            subjects:subject_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .eq('day_of_week', today)
          .eq('is_break', false)
          .order('period_number', { ascending: true });

        if (fetchError) throw fetchError;

        const scheduleWithStatus: TodayClass[] = (data || []).map((item: any) => {
          const [startHour, startMinute] = item.start_time.split(':').map(Number);
          const [endHour, endMinute] = item.end_time.split(':').map(Number);

          let status: 'completed' | 'ongoing' | 'upcoming' = 'upcoming';

          if (
            currentHour > endHour ||
            (currentHour === endHour && currentMinute >= endMinute)
          ) {
            status = 'completed';
          } else if (
            (currentHour > startHour ||
              (currentHour === startHour && currentMinute >= startMinute)) &&
            (currentHour < endHour ||
              (currentHour === endHour && currentMinute < endMinute))
          ) {
            status = 'ongoing';
          }

          return {
            id: item.id,
            start_time: item.start_time,
            end_time: item.end_time,
            period_number: item.period_number,
            class_name: item.classes?.name ?? 'Unknown',
            subject_name: item.subjects?.name ?? 'Unknown',
            status,
          };
        });

        setSchedule(scheduleWithStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [schoolId, teacherId]);

  return { schedule, loading, error };
};
