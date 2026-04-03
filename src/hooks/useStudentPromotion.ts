import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { determinePromotionStatus } from '../utils/promotionEngine';
import type { StudentPromotionData } from '../types/promotion';

interface RawStudent {
  id: string;
  student_id: string;
  full_name: string;
  gender: string;
  class_id: string;
  classes: { id: string; name: string } | null;
}

interface PromotionRecord {
  id: string;
  academic_year_id: string;
  student_id: string;
  from_class_id: string;
  to_class_id: string;
  average_score: number;
  promotion_status: string;
  processed_by: string;
  processed_at: string;
  notes: string | null;
  academic_years: { name: string } | null;
  profiles: { full_name: string } | null;
}

export interface PromotionHistoryItem {
  id: string;
  academic_year: string;
  executed_by: string;
  executed_at: string;
  total_promoted: number;
  total_repeat: number;
  total_conditional: number;
  notes: string | null;
}

export interface ClassInfo {
  id: string;
  name: string;
  level: number;
  section: string | null;
}

export function useStudentPromotion(schoolId: string | null) {
  const [students, setStudents] = useState<StudentPromotionData[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<PromotionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from('classes')
      .select('id, name, level, section')
      .eq('school_id', schoolId)
      .order('level', { ascending: true });
    if (data) setClasses(data as ClassInfo[]);
  }, [schoolId]);

  const fetchStudentsWithAverages = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch all active students with their class info
      const { data: rawStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, student_id, full_name, gender, class_id, classes(id, name)')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;
      if (!rawStudents || rawStudents.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Fetch approved marks for all students
      const studentIds = rawStudents.map((s: RawStudent) => s.id);
      const { data: marksData } = await supabase
        .from('marks')
        .select('student_id, percentage')
        .eq('school_id', schoolId)
        .eq('status', 'approved')
        .in('student_id', studentIds);

      // Calculate average per student
      const avgMap: Record<string, { total: number; count: number }> = {};
      (marksData || []).forEach((m: { student_id: string; percentage: number }) => {
        if (!avgMap[m.student_id]) avgMap[m.student_id] = { total: 0, count: 0 };
        avgMap[m.student_id].total += Number(m.percentage);
        avgMap[m.student_id].count += 1;
      });

      const result: StudentPromotionData[] = (rawStudents as RawStudent[]).map((s) => {
        const avg = avgMap[s.id]
          ? Math.round(avgMap[s.id].total / avgMap[s.id].count)
          : 0;
        const status = determinePromotionStatus(avg);
        return {
          id: s.id,
          student_code: s.student_id || s.id.slice(0, 8).toUpperCase(),
          student_name: s.full_name,
          current_class: s.classes?.name || 'Unknown',
          current_class_id: s.class_id,
          gender: (s.gender === 'male' || s.gender === 'female') ? s.gender : 'male',
          average_score: avg,
          attendance_rate: 100,
          promotion_status: status,
        };
      });

      setStudents(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchPromotionHistory = useCallback(async () => {
    if (!schoolId) return;
    try {
      const { data } = await supabase
        .from('student_promotions')
        .select('id, academic_year_id, promotion_status, processed_by, processed_at, notes, average_score, academic_years(name), profiles(full_name)')
        .eq('school_id', schoolId)
        .order('processed_at', { ascending: false });

      if (!data) return;

      // Group by academic_year_id + processed_at batch (same minute = same batch)
      const batchMap: Record<string, PromotionHistoryItem> = {};
      (data as unknown as PromotionRecord[]).forEach((row) => {
        const batchKey = `${row.academic_year_id}_${row.processed_at?.slice(0, 16)}`;
        if (!batchMap[batchKey]) {
          batchMap[batchKey] = {
            id: batchKey,
            academic_year: row.academic_years?.name || 'Unknown',
            executed_by: row.profiles?.full_name || 'Director',
            executed_at: row.processed_at,
            total_promoted: 0,
            total_repeat: 0,
            total_conditional: 0,
            notes: row.notes,
          };
        }
        if (row.promotion_status === 'promoted') batchMap[batchKey].total_promoted++;
        else if (row.promotion_status === 'repeat') batchMap[batchKey].total_repeat++;
        else if (row.promotion_status === 'conditional') batchMap[batchKey].total_conditional++;
      });

      setPromotionHistory(Object.values(batchMap).slice(0, 20));
    } catch {
      // silently fail history
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStudentsWithAverages();
      fetchPromotionHistory();
    }
  }, [schoolId, fetchClasses, fetchStudentsWithAverages, fetchPromotionHistory]);

  const executePromotion = async (params: {
    promotedStudents: StudentPromotionData[];
    repeatStudents: StudentPromotionData[];
    conditionalStudents: StudentPromotionData[];
    classAssignments: Record<string, string>; // studentId -> toClassId
    academicYearId: string;
    processedBy: string;
    notes: string;
  }) => {
    if (!schoolId) return { success: false, error: 'No school selected' };
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const allStudents = [
        ...params.promotedStudents,
        ...params.repeatStudents,
        ...params.conditionalStudents,
      ];

      const rows = allStudents.map((s) => ({
        school_id: schoolId,
        student_id: s.id,
        academic_year_id: params.academicYearId,
        from_class_id: (s as StudentPromotionData & { current_class_id?: string }).current_class_id || null,
        to_class_id: params.classAssignments[s.id] || null,
        average_score: s.average_score,
        promotion_status: s.promotion_status,
        processed_by: params.processedBy,
        processed_at: now,
        notes: params.notes || null,
      }));

      const { error: insertError } = await supabase
        .from('student_promotions')
        .insert(rows);

      if (insertError) throw insertError;

      // Update students' class_id for promoted students
      const promotedWithNewClass = params.promotedStudents.filter(
        (s) => params.classAssignments[s.id]
      );
      for (const s of promotedWithNewClass) {
        await supabase
          .from('students')
          .update({ class_id: params.classAssignments[s.id] })
          .eq('id', s.id)
          .eq('school_id', schoolId);
      }

      await fetchPromotionHistory();
      await fetchStudentsWithAverages();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Promotion failed' };
    } finally {
      setSaving(false);
    }
  };

  return {
    students,
    classes,
    promotionHistory,
    loading,
    saving,
    error,
    executePromotion,
    refetch: fetchStudentsWithAverages,
  };
}
