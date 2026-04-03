export type SubscriptionPackage = 'nursery' | 'primary' | 'nursery-primary' | 'demo';

export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'suspended' | 'cancelled';

export type BillingCycle = 'yearly' | '3-years';

export interface SubscriptionPlan {
  id: string;
  name: string;
  package: SubscriptionPackage;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  limitations?: {
    maxStudents?: number;
    duration?: number; // days
    disabledModules?: string[];
  };
}

export interface SchoolSubscription {
  id: string;
  schoolId: string;
  schoolName: string;
  package: SubscriptionPackage;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  expiryDate: string;
  amount: number;
  discount: number;
  totalPaid: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  studentCount: number;
  maxStudents?: number;
  disabledModules?: string[];
  autoRenew: boolean;
}

export interface PaymentRecord {
  id: string;
  schoolId: string;
  subscriptionId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
}