import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ClassFeeReport {
  class_name: string;
  student_count: number;
  total_fees: number;
  collected: number;
  outstanding: number;
  collection_rate: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  year: number;
  month_num: number;
}

export function useFinancialReports(schoolId: string | null) {
  const [classFeeReport, setClassFeeReport] = useState<ClassFeeReport[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId) {
      fetchReports();
    }
  }, [schoolId]);

  const fetchReports = async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch fee records grouped by class with school_id filter
      const { data: feeData, error: feeError } = await supabase
        .from('fee_records')
        .select(`
          id,
          total_amount,
          amount_paid,
          students!inner (
            id,
            school_id,
            class_id,
            classes (
              id,
              name
            )
          )
        `)
        .eq('students.school_id', schoolId);

      if (feeError) throw feeError;

      // Group by class
      const classMap = new Map<string, {
        class_name: string;
        student_ids: Set<string>;
        total_fees: number;
        collected: number;
      }>();

      (feeData || []).forEach((record: any) => {
        const className = record.students?.classes?.name || 'Unknown';
        const studentId = record.students?.id;
        
        if (!classMap.has(className)) {
          classMap.set(className, {
            class_name: className,
            student_ids: new Set(),
            total_fees: 0,
            collected: 0,
          });
        }

        const classData = classMap.get(className)!;
        if (studentId) classData.student_ids.add(studentId);
        classData.total_fees += record.total_amount || 0;
        classData.collected += record.amount_paid || 0;
      });

      const classReports: ClassFeeReport[] = Array.from(classMap.values()).map(data => {
        const outstanding = data.total_fees - data.collected;
        const collection_rate = data.total_fees > 0 
          ? Math.round((data.collected / data.total_fees) * 100) 
          : 0;

        return {
          class_name: data.class_name,
          student_count: data.student_ids.size,
          total_fees: data.total_fees,
          collected: data.collected,
          outstanding,
          collection_rate,
        };
      });

      setClassFeeReport(classReports);

      // Fetch monthly revenue (last 6 months) with school_id filter
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: paymentData, error: paymentError } = await supabase
        .from('fee_payments')
        .select(`
          amount,
          payment_date,
          fee_records!inner (
            students!inner (
              school_id
            )
          )
        `)
        .eq('fee_records.students.school_id', schoolId)
        .gte('payment_date', sixMonthsAgo.toISOString())
        .eq('status', 'completed');

      if (paymentError) throw paymentError;

      // Group by month
      const monthMap = new Map<string, { revenue: number; year: number; month_num: number }>();

      (paymentData || []).forEach((payment: any) => {
        const date = new Date(payment.payment_date);
        const year = date.getFullYear();
        const month_num = date.getMonth() + 1;
        const monthKey = `${year}-${String(month_num).padStart(2, '0')}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { revenue: 0, year, month_num });
        }
        
        const monthData = monthMap.get(monthKey)!;
        monthData.revenue += payment.amount;
      });

      const revenueData: MonthlyRevenue[] = Array.from(monthMap.entries())
        .map(([month, data]) => ({ 
          month, 
          revenue: data.revenue,
          year: data.year,
          month_num: data.month_num
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setMonthlyRevenue(revenueData);

    } catch (err: any) {
      console.error('Error fetching financial reports:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  return { classFeeReport, monthlyRevenue, loading, error, refetch: fetchReports };
}