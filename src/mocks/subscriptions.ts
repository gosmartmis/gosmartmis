import type { SubscriptionPlan, SchoolSubscription, PaymentRecord } from '../types/subscription';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'nursery-yearly',
    name: 'Nursery Package',
    package: 'nursery',
    price: 170000,
    billingCycle: 'yearly',
    features: [
      'Student enrollment & management',
      'Attendance tracking',
      'Parent communication',
      'Basic reporting',
      'Unlimited teachers',
      'Nursery curriculum support'
    ]
  },
  {
    id: 'primary-yearly',
    name: 'Primary Package',
    package: 'primary',
    price: 230000,
    billingCycle: 'yearly',
    features: [
      'Student enrollment & management',
      'Marks entry & approval workflow',
      'Attendance tracking',
      'Timetable management',
      'Parent communication',
      'Financial management',
      'Advanced reporting',
      'Academic risk alerts',
      'Unlimited teachers'
    ]
  },
  {
    id: 'nursery-primary-yearly',
    name: 'Nursery + Primary Package',
    package: 'nursery-primary',
    price: 360000,
    billingCycle: 'yearly',
    features: [
      'All Nursery features',
      'All Primary features',
      'Unified student management',
      'Cross-level reporting',
      'Complete school management',
      '10% discount included'
    ]
  },
  {
    id: 'nursery-3years',
    name: 'Nursery Package (3 Years)',
    package: 'nursery',
    price: 459000,
    billingCycle: '3-years',
    features: [
      'All Nursery Package features',
      '10% discount for 3-year payment',
      'Priority support',
      'Free system updates'
    ]
  },
  {
    id: 'primary-3years',
    name: 'Primary Package (3 Years)',
    package: 'primary',
    price: 621000,
    billingCycle: '3-years',
    features: [
      'All Primary Package features',
      '10% discount for 3-year payment',
      'Priority support',
      'Free system updates'
    ]
  },
  {
    id: 'nursery-primary-3years',
    name: 'Nursery + Primary Package (3 Years)',
    package: 'nursery-primary',
    price: 972000,
    billingCycle: '3-years',
    features: [
      'All Nursery + Primary features',
      '10% discount for 3-year payment',
      'Priority support',
      'Free system updates',
      'Dedicated account manager'
    ]
  },
  {
    id: 'demo',
    name: 'Demo Plan',
    package: 'demo',
    price: 0,
    billingCycle: 'yearly',
    features: [
      'Basic student management',
      'Limited to 50 students',
      '30-day trial period',
      'Basic attendance tracking',
      'Limited reporting'
    ],
    limitations: {
      maxStudents: 50,
      duration: 30,
      disabledModules: ['finance', 'advanced-reports', 'payroll', 'tax-management']
    }
  }
];

