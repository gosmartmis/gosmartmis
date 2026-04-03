import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SuperAdminStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalStudents: number;
  monthlyRevenue: number;
}

export const useSuperAdminStats = () => {
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Total schools count
        const { count: schoolsCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true });

        // Active subscriptions count
        const { count: activeSubsCount } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active')
          .eq('is_active', true);

        // Total students count across all schools
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Monthly revenue (current month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: paymentsData } = await supabase
          .from('school_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('payment_date', lastDayOfMonth.toISOString().split('T')[0]);

        const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        setStats({
          totalSchools: schoolsCount || 0,
          activeSubscriptions: activeSubsCount || 0,
          totalStudents: studentsCount || 0,
          monthlyRevenue,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        console.error('Error fetching super admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};