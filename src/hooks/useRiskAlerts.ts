import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RiskAlert {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  type: 'low_performance' | 'attendance' | 'fees';
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
}

interface UseRiskAlertsReturn {
  alerts: RiskAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRiskAlerts = (schoolId: string | null): UseRiskAlertsReturn => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskAlerts = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allAlerts: RiskAlert[] = [];

      // Fetch students with low performance (average < 60%)
      const { data: marksData } = await supabase
        .from('marks')
        .select(`
          student_id,
          score,
          max_score,
          students:student_id (
            id,
            full_name,
            classes:class_id (name)
          )
        `)
        .eq('school_id', schoolId)
        .eq('status', 'approved');

      // Group marks by student
      const studentMarks = new Map<string, { total: number; count: number; student: any }>();
      marksData?.forEach(mark => {
        if (!mark.students) return;
        const pct = (Number((mark as any).score) || 0) / (Number((mark as any).max_score) || 100) * 100;
        const existing = studentMarks.get(mark.student_id);
        if (existing) {
          existing.total += pct;
          existing.count += 1;
        } else {
          studentMarks.set(mark.student_id, {
            total: pct,
            count: 1,
            student: mark.students
          });
        }
      });

      // Create alerts for low performers
      studentMarks.forEach((data, studentId) => {
        const average = data.total / data.count;
        if (average < 60) {
          allAlerts.push({
            id: `perf-${studentId}`,
            student_id: studentId,
            student_name: (data.student as { full_name?: string }).full_name || 'Unknown',
            class_name: (data.student as any).classes?.name || 'N/A',
            type: 'low_performance',
            description: `Average score below 60% (${Math.round(average)}%)`,
            severity: average < 40 ? 'high' : 'medium',
            status: 'new',
            created_at: new Date().toISOString()
          });
        }
      });

      // Fetch students with poor attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          student_id,
          status,
          date,
          students:student_id (
            id,
            full_name,
            classes:class_id (name)
          )
        `)
        .eq('school_id', schoolId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Group attendance by student
      const studentAttendance = new Map<string, { present: number; total: number; student: any; consecutiveAbsent: number }>();
      const sortedAttendance = (attendanceData || []).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      sortedAttendance.forEach(att => {
        if (!att.students) return;
        const existing = studentAttendance.get(att.student_id);
        if (existing) {
          existing.total += 1;
          if (att.status === 'present') {
            existing.present += 1;
            existing.consecutiveAbsent = 0;
          } else if (att.status === 'absent') {
            existing.consecutiveAbsent += 1;
          }
        } else {
          studentAttendance.set(att.student_id, {
            present: att.status === 'present' ? 1 : 0,
            total: 1,
            student: att.students,
            consecutiveAbsent: att.status === 'absent' ? 1 : 0
          });
        }
      });

      // Create alerts for poor attendance
      studentAttendance.forEach((data, studentId) => {
        const rate = (data.present / data.total) * 100;
        if (rate < 75 || data.consecutiveAbsent >= 3) {
          allAlerts.push({
            id: `att-${studentId}`,
            student_id: studentId,
            student_name: (data.student as { full_name?: string }).full_name || 'Unknown',
            class_name: (data.student as any).classes?.name || 'N/A',
            type: 'attendance',
            description: data.consecutiveAbsent >= 3 
              ? `Absent for ${data.consecutiveAbsent} consecutive days`
              : `Attendance rate ${Math.round(rate)}% (below 75%)`,
            severity: data.consecutiveAbsent >= 5 || rate < 50 ? 'high' : 'medium',
            status: 'new',
            created_at: new Date().toISOString()
          });
        }
      });

      // Fetch students with unpaid fees
      const { data: feeData } = await supabase
        .from('fee_records')
        .select(`
          student_id,
          total_amount,
          amount_paid,
          students:student_id (
            id,
            full_name,
            classes:class_id (name)
          )
        `)
        .eq('school_id', schoolId)
        .neq('status', 'paid');

      feeData?.forEach(fee => {
        if (!fee.students) return;
        const balance = (fee as any).total_amount - (fee as any).amount_paid;
        if (balance > 0) {
          const daysSinceCreation = 30; // Simplified
          if (daysSinceCreation >= 30) {
            allAlerts.push({
              id: `fee-${fee.student_id}`,
              student_id: fee.student_id,
              student_name: (fee.students as { full_name?: string }).full_name || 'Unknown',
              class_name: (fee.students as any).classes?.name || 'N/A',
              type: 'fees',
              description: `Fees unpaid for ${daysSinceCreation} days (Balance: ${balance} RWF)`,
              severity: daysSinceCreation >= 60 ? 'high' : 'medium',
              status: 'new',
              created_at: new Date().toISOString()
            });
          }
        }
      });

      // Sort by severity and date
      allAlerts.sort((a, b) => {
        if (a.severity !== b.severity) {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAlerts(allAlerts.slice(0, 10)); // Limit to 10 most critical
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk alerts');
      console.error('Error fetching risk alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskAlerts();
  }, [schoolId]);

  return { alerts, loading, error, refetch: fetchRiskAlerts };
};