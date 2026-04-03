import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RiskAlert, AlertType, AlertSeverity } from '../types/risk-alert';

interface StudentAtRiskData {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  class_id: string;
  risk_categories: string[];
  risk_level: 'high' | 'medium' | 'low';
  average_score?: number;
  attendance_rate?: number;
  fee_balance?: number;
  failing_subjects?: string[];
  consecutive_absences?: number;
  last_updated: string;
}

interface UseRealRiskAlertsReturn {
  alerts: RiskAlert[];
  studentsAtRisk: StudentAtRiskData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateAlertStatus: (
    alertId: string,
    status: 'reviewed' | 'resolved',
    reviewerName: string,
    notes?: string
  ) => void;
}

export const useRealRiskAlerts = (schoolId: string | null): UseRealRiskAlertsReturn => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [studentsAtRisk, setStudentsAtRisk] = useState<StudentAtRiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ── 1. Fetch students with their class names ──────────────────────────
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, student_id, class_id, classes:class_id(name)')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      const studentMap = new Map<
        string,
        { full_name: string; student_id: string; class_name: string; class_id: string }
      >();
      (studentsData || []).forEach((s: any) => {
        studentMap.set(s.id, {
          full_name: s.full_name,
          student_id: s.student_id,
          class_name: s.classes?.name || 'N/A',
          class_id: s.class_id,
        });
      });

      // ── 2. Fetch approved marks with subject names ────────────────────────
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('student_id, score, max_score, percentage, subjects:subject_id(name)')
        .eq('school_id', schoolId)
        .eq('status', 'approved');

      if (marksError) throw marksError;

      // Group marks by student
      const studentMarksMap = new Map<
        string,
        { scores: number[]; failingSubjects: Set<string> }
      >();
      (marksData || []).forEach((m: any) => {
        const pct =
          m.percentage != null
            ? Number(m.percentage)
            : m.max_score > 0
            ? (m.score / m.max_score) * 100
            : 0;
        const subjectName = m.subjects?.name || 'Unknown';
        const existing = studentMarksMap.get(m.student_id);
        if (existing) {
          existing.scores.push(pct);
          if (pct < 50) existing.failingSubjects.add(subjectName);
        } else {
          const failingSubjects = new Set<string>();
          if (pct < 50) failingSubjects.add(subjectName);
          studentMarksMap.set(m.student_id, { scores: [pct], failingSubjects });
        }
      });

      // ── 3. Fetch attendance (last 30 days) ────────────────────────────────
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('student_id, status, date')
        .eq('school_id', schoolId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false });

      if (attError) throw attError;

      // Group attendance by student
      const studentAttMap = new Map<
        string,
        { present: number; total: number; consecutiveAbsent: number; lastProcessed: boolean }
      >();
      (attendanceData || []).forEach((a: any) => {
        const existing = studentAttMap.get(a.student_id);
        if (existing) {
          existing.total += 1;
          if (a.status === 'present') {
            existing.present += 1;
            if (!existing.lastProcessed) existing.consecutiveAbsent = 0;
            existing.lastProcessed = true;
          } else if (a.status === 'absent') {
            if (!existing.lastProcessed) existing.consecutiveAbsent += 1;
          }
        } else {
          studentAttMap.set(a.student_id, {
            present: a.status === 'present' ? 1 : 0,
            total: 1,
            consecutiveAbsent: a.status === 'absent' ? 1 : 0,
            lastProcessed: a.status === 'present',
          });
        }
      });

      // ── 4. Fetch fee records with outstanding balance ─────────────────────
      const { data: feeData, error: feeError } = await supabase
        .from('fee_records')
        .select('student_id, balance, due_date, status')
        .eq('school_id', schoolId)
        .neq('status', 'paid');

      if (feeError) throw feeError;

      // Group fee balances by student
      const studentFeeMap = new Map<string, { balance: number; daysOverdue: number }>();
      (feeData || []).forEach((f: any) => {
        const balance = Number(f.balance) || 0;
        if (balance <= 0) return;
        const dueDate = f.due_date ? new Date(f.due_date) : null;
        const daysOverdue = dueDate
          ? Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        const existing = studentFeeMap.get(f.student_id);
        if (existing) {
          existing.balance += balance;
          existing.daysOverdue = Math.max(existing.daysOverdue, daysOverdue);
        } else {
          studentFeeMap.set(f.student_id, { balance, daysOverdue });
        }
      });

      // ── 5. Build risk profiles ────────────────────────────────────────────
      const generatedAlerts: RiskAlert[] = [];
      const atRiskStudents: StudentAtRiskData[] = [];
      const now = new Date().toISOString();

      studentMap.forEach((student, studentId) => {
        const marksInfo = studentMarksMap.get(studentId);
        const attInfo = studentAttMap.get(studentId);
        const feeInfo = studentFeeMap.get(studentId);

        const avgScore = marksInfo
          ? Math.round(marksInfo.scores.reduce((a, b) => a + b, 0) / marksInfo.scores.length)
          : undefined;
        const attRate = attInfo
          ? Math.round((attInfo.present / attInfo.total) * 100)
          : undefined;
        const feeBalance = feeInfo?.balance;
        const consecutiveAbsences = attInfo?.consecutiveAbsent;
        const failingSubjects = marksInfo
          ? Array.from(marksInfo.failingSubjects)
          : [];

        const riskCategories: string[] = [];

        // Low performance
        if (avgScore !== undefined && avgScore < 60) {
          riskCategories.push('low-performance');
        }
        // Multiple failures (3+ subjects failing)
        if (failingSubjects.length >= 3) {
          riskCategories.push('multiple-failures');
        }
        // Frequent absences
        if (
          (attRate !== undefined && attRate < 75) ||
          (consecutiveAbsences !== undefined && consecutiveAbsences >= 3)
        ) {
          riskCategories.push('frequent-absences');
        }
        // Unpaid fees
        if (feeBalance !== undefined && feeBalance > 0) {
          riskCategories.push('unpaid-fees');
        }

        if (riskCategories.length === 0) return;

        // Determine risk level
        const isHighRisk =
          (avgScore !== undefined && avgScore < 45) ||
          (consecutiveAbsences !== undefined && consecutiveAbsences >= 5) ||
          (attRate !== undefined && attRate < 60) ||
          riskCategories.length >= 3;
        const isMediumRisk =
          !isHighRisk &&
          ((avgScore !== undefined && avgScore < 60) ||
            (consecutiveAbsences !== undefined && consecutiveAbsences >= 3) ||
            (attRate !== undefined && attRate < 75) ||
            riskCategories.length >= 2);
        const riskLevel: 'high' | 'medium' | 'low' = isHighRisk
          ? 'high'
          : isMediumRisk
          ? 'medium'
          : 'low';

        // Build student at-risk record
        atRiskStudents.push({
          id: `risk-${studentId}`,
          student_id: studentId,
          student_name: student.full_name,
          student_code: student.student_id,
          class_name: student.class_name,
          class_id: student.class_id,
          risk_categories: riskCategories,
          risk_level: riskLevel,
          average_score: avgScore,
          attendance_rate: attRate,
          fee_balance: feeBalance,
          failing_subjects: failingSubjects,
          consecutive_absences: consecutiveAbsences,
          last_updated: now,
        });

        // Generate individual alerts per risk category
        if (riskCategories.includes('low-performance') && avgScore !== undefined) {
          const severity: AlertSeverity = avgScore < 45 ? 'high' : avgScore < 55 ? 'medium' : 'low';
          generatedAlerts.push({
            id: `perf-${studentId}`,
            school_id: schoolId,
            student_id: studentId,
            student_name: student.full_name,
            class_name: student.class_name,
            alert_type: 'low-performance' as AlertType,
            severity,
            description: `${student.full_name} (${student.class_name}) has an average score of ${avgScore}%. Intervention required.`,
            triggered_by: 'System Auto-Detection',
            triggered_at: now,
            status: 'new',
            metadata: { average_score: avgScore },
          });
        }

        if (riskCategories.includes('frequent-absences')) {
          const severity: AlertSeverity =
            (consecutiveAbsences !== undefined && consecutiveAbsences >= 5) ||
            (attRate !== undefined && attRate < 60)
              ? 'high'
              : 'medium';
          const desc =
            consecutiveAbsences !== undefined && consecutiveAbsences >= 3
              ? `${student.full_name} (${student.class_name}) has been absent for ${consecutiveAbsences} consecutive days.`
              : `${student.full_name} (${student.class_name}) attendance rate is ${attRate}% (below 75%).`;
          generatedAlerts.push({
            id: `att-${studentId}`,
            school_id: schoolId,
            student_id: studentId,
            student_name: student.full_name,
            class_name: student.class_name,
            alert_type: 'consecutive-absences' as AlertType,
            severity,
            description: desc,
            triggered_by: 'Attendance System',
            triggered_at: now,
            status: 'new',
            metadata: {
              absent_days: consecutiveAbsences,
            },
          });
        }

        if (riskCategories.includes('unpaid-fees') && feeInfo) {
          const severity: AlertSeverity =
            feeInfo.daysOverdue >= 60 ? 'high' : feeInfo.daysOverdue >= 30 ? 'medium' : 'low';
          generatedAlerts.push({
            id: `fee-${studentId}`,
            school_id: schoolId,
            student_id: studentId,
            student_name: student.full_name,
            class_name: student.class_name,
            alert_type: 'fees-delay' as AlertType,
            severity,
            description: `${student.full_name} (${student.class_name}) has an outstanding fee balance of ${feeInfo.balance.toLocaleString()} RWF${feeInfo.daysOverdue > 0 ? `, ${feeInfo.daysOverdue} days overdue` : ''}.`,
            triggered_by: 'Finance System',
            triggered_at: now,
            status: 'new',
            metadata: { days_overdue: feeInfo.daysOverdue },
          });
        }

        if (riskCategories.includes('multiple-failures') && failingSubjects.length >= 3) {
          generatedAlerts.push({
            id: `fail-${studentId}`,
            school_id: schoolId,
            student_id: studentId,
            student_name: student.full_name,
            class_name: student.class_name,
            alert_type: 'high-failure-rate' as AlertType,
            severity: failingSubjects.length >= 4 ? 'high' : 'medium',
            description: `${student.full_name} (${student.class_name}) is failing ${failingSubjects.length} subjects: ${failingSubjects.join(', ')}.`,
            triggered_by: 'Academic Analysis System',
            triggered_at: now,
            status: 'new',
            metadata: { failure_rate: Math.round((failingSubjects.length / (marksInfo?.scores.length || 1)) * 100) },
          });
        }
      });

      // Sort: high severity first, then by student name
      const severityOrder = { high: 0, medium: 1, low: 2 };
      generatedAlerts.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
      atRiskStudents.sort(
        (a, b) =>
          severityOrder[a.risk_level] - severityOrder[b.risk_level]
      );

      setAlerts(generatedAlerts);
      setStudentsAtRisk(atRiskStudents);
    } catch (err) {
      console.error('Error computing risk alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to compute risk alerts');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Local status update (optimistic — no DB table for alerts yet)
  const updateAlertStatus = (
    alertId: string,
    status: 'reviewed' | 'resolved',
    reviewerName: string,
    notes?: string
  ) => {
    const now = new Date().toISOString();
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        return {
          ...a,
          status,
          reviewed_by: reviewerName,
          reviewed_at: now,
          ...(status === 'resolved' ? { resolved_by: reviewerName, resolved_at: now } : {}),
          ...(notes ? { notes } : {}),
        };
      })
    );
  };

  return { alerts, studentsAtRisk, loading, error, refetch: fetchData, updateAlertStatus };
};
