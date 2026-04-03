import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RegistrarTask {
  id: string;
  task: string;
  detail: string;
  priority: 'High' | 'Medium' | 'Low';
  priorityColor: string;
  icon: string;
  count: number;
  actionTab?: string;
}

interface RegistrarStats {
  totalStudents: number;
  newEnrollments: number;
  pendingDocuments: number;
  activeTeachers: number;
  pendingTasks: RegistrarTask[];
  recentRegistrations: Array<{
    id: string;
    student: string;
    grade: string;
    parent: string;
    phone: string;
    date: string;
    status: string;
    statusColor: string;
  }>;
  enrollmentByGrade: Array<{
    grade: string;
    target: number;
    enrolled: number;
    pending: number;
  }>;
}

export function useRegistrarStats(schoolId: string | null) {
  const [stats, setStats] = useState<RegistrarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // ── Core counts ──────────────────────────────────────────────────────
        const { count: totalStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: newEnrollments } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('created_at', sevenDaysAgo.toISOString());

        const { count: activeTeachers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('role', 'teacher');

        // ── Task sources (run in parallel) ───────────────────────────────────
        const [
          { count: unassignedCount },
          { count: inactiveCount },
          { data: recentStudents },
          { data: classes },
        ] = await Promise.all([
          // 1. Students with no class assigned
          supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .is('class_id', null),

          // 2. Students with non-active status
          supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .neq('status', 'active'),

          // 3. Recent registrations for the list
          supabase
            .from('students')
            .select(`id, full_name, parent_name, parent_phone, created_at, class_id, classes(name)`)
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })
            .limit(4),

          // 4. Classes with capacity info
          supabase
            .from('classes')
            .select(`id, name, capacity, students(count)`)
            .eq('school_id', schoolId)
            .order('name'),
        ]);

        // ── Build enrollmentByGrade ──────────────────────────────────────────
        const enrollmentByGrade = (classes || []).map((cls: any) => ({
          grade: cls.name,
          target: cls.capacity || 30,
          enrolled: cls.students?.[0]?.count || 0,
          pending: 0,
        }));

        // ── Derive real tasks from DB data ────────────────────────────────────
        const tasks: RegistrarTask[] = [];

        // Task 1 — new registrations to review
        if (newEnrollments && newEnrollments > 0) {
          tasks.push({
            id: 'new_enrollments',
            task: `Review ${newEnrollments} new registration${newEnrollments !== 1 ? 's' : ''}`,
            detail: `Student${newEnrollments !== 1 ? 's' : ''} enrolled in the past 7 days`,
            priority: newEnrollments > 5 ? 'High' : 'Medium',
            priorityColor: newEnrollments > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
            icon: 'ri-user-add-line',
            count: newEnrollments,
            actionTab: 'enrollment',
          });
        }

        // Task 2 — students with no class assigned
        if (unassignedCount && unassignedCount > 0) {
          tasks.push({
            id: 'unassigned_students',
            task: `Assign class to ${unassignedCount} student${unassignedCount !== 1 ? 's' : ''}`,
            detail: 'Enrollment is incomplete without a class',
            priority: 'High',
            priorityColor: 'bg-red-100 text-red-700',
            icon: 'ri-user-unfollow-line',
            count: unassignedCount,
            actionTab: 'students',
          });
        }

        // Task 3 — students with non-active status
        if (inactiveCount && inactiveCount > 0) {
          tasks.push({
            id: 'inactive_students',
            task: `Activate ${inactiveCount} pending student${inactiveCount !== 1 ? 's' : ''}`,
            detail: 'Accounts awaiting activation or re-enrollment',
            priority: 'Medium',
            priorityColor: 'bg-amber-100 text-amber-700',
            icon: 'ri-user-follow-line',
            count: inactiveCount,
            actionTab: 'students',
          });
        }

        // Task 4 — classes over capacity
        enrollmentByGrade
          .filter(c => c.enrolled > c.target && c.target > 0)
          .forEach(cls => {
            tasks.push({
              id: `overcapacity_${cls.grade}`,
              task: `${cls.grade} is over capacity`,
              detail: `${cls.enrolled} enrolled — limit is ${cls.target}`,
              priority: 'High',
              priorityColor: 'bg-red-100 text-red-700',
              icon: 'ri-group-line',
              count: cls.enrolled - cls.target,
              actionTab: 'enrollment',
            });
          });

        // Task 5 — classes approaching capacity (≥ 90 %)
        enrollmentByGrade
          .filter(c => {
            const pct = c.target > 0 ? c.enrolled / c.target : 0;
            return pct >= 0.9 && pct <= 1.0;
          })
          .slice(0, 2)
          .forEach(cls => {
            const pct = Math.round((cls.enrolled / cls.target) * 100);
            tasks.push({
              id: `near_capacity_${cls.grade}`,
              task: `${cls.grade} is ${pct}% full`,
              detail: `${cls.enrolled} / ${cls.target} slots taken`,
              priority: 'Low',
              priorityColor: 'bg-amber-100 text-amber-700',
              icon: 'ri-bar-chart-2-line',
              count: cls.target - cls.enrolled,
              actionTab: 'enrollment',
            });
          });

        // Task 6 — classes with zero students (only flag if school has students overall)
        if (totalStudents && totalStudents > 0) {
          const emptyClasses = enrollmentByGrade.filter(c => c.enrolled === 0);
          if (emptyClasses.length > 0) {
            tasks.push({
              id: 'empty_classes',
              task: `${emptyClasses.length} class${emptyClasses.length !== 1 ? 'es have' : ' has'} no students`,
              detail: emptyClasses.map(c => c.grade).slice(0, 3).join(', ') + (emptyClasses.length > 3 ? '…' : ''),
              priority: 'Low',
              priorityColor: 'bg-green-100 text-green-700',
              icon: 'ri-school-line',
              count: emptyClasses.length,
              actionTab: 'enrollment',
            });
          }
        }

        // ── Build recentRegistrations ────────────────────────────────────────
        const recentRegistrations = (recentStudents || []).map((student: any) => {
          const hoursAgo = Math.floor(
            (Date.now() - new Date(student.created_at).getTime()) / (1000 * 60 * 60)
          );
          const daysAgo = Math.floor(hoursAgo / 24);
          const timeAgo =
            hoursAgo < 1
              ? 'Just now'
              : hoursAgo < 24
              ? `${hoursAgo}h ago`
              : `${daysAgo}d ago`;

          return {
            id: student.id,
            student: student.full_name || 'N/A',
            grade: student.classes?.name || 'N/A',
            parent: student.parent_name || 'N/A',
            phone: student.parent_phone || 'N/A',
            date: timeAgo,
            status: 'Enrolled',
            statusColor: 'bg-green-100 text-green-700',
          };
        });

        setStats({
          totalStudents: totalStudents || 0,
          newEnrollments: newEnrollments || 0,
          pendingDocuments: 0,
          activeTeachers: activeTeachers || 0,
          pendingTasks: tasks,
          recentRegistrations,
          enrollmentByGrade,
        });
      } catch (err) {
        console.error('Error fetching registrar stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [schoolId]);

  return { stats, loading, error };
}