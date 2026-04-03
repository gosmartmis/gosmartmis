export interface StudentPromotionData {
  id: string;
  student_code: string;
  student_name: string;
  current_class: string;
  gender: 'male' | 'female';
  average_score: number;
  attendance_rate: number;
  promotion_status: 'promoted' | 'repeat' | 'conditional';
  next_class?: string;
  reason?: string;
}

export interface ClassDistribution {
  class_name: string;
  total_students: number;
  boys: number;
  girls: number;
  avg_performance: number;
  high_performers: number;
  medium_performers: number;
  low_performers: number;
  students: StudentPromotionData[];
}

export interface PromotionPreview {
  academic_year: string;
  total_students: number;
  promoted: number;
  repeat: number;
  conditional: number;
  class_distributions: ClassDistribution[];
}

export interface PromotionHistory {
  id: string;
  academic_year: string;
  executed_by: string;
  executed_at: string;
  total_promoted: number;
  total_repeat: number;
  total_conditional: number;
  notes?: string;
}