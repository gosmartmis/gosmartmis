/**
 * Mock data for students at risk
 * Used for comprehensive risk monitoring dashboard
 */

export interface StudentAtRisk {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  risk_categories: string[];
  risk_level: 'high' | 'medium' | 'low';
  average_score?: number;
  attendance_rate?: number;
  fee_balance?: number;
  failing_subjects?: string[];
  consecutive_absences?: number;
  last_updated: string;
}

export const mockStudentsAtRisk: StudentAtRisk[] = [
  {
    id: 'risk-std-001',
    student_id: 'std-001',
    student_name: 'Jean Uwimana',
    student_code: 'STD2025001',
    class_name: 'P4 A',
    risk_categories: ['low-performance', 'multiple-failures'],
    risk_level: 'high',
    average_score: 54,
    attendance_rate: 88,
    fee_balance: 0,
    failing_subjects: ['Mathematics', 'Science', 'English'],
    last_updated: '2025-01-15T08:30:00Z'
  },
  {
    id: 'risk-std-002',
    student_id: 'std-002',
    student_name: 'Alice Mukamana',
    student_code: 'STD2025002',
    class_name: 'P3 B',
    risk_categories: ['frequent-absences'],
    risk_level: 'high',
    average_score: 72,
    attendance_rate: 65,
    fee_balance: 0,
    consecutive_absences: 3,
    failing_subjects: [],
    last_updated: '2025-01-15T14:00:00Z'
  },
  {
    id: 'risk-std-003',
    student_id: 'std-003',
    student_name: 'Kevin Niyonzima',
    student_code: 'STD2025003',
    class_name: 'P5 A',
    risk_categories: ['unpaid-fees'],
    risk_level: 'medium',
    average_score: 76,
    attendance_rate: 92,
    fee_balance: 85000,
    failing_subjects: [],
    last_updated: '2025-01-14T09:00:00Z'
  },
  {
    id: 'risk-std-004',
    student_id: 'std-005',
    student_name: 'Patrick Habimana',
    student_code: 'STD2025005',
    class_name: 'P6 B',
    risk_categories: ['low-performance', 'multiple-failures'],
    risk_level: 'high',
    average_score: 48,
    attendance_rate: 85,
    fee_balance: 0,
    failing_subjects: ['Mathematics', 'Science', 'Social Studies', 'English'],
    last_updated: '2025-01-14T07:45:00Z'
  },
  {
    id: 'risk-std-005',
    student_id: 'std-006',
    student_name: 'Sarah Ingabire',
    student_code: 'STD2025006',
    class_name: 'P1 A',
    risk_categories: ['frequent-absences'],
    risk_level: 'high',
    average_score: 68,
    attendance_rate: 62,
    fee_balance: 0,
    consecutive_absences: 4,
    failing_subjects: ['Mathematics'],
    last_updated: '2025-01-14T15:30:00Z'
  },
  {
    id: 'risk-std-006',
    student_id: 'std-007',
    student_name: 'Emmanuel Nkusi',
    student_code: 'STD2025007',
    class_name: 'P5 C',
    risk_categories: ['unpaid-fees'],
    risk_level: 'high',
    average_score: 81,
    attendance_rate: 94,
    fee_balance: 120000,
    failing_subjects: [],
    last_updated: '2025-01-15T08:00:00Z'
  },
  {
    id: 'risk-std-007',
    student_id: 'std-008',
    student_name: 'Divine Uwera',
    student_code: 'STD2025008',
    class_name: 'P4 B',
    risk_categories: ['low-performance'],
    risk_level: 'medium',
    average_score: 58,
    attendance_rate: 90,
    fee_balance: 0,
    failing_subjects: ['Science', 'Mathematics'],
    last_updated: '2025-01-11T12:00:00Z'
  },
  {
    id: 'risk-std-008',
    student_id: 'std-010',
    student_name: 'Grace Mutesi',
    student_code: 'STD2025010',
    class_name: 'P2 B',
    risk_categories: ['frequent-absences', 'unpaid-fees'],
    risk_level: 'high',
    average_score: 64,
    attendance_rate: 68,
    fee_balance: 45000,
    consecutive_absences: 3,
    failing_subjects: ['English'],
    last_updated: '2025-01-13T10:20:00Z'
  },
  {
    id: 'risk-std-009',
    student_id: 'std-011',
    student_name: 'Daniel Mugisha',
    student_code: 'STD2025011',
    class_name: 'P3 A',
    risk_categories: ['multiple-failures'],
    risk_level: 'medium',
    average_score: 62,
    attendance_rate: 87,
    fee_balance: 0,
    failing_subjects: ['Mathematics', 'Science', 'Social Studies'],
    last_updated: '2025-01-12T14:15:00Z'
  },
  {
    id: 'risk-std-010',
    student_id: 'std-012',
    student_name: 'Esther Uwase',
    student_code: 'STD2025012',
    class_name: 'P5 B',
    risk_categories: ['low-performance', 'frequent-absences'],
    risk_level: 'high',
    average_score: 52,
    attendance_rate: 70,
    fee_balance: 0,
    consecutive_absences: 3,
    failing_subjects: ['Mathematics', 'English', 'Science'],
    last_updated: '2025-01-14T09:45:00Z'
  },
  {
    id: 'risk-std-011',
    student_id: 'std-013',
    student_name: 'Frank Nshuti',
    student_code: 'STD2025013',
    class_name: 'P4 A',
    risk_categories: ['unpaid-fees'],
    risk_level: 'low',
    average_score: 78,
    attendance_rate: 95,
    fee_balance: 30000,
    failing_subjects: [],
    last_updated: '2025-01-10T11:30:00Z'
  },
  {
    id: 'risk-std-012',
    student_id: 'std-014',
    student_name: 'Henriette Mukeshimana',
    student_code: 'STD2025014',
    class_name: 'P6 A',
    risk_categories: ['low-performance', 'multiple-failures', 'unpaid-fees'],
    risk_level: 'high',
    average_score: 46,
    attendance_rate: 82,
    fee_balance: 95000,
    failing_subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
    last_updated: '2025-01-15T07:20:00Z'
  },
  {
    id: 'risk-std-013',
    student_id: 'std-015',
    student_name: 'Isaac Habimana',
    student_code: 'STD2025015',
    class_name: 'P2 A',
    risk_categories: ['frequent-absences'],
    risk_level: 'medium',
    average_score: 70,
    attendance_rate: 72,
    fee_balance: 0,
    consecutive_absences: 3,
    failing_subjects: [],
    last_updated: '2025-01-13T16:00:00Z'
  },
  {
    id: 'risk-std-014',
    student_id: 'std-016',
    student_name: 'Jeanne Uwimana',
    student_code: 'STD2025016',
    class_name: 'P3 C',
    risk_categories: ['multiple-failures'],
    risk_level: 'medium',
    average_score: 63,
    attendance_rate: 89,
    fee_balance: 0,
    failing_subjects: ['Mathematics', 'Science', 'English'],
    last_updated: '2025-01-11T13:40:00Z'
  },
  {
    id: 'risk-std-015',
    student_id: 'std-017',
    student_name: 'Kevin Mugabo',
    student_code: 'STD2025017',
    class_name: 'P5 A',
    risk_categories: ['low-performance', 'unpaid-fees'],
    risk_level: 'high',
    average_score: 55,
    attendance_rate: 86,
    fee_balance: 75000,
    failing_subjects: ['Mathematics', 'Science'],
    last_updated: '2025-01-14T10:50:00Z'
  }
];