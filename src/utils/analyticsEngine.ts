export interface ClassPerformance {
  className: string;
  averageScore: number;
  totalStudents: number;
  passRate: number;
}

export interface SubjectPerformance {
  subjectName: string;
  averageScore: number;
  totalStudents: number;
  passRate: number;
}

export interface TermTrend {
  term: string;
  averageScore: number;
  passRate: number;
}

export interface AnalyticsSummary {
  overallAverage: number;
  totalStudents: number;
  overallPassRate: number;
  bestClass: ClassPerformance;
  weakestClass: ClassPerformance;
  bestSubject: SubjectPerformance;
  weakestSubject: SubjectPerformance;
  classPerformances: ClassPerformance[];
  subjectPerformances: SubjectPerformance[];
  termTrends: TermTrend[];
}

export class AnalyticsEngine {
  private marks: Array<{
    studentId: string;
    studentName: string;
    className: string;
    subject: string;
    score: number;
    maxScore: number;
    term: string;
    status: string;
  }>;

  constructor(marks: any[]) {
    this.marks = marks.filter(m => m.status === 'approved');
  }

  calculateAnalytics(): AnalyticsSummary {
    const classPerformances = this.calculateClassPerformances();
    const subjectPerformances = this.calculateSubjectPerformances();
    const termTrends = this.calculateTermTrends();

    const bestClass = classPerformances.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );

    const weakestClass = classPerformances.reduce((weakest, current) => 
      current.averageScore < weakest.averageScore ? current : weakest
    );

    const bestSubject = subjectPerformances.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );

    const weakestSubject = subjectPerformances.reduce((weakest, current) => 
      current.averageScore < weakest.averageScore ? current : weakest
    );

    const totalScores = this.marks.reduce((sum, mark) => 
      sum + (mark.score / mark.maxScore) * 100, 0
    );
    const overallAverage = this.marks.length > 0 ? totalScores / this.marks.length : 0;

    const uniqueStudents = new Set(this.marks.map(m => m.studentId));
    const totalStudents = uniqueStudents.size;

    const passCount = this.marks.filter(m => (m.score / m.maxScore) * 100 >= 60).length;
    const overallPassRate = this.marks.length > 0 ? (passCount / this.marks.length) * 100 : 0;

    return {
      overallAverage: Math.round(overallAverage * 10) / 10,
      totalStudents,
      overallPassRate: Math.round(overallPassRate * 10) / 10,
      bestClass,
      weakestClass,
      bestSubject,
      weakestSubject,
      classPerformances,
      subjectPerformances,
      termTrends
    };
  }

  private calculateClassPerformances(): ClassPerformance[] {
    const classGroups = this.groupBy(this.marks, 'className');
    const performances: ClassPerformance[] = [];

    for (const [className, marks] of Object.entries(classGroups)) {
      const totalScore = marks.reduce((sum, mark) => 
        sum + (mark.score / mark.maxScore) * 100, 0
      );
      const averageScore = marks.length > 0 ? totalScore / marks.length : 0;
      
      const uniqueStudents = new Set(marks.map(m => m.studentId));
      const totalStudents = uniqueStudents.size;

      const passCount = marks.filter(m => (m.score / m.maxScore) * 100 >= 60).length;
      const passRate = marks.length > 0 ? (passCount / marks.length) * 100 : 0;

      performances.push({
        className,
        averageScore: Math.round(averageScore * 10) / 10,
        totalStudents,
        passRate: Math.round(passRate * 10) / 10
      });
    }

    return performances.sort((a, b) => b.averageScore - a.averageScore);
  }

  private calculateSubjectPerformances(): SubjectPerformance[] {
    const subjectGroups = this.groupBy(this.marks, 'subject');
    const performances: SubjectPerformance[] = [];

    for (const [subjectName, marks] of Object.entries(subjectGroups)) {
      const totalScore = marks.reduce((sum, mark) => 
        sum + (mark.score / mark.maxScore) * 100, 0
      );
      const averageScore = marks.length > 0 ? totalScore / marks.length : 0;
      
      const uniqueStudents = new Set(marks.map(m => m.studentId));
      const totalStudents = uniqueStudents.size;

      const passCount = marks.filter(m => (m.score / m.maxScore) * 100 >= 60).length;
      const passRate = marks.length > 0 ? (passCount / marks.length) * 100 : 0;

      performances.push({
        subjectName,
        averageScore: Math.round(averageScore * 10) / 10,
        totalStudents,
        passRate: Math.round(passRate * 10) / 10
      });
    }

    return performances.sort((a, b) => b.averageScore - a.averageScore);
  }

  private calculateTermTrends(): TermTrend[] {
    const termGroups = this.groupBy(this.marks, 'term');
    const trends: TermTrend[] = [];

    for (const [term, marks] of Object.entries(termGroups)) {
      const totalScore = marks.reduce((sum, mark) => 
        sum + (mark.score / mark.maxScore) * 100, 0
      );
      const averageScore = marks.length > 0 ? totalScore / marks.length : 0;

      const passCount = marks.filter(m => (m.score / m.maxScore) * 100 >= 60).length;
      const passRate = marks.length > 0 ? (passCount / marks.length) * 100 : 0;

      trends.push({
        term,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10
      });
    }

    return trends;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
}