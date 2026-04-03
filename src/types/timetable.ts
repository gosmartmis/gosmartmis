export interface Period {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject?: string;
  teacher?: string;
  teacherId?: string;
  isBreak?: boolean;
}

export interface DaySchedule {
  day: string;
  periods: Period[];
}

export interface ClassTimetable {
  classId: string;
  className: string;
  schedule: DaySchedule[];
  publishedAt?: string;
  publishedBy?: string;
  status: 'draft' | 'published';
}

export interface TeacherAssignment {
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classIds: string[];
  periodsPerWeek: number;
}

export interface TimetableConfig {
  periodsPerDay: number;
  schoolDays: string[];
  periodDuration: number; // in minutes
  breakPeriods: number[]; // period numbers that are breaks
  startTime: string;
}

export interface TimetableConflict {
  type: 'teacher' | 'class';
  message: string;
  day: string;
  period: number;
  affectedClasses?: string[];
  affectedTeacher?: string;
}