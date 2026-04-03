/**
 * Fee Balance Checker Utility
 * Provides functions to check student fee balances and report card access status
 */

export interface StudentFeeBalance {
  studentId: string;
  studentName: string;
  studentCode: string;
  class: string;
  totalFees: number;
  paid: number;
  balance: number;
  reportCardLocked: boolean;
}

/**
 * Check if a student's report card should be locked based on fee balance
 * @param balance - Current fee balance
 * @returns true if report card should be locked (balance > 0), false otherwise
 */
export const isReportCardLocked = (balance: number): boolean => {
  return balance > 0;
};

/**
 * Get student balance and report card access status
 * @param studentId - Student ID
 * @returns Student fee balance information
 */
export const getStudentBalance = (studentId: string): StudentFeeBalance | null => {
  // This would typically fetch from database
  // For now, returning mock data structure
  const mockBalances: Record<string, StudentFeeBalance> = {
    'STU-001': {
      studentId: 'STU-001',
      studentName: 'Jean Baptiste Nkurunziza',
      studentCode: 'EPS2025001',
      class: 'S6 MCB',
      totalFees: 175000,
      paid: 150000,
      balance: 25000,
      reportCardLocked: true
    },
    'STU-002': {
      studentId: 'STU-002',
      studentName: 'Marie Claire Uwase',
      studentCode: 'EPS2025002',
      class: 'S5 PCM',
      totalFees: 175000,
      paid: 175000,
      balance: 0,
      reportCardLocked: false
    }
  };

  return mockBalances[studentId] || null;
};

/**
 * Check balances for an entire class
 * @param className - Class name (e.g., "S6 MCB")
 * @returns Array of student fee balances for the class
 */
export const getClassBalances = (className: string): StudentFeeBalance[] => {
  // This would typically fetch from database
  // For now, returning mock data
  const allBalances: StudentFeeBalance[] = [
    {
      studentId: 'STU-001',
      studentName: 'Jean Baptiste Nkurunziza',
      studentCode: 'EPS2025001',
      class: 'S6 MCB',
      totalFees: 175000,
      paid: 150000,
      balance: 25000,
      reportCardLocked: true
    },
    {
      studentId: 'STU-002',
      studentName: 'Marie Claire Uwase',
      studentCode: 'EPS2025002',
      class: 'S5 PCM',
      totalFees: 175000,
      paid: 175000,
      balance: 0,
      reportCardLocked: false
    },
    {
      studentId: 'STU-003',
      studentName: 'Patrick Habimana',
      studentCode: 'EPS2025003',
      class: 'S4 MEG',
      totalFees: 140000,
      paid: 120000,
      balance: 20000,
      reportCardLocked: true
    }
  ];

  return allBalances.filter(balance => balance.class === className);
};

/**
 * Get all students with locked report cards
 * @returns Array of students with outstanding balances
 */
export const getStudentsWithLockedReportCards = (): StudentFeeBalance[] => {
  // This would typically fetch from database
  const allBalances: StudentFeeBalance[] = [
    {
      studentId: 'STU-001',
      studentName: 'Jean Baptiste Nkurunziza',
      studentCode: 'EPS2025001',
      class: 'S6 MCB',
      totalFees: 175000,
      paid: 150000,
      balance: 25000,
      reportCardLocked: true
    },
    {
      studentId: 'STU-003',
      studentName: 'Patrick Habimana',
      studentCode: 'EPS2025003',
      class: 'S4 MEG',
      totalFees: 140000,
      paid: 120000,
      balance: 20000,
      reportCardLocked: true
    },
    {
      studentId: 'STU-004',
      studentName: 'Grace Mutesi',
      studentCode: 'EPS2025004',
      class: 'S6 HEG',
      totalFees: 175000,
      paid: 0,
      balance: 175000,
      reportCardLocked: true
    },
    {
      studentId: 'STU-007',
      studentName: 'David Niyonzima',
      studentCode: 'EPS2025007',
      class: 'S2 Ordinary',
      totalFees: 115000,
      paid: 50000,
      balance: 65000,
      reportCardLocked: true
    },
    {
      studentId: 'STU-008',
      studentName: 'Sarah Mukamana',
      studentCode: 'EPS2025008',
      class: 'S1 Ordinary',
      totalFees: 115000,
      paid: 0,
      balance: 115000,
      reportCardLocked: true
    }
  ];

  return allBalances.filter(balance => balance.reportCardLocked);
};

/**
 * Record payment and check if report card should be unlocked
 * @param studentId - Student ID
 * @param paymentAmount - Payment amount
 * @returns Object with unlock status and new balance
 */
export const recordPaymentAndCheckUnlock = (
  studentId: string,
  paymentAmount: number
): { unlocked: boolean; newBalance: number; previousBalance: number } => {
  const student = getStudentBalance(studentId);
  
  if (!student) {
    return { unlocked: false, newBalance: 0, previousBalance: 0 };
  }

  const previousBalance = student.balance;
  const newBalance = Math.max(0, previousBalance - paymentAmount);
  const unlocked = previousBalance > 0 && newBalance === 0;

  return {
    unlocked,
    newBalance,
    previousBalance
  };
};

/**
 * Generate fee balance report for students with locked report cards
 * @returns Report data with statistics
 */
export const generateLockedReportCardsReport = () => {
  const lockedStudents = getStudentsWithLockedReportCards();
  
  const totalOutstanding = lockedStudents.reduce((sum, student) => sum + student.balance, 0);
  const averageBalance = lockedStudents.length > 0 ? totalOutstanding / lockedStudents.length : 0;

  return {
    totalStudents: lockedStudents.length,
    totalOutstanding,
    averageBalance,
    students: lockedStudents,
    byClass: lockedStudents.reduce((acc, student) => {
      if (!acc[student.class]) {
        acc[student.class] = {
          count: 0,
          totalOutstanding: 0
        };
      }
      acc[student.class].count++;
      acc[student.class].totalOutstanding += student.balance;
      return acc;
    }, {} as Record<string, { count: number; totalOutstanding: number }>)
  };
};