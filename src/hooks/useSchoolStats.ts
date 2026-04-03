import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeTerms: number;
  pendingMarks: number;
  todayAttendanceRate: number;
}

interface UseSchoolStatsReturn {
  stats: SchoolStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSchoolStats = (schoolId: string | null): UseSchoolStatsReturn => {
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch total students
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      if (studentsError) throw studentsError;

      // Fetch total teachers
      const { count: teachersCount, error: teachersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'teacher');

      if (teachersError) throw teachersError;

      // Fetch total classes
      const { count: classesCount, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);

      if (classesError) throw classesError;

      // Fetch active terms
      const { count: termsCount, error: termsError } = await supabase
        .from('terms')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (termsError) throw termsError;

      // Fetch pending marks
      const { count: pendingMarksCount, error: marksError } = await supabase
        .from('marks')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'pending');

      if (marksError) throw marksError;

      // Fetch today's attendance rate
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('school_id', schoolId)
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalClasses: classesCount || 0,
        activeTerms: termsCount || 0,
        pendingMarks: pendingMarksCount || 0,
        todayAttendanceRate: Math.round(attendanceRate)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school stats');
      console.error('Error fetching school stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [schoolId]);

  return { stats, loading, error, refetch: fetchStats };
};