import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface SubscriptionDistribution {
  plan: string;
  count: number;
}

export interface StudentGrowth {
  month: string;
  students: number;
}

export interface ActiveUsersData {
  month: string;
  users: number;
}

export interface SchoolMetric {
  id: string;
  name: string;
  plan: string;
  status: string;
  studentCount: number;
  staffCount: number;
  revenue: number;
  billingCycle: string;
  expiryDate: string | null;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalEnrollments: number;
  activeUsers: number;
  avgStudentsPerSchool: number;
  revenueGrowth: number;
  enrollmentGrowth: number;
}

export const useSuperAdminAnalytics = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState<SubscriptionDistribution[]>([]);
  const [studentGrowth, setStudentGrowth] = useState<StudentGrowth[]>([]);
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData[]>([]);
  const [schoolMetrics, setSchoolMetrics] = useState<SchoolMetric[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalRevenue: 0,
    totalEnrollments: 0,
    activeUsers: 0,
    avgStudentsPerSchool: 0,
    revenueGrowth: 0,
    enrollmentGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ── 1. Revenue from school_payments (last 6 months) ──────────────────
      const revenuePromises = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

        return supabase
          .from('school_payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', firstDay)
          .lte('payment_date', lastDay)
          .then(({ data }) => ({
            month: monthNames[month],
            revenue: data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0,
          }));
      });

      const revenueResults = await Promise.all(revenuePromises);
      setRevenueData(revenueResults);

      // Revenue growth: compare last month vs previous month
      const lastMonthRev = revenueResults[revenueResults.length - 1]?.revenue ?? 0;
      const prevMonthRev = revenueResults[revenueResults.length - 2]?.revenue ?? 0;
      const revenueGrowth = prevMonthRev > 0
        ? Math.round(((lastMonthRev - prevMonthRev) / prevMonthRev) * 100)
        : 0;

      // ── 2. Subscription plan distribution from schools ────────────────────
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('id, name, subscription_plan, subscription_status, subscription_amount, billing_cycle, subscription_expiry_date, is_active');

      const distribution: Record<string, number> = {};
      schoolsData?.forEach((s) => {
        const plan = s.subscription_plan || 'Free';
        distribution[plan] = (distribution[plan] || 0) + 1;
      });
      setSubscriptionDistribution(
        Object.entries(distribution).map(([plan, count]) => ({ plan, count }))
      );

      // ── 3. Student enrollment growth (last 6 months cumulative) ──────────
      const growthPromises = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

        return supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', `${lastDay}T23:59:59`)
          .eq('status', 'active')
          .then(({ count }) => ({
            month: monthNames[month],
            students: count ?? 0,
          }));
      });

      const growthResults = await Promise.all(growthPromises);
      setStudentGrowth(growthResults);

      const lastMonthStudents = growthResults[growthResults.length - 1]?.students ?? 0;
      const prevMonthStudents = growthResults[growthResults.length - 2]?.students ?? 0;
      const enrollmentGrowth = prevMonthStudents > 0
        ? Math.round(((lastMonthStudents - prevMonthStudents) / prevMonthStudents) * 100)
        : 0;

      // ── 4. Active users per month (profiles created, last 6 months) ───────
      const usersPromises = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

        return supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .lte('created_at', `${lastDay}T23:59:59`)
          .then(({ count }) => ({
            month: monthNames[month],
            users: count ?? 0,
          }));
      });

      const usersResults = await Promise.all(usersPromises);
      setActiveUsersData(usersResults);

      // ── 5. Per-school metrics ─────────────────────────────────────────────
      const schoolIds = schoolsData?.map((s) => s.id) ?? [];

      const [studentsRes, paymentsRes, profilesRes] = await Promise.all([
        supabase
          .from('students')
          .select('school_id')
          .eq('status', 'active')
          .in('school_id', schoolIds),
        supabase
          .from('school_payments')
          .select('school_id, amount')
          .eq('status', 'completed')
          .in('school_id', schoolIds),
        supabase
          .from('profiles')
          .select('school_id, role')
          .eq('is_active', true)
          .in('school_id', schoolIds),
      ]);

      const studentsBySchool: Record<string, number> = {};
      studentsRes.data?.forEach((s) => {
        studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] || 0) + 1;
      });

      const revenueBySchool: Record<string, number> = {};
      paymentsRes.data?.forEach((p) => {
        revenueBySchool[p.school_id] = (revenueBySchool[p.school_id] || 0) + Number(p.amount);
      });

      const staffBySchool: Record<string, number> = {};
      profilesRes.data?.forEach((p) => {
        if (p.role !== 'student') {
          staffBySchool[p.school_id] = (staffBySchool[p.school_id] || 0) + 1;
        }
      });

      const metrics: SchoolMetric[] = (schoolsData ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        plan: s.subscription_plan || 'Free',
        status: s.subscription_status || 'unknown',
        studentCount: studentsBySchool[s.id] ?? 0,
        staffCount: staffBySchool[s.id] ?? 0,
        revenue: revenueBySchool[s.id] ?? 0,
        billingCycle: s.billing_cycle || 'N/A',
        expiryDate: s.subscription_expiry_date ?? null,
      }));
      setSchoolMetrics(metrics);

      // ── 6. Summary stats ──────────────────────────────────────────────────
      const totalRevenue = Object.values(revenueBySchool).reduce((a, b) => a + b, 0);
      const totalEnrollments = lastMonthStudents;
      const activeUsers = usersResults[usersResults.length - 1]?.users ?? 0;
      const avgStudentsPerSchool = metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.studentCount, 0) / metrics.length)
        : 0;

      setSummary({
        totalRevenue,
        totalEnrollments,
        activeUsers,
        avgStudentsPerSchool,
        revenueGrowth,
        enrollmentGrowth,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    revenueData,
    subscriptionDistribution,
    studentGrowth,
    activeUsersData,
    schoolMetrics,
    summary,
    loading,
    error,
    refresh: fetchAnalytics,
  };
};
