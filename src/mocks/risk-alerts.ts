import type { RiskAlert } from '../types/risk-alert';

export const mockRiskAlerts: RiskAlert[] = [
  {
    id: 'alert-001',
    school_id: 'elite-school',
    student_id: 'std-001',
    student_name: 'Jean Uwimana',
    class_name: 'P4 A',
    alert_type: 'low-performance',
    severity: 'high',
    description: 'Student Jean Uwimana (P4 A) average score is 54%. Immediate intervention required.',
    triggered_by: 'System Auto-Detection',
    triggered_at: '2025-01-15T08:30:00Z',
    status: 'new',
    metadata: {
      average_score: 54
    }
  },
  {
    id: 'alert-002',
    school_id: 'elite-school',
    student_id: 'std-002',
    student_name: 'Alice Mukamana',
    class_name: 'P3 B',
    alert_type: 'consecutive-absences',
    severity: 'high',
    description: 'Student Alice Mukamana (P3 B) has been absent for 3 consecutive days (Jan 13-15).',
    triggered_by: 'Attendance System',
    triggered_at: '2025-01-15T14:00:00Z',
    status: 'new',
    metadata: {
      absent_days: 3
    }
  },
  {
    id: 'alert-003',
    school_id: 'elite-school',
    student_id: 'std-003',
    student_name: 'Kevin Niyonzima',
    class_name: 'P5 A',
    alert_type: 'fees-delay',
    severity: 'medium',
    description: 'Student Kevin Niyonzima (P5 A) has unpaid school fees 32 days after term start.',
    triggered_by: 'Finance System',
    triggered_at: '2025-01-14T09:00:00Z',
    status: 'reviewed',
    reviewed_by: 'Director Mugisha',
    reviewed_at: '2025-01-14T16:30:00Z',
    metadata: {
      days_overdue: 32
    }
  },
  {
    id: 'alert-004',
    school_id: 'elite-school',
    class_name: 'P4 A',
    subject: 'Mathematics',
    alert_type: 'high-failure-rate',
    severity: 'high',
    description: 'Mathematics in P4 A has high failure rate (45% of students scoring below pass mark).',
    triggered_by: 'Academic Analysis System',
    triggered_at: '2025-01-13T11:20:00Z',
    status: 'reviewed',
    reviewed_by: 'Dean Kamanzi',
    reviewed_at: '2025-01-13T15:45:00Z',
    metadata: {
      failure_rate: 45
    }
  },
  {
    id: 'alert-005',
    school_id: 'elite-school',
    student_id: 'std-004',
    student_name: 'Grace Uwase',
    class_name: 'P2 C',
    subject: 'Science',
    alert_type: 'invalid-marks',
    severity: 'medium',
    description: 'Invalid marks entry detected for Science. Teacher entered 25/20 for Grace Uwase.',
    triggered_by: 'Marks Validation System',
    triggered_at: '2025-01-12T10:15:00Z',
    status: 'resolved',
    reviewed_by: 'Dean Kamanzi',
    reviewed_at: '2025-01-12T11:00:00Z',
    resolved_by: 'Teacher Mutesi',
    resolved_at: '2025-01-12T14:30:00Z',
    notes: 'Marks corrected to 18/20. Teacher reminded about validation rules.',
    metadata: {
      entered_marks: 25,
      max_marks: 20
    }
  },
  {
    id: 'alert-006',
    school_id: 'elite-school',
    student_id: 'std-005',
    student_name: 'Patrick Habimana',
    class_name: 'P6 B',
    alert_type: 'low-performance',
    severity: 'high',
    description: 'Student Patrick Habimana (P6 B) average score is 48%. Critical intervention needed.',
    triggered_by: 'System Auto-Detection',
    triggered_at: '2025-01-14T07:45:00Z',
    status: 'reviewed',
    reviewed_by: 'Dean Kamanzi',
    reviewed_at: '2025-01-14T10:20:00Z',
    notes: 'Parent meeting scheduled for Jan 18. Extra tutoring arranged.'
  },
  {
    id: 'alert-007',
    school_id: 'elite-school',
    student_id: 'std-006',
    student_name: 'Sarah Ingabire',
    class_name: 'P1 A',
    alert_type: 'consecutive-absences',
    severity: 'high',
    description: 'Student Sarah Ingabire (P1 A) has been absent for 4 consecutive days (Jan 11-14).',
    triggered_by: 'Attendance System',
    triggered_at: '2025-01-14T15:30:00Z',
    status: 'new',
    metadata: {
      absent_days: 4
    }
  },
  {
    id: 'alert-008',
    school_id: 'elite-school',
    student_id: 'std-007',
    student_name: 'Emmanuel Nkusi',
    class_name: 'P5 C',
    alert_type: 'fees-delay',
    severity: 'high',
    description: 'Student Emmanuel Nkusi (P5 C) has unpaid school fees 45 days after term start.',
    triggered_by: 'Finance System',
    triggered_at: '2025-01-15T08:00:00Z',
    status: 'new',
    metadata: {
      days_overdue: 45
    }
  },
  {
    id: 'alert-009',
    school_id: 'elite-school',
    class_name: 'P3 A',
    subject: 'English',
    alert_type: 'high-failure-rate',
    severity: 'medium',
    description: 'English in P3 A has high failure rate (42% of students scoring below pass mark).',
    triggered_by: 'Academic Analysis System',
    triggered_at: '2025-01-12T16:00:00Z',
    status: 'resolved',
    reviewed_by: 'Dean Kamanzi',
    reviewed_at: '2025-01-13T09:00:00Z',
    resolved_by: 'Director Mugisha',
    resolved_at: '2025-01-14T11:00:00Z',
    notes: 'Additional English lessons scheduled. Teacher training provided.'
  },
  {
    id: 'alert-010',
    school_id: 'elite-school',
    student_id: 'std-008',
    student_name: 'Divine Uwera',
    class_name: 'P4 B',
    alert_type: 'low-performance',
    severity: 'medium',
    description: 'Student Divine Uwera (P4 B) average score is 58%. Monitoring required.',
    triggered_by: 'System Auto-Detection',
    triggered_at: '2025-01-11T12:00:00Z',
    status: 'reviewed',
    reviewed_by: 'Dean Kamanzi',
    reviewed_at: '2025-01-12T08:30:00Z',
    metadata: {
      average_score: 58
    }
  },
  {
    id: 'alert-011',
    school_id: 'elite-school',
    student_id: 'std-009',
    student_name: 'Eric Mugabo',
    class_name: 'P2 A',
    alert_type: 'fees-delay',
    severity: 'low',
    description: 'Student Eric Mugabo (P2 A) has unpaid school fees 30 days after term start.',
    triggered_by: 'Finance System',
    triggered_at: '2025-01-10T09:00:00Z',
    status: 'resolved',
    reviewed_by: 'Accountant Uwase',
    reviewed_at: '2025-01-10T14:00:00Z',
    resolved_by: 'Accountant Uwase',
    resolved_at: '2025-01-11T10:00:00Z',
    notes: 'Payment received in full on Jan 11.',
    metadata: {
      days_overdue: 30
    }
  },
  {
    id: 'alert-012',
    school_id: 'elite-school',
    class_name: 'P5 B',
    subject: 'Science',
    alert_type: 'high-failure-rate',
    severity: 'high',
    description: 'Science in P5 B has high failure rate (48% of students scoring below pass mark).',
    triggered_by: 'Academic Analysis System',
    triggered_at: '2025-01-15T10:30:00Z',
    status: 'new'
  }
];