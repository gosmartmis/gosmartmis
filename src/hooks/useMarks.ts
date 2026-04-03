import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Mark {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  teacher_id: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  remarks?: string;
  status: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  student_name?: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
}

interface UseMarksReturn {
  marks: Mark[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateMarkStatus: (markId: string, status: string, approvedBy?: string, rejectionReason?: string) => Promise<void>;
}

interface UseMarksOptions {
  schoolId: string | null;
  classId?: string;
  subjectId?: string;
  termId?: string;
  teacherId?: string;
  studentId?: string;
  status?: string;
}

export const useMarks = (options: UseMarksOptions): UseMarksReturn => {
  const { schoolId, classId, subjectId, termId, teacherId, studentId, status } = options;
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarks = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('marks')
        .select(`
          *,
          students:student_id (
            full_name
          ),
          subjects:subject_id (
            name
          ),
          classes:class_id (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (classId) query = query.eq('class_id', classId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (termId) query = query.eq('term_id', termId);
      if (teacherId) query = query.eq('teacher_id', teacherId);
      if (studentId) query = query.eq('student_id', studentId);
      if (status) query = query.eq('status', status);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const marksWithNames = (data || []).map(mark => ({
        ...mark,
        student_name: (mark.students as { full_name?: string } | null)?.full_name || 'Unknown',
        subject_name: mark.subjects?.name || 'Unknown',
        class_name: mark.classes?.name || 'Unknown',
        teacher_name: (mark.profiles as { full_name?: string } | null)?.full_name || 'Unknown'
      }));

      setMarks(marksWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch marks');
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMarkStatus = async (
    markId: string,
    newStatus: string,
    approvedBy?: string,
    rejectionReason?: string,
  ): Promise<void> => {
    const update: Record<string, unknown> = { status: newStatus };
    if (approvedBy) update.approved_by = approvedBy;
    if (rejectionReason) update.remarks = rejectionReason;
    const { error } = await supabase.from('marks').update(update).eq('id', markId);
    if (error) throw error;
    await fetchMarks();
  };

  useEffect(() => {
    fetchMarks();
  }, [schoolId, classId, subjectId, termId, teacherId, studentId, status]);

  return { marks, loading, error, refetch: fetchMarks, updateMarkStatus };
};

// Hook for aggregated marks statistics
export const useMarksStats = (schoolId: string | null, termId?: string) => {
  const [stats, setStats] = useState<{
    averageScore: number;
    totalAssessments: number;
    pendingApprovals: number;
    topPerformers: Array<{ student_name: string; average: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('marks')
          .select(`
            score,
            max_score,
            status,
            student_id,
            students:student_id (
              full_name
            )
          `)
          .eq('school_id', schoolId);

        if (termId) query = query.eq('term_id', termId);

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const marksData = data || [];
        
        // Calculate average score
        const averageScore = marksData.length > 0 ? marksData.reduce((sum, mark) => {
          const pct = (Number((mark as any).score) || 0) / (Number((mark as any).max_score) || 100) * 100;
          return sum + pct;
        }, 0) / marksData.length : 0;

        // Count pending approvals
        const pendingApprovals = marksData.filter(m => m.status === 'pending').length;

        // Calculate top performers
        const studentScores = new Map<string, { name: string; total: number; count: number }>();
        
        marksData.forEach(mark => {
          const studentName = (mark.students as { full_name?: string } | null)?.full_name || 'Unknown';
          const pct = (Number((mark as any).score) || 0) / (Number((mark as any).max_score) || 100) * 100;
          
          if (studentScores.has(mark.student_id)) {
            const existing = studentScores.get(mark.student_id)!;
            existing.total += pct;
            existing.count += 1;
          } else {
            studentScores.set(mark.student_id, {
              name: studentName,
              total: pct,
              count: 1
            });
          }
        });

        const topPerformers = Array.from(studentScores.values())
          .map(student => ({
            student_name: student.name,
            average: student.total / student.count
          }))
          .sort((a, b) => b.average - a.average)
          .slice(0, 10);

        setStats({
          averageScore: Math.round(averageScore),
          totalAssessments: marksData.length,
          pendingApprovals,
          topPerformers
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch marks stats');
        console.error('Error fetching marks stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, termId]);

  return { stats, loading, error };
};