import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AccountantStats {
  totalFeesCollected: number;
  outstandingFees: number;
  monthlyRevenue: number;
  lockedReportCards: number;
  loading: boolean;
  error: string | null;
}

export function useAccountantStats(schoolId: string | null) {
  const [stats, setStats] = useState<AccountantStats>({
    totalFeesCollected: 0,
    outstandingFees: 0,
    monthlyRevenue: 0,
    lockedReportCards: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (schoolId) {
      fetchStats();
    } else {
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [schoolId]);

  const fetchStats = async () => {
    if (!schoolId) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Get all fee records for this school
      const { data: feeRecords, error: feeError } = await supabase
        .from('fee_records')
        .select(`
          total_amount,
          amount_paid,
          students!inner (
            school_id
          )
        `)
        .eq('students.school_id', schoolId);

      if (feeError) throw feeError;

      // Calculate totals
      const totalFeesCollected = feeRecords?.reduce((sum, record) => sum + (record.amount_paid || 0), 0) || 0;
      const totalExpected = feeRecords?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0;
      const outstandingFees = totalExpected - totalFeesCollected;

      // Get current month's payments for this school
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      
      const { data: monthlyPayments, error: paymentsError } = await supabase
        .from('fee_payments')
        .select(`
          amount,
          students!inner (
            school_id
          )
        `)
        .eq('students.school_id', schoolId)
        .gte('payment_date', firstDayOfMonth);

      if (paymentsError) throw paymentsError;

      const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Get locked report cards count for this school
      const { data: lockedCards, error: lockedError } = await supabase
        .from('report_cards')
        .select(`
          id,
          students!inner (
            school_id
          )
        `)
        .eq('students.school_id', schoolId)
        .eq('is_locked', true);

      if (lockedError) throw lockedError;

      setStats({
        totalFeesCollected,
        outstandingFees,
        monthlyRevenue,
        lockedReportCards: lockedCards?.length || 0,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching accountant stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch stats',
      }));
    }
  };

  return { ...stats, refetch: fetchStats };
}