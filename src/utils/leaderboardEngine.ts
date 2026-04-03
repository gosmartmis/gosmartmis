import { ApprovedMark } from '../mocks/analytics-marks';

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  averageScore: number;
  totalSubjects: number;
  rank?: number;
}

export interface SubjectLeader {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  subject: string;
  score: number;
  rank?: number;
}

export interface LeaderboardData {
  schoolTopStudents: StudentPerformance[];
  classTops: Record<string, StudentPerformance[]>;
  subjectTops: Record<string, SubjectLeader[]>;
}

/**
 * Calculate student average scores and generate rankings
 */
export function calculateStudentAverages(marks: ApprovedMark[]): StudentPerformance[] {
  const studentMap = new Map<string, {
    name: string;
    code: string;
    className: string;
    totalScore: number;
    subjectCount: number;
  }>();

  // Aggregate marks by student
  marks.forEach(mark => {
    const key = mark.studentId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name: mark.studentName,
        code: mark.studentCode,
        className: mark.className,
        totalScore: 0,
        subjectCount: 0
      });
    }
    const student = studentMap.get(key)!;
    student.totalScore += mark.score;
    student.subjectCount += 1;
  });

  // Calculate averages
  const students: StudentPerformance[] = [];
  studentMap.forEach((data, studentId) => {
    students.push({
      studentId,
      studentName: data.name,
      studentCode: data.code,
      className: data.className,
      averageScore: Math.round((data.totalScore / data.subjectCount) * 10) / 10,
      totalSubjects: data.subjectCount
    });
  });

  // Sort by average score descending
  students.sort((a, b) => b.averageScore - a.averageScore);

  // Assign ranks
  students.forEach((student, index) => {
    student.rank = index + 1;
  });

  return students;
}

/**
 * Generate top students for the entire school
 */
export function getSchoolTopStudents(marks: ApprovedMark[], limit: number = 10): StudentPerformance[] {
  const allStudents = calculateStudentAverages(marks);
  return allStudents.slice(0, limit);
}

/**
 * Generate top students per class
 */
export function getClassTopStudents(marks: ApprovedMark[], limit: number = 5): Record<string, StudentPerformance[]> {
  const classTops: Record<string, StudentPerformance[]> = {};
  
  // Group marks by class
  const marksByClass = marks.reduce((acc, mark) => {
    if (!acc[mark.className]) {
      acc[mark.className] = [];
    }
    acc[mark.className].push(mark);
    return acc;
  }, {} as Record<string, ApprovedMark[]>);

  // Calculate top students for each class
  Object.keys(marksByClass).forEach(className => {
    const classMarks = marksByClass[className];
    const classStudents = calculateStudentAverages(classMarks);
    classTops[className] = classStudents.slice(0, limit);
  });

  return classTops;
}

/**
 * Generate top students per subject
 */
export function getSubjectTopStudents(marks: ApprovedMark[], limit: number = 5): Record<string, SubjectLeader[]> {
  const subjectTops: Record<string, SubjectLeader[]> = {};

  // Group marks by subject
  const marksBySubject = marks.reduce((acc, mark) => {
    if (!acc[mark.subject]) {
      acc[mark.subject] = [];
    }
    acc[mark.subject].push(mark);
    return acc;
  }, {} as Record<string, ApprovedMark[]>);

  // Get top performers for each subject
  Object.keys(marksBySubject).forEach(subject => {
    const subjectMarks = marksBySubject[subject];
    
    // Sort by score descending
    const sorted = [...subjectMarks].sort((a, b) => b.score - a.score);
    
    // Take top performers
    const topPerformers = sorted.slice(0, limit).map((mark, index) => ({
      studentId: mark.studentId,
      studentName: mark.studentName,
      studentCode: mark.studentCode,
      className: mark.className,
      subject: mark.subject,
      score: mark.score,
      rank: index + 1
    }));

    subjectTops[subject] = topPerformers;
  });

  return subjectTops;
}

/**
 * Generate complete leaderboard data
 */
export function generateLeaderboard(marks: ApprovedMark[]): LeaderboardData {
  return {
    schoolTopStudents: getSchoolTopStudents(marks, 10),
    classTops: getClassTopStudents(marks, 5),
    subjectTops: getSubjectTopStudents(marks, 5)
  };
}

/**
 * Get student's rank in their class
 */
export function getStudentClassRank(marks: ApprovedMark[], studentId: string): {
  rank: number;
  totalStudents: number;
  className: string;
  averageScore: number;
} | null {
  // Find student's class
  const studentMark = marks.find(m => m.studentId === studentId);
  if (!studentMark) return null;

  const className = studentMark.className;
  
  // Get all students in the class
  const classMarks = marks.filter(m => m.className === className);
  const classStudents = calculateStudentAverages(classMarks);
  
  // Find student's position
  const student = classStudents.find(s => s.studentId === studentId);
  if (!student) return null;

  return {
    rank: student.rank || 0,
    totalStudents: classStudents.length,
    className: className,
    averageScore: student.averageScore
  };
}

/**
 * Get performance badge based on rank
 */
export function getPerformanceBadge(rank: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (rank === 1) {
    return {
      label: 'Top Performer',
      color: 'bg-yellow-500',
      icon: '🏆'
    };
  } else if (rank === 2) {
    return {
      label: 'Excellent',
      color: 'bg-gray-400',
      icon: '🥈'
    };
  } else if (rank === 3) {
    return {
      label: 'Outstanding',
      color: 'bg-orange-600',
      icon: '🥉'
    };
  } else if (rank <= 5) {
    return {
      label: 'High Achiever',
      color: 'bg-blue-500',
      icon: '⭐'
    };
  } else if (rank <= 10) {
    return {
      label: 'Good Performance',
      color: 'bg-green-500',
      icon: '✨'
    };
  } else {
    return {
      label: 'Keep Going',
      color: 'bg-gray-500',
      icon: '💪'
    };
  }
}