import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TeacherStats {
  totalStudents: number;
  todayClasses: number;
  pendingMarks: number;
  newMessages: number;
}

interface UseTeacherStatsReturn {
  stats: TeacherStats;
  loading: boolean;
  error: string | null;
}

export const useTeacherStats = (
  schoolId: string | null,
  teacherId: string | null
): UseTeacherStatsReturn => {
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    todayClasses: 0,
    pendingMarks: 0,
    newMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get teacher's assigned classes
        const { data: assignments } = await supabase
          .from('teacher_assignments')
          .select('class_id')
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId);

        const classIds = assignments?.map(a => a.class_id) || [];

        // Count total students in teacher's classes
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .in('class_id', classIds.length > 0 ? classIds : ['']);

        // Count today's classes from timetable
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const { count: todayClassCount } = await supabase
          .from('timetables')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .eq('day_of_week', today);

        // Count pending marks (marks not yet submitted)
        const { count: pendingMarksCount } = await supabase
          .from('marks')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .eq('status', 'pending');

        // Count unread messages
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', teacherId)
          .eq('is_read', false);

        setStats({
          totalStudents: studentCount || 0,
          todayClasses: todayClassCount || 0,
          pendingMarks: pendingMarksCount || 0,
          newMessages: messageCount || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teacher stats');
        console.error('Error fetching teacher stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, teacherId]);

  return { stats, loading, error };
};