export const schoolSubscriptions: SchoolSubscription[] = [
  {
    id: 'sub-001',
    schoolId: 'elite',
    schoolName: 'Elite School',
    package: 'nursery-primary',
    status: 'active',
    billingCycle: 'yearly',
    startDate: '2024-01-15',
    expiryDate: '2025-01-14',
    amount: 400000,
    discount: 40000,
    totalPaid: 360000,
    lastPaymentDate: '2024-01-15',
    nextPaymentDate: '2025-01-15',
    studentCount: 450,
    autoRenew: true
  },
  {
    id: 'sub-002',
    schoolId: 'future',
    schoolName: 'Future Bright Academy',
    package: 'primary',
    status: 'active',
    billingCycle: '3-years',
    startDate: '2023-09-01',
    expiryDate: '2026-08-31',
    amount: 690000,
    discount: 69000,
    totalPaid: 621000,
    lastPaymentDate: '2023-09-01',
    nextPaymentDate: '2026-09-01',
    studentCount: 320,
    autoRenew: false
  },
  {
    id: 'sub-003',
    schoolId: 'sunrise',
    schoolName: 'Sunrise Nursery School',
    package: 'nursery',
    status: 'active',
    billingCycle: 'yearly',
    startDate: '2024-02-01',
    expiryDate: '2025-01-31',
    amount: 170000,
    discount: 0,
    totalPaid: 170000,
    lastPaymentDate: '2024-02-01',
    nextPaymentDate: '2025-02-01',
    studentCount: 85,
    autoRenew: true
  },
  {
    id: 'sub-004',
    schoolId: 'wisdom',
    schoolName: 'Wisdom Academy',
    package: 'demo',
    status: 'trial',
    billingCycle: 'yearly',
    startDate: '2024-12-01',
    expiryDate: '2024-12-31',
    amount: 0,
    discount: 0,
    totalPaid: 0,
    lastPaymentDate: '',
    nextPaymentDate: '',
    studentCount: 35,
    maxStudents: 50,
    disabledModules: ['finance', 'advanced-reports', 'payroll', 'tax-management'],
    autoRenew: false
  },
  {
    id: 'sub-005',
    schoolId: 'excellence',
    schoolName: 'Excellence Primary School',
    package: 'primary',
    status: 'expired',
    billingCycle: 'yearly',
    startDate: '2023-03-15',
    expiryDate: '2024-03-14',
    amount: 230000,
    discount: 0,
    totalPaid: 230000,
    lastPaymentDate: '2023-03-15',
    nextPaymentDate: '2024-03-15',
    studentCount: 280,
    autoRenew: false
  },
  {
    id: 'sub-006',
    schoolId: 'hope',
    schoolName: 'Hope International School',
    package: 'nursery-primary',
    status: 'active',
    billingCycle: '3-years',
    startDate: '2024-01-01',
    expiryDate: '2026-12-31',
    amount: 1080000,
    discount: 108000,
    totalPaid: 972000,
    lastPaymentDate: '2024-01-01',
    nextPaymentDate: '2027-01-01',
    studentCount: 520,
    autoRenew: true
  },
  {
    id: 'sub-007',
    schoolId: 'bright',
    schoolName: 'Bright Stars Academy',
    package: 'demo',
    status: 'expired',
    billingCycle: 'yearly',
    startDate: '2024-10-15',
    expiryDate: '2024-11-14',
    amount: 0,
    discount: 0,
    totalPaid: 0,
    lastPaymentDate: '',
    nextPaymentDate: '',
    studentCount: 48,
    maxStudents: 50,
    disabledModules: ['finance', 'advanced-reports', 'payroll', 'tax-management'],
    autoRenew: false
  },
  {
    id: 'sub-008',
    schoolId: 'victory',
    schoolName: 'Victory Primary School',
    package: 'primary',
    status: 'suspended',
    billingCycle: 'yearly',
    startDate: '2024-04-01',
    expiryDate: '2025-03-31',
    amount: 230000,
    discount: 0,
    totalPaid: 115000,
    lastPaymentDate: '2024-04-01',
    nextPaymentDate: '2024-10-01',
    studentCount: 195,
    autoRenew: false
  }
];

export const paymentRecords: PaymentRecord[] = [
  {
    id: 'pay-001',
    schoolId: 'elite',
    subscriptionId: 'sub-001',
    amount: 360000,
    paymentDate: '2024-01-15',
    paymentMethod: 'Bank Transfer',
    transactionId: 'TXN-2024-001-ELITE',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-002',
    schoolId: 'future',
    subscriptionId: 'sub-002',
    amount: 621000,
    paymentDate: '2023-09-01',
    paymentMethod: 'Mobile Money',
    transactionId: 'TXN-2023-045-FUTURE',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-003',
    schoolId: 'sunrise',
    subscriptionId: 'sub-003',
    amount: 170000,
    paymentDate: '2024-02-01',
    paymentMethod: 'Bank Transfer',
    transactionId: 'TXN-2024-012-SUNRISE',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-004',
    schoolId: 'excellence',
    subscriptionId: 'sub-005',
    amount: 230000,
    paymentDate: '2023-03-15',
    paymentMethod: 'Mobile Money',
    transactionId: 'TXN-2023-018-EXCELLENCE',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-005',
    schoolId: 'hope',
    subscriptionId: 'sub-006',
    amount: 972000,
    paymentDate: '2024-01-01',
    paymentMethod: 'Bank Transfer',
    transactionId: 'TXN-2024-002-HOPE',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-006',
    schoolId: 'victory',
    subscriptionId: 'sub-008',
    amount: 115000,
    paymentDate: '2024-04-01',
    paymentMethod: 'Mobile Money',
    transactionId: 'TXN-2024-032-VICTORY',
    status: 'completed',
    receiptUrl: '#'
  },
  {
    id: 'pay-007',
    schoolId: 'victory',
    subscriptionId: 'sub-008',
    amount: 115000,
    paymentDate: '2024-10-01',
    paymentMethod: 'Mobile Money',
    transactionId: 'TXN-2024-098-VICTORY',
    status: 'pending',
    receiptUrl: '#'
  }
];