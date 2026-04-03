import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

interface MonthlyStats {
  month: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  day: string;
  reason?: string;
}

export function useStudentAttendance(studentId: string) {
  const [summary, setSummary] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all attendance records for the student
      const { data: records, error: recordsError } = await supabase
        .from('attendance')
        .select('date, status, remarks')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;

      if (!records || records.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate summary
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setSummary({ present, absent, late, total, percentage });

      // Calculate monthly stats
      const monthlyMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
      
      records.forEach(record => {
        const date = new Date(record.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'long' });
        
        const current = monthlyMap.get(monthKey) || { present: 0, absent: 0, late: 0, total: 0 };
        
        if (record.status === 'present') current.present++;
        else if (record.status === 'absent') current.absent++;
        else if (record.status === 'late') current.late++;
        
        current.total++;
        monthlyMap.set(monthKey, current);
      });

      const monthlyStatsData: MonthlyStats[] = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
        month,
        ...stats
      }));

      setMonthlyStats(monthlyStatsData);

      // Format recent records (last 10)
      const recentRecordsData: AttendanceRecord[] = records.slice(0, 10).map(record => {
        const date = new Date(record.date);
        return {
          date: record.date,
          status: record.status as 'present' | 'absent' | 'late',
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          reason: record.remarks || undefined
        };
      });

      setRecentRecords(recentRecordsData);

    } catch (err) {
      console.error('Error fetching student attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  return {
    summary,
    monthlyStats,
    recentRecords,
    loading,
    error,
    refetch: fetchAttendance
  };
}