import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FeeRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  term_id: string;
  term_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: 'paid' | 'partial' | 'overdue';
}

export function useFeeRecords(schoolId: string | null, termId?: string | null) {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId) {
      fetchFeeRecords();
    } else {
      setLoading(false);
    }
  }, [schoolId, termId]);

  const fetchFeeRecords = async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('fee_records')
        .select(`
          id,
          student_id,
          term_id,
          total_amount,
          amount_paid,
          due_date,
          students!inner (
            id,
            full_name,
            school_id,
            classes (
              name
            )
          ),
          terms (
            name
          )
        `)
        .eq('students.school_id', schoolId)
        .order('due_date', { ascending: false });

      if (termId) {
        query = query.eq('term_id', termId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedRecords: FeeRecord[] = (data || []).map((record: any) => {
        const balance = record.total_amount - record.amount_paid;
        const isOverdue = new Date(record.due_date) < new Date() && balance > 0;
        const isPaid = balance === 0;
        
        return {
          id: record.id,
          student_id: record.student_id,
          student_name: record.students?.full_name || '',
          class_name: record.students?.classes?.name || 'N/A',
          term_id: record.term_id,
          term_name: record.terms?.name || 'N/A',
          total_amount: record.total_amount,
          amount_paid: record.amount_paid,
          balance,
          due_date: record.due_date,
          status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'partial',
        };
      });

      setRecords(formattedRecords);
    } catch (err: any) {
      console.error('Error fetching fee records:', err);
      setError(err.message || 'Failed to fetch fee records');
    } finally {
      setLoading(false);
    }
  };

  return { records, loading, error, refetch: fetchFeeRecords };
}