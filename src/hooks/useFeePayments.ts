import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { notifyFeePayment } from '../utils/notificationService';

interface FeePayment {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  amount: number;
  payment_method: 'cash' | 'bank' | 'mobile';
  reference_number: string;
  payment_date: string;
  status: 'completed' | 'pending' | 'failed';
}

export function useFeePayments(schoolId: string | null) {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchPayments = async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('fee_payments')
        .select(`
          id,
          student_id,
          amount,
          payment_method,
          reference_number,
          payment_date,
          status,
          students!inner (
            id,
            full_name,
            school_id,
            classes (
              name
            )
          )
        `)
        .eq('students.school_id', schoolId)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const formattedPayments: FeePayment[] = (data || []).map((payment: any) => ({
        id: payment.id,
        student_id: payment.student_id,
        student_name: payment.students?.full_name || '',
        class_name: payment.students?.classes?.name || 'N/A',
        amount: payment.amount,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.reference_number || 'N/A',
        payment_date: payment.payment_date,
        status: payment.status || 'completed',
      }));

      setPayments(formattedPayments);
    } catch (err: any) {
      console.error('Error fetching fee payments:', err);
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (paymentData: {
    student_id: string;
    fee_record_id: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    notes?: string;
    student_name?: string;
  }) => {
    try {
      // Insert payment record
      const { data: payment, error: paymentError } = await supabase
        .from('fee_payments')
        .insert({
          student_id: paymentData.student_id,
          fee_record_id: paymentData.fee_record_id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          reference_number: paymentData.reference_number,
          payment_date: new Date().toISOString(),
          status: 'completed',
          notes: paymentData.notes,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update fee record amount_paid
      const { data: feeRecord, error: feeError } = await supabase
        .from('fee_records')
        .select('amount_paid')
        .eq('id', paymentData.fee_record_id)
        .single();

      if (feeError) throw feeError;

      const newAmountPaid = (feeRecord.amount_paid || 0) + paymentData.amount;

      const { error: updateError } = await supabase
        .from('fee_records')
        .update({ amount_paid: newAmountPaid })
        .eq('id', paymentData.fee_record_id);

      if (updateError) throw updateError;

      // Fire notification to Director / School Manager / Accountant
      if (schoolId) {
        notifyFeePayment(
          schoolId,
          paymentData.student_name || 'A student',
          paymentData.amount,
          paymentData.payment_method,
        );
      }

      // Refresh payments list
      await fetchPayments();

      return { success: true, payment };
    } catch (err: any) {
      console.error('Error recording payment:', err);
      return { success: false, error: err.message };
    }
  };

  return { payments, loading, error, refetch: fetchPayments, recordPayment };
}