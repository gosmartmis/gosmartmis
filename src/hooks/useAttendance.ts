import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  school_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  created_at: string;
  student_name?: string;
  class_name?: string;
}

interface UseAttendanceReturn {
  attendance: Attendance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAttendanceOptions {
  schoolId: string | null;
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export const useAttendance = (options: UseAttendanceOptions): UseAttendanceReturn => {
  const { schoolId, classId, studentId, date, startDate, endDate } = options;
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (
            full_name
          ),
          classes:class_id (
            name
          )
        `)
        .eq('school_id', schoolId)
        .order('date', { ascending: false });

      if (classId) query = query.eq('class_id', classId);
      if (studentId) query = query.eq('student_id', studentId);
      if (date) query = query.eq('date', date);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const attendanceWithNames = (data || []).map(record => ({
        ...record,
        student_name: record.students?.full_name || 'Unknown',
        class_name: record.classes?.name || 'Unknown'
      }));

      setAttendance(attendanceWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [schoolId, classId, studentId, date, startDate, endDate]);

  return { attendance, loading, error, refetch: fetchAttendance };
};

// Hook for attendance statistics
export const useAttendanceStats = (
  schoolId: string | null, 
  classId?: string, 
  date?: string
) => {
  const [stats, setStats] = useState<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendanceRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const targetDate = date || new Date().toISOString().split('T')[0];

        let query = supabase
          .from('attendance')
          .select('status')
          .eq('school_id', schoolId)
          .eq('date', targetDate);

        if (classId) query = query.eq('class_id', classId);

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const records = data || [];
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;
        const total = records.length;
        const attendanceRate = total > 0 ? (present / total) * 100 : 0;

        setStats({
          present,
          absent,
          late,
          excused,
          total,
          attendanceRate: Math.round(attendanceRate)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance stats');
        console.error('Error fetching attendance stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, classId, date]);

  return { stats, loading, error };
};