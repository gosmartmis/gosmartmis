import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SchoolBilling {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_package: string;
  subscription_status: string;
  billing_cycle: string;
  subscription_start_date: string | null;
  subscription_expiry_date: string | null;
  subscription_amount: number;
  subscription_discount: number;
  auto_renew: boolean;
  max_students: number;
  disabled_modules: string[];
  is_active: boolean;
  created_at: string;
  studentCount?: number;
  totalPaid?: number;
}

export interface SchoolPayment {
  id: string;
  school_id: string;
  amount: number;
  discount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
  status: 'completed' | 'pending' | 'failed';
  notes: string | null;
  created_at: string;
  school?: { name: string; slug: string };
}

export interface NewPaymentData {
  school_id: string;
  amount: number;
  discount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
}

export interface UpdateSubscriptionData {
  subscription_package?: string;
  subscription_status?: string;
  billing_cycle?: string;
  subscription_start_date?: string;
  subscription_expiry_date?: string;
  subscription_amount?: number;
  subscription_discount?: number;
  auto_renew?: boolean;
  max_students?: number;
  disabled_modules?: string[];
  is_active?: boolean;
}

export const useSubscriptions = () => {
  const [schools, setSchools] = useState<SchoolBilling[]>([]);
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schools with subscription data
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, slug, subscription_plan, subscription_package, subscription_status, billing_cycle, subscription_start_date, subscription_expiry_date, subscription_amount, subscription_discount, auto_renew, max_students, disabled_modules, is_active, created_at')
        .order('created_at', { ascending: false });

      if (schoolsError) throw schoolsError;

      // Fetch student counts per school
      const { data: studentCounts } = await supabase
        .from('students')
        .select('school_id')
        .eq('status', 'active');

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('school_payments')
        .select('*, school:schools(name, slug)')
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Build student count map
      const countMap: Record<string, number> = {};
      (studentCounts || []).forEach((s: { school_id: string }) => {
        countMap[s.school_id] = (countMap[s.school_id] || 0) + 1;
      });

      // Build total paid map per school
      const paidMap: Record<string, number> = {};
      (paymentsData || []).forEach((p: SchoolPayment) => {
        if (p.status === 'completed') {
          paidMap[p.school_id] = (paidMap[p.school_id] || 0) + Number(p.amount);
        }
      });

      const enriched: SchoolBilling[] = (schoolsData || []).map((s) => ({
        ...s,
        subscription_amount: Number(s.subscription_amount) || 0,
        subscription_discount: Number(s.subscription_discount) || 0,
        disabled_modules: s.disabled_modules || [],
        studentCount: countMap[s.id] || 0,
        totalPaid: paidMap[s.id] || 0,
      }));

      setSchools(enriched);
      setPayments(paymentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSubscription = async (schoolId: string, data: UpdateSubscriptionData) => {
    const { error: updateError } = await supabase
      .from('schools')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', schoolId);

    if (updateError) throw updateError;
    await fetchData();
  };

  const addPayment = async (data: NewPaymentData) => {
    const { error: insertError } = await supabase
      .from('school_payments')
      .insert(data);

    if (insertError) throw insertError;
    await fetchData();
  };

  const suspendSchool = async (schoolId: string) => {
    await updateSubscription(schoolId, { subscription_status: 'suspended', is_active: false });
  };

  const reactivateSchool = async (schoolId: string) => {
    await updateSubscription(schoolId, { subscription_status: 'active', is_active: true });
  };

  return {
    schools,
    payments,
    loading,
    error,
    refetch: fetchData,
    updateSubscription,
    addPayment,
    suspendSchool,
    reactivateSchool,
  };
};
