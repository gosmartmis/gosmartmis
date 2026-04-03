import type { StudentPromotionData, PromotionHistory } from '../types/promotion';

export const studentsForPromotion: StudentPromotionData[] = [
  // P1A Students
  { id: '1', student_code: 'STD001', student_name: 'Jean Uwimana', current_class: 'P1A', gender: 'male', average_score: 78, attendance_rate: 95, promotion_status: 'promoted' },
  { id: '2', student_code: 'STD002', student_name: 'Alice Mukamana', current_class: 'P1A', gender: 'female', average_score: 82, attendance_rate: 92, promotion_status: 'promoted' },
  { id: '3', student_code: 'STD003', student_name: 'Patrick Niyonzima', current_class: 'P1A', gender: 'male', average_score: 65, attendance_rate: 88, promotion_status: 'promoted' },
  { id: '4', student_code: 'STD004', student_name: 'Grace Umutoni', current_class: 'P1A', gender: 'female', average_score: 71, attendance_rate: 94, promotion_status: 'promoted' },
  { id: '5', student_code: 'STD005', student_name: 'Eric Habimana', current_class: 'P1A', gender: 'male', average_score: 54, attendance_rate: 85, promotion_status: 'conditional' },
  { id: '6', student_code: 'STD006', student_name: 'Sarah Ingabire', current_class: 'P1A', gender: 'female', average_score: 88, attendance_rate: 97, promotion_status: 'promoted' },
  { id: '7', student_code: 'STD007', student_name: 'David Mugisha', current_class: 'P1A', gender: 'male', average_score: 45, attendance_rate: 78, promotion_status: 'repeat' },
  { id: '8', student_code: 'STD008', student_name: 'Emma Uwase', current_class: 'P1A', gender: 'female', average_score: 76, attendance_rate: 91, promotion_status: 'promoted' },
  { id: '9', student_code: 'STD009', student_name: 'Kevin Nshuti', current_class: 'P1A', gender: 'male', average_score: 69, attendance_rate: 89, promotion_status: 'promoted' },
  { id: '10', student_code: 'STD010', student_name: 'Linda Mutesi', current_class: 'P1A', gender: 'female', average_score: 91, attendance_rate: 98, promotion_status: 'promoted' },
  
  // P1B Students
  { id: '11', student_code: 'STD011', student_name: 'Brian Kamanzi', current_class: 'P1B', gender: 'male', average_score: 73, attendance_rate: 90, promotion_status: 'promoted' },
  { id: '12', student_code: 'STD012', student_name: 'Claire Uwineza', current_class: 'P1B', gender: 'female', average_score: 67, attendance_rate: 87, promotion_status: 'promoted' },
  { id: '13', student_code: 'STD013', student_name: 'Frank Nsengimana', current_class: 'P1B', gender: 'male', average_score: 85, attendance_rate: 96, promotion_status: 'promoted' },
  { id: '14', student_code: 'STD014', student_name: 'Helen Uwera', current_class: 'P1B', gender: 'female', average_score: 79, attendance_rate: 93, promotion_status: 'promoted' },
  { id: '15', student_code: 'STD015', student_name: 'Isaac Bizimana', current_class: 'P1B', gender: 'male', average_score: 52, attendance_rate: 82, promotion_status: 'conditional' },
  { id: '16', student_code: 'STD016', student_name: 'Jane Iradukunda', current_class: 'P1B', gender: 'female', average_score: 74, attendance_rate: 91, promotion_status: 'promoted' },
  { id: '17', student_code: 'STD017', student_name: 'Martin Uwizeye', current_class: 'P1B', gender: 'male', average_score: 48, attendance_rate: 76, promotion_status: 'repeat' },
  { id: '18', student_code: 'STD018', student_name: 'Nancy Mukeshimana', current_class: 'P1B', gender: 'female', average_score: 81, attendance_rate: 94, promotion_status: 'promoted' },
  { id: '19', student_code: 'STD019', student_name: 'Oscar Nkurunziza', current_class: 'P1B', gender: 'male', average_score: 70, attendance_rate: 88, promotion_status: 'promoted' },
  { id: '20', student_code: 'STD020', student_name: 'Rose Nyirahabimana', current_class: 'P1B', gender: 'female', average_score: 86, attendance_rate: 97, promotion_status: 'promoted' },

  // P2A Students
  { id: '21', student_code: 'STD021', student_name: 'Samuel Mugabo', current_class: 'P2A', gender: 'male', average_score: 77, attendance_rate: 92, promotion_status: 'promoted' },
  { id: '22', student_code: 'STD022', student_name: 'Tina Uwamahoro', current_class: 'P2A', gender: 'female', average_score: 83, attendance_rate: 95, promotion_status: 'promoted' },
  { id: '23', student_code: 'STD023', student_name: 'Victor Hakizimana', current_class: 'P2A', gender: 'male', average_score: 62, attendance_rate: 86, promotion_status: 'promoted' },
  { id: '24', student_code: 'STD024', student_name: 'Wendy Umuhoza', current_class: 'P2A', gender: 'female', average_score: 75, attendance_rate: 90, promotion_status: 'promoted' },
  { id: '25', student_code: 'STD025', student_name: 'Xavier Ndayisaba', current_class: 'P2A', gender: 'male', average_score: 55, attendance_rate: 83, promotion_status: 'conditional' },
  { id: '26', student_code: 'STD026', student_name: 'Yvonne Mukamana', current_class: 'P2A', gender: 'female', average_score: 89, attendance_rate: 98, promotion_status: 'promoted' },
  { id: '27', student_code: 'STD027', student_name: 'Zachary Niyitegeka', current_class: 'P2A', gender: 'male', average_score: 43, attendance_rate: 75, promotion_status: 'repeat' },
  { id: '28', student_code: 'STD028', student_name: 'Angela Uwimana', current_class: 'P2A', gender: 'female', average_score: 72, attendance_rate: 89, promotion_status: 'promoted' },
  { id: '29', student_code: 'STD029', student_name: 'Benjamin Mugisha', current_class: 'P2A', gender: 'male', average_score: 68, attendance_rate: 87, promotion_status: 'promoted' },
  { id: '30', student_code: 'STD030', student_name: 'Catherine Uwase', current_class: 'P2A', gender: 'female', average_score: 92, attendance_rate: 99, promotion_status: 'promoted' },
];

export const promotionHistory: PromotionHistory[] = [
  {
    id: '1',
    academic_year: '2023-2024',
    executed_by: 'Director John Doe',
    executed_at: '2024-07-15T10:30:00Z',
    total_promoted: 245,
    total_repeat: 12,
    total_conditional: 18,
    notes: 'Annual promotion completed successfully. All parallel classes balanced.',
  },
  {
    id: '2',
    academic_year: '2022-2023',
    executed_by: 'Director John Doe',
    executed_at: '2023-07-20T09:15:00Z',
    total_promoted: 238,
    total_repeat: 15,
    total_conditional: 22,
    notes: 'Promotion completed with manual adjustments for 5 students.',
  },
];