import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TeacherClass {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  students_count: number;
  schedule: string;
  room: string;
  average_score: number;
  attendance_rate: number;
}

export interface ClassStudent {
  id: string;
  student_id: string;
  name: string;
  roll_no: string;
  parent_name: string;
  parent_phone: string;
  avg_score: number;
  attendance: number;
}

interface UseTeacherClassesReturn {
  classes: TeacherClass[];
  students: ClassStudent[];
  loading: boolean;
  error: string | null;
  fetchStudentsByClass: (classId: string) => Promise<void>;
}

export const useTeacherClasses = (
  schoolId: string | null,
  teacherId: string | null
): UseTeacherClassesReturn => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get teacher's assignments with class and subject info
        const { data: assignments, error: assignError } = await supabase
          .from('teacher_assignments')
          .select(`
            id,
            class_id,
            subject_id,
            classes:class_id (
              id,
              name
            ),
            subjects:subject_id (
              id,
              name
            )
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', teacherId);

        if (assignError) throw assignError;

        // For each assignment, get stats
        const classesWithStats = await Promise.all(
          (assignments || []).map(async (assignment) => {
            const classId = assignment.class_id;

            // Count students in class
            const { count: studentCount } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('school_id', schoolId)
              .eq('class_id', classId);

            // Get average score for this class
            const { data: marksData } = await supabase
              .from('marks')
              .select('score')
              .eq('school_id', schoolId)
              .eq('class_id', classId)
              .eq('status', 'approved');

            const avgScore = marksData && marksData.length > 0
              ? Math.round(marksData.reduce((sum, m) => sum + m.score, 0) / marksData.length)
              : 0;

            // Get attendance rate for this class
            const { data: attendanceData } = await supabase
              .from('attendance')
              .select('status')
              .eq('school_id', schoolId)
              .eq('class_id', classId);

            const attendanceRate = attendanceData && attendanceData.length > 0
              ? Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100)
              : 0;

            // Get schedule from timetable
            const { data: timetableData } = await supabase
              .from('timetables')
              .select('day_of_week, time_start, room')
              .eq('school_id', schoolId)
              .eq('teacher_id', teacherId)
              .eq('class_id', classId)
              .limit(3);

            const schedule = timetableData && timetableData.length > 0
              ? `${timetableData.map(t => t.day_of_week.substring(0, 3)).join(', ')} - ${timetableData[0].time_start}`
              : 'Not scheduled';

            const room = timetableData && timetableData.length > 0
              ? timetableData[0].room || 'TBA'
              : 'TBA';

            return {
              id: assignment.id,
              class_id: classId,
              class_name: assignment.classes?.name || 'Unknown',
              subject_id: assignment.subject_id,
              subject_name: assignment.subjects?.name || 'Unknown',
              students_count: studentCount || 0,
              schedule,
              room,
              average_score: avgScore,
              attendance_rate: attendanceRate,
            };
          })
        );

        setClasses(classesWithStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch classes');
        console.error('Error fetching teacher classes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [schoolId, teacherId]);

  const fetchStudentsByClass = async (classId: string) => {
    if (!schoolId || !teacherId) return;

    try {
      setLoading(true);
      setError(null);

      // Guard: teacher can only access students in assigned classes
      const { count: assignmentCount, error: assignmentError } = await supabase
        .from('teacher_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherId)
        .eq('class_id', classId);

      if (assignmentError) throw assignmentError;
      if (!assignmentCount) {
        throw new Error('Access denied: class is not assigned to you');
      }

      // Get students in the class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          student_id,
          parent_name,
          parent_phone
        `)
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // For each student, calculate avg score and attendance
      const studentsWithStats = await Promise.all(
        (studentsData || []).map(async (student) => {
          // Get average score
          const { data: marksData } = await supabase
            .from('marks')
            .select('score')
            .eq('school_id', schoolId)
            .eq('student_id', student.id)
            .eq('status', 'approved');

          const avgScore = marksData && marksData.length > 0
            ? Math.round(marksData.reduce((sum, m) => sum + m.score, 0) / marksData.length)
            : 0;

          // Get attendance rate
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('status')
            .eq('school_id', schoolId)
            .eq('student_id', student.id);

          const attendanceRate = attendanceData && attendanceData.length > 0
            ? Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100)
            : 0;

          return {
            id: student.id,
            student_id: (student as any).student_id,
            name: student.full_name || 'Unknown',
            roll_no: (student as any).student_id || 'N/A',
            parent_name: (student as any).parent_name || 'N/A',
            parent_phone: (student as any).parent_phone || 'N/A',
            avg_score: avgScore,
            attendance: attendanceRate,
          };
        })
      );

      setStudents(studentsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  return { classes, students, loading, error, fetchStudentsByClass };
};