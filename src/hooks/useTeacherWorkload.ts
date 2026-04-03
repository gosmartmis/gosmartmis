import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { TeacherWorkload } from '../utils/workloadCalculator';
import { computeTeacherWorkloads, computeWorkloadSummary } from '../utils/workloadCalculator';

export interface WorkloadSummary {
  totalTeachers: number;
  overloadedCount: number;
  highWorkloadCount: number;
  normalWorkloadCount: number;
  lowWorkloadCount: number;
  averageHours: number;
  maxWorkload: TeacherWorkload | null;
  minWorkload: TeacherWorkload | null;
}

interface UseTeacherWorkloadReturn {
  workloads: TeacherWorkload[];
  summary: WorkloadSummary;
  loading: boolean;
  error: string | null;
}

interface TimetableEntry {
  teacher_id: string;
  class_id: string;
  subject_id: string | null;
  teacher_name: string;
  class_name: string;
  subject_name: string;
}

export const useTeacherWorkload = (schoolId: string | null): UseTeacherWorkloadReturn => {
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [summary, setSummary] = useState<WorkloadSummary>({
    totalTeachers: 0,
    overloadedCount: 0,
    highWorkloadCount: 0,
    normalWorkloadCount: 0,
    lowWorkloadCount: 0,
    averageHours: 0,
    maxWorkload: null,
    minWorkload: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkload = async () => {
      if (!schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all non-break timetable entries that have a teacher assigned
        const { data: ttData, error: ttError } = await supabase
          .from('timetables')
          .select(`
            teacher_id,
            class_id,
            subject_id,
            profiles:teacher_id (full_name),
            classes:class_id (name),
            subjects:subject_id (name)
          `)
          .eq('school_id', schoolId)
          .eq('is_break', false)
          .not('teacher_id', 'is', null);

        if (ttError) throw ttError;

        // Fetch all teacher profiles for this school
        const { data: teacherData, error: teacherError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('school_id', schoolId)
          .eq('role', 'teacher');

        if (teacherError) throw teacherError;

        const teachers: { id: string; name: string }[] = (teacherData ?? []).map((t: any) => ({
          id: t.id,
          name: t.full_name ?? 'Unknown',
        }));

        const entries: TimetableEntry[] = (ttData ?? [])
          .filter((r: any) => r.teacher_id)
          .map((r: any) => ({
            teacher_id: r.teacher_id,
            class_id: r.class_id,
            subject_id: r.subject_id,
            teacher_name: (r.profiles as any)?.full_name ?? 'Unknown',
            class_name: (r.classes as any)?.name ?? 'Unknown Class',
            subject_name: (r.subjects as any)?.name ?? 'Unknown Subject',
          }));

        const computed = computeTeacherWorkloads(teachers, entries);
        setWorkloads(computed);
        setSummary(computeWorkloadSummary(computed));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workload data');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkload();
  }, [schoolId]);

  return { workloads, summary, loading, error };
};
