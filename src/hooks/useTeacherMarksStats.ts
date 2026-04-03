import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TopStudent {
  studentId: string;
  studentName: string;
  studentCode: string;
  averageScore: number;
  rank: number;
}

export interface PendingMark {
  id: string;
  class_name: string;
  subject_name: string;
  exam_type: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

interface UseTeacherMarksStatsReturn {
  topStudents: TopStudent[];
  pendingMarks: PendingMark[];
  loading: boolean;
  error: string | null;
}

export const useTeacherMarksStats = (
  schoolId: string | null,
  teacherId: string | null,
  classId?: string
): UseTeacherMarksStatsReturn => {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [pendingMarks, setPendingMarks] = useState<PendingMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get teacher's assigned classes
        const { data: assignments } = await supabase
          .from('teacher_assignments')
          .select('class_id, subject_id')
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId);

        const classIds = classId 
          ? [classId] 
          : (assignments?.map(a => a.class_id) || []);

        if (classIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch top students for selected class
        const { data: marksData } = await supabase
          .from('marks')
          .select(`
            student_id,
            score,
            students:student_id (
              id,
              full_name,
              student_id
            )
          `)
          .eq('school_id', schoolId)
          .in('class_id', classIds)
          .eq('status', 'approved');

        // Calculate average scores per student
        const studentScores: Record<string, { total: number; count: number; student: any }> = {};
        
        marksData?.forEach(mark => {
          if (!mark.students) return;
          const studentId = mark.student_id;
          const score = Number((mark as any).score) || 0;
          if (!studentScores[studentId]) {
            studentScores[studentId] = { total: 0, count: 0, student: mark.students };
          }
          studentScores[studentId].total += score;
          studentScores[studentId].count += 1;
        });

        const studentsWithAvg = Object.entries(studentScores).map(([id, data]) => ({
          studentId: id,
          studentName: (data.student as any).full_name || 'Unknown',
          studentCode: (data.student as any).student_id || 'N/A',
          averageScore: Math.round(data.total / data.count),
        }));

        // Sort and rank
        studentsWithAvg.sort((a, b) => b.averageScore - a.averageScore);
        const topFive = studentsWithAvg.slice(0, 5).map((student, index) => ({
          ...student,
          rank: index + 1,
        }));

        setTopStudents(topFive);

        // Fetch pending marks (marks that need to be entered)
        // This would typically come from exam schedules or assignments
        // For now, we'll fetch marks with pending status
        const { data: pendingData } = await supabase
          .from('marks')
          .select(`
            id,
            exam_type,
            created_at,
            classes:class_id (name),
            subjects:subject_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        const pending = (pendingData || []).map(mark => {
          const daysOld = Math.floor(
            (Date.now() - new Date(mark.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return {
            id: mark.id,
            class_name: mark.classes?.name || 'Unknown',
            subject_name: mark.subjects?.name || 'Unknown',
            exam_type: mark.exam_type || 'Assessment',
            due_date: daysOld === 0 ? 'Today' : daysOld === 1 ? 'Tomorrow' : `In ${daysOld} days`,
            priority: (daysOld <= 1 ? 'high' : daysOld <= 3 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          };
        });

        setPendingMarks(pending);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch marks stats');
        console.error('Error fetching marks stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, teacherId, classId]);

  return { topStudents, pendingMarks, loading, error };
};