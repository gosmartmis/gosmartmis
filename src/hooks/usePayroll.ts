import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface StaffSalary {
  id: string;
  school_id: string;
  staff_name: string;
  role: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  is_active: boolean;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  school_id: string;
  staff_salary_id: string | null;
  staff_name: string;
  role: string;
  pay_period: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: 'Pending' | 'Processing' | 'Paid';
  payment_date: string | null;
  created_at: string;
}

export interface PayrollSummary {
  totalStaff: number;
  totalBaseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetPay: number;
  paidCount: number;
  pendingCount: number;
  processingCount: number;
}

export function usePayroll(payPeriod: string) {
  const { profile } = useAuth();
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStaffSalaries = useCallback(async () => {
    if (!profile?.school_id) return;
    const { data, error: err } = await supabase
      .from('staff_salaries')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .order('base_salary', { ascending: false });
    if (err) { setError(err.message); return; }
    setStaffSalaries(data ?? []);
  }, [profile?.school_id]);

  const fetchPayrollRecords = useCallback(async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('pay_period', payPeriod)
      .order('net_pay', { ascending: false });
    if (err) { setError(err.message); }
    else { setPayrollRecords(data ?? []); }
    setLoading(false);
  }, [profile?.school_id, payPeriod]);

  useEffect(() => {
    if (profile?.school_id) {
      fetchStaffSalaries();
      fetchPayrollRecords();
    }
  }, [fetchStaffSalaries, fetchPayrollRecords, profile?.school_id]);

  const generatePayroll = useCallback(async () => {
    if (!profile?.school_id || staffSalaries.length === 0) return;
    setProcessing(true);
    try {
      const existing = payrollRecords.map(r => r.staff_salary_id).filter(Boolean);
      const toInsert = staffSalaries
        .filter(ss => !existing.includes(ss.id))
        .map(ss => ({
          school_id: profile.school_id,
          staff_salary_id: ss.id,
          staff_name: ss.staff_name,
          role: ss.role,
          pay_period: payPeriod,
          base_salary: ss.base_salary,
          allowances: ss.allowances,
          deductions: ss.deductions,
          net_pay: ss.net_pay,
          status: 'Pending' as const,
          payment_date: null,
        }));
      if (toInsert.length === 0) {
        showToast('error', 'All staff already have records for this period.');
        return;
      }
      const { error: err } = await supabase.from('payroll_records').insert(toInsert);
      if (err) throw err;
      showToast('success', `Payroll generated for ${toInsert.length} staff members.`);
      await fetchPayrollRecords();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to generate payroll.');
    } finally {
      setProcessing(false);
    }
  }, [profile?.school_id, staffSalaries, payrollRecords, payPeriod, fetchPayrollRecords]);

  const markAsPaid = useCallback(async (recordId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { error: err } = await supabase
      .from('payroll_records')
      .update({ status: 'Paid', payment_date: today, updated_at: new Date().toISOString() })
      .eq('id', recordId);
    if (err) { showToast('error', 'Failed to update status.'); return; }
    setPayrollRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, status: 'Paid', payment_date: today } : r
    ));
    showToast('success', 'Marked as Paid.');
  }, []);

  const markAllPending = useCallback(async () => {
    if (!profile?.school_id) return;
    setProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const pendingIds = payrollRecords
        .filter(r => r.status === 'Pending' || r.status === 'Processing')
        .map(r => r.id);
      if (pendingIds.length === 0) { showToast('error', 'No pending records to process.'); return; }
      const { error: err } = await supabase
        .from('payroll_records')
        .update({ status: 'Paid', payment_date: today, updated_at: new Date().toISOString() })
        .in('id', pendingIds);
      if (err) throw err;
      showToast('success', `${pendingIds.length} payments processed successfully.`);
      await fetchPayrollRecords();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to process payroll.');
    } finally {
      setProcessing(false);
    }
  }, [profile?.school_id, payrollRecords, fetchPayrollRecords]);

  const addStaffMember = useCallback(async (data: Omit<StaffSalary, 'id' | 'school_id' | 'net_pay' | 'created_at' | 'is_active'>) => {
    if (!profile?.school_id) return false;
    const { error: err } = await supabase.from('staff_salaries').insert({
      ...data,
      school_id: profile.school_id,
      is_active: true,
    });
    if (err) { showToast('error', err.message); return false; }
    showToast('success', 'Staff member added.');
    await fetchStaffSalaries();
    return true;
  }, [profile?.school_id, fetchStaffSalaries]);

  const updateStaffSalary = useCallback(async (id: string, data: Partial<StaffSalary>) => {
    const { error: err } = await supabase
      .from('staff_salaries')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) { showToast('error', err.message); return false; }
    showToast('success', 'Salary record updated.');
    await fetchStaffSalaries();
    return true;
  }, [fetchStaffSalaries]);

  const summary: PayrollSummary = {
    totalStaff: payrollRecords.length,
    totalBaseSalary: payrollRecords.reduce((s, r) => s + r.base_salary, 0),
    totalAllowances: payrollRecords.reduce((s, r) => s + r.allowances, 0),
    totalDeductions: payrollRecords.reduce((s, r) => s + r.deductions, 0),
    totalNetPay: payrollRecords.reduce((s, r) => s + r.net_pay, 0),
    paidCount: payrollRecords.filter(r => r.status === 'Paid').length,
    pendingCount: payrollRecords.filter(r => r.status === 'Pending').length,
    processingCount: payrollRecords.filter(r => r.status === 'Processing').length,
  };

  return {
    staffSalaries,
    payrollRecords,
    loading,
    processing,
    error,
    toast,
    summary,
    generatePayroll,
    markAsPaid,
    markAllPending,
    addStaffMember,
    updateStaffSalary,
    refetch: fetchPayrollRecords,
  };
}
