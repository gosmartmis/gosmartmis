export interface SchoolBranding {
  logo: string;
  name: string;
  motto: string;
  address: string;
  phone: string;
  academicYear: string;
  term: string;
}

export interface StudentInfo {
  name: string;
  studentCode: string;
  class: string;
  academicYear: string;
  term: string;
}

export interface SubjectPerformance {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface ReportCardData {
  schoolBranding: SchoolBranding;
  studentInfo: StudentInfo;
  subjects: SubjectPerformance[];
  totalScore: number;
  maxTotalScore: number;
  averageScore: number;
  classRank: number;
  totalStudents: number;
  attendance: AttendanceSummary;
  teacherComment: string;
  directorComment: string;
  decision: 'promoted' | 'repeat' | 'conditional';
  generatedDate: string;
}

export interface ReportCardStatus {
  studentId: string;
  studentName: string;
  class: string;
  term: string;
  academicYear: string;
  marksApproved: boolean;
  reportCardGenerated: boolean;
  feesBalance: number;
  downloadLocked: boolean;
  generatedDate?: string;
  downloadedDate?: string;
}