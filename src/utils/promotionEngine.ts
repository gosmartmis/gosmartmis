import type { StudentPromotionData, ClassDistribution } from '../types/promotion';

/**
 * Determines promotion status based on average score
 */
export const determinePromotionStatus = (
  averageScore: number
): 'promoted' | 'repeat' | 'conditional' => {
  if (averageScore >= 60) return 'promoted';
  if (averageScore >= 50) return 'conditional';
  return 'repeat';
};

/**
 * Gets the next class level
 */
export const getNextClass = (currentClass: string): string | null => {
  const classMap: Record<string, string[]> = {
    'Nursery 1': ['Nursery 2'],
    'Nursery 2': ['Nursery 3'],
    'Nursery 3': ['P1A', 'P1B'],
    'P1A': ['P2A', 'P2B'],
    'P1B': ['P2A', 'P2B'],
    'P2A': ['P3A', 'P3B'],
    'P2B': ['P3A', 'P3B'],
    'P3A': ['P4A', 'P4B'],
    'P3B': ['P4A', 'P4B'],
    'P4A': ['P5A', 'P5B'],
    'P4B': ['P5A', 'P5B'],
    'P5A': ['P6A', 'P6B'],
    'P5B': ['P6A', 'P6B'],
    'P6A': ['S1A', 'S1B'],
    'P6B': ['S1A', 'S1B'],
  };

  return classMap[currentClass] || null;
};

/**
 * Categorizes student performance level
 */
const getPerformanceLevel = (
  score: number
): 'high' | 'medium' | 'low' => {
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

/**
 * Intelligent class distribution algorithm
 * Balances gender, performance, and student count across parallel classes
 */
export const distributeStudentsToClasses = (
  students: StudentPromotionData[],
  targetClasses: string[]
): ClassDistribution[] => {
  // Initialize class distributions
  const distributions: ClassDistribution[] = targetClasses.map(className => ({
    class_name: className,
    total_students: 0,
    boys: 0,
    girls: 0,
    avg_performance: 0,
    high_performers: 0,
    medium_performers: 0,
    low_performers: 0,
    students: [],
  }));

  // Sort students by performance (high to low) for balanced distribution
  const sortedStudents = [...students].sort((a, b) => b.average_score - a.average_score);

  // Separate by gender
  const boys = sortedStudents.filter(s => s.gender === 'male');
  const girls = sortedStudents.filter(s => s.gender === 'female');

  // Distribute boys in round-robin fashion
  boys.forEach((student, index) => {
    const classIndex = index % targetClasses.length;
    const performanceLevel = getPerformanceLevel(student.average_score);
    
    distributions[classIndex].students.push({
      ...student,
      next_class: targetClasses[classIndex],
    });
    distributions[classIndex].boys++;
    distributions[classIndex].total_students++;
    
    if (performanceLevel === 'high') distributions[classIndex].high_performers++;
    else if (performanceLevel === 'medium') distributions[classIndex].medium_performers++;
    else distributions[classIndex].low_performers++;
  });

  // Distribute girls in round-robin fashion
  girls.forEach((student, index) => {
    const classIndex = index % targetClasses.length;
    const performanceLevel = getPerformanceLevel(student.average_score);
    
    distributions[classIndex].students.push({
      ...student,
      next_class: targetClasses[classIndex],
    });
    distributions[classIndex].girls++;
    distributions[classIndex].total_students++;
    
    if (performanceLevel === 'high') distributions[classIndex].high_performers++;
    else if (performanceLevel === 'medium') distributions[classIndex].medium_performers++;
    else distributions[classIndex].low_performers++;
  });

  // Calculate average performance for each class
  distributions.forEach(dist => {
    if (dist.students.length > 0) {
      const totalScore = dist.students.reduce((sum, s) => sum + s.average_score, 0);
      dist.avg_performance = Math.round(totalScore / dist.students.length);
    }
  });

  return distributions;
};

/**
 * Generates promotion preview for all students
 */
export const generatePromotionPreview = (
  students: StudentPromotionData[]
): {
  promoted: StudentPromotionData[];
  repeat: StudentPromotionData[];
  conditional: StudentPromotionData[];
} => {
  const promoted: StudentPromotionData[] = [];
  const repeat: StudentPromotionData[] = [];
  const conditional: StudentPromotionData[] = [];

  students.forEach(student => {
    const status = determinePromotionStatus(student.average_score);
    const nextClasses = getNextClass(student.current_class);

    if (status === 'promoted' && nextClasses) {
      promoted.push({
        ...student,
        promotion_status: 'promoted',
        next_class: Array.isArray(nextClasses) ? nextClasses[0] : nextClasses,
      });
    } else if (status === 'conditional') {
      conditional.push({
        ...student,
        promotion_status: 'conditional',
        reason: 'Average score between 50-59%. Requires improvement.',
      });
    } else {
      repeat.push({
        ...student,
        promotion_status: 'repeat',
        reason: 'Average score below 50%. Must repeat current class.',
      });
    }
  });

  return { promoted, repeat, conditional };
};