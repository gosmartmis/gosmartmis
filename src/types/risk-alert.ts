/**
 * Risk Alert Types and Interfaces
 */

export type AlertType = 
  | 'low-performance'
  | 'consecutive-absences'
  | 'fees-delay'
  | 'high-failure-rate'
  | 'invalid-marks';

export type AlertStatus = 'new' | 'reviewed' | 'resolved';

export type AlertSeverity = 'high' | 'medium' | 'low';

export interface RiskAlert {
  id: string;
  school_id: string;
  student_id?: string;
  student_name?: string;
  class_name?: string;
  subject?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description: string;
  triggered_by: string;
  triggered_at: string;
  status: AlertStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  notes?: string;
  metadata?: {
    average_score?: number;
    absent_days?: number;
    days_overdue?: number;
    failure_rate?: number;
    entered_marks?: number;
    max_marks?: number;
  };
}

export interface AlertStats {
  total: number;
  new: number;
  reviewed: number;
  resolved: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
}

export interface AlertFilter {
  status?: AlertStatus;
  severity?: AlertSeverity;
  alert_type?: AlertType;
  class_name?: string;
  search?: string;
}