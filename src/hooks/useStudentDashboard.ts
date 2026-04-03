import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StudentInfo {
  id: string;
  name: string;
  studentId: string;
  class: string;
  classId: string;
  attendanceRate: number;
  averageScore: number;
  classRank: number;
  totalStudents: number;
  totalSchoolDays: number;
  presentDays: number;
}

interface SubjectPerformance {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface RecentMark {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  term: string;
}

interface ReportCardStatus {
  marksApproved: boolean;
  reportCardGenerated: boolean;
  feesBalance: number;
  downloadLocked: boolean;
  generatedDate: string | null;
  availableTerms: string[];
}

export type FeeUrgency = 'overdue' | 'due_today' | 'due_soon' | 'pending' | 'paid';

export interface FeeStatus {
  hasBalance: boolean;
  balance: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string | null;
  status: string | null;
  urgency: FeeUrgency;
  daysUntilDue: number | null;
}

export function useStudentDashboard(userId: string, termId?: string) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [recentMarks, setRecentMarks] = useState<RecentMark[]>([]);
  const [reportCardStatus, setReportCardStatus] = useState<ReportCardStatus | null>(null);
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchStudentData();
  }, [userId, termId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student profile with class info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          student_id,
          class_id,
          classes (
            id,
            name
          )
        `)
        .eq('profile_id', userId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) {
        setLoading(false);
        return;
      }

      const studentName = student.full_name || 'Student';
      const className = student.classes?.name || 'N/A';

      // Fetch attendance stats
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('status, date')
        .eq('student_id', student.id);

      if (attendanceError) throw attendanceError;

      const totalSchoolDays = attendanceRecords?.length || 0;
      const presentDays = attendanceRecords?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalSchoolDays > 0 ? Math.round((presentDays / totalSchoolDays) * 100) : 0;

      // Fetch marks for selected term or latest term
      let selectedTermId = termId;
      if (!selectedTermId) {
        const { data: latestTerm } = await supabase
          .from('terms')
          .select('id')
          .order('start_date', { ascending: false })
          .limit(1)
          .single();
        selectedTermId = latestTerm?.id;
      }

      // Fetch marks with subject info
      const { data: marks, error: marksError } = await supabase
        .from('marks')
        .select(`
          id,
          score,
          max_score,
          percentage,
          grade,
          created_at,
          subjects (
            name
          ),
          terms (
            name
          )
        `)
        .eq('student_id', student.id)
        .eq('term_id', selectedTermId)
        .order('created_at', { ascending: false });

      if (marksError) throw marksError;

      // Calculate subject performance
      const subjectPerf: SubjectPerformance[] = (marks || []).map(mark => {
        const maxScore = Number((mark as any).max_score) || 100;
        const score = Number((mark as any).score) || 0;
        const percentage = Number((mark as any).percentage) || Math.round((score / maxScore) * 100);
        
        return {
          subject: (mark as any).subjects?.name || 'Unknown',
          score,
          maxScore,
          percentage
        };
      });

      // Calculate average score
      const averageScore = subjectPerf.length > 0
        ? Math.round(subjectPerf.reduce((sum, s) => sum + s.percentage, 0) / subjectPerf.length)
        : 0;

      // Get recent marks (last 3)
      const recentMarksData: RecentMark[] = (marks || []).slice(0, 3).map(mark => {
        const maxScore = Number((mark as any).max_score) || 100;
        const score = Number((mark as any).score) || 0;
        const percentage = Number((mark as any).percentage) || Math.round((score / maxScore) * 100);
        
        return {
          subject: (mark as any).subjects?.name || 'Unknown',
          score,
          maxScore,
          percentage,
          date: new Date((mark as any).created_at).toLocaleDateString(),
          term: (mark as any).terms?.name || 'N/A'
        };
      });

      // Calculate class rank — get all student IDs in the same class first
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', student.class_id);

      const classStudentIds = (classStudents || []).map(s => s.id);

      const { data: classMarks, error: classMarksError } = await supabase
        .from('marks')
        .select('student_id, score')
        .eq('term_id', selectedTermId)
        .in('student_id', classStudentIds.length > 0 ? classStudentIds : [student.id]);

      if (classMarksError) throw classMarksError;

      // Group marks by student and sum scores
      const studentAverages = new Map<string, number>();
      (classMarks || []).forEach(mark => {
        const studentId = mark.student_id;
        const prev = studentAverages.get(studentId) || 0;
        studentAverages.set(studentId, prev + Number((mark as any).score || 0));
      });

      // Calculate final averages
      const averages = Array.from(studentAverages.entries()).map(([studentId, total]) => ({
        studentId,
        average: total / (marks?.length || 1)
      }));

      // Sort by average descending
      averages.sort((a, b) => b.average - a.average);

      // Find student's rank
      const classRank = averages.findIndex(a => a.studentId === student.id) + 1;
      const totalStudents = averages.length;

      // Fetch report card status
      const { data: reportCard, error: reportCardError } = await supabase
        .from('report_cards')
        .select('is_approved, is_locked, generated_at')
        .eq('student_id', student.id)
        .eq('term_id', selectedTermId)
        .maybeSingle();

      // Fetch fee balance — use correct column names from DB schema
      const { data: feeRecord } = await supabase
        .from('fee_records')
        .select('amount_due, amount_paid, balance, due_date, status')
        .eq('student_id', student.id)
        .not('status', 'eq', 'paid')
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      const amountDue   = Number(feeRecord?.amount_due  ?? 0);
      const amountPaid  = Number(feeRecord?.amount_paid ?? 0);
      const balance     = feeRecord?.balance != null
        ? Number(feeRecord.balance)
        : Math.max(0, amountDue - amountPaid);

      // Compute urgency
      let urgency: FeeUrgency = 'paid';
      let daysUntilDue: number | null = null;

      if (balance > 0) {
        if (feeRecord?.due_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(feeRecord.due_date);
          due.setHours(0, 0, 0, 0);
          daysUntilDue = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilDue < 0)       urgency = 'overdue';
          else if (daysUntilDue === 0) urgency = 'due_today';
          else if (daysUntilDue <= 7)  urgency = 'due_soon';
          else                         urgency = 'pending';
        } else {
          urgency = 'pending';
        }
      }

      const feesBalance = balance;

      setFeeStatus({
        hasBalance: balance > 0,
        balance,
        amountDue,
        amountPaid,
        dueDate: feeRecord?.due_date ?? null,
        status: feeRecord?.status ?? null,
        urgency,
        daysUntilDue,
      });

      // Fetch available terms
      const { data: terms, error: termsError } = await supabase
        .from('terms')
        .select('id, name')
        .order('start_date', { ascending: false });

      const availableTerms = (terms || []).map(t => t.name);

      const reportStatus: ReportCardStatus = {
        marksApproved: reportCard?.is_approved || false,
        reportCardGenerated: !!reportCard,
        feesBalance,
        downloadLocked: feesBalance > 0 || reportCard?.is_locked || false,
        generatedDate: reportCard?.generated_at || null,
        availableTerms
      };

      setStudentInfo({
        id: student.id,
        name: studentName,
        studentId: student.student_id,
        class: className,
        classId: student.class_id,
        attendanceRate,
        averageScore,
        classRank: classRank || 1,
        totalStudents: totalStudents || 1,
        totalSchoolDays,
        presentDays
      });

      setSubjectPerformance(subjectPerf);
      setRecentMarks(recentMarksData);
      setReportCardStatus(reportStatus);

    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  return {
    studentInfo,
    subjectPerformance,
    recentMarks,
    reportCardStatus,
    feeStatus,
    loading,
    error,
    refetch: fetchStudentData
  };
